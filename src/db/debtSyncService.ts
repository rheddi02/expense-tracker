import { supabase } from "../lib/supabase";
import { initDB, saveDB } from "../utils/db";
import { getSession } from "../auth/authService";

let db: any = null;

async function ensureDB() {
  if (!db) {
    db = await initDB();
  }
  return db;
}

async function pushDebtsToSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();

  if (!session?.user) return;

  try {
    // Phase 1: push pending deletions
    const deleteRes = localDb.exec("SELECT id FROM debts WHERE deleted = 1");
    if (deleteRes[0]?.values?.length > 0) {
      const deleteIds = deleteRes[0].values.map((row: any[]) => row[0] as string);
      const { error: deleteError } = await supabase
        .from("debts")
        .delete()
        .in("id", deleteIds);
      if (!deleteError) {
        const placeholders = deleteIds.map(() => "?").join(",");
        localDb.run(`DELETE FROM debts WHERE id IN (${placeholders})`, deleteIds);
        saveDB();
      }
    }

    // Phase 2: push unsynced rows
    const res = localDb.exec(
      "SELECT id, person_name, amount, type, category, borrow_date, payment_date, is_settled, settled_amount, offset_ref_id, note, created_at FROM debts WHERE synced = 0 AND (deleted = 0 OR deleted IS NULL)"
    );
    if (!res[0]) return;

    const { columns, values } = res[0] as { columns: string[]; values: any[][] };
    const debts = values.map((row: any[]) =>
      Object.fromEntries(columns.map((col, idx) => [col, row[idx]]))
    );
    if (debts.length === 0) return;

    const { error } = await supabase.from("debts").upsert(
      debts.map((d) => ({
        id: d.id,
        user_id: session.user.id,
        person_name: d.person_name,
        amount: d.amount / 100,
        type: d.type,
        borrow_date: d.borrow_date,
        payment_date: d.payment_date ?? null,
        is_settled: d.is_settled === 1,
        settled_amount: (d.settled_amount ?? 0) / 100,
        offset_ref_id: d.offset_ref_id ?? null,
        category: d.category ?? 'cash',
        note: d.note ?? null,
        created_at: d.created_at,
      })),
      { onConflict: "id" }
    );

    if (error) {
      console.error("Debt upsert error:", error);
      return;
    }

    const ids = debts.map((d) => d.id);
    const placeholders = ids.map(() => "?").join(",");
    localDb.run(`UPDATE debts SET synced = 1 WHERE id IN (${placeholders})`, ids);
    saveDB();
  } catch (error) {
    console.error("Debt push error:", error);
  }
}

async function pullDebtsFromSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();

  if (!session?.user) return;

  try {
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id);

    if (error || !data || data.length === 0) return;

    const stmt = localDb.prepare(`
      INSERT OR REPLACE INTO debts (id, user_id, person_name, amount, type, category, borrow_date, payment_date, is_settled, settled_amount, offset_ref_id, note, created_at, synced, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `);

    for (const d of data) {
      stmt.run([
        d.id,
        d.user_id,
        d.person_name,
        Math.round(d.amount * 100),
        d.type,
        d.category ?? 'cash',
        d.borrow_date,
        d.payment_date ?? null,
        d.is_settled ? 1 : 0,
        Math.round((d.settled_amount ?? 0) * 100),
        d.offset_ref_id ?? null,
        d.note ?? null,
        d.created_at,
      ]);
    }

    saveDB();
  } catch (error) {
    console.error("Debt pull error:", error);
  }
}

export async function syncDebtsToSupabase() {
  if (!navigator.onLine) return null;

  const session = await getSession();
  if (!session?.user) return null;

  await pushDebtsToSupabase();
  await pullDebtsFromSupabase();

  const { getDebts } = await import('../utils/debtsDb');
  return await getDebts({ user_id: session.user.id });
}
