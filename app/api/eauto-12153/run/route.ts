import { stitchFocusVideo } from "@/lib/server/focusVideo";
import { NextRequest, NextResponse } from "next/server";
import { markSpoiledCompanies } from "@/lib/server/companySpoiled";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { killTree, runInProgressResponse } from "@/lib/server/playwrightRun";

// Runs the EAINT-12153 onboarding payment-channel suite (scripts/eauto-12153),
// copied from app/api/eauto-12107/run/route.ts (itself from eauto-jomcheck)
// (the standard per-TS queue + per-TS evidence shape); only the env-var
// mapping below differs.
// Standard flow benchmark per Faizuddin, 2026-09-30: app/api/eauto/12166's
// run route — JSON reporter + step reporter merged into a per-check step
// tree with a plain-English friendlyError, PW_HEADED/PW_VIDEO/PW_DETAILED
// wired from the dashboard's Headless/Detailed toggles, and the newest
// recording published for playback.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_12153_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-12153");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12153");
// 80 minutes: one TS is a full onboarding chain (eSIM seed, reCAPTCHA by a
// person, two Fiuu payments or four on failed-then-redo TS, two BO users).
// Kept above the suite's own 60/75-minute Playwright timeout.
const TIMEOUT_MS = 80 * 60 * 1000;

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

interface RunStep {
  title: string;
  duration: number;
  error?: string;
  steps: RunStep[];
}
interface CheckResult {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  error?: string;
  friendlyError?: string;
  steps: RunStep[];
  /** e.g. "12339_TS22" — names this TS's own video, zip and evidence files. */
  tsLabel: string;
  /** THIS test's own video / failure screenshot / downloads — never another TS's. */
  evidence: EvidenceItem[];
  video?: string;
  /** DETAIL: lines this test printed (from its own stdout, not the whole run's). */
  details: DetailItem[];
  /** Absolute paths from the JSON report, consumed by publishEvidence(). */
  attachments?: { name: string; path: string }[];
  /** The test's focus timeline (utils/focusTimeline.ts) — joined into one video after publishing. */
  focusTimeline?: string;
}

interface RawStep {
  title: string;
  category: string;
  duration: number;
  error?: string;
  steps: RawStep[];
}

// Steps whose failure is always deliberately best-effort/caught in the page
// object itself — same reasoning as app/api/eauto/12166/run/route.ts
// (KNOWN_BENIGN_STEP_TITLES): Playwright still records the underlying
// pw:api call as "errored" even though the calling code swallowed it.
const KNOWN_BENIGN_STEP_TITLES = [/^close page$/i];

/**
 * Keeps ONLY the deliberately-authored test.step(...) entries — Playwright's
 * own auto-recorded expect/pw:api noise (raw locator strings, matcher
 * internals) is dropped even when it failed, not just when it passed.
 * Faizuddin, 2026-10-02: "the steps shouldnt contain the log readings. its
 * literally the human language for what it did." A failed test.step's own
 * `error` is kept (it's the human-authored step name + the real failure),
 * but a failed raw pw:api/expect step underneath it is silently dropped —
 * the check's own `friendlyError` already says what went wrong in plain
 * English, and the full raw output is always available in the log panel at
 * the bottom (with its own copy button) for anyone who needs the technical
 * detail.
 */
function filterSteps(raw: RawStep[]): RunStep[] {
  const out: RunStep[] = [];
  for (const s of raw ?? []) {
    if (KNOWN_BENIGN_STEP_TITLES.some((re) => re.test(s.title))) continue;
    if (s.category === "test.step") {
      out.push({ title: s.title, duration: s.duration, error: s.error, steps: filterSteps(s.steps) });
    }
  }
  return out;
}

/** Reads PW_STEP_REPORT's per-test step tree, keyed by leaf test title (the
 *  same spec.title the JSON reporter uses). */
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

/** Turn a raw Playwright error message into a one-line, plain-English summary
 *  — same toPlainEnglish() as app/api/eauto/12166/run/route.ts. */
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

// Playwright's json reporter shape (only the fields this route reads).
interface PlaywrightJsonSpec {
  title: string;
  tests?: Array<{
    results?: Array<{
      status: CheckResult["status"];
      duration: number;
      error?: { message?: string };
      attachments?: Array<{ name: string; contentType?: string; path?: string }>;
      stdout?: Array<{ text?: string }>;
    }>;
  }>;
}
interface PlaywrightJsonSuite {
  specs?: PlaywrightJsonSpec[];
  suites?: PlaywrightJsonSuite[];
}
interface PlaywrightJsonReport {
  suites?: PlaywrightJsonSuite[];
}

