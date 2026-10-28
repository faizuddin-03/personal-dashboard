// sage:learn — the Sage folds a ticket's pending pipeline events into the
// knowledge base (Faizuddin, 2026-10-27: "every time we do something in the
// pipeline ... an agent will always make sure to improve the knowledge and
// flow based on everything that we did").
//
// Queued by store.noteForSage() (one per ticket, debounced: it waits until
// nothing new happened for SAGE_QUIET_MS before starting). Reads the events in
// data/pipeline/sage-inbox/<KEY>.jsonl and the files they point at, then:
//   1. appends durable, non-contradicting facts to knowledge/ (tagged);
//   2. puts changes to existing facts in the review queue (via sage-out);
//   3. notes pipeline improvement ideas and Faizuddin's answers (via sage-out);
//   4. replies with a short summary in the Sage chat (the runner posts it).
// finish() merges the hand-off, logs learnings.jsonl, clears the processed
// events and re-queues itself only if new events came in meanwhile. README §8.

import { header, joinPrompt, STYLE_RULES, NAMES } from "../prompts-common.mjs";
import { sageTools } from "./_tools.mjs";
import { KNOWLEDGE_RULES, ANSWER_RULES, IMPROVEMENT_RULES, handoffRules, snapshotKnowledge, finishSageJob } from "./_sage-common.mjs";

const QUIET_MS = Number(process.env.PIPELINE_SAGE_QUIET_MS ?? 2 * 60 * 1000);
const MAX_WAIT_MS = 20 * 60 * 1000;          // a busy afternoon still gets learned within 20 min
const MAX_EVENTS = 60;
const CHAT_BUDGET = 60_000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHAR_ORDER = ["scout", "scribe", "elf", "dwarf"];

function eventLine(e, i) {
  const who = e.by === "faizuddin" ? "Faizuddin" : NAMES[e.character] ?? e.by ?? "";
  const bits = [
    `${i + 1}. [${e.at}] ${e.type}${e.action ? ` ${e.action}` : ""}${who ? ` (${who}${e.type === "chat" && e.character ? ` to ${NAMES[e.character]}` : ""})` : ""}`,
    e.jobId ? `job ${e.jobId}` : "",
    e.findingId ? `finding ${e.findingId}${e.ts ? ` (${e.ts})` : ""}${e.state ? ` -> ${e.state}` : ""}` : "",
    e.issueKey ? `QA-Issue ${e.issueKey}` : "",
    e.file ? `file ${e.file}` : "",
  ].filter(Boolean).join(" | ");
  const ans = e.answering?.length ? `\n   He was answering:\n${e.answering.map((q, j) => `     ${j + 1}) ${q}`).join("\n")}` : "";
  const text = e.text ? `\n   """\n   ${String(e.text).replace(/\n/g, "\n   ")}\n   """` : "";
  return `${bits}${ans}${text}`;
}

/** Chat entries since `since` for the characters involved, newest budget-limited. */
function chatExcerpts(store, key, characters, since) {
  const out = [];
  let used = 0;
  for (const c of characters) {
    const entries = store.readChat(key, c).filter(e => !since || String(e.at) >= since);
    if (!entries.length) continue;
    const lines = [];
    for (const e of entries) {
      const who = e.from === "faizuddin" ? "FAIZUDDIN" : e.from === "system" ? "system" : NAMES[e.from] ?? e.from;
      const t = String(e.text ?? "");
      const body = e.from === "faizuddin" ? t.slice(0, 4000) : t.slice(0, 2500) + (t.length > 2500 ? " …(cut; full text in the chat file)" : "");
      const line = `[${e.at}] ${who}: ${body}`;
      if (used + line.length > CHAT_BUDGET) { lines.push("…(more in the chat file)"); break; }
      used += line.length;
      lines.push(line);
    }
    out.push(`### Chat with ${NAMES[c]} (data/pipeline/chats/${key}/${c}.jsonl)\n${lines.join("\n\n")}`);
  }
  return out.join("\n\n");
}

