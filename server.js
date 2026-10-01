const fs = require('node:fs')
const path = require('node:path')
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
const MYEXPENSES_HTML = fs.readFileSync(path.join(__dirname, 'app/myexpenses/webapp/index.html'))

cds.on('bootstrap', (app) => {
  const sendApp = (_req, res) => {
    res.set('Cache-Control', 'no-store')
    res.type('html').send(MYEXPENSES_HTML)
  }
  // Same document as the freestyle app, including when BAS opens / or launchpad.html.
  app.get(['/', '/index.html', '/launchpad.html', MYEXPENSES], sendApp)
  // The travel Fiori app is gone. Do not serve a cached Component.js from that path.
  app.use('/expenseclaim', (req, res) => {
    res.set('Cache-Control', 'no-store')
    const target = req.path || '/'
    if (target === '/' || target.endsWith('/') || target.endsWith('.html')) {
      res.redirect(302, MYEXPENSES)
      return
    }
    res.status(404).type('text/plain').send('Not found')
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
