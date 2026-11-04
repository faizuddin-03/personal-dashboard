#!/usr/bin/env node
// Finishes one Claude-driven TS recorded with scripts/claude-run/recorder-azfar.js (Azfar's evidence style).
//
//   node scripts/claude-run/finish-ts.mjs <TS folder> <finish.json>
//
// <finish.json> is the object R.finish() returned, saved by Claude. This script then:
//  1. writes checks.txt (when | point | expected | page shows | matches | screenshot) and proofs.json;
//  2. lays every payment-window video (_raw/window<N>.webm) into video_<TS>.webm at the bottom right,
//     with an orange frame, from the second the window opened. It is a port of Azfar's
//     scripts/eauto-12406/automation/src/fixtures/window-video.ts merge();
//  3. judges the TS the way Azfar's gate does:
//     - DEFECT: a point does not match
//     - EVIDENCE: a point has no proof or no screenshot, or there is no video, or the window was not merged
//     - OBSERVED: the TS has no points
//     - VALID: none of the above
//     The verdict is written to gate.json.
// Raw window videos stay in _raw/ (git-ignored together with every *.webm).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [dir, jsonFile] = process.argv.slice(2);
if (!dir || !jsonFile) { console.error('usage: finish-ts.mjs <TS folder> <finish.json>'); process.exit(2); }
const r = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const points = r.points || [];

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  for (const d of (process.env.PATH ?? '').split(path.delimiter)) if (d && fs.existsSync(path.join(d, exe))) return path.join(d, exe);
  const pkgs = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages') : '';
  if (pkgs && fs.existsSync(pkgs)) for (const p of fs.readdirSync(pkgs).filter((d) => /^Gyan\.FFmpeg/i.test(d))) {
    const root = path.join(pkgs, p);
    for (const b of fs.readdirSync(root)) { const f = path.join(root, b, 'bin', exe); if (fs.existsSync(f)) return f; }
  }
  return null;
}

const notes = [];
const problems = [];
const main = path.join(dir, `video_${r.ts}.webm`);
const wins = (r.windows || []).filter((w) => w.file && !String(w.file).startsWith('video-fail') && fs.existsSync(path.join(dir, w.file)));
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
for (const w of r.windows || []) notes.push(`payment window ${w.n} on the TS video ${mmss(w.at)}–${w.closedAt != null ? mmss(w.closedAt) : 'end'} (${w.url || '-'})`);
if (wins.length) {
  const ff = findFfmpeg();
  if (!ff) problems.push('ffmpeg not found: payment window NOT in the TS video');
  else if (!fs.existsSync(main)) problems.push('no main video to merge into');
  else {
    const parts = []; let last = '[0:v]';
    wins.forEach((w, k) => {
      const at = Math.max(0, w.at).toFixed(3);
      parts.push(`[${k + 1}:v]setpts=PTS-STARTPTS+${at}/TB,scale=1272:712:force_original_aspect_ratio=decrease,pad=iw+8:ih+8:4:4:color=0xFF8C00[w${k}]`);
      const out = k === wins.length - 1 ? '[v]' : `[m${k}]`;
      parts.push(`${last}[w${k}]overlay=x=W-w-20:y=H-h-20:eof_action=pass:enable='gte(t,${at})'${out}`);
      last = out;
    });
    const tmp = `${main}.merging.webm`;
    const args = ['-v', 'error', '-y', '-i', main, ...wins.flatMap((w) => ['-i', path.join(dir, w.file)]), '-filter_complex', parts.join(';'),
      '-map', '[v]', '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-b:v', '2500k', '-crf', '20', tmp];
    const s = spawnSync(ff, args, { encoding: 'utf8', timeout: 15 * 60_000 });
    if (s.status !== 0 || !fs.existsSync(tmp) || fs.statSync(tmp).size < 50_000) {
      fs.rmSync(tmp, { force: true });
      problems.push(`ffmpeg merge failed (exit ${s.status}): ${(s.stderr || '').trim().slice(0, 300)}`);
    } else { fs.renameSync(tmp, main); notes.push(`payment window video laid into video_${r.ts}.webm (${wins.length} window(s), picture-in-picture, bottom right)`); }
  }
}

const lines = [...(r.log || []), ...notes.map((n) => `${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false })} | note: ${n}`), ...problems.map((p) => `note: video: ${p}`)];
fs.writeFileSync(path.join(dir, 'checks.txt'), lines.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'proofs.json'), JSON.stringify({ ts: r.ts, instance: r.inst, driver: 'Claude (Playwright MCP)', proofs: r.proofs, notes: [...(r.notes || []), ...notes], dialogs: r.dialogs, windows: r.windows }, null, 2));

const proofs = r.proofs || [];
const reasons = [];
let verdict;
const mism = proofs.filter((p) => !p.match);
if (mism.length) { verdict = 'DEFECT'; for (const m of mism) reasons.push(`${m.point}: expected "${String(m.expected).replace(/\s+/g, ' ').slice(0, 160)}", page shows "${m.shows}"${m.shot ? ` (${m.shot})` : ''}`); }
else if (points.length === 0 && proofs.length === 0) { verdict = 'EVIDENCE'; reasons.push('OBSERVED only: no expected points were proved'); }
else {
  const missing = points.filter((p) => !proofs.some((x) => x.point === p.id && x.match && (x.shot || x.shows)));
  if (missing.length) reasons.push(`no proof for ${missing.map((p) => p.id).join(', ')}`);
  if (!fs.existsSync(main)) reasons.push('no video'); else if (fs.statSync(main).size < 50_000) reasons.push(`video is only ${fs.statSync(main).size} bytes`);
  reasons.push(...problems);
  verdict = reasons.length ? 'EVIDENCE' : 'VALID';
}
const gate = { ts: r.ts, verdict, reasons, instance: r.inst, at: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false }), driver: 'Claude (Playwright MCP)' };
fs.writeFileSync(path.join(dir, 'gate.json'), JSON.stringify(gate, null, 2));
console.log(JSON.stringify(gate, null, 2));
