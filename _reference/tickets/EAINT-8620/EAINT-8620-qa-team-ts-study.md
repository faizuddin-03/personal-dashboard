# EAINT-8620 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8620 & EAINT-8627 (Phase 1).md` (text dated "28/10/2026, 9:31:55 am"). Cell text only; formatting, colours and images not kept.
2. **Original workbook:** "EAINT-8620 & EAINT-8627 (Phase 1).xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 18/12/2025, 3:59:06 pm. Not opened directly; the text copy was used.
3. **Ticket folders:** `_reference/tickets/EAINT-8620/` and `_reference/tickets/Studying/EAINT-8620/` held no earlier files.
4. **lib/ticketStudies.ts:** no entry for 8620 or 8627.
5. **knowledge/:** `business-rules-from-test-scenarios.md` §16, `cr-test-scenario-catalogue.md` rows 058 and 071, `production-regression-scope.md` item 16, `flow-company-profile-einvoice.md` lines 132 and 153-154, `flow-ssm.md` line 68.
6. **Not read:** Jira ticket, SRD, Teams. This is a scheduled unattended study; no connector calls were made.

## 1. Header

1. **Ticket:** EAINT-8620 (hotline number change). The same workbook covers **EAINT-8627** (company address change).
2. **Portals:** **UCD** and **BackOffice (BO)**. Documents (PDF slips, Hak Milik), BO CSV reports and Insurance Details tooltips are also covered.
3. **Workbook:** "EAINT-8620 & EAINT-8627 (Phase 1).xlsx".
4. **Sheets (3):**
   a. "EAINT-8620": 22 numbered scenarios (8620_TS1 to TS22), plus 1 unnumbered row (R8) that was not covered.
   b. "EAINT-8627": 9 scenarios (8627_TS1 to TS9).
   c. "18th Dec 2025 Patching": 5 scenarios (8620_eLKM_TS1 to TS5).
5. **Total:** 36 numbered scenarios. This matches the catalogue count `[cr-test-scenario-catalogue.md row 071]`.
6. **Results (Web column, or Result column on the patching sheet):**
   a. EAINT-8620 sheet: **21 Pass, 1 N/A** (TS19).
   b. EAINT-8627 sheet: **8 Pass, 1 N/A** (TS5, "Included in ⏎ 8620_TS18 - TS22").
   c. Patching sheet: **5 PASS**.
   d. Overall: **34 Pass, 2 N/A, 0 Fail**.
7. **Mobile column:** most rows "N/A" or blank. Pass on Mobile only for 8620_TS18, TS20-TS22 and 8627_TS1, TS2, TS4.
8. **Testers (QA column):** three QA engineers on the main sheets (one ran TS1-TS8 and TS11, one ran TS9-TS10, one ran TS12-TS22 and all of EAINT-8627). The patching sheet has no QA column.
9. **Dates in the sheet:**
   a. "Retested on 8/10/2025" `[sheet EAINT-8620, R14 and R15]`.
   b. Patching date "18th Dec 2025 Patching" `[sheet 18th Dec 2025 Patching, R1]`.
   c. Production deployment date 20251013 for both tickets `[production-regression-scope.md lines 1054-1055]`, not stated in the workbook.

## 2. What the ticket changed, as the TS shows it

1. **Hotline change (EAINT-8620):** old number **1700-816-186** replaced by **03-27798899** on screens, error popups, banners, legal pages and the Hak Milik PDF footer.
2. **Old-number notice removed** from the login page: "Removed: ⏎ Our new hotline number is 03-27798899. The old number 1700-816-186 will be discontinued effective August 2025" `[sheet EAINT-8620, R4]`.
3. **Address change (EAINT-8627):** documents and reports show **Level 15, Sunway Tower, Jalan Ampang, 50450 Kuala Lumpur** instead of the Mutiara Damansara address, with a **date cut-off of 5/5/2025**.
4. **Patch 18 Dec 2025:** the failed eLKM final-submission message still had the old number; it was patched to 03-27798899 `[sheet 18th Dec 2025 Patching, R1]`: "Update Hotline number for Failed eLKM Final Submission".
5. **Earlier related ticket:** EAINT-8081 "To update Hotline to 03-27798899" (catalogue row 058). EAINT-8620 looks like Phase 1 of the wider roll-out [unconfirmed].

## 3. Scenarios

### a. Sheet EAINT-8620 — UCD screens (hotline)

