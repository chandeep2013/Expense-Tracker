import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

function makeServer() {
  const db = openDatabase(":memory:");
  const app = createApp(db);
  const server = app.listen(0);
  const address = server.address();
  if (typeof address === "string" || address === null) {
    throw new Error("Expected an assigned TCP port");
  }
  const base = `http://127.0.0.1:${address.port}`;
  return { base, close: () => new Promise<void>((r) => server.close(() => r())) };
}

test("seeds example expenses and reports a summary", async () => {
  const { base, close } = makeServer();
  try {
    const expenses = await (await fetch(`${base}/api/expenses`)).json();
    assert.equal(expenses.length, 3);

    const summary = await (await fetch(`${base}/api/summary`)).json();
    assert.equal(summary.count, 3);
    assert.ok(Math.abs(summary.total - 108.7) < 1e-6);
    assert.ok(summary.byCategory.length >= 1);
  } finally {
    await close();
  }
});

test("creates and deletes an expense", async () => {
  const { base, close } = makeServer();
  try {
    const created = await fetch(`${base}/api/expenses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        description: "Coffee",
        amount: 4.75,
        category: "Food",
        spent_on: "2026-08-10",
      }),
    });
    assert.equal(created.status, 201);
    const row = await created.json();
    assert.equal(row.description, "Coffee");
    assert.equal(row.amount, 4.75);

    const afterCreate = await (await fetch(`${base}/api/expenses`)).json();
    assert.equal(afterCreate.length, 4);

    const del = await fetch(`${base}/api/expenses/${row.id}`, { method: "DELETE" });
    assert.equal(del.status, 204);

    const afterDelete = await (await fetch(`${base}/api/expenses`)).json();
    assert.equal(afterDelete.length, 3);
  } finally {
    await close();
  }
});

test("rejects invalid input", async () => {
  const { base, close } = makeServer();
  try {
    const res = await fetch(`${base}/api/expenses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ description: "", amount: -3 }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(typeof body.error === "string");
  } finally {
    await close();
  }
});
