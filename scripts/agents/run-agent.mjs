#!/usr/bin/env node
// Scheduled study agents (Faizuddin, 2026-10-27).
//
//   node scripts/agents/run-agent.mjs <jira-study|sharepoint-study> [--force] [--dry]
//   node scripts/agents/run-agent.mjs jira-study --key EAINT-12345 [--dry]
//
// Started by Windows Task Scheduler (see install-schedule.ps1): Jira Scout
// every hour, SharePoint Scribe every 2 hours, Mon–Fri 08:00–19:00, only
// while the laptop is on and Faizuddin is logged in. --force skips the
// working-hours check (the dashboard's "Run now" button uses it); --dry
// finds the work and prints it without studying anything. --key studies just
// that ticket now (implies --force, skips the changed-since search; the lock
// still applies) — the /pipeline "Add ticket" route uses it.
//
// QA pipeline handoff (Faizuddin, 2026-10-27): after a study, a ticket whose
// Jira QA field (cf 10041) holds Faizuddin's accountId is added to the
// pipeline (data/pipeline/tickets/<KEY>.json) and the Scribe is queued for its
// related history. See scripts/pipeline/README.md §1.1.
//
// Each run: find new/changed items → fetch the raw material into the repo
// → hand each item to Claude Code (`claude -p`, file tools only, no network,
// no shell) to write the study → record what happened. Status for the
// /agents page goes to data/agents/status/<id>.json (shape: lib/agentStatus.ts).
//
// Agents only READ Jira and SharePoint. They never write to either.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "data", "agents");
const STUDYING = path.join(ROOT, "_reference", "tickets", "Studying");
const TS_MIRROR = path.join(ROOT, "_reference", "sharepoint", "qa-team-ts");

const AGENTS = {
  "jira-study": {
    name: "Jira Scout",
    schedule: "Every hour, Mon–Fri 8am–7pm",
    everyHours: 1,
    maxPerRun: 4,
  },
  "sharepoint-study": {
    name: "SharePoint Scribe",
    schedule: "Every 2 hours, Mon–Fri 8am–7pm",
    everyHours: 2,
    maxPerRun: 4,
  },
};
const DAY_START = 8;   // first run 08:00
const DAY_END = 19;    // no new run starts at or after 19:00
const ITEM_TIMEOUT_MS = 20 * 60 * 1000;
const LOCK_STALE_MS = 3 * 60 * 60 * 1000;

const id = process.argv[2];
const keyAt = process.argv.indexOf("--key");
// Accept "eaint12345" as typed on the dashboard; use it as "EAINT-12345".
const ONLY_KEY = keyAt > 0 ? (process.argv[keyAt + 1] ?? "").trim().toUpperCase().replace(/^([A-Z][A-Z0-9]*?)-?(\d+)$/, "$1-$2") : null;
const FORCE = process.argv.includes("--force") || !!ONLY_KEY;
const DRY = process.argv.includes("--dry");
if (!AGENTS[id] || (keyAt > 0 && (id !== "jira-study" || !/^[A-Z][A-Z0-9]*-\d+$/.test(ONLY_KEY)))) {
  console.error(`Usage: node scripts/agents/run-agent.mjs <${Object.keys(AGENTS).join("|")}> [--force] [--dry] [--key <KEY> (jira-study only)]`);
  process.exit(2);
}
const AGENT = AGENTS[id];

// ── small helpers ───────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const readJson = (p, fallback) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; } };
async function writeJson(p, v) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(v, null, 2));
  await fsp.rename(tmp, p);
}
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
const sleep = ms => new Promise(r => setTimeout(r, ms));

function inWorkingHours(d = new Date()) {
  const day = d.getDay();
  return day >= 1 && day <= 5 && d.getHours() >= DAY_START && d.getHours() < DAY_END;
}
/** Next scheduled start: on the hour, every N hours from 08:00, Mon–Fri. */
function nextRun(from = new Date()) {
  const d = new Date(from);
  d.setMinutes(0, 0, 0);
  for (let i = 0; i < 24 * 8; i++) {
    d.setHours(d.getHours() + 1);
    const h = d.getHours(), day = d.getDay();
    if (day >= 1 && day <= 5 && h >= DAY_START && h < DAY_END && (h - DAY_START) % AGENT.everyHours === 0) return d.toISOString();
  }
  return null;
}

// ── status (read by the /agents page) ───────────────────────────────
// A second Scout (slot 2, --key runs only) writes its own status file so the
// two Scouts do not overwrite each other (2026-10-27).
let STATUS_PATH = path.join(DATA, "status", `${id}.json`);
let status = {
  id, name: AGENT.name, schedule: AGENT.schedule,
  state: "waking", activity: "Waking up", item: null, progress: null, queue: 0,
  startedAt: nowIso(), finishedAt: null, nextRunAt: nextRun(),
  lastResult: readJson(STATUS_PATH, {}).lastResult ?? null,
  recent: readJson(STATUS_PATH, {}).recent ?? [],
  updatedAt: nowIso(),
};
let statusTimer = null;
function setStatus(patch, event) {
  Object.assign(status, patch, { updatedAt: nowIso() });
  if (event) {
    status.recent = [{ at: nowIso(), text: event }, ...status.recent].slice(0, 40);
    console.log(`[${new Date().toLocaleTimeString("en-MY")}] ${event}`);
  }
  // Coalesce bursts of tool events into one write.
  if (!statusTimer) statusTimer = setTimeout(() => { statusTimer = null; void writeJson(STATUS_PATH, status); }, 250);
}
async function flushStatus() {
  if (statusTimer) { clearTimeout(statusTimer); statusTimer = null; }
  await writeJson(STATUS_PATH, status);
}

