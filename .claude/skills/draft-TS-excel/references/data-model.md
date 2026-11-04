# spec.json data model — for `scripts/build-workbook.mjs`

Build this object, write it to a temp JSON file, then run:

```
node .claude/skills/draft-TS-excel/scripts/build-workbook.mjs <spec.json> <output.xlsx>
```

The script owns every styling decision (colours, borders, wrap, trailing line
break, Pass/Fail dropdown). Only supply content here — never hand-format text
with things like leading `-` or manual numbering; the script numbers and
indents for you from the shapes below.

## Top level

```jsonc
{
  "title": "EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0",
  "sections": [ /* see below */ ],
  "fieldReference": [ /* optional, see below */ ],
  "sheetPerSection": false /* optional */
}
```

- `title` — exactly what goes in A1: `"<TICKET> - [<project>] <ticket title>"`.
- `sections` — ordered array. The script letters them A, B, C... automatically
  from array order — don't include the letter yourself.
- `fieldReference` — omit entirely (or pass `[]`) when the CR doesn't add/change
  enough fields to warrant a separate sheet.
- `sheetPerSection` — optional. `true` puts each section on its own tab, for
  large workbooks (Faizuddin, 2026-10-29: "seperate it into different
  tabs/sheet, for every section ... easier for me to navigate"). Each tab
  repeats the A1 title and header row; section letters keep running A., B.,
  C. across tabs. Omitted or `false` = one "Test Scenarios" sheet (default).
- `tabs` — optional, only with `sheetPerSection: true` (2026-10-30). Puts
  several sections on one tab:
  `[{ "name": "STMS & eSTM TS", "sections": ["STMS Flow TS", "eSTM TS"] }, ...]`.
  Each entry in `sections` is a section's `sheet` value; every section needs a
  `sheet` and must be in exactly one tab, or the build stops with an error.
  Tabs come in this list's order, sections in the order listed. Each tab has
  the A1 title, the header row and one banner per section.
- `sectionLetters` — optional. `false` = banners show the section title only,
  no `"A. "` / `"B. "` (Faizuddin, 2026-10-30: "dont include those. just the
  names"). Omitted or `true` = lettered (default).
- `resultColumnsPerTab` — optional, only with `resultColumns`. `true` = each
  tab (or the single sheet) shows only the platform columns that at least one
  of its rows lists in `platforms`; a row without `platforms` counts as all
  (Faizuddin, 2026-10-30: "if the tab doesnt have at least 1 scenario for it,
  then remove that column in that tab"). Omitted = every tab shows all.
- `resultColumns` — optional. One result column per platform instead of the
  single `Test Result` column (Faizuddin, 2026-10-30, EAINT-9805 mobile), e.g.
  `[{ "header": "Android 15", "fill": "android" }, { "header": "iOS 27", "fill": "apple" }]`.
  `fill` colours the header: `"android"` light green, `"apple"` light blue, or
  an ARGB hex like `"FFE2EFDA"`; omitted = the dark title blue. A plain string
  (`"Android 15"`) also works. Same columns on every tab, right of `Remarks`,
  max 12. Each cell gets its own status dropdown and colour (centred; Pass
  green, Fail red, In Progress yellow, Not Started blue), and a pick changes
  only that cell.

## A section

```jsonc
{
  "title": "UCD — JOMCHECK PURCHASE & REPORT",
  "sheet": "A. Purchase & report", /* optional, only used with sheetPerSection */
  "rows": [ /* see below */ ]
}
```

`title` should already be UPPERCASE with an em dash (`—`), matching
`"<PORTAL> — <FEATURE>"`. The script prepends `"A. "` / `"B. "` etc itself.

`sheet` — optional tab name when `sheetPerSection` is `true`. Default:
`"<letter>. <title>"` with a leading `"BO — "` removed. Excel limits apply: the
script cuts it to 31 characters, replaces `\ / ? * [ ] :` with `-`, and stops
on a duplicate name.

## A row

With `resultColumns`, a row may add `"platforms": ["Android 15", "iOS 27"]`:
the headers this TS runs on. Those cells start as "Not Started"; the other
platform cells are grey, empty, with no dropdown. Omitted = every platform.

```jsonc
{
  "no": "12339_TS01",
  "objective": "Verify UCD JomCheck purchase downloads a v2.0 report and reflects in BackOffice",
  "steps": [ /* array of step items, see below */ ],
  "expected": [ /* array of expected items, see below */ ],
  "priority": "P1", /* optional */
  "remarks": ""
}
```

- `no` — full `"<ticket>_TS<NN>"`. Assign once, keep stable across edits —
  numbers run ascending in sheet order with no gaps — when rows are added or
  moved, renumber every row top to bottom and update anything that uses the
  numbers (automation titles, dashboard rows, an old→new map in NOTES.md).
  Faizuddin, 2026-10-19: "why is it not ordered correctly, ascending?"
- `objective` — one sentence, must already start with `"Verify "`. Don't
  include a trailing period requirement either way; write it plainly.
- `priority` — set it **only when Faizuddin asks for priority** in the
  workbook (2026-10-30: "the priority must only be created if i ask of it");
  otherwise leave it out of every row. `"P1"`, `"P2"` or `"P3"` only
  (anything else stops the build). If any row has one, the script adds a coloured `Priority` column
  right of `TS No.` on every tab (P1 red, P2 yellow, P3 green). Never write
  the priority into `remarks` (Faizuddin, 2026-10-30).
- `remarks` — usually `""`. Only put something here if there's a genuinely
  open question the user asked you to mark, or a note the user explicitly
  wants kept (most rows should NOT have a remark — SRD citations, technique
  labels and "pulled from X's draft" provenance do not belong in Remarks;
  that kind of traceability, if wanted at all, belongs in the ticket's
  `knowledge/flow-<module>.md`, not the TS sheet).

## Step items (array elements of `steps`)

Three shapes, mixed freely in one array:

1. **Plain string** — a single numbered line:
   ```jsonc
   "Go to Jomcheck Report Listing"
   ```
2. **Text + nested bullets** — for "set several values" steps:
   ```jsonc
   { "text": "Set 3 claims with Total No. of Parts Approved of:", "bullets": ["10", "11", "21"] }
   ```
3. Never write nested bullets or numbering into the string yourself — the
   script adds `"1. "`, `"2. "`, and the 5-space `" - "` bullet prefix.

Always give **exact input values**, not a description of where to find them.
Use "Set" not "seed/locate". Use "range" not "band". Describe an empty input
as "left blank (no value)", never "null". Never include a screenshot
instruction. Name the actual transaction type — e.g. "Create new Jomcheck
Transaction" — never "BO transaction".

## Expected items (array elements of `expected`)

The script always prepends `"Ensure:\n"` before your list — don't include
that yourself. Three shapes:

1. **Plain string** — one check, already in `"<Screen/Item> -> <What is
   seen>"` shape with a capital letter right after `->`:
   ```jsonc
   "Jomcheck Report Listing -> Type of Claim column shows \"-\""
   ```
2. **Text + nested bullets** — several sub-checks under one heading:
   ```jsonc
   { "text": "Existing values retained as 1 line per claim for:", "bullets": ["Odometer Reading", "Type of Claim", "Total No. of Parts Approved"] }
   ```
3. **Column / Position / Value** — for a new-column check:
   ```jsonc
   { "column": "Possible Total Loss", "position": "between Total Loss History (Actual) and Total Loss History (BER)", "value": "Yes" }
   ```
   Renders as:
   ```
   1. Possible Total Loss
        - Position: between Total Loss History (Actual) and Total Loss History (BER)
        - Value: Yes
   ```

One check per number — if you're tempted to write "X and Y", split it into
two array elements instead. No reasons, no SRD citations, no "(because ...)"
asides — state only what the tester sees. Use exact UI strings in double
quotes, verbatim, never paraphrased.

For "unchanged behaviour" checks, use the text+bullets shape with the fixed
intro line, one column per bullet with an example value:

```jsonc
{ "text": "Values will follow existing behaviour:", "bullets": ["Odometer Reading (eg. \"42,168 km\")", "Type of Claim (eg. \"Windscreen\")"] }
```

If you don't know what the current system actually shows for an example
value, ask the user — don't invent one.

## Inline emphasis marks (any string in objective / steps / expected / remarks)

The script converts these to Excel rich text and removes the marks:

- `**text**` → bold black (pages, buttons `**[Export]**`, fields, columns, statuses)
- `++text++` → bold green (outcomes expected to pass)
- `!!text!!` → bold red (negatives: must not appear / must not happen)

Marks work inside plain strings, `text`, `bullets`, and the `column` /
`position` / `value` shape. Do not nest one mark inside another. Rows carry
no stored height (Excel auto-fits them on open), so marks never affect fit.

## fieldReference (top-level, optional)

```jsonc
[
  {
    "field": "MileageRange",
    "oldField": "Mileage",
    "column": "Odometer Reading",
    "position": "Unchanged",
    "notes": "Old field returned an exact figure; new field returns a 10,000km range",
    "verifiedIn": "TS07"
  }
]
```

- `column` — UI header text only (or `"N/A (no column of its own)"` for an
  API-only field with no UI surface).
- `position` — `"Unchanged"` or `"New column, between X and Y"`.
- `verifiedIn` — optional TS number(s) this field's behaviour is actually
  tested by; leave `""` if you don't have one.

When a row's Expected Result should point at this sheet instead of spelling
out every field, give that row a normal `expected` array ending with one
extra string item: `"For the details, refer to the 'Field Reference' sheet."`
