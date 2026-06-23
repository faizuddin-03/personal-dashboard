import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

const SCRIPT_DIR   = process.env.SECARANG_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "secarang-insurance");
const RESULT_FILE  = path.join(SCRIPT_DIR, "regression-result.json");
const LOG_FILE     = path.join(SCRIPT_DIR, "regression-log.txt");
const TIMEOUT_MS   = 10 * 60 * 1000; // 10 min

let currentChild: ChildProcess | null = null;
let stopRequested = false;
let forceResolveRun: ((r: { code: number; output: string }) => void) | null = null;
let runOutputBuffer = "";

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); }
    catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

// ── GET — return latest saved result ────────────────────────────────────────
export async function GET() {
  if (!fs.existsSync(RESULT_FILE)) {
    return NextResponse.json({ error: "No regression result found. Run the test first." }, { status: 404 });
  }
  try {
    const data = JSON.parse(fs.readFileSync(RESULT_FILE, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to read result file." }, { status: 500 });
  }
}

// ── POST — run the regression test ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    baseUrl?:      string;
    sitePassword?: string;
    vehicleNumber?: string;
    icNumber?:     string;
    postcode?:     string;
    targetInsurer?: string;
    coverageType?:  string;
    vehicleType?:   string;
    ownerType?:     string;
    addons?:       string[];
    ownerName?:    string;
    ownerEmail?:   string;
    ownerPhone?:   string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    discountCode?: string;
    targetBank?:    string;
    bankUsername?:  string;
    bankPassword?:  string;
    paymentStatus?: string;
  };

  if (!fs.existsSync(SCRIPT_DIR)) {
    return NextResponse.json({
      error: `Script directory not found: ${SCRIPT_DIR}`,
    }, { status: 500 });
  }

  if (!fs.existsSync(path.join(SCRIPT_DIR, "node_modules"))) {
    return NextResponse.json({
      error: `Playwright not installed. Run:\n\n  cd scripts/secarang-insurance && npm install`,
    }, { status: 500 });
  }

  // Remove stale result and log so the UI can tell the test is running
  if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);
  try { fs.writeFileSync(LOG_FILE, ""); } catch { /* ignore */ }

  stopRequested = false;
  runOutputBuffer = "";

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
    forceResolveRun = resolve;
    const child = spawn(
      "npx", ["playwright", "test", "--project=secarang-regression"],
      {
        cwd: SCRIPT_DIR,
        shell: true,
        detached: process.platform !== "win32",
        env: {
          ...process.env,
          ...(body.baseUrl        && { SECARANG_BASE_URL:       body.baseUrl }),
          ...(body.sitePassword   && { SECARANG_SITE_PASSWORD:  body.sitePassword }),
          ...(body.vehicleNumber  && { REGRESSION_VN:           body.vehicleNumber }),
          ...(body.icNumber       && { REGRESSION_IC:           body.icNumber }),
          ...(body.postcode       && { REGRESSION_POSTCODE:     body.postcode }),
          ...(body.targetInsurer  && { REGRESSION_INSURER:        body.targetInsurer }),
          ...(body.coverageType   && { REGRESSION_COVERAGE_TYPE: body.coverageType }),
          ...(body.vehicleType    && { REGRESSION_VEHICLE_TYPE:  body.vehicleType }),
          ...(body.ownerType      && { REGRESSION_OWNER_TYPE:   body.ownerType }),
          ...(body.addons?.length && { REGRESSION_ADDONS:       body.addons.join(',') }),
          ...(body.ownerName      && { REGRESSION_NAME:         body.ownerName }),
          ...(body.ownerEmail     && { REGRESSION_EMAIL:        body.ownerEmail }),
          ...(body.ownerPhone     && { REGRESSION_PHONE:        body.ownerPhone }),
          ...(body.addressLine1   && { REGRESSION_ADDR1:        body.addressLine1 }),
          ...(body.addressLine2   && { REGRESSION_ADDR2:        body.addressLine2 }),
          ...(body.addressLine3   && { REGRESSION_ADDR3:        body.addressLine3 }),
          ...(body.discountCode   && { REGRESSION_DISCOUNT:     body.discountCode }),
          ...(body.targetBank     && { REGRESSION_BANK:         body.targetBank }),
          ...(body.bankUsername    && { REGRESSION_BANK_USER:    body.bankUsername }),
          ...(body.bankPassword    && { REGRESSION_BANK_PASS:    body.bankPassword }),
          ...(body.paymentStatus   && { REGRESSION_PAYMENT_STATUS: body.paymentStatus }),
        },
      },
    );

    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killTree(child);
      resolve({ code: 1, output: "Timed out after 10 minutes." });
    }, TIMEOUT_MS);

    child.stdout?.on("data", (d: Buffer) => {
      const chunk = d.toString();
      output += chunk;
      runOutputBuffer = output;
      try { fs.appendFileSync(LOG_FILE, chunk); } catch { /* ignore */ }
    });
    child.stderr?.on("data", (d: Buffer) => {
      const chunk = d.toString();
      output += chunk;
      runOutputBuffer = output;
      try { fs.appendFileSync(LOG_FILE, chunk); } catch { /* ignore */ }
    });
    child.on("close",  (code) => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: code ?? 1, output }); });
    child.on("error",  (err)  => { clearTimeout(timer); currentChild = null; forceResolveRun = null; resolve({ code: 1, output: err.message }); });
  });

  if (stopRequested) {
    return NextResponse.json({ stopped: true, log: result.output });
  }

  // Try to read the result file the script wrote
  if (fs.existsSync(RESULT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESULT_FILE, "utf-8"));
      return NextResponse.json({ ...data, log: result.output });
    } catch {
      /* fall through */
    }
  }

  // Script failed before writing result
  return NextResponse.json({
    overallStatus: "FAIL",
    steps: [],
    errorMessage: result.output || "Playwright test failed without output.",
    log: result.output,
  }, { status: result.code !== 0 ? 500 : 200 });
}

// ── DELETE — stop the run ────────────────────────────────────────────────────
export async function DELETE() {
  if (currentChild) {
    stopRequested = true;
    killTree(currentChild);

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
