# Test scripts — where scope comes from, and how they're written

## The rule that governs everything below: write short

**Simple, short, straight, concise.** A test script is read by someone executing
it under time pressure, not by someone who wants the reasoning. Every word that
is not needed to perform the step or judge the result is noise, and drafts have
repeatedly been rejected for being too wordy.

Targets: **a step is one short line, verb first** (aim under ~10 words); **a
scenario is one line**; **an expected result is one line per surface**.

| Don't | Do |
|---|---|
| `Create a new eAuto insurance transaction as a UCD and complete payment` | `Login to eAuto as UCD` / `Create new insurance transaction` |
| `Proceed Pre-Application flow until payment page` | `Login to eAuto as Main UCD` |
| `Locate an existing eAuto insurance transaction created BEFORE this CR by a Main UCD` | `Locate existing eAuto transaction` |
| `Open CIBO > Transaction Management Listing and locate the transaction` | `Go to Transaction Management Listing` |
| `UCD Name is populated on existing transactions, not blank - the change applies retroactively` | `UCD Name column and full name displayed between UCD and Vehicle No (listing & excel)` |
| `It is not blank, not "N/A", and not any eAuto or Secarang user name` | `UCD Name column and "-" displayed between UCD and Vehicle No` |

What to cut, specifically:

- **Don't say what the result should NOT be.** State the expected value once.
  Three negations do not make an assertion stronger.
- **Don't explain why inside a step.** The reason belongs in the objective or
  remark, if anywhere.
- **Don't restate the ticket** in a scenario or an expected result.
- **Drop filler adjectives** — "brand-new", "genuinely", "exactly", "actually",
  "successfully".
- **Don't split one action across two steps**, and don't merge two into one.
- **No preambles or headings inside cells** — no `Ensure:`, no bold titles, no
  sub-headings, no indentation.

If a case needs a paragraph to explain itself, the case is wrong, not the
wording. `[from QA team, 2026-08-13]`

## A TS is a guide: expected results check only what the CR changes (2026-10-19)

A TS tells the tester **what to cover and how to reach it**. It is not a full
specification of every screen on the way. More detail means more to check by
hand and more places for the TS itself to be wrong. Faizuddin, 2026-10-19: "the
TS should just be a guide for the user on what to cover, and how to test those
scenarios. no need to do detailed, because if so, i will need to check everything
manually, since more details means more places for it make mistakes." `[user rule]`

1. **Steps** take the tester through the path that triggers the change (the
   chatbot purchase, the invalid-TIN UCD, the resubmit). Keep them.
2. **Expected results** check **only the thing the CR changes** on that path —
   for EAINT-12412, the 2-line invoice / e-Invoice and its total. Do not add
   checks of existing behaviour the tester merely passes through.
3. **Worked example — Faizuddin's own edit of the 12412 TS v2, 2026-10-19:**

   | TS | Removed (existing behaviour on the path) | Kept (the change) |
   |---|---|---|
   | 12412_TS02 Wholesale | Chatbot price "RM20 excluding SST"; payment page RM20.00 + SST RM1.60; chatbot confirmation message | Invoice line 1, line 2, Total Payable RM21.60; e-Invoice same 2 lines and total |
   | 12412_TS10 invalid TIN | "Only [Invoice] is shown"; the valid-TIN notation | Invoice line 1, line 2, Total Payable RM21.60 |

4. **What stays even though it is not the change:** a check the SRD itself
   states for this CR (12412_TS01 "Price still shows RM20.00 + 8% Service Tax" —
   SRD out-of-scope item 4) and a check that proves the path really happened
   (12412_TS07 "Tx Status Approved" after Resubmit).
