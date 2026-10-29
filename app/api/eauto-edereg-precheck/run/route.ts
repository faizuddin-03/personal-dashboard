import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { runState, type RunEntry } from "../runState";
import { PUBLIC_ART } from "../artifactPath";

// Runs the eAuto AATF eDereg Pre-Checking Enquiry happy-path flow
// (scripts/eauto-edereg-precheck) and returns its parsed PROGRESS:/RESULT:
// stdout. Modelled directly on app/api/eauto-estm/run/route.ts.
// CPC_E2E_TS5 Part 2 has a real ~6-minute wall-clock wait built in (the RHB
// "RE" payment reset-timer) on top of the rest of the flow — raised from
// 10 to 16 minutes so that case has room. Raised again to 22 minutes
// 2026-08-26 for MU_TS3 (two full logins/MyKad auths, the same 6.5-minute
// wait, PLUS User C's full submit/consent/JPJ/pay flow and two listing
// checks) — its own test.setTimeout(20 * 60_000) needs real headroom past
// this outer kill timer, not an exact tie (that raced and lost once
// already on TS5 Part 2, see knowledge/flow-edereg.md §14). Raised again to
// 40 minutes 2026-08-27 for MU_TS11's own dashboard-driven pause
// (utils/pauseSignal.ts) — that wait can last up to 25 minutes on its own
// (waiting on a human to click Continue after asking a dev to run the
// cronjob), on top of the setup/resume work either side of it. Harmless
// for every faster case, which finishes well under either cap.
// Raised from 2400 (40 min) to 4 hours 2026-09-04 for the "JPJ Code Checker"
// tab, whose sweep is ~90s per code across ~100 codes. This is only a
// CEILING — every existing case still finishes on its own long before either
// this or its own TIMEOUT_MS below, so nothing about their behaviour changes.
export const maxDuration = 14400;

const SCRIPT_DIR = process.env.EAUTO_EDEREG_PRECHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-edereg-precheck");
const TIMEOUT_MS = 40 * 60 * 1000;
// Bulk Run (app/eauto/edereg-precheck/BulkRunPanel.tsx) fires several runs
// in sequence and wants EVERY one's recordings still downloadable once the
// whole batch finishes, not just the last — so publishVideos() (below) keeps
// one subfolder PER RUN instead of wiping/reusing one shared folder. Kept
// bounded rather than growing forever: oldest run folders beyond this count
// get pruned every time a new one publishes. Generous enough for one large
// bulk batch (currently ~40 selectable test cases) plus normal single-run use
// in between prunes.
const KEEP_RUN_FOLDERS = 60;
// The JPJ Code Checker sweep is the one case that can legitimately run for
// hours (one eSIM spawn + one full payment round trip per code). Given its
// own kill timer rather than raising the shared one, so every other case
// keeps the exact 40-minute cap it has today.
const JPJ_CODES_TIMEOUT_MS = 4 * 60 * 60 * 1000;
const JPJ_CODES_PROJECT = "edereg-precheck-jpj-codes";
const JPJ_CODES_RESULTS = path.join(SCRIPT_DIR, "jpj-code-results.json");

/** The sweep flushes this file after EVERY code, so a stopped or timed-out
 *  run still has every row it managed to capture. Read it back regardless of
 *  how the run ended — the RESULT: line only exists on a clean finish. */
function readJpjCodeRows(): unknown[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(JPJ_CODES_RESULTS, "utf8")) as { rows?: unknown[] };
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

function parseStream(output: string) {
  const progress: { step: string; status: string; label?: string }[] = [];
  let result: Record<string, unknown> | null = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("PROGRESS:")) { try { progress.push(JSON.parse(line.slice(9))); } catch { /* ignore */ } }
    else if (line.startsWith("RESULT:")) { try { result = JSON.parse(line.slice(7)); } catch { /* ignore */ } }
  }
  return { progress, result };
}

