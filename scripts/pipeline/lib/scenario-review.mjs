// Scenario self-review and lint for Elf (2026-10-27, night enhancement round 2).
//
// Charmain's QA repo reviews every drafted scenario list adversarially before
// anything is built [charmain-repo: .claude/agents/scenario-reviewer.md:44-215]
// and derives coverage per requirement along ten dimensions
// [charmain-repo: .claude/skills/scenario-ledger/SKILL.md:46-83]. Here that
// becomes (1) a self-review block in Elf's prompts, sized to Faizuddin's
// "keep TS lean" rule, and (2) a mechanical lint finishScenarios() runs on
// scenarios.json: warnings go to Elf's chat, and before the green light the
// fixable ones get ONE automatic elf:chat fix job (input.lintFix).

/** Prompt block: Elf reviews her own draft before finishing. */
export const SCENARIO_REVIEW_RULES = `Self-review before you finish (a skeptical senior QA reviewing someone else's draft; from another QA's scenario reviewer, sized to "keep it lean"):
1. **Every expected result has a source.** Put it in the TS "basis": the SRD section / REQ id, the Jira field or comment (author + date), the official TS row, the mock-up, or Faizuddin's answer. If the only source is what the code does or what the screen shows today, it is NOT an expected result: move it to "## Open points" as a question. Where the source and today's system disagree, the TS asserts the source.
2. **Walk the changed rules, not the screens.** For each rule the ticket changes, think through: positive (it fires), negative (conditions unmet: it must NOT fire), each exemption, boundaries (at / just inside / just outside a limit), every variant the ticket names (each module, transaction type, payment channel, vehicle class: no stand-ins), roles (each role the rule touches, checked from that role's own screen), independence (dealer A's data never shows for dealer B), exactly-once (double click / retry makes one record), aftermath (the next transaction is normal). Add a TS only where the change could really break that way; list the dimensions you left out, with a few words why, under "## Self-review" in scenarios.md (max 6 short lines).
3. **A TS is a case, not a check.** Two TS with the same trigger and the same setup that differ only in what they check are ONE TS with more Expected lines. Split only when the role, portal or module differs.
4. **Ticket scope only.** Behaviour the ticket does not change is not a TS (the tester only passes through it). If unchanged behaviour could still break because of this change, list it under "## Regression gaps" in scenarios.md, numbered R1, R2 … (what could break, and the past QA Team TS from the related history that covers it, or "no TS"), never mixed into the TS list (round 24, [charmain-repo: .claude/skills/scenario-ledger/SKILL.md:80]).
5. **Visible to a user.** Every expected line names the screen where a person sees it (UCD / BO / Service Portal page, a downloaded file's contents, an email). Never a database row or an API response.
6. **Specific enough to fail.** Each expected line must be false on a plausibly broken build: the old behaviour, the neighbouring control, the other role's view. Write "**Status** shows **Approved**", never "status is updated", "works correctly", "handled properly", "as expected", "displayed correctly".
7. **The setup can reach the rule.** The role, data and path in the steps must actually produce the condition the expected line checks (no check of a restriction from a role that has full access anyway).
8. **The project's words.** Name screens, statuses, buttons and modules as the ticket, SRD or knowledge/ name them. Never coin a new name.
9. **Size.** More than 40 TS: split by flow or portal and say so in Open points.
10. **Priority by who bears the risk** (round 24): give each TS "priority" P1, P2 or P3. P1 = money taken or refunded, ownership or a record transferred, a record shown to a role / company that must not see it, an approval bypassed, a submission that cannot be recalled (JPJ). P2 = the ticket's main rule otherwise. P3 = wording, layout, convenience. Faizuddin runs P1 first when time is short.`;

