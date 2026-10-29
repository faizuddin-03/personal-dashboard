import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// One recording per TS that follows the window the run is working in
// (Faizuddin, 2026-10-22: "since the QR thing opens a new tab and a new browser
// … it should record ALL OF IT. if possible, put in one recording only").
//
// Playwright records every page separately: the eAuto tab, the Fiuu payment
// window, the DuitNow scanner tab, BackOffice. The test writes a focus
// timeline (scripts/eauto-12153|12257/utils/focusTimeline.ts): when each page
// opened and every moment the run switched to another page. Each stretch is
// cut from that page's own recording and the stretches are joined in order.
// Needs ffmpeg on PATH (installed on this PC via winget, Gyan.FFmpeg).

interface Timeline {
  endedAt: number;
  videos: { path: string; openedAt: number; label: string }[];
  segments: { t: number; v: number }[];
}

/** Shorter switches are folded into the stretch before them (no flicker). */
const MIN_SEGMENT_S = 1;

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ code: number; out: string; err: string }> {
  return new Promise(resolve => {
    let out = "", err = "";
    const child = spawn(cmd, args, { windowsHide: true });
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", d => { out += d.toString(); });
    child.stderr.on("data", d => { err = (err + d.toString()).slice(-4000); });
    child.on("error", e => { clearTimeout(timer); resolve({ code: 1, out, err: e.message }); });
    child.on("close", code => { clearTimeout(timer); resolve({ code: code ?? 1, out, err }); });
  });
}

/** Playwright webm files carry no duration in the header: read the last frame's time. */
async function durationS(file: string): Promise<number> {
  const r = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time", "-of", "csv=p=0", file], 120_000);
  const times = r.out.split(/\r?\n/).filter(Boolean).map(Number).filter(Number.isFinite);
  return times.length ? Math.max(...times) : 0;
}

/**
 * Builds `outPath` (.mp4) from the timeline at `timelinePath`.
 * Returns null on success, or why it could not be built (the caller then keeps
 * the separate recordings).
 */
export async function stitchFocusVideo(timelinePath: string, outPath: string): Promise<string | null> {
  let tl: Timeline;
  try { tl = JSON.parse(fs.readFileSync(timelinePath, "utf-8")) as Timeline; } catch { return "no focus timeline"; }
  const videos = tl.videos.filter(v => fs.existsSync(v.path));
  if (!videos.length || !tl.segments.length) return "no recordings in the timeline";
  const dur = new Map<number, number>();
  for (const [i, v] of tl.videos.entries()) if (fs.existsSync(v.path)) dur.set(i, await durationS(v.path));

  // Stretches: [from, to) on one page; short ones merge into the previous one.
  const raw = tl.segments.map((s, i) => ({ v: s.v, from: s.t, to: tl.segments[i + 1]?.t ?? tl.endedAt }));
  const parts: typeof raw = [];
  for (const s of raw) {
    if (!dur.has(s.v)) continue;
    const prev = parts[parts.length - 1];
    if (prev && (prev.v === s.v || (s.to - s.from) / 1000 < MIN_SEGMENT_S)) { prev.to = s.to; continue; }
    parts.push({ ...s });
  }
  if (!parts.length) return "nothing to cut";

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "focus-"));
  try {
    const list: string[] = [];
    for (const [i, p] of parts.entries()) {
      const v = tl.videos[p.v];
      const total = dur.get(p.v) ?? 0;
      const start = Math.max(0, (p.from - v.openedAt) / 1000);
      const length = Math.min((p.to - p.from) / 1000, total - start);
      if (length < 0.2) continue;
      const seg = path.join(tmp, `s${String(i).padStart(4, "0")}.mp4`);
      const r = await run("ffmpeg", [
        "-y", "-ss", start.toFixed(3), "-t", length.toFixed(3), "-i", v.path,
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25",
        "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-pix_fmt", "yuv420p", seg,
      ], 30 * 60_000);
      if (r.code !== 0) return `ffmpeg could not cut ${path.basename(v.path)}: ${r.err.split("\n").filter(Boolean).slice(-2).join(" ")}`;
      list.push(`file '${seg.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`);
    }
    if (!list.length) return "every stretch was empty";
    const listFile = path.join(tmp, "list.txt");
    fs.writeFileSync(listFile, list.join("\n"));
    const r = await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", outPath], 30 * 60_000);
    if (r.code !== 0) return `ffmpeg could not join the stretches: ${r.err.split("\n").filter(Boolean).slice(-2).join(" ")}`;
    return null;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
