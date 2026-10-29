# EAINT-12078 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-12078/brief.json`. No SRD / Figma yet, so all scope is **[unconfirmed]**.

1. **High-level scope**
   1. **Takaful Malaysia (STM) card is back** on the Secarang quotation page (Car; Comprehensive + TPFT), in the right insurer order.
   2. **NDDP disclosures 1–7** show on the Secarang STM flow: insurer/distributor line, services + contact info, commission statement before Confirm and Pay, contribution breakdown, refund text on the success page.
   3. **Breakdown is not marked up**: Contribution After NCD → Gross → Service Tax → Stamp Duty → Total, no extra charge.
   4. **New documents open**: PDS EN/BM "V2 02-2026" and Certificate Wording / Sijil "V2.0 05-2026" from every link point and in the e-Policy email ZIP.
   5. **End-to-end STM purchase** with Fiuu (Individual + Company), receipt PDF, CIBO record; failed payment hides Refund and Cancellation.
   6. **Regression**: Lonpac / Zurich / Tokio Marine cards and purchase unchanged.
2. **Estimated testing time:** **5.5 man-days** (range **5–6**), confidence **low** [unconfirmed]. No official figure: Jira "[QA] Est Man-day: blank" (Scout study, Header #6); no Miro card.
3. **Modules / pages to cover**
   1. **Insurance (Secarang):** quotation page, Plan Details / More Info, Add-ons, Confirm and Pay, payment success, payment failed, receipt PDF — changed by the ticket.
   2. **Fiuu payment (Secarang):** FPX / card popup — regression for the STM purchase.
   3. **e-Policy email (Takaful Malaysia):** ZIP with PDS — document refresh.
   4. **Transaction Management, Payment Report (CIBO):** STM transaction row, insurer name — every Secarang purchase lands in CIBO.

## Header

1. **Module / portal:** **Secarang** Insurance purchase flow (Quotation → Plan Details / More Info → Add-ons → Confirm and Pay → Fiuu → success page / receipt), plus CIBO downstream. Insurer = **Syarikat Takaful Malaysia (STMAB)**, not eSTM. Source: `EAINT-12078-study.md` "Header" #2, "What changes" #1.
2. **Past tickets kept:** **8** (4 linked or named by Scout, 4 found by search).
3. **Own official TS:** **none** in the QA Team folder. No SRD on Jira yet (study "Header" #11).
4. **Closest past ticket:** **EAINT-9215** — the same 7 NDDP disclosures for STM, done on **eAuto UCD**, not Secarang. Its TS is the main template.
5. **Update 2026-10-27 (Scout reply, after the scope ask):** still **no SRD / Figma** for 12078. Added: Reusable #11 (NDDP item → 9215 SRD table → past TS → Secarang page), Known traps #4 refined, #13–#14 new, Confidence #4, Sources #7–#8. **EAINT-9903** checked and dropped (see #6).
6. **EAINT-9903** — " To update eAuto based on NDDPs Requirement for STM" (Done). Jira "Description: (empty)", "QA (cf 10041): —", no links (`EAINT-9903-jira.md` lines 7–18). `fetch.mjs ts EAINT-9903` → "No workbook matches". **No TS to reuse.** (added 2026-10-27)
7. **Re-run 2026-10-27 (new candidate list):** Scout study re-checked — still "no SRD / Figma" (study, Open questions #1). Kept list unchanged. **EAINT-9713** (eAuto Free Quote — "Takaful - Comprehensive & TPFT is counted as one insurance", sheet "Get Free Quote Sequence TS", R2) dropped: eAuto UCD only, no Secarang row. **EAINT-9141** (Chubb UI) dropped: other insurer. **EAINT-9219** (sub-task of 9215 — "Missing documents in TPFT for Takaful myMotor products") already listed under Past QA-Issues #1.2. Ticket brief section and `brief.json` added.
8. **Dropped (name-only or wrong module):** **EAINT-9024** (Lonpac sequence, superseded order), **EAINT-9062** (Lonpac renewal window), **EAINT-9611** (eAuto API inception date), **EAINT-8536** (WhatsApp on failed cover note — kept only as an E2E skeleton reference via `EAINT-8608-related-history.md`, not counted).

## Related past tickets

1. **EAINT-9215** — "⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad" (Done, Fix "S23.5-20251121"). **Workbook:** `QA Team - eAuto - CR Test Scenarios/EAINT-9214 & 9215 [eAuto] Takaful/EAINT-9215 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/EAINT-9215 - ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad.md`. **Why:** **same NDDP rule, same insurer**; its expected texts match the 12078 checklist evidence word for word (disclaimer, refund text, breakdown labels).
2. **EAINT-8786 (Secarang)** — "[Secarang] To update the latest PDS for Syarikat Takaful Malaysia". **Workbook:** `2. Secarang & CIBO Project/Enhancement CR Test Scenario/EAINT-8786 - … .xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8786 - [Secarang] To update the latest PDS for Syarikat Takaful Malaysia.md`. **Why:** **same portal, same insurer, same document links** (Step 2, Step 4, Confirm and Pay, e-Policy email ZIP). 12078 ships new PDS V2 02-2026.
3. **EAINT-8786 (eAuto)** — sheet title "⚪[eAuto][UCD]To update the latest PDS for Syarikat Takaful Malaysia". **Workbook:** `1. eAuto Project/eAuto - CR Test Scenarios/EAINT-8786- To update the latest PDS for Syarikat Takaful Malaysia.xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-8786- To update the latest PDS for Syarikat Takaful Malaysia.md`. **Why:** eAuto half of the same PDS ticket; holds the **confirmation email ZIP** check (R14).
4. **EAINT-9214** — "⚪[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad" (Jira "Relates" to 9215). **Workbook:** `…/EAINT-9214 & 9215 [eAuto] Takaful/[EAINT- 9214]-… .xlsx`; text copy `_reference/sharepoint/qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/[EAINT- 9214]-[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad.md`. **Why:** last time STM was **unhidden** (resumed) — the "Resume STM" half of 12078. eAuto portal.
5. **EAINT-8331 / 8334 / 7199** — "Secarang to Remove Discount Line". **Workbook:** `2. Secarang & CIBO Project/…/EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.xlsx`; text copy `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.md`. **Why:** only past Secarang TS that **bought Takaful end to end** (Company VN) and checked the **pricing breakdown** on success page, receipt PDF, email and CIBO — NDDP items 5 and 7.
6. **EAINT-8608** — Secarang Zurich Takaful onboarding (Scout-linked). **Workbook:** none; TS on Miro board, summarised in `knowledge/flow-zurich-takaful.md` §6a and `_reference/tickets/Studying/EAINT-8608/EAINT-8608-related-history.md`. **Why:** same Secarang Takaful flow; SRD 8608 sequence still lists "STM Comp → STM TPFT" (12078 study, Open questions #3).
7. **EAINT-12175** — "⚪[Secarang & eAuto-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link" (Done, Fix "S34.3-20261002"). **Workbook:** none — `fetch.mjs ts EAINT-12175` returned "No workbook matches". **Why:** latest **insurer name + policy-wording link** change on Secarang Add-on and Confirmation pages; same check type as NDDP item 1 and the document links.
8. **EAINT-12107** — "⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay" (QA = Faizuddin). **Workbook:** text copy `_reference/sharepoint/qa-team-ts/eauto-snapshot/EAINT-12107 - ⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.md`. **Why:** newest **Secarang Confirm and Pay → Fiuu → success / failed page** TS, with automation (`scripts/eauto-12107`). Where NDDP items 4 and 6 sit.

## What was tested before

### 1. EAINT-9215 (eAuto UCD, sheet "UI - Insurance Purchase" unless stated)

1. **UI_STP1_INQP_TS1** (R6) — "Ensure in both Quotation Card display UPDATED wording: ⏎ ⏎ - Sum Covered ⏎ - Takaful Contribution ⏎ - Contribution after NCD". PASS (TPFT + Comprehensive).
2. **UI_PDS_CW_TS1–TS4** (R8–R11) — Step 1 "+More Info" → PDS and Certificate Wording BM + EN; expected "Open the correct document in a new tab or window. ⏎ - Display the latest version of the PDS." TS1–2 via eSTM, TS3–4 via "Get A Free Quote". PASS.
3. **UI_STP2_INQP_TS1** (R14) — Step 2 "Company: - Syarikat Takaful Malaysia Am Berhad (1246486-D) ⏎ - Takaful Plan: ⏎ - Total Sum Covered: ⏎ - Period of Takaful:". PASS.
4. **UI_STP2_INQP_TS1** (R15, same id) — breakdown labels "Basic Contribution", "Contribution After NCD", "Gross Contribution", "Service Tax", "Stamp Duty", "Total Contribution" + "This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor of Takaful Malaysia". PASS. = **NDDP items 1, 2, 5**.
5. **UI_PDS_CW_TS5–TS8** (R17–R20) — Step 2 "[View Plan Details]" → same documents. PASS.
6. **UI_STP3_INQP_TS1** (R23–R25) — Step 3 Payment disclaimer "By continuing, you agree to our Privacy Policy and Terms of Use … Alternatively, for commission-free purchase of similar product, you may visit our respective insurance partner’s or takaful operator’s website or any of their physical branches." + "Ensure to display these items in hyperlink: ⏎ 1. Privacy Policy ⏎ 2. Terms of Use ⏎ 3. Product Disclosure Sheet (latest English version)". PASS. = **NDDP item 4**.
7. **UI_STP4_INQP_TS1** (R28) — "Ensure will display disclaimer for ONLY successful created insurance ⏎ ⏎ - Refund and Cancellation …". PASS. = **NDDP item 6**.
8. **UI_STP4_INQP_TS2** (R30) — Payment Failed page; "Ensure Refund & Cancellation section is  NOT display". PASS.
9. **9215_INS_TS10–TS12** (sheet "Insurance Homepage", R13–R15) — services list "Instant quotes from our insurance partners or takaful operator", "Insurance or Takaful plans and benefits comparison", "Thorough product information via Product Disclosure Sheet or Policy Wording or Certificate Wording". TS10–11 Pass, **TS12 Failed**. = **NDDP item 3**.
10. **9215_INS_TS13** (R17) — "Verify Takaful pop up displays when clicking on Takaful logo". Pass. = contact info part of **NDDP item 3**.

### 2. EAINT-8786 Secarang (sheet "EAINT-8786")

1. **8786_SEC_TS1 / TS5** (R3, R7; Individual / Company) — "To verify Syarikat Takaful Malaysia PDS in Step 2".
2. **8786_SEC_TS2 / TS6** (R4, R8) — "To verify Syarikat Takaful Malaysia PDS in Step 4" via "'Insurance Details' section, click [Plan Details] hyperlink".
3. **8786_SEC_TS3 / TS7** (R5, R9) — "Go to below [Confirm and Pay] section, click [Product Disclosure (English)] and [Product Disclosure (Malay)] hyperlink".
4. **8786_SEC_TS4 / TS8** (R6, R10) — "To verify Syarikat Takaful Malaysia PDS in Takaful Malaysia Comprehensive Private Car Insurance e-Policy email" — "Download the ZIP file attached together with the email".
5. **Test Result column empty** on all 8 rows.

### 3. EAINT-8786 eAuto (sheet "EAINT-8786 - UCD eAuto")

1. **R3–R13, R15** (no TS ids) — PDS EN/BM at "Step 1 - Qoutes", "Step 2 - Optional Coverage", "Step 3 & 4 -Proceed Until Payment & Insurance Successfully Purchased"; Individual + Company; Main User + Sub User.
2. **R14** (Company, Step 2 row) — expected "Ensure that the user receives a confirmation email from Syarikat Takaful Malaysia upon successful insurance purchase. ⏎ ⏎ 2. The email should include a ZIP file attachment containing relevant policy documents."

### 4. EAINT-9214 (sheet "Takaful UI changes")

1. **UCD_9214_TAKINS_TS1** (R4) — "To verify that the Takaful (Comprehensive) insurance option is visible (unhidden), displayed in the correct priority sequence, and that the user is able to successfully complete the purchase flow." Pass.
2. **UCD_9214_TAKINS_TS3** (R7) — "*Test VN that has ONLY has Takaful". Pass.
3. **UCD_9214_TAKINS_TS6** (R10) — "Select Takaful (TPFT) and proceed with the purchase until it is successfully completed." Pass.
4. **UCD_9214_TAKINS_TS2 / BO_9214_TAKINS_TS3** (R5, R6) — listing filter "[Insurance Company] → Takaful Malaysia Berhad". Pass.
5. **BO_9214_TAKINS_TS1** (R13) — "To check qoutation for Takaful in Insurance Quote Enquiry". Pass.

### 5. EAINT-8331 / 8334 / 7199 (sheet "EAINT-8331, 8334 & 7199")

1. **SEC_RECEIPT_TS2** (R15, P1) — "Category = Company Car … Select Takaful insurance … apply Discount Code = EAUTO10 … Download Insurance Receipt PDF in Payment Successful Page and ⏎ CIBO Transaction Management". PASS.
2. **SEC_RECEIPT_TS5** (R18) — Takaful, Company, Discount Code "HZA". PASS.
3. **SEC_RECEIPT_TS7** (R21, P2) — "[Regression] … WITHOUT Discount Code", Takaful, Company. PASS.
4. **SEC_RECEIPT_TS8–TS10** (R23–R25) — "Existing Transaction - CIBO", insurer list "Bintang Prospek (RHB / Takaful)". PASS.

### 6. EAINT-8608 (Miro, via `knowledge/flow-zurich-takaful.md` §6a)

1. **SC_E2E_TS1–28** — "Car/EV/Motorbike × Individual/Company × Comprehensive (TS1–14) and TPFT/Third Party (TS15–28)". Quoted from `EAINT-8608-related-history.md` "What was tested before" §1. Zurich, not STM.

### 7. EAINT-12175 / EAINT-12107

1. **12175:** no TS workbook found. Jira only: "Add-on — update Policy Wording link to: http://lonpac.com/downloads/policywordings-eassistsmartdriver.pdf  5. Confirmation — update insurer name to "Lonpac Insurance Bhd"" (Jira description row 5).
2. **12107:** 14 TS rows (`12107_TS…`) on Secarang payment → success / failed page. Not reread here; Faizuddin was QA.

## Reusable scenarios

1. **NDDP disclosure per step** — from **9215 UI_STP2_INQP_TS1 (R15)**, **UI_STP3_INQP_TS1 (R24)**, **UI_STP4_INQP_TS1 (R28)**. Map to Secarang Plan Details, Confirm and Pay, success page. Expected texts can be copied; compare against the BA's final wording.
2. **"Refund and Cancellation" hidden on failed payment** — from **9215 UI_STP4_INQP_TS2 (R30)**. Re-target to Secarang failed page (`12107` failed-payment TS).
3. **Services list + contact info (NDDP item 3)** — from **9215_INS_TS10–TS13** (Insurance Homepage R13–R17). Secarang location unknown [unconfirmed — needs Figma/SRD].
4. **Quotation card wording** — from **9215 UI_STP1_INQP_TS1 (R6)** ("Sum Covered", "Takaful Contribution", "Contribution after NCD"). Secarang today says "Premium" (study "New vs existing" #4).
5. **PDS / Certificate Wording links, BM + EN** — from **8786_SEC_TS1–TS3, TS5–TS7** (Secarang Step 2, Step 4, Confirm and Pay) plus **9215 UI_PDS_CW_TS1–TS8** for the Certificate Wording rows. Swap to "V2 02-2026" / "V2.0 05-2026".
6. **e-Policy email ZIP holds new PDS** — from **8786_SEC_TS4 / TS8** and **8786 eAuto R14**.
7. **STM resumed (unhidden) + bought end to end** — from **UCD_9214_TAKINS_TS1, TS3, TS6** (Comprehensive + TPFT). Re-target to Secarang quotation page.
8. **STM transaction in CIBO** — from **SEC_RECEIPT_TS2 / TS7** (Company Takaful → receipt PDF in success page and "CIBO Transaction Management").
9. **Breakdown with / without discount code (NDDP items 5, 7)** — from **SEC_RECEIPT_TS2, TS5, TS7**. Checks no extra line appears on STM receipt.
10. **Fiuu payment + failed page** — from **12107** TS rows; reuse `scripts/eauto-12107` / `scripts/secarang-insurance` for the run.
11. **NDDP item → page → past TS map** (added 2026-10-27, from Scout reply). eAuto page and SRD line from `_reference/tickets/Studying/EAINT-9215/SRD_EAINT-9215_eAuto_To_Reflect_NDDP_Changes_for_STMAB_V1.1_20112025-text.md`. Secarang page = **[unconfirmed]** guess from `knowledge/flow-secarang-insurance.md` §3; replace when the 12078 SRD arrives.

| NDDP item | eAuto page (9215 SRD) | 9215 SRD text (verbatim) | Past TS to adapt | Secarang page [unconfirmed] |
|---|---|---|---|---|
| 1 + 2 | Step 2 | "To display a disclaimer of relationship between Bintang Prospek and Syarikat Takaful Malaysia" (line 147) | 9215 UI_STP2_INQP_TS1 (R15) | Add-ons or quotation card |
| 3 | Insurance Homepage + logo popup | "Upon clicking on Takaful Malaysia logo on ‘Insurance Companies or Takaful Operator Contact Info’ section, will display a popup for Takaful Malaysia Contact Info." (line 117) | 9215_INS_TS10–TS13 (R13–R17) | no matching page known |
| 4 | Step 3 | "To display disclaimer under the payment summary section" (Scout, Table 2.2.1.5 #1) | 9215 UI_STP3_INQP_TS1 (R24) | Confirm and Pay (step 7) |
| 5 + 7 | Step 1 + Step 2 wording | "Insurance Premium \| Takaful Contribution", "Premium after NCD \| Contribution after NCD" (Scout, Table 2.2.1.3 #1, 2.2.1.4 #2) | 9215 UI_STP1_INQP_TS1 (R6), UI_STP2_INQP_TS1 (R15); 8331 SEC_RECEIPT_TS2/TS7 for receipt | quotation cards + Confirm and Pay |
| 6 | Step 4 | "To display disclaimer for Refund and Cancellation" (line 167) | 9215 UI_STP4_INQP_TS1 (R28), TS2 (R30) | Payment success (step 10) |
| PDS / Cert. Wording | + More Info / View Plan Details | "To update the latest PDS and Certificate Wording (for both BM and English)" (line 175) | 8786_SEC_TS1–TS8; 9215 UI_PDS_CW_TS1–TS8 | Plan Details, Step 4, Confirm and Pay, e-Policy email |

   1. **Gap:** the 9215 SRD has **no breakdown rule** for items 5 + 7 — "The breakdown box appears only as screenshot evidence in the NDDP checklist PDF" (Scout reply, A.4). No past TS checked a "10% Gross Contribution Discount" line.
   2. **Gap:** no past Secarang TS covers item 3 (services list + contact popup). 9215 tested it on the eAuto homepage only.

## Known traps

1. **Takaful often not quotable on Secarang** — "Tested with TMIM as Takaful not available" (8331 sheet, R18, R21 Remarks); later "Takaful (Company) = OK (2:50PM 31/7/25)" (R15). Line up an STM-quoting VN before test day.
2. **eSIM may not return TPFT** — "Tested by e-sim, in e-sim not show the TPFT" (9214, sheet "Takaful UI changes", R4–R9 Remarks).
3. **Old document labels in past steps** — "[STMAB PDS(BM) Takaful myMotor-Kenderaan Persendirian V01 08-2025]" (9215 R8). New files are "V2 02-2026" / "V2.0 05-2026" (12078 study, "Requirements — product documents"). Do not copy old link names.
4. **Refund wording differs** — 9215 R28: "Customers who have participated **to** the takaful product"; 12078 checklist No. 6: "Customers who have participated **in** the takaful product". Confirm the final text with the BA [unconfirmed which is correct].
   1. **Update 2026-10-27:** the 9215 SRD also says "to": "Customers who have participated to the takaful product through our website may request a refund or cancel their takaful coverage." (`SRD_EAINT-9215_…_V1.1_20112025-text.md` line 167). So eAuto shipped "to"; only the 12078 checklist says "in".
5. **Breakdown label list differs** — 9215 R24 has "Rounding" but no "Total Contribution"; R15 has "Total Contribution". 12078 checklist adds "10% Gross Contribution Discount" and "Total Nett Contribution After Discount" (study "Requirements" No. 5). Read labels from the SRD, not from 9215.
6. **Distributor name** — 9215 R15 "Bintang Prospek is the authorized distributor of Takaful Malaysia"; 8331 R23 lists "Bintang Prospek (RHB / Takaful)". Zurich must not reuse it (bug EAINT-10971, `flow-zurich-takaful.md` §2 #2).
7. **Two names for the same insurer** — Step 2 "Syarikat Takaful Malaysia Am Berhad (1246486-D)" (9215 R14) vs listing filter "Takaful Malaysia Berhad" (9214 R5). Check which one CIBO filter shows.
8. **BO order differs from UCD** — "ALL insurance quotations will be displayed, but they may not follow the same priority sequence as shown in the UCD" (9214 R13).
9. **Past Secarang PDS TS never marked** — 8786 Secarang sheet has no Test Result values (R3–R10). Not proven on Secarang.
10. **Duplicate TS ids** — "UI_STP2_INQP_TS1" on R14 and R15; "UI_STP3_INQP_TS1" on R23–R25 (9215). Use unique two-digit ids.
11. **8786 eAuto R5–R6 typo** — Insurance Type "TPFT" in both columns for Company rows; R14 expected (email ZIP) sits on a "Step 2 - Optional Coverage" row. Do not copy row layout as-is.
12. **MessageBird must be on for WhatsApp checks** — "Note: ensure messagebird is enabled" (8331 R14–R21 Pre-Requisite).
13. **Resume scope conflicts with Zurich onboarding** (added 2026-10-27, Scout reply B.4–B.5) — SRD 8608 v1.2 §2.2.2.1.1 #1 order "Zurich Comp → Zurich TPFT → STM Comp → STM TPFT → Lonpac → Tokio Marine", but SRD 8606 v1.2 §2.2.2.1.2 #1 "Zurich Takaful replaces Syarikat Takaful Malaysia". Past STM TS (9214) were eAuto only; **no past TS proves the Secarang order with STM and Zurich both live.**
14. **Documents are Private Car only** (added 2026-10-27, Scout reply B.2) — "PDS Takaful myMotor Private Car (English) V02" and "Sijil Takaful myMotor Kereta Persendirian (BM) V2.0" (Jira Supporting Documents row 1). 8786 Secarang and 8331 TS also used **Company** VNs (8786 R7–R10; 8331 R15, R18, R21). Likely scope **Car, Comprehensive + TPFT** [unconfirmed]; do not add Motorcycle rows from past TS.

## Past QA-Issues mentioned

1. **EAINT-9215 sub-tasks** (Jira capture `_reference/tickets/Studying/EAINT-9215/EAINT-9215-jira.md` line 13):
   1. **EAINT-9218** "[eAuto – Insurance Homepage] Wording Correction: Should not has “s” from the word “wording”" — matches **9215_INS_TS12 Failed** (R15).
   2. **EAINT-9219** "[eAuto – Insurance Quotation Page] Missing documents in TPFT for Takaful myMotor products" — **check TPFT document links on Secarang**.
   3. **EAINT-9220** "Next and Cancel buttons not aligned correctly".
   4. **EAINT-9222** "“More Info” button text wraps into two lines and spacing between optional coverage items too large".
2. **EAINT-12175 sub-task:** **EAINT-12423** "Insurance Transaction Listing - Insurance Company column shows the plan code Lonpac instead of the full insurer name" — same risk for STM in BO/CIBO.
3. **EAINT-8608 bugs (Zurich, Secarang):** **EAINT-11064** "Hyperlinks in Plan Details > More Info are opening the wrong documents"; **EAINT-10968** "Zurich Transactions are not showing up in CIBO > Transaction Management" (quoted in `EAINT-8608-related-history.md` "Past QA-Issues" #2).
4. **8786, 9214, 8331:** no QA-Issue key or Failed row.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — official figure lives in the QA Portal.

### 1. Comparable tickets

| Ticket | Portal | TS rows (text copy) | [QA] Est Man-day (cf 10081) | Source |
|---|---|---|---|---|
| EAINT-9215 | eAuto UCD | 28 (12 homepage + 16 purchase) | "—" | `EAINT-9215-jira.md` line 11 |
| EAINT-9214 | eAuto UCD + BO | 9 | "—" | `EAINT-9214-jira.md` line 11 |
| EAINT-8786 Secarang | Secarang | 8 | "—" | `EAINT-8786-jira.md` line 11 |
| EAINT-8786 eAuto | eAuto UCD | 13 (no ids) | (same ticket) | as above |
| EAINT-8331/8334/7199 | Secarang + CIBO | 12 rows / 10 ids | "—" (8334) | `EAINT-8334-jira.md` line 11 |
| EAINT-12175 | Secarang + eAuto | no workbook | **3** | `EAINT-12175-jira.md` line 11 |
| EAINT-12107 | Secarang Fiuu | 14 | **2** | `EAINT-12107-jira.md` line 11 |
| EAINT-8608 | Secarang (new insurer) | 28 (Miro SC_E2E) | **15** | `EAINT-8608-jira.md` line 11 |

1. Scout study: "**Est. mandays:** none (Jira blank; no Miro card found)" (study "QA scope" #1).

### 2. Expected TS count for EAINT-12078

1. **18–26 TS.** 7 NDDP items (≈ 9215's 16 purchase rows), 6–8 document-link checks (8786 Secarang had 8), 2–3 resume / sequence, 2–3 E2E + CIBO, 1–2 failed payment. Smaller than 8608 (new insurer); bigger than 12175 / 12107.

### 3. Estimate in man-days

1. **Total: 5.5 man-days, range 5–6** [unconfirmed].
   1. **TS drafting:** 1 (9215 + 8786 give most expected texts).
   2. **Test execution:** 2–2.5 (Individual + Company, Comp + TPFT, Fiuu, e-Policy email, CIBO).
   3. **Retest / QA-Issue buffer:** 1 (9215 raised 4 sub-tasks).
   4. **Automation build:** 1–1.5 — text assertions on top of `scripts/secarang-insurance` / `scripts/eauto-12107` [unconfirmed — STM card selector not captured].

### 4. Confidence

1. **Low.** No SRD, no Figma, no dev; "Resume" scope and vehicle types unknown.
2. **Goes up** when the SRD lists the pages per NDDP item and the vehicle / cover types.
3. **Goes up the estimate** if STM is not quotable on staging (trap #1) or if eAuto UCD is also in scope.
4. **Update 2026-10-27:** Scout confirmed no SRD / Figma yet; scope still open (Known traps #13–#14). **Estimate unchanged.** If scope is Car only (Individual + Company, Comp + TPFT), the **18–26 TS** range holds [unconfirmed].

## Knowledge candidates

1. **eAuto shipped "participated to" in the STM refund disclaimer** — 9215 NDDP SRD line 167 and 9215 TS R28; the 12078 NDDP checklist says "participated in". Target: `knowledge/eauto-insurance.md`.
2. **Secarang Takaful was often not quotable on staging** — "Tested with TMIM as Takaful not available" (Secarang remove-discount-line TS, R18, R21). Target: `knowledge/flow-secarang-insurance.md` traps.

## Sources read

1. `_reference/tickets/Studying/EAINT-12078/EAINT-12078-study.md` (full).
2. Text copies (full): `qa-team-ts/EAINT-9214 & 9215 [eAuto] Takaful/` (9214, 9215); `qa-team-ts/secarang-cibo/EAINT-8786 - [Secarang] …md`; `qa-team-ts/EAINT-8786- To update the latest PDS …md`; `qa-team-ts/secarang-cibo/EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.md`.
3. `_reference/tickets/Studying/EAINT-8608/EAINT-8608-related-history.md` (full) — source for 8608, 8536, 9024 history.
4. Jira captures refreshed 2026-10-27 with `fetch.mjs issue`: EAINT-9215, 9214, 8786, 12175, 12107, 8334; EAINT-8608 capture field line read.
5. `knowledge/cr-test-scenario-catalogue.md` rows 085, 095, 124, 135 and Appendix A paths; `knowledge/flow-secarang-insurance.md` (grep for confirm / success / STM).
6. `fetch.mjs ts EAINT-12175` — "No workbook matches".
7. **Added 2026-10-27:** `_reference/tickets/Studying/EAINT-9215/SRD_EAINT-9215_eAuto_To_Reflect_NDDP_Changes_for_STMAB_V1.1_20112025-text.md` (grep lines 117, 147, 155, 167, 175); `_reference/tickets/Studying/EAINT-9903/EAINT-9903-jira.md` (full); `fetch.mjs ts EAINT-9903` — "No workbook matches".
8. **Scout reply 2026-10-27** — NDDP page map (A), resume scope (B). Table 2.2.1.3 / 2.2.1.5 quotes taken from that reply, not re-read.
9. **Not read:** `_reference/sharepoint/qa-team-ts/INDEX.md` (does not exist); no `*-qa-team-ts-study.md` exists; 12107 TS rows only counted; 8536, 9024, 9062, 9611 text copies not reopened.
