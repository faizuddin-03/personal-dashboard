// sage:apply — applies knowledge changes Faizuddin approved on the Learnings
// page (POST /api/pipeline/learnings {type:"review", decision:"approve"}).
// Each change is applied exactly, tagged "[approved by Faizuddin, <date>]".
// README §8.3.
//
// input { reviewIds: string[], reviewKeys: { [reviewId]: key } } — a batch
// (sage-batch-apply, night of 2026-10-27): approvals that arrive while the job
// is still queued join it (store.queueApply), up to store.APPLY_BATCH_MAX.
// Older jobs carry { reviewId, reviewKey? } (one change); both are read.
// Every change is still checked word for word before and after, and logged
// with its own learnings.jsonl line.
// A change keyed to a ticket that is not on the pipeline board (studying-only,
// "KNOWLEDGE-AUDIT") runs as a system job under store.SYSTEM_KEY; no ticket is
// created for it.

import fs from "node:fs";
import { header, joinPrompt, STYLE_RULES } from "../prompts-common.mjs";
import { sageTools } from "./_tools.mjs";
import { KNOWLEDGE_RULES, snapshotKnowledge, diffKnowledge, mergeSageOut } from "./_sage-common.mjs";

const today = () => new Date().toLocaleDateString("en-CA");
const norm = s => String(s ?? "").replace(/\r\n/g, "\n");
/** How many times `part` occurs in `text` (non-overlapping). */
const count = (text, part) => (part ? text.split(part).length - 1 : 0);
const oneLine = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
/** Minutes allowed for a batch of n changes (one change keeps the runner's 20 min default). */
export const batchTimeoutMs = n => (n > 1 ? Math.min(60, 10 + 5 * n) * 60 * 1000 : undefined);

