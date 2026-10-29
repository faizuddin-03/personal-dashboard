import { test as base, Page } from '@playwright/test';
import { EstmSession } from '../utils/session';
import { OVERLAY_INIT_SCRIPT } from '../utils/overlay';
import { getRequiredInputs, EstmInputs } from '../data/config';
import { LoginPage } from '../pages/LoginPage';

// ── eSTM session fixture ────────────────────────────────────
// Validates inputs, injects the spotlight overlay into every page in the
// context, builds the shared EstmSession, and logs in. The spec then drives
// the flow through page objects and reads like the test case it is.
type EstmFixtures = {
  inputs: EstmInputs;
  session: EstmSession;
  loggedInPage: Page;
};

export const test = base.extend<EstmFixtures>({
  inputs: async ({}, use) => {
    await use(getRequiredInputs());
  },

  session: async ({ page }, use) => {
    await page.context().addInitScript(OVERLAY_INIT_SCRIPT);
    await use(new EstmSession(page.context(), page));
  },

  loggedInPage: async ({ page, session, inputs }, use) => {
    const login = new LoginPage(page, session);
    await login.login(inputs);
    await use(page);
  },
});

export { expect } from '@playwright/test';
