# EAINT-9713 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9713 - [eAuto - Insurance] To Update Free Quote (Without eSTM) to Show Top 2 Insurers and Count STM Coverages as One.md` (text copy dated "27/10/2026, 9:18:08 pm"). Cell text only. Formatting, colours and images were not kept, so any colour-coded meaning is lost.
2. **Ticket folders:** `_reference/tickets/EAINT-9713/` and `_reference/tickets/Studying/EAINT-9713/` did not exist before this study. No SRD, no Jira export and no Teams notes were found locally.
3. **lib/ticketStudies.ts:** no entry for EAINT-9713.
4. **knowledge/:** EAINT-9713 is cited in `knowledge/eauto-insurance.md:188-191`, `knowledge/business-rules-from-test-scenarios.md:374-376` and `knowledge/cr-test-scenario-catalogue.md:64, 462`.
5. **Context files:** `knowledge/eauto-insurance.md` (§ Quote sequence, § Hak Milik gate), `knowledge/flow-insurance-purchase.md` (entry points, insurer card classes).
6. **Not read:** Jira ticket and SRD. Not available locally, and this run has no Jira access.

## 1. Header

1. **Ticket:** EAINT-9713.
2. **Module / portal:** eAuto **UCD portal → Insurance** (quotation listing / insurer cards on step 1).
3. **Workbook:** "EAINT-9713 - [eAuto - Insurance] To Update Free Quote (Without eSTM) to Show Top 2 Insurers and Count STM Coverages as One.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 27/04/2026, 12:40:47 pm.
4. **Title cell:** "⚪[eAuto - Insurance] To Update Free Quote (Without eSTM) to Show Top 2 Insurers and Count STM Coverages as One" (sheet Takaful Combine TS, R1).
5. **Sheets (3):**
   1. **Takaful Combine TS** — 7 scenarios (9713_TKF_TS1–TS7).
   2. **Get Free Quote Sequence TS** — 12 scenarios (9713_GFQ_TS1–TS12).
   3. **Production Regression** — 8 scenarios (9713_Prod_TS1–TS8).
6. **Total scenarios:** **27**.
7. **Results:** **27 PASS, 0 FAIL, 0 blank.**
8. **Testers (QA column):** Maisarah (6 rows), Zuhaira (21 rows). All 8 Production Regression rows are Zuhaira.
9. **Dates in the sheet:** only one — "Quotation available (as check on prod UCD portal 23/1/2026 3.34pm)" (Production Regression, R6–R13). No staging test dates are written.
10. **Catalogue owner:** `knowledge/cr-test-scenario-catalogue.md:64` lists "Amirul Azfar" for this workbook. That name is not in the sheet. It is probably the SharePoint author / modifier. [unconfirmed]

## 2. What the ticket changed, as the TS shows it

1. **Top 2 insurers on Get a Free Quote without eSTM.** The title says "To Update Free Quote (Without eSTM) to Show Top 2 Insurers". Every GFQ row uses the entry point "Get a Free Quote (without Approved eSTM)" and expects at most 2 insurers. Before this change, GFQ without approved eSTM showed every insurer [unconfirmed — inferred from title and from EAINT-9023, see §4.6].
2. **Takaful counts as one insurer.** "Takaful - Comprehensive & TPFT is counted as one insurance" (Get Free Quote Sequence TS, R2). So "top 2" can show **3 cards**: Takaful (Comprehensive) + Takaful (TPFT) + one other.
3. **Same combine rule after eSTM.** The Takaful Combine TS sheet checks the same rule on four eSTM entry points (step 5 payment, eSTM banner, GFQ after approved eSTM, VEL000069E). The TS treats the combine rule as applying to the eSTM paths too, not only to "without eSTM".
4. **Order depends on UCD state (EC vs Non EC).**
   1. **EC:** Takaful first (Comprehensive, then TPFT), then the next insurer.
   2. **Non EC:** Chubb first, then Takaful (Comprehensive, then TPFT).

## 3. Scenarios

Legend: "Available" = insurers marked ✅ in the "Quotation Available" column. "Comp" = Syarikat Takaful Malaysia (Comprehensive). "TPFT" = Syarikat Takaful Malaysia (TPFT). All rows P1 unless shown.

### 3.1 Takaful Combine TS (after-eSTM entry points)

