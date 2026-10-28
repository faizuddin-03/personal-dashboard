# EAINT-10044 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-10044 - X-STAR Chubb Broaden Underwriting Guidelines.md` (cell text only; colours, images and cell notes are not kept). All three sheets read in full.
2. **Ticket folders:** `_reference/tickets/EAINT-10044/` and `_reference/tickets/Studying/EAINT-10044/` — **neither existed** before this study. No SRD, no Jira export, no notes.
3. **`lib/ticketStudies.ts`:** no entry for EAINT-10044.
4. **knowledge/:** `eauto-insurance.md` (Sum-insured price range), `business-rules-from-test-scenarios.md` §6.2, `flow-insurance-purchase.md` (cross-page verification), `production-regression-scope.md` §8b and deployment table, `cr-test-scenario-catalogue.md` (row 004).
5. **Miro planning board copy:** `_reference/miro/miro-eauto-qa-resource-planning-full-2026-10-26-part2.md`, line 247.
6. **Not read:** Jira ticket, SRD, Teams. Not available to an unattended run.

## 1. Header

1. **Ticket:** EAINT-10044 — sheet title R1: "X-STAR Chubb Broaden Underwriting Guidelines to Support Bintang Prospek’s".
2. **Module / portal:** eAuto insurance (Chubb quotation, Insurance Step 1 Sum Insured dropdown), reached from **UCD eSTM** (after approval or on the VEL000069E path) and **Get A Free Quote**. Results checked across UCD, BO, CIBO, Service Portal, receipts and downloadables.
3. **Workbook:** "EAINT-10044 - X-STAR Chubb Broaden Underwriting Guidelines.xlsx", library "eAuto - CR Test Scenarios", modified 29/07/2026, 7:39:16 pm.
4. **Sheets (3):** "New Transactions" (R2: "New Transactions (After Deployment)"), "Existing Transactions", "Regression Testing".
5. **Scenarios: 36** — New Transactions 19 (`10044_INS_TS01`–`TS19`), Existing Transactions 6 (`10044_EXT_TS01`–`TS06`), Regression Testing 11 (`10044_REG_TS01`–`TS11`).
6. **Results (per scenario, all rows of a scenario agree):**
   1. New Transactions: **12 PASS**, **7 blank** (TS04, TS05, TS08, TS09, TS10, TS18, TS19).
   2. Existing Transactions: **6 PASS**.
   3. Regression Testing: **7 PASS**, **4 blank** (REG_TS02, REG_TS05, REG_TS08, REG_TS11).
   4. Total: **25 PASS, 0 FAIL, 11 no result.**
7. **Testers (QA column):** two QA engineers — Teck Yung and Azfar. TS04, TS08, TS09, TS18 have **no tester and no result**.
8. **Dates:** none written in the sheet. Miro planning card (line 247): "To deploy on: 11th Mar (postponed) 31st Mar Test Env: staging/uat3 BA: Aishah QA: Teck Yung, Azfar Test Env Point to: Insurance API (to verify the Sum Insured amt)". Production checklist date "20260401" (`knowledge/production-regression-scope.md` table row EAINT-10044).

## 2. What the ticket changed (as the TS shows it)

1. **Chubb Sum Insured range now depends on the hire purchase (HP) tag and vehicle age.**
   1. **No HP or non-X-Star HP, vehicle ≤10 years:** range **90%–140%** of recommended.
   2. **Active X-Star HP, vehicle ≤15 years:** range **90%–170%** of recommended.
   3. **Over the age limit:** dropdown becomes an uneditable text field.
2. **RM10,000 floor** — Chubb quote hidden below RM10,000; no options below RM10,000.
3. **RM80,000 cap** on Get A Free Quote for HP-tagged vehicles (see §4 item 6 — the TS is not consistent).
4. **Other insurers (Lonpac, Takaful, Tokio Marine) must not change** — Regression Testing sheet.

## 3. Scenarios

### 3.1 New Transactions — no HP record (Chubb)

