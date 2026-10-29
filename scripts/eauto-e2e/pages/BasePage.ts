import { Page } from '@playwright/test';
import * as path from 'path';
import { ShotBox } from '../data/types';
import { E2EReporter } from '../utils/reporting';

// ── Shared page interaction + extraction helpers ───────────
// Every UCD page object extends this. It owns the generic ways these eAuto
// pages are read (label→value adjacency, whole-body regex) and the
// video-narration helpers (caption banner, annotated spotlight screenshots).
// Page-specific selectors live in the subclasses, never here.
export class BasePage {
  private shotIdx = 0;

  constructor(
    protected readonly page: Page,
    protected readonly reporter: E2EReporter,
    protected readonly artifactDir: string,
  ) {}

  /** Update the on-screen caption banner (persists in the recorded video). */
  async announce(text: string): Promise<void> {
    this.reporter.info('▶ ' + text);
    await this.page.evaluate((t) => {
      const el = document.getElementById('e2e-banner-text');
      if (el) el.textContent = t;
    }, text).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /** Draw red spotlight boxes around targets, add a caption strip, and save a
   *  numbered viewport screenshot into the artifact dir. */
  async shot(slug: string, caption: string, boxes: ShotBox[] = []): Promise<void> {
    this.shotIdx += 1;
    const num = String(this.shotIdx).padStart(2, '0');
    const rects: { x: number; y: number; w: number; h: number; label: string }[] = [];
    for (const b of boxes) {
      try {
        const loc = b.sel ? this.page.locator(b.sel).first()
          : b.text ? this.page.getByText(b.text, { exact: false }).first()
          : null;
        if (!loc || (await loc.count()) === 0) continue;
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        const bb = await loc.boundingBox();
        if (bb && bb.width > 0 && bb.height > 0) rects.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, label: b.label });
      } catch { /* ignore box that can't resolve */ }
    }
    await this.page.evaluate(({ rects, caption }) => {
      const wrap = document.createElement('div');
      wrap.id = 'e2e-annot';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
      const cap = document.createElement('div');
      cap.style.cssText =
        'position:fixed;top:42px;left:16px;max-width:70%;background:rgba(15,17,26,.92);color:#e7eaf0;' +
        'font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;padding:7px 12px;border-radius:8px;' +
        'border:1px solid #4f46e5;box-shadow:0 4px 14px rgba(0,0,0,.4);';
      cap.textContent = '📸 ' + caption;
      wrap.appendChild(cap);
      for (const r of rects) {
        const box = document.createElement('div');
        box.style.cssText =
          `position:fixed;left:${r.x - 4}px;top:${r.y - 4}px;width:${r.w + 8}px;height:${r.h + 8}px;` +
          'border:2.5px solid #ff2d55;border-radius:6px;box-shadow:0 0 0 3px rgba(255,45,85,.18);';
        const tag = document.createElement('div');
        tag.textContent = r.label;
        tag.style.cssText =
          `position:fixed;left:${r.x - 4}px;top:${Math.max(r.y - 24, 66)}px;background:#ff2d55;color:#fff;` +
          'font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:1px 7px;border-radius:5px;white-space:nowrap;';
        wrap.appendChild(box);
        wrap.appendChild(tag);
      }
      document.body.appendChild(wrap);
    }, { rects, caption }).catch(() => {});
    await this.page.waitForTimeout(650);
    const file = `${num}_${slug}.png`;
    await this.page.screenshot({ path: path.join(this.artifactDir, file) }).catch(() => {});
    await this.page.evaluate(() => document.getElementById('e2e-annot')?.remove()).catch(() => {});
    this.reporter.artifact({ kind: 'screenshot', file, caption });
    this.reporter.info(`   📸 ${file}`);
  }

  /** Spotlight a target for the video, then click it. */
  async clickWithSpotlight(sel: string, label: string): Promise<void> {
    const loc = this.page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await this.announce(label);
    await loc.click({ timeout: 30000 });
  }

  /** Generic "label : value" adjacency extractor for these table/dl layouts. */
  async extract(labels: string[]): Promise<Record<string, string>> {
    return this.page.evaluate((labels) => {
      const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      const out: Record<string, string> = {};
      const nodes = Array.from(document.querySelectorAll('td,th,div,span,dt,label,p,li,strong'));
      for (const label of labels) {
        let val = '';
        for (const el of nodes) {
          const t = clean(el.textContent);
          if (t === label || t === label + ':' || t === label + ' :') {
            const sib = el.nextElementSibling as HTMLElement | null;
            if (sib && clean(sib.textContent)) { val = clean(sib.textContent); break; }
            const cell = el.closest('td,th');
            const row = el.closest('tr');
            if (row && cell) {
              const cells = Array.from(row.children) as HTMLElement[];
              const i = cells.indexOf(cell as HTMLElement);
              if (i >= 0 && cells[i + 1] && clean(cells[i + 1].textContent)) { val = clean(cells[i + 1].textContent); break; }
            }
            const p = el.parentElement;
            if (p && p.nextElementSibling && clean(p.nextElementSibling.textContent)) { val = clean(p.nextElementSibling.textContent); break; }
          }
        }
        out[label] = val;
      }
      return out;
    }, labels);
  }

  /** Whole-page text (minus overlays/style/script) for layout-agnostic regex. */
  async bodyText(): Promise<string> {
    return this.page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('#e2e-banner,#e2e-annot,style,script,noscript').forEach((e) => e.remove());
      return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }).catch(() => '');
  }

  async bodyMatch(re: RegExp): Promise<string> {
    const m = (await this.bodyText()).match(re);
    return m ? (m[1] || '').trim() : '';
  }

  /** Cover type appears as "Cover Type: COMPREHENSIVE" or a card header word. */
  async readCoverType(): Promise<string> {
    return this.page.evaluate(() => {
      const body = (document.body.innerText || '').replace(/\s+/g, ' ');
      const m = body.match(/Cover Type\s*:?\s*(COMPREHENSIVE|THIRD PARTY[^A-Za-z]*FIRE[^A-Za-z]*THEFT|THIRD PARTY|PRIVATE CAR[^A-Za-z]*\(?ENHANCED\)?|TPFT)/i);
      return m ? m[1].replace(/\s+/g, ' ').trim().toUpperCase() : '';
    });
  }

  normalizeCover(s: string): string {
    const u = (s || '').toUpperCase();
    if (u.includes('COMPREHENSIVE')) return 'COMPREHENSIVE';
    if (u.includes('THIRD PARTY') || u === 'TPFT') return 'TPFT';
    if (u.includes('PRIVATE CAR')) return 'PRIVATE CAR (ENHANCED)';
    return u;
  }

  /** Dismiss campaign / modal popups (ids change per campaign). */
  async closePopup(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      const closed = await this.page.evaluate(() => {
        const sels = ['#dialog-campaign-close-btn', '.close-btn', '[id$="-campaign"] .close', '.modal.show .close', '.swal2-close'];
        for (const s of sels) {
          const el = document.querySelector(s) as HTMLElement | null;
          if (el && el.offsetParent !== null) { el.click(); return true; }
        }
        document.querySelectorAll('.modal-backdrop').forEach((e) => e.remove());
        document.body.classList.remove('modal-open');
        return false;
      }).catch(() => false);
      if (!closed) break;
      await this.page.waitForTimeout(400);
    }
  }

  /** Poll until the blocking "Working…" overlay is gone. */
  async waitWorkingDone(maxMs = 60000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const txt = await this.page.locator('body').innerText().catch(() => '');
      if (!/working/i.test(txt)) return;
      await this.page.waitForTimeout(1200);
    }
  }
}
