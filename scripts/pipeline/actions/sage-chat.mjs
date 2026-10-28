// sage:chat — Faizuddin talks to the Sage (2026-10-27). The Sage answers from
// the knowledge base and its learnings, and may apply small knowledge fixes he
// asks for (his message is the source). Bigger or contradicting changes still
// go to the review queue unless he clearly told it to change that fact.
// README §8.

import { header, joinPrompt, STYLE_RULES, incomingMessage } from "../prompts-common.mjs";
import { sageTools } from "./_tools.mjs";
import { KNOWLEDGE_RULES, ANSWER_RULES, handoffRules, snapshotKnowledge, finishSageJob } from "./_sage-common.mjs";

const today = () => new Date().toLocaleDateString("en-CA");

const action = {
  tools: sageTools(),

  async prepare(ctx) {
    const { ticket, input, store, job } = ctx;
    const text = String(input?.text ?? "").trim();
    if (!text) return { skip: "No message text" };
    ctx.state.before = snapshotKnowledge(store.ROOT);
    const task = `${incomingMessage(input)}

What you hold: knowledge/ (index knowledge/README.md), data/pipeline/learnings.jsonl (what you learned before), data/pipeline/knowledge-review.json (changes waiting for his OK), data/pipeline/improvements.json (pipeline ideas), data/pipeline/answers.json (his earlier answers).
1. A question: answer from those files, quoting verbatim with file + section. Say plainly when the knowledge base has nothing on it.
2. He asks you to add or fix knowledge: make that small, precise change now, tagged "[Faizuddin, dashboard chat to Sage, ${today()}]". If he clearly tells you to change an existing fact, you may change it (quote the old text in your reply); if it is unclear, put it in "review" in the hand-off file instead.
3. He gives an answer or a rule the characters should remember: add it to "answers" in the hand-off file (scope conservatively), and to knowledge/ when it is durable and general.
4. He says a pending change or idea is wrong / done: say that he can Approve / Reject / mark it on the Learnings page (/pipeline/learnings); you do not change those lists yourself.
Your final message: short, numbered: the answer, or what you changed (file + section).`;
    return { prompt: joinPrompt(header("sage", ticket, task), STYLE_RULES, KNOWLEDGE_RULES, ANSWER_RULES, handoffRules(job.id)) };
  },

  async finish(ctx, result) {
    finishSageJob(ctx, result, "chat");
  },
};

export default action;
