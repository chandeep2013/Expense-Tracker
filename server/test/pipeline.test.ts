import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTransactions, groupByCategory, summarize } from "../src/expenses.js";
import type { AppConfig } from "../src/config.js";

// No google credentials => sample mode against fixtures.
const sampleConfig: AppConfig = { labels: ["UPI", "Credit card"], maxMessages: 50 };

test("end-to-end: fixtures parse, categorize, and group by expense type", async () => {
  const txns = await loadTransactions(sampleConfig);
  assert.ok(txns.length >= 12, `expected >=12 transactions, got ${txns.length}`);

  // Every transaction has a resolved category.
  assert.ok(txns.every((t) => t.category && t.category.length > 0));

  const groups = groupByCategory(txns);
  const categories = groups.map((g) => g.category);
  for (const expected of ["Snacks & Food", "Credit Card Bill", "Loan & EMI"]) {
    assert.ok(categories.includes(expected), `missing category: ${expected}`);
  }

  // Groups are sorted by total spend descending.
  for (let i = 1; i < groups.length; i++) {
    assert.ok(groups[i - 1].total >= groups[i].total);
  }

  const summary = summarize(txns);
  assert.ok(summary.totalSpent > 0);
  assert.ok(summary.totalReceived > 0); // the payroll credit fixture
  assert.equal(
    summary.byCategory.reduce((s, c) => s + c.count, 0),
    groups.reduce((s, g) => s + g.count, 0)
  );
});