1. **8620_TS1** — UCD login page, below "Welcome to eAuto". Expected: "Displaying: ⏎ Hotline: 03-27798899", old-number notice removed. Pass.
2. **8620_TS2** — UCD footer Contact Us popup, Support Hotline. Expected: "03-27798899 ⏎ Mon to Fri (9am to 6pm) ⏎ Sat, Sun & P.Holiday (10am to 4pm)". Pass.
3. **8620_TS3** — UCD Contact Us popup, beside phone icon. Expected: "☎️ 03-27798899". Pass.
4. **8620_TS4** — UCD homepage "Need Help?" section. Expected: "Support Hotline : 03-27798899". Pass.
5. **(R8, no TS number)** — SSM Purchase SSM Document popup, General Error, Pre e-Invoice (ROB). Expected: "Please call eAuto at 03-27798899." **Not covered** (see §4 item 5).
6. **8620_TS5** — SSM popup, RHB Account Inactive, eSTM (ROC). Expected: "RHB account is inactive. Please call eAuto at 03-27798899". Pass.
7. **8620_TS6** — same popup, Pre e-Invoice (ROB). Same expected text. Pass.
8. **8620_TS7** — SSM popup, Unavailable Verify Error, STMS (ROC); checked on popup, Step 4 and Trx Details page. Expected: "Verification unavailable now. Please call eAuto at 03-27798899." Pass.
9. **8620_TS8** — SSM popup, Company ROC Mismatch, eSTM (ROB); popup, Step 4 and Trx Details. Expected: "Verification unavailable now: SSM returned wrong SSM Document information {new_roc} ({old_roc}). Please call eAuto at 03-27798899." Pass.
10. **8620_TS9** — eSerahan Permission, eSTM User Permission > Add User, authorization error. Expected: "Name and IC do not match the selected user. Please contact 03-27798899 for assistance." Pass.
11. **8620_TS10** — STMS Step 5, payment failed due to RE, countdown banner. Expected: "Hotline : 03-27798899". Pass, retested 8/10/2025.
12. **8620_TS11** — eSTM Step 5, same banner. Expected: "Hotline : 03-27798899". Pass, retested 8/10/2025.
13. **8620_TS12** — Footer Privacy popup, Malay 11.2 "Pegawai Perlindungan Data ("PPO")". Expected: "No. Telefon: 03-27798899". Pass.
14. **8620_TS13** — Privacy popup, English 11.2 "Data Protection Officer ("DPO")". Expected: "Contact No.: 03-27798899". Pass.
15. **8620_TS14** — Footer Terms & Conditions 11.2. Expected: account closure text with "compliance@eauto.my or by contacting us at 03-27798899". Pass.

### b. Sheet EAINT-8620 — BackOffice screens (hotline)

1. **8620_TS15** — BO login page. Same as TS1. Pass.
2. **8620_TS16** — BO Contact Us popup, Support Hotline. Same as TS2. Pass.
3. **8620_TS17** — BO Contact Us popup, beside phone icon. Expected: "03-27798899". Pass.

### c. Sheet EAINT-8620 — Hak Milik PDF footer (UCD & BO, by trigger date)

1. **8620_TS18** — Hak Milik triggered **BEFORE 05/05/2025**. Expected: Mutiara Damansara address + "☎️1700-816-186". Pass / Pass.
2. **8620_TS19** — triggered **ON 05/05/2025**. Expected: Sunway Tower address + "☎️1700-816-186". **N/A / N/A** (no test data, per remark).
3. **8620_TS20** — triggered **BEFORE 01/08/2025**. Expected: Sunway Tower + "☎️1700-816-186". Pass / Pass.
4. **8620_TS21** — triggered **ON 01/08/2025**. Expected: Sunway Tower + "☎️03-27798899". Pass / Pass.
5. **8620_TS22** — triggered **AFTER 01/08/2025**. Expected: Sunway Tower + "☎️03-27798899". Pass / Pass.

### d. Sheet EAINT-8627 — address (before vs on/after 5/5/2025)

1. **8627_TS1** — STMS Slip Pengesahan, Page 1 (Salinan Syarikat), by Payment Date. Before: Mutiara; on/after: Sunway. Pass / Pass.
2. **8627_TS2** — STMS Slip Pengesahan, Page 2 (Salinan Penjual). Same rule. Pass / Pass.
3. **8627_TS3** — APT Slip Pengesahan, Page 1. Same rule. Pass / N/A.
4. **8627_TS4** — eSTM Slip Pengesahan, Page 2. Same rule. Pass / Pass.
5. **8627_TS5** — eSTM Butir-butir Hak Milik image, by Date Generated. "Included in ⏎ 8620_TS18 - TS22". N/A.
6. **8627_TS6** — BO JPJ Reconciliation Report (HASIL) CSV, below AGENSI. Sunway in both columns. Pass.
7. **8627_TS7** — BO JPJ ESTM Report (HASIL) CSV, below AGENSI. Sunway in both columns. Pass.
8. **8627_TS8** — Insurance Details, Agency Name "Pemaju Eksklusif Sdn Bhd" tooltip. Sunway in both columns. Pass.
9. **8627_TS9** — Insurance Details, Agency Name "Bintang Prospek Sdn Bhd" tooltip. Sunway in both columns. Pass.

