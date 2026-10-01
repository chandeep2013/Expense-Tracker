# MyExpenses

Personal expense tracker on [SAP Cloud Application Programming Model](https://cap.cloud.sap/) (Node.js, `@sap/cds`). You log an expense, review your own list, and open a day, week, or month report with a category chart. The current report downloads as Excel.

Amounts are Indian rupees. There is no receipt upload.

## Defaults

These choices are intentional so the daily reminder, charts, and phone/laptop layout stay practical:

| Choice | Value |
| --- | --- |
| Runtime | Node.js CAP (`@sap/cds` 10, Node.js 22+) |
| UI | Freestyle SAPUI5 `sap.m` (Horizon), one responsive app |
| Currency | INR |
| Categories | Food/Snacks, Travel, Groceries, UPI |
| Week | Monday–Sunday containing the selected date |
| Local database | SQLite file `db/myexpenses.sqlite` |
| Local auth | CAP mocked authentication (basic auth) |
| Cloud database | SAP HANA via `@cap-js/hana` and an HDI container |
| Cloud auth | XSUAA, entered through the approuter |

The UI is not a separate mobile app. The same pages adapt: a side menu on a laptop, a bottom bar on a phone (including iPhone 13, about 390×844).

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
npm start
```

The first start creates `db/myexpenses.sqlite` and loads the schema. Later starts keep that file, so expenses stay on disk. Delete the file and start again to reset it. `npm run watch` does the same setup, then restarts when files change.

Open <http://localhost:4004/myexpenses/webapp/index.html>. In SAP Business Application Studio, use that same path on the host `npm start` or `cds watch` exposes: `/myexpenses/webapp/index.html`.

`/`, `/index.html`, `/launchpad.html`, and the old travel preview (`/expenseclaim/webapp/index.html`, `/expenseclaim/webapp/test/flpSandbox.html`) redirect there. Those files also bootstrap MyExpenses themselves, so a Fiori tools preview that ignores the server still does not load the launchpad.

The browser asks for a user. Sign in as `alice` with a blank password (any CAP mocked user works the same way; `bob` is a second user). Each user only sees and edits their own expenses.

What you can do:

- **Log expense** — date (defaults to today), category, amount in INR, short description.
- **My expenses** — list, filter, edit, and delete your expenses.
- **Reports** — Day, Week, or Month, with a donut and bar chart by category.
- **Download Excel** — workbook for the period currently on screen.
- **Daily reminder** — if nothing is logged for today, a dialog asks you to add one. Dismiss hides it until you open a new browser session, and it comes back the next day.

The OData service is `ExpenseService` at `/odata/v4/expenses/`. Excel download is `GET /api/expenses/report.xlsx?period=month&anchor=YYYY-MM-DD`.

## Tests

```bash
npm test
```

Covers category validation, authentication, per-user scoping, day/week/month totals, and the Excel workbook. Tests use an in-memory SQLite database and do not need a browser.

```bash
npm run test:e2e
```

Browser checks for the existing travel-claims UI. Start `npm start` first. Local auth is mocked, so that suite signs in as `alice`.

## Deploy to SAP BTP, Cloud Foundry

`mta.yaml` builds three modules: the CAP server, an HDI deployer for SAP HANA, and an approuter in front of XSUAA. You do not need BTP credentials to run or test this project locally.

### Prerequisites this repository cannot create for you

1. A BTP subaccount with Cloud Foundry enabled, and a target org and space.
2. Entitlements: `hana` / `hdi-shared`, and `xsuaa` / `application`.
3. A SAP HANA Cloud instance available to that space. If the space has more than one database, set `database_id` on the `myexpenses-db` resource in `mta.yaml`.
4. Cloud Foundry CLI (`cf`) logged in (`cf login`), and the [Cloud MTA Build Tool](https://sap.github.io/cloud-mta-build-tool/) (`mbt`).
5. A Node.js buildpack on the landscape that runs Node.js 22 (required by CAP 10).

### Build and deploy

```bash
npm ci
mbt build -t gen --mtar myexpenses.mtar
cf deploy mta_archives/myexpenses.mtar
```

After deploy:

1. Assign the `MyExpenses_User` role collection to yourself (Security → Role Collections in the BTP cockpit).
2. Open the approuter URL from `cf apps`.
3. Sign out later at `/logout` on that host.

The approuter requires the `User` scope. The CAP service requires an authenticated user and only returns expenses stored for that user id. Production uses XSUAA JWT validation (`@sap/xssec`) and HANA (`@cap-js/hana`).

UI5 is loaded in the browser from `https://ui5.sap.com`, so the person using the app needs access to that CDN.

## Project layout

- `db/myexpenses.cds` — expense entity
- `srv/expense-service.cds` — authenticated service, report, and “logged today” check
- `app/myexpenses/webapp` — freestyle SAPUI5 app
- `app/router` — approuter for Cloud Foundry
- `xs-security.json`, `mta.yaml` — XSUAA and MTA deploy descriptors

## Existing travel expense claims app

This repository also contains the earlier travel-claims service (`TravelService` at `/odata/v4/travel/`). Local authentication for that service is the CAP mocked strategy used by MyExpenses.

The old Fiori launchpad is not a start page. `app/expenseclaim/webapp/index.html` and `app/appconfig/fioriSandboxConfig.json` used to boot UI5 1.120.0 with `sap.ushell` and `sap.fe`, which the public CDN does not serve. Opening those URLs now starts MyExpenses.