1. **9713_TKF_TS1** — EC, Main UCD, Individual, "UCD land on Insurance after Successful payment in eSTM Step 5". All 5 available. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT 3. Chubb". PASS.
2. **9713_TKF_TS2** — Non EC, Main UCD, Individual, "UCD land on Insurance through Insurance banner in eSTM Transaction Details Page". All 5 available. Expected "1. Chubb 2. Syarikat Takaful Malaysia (Comprehensive) 3. Syarikat Takaful Malaysia (TPFT)". PASS.
3. **9713_TKF_TS3** — EC, **Sub UCD**, Individual, "Insurance (Get a Free Quote) - After eSTM Approved". **Chubb ❌**. Expected "1. Syarikat Takaful Malaysia (Comprehensive) 2. Syarikat Takaful Malaysia (TPFT) 3. Lonpac". PASS.
4. **9713_TKF_TS4** — Non EC, Main UCD, Individual, "Failed due to VEL000069E in eSTM Step 5 (Non-Xstar)". **Chubb ❌**. Expected "1. Syarikat Takaful Malaysia (Comprehensive) 2. Syarikat Takaful Malaysia (TPFT) 3. Lonpac". PASS.
5. **9713_TKF_TS5** — EC, Main UCD, **Company**, eSTM step 5 payment. Chubb, TPFT, Comp available. Expected "1. Syarikat Takaful Malaysia (Comprehensive) 2. Syarikat Takaful Malaysia (TPFT) 3. Chubb". PASS.
6. **9713_TKF_TS6** — Non EC, Sub UCD, Company, GFQ after eSTM approved. Chubb, TPFT, Comp available. Expected "1. Chubb 2. Syarikat Takaful Malaysia (Comprehensive) 3. Syarikat Takaful Malaysia (TPFT)". PASS.
7. **9713_TKF_TS7** — EC, Main UCD, Company, eSTM step 5 payment, **P2**. Same inputs and expected result as TKF_TS5. PASS.

### 3.2 Get Free Quote Sequence TS (GFQ without approved eSTM)

1. **9713_GFQ_TS1** — Main UCD, EC, Individual. All 5 available. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
2. **9713_GFQ_TS2** — Main UCD, EC, Company. TPFT, Comp, Chubb available. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
3. **9713_GFQ_TS3** — Main UCD, EC, Individual, P2. **TPFT ❌, Comp ❌, Lonpac ❌**. Expected "1. Chubb 2. Tokio Marine". PASS.
4. **9713_GFQ_TS4** — Main UCD, Non EC, Individual. All 5 available. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
5. **9713_GFQ_TS5** — Main UCD, Non EC, Company. TPFT, Comp, Chubb available. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
6. **9713_GFQ_TS6** — Main UCD, Non EC, Company, P2. **Chubb ❌**. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT)". PASS.
7. **9713_GFQ_TS7** — Sub UCD, EC, Individual. All 5 available. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
8. **9713_GFQ_TS8** — Sub UCD, EC, Company. TPFT, Comp, Chubb available. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
9. **9713_GFQ_TS9** — Sub UCD, EC, Individual, P2. **Chubb ❌, Lonpac ❌**. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Tokio Marine". PASS.
10. **9713_GFQ_TS10** — Sub UCD, Non EC, Individual. All 5 available. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
11. **9713_GFQ_TS11** — Sub UCD, Non EC, Company. TPFT, Comp, Chubb available. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
12. **9713_GFQ_TS12** — Sub UCD, Non EC, Individual, P2. **Chubb ❌, Tokio Marine ❌**. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Lonpac". PASS.

### 3.3 Production Regression (Get Free Quote without eSTM, prod UCD portal)

1. **9713_Prod_TS1** — Individual, Main UCD, LD1968, EC. Lonpac ❌. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
2. **9713_Prod_TS2** — Individual, Sub UCD, LD1968, Non EC. Lonpac ❌. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
3. **9713_Prod_TS3** — Company, Sub UCD, LD1968, EC. Expected "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". PASS.
4. **9713_Prod_TS4** — Company, Main UCD, LD1968, Non EC. Expected "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". PASS.
5. **9713_Prod_TS5** — Individual, Sub UCD, VBD2680, EC. **TPFT ❌**. Expected "Should show TOP 2 insurance sequence correctly 1. Takaful (Comprehensive) 2. Chubb". PASS.
6. **9713_Prod_TS6** — Individual, Main UCD, VDG1770, Non EC. **TPFT ❌**. Expected "1. Chubb 2. Takaful (Comprehensive)". PASS.
7. **9713_Prod_TS7** — Company, Main UCD, WGL317, EC. **Comp ❌, Chubb ❌**. Expected "Should show TOP 2 insurance sequence correctly 1. Takaful (TPFT)". PASS.
8. **9713_Prod_TS8** — Company, Sub UCD, VDG1770, Non EC. **TPFT ❌**. Expected "1. Chubb 2. Takaful (Comprehensive)". PASS.

