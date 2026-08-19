const { wdi5 } = require('wdio-ui5-service');

describe('Manage Travel Expenses', () => {
    before(async () => {
        await browser.goTo('/expenseclaim/webapp/index.html');
    });

    it('bootstraps the Fiori elements app', async () => {
        const title = await browser.getTitle();
        expect(title).toContain('Manage Travel Expenses');
    });

    it('renders the list report table', async () => {
        const table = await browser.asControl({
            selector: {
                controlType: 'sap.ui.mdc.Table',
                viewName: 'sap.fe.templates.ListReport.ListReport',
                id: { id: 'ExpenseClaimsList' },
                searchOpenDialogs: false
            }
        });
        expect(await table.isInitialized()).toBeTruthy();
    });

    it('serves data over OData', async () => {
        const response = await fetch(
            `${browser.options.baseUrl}/odata/v4/travel/ExpenseClaims`
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body.value)).toBe(true);
    });
});
