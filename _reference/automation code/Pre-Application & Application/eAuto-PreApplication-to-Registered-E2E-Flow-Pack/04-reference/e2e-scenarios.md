# The 10 end-to-end scenarios (vault export)

These are the EAINT-11982 E2E rows. Their **subject** is the expiry extension, so
the expectations will not transfer — but their **preconditions and steps are a
worked description of the whole Pre-Application to Application journey**, written
as test steps rather than as prose. That is what makes them worth reading.

All ten are **Pass** as of 01-09-2026.

| Ref | Title | Status | Result |
| --- | --- | --- | --- |
| **E2E_TS1** | Full flow: new application to Approved, extended before expiry | Corrected | Pass |
| **E2E_TS2** | Full flow: left to expire, extended within 3 months | Retained | Pass |
| **E2E_TS3** | Full flow: never extended, more than 3 months past expiry | Retained | Pass |
| **E2E_TS4** | Full flow: extended once, then the extended period expires too | Retained | Pass |
| **E2E_TS5** | Full flow: two users extend at the same time | Retained | Pass |
| **E2E_TS6** | Full flow: extended once, then pushed past the 3-month window | New | Pass |
| **E2E_TS7** | Full flow: post-expiry extension, dealer finishes on the portal | New | Pass |
| **E2E_TS8** | Full flow: created before the deploy, extended after it | New | Pass |
| **E2E_TS9** | Full flow: the overnight auto-expire job after a fresh extension | New | Pass |
| **E2E_TS10** | Full flow: extended once, then Registered, then the extended expiry passes | New | Pass |

---

## E2E_TS1 — Full flow: new application to Approved, extended before expiry

**Objective:** Take a brand-new application all the way to Approved, then extend it before expiry — proving the +30-day maths end to end (expect 31-08-2026, not 30-08-2026).

**Preconditions**

A clean dealer fixture — npm run fixture makes one, always unique, and always from the Pre-Application Form (R22)
Business type is Non-SSM (Business Trading Sabah / Sarawak). SSM types are NOT reachable any more: the manual UCD New Application route that covered them is closed (R22) and the public form's checkSSM.do rejects every generated BRN. Business type has no bearing on the expiry date or on Extend, so this case is unaffected — Q20's answer is historical
A person at the keyboard for ONE reCAPTCHA tick (per build — check:gate says the session is NOT reusable) and TWO Fiuu bank-simulator logins: the RM 108.00 pre-application fee and the RM 990.00 registration fee. FIUU_SIM_USER/PASS drive both automatically
BackOffice approver and assignee accounts

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Click Next to reach Business Info Review
Tick the declaration, pick a payment method and click Submit and Pay
Pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing and open the new record
Click Approve and confirm Yes
Copy the generated Application Link from the sidebar
Open the link and fill in the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the BackOffice assignee, open the application, set the UCD Group and click Submit for Approval
As the approver, approve the application
Finish the Registration Documents step on the UCD side and submit
As the assignee, click Verified on the Registration Documents tab
Pay the registration fee on the UCD side
Note the Application Expiry Date on the listing — should be created date + 90 days
Set the expiry to 01-08-2026 and arrange the clock or fixture so the click happens on 20-07-2026 (before expiry)
Click Extend in the Registration Documents sidebar, type a remark and Confirm
Check the new Application Expiry Date is 31-08-2026
Check the Application Status is still Approved and the button is now greyed
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

New expiry is 31-08-2026, not 30-08-2026. Status stays Approved. Button then greys. (Form filling is automated end to end — the only manual part is two payment logins.)

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**EVIDENCE BAR FOR THE GREYED BUTTON (added 26-08-2026 night, R6).** Wherever this
case expects a **disabled / greyed Extend**, the screenshot must show the **once-only
tooltip painted** beside it — the button greys DURING the take, so it is the post-extension shot (`greyed-after`) that carries it — the key shot here is the offered button, before the click. The message read out of the HTML does not
count and never did: `.extend-tip` is `display:none` until `.extend-wrap:hover`,
so a sidecar can quote it in full over a still that shows a greyed button and no
reason at all. That is exactly what TS03's 26-08 take banked, and why it was sent
back.

Concretely, for this case to be signed off: the pointer is on `span.extend-wrap`
(not on the button — it is `pointer-events:none`), the tooltip is **visible in the
frame**, and its wording is Figma 9058-30492's *"This application has already been
extended. Each application can only be extended once."* The recorder refuses to
tick the shot without it, so a take that cannot show it comes back red rather than
green-with-a-note.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

**RECONCILE 29-08-2026 pm — 14/17 on NA68001111 (28-08), MISSING 2: `lifecycle` and `result`.**

