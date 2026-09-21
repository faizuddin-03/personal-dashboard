import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout: 0,
  retries: 0,
  workers: 1,

  reporter: [['list']],

  use: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 60000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'on',

    // slowMo is LOAD-BEARING, not a debugging nicety. It is the setting the
    // original script has always run under, and without it the payment step
    // clicks the wrong "Next".
    //
    // The race: clicking #to-payment opens a jQuery UI dialog. The very next
    // call, clickNextButtonOrText(), asks `getByRole('button', {name:'Next'})
    // .count()` to decide between the dialog's button and a text match. With no
    // delay that count runs before jQuery has rendered the dialog, returns 0,
    // and the fallback `getByText('Next').first()` resolves to #to-payment —
    // the page's own control, first in DOM order and now disabled. Result:
    // "it clicked Next on the page but not on the popup", and the run parks.
    //
    // 600ms per action gives the dialog time to exist before that count. Copied
    // from the config the working script runs under
    // (_reference/automation code/eSTM (Nick's)/test1/playwright.config.ts:33).
    // Do not remove it to speed the run up — budget for it in the test timeout
    // instead.
    launchOptions: { slowMo: 600 },
  },

  projects: [
    {
      name: 'estm',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
  ],
});