const VAGUE_RE = /\b(works?|working|functions?)\s+(correctly|properly|fine|as (expected|intended))\b|\bhandled\s+(correctly|properly)\b|\b(as expected|as intended)\b|\b(displayed|shown|updated|saved|processed)\s+(correctly|properly|successfully)\b|\bno issues?\b|\bshould work\b|\bis updated\b/i;
const ARROW_RE = /->|→|⇒/;
/** Round 20: a basis that only describes today's system ("code" / "obs" provenance). */
const OBSERVED_RE = /\b(source code|the code|in code|codebase|\.jsp\b|controller|observed|seen on|as seen|screenshot of (the )?(current|staging|live)|current(ly)? (behaviou?r|system|screen|page)|today'?s (screen|system|page)|existing behaviou?r|staging (shows|currently)|live (screen|page) shows|as is\b)/i;
/** A real requirement source in the same basis keeps it. */
const SOURCE_RE = /\b(SRD|REQ[-\s]?\d|§|section|Jira|comment|official TS|TS row|mock-?up|Figma|Miro|answered|Faizuddin|BA\b|requestor|ticket description)/i;
const norm = s => String(s ?? "").toLowerCase().replace(/[*+!]{2}/g, "").replace(/\s+/g, " ").trim();

/**
 * Mechanical lint of a valid scenarios.json list.
 * opts.official: an official TS exists (its ids and wording win: no arrow
 * rule, no merge suggestion). Returns { warnings: [{id, kind, text, fixable}] }.
 */
export function lintScenarios(list, opts = {}) {
  const warnings = [];
  const add = (id, kind, text, fixable = true) => warnings.push({ id, kind, text, fixable });
  if (list.length > 40) add("*", "size", `${list.length} TS — over 40; split by flow or portal`, false);
  const seenTitle = new Map(), seenSteps = new Map();
  for (const s of list) {
    if (s.manual) continue;
    const expected = (s.expected ?? []).filter(e => String(e).trim());
    if (!expected.length) add(s.id, "no-expected", "no Expected lines");
    for (const e of expected) {
      const m = String(e).match(VAGUE_RE);
      if (m) add(s.id, "vague", `Expected "${String(e).slice(0, 120)}" is too vague to fail ("${m[0]}"): name the screen and the exact value / status / message`);
      else if (!opts.official && !ARROW_RE.test(String(e))) add(s.id, "no-screen", `Expected "${String(e).slice(0, 120)}" does not name the screen ("<Screen> -> <What is seen>")`);
    }
    if (!String(s.basis ?? "").trim()) add(s.id, "no-basis", "no basis: say where the expected results come from (SRD section / REQ, Jira, official TS row, his answer)");
    // Round 20: a basis that is only today's screen or code is an observation, not a requirement
    // ("code" and "obs" never gate) [charmain-repo: docs/writing-tests.md:107-124], principle 17 [charmain-repo: docs/qa-principles.md:168-181].
    else if (OBSERVED_RE.test(String(s.basis)) && !SOURCE_RE.test(String(s.basis))) {
      add(s.id, "observed-basis", `basis "${String(s.basis).slice(0, 100)}" is what the screen / code does today, not a requirement: move the expectation to "## Open points" as a question, or cite the SRD / Jira / official TS / his answer`);
    }
    // Round 24: a note only (not fixable): older lists have no priority. lintAfterElf collapses these into one line.
    if (!s.priority) add(s.id, "no-priority", "no priority (P1 / P2 / P3 by who bears the risk)", false);
    const t = norm(s.title);
    if (seenTitle.has(t)) add(s.id, "duplicate", `same title as ${seenTitle.get(t)}`);
    else seenTitle.set(t, s.id);
    const steps = (s.steps ?? []).map(norm).join(" | ");
    if (!opts.official && steps && (s.steps ?? []).length >= 2) {
      const k = `${norm(s.section)}§${steps}`;
      if (seenSteps.has(k)) add(s.id, "same-setup", `same section and identical steps as ${seenSteps.get(k)}: one case with more Expected lines, unless the role/portal/module differs`);
      else seenSteps.set(k, s.id);
    }
  }
  return { warnings };
}

/** Numbered text of the warnings, grouped per TS, for a chat note or prompt. */
export function lintSummary(warnings, max = 30) {
  const lines = warnings.slice(0, max).map((w, i) => `${i + 1}. **${w.id}** ${w.text}`);
  if (warnings.length > max) lines.push(`${max + 1}. … ${warnings.length - max} more`);
  return lines.join("\n");
}

/** Opening of the automatic fix chat (elf:chat with input.lintFix). */
export function lintFixTask(warnings) {
  return `The dashboard's scenario check (scripts/pipeline/lib/scenario-review.mjs) found these problems in scenarios.json. This is NOT a message from Faizuddin:

${lintSummary(warnings)}

Fix them in BOTH scenario files (scenarios.json and scenarios.md, kept in step): make vague Expected lines specific (screen + exact value / status / message from the source), add the missing basis, merge same-setup TS into one (renumber so ids stay sequential and say which ids moved) unless the role, portal or module differs — then say why they stay apart. Never invent a value: if the source does not give it, put the question under "## Open points" instead. Change nothing else.`;
}
