import express, { type Request, type Response } from "express";
import cors from "cors";
import { type AppConfig, isLive } from "./config.js";
import { groupByCategory, loadTransactions, summarize } from "./expenses.js";
import type { Transaction } from "./types.js";

export function createApp(config: AppConfig) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Simple in-memory cache so repeated reads don't re-hit Gmail every request.
  let cache: Transaction[] | null = null;
  let lastError: string | null = null;

  async function getTransactions(refresh = false): Promise<Transaction[]> {
    if (cache && !refresh) return cache;
    try {
      cache = await loadTransactions(config);
      lastError = null;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (!cache) cache = [];
    }
    return cache;
  }

  app.get("/api/auth/status", (_req: Request, res: Response) => {
    res.json({
      mode: isLive(config) ? "live" : "sample",
      labels: config.labels,
      connected: isLive(config),
      lastError,
      message: isLive(config)
        ? "Reading your Gmail inbox and configured labels."
        : "Showing sample data. Add Google OAuth credentials to read your inbox.",
    });
  });

  app.get("/api/expenses", async (req: Request, res: Response) => {
    const txns = await getTransactions(req.query.refresh === "true");
    res.json(txns);
  });

  app.get("/api/groups", async (req: Request, res: Response) => {
    const txns = await getTransactions(req.query.refresh === "true");
    res.json(groupByCategory(txns));
  });

  app.get("/api/summary", async (req: Request, res: Response) => {
    const txns = await getTransactions(req.query.refresh === "true");
    res.json(summarize(txns));
  });

  app.post("/api/refresh", async (_req: Request, res: Response) => {
    const txns = await getTransactions(true);
    res.json({ refreshed: true, count: txns.length, lastError });
  });

  return app;
}
