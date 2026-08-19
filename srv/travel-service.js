const cds = require('@sap/cds')

const CLAIM_PREFIX = 'EX-'

function padClaimNumber(n) {
  return `${CLAIM_PREFIX}${String(n).padStart(6, '0')}`
}

function sumAmounts(items = []) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0)
}

class TravelService extends cds.ApplicationService {
  init() {
    const { ExpenseClaims, ExpenseItems } = this.entities

    this.before('CREATE', ExpenseClaims.drafts, async (req) => {
      if (!req.data.status) req.data.status = 'DRAFT'
      if (req.data.claimNumber) return

      const existing = await SELECT.from(ExpenseClaims).columns('claimNumber')
      const next = existing.reduce((max, row) => {
        const match = String(row.claimNumber || '').match(/^EX-(\d+)$/)
        if (!match) return max
        return Math.max(max, Number(match[1]))
      }, 0)
      req.data.claimNumber = padClaimNumber(next + 1)
    })

    this.before('SAVE', ExpenseClaims, async (req) => {
      const claimId = req.data.ID
      if (!claimId) return
      const items = await SELECT.from(ExpenseItems.drafts).where({ claim_ID: claimId })
      req.data.totalAmount = sumAmounts(items)
    })

    this.after(['CREATE', 'UPDATE', 'DELETE'], ExpenseItems.drafts, async (_data, req) => {
      const claimId = req.data?.claim_ID || req.params?.[0]?.claim_ID
      if (!claimId) return
      const items = await SELECT.from(ExpenseItems.drafts).where({ claim_ID: claimId })
      await UPDATE(ExpenseClaims.drafts, claimId).with({ totalAmount: sumAmounts(items) })
    })

    return super.init()
  }
}

module.exports = TravelService
