# Expense-Tracker

A small full-stack expense tracker: an **Express + SQLite** REST API and a
**React + Vite** web client, managed as an npm workspaces monorepo.

## Stack

| Layer  | Tech                                            | Port |
| ------ | ----------------------------------------------- | ---- |
| API    | Node + Express 5, `better-sqlite3` (SQLite file) | 3001 |
| Client | React 19 + Vite (TypeScript)                     | 5173 |

The SQLite schema is created automatically on first run and seeded with a few
example expenses, so the app works end-to-end on a fresh checkout with no
separate migration step. The database file lives at `server/data/expenses.sqlite`
(git-ignored).

## Getting started

```bash
npm install        # installs all workspaces
npm run dev        # runs API (:3001) and client (:5173) together
```

Then open http://localhost:5173.

To run the services separately:

```bash
npm run dev:server   # API only, on :3001
npm run dev:client   # client only, on :5173
```

## API

| Method   | Route                | Description                          |
| -------- | -------------------- | ------------------------------------ |
| `GET`    | `/api/health`        | Liveness check + available categories |
| `GET`    | `/api/expenses`      | List expenses (newest first)          |
| `POST`   | `/api/expenses`      | Create an expense                     |
| `DELETE` | `/api/expenses/:id`  | Delete an expense                     |
| `GET`    | `/api/summary`       | Totals and per-category breakdown     |

Example:

```bash
curl -s http://localhost:3001/api/expenses
curl -s -X POST http://localhost:3001/api/expenses \
  -H 'content-type: application/json' \
  -d '{"description":"Coffee","amount":4.75,"category":"Food","spent_on":"2026-08-19"}'
```

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Run API + client together (via `concurrently`)  |
| `npm run build`     | Type-check + build the client and compile the API |
| `npm test`          | Run the API integration tests (`node --test`)   |

## Cloud Agent environment

`.cursor/environment.json` configures the Cursor Cloud Agent environment:
`npm install` runs on setup, and two terminals (`api`, `web`) start the dev
servers. Ports 3001 and 5173 are exposed.
