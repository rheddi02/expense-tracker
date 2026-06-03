import { initDB, saveDB } from "./db";
import type { StoredDebt } from "./debtsSchema";

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function addDebt(data: {
  user_id?: string;
  person_name: string;
  amount: number;
  type: 'lent' | 'borrowed';
  category?: 'cash' | 'digital';
  borrow_date: string;
  payment_date?: string | null;
  note?: string | null;
}) {
  const db = await initDB();
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO debts (id, user_id, person_name, amount, type, category, borrow_date, payment_date, note, created_at, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  stmt.run([
    id,
    data.user_id ?? null,
    data.person_name,
    Math.round(data.amount * 100),
    data.type,
    data.category ?? 'cash',
    data.borrow_date,
    data.payment_date ?? null,
    data.note ?? null,
    new Date().toISOString(),
  ]);
  saveDB();
  return { id };
}

export async function getDebts({ user_id }: { user_id?: string } = {}): Promise<StoredDebt[]> {
  const db = await initDB();
  let query = "SELECT id, user_id, person_name, amount, type, category, borrow_date, payment_date, is_settled, settled_amount, offset_ref_id, note, created_at FROM debts WHERE (deleted = 0 OR deleted IS NULL)";
  const params: any[] = [];
  if (user_id) {
    query += " AND user_id = ?";
    params.push(user_id);
  }
  query += " ORDER BY created_at DESC";

  const res = db.exec(query, params);
  if (!res[0]) return [];

  const { columns, values } = res[0] as { columns: string[]; values: any[][] };
  return values.map((row) => {
    const record = Object.fromEntries(columns.map((col, i) => [col, row[i]])) as any;
    return {
      id: String(record.id),
      user_id: record.user_id ?? null,
      person_name: record.person_name,
      amount: record.amount / 100,
      type: record.type as 'lent' | 'borrowed',
      borrow_date: record.borrow_date,
      payment_date: record.payment_date ?? null,
      is_settled: record.is_settled ?? 0,
      settled_amount: (record.settled_amount ?? 0) / 100,
      offset_ref_id: record.offset_ref_id ?? null,
      category: (record.category ?? 'cash') as 'cash' | 'digital',
      note: record.note ?? null,
      created_at: record.created_at,
    } satisfies StoredDebt;
  });
}

export async function updateDebt(id: string, data: {
  person_name: string;
  amount: number;
  type: 'lent' | 'borrowed';
  category?: 'cash' | 'digital';
  borrow_date: string;
  payment_date?: string | null;
  note?: string | null;
}) {
  const db = await initDB();
  db.run(
    `UPDATE debts SET person_name = ?, amount = ?, type = ?, category = ?, borrow_date = ?, payment_date = ?, note = ?, synced = 0 WHERE id = ?`,
    [
      data.person_name,
      Math.round(data.amount * 100),
      data.type,
      data.category ?? 'cash',
      data.borrow_date,
      data.payment_date ?? null,
      data.note ?? null,
      id,
    ]
  );
  saveDB();
}

export async function settleDebt(id: string) {
  const db = await initDB();
  db.run("UPDATE debts SET is_settled = 1, synced = 0 WHERE id = ?", [id]);
  saveDB();
}

export async function deleteDebt(id: string) {
  const db = await initDB();
  db.run("UPDATE debts SET deleted = 1, synced = 0 WHERE id = ?", [id]);
  saveDB();
}

export async function offsetDebtAgainstAll(debtA: StoredDebt, opposing: StoredDebt[]): Promise<number> {
  const db = await initDB();
  const remainingA = debtA.amount - (debtA.settled_amount ?? 0);
  const totalOpposing = opposing.reduce((s, d) => s + d.amount - (d.settled_amount ?? 0), 0);
  const actualOffset = Math.min(remainingA, totalOpposing);

  let toApply = actualOffset;
  for (const opp of opposing) {
    if (toApply <= 0) break;
    const oppRemaining = opp.amount - (opp.settled_amount ?? 0);
    const chunk = Math.min(toApply, oppRemaining);
    const newSettled = Math.round((opp.settled_amount ?? 0) * 100) + Math.round(chunk * 100);
    const isSettled = newSettled >= Math.round(opp.amount * 100) ? 1 : 0;
    db.run(
      "UPDATE debts SET settled_amount = ?, is_settled = ?, offset_ref_id = ?, synced = 0 WHERE id = ?",
      [newSettled, isSettled, debtA.id, opp.id]
    );
    toApply -= chunk;
  }

  const newSettledA = Math.round((debtA.settled_amount ?? 0) * 100) + Math.round(actualOffset * 100);
  const isSettledA = newSettledA >= Math.round(debtA.amount * 100) ? 1 : 0;
  db.run(
    "UPDATE debts SET settled_amount = ?, is_settled = ?, offset_ref_id = ?, synced = 0 WHERE id = ?",
    [newSettledA, isSettledA, opposing[0].id, debtA.id]
  );

  saveDB();
  return actualOffset;
}
