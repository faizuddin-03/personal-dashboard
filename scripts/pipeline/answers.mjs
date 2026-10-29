// Answer registry (Faizuddin, 2026-10-27: "one of the things i want to avoid
// is the agents asking me the same question over and over again").
//
// data/pipeline/answers.json holds SavedAnswer[]: a question a character asked
// him, his exact answer, and its scope ("global" | "ticket:<KEY>" |
// "module:<name>"). The Sage adds entries (sage:learn / sage:chat); every
// prompt tells the characters to check it before asking (prompts-common.mjs
// ASK_RULES); and run-character.mjs calls autoAnswer() as a safety net when a
// job still ends with "## Questions for Faizuddin". README §8.4.

import { NAMES, hasQuestions } from "./prompts-common.mjs";

/** Similarity at or above this (and at least MIN_SHARED shared words) answers the question from the registry. */
export const MATCH_AT = 0.6;
export const MIN_SHARED = 3;
/** Close but not matched: reaches Faizuddin, and the Sage notes an improvement idea. */
export const NEAR_AT = 0.45;

const STOP = new Set(("a an the and or but if then so to of in on at by for with from as is are was were be been being do does did " +
  "can could should would will shall may might must i you he she it we they me him us them my your our their this that these those " +
  "what which who whom whose when where why how there here any some all each every no not yes please also just only very " +
  "faizuddin him his tell let know want need use using").split(/\s+/));

