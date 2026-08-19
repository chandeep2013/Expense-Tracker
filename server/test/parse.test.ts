import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEmail } from "../src/parse.js";
import type { RawEmail } from "../src/types.js";

function email(partial: Partial<RawEmail>): RawEmail {
  return {
    id: "t1",
    labels: ["UPI"],
    from: "alerts@hdfcbank.net",
    subject: "",
    body: "",
    internalDate: Date.parse("2026-08-02T10:00:00+05:30"),
    ...partial,
  };
}

test("parses a UPI debit with amount, merchant, and date", () => {
  const t = parseEmail(
    email({
      body: "Rs.180.00 has been debited from your account XXXX1234 to Chai Point via UPI on 02-08-2026.",
    })
  );
  assert.ok(t);
  assert.equal(t.amount, 180);
  assert.equal(t.direction, "debit");
  assert.equal(t.source, "UPI");
  assert.equal(t.date, "2026-08-02");
  assert.match(t.merchant, /Chai Point/i);
});

test("parses a credit correctly", () => {
  const t = parseEmail(
    email({
      labels: ["UPI"],
      body: "Rs.5,000.00 has been credited to your account XXXX9911 from Acme Payroll via UPI on 01-08-2026.",
    })
  );
  assert.ok(t);
  assert.equal(t.amount, 5000);
  assert.equal(t.direction, "credit");
  assert.match(t.merchant, /Acme Payroll/i);
});

test("parses a credit-card spend and detects the card account", () => {
  const t = parseEmail(
    email({
      labels: ["Credit card"],
      subject: "Transaction alert on your HDFC Bank Credit Card",
      body: "Thank you for using your HDFC Bank Credit Card ending 5678 for Rs.1,299.00 at AMAZON on 06-08-2026.",
    })
  );
  assert.ok(t);
  assert.equal(t.amount, 1299);
  assert.equal(t.source, "Credit Card");
  assert.match(t.account, /HDFC Credit Card/i);
  assert.match(t.merchant, /AMAZON/i);
});

test("returns null when there is no amount", () => {
  const t = parseEmail(email({ body: "Your OTP is 123456. Do not share it." }));
  assert.equal(t, null);
});
