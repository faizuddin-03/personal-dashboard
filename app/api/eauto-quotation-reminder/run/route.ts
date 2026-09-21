import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";

// Runs the EAINT-11864 quotation-reminder suite (scripts/eauto-quotation-reminder)
// and returns Playwright's JSON report plus the run recording.
//
// The suite is time-sensitive: several cases have to generate their quotation at
// a specific minute relative to the hourly 07:00–23:00 cron, so a scheduled run
// can sit idle for the best part of an hour before it does anything. The timeout
// below allows for that; the shorter default used elsewhere would kill it.
//
// The ceiling is set by TS03, which waits out TWO cron runs to prove the second
// one sends nothing: up to an hour of schedule hold, then up to an hour to the
// first run, then an hour to the second. 90 minutes would kill it mid-scenario
// and report a timeout where the real answer was still pending.
export const maxDuration = 14400;

const SCRIPT_DIR = process.env.EAUTO_QR_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-quotation-reminder");
// TS01/TS04/TS07 spawn this as a fully separate Playwright browser (utils/estm.ts,
// createEstm()) to build the precondition eSTM — a second, independently recorded
// video that publishVideo() below has to go find and stitch in, or it's silently
// dropped. eauto-esim (TS06's e-simulator leg) records no video at all (its own
// config sets `video: 'off'`), so it never needs the same treatment.
const ESTM_SCRIPT_DIR = path.join(process.cwd(), "scripts", "eauto-estm");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-quotation-reminder");
const TIMEOUT_MS = 4 * 60 * 60 * 1000;

interface RunRequest {
  scenarios: string[];
  baseUrl: string;
  scheduleMode: "now" | "before-hour" | "on-hour" | "at";
  scheduleAt?: string;
  headless?: boolean;
  ucdUser: string;
  ucdPass: string;
  subUcdUser?: string;
  subUcdPass?: string;
  vehicleNo: string;
  ic: string;
  /** TS04 only: the buyer email and mobile its eSTM leg is created with. */
  estmBuyerEmail?: string;
  estmMobile?: string;
}

/**
 * Mailtrap is read in a signed-in Chrome profile, and testing ALWAYS runs in the
 * work profile — this is fixed, not a per-run choice, so it is resolved here and
 * never taken from the request.
 *
 * We resolve by ACCOUNT, not by folder name. "Default" happens to be the
 * modefair.com profile today, but folder-to-account mapping changes whenever
 * profiles are added or recreated, and silently running as the wrong Google
 * account would read the wrong inbox and report a confident, wrong verdict.
 */
const REQUIRED_PROFILE_DOMAIN = "modefair.com";

interface ProfileInfo { name?: string; user_name?: string; hosted_domain?: string }

function resolveWorkProfile():
  | { ok: true; userDataDir: string; profileDir: string; account: string }
  | { ok: false; error: string } {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return { ok: false, error: "LOCALAPPDATA is not set — cannot locate Chrome." };

  const userDataDir = path.join(localAppData, "Google", "Chrome", "User Data");
  const localState = path.join(userDataDir, "Local State");
  if (!fs.existsSync(localState)) {
    return { ok: false, error: `Chrome profile data not found at ${userDataDir}. Is Chrome installed for this user?` };
  }

  let cache: Record<string, ProfileInfo>;
  try {
    const parsed = JSON.parse(fs.readFileSync(localState, "utf8")) as { profile?: { info_cache?: Record<string, ProfileInfo> } };
    cache = parsed.profile?.info_cache ?? {};
  } catch {
    return { ok: false, error: `Could not read Chrome's Local State at ${localState}.` };
  }

  const matches = Object.entries(cache).filter(
    ([, p]) => p.hosted_domain === REQUIRED_PROFILE_DOMAIN
      || (p.user_name ?? "").toLowerCase().endsWith(`@${REQUIRED_PROFILE_DOMAIN}`),
  );
  if (matches.length !== 1) {
    const seen = Object.entries(cache).map(([dir, p]) => `${dir} (${p.user_name || p.name || "unknown"})`).join(", ") || "none";
    return {
      ok: false,
      error: matches.length === 0
        ? `No Chrome profile signed in to ${REQUIRED_PROFILE_DOMAIN}. Testing always runs in the work profile — sign in to Chrome with your ${REQUIRED_PROFILE_DOMAIN} account first.\n\nProfiles found: ${seen}`
        : `${matches.length} Chrome profiles are signed in to ${REQUIRED_PROFILE_DOMAIN}, so the right one is ambiguous.\n\nProfiles found: ${seen}`,
    };
  }

  const [profileDir, info] = matches[0];
  return { ok: true, userDataDir, profileDir, account: info.user_name ?? REQUIRED_PROFILE_DOMAIN };
}

