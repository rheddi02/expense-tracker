import { supabase } from "../lib/supabase";
import { initDB, saveDB } from "../utils/db";
import { getSession } from "../auth/authService";
import { getCategories } from "../utils/categoryDb";

let db: any = null;

async function ensureDB() {
  if (!db) db = await initDB();
  return db;
}

async function pushCategoriesToSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();
  if (!session?.user) return;

  try {
    // Phase 1: hard-delete from Supabase rows marked deleted locally
    const deleteRes = localDb.exec("SELECT id FROM categories WHERE deleted = 1");
    if (deleteRes[0]?.values?.length > 0) {
      const deleteIds = deleteRes[0].values.map((row: any[]) => row[0] as string);
      const { error } = await supabase.from("categories").delete().in("id", deleteIds);
      if (!error) {
        const placeholders = deleteIds.map(() => "?").join(",");
        localDb.run(`DELETE FROM categories WHERE id IN (${placeholders})`, deleteIds);
        saveDB();
      }
    }

    // Phase 2: upsert unsynced rows
    const res = localDb.exec(
      "SELECT id, label, type, is_system, created_at FROM categories WHERE synced = 0 AND (deleted = 0 OR deleted IS NULL)"
    );
    if (!res[0]) return;

    const { columns, values } = res[0] as { columns: string[]; values: any[][] };
    const rows = values.map((row: any[]) =>
      Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
    if (rows.length === 0) return;

    const { error } = await supabase.from("categories").upsert(
      rows.map((r) => ({
        id: r.id,
        user_id: session.user.id,
        label: r.label,
        type: r.type,
        is_system: r.is_system,
        created_at: r.created_at,
      })),
      { onConflict: "id" }
    );

    if (error) {
      console.error("Category upsert error:", error);
      return;
    }

    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    localDb.run(`UPDATE categories SET synced = 1 WHERE id IN (${placeholders})`, ids);
    saveDB();
  } catch (error) {
    console.error("Category push error:", error);
  }
}

async function pullCategoriesFromSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();
  if (!session?.user) return;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id);

    if (error || !data || data.length === 0) return;

    const stmt = localDb.prepare(`
      INSERT OR REPLACE INTO categories (id, user_id, label, type, is_system, synced, deleted, created_at)
      VALUES (?, ?, ?, ?, ?, 1, 0, ?)
    `);

    for (const c of data) {
      stmt.run([c.id, c.user_id, c.label, c.type, c.is_system ?? 0, c.created_at]);
    }

    saveDB();
  } catch (error) {
    console.error("Category pull error:", error);
  }
}

let syncing = false;

export async function syncCategoriesToSupabase() {
  if (syncing) return null;
  if (!navigator.onLine) return null;

  const session = await getSession();
  if (!session?.user) return null;

  syncing = true;
  try {
    await pushCategoriesToSupabase();
    await pullCategoriesFromSupabase();
    return await getCategories({ user_id: session.user.id });
  } finally {
    syncing = false;
  }
}