// ── locks: up to two Scouts ─────────────────────────────────────────
// Slot 1 is the hourly run's lock. A single-ticket study (--key, from "Add
// ticket" on /pipeline) may also take slot 2, so it no longer waits behind
// the hourly run (Faizuddin, 2026-10-27: "so that it can run 2 at a time").
const LOCKS = [path.join(DATA, "locks", `${id}.lock`), path.join(DATA, "locks", `${id}-2.lock`)];
let LOCK = null;
function tryLock(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const held = readJson(file, null);
  if (held && Date.now() - Date.parse(held.at) < LOCK_STALE_MS) {
    try { process.kill(held.pid, 0); return false; } catch { /* holder is gone */ }
  }
  fs.writeFileSync(file, JSON.stringify({ pid: process.pid, at: nowIso() }));
  return true;
}
function takeLock() {
  const slots = ONLY_KEY ? LOCKS : LOCKS.slice(0, 1);
  for (const [i, file] of slots.entries()) {
    if (!tryLock(file)) continue;
    LOCK = file;
    if (i > 0) STATUS_PATH = path.join(DATA, "status", `${id}-${i + 1}.json`);
    return true;
  }
  return false;
}
const dropLock = () => { if (LOCK) { try { fs.unlinkSync(LOCK); } catch {} } };

// ── Claude Code worker ──────────────────────────────────────────────
function claudeBin() {
  const npm = path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "npm", "claude.cmd");
  return fs.existsSync(npm) ? `"${npm}"` : "claude";
}
const TOOL_WORDS = {
  Read: ["reading", "Reading"], Glob: ["reading", "Looking through files"], Grep: ["reading", "Searching notes"],
  Write: ["writing", "Writing"], Edit: ["writing", "Updating"],
};
/**
 * Runs one `claude -p` study. File tools only: no Bash, no web, no MCP
 * servers, so the worker cannot reach Jira, SharePoint or anything else.
 */
function runClaude(prompt, label) {
  return new Promise((resolve) => {
    const args = [
      "-p", "--output-format", "stream-json", "--verbose",
      "--permission-mode", "acceptEdits",
      "--allowedTools", "Read", "Write", "Edit", "Glob", "Grep",
      "--disallowedTools", "Bash", "WebFetch", "WebSearch", "Agent", "Workflow",
      "--strict-mcp-config",
    ];
    const child = spawn(claudeBin(), args, { cwd: ROOT, shell: true, windowsHide: true, env: { ...process.env, CLAUDE_AGENT_RUN: id } });
    let buf = "", result = null, stderr = "";
    const timer = setTimeout(() => { child.kill(); }, ITEM_TIMEOUT_MS);
    child.stdout.on("data", chunk => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg; try { msg = JSON.parse(line); } catch { continue; }
        if (msg.type === "assistant") {
          for (const c of msg.message?.content ?? []) {
            if (c.type !== "tool_use") continue;
            const [state, verb] = TOOL_WORDS[c.name] ?? ["reading", c.name];
            // File name for Read/Write/Edit; search patterns are noise in the viewer, so Grep/Glob show only the verb.
            const target = c.input?.file_path ? path.basename(c.input.file_path) : "";
            setStatus({ state, activity: `${verb} ${target}`.trim() }, `${label}: ${verb.toLowerCase()} ${target}`.trim());
          }
        } else if (msg.type === "result") {
          result = msg;
        }
      }
    });
    child.stderr.on("data", d => { stderr += d; });
    child.on("close", code => {
      clearTimeout(timer);
      const ok = code === 0 && result && !result.is_error;
      resolve({ ok, error: ok ? undefined : (result?.result || stderr.trim().slice(-400) || `claude exited with ${code}`) });
    });
    child.stdin.end(prompt);
  });
}

const STUDY_RULES = `Rules for this study (you are running unattended on a schedule; nobody will answer questions):
1. Write ONLY the file(s) named below. Do not edit knowledge/, lib/, app/, scripts/ or any other file. If you learn a durable fact worth adding to knowledge/, list it under a final "## Knowledge candidates" section of the study instead, with its source.
2. Quote sources verbatim in quotation marks with the exact location (field, comment author + date, SRD section, sheet + row). Never paraphrase a quote. Tag anything you infer as [unconfirmed].
3. Numbered lists only, no bullet points. Short points, bold key words, plain simple English. Colleagues by role where a name is not needed.
4. Check knowledge/README.md and the relevant knowledge/flow-*.md files for context on the module, and note where this ticket changes or contradicts them.
5. If something cannot be read (e.g. a .docx), say so in "Sources read" instead of guessing.`;

