# EAINT-9564 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9564 - [eAuto-Insurance][Web] To Create Control Sequence V1 for East Coast.md` (cell text only; formatting and images not kept). All 5 sheets read in full.
2. **Ticket folders:** `_reference/tickets/EAINT-9564/` held nothing before this study. `_reference/tickets/Studying/EAINT-9564/` does not exist.
3. **lib/ticketStudies.ts:** no EAINT-9564 entry.
4. **knowledge/:** `cr-test-scenario-catalogue.md` row 102 and line 454; `eauto-insurance.md` § Quote sequence; `business-rules-from-test-scenarios.md` § 6.1 and popup rules; `flow-ucd-shell.md` popup section; `flow-insurance-purchase.md` (69E redirect, popup code order).
5. **Not read:** the Jira ticket and its SRD (no copy in the repo). Ticket EAINT-9665 linked from the sheet was not read.

## 1. Header

1. **Ticket:** EAINT-9564 — "[eAuto-Insurance][Web] To Create Control Sequence V1 for East Coast".
2. **Module / portal:** **UCD Insurance** (quotation page Step 1), **UCD Homepage**, **Insurance Homepage**, **Insurance Listing Page**, and **BO > Insurance Quote Enquiry**.
3. **Workbook:** "EAINT-9564 - [eAuto-Insurance][Web] To Create Control Sequence V1 for East Coast.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 22/01/2026, 10:55:21 am.
4. **Sheets (5):** "Sequence control", "Popup display", "Prod Regression (Sequence)", "Prod Regression (Popup)", "Sheet1".
5. **Scenario count: 104.**
   1. Sequence control: **27** (TS1–TS27) — all "Pass".
   2. Popup display: **41** (TS1–TS41) — all "PASS".
   3. Prod Regression (Sequence): **6** — all "PASS".
   4. Prod Regression (Popup): **6** — all "PASS".
   5. Sheet1: **24** popup-design rows (TS1–TS24) — **no QA or result column filled**; 6 of them have no expected result. Treated as a draft/working sheet [unconfirmed].
6. **Result total:** 80 Pass, 0 Fail, 24 not recorded (Sheet1).
7. **Testers:** QA column holds two names, "Zuhaira" and "Nick". No test dates in the sheet. The catalogue lists the workbook author as a third QA engineer `[knowledge/cr-test-scenario-catalogue.md:63]`.
8. **Environment:** "Test environment: staging/preprod1" `[Sequence control, R3]`.

## 2. What the ticket changed (as the TS shows it)

1. **East Coast (EC) control sequence.** UCDs in **Kelantan, Terengganu, Pahang** get a new insurer order with **Syarikat Takaful Malaysia first**. Other UCDs keep the "existing sequence" (Chubb first).
2. **East Coast popup.** A new EC popup on UCD Homepage and Insurance Homepage, and an EC banner on the Insurance Listing Page, shown only to EC UCDs, for 30 days.
3. **Objective quote:** "To verify the insurance control sequence and popup display for UCD registered in East Coast" `[Sequence control, R5]`.

## 3. Scenarios

### 3a. Sequence control — East Coast (R8 banner "EAST COAST")

1. **TS1** — Main UCD, HQ Kelantan, eSTM (MyKad) Step 5 paid → Insurance Step 1; also variant/postcode/sum insured change, Back from Step 2/3, MessageBird disabled, purchase to complete. Expected: "Display ONLY top 2 available insurance based on EC sequence: 1. Syarikat Takaful Malaysia ((Third Party, Fire & Theft (TFT))✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[R9]`.
2. **TS2 / TS3** — Main / Sub UCD, HQ Pahang, branch Terengganu, eSTM (MyPR) VEL000069E (Non-Xstar), only Chubb and Tokio Marine quoted. Expected: "1. Chubb✅ 2. Tokio Marine✅" `[R10, R11]`.
3. **TS4** — Main UCD, HQ Kelantan, branch non-EC, Xstar, 69E via resubmit from eSTM Listing. Expected: "Display ALL available insurance based on EC sequence" — Takaful TFT, Takaful Comprehensive, Chubb, Lonpac, Tokio Marine `[R12]`.
4. **TS5** — Same as TS4 but **Sub UCD**. Expected: "Display ALL available insurance based on existing XStar handling: 1. Syarikat Takaful Malaysia (Comprehensive)✅ 2. Chubb✅ 3. Lonpac✅ 4. Tokio Marine✅" `[R13]`.
5. **TS6 / TS7** — Main / Sub UCD, HQ non-EC, branch Pahang, eSTM (Company) approved → Details Page insurance banner "[Get Free Quote for {vn}]". Expected: "1. Chubb✅" only `[R14, R15]`.
6. **TS8 / TS9** — Sub / Main UCD, HQ Terengganu, branch non-EC, Get a Free Quote (Company) after eSTM approved. TS8 (Sub) expected "1. Chubb ✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[R16]`; TS9 (Main) expected Takaful TFT, Takaful Comprehensive `[R17]`.
7. **TS10** — Main UCD, Kelantan, Get a Free Quote (Individual) without eSTM. Expected: "Display TOP 4 available insurance based on EC sequence" — lists all 5 cards `[R18]`.
8. **TS11** — BO Insurance Quote Enquiry, Company. Expected: "Display ALL available insurance" — Takaful TFT, Takaful Comprehensive, Chubb; "BO won't have any specific sequence" `[R19]`.
9. **TS12 / TS13** — Bike, Sub / Main UCD, Terengganu, Get a Free Quote. Expected: "1. Tokio Marine (Comprehensive) ✅ 2. Tokio Marine (TPFT) ✅" `[R20, R21]`.
10. **TS14** — Special: Main UCD Kelantan; at Step 2, BO "Manage Company detaills" changes state to non-EC; Back to Step 1. Expected: before = Takaful TFT, Takaful Comprehensive; after = "1. Chubb✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[R22]`.

