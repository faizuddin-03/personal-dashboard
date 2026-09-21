# Session handoff — 2026-09-17 (EAINT-12095)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. No prior handoff existed for this ticket.

## What this ticket is (one-liner)
QA-Issue subtask (bug) under parent EAINT-11880 (Biometric Device Purchase
module): a long, unbroken shipping-address string overflows the Shipping
Address field on the UCD Service Request Details page instead of wrapping,
cutting off text under the adjacent Appointment Details section and
forcing a horizontal scrollbar. One of four tickets in the "21st Sept
Deployment Items" batch (EAINT-11996, EAINT-12095, EAINT-12103,
EAINT-12104), owned by Faizuddin per Teams.

## Status as of 2026-09-17
Jira: **On Hold**, Priority Lowest, Fix Version `S33.X-20260921`. A fresh
`jira-ticket-study` pass was run today (folder `_reference/tickets/21st
Sept Deployment Items/`), producing `EAINT-12095-study.md`. Purely a study
pass — no test scenarios drafted, no automation started.

## Today's findings
- Confirmed reproduction case already on file: Ref No SR67001086, staging
  test id `33e7af31-a90b-42a8-be72-637af2659886`, with screenshot
  `image-20260727-083519.png` showing the overflow.
- Fix is scoped as pure CSS/layout (word-break) — no new fields, pages,
  permissions, or business rules.
- **Environment conflict flagged**: ticket's "Testing Environment" field
  says `staging/sit2` (set when raised in July), but Teams (Faizuddin's
  EOD update 2026-09-15 18:18 and To-Do post 2026-09-17 09:24) says this
  batch's fix is being deployed/tested on `/uat1`. Same conflict found on
  all four batch tickets.
- No comment or Teams message yet confirms the fix has actually landed in
  code — the only Jira comment (Charmain Ea Chiang, 27 Jul) only records
  the decision to defer to "next phase."

## What's in the ticket folder now
- `_reference/tickets/21st Sept Deployment Items/EAINT-12095-study.md` —
  today's study (this ticket lives in the shared batch folder, not its own
  `_reference/tickets/EAINT-12095/`, per how the user organized this
  batch).
- Published artifact (all four batch tickets combined): **21st Sept
  Deployment Brief** —
  https://claude.ai/code/artifact/2e2bcab9-7d8a-4fb6-bc7d-07609c437187.

## Open items
1. Environment conflict (sit2 vs /uat1) — unresolved, needs confirming
   with dev before test execution.
2. Confirm the fix has actually landed in this release — no comment or
   Teams message confirms it yet, only the original defer-to-next-phase
   decision from July.
3. On-Hold status vs. live deployment — same pattern as the other three
   batch tickets; confirm the hold has been lifted for this release.

## Next steps for whoever picks this up
1. Chase the sit2-vs-uat1 environment conflict with the team (same ask
   across all four batch tickets — raise once, not four times).
2. Pull the original screenshot (`image-20260727-083519.png`) again for a
   before/after comparison.
3. Test with an unbroken string long enough to exceed the field's visible
   width — a normal spaced address won't reproduce this.
4. Confirm no regression to normal (spaced) address wrapping, and that the
   adjacent Appointment Details section is no longer visually
   overlapped/cut off after the fix.

## Durable-knowledge candidates (flagged, not written here)
- Nothing new beyond what's already flagged on EAINT-11996's handoff
  (same batch, same module family, same missing `knowledge/flow-*` file
  for Biometric Device Purchase / Shopping Cart).
- No entry for EAINT-12095 exists yet in `lib/ticketStudies.ts`.
