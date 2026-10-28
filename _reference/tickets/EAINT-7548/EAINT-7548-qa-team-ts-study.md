# EAINT-7548 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Study only. No knowledge/ or lib/ file was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-7548 - eInvoice.md` (cell text only, captured 28/10/2026 9:57:26 am; colours, images and Pass/Fail formatting are lost). All 11 sheets read in full.
2. **knowledge/flow-company-profile-einvoice.md** — e-Invoice flow, already cites this TS as `[ts: EAINT-7548]`.
3. **knowledge/business-rules-from-test-scenarios.md** — §8 item 6 (template fields) and the price table cite this TS as SharePoint TS #056.
4. **knowledge/cr-test-scenario-catalogue.md** row 056 — catalogue entry for this workbook.
5. **knowledge/flow-ucd-to-ucd.md** line 47 — cites this workbook for the older Invoice label wording.
6. **Not found:** `_reference/tickets/EAINT-7548/` (no earlier files), `_reference/tickets/Studying/EAINT-7548/` (does not exist), `lib/ticketStudies.ts` (no EAINT-7548 entry).
7. **Not read:** the Jira ticket, the SRD and the original .xlsx (formatting, cell colours for "Removed" / "Deprioritized"). Azfar's `cr/EAINT-7548/LEDGER.md` is cited by knowledge but was not opened for this study.

## 1. Header

1. **Ticket:** EAINT-7548 — e-Invoice (umbrella ticket; knowledge lists it as "EAINT-7548 (2025-05): e-Invoice templates and listings (umbrella, To Do)" — `knowledge/flow-company-profile-einvoice.md` line 147).
2. **Portals:** **UCD portal** (web, plus mobile for some modules) and **Back Office (BO)**. LHDN MyInvois is the external receiver.
3. **Workbook:** "EAINT-7548 - eInvoice.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 30/09/2025 12:31:00 pm.
4. **Sheets (11):**
   1. QA Est - Listing Col & Filter
   2. e-Invoice Price Breakdown
   3. e-Invoice (New) Template (APT)
   4. e-Invoice (New) Template (STMS)
   5. e-Invoice (New) Template (TH)
   6. e-Invoice (New) Template (eSTM)
   7. e-Invoice (New) Template (eLKM)
   8. e-Invoice (New) Template (eVOC)
   9. e-Invoice (New) Template (DRG)
   10. e-Invoice (New) Template (BMK)
   11. e-Invoice Template (Proforma)
5. **Not a classic TS.** There are **no TS ids, no steps, no Pass/Fail column, no tester name and no test dates** in the sheet. It is a **QA estimation + field specification** workbook: 11 module rows of listing/filter/details changes, 35 price lines, and 9 e-Invoice template field lists (40–41 fields each).
6. **Estimation recorded:** "TOTAL: 12 days" (UCD + BO) and "TOTAL: 7 days" (BO Only) — sheet QA Est - Listing Col & Filter, row 19; header "QA Testing Estimation (based on 1 QA)" — row 21.
7. **Result counts:** none recorded.

## 2. What the ticket changed, as the TS shows it

1. **Listings get e-Invoice columns.** UCD: "e-Invoice Status". BO: "e-Invoice Submission Date", "LHDN Response Status", "e-Invoice Validation Date" — sheet QA Est, rows 4–6.
2. **Listings get e-Invoice filters** on UCD and BO — sheet QA Est, rows 9–11, and per module rows 22–87.
3. **Transaction Details button renamed.** "- [Invoice] --> [e-Invoice]" on UCD and "[Invoice] --> [e-INVOICE]" on BO — sheet QA Est, row 22. SSM: "- [Invoice] --> [SSM e-Invoice]" on both — row 77.
4. **Transaction Details gets an e-Invoice section** with "e-Invoice Submission Date", "LHDN Response Status", "e-Invoice Validation Date" — e.g. sheet QA Est, rows 24–27.
5. **New e-Invoice document template** replaces the old invoice: QR code, e-Invoice Type/Version, Document Code, LHDN UIN, Supplier and Buyer blocks, Classification, Tax Type/Rate/Amount, digital signature — template sheets, rows 5–45 / 12–52.
6. **8% Service Tax** shown per line on eAuto charges — sheet e-Invoice Price Breakdown, rows 2–35.

