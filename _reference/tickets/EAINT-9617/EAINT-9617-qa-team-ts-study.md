# EAINT-9617 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-9617 - [eAuto - Tokio Marine] To Update Hire Purchase List for Tokio Marine.md` (exported 28/10/2026, 9:16:18 am). Cell text only — formatting, colours and images were not available.
2. **Ticket folders:** `_reference/tickets/EAINT-9617/` and `_reference/tickets/Studying/EAINT-9617/` — **no existing files** in either. No SRD, Jira text or Teams discussion was read.
3. **`lib/ticketStudies.ts`:** no entry for EAINT-9617.
4. **knowledge/:** `cr-test-scenario-catalogue.md` (row 107), `flow-insurance-purchase.md` (Step 3 form, Details page), `business-rules-from-test-scenarios.md` (§6.4 item 4, item 5 under EAINT-10052 / 9900), `eauto-insurance.md` (X-Star sequence note).

## 1. Header

1. **Ticket:** EAINT-9617 — "[eAuto - Tokio Marine] To Update Hire Purchase List for Tokio Marine".
2. **Module / portals:** UCD Insurance (Tokio Marine), with checks on **UCD**, **BO** and **CIBO**.
3. **Workbook:** "EAINT-9617 - [eAuto - Tokio Marine] To Update Hire Purchase List for Tokio Marine.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 09/02/2026, 11:40:21 am.
4. **Sheets:**
   1. "New Credit Companies (TMIM)" — reference list, 18 credit companies (R5–R22), no scenarios.
   2. "E2E Scenarios" — **37 scenarios** (R2–R38).
5. **Results:** **37 Pass, 0 Fail, 0 Pending.** Overall Test Progress block (E2E Scenarios, R3): Pass "37", TOTAL "37", Completion % "1" (100%).
6. **Testers (QA column):** Azfar (TS1, TS2, TS4, TS6, TS7) and Maisarah (TS3, TS5, TS8, TS9). The catalogue lists the workbook owner as Maisarah Nuraliyaa Binti Masrom, dated 2026-02-09 `[from knowledge/cr-test-scenario-catalogue.md, row 107]`.
7. **Dates:** none in the sheet itself. Release hint: "New for 4th Feb patching" (New Credit Companies (TMIM), R7 and R19).

## 2. What the ticket changed, as the TS shows it

1. **Tokio Marine's Hire Purchase dropdown** (UCD Insurance Step 3) **gains new credit companies** — expected "Ensure dropdown updated with new additional credit companies" (E2E Scenarios, R2).
2. The new list is on sheet "New Credit Companies (TMIM)", headed "HIRE PURCHASE (LOANCOM)" with columns "CODE" and "DESCP" (R3–R4).
3. Only two rows carry the note **"New for 4th Feb patching"**: "03929036 | CARSOME CAPITAL SDN BHD" (R7) and "05613323 | X STAR TECHNOLOGY MALAYSIA SDN. BHD." (R19).
4. **Other insurers are not changed:** Takaful and Chubb dropdowns must "NOT have new additional credit companies" (R37, R38).
5. **X-Star / Carsome-tagged eSTM:** the Step 3 Hire Purchase field changes "from: PUBLIC BANK BERHAD ⏎ to: X STAR TECHNOLOGY MALAYSIA SDN. BHD." (R17, R22) or "to: CARSOME CAPITAL SDN BHD" (R27, R32).
6. The chosen hire purchase must then show on **UCD Details + e-Cert**, **BO Details + e-Cert**, **CIBO Transaction Management Details**, and **CIBO Export CSV**.

## 3. Scenarios

Each group TS1–TS7 has the same five sub-steps: **.1** Step 3 dropdown/field, **.2** UCD Details + e-Cert, **.3** BO Details + e-Cert, **.4** CIBO Transaction Management Details, **.5** CIBO Export CSV. All Tokio Marine Insurans (Malaysia) Berhad unless stated.

### A. Non-XStar, user picks the hire purchase

1. **9617_E2E_TS1.1–1.5** — Individual Car, Comprehensive (R2–R6). .1 "Ensure dropdown updated with new additional credit companies"; .2–.4 "Hire Purchase: ⏎ (User Submission) field displayed selected Hire Purchase on Insurance Step 3"; .5 "Hire Purchase: ⏎ (Claimed by) field displayed selected Hire Purchase on Insurance Step 3". All Pass. Remark R2: "Carsome Capital (No BBHM) & X Star (BBHM)".
2. **9617_E2E_TS2.1–2.5** — Individual Bike, Comprehensive (R7–R11). Same expectations as TS1. All Pass. Remark R7: "Carsome Capital - BBHM".
3. **9617_E2E_TS3.1–3.5** — Individual Bike, **TPFT** (R12–R16). Same expectations as TS1. All Pass. Remark R15: "Plan became Comprehensive and displayed  ⏎ Hire Purchase details in CIBO, e-cert cannot be downloaded on CIBO".

