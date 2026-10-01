const cds = require('@sap/cds')
const { fetchReport, HttpError } = require('./srv/lib/report-data')
const { workbookBuffer } = require('./srv/lib/excel')

if (process.env.NODE_ENV !== 'production') {
  try {
    require('./scripts/ensure-sqlite').ensureSqlite()
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err
  }
}

const MYEXPENSES = '/myexpenses/webapp/index.html'

// These are the pages BAS and Fiori tools open. Registered before express.static.
const START_PAGES = [
  '/',
  '/index.html',
  '/launchpad.html',
  '/expenseclaim/webapp/index.html',
  '/expenseclaim/webapp/test/flp.html',
  '/expenseclaim/webapp/test/flpSandbox.html',
  '/expenseclaim/webapp/test/flpSandboxMockServer.html'
]

cds.on('bootstrap', (app) => {
  app.get(START_PAGES, (_req, res) => {
    res.set('Cache-Control', 'no-store')
    res.redirect(302, MYEXPENSES)
  })
})

cds.on('served', () => {
  // Auth runs on each OData path, so this download route mounts the same chain.
  cds.app.get('/api/expenses/report.xlsx', cds.middlewares.before, async (req, res, next) => {
    try {
      const user = cds.context?.user || req.user
      if (!user || user.id === 'anonymous' || user._is_anonymous) {
        res.set('WWW-Authenticate', 'Basic realm="Users"')
        res.status(401).json({ error: { message: 'Authentication required' } })
        return
      }
      const report = await fetchReport(user.id, req.query.period || 'month', req.query.anchor)
      const buffer = await workbookBuffer(report)
      const filename = `myexpenses-${report.period}-${report.anchor}.xlsx`
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.set('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(buffer)
    } catch (err) {
      if (err instanceof HttpError || err.status) {
        res.status(err.status).json({ error: { message: err.message } })
        return
      }
      next(err)
    }
  })
})

module.exports = cds.server
