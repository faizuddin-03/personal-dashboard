import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";

// Bundles a run's ENTIRE published evidence (every account's recording,
// already organized into per-test subfolders under
// public/qa-artifacts/eauto-user-access-regression/<runId>/) into one zip.
// Same pattern as app/api/eauto/12166/download-all/route.ts.

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-user-access-regression");

/** Run ids are the route's own `ts` timestamp string (e.g. "2026-09-24_1130")
 *  — reject anything else so a crafted id can't escape PUBLIC_ART. */
function isSafeRunId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/** A per-account subfolder name as published (e.g. "Account kokping -
 *  Account kokping") — no separators, no traversal. */
function isSafeFolder(name: string): boolean {
  return /^[\w .()-]+$/.test(name) && !name.includes("..");
}

/** `folders` null = the whole run; otherwise only those per-account
 *  subfolders (Passed only / Failed only / Selected — Faizuddin, 2026-10-21). */
function buildZip(sourceDir: string, zipPath: string, folders: string[] | null): boolean {
  if (process.platform === "win32") {
    const target = folders
      ? `@(${folders.map(f => `'${path.join(sourceDir, f).replace(/'/g, "''")}'`).join(",")})`
      : `'${sourceDir.replace(/'/g, "''")}\\*'`;
    const cmd = `Compress-Archive -Path ${target} -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 120_000 });
    return result.status === 0 && fs.existsSync(zipPath);
  }
  const result = spawnSync("zip", ["-r", zipPath, ...(folders ?? ["."])], { cwd: sourceDir, timeout: 120_000 });
  return result.status === 0 && fs.existsSync(zipPath);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { runId?: string; folders?: string[] };
  const runId = body.runId;
  if (!runId || !isSafeRunId(runId)) {
    return NextResponse.json({ error: "Missing or invalid runId." }, { status: 400 });
  }

  const sourceDir = path.join(PUBLIC_ART, runId);
  if (!fs.existsSync(sourceDir)) {
    return NextResponse.json({ error: "No evidence found for this run — it may have been pruned already." }, { status: 404 });
  }

  let folders: string[] | null = null;
  if (body.folders?.length) {
    folders = body.folders.filter(isSafeFolder).filter(f => fs.existsSync(path.join(sourceDir, f)));
    if (!folders.length) {
      return NextResponse.json({ error: "None of the selected accounts have evidence in this run." }, { status: 400 });
    }
  }

  const zipPath = path.join(os.tmpdir(), `eauto-uar-evidence-${runId}-${Date.now()}.zip`);
  try {
    if (!buildZip(sourceDir, zipPath, folders)) {
      return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    }
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="user-access-regression-evidence-${runId}.zip"`,
      },
    });
  } finally {
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}
