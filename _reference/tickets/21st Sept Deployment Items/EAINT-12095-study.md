📌 EAINT-12095 — [UCD - Biometric Device Purchase] Service Request Details - Long shipping address overflows instead of wrapping
Type: QA-Issue (subtask) · Status: On Hold · Priority: Lowest · Fix Version: S33.X-20260921 🌞 (release date 2026-09-21)
Parent: EAINT-11880 — 🔴[eAuto-UCD & BackOffice] Shopping Cart - To Create Biometric Device Purchase Module (Status: Done)
Environment: staging/sit2 (source: ticket description, "Testing Environment" field) — but see conflict note below
SRD read: No SRD attachment found (this is a QA-Issue/enhancement-adjacent bug ticket, not a CR — no SRD expected)
Teams search: 4 thread(s) found (search terms "EAINT-12095" and "21st September Deployment Items")

1. Overview (What is this ticket?)
   This is a QA-raised bug ticket against the Biometric Device Purchase (BDP) module inside
   Shopping Cart Phase 1. When a customer's shipping address is entered as one long unbroken
   string (no spaces), the Shipping Address field on the UCD Service Request Details page does
   not wrap the text — it overflows sideways, gets visually cut off under the adjacent
   Appointment Details section, and forces a horizontal scrollbar. It was raised as a low-priority
   cosmetic/display bug and deliberately put On Hold to be fixed in a later phase — that later
   phase is now the batch targeting the 2026-09-21 release.

2. Affected Portal / Module
   eAuto UCD Portal → Service Hub → Biometric Device Purchase → Service Request Details →
   Shipping Details section (Shipping Address field specifically).

3. Where the changes are
   - UCD Service Request Details page, Shipping Details panel — the Shipping Address display
     field's CSS/layout (needs word-break/wrap behaviour for unbroken strings).
   - No other pages, columns, or notifications are implicated — this is a single-field rendering
     fix.

4. Why the change (rationale)
   Stated in the ticket: an unbroken long string in the shipping address (e.g. reproduced with
   `A'A'A'…AAAA1DFDGFXGCVXGFGDFG…`) overflows the column width instead of wrapping, cutting off
   text under the neighbouring Appointment Details block and introducing an unwanted horizontal
   scrollbar — a display/UX defect, not a functional/data-loss one.

5. What's new / changed
   - Changed: Shipping Address field rendering — expected fix is to apply word-break so long,
     unbroken address strings wrap within the field width instead of overflowing.
   - No new fields, pages, permissions, or business rules are introduced. Purely a CSS/layout
     correction confined to one field.

6. ⚠️ Important for QA
   - Reproduction case already on file: Ref No SR67001086, staging test id
     33e7af31-a90b-42a8-be72-637af2659886, with the attached screenshot
     (image-20260727-083519.png) showing the overflow — pull that screenshot again for before/after
     comparison when retesting.
   - Test with an unbroken string long enough to exceed the field's visible width (the original
     repro string mixes letters/quotes with no spaces/breaks) — a normal address with spaces
     will not reproduce this, since word-break only matters when there is no natural break point.
   - Check that the fix doesn't affect normal (spaced) addresses — no regression to standard
     wrapping/line-height in the Shipping Details panel.
   - Confirm no horizontal scrollbar appears at any address length after the fix, and that
     Appointment Details (the adjacent section) is no longer visually overlapped/cut off.
   - This is part of a small batch of Service-Hub-related tickets going out together in the
     21st Sept morning deployment (EAINT-11996, EAINT-12095, EAINT-12103, EAINT-12104) — owned
     by Faizuddin per Teams. As of 2026-09-17 morning (today), his own To Do plan lists status as
     "to wrap up testing by EOD" for the whole batch, so this ticket is still active/in-test
     right now, not merely a stale On-Hold ticket.
   - ⚠️ Environment conflict: the ticket's own "Testing Environment" field says staging/sit2
     (set when it was raised in July), but Teams messages about this specific 21st-Sept batch
     (source: Teams, Faizuddin EOD update, 2026-09-15 18:18 and 2026-09-17 09:24) say "Ask dev to
     deploy the changes into /uat1" for these four tickets. Confirm with the team which
     environment (sit2 vs uat1) actually has the fix before testing — the ticket field may be
     stale relative to where this batch is actually being deployed/tested.

7. Open questions
   - Which environment currently has the fix deployed for this batch — sit2 (per ticket field)
     or uat1 (per the Sept-15/17 Teams deployment notes)? Needs confirmation before test
     execution.
   - No comment or Teams message yet confirms the fix has actually landed in code — the one Jira
     comment (Charmain Ea Chiang, 2026-07-27) only records the decision to defer it to "next
     phase." Verify with dev whether EAINT-12095 code changes are actually included in this
     21st-Sept release before writing/running test scenarios.

Notes on sources:
- Ticket fields/description/comment: from Jira via Atlassian MCP (EAINT-12095, EAINT-11880).
- Teams findings: eAuto QAs channel —
  (1) Charmain Ea Chiang, EOD update, 2026-07-27 23:03 — EAINT-12095 listed among "Issues Raised: 4"
      for Shopping Cart Phase 1 (SI & BDP Flow) testing.
  (2) Faizuddin, EOD update, 2026-09-15 18:18 — "21st September Deployment Items" batch
      (EAINT-11996, EAINT-12095, EAINT-12103, EAINT-12104), status "Ask dev to deploy the changes
      into /uat1" / "Studied the tickets."
  (3) Faizuddin, To Do Plan, 2026-09-17 09:24 (today) — same batch, status "To wrap up testing by EOD."
  (4) May Chin Mei Theng, 2026-09-16 (Tuesday) 16:25 — deployment schedule alignment message:
      "21st Sept Morning Deployment - Faiz" listing Service Hub related small tickets EAINT-11996,
      EAINT-12095, EAINT-12103, EAINT-12104.

Next steps offered: draft QA test scenarios for this, or raise a follow-up QA-Issue subtask if the
fix doesn't hold up in retest.
