# EAINT-11057 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11057-🔴[eAuto-UCD] STMS - Display Usage Code AH on Step 4 & Transaction Details Page.md` (export dated "27/10/2026, 8:52:18 pm"). Cell text only. Formatting, colours, comments and images are not in the copy.
2. **Ticket folders:** `_reference/tickets/EAINT-11057/` and `_reference/tickets/Studying/EAINT-11057/` held no files before this study.
3. **lib/ticketStudies.ts:** no entry for EAINT-11057.
4. **knowledge/:** `flow-stms.md`, `flow-ucd-to-ucd.md`, `business-rules-from-test-scenarios.md` §2, `cr-test-scenario-catalogue.md` row 011, `esim.md` (eSTM Enquiry fields), `flow-payments-fees.md`, `flow-platform.md`.
5. **Not read:** Jira ticket, SRD, Teams. This run had no access to them.

## 1. Header

1. **Ticket:** EAINT-11057.
2. **Module / portal:** UCD Portal — **STMS** and **UCD to UCD** (Standard and Interstate, Single and Bulk).
3. **Workbook:** "EAINT-11057-🔴[eAuto-UCD] STMS - Display Usage Code AH on Step 4 & Transaction Details Page.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 18/06/2026, 4:11:41 pm.
4. **Sheets:** 2 — "STMS" and "UCD to UCD".
5. **Sheet titles** (wider than the file name — they add Step 6):
   1. STMS R3: "🔴[eAuto-UCD] STMS - Display Usage Code "AH" on Step 4, Step 6 & Transaction Details Page"
   2. UCD to UCD R2: "🔴[eAuto-UCD] STMS UCD-to-UCD Standard - Display Usage Code "AH" on Step 4, Step 6 & Transaction Details Page"
6. **Scenarios:**
   1. STMS: **6** scenario ids (11057_STMS_TS1–TS6), **12** rows (one row per page checked).
   2. UCD to UCD: **20** scenario ids (11057_UCD_TS1–TS16, TS17.1–TS17.4), **46** rows.
   3. Total: **26** ids, **58** rows.
7. **Results** (Test Result column):
   1. STMS: **10 Pass**, **0 Fail**, **2 rows with no result** (R8, R11 — the column holds a note instead).
   2. UCD to UCD: **42 Pass**, **0 Fail**, **4 rows with no result** (R7, R10, R23, R26 — same note).
   3. Total: **52 Pass, 0 Fail, 6 blank**. All 6 blanks are the **Step 4 / Step 2 row of a "2nd JPJ enquiry" scenario**; the later rows of the same scenario are Pass.
8. **Testers** (QA column): "Maisarah" and "Nick". **No test dates** in the sheet.

## 2. What the ticket changed, as the TS shows it

