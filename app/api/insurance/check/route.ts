import { NextRequest, NextResponse } from "next/server";

// ── Configuration ─────────────────────────────────────────────
// Set INSURANCE_SCRIPT_PATH in your .env.local file, e.g.:
//   INSURANCE_SCRIPT_PATH=C:/Users/you/scripts/check_insurance.js
// The script is called as:
//   node <script_path> "VHC1,VHC2" ["Zurich,Takaful"]
// It must print TSV or CSV rows to stdout (first row = headers).
const SCRIPT_PATH = process.env.INSURANCE_SCRIPT_PATH ?? "";
const TIMEOUT_MS  = 10 * 60 * 1000; // 10 minutes

// ── Header aliases ────────────────────────────────────────────
const ALIASES: Record<string, string> = {
  vehicleNumber:  "vehicle number,vehicle no,vehicle no.,plate,reg no,registration",
  make:           "make",
  model:          "model",
  mfgYear:        "mfg year,year,manufacture year,manufacturing year",
  engineCC:       "engine cc,cc,engine",
  transmission:   "transmission,trans,gearbox",
  variant:        "variant",
  insurer:        "insurer,insurance,insurance company",
  coverType:      "cover type,coverage,cover",
  allowPurchase:  "allow purchase,allow,eligible,purchasable",
  referRiskCode:  "refer risk code,refer risk,risk code,risk",
  totalPrice:     "total price,price,premium,total",
};

function matchHeader(raw: string): string | null {
  const norm = raw.trim().toLowerCase();
  for (const [field, list] of Object.entries(ALIASES)) {
    if (list.split(",").includes(norm)) return field;
  }
  return null;
}

function parseOutput(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
  const fieldMap = headers.map(matchHeader);
  return lines.slice(1).map(line => {
    const cells = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    fieldMap.forEach((field, i) => { if (field) row[field] = cells[i] ?? ""; });
    return row;
  });
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!SCRIPT_PATH) {
    return NextResponse.json({
      error: "Script path not configured. Add INSURANCE_SCRIPT_PATH=/path/to/your/script.js to your .env.local file.",
    }, { status: 500 });
  }

  const body = await req.json() as { vehicles: string[]; insurers: string[] };
  const { vehicles = [], insurers = [] } = body;

  if (!vehicles.length) {
    return NextResponse.json({ error: "No vehicle numbers provided." }, { status: 400 });
  }

  const scriptArgs = [vehicles.join(",")];
  if (insurers.length) scriptArgs.push(insurers.join(","));

  // Dynamic import defers child_process resolution to runtime, avoiding
  // Turbopack's static analysis treating script arguments as module paths.
  const { spawn } = await import("node:child_process");

  const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
    const child = spawn("node", [SCRIPT_PATH, ...scriptArgs]);
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr: "Script timed out after 10 minutes.", code: 1 });
    }, TIMEOUT_MS);

    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("close",  (code) => { clearTimeout(timer); resolve({ stdout, stderr, code: code ?? 1 }); });
    child.on("error",  (err)  => { clearTimeout(timer); resolve({ stdout: "", stderr: err.message, code: 1 }); });
  });

  if (result.code !== 0) {
    return NextResponse.json({ error: result.stderr || "Script exited with an error." }, { status: 500 });
  }

  const rows = parseOutput(result.stdout);
  return NextResponse.json({ rows });
}