## 3. Scenarios, grouped

No TS ids exist. Items are listed by sheet row as the coverage unit.

### 3a. Listing, filter and details coverage per module (sheet QA Est - Listing Col & Filter)

| # | Module (row) | Mobile | What it checks | Estimate UCD+BO / BO only |
|---|---|---|---|---|
| 1 | **STMS** (R22–27) | "Yes" | UCD "e-Invoice Status" column + filter; BO Submission Date, LHDN Response Status, Validation Date columns and From/To filters; details e-Invoice (STMS) section | "1.5" / "1" |
| 2 | **Transfer History** (R29–33) | "No" | Same set, "TH"-prefixed labels, e.g. "TH e-Invoice Submission Date From"; details "e-Invoice (Transfer History)" | "1" / "0.5" |
| 3 | **UCD to UCD Interstate** (R35–39) | "Yes" | Same set; note "To verify in STMS Listing of accepting company (UCD)" | "TBC" / blank |
| 4 | **eSTM** (R41–45) | "Yes" | Same set; details "e-Invoice (eSTM)" | "1.5" / "1" |
| 5 | **eLKM** (R47–51) | "Yes" | "eLKM"-prefixed labels; details "e-Invoice (eLKM)" | "1.5" / "1" |
| 6 | **eVOC** (R53–57) | "Yes" | "eVOC"-prefixed labels; details "e-Invoice (eVOC)" | "1.5" / "1" |
| 7 | **APT** (R59–63) | "No" | Same set; button rename | "1" / "0.5" |
| 8 | **BMK** (R65–69) | "No" | Same set; button rename | "1" / "0.5" |
| 9 | **JomCheck** (R71–75) | "No" | Same set; button rename | "1" / "0.5" |
| 10 | **SSM** (R77–81) | "Yes" | Same set; button "[SSM e-Invoice]" | "1" / "0.5" |
| 11 | **Dereg** (R83–87) | "No" | Same set; button rename | "1" / "0.5" |

### 3b. Price lines (sheet e-Invoice Price Breakdown)

1. **STMS** car "16.2", bike "5.4" — rows 2–3.
2. **STMS + TH** car total payable "27", bike "16.200000000000003" — rows 4–7.
3. **UCD to UCD (Standard)** and **(Interstate)** car "16.2", bike "5.4" — rows 8–11.
4. **eSTM** car "37.8", bike "7.5600000000000005" — rows 12–13.
5. **eSTM + eLKM** car "40.769999999999996", bike "10.530000000000001" — rows 14–17.
6. **eSTM + eVOC** car "48.599999999999994", bike "18.36" — rows 18–21.
7. **eSTM + eLKM + eVOC** car "51.56999999999999", bike "21.330000000000002" — rows 22–27.
8. **APT** car "16.2", bike "5.4" — rows 28–29.
9. **BMK** "30.8" (JPJ "Bayaran Butiran Maklumat Kenderaan" 20, tax 0 + eAuto 10 + 0.8) — rows 30–31.
10. **JomCheck** "19.44" — row 32.
11. **SSM** "18.64" (SSM Document 15.4, tax 0 + eAuto 3 + 0.24) — rows 33–34.
12. **Dereg** "37.8" — row 35.

### 3c. e-Invoice templates (one per sheet)