`result` is the expected absence (no success banner, by design — SRD v1.0 specifies only REQ-011's failure message) and the board credits it. `lifecycle` is not credited and is the real gap: the leg that proves the flow end to end never ticked. The row stays Not run.

---

**TAKE EXISTS, 28-08-2026 — CAPTURED 14/16, MISSING (2), `EXPECTED STATE — MATCH`.** Sidecar `E2E_TS1_NA68001111_assignee_2026-08-28.txt`, plus NINE SEG1 fixture-creation takes. Result stays **Not run**.

Two gaps, and they are different in kind:

1. The gap is `result` — *"no banner or dialog element found"*. **That absence is BY DESIGN:** SRD v1.0 specifies only REQ-011's FAILURE message, so a successful extension shows no banner and the confirmation is state (button greys, remark in the sidebar, new expiry on the listing and in the export). The recorder was corrected on 28-08-2026 to film that absence on the page and TICK it — TS27's re-run the same afternoon recorded `[x] result  Immediate result — NO success banner is expected`. This take predates the fix.

2. `lifecycle` — *"this is an EXTEND-shaped end-to-end flow: its lifecycle leg is the extension itself plus the reading at the far end, and neither can be filmed until a fixture exists (pool:status reads 0). Not a missing recorder branch — a missing fixture."* **That one is real and is NOT fixed by today's rig work.** It needs a fixture at the far end of the lifecycle, which is a build-and-wait, not a patch.

So: `result` is fixed, `lifecycle` still needs its fixture.

---

**28-08-2026 — SEGMENT 1 IS BANKED. Record NA68001111.** Sidecar `SEG1-E2E_TS1_fx-260828-0639-039_dealer_bo_2026-08-28.txt`: CAPTURED 8/8, MISSING (0), NOT APPLICABLE (0). Filmed from the reCAPTCHA gate per the 27-08 ruling, through to a record with its expiry patched into the window (2026-08-28). It clicked no Extend, so **no extension was spent (R1)** and the row's result stays "Not run" — segment 1 is half a scenario, not a pass. Seven takes were needed to get a clean one. Segment 2 is BLOCKED on EAINT-12235: it carries `greyed-after`, and on this build the control vanishes after an extension, so the take would reach its after-state, record a Fail, and have spent this record's one and only extension to do it.

---

npm run fixture drives the pre-application form, the BackOffice approvals and the registration documents unattended, pausing only at the reCAPTCHA and the two payment logins, and stops one step short of Create Account so the Extend button survives. The Extend click itself stays with the test, not the fixture build. See automation/README.md.
ROUTE IS NO LONGER A CHOICE (27-08-2026, R22): `npm run fixture` IS the dealer journey, and there is no flag to change it. The old advice here — that the BackOffice route was the cheap path and `--route public` was for testing the pre-application flow itself — is void: the BackOffice route never reached registration documents (it stalls at approve-app, NA68001102) and Charmain has ruled the manual route out of scope for this ticket.

---

**29-08-2026 NIGHT — FILMED END TO END, BOTH SEGMENTS, 8/8 + 17/17.**

Segment 1 `SEG1-E2E_TS1_fx-260829-2012-069_dealer_bo_2026-08-29.mp4` — 8/8 on
**NA68001129**, gate through to the patched record. Segment 2
`E2E_TS1_NA68001129_assignee_2026-08-29.mp4` — **17/17, MISSING 0, EXPECTED STATE
MATCH**. The first extend-shaped E2E row ever to reach a full checklist: `lifecycle`
was a hard-coded miss on every one of them until this evening.

The lifecycle leg reads: *expiry before "2026-09-13 20:13" (15 day(s) still to run),
status "Approved" -> "Approved", R3 predicts 2026-10-13, the listing reads
"2026-10-13 20:13" — AGREES.* The **15 days still to run** clause is the load-bearing
one: on an already-expired record the build applies R4 and produces the same tidy +30,
so without asserting the window position this take could have filmed R4 under R3's name
and passed.

Segment 1's patch target is now derived from the ref, not flat: `+15d`, recorded in the
seam file together with the reason — *"R3 needs the expiry still in the FUTURE at click
time"*. The old flat `in-window` resolved to TODAY, which is the wrong side of this
row's own boundary.

**Cost: three fixtures for one take.** NA68001123 lost to a mid-take VPN drop,
NA68001124 lost to a duplicate launch that wedged the desktop recorder (its extension
went through correctly — audit shows 2026-09-13 19:03 -> 2026-10-13 19:03 — but the film
truncated and no sidecar was written, so R1 is spent and it can never be re-filmed),
NA68001128 lost to a second VPN drop. NA68001123 and NA68001128 survive as
before-window spares.


---

## E2E_TS2 — Full flow: left to expire, extended within 3 months

**Objective:** Let an application expire, extend it within the window, and prove both the new date and the status change end to end.

**Preconditions**

An application taken to Approved with registration documents verified
Expiry set so it has passed but is within 3 months
Hardcopy Doc not Registered

STATUS PRE-READING IS MANDATORY (26-08-2026): read the Application Status BEFORE the click and record it. A date patched into the past does NOT make a record Expired the same day — the cron runs at midnight (R12). If the status still reads Approved when you click, the Expired → Approved half of this case (REQ-007/R16) proves nothing and passes anyway.
To manufacture one: `npm run set-expiry -- --app-no <no> --state expires-today`, then read it the next morning. Or pick one of the 65 Expired in-window records already on staging, which needs no wait.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Build or reuse an Approved application as in E2E_TS1
Set the expiry so the application is expired
Check the listing shows the past expiry date
On 15-09-2026, open the Registration Documents tab and click Extend
Type a remark and click Confirm
Check the new Application Expiry Date is 15-10-2026
Check the Application Status moved from expired back to Approved
Check the Extend button is now greyed with the once-only message
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

New expiry 15-10-2026. Status goes Expired → Approved. Button then greys.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

**STATUS SWEEP (R16) — mandatory wherever this case extends an application that is already Expired.** Read the Application Status in BOTH places, before and after the click: the Application Status column on the UCD Application Listing, and the Application Status in the right sidebar of the application itself. Expired → **Approved** on both, or it is a REQ-007 defect. Where the case extends BEFORE expiry the same two readings must show Approved **unchanged**. TS47 owns this check; these cases inherit it.

---

**EVIDENCE BAR FOR THE GREYED BUTTON (added 26-08-2026 night, R6).** Wherever this
case expects a **disabled / greyed Extend**, the screenshot must show the **once-only
tooltip painted** beside it — the button greys DURING the take, so it is the post-extension shot (`greyed-after`) that carries it — the key shot here is the offered button, before the click. The message read out of the HTML does not
count and never did: `.extend-tip` is `display:none` until `.extend-wrap:hover`,
so a sidecar can quote it in full over a still that shows a greyed button and no
reason at all. That is exactly what TS03's 26-08 take banked, and why it was sent
back.

Concretely, for this case to be signed off: the pointer is on `span.extend-wrap`
(not on the button — it is `pointer-events:none`), the tooltip is **visible in the
frame**, and its wording is Figma 9058-30492's *"This application has already been
extended. Each application can only be extended once."* The recorder refuses to
tick the shot without it, so a take that cannot show it comes back red rather than
green-with-a-note.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

**28-08-2026 — SEGMENT 1 IS BANKED. Record NA68001112.** Sidecar `SEG1-E2E_TS2_fx-260828-0848-041_dealer_bo_2026-08-28.txt`: CAPTURED 8/8, MISSING (0), NOT APPLICABLE (0), no R21 mismatch. Ran FULLY UNATTENDED — the saved gate session was reused ("gate: skipped — the restored session reaches the form directly"), so segment 1 no longer costs a reCAPTCHA tick. 8m25s. No extension spent; result stays "Not run". This row's precondition (expiry passed but within 3 months) is served by the patch to today plus one midnight — the cron writes Expired, not the support tool. Segment 2 is BLOCKED on EAINT-12235, same shape as E2E_TS1.

---



UNIT CORRECTED 26-08-2026: the upper bound is **3 calendar months** from the initial expiry date, not 90 days (BA-confirmed). Read the boundary off each fixture's own expiry date — three months is 89 to 92 days depending on the month, so a day count silently misclassifies rows by up to two days. The harness reads it from `src/dates.js`.

---

**29-08-2026 NIGHT — SEGMENT 1 FILMED 8/8. SEGMENT 2 IS OWED TOMORROW MORNING, AND THE WAIT IS THE POINT.**

`SEG1-E2E_TS2_fx-260829-1919-066_dealer_bo_2026-08-29.mp4` — 8/8 on **NA68001126**,
expiry patched to **2026-08-29, i.e. TODAY**, deliberately.

This row asserts Expired -> Approved (R16 / REQ-007) and **nothing on the QA side writes
Expired** — the midnight cron owns the status. So the expiry is set to expire tonight and
segment 2 films tomorrow, on a record the cron has actually expired. Filming it today
would read Approved before the click, and the Expired -> Approved half would pass while
proving nothing.

The seam file carries that reasoning rather than just the date — `patchTarget:
"expires-today"`, `patchWhy: "R16 needs Expired, and only the midnight cron writes it"` —
because a ymd alone cannot tell "today so it is still pre-expiry" from "today so the cron
expires it".

Tomorrow: `TS=E2E_TS2 EV_APP_NO=NA68001126 EV_SPEND=1 npm run evidence`. Read the status
BEFORE the click and record it.

---

**30-08-2026 NIGHT — PASS. Segment 2, 17/17, MISSING 0, R21 MATCH.**

Record **NA68001126**, created at the reCAPTCHA gate on 29-08 (segment 1, 8/8) with its expiry
patched to **29-08 deliberately** so the midnight cron would write Expired. Confirmed live before
the click on 30-08 at 19:2x: **status Expired**, one day past expiry so unambiguously in window,
never extended, control present and ENABLED.

That pre-reading is the point of the row. R12 gives the cron the status and no QA action can
force it, so filming this on an Approved record would have passed the Expired -> Approved half
(REQ-007/R16) while proving nothing. The wait between the segments IS the test.

Spent its R1. The record cannot be returned to this state and the take cannot be re-filmed.


---

## E2E_TS3 — Full flow: never extended, more than 3 months past expiry

**Objective:** Prove an application more than 3 months past expiry, never extended, offers no Extend at all.

**Preconditions**

An Approved application, never extended
Expiry set to more than 3 months ago
Hardcopy Doc not Registered

NO LONGER BLOCKED (Charmain, 26-08-2026 night). The fixture is manufacturable end to end — full recipe on R12.
TWO-HOP, and this order is the only one that is guaranteed:
  1. `npm run set-expiry -- --app-no <no> --state expires-today`
  2. wait one midnight — the cron writes Application Status = Expired
  3. `npm run set-expiry -- --app-no <no> --state after-window` — the tool moves the date and leaves the status alone, because it "does NOT reactivate an EXPIRED application; it only changes the date"
ONE-HOP worth trying first: patch straight to `--state after-window` and wait one midnight. It works only if the job sweeps every past-expiry row rather than just yesterday’s — and whichever way it lands is a measurement of the job nobody has taken.
BUILD IT ON A FIXTURE OF OUR OWN, not on a found record: this case says NEVER extended, and provenance is the only way to know that. A `CHARMAIN QA11982` fixture is clean by construction; a staging record is not.
CAUTION, one night wide: at step 2 the record is in-window, Approved and never extended, so it shows an ENABLED Extend button to every unblocked account. Keep it out of any run that clicks.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Set the application's expiry to more than 3 months ago
Check the expiry column shows the new value
Open the Registration Documents tab
Check there is no Extend button in the sidebar
Check the rest of the sidebar still looks normal — Assignee, Status, dates, Payment Document, Hardcopy Doc
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: there must be NO "Application Extended Remarks:" row — or, on a fixture that arrives already extended, the row must still hold the EARLIER remark, unchanged

**Expected result**

No Extend button at all.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case confirms **no** extension, so:

- Open the application's **details page** and read the **right sidebar**.
- There must be **NO "Application Extended Remarks:" row on it at all.**
- Read it on the same panel that shows **Application No:**. An absence read off a page with no sidebar — a dealer view, a BackOffice-generated stub (R19), an expired session — is not evidence of anything; it only says nobody looked at the right screen.
- **The one lawful exception, and it is measured rather than assumed:** where the fixture **arrives already extended**, the row is *correctly* there and holds the EARLIER extension's remark. Read the row **before** you start, and the check becomes *unchanged at the end* rather than *absent*. On an ordinary never-extended record those are the same check.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

**RE-RECORDED 29-08-2026 01:02 at today's ceiling - NA62000939, CAPTURED 14/14 (3 N/A), MISSING (0), EXPECTED STATE claims "absent", measured "absent" - MATCH.** Result unchanged.

---

PASS — 27-08-2026, headed, on NA62000939: never extended, more than 3 calendar months past expiry, and nothing is offered. Read-only, no fixture spent.

FILMED 27-08-2026 pm — house-format take on NA62000939, 12/13, R21 MATCH (claims "absent", measured "absent"). The declaration itself was fixed in the same pass: E2E_TS3 had been defaulting to "offered" in src/expectedState.js, for a scenario whose whole claim is that nothing is offered — the second wrong entry found in R21 own table, after TS01.7.


---

## E2E_TS4 — Full flow: extended once, then the extended period expires too

**Objective:** Prove the once-only rule survives even after the extended period itself runs out.

**Preconditions**

An application extended once
The extended period then set so it has expired too

The second precondition is now self-service: extend the fixture, note the new expiry, then `npm run set-expiry -- --app-no <no> --state expires-today` and read it the next morning. The status flip is the cron’s, at midnight (R12) — not the tool’s.
THE CONTRAST SHOT the expected result asks for is manufacturable on the SAME night: a second fixture, never extended, also at `expires-today`. Next morning both read Expired and only the extended one is greyed. Same status, one enabled and one greyed, side by side.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Extend an application once and note the new expiry
Move the clock or the expiry so the extended period has now passed
Check the Application Status shows it expired
Open the Registration Documents tab
Check the Extend button shows but is greyed with the once-only message
Try to click it — nothing should happen
Check no second extension is possible any way
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

**Application Status = Expired, and the Extend button still there, greyed, with the once-only message.** The extended expiry date is unchanged on the listing.

**ITS ORIGINAL WORDING WAS RIGHT ALL ALONG.** For a few hours on 26-08 this case was flipped to "Status Expired, and NO Extend control at all", on a reading in which a status change away from Approved hid the button. Charmain corrected that reading the same evening — *"this should be greyed + once only msg"* — so the flip has been reverted and the expectation is now confirmed rather than merely inherited.

CONTRAST WORTH CAPTURING IN THE SAME EVIDENCE: a **never-extended** application at Expired inside the window shows an **enabled** button (REQ-007/R16/TS47). Same status, and the only difference is the spent extension — enabled versus greyed. A screenshot of each is what proves the rule; either one alone looks like it contradicts the other.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**EVIDENCE BAR FOR THE GREYED BUTTON (added 26-08-2026 night, R6).** Wherever this
case expects a **disabled / greyed Extend**, the screenshot must show the **once-only
tooltip painted** beside it — the record arrives already extended, so this is the KEY shot. The message read out of the HTML does not
count and never did: `.extend-tip` is `display:none` until `.extend-wrap:hover`,
so a sidecar can quote it in full over a still that shows a greyed button and no
reason at all. That is exactly what TS03's 26-08 take banked, and why it was sent
back.

Concretely, for this case to be signed off: the pointer is on `span.extend-wrap`
(not on the button — it is `pointer-events:none`), the tooltip is **visible in the
frame**, and its wording is Figma 9058-30492's *"This application has already been
extended. Each application can only be extended once."* The recorder refuses to
tick the shot without it, so a take that cannot show it comes back red rather than
green-with-a-note.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

**FAIL — 27-08-2026. The Extend control is ABSENT where it must be GREYED. This is the day's one real product defect, and it is a REGRESSION from the same afternoon's C8 fix.**

RULED BY CHARMAIN, 27-08-2026: *"no should turn grey the srd is wrong."* REQ-005's *"The system shall stop displaying the Extend button once the application has been extended"* is the wording that needs amending — which is C7's 26-08 ruling restated, not a new decision. So this scenario stands EXACTLY as written and so does R6; src/expectedState.js keeps declaring it "greyed".

MEASURED, read-only, 27-08 15:46–15:50 — one probative record with two controls:
- NA68001086 — spent (Application Extended Remarks row present), Approved, ONE MINUTE past its own expiry so unambiguously in window: present=false, inDom=false. Not hidden — absent from the markup.
- NA66001071 — never extended, in window, before expiry: present + ENABLED.
- NA62000987 — never extended, status Expired, 91 days past expiry, still in window: present + ENABLED. This is the control that rules out "the post-expiry tail of the window is broken", which would otherwise explain NA68001086 with no reference to spent-ness at all.
- Do NOT cite NA68001099 or NA68001101 as evidence: both sit outside the window in opposite directions, so their absence is over-determined post-C8-fix and evidences neither rule.

IT IS A REGRESSION, not long-standing: pre-deploy the same morning those same records showed *present, disabled* with "This application has already been extended. Each application can only be extended once." (dry-run F5 table, 27-08 am). Most likely REQ-005 implemented literally by someone who had not seen C7's resolution.

FILM: evidence/EAINT-11982/video/TS03_NA68001086_assignee_2026-08-27.mp4 (13/13) and evidence/EAINT-11982/video/TS07_NA68001101_assignee_2026-08-27.mp4 (13/13). Both sidecars carry *EXPECTED STATE — claims "greyed"; measured "absent" — MISMATCH*, so the coverage is full and the CLAIM is failed: R21 doing its job.

---

**29-08-2026 ~22:30 — RECONCILE: same behaviour as TS07, and it now has a citable record.**

This row and TS07 fail for one reason, and E2E_TS6 has now hit it a third time in
end-to-end form. The controlled demonstration is in TS07's note above — four
already-extended records in one run, two in-window reading GREYED and two past the
window reading ABSENT, with NA68001124 crossing the boundary under observation.

Nothing about this row's own evidence has changed and the Fail stands. What has changed
is that the three Fails can now be reported together, on records dev cannot dismiss.

**No dev ticket exists for TS07, this row, or E2E_TS6.** Three Fails, nothing raised
behind them. That is the outstanding item, not the measurement.

**29-08-2026 ~23:30 — RULING APPLIED: the two-sitting split is built, and the blocker on this row is stale.**

**EAINT-12235 IS FIXED**, measured not assumed: TS03's 28-08 take on NA68001086 read
`present=true inDom=true enabled=false` with the once-only tooltip painted and matching Figma
9058-30492, and moved to Pass. So `greyed-after` is filmable and the *"BLOCKED while EAINT-12235 is
open"* line in `blockedBy` no longer describes anything.

**THIS ROW IS NOT TS07's COLLISION.** Its record stays INSIDE the window — the extended expiry is
patched to expires-today, so after the cron it sits ~1 day past expiry. That is TS03's shape, which
passes today. E2E_TS4 should pass once it runs.

**WHAT WAS ACTUALLY WRONG WITH IT — two declarations, both describing the opposite record.**
`shapeOf` returned `extend` (it was not in GATING_SWEPT) and `expectedFor` returned `offered`
(no entry, so it took the extend-shape default), against a register row whose expected result opens
*"the Extend button still there, greyed, with the once-only message"*. On its own fixture the take
would have (a) reported `claims "offered"; measured "greyed"` on a CORRECT record — the R21 pattern
for the fifth time — and (b) driven `openExtendModal()` at a `.extend-btn:disabled` carrying
`pointer-events:none`, burning the action timeout and losing every point after it.

**FIXED as an ARM, not a second register row** — same mechanism as TS52 arm D, so the register keeps
one row for one scenario:

- **arm A** (default) — extend-shaped, button OFFERED, spends R1. Then patch the NEW expiry with
  `npm run set-expiry -- --app-no <no> --state expires-today --yes`.
- **arm B** — `TS=E2E_TS4 EV_ARM=B EV_APP_NO=<same record> npm run evidence`, the next morning
  after the cron writes Expired. Gating-swept, button GREYED, 15 points, **spends nothing** — so no
  `EV_SPEND`, and it refuses to pick a record for itself.

Arm B is where this row is judged; arm A alone cannot test it, because the extended period has not
passed yet. `SWEPT_ARMS` in triggerPoints.js is the single declaration, so shape, spend gate,
checklist and the `noAction` flag all follow from one decision. Proven offline in both directions
by `npm run probe:e2ets4` — nothing spent. Segment 1 is already filmed on **NA68001116**
(28-08 11:44, patched expiry 2026-08-28).

**Result stays Fail** — it has never been filmed past segment 1, and a Fail is not cleared by fixing
the rig that would have measured it.

---

**PASS — 01-09-2026 08:07, arm B on NA68001154. CAPTURED 15/15, MISSING (0), `EXPECTED STATE —
claims "greyed"; measured "greyed" — MATCH`.**

`Application Status="Expired"`, the once-only greyed control still on the page, lifecycle ticked.
That is the full arc this row exists to demonstrate: extended once, the extended period itself ran
out, and the greyed button SURVIVED it.

**THE FAIL ABOVE IS STALE AND IS NOW CLEARED.** It was raised 27-08-2026 — *"the Extend control is
ABSENT where it must be GREYED"* — and tracked as **EAINT-12235**, which was FIXED and retested
PASS on 28-08-2026. This take is the third independent confirmation and the first on camera in
this row: a spent record, past its own expiry, control present and disabled.

**The cron ran** — the gate was checked before any take was spent: NA68001154 went Approved ->
Expired overnight, which is what makes every claim on it readable.


---

## E2E_TS5 — Full flow: two users extend at the same time

**Objective:** Prove the clash handling works end to end with two real BackOffice users.

**Preconditions**

Two BackOffice users with access to the same application
One eligible application, never extended

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Both users open the application's Registration Documents tab
Both click Extend and type different remarks
User A confirms first and waits for success
User B confirms
Copy user B's error message exactly
Refresh both sessions
Check exactly one extension went through and the expiry moved by 30 days once
Check the saved remark is user A's
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

One succeeds, one is refused with the refresh message. Extended once.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

**PASS - 28-08-2026 23:45, NA63000997. CAPTURED 19/19, MISSING (0), EXPECTED STATE MATCH.**

Unblocked by the same two seam fixes as TS14/TS28/TS39. Two BackOffice users on one eligible application, both pop-ups open, A wins at the seam, B refused with R10 verbatim, expiry moved once (2026-06-07 16:32 -> 2026-09-27 23:48).

---

**THE preConfirm SEAM LANDED 28-08-2026 night — this row is UNBLOCKED and still UNFILMED.**

The recorder had exactly ONE Confirm, hard-wired, with every mid-flight branch coded AFTER it, so this row could not stage its own scenario at all. `src/preConfirm.js` now runs registered hooks in order immediately before Confirm; a hook that THROWS refuses its own trigger point with the measured reason instead of ticking; and a branch that must order several Confirms can OWN the click, stated in the sidecar either way. Proven offline by `npm run probe:seam` — no browser, no fixture.

**Still owed: a frame-verified take.** Each of these legs executes for the first time on a take that spends an irreversible extension (R1), so cut frames at the decisive moment on the first take and confirm the camera saw what the sidecar claims. The log only reports what the code did.
**What changed for the race rows.** Session B is now opened, filmed and left HOLDING its pop-up BEFORE the seam; session A confirms AT the seam, which is the race’s genuine first click. The old code opened B *after* A had already committed, then re-opened A’s modal and confirmed a SECOND time under the caption "Session A confirms first" — against a record whose one extension was already spent. Both sessions were racing something that had finished, and the take recorded two refusals as though that were the contest. Needs `EV_ROLE_B` set to a second account with reach to the same record.

---

REQUIREMENT-BACKED 26-08-2026 (R10). The restatement states the concurrency behaviour directly and quotes the refusal message verbatim, so the string assertion is no longer a judgement call — a mismatch is a defect. The restatement also marks concurrency **lower priority**: if time gets tight, this case goes behind the arithmetic and gating cases. (TS14 is the exception — it is the once-only rule under load.)


---

## E2E_TS6 — Full flow: extended once, then pushed past the 3-month window

**Objective:** Prove the greyed message stays forever once the 3-month window closes behind an already-extended application.

**Preconditions**

An application extended once
Expiry then set beyond the 3-month post-expiry window

BOTH preconditions are self-service as of 26-08-2026 night (R12). Extend the fixture first, then take its extended expiry beyond the window. Guaranteed route: `--state expires-today`, wait one midnight for the cron to write Expired, then `--state after-window` — the tool moves the date under an Expired status without disturbing it.
The step "set the dates even further back and check again" is now genuinely repeatable, which is what makes "stays forever" more than one reading.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Extend an application once
Set its dates so it is more than 3 months past the original expiry
Open the Registration Documents tab
Check the greyed Extend button and its message still show
Set the dates even further back and check again
Check the greyed state stays forever — the button never disappears
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

Greyed button and the once-only message stay. Passing the 3-month window does not remove the greyed rendering: the window governs whether an extension is OFFERED, and this application has already spent its one.

**CONFIRMED 26-08-2026 (evening), no longer QA's inference.** This was the open half of Q27 — the ruling that settled the Registered case never mentioned the window, so "stays" was a reading. Charmain settled it on the neighbouring row (extended, then Expired → *"greyed + once only msg"*), which closes the window half by the same logic. A brief rewrite of this case as a status fork earlier the same evening has been reverted.

Registered removes the greyed button whatever the window says (R9 / TS01.8) — that is still the one confirmed remover.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**EVIDENCE BAR FOR THE GREYED BUTTON (added 26-08-2026 night, R6).** Wherever this
case expects a **disabled / greyed Extend**, the screenshot must show the **once-only
tooltip painted** beside it — the record arrives already extended, so this is the KEY shot. The message read out of the HTML does not
count and never did: `.extend-tip` is `display:none` until `.extend-wrap:hover`,
so a sidecar can quote it in full over a still that shows a greyed button and no
reason at all. That is exactly what TS03's 26-08 take banked, and why it was sent
back.

Concretely, for this case to be signed off: the pointer is on `span.extend-wrap`
(not on the button — it is `pointer-events:none`), the tooltip is **visible in the
frame**, and its wording is Figma 9058-30492's *"This application has already been
extended. Each application can only be extended once."* The recorder refuses to
tick the shot without it, so a take that cannot show it comes back red rather than
green-with-a-note.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

C7 (26-08-2026): reads the already-extended page past the window, so it inherits both C7 and the open half of Q27.

UNIT CORRECTED 26-08-2026: the upper bound is **3 calendar months** from the initial expiry date, not 90 days (BA-confirmed). Read the boundary off each fixture's own expiry date — three months is 89 to 92 days depending on the month, so a day count silently misclassifies rows by up to two days. The harness reads it from `src/dates.js`.

---

**29-08-2026 NIGHT — FILMED, 8/8 + 16/17, AND THE ONE MISS IS A BUILD FINDING.**

Segment 1 `SEG1-E2E_TS6_fx-260829-1911-065_dealer_bo_2026-08-29.mp4` — 8/8 on
**NA68001125**. Segment 2 `E2E_TS6_NA68001125_assignee_2026-08-29.mp4` — 16/17. The
missing point is `lifecycle`, and it is missing because the thing this row exists to
film **was not there**.

**Pushing an already-extended application past the 3-month window REMOVED the Extend
control entirely instead of leaving it greyed.** One variable, both readings on film:

- after the extension (93.0s): `present=true inDom=true enabled=false`, once-only
  tooltip PAINTED, wording matching Figma 9058-30492;
- support tool moves the expiry `2026-10-13 19:12` -> `2026-05-01 19:12`, "Rows
  Affected 1", the tool window on the recorded display;
- after: `present=false inDom=false enabled=false` — gone, not greyed.

The competing explanations are ruled out in the same sidecar: `Hardcopy="Pending UCD"`
so R9 does not apply, and the audit row reads `[Application Status] old: Approved new:
Approved`. The positive control is inside the run — the greyed control with its message
was filmed ninety seconds earlier on the same record.

This contradicts R6 (*"IT SURVIVES THE EXPIRY DATE PASSING"*) and this row's own expected
result, which Charmain settled on 26-08 and is therefore not QA inference.

**It is NOT a duplicate of EAINT-12235.** That one removed the button ON EXTENSION; here
the button survived the extension correctly and vanished later, when the window closed.
Different trigger, and 12235 is fixed on this build. **Not raised in Jira — Charmain
decides.** The row stays where it is: MISSING 1 is not a clean sidecar.

Same take re-confirms the arithmetic: audit `[Application Expiry Date] old: 13-09-2026
7:12pm -> new: 13-10-2026 7:12pm` — R3, +30 from the ORIGINAL expiry, time of day
carried.

---

**29-08-2026 ~22:15 — CONFIRMED ON A SECOND RECORD, WITH ITS OWN POSITIVE CONTROL.**

`scripts/probe-r6-window-contrast.js`, fresh browser, four already-extended records, so
nothing was spent:

| record | window | status | hardcopyDoc | extended | control |
| --- | --- | --- | --- | --- | --- |
| NA68001111 | IN-window | Approved | Pending UCD | yes | present, GREYED |
| NA68001112 | IN-window | Approved | Pending UCD | yes | present, GREYED |
| NA68001124 | PAST window | Approved | Pending UCD | yes | ABSENT |
| NA68001125 | PAST window | Approved | Pending UCD | yes | ABSENT |

Identical on every axis that could explain it — Approved, Pending UCD, already extended
— and differing only in window position. The two in-window rows are the positive control
IN THE SAME RUN. NA68001124 crossed the boundary under observation: greyed at 45 days
before expiry, absent once moved to 120 days past it.

**A first confirmation attempt reported NOT REPRODUCED and was wrong.** It read the
control seconds after the support-tool patch, and the page still rendered the old state
— the render lags the write. That error runs in the dangerous direction: a stale read
shows the control STILL GREYED, which is what this row claims should happen, so it would
tick the point and hide the defect as a PASS. The lifecycle leg now re-reads until two
consecutive readings agree and prints the settle time into the sidecar.

The finding stands, on two records. Still not raised in Jira.

---

**29-08-2026 ~22:30 — THIS IS TS07 / E2E_TS4, THIRD INSTANCE. NOT A NEW DEFECT.**

Checked the register after the measurement, which should have come first. **TS07**
("Already extended, more than 3 months past expiry — greyed button stays") and
**E2E_TS4** ("extended once, then the extended period expires too") are BOTH already
`Fail` for exactly this. E2E_TS6 is the same rule in end-to-end form, and it should be
read and reported alongside them, not on its own.

**What this run adds is the evidence TS07 says it lacks.** TS07 own notes warn that
NA68001099 / NA68001101 are OVER-DETERMINED — outside the window, so the absence can be
blamed on the window alone — and say plainly: do not cite them to dev. The 22:15 run
supplies the clean version: NA68001124 crossed the boundary UNDER OBSERVATION, greyed at
45 days before expiry and absent once moved to 120 days past it, with two extended
in-window records reading greyed in the same run as controls.

It also confirms EAINT-12235 is genuinely fixed: extended + in-window renders GREYED
today, where on 27-08 that combination rendered ABSENT. The two behaviours are now
cleanly separated — the button survives the extension, and dies when the window closes.

**DO NOT rerun this row hoping to improve it.** A rerun costs a fresh fixture and returns
the same 16/17: `lifecycle` cannot tick while the build behaves this way. Re-film only
as a RETEST after a fix.

**No dev ticket exists for TS07, E2E_TS4 or this row.** Three Fails, nothing raised.

---

**29-08-2026 ~22:30 — RECONCILE: no rerun. A rerun cannot improve this row.**

Confirmed against the sweep: segment 1 8/8, segment 2 16/17, and the single missing point
is `lifecycle` — which cannot tick while the build removes the control past the window.
A rerun costs a fresh fixture (both segments) and returns the same 16/17. **Re-film only
as a RETEST after a fix.**

The row stays at its current result: MISSING 1 is not a clean sidecar, so nothing moves.
The take itself is complete coverage with the claim correctly failed — R21 doing its job,
exactly as TS07's takes do.

**29-08-2026 ~23:30 — RULING APPLIED: same two declarations wrong, same fix — and do NOT run it before the fix lands.**

This row is **E2E_TS4's twin** and carried the identical fault: `shapeOf` = `extend`,
`expectedFor` = `offered`, against a row whose expected result opens *"Greyed button and the
once-only message stay"*. Corrected 29-08-2026 by adding it to `SWEPT_ARMS`:

- **arm A** — extend-shaped, OFFERED, spends R1; then take the extended expiry beyond the window.
- **arm B** — `EV_ARM=B`, gating-swept, GREYED, 15 points, spends nothing.

**IT IS A KNOWN FAIL ON TODAY'S BUILD, and running it now would waste an irreplaceable extension.**
Its claim — the greyed button survives past expiry + 3 calendar months — is exactly what TS07 has
already measured as absent on NA68001101, and what EAINT-12245 was raised for. Arm A spends an
extension to reach arm B; arm B would then film the same absence TS07 already holds on camera.
**Hold this row until EAINT-12245 is fixed**, then run both arms.

**29-08-2026 ~23:55 — CORRECTION: the 23:30 note above is WITHDRAWN. This row was never mis-declared, and it has already run.**

**It has film.** `E2E_TS6_NA68001125_assignee_2026-08-29.txt`, 29-08 19:55 — **CAPTURED
16/17**, and the key shot reads *EXPECTED STATE — E2E_TS6 claims "offered"; measured
"offered" — MATCH*. So `offered` was the correct declaration all along.

**Why the 23:30 reading was wrong.** It took this row's precondition — *"An application
extended once"* — as a statement about the fixture. On a segmented E2E row it is not: the
precondition describes the state the SCENARIO is about, and **segment 2 performs the
extension itself**. The sidecar shows exactly that: `EXTENDED REMARKS (sidebar, BEFORE)
present=false`, control `present=true enabled=true`, then Confirm, then `greyed-after`
with the tooltip painted and matching Figma.

**And it does NOT need two sittings.** The arm added at 23:30 was removed the same night.
E2E_TS4 needs an arm because its scenario requires the status to read **Expired**, and only
the midnight cron writes that. E2E_TS6 needs only the expiry pushed past the window, and the
support tool does that MID-TAKE — the sidecar records it: *expiry `2026-10-13 19:12` →
`2026-05-01 19:12`, "Rows Affected 1"*, and the control afterwards read `present=false
inDom=false`. Splitting the row would have thrown away its best property: **one record
crossing the boundary under observation, greyed before and absent after, in a single film.**

**The one thing genuinely outstanding is the MISSING 1.** `lifecycle` could not tick,
and its own line says why: *"once the window was pushed shut the control read present=false
... there was no greyed state left to film — that is the finding, not a gap in the
recorder."* So the row stays **Not run** (MISSING 1 is not a clean sidecar) and re-filming
it now would cost a fresh fixture and return the same 16/17.

**This take is the strongest exhibit for EAINT-12245** — better than the five-record ladder
in the ticket, because the variable moves on ONE record while everything else is held. It has
been added to the ticket as a comment.

---

**31-08-2026 — PASS. Segment 2 re-filmed, 17/17, MISSING 0, R21 MATCH, on NA68001150.**

Film: `E2E_TS6_NA68001150_assignee_2026-08-31.mp4`. Segment 1 was 8/8 the night before.

**THE POINT THAT WAS MISSING IS THE POINT THAT NOW PASSES.** The 29-08 take scored 16/17 and the
one miss was `lifecycle` — the thing this row exists to prove. Pushing an already-extended record
past the 3-month window REMOVED the Extend control instead of leaving it greyed, and that reading
was taken with a single variable and both halves on camera: greyed with its once-only tooltip
ninety seconds earlier, gone after the support tool moved the expiry. It became **EAINT-12245**.

**The fix is witnessed on the record that caught it.** NA68001125 was probed on 30-08 still
sitting at 2026-05-01 — four months past its expiry, well outside the window — and read
`present=true inDom=true enabled=false`, tooltip painted, wording matching Figma 9058-30492.
Same record, opposite reading.

This re-take is on a NEW record because NA68001125's one extension was spent proving the defect.
R6 outlives the window closing, as ruled.


---

## E2E_TS7 — Full flow: post-expiry extension, dealer finishes on the portal

**Objective:** Prove the dealer can actually finish the application the extension was granted for.

**Preconditions**

An application extended after expiry, now back at Approved
The dealer application link at hand
A clean browser session for the dealer side

STATUS PRE-READING IS MANDATORY (26-08-2026): read the Application Status BEFORE the click and record it. A date patched into the past does NOT make a record Expired the same day — the cron runs at midnight (R12). If the status still reads Approved when you click, the Expired → Approved half of this case (REQ-007/R16) proves nothing and passes anyway.
To manufacture one: `npm run set-expiry -- --app-no <no> --state expires-today`, then read it the next morning. Or pick one of the 65 Expired in-window records already on staging, which needs no wait.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Extend an expired application and check the status is back to Approved
Copy the Application Link from the Pre-Application tab sidebar
Open it in a clean session as the dealer
Check the eAuto Application Form loads at the right step
Finish the remaining step and submit
Check the submission reaches BackOffice and shows on the UCD Application Listing
Check the application can carry on through the normal flow
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

The dealer reaches and submits their application.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

**STATUS SWEEP (R16) — mandatory wherever this case extends an application that is already Expired.** Read the Application Status in BOTH places, before and after the click: the Application Status column on the UCD Application Listing, and the Application Status in the right sidebar of the application itself. Expired → **Approved** on both, or it is a REQ-007 defect. Where the case extends BEFORE expiry the same two readings must show Approved **unchanged**. TS47 owns this check; these cases inherit it.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

---

**29-08-2026 NIGHT — SEGMENT 1 FILMED 8/8. SEGMENT 2 IS OWED TOMORROW MORNING.**

`SEG1-E2E_TS7_fx-260829-1927-067_dealer_bo_2026-08-29.mp4` — 8/8 on **NA68001127**,
expiry patched to **2026-08-29, i.e. TODAY**, for the same reason as E2E_TS2: this row is
the POST-EXPIRY extension, so the record has to be Expired when Confirm is clicked, and
only the midnight cron writes that.

Its lifecycle leg is written and proved runnable but has never run live: after the
extension it opens the dealer's own link in a clean session and asks whether the
extension actually handed the application back. The link is read from the rig's fixture
checkpoints via `fixture.dealerLinkFor()` — it carries a signature that appears nowhere
in the markup, so no selector could rebuild it.

Tomorrow: `TS=E2E_TS7 EV_APP_NO=NA68001127 EV_SPEND=1 npm run evidence`.

---

**30-08-2026 NIGHT — PASS. Segment 2, 17/17, MISSING 0, R21 MATCH.**

Record **NA68001127**, same shape as E2E_TS2: gate-created 29-08 (segment 1, 8/8), expiry patched
to 29-08 so the cron would expire it, confirmed **Expired, in window, control ENABLED** before the
click. This is the POST-EXPIRY extension, so the record had to be genuinely Expired at Confirm.

**Its dealer-side lifecycle leg ran live for the first time.** After the extension it opens the
dealer's own application link in a clean session and asks whether the extension actually handed
the application back. That link is read from the rig's fixture checkpoints via
`fixture.dealerLinkFor()` — its signature appears nowhere in the markup, so no selector could
rebuild it. The leg had been proven runnable offline since 29-08 and had never been exercised.

Spent its R1.


---

## E2E_TS8 — Full flow: created before the deploy, extended after it

**Objective:** Prove an application created before the deploy extends exactly like a new one.

**Preconditions**

An application created before the EAINT-11982 deploy (2026-08-19)
Still Approved, Hardcopy Doc not Registered, NEVER extended
Rig fixture: NA68001164 (created 2026-07-02 16:04, expiry 2026-09-30 16:04 — created + 90, so natural). Read live 31-08: Approved, Hardcopy blank, Extended Remarks absent, control present and ENABLED.

STEP 7 NEEDS A SECOND RECORD — a POST-deploy application extended the same way, for the comparison this row is named for. That one is buildable through the normal Pre-Application route and is not scarce; build it fresh for the take rather than pinning one.

EXEMPT FROM THE GATE RULE (Charmain, 27-08-2026 night). Every other E2E row films from the reCAPTCHA gate. This one cannot: its single precondition is a record created BEFORE the deploy, and a record created at the gate today is post-deploy BY CONSTRUCTION. It films from BackOffice on a genuine pre-deploy record, chosen by src/provenance.js and NEVER by a date filter — staging has no clean deploy boundary, created+90 and the deviations interleave by minutes.

**Steps**

Find a pre-deploy application using the Application Created Date filter
Check it has an Application Expiry Date
Open the Registration Documents tab and check Extend is offered
Extend it with a remark
Check the maths follows R3 or R4
Check the button then greys with the once-only message
Compare the whole result with a post-deploy application extended the same way
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

Behaves exactly like a post-deploy application.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

---

**UNBLOCKED 31-08-2026, AND THE BLOCKER WAS OURS.** The 29-08 finding — *"every
natural pre-deploy record on staging is `Hardcopy & Acc Created = Registered`"* —
came from `scripts/probe-predeploy-usable.js`, which drops every record whose
Hardcopy value is blank (`r.stage5Status !== '-'`) before asking any question.
Blank is not Registered; those are precisely the usable ones. Corrected census over
the same population:

| | count |
| --- | --- |
| pre-deploy (created < 2026-08-19) | 2504 |
| ...NOT Registered | **2440** |
| ...carrying an expiry | 302 |
| ...IN-WINDOW today | **80** |
| ...out of window but patchable | 222 |

So the supply is eighty usable today, not zero, and there is no BA question to ask.
The three records Charmain named all pass every gate — verified read-only in
`discovery/106-candidates-31aug.json`, no Confirm clicked.

---

**AND ITS PRECONDITION IS NOW FILMED (31-08-2026).** This row had `lifecycle` and nothing else from the E2E family loop, so *"created before the deploy"* — its single stated precondition, and the whole reason it is exempt from the gate rule — had no checklist point that looked at it. A take could have scored a full 17/17 without ever evidencing its own subject. It now carries a `predeploy` point as well; ceiling 17 → 18, which unfinished nothing because the row has no banked take. Same shape of gap as the hard-coded `lifecycle` miss.

**Notes**

**FILMED 31-08-2026 19:04 — 18/18, MISSING 0, precondition MET, R21 MATCH.**

Record NA68001164 (TYTEST UCD GROUP 008), created 2026-07-02 16:04 — pre-deploy, delta 90 days, natural. Filmed from BackOffice under the 27-08 gate-rule exemption.

| | before | after |
| --- | --- | --- |
| Application Expiry Date | 2026-09-30 16:04 | **2026-10-30 16:04** |
| Application Status | Approved | Approved |
| Extend control | present, enabled | present, **greyed** |
| Listing / export Remarks | - | - |

**THE COMPARISON THIS ROW IS NAMED FOR WAS ACTUALLY MADE.** Comparator NA68001161 — created 2026-08-31 17:41, i.e. POST-deploy, and already extended at 17:55 — was read side by side with the subject:

| | pre-deploy NA68001164 | post-deploy NA68001161 |
| --- | --- | --- |
| Application Status | Approved | Approved |
| Extend control | present, greyed | present, greyed |

Status AGREE, control AGREE. The comparator is READ, never extended, so it cost nothing and needed no build — which is what kept this row unattended (a fresh comparator would have dragged a reCAPTCHA and a person into it).

**TWO GAPS WERE CLOSED BEFORE THE TAKE, AND EITHER WOULD HAVE COST THE RECORD.** (1) The row had no entry in `LIFECYCLE_CLAIM`, and an undeclared row REFUSES the point by design — the take would have spent the extension and come back 17/18, missing the one point the row exists for. (2) The row had no `predeploy` point at all, so *"created before the deploy"* — its single stated precondition, and the whole reason it is exempt from the gate rule — had nothing filming it. Ceiling 17 → 18. The new lifecycle leg is proven both ways offline by `npm run probe:lifecycle` (55 checks): it executes, it ticks on a correct record, and it can be made to FAIL on a wrong one.

video `E2E_TS8_NA68001164_assignee_2026-08-31.mp4`


---

## E2E_TS9 — Full flow: the overnight auto-expire job after a fresh extension

**Objective:** Prove the overnight auto-expire job uses the new extended date — the application stays Approved on the original expiry night, and only expires at the new date.

**Preconditions**

An Approved application whose original expiry falls tonight
Know when the auto-expire job runs
A way to see the job's effect next morning, or trigger it manually

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Set an application's expiry to later today
Check the listing shows that expiry and Application Status = Approved
Extend the application today, before that expiry passes
Note the new expiry — original + 30 days
Let the original expiry pass and the overnight job run
Next morning, check the Application Status
It should still be Approved — the job used the extended date, not the original
Move or wait until the extended expiry passes, and let the job run again
Check the application only now becomes Expired
Check the Extend button stays greyed with the once-only message the whole time
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

The job leaves it Approved on the original date (it reads the new expiry), and only expires it when the extended date passes.

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

Brainstorm #12 — E2E_TS4 proves the job eventually fires on the extended period; this proves it does not wrongly fire on the old date. Classic "new column the job doesn't read" defect.

RACE VARIANT, noted 26-08-2026: this case proves the job READS the new date. It does not cover the job RUNNING at the instant the extension commits — job reads the old expiry, extension writes the new one, job writes Expired over it. If the job can be triggered on demand, fire it and confirm an extension inside the same few seconds, then check the application is Approved with the extended date and not Expired with it. If it cannot be triggered, record that this window is untested rather than leaving it to look covered.

26-08-2026: the overnight job has a second thing to check after an extension — per 11868 v1.4 §2.2.4 item 8 the reminder cycle resets, so a freshly extended application should be back in the reminder population against its NEW expiry date, having already had reminders against the old one. Out of scope to test here, in scope to observe if the job is being watched anyway.

**RUN TS55 ON THE SAME NIGHT (26-08-2026).** This flow proves the overnight job uses the extended date — in BackOffice only; its assertions are Application Status and the greyed button. TS55 reads the DEALER side across the same boundary on the same fixture shape. One night serves both, and reading both surfaces on the same morning is what turns a disagreement between them into evidence instead of two separate ambiguous results.

**AUTOMATED 26-08-2026 evening — `npm run test:overnight`.** Needs: the evening leg then the morning leg — the baseline crosses the night in fixtures/overnight.json.

Written, listed and syntax-checked; **not yet run** except where a result says otherwise. A script is not a pass.

**RUN IT AS A THREE-FIXTURE NIGHT (26-08-2026 night).** The recipe that unblocked E2E_TS3 makes this case cheap to pair up, and one night can carry all of it because every fixture starts from the same `--state expires-today`:
  A  not Registered, NOT extended → must read Expired next morning. The positive control: it proves the cron fired at all.
  B  Registered, not extended → must still read Approved (R12). The pair A+B is TS21’s missing manual control.
  C  extended today, original expiry today → must still read Approved, because the job must read the NEW date. That is this case.
C on its own is the weakest form of this test: if the cron simply did not run that night, C passes and proves nothing. A is what makes C evidence — the same "a negative result needs a positive control in the same run" that the endpoint probe was caught by.

---

**31-08-2026 — THIS ROW NOW HAS A MAILBOX POINT. It has always had a mailbox STEP.**

The step has been in the register since it was written; nothing on the checklist ever asked
for it, so a take could film the whole record, tick complete, and never open the catcher.
TS19 was the only row that could see a mailbox at all.

**NOT TS19'S SHAPE, and the difference is why it is one point and not three.** TS19 measures
an absence across a MOMENT — the Confirm click — so it needs a before line, an after line and
a liveness reading inside its own timeline. This row measures an absence across a CRON NIGHT
that ended before the take started. There is no before/after to take: there is one SEARCH of
the record's whole history, driven through the inbox's own search box (`quick_filter`).

**Why a search and not a scroll.** The sandbox caps at 600 messages and evicts the oldest, so
scrolling for an absence proves nothing about a record whose mail may simply have aged out. A
search that returns the record's OTHER mail and no reminder is a real absence, in frame, with
its own positive control beside it. **Zero rows is refused, not passed** — it cannot tell "no
reminder was sent" from "nothing for this record is in the catcher".

Driven by `mailtrap.reminderVerdict`, provable offline: **`npm run probe:mailbox`, 16/16**,
including the two cases where it must refuse.

**Point:** `mailbox-rearm`. Ceiling **17 -> 18**, and `lifecycle` is kept — the point is
appended after the E2E loop, not in place of it, because a `??` there would have swallowed it
exactly the way `lifecycle` was swallowed once already.

**A DIFFERENT KEY BECAUSE IT IS A DIFFERENT CLAIM, and the two must never be read as each
other.** This record is NOT Registered — it was extended, and 11868 v1.4 §2.2.4 item 8 RE-ARMS
the reminder cycle against the new expiry. That new expiry is thirty days out, so nothing is
due yet and the clean reading looks the same as TS21's. But a reminder that DOES appear here
is **not automatically a defect**: against the new date it is the re-arm working, against the
old one it is the fault. The date inside it decides, and that is a person's reading — so the
leg films it and refuses the point rather than asserting a verdict it cannot compute.

---

**READY, and it is a TWO-SITTING run — the midnight is the test.**

Arm B is declared (`EV_ARM=B`), so a take cannot film the setup and call itself complete.
Sitting 1 extends and patches the new expiry to expires-today; the cron runs; sitting 2 films
the next morning. Fixture: one of the two usable records.

`mailbox-rearm` rides sitting 2 and costs nothing extra — it is one search of a catcher that
is already open.

**THE POOL, MEASURED 31-08-2026 10:47** — `npm run pool:status -- --max-probe 60`, and it
accounted for every record this time (59 shortlisted = 54 spent + 3 not ours + 2 usable), so
the count is not one of the undercounts this script has produced before.

| | |
| --- | --- |
| Approved population | 136 |
| shortlisted (in-window) | 59 |
| already extended (R1, spent) | 54 |
| eligible but another session's | 3 |
| **USABLE** | **2** — `NA68001132` (expires 2026-09-15 00:00) and `NA68001121` (2026-09-15 17:11) |

Both are QA-built (`CHARMAIN QA11982 ...`), which matters here and nowhere else: a QA-built
record HAS mail in the catcher, and a mailbox point on a record with no mail cannot be made.

---

**ARM A FILMED — 31-08-2026 13:08, NA68001121. CAPTURED 18/18, MISSING (0), `EXPECTED STATE —
MATCH`.** Sidecar `E2E_TS9_NA68001121_assignee_2026-08-31.txt`. **The row stays Not run: arm B is
the sitting where it is judged, and that is tomorrow morning.**

The setup arm B needs is banked, in the take's own words:

> the expiry it carried, **2026-08-31 17:11**, sat in-window; after the extension the listing reads
> **2026-09-30 17:11** — in the future: YES. Tonight the job has to read THAT date and not the old one.

**Cron control: `NA68001157`**, expiry patched to 2026-08-31 11:16 — already elapsed, Pending UCD,
so it MUST flip to Expired overnight. Without it, "the job left our record alone" and "the job did
not run" look identical.

**That control is also E2E_TS10's fixture, deliberately.** A same-day expiry flips to Expired and
STAYS in-window, so tomorrow it is still unspent and still extendable. One record does both jobs
and no extra fixture was built for it.

---

**A FAULT OF MINE, CAUGHT ON THIS TAKE AND FIXED: `mailbox-rearm` WAS ON BOTH ARMS.**

It was appended to the row unconditionally when the point was added this morning, so arm A carried
it too — and **arm A runs BEFORE the midnight the point is about**. "No expiry reminder fired
against the old date" is trivially true there: nothing has had the chance to fire. This take ticked
it CLEAN, on the strong control (ten real messages for NA68001121, none a reminder), and **the tick
meant nothing**.

That is the same fault the arm split itself exists to fix, one level down — a sitting reporting
itself complete for a claim it cannot yet observe. `pointsFor` now removes the point from every arm
except the swept one, in the same per-arm idiom `AUDIT_PRECONDITION` already uses:

| | before | after |
| --- | --- | --- |
| arm A ceiling | 18, carries `mailbox-rearm` | **17, does not** |
| arm B ceiling | 16, carries it | 16, carries it |

**The board now reads `18/17` for this take** — 18 points captured against a ceiling since lowered.
That is cosmetic and it is left alone rather than massaged: the sidecar is a truthful record of what
was filmed, and the extra point is one that should never have been on this arm.

**The mailbox reading itself is still worth having** and is in the sidecar: `control=record (10)`,
verdict CLEAN. It just does not belong to this arm as a scored point.

**NA68001121 is now SPENT** (R1). Arm B tomorrow:

```bash
TS=E2E_TS9 EV_ARM=B EV_APP_NO=NA68001121 EV_CRON_CONTROL_APP_NO=NA68001157 npm run evidence
```

---

**PASS — 01-09-2026 08:11, arm B on NA68001121. CAPTURED 16/16, MISSING (0), `EXPECTED STATE —
claims "greyed"; measured "greyed" — MATCH`.**

**The claim is proven.** After the midnight cron the record reads `Application Status="Approved"`,
not Expired. Its ORIGINAL expiry was `2026-08-31 17:11` and the extension moved it to
`2026-09-30 17:11` — so the job read the NEW date and left it alone. That is the whole scenario.

**And the job demonstrably ran**, which is the half an absence always owes: the cron control
`NA68001154` flipped Approved -> Expired the same night. Without it, "the job left our record
alone" and "the job never ran" would look identical.

`mailbox-rearm` carried by the STRONG control — `control=record (10)`: ten messages for this
application in the catcher and not one of them a reminder. REQ-009 holds across the cron night.


---

## E2E_TS10 — Full flow: extended once, then Registered, then the extended expiry passes

**Objective:** Walk Charmain's 26-08 sentence end to end — extend once, register the company, then let the extended expiry pass — and prove everything remains the same. Joins TS01.8 (the greyed button goes at Registered) to R12 (Registered never expires).

**Preconditions**

An application extended exactly once — the greyed Extend and the once-only message on screen
Registration fee paid, so Create Account can be completed
Its EXTENDED expiry patchable to the near past (dev date-patch, Q12), or already close
TERMINAL AND DESTRUCTIVE: the fixture ends its life here. Run it after everything else that needs it, and after TS01.8 — or fold TS01.8 into its first half.

26-08-2026 night — the date half is self-service (`npm run set-expiry`, Q12), but note what the cron does NOT do here. By the time this flow reaches its last step the fixture is **Registered**, and R12 says the job passes over Registered rows. So patching the extended expiry into the past and waiting a midnight must leave it **Approved** — "nothing happens overnight" is this case’s assertion, not a failed setup.
Which means it needs the same positive control as everything else that asserts an absence: a non-Registered fixture at `--state expires-today` on the same night, which must flip. Without it, a cron that simply did not run looks exactly like R12 working.

**Steps**

Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check (a person must tick it — the session is not reusable per build)
Fill in the Pre-Application Form: Business Registered Name, Type of Business, BRN or Business Trading License No, Trading License upload, TIN, showroom address, postcode, state, city, and Admin In Charge
Tick the declaration, pick a payment method and click Submit and Pay; pay the RM 108.00 in the FPX simulator
In BackOffice, go to Onboarding > UCD Pre-Application Listing, open the new record, click Approve and confirm Yes, then copy the generated Application Link from the sidebar
Open that link and complete the Application Form: Business Information, Upload Files, Acknowledgement, then Submit
As the approver, find the new record on UCD Application Listing, note its Application No, and assign it
As the assignee, set the UCD Group and click Submit for Approval
As the approver, approve the application — this is the transition that gives it an expiry date
As the dealer, submit the Registration Documents on the portal
As the assignee, verify those registration documents in BackOffice
As the dealer, pay the RM 990.00 registration fee in the FPX simulator
Read the finished record back: Application No, status Approved, and the expiry the build computed (created + 90 days)
Patch the expiry into the extension window — a record created today is 90 days from expiry and the window opens 30 days before it (REQ-003), so it is born OUT of window: `npm run set-expiry -- --app-no <no> --state in-window --yes`
SEGMENT BREAK — everything above is segment 1 and spends NO extension. Everything below is segment 2 on the same record.
Record the extended expiry date, the Application Status, the greyed Extend and its hover message
Complete Create Account so Hardcopy & Acc Created becomes Registered
Reload and confirm the Extend control is gone entirely — not greyed, not in the HTML (TS01.8)
Record what happened to the green "extended by 30 days" banner and the Application Extended Remarks row — do not assume they go with the button
Have the extended expiry patched to yesterday, or wait for it to pass
Let the auto-expire job run
Check the Application Status is unchanged — not Expired
Check the Application Expiry Date still shows the EXTENDED date, untouched
Check there is still no Extend control
Check no reminder email went out
Check the UCD Application Listing row agrees with the detail page on all of it
SWEEP 1 of 2 — UCD Application Listing: re-find the application with the SAME search you used to open it, then read the Application Expiry Date column and the Remarks column (R14)
SWEEP 2 of 2 — Export: on that same search click Export, accept "Sure to export?", open the downloaded OBS-*.xlsx and read column 13 Application Expiry Date and column 23 Remarks (R14)
Check the extension remark appears in NEITHER surface, and that the new expiry (and any Expired → Approved flip) appears in BOTH
Open the details page and read the right sidebar: the "Application Extended Remarks:" row must be SHOWING, and must read exactly the remark you typed (check it was NOT there before you started)

**Expected result**

Everything stays exactly as it was at the moment of registration: the extended date intact, the status unchanged, no Extend control, no reminder. The 30 days elapsing does nothing at all (R12 + TS01.8).

**TWO-SURFACE SWEEP (R14) — mandatory on this case.** The detail page is not the evidence; the listing and the export are where the team actually reads applications.
- **Extension remark: absent from both.** Not in the listing's Remarks column, not in column 23 of the exported workbook.
- **The extension's effect: present in both.** The new Application Expiry Date (listing column, and export column 13), plus the Expired → Approved flip where the case produces one.
- The export is an **XLSX** (`OBS-<yyyyMMddHHmm>.xlsx`), not a CSV, and it carries the same filters as the search that preceded it. If the search returns 0 records the Export link is hidden — that is the filter, not a missing feature.

---

**EVIDENCE BAR FOR THE GREYED BUTTON (added 26-08-2026 night, R6).** Wherever this
case expects a **disabled / greyed Extend**, the screenshot must show the **once-only
tooltip painted** beside it — the record arrives already extended, so this is the KEY shot. The message read out of the HTML does not
count and never did: `.extend-tip` is `display:none` until `.extend-wrap:hover`,
so a sidecar can quote it in full over a still that shows a greyed button and no
reason at all. That is exactly what TS03's 26-08 take banked, and why it was sent
back.

Concretely, for this case to be signed off: the pointer is on `span.extend-wrap`
(not on the button — it is `pointer-events:none`), the tooltip is **visible in the
frame**, and its wording is Figma 9058-30492's *"This application has already been
extended. Each application can only be extended once."* The recorder refuses to
tick the shot without it, so a take that cannot show it comes back red rather than
green-with-a-note.

---

**APPLICATION EXTENDED REMARKS (details page sidebar) — mandatory on this case.** This case clicks **Confirm**, so after it does:

- Open the application's **details page** and read the **right sidebar**.
- The **"Application Extended Remarks:"** row must be **SHOWING**.
- Its value must be **exactly the remark you typed** — same characters, nothing truncated, nothing escaped, no extra whitespace.
- The row must have been **absent before you started**. Under R1 an extend case's fixture is never-extended, so a row that was already there means the value you are reading is somebody else's and proves nothing about this extension.

This is the surface the remark actually lives on. **R14** proves it stays OFF the listing and OUT of the exported workbook, and **R18** proves it reached the audit log — nothing else proves the page a BackOffice officer opens shows it back. A build that dropped the remark from this sidebar would satisfy every other check in this register.

---

**Filmed to the R20 evidence standard.** Every claim this case makes must be *visible
in the frame that claims it*: hover states painted (not read from the DOM), the
subject INSIDE the ring so the caption cannot be placed on it, listing values ringed
as **cells with their column headers** rather than as a row, any artefact shown in its
own application on the recorded display, and the audit log carrying whatever
extension this case depends on or performs. A point that cannot meet the standard
**does not tick** and the run goes red — it is never noted and passed over.

**Notes**

Added 26-08-2026 from the TS21 ruling. This is the only case that puts the two halves together: TS01.8 stops at Registered, TS21 never had an extension. Charmain's sentence covers both, so one of the two fixtures that reach Registered should be spent here.

**AUTOMATED 26-08-2026 evening — `npm run test:overnight`.** Needs: E2E_TS10_APP_NO — extended once, then Registered, extended expiry already past. TERMINAL.

Written, listed and syntax-checked; **not yet run** except where a result says otherwise. A script is not a pass.

**29-08-2026 ~23:30 — RULING APPLIED: declaration corrected — it never extends anything.**

Was inheriting `shape = extend` and `expected = offered` while its own precondition reads *"An
application extended exactly once — the greyed Extend and the once-only message on screen"*. Both
described the opposite record, and the extend shape would have driven `openExtendModal()` at a
greyed button.

Corrected 29-08-2026 to **gating-swept** with **`expected = greyed`**. The extension is fixture
PREPARATION here; what this take performs is **Create Account**, and its claim is that Registered
removes the greyed button and that the overnight cron then does nothing (R12). Its `create-account`,
`control-gone` and `r12` legs survive the shape change because EXTRA is merged after the omit
list — verified. Ceiling 19 -> 16; nothing was unfinished by that, because the row has never run.

Proven offline by `npm run probe:e2ets4`, which now covers this row in both directions.

**29-08-2026 ~23:55 — CORRECTION: the 23:30 note above is WITHDRAWN. This row was not mis-declared either.**

Same mistake and same correction as E2E_TS6: its precondition — *"An application extended
exactly once — the greyed Extend and the once-only message on screen"* — was read as a
statement about the fixture. It is a segmented E2E row, so **segment 2 does the extending**,
and the key shot is taken before it. `shape = extend` and `expected = offered` are
restored, along with its original ceiling of 19.

Unlike E2E_TS6 this row has **no film to check against**, so the correction rests on the
class argument rather than on measurement: it sits in the same segmented list, its segment 1
recipe is the same, and nothing in it forces a second sitting the way E2E_TS4's Expired
requirement does. **If that turns out to be wrong when it is finally run, the tell will be
the key shot reporting `claims "offered"; measured "greyed"` — and the fix is then an arm,
not a flat re-declaration.**

Guarded offline from now on: `npm run probe:e2ets4` asserts that both this row and
E2E_TS6 stay extend-shaped with `offered`, and that only E2E_TS4 carries an arm — so the
same well-meaning "fix" cannot be reapplied silently.

---

**31-08-2026 — THIS ROW NOW HAS A MAILBOX POINT. It has always had a mailbox STEP.**

The step has been in the register since it was written; nothing on the checklist ever asked
for it, so a take could film the whole record, tick complete, and never open the catcher.
TS19 was the only row that could see a mailbox at all.

**NOT TS19'S SHAPE, and the difference is why it is one point and not three.** TS19 measures
an absence across a MOMENT — the Confirm click — so it needs a before line, an after line and
a liveness reading inside its own timeline. This row measures an absence across a CRON NIGHT
that ended before the take started. There is no before/after to take: there is one SEARCH of
the record's whole history, driven through the inbox's own search box (`quick_filter`).

**Why a search and not a scroll.** The sandbox caps at 600 messages and evicts the oldest, so
scrolling for an absence proves nothing about a record whose mail may simply have aged out. A
search that returns the record's OTHER mail and no reminder is a real absence, in frame, with
its own positive control beside it. **Zero rows is refused, not passed** — it cannot tell "no
reminder was sent" from "nothing for this record is in the catcher".

Driven by `mailtrap.reminderVerdict`, provable offline: **`npm run probe:mailbox`, 16/16**,
including the two cases where it must refuse.

**Point:** `mailbox-reminder-none`. Ceiling **19 -> 20**. The row was already **Not run** and
its takes already SHORT at 16/19, so this costs nothing that was not already outstanding.

**The claim here is the flat one.** The record is Registered, so R12 says the extended expiry
passing does nothing at all — a reminder included. Any reminder-family mail for it is the
fault, and the leg asserts that.

---

**THE BLOCKER ON THIS ROW WAS STALE AND IS NOW CORRECTED.** It read *"MANUAL: Create Account
cannot be driven by the harness"*. It can: the recorder drives it and falls back to a
hand-back only when the drive fails (`drivenBy.ok` in `90-evidence.spec.js`). The remaining
requirement is a fixture and a midnight, not a person at a keyboard.

**READY, two sittings.** Extend, Create Account to Registered, patch the extended expiry into
the past, wait a midnight, film. Terminal for the record — run it after anything else that
wants that fixture, and after TS01.8.

`mailbox-reminder-none` rides the second sitting. Unlike TS21 this row's record IS QA-built,
so it has mail in the catcher and the point can actually be made.

**THE POOL, MEASURED 31-08-2026 10:47** — `npm run pool:status -- --max-probe 60`, and it
accounted for every record this time (59 shortlisted = 54 spent + 3 not ours + 2 usable), so
the count is not one of the undercounts this script has produced before.

| | |
| --- | --- |
| Approved population | 136 |
| shortlisted (in-window) | 59 |
| already extended (R1, spent) | 54 |
| eligible but another session's | 3 |
| **USABLE** | **2** — `NA68001132` (expires 2026-09-15 00:00) and `NA68001121` (2026-09-15 17:11) |

Both are QA-built (`CHARMAIN QA11982 ...`), which matters here and nowhere else: a QA-built
record HAS mail in the catcher, and a mailbox point on a record with no mail cannot be made.

---

**ARM A FILMED TWICE, 31-08-2026, AND THE TWO TAKES ARE EXACT COMPLEMENTS. The row stays Not run:
arm B is where it is judged, and that is tomorrow.**

| point | 13:26 `NA68001157` | 14:01 `NA68001159` |
| --- | --- | --- |
| `create-account` | MISSING | **CAPTURED** |
| `control-gone` | MISSING | **CAPTURED** |
| `greyed-after` | CAPTURED | MISSING |
| score | 16/18 | **17/18** |

**THE ROW GAINED ARMS FIRST.** It had none, and its subject ends "then the extended expiry passes"
— a MIDNIGHT. One take therefore carried both the setup and the claim, so `r12` and
`mailbox-reminder-none` would have been asked about a night that had not happened. Same fault
E2E_TS9 was fixed for that morning, found the same way: by reading the points before running them.
Arm A (extend, 18) does the doing; arm B (gating-swept, 16) does the watching.

---

**TAKE 1 — THE HAND-BACK, AND IT WAS A RIG FAULT WEARING A BUILD FAULT'S CLOTHES.**

The leg reported *"the Create Account button is not visible or not enabled in the ops_jasons
session"* and the 8-minute budget expired with nobody there. **That reading was false.** Two
minutes of checking, on the same record:

- `probe-create-account-visible.js NA68001157` -> `approver sees "Create Account": 1`
- `probe-create-account-commit.js NA68001157 --yes-i-mean-it` -> **REGISTERED, end to end**

**Cause:** the approver session opens the record BEFORE Hardcopy moves, so its first render
correctly has no button. The re-navigation that should repaint it was `.catch(() => {})`. Swallow
that and the leg inspects the STALE render and blames the button.

**Fixed:** the navigation failure is captured, one reload is tried before concluding, and the
refusal now names which of the two it is. **Proved on take 2, first live run:**

```
CREATE ACCOUNT — button absent on first look; after a reload: FOUND
```

---

**TAKE 2 — THE R6 FAILURE IS FALSE, AND THE PROOF IS IN THE SAME SIDECAR.**

The take FAILED on `expect.soft(after.present && !after.enabled)` — "R6: the extension left the
Extend button present and greyed". It did. The readings in order:

| sidecar line | when | control |
| --- | --- | --- |
| 104 | before the extension | `present=true enabled=true` — offered |
| **112** | **after the extension, before Create Account** | **`present=true enabled=false`** + *"This application has already been extended"* — **GREYED** |
| 126 | after Create Account | `present=false` — absent, and correct: R9 |
| 127 | `greyed-after` reads HERE | `present=false` -> scored MISSING, assertion fails |

**`greyed-after` asks about the state after the EXTENSION and is read after the REGISTRATION.**
By then R9 has correctly removed the button. The greyed state existed and is on film.

**IT IS STRUCTURAL, NOT BAD LUCK.** `driveCreateAccount` is called at spec line 5009;
`greyed-after` is captured at 7169. Any row carrying BOTH can never score both — measured:
**E2E_TS10 and TS40 (both arms)**. TS01.8 escapes it only because it is gating-swept and drops
`greyed-after` altogether.

**NOT FIXED TONIGHT, DELIBERATELY.** The fix is to hoist the `greyed-after` capture ahead of
`driveCreateAccount` — a reorder two thousand lines apart, and verifying it costs a fixture.
Three takes depend on this recorder tomorrow morning; changing a leg's ordering the evening
before is how one false failure becomes three. **Do it after tomorrow's takes, with a fixture
budgeted for the verification.**

**BANKED AT 17/18 rather than re-filmed a third time.** R6 is evidenced on this record at line
112, and `greyed-after` is at full marks on ~30 other extend takes including TS19 today. A third
fixture to move one point from the wrong key to the right one is not worth two FPX logins.

---

**ARM B IS READY.** `NA68001157` — **Registered**, extended expiry patched to `2026-08-31 13:22`,
already past. Tonight the cron must change NOTHING (R12) and send no reminder. `NA68001159` is
also Registered and spent, and is the spare if arm B needs a second subject.

```bash
TS=E2E_TS10 EV_ARM=B EV_APP_NO=NA68001157 npm run evidence
```

---

**PASS — 01-09-2026 08:35, arm B on NA68001157. CAPTURED 16/16, MISSING (0), `EXPECTED STATE —
claims "absent"; measured "absent" — MATCH`.**

`Approved` / `Hardcopy="Registered"`, expiry `2026-08-31 13:22` already past, and the night changed
NOTHING (R12). `mailbox-reminder-none` carried by the STRONG control — ten messages for this record,
not one a reminder.

**TWO CAVEATS, BOTH RULED BY CHARMAIN, BOTH ON THE RECORD SO NOBODY INFERS OTHERWISE.**

**1. The arms are on DIFFERENT RECORDS.** Arm A is `NA68001159` (17/18, filmed 31-08 14:01); arm B
is `NA68001157`. R1 forced it: the first arm-A attempt on NA68001157 timed out at Create Account
and spent that record's only extension, so the retry needed a fresh build — and only NA68001157
was ever staged for arm B (patched to a past expiry; NA68001159 was left at 2026-09-30 and the
cron would not have touched it). **Charmain chose this knowingly on 01-09** over the alternative of
patching NA68001159 and waiting another night. So this row proves both halves of the flow, but not
on one record end to end.

**2. Arm A is banked at 17/18.** `greyed-after` is captured after Create Account has already made
the record Registered, so R9 has removed the button by then. The greyed state IS on film at sidecar
line 112 with the once-only tooltip — it is filed under the wrong key. Structural, and it affects
TS40 too; the hoist is still owed.

**Two superseded takes moved out of the flat folder on 01-09** so only valid evidence is quoted:
`NA68001153` (31-08 09:22, filmed before the row had arms, scored 16/19 against a ceiling that no
longer exists) and `NA68001157` (31-08 13:26, 16/18, never reached Registered). Both are intact
under `evidence/EAINT-11982/video/superseded/`.


---
