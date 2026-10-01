const cds = require('@sap/cds')
const { normalizeExpense, localToday, parseDate, HttpError } = require('./lib/expenses')
const { fetchReport } = require('./lib/report-data')

function rejectKnown (req, err) {
  if (err instanceof HttpError || err.status) req.reject(err.status, err.message)
  throw err
}

module.exports = class ExpenseService extends cds.ApplicationService {
  async init () {
    const { Expenses } = this.entities

    this.before(['UPDATE', 'DELETE'], Expenses, async (req) => {
      const id = req.data?.ID || req.params?.[0]?.ID
      const row = await SELECT.one.from(Expenses).where({ ID: id })
      if (!row) req.reject(404, 'Expense not found')
      if (row.user !== req.user.id) req.reject(403, 'You can only change your own expenses')
    })

    this.before('READ', Expenses, (req) => {
      req.query.where({ user: req.user.id })
    })

    this.before(['CREATE', 'UPDATE'], Expenses, (req) => {
      try {
        normalizeExpense(req.data, {
          partial: req.event === 'UPDATE',
          today: localToday()
        })
      } catch (err) {
        rejectKnown(req, err)
      }
      if (req.event === 'CREATE') req.data.user = req.user.id
      else delete req.data.user
      req.data.currency = 'INR'
    })

    this.on('getReport', async (req) => {
      try {
        const report = await fetchReport(req.user.id, req.data.period, req.data.anchor)
        delete report.rows
        return report
      } catch (err) {
        rejectKnown(req, err)
      }
    })

    this.on('loggedOn', async (req) => {
      const day = parseDate(req.data.day || localToday())
      if (!day) req.reject(400, 'Day must be a calendar date (YYYY-MM-DD)')
      const rows = await SELECT.from(Expenses).where({ user: req.user.id, date: day })
      return rows.length > 0
    })

    return super.init()
  }
}
