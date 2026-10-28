---
name: draft-TS-excel
description: Generate a Test Scenario (TS) Excel workbook for any eAuto change request (CR) or ticket, in the team's house style — lettered section banners, "Verify ..."/"Ensure:" wording, exact staging/deployment terminology, Pass/Fail dropdown, and an optional Field Reference sheet. Use whenever the user asks to draft, build, or generate test scenarios / a test script / a TS workbook for a ticket, or to convert an SRD's requirements into an Excel test sheet. Ask before inventing any input value, column name, or expected result that isn't already known.
---

# draft-TS-excel

Builds a Test Scenario Excel workbook for an eAuto CR/ticket, matching the
team's house style exactly. The rules below are absolute — if the ticket or
SRD wording conflicts with them (different terminology, different column
names), **the rules in this skill win**. If something needed to write a row
is missing — an exact input value, a column name, an expected display string —
**ask the user. Never invent it.**

The actual styling (colours, borders, wrap, trailing line break, Pass/Fail
dropdown, Field Reference sheet) is implemented once in
`scripts/build-workbook.mjs`, not redone by hand each time. Your job when this
skill runs is to gather ticket content, shape it into the JSON data model
described in `references/data-model.md`, then run that script. Read
`references/data-model.md` in full before writing the spec — it has the exact
shapes for steps, expected results, and the Field Reference sheet.

## 1. Workbook layout (owned by the script — know it, don't reimplement it)

- Sheet name: `Test Scenarios`.
- Row 1: the ticket title, merged across all 7 columns, white bold on `#1F4E78`, centred.
- **TS numbers are always two digits: TS01, never TS1** (Faizuddin, 2026-10-22, so SharePoint sorts files in order).
- **Combined workbooks number TS in one running sequence across tickets** (12107_TS01–TS10, then 12327_TS11–TS19; never restart at TS01 for the second ticket). Cross-references use the new ids. See `knowledge/test-scripts.md` "TS numbering in a combined workbook".
- Row 2: headers — `TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks` — same styling as row 1.
- Section banner rows: merged across all 7 columns, white bold on `#0070C0`, left-aligned, lettered `A.`, `B.`, ... in the order you supply sections.
- `Test Result` defaults to `"N/A"` in every data row, with a `Pass/Fail/Blocked/N/A` dropdown and green/red conditional formatting on `PASS`/`FAIL`.
- Calibri 11 everywhere; thin borders on every cell; Objective/Steps/Expected Result wrapped, left+top aligned.
- **Rows auto-fit their height.** The script writes NO height for the header row or any data row, so Excel sizes each row to its wrapped text when the file opens. Only merged rows (title, section banners) keep a fixed height, because Excel cannot auto-fit merged cells. Faizuddin, 2026-10-19: "the cells must format to autofit row height". Verified in Excel the same day: rows with no stored height opened at 90–375 pt to fit their text; a row with a stored height stays at that height. **Any explicit height locks the row** — never set one on a data row.
- Every Objective/Steps/Expected Result cell ends with exactly one trailing line break — the script appends this; don't add your own.

Order sections user-facing → back-office → API → regression, or however best
suits the specific CR's flow (portal by portal is the usual shape — see any
existing ticket's workbook in `_reference/tickets/<KEY>/` for a worked
example).

## 2. Test Objective

- One sentence, starting with `"Verify "`.
- No internal-jargon words like "documented" ("shows all 29 columns", not
  "shows all 29 documented columns").

## 3. Test Steps

- Numbered, one action per line. Exact input values the tester types in —
  never a description of where to find data:
  - **Do:** `"Set 3 claims with mileage:"` + bullets `9,999 km` / `10,000 km` / `10,001 km`
  - **Don't:** `"Seed/locate claims at the boundary"`
