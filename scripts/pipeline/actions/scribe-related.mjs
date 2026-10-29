// scribe:related — study past QA Team TS related to this ticket (2026-10-27).
// Node gathers and ranks the candidates (synced SharePoint folder, text
// mirrors, earlier studies, the CR catalogue) and converts the top workbooks
// to text; Scribe picks the truly related ones and writes
// _reference/tickets/Studying/<KEY>/<KEY>-related-history.md.

import fs from "node:fs";
import path from "node:path";
import { header, joinPrompt, STYLE_RULES, ASK_RULES, readText, exists, digitsOf, nameHasTicket } from "../prompts-common.mjs";
import { listAllWorkbooks, tsSources, convertWorkbook, mirrorFresh } from "../lib/xlsx-text.mjs";
import { scribeTools } from "./_tools.mjs";
import { ROOT } from "../store.mjs";
import { briefRel, briefTaskText, linkBrief } from "../lib/brief.mjs";

const MIRROR = "_reference/sharepoint/qa-team-ts";
const MAX_CANDIDATES = 10;
const STOP = new Set(("the and for with from into that this then than are was were will shall should to of in on at by as or an a is be " +
  "eauto eaint add update new display enable create via when show shows page system ucd bo cibo tobe also all " +
  "xlsx test scenario scenarios ts cr").split(/\s+/));

const words = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(w => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));

/** Keywords: title words, bracket tags ([eAuto-Insurance] → insurance), module/portal lines of the study. */
function keywordsFor(ticket, studyText) {
  const kw = new Map();
  const bump = (w, n) => kw.set(w, (kw.get(w) ?? 0) + n);
  for (const w of words(ticket.title)) bump(w, 2);
  for (const tag of String(ticket.title).match(/\[[^\]]+\]/g) ?? []) for (const w of words(tag)) bump(w, 3);
  for (const line of String(studyText ?? "").split("\n").slice(0, 80)) {
    if (/module|portal|page|screen|flow/i.test(line)) for (const w of words(line)) bump(w, 1);
  }
  return kw;
}

/** Linked ticket keys from the Jira capture (Links / Sub-tasks / Parent lines) and the study. */
function linkedKeys(key, jiraText, studyText) {
  const out = new Set();
  for (const line of String(jiraText ?? "").split("\n")) {
    if (/\*\*(Links|Sub-tasks|Parent):\*\*/.test(line)) for (const k of line.match(/[A-Z][A-Z0-9]+-\d+/g) ?? []) out.add(k);
  }
  for (const k of String(studyText ?? "").match(/EAINT-\d+/g) ?? []) out.add(k);
  out.delete(key);
  return [...out];
}

function scoreFile(rel, kw, linkedDigits) {
  const name = path.basename(rel, ".xlsx");
  let score = 0;
  const hits = [];
  for (const w of new Set(words(rel))) { const n = kw.get(w); if (n) { score += n; hits.push(w); } }
  for (const d of linkedDigits) if (nameHasTicket(name, d)) { score += 10; hits.push(`linked ${d}`); }
  return { score, hits };
}

