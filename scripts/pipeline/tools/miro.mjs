#!/usr/bin/env node
// Pipeline Miro reader (Faizuddin, 2026-10-27): "a toolbox command `miro <board
// link>` opens Miro in a separate headless browser that keeps its own login.
// You sign in to Miro there once in a visible window; after that, characters
// read boards without you."
//
//   node scripts/pipeline/tools/miro.mjs login                  (Faizuddin only; visible window)
//   node scripts/pipeline/tools/miro.mjs read <board url|id> [--frame <name>]
//
// Characters reach `read` through: node scripts/pipeline/tools/fetch.mjs miro <link>
// They never run `login`.
//
// Own browser profile: data/agents/miro-profile/ (gitignored). Never the eAuto
// automation profile (data/browser-profile) and never Faizuddin's Chrome profile.
//
// READ ONLY on Miro: opens the board, waits for the board's own page data
// (window.miro.board.get(), the same call that worked in his Chrome on
// 2026-10-26) and saves the text. No clicks, no typing, no edits. The login
// form is filled by Faizuddin himself; this script never touches it and never
// reads or prints cookies or tokens.
//
// Writes: _reference/miro/<board-id>-<yyyy-mm-dd>.md, data/agents/miro-status.json,
// and appends a new board link to _reference/miro-links.txt (never rewrites it).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, "data", "agents");
const PROFILE = path.join(AGENTS_DIR, "miro-profile");
const STATUS_FILE = path.join(AGENTS_DIR, "miro-status.json");
const LOGIN_LOCK = path.join(AGENTS_DIR, "miro-login.lock");
const OUT_DIR = path.join(ROOT, "_reference", "miro");
const LINKS_FILE = path.join(ROOT, "_reference", "miro-links.txt");

const LOGIN_WAIT_MS = 10 * 60 * 1000;
const NAV_TIMEOUT_MS = 45_000;
const SDK_WAIT_MS = 60_000;

const NOT_SIGNED_IN = "Miro is not signed in for the agents. Faizuddin: open the Agents page and click 'Sign in to Miro' (or run: node scripts/pipeline/tools/miro.mjs login)";

const out = (...l) => console.log(l.join(" "));
const fail = (msg, code = 1) => { console.log(msg); process.exit(code); };
const rel = p => path.relative(ROOT, p).replace(/\\/g, "/");
const sleep = ms => new Promise(r => setTimeout(r, ms));
/** Rejects when a page call hangs (a busy board page can stall evaluate). */
const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timed out")), ms))]);

// ── status file (no secrets in it) ───────────────────────────────────
function readStatus() {
  try { return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8")); } catch { return {}; }
}
function writeStatus(patch) {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  const next = { ...readStatus(), ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");
}

// ── browser ──────────────────────────────────────────────────────────
/** Same profile for login and read; installed Chrome first (Google sign-in works there), bundled Chromium as fallback. */
async function openProfile({ headless }) {
  fs.mkdirSync(PROFILE, { recursive: true });
  const opts = {
    headless,
    viewport: headless ? { width: 1600, height: 1000 } : null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: headless ? [] : ["--start-maximized"],
  };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: "chrome" });
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (/ProcessSingleton|SingletonLock|profile (is |appears to be )?in use/i.test(msg)) throw new Error("PROFILE_BUSY");
    try { return await chromium.launchPersistentContext(PROFILE, opts); }
    catch (e2) {
      if (/ProcessSingleton|SingletonLock|profile (is |appears to be )?in use/i.test(String(e2?.message ?? e2))) throw new Error("PROFILE_BUSY");
      throw e2;
    }
  }
}

const SIGNED_IN_URL = /^https:\/\/miro\.com\/app\/(dashboard|board|team|recent|home)?/i;
const LOGIN_URL = /miro\.com\/(login|signup|sso|auth|welcome\/sign)/i;