- Nested lists use the text+bullets shape in the data model (5-space `" - "`
  prefix — the script renders this, don't hand-type it).
- Plain, tester-friendly verbs: **Set** (not seed/locate), **range** (not
  band), **Observe** (never "Record" — testers record their own screen, so
  never include a screenshot instruction either).
- Empty input = `"left blank (no value)"`, never `"null"`.
- Name the actual transaction type: `"Create new <Feature> Transaction"` —
  never `"BO transaction"` (BO is where you *look*, not what you create).
- No rationale or process notes in a step — that belongs nowhere in this
  sheet, not even in Remarks (see §7).
- Avoid awkward repeats like "Approved of Approved" — reread the sentence.

## 4. Terminology — staging vs. production, non-negotiable

- **"Deployment" means production go-live only.** Never use it for staging.
- Staging = **"pushed to staging"** — e.g. `"created before this CR was pushed to staging"`.
- **Never write "post-push."** Once staging has the change, everything tested
  from then on is implicitly post-push — just say **"new"** (new transaction,
  new value). Only distinguish with **"existing transaction"** vs.
  **"new transaction"** — never "pre-push"/"post-push" as a pair. In Expected
  Results, say "Existing values" / "Existing transaction".
- Don't design a test around a live before/after window on the *same* record
  (e.g. "screenshot right before the push, screenshot right after") — once
  staging is pushed, that window is gone for good. Compare an **existing**
  record against a **newly created** one instead.
- If there's genuinely no way to retry/resubmit something in the real UI
  (check with the user rather than assuming a Resubmit button exists) — model
  the real flow: e.g. a failed transaction usually can't be retried in place;
  a new transaction gets created for the same vehicle, and the old failed one
  stays untouched.

## 5. Expected Result

- **Check only what the CR changes.** The TS is a guide (what to cover, how to
  reach it), not a spec of every screen on the path. Steps may walk through
  existing screens (a chatbot, an invalid-TIN account, a resubmit); expected
  results do not re-check their existing behaviour. Keep a non-change check
  only when the SRD states it for this CR or it proves the path happened.
  Faizuddin removed exactly those extra checks from 12412_TS02 / TS10
  (2026-10-19) — see knowledge/test-scripts.md "A TS is a guide".
- Always `"Ensure:"` then numbered items — the script prepends this.
- State only what the tester **sees**. No reasons, no SRD section references,
  no "because/since/as today" explanations, no parenthetical justification.
- Shape: `"<Screen/Item> -> <What is seen>"`, capital letter immediately after
  `->` (it's a new sentence).
- **One check per number.** A sentence joining two checks with "and" gets
  split into two array items.
- Several related checks (columns, fields, values) under one heading use the
  nested-bullets shape, not a run-on sentence.
- New/repositioned column checks use the Column/Position/Value shape (see
  data model) — say **"Position"**, never "documented position".
- Unchanged behaviour: `"Values will follow existing behaviour:"` + bullets,
  one example value per column, e.g. `"Odometer Reading (eg. \"42,168 km\")"`.
  **Ask the user for the example value if you don't already know it** — don't
  guess what the current system displays.
- Exact UI strings go in double quotes, verbatim — never paraphrase on-screen
  text.
- Give the exact displayed value per input where possible: `"<input> displays
  \"<output>\""`.
- Open questions: mark `"(Open)"` with **no explanation attached**, and only
  when the user has actually asked you to leave something open. Don't
  manufacture open questions the user didn't flag.

## 5b. In-cell emphasis (bold / colour) — mandatory

Every Steps and Expected Result cell carries in-cell emphasis. Plain-text
cells were rejected on 2026-10-15. Rule (Faizuddin, verbatim): "bold the
pages/buttons to click | if something should not be done or should not
appear (anything negative), bold it in red | if something is expected to
pass, make it bolded green | for statuses, just bold it black".

Write the marks in the spec JSON; the script renders rich text and strips
the marks:

| Mark | Renders as | Use for |
|---|---|---|
| `**text**` | bold black | pages, menu paths, buttons `**[Search]**`, fields, columns, filter options, status values used as inputs or neutral states |
| `++text++` | bold green | outcomes expected to pass: `++Success++`, `++"OK"++`, `++Approved++` |
| `!!text!!` | bold red | anything negative: must not appear, must not happen, failed outcomes under test |

Buttons go in square brackets inside the bold. Amounts, descriptions and
quoted display text that is neither a control nor an outcome stay plain.
Further rules will be added as later TS are written; record them in
`knowledge/test-scripts.md` § "In-cell emphasis" when they are.


**Layout is fixed at the 7-column house style above.** A reference workbook a
QA hands over may use a different layout (for example the EAINT-12107 v0.1
draft: 9 columns with one Steps/Expected pair per portal, light-blue headers,
purple REGRESSION banner, insurer names in colour). Faizuddin, 2026-10-15:
that file is "a special case. the colours are also special case. so just
follow the words' visual formatting". So from any reference file take only
the word-level emphasis (bold black / red / green); never copy its layout,
header fills, banner colours or extra colours into the generator.

Reading a reference file: an `.xlsx` gives exact run and cell styles (read it
with exceljs); a PDF shows colours but not values; CSV carries no formatting.
Excel for the web's "Download as" menu has no XLSX; use File > Create a Copy >
Download a Copy, or download from the SharePoint library row.

## 6. Field Reference sheet

Only when the CR adds/changes enough fields that inlining them would bloat
every TS cell (roughly: 3+ fields, or any field with a position/rename
worth documenting once instead of N times).

- Sheet name: `Field Reference`, same header styling as the main sheet.
- Columns: `# | Field Name | Old Field Name (replaced) | Column Name |
  Position | Notes | Verified In`.
- `Column Name` = UI header text only. `Position` = `"Unchanged"` or `"New
  column, between X and Y"`. API-only field with no UI column =
  `"N/A (no column of its own)"`.
- No source/SRD-section column unless the user asks for one.
- Point to it from a TS cell's last Expected Result line:
  `"For the details, refer to the 'Field Reference' sheet."`

## 7. Process

1. **Before writing:** list the scenarios you plan, grouped by section, plus
   any assumptions you're about to make. Wait for the user's OK before
   generating anything beyond a small/obvious workbook — this mirrors how
   large TS drafts get reviewed in this team before they're built.
2. **Gather content**, asking the user for anything not already established
   by the ticket/SRD: exact input values, column names/positions not stated
   anywhere, example values for "unchanged behaviour" rows.
3. **Build the spec** per `references/data-model.md`, write it to a temp
   JSON file (the session's scratchpad directory), then run:
   ```
   node .claude/skills/draft-TS-excel/scripts/build-workbook.mjs <spec.json> <output.xlsx>
   ```
4. **Check the output** against this rule set before reporting done:
   - No `"deployment"` used for staging, anywhere.
   - No `"pre-push"`/`"post-push"` wording.
   - No `"Record"`, no screenshot instruction, no `"documented"`.
   - No `"BO transaction"` — the actual transaction/feature name instead.
   - Every `->` is followed by a capital letter.
   - Every Objective/Steps/Expected Result cell ends with exactly one
     trailing line break (the script guarantees this — spot-check a few rows
     of the actual output, don't just assume).
   - No data row or header row has a stored height (check `row.height` is undefined after reading the file back) — Excel auto-fits only rows without one.
5. **Report only what you actually checked** — if you didn't verify the
   Field Reference sheet, or didn't re-open the file to confirm row heights
   rendered sensibly, say so rather than claiming a full pass.

## Where the output goes

Follow the repo's existing test-script convention
(`knowledge/test-scripts.md`): one file per ticket under
`_reference/tickets/<KEY>/`, named `<TICKET-KEY> - <Jira summary, emoji
stripped>.xlsx`. Ask the user before overwriting an existing workbook for the
same ticket — a superseded copy gets ` (superseded vN)` appended instead of
being silently replaced.
