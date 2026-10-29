# EAINT-8766 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-8766.
2. **Module / portal:** **eAuto BackOffice (BO)**, with checks on the **UCD portal**. Areas: eSTM and STMS transactions.
3. **Workbook:** "EAINT-8766 - [eAuto-BackOffice] To grant access to cancel and edit eSTM & STMS Transactions.xlsx" — SharePoint library "eAuto - CR Test Scenarios", modified 03/09/2025, 5:03:48 pm.
4. **Sheets:** one sheet, "EAINT-8766".
5. **Columns** (sheet EAINT-8766, R2): "TS No. | Test Objective | BO Account | Role | Test Scenarios | Expected Result | QA | Test Result".
6. **Scenarios:** **26** (8766_TS1 to 8766_TS26), in four section banners (R3, R9, R11, R24).
7. **Results:** **26 PASS, 0 FAIL**. Every row's Test Result = "PASS".
8. **Tester:** QA column = "Nabila" on all 26 rows. No test dates are written in the sheet.
9. **Unlabelled extra column:** rows R12 (TS7), R17 (TS12) and R28 (TS22) carry an extra cell "P2" after "PASS". The column has no header. Meaning [unconfirmed] — possibly a pass-2 / retest marker.

## 2. What the ticket changed, as the TS shows it

1. **Named BO accounts get access to cancel eSTM transactions** from **BO > Transaction Relevant > eSTM Transaction Listing** via a **[Cancel]** link in the Action column (TS1–TS5).
2. **Named BO accounts get access to reset a failed STMS payment** from **BO > Transaction Relevant > STMS Transaction Listing** via **[Reset]** (TS6). Same behaviour as EAINT-8826.
3. **Named BO accounts (Role "Admin") can edit "all editable fields" in STMS** from **BO > Support Tools > STMS Transaction**, across New, Approved, Pending, Failed, Cancelled and Interstate statuses (TS7–TS18).
4. **Named BO accounts can edit "all editable fields" in eSTM** from **BO > Support Tools > eSTM Transaction** (TS19–TS26).
5. The test objective wording is "To grant access to ...", so the change is a **permission grant to specific BO users**, not a new feature for every BO user [unconfirmed — no SRD read].

## 3. Scenarios

### A. BO > Transaction Relevant > eSTM Transaction Listing — Cancel (R3 banner)

1. **8766_TS1** (eautochinwei) — cancel eSTM with Status = **Pending**. Expected: "Able to cancel eSTM Transaction in BO" and "Remarks displayed as "CANCELLED BY <BO Account> on dd-mm-yyyy hh:mm"". PASS.
2. **8766_TS2** (kokping) — cancel eSTM where **JPJ Enquiry = Failed**, Status = Failed. Same expected. PASS.
3. **8766_TS3** (eautoxiayuan) — cancel eSTM where **JPJ Enquiry = OK, RHB Payment = Failed**, Status = Failed. Same expected. PASS.
4. **8766_TS4** (eautohamal) — cancel eSTM where **eLKM & eVOC = Failed** (Step 4 to Step 5), Status = Failed. Same expected. PASS.
5. **8766_TS5** (wahidahzaki) — cancel eSTM with Status = **Pending**. Same expected. PASS.

### B. BO > Transaction Relevant > STMS Transaction Listing — Reset payment (R9 banner)

1. **8766_TS6** (eautojrjaya) — STMS with **RHB Payment = Failed** → click [Reset]. Expected: "Able to reset payment for STMS transaction in Backoffice" and "UCD able to make payment again". PASS.

### C. BO > Support Tools > STMS Transaction — Edit (R11 banner, Role = Admin)