function parseResults(jsonText: string, stepsByTitle: Record<string, RunStep[]>): CheckResult[] {
  let report: PlaywrightJsonReport;
  try { report = JSON.parse(jsonText); } catch { return []; }

  const results: CheckResult[] = [];
  const walkSuite = (suite: PlaywrightJsonSuite) => {
    for (const spec of suite.specs ?? []) {
      const test = spec.tests?.[0];
      const r = test?.results?.[0];
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
        attachments: (r.attachments ?? [])
          .filter((a): a is { name: string; path: string } => !!a.path)
          .map(a => ({ name: a.name, path: a.path })),
      });
    }
    for (const sub of suite.suites ?? []) walkSuite(sub);
  };
  for (const suite of report.suites ?? []) walkSuite(suite);
  return results;
}

/**
 * Derives a filesystem-safe label from the run's scenario titles for naming
 * the recording and the bulk-download zip — Faizuddin, 2026-10-02: "the
 * naming of the recording must be the TS number. same goes for the zip file
 * for bulk download." Faizuddin, 2026-10-03: "the test evidence naming must
 * follow the excel. in excel, it is showing like this: 12339_TS01" — the
 * label must carry the TICKET PREFIX too (the workbook's "TS No." column is
 * literally "12339_TS01", never a bare "TS01"), so this groups every `TSNN`
 * found in a title under that title's leading ticket number (e.g.
 * "12339_TS19/TS20: ..." -> ticket "12339", codes ["TS19","TS20"]) and
 * renders each ticket's codes as `<ticket>_<code>_<code>...`. A non-TS
 * scenario (a "setup" utility like "12339_PURCHASE: ...") has no `TSNN` —
 * falls back to the bit before the colon (`PURCHASE`), still under its
 * ticket prefix.
 */
function deriveRunLabel(scenarios: string[]): string {
  const byTicket = new Map<string, Set<string>>();
  const noTicket = new Set<string>();
  for (const title of scenarios) {
    const ticket = title.match(/^(\d+)_/)?.[1];
    const tsCodes = title.match(/TS\d+/g);
    const codes = tsCodes?.length
      ? tsCodes
      : [title.split(":")[0]?.replace(/^\d+_/, "").trim()].filter((c): c is string => !!c);
    for (const code of codes) {
      if (ticket) {
        if (!byTicket.has(ticket)) byTicket.set(ticket, new Set());
        byTicket.get(ticket)!.add(code);
      } else {
        noTicket.add(code);
      }
    }
  }
  const parts: string[] = [];
  for (const [ticket, codes] of byTicket) parts.push(`${ticket}_${Array.from(codes).join("_")}`);
  parts.push(...noTicket);
  return parts.length ? parts.join("_") : "run";
}

interface DetailItem { label: string; value: string; }

/**
 * Parses `DETAIL:{"label":"...","value":"..."}` lines out of the run's
 * stdout — the plain, useful facts a test-data-setup scenario produces
 * (vehicle no., transaction id, reference no., ...) shown INSTEAD OF a
 * recording, per Faizuddin, 2026-10-02: "running a test data setup wont
 * record. it will simply show the details, such as VN, transaction ID,
 * reference ID, anything that is usefull." Any spec can emit these —
 * `console.log('DETAIL:' + JSON.stringify({ label, value }))` — not just
 * setup scenarios, but the dashboard only surfaces them prominently when
 * `record` was false.
 */
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

interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file"; }

/** Classifies an evidence filename's extension into the dashboard's three
 *  display kinds — image/video get their own preview treatment, anything
 *  else (an Excel export, a CSV, a PDF) is just a generic downloadable
 *  "file". Faizuddin, 2026-10-03: "the automation must also allow the excel
 *  to be included in the test evidence bulk download" — this is what makes
 *  a downloaded Excel (saved via `BasePage.saveDownloadAsEvidence()`) show
 *  up here instead of only `.png` screenshots. */
function classifyEvidenceKind(filename: string): EvidenceItem["kind"] {
  if (/\.(png|jpe?g|gif|webp)$/i.test(filename)) return "image";
  if (/\.(webm|mp4|mov)$/i.test(filename)) return "video";
  return "file";
}

// How many past runs' evidence folders to keep on disk. Faizuddin,
// 2026-10-03: a JomCheck API download is a limited, precious resource ("we
// need to make sure we get all details possible in case need to refer in
// the future") — pruning down to only the LATEST run on every new run (the
// old behaviour) could silently delete an earlier run's downloaded report
// the moment any later run finishes, API-related or not. Now keeps the last
// N runs instead of just 1 — override via EAUTO_12153_HISTORY_LIMIT if
// 30 isn't the right depth (videos are the main disk cost).
// Requirement C (Faizuddin, 2026-10-21): keep every run's evidence so TS Tracker links never break; default no prune.
const HISTORY_LIMIT = Number(process.env.EAUTO_12153_HISTORY_LIMIT) || Infinity;