// ── login (headed, Faizuddin types his own credentials) ──────────────
function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function login() {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  try {
    const lock = JSON.parse(fs.readFileSync(LOGIN_LOCK, "utf8"));
    if (lock?.pid && lock.pid !== process.pid && pidAlive(lock.pid)) fail("A Miro sign-in window is already open. Finish signing in there.");
  } catch { /* no lock */ }
  fs.writeFileSync(LOGIN_LOCK, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  const unlock = () => { try { fs.rmSync(LOGIN_LOCK, { force: true }); } catch { /* ignore */ } };
  process.on("exit", unlock);

  out("Opening a Miro window. Sign in there with your own Miro account. This window closes by itself once you are signed in (up to 10 minutes).");
  let ctx;
  try { ctx = await openProfile({ headless: false }); }
  catch (e) {
    if (e.message === "PROFILE_BUSY") fail("The Miro browser is busy (an agent is reading a board). Try again in a minute.");
    throw e;
  }
  let closed = false;
  ctx.on("close", () => { closed = true; });
  const page = ctx.pages()[0] ?? await ctx.newPage();
  await page.goto("https://miro.com/app/dashboard/", { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS }).catch(() => {});

  const deadline = Date.now() + LOGIN_WAIT_MS;
  let ok = false;
  while (Date.now() < deadline && !closed) {
    const urls = ctx.pages().map(p => { try { return p.url(); } catch { return ""; } });
    if (urls.some(u => SIGNED_IN_URL.test(u) && !LOGIN_URL.test(u))) {
      // Confirm it stays on the app (not a redirect bounce back to login).
      await sleep(4000);
      const again = ctx.pages().map(p => { try { return p.url(); } catch { return ""; } });
      if (again.some(u => SIGNED_IN_URL.test(u) && !LOGIN_URL.test(u))) { ok = true; break; }
    }
    await sleep(1500);
  }
  if (closed) {
    writeStatus({ signedIn: false, lastCheckAt: new Date().toISOString(), lastError: "Sign-in window closed before sign-in finished" });
    fail("The Miro window was closed before sign-in finished. Nothing saved.");
  }
  if (!ok) {
    await ctx.close().catch(() => {});
    writeStatus({ signedIn: false, lastCheckAt: new Date().toISOString(), lastError: "Sign-in not finished within 10 minutes" });
    fail("Sign-in was not finished within 10 minutes. Run it again when ready.");
  }
  await sleep(2000); // let the browser write its session to the profile
  await ctx.close().catch(() => {});
  const now = new Date().toISOString();
  writeStatus({ signedIn: true, signedInAt: now, lastOkAt: now, lastCheckAt: now, lastError: null });
  out("Miro sign-in saved");
}

// ── board id / link ──────────────────────────────────────────────────
function parseBoard(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/miro\.com\/app\/board\/([^/?#\s]+)/i);
  const id = m ? decodeURIComponent(m[1]) : /^[A-Za-z0-9_\-=]{8,20}$/.test(s) ? s : null;
  if (!id) fail(`Not a Miro board link or id: "${s}". Use the form https://miro.com/app/board/uXjVxxxxxxx=/`, 2);
  const url = m && /^https?:\/\//i.test(s) ? s : `https://miro.com/app/board/${id}/`;
  return { id, url };
}

/** Appends the board link to _reference/miro-links.txt when the board is not there yet. Never rewrites old lines. */
function rememberLink(id, url) {
  let text = "";
  try { text = fs.readFileSync(LINKS_FILE, "utf8"); } catch { return false; }
  if (text.includes(`/board/${id}/`) || text.includes(`/board/${id}?`)) return false;
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  const line = `${date} | unknown | Board read by the pipeline Miro reader (asked for by a pipeline character) | ${url}`;
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  fs.appendFileSync(LINKS_FILE, (text.endsWith("\n") || !text ? "" : eol) + line + eol, "utf8");
  return true;
}

// ── text helpers ─────────────────────────────────────────────────────
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function htmlText(html) {
  if (html == null) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : all;
      }
      return ENT[e.toLowerCase()] ?? all;
    })
    .split(/\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean).join(" / ");
}

