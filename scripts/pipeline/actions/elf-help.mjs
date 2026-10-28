// elf:help — Elf answers another character's question (ask-each-other,
// 2026-10-27): this ticket's scenarios / TS.

import { makeHelpAction } from "./_help-common.mjs";
import { elfTools } from "./_tools.mjs";
import { TS_RULES } from "../prompts-common.mjs";
import { scenariosMdRel, scenariosJsonRel } from "./_elf-common.mjs";

export default makeHelpAction({
  character: "elf",
  // Scenario files stay untouched in a help job.
  tools: (() => { const t = elfTools(); return { ...t, disallowed: [...t.disallowed, "Edit(./data/pipeline/**)"] }; })(),
  rules: [TS_RULES],
  scope: ({ ticket }) => {
    const k = ticket.key;
    return `You know: this ticket's scenarios (${ticket.files?.scenariosMd ?? scenariosMdRel(k)}, ${ticket.files?.scenariosJson ?? scenariosJsonRel(k)})${ticket.files?.workbook ? `, the TS workbook ${ticket.files.workbook}` : ""}${ticket.files?.officialTs ? ` and the official QA Team TS (text copy data/pipeline/work/${k}/official-ts.md)` : ""}.
Do NOT change the scenario files in a help job: scenario changes go through Faizuddin's review in your own chat. If the question shows they need changing, say exactly what should change in your answer.`;
  },
});
