import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { jsonAndSave } from "@/lib/server/savedResults";

/** Last result saved on the server (lib/savedRunKeys.ts, 2026-10-21). */
const SAVE_KEY = "secarang-plate-checker";

// ── Secarang Plate / SSM Checker ──────────────────────────────
// /eauto/secarang-plate-checker. For each pasted vehicle no. + IC / SSM, does
// Secarang show an error message or reach the quotation step? Runs
// scripts/secarang-insurance project "plate-checker" (20 tabs by default).
// Process registry and Stop handling: same shape as
// app/api/eauto/company-details-checker/run/route.ts.

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";
let runTotal = 0;

function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); }
    catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); }
    catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

const SCRIPT_DIR  = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "secarang-insurance");
const INPUT_JSON  = path.join(SCRIPT_DIR, "input-plates.json");
const OUTPUT_JSON = path.join(SCRIPT_DIR, "output-plates.json");
const TIMEOUT_MS  = 2 * 60 * 60 * 1000; // 2 hours — hundreds of rows

export interface PlateRowInput { vehicleNo: string; idNo: string; ownerType: "private" | "company"; postcode?: string }
export interface PlateRowResult extends PlateRowInput {
  result: "PROCEED" | "ERROR";
  stage: string;
  message: string;
}

function readOutputJson(): PlateRowResult[] {
  if (!fs.existsSync(OUTPUT_JSON)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_JSON, "utf-8"));
    return Array.isArray(parsed?.results) ? parsed.results : [];
  } catch {
    return []; // mid-write — the next poll reads it
  }
}

// ── POST — run the checker ────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { rows: PlateRowInput[]; baseUrl?: string; sitePassword?: string; postcode?: string; concurrency?: number; headed?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }
  const { rows = [], baseUrl = "", sitePassword = "", postcode = "", concurrency, headed } = body;
  if (!rows.length) return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  if (currentChild) return NextResponse.json({ error: "A check is already running." }, { status: 409 });
  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({ error: "Playwright not installed. Run:\n\n  cd scripts/secarang-insurance && npm install" }, { status: 500 });
  }

  fs.writeFileSync(INPUT_JSON, JSON.stringify({ rows }, null, 2));
  if (fs.existsSync(OUTPUT_JSON)) fs.unlinkSync(OUTPUT_JSON);
  stopRequested = false;
  runOutputBuffer = "";
  runTotal = rows.length;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=plate-checker", "--reporter=line"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ...(baseUrl      && { SECARANG_BASE_URL: baseUrl.replace(/\/+$/, "").replace(/\/car-insurance$/, "") }),
        ...(sitePassword && { SECARANG_SITE_PASSWORD: sitePassword }),
        ...(postcode     && { SECARANG_POSTCODE: postcode }),
        ...(concurrency  && { SECARANG_CONCURRENCY: String(concurrency) }),
        PW_HEADED: headed ? "1" : "0",
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killProcessTree(child);
      resolve({ code: 1, output: output + "\nTimed out after 2 hours." });
    }, TIMEOUT_MS);
    child.stdout.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close", (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error", (err)  => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  const results = readOutputJson();
  if (stopRequested) return jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { results, log: result.output, stopped: true });
  if (result.code !== 0 && !results.length) {
    return jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { error: result.output || "Playwright test failed with no output." }, { status: 500 });
  }
  return jsonAndSave(SAVE_KEY, (body as { runId?: unknown }).runId, { results, log: result.output });
}

// ── GET — progress while running ──────────────────────────────
export async function GET() {
  return NextResponse.json({ running: !!currentChild, total: runTotal, results: readOutputJson() });
}

// ── DELETE — stop the in-flight run ───────────────────────────
export async function DELETE() {
  if (!currentChild) return NextResponse.json({ stopped: false, message: "No run in progress." });
  stopRequested = true;
  killProcessTree(currentChild);
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
