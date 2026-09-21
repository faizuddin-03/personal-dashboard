import * as fs from 'node:fs';
import * as path from 'node:path';
import { Page } from '@playwright/test';

// ── Video manifest — chronological ordering for multi-tab evidence ──
// Playwright's `video: 'on'` config records EVERY page in a context
// separately — the main AATF page gets its own `.webm`, and so does every
// extra tab/window opened during the run (the MyKad emulator's throwaway
// page per `insertCard()` call, the BO context's own page for JPJ XML Log
// checks). Left alone, the dashboard's `publishVideo()`
// (app/api/eauto-edereg-precheck/run/route.ts) only ever surfaced ONE of
// these files (whichever happened to be newest by mtime), silently
// dropping every other tab's recording — a real evidence gap, confirmed by
// Faizuddin 2026-08-24.
//
// Fix: every helper that opens/closes its OWN page (MykadEmulatorClient,
// the BO login block) appends an entry here, in the exact order those pages
// actually occurred during the test. `publishVideo()` then ffmpeg-concats
// the ONE leftover "main" video (never listed here — it's the page the
// `test()` fixture itself owns, which stays open for the whole test and
// therefore always comes first) with these entries in manifest order,
// producing one continuous recording instead of silently dropping tabs.
//
// One manifest file per test run, reset at the start of every run
// (`resetVideoManifest()`, called from fixtures/sessionFixture.ts) so a
// stale file from a previous run can never leak into the next one's
// concatenation.
//
// Lives under `videoRunDir()` — a PER-RUN output folder, added 2026-08-28
// so two runs (e.g. MU_TS11 + MU_TS12) can be started simultaneously
// without their manifests (and the manually-recorded sub-page videos
// pointed to by them) colliding. `npx playwright test` wipes its entire
// `outputDir` at the START of every invocation (confirmed in
// node_modules/playwright/lib/runner/index.js's `createRemoveOutputDirsTask()`)
// — with every project sharing the SAME `test-results/` outputDir, a
// second run's own startup would delete the first run's still-in-progress
// manifest and videos, not just overwrite this one file. The fix:
// run/route.ts (Next.js side) passes each spawned process its own
// `--output test-results-<runId>` — a genuinely separate outputDir Playwright
// only ever wipes for ITS OWN invocation — and `videoRunDir()` below
// resolves to that SAME folder via the matching `DPC_RUN_ID` env var, so
// both sides agree on where a given run's artifacts live. Falls back to
// the plain `test-results/` folder when `DPC_RUN_ID` isn't set (a plain
// `npx playwright test` run outside the dashboard).
export function videoRunDir(): string {
  const runId = process.env.DPC_RUN_ID?.trim();
  return path.join(process.cwd(), runId ? `test-results-${runId}` : 'test-results');
}

const MANIFEST_PATH = path.join(videoRunDir(), 'video-manifest.jsonl');

export interface VideoManifestEntry {
  label: string;
  path: string;
}

/** Call once per test, before anything that might open a sub-page — clears
 *  any manifest left over from a previous run. */
export function resetVideoManifest(): void {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, '');
}

/** Records `page`'s own video, in the order this is called — call this
 *  AFTER closing `page` (or its context), since a video's `.path()` only
 *  resolves once Playwright has finished writing the file. Safe to call on
 *  a page whose context never recorded (`recordVideo` wasn't configured) —
 *  resolves to nothing and simply skips the entry. */
export async function recordSubPageVideo(page: Page, label: string): Promise<void> {
  const videoPath = await page.video()?.path().catch(() => undefined);
  if (!videoPath) return;
  const entry: VideoManifestEntry = { label, path: videoPath };
  fs.appendFileSync(MANIFEST_PATH, JSON.stringify(entry) + '\n');
}

// NOTE: `app/api/eauto-edereg-precheck/run/route.ts` (the Next.js side) also
// reads this same manifest file, but as a SEPARATE Node process after this
// script's own process has exited — it can't import this module (this is a
// standalone Playwright project, not part of the Next.js app's module
// graph), so it re-parses the JSONL directly with plain `fs`/`JSON.parse`.
// Keep the file's shape (one JSON object per line, `{ label, path }`) in
// sync between the two if either side changes.
