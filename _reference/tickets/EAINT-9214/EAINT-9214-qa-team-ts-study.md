# EAINT-9214 — QA Team test script study (2026-10-28)

Study of the **EAINT-9214 workbook** (control sequence) in the shared "EAINT-9214 & 9215 [eAuto] Takaful" SharePoint folder. EAINT-9214 and EAINT-9215 (NDDP wording) are linked tickets ("Relates: EAINT-9215", Jira capture item 8). The previous version of this file studied the **9215 workbook** by mistake. That content is kept in the **Appendix** as cross-reference.

## Sources read

1. **Workbook text copy (main):** `_reference/sharepoint/qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/[EAINT- 9214]-[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad.md` (captured 28/10/2026, 9:36:33 am). Cell text only — **colours, comments and images not available**.
2. **Older text copy (for comparison):** `_reference/inbox/eauto-flows-run/ts-text/_EAINT-_9214_-_eAuto_To_change_Insurance_Control_Sequence_for_Syarikat_Takaful_Malaysia_Am.txt` (no capture date, no row numbers).
3. **Sibling workbook text copy:** `EAINT-9215 - ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad.md` (same folder). Used for the Appendix only.
4. **Jira capture:** `_reference/tickets/Studying/EAINT-9214/EAINT-9214-jira.md` (27/10/2026, 5:31:52 pm).
5. **Not read:** the EAINT-9214 SRD (`SRD_EAINT-9214_eAuto_To_Change_Insurance_Control_Sequence_V1.0_20112025.pdf/.docx`, listed in Jira attachments). It is not in the repo. The `.xlsx` at `_reference/sharepoint/eauto-cr-test-scenarios/` was not opened; the text copy was used.
6. **Knowledge checked:** `knowledge/README.md`, `eauto-insurance.md` § Quote sequence and § Takaful Malaysia, `business-rules-from-test-scenarios.md` (insurance sequence items 4-9), `cr-test-scenario-catalogue.md` rows 095 / 124, `flow-insurance-purchase.md`, `flow-zurich-takaful.md` §7, `flow-secarang-insurance.md`. `lib/ticketStudies.ts` has **no entry** for 9214 or 9215.

## 1. Header

1. **Ticket:** EAINT-9214 — "⚪[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad" (Jira, Summary). Status "Done"; fix version "S23.5-20251121🌞 (2025-11-21)"; parent "EAINT-7563 [INS] Insurance Quotation Display Arrangement". Jira "QA (cf 10041): Nadhirah Jaafar, Teck Yung Chin".
2. **Portal / module:** **UCD → eSTM handoff to Insurance Step 1**, **UCD → Insurance (Get A Free Quote, Transaction Listing)**, **BO → Insurance (Transaction Listing, Insurance Quote Enquiry)**.
3. **Workbook:** "[EAINT- 9214]-[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad.xlsx".
4. **Library:** "eAuto - CR Test Scenarios"; modified **04/12/2025, 3:18:18 pm**.
5. **Sheets:** "Overall Progress", "Takaful UI changes".
6. **Scenario count:** **9** — 8 UCD-objective rows (R4-R11) and 1 BO-objective row (R13).
7. **Results:** **9 Pass**, 0 Failed. Overall Progress hard-codes "9" Pass, "9" Count, "1" (Overall Progress R5-R6) — **matches** the sheet.
8. **Tester (QA column):** "Nadhirah" on all 9 rows.
9. **Dates:** none written in the sheet.

## Changes since last study (2026-10-28)

