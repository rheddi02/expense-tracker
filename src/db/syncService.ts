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

async function ensureSyncedColumn() {
  const localDb = await ensureDB();
  try {
    localDb.exec("SELECT synced FROM transactions LIMIT 1");
  } catch {
    localDb.run("ALTER TABLE transactions ADD COLUMN synced INTEGER DEFAULT 0");
    saveDB();
  }
}

async function ensureDeletedColumn() {
  const localDb = await ensureDB();
  try {
    localDb.exec("SELECT deleted FROM transactions LIMIT 1");
  } catch {
    localDb.run("ALTER TABLE transactions ADD COLUMN deleted INTEGER DEFAULT 0");
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
    // Phase 1: push pending deletions to Supabase
    const deleteRes = localDb.exec("SELECT id FROM transactions WHERE deleted = 1");
    if (deleteRes[0]?.values?.length > 0) {
      const deleteIds = deleteRes[0].values.map((row: any[]) => row[0] as number);
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .in("id", deleteIds);
      if (!deleteError) {
        const placeholders = deleteIds.map(() => "?").join(",");
        localDb.run(`DELETE FROM transactions WHERE id IN (${placeholders})`, deleteIds);
        saveDB();
        console.log(`Deleted ${deleteIds.length} transactions from Supabase`);
      } else {
        console.error("Delete sync error:", deleteError);
      }
    }

    // Phase 2: push unsynced rows
    const res = localDb.exec(
      "SELECT id, type, amount, category_id, date, note, created_at FROM transactions WHERE synced = 0 AND (deleted = 0 OR deleted IS NULL)"
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
      { onConflict: "id" }
    );

    if (error) {
      console.error("Upsert error:", error);
      return;
    }

    // Mark as synced locally
    const ids = transactions.map((t) => t.id);
    const placeholders = ids.map(() => "?").join(",");
    localDb.run(`UPDATE transactions SET synced = 1 WHERE id IN (${placeholders})`, ids);
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
  console.log("Starting sync process...");
  
  // Check if online
  if (!navigator.onLine) {
    console.log("Offline, skipping sync");
    return null;
  }

  const session = await getSession();
  if (!session?.user) {
    console.log("Not authenticated, skipping sync");
    return null;
  }

  console.log("Sync authenticated for user:", session.user.id);

  await ensureSyncedColumn();
  await ensureDeletedColumn();

  // Push local changes
  console.log("Pushing local changes...");
  await pushToSupabase();

  // Pull from Supabase
  console.log("Pulling from Supabase...");
  await pullFromSupabase();

  console.log("Sync complete");
  
  // Return updated transactions for UI refresh
  const { getTransactions } = await import('../utils/db');
  return await getTransactions({ user_id: session.user.id });
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
