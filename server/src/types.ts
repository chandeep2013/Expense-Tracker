export type Direction = "debit" | "credit";

/** Which Gmail source an email came from. */
export type Source = "UPI" | "Credit Card" | "Inbox";

/** A raw email as fetched from Gmail (or a local fixture). */
export interface RawEmail {
  id: string;
  /** Gmail labels that matched this message (e.g. "UPI", "Credit card"). */
  labels: string[];
  from: string;
  subject: string;
  /** Plain-text body (or snippet) of the email. */
  body: string;
  /** Epoch millis the email was received. */
  internalDate: number;
}

/** A parsed financial transaction extracted from an email. */
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // always positive
  direction: Direction;
  /** Merchant / payee / description. */
  merchant: string;
  /** Account or instrument, e.g. "HDFC Credit Card", "UPI". */
  account: string;
  source: Source;
  /** Derived expense type, e.g. "Snacks & Food", "Credit Card Bill". */
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