### e. Sheet 18th Dec 2025 Patching — failed eLKM message

1. **8620_eLKM_TS1** — Firefox, UCD, New trx, eSTM Step 6. PASS.
2. **8620_eLKM_TS2** — Firefox, UCD, New trx, eSTM Details page. PASS.
3. **8620_eLKM_TS3** — Firefox, UCD, Existing trx, eSTM Details page. PASS.
4. **8620_eLKM_TS4** — Chrome, BO, New trx, eSTM Details page. PASS.
5. **8620_eLKM_TS5** — Chrome, BO, Existing trx, eSTM Details page. PASS.
6. **Expected for all five:** "Harap maaf, permohonan LKM anda gagal. Sila hubungi eAuto Support Team di 03-27798899 untuk keterangan lanjut." `[R4-R8]`.

## 4. Business rules and system behaviour

1. **Hotline value:** "Hotline: 03-27798899" `[sheet EAINT-8620, R4]`.
2. **Contact Us hours:** "Mon to Fri (9am to 6pm) ⏎ Sat, Sun & P.Holiday (10am to 4pm)" `[sheet EAINT-8620, R5]`.
3. **Two cut-off dates on the Hak Milik PDF footer:**
   a. **Address** switches on **05/05/2025**: TS19 "ON 05/05/2025" expects "Level 15, Sunway Tower" `[sheet EAINT-8620, R24]`.
   b. **Hotline** switches on **01/08/2025**: TS20 "BEFORE 01/08/2025" expects "☎️1700-816-186" and TS21 "ON 01/08/2025" expects "☎️03-27798899" `[sheet EAINT-8620, R25-R26]`.
   c. So a Hak Milik from 5/5/2025 to 31/7/2025 shows the **new address with the old hotline** `[sheet EAINT-8620, R24-R25]`.
4. **Old records keep old values.** Slips paid before 5/5/2025 show "10-1 & 10-2, Jalan PJU 7/16, Mutiara Damansara, ⏎ 47810 Petaling Jaya, Selangor Darul Ehsan" `[sheet EAINT-8627, R4, column "Before 5/5/2025"]`.
5. **Date basis differs per document:** Slip Pengesahan uses "Payment Date"; Hak Milik uses "Date Generated" `[sheet EAINT-8627, R4 and R8, Criteria column]`. Hak Milik rows on the 8620 sheet say "Existing eSTM trx trigger Hak Milik" `[R23-R27]`.
6. **Reports and tooltips are not date-split.** JPJ HASIL CSVs and Insurance agency tooltips show Sunway in both the before and after columns `[sheet EAINT-8627, R9-R12]`.
7. **SSM General Error cannot be triggered:** "NOTE: This error message unable to be trigger. Confirmed with dev is related to code error. So will not cover this as no way to trigger the scenario" `[sheet EAINT-8620, R8]`.
8. **SSM error text is shown in three places:** "Error Popup, Step 4 & Trx Details Page" `[sheet EAINT-8620, R11-R12]`.
9. **ROC mismatch message template:** "Verification unavailable now: SSM returned wrong SSM Document information {new_roc} ({old_roc}). Please call eAuto at 03-27798899." `[sheet EAINT-8620, R12]`.
10. **Account closure route:** "You may terminate and close your account by emailing us at compliance@eauto.my or by contacting us at 03-27798899." `[sheet EAINT-8620, R18]`.
11. **Failed eLKM message** shows on eSTM Step 6 and the eSTM Details page, in UCD and BO, for new and existing transactions `[sheet 18th Dec 2025 Patching, R4-R8]`. Existing transactions show the new number too, so the text is rendered at display time, not stored [unconfirmed].
12. **No-data rule:** "P2: If no test data is available, add a remark and mark the status as N/A." `[sheet EAINT-8620, R24 and R26]`.

### Contradictions with knowledge/

1. **flow-ssm.md line 68** says SSM Final Submission failure shows "Verification unavailable now. Please call eAuto at 1700816186". This TS expects "Verification unavailable now. Please call eAuto at 03-27798899." `[sheet EAINT-8620, R11]`. The flow file carries the **old number** and should be checked.
2. **business-rules-from-test-scenarios.md §16 item 3** cites "sheet EAINT-8620, row 26" for the old Mutiara address. Row 26 (TS21) shows Sunway + 03-27798899; the Mutiara row on that sheet is **R23** (TS18). It also cites "sheet EAINT-8627, rows 3-4"; R3 is the header, the first data row is R4.
3. **cr-test-scenario-catalogue.md row 071** lists portals "UCD, AATF". The workbook names **UCD and BackOffice**; AATF is not mentioned.
4. **flow-company-profile-einvoice.md line 132** says only "documents before 5/5/2025 keep the old address". It omits the separate **01/08/2025 hotline cut-off** on the Hak Milik PDF.