## 4. Business rules and system behaviour

1. **Takaful = one insurer.** "Takaful - Comprehensive & TPFT is counted as one insurance" (Get Free Quote Sequence TS, R2).
2. **EC order: Takaful, then Chubb.** "Quotation sequence show as follow 1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb" (Get Free Quote Sequence TS, R4; same in R5, R10, R11; Takaful Combine TS, R4).
3. **Non EC order: Chubb, then Takaful.** "Quotation sequence show as follow 1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)" (Get Free Quote Sequence TS, R7; same in R8, R13, R14; Takaful Combine TS, R5, R9).
4. **Inside Takaful, Comprehensive comes before TPFT** in every expected result, for both EC and Non EC. This holds even though the "Quotation Available" column lists TPFT first (e.g. Takaful Combine TS, R4).
5. **Fallback when Chubb or Takaful is missing.** The next insurer comes from Lonpac, then Tokio Marine [unconfirmed — inferred, not stated]:
   1. Chubb ❌ → "3. Lonpac" (Takaful Combine TS, R6, R7).
   2. Chubb ❌ and Lonpac ❌ → "3. Tokio Marine" (Get Free Quote Sequence TS, R12).
   3. Chubb ❌ and Tokio Marine ❌ → "3. Lonpac" (Get Free Quote Sequence TS, R15).
   4. Takaful (both) ❌ and Lonpac ❌ → "1. Chubb 2. Tokio Marine" (Get Free Quote Sequence TS, R6).
6. **When one Takaful plan is missing, only 2 cards show.** "Should show TOP 2 insurance sequence correctly 1. Takaful (Comprehensive) 2. Chubb" (Production Regression, R10). Only one card shows if only one insurer returns: "1. Takaful (TPFT)" (Production Regression, R12).
7. **Company category gets only Chubb + Takaful.** Every Company row lists only those three plans (e.g. Get Free Quote Sequence TS, R5). This matches the existing rule in `knowledge/eauto-insurance.md:198-199`. If Chubb is missing, the Company list ends at Takaful: "1. Takaful (Comprehensive) 2. Takaful (TPFT)" (Get Free Quote Sequence TS, R9).
8. **Sub UCD follows the same EC / Non EC order as Main UCD.** Compare GFQ_TS7–TS12 with GFQ_TS1–TS6 (Get Free Quote Sequence TS, R4–R15).
9. **VEL000069E path counts.** "UCD land on insurance after Failed due to VEL000069E in eSTM Step 5 (Non-Xstar)" (Takaful Combine TS, R7). The note "(Non-Xstar)" fits the existing rule that X-Star has "no specific sequence" (`knowledge/eauto-insurance.md:192-194`).

### 4.1 Where this changes or contradicts knowledge/

1. **EAINT-9023 rule is superseded.** `knowledge/business-rules-from-test-scenarios.md:383-384` says "Get Free Quote without an approved eSTM shows all insurers". This TS shows GFQ without approved eSTM now shows top 2 (with Takaful as one). The EAINT-9023 rule is out of date [unconfirmed — no SRD read].
2. **East Coast Takaful order is flipped.** `knowledge/eauto-insurance.md:195-197` (from EAINT-9564) gives EC top 2 after eSTM as "Syarikat Takaful Malaysia (Third Party, Fire & Theft (TFT)) … Syarikat Takaful Malaysia (Comprehensive)", which is **TPFT first**. This TS expects **Comprehensive first** on EC after eSTM: "1. Takaful (Comprehensive) 2. Takaful (TPFT 3. Chubb" (Takaful Combine TS, R4). Either EAINT-9713 changed the order or the EAINT-9564 entry lists the plans without meaning an order [unconfirmed].
3. **Hak Milik gate not mentioned.** `knowledge/eauto-insurance.md:165-171` says TPFT is hidden on the eSTM flow when `isHakMilik == true`. The Takaful Combine TS expects TPFT on eSTM paths (R4–R10). It does not say whether the test vehicles were Hak Milik. Probably they were not [unconfirmed].
4. **Existing knowledge entries for EAINT-9713** (`eauto-insurance.md:188-191`) only record the combine rule. The EC / Non EC order and the fallback behaviour are not recorded yet.

## 5. Test data, environments, setup

