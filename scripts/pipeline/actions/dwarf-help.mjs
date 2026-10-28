// dwarf:help — Dwarf answers another character's question (ask-each-other,
// 2026-10-27): this ticket's automation code. Read only: a help job never
// changes code (changes go through Faizuddin's chat with Dwarf).

import { makeHelpAction } from "./_help-common.mjs";
import { dwarfTools } from "./_tools.mjs";
import { AUTOMATION_RULES } from "../prompts-common.mjs";
import { suitePaths, existingSuiteDirs } from "./_dwarf-common.mjs";

const READ_ONLY_CODE = ["Edit(./scripts/**)", "Edit(./app/**)", "Edit(./lib/**)", "Edit(./components/**)", "Edit(./hooks/**)", "Edit(./data/pipeline/**)", "Edit(./package.json)"];

export default makeHelpAction({
  character: "dwarf",
  // own = []: every existing suite stays protected; plus no code edits at all.
  tools: dwarfTools({ own: [], deny: READ_ONLY_CODE }),
  rules: [AUTOMATION_RULES],
  scope: ({ ticket }) => {
    const p = suitePaths(ticket.key);
    const found = existingSuiteDirs(p);
    return `You know: this ticket's automation (${found.length ? found.join(", ") : `not built yet; it will live in ${p.suiteDir}`}), the existing eauto-* suites it copies flows from, and the saved HTML under _reference/html/.
This is a READ-ONLY job: do not change any code or run any tests. If the question shows the automation needs a change, say exactly what should change in your answer.`;
  },
});
