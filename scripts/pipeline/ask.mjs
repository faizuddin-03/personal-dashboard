// Ask-each-other protocol (Faizuddin, 2026-10-27: "make sure all those agents
// can get the files they needed, even if they need to ask each other. like
// the elf requesting srd from scout").
//
// A character ends its final message with ```ask blocks (prompts-common.mjs
// ASK_RULES). run-character.mjs then calls:
//   1. handleAsks()  — after any job: queue "<to>:help" per block (max 3),
//                      with a depth limit and a one-hour repeat guard.
//   2. relayAnswer() — after a "<helper>:help" job: queue the asker's
//                      continuation ("<asker>:chat", or "<asker>:help" when the
//                      asker was itself answering someone) with the answer.
//   3. helpFailed()  — a help job errored or was stopped: tell the asker.
// Faizuddin is only pulled in ("waiting") when a helper fails or the asker
// also has "## Questions for Faizuddin".

import { NAMES, parseAsks, stripAsks, hasQuestions, firstQuestion } from "./prompts-common.mjs";

export const MAX_ASKS = 3;
export const MAX_DEPTH = 3;
const REPEAT_MS = 60 * 60 * 1000;

const norm = q => String(q ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isHelp = action => /:help$/.test(String(action ?? ""));
const short = (s, n = 160) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

/** Same question to the same character for this ticket within the last hour? */
function askedRecently(store, key, to, question) {
  const want = norm(question);
  const since = Date.now() - REPEAT_MS;
  return store.listJobs({ key }).find(j => j.action === `${to}:help`
    && Date.parse(j.startedAt) >= since
    && norm(j.input?.question) === want) ?? null;
}

/**
 * Chat text to show for a finished job: its ask blocks stripped (a short line
 * instead). Returns { text, asks, invalid }.
 */
export function splitFinalText(text, character) {
  const { asks, invalid } = parseAsks(text, character);
  if (!asks.length && !invalid.length) return { text, asks, invalid };
  return { text: stripAsks(text), asks, invalid };
}

/**
 * Queues "<to>:help" jobs for the ask blocks of a finished job. Writes the
 * system chat notes and the asker's character state. Returns
 * { queued: StoredJob[], refused: {to, question, reason}[] }.
 */
export function handleAsks({ store, job, asks, invalid = [], finalText = "" }) {
  const key = job.key, asker = job.character;
  const depth = Number(job.input?.depth ?? 0) || 0;
  const queued = [], refused = [];
  for (const bad of invalid) refused.push({ to: "?", question: short(bad.raw, 120), reason: bad.reason });
  asks.forEach((a, i) => {
    if (i >= MAX_ASKS) { refused.push({ ...a, reason: `only ${MAX_ASKS} questions per reply` }); return; }
    if (depth + 1 > MAX_DEPTH) { refused.push({ ...a, reason: `too many hand-offs in a row (limit ${MAX_DEPTH})` }); return; }
    const dup = askedRecently(store, key, a.to, a.question);
    if (dup) { refused.push({ ...a, reason: `the same question was asked of ${NAMES[a.to]} within the last hour (job ${dup.id})` }); return; }
    const h = store.queueJob({ key, action: `${a.to}:help`, input: { from: asker, question: a.question, askJobId: job.id, depth: depth + 1 } });
    queued.push(h);
    store.appendChat(key, asker, { from: "system", text: `Asked ${NAMES[a.to]}: ${a.question}`, jobId: job.id, via: a.to });
  });
  for (const r of refused) {
    store.appendChat(key, asker, { from: "system", text: `Did not ask ${NAMES[r.to] ?? "another character"}: ${r.reason}.\n\nQuestion: ${r.question}`, jobId: job.id });
  }
  if (!queued.length && !refused.length) return { queued, refused };

  const names = [...new Set(queued.map(h => NAMES[h.character]))];
  store.updateTicket(key, t => {
    const cur = t.characters[asker] ?? { state: "idle" };
    if (hasQuestions(finalText)) {
      // His questions win: Faizuddin is needed anyway.
      const q = firstQuestion(finalText);
      t.characters[asker] = { ...cur, state: "waiting", note: names.length ? `${q ?? "Has a question for you"} (also asked ${names.join(" and ")})` : q };
    } else if (names.length) {
      t.characters[asker] = { ...cur, state: "working", note: `Waiting for ${names.join(" and ")}'s answer` };
    } else {
      t.characters[asker] = { ...cur, state: "waiting", note: `Could not ask for help: ${refused[0].reason}` };
    }
    if (names.length) t.events = [{ at: store.nowIso(), text: `${NAMES[asker]} asked ${names.join(" and ")} for help` }, ...(t.events ?? [])].slice(0, 100);
  });
  return { queued, refused };
}

/**
 * After a successful "<helper>:help" job with no further asks: hand the
 * answer back to the asker. Returns the continuation job, or null.
 */
export function relayAnswer({ store, job, answer }) {
  const input = job.input ?? {};
  const asker = input.from;
  // relay:false = a one-off check queued by hand: answer in the helper's chat only.
  if (!NAMES[asker] || input.relay === false) return null;
  const helper = job.character;
  const text = stripAsks(answer).slice(0, 12000) || "(No answer text.)";
  const askerJob = input.askJobId ? store.readJob(input.askJobId) : null;
  store.appendChat(job.key, asker, { from: "system", text: `**${NAMES[helper]} answered** your request "${short(input.question, 200)}":\n\n${text}`, jobId: job.id, via: helper });
  store.updateTicket(job.key, t => {
    const cur = t.characters[asker] ?? { state: "idle" };
    t.characters[asker] = { ...cur, state: "working", note: `Continuing with ${NAMES[helper]}'s answer` };
  });
  // The asker was itself answering someone: continue that answer, not a chat.
  if (askerJob && isHelp(askerJob.action)) {
    const prev = askerJob.input ?? {};
    return store.queueJob({
      key: job.key, action: `${asker}:help`,
      input: { ...prev, depth: input.depth, answers: [...(prev.answers ?? []), { from: helper, question: input.question, text }] },
    });
  }
  return store.queueJob({
    key: job.key, action: `${asker}:chat`,
    input: { text, from: helper, question: input.question, askJobId: input.askJobId, depth: input.depth },
  });
}

/** A help job failed or was stopped: tell the asker and pull Faizuddin in. */
export function helpFailed({ store, job, reason }) {
  const input = job.input ?? {};
  const asker = input.from;
  if (!NAMES[asker] || input.relay === false) return;
  const helper = job.character;
  try {
    store.appendChat(job.key, asker, { from: "system", text: `${NAMES[helper]} could not answer "${short(input.question, 200)}": ${short(reason, 300)}`, jobId: job.id, via: helper });
  } catch { /* ignore */ }
  store.updateTicket(job.key, t => {
    const cur = t.characters[asker] ?? { state: "idle" };
    t.characters[asker] = { ...cur, state: "waiting", note: `${NAMES[helper]} could not answer: ${short(reason, 120)}` };
  });
}
