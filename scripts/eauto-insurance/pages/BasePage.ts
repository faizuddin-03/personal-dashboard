import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';

// ── Shared helpers every page object extends ───────────────
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Poll until "Working..." text disappears from the page. */
  protected async waitForWorkingDone(): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < CONFIG.maxWaitForResult) {
      const text = await this.page.locator('body').innerText().catch(() => '');
      if (!text.includes('Working...')) return;
      await this.page.waitForTimeout(CONFIG.pollingInterval);
    }
    console.log('   ⚠️ Timed out waiting for Working...');
  }

  /** Poll until a condition is true on the page (or maxWait elapses). */
  protected async waitForCondition(
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

  protected async bodyText(): Promise<string> {
    return this.page.locator('body').innerText().catch(() => '');
  }

  async settleAfterLoad(): Promise<void> {
    await this.page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }

  /**
   * Dismiss eAuto campaign/notification banners (ids change per campaign, and
   * there can be several stacked — two is the normal case landing on the UCD
   * home page after login). Closes them one per round until none remain, so a
   * second banner revealed by closing the first still gets handled. Safe
   * no-op when nothing is showing.
   *
   * Ported from `scripts/eauto-estm/utils/session.ts` (`closeBanners`), which
   * this suite had none of — `[from Faizuddin, 2026-08-18]`. That suite fights
   * the exact same banners on the exact same UCD chrome, so match its
   * selectors rather than re-deriving them: `[class*="dialog-campaign"]` is
   * the important one, since the Merdeka banner is an
   * `<img class="dialog-campaign-1 dialog-campaign-frame">` with no matching
   * id, and a second stacked banner is `dialog-campaign-2` — the class prefix
   * catches every one regardless of how many are stacked.
   *
   * ⚠️ **`#dialog-campaign-close-btn`, `.close-btn`, and even the "×" text
   * closer are all DUPLICATE-id / DUPLICATE-match traps here.** Both
   * `#dialog-raya-campaign` and `#dialog-merdeka-campaign` carry
   * `<span id="dialog-campaign-close-btn" class="close-btn">×</span>` —
   * identical id, identical class, identical text — with Raya's copy first in
   * DOM order and `display:none`
   * (`_reference/html/eauto/home-with-merdeka-and-raya-banners.html`,
   * `[verified: live HTML, 2026-08-18]`). A bare `.first().isVisible()` on any
   * of those three always resolves to Raya's hidden copy and reports false,
   * even while Merdeka is genuinely on screen — the same trap
   * `[id$="-campaign"]` falls into in `CONTAINERS` below. The `:visible`
   * suffix (a Playwright extension, not standard CSS) fixes it by filtering to
   * rendered elements before `.first()` picks one, so this stops relying on
   * the brute-force DOM-hiding fallback further down to get there eventually.
   */
  async dismissBanners(maxRounds = 8): Promise<number> {
    const CONTAINERS = ['[class*="dialog-campaign"]', '[id$="-campaign"]', '.modal-campaign', '#eautoPopupOverlay', '[role="dialog"]', '.modal.in', '.modal.show', '.swal2-container', '[class*="popup"]']
      .map((sel) => `${sel}:visible`);
    const CLOSERS = ['#dialog-campaign-close-btn', '.close-btn', '[class*="campaign-close"]', '[aria-label="Close"]', '[data-dismiss="modal"]', '.swal2-close', 'button.close', '.close']
      .map((sel) => `${sel}:visible`);

    // Give a banner a moment to render, but don't stall when there is none.
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
        // Nothing matched a known close control — hide the overlay outright
        // rather than leave it eating clicks. An <img> banner sits inside an
        // overlay that keeps intercepting pointer events even if only the
        // image is hidden, so walk up to the modal ancestor first.
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

    if (closed) console.log(`   🧹 Dismissed ${closed} banner/popup(s).`);
    return closed;
  }
}
