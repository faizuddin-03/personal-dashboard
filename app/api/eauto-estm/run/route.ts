import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// Runs the eAuto eSTM (eSERAHAN) transfer flow (scripts/eauto-estm) and
// returns its parsed PROGRESS:/RESULT: stdout.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_ESTM_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-estm");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-estm");
const TIMEOUT_MS = 10 * 60 * 1000;

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

function parseStream(output: string) {
  const progress: { step: string; status: string; label?: string }[] = [];
  let result: Record<string, unknown> | null = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("PROGRESS:")) { try { progress.push(JSON.parse(line.slice(9))); } catch { /* ignore */ } }
    else if (line.startsWith("RESULT:")) { try { result = JSON.parse(line.slice(7)); } catch { /* ignore */ } }
  }
  return { progress, result };
}

function publishVideo(): string | undefined {
  const webBase = "/qa-artifacts/eauto-estm";
  fs.mkdirSync(PUBLIC_ART, { recursive: true });
  for (const f of fs.existsSync(PUBLIC_ART) ? fs.readdirSync(PUBLIC_ART) : []) {
    try { fs.rmSync(path.join(PUBLIC_ART, f), { force: true }); } catch { /* ignore */ }
  }
  const tr = path.join(SCRIPT_DIR, "test-results");
  if (!fs.existsSync(tr)) return undefined;
  const vids: { p: string; t: number }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.webm$/i.test(e.name)) vids.push({ p: full, t: fs.statSync(full).mtimeMs });
    }
  };
  walk(tr);
  if (!vids.length) return undefined;
  const newest = vids.sort((a, b) => b.t - a.t)[0].p;
  try { fs.copyFileSync(newest, path.join(PUBLIC_ART, "run.webm")); return `${webBase}/run.webm`; } catch { return undefined; }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: `Playwright not installed. Run:\n\n  cd scripts/eauto-estm && npm install && npx playwright install chromium` }, { status: 500 });
  }
  const required = ["envSegment", "vehicleRegNo", "emailAddress", "mobileNo"];
  const missing = required.filter(k => !body[k]);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
  }

  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=estm"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ESTM_SKIP_PAUSE: "1",
        ESTM_ENV_SEGMENT:   body.envSegment,
        ESTM_VEHICLE_REG_NO: body.vehicleRegNo,
        ESTM_EMAIL_ADDRESS: body.emailAddress,
        ESTM_MOBILE_NO:     body.mobileNo,
        ...(body.username && { ESTM_USERNAME: body.username }),
        ...(body.password && { ESTM_PASSWORD: body.password }),
        ...(body.idType   && { ESTM_ID_TYPE:  body.idType }),
        ...(body.evocEmail && { ESTM_EVOC_EMAIL: body.evocEmail }),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => { killTree(child); resolve({ code: 1, output: output + "\nTimed out after 10 minutes." }); }, TIMEOUT_MS);
    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const { progress, result: parsed } = parseStream(result.output);
  const video = publishVideo();

  if (stopRequested) {
    return NextResponse.json({ stopped: true, progress, video, log: result.output });
  }
  return NextResponse.json({
    result: parsed ?? { status: result.code === 0 ? "SUCCESS" : "FAIL" },
    progress,
    video,
    log: result.output,
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
