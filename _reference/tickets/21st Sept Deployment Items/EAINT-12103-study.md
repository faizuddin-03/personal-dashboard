📌 EAINT-12103 — [BackOffice - Biometric Device Purchase] Listing - Enter key does not trigger search
Type: QA-Issue (subtask) · Status: On Hold · Priority: Medium · Fix Version: S33.X-20260921
Parent: EAINT-11880 — 🔴[eAuto-UCD & BackOffice] Shopping Cart - To Create Biometric Device Purchase Module (Status: Done) · Assignee: Xiwei Lim
Environment: staging/sit2 (source: ticket's own "Testing Environment" field) — but see conflict flagged in section 6.
SRD read: No SRD attachment found — none expected, this is an ENHANCEMENT/QA-Issue-type ticket, not a CR ticket. Attachments list on the ticket is empty (checked; nothing found regardless of type).
Teams search: 3 thread(s) found (all in the "eAuto QAs" group chat)

1. Overview (What is this ticket?)
This is a QA-Issue subtask raised by Charmain Ea Chiang under the (now Done) parent story EAINT-11880, which built the Biometric Device Purchase & Software Installation module in BackOffice. The issue: on the BO listing page for this module, pressing Enter inside a filled Search & Filter field (e.g. Reference No, Company Name) does nothing — the listing only re-filters when the user explicitly clicks the Search button. Reporter's own comment says it is deferred: "To enhance this in the next phase," which lines up with the current status of On Hold.

2. Affected Portal / Module
BackOffice (BO) portal → Biometric Device Purchase & Software Installation Listing → Search & Filter area on that listing screen. This is a BO-only fix; no UCD-side impact stated.

3. Where the changes are
- BO > Biometric Device Purchase & Software Installation Listing page (main.do, per the ticket's Staging Test note)
- The Search & Filter fields on that listing (Reference No, Company Name, and presumably other filter fields on the same form)
- Keyboard-triggered search behaviour tied to those filter inputs (Enter key handler), as distinct from the existing click-triggered Search button

4. Why the change (rationale)
Standard UX/accessibility parity: users expect pressing Enter in a filled filter field to behave the same as clicking Search, matching convention on other listing pages. No SRD/business rule to cite beyond this — stated as the ticket's own expected-result rationale.

5. What's new / changed
- Changed: Enter-key handling on the Search & Filter fields of the Biometric Device Purchase & Software Installation Listing so that pressing Enter in any filled filter field fires the same search action as clicking the Search button.
- No new fields, columns, statuses, or permissions — this is a pure interaction-behaviour fix on an existing listing.
- Nothing removed.

6. ⚠️ Important for QA
- Environment conflict, same pattern as sibling tickets in this batch: the ticket's own "Testing Environment" field says staging/sit2, but Faizuddin's Teams messages in "eAuto QAs" say otherwise for this exact batch:
  - Tuesday 2026-09-15, 18:18 ("Faizuddin - EOD Update"): under "3. 21st September Deployment Items" (listing EAINT-11996, EAINT-12095, EAINT-12103, EAINT-12104) — Status: "Ask dev to deploy the changes into /uat1", "Studied the tickets."
  - 2026-09-17, 09:24 ("Faizuddin - To Do Plan"): same ticket group — Status: "To wrap up testing by EOD."
  - (source: Teams, Muhammad Faizuddin Bin Bidi, 2026-09-15 and 2026-09-17, "eAuto QAs" group chat)
  - **Flag this conflict to the team before testing**: ticket says sit2, Teams says /uat1 for the whole 21st-Sept batch including this ticket. Confirm with dev/Faizuddin which environment actually has the fix deployed before running tests.
- Ticket status is "On Hold" and the only comment ("To enhance this in the next phase," 2026-07-28) suggests this was originally deferred — worth confirming with the team whether it has now actually been picked up for the 21st Sept deployment (it is listed in the batch, so presumably yes) or whether "On Hold" is stale.
- Test both a filter field filled with a valid value and an empty field — confirm Enter with an empty filter doesn't unexpectedly trigger a search/reset if that wasn't the intent (only "a filled filter field" is specified in the ticket).
- Test Enter behaviour across each filter field on the listing (not just Reference No / Company Name, which are only "e.g." examples) to catch a field-specific regression.
- Confirm the fix doesn't break the existing Search-button click path (regression, not just the new Enter path).
- No roles/permissions dimension called out — this is a UI interaction fix, not a permission-gated feature.
- A screenshot was referenced as "to be attached" in the Staging Test note but the attachments list on the ticket is currently empty — none exists to review.

7. Open questions
- Which environment (sit2 per the ticket, or /uat1 per Teams) actually has this fix — unresolved as of 2026-09-17 09:24, since that message says "to wrap up testing by EOD" without naming the confirmed environment.
- Is "On Hold" status still accurate, or should it have moved once this entered the 21st Sept deployment batch?

Want me to draft QA test scenarios for this, or raise a QA-Issue subtask? (Not done automatically.)
