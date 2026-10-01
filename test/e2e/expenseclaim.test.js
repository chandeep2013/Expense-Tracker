describe('MyExpenses', () => {
    before(async () => {
        await browser.goTo('/myexpenses/webapp/index.html');
    });

    it('bootstraps the freestyle app', async () => {
        const title = await browser.getTitle();
        expect(title).toContain('MyExpenses');
    });

    it('serves travel claims over OData', async () => {
        const response = await fetch(
            `${browser.options.baseUrl}/odata/v4/travel/ExpenseClaims`,
            { headers: { Authorization: 'Basic ' + Buffer.from('alice:').toString('base64') } }
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body.value)).toBe(true);
    });
});
