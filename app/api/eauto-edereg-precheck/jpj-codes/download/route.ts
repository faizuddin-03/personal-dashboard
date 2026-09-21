import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { spawnSync } from "node:child_process";

// Serves the JPJ Code Checker sweep's proof shots (EAINT-9306).
//
//   GET ?file=<name>.png  -> that one screenshot, for inline preview
//   GET                   -> everything as one .zip: every PNG plus a
//                            summary.csv index mapping code -> note -> file
//
// The screenshots live in the SCRIPT folder rather than public/, because they
// must survive between runs (the sweep resumes across batches) and
// publishVideos() in ../../run/route.ts wipes its own public artefact folder
// at the end of every run. Serving them through this route keeps both
// properties without a copy step.
//
// Zipping reuses the same PowerShell Compress-Archive approach as
// ../../download-videos/route.ts — no extra npm dependency, and this suite
// already assumes a local Windows machine (MyKad emulator, VPN, taskkill).

export const maxDuration = 300;

const SCRIPT_DIR = process.env.EAUTO_EDEREG_PRECHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-edereg-precheck");
const SCREENSHOT_DIR = path.join(SCRIPT_DIR, "jpj-code-screenshots");
const RESULTS_FILE = path.join(SCRIPT_DIR, "jpj-code-results.json");

interface Row {
  code?: string; note?: string; noteColor?: string; enquiryResponse?: string;
  jpjStatus?: string; vehicleRecord?: string; vehicleRegNo?: string;
  hasAttributeRows?: boolean; outcome?: string; error?: string; screenshotFile?: string;
}

function readRows(): Row[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8")) as { rows?: Row[] };
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;

function buildSummaryCsv(rows: Row[]): string {
  const header = ["Code", "JPJ Status", "Enquiry Response", "Vehicle Record", "Note", "Note colour", "Attribute rows", "Vehicle No.", "Outcome", "Screenshot"];
  const body = rows.map((r) => [
    r.code, r.jpjStatus, r.enquiryResponse, r.vehicleRecord,
    r.note, r.noteColor, r.hasAttributeRows ? "Yes" : "No",
    r.vehicleRegNo, r.outcome === "read" ? "read" : `${r.outcome ?? ""}${r.error ? `: ${r.error}` : ""}`,
    r.screenshotFile,
  ].map(csvCell).join(","));
  // BOM so Excel opens the UTF-8 correctly on a double-click.
  return "﻿" + [header.map(csvCell).join(","), ...body].join("\r\n");
}

function buildZip(sourceDir: string, zipPath: string): boolean {
  if (process.platform === "win32") {
    const src = path.join(sourceDir, "*").replace(/'/g, "''");
    const cmd = `Compress-Archive -Path '${src}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 180_000 });
    return r.status === 0 && fs.existsSync(zipPath);
  }
  const r = spawnSync("zip", ["-rj", zipPath, sourceDir], { timeout: 180_000 });
  return r.status === 0 && fs.existsSync(zipPath);
}

export async function GET(req: NextRequest) {
  const requested = new URL(req.url).searchParams.get("file");

  // ── single screenshot, for the inline preview
  if (requested) {
    // basename() strips any directory component the client sent, and the
    // dirname check rejects anything that could escape via ".." or an
    // absolute path.
    const name = path.basename(requested);
    const abs = path.join(SCREENSHOT_DIR, name);
    if (path.dirname(abs) !== SCREENSHOT_DIR || !/\.png$/i.test(name) || !fs.existsSync(abs)) {
      return NextResponse.json({ error: "Screenshot not found." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(fs.readFileSync(abs)), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  }

  // ── everything, as one zip
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    return NextResponse.json({ error: "No screenshots yet — run a sweep first." }, { status: 404 });
  }
  const shots = fs.readdirSync(SCREENSHOT_DIR).filter((f) => /\.png$/i.test(f));
  if (!shots.length) {
    return NextResponse.json({ error: "No screenshots yet — run a sweep first." }, { status: 404 });
  }

  // Stage into a temp folder so summary.csv ships inside the same zip
  // without ever being written into the sweep's own working folder.
  const stamp = `${Date.now()}`;
  const staging = path.join(os.tmpdir(), `jpj-code-proof-${stamp}`);
  const zipPath = path.join(os.tmpdir(), `jpj-code-proof-${stamp}.zip`);
  try {
    fs.mkdirSync(staging, { recursive: true });
    for (const f of shots) {
      try { fs.copyFileSync(path.join(SCREENSHOT_DIR, f), path.join(staging, f)); } catch { /* skip one bad file, keep the rest */ }
    }
    fs.writeFileSync(path.join(staging, "summary.csv"), buildSummaryCsv(readRows()), "utf8");

    if (!buildZip(staging, zipPath)) {
      return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    }
    return new NextResponse(new Uint8Array(fs.readFileSync(zipPath)), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="jpj-code-proof.zip"`,
      },
    });
  } finally {
    try { fs.rmSync(staging, { recursive: true, force: true }); } catch { /* ignore */ }
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}