interface JsonSpec {
  title: string;
  tests?: { results?: { status?: string; duration?: number; error?: { message?: string } }[] }[];
}
interface JsonSuite { title?: string; specs?: JsonSpec[]; suites?: JsonSuite[] }

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

/** Flatten Playwright's nested JSON report into one row per test. */
function extractResults(suites: JsonSuite[]): { title: string; status: string; duration: number; error: string }[] {
  const out: { title: string; status: string; duration: number; error: string }[] = [];
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const r = spec.tests?.[0]?.results?.[0];
      out.push({
        title: spec.title,
        status: r?.status ?? "unknown",
        duration: r?.duration ?? 0,
        error: r?.error?.message ?? "",
      });
    }
    if (suite.suites) out.push(...extractResults(suite.suites));
  }
  return out;
}

function findVideos(scriptDir: string, sinceMs: number): { p: string; t: number }[] {
  const tr = path.join(scriptDir, "test-results");
  if (!fs.existsSync(tr)) return [];
  const vids: { p: string; t: number }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.webm$/i.test(e.name)) {
        const t = fs.statSync(full).mtimeMs;
        if (t >= sinceMs) vids.push({ p: full, t });
      }
    }
  };
  walk(tr);
  return vids;
}

/**
 * TS01/TS04/TS07 open a SECOND browser (the eSTM leg, spawned as a separate
 * `scripts/eauto-estm` Playwright process) that finishes and closes before the
 * quotation-reminder browser's own test even logs in — so the two videos are
 * chronologically sequential, never concurrent, and concatenating them in
 * start-time order tells the same story a single continuous recording would.
 * Same resolution in both projects (1920x1080), so `-c copy` (no re-encode)
 * works; only falls back to a re-encoding concat filter if that fails.
 *
 * `sinceMs` scopes the search to THIS run — both test-results directories
 * accumulate across runs and are never cleared, so anything older is a
 * leftover from a previous run, not part of this one.
 */