/**
 * Publishes this run's evidence — the newest .webm recording plus every
 * file under PW_EVIDENCE_DIR (screenshots from BasePage.captureEvidence()/
 * captureHighlightedPdfEvidence(), and any other download saved via
 * BasePage.saveDownloadAsEvidence(), e.g. an Excel export) — into
 * public/qa-artifacts/eauto-12153/<runId>/, so each item gets its own
 * stable, downloadable URL. Writes a small `meta.json` alongside the
 * evidence (runLabel, timestamp, scenario titles) so
 * `app/api/eauto-12153/history/route.ts` can list past runs without
 * guessing at folder names. Keeps the last `HISTORY_LIMIT` runs' folders —
 * NOT just the latest (see HISTORY_LIMIT comment) — pruning only once that
 * cap is exceeded, oldest first.
 */
/**
 * ONE recording per TS (Faizuddin, 2026-10-22: "the QR thing opens a new tab
 * and a new browser … it should record ALL OF IT … in one recording only"):
 * the separate page recordings (eAuto, Fiuu payment window, DuitNow scanner,
 * BackOffice, eSIM) are cut to the test's focus timeline and joined into
 * <TS>.mp4 (lib/server/focusVideo.ts). The separate .webm files are then
 * dropped. If joining fails, they stay as they were.
 */
async function joinRecordings(runId: string, checks: CheckResult[], evidence: EvidenceItem[]): Promise<void> {
  const runDir = path.join(PUBLIC_ART, runId);
  for (const check of checks) {
    const timeline = check.focusTimeline;
    delete check.focusTimeline;
    if (!timeline || !fs.existsSync(timeline)) continue;
    const name = `${check.tsLabel}.mp4`;
    const why = await stitchFocusVideo(timeline, path.join(runDir, name));
    if (why) { check.details = [...(check.details ?? []), { label: "Video", value: `One recording not built (${why}); the separate recordings are kept.` }]; continue; }
    const item: EvidenceItem = { label: check.tsLabel, url: `/qa-artifacts/eauto-12153/${runId}/${name}`, kind: "video" };
    const separate = new Set(check.evidence.filter(e => e.kind === "video").map(e => e.url));
    for (const url of separate) { try { fs.rmSync(path.join(runDir, path.basename(url))); } catch { /* ignore */ } }
    check.evidence = [item, ...check.evidence.filter(e => !separate.has(e.url))];
    check.video = item.url;
    for (let i = evidence.length - 1; i >= 0; i--) if (separate.has(evidence[i].url)) evidence.splice(i, 1);
    evidence.unshift(item);
  }
}

