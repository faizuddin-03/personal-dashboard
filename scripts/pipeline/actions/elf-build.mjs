// elf:build — after the green light, Elf builds the TS workbook from
// scenarios.json with the draft-TS-excel skill's build-workbook.mjs
// (2026-10-27). Elf writes into data/pipeline/work/<KEY>/; Node then moves
// the file to _reference/tickets/<KEY>/ and never overwrites: an older
// workbook of the same name gets " (superseded vN)" (draft-TS-excel skill,
// "Where the output goes").

import fs from "node:fs";
import path from "node:path";
import { header, joinPrompt, STYLE_RULES, TS_RULES, ASK_RULES, exists } from "../prompts-common.mjs";
import { elfTools } from "./_tools.mjs";
import { workDir, scenariosJsonRel, validateScenarios } from "./_elf-common.mjs";

/** "<KEY> - <Jira summary, emoji stripped>" made safe for a Windows file name. */
export function workbookBaseName(key, title, suggestion) {
  const clean = String(title ?? "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[️‍]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  return `${key} - ${clean || key}${suggestion ? " (Suggestion by Claude)" : ""}`.slice(0, 180);
}

function nextSupersededPath(dir, base) {
  for (let n = 1; n < 100; n++) {
    const p = path.join(dir, `${base} (superseded v${n}).xlsx`);
    if (!fs.existsSync(p)) return p;
  }
  return path.join(dir, `${base} (superseded v${Date.now()}).xlsx`);
}

const action = {
  tools: elfTools({ bash: true }),

  async prepare(ctx) {
    const { ticket, store } = ctx;
    const key = ticket.key;
    const jsonRel = scenariosJsonRel(key);
    if (!exists(jsonRel)) return { skip: "No scenarios.json yet: ask Elf for scenarios first" };
    const v = validateScenarios(store.repoPath(jsonRel), key);
    if (!v.ok) return { skip: `scenarios.json has problems: ${v.errors[0]}` };

    const suggestion = !!ticket.files?.officialTs;
    const base = workbookBaseName(key, ticket.title, suggestion);
    const specRel = `${workDir(key)}/ts-spec.json`;
    const outRel = `${workDir(key)}/build.xlsx`;
    Object.assign(ctx.state, { base, specRel, outRel, suggestion });
    if (!ctx.dry) { try { fs.unlinkSync(store.repoPath(outRel)); } catch { /* none */ } }

    const intro = ctx.input?.rebuild
      ? `The approved scenarios changed after the green light. Rebuild the TS workbook from the current ${jsonRel} (the dashboard keeps the older workbook as superseded).`
      : `Faizuddin approved the scenarios. Build the TS workbook from ${jsonRel}.`;
    const task = `${intro}

Steps:
1. Read .claude/skills/draft-TS-excel/SKILL.md and .claude/skills/draft-TS-excel/references/data-model.md in full.
2. Turn ${jsonRel} into the spec JSON the skill describes and write it to ${specRel}. Title row: "${base.replace(/ \(Suggestion by Claude\)$/, "")}". Keep every TS id, title, section order, objective, steps and expected result as approved; only shape them (sections A., B., ...; marks **, ++, !! kept). Do not add, drop or reword TS.
3. Run exactly: node .claude/skills/draft-TS-excel/scripts/build-workbook.mjs ${specRel} ${outRel}
4. Check the output against the skill's §7 step 4 list. Report only what you actually checked.
${suggestion ? "\nAn official TS exists for this ticket, so this workbook is a \"Suggestion by Claude\" only; the official sheet stays the source of truth." : ""}
Write only ${specRel} and ${outRel}. The dashboard moves the workbook to _reference/tickets/${key}/ afterwards.
Your final message: TS count, the checks you ran, and anything you could not check.`;
    return { prompt: joinPrompt(header("elf", ticket, task), STYLE_RULES, TS_RULES, ASK_RULES) };
  },

  async finish(ctx, { ok }) {
    const { store, job, state } = ctx;
    if (!ok) return;
    const built = store.repoPath(state.outRel);
    if (!fs.existsSync(built)) throw new Error(`Elf finished but ${state.outRel} was not built`);
    const dir = store.repoPath(`_reference/tickets/${job.key}`);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, `${state.base}.xlsx`);
    let superseded = null;
    if (fs.existsSync(target)) {
      superseded = nextSupersededPath(dir, state.base);
      fs.renameSync(target, superseded);
    }
    fs.copyFileSync(built, target);
    const rel = store.relPath(target);
    store.updateTicket(job.key, t => {
      t.files = { ...t.files, workbook: rel };
      t.events = [{ at: store.nowIso(), text: `Elf built the TS workbook${superseded ? " (older copy kept as superseded)" : ""}` }, ...(t.events ?? [])].slice(0, 100);
    });
    store.appendChat(job.key, "elf", {
      from: "system",
      text: `1. Workbook saved: **${rel}**${superseded ? `\n2. Older workbook kept as: ${store.relPath(superseded)}` : ""}`,
      jobId: job.id,
    });
  },
};

export default action;
