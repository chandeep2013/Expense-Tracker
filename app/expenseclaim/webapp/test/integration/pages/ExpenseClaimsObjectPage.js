sap.ui.define(['sap/fe/test/ObjectPage'], function (ObjectPage) {
    'use strict';

    return new ObjectPage({
        appId: 'expenseclaim',
        componentId: 'ExpenseClaimsObjectPage',
        entitySet: 'ExpenseClaims'
    });
});
