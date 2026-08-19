# Expense Tracker

SAP CAP + Fiori elements app for capturing travel expense claims with line
items, cost centres, and approval status.

Built from the functional specification in [`specs/travel-expense.md`](specs/travel-expense.md).

## Run it

Requires Node.js 20+.

```bash
npm install
npm run watch
```

Open the Fiori launchpad at <http://localhost:4004/launchpad.html> and start
**Manage Travel Expenses**.

Fiori elements uses launchpad (ushell) services for list-to-object navigation,
so open the app from the launchpad rather than `index.html` directly.

### Apps

- **Manage Travel Expenses** — list report and object page for expense claims
  (standalone: <http://localhost:4004/expenseclaim/webapp/index.html>)

### Services

- `TravelService` at `/odata/v4/travel/`
  - `ExpenseClaims` — draft-enabled claims
  - `ExpenseItems` — composition children of a claim
  - `CostCentres` — read-only controlling master data

### Entities

- `CostCentres` — code, name, company code
- `ExpenseClaims` — claim number (`EX-000001`), employee, trip, status, totals
- `ExpenseItems` — position, category (Travel / Meal / Lodging / Other), amount

New claims start as **Draft**. Status values: Draft, Submitted, Approved,
Rejected, Paid. Cost centres cannot be created or changed from this service.

Local development uses dummy authentication so the browser does not prompt for
basic auth. Production keeps `requires: authenticated-user`.

## Tests

```bash
npm test          # cds.test service tests, no browser needed
npm run test:e2e  # wdi5 browser tests, requires `npm run watch` in another shell
```

OPA5 journeys live under `app/expenseclaim/webapp/test/integration/` and run
via `app/expenseclaim/webapp/test/testsuite.qunit.html`.