### 3b. Sequence control — Other than East Coast (R23 banner)

1. **TS15** — Main UCD, non-EC, Step 5 paid. Expected: "1. Chubb✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[R24]`.
2. **TS16 / TS17** — Main / Sub UCD, HQ Johor, branch Selangor, 69E Non-Xstar, no Takaful. Expected: "1. Chubb✅ 2. Lonpac✅" `[R25, R26]`.
3. **TS18** — Main UCD, non-EC, Xstar 69E resubmit, purchase to complete, eSTM to Approved. Expected: Takaful Comprehensive, Chubb, Lonpac, Tokio Marine; "Confirmed with BA for XStar there is no specific sequence" `[R27]`.
4. **TS19 / TS20** — Sub / Main UCD, Details Page banner, only Takaful TFT and Chubb. Expected: "1. Chubb ✅ 2. Syarikat Takaful Malaysia ((Third Party, Fire & Theft (TFT))✅" `[R28, R29]`.
5. **TS21** — Main UCD, Kedah, Get a Free Quote (Individual) after eSTM approved. Expected: Chubb, Takaful Comprehensive, "Order - Existing" `[R30]`.
6. **TS22 / TS23** — Main / Sub UCD, Melaka/Selangor, Get a Free Quote (Company) without eSTM. Expected: "Display ALL available insurance: 1. Chubb✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[R31, R32]`.
7. **TS24** — "BO > Insurance Quote Enquiry", Individual, all 5 quoted. Expected: all 5 shown `[R33]`. The User column says "Main UCD", not "BackOffice" — likely a copy slip [unconfirmed].
8. **TS25 / TS26** — Bike, Sub / Main UCD, non-EC. Expected: Tokio Marine Comprehensive, Tokio Marine TPFT `[R34, R35]`.
9. **TS27** — Special: Main UCD non-EC → BO changes state to Pahang at Step 2 → Back to Step 1. Expected: before "1. Chubb✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅"; after Takaful TFT, Takaful Comprehensive `[R36]`.

### 3c. Popup display (41 rows)

1. **Homepage TS1–TS14** `[R4–R17]` — EC popup shown or not per HQ/branch and Main/Sub. TS11–TS12: "To verify system not showing EC popup on 31st day".
2. **Insurance Homepage TS15–TS28** `[R18–R31]` — expected either "1. East Coast Popup" or "System not showing any popup". TS25–TS26: not shown on 31st day.
3. **Insurance Listing Page TS29–TS41** `[R32–R44]` — "System show banner sequence as follow" with "East Coast Popup" and/or "CNY Campaign". TS38–TS39: not shown on 31st day.

### 3d. Prod Regression (Sequence) — 6 rows

