import { BrowserContext, Page, expect } from '@playwright/test';

/**
 * VERBATIM PORT of `scripts/eauto-estm/utils/session.ts`. `scripts/eauto-estm`
 * itself is untouched — this file exists ONLY because Playwright refuses to
 * load a second `@playwright/test` install in the same process
 * ("Requiring @playwright/test second time"), which blocked importing that
 * project's session helper directly. `[from Faizuddin, 2026-08-18]`
 *
 * Do NOT let this drift from the source without updating both — if the
 * original changes, port the change here too, and vice versa.
 *
 * ── original file header ──
 * The eSERAHAN flow repeatedly closes and reopens pages during redirects, so
 * no page handle stays valid for long. This helper always resolves the newest
 * live page in the context and centralises the resilience routines every step
 * needs (DOM-ready waits, popup dismissal, stubborn-checkbox toggling). It
 * holds NO business selectors — those live in the page objects.
 */
export class EstmSession {
  constructor(private readonly context: BrowserContext, private readonly fallback: Page) {}

  progress(step: string, label: string, status = 'done') {
    console.log('PROGRESS:' + JSON.stringify({ step, label, status }));
  }

  /** Newest non-closed page in the context. */
  active(): Page {
    const pages = this.context.pages().filter((p) => !p.isClosed());
    return pages[pages.length - 1] ?? this.fallback;
  }

  /** Poll until a stable active page is available, then wait for DOM readiness. */
  async waitForActivePage(timeoutMs = 8000): Promise<Page> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const p = this.active();
      if (p && !p.isClosed()) {
        await p.waitForLoadState('domcontentloaded').catch(() => {});
        if (!p.isClosed()) return p;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    return this.active();
  }

  async waitForDomReady(): Promise<void> {
    await this.active().waitForLoadState('domcontentloaded').catch(() => {});
  }

  /** Log the active page's URL against a tag. The runner captures stdout, so
   *  these lines are how a failed run gets diagnosed after the fact. */
  logUrl(tag: string): void {
    const p = this.active();
    console.log(`URL [${tag}]: ${p && !p.isClosed() ? p.url() : '(no live page)'}`);
  }

  /** Dismiss eAuto campaign/banner popups (ids change per campaign, and there
   *  can be several stacked). Closes them one per round until none remain, so
   *  a second banner revealed by closing the first is still handled. Safe
   *  no-op when nothing is showing. Returns how many it dismissed. */
  async closeBanners(maxRounds = 8): Promise<number> {
    const CONTAINERS = ['[class*="dialog-campaign"]', '[id$="-campaign"]', '.modal-campaign', '#eautoPopupOverlay', '[role="dialog"]', '.modal.in', '.modal.show', '.swal2-container', '[class*="popup"]'];
    const CLOSERS = ['#dialog-campaign-close-btn', '.close-btn', '[class*="campaign-close"]', '[aria-label="Close"]', '[data-dismiss="modal"]', '.swal2-close', 'button.close', '.close'];

    let found = false;
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && !found) {
      const ap = this.active();
      if (!ap || ap.isClosed()) break;
      for (const sel of CONTAINERS) {
        if (await ap.locator(sel).first().isVisible().catch(() => false)) { found = true; break; }
      }
      if (!found) await ap.waitForTimeout(200);
    }
    if (!found) return 0;

