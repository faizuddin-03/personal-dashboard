// elf:chat — Faizuddin's message to Elf (2026-10-27): revise the scenarios
// or answer a question. The chat route appends his message before queuing.
// Also the continuation after another character answered Elf's ```ask
// (input.from = that character; scripts/pipeline/ask.mjs).

import { header, joinPrompt, STYLE_RULES, TS_RULES, ASK_RULES, exists, incomingMessage, fromCharacter } from "../prompts-common.mjs";
import { elfTools } from "./_tools.mjs";
import { briefCoverageBlock } from "../lib/brief.mjs";
import { SCENARIO_REVIEW_RULES, lintFixTask } from "../lib/scenario-review.mjs";
import { requirementChangeTask } from "../lib/requirement-change.mjs";
import { prepareOfficial, officialBlock, scenarioFormat, snapshot, finishScenarios, scenariosJsonRel } from "./_elf-common.mjs";

const action = {
  tools: elfTools(),

  async prepare(ctx) {
    const { ticket, input } = ctx;
    const text = String(input?.text ?? "").trim();
    if (!text) return { skip: "No message text" };
    snapshot(ctx);
    const official = await prepareOfficial(ctx);
    const hasList = exists(scenariosJsonRel(ticket.key));
    // A lint-fix job (input.lintFix) or a requirement re-check (input.requirementChange,
    // lib/requirement-change.mjs) reads like a relay: the task comes from the dashboard, not from him.
    const reqChange = !!input?.requirementChange;
    const relay = !!fromCharacter(input) || !!input?.lintFix || reqChange;
    const lintFix = !!input?.lintFix && Array.isArray(input.warnings);
    const task = `${lintFix ? lintFixTask(input.warnings) : reqChange ? requirementChangeTask(input, !!ticket.approvedAt) : incomingMessage(input)}

${relay || lintFix ? "" : "Do what he asks. "}${hasList
      ? `If ${relay ? "the task needs" : "he asks for"} scenario changes, update BOTH scenario files so they stay in step (renumber ids to stay sequential when TS are added or removed, and say which ids moved). If it is only a question, answer it and leave the files alone.`
      : `There is no scenario list yet. ${relay ? "If you were drafting scenarios, draft them now" : "If he asks for scenarios, draft them"}; otherwise just answer.`}
${ticket.approvedAt ? "\nThe scenarios were already APPROVED (green light). Any change you make is sent to Dwarf to mirror in the automation, so change only what is needed." : ""}

${officialBlock(official)}

${briefCoverageBlock(ticket.key)}

${scenarioFormat(ticket.key)}

If scenarios change, keep the "## Coverage of the ticket brief" section of scenarios.md in step.
Your final message: what you changed (ids) or the answer, short and numbered.`;
    return { prompt: joinPrompt(header("elf", ticket, task), STYLE_RULES, TS_RULES, SCENARIO_REVIEW_RULES, ASK_RULES) };
  },

  async finish(ctx, res) {
    await finishScenarios(ctx, res, { askedForReview: false });
  },
};

export default action;
