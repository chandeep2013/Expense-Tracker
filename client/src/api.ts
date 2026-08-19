export type Direction = "debit" | "credit";
export type Source = "UPI" | "Credit Card" | "Inbox";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  direction: Direction;
  merchant: string;
  account: string;
  source: Source;
  category: string;
  subject: string;
}

export interface CategoryGroup {
  category: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface Summary {
  totalSpent: number;
  totalReceived: number;
  transactionCount: number;
  bySource: { source: Source; total: number; count: number }[];
  byCategory: { category: string; total: number; count: number }[];
}

export interface AuthStatus {
  mode: "live" | "sample";
  labels: string[];
  connected: boolean;
  lastError: string | null;
  message: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const api = {
  status: () => fetch("/api/auth/status").then((r) => json<AuthStatus>(r)),
  groups: () => fetch("/api/groups").then((r) => json<CategoryGroup[]>(r)),
  summary: () => fetch("/api/summary").then((r) => json<Summary>(r)),
  refresh: () =>
    fetch("/api/refresh", { method: "POST" }).then((r) =>
      json<{ refreshed: boolean; count: number }>(r)
    ),
};