// ── Jira Scout ──────────────────────────────────────────────────────
function adfText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  if (node.type === "mention") return node.attrs?.text ?? "@someone";
  if (node.type === "emoji") return node.attrs?.text ?? "";
  if (node.type === "inlineCard" || node.type === "blockCard") return node.attrs?.url ?? "";
  const kids = (node.content ?? []).map(adfText);
  switch (node.type) {
    case "paragraph": case "heading": return kids.join("") + "\n";
    case "listItem": return "- " + kids.join("").trim() + "\n";
    case "tableRow": return "| " + (node.content ?? []).map(c => adfText(c).trim().replace(/\n+/g, " ")).join(" | ") + " |\n";
    case "tableCell": case "tableHeader": return kids.join(" ");
    case "codeBlock": return "```\n" + kids.join("") + "\n```\n";
    default: return kids.join("");
  }
}

async function jira(creds, pathname, init = {}) {
  const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}${pathname}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Jira ${res.status} on ${pathname.split("?")[0]}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

function jqlTime(d) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function findJiraWork(creds, state) {
  // Look back to the last successful check (5-minute overlap), or 1 hour on the first run.
  const since = new Date(state.lastCheck ? Date.parse(state.lastCheck) - 5 * 60_000 : Date.now() - 60 * 60_000);
  const base = `project = EAINT AND issuetype not in subTaskIssueTypes() AND (created >= "${jqlTime(since)}" OR updated >= "${jqlTime(since)}")`;
  const fields = "summary,status,issuetype,updated,created";
  const found = [];
  let token;
  for (let page = 0; page < 10; page++) {
    const body = { jql: `${base} ORDER BY updated ASC`, fields: fields.split(","), maxResults: 100, ...(token ? { nextPageToken: token } : {}) };
    const data = await (await jira(creds, "/rest/api/3/search/jql", { method: "POST", body: JSON.stringify(body) })).json();
    found.push(...(data.issues ?? []));
    token = data.nextPageToken;
    if (!token || data.isLast) break;
  }
  // QA-Issue tickets are bugs raised by QA, not CRs to study.
  return found
    .filter(i => !/qa.?issue/i.test(i.fields.issuetype?.name ?? ""))
    .map(i => ({ key: i.key, title: i.fields.summary, updated: i.fields.updated, status: i.fields.status?.name, type: i.fields.issuetype?.name }));
}

// .html = mock-ups attached by the BA (2026-10-27); .docx/.html get a
// <name>-text.md copy (scripts/pipeline/lib/attach-text.mjs) so the study can read them.
const ATTACH_OK = /\.(pdf|png|jpe?g|xlsx|docx|html?)$/i;
const ATTACH_MAX = 25 * 1024 * 1024;

/** Text copy of a .docx / .html attachment; never fails the capture. */
async function attachmentText(dest, key) {
  if (!/\.(docx|html?)$/i.test(dest)) return;
  try {
    const m = await import("../pipeline/lib/attach-text.mjs");
    await m.ensureTextCopy(dest);
  } catch (e) {
    setStatus({}, `${key}: could not make a text copy of ${path.basename(dest)} (${String(e.message ?? e).slice(0, 80)})`);
  }
}

