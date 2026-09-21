import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { spawnSync } from "node:child_process";
import { PUBLIC_ART, resolveArtifactPath } from "../artifactPath";

// Lets the dashboard download a CHOSEN subset of the separately-published
// recordings (app/api/eauto-edereg-precheck/run/route.ts's `publishVideos()`)
// as one file — a single video comes back as-is, several come back zipped.
// Added 2026-08-27 per Faizuddin, right after that same-file split. Updated
// (this session) to resolve each request through `resolveArtifactPath()`
// (`../artifactPath.ts`) now that every run publishes into its OWN
// `<runId>/` subfolder instead of one shared flat folder — Bulk Run needs
// EARLIER runs' videos still downloadable after LATER ones finish.
//
// Updated again (this session) per Faizuddin: a Bulk Run download should come
// back with each test case's recordings already sorted into their OWN folder
// inside the zip, instead of one flat pile of runId-prefixed filenames — so
// BulkRunPanel now sends `{ url, folder }` per video (folder = that item's TS
// label/vehicle no.) instead of a bare url. The single-run panel (page.tsx)
// still sends bare urls (only ever one TS per download there), so both shapes
// are accepted.

type RequestedFile = string | { url: string; folder?: string };

/** Keeps a folder name filesystem-safe and stable across TS labels that may
 *  contain `/`, `:`, etc. (e.g. a TS label copy/pasted from the test plan). */
function sanitizeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "misc";
}

function buildZipFromStagingDir(stagingDir: string, zipPath: string): boolean {
  if (process.platform === "win32") {
    // PowerShell's Compress-Archive — no extra npm dependency needed, and
    // this whole test suite already assumes a local Windows machine (the
    // MyKad emulator, VPN, `taskkill` in ../run/route.ts). Zipping the
    // staging directory's CONTENTS (not the directory itself) preserves the
    // per-TS subfolders each video was staged under.
    const cmd = `Compress-Archive -Path '${stagingDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { timeout: 120_000 });
    return result.status === 0 && fs.existsSync(zipPath);
  }
  // Non-Windows fallback (the `zip` CLI, commonly present on macOS/Linux) —
  // run from inside the staging dir so paths in the zip stay relative.
  const result = spawnSync("zip", ["-r", zipPath, "."], { cwd: stagingDir, timeout: 120_000 });
  return result.status === 0 && fs.existsSync(zipPath);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { files?: RequestedFile[] };
  const requested = Array.isArray(body.files) ? body.files : [];
  if (!requested.length) {
    return NextResponse.json({ error: "No videos selected." }, { status: 400 });
  }

  // Resolve each requested URL to a real path INSIDE PUBLIC_ART only —
  // resolveArtifactPath() rejects anything that could escape via `..`, an
  // absolute path, or more than one level of subdirectory.
  const resolved: { name: string; abs: string; folder?: string }[] = [];
  for (const f of requested) {
    const url = typeof f === "string" ? f : f.url;
    const folder = typeof f === "string" ? undefined : f.folder;
    const abs = resolveArtifactPath(url);
    if (!abs) continue;
    // Prefix the download filename with its run folder so downloading
    // several vehicles' same-named "main-1.webm" together in one zip
    // doesn't collide — path.basename(dirname) is the runId segment.
    // (Still applied even when a per-TS `folder` is also given, since two
    // items sharing one folder — e.g. a re-run of the same TS — could
    // otherwise collide inside it too.)
    const runId = path.basename(path.dirname(abs));
    const base = path.basename(abs);
    const name = path.dirname(abs) === PUBLIC_ART ? base : `${runId}-${base}`;
    resolved.push({ name, abs, folder: folder ? sanitizeFolderName(folder) : undefined });
  }
  if (!resolved.length) {
    return NextResponse.json({ error: "None of the selected videos could be found on disk." }, { status: 404 });
  }

  // Exactly one file, with no folder requested — hand it back directly, no
  // zip needed. (A single video WITH a folder still gets zipped, so a
  // one-video-per-TS bulk download still lands inside a named folder rather
  // than as a bare file the user has to rename themselves.)
  if (resolved.length === 1 && !resolved[0].folder) {
    const { name, abs } = resolved[0];
    const data = fs.readFileSync(abs);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  }

  const stagingDir = path.join(os.tmpdir(), `edereg-precheck-videos-staging-${Date.now()}`);
  const zipPath = path.join(os.tmpdir(), `edereg-precheck-videos-${Date.now()}.zip`);
  try {
    fs.mkdirSync(stagingDir, { recursive: true });
    for (const { name, abs, folder } of resolved) {
      const destDir = folder ? path.join(stagingDir, folder) : stagingDir;
      fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, name);
      // Hardlink instead of copy — these recordings can be sizable and the
      // staging dir is deleted right after zipping, so there's no reason to
      // duplicate the bytes on disk. Falls back to a copy if the link fails
      // (e.g. staging dir ends up on a different volume than PUBLIC_ART).
      try { fs.linkSync(abs, dest); } catch { fs.copyFileSync(abs, dest); }
    }

    if (!buildZipFromStagingDir(stagingDir, zipPath)) {
      return NextResponse.json({ error: "Failed to build the zip file." }, { status: 500 });
    }
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="edereg-precheck-videos.zip"`,
      },
    });
  } finally {
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
