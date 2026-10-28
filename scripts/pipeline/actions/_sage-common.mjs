// Shared parts of the Sage's jobs (knowledge keeper, Faizuddin 2026-10-27):
// the knowledge rules for the prompt, the hand-off file the Sage writes its
// proposals to (data/pipeline/sage-out/<jobId>.json), and the after-step that
// merges that file into the shared lists and logs what knowledge/ changed.
// README §8.

import fs from "node:fs";
import path from "node:path";
import { SAGE_OUT_DIR } from "./_tools.mjs";
import { normQuestion } from "../answers.mjs";

export const sageOutRel = jobId => `${SAGE_OUT_DIR}/${jobId}.json`;

/** Knowledge rules (AGENTS.md "QA knowledge base", knowledge/README.md "The one rule", memory feedback files).
 *  Rule 10 (night round 14): QA principle 15 [charmain-repo: docs/qa-principles.md:132-149].
 *  Rule 11 (night round 18): SSoT, principle 7 [charmain-repo: docs/qa-principles.md:18]; improvements.json "Route code-data corrections". */
export const KNOWLEDGE_RULES = `Knowledge base rules (AGENTS.md and knowledge/README.md; follow them exactly):
1. Every fact carries its provenance tag. Use the knowledge/README.md formats, plus these for pipeline work:
   "[source: pipeline <KEY>, <who/what, e.g. Scout study | Scribe related history | Elf scenarios | Dwarf build>, <YYYY-MM-DD>]",
   "[Faizuddin, dashboard chat to <character>, <YYYY-MM-DD>]" for his own words,
   "[from ticket <KEY>]" for SRD / Jira facts (name the SRD version + section when you can).
   Anything inferred, guessed or not yet checked gets "[unconfirmed]" — never present it as established.
2. Quote sources verbatim in quotation marks with the exact location. Never paraphrase a quote.
3. Small, precise additions. Append to the right section of the right file; never rewrite, reorder or delete existing knowledge. Keep each file's line endings and table layout.
4. Durable facts only: portals, business rules, flows, DOM handles, environment quirks, how Faizuddin wants work done. NOT ticket progress, sprint state, "currently being deployed", job status, or anything the code already says plainly.
5. Standing rule "capture the flow": when the material shows how a module's flow behaves (steps, branches, entry points, the DOM that drives it), add it to knowledge/flow-<module>.md (create it if missing, following knowledge/flows.md; flat files only, no sub-folders) and add the new file to the index table in knowledge/README.md.
6. If new material CHANGES or CONTRADICTS an existing fact, do NOT edit that fact. Put it in "review" in the hand-off file (below) with the current text copied verbatim.
7. Positions, not names: the developer, the BA, another QA — a name only when it must be specific. Never claim a "team standard" or that others use Faizuddin's tools.
8. Before adding, Grep knowledge/ for the fact: if it is already there, do nothing (or add only the missing source).
9. Ignore WA Blaster entirely (knowledge/README.md standing rule).
10. Lessons (another QA's rule: "A lesson that is not written down will be paid for again"): when the material shows a failure whose cause was the script, the data or the environment but looked like a product fault (a finding marked not an issue, a triage verdict script / environment / data, a Dwarf fix after a red run, an assertion-guard or suite-check note), add ONE short lesson to knowledge/automation-playbook.md: the trap in plain words, how it showed (the error or symptom), what it cost (a wasted run, a wrong QA-Issue), and the fix. Tag it with the finding / job / chat it came from. Skip it when the same lesson is already there.
11. Data held in CODE (lib/eautoFlows/**, lib/ticketStudies.ts, other .ts/.tsx files) is not knowledge: never copy a correction of it into knowledge/ and never edit code. Put it in "improvements" (area "process") with the observation starting "Code data fix:" and naming the file + line, so Faizuddin approves it separately (one source of truth per fact).`;

/** Instructions for the hand-off file (what code merges after the job). */
export function handoffRules(jobId) {
  return `Hand-off file: write ${sageOutRel(jobId)} (JSON, one Write at the end; skip it if every list is empty):
{
  "review": [{ "file": "knowledge/<file>.md", "current": "<exact text in the file now, copied verbatim>", "proposed": "<replacement text, with its provenance tag>", "why": "<one line>", "sources": ["<file + section/row, or chat + date>"] }],
  "improvements": [{ "area": "scout|scribe|elf|dwarf|sage|toolbox|ui|process", "observation": "<what happened, with evidence: chat date, job, file>", "suggestion": "<what to change in the pipeline>" }],
  "answers": [{ "question": "<the character's question, original wording>", "answer": "<Faizuddin's exact words>", "scope": "global | ticket:<KEY> | module:<name>", "askedBy": "scout|scribe|elf|dwarf", "date": "YYYY-MM-DD", "source": "data/pipeline/chats/<KEY>/<character>.jsonl @ <ISO time of his message>" }],
  "learned": [{ "file": "knowledge/<file>.md", "what": "<one line: what you added>" }]
}
You may only write under knowledge/ and ${SAGE_OUT_DIR}/. The shared files (knowledge-review.json, improvements.json, answers.json, learnings.jsonl) are merged from this file by the dashboard: never edit them yourself.`;
}

