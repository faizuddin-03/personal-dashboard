import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";

// Bundles a run's evidence (screenshots + recording, already published under
// public/qa-artifacts/eauto-jomcheck/<runId>/) into one zip — either
// everything, or only the files the dashboard's per-item checkboxes
// selected. Same PowerShell Compress-Archive approach as
// app/api/eauto/12166/download-all/route.ts. Faizuddin, 2026-10-02: "every
// test evidence must have a download and download all button. user must be
// able to select which evidence they want to download."

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-jomcheck");

/** Run ids are this project's own `Date.now()` string — reject anything else
 *  so a crafted id can't escape PUBLIC_ART. */
function isSafeRunId(id: string): boolean {
  return /^[0-9]+$/.test(id);
}

/** A published evidence filename — no path separators, no traversal. */
function isSafeFilename(name: string): boolean {
  return /^[\w.-]+$/.test(name);
}

/** Same constraint as the run route's runLabel filenames — letters, digits,
 *  underscores only, since it becomes the zip's own filename. */
function isSafeLabel(label: string): boolean {
  return /^[\w-]+$/.test(label);
}

function buildZip(sourceDir: string, zipPath: string, files: string[] | null): boolean {
  if (process.platform === "win32") {
    const target = files
      ? `@(${files.map(f => `'${path.join(sourceDir, f).replace(/'/g, "''")}'`).join(",")})`
      : `'${sourceDir.replace(/'/g, "''")}\\*'`;
    const cmd = `Compress-Archive -Path ${target} -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 120_000 });
    return result.status === 0 && fs.existsSync(zipPath);
  }
  const args = files ? ["-r", zipPath, ...files] : ["-r", zipPath, "."];
  const result = spawnSync("zip", args, { cwd: sourceDir, timeout: 120_000 });
  return result.status === 0 && fs.existsSync(zipPath);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { runId?: string; runLabel?: string; files?: string[] };
  const runId = body.runId;
  if (!runId || !isSafeRunId(runId)) {
    return NextResponse.json({ error: "Missing or invalid runId." }, { status: 400 });
  }
  // Names the zip after the TS number(s) covered, not the runId — Faizuddin,
  // 2026-10-02: "same goes for the zip file for bulk download." Falls back
  // to the runId if a label wasn't supplied or looks unsafe.
  const zipLabel = body.runLabel && isSafeLabel(body.runLabel) ? body.runLabel : runId;

  const sourceDir = path.join(PUBLIC_ART, runId);
  if (!fs.existsSync(sourceDir)) {
    return NextResponse.json({ error: "No evidence found for this run — it may have been pruned already." }, { status: 404 });
  }

  let files: string[] | null = null;
  if (body.files?.length) {
    files = body.files.filter(isSafeFilename).filter(f => fs.existsSync(path.join(sourceDir, f)));
    if (!files.length) {
      return NextResponse.json({ error: "None of the selected files exist." }, { status: 400 });
    }
  }

  const zipPath = path.join(os.tmpdir(), `eauto-jomcheck-evidence-${runId}-${Date.now()}.zip`);
  try {
    if (!buildZip(sourceDir, zipPath, files)) {
      return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    }
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipLabel}.zip"`,
      },
    });
  } finally {
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}
