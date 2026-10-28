import { NextRequest, NextResponse } from "next/server";
import type { ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { organizeTestEvidence } from "@/lib/testEvidence";
import { registerEautoRun, unregisterEautoRun } from "@/lib/eautoRunRegistry";
import {
  killTree, runInProgressResponse, spawnPlaywrightCli, invalidScenarioTitles, grepFor, runFolderStamp,
} from "@/lib/server/playwrightRun";

// 3600s — detailed mode (default on) can push a single test past 240s (see
// tests/service-hub/playwright.config.ts), several scenarios can be
// selected to run together in one grep invocation, and TS04 alone can wait
// up to 60 minutes for its two manual Report-Engine gates (see
// tests/service-hub/utils/manualGate.ts and device-purchase-do-ts04.spec.ts's
// own test.setTimeout()). Only enforced on platforms that respect this
// Next.js route-segment config (e.g. Vercel) — irrelevant when this route
// runs locally, which is how TS04 must run anyway (it needs a human
// present to coordinate with dev in real time).
export const maxDuration = 3600;

// Runner for the combined EAINT-12166 (Delivery Order generation) /
// EAINT-12167 (Device Serial No. capture) E2E suite. Same generic
// grep-by-title + JSON/step reporter pattern as
// app/api/eauto/shopping-cart/run/route.ts — see that file for the fuller
// comments on the reporter shapes this parses.
//
// Evidence publishing (videos/screenshots/traces playable & downloadable in
// the browser) follows app/api/eauto-edereg-precheck/run/route.ts's
// publishVideos()/PUBLIC_ART pattern — copy into public/qa-artifacts/<...>/
// so Next.js serves them as real static URLs, since test-evidence/ itself
// isn't reachable by the browser. Per Faizuddin, 2026-09-23: "just follow
// how the automation for 9306 is set up."

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12166");
// Requirement C (Faizuddin, 2026-10-21): keep every run's evidence so TS Tracker links never break; default no prune.
const KEEP_RUN_FOLDERS = Number(process.env.EAUTO_12166_KEEP_RUN_FOLDERS) || Infinity;

// One run at a time on this page — a second POST gets a 409, and DELETE
// (the page's Stop button) kills the Playwright process tree. Same
// force-resolve-after-5s pattern as app/api/eauto-12107/run/route.ts.
let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: (() => void) | null = null;

/** "12166_67_E2E_TS01" titles joined with "_" — the Past runs row label. */
function deriveRunLabel(scenarios: string[]): string {
  const codes = scenarios.map((t) => t.split(" — ")[0].trim()).filter(Boolean);
  return codes.length ? codes.join("_") : "run";
}

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

interface EvidenceItem {
  label: string;
  url: string;
  kind: "video" | "image" | "trace";
}

/** Copies every video/screenshot/trace under `recordDir` into
 *  `PUBLIC_ART/<runId>/`, preserving organizeTestEvidence()'s per-test
 *  subfolder names, and returns real static URLs the browser can play or
 *  download directly — replaces the old "just list the file path as text"
 *  behaviour, which gave no actual playback/download. */
function publishEvidence(
  runId: string,
  recordDir: string,
  scenarios: string[],
  results: { title: string; status: string }[],
): EvidenceItem[] {
  pruneOldRunFolders();
  const runDir = path.join(PUBLIC_ART, runId);
  const webBase = `/qa-artifacts/eauto-12166/${runId}`;
  // meta.json lets app/api/eauto/12166/history list this run under Past runs
  // (label, time, pass/fail per test) — same shape as the queue pages'.
  try {
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "meta.json"), JSON.stringify({
      runId,
      runLabel: deriveRunLabel(scenarios),
      timestamp: Date.now(),
      scenarios,
      results: results.map((r) => ({ title: r.title, status: r.status })),
    }));
  } catch { /* best-effort — Past runs falls back to folder mtime */ }
  if (!fs.existsSync(recordDir)) return [];

  const kindFor: Record<string, EvidenceItem["kind"]> = { ".webm": "video", ".png": "image", ".zip": "trace" };
  const out: EvidenceItem[] = [];

  const walk = (dir: string, rel: string) => {
    for (const f of fs.readdirSync(dir)) {
      if (rel === "" && f === "_run") continue; // run metadata (report.json/steps.json), not evidence
      const full = path.join(dir, f);
      const relPath = rel ? `${rel}/${f}` : f;
      if (fs.statSync(full).isDirectory()) { walk(full, relPath); continue; }
      const ext = path.extname(f).toLowerCase();
      const kind = kindFor[ext];
      if (!kind) continue;
      const dest = path.join(runDir, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        fs.copyFileSync(full, dest);
        out.push({ label: relPath, url: `${webBase}/${relPath}`, kind });
      } catch { /* skip this one, keep publishing the rest */ }
    }
  };
  walk(recordDir, "");
  return out;
}

