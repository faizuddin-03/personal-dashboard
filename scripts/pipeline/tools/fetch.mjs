#!/usr/bin/env node
// Pipeline toolbox (Faizuddin, 2026-10-27: "make sure all those agents can get
// the files they needed, even if they need to ask each other").
//
//   node scripts/pipeline/tools/fetch.mjs help
//
// Any character (Scout, Scribe, Elf, Dwarf) may run this through its Bash
// allow-list (scripts/pipeline/actions/_tools.mjs). It fetches what a
// character would otherwise ask Faizuddin for: the Jira issue, its
// attachments (SRDs, mock-ups, workbooks) with text copies, linked tickets,
// a Jira search, and past QA Team test scripts from the synced folder.
//
// READ ONLY on Jira and SharePoint: GET requests plus the search POST, nothing
// else. Writes only under _reference/tickets/Studying/<KEY>/ and
// _reference/sharepoint/qa-team-ts/.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, jiraCreds, jiraFetch, relPath } from "../store.mjs";
import { ensureTextCopy, CONVERTIBLE, textCopyPath } from "../lib/attach-text.mjs";
import { convertWorkbook, mirrorFresh, tsSources, listAllWorkbooks } from "../lib/xlsx-text.mjs";

const STUDYING = path.join(ROOT, "_reference", "tickets", "Studying");
const TS_MIRROR = path.join(ROOT, "_reference", "sharepoint", "qa-team-ts");
const MAX_BYTES = 25 * 1024 * 1024;
const VIDEO = /\.(mp4|mov|avi|mkv|webm|wmv|m4v|flv|3gp|mpe?g)$/i;
const QA_FIELD = "customfield_10041";

const out = (...l) => console.log(l.join(" "));
const fail = (msg, code = 1) => { console.log(msg); process.exit(code); };

// ── input checks ────────────────────────────────────────────────────
/** EAINT-12386 (also accepts eaint-12386 / EAINT12386). Refuses anything else. */
function keyArg(raw) {
  const s = String(raw ?? "").trim().toUpperCase().replace(/^([A-Z][A-Z0-9]*?)(\d+)$/, "$1-$2");
  if (!/^[A-Z][A-Z0-9]+-\d+$/.test(s)) fail(`Not a Jira key: "${raw ?? ""}". Use the form EAINT-12345.`, 2);
  return s;
}

function needJira() {
  if (!jiraCreds()) fail("Jira login is not connected on this PC (data/agents/jira.json is missing). Faizuddin connects it once on the dashboard Agents page; until then this command cannot reach Jira.");
}

/** Read-only Jira: GET only. */
async function jiraGet(pathname, headers) {
  return jiraFetch(pathname, { method: "GET", ...(headers ? { headers } : {}) });
}

const ticketDir = key => path.join(STUDYING, key);

/** Keeps a written path inside the ticket's Studying folder. */
function safeFile(dir, name) {
  const clean = String(name).replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+/, "_").slice(0, 180);
  const abs = path.resolve(dir, clean);
  if (!abs.startsWith(path.resolve(dir) + path.sep)) throw new Error(`Unsafe file name: ${name}`);
  return abs;
}

// ── ADF → text (same rules as scripts/agents/run-agent.mjs adfText) ─
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

// ── Jira reads ──────────────────────────────────────────────────────
async function getIssue(key) {
  try { return await (await jiraGet(`/rest/api/3/issue/${key}?fields=*all`)).json(); }
  catch (e) {
    if (/Jira 404/.test(String(e.message))) fail(`${key} was not found in Jira (or this login cannot see it).`);
    throw e;
  }
}

async function getAllComments(key) {
  const all = [];
  for (let startAt = 0; startAt < 2000;) {
    const page = await (await jiraGet(`/rest/api/3/issue/${key}/comment?startAt=${startAt}&maxResults=100&orderBy=created`)).json();
    const got = page.comments ?? [];
    all.push(...got);
    startAt += got.length;
    if (!got.length || startAt >= (page.total ?? 0)) break;
  }
  return all;
}

