// scribe:chat — Faizuddin's reply to Scribe (2026-10-27: "there is no way for
// me to reply to the scout and scribe"). Scribe answers and, when the reply
// changes what it found, updates the related-history study it wrote. Also the
// continuation after another character answered Scribe's ```ask (input.from),
// and the one-time ticket-brief fix queued by scribe:related's finish()
// (input.briefFix, 2026-10-27).

import fs from "node:fs";
import { header, joinPrompt, STYLE_RULES, ASK_RULES, incomingMessage } from "../prompts-common.mjs";
import { scribeTools } from "./_tools.mjs";
import { briefRel, briefTaskText, briefChatNote, linkBrief } from "../lib/brief.mjs";
import { checkBriefAfterScribe } from "./scribe-related.mjs";
import { snapshotRequirements, passRequirementChange } from "../lib/requirement-change.mjs";

const action = {
  tools: scribeTools(),

  async prepare(ctx) {
    const { ticket, input } = ctx;
    const text = String(input?.text ?? "").trim();
    if (!text) return { skip: "No message text" };
    const related = ticket.files?.related ?? `_reference/tickets/Studying/${ticket.key}/${ticket.key}-related-history.md`;
    snapshotRequirements(ctx);

    if (input?.briefFix) {
      const missing = Array.isArray(input.missing) && input.missing.length ? input.missing : [text];
      const task = `Pipeline check (not a message from Faizuddin): the ticket brief ${briefRel(ticket.key)} is incomplete after your related-history job.
Missing or wrong:
${missing.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Fix it now:
1. Read ${related} (your "## Ticket brief" and "## Estimated testing effort" sections) and the Scout study.
2. Write ${briefRel(ticket.key)} complete. ${briefTaskText(ticket.key)}
3. If ${related} has no "## Ticket brief" section at the top (right under the title), add it, matching the JSON.
4. Write ONLY those two files.
Your final message: what you filled in, short and numbered.`;
      return { prompt: joinPrompt(header("scribe", ticket, task), STYLE_RULES, ASK_RULES) };
    }

    const task = `${incomingMessage(input, "replied to you in the dashboard chat")}

Your related-history study for this ticket: ${related}.
1. If this answers a question you asked, or tells you to look at something, act on it with your file tools (past TS text copies are under _reference/sharepoint/qa-team-ts/, studies under _reference/tickets/), then update ${related}: change only what the reply affects and note the change with today's date.
2. If it is a question, answer it from what you have read, with the source.
3. To read a past workbook that has no text copy yet, convert it yourself: node scripts/pipeline/tools/fetch.mjs ts <EAINT-key or words from its file name> (writes the copy under _reference/sharepoint/qa-team-ts/). Only if it prints that OneDrive has not downloaded the file (cloud-only), tell Faizuddin exactly that fix — that is the one case only he can solve.
4. ${briefChatNote(ticket.key)} Keep the "## Ticket brief" section at the top of ${related} in step with it.${ticket.files?.related ? "" : `\n5. If you are finishing the related history now, also write ${briefRel(ticket.key)}: ${briefTaskText(ticket.key)}`}
Your final message: what you changed in the study (or the answer), short and numbered.`;
    return { prompt: joinPrompt(header("scribe", ticket, task), STYLE_RULES, ASK_RULES) };
  },

  // The chat reply and character state are handled by the runner. A related
  // history written here (e.g. after Scribe asked another character during
  // scribe:related) still links the file and moves the stage on, and the
  // ticket brief is checked the same way as after scribe:related.
  async finish(ctx, { ok }) {
    const { store, job, input } = ctx;
    if (!ok) return;
    const key = job.key;
    // A changed related history or brief goes on to Elf (2026-10-28).
    passRequirementChange(ctx, "scribe");
    const rel = `_reference/tickets/Studying/${key}/${key}-related-history.md`;
    const t = store.readTicket(key);

    if (input?.briefFix) {
      // Second (last) try: still incomplete -> Scribe waits for Faizuddin, with what is missing.
      const r = linkBrief(store, key);
      if (r.ok) {
        store.addEvent(key, "Scribe finished the ticket brief (scope, man-days, modules/pages)");
        return;
      }
      const note = `Ticket brief incomplete: ${r.missing.join("; ")}`.slice(0, 300);
      store.updateTicket(key, x => { x.characters.scribe = { ...x.characters.scribe, state: "waiting", note }; });
      store.appendChat(key, "scribe", { from: "system", text: `${note}. Tell Scribe in the chat what to fill in.`, jobId: job.id });
      store.addEvent(key, note);
      return;
    }

    if (t && !t.files?.related && fs.existsSync(store.repoPath(rel))) {
      store.updateTicket(key, x => { x.files = { ...x.files, related: rel }; store.raiseStage(x, "related"); });
      // This chat finished the related history: same brief check as scribe:related.
      checkBriefAfterScribe(ctx, job.id);
      return;
    }
    // A plain chat may have updated the brief: keep files.brief linked when it is complete.
    linkBrief(store, key);
  },
};

export default action;
