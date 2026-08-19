sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'expenseclaim/test/integration/FirstJourney',
        'expenseclaim/test/integration/pages/ExpenseClaimsList',
        'expenseclaim/test/integration/pages/ExpenseClaimsObjectPage'
    ],
    function (JourneyRunner, FirstJourney, ListPage, ObjectPage) {
        'use strict';

        var runner = new JourneyRunner({
            launchUrl: sap.ui.require.toUrl('expenseclaim') + '/index.html'
        });

        runner.run(
            {
                pages: {
                    onTheListPage: ListPage,
                    onTheObjectPage: ObjectPage
                }
            },
            FirstJourney.run
        );
    }
);
