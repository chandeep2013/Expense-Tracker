const ExcelJS = require('exceljs')

async function workbookBuffer (report) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MyExpenses'
  workbook.created = new Date()

  const summary = workbook.addWorksheet('Summary')
  summary.getColumn(1).width = 22
  summary.getColumn(2).width = 28
  summary.getColumn(3).width = 18
  summary.addRow(['MyExpenses report'])
  summary.addRow(['Period', report.period])
  summary.addRow(['Anchor', report.anchor])
  summary.addRow(['From', report.fromDate])
  summary.addRow(['To', report.toDate])
  summary.addRow(['Currency', report.currency || 'INR'])
  summary.addRow(['Expenses', report.count])
  const totalRow = summary.addRow(['Total', Number(report.grandTotal)])
  totalRow.getCell(2).numFmt = '#,##0.00'
  summary.addRow([])
  summary.addRow(['Category', 'Count', 'Total (INR)'])
  for (const slice of report.slices) {
    const row = summary.addRow([slice.category, slice.count, Number(slice.total)])
    row.getCell(3).numFmt = '#,##0.00'
  }
  summary.getRow(1).font = { bold: true, size: 14 }
  summary.getRow(10).font = { bold: true }

  const details = workbook.addWorksheet('Expenses')
  details.getColumn(1).width = 14
  details.getColumn(2).width = 18
  details.getColumn(3).width = 40
  details.getColumn(4).width = 14
  details.getColumn(5).width = 12
  details.addRow(['Date', 'Category', 'Description', 'Amount', 'Currency'])
  details.getRow(1).font = { bold: true }
  for (const expense of report.rows || []) {
    const row = details.addRow([
      String(expense.date).slice(0, 10),
      expense.category,
      expense.description || '',
      Number(expense.amount),
      expense.currency || 'INR'
    ])
    row.getCell(4).numFmt = '#,##0.00'
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

module.exports = { workbookBuffer }