1. **TS01** (R5–R13, MyKad, ≤10 yrs) — upward <40%, postcode change and back, Step 2 → Back, then full purchase. Range: "The lowest price in the pricing range should NOT be lower than 90% of the recommended price" / "should NOT be higher than 140% of the recommended price" (R6). **PASS.**
2. **TS02** (R14–R17, MyPR, ≤10 yrs) — deduction <10%, full purchase. **PASS.**
3. **TS03** (R18, Get A Free Quote) — "The maximum sum insured option within the list is NOT capped at RM80,000." **PASS.**
4. **TS04** (R19, Get A Free Quote) — RM10,000 floor. **No tester, no result.**
5. **TS05** (R20, >10 yrs <2500CC) — "The Sum Insured dropdown becomes an uneditable textfield." Tester Azfar, **no result.**

### 3.2 New Transactions — non-X-Star HP (Chubb)

1. **TS06** (R21–R24, Carsome Capital HP, MyPR) — upward exactly 40% ("Allowed selection: = RM140,000"), full purchase. **PASS.**
2. **TS07** (R25–R28, Aeon Credit HP, MyPR) — deduction exactly 10% ("= RM90000"), full purchase. **PASS.**
3. **TS08** (R29, Get A Free Quote) — "The maximum sum insured option within the list is capped at RM80,000." **No tester, no result.**
4. **TS09** (R30) — RM10,000 floor. **No tester, no result.**
5. **TS10** (R31, >10 yrs) — uneditable text field. Tester Azfar, **no result.**

### 3.3 New Transactions — X-Star HP (Chubb)

1. **TS11** (R32–R41, MyKad, ≤15 yrs) — upward <70%, postcode, Step 2 → Back, full purchase; range "should NOT be higher than 170% of the recommended price" (R33). Step 18 (R41): "Submit the same vehicle number through Get a Free Quote" → "UCD cannot get Insurance Quotation". **PASS.**
2. **TS12** (R42–R45, MyPR) — X-Star HP created **after thumbprint at Step 1, before Step 2**; VEL000069E via Resubmit; <70% upward; insurance then eSTM to Approved. **PASS.**
3. **TS13** (R46–R49, MyKad) — X-Star HP created **at Step 4 after 1st JPJ Enquiry**; VEL000069E via [Make Payment]; exactly 70% ("= RM170,000"). **PASS.**
4. **TS14** (R50–R53, MyPR) — X-Star HP created **at Step 5**; VEL000069E on Step 5 payment; exactly 70%. **PASS.**
5. **TS15** (R54–R57, MyPR) — X-Star HP created then set **Inactive**; range falls back to **140%** (R55). **PASS.**
6. **TS16** (R58–R61, MyPR) — X-Star HP patched by dev to **Expired**; range **140%** (R59). **PASS.**
7. **TS17** (R62, Get A Free Quote, X-Star HP) — "The maximum sum insured option within the list is capped at RM80,000." **PASS** (remark: "Tested together with 10044_INS_TS11 ⏎ Test data used = QLF6338").
8. **TS18** (R63) — RM10,000 floor: "< RM10,000, the Chubb Quotation SHOULD NOT be displayed in Step 1." **No tester, no result.**
9. **TS19** (R64, >15 yrs) — uneditable text field. Tester Azfar, **no result.**

### 3.4 Existing Transactions (Chubb, before vs after deployment)

1. **EXT_TS01** (R5–R6, X-Star HP, ≤15 yrs) — before **170%**, after **170%**. **PASS.**
2. **EXT_TS02** (R7–R8, Carsome HP, ≤10 yrs) — before **170%**, after **140%**. **PASS.**
3. **EXT_TS03** (R9–R10, no HP, Company, ≤10 yrs) — before **170%**, after **140%**. **PASS.**
4. **EXT_TS04** (R11–R12, X-Star HP, >15 yrs) — before and after: "The Sum Insured dropdown becomes an uneditable textfield." **PASS.** Step 1 of "Before Deployment" is empty in the sheet.
5. **EXT_TS05** (R13–R14, non-X-Star HP, >10 yrs) — uneditable before and after. **PASS.**
6. **EXT_TS06** (R15–R16, no HP, Company, >10 yrs) — uneditable before and after. **PASS.**

### 3.5 Regression Testing (other insurers)

