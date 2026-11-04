import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

// BasePage (copied unchanged from scripts/eauto-jomcheck) plus the failure
// evidence every TS of this suite needs.
export class AplBase extends BasePage {
  /**
   * Failure evidence: red box (with a short caption) around each element
   * where the issue shows, full-page screenshot, then the boxes are removed.
   * Copied from scripts/eauto-12107/pages/BasePage.ts captureIssue()
   * (Faizuddin, 2026-10-20: "for all of the failed screenshots, you did not
   * include the red box to tell specifically where in the screenshot is the
   * issue"). Never throws.
   */
  async captureIssue(label: string, targets: Locator | Locator[], note: string): Promise<void> {
    // The runner attaches a file to a TS row only when its name carries "TSnn" (run route publishEvidence
    // tsOf()). Labels like "log-drafter-kiv-remarks" landed in the run but on no TS row (12028_TS21,
    // 2026-11-03), so the TS id of the running test is put in front when the label lacks one.
    if (!/TS\d+/.test(label)) {
      const id = (() => { try { return test.info().title.split(':')[0].trim(); } catch { return ''; } })();
      if (id) label = `${id}-${label}`;
    }
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
   * Runs one assertion; on failure saves the red-box screenshot on `target`
   * (the exact cell / button / note at fault) with `note`, then rethrows.
   */
  async verify(label: string, target: Locator | Locator[], note: string, check: () => Promise<void>): Promise<void> {
    try {
      await check();
    } catch (e) {
      await this.captureIssue(label, target, note);
      throw e;
    }
  }

  // ── Module header (the module is its own app under /backoffice) ──
  // from _reference/html/eauto/bo-association-payment-listing-summary.html lines 24-27:
  // `<form id="logout-form" … action="/backoffice/logout" method="post"> <span class="who-name">Chia Ket Ming</span>
  //  <button id="btn-logout" …>Logout</button>` — "invalidates THIS session only" (line 23).
  whoName = () => this.page.locator('#logout-form span.who-name');
  moduleLogoutBtn = () => this.page.locator('#logout-form #btn-logout');

  /** Clicks the module's own Logout (ends the /backoffice session only). Throws when the button is not on this page. */
  async moduleLogout(): Promise<void> {
    const btn = this.moduleLogoutBtn();
    if (!(await btn.count())) throw new Error(`No module Logout button (#btn-logout) on ${this.page.url()}.`);
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.waitForLoadState('load', { timeout: 60_000 });
    await this.settleAfterLoad();
  }

  /** Green highlight on a value about to be read and asserted (demo mode only). */
  async showValue(target: Locator): Promise<void> {
    await this.demoHighlight(target, { color: 'green' });
  }
}