5. **Approved model:** `_reference/tickets/EAINT-12412/New 19_10_26 - EAINT-12412 - … .xlsx`
   (Faizuddin's edited version, 2026-10-19) — copy its shape: short steps, one
   line per check, values only where the CR is about those values, rows
   auto-fitted, Test Result column "Not Started" with the Pass / Fail / Not
   Started / In Progress dropdown.

## Scope comes from the BA testing plan, not just the ticket

A ticket's description says what was *requested*. The **BA testing plan** — a
Teams/OneNote-style block headed with the ticket key — says what is actually
being **built and tested**, and it wins where the two disagree.

A plan carries: `To deploy on`, `Test Env`, `BA`, `QA`, an estimate in
**mandays** (typically *1 day = 0.5 base + 0.5 buffer* for a small CR), a
**Testing Scope > Changes** list, and a numbered **Test Scenarios** list.

**Plans get edited in place, and struck-through text is meaningful.** EAINT-11934's
plan has its Transaction Management Listing line struck out and replaced with
*"Will NOT show UCD Name column for now due to difficulty on Dev side… To work on
this in separate ticket"* — that single edit is what created EAINT-12058. Read the
strikethroughs; they record descoping decisions that appear nowhere in Jira.

Treat a plan as **new coverage information**, not an instruction to rewrite an
existing script. Report the deltas and let the QA decide what to apply.
`[from BA testing plans EAINT-11934 / EAINT-12058, 2026-08-13]`

## Where the file lives, and what it's called

One folder per ticket under `_reference/tickets/<KEY>/`, holding every document
for it. The script itself is named **`<TICKET-KEY> - <Jira summary, status emoji
stripped>.xlsx`**:

```
EAINT-12058 - [CIBO-Transaction Listing] Add UCD Full Name & Login ID columns to Transaction Listing.xlsx
```

**Copies for Faizuddin's SharePoint go in his personal OneDrive, one folder per
ticket.** Create a folder named with the bare ticket key (`EAINT-XXXXX`, no
summary, no emoji) inside the main folder `eAuto Documents` —
`C:\Users\Faizuddin\OneDrive - MODE FAIR SDN BHD\eAuto Documents\EAINT-XXXXX\` on
this PC — and copy the file inside. **Not** the QA Team SharePoint site — that
was tried first and he had it removed. `[from Faizuddin, 2026-10-21]` First
applied to the EAINT-12153 and EAINT-12257 workbooks, 2026-10-21.

No version suffix — the folder holds the current script. A superseded copy kept
for comparison gets ` (superseded v0.1)` appended.

**Updating a file in the OneDrive ticket folder (2026-10-29).** The pipeline's "never overwrite" rule for that folder only guards the copy step: "that rule was placed there to make sure nothing is lost during the transfer process" `[Faizuddin, dashboard chat to Elf, 2026-10-29]`. He asked for characters to be able to update files there ("can you update that rule,s o you can do those things in that folder?", same chat). So an update replaces the file under the same name, with the old copy kept somewhere safe first, matching "No version suffix" above. Delete and rename were not asked for `[unconfirmed]`.

## Case numbering

Ticket number only, never a project prefix. Numbers come from the scenarios
themselves — a scenario that is dropped or stays manual leaves a **gap** rather
than renumbering everything after it.

**TS numbers run ascending in sheet order, with no gaps (2026-10-19).** When rows
are added or moved, renumber every row top to bottom (TS01, TS02, …) — never keep
old numbers and slot new rows into sections out of order. Faizuddin, 2026-10-19,
on the 12412 TS v2 reading 01, 02, 10, 11, 03 …: "why is it not ordered correctly,
ascending?" A renumber also renames the automation test titles and env vars and
the dashboard rows; record an old→new map in the ticket's NOTES.md, because
evidence from earlier runs keeps the old names. Worked example: EAINT-12412
(NOTES.md "TS renumbered ascending"). `[user rule]` This supersedes the "leave a
gap" line above for scripts that are still being drafted.

The current format is **`<ticket>_TS<NN>`** (`11934_TS01`) — see the house style
below. Older scripts in `_reference/tickets/` use `<ticket>_TS_<NN>`
(`12058_TS_01`); leave those as they are, but write new ones the current way.
EAINT-11864 was renamed to the current form on 2026-08-17, so its script reads
`11864_TS01`–`11864_TS12`.

## House style — follow this unless told otherwise

The reference example is Maisarah's executed EAINT-11934 script. **New scripts
copy its wording, sentence length, simplicity and format.**

| TS No. | Scenario | Test Steps | Expected Result | QA | Test Result | Remark |

Note the exact headers: **TS No.** (not "Test Case ID"), **Test Result** (not
"Status (Pass/Fail)"), **Remark** singular. **Steps live in their own column** —
they are not bundled into the scenario cell.

Header row: bold white on solid `FF1F4E78`. Every cell wraps, aligned top.

### TS No.

`<ticket-number>_TS<NN>` — `11934_TS01`, `11934_TS05`. **No underscore before the
number, and the number padded to two digits.**
`[from QA team, 2026-08-17 — the earlier unpadded `11934_TS1` form is superseded]`

### Scenario — one short line

A single plain sentence naming the condition and the expected outcome. No bold
title, no "Negative —" prefix, no steps.

```
New transaction eAuto shows UCD full name (Main UCD)
New transaction eAuto shows UCD full name (Sub UCD)
Existing transaction eAuto shows UCD full name
New transaction Secarang shows "-"
Existing transaction Secarang shows "-"
```

The shape is `<New|Existing> transaction <system> shows <expected value>
(<variant>)`. Variants that differ only by role go in brackets.

### Test Steps — terse and numbered

Plain numbered lines, imperative, as short as they can be while still
followable. No indentation, no bold, no sub-headings.

```
1. Login to eAuto as Main UCD
2. Create new insurance transaction
3. Login to CIBO
4. Go to Transaction Management Listing & Payment Report
5. Export excel
```

"Login to X", "Create new insurance transaction", "Export excel" — not
"Proceed with the Pre-Application flow until the payment page".

### Expected Result — one numbered line per surface

```
1. Transaction Listing Management -> UCD Name column and full name displayed between UCD and Vehicle No (listing & excel)
2. Payment Report -> UCD Name column and full name displayed between UCD and Vehicle No (listing & excel)
```

The shape is `<Surface> -> <what> displayed <where> (listing & excel)`. Use the
arrow `->`. **State the position** of a new column relative to its neighbours,
and cover the screen and the export in the same line rather than splitting them.
No `Ensure:` heading.

### QA, Test Result, Remark

QA is a person's name. Test Result is `Pass` / `Fail`. Remark is free text and is
where a known-data caveat goes — e.g. *"Records before 2025 don't show the UCD
Name because of the migration done previously."*

### Not part of the house style

- **No Test Objective column.** One was added to EAINT-12058 on request because
  readers outside the team could not see why each case existed; it is not the
  default.
- The rich-text style used on the EAINT-12153 script — bold title, underlined
  `Pre-Application` / `Ensure` headings, three-space-indented steps — is a
  different, older shape. Don't reach for it on a new script.
- **The team's blank template and most 2025 scripts use another shape.**
  `[TEMPLATE] EAINT-XXXX - XXXX.xlsx` opens with three header rows
  "Ticket(s):", "Test environment:", "Test objective:" and uses the columns TS No
  / Priority / Test Objective / Entry Point / Pre-Requisite / Test Scenarios /
  Expected Result / QA / Test Result / Remarks. Recognise it when reading past
  scripts; new scripts still follow the house style above.
  `[from SharePoint TS #126 [TEMPLATE] EAINT-XXXX, sheet EAINT-8652, meta rows 1-5]`
  `[from SharePoint TS #068 EAINT-8564, sheet EAINT-8564, rows 1-7]`
- **Bigger 2026 scripts add an "Overall Progress" / "Progress Tracker" sheet**
  with auto-counted Pass/Fail/Pending per sheet, and sometimes a "Configuration"
  sheet with environment and accounts.
  `[from SharePoint TS #010 EAINT-10937, sheet Progress Tracker]`
  `[from SharePoint TS #036 EAINT-12180, sheet Overall Progress]`

### Where past CR scripts live

SharePoint `1. eAuto Project/eAuto - CR Test Scenarios/` and
`2. Secarang & CIBO Project/Enhancement CR Test Scenario/`. Local copies sit
under `_reference/sharepoint/`; the index is
[cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md).
`[from SharePoint sweep, 2026-10-16]`

### Bullets inside a cell

**Numbered lines for steps and expected results.** Where you genuinely need a
bullet inside a cell, write it as **space-dash-space** — `" - item"`.

The leading space is the point: **a cell starting with a bare `-` is parsed by
Excel as a formula**, so `- item` breaks. ` - item` does not.
`[from QA team, 2026-08-14]`

`[from QA team, Maisarah's EAINT-11934 script, 2026-08-13]`


## In-cell emphasis — bold and colour inside Steps / Expected Result

Set by Faizuddin on 2026-10-15 after the S34.X workbooks came out plain. The
reference is the earlier EAINT-12107 script kept at
`_reference/inbox/Ex - EAINT-12107 - ⚪[Secarang-Fiuu] Enhance Payment Gateway
to Enable ShopeePay and GrabPay.pdf` (bold page names and `[Buttons]`, green
"Success"/"Paid", red "Failed"). The rule, verbatim: "bold the pages/buttons
to click | if something should not be done or should not appear (anything
negative), bold it in red | if something is expected to pass, make it bolded
green | for statuses, just bold it black | (other than this will come later
as we do or TS". `[from Faizuddin, 2026-10-15]`

| What | Style | Example |
|---|---|---|
| Page, screen, menu path, button, field, column or filter option the tester acts on | **bold black** | **Transaction Management > Transaction Listing**, **[Search]**, **Payment Channels** |
| Something that must not happen, must not appear, or must not be done | **bold red** | **Does not contain "EW"**, **Transaction from TS05 not displayed** |
| An outcome expected to pass or succeed | **bold green** | **Success**, **"OK"**, **Approved** |
| A status or state value, neither pass nor fail | **bold black** | **"Failed"** as a search input, **"-"** |
| Everything else | plain | amounts, descriptions, quoted display text that is neither a control nor an outcome |

Buttons are written in square brackets inside the bold: `**[Pay]**`,
`**[Export]**`. A negative outcome that is also a status ("Failed" as the
expected result of a failed-payment case) is bold red, since it is the
negative outcome under test.

How it is produced: the draft-TS-excel build script turns inline marks into
Excel rich text. `**text**` = bold black, `++text++` = bold green,
`!!text!!` = bold red. The marks live only in the spec JSON; the workbook
shows styled text with no marks. More rules will be added as later TS are
written.


### Exact values read from the reference workbook (2026-10-15)

Source: `_reference/tickets/EAINT-12107/EAINT-12107 - [Secarang-Fiuu] Enhance
Payment Gateway to Enable ShopeePay and GrabPay (superseded v0.1, Faizuddin
2026-09-15 draft).xlsx`, read cell by cell with exceljs. `[verified: file
read, 2026-10-15]`

In-cell runs (Calibri 11):

| Run style | ARGB | Seen on |
|---|---|---|
| bold black | `FF000000` / `FF0D0D0D` | page names ("Select Payment Method page"), `[Pay]`, `[Search]`, field names, "Payment Status =", "Fiuu GrabPay" |
| bold green | `FF00B050` | "Successful", "Success", "Paid", "PayLater by Grab" (the method under test) |
| bold red | `FFFF0000` | "Failed" (every occurrence) |
| bold dark red / blue | `FFC00000`, `FF2F75B5`, `FF4472C4` | insurer names (Lonpac, Tokio Marine). Ad hoc; no rule given yet |
| italic grey | `FF757171` | a note in brackets inside a step |
| underline | plain | the word "Ensure" as a heading |

Expected Result cells in that draft are grouped by page: a bold page-name line,
then numbered checks, blank line, next page. There is no "Ensure:" prefix.

Whole-sheet layout of that draft (differs from the generator's 7-column
layout):

| Item | Value |
|---|---|
| Columns | TS No. \| Scenario \| Secarang Steps \| Secarang Expected Results \| CIBO Steps \| CIBO Expected Results \| QA \| Status (Pass/Fail) \| Remarks (9 columns, one Steps/Expected pair per portal) |
| Title row | merged A1:I1, Calibri 14 bold, fill `FF91CCFF`, height 24.75 |
| Header rows | 2 rows (portal group, then Steps / Expected Results), bold 11, fill `FF91CCFF`; portal groups `FF00B0F0` (Secarang) and `FFFFFF00` (CIBO) |
| Column widths | 15.7, 24.3, 54.1 ×4, 15.7 ×3 |
| Data cells | TS No. and Status centred + middle; Scenario left + middle; Steps/Expected top + wrap; row heights were set by hand (30.75 to 290.25) in the original — new or edited rows get NO stored height so they auto-fit (see "Row height" rule below) |
| Status default | "Not Started" bold; dropdown `Pass,Fail,Not Started,In Progress`; CF green `FFC6EFCE`/`FF006100` on Pass, red `FFFFC7CE`/`FF9C0006` on Fail (bold italic) |
| Section banner | "REGRESSION" merged A:I, fill `FF7030A0`, white bold 13 |
| Borders | thin black left/right only on data cells |
| Sub-rows | one TS split over several rows (TS06 rows 9–15), TS No. and Scenario merged down |

The generator keeps its 7-column layout (`#1F4E78` title, `#0070C0` lettered
banners, "Verify" objective, "Ensure:" prefix, N/A default) unless Faizuddin
asks to switch. The in-cell run colours above are already the generator's
values.


**Decision 2026-10-15 (Faizuddin):** keep the generator's 7-column layout. The
9-column per-portal layout, light-blue headers, purple REGRESSION banner and
insurer-name colours in the v0.1 draft above are a special case for that
ticket, not house style. Only the word-level rule (bold black / bold red /
bold green) carries over. `[from Faizuddin, 2026-10-15: "keep generator's 7
column layout, since the one i gave you for refence is a special case. the
colours are also special case. so just follow the words' visual formatting"]`

## Sizing

Size the script to the change. Merge cases that share a setup, fold generic
regression (search / sort / pagination / export) into the happy path rather than
giving it its own row, and cut anything a question to the developer would answer
faster than a test. Keep negatives that target a specific likely defect; drop the
ones that merely enumerate possibilities. A 1-manday CR does not need eight cases.

If the scope has a shape a black-box technique targets — a ranged/boundaried
field, several conditions combining into one outcome, or a status field with
branching transitions — see [test-design-techniques.md](test-design-techniques.md)
for generating candidate cases systematically instead of by guesswork. Don't
reach for one on a scope that doesn't have that shape; it adds cases, not clarity.

## An executed script is a snapshot, not a standing statement

A completed script records what was true **on the day it was run**. Scope can
change after the run, and the script does not get updated — EAINT-11934's shows
the Transaction Management Listing passing, and that surface was subsequently
pulled from the deployment and moved to EAINT-12058.

So when reading an old script: check its results against what actually shipped
before treating a Pass as a baseline. A Pass on a surface that was later
descoped tells you the behaviour once worked, not that it is live.
`[from QA team, EAINT-11934, 2026-08-13]`

**Assert on the page, not on the sheet's wording.** The EAINT-12153 sheet carries
the typo "Unsuccessfull Payment" in every failure expected-result cell;
EAINT-12414's Jira text spells it "Unsuccessful Payment - Something went wrong and
your payment didn't go through. Please choose a payment method and retry."
`[from payment-channels study, 2026-10-15: EAINT-12153 sheet; Jira EAINT-12414]`

## Three things that are always worth a row

- **Historical data.** A new column meeting rows that predate it — backfilled or
  blank? The rule is rarely stated, and it decides the expected result for every
  old record.
- **A related ticket already in production.** If this CR reworks something an
  earlier ticket depends on, that earlier scope is a regression target. Say so in
  Remarks, including when it went live, so the reader knows it is regression
  rather than new functionality.
- **Test data that must exist before a price push.** Fee-change CRs mark rows
  whose test data "MUST be created BEFORE Dev pushes the new price". That data
  cannot be reproduced after the push, so create it first.
  `[from SharePoint TS #042 EAINT-12403, sheet APT, row 8]`

## Row height — every TS workbook row auto-fits (2026-10-19)

Every TS workbook, generated or hand-edited, must leave its header and data rows
to auto-fit their height. Faizuddin, 2026-10-19: "the cells must format to
autofit row height". `[user rule]`

1. **How Excel behaves:** it auto-fits a wrapped row when it opens the file only
   if the file stores **no height** for that row. Any stored height (`<row ht=…
   customHeight="1">`) locks the row at that value. `[verified: Excel 365 via COM,
   2026-10-19 — rows without a height opened at 90–375 pt to fit their text; a row
   stored at 20 pt stayed at 20 pt]`
2. **Generator** (`.claude/skills/draft-TS-excel/scripts/build-workbook.mjs`):
   writes no height on the header row or data rows. Only the merged title and
   section-banner rows keep a fixed height — Excel cannot auto-fit merged cells.
3. **Editing an existing workbook with exceljs** (adding rows, changing text):
   set `row.height = undefined` on every row you add or change. That removes
   the stored height (`ht` is dropped from the XML — verified 2026-10-19). Do not
   copy a neighbour row's height onto a new row.
4. **Merged data cells** (e.g. one TS split over several rows with TS No. merged
   down) do not auto-fit; the unmerged cells in the same row still drive the
   height, so keep the long text in unmerged columns. `[unconfirmed: standard Excel behaviour, not tested here]`

## TS numbering in a combined workbook — one running sequence (2026-10-19)

When one workbook covers several tickets tested together, the TS numbers run on
across tickets; each ticket does **not** restart at TS01. The prefix still names
the ticket that owns the scenario. Faizuddin, 2026-10-19: "take note of the
numbering style. this is also the default style." `[user rule]`

1. **Example** (EAINT-12107 + EAINT-12327 combined TS, "New 20_10_26" workbook (current; 19_10_26 is superseded v2)):
   `12107_TS01` … `12107_TS10`, then `12327_TS11` … `12327_TS19` — not
   `12327_TS01` … `12327_TS09`. (Was TS09 / TS10–TS18 until 12107_TS10 Cancelled ShopeePay was added, 2026-10-20.)
2. **Section banners do not reset the count.** REGRESSION, CANCELLED PAYMENT and
   the second ticket's banner all sit inside the one sequence.
3. **Cross-references follow the new numbers.** Any "see 12327_TSnn" / "Use the
   transactions from 12327_TSnn" in Steps, Expected or Remarks must point at the
   renumbered id.
4. **Automation titles** (`<TICKET>_TSNN: …`) mirror the workbook ids; when a
   workbook is renumbered, the spec titles and dashboard scenario list need the
   same change, or they no longer match.

### TS numbers are always two digits (2026-10-22)

`TS01`, never `TS1` — in workbooks, automation ids and titles, evidence filenames and zip names. Faizuddin: "always start with TS01, not TS1. easier for sharepoint to arrange the files with this type of numbering". 12153 / 12257 automation converted the same day (`12153_TS01` … `12153_TS12`, `12257_TS01` … `12257_TS13`).

## Ideas from Charmain's repo for scoping a TS (2026-10-27)

From `_reference/codebases/eauto-qa-charmain/` (her Playwright repo's scenario-ledger rules). Full study: [charmain-qa-repo.md](charmain-qa-repo.md). These shape **scope**, not house style — the short-wording rules at the top of this file still apply.

1. **Stated vs Investigated.** Keep what the requestor/SRD **said** apart from what was **concluded** from code, a doc or an old script. A concluded point is a question, never a requirement. `[charmain-repo: .claude/skills/ticket-intake/SKILL.md:28-55]`
2. **A scenario is a case, not an assertion.** Same trigger + same setup = one TS with several expected lines. Split only where role, portal or module differs. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:78]` Matches "Merge cases that share a setup" under Sizing.
3. **Ticket scope vs regression.** Unchanged behaviour already covered by an earlier TS → list that TS as regression, not a new row. Unchanged behaviour with no TS → a separate regression-gap row (R1, R2…), never mixed into the CR's own count. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:80]` `[charmain-repo: test-scenarios/README.md:139-161]`
4. **Grade by who bears the risk.** P1 = payment taken, ownership transferred, a record a role can no longer see, cross-company leakage, approval bypass, an unrecallable JPJ submission. "If most entries are P1, the grading carries no information." `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:77]` `[charmain-repo: .claude/agents/scenario-reviewer.md:127]`
5. **Cap around 40 scenarios per subject**; split by flow or portal, never by priority. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:83]`
6. **Roles named as roles** (Officer, Dealer, CSE), never login IDs, in scenario text. `[charmain-repo: test-scenarios/README.md:184-186]`
7. **Conflict — TS numbering in evidence folders:** the QA Team evidence library uses `TS<n>` with **no zero-padding** (`TS9`) `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:115]`. Faizuddin's rule above (`TS01`) stands for his workbooks and evidence.
