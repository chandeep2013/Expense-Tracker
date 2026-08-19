import type { AppConfig } from "./config.js";
import { fetchEmails } from "./gmail.js";
import { parseEmails } from "./parse.js";
import { categorize } from "./categorize.js";
import type { CategoryGroup, Source, Summary, Transaction } from "./types.js";

/** Run the full pipeline: Gmail -> parse -> categorize. */
export async function loadTransactions(config: AppConfig): Promise<Transaction[]> {
  const emails = await fetchEmails(config);
  const parsed = parseEmails(emails);
  const txns = categorize(parsed);
  return txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function groupByCategory(txns: Transaction[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const txn of txns) {
    if (txn.direction !== "debit") continue; // group spend only
    const group = groups.get(txn.category) ?? {
      category: txn.category,
      total: 0,
      count: 0,
      transactions: [],
    };
    group.total = Math.round((group.total + txn.amount) * 100) / 100;
    group.count += 1;
    group.transactions.push(txn);
    groups.set(txn.category, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export function summarize(txns: Transaction[]): Summary {
  const spent = txns.filter((t) => t.direction === "debit");
  const received = txns.filter((t) => t.direction === "credit");

  const round = (n: number) => Math.round(n * 100) / 100;
  const totalSpent = round(spent.reduce((s, t) => s + t.amount, 0));
  const totalReceived = round(received.reduce((s, t) => s + t.amount, 0));

  const sources = new Map<Source, { total: number; count: number }>();
  for (const t of spent) {
    const entry = sources.get(t.source) ?? { total: 0, count: 0 };
    entry.total = round(entry.total + t.amount);
    entry.count += 1;
    sources.set(t.source, entry);
  }

  return {
    totalSpent,
    totalReceived,
    transactionCount: txns.length,
    bySource: [...sources.entries()]
      .map(([source, v]) => ({ source, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total),
    byCategory: groupByCategory(txns).map(({ category, total, count }) => ({
      category,
      total,
      count,
    })),
  };
}
