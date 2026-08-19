import type { RawEmail } from "./types.js";

const day = (d: string) => new Date(`${d}T10:00:00+05:30`).getTime();

/**
 * Sample transaction emails that mirror the shape of real Indian bank UPI and
 * credit-card alerts. Used when Google credentials are not configured so the
 * fetch -> parse -> categorize -> group pipeline is demonstrable offline.
 */
export const SAMPLE_EMAILS: RawEmail[] = [
  {
    id: "sample-upi-1",
    labels: ["UPI"],
    from: "alerts@hdfcbank.net",
    subject: "You have done a UPI txn",
    body: "Dear Customer, Rs.180.00 has been debited from your account XXXX1234 to Chai Point via UPI on 02-08-2026. UPI Ref 412345678901.",
    internalDate: day("2026-08-02"),
  },
  {
    id: "sample-upi-2",
    labels: ["UPI"],
    from: "alerts@hdfcbank.net",
    subject: "UPI transaction alert",
    body: "Rs.640.00 debited from a/c XXXX1234 and credited to SWIGGY via UPI on 03-08-2026. Ref 512345678902.",
    internalDate: day("2026-08-03"),
  },
  {
    id: "sample-upi-3",
    labels: ["UPI"],
    from: "noreply@okicici.com",
    subject: "Money sent via UPI",
    body: "INR 2,000.00 debited towards Rahul Sharma (rahul@okhdfcbank) via UPI on 04-08-2026 from your ICICI account.",
    internalDate: day("2026-08-04"),
  },
  {
    id: "sample-upi-4",
    labels: ["UPI"],
    from: "alerts@sbi.co.in",
    subject: "UPI credit alert",
    body: "Rs.5,000.00 has been credited to your account XXXX9911 from Acme Payroll via UPI on 01-08-2026.",
    internalDate: day("2026-08-01"),
  },
  {
    id: "sample-upi-5",
    labels: ["UPI"],
    from: "noreply@okaxis",
    subject: "UPI payment successful",
    body: "You paid Rs.95.00 to Blinkit via UPI on 05-08-2026 from account XXXX1234. UPI Ref 612345678903.",
    internalDate: day("2026-08-05"),
  },
  {
    id: "sample-cc-1",
    labels: ["Credit card"],
    from: "cards@hdfcbank.net",
    subject: "Transaction alert on your HDFC Bank Credit Card",
    body: "Thank you for using your HDFC Bank Credit Card ending 5678 for Rs.1,299.00 at AMAZON on 06-08-2026.",
    internalDate: day("2026-08-06"),
  },
  {
    id: "sample-cc-2",
    labels: ["Credit card"],
    from: "cards@icicibank.com",
    subject: "Credit Card spend alert",
    body: "Your ICICI Bank Credit Card XX4321 has been used for INR 540.00 at DOMINOS PIZZA on 07-08-2026.",
    internalDate: day("2026-08-07"),
  },
  {
    id: "sample-cc-3",
    labels: ["Credit card"],
    from: "statements@hdfcbank.net",
    subject: "Your Credit Card statement is ready",
    body: "Your HDFC Bank Credit Card bill of Rs.18,340.00 for statement period Jul 2026 is due on 18-08-2026. Please pay the total amount due.",
    internalDate: day("2026-08-08"),
  },
  {
    id: "sample-cc-4",
    labels: ["Credit card"],
    from: "cards@axisbank.com",
    subject: "Credit Card transaction",
    body: "INR 2,499.00 spent on your Axis Bank Credit Card ending 8899 at MYNTRA on 09-08-2026.",
    internalDate: day("2026-08-09"),
  },
  {
    id: "sample-inbox-1",
    labels: ["INBOX"],
    from: "loans@hdfcbank.net",
    subject: "Home Loan EMI debited",
    body: "Your Home Loan EMI of Rs.24,500.00 has been debited from account XXXX1234 on 05-08-2026. Loan A/c HL00099.",
    internalDate: day("2026-08-05"),
  },
  {
    id: "sample-inbox-2",
    labels: ["INBOX"],
    from: "noreply@bajajfinserv.in",
    subject: "Personal Loan EMI reminder",
    body: "Your Personal Loan EMI of Rs.6,750.00 is due on 10-08-2026 and will be auto-debited from your account.",
    internalDate: day("2026-08-10"),
  },
  {
    id: "sample-inbox-3",
    labels: ["INBOX"],
    from: "alerts@jio.com",
    subject: "Recharge successful",
    body: "Your Jio recharge of Rs.299.00 was successful on 06-08-2026. Debited via UPI.",
    internalDate: day("2026-08-06"),
  },
  {
    id: "sample-inbox-4",
    labels: ["INBOX"],
    from: "no-reply@uber.com",
    subject: "Your Uber trip receipt",
    body: "Thanks for riding with Uber. Rs.318.50 was charged for your trip on 07-08-2026.",
    internalDate: day("2026-08-07"),
  },
];
