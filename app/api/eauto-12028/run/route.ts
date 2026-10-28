import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { type ChildProcess } from "node:child_process";
import { killTree, runInProgressResponse, spawnPlaywrightCli, invalidScenarioTitles, grepFor } from "@/lib/server/playwrightRun";

// Runs the EAINT-12028 Association Payment Listing suite (scripts/eauto-12028).
// Shape copied from app/api/eauto-12153/run/route.ts (itself from
// eauto-jomcheck / 12166): one TS per call (the runner queues them), JSON +
// step reporter merged per check, plain-English friendlyError, per-TS evidence
// published to public/qa-artifacts/eauto-12028/<runId>/ with meta.json for
// Past runs. Differences: Playwright is started without a shell
// (spawnPlaywrightCli, titles checked by invalidScenarioTitles) and only
// E12028_* inputs reach the child process.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_12028_SCRIPT_DIR ?? path.join(process.cwd(), "scripts", "eauto-12028");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12028");
// 3 hours: month-close TS (12028_TS23-TS25) wait the typed cron interval, and
// 12028_TS166 idles past the session timeout; both stay well under this.
const TIMEOUT_MS = 180 * 60 * 1000;

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

interface RunStep { title: string; duration: number; error?: string; steps: RunStep[] }
interface DetailItem { label: string; value: string }
interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file" }
interface CheckResult {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  error?: string;
  friendlyError?: string;
  steps: RunStep[];
  /** e.g. "12028_TS22" — names this TS's own video, zip and evidence files. */
  tsLabel: string;
  evidence: EvidenceItem[];
  video?: string;
  details: DetailItem[];
  attachments?: { name: string; path: string }[];
}
interface RawStep { title: string; category: string; duration: number; error?: string; steps: RawStep[] }

/** Keeps ONLY the authored test.step entries (Faizuddin, 2026-10-02: "the steps
 *  shouldnt contain the log readings") — same as app/api/eauto-12153/run/route.ts. */
function filterSteps(raw: RawStep[]): RunStep[] {
  const out: RunStep[] = [];
  for (const s of raw ?? []) {
    if (/^close page$/i.test(s.title)) continue;
    if (s.category === "test.step") out.push({ title: s.title, duration: s.duration, error: s.error, steps: filterSteps(s.steps) });
  }
  return out;
}

function loadStepsByTitle(stepReportPath: string): Record<string, RunStep[]> {
  const out: Record<string, RunStep[]> = {};
  try {
    if (!fs.existsSync(stepReportPath)) return out;
    const data = JSON.parse(fs.readFileSync(stepReportPath, "utf-8")) as { tests: { title: string; steps: RawStep[] }[] };
    for (const t of data.tests ?? []) out[t.title] = filterSteps(t.steps);
  } catch { /* best-effort */ }
  return out;
}

/** One-line plain-English summary of a Playwright error — same as app/api/eauto-12153/run/route.ts. */
function toPlainEnglish(rawMessage: string): string {
  const text = stripAnsi(rawMessage);
  const locatorDesc = text.match(/waiting for locator\('([^']+)'\)/)?.[1] ?? null;
  if (/strict mode violation[\s\S]*resolved to (\d+) elements/.test(text)) {
    const count = text.match(/resolved to (\d+) elements/)?.[1] ?? "multiple";
    return `The test found ${count} matching elements on the page instead of 1, and couldn't tell which one to use${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  }
  if (/toBeVisible\(\)/.test(text) && /Expected: visible/.test(text)) return `Expected an element to appear on the page, but it never showed up in time${locatorDesc ? ` (${locatorDesc})` : ""}.`;
  if (/TimeoutError[\s\S]*locator\.click/.test(text)) return `The test tried to click something, but the click never went through in time${locatorDesc ? ` — target: ${locatorDesc}` : ""}.`;
  if (/^TimeoutError/m.test(text)) return `The test waited too long for something to happen and gave up${locatorDesc ? ` (waiting on: ${locatorDesc})` : ""}.`;
  const expectMatch = text.match(/expect\(received\)\.(\w+)\(([^)]*)\)/);
  const expectedVal = text.match(/Expected:\s*(.+)/)?.[1]?.trim();
  const receivedVal = text.match(/Received:\s*(.+)/)?.[1]?.trim();
  if (expectMatch) {
    if (expectedVal !== undefined && receivedVal !== undefined) return `The test's "${expectMatch[1]}" check failed — expected "${expectedVal}", got "${receivedVal}".`;
    return `A test assertion ("${expectMatch[1]}") failed.`;
  }
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return firstLine ? firstLine.slice(0, 300) : "The test failed for an unknown reason — see technical details below.";
}

