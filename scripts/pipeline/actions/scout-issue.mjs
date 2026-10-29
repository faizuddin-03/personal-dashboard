// scout:issue — draft the QA-Issue text for a confirmed finding (Faizuddin, 2026-10-27).
//
// input: { findingId }. Scout writes issue-draft.json next to finding.json;
// finish() validates it and stores it as finding.issueDraft. No Jira writes:
// /api/pipeline/issue raises it only after Faizuddin presses Raise.
// Format: .claude/skills/eauto-qa-issue-ticket/SKILL.md (title, Staging Test
// IDs, Item / Actual / Expected) and feedback_qa-issue-tickets-short
// ("Actual = symptom in a few words").

import fs from "node:fs";
import path from "node:path";
import { PIPE_DIR, nowIso, readFinding, writeFinding, updateTicket, appendChat } from "../store.mjs";
import { lintDraft } from "../lib/qa-issue.mjs";
import { header, joinPrompt, STYLE_RULES, ASK_RULES, hasQuestions } from "../prompts-common.mjs";
import { scribeTools } from "./_tools.mjs";
import { newerResult, newerPassLine } from "../lib/latest-run.mjs";

const PRIORITIES = new Set(["Highest", "High", "Medium", "Low", "Lowest"]);
const readJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fb; } };
const str = (v, n = 400) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const strList = (v, max, n = 300) => (Array.isArray(v) ? v : v ? [v] : []).map(x => str(x, n)).filter(Boolean).slice(0, max);

/** Area from the parent's own "[eAuto - <Area>]" title prefix, if any. */
const areaOf = title => String(title ?? "").match(/^\s*\[eAuto\s*-\s*([^\]]+)\]/i)?.[1]?.trim();

