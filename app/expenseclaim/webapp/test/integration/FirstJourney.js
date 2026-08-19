sap.ui.define([], function () {
    'use strict';

    return {
        run: function () {
            QUnit.module('Manage Travel Expenses journey');

            opaTest('Application starts and the list page is shown', function (Given, When, Then) {
                Given.iStartMyApp();
                Then.onTheListPage.iSeeThisPage();
            });

            opaTest('Searching returns rows', function (Given, When, Then) {
                When.onTheListPage.onFilterBar().iExecuteSearch();
                Then.onTheListPage.onTable().iCheckRows();
            });

            opaTest('Selecting a row opens the object page', function (Given, When, Then) {
                When.onTheListPage.onTable().iPressRow(0);
                Then.onTheObjectPage.iSeeThisPage();
            });

            opaTest('Teardown', function (Given, When, Then) {
                Given.iTearDownMyApp();
            });
        }
    };
});