// ── read (headless) ──────────────────────────────────────────────────
/** Runs in the page: plain copies of every board item plus tag names. Read only. */
async function pullItems(page) {
  return page.evaluate(async () => {
    const board = window.miro.board;
    const items = await board.get();
    let tags = [];
    try { tags = await board.get({ type: "tag" }); } catch { /* none */ }
    const pick = it => ({
      id: it.id, type: it.type, parentId: it.parentId ?? null,
      x: it.x, y: it.y, width: it.width, height: it.height,
      content: it.content ?? null, title: it.title ?? null, description: it.description ?? null,
      text: typeof it.text === "string" ? it.text : null,
      assignee: it.assignee ?? null, dueDate: it.dueDate ?? null, startDate: it.startDate ?? null,
      status: typeof it.status === "string" ? it.status : null,
      tagIds: Array.isArray(it.tagIds) ? it.tagIds : [],
      fields: Array.isArray(it.fields) ? it.fields.map(f => ({ value: f?.value ?? null, tooltip: f?.tooltip ?? null })) : [],
      url: typeof it.url === "string" ? it.url : null,
      captions: Array.isArray(it.captions) ? it.captions.map(c => c?.content ?? "") : [],
    });
    let users = {};
    try {
      const online = await board.getOnlineUsers();
      for (const u of online ?? []) users[u.id] = u.name;
    } catch { /* not needed */ }
    return {
      items: items.map(pick),
      tags: Object.fromEntries((Array.isArray(tags) ? tags : [tags]).filter(Boolean).map(t => [t.id, t.title])),
      users,
      title: document.title,
    };
  });
}

