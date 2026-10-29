// Shared part of the "<character>:help" jobs (ask-each-other, 2026-10-27):
// one character answers another character's question. The answer goes back
// to the asker through scripts/pipeline/ask.mjs relayAnswer().

import { header, joinPrompt, STYLE_RULES, ASK_RULES, NAMES } from "../prompts-common.mjs";

/**
 * Builds a help action.
 *   scope(ctx) → plain text: what this character knows and may write here.
 *   tools      → tool set (same as that character's other jobs), or fn(ctx).
 *   rules      → extra rule blocks (e.g. TS_RULES) for the prompt.
 */
export function makeHelpAction({ character, tools, scope, rules = [] }) {
  return {
    tools,

    async prepare(ctx) {
      const { ticket } = ctx;
      const input = ctx.input ?? {};
      const asker = NAMES[input.from];
      const question = String(input.question ?? "").trim();
      if (!asker) return { skip: "Help request without a known asking character" };
      if (!question) return { skip: "Help request without a question" };
      const answers = Array.isArray(input.answers) ? input.answers : [];
      const followUp = answers.length
        ? `\n\nYou already started on this and asked for help yourself. Answers you got back:\n${answers.map((a, i) => `${i + 1}. ${NAMES[a.from] ?? a.from} answered "${a.question}":\n"""\n${a.text}\n"""`).join("\n")}\nUse them and finish your answer to ${asker} now.`
        : "";
      const task = `${asker} (another pipeline character working on this ticket) asked you for help:

"""
${question}
"""${followUp}

${typeof scope === "function" ? scope(ctx) : scope}

How to answer:
1. Answer from your own knowledge of this ticket, its files and the toolbox. Fetch what is missing yourself (Jira capture, attachments with text copies, linked tickets, past QA Team test scripts) instead of saying it is unavailable.
2. Give ${asker} what it can use straight away: the facts with their source (file + section/row, Jira field or comment), and the repo paths of the files it should read.
3. Keep it short and numbered. ${asker} continues its own task with your answer; do not do ${asker}'s task for it.
4. If you also need another character, use an \`\`\`ask block (rule below). Ask Faizuddin only for what nobody else can know.`;
      return { prompt: joinPrompt(header(character, ticket, task), STYLE_RULES, ...rules, ASK_RULES) };
    },

    async finish() { /* chat entry, state and the hand-back are done by run-character.mjs + ask.mjs */ },
  };
}
