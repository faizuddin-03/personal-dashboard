import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawnSync } from "node:child_process";
import { resolveArtifactPath } from "../artifactPath";

// Cuts one or more segments out of a recorded run video and stitches the
// KEPT segments back into one file — added 2026-08-28 per Faizuddin, so a
// long recording's dead pauses (e.g. the ~6.5min RE reset-timer wait, or a
// dashboard pause/continue hold) can be trimmed out before sharing it,
// without leaving the editing to a separate desktop tool. Single-video only
// (no cross-video/side-by-side combine here — that's a separate feature).
//
// Uses ffmpeg's trim+concat filter_complex (frame-accurate, not a keyframe
// -only `-c copy` cut) in ONE invocation — same `spawnSync("ffmpeg", ...)`
// convention already used by app/api/eauto-quotation-reminder/run/route.ts's
// own video-merge fallback. Video-only (no `-map` for audio): Playwright's
// Chromium recordVideo captures video only, no audio track, same assumption
// the other route's own reencode fallback already makes.
//
// Source resolution updated (this session): run/route.ts's publishVideos()
// now keeps one subfolder PER RUN (Bulk Run needs earlier runs' videos to
// survive later ones finishing) instead of one shared flat folder — so the
// source video is resolved via `resolveArtifactPath()` (`../artifactPath.ts`)
// rather than a bare basename-under-PUBLIC_ART check.
const TRIMMED_DIR = path.join(process.cwd(), "public", "qa-artifacts", "eauto-edereg-precheck-trimmed");

interface Segment { start: number; end: number }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { url?: string; segments?: Segment[] };

  const inputAbs = resolveArtifactPath(body.url ?? "");
  if (!inputAbs) {
    return NextResponse.json({ error: "Source video not found. It may have aged out — reload and try again." }, { status: 404 });
  }
  const name = path.basename(inputAbs);

  const segments = Array.isArray(body.segments) ? body.segments : [];
  const clean = segments
    .filter((s): s is Segment => typeof s?.start === "number" && typeof s?.end === "number" && s.end > s.start)
    .sort((a, b) => a.start - b.start);
  if (!clean.length) {
    return NextResponse.json({ error: "No valid segments to keep — each segment needs an end time after its start time." }, { status: 400 });
  }

  fs.mkdirSync(TRIMMED_DIR, { recursive: true });
  const outName = `${name.replace(/\.webm$/i, "")}-trimmed-${Date.now()}.webm`;
  const outAbs = path.join(TRIMMED_DIR, outName);

  // One filter_complex: trim+reset-timestamps each kept segment, then
  // concat them in order. Frame-accurate (operates on decoded frames), not
  // limited to keyframe boundaries the way a plain `-c copy -ss/-to` cut is.
  const trims = clean.map((s, i) => `[0:v]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS[v${i}]`).join(";");
  const concatInputs = clean.map((_, i) => `[v${i}]`).join("");
  const filter = `${trims};${concatInputs}concat=n=${clean.length}:v=1:a=0[outv]`;

  const result = spawnSync("ffmpeg", ["-y", "-i", inputAbs, "-filter_complex", filter, "-map", "[outv]", outAbs], {
    timeout: 5 * 60_000,
  });
  if (result.status !== 0 || !fs.existsSync(outAbs)) {
    const stderr = result.stderr?.toString().slice(-2000) ?? "";
    return NextResponse.json({ error: `ffmpeg failed to produce a trimmed video.${stderr ? ` Last output: ${stderr}` : ""}` }, { status: 500 });
  }

  return NextResponse.json({ url: `/qa-artifacts/eauto-edereg-precheck-trimmed/${outName}` });
}
