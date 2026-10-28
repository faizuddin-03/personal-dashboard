// sage:help — the Sage answers another character's question (ask-each-other,
// 2026-10-27): "what do we know about X" from the knowledge base, past
// learnings and Faizuddin's earlier answers. Read only.

import { makeHelpAction } from "./_help-common.mjs";
import { sageReadTools } from "./_tools.mjs";

export default makeHelpAction({
  character: "sage",
  tools: sageReadTools(),
  scope: () => `You know: the knowledge base knowledge/ (start at knowledge/README.md, flows in knowledge/flow-*.md), data/pipeline/answers.json (Faizuddin's earlier answers; use only "active" entries whose scope is "global", this ticket, or this ticket's module), data/pipeline/learnings.jsonl (what was learned before), and data/pipeline/knowledge-review.json (changes NOT yet approved: if you use one, say it is waiting for his OK).
Answer what the knowledge base says, quoting it verbatim with file + section and its provenance tag ([unconfirmed] stays [unconfirmed]). If an earlier answer of his covers the question, give it as "[answered by Faizuddin on <date>]". If the knowledge base has nothing, say so plainly. Write nothing.`,
});