1. **8766_TS7** (eautochinwei) — Individual, **New** → edit Engine No, Chassis No, Vehicle Make, Vehicle Model, Manufacturing Year. Expected: fields "are updated in BO & UCD > Listing & Details page". PASS (P2).
2. **8766_TS8** (eautohamal) — Individual, **Approved** → edit **MyKad No** only. Expected: "MyKad No. is updated in BO & UCD > Listing & Details page". PASS.
3. **8766_TS9** (kokping) — Individual, **JPJ Transfer = Failed** → edit vehicle fields → [Update] and **[Reset JPJ Status]**. Expected adds "JPJ Transfer & Transaction Status are updated to Pending". PASS.
4. **8766_TS10** (eautoxiayuan) — Individual, **Pending** → edit vehicle fields. Expected: fields updated in BO & UCD. PASS.
5. **8766_TS11** (eautohamal) — Individual, **Cancelled** (cancelled in BO first) → edit vehicle fields. Expected: fields updated in BO & UCD. PASS.
6. **8766_TS12** (kokping) — Company, **New** → edit vehicle fields + **Company Name & ROC No.** Expected: all updated. PASS (P2).
7. **8766_TS13** (wahidahzaki) — Company, **Approved** → edit **Company Name & ROC No.** only. Expected: "Company Name & ROC No. are updated in BO & UCD > Listing & Details page". PASS.
8. **8766_TS14** (eautojrjaya) — Company, **JPJ Transfer = Failed** → edit vehicle + company fields → [Update] and [Reset JPJ Status]. Expected: fields updated. PASS.
9. **8766_TS15** (wahidahzaki) — Company, **Cancelled** → edit vehicle + company fields. Expected: fields updated. PASS.
10. **8766_TS16** (eautochinwei) — **UCD to UCD Interstate**, Status = **Interstate New** (until Step 2) → edit vehicle + company fields. Expected: fields updated. PASS.
11. **8766_TS17** (kokping) — Interstate, **Interstate Expired** → edit vehicle + company fields. Expected: fields updated. PASS.
12. **8766_TS18** (eautoxiayuan) — Interstate, **Interstate Cancelled** → edit fields → [Update] and **[Resume]**. Expected adds "Transaction status change to Pending". PASS.

### D. BO > Support Tools > eSTM Transaction — Edit (R24 banner, Role blank)

1. **8766_TS19** (kokping) — Individual, **Approved** → edit **MyKad No**. Expected: "MyKad No. is updated in BO & UCD > Listing & Details page". PASS.
2. **8766_TS20** (eautoxiayuan) — Individual, **Pending** → edit **Engine No & Chassis No**. Expected: "Engine No & Chassis No are updated in BO & UCD > Listing & Details page". PASS.
3. **8766_TS21** (eautochinwei) — Individual, **Failed** → edit Engine No & Chassis No. Same expected. PASS.
4. **8766_TS22** (eautoxiayuan) — Company, **New** → edit **Company Name**. Expected: "Company Name is updated in BO & UCD > Listing & Details page". PASS (P2).
5. **8766_TS23** (wahidahzaki) — Company, **Approved** → edit **ROC No.** Expected: "ROC No. is updated in BO & UCD > Listing & Details page". PASS.
6. **8766_TS24** (eautojrjaya) — Company, **Pending** → edit Engine No, Chassis No, Company Name & ROC No. Expected: all updated. PASS.
7. **8766_TS25** (eautojrjaya) — Company, **Failed** → edit Engine No, Chassis No, Company Name & ROC No. Expected: all updated. PASS.
8. **8766_TS26** (eautohamal) — Company, **Cancelled** (cancelled in BO first) → edit Company Name & ROC No. Expected: "Company Name and ROC No. is updated in BO & UCD > Listing & Details page". PASS.

## 4. Business rules and system behaviour the TS reveals

