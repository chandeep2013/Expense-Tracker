const { join } = require('path');

exports.config = {
    runner: 'local',
    specs: ['./test/e2e/expenseclaim.test.js'],
    maxInstances: 1,
    capabilities: [
        {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: process.env.HEADLESS
                    ? ['--headless=new', '--disable-gpu', '--window-size=1600,1200']
                    : ['--window-size=1600,1200']
            }
        }
    ],
    logLevel: 'error',
    // Assumes `cds watch` is already serving on 4004.
    baseUrl: 'http://localhost:4004',
    waitforTimeout: 30000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['ui5'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 90000
    },
    wdi5: {
        logLevel: 'error',
        screenshotPath: join('test', 'e2e', '__screenshots__')
    }
};
