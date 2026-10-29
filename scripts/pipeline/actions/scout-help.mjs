// scout:help — Scout answers another character's question (ask-each-other,
// 2026-10-27): Jira facts, SRD and other attachments, linked tickets.

import { makeHelpAction } from "./_help-common.mjs";
import { scoutTools } from "./_tools.mjs";

export default makeHelpAction({
  character: "scout",
  tools: scoutTools(),
  scope: ({ ticket }) => {
    const k = ticket.key;
    const study = ticket.files?.study ?? `_reference/tickets/Studying/${k}/${k}-study.md`;
    return `You know: the Jira ticket, its SRDs and other attachments, and linked tickets. Your study: ${study}; raw material in _reference/tickets/Studying/${k}/.
You may write ONLY under _reference/tickets/Studying/${k}/ (the toolbox writes there too). If the toolbox brings in something your study missed (e.g. an SRD it could not read before), update ${study}: change only what the new material affects and note it with today's date.`;
  },
});
