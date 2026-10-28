# EAINT-12406 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-12406/brief.json`. Test host: **staging/ia** [answered by Faizuddin on 2026-10-27].

1. **High-level scope:**
   1. **Secarang static pages:** Allianz logo on Home (Lonpac, Allianz, Tokio Marine); new About Us partnership sentence; FAQ insurer list; new Allianz Support section (expand / collapse).
   2. **Quotation page:** Allianz card + logo for an individual renewal; order Lonpac > Allianz > Tokio Marine, with each insurer missing in turn.
   3. **"Allianz – Quotation unavailable" card** after Tokio Marine for a company car and an individual non-renewal.
   4. **Allianz end-to-end purchase:** add-ons, product documents, payment, success page, cover note / e-Certificate.
   5. **Receipt** (Secarang + CIBO): Allianz name with "200601015674 (735426-V)" on its own line; Lonpac and Tokio Marine receipts unchanged.
   6. **CIBO Transaction Details:** Allianz registration number below the insurer name; other insurers unchanged.
   7. **Regression:** Lonpac and Tokio Marine purchases; Allianz row in CIBO Transaction Management.
2. **Estimated testing time:** **4.5 man-days** (range **4-5**), confidence **low** [unconfirmed]. No official figure: Jira "[QA] Est Man-day (cf 10081): —" (`EAINT-12406-jira.md` line 11); no Miro card (Scout study, Open question 2).
3. **Modules / pages to cover:**
   1. **Secarang insurance (Secarang):** Home, Quotation, About Us, FAQs, Support — changed by REQ-001 to REQ-009 (logo, Allianz quote, order, unavailable card, wording, contact section).
   2. **Secarang purchase (Secarang):** Add-ons, Confirmation, Select Payment Method, Payment Successful, Receipt PDF — Allianz full E2E required (SRD v1.1 §2.1.3 a) + REQ-010 receipt BRN line.
   3. **Transaction Management (CIBO):** Transaction Management listing, Transaction Details, Receipt download — REQ-011 BRN line and REQ-010 CIBO receipt; listing is regression.

## Header

1. **Module / portal:** **Secarang** insurance (public site: Home, Quotation, About Us, FAQs, Support, Receipt) + **CIBO** (Receipt, Transaction Details). `[EAINT-12406-study.md § Header #13; § What changes #7]`
2. **Past tickets kept:** **7** (5 with a QA Team workbook, 1 with a TS only in the repo snapshot, 1 with no workbook).
3. **Own official TS:** **none** in the QA Team folder as of 2026-10-27.
4. **Dropped (name-only matches, eAuto-side only):** EAINT-8467, 9615, 9214, 9306, 9023, 10435, 8595, 11977, 11925. All test eAuto Get Quote / BO / AATF, not Secarang. EAINT-9023 is the eAuto twin of EAINT-9024 (kept).
5. **Peripheral, not kept:** EAINT-11541 (CIBO Payment Report "RMS → Fiuu"). Only relevant if CIBO payment reports are in scope (Scout Open question 8).
6. **Rechecked 2026-10-27 (second ranking):** EAINT-12151 (CIBO Transaction Management date fields + Insurance Creation Date filter) **not kept**. Its TS test listing date columns and filters, not the Transaction Details insurer line. `_reference/tickets/EAINT-9615/EAINT-9615-qa-team-ts-study.md` is eAuto BackOffice — not kept.

## Related past tickets

1. **EAINT-9024** — "⚪[Secarang] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign".
   1. Workbook: `QA Team - eAuto - CR Test Scenarios` → Secarang & CIBO → `EAINT-9024 - [Secarang] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign.xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9024 - … .md`.
   2. Why: **same Secarang Quotation page, same insurer order / visibility check** as REQ-004.
2. **EAINT-8608** — "⚪[Secarang][Insurance] To onboard Zurich Takaful under Pemaju Eksklusif Sdn. Bhd." (status Testing In 1st Env).
   1. Workbook: **none found** (`fetch.mjs ts EAINT-8608` → "No workbook matches").
   2. Why: **linked ticket**; the last time an insurer was added to Secarang end to end. Its QA-Issue sub-tasks show where an insurer switch-on breaks.
3. **EAINT-12107** — "⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay".
   1. Workbook: `EAINT-12107 - ⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/eauto-snapshot/EAINT-12107 - … .md`. Later local copy: `_reference/tickets/EAINT-12107/New 20_10_26 - …xlsx` `[flow-secarang-insurance.md §7 #17 h]`.
   2. Why: **linked ticket**; same Secarang purchase path (quotation → payment → success → receipt) + **CIBO Transaction Details** checks. Payment rails Allianz has never run with.
