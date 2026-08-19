import { test } from "node:test";
import assert from "node:assert/strict";
import { categorizeOne } from "../src/categorize.js";
import type { Transaction } from "../src/types.js";

function txn(partial: Partial<Transaction>): Omit<Transaction, "category"> {
  const { category: _ignored, ...rest } = {
    id: "t",
    date: "2026-08-01",
    amount: 100,
    direction: "debit",
    merchant: "",
    account: "UPI",
    source: "UPI",
    subject: "",
    category: "",
    ...partial,
  } as Transaction;
  return rest;
}

const cases: [string, Partial<Transaction>, string][] = [
  ["snacks", { merchant: "SWIGGY" }, "Snacks & Food"],
  ["snacks by subject", { merchant: "Chai Point" }, "Snacks & Food"],
  ["credit card bill", { merchant: "HDFC Card Bill", subject: "Your Credit Card bill of Rs.18,340.00 is due" }, "Credit Card Bill"],
  ["home loan emi", { merchant: "Home Loan EMI", subject: "Home Loan EMI debited" }, "Loan & EMI"],
  ["shopping", { merchant: "AMAZON" }, "Shopping"],
  ["transport", { merchant: "Uber" }, "Transport"],
  ["bills", { merchant: "Jio", subject: "Recharge successful" }, "Bills & Utilities"],
  ["unknown -> other", { merchant: "Some Random Shop" }, "Other"],
];

for (const [name, partial, expected] of cases) {
  test(`categorizes ${name}`, () => {
    assert.equal(categorizeOne(txn(partial)), expected);
  });
}

test("income credit is categorized as Income, not spend", () => {
  const c = categorizeOne(
    txn({ direction: "credit", merchant: "Acme Payroll", subject: "UPI credit alert" })
  );
  assert.equal(c, "Income");
});