interface RunRequest {
  scenarios: string[];
  headless: boolean;
  baseUrl: string;
  ucdUser: string;
  ucdPass: string;
  boUser: string;
  boPass: string;
  bo2User?: string;
  bo2Pass?: string;
  detailed?: boolean;
  /** Client-generated UUID from useBackgroundRuns — see lib/eautoRunRegistry.ts. */
  runId?: string;
}

interface RunStep {
  title: string;
  duration: number;
  error?: string;
  steps: RunStep[];
}

interface TestResultItem {
  title: string;
  status: string;
  duration: number;
  error: string;
  friendlyError: string;
  steps: RunStep[];
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

interface RawStep {
  title: string;
  category: string;
  duration: number;
  error?: string;
  steps: RawStep[];
}

// Steps whose failure is ALWAYS deliberately best-effort/caught in the page
// object itself (e.g. downloadWithLabeledVideo()'s `popup.close().catch(() =>
// {})`) — Playwright still records the underlying pw:api call as "errored"
// even though the calling code swallowed it and never let it fail anything,
// so surfacing it in the log is pure noise, not a real problem. Confirmed
// 2026-09-24 against a real TS02 run: a "Close page" error appeared nested
// under a "Click [DO] and download the PDF" step that itself succeeded.
const KNOWN_BENIGN_STEP_TITLES = [/^close page$/i];

/**
 * Keeps only the deliberately-authored `test.step(...)` entries — including
 * the ones added throughout the page objects that embed the ACTUAL value
 * used/read (e.g. `Fill 40 serial number(s): AB12CD34EF01, ...`, `Read
 * "Delivery Status:" = "Arranged"`) — dropping Playwright's own
 * auto-recorded `expect`/`pw:api` noise from the tree, UNLESS one of those
 * failed, in which case it's kept so the real error is never hidden (e.g.
 * "Wait for selector … to be hidden" timing out is exactly what proved a
 * Delivery Status submit was silently rejected).
 */
function filterSteps(raw: RawStep[]): RunStep[] {
  const out: RunStep[] = [];
  for (const s of raw ?? []) {
    if (KNOWN_BENIGN_STEP_TITLES.some((re) => re.test(s.title))) continue;
    if (s.category === "test.step") {
      out.push({ title: s.title, duration: s.duration, error: s.error, steps: filterSteps(s.steps) });
    } else if (s.error) {
      out.push({ title: s.title, duration: s.duration, error: s.error, steps: [] });
    }
  }
  return out;
}

/** Reads PW_STEP_REPORT's per-test step tree, keyed by leaf test title (the
 *  same `spec.title` the JSON reporter uses), filtered per filterSteps(). */
function loadStepsByTitle(stepReportPath: string): Record<string, RunStep[]> {
  const out: Record<string, RunStep[]> = {};
  try {
    if (!fs.existsSync(stepReportPath)) return out;
    const data = JSON.parse(fs.readFileSync(stepReportPath, "utf-8")) as {
      tests: { title: string; steps: RawStep[] }[];
    };
    for (const t of data.tests ?? []) out[t.title] = filterSteps(t.steps);
  } catch {
    // best-effort — a missing/malformed step report should never break results
  }
  return out;
}

/** Turn a raw Playwright error message into a one-line, plain-English summary. */
function toPlainEnglish(rawMessage: string): string {
  const text = stripAnsi(rawMessage);
  const locatorMatch = text.match(/waiting for locator\('([^']+)'\)/);
  const locatorDesc = locatorMatch ? locatorMatch[1] : null;

  if (/strict mode violation[\s\S]*resolved to (\d+) elements/.test(text)) {
    const count = text.match(/resolved to (\d+) elements/)?.[1] ?? "multiple";
    return `The test found ${count} matching elements on the page instead of 1, and couldn't tell which one to use${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }
  if (/toBeVisible\(\)/.test(text) && /Expected: visible/.test(text)) {
    return `Expected an element to appear on the page, but it never showed up in time${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }
  if (/TimeoutError[\s\S]*locator\.click/.test(text)) {
    return `The test tried to click something, but the click never went through in time${locatorDesc ? ` — target: ${locatorDesc}` : ""}.`;
  }
  if (/^TimeoutError/m.test(text)) {
    return `The test waited too long for something to happen and gave up${locatorDesc ? ` (waiting on: ${locatorDesc})` : ""}.`;
  }
  const expectMatch = text.match(/expect\(received\)\.(\w+)\(([^)]*)\)/);
  const expectedVal = text.match(/Expected:\s*(.+)/)?.[1]?.trim();
  const receivedVal = text.match(/Received:\s*(.+)/)?.[1]?.trim();
  if (expectMatch) {
    const matcher = expectMatch[1];
    if (expectedVal !== undefined && receivedVal !== undefined) {
      return `The test's "${matcher}" check failed — expected "${expectedVal}", got "${receivedVal}".`;
    }
    return `A test assertion ("${matcher}") failed.`;
  }
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return firstLine ? firstLine.slice(0, 200) : "The test failed for an unknown reason — see technical details below.";
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const { scenarios, headless, baseUrl, ucdUser, ucdPass, boUser, boPass, bo2User, bo2Pass, detailed, runId } = body;

    if (currentChild) return runInProgressResponse();

    if (!scenarios?.length) {
      return NextResponse.json({ error: "No scenarios selected." }, { status: 400 });
    }
    const badTitles = invalidScenarioTitles(scenarios);
    if (badTitles) {
      return NextResponse.json({ error: `Unrecognised scenario title(s): ${badTitles.join(", ")}` }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const testDir = path.join(projectRoot, "tests", "service-hub");
    const configPath = path.join(testDir, "playwright.config.ts");

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "Test config not found." }, { status: 500 });
    }