1. **Staging sheets (Takaful Combine TS, Get Free Quote Sequence TS):** no environment, vehicle numbers or accounts are written. Probably staging [unconfirmed].
2. **Production sheet:** "prod UCD portal", checked "23/1/2026 3.34pm" (Production Regression, R6–R13).
3. **Production vehicles:** **LD1968** (Prod_TS1–TS4), **VBD2680** (Prod_TS5), **VDG1770** (Prod_TS6, TS8), **WGL317** (Prod_TS7).
4. **Accounts:** Main UCD and Sub UCD, in EC and Non EC states. No logins named. **No credentials present** in the text copy.
5. **Browsers:** Chrome and Firefox, alternated per row. Written in the "Remarks" column (or one column past it on GFQ R4–R9, R12, R15). GFQ R10, R11, R13, R14 have no browser recorded.
6. **Insurer availability** is per vehicle and comes from the simulator on staging (`knowledge/flow-insurance-purchase.md:314-317`). To get the ❌ rows, the tester has to set eSIM codes so that the right insurers fail [unconfirmed — the TS does not say how the ❌ states were made].

## 6. Gaps and risks for regression

1. **No Hak Milik row.** No row tests an eSTM vehicle with `isHakMilik == true`. In that case TPFT should be hidden, so the after-eSTM top 2 would be Comp + next insurer.
2. **No X-Star row.** VEL000069E is tested as "(Non-Xstar)" only. X-Star HP is not tested under the new top-2 rule.
3. **No Islamic hire purchase row.** The Islamic sequence (`knowledge/eauto-insurance.md:200-203`) is not checked against the combine rule.
4. **RHB is not listed anywhere.** The flow knowledge lists `.Rhb` as an insurer card class. Whether RHB can appear in top 2 is untested.
5. **Order stability is not retested.** Postcode change, variant change, Back, and Sum Insured change are not covered. EAINT-8467 says these keep the same order.
6. **Non EC with no Takaful is not tested.** No Non EC Individual row has both Takaful plans ❌, so the Non EC fallback after Chubb is unknown.
7. **Banner and VEL000069E paths only have Non EC Individual rows.** No EC or Company row covers the eSTM banner entry or the VEL000069E entry.
8. **Duplicate row.** TKF_TS7 has the same inputs and expected result as TKF_TS5. Only the priority (P2) and tester differ.
9. **Typo in an expected result.** "2. Takaful (TPFT" is missing its closing bracket (Takaful Combine TS, R4). This is cosmetic only.
10. **No timestamps or evidence references** on the staging rows. Rerun dates cannot be traced from the sheet.

## Knowledge candidates

1. **EC vs Non EC quote order** (target: `knowledge/eauto-insurance.md` § Quote sequence). EC: "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb". Non EC: "1. Chubb 2. Takaful (Comprehensive) 3. Takaful (TPFT)". Applies to Main and Sub UCD, Individual and Company, with and without eSTM. `[from SharePoint TS EAINT-9713, sheet Get Free Quote Sequence TS, rows 4, 7; sheet Takaful Combine TS, rows 4, 5]`
2. **Within Takaful, Comprehensive before TPFT.** `[from SharePoint TS EAINT-9713, all expected results]` Flag a possible conflict with the EAINT-9564 EC order (TPFT first) at `knowledge/eauto-insurance.md:195-197`.
3. **Fallback after Chubb/Takaful is Lonpac, then Tokio Marine** [unconfirmed — inferred]. `[from SharePoint TS EAINT-9713, sheet Takaful Combine TS, rows 6-7; sheet Get Free Quote Sequence TS, rows 6, 12, 15]`
4. **Mark the EAINT-9023 rule as superseded.** Replace "Get Free Quote without an approved eSTM shows all insurers" (`knowledge/business-rules-from-test-scenarios.md:383-384`) with: GFQ without approved eSTM shows top 2, with Takaful counted as one. `[from SharePoint TS EAINT-9713, title cell, sheet Takaful Combine TS, row 1; sheet Get Free Quote Sequence TS, rows 4-15]`
5. **Missing Takaful plan means fewer cards.** "Should show TOP 2 insurance sequence correctly 1. Takaful (Comprehensive) 2. Chubb" `[from SharePoint TS EAINT-9713, sheet Production Regression, row 10]`. A single surviving insurer shows alone: "1. Takaful (TPFT)" `[same sheet, row 12]`.
6. **Prod vehicles used for insurance sequence checks:** LD1968, VBD2680, VDG1770, WGL317 (prod UCD portal, 23/1/2026). `[from SharePoint TS EAINT-9713, sheet Production Regression, rows 6-13]`
