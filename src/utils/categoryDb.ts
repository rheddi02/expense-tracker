import { initDB, saveDB } from "./db";
import { SYSTEM_CATEGORY_IDS } from "@/lib/constants";

export type StoredCategory = {
  id: string;
  user_id?: string | null;
  label: string;
  type: "income" | "expense";
  is_system: number;
  synced: number;
  deleted: number;
  sort_order: number;
  created_at: string;
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getCategories({ user_id }: { user_id?: string } = {}): Promise<StoredCategory[]> {
  const db = await initDB();
  let query =
    "SELECT id, user_id, label, type, is_system, synced, deleted, sort_order, created_at FROM categories WHERE (deleted = 0 OR deleted IS NULL)";
  const params: string[] = [];
  if (user_id) {
    query += " AND (user_id = ? OR user_id IS NULL)";
    params.push(user_id);
  }
  query += " ORDER BY sort_order ASC, created_at ASC";

  const res = db.exec(query, params);
  if (!res[0]) return [];

  const { columns, values } = res[0] as { columns: string[]; values: unknown[][] };
  return values.map((row) => {
    const r = Object.fromEntries(columns.map((col, i) => [col, row[i]])) as Record<string, unknown>;
    return {
      id: String(r.id),
      user_id: (r.user_id as string | null) ?? null,
      label: String(r.label),
      type: r.type as "income" | "expense",
      is_system: Number(r.is_system ?? 0),
      synced: Number(r.synced ?? 0),
      deleted: Number(r.deleted ?? 0),
      sort_order: Number(r.sort_order ?? 0),
      created_at: String(r.created_at),
    } satisfies StoredCategory;
  });
}

export async function addCategory(data: {
  user_id?: string | null;
  label: string;
  type: "income" | "expense";
}): Promise<{ id: string }> {
  const db = await initDB();
  const id = generateId();
  const maxRes = db.exec(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories WHERE type = ? AND (deleted = 0 OR deleted IS NULL)",
    [data.type]
  );
  const nextOrder = (maxRes[0]?.values[0]?.[0] as number) ?? 0;
  db.run(
    "INSERT INTO categories (id, user_id, label, type, is_system, synced, deleted, sort_order, created_at) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?)",
    [id, data.user_id ?? null, data.label.trim(), data.type, nextOrder, new Date().toISOString()]
  );
  saveDB();
  return { id };
}

export async function reorderCategory(id: string, direction: "up" | "down"): Promise<void> {
  const db = await initDB();
  const typeRes = db.exec("SELECT type FROM categories WHERE id = ?", [id]);
  if (!typeRes[0]?.values?.length) return;
  const type = typeRes[0].values[0][0] as string;

  const res = db.exec(
    "SELECT id, sort_order FROM categories WHERE type = ? AND (deleted = 0 OR deleted IS NULL) ORDER BY sort_order ASC, created_at ASC",
    [type]
  );
  if (!res[0]) return;

  const rows = res[0].values.map((row: unknown[]) => ({ id: row[0] as string, sort_order: row[1] as number }));
  const idx = rows.findIndex((r: { id: string }) => r.id === id);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];
  db.run("UPDATE categories SET sort_order = ?, synced = 0 WHERE id = ?", [b.sort_order, a.id]);
  db.run("UPDATE categories SET sort_order = ?, synced = 0 WHERE id = ?", [a.sort_order, b.id]);
  saveDB();
}

export async function updateCategory(id: string, label: string): Promise<void> {
  if (SYSTEM_CATEGORY_IDS.has(id)) return;
  const db = await initDB();
  db.run("UPDATE categories SET label = ?, synced = 0 WHERE id = ? AND is_system = 0", [label.trim(), id]);
  saveDB();
}

export async function setCategoryOrder(ids: string[]): Promise<void> {
  const db = await initDB();
  ids.forEach((id, index) => {
    db.run("UPDATE categories SET sort_order = ?, synced = 0 WHERE id = ?", [index, id]);
  });
  saveDB();
}

export async function deleteCategory(id: string): Promise<void> {
  if (SYSTEM_CATEGORY_IDS.has(id)) return;
  const db = await initDB();
  db.run("UPDATE categories SET deleted = 1, synced = 0 WHERE id = ? AND is_system = 0", [id]);
  saveDB();
}