async function fetchJiraMaterial(creds, key, dir) {
  const qaField = "customfield_10041";
  const issue = await (await jira(creds, `/rest/api/3/issue/${key}?fields=*all&expand=renderedFields`)).json();
  const f = issue.fields;
  const comments = (await (await jira(creds, `/rest/api/3/issue/${key}/comment?maxResults=100&orderBy=created`)).json()).comments ?? [];
  const users = v => (Array.isArray(v) ? v : v ? [v] : []).map(u => u.displayName).join(", ") || "—";
  const lines = [
    `# ${key} — Jira capture (${new Date().toLocaleString("en-MY")})`,
    "",
    "Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.",
    "",
    `1. **Summary:** ${f.summary}`,
    `2. **Type:** ${f.issuetype?.name} · **Status:** ${f.status?.name} · **Priority:** ${f.priority?.name ?? "—"}`,
    `3. **Assignee:** ${users(f.assignee)} · **Reporter:** ${users(f.reporter)} · **QA (cf 10041):** ${users(f[qaField])}`,
    `4. **Fix versions:** ${(f.fixVersions ?? []).map(v => `${v.name}${v.releaseDate ? ` (${v.releaseDate})` : ""}`).join(", ") || "—"}`,
    `5. **Labels:** ${(f.labels ?? []).join(", ") || "—"}`,
    `6. **Created:** ${f.created} · **Updated:** ${f.updated}`,
    `7. **Exp. Deploy Date (cf 10087):** ${f.customfield_10087 ?? "—"} · **ETA for Testing (cf 10057):** ${f.customfield_10057 ?? "—"} · **[QA] Est Man-day (cf 10081):** ${f.customfield_10081 ?? "—"}`,
    `8. **Links:** ${(f.issuelinks ?? []).map(l => `${l.type?.name}: ${(l.outwardIssue ?? l.inwardIssue)?.key} ${(l.outwardIssue ?? l.inwardIssue)?.fields?.summary ?? ""}`).join("; ") || "—"}`,
    `9. **Sub-tasks:** ${(f.subtasks ?? []).map(s => `${s.key} ${s.fields?.summary}`).join("; ") || "—"}`,
    `10. **Parent:** ${f.parent ? `${f.parent.key} ${f.parent.fields?.summary ?? ""}` : "—"}`,
    "",
    "## Description",
    "",
    adfText(f.description).trim() || "(empty)",
    "",
    `## Comments (${comments.length})`,
    "",
    ...comments.flatMap(c => [`### ${c.author?.displayName ?? "?"} — ${c.created}`, "", adfText(c.body).trim(), ""]),
    "## Attachments",
    "",
    ...((f.attachment ?? []).map(a => `1. ${a.filename} — ${a.size} bytes, ${a.created}, by ${a.author?.displayName ?? "?"}`)),
  ];
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, `${key}-jira.md`), lines.join("\n"));

  const saved = [];
  for (const a of f.attachment ?? []) {
    if (!ATTACH_OK.test(a.filename) || a.size > ATTACH_MAX) continue;
    const dest = path.join(dir, a.filename.replace(/[\\/:*?"<>|]/g, "_"));
    if (fs.existsSync(dest) && fs.statSync(dest).size === a.size) { saved.push(path.basename(dest)); await attachmentText(dest, key); continue; }
    try {
      const res = await jira(creds, new URL(a.content).pathname.replace(/^\/+/, "/"), { headers: { Accept: "*/*" } });
      await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      saved.push(path.basename(dest));
      if (/\.xlsx$/i.test(dest)) await xlsxToMarkdown(dest, dest.replace(/\.xlsx$/i, "-text.md"));
      await attachmentText(dest, key);
    } catch (e) {
      setStatus({}, `${key}: could not download ${a.filename} (${String(e.message).slice(0, 80)})`);
    }
  }
  // QA field account ids decide whether the ticket is Faizuddin's (pipeline handoff).
  return { title: f.summary, status: f.status?.name, saved, qaAccountIds: accountIds(f[qaField]) };
}

const accountIds = v => (Array.isArray(v) ? v : v ? [v] : []).map(u => u?.accountId).filter(Boolean);

function jiraPrompt(key, title, dir, kind) {
  const d = rel(dir);
  const study = `${d}/${key}-study.md`;
  const today = new Date().toLocaleDateString("en-CA");
  const task = kind === "new"
    ? `Write a new study of Jira ticket ${key} ("${title}") to ${study}.`
    : `${study} already exists. The ticket changed in Jira since it was studied. Re-read the material, then update ${study}: refresh the Header facts, add a "## Changes since last study (${today})" section right after the Header saying exactly what changed (status, fix version, description, new comments, new attachments), and fix any part of the study the change makes wrong. Keep everything else.`;
  return `You are the Jira Scout, a scheduled study agent for Faizuddin (QA engineer, eAuto). The goal: when Faizuddin picks this ticket up, everything needed is already understood and in one place.

${task}

Material (already downloaded, read it all):
1. ${d}/${key}-jira.md — Jira fields, description, comments, attachment list (captured just now).
2. Every other file in ${d}/ — SRD PDFs, images, HTML mock-ups, and -text.md text copies of Excel, Word (.docx) and HTML files. Read a .docx or .html through its <name>-text.md copy; list a file as not read only if it has no text copy.
3. Anything else already in the repo about ${key}: search _reference/tickets/${key}/, _reference/teams/ (file names and contents containing ${key}), knowledge/ (grep ${key}) and lib/ticketStudies.ts.

Format: follow the structure of _reference/tickets/Studying/EAINT-12121/EAINT-12121-study.md (Header with numbered facts, Sources read, What changes, requirements, open questions / risks for testing, suggested test focus). Title line: "# ${key} — study (${today})".

${STUDY_RULES}`;
}

// ── QA pipeline handoff ─────────────────────────────────────────────
/**
 * Loads the pipeline store lazily so the Scout keeps working when
 * scripts/pipeline/store.mjs is missing or broken.
 */
async function loadPipelineStore() {
  try { return await import("../pipeline/store.mjs"); }
  catch (e) { setStatus({}, `Pipeline not available (${String(e.message ?? e).slice(0, 80)})`); return null; }
}

/**
 * Adds a freshly studied ticket to the pipeline when it is Faizuddin's, or
 * refreshes one he already added by hand, and queues the Scribe's related
 * history. Never throws: a pipeline problem must not fail the study.
 */
async function pipelineHandoff(creds, key, mat, studyPath) {
  try {
    const mine = !!creds.accountId && mat.qaAccountIds.includes(creds.accountId);
    if (!mine && !fs.existsSync(path.join(ROOT, "data", "pipeline", "tickets", `${key}.json`))) return;
    const store = await loadPipelineStore();
    if (!store) return;
    const existing = await store.readTicket(key);
    if (!mine && !existing) return;
    const studyRel = rel(studyPath);
    if (!existing) await store.ensureTicket({ key, title: mat.title, addedBy: "scout", jiraStatus: mat.status });
    await store.updateTicket(key, t => {
      t.files = { ...(t.files ?? {}), study: studyRel };
      if (mat.status) t.jiraStatus = mat.status;
      if (!existing) t.stage = "studied";
      return t;
    });
    await store.addEvent(key, existing ? "Scout updated the study" : "Scout studied the ticket and added it to the pipeline (QA field is Faizuddin)");
    setStatus({}, existing ? `${key}: pipeline study updated` : `${key}: added to the pipeline (yours)`);
    // Sage (2026-10-27): a new or updated study (its "## Knowledge candidates") is something to learn from.
    if (typeof store.noteForSage === "function") store.noteForSage(key, { type: "study", by: "scout", character: "scout", file: studyRel, text: existing ? "Scout updated the study" : "Scout studied the ticket" });

    // Related history: skip when the Scribe is already on it or its file is newer than this study.
    const relatedPath = path.join(STUDYING, key, `${key}-related-history.md`);
    const mtime = p => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };
    const relatedFresh = mtime(relatedPath) > mtime(studyPath);
    const jobs = typeof store.listJobs === "function" ? await store.listJobs({ key, active: true }) : [];
    const scribeBusy = (jobs ?? []).some(j => j.character === "scribe" || String(j.action).startsWith("scribe:"));
    if (relatedFresh || scribeBusy) {
      setStatus({}, `${key}: related history ${scribeBusy ? "already being written" : "already up to date"}`);
      return;
    }
    await store.queueJob({ key, action: "scribe:related" });
    setStatus({}, `${key}: asked the Scribe for related history`);
  } catch (e) {
    setStatus({}, `${key}: could not add to the pipeline (${String(e.message ?? e).slice(0, 120)})`);
  }
}

async function runJira() {
  const creds = readJson(path.join(DATA, "jira.json"), null);
  if (!creds?.apiToken) {
    setStatus({ state: "needs-setup", activity: "Needs the Jira login: open the Agents page and click Connect agents to Jira" }, "No Jira login saved yet");
    return { ok: false, found: 0, studied: [], queue: 0, error: "Jira login not connected" };
  }
  const STATE = path.join(DATA, "state", `${id}.json`);
  const state = readJson(STATE, { lastCheck: null, tickets: {}, pending: [] });
  const checkStarted = nowIso();

  if (ONLY_KEY) return runJiraKey(creds, state, STATE);

  setStatus({ state: "searching", activity: "Searching Jira for new or changed EAINT tickets" }, "Searching Jira");
  const changed = await findJiraWork(creds, state);
  for (const t of changed) {
    if (state.tickets[t.key]?.updated === t.updated) continue;
    if (!state.pending.some(p => p.key === t.key)) state.pending.push(t);
    else state.pending = state.pending.map(p => p.key === t.key ? t : p);
  }
  state.lastCheck = checkStarted;
  await writeJson(STATE, state);
  setStatus({ queue: state.pending.length }, `Found ${changed.length} new or changed ticket(s); ${state.pending.length} waiting to study`);
  if (DRY) { console.log(state.pending); return { ok: true, found: changed.length, studied: [], queue: state.pending.length }; }

  return studyBatch(creds, state, STATE, state.pending.slice(0, AGENT.maxPerRun), changed.length);
}

/** --key: study one ticket now, whatever the changed-since window says. */
async function runJiraKey(creds, state, STATE) {
  setStatus({ state: "searching", activity: `Looking up ${ONLY_KEY} in Jira` }, `${ONLY_KEY}: study asked for (single ticket)`);
  const i = await (await jira(creds, `/rest/api/3/issue/${ONLY_KEY}?fields=summary,status,issuetype,updated,customfield_10041`)).json();
  const t = { key: i.key, title: i.fields.summary, updated: i.fields.updated, status: i.fields.status?.name, type: i.fields.issuetype?.name };
  if (DRY) {
    const mine = !!creds.accountId && accountIds(i.fields.customfield_10041).includes(creds.accountId);
    console.log({ ...t, mine, studyExists: fs.existsSync(path.join(STUDYING, t.key, `${t.key}-study.md`)) });
    return { ok: true, found: 1, studied: [], queue: state.pending.length };
  }
  return studyBatch(creds, state, STATE, [t], 1);
}

/** Studies each item, records it in the Scout state and hands it to the pipeline. */
async function studyBatch(creds, state, STATE, batch, found) {
  const studied = [];
  let lastError;
  for (const [i, t] of batch.entries()) {
    const dir = path.join(STUDYING, t.key);
    const kind = fs.existsSync(path.join(dir, `${t.key}-study.md`)) ? "update" : "new";
    setStatus({ state: "reading", item: { key: t.key, title: t.title }, progress: { done: i, total: batch.length }, activity: `Collecting ${t.key} from Jira` }, `${t.key}: collecting Jira material`);
    await pipelineScoutState(t.key, "working", kind === "new" ? "Studying the ticket" : "Updating the study");
    try {
      const mat = await fetchJiraMaterial(creds, t.key, dir);
      const r = await runClaude(jiraPrompt(t.key, mat.title, dir, kind), t.key);
      if (!r.ok) throw new Error(r.error);
      await pipelineScoutState(t.key, "idle");
      studied.push({ key: t.key, title: mat.title, path: rel(path.join(dir, `${t.key}-study.md`)), kind });
      state.tickets[t.key] = { updated: t.updated, studiedAt: nowIso(), status: mat.status, title: mat.title };
      state.pending = state.pending.filter(p => p.key !== t.key);
      // Two Scouts may run at once: merge with what the other wrote, never overwrite it.
      const disk = readJson(STATE, { tickets: {}, pending: [] });
      state.tickets = { ...(disk.tickets ?? {}), ...state.tickets };
      const pend = new Map([...(disk.pending ?? []), ...state.pending].map(p => [p.key, p]));
      for (const k of Object.keys(state.tickets)) if (state.tickets[k]?.updated === pend.get(k)?.updated) pend.delete(k);
      pend.delete(t.key);
      state.pending = [...pend.values()];
      await writeJson(STATE, state);
      await appendIndex(path.join(STUDYING, "AUTO-INDEX.md"), "# Studying — auto index (Jira Scout)\n\nAppended by the Jira Scout scheduled agent. Newest last.\n\n| Studied | Ticket | Title | Jira status | Kind | Study |\n| --- | --- | --- | --- | --- | --- |\n",
        `| ${new Date().toLocaleString("en-MY")} | ${t.key} | ${mat.title.replace(/\|/g, "/")} | ${mat.status} | ${kind} | ${rel(path.join(dir, `${t.key}-study.md`))} |`);
      setStatus({ progress: { done: i + 1, total: batch.length }, queue: state.pending.length }, `${t.key}: study ${kind === "new" ? "written" : "updated"}`);
      await pipelineHandoff(creds, t.key, mat, path.join(dir, `${t.key}-study.md`));
    } catch (e) {
      lastError = `${t.key}: ${String(e.message ?? e).slice(0, 300)}`;
      setStatus({}, `Failed on ${lastError}`);
      await pipelineScoutState(t.key, "error", `Study failed: ${String(e.message ?? e).slice(0, 160)}`);
    }
  }
  return { ok: !lastError, found, studied, queue: state.pending.length, error: lastError };
}

/**
 * Mirrors the Scout's work onto a pipeline ticket (if the ticket is in the
 * pipeline) so its room and card show Scout working (Faizuddin, 2026-10-27:
 * "when i add a ticket to the pipeline ... the scout will start working
 * immediately"). Never throws.
 */
async function pipelineScoutState(key, state, note) {
  try {
    if (!fs.existsSync(path.join(ROOT, "data", "pipeline", "tickets", `${key}.json`))) return;
    const store = await loadPipelineStore();
    if (!store) return;
    await store.updateTicket(key, t => {
      t.characters = t.characters ?? {};
      t.characters.scout = { ...(t.characters.scout ?? {}), state, ...(note ? { note } : { note: undefined }) };
      return t;
    });
  } catch { /* the study matters more than the board */ }
}

// ── SharePoint Scribe ───────────────────────────────────────────────
/** Finds the OneDrive-synced QA Team "CR Test Scenarios" folder. */
function findSharePointDir() {
  const home = os.homedir();
  // Known location first (Faizuddin, 2026-10-27): "Add shortcut to My files"
  // puts it under OneDrive's Shortcuts folder. OneDrive shortcuts are reparse
  // points, so the generic walk below does not always see them as folders.
  const known = path.join(home, "OneDrive - MODE FAIR SDN BHD", "Shortcuts", "QA Team - eAuto - CR Test Scenarios");
  try { if (fs.statSync(known).isDirectory()) return known; } catch { /* not there */ }
  const roots = fs.readdirSync(home, { withFileTypes: true })
    .filter(d => d.isDirectory() && /MODE FAIR/i.test(d.name))
    .map(d => path.join(home, d.name));
  const want = /CR Test Scenario/i;
  const walk = (dir, depth) => {
    if (depth > 4) return null;
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    for (const e of entries) {
      if (!e.isDirectory() && !e.isSymbolicLink()) continue;
      const p = path.join(dir, e.name);
      if (want.test(e.name) && /eAuto/i.test(p)) return p;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const hit = walk(path.join(dir, e.name), depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  for (const r of roots) { const hit = walk(r, 0); if (hit) return hit; }
  return null;
}

function listWorkbooks(dir) {
  const out = [];
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.xlsx$/i.test(e.name) && !e.name.startsWith("~$")) {
        const st = fs.statSync(p);
        out.push({ path: p, rel: path.relative(dir, p).split(path.sep).join("/"), mtime: st.mtimeMs, size: st.size });
      }
    }
  };
  walk(dir);
  return out;
}

async function xlsxToMarkdown(src, dest) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const out = [`# ${path.basename(src)} — text copy (${new Date().toLocaleString("en-MY")})`, "", "Cell text only, row by row; formatting and images are not kept.", ""];
  wb.eachSheet(ws => {
    out.push(`## Sheet: ${ws.name}`, "");
    let n = 0;
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      if (n++ > 4000) return;
      const cells = (row.values ?? []).slice(1).map(v => {
        if (v == null) return "";
        if (typeof v === "object") return v.richText ? v.richText.map(t => t.text).join("") : v.text ?? v.result ?? (v instanceof Date ? v.toISOString().slice(0, 10) : JSON.stringify(v));
        return String(v);
      // v.result (formula) can be a number and v.text (hyperlink) can be rich text: always a string here.
      }).map(s => (typeof s === "string" ? s : s?.richText ? s.richText.map(t => t.text).join("") : String(s ?? ""))).map(s => s.replace(/\r?\n/g, " ⏎ ").replace(/\|/g, "/").trim());
      if (cells.some(Boolean)) out.push(`R${r} | ${cells.join(" | ")}`);
    });
    out.push("");
  });
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, out.join("\n"));
}

