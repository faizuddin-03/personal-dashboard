import { Locator } from '@playwright/test';
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

  /** Green highlight on a value about to be read and asserted (demo mode only). */
  async showValue(target: Locator): Promise<void> {
    await this.demoHighlight(target, { color: 'green' });
  }
}
