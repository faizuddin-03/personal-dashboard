/**
 * ONE video per TS, payment window included (Azfar 29.10.2026, EAINT-12406: he does not accept a second, separate
 * video of the Fiuu payment window).
 *
 * Playwright records one video per tab, so a window the SITE opens (Secarang > Fiuu popup, kept open by
 * `ts.payWindow`) gets its own file. This module notes when each such window opened, relative to the start of the
 * main tab's video, and when the TS ends lays the window's video over the main video, picture-in-picture at the
 * bottom right with an orange frame, from the second it opened until it closed. The result replaces the TS video;
 * the window's own file goes to the run's scratch folder, never to the evidence folder.
 *
 * Timing: the main video starts when its tab is created; `WindowVideos` is created right after (the `ts` fixture's
 * constructor / a test's first line), so the offset is accurate to a fraction of a second. A window's video starts
 * when the window is created, which is when it is noted here.
 *
 * Needs ffmpeg (PATH, FFMPEG_PATH, or a WinGet Gyan.FFmpeg install under %LOCALAPPDATA%). Without ffmpeg, or when the
 * merge fails, the main video is left as it was and `merge()` returns the problem, so the caller can say so.
 * When no window opened nothing is done at all (other tickets' runs are unchanged).
 */

import type { Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

/** ffmpeg: FFMPEG_PATH, then PATH, then a WinGet Gyan.FFmpeg install. null when none is found. */
export function findFfmpeg(): string | null {
  const env = process.env.FFMPEG_PATH;
  if (env && fs.existsSync(env)) return env;
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (dir && fs.existsSync(path.join(dir, exe))) return path.join(dir, exe);
  }
  const pkgs = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages") : "";
  if (pkgs && fs.existsSync(pkgs)) {
    for (const p of fs.readdirSync(pkgs).filter((d) => /^Gyan\.FFmpeg/i.test(d))) {
      const root = path.join(pkgs, p);
      for (const build of fs.readdirSync(root)) {
        const f = path.join(root, build, "bin", exe);
        if (fs.existsSync(f)) return f;
      }
    }
  }
  return null;
}

interface Win {
  page: Page;
  /** Seconds after the main video started. */
  at: number;
  /** The window's page size (its video is that page, padded to the context's video size). */
  size: { width: number; height: number } | null;
  closedAt?: number;
}

export class WindowVideos {
  private readonly t0 = Date.now();
  private readonly list: Win[] = [];

  /** Note a window the site opened (call it from the context's "page" event, at once). */
  add(page: Page): void {
    const w: Win = { page, at: (Date.now() - this.t0) / 1000, size: page.viewportSize() };
    page.once("close", () => { w.closedAt = (Date.now() - this.t0) / 1000; });
    this.list.push(w);
  }

  get count(): number {
    return this.list.length;
  }

  /** "window 1 open 01:32.4–01:41.6 (bank-simulator.fiuu.com)" lines, for the TS notes. */
  describe(): string[] {
    const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
    return this.list.map((w, i) => `payment window ${i + 1} on the TS video ${mmss(w.at)}–${w.closedAt !== undefined ? mmss(w.closedAt) : "end"}`);
  }

  /**
   * After the main tab and the windows are CLOSED (videos complete): lay every window's video over `mainFile`
   * (overwritten with the merged video). Each window's own file is moved to `scratchDir` as window<N>.webm.
   * Returns what was merged and any problem; the main file is untouched on a problem.
   */
  async merge(mainFile: string, scratchDir: string): Promise<{ merged: number; problems: string[]; windowFiles: string[] }> {
    if (!this.list.length) return { merged: 0, problems: [], windowFiles: [] };
    const problems: string[] = [];
    const windowFiles: string[] = [];
    fs.mkdirSync(scratchDir, { recursive: true });
    const wins: (Win & { file: string })[] = [];
    for (const [i, w] of this.list.entries()) {
      await w.page.close().catch(() => undefined);
      const src = w.page.video() ? await w.page.video()!.path().catch(() => "") : "";
      if (!src || !fs.existsSync(src)) {
        problems.push(`payment window ${i + 1}: no video file`);
        continue;
      }
      const file = path.join(scratchDir, `window${i + 1}.webm`);
      fs.copyFileSync(src, file);
      windowFiles.push(file);
      wins.push({ ...w, file });
    }
    if (!wins.length) return { merged: 0, problems, windowFiles };
    if (!fs.existsSync(mainFile)) return { merged: 0, problems: [...problems, "no main video to merge into"], windowFiles };
    const ffmpeg = findFfmpeg();
    if (!ffmpeg) return { merged: 0, problems: [...problems, "ffmpeg not found (PATH / FFMPEG_PATH / WinGet Gyan.FFmpeg): payment window NOT in the TS video"], windowFiles };

    // [k:v] trimmed to the window's page, fitted into 1280x720, orange frame, shifted to the second it opened.
    const parts: string[] = [];
    let last = "[0:v]";
    wins.forEach((w, k) => {
      const at = Math.max(0, w.at).toFixed(3);
      // A window opened without a size reports 0x0 (verify run cd3, 29.10.2026): then it is not cropped.
      const crop = w.size && w.size.width > 0 && w.size.height > 0 ? `crop=min(iw\\,${w.size.width}):min(ih\\,${w.size.height}):0:0,` : "";
      parts.push(
        `[${k + 1}:v]setpts=PTS-STARTPTS+${at}/TB,${crop}scale=1272:712:force_original_aspect_ratio=decrease,` +
          `pad=iw+8:ih+8:4:4:color=0xFF8C00[w${k}]`,
      );
      const out = k === wins.length - 1 ? "[v]" : `[m${k}]`;
      parts.push(`${last}[w${k}]overlay=x=W-w-20:y=H-h-20:eof_action=pass:enable='gte(t,${at})'${out}`);
      last = out;
    });
    const tmp = `${mainFile}.merging.webm`;
    const args = ["-v", "error", "-y", "-i", mainFile, ...wins.flatMap((w) => ["-i", w.file]), "-filter_complex", parts.join(";"),
      "-map", "[v]", "-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8", "-b:v", "2500k", "-crf", "20", tmp];
    const r = spawnSync(ffmpeg, args, { encoding: "utf8", timeout: 15 * 60_000 });
    if (r.status !== 0 || !fs.existsSync(tmp) || fs.statSync(tmp).size < 50_000) {
      fs.rmSync(tmp, { force: true });
      return { merged: 0, problems: [...problems, `ffmpeg merge failed (exit ${r.status}): ${(r.stderr || String(r.error ?? "")).trim().slice(0, 300)}`], windowFiles };
    }
    fs.renameSync(tmp, mainFile);
    return { merged: wins.length, problems, windowFiles };
  }
}
