import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// Runs the ORIGINAL eSTM script (scripts/eauto-estm-legacy) — the single-file
// spec that predates the page-object refactor, copied verbatim from
// `_reference/automation code/eSTM Bypass/estm-bypass-test.spec.ts`.
//
// scripts/eauto-estm is the refactor of this same flow and is the maintained
// one. This route exists so the original can still be run as a known-good
// baseline: if it passes and ours fails, the fault is in our code, not staging.
//
// Because the script is unmodified, its Playwright project is still named
// `estm` — do not rename it there to match this route.
//
// It emits both PROGRESS: and RESULT: lines, so the page shows a step list and
// a result card.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_ESTM_LEGACY_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-estm-legacy");
const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-estm-legacy");
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

// Copies the newest video AND the newest error-context.md out of test-results.
//
// The error context is the file that names WHICH step failed — Playwright writes
// it next to the video on failure, with the call stack and a snapshot of the
// page as it stood. It used to be left in test-results, where the next run's
// output or a stray cleanup wipes it, and a failure then can only be described
// by its exception type and not its location. Publish both or debugging the
// next failure means reproducing it first.
function publishArtifacts(): { video?: string; errorContext?: string } {
  const webBase = "/qa-artifacts/eauto-estm-legacy";
  fs.mkdirSync(PUBLIC_ART, { recursive: true });
  for (const f of fs.existsSync(PUBLIC_ART) ? fs.readdirSync(PUBLIC_ART) : []) {
    try { fs.rmSync(path.join(PUBLIC_ART, f), { force: true }); } catch { /* ignore */ }
  }
  const tr = path.join(SCRIPT_DIR, "test-results");
  if (!fs.existsSync(tr)) return {};

  const vids: { p: string; t: number }[] = [];
  const ctxs: { p: string; t: number }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.webm$/i.test(e.name)) vids.push({ p: full, t: fs.statSync(full).mtimeMs });
      else if (e.name === "error-context.md") ctxs.push({ p: full, t: fs.statSync(full).mtimeMs });
    }
  };
  walk(tr);

  const newest = (list: { p: string; t: number }[]) =>
    list.length ? list.sort((a, b) => b.t - a.t)[0].p : undefined;
  const copy = (src: string | undefined, name: string) => {
    if (!src) return undefined;
    try { fs.copyFileSync(src, path.join(PUBLIC_ART, name)); return `${webBase}/${name}`; }
    catch { return undefined; }
  };

  return {
    video: copy(newest(vids), "run.webm"),
    errorContext: copy(newest(ctxs), "error-context.md"),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string>;

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: `Playwright not installed. Run:\n\n  cd scripts/eauto-estm-legacy && npm install && npx playwright install chromium` }, { status: 500 });
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
      // ONLY the eight vars the script reads. Bypass slot and eLKM came later,
      // with the refactor; passing them here would imply this script honours
      // them. It doesn't — it would ignore them silently, which is worse than
      // not offering them at all.
      env: {
        ...process.env,
        // Without this the script ends on page.pause(), which hangs the run
        // waiting for a click in the Playwright inspector.
        ESTM_SKIP_PAUSE: "1",
        ESTM_ENV_SEGMENT:    body.envSegment,
        ESTM_VEHICLE_REG_NO: body.vehicleRegNo,
        ESTM_EMAIL_ADDRESS:  body.emailAddress,
        ESTM_MOBILE_NO:      body.mobileNo,
        // Credentials default HERE, not in the script. The script's own
        // fallbacks are still the old `nsub2abc` / `abcd1234`, but it is a
        // verbatim copy that must not be edited (see its README), and env vars
        // are its documented interface — so the current default is injected
        // instead. Keep this in step with scripts/eauto-estm/data/config.ts.
        ESTM_USERNAME: body.username || "faizuddinsub2",
        ESTM_PASSWORD: body.password || "password",
        // No ESTM_EVOC_EMAIL — this version hardcodes the eVOC address.
        ...(body.idType && { ESTM_ID_TYPE: body.idType }),
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
  const { video, errorContext } = publishArtifacts();

  if (stopRequested) {
    return NextResponse.json({ stopped: true, progress, video, errorContext, log: result.output });
  }
  return NextResponse.json({
    result: parsed ?? { status: result.code === 0 ? "SUCCESS" : "FAIL" },
    progress,
    video,
    errorContext,
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