/** `issue <KEY>` — the capture run-agent writes, refreshed now. */
async function captureIssue(key) {
  needJira();
  const issue = await getIssue(key);
  const f = issue.fields;
  const comments = await getAllComments(key);
  const users = v => (Array.isArray(v) ? v : v ? [v] : []).map(u => u.displayName).join(", ") || "—";
  const lines = [
    `# ${key} — Jira capture (${new Date().toLocaleString("en-MY")})`,
    "",
    "Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.",
    "",
    `1. **Summary:** ${f.summary}`,
    `2. **Type:** ${f.issuetype?.name} · **Status:** ${f.status?.name} · **Priority:** ${f.priority?.name ?? "—"}`,
    `3. **Assignee:** ${users(f.assignee)} · **Reporter:** ${users(f.reporter)} · **QA (cf 10041):** ${users(f[QA_FIELD])}`,
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
  const dir = ticketDir(key);
  await fsp.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${key}-jira.md`);
  await fsp.writeFile(dest, lines.join("\n"));
  return { issue, dest, comments: comments.length };
}

// ── attachments ─────────────────────────────────────────────────────
/** Version (numeric parts: v0.10 > v0.9) and yyyymmdd date of an SRD file name, for "newest". */
function srdRank(a) {
  const v = a.filename.match(/v(\d+(?:\.\d+)*)/i)?.[1]?.split(".").map(Number) ?? [];
  const d = a.filename.match(/(20\d{6})/)?.[1] ?? "";
  return { v, d, created: a.created ?? "" };
}
function cmpRank(x, y) {
  for (let i = 0; i < Math.max(x.v.length, y.v.length); i++) {
    const a = x.v[i] ?? -1, b = y.v[i] ?? -1;
    if (a !== b) return a - b;
  }
  return x.d.localeCompare(y.d) || String(x.created).localeCompare(String(y.created));
}
function newestSrd(attachments) {
  const srds = attachments.filter(a => /srd/i.test(a.filename) && !VIDEO.test(a.filename));
  if (!srds.length) return null;
  return srds.sort((a, b) => cmpRank(srdRank(a), srdRank(b))).at(-1);
}

async function downloadAttachments(key, { name } = {}) {
  needJira();
  const issue = await getIssue(key);
  const list = issue.fields.attachment ?? [];
  const dir = ticketDir(key);
  await fsp.mkdir(dir, { recursive: true });
  const part = name ? String(name).toLowerCase() : null;
  const rows = [];
  for (const a of list) {
    if (part && !a.filename.toLowerCase().includes(part)) continue;
    const isVideo = VIDEO.test(a.filename) || /^video\//i.test(a.mimeType ?? "");
    if (isVideo && !part) { rows.push({ a, note: "skipped (video; add --name to fetch it)" }); continue; }
    if (a.size > MAX_BYTES) { rows.push({ a, note: `skipped (${Math.round(a.size / 1048576)} MB, over 25 MB)` }); continue; }
    let dest;
    try { dest = safeFile(dir, a.filename); } catch (e) { rows.push({ a, note: `skipped (${e.message})` }); continue; }
    let note;
    if (fs.existsSync(dest) && fs.statSync(dest).size === a.size) note = "already here";
    else {
      try {
        const res = await jiraGet(new URL(a.content).pathname.replace(/^\/+/, "/"), { Accept: "*/*" });
        await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
        note = "downloaded";
      } catch (e) { rows.push({ a, note: `could not download (${String(e.message).slice(0, 120)})` }); continue; }
    }
    let text = null;
    if (CONVERTIBLE.test(dest)) {
      try {
        const r = await ensureTextCopy(dest);
        text = r.dest;
        if (r.converted) note += ", text copy made";
      } catch (e) { note += `, text copy FAILED (${String(e.message ?? e).slice(0, 120)})`; }
    }
    rows.push({ a, dest, text, note });
  }
  return { list, rows, srd: newestSrd(list), dir };
}

// ── search / linked ─────────────────────────────────────────────────
async function search(jql) {
  needJira();
  const body = { jql, fields: ["summary", "status", "issuetype"], maxResults: 50 };
  // The one POST the toolbox makes: Jira's search endpoint (it reads, never writes).
  const data = await (await jiraFetch("/rest/api/3/search/jql", { method: "POST", body: JSON.stringify(body) })).json();
  return data.issues ?? [];
}

// ── QA Team test scripts ────────────────────────────────────────────
async function convertTs(query) {
  // Every test-script source: the synced eAuto folder, other synced "Test
  // Scenario" shortcuts, and the Secarang/CIBO + eAuto snapshots in the repo (2026-10-27).
  const sources = tsSources(ROOT);
  if (!sources.length) fail("No test-script source found on this PC (no synced QA Team folder and no snapshot under _reference/sharepoint/).");
  const q = query.trim();
  const keyM = q.toUpperCase().match(/^[A-Z][A-Z0-9]+-?(\d{4,})$/);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = listAllWorkbooks(ROOT).filter(f => {
    const n = f.rel.toLowerCase();
    if (keyM) return new RegExp(`(^|[^0-9])${keyM[1]}(?![0-9])`).test(path.basename(n)) || new RegExp(`(^|[^0-9])${keyM[1]}(?![0-9])`).test(path.dirname(n));
    return words.every(w => n.includes(w));
  });
  if (!hits.length) fail(`No workbook matches "${q}". Searched: ${sources.map(s => s.label).join("; ")}.`);
  hits.sort((a, b) => b.mtime - a.mtime);
  let bad = 0;
  for (const f of hits.slice(0, 10)) {
    const dest = path.join(TS_MIRROR, f.mirrorRel);
    if (!path.resolve(dest).startsWith(TS_MIRROR + path.sep)) { out(`SKIP ${f.rel}: unsafe path`); continue; }
    if (mirrorFresh(f.path, dest)) { out(`OK   [${f.source}] ${f.rel} -> ${relPath(dest)} (text copy already up to date)`); continue; }
    try { await convertWorkbook(f.path, dest); out(`OK   [${f.source}] ${f.rel} -> ${relPath(dest)}`); }
    catch (e) { bad++; out(`FAIL [${f.source}] ${f.rel}: ${e.message}`); }
  }
  if (hits.length > 10) out(`(${hits.length - 10} more matched; use more words to narrow it)`);
  return bad;
}

// ── CLI ─────────────────────────────────────────────────────────────
const HELP = `Pipeline toolbox — read-only fetches for Scout, Scribe, Elf and Dwarf.
Run each command on its own (no cd, no pipes): node scripts/pipeline/tools/fetch.mjs <command>

1. issue <KEY>                      Refresh the Jira capture (fields, QA field, description, ALL comments,
                                     links, sub-tasks, parent, attachment list) -> _reference/tickets/Studying/<KEY>/<KEY>-jira.md
2. attachments <KEY> [--name <part>] Download attachments (all types up to 25 MB; videos only with --name)
                                     into _reference/tickets/Studying/<KEY>/ and write <name>-text.md copies of
                                     .docx / .xlsx / .pdf / .html. Prints the newest SRD.
3. search "<JQL>"                   Jira search, up to 50 results: key | type | status | summary.
4. linked <KEY>                     Run "issue" for each linked ticket and the parent (max 10).
5. ts <EAINT-key or words>          Text copy of matching past QA Team test scripts (synced SharePoint folder)
                                     -> _reference/sharepoint/qa-team-ts/<same path>.md
6. miro <board link or id> [--frame <name>]
                                     Read a Miro board's text (sticky notes, cards, text, shapes) through the
                                     agents' own signed-in Miro browser -> _reference/miro/<board-id>-<date>.md.
                                     Read only. Board links per ticket: _reference/miro-links.txt or the Jira capture.
7. help                             This text.

Never writes to Jira, SharePoint or Miro.`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch ((cmd ?? "help").toLowerCase()) {
    case "help": case "--help": case "-h":
      out(HELP); return;

    case "issue": {
      const key = keyArg(rest[0]);
      const { issue, dest, comments } = await captureIssue(key);
      const f = issue.fields;
      out(`${key}: "${f.summary}" (${f.issuetype?.name}, ${f.status?.name})`);
      out(`Wrote ${relPath(dest)} — ${comments} comment(s), ${(f.attachment ?? []).length} attachment(s), ${(f.issuelinks ?? []).length} link(s).`);
      const srd = newestSrd(f.attachment ?? []);
      if (srd) out(`Newest SRD in Jira: ${srd.filename}. Get it with: node scripts/pipeline/tools/fetch.mjs attachments ${key}`);
      return;
    }

    case "attachments": {
      const key = keyArg(rest[0]);
      const ni = rest.indexOf("--name");
      const name = ni >= 0 ? rest.slice(ni + 1).join(" ").trim() : undefined;
      if (ni >= 0 && !name) fail("--name needs part of a file name.", 2);
      const { list, rows, srd, dir } = await downloadAttachments(key, { name });
      if (!list.length) { out(`${key} has no attachments in Jira.`); return; }
      if (!rows.length) { out(`No attachment of ${key} matches "${name}". Files: ${list.map(a => a.filename).join(", ")}`); return; }
      out(`${key}: ${rows.length} attachment(s) in ${relPath(dir)}/`);
      rows.forEach((r, i) => {
        const file = r.dest ? relPath(r.dest) : r.a.filename;
        out(`${i + 1}. ${file} — ${r.note}${r.text ? ` — text: ${relPath(r.text)}` : ""}`);
      });
      if (srd) {
        const abs = path.join(dir, srd.filename.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_"));
        const txt = CONVERTIBLE.test(abs) && fs.existsSync(textCopyPath(abs)) ? relPath(textCopyPath(abs)) : null;
        out(`Newest SRD: ${relPath(abs)}${txt ? ` — read the text copy: ${txt}` : fs.existsSync(abs) ? "" : " (not downloaded)"}`);
      } else out("No attachment has SRD in its name.");
      return;
    }

    case "search": {
      const jql = rest.join(" ").trim();
      if (!jql) fail('Give a JQL query in quotes, e.g. search "project = EAINT AND text ~ \\"insurance\\""', 2);
      const issues = await search(jql);
      if (!issues.length) { out("No issues match."); return; }
      issues.forEach((i, n) => out(`${n + 1}. ${i.key} | ${i.fields?.issuetype?.name ?? "?"} | ${i.fields?.status?.name ?? "?"} | ${i.fields?.summary ?? ""}`));
      if (issues.length === 50) out("(showing the first 50)");
      return;
    }

    case "linked": {
      const key = keyArg(rest[0]);
      needJira();
      const f = (await getIssue(key)).fields;
      const keys = [...new Set([
        ...(f.parent ? [f.parent.key] : []),
        ...(f.issuelinks ?? []).map(l => (l.outwardIssue ?? l.inwardIssue)?.key),
      ].filter(Boolean))].filter(k => k !== key);
      if (!keys.length) { out(`${key} has no linked tickets or parent.`); return; }
      for (const k of keys.slice(0, 10)) {
        try {
          const { issue, dest } = await captureIssue(k);
          out(`OK   ${k} "${issue.fields.summary}" (${issue.fields.status?.name}) -> ${relPath(dest)}`);
        } catch (e) { out(`FAIL ${k}: ${String(e.message ?? e).slice(0, 160)}`); }
      }
      if (keys.length > 10) out(`(${keys.length - 10} more linked tickets not captured: ${keys.slice(10).join(", ")})`);
      return;
    }

    case "ts": {
      const q = rest.join(" ").trim();
      if (!q) fail("Give an EAINT key or words from the workbook name.", 2);
      const bad = await convertTs(q);
      if (bad) process.exitCode = 1;
      return;
    }

    case "miro": {
      // Delegates to the Miro reader (its own browser profile, read only).
      if (!rest.length) fail("Give a Miro board link or id, e.g. miro https://miro.com/app/board/uXjVxxxxxxx=/", 2);
      const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "pipeline", "tools", "miro.mjs"), "read", ...rest], { cwd: ROOT, stdio: "inherit", windowsHide: true });
      process.exitCode = r.status ?? 1;
      return;
    }

    default:
      fail(`Unknown command "${cmd}".\n\n${HELP}`, 2);
  }
}

main().catch(e => {
  console.log(`Failed: ${String(e?.message ?? e).slice(0, 400)}`);
  process.exit(1);
});
