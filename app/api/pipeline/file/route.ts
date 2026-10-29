// GET /api/pipeline/file?path=<repo-relative> — serves one file from
// data/pipeline/, _reference/tickets/ or public/qa-artifacts/ (checked by
// safeResolve; no directory listings). Supports Range for video seeking.
// Design: scripts/pipeline/README.md §3.7.
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { safeResolve } from "@/scripts/pipeline/store.mjs";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".log": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonl": "text/plain; charset=utf-8",
  ".html": "text/plain; charset=utf-8", // shown as text, never rendered
  ".zip": "application/zip",
};
const INLINE = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".webm", ".mp4", ".pdf", ".md", ".txt", ".log", ".json", ".jsonl", ".html"]);

export async function GET(request: Request) {
  const rel = new URL(request.url).searchParams.get("path") ?? "";
  let abs: string;
  try { abs = safeResolve(rel); } catch (e) { return Response.json({ error: (e as Error).message }, { status: 403 }); }
  let st: fs.Stats;
  try { st = fs.statSync(abs); } catch { return Response.json({ error: "File not found" }, { status: 404 }); }
  if (!st.isFile()) return Response.json({ error: "Not a file" }, { status: 404 });

  const ext = path.extname(abs).toLowerCase();
  const type = TYPES[ext] ?? "application/octet-stream";
  const name = path.basename(abs).replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Content-Disposition": `${INLINE.has(ext) ? "inline" : "attachment"}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}`,
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };

  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && st.size > 0) {
    let start = range[1] ? Number(range[1]) : NaN;
    let end = range[2] ? Number(range[2]) : st.size - 1;
    if (Number.isNaN(start)) { start = Math.max(0, st.size - end); end = st.size - 1; }
    end = Math.min(end, st.size - 1);
    if (start > end || start >= st.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${st.size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(abs, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(st.size) } });
}