| # | Sheet | Payment Reference No. format | Description (row 31 field) | Unit price |
|---|---|---|---|---|
| 1 | APT | "{yymmdd}{0017}{0001}-{vehicle_no}" | "Automatic Permanent Transfer (“APT”) ⏎ online service" | "15.00" |
| 2 | STMS | "{yymmdd}{0017}{000001}-{vehicle_no}" | "Sistem Tukar Milik Sementara (“STMS”) service charge" | "15.00" |
| 3 | TH | "TH{yymmdd}{000001}-{vehicle_no}" | "Transfer History (“TH”) service charge" | "10.00" |
| 4 | eSTM | "{yymmdd}{0017}{0001}-{vehicle_no}" | "eSerahan Tukar Milik (“eSTM”) service charge" | "35.00" |
| 5 | eLKM | "LK{yymmdd}{000001}-{vehicle_no}" | "e-Lesen Kenderaan Motor (“eLKM”) service charge" | "2.75" |
| 6 | eVOC | "EV{yymmdd}{000001}-{vehicle_no}" | "e-Vehicle Ownership Certificate (“eVOC”) service charge" | "10.00" |
| 7 | DRG | "DRG{yymmdd}{000001}-{vehicle_no}" | "Deregistration service charge" | "35.00" |
| 8 | BMK | "BK{yymmdd}{000001}-{vehicle_no}" | "Butiran Maklumat Kenderaan (“BMK”) service charge" | "10.00" |
| 9 | Proforma | "-" | "- Dermalog Biometric Device ⏎ - Dermalog Software Installation Service ⏎ - Registration Fees ⏎ - Other Services" | "35.00" |

Expected per template: Tax Amount "8% * Amount"; Total "Amount + Tax Amount" — e.g. sheet STMS, rows 40–41.

## 4. Business rules and system behaviour the TS reveals

1. **Document Code:** "EA-IV-MMYY-{running_number}", remark "Restart running number every month" — sheet APT, row 15.
2. **Proforma Document Code differs:** "EA-IVM-MMYY-{running_number}", sample "EA-IVM-0525-0000001" — sheet Proforma, row 15.
3. **UIN:** "Randomized alphanumerical string returned by LHDN", remark "different for each transaction" — sheet STMS, row 9.
4. **e-Invoice Type / Version:** "01-Invoice" and "1.1" — sheet STMS, rows 6–7.
5. **Date format:** "{dd Mmm yyyy} {HH:MM} {am/pm}", sample "09 May 2025 04:37 pm" — sheet STMS, rows 10–11 (Submission Date and Validation Date).
6. **Currency:** "Always display 'MYR'" — sheet STMS, row 12.
7. **Original Invoice UIN:** sample "Not Applicable" — sheet STMS, row 14.
8. **Supplier block is fixed eAuto data:** TIN remark "Fixed (eAuto)" — sheet APT, row 25; MSIC "62099" — row 27; Business Activity "Other information technology service activities n.e.c." — row 31.
9. **Buyer TIN:** remark "-Follow UCD regardless type ⏎ -TIN number not filled yet case" — sheet TH, row 28.
10. **Buyer SST blank:** "Available: W10-1808-3101-4293 ⏎ Blank: n/a" — sheet STMS, row 29.
11. **Buyer contact number source:** "If PIC Contact Number has value: ⏎ - Retrieve from Backoffice > Manage Company Account > Company Details page > e-Invoice PIC Details - Contact Number ⏎ ⏎ If PIC Contact Number is BLANK: ⏎ - Retrieve from Backoffice > Manage Company Account > Company Details page > Company Details - Contact Number" — sheets STMS, TH and BMK, row 30.
12. **Buyer email source:** "If PIC Email has value: ⏎ - Retrieve from Backoffice > Manage Company Account > Company Details page > e-Invoice PIC Details - Email ⏎ ⏎ If PIC Email is BLANK: ⏎ - Retrieve from Backoffice > Manage Company Account > Company Details page > Director - Email Address" — sheets STMS, TH and BMK, row 31.
13. **Vehicle number:** "Have space between alphabet & numbers", sample "PLU 811" — sheet STMS, row 32. The Payment Reference No. sample has no space: "19010200170165-PLU811" — row 13.
14. **Proforma buyer BRN:** "Note: Show UCD Company New BRN No. If no New BRN No, then show Old BRN No." — sheet Proforma, row 34. Proforma has **no Vehicle No.** row.
15. **Classification:** "008" on module templates (e.g. sheet STMS, row 34); "022" on Proforma — sheet Proforma, row 40.
16. **Tax:** "Service Tax", "8%" — sheet STMS, rows 42–43. Government/third-party lines carry **0 tax**: BMK "Bayaran Butiran Maklumat Kenderaan | 20 | 0" — sheet Price Breakdown, row 30; "SSM Document | 15.4 | 0" — row 33.
17. **Bundles list one line per item** with one combined total, e.g. "eSTM + eLKM | Car | eAuto Sdn Bhd Processing Fee - eLKM | 2.75 | 0.22 | 37.75 | 3.02 | 2.97 | 40.769999999999996" — sheet Price Breakdown, row 15.
18. **Signature:** old text "This is a computer generated printout and no signature is required." replaced by "Digital Signature", remark "Only on backend, frontend no display" — sheet STMS, row 45.
19. **QR code:** "e-INVOICE | QR Code", remark "Will retrieve information" — sheet STMS, row 5.
20. **BMK quantity:** "Default '1'" — sheet BMK, row 36.
21. **UCD vs BO listing difference:** UCD listing gets only "e-Invoice Status"; BO gets three date/status columns — sheet QA Est, rows 4–6.
22. **Mobile scope:** "Yes" for STMS, UCD to UCD Interstate, eSTM, eLKM, eVOC, SSM; "No" for Transfer History, APT, BMK, JomCheck, Dereg — sheet QA Est, column B, rows 22–83.

