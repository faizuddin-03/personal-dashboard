// elf:plan — Elf drafts the first scenario list (2026-10-27). Starts only
// when Faizuddin presses "Ask Elf for scenarios" (README §1 item 2).

import { header, joinPrompt, STYLE_RULES, TS_RULES, ASK_RULES } from "../prompts-common.mjs";
import { elfTools } from "./_tools.mjs";
import { briefCoverageBlock } from "../lib/brief.mjs";
import { SCENARIO_REVIEW_RULES } from "../lib/scenario-review.mjs";
import { prepareOfficial, officialBlock, scenarioFormat, snapshot, finishScenarios } from "./_elf-common.mjs";

const action = {
  tools: elfTools(),

  async prepare(ctx) {
    const { ticket } = ctx;
    snapshot(ctx);
    const official = await prepareOfficial(ctx);
    const extra = ctx.input && typeof ctx.input === "object" && ctx.input.text ? `\nFaizuddin's note for this draft: "${ctx.input.text}"` : "";
    const task = `Draft the test scenarios for ${ticket.key}.${extra}

Read first:
1. The Scout study and the Jira capture (listed above), and the NEWEST SRD through its <name>-text.md copy in the Studying folder. If the SRD or a mock-up has no text copy there (or the study says it was not read), run: node scripts/pipeline/tools/fetch.mjs attachments ${ticket.key}
2. The related history from Scribe (if listed): reuse scenarios and avoid the known traps it names.
3. knowledge/test-scripts.md (whole file) and .claude/skills/draft-TS-excel/SKILL.md (wording rules; do NOT build the workbook now).
4. The approved model workbook named in knowledge/test-scripts.md "A TS is a guide", for size and tone.

${officialBlock(official)}

${briefCoverageBlock(ticket.key)}

${scenarioFormat(ticket.key)}

Keep it lean: cover what the ticket changes, one TS per distinct condition, no TS for existing behaviour the tester only passes through. Do not build an Excel file; that happens after Faizuddin approves.
Your final message: the TS count per section, the basis (official / study), the brief coverage in one line (pages covered / pages with no TS), and any questions.`;
    return { prompt: joinPrompt(header("elf", ticket, task), STYLE_RULES, TS_RULES, SCENARIO_REVIEW_RULES, ASK_RULES) };
  },

  async finish(ctx, res) {
    await finishScenarios(ctx, res, { askedForReview: true });
  },
};

export default action;
