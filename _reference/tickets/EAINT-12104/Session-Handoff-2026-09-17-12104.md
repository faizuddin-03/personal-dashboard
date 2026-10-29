# Session handoff — 2026-09-17 (EAINT-12104)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. No prior handoff existed for this ticket.

## What this ticket is (one-liner)
QA-Issue subtask (bug) under parent EAINT-11880 (Biometric Device Purchase
module): the Search & Filter panel and listing table on the BackOffice
Biometric Device Purchase & Software Installation Listing page don't
follow the layout grid used by the existing eSTM Transaction Enquiry
module (fields wrap onto their own rows instead of pairing up; the
listing table overruns the page margin). One of four tickets in the "21st
Sept Deployment Items" batch (EAINT-11996, EAINT-12095, EAINT-12103,
EAINT-12104), owned by Faizuddin per Teams.

## Status as of 2026-09-17
Jira: **On Hold**, Priority Low, Fix Version `S33.X-20260921`. Assignee
Xiwei Lim, Reporter Charmain Ea Chiang. A fresh `jira-ticket-study` pass
was run today (folder `_reference/tickets/21st Sept Deployment Items/`),
producing `EAINT-12104-study.md`. Purely a study pass — no test scenarios
drafted, no automation started.

## Today's findings
- Pure layout/CSS fix, no new fields/columns/permissions/logic: pair the
  From/To date fields on one row, align the Time Slot dropdown in the
  filter grid, and keep the listing table within the page margin — all to
  match the existing eSTM Transaction Enquiry layout convention.
- **Environment conflict is sharper here than the other three batch
  tickets**: the ticket's own description says **"Testing Environment:
  Production (eauto.my)"** with a "Staging Test: main.do" note dated
  28-07-2026 — that reads as where the *original bug* was found/verified,
  not a retest target. Teams (Faizuddin, 2026-09-15 18:18 and 2026-09-17
  09:24) says this batch's fix is being deployed/tested on `/uat1`. Test
  on `/uat1` per Teams; don't treat "Production" in the ticket body as the
  retest environment.
- Two reference screenshots exist on the ticket: `image-20260728-083212.png`
  (actual) and `image-20260728-083220.png` (expected) — first-time
  verification will need a manual visual comparison against these, since
  there's no existing test script for this ticket.

## What's in the ticket folder now
- `_reference/tickets/21st Sept Deployment Items/EAINT-12104-study.md` —
  today's study (this ticket lives in the shared batch folder, not its own
  `_reference/tickets/EAINT-12104/`).
- Published artifact (all four batch tickets combined): **21st Sept
  Deployment Brief** —
  https://claude.ai/code/artifact/2e2bcab9-7d8a-4fb6-bc7d-07609c437187.

## Open items
1. Environment conflict — Production (ticket) vs /uat1 (Teams), sharper
   than the sit2-vs-uat1 pattern on the other three batch tickets.
2. Confirm with Xiwei Lim / Charmain that the fix has actually landed on
   /uat1 for this deployment — parent module (EAINT-11880) is Done, but
   this cosmetic follow-up was explicitly deferred to "next phase."

## Next steps for whoever picks this up
1. Test on `/uat1` per the Teams instruction, not Production.
2. Visual comparison against the two attached screenshots (actual vs.
   expected) at more than one window width, since the reported symptom
   (right edge running past the margin) is width-sensitive.
3. No roles/permissions dimension to worry about — BO-only visual fix.

## Durable-knowledge candidates (flagged, not written here)
- Nothing new beyond what's already flagged on EAINT-11996's handoff
  (same batch, same module family, same missing `knowledge/flow-*` file).
- No entry for EAINT-12104 exists yet in `lib/ticketStudies.ts`.