## 5. Test data, environments, accounts, setup

1. **Environment:** not named in the workbook. Catalogue says "none named" `[cr-test-scenario-catalogue.md row 071]`.
2. **Credentials:** none present in the sheet.
3. **Browsers:** Firefox (UCD) and Chrome (BO) on the patching sheet only `[sheet 18th Dec 2025 Patching, R4-R8]`.
4. **Test data needed:**
   a. Existing eSTM transactions whose Hak Milik was generated before 05/05/2025, on 05/05/2025, before / on / after 01/08/2025 `[sheet EAINT-8620, R23-R27]`. Data for "ON 05/05/2025" was not found (TS19 N/A).
   b. STMS, APT and eSTM slips paid before and on/after 5/5/2025 `[sheet EAINT-8627, R4-R7]`.
   c. An RHB-inactive company (ROC and ROB), an SSM verification-unavailable case and a ROC mismatch case `[sheet EAINT-8620, R9-R12]`.
   d. A Step 5 payment failure caused by RE (countdown banner) for STMS and eSTM `[sheet EAINT-8620, R14-R15]`.
   e. A failed eLKM final submission, new and existing `[sheet 18th Dec 2025 Patching]`.
   f. Insurance Details with agencies "Pemaju Eksklusif Sdn Bhd" and "Bintang Prospek Sdn Bhd" `[sheet EAINT-8627, R11-R12]`.
5. **Mobile:** some rows tested on mobile (Mobile column); device not named.

## 6. Gaps and risks for regression

1. **SSM General Error** (R8) was never tested. Its message text is unverified.
2. **Hak Milik "ON 05/05/2025"** (TS19) was N/A; the exact address cut-off day is unproven.
3. **BO not covered** for homepage Need Help, SSM popups, eSerahan, Step 5 banners, Privacy and T&C. These may not exist in BO [unconfirmed].
4. **eLKM message was missed** in the first pass and needed a patch two months later. Other old-number strings may remain. A text search of the code or pages for "1700-816-186", "1 700 816 186" and "1700816186" is the safer check [unconfirmed].
5. **Not in scope of this TS:** emails (Mailtrap), eDereg, eMOVE, Service Hub, ePreCheck messages. Other knowledge files show these use 03-27798899, from later tickets.
6. **Slip pages for other modules** (e.g. eDereg, eMOVE slips) and the Hak Milik for STMS are not listed.
7. **Payment Date vs Date Generated:** a regression should pick records on both sides of each cut-off, using the right date field per document.
8. **Mobile coverage** is partial; many hotline screens are "N/A" or blank on mobile.

## Knowledge candidates

1. **Hak Milik PDF footer has two cut-offs:** address changes on 05/05/2025, hotline on 01/08/2025; 5/5/2025 to 31/7/2025 shows Sunway address with "☎️1700-816-186". Source: `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet EAINT-8620, R24-R26]`. Target: `business-rules-from-test-scenarios.md` §16 and `flow-company-profile-einvoice.md` line 132.
2. **Date basis per document:** Slip Pengesahan = "Payment Date"; Hak Milik = "Date Generated". Source: `[sheet EAINT-8627, R4, R8]`. Target: §16.
3. **JPJ HASIL CSV reports and Insurance agency tooltips** always show the Sunway address, no date split. Source: `[sheet EAINT-8627, R9-R12]`.
4. **SSM General Error popup cannot be triggered** (dev confirmed code error). Source: `[sheet EAINT-8620, R8]`. Target: `flow-ssm.md`.
5. **flow-ssm.md line 68 uses the old hotline** in "Verification unavailable now. Please call eAuto at 1700816186". This TS expects 03-27798899 `[sheet EAINT-8620, R11]`. Re-check the source of line 68 (EAINT-9247 ledger); the message may differ between screens, or the ledger quote may be outdated [unconfirmed].
6. **Citation fixes** in `business-rules-from-test-scenarios.md` §16 item 3: Mutiara row is EAINT-8620 **R23**, not row 26; EAINT-8627 data starts at **R4**.
7. **Catalogue row 071 portals:** should read "UCD, BackOffice" (workbook names no AATF). Source: Platform column, all sheets.
8. **Failed eLKM message** shows on eSTM Step 6 and eSTM Details page (UCD and BO). Source: `[sheet 18th Dec 2025 Patching, R4-R8]`. Target: `flow-estm.md`.