const action = {
  tools: sageTools(),

  /** Debounce: start only after the inbox has been quiet for QUIET_MS (runs before the lock). */
  async waitUntilReady({ job, store, stopped, activity }) {
    const start = Date.now();
    for (;;) {
      if (stopped()) return;
      const ev = store.readSageInbox(job.key);
      const last = ev.length ? Date.parse(ev[ev.length - 1].at) || 0 : 0;
      const quiet = Date.now() - last;
      if (quiet >= QUIET_MS || Date.now() - start > MAX_WAIT_MS) return;
      activity(`Waiting for the work to settle (starts ${Math.round(QUIET_MS / 60000)} min after the last event)`);
      await sleep(Math.min(QUIET_MS - quiet + 200, 15_000));
    }
  },

  async prepare(ctx) {
    const { ticket, store, job } = ctx;
    const events = store.readSageInbox(job.key).slice(0, MAX_EVENTS);
    if (!events.length) return { skip: "Nothing new to learn for this ticket" };
    ctx.state.eventIds = events.map(e => e.id);
    ctx.state.before = snapshotKnowledge(store.ROOT);

    const involved = new Set(events.map(e => e.character).filter(c => CHAR_ORDER.includes(c)));
    if (events.some(e => e.type === "study" || e.type === "approve")) CHAR_ORDER.forEach(c => involved.add(c));
    const since = events[0].since ?? new Date(Date.parse(events[0].at) - 60_000).toISOString();
    const chats = chatExcerpts(store, job.key, CHAR_ORDER.filter(c => involved.has(c)), since);
    const k = job.key;
    const findings = [...new Set(events.map(e => e.findingId).filter(Boolean))]
      .map(id => `data/pipeline/findings/${k}/${id}/finding.json`);
    const pendingHere = store.readSageList("review").filter(r => r.key === k && r.state === "pending").length;

    const task = `Learn from what just happened on this ticket and keep the knowledge base up to date.

## What happened (pending events, oldest first)
${events.map(eventLine).join("\n")}

## Chat since then${since ? ` (from ${since})` : ""}
${chats || "(no chat entries in that window)"}

## Files to read
1. The ticket's files listed above (study and its "## Knowledge candidates" section, related history, scenarios.md, Jira capture, SRD text copies) — read what the events touch.
${findings.length ? findings.map((f, i) => `${i + 2}. Finding: ${f}`).join("\n") + "\n" : ""}${findings.length + 2}. knowledge/README.md (index + provenance rules), knowledge/flows.md (how to write a flow file), and the knowledge/*.md / flow-*.md files for this ticket's module (find them from the index; Grep for the module and ticket key).
${findings.length + 3}. data/pipeline/answers.json (Faizuddin's earlier answers), data/pipeline/improvements.json (ideas already open), data/pipeline/knowledge-review.json (${pendingHere} change(s) for this ticket already waiting for his OK — do not propose them again).

## Do this
1. **Apply**: add durable facts that do not change any existing fact to knowledge/ (rules below). Capture module flow details into knowledge/flow-<module>.md.
2. **Review**: anything that changes or contradicts an existing fact goes to "review" in the hand-off file, NOT into knowledge/.
3. **Answers**: record each answer Faizuddin gave to a character's question (rules below).
4. **Ideas**: note pipeline improvement ideas (rules below).
5. Write the hand-off file.
6. If nothing durable was learned, change nothing and say so — that is a fine result.

## Your final message (posted in your chat; short, numbered, plain words)
**Learned:** what you added, where (file + section).
**Waiting for your OK:** each proposed change in a few words.
**Ideas:** each improvement idea in a few words.
**Answers remembered:** each question + scope.
Leave out a heading when it has nothing. Do not ask other characters anything; do not ask Faizuddin anything unless a fact truly cannot be placed without him.`;

    return {
      prompt: joinPrompt(header("sage", ticket, task), STYLE_RULES, KNOWLEDGE_RULES, ANSWER_RULES, IMPROVEMENT_RULES, handoffRules(job.id)),
    };
  },

  async finish(ctx, result) {
    const { store, job } = ctx;
    finishSageJob(ctx, result, "learn");
    if (!result.ok) return;               // events stay; the next event re-queues a learn
    const left = store.clearSageInbox(job.key, ctx.state.eventIds ?? []);
    store.updateTicket(job.key, t => {
      t.events = [{ at: store.nowIso(), text: `Sage learned from ${ctx.state.eventIds?.length ?? 0} event(s)` }, ...(t.events ?? [])].slice(0, 100);
    });
    if (left > 0) store.queueSage(job.key, { exceptJobId: job.id });
  },
};

export default action;
