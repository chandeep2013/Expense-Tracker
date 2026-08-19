import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, CATEGORIES, type Expense, type Summary } from "./api.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Food");
  const [spentOn, setSpentOn] = useState(today());

  async function refresh() {
    const [list, sum] = await Promise.all([api.listExpenses(), api.summary()]);
    setExpenses(list);
    setSummary(sum);
  }

  useEffect(() => {
    refresh()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const maxCategoryTotal = useMemo(
    () => summary?.byCategory.reduce((m, c) => Math.max(m, c.total), 0) ?? 0,
    [summary]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createExpense({
        description,
        amount: Number(amount),
        category,
        spent_on: spentOn,
      });
      setDescription("");
      setAmount("");
      setSpentOn(today());
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await api.deleteExpense(id);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete expense");
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>Expense Tracker</h1>
        <p>Track where your money goes, one expense at a time.</p>
      </header>

      <section className="stats">
        <div className="stat-card total">
          <span className="stat-label">Total spent</span>
          <span className="stat-value">
            {summary ? currency.format(summary.total) : "—"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Expenses</span>
          <span className="stat-value">{summary ? summary.count : "—"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{summary ? summary.byCategory.length : "—"}</span>
        </div>
      </section>

      <div className="layout">
        <section className="panel">
          <h2>Add expense</h2>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Description
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Lunch with team"
                required
              />
            </label>
            <div className="form-row">
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={spentOn}
                  onChange={(e) => setSpentOn(e.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add expense"}
            </button>
          </form>

          {summary && summary.byCategory.length > 0 && (
            <div className="breakdown">
              <h3>By category</h3>
              {summary.byCategory.map((c) => (
                <div key={c.category} className="bar-row">
                  <span className="bar-label">{c.category}</span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{
                        width: `${maxCategoryTotal ? (c.total / maxCategoryTotal) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  <span className="bar-value">{currency.format(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Recent expenses</h2>
          {error && <p className="error" role="alert">{error}</p>}
          {loading ? (
            <p className="muted">Loading…</p>
          ) : expenses.length === 0 ? (
            <p className="muted">No expenses yet. Add your first one!</p>
          ) : (
            <ul className="expense-list">
              {expenses.map((e) => (
                <li key={e.id} className="expense-item">
                  <div className="expense-main">
                    <span className="expense-desc">{e.description}</span>
                    <span className={`tag tag-${e.category.toLowerCase()}`}>{e.category}</span>
                  </div>
                  <div className="expense-meta">
                    <span className="expense-date">{e.spent_on}</span>
                    <span className="expense-amount">{currency.format(e.amount)}</span>
                    <button
                      className="delete"
                      aria-label={`Delete ${e.description}`}
                      onClick={() => handleDelete(e.id)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
