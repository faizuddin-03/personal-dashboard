const { defineConfig, devices } = require('@playwright/test');
require('./src/accounts'); // hydrate the shared credential store before anything reads it

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,          // one shared staging fixture — do not race it
  workers: 1,
  retries: 0,                    // a retry would re-attempt a spent extension (R1)
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  use: {
    baseURL: process.env.EAUTO_BASE || 'https://staging.eauto.my',
    viewport: { width: 1600, height: 1000 },
    trace: 'on',                 // traces are the evidence trail for QA runs
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // EV_HEADED=1 turns the assertion suite into something a reviewer can watch:
        // a real window on screen, a video per test whatever the verdict, and a
        // screenshot at the end of each. Off by default, because a headless run is
        // several times faster and the trace already carries screencast frames.
        //
        // This is NOT the evidence recorder. There is no annotation, no checklist and
        // no desktop capture here — the house-format take is `--project=evidence`, and
        // a scenario the recorder declares UNRECORDED (TS20, TS36, the API replays)
        // cannot be promoted to one by turning a video on. Say which of the two any
        // artefact came from when reporting it.
        headless: process.env.EV_HEADED === '1' ? false : undefined,
        video: process.env.EV_HEADED === '1' ? 'on' : undefined,
        screenshot: process.env.EV_HEADED === '1' ? 'on' : undefined,
      },
      // The recorders are opt-in and need TS=<ref>; left in the default project they
      // would throw on every plain `npm test` run.
      testIgnore: /9[01]-(evidence|e2e-creation)\.spec\.js/,
    },
    {
      // House-format evidence recorder. Full-desktop ffmpeg capture, so it owns the
      // screen: one worker, no retries (a retry would re-attempt a SPENT extension),
      // and a long timeout because a take includes the Excel leg.
      name: 'evidence',
      testMatch: /90-evidence\.spec\.js/,
      timeout: 20 * 60_000,
      retries: 0,
      use: {
        // NOT `...devices['Desktop Chrome']` — that preset carries a
        // deviceScaleFactor, and Playwright rejects any scale factor alongside a
        // null viewport ("deviceScaleFactor option is not supported with null
        // viewport"). The window is sized to the real display instead.
        browserName: 'chromium',
        // HEADED, non-negotiable. The first TS21 take inherited the default
        // headless:true, so there was no window at all — maximizeViaCDP and
        // pinOnTop both failed into their own catch blocks and ffmpeg recorded
        // the bare desktop (Microsoft Teams, for the whole take) while the
        // checklist reported 8/10. src/framing.js now fails the take on it, but
        // the setting is the actual fix.
        headless: false,
        launchOptions: { args: ['--start-maximized'] },
        viewport: null,          // maximized to the physical screen, not a CSS box
        video: 'off',            // ffmpeg records the desktop; Playwright's is viewport-only
        screenshot: 'off',
        trace: 'retain-on-failure',
      },
    },
    {
      // E2E SEGMENT 1 — the creation half, filmed from the reCAPTCHA gate.
      //
      // Its OWN project because the evidence project's testMatch is exact, and
      // because this take is a different animal: several contexts, three roles, and
      // THREE HUMAN GATES (one reCAPTCHA tick, two Fiuu logins). Nobody should
      // schedule it and walk away.
      //
      // The long timeout is not padding. A first build whose field map misses one
      // input waits for a person to fill it by hand, and 20 minutes has not been
      // enough for that. It spends no extension (R1), so the cost of overrunning is
      // time rather than a fixture.
      name: 'e2e-creation',
      testMatch: /91-e2e-creation\.spec\.js/,
      timeout: 75 * 60_000,
      retries: 0,
      use: {
        browserName: 'chromium',
        // HEADED for the same non-negotiable reason as the evidence project: the
        // human gates need a window, and a headless run would film the desktop while
        // reporting ticks. src/framing.js is checked before the first gate here.
        headless: false,
        launchOptions: { args: ['--start-maximized'] },
        viewport: null,
        video: 'off',            // ffmpeg records the desktop; Playwright's is viewport-only
        screenshot: 'off',
        trace: 'retain-on-failure',
      },
    },
  ],
});