const action = {
  // File tools only (no Bash), same protected paths as Scribe, plus _reference/.
  tools: () => {
    const base = scribeTools();
    return { allowed: base.allowed, disallowed: [...base.disallowed, "Edit(./_reference/**)"] };
  },

  async prepare(ctx) {
    const { ticket } = ctx;
    const input = ctx.input ?? ctx.job.input ?? {};
    const key = ticket.key;
    const f = input.findingId ? readFinding(key, input.findingId) : null;
    if (!f) return { skip: `Finding ${input.findingId ?? "(none)"} not found` };
    if (f.state !== "confirmed") return { skip: `Finding ${f.id} is "${f.state}", not confirmed` };

    const dir = `data/pipeline/findings/${key}/${f.id}`;
    // A redraft must not fall back to the last draft if Scout fails this time.
    try { fs.unlinkSync(path.join(PIPE_DIR, "findings", key, f.id, "issue-draft.json")); } catch { /* none yet */ }
    const form = f.raiseForm ?? {};
    const area = areaOf(ticket.title);
    // Night round 5: triage from the latest run [charmain-repo: test-scenarios/defects.yaml:14-19].
    const newer = newerResult(key, f);
    const newerNote = newer?.status === "passed"
      ? `

Warning: ${newerPassLine(f, newer)}. Still write the draft, but make the FIRST line of your final message: "Note: ${newerPassLine(f, newer)} — re-run before raising."`
      : "";
    const task = `Faizuddin confirmed finding \`${f.id}\` (${f.ts}) as a real issue. Draft the QA-Issue text for it. Do NOT create anything in Jira; the dashboard raises it after he reviews your draft and presses Raise.${newerNote}

Read first:
1. ${dir}/finding.json — the finding (symptom, TS quote, SRD quote, actual, expected, evidence).
2. ${dir}/context.json — the run error, failed step and the run's DETAIL lines (refs, vehicle numbers, IDs used).
3. .claude/skills/eauto-qa-issue-ticket/SKILL.md — "Title format" and "Description format" only (you write the text; the dashboard builds the coloured ADF).
4. The Scout study and Jira capture for ${key} (listed above) — module path and the parent's "[eAuto - <Area>]" prefix.

Answers from Faizuddin's form (use as given; do not change them):
1. Environment: ${form.environment ? `"${form.environment}"` : "not given — take it from the run DETAIL lines or the study; if unsure write \"[unconfirmed]\" and ask"}
2. Module: ${form.module ? `"${form.module}"` : "not given — write the page path as eAuto > <Portal> > <Page path>"}

Write ${dir}/issue-draft.json, JSON only, in this shape:
{
  "parent": "${key}",
  "title": "[eAuto - ${area ?? "<Area>"}] <plain symptom a user would see, not internals>",
  "environment": "<e.g. staging/eauto>",
  "module": "eAuto > <Portal> > <Page path>",
  "stagingIds": ["<label = value, e.g. Ref No = BR69005758>", "..."],
  "steps": ["<3 to 5 short steps to reproduce>"],
  "actual": "<the symptom in a few words, e.g. Invoice still shows 1 line>",
  "expected": "<the correct result + short SRD reference, e.g. Shows 2 lines (SRD v1.2 §2.2.5)>"
}

Rules:
1. Title: plain words; put IDs, URL params and DB details in stagingIds, never in the title.
2. Actual: a few words, no explanation. Wrap the key failing words in !!double exclamation marks!! (shown in red).
3. Expected: the correct result; wrap the key words in ++double plus signs++ (shown in green); end with the SRD reference from finding.json (or "per TS ${f.ts}" when the SRD says nothing).
4. stagingIds: only IDs that appear in context.json, the evidence or the finding. Never invent one. Empty list if none.
5. Steps: 3 to 5 lines, verb first, starting from the page a developer opens.

Final message (chat reply): the title and one line each for Actual and Expected, numbered. Add "## Questions for Faizuddin" only for something you could not find.`;

    return { prompt: joinPrompt(header("scout", ticket, task), STYLE_RULES, ASK_RULES) };
  },

  async finish(ctx, { ok, text }) {
    const { ticket } = ctx;
    const input = ctx.input ?? ctx.job.input ?? {};
    const key = ticket.key;
    const f = input.findingId ? readFinding(key, input.findingId) : null;
    if (!f) return;
    const raw = readJson(path.join(PIPE_DIR, "findings", key, f.id, "issue-draft.json"), null);
    const form = f.raiseForm ?? {};
    let note;
    if (raw && typeof raw === "object" && str(raw.title)) {
      const title = str(raw.title, 250);
      const draft = {
        parent: key,
        title: /^\[eAuto\b/i.test(title) ? title : `[eAuto - ${areaOf(ticket.title) ?? "eAuto"}] ${title}`,
        environment: str(form.environment || raw.environment, 80),
        module: str(form.module || raw.module, 200),
        stagingIds: strList(raw.stagingIds, 10, 200),
        steps: strList(raw.steps, 8),
        actual: str(raw.actual, 500),
        expected: str(raw.expected, 500),
        ...(PRIORITIES.has(form.priority) ? { priority: form.priority } : {}),
        ...(form.developerAccountId ? { developerAccountId: form.developerAccountId } : {}),
        attachments: [...(f.evidence ?? []).map(e => e.image), ...(f.srd?.image ? [f.srd.image] : [])].filter(Boolean),
      };
      // Night round 28: advisory draft checks (invented IDs, long Actual, missing marks / source).
      const dir = path.join(PIPE_DIR, "findings", key, f.id);
      // The finding without any earlier draft (a redraft must not "find" the IDs it wrote last time).
      const { issueDraft: _old, draftWarnings: _oldW, ...findingOnly } = f;
      void _old; void _oldW;
      let contextText = "";
      try { contextText = fs.readFileSync(path.join(dir, "context.json"), "utf8"); } catch { /* none */ }
      const evidenceText = `${JSON.stringify(findingOnly)}\n${contextText}`;
      const draftWarnings = lintDraft(draft, evidenceText);
      writeFinding({ ...f, issueDraft: draft, ...(draftWarnings.length ? { draftWarnings } : { draftWarnings: undefined }) });
      if (draftWarnings.length) {
        appendChat(key, "scout", { from: "system", jobId: ctx.job?.id, text: `Draft check for ${f.ts} (advisory, the Raise is not blocked):\n${draftWarnings.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\nAsk Scout to fix them, or raise as it is.` });
      }
      note = hasQuestions(text) ? "Has a question about the QA-Issue draft" : `QA-Issue draft for ${f.ts} ready to review${draftWarnings.length ? ` (${draftWarnings.length} draft note(s))` : ""}`;
    } else {
      note = "Could not write the QA-Issue draft";
    }
    updateTicket(key, t => {
      t.events = [{ at: nowIso(), text: raw ? `Scout drafted the QA-Issue for ${f.ts}` : `Scout could not draft the QA-Issue for ${f.ts}` }, ...(t.events ?? [])].slice(0, 100);
      t.characters = t.characters ?? {};
      t.characters.scout = { ...(t.characters.scout ?? {}), state: ok && raw ? "waiting" : "error", note };
      return t;
    });
  },
};

export default action;