### B. XStar eSTM, hire purchase set by the tag

4. **9617_E2E_TS4.1–4.5** — Individual Car (XStar), tagged X STAR (R17–R21). .1 field "from: PUBLIC BANK BERHAD ⏎ to: X STAR TECHNOLOGY MALAYSIA SDN. BHD."; .2–.5 "Hire Purchase: ⏎ (Claimed by) field displayed X STAR TECHNOLOGY MALAYSIA SDN. BHD."; e-Cert "HIRE PURCHASE ⏎ OWNERS" same value. All Pass.
5. **9617_E2E_TS5.1–5.5** — Individual Bike (XStar), tagged X STAR (R22–R26). Same as TS4 but **without** the "(If hit STMS 4K)" line. All Pass. Remark R22: "X Star (BBHM)".
6. **9617_E2E_TS6.1–6.5** — Individual Car (XStar), "tagged under CARSOME CAPITAL SDN BHD" (R27–R31). Field "to: CARSOME CAPITAL SDN BHD"; .2–.5 "(Claimed by) field displayed CARSOME CAPITAL SDN BHD". No STMS 4K line. All Pass.
7. **9617_E2E_TS7.1–7.5** — Individual Bike (XStar), tagged Carsome (R32–R36). Same as TS6, plus the STMS 4K line. All Pass. Remark R32: "Carsome (BBHM)".

### C. Other insurers unchanged (negative)

8. **9617_E2E_TS8** — Individual Car, Syarikat Takaful Malaysia Keluarga Berhad, Comprehensive (R37). "Ensure dropdown do NOT have new additional credit companies". Pass. Remark: "Displayed  CARSOME CAPITAL SDN BHD (existing)".
9. **9617_E2E_TS9** — **Company** Car, Chubb Insurance Malaysia Berhad, Comprehensive (R38). Same expected. Pass. Remark: "Displayed  CARSOME CAPITAL SDN BHD and ⏎ X STAR TECHNOLOGY MALAYSIA SDN. BHD. (existing)".

## 4. Business rules and system behaviour

1. **Entry point:** "*Create eSTM and proceed until approved & redirect to Insurance ⏎  ⏎ UCD - Insurance Step 3 Hire Purchase > Hire Purchase Dropdown" (E2E Scenarios, R2).
2. **Three Hire Purchase labels on details pages:**
   1. "Hire Purchase: ⏎ (User Submission) field displayed selected Hire Purchase on Insurance Step 3" (R3).
   2. "(If hit STMS 4K) Ensure Hire Purchase: ⏎ (Returned by JPJ) field displayed value from Loan > STMS Enquiry" (R3).
   3. "Hire Purchase: ⏎ (Claimed by) field displayed X STAR TECHNOLOGY MALAYSIA SDN. BHD." (R18).
3. **e-Cert label:** "Ensure HIRE PURCHASE ⏎ OWNERS field displayed selected Hire Purchase on Insurance Step 3" (R3).
4. **CIBO details page also shows the User Submission field** for non-XStar — R5 (CIBO - Transaction Management Details page) uses the same "(User Submission)" wording as UCD and BO.
5. **CIBO Export CSV uses "(Claimed by)" even for non-XStar:** "Ensure Hire Purchase: ⏎ (Claimed by) field displayed selected Hire Purchase on Insurance Step 3" (R6, R11, R16).
6. **e-Cert cannot be downloaded on CIBO:** "- e-cert cannot be downloaded on CIBO" (Remark, R5, R10, R15, R20, R25, R30, R35).
7. **XStar default before the tag applies:** Step 3 field goes "from: PUBLIC BANK BERHAD" to the tagged company (R17, R22, R27, R32).
8. **XStar eSTM can be tagged under Carsome:** "*Create XStar eSTM tagged under CARSOME CAPITAL SDN BHD" (R27).
9. **Carsome and X Star were already in the Takaful and Chubb lists** — Remarks R37, R38 say "(existing)".
10. **TPFT bike shown as Comprehensive in CIBO:** "Plan became Comprehensive" (Remark, R15). Row still marked Pass. [unconfirmed: whether this was raised as a defect]
11. **Credit company codes are 8-digit LOANCOM codes**, e.g. "03929036 | CARSOME CAPITAL SDN BHD" (New Credit Companies (TMIM), R7).

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated in the sheet.
2. **Credentials:** none in the sheet.
3. **Vehicle numbers / references:** none recorded.
4. **Setup:** approved eSTM redirected to Insurance (non-XStar); XStar eSTM "tagged under" X STAR or CARSOME CAPITAL (R17, R27).
5. **STMS 4K:** checks on "(Returned by JPJ)" are conditional — "(If hit STMS 4K)". The sheet does not say which runs hit it.
6. **"BBHM"** appears in remarks (R2, R7, R22, R32). Meaning not stated. [unconfirmed]

