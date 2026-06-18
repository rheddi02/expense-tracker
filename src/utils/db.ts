import { CATEGORY_OPTIONS, SYSTEM_CATEGORY_IDS } from "@/lib/constants";
import initSqlJs from "sql.js";
import { getDaysInMonth } from "date-fns";

const IDB_DB_NAME = "expense-tracker-idb";
const IDB_STORE = "db-store";
const IDB_KEY = "expense-db";

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
    req.onerror = () => reject(req.error);
  });
}

let db: any = null;

export async function initDB() {
  if (db) return db; // prevent re-init

  const SQL = await initSqlJs({
    // locateFile: file => `https://sql.js.org/dist/${file}`
    locateFile: () => `/expense-tracker/sql-wasm.wasm`,
  });

  // Load from IndexedDB; migrate from legacy localStorage key on first run
  let bytes: Uint8Array | null = await loadFromIDB().catch(() => null);
  if (!bytes) {
    const legacy = localStorage.getItem("expense-db");
    if (legacy) {
      bytes = new Uint8Array(JSON.parse(legacy));
      localStorage.removeItem("expense-db");
    }
  }

  if (bytes) {
    db = new SQL.Database(bytes);

    // Check if we need to migrate from old "expenses" table to "transactions"
    try {
      db.exec("SELECT 1 FROM transactions LIMIT 1");
    } catch (error) {
      // Transactions table doesn't exist, try to migrate from expenses
      try {
        const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'");
        if (result[0] && result[0].values.length > 0) {
          // Migrate data from expenses to transactions
          db.run(`
            CREATE TABLE transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT,
              type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
              amount INTEGER NOT NULL,
              category_id TEXT NOT NULL,
              date TEXT NOT NULL,
              note TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              synced INTEGER DEFAULT 0,
              deleted INTEGER DEFAULT 0
            );
          `);

          // Copy data from expenses to transactions
          db.run(`
            INSERT INTO transactions (id, user_id, type, amount, category_id, date, note, created_at, synced)
            SELECT id, NULL, type, CAST(amount * 100 AS INTEGER), category, date, note, created_at, 0
            FROM expenses;
          `);

          // Drop old table
          db.run("DROP TABLE expenses");

          // Save the migrated database
          saveDB();
        } else {
          // No expenses table either, create transactions table
          db.run(`
            CREATE TABLE transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT,
              type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
              amount INTEGER NOT NULL,
              category_id TEXT NOT NULL,
              date TEXT NOT NULL,
              note TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              synced INTEGER DEFAULT 0,
              deleted INTEGER DEFAULT 0
            );
          `);
          saveDB();
        }
      } catch (migrationError) {
        console.error("Migration failed:", migrationError);
        // Create fresh database if migration fails
        db = new SQL.Database();
        db.run(`
          CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            amount INTEGER NOT NULL,
            category_id TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced INTEGER DEFAULT 0,
            deleted INTEGER DEFAULT 0
          );
        `);
        saveDB();
      }
    }
  } else {
    db = new SQL.Database();

    // Create tables (runs only first time)
    db.run(`
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        amount INTEGER NOT NULL,
        category_id TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
    `);
  }

  // Ensure debts table exists (runs for both fresh and existing DBs)
  try {
    db.exec("SELECT 1 FROM debts LIMIT 1");
  } catch {
    db.run(`
      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        person_name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lent', 'borrowed')),
        borrow_date TEXT NOT NULL,
        payment_date TEXT,
        is_settled INTEGER DEFAULT 0,
        note TEXT,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    saveDB();
  }

  // Migration: add offset tracking columns to existing debts tables
  try { db.exec("SELECT settled_amount FROM debts LIMIT 1"); } catch {
    db.run("ALTER TABLE debts ADD COLUMN settled_amount INTEGER DEFAULT 0");
    db.run("ALTER TABLE debts ADD COLUMN offset_ref_id TEXT");
    saveDB();
  }

  // Migration: add category column
  try { db.exec("SELECT category FROM debts LIMIT 1"); } catch {
    db.run("ALTER TABLE debts ADD COLUMN category TEXT DEFAULT 'cash'");
    saveDB();
  }

  // Create categories table and seed defaults on first run
  try {
    db.exec("SELECT 1 FROM categories LIMIT 1");
  } catch {
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        label TEXT NOT NULL,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        is_system INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    for (const cat of CATEGORY_OPTIONS) {
      const isSystem = SYSTEM_CATEGORY_IDS.has(cat.id) ? 1 : 0;
      db.run(
        "INSERT OR IGNORE INTO categories (id, label, type, is_system) VALUES (?, ?, ?, ?)",
        [cat.id, cat.label, cat.type, isSystem]
      );
    }
    saveDB();
  }

  return db;
}

export function saveDB() {
  if (!db) return;
  saveToIDB(db.export()).catch((e) => console.warn("DB save failed:", e));
}

export async function clearDB(user_id?: string) {
  await initDB();
  if (user_id) {
    db.run("DELETE FROM transactions WHERE user_id = ?", [user_id]);
  } else {
    db.run("DELETE FROM transactions");
  }
  saveDB();
}

export async function addTransaction(data: {
  user_id?: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;
  note?: string | null;
}) {
  await initDB();
  const stmt = db.prepare(`
    INSERT INTO transactions (user_id, type, amount, category_id, date, note, created_at, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    data.user_id ?? null,
    data.type,
    Math.round(data.amount * 100), // Store as cents
    data.categoryId,
    data.date,
    data.note ?? null,
    new Date().toISOString(),
    0, // synced = 0 (not synced yet)
  ]);
  saveDB();
  return { id: db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] };
}

