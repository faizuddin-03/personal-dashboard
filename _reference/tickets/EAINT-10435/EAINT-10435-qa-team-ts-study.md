# EAINT-10435 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another QA
engineer's test script. Nothing here has been re-tested.

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-10435-[eAuto-Insurance] X-STAR Lonpac Broaden Underwriting Guidelines to Support Pemaju Ekslusif.md`
   (captured 27/10/2026, 9:06:43 pm; "Cell text only, row by row; formatting and images are not kept").
   All 5 sheets read in full.
2. **Original workbook:** "EAINT-10435-[eAuto-Insurance] X-STAR Lonpac Broaden Underwriting Guidelines to Support Pemaju Ekslusif.xlsx",
   SharePoint library "eAuto - CR Test Scenarios", modified 11/05/2026, 5:01:38 pm. Not opened
   directly; cell colours, comments and images are not available.
3. **Ticket folders:** `_reference/tickets/EAINT-10435/` and `_reference/tickets/Studying/EAINT-10435/`
   held no files before this study. **No SRD and no Jira ticket text were read.**
4. **lib/ticketStudies.ts:** no entry for EAINT-10435.
5. **knowledge/:** `eauto-insurance.md` (§ Sum-insured price range), `business-rules-from-test-scenarios.md`
   (§ 6.2), `cr-test-scenario-catalogue.md` (row 009, line 79), `production-regression-scope.md`
   (§ 11), `environments-history.md` (line 52), `flow-insurance-purchase.md` (Lonpac card DOM,
   69E redirect), `flow-quotation-reminder.md` (69E entry).

## 1. Header

1. **Ticket:** EAINT-10435 — "X-STAR Lonpac Broaden Underwriting Guidelines to Support Pemaju Ekslusif’s"
   (sheet New Trxns (Scoped Down TS), row 1).
2. **Module / portal:** eAuto **Insurance**, UCD portal — Lonpac quotation card, **Sum Insured
   dropdown**. Reached from eSTM (normal flow, VEL000069E redirect, Resubmit from listing,
   Insurance Ads Banner) and **Get A Free Quote**. Results checked on UCD, BackOffice, CIBO,
   eAuto Service Portal, invoice and downloadables.
3. **Workbook:** "EAINT-10435-[eAuto-Insurance] X-STAR Lonpac Broaden Underwriting Guidelines to Support Pemaju Ekslusif.xlsx".
4. **Sheets (5):**
   1. **New Trxns (Scoped Down TS)** — the real EAINT-10435 new-transaction TS. Header cell: "= 7TS".
   2. **New Transactions** — an older draft. Almost every id is `10044_...` (copied from the
      EAINT-10044 Chubb workbook) and uses percentage rules, not the Lonpac formula. Header: "= 7TS".
   3. **Existing Transactions** — before/after deployment checks. Header: "=3 TS".
   4. **Regression Testing** — other insurers (Chubb, Takaful, Tokio Marine). Header: "= 4TS".
   5. **UAT** — 6 UAT checks with real test data.
5. **Testers named in the sheet:** "Azila" and "Teck Yung" (QA column). Many rows have a blank QA cell.
6. **Dates in the sheet:** none. Only the SharePoint modified date (11/05/2026) is known.
7. **Result counts (by TS id block):**

| Sheet | TS blocks | PASS | Not Started | N/A | In Progress | Blank |
|---|---|---|---|---|---|---|
| New Trxns (Scoped Down TS) | 6 | 5 | 0 | 0 | 0 | 1 (`10044_INS_TS19`) |
| New Transactions | 16 | 5 | 3 | 1 | 0 | 7 |
| Existing Transactions | 6 | 3 | 0 | 0 | 0 | 3 (`10044_EXT_TS04-06`) |
| Regression Testing | 11 | 4 | 0 | 2 | 2 | 3 |
| UAT | 6 | 6 | 0 | 0 | 0 | 0 |

8. **No FAIL recorded anywhere** in the workbook.
9. **Header count mismatch:** Scoped Down sheet says "= 7TS" but shows 5 `10435_` ids plus 1
   leftover `10044_` id. [unconfirmed] whether a 7th row was deleted or hidden.

## 2. What the ticket changed, as the TS shows it

1. **Lonpac Sum Insured range is now formula-based**, built from the **ISM** (recommended
   market value) and rounded **up to the nearest RM1,000**.
2. **X-Star vehicles get a wider upward range than non-X-Star.** X-Star = vehicle with an
   **Active** hire purchase record for X STAR TECHNOLOGY MALAYSIA SDN BHD.
   1. **Minimum (both):** "ISM - (ISM × 10%) → round up to nearest 1,000" (Scoped Down, row 6).
   2. **X-Star maximum:** "xSTAR Max Ceiling = (Lonpac SI + (Lonpac SI × 40%)) rounded up to nearest 1,000" (Scoped Down, row 6).
   3. **Non-X-Star maximum:** "non xSTAR Max = (Lonpac SI + (Lonpac SI × 20%)) rounded up to nearest 1,000" (Scoped Down, row 14).
   4. **Lonpac SI** (the base for the maximum): "Lonpac SI = (ISM + (ISM × 10%)) rounded up to nearest 1,000" (Scoped Down, row 6).
3. **Lonpac API fields named in the TS:** `<highestAgreedValue>`, `<lowestMarketValue>`,
   `<ismRecommendSI>` (Scoped Down rows 5, 13; UAT rows 4-9). [unconfirmed] these are the
   Lonpac response XML tags the dropdown is built from.
4. **Worked example (ISM RM25,300):** min RM23,000; Lonpac SI RM28,000; non-X-Star max
   RM34,000; X-Star max RM40,000 (Scoped Down rows 6, 14).
5. **Other insurers are not meant to change.** The Regression sheet re-checks Chubb, Takaful
   and Tokio Marine ranges and the RM80k cap behaviour.

## 3. Scenarios

### 3a. New Trxns (Scoped Down TS) — the real TS

1. **10435_INS_TS01** (rows 5-11, Azila, PASS) — eSTM normal flow, **VEL000069E**, **X-Star HP record**.
   Checks min/max of the Lonpac dropdown, picks the max, postcode change and back, Step 2 → Back,
   then full purchase. Key expected: "Allowed selection: = RM40,000" (row 7); "Previously
   selected Sum Insured remains the same." (row 10).
2. **10435_INS_TS02** (rows 13-16, Azila, PASS) — eSTM, VEL000069E via **Resubmit from Listing**,
   **non-X-Star HP** (e.g. "Carsome CAPITAL Sdn Bhd"). Picks the minimum: "Allowed selection: = RM23,000" (row 15).
3. **10435_INS_TS3** (rows 18-21, Teck Yung, PASS) — eSTM normal flow, **no HP record**. Picks the
   median: "Select median = RM 25,300 (ISM base)" (row 20). Row 18 test steps cell reads only "for".
4. **10435_INS_TS4** (row 22, Teck Yung, PASS) — **Get A Free Quote**, X-Star HP record. Expected:
   X-Star ceiling formula (40%).
5. **10435_INS_TS5** (row 23, Teck Yung, PASS) — **Get A Free Quote**, "No HP Record". Expected:
   non-X-Star formula (20%). Step 1 still says "Create XStar Hire Purchase Record with Status = Active" — copy error [unconfirmed].
6. **10044_INS_TS19** (row 24, no tester, no result) — Get A Free Quote, X-Star HP, eSTM approved.
   Expected: "The Sum Insured dropdown becomes an uneditable textfield." Leftover from EAINT-10044.

### 3b. New Transactions — older draft (10044_ copies)

1. **10044_INS_TS01** (rows 5-13, Not Started) — no HP, 90%/120% then 140% rules. Remark "Test Data used > VFK5531".
2. **10044_INS_TS02** (rows 14-17, N/A) — no HP, Insurance Ads Banner entry, 90%/120%.
3. **10044_INS_TS02** (rows 18-21, Not Started) — **duplicate id**, non-X-Star HP, 69E.
4. **10044_INS_TS07** (rows 23-26, blank) — non-X-Star HP (e.g. "Aeon Credit"), exactly −10%, 90%/140%.
5. **10044_INS_TS08** (row 27, blank) — Get A Free Quote: "The maximum sum insured option within the list is capped at RM80,000."
6. **10044_INS_TS09** (row 28, blank) — RM10,000 floor: "< RM10,000, the Lonpac Quotation SHOULD NOT be displayed."
7. **10044_INS_TS10** (row 29, blank) — dropdown becomes uneditable textfield.
8. **10044_INS_TS11** (rows 30-39, blank) — X-Star HP, 90%/150%; after purchase, same vehicle on Get A Free Quote: "UCD cannot get Insurance Quotation" (row 39).
9. **10044_INS_TS12** (rows 40-43, blank) — X-Star detected at Step 2 after thumbprint, 69E via Resubmit; HP status goes "Complete" after eSTM approved (row 43).
10. **10044_INS_TS03** (rows 44-47, Teck Yung, PASS) — X-Star HP, 69E, exactly +50%.
11. **10044_INS_TS14** (rows 48-51, PASS) — X-Star HP created at Step 5 before 69E, exactly +50%.
12. **10044_INS_TS05** (rows 52-57, PASS) — X-Star HP set **Inactive** → 140% range; set back **Active** → 150% range.
13. **10044_INS_TS16** (rows 58-61, PASS) — X-Star HP patched by dev to **Expired** → 140% range.
14. **10044_INS_TS04** (row 62, Teck Yung, PASS) — Get A Free Quote, X-Star: max "Recommended Price x 1.50".
15. **10044_INS_TS05** (row 63, Teck Yung, Not Started) — **duplicate id**, Get A Free Quote, max ×1.40.
16. **10044_INS_TS19** (row 64, blank) — same as 3a item 6.

### 3c. Existing Transactions — before (/eauto) vs after (/preprod2)

1. **10435_EXT_TS01** (rows 5-6, Azila, PASS) — X-Star HP, 69E. Before: 90%/150%. After (Resubmit from Listing): 90%/150%, purchase to Approved.
2. **10435_EXT_TS02** (rows 7-8, Teck Yung, PASS) — non-X-Star HP ("CARSOME CAPITAL SDN BHD"). Before: 90%/150%. After (Get A Free Quote): 90%/**140%**.
3. **10435_EXT_TS03** (rows 9-10, Teck Yung, PASS) — no HP. Before: 90%/150%. After (Get A Free Quote): 90%/**140%**.
4. **10044_EXT_TS04-06** (rows 11-16, blank) — leftovers against "/uat3"; expect "uneditable textfield". Row 13 remark "Test data =" is empty.

### 3d. Regression Testing — other insurers

1. **10435_REG_TS01** (rows 5-13, Teck Yung, PASS) — insurer cell "Takaful (TPFT)", steps say **Chubb**, no HP, ≤15 years. Range must match the API: "tallied with the min and max price returned by Chubb API." (row 6).
2. **10435_REG_TS02** (row 14, PASS) — no HP, ">10 years (<2500CC)": dropdown uneditable.
3. **10435_REG_TS02** (rows 15-22, Teck Yung, **N/A**) — Tokio Marine, no HP, ≤10 years, max 110%.
4. **10435_REG_TS03** (row 23 N/A; rows 24-25 blank) — Tokio Marine purchase; "NOT capped at RM80,000" (row 24); uneditable >10 years (row 25).
5. **10435_REG_TS03** (rows 26-34, PASS) — "Takaful (Comprehensive)", non-X-Star HP, max 110%. Remark "Test Data = VFJ6008" (row 27).
6. **10044_REG_TS07 / TS08** (rows 35-36, **In Progress**) — Takaful (Comprehensive) not capped at RM80k; uneditable >10 years.
7. **10435_REG_TS04** (rows 37-45, PASS) — Chubb, **X-Star HP**, ≤15 years, max 110%.
8. **10044_REG_TS10 / TS11** (rows 46-47, blank) — Chubb not capped at RM80k; uneditable >15 years.

### 3e. UAT

1. **10435_UAT_TS1** (row 4, PASS) — eSTM 69E, X-Star: max formula "ISM X 10% -> round up + ISM X 40% -> round up". Data VFS4108, "RM56k".
2. **10435_UAT_TS2** (row 5, PASS) — eSTM > Get A Free Quote, X-Star: recommended = `<ismRecommendSI>`. Data AKX5596, "RM22k".
3. **10435_UAT_TS3** (row 6, PASS) — "Any point", X-Star: min "ISM - 10% -> round up". Data DER4511, "RM177k".
4. **10435_UAT_TS4** (row 7, PASS) — eSTM 69E, non-X-Star / no HP: max "ISM X 10% -> round up + ISM X 20% -> round up". Data VM582, "RM47k".
5. **10435_UAT_TS5** (row 8, PASS) — Get A Free Quote, non-X-Star: recommended = `<ismRecommendSI>`. Data WYU2255, "RM38k".
6. **10435_UAT_TS6** (row 9, PASS) — **Insurance Ads Banner**, non-X-Star: min "ISM - 10% -> round up". Data WYU2255, "RM22k".
7. **UAT summary block** (rows 16-24): "1. XStar … a. minimum value (ISM - 10% - round up) … b. median value (ISM) … c. maximum value (ISM X 10% - round up + ISM X 40% - round up)"; "2. Non XStar … c. maximum value (ISM X 10% - round up + ISM X 20% - round up)".

## 4. Business rules and system behaviour

1. **Lonpac minimum:** "Ensure the minimum/lowest downward adjustment selection does NOT go below ISM - (ISM × 10%) → round up to nearest 1,000 Example: RM 25,300 - RM 2,530 = RM 22,770 → RM 23,000" (New Trxns (Scoped Down TS), row 6).
2. **Lonpac SI:** "Lonpac SI = (ISM + (ISM × 10%)) rounded up to nearest 1,000 Example: RM 25,300 + RM 2,530 = RM 27,830 → RM 28,000" (Scoped Down, row 6).
3. **X-Star ceiling:** "xSTAR Max Ceiling = (Lonpac SI + (Lonpac SI × 40%)) rounded up to nearest 1,000 Example: RM 28,000 + RM 11,200 = RM 39,200 → RM 40,000" (Scoped Down, row 6).
4. **Non-X-Star ceiling:** "non xSTAR Max = (Lonpac SI + (Lonpac SI × 20%)) rounded up to nearest 1,000 Example: RM 28,000 + RM 5,600 = RM 33,600 → RM 34,000" (Scoped Down, row 14).
5. **No HP record = non-X-Star rule.** TS3 (no HP) expects the 20% formula (Scoped Down, row 19). UAT rows 7-9 group "No (Non X-Star HP record / No HP Record)".
6. **Median option = ISM:** "Select median = RM 25,300 (ISM base)" (Scoped Down, row 20).
7. **Range does not move when a value is picked:** "Maximum upward adjustment and deduction price range in the dropdown remain unchanged." (Scoped Down, rows 7, 15, 20).
8. **Postcode change refreshes the quote:** "System refreshes quotation. 2. Recommended price and price range update based on postcode." (Scoped Down, row 8). Changing back: "Recommended price and price range are displayed the same before postcode change." (row 9).
9. **Selection survives Step 2 → Back:** "Previously selected Sum Insured remains the same. 2. Recommended price and price range remain unchanged." (Scoped Down, row 10).
10. **69E round trip:** "Proceed to purchase insurance, Payment = OK, Status = Insurance Created … After insurance is completed, system redirects to eSTM Step 5 … JPJ Enquiry = Success (GLB000000I)" (Scoped Down, row 11).
11. **Selected sum insured must carry to 12 places,** incl. "Insurance Quotation Page Step 4", "BO Insurance Trx Listing > Export CSV", "CIBO Insurance Details Page", "Insurance Invoice", "Insurance Downloadables (e.g. E-certificates, Policies)" (Scoped Down, row 11). Some rows say "Insurance Receipt" instead of "Insurance Invoice" (Existing Transactions, row 6).
12. **X-Star tag depends on HP status at quote time** (from 10044_ copies, PASS but no tester): Inactive → 140% range (New Transactions, row 53); back to Active → 150% (row 55); dev-patched Expired → 140% (row 59).
13. **X-Star HP becomes Complete after eSTM approval:** "Tx Status = Approved (Tagged to XStar, Hire Purchase Record Status = Complete)" (New Transactions, row 43). Not executed (blank result).
14. **Existing-transaction ranges (percent form):** non-X-Star / no HP went from "NOT be higher than 150%" before deployment (Existing Transactions, rows 7, 9) to "NOT be higher than 140%" after (rows 8, 10). X-Star stayed "150%" (rows 5-6).
15. **Other insurers (regression):** Tokio Marine / Takaful "sum insured cannot be deducted as the recommended price = Minimum Price returned from Tokio Marine API" (Regression Testing, row 27). Takaful TPFT: "The pricing can be upward adjusted to 50%, if the vehicle number has butir2 hak milik." (row 16).
16. **RM80k cap is not on Takaful / Tokio Marine / Chubb:** "The maximum sum insured option within the list is NOT capped at RM80,000." (Regression Testing, rows 24, 35, 46). Testing it needs "recommended sum insured is > RM48000, if not will need developer to make changes to the eSIM" (row 24).
17. **Range evidence comes from dev logs:** "Ask dev for the screenshot of the log for the pricing details returned from Chubb API." (Regression Testing, row 6).

## 5. Test data, environments, setup

1. **Environments:** "Verify sum insured range before deployment (/eauto) and after deployment (/preprod2)" (Existing Transactions, row 5). Leftover 10044 rows name "/uat3" (row 11). `knowledge/environments-history.md` line 52 records preprod2 "redeployed with EAINT-10435 only, 24 Jun morning".
2. **Production deployments:** `production-regression-scope.md` § 11 lists EAINT-10435 on **20260511** ("-", nothing recorded) and **20260624** ("Part" = existing data or part of the TS).
3. **eSIM setup:** JPJ enquiry error code "VEL000069E" to force the insurance redirect; "GLB000000I" for success (Scoped Down, rows 5, 11).
4. **Hire purchase setup:** create HP record for "X STAR TECHNOLOGY MALAYSIA SDN BHD" (X-Star) or "Carsome CAPITAL Sdn Bhd" / "Aeon Credit" (non-X-Star), "Record Status = Active". Expired status needs "Request dev to patch Hire Purchase Record Status to Expired" (New Transactions, row 58).
5. **Owner types used:** MyKad, MyPR, Company.
6. **Vehicle numbers:** VFK5531 (New Transactions R5), VFJ6008 (Regression R27), VFS4108, AKX5596, DER4511, VM582, WYU2255 (UAT R4-R9).
7. **UAT ids:** each UAT row records an Insurance id and eSTM id (UUIDs), e.g. "Insurance id = 48897939-75e8-4c85-a026-fd6b5544a6e0" (UAT, row 4).
8. **Credentials:** none in the sheet.
9. **Example postcode:** "Kuching, Sarawak > 93250" (Scoped Down, row 8).

## 6. Gaps and risks for regression

1. **Formula wording conflict.** Scoped Down applies 40%/20% to **Lonpac SI** (ISM +10%, rounded). UAT writes "ISM X 10% -> round up + ISM X 40% -> round up". For ISM RM25,300 these give different maxima. [unconfirmed] which one the code uses — confirm against the SRD before asserting a number.
2. **Existing Transactions percentages do not match the formula.** Scoped Down X-Star max RM40,000 on ISM RM25,300 is about 158% of ISM, above the "150%" in Existing Transactions rows 5-6. Non-X-Star RM34,000 is about 134%, below "140%". The percent rows are likely loose ceilings [unconfirmed].
3. **No FAIL / no boundary-negative test.** Nothing checks that a value just above the max or below the min is **absent** from the dropdown on a second ISM value.
4. **Rounding edge case not tested:** ISM where ISM −10% is already a whole thousand (no rounding needed).
5. **RM10,000 floor and RM80,000 cap for Lonpac never executed** (New Transactions rows 27-28 blank). Existing knowledge cites row 28 as a Lonpac rule.
6. **HP status switching** (Active → Inactive → Expired → Complete) only covered by 10044 copies with no tester named.
7. **Tokio Marine regression marked N/A** (Regression rows 15-23); 2 rows still "In Progress".
8. **Uneditable textfield (over-age vehicle) for Lonpac** never executed.
9. **Downstream pages** (CSV, CIBO, invoice, e-cert) are listed as one expected result; no per-page evidence is recorded in the text copy.
10. **Same-vehicle re-quote after purchase** ("UCD cannot get Insurance Quotation", New Transactions row 39) not executed.

## 7. Contradictions with knowledge/

1. **`knowledge/eauto-insurance.md` § Sum-insured price range, item 4** and **`business-rules-from-test-scenarios.md` § 6.2 item 8** say "Lonpac X-Star: ceiling 150%" citing Existing Transactions row 5. That row is the **"Before Deployment"** expectation on /eauto. The post-deployment rule in the real TS is the **Lonpac SI + 40%** formula (Scoped Down, row 6).
2. **`cr-test-scenario-catalogue.md` row 009** cites "New Transactions!R31" for the 150% rule and "New Transactions!R28" for the RM10,000 floor. Both rows are `10044_` copies; R31 has no tester, R28 has no result.
3. **`business-rules-from-test-scenarios.md` § 6.2 item 4** says the RM10,000 floor is "same for Lonpac" citing New Transactions row 28 — unexecuted row.
4. **`business-rules-from-test-scenarios.md` § 6.2 item 9** says "Lonpac regression: price range must equal the min and max returned by the Lonpac API" citing EAINT-10044. In this workbook the equivalent row names **Chubb API** (Regression Testing, row 6).
5. **69E redirect timing.** `flow-quotation-reminder.md` row 4 / memory say the redirect fires "after it completes". This TS describes insurance during the 69E step and then "system redirects to eSTM Step 5" to finish payment (Scoped Down, row 11). [unconfirmed] whether the flow changed since May 2026 or the TS wording is loose.

## Knowledge candidates

1. **Lonpac sum-insured formula (EAINT-10435)** for `knowledge/eauto-insurance.md` § Sum-insured price range — replace the "Lonpac X-Star: ceiling 150%" line:
   1. Min: "ISM - (ISM × 10%) → round up to nearest 1,000" `[from SharePoint TS #009 EAINT-10435, sheet New Trxns (Scoped Down TS), row 6]`.
   2. Lonpac SI: "(ISM + (ISM × 10%)) rounded up to nearest 1,000" `[same, row 6]`.
   3. X-Star max: "(Lonpac SI + (Lonpac SI × 40%)) rounded up to nearest 1,000" `[same, row 6]`.
   4. Non-X-Star / no HP max: "(Lonpac SI + (Lonpac SI × 20%)) rounded up to nearest 1,000" `[same, row 14]`.
   5. Median option = ISM: "Select median = RM 25,300 (ISM base)" `[same, row 20]`.
2. **Flag the 150% citation as pre-deployment** in `eauto-insurance.md`, `business-rules-from-test-scenarios.md` § 6.2 and `cr-test-scenario-catalogue.md` row 009 `[from SharePoint TS #009 EAINT-10435, sheet Existing Transactions, row 5 — "Before Deployment"]`.
3. **Downgrade the Lonpac RM10,000 floor** to `[unconfirmed]` — source row never executed `[from SharePoint TS #009 EAINT-10435, sheet New Transactions, row 28, Result blank]`.
4. **Formula wording conflict** to note under the Lonpac rule: UAT writes "ISM X 10% -> round up + ISM X 40% -> round up" `[from SharePoint TS #009 EAINT-10435, sheet UAT, row 4]` — needs the SRD.
5. **Lonpac API fields** `highestAgreedValue`, `lowestMarketValue`, `ismRecommendSI` drive the dropdown [unconfirmed] `[from SharePoint TS #009 EAINT-10435, sheet UAT, rows 4-9]` — candidate for `flow-insurance-purchase.md` near the `select[name=sumInsuredValue][plancode="Lonpac"]` DOM.
6. **No HP record uses the non-X-Star rule** `[from SharePoint TS #009 EAINT-10435, sheet UAT, rows 7-9: "No (Non X-Star HP record / No HP Record)"]`.
7. **Selected sum insured carries across 12 surfaces** (list in § 4 item 11) `[from SharePoint TS #009 EAINT-10435, sheet New Trxns (Scoped Down TS), row 11]` — candidate for `flow-insurance-purchase.md` cross-page verification.
8. **lib/ticketStudies.ts** has no EAINT-10435 entry; a short entry could point to this study.
