# EAINT-9555 — QA Team test script study (2026-10-28)

## Sources read

1. **TS text copy** — `_reference/sharepoint/qa-team-ts/EAINT-9555 - [eAuto] To update eAuto Logo with TM.md` (header: "text copy (28/10/2026, 1:04:26 am)", "Cell text only, row by row; formatting and images are not kept."). Read in full, all 4 sheets.
2. **Not read:** the `.xlsx` itself (`_reference/sharepoint/eauto-cr-test-scenarios/EAINT-9555 - [eAuto] To update eAuto Logo with TM.xlsx`). Cell colours, images and embedded evidence are therefore unknown.
3. **Not read:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-9555_-_eAuto_To_update_eAuto_Logo_with_TM.xlsx.txt` (another text dump of the same workbook) [unconfirmed that it is identical].
4. **Not read:** Jira ticket, SRD, Teams. Unattended run; no SRD in the repo.
5. **Checked, nothing found:** `_reference/tickets/EAINT-9555/` (did not exist before this file), `_reference/tickets/Studying/EAINT-9555/` (does not exist), `lib/ticketStudies.ts` (no EAINT-9555 entry).
6. **Knowledge checked:** `knowledge/cr-test-scenario-catalogue.md` (rows 135, 451), `knowledge/business-rules-from-test-scenarios.md` (§16 item 7), `knowledge/flow-company-profile-einvoice.md` (lines 132, 152), `knowledge/production-regression-scope.md` (line 470 item 16, line 991), `knowledge/flow-bo-shell.md`, `knowledge/flow-ucd-shell.md`, `knowledge/flow-service-portal-shell.md` (logo image name).

## 1. Header

1. **Ticket:** EAINT-9555 — "[eAuto] To update eAuto Logo with TM". Sheet link: "Ticket(s): https://mfservices.atlassian.net/browse/EAINT-9555" (Affected Page, R2).
2. **Portals:** eAuto login, **BackOffice**, **UCD**, **AATF**, **Service Portal**, **JPJ Hasil**, **JPJ Dereg**, plus **PDF documents and emails** from BO, UCD, AATF and Service Portal.
3. **Workbook:** "EAINT-9555 - [eAuto] To update eAuto Logo with TM.xlsx", library "eAuto - CR Test Scenarios", modified 08/04/2026, 10:56:18 pm.
4. **Sheets (4):** "Affected Page", "New Approved Transaction", "Existing Approved Transaction", "Video Placeholder".
5. **Scenario count: 150.**
   1. Affected Page: **78** (9555_TS1 – 9555_TS78).
   2. New Approved Transaction: **30** (NEW_TS1 – NEW_TS30).
   3. Existing Approved Transaction: **40** (OLD_TS1 – OLD_TS40).
   4. Video Placeholder: **2** (VID_TS1 – VID_TS2).
6. **Results recorded:** **148 PASS, 1 FAILED, 1 no result.**
   1. FAILED: **NEW_TS1** (BO Generate Batch Invoice), linked "https://mfservices.atlassian.net/browse/EAINT-10373" (New Approved Transaction, R4).
   2. No result: **9555_TS78**, step cell "Disabled / not use in prod" (Affected Page, R93).
7. **Environment:** "Test environment: staging/uat3" (Affected Page, R4).
8. **Testers as written in the sheet:** "Nick" in the Remarks area of many Affected Page and New Approved rows; QA column on Existing Approved Transaction holds "Maisarah" (most rows) and "Nick" (OLD_TS32 – OLD_TS35, R34–R37).
9. **Dates:** none written in the sheet cells. Only date in data: "date: 31/3/2026" (Affected Page, R74 remark). Workbook modified 08/04/2026; `production-regression-scope.md` line 991 lists "| EAINT-9555 | 20260408 | Logo update | Yes |".

## 2. What the ticket changed, as the TS shows it

1. **eAuto logo replaced with a logo carrying the TM symbol** on page headers and footers across all portals. Every Affected Page row expects "eAuto logo with TM symbol is displayed correctly".
2. **Two logo variants** beyond the plain one:
   1. "eAuto Logo with Hotline Number + TM" — Service Portal login page (Affected Page, R86 banner, R88).
   2. "eAuto Logo with Insurance + TM" — UCD "Proceed Insurance during eSTM" (Affected Page, R91 banner, R93). Not tested: "Disabled / not use in prod".
3. **New documents** (invoice, e-Invoice, BBHM, Delivery Order, Confirmation of Registration, reconciliation reports, email certificates) carry the TM logo.
4. **Old documents do not change.** Transactions approved before deployment "Remain as old version eAuto logo (without TM)." (Existing Approved Transaction, R3 onward).
5. **BBHM footer** also shows a new phone number: "eAuto Logo on Butir-butir Hak Milik with new phone no. & symbol is displayed correctly" (New Approved Transaction, R36–R38).
6. **Video placeholders** in BMK and JomCheck show the TM logo (Video Placeholder, R4–R5).

## 3. Scenarios

### A. Affected Page — screens (all expect "eAuto logo with TM symbol is displayed correctly" unless noted)

1. **9555_TS1–TS2** — eAuto Login Page header / footer. PASS.
2. **9555_TS3–TS4** — BackOffice header / footer after login. PASS.
3. **9555_TS5–TS6** — BO Customize Display Message, Edit and Create, Preview mode ("BackOffice > Customize Display Message > Edit > Preview"). PASS.
4. **9555_TS7–TS8** — BO "Error - No service" header / footer. PASS.
5. **9555_TS9–TS10** — UCD header / footer after login. PASS.
6. **9555_TS11–TS14** — UCD Account Activation and "After Activation - Update Password" header / footer ("Create new UCD > Account Activation"). PASS; TS11 and TS13 link EAINT-10266.
7. **9555_TS15** — UCD "Homepage - Web Socket Announcement", **Firefox only**. PASS.
8. **9555_TS16–TS21** — UCD Manage Branches View / Edit / Add Branch header / footer. PASS.
9. **9555_TS22–TS23** — UCD "Error - No service" header / footer. PASS.
10. **9555_TS24** — UCD "eSTM Step 1 - Buyer Authentication" ("UCD > eSTM Step 1 Thumprint > Step 2 Fill in information"). PASS.
11. **9555_TS25–TS27** — AATF header / footer, Web Socket Announcement (TS27 **Firefox only**). PASS.
12. **9555_TS28–TS33** — AATF Reports, AATF Payment Report, Audit Trail Log header / footer. PASS.
13. **9555_TS34–TS49** — AATF Settings: Confirmation of Registration, Manage Users, View Users Listing, Update / Add Users and their "Main User MyKad Validation" pages, header / footer. PASS.
14. **9555_TS50–TS53** — AATF Account Activation and "Activation – Update Information" header / footer. PASS.
15. **9555_TS54–TS55** — AATF "Error – No Service" header / footer. PASS.
16. **9555_TS56–TS62** — Service Portal login footer, header / footer after login, Ownership Claim Enquiry, Ownership Claim Listing. PASS.
17. **9555_TS63–TS64** — JPJ Hasil header / footer after login. PASS; remark "credential in checklist" (R70).
18. **9555_TS65–TS66** — JPJ Dereg header / footer after login. PASS.

### B. Affected Page — documents and emails

1. **9555_TS67–TS68** — BO PDF "RHB Reconciliation Summary" and "(eAuto Plus)" header ("JPJ Reports > eAuto Reconciliation Summary Report - Search for existing summary report and download pdf"). PASS; link EAINT-10269.
2. **9555_TS69** — BO PDF Delivery Order ("Manage Company Account > Company Details > Click “Print DO”."). PASS; link EAINT-10270.
3. **9555_TS70–TS71** — UCD PDF Confirmation of Registration, header and **watermark**. PASS; link EAINT-10268.
4. **9555_TS72** — PDF "Insurance Email - Takaful Email Certificate". PASS.
5. **9555_TS73** — AATF PDF "Dereg Email - COD Email Certificate" (step "Upload COD"). PASS.
6. **9555_TS74–TS75** — AATF PDF Confirmation of Registration header and watermark. PASS; link EAINT-10268.
7. **9555_TS76** — Email: "eSTM – Proceed Insurance Transaction till success – click on Check JPJ Status". PASS; remark "Only takaful that our side send email which has logo".
8. **9555_TS77** — Service Portal Login Page: "eAuto Logo with Hotline Number + TM symbol is displayed correctly". PASS.
9. **9555_TS78** — UCD "Proceed Insurance during eSTM": "eAuto Logo with Insurance + TM symbol is displayed correctly". **No result**; "Disabled / not use in prod".

### C. New Approved Transaction — new documents show TM logo

Each module has an Invoice ("Invoice – New Version") row and an e-Invoice row; all expect "eAuto logo with TM symbol is displayed correctly".

1. **NEW_TS1** — BO "Generate Batch Invoice (STMS, APT, eSTM) > Download Invoice". **FAILED**, EAINT-10373.
2. **NEW_TS2–TS7** — UCD STMS, Transfer History, STMS – SSM ("STMS > Company … Purchase SSM Document & TH at Step 4"). PASS.
3. **NEW_TS8–TS13** — UCD eSTM, eVOC, eLKM ("eSTM > Individual with BBHM … eLKM + eVOC"). PASS.
4. **NEW_TS14–TS15** — UCD eSTM – SSM ("eSTM > Company … Purchase SSM Document in Step 4"). PASS.
5. **NEW_TS16–TS17** — UCD APT (STMS to step 6, BO manual APT trigger 5.5 and 6.0, resubmit, pay). PASS; link EAINT-10372.
6. **NEW_TS18–TS19** — UCD BMK Individual. PASS.
7. **NEW_TS20–TS21** — UCD Jom Check. PASS.
8. **NEW_TS22–TS23** — AATF Deregistration. PASS.
9. **NEW_TS24–TS25** — AATF eDereg Pre-Checking. PASS.
10. **NEW_TS29–TS30** — UCD to UCD. PASS.
11. **NEW_TS26–TS28** — BBHM footer from UCD, BO ("eSTM transaction details") and Service Portal ("Hire Purchase Ownership > Ownership Claim Listing … View record details & print"): "eAuto Logo on Butir-butir Hak Milik with new phone no. & symbol is displayed correctly". PASS.

### D. Existing Approved Transaction — old documents keep old logo

All expect "Remain as old version eAuto logo (without TM)." unless noted. All PASS.

1. **OLD_TS1** — BO Generate Batch Invoice; remark "check all modules in BO".
2. **OLD_TS2–TS25** — "Invoice – New Version" and e-Invoice for STMS, TH, STMS – SSM, eSTM, eVOC, eLKM, eSTM – SSM, APT, BMK, Jom Check, Deregistration, eDereg Pre-Checking, each "approved transaction details … before deployment".
3. **OLD_TS26–TS37** — "Invoice – Old Version" for STMS, TH, STMS – SSM, eSTM, eVOC, eLKM, eSTM – SSM, APT, BMK, Jom Check, Deregistration: transactions "BEFORE JUNE 2025". OLD_TS37 (eDereg Pre-Checking) has no date condition.
4. **OLD_TS38–TS40** — BBHM from UCD, BO, Service Portal for transactions before deployment: "eAuto Logo on Butir-butir Hak Milik eAuto logo (without TM) symbol is displayed correctly".

### E. Video Placeholder

1. **VID_TS1** — UCD BMK video placeholder. PASS.
2. **VID_TS2** — UCD JomCheck video placeholder. PASS.

## 4. Business rules and system behaviour

1. **Old documents are frozen.** "Remain as old version eAuto logo (without TM)." (Existing Approved Transaction, R3–R39). Applies to both invoice versions and e-Invoice.
2. **Two invoice versions exist.** Page column values "Invoice – New Version" (e.g. New Approved Transaction, R5) and "Invoice – Old Version" (Existing Approved Transaction, R28–R39). Old Version rows use "BEFORE JUNE 2025" (e.g. R28). [unconfirmed] June 2025 is the switch date from the old to the new invoice layout, matching e-Invoice go-live.
3. **Old Version invoices have no e-Invoice.** OLD_TS26–TS37 download "Invoice" only, not "Invoice & e - Invoice" (Existing Approved Transaction, R28–R39). [unconfirmed] e-Invoice did not exist before June 2025.
4. **Only Takaful insurance emails carry an eAuto logo.** "Only takaful that our side send email which has logo" (Affected Page, R83, remark). Step cell reads "*Confirm witt dev" (same row).
5. **Insurance-branded logo is not used in prod.** "Disabled / not use in prod" (Affected Page, R93).
6. **Service Portal login uses a hotline variant.** "eAuto Logo with Hotline Number + TM symbol is displayed correctly" (Affected Page, R88).
7. **BBHM footer shows a new phone number with the logo.** "eAuto Logo on Butir-butir Hak Milik with new phone no. & symbol is displayed correctly" (New Approved Transaction, R36–R38).
8. **Delivery Order check includes address and numbers.** "ucd test, have to verify the address, no phone, ws number remain same" (Affected Page, R76, remark).
9. **Confirmation of Registration carries the logo as a watermark too.** TS71 / TS75 page "Confirmation of Registration – Watermark" (Affected Page, R78, R82).
10. **Web Socket Announcement** tested on "Firefox" only (Affected Page, R22, R34); all other rows "Chrome / Firefox".
11. **BO Generate Batch Invoice** failed on new transactions: NEW_TS1 "FAILED | https://mfservices.atlassian.net/browse/EAINT-10373" (New Approved Transaction, R4). Final fix state not recorded in the sheet.
12. **New logo visible from the first step.** Remark "check on first step (new logo), use main ucd acc" (New Approved Transaction, R5) and "check on first step (new logo)" (R11). [unconfirmed] The transaction pages themselves show the TM logo during the flow, not only on final documents.

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/uat3" (Affected Page, R4).
2. **Credentials:** JPJ Hasil remark "credential in checklist" (Affected Page, R70). No passwords in the text copy.
3. **Accounts named in remarks:**
   1. "use izni's account, date: 31/3/2026 ⏎ summary > view > download report" (Affected Page, R74).
   2. "use izni's account" (Affected Page, R75).
   3. "use UCD TEST" (Affected Page, R77); "change ucd to Main UCD" (R78).
   4. "use main ucd acc" (New Approved Transaction, R5).
   5. "ask TY to check the new logo during trx" (New Approved Transaction, R21).
4. **Vehicles noted on Existing Approved Transaction:** "UCD to UCD (interstate): ⏎ WC5557A" (R3); "BBHM: ⏎ VDG5277" (R4).
5. **Setup for old records:** approved transactions created **before deployment**, and STMS/eSTM/APT/BMK/JomCheck/Deregistration records **before June 2025** for Old Version invoices.
6. **APT setup:** "BO, trigger STMS Transaction APT5.5 & APT 6.0 (Manual APT Trigger)" then "Resubmit APT in APT Transaction Listing" (New Approved Transaction, R19).

## 6. Gaps or risks a regression should still cover

1. **NEW_TS1 BO batch invoice** — FAILED (EAINT-10373); no retest recorded. Recheck the TM logo on BO Generate Batch Invoice.
2. **9555_TS78** — never tested. If Insurance during eSTM is re-enabled, the "Insurance + TM" logo needs a check.
3. **Cutoff rule unclear.** The sheet splits by "before deployment" only. A transaction started before deploy and approved after is not covered. [unconfirmed] whether the logo follows approval date or document generation date.
4. **Mobile app** not in scope; no UCD mobile rows.
5. **Modules missing from document checks:** shopping cart / device purchase, insurance invoices, eDereg COD other than email, JomCheck report PDF itself (only invoice tested).
6. **Emails** — only Takaful certificate and COD certificate. Activation, password reset and notification emails not checked.
7. **OLD_TS37** eDereg Pre-Checking has no date bound, unlike the others.
8. **Test Steps blank** on most screen rows (e.g. Affected Page, R8–R11); navigation must be known by the tester.
9. **Numbering out of order:** NEW_TS29–TS30 sit at R29–R30, before NEW_TS26–TS28 at R36–R38.

## 7. Knowledge vs this TS

1. **Consistent:** `flow-company-profile-einvoice.md` line 132 "New documents carry the eAuto logo with TM. Documents already approved keep the old logo (EAINT-9555)."
2. **Consistent:** shell docs show the logo file `eAuto_TM_logo.svg` in BO (`flow-bo-shell.md` line 315), UCD (`flow-ucd-shell.md` line 226) and Service Portal (`flow-service-portal-shell.md` line 87).
3. **Incomplete:** `cr-test-scenario-catalogue.md` row 135 lists portals "UCD, AATF, BO, documents" — the TS also covers **Service Portal, JPJ Hasil, JPJ Dereg** and the eAuto login page. It names one tester; the sheet also shows "Nick".
4. **Not yet in knowledge:** BBHM new phone number, Takaful-only logo email, Invoice Old/New Version split at June 2025, watermark on Confirmation of Registration.

## Knowledge candidates

1. **Old documents keep the old logo; both invoice layouts exist.** "Invoice – New Version" and "Invoice – Old Version" (Old = "BEFORE JUNE 2025"); approved-before-deploy docs "Remain as old version eAuto logo (without TM)." Source: `[from SharePoint TS EAINT-9555, sheet Existing Approved Transaction, rows 3–39]`. Target: `flow-company-profile-einvoice.md`.
2. **Only Takaful insurance emails carry the eAuto logo.** "Only takaful that our side send email which has logo". Source: `[from SharePoint TS EAINT-9555, sheet Affected Page, row 83, remark]`. Target: `eauto-insurance.md`.
3. **BBHM footer carries the TM logo and a new phone number.** "eAuto Logo on Butir-butir Hak Milik with new phone no. & symbol is displayed correctly". Source: `[from SharePoint TS EAINT-9555, sheet New Approved Transaction, rows 36–38]`. Target: `flow-estm.md`.
4. **Confirmation of Registration PDF has a logo watermark** (UCD and AATF). Source: `[from SharePoint TS EAINT-9555, sheet Affected Page, rows 78, 82]`.
5. **Service Portal login uses "eAuto Logo with Hotline Number + TM".** Source: `[from SharePoint TS EAINT-9555, sheet Affected Page, row 88]`. Target: `flow-service-portal-shell.md`.
6. **Insurance-branded logo in eSTM is "Disabled / not use in prod".** Source: `[from SharePoint TS EAINT-9555, sheet Affected Page, row 93]`.
7. **Catalogue fix:** row 135 portal list should add Service Portal, JPJ Hasil, JPJ Dereg; result counts 148 PASS / 1 FAILED (NEW_TS1, EAINT-10373) / 1 untested (TS78). Source: this study, §1. Target: `cr-test-scenario-catalogue.md`.
8. **Linked defect tickets** from this TS: EAINT-10266 (UCD activation pages), EAINT-10268 (Confirmation of Registration), EAINT-10269 (RHB Reconciliation Summary), EAINT-10270 (Delivery Order), EAINT-10372 (APT invoice), EAINT-10373 (BO batch invoice). Source: `[from SharePoint TS EAINT-9555, Affected Page rows 18, 20, 74–78, 81–82; New Approved Transaction rows 4, 19–20]`. [unconfirmed] that each is a QA-Issue rather than a sub-task.
