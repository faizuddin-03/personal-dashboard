// Findings page writer (Faizuddin, 2026-10-27; layout from the run-findings-page
// skill, references/example-12107-TS06.html).
//
// One folder per failed TS: _reference/tickets/<KEY>/<KEY>-<TS>-findings-<yyyy-mm-dd>/
// holding index.html + img/. Built by Node from the finding.json files, so the
// page always matches what the dashboard shows. Only real images are copied
// (run screenshots, rendered SRD pages): never a composed picture.

import fs from "node:fs";
import path from "node:path";
import { repoPath, relPath } from "../store.mjs";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** yyyy-mm-dd in local time. */
export const localDate = (d = new Date()) => d.toLocaleDateString("en-CA");

/** Repo-relative folder for a TS's findings page. */
export function pageFolder(key, ts, date = localDate()) {
  const safeTs = String(ts).replace(/[^A-Za-z0-9_-]+/g, "_");
  return `_reference/tickets/${key}/${key}-${safeTs}-findings-${date}`;
}

const LABEL = {
  system: "system defect",
  automation: "automation, not the system",
  data: "data / expected",
};

/** Copies an image into <folder>/img/ and returns its page-relative src, or null. */
function copyImage(folderAbs, rel, used) {
  if (!rel || /^https?:/i.test(rel)) return null;
  const src = rel.startsWith("/qa-artifacts/") ? repoPath(`public${rel}`) : repoPath(rel);
  if (!fs.existsSync(src)) return null;
  let name = path.basename(src).replace(/[^A-Za-z0-9._-]+/g, "_");
  while (used.has(name)) name = `x-${name}`;
  used.add(name);
  fs.mkdirSync(path.join(folderAbs, "img"), { recursive: true });
  fs.copyFileSync(src, path.join(folderAbs, "img", name));
  return `img/${name}`;
}

/**
 * Writes index.html for one TS's findings and returns the repo-relative folder.
 * findings: Finding[] for the same ts; meta: { key, ts, runId, runLabel, env, passed: string[] }.
 */
