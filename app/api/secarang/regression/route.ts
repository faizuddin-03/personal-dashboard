import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

const SCRIPT_DIR   = process.env.SECARANG_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "secarang-insurance");
const RESULT_FILE  = path.join(SCRIPT_DIR, "regression-result.json");
const TIMEOUT_MS   = 10 * 60 * 1000; // 10 min

let currentChild: ChildProcess | null = null;
let stopRequested = false;

function killTree(child: ChildProcess) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGTERM"); }
    catch { try { child.kill("SIGTERM"); } catch { /* ignore */ } }
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

  // Remove stale result so the UI can tell the test is running
  if (fs.existsSync(RESULT_FILE)) fs.unlinkSync(RESULT_FILE);

  stopRequested = false;

  const result = await new Promise<{ code: number; output: string }>((resolve) => {
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
          ...(body.targetInsurer  && { REGRESSION_INSURER:      body.targetInsurer }),
        },
      },
    );

    currentChild = child;
    let output = "";
    const timer = setTimeout(() => {
      killTree(child);
      resolve({ code: 1, output: "Timed out after 10 minutes." });
    }, TIMEOUT_MS);

    child.stdout?.on("data", (d: Buffer) => { output += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { output += d.toString(); });
    child.on("close",  (code) => { clearTimeout(timer); currentChild = null; resolve({ code: code ?? 1, output }); });
    child.on("error",  (err)  => { clearTimeout(timer); currentChild = null; resolve({ code: 1, output: err.message }); });
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
    return NextResponse.json({ stopped: true });
  }
  return NextResponse.json({ stopped: false, message: "No run in progress." });
}