1. **BO cancel remark format** — "Remarks displayed as "CANCELLED BY <BO Account> on dd-mm-yyyy hh:mm"" (sheet EAINT-8766, R4–R8, Expected Result). Shown in the **Remarks column** (R4, step 7).
2. **Cancel shows in both portals** — "BO & UCD > Verify eSTM Transaction is cancelled in transaction listing and details page" (R4, step 6).
3. **eSTM [Cancel] works on Pending and Failed** — Pending (R4, R8), JPJ Enquiry Failed (R5), RHB Payment Failed (R6), eLKM & eVOC Failed (R7).
4. **[Cancel] sits in the Action column** of the BO eSTM Transaction Listing — "Click [Cancel] in Action column" (R4, step 5).
5. **STMS [Reset] gives the UCD a second payment attempt** — "UCD able to make payment again" (R10, Expected Result).
6. **STMS Approved, individual: MyKad No. is the edited field** — "Edit MyKad No field" (R13, step 5).
7. **STMS Approved, company: Company Name & ROC No. are the edited fields** — "Edit Company Name & ROC No. fields" (R18, step 5).
8. **STMS other statuses: vehicle fields editable** — "Edit Engine No, Chassis No, Vehicle Make, Vehicle Model & Manufacturing Year fields" (R12, step 5); company adds "Company Name & ROC No." (R17, step 5).
9. **Reset JPJ Status after edit** — "Click [Update] and [Reset JPJ Status]" → "JPJ Transfer & Transaction Status are updated to Pending" (R14, step 6 + Expected Result).
10. **Cancelled transactions stay editable** — STMS Cancelled (R16, R20) and eSTM Cancelled (R32) all PASS on edit.
11. **Interstate Cancelled can be resumed** — "Click [Update] and [Resume]" → "Transaction status change to Pending" (R23, step 7 + Expected Result).
12. **Interstate statuses named in BO** — "Interstate New" (R21), "Interstate Expired" (R22), "Interstate Cancelled" (R23).
13. **eSTM edits are narrower than STMS edits** — eSTM rows only edit Engine No, Chassis No, MyKad No, Company Name, ROC No. (R25–R32). Vehicle Make / Model / Manufacturing Year are never edited on eSTM. Whether they are locked there is [unconfirmed].
14. **Edit access needs Role "Admin" on STMS** — Role = "Admin" on R12–R23. Role is blank on eSTM rows R25–R32 and cancel rows R4–R10 [unconfirmed whether a role is needed there].
15. **Edits reach UCD** — every edit row checks "BO & UCD > Listing & Details page" (R12–R32).

## 5. Test data, environments, accounts, setup

1. **Environment:** not named anywhere in the sheet.
2. **BO accounts (the users granted access):** eautochinwei, kokping, eautoxiayuan, eautohamal, wahidahzaki, eautojrjaya (BO Account column, R4–R32). **No passwords in the sheet.**
3. **Role:** "Admin" on STMS Support Tools rows (R12–R23).
4. **Data creation:** all transactions created by hand in **UCD** first — e.g. "UCD > Create eSTM transaction until Step 4" (R4), "UCD > Create Company STMS transaction" (R17), "UCD > Create UCD to UCD Interstate transaction until Step 2" (R21).
5. **Failure states needed:** JPJ Enquiry Failed (R5), RHB Payment Failed (R6, R10), eLKM & eVOC Failed (R7), JPJ Transfer Failed (R14, R19). Producing these needs eSIM codes [unconfirmed — sheet does not say how].
6. **Cancelled setup:** done by BO cancel before the edit — "BO > Cancel STMS transaction, Transaction Status = Cancelled" (R16, step 2).
7. **Interstate Expired** (R22) needs a transaction left to expire; the sheet does not say how it was produced.
8. **Typo in sheet:** TS17 steps jump from 2 to 4 (R22).

## 6. Gaps or risks a regression should still cover

1. **No negative access test.** No row checks that a BO user **without** the grant cannot see [Cancel], [Reset] or edit fields.
2. **Locked fields not checked.** No row checks that non-editable fields stay read-only (e.g. vehicle fields on Approved, MyKad on New).
3. **No field validation.** No invalid Engine/Chassis/MyKad/ROC values, blanks or length limits.
4. **No cancel on Approved / New / Cancelled eSTM.** Only Pending and Failed are tried; whether [Cancel] is hidden for other statuses is untested.
5. **STMS cancel from the listing** is only used as setup (R16, R20, R23). Its remark text is not verified for STMS.
6. **eSTM Individual New** is not edited; **eSTM Interstate** not covered.
7. **No audit trail check.** The sheet does not check any audit log for edits.
8. **Downstream effects** of an edit (e-Invoice, Slip Pengesahan, JPJ resubmission with the new Engine/Chassis) are not checked.
9. **Reset JPJ Status** only on STMS (R14, R19); no eSTM equivalent tested.
10. **TS6 duplicates EAINT-8826** — regression can merge with the 8826 Reset rows.

## 7. Comparison with knowledge/