1. **REG_TS01** (R5–R13, **Lonpac**, no HP) — "The lowest price and highest price in the pricing range should be tallied with the min and max price returned by Lonpac API." (R6). **PASS.**
2. **REG_TS02** (R14, Lonpac, >10 yrs) — uneditable text field. **No result.**
3. **REG_TS03** (R15–R23, **Takaful (Comprehensive)**, Company) — "The highest price in the pricing range should NOT be higher than 110% of the recommended price." (R16). **PASS.**
4. **REG_TS04** (R24, Takaful) — "NOT capped at RM80,000." **PASS.**
5. **REG_TS05** (R25, Takaful, >10 yrs) — uneditable. **No result.**
6. **REG_TS06** (R26–R34, **Tokio Marine**, Carsome HP) — 110% ceiling. **PASS.**
7. **REG_TS07** (R35, Tokio Marine, Get a Free Quote) — "NOT capped at RM80,000." **PASS.**
8. **REG_TS08** (R36, Tokio Marine, >10 yrs) — uneditable. **No result.**
9. **REG_TS09** (R37–R45, **Takaful**, X-Star HP, ≤15 yrs) — 110% ceiling. **PASS.**
10. **REG_TS10** (R46, Takaful, X-Star HP) — "NOT capped at RM80,000." **PASS.**
11. **REG_TS11** (R47, Takaful, X-Star HP, >15 yrs) — uneditable. **No result.**

## 4. Business rules and system behaviour

1. **Chubb range formula** — "Minimum Allowed Price = Recommended Price × 0.90 ⏎ - Maximum Allowed Price = Recommended Price x 1.40" (New Transactions R6); X-Star: "Maximum Allowed Price = Recommended Price x 1.70" (New Transactions R33).
2. **Only active X-Star HP gets 170%.** Inactive (R54 step 5 "Update Hire Purchase Record Status to Inactive") and Expired (R58 step 5 "Request dev to patch Hire Purchase Record Status to Expired") both expect the 140% ceiling (R55, R59).
3. **X-Star tag can be picked up late.** TS13 and TS14 create the X-Star HP after Step 2 ("Click [Next] to proceed to Step 2 without any Hire Purchase Record", R46, R50) and still expect 170% (R47, R51). [unconfirmed] The HP check appears to run when the insurance quote is fetched, not at eSTM Step 2.
4. **HP status after eSTM completes** — "Tx Status = Approved (Tagged to XStar, Hire Purchase Record Status = Complete)" (New Transactions R45, step 18). HP must stay Active through insurance: "Ensure Hire Purchase Record Status remains Active" (R42 step 5, R45 step 16).
5. **VEL000069E path into insurance, then back to eSTM** — "Proceed to purchase insurance, Payment = OK, Status = Insurance Created ⏎ … After insurance is completed, system redirects to eSTM Step 5 ⏎ … Click [Next] to proceed with payment, JPJ Enquiry = Success (GLB000000I)" (New Transactions R45, steps 14–17).
6. **RM80,000 cap on Get A Free Quote — sheet is inconsistent:**
   1. No HP: "NOT capped at RM80,000" (R18) — PASS.
   2. Non-X-Star HP: "capped at RM80,000" (R29) — never run.
   3. X-Star HP: "capped at RM80,000" (R62) — PASS.
   4. Remark on all cap rows: "Can be tested together with the scenarios above, if the recommended sum insured is > RM48000, if not will need developer to make changes to the eSIM" (R18, R29, R62).