    // Seconds included so two runs started in the same minute never share
    // a folder.
    const ts = runFolderStamp();
    const recordDir = path.join(projectRoot, "test-evidence", ts);
    const runMetaDir = path.join(recordDir, "_run");
    fs.mkdirSync(runMetaDir, { recursive: true });

    const jsonReportPath = path.join(runMetaDir, "report.json");
    const stepReportPath = path.join(runMetaDir, "steps.json");
    const gateDir = path.join(runMetaDir, "gates");

    if (runId) registerEautoRun(runId, ts);

    const grepPattern = grepFor(scenarios);

    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      EAUTO_BASE_URL: baseUrl,
      EAUTO_UCD_USER: ucdUser,
      EAUTO_UCD_PASS: ucdPass,
      EAUTO_BO_USER: boUser,
      EAUTO_BO_PASS: boPass,
      EAUTO_BO2_USER: bo2User ?? "",
      EAUTO_BO2_PASS: bo2Pass ?? "",
      PW_HEADED: headless ? "0" : "1",
      PW_VIDEO: "1",
      // Detailed mode: slow, highlighted playback so the recording is easy
      // to review step by step (default on unless explicitly disabled) —
      // same flag/convention as app/api/eauto/shopping-cart/run/route.ts.
      PW_DETAILED: detailed === false ? "0" : "1",
      PW_OUTPUT_DIR: recordDir,
      PW_JSON_REPORT: jsonReportPath,
      PW_STEP_REPORT: stepReportPath,
      // TS04's manual Report-Engine stop/restart pause points — see
      // tests/service-hub/utils/manualGate.ts.
      PW_GATE_DIR: gateDir,
    };

    // Argument array, no shell — scenario titles never reach cmd.exe.
    const args = ["test", "--config", configPath, "--grep", grepPattern];

    const logs: string[] = [
      `[CMD] playwright ${args.join(" ")}`,
      `[CWD] ${projectRoot}`,
      `[GREP] ${grepPattern}`,
      `[HEADLESS] ${headless}`,
      `[RECORD DIR] ${recordDir}`,
    ];

    stopRequested = false;

    return new Promise<NextResponse>((resolve) => {
      const proc = spawnPlaywrightCli(projectRoot, args, { env });
      currentChild = proc;
      let stdout = "";
      let stderr = "";
      let settled = false;
      proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

      // Stop pressed but the process never closed within 5s — answer anyway.
      forceResolveRun = () => {
        if (settled) return;
        settled = true;
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        if (runId) unregisterEautoRun(runId);
        resolve(NextResponse.json({
          stopped: true, exitCode: -1, results: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
          recordDir: path.relative(projectRoot, recordDir), evidence: [],
          stderr: stderr.slice(-5000), stdout: stdout.slice(-5000), logs, timestamp: ts,
        }));
      };

      proc.on("error", (err) => {
        if (settled) return;
        settled = true;
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        if (runId) unregisterEautoRun(runId);
        logs.push(`[SPAWN ERROR] ${err.message}`);
        resolve(NextResponse.json({
          exitCode: -1, results: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
          recordDir: path.relative(projectRoot, recordDir), evidence: [],
          stderr: err.message, stdout: "", logs, timestamp: ts,
        }));
      });

      proc.on("close", (code) => {
        if (currentChild === proc) currentChild = null;
        forceResolveRun = null;
        if (settled) return;
        settled = true;
        if (runId) unregisterEautoRun(runId);
        logs.push(`[EXIT CODE] ${code}`);
        logs.push(`[REPORT EXISTS] ${fs.existsSync(jsonReportPath)}`);

        let results: TestResultItem[] = [];
        try {
          const report = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));
          const stepsByTitle = loadStepsByTitle(stepReportPath);

          type JsonSuite = { title?: string; specs?: JsonSpec[]; suites?: JsonSuite[] };
          type JsonSpec = {
            title?: string;
            tests?: {
              results?: {
                status?: string; duration?: number;
                error?: { message?: string; snippet?: string };
                errors?: { message?: string; snippet?: string }[];
                attachments?: { name?: string; path?: string }[];
              }[];
            }[];
          };

          const extractSpecs = (suites: JsonSuite[]): TestResultItem[] => {
            const out: TestResultItem[] = [];
            for (const s of suites) {
              for (const spec of s.specs ?? []) {
                const testResult = spec.tests?.[0]?.results?.[0];
                const status = testResult?.status ?? "unknown";
                let errorMsg = "";
                if (status === "failed" || status === "timedOut") {
                  const err = testResult?.error;
                  const errs = testResult?.errors;
                  if (err?.message) errorMsg = err.message;
                  else if (errs?.length) errorMsg = errs.map((e) => e.message).filter(Boolean).join("\n");
                  if (err?.snippet && !errorMsg.includes(err.snippet)) errorMsg += "\n" + err.snippet;
                }
                const cleanedError = stripAnsi(errorMsg).slice(0, 2000);
                if (spec.title && testResult?.attachments?.length) {
                  organizeTestEvidence(spec.title, testResult.attachments);
                }
                out.push({
                  title: spec.title ?? "",
                  status: status === "timedOut" ? "failed" : status,
                  duration: testResult?.duration ?? 0,
                  error: cleanedError,
                  friendlyError: errorMsg ? toPlainEnglish(errorMsg) : "",
                  steps: stepsByTitle[spec.title ?? ""] ?? [],
                });
              }
              if (s.suites) out.push(...extractSpecs(s.suites));
            }
            return out;
          };

          results = extractSpecs(report.suites ?? []);
        } catch (e) {
          logs.push(`[REPORT ERROR] ${e instanceof Error ? e.message : String(e)}`);
        }

        const evidence = publishEvidence(ts, recordDir, scenarios, results);

        const passed = results.filter((r) => r.status === "passed").length;
        const failed = results.filter((r) => r.status === "failed").length;
        const skipped = results.filter((r) => r.status === "skipped").length;

        resolve(NextResponse.json({
          ...(stopRequested && { stopped: true }),
          exitCode: code,
          results,
          summary: { total: results.length, passed, failed, skipped },
          recordDir: path.relative(projectRoot, recordDir),
          evidence,
          stderr: stderr.slice(-5000),
          stdout: stdout.slice(-5000),
          logs,
          timestamp: ts,
        }));
      });
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 },
    );
  }
}

/** Stop button — kills the Playwright process tree. Returns 200 either way. */
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);
    const savedResolve = forceResolveRun;
    setTimeout(() => { savedResolve?.(); }, 5000);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
