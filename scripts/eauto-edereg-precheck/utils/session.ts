import { BrowserContext, Dialog, Page } from '@playwright/test';
import { CONFIG } from '../data/config';

// ── eDereg Pre-Checking session helper ──────────────────────
// This flow stays on one URL throughout (SPA-style content swap on
// main.do — see knowledge/flow-edereg.md §3), so page-handle churn is less
// of a concern than eSTM's suite, but the shared eAuto-portal resilience
// routines (banner dismissal, dialog confirmation) are still needed. No
// business selectors live here — those live in the page objects.
export class PrecheckSession {
  constructor(private readonly context: BrowserContext, private readonly fallback: Page) {}

  progress(step: string, label: string, status = 'done') {
    console.log('PROGRESS:' + JSON.stringify({ step, label, status }));
  }

  active(): Page {
    const pages = this.context.pages().filter((p) => !p.isClosed());
    return pages[pages.length - 1] ?? this.fallback;
  }

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

  /** Waits for the active page to be loaded, THEN holds an extra 2s before
   *  returning — call this before filling/clicking anything on a
   *  freshly-loaded page or dialog. `domcontentloaded` fires before the
   *  app's own client-side setup (gate checks, JS init) is actually done;
   *  filling immediately after it can hit the app mid-setup and get a
   *  DIFFERENT, misleading result rather than a clean timeout — confirmed
   *  live 2026-09-02 (CPC_E2E_TS2's inline pre-check popup showed a
   *  different message than the same manual action). See
   *  knowledge/automation-playbook.md "Page-load timing." */
  async waitForPageSettled(): Promise<Page> {
    const p = await this.waitForActivePage();
    await new Promise((r) => setTimeout(r, 2000));
    return p;
  }

  logUrl(tag: string): void {
    const p = this.active();
    console.log(`URL [${tag}]: ${p && !p.isClosed() ? p.url() : '(no live page)'}`);
  }

