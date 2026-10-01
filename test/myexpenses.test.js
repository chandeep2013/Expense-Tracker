process.env.NODE_ENV = 'test'
const cds = require('@sap/cds')
const ExcelJS = require('exceljs')
const { expect, GET, POST, PATCH, DELETE } = cds.test(__dirname + '/..')
const { periodBounds, localToday } = require('../srv/lib/expenses')

const alice = { auth: { username: 'alice', password: '' } }
const bob = { auth: { username: 'bob', password: '' } }

async function statusOf (promise) {
  try {
    const response = await promise
    return response.status
  } catch (err) {
    return err.status || err.response?.status
  }
}

describe('MyExpenses', () => {
  describe('period bounds', () => {
    it('uses the calendar day', () => {
      expect(periodBounds('day', '2026-10-01')).to.deep.equal({
        period: 'day',
        anchor: '2026-10-01',
        fromDate: '2026-10-01',
        toDate: '2026-10-01'
      })
    })

    it('uses Monday to Sunday, including weeks that cross a month', () => {
      const week = periodBounds('weekly', '2026-10-01')
      expect(week.fromDate).to.equal('2026-09-28')
      expect(week.toDate).to.equal('2026-10-04')
      expect(periodBounds('week', '2026-09-28').fromDate).to.equal('2026-09-28')
      expect(periodBounds('week', '2026-10-04').toDate).to.equal('2026-10-04')
    })

    it('crosses the year boundary for early January', () => {
      const week = periodBounds('week', '2026-01-01')
      expect(week.fromDate).to.equal('2025-12-29')
      expect(week.toDate).to.equal('2026-01-04')
    })

    it('uses the calendar month, including a non-leap February', () => {
      expect(periodBounds('month', '2026-02-15')).to.include({
        fromDate: '2026-02-01',
        toDate: '2026-02-28'
      })
      expect(periodBounds('monthly', '2024-02-15').toDate).to.equal('2024-02-29')
    })

    it('rejects an unknown period', () => {
      expect(() => periodBounds('year', '2026-10-01')).to.throw(/day, week, or month/)
    })
  })

  describe('ExpenseService', () => {
    let ownId

    before(async () => {
      const created = await POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-01',
        category: 'Food/Snacks',
        amount: 100.5,
        description: 'lunch',
        user: 'bob'
      }, alice)
      ownId = created.data.ID
      await POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-01',
        category: 'Travel',
        amount: 50,
        description: 'auto'
      }, alice)
      await POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-03',
        category: 'Groceries',
        amount: 80,
        description: 'milk'
      }, alice)
      await POST('/odata/v4/expenses/Expenses', {
        date: '2026-09-30',
        category: 'UPI',
        amount: 20,
        description: 'transfer'
      }, alice)
      await POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-31',
        category: 'Food/Snacks',
        amount: 10,
        description: 'snacks'
      }, alice)
      await POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-01',
        category: 'Food/Snacks',
        amount: 999,
        description: 'not alice'
      }, bob)
    })

    it('requires authentication', async () => {
      expect(await statusOf(GET('/odata/v4/expenses/Expenses'))).to.equal(401)
      expect(await statusOf(GET('/api/expenses/report.xlsx?period=day&anchor=2026-10-01'))).to.equal(401)
    })

    it('rejects an unknown category', async () => {
      expect(await statusOf(POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-01',
        category: 'Meal',
        amount: 10
      }, alice))).to.equal(400)
    })

    it('rejects a non-positive amount', async () => {
      expect(await statusOf(POST('/odata/v4/expenses/Expenses', {
        date: '2026-10-01',
        category: 'UPI',
        amount: 0
      }, alice))).to.equal(400)
    })

    it('stores the signed-in user and defaults the date', async () => {
      const { data } = await GET(`/odata/v4/expenses/Expenses(${ownId})`, alice)
      expect(data.user).to.equal('alice')
      expect(data.currency).to.equal('INR')
      expect(data.category).to.equal('Food/Snacks')

      const created = await POST('/odata/v4/expenses/Expenses', {
        category: 'UPI',
        amount: 15,
        description: 'default day'
      }, alice)
      expect(created.data.date).to.equal(localToday())
      expect(created.data.user).to.equal('alice')
      await DELETE(`/odata/v4/expenses/Expenses(${created.data.ID})`, alice)
    })

    it('shows a user only their own expenses', async () => {
      const { data } = await GET('/odata/v4/expenses/Expenses', bob)
      const descriptions = data.value.map((row) => row.description)
      expect(descriptions).to.include('not alice')
      expect(descriptions).to.not.include('lunch')
      expect(await statusOf(GET(`/odata/v4/expenses/Expenses(${ownId})`, bob))).to.equal(404)
    })

    it('stops a user editing someone else\'s expense', async () => {
      expect(await statusOf(PATCH(`/odata/v4/expenses/Expenses(${ownId})`, {
        amount: 1
      }, bob))).to.equal(403)
      const { data } = await GET(`/odata/v4/expenses/Expenses(${ownId})`, alice)
      expect(Number(data.amount)).to.equal(100.5)
    })

    it('lets a user update their own expense', async () => {
      const created = await POST('/odata/v4/expenses/Expenses', {
        date: '2026-08-01',
        category: 'Travel',
        amount: 12,
        description: 'edit me'
      }, alice)
      const updated = await PATCH(`/odata/v4/expenses/Expenses(${created.data.ID})`, {
        description: 'edited',
        amount: 14
      }, alice)
      expect(updated.status).to.equal(200)
      expect(updated.data.description).to.equal('edited')
      expect(Number(updated.data.amount)).to.equal(14)
      expect(updated.data.user).to.equal('alice')
    })

    it('lets a user delete their own expense', async () => {
      const created = await POST('/odata/v4/expenses/Expenses', {
        date: '2026-08-02',
        category: 'Groceries',
        amount: 9,
        description: 'delete me'
      }, alice)
      expect(await statusOf(DELETE(`/odata/v4/expenses/Expenses(${created.data.ID})`, bob))).to.equal(403)
      const removed = await DELETE(`/odata/v4/expenses/Expenses(${created.data.ID})`, alice)
      expect(removed.status).to.equal(204)
    })

    it('totals a day, week, and month by category for the signed-in user', async () => {
      const day = await GET("/odata/v4/expenses/getReport(period='day',anchor=2026-10-01)", alice)
      expect(day.data.period).to.equal('day')
      expect(day.data.fromDate).to.equal('2026-10-01')
      expect(day.data.toDate).to.equal('2026-10-01')
      expect(Number(day.data.grandTotal)).to.be.closeTo(150.5, 0.001)
      expect(day.data.count).to.equal(2)
      const dayFood = day.data.slices.find((slice) => slice.category === 'Food/Snacks')
      const dayUpi = day.data.slices.find((slice) => slice.category === 'UPI')
      expect(Number(dayFood.total)).to.be.closeTo(100.5, 0.001)
      expect(dayFood.count).to.equal(1)
      expect(Number(dayUpi.total)).to.equal(0)

      const week = await GET("/odata/v4/expenses/getReport(period='week',anchor=2026-10-01)", alice)
      expect(week.data.fromDate).to.equal('2026-09-28')
      expect(week.data.toDate).to.equal('2026-10-04')
      expect(Number(week.data.grandTotal)).to.be.closeTo(250.5, 0.001)
      expect(week.data.count).to.equal(4)

      const month = await GET("/odata/v4/expenses/getReport(period='month',anchor=2026-10-01)", alice)
      expect(month.data.fromDate).to.equal('2026-10-01')
      expect(month.data.toDate).to.equal('2026-10-31')
      expect(Number(month.data.grandTotal)).to.be.closeTo(240.5, 0.001)
      expect(month.data.count).to.equal(4)
      const monthFood = month.data.slices.find((slice) => slice.category === 'Food/Snacks')
      expect(Number(monthFood.total)).to.be.closeTo(110.5, 0.001)

      const bobDay = await GET("/odata/v4/expenses/getReport(period='day',anchor=2026-10-01)", bob)
      expect(Number(bobDay.data.grandTotal)).to.equal(999)
      expect(bobDay.data.count).to.equal(1)
    })

    it('rejects an unknown report period', async () => {
      expect(await statusOf(GET("/odata/v4/expenses/getReport(period='year',anchor=2026-10-01)", alice))).to.equal(400)
    })

    it('reports whether the user logged a given day', async () => {
      const yes = await GET('/odata/v4/expenses/loggedOn(day=2026-10-01)', alice)
      const no = await GET('/odata/v4/expenses/loggedOn(day=2020-01-01)', alice)
      const value = (payload) => (payload && typeof payload === 'object' && 'value' in payload ? payload.value : payload)
      expect(value(yes.data)).to.equal(true)
      expect(value(no.data)).to.equal(false)
    })

    it('downloads the current report as an Excel workbook', async () => {
      const response = await GET('/api/expenses/report.xlsx?period=month&anchor=2026-10-01', {
        ...alice,
        responseType: 'arraybuffer'
      })
      expect(response.status).to.equal(200)
      expect(response.headers['content-type']).to.include('spreadsheetml.sheet')
      const buffer = Buffer.from(response.data)
      expect(buffer.subarray(0, 2).toString()).to.equal('PK')

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const summary = workbook.getWorksheet('Summary')
      expect(summary.getCell('A1').value).to.equal('MyExpenses report')
      const details = workbook.getWorksheet('Expenses')
      const categories = []
      details.eachRow((row, index) => {
        if (index > 1) categories.push(row.getCell(2).value)
      })
      expect(categories).to.include('Food/Snacks')
      expect(categories).to.include('Groceries')
      expect(categories).to.not.include('not alice')
    })
  })
})