1. **Wrong workbook fixed.** The last study's header, scenarios and rules came from the **EAINT-9215** workbook (modified "04/12/2025, 4:29:56 pm"). This version studies the **EAINT-9214** workbook (modified "04/12/2025, 3:18:18 pm"). The 9215 content moved to the Appendix unchanged.
2. **Scenarios — no new, removed or changed rows.** The 28/10/2026 text copy matches the older inbox text copy cell for cell: same 9 TS ids, same steps, expected results, testers and remarks.
3. **Results — no change.** 9 Pass in both copies; Overall Progress "9" / "9" / "1" in both.
4. **SharePoint edit date predates both studies.** "04/12/2025, 3:18:18 pm" is the same day as the Jira "Updated: 2025-12-04T15:21:59". The "changed since" signal is most likely a re-capture, not a new edit `[unconfirmed]`. Formatting-only edits (colours, comments) cannot be seen in the text copy.
5. **Tester corrected.** `cr-test-scenario-catalogue.md` row 124 names "Chin Teck Yung". The sheet's QA column says "Nadhirah" on every row (R4-R13). Jira lists both as QA.

## 2. What the ticket changed, as the TS shows it

1. **Takaful options unhidden.** Objective: "To verify  in UCD that both Takaful (Comprehensive) and Takaful (TPFT) insurance options are unhidden and correctly displayed on the Insurance Quotation page according to the updated priority sequence." (Takaful UI changes, R2).
2. **New priority sequence** on Insurance Step 1 – All Quotations: Chubb first, then Takaful (Comprehensive), then Takaful (TPFT) (R4, R11).
3. **Takaful purchase completes end to end**, and the transaction appears in UCD and BO Insurance Transaction Listing (R4-R10).
4. **BO Quote Enquiry** shows both Takaful options, order not enforced (R13).

## 3. Scenarios

### 3a. UCD — eSTM handoff, VN with all insurers (R4-R6)

1. **UCD_9214_TAKINS_TS1** (R4) — order after eSTM Step 6, buy Takaful (Comprehensive). Test VN: "*Test VN that has ALL insurance". Expected: "Ensure Insurance quotation page displays options in the updated priority order (ONLY top 2): ⏎ i. Chubb ⏎ ii. Takaful (Comprehensive) ⏎ iii. Takaful (TPFT)". **Pass**.
2. **UCD_9214_TAKINS_TS2** (R5) — UCD listing, filter "Takaful Malaysia Berhad", [Search Now], [View]. Expected: "The created Takaful insurance transaction is visible on the Insurance Transaction Listing page." **Pass**.
3. **BO_9214_TAKINS_TS3** (R6) — same check in BO, [Search]. **Pass**.

### 3b. UCD — eSTM handoff, Takaful-only VN (R7-R9)

1. **UCD_9214_TAKINS_TS3** (R7) — Test VN: "*Test VN that has ONLY has Takaful". Expected order: "i. Takaful (Comprehensive) ⏎ ii. Takaful (TPFT)". Buy Comprehensive. **Pass**.
2. **UCD_9214_TAKINS_TS4** (R8) — UCD listing, same as TS2. **Pass**.
3. **BO_9214_TAKINS_TS5** (R9) — BO listing, same as TS3. **Pass**.

### 3c. UCD — 69E redirect, no Chubb (R10)

1. **UCD_9214_TAKINS_TS6** — Test VN: "*Test VN that has NO Chubb insurance but HAS either Lonpac or TM". Trigger VEL69E at eSTM Step 4, land on Insurance Step 1, buy **Takaful (TPFT)**. Expected order: "i. Takaful (Comprehensive) ⏎ ii. Takaful (TPFT)". **Pass**.

### 3d. UCD — Get A Free Quote (R11)

1. **UCD_9214_TAKINS_TS7** — "To check insurance qoute without eSTM flow", VN with all insurers. Expected: "Ensure the insurance quotation page displays ALL options in the updated priority sequence: ⏎ i.Chubb ⏎ ii. Takaful (Comprehensive) ⏎ iii. Takaful (TPFT) ⏎ iv. Lonpac ⏎ v. Tokio Marine". **Pass**.

### 3e. BO — Insurance Quote Enquiry (R13)

1. **BO_9214_TAKINS_TS1** — [Insurance Quote Enquiry] → VN + IC → [Show Result] → [Get Quote]. Expected: both Takaful options displayed. **Pass**.

## 4. Business rules and system behaviour

