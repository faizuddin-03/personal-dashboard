import { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Screenshot of a downloaded PDF with every CHECKED item boxed — the
// standing evidence rule (eauto-automation-scaffold skill §2): "if the
// scenario requires to cross check with pdf, or anything that is downloaded,
// make sure to save the screenshot of the PDF with the part that is being
// checked to be highlighted". Added for EAINT-12412, 2026-10-15.
//
// Colours (Faizuddin, 2026-10-19: "if it pass, the box is green. but if its
// incorrect, the incorrect details will have red boxes"):
//   GREEN — an expected item found on the PDF.
//   RED   — something wrong: an item that must NOT be there (e.g. a
//           "JomCheck report" line on a pre-push invoice), a line missing its
//           classification code, or an expected item that is missing — then
//           the ROW where it belongs is boxed (its `anchors` text), since a
//           missing word has no position of its own. An expected item with no
//           anchor on the PDF is only listed, in red, in the caption.
//
// Why not BasePage.captureHighlightedPdfEvidence(): it opens the PDF in
// Chromium's built-in viewer, which does not exist in a headless run (the
// default), and it needs hand-measured coordinates. Here the PDF is drawn
// with pdf.js (the copy bundled inside pdf-parse — no new dependency), and
// pdf.js reports the exact position of every piece of text, so each box sits
// on the real word. Nothing is placed at a guessed position.
//
// It runs in its OWN browser context (no video, nothing to do with the app
// under test) on a fake origin served by page.route(), so pdf.js can load its
// worker. It only renders our own saved file; it never touches eAuto.

const PDFJS_DIR = path.join(__dirname, '..', 'node_modules', 'pdf-parse', 'lib', 'pdf.js', 'v2.0.550', 'build');
const ORIGIN = 'http://pdf-evidence.local';

export interface HighlightSpec {
  /** Must be on the PDF — green when found. */
  expected: string[];
  /** Must NOT be on the PDF — red when found. */
  forbidden?: string[];
  /** Where a missing expected item belongs: item → row texts to box in red (first one found). */
  anchors?: Record<string, string[]>;
  /** A code that must sit on the same row as each of these line texts (e.g. 022 on both e-Invoice lines). */
  perLine?: { code: string; lines: string[] };
}

export interface HighlightResult {
  saved: boolean; file?: string;
  found: string[]; missing: string[]; wrong: string[];
  error?: string;
}

/**
 * Draws `pdfPath`, boxes what was checked (green = right, red = wrong or
 * missing), and saves a full-page PNG at `<dir of pdfPath>/<label>.png`.
 * Best-effort: returns a result, never throws.
 */
export async function capturePdfWithHighlights(page: Page, pdfPath: string, label: string, spec: HighlightSpec, caption: string): Promise<HighlightResult> {
  const up = (a: string[] = []) => Array.from(new Set(a.map(t => t.trim().toUpperCase()).filter(Boolean)));
  const s = {
    expected: up(spec.expected),
    forbidden: up(spec.forbidden),
    anchors: Object.fromEntries(Object.entries(spec.anchors ?? {}).map(([k, v]) => [k.trim().toUpperCase(), up(v)])),
    perLine: spec.perLine ? { code: spec.perLine.code.toUpperCase(), lines: up(spec.perLine.lines) } : null,
  };
  const browser = page.context().browser();
  if (!browser) return { saved: false, found: [], missing: s.expected, wrong: [], error: 'no browser handle' };
  const outFile = path.join(path.dirname(pdfPath), `${label.replace(/[^\w.-]+/g, '_')}.png`);

  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1400 } });
  try {
    const view = await ctx.newPage();
    const pdfBytes = fs.readFileSync(pdfPath);
    await view.route(`${ORIGIN}/**`, async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/pdf.js') return route.fulfill({ path: path.join(PDFJS_DIR, 'pdf.js'), contentType: 'application/javascript' });
      if (url.pathname === '/pdf.worker.js') return route.fulfill({ path: path.join(PDFJS_DIR, 'pdf.worker.js'), contentType: 'application/javascript' });
      if (url.pathname === '/doc.pdf') return route.fulfill({ body: pdfBytes, contentType: 'application/pdf' });
      return route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html><head><meta charset="utf-8"><style>'
          + 'body{margin:0;background:#e5e7eb;font:13px sans-serif}'
          + '#cap{padding:10px 14px;background:#111827;color:#f9fafb;white-space:pre-wrap;line-height:1.5}'
          + '#cap .ok{color:#86efac}#cap .bad{color:#fca5a5;font-weight:bold}'
          + '.pg{position:relative;margin:12px auto;box-shadow:0 1px 4px #0004;background:#fff}'
          + '.hl{position:absolute;border:2px solid;box-sizing:border-box;pointer-events:none}'
          + '.hl.ok{border-color:#16a34a;background:#16a34a22}.hl.bad{border-color:#dc2626;background:#dc262626;border-width:3px}'
          + '</style><script src="/pdf.js"></script></head><body><div id="cap"></div><div id="pages"></div></body></html>',
      });
    });
    await view.goto(`${ORIGIN}/index.html`, { waitUntil: 'load' });

    const result = await view.evaluate(async ({ s, caption }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lib = (window as any)['pdfjs-dist/build/pdf'];
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
      const task = lib.getDocument({ url: '/doc.pdf' });
      const doc = await (task.promise || task);
      const scale = 1.6;
      const norm = (x: string) => x.replace(/\s+/g, ' ').trim().toUpperCase();
      const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reFor = (t: string) => (/^[\d.,]+$/.test(t) ? new RegExp(`(?<![\\d.,])${esc(t)}(?!\\d)`) : new RegExp(esc(t)));
      type Item = { str: string; x: number; y: number; w: number; h: number };
      type Hit = { x: number; y: number; w: number; h: number };
      const pagesEl = document.getElementById('pages')!;
      const found = new Set<string>();
      const wrong: string[] = [];
      const missingLater: string[] = [];
      // Per page: where each text was found (for anchors and per-line codes).
      const pages: { wrap: HTMLDivElement; width: number; items: Item[]; hits: Map<string, Hit[]> }[] = [];

      const box = (wrap: HTMLElement, b: Hit, cls: 'ok' | 'bad', pad = 3) => {
        const d = document.createElement('div');
        d.className = `hl ${cls}`;
        d.style.left = `${b.x - pad}px`; d.style.top = `${b.y - pad}px`;
        d.style.width = `${b.w + pad * 2}px`; d.style.height = `${b.h + pad * 2}px`;
        wrap.appendChild(d);
      };

      /** Every place `t` appears on a page (single piece, or split over neighbours on one line). */
      const locate = (items: Item[], t: string): Hit[] => {
        const re = reFor(t);
        const out: Hit[] = [];
        for (let i = 0; i < items.length; i++) {
          const m = re.exec(norm(items[i].str));
          if (m) {
            const len = Math.max(1, items[i].str.length);
            const at = Math.max(0, items[i].str.toUpperCase().indexOf(m[0]));
            out.push({ x: items[i].x + items[i].w * (at / len), y: items[i].y, w: Math.max(8, items[i].w * (m[0].length / len)), h: items[i].h });
            continue;
          }
          // Text split over neighbouring pieces on the same line. Only box
          // the pieces that MAKE the match: the window must need its first
          // piece and no single piece in it may match by itself.
          let joined = items[i].str;
          let rest = '';
          for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
            if (Math.abs(items[j].y - items[i].y) > items[i].h * 0.6) break;
            if (re.test(norm(items[j].str))) break;
            joined += ' ' + items[j].str;
            rest += (rest ? ' ' : '') + items[j].str;
            if (re.test(norm(joined)) && !re.test(norm(rest))) {
              const xs = items.slice(i, j + 1);
              const x0 = Math.min(...xs.map(a => a.x)), x1 = Math.max(...xs.map(a => a.x + a.w));
              const y0 = Math.min(...xs.map(a => a.y)), y1 = Math.max(...xs.map(a => a.y + a.h));
              out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
              break;
            }
          }
        }
        return out;
      };
      const sameRow = (a: Hit, b: Hit) => Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) < Math.max(a.h, b.h) * 0.7;
      const rowBox = (pg: { width: number }, at: Hit): Hit => ({ x: 24, y: at.y, w: pg.width - 48, h: at.h });

      // 1. Draw every page and find every text we care about.
      const all = Array.from(new Set([...s.expected, ...s.forbidden, ...Object.values(s.anchors).flat(), ...(s.perLine ? [s.perLine.code, ...s.perLine.lines] : [])]));
      for (let n = 1; n <= doc.numPages; n++) {
        const p = await doc.getPage(n);
        const vp = p.getViewport(scale);
        const wrap = document.createElement('div');
        wrap.className = 'pg';
        wrap.style.width = `${vp.width}px`;
        wrap.style.height = `${vp.height}px`;
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        wrap.appendChild(canvas);
        pagesEl.appendChild(wrap);
        const rt = p.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
        await (rt.promise || rt);
        const tc = await p.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: Item[] = tc.items.map((it: any) => {
          const tx = lib.Util.transform(vp.transform, it.transform);
          const h = Math.hypot(tx[2], tx[3]);
          return { str: String(it.str), x: tx[4], y: tx[5] - h, w: it.width * scale, h };
        }).filter((it: Item) => it.str.trim() !== '');
        const hits = new Map<string, Hit[]>();
        for (const t of all) hits.set(t, locate(items, t));
        pages.push({ wrap, width: vp.width, items, hits });
      }
      const hitsOf = (t: string) => pages.flatMap(pg => (pg.hits.get(t) ?? []).map(h => ({ pg, h })));

      // 2. Expected items: green where found; red row (or caption) where missing.
      for (const t of s.expected) {
        if (s.perLine && t === s.perLine.code) continue; // drawn per line in step 4
        const hs = hitsOf(t);
        if (hs.length) { found.add(t); hs.forEach(({ pg, h }) => box(pg.wrap, h, 'ok')); continue; }
        const anchor = (s.anchors[t] ?? []).map(a => hitsOf(a)[0]).find(Boolean);
        if (anchor) { box(anchor.pg.wrap, rowBox(anchor.pg, anchor.h), 'bad', 2); wrong.push(`${t} missing on the "${(s.anchors[t] ?? []).find(a => hitsOf(a).length)}" row`); }
        else missingLater.push(t);
      }
      // 3. Forbidden items: red where found.
      for (const t of s.forbidden) {
        const hs = hitsOf(t);
        if (hs.length) { hs.forEach(({ pg, h }) => box(pg.wrap, h, 'bad')); wrong.push(`${t} should not be on this document`); }
      }
      // 4. Per-line code: green on the code beside each line, red row when absent.
      if (s.perLine) {
        const { code, lines } = s.perLine;
        let allOk = true;
        for (const line of lines) {
          for (const { pg, h } of hitsOf(line)) {
            const c = (pg.hits.get(code) ?? []).find(ch => sameRow(ch, h));
            if (c) box(pg.wrap, c, 'ok');
            else { allOk = false; box(pg.wrap, rowBox(pg, h), 'bad', 2); wrong.push(`${line} has no ${code}`); }
          }
          if (!hitsOf(line).length) allOk = false;
        }
        if (allOk && lines.length) found.add(code);
        else if (!lines.some(l => hitsOf(l).length)) missingLater.push(code);
      }

      const missing = missingLater;
      const okList = Array.from(found);
      document.getElementById('cap')!.innerHTML =
        `${caption}\n<span class="ok">Green = checked and correct (${okList.length}): ${okList.join(', ') || 'none'}</span>`
        + (wrong.length ? `\n<span class="bad">Red = wrong (${wrong.length}): ${wrong.join('; ')}</span>` : '')
        + (missing.length ? `\n<span class="bad">Not on the PDF at all: ${missing.join(', ')}</span>` : '')
        + (!wrong.length && !missing.length ? '\n<span class="ok">Everything checked is correct.</span>' : '');
      return { found: okList, missing, wrong };
    }, { s, caption });

    await view.screenshot({ path: outFile, fullPage: true });
    return { saved: true, file: outFile, ...result };
  } catch (e) {
    return { saved: false, found: [], missing: s.expected, wrong: [], error: e instanceof Error ? e.message : String(e) };
  } finally {
    await ctx.close().catch(() => {});
  }
}