function tsPrompt(file, textPath, studyPath, key, kind) {
  const today = new Date().toLocaleDateString("en-CA");
  const task = kind === "new"
    ? `Write a study of this QA Team test script to ${rel(studyPath)}.`
    : `${rel(studyPath)} already exists; the workbook changed on SharePoint since. Re-read it and update the study: add a "## Changes since last study (${today})" section after the Header (new/removed/changed scenarios, result changes), and fix anything now wrong. Keep the rest.`;
  return `You are the SharePoint Scribe, a scheduled study agent for Faizuddin (QA engineer, eAuto). Other QA engineers keep their test scripts (TS) in the QA Team SharePoint library. The goal: Faizuddin always knows what every other ticket covered and what it taught about the system.

${task}

Workbook: "${file.rel}" (SharePoint library "eAuto - CR Test Scenarios", modified ${new Date(file.mtime).toLocaleString("en-MY")}).
Text copy to read: ${rel(textPath)}${key ? `\nTicket: ${key}. Also check _reference/tickets/${key}/, _reference/tickets/Studying/${key}/, knowledge/ (grep ${key}) and lib/ticketStudies.ts for what is already known.` : "\nNo ticket key in the file name: work out what it covers from the content."}

Study layout (title line "# ${key ?? path.basename(file.rel, ".xlsx")} — QA Team test script study (${today})"):
1. Header: ticket, module/portal, workbook name, sheets, number of scenarios, result counts if the sheet records Pass/Fail, tester and dates if written in the sheet.
2. What the ticket changed, as the TS shows it.
3. Scenarios, grouped: one line each — id, what it checks, expected result (verbatim where short).
4. Business rules and system behaviour the TS reveals (verbatim quotes with sheet + row).
5. Test data, environments, accounts or setup used (no passwords — write "credentials present" if the sheet holds any).
6. Gaps or risks a regression should still cover.
7. "## Knowledge candidates".

${STUDY_RULES}`;
}