1. **TS1** — UCD, Car, Sub UCD, "LD1968", EC. Expected: "1. Takaful (TPFT/Comprehensive) 2. Takaful (TPFT/Comprehensive) 3. Chubb 4. Lonpac 5. Tokio Marine" `[R7]`.
2. **TS2** — UCD, Car, Main UCD, non-EC. Expected: "1. Chubb 2. Takaful (TPFT/Comprehensive) 3. Takaful (TPFT/Comprehensive) 4. Lonpac 5. Tokio Marine" `[R8]`.
3. **TS3 / TS4** — Bike "JUH760", EC / non-EC. Expected: "Should show ALL insurance (sequence is random)" — Tokio Marine Comprehensive, Tokio Marine TPFT `[R9, R10]`.
4. **TS5** — BO, Car. Expected: "Should show ALL insurance (sequence is random)" `[R11]`.
5. **TS6** — BO, Bike. Expected: "1. Lonpac 2. Tokio Marine (Comprehensive) 3. Tokio Marine (TPFT)" `[R12]`.

### 3e. Prod Regression (Popup) — 6 rows

1. **TS1** — EC, Main UCD, Chrome, UCD homepage: "1. East Coast Popup 2. Company Update Popup (if available)" `[R6]`.
2. **TS2** — EC, Sub UCD, Firefox, Insurance Homepage: "1. Web socket popup 2. East coast popup 3. Company Update Popup (if available)" `[R7]`.
3. **TS3** — EC, Main UCD, Insurance Listing: "Ensure to show East Coast banner" `[R8]`.
4. **TS4** — Non EC, Sub UCD, Firefox, UCD homepage: "1. Web socket popup 2. Company Update Popup (if available)" `[R9]`.
5. **TS5** — Non EC, Main UCD, Insurance Homepage: "No popup" `[R10]`.
6. **TS6** — Non EC, Sub UCD, Insurance Listing: "Ensure to East Coast banner not showing" `[R11]`.

### 3f. Sheet1 — popup design rotation (24 rows, no results)

1. **Design 1** days 1–10, **Design 2** days 11–20, **Design 3** days 21–30, none on day 31 — on Homepage (TS1–TS8), Insurance Homepage (TS9–TS16), Insurance Listing (TS17–TS24) `[Sheet1, R18–R41]`.
2. Example: "To verify system show popup Design 2 on 11th day" `[Sheet1, R20]`; "To verify system not showing popup on 31st day" `[Sheet1, R24]`.

## 4. Business rules and system behaviour

1. **EC sequence puts Takaful first.** "Display ONLY top 2 available insurance based on EC sequence: 1. Syarikat Takaful Malaysia ((Third Party, Fire & Theft (TFT))✅ 2. Syarikat Takaful Malaysia (Comprehensive)✅" `[Sequence control, R9]`.
2. **Full EC order (prod):** "1. Takaful (TPFT/Comprehensive) 2. Takaful (TPFT/Comprehensive) 3. Chubb 4. Lonpac 5. Tokio Marine" `[Prod Regression (Sequence), R7]`.
3. **Full existing (non-EC) order (prod):** "1.  Chubb 2. Takaful (TPFT/Comprehensive) 3. Takaful (TPFT/Comprehensive) 4. Lonpac 5. Tokio Marine" `[Prod Regression (Sequence), R8]`.
4. **Takaful TFT vs Comprehensive order is random.** "Notes: as cofirmed with BA, sequence between takaful quotations only can be random" `[Sequence control, R9, R17, R18]`.
5. **Top 2 after eSTM = two Takaful cards only.** TS1 expects only the two Takaful cards, with no Chubb third card `[Sequence control, R9]`. This conflicts with the later rule "Takaful - Comprehensive & TPFT is counted as one insurance" `[knowledge/eauto-insurance.md:188, from EAINT-9713]`. Either EAINT-9713 changed it, or the rules differ [unconfirmed].
6. **Get a Free Quote without eSTM, EC Individual:** "Display TOP 4 available insurance based on EC sequence" — 5 cards listed `[Sequence control, R18]`. Consistent with Takaful counting once (4 insurers, 5 cards) [unconfirmed].
7. **Main UCD follows HQ state; Sub UCD follows its branch state** [unconfirmed, inferred from rows]:
   1. TS6 Main UCD, HQ non-EC, branch Pahang → "existing sequence" `[Sequence control, R14]`; TS7 Sub UCD same setup → "based on EC sequence" `[R15]`.
   2. TS8 Sub UCD, HQ Terengganu, branch non-EC → "existing sequence" `[R16]`; TS9 Main UCD same setup → "EC sequence" `[R17]`.
   3. Sheet1 summary: "UCD is EC, branch of the sub UCD in non EC - show east coast sequence for main UCD, show sub UCD existing sequence" `[Sheet1, R7]`; "UCD is non EC, branch of sub UCD in EC - show east coast sequence for sub UCD, show main UCD existing sequence" `[Sheet1, R9]`. Note: the description text on Sheet1 R6–R11 does not line up with the HQ/Branch cells on the same rows.
