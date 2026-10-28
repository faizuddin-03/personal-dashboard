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
  "fieldReference": [ /* optional, see below */ ]
}
```

- `title` — exactly what goes in A1: `"<TICKET> - [<project>] <ticket title>"`.
- `sections` — ordered array. The script letters them A, B, C... automatically
  from array order — don't include the letter yourself.
- `fieldReference` — omit entirely (or pass `[]`) when the CR doesn't add/change
  enough fields to warrant a separate sheet.

## A section

```jsonc
{
  "title": "UCD — JOMCHECK PURCHASE & REPORT",
  "rows": [ /* see below */ ]
}
```

`title` should already be UPPERCASE with an em dash (`—`), matching
`"<PORTAL> — <FEATURE>"`. The script prepends `"A. "` / `"B. "` etc itself.

## A row

```jsonc
{
  "no": "12339_TS01",
  "objective": "Verify UCD JomCheck purchase downloads a v2.0 report and reflects in BackOffice",
  "steps": [ /* array of step items, see below */ ],
  "expected": [ /* array of expected items, see below */ ],
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
