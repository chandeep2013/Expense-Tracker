import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  spent_on: string; // ISO date (YYYY-MM-DD)
  created_at: string;
}

export interface NewExpense {
  description: string;
  amount: number;
  category: string;
  spent_on: string;
}

const SEED: NewExpense[] = [
  { description: "Groceries", amount: 54.2, category: "Food", spent_on: "2026-08-01" },
  { description: "Bus pass", amount: 30, category: "Transport", spent_on: "2026-08-02" },
  { description: "Movie night", amount: 24.5, category: "Entertainment", spent_on: "2026-08-05" },
];

/**
 * Opens (and lazily initializes) the SQLite database. The schema is created on
 * first use and a few example rows are seeded only when the table is empty, so
 * the API is usable end-to-end on a fresh checkout without a separate migration
 * step.
 */
export function openDatabase(dbPath?: string): Database.Database {
  const file =
    dbPath ?? process.env.DATABASE_PATH ?? resolve(process.cwd(), "data", "expenses.sqlite");

  if (file !== ":memory:") {
    mkdirSync(dirname(file), { recursive: true });
  }

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount >= 0),
      category TEXT NOT NULL,
      spent_on TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const { count } = db.prepare("SELECT COUNT(*) AS count FROM expenses").get() as {
    count: number;
  };
  if (count === 0) {
    const insert = db.prepare(
      "INSERT INTO expenses (description, amount, category, spent_on) VALUES (@description, @amount, @category, @spent_on)"
    );
    const seed = db.transaction((rows: NewExpense[]) => {
      for (const row of rows) insert.run(row);
    });
    seed(SEED);
  }

  return db;
}

export function listExpenses(db: Database.Database): Expense[] {
  return db
    .prepare("SELECT * FROM expenses ORDER BY spent_on DESC, id DESC")
    .all() as Expense[];
}

export function createExpense(db: Database.Database, input: NewExpense): Expense {
  const info = db
    .prepare(
      "INSERT INTO expenses (description, amount, category, spent_on) VALUES (@description, @amount, @category, @spent_on)"
    )
    .run(input);
  return db
    .prepare("SELECT * FROM expenses WHERE id = ?")
    .get(info.lastInsertRowid) as Expense;
}

export function deleteExpense(db: Database.Database, id: number): boolean {
  const info = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  return info.changes > 0;
}

export interface Summary {
  total: number;
  count: number;
  byCategory: { category: string; total: number }[];
}

export function summarize(db: Database.Database): Summary {
  const totals = db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses")
    .get() as { total: number; count: number };
  const byCategory = db
    .prepare(
      "SELECT category, SUM(amount) AS total FROM expenses GROUP BY category ORDER BY total DESC"
    )
    .all() as { category: string; total: number }[];
  return { total: totals.total, count: totals.count, byCategory };
}