8. **Company category:** "company will only have Chubb & Takaful" `[Sequence control, R14, R15, R19]`. TS6/TS7 setups quote only Chubb.
9. **X-Star:** "Note: Confirmed with BA for XStar there is no specific sequence" `[Sequence control, R13, R27]`. X-Star rows that expect "existing XStar handling" drop Takaful TFT `[R13, R27]`; TS4 (Main UCD, EC HQ) lists TFT `[R12]`. Why TFT drops is not stated [unconfirmed].
10. **BO Insurance Quote Enquiry has no sequence.** "* as confirmed with dev and BA, BO won't have any specific sequence. Sequence will be shown randomly" `[Sequence control, R19]`.
11. **Bike quotes** are Tokio Marine only on UCD: "1. Tokio Marine (Comprehensive) ✅ 2. Tokio Marine (TPFT) ✅" `[Sequence control, R20]`; EC makes no difference `[R34, R35]`. BO bike also showed Lonpac: "1. Lonpac 2. Tokio Marine (Comprehensive) 3. Tokio Marine (TPFT)" `[Prod Regression (Sequence), R12]`.
12. **State change applies without re-login.** TS14: "Go to BO > Manage Company detaills and update the state to non East Coast ⏎ 7. On UCD side, BACK to Step 1" → order switches to existing `[Sequence control, R22]`. TS27 is the reverse `[R36]`.
13. **Order holds across Back and re-quote.** Every sequence row repeats "Verify the priority order and visibility" after "Proceed to Insurance Step 2, BACK to Step 1" and "Proceed to Insurance Step 3, BACK to Step 1" `[Sequence control, R9–R36]`.
14. **MessageBird disabled** on insurance selection: "Select any insurance quotation, ensure messagebird is disabled" `[Sequence control, R9, R27]`.
15. **Entry points tested:** eSTM Step 5 payment; VEL000069E at "Step 4 to 5 JPJ Enquiry"; 69E on "resubmit from eSTM Transaction Listing Page"; Details Page "[Get Free Quote for {vn}]"; Insurance > Get a Free Quote; BO Insurance Quote Enquiry `[Sequence control, R9–R19]`.
16. **EC popup audience** follows the same Main/Sub rule. TS5 Main UCD, EC HQ, non-EC branch → EC popup; TS6 Sub UCD → no EC popup `[Popup display, R8, R9]`. Insurance Homepage TS17 Main UCD, non-EC HQ, EC branch → "System not showing any popup"; TS18 Sub UCD → "1. East Coast Popup" `[Popup display, R20, R21]`.
17. **EC popup lasts 30 days.** "To verify system not showing EC popup on 31st day" `[Popup display, R14]`. Design rotates every 10 days `[Sheet1, R18–R24]`.
18. **Popup order in that campaign:** "1. Web Socket popup 2. East Coast Popup 3. CNY Campaign 4. Company Update Popup (if available)" `[Popup display, R11]`. Campaign-specific; not a fixed rule (see memory rule on campaign popup order).
19. **Insurance Listing shows an EC banner, then CNY:** "System show banner sequence as follow 1. East Coast Popup 2. CNY Campaign" `[Popup display, R32]`.
20. **Web Socket popup appears only in Firefox rows.** Every row expecting "Web Socket popup" is Firefox (e.g. `[Popup display, R5, R7, R8, R11, R13, R15]`; `[Prod Regression (Popup), R7, R9]`); no Chrome row lists it [unconfirmed — pattern only].
21. **Company Level Insurance Permission column** has ❌ on some rows (TS4, TS7, TS10, TS12, TS14), yet TS4 still expects the EC popup `[Popup display, R7]`. Effect of the permission on the EC popup is not stated [unconfirmed].
22. **Related ticket:** Popup TS1 remark: "https://mfservices.atlassian.net/browse/EAINT-9665" `[Popup display, R4]`. Not read.

## 5. Test data, environments, accounts

1. **Environment:** "staging/preprod1" `[Sequence control, R3]`; prod regression sheets for production.
2. **Prod vehicles:** car "LD1968", bike "JUH760" `[Prod Regression (Sequence), R7–R12]`.
3. **UCD setups:** Main UCD / Sub UCD; HQ in Kelantan, Pahang, Terengganu (EC) or Johor, Kedah, Melaka (non-EC); branches in Terengganu, Pahang, Kelantan, Selangor, or "No branch".
4. **eSTM ID types:** MyKad, MyPR, Company, Individual.
5. **Quote availability** set per vehicle with ✅/❌ per insurer in "Pre-Requisite" [unconfirmed how — likely eSIM per vehicle].
6. **Browsers:** Chrome and Firefox.
7. **Credentials:** none in the sheet.

