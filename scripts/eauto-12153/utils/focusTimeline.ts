import { test, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'node:fs';

// Which window the run is working in, and when — so the run route can join the
// separate recordings (eAuto tab, Fiuu payment window, DuitNow scanner tab,
// BackOffice) into ONE video that follows the action
// (Faizuddin, 2026-10-22: "it should record ALL OF IT … in one recording only").
// The joining is lib/server/focusVideo.ts in the dashboard.
//
// Every page object marks focus in BasePage.demoHighlight (called before each
// action), so a switch is recorded whenever the run acts on another page.

const opened = new Map<Page, number>();
const labels = new Map<Page, string>();
const marks: { t: number; page: Page }[] = [];

/** Note when each page of this context opens (its recording starts then). */
export function trackContext(ctx: BrowserContext, label: string): void {
  for (const p of ctx.pages()) trackPage(p, label);
  ctx.on('page', p => trackPage(p, label));
}

export function trackPage(p: Page, label: string, at = Date.now()): void {
  if (!opened.has(p)) { opened.set(p, at); labels.set(p, label); }
}

/** The run is now working on `p`. */
export function focus(p: Page): void {
  if (p.isClosed() || marks[marks.length - 1]?.page === p) return;
  if (!opened.has(p)) trackPage(p, 'page');
  marks.push({ t: Date.now(), page: p });
}

/** Write the timeline and attach it to the test (only when recording). */
export async function writeFocusTimeline(): Promise<void> {
  if (process.env.PW_VIDEO !== '1' || !marks.length) return;
  const index = new Map<Page, number>();
  const videos: { path: string; openedAt: number; label: string }[] = [];
  for (const { page } of marks) {
    if (index.has(page)) continue;
    const file = await page.video()?.path().catch(() => undefined);
    if (!file) continue;
    index.set(page, videos.length);
    videos.push({ path: file, openedAt: opened.get(page) ?? Date.now(), label: labels.get(page) ?? 'page' });
  }
  const segments = marks.filter(m => index.has(m.page)).map(m => ({ t: m.t, v: index.get(m.page)! }));
  const out = test.info().outputPath('focus-timeline.json');
  fs.writeFileSync(out, JSON.stringify({ endedAt: Date.now(), videos, segments }, null, 1));
  await test.info().attach('focus-timeline', { path: out, contentType: 'application/json' });
}