export async function getTransactions({ month, year, user_id }: { month?: number; year?: number; user_id?: string } = {}) {
  await initDB();

  let query = `
    SELECT t.id, t.user_id, t.type, t.amount, t.category_id, t.date, t.note, t.created_at,
           COALESCE(c.label, 'Other') as category_label
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
    WHERE (t.deleted = 0 OR t.deleted IS NULL)
  `;

  const params: any[] = [];

  if (user_id) {
    query += " AND t.user_id = ?";
    params.push(user_id);
  }

  if (month && year) {
    const mm = String(month).padStart(2, '0');
    const lastDay = getDaysInMonth(new Date(year, month - 1));
    const from = `${year}-${mm}-01`;
    const to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
    query += " AND t.date >= ? AND t.date <= ?";
    params.push(from, to);
  }

  query += " ORDER BY t.date DESC";

  const res = db.exec(query, params);

  if (!res[0]) return [];

  const { columns, values } = res[0] as { columns: string[]; values: any[][] };

  return values.map((row: any[]) => {
    const record = Object.fromEntries(
      columns.map((column: string, index: number) => [column, row[index]]),
    ) as {
      id: number;
      user_id: string | null;
      type: 'income' | 'expense';
      amount: number;
      category_id: string;
      date: string;
      note: string | null;
      created_at: string;
      category_label: string;
    };

    return {
      id: String(record.id),
      type: record.type,
      amount: record.amount / 100,
      categoryId: record.category_id,
      categoryLabel: record.category_label ?? "Other",
      date: record.date,
      note: record.note ?? undefined,
    };
  });
}

export async function updateTransaction(id: string, data: {
  user_id?: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;
  note?: string | null;
}) {
  await initDB();
  const stmt = db.prepare(`
    UPDATE transactions
    SET type = ?, amount = ?, category_id = ?, date = ?, note = ?, synced = ?
    WHERE id = ?
  `);

  stmt.run([
    data.type,
    Math.round(data.amount * 100),
    data.categoryId,
    data.date,
    data.note ?? null,
    0, // Mark as unsynced
    id,
  ]);
  saveDB();
  return { id };
}

export async function deleteTransaction(id: string) {
  await initDB();
  db.run("UPDATE transactions SET deleted = 1, synced = 0 WHERE id = ?", [id]);
  saveDB();
}