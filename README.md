# Expense-Tracker

Reads your **Gmail** — the Inbox plus the `UPI` and `Credit card` labels —
extracts each transaction from the alert emails, and **groups your spending by
expense type** (Snacks & Food, Credit Card Bill, Loan & EMI, Shopping,
Transport, Bills & Utilities, and more).

An **Express** API does the Gmail read + parse + categorize; a **React + Vite**
dashboard shows the grouped totals. It's an npm workspaces monorepo.

| Layer  | Tech                                     | Port |
| ------ | ---------------------------------------- | ---- |
| API    | Node + Express 5, `googleapis` (Gmail)   | 3001 |
| Client | React 19 + Vite (TypeScript)             | 5173 |

## How it works

```
Gmail (Inbox + UPI + Credit card labels)
        │  googleapis
        ▼
   parse  → amount, merchant, date, debit/credit, account
        ▼
 categorize → Snacks & Food / Credit Card Bill / Loan & EMI / …
        ▼
   group by expense type  →  /api/groups, /api/summary  →  dashboard
```

- Parsing lives in `server/src/parse.ts` (handles Indian bank UPI + credit-card alert formats).
- Categorization rules live in `server/src/categorize.ts` — edit the keyword lists to tune categories.

## Running it

```bash
npm install
npm run dev        # API (:3001) + dashboard (:5173)
```

Open http://localhost:5173.

Without Google credentials the app runs in **sample mode** against realistic
fixture emails (`server/src/fixtures.ts`), so the full pipeline is demonstrable
offline. Provide credentials to read your real inbox.

### Connect your Gmail (live mode)

Set these environment variables (e.g. as Cursor Secrets) and restart the API:

| Variable                | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `GOOGLE_CLIENT_ID`      | OAuth 2.0 client ID (Google Cloud)       |
| `GOOGLE_CLIENT_SECRET`  | OAuth 2.0 client secret                  |
| `GOOGLE_REFRESH_TOKEN`  | Refresh token with `gmail.readonly` scope |
| `GMAIL_LABELS`          | Optional, default `UPI,Credit card`      |

Create an OAuth client in the Google Cloud console, enable the Gmail API, and
authorize the `https://www.googleapis.com/auth/gmail.readonly` scope to obtain a
refresh token.

## API

| Method | Route                | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| `GET`  | `/api/auth/status`   | Live vs sample mode, labels, last error       |
| `GET`  | `/api/expenses`      | All parsed + categorized transactions         |
| `GET`  | `/api/groups`        | Transactions grouped by expense type (spend)  |
| `GET`  | `/api/summary`       | Totals by type and by source (UPI/CC/Inbox)   |
| `POST` | `/api/refresh`       | Re-read Gmail and rebuild the cache           |

## Scripts

| Command         | What it does                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Run API + dashboard together              |
| `npm run build` | Type-check + build client, compile API    |
| `npm test`      | Parser, categorizer, and pipeline tests   |

## Cloud Agent environment

`.cursor/environment.json` runs `npm install` on setup and starts the `api` and
`web` dev servers; ports 3001 and 5173 are exposed. Google credentials are read
from the environment, never committed.