7. **RM10,000 floor** — "< RM10,000, the Chubb Quotation SHOULD NOT be displayed. ⏎ - = RM10,000, other options less than RM10,000 SHOULD NOT be displayed. ⏎ - > RM10,000, other options less than RM10,000 SHOULD NOT be displayed." (New Transactions R19). **Never executed** (TS04, TS09, TS18 blank).
8. **Age limits** — "NOTE : For vehicles with non–X Star HP, no quotation will be displayed if the vehicle is over 10 years old." (New Transactions R20, R31, R64). The expected result in the same rows says "The Sum Insured dropdown becomes an uneditable textfield." — the note and the expected result disagree.
9. **Range is fixed after selection** — "Maximum upward adjustment and deduction price range in the dropdown remain unchanged." (New Transactions R7).
10. **Postcode drives the price** — "System refreshes quotation. ⏎ 2. Recommended price and price range update based on postcode." (New Transactions R8); changing back restores it: "Recommended price and price range are displayed the same before postcode change." (R10).
11. **Step 2 → Back keeps the choice** — "Previously selected Sum Insured remains the same." (New Transactions R12).
12. **Bought vehicle cannot re-quote** — "UCD cannot get Insurance Quotation" (New Transactions R41). Remark: "This TS will be put as P2 priority … Still Pending confirmation from dev" — marked PASS anyway.
13. **Staging difference** — "Based on dev, Chubb side allowed a maximum of 70% for all staging branches under eAuto, but only in staging/uat3 has control between max 40% for non xstar vehicles and 70% for xstar vehicles." (Existing Transactions R5, Remarks). Before deployment every case showed 170% (R5, R7, R9).
14. **Takaful / Tokio Marine cannot go down** — "For Takaful (TPFT) the sum insured cannot be deducted as the recommended price = Minimum Price returned from Takaful API" (Regression R16); "For Tokio Marine, the sum insured cannot be deducted as the recommended price = Minimum Price returned from Tokio Marine API" (Regression R27).
15. **Takaful open point** — "The pricing can be upward adjusted to 50%, need to confirm with dev again if this is expected. (Test data = VFJ757)" (Regression R16). Expected was 110%; marked PASS.
16. **BO vs CIBO payment time** — "Payment time is not tallied between BO and CIBO (Checked with dev)" (New Transactions R17, Remarks).
17. **Cross-surface check list** (New Transactions R13): "Insurance Quotation Page Step 4 ⏎ - UCD Insurance Trx Listing ⏎ - BO Insurance Trx Listing > Export CSV ⏎ - CIBO Insurance Trx Listing ⏎ - eAuto Service Portal > Insurance Tab ⏎ - UCD eSTM Transaction Details Page ⏎ - UCD Insurance Details Page ⏎ - BO Insurance Details Page ⏎ - CIBO Insurance Details Page ⏎ - Insurance Receipt ⏎ - Insurance Downloadables (e.g. E-certificates, Policies)". Later rows swap "Insurance Receipt" for "Insurance Invoice" (R17).
18. **API proof needed** — "Ask dev for the screenshot of the log for the pricing details returned from Chubb API." (New Transactions R6).

## 5. Test data, environments, setup

1. **Environment:** staging/uat3 — EXT titles "(/uat3)"; EXT_TS04–06 "before deployment (/eauto) and after deployment (/uat3)" (Existing Transactions R11, R13, R15). Miro: "Test Env: staging/uat3".
2. **Vehicles:** VFQ7525 (TS01), VFR833 (TS02, TS03), VFG9594 (TS11), VFG9121 (TS12), QLF6338 (TS17), VFC7985 (EXT_TS01), VFE9613 (EXT_TS02), VFG9420 (EXT_TS03), VFJ757 and VFL3718 (REG_TS03), VFJ6008 (REG_TS06). EXT_TS04–06 "Test data =" left empty.
3. **HP credit companies:** "X STAR TECHNOLOGY MALAYSIA SDN BHD" (R32), "Carsome CAPITAL Sdn Bhd" (R21), "Aeon Credit" (R25).
4. **ID types:** MyKad, MyPR, Company.
5. **eSIM codes:** "VEL000069E" (JPJ Enquiry failed), "GLB000000I" (success).
6. **Postcode:** "Kuching, Sarawak > 93250".
7. **Dev help needed:** HP status patch to Expired (R58); eSIM change when recommended sum insured ≤ RM48,000 (R18).
8. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **RM10,000 floor never tested** — TS04, TS09, TS18 have no tester and no result.
2. **Non-X-Star RM80,000 cap never tested** — TS08 blank. The cap rule itself is unclear (§4 item 6).
3. **Age-limit cases on New Transactions not recorded** — TS05, TS10, TS19 blank. Note says "no quotation", expected says "uneditable textfield".
4. **Open dev confirmations marked PASS** — TS11 step 18 ("Still Pending confirmation from dev", R41) and Takaful 50% upward (Regression R16).
5. **"> 2500CC" in titles not tested** — TS07 and TS16 titles say "(For vehicles > 2500CC)" but no step or data covers engine size. No case covers ≥2500CC for the <2500CC rows either.
6. **Copy-paste wording in Regression sheet** — Lonpac/Takaful/Tokio rows still say "Chubb quotation is displayed" and "On the Chubb Quotation". REG_TS03 insurer "Takaful (Comprehensive)" but step says "Takaful (TPFT)"; REG_TS09 the reverse. A rerun should name the right insurer.
7. **Environment-specific behaviour** — the 40%/70% split only exists on uat3 per dev (Existing R5). Other staging branches show 70% for all; results there are not comparable.
8. **Production** — checklist only allows "Proceed until step 2 and verify sum insured and final total price." (`knowledge/production-regression-scope.md`, Deployment Checklist 20260401 R42).