1. **eSTM top 2 = three cards when Takaful is in it:** "displays options in the updated priority order (ONLY top 2): ⏎ i. Chubb ⏎ ii. Takaful (Comprehensive) ⏎ iii. Takaful (TPFT)" (Takaful UI changes, R4). Consistent with "Takaful counts once" in `eauto-insurance.md` § Quote sequence item 2.
2. **Free Quote shows all insurers, full order:** "i.Chubb ⏎ ii. Takaful (Comprehensive) ⏎ iii. Takaful (TPFT) ⏎ iv. Lonpac ⏎ v. Tokio Marine" (R11).
3. **No Chubb → Takaful leads:** for a VN with "NO Chubb insurance but HAS either Lonpac or TM", the expected top is "i. Takaful (Comprehensive) ⏎ ii. Takaful (TPFT)" (R10). So Takaful ranks above Lonpac and Tokio Marine `[unconfirmed — inferred from R10 and R11]`.
4. **69E redirect preconditions:** "With Insurance Permission = Yes and Insurance Quotation = Available, confirm that the system redirects the user to Insurance Step 1-  All Quotations page." (R10, step 4).
5. **69E error code, two spellings:** step 1 "set the eSTM enquiry response to error code VEL69E"; step 3 "the JPJ Enquiry fails with error VEL000069E" (R10).
6. **Listing filter name:** "select [Insurance Company] → Takaful Malaysia Berhad" (R5, R6, R8, R9). Step 2 of purchase uses "Syarikat Takaful Malaysia Am Berhad (1246486-D)" (9215 sheet, R14).
7. **Search button differs by portal:** UCD "Click [Search Now]" (R5, R8); BO "Click [Search]" (R6, R9).
8. **BO Quote Enquiry order:** "Note: In the Backoffice, ALL insurance quotations will be displayed, but they may not follow the same priority sequence as shown in the UCD." (R13).
9. **eSIM does not return TPFT:** Remarks "Tested by e-sim, in e-sim not show the TPFT" (R4-R9).

## 5. Test data, environments, accounts, setup

1. **Precondition (all rows):** "Ensure that a valid VN is available and eligible for generating Takaful insurance quotations." (R4-R13).
2. **Three VN profiles:** "*Test VN that has ALL insurance" (R4, R11), "*Test VN that has ONLY has Takaful" (R7), "*Test VN that has NO Chubb insurance but HAS either Lonpac or TM" (R10). No actual VN values written.
3. **Data source:** eSIM for R4-R9 (Remarks). R10, R11 and R13 have no remark — source not stated.
4. **69E setup:** "In Step 4, before clicking [Make Payment], set the eSTM enquiry response to error code VEL69E." (R10).
5. **Environment:** **not written**. **No VN, IC, login or credentials** in the sheet.

## 6. Gaps or risks a regression should still cover

1. **TPFT never seen on the eSTM path with eSIM.** R4 and R7 expect "Takaful (TPFT)" in the order, yet the remark says "in e-sim not show the TPFT" and both are Pass. The TPFT position in TS1 / TS3 was likely **not verified** `[unconfirmed]`. Use live API data for TPFT.
2. **Order is out of date.** Tokio Marine (car) is hidden from July 2026 (`business-rules-from-test-scenarios.md` item 9, EAINT-11977 & 12020). R11's five-insurer order must **not** be reused as an expected value. Take the order from the newest sequence CR.
3. **Not covered in this TS:**
   1. **TPFT purchase on the normal eSTM path** (only R10 buys TPFT, via 69E).
   2. **Free Quote purchase** (R11 checks the list only).
   3. **East Coast UCDs, company category, Islamic hire purchase, X-Star** sequences (`eauto-insurance.md` § Quote sequence items 3-6).
   4. **Order kept after Back / postcode / variant / Sum Insured change** (EAINT-8467 rules).
   5. **Motorcycles.**
   6. **"Skip, Return to eSerahan"** escape on the 69E landing page (`flow-insurance-purchase.md` line 56).
