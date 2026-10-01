const CATEGORIES = Object.freeze(['Food/Snacks', 'Travel', 'Groceries', 'UPI'])

class HttpError extends Error {
  constructor (status, message) {
    super(message)
    this.status = status
  }
}

function localToday (now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function parseDate (value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const text = String(value ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [year, month, day] = text.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) return null
  return text
}

function addDays (iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

/**
 * Day is the anchor date. Week is the Monday–Sunday week containing it.
 * Month is the calendar month containing it.
 */
function periodBounds (period, anchor, today = localToday()) {
  const normalized = {
    day: 'day',
    daily: 'day',
    week: 'week',
    weekly: 'week',
    month: 'month',
    monthly: 'month'
  }[String(period || '').toLowerCase()]
  if (!normalized) throw new HttpError(400, 'Period must be day, week, or month')

  const day = parseDate(anchor || today)
  if (!day) throw new HttpError(400, 'Anchor must be a calendar date (YYYY-MM-DD)')

  if (normalized === 'day') {
    return { period: 'day', anchor: day, fromDate: day, toDate: day }
  }
  if (normalized === 'week') {
    const [year, month, date] = day.split('-').map(Number)
    const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay()
    const mondayOffset = (weekday + 6) % 7
    const fromDate = addDays(day, -mondayOffset)
    return { period: 'week', anchor: day, fromDate, toDate: addDays(fromDate, 6) }
  }
  const [year, month] = day.split('-').map(Number)
  const fromDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const toDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { period: 'month', anchor: day, fromDate, toDate }
}

function round2 (value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function assertAmount (amount) {
  const number = typeof amount === 'number' ? amount : Number(String(amount).trim())
  if (!Number.isFinite(number) || number <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero')
  }
  if (number > 9999999999.99) throw new HttpError(400, 'Amount is too large')
  const cents = Math.round(number * 100)
  if (Math.abs(number * 100 - cents) > 1e-6) {
    throw new HttpError(400, 'Amount can have at most two decimal places')
  }
  return cents / 100
}

function normalizeExpense (data, { partial = false, today = localToday() } = {}) {
  if (!data || typeof data !== 'object') throw new HttpError(400, 'Expense details are required')

  const has = (key) => Object.prototype.hasOwnProperty.call(data, key)
  if (!partial || has('category')) {
    if (!CATEGORIES.includes(data.category)) {
      throw new HttpError(400, `Category must be one of: ${CATEGORIES.join(', ')}`)
    }
  }

  if (!partial || has('amount')) {
    if (data.amount === undefined || data.amount === null || data.amount === '') {
      throw new HttpError(400, 'Amount must be greater than zero')
    }
    data.amount = assertAmount(data.amount)
  }

  if (!partial || has('date')) {
    if ((data.date === undefined || data.date === null || data.date === '') && !partial) {
      data.date = today
    }
    if (data.date !== undefined && data.date !== null && data.date !== '') {
      const day = parseDate(data.date)
      if (!day) throw new HttpError(400, 'Date must be a calendar date (YYYY-MM-DD)')
      data.date = day
    } else if (partial) {
      throw new HttpError(400, 'Date must be a calendar date (YYYY-MM-DD)')
    }
  }

  if (has('description') && data.description != null) {
    const text = String(data.description).trim()
    if (text.length > 120) throw new HttpError(400, 'Description must be 120 characters or fewer')
    data.description = text || null
  }

  data.currency = 'INR'
  return data
}

function summarize (rows) {
  const buckets = new Map(CATEGORIES.map((category) => [category, { category, total: 0, count: 0 }]))
  for (const row of rows) {
    if (!buckets.has(row.category)) {
      buckets.set(row.category, { category: row.category, total: 0, count: 0 })
    }
    const bucket = buckets.get(row.category)
    bucket.total += Number(row.amount)
    bucket.count += 1
  }
  const slices = CATEGORIES.map((category) => {
    const bucket = buckets.get(category)
    return { category, total: round2(bucket.total), count: bucket.count }
  })
  for (const [category, bucket] of buckets) {
    if (!CATEGORIES.includes(category)) {
      slices.push({ category, total: round2(bucket.total), count: bucket.count })
    }
  }
  const grandTotal = round2(slices.reduce((sum, slice) => sum + slice.total, 0))
  return { grandTotal, count: rows.length, slices }
}

module.exports = {
  CATEGORIES,
  HttpError,
  localToday,
  parseDate,
  periodBounds,
  normalizeExpense,
  summarize
}
