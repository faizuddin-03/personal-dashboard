#!/usr/bin/env node
// Runs one Claude-written TS step file with the Azfar-style recorder, without the Playwright MCP plugin
// (EAINT-12406, 04.11.2026: the plugin browser was locked by another session).
//
//   node scripts/claude-run/run-ts.mjs <steps.mjs> [--root <evidence folder>]
//
// <steps.mjs> exports: `ts` (TS id, also the folder name), `points` (or `pointsFrom` = a ts.json id),
// `situation`, and `default async function run(R, ctx)`. ctx = { page, browser, cfg, util } where cfg holds the
// site / CIBO logins read from the dashboard defaults. Throwing ends the TS early: it is still finished and filed.
// After the run: finish.json is written, then finish-ts.mjs (checks.txt, proofs.json, gate.json, PiP merge).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const require = createRequire(path.join(REPO, 'scripts/eauto-12406/automation/package.json'));
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const stepsFile = path.resolve(args[0]);
const rootIdx = args.indexOf('--root');
const ROOT = rootIdx > 0 ? path.resolve(args[rootIdx + 1]) : path.join(REPO, '_reference/tickets/EAINT-12406/claude-run-2026-11-04');

const steps = await import(pathToFileURL(stepsFile).href);
let points = steps.points;
if (!points && steps.pointsFrom) {
  const tsj = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json'), 'utf8'));
  points = tsj.cases[steps.pointsFrom]?.points || [];
}

// Logins: the dashboard's own defaults (app/eauto/12107/page.tsx DEFAULT_CREDS); never written in this file.
const src = fs.readFileSync(path.join(REPO, 'app/eauto/12107/page.tsx'), 'utf8');
const pick = (k) => (src.match(new RegExp(`${k}: "([^"]*)"`)) || [])[1] || '';
const cfg = {
  base: 'https://staging.secarang.com/ia/car-insurance', site: pick('sitePassword'),
  ciboUser: pick('ciboLoginId'), ciboPass: pick('ciboPassword'),
  bankUser: pick('bankUsername'), bankPass: pick('bankPassword'),
  email: pick('ownerEmail'), phone: pick('ownerPhone').replace(/^0/, ''),
  card: pick('cardNumber'), cardExp: pick('cardExpiry'), cardCvv: pick('cardCvv'),
};

const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1920,1080'] });
const ctx0 = await browser.newContext();
const page = await ctx0.newPage();
page.__ROOT = ROOT.replace(/\\/g, '/'); page.__INST = 'ia';
const recorderSrc = fs.readFileSync(path.join(REPO, 'scripts/claude-run/recorder-azfar.js'), 'utf8');
const loadRecorder = eval('(' + recorderSrc + ')');
console.log(await loadRecorder(page));
const R = page.__R;

let stopped = '';
await R.start(steps.ts, steps.situation || steps.ts, points);
R.note('Driver: Claude via scripts/claude-run/run-ts.mjs (local Playwright, own browser), guided by Faizuddin.');
try {
  await steps.default(R, { page: R.page, browser, cfg, util: await import(pathToFileURL(path.join(REPO, 'scripts/claude-run/secarang-steps.mjs')).href) });
} catch (e) {
  stopped = 'stopped: ' + String(e.message || e).split('\n')[0].slice(0, 300);
  R.note(stopped);
  console.error(stopped);
}
const out = await R.finish(stopped);
await browser.close();
const dir = path.join(ROOT, steps.ts);
fs.mkdirSync(path.join(dir, '_raw'), { recursive: true });
fs.writeFileSync(path.join(dir, '_raw', 'finish.json'), JSON.stringify(out, null, 2));
const f = spawnSync(process.execPath, [path.join(REPO, 'scripts/claude-run/finish-ts.mjs'), dir, path.join(dir, '_raw', 'finish.json')], { encoding: 'utf8' });
console.log(f.stdout || f.stderr);
console.log('PROOFS ' + JSON.stringify(out.proofs.map((p) => ({ point: p.point, match: p.match, shows: p.shows.slice(0, 260) })), null, 1));
console.log('NOTES ' + JSON.stringify(out.notes.slice(-12), null, 1));