## 6. Gaps or risks for regression

1. **Tokio Marine car** appears in this TS, but knowledge says it is hidden from July 2026 `[knowledge/business-rules-from-test-scenarios.md:394]`. The full 5-insurer car orders here are out of date.
2. **Takaful count rule conflict** (§4 point 5) — check which rule staging follows today.
3. **Sheet1 design rotation** (Design 1/2/3, 30-day window) has no recorded results.
4. **Day-31 cut-off** depends on a date start not given in the sheet; how testers forced day 31 is not written.
5. **BO bike Lonpac** (§4 point 11) is seen only in prod regression; UCD bike shows no Lonpac.
6. **X-Star TFT drop** is not explained.
7. **Permission ❌ effect** on the EC popup is untested as a separate case.
8. **Postcode-based EC** is not covered: the rule is driven by company state, not the quote postcode [unconfirmed]. TS1 changes postcode but keeps the EC order.
9. **Sheet slips:** TS10 "corrEast coasttly" (find-replace artefact) `[Sequence control, R18]`; TS24 User = "Main UCD" for a BO row `[R33]`; TS34 title "EC banner not showing for EC HQ without branch" while expected shows the EC banner `[Popup display, R37]`; step numbers skip in TS15, TS19, TS20.

## 7. Contradictions with knowledge/

1. **`knowledge/eauto-insurance.md:195-197`** says EC top 2 after eSTM is Takaful TFT + Comprehensive citing "rows 9-14". Only R9 and R17 show that; R10–R11 expect Chubb + Tokio Marine (no Takaful quoted), R12–R13 are X-Star "ALL". Citation range is too wide.
2. **`knowledge/flow-insurance-purchase.md:780`** popup code order lists profile update before CNY; this TS expects CNY before Company Update `[Popup display, R11]`. Campaign-specific, not a conflict to raise.
3. **`knowledge/flow-ucd-shell.md:89-90`** says EC popup is "shown only to East Coast HQ or branch UCDs". This TS refines it: Main UCD follows HQ, Sub UCD follows branch (§4 point 16).

## Knowledge candidates

1. **EC full order (car):** "1. Takaful (TPFT/Comprehensive) 2. Takaful (TPFT/Comprehensive) 3. Chubb 4. Lonpac 5. Tokio Marine"; non-EC: "1.  Chubb 2. Takaful (TPFT/Comprehensive) 3. Takaful (TPFT/Comprehensive) 4. Lonpac 5. Tokio Marine". Source: `[from SharePoint TS #102 EAINT-9564, sheet Prod Regression (Sequence), rows 7-8]`. Target: `knowledge/eauto-insurance.md` § Quote sequence.
2. **Takaful TFT/Comprehensive order is random:** "sequence between takaful quotations only can be random". Source: `[sheet Sequence control, row 9]`.
3. **Main UCD follows HQ state, Sub UCD follows branch state** for both sequence and EC popup. Source: `[sheet Sequence control, rows 14-17; sheet Popup display, rows 8-9, 20-21; Sheet1 rows 7, 9]`. Tag [unconfirmed] until an SRD confirms.
4. **BO Insurance Quote Enquiry is random order:** "BO won't have any specific sequence. Sequence will be shown randomly". Source: `[sheet Sequence control, row 19]`.
5. **State change in BO > Manage Company details takes effect on Back to Step 1, no re-login.** Source: `[sheet Sequence control, rows 22, 36]`.
6. **EC popup design rotates:** Design 1 days 1–10, Design 2 days 11–20, Design 3 days 21–30, none day 31. Source: `[Sheet1, rows 18-24]` (no results recorded). Target: `knowledge/flow-ucd-shell.md`.
7. **Insurance Listing EC banner** sits before the CNY banner. Source: `[sheet Popup display, row 32]`.
8. **Web Socket popup seen in Firefox rows only** [unconfirmed]. Source: `[sheet Popup display, rows 5, 7, 8, 11, 13, 15; Prod Regression (Popup), rows 7, 9]`. Could help resolve the open question in `flow-ucd-shell.md:96-97`.
9. **Fix citation** in `knowledge/eauto-insurance.md:197` and `business-rules-from-test-scenarios.md:390`: EC Takaful top 2 is rows 9 and 17, not "rows 9-14".
10. **Prod test vehicles** for insurance sequence: car "LD1968", bike "JUH760". Source: `[sheet Prod Regression (Sequence), rows 7-12]`.