1. A **Usage code** field now shows on the UCD transaction pages when JPJ returns usage code **"AH"** (e-hailing). Expected text everywhere: "Usage code field is visible and displays "AH"".
2. When JPJ returns no AH, single-vehicle rows expect "Usage code field is hidden".
3. **Pages covered:**
   1. STMS: Step 4, Step 6, Transaction Details.
   2. UCD to UCD Standard: Step 4, Step 6, Transaction Details (single); Step 4 and Transaction Details after payment (bulk).
   3. UCD to UCD Interstate: Step 2 (UCD A's JPJ enquiry), Step 4, Step 6, Transaction Details (UCD B).
4. AH must show **even when the JPJ enquiry fails**, as long as AH is returned (STMS TS2, UCD TS2, TS9).
5. The **2nd JPJ enquiry** (around payment) also drives the field (STMS TS4–TS6, UCD TS4–TS6, TS11–TS14).

## 3. Scenarios

### 3a. STMS sheet

1. **11057_STMS_TS1** (R5) — 1st JPJ enquiry success + AH, Step 4 — "Usage code field is visible and displays "AH"". Pass.
2. **11057_STMS_TS2** (R6) — 1st JPJ enquiry failed but AH returned, Step 4 — same expected. Pass. Remark "Individual - OK ⏎ Company with SSM - OK".
3. **11057_STMS_TS3** (R7) — no AH (vehicle not e-hailing), Step 4 — "Usage code field is hidden". Pass.
4. **11057_STMS_TS4** (R8–R10) — 1st success → payment → 2nd JPJ failed + AH. Step 4: no result (note, see §4 item 3). Step 6: Pass. Transaction Details: Pass. All expect AH visible.
5. **11057_STMS_TS5** (R11–R13) — 1st success → payment → 2nd JPJ success + AH. Step 4: no result (note). Step 6: Pass, remark "to retest - done". Details: Pass.
6. **11057_STMS_TS6** (R14–R16) — 1st success → payment → 2nd JPJ success/failed, no AH. Step 4, Step 6, Details — "Usage code field is hidden". All Pass. Remark R14 "success trx".

### 3b. UCD to UCD — Standard, Single Vehicle

1. **11057_UCD_TS1** (R4) — 1st success + AH, Step 4 — AH visible. Pass.
2. **11057_UCD_TS2** (R5) — 1st failed + AH, Step 4 — AH visible. Pass.
3. **11057_UCD_TS3** (R6) — no AH, Step 4 — hidden. Pass.
4. **11057_UCD_TS4** (R7–R9) — 2nd JPJ failed + AH. Step 4 no result (note); Step 6 and Details Pass — AH visible.
5. **11057_UCD_TS5** (R10–R12) — 2nd JPJ success + AH. Step 4 no result (note); Step 6 and Details Pass — AH visible.
6. **11057_UCD_TS6** (R13–R15) — 2nd JPJ success/failed, no AH. Step 4, Step 6, Details — hidden. All Pass.

### 3c. UCD to UCD — Standard, Bulk Vehicle

1. **11057_UCD_TS7** (R16–R19) — 4 vehicles in 1 bulk, JPJ enquiry at Step 4. All Pass.
   1. "Failed - 4F + AH" → "Usage code field is visible and displays "AH"".
   2. "Failed - != 4F + AB" → "Usage code field is visible and do not display "AH"".
   3. "Success - AH" → AH visible.
   4. "Success - AB" → "Usage code field is visible and do not display "AH"".
2. **11057_UCD_TS15** (R38–R41) — same 4 outcomes, but set **after** Step 4 enquiry and **before** Make Payment, checked on Transaction Details. Same expected per vehicle as TS7. All Pass.

### 3d. UCD to UCD — Interstate, Single Vehicle

1. **11057_UCD_TS8** (R20) — 1st success + AH, Step 2 — AH visible. Pass.
2. **11057_UCD_TS9** (R21) — 1st failed + AH, Step 2 — AH visible. Pass.
3. **11057_UCD_TS10** (R22) — no AH, Step 2 — hidden. Pass.
4. **11057_UCD_TS11** (R23–R25) — Step 2 success (UCD A) → Step 4 failed + AH (UCD B). Step 2 no result (note); Step 4 and Details Pass — AH visible.
5. **11057_UCD_TS12** (R26–R29) — Step 2 success (UCD A) → Step 4 success + AH (UCD B). Step 2 no result (note); Step 4, Step 6, Details Pass — AH visible.
6. **11057_UCD_TS13** (R30–R33) — Step 2 success → Step 4 success, no AH. Step 2, 4, 6, Details — hidden. All Pass.
7. **11057_UCD_TS14** (R34–R37) — Step 2 success → Step 4 failed, no AH. Step 2, 4, 6, Details — hidden. All Pass.

### 3e. UCD to UCD — Interstate, Bulk Vehicle

1. **11057_UCD_TS16** (R42–R45) — 4 vehicles, JPJ enquiry on Step 2. Same 4 outcomes and expected as TS7. All Pass.
2. **11057_UCD_TS17.1–17.4** (R46–R49) — bulk starts as "AB + 00", passes Step 2 (UCD A) and Step 4 (UCD B); at Step 5 the tester will "Set delay and change 4 trx", then JPJ enquiry on Step 6 and Details page. All Pass.
   1. TS17.1 "Failed - 4F + AH" → AH visible.
   2. TS17.2 → "Usage code field is hidden".
   3. TS17.3 "Success - AH" → AH visible.
   4. TS17.4 → "Usage code field is hidden".
   5. TS17.2 and TS17.4 do not name their vehicle; by order they are the two AB vehicles [unconfirmed].

## 4. Business rules and system behaviour the TS reveals

1. **AH shows on a failed enquiry.** "1st JPJ Enquiry returns failed but "AH" is still returned" → "Usage code field is visible and displays "AH"" (STMS R6; UCD to UCD R5, R21).
2. **Usage code AH is not supported downstream.** "Need to perform Step 4 JPJ Enquiry with != AH, otherwise will redirect to error page when navigate to Step 5 (Existing behavior for Usage Code not supported by eAuto)" (STMS R8, R11; UCD to UCD R7, R10). Interstate wording: "Need to perform Step 2 JPJ Enquiry with != AH, otherwise will redirect to error page when navigate to Step 5 ..." (UCD to UCD R23, R26).
   1. Meaning: a transaction that gets AH at the first enquiry cannot reach payment [unconfirmed — read from the note, not a written rule]. AH can only reach Step 6 / Details through the **2nd enquiry**.
3. **Test trick for the 2nd enquiry:** STMS R8 remark "set delay"; TS17 step "Set delay and change 4 trx consist of: ..." (UCD to UCD R46–R49). The eSim JPJ response is switched to AH after the first enquiry, using the delay to get timing right [unconfirmed]. `knowledge/esim.md` lists a "Delay Milliseconds*" field and a "Usage Code*" field on the eSim enquiry form.
4. **Standard UCD to UCD ends at Step 4 after payment.** "UCD to UCD - Single + Bulk do not reach Step 6, instead will display listing page with 'Payment request sent' popup after making payment at Step 4" (UCD to UCD R38–R41 Remark).
   1. This contradicts the same sheet: Standard **Single** TS4–TS6 have Pass rows on "Step 6" (R8, R11, R14).
   2. It also contradicts `knowledge/flow-ucd-to-ucd.md` Standard step 7, where Single reached Step 6 "Seen for Single on 25.09.2026".
5. **Bulk vs single when there is no AH.**
   1. Single, no AH: "Usage code field is hidden" (STMS R7; UCD to UCD R6).
   2. Bulk AB vehicle at Step 2/4/Details: "Usage code field is visible and do not display "AH"" (UCD to UCD R17, R19, R39, R41, R43, R45).
   3. Interstate bulk at Step 6 & Details: "Usage code field is hidden" (UCD to UCD R47, R49).
   4. So in a bulk the field may show the other code (e.g. AB) on the bulk result table [unconfirmed]. The sheet does not say what value shows.
6. **Interstate pages:** AH is checked on **Step 2** for UCD A (where the first JPJ enquiry runs) and on Step 4 / Step 6 / Details for UCD B: "1. UCD A login to UCD portal" ... "8. UCDB login to UCD portal ⏎ 9. Proceed until Step 4" (UCD to UCD R26–R27).
7. **Seller categories run for STMS:** "Individual - OK ⏎ Company with SSM - OK" (STMS R6 Remark). Only TS2 records this.
8. **Codes used in the sheet:** "4F" (failed response), "AB" (non-AH usage code), "00" (UCD to UCD R38 "set with AB & 00 first"). "4F" and "00" look like JPJ condition/response codes [unconfirmed].

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet.
2. **Credentials:** none in the sheet.
3. **Accounts:** a UCD portal login for STMS and Standard; **two UCD companies** (UCD A seller, UCD B buyer) for Interstate (UCD to UCD R26–R27, R46).
4. **Vehicles:** described only as "vehicle registered as e-hailing" or "vehicle NOT registered as e-hailing". No vehicle numbers.
5. **JPJ responses:** driven by the JPJ simulator, switched between enquiries with a delay (see §4 item 3) [unconfirmed — the sheet says "set delay", not "eSim"].
6. **Bulk:** 4 vehicles per bulk, one per outcome (Failed-4F+AH, Failed-not-4F+AB, Success-AH, Success-AB).

## 6. Gaps or risks a regression should still cover

1. **Six Step 4 / Step 2 rows have no result** (STMS R8, R11; UCD to UCD R7, R10, R23, R26). The case "AH shown at the page where the 2nd-enquiry flow starts" was never marked Pass.
2. **Step-text errors to watch when reusing the TS:**
   1. TS13 (R30) is "no AH" but step 6 says "2nd JPJ Enquiry returns success with "AH"".
   2. TS13/TS14 steps say "vehicle registered as e-hailing" for a no-AH case (R30, R34).
   3. TS11 (R23) step 7 "Proceed until Step 2" comes after payment — copied from STMS order.
   4. TS14 Details row is step "9" after step "10" (R36–R37); TS17 repeats step numbers 8 and 9 (R46–R49).
3. **Standard end point is unclear:** R38–R41 say Standard Single + Bulk never reach Step 6, while R8/R11/R14 Pass on Step 6. Re-walk Standard Single and Bulk.
4. **Bulk "visible, no AH" vs single "hidden"** is never explained. Check what the field shows for AB in a bulk table and on each vehicle's Details.
5. **Standard bulk Step 6** is not tested (only Step 4 and Details after payment).
6. **Interstate single Step 6** is missing for TS11 (R23–R25 go Step 2 → Step 4 → Details).
7. **Seller categories:** only STMS TS2 records Individual and Company. MyPR not mentioned.
8. **Not covered:** BO STMS Transaction view, listing pages, CSV export, Slip Pengesahan / invoice, mobile app. Mobile twin EAINT-12560 (usage code AH) is To Do per `knowledge/flow-platform.md`.
9. **Pricing for AH** (rate-card row) is not tested here. AH reaching Step 5 redirects to an error page (§4 item 2), so payment for AH vehicles is not possible at the first enquiry [unconfirmed].

## Knowledge candidates

1. **flow-stms.md line 47 and line 117 — add Step 6.** Knowledge says AH shows "on Step 4 and Transaction Details". The TS title and rows add Step 6: "Display Usage Code "AH" on Step 4, Step 6 & Transaction Details Page" (STMS R3), Step 6 rows Pass (STMS R9, R12). This supports the existing "Conflict" note at line 118. [from SharePoint TS EAINT-11057, sheet STMS, rows 3, 9, 12]
2. **flow-stms.md Step 4 / Step 5 — AH at 1st enquiry blocks payment.** "Need to perform Step 4 JPJ Enquiry with != AH, otherwise will redirect to error page when navigate to Step 5 (Existing behavior for Usage Code not supported by eAuto)" [from SharePoint TS EAINT-11057, sheet STMS, rows 8, 11]. Applies to UCD to UCD too (sheet UCD to UCD rows 7, 10, 23, 26).
3. **flow-ucd-to-ucd.md line 30 — wrong citation.** It puts AH on **Standard Step 2** and cites 11057_UCD_TS1. TS1 is Standard **Step 4** ("Proceed until Step 4", UCD to UCD R4). Step 2 is **Interstate** only (TS8–TS10, R20–R22). [from SharePoint TS EAINT-11057, sheet UCD to UCD, rows 4, 20]
4. **flow-ucd-to-ucd.md line 67 — page list.** Standard: Step 4, Step 6, Details. Interstate: Step 2 (UCD A), Step 4, Step 6, Details (UCD B). [from SharePoint TS EAINT-11057, sheet UCD to UCD, rows 4, 8–9, 20, 26–29]
5. **flow-ucd-to-ucd.md Open question line 91 — source quote.** "UCD to UCD - Single + Bulk do not reach Step 6, instead will display listing page with 'Payment request sent' popup after making payment at Step 4" [from SharePoint TS EAINT-11057, sheet UCD to UCD, rows 38–41, Remark]. Same sheet has Standard Single Step 6 Pass (rows 8, 11, 14), so the question stays open.
6. **flow-ucd-to-ucd.md Bulk Rules line 188 — expected per vehicle.** AB vehicles in a bulk: "Usage code field is visible and do not display "AH"" at Step 2/4/Details (rows 17, 19, 39, 41, 43, 45), but "Usage code field is hidden" at Interstate Step 6 & Details (rows 47, 49). [from SharePoint TS EAINT-11057, sheet UCD to UCD]
7. **esim.md "Values seen in the wild" — Usage Code list lacks AH.** The TS sets AH, 4F and 00 through the JPJ response with "set delay" (STMS R8 Remark; UCD to UCD R46). Verify on the eSim form whether AH is a valid Usage Code entry before adding it. [unconfirmed]
8. **automation hint (for any 11057-style automation):** reaching AH on Step 6 / Details needs the eSim response switched between the 1st and 2nd JPJ enquiry, with a delay. [from SharePoint TS EAINT-11057, sheet STMS row 8 Remark "set delay"; sheet UCD to UCD rows 46–49 step 9] [unconfirmed mechanism]
