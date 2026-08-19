import type { Transaction } from "./types.js";

export interface CategoryRule {
  category: string;
  /** Keywords matched (case-insensitive) against merchant + subject + account. */
  keywords: string[];
}

/**
 * Ordered rules — the first match wins, so more specific categories (bills,
 * loans) come before broad ones. Extend this list to tune categorization.
 */
export const CATEGORY_RULES: CategoryRule[] = [
  { category: "Credit Card Bill", keywords: ["card bill", "statement", "total amount due", "card payment", "bill of", "minimum amount due"] },
  { category: "Loan & EMI", keywords: ["emi", "loan", "home loan", "personal loan", "bajaj finserv"] },
  { category: "Snacks & Food", keywords: ["swiggy", "zomato", "dominos", "pizza", "mcdonald", "kfc", "restaurant", "cafe", "chai", "snack", "bakery", "biryani", "starbucks"] },
  { category: "Groceries", keywords: ["bigbasket", "blinkit", "zepto", "grofers", "dmart", "grocery", "instamart", "supermarket"] },
  { category: "Transport", keywords: ["uber", "ola", "rapido", "irctc", "petrol", "fuel", "metro", "redbus", "indigo"] },
  { category: "Shopping", keywords: ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall"] },
  { category: "Bills & Utilities", keywords: ["electricity", "recharge", "jio", "airtel", "vodafone", "broadband", "gas bill", "water bill", "postpaid", "dth"] },
  { category: "Entertainment", keywords: ["netflix", "spotify", "hotstar", "prime video", "bookmyshow", "pvr", "disney"] },
  { category: "Transfers", keywords: ["sharma", "kumar", "@ok", "@paytm", "sent to", "money sent", "to friend"] },
  { category: "Income", keywords: ["payroll", "salary", "refund", "cashback", "interest credited"] },
];

export const OTHER_CATEGORY = "Other";

export function categorizeOne(txn: Omit<Transaction, "category">): string {
  // Credits that look like income/refunds should not land in a spend bucket.
  if (txn.direction === "credit") {
    const creditText = `${txn.merchant} ${txn.subject} ${txn.account}`.toLowerCase();
    const incomeRule = CATEGORY_RULES.find((r) => r.category === "Income");
    if (incomeRule && incomeRule.keywords.some((k) => creditText.includes(k))) {
      return "Income";
    }
  }

  const haystack = `${txn.merchant} ${txn.subject} ${txn.account}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }
  return OTHER_CATEGORY;
}

export function categorize(
  txns: Omit<Transaction, "category">[]
): Transaction[] {
  return txns.map((txn) => ({ ...txn, category: categorizeOne(txn) }));
}