/** One change, as the prompt lists it. */
function changeBlock(item, i, n) {
  return `${n > 1 ? `### Change ${i + 1} of ${n} (${item.id}, ${item.key})\n` : ""}File: ${item.file}
Current text (verbatim)${item.currentFound === false ? " — NOTE: it was not found verbatim when proposed; find the matching passage, and if you cannot find it, change nothing and say so" : ""}:
"""
${item.current || "(none: this is an addition)"}
"""
Proposed text:
"""
${item.proposed}
"""
Why: ${item.why}
Sources: ${(item.sources ?? []).join("; ") || "(none given)"}${item.note ? `\nHis note: "${item.note}"` : ""}`;
}

const action = {
  tools: sageTools(),

  async prepare(ctx) {
    const { ticket, store, input, job } = ctx;
    const ids = store.applyIds(input);
    const keys = input?.reviewKeys ?? (input?.reviewKey && input?.reviewId ? { [input.reviewId]: input.reviewKey } : {});
    if (!ids.length) return { skip: "No knowledge change to apply" };
    const list = store.readSageList("review");
    const ready = [], skipped = [], failed = [];
    for (const id of ids) {
      const item = list.find(r => r.id === id);
      if (!item) { skipped.push(`No knowledge change ${id}`); continue; }
      if (item.state !== "approved") { skipped.push(`${id} is "${item.state}", not approved`); continue; }
      // Approved again into another job since this one was queued: that job applies it.
      if (item.jobId && item.jobId !== job.id) { skipped.push(`${id} belongs to job ${item.jobId}`); continue; }
      // System job (no pipeline ticket, README §8.3): the item must be the one it was queued for.
      if (ticket.system && keys[id] && keys[id] !== item.key) { failed.push({ item, why: `it belongs to ${item.key}, not ${keys[id]}` }); continue; }
      if (!ticket.system && item.key !== job.key) { failed.push({ item, why: `it belongs to ${item.key}, not ${job.key}` }); continue; }
      // The current text must still be in the file word for word (unless the
      // Sage already said it was not found when proposing). A file edited since
      // the proposal is not guessed at: the change goes back as "error".
      let currentCount = 0;
      if (item.current && item.currentFound !== false) {
        let text = null;
        try { text = norm(fs.readFileSync(store.repoPath(item.file), "utf8")); } catch { /* missing */ }
        if (text === null || !text.includes(norm(item.current))) {
          failed.push({ item, why: text === null ? `${item.file} does not exist` : `the current text is no longer in ${item.file} word for word` });
          continue;
        }
        currentCount = count(text, norm(item.current));
      }
      ready.push({ item, currentCount });
    }

    if (failed.length && !ctx.dry) {
      const byId = new Map(failed.map(f => [f.item.id, f.why]));
      store.updateSageList("review", l => l.map(r => (!byId.has(r.id) ? r
        : { ...r, state: "error", note: `Not applied: ${byId.get(r.id)}. Ask the Sage to propose it again.`, jobId: job.id })));
      for (const f of failed) {
        store.appendLearning({ key: f.item.key, type: "apply", jobId: job.id, summary: `Not applied (${f.item.id}): ${f.why}`, files: [] });
      }
    }
    if (!ready.length) {
      return { skip: `Not applied: ${[...failed.map(f => `${f.item.id}: ${f.why}`), ...skipped].join("; ") || "nothing to apply"}` };
    }

    ctx.state.items = ready;
    ctx.state.learnKey = ready[0].item.key;
    ctx.state.before = snapshotKnowledge(store.ROOT);
    const n = ready.length;
    const itemKeys = [...new Set(ready.map(r => r.item.key))];
    // For the prompt header: the items' own key, not the system holder.
    const forPrompt = ticket.system
      ? { key: itemKeys.length === 1 ? itemKeys[0] : store.SYSTEM_KEY, title: `${itemKeys.join(", ")} (not on the pipeline board)`, files: {} }
      : ticket;
    const task = n === 1
      ? `Faizuddin approved this knowledge change on the Learnings page${ready[0].item.note ? ` with the note: "${ready[0].item.note}"` : ""}. Apply it exactly.

${changeBlock(ready[0].item, 0, 1)}

Steps:
1. Read ${ready[0].item.file}. Replace the current text with the proposed text using one Edit (or append the proposed text to the right section when there is no current text). Change nothing else in the file; keep its line endings and layout.
2. Add the tag "[approved by Faizuddin, ${today()}]" to the changed text, next to its other provenance tags.
3. If the proposed text needs ${ready[0].item.file} to be created, create it following knowledge/flows.md and add it to the knowledge/README.md index.
4. Write no other file. Your final message: one or two numbered lines saying what changed (file + section), or why you could not apply it.`
      : `Faizuddin approved these ${n} knowledge changes on the Learnings page. Apply each one exactly, in order. They are separate changes: apply every one you can, even if another cannot be applied.

${ready.map((r, i) => changeBlock(r.item, i, n)).join("\n\n")}

Steps, for each change in turn:
1. Read its file (again, if an earlier change edited it). Replace the current text with the proposed text using one Edit (or append the proposed text to the right section when there is no current text). Change nothing else in the file; keep its line endings and layout.
2. Add the tag "[approved by Faizuddin, ${today()}]" to the changed text, next to its other provenance tags.
3. If the proposed text needs its file to be created, create it following knowledge/flows.md and add it to the knowledge/README.md index.
4. If you cannot find the current text, change nothing for that change and go on to the next.
Write no other file. Your final message: one numbered line per change, in the order above, starting with its id, saying what changed (file + section) or why you could not apply it.`;
    return {
      prompt: joinPrompt(header("sage", forPrompt, task), STYLE_RULES, KNOWLEDGE_RULES),
      ...(batchTimeoutMs(n) ? { timeoutMs: batchTimeoutMs(n) } : {}),
    };
  },

  async finish(ctx, result) {
    const { store, job } = ctx;
    const ready = ctx.state.items ?? [];
    if (!ready.length) return;
    const merged = mergeSageOut({ store, job });
    const files = ctx.state.before ? diffKnowledge(store.ROOT, ctx.state.before) : [];
    const n = ready.length;
    const reply = oneLine(result.text, 600);
    // The model's line for this change in a batch reply ("1. rev-… …"), else the whole reply.
    const lineFor = (item, i) => {
      if (n === 1) return reply;
      const ls = String(result.text ?? "").split("\n").map(l => l.trim()).filter(Boolean);
      return oneLine(ls.find(l => l.includes(item.id)) ?? ls.find(l => l.startsWith(`${i + 1}.`)) ?? "", 300);
    };

    const outcome = new Map();
    for (const [i, { item, currentCount }] of ready.entries()) {
      let applied = false;
      try {
        const text = norm(fs.readFileSync(store.repoPath(item.file), "utf8"));
        const first = norm(item.proposed).split("\n").map(l => l.trim()).find(l => l.length > 12) ?? norm(item.proposed).trim();
        applied = files.some(f => f.path === item.file) && text.includes(first.slice(0, 80));
        // A replacement must have removed the old text (unless the new text contains it).
        // (Counted, so the same words elsewhere in the file do not fail it.)
        if (applied && currentCount && !norm(item.proposed).includes(norm(item.current))) {
          applied = count(text, norm(item.current)) < currentCount;
        }
      } catch { /* file missing */ }
      // The file is the evidence: a change found in it word for word counts as
      // applied even when the job itself ended badly (e.g. timed out after it).
      outcome.set(item.id, { applied, line: lineFor(item, i) });
    }

    store.updateSageList("review", list => list.map(r => {
      const o = outcome.get(r.id);
      if (!o || r.state !== "approved") return r;
      return o.applied
        ? { ...r, state: "applied", appliedAt: store.nowIso(), jobId: job.id }
        : { ...r, state: "error", jobId: job.id,
            note: `Not applied: ${(result.ok ? o.line : `${result.text ? `${o.line} ` : ""}(the Sage job did not finish cleanly)`).trim() || "no change found in the file"}. Approve again to retry.` };
    }));

    // One learnings.jsonl line per change (keyed to the change's own key).
    for (const [i, { item }] of ready.entries()) {
      const o = outcome.get(item.id);
      const own = files.filter(f => f.path === item.file);
      const destructive = own.filter(f => f.linesRemoved > 0);
      const shared = ready.filter(r => r.item.file === item.file).length;
      store.appendLearning({
        key: item.key, type: "apply", jobId: job.id,
        summary: [
          o.applied ? `Applied ${item.id} to ${item.file}` : `Not applied (${item.id}): ${o.line || "no change found in the file"}`,
          ...(n > 1 ? [`Batch of ${n}${shared > 1 ? `; ${shared} changes in this job edited ${item.file}, so its line counts cover all of them` : ""}`] : []),
          ...(o.applied && o.line ? [o.line] : []),
        ].join("\n"),
        files: own,
        ...(i === 0 ? { review: merged.review, improvements: merged.improvements, answers: merged.answers } : {}),
        ...(result.ok ? {} : { warning: "The job did not finish cleanly" }),
        ...(destructive.length ? { warning: `Changed or removed existing lines in ${destructive.map(f => `${f.path} (${f.linesRemoved})`).join(", ")}: check the diff` } : {}),
      });
    }
    if (merged.error) store.appendChat(job.key, "sage", { from: "system", text: merged.error, jobId: job.id });
    const other = files.filter(f => !ready.some(r => r.item.file === f.path));
    if (other.length) {
      store.appendChat(job.key, "sage", { from: "system", jobId: job.id, text: `Note: this job also changed files no approved change named: ${other.map(f => f.path).join(", ")}. Check the diff.` });
    }
  },
};

export default action;