4. **Duplicate / mixed ids.** "TS3" is used twice (UCD_9214_TAKINS_TS3 R7, BO_9214_TAKINS_TS3 R6); BO_9214_TAKINS_TS1 (R13) restarts numbering. Cite rows, not ids.
5. **R5 / R8 expected text says "UCD / BO"** on UCD-only rows — copy-paste from the BO rows.

## 7. Contradictions and notes against knowledge/

1. **`cr-test-scenario-catalogue.md` row 124** — tester "Chin Teck Yung"; the sheet's QA column says "Nadhirah" on all rows. The catalogue likely holds the file author `[unconfirmed]`.
2. **`eauto-insurance.md` § Takaful Malaysia item 9** cites "EAINT-9214 TS R5" for the "Takaful Malaysia Berhad" filter — **correct** (also R6, R8, R9).
3. **`flow-zurich-takaful.md` §7** cites the R4-R9 eSIM remark — **correct**.
4. **`business-rules-from-test-scenarios.md` item 8** (BO Quote Enquiry note, row 13) — **correct**.
5. **`eauto-insurance.md` § Quote sequence** has no Takaful-vs-Lonpac/Tokio Marine rank and no Free Quote full order. This TS adds both (R10, R11), now partly superseded by the Tokio Marine hide.
6. **`flow-insurance-purchase.md` line 316** — 69E capture "shows exactly two cards (Chubb, Takaful)". Consistent with a Chubb-first order; R10's VN had no Chubb, so it is a different case.

## Knowledge candidates

1. **Free Quote full order as of EAINT-9214 (Dec 2025):** "i.Chubb ⏎ ii. Takaful (Comprehensive) ⏎ iii. Takaful (TPFT) ⏎ iv. Lonpac ⏎ v. Tokio Marine", marked as superseded by the July 2026 Tokio Marine hide. Target: `eauto-insurance.md` § Quote sequence. Source: EAINT-9214 TS, sheet "Takaful UI changes", R11.
2. **No-Chubb VN → Takaful (Comprehensive), Takaful (TPFT) lead.** Target: `eauto-insurance.md` § Quote sequence. Source: same sheet, R10. `[unconfirmed]` that this holds after later sequence CRs.
3. **Takaful-only VN shows both Takaful cards** "i. Takaful (Comprehensive) ⏎ ii. Takaful (TPFT)". Target: `eauto-insurance.md` § Quote sequence. Source: same sheet, R7.
4. **69E redirect needs "Insurance Permission = Yes and Insurance Quotation = Available"**. Target: `flow-insurance-purchase.md` 69E row. Source: same sheet, R10 step 4.
5. **eSIM returns no TPFT quote** — "Tested by e-sim, in e-sim not show the TPFT". Target: `esim.md` (check first whether already present). Source: same sheet, R4-R9 Remarks.
6. **Listing search button: UCD "[Search Now]", BO "[Search]"**. Target: `flow-insurance-purchase.md` listing section. Source: same sheet, R5 vs R6.
7. **Catalogue row 124 tester** should read "Nadhirah" (sheet QA column). Source: same sheet, R4-R13.
8. **From the 9215 workbook (kept from previous study):**
   1. **Takaful labels on Steps 2/3 plan block** — "Total Sum Covered" and "Period of Takaful". Target: `flow-insurance-purchase.md`. Source: EAINT-9215 TS, sheet "UI - Insurance Purchase", R14 and R23.
   2. **Step 3 Takaful summary has "Rounding:" and no "Total Contribution:"; Step 2 has "Total Contribution:"**. Target: `flow-insurance-purchase.md`. Source: same sheet, R15 vs R24.
   3. **Step 4 success message (Takaful):** "Your insurance or takaful is now created. A copy of the certificate will be sent to your registered email by the insurance or takaful provider." Target: `eauto-insurance.md` § Takaful Malaysia. Source: same sheet, R28.
   4. **Payment Failed page rule:** only [Try Again], link "Go to Insurance Transaction Listing", and "Refund & Cancellation section is  NOT display". Target: `flow-insurance-purchase.md`. Source: same sheet, R30.
   5. **Step 3 hyperlinks:** "Privacy Policy", "Terms of Use", "Product Disclosure Sheet (latest English version)". Target: `eauto-insurance.md` § Takaful Malaysia item 8. Source: same sheet, R24.
   6. **Plan documents reachable from two buttons:** Step 1 "[+More Info]" and Step 2 "[View Plan Details]". Target: `flow-insurance-purchase.md`. Source: same sheet, R8 and R17. Step 2 button name `[unconfirmed]` (R19-R20 say "[+More Info]").
   7. **9215_INS_TS12 Failed with no follow-up recorded.** Target: `cr-test-scenario-catalogue.md` row 095. Source: sheet "Insurance Homepage", R15.
   8. **Catalogue row 095 counts are rows, not result cells** — 16 Purchase rows hold 32 results; Overall Progress shows 30. Target: `cr-test-scenario-catalogue.md` row 095. Source: sheet "Overall Progress", R6.

