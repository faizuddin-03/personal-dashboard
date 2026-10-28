// scribe:help — Scribe answers another character's question (ask-each-other,
// 2026-10-27): past QA Team test scripts and what was tested before.

import { makeHelpAction } from "./_help-common.mjs";
import { scribeTools } from "./_tools.mjs";

export default makeHelpAction({
  character: "scribe",
  tools: scribeTools(),
  scope: ({ ticket }) => {
    const k = ticket.key;
    const related = ticket.files?.related ?? `_reference/tickets/Studying/${k}/${k}-related-history.md`;
    return `You know: past QA Team test scripts (text copies under _reference/sharepoint/qa-team-ts/, index INDEX.md), earlier TS studies (_reference/tickets/*/*-qa-team-ts-study.md), knowledge/cr-test-scenario-catalogue.md, and your related-history study ${related}.
To read a past workbook that has no text copy yet, run: node scripts/pipeline/tools/fetch.mjs ts <EAINT-key or words>.
You may update ${related} if the answer adds to it (note the change with today's date). Write nothing else.`;
  },
});