### Where this TS differs from knowledge/

1. **Payment Reference No. prefixes.** Knowledge states one format: "Payment Reference No format {yymmdd}{0017}{000001}-{vehicle}" — `flow-company-profile-einvoice.md` line 128. This TS gives **per-module prefixes**: TH, LK, EV, DRG, BK (see §3c).
2. **Buyer contact source is answered here.** Knowledge open question: "Buyer contact number source is marked “details source?” in the EAINT-7548 template" — line 162. The STMS, TH and BMK sheets (row 30) give the full source rule (§4 item 11). Only the APT, eSTM, eLKM, eVOC, DRG and Proforma sheets still say "details source?".
3. **Insurance Cancellation.** Knowledge line 111 lists "Insurance Cancellation" among modules with e-Invoices, tagged `[ts: EAINT-7548]`. This workbook has **no Insurance Cancellation row or sheet**. That module comes from another source [unconfirmed].
4. **Classification 022.** Knowledge line 130 says "Classification code 022 is used for SSM and JomCheck lines." This workbook has no SSM or JomCheck template; 022 appears here only on **Proforma**.
5. **Proforma Document Code** "EA-IVM-" is not in knowledge, which states only "EA-IV-MMYY-xxxxxxx" (line 127).
6. **SSM price** RM18.64 here is already flagged as superseded by RM19.44 (EAINT-10691) — `business-rules-from-test-scenarios.md` line 1042. No new conflict.

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated in the sheet.
2. **Credentials:** none present.
3. **Sample buyer:** "Edaran Tan Chong Motor (Utara) Sdn Bhd", BRN "200401015239", address "62-68 Jalan Ipoh 51200 Kuala Lumpur." — sheet STMS, rows 26–27, 33.
4. **Sample vehicle:** "PLU 811" — sheet STMS, row 32.
5. **Sample supplier (eAuto):** BRN "200401038456", TIN "C 21450560100", SST "W10-1808-3101-4293", email "support@eauto.my" — sheet STMS, rows 17–22.
6. **Data prerequisite** [unconfirmed]: buyer contact/email checks need a company with and without **e-Invoice PIC Details** filled in BO (derived from §4 items 11–12).

## 6. Gaps or risks a regression should still cover