---

## Appendix — sibling workbook EAINT-9215 (kept from previous study)

Source: `EAINT-9215 - ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad.md` (captured 28/10/2026, 9:33:24 am). Not re-checked in this run.

### A1. Header

1. **Workbook ticket:** EAINT-9215 — "To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad".
2. **Portal / module:** **UCD → Insurance** (Homepage and purchase Steps 1-4). Portal column says "UCD" on every filled row (Insurance Homepage R4-R7, R12-R17).
3. **Library:** "eAuto - CR Test Scenarios"; modified **04/12/2025, 4:29:56 pm**.
4. **Sheets:** "Overall Progress", "Insurance Homepage", "UI - Insurance Purchase".
5. **Scenario count:** **28 rows** — 12 on Insurance Homepage, 16 on UI - Insurance Purchase. Purchase rows each have **two results** (TPFT and Comprehensive) = 32 result cells.
6. **Results:**
   1. Insurance Homepage: **11 Pass, 1 Failed** (9215_INS_TS12).
   2. UI - Insurance Purchase: **32 PASS** cells, 0 fail.
   3. Overall Progress hard-codes Purchase as "30" Pass / "30" Count / "1" (100%), and the total as "41" Pass, "42" Count, "0.9761904761904762" (Overall Progress R6-R7). The live count is 32, so the summary is **stale by 2** `[unconfirmed]`.
7. **Testers (QA column):** "Nadhirah" (all Homepage rows; Comprehensive result on R30), "Nabila" (eSTM-path Purchase rows), "Teck Yung" (Get A Free Quote rows and Step 2 wording R14-R15).
8. **Dates:** none written in the sheet.

### A2. What the ticket changed

1. **Wording, not logic.** Every scenario checks labels, titles, disclaimers or document links.
2. **"Insurance" becomes "Insurance or Takaful"** across the UCD Insurance Homepage (Insurance Homepage R4-R15).
3. **Takaful-only terms on Takaful cards and pages:** "Sum Covered", "Takaful Contribution", "Contribution after NCD", "Total Sum Covered", "Period of Takaful", "Basic Contribution", "Gross Contribution", "Total Contribution" (UI - Insurance Purchase R6, R14, R15).
4. **Distributor disclaimer on Step 2**, **commission / PDS disclaimer on Step 3**, **Refund and Cancellation block on Step 4 success only** (R15, R24, R28).
5. **New STMAB product documents** (PDS + Certificate Wording, BM + EN, "08-2025") linked from Step 1 [+More Info] and Step 2 [View Plan Details] (R8-R11, R17-R20).

### A3. Scenarios

