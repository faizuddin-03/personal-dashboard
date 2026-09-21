# Session handoff — 2026-09-17 (EAINT-11880)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. No prior handoff existed for this ticket.

## What this ticket is (one-liner)
Parent CR: 🔴[eAuto-UCD & BackOffice] Shopping Cart — To Create Biometric
Device Purchase Module. Status: **Done**. Four QA-Issue bugs under it
(EAINT-11996, EAINT-12095, EAINT-12103, EAINT-12104) are the live work
right now, bundled as the "21st Sept Deployment Items" batch — see their
own handoffs for that.

## Status as of 2026-09-17
No new work directly on this ticket's own scope today — this session's
activity was entirely a **research pass** using EAINT-11880 as the
reference SRD to answer a question about one of its child bugs
(EAINT-11996: "why is the Quantity Selector limited to 4 characters?").
Ticket itself remains Done, no changes made or needed.

## Today's findings
- Read the full 46-page SRD for EAINT-11880 (already saved in this
  folder). **No "Installation Amount" field exists anywhere in it, and
  there's no 4-character rule.** The only quantity-validation note (p.22,
  applying to all quantity/number-selector fields) says: *"accept integer
  values only; no additional maximum applies beyond the per-session
  appointment allocation caps (3 per session, 6 per day)."*
- Checked all 3 Teams chats under the "Shopping Cart" category (To Create
  Shopping Cart / EAINT-12099|11881|11882, `[QA] Shopping Cart Module`,
  EAINT-12131) — none mention an installation-amount character cap.
- Cross-checked EAINT-10960's SRD (Software Installation module — a
  sibling phase ticket, not a child of 11880) to find the actual field in
  question: p.15, section 2.3.2.1, "Number of Installations... **No limit
  on the number of installation**." That's the definitive answer — the
  4-character behaviour EAINT-11996 is fixing was always a bug, never a
  spec.
- Distinguished this from a **real, separate** cap that does exist in this
  ticket's own scope: Biometric Device **Purchase quantity** (a different
  field from Number of Installations) is capped at **40 units per
  transaction**, per EAINT-12166's SRD REQ-007 ("Purchase Quantity
  Validation"), not this ticket's own original SRD (which specified no
  limit when 11880 was first written — the 40-unit cap was added later via
  12166).
- Traced the module family tree: this ticket's own umbrella feature
  request is **CCB-618** (different Jira project — "New Feature - Shopping
  Cart (To Replace Proforma Invoice)"), with **EAINT-10960** (Software
  Installation) as the earliest EAINT-side phase (first SRD draft 23 Apr
  2026, predating 11880's own first draft in July), followed by this
  ticket (EAINT-11880, Biometric Device Purchase), then EAINT-11881
  (Change Main User) and EAINT-11882 (Account Termination).

## What's in the ticket folder now
- `SRD_EAINT-11880_Biometric_Purchase_V1.2_20260724.pdf` (already present).
- **New today**: `SRD_EAINT-10960_Software_Installation_V1.2_20260724.pdf`
  — downloaded during this investigation; belongs to a *different* ticket
  (EAINT-10960) but kept here since it's what actually answered the
  question raised against this ticket's child bug.
- A separate `_reference/tickets/Shopping Cart/` folder was also created
  today (outside the per-ticket convention) holding a duplicate copy of
  the same EAINT-11880 SRD — appears to be a scratch/exploration artifact
  from the same investigation; worth tidying up or consolidating later
  since it duplicates what's already in this folder.

## Open items
- None new for this ticket's own scope — it's Done. The open items belong
  to its child bugs (see each one's own 2026-09-17 handoff) and to
  EAINT-10960/EAINT-12166 if anyone picks up further work referencing this
  module family.

## Next steps for whoever picks this up
1. If continuing to investigate this module family, start from the phase
   map above (CCB-618 → EAINT-10960 → EAINT-11880 → EAINT-11881/11882)
   rather than re-discovering it.
2. Consider consolidating the duplicate SRD in `_reference/tickets/
   Shopping Cart/` into this folder, or clarify with the user why a
   separate module-level folder (distinct from the per-ticket one) is
   wanted going forward.
3. When writing/reviewing EAINT-11996's fix, remember: Number of
   Installations has NO cap (this ticket + EAINT-10960 both confirm), but
   Purchase Quantity IS capped at 40/transaction (EAINT-12166) — don't
   conflate the two fields.

## Durable-knowledge candidates (flagged, not written here)
- The distinction above (Installations: no limit vs. Purchase Quantity:
  40/transaction cap from EAINT-12166 REQ-007) is a strong candidate for a
  new `knowledge/flow-device-purchase.md` or `knowledge/flow-shopping-
  cart.md` — this exact confusion is what triggered today's whole
  investigation, so writing it down durably would save the next person
  the same chase.
- The CCB-618 → EAINT-10960/11880/11881/11882 phase map is also a good
  candidate for that same knowledge file.
- No entry for EAINT-11880 exists in `lib/ticketStudies.ts` (it's Done, so
  likely not needed unless someone wants a durable record of the module).
