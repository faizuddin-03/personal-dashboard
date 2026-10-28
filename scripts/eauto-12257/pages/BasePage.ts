import { Page, Locator, Download } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONFIG } from '../data/config';
import { focus } from '../utils/focusTimeline';

// ── Shared helpers every page object extends ───────────────
// Ported verbatim from scripts/eauto-jomcheck/pages/BasePage.ts (demo mode,
// confirm dialogs, banner dismissal, evidence capture), plus the small
// poll/wait/clean/error-modal helpers the Secarang chain page objects
// (copied from scripts/secarang-insurance/pages/) were written against —
// appended at the bottom so those files port unchanged.
export class BasePage {
  constructor(protected readonly page: Page) {}

  // ──────────────────────────────────────────────────────────────
  // Demo mode — slow, highlighted playback for human-reviewable
  // recordings. Enabled via PW_DETAILED=1 (the dashboard page's "Detailed"
  // toggle, default on). When off, every helper below is a no-op so a fast
  // run stays fast. Highlighting is best-effort and must never fail a test.
  // ──────────────────────────────────────────────────────────────

  private _demoSuppressed = 0;

  /** Run-wide fast switch for data DISCOVERY (searching listings for a
   *  usable record): no pauses, no highlights, on every page object at once.
   *  Faizuddin, 2026-10-05: "make it fast. only slow down for the part where
   *  the VN is confirmed to have the numbers". Specs set it true while
   *  hunting and false the moment the record is found. */
  static fastDiscovery = false;

  protected get demoMode(): boolean {
    return process.env.PW_DETAILED === '1' && this._demoSuppressed === 0 && !BasePage.fastDiscovery;
  }

  /**
   * Run `fn` with demo highlighting/pauses temporarily suppressed. Wrap
   * finders that open/close many rows just to inspect (e.g. scanning a
   * listing for one matching transaction) in this so they stay fast and
   * don't flood the recording with pulses on rows the test never acts on.
   */
  protected async suppressDemo<T>(fn: () => Promise<T>): Promise<T> {
    this._demoSuppressed++;
    try {
      return await fn();
    } finally {
      this._demoSuppressed--;
    }
  }

  /** Default pause between steps, in ms (PW_DETAILED_DELAY overrides). */
  protected get demoDelay(): number {
    return Number(process.env.PW_DETAILED_DELAY || 1400);
  }

  /** Pause (demo mode only) so a human watching the recording can keep up. */
  async demoPause(ms?: number): Promise<void> {
    if (!this.demoMode) return;
    await this.page.waitForTimeout(ms ?? this.demoDelay);
  }

  /**
   * Highlight an element in the recording (demo mode only): scroll it into
   * view, draw a temporary outline, hold for `hold` ms, then restore. `color`
   * lets callers distinguish intent — amber (default) for "about to act on
   * this", green for "here is the result to check", red for a
   * removal/failure. No-op when demo mode is off. Never throws.
   */
  async demoHighlight(
    target: Locator | string,
    opts: { hold?: number; color?: 'amber' | 'green' | 'red' } = {},
  ): Promise<void> {
    // The run is about to act on this page: the one-recording video follows it.
    focus(typeof target === 'string' ? this.page : target.page());
    if (!this.demoMode) return;
    const locator = typeof target === 'string' ? this.page.locator(target) : target;
    const palette = { amber: '#f59e0b', green: '#22c55e', red: '#ef4444' };
    const color = palette[opts.color ?? 'amber'];
    try {
      const el = locator.first();
      await el.scrollIntoViewIfNeeded({ timeout: 2000 });
      const handle = await el.elementHandle({ timeout: 2000 });
      if (!handle) return;
      await this.page.evaluate(
        ({ node, c }) => {
          (node as any).__demoPrevOutline = node.style.outline;
          (node as any).__demoPrevShadow = node.style.boxShadow;
          (node as any).__demoPrevOffset = node.style.outlineOffset;
          node.style.outline = `3px solid ${c}`;
          node.style.outlineOffset = '2px';
          node.style.boxShadow = `0 0 0 4px ${c}66`;
          node.scrollIntoView({ block: 'center', behavior: 'smooth' });
        },
        { node: handle, c: color },
      );
      await this.page.waitForTimeout(opts.hold ?? this.demoDelay);
      await this.page.evaluate((node) => {
        node.style.outline = (node as any).__demoPrevOutline ?? '';
        node.style.boxShadow = (node as any).__demoPrevShadow ?? '';
        node.style.outlineOffset = (node as any).__demoPrevOffset ?? '';
      }, handle);
      await handle.dispose();
    } catch {
      // Highlighting is best-effort — never break a test over it.
    }
  }

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

  // ──────────────────────────────────────────────────────────────
  // jQuery UI confirm dialogs — the SAME `.confirm-dialog-btn`/
  // `.cancel-dialog-btn` convention used across this app for any Yes/No
  // confirmation (see tests/service-hub/pages/BasePage.ts's identical
  // helpers, and `_reference/html/eauto/ucd-jomcheck-purchase-payment-
  // confirm-dialog.html` for JomCheck's own "Payment" dialog — confirmed
  // 2026-10-02 after a TS06/TS18 failure where payNow() clicked through
  // without confirming this dialog and the page never advanced).
  // ──────────────────────────────────────────────────────────────

