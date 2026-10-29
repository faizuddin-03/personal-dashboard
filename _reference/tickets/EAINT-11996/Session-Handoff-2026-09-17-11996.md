# Session handoff — 2026-09-17 (EAINT-11996)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. No prior handoff existed for this ticket.

## What this ticket is (one-liner)
QA-Issue subtask (bug) under parent EAINT-11880 (Biometric Device Purchase
module): the Quantity Selector on UCD Service Hub > Software Installation
Step 1 strips numeric characters along with letters when an alphanumeric
string is typed, instead of stripping only the letters. One of four small
Service-Hub tickets bundled into the "21st Sept Deployment Items" batch
(EAINT-11996, EAINT-12095, EAINT-12103, EAINT-12104), all owned by
Faizuddin per Teams.

## Status as of 2026-09-17
Jira: **On Hold**, Priority Low, Fix Version `S33.X-20260921`. Assignee
zhan.choon, Reporter Teck Yung Chin. Two things happened today, in two
separate sessions:

1. A fresh `jira-ticket-study` pass was run (folder
   `_reference/tickets/21st Sept Deployment Items/`, alongside the other
   three batch tickets), producing `EAINT-11996-study.md`.
2. A separate, deeper investigation (different session, same day) chased
   down whether the "digits truncated past the 4th character" bug has any
   documented spec basis — see findings below. This traced up through the
   parent module ticket (EAINT-11880) and a sibling module ticket
   (EAINT-10960) and settled the question.

## Today's findings
- **Ticket study** confirms: bug is the Quantity Selector over-aggressively
  filtering alphanumeric input (stripping digits along with letters); a
  prior 27-Jul "Redev" retest found a related regression — digits past
  the 4th character position were dropped entirely (typing `TY1234`
  rendered as `12`). Ticket note says the same input-sanitisation fix must
  apply to "all sections within Service Hub" with Quantity Selectors, not
  just this one field — worth confirming the scope with dev.
- **Environment conflict flagged**: ticket description says `staging/sit2`,
  but Teams (Faizuddin's own EOD/To-Do posts, 15 & 17 Sept) says this whole
  batch is being deployed/tested on `/uat1`. Same conflict found on all
  four batch tickets — see "Open items" below.
- **Root-cause investigation (separate session, same day)**: chased "why
  should the limit be 4 characters" by reading the full 46-page SRD for
  parent EAINT-11880 (no "Installation Amount" field, no 4-character rule
  anywhere — the only quantity-validation note says *"accept integer values
  only; no additional maximum applies"*), then EAINT-10960's SRD (the
  dedicated Software Installation module doc — page 15, section 2.3.2.1:
  *"Number of Installations... No limit on the number of installation"*),
  then 3 Teams chats under the "Shopping Cart" category (To Create Shopping
  Cart, [QA] Shopping Cart Module, EAINT-12131) — none mention an
  installation-amount character cap. **Conclusion: there is no documented
  spec for a 4-character limit anywhere.** The "4 characters" language only
  ever appears in this ticket's own bug description, describing the wrong
  (buggy) truncation behaviour being fixed — not a real requirement. So the
  fix should allow any number of digits, not cap at 4.
  - Note: a *related but distinct* cap does exist elsewhere in this ticket
    family — Biometric Device **Purchase** quantity (not Installation
    count) is capped at 40 units/transaction, per EAINT-12166's SRD
    REQ-007. Don't confuse the two fields when writing test cases; this
    ticket's field (Number of Installations) has no cap at all.
- Also surfaced while tracing the module family: the true origin ticket for
  the whole Shopping Cart build is **CCB-618** (different Jira project,
  "New Feature - Shopping Cart (To Replace Proforma Invoice)"), with
  EAINT-10960 (Software Installation, earliest phase, first SRD draft
  23 Apr 2026) as the direct EAINT-side origin, followed by EAINT-11880
  (Biometric Device Purchase), EAINT-11881 (Change Main User), EAINT-11882
  (Account Termination) as later phases.

## What's in the ticket folder now
- `_reference/tickets/21st Sept Deployment Items/EAINT-11996-study.md` —
  today's ticket study (this ticket lives in the shared batch folder, not
  its own `_reference/tickets/EAINT-11996/`, per how the user asked for it
  to be organized).
- `_reference/tickets/EAINT-11880/` now also holds
  `SRD_EAINT-10960_Software_Installation_V1.2_20260724.pdf` (downloaded
  today during the root-cause chase — this is the SRD for a *different*
  ticket, kept here because it directly informed this investigation).
- Published artifact (all four batch tickets combined): **21st Sept
  Deployment Brief** —
  https://claude.ai/code/artifact/2e2bcab9-7d8a-4fb6-bc7d-07609c437187 —
  one page per ticket with Problem + numbered How-to-test steps, environment
  conflict called out at the top.

## Open items
1. **Environment conflict, unresolved** — sit2 (ticket field) vs /uat1
   (Teams) — needs confirming with dev before test execution, same as all
   four batch tickets.
2. **On-Hold status vs. live deployment** — ticket still reads On Hold with
   a 27-Jul "low priority, will fix next phase" comment, yet it's riding
   in the live 21 Sept batch. Confirm the hold has actually been lifted.
3. Confirm whether dev has actually re-delivered a fix since the 27-Jul
   "Redev" comment, and whether it addresses **both** defects (letter
   stripping AND the 4-char truncation regression) — not just the original
   symptom.
4. Confirm with dev which other Service Hub sections share the same
   Quantity Selector component, per the ticket's own "applies to all
   sections" note.
5. Now that the 4-character question is settled (no spec, don't cap),
   write the retest to explicitly allow long digit strings (5+ characters)
   as a pass condition, not just "letters removed, digits kept."

## Next steps for whoever picks this up
1. Chase the sit2-vs-uat1 environment conflict with the team before
   writing/running test steps (same ask across all four batch tickets —
   worth raising once, not four times).
2. Confirm On-Hold has been lifted / a real fix has landed for 21 Sept.
3. Review the two attached repro videos (`11996 Retest - Redev.mp4`,
   `2026-07-17_17-28-19.mp4`) before finalizing test steps — they show the
   exact input sequences that triggered each defect.
4. Draft QA test scenarios covering: alphanumeric input strips only
   letters; digit strings of 5+ characters are NOT truncated (this was
   the open question — now answered: no cap should exist); same fix
   verified across any other Service Hub sections using the same selector.
5. Retest doesn't need to touch the 40-unit Purchase Quantity cap — that's
   a different field (EAINT-12166), already a settled, intentional limit.

## Durable-knowledge candidates (flagged, not written here)
- The "no character/digit limit exists for Number of Installations, but
  Purchase Quantity is capped at 40/transaction via EAINT-12166 REQ-007"
  distinction is a genuinely useful, easy-to-confuse-again fact for anyone
  testing the Shopping Cart / Biometric Device Purchase module family —
  candidate for a new `knowledge/flow-device-purchase.md` (already flagged
  as missing in the EAINT-12166/12167 2026-09-15 handoffs) or
  `knowledge/flow-shopping-cart.md` if that's the more natural home.
- The module-family map (CCB-618 → EAINT-10960 → EAINT-11880 →
  EAINT-11881/11882, phase tickets under one umbrella CR) is also a good
  candidate for that same knowledge file — useful context for anyone who
  gets handed one phase ticket without knowing the others exist.
- No entry for EAINT-11996 exists yet in `lib/ticketStudies.ts` — the
  study above could seed one if this becomes an actively tracked ticket
  rather than a one-off batch item.
