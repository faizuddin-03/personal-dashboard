import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// ── Running-process registry ──────────────────────────────────
// Same shape as app/api/insurance/check/route.ts — see that file for the
// reasoning behind killProcessTree and the force-resolve-on-Stop dance.
let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

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

// ── Configuration ─────────────────────────────────────────────
const SCRIPT_DIR  = process.env.COMPANY_CHECKER_SCRIPT_DIR
  ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "eauto-company-checker");
const INPUT_JSON  = path.join(SCRIPT_DIR, "input-rows.json");
const OUTPUT_JSON = path.join(SCRIPT_DIR, "output-results.json");
const TIMEOUT_MS  = 30 * 60 * 1000; // 30 minutes

interface CompanyRowEntry { roc: string; newRoc: string; tin: string }

function writeInputJson(rows: CompanyRowEntry[]) {
  fs.writeFileSync(INPUT_JSON, JSON.stringify({ rows }, null, 2));
}

interface CompanyRowResult {
  roc: string; newRoc: string; tin: string;
  rocStatus: "PRESENT" | "ABSENT" | "ERROR";
  newRocStatus: "PRESENT" | "ABSENT" | "ERROR";
  tinStatus: "PRESENT" | "ABSENT" | "ERROR";
  overall: "PASS" | "FAIL";
  errorMessage?: string;
}

function readOutputJson(): CompanyRowResult[] {
  if (!fs.existsSync(OUTPUT_JSON)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_JSON, "utf-8"));
    return Array.isArray(parsed?.results) ? parsed.results : [];
  } catch {
    return [];
  }
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    rows: CompanyRowEntry[];
    username?: string;
    password?: string;
    baseUrl?: string;
    concurrency?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const { rows = [], username = "", password = "", baseUrl = "", concurrency } = body;

  if (!rows.length) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `Script directory not found. Either run "npm install" inside scripts/eauto-company-checker/, or set COMPANY_CHECKER_SCRIPT_DIR in .env.local to point to your script folder.`,
    }, { status: 500 });
  }

  const nodeModulesExist = fs.existsSync(path.join(SCRIPT_DIR, "node_modules"));
  if (!nodeModulesExist) {
    return NextResponse.json({
      error: `Playwright not installed. Run this command first:\n\n  cd scripts/eauto-company-checker && npm install`,
    }, { status: 500 });
  }

  writeInputJson(rows);

  if (fs.existsSync(OUTPUT_JSON)) fs.unlinkSync(OUTPUT_JSON);

  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=company-checker"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ...(username    && { EAUTO_USERNAME: username }),
        ...(password    && { EAUTO_PASSWORD: password }),
        ...(baseUrl     && { EAUTO_BASE_URL: baseUrl }),
        ...(concurrency && { COMPANY_CHECKER_CONCURRENCY: String(concurrency) }),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killProcessTree(child);
      resolve({ code: 1, output: "Timed out after 30 minutes." });
    }, TIMEOUT_MS);

    child.stdout.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close",  (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error",  (err)  => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  if (stopRequested) {
    const results = readOutputJson();
    return NextResponse.json({ results, log: result.output, stopped: true });
  }

  if (result.code !== 0 && !fs.existsSync(OUTPUT_JSON)) {
    return NextResponse.json({ error: result.output || "Playwright test failed with no output." }, { status: 500 });
  }

  const results = readOutputJson();
  return NextResponse.json({ results, log: result.output });
}

// ── Stop the in-flight run ────────────────────────────────────
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killProcessTree(currentChild);

    const savedResolve = forceResolveRun;
    const savedOutput  = runOutputBuffer;
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
