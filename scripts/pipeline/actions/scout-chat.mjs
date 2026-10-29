// scout:chat — Faizuddin's reply to Scout (2026-10-27: "there is no way for
// me to reply to the scout and scribe"). Scout answers and, when the reply
// changes the facts, updates the ticket study it wrote. Also the continuation
// after another character answered Scout's ```ask (input.from).

import { header, joinPrompt, STYLE_RULES, ASK_RULES, incomingMessage, fromCharacter } from "../prompts-common.mjs";
import { scoutTools } from "./_tools.mjs";
import { briefChatNote, linkBrief } from "../lib/brief.mjs";
import { snapshotRequirements, passRequirementChange } from "../lib/requirement-change.mjs";

const action = {
  // File tools + the toolbox (Jira capture, attachments, linked tickets).
  tools: scoutTools(),

  async prepare(ctx) {
    const { ticket, input } = ctx;
    const text = String(input?.text ?? "").trim();
    if (!text) return { skip: "No message text" };
    const study = ticket.files?.study ?? `_reference/tickets/Studying/${ticket.key}/${ticket.key}-study.md`;
    const relay = !!fromCharacter(input);
    snapshotRequirements(ctx);
    const task = `${incomingMessage(input, "replied to you in the dashboard chat")}

Your study of this ticket: ${study} (raw Jira capture and attachments are in the same folder).
1. If this answers a question you asked or corrects a fact, update ${study}: change only what the reply affects, quote ${relay ? "the answering character and its source" : "him as the source"} with today's date (e.g. "${relay ? "[<source file or Jira field>, via <character>, <date>]" : "[Faizuddin, dashboard chat, <date>]"}").
2. If it is a question, answer it from the study material, with the source.
3. If fresh Jira data is needed, get it yourself with the toolbox (issue / attachments / linked / search, see below) and update the study.
   Keep what the requestor STATED (ticket, SRD, comments: their words, quoted) apart from what you INVESTIGATED (concluded from code, other docs, older TS, a screen): put conclusions under an "Investigated" heading with their evidence, never into the requirement list as if settled. Before you finish, check each changed sentence: "did they say this, or did I conclude it?" (night round 13, [charmain-repo: .claude/skills/ticket-intake/SKILL.md:28-55]).
4. ${briefChatNote(ticket.key)}
Your final message: what you changed in the study (or the answer), short and numbered.`;
    return { prompt: joinPrompt(header("scout", ticket, task), STYLE_RULES, ASK_RULES) };
  },

  // The chat reply and character state are handled by the runner. A brief
  // Scout updated stays linked when it is complete (2026-10-27). A changed
  // study or brief goes on to Elf (2026-10-28).
  async finish(ctx, { ok }) {
    if (!ok) return;
    linkBrief(ctx.store, ctx.job.key);
    passRequirementChange(ctx, "scout");
  },
};

export default action;
