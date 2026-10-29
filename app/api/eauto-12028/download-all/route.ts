import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { spawnSync } from "child_process";

// Zips a run's evidence (public/qa-artifacts/eauto-12028/<runId>/) — all of it
// or the files ticked on the runner page. Copied from
// app/api/eauto-12153/download-all/route.ts without its "Supporting Documents"
// layout (that layout was asked for 12153 / 12257 only): a flat zip named
// after the TS (e.g. 12028_TS22.zip).

const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-12028");

const isSafeRunId = (id: string) => /^[0-9]+$/.test(id);
const isSafeFilename = (name: string) => /^[\w.-]+$/.test(name);
const isSafeLabel = (label: string) => /^[\w-]+$/.test(label);

function buildZip(sourceDir: string, files: string[] | null, zipPath: string): boolean {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "eauto-12028-zip-"));
  try {
    const names = files ?? fs.readdirSync(sourceDir).filter(f => f !== "meta.json" && fs.statSync(path.join(sourceDir, f)).isFile());
    for (const f of names) fs.copyFileSync(path.join(sourceDir, f), path.join(stage, f));
    if (process.platform === "win32") {
      const target = `'${stage.replace(/'/g, "''")}\\*'`;
      const cmd = `Compress-Archive -Path ${target} -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
      const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 120_000 });
      return result.status === 0 && fs.existsSync(zipPath);
    }
    const result = spawnSync("zip", ["-r", zipPath, "."], { cwd: stage, timeout: 120_000 });
    return result.status === 0 && fs.existsSync(zipPath);
  } finally {
    try { fs.rmSync(stage, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { runId?: string; runLabel?: string; files?: string[] };
  const runId = body.runId;
  if (!runId || !isSafeRunId(runId)) return NextResponse.json({ error: "Missing or invalid runId." }, { status: 400 });
  const zipLabel = body.runLabel && isSafeLabel(body.runLabel) ? body.runLabel : runId;

  const sourceDir = path.join(PUBLIC_ART, runId);
  if (!fs.existsSync(sourceDir)) return NextResponse.json({ error: "No evidence found for this run." }, { status: 404 });

  let files: string[] | null = null;
  if (body.files?.length) {
    files = body.files.filter(isSafeFilename).filter(f => fs.existsSync(path.join(sourceDir, f)));
    if (!files.length) return NextResponse.json({ error: "None of the selected files exist." }, { status: 400 });
  }

  const zipPath = path.join(os.tmpdir(), `eauto-12028-evidence-${runId}-${Date.now()}.zip`);
  try {
    if (!buildZip(sourceDir, files, zipPath)) return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${zipLabel}.zip"` } });
  } finally {
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}
