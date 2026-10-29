// dwarf:sync — apply Elf's post-approval scenario changes to the automation
// (2026-10-27). Queued by Elf's finish when scenarios.json changes after the
// green light. Clears only the notes it applied, so a change Elf makes while
// this job runs stays pending for the next sync.

import { header, joinPrompt, STYLE_RULES, AUTOMATION_RULES, ASK_RULES } from "../prompts-common.mjs";
import { dwarfTools } from "./_tools.mjs";
import { AUTOMATION_LESSONS } from "../lib/automation-lessons.mjs";
import { scenariosJsonRel } from "./_elf-common.mjs";
import { suitePaths, ownDirs, scenarioTitles, runnerContractRules, runnerAfterDwarf, REGISTRY_REL } from "./_dwarf-common.mjs";
import { checkAfterDwarf, snapshotForGuard, guardAfterDwarf, planAfterDwarf } from "./_dwarf-check.mjs";
import { assertionPlanRel } from "../lib/assertion-plan.mjs";
import { suiteCheckRules } from "../lib/suite-check.mjs";

const action = {
  // Default set; prepare() narrows the editable dirs to this ticket's own suite.
  tools: dwarfTools(),

  async prepare(ctx) {
    const { ticket, store } = ctx;
    const pending = ticket.pendingDwarfChanges ?? [];
    if (!pending.length) return { skip: "No scenario changes waiting" };
    const own = ownDirs(ticket);
    if (!own.length) {
      return {
        skip: "No pipeline-built automation to update",
        reply: `1. Elf changed the scenarios, but there is no automation built by the pipeline for ${ticket.key} yet, so nothing was updated.\n2. The changes stay listed as pending; the build will use the latest scenarios.`,
        state: "idle",
      };
    }
    const p = suitePaths(ticket.key);
    const jsonRel = scenariosJsonRel(ticket.key);
    ctx.state.applied = [...pending];
    ctx.state.hash = store.hashFile(store.repoPath(jsonRel));
    const titles = scenarioTitles(store, ticket.key);
    snapshotForGuard(ctx, own); // night round 6: assertion guard

    const task = `Elf changed the approved scenarios. Mirror the changes in this ticket's automation.

Changes (oldest first):
${pending.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Current scenarios: ${jsonRel}. The SCENARIOS list in ${p.runnerFile} (or ${p.pageFile} if this suite predates the runner contract) and the Playwright test() titles in ${p.suiteDir}/tests/ must match these titles EXACTLY, in this order:
${titles.map((t, i) => `${i + 1}. "${t.title}"${t.manual ? " (manual only: list as manual, never automate)" : ""}`).join("\n")}

Rules:
1. Change only ${own.join(", ")} (and this ticket's lib/ticketAutomations.ts entry if the TS count changed, and this ticket's line in ${REGISTRY_REL}).
2. Added TS: new test() following the suite's existing pattern. Removed TS: remove its test() and page entry. Changed TS: update the steps/assertions it changed. Renumbered ids: rename titles to match.
3. Run npx tsc --noEmit -p ${p.suiteDir} ; npx tsc --noEmit -p . ; npx eslint ${p.pageDir} ${p.apiDir}. Do not run the tests against any environment.
4. ${suiteCheckRules(ticket.key)}
5. Keep ${assertionPlanRel(ticket.key)} in step: add/remove/update the entry of every TS you changed, each with its checks and at least one wrong outcome (what a broken build would show) that the assertions reject.
6. Keep the runner contract below (if the runner still lives in page.tsx, move it into Runner.tsx as part of this change):
${runnerContractRules(ticket.key)}
Your final message: per change, what you did (ids, files), and anything you could not do.`;
    return {
      prompt: joinPrompt(header("dwarf", ticket, task), STYLE_RULES, AUTOMATION_RULES, AUTOMATION_LESSONS, ASK_RULES),
      tools: dwarfTools({ own }),
    };
  },

  async finish(ctx, { ok }) {
    const { store, job, state } = ctx;
    if (!ok || !state.applied) return;
    store.updateTicket(job.key, t => {
      const done = new Set(state.applied);
      t.pendingDwarfChanges = (t.pendingDwarfChanges ?? []).filter(n => !done.has(n));
      if (state.hash) t.dwarfScenarioHash = state.hash;
      t.events = [{ at: store.nowIso(), text: `Dwarf applied ${state.applied.length} scenario change(s)` }, ...(t.events ?? [])].slice(0, 100);
    });
    guardAfterDwarf(ctx);
    runnerAfterDwarf(ctx);
    planAfterDwarf(ctx);
    checkAfterDwarf(ctx, job.id);
  },
};

export default action;
