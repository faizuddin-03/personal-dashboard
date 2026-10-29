// dwarf:build — after the green light, Dwarf builds a NEW automation suite
// and runner page for the ticket with the eauto-automation-scaffold skill
// (2026-10-27). If any part of this ticket's automation already exists
// (e.g. scripts/eauto-12153), Dwarf does not rebuild it: it reports and asks.
// Build marker <suiteDir>/.pipeline-build.json (2026-10-27): written
// "building" when the folder is created, "complete" on success (then the
// ticket gets files.suiteDir/runnerPage/runKey). A folder with a "building"
// marker for this ticket is continued, never started over; a folder without a
// marker is automation made outside the pipeline and is left alone.

import fs from "node:fs";
import { header, joinPrompt, STYLE_RULES, AUTOMATION_RULES, ASK_RULES, exists } from "../prompts-common.mjs";
import { dwarfTools } from "./_tools.mjs";
import { AUTOMATION_LESSONS } from "../lib/automation-lessons.mjs";
import { scenariosJsonRel, validateScenarios } from "./_elf-common.mjs";
import {
  suitePaths, scenarioTitles, htmlCaptures, buildState, markerRel, readBuildMarker, writeBuildMarker,
  runnerContractRules, runnerAfterDwarf, REGISTRY_REL,
} from "./_dwarf-common.mjs";
import { checkAfterDwarf, planAfterDwarf } from "./_dwarf-check.mjs";
import { suiteCheckRules } from "../lib/suite-check.mjs";
import { assertionPlanRules } from "../lib/assertion-plan.mjs";