## 7. Contradictions with knowledge/

1. **"Chubb before EAINT-10044: ceiling 110%"** in `knowledge/eauto-insurance.md` (Sum-insured price range item 3) and `knowledge/business-rules-from-test-scenarios.md` §6.2 item 3 cite "sheet Regression Testing, row 16". That row is **Takaful**, not Chubb (R15 insurer "Takaful (Comprehensive)", R16 step "Under Takaful (TPFT) Quotation"). The Chubb before-deployment ceiling in this TS is **170%** (Existing Transactions R5, R7, R9), with the uat3 caveat in §4 item 13.
2. **"RM80,000 cap … applies to non-X-Star HP vehicles; not capped otherwise"** (same two files) — New Transactions row 62 (TS17, X-Star HP) expects "capped at RM80,000" and is PASS. The cap appears to apply to **any HP-tagged vehicle** [unconfirmed]; no-HP is not capped (R18).
3. **"Over the age limit: uneditable textfield"** — knowledge omits the conflicting note "no quotation will be displayed if the vehicle is over 10 years old" (R20, R31).

## Knowledge candidates

1. **Correct the 110% claim** in `knowledge/eauto-insurance.md` and `knowledge/business-rules-from-test-scenarios.md` §6.2: 110% is **Takaful / Tokio Marine** ("NOT be higher than 110%", Regression Testing R16, R27), not Chubb. Source: SharePoint TS #004 EAINT-10044, Regression Testing R15–R16, R26–R27; Existing Transactions R5.
2. **Correct the RM80,000 cap rule** — X-Star HP is capped (New Transactions R62, PASS), no HP is not (R18, PASS), non-X-Star HP expected capped but untested (R29). Source: SharePoint TS #004 EAINT-10044.
3. **Inactive or Expired X-Star HP loses the 170% ceiling** (falls to 140%). Source: New Transactions R54–R55, R58–R59.
4. **X-Star HP created after eSTM Step 2 (at Step 4 or Step 5) still gets 170%.** Source: New Transactions R46–R47, R50–R51. Fits `knowledge/flow-insurance-purchase.md`.
5. **uat3-only control** — "only in staging/uat3 has control between max 40% for non xstar vehicles and 70% for xstar vehicles"; other staging branches allow 70% for all. Source: Existing Transactions R5, Remarks (dev, via QA).
6. **Takaful and Tokio Marine Sum Insured cannot go below recommended** — recommended = API minimum. Source: Regression Testing R16, R27.
7. **BO and CIBO payment time differ (accepted by dev)** — "Payment time is not tallied between BO and CIBO (Checked with dev)". Source: New Transactions R17. Candidate for `knowledge/cibo.md` or traps.
8. **eSTM → insurance → eSTM order on VEL000069E** — after insurance "Status = Insurance Created", "system redirects to eSTM Step 5", then JPJ Enquiry "Success (GLB000000I)" and Tx Approved; X-Star HP becomes "Complete". Source: New Transactions R45. Candidate for `knowledge/flow-estm.md`.
9. **Test vehicle list for Chubb range testing on uat3** (§5 item 2) — candidate for a test-data note. Source: Remarks column, all sheets.