interface PlaywrightJsonSpec {
  title: string;
  tests?: Array<{ results?: Array<{ status: CheckResult["status"]; duration: number; error?: { message?: string }; attachments?: Array<{ name: string; path?: string }>; stdout?: Array<{ text?: string }> }> }>;
}
interface PlaywrightJsonSuite { specs?: PlaywrightJsonSpec[]; suites?: PlaywrightJsonSuite[] }

function parseResults(jsonText: string, stepsByTitle: Record<string, RunStep[]>): CheckResult[] {
  let report: { suites?: PlaywrightJsonSuite[] };
  try { report = JSON.parse(jsonText); } catch { return []; }
  const results: CheckResult[] = [];
  const walk = (suite: PlaywrightJsonSuite) => {
    for (const spec of suite.specs ?? []) {
      const r = spec.tests?.[0]?.results?.[0];
      if (!r) continue;
      const errorMsg = r.error?.message;
      results.push({
        title: spec.title,
        status: r.status,
        durationMs: r.duration,
        error: errorMsg,
        friendlyError: errorMsg ? toPlainEnglish(errorMsg) : undefined,
        steps: stepsByTitle[spec.title] ?? [],
        tsLabel: deriveRunLabel([spec.title]),
        evidence: [],
        details: parseDetails((r.stdout ?? []).map(o => o.text ?? "").join("")),
        attachments: (r.attachments ?? []).filter((a): a is { name: string; path: string } => !!a.path).map(a => ({ name: a.name, path: a.path })),
      });
    }
    for (const sub of suite.suites ?? []) walk(sub);
  };
  for (const suite of report.suites ?? []) walk(suite);
  return results;
}

/** "12028_TS19: ..." → "12028_TS19"; "12028_PREP: ..." → "12028_PREP" (copied from app/api/eauto-12153/run/route.ts). */
function deriveRunLabel(scenarios: string[]): string {
  const byTicket = new Map<string, Set<string>>();
  const noTicket = new Set<string>();
  for (const title of scenarios) {
    const ticket = title.match(/^(\d+)_/)?.[1];
    const tsCodes = title.split(":")[0].match(/TS\d+/g);
    const codes = tsCodes?.length ? tsCodes : [title.split(":")[0]?.replace(/^\d+_/, "").trim()].filter((c): c is string => !!c);
    for (const code of codes) {
      if (ticket) { if (!byTicket.has(ticket)) byTicket.set(ticket, new Set()); byTicket.get(ticket)!.add(code); }
      else noTicket.add(code);
    }
  }
  const parts: string[] = [];
  for (const [ticket, codes] of byTicket) parts.push(`${ticket}_${Array.from(codes).join("_")}`);
  parts.push(...noTicket);
  return parts.length ? parts.join("_").replace(/[^\w-]/g, "_") : "run";
}

function parseDetails(output: string): DetailItem[] {
  const details: DetailItem[] = [];
  for (const line of output.split("\n")) {
    if (!line.startsWith("DETAIL:")) continue;
    try {
      const d = JSON.parse(line.slice("DETAIL:".length));
      if (d && typeof d.label === "string" && typeof d.value === "string") details.push(d);
    } catch { /* ignore malformed lines */ }
  }
  return details;
}

function classifyEvidenceKind(filename: string): EvidenceItem["kind"] {
  if (/\.(png|jpe?g|gif|webp)$/i.test(filename)) return "image";
  if (/\.(webm|mp4|mov)$/i.test(filename)) return "video";
  return "file";
}

// Every run's evidence is kept (Requirement C, Faizuddin 2026-10-21: TS Tracker links never break).
const HISTORY_LIMIT = Number(process.env.EAUTO_12028_HISTORY_LIMIT) || Infinity;

