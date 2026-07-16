import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// ── Running-process registry ──────────────────────────────────
let currentChild: ChildProcess | null = null;
let stopRequested = false;
// Force-resolve the in-flight POST promise when Stop is called, so the
// UI never gets stuck at "Stopping…" even if the browser process won't die.
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); }
    catch { /* ignore */ }
  } else {
    // SIGKILL cannot be caught or ignored — more reliable than SIGTERM for
    // Playwright + headless-Chrome trees that may swallow SIGTERM.
    try { process.kill(-child.pid, "SIGKILL"); }
    catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

// ── Configuration ─────────────────────────────────────────────
// By default the script lives at scripts/eauto-insurance/ inside the project.
// Override with INSURANCE_SCRIPT_DIR in .env.local if it's somewhere else:
//   INSURANCE_SCRIPT_DIR=C:/Users/you/scripts/eauto-insurance
const SCRIPT_DIR  = process.env.INSURANCE_SCRIPT_DIR
  ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "eauto-insurance");
const INPUT_XLSX  = path.join(SCRIPT_DIR, "input-vehicles.xlsx");
const OUTPUT_XLSX = path.join(SCRIPT_DIR, "output-results.xlsx");
const TIMEOUT_MS  = 30 * 60 * 1000; // 30 minutes

// Default IC used when a vehicle has no IC and no global IC is supplied.
const DEFAULT_IC = "030217141005";

interface VehicleEntry { vehicleNumber: string; icNumber?: string }

// ── Write input-vehicles.xlsx for the Playwright script to read ──
// IC format has 2 dashes: "030217-14-1005" → strip → "030217141005"
// SSM format has 1 dash:  "1234567-X"      → keep  → "1234567-X"
function normalizeIdNumber(raw: string): string {
  const s = raw.replace(/\s/g, "");
  return (s.match(/-/g) ?? []).length >= 2 ? s.replace(/-/g, "") : s;
}

// Per-vehicle IC/SSM wins; otherwise the global field; otherwise DEFAULT_IC.
function writeInputExcel(vehicles: VehicleEntry[], icNumber: string, postcode: string, vehicleCategory: string) {
  const fallbackIc = icNumber.trim() ? normalizeIdNumber(icNumber.trim()) : DEFAULT_IC;
  const rows = [
    ["Vehicle Number", "IC Number", "Postcode", "Vehicle Category"],
    ...vehicles.map(v => [
      v.vehicleNumber,
      v.icNumber ? normalizeIdNumber(v.icNumber) : fallbackIc,
      postcode,
      vehicleCategory,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  fs.writeFileSync(INPUT_XLSX, buffer);
}

// ── Parse output-results.xlsx written by the Playwright script ──
interface InsuranceRow {
  vehicleNumber: string; make: string; model: string; mfgYear: string;
  engineCC: string; transmission: string; variant: string;
  insurer: string; coverType: string; allowPurchase: string;
  referRiskCode: string; totalPrice: string;
  status: string; errorMessage: string;
}

function readOutputExcel(): InsuranceRow[] {
  if (!fs.existsSync(OUTPUT_XLSX)) return [];
  const wb = XLSX.read(fs.readFileSync(OUTPUT_XLSX));

  // Successful rows from the Summary sheet
  const rows: InsuranceRow[] = [];
  const ws = wb.Sheets["Summary"];
  if (ws) {
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    for (const r of raw) {
      rows.push({
        vehicleNumber:  String(r["Vehicle Number"]  ?? ""),
        make:           String(r["Make"]            ?? ""),
        model:          String(r["Model"]           ?? ""),
        mfgYear:        String(r["Mfg Year"]        ?? ""),
        engineCC:       String(r["Engine CC"]       ?? ""),
        transmission:   String(r["Transmission"]    ?? ""),
        variant:        String(r["Variant"]         ?? ""),
        insurer:        String(r["Insurer"]         ?? ""),
        coverType:      String(r["Cover Type"]      ?? ""),
        allowPurchase:  String(r["Allow Purchase"]  ?? ""),
        referRiskCode:  String(r["Refer Risk Code"] ?? ""),
        totalPrice:     String(r["Total Price"]     ?? ""),
        status:         "SUCCESS",
        errorMessage:   "",
      });
    }
  }

  // Error / skipped rows from the Skipped Vehicles sheet
  const sk = wb.Sheets["Skipped Vehicles"];
  if (sk) {
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sk, { defval: "" });
    for (const r of raw) {
      rows.push({
        vehicleNumber: String(r["Vehicle Number"] ?? ""),
        make: "", model: "", mfgYear: "", engineCC: "", transmission: "",
        variant: "", insurer: "", coverType: "", allowPurchase: "",
        referRiskCode: "", totalPrice: "",
        status:       String(r["Status"] ?? "ERROR"),
        errorMessage: String(r["Reason"] ?? ""),
      });
    }
  }

  return rows;
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    vehicles: VehicleEntry[];
    icNumber?: string;
    postcode?: string;
    vehicleCategory?: string;
    username?: string;
    password?: string;
    baseUrl?: string;
    concurrency?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const { vehicles = [], icNumber = "", postcode = "", vehicleCategory = "individual", username = "", password = "", baseUrl = "", concurrency } = body;

  if (!vehicles.length) {
    return NextResponse.json({ error: "No vehicle numbers provided." }, { status: 400 });
  }

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `Script directory not found. Either run "npm install" inside scripts/eauto-insurance/, or set INSURANCE_SCRIPT_DIR in .env.local to point to your script folder.`,
    }, { status: 500 });
  }

  const nodeModulesExist = fs.existsSync(path.join(SCRIPT_DIR, "node_modules"));
  if (!nodeModulesExist) {
    return NextResponse.json({
      error: `Playwright not installed. Run this command first:\n\n  cd scripts/eauto-insurance && npm install`,
    }, { status: 500 });
  }

  // Write input Excel
  writeInputExcel(vehicles, icNumber, postcode, vehicleCategory);

  // Remove stale output
  if (fs.existsSync(OUTPUT_XLSX)) fs.unlinkSync(OUTPUT_XLSX);

  // Run Playwright test
  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=insurance-checker"], {
      cwd: SCRIPT_DIR,
      detached: process.platform !== "win32",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ...(username    && { EAUTO_USERNAME:    username }),
        ...(password    && { EAUTO_PASSWORD:    password }),
        ...(baseUrl     && { EAUTO_BASE_URL:    baseUrl }),
        ...(concurrency && { INSURANCE_CONCURRENCY: String(concurrency) }),
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

  // If the run was stopped, return whatever partial results were flushed to disk
  if (stopRequested) {
    const rows = readOutputExcel();
    return NextResponse.json({ rows, log: result.output, stopped: true });
  }

  // If test failed AND no output file was produced, surface the error
  if (result.code !== 0 && !fs.existsSync(OUTPUT_XLSX)) {
    return NextResponse.json({ error: result.output || "Playwright test failed with no output." }, { status: 500 });
  }

  const rows = readOutputExcel();
  return NextResponse.json({ rows, log: result.output });
}

// ── Stop the in-flight run ────────────────────────────────────
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killProcessTree(currentChild);

    // If the child process doesn't close within 5 s (e.g. Chrome ignores SIGKILL
    // in a restricted container), force-resolve the pending POST so the UI exits
    // "Stopping…" and shows whatever partial results were flushed to disk.
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