// A test's OWN page keeps recording for the whole test (via
// playwright.config.ts's `use.video: 'on'`), but every EXTRA tab/window a
// test opens (the MyKad emulator's throwaway page, the BO context for JPJ
// XML Log checks) gets its own SEPARATE .webm — Playwright records per
// page, never merges pages within a context into one file. Left as "just
// grab the newest .webm" (the old behaviour here), every tab but one was
// silently dropped — a real evidence gap for a suite whose whole point is
// producing a recording to prove a flow happened. Confirmed and fixed
// 2026-08-24, per Faizuddin.
//
// Fix: scripts/eauto-edereg-precheck/utils/videoManifest.ts appends an
// entry (with a human label) every time a helper opens/closes its OWN
// sub-page — the MyKad emulator's `insertCard()`, the BO login block. The
// one video NOT in that manifest is the main test page's own.
//
// CHANGED 2026-08-27: these used to get ffmpeg-concatenated into one
// `run.webm` in chronological order. Per Faizuddin, several MU_TS scenarios
// have genuinely CONCURRENT actions across two browsers — a single
// stitched video makes it impossible to tell what happened at the same
// real-world moment, or to judge pass/fail per user. `publishVideos()`
// (below) now publishes every video as its OWN separate file instead; this
// manifest is still what tells it which files exist and what to label
// each one.
function readVideoManifest(testResultsDir: string): { label: string; path: string }[] {
  const manifestPath = path.join(testResultsDir, "video-manifest.jsonl");
  if (!fs.existsSync(manifestPath)) return [];
  return fs.readFileSync(manifestPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line) as { label: string; path: string }; } catch { return null; } })
    .filter((e): e is { label: string; path: string } => e !== null);
}

/** Deletes the oldest published-run subfolders under `PUBLIC_ART` beyond
 *  `KEEP_RUN_FOLDERS`, so Bulk Run's "every run keeps its own folder" (below)
 *  doesn't grow the public artifacts directory forever. Runs before every
 *  publish, not on a timer — simplest way to guarantee it actually happens
 *  regardless of how the dashboard is used. */
