# EAINT-8608 — related history (2026-10-27)

## Header

1. **Module / portal:** **Secarang** Insurance purchase flow (Homepage → Quotation → Plan Details → Add-Ons → Payment), plus CIBO downstream. Source: `EAINT-8608-study.md` "What changes" #1, #4.
2. **Past tickets kept:** **9** (1 linked sibling, 4 Secarang/CIBO CRs, 4 eAuto Takaful/sequence CRs used as patterns).
3. **Own official TS:** **none** in the QA Team folder. Test history for 8608 lives on the **Miro board "eAuto & Secarang - Zurich"** (SC_E2E_TS1–28), summarised in `knowledge/flow-zurich-takaful.md` §6a. Board tables were **not read** (see Known traps #1).
4. **Update 2026-10-27 (Faizuddin replied "yes" to "make text copies"):** **EAINT-9215** text copy made and read; §"What was tested before" #8, Reusable #11–#12, Known traps #11–#12, QA-Issues #1 and Sources updated. **9024, 8786 (Secarang), 9062, 11541 NOT converted** — `xlsx-text.mjs` only searches the synced eAuto CR folder ("No workbook in the synced folder matches "eaint-9024"."), and converting the local copies in `_reference/sharepoint/secarang-cibo-cr-test-scenarios/` needs a command that was not approved in this run.
   1. **Retry 2026-10-27 (Faizuddin replied "yes" to running the local converter):** the command was blocked again by the permission check ("This command requires approval"). `xlsx-text.mjs secarang` finds only EAINT-8536 in the synced folder — the four Secarang/CIBO workbooks are **not in the synced eAuto CR folder at all**. Still not converted; no study content changed.
   2. **Done 2026-10-27 (Faizuddin: "can you try again? i updated your logic"):** `fetch.mjs ts` found all four in the "[repo snapshot: Secarang & CIBO CR Test Scenarios]" and wrote text copies under `_reference/sharepoint/qa-team-ts/secarang-cibo/`. All four read in full. Updated: Related #3–#6 paths, What was tested #3–#6, Reusable #6, #8, #10, #13–#14, Known traps #5, #7, #13–#16, QA-Issues #1, Sources #6–#7.
5. **Update 2026-10-27 (Faizuddin: "Do not set any VN Prefix yet"):** Known traps #4 and Reusable #2–#3 changed; no VN prefix is set for 8608.
6. **Dropped (name-only matches):** EAINT-9141, 9641 (Chubb, eAuto), 9209 (WhatsApp blast), 9103 (Services Portal UI), 8637, 10053, 11925 (eAuto popups/banners). None touch the Secarang quotation, add-on or payment flow.

## Related past tickets

1. **EAINT-8606** — "⚪[eAuto][Insurance] To onboard Zurich Takaful under Pemaju Eksklusif Sdn. Bhd." (Jira link "Relates"). **Workbook:** none valid — `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-8606.xlsx` holds EAINT-8534 (catalogue row 070). TS on Miro board. **Why:** same Zurich onboarding, eAuto side; same plan names, add-on rules, TPFT rules.
2. **EAINT-8536** — "[eAuto & Secarang] [Insurance] To enable WhatsApp notifications to 018-2884889 for failed cover note submissions". **Workbook:** `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-8536 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-8536 - … .md`. **Why:** full **Secarang Homepage purchase E2E** incl. cover-note-failed and JPJ-rejected paths.
3. **EAINT-9024** — "[Secarang] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign". **Workbook:** `_reference/sharepoint/secarang-cibo-cr-test-scenarios/EAINT-9024 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9024 - … .md` (2026-10-27). **Why:** last **Secarang quotation sequence** CR — same page as SRD 8608 Table 2.2.2.1.1.1 #1.
4. **EAINT-8786 (Secarang)** — "[Secarang] To update the latest PDS for Syarikat Takaful Malaysia". **Workbook:** `_reference/sharepoint/secarang-cibo-cr-test-scenarios/EAINT-8786 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8786 - [Secarang] … .md` (2026-10-27). **Why:** Takaful **More Info / PDS links** on Secarang Step 2, Step 4, Confirm and Pay — same area as 8608 Plan Details #6.
5. **EAINT-9062** — "[Secarang-Lonpac] Enhancement on Vehicle details API - Policy Renewal Enhancement – 14-Day Grace Period After Expiry". **Workbook:** `_reference/sharepoint/secarang-cibo-cr-test-scenarios/EAINT-9062 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9062 - … .md` (2026-10-27). **Why:** Lonpac returns to the 8608 Secarang sequence (position v); Lonpac eligibility rules still apply in regression.
6. **EAINT-11541** — "⚪[CIBO] Payment Report - Update RMS to Fiuu in Payment Mode Display". **Workbook:** `_reference/sharepoint/secarang-cibo-cr-test-scenarios/EAINT-11541-… .xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-11541-… .md` (2026-10-27). **Why:** Secarang payment is Fiuu; CIBO Payment Report is in the 8608 board checklist (`flow-zurich-takaful.md` §6 #4).
7. **EAINT-9214** — "[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad". **Workbook:** `QA Team - eAuto - CR Test Scenarios/EAINT-9214 & 9215 [eAuto] Takaful/[EAINT- 9214]-… .xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/[EAINT- 9214]-… .md`. **Why:** closest pattern — a **Takaful Comprehensive + TPFT pair** added to a quotation sequence, then bought end to end. eAuto portal, not Secarang.
8. **EAINT-9215** — "⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad". **Workbook:** `QA Team - eAuto - CR Test Scenarios/EAINT-9214 & 9215 [eAuto] Takaful/EAINT-9215 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/EAINT-9215 - … .md` (made 2026-10-27). **Why:** **Takaful wording** (Sum Covered, Contribution, Period of Takaful) — same rule as SRD 8608 §2.1.1 d.d. eAuto portal.
9. **EAINT-8467** — "[eAuto] [Insurance] To set the control quotation sequence logic on Get Quote page". **Workbook:** text copy `_reference/sharepoint/qa-team-ts/EAINT-8467 - … .md`. **Why:** pattern for **sequence stays the same after Change Postcode / Variant / Back / Sum Insured**. eAuto portal.

## What was tested before

### 1. EAINT-8606 / 8608 (Miro board, via `knowledge/flow-zurich-takaful.md`)

1. **SC_E2E_TS1–28** — "Car/EV/Motorbike × Individual/Company × Comprehensive (TS1–14) and TPFT/Third Party (TS15–28)" (§6a). Pass: "TS1, 3, 4, 6, 7, 8, 10, 12, 14". Fail: "**TS9** (Individual car, all add-ons)". Unmarked: "TS2, 5, 11, 13, 15–28".
2. **TPFT/Third Party side (TS15–28) never marked** [unconfirmed whether run].
3. eAuto COM_TS1–12 / TPFT_TS1–12 / EXT_TS1–6 (§5a–5c) — eAuto only; not Secarang.

### 2. EAINT-8536 (sheet "EAINT-8536")

1. **WA_FAILCN_TS1** (R9) — "New Transaction - Secarang (Homepage) ⏎ Cover Note Submission = Failed". Steps: "Category = Private Car, input valid vehicle details with prefix VB … Select Tokio Marine insurance". Result: PASS.
2. **WA_FAILCN_TS4** (R12) — "Regression - Secarang (Homepage) ⏎ JPJ Enquiry = Rejected", prefix "VF". Result: PASS.
3. **WA_FAILCN_TS6** (R14) — "New Transaction - Secarang (Homepage) ⏎ E2E Happy Flow", Lonpac, "Transaction Status = Insurance Created", buyer WhatsApp "{insurer_name} Insurance Successfully Created on eAuto". Result: PASS.

### 3. EAINT-9024 (text copy, sheet "Sheet1", read 2026-10-27)

1. **9024_SECARANG_TS1** (R8, P1) — "UCD land on insurance through Secarang - Homepage". Steps verify "the priority order and visibility of insurance providers" four times: on first load, after "Change Variant/Transmission, Postcode and Sum Insured ⏎ 6. Apply changes", after "Proceed to Insurance Step 2, BACK to Step 1", after "Proceed to Insurance Step 3, BACK to Step 1"; then "Proceed with insurance purchase until complete". Expected "Display ALL insurances: ⏎ 1. Lonpac✅ ⏎ 2. Tokio Marine✅". **PASS**.
2. **9024_SECARANG_TS2** (R9, P2) — Lonpac only; expected "Display ONLY the top insurance: ⏎ 1. Lonpac✅". **Not Started**.
3. **9024_SECARANG_TS2** (R10, P2, same id reused) — Tokio Marine only; expected "Display ONLY the top insurance: ⏎ 1. Tokio Marine✅". **Not Started**.

### 4. EAINT-8786 Secarang (text copy, sheet "EAINT-8786", read 2026-10-27)

1. **8786_SEC_TS1 / TS5** (R3, R7; Individual / Company) — "To verify Syarikat Takaful Malaysia PDS in Step 2": "In Takaful Malaysia section, click [Plan Details] hyperlink ⏎ 4. In 'More Info' section, click [Product Disclosure (English)] and [Product Disclosure (Malay)] hyperlink".
2. **8786_SEC_TS2 / TS6** (R4, R8) — "To verify Syarikat Takaful Malaysia PDS in Step 4": "In 'Insurance Details' section, click [Plan Details] hyperlink".
3. **8786_SEC_TS3 / TS7** (R5, R9) — "Go to below [Confirm and Pay] section, click [Product Disclosure (English)] and [Product Disclosure (Malay)] hyperlink".
4. **8786_SEC_TS4 / TS8** (R6, R10) — "To verify Syarikat Takaful Malaysia PDS in Takaful Malaysia Comprehensive Private Car Insurance e-Policy email": "Download the ZIP file attached together with the email".
5. **No Test Result values** in the sheet (column empty) [unconfirmed whether run].

### 5. EAINT-9062 (text copy, sheet "EAINT-9062", read 2026-10-27)

1. **9062_TS1** (R2) — "Policy expired and is still within 14-day renewal period" → "Able to purchase Lonpac insurance". Pass.
2. **9062_TS2** (R3) — "Policy expired and is more than 14-day renewal period" → "Unable to purchase Lonpac insurance". Pass.
3. **9062_TS3** (R4) — "Policy still active and is within 60 days before expiry date" → "Able to purchase Lonpac insurance". Pass.
4. **9062_TS4** (R5) — "Policy still active and is more than 60 days before expiry date" → "Unable to purchase Lonpac insurance". Pass.
5. **9062_TS5** (R6, Portal "eAuto") — "Policy expired and cannot be renewed within 14-day renewal period" → "Able to purchase Lonpac insurance". Pass.

### 6. EAINT-11541 (text copy, sheet "EAINT-11541", read 2026-10-27)

1. **11541_TS1** (R3) — "Existing Secarang transaction on/after cutoff displays Fiuu" (cutoff "01.03.2024") → "Payment Report -> Payment Mode is displayed "Fiuu" (listing & excel)". Pass.
2. **11541_TS2** (R4) — before cutoff → "RMS". Pass.
3. **11541_TS3** (R5) — "New Secarang transaction displays Fiuu": "1.Login to Secarang ⏎ 2. Create new transaction ⏎ 3. Login to CIBO ⏎ 4. Open Payment Report … 7. Export the report and open the file". Pass.
4. **11541_TS4–TS8** (R6–R10) — eAuto "RHB", Makrokiosk "Bold Pay". Not Secarang. Tracker R3: 8 Pass of 8.

### 7. EAINT-9214 (sheet "Takaful UI changes")

1. **UCD_9214_TAKINS_TS1** (R4) — "To verify that the Takaful (Comprehensive) insurance option is visible (unhidden), displayed in the correct priority sequence, and that the user is able to successfully complete the purchase flow." Pass.
2. **UCD_9214_TAKINS_TS3** (R7) — same, "*Test VN that has ONLY has Takaful"; expected "i. Takaful (Comprehensive) ii. Takaful (TPFT)". Pass.
3. **UCD_9214_TAKINS_TS6** (R10) — "Purchase insurance TPFT" via VEL69E. Pass.
4. **UCD_9214_TAKINS_TS2 / BO_9214_TAKINS_TS3** (R5, R6) — "To verify that the Takaful insurance transaction created is displayed correctly." (listing filter "[Insurance Company] → Takaful Malaysia Berhad"). Pass.
5. **BO_9214_TAKINS_TS1** (R13) — "To check qoutation for Takaful in Insurance Quote Enquiry". Pass.

### 8. EAINT-9215 (text copy, read 2026-10-27)

1. **Overall Progress** (R5–R7): Insurance Homepage 11 Pass / 1 Failed; UI - Insurance Purchase 30 Pass; "Total Completion" 0.976.
2. **UI_STP1_INQP_TS1** (sheet "UI - Insurance Purchase", R6) — "Ensure in both Quotation Card display UPDATED wording: … Sum Covered ⏎ - Takaful Contribution ⏎ - Contribution after NCD". PASS (TPFT + Comprehensive).
3. **UI_PDS_CW_TS1–TS8** (R8–R11, R17–R20) — "+More Info" / "[View Plan Details]" → PDS and Certificate Wording in BM and EN; expected "Open the correct document in a new tab or window. ⏎ - Display the latest version of the PDS." PASS.
4. **UI_STP2_INQP_TS1** (R14–R15) — Step 2 wording "Company: - Syarikat Takaful Malaysia Am Berhad (1246486-D) ⏎ - Takaful Plan: ⏎ - Total Sum Covered: ⏎ - Period of Takaful:"; quotation labels "Basic Contribution", "Contribution After NCD", "Gross Contribution", "Total Contribution". PASS.
5. **UI_STP3_INQP_TS1** (R23–R25) — Step 3 Payment wording + long disclaimer starting "By continuing, you agree to our Privacy Policy and Terms of Use …". PASS.
6. **UI_STP4_INQP_TS1** (R28) — Step 4 "Your insurance or takaful is now created. A copy of the certificate will be sent to your registered email by the insurance or takaful provider." + "Refund and Cancellation" text. PASS.
7. **UI_STP4_INQP_TS2** (R30) — Payment Failed page: "ONLY one button is displayed on the page: ⏎ - Try Again" and "Ensure Refund & Cancellation section is  NOT display". PASS.
8. **9215_INS_TS01–TS13** (sheet "Insurance Homepage", R4–R17) — eAuto UCD homepage "or Takaful" labels. eAuto only; no Secarang equivalent in SRD 8608.

### 9. EAINT-8467 (sheet "Insurance Sequence TS")

1. **INSSEQ_GFQ_NOESTM_TS1** (R4–R5) — verify sequence, then "Input a different valid postcode into Change Postcode field … Select a different value for Transmission & Variant (Series) … Click Apply Changes"; expected "Sequence should remain on displaying the Top 2 of previous available insurance providers".
2. **INSSEQ_GFQ_NOESTM_TS2** (R7) — "Select any available insurance ⏎ 6. Click Back ⏎ 7. Verify insurance sequence again".
3. **INSSEQ_GFQ_NOESTM_TS3** (R9) — "Select any available insurance and change the Sum Insured (via dropdown)".
4. **INSSEQ_GFQ_NOESTM_TS6** (R17) — single provider: "(In this case will be only one insurance displayed as only one provider available)".

## Reusable scenarios

1. **Secarang Homepage E2E skeleton** — from **WA_FAILCN_TS6** (8536 R14). Swap Lonpac → Zurich (Comp / TPFT), add Motorcycle tab.
2. **Cover Note failed on Secarang** — from **WA_FAILCN_TS1** (8536 R9). **No VN prefix set** (see Known traps #4, 2026-10-27). Adapt to Zurich; check the WhatsApp to 018-2884889 shows "Zurich …" in "{insurer_name}" [unconfirmed insurer display name — see bug EAINT-11147 in `flow-zurich-takaful.md` §1a].
3. **JPJ Rejected on Secarang** — from **WA_FAILCN_TS4** (8536 R12). **No VN prefix set** (see Known traps #4, 2026-10-27).
4. **Takaful pair in sequence + purchase** — from **UCD_9214_TAKINS_TS1 / TS3** (9214 R4, R7). Re-target to Secarang new sequence: Zurich Comp → Zurich TPFT → STM Comp → STM TPFT → Lonpac → Tokio Marine.
5. **"Only one insurer" case** — from **UCD_9214_TAKINS_TS3** and **INSSEQ_GFQ_NOESTM_TS6**. Use a VN that returns only Zurich.
6. **Sequence stable after Change Postcode / Back / Sum Insured** — from **9024_SECARANG_TS1** (9024 R8, Secarang, PASS) — the direct Secarang template; **INSSEQ_GFQ_NOESTM_TS1–TS3** (8467 R5, R7, R9) is the eAuto version. Run once for Car and once for Motorcycle with the 8608 order. (source updated 2026-10-27)
7. **Takaful wording check** — from **9215** UI - Insurance Purchase R6, R14. Apply to Zurich cards and receipt ("Sum Covered", "Contribution").
8. **PDS / More Info links at Step 2, Step 4, Confirm and Pay, e-Policy email ZIP** — from **8786_SEC_TS1–TS8** (8786 R3–R10, Individual + Company). Apply to Zurich flyers, PDS, Certificate Wording (past bugs EAINT-11064, EAINT-11173).
9. **CIBO listing for new insurer** — from **UCD_9214_TAKINS_TS2 / BO_9214_TAKINS_TS3** (listing filter by Insurance Company). Re-target to CIBO Transaction Management (past bugs EAINT-10968, EAINT-10969).
10. **Regression: Lonpac renewal window + Fiuu payment mode** — from **9062_TS1–TS4** (9062 R2–R5) and **11541_TS3** (11541 R5). (rows corrected 2026-10-27)
11. **Per-step Takaful wording check (Step 1 → Step 4)** — from **9215 UI_STP1/STP2/STP3/STP4_INQP_TS1** (R6, R14–R15, R23–R25, R28). Map to Secarang Step 2 All Quotations, Step 3 Add-ons, Step 4 Confirmation, Step 6 Success; swap STM names for Zurich [unconfirmed exact Zurich strings — SRD V1.3 pending, see study Open questions #1–#2]. (added 2026-10-27)
12. **More Info document links, BM + EN, new tab** — from **9215 UI_PDS_CW_TS1–TS8**. Re-target to "Z-Drive Assist Takaful Flyer", "Product Disclosure Sheet", "Certificate Wording" (SRD 8608 V1.2 Table 2.2.2.1.2.1 #6). (added 2026-10-27)
13. **"Only top insurer shown" when only one insurer quotes** — from **9024_SECARANG_TS2** (9024 R9–R10). Secarang version of Reusable #5; the past rows were "Not Started", so this is unproven on Secarang. (added 2026-10-27)
14. **New Secarang Zurich transaction in CIBO Payment Report shows "Fiuu"** — from **11541_TS3** (11541 R5): "Login to Secarang ⏎ 2. Create new transaction ⏎ 3. Login to CIBO ⏎ 4. Open Payment Report". Covers the CIBO Payment Report item on the 8608 board checklist (`flow-zurich-takaful.md` §6 #4). (added 2026-10-27)

## Known traps

1. **Board tables unread** — "the board's 30 tables were NOT read … 1,923 cells across 30 tables" (`knowledge/flow-zurich-takaful.md` "Gap"). Real SC_E2E steps are unknown until read.
2. **Wrong file for 8606** — "File named EAINT-8606 but holds the EAINT-8534 eLKM limit script" (`cr-test-scenario-catalogue.md` row 070).
3. **eSIM may not show TPFT** — "Tested by e-sim, in e-sim not show the TPFT" (9214, sheet Takaful UI changes, R4–R9 Remarks). Use live API data for TPFT cases.
4. **Hardcoded VN prefix** — "Dev will hardcode specific vehno prefix to allow sending of required whatsapp message" (8536 R10 Remarks). Prefixes "VB" = cover note failed, "VF" = JPJ rejected (8536 R9, R12). eAuto board uses "ZA" / "ZB" for Zurich (`flow-zurich-takaful.md` §4c #4).
   1. **Decision 2026-10-27 (Faizuddin, dashboard chat):** "Do not set any VN Prefix yet, cus insurance is a big module, so different prefix is used for different situations". **Do not write any prefix into 8608 scenarios.** The prefixes above are past history only, not inputs for 8608.
5. **MessageBird on or off depends on the test** — "Note: ensure messagebird is enabled" (8536 R9–R15 Pre-Requisite), but "Select any insurance quotation, ensure messagebird is disabled" (9024 R8–R10 step 12). Turn it on only for WhatsApp checks [unconfirmed reason — likely avoids real WhatsApp sends]. (updated 2026-10-27)
6. **BO Quote Enquiry order differs** — "ALL insurance quotations will be displayed, but they may not follow the same priority sequence as shown in the UCD" (9214 R13).
7. **Sequence is dated** — "The exact insurer order is campaign-specific and changes every few months; take it from the newest CR" (`business-rules-from-test-scenarios.md` §6.1 #10). 9024 Secarang order "1. Lonpac✅ ⏎ 2. Tokio Marine✅" (9024 R8) is superseded by 8608. (quote corrected 2026-10-27)
8. **Old Zurich data invalid** — "10.06.2026 (Wed) Zurich want to proceed the UAT again as the data last time not longer valid anymore." (`flow-zurich-takaful.md` §1 #3).
9. **Deprioritised Secarang TS** — "Deprio - All postcode can be used", "Deprio as there are no TPFT for EV", "Deprio. All Riders is now mandatory" (`flow-zurich-takaful.md` §6a #4). Not failures.
10. **Environment named in past files is not a rule** — "It is **not** a rule; never reuse it as the environment for a new CR" (`cr-test-scenario-catalogue.md` "How to read this" #4). 8536 used "staging/preprod2" (R4).
11. **Old distributor text in the STM disclaimer** — "This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor of Takaful Malaysia" (9215, sheet UI - Insurance Purchase, R15). Zurich must show **Pemaju Eksklusif**, not Bintang Prospek — the same mix-up as bug EAINT-10971 (`flow-zurich-takaful.md` §2 #2). Check the Zurich card does not reuse STM text. (added 2026-10-27)
12. **Payment Failed page hides Refund & Cancellation** — "Ensure Refund & Cancellation section is  NOT display" (9215, UI - Insurance Purchase, R30). eAuto rule; Secarang behaviour not stated in SRD 8608 [unconfirmed]. (added 2026-10-27)
13. **Past Secarang TS rows were never run** — 9024_SECARANG_TS2 both rows "Not Started" (9024 R9–R10); 8786 sheet has no Test Result values (R3–R10). Do not treat those scenarios as proven. (added 2026-10-27)
14. **Duplicate TS id** — "9024_SECARANG_TS2" is used on two different rows (9024 R9 and R10). Give each Zurich scenario its own two-digit id. (added 2026-10-27)
15. **Lonpac renewal window limits test data** — Lonpac is buyable only when the policy expired ≤ 14 days ago or expires within 60 days (9062 R2–R5). A Zurich-sequence VN outside that window shows **no Lonpac card**, which is correct, not a sequence defect. (added 2026-10-27)
16. **9062_TS5 reads oddly** — "Policy expired and cannot be renewed within 14-day renewal period" → "Able to purchase Lonpac insurance" (9062 R6, Portal "eAuto"). It looks the opposite of TS2 [unconfirmed — may be an eAuto-only rule]. Not a Secarang case. (added 2026-10-27)

## Past QA-Issues mentioned

1. **In the kept workbooks (8536, 9214, 8467, 9215, 9024, 8786, 9062, 11541 text copies):** no QA-Issue key named; 9024, 8786, 9062 and 11541 also have no Failed rows (checked 2026-10-27). **9215** has one Failed row, no key: **9215_INS_TS12** "Verify label updates from “Policy Wording” to “Policy Wording or Certificate Wording”." — "Failed" (sheet Insurance Homepage, R15). eAuto homepage only. (updated 2026-10-27)
2. **8608 sub-task bugs** (Jira capture, `EAINT-8608-jira.md` line 13), most relevant to reuse:
   1. **EAINT-10968** "Zurich Transactions are not showing up in CIBO > Transaction Management".
   2. **EAINT-10969** "Missing Zurich Takaful filter option in CIBO > Transaction Management".
   3. **EAINT-11064** "Hyperlinks in Plan Details > More Info are opening the wrong documents".
   4. **EAINT-11173** "Missing Z-Drive Assist Takaful and Z-Rider (Plus) Takaful flyer under Plan Details".
   5. **EAINT-11209** "Able to proceed with invalid postcodes" and **EAINT-11210** "Able to use Car and Bike VN in both tabs when getting quotation" — now allowed by SRD V1.2.
   6. **EAINT-11654** "Add-ons for All Drivers behaviour must follow current eAuto behaviour".
   7. **EAINT-11681** "Incorrect PIAM ID for Zurich".
   8. **EAINT-11727** "e-Certification downloaded from secarang is not showing the user's email".
   9. **EAINT-11729** "Female insurance price displaying the wrong initial value".
   10. **EAINT-11736** "Windscreen add-ons not tally in add-ons section and payment confirmation" — matches failed SC_E2E_TS9.
   11. **EAINT-11505** "UI issue" — the only open one (`flow-zurich-takaful.md` §1a).
3. **8606 bug reused by 8608:** **EAINT-10971** (distributor mapped to Bintang Prospek, Done) (`flow-zurich-takaful.md` §2 #2).

## Sources read

1. `_reference/tickets/Studying/EAINT-8608/EAINT-8608-study.md` (full).
2. `_reference/tickets/Studying/EAINT-8608/EAINT-8608-jira.md` (full).
3. `knowledge/flow-zurich-takaful.md` (full).
4. `knowledge/cr-test-scenario-catalogue.md` — header, Insurance control sequence table, rows 064–065, 070, 085, 088, 095, 107, 110, 124, Secarang & CIBO rows 129–137, Appendix A paths.
5. `knowledge/business-rules-from-test-scenarios.md` — §6.1–6.4, §18.
6. Text copies in `_reference/sharepoint/qa-team-ts/`: EAINT-8536, EAINT-9214, EAINT-8467 (full); **EAINT-9215** (full, converted and read 2026-10-27); `secarang-cibo/` copies of **EAINT-9024, EAINT-8786 [Secarang], EAINT-9062, EAINT-11541** (full, made with `fetch.mjs ts` and read 2026-10-27).
7. **Not read:** `_reference/sharepoint/qa-team-ts/INDEX.md` does not exist. No `*-qa-team-ts-study.md` files exist under `_reference/tickets/`.
8. **Not opened:** candidates 9141, 9641, 9209, 9103, 8637, 10053, 11925 — dropped on title and catalogue module (eAuto Chubb / popups / Services Portal).
