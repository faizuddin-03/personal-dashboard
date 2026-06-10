import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

// ── Running-process registry ──────────────────────────────────
// Module-level so a separate DELETE request can find and stop the
// child spawned by an in-flight POST. Single dev-server instance, so
// one run at a time is the expected case.
let currentChild: ChildProcess | null = null;
let stopRequested = false;

// Kill the whole process tree (npx → playwright → browsers). On Windows
// use taskkill /T; on POSIX kill the detached process group via -pid.
function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); }
    catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGTERM"); }
    catch { try { child.kill("SIGTERM"); } catch { /* ignore */ } }
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

// ── Write input-vehicles.xlsx for the Playwright script to read ──
function writeInputExcel(vehicles: string[], icNumber: string, postcode: string, vehicleCategory: string) {
  const rows = [
    ["Vehicle Number", "IC Number", "Postcode", "Vehicle Category"],
    ...vehicles.map(vn => [vn, icNumber, postcode, vehicleCategory]),
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
}

function readOutputExcel(): InsuranceRow[] {
  if (!fs.existsSync(OUTPUT_XLSX)) return [];
  const wb = XLSX.read(fs.readFileSync(OUTPUT_XLSX));
  const ws = wb.Sheets["Summary"];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw.map(r => ({
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
  }));
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    vehicles: string[];
    icNumber?: string;
    postcode?: string;
    vehicleCategory?: string;
    username?: string;
    password?: string;
    baseUrl?: string;
    concurrency?: number;
  };

  const { vehicles = [], icNumber = "", postcode = "", vehicleCategory = "individual", username = "", password = "", baseUrl = "", concurrency } = body;

  if (!vehicles.length) {
    return NextResponse.json({ error: "No vehicle numbers provided." }, { status: 400 });
  }

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `Script directory not found: ${SCRIPT_DIR}\n\nEither run "npm install" inside scripts/eauto-insurance/, or set INSURANCE_SCRIPT_DIR in .env.local to point to your script folder.`,
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

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    const child = spawn("npx", ["playwright", "test", "--project=insurance-checker"], {
      cwd: SCRIPT_DIR,
      shell: true,
      // Detach on POSIX so the whole tree shares a process group we can kill.
      detached: process.platform !== "win32",
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

    child.stdout.on("data", (d: Buffer) => { output += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close",  (code) => { clearTimeout(timer); currentChild = null; resolve({ code: code ?? 1, output }); });
    child.on("error",  (err)  => { clearTimeout(timer); currentChild = null; resolve({ code: 1, output: err.message }); });
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
// The pending POST resolves on its own once the child is killed and
// returns the partial results flushed to disk.
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killProcessTree(currentChild);
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