/** Fallback: JSON the web app fetched while loading. Collects strings that look like item text. */
function textFromJson(json, acc, depth = 0) {
  if (depth > 12 || json == null) return;
  if (Array.isArray(json)) { for (const v of json) textFromJson(v, acc, depth + 1); return; }
  if (typeof json !== "object") return;
  for (const k of ["text", "content", "title", "description"]) {
    if (typeof json[k] === "string" && json[k].trim() && json[k].length < 20000) {
      const t = htmlText(json[k]);
      if (t && !/^https?:\/\//.test(t)) acc.push({ type: String(json.type ?? json.widgetType ?? "raw"), text: t });
    }
  }
  for (const v of Object.values(json)) if (v && typeof v === "object") textFromJson(v, acc, depth + 1);
}

const TEXT_TYPES = new Set(["sticky_note", "card", "app_card", "text", "shape", "frame", "table", "embed", "preview", "image", "document"]);

function itemText(it, tags, users) {
  const parts = [];
  if (it.type === "card" || it.type === "app_card") {
    const head = htmlText(it.title);
    const body = htmlText(it.description);
    if (head) parts.push(head);
    if (body) parts.push(body);
    const extra = [];
    if (it.status) extra.push(`status: ${it.status}`);
    if (it.assignee?.userId) extra.push(`assignee: ${users[it.assignee.userId] ?? it.assignee.userId}`);
    if (it.startDate) extra.push(`start: ${String(it.startDate).slice(0, 10)}`);
    if (it.dueDate) extra.push(`due: ${String(it.dueDate).slice(0, 10)}`);
    const tagNames = it.tagIds.map(t => tags[t] ?? t).filter(Boolean);
    if (tagNames.length) extra.push(`tags: ${tagNames.join(", ")}`);
    const fields = it.fields.map(f => [f.tooltip, f.value].filter(Boolean).join(": ")).filter(Boolean);
    if (fields.length) extra.push(`fields: ${fields.join("; ")}`);
    if (extra.length) parts.push(`(${extra.join(" · ")})`);
  } else if (it.type === "frame") {
    return "";
  } else if (it.type === "image") {
    return it.title ? `(image) ${htmlText(it.title)}` : "";
  } else if (it.type === "embed" || it.type === "preview") {
    const t = [htmlText(it.title), it.url].filter(Boolean).join(" ");
    return t;
  } else {
    const t = htmlText(it.content ?? it.text ?? it.title);
    if (t) parts.push(t);
    const tagNames = it.tagIds.map(t2 => tags[t2] ?? t2).filter(Boolean);
    if (tagNames.length) parts.push(`(tags: ${tagNames.join(", ")})`);
  }
  for (const c of it.captions) { const t = htmlText(c); if (t) parts.push(`(caption: ${t})`); }
  return parts.join(" ");
}

function arrange(items) {
  const byId = new Map(items.map(i => [i.id, i]));
  const frames = items.filter(i => i.type === "frame");
  const absPos = it => {
    let x = it.x ?? 0, y = it.y ?? 0, p = it.parentId ? byId.get(it.parentId) : null, guard = 0;
    // Child coordinates are relative to the parent's top-left corner.
    while (p && guard++ < 20) {
      x += (p.x ?? 0) - (p.width ?? 0) / 2;
      y += (p.y ?? 0) - (p.height ?? 0) / 2;
      p = p.parentId ? byId.get(p.parentId) : null;
    }
    return { x, y };
  };
  const frameOf = it => {
    let p = it.parentId ? byId.get(it.parentId) : null, guard = 0;
    while (p && guard++ < 20) {
      if (p.type === "frame") return p;
      p = p.parentId ? byId.get(p.parentId) : null;
    }
    const { x, y } = absPos(it);
    return frames.find(f => Math.abs(x - f.x) <= f.width / 2 && Math.abs(y - f.y) <= f.height / 2) ?? null;
  };
  const frameOrder = [...frames].sort((a, b) => (Math.round(a.y / 50) - Math.round(b.y / 50)) || (a.x - b.x));
  const rank = new Map(frameOrder.map((f, i) => [f.id, i]));
  const titled = new Map(frameOrder.map((f, i) => [f.id, htmlText(f.title) || `(untitled frame ${i + 1})`]));
  return items
    .filter(i => i.type !== "frame")
    .map(i => { const f = frameOf(i); const p = absPos(i); return { ...i, frameId: f?.id ?? null, frameTitle: f ? titled.get(f.id) : "(no frame)", ax: p.x, ay: p.y }; })
    .sort((a, b) => {
      const ra = a.frameId ? rank.get(a.frameId) : Infinity, rb = b.frameId ? rank.get(b.frameId) : Infinity;
      return (ra - rb) || (Math.round(a.ay / 20) - Math.round(b.ay / 20)) || (a.ax - b.ax);
    });
}

async function readBoard(rawBoard, frameFilter) {
  const { id, url } = parseBoard(rawBoard);
  const added = rememberLink(id, url);
  if (added) out(`Board link added to ${rel(LINKS_FILE)}.`);

  let ctx;
  try { ctx = await openProfile({ headless: true }); }
  catch (e) {
    if (e.message === "PROFILE_BUSY") fail("The Miro browser is busy (the sign-in window is open or another board is being read). Try again in a minute.");
    throw e;
  }
  const responses = [];
  try {
    const page = ctx.pages()[0] ?? await ctx.newPage();
    // Headless Chrome says "HeadlessChrome" in its user agent; Miro shows an
    // "unsupported browser" page for that. Present the normal Chrome name.
    try {
      const ua = (await within(page.evaluate(() => navigator.userAgent), 5000)).replace(/HeadlessChrome/g, "Chrome");
      const cdp = await ctx.newCDPSession(page);
      await within(cdp.send("Emulation.setUserAgentOverride", { userAgent: ua }), 5000);
    } catch { /* keep default */ }
    page.on("response", async res => {
      try {
        if (responses.length > 200) return;
        const u = res.url();
        if (!/miro\.com/i.test(u) || !/json/i.test(res.headers()["content-type"] ?? "")) return;
        if (!/widget|board|item|content/i.test(u)) return;
        const body = await res.text();
        if (body.length < 50 || body.length > 20_000_000) return;
        responses.push(JSON.parse(body));
      } catch { /* not JSON or gone */ }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });

    // Wait for the board's own data API, or a sign-in / no-access page.
    const deadline = Date.now() + SDK_WAIT_MS;
    let state = "waiting";
    while (Date.now() < deadline) {
      const u = page.url();
      if (LOGIN_URL.test(u)) { state = "login"; break; }
      state = await within(page.evaluate(() => {
        if (typeof window.miro?.board?.get === "function") return "ready";
        const t = (document.body?.innerText ?? "").slice(0, 4000);
        if (/request access|you need access|don't have access|no access to this board/i.test(t)) return "no-access";
        // Signed-out view of a private board (seen 2026-10-27): "This is a private board ... Sign up for free in order to access ... Already have an account? Sign in".
        if (/private board|sign up for free|already have an account?|sign (in|up) to (continue|view|miro)|log in to (continue|miro)/i.test(t) && !document.querySelector("canvas")) return "login";
        return "waiting";
      }), 8000).catch(() => "waiting");
      if (state !== "waiting") break;
      await sleep(1500);
    }

    if (state === "login") {
      writeStatus({ signedIn: false, lastCheckAt: new Date().toISOString(), lastError: "Board opened the Miro sign-in page" });
      fail(NOT_SIGNED_IN);
    }
    if (state === "waiting" && readStatus().signedIn !== true) {
      writeStatus({ signedIn: false, lastCheckAt: new Date().toISOString(), lastError: "Board data did not load and Miro was never signed in" });
      fail(NOT_SIGNED_IN);
    }
    if (state === "no-access") {
      writeStatus({ signedIn: true, lastCheckAt: new Date().toISOString(), lastError: `No access to board ${id}` });
      fail(`The agents' Miro account has no access to board ${id}. Faizuddin: request access to this board in Miro (or ask the board owner to share it).`);
    }

    let data = null;
    if (state === "ready") {
      // Give the board a moment to finish loading every item.
      await sleep(3000);
      try { data = await within(pullItems(page), 90_000); } catch (e) { out(`Board data call failed: ${String(e?.message ?? e).slice(0, 200)}`); }
    }

    let lines = [];
    let counts = {};
    let title = data?.title ?? (await page.title().catch(() => ""));
    title = String(title).replace(/\s*[,|–-]\s*(Online Whiteboard|Miro).*$/i, "").trim() || id;
    let method;
    let skipped = 0;

    if (data) {
      method = "board page data: window.miro.board.get()";
      for (const it of data.items) counts[it.type] = (counts[it.type] ?? 0) + 1;
      let arranged = arrange(data.items);
      if (frameFilter) {
        const f = frameFilter.toLowerCase();
        arranged = arranged.filter(i => String(i.frameTitle).toLowerCase().includes(f));
        if (!arranged.length) {
          const names = [...new Set(arrange(data.items).map(i => i.frameTitle))];
          fail(`No frame matches "${frameFilter}". Frames on this board: ${names.join("; ") || "(none)"}`, 2);
        }
      }
      for (const it of arranged) {
        if (it.type === "connector" || it.type === "group" || !TEXT_TYPES.has(it.type) && !it.content) { skipped++; continue; }
        const t = itemText(it, data.tags, data.users);
        if (!t) { skipped++; continue; }
        lines.push(`[${it.frameTitle}] ${it.type}: ${t}`);
      }
    } else {
      const acc = [];
      for (const j of responses) textFromJson(j, acc);
      const seen = new Set();
      for (const a of acc) {
        const key = `${a.type}|${a.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        lines.push(`[(frame unknown)] ${a.type}: ${a.text}`);
        counts[a.type] = (counts[a.type] ?? 0) + 1;
      }
      method = "fallback: JSON the Miro web app loaded (frames and order not known)";
      if (!lines.length) {
        writeStatus({ lastCheckAt: new Date().toISOString(), lastError: `Board data not available for ${id}` });
        const signedIn = readStatus().signedIn === true;
        fail(signedIn
          ? `The board opened but its data did not load within ${SDK_WAIT_MS / 1000} s, and no readable board data was found. Try again; if it repeats, Faizuddin should check the board opens in Miro.`
          : NOT_SIGNED_IN);
      }
    }

    const now = new Date();
    const date = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const safeId = id.replace(/[\\/:*?"<>|]/g, "_");
    const dest = path.join(OUT_DIR, `${safeId}-${date}${frameFilter ? `-${frameFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : ""}.md`);
    const countText = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(", ");
    const doc = [
      `<!-- Read-only capture by the pipeline Miro reader (scripts/pipeline/tools/miro.mjs).`,
      `     Board: ${url}`,
      `     Captured: ${now.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })} (${now.toISOString()})`,
      `     Method: ${method}`,
      `     Items on board: ${countText || "0"}${frameFilter ? `\n     Frame filter: "${frameFilter}"` : ""}`,
      `     Lines below: ${lines.length} (${skipped} items with no text skipped: connectors, groups, empty shapes, images without a title).`,
      `     Text inside an item: line breaks shown as " / ". Order: frame (top-to-bottom, left-to-right), then y, then x. -->`,
      `# ${title} (Miro)`,
      "",
      ...lines.map((l, i) => `${i + 1}. ${l}`),
      "",
    ].join("\n");
    fs.writeFileSync(dest, doc, "utf8");
    writeStatus({ signedIn: true, lastOkAt: now.toISOString(), lastCheckAt: now.toISOString(), lastBoard: id, lastError: null });
    out(`Board "${title}" (${id}): ${lines.length} text item(s) saved to ${rel(dest)}`);
    out(`Items on board: ${countText || "0"}.`);
    if (data) {
      const frames = [...new Set(lines.map(l => l.match(/^\[(.*?)\]/)?.[1]).filter(Boolean))];
      out(`Frames: ${frames.slice(0, 40).join("; ")}${frames.length > 40 ? ` (+${frames.length - 40} more)` : ""}`);
    }
    out("Read the file with the Read tool. This capture is read-only; nothing on the board was changed.");
  } finally {
    await ctx.close().catch(() => {});
  }
}

// ── CLI ──────────────────────────────────────────────────────────────
const HELP = `Pipeline Miro reader.
1. login                                  Faizuddin only: opens a visible Miro window; sign in there once.
2. read <board link or id> [--frame <name>] Save the board's text to _reference/miro/<board-id>-<date>.md (read only).
Characters use: node scripts/pipeline/tools/fetch.mjs miro <board link> [--frame <name>]`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch ((cmd ?? "help").toLowerCase()) {
    case "login":
      if (process.env.CLAUDE_PIPELINE_JOB) fail("Only Faizuddin signs in to Miro, from the Agents page. Characters cannot run this.", 2);
      await login(); return;
    case "read": {
      const fi = rest.indexOf("--frame");
      const frame = fi >= 0 ? rest.slice(fi + 1).join(" ").trim() : null;
      const board = (fi >= 0 ? rest.slice(0, fi) : rest).join(" ").trim();
      if (!board) fail("Give a Miro board link or id.", 2);
      if (fi >= 0 && !frame) fail("--frame needs part of a frame title.", 2);
      await readBoard(board, frame);
      return;
    }
    case "help": case "--help": case "-h":
      out(HELP); return;
    default:
      fail(`Unknown command "${cmd}".\n\n${HELP}`, 2);
  }
}

main().catch(e => {
  console.log(`Failed: ${String(e?.message ?? e).slice(0, 400)}`);
  process.exit(1);
});
