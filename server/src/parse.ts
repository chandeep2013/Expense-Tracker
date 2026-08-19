import type { RawEmail, Direction, Source, Transaction } from "./types.js";

const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

const CREDIT_HINTS = /\b(credited|received|refund|cashback|deposited)\b/i;
const DEBIT_HINTS = /\b(debited|spent|paid|withdrawn|charged|purchase|used for|sent)\b/i;

function parseAmount(text: string): number | null {
  const match = text.match(AMOUNT_RE);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseDirection(text: string): Direction {
  // A statement/bill "due" is money owed => treated as a debit (spend).
  if (CREDIT_HINTS.test(text) && !DEBIT_HINTS.test(text)) return "credit";
  return "debit";
}

const NOT_ACCOUNT = /^(your|a\/c|account|the)\b/i;

function parseMerchant(email: RawEmail, direction: Direction): string {
  const text = email.body;
  // For credits the counterparty is the payer named after "from".
  const patterns =
    direction === "credit"
      ? [
          /\bfrom\s+([A-Z0-9][\w .&'@-]{1,40}?)\s+(?:via|on|\.)/i,
          /\bcredited to\s+([A-Z0-9][\w .&'-]{1,40}?)\s+(?:via|on|\.)/i,
        ]
      : [
          /\b(?:to|at|towards)\s+([A-Z0-9][\w .&'@-]{1,40}?)(?:\s+(?:via|on|from|for)|\s*[(.,])/i,
          /\bused for .*?\bat\s+([A-Z0-9][\w .&'-]{1,40}?)\s+on/i,
          /\bpaid\s+(?:rs\.?|inr|₹)?[\d,. ]*to\s+([A-Z0-9][\w .&'@-]{1,40}?)\s+(?:via|on)/i,
        ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && !NOT_ACCOUNT.test(m[1].trim())) return m[1].trim().replace(/\s+/g, " ");
  }
  // Loan / bill emails often name the product in the subject.
  if (/loan|emi/i.test(email.subject)) return email.subject.replace(/\s+(reminder|debited|alert)$/i, "").trim();
  if (/statement|bill/i.test(email.subject)) {
    const bank = email.from.split("@")[1]?.split(".")[0] ?? "Card";
    return `${bank.toUpperCase()} Card Bill`;
  }
  return email.subject.trim() || "Unknown";
}

function parseAccount(email: RawEmail): string {
  const text = `${email.subject} ${email.body}`;
  if (/credit card/i.test(text)) {
    const bank = /(hdfc|icici|sbi|axis|kotak|amex|citi)/i.exec(text)?.[1];
    return bank ? `${bank.toUpperCase()} Credit Card` : "Credit Card";
  }
  if (/\bupi\b/i.test(text)) return "UPI";
  if (/loan|emi/i.test(text)) return "Loan Account";
  return email.from.split("@")[1]?.split(".")[0]?.toUpperCase() ?? "Account";
}

function sourceFromLabels(labels: string[]): Source {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.includes("credit card")) return "Credit Card";
  if (lower.includes("upi")) return "UPI";
  return "Inbox";
}

function toIsoDate(email: RawEmail): string {
  // Prefer an explicit dd-mm-yyyy in the body; fall back to internalDate.
  const m = email.body.match(/\b(\d{2})-(\d{2})-(\d{4})\b/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return new Date(email.internalDate).toISOString().slice(0, 10);
}

/** Parse a single email into a Transaction, or null if no amount is present. */
export function parseEmail(email: RawEmail): Omit<Transaction, "category"> | null {
  const searchText = `${email.subject} ${email.body}`;
  const amount = parseAmount(email.body) ?? parseAmount(email.subject);
  if (amount === null) return null;

  const direction = parseDirection(searchText);
  return {
    id: email.id,
    date: toIsoDate(email),
    amount,
    direction,
    merchant: parseMerchant(email, direction),
    account: parseAccount(email),
    source: sourceFromLabels(email.labels),
    subject: email.subject,
  };
}

export function parseEmails(emails: RawEmail[]): Omit<Transaction, "category">[] {
  return emails
    .map(parseEmail)
    .filter((t): t is Omit<Transaction, "category"> => t !== null);
}