  /** Holds on the CURRENT screen for `CONFIG.detailsPauseMs` — call this
   *  right after a screen finishes DISPLAYING something back to the tester
   *  (a result popup, a Details/listing page, a JPJ XML Log search result),
   *  never for a form-filling step. Deliberate, per Faizuddin 2026-08-24 —
   *  without it, a screen that's only on-camera for a few hundred ms is too
   *  fast to actually read back on the recorded video afterward.
   *
   *  Added 2026-08-26, per Faizuddin: content below the fold at the fixed
   *  1920x1080 viewport (see playwright.config.ts) was never on camera at
   *  all — holding still at the top of a tall page never showed it. Now
   *  splits the hold into a read-at-top half, a smooth scroll to the
   *  bottom, and a read-at-bottom half, but ONLY when there's actually
   *  something to scroll — a screen that already fits (most jQuery UI
   *  dialogs) just holds still as before, no pointless scroll-to-nowhere.
   *
   *  Extended same day, also per Faizuddin, for OF_TS4's Payment History
   *  popup: a jQuery UI dialog's own content (`.ui-dialog-content`, e.g.
   *  `#precheck-popup`) can overflow independently of the PAGE's height —
   *  the outer `document.documentElement.scrollHeight` check above never
   *  catches that, since the page itself doesn't grow, only the dialog's
   *  own box does. Now checks the topmost VISIBLE dialog's content first
   *  and scrolls THAT if it's the one overflowing, falling back to the
   *  page-level check otherwise. */
  async pauseForDetails(): Promise<void> {
    const p = this.active();
    const totalMs = CONFIG.detailsPauseMs;

    const scrollTarget = await p.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('.ui-dialog'));
      const visibleDialog = dialogs.reverse().find((d) => d.offsetParent !== null);
      const dialogContent = visibleDialog?.querySelector<HTMLElement>('.ui-dialog-content') ?? null;
      if (dialogContent && dialogContent.scrollHeight > dialogContent.clientHeight + 8) return 'dialog';
      if (document.documentElement.scrollHeight > window.innerHeight + 8) return 'page';
      return 'none';
    }).catch(() => 'none' as const);

    if (scrollTarget === 'none') {
      await p.waitForTimeout(totalMs).catch(() => { /* ignore */ });
      return;
    }

    const topHoldMs = Math.floor(totalMs / 2);
    const bottomHoldMs = totalMs - topHoldMs;
    await p.waitForTimeout(topHoldMs).catch(() => { /* ignore */ });
    await p.evaluate((target) => {
      if (target === 'dialog') {
        const dialogs = Array.from(document.querySelectorAll<HTMLElement>('.ui-dialog'));
        const visibleDialog = dialogs.reverse().find((d) => d.offsetParent !== null);
        const dialogContent = visibleDialog?.querySelector<HTMLElement>('.ui-dialog-content');
        dialogContent?.scrollTo({ top: dialogContent.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    }, scrollTarget).catch(() => { /* ignore */ });
    await p.waitForTimeout(bottomHoldMs).catch(() => { /* ignore */ });
  }

  /** Dismiss eAuto campaign banners AND the AATF home "Announcement"
   *  jQuery UI dialog (`#dialog-announcement`, EAINT-9306-aatf-home-and-menu.html
   *  STATE 2) — it shows once per browser profile (localStorage-gated), which
   *  means every run, since automation gets a fresh context. Closes one per
   *  round until none remain. Safe no-op when nothing is showing. */
  async closeBanners(maxRounds = 8): Promise<number> {
    const CONTAINERS = ['[class*="dialog-campaign"]', '[id$="-campaign"]', '.modal-campaign', '#eautoPopupOverlay', '#dialog-announcement', '.ui-dialog:visible', '[role="dialog"]', '.modal.in', '.modal.show', '.swal2-container', '[class*="popup"]'];
    const CLOSERS = ['#dialog-campaign-close-btn', '.close-btn', '[class*="campaign-close"]', '.ui-dialog-titlebar-close', '[aria-label="Close"]', '[data-dismiss="modal"]', '.swal2-close', 'button.close', '.close'];

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
        await ap.keyboard.press('Escape').catch(() => {});
        await ap.evaluate(() => {
          const isOverlay = (el: HTMLElement) =>
            getComputedStyle(el).position === 'fixed' ||
            /modal|dialog|overlay|popup|campaign/i.test(el.className || '');

          document.querySelectorAll<HTMLElement>('[class*="dialog-campaign"], [id$="-campaign"], .modal-campaign, #eautoPopupOverlay, #dialog-announcement, [class*="popup"]').forEach((el) => {
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
          document.querySelectorAll<HTMLElement>('.modal-backdrop, .ui-widget-overlay').forEach((el) => el.remove());
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

  /**
   * Click "Yes" on the topmost visible jQuery UI dialog, and wait for it to
   * close. Use this for `#enquire-dialog` and `#payment-dialog` — both are
   * confirmed (live HTML, EAINT-9306-precheck-step1-vehicle-consent.html and
   * EAINT-9306-precheck-payment-and-result.html) to use plain "Yes"/"No"
   * button labels, unlike the `.confirm-dialog-btn` class the eSTM/UCD side
   * uses — so this matches the label directly, scoped inside the dialog so
   * it can never reach a page control of the same name (there isn't one
   * here: the page's own buttons read "ENQUIRE NOW" / "NEXT", not "Yes").
   * Returns false when no dialog was showing. `confirmLabel` overrides the
   * button text for dialogs that don't use "Yes" — the Deregistration
   * category-confirmation dialog uses "YA" (Malay), per
   * EAINT-9306-dereg-create-category-select.html STATE 2.
   */
  async confirmDialog(timeout = 15_000, confirmLabel = 'Yes'): Promise<boolean> {
    const ap = await this.waitForActivePage();
    const dialog = ap.locator('.ui-dialog:visible').last();
    try {
      await dialog.waitFor({ state: 'visible', timeout });
    } catch {
      return false;
    }

    const title = (await dialog.locator('.ui-dialog-title').textContent().catch(() => ''))?.trim();
    const confirm = dialog.getByRole('button', { name: confirmLabel }).first();
    await confirm.click({ timeout: 10_000 });

    console.log(`Confirmed dialog: "${title}"`);
    await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {
      console.log(`WARNING: dialog "${title}" did not close after confirming.`);
    });
    await this.waitForDomReady();
    return true;
  }

  /**
   * Run `action` while accepting the NEXT native browser `confirm()` popup
   * it triggers — the Deregistration flow's step-4 JPJ check ("I hereby
   * agree..." -> Next) and "Make Payment" both fire a real `window.confirm`,
   * not a jQuery UI dialog, per EAINT-9306-dereg-step4-jpj-check.html: "no
   * HTML available for it, only accessible via Playwright's
   * page.on('dialog') handler, NOT a DOM locator." The listener is
   * registered before `action` runs so it can't miss a dialog that fires
   * synchronously inside the click.
   */
  async withNativeConfirm<T>(action: () => Promise<T>): Promise<T> {
    const p = await this.waitForActivePage();
    const onDialog = (dialog: Dialog) => { dialog.accept().catch(() => {}); };
    p.on('dialog', onDialog);
    try {
      return await action();
    } finally {
      p.off('dialog', onDialog);
    }
  }

  /** Same as `withNativeConfirm()`, but also returns the dialog's own
   *  `.message()` text — added 2026-08-26 for OF_TS4 (EAINT-9306), whose
   *  expected result is the EXACT wording of the native dialog on a
   *  dev-reset payment's next attempt ("Rhb payment internal error, please
   *  try again later.") — confirmed by Faizuddin to be the SAME native
   *  confirm() every other declined attempt (IF/RE) already fires, just
   *  different wording this time, not a new popup shape. Returns `''` if no
   *  dialog fired. */
  async withNativeConfirmCapture<T>(action: () => Promise<T>): Promise<{ result: T; dialogMessage: string }> {
    const p = await this.waitForActivePage();
    let dialogMessage = '';
    const onDialog = (dialog: Dialog) => { dialogMessage = dialog.message(); dialog.accept().catch(() => {}); };
    p.on('dialog', onDialog);
    try {
      const result = await action();
      return { result, dialogMessage };
    } finally {
      p.off('dialog', onDialog);
    }
  }
}
