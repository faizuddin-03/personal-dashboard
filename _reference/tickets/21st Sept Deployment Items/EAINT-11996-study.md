📌 EAINT-11996 — [UCD - Software Installation] Functional Issues for Quantity Selector in Step 1
Type: QA-Issue (subtask) · Status: On Hold · Priority: Low · Fix Version: S33.X-20260921
Parent: EAINT-11880 — 🔴[eAuto-UCD & BackOffice] Shopping Cart - To Create Biometric Device Purchase Module (Status: Done)
Assignee: zhan.choon · Reporter/Creator: Teck Yung Chin
Environment: description field says "staging/sit2" (source: ticket description) — but Teams shows this ticket is one of the "21st September Deployment Items" being tested on **/uat1** (source: Teams, Faizuddin's own EOD/To-Do posts, 15–17 Sept 2026). These conflict — flagged below.
SRD read: No SRD attachment found. Only two video attachments (bug repro clips): `11996 Retest - Redev.mp4` (uploaded by Faizuddin, 27 Jul) and `2026-07-17_17-28-19.mp4` (uploaded by Teck Yung Chin, original repro, 17 Jul). No SRD expected — this is a QA-Issue (bug) subtask raised against an enhancement ticket, not a CR.
Teams search: 3 message(s) found (2 from Faizuddin's own EOD/To-Do updates, 1 from May Chin Mei Theng's deployment-schedule announcement).

1. Overview (What is this ticket?)
   This is a QA-raised bug ticket (QA-Issue subtask) against the Biometric Device Purchase Module
   under Service Hub > Software Installation in the UCD Portal. The Quantity Selector input field
   incorrectly strips numeric characters whenever the user types an alphanumeric string, instead
   of only stripping the non-numeric (alphabetic) characters. It has been on hold since 27 Jul 2026
   as "low priority, will fix next phase" but has now resurfaced as part of the 21 Sept 2026
   deployment batch.

2. Affected Portal / Module
   eAuto UCD Portal > Service Hub > Software Installation (Biometric Device Purchase Module,
   built under parent EAINT-11880). Specifically the Quantity Selector control in Step 1 of the
   purchase flow — and, per the ticket's own note, the same input-sanitisation logic wherever
   Quantity Selectors appear across the Service Hub module.

3. Where the changes are
   - UCD Portal > Service Hub > Software Installation > Step 1 > Quantity Selector field
   - Any other Quantity Selector instances within Service Hub (per the ticket note: "This also
     applies for the Quantity Selectors in all sections within the Service Hub module")

4. Why the change (rationale)
   Stated fact: the Quantity Selector's input filter is over-aggressive — it treats an
   alphanumeric string as entirely invalid rather than character-by-character, stripping digits
   along with letters. Original bug report (Teck Yung Chin, 17 Jul) also found a second, worse
   defect during retest: typing "TY1234" only surfaced "12" — digits from the 5th position
   onward were dropped entirely, not just the letters.

5. What's new / changed
   - Changed (expected behaviour): entering an alphanumeric value (e.g. "Try1234") should retain
     and display only the numeric portion ("1234"), not strip it along with the letters.
   - Bug (as last observed, comment by Faizuddin, 27 Jul, status "Redev"): numeric characters
     were still not displaying in full — entering "TY1234" rendered as "12" only; digits past
     the 4th character position were dropped.
   - No removal/deprecation — this is a pure bugfix on existing input-sanitisation logic.

6. ⚠️ Important for QA
   - Roles: UCD (Main User) — this is the only role that interacts with Service Hub > Software
     Installation quantity entry.
   - Environment conflict to resolve before testing: ticket description says staging/sit2, but
     Faizuddin's own Teams EOD notes (15 & 17 Sept 2026) list EAINT-11996 under the "21st
     September Deployment Items" batch being deployed/tested on **/uat1**, with status "Ask dev
     to deploy the changes into /uat1" (15 Sept) → "Studied the tickets" (15 Sept) → "To wrap up
     testing by EOD" (17 Sept, today). Recommend confirming with the team whether staging/sit2
     is stale wording carried over from the original bug report, and testing on /uat1 as the
     Teams thread indicates.
   - Priority/status mismatch: ticket status is still "On Hold" with a 27 Jul comment saying "low
     priority issue, will fix next phase" (Charmain Ea Chiang) — yet it is now bundled into the
     live 21 Sept deployment. Confirm the On-Hold status has actually been lifted before treating
     this as in-scope for the 21 Sept release; the Jira status field has not been updated to
     reflect that.
   - Scope check: the ticket text calls out that the same fix must apply to "all sections" with
     Quantity Selectors in Service Hub, not just Software Installation Step 1 — worth confirming
     with dev which other sections/modules share the same selector component.
   - Retest history: a prior fix attempt (retested 27 Jul) did NOT fully resolve the issue —
     it introduced a related but distinct defect (digit truncation beyond 4 characters). Any new
     fix delivered for 21 Sept needs explicit retesting of both the original symptom (letters
     removed alongside digits) and the regression found in the first retest (digits truncated
     past position 4), not just a repeat of the original repro steps.
   - Video evidence exists for both the original bug and the redev retest — worth reviewing
     `2026-07-17_17-28-19.mp4` and `11996 Retest - Redev.mp4` (both still attached on the ticket)
     before writing test steps, since they show the exact input sequences that triggered each
     defect.

7. Open questions
   - Is staging/sit2 (per ticket description) or /uat1 (per Teams, 17 Sept) the correct
     environment for this round of testing? Needs confirmation before test execution.
   - Has the "On Hold" status formally been lifted for the 21 Sept deployment, or is this ticket
     riding along with the batch informally? Jira status field still shows On Hold.
   - Has dev re-delivered a fix since the 27 Jul "Redev" comment, and does it address the digit-
     truncation regression found in that retest, or only the original letter-stripping symptom?

Want me to draft QA test scenarios for this, or raise a QA-Issue subtask?