/** Per-TS evidence publishing — copied from app/api/eauto-12153/run/route.ts publishEvidence(). */
function publishEvidence(runId: string, evidenceDir: string, runLabel: string, record: boolean, scenarioTitles: string[], checks: CheckResult[]): { video?: string; evidence: EvidenceItem[] } {
  const webBase = `/qa-artifacts/eauto-12028/${runId}`;
  const runDir = path.join(PUBLIC_ART, runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "meta.json"), JSON.stringify({ runId, runLabel, timestamp: Date.now(), scenarios: scenarioTitles, results: checks.map(c => ({ title: c.title, status: c.status })) }));

  const evidence: EvidenceItem[] = [];
  const tsOf = (name: string) => name.match(/TS(\d+)/)?.[1];
  const checkForTs = (ts?: string) => ts ? checks.find(c => new RegExp(`TS${ts}(?!\\d)`).test(c.tsLabel)) : checks.length === 1 ? checks[0] : undefined;
  const publish = (src: string, name: string, check?: CheckResult) => {
    try {
      fs.copyFileSync(src, path.join(runDir, name));
      const item: EvidenceItem = { label: name.replace(/\.[^.]+$/, ""), url: `${webBase}/${name}`, kind: classifyEvidenceKind(name) };
      if (evidence.some(e => e.url === item.url)) return;
      evidence.push(item);
      if (check) {
        check.evidence.push(item);
        if (item.kind === "video" && !check.video) check.video = item.url;
      }
    } catch { /* ignore */ }
  };

  if (fs.existsSync(evidenceDir)) {
    for (const f of fs.readdirSync(evidenceDir)) {
      if (!fs.statSync(path.join(evidenceDir, f)).isFile()) continue;
      publish(path.join(evidenceDir, f), f, checkForTs(tsOf(f)));
    }
  }

  for (const check of checks) {
    // The main tab is the LARGEST video (a download can open a short-lived tab) — same as 12153.
    const size = (p: string) => { try { return fs.statSync(p).size; } catch { return 0; } };
    const all = check.attachments ?? [];
    const attachments = [...all.filter(a => a.name === "video").sort((x, y) => size(y.path) - size(x.path)), ...all.filter(a => a.name !== "video")];
    let videoNo = 0;
    for (const a of attachments) {
      if (!fs.existsSync(a.path)) continue;
      if (a.name === "video" && record) {
        videoNo++;
        publish(a.path, videoNo === 1 ? `${check.tsLabel}.webm` : `${check.tsLabel}-tab${videoNo}.webm`, check);
      }
      if (a.name === "screenshot") publish(a.path, `${check.tsLabel}-failed${path.extname(a.path) || ".png"}`, check);
    }
    delete check.attachments;
    check.evidence.sort((a, b) => (a.kind === "video" ? -1 : b.kind === "video" ? 1 : a.label.localeCompare(b.label)));
  }

  // Fallback (no per-test results, e.g. a stopped run): newest recording under the run label.
  let video: string | undefined;
  const tr = path.join(SCRIPT_DIR, "test-results");
  if (record && !checks.length && fs.existsSync(tr)) {
    const vids: { p: string; t: number }[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.webm$/i.test(e.name)) vids.push({ p: full, t: fs.statSync(full).mtimeMs });
      }
    };
    walk(tr);
    if (vids.length) {
      const name = `${runLabel}.webm`;
      try {
        fs.copyFileSync(vids.sort((a, b) => b.t - a.t)[0].p, path.join(runDir, name));
        video = `${webBase}/${name}`;
        if (!evidence.some(e => e.url === video)) evidence.push({ label: runLabel, url: video, kind: "video" });
      } catch { /* ignore */ }
    }
  }
  evidence.sort((a, b) => a.label.localeCompare(b.label));

  try {
    const runDirs = fs.readdirSync(PUBLIC_ART, { withFileTypes: true }).filter(f => f.isDirectory()).map(f => {
      let timestamp = 0;
      try { timestamp = JSON.parse(fs.readFileSync(path.join(PUBLIC_ART, f.name, "meta.json"), "utf-8")).timestamp ?? 0; } catch { /* ignore */ }
      return { name: f.name, timestamp };
    }).sort((a, b) => b.timestamp - a.timestamp);
    for (const old of runDirs.slice(HISTORY_LIMIT)) {
      try { fs.rmSync(path.join(PUBLIC_ART, old.name), { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } catch { /* housekeeping only */ }

  return { video, evidence };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  if (currentChild) return runInProgressResponse();

  const scenarios = Array.isArray(body.scenarios) ? body.scenarios as string[] : [];
  if (!scenarios.length) return NextResponse.json({ error: "No scenarios selected." }, { status: 400 });
  const bad = invalidScenarioTitles(scenarios);
  if (bad) return NextResponse.json({ error: `Scenario title not allowed: ${bad.join(", ")}` }, { status: 400 });
  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules", "@playwright", "test"))) {
    return NextResponse.json({ error: "Playwright not installed. Run:\n\n  cd scripts/eauto-12028 && npm install && npx playwright install chromium" }, { status: 500 });
  }
  // Every suite input arrives as E12028_* (scripts/eauto-12028/data/config.ts); nothing else reaches the child.
  const suiteEnv = body.env && typeof body.env === "object" && !Array.isArray(body.env)
    ? Object.fromEntries(Object.entries(body.env as Record<string, unknown>).filter(([k, v]) => /^E12028_[A-Z0-9_]+$/.test(k) && typeof v === "string")) as Record<string, string>
    : {};

  const runMetaDir = path.join(SCRIPT_DIR, "test-results", "_run");
  fs.mkdirSync(runMetaDir, { recursive: true });
  const jsonReportPath = path.join(runMetaDir, "report.json");
  const stepReportPath = path.join(runMetaDir, "steps.json");
  const evidenceDir = path.join(runMetaDir, "evidence");
  fs.rmSync(jsonReportPath, { force: true });
  fs.rmSync(stepReportPath, { force: true });
  fs.rmSync(evidenceDir, { recursive: true, force: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  const runId = String(Date.now());
  const runLabel = deriveRunLabel(scenarios);
  stopRequested = false;
  runOutputBuffer = "";

  const headless = body.headless === true; // runner default: Headless off
  const detailed = body.detailed !== false; // runner default: Detailed on
  const record = body.record !== false;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawnPlaywrightCli(SCRIPT_DIR, ["test", "--grep", grepFor(scenarios)], {
      env: {
        ...process.env,
        PW_HEADED: headless ? "0" : "1",
        PW_VIDEO: record ? "1" : "0",
        PW_DETAILED: detailed ? "1" : "0",
        PW_JSON_REPORT: jsonReportPath,
        PW_STEP_REPORT: stepReportPath,
        PW_EVIDENCE_DIR: evidenceDir,
        ...suiteEnv,
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => { killTree(child); resolve({ code: 1, output: output + "\nTimed out after 3 hours." }); }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const jsonText = !stopRequested && fs.existsSync(jsonReportPath) ? fs.readFileSync(jsonReportPath, "utf-8") : "";
  const checks = parseResults(jsonText, loadStepsByTitle(stepReportPath));
  const { video, evidence } = publishEvidence(runId, evidenceDir, runLabel, record, scenarios, checks);
  const details = parseDetails(result.output);

  if (stopRequested) return NextResponse.json({ stopped: true, video, evidence, details, runId, runLabel, log: result.output });

  const passed = checks.filter(c => c.status === "passed").length;
  const failed = checks.filter(c => c.status !== "passed" && c.status !== "skipped").length;
  // Always the full raw log (Faizuddin, 2026-10-02: copy button at the bottom, pass or fail).
  return NextResponse.json({ result: { checks, passed, failed, total: checks.length }, video, evidence, details, runId, runLabel, log: result.output }, { status: 200 });
}

export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);
    const savedResolve = forceResolveRun;
    const savedOutput = runOutputBuffer;
    setTimeout(() => { if (savedResolve) { if (forceResolveRun === savedResolve) forceResolveRun = null; savedResolve({ code: 1, output: savedOutput }); } }, 5000);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
