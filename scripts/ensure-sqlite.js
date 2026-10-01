const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const file = path.join(root, 'db', 'myexpenses.sqlite')

function ensureSqlite () {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return
  if (hasExpensesTable()) return
  if (fs.existsSync(file)) fs.rmSync(file)
  execSync('npx cds deploy --to sqlite:db/myexpenses.sqlite', { stdio: 'inherit', cwd: root })
}

function hasExpensesTable () {
  if (!fs.existsSync(file)) return false
  const { DatabaseSync } = require('node:sqlite')
  const db = new DatabaseSync(file, { readOnly: true })
  try {
    return !!db.prepare(
      "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'my_expenses_Expenses'"
    ).get()
  } finally {
    db.close()
  }
}

if (require.main === module) ensureSqlite()

module.exports = { ensureSqlite }
