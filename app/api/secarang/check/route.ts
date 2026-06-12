import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

const SCRIPT_DIR  = process.env.SECARANG_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "secarang-insurance");
const INPUT_XLSX  = path.join(SCRIPT_DIR, "input-vehicles.xlsx");
const OUTPUT_XLSX = path.join(SCRIPT_DIR, "output-results.xlsx");
const TIMEOUT_MS  = 30 * 60 * 1000;

const DEFAULT_IC = "030217141005";

// ── Running-process registry ──────────────────────────────────
let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function killProcessTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); }
    catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

// ── Types ─────────────────────────────────────────────────────
interface VehicleEntry { vehicleNumber: string; icNumber?: string; vehicleType?: string; ownerType?: string }

export interface SecarangRow {
  vehicleNumber:   string;
  make:            string;
  model:           string;
  year:            string;
  variant:         string;
  insurer:         string;
  available:       string;
  unavailableReason: string;
  totalDisplayed:  string;
  totalAvailable:  string;
  status:          string;
  errorMessage:    string;
}

// ── Write input xlsx ──────────────────────────────────────────
function writeInputExcel(
  vehicles: VehicleEntry[],
  icNumber: string,
  postcode: string,
  vehicleType: string,
  ownerType: string,
) {
  const fallbackIc = icNumber.trim() || DEFAULT_IC;
  const rows = [
    ["Vehicle Number", "IC Number", "Postcode", "Notes", "Owner Type", "Vehicle Type"],
    ...vehicles.map(v => [
      v.vehicleNumber,
      (v.icNumber?.replace(/[-\s]/g, '') || fallbackIc),
      postcode,
      "",
      v.ownerType || ownerType,
      v.vehicleType || vehicleType,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  fs.writeFileSync(INPUT_XLSX, buffer);
}

// ── Parse output xlsx ─────────────────────────────────────────
function readOutputExcel(): SecarangRow[] {
  if (!fs.existsSync(OUTPUT_XLSX)) return [];
  const wb = XLSX.read(fs.readFileSync(OUTPUT_XLSX));

  // Read quotation rows (successful vehicles)
  const rows: SecarangRow[] = [];
  const qs = wb.Sheets["Quotations"];
  if (qs) {
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(qs, { defval: "" });
    for (const r of raw) {
      rows.push({
        vehicleNumber:    String(r["Vehicle Number"]  ?? ""),
        make:             String(r["Make"]            ?? ""),
        model:            String(r["Model"]           ?? ""),
        year:             String(r["Year"]            ?? ""),
        variant:          String(r["Variant"]         ?? ""),
        insurer:          String(r["Insurer"]         ?? ""),
        available:        String(r["Available"]       ?? ""),
        unavailableReason:String(r["Reason"]          ?? ""),
        totalDisplayed:   String(r["Total Displayed"] ?? ""),
        totalAvailable:   String(r["Total Available"] ?? ""),
        status:           "SUCCESS",
        errorMessage:     "",
      });
    }
  }

  // Read error rows from the Vehicles sheet (status === ERROR) and add them
  // as synthetic rows so the UI can display the failure message
  const vs = wb.Sheets["Vehicles"];
  if (vs) {
    const vraw = XLSX.utils.sheet_to_json<Record<string, unknown>>(vs, { defval: "" });
    for (const r of vraw) {
      if (String(r["Status"] ?? "").toUpperCase() !== "ERROR") continue;
      rows.push({
        vehicleNumber:    String(r["Vehicle Number"]  ?? ""),
        make:             String(r["Make"]            ?? ""),
        model:            String(r["Model"]           ?? ""),
        year:             String(r["Year"]            ?? ""),
        variant:          String(r["Variant"]         ?? ""),
        insurer:          "",
        available:        "No",
        unavailableReason:"",
        totalDisplayed:   "0",
        totalAvailable:   "0",
        status:           "ERROR",
        errorMessage:     String(r["Error"]           ?? ""),
      });
    }
  }

  return rows;
}

// ── POST — run the checker ────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    vehicles:      VehicleEntry[];
    icNumber?:     string;
    postcode?:     string;
    vehicleType?:  string;
    ownerType?:    string;
    baseUrl?:      string;
    sitePassword?: string;
    concurrency?:  number;
    checkVehicleDetails?: boolean;
  };

  const {
    vehicles = [], icNumber = "", postcode = "55000",
    vehicleType = "car", ownerType = "private",
    baseUrl = "", sitePassword = "", concurrency,
    checkVehicleDetails = true,
  } = body;

  if (!vehicles.length) {
    return NextResponse.json({ error: "No vehicle numbers provided." }, { status: 400 });
  }

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `Script directory not found: ${SCRIPT_DIR}\n\nRun "cd scripts/secarang-insurance && npm install"`,
    }, { status: 500 });
  }

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({
      error: `Playwright not installed. Run:\n\n  cd scripts/secarang-insurance && npm install`,
    }, { status: 500 });
  }

  writeInputExcel(vehicles, icNumber, postcode, vehicleType, ownerType);
  if (fs.existsSync(OUTPUT_XLSX)) fs.unlinkSync(OUTPUT_XLSX);

  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn("npx", ["playwright", "test", "--project=secarang-checker"], {
      cwd: SCRIPT_DIR,
      shell: true,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        ...(baseUrl      && { SECARANG_BASE_URL:       baseUrl }),
        ...(sitePassword && { SECARANG_SITE_PASSWORD:  sitePassword }),
        ...(postcode     && { SECARANG_POSTCODE:        postcode }),
        ...(icNumber     && { SECARANG_IC:              icNumber.replace(/[-\s]/g, '') }),
        ...(concurrency  && { SECARANG_CONCURRENCY:     String(concurrency) }),
        ...(checkVehicleDetails === false && { SECARANG_CHECK_VEHICLE_DETAILS: "0" }),
      },
    });
    currentChild = child;
    let output = "";
    const timer = setTimeout(() => { killProcessTree(child); resolve({ code: 1, output: "Timed out after 30 minutes." }); }, TIMEOUT_MS);
    child.stdout.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.stderr.on("data", (d: Buffer) => { output += d.toString(); runOutputBuffer = output; });
    child.on("close",  (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error",  (err)  => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  if (stopRequested) {
    const rows = readOutputExcel();
    return NextResponse.json({ rows, log: result.output, stopped: true });
  }

  if (result.code !== 0 && !fs.existsSync(OUTPUT_XLSX)) {
    return NextResponse.json({ error: result.output || "Playwright test failed." }, { status: 500 });
  }

  const rows = readOutputExcel();
  return NextResponse.json({ rows, log: result.output });
}

// ── DELETE — stop the run ─────────────────────────────────────
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
