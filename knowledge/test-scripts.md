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

No version suffix — the folder holds the current script. A superseded copy kept
for comparison gets ` (superseded v0.1)` appended.

## Case numbering

Ticket number only, never a project prefix. Numbers come from the scenarios
themselves — a scenario that is dropped or stays manual leaves a **gap** rather
than renumbering everything after it.

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

### Bullets inside a cell

**Numbered lines for steps and expected results.** Where you genuinely need a
bullet inside a cell, write it as **space-dash-space** — `" - item"`.

The leading space is the point: **a cell starting with a bare `-` is parsed by
Excel as a formula**, so `- item` breaks. ` - item` does not.
`[from QA team, 2026-08-14]`

`[from QA team, Maisarah's EAINT-11934 script, 2026-08-13]`

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

## Two things that are always worth a row

- **Historical data.** A new column meeting rows that predate it — backfilled or
  blank? The rule is rarely stated, and it decides the expected result for every
  old record.
- **A related ticket already in production.** If this CR reworks something an
  earlier ticket depends on, that earlier scope is a regression target. Say so in
  Remarks, including when it went live, so the reader knows it is regression
  rather than new functionality.