    let closed = 0;
    for (let round = 0; round < maxRounds; round++) {
      const ap = this.active();
      if (!ap || ap.isClosed()) break;

      let visible = false;
      for (const sel of CONTAINERS) {
        if (await ap.locator(sel).first().isVisible().catch(() => false)) { visible = true; break; }
      }
      if (!visible) break;

      let clicked = false;
      for (const sel of CLOSERS) {
        const el = ap.locator(sel).first();
        if (await el.isVisible().catch(() => false)) {
          await el.click({ force: true }).catch(() => {});
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        for (const text of ['×', '✕', 'Close', 'OK', 'Got it', 'Dismiss', 'Tutup']) {
          const el = ap.locator(`button:has-text("${text}"), span:has-text("${text}"), a:has-text("${text}")`).first();
          if (await el.isVisible().catch(() => false)) {
            await el.click({ force: true }).catch(() => {});
            clicked = true;
            break;
          }
        }
      }
      if (!clicked) {
        if (round === 0) {
          const markup = await ap.evaluate(() => {
            const el = document.querySelector('[class*="dialog-campaign"]');
            return el?.parentElement?.outerHTML?.slice(0, 1200) ?? '(no dialog-campaign element found)';
          }).catch(() => '(could not read markup)');
          console.log(`Banner wrapper markup (for selector work):\n${markup}`);
        }

        await ap.keyboard.press('Escape').catch(() => {});
        await ap.evaluate(() => {
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
      await ap.waitForTimeout(400);
    }

    if (closed) console.log(`Dismissed ${closed} banner/popup(s).`);
    return closed;
  }

  /** Back-compat alias — same behaviour as closeBanners(). */
  async closePopupIfPresent(): Promise<void> {
    await this.closeBanners();
  }

  /** Force a custom checkbox checked even when redirects disrupt normal clicks. */
  async ensureChecked(selector: string): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const p = await this.waitForActivePage();
      const cb = p.locator(selector);
      if (!(await cb.count().catch(() => 0))) return;
      if (await cb.isChecked().catch(() => false)) return;
      await cb.check({ force: true, timeout: 5000 }).catch(() => {});
      if (await cb.isChecked().catch(() => false)) return;
      const ok = await p.evaluate((sel) => {
        const input = document.querySelector<HTMLInputElement>(sel);
        if (!input) return false;
        input.disabled = false; input.checked = true;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }, selector).catch(() => false);
      if (ok && (await this.active().locator(selector).isChecked().catch(() => false))) return;
      await this.active().waitForTimeout(180);
    }

    await expect(this.active().locator(selector), `${selector} would not stay checked after 3 attempts.`).toBeChecked({ timeout: 5000 });
  }

  /**
   * Click the affirmative button of the topmost visible jQuery UI dialog, and
   * wait for that dialog to close. Returns false when no dialog was showing.
   */
  async confirmDialog(timeout = 15_000): Promise<boolean> {
    const ap = await this.waitForActivePage();
    const dialog = ap.locator('.ui-dialog:visible').last();
    try {
      await dialog.waitFor({ state: 'visible', timeout });
    } catch {
      return false;
    }

    const title = (await dialog.locator('.ui-dialog-title').textContent().catch(() => ''))?.trim();
    const confirm = dialog.locator('button.confirm-dialog-btn, button.confirm-wfw-dialog-btn').first();

    if (await confirm.count().catch(() => 0)) {
      await confirm.click({ timeout: 10_000 });
    } else {
      const byLabel = dialog.getByRole('button', { name: /^(Next|Yes|OK|Ok|Proceed|Make Payment|I Accept)$/ }).first();
      if (!(await byLabel.count().catch(() => 0))) {
        console.log(`WARNING: dialog "${title}" has no recognisable confirm button — leaving it open.`);
        return false;
      }
      await byLabel.click({ timeout: 10_000 });
    }

    console.log(`Confirmed dialog: "${title}"`);
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {
      console.log(`WARNING: dialog "${title}" did not close after confirming.`);
    });
    await this.waitForDomReady();
    return true;
  }

  /** Click the nearest "Yes" confirmation, then wait for DOM-ready. */
  async clickYesAndWait(): Promise<void> {
    const ap = await this.waitForActivePage();
    await ap.getByRole('button', { name: 'Yes' }).click({ timeout: 10_000 }).catch(() => {});
    await this.waitForDomReady();
  }

  /** Click a "Next" action exposed as either a button or clickable text. */
  async clickNextButtonOrText(): Promise<void> {
    const ap = await this.waitForActivePage();
    const nextButton = ap.getByRole('button', { name: 'Next' }).first();
    if ((await nextButton.count().catch(() => 0)) > 0) await nextButton.click({ timeout: 7000 }).catch(() => {});
    else await ap.getByText('Next', { exact: true }).first().click({ timeout: 7000 }).catch(() => {});
  }
}
