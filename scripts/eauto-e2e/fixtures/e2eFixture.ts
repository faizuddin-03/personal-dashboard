import { test as base, Page } from '@playwright/test';
import { CONFIG } from '../data/config';
import { OVERLAY_INIT_SCRIPT } from '../utils/overlay';
import { E2EReporter } from '../utils/reporting';
import { LoginPage } from '../pages/LoginPage';

// ── E2E session fixture ─────────────────────────────────────
// One place that: validates required inputs, injects the video overlay,
// builds the shared reporter, and logs in via LoginPage. The spec receives
// a ready page + reporter and reads like the test case it is.
type E2EFixtures = {
  reporter: E2EReporter;
  loggedInPage: Page;
};

export const test = base.extend<E2EFixtures>({
  reporter: async ({}, use, testInfo) => {
    const reporter = new E2EReporter(CONFIG.artifactDir, { vehicleNo: CONFIG.vehicleNo, env: CONFIG.env });
    reporter.info(`━━━ UCD Insurance E2E ━━━`);
    reporter.info(`   Env=${CONFIG.env}  VN=${CONFIG.vehicleNo}  IC=${CONFIG.ic}  Insurer=${CONFIG.insurer}  Coverage=${CONFIG.coverage}`);
    reporter.info(`   Email=${CONFIG.email}  Bank=${CONFIG.bank}  StopBeforePayment=${CONFIG.stopBeforePayment}`);
    void testInfo;
    await use(reporter);
  },

  loggedInPage: async ({ page, reporter }, use) => {
    const missing = (['vehicleNo', 'ic'] as const).filter((k) => !CONFIG[k]);
    if (missing.length) throw new Error(`Missing required input(s): ${missing.join(', ')}`);

    await page.addInitScript(OVERLAY_INIT_SCRIPT);
    const login = new LoginPage(page, reporter, CONFIG.artifactDir);
    await login.login();
    await use(page);
  },
});

export { expect } from '@playwright/test';
