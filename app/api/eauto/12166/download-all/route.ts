import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";

// Bundles a run's ENTIRE published evidence (every recording, PDF-page
// render, screenshot, trace — already organized into per-test subfolders
// under public/qa-artifacts/eauto-12166/<runId>/) into one zip, so the
// dashboard can offer a single "Download all" instead of making the
// reviewer click every file individually. Same PowerShell Compress-Archive
// approach as app/api/eauto-edereg-precheck/download-videos/route.ts — no
// extra npm dependency, and this suite already assumes a local Windows box.

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12166");

/** Run ids are the route's own `ts` timestamp string (e.g. "2026-09-24_1130")
 *  — reject anything else so a crafted id can't escape PUBLIC_ART. */
function isSafeRunId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/** A per-test subfolder name as published (e.g. "12166_67_E2E_TS01") —
 *  no separators, no traversal. */
function isSafeFolder(name: string): boolean {
  return /^[\w .()-]+$/.test(name) && !name.includes("..");
}

/** `folders` null = the whole run; otherwise only those per-test subfolders
 *  (Passed only / Failed only / Selected — Faizuddin, 2026-10-21). */
function buildZip(sourceDir: string, zipPath: string, folders: string[] | null): boolean {
  if (process.platform === "win32") {
    const target = folders
      ? `@(${folders.map(f => `'${path.join(sourceDir, f).replace(/'/g, "''")}'`).join(",")})`
      : `'${sourceDir.replace(/'/g, "''")}\\*'`;
    const cmd = `Compress-Archive -Path ${target} -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 120_000 });
    return result.status === 0 && fs.existsSync(zipPath);
  }
  // Non-Windows fallback (the `zip` CLI) — run from inside the source dir so
  // paths in the zip stay relative, preserving the per-test subfolders.
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
      return NextResponse.json({ error: "None of the selected tests have evidence in this run." }, { status: 400 });
    }
  }

  const zipPath = path.join(os.tmpdir(), `eauto-12166-evidence-${runId}-${Date.now()}.zip`);
  try {
    if (!buildZip(sourceDir, zipPath, folders)) {
      return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    }
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="12166-evidence-${runId}.zip"`,
      },
    });
  } finally {
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}
