import type { Page } from '@playwright/test';

/**
 * localStorage flags gating the UCD home dialog chain. Setting them all before
 * load means no popup ever opens — far more reliable than close-button loops.
 * Note the asymmetry: campaign flags open only when === "true", while
 * homeAnnouncement / homeStmsCancellationReminder open unless != "false".
 *
 * ⚠️ **The campaign flags (`homemerdekacampaign`, `homerayacampaign`) do NOT
 * actually work.** The shared dialog-chain script sets them to `"true"`
 * unconditionally on every page load, overwriting whatever this init script
 * set — see `_reference/html/eauto/home-with-merdeka-and-raya-banners.html`.
 * `[verified: live HTML, 2026-08-18]` Kept in the list anyway: it costs
 * nothing, and a future build might make the flag actually stick. The real
 * defence against these two is `dismissBanners()` below, run after every
 * navigation that can show them — which, for the insurance flow, is BOTH the
 * home landing after login AND the Insurance page itself, since the same
 * dialog-chain script runs there too.
 */
const POPUP_FLAGS = [
  'dialog-websocket', 'dialog-eastcoast', 'homemerdekacampaign',
  'homerayacampaign', 'homecnycampaign', 'homeEInvoiceReminder',
  'homeAnnouncement', 'homeStmsCancellationReminder',
];

export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Must run before the first navigation, so the flags are set on load. */
  static async suppressPopups(page: Page): Promise<void> {
    await page.addInitScript((keys: string[]) => {
      try { for (const k of keys) window.localStorage.setItem(k, 'false'); } catch { /* ignore */ }
    }, POPUP_FLAGS);
  }

  step(message: string): void {
    console.log(`[step] ${message}`);
  }

  /**
   * Campaign banners on transaction pages aren't covered by the home* flags,
   * and more than one can stack. Best-effort, never fails a test.
   *
   * ⚠️ **`#dialog-campaign-close-btn` is a DUPLICATE id** — both
   * `#dialog-raya-campaign` and `#dialog-merdeka-campaign` use it on their own
   * close button, Raya's copy first in DOM order
   * (`_reference/html/eauto/home-with-merdeka-and-raya-banners.html`).
   * `page.locator('#dialog-campaign-close-btn').first()` therefore always
   * resolves to RAYA's button — even when Raya is `display:none` and Merdeka
   * is the one actually on screen. `.isVisible()` on that stale match reports
   * false, the loop concludes nothing is showing, and returns having clicked
   * nothing while a banner sits over the page. `[verified by breaking it,
   * 2026-08-18]` The `:visible` suffix (a Playwright extension, not standard
   * CSS) fixes it by filtering to elements that are actually rendered before
   * `.first()` picks one — see knowledge/flow-ucd-shell.md § duplicate ids.
   */
  async dismissBanners(rounds = 3): Promise<void> {
    const closers = [
      '#dialog-campaign-close-btn', '[class*="campaign-close"]',
      '[aria-label="Close"]', '[data-dismiss="modal"]', 'button.close',
    ].map((sel) => `${sel}:visible`).join(', ');
    for (let i = 0; i < rounds; i++) {
      const btn = this.page.locator(closers).first();
      // count() returns immediately; a bare click would burn the full
      // actionTimeout on every absent element.
      if (!(await btn.count())) return;
      await btn.click({ timeout: 5_000 }).catch(() => { /* ignore */ });
      await this.page.waitForTimeout(400);
    }
  }
}