/** Normalised word list of a question (lower case, markdown and punctuation gone, stop words out, plural "s" off). */
export function normQuestion(q) {
  return String(q ?? "")
    // Answer options ("... ? (a) A — ... (b) B", ASK_RULES 8) are not the question: drop them so matching sees the question only.
    .replace(/\s\(a\)\s[\s\S]*$/i, "")
    .toLowerCase()
    .replace(/cron\s*-?\s*jobs?/g, "cron job")
    .replace(/[*_`"'“”‘’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(w => w && !STOP.has(w))
    .map(w => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w))
    .join(" ");
}

/** Number of shared words of two normalised questions. */
export function sharedWords(a, b) {
  const B = new Set(String(b).split(" ").filter(Boolean));
  return new Set(String(a).split(" ").filter(w => w && B.has(w))).size;
}

/** Dice similarity of two normalised questions (0..1). */
export function similarity(a, b) {
  const A = new Set(String(a).split(" ").filter(Boolean));
  const B = new Set(String(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  return (2 * sharedWords(a, b)) / (A.size + B.size);
}

/** The numbered questions under "## Questions for Faizuddin" (continuation lines joined). */
export function extractQuestions(text) {
  const part = String(text ?? "").split(/^#{1,4}\s*Questions for Faizuddin.*$/im)[1];
  if (!part) return [];
  const out = [];
  for (const raw of part.split("\n")) {
    const line = raw.trim();
    if (/^#{1,4}\s/.test(line)) break;            // next section
    const m = line.match(/^\d+[.)]\s+(.*)$/);
    if (m) out.push(m[1].trim());
    else if (line && out.length) out[out.length - 1] += ` ${line}`;
  }
  return out.map(q => q.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 10);
}

/** Does an answer's scope apply to this ticket? */
export function scopeApplies(scope, ticket) {
  const s = String(scope ?? "");
  if (s === "global") return true;
  if (s.startsWith("ticket:")) return s.slice(7).trim().toUpperCase() === String(ticket?.key ?? "").toUpperCase();
  if (s.startsWith("module:")) {
    const name = s.slice(7).trim().toLowerCase();
    return !!name && String(ticket?.title ?? "").toLowerCase().includes(name);
  }
  return false;
}

/** Best active answer for a question on this ticket: { entry, score, shared, match } or null. */
export function bestAnswer(question, ticket, answers) {
  const qn = normQuestion(question);
  let best = null;
  for (const a of answers ?? []) {
    if (a?.state !== "active" || !scopeApplies(a.scope, ticket) || isDeferral(a.answer)) continue; // round 17: "later" is not an answer
    const an = normQuestion(a.question);   // re-normalised, so rule changes apply to old entries
    const score = similarity(qn, an), shared = sharedWords(qn, an);
    // Round 32: a short question asked again word for word (after stop words) also matches.
    const same = qn === an && qn.split(" ").length >= 2;
    if (!best || score > best.score) best = { entry: a, score, shared, match: (score >= MATCH_AT && shared >= MIN_SHARED) || same };
  }
  return best;
}

// ── Deferrals (night round 17, scripts/pipeline/lib/deferred-questions.mjs) ──
// "i will give you this later. dwarf can ask me again later" parks a question;
// it is not an answer. Stored as one, it would "answer" Dwarf's later question
// with "later" and Dwarf would never ask. "deferred — real, parked on purpose"
// [charmain-repo: test-scenarios/questions.yaml:16-21].

/** Phrases that park a question rather than answer it. */
export const DEFER_RE = /\b(later|ignore (it |this |that )?(first|for now)|not now|will come back|come back to (this|it)|park (it|this))\b/i;
const DEFER_STRIP = [
  /\b(i will|i'll|will|we will|we'll)\s+(give|answer|get|come back|send|share|update|tell)\b[^.\n]*?\blater\b/gi,
  /\b(can |could )?(ask|remind) me (this |it |again )*later\b[^.\n]*/gi,
  /\bignore (it |this |that )?(first|for now)\b/gi,
  /\bcome back to (this|it)( later)?\b/gi,
  /\blater\b/gi,
];
const DEFER_FILLER = new Set(["dwarf", "elf", "scout", "scribe", "sage", "again", "need", "ask", "give", "answer", "come", "back", "get", "first", "ignore", "now", "this", "that", "one", "can", "will", "when", "he", "ok", "okay", "yes"]);

/** True when a reply only defers (no fact or decision in it): "i will give you this later", "2. ignore first. i will come back to this later". */
export function isDeferral(text) {
  const t = String(text ?? "").replace(/^\s*\d+[.)]\s*/gm, " ");
  if (!DEFER_RE.test(t)) return false;
  let rest = t;
  for (const re of DEFER_STRIP) rest = rest.replace(re, " ");
  const words = normQuestion(rest).split(" ").filter(w => w && !DEFER_FILLER.has(w));
  return words.length <= 2;
}

/** Best active answer for a question in ANY scope (round 16), a full match only, or null. */
export function bestAnswerAnyScope(question, answers, skipId) {
  const qn = normQuestion(question);
  let best = null;
  for (const a of answers ?? []) {
    if (a?.state !== "active" || a.id === skipId || isDeferral(a.answer)) continue;
    const an = normQuestion(a.question);
    const score = similarity(qn, an), shared = sharedWords(qn, an);
    const same = qn === an && qn.split(" ").length >= 2;
    if (((score >= MATCH_AT && shared >= MIN_SHARED) || same) && (!best || score > best.score)) best = { entry: a, score, shared };
  }
  return best;
}

const short = (s, n) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

/**
 * Safety net after a job that ends with questions for Faizuddin. Questions he
 * already answered (same meaning, scope applies) are answered from the
 * registry: a system note in the character's chat, a learnings line, and the
 * character's continuation chat job with the earlier answers. Only the rest
 * reach him. Returns { answered, remaining, continued } — continued is the
 * queued job or null. Never for the Sage, help jobs, or a continuation the
 * Sage already started (no loops).
 */
export function autoAnswer({ store, job, text }) {
  const none = { answered: [], remaining: [], continued: null };
  if (!hasQuestions(text) || job.character === "sage" || /:help$/.test(job.action) || job.input?.from === "sage") return none;
  const questions = extractQuestions(text);
  if (!questions.length) return none;
  const ticket = store.readTicket(job.key);
  if (!ticket) return none;
  const answers = store.readSageList("answers");
  const answered = [], remaining = [];
  for (const q of questions) {
    const best = bestAnswer(q, ticket, answers);
    if (best?.match) answered.push({ question: q, entry: best.entry, score: best.score });
    else remaining.push({ question: q, near: best && best.score >= NEAR_AT && best.shared >= 2 ? best : null });
  }

  // Close but not matched: an improvement idea (deduplicated by question).
  const near = remaining.filter(r => r.near);
  if (near.length) {
    store.updateSageList("improvements", list => {
      for (const r of near) {
        const qn = normQuestion(r.question);
        if (list.some(i => i.state === "open" && i.questionNorm === qn)) continue;
        list.push({
          id: store.newSageId("imp"), at: store.nowIso(), key: job.key, area: "process", state: "open", jobId: job.id, questionNorm: qn,
          observation: `${NAMES[job.character]} asked Faizuddin "${short(r.question, 300)}" on ${job.key}. An earlier answer is close (similarity ${r.near.score.toFixed(2)}) but did not match: "${short(r.near.entry.question, 200)}" -> "${short(r.near.entry.answer, 200)}" (${r.near.entry.id}, scope ${r.near.entry.scope}).`,
          suggestion: "Check whether the earlier answer applies here. If it does, widen its scope or add this wording on the Learnings page so it matches next time; if not, nothing to do.",
        });
      }
    });
  }
  // Night round 16: the same question answered under ANOTHER ticket's (or
  // module's) scope. Not answered automatically (the scope may not apply), but
  // shown next to the question so he can reply "same as <ticket>" instead of
  // saying it all again. Real case: the cron question asked three times on
  // 2026-10-27 (improvements.json). "Never make the user say the same thing
  // twice" [charmain-repo: docs/replying.md:34].
  const hints = [];
  for (const r of remaining) {
    const other = bestAnswerAnyScope(r.question, answers, r.near?.entry?.id);
    if (other && !scopeApplies(other.entry.scope, ticket)) hints.push({ question: r.question, entry: other.entry });
  }
  if (hints.length) {
    store.appendChat(job.key, job.character, {
      from: "system", via: "sage", jobId: job.id,
      text: `Sage: Faizuddin answered similar question(s) on other tickets:\n${hints.map((h, i) => `${i + 1}. ${short(h.question, 200)}\n   Earlier (${h.entry.ticket ?? h.entry.scope}, ${h.entry.date}): "${short(h.entry.question, 200)}" -> "${short(h.entry.answer, 300)}"`).join("\n")}\n\nIf one applies here, reply "same as <ticket>" (the Sage can widen that answer's scope).`,
    });
  }

  if (!answered.length) return { answered, remaining: remaining.map(r => r.question), continued: null };

  const ids = new Set(answered.map(a => a.entry.id));
  store.updateSageList("answers", list => list.map(a => (ids.has(a.id) ? { ...a, uses: (a.uses ?? 0) + 1 } : a)));
  for (const a of answered) {
    store.appendChat(job.key, job.character, {
      from: "system", via: "sage", jobId: job.id,
      text: `Sage: you answered this on ${a.entry.date}: "${a.entry.answer}"\n\nQuestion: ${a.question}`,
    });
    store.appendLearning({
      key: job.key, type: "auto-answer", jobId: job.id, character: job.character,
      question: a.question, answerId: a.entry.id, answer: a.entry.answer, answeredOn: a.entry.date,
    });
  }
  const left = remaining.map(r => r.question);
  const reply = [
    "Faizuddin already answered these questions before (Sage's answer registry, data/pipeline/answers.json):",
    ...answered.map((a, i) => `${i + 1}. Question: ${a.question}\n   Answer: "${a.entry.answer}" [answered by Faizuddin on ${a.entry.date}]`),
    "",
    "Use these answers and cite them as [answered by Faizuddin on <date>]. Do not ask them again.",
    left.length
      ? `Still open for Faizuddin (keep only these under "## Questions for Faizuddin"):\n${left.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "Nothing is left to ask Faizuddin from your last reply.",
  ].join("\n");
  const continued = store.queueJob({ key: job.key, action: `${job.character}:chat`, input: { text: reply, from: "sage", question: "Questions for Faizuddin already answered", askJobId: job.id } });
  store.updateTicket(job.key, t => {
    const cur = t.characters?.[job.character] ?? { state: "idle" };
    t.characters[job.character] = { ...cur, state: "working", note: `Sage answered ${answered.length} question(s) from his earlier answers` };
    t.events = [{ at: store.nowIso(), text: `Sage answered ${answered.length} of ${NAMES[job.character]}'s questions from Faizuddin's earlier answers` }, ...(t.events ?? [])].slice(0, 100);
  });
  return { answered, remaining: left, continued };
}
