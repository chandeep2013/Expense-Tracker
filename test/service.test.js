const cds = require('@sap/cds')
const { expect, GET, POST } = cds.test(__dirname + '/..')

// CAP's mocked users are available in development profiles.
const opts = { auth: { username: 'alice', password: '' } }

describe('travel-expense service', () => {
  describe('TravelService', () => {
    it('serves $metadata', async () => {
      const { status, data } = await GET('/odata/v4/travel/$metadata', opts)
      expect(status).to.equal(200)
      expect(data).to.include('EntityContainer')
    })

    it('exposes draft-enabled entities', async () => {
      const { data } = await GET('/odata/v4/travel/$metadata', opts)
      expect(data).to.include('IsActiveEntity')
    })

    describe('ExpenseClaims', () => {
      it('is queryable', async () => {
        const { status, data } = await GET('/odata/v4/travel/ExpenseClaims', opts)
        expect(status).to.equal(200)
        expect(data.value).to.be.an('array')
      })

      it('has its sample data loaded', async () => {
        const { data } = await GET('/odata/v4/travel/ExpenseClaims', opts)
        expect(data.value.length).to.be.greaterThan(0)
        const numbers = data.value.map((row) => row.claimNumber)
        expect(numbers).to.include('EX-000001')
      })
    })

    describe('ExpenseItems', () => {
      it('is queryable', async () => {
        const { status, data } = await GET('/odata/v4/travel/ExpenseItems', opts)
        expect(status).to.equal(200)
        expect(data.value).to.be.an('array')
      })

      it('has its sample data loaded', async () => {
        const { data } = await GET('/odata/v4/travel/ExpenseItems', opts)
        expect(data.value.length).to.be.greaterThan(0)
      })
    })

    describe('CostCentres', () => {
      it('is queryable', async () => {
        const { status, data } = await GET('/odata/v4/travel/CostCentres', opts)
        expect(status).to.equal(200)
        expect(data.value).to.be.an('array')
      })

      it('has its sample data loaded', async () => {
        const { data } = await GET('/odata/v4/travel/CostCentres', opts)
        expect(data.value.length).to.be.greaterThan(0)
      })

      it('rejects creates because it is read-only', async () => {
        try {
          await POST(
            '/odata/v4/travel/CostCentres',
            { code: 'CC-9999', name: 'Blocked' },
            opts
          )
          expect.fail('expected CostCentres create to be rejected')
        } catch (err) {
          expect(err.status || err.code).to.be.oneOf([400, 403, 405])
        }
      })
    })
  })
})