1. **Insurance Homepage — labels (R4-R10):**
   1. **9215_INS_TS01** — section labels. Expected: "a.) Online Services - Motor Insurance or Takaful ⏎ b.) Home / Motor Insurance or Takaful". **Pass**.
   2. **9215_INS_TS02** — page title. Expected: "Page title displays “INSURANCE OR TAKAFUL”." **Pass**.
   3. **9215_INS_TS03** — listing button. Expected: "Button displays “INSURANCE OR TAKAFUL TRANSACTION LISTING” and redirects correctly on click." **Pass**.
   4. **9215_INS_TS04** — permission button. Expected: "Button displays “UPDATE INSURANCE OR TAKAFUL PERMISSION”." **Pass**.
   5. **9215_INS_TS05** — no leftover wording. Expected: "No old Insurance-only labels remain; all are updated with “or Takaful”." **Pass**.
   6. **9215_INS_TS06** — buttons and links still work. Expected: "All navigation functions correctly. No broken links or missing pages." **Pass**.
   7. **9215_INS_TS08** — browsers "Chrome, Edge, Firefox". Expected: "All updated labels render correctly in all tested browsers." **Pass**. (**No TS07** in the sheet.)
2. **Insurance Homepage — Contact Info and services (R12-R17):**
   1. **9215_INS_TS09** — Expected: "Header displays “Insurance Companies or Takaful Operator Contact Info”." **Pass**.
   2. **9215_INS_TS10** — Expected: "Text displays “Instant quotes from our insurance partners or takaful operator”." **Pass**.
   3. **9215_INS_TS11** — Expected: "Text displays “Insurance or Takaful plans and benefits comparison”." **Pass**.
   4. **9215_INS_TS12** — Expected: "Text displays "Thorough product information via Product Disclosure Sheet or Policy Wording or Certificate Wording"". **Failed** — no remark, no QA-Issue key written.
   5. **9215_INS_TS13** — Expected: "Takaful pop up is displayed and all details are displayed correctly." **Pass**.
3. **Step 1 — Quotation page (R6-R11):**
   1. **UI_STP1_INQP_TS1** (eSTM) — Expected: "Sum Covered ⏎ - Takaful Contribution ⏎ - Contribution after NCD". **PASS / PASS**.
   2. **UI_PDS_CW_TS1 – TS4** — PDS and Certificate Wording BM + EN via [+More Info], eSTM and Get A Free Quote paths. Expected: "Open the correct document in a new tab or window. ⏎ - Display the latest version of the PDS." **PASS / PASS** each.
4. **Step 2 — Optional Coverage (R14-R20):**
   1. **UI_STP2_INQP_TS1** (R14) — "Company: - Syarikat Takaful Malaysia Am Berhad (1246486-D) ⏎ - Takaful Plan: ⏎ - Total Sum Covered: ⏎ - Period of Takaful:". **PASS / PASS**.
   2. **UI_STP2_INQP_TS1** (R15, **duplicate id**) — Quotation labels + distributor disclaimer. **PASS / PASS**.
   3. **UI_PDS_CW_TS5 – TS8** — documents via [View Plan Details] (eSTM) and [+More Info] (Free Quote). **PASS / PASS** each.
5. **Step 3 — Payment (R23-R25):** **UI_STP3_INQP_TS1** ×3 (R23 plan block; R24 labels + disclaimer + hyperlinks; R25 identical to R24). **PASS / PASS** each.
6. **Step 4 — Confirm (R28-R30):** **UI_STP4_INQP_TS1** success + Refund block; **UI_STP4_INQP_TS2** Payment Failed page. **PASS / PASS** each.

### A4. Business rules (9215 sheet "UI - Insurance Purchase" unless stated)

