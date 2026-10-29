# EAINT-12341 — QA Team test script study (2026-10-27)

## Sources read

1. **SharePoint TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12341 - [eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support.md` (captured 27/10/2026, 6:55:02 pm; "Cell text only, row by row; formatting and images are not kept."). Read in full, rows R1–R40. The Read tool could not open the file by path; it was read through a content search. Cell colours (yellow/red TS No.) are **not** in the text copy.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-12341/EAINT-12341-jira.md` (27/10/2026).
3. **Teams capture:** `_reference/teams/EAINT-12341-12461-RHB-Application-Emails.md` (11 messages, 2026-10-06 to 2026-10-09).
4. **Later revision of the same TS (comparison only):** `_reference/codebases/eauto-qa-azfar/cr/EAINT-12341/01-intake/raw/EAINT-12341_Test_Case--EAINT-12341.md` (sheet "EAINT-12341", A1:H41, cites SRD v1.1). Read rows 1–11 and the TS id column only.
5. **Knowledge:** `knowledge/business-rules-from-test-scenarios.md` §12 item 8; `knowledge/flow-ucd-onboarding.md` (lines 75–108, 424–441, 483–490); `knowledge/teams-decisions-by-ticket.md` § EAINT-12341 / EAINT-12461; `knowledge/cr-test-scenario-catalogue.md` row 041; `knowledge/cr-ledger.md`, `releases.md`, `production-regression-scope.md`, `flow-platform.md` (grep hits only).
6. **`lib/ticketStudies.ts`:** no entry for EAINT-12341.
7. **Not read:** the SRD files (v0.1–v1.3, .docx/.pdf on Jira, plus `SRD_EAINT-12341_v1.1_20260917 (1).pdf` in the Azfar codebase copy), the Appointment Letter templates (.docx) and the email template (.docx). The `.xlsx` itself was not opened; only its text copy.

## 1. Header

1. **Ticket:** EAINT-12341 — "🔴[eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support" (Jira Summary).
2. **Module / portal:** Jira "Affected Portal | - BackEnd - UCD", "Affected Module | - Pre-Application - Application". The TS renames it: "The SRD and ticket title refer to the portal as BackEnd. The system name is BackOffice (BO) and is used throughout this sheet." (Sheet1, R7).
3. **Workbook:** "EAINT-12341 - [eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support.xlsx", library "eAuto - CR Test Scenarios", modified 21/09/2026, 10:53:40 am.
4. **Sheets:** 1 — "Sheet1".
5. **Scenarios:** **23** — 18 E2E (`12341_E2E1`–`12341_E2E18`) + 5 regression (`12341_R1`–`12341_R5`). Matches the catalogue "Sheet1:23" (`cr-test-scenario-catalogue.md` row 041).
6. **Blocked / open:** **10 BLOCKED** (E2E5–E2E13, R4) and **1 "SRD CONFLICT"** (E2E18). Only 12 TS have a written expected result.
7. **Results:** none. The sheet has no Pass/Fail or Actual column — header "TS No. | Business Type | No. of Directors / Business Owners | Nationality of Directors / Business Owners | Expected Template | Steps | Expected Result | Remarks" (Sheet1, R11).
8. **SRD cited:** "SRD_EAINT-12341_v1_0_20260915 (v1.0, 15.09.2026) — REQ-001 to REQ-009" (Sheet1, R3). This is an **early draft**: Jira lists SRD up to "V1.3 | Replaced UCD email templates with 1 combined template" (29.09.2026).
9. **Tester / dates:** not written in the sheet. Catalogue row 041 lists the author as a QA engineer (Amirul Azfar), 2026-09-21. Jira "QA (cf 10041): Siti Nur Azila" — the executing QA. Teams: "QA has completed testing for EAINT-12341 on staging/obs (eAuto) with no outstanding issues." (2026-10-06 14:30, QA PIC).
10. **Deployment:** Jira "Fix versions: S34.5-20261007🌞 (2026-10-07)"; Status "Done".

## 2. What the ticket changed, as the TS shows it

1. **Old email removed:** on Application approval, the old email with the 3 RHB documents is no longer sent — "The existing approved application email carrying the 3 RHB documents (Offer Letter, Direct Debit Application form, Board of Resolution) is no longer sent." (Sheet1, R36, `12341_R1`).
2. **Two new emails** — "the RHB Account Registration Guideline email to the UCD using Email Template 1 or Email Template 2 … and the Appointment Letter email to RHB Support using Email Template 3 with the UCD email address copied and the generated Appointment Letter attached." (Sheet1, R4, Test Objective).
3. **Template choice** by the **count** of directors / business owners and **foreigner presence** (Sheet1, R4). Template 1 = online account opening; Template 2 = branch account opening (Sheet1, R13–R14).
4. **System-generated Appointment Letter** attached to the RHB Support email, details from the Application "with no manual input" (Sheet1, R31).
5. **Trigger:** "Application approval only. Pre-Application approval is not a trigger and is unchanged by this CR." (Sheet1, R5).

## 3. Scenarios

### A — RHB Account Registration Guideline Email (Template Selection) — Sole Prop / Partnership (ROB)

1. **12341_E2E1** — 4 owners, all Malaysian → **Template 1 — Online**. Subject "RHB Online Account Opening - [Application No] - [Company Name]"; CC "apply@eauto.my"; "carries the RHB online registration link." (R13).
2. **12341_E2E2** — 5 owners, all Malaysian → **Template 2 — Branch**. Subject "RHB Branch Account Opening - [Application No] - [Company Name]"; "attend the selected RHB branch within 7 days"; "No RHB online registration link is present." (R14).
3. **12341_E2E3** — 3 owners, 1 foreigner → **Template 2**. Same expected result as E2E2. "The nationality rule trips on its own, independent of the count." (R15).
4. **12341_E2E4** — 5 owners, 1 foreigner → **Template 2**. "Catches the rule coded as AND where OR is required." (R16).

### B — Template Selection — Sdn Bhd / Bhd (ROC) — all BLOCKED

5. **12341_E2E5** — 4 directors, all Malaysian → "To be confirmed". "BLOCKED — the ROC response carries no NATIONALITY field on directors. … Pending BA question 1." (R18).
6. **12341_E2E6** — 4 directors + 1 secretary → "To be confirmed". "Counting nodes gives 5 (Template 2); counting actual directors gives 4 (Template 1). Pending BA question 2." (R19).
7. **12341_E2E7** — 2 directors, 3 shareholders → "To be confirmed". "Pending BA questions 3 and 4." (R20).
8. **12341_E2E8** — 3 directors, 1 foreigner → expects "The foreign director is identified and Email Template 2 is sent." Still "BLOCKED — depends on the answer to BA question 1." (R21).

### C — Template Selection — LLP — all BLOCKED

9. **12341_E2E9** — 4 partners → "pending BA question 5 on whether the count filters to involveType = PT." (R23).
10. **12341_E2E10** — 1 person as both partner and compliance officer → "Counting nodes double-counts one human and can flip the template. Pending BA question 5." (R24).
11. **12341_E2E11** — 5 partners, 1 resigned → "A resigned partner inflates the count if not filtered. Pending BA question 6." (R25).
12. **12341_E2E12** — 3 partners, 1 foreigner → expects "The non-Malaysian partner is identified and Email Template 2 is sent." Still "BLOCKED — the involveIdType code list is unknown. Pending BA question 7." (R26).

### D — Non-SSM Registered — BLOCKED

13. **12341_E2E13** — Business Trading (Sabah / Sarawak) → "BLOCKED — a Business Trading License No does not trigger the automatic SSM purchase (EAINT-5972), so no SSM response exists for REQ-004 to read. Pending BA question 8." (R28).

### E — Appointment Letter Email (Template 3)

14. **12341_E2E14** — To / CC → "The email is addressed To BIS.Support@rhbgroup.com." + UCD email in CC + "apply@eauto.my also appears in the CC field." (R30).
15. **12341_E2E15** — attachment → "The generated Appointment Letter is attached to the email." / "The attachment opens without error." / details match "with no manual input". (R31).
16. **12341_E2E16** — subject + body → "The subject line reads Approved eAuto Registration - [Company Name] - [BRN Number]"; body fields Company Name, BRN, UCD Contact Person, Contact Number, Email Address match. (R32).
17. **12341_E2E17** — one approval, both emails → "A single Application approval produces both emails." / "Neither email is duplicated." (R33).
18. **12341_E2E18** — Template 3 sent for an online-eligible (Template 1) company → "SRD CONFLICT" (see §4 item 9). (R34).

### F — Regression

19. **12341_R1** — old 3-document email suppressed; "No RHB document attachments are issued by eAuto on Application approval." (R36).
20. **12341_R2** — no email on Submitted, Reverted to UCD, Expired → "Neither … email is sent for any status other than Application approval." (R37).
21. **12341_R3** — no unresolved placeholders in any subject/body; "All links render as working URLs." (R38).
22. **12341_R4** — UCD email malformed / blank → "BLOCKED — undefined in the SRD. … Pending BA question 9." (R39).
23. **12341_R5** — Hardcopy resubmission flow (EAINT-11763) unchanged: popup + checklist work, email "to the UCD with apply@eauto.my in CC and the Assignee in BCC", Reverted Reason still shown. (R40).

## 4. Business rules and system behaviour the TS reveals

1. **Trigger:** "Application approval only. Pre-Application approval is not a trigger and is unchanged by this CR." (Sheet1, R5).
2. **Online-route boundary is ≤ 4:** "Boundary — exactly 4 with no foreign owner must still qualify for the online route. Catches < 4 coded instead of <= 4" (Sheet1, R13, Remarks).
3. **Rule is OR:** count ≥ 5 **or** any foreigner → Template 2. "Both conditions fail at once. Catches the rule coded as AND where OR is required. REQ-003." (Sheet1, R16, Remarks).
4. **ROB nationality value:** "the field reads MALAYSIAN CITIZEN, not MALAYSIAN" and "ROB is the only SSM response carrying an explicit NATIONALITY field" (Sheet1, R13, Remarks).
5. **ROC data shape:** "the ROC response carries no NATIONALITY field on directors" (R18); "a SECRETARY entry sits inside the DIRECTORS block" (R19); "ROC separates DIRECTORS from SHAREHOLDERS" (R20); "the SHAREHOLDER block carries an ENTITY marker (P = passport, MK = MyKad) but the DIRECTORS block does not" (R21).
6. **LLP data shape:** same person as "COMPLIANCE OFFICER and PARTNER with an identical involveId" (R24); "involveEffectiveToDt exists to hold an end date and is empty for active partners" (R25); "the involveIdType code list is unknown" (R26).
7. **Business Trading has no SSM data:** "a Business Trading License No does not trigger the automatic SSM purchase (EAINT-5972)" (Sheet1, R28).
8. **Subjects differ by key:** Templates 1/2 use "[Application No] - [Company Name]" (R13–R14); Template 3 uses "[Company Name] - [BRN Number]" — "Note the subject uses BRN, not Application No, unlike Email Templates 1 and 2." (R32, Remarks).
9. **SRD conflict (at v1.0):** "REQ-006 fires this email unconditionally, but Email Template 3 states the company is not eligible for online account opening, which is untrue for a Template 1 company." (Sheet1, R34, Remarks). Later resolved — see §4 item 14.
10. **Application statuses:** "Application statuses are Submitted, Reverted to UCD, Approved and Expired. Rejected and Cancelled belong to Pre-Application." (Sheet1, R37, Remarks).
11. **Application Link and expiry:** "[Application Link] is the link generated at approval, which starts the 90-day expiry clock (EAINT-11829)" (Sheet1, R38, Remarks). **Note:** `flow-ucd-onboarding.md` item 4 says expiry = "application **creation** + 90 days", creation being when the approved pre-app generated the application. Both describe the same moment (pre-app approval generates the Application) only if "approval" here means Pre-Application approval [unconfirmed]; the TS wording is ambiguous.
12. **Hardcopy checklist still lists the old documents:** "The checklist still lists RHB Offer Letter, RHB Direct Debit Application Form and RHB BoD Reso / LoA e-TukarMilik — the same 3 documents eAuto stops issuing under this CR." (Sheet1, R40, Remarks).
13. **Placeholders used in the templates:** "[Application No], [Company Name], [BRN Number], [Name], [Contact Number], [UCD Email Address], [RHB Online Registration Link] and [Application Link]" (Sheet1, R38).
14. **Later TS revision (not on SharePoint) settles the blocked rules** (Azfar codebase copy, sheet "EAINT-12341"):
    1. "Nationality is derived from the IC value: 12 digits is read as Malaysian, any other format is read as foreign. A foreign director is counted but does not display in SSM Details." (row 7, B7).
    2. "ROB — CURRENT_OWNER.   ROC — DIRECTORS > DIRECTOR, DESIGNATION = DIRECTOR only; SECRETARY and SHAREHOLDERS are excluded.   LLP — INVOLVEMENTS > involvement, involveType = PT only; CO is excluded." (row 8, B8).
    3. "The eligibility sentence was withdrawn from Email Template 3 in SRD v1.1, so the body must be correct for an online-eligible company." (H36).
    4. "All emails are verified in Mailtrap. No live email reaches BIS.Support@rhbgroup.com during testing." (row 9, B9).
    5. Non-SSM still open there: "SRD v1.0 and v1.1 do not mention non-SSM registered business types. … Raised with the BA as a requirement gap." (H30).
15. **After deployment:** "system will send out 3 emails upon application approval: 2 emails in (EAINT-12341) 1 email (EAINT-12461)" (Teams, 2026-10-09 15:03, BA).
16. **Defects raised** (Jira sub-tasks): "EAINT-12426 … Both new approval emails are sent without the CC apply@eauto.my"; "EAINT-12428 … Appointment Letter PDF - Margins do not follow the template, so the text area is narrower".

## 5. Test data, environments, accounts, setup

1. **Environment:** "To be confirmed. BIS.Support@rhbgroup.com is a live external address and must be redirected or stubbed before execution." (Sheet1, R6). Teams confirms testing ran "on staging/obs (eAuto)" (2026-10-06 14:30).
2. **One chain per TS:** "Approval is one-shot: each TS consumes its own chain." (Sheet1, R8, Legend). So 23 TS need up to 23 fresh Pre-Application → Application chains (E2E17 "Reuses the E2E1 configuration", R33).
3. **Chain steps** (every E2E row): UCD Pre-Application with "the test mailbox as the Admin In Charge email address" → pay → BO approve Pre-Application → UCD Application, check prepopulated directors → submit → "BackOffice > Application, open the submitted Application and approve it" → check UCD inbox + "RHB Support mailbox (or the redirected test mailbox)" (R13).
4. **Company data:** sheet names no companies. Needs ROB / ROC / LLP SSM responses with set owner counts and foreigners. On staging these come from **eSIM** (`flow-ucd-onboarding.md` lines 76–90).
5. **Expired sub-case:** "requires the 90-day cronjob to be forced or the date shifted; drop it if neither is possible." (Sheet1, R37).
6. **Credentials:** none in the sheet.

## 6. Gaps or risks a regression should still cover

1. **SharePoint copy is stale.** It cites SRD v1.0 and leaves 10 TS blocked; Jira shows SRD v1.3 "Replaced UCD email templates with 1 combined template" (29.09.2026). Whether Templates 1 and 2 still exist as separate emails in prod is **unknown from this sheet** [unconfirmed]. Read SRD v1.3 before any regression.
2. **SRD v1.2 change not covered:** "Appointment Letter attached to the UCD emails - Email template 1 & 2" (Jira SRD table, 24.09.2026). No SharePoint TS checks an attachment on the UCD email.
3. **ROC and LLP template selection** never had a written expected result in this copy. Regression should cover Sdn Bhd with a secretary, shareholders-only, and a foreign director; LLP with a compliance officer and a resigned partner.
4. **Business Trading (Sabah/Sarawak)** — no SSM data; behaviour undefined in SRD v1.0/v1.1 (both TS copies).
5. **Malformed / blank UCD email** (R4) — undefined.
6. **CC apply@eauto.my** — already failed once (EAINT-12426). Keep it in every regression.
7. **Appointment Letter layout** — failed once (EAINT-12428, margins). Check PDF against the v2.0 template.
8. **Third email (EAINT-12461)** was "not required to do testing" by QA (Teams, 2026-10-09 15:03). Regression on approval should expect **3** emails, not 2.
9. **Prod Application Link:** "(3) Application Link uses the prod site" (Teams, 2026-10-06 16:28) — a prod check, not a staging one.
10. **Hardcopy checklist wording** (R40) still lists the 3 RHB documents — open question to the BA, no answer recorded.

## 7. Notes against existing knowledge

1. **`business-rules-from-test-scenarios.md` §12 item 8.3** and **`flow-ucd-onboarding.md` item 9.3** state "A foreign director (Sdn Bhd) or non-Malaysian partner (LLP) gets Email Template 2 `[rows 21, 26]`" as a rule. In this SharePoint copy both rows are **"BLOCKED"** (R21, R26). The rule is supported by the later revision's IC-based nationality rule (§4 item 14.1), not by the SharePoint sheet.
2. Same files cite subjects at "rows 13-14" — correct for this copy.
3. `flow-ucd-onboarding.md` lines 78–80 cite Azila's executed workbook "`EAINT-12341_Test_Cases_v1.3.xlsx`" in the Test Evidence library. That is the run record; this SharePoint CR workbook is the earlier draft with no results.
4. No knowledge file records the **count-source rules** (§4 item 14.2) or the **IC-length nationality rule** (§4 item 14.1).

## Knowledge candidates

1. **Template choice rule (approval email):** Template 1 (online) only when ≤ 4 directors/owners AND no foreigner; otherwise Template 2 (branch). Source: Sheet1, R13 "exactly 4 with no foreign owner must still qualify for the online route"; R16 "Catches the rule coded as AND where OR is required." → `flow-ucd-onboarding.md` item 9.
2. **Nationality from IC:** "Nationality is derived from the IC value: 12 digits is read as Malaysian, any other format is read as foreign. A foreign director is counted but does not display in SSM Details." Source: Azfar codebase TS copy, sheet "EAINT-12341", row 7 (B7), cites SRD v1.1. Tag `[unconfirmed]` until checked against SRD v1.3.
3. **Count source per business type:** "ROB — CURRENT_OWNER. ROC — DIRECTORS > DIRECTOR, DESIGNATION = DIRECTOR only; SECRETARY and SHAREHOLDERS are excluded. LLP — INVOLVEMENTS > involvement, involveType = PT only; CO is excluded." Source: same copy, row 8 (B8). Useful for eSIM data setup in `esim.md` / `flow-ucd-onboarding.md`.
4. **SSM response shapes:** ROB has "NATIONALITY" with value "MALAYSIAN CITIZEN"; ROC directors have no nationality; shareholders carry "ENTITY marker (P = passport, MK = MyKad)"; LLP uses `involveId`, `involveType`, `involveEffectiveToDt`, `involveIdType`. Source: Sheet1, R13, R18, R21, R24–R26. → `esim.md`.
5. **Template 3 subject key:** "Approved eAuto Registration - [Company Name] - [BRN Number]" — BRN, not Application No. Source: Sheet1, R32.
6. **Application statuses:** "Submitted, Reverted to UCD, Approved and Expired. Rejected and Cancelled belong to Pre-Application." Source: Sheet1, R37. Note `flow-ucd-onboarding.md` item 3 lists "New → Pending → Approved → Expired" — the two lists differ; reconcile [unconfirmed which is the UI label].
7. **Business Trading skips SSM purchase:** "a Business Trading License No does not trigger the automatic SSM purchase (EAINT-5972)". Source: Sheet1, R28. Consistent with `flow-ucd-onboarding.md` "Business Trading types need no eSIM."
8. **Correction:** mark the foreign-director → Template 2 rule in `business-rules-from-test-scenarios.md` §12 item 8.3 as BLOCKED in SharePoint TS #041 (R21, R26), confirmed only by the later revision.
9. **Defect history:** EAINT-12426 (CC apply@eauto.my missing on both emails) and EAINT-12428 (Appointment Letter margins). Source: Jira capture, Sub-tasks. → `cr-ledger.md` EAINT-12341 entry.
10. **SRD drift:** SRD v1.3 (29.09.2026) "Replaced UCD email templates with 1 combined template"; v1.2 (24.09.2026) "Appointment Letter attached to the UCD emails - Email template 1 & 2". Source: Jira description, SRD table rows 4–5. Any regression must start from v1.3, not this TS.
