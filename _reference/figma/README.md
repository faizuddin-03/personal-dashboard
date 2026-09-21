# Figma reference for automation scripts

One folder per ticket: `_reference/figma/EAINT-11862/`. Put frame exports in it,
plus a `flow.md` using the template below.

## What Figma can and cannot tell us

Figma is a **spec** source, not a **selector** source. The page objects in this
repo locate elements by real DOM handles the developer wrote — `#qty`,
`button[onclick="bioStep(1)"]`, `#si-pay-btn`. None of those exist in a design
file, and nothing in Figma can be used to guess them.

| Take from Figma | Take from the live DOM |
| --- | --- |
| Screen order and branches | Element IDs, classes, `onclick` handlers |
| Field labels, required markers, dropdown options | Actual rendered text (may differ from design) |
| Exact validation / error copy for assertions | Loading and timing behaviour |
| Empty, loading, error, success states | Anything a locator is built from |

**Do not use Dev Mode "Copy as code".** Figma generates its own markup with its
own class names. It looks authoritative and will not match what the developer
shipped. Selectors come from staging HTML, always.

## flow.md template

```markdown
# EAINT-XXXXX — <flow name>

**Portal / environment:** <Service Portal | UCD | BO> on <staging | UAT>
**Figma:** <link, or list the exported frame files in this folder>

## Screens, in order
1. <screen> — <what the user does>
2. <screen> — <what the user does>

## Branches
- <condition> → <which screen it goes to instead>

## Fields (per screen)
| Field | Type | Required | Options / constraints |
| --- | --- | --- | --- |
| Quantity | number stepper | yes | min 1, max 5 |

## Exact copy to assert
- Error, empty quantity: "<paste the exact string>"
- Success toast: "<paste the exact string>"

## States designed
- [ ] empty  - [ ] loading  - [ ] error  - [ ] success

## Business rules noted in the design
- <rule, and where it appears>

## Open questions for the developer
- <anything the design implies but does not state>
```

## Handing it over

Say "the Figma for EAINT-11862 is in `_reference/figma/EAINT-11862/`", then give
the staging URL or paste the form's `outerHTML` from DevTools. The design gives
the assertions; the HTML gives the locators; the script needs both.

If the Figma MCP connector is authenticated (`/mcp`), pasting a frame link works
too and yields more exact text than a screenshot — but it still supplies zero
selectors, so the DOM step does not go away.
