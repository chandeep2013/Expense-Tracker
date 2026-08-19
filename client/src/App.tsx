import { useEffect, useMemo, useState } from "react";
import {
  api,
  type AuthStatus,
  type CategoryGroup,
  type Summary,
  type Transaction,
} from "./api.js";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const CATEGORY_ICON: Record<string, string> = {
  "Snacks & Food": "🍔",
  Groceries: "🛒",
  "Credit Card Bill": "💳",
  "Loan & EMI": "🏦",
  Transport: "🚕",
  Shopping: "🛍️",
  "Bills & Utilities": "💡",
  Entertainment: "🎬",
  Transfers: "🔁",
  Income: "💰",
  Other: "📦",
};

const SOURCE_TAG: Record<string, string> = {
  UPI: "upi",
  "Credit Card": "cc",
  Inbox: "inbox",
};

export default function App() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function load() {
    const [s, sum, grp] = await Promise.all([api.status(), api.summary(), api.groups()]);
    setStatus(s);
    setSummary(sum);
    setGroups(grp);
    setOpen((prev) => prev ?? grp[0]?.category ?? null);
  }

  useEffect(() => {
    load()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await api.refresh();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  const maxTotal = useMemo(
    () => groups.reduce((m, g) => Math.max(m, g.total), 0),
    [groups]
  );

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>Expense Tracker</h1>
          <p>Your spending from Gmail — UPI &amp; Credit&nbsp;card alerts, grouped by type.</p>
        </div>
        <button className="refresh" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </header>

      {status && (
        <div className={`banner ${status.mode}`}>
          <span className="dot" />
          <span>
            <strong>{status.mode === "live" ? "Connected to Gmail" : "Sample data"}</strong> —{" "}
            {status.message} Labels: {status.labels.join(", ")}.
          </span>
        </div>
      )}

      <section className="stats">
        <div className="stat-card spent">
          <span className="stat-label">Total spent</span>
          <span className="stat-value">{summary ? inr.format(summary.totalSpent) : "—"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Received</span>
          <span className="stat-value">{summary ? inr.format(summary.totalReceived) : "—"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{summary ? summary.transactionCount : "—"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{groups.length || "—"}</span>
        </div>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <section className="groups">
          <h2>Spending by type</h2>
          {groups.map((g) => (
            <div className="group" key={g.category}>
              <button
                className="group-head"
                onClick={() => setOpen(open === g.category ? null : g.category)}
                aria-expanded={open === g.category}
              >
                <span className="group-icon">{CATEGORY_ICON[g.category] ?? "📦"}</span>
                <span className="group-name">{g.category}</span>
                <span className="group-track">
                  <span
                    className="group-fill"
                    style={{ width: `${maxTotal ? (g.total / maxTotal) * 100 : 0}%` }}
                  />
                </span>
                <span className="group-total">{inr.format(g.total)}</span>
                <span className="group-count">{g.count}</span>
              </button>
              {open === g.category && (
                <ul className="txn-list">
                  {g.transactions.map((t: Transaction) => (
                    <li className="txn" key={t.id}>
                      <span className={`src src-${SOURCE_TAG[t.source] ?? "inbox"}`}>{t.source}</span>
                      <span className="txn-merchant">{t.merchant}</span>
                      <span className="txn-account">{t.account}</span>
                      <span className="txn-date">{t.date}</span>
                      <span className="txn-amount">{inr.format(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {groups.length === 0 && <p className="muted">No transactions found.</p>}
        </section>
      )}
    </div>
  );
}