1. **knowledge/flow-stms.md:277** puts "Cancel remark: 'CANCELLED BY <BO account> on dd-mm-yyyy hh:mm'" under **Support Tools > STMS Transaction**, tagged "[ts: EAINT-8766 8766_TS7-TS12]". In this TS the remark is only verified on the **eSTM Transaction Listing** cancel (R4–R8). TS7–TS12 verify edits, not the remark. **Mismatch in source tag**; STMS cancel remark is [unconfirmed] from this TS.
2. **knowledge/flow-stms.md:277** lists Approved company edits as Company Name and ROC — matches R18 (TS13), which sits outside the cited "TS7-TS12" range.
3. **knowledge/flow-stms.md:279** and **flow-ucd-to-ucd.md:121** — Interstate Cancelled → [Update] and [Resume] → Pending. **Matches** R23.
4. **knowledge/flow-stms.md:288** — "Editing STMS fields needs role Admin." **Matches** R12–R23. The TS gives no role for eSTM edits.
5. **knowledge/flow-stms.md:274** — Reset Payment tagged "[ts: EAINT-8766 8766_TS6]". **Matches** R10.
6. **knowledge/flow-estm.md:1120** lists "**BO-side views** of an eSTM" as not covered. This TS documents two BO eSTM entry points (Transaction Listing cancel, Support Tools edit) — a gap the eSTM flow file could fill.
7. **knowledge/business-rules-from-test-scenarios.md:167–175** — matches rows 12–18 and row 4. It does not record the eSTM edit rules (R25–R32) or the Cancelled-still-editable rule.
8. **knowledge/cr-test-scenario-catalogue.md:224** — row 081 matches (26 scenarios, tester, 2025-09-03, "none named" environment).
9. **lib/ticketStudies.ts** — no entry for EAINT-8766.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8766 - [eAuto-BackOffice] To grant access to cancel and edit eSTM & STMS Transactions.md` — text copy (28/10/2026, 10:03:41 am), sheet EAINT-8766, R2–R32. Cell text only; formatting, colours and images not kept.
2. `_reference/tickets/EAINT-8766/` and `_reference/tickets/Studying/EAINT-8766/` — **do not exist** before this study. No SRD, Jira capture or Teams record for this ticket was available.
3. knowledge/ grep for "8766": `flow-stms.md`, `flow-ucd-to-ucd.md`, `business-rules-from-test-scenarios.md`, `cr-test-scenario-catalogue.md`; `flow-estm.md` (BO / Cancelled sections); `knowledge/README.md` index rows.
4. `lib/ticketStudies.ts` — no match for EAINT-8766.
5. `_reference/tickets/Studying/EAINT-12019/EAINT-12019-related-history.md:48` — mentions 8766 as a per-user BO permission grant.

## Knowledge candidates

1. **flow-stms.md:277 source fix** — re-tag the "CANCELLED BY <BO account> on dd-mm-yyyy hh:mm" remark to the **eSTM Transaction Listing** cancel: "Remarks displayed as "CANCELLED BY <BO Account> on dd-mm-yyyy hh:mm"" `[ts: EAINT-8766 sheet EAINT-8766, R4–R8]`. Mark the STMS Support Tools cancel remark [unconfirmed].
2. **flow-estm.md — new BO section:** eSTM can be cancelled from "BO > Transaction Relevant > eSTM Transaction Listing" via "[Cancel] in Action column" when Pending or Failed (JPJ Enquiry Failed, RHB Payment Failed, eLKM & eVOC Failed) `[ts: EAINT-8766 R4–R8]`.
3. **flow-estm.md — BO Support Tools > eSTM Transaction edits:** Approved individual → MyKad No. (R25); Approved company → ROC No. (R29); New company → Company Name (R28); Pending/Failed → Engine No & Chassis No (individual, R26–R27), plus Company Name & ROC No. (company, R30–R31); Cancelled company → Company Name & ROC No. (R32) `[ts: EAINT-8766]`.
4. **Cancelled transactions remain editable** in BO Support Tools for both STMS (R16, R20) and eSTM (R32) `[ts: EAINT-8766]`.
5. **BO Support Tools > STMS Transaction covers Interstate rows** with statuses "Interstate New", "Interstate Expired", "Interstate Cancelled" (R21–R23) `[ts: EAINT-8766]` — candidate for flow-ucd-to-ucd.md.
6. **Granted BO accounts for 8766:** eautochinwei, kokping, eautoxiayuan, eautohamal, wahidahzaki, eautojrjaya `[ts: EAINT-8766 BO Account column]` — useful when picking a BO login for cancel/edit tests [unconfirmed that the list is still current].
