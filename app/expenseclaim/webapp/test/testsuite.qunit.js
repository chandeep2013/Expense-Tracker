window.suite = function () {
    'use strict';

    var suite = new parent.jsUnitTestSuite();
    var contextPath = location.pathname.substring(
        0,
        location.pathname.lastIndexOf('/test/') + 1
    );

    suite.addTestPage(contextPath + 'test/integration/opaTests.qunit.html');

    return suite;
};
