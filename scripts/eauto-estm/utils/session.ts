import { BrowserContext, Page } from '@playwright/test';

// ── eSTM session helper ─────────────────────────────────────
// The eSERAHAN flow repeatedly closes and reopens pages during redirects, so
// no page handle stays valid for long. This helper always resolves the newest
// live page in the context and centralises the resilience routines every step
// needs (DOM-ready waits, popup dismissal, stubborn-checkbox toggling). It
// holds NO business selectors — those live in the page objects.
export class EstmSession {
  constructor(private readonly context: BrowserContext) {}

  progress(step: string, label: string, status = 'done') {
    console.log('PROGRESS:' + JSON.stringify({ step, label, status }));
  }

  /** Newest non-closed page in the context. */
  active(): Page {
    const pages = this.context.pages().filter((p) => !p.isClosed());
    return pages[pages.length - 1];
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

  /** Dismiss eAuto campaign/modal popups (ids change per campaign). Safe no-op
   *  when nothing is showing. */
  async closePopupIfPresent(): Promise<void> {
    const ap = this.active();
    const CONTAINERS = ['[id$="-campaign"]', '.modal-campaign', '#eautoPopupOverlay', '[role="dialog"]', '.modal.in', '.modal.show', '.swal2-container', '[class*="popup"]'];

    let found = false;
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      for (const sel of CONTAINERS) {
        if (await ap.locator(sel).first().isVisible().catch(() => false)) { found = true; break; }
      }
      if (found) break;
      await ap.waitForTimeout(200);
    }
    if (!found) return;

    for (let attempt = 0; attempt < 8; attempt++) {
      let visible = false;
      for (const sel of CONTAINERS) {
        if (await ap.locator(sel).first().isVisible().catch(() => false)) { visible = true; break; }
      }
      if (!visible) return;

      const campaignClose = ap.locator('#dialog-campaign-close-btn, .close-btn').first();
      if (await campaignClose.isVisible().catch(() => false)) { await campaignClose.click({ force: true }).catch(() => {}); await ap.waitForTimeout(400); continue; }

      const stdClose = ap.locator('[aria-label="Close"], [data-dismiss="modal"], .swal2-close, button.close, .close').first();
      if (await stdClose.isVisible().catch(() => false)) { await stdClose.click({ force: true }).catch(() => {}); await ap.waitForTimeout(400); continue; }

      for (const text of ['×', 'Close', 'OK', 'Got it', 'Dismiss', 'Tutup']) {
        const el = ap.locator(`button:has-text("${text}"), span:has-text("${text}")`).first();
        if (await el.isVisible().catch(() => false)) { await el.click({ force: true }).catch(() => {}); break; }
      }
      await ap.keyboard.press('Escape').catch(() => {});
      await ap.evaluate(() => {
        document.querySelectorAll<HTMLElement>('[id$="-campaign"], .modal-campaign, #eautoPopupOverlay, [class*="popup"]').forEach(el => {
          el.style.display = 'none'; el.style.visibility = 'hidden'; el.style.pointerEvents = 'none';
        });
        document.querySelectorAll<HTMLElement>('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
      }).catch(() => {});
      await ap.waitForTimeout(400);
    }
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
  }

  /** Click the nearest "Yes" confirmation, then wait for DOM-ready. */
  async clickYesAndWait(): Promise<void> {
    const ap = await this.waitForActivePage();
    await ap.getByRole('button', { name: 'Yes' }).click().catch(() => {});
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