async function runSharePoint() {
  const dir = findSharePointDir();
  await writeJson(path.join(DATA, "setup.json"), { ...readJson(path.join(DATA, "setup.json"), {}), sharepointDir: dir, checkedAt: nowIso() });
  if (!dir) {
    setStatus({ state: "needs-setup", activity: "Needs the QA Team test script folder synced to this PC (see the Agents page)" }, "SharePoint folder not synced yet");
    return { ok: false, found: 0, studied: [], queue: 0, error: "SharePoint folder not synced" };
  }
  const STATE = path.join(DATA, "state", `${id}.json`);
  const state = readJson(STATE, { files: {} });

  setStatus({ state: "searching", activity: "Checking the QA Team test scripts for new or changed files" }, `Scanning ${dir}`);
  // Skip the blank template, scratch "Book" files and workbooks marked [OUTDATED].
  const all = listWorkbooks(dir).filter(f => !/\[(TEMPLATE|OUTDATED)\]|(^|\/)Book\d*\.xlsx$/i.test(f.rel));
  const work = all
    .filter(f => {
      const s = state.files[f.rel];
      if (!s || s.mtime !== f.mtime || s.size !== f.size) return true;
      // Cloud-only files are retried once a day, not every run (they would block the batch).
      return !!s.cloudOnly && Date.now() - Date.parse(s.cloudOnly) > 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => b.mtime - a.mtime);
  setStatus({ queue: work.length }, `Found ${all.length} workbook(s); ${work.length} new or changed`);
  if (DRY) { console.log(work.slice(0, 20).map(w => w.rel)); return { ok: true, found: work.length, studied: [], queue: work.length }; }

  const batch = work.slice(0, AGENT.maxPerRun);
  const studied = [];
  let lastError;
  for (const [i, f] of batch.entries()) {
    const key = f.rel.match(/[A-Z][A-Z0-9]+-\d+/)?.[0] ?? null;
    const textPath = path.join(TS_MIRROR, f.rel.replace(/\.xlsx$/i, ".md"));
    const studyPath = key
      ? path.join(ROOT, "_reference", "tickets", key, `${key}-qa-team-ts-study.md`)
      : path.join(TS_MIRROR, "_studies", path.basename(f.rel).replace(/\.xlsx$/i, "-study.md"));
    const kind = fs.existsSync(studyPath) ? "update" : "new";
    const title = path.basename(f.rel, ".xlsx");
    setStatus({ state: "reading", item: { key: key ?? "TS", title }, progress: { done: i, total: batch.length }, activity: `Opening ${path.basename(f.rel)}` }, `Opening ${f.rel}`);
    try {
      await xlsxToMarkdown(f.path, textPath);
      const r = await runClaude(tsPrompt(f, textPath, studyPath, key, kind), key ?? title.slice(0, 30));
      if (!r.ok) throw new Error(r.error);
      studied.push({ key: key ?? "TS", title, path: rel(studyPath), kind });
      state.files[f.rel] = { mtime: f.mtime, size: f.size, studiedAt: nowIso(), key, study: rel(studyPath) };
      await writeJson(STATE, state);
      await appendIndex(path.join(TS_MIRROR, "INDEX.md"), "# QA Team test scripts — study index (SharePoint Scribe)\n\nAppended by the SharePoint Scribe scheduled agent. Newest last.\n\n| Studied | Ticket | Workbook | Kind | Study |\n| --- | --- | --- | --- | --- |\n",
        `| ${new Date().toLocaleString("en-MY")} | ${key ?? "—"} | ${f.rel.replace(/\|/g, "/")} | ${kind} | ${rel(studyPath)} |`);
      setStatus({ progress: { done: i + 1, total: batch.length }, queue: work.length - (i + 1) }, `${key ?? title}: study ${kind === "new" ? "written" : "updated"}`);
    } catch (e) {
      // OneDrive cloud-only file (2026-10-27: every such file had a path over
      // 260 characters): note it, skip it for a day, keep the batch going.
      if (e?.code === "UNKNOWN" || /unknown error, read/i.test(String(e?.message))) {
        state.files[f.rel] = { mtime: f.mtime, size: f.size, cloudOnly: nowIso() };
        await writeJson(STATE, state);
        const long = f.path.length > 259 ? `, path ${f.path.length} characters` : "";
        setStatus({}, `${key ?? title}: not downloaded by OneDrive (cloud-only${long}). Right-click it → Always keep on this device. Skipped for today.`);
        continue;
      }
      lastError = `${f.rel}: ${String(e.message ?? e).slice(0, 300)}`;
      setStatus({}, `Failed on ${lastError}`);
    }
  }
  return { ok: !lastError, found: work.length, studied, queue: Math.max(0, work.length - studied.length), error: lastError };
}

async function appendIndex(file, header, line) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) await fsp.writeFile(file, header);
  await fsp.appendFile(file, line + "\n");
}