  async waitForDialog(): Promise<void> {
    await this.page.locator('.ui-dialog').waitFor({ state: 'visible', timeout: 5000 });
  }

  async acceptConfirmDialog(): Promise<void> {
    await this.demoHighlight(this.page.locator('.confirm-dialog-btn'));
    await this.page.locator('.confirm-dialog-btn').click();
  }

  async dismissConfirmDialog(): Promise<void> {
    await this.page.locator('.cancel-dialog-btn').click();
  }

  /**
   * Dismiss eAuto campaign/notification banners. See
   * scripts/eauto-insurance/pages/BasePage.ts for the full trap writeup
   * (duplicate-id banners, the `:visible` filter) — copied verbatim here
   * rather than re-derived, since it's the same UCD/BO chrome.
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

    if (closed) console.log(`   🧹 Dismissed ${closed} banner/popup(s).`);
    return closed;
  }

  // ──────────────────────────────────────────────────────────────
  // Evidence capture — screenshots the dashboard publishes as downloadable
  // review artifacts, separate from the pass/fail video recording. Written
  // to PW_EVIDENCE_DIR (set by the run route per-run); a no-op when that
  // env var isn't set (e.g. a bare local `npx playwright test`), so this
  // never breaks a CLI-only run. Faizuddin, 2026-10-02:
  //   1. "every test evidence must have a download and download all button" —
  //      the run route publishes everything under PW_EVIDENCE_DIR and the
  //      dashboard lists each file with its own checkbox + download link.
  //   2. "if the scenario requires to cross check with pdf... make sure to
  //      save the screenshot of the PDF with the part that is being checked
  //      to be highlighted" — see captureHighlightedPdfEvidence() below.
  // ──────────────────────────────────────────────────────────────

  private get evidenceDir(): string | undefined {
    return process.env.PW_EVIDENCE_DIR;
  }

  /** Saves a plain full-page (or element) screenshot as evidence, labeled
   *  for the dashboard's evidence list. `label` becomes the filename (and
   *  display name) — keep it short and specific, e.g. "TS17-column-headers". */
  async captureEvidence(label: string, target?: Locator): Promise<void> {
    const dir = this.evidenceDir;
    if (!dir) return;
    try {
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${label.replace(/[^\w.-]+/g, '_')}.png`);
      if (target) await target.screenshot({ path: file });
      else await this.page.screenshot({ path: file, fullPage: true });
    } catch {
      // Evidence capture is best-effort — never fail a test over it.
    }
  }

  /**
   * Failure evidence: draws a red box (with a short caption) around each
   * element where the issue shows, takes a full-page screenshot, then removes
   * the boxes. Faizuddin, 2026-10-20: "for all of the failed screenshots, you
   * did not include the red box to tell specifically where in the screenshot
   * is the issue". Runs in every mode (not only demo). Never throws.
   */
  async captureIssue(label: string, targets: Locator | Locator[], note: string): Promise<void> {
    const list = Array.isArray(targets) ? targets : [targets];
    const handles = [];
    for (const t of list) {
      const h = await t.first().elementHandle({ timeout: 2000 }).catch(() => null);
      if (h) handles.push(h);
    }
    try {
      if (handles[0]) await handles[0].scrollIntoViewIfNeeded().catch(() => {});
      await this.page.evaluate(({ nodes, text }) => {
        nodes.forEach((n, i) => {
          const el = n as HTMLElement;
          (el as any).__issuePrev = [el.style.outline, el.style.outlineOffset];
          el.style.outline = '3px solid #ef4444';
          el.style.outlineOffset = '2px';
          if (i > 0) return;
          const r = el.getBoundingClientRect();
          const cap = document.createElement('div');
          cap.id = '__issue-caption';
          cap.textContent = text;
          Object.assign(cap.style, {
            position: 'absolute', left: `${r.left + window.scrollX}px`, top: `${Math.max(0, r.top + window.scrollY - 30)}px`,
            background: '#ef4444', color: '#fff', font: 'bold 13px sans-serif', padding: '4px 8px',
            borderRadius: '4px', zIndex: '2147483647', maxWidth: '600px',
          });
          document.body.appendChild(cap);
        });
      }, { nodes: handles, text: note });
      await this.captureEvidence(`${label}-ISSUE`);
    } catch {
      // Evidence capture is best-effort — never fail a test over it.
    } finally {
      await this.page.evaluate((nodes) => {
        document.getElementById('__issue-caption')?.remove();
        for (const n of nodes) {
          const el = n as HTMLElement; const prev = (el as any).__issuePrev;
          if (prev) { el.style.outline = prev[0]; el.style.outlineOffset = prev[1]; }
        }
      }, handles).catch(() => {});
      for (const h of handles) await h.dispose().catch(() => {});
    }
  }

  /**
   * Saves a downloaded file (an Excel export, any non-screenshot download)
   * into evidence, same contract as `captureEvidence()` — Faizuddin,
   * 2026-10-03: "the automation must also allow the excel to be included in
   * the test evidence bulk download." Keeps the download's own extension
   * (`.xlsx`, `.csv`, ...) so `publishEvidence()` can tell it apart from a
   * screenshot/video and the dashboard can offer it with a sensible icon.
   * No-op when `PW_EVIDENCE_DIR` isn't set, same as every other evidence
   * helper here.
   */
  async saveDownloadAsEvidence(download: Download, label: string): Promise<void> {
    const dir = this.evidenceDir;
    if (!dir) return;
    try {
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(download.suggestedFilename()) || '';
      const file = path.join(dir, `${label.replace(/[^\w.-]+/g, '_')}${ext}`);
      await download.saveAs(file);
    } catch {
      // Evidence capture is best-effort — never fail a test over it.
    }
  }

  /**
   * For a scenario that cross-checks a downloaded PDF (a report, an
   * invoice): open the PDF in Chromium's own viewer (a plain `page.goto()`
   * on the file:// or served path works — Chromium renders PDFs natively),
   * draw a highlighted box over the region actually being checked, screenshot
   * it, then close the tab. `highlightBox` is in CSS pixels relative to the
   * PDF viewer's own viewport — get it by inspecting where the checked text
   * sits once the PDF is open (e.g. via a manual pass, or Chromium's PDF
   * viewer's own text layer if precision matters). Never silently skip the
   * highlight — if you don't have real coordinates yet, say so in the
   * caller rather than passing a guessed box.
   */
  async captureHighlightedPdfEvidence(
    label: string,
    pdfPath: string,
    highlightBox: { x: number; y: number; width: number; height: number },
    opts: { caption?: string } = {},
  ): Promise<void> {
    const dir = this.evidenceDir;
    if (!dir) return;
    const pdfPage = await this.page.context().newPage();
    try {
      await pdfPage.goto(pdfPath.startsWith('file://') ? pdfPath : `file://${pdfPath}`, { waitUntil: 'load' });
      await pdfPage.waitForTimeout(1500); // let the PDF viewer finish rendering
      await pdfPage.evaluate(
        ({ box, caption }) => {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.left = `${box.x}px`;
          overlay.style.top = `${box.y}px`;
          overlay.style.width = `${box.width}px`;
          overlay.style.height = `${box.height}px`;
          overlay.style.border = '4px solid #ef4444';
          overlay.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.35)';
          overlay.style.zIndex = '2147483647';
          overlay.style.pointerEvents = 'none';
          document.body.appendChild(overlay);
          if (caption) {
            const label = document.createElement('div');
            label.textContent = caption;
            label.style.position = 'fixed';
            label.style.left = `${box.x}px`;
            label.style.top = `${Math.max(0, box.y - 24)}px`;
            label.style.background = '#ef4444';
            label.style.color = '#fff';
            label.style.font = '12px sans-serif';
            label.style.padding = '2px 6px';
            label.style.borderRadius = '4px';
            label.style.zIndex = '2147483647';
            document.body.appendChild(label);
          }
        },
        { box: highlightBox, caption: opts.caption },
      );
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${label.replace(/[^\w.-]+/g, '_')}.png`);
      await pdfPage.screenshot({ path: file });
    } catch {
      // Evidence capture is best-effort — never fail a test over it.
    } finally {
      await pdfPage.close().catch(() => {});
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Secarang chain helpers — from scripts/secarang-insurance/pages/BasePage.ts
  // (the page objects copied from there call these by name).
  // ──────────────────────────────────────────────────────────────

  protected clean(s: string): string {
    return s.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  protected async poll(
    fn: () => Promise<boolean>,
    timeout = CONFIG.maxWaitForResult,
    interval = CONFIG.pollingInterval,
  ): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await fn()) return true;
      await this.page.waitForTimeout(interval);
    }
    return false;
  }

  protected async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Detect and dismiss any Secarang error modal (app-info-modal).
   * Returns the modal's title/message if one was found, or null if none.
   */
  async checkAndDismissErrorModal(): Promise<string | null> {
    const modal = this.page.locator('app-info-modal').first();
    if ((await modal.count()) === 0 || !await modal.isVisible().catch(() => false)) return null;

    const title = this.clean(await modal.locator('h5.title, h5, h4').first().textContent().catch(() => '') || '');
    const sub   = this.clean(await modal.locator('h6').first().textContent().catch(() => '') || '');
    const msg   = [title, sub].filter(Boolean).join(' — ') || 'Error modal detected';
    console.log(`   🚫 Error modal: "${msg}"`);

    const ok = modal.locator('button:has-text("OK"), button:has-text("Ok"), button:has-text("ok")').first();
    if ((await ok.count()) > 0) {
      await ok.click().catch(() => {});
    } else {
      const close = modal.locator('button.close, button:has-text("×"), button:has-text("✕")').first();
      await close.click().catch(() => {});
    }
    await this.wait(300);
    return msg;
  }
}