export function writeFindingsPage(findings, meta) {
  const folder = pageFolder(meta.key, meta.ts, meta.date);
  const abs = repoPath(folder);
  fs.mkdirSync(abs, { recursive: true });
  const used = new Set();
  const when = meta.runId && /^\d{12,}$/.test(String(meta.runId))
    ? new Date(Number(meta.runId)).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
  const counts = findings.reduce((m, f) => (m[f.classification] = (m[f.classification] ?? 0) + 1, m), {});

  const sections = findings.map((f, i) => {
    const srdImg = f.srd?.image ? copyImage(abs, f.srd.image, used) : null;
    const evid = (f.evidence ?? []).map(e => ({ ...e, src: copyImage(abs, e.image, used) })).filter(e => e.src);
    const srdBlock = f.srd && f.srd.quote && !/^nothing on this/i.test(f.srd.quote)
      ? `<blockquote>${esc(f.srd.quote)}<cite>${esc(path.basename(f.srd.file ?? ""))}${f.srd.page ? ` · page ${esc(f.srd.page)}` : ""}${f.srd.section ? ` · ${esc(f.srd.section)}` : ""}${f.quoteCheck?.srd === false ? " · not found word for word in the SRD text copy: check it" : ""}</cite></blockquote>
      ${srdImg ? `<figure><img src="${esc(srdImg)}" alt="SRD page ${esc(f.srd.page ?? "")}"><figcaption>${esc(path.basename(f.srd.file ?? ""))} · page ${esc(f.srd.page ?? "")}</figcaption></figure>` : ""}`
      : `<p>Nothing on this. ${f.srd?.quote && !/^nothing on this\.?$/i.test(f.srd.quote.trim()) ? esc(f.srd.quote.replace(/^nothing on this\.?\s*/i, "")) : "The expected result comes from the TS."}</p>`;
    return `
  <section class="finding">
    <div class="finding-head ${f.classification === "system" ? "" : "soft"}">
      <span class="eyebrow">Issue ${i + 1} · ${esc(LABEL[f.classification] ?? f.classification)}</span>
      <h2>${esc(f.summary)}</h2>
      <p><strong>Actual:</strong> ${esc(f.actual)} &nbsp; <strong>Expected:</strong> ${esc(f.expected)}</p>
      ${f.triage ? `<p><strong>Triage:</strong> ${esc(f.triage.verdict)}${f.triage.confidence ? ` (${esc(f.triage.confidence)})` : ""}${f.triage.knownAs ? ` · same as ${esc(f.triage.knownAs)}` : ""} — ${esc(f.triage.cause)}${f.triage.ruledOut?.length ? `<br><strong>Ruled out:</strong> ${f.triage.ruledOut.map(esc).join("; ")}` : ""}</p>` : ""}
    </div>
    <div class="source"><h3>What the TS says</h3><blockquote>${esc(f.tsQuote)}<cite>${esc(f.ts)}</cite></blockquote></div>
    <div class="source"><h3>What the SRD says</h3>${srdBlock}</div>
    <div class="source"><h3>What the system shows</h3>
      ${evid.length ? evid.map(e => `<figure><img src="${esc(e.src)}" alt="${esc(e.label)}"><figcaption>${esc(e.label)}</figcaption></figure>`).join("\n      ") : "<p>No screenshot was saved for this check.</p>"}
      ${f.failure?.friendlyError || f.failure?.error ? `<blockquote>${esc(f.failure.friendlyError || f.failure.error)}<cite>Run error${f.failure.step ? ` · step "${esc(f.failure.step)}"` : ""}</cite></blockquote>` : ""}
    </div>
    ${f.questionForDev ? `<div class="ask"><strong>Question for dev</strong><span>${esc(f.questionForDev)}</span></div>` : ""}
  </section>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.ts)} Findings</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
:root {
  --bg: #f5f7f9; --surface: #ffffff; --fg: #1b2530; --muted: #5a6876; --line: #d8dfe6;
  --accent: #1f5f8b; --bad: #b42318; --bad-bg: #fdecea; --good: #146c43; --good-bg: #e7f5ee; --quote-bg: #eef3f7;
  --body: "Source Sans 3", "Segoe UI", system-ui, sans-serif; --mono: "JetBrains Mono", Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #11171d; --surface: #18212a; --fg: #e3e9ef; --muted: #9aa8b5; --line: #2c3a47;
  --accent: #7cb7e3; --bad: #ff8a80; --bad-bg: #3a1d1b; --good: #6fd3a0; --good-bg: #16302a; --quote-bg: #1f2b36; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #11171d; --surface: #18212a; --fg: #e3e9ef; --muted: #9aa8b5; --line: #2c3a47;
  --accent: #7cb7e3; --bad: #ff8a80; --bad-bg: #3a1d1b; --good: #6fd3a0; --good-bg: #16302a; --quote-bg: #1f2b36; color-scheme: dark }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 var(--body); }
.wrap { max-width: 980px; margin: 0 auto; padding: 28px 16px 56px; display: grid; gap: 28px; }
header { display: grid; gap: 6px; }
.eyebrow { font: 600 12px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
h1 { font: 700 30px/1.15 var(--body); margin: 0; }
h2 { font: 700 22px/1.2 var(--body); margin: 0; }
h3 { font: 600 13px/1.2 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin: 0; }
p { margin: 0; max-width: 68ch; }
.meta { color: var(--muted); font-size: 14px; }
.status { display: inline-flex; gap: 8px; flex-wrap: wrap; }
.pill { font: 600 12px/1 var(--mono); padding: 6px 9px; border-radius: 999px; background: var(--bad-bg); color: var(--bad); }
.pill.good { background: var(--good-bg); color: var(--good); }
section.finding { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 22px 20px; display: grid; gap: 20px; }
.finding-head { display: grid; gap: 8px; border-left: 4px solid var(--bad); padding-left: 12px; }
.finding-head.soft { border-left-color: var(--accent); }
.source { display: grid; gap: 10px; min-width: 0; }
blockquote { margin: 0; background: var(--quote-bg); border-radius: 6px; padding: 12px 14px; font-size: 15px; white-space: pre-line; overflow-wrap: anywhere; }
blockquote cite { display: block; margin-top: 8px; font: 12px/1.4 var(--mono); color: var(--muted); font-style: normal; }
figure { margin: 0; display: grid; gap: 6px; }
figure img { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
figcaption { font: 12px/1.4 var(--mono); color: var(--muted); }
.ask { background: var(--quote-bg); border-radius: 6px; padding: 12px 14px; display: grid; gap: 4px; }
.ask strong { color: var(--accent); }
ul.passed { margin: 0; padding-left: 20px; }
</style></head>
<body><div class="wrap">
  <header>
    <span class="eyebrow">${esc(meta.key)}${meta.env ? ` · ${esc(meta.env)}` : ""}</span>
    <h1>${esc(meta.ts)}: ${esc(meta.title ?? "findings")}</h1>
    <p class="meta">Dashboard run ${esc(when)}${meta.runId ? ` (run ${esc(meta.runId)})` : ""}. Written by Elf from the run result.</p>
    <div class="status">${Object.entries(counts).map(([c, n]) => `<span class="pill${c === "system" ? "" : " good"}">${n} ${esc(LABEL[c] ?? c)}</span>`).join("")}</div>
  </header>
${sections}
${meta.passed?.length ? `  <section class="finding" style="gap:16px"><h2>Passed in the same run</h2><ul class="passed">${meta.passed.map(p => `<li>${esc(p)}</li>`).join("")}</ul></section>` : ""}
</div></body></html>
`;
  fs.writeFileSync(path.join(abs, "index.html"), html);
  return relPath(abs);
}
