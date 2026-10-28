// POST /api/pipeline/chat { key, character: "elf" | "dwarf" | "scout" | "scribe" | "sage", text } — saves
// Faizuddin's message in the character's chat and queues "<character>:chat".
// Design: scripts/pipeline/README.md §3.4.
//
// Pasted pages (2026-10-27: an HTML page pasted into a character chat was
// refused as "too long"): HTML, or any message over MAX_INLINE characters, is
// saved to a file under _reference/tickets/<KEY>/ first — AGENTS.md "SAVE
// EVERY PAGE OF HTML THE USER GIVES YOU" — and the character gets the path.
import * as fs from "node:fs";
import * as path from "node:path";
import { KEY_RE, readTicket, appendChat, readChat, queueJob, repoPath, noteForSage } from "@/scripts/pipeline/store.mjs";
import { extractQuestions } from "@/scripts/pipeline/answers.mjs";
import type { Character, JobAction } from "@/lib/pipeline/types";

const CHAT_CHARACTERS = ["scout", "scribe", "elf", "dwarf", "sage"];

const MAX_INLINE = 8000;              // longer messages are saved as a file
const MAX_TOTAL = 5 * 1024 * 1024;    // 5 MB hard limit for one paste

const HTML_START = /<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]|<(?:div|table|form|section|main|nav|ul|select|input)[\s>]/i;

function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * Night round 18: where a pasted page probably came from, so its capture header
 * is checkable (AGENTS.md "SAVE EVERY PAGE OF HTML": header gives URL and
 * environment; "the live page is the SSoT" [charmain-repo: docs/qa-principles.md:31-39]).
 * Paths only (never hosts): form actions, canonical / og:url, <base>, the first
 * same-site links. eSIM pages have no environment (Faizuddin, 2026-10-27,
 * answers.json: "eSim have no environment. it is only a simulator").
 */
function urlHints(html: string): { paths: string[]; esim: boolean } {
  const found = new Set<string>();
  const re = /<(?:form[^>]*\saction|base[^>]*\shref|link[^>]*rel=["']canonical["'][^>]*\shref|meta[^>]*property=["']og:url["'][^>]*\scontent)=["']([^"'#?]+)/gi;
  for (const m of html.matchAll(re)) found.add(m[1]);
  if (found.size < 3) for (const m of html.matchAll(/<a[^>]*\shref=["'](\/[^"'#?]+)/gi)) { found.add(m[1]); if (found.size >= 5) break; }
  // Row ids collapse to <id> so twenty delete forms read as one path.
  const paths = [...new Set([...found]
    .map(u => { try { return new URL(u, "http://x").pathname.replace(/\/\d+(?=\/|$)/g, "/<id>"); } catch { return ""; } })
    .filter(p => p && p !== "/"))]
    .slice(0, 5);
  const esim = /\/esim\//i.test(paths.join(" ")) || /<title>[^<]*esim/i.test(html);
  return { paths, esim };
}

/** Saves a pasted page / long text and returns the message the character gets instead. */
function savePaste(key: string, character: string, text: string): { message: string; file: string } {
  const at = text.search(HTML_START);
  const isHtml = at >= 0;
  const note = isHtml ? text.slice(0, at).trim() : "";
  const body = isHtml ? text.slice(at) : text;
  const rel = `_reference/tickets/${key}/${key}-pasted-${stamp()}.${isHtml ? "html" : "txt"}`;
  const hints = isHtml ? urlHints(body) : null;
  const header = isHtml
    ? `<!-- Pasted by Faizuddin into the dashboard chat with ${character}, ${new Date().toISOString()}.
     URL: not given${hints?.paths.length ? ` (paths found in the page: ${hints.paths.join(", ")})` : ""}. Environment: ${hints?.esim ? "none: this looks like the eSIM simulator (knowledge/esim.md: eSIM has no environment)" : "not given"}. Nothing trimmed (saved exactly as pasted).
     Rename or annotate this header once the page and environment are known (AGENTS.md, _reference/html/README.md). -->\n`
    : `Pasted by Faizuddin into the dashboard chat with ${character}, ${new Date().toISOString()}. Saved exactly as pasted.\n\n`;
  fs.mkdirSync(path.dirname(repoPath(rel)), { recursive: true });
  fs.writeFileSync(repoPath(rel), header + body);
  const kb = Math.max(1, Math.round(Buffer.byteLength(body) / 1024));
  const what = isHtml ? "an HTML page" : "a long text";
  const message = `${note ? `${note}\n\n` : ""}[Faizuddin pasted ${what} (${kb} KB). It is saved at ${rel} — read it from there.]`;
  return { message, file: rel };
}

export async function POST(request: Request) {
  let body: { key?: unknown; character?: unknown; text?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { key, character, text }" }, { status: 400 }); }
  const key = String(body?.key ?? "").trim().toUpperCase();
  const character = body?.character;
  let text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  if (typeof character !== "string" || !CHAT_CHARACTERS.includes(character)) return Response.json({ error: "character must be scout, scribe, elf, dwarf or sage" }, { status: 400 });
  if (!text) return Response.json({ error: "Type a message first" }, { status: 400 });
  if (text.length > MAX_TOTAL) return Response.json({ error: "That paste is over 5 MB. Save it as a file in the ticket folder and tell the character the path." }, { status: 400 });
  if (!readTicket(key)) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });

  let file: string | undefined;
  if (text.length > MAX_INLINE || HTML_START.test(text)) {
    try { ({ message: text, file } = savePaste(key, character, text)); }
    catch (e) { return Response.json({ error: `Could not save the pasted page: ${(e as Error).message}` }, { status: 500 }); }
  }

  // The questions this message may answer: the character's last reply, if it asked him something (answer registry).
  const lastReply = [...readChat(key, character as Character)].reverse().find(e => e.from === character);
  const answering = lastReply ? extractQuestions(lastReply.text) : [];
  const entry = appendChat(key, character as Character, { from: "faizuddin", text });
  // Sage (2026-10-27): his chat messages are durable facts to learn from. A message to the Sage is handled by sage:chat itself.
  if (character !== "sage") {
    noteForSage(key, { type: "chat", character: character as Character, by: "faizuddin", text, ...(answering.length ? { answering } : {}), ...(file ? { file } : {}) });
  }
  try {
    const job = queueJob({ key, action: `${character}:chat` as JobAction, input: { text, ...(file ? { file } : {}) } });
    const { input, ...rest } = job; void input;
    return Response.json({ entry, job: rest, ...(file ? { savedTo: file } : {}) });
  } catch (e) {
    return Response.json({ entry, error: `Message saved, but the job did not start: ${(e as Error).message}` }, { status: 500 });
  }
}
