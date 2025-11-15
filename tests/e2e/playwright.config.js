const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // diagnostics for CI failures
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'node server.js',
    port: 3000,
    timeout: 30 * 1000,
    reuseExistingServer: !process.env.CI,
  },
};
