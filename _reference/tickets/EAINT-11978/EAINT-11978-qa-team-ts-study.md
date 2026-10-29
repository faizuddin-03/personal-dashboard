# EAINT-11978 — QA Team test script study (2026-10-27)

Study of the **EAINT-11978** workbook (Showroom edit). The earlier version of this file studied the **EAINT-11979** workbook by mistake; that content is kept in the Appendix.

## Sources read

1. **Text copy** `_reference/sharepoint/qa-team-ts/EAINT-11978, 11979 - Pre-Application & Application Enhancement Tickets/EAINT-11978 - [eAuto-Application] Enable potential UCD to Edit Showroom Address, Postcode, State & City.md` (captured 27/10/2026, 8:03:33 pm). Cell text only; formatting and images not kept.
2. **knowledge/** grep for EAINT-11978: `flow-ucd-onboarding.md:416-420, 626`, `business-rules-from-test-scenarios.md:793-796`, `cr-test-scenario-catalogue.md:257, 364`, `teams-decisions-by-ticket.md:39-46`, `environments-history.md:60`, `production-regression-scope.md:889`, `cr-ledger.md:999`, `quirks.md:340` (search behaviour only, not about this ticket).
3. **Not found:** `_reference/tickets/Studying/EAINT-11978/` (does not exist); `lib/ticketStudies.ts` (no entry for 11978). `_reference/tickets/EAINT-11978/` holds only this file.
4. **Not read:** the original .xlsx (only the text copy), any SRD (none in the repo), Jira. No earlier text copy of this workbook exists, so "changes" below are measured against the previous version of this study and the `knowledge/` summary of TS #027.

## 1. Header

1. **Ticket:** EAINT-11978 — "[eAuto-Application] Enable potential UCD to Edit Showroom Address, Postcode, State & City".
2. **Module / portal:** **UCD Portal** Application form (Application 1.1) and **BackOffice** Application Record.
3. **Workbook:** "EAINT-11978 - [eAuto-Application] Enable potential UCD to Edit Showroom Address, Postcode, State & City.xlsx", library "eAuto - CR Test Scenarios", folder "EAINT-11978, 11979 - Pre-Application & Application Enhancement Tickets", modified 12/08/2026, 4:02:49 pm.
4. **Sheets:** 1 — "Test Script".
5. **Scenarios:** **7 numbered** (11978_TS_01 to TS_07) plus **1 unnumbered** scenario (row 9) and **2 draft note rows** (rows 11-12, no ID, no steps).
6. **Results:** **6 Pass** (TS_01-05, TS_07). **TS_06 has no status and no QA name**; Remarks say "Invalid". Row 9 has no QA, no status.
7. **Tester:** "Faiz" (QA column, rows 2-6, 8). No dates are written in the sheet.
8. **Deployment context:** uat1 used for the "13 Aug deployment (11978, 11979)" `[from knowledge/environments-history.md:60]`; prod date "20260813" `[from knowledge/production-regression-scope.md:889]`; QA sign-off "2026-08-12" `[from knowledge/teams-decisions-by-ticket.md:46]`.

## Changes since last study (2026-10-27)

1. **Wrong workbook corrected.** The previous version studied "EAINT-11979 - [eAuto-BackOffice] To Remove Verify Button during Step of Account Creation.xlsx". Every section is now rewritten for the EAINT-11978 workbook. The 11979 study is moved to the Appendix unchanged.
2. **New to this study (all rows):** TS_01-07, the unnumbered row 9 scenario, and note rows 11-12. None of these appeared in the previous version.
3. **Result vs knowledge/ summary:** `cr-test-scenario-catalogue.md:257` lists "Test Script:7 | 7" scenarios. The sheet has **7 numbered + 1 unnumbered**; only **6 carry Pass**. The catalogue does not record that TS_06 is marked **Invalid**.
4. **Contradiction found vs knowledge/:** `flow-ucd-onboarding.md:418` and `business-rules-from-test-scenarios.md:794-795` say "editable in Pending, KIV, Revise" with no actor. The TS_06 remark limits this: "UCD can only edit if its in draft. BO can only edit if its in Pending, KIV or Revise status" `[Test Script, row 7, Remarks]`. TS_07 Expected 1 says the opposite for UCD (see §4 item 6).
5. **Minor citation slip in knowledge/:** `cr-test-scenario-catalogue.md:257` cites "BO can (Test Script!R3-R4)". BO's three-option rule is row 4 only; row 3 is the UCD restriction.
6. **Workbook date unchanged** vs the catalogue (2026-08-12). No evidence of content changes since the catalogue was written beyond what is listed above [unconfirmed — no earlier copy to diff].

## 2. What the ticket changed, as the TS shows it

1. **Showroom fields editable on Application.** Showroom Address, Postcode, State and City are **pre-filled from the Pre-Application** and the UCD can now **edit and save** them on Application 1.1 (row 2).
2. **New ownership option "No Showroom"** — BO can set it (row 4); UCD cannot switch to it from Own or Shared Showroom (row 3).
3. **No Showroom hides the address fields** — tested in row 5; the exact behaviour comes from Teams, not the sheet (§4 item 5).

## 3. Scenarios

### A. UCD edit (UCD Portal > Application Form)

1. **11978_TS_01** — Showroom fields pre-fill and can be edited/saved; valid/invalid data. Expected: "All four fields display the exact Pre-Application values on open"; "Partial edit saves correctly, untouched fields retain prepopulated values"; "Invalid data is rejected"; "Full edit saves successfully without restarting the flow". **Pass.**
2. **11978_TS_02** — UCD cannot switch ownership to "No Showroom" from Own or Shared Showroom. Expected: "“No Showroom” is not selectable/greyed out on the Own Showroom record"; "Same restriction on the Shared Showroom record". **Pass.**

### B. BO edit (BackOffice > Application Record)

1. **11978_TS_03** — BO can set any of the three options. Expected: BO can save "Own Showroom", "Shared Showroom" and "No Showroom" successfully. **Pass.**
2. **11978_TS_07** — Edit details on Pending, KIV, Revise. Expected: "UCD & BO are able to edit the showroom details and address in all three statuses"; "If status = Pending Approver, cannot do any changes". **Pass.**

### C. UCD + BO together

1. **11978_TS_04** — Address fields and "No Showroom" behave consistently. Expected: "Address fields behave consistently and sensibly with No Showroom selected"; "Field behaviour is consistent between BO and UCD views". **Pass.**
2. **11978_TS_06** — Simultaneous edit by UCD and BO without refresh. Expected: "The latest changes is saved, based on which clicked first". **No status.** Remarks: "Invalid : UCD can only edit if its in draft. BO can only edit if its in Pending, KIV or Revise status".
3. **(no ID), row 9** — Edited data persists and does not corrupt the Pre-Application record. Expected: "Pre-Application record remains unchanged"; "BO view shows the latest edited showroom data, not the stale Pre-Application values"; "Reopening the Application form shows the edited values as the new baseline". **No QA, no status.**

### D. Regression

1. **11978_TS_05** — Full Pre-Application and Application flow. Expected: "New UCD can be created successfully". **Pass.**

### E. Draft notes (no ID, no steps)

1. Row 11: "BO and UCD change details simultaniousy" — became TS_06 [unconfirmed].
2. Row 12: "Different status to check if the address is editable" — became TS_07 [unconfirmed].

## 4. Business rules and system behaviour

1. **Pre-fill from Pre-Application.** "All four fields display the exact Pre-Application values on open" `[Test Script, row 2, Expected 1]`.
2. **Save does not restart the flow.** "Full edit saves successfully without restarting the flow" `[Test Script, row 2, Expected 4]`.
3. **UCD cannot pick No Showroom.** "“No Showroom” is not selectable/greyed out on the Own Showroom record" `[Test Script, row 3, Expected 1]`.
4. **BO can pick all three.** "BO can save “No Showroom” successfully" `[Test Script, row 4, Expected 3]`. BO precondition: "Application Status: Pending", "Assignee / UCD: Pending", "Approver / Assignee: -" `[Test Script, row 4]`.
5. **No Showroom hides the fields.** Sheet step only asks "Check whether the Showroom Address/Postcode/State/City fields become hidden" `[Test Script, row 5, Step 1]`. The confirmed rule is in Teams: Address, Postcode, State and City are hidden; the 4 showroom pictures and 20-second video are disabled `[from knowledge/teams-decisions-by-ticket.md:40-44, Teams EAINT-11978, 2026-07-31 11:51]`.
6. **Who can edit, and when — conflicting.**
   1. "UCD can only edit if its in draft. BO can only edit if its in Pending, KIV or Revise status" `[Test Script, row 7, Remarks]`.
   2. "UCD & BO are able to edit the showroom details and address in all three statuses" `[Test Script, row 8, Expected 1]` — marked Pass.
   3. The row 7 remark matches the normal onboarding model (UCD edits a draft; BO edits after submission) [unconfirmed]. The row 8 wording "UCD & BO" may mean the BO view of the UCD page [unconfirmed].
7. **Pending Approver locks the record.** "If status = Pending Approver, cannot do any changes" `[Test Script, row 8, Expected 2]`.
8. **Pre-Application record is not overwritten** — expected only, no result: "Pre-Application record remains unchanged" `[Test Script, row 9, Expected 1]`.

### Against existing knowledge

1. `flow-ucd-onboarding.md:416-420` carries rules 1, 3, 4, 7, 8. **Contradiction:** it says "editable in Pending, KIV, Revise" for both actors, while row 7 Remarks restrict UCD to draft.
2. `flow-ucd-onboarding.md:420` cites rows 2-9 for "the Pre-Application record is unchanged". Row 9 has **no result** — expected, not tested.
3. `flow-ucd-onboarding.md` does not record the hide-on-No-Showroom rule; only `teams-decisions-by-ticket.md` has it.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. uat1 per `knowledge/environments-history.md:60` [unconfirmed for this workbook].
2. **Accounts:** UCD (potential UCD on Pre-Application/Application) and BO assignee. No logins in the sheet. **No credentials present.**
3. **Data:** a completed Pre-Application (TS_01); one Own Showroom and one Shared Showroom Application (TS_02); a Pending application (TS_03); a No Showroom record (TS_04). No record IDs in the sheet.
4. **Known record:** "1205413-T (P260810/00741 "FAIZUDDIN TEST 11978 TS01", 2026-08-10)" `[from knowledge/flow-ucd-onboarding.md:626]` — approved on staging; do not reuse that company.

## 6. Gaps or risks for regression

1. **Edit rights by status are unclear.** Row 7 Remarks and row 8 Expected disagree for UCD. A regression should test UCD edit in Draft vs Pending/KIV/Revise separately.
2. **Row 9 never run.** Pre-Application record integrity and BO showing the edited values are not proven.
3. **TS_06 dropped as Invalid.** A concurrent BO save while UCD is in Draft (or BO save on a stale page) is not covered.
4. **TS_04 Expected is vague** ("consistently and sensibly"). Should assert the Teams rule: fields hidden, 4 pictures + video disabled, all reappear on switch back.
5. **Invalid data not defined.** TS_01 step 3 does not name which field or value; postcode/state/city mismatch not covered.
6. **UCD on a record BO set to No Showroom** — whether UCD can switch it back to Own/Shared is not tested.
7. **Prod regression flag:** "EAINT-11978 | 20260813 | Application showroom address | Part" `[knowledge/production-regression-scope.md:889]`.

## Knowledge candidates

1. **flow-ucd-onboarding.md item 7 — correct edit rights:** "UCD can only edit if its in draft. BO can only edit if its in Pending, KIV or Revise status" `[from SharePoint TS #027 EAINT-11978, sheet Test Script, row 7, Remarks]`; note it conflicts with row 8 Expected 1.
2. **flow-ucd-onboarding.md item 7 — row 9 untested:** tag "Pre-Application record remains unchanged" as expected, **no result recorded** `[sheet Test Script, row 9]`.
3. **flow-ucd-onboarding.md item 7 — No Showroom hides fields:** copy the Teams rule `[from Teams EAINT-11978, 2026-07-31 11:51, Yi Link Lim]`.
4. **cr-test-scenario-catalogue.md row 027 — correction:** 7 numbered + 1 unnumbered; 6 Pass, TS_06 Invalid (no status), row 9 blank; BO rule is row 4, not "R3-R4".

## Appendix — EAINT-11979 workbook (from the earlier version of this study)

Kept as written. Source: text copy `EAINT-11979 - [eAuto-BackOffice] To Remove Verify Button during Step of Account Creation.md` (captured 27/10/2026, 8:02:22 pm); workbook modified 12/08/2026, 6:17:06 pm.

### A1. Header

1. **Module / portal:** BackOffice — Manage Company Accounts (Create New) and Application > Registration Documents > Create Account. TS_03 also touches UCD Pre-Application and Application.
2. **Sheets:** 1 — "Test Script". **Scenarios:** 4 (11979_TS_01, 02, 03, 05); **no TS_04**.
3. **Results:** 3 Pass (TS_01-03), 1 blank (TS_05). **Tester:** "Faiz". No dates.

### A2. What changed

1. **Before:** 3-step flow Save > Verify > Activate — row 5 calls it "the old 3-step flow".
2. **After:** [Verify] removed; Save > Activate only (row 2), on both Manage Company Accounts > [Create New] (row 2) and Application > Registration Documents > [Create Account] (row 3).

### A3. Scenarios

1. **11979_TS_01** — no [Verify] on Create New. Expected: "No trace of Verify (button/text/status) remains anywhere in the flow"; "[Activate] is disabled/unavailable until [Save] is completed"; "Account is successfully created and Activated using Save > Activate only"; "Behaviour and layout are consistent across both browsers". **Pass.**
2. **11979_TS_02** — Create Account by Assignee. Expected: "UCD will be directed to the Create New Company Account page with the data already pre-filled"; "After clicking [Save], no Verify button is shown"; "Account will successfully be activated". **Pass.**
3. **11979_TS_03** — full flow regression. Expected: "New UCD can be created successfully". **Pass.**
4. **11979_TS_05** — legacy records. Expected: "Legacy Verified record activates successfully, not stranded"; "Legacy Active record is unaffected — no status change or data loss"; "Legacy Saved-only record proceeds straight to Activate without the removed Verify step". **No result.**

### A4. Rules

1. "[Activate] is disabled/unavailable until [Save] is completed" `[Test Script, row 2, Expected 2]`.
2. Create Account precondition: "Application Status: Approved" and "Hardcopy & Acc Created: Pending Assignee" `[Test Script, row 3]`.
3. Legacy states: "Verified/pending-activate", "Active", "Saved-only (never verified)" `[Test Script, row 5, Precondition 1-3]`.
4. "BackOffice user logged in with account-management permission" `[Test Script, row 2, Precondition 2]`.

### A5. Gaps

1. TS_05 never marked; TS_04 missing.
2. TS_01 steps out of order: step 2 "click [Save]", then step 3 "Before clicking [Save], attempt to click [Activate]" `[Test Script, row 2]`.
3. No negative Activate check, no Saved-only status check, no permission check.
4. "BO remove Verify button | No" `[knowledge/production-regression-scope.md:888]`.

### A6. Knowledge candidates (11979)

1. Add legacy rules (row 5) to `flow-ucd-onboarding.md` item 8, tagged **no result recorded**.
2. Add the Create Account precondition (row 3) to `flow-ucd-onboarding.md`.
3. `cr-test-scenario-catalogue.md` row 028: 3 Pass, TS_05 blank, IDs skip TS_04.
4. Record the Save-then-Activate button rule in `flow-ucd-company-listing.md` or a BO account-creation flow file.
