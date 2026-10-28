import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { killTree, runInProgressResponse } from "@/lib/server/playwrightRun";
import { jsonAndSave } from "@/lib/server/savedResults";

/** Last result saved on the server (lib/savedRunKeys.ts, 2026-10-21). */
const SAVE_KEY = "eauto/estm";

// Runs the eAuto eSTM (eSERAHAN) transfer flow (scripts/eauto-estm) and
// returns its parsed PROGRESS:/RESULT: stdout.
export const maxDuration = 600;

const SCRIPT_DIR = process.env.EAUTO_ESTM_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-estm");
const TIMEOUT_MS = 10 * 60 * 1000;

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function parseStream(output: string) {
  const progress: { step: string; status: string; label?: string }[] = [];
  let result: Record<string, unknown> | null = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("PROGRESS:")) { try { progress.push(JSON.parse(line.slice(9))); } catch { /* ignore */ } }
    else if (line.startsWith("RESULT:")) { try { result = JSON.parse(line.slice(7)); } catch { /* ignore */ } }
  }
  return { progress, result };
}


export async function POST(req: NextRequest) {
  // Mostly strings, but the add-on toggles arrive as booleans.
  const body = await req.json().catch(() => ({})) as Record<string, string | boolean | undefined>;

  // One run at a time on this page (2026-10-21).
  if (currentChild) return runInProgressResponse();
  const str = (k: string) => (typeof body[k] === "string" ? body[k] : "");

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
        ESTM_ENV_SEGMENT:   str("envSegment"),
        ESTM_VEHICLE_REG_NO: str("vehicleRegNo"),
        ESTM_EMAIL_ADDRESS: str("emailAddress"),
        ESTM_MOBILE_NO:     str("mobileNo"),
        ...(str("username") && { ESTM_USERNAME: str("username") }),
        ...(str("password") && { ESTM_PASSWORD: str("password") }),
        ...(str("idType")   && { ESTM_ID_TYPE:  str("idType") }),
        ...(str("evocEmail") && { ESTM_EVOC_EMAIL: str("evocEmail") }),
        // No bypass slot. The dashboard field was removed 2026-08-17 — the slot
        // no longer varies per run. The suite still needs one to build the
        // bypass URL and keeps `zzz/22` as CONFIG.bypassSlot; override it with
        // ESTM_BYPASS_SLOT in the environment if that ever changes.
        // Payment-step add-ons, both ticked by default (as the portal does).
        // Always send an explicit "1"/"0" — the suite treats an UNSET var as
        // on, so spreading these conditionally would make "off" unsendable.
        ESTM_ELKM: body.elkm === false ? "0" : "1",
        ESTM_EVOC: body.evoc === false ? "0" : "1",
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
  // No recording since 2026-10-21 (eAuto tools keep only their result), so a
  // stale run.webm from an older run must never be published as this one.
  const video: string | undefined = undefined;

  if (stopRequested) {
    return jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { stopped: true, progress, video, log: result.output });
  }
  return jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, {
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