function publishEvidence(
  runId: string,
  evidenceDir: string,
  runLabel: string,
  record: boolean,
  scenarioTitles: string[],
  checks: CheckResult[],
): { video?: string; evidence: EvidenceItem[] } {
  const webBase = `/qa-artifacts/eauto-12153/${runId}`;
  const runDir = path.join(PUBLIC_ART, runId);
  fs.mkdirSync(PUBLIC_ART, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, "meta.json"),
    // `results` lets Past runs filter Passed only / Failed only.
    JSON.stringify({ runId, runLabel, timestamp: Date.now(), scenarios: scenarioTitles, results: checks.map(c => ({ title: c.title, status: c.status })) }),
  );

  const evidence: EvidenceItem[] = [];

  // Every file captured via BasePage's evidence helpers — screenshots AND
  // any downloaded file (Excel export, CSV, PDF, ...) saved via
  // saveDownloadAsEvidence(). Not just .png: an evidence file keeps its own
  // extension, classified by classifyEvidenceKind() for display.
  //
  // PER TS (Faizuddin, 2026-10-01: "how am i supposed to know which test
  // evidence for which TS?"): every file is published under its own TS's
  // label and attached to that check — <ticket>_TSnn-<what>.<ext> for
  // downloads, <ticket>_TSnn.webm for its OWN video, <ticket>_TSnn-failed.png
  // for its failure screenshot. A file whose name carries no TS number is
  // kept at run level only.
  const tsOf = (name: string) => name.match(/TS(\d+)/)?.[1];
  const checkForTs = (ts?: string) => ts ? checks.find(c => new RegExp(`TS${ts}(?!\\d)`).test(c.tsLabel)) : undefined;
  const publish = (src: string, name: string, check?: CheckResult) => {
    try {
      fs.copyFileSync(src, path.join(runDir, name));
      const item: EvidenceItem = { label: name.replace(/\.[^.]+$/, ""), url: `${webBase}/${name}`, kind: classifyEvidenceKind(name) };
      // One row per published file, whatever path produced it — the
      // dashboard keys evidence rows by URL.
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
      const check = checkForTs(tsOf(f));
      // A label written without the ticket prefix gets it added here
      // ("12107_TS01-...").
      const ticket = check?.tsLabel.match(/^(\d+)_/)?.[1];
      const name = ticket && /^TS\d/.test(f) ? `${ticket}_${f}` : f;
      publish(path.join(evidenceDir, f), name, check);
    }
  }

  for (const check of checks) {
    // A test that opens a second tab (the PDF viewer in TS02/03/05/36/43,
    // the finder's parallel tabs) gets one "video" attachment PER TAB.
    // Publishing them all as <TS>.webm overwrote the main recording with the
    // last tab's and listed the same URL twice (React "two children with the
    // same key" on 12339_TS05.webm, 2026-10-05). Extra tabs are kept as
    // <TS>-tab2.webm, -tab3.webm, ...
    // The main tab is the LARGEST video, not the first attachment: a click
    // that opens a short-lived tab (PDF download) adds ~1 s videos that
    // Playwright may list first (12412_TS01, 2026-10-19: "only records 1
    // second"). Same fix as app/api/eauto-12412/run/route.ts.
    const size = (p: string) => { try { return fs.statSync(p).size; } catch { return 0; } };
    const all = check.attachments ?? [];
    const attachments = [
      ...all.filter(a => a.name === "video").sort((x, y) => size(y.path) - size(x.path)),
      ...all.filter(a => a.name !== "video"),
    ];
    let videoNo = 0;
    for (const a of attachments) {
      if (!fs.existsSync(a.path)) continue;
      if (a.name === "video" && record) {
        videoNo++;
        publish(a.path, videoNo === 1 ? `${check.tsLabel}.webm` : `${check.tsLabel}-tab${videoNo}.webm`, check);
      }
      if (a.name === "screenshot") publish(a.path, `${check.tsLabel}-failed${path.extname(a.path) || ".png"}`, check);
      if (a.name === "focus-timeline") check.focusTimeline = a.path;
    }
    delete check.attachments;
    check.evidence.sort((a, b) => (a.kind === "video" ? -1 : b.kind === "video" ? 1 : a.label.localeCompare(b.label)));
  }

  // Fallback only (no per-test results, e.g. a stopped run): newest video
  // recording under the run label. Skipped entirely when `record` is false, so a
  // STALE .webm from a previous (recorded) run never gets mistaken for this
  // one's (PW_VIDEO=0 produces no new file at all).
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
      const newest = vids.sort((a, b) => b.t - a.t)[0].p;
      const videoFilename = `${runLabel}.webm`;
      try {
        fs.copyFileSync(newest, path.join(runDir, videoFilename));
        video = `${webBase}/${videoFilename}`;
        // A single-TS run names its own video <ticket>_TSnn.webm, which
        // publish() above already listed — pushing it again gave the
        // dashboard two evidence rows with the same label/URL (React
        // "two children with the same key" on 12339_TS37, 2026-10-05).
        if (!evidence.some(e => e.url === video)) evidence.push({ label: runLabel, url: video, kind: "video" });
      } catch { /* ignore */ }
    }
  }

  evidence.sort((a, b) => a.label.localeCompare(b.label));

  // Prune only once HISTORY_LIMIT is exceeded, oldest first — never on
  // every run. Reads each folder's own meta.json for its timestamp rather
  // than folder mtime, which the OS can refresh on unrelated access.
  try {
    const runDirs = fs.readdirSync(PUBLIC_ART, { withFileTypes: true })
      .filter(f => f.isDirectory())
      .map(f => {
        const metaPath = path.join(PUBLIC_ART, f.name, "meta.json");
        let timestamp = 0;
        try { timestamp = JSON.parse(fs.readFileSync(metaPath, "utf-8")).timestamp ?? 0; } catch { /* ignore */ }
        return { name: f.name, timestamp };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    for (const old of runDirs.slice(HISTORY_LIMIT)) {
      try { fs.rmSync(path.join(PUBLIC_ART, old.name), { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } catch { /* best-effort — never fail a run over housekeeping */ }

  return { video, evidence };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | string[] | boolean | Record<string, string> | undefined>;

  // One run at a time on this page (2026-10-21).
  if (currentChild) return runInProgressResponse();
  const scenarios = Array.isArray(body.scenarios) ? body.scenarios : [];
  // Every suite input arrives as E12153_* (scripts/eauto-12153/data/config.ts).
  // Only names of that shape, with string values, reach the child process.
  const suiteEnv = body.env && typeof body.env === "object" && !Array.isArray(body.env)
    ? Object.fromEntries(Object.entries(body.env).filter(([k, v]) => /^E12153_[A-Z0-9_]+$/.test(k) && typeof v === "string"))
    : {};

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: `Playwright not installed. Run:\n\n  cd scripts/eauto-12153 && npm install && npx playwright install chromium` }, { status: 500 });
  }
  if (!scenarios.length) {
    return NextResponse.json({ error: "No scenarios selected." }, { status: 400 });
  }

  const runMetaDir = path.join(SCRIPT_DIR, "test-results", "_run");
  fs.mkdirSync(runMetaDir, { recursive: true });
  const jsonReportPath = path.join(runMetaDir, "report.json");
  const stepReportPath = path.join(runMetaDir, "steps.json");
  const evidenceDir = path.join(runMetaDir, "evidence");
  fs.rmSync(jsonReportPath, { force: true });
  fs.rmSync(stepReportPath, { force: true });
  fs.rmSync(evidenceDir, { recursive: true, force: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  // Date.now() is fine here — this is a normal Next.js route, not a
  // Workflow script. Used as the public/ subfolder name for this run's
  // evidence, so download-all can target exactly one run.
  const runId = String(Date.now());
  // The TS number(s) this run covers — names the recording and the
  // bulk-download zip (Faizuddin, 2026-10-02), e.g. "TS06_TS18".
  const runLabel = deriveRunLabel(scenarios);

  stopRequested = false;
  runOutputBuffer = "";

  // Escape each title's regex metacharacters, join with "|" — same pattern as
  // app/api/eauto/12166/run/route.ts. Quoting on win32 shell is required
  // (see knowledge/automation-playbook.md: cmd re-parses argv, an unquoted
  // "|" is read as a pipe once 2+ scenarios are selected).
  const grepPattern = scenarios.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  // The comment above said to quote on win32 but the code never did — so any
  // run with 2+ scenarios died in cmd.exe before Playwright started (Faizuddin,
  // 2026-10-01: "if i select multiple and click run, it will load for a bit,
  // and then nothing happens"). Inside cmd double quotes a literal " would end
  // the quoting, so titles' own quotes (e.g. = "Yes") become "." — regex "any
  // character", which still matches the quote in the real title.
  const grepArg = process.platform === "win32" ? `"${grepPattern.replace(/"/g, ".")}"` : grepPattern;
  const args = ["playwright", "test", "--grep", grepArg];

  const headless = body.headless !== false; // default true, same as 12166
  const detailed = body.detailed !== false; // default true, same as 12166
  // Test-data-setup runs skip recording entirely — Faizuddin, 2026-10-02:
  // "running a test data setup wont record." The dashboard passes
  // `record: false` when every selected scenario is kind "setup"; anything
  // else (a TS, or a mix) still records as before.
  const record = body.record !== false;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", args, {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
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
    const timer = setTimeout(() => { killTree(child); resolve({ code: 1, output: output + "\nTimed out after 80 minutes." }); }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    // stderr goes into the returned log too — a run that dies before
    // Playwright starts (shell error, bad grep) only ever writes there, and
    // leaving it out made those failures show as a blank result.
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const jsonText = !stopRequested && fs.existsSync(jsonReportPath) ? fs.readFileSync(jsonReportPath, "utf-8") : "";
  const stepsByTitle = loadStepsByTitle(stepReportPath);
  const checks = parseResults(jsonText, stepsByTitle);
  const { video, evidence } = publishEvidence(runId, evidenceDir, runLabel, record, scenarios, checks);
  if (record) await joinRecordings(runId, checks, evidence);
  const details = parseDetails(result.output);
  markSpoiledCompanies(result.output, "EAINT-12153");

  if (stopRequested) {
    return NextResponse.json({ stopped: true, video, evidence, details, runId, runLabel, log: result.output });
  }

  const passed = checks.filter(c => c.status === "passed").length;
  const failed = checks.filter(c => c.status !== "passed" && c.status !== "skipped").length;

  return NextResponse.json({
    result: { checks, passed, failed, total: checks.length },
    video,
    evidence,
    details,
    runId,
    runLabel,
    // Always the full raw stdout+stderr — Faizuddin, 2026-10-02: shown at
    // the bottom with a copy button regardless of pass/fail, so it can be
    // pasted straight into a Claude conversation for troubleshooting.
    log: result.output,
  }, { status: 200 });
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
