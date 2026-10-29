import { test as base, Page } from '@playwright/test';
import { PrecheckSession } from '../utils/session';
import { OVERLAY_INIT_SCRIPT, TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';
import { getRequiredInputs, PrecheckInputs, CONFIG } from '../data/config';
import { LoginPage } from '../pages/LoginPage';
import { resetVideoManifest } from '../utils/videoManifest';
import { clearWaitStatus } from '../utils/waitStatus';
import { resetPauseSignal } from '../utils/pauseSignal';

// ── eDereg Pre-Checking session fixture ─────────────────────
// Validates inputs, injects the spotlight overlay into every page in the
// context, builds the shared PrecheckSession, and logs in. The spec then
// drives the flow through PrecheckEnquiryPage and reads like the test case
// it is.
type PrecheckFixtures = {
  inputs: PrecheckInputs;
  session: PrecheckSession;
  loggedInPage: Page;
};

export const test = base.extend<PrecheckFixtures>({
  inputs: async ({}, use) => {
    await use(getRequiredInputs());
  },

  session: async ({ page, inputs }, use) => {
    // Reset BEFORE anything else in the test can open a sub-page (MyKad
    // emulator popup, BO context) — see utils/videoManifest.ts's own doc
    // comment for why this exists (every tab's video needs to be recorded
    // as evidence, not just whichever one the old code picked as "newest").
    resetVideoManifest();
    // Same reasoning — a stale wait-status marker from a previous run must
    // never leak into the dashboard's VPN reminder for this one.
    clearWaitStatus();
    // Same reasoning again — a stale pause/continue marker from a
    // previous run (or an abandoned one) must never leak into this one's
    // own dashboard-driven pause (utils/pauseSignal.ts).
    resetPauseSignal();

    await page.context().addInitScript(OVERLAY_INIT_SCRIPT);
    // Piloted 2026-08-27 on MU_TS1 first, per Faizuddin — see
    // utils/overlay.ts's own doc comment. Applies to the MAIN page/context
    // automatically for every test via this fixture; any test that opens
    // its OWN separate context (User B, BackOffice, etc.) needs its own
    // `context.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT)` call, since a
    // fresh context doesn't inherit this one's init scripts.
    await page.context().addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);

    // The Deregistration MyKad/thumbprint auth screens make the browser show
    // a permission prompt for whichever device API the widget uses to reach
    // the reader (real hardware or this emulator) — confirmed live
    // 2026-08-22, see knowledge/mykad-emulator.md § "Browser device
    // permission prompt". A fresh context has nothing granted, so this
    // shows every run and the page's own JS hangs waiting on it, since
    // nothing here can click a browser-chrome "Allow" button. Pre-granting
    // the plausible candidates avoids the prompt ever appearing. Harmless
    // to grant unconditionally, even for the pre-checking-only leg that
    // never touches MyKad.
    const origin = new URL(CONFIG.baseUrlFor(inputs.envSegment)).origin;
    await page.context().grantPermissions(
      ['camera', 'microphone', 'midi', 'midi-sysex'],
      { origin },
    ).catch(() => { /* best-effort — see knowledge doc if a prompt still appears */ });

    await use(new PrecheckSession(page.context(), page));
  },

  loggedInPage: async ({ page, session, inputs }, use) => {
    const login = new LoginPage(page, session);
    await login.login(inputs);
    await use(page);
  },
});

export { expect } from '@playwright/test';