/** Answer registry rules (Faizuddin, 2026-10-27: no repeated questions). */
export const ANSWER_RULES = `Answer registry (data/pipeline/answers.json; Faizuddin: "one of the things i want to avoid is the agents asking me the same question over and over again"):
1. When a character asked Faizuddin something and he answered in the chat, add an "answers" entry: the question in its original wording, his answer in his EXACT words (no tidying), who asked, the date, the chat file + time.
2. Scope conservatively: "ticket:<KEY>" by default. "module:<name>" only when the answer is about a module, not one ticket (name = a word that appears in that module's ticket titles, e.g. "JomCheck", "eMOVE", "Insurance"). "global" ONLY when clearly general for every ticket (how he wants TS numbered, which environment, tool preferences, "fetch it yourself", how cronjobs are tested).
3. Skip answers that only make sense in the moment ("yes", "can try again", "i made fix") unless the question makes them durable.
4. Check the registry first: never add a duplicate of an active entry (same meaning, same scope).
5. A durable general answer ALSO goes into knowledge/ as plain knowledge, tagged "[Faizuddin, dashboard chat, <YYYY-MM-DD>]", following the knowledge rules.
6. A reply that only parks the question ("i will give you this later", "ignore first", "ask me again later") is NOT an answer: do not add it (the pipeline tracks it as a deferred question and reminds the character he named). When a reply mixes a fact with a deferral, store only the fact.
7. "same as <KEY>" (round 16 hints invite this): find his answer on that ticket in answers.json and add an entry for THIS ticket with the same answer text, the source "same as <KEY>, <chat file @ time>". If he says it holds for the module or everywhere, use "module:<name>" or "global" instead, and say so in your reply.`;

/** Improvement-idea rules. */
export const IMPROVEMENT_RULES = `Pipeline improvement ideas ("improvements" in the hand-off file). Look for, with evidence:
1. A character asked Faizuddin for something it could have fetched itself (toolbox, another character, the repo).
2. A question he had already answered, asked again.
3. A missing toolbox command, a file a character could not open, a permission it lacked.
4. A prompt or rule that led to a wrong or rejected output, a repeated mistake, a slow or failed step.
Never edit code: only describe the idea. One item per idea; skip ideas already open in data/pipeline/improvements.json.`;

// ── knowledge/ snapshot + diff (what the job changed) ─────────────────
export function snapshotKnowledge(root) {
  const dir = path.join(root, "knowledge");
  const snap = new Map();
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith(".md")); } catch { return snap; }
  for (const n of names) {
    try { snap.set(n, fs.readFileSync(path.join(dir, n), "utf8")); } catch { /* skip */ }
  }
  return snap;
}

const lines = s => s.replace(/\r\n/g, "\n").split("\n");

/** Files added/updated since the snapshot, with line counts (multiset difference). */
export function diffKnowledge(root, before) {
  const after = snapshotKnowledge(root);
  const out = [];
  for (const [name, text] of after) {
    const old = before.get(name);
    if (old === text) continue;
    const count = arr => { const m = new Map(); for (const l of arr) m.set(l, (m.get(l) ?? 0) + 1); return m; };
    const o = count(old == null ? [] : lines(old)), n = count(lines(text));
    let added = 0, removed = 0;
    for (const [l, c] of n) added += Math.max(0, c - (o.get(l) ?? 0));
    for (const [l, c] of o) removed += Math.max(0, c - (n.get(l) ?? 0));
    out.push({ path: `knowledge/${name}`, change: old == null ? "added" : "updated", linesAdded: added, linesRemoved: removed });
  }
  for (const name of before.keys()) {
    if (!after.has(name)) out.push({ path: `knowledge/${name}`, change: "updated", linesAdded: 0, linesRemoved: lines(before.get(name)).length });
  }
  return out;
}