function pruneOldRunFolders() {
  if (!fs.existsSync(PUBLIC_ART)) return;
  const entries = fs.readdirSync(PUBLIC_ART, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(PUBLIC_ART, e.name);
      return { full, t: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => a.t - b.t);
  const excess = entries.length - KEEP_RUN_FOLDERS;
  if (excess <= 0) return;
  for (const e of entries.slice(0, excess)) {
    try { fs.rmSync(e.full, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/** Publishes every recorded `.webm` as its OWN separate file, labeled —
 *  CHANGED 2026-08-27 from the previous ffmpeg-concat-into-one-file
 *  behaviour, per Faizuddin: several MU_TS scenarios have genuinely
 *  CONCURRENT actions across two browsers (User A / User B / BackOffice),
 *  and a single stitched-together video makes it hard to tell which
 *  moments actually happened at the same time or to judge pass/fail per
 *  user. Piloted first on MU_TS1 — if it holds up, the same
 *  `recordSubPageVideo()` manifest this already reads from is universal
 *  across every test in this suite, so no further route changes are
 *  needed to roll it out elsewhere; only each spec's own sub-context needs
 *  `TIMESTAMP_OVERLAY_INIT_SCRIPT` (utils/overlay.ts) so the SEPARATELY
 *  published videos can still be lined up by eye via the burned-in clock. */
// CHANGED 2026-08-28: takes the run's OWN `test-results-<runId>` folder
// (see the `--output` flag added to the spawn call below) instead of the
// one shared `test-results/` — confirmed that `npx playwright test` wipes
// its entire outputDir at the START of every invocation
// (node_modules/playwright/lib/runner/index.js's `createRemoveOutputDirsTask()`),
// so with every project sharing one outputDir, running a SECOND test while
// a first was still in progress (e.g. MU_TS11 paused, MU_TS12 started)
// deleted the first run's videos/manifest out from under it, not just this
// function's own published copies. Giving each run its own `--output`
// folder makes that wipe scoped to only the run finishing, never another
// one still in flight. See utils/videoManifest.ts's `videoRunDir()` for
// the matching JS-side helper (both resolve the same folder name via the
// same `DPC_RUN_ID`/runId).
// CHANGED (this session): used to publish flat into ONE shared `PUBLIC_ART`
// folder, wiping it at the start of every run — fine for a single manual
// run (only the latest result ever mattered), but Bulk Run
// (BulkRunPanel.tsx) fires several runs in a row and wants EVERY one's
// recordings downloadable once the whole batch finishes, not just the
// last. Now publishes into its OWN `PUBLIC_ART/<runId>/` subfolder instead
// of wiping the shared root — `pruneOldRunFolders()` (above) bounds the
// total instead. `download-videos`/`trim-video` routes updated to resolve
// the resulting `<runId>/<file>` URLs via `../artifactPath.ts`.
function publishVideos(runId: string): { label: string; url: string }[] {
  pruneOldRunFolders();
  const runDir = path.join(PUBLIC_ART, runId);
  const webBase = `/qa-artifacts/eauto-edereg-precheck/${runId}`;
  fs.mkdirSync(runDir, { recursive: true });

  const tr = path.join(SCRIPT_DIR, `test-results-${runId}`);
  if (!fs.existsSync(tr)) return [];
  const vids: { p: string; t: number }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.webm$/i.test(e.name)) vids.push({ p: full, t: fs.statSync(full).mtimeMs });
    }
  };
  walk(tr);
  if (!vids.length) return [];

  const manifest = readVideoManifest(tr);
  const manifestPaths = new Set(manifest.map((e) => path.resolve(e.path)));
  // Whatever's left after excluding manifest entries is the MAIN
  // page/context's own video(s) — usually exactly one (the fixture's own
  // `page`), sorted chronologically in case more than one somehow shows up.
  const mainVideos = vids
    .filter((v) => !manifestPaths.has(path.resolve(v.p)))
    .sort((a, b) => a.t - b.t)
    .map((v) => v.p);
  const subVideos = manifest.filter((e) => fs.existsSync(e.path));

  const out: { label: string; url: string }[] = [];
  const safeName = (s: string) => s.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "video";

  mainVideos.forEach((p, i) => {
    const label = mainVideos.length > 1 ? `Main (part ${i + 1})` : "Main";
    const filename = `main-${i + 1}.webm`;
    try {
      fs.copyFileSync(p, path.join(runDir, filename));
      out.push({ label, url: `${webBase}/${filename}` });
    } catch { /* skip this one, keep publishing the rest */ }
  });
  subVideos.forEach((e, i) => {
    const filename = `sub-${i + 1}-${safeName(e.label)}.webm`;
    try {
      fs.copyFileSync(e.path, path.join(runDir, filename));
      out.push({ label: e.label, url: `${webBase}/${filename}` });
    } catch { /* skip this one, keep publishing the rest */ }
  });
  return out;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | undefined>;
  const str = (k: string) => (typeof body[k] === "string" ? body[k] : "");

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: `Playwright not installed. Run:\n\n  cd scripts/eauto-edereg-precheck && npm install && npx playwright install chromium` }, { status: 500 });
  }
  const required = ["vehicleRegNo", "jpjReceiptEmail"];
  const missing = required.filter(k => !body[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
  }

  // Client-generated id (crypto.randomUUID(), page.tsx's own run()) — this
  // is what lets two runs (e.g. MU_TS11 + MU_TS12, each in its own browser
  // tab) coexist: every other route below (live-log/pause-status/continue/
  // this route's own DELETE) is keyed by the SAME id, so two concurrent
  // runs never share a buffer, a pause file, or a stop flag. Falls back to
  // a server-generated id if the client somehow didn't send one, rather
  // than erroring — this route still works for a single run either way.
  const runId = str("runId") || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry: RunEntry = { child: null, stopRequested: false, forceResolveRun: null, runOutputBuffer: "" };
  runState.runs.set(runId, entry);

  // Defaults to the original happy-path project — pass testCase: "vehicle-not-exist"
  // (CPC_E2E_TS2) or "step2-first-approved" (CPC_E2E_TS7) to run a different
  // case. Each case is its own Playwright project (scripts/eauto-edereg-precheck/
  // playwright.config.ts), not a shared testMatch, so exactly one test's
  // PROGRESS:/RESULT: lines ever come back per run.
  const PROJECTS: Record<string, string> = {
    "vehicle-not-exist": "edereg-precheck-vehicle-not-exist",
    "rhb-api-down": "edereg-precheck-rhb-api-down",
    "ts3": "edereg-precheck-ts3",
    "step2-first-approved": "edereg-precheck-step2-first-approved",
    "step2-first-vehicle-not-exist": "edereg-precheck-step2-first-vehicle-not-exist",
    "step2-first-retry-approved": "edereg-precheck-step2-first-retry-approved",
    "ts4-part1": "edereg-precheck-ts4-part1",
    "ts4-part2": "edereg-precheck-ts4-part2",
    "ts5-part1": "edereg-precheck-ts5-part1",
    "ts5-part2": "edereg-precheck-ts5-part2",
    "ts6-part1": "edereg-precheck-ts6-part1",
    "ts6-part2": "edereg-precheck-ts6-part2",
    "ts10-part1": "edereg-precheck-ts10-part1",
    "ts10-part2": "edereg-precheck-ts10-part2",
    "ts11-part1": "edereg-precheck-ts11-part1",
    "ts11-part2": "edereg-precheck-ts11-part2",
    "ts12-part1": "edereg-precheck-ts12-part1",
    "ts12-part2": "edereg-precheck-ts12-part2",
    "am": "edereg-precheck-am",
    "of": "edereg-precheck-of",
    "of-ts5": "edereg-precheck-of-ts5",
    "of-ts4": "edereg-precheck-of-ts4",
    "mu-ts1": "edereg-precheck-mu-ts1",
    "mu-ts2": "edereg-precheck-mu-ts2",
    "mu-ts3": "edereg-precheck-mu-ts3",
    "mu-ts4": "edereg-precheck-mu-ts4",
    "mu-ts5": "edereg-precheck-mu-ts5",
    "mu-ts6": "edereg-precheck-mu-ts6",
    "mu-ts7": "edereg-precheck-mu-ts7",
    "mu-ts8": "edereg-precheck-mu-ts8",
    "mu-ts9": "edereg-precheck-mu-ts9",
    "mu-ts9b": "edereg-precheck-mu-ts9b",
    "mu-ts10": "edereg-precheck-mu-ts10",
    "mu-ts11": "edereg-precheck-mu-ts11",
    "mu-ts12": "edereg-precheck-mu-ts12",
    "cj-ts1-part1": "edereg-precheck-cj-ts1-part1",
    "cj-ts1-part2": "edereg-precheck-cj-ts1-part2",
    "cj-ts2-part1": "edereg-precheck-cj-ts2-part1",
    "cj-ts2-part2": "edereg-precheck-cj-ts2-part2",
    "cj-ts3-part1": "edereg-precheck-cj-ts3-part1",
    "cj-ts3-part2": "edereg-precheck-cj-ts3-part2",
    "cj-ts4-part1": "edereg-precheck-cj-ts4-part1",
    "cj-ts4-part2": "edereg-precheck-cj-ts4-part2",
    "cj-ts5-part1": "edereg-precheck-cj-ts5-part1",
    "cj-ts5-part2": "edereg-precheck-cj-ts5-part2",
    "ec-ts1": "edereg-precheck-ec-ts1",
    "ec-ts2": "edereg-precheck-ec-ts2",
    "ec-ts4": "edereg-precheck-ec-ts4",
    "ec-ts5": "edereg-precheck-ec-ts5",
    // "Custom Run" tab (app/eauto/edereg-precheck/CustomRunTab.tsx) — ONE
    // generic project driven by the DPC_CUSTOM_* env vars below, rather
    // than a fixed named test case.
    "custom": "edereg-precheck-custom",
    // "JPJ Code Checker" tab (app/eauto/edereg-precheck/JpjCodeCheckerTab.tsx)
    // — a data-gathering sweep over a pasted list of JPJ response codes,
    // driven by DPC_JPJ_CODES below. Not a numbered test case.
    "jpj-codes": JPJ_CODES_PROJECT,
  };
  const project = PROJECTS[str("testCase")] ?? "edereg-precheck";
  const isJpjCodes = project === JPJ_CODES_PROJECT;
  const timeoutMs = isJpjCodes ? JPJ_CODES_TIMEOUT_MS : TIMEOUT_MS;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    entry.forceResolveRun = resolve;
    // `--output` gives THIS invocation its own outputDir, separate from
    // every other run — see publishVideos()'s own doc comment for why
    // (Playwright wipes its whole outputDir at startup; sharing one across
    // concurrent runs meant a second run's startup deleted the first's
    // still-in-progress videos/manifest, not just its own).
    const child = spawn("npx", ["playwright", "test", `--project=${project}`, "--output", `test-results-${runId}`], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        DPC_SKIP_PAUSE: "1",
        // Read by utils/pauseSignal.ts to scope its pause/continue files to
        // THIS run — the mechanism that lets two paused runs (e.g. MU_TS11
        // + MU_TS12) coexist without one's Continue click waking the other.
        DPC_RUN_ID: runId,
        DPC_VEHICLE_REG_NO: str("vehicleRegNo"),
        DPC_JPJ_RECEIPT_EMAIL: str("jpjReceiptEmail"),
        ...(str("envSegment") && { DPC_ENV_SEGMENT: str("envSegment") }),
        ...(str("username") && { DPC_USERNAME: str("username") }),
        ...(str("password") && { DPC_PASSWORD: str("password") }),
        // Sub-user (User B) creds — only meaningful for the "Multiple
        // Users" test cases (data/config.ts's subUsername/subPassword),
        // harmless to pass unconditionally otherwise since nothing else
        // reads them.
        ...(str("subUsername") && { DPC_SUB_USERNAME: str("subUsername") }),
        ...(str("subPassword") && { DPC_SUB_PASSWORD: str("subPassword") }),
        // MyKad emulator identity, injected directly (data/config.ts's
        // mykadNric/mykadName + the Sub variants for User B).
        ...(str("mykadNric") && { DPC_MYKAD_NRIC: str("mykadNric") }),
        ...(str("mykadName") && { DPC_MYKAD_NAME: str("mykadName") }),
        ...(str("mykadNricSub") && { DPC_MYKAD_NRIC_SUB: str("mykadNricSub") }),
        ...(str("mykadNameSub") && { DPC_MYKAD_NAME_SUB: str("mykadNameSub") }),
        // User C — different-company creds/identity (MU_TS2 onward).
        ...(str("subUsername2") && { DPC_SUB2_USERNAME: str("subUsername2") }),
        ...(str("subPassword2") && { DPC_SUB2_PASSWORD: str("subPassword2") }),
        ...(str("mykadNricSub2") && { DPC_MYKAD_NRIC_SUB2: str("mykadNricSub2") }),
        ...(str("mykadNameSub2") && { DPC_MYKAD_NAME_SUB2: str("mykadNameSub2") }),
        // "Custom Run" tab only — harmless to pass unconditionally
        // otherwise, since edereg-precheck-custom.spec.ts is the only
        // script that reads these.
        ...(str("customEntry") && { DPC_CUSTOM_ENTRY: str("customEntry") }),
        ...(str("customJpjCode") && { DPC_CUSTOM_JPJ_CODE: str("customJpjCode") }),
        ...(str("customRhbCode") && { DPC_CUSTOM_RHB_CODE: str("customRhbCode") }),
        ...(str("customContinueFull") && { DPC_CUSTOM_CONTINUE_FULL: str("customContinueFull") }),
        ...(str("customRunSrd") && { DPC_CUSTOM_RUN_SRD: str("customRunSrd") }),
        // "JPJ Code Checker" tab only — the pasted code list (a JSON array)
        // and an optional "start fresh" flag that discards the previous
        // sweep's rows instead of resuming past them.
        ...(str("jpjCodes") && { DPC_JPJ_CODES: str("jpjCodes") }),
        ...(str("jpjFresh") && { DPC_JPJ_FRESH: str("jpjFresh") }),
      },
    });
    entry.child = child;
    let output = "";
    const timer = setTimeout(() => { killTree(child); resolve({ code: 1, output: output + `\nTimed out after ${Math.round(timeoutMs / 60_000)} minutes.` }); }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); entry.runOutputBuffer = output; });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); entry.runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); entry.child = null; entry.forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); entry.child = null; entry.forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const { progress, result: parsed } = parseStream(result.output);
  const videos = publishVideos(runId);
  // Clean up this run's own scratch output folder now that its videos are
  // copied into PUBLIC_ART — otherwise `test-results-<runId>` folders pile
  // up forever, one per run, since each gets a genuinely unique name.
  try { fs.rmSync(path.join(SCRIPT_DIR, `test-results-${runId}`), { recursive: true, force: true }); } catch { /* ignore */ }
  const stopped = entry.stopRequested;
  runState.runs.delete(runId);

  // The sweep banks its rows to disk after every code, so a Stop or a
  // timeout still has a partial table worth showing — read it back rather
  // than relying on a RESULT: line that only a clean finish produces.
  const jpjCodeRows = isJpjCodes ? readJpjCodeRows() : undefined;

  if (stopped) {
    return NextResponse.json({ stopped: true, progress, videos, log: result.output, ...(jpjCodeRows && { jpjCodeRows }) });
  }
  return NextResponse.json({
    result: parsed ?? { status: result.code === 0 ? "SUCCESS" : "FAIL" },
    progress,
    videos,
    log: result.output,
    ...(jpjCodeRows && { jpjCodeRows }),
  }, { status: parsed || result.code === 0 ? 200 : 500 });
}

export async function DELETE(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId") ?? "";
  const entry = runState.runs.get(runId);
  if (entry?.child) {
    entry.stopRequested = true;
    killTree(entry.child);
    const savedResolve = entry.forceResolveRun;
    const savedOutput = entry.runOutputBuffer;
    setTimeout(() => { if (savedResolve) { if (entry.forceResolveRun === savedResolve) entry.forceResolveRun = null; savedResolve({ code: 1, output: savedOutput }); } }, 5000);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