const action = {
  tools: dwarfTools(),

  async prepare(ctx) {
    const { ticket, store } = ctx;
    const key = ticket.key;
    const p = suitePaths(key);
    const jsonRel = scenariosJsonRel(key);

    if (ticket.files?.suiteDir) {
      return {
        skip: "Automation already built",
        reply: `1. The automation for ${key} is already built at **${ticket.files.suiteDir}** (runner page **${ticket.files.runnerPage ?? p.runnerPage}**).\n2. I did not rebuild it. Scenario changes reach it through sync; tell me in the chat if something else should change.`,
        state: "idle",
      };
    }
    // Build marker (scripts/eauto-<digits>/.pipeline-build.json) tells a stopped
    // pipeline build apart from automation made outside the pipeline.
    const bs = buildState(key);
    if (bs.state === "complete") {
      // Built by the pipeline earlier (e.g. the ticket was removed and added back): link it, do not rebuild.
      const pageBuilt = fs.existsSync(store.repoPath(p.pageFile));
      if (!ctx.dry) {
        store.updateTicket(key, t => {
          t.files = { ...t.files, suiteDir: p.suiteDir, ...(pageBuilt ? { runnerPage: p.runnerPage } : {}) };
          if (pageBuilt) t.runKey = p.runKey;
          store.raiseStage(t, "automation");
        });
      }
      return {
        skip: "Automation already built by the pipeline; linked",
        reply: `1. The pipeline already finished building the automation for ${key} at **${p.suiteDir}**${pageBuilt ? ` (runner page **${p.runnerPage}**)` : ""}. I linked it to this ticket and did not rebuild it.\n2. Scenario changes reach it through sync; tell me in the chat if something else should change.`,
        state: "idle",
      };
    }
    if (bs.state === "foreign") {
      return {
        skip: "Existing automation found; not rebuilt",
        reply: `1. Automation for ${key} already exists outside the pipeline: ${bs.found.map(f => `**${f}**`).join(", ")}.\n2. I did **not** rebuild or change it (existing suites are never touched).\n\n## Questions for Faizuddin\n1. Should I leave it as is and only link the existing runner page, or add the new scenarios into it as a separate change you approve in the chat?`,
        state: "waiting",
        note: "Existing automation found: link it or extend it?",
      };
    }
    if (!exists(jsonRel)) return { skip: "No scenarios.json yet: approve scenarios first" };
    const v = validateScenarios(store.repoPath(jsonRel), key);
    if (!v.ok) return { skip: `scenarios.json has problems: ${v.errors[0]}` };
    if (!ticket.approvedAt) return { skip: "Scenarios are not approved yet" };

    const continuing = bs.state === "continue";
    if (ctx.dry) {
      console.log(`BUILD STATE: ${bs.state}${continuing ? "" : " (dry run: suite folder and marker not created)"}`);
    } else if (continuing) {
      writeBuildMarker(p, { ...bs.marker, jobId: ctx.job.id, continuedAt: store.nowIso() });
    } else {
      writeBuildMarker(p, { status: "building", ticket: key, startedAt: store.nowIso(), jobId: ctx.job.id });
    }
    ctx.state.buildState = bs.state;

    ctx.state.hash = store.hashFile(store.repoPath(jsonRel));
    // The build uses the latest scenarios, so changes queued before it are covered.
    ctx.state.pendingAtStart = [...(ticket.pendingDwarfChanges ?? [])];
    const titles = scenarioTitles(store, key);
    const auto = titles.filter(t => !t.manual);
    const manual = titles.filter(t => t.manual);

    const marker = markerRel(p);
    const continueNote = continuing
      ? `\nIMPORTANT: a previous build of this suite stopped part-way (${marker} says "building", started ${bs.marker.startedAt ?? "earlier"}). Do NOT start over and do NOT duplicate anything. First inspect what already exists in ${p.suiteDir}/, ${p.apiDir}/, ${p.pageDir}/, components/Sidebar.tsx, lib/ticketAutomations.ts and ${REGISTRY_REL}; keep what is correct, finish what is missing, fix what is broken. Then run the checks below.\n`
      : "";

    const task = `Faizuddin approved the scenarios (green light). ${continuing ? `Finish the automation for ${key} that a previous build started` : `Build the automation for ${key} as a NEW suite`}.
${continueNote}
Keep the file ${marker} exactly as it is: the dashboard uses it to track this build (do not edit, move or delete it).

Read first, fully:
1. .claude/skills/eauto-automation-scaffold/SKILL.md (follow it all; benchmark app/eauto/12166 + tests/service-hub, newest example scripts/eauto-jomcheck + app/api/eauto-jomcheck + app/eauto/jomcheck).
2. ${jsonRel} (the approved scenarios) and ${ticket.files?.scenariosMd ?? "the scenario list"}.
3. knowledge/automation-testing.md and the knowledge/flow-*.md file of this module.
4. scripts/eauto-12107 for captureIssue (red box + caption on the exact cell at fault).

Create (new files only):
1. ${p.suiteDir}/ — the Playwright project per the skill §1 (package.json like scripts/eauto-jomcheck, playwright.config.ts, data/, pages/, tests/, reporters/, utils/).
2. ${p.apiDir}/run/route.ts, ${p.apiDir}/history/route.ts, ${p.apiDir}/download-all/route.ts — copy the shape of app/api/eauto-12153/ (read node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md first; route params are Promises).
3. ${p.runnerFile} — the runner UI per the skill (multi-TS checklist, demo/detailed mode, video) as a reusable component (see the runner contract below), plus a thin ${p.pageFile} that only renders it; RUN_KEY = "${p.runKey}" and a SCENARIOS list whose titles are EXACTLY:
${auto.map((t, i) => `   ${i + 1}. "${t.title}"`).join("\n") || "   (none automated)"}
${manual.length ? `   Manual only (show as manual, never automate): ${manual.map(t => t.id).join(", ")}` : ""}
   The Playwright test() titles use the same strings.
4. One entry in components/Sidebar.tsx under Tickets (skill §6; this file uses CRLF line endings — keep them), one entry in lib/ticketAutomations.ts (href "${p.runnerPage}") and one line in ${REGISTRY_REL} (runner contract item 5).

${runnerContractRules(key)}

Page defaults: Headless off, Detailed on. Inputs that the automation cannot create are typed on the page: blank and required, no prefills.
Install and check: npm install --prefix ${p.suiteDir} ; npx tsc --noEmit -p ${p.suiteDir} ; npx tsc --noEmit -p . ; npx eslint ${p.pageDir} ${p.apiDir}. You may list tests (npx playwright test --list --config ${p.suiteDir}/playwright.config.ts) but do NOT run them against any environment: Faizuddin runs them from the runner page. Never run npm run dev; the dev server is already running.

${suiteCheckRules(key)}

${assertionPlanRules(key)}

HTML captures available: ${htmlCaptures().join(", ") || "none"}. Selectors must come from these captures or existing suites. Where a page you need is not captured: write what you can, put "[unconfirmed]" in a code comment on that page object and in that TS, and ask which pages to capture.

Your final message: files created, checks run and their result, TS automated vs not, and questions (which pages to capture, any input you need).`;
    return {
      prompt: joinPrompt(header("dwarf", ticket, task), STYLE_RULES, AUTOMATION_RULES, AUTOMATION_LESSONS, ASK_RULES),
      // Only this ticket's suite, api and page dirs are editable; every other suite stays denied.
      tools: dwarfTools({ own: [p.suiteDir, p.apiDir, p.pageDir], deny: [`Edit(./${marker})`] }),
    };
  },

  async finish(ctx, { ok }) {
    const { store, job, state } = ctx;
    // On failure the marker stays "building", so the next build continues it.
    if (!ok) return;
    const p = suitePaths(job.key);
    const suiteBuilt = fs.existsSync(store.repoPath(p.suiteDir));
    const pageBuilt = fs.existsSync(store.repoPath(p.pageFile));
    if (!suiteBuilt) throw new Error(`Dwarf finished but ${p.suiteDir} was not created`);
    // Marker first: only a build marked complete is linked to the ticket.
    const marker = readBuildMarker(p);
    writeBuildMarker(p, { ...(marker ?? { ticket: job.key, startedAt: store.nowIso() }), status: "complete", jobId: job.id, completedAt: store.nowIso() });
    store.updateTicket(job.key, t => {
      t.files = { ...t.files, suiteDir: p.suiteDir, ...(pageBuilt ? { runnerPage: p.runnerPage } : {}) };
      if (pageBuilt) t.runKey = p.runKey;
      if (state.hash) t.dwarfScenarioHash = state.hash;
      const covered = new Set(state.pendingAtStart ?? []);
      if (t.pendingDwarfChanges) t.pendingDwarfChanges = t.pendingDwarfChanges.filter(n => !covered.has(n));
      store.raiseStage(t, "automation");
      t.events = [{ at: store.nowIso(), text: `Dwarf built the automation${pageBuilt ? ` (runner page ${p.runnerPage})` : " (runner page not built yet)"}` }, ...(t.events ?? [])].slice(0, 100);
    });
    // Runner contract (2026-10-28): Runner.tsx + registry line → embedded in /pipeline/<KEY>.
    runnerAfterDwarf(ctx);
    // Assertion plan (night round 8): advisory note in Dwarf's chat.
    planAfterDwarf(ctx);
    // Suite check (spec-reviewer list, 2026-10-27): one automatic fix job when something blocks.
    checkAfterDwarf(ctx, job.id);
  },
};

export default action;
