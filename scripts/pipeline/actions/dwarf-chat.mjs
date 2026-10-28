// dwarf:chat — Faizuddin's message to Dwarf (2026-10-27). Dwarf may edit
// only the automation the pipeline built for this ticket. Also the
// continuation after another character answered Dwarf's ```ask (input.from).

import { header, joinPrompt, STYLE_RULES, AUTOMATION_RULES, ASK_RULES, incomingMessage, fromCharacter } from "../prompts-common.mjs";
import { dwarfTools } from "./_tools.mjs";
import { AUTOMATION_LESSONS } from "../lib/automation-lessons.mjs";
import { suitePaths, ownDirs, existingSuiteDirs } from "./_dwarf-common.mjs";
import { suiteFixTask, finishSuiteFix, snapshotForGuard, guardAfterDwarf } from "./_dwarf-check.mjs";

const action = {
  // Default set; prepare() narrows the editable dirs to this ticket's own suite.
  tools: dwarfTools(),

  async prepare(ctx) {
    const { ticket, input } = ctx;
    const text = String(input?.text ?? "").trim();
    if (!text) return { skip: "No message text" };
    const own = ownDirs(ticket);
    const p = suitePaths(ticket.key);
    const outside = own.length ? [] : existingSuiteDirs(p);
    const scope = own.length
      ? `Your automation for this ticket: ${own.join(", ")} (runner page ${ticket.files?.runnerPage ?? p.runnerPage}, run key ${ticket.runKey ?? p.runKey}). You may change only these, plus this ticket's entries in components/Sidebar.tsx (CRLF line endings — keep them) and lib/ticketAutomations.ts.`
      : outside.length
        ? `Automation for this ticket exists OUTSIDE the pipeline (${outside.join(", ")}). It is protected: read it, but do not change it. If Faizuddin asks for a change there, explain what you would change and ask him to confirm it outside the pipeline.`
        : "No automation is built for this ticket yet (it is built after Faizuddin approves the scenarios). Answer and plan only; do not create the suite from this chat.";
    snapshotForGuard(ctx, own); // night round 6: assertion guard
    const opening = input?.suiteFix && own.length ? suiteFixTask(ctx.store, ticket.key) : incomingMessage(input);
    const task = `${opening}

${scope}
${(ticket.pendingDwarfChanges ?? []).length ? `\nScenario changes from Elf still waiting to be applied:\n${ticket.pendingDwarfChanges.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n(They are applied by a separate sync job; do not apply them here unless he asks.)` : ""}

${input?.suiteFix ? "Fix the suite check" : fromCharacter(input) ? "Continue your task" : "Do what he asks"} within that scope. If you changed code, run npx tsc --noEmit -p . and npx eslint on the files you changed. Do not run the tests against any environment.
Your final message: what you changed (files) or the answer, short and numbered.`;
    return {
      prompt: joinPrompt(header("dwarf", ticket, task), STYLE_RULES, AUTOMATION_RULES, AUTOMATION_LESSONS, ASK_RULES),
      tools: dwarfTools({ own }),
    };
  },

  // The chat reply and character state are handled by the runner; a suite-check
  // fix chat (input.suiteFix, 2026-10-27) checks again afterwards.
  // The assertion guard (night round 6) lists checks this job loosened.
  async finish(ctx, { ok }) {
    if (ok) guardAfterDwarf(ctx);
    if (ok && ctx.input?.suiteFix) finishSuiteFix(ctx);
  },
};

export default action;