// ── hand-off merge ─────────────────────────────────────────────────────
const AREAS = new Set(["scout", "scribe", "elf", "dwarf", "sage", "toolbox", "ui", "process"]);
const ASKERS = new Set(["scout", "scribe", "elf", "dwarf", "sage"]);
const str = (v, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const normText = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SCOPE_RE = /^(global|ticket:[A-Z][A-Z0-9]+-\d+|module:[^\n]{1,60})$/;

/**
 * Reads data/pipeline/sage-out/<jobId>.json, validates it, and appends to the
 * shared lists under their file locks. Returns counts + the learned lines.
 */
export function mergeSageOut({ store, job }) {
  const abs = store.repoPath(sageOutRel(job.id));
  let raw;
  try { raw = JSON.parse(fs.readFileSync(abs, "utf8")); } catch (e) {
    if (fs.existsSync(abs)) return { review: 0, improvements: 0, answers: 0, learned: [], error: `Hand-off file is not valid JSON: ${String(e.message).slice(0, 120)}` };
    return { review: 0, improvements: 0, answers: 0, learned: [] };
  }
  const at = store.nowIso();
  const counts = { review: 0, improvements: 0, answers: 0, learned: [] };

  const reviews = (Array.isArray(raw.review) ? raw.review : []).slice(0, 20).map(r => {
    const file = str(r?.file, 200).replace(/\\/g, "/");
    if (!/^knowledge\/[^/]+\.md$/.test(file) || !str(r?.proposed)) return null;
    const current = str(r?.current, 8000);
    let found = false;
    try { found = !!current && fs.readFileSync(store.repoPath(file), "utf8").replace(/\r\n/g, "\n").includes(current.replace(/\r\n/g, "\n")); } catch { /* new file */ }
    return {
      id: store.newSageId("rev"), at, key: job.key, file, current, proposed: str(r.proposed, 8000),
      why: str(r?.why, 600), sources: (Array.isArray(r?.sources) ? r.sources : []).map(x => str(x, 300)).filter(Boolean).slice(0, 8),
      state: "pending", jobId: job.id, currentFound: found,
    };
  }).filter(Boolean);
  if (reviews.length) {
    store.updateSageList("review", list => {
      for (const r of reviews) {
        if (list.some(x => x.state === "pending" && x.file === r.file && normText(x.proposed) === normText(r.proposed))) continue;
        list.push(r); counts.review++;
      }
    });
  }

  const imps = (Array.isArray(raw.improvements) ? raw.improvements : []).slice(0, 20).map(i => {
    const observation = str(i?.observation, 1500), suggestion = str(i?.suggestion, 1000);
    if (!observation || !suggestion) return null;
    return { id: store.newSageId("imp"), at, key: job.key, area: AREAS.has(i?.area) ? i.area : "process", observation, suggestion, state: "open", jobId: job.id };
  }).filter(Boolean);
  if (imps.length) {
    store.updateSageList("improvements", list => {
      for (const i of imps) {
        if (list.some(x => x.state === "open" && normText(x.suggestion) === normText(i.suggestion))) continue;
        list.push(i); counts.improvements++;
      }
    });
  }

  const answers = (Array.isArray(raw.answers) ? raw.answers : []).slice(0, 30).map(a => {
    const question = str(a?.question, 1500), answer = str(a?.answer, 3000);
    let scope = str(a?.scope, 80);
    if (scope.startsWith("ticket:")) scope = `ticket:${scope.slice(7).trim().toUpperCase()}`;
    if (!question || !answer || !SCOPE_RE.test(scope)) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(str(a?.date, 10)) ? str(a.date, 10) : at.slice(0, 10);
    return {
      id: store.newSageId("ans"), question, questionNorm: normQuestion(question), answer, scope,
      askedBy: ASKERS.has(a?.askedBy) ? a.askedBy : "elf", ticket: job.key, date, source: str(a?.source, 300),
      state: "active", addedAt: at, uses: 0,
    };
  }).filter(Boolean);
  if (answers.length) {
    store.updateSageList("answers", list => {
      for (const a of answers) {
        if (list.some(x => x.state === "active" && x.scope === a.scope && x.questionNorm === a.questionNorm && normText(x.answer) === normText(a.answer))) continue;
        list.push(a); counts.answers++;
      }
    });
  }

  counts.learned = (Array.isArray(raw.learned) ? raw.learned : []).slice(0, 30)
    .map(l => ({ file: str(l?.file, 200), what: str(l?.what, 400) })).filter(l => l.what);
  try { fs.unlinkSync(abs); } catch { /* keep going */ }
  return counts;
}

/** Common after-step: merge the hand-off file, diff knowledge/, write the learnings line. */
export function finishSageJob(ctx, { ok, text }, type) {
  const { store, job } = ctx;
  const merged = mergeSageOut({ store, job });
  const files = ctx.state.before ? diffKnowledge(store.ROOT, ctx.state.before) : [];
  const destructive = files.filter(f => f.linesRemoved > 0);
  const summary = [
    ...merged.learned.map(l => `${l.file ? `${l.file}: ` : ""}${l.what}`),
    ...(merged.learned.length ? [] : [String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 600)]),
  ].join("\n");
  const rec = store.appendLearning({
    // A system sage:apply (no pipeline ticket) logs under the review item's own key.
    key: ctx.state.learnKey ?? job.key, type, jobId: job.id, summary, files,
    review: merged.review, improvements: merged.improvements, answers: merged.answers,
    ...(ok ? {} : { warning: "The job did not finish cleanly" }),
    ...(destructive.length ? { warning: `Changed or removed existing lines in ${destructive.map(f => `${f.path} (${f.linesRemoved})`).join(", ")}: check the diff` } : {}),
  });
  if (merged.error) store.appendChat(job.key, "sage", { from: "system", text: merged.error, jobId: job.id });
  if (destructive.length) {
    store.appendChat(job.key, "sage", { from: "system", jobId: job.id, text: `Note: this job changed existing lines (not only added): ${destructive.map(f => `${f.path} (${f.linesRemoved} line(s))`).join(", ")}. Check the diff.` });
  }
  return { merged, files, rec };
}

