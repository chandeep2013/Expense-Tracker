const cds = require('@sap/cds')
const { periodBounds, summarize, localToday, HttpError } = require('./expenses')

async function fetchReport (userId, period, anchor) {
  const window = periodBounds(period, anchor || localToday())
  const rows = await cds.run(
    SELECT.from('my.expenses.Expenses')
      .where`user = ${userId} and date between ${window.fromDate} and ${window.toDate}`
      .orderBy('date', 'createdAt')
  )
  return {
    ...window,
    currency: 'INR',
    ...summarize(rows),
    rows
  }
}

module.exports = { fetchReport, HttpError }
