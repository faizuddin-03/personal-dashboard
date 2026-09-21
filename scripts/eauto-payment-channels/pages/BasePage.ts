import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';

// ── Shared helpers every page object extends ───────────────
// Ported from scripts/eauto-company-checker/pages/BasePage.ts (banner
// dismissal — same UCD chrome, same trap) plus the poll()/wait() shorthands
// from scripts/secarang-insurance/pages/BasePage.ts, since this script also
// ports the FPX/Fiuu sandbox chain from that script.
export class BasePage {
  constructor(protected readonly page: Page) {}

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async settleAfterLoad(): Promise<void> {
    await this.page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }

  /** Poll until a condition is true on the page (or maxWait elapses). */
  protected async poll(
    checkFn: () => Promise<boolean>,
    maxWait: number = CONFIG.maxWaitForResult,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      if (await checkFn()) return true;
      await this.page.waitForTimeout(CONFIG.pollingInterval);
    }
    return false;
  }

  /**
   * Dismiss eAuto campaign/notification banners. See
   * scripts/eauto-insurance/pages/BasePage.ts for the full trap writeup
   * (duplicate ids across stacked banners) — same selectors here verbatim.
   */
  async dismissBanners(maxRounds = 8): Promise<number> {
    const CONTAINERS = ['[class*="dialog-campaign"]', '[id$="-campaign"]', '.modal-campaign', '#eautoPopupOverlay', '[role="dialog"]', '.modal.in', '.modal.show', '.swal2-container', '[class*="popup"]']
      .map((sel) => `${sel}:visible`);
    const CLOSERS = ['#dialog-campaign-close-btn', '.close-btn', '[class*="campaign-close"]', '[aria-label="Close"]', '[data-dismiss="modal"]', '.swal2-close', 'button.close', '.close']
      .map((sel) => `${sel}:visible`);

    let found = false;
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && !found) {
      if (this.page.isClosed()) return 0;
      for (const sel of CONTAINERS) {
        if (await this.page.locator(sel).first().count()) { found = true; break; }
      }
      if (!found) await this.page.waitForTimeout(200);
    }
    if (!found) return 0;

    let closed = 0;
    for (let round = 0; round < maxRounds; round++) {
      if (this.page.isClosed()) break;

      let visible = false;
      for (const sel of CONTAINERS) {
        if (await this.page.locator(sel).first().count()) { visible = true; break; }
      }
      if (!visible) break;

      let clicked = false;
      for (const sel of CLOSERS) {
        const el = this.page.locator(sel).first();
        if (await el.count()) {
          await el.click({ force: true }).catch(() => {});
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        for (const text of ['×', '✕', 'Close', 'OK', 'Got it', 'Dismiss', 'Tutup']) {
          const el = this.page.locator(`button:has-text("${text}"):visible, span:has-text("${text}"):visible, a:has-text("${text}"):visible`).first();
          if (await el.count()) {
            await el.click({ force: true }).catch(() => {});
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) {
        await this.page.evaluate(() => {
          const isOverlay = (el: HTMLElement) =>
            getComputedStyle(el).position === 'fixed' ||
            /modal|dialog|overlay|popup|campaign/i.test(el.className || '');

          document.querySelectorAll<HTMLElement>('[class*="dialog-campaign"], [id$="-campaign"], .modal-campaign, #eautoPopupOverlay, [class*="popup"]').forEach((el) => {
            let node: HTMLElement = el;
            for (let i = 0; i < 6; i++) {
              const parent = node.parentElement;
              if (!parent || parent === document.body || !isOverlay(parent)) break;
              node = parent;
            }
            node.style.display = 'none';
            node.style.visibility = 'hidden';
            node.style.pointerEvents = 'none';
          });
          document.querySelectorAll<HTMLElement>('.modal-backdrop').forEach((el) => el.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }).catch(() => {});
      }
      closed++;
      await this.page.waitForTimeout(400);
    }

    return closed;
  }
}