function existingStudies() {
  const dir = path.join(ROOT, "_reference", "tickets");
  const out = [];
  let keys = [];
  try { keys = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch { return out; }
  for (const k of keys) {
    const f = `_reference/tickets/${k}/${k}-qa-team-ts-study.md`;
    if (exists(f)) out.push({ key: k, rel: f });
  }
  return out;
}

const action = {
  tools: scribeTools(),

  async prepare(ctx) {
    const { ticket, store, dry } = ctx;
    const key = ticket.key;
    const studyRel = ticket.files?.study ?? `_reference/tickets/Studying/${key}/${key}-study.md`;
    const studyText = readText(studyRel);
    const jiraText = readText(`_reference/tickets/Studying/${key}/${key}-jira.md`);
    const kw = keywordsFor(ticket, studyText);
    const linked = linkedKeys(key, jiraText, studyText);
    const linkedDigits = linked.map(digitsOf);
    const ownDigits = digitsOf(key);

    // 1. Every test-script source: the synced eAuto folder first, then other
    //    synced "Test Scenario" shortcuts and the repo snapshots (Secarang/CIBO), 2026-10-27.
    let ranked = [];
    let ownOfficial = null;
    {
      ctx.activity("Looking through the QA Team test scripts");
      const all = listAllWorkbooks(store.ROOT);
      for (const f of all) {
        if (nameHasTicket(path.basename(f.rel), ownDigits)) { ownOfficial = f; continue; }
        const s = scoreFile(f.rel, kw, linkedDigits);
        if (s.score > 0) ranked.push({ ...f, ...s });
      }
      ranked.sort((a, b) => b.score - a.score || b.mtime - a.mtime);
      ranked = ranked.slice(0, MAX_CANDIDATES);
    }

    // 2. Text mirrors: reuse a fresh one, else convert now.
    const converted = [];
    for (const f of ranked) {
      const mirrorRel = `${MIRROR}/${f.mirrorRel}`;
      f.mirror = mirrorRel;
      if (mirrorFresh(f.path, store.repoPath(mirrorRel))) continue;
      if (dry) { f.mirrorNote = "would convert"; continue; }
      try {
        ctx.activity(`Converting ${path.basename(f.rel)}`);
        await convertWorkbook(f.path, store.repoPath(mirrorRel));
        converted.push(mirrorRel);
      } catch (e) {
        f.mirror = null;
        f.mirrorNote = `could not convert (${String(e.message ?? e).slice(0, 80)})`;
      }
    }

    // 3. Earlier studies by the SharePoint Scribe.
    const studies = existingStudies();
    const relatedStudies = studies.filter(s => {
      const d = digitsOf(s.key);
      return linkedDigits.includes(d) || ranked.some(f => nameHasTicket(path.basename(f.rel), d));
    });

    const outRel = `_reference/tickets/Studying/${key}/${key}-related-history.md`;
    ctx.state.outRel = outRel;
    const today = new Date().toLocaleDateString("en-CA");
    const candidateLines = ranked.length
      ? ranked.map((f, i) => `${i + 1}. "${f.rel}" — score ${f.score} (${f.hits.join(", ")})${f.mirror ? ` — text copy: ${f.mirror}${f.mirrorNote ? ` [${f.mirrorNote}]` : ""}` : ` — ${f.mirrorNote ?? "no text copy"}`}`).join("\n")
      : "1. (no candidate workbooks found by name; search the mirrors and studies below yourself)";

    const task = `Find what the QA Team tested BEFORE on the same module, page or flow as ${key}, and write ${outRel} ${exists(outRel) ? "(it exists: update it, keep what is still right)" : "(new file)"}.

Material (Node already gathered and ranked it by file-name overlap with the ticket title, module words and linked tickets — the ranking is a hint, not the answer):
Ranked candidate workbooks (searched: ${tsSources(store.ROOT).map(s => s.label).join("; ") || "no test-script source found on this PC"}):
${candidateLines}

Linked tickets from the Jira capture / study: ${linked.join(", ") || "none"}.
${ownOfficial ? `This ticket's OWN official TS exists in the QA Team folder: "${ownOfficial.rel}". Mention it at the top; do not study it as history.` : "No official TS for this ticket exists in the QA Team folder yet."}
Earlier TS studies that look related:
${relatedStudies.length ? relatedStudies.map((s, i) => `${i + 1}. ${s.rel}`).join("\n") : "1. none matched; search _reference/tickets/*/*-qa-team-ts-study.md yourself"}
Other places to search:
1. ${MIRROR}/ (all text copies) and ${MIRROR}/INDEX.md
2. knowledge/cr-test-scenario-catalogue.md
3. knowledge/README.md and the knowledge/flow-*.md file of this module
4. The Scout study: ${studyRel}
5. Other QAs' automation and ledgers (night round 37): knowledge/script-inventory-team.md §2 and §4 (who automated which ticket / module, and what is reusable), and another QA's scenario ledgers in _reference/codebases/eauto-qa-charmain/test-scenarios/<module>/<module>.md (read only). If one covers this module, list it under "## Related past tickets" as "other QA's coverage" with its path, and its traps under "## Known traps".

Steps:
1. Read the Scout study to know the module, portal, pages and flow this ticket changes.
2. Open the candidates and search the mirrors/studies; keep ONLY truly related past tickets (same module/page/flow, or linked). Drop name-only matches.
3. Write ${outRel} with this layout, title line "# ${key} — related history (${today})":
   0. "## Ticket brief" FIRST, right under the title (Faizuddin, 2026-10-27): three short numbered parts matching ${briefRel(key)} exactly — **High-level scope** (the scope lines), **Estimated testing time** (man-days, range, confidence, official Miro/Jira figure if any), **Modules / pages to cover** (module (portal): pages — why), then **Testing scope** as the same nested outline as "testingScope" in the JSON (Miro card style, 2026-10-28).
   1. "## Header": module/portal, how many past tickets kept, own official TS (if any).
   2. "## Related past tickets": numbered, one per ticket — key, title, workbook path, why it is related.
   3. "## What was tested before": per ticket, the scenarios that touch the same flow (TS id + one line, verbatim titles in quotes with sheet + row).
   4. "## Reusable scenarios": TS from past tickets that can be reused or adapted for ${key}, with the source TS id.
   5. "## Known traps": system behaviour, data setup or environment traps the past TS reveal (verbatim with source).
   6. "## Past QA-Issues mentioned": any QA-Issue keys or defects written in those sheets/studies.
   7. "## Estimated testing effort" (Faizuddin, 2026-10-27): an estimate for testing ${key}, built from evidence, never a bare guess:
      1. **Comparable tickets:** a small table of the related past tickets with their TS count (count the TS rows in their workbook text copies) and their Jira "[QA] Est Man-day (cf 10081)" — run \`node scripts/pipeline/tools/fetch.mjs issue <KEY>\` for each one whose capture is missing or older than the field, and quote the value with its source. Also note any manday estimate the Scout study already quotes (e.g. Miro "Est. mandays").
      2. **Expected TS count for ${key}:** a range, with one line on why (size of the change vs the comparables).
      3. **Estimate in man-days:** one number or a tight range, split into TS drafting, test execution, retest / QA-Issue buffer, and automation build (only if the ticket is automatable; Wholesale TS are manual only).
      4. **Confidence:** high / medium / low, and what would change it. Mark the estimate [unconfirmed]; the official figure lives in the QA Portal, which agents do not open.
   8. "## Sources read".
4. Write ${briefRel(key)} with the SAME scope, estimate and modules as your "## Ticket brief" and "## Estimated testing effort" sections:
${briefTaskText(key)}
5. Write ONLY ${outRel} and ${briefRel(key)}. Do not edit any other file.`;

    if (converted.length) ctx.log(`Scribe converted ${converted.length} workbook(s) to text`);
    return { prompt: joinPrompt(header("scribe", ticket, task), STYLE_RULES, ASK_RULES) };
  },

  async finish(ctx, { ok, text }) {
    const { store, job, state } = ctx;
    if (!ok) return;
    if (!fs.existsSync(store.repoPath(state.outRel))) {
      // Scribe stopped to ask another character first (```ask); it writes the file when the answer comes back.
      if (/```ask/i.test(text ?? "")) return;
      throw new Error(`Scribe finished but ${state.outRel} was not written`);
    }
    store.updateTicket(job.key, t => {
      t.files = { ...t.files, related: state.outRel };
      store.raiseStage(t, "related");
      t.events = [{ at: store.nowIso(), text: "Scribe wrote the related history" }, ...(t.events ?? [])].slice(0, 100);
    });
    checkBriefAfterScribe(ctx, job.id);
  },
};

/**
 * Ticket brief check (2026-10-27), once the related history exists: link a
 * complete brief.json, or ask Scribe ONCE per job to finish it. Never fails
 * silently: the fix chat's finish() (scribe-chat.mjs) leaves Scribe "waiting"
 * with what is still missing. Also used by scribe:chat when it is the
 * continuation (after an ```ask) that wrote the related history.
 */
export function checkBriefAfterScribe(ctx, forJobId) {
  const { store, job } = ctx;
  const key = job.key;
  const r = linkBrief(store, key);
  if (r.ok) {
    store.addEvent(key, "Scribe wrote the ticket brief (scope, man-days, modules/pages)");
    return r;
  }
  // Loop guard: one brief-fix chat per job.
  if (store.listJobs({ key }).some(j => j.action === "scribe:chat" && j.input?.briefFixFor === forJobId)) return r;
  const what = r.missing.join("; ");
  store.appendChat(key, "scribe", { from: "system", text: `Ticket brief incomplete: ${what}. Asked Scribe to finish ${r.rel}.`, jobId: job.id });
  store.queueJob({ key, action: "scribe:chat", input: { briefFix: true, briefFixFor: forJobId, missing: r.missing, text: `Ticket brief incomplete: ${what}` } });
  store.updateTicket(key, t => {
    t.characters.scribe = { ...t.characters.scribe, state: "working", note: "Finishing the ticket brief" };
  });
  return r;
}

export default action;