4. **EAINT-8331 / 8334 / 7199** — "Secarang to Remove Discount Line" (receipt, email, WhatsApp).
   1. Workbook: Secarang & CIBO → `EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.md`.
   2. Why: **same Secarang Receipt PDF + CIBO receipt download** as REQ-010. Only past TS that names **Allianz under Serba Sentral**.
5. **EAINT-8786** — "⚪[eAuto][Secarang] To update the latest PDS for Syarikat Takaful Malaysia".
   1. Workbook: Secarang & CIBO → `EAINT-8786 - [Secarang] To update the latest PDS for Syarikat Takaful Malaysia.xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8786 - … .md`.
   2. Why: **insurer product documents on Secarang** (Step 2, Step 4, Confirm and Pay, e-Policy email) — same places REQ-006 Allianz documents appear.
6. **EAINT-9062** — "[Secarang-Lonpac] Enhancement on Vehicle details API - Policy Renewal Enhancement – 14-Day Grace Period After Expiry".
   1. Workbook: Secarang & CIBO → `EAINT-9062 - … .xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9062 - … .md`.
   2. Why: **renewal-window eligibility on Secarang** — the data condition REQ-002 / REQ-003 depend on ("Allianz only returns a quotation for individual owners renewing their insurance").
7. **EAINT-8536** — "[eAuto & Secarang] [Insurance] To enable WhatsApp notifications to 018-2884889 for failed cover note submissions".
   1. Workbook: `EAINT-8536 - [eAuto & Secarang] [Insurance] … .xlsx`. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-8536 - … .md`.
   2. Why: **Secarang cover note path** (success + failed). SRD v1.1 §2.1.3 a asks for full E2E incl. "cover note, callbacks".

## What was tested before

1. **EAINT-9024** (sheet Sheet1, env R4 "Test environment: staging/eauto"):
   1. **9024_SECARANG_TS1** (R8): pre-req "VN with the quotations below: ⏎ 1. Lonpac✅ ⏎ 2. Tokio Marine✅"; expected "Display ALL insurances: ⏎ 1. Lonpac✅ ⏎ 2. Tokio Marine✅". Result **PASS**.
   2. **9024_SECARANG_TS2** (R9): "Lonpac✅ ⏎ 2. Tokio Marine❌" → "Display ONLY the top insurance: ⏎ 1. Lonpac✅". Result **Not Started**.
   3. **9024_SECARANG_TS2** (R10, duplicate id): "Lonpac❌ ⏎ 2. Tokio Marine✅" → "Display ONLY the top insurance: ⏎ 1. Tokio Marine✅". Result **Not Started**.
   4. Steps re-check order after "Change Variant/Transmission, Postcode and Sum Insured", after "BACK to Step 1" from Step 2 and Step 3 (R8 steps 4-11).
2. **EAINT-12107** (sheet Sheet1, Secarang + CIBO columns):
   1. **12107_TS01** (R4) "Successful Pay With Grab ⏎ CIBO - Filter GrabPay" — Lonpac, private car; CIBO Transaction Management, Transaction Details, Payment Management, Payment Report.
   2. **12107_TS02** (R5) "Failed Pay With Grab ⏎ CIBO - Filter GrabPay" — "Enter vehicle number (company car)", "Choose Tokio Marine".
   3. **12107_TS03-05** (R6-R8) "CIBO display different payment method" — "Ask dev to patch the transactions to ShopeePay / SPayLater / PayLater by Grab".
   4. **12107_TS06** (R9-R15) "CIBO Filter function".
   5. **12107_TS07** (R17) "Payment method = Credit or Debit Card"; **12107_TS08** (R18) "Payment method = FPX" — both under "REGRESSION" (R16), Lonpac.
3. **EAINT-8331 / 8334 / 7199** (sheet "EAINT-8331, 8334 & 7199", env R6 "staging/preprod"):
   1. **SEC_RECEIPT_TS1-TS5** (R14-R18) — new Secarang transaction with discount codes; check "Receipt PDF in Payment Successful Page and ⏎ CIBO Transaction Management", Email, WhatsApp. All **PASS**.
   2. **SEC_RECEIPT_TS6-TS7** (R20-R21) "[Regression] ⏎ New Transaction - Secarang Homepage ⏎ WITHOUT Discount Code". **PASS**.
   3. **SEC_RECEIPT_TS8-TS10** (R23-R25) "Existing Transaction - CIBO"; pre-req lists "Serba Sentral (Allianz / eTiqa)". **PASS**.
4. **EAINT-8786** (sheet EAINT-8786):
   1. **8786_SEC_TS1-TS3** (R3-R5) Individual: "[Plan Details]" → "[Product Disclosure (English)] and [Product Disclosure (Malay)]" at Step 2, Step 4 and "[Confirm and Pay]".
   2. **8786_SEC_TS4** (R6) "Download the ZIP file attached together with the email".
   3. **8786_SEC_TS5-TS8** (R7-R10) same for Company ("Enter Vehicle Number and Company Registration No.").
5. **EAINT-9062** (sheet EAINT-9062, all **Pass**):
   1. **9062_TS1** (R2) "Policy expired and is still within 14-day renewal period" → "Able to purchase Lonpac insurance".
   2. **9062_TS2** (R3) "more than 14-day" → "Unable to purchase Lonpac insurance".
   3. **9062_TS3** (R4) "Policy still active and is within 60 days before expiry date" → "Able to purchase".
   4. **9062_TS4** (R5) "more than 60 days before expiry date" → "Unable to purchase".
6. **EAINT-8536** (sheet EAINT-8536, env R4 "staging/preprod2"):
   1. **WA_FAILCN_TS1** (R9) "New Transaction - Secarang (Homepage) ⏎ Cover Note Submission = Failed" — Tokio Marine, "vehicle details with prefix VB". **PASS**.
   2. **WA_FAILCN_TS6** (R14) "New Transaction - Secarang (Homepage) ⏎ E2E Happy Flow" — Lonpac. **PASS**.
7. **EAINT-8608:** no TS workbook. Only the QA-Issue list (see "Past QA-Issues mentioned").

## Reusable scenarios

1. **Insurer order on Quotation page** (REQ-004): adapt **9024_SECARANG_TS1 / TS2** — swap to 3 insurers "Lonpac > Allianz > Tokio Marine"; keep the re-check after "Change Variant/Transmission, Postcode and Sum Insured" and after "BACK to Step 1". One row per REQ-004 AC example.
2. **Allianz unavailable card** (REQ-003): adapt **9024_SECARANG_TS2** structure (one insurer ❌), but expected = "Allianz – Quotation unavailable" card after Tokio Marine, not "Display ONLY the top insurance". [unconfirmed which rule wins — Scout Open question 4]
3. **Renewal eligibility** (REQ-002 / REQ-003 non-renewal): adapt **9062_TS1-TS4** — expired ≤14 days / >14 days, active ≤60 days / >60 days, with Allianz in place of Lonpac. [unconfirmed that Allianz uses the same windows]
4. **Allianz E2E purchase + CIBO** (SRD §2.1.3 a, REQ-011): adapt **12107_TS08** (FPX) and **12107_TS01** CIBO column (Transaction Management, Transaction Details, Payment Management, Payment Report) with "Choose Allianz".
5. **Receipt BRN line** (REQ-010): adapt **SEC_RECEIPT_TS6** steps "Download Insurance Receipt PDF in Payment Successful Page and ⏎ CIBO Transaction Management"; expected = "Allianz General Insurance Company (Malaysia) Berhad ⏎ 200601015674 (735426-V)".
6. **Old Allianz records in CIBO** (Scout Open question 13): adapt **SEC_RECEIPT_TS8-TS10** "Existing Transaction - CIBO" with "Serba Sentral (Allianz / eTiqa)".
7. **Allianz product documents** (REQ-006): adapt **8786_SEC_TS1-TS4** — "[Plan Details]" → "More Info" links at Step 2, Step 4, Confirm and Pay, plus e-Policy email ZIP. Expected = 2022 documents open; no date defect.
8. **Cover note success / failed** (SRD §2.1.3 a): adapt **WA_FAILCN_TS6** (happy flow) and **WA_FAILCN_TS1** (prefix VB = cover note failed) with Allianz. [unconfirmed that the VB prefix stub covers Allianz]
9. **Regression Lonpac / Tokio Marine unaffected:** reuse **12107_TS07 / TS08** as is.

## Known traps

1. **Duplicate TS id in 9024:** "9024_SECARANG_TS2" used on R9 and R10; both rows "Not Started". Only TS1 was ever run. `[EAINT-9024 text copy, Sheet1 R9-R10]`
2. **Single-insurer rule from 9024:** "Display ONLY the top insurance" (R9 / R10 expected). REQ-003 now shows an unavailable card instead. Do not copy the 9024 expected result. [unconfirmed whether 9024 rule still runs on Secarang]
3. **Messagebird toggle:** 9024 R8 step 12 "ensure messagebird is disabled"; 8331 and 8536 pre-req "Note: ensure messagebird is enabled". WhatsApp sends depend on it.
4. **Company car / Takaful availability:** 8331 R15 remark "Tested with TMIM as Takaful not available"; R21 same. Later: "there are no insurance in secarang that supports company" `[flow-secarang-insurance.md §7 #17 g, from QA team 2026-10-20]`. Company-car tests for REQ-003 may show the "no instant quotation" popup, not cards.
5. **Tokio Marine unavailable for made-up plates:** "Tokio Marine showed "quotation unavailable" for a private car (HXA0095A)". `[flow-secarang-insurance.md §7 #17 g]` Data for "all 3 available" will be hard.
6. **/ia vs /preprod data:** "/ia quotes a made-up plate … /preprod refuses it". `[flow-secarang-insurance.md §7 #15 a]`
   1. **Update 2026-10-27 (Scout reply):** **no source names the 12406 host.** Jira, SRD v0.1-v1.1 and Teams (to 2026-10-26) are silent. The last Secarang TS that names Allianz used "Test environment: staging/preprod" `[EAINT-8331, 8334 & 7199 text copy, R6]` — history only, not 12406.
   2. **Update 2026-10-27 (Scout reply):** **no plate + IC is known to return an Allianz quote** on any staging host. SRD gives the rule only: "Allianz only returns a quotation for individual owners renewing their insurance." `[SRD v1.1 §2.2.5 REQ-002]` The HXA0001A-HXA0020A + IC 030217141005 set is proven for Lonpac on /ia only. Use `/eauto/secarang-plate-checker` to check Allianz before drafting data. [unconfirmed]
   3. **Answered 2026-10-27 (Faizuddin, dashboard chat):** host = "on staging/ia". The "/preprod refuses it" trap does not apply to 12406 runs.
   4. **Answered 2026-10-27 (Faizuddin, dashboard chat):** Allianz test data: "data can get from dev/stakeholder later". The TS leaves plate + IC as typed inputs until then.
7. **12107_TS02 changed after the SharePoint copy:** company car + Tokio Marine → private car + Lonpac ShopeePay. `[flow-secarang-insurance.md §7 #17 g]` Reuse the local v3, not the SharePoint row.
8. **Dev-patched payments:** 12107_TS03-05 "Ask dev to patch the transactions to ShopeePay". Same approach may be needed for Allianz callback paths.
9. **Cover note fail stub:** 8536 R10 remark "Dev will hardcode specific vehno prefix to allow sending of required whatsapp message"; prefix "VB" = failed cover note, "VF" = JPJ rejected (R9, R12).
10. **Serba Sentral = Allianz agency:** 8331 R23 "Serba Sentral (Allianz / eTiqa)"; "Pemaju Eksklusif (Lonpac / Tokio Marine)". Matches SRD §2.1.3 b Finance check "under agency Serba Sentral".

## Past QA-Issues mentioned

1. **EAINT-8608** sub-tasks (Jira capture `_reference/tickets/Studying/EAINT-8608/EAINT-8608-jira.md` line 13), most relevant to 12406:
   1. "EAINT-10968 [Secarang - Insurance] Zurich Transactions are not showing up in CIBO > Transaction Management".
   2. "EAINT-10969 [Secarang - Insurance] Missing Zurich Takaful filter option in CIBO > Transaction Management".
   3. "EAINT-11025 [Secarang - Insurance] Unable to Retrieve Quotation for Zurich Insurance".
   4. "EAINT-11064 [Secarang - Insurance] Hyperlinks in Plan Details > More Info are opening the wrong documents".
   5. "EAINT-11204 [Secarang - Insurance] Incorrect wording in receipt"; "EAINT-11219 [Secarang - Insurance] Details issues at receipt".
   6. "EAINT-11675 [CIBO - Insurance] Issues with details at CIBO details and receipt".
   7. "EAINT-11681 [Secarang - Insurance] Incorrect PIAM ID for Zurich".
   8. "EAINT-11727 [Secarang - Insurance] e-Certification downloaded from secarang is not showing the user's email".
   9. 27 sub-tasks in total.
2. **EAINT-8631** (sub-task of EAINT-8334): "[Secarang - CIBO] Existing old transaction's receipt 'Discount' & 'Total Amount' hidden". Relevant to old Allianz receipts.
3. **EAINT-9054** (sub-task of EAINT-8536): "[Secarang] Not receiving Failed Cover Note Submission whatsapp message".
4. **EAINT-12107, 9024, 8786, 9062:** no sub-tasks in Jira.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — the official figure lives in the QA Portal.

1. **Comparable tickets:**

| Ticket | Scope | TS count (workbook text copy) | [QA] Est Man-day (cf 10081) |
|---|---|---|---|
| EAINT-9024 | Secarang insurer order | 2 ids / 3 rows | "—" (`EAINT-9024-jira.md` line 11) |
| EAINT-12107 | Secarang payment + CIBO | 8 ids (TS01-TS08) / 14 rows | **2** (`EAINT-12107-jira.md` line 11) |
| EAINT-8331/8334/7199 | Secarang + CIBO receipt | 10 (SEC_RECEIPT_TS1-TS10) | "—" (`EAINT-8331-jira.md`, `EAINT-8334-jira.md` line 11) |
| EAINT-8786 | Secarang product docs | 8 | "—" (`EAINT-8786-jira.md` line 11) |
| EAINT-9062 | Secarang renewal window | 5 | "—" (`EAINT-9062-jira.md` line 11) |
| EAINT-8536 | Secarang cover note WA | 7 | "—" (`EAINT-8536-jira.md` line 11) |
| EAINT-8608 | New insurer on Secarang | no workbook | **15** (`EAINT-8608-jira.md` line 11) |

   1. Scout study: "[QA] Est Man-day: blank" and "No Miro card found" `[EAINT-12406-study.md § Header #5; Open questions #2]`.
2. **Expected TS count for EAINT-12406:** **16-22**.
   1. Why: 4 static pages (REQ-001, 007, 008, 009) + 4-5 quotation order / unavailable rows (REQ-003, 004) + 1-2 Allianz E2E + 2-3 receipt + 2 CIBO Transaction Details + 2-3 regression. Wider than 12107 (8), far smaller than a new-insurer onboard (8608).
3. **Estimate in man-days: 4-5.**
   1. **TS drafting:** 0.5.
   2. **Test execution:** 2 — static pages are fast; the Allianz E2E and finding a renewal-due individual vehicle that quotes Allianz on staging are slow.
   3. **Retest / QA-Issue buffer:** 1 — Allianz has not run since May 2025; 8608 showed an insurer switch-on raises receipt, CIBO and document issues.
   4. **Automation build:** 0.5-1.5 — static-page text + logo order checks and quotation order via existing `scripts/eauto-12107` / `scripts/secarang-insurance` page objects. Allianz E2E only if test data quotes it.
4. **Confidence: low.**
   1. Raises it: test env named; a known plate + IC that returns an Allianz quote on staging; answer on Zurich / other insurers in the sequence (Scout Open question 3).
   2. **Update 2026-10-27:** Scout confirmed host and Allianz test data are **both unknown** (see Known traps #6). Confidence stays **low** until the developer answers.
   3. **Update 2026-10-27 (Faizuddin):** host settled as **staging/ia**. Allianz data comes from the developer or stakeholder later. Confidence stays **low** (corrected 2026-10-27; an earlier note said "low-medium", but the Allianz test data is still missing). Execution time depends on when that data arrives. Single figure for the brief: **4.5 man-days**.
   4. Pushes it up: Allianz staging API not live (cover note / callbacks), or CIBO payment / commission reports added to scope (Scout Open question 8).

## Sources read

1. `_reference/tickets/Studying/EAINT-12406/EAINT-12406-study.md` (Scout study).
2. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9024 - [Secarang] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign.md`.
3. `_reference/sharepoint/qa-team-ts/eauto-snapshot/EAINT-12107 - ⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.md` (fetched 2026-10-27).
4. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8331, 8334 & 7199 - Secarang to Remove Discount Line.md` (fetched 2026-10-27).
5. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-8786 - [Secarang] To update the latest PDS for Syarikat Takaful Malaysia.md`.
6. `_reference/sharepoint/qa-team-ts/secarang-cibo/EAINT-9062 - … 14-Day Grace Period After Expiry.md`.
7. `_reference/sharepoint/qa-team-ts/EAINT-8536 - [eAuto & Secarang] [Insurance] … .md`.
8. Jira captures (fetched 2026-10-27): `_reference/tickets/Studying/EAINT-{9024,12107,8331,8334,8786,9062,8536,8608}/…-jira.md`; `EAINT-12406-jira.md`.
9. `knowledge/cr-test-scenario-catalogue.md` (Secarang & CIBO table, rows 031, 065, 129-137).
10. `knowledge/flow-secarang-insurance.md` §7 Traps, §8.
11. Grep of `_reference/sharepoint/qa-team-ts/` for "secarang" / "allianz"; candidate list items 2-10 checked by title and dropped.
12. `_reference/tickets/*/*-qa-team-ts-study.md` — **none exist**.
13. `fetch.mjs ts EAINT-8608` — "No workbook matches".
