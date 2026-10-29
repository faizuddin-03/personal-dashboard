import { test } from '@playwright/test';
import { openEautoContext, eAutoPage } from '../utils/savedBrowser';
import { SCENARIOS_12257 } from '../data/scenarios';
import { runChain } from '../utils/chain';
import { trackPage, writeFocusTimeline } from '../utils/focusTimeline';

// EAINT-12257 — official TS v23 (QATeam SharePoint, 2026-10-22): 12257_TS01–TS13.
// Same onboarding chain as 12153 (utils/chain.ts); TS1–TS5 pay by DuitNow QR,
// scanned by the run on Fiuu's viewqr page (utils/qrLeg.ts). DuitNow QR reached staging
// on 2026-10-22 (screens not captured yet); FPX (B2B) has not, so TS10 stops there.
// TS11–TS13 are the payment-retry TS (added to the official sheet in v23,
// 2026-10-22); they pay by DuitNow QR too.

test.describe.configure({ mode: 'serial' });

for (const sc of SCENARIOS_12257) {
  test(sc.title, async ({ browser }) => {
    test.info().annotations.push({ type: 'sheet', description: sc.sheet });
    // The eAuto browser is our own context, recording into its own folder: the
    // fixture page's recordings are renamed by Playwright when the test ends, so
    // the one-recording join could not find them (2026-10-22: the eAuto form and
    // payment pages were missing from 12257_TS01.mp4).
    // Saved profile kept between runs: the reCAPTCHA is ticked only when eAuto asks again.
    const ctx = await openEautoContext(browser, test.info().outputPath('eauto-video'));
    const page = await eAutoPage(ctx);
    trackPage(page, 'eAuto');
    try {
      await runChain(browser, page, sc);
    } catch (e) {
      // The fixture's failure screenshot only covers its own page, so take ours.
      const shot = test.info().outputPath('test-failed-eauto.png');
      const last = ctx.pages().filter(p => !p.isClosed()).pop();
      if (last && await last.screenshot({ path: shot }).then(() => true).catch(() => false)) {
        await test.info().attach('screenshot', { path: shot, contentType: 'image/png' });
      }
      throw e;
    } finally {
      // One recording that follows the action across every window (run route joins them).
      await writeFocusTimeline();
      await ctx.close();
    }
  });
}
