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

/**
 * Add synced column to local DB if it doesn't exist
 */
async function ensureSyncedColumn() {
  const localDb = await ensureDB();
  try {
    localDb.exec("SELECT synced FROM transactions LIMIT 1");
  } catch {
    // Column doesn't exist, add it
    localDb.run("ALTER TABLE transactions ADD COLUMN synced INTEGER DEFAULT 0");
    saveDB();
  }
}

/**
 * Sync local changes to Supabase
 */
async function pushToSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();

  if (!session?.user) {
    console.log("Not authenticated, skipping push");
    return;
  }

  try {
    // Get all unsynced rows
    const res = localDb.exec(
      "SELECT id, type, amount, category_id, date, note, created_at FROM transactions WHERE synced = 0"
    );

    if (!res[0]) return; // No unsynced rows

    const { columns, values } = res[0] as { columns: string[]; values: any[][] };
    const transactions = values.map((row: any[]) =>
      Object.fromEntries(columns.map((col, idx) => [col, row[idx]]))
    );

    if (transactions.length === 0) return;

    // Upsert to Supabase
    const { error } = await supabase.from("transactions").upsert(
      transactions.map((t) => ({
        id: t.id,
        user_id: session.user.id,
        type: t.type,
        amount: t.amount / 100, // Convert back from cents
        category_id: t.category_id,
        date: t.date,
        note: t.note,
        created_at: t.created_at,
      })),
      { onConflict: "id,user_id" }
    );

    if (error) {
      console.error("Upsert error:", error);
      return;
    }

    // Mark as synced locally
    const ids = transactions.map((t) => t.id).join(",");
    localDb.run(`UPDATE transactions SET synced = 1 WHERE id IN (${ids})`);
    saveDB();

    console.log(`Pushed ${transactions.length} transactions to Supabase`);
  } catch (error) {
    console.error("Push error:", error);
  }
}

/**
 * Pull all transactions from Supabase for current user
 */
async function pullFromSupabase() {
  const localDb = await ensureDB();
  const session = await getSession();

  if (!session?.user) {
    console.log("Not authenticated, skipping pull");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Pull error:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("No transactions from Supabase");
      return;
    }

    // INSERT OR REPLACE each row
    const stmt = localDb.prepare(`
      INSERT OR REPLACE INTO transactions (id, user_id, type, amount, category_id, date, note, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const t of data) {
      stmt.run([
        t.id,
        t.user_id,
        t.type,
        Math.round(t.amount * 100), // Store as cents
        t.category_id,
        t.date,
        t.note,
        t.created_at,
        1, // Mark as synced
      ]);
    }

    saveDB();
    console.log(`Pulled ${data.length} transactions from Supabase`);
  } catch (error) {
    console.error("Pull error:", error);
  }
}

/**
 * Full sync: push unsynced, then pull from Supabase
 */
export async function syncToSupabase() {
  // Check if online
  if (!navigator.onLine) {
    console.log("Offline, skipping sync");
    return;
  }

  const session = await getSession();
  if (!session?.user) {
    console.log("Not authenticated, skipping sync");
    return;
  }

  // Ensure synced column exists
  await ensureSyncedColumn();

  // Push local changes
  await pushToSupabase();

  // Pull from Supabase
  await pullFromSupabase();

  console.log("Sync complete");
}

/**
 * Sync on app load if authenticated
 */
export async function syncOnLoad() {
  const session = await getSession();
  if (session?.user) {
    await syncToSupabase();
  }
}

/**
 * Set up online/offline listeners
 */
export function setupSyncListeners() {
  window.addEventListener("online", () => {
    console.log("Back online, syncing...");
    syncToSupabase();
  });

  window.addEventListener("offline", () => {
    console.log("Offline");
  });
}
