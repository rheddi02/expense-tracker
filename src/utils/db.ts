import { CATEGORY_OPTIONS } from "@/lib/constants";
import initSqlJs from "sql.js";

let db: any = null;

export async function initDB() {
  if (db) return db; // prevent re-init

  const SQL = await initSqlJs({
    // locateFile: file => `https://sql.js.org/dist/${file}`
    locateFile: () => `/expense-tracker/sql-wasm.wasm`,
  });

  // Try to load saved DB
  const saved = localStorage.getItem("expense-db");

  if (saved) {
    const bytes = new Uint8Array(JSON.parse(saved));
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
              synced INTEGER DEFAULT 0
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
              synced INTEGER DEFAULT 0
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
            synced INTEGER DEFAULT 0
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
        synced INTEGER DEFAULT 0
      );
    `);
  }
  return db;
}

export function saveDB() {
  if (!db) return;

  const data = db.export();
  localStorage.setItem("expense-db", JSON.stringify(Array.from(data)));
  console.log("DB saved");
}

export async function clearDB() {
  await initDB();
  db.run("DELETE FROM transactions");
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

export async function getTransactions({ month, year }: { month?: number; year?: number } = {}) {
  await initDB();
  let query = "SELECT id, user_id, type, amount, category_id, date, note, created_at FROM transactions";

  const params: any[] = [];

  if (month && year) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to = `${year}-${String(month).padStart(2, '0')}-31`;
    query += " WHERE date >= ? AND date <= ?";
    params.push(from, to);
  }

  query += " ORDER BY date DESC";

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
    };

    // Find category label from the global categories
    // const CATEGORY_OPTIONS = [
    //   { id: "52efe72b-9dc1-4ffe-bd61-0c329217830f", label: "Food", type: "expense" },
    //   { id: "ea2c1f60-50d3-4708-8f9c-58b4c6d0a2ea", label: "Transport", type: "expense" },
    //   { id: "cffbbfd3-7e44-4996-958b-fdae4dbae5cb", label: "Bills", type: "expense" },
    //   { id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c73", label: "Shopping", type: "expense" },
    //   { id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c72", label: "Others", type: "expense" },
    //   { id: "8c012f3f-7d78-4a4a-a4fe-84a32f51ddd7", label: "Sales", type: "income" },
    //   { id: "8c012f3f-7d78-4a4a-a4fe-84a32f51d6f7", label: "Salary", type: "income" },
    //   { id: "22b1ad96-13f0-4f92-9c6d-9da5cbe84f33", label: "Freelance", type: "income" },
    //   { id: "28c5c7d6-e9bf-4e4f-9cac-37f0233465b5", label: "Gift", type: "income" },
    // ];

    const category = CATEGORY_OPTIONS.find(cat => cat.id === record.category_id);

    return {
      id: String(record.id),
      type: record.type,
      amount: record.amount / 100, // Convert back to pesos
      categoryId: record.category_id,
      categoryLabel: category?.label ?? "Other",
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
  db.run("DELETE FROM transactions WHERE id = ?", [id]);
  saveDB();
}