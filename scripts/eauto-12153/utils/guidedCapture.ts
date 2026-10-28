import { test, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { focus } from './focusTimeline';

// Guided capture (Faizuddin, 2026-10-22: "when it runs, i will manually guide
// it and the automation will capture the needed info"). The run fills the form
// up to the payment step, then a PERSON does every click. Meanwhile the run
// only READS: each time a tab in the eAuto browser loads, navigates or its
// content changes, it saves that tab's HTML and a screenshot. Nothing is typed
// or clicked by the run during the guided part.
//
// Output: _reference/tickets/EAINT-12153/guided-capture/<date_time>/
//   NN-<host>-<path>.html / .png   one pair per change, in order
//   index.json                     [{ n, at, url, title, why, html, png }]

const REPO = path.resolve(__dirname, '../../..');
const GUIDE_MINUTES = Number(process.env.E12153_GUIDE_MINUTES || '30');

interface Shot { n: number; at: string; url: string; title: string; why: string; html: string; png: string }

function stamp(): string {
  const d = new Date(); const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function slug(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'page';
  } catch { return 'page'; }
}

class Recorder {
  readonly dir: string;
  private shots: Shot[] = [];
  private last = new WeakMap<Page, string>();
  private busy = new WeakSet<Page>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private ctx: BrowserContext, ticket: string) {
    this.dir = path.join(REPO, '_reference', 'tickets', ticket, 'guided-capture', stamp());
    fs.mkdirSync(this.dir, { recursive: true });
  }

  start(): void {
    for (const p of this.ctx.pages()) this.watch(p);
    this.ctx.on('page', p => { this.watch(p); void this.snap(p, 'new tab or window'); });
    this.timer = setInterval(() => { for (const p of this.ctx.pages()) void this.snap(p, 'content changed'); }, 2500);
  }

  private watch(p: Page): void {
    p.on('load', () => void this.snap(p, 'page loaded'));
    p.on('framenavigated', f => { if (f === p.mainFrame()) setTimeout(() => void this.snap(p, 'navigated'), 1200); });
  }

  /** Save the tab's HTML + screenshot when its URL or content differs from the last save. */
  async snap(p: Page, why: string): Promise<void> {
    if (p.isClosed() || this.busy.has(p)) return;
    this.busy.add(p);
    try {
      const url = p.url();
      if (!url || url === 'about:blank') return;
      const sig = await p.evaluate(() => `${location.href}|${document.body ? document.body.innerText.length : 0}|${document.body ? document.body.innerText.slice(0, 3000) : ''}`).catch(() => '');
      if (!sig || sig === this.last.get(p)) return;
      this.last.set(p, sig);
      const n = this.shots.length + 1;
      const base = `${String(n).padStart(2, '0')}-${slug(url)}`;
      const html = await p.content().catch(() => '');
      const header = `<!--\n  URL:      ${url}\n  Captured: ${new Date().toISOString()} by the 12153 guided-capture run (${why})\n  Trimmed:  nothing\n-->\n`;
      fs.writeFileSync(path.join(this.dir, `${base}.html`), header + html);
      await p.screenshot({ path: path.join(this.dir, `${base}.png`), fullPage: true }).catch(() => undefined);
      const title = await p.title().catch(() => '');
      this.shots.push({ n, at: new Date().toISOString(), url, title, why, html: `${base}.html`, png: `${base}.png` });
      console.log(`DETAIL: Captured ${n}: ${title || '(no title)'} — ${url.split('?')[0]} (${why})`);
    } finally {
      this.busy.delete(p);
    }
  }

  async stop(): Promise<number> {
    if (this.timer) clearInterval(this.timer);
    for (const p of this.ctx.pages()) await this.snap(p, 'final');
    fs.writeFileSync(path.join(this.dir, 'index.json'), JSON.stringify(this.shots, null, 2));
    return this.shots.length;
  }
}

/** Instructions shown in the log; the person follows them in the browser window. */
export const GUIDE_STEPS = [
  'On Business Info Review, choose "Online Banking (Business)" and a bank. The B2B simulator supports Affin Bank and Hong Leong Bank only.',
  'Click "Submit and Pay".',
  'On the Fiuu page (maker), click "Authorize". Note the transaction number (tranID) it shows.',
  'Back on eAuto, look at the "Payment is Pending Approval" page. Refresh it once.',
  'Open a new tab in the same browser window: https://bank-simulator.fiuu.com/fpx-b2b/pending',
  'Type the tranID, click "Look up my order", then click "Approve".',
  'Go back to the eAuto tab and refresh until it shows "Pre-Application Submitted for Review".',
];

/**
 * Hand the payment step to a person and save every page they reach. Ends when a
 * tab shows "Pre-Application Submitted for Review", or after E12153_GUIDE_MINUTES.
 */
export async function guidedCapture(ucd: Page, ticket: string): Promise<void> {
  if (process.env.PW_HEADED !== '1') throw new Error('Guided capture needs a visible browser — untick Headless on the dashboard and run again.');
  const rec = new Recorder(ucd.context(), ticket);
  await test.step('Guided capture: save the payment page before handing over', () => rec.snap(ucd, 'start'));
  rec.start();
  console.log(`\n*** GUIDED CAPTURE — your turn in the browser window (up to ${GUIDE_MINUTES} min). The run only saves pages; it clicks nothing. ***`);
  GUIDE_STEPS.forEach((s, i) => console.log(`DETAIL: Guide ${i + 1}: ${s}`));
  console.log(`DETAIL: Saving pages to ${path.relative(REPO, rec.dir)}`);
  focus(ucd);

  const done = await test.step(`Guided capture: a person pays, authorises and approves (waiting up to ${GUIDE_MINUTES} min)`, async () => {
    const until = Date.now() + GUIDE_MINUTES * 60_000;
    while (Date.now() < until) {
      for (const p of ucd.context().pages()) {
        const ok = await p.getByText('Pre-Application Submitted for Review').first().isVisible().catch(() => false);
        if (ok) { focus(p); return true; }
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    return false;
  });
  const n = await test.step('Guided capture: save the last pages and the index', () => rec.stop());
  console.log(`DETAIL: Guided capture ${done ? 'finished — "Pre-Application Submitted for Review" seen' : `stopped after ${GUIDE_MINUTES} min`}: ${n} page(s) saved in ${path.relative(REPO, rec.dir)}`);
  test.info().annotations.push({ type: 'guided-capture', description: path.relative(REPO, rec.dir) });
}