1. **No templates for JomCheck, SSM or UCD to UCD**, though all three are in the estimation sheet (rows 35, 71, 77). Their e-Invoice layout is untested by this workbook.
2. **No standalone eLKM or eVOC price line** — price sheet only shows them bundled with eSTM, while the templates show them alone (eLKM "2.75", eVOC "10.00").
3. **Payment Reference No. digit count is inconsistent.** STMS spec "{000001}" (6 digits) vs APT/eSTM "{0001}" (4 digits); the shared sample "19010200170165-PLU811" has a 4-digit run. Check the real value.
4. **Filter labels do not match between header and module rows.** Header: "e-Invoice Validation Status" (row 11) and UCD filter "LHDN Response Status" (row 9); module rows: "e-Invoice Validation Date From/To" and UCD filter "e-Invoice Status" (row 22). Check what is live.
5. **Open item:** "[Transfer History Receipt] --> ??" — sheet QA Est, row 23. TH receipt button name was never settled in this workbook.
6. **UCD to UCD Interstate estimate "TBC"** and "To verify in STMS Listing of accepting company (UCD)" — row 35–36. Verify the accepting company sees the e-Invoice data.
7. **Description wording differs** between sheets: template "Sistem Tukar Milik Sementara (“STMS”) service charge" (sheet STMS, row 35) vs price sheet "eAuto.my service charge (Tukar Milik Sementara)" (row 2). Check which text prints.
8. **Supplier data differs between sheets:** eSTM name "EAUTO SDN BHD" and TIN "C21450560100" (no space) — sheet eSTM, rows 23, 25; eSTM and BMK address drops "No. 86" — sheet eSTM row 30, BMK row 23; DRG supplier contact is a 1700 hotline number instead of "03-2779 8899" — sheet DRG, row 28. Check the printed supplier block per module.
9. **Field label differs:** "Original Invoice Reference No." (APT row 21), "Original Invoice UIN" (STMS row 14), "Original e-Invoice UIN" (BMK row 14).
10. **Broken cells:** BMK QR sample "{"error":"#VALUE!"}" — sheet BMK, row 5; eVOC legend note "Pending from BA" — sheet eVOC, row 5. Spec was not final when saved.
11. **Rounding:** price sheet totals carry float noise (e.g. "40.769999999999996"). Confirm screens and PDFs round to 2 decimals (RM40.77).
12. **Cell colours lost.** The legend "Removed" / "Deprioritized" (sheet QA Est, rows 14–15) marks some items, but the text copy cannot show which. Open the .xlsx to see which columns/filters were dropped.
13. **Mobile app** checks for the six "Yes" modules are not broken out anywhere.

## Knowledge candidates

1. **Payment Reference No. prefixes per module** — TH "TH{yymmdd}{000001}-{vehicle_no}", eLKM "LK…", eVOC "EV…", Dereg "DRG…", BMK "BK…"; STMS/APT/eSTM "{yymmdd}{0017}{…}"; Proforma "-". Source: EAINT-7548 workbook, template sheets TH/eLKM/eVOC/DRG/BMK/Proforma, row 13 or 20. Target: `knowledge/flow-company-profile-einvoice.md` line 128.
2. **Buyer contact and email source rule** (§4 items 11–12, verbatim). Source: sheets STMS, TH, BMK, rows 30–31. Target: close the open question at `flow-company-profile-einvoice.md` line 162.
3. **Proforma Document Code "EA-IVM-MMYY-{running_number}"**, classification "022", BRN rule "Show UCD Company New BRN No. If no New BRN No, then show Old BRN No." Source: sheet Proforma, rows 15, 34, 40.
4. **Classification "008"** for module service charges. Source: e.g. sheet STMS, row 34.
5. **Digital signature backend only:** "Only on backend, frontend no display". Source: sheet STMS, row 45.
6. **UCD listing gets only "e-Invoice Status"; BO gets Submission Date, LHDN Response Status, Validation Date.** Source: sheet QA Est, rows 4–6.
7. **Correction:** `flow-company-profile-einvoice.md` line 111 tags "Insurance Cancellation" as `[ts: EAINT-7548]`, but this workbook has no Insurance Cancellation row. Re-source or retag that item.
8. **Zero-tax lines:** JPJ BMK fee (20) and SSM Document (15.4) carry tax 0; only eAuto charges carry 8%. Source: sheet e-Invoice Price Breakdown, rows 30, 33.
