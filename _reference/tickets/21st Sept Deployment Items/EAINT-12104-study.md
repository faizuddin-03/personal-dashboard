📌 EAINT-12104 — [BackOffice - Biometric Device Purchase] Listing - Filter panel and listing layout misaligned vs existing module
Type: QA-Issue (subtask) — note: ticket type is actually "QA-Issue", not "Enhancement", despite the task framing · Status: On Hold · Priority: Low · Fix Version: S33.X-20260921🌞
Parent: EAINT-11880 — 🔴[eAuto-UCD & BackOffice] Shopping Cart - To Create Biometric Device Purchase Module (Status: Done) · Assignee: Xiwei Lim · Reporter: Charmain Ea Chiang
Environment: conflicting — see below (source: Jira "Testing Environment" field vs Teams)
SRD read: No SRD attachment found (expected — no SRD required; ticket carries only two reference screenshots, and it is in fact a QA-Issue subtask, not a CR)
Teams search: 3 thread(s) found (key search "EAINT-12104" was sufficient; did not need the "21st September Deployment Items" phrase fallback)

1. Overview (What is this ticket?)
   A QA-raised layout bug against the Biometric Device Purchase & Software Installation
   Listing page in eAuto BackOffice. The Search & Filter panel and the listing table don't
   follow the layout grid used by the existing eSTM Transaction Enquiry module — fields wrap
   onto their own rows instead of pairing up, and the listing table overruns the page margin.
   Reporter's own comment says it will be "enhance[d] in the next phase," which is why this
   sits under the 21st September Deployment Items batch now.

2. Affected Portal / Module
   eAuto BackOffice (BO) Portal > Biometric Device Purchase & Software Installation Listing
   (a screen under the Biometric Device Purchase module created by parent ticket EAINT-11880).

3. Where the changes are
   - Search & Filter panel on the Biometric Device Purchase & Software Installation Listing page
     - "Date Requested From" / "Date Requested To" fields — should sit paired on one row
     - "Time Slot" dropdown — should align in the filter grid, not wrap to its own row
   - The listing table itself — right edge currently runs past the page margin (rightmost
     column cut off against the window edge); should stay contained within the page margin
   - Reference/benchmark layout: eSTM Transaction Enquiry (existing module) — this is the
     layout the fix should match, not a new design.

4. Why the change (rationale)
   Visual/UX consistency — the module was newly built (parent EAINT-11880) and its filter
   panel and listing grid don't match the established layout convention used elsewhere in BO
   (eSTM Transaction Enquiry). Stated fact from the ticket's own description; reporter's
   comment frames it as deferred polish ("next phase"), not a functional defect.

5. What's new / changed
   - Changed: Filter panel layout — From/To date fields to be paired on the same row; Time
     Slot dropdown to align within the grid instead of wrapping alone.
   - Changed: Listing table width — must be contained within the page margin (currently the
     rightmost column is cut off at the window edge).
   - No new fields, columns, permissions, or business logic — this is layout/CSS alignment
     only, matching an existing pattern (eSTM Transaction Enquiry), not introducing one.

6. ⚠️ Important for QA
   - **Environment conflict (flag to team, consistent with the other three tickets in this
     batch):**
     - The ticket's own description states **"Testing Environment: Production (eauto.my)"**
       with **"Staging Test: main.do — production verification 28-07-2026."** This reads as
       the *original bug report's* environment (where Charmain found and verified the bug on
       28-07-2026), not necessarily where the fix should be retested.
     - Teams (source: Teams, Faizuddin, EOD 15-09-2026 18:18 and To-Do 17-09-2026 09:24) lists
       EAINT-12104 under **"21st September Deployment Items"** alongside EAINT-11996,
       EAINT-12095, EAINT-12103, with status **"Ask dev to deploy the changes into /uat1."**
     - Net: this is actually a *sharper* mismatch than the sibling tickets, where the field at
       least said staging/SIT2 — here the Jira field literally says **Production**, while
       Teams says the fix is being deployed to **/uat1** for this round of testing. Test on
       **/uat1** per the Teams instruction for the 21 Sept batch; treat "Production (eauto.my)"
       in the ticket body as where the original bug was observed/verified, not the retest target.
   - This is a pure layout/alignment fix — verification is visual comparison against eSTM
     Transaction Enquiry's filter panel and listing width, at whatever viewport/resolution QA
     normally tests BO at. Worth checking at more than one window width given the reported
     symptom (right edge running past the margin) is width-sensitive.
   - Ticket has been On Hold — confirm with Xiwei Lim / Charmain that the fix has actually
     landed on /uat1 for this deployment before testing (parent module EAINT-11880 is Done,
     but this cosmetic follow-up was explicitly deferred to "next phase").
   - No roles/permissions dimension — this is a BO-only visual fix, no UCD-side or role-based
     behaviour implicated.

7. Open questions
   - Confirm with the team whether retest should happen on /uat1 (per Teams) or wait for a
     later environment, since the ticket's own field points at Production and the "Staging
     Test" line only documents where the bug was already verified, not a retest plan.
   - No test-case build info on this ticket (no test script/SRD referenced) — first-time
     verification will need a quick manual pass against the two attached
     screenshots (image-20260728-083212.png = actual, image-20260728-083220.png = expected)
     rather than an existing test script.

Want me to draft QA test scenarios for this, or raise a QA-Issue subtask?