## 6. Gaps or risks a regression should still cover

1. **Only two of the 18 listed companies are named in results** (Carsome, X Star). No row confirms all 18 appear in the Tokio Marine dropdown. [unconfirmed: whether the other 16 were already present]
2. **No Company (business) scenario for Tokio Marine.** Company is only tested on Chubb (TS9).
3. **No TPFT car, no XStar TPFT** scenario.
4. **STMS 4K branch not proven** — the sheet never states a run hit it.
5. **TS5 and TS6 drop the STMS 4K line** while TS4 and TS7 keep it — inconsistent coverage.
6. **TPFT → Comprehensive in CIBO** (R15) passed without a stated follow-up; worth a recheck.
7. **No check that the Takaful / Chubb list excludes the other 16 new companies** — TS8/TS9 remarks mention only the two existing ones.
8. **Tokio Marine car now hidden** from July 2026 `[from knowledge/business-rules-from-test-scenarios.md, §control sequence item 9, citing SharePoint TS #025 EAINT-11977]` — TS1, TS4, TS6 may no longer be reachable on Get Free Quote. [unconfirmed for the redirect-after-eSTM path]

## 7. Where this differs from knowledge/

1. **`knowledge/flow-insurance-purchase.md:607-610`** says "CIBO shows 'Hire Purchase: (Claimed by)'" citing rows 3-6. The TS splits this: **CIBO Details page (R5) expects "(User Submission)"**; only **CIBO Export CSV (R6)** expects "(Claimed by)". Same wording in `business-rules-from-test-scenarios.md:476` ("[… row 6]") — correct row, but reads as CIBO in general.
2. **`knowledge/business-rules-from-test-scenarios.md:966-969`** (EAINT-10052 / 9900, later ticket) says "(Claimed by)" = X STAR for X-Star, else "-". This TS (earlier) expects the CIBO Export "(Claimed by)" to show the **user-selected** hire purchase for non-XStar (R6, R11, R16). Later ticket likely superseded this. [unconfirmed]
3. **`knowledge/flow-insurance-purchase.md:458-460`** says "The chosen bank has no downstream effect". This TS shows the chosen hire purchase **is displayed** downstream (Details, e-Cert, CIBO, CSV). No contradiction for the purchase outcome, but it is not "no effect" for display checks.
4. **Knowledge has no XStar Carsome tag case.** Only X STAR is recorded as the X-Star value (`business-rules-from-test-scenarios.md:476-477`, `eauto-insurance.md:192`).

## Knowledge candidates

1. **CIBO Details vs Export labels (EAINT-9617).** CIBO Transaction Management Details shows "Hire Purchase: ⏎ (User Submission)"; CIBO Export CSV shows "Hire Purchase: ⏎ (Claimed by)". Source: SharePoint TS #107 EAINT-9617, sheet E2E Scenarios, R5 and R6. Target: correct `knowledge/flow-insurance-purchase.md:609` and `business-rules-from-test-scenarios.md:476`.
2. **e-Cert not downloadable on CIBO.** "- e-cert cannot be downloaded on CIBO". Source: same sheet, Remark R5 (repeated R10, R15, R20, R25, R30, R35). Target: `knowledge/cibo.md`.
3. **XStar eSTM tagged to Carsome.** "*Create XStar eSTM tagged under CARSOME CAPITAL SDN BHD" → Step 3 field "from: PUBLIC BANK BERHAD ⏎ to: CARSOME CAPITAL SDN BHD". Source: same sheet, R27. Target: `knowledge/eauto-insurance.md` X-Star note.
4. **XStar Step 3 default.** XStar Step 3 Hire Purchase field starts as "PUBLIC BANK BERHAD" before the tag replaces it. Source: same sheet, R17. [unconfirmed: whether this is a fixed default or the test data's value]
5. **Tokio Marine credit company list (LOANCOM codes).** 18 entries; Carsome "03929036" and X Star "05613323" marked "New for 4th Feb patching". Source: sheet New Credit Companies (TMIM), R3–R22. Target: `knowledge/eauto-insurance.md`.
6. **Carsome and X Star already existed in Takaful and Chubb HP lists** before this change. Source: E2E Scenarios, Remarks R37, R38.
7. **Possible conflict to resolve:** CIBO Export "(Claimed by)" for non-XStar — this TS says the selected hire purchase (R6), EAINT-10052 says "-". Source: this TS R6 vs `business-rules-from-test-scenarios.md:966-969`. Needs a live check before recording either as current.
