export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  spent_on: string;
  created_at: string;
}

export interface Summary {
  total: number;
  count: number;
  byCategory: { category: string; total: number }[];
}

export interface NewExpense {
  description: string;
  amount: number;
  category: string;
  spent_on: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listExpenses: () => fetch("/api/expenses").then((r) => json<Expense[]>(r)),
  summary: () => fetch("/api/summary").then((r) => json<Summary>(r)),
  createExpense: (input: NewExpense) =>
    fetch("/api/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<Expense>(r)),
  deleteExpense: (id: number) =>
    fetch(`/api/expenses/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok && r.status !== 204) throw new Error(`Delete failed (${r.status})`);
    }),
};

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
] as const;
