import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// Runs the eAuto UCD Insurance purchase E2E (scripts/eauto-e2e) and streams
// its PROGRESS:/ART:/RESULT: stdout back as a parsed result. A real purchase
// against staging can take several minutes.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_E2E_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-e2e");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-e2e");
const TIMEOUT_MS = 15 * 60 * 1000;

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

// Parse the last RESULT:/PROGRESS: lines and collect ART: screenshots.
function parseStream(output: string) {
  const progress: { step: string; status: string; label?: string }[] = [];
  const artifacts: { kind: string; file: string; caption?: string }[] = [];
  let result: Record<string, unknown> | null = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("PROGRESS:")) { try { progress.push(JSON.parse(line.slice(9))); } catch { /* ignore */ } }
    else if (line.startsWith("ART:"))  { try { artifacts.push(JSON.parse(line.slice(4))); } catch { /* ignore */ } }
    else if (line.startsWith("RESULT:")) { try { result = JSON.parse(line.slice(7)); } catch { /* ignore */ } }
  }
  return { progress, artifacts, result };
}

// Copy the run's screenshots + report + newest video into public/ so the
// dashboard can display them, and return their web paths.
function publishArtifacts(artifactDir: string): { screenshots: string[]; video?: string; reportMd?: string } {
  const webBase = "/qa-artifacts/eauto-e2e";
  fs.mkdirSync(PUBLIC_ART, { recursive: true });
  // wipe previous run's published files
  for (const f of fs.existsSync(PUBLIC_ART) ? fs.readdirSync(PUBLIC_ART) : []) {
    try { fs.rmSync(path.join(PUBLIC_ART, f), { force: true }); } catch { /* ignore */ }
  }
  const screenshots: string[] = [];
  let video: string | undefined;
  let reportMd: string | undefined;

  if (fs.existsSync(artifactDir)) {
    for (const f of fs.readdirSync(artifactDir)) {
      const src = path.join(artifactDir, f);
      if (/\.png$/i.test(f)) { fs.copyFileSync(src, path.join(PUBLIC_ART, f)); screenshots.push(`${webBase}/${f}`); }
      else if (f === "report.md") { reportMd = fs.readFileSync(src, "utf-8"); }
    }
  }
  // newest video from Playwright's test-results
  const tr = path.join(SCRIPT_DIR, "test-results");
  if (fs.existsSync(tr)) {
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
      const dest = "run.webm";
      try { fs.copyFileSync(newest, path.join(PUBLIC_ART, dest)); video = `${webBase}/${dest}`; } catch { /* ignore */ }
    }
  }
  screenshots.sort();
  return { screenshots, video, reportMd };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | boolean>;

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: `Playwright not installed. Run:\n\n  cd scripts/eauto-e2e && npm install && npx playwright install chromium` }, { status: 500 });
  }
  if (!body.vehicleNo || !body.ic) {
    return NextResponse.json({ error: "Vehicle number and IC are required." }, { status: 400 });
  }

  const artifactDir = path.join(SCRIPT_DIR, "artifacts", "run");
  fs.rmSync(artifactDir, { recursive: true, force: true });

  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=insurance-e2e"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        E2E_ARTIFACT_DIR: artifactDir,
        ...(body.env         && { E2E_ENV:         String(body.env) }),
        ...(body.username    && { E2E_USERNAME:    String(body.username) }),
        ...(body.password    && { E2E_PASSWORD:    String(body.password) }),
        ...(body.vehicleNo   && { E2E_VEHICLE_NO:  String(body.vehicleNo) }),
        ...(body.ic          && { E2E_IC:          String(body.ic) }),
        ...(body.category    && { E2E_CATEGORY:    String(body.category) }),
        ...(body.email       && { E2E_EMAIL:       String(body.email) }),
        ...(body.insurer     && { E2E_INSURER:     String(body.insurer) }),
        ...(body.coverage    && { E2E_COVERAGE:    String(body.coverage) }),
        ...(body.sumMode     && { E2E_SUM:         String(body.sumMode) }),
        ...(body.bank        && { E2E_BANK:        String(body.bank) }),
        ...(body.stopBeforePayment ? { E2E_STOP_BEFORE_PAYMENT: "1" } : {}),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => { killTree(child); resolve({ code: 1, output: output + "\nTimed out after 15 minutes." }); }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const { progress, artifacts, result: parsed } = parseStream(result.output);
  const published = publishArtifacts(artifactDir);

  if (stopRequested) {
    return NextResponse.json({ stopped: true, progress, artifacts, log: result.output, ...published });
  }
  return NextResponse.json({
    result: parsed,
    progress,
    artifacts,
    log: result.output,
    ...published,
  }, { status: parsed || result.code === 0 ? 200 : 500 });
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