// ── main ────────────────────────────────────────────────────────────
async function main() {
  if (!FORCE && !inWorkingHours()) {
    setStatus({ state: "off-hours", activity: "Outside working hours (Mon–Fri 8am–7pm)", item: null, progress: null, startedAt: readJson(STATUS_PATH, {}).startedAt ?? null, finishedAt: readJson(STATUS_PATH, {}).finishedAt ?? null });
    await flushStatus();
    return;
  }
  if (!takeLock()) {
    // A ticket added on /pipeline waits its turn behind the hourly run instead
    // of being dropped (2026-10-27). Up to 30 minutes.
    if (!ONLY_KEY) { console.log("Another run of this agent is still going; skipping."); return; }
    await pipelineScoutState(ONLY_KEY, "working", "Waiting for a free Scout (2 already studying)");
    const until = Date.now() + 30 * 60 * 1000;
    while (!takeLock()) {
      if (Date.now() > until) {
        await pipelineScoutState(ONLY_KEY, "error", "Scout was busy for 30 minutes. Add the ticket again to retry.");
        return;
      }
      await sleep(20_000);
    }
  }
  const startedAt = nowIso();
  setStatus({ state: "waking", activity: "Waking up", item: null, progress: null, startedAt, finishedAt: null }, `Run started${FORCE ? " (Run now)" : ""}`);
  let r;
  try {
    r = id === "jira-study" ? await runJira() : await runSharePoint();
  } catch (e) {
    r = { ok: false, found: 0, studied: [], queue: status.queue, error: String(e.message ?? e).slice(0, 400) };
    setStatus({}, `Run failed: ${r.error}`);
  } finally {
    dropLock();
  }
  const finishedAt = nowIso();
  const finalState = status.state === "needs-setup" ? "needs-setup" : r.ok ? "done" : "error";
  setStatus({
    state: finalState, item: null, progress: null, finishedAt, nextRunAt: nextRun(),
    activity: finalState === "done" ? (r.studied.length ? `Studied ${r.studied.length} item(s)` : "Nothing new this time") : finalState === "error" ? `Stopped: ${r.error}` : status.activity,
    lastResult: { ok: r.ok, studied: r.studied, ...(r.error ? { error: r.error } : {}) },
    queue: r.queue,
  }, `Run finished: ${r.studied.length} studied, ${r.queue} waiting`);
  await flushStatus();
  if (!DRY) {
    await fsp.mkdir(DATA, { recursive: true });
    await fsp.appendFile(path.join(DATA, "runs.jsonl"), JSON.stringify({ id, startedAt, finishedAt, ok: r.ok, found: r.found, studied: r.studied, queue: r.queue, ...(r.error ? { error: r.error } : {}) }) + "\n");
  }
  // Settle to "sleeping" so the viewer shows the agent resting until the next run.
  if (finalState === "done") { await sleep(3000); setStatus({ state: "sleeping", activity: `Resting until ${status.nextRunAt ? new Date(status.nextRunAt).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" }) : "the next run"}` }); await flushStatus(); }
}

main().catch(async e => { console.error(e); try { setStatus({ state: "error", activity: String(e.message ?? e) }); await flushStatus(); } catch {} dropLock(); process.exit(1); });