1. **Step 2 Quotation labels:** "Sum Covered: ⏎ - Basic Contribution: ⏎ - NCD (0.0%): ⏎ -  All Drivers: ⏎ - Contribution After NCD: ⏎ - Optional Coverage: ⏎ - Gross Contribution: ⏎ - Gross Contribution: ⏎ - Service Tax: ⏎ - Stamp Duty: ⏎ - Total Contribution: ⏎ - Disclaimer:" (R15). "Gross Contribution" listed **twice** `[unconfirmed]` typo.
2. **Step 2 distributor disclaimer:** "This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor of Takaful Malaysia" (R15).
3. **Step 3 labels** end "Stamp Duty: ⏎ - Rounding: ⏎ - Disclaimer:" — **no "Total Contribution"**, spelt "Optinal Coverage:" (R24).
4. **Step 3 disclaimer:** "By continuing, you agree to our Privacy Policy and Terms of Use, you declare to have read, understood and accepted the selected insurer’s or takaful operator’s Product Disclosure Sheet and acknowledge your duty to exercise reasonable care in furnishing information, further declaring that you have provided the information fully and accurately. Furthermore, a standard commission associated with the product will be applied when you proceed with the purchase of this product on this platform. ⏎ Alternatively, for commission-free purchase of similar product, you may visit our respective insurance partner’s or takaful operator’s website or any of their physical branches." (R24).
5. **Step 3 hyperlinks:** "1. Privacy Policy ⏎ 2. Terms of Use ⏎ 3. Product Disclosure Sheet (latest English version)" (R24).
6. **Step 4 success message:** "Your insurance or takaful is now created. A copy of the certificate will be sent to your registered email by the insurance or takaful provider." (R28).
7. **Refund block on success only:** "Ensure will display disclaimer for ONLY successful created insurance ⏎ ⏎ - Refund and Cancellation ⏎ Customers who have participated to the takaful product through our website may request a refund or cancel their takaful coverage. ⏎ Kindly refer to the intermediary or the Takaful Operator’s Customer Service Unit (CSU) for further details." (R28).
8. **Payment Failed page:** "- Error Code: (Message) ⏎ - Vehicle No.: ⏎ - Payment ID: ⏎ - Payment Date: ⏎ - Payment Amount:", "ONLY one button is displayed on the page: ⏎ - Try Again", "Go to Insurance Transaction Listing", "Ensure Refund & Cancellation section is  NOT display" (R30).
9. **Document link names (Aug 2025 set):** "[STMAB PDS(BM) Takaful myMotor-Kenderaan Persendirian V01 08-2025]", "[STMAB PDS(E) Takaful myMotor-Private Car V01 08-2025]", "[STMAB Certificate Wording ⏎ Takaful myMotor - Kereta Persendirian V1.0 (BM) 08-2025]", "[STMAB Certificate Wording Takaful myMotor-Private Car V1.0 (E) 08-2025]" (R8-R9).
10. **Takaful logo popup:** "Takaful pop up is displayed and all details are displayed correctly." (Insurance Homepage, R17). Matches `flow-insurance-purchase.md` selector `img.dialog-btn[value="takaful-dialog"]`.

### A5. Setup and gaps (9215)

1. **Entry paths:** "UCD land on Insurance after ⏎ Successful payment in eSTM Step 6" (R6) and "To check  in Free Qoute without eSTM flow" (R10).
2. **Browsers:** "Chrome, Edge, Firefox" (Insurance Homepage, R10). No environment, VN, IC or credentials written.
3. **Payment Failed path** steps say "After sucessful make payment", contradicting the objective "Payment Failed" (R29-R30).
4. **9215_INS_TS12 failed** with no follow-up recorded.
5. **Document versions are stale** — current are "V2 02-2026" (PDS) and "V2.0 … 05-2026" (Certificate Wording) per `eauto-insurance.md` § Takaful Malaysia item 5.
6. **Not covered:** BM page labels; Listing / Details / BO / CIBO / Service Portal / email / e-Cert wording; non-Takaful cards keeping "Sum Insured / Premium"; mobile layout; Contribution maths.
7. **Duplicate ids** (UI_STP2_INQP_TS1 ×2, UI_STP3_INQP_TS1 ×3), missing 9215_INS_TS07, R25 = R24, Overall Progress stale (30 vs 32).
8. **`flow-insurance-purchase.md`** Step 2/3 plan block lists "Total Sum Insured" / "Period of Insurance"; for Takaful the TS expects "Total Sum Covered" / "Period of Takaful" (R14, R23).