function publishVideo(sinceMs: number): string | undefined {
  const webBase = "/qa-artifacts/eauto-quotation-reminder";
  fs.mkdirSync(PUBLIC_ART, { recursive: true });
  for (const f of fs.readdirSync(PUBLIC_ART)) {
    try { fs.rmSync(path.join(PUBLIC_ART, f), { force: true }); } catch { /* ignore */ }
  }

  const vids = [...findVideos(SCRIPT_DIR, sinceMs), ...findVideos(ESTM_SCRIPT_DIR, sinceMs)]
    .sort((a, b) => a.t - b.t);
  if (!vids.length) return undefined;

  const out = path.join(PUBLIC_ART, "run.webm");
  if (vids.length === 1) {
    try { fs.copyFileSync(vids[0].p, out); return `${webBase}/run.webm`; } catch { return undefined; }
  }

  const listFile = path.join(PUBLIC_ART, "concat-list.txt");
  const list = vids.map((v) => `file '${v.p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listFile, list);

  const copyResult = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", out]);
  if (copyResult.status === 0 && fs.existsSync(out)) {
    fs.rmSync(listFile, { force: true });
    return `${webBase}/run.webm`;
  }

  // Fall back to a re-encoding concat in case the videos don't share an exactly
  // matching codec/timebase (stream copy is strict about that).
  const inputs = vids.flatMap((v) => ["-i", v.p]);
  const filterInputs = vids.map((_, i) => `[${i}:v]scale=1920:1080,setsar=1[v${i}]`).join(";");
  const concatInputs = vids.map((_, i) => `[v${i}]`).join("");
  const filter = `${filterInputs};${concatInputs}concat=n=${vids.length}:v=1:a=0[outv]`;
  const reencode = spawnSync("ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", "[outv]", out]);
  fs.rmSync(listFile, { force: true });
  if (reencode.status === 0 && fs.existsSync(out)) return `${webBase}/run.webm`;

  // Both merge attempts failed — fall back to at least publishing the last
  // (quotation-reminder) leg rather than surfacing no video at all.
  try { fs.copyFileSync(vids[vids.length - 1].p, out); return `${webBase}/run.webm`; } catch { return undefined; }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Partial<RunRequest>;

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `The quotation-reminder suite has not been scaffolded yet.\n\nExpected it at scripts/eauto-quotation-reminder — this page is wired and ready, but there is no spec for it to run.`,
    }, { status: 501 });
  }
  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({
      error: `Playwright not installed. Run:\n\n  cd scripts/eauto-quotation-reminder && npm install && npx playwright install chromium`,
    }, { status: 500 });
  }

  const required: (keyof RunRequest)[] = ["baseUrl", "ucdUser", "ucdPass", "vehicleNo", "ic"];
  const missing = required.filter(k => !body[k]);
  if (!body.scenarios?.length) missing.push("scenarios");
  if (body.scheduleMode === "at" && !body.scheduleAt) missing.push("scheduleAt");
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
  }

  // Not fatal: a run with no reachable inbox still creates the quotation and
  // reports the email check as blocked. The reason is surfaced to the UI so it
  // reads as "sign in to Chrome", not as a broken test.
  const profile = resolveWorkProfile();

  stopRequested = false;
  runOutputBuffer = "";

  const reportPath = path.join(SCRIPT_DIR, "test-results", "report.json");
  try { fs.rmSync(reportPath, { force: true }); } catch { /* ignore */ }

  // --grep matches on the exact test titles the UI sent, so a scenario's title
  // here and its test() title in the spec must stay identical.
  const grep = body.scenarios!.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

  // On Windows we spawn through cmd.exe (shell: true, needed to resolve
  // npx.cmd), and cmd re-parses the argv. The "|" joining two or more titles
  // reads as a PIPE unless the whole value is quoted — with one scenario there
  // is no "|" and it works, so this only breaks once you select several, which
  // is the normal case. Titles never contain a double quote; strip any anyway
  // rather than let one escape the quoting.
  const isWin = process.platform === "win32";
  const grepArg = isWin ? `"${grep.replace(/"/g, "")}"` : grep;

  // Scopes publishVideo()'s search to videos this run produces — both
  // test-results directories accumulate across runs and are never cleared.
  const runStartedAt = Date.now();

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--grep", grepArg, "--reporter=json"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath,
        QR_BASE_URL:      body.baseUrl!,
        QR_UCD_USER:      body.ucdUser!,
        QR_UCD_PASS:      body.ucdPass!,
        QR_VEHICLE_NO:    body.vehicleNo!,
        QR_IC:            body.ic!,
        QR_SCHEDULE_MODE: body.scheduleMode ?? "now",
        QR_HEADLESS:      body.headless ? "1" : "",
        ...(body.scheduleAt    && { QR_SCHEDULE_AT:   body.scheduleAt }),
        ...(body.subUcdUser    && { QR_SUB_UCD_USER:  body.subUcdUser }),
        ...(body.subUcdPass    && { QR_SUB_UCD_PASS:  body.subUcdPass }),
        // TS04 spawns scripts/eauto-estm itself, so the eSTM page's own
        // prefill never reaches it — this is where that value comes from.
        ...(body.estmBuyerEmail && { QR_ESTM_BUYER_EMAIL: body.estmBuyerEmail }),
        ...(body.estmMobile     && { QR_ESTM_MOBILE:      body.estmMobile }),
        // Mailtrap is read through its web UI in the signed-in work profile —
        // not the REST API, and not a per-run choice. The spec copies this
        // directory before launching, because Chrome locks a profile that is
        // already open. If the profile can't be resolved the run still creates
        // the quotation and reports the email check as "blocked" rather than
        // passing it silently.
        ...(profile.ok && {
          QR_CHROME_USER_DATA_DIR: profile.userDataDir,
          QR_CHROME_PROFILE_DIR:   profile.profileDir,
        }),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killTree(child);
      resolve({ code: 1, output: output + `\nTimed out after ${TIMEOUT_MS / 3_600_000} hours.` });
    }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  let results: { title: string; status: string; duration: number; error: string }[] = [];
  try {
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as { suites?: JsonSuite[] };
      results = extractResults(report.suites ?? []);
    }
  } catch { /* fall through — the raw log is still returned */ }

  const video = publishVideo(runStartedAt);

  const profileInfo = profile.ok
    ? { account: profile.account, dir: profile.profileDir }
    : { error: profile.error };

  if (stopRequested) {
    return NextResponse.json({ stopped: true, results, video, profile: profileInfo, log: result.output });
  }
  return NextResponse.json(
    { results, video, profile: profileInfo, log: result.output },
    { status: results.length || result.code === 0 ? 200 : 500 },
  );
}

export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);
    const savedResolve = forceResolveRun;
    const savedOutput = runOutputBuffer;
    setTimeout(() => {
      if (savedResolve) {
        if (forceResolveRun === savedResolve) forceResolveRun = null;
        savedResolve({ code: 1, output: savedOutput });
      }
    }, 5000);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
