import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { AnnouncementBannerPage, BannerCheckResult } from '../pages/AnnouncementBannerPage';

// ── AM_TS1-4: Announcement Message (EAINT-9306) ──
// All 4 rows of the test plan's "Announcement Message" table check the SAME
// compliance banner (message + red + bold), just on 4 screens/states — a
// pure navigate-and-check flow with no transaction to create, so all 4 run
// in one pass instead of one spec each:
//   AM_TS1 — AATF home
//   AM_TS2 — eDEREG menu (after clicking DEREGISTRATION)
//   AM_TS3 — Create Deregistration Transaction, Kategori ID (after clicking
//            CREATE DEREGISTRATION TRANSACTION)
//   AM_TS4 — same page, WITH the category-confirmation popup open (after
//            clicking the MyKad category) — banner must stay visible
//            underneath. Dismissed via "TIDAK" (No) afterward — this test
//            never needs a real transaction, just the 4 checks.
//
// Selectors for AM_TS1-3 confirmed from live HTML (EAINT-9306-aatf-home-and-
// menu.html, ...-dereg-create-category-select.html, both captured
// 2026-08-21). AM_TS4's "still visible under the popup" state was never
// captured as real HTML — the banner div sits outside the jQuery UI dialog,
// so it should stay in the DOM, but that's unconfirmed until this runs live.
//
// NEVER RUN LIVE.
test('Announcement Message — AM_TS1-4', async ({ loggedInPage: page, session }) => {
  test.setTimeout(4 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const banner = new AnnouncementBannerPage(page, session);
  const results: BannerCheckResult[] = [];

  // AM_TS1 — AATF home (already here right after login).
  results.push(await banner.checkBanner('AM_TS1', 'AATF home'));

  // AM_TS2 — eDEREG menu.
  let p = await session.waitForActivePage();
  await p.locator('#DEREGISTRATION').click();
  await session.waitForDomReady();
  await session.closeBanners();
  results.push(await banner.checkBanner('AM_TS2', 'eDEREG menu'));

  // AM_TS3 — Create Deregistration Transaction, Kategori ID.
  p = await session.waitForActivePage();
  await p.locator('#deregTransaction').click();
  await session.waitForDomReady();
  await session.closeBanners();
  results.push(await banner.checkBanner('AM_TS3', 'Create Deregistration Transaction (Kategori ID)'));

  // AM_TS4 — same page, category-confirmation popup open (MyKad category).
  // No native confirm() here, just the jQuery UI popup — clicked directly
  // rather than via session.confirmDialog() since that helper CONFIRMS the
  // dialog, and this check needs it open, not closed.
  p = await session.waitForActivePage();
  await p.getByRole('link', { name: 'Orang Awam Malaysia (MyKad)' }).click();
  const popup = p.locator('.ui-dialog:visible').last();
  const popupOpened = await popup.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the category-confirmation popup after selecting MyKad, none appeared.');
  results.push(await banner.checkBanner('AM_TS4', 'Create Deregistration Transaction (Kategori ID), with popup open'));

  // Cancel out — this test never needs a real transaction.
  await popup.getByRole('button', { name: 'TIDAK' }).click({ timeout: 10_000 }).catch(() => {
    console.log('WARNING: could not dismiss the category-confirmation popup via TIDAK.');
  });

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: results.every(r => r.visible && r.textMatches && r.isRed && r.isBold) ? 'SUCCESS' : 'FAIL',
    tsNo: 'AM_TS1-4',
    checks: results,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
