import express, { type Request, type Response } from "express";
import cors from "cors";
import type Database from "better-sqlite3";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  summarize,
  type NewExpense,
} from "./db.js";

const CATEGORIES = new Set([
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
]);

function validateExpense(body: unknown): { value?: NewExpense; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be a JSON object." };
  }
  const { description, amount, category, spent_on } = body as Record<string, unknown>;

  if (typeof description !== "string" || description.trim().length === 0) {
    return { error: "`description` is required." };
  }
  const parsedAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return { error: "`amount` must be a non-negative number." };
  }
  const cat = typeof category === "string" && category.trim() ? category.trim() : "Other";
  if (!CATEGORIES.has(cat)) {
    return { error: `\`category\` must be one of: ${[...CATEGORIES].join(", ")}.` };
  }
  const date =
    typeof spent_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(spent_on)
      ? spent_on
      : new Date().toISOString().slice(0, 10);

  return {
    value: {
      description: description.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      category: cat,
      spent_on: date,
    },
  };
}

export function createApp(db: Database.Database) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", categories: [...CATEGORIES] });
  });

  app.get("/api/expenses", (_req: Request, res: Response) => {
    res.json(listExpenses(db));
  });

  app.post("/api/expenses", (req: Request, res: Response) => {
    const { value, error } = validateExpense(req.body);
    if (error || !value) {
      res.status(400).json({ error });
      return;
    }
    res.status(201).json(createExpense(db, value));
  });

  app.delete("/api/expenses/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id." });
      return;
    }
    res.status(deleteExpense(db, id) ? 204 : 404).end();
  });

  app.get("/api/summary", (_req: Request, res: Response) => {
    res.json(summarize(db));
  });

  return app;
}
