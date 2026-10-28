# EAINT-12386 — related history (2026-10-27)

## Ticket brief

1. **High-level scope** (same as `data/pipeline/work/EAINT-12386/brief.json` "scope"):
   1. Chassis No field on UCD Get JomCheck Reports keeps today's input rules (special characters allowed, 30-character limit, mandatory).
   2. Backend removes all special characters before the precheck and submission APIs; the screen still shows the typed value.
   3. Backend length check after trimming: 17 or fewer goes to payment; more than 17 shows "Invalid Chassis Number." and blocks payment.
   4. JomCheck "Invalid Chassis No." response still blocks payment with "Invalid Chassis Number.".
   5. Cron job resubmits empty reports (not Invalid Chassis cases), up to the retry limit; after that no further action.
   6. Note "Please try again to download report 10 mins later." on the JomCheck payment done page when the report is empty.
   7. Regression: vehicle-number purchase, listings and chassis search (UCD, BO, Service Portal), Resubmit visibility, Invoice / e-Invoice, pre-deployment reports untouched.
2. **Estimated testing time:** **2.5 man-days**, range **2–3.5**, confidence **low** [unconfirmed]. (Lowered 2026-10-27 from 3 / 2.5–4 after Elf's SRD-based TS proposal.) No official figure: Jira "[QA] Est Man-day (cf 10081): —" `[EAINT-12386-jira.md, item 7]`; no Miro link for this ticket in `_reference/miro-links.txt`. Detail in "## Estimated testing effort".
3. **Modules / pages to cover:**
   1. **JomCheck (UCD):** Get JomCheck Reports, JomCheck Payment Done, JomCheck Transaction Listing, JomCheck Details (Invoice / e-Invoice) — changed by REQ-001 to REQ-004 and REQ-006; listings and documents need regression.
   2. **Cron Job — JomCheck (backend):** empty report resubmission — new, REQ-005.
   3. **JomCheck (BO):** Jomcheck Transaction Enquiry, JomCheck Report Listing, SST Payment Report (JomCheck) — regression: chassis filter, Resubmit visibility, status after cron.
   4. **JomCheck Report Listing (Service Portal):** chassis search — regression only (not in SRD scope), exact-match search on the stored chassis value.
   5. **eSim (test tool):** JomCheck Enquiry, JomCheck Report — test data only; no empty-report option today.

## Header

1. **Module / portal:** **JomCheck**, "1. UCD ⏎ 2. Cron Job" `[SRD v0.4 §2.2.1 row 2]`. Affected pages: "UCD — JomCheck", "UCD — JomCheck Payment Done", "Cron Job — JomCheck" `[SRD v0.4 §2.2.3]`.
2. **Past tickets kept:** **6** — EAINT-6475 (chassis search at purchase), EAINT-9203 (Resubmit visibility on Payment OK + Tx Failed), EAINT-8638 (BO JomCheck Report Listing), EAINT-10937 (Service Portal JomCheck Report Listing + "Reset Payment Cronjob" TS), EAINT-12339 (JomCheck API v2.0), EAINT-12412 (Invoice / e-Invoice split).
3. **Own official TS:** **none** in the QA Team folder. Elf draft: `data/pipeline/work/EAINT-12386/scenarios.md` (5 TS, written before SRD v0.4 was read).
4. **Dropped (name-only match):**
   1. EAINT-7495 — UCD Payment Report export; no chassis-input or empty-report rows.
   2. EAINT-7496 — Download Payment Document; same reason.
   3. EAINT-9786 — system-maintenance popup; no chassis / empty-report rows.
   4. EAINT-10168 — reconciliation report; "Refund Required" is JPJ core, not JomCheck empty report.
   5. EAINT-10089 — RM18→RM20 price change; read 2026-10-27; only one chassis-submit row reused (Reusable item 12).
   6. EAINT-11175 — BO bank / credit company permission checkboxes; not this flow.
5. **SRD now read (2026-10-27):** `SRD_EAINT-12386_v0.4_20261026-text.md`. Earlier [unconfirmed] points settled by it are marked "SRD v0.4" below.

## Related past tickets

1. **EAINT-6475** — "To allow searching for vehicles by chassis number to purchase the JomCheck report". Workbook: `QA Team - eAuto - CR Test Scenarios\EAINT-6475 - To allow searching for vehicles by chassis number to purchase the JomCheck report.xlsx`. **Why:** built the Chassis No input and its current on-screen strip rule, which REQ-001 keeps ("Frontend handling remains as it is today"). Linked ticket.
2. **EAINT-9203** — "Restrict UCD from Resubmitting JomCheck When Payment Is Completed and Tx Status is Failed". Workbook: `...\EAINT-9203 - Restrict UCD from Resubmitting JomCheck When Payment Is Completed and Tx Status is Failed.xlsx`. **Why:** Resubmit visibility on Payment OK + Tx Failed — the state an empty report leaves before the cron runs. Linked ticket.
3. **EAINT-8638** — "🔴[eAuto-BackOffice] To Create JomCheck Report Listing". Workbook: `...\EAINT-8638 - 🔴[eAuto-BackOffice] To Create JomCheck Report Listing.xlsx`. **Why:** BO chassis filter keeps "- / space *" and is exact-match; the stored chassis value decides search results. Linked ticket.
4. **EAINT-10937** — "🔴[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing". Workbook: `...\EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs\EAINT-10937 - 🔴[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing.xlsx`. **Why:** Service Portal chassis search (exact match) and the only past JomCheck cron TS ("Reset Payment Cronjob", including "Failed to Retrieve Report"). Linked ticket.
5. **EAINT-12339** — "[eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0". Workbook: `...\EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0.xlsx`. **Why:** last full purchase-by-chassis run; source of the "Invalid Chassis No." block kept by REQ-004. Linked ticket.
6. **EAINT-12412** — "[eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge". Workbook: `...\EAINT-12412 - [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge.xlsx`. **Why:** documents on a Failed → resubmitted → Approved transaction; a cron recovery should produce the same. Linked ticket.

## What was tested before

1. **EAINT-6475** (env "staging/sit2", sheet Functional TS R2):
   1. **JC_6475_TS2 — radio states** — "Verify UI field states based on radio button selection" (Functional TS, R8). Chassis reminder: "Payments are strictly non-refundable if the report cannot be generated due to an invalid Chassis Number."
   2. **JC_6475_TS5 / TS6 — mandatory field** — "To verify mandatory field validation" (Functional TS, R11-R12): "A validation message "This field is required" under Chassis Number field will be displayed."
   3. **JC_6475_TS9 / TS10 / TS11 — input methods** — "To verify system allows copy-paste & cut-paste on Chassis Number" (Functional TS, R16-R18).
   4. **JC_6475_TS12 — allowed special characters** — "To verify system allows special characters: (* , / , - ) and space(front & back) on Chassis Number" (Functional TS, R19). Expected: "System auto removes special characters (except for * / -)". Remark: "Ask about the spacing part".
   5. **JC_6475_TS13 — non-ASCII removed** — "To verify system auto-removes or trims invalid characters (e.g., Chinese characters)" (Functional TS, R20).
   6. **JC_6475_TS14 — uppercase** — "To verify system auto-capitalizes lowercase letters entered in the chassis number" (Functional TS, R21).
   7. **JC_6475_TS11 (duplicate id) — 30-character limit** — "To verify maximum character limit allowed in Chassis Number field" (Functional TS, R22). Not run; Remark: "Deprioritised as no limit set for Chassis Number".
   8. **6475_E2E_TS01 — happy flow by chassis** — "Happy Flow" (E2E TS, R5-R7). RHB ID: "With ONLY the first 8 alphanumeric characters displayed", "No special characters or blank spaces", "ABCD-E12 4UYB" → "JOM241021000012-ABCDE124" (R7).
   9. **6475_E2E_TS02 / TS03 — chassis not found then re-input** (E2E TS, R8-R15): "Chassis not found. Try again with another chassis, Tx status = Pending".
   10. **6475_E2E_TS06 — failed retrieve by chassis** — "To verify system behaviour when UCD resubmit failed Jomcheck transaction using chassis number" (E2E TS, R21-R22): "Jomcheck Payment = OK , Tx Status = Failed DUE TO FAILED RETRIEVE REPORT"; "The Resubmit button is NOT displayed."
   11. **JOMUCDSF_TS2 / JOMBOSF_TS2 — listing search by chassis** (SnF Functionality (Chassis No), R6-R12, R22-R28): "Special Character (* - / )" → "Display record matching the special character ( * - / )".
   12. **JOMBOSF_TS6 — SST Payment Report chassis search** (SnF Functionality (Chassis No), R38-R44).
2. **EAINT-9203** (env "staging/uat2", sheet 9203 TS v2 (May) R3):
   1. **9203_TS1 — Payment OK + Tx Failed, new transaction** — "To verify when Payment = OK , Tx Status = Failed, LHDN = - , the 'Resubmit' action is NOT showing for UCD but remain showing for BO user" (R8-R9). After BO resubmit: "Tx Status = Approved", Resubmit hidden on both.
   2. **9203_TS8 / TS16 — existing transaction, BO resubmit fails** (R16-R17, R25-R26): "Tx Status = Failed", "Ensure 'Resubmit' action remain showing".
   3. **9203_TS5 — Payment Failed + Tx Failed** — Resubmit hidden on both (R13).
   4. **9203_PROD_TS2 / TS3 — prod check of Payment OK + Tx Failed** (R33-R34).
3. **EAINT-8638** (sheet SnF Fields & Results):
   1. **8638_SnF_TS10 — allowed special characters kept** — "1FTE-F14e/3GRA 372*49" → "the special characters are retained" (R14).
   2. **8638_SnF_TS11 — other characters removed** — "1FTE~F1<4E]3GRA=372!49" → "automatically removed" (R15).
   3. **8638_SnF_TS21 / TS22 — full vs partial chassis** (R28-R29): partial → "Result will display unmatched or "0 record(s) in total"".
4. **EAINT-10937**:
   1. **10937_SNF_TS14 — Service Portal chassis with special characters** (Functional Testing (S&F), R16): "special characters are retained".
   2. **10937_SNF_TS17 / TS18 — exact match** (R19-R20): "Only exact match search is allowed".
   3. **10937_E2E_TS14 — failed retrieve across deployment** — "Reset Payment Cronjob ⏎ BEFORE Deployment, Failed to Retrieve Report" (E2E, R43-R45): "Tx Status should remain as Failed, with payment history"; "Resubmit and do Payment > Proceed until Tx status = Approved".
   4. **10937_E2E_TS10–TS13 — other states across deployment** — "Reset Payment Cronjob" for Approved / Enquiry Failed / Pending / Failed (E2E, R31-R42).
5. **EAINT-12339** (sheet Test Scenarios):
   1. **12339_TS03 — purchase by chassis** — "Verify JomCheck report purchased by Chassis No. shows the same re-sourced fields as purchase by Vehicle No." (R7).
   2. **12339_TS31 — old failed transaction untouched** — "Verify an existing failed transaction remains unchanged after a new transaction is created for the same vehicle" (R37): "The old failed transaction remains unchanged (still shows Payment OK, Tx Failed, no report)".
   3. **12339_TS45 — BO listing filters unchanged** (R57).
6. **EAINT-12412** (sheet Test Scenarios):
   1. **12412_TS04 — paid then Failed, Invoice** (R7). Data: "In eSim, set Report Result = "Failed" for the vehicle no. prefix".
   2. **12412_TS09 — old Failed resubmitted from BO** (R15). "Not Started"; Remarks "Deprio - Ops wont resubmit".
7. **EAINT-10089** (sheet Price Change Functional):
   1. **10089 TS-005 — chassis "found" prompt** (R8): " Chassis number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report."

## Reusable scenarios

**Mapped to Elf's proposed rebuild (2026-10-27, not yet applied — pending Faizuddin's review in Elf's chat):**

1. **New TS01 — special characters, 17 or fewer after trim, report returned** (Matrix row 1, REQ-002 Example 1, REQ-003 Example 1, REQ-006 Example 2) ← items 3, 6, 12 below.
2. **New TS02 / TS03 — over 17 after trim / over 17 without special characters, "Invalid Chassis Number."** (Matrix rows 3–4) ← item 4.
3. **New TS04 — not found by precheck, "Invalid Chassis Number."** (Matrix row 5, REQ-004 Example 1) ← item 5.
4. **New TS05 / TS06 — empty report note + cron retrieves / still empty after 5 attempts** (REQ-006 Example 1, REQ-005 Examples 1 and 4) ← items 7, 8, 9.
5. **New TS07 (optional) — existing transaction unchanged** (REQ-002 Example 3) ← items 10, 13.
6. **No new TS** for Matrix rows 2, 6, 7: REQ-001 — Chassis No field at UCD: "Frontend handling remains as it is today." Items 1–2 become **regression only**, not new TS.
7. **Listing / search (item 11)** is **not in SRD scope** (Elf: "No REQ mentions listings, the PDF or search"). Kept as **regression only**, because EAINT-10505 shows chassis search with special characters already broke once [unconfirmed whether stored value changes].

**Source TS per item:**

1. **Field rules (REQ-001)** — reuse **JC_6475_TS5/TS6** (mandatory), **TS9–TS14** (input methods, non-ASCII, uppercase). Expected results stay as today: SRD v0.4 REQ-001 "Frontend handling remains as it is today."
2. **30-character stop (REQ-001 Example 4)** — revive **JC_6475_TS11 (R22)**; it was never run.
3. **Backend trim, 17 or fewer (REQ-002 / Matrix row 1)** — base on **6475_E2E_TS01** and **12339_TS03**; type "JTD-12345-678901234" (SRD example); expect payment allowed and the screen still showing the typed value.
4. **Over 17 after trim (REQ-003 / Matrix rows 3–4)** — adapt **6475_E2E_TS02** steps; expect "Invalid Chassis Number." and no Pay Now.
5. **"Invalid Chassis No." from JomCheck (REQ-004 / Matrix row 5)** — adapt **6475_E2E_TS02**; eSim JomCheck Enquiry Result = "No" [unconfirmed that "No" returns "Invalid Chassis No." for a chassis].
6. **Payment reference** — **6475_E2E_TS01 R7** "first 8 alphanumeric characters" on RHB ID / Invoice Ref No with a chassis typed with "-".
7. **Empty report → Failed starting state** — **6475_E2E_TS06**; data setup from **12412_TS04** (eSim Report Result = "Failed") [unconfirmed that "Failed" equals an empty report code].
8. **Resubmit visibility around the cron** — **9203_TS1 / TS8** (UCD hidden, BO shown; after success both hidden).
9. **Documents after cron recovery** — **12412_TS09** steps 5-12 (Approved, Invoice + e-Invoice 2 lines, MyInvois).
10. **Old reports untouched (REQ-002 Example 3)** — **12339_TS31** pattern.
11. **Listings / search by chassis** — **JOMUCDSF_TS2, JOMBOSF_TS2** (6475), **8638_SnF_TS10/TS21/TS22**, **10937_SNF_TS14/TS17/TS18**: search by the typed value with "-" and by the trimmed value.
12. **Chassis "found" prompt** — **10089 TS-005** (Price Change Functional, R8).
13. **Cron before/after deployment** — **10937_E2E_TS14** layout (create Failed on old code, check on new code).

## Known traps

1. **Strip rule differs per page.** UCD purchase: "System auto removes special characters (except for * / -)" `[6475, Functional TS, R19]`. BO / Service Portal search: "the special characters are retained" `[8638 SnF Fields & Results R14; 10937 Functional Testing (S&F) R16]`. SRD v0.4 REQ-002 c: "Value displayed on the UCD screen remains as keyed in". **What is stored** (typed or trimmed) is not in the SRD [unconfirmed]; it decides exact-match search results.
2. **Exact-match search.** "Only exact match search is allowed" `[10937, Functional Testing (S&F), R19]`; BO "Partial Chassis Number | Result will display unmatched" `[8638, R29]`. UCD listing allows partial: "Displays records matching the partial chassis number" `[6475, SnF Functionality (Chassis No), R8]`.
3. **30-character stop never tested.** "Deprioritised as no limit set for Chassis Number" `[6475, Functional TS, R22, Remarks]` vs SRD v0.4 REQ-001 Example 4 "Field stops further input at 30 characters, following existing handling." [unconfirmed whether the field stops at 30 today].
4. **Chassis has no report-availability precheck.** "Deprioritise since Chassis Number field doesnt have enquiry in Submit button" `[6475 workbook, Sheet1, R3, Remarks — 9786_E2E_TS1]`. SRD v0.4 §2.2.2 row 1 item 7: "Report availability is not returned when the enquiry is made with Chassis No." Item 8: it "is still able to return whether the Chassis No is invalid."
5. **Chassis "not found" may never happen live.** "*In prod will not hit this" `[6475, E2E TS, R8, Remarks]`.
6. **eSim cannot make an empty report.** JomCheck Report "Result" options are only "-- Select --", "Success", "Failed" `[_reference/html/esim/jomcheck-report-edit-2026-10-05.html, lines 96-99]`. Past TS caused a failed retrieve with "to check with dev which chassis no can trigger this scenario" `[6475, E2E TS, R21]`.
7. **eSim vs real API.** "If connected to eSim, the PDF report will be a dummy" / "Results returned from API is random and cannot be pre-determined" / "API has a limit of 20 reports per day" `[12339, Test Scenarios, R3]`.
8. **Cron cannot be fired on demand.** "cronjob cannot run on demand, but can set the interval. for testing, we usually set to every 30 mins with it starting on the hour" [answered by Faizuddin on 2026-10-27, `data/pipeline/answers.json`, scope global]. SRD v0.4 REQ-005 c: "retries the request every 1 minute, up to a maximum of 5 attempts. Interval and number of attempts are pending confirmation with developer."
9. **Ops do not resubmit.** "Deprio - Ops wont resubmit" `[12412, R15, Remarks]`. SRD v0.4 REQ-005 d: after the last retry "Refund is handled manually by Ops team."
10. **Invoice vs e-Invoice after resubmit.** "EAINT-12554 [eAuto - BO] JomCheck Invoice still shows 1 line after resubmitting an old failed transaction" `[EAINT-12412 Jira capture, Sub-tasks]`. A cron resubmit may repeat this [unconfirmed].
11. **BO resubmit prompts.** "confirm "Sure to resubmit?", alert "Succesfully resubmit."" `[knowledge/flow-jomcheck.md, 12412 item 7]`.
12. **Failed gets no e-Invoice until Approved** `[knowledge/flow-jomcheck.md, 12412 item 11]`.
13. **Reused chassis returns many rows** — one listing row per past purchase `[knowledge/flow-jomcheck.md §7e]`.
14. **Cross-environment check.** "In the staging/uat3 URL, replace the Transaction ID gotten from staging/eauto URL" `[10937, E2E, R33]`.

## Past QA-Issues mentioned

1. **EAINT-6475 sub-tasks** `[EAINT-6475-jira.md, item 9]` — chassis-related:
   1. "EAINT-6992 [QA] Chinese chars is not automatically removed from Chassis Number field and can click [Submit], then retrieve with chinese chars".
   2. "EAINT-7006 [QA] Small letters, special chars and Chinese chars are not auto-capitalize/auto-trim/auto-remove when copy & paste and cut & paste using right-click mouse method".
   3. "EAINT-7026 [QA] Vehicle Number is displayed as "null" in RHB ID".
   4. "EAINT-7066 [QA] Radio button for VN should not be clickable/selectable when attempt to resubmit transaction for CN".
   5. "EAINT-10100 [eAuto - JomCheck] RHB ID under Payment Details in Transaction Details Page is displaying incorrectly".
   6. "EAINT-10110 [eAuto - JomCheck] Incorrect Chassis not found message".
   7. "EAINT-10123 [eAuto - JomCheck] Chassis No - Click 'Submit' second time when API down will clear & reset fields to default".
   8. "EAINT-10124 [eAuto - JomCheck] Mandatory field error message alignment & display issue".
2. **EAINT-8638 sub-tasks** `[EAINT-8638-jira.md, item 9]`:
   1. "EAINT-10505 [eAuto - BO] - JomCheck Report Listing - Unable to search for chassis numbers that contain special character" — **directly relevant to Known trap 1**.
   2. "EAINT-10487 ... Exact Vehicle Number and Chassis Number required for filtering result"; "EAINT-10493 ... Vehicle Number allowed special characters"; "EAINT-10509 ... To display error message when no records found".
3. **EAINT-10937 sub-tasks** `[EAINT-10937-jira.md, item 9]`:
   1. "EAINT-11753 [eAuto - Service Portal] Search & Filter - Incorrect validation for Chassis No. filter".
   2. "EAINT-11766 [eAuto - Service Portal] View Hyperlink - Dummy Report is displayed for JomCheck Report purchased using Chassis Number".
   3. "EAINT-11773 [eAuto - Service Portal] Download - Incorrect file naming for JomCheck Report purchased using Chassis No.".
4. **EAINT-12412 sub-task** — "EAINT-12554 [eAuto - BO] JomCheck Invoice still shows 1 line after resubmitting an old failed transaction" `[EAINT-12412-jira.md, item 9]`.
5. **None** in the EAINT-9203 or EAINT-12339 captures ("Sub-tasks: —").

## Estimated testing effort

1. **Comparable tickets:**

| Ticket — what it is | TS in workbook text copy | [QA] Est Man-day (cf 10081) | Source of man-day |
|---|---|---|---|
| EAINT-6475 — chassis search at purchase | **42 TS ids** (Regression 6, Functional 15 rows incl. duplicate TS11, E2E 9, SnF 12) | "2" | `EAINT-6475-jira.md` item 7 |
| EAINT-9203 — Resubmit visibility | **26** (v2 sheet 16 + PROD 10) | "—" | `EAINT-9203-jira.md` item 7 |
| EAINT-8638 — BO JomCheck Report Listing | **48 rows** (catalogue row 073: SnF 24, E2E 11, Authorized Users 13) | "—" | `EAINT-8638-jira.md` item 7 |
| EAINT-10937 — Service Portal listing + sharing | **77 TS ids** (`EAINT-10089-qa-team-ts-study.md` §1b item 6) | "4" | `EAINT-10937-jira.md` item 7 |
| EAINT-12339 — JomCheck API v2.0 | **46** | "3" | `EAINT-12339-jira.md` item 7 |
| EAINT-12412 — Invoice / e-Invoice split | **12** | "2" | `EAINT-12412-jira.md` item 7 |

   1. **Own figure:** Jira "[QA] Est Man-day (cf 10081): —" `[EAINT-12386-jira.md, item 7]`. Scout study quotes no Miro figure; no Miro link saved for this ticket.
2. **Expected TS count for EAINT-12386:** **9–12** (updated 2026-10-27). Elf proposes **7 new TS** (TS01–TS07; Matrix rows 2, 6, 7 get none), plus ~2–5 regression rows (vehicle-number path, chassis search on listings, Resubmit visibility, documents). Closer to EAINT-12412 (12 TS, "2" man-days) plus a cron part. Earlier figure 14–20 assumed one TS per Matrix row and REQ example.
3. **Estimate: 2.5 man-days** (range 2–3.5) [unconfirmed] (updated 2026-10-27 from 3 / 2.5–4):
   1. **TS drafting:** 0.25 — Elf's proposal already maps REQs to TS.
   2. **Test execution:** 1.25 — chassis TS are quick (eSim); cron TS wait on the job interval and need a dev-supplied empty report.
   3. **Retest / QA-Issue buffer:** 0.5 — 6475 raised 20+ chassis issues; listings / search by stored chassis is a likely defect area.
   4. **Automation build:** 0.5 — chassis matrix fits `scripts/eauto-jomcheck` (`UcdJomCheckPurchasePage.submitChassisNo()`); cron and payment-done note stay manual until an empty-report trigger exists.
4. **Confidence: low.** SRD is draft v0.4; cron interval / attempts "pending confirmation with developer" (REQ-005 c); no way yet to cause an empty report. Goes **up** once the developer gives the empty report code and trigger; goes **down** if stored-value changes reach the BO / Service Portal listings. Official figure lives in the QA Portal (not opened).

## Follow-up 2026-10-27 (history of this file)

1. **EAINT-10089 workbook** — 1st and 2nd tries failed: "OneDrive has not downloaded this workbook to the PC (cloud-only). Its path is 295 characters (over 260)". 3rd try converted OK. Content: "Price Change Functional" TS-001 to TS-012 and "JomCheck Invoice Price"; no chassis-strip, empty-report, Resubmit, cron or refund rows; one reused row (TS-005, R8).
2. **eSim and the empty report code** — eSim cannot produce it (Known trap 6). JomCheck Enquiry "Result" is "Yes/No" only `[knowledge/esim.md, "JomCheck Enquiry"]`.
3. **Rewrite 2026-10-27 (evening):** SRD v0.4 text copy read; Ticket brief and Estimated testing effort added; Jira captures fetched for EAINT-6475, 9203, 8638, 10937, 12339 (man-days + QA-Issue sub-tasks); EAINT-10089 and 11175 moved to the dropped list; traps 3, 4, 6, 8 updated from the SRD and Faizuddin's cron answer.
4. **Elf reply 2026-10-27:** Elf did not rebuild `scenarios.md` (changes go through Faizuddin's review in Elf's chat). Its SRD-based proposal (7 TS) is mapped at the top of "Reusable scenarios"; expected TS count lowered to 9–12 and estimate to 2.5 man-days (range 2–3.5). Elf flags: SRD gives "no final Tx Status" after 5 empty attempts [unconfirmed]; "Charged once" and "Invoice and e-Invoice 2 lines" are not in the SRD (kept here as regression only).

## Knowledge candidates

1. **EAINT-8638 defect on chassis search:** "EAINT-10505 [eAuto - BO] - JomCheck Report Listing - Unable to search for chassis numbers that contain special character" `[EAINT-8638-jira.md, item 9]` → `knowledge/flow-jomcheck.md` §5a item 2.
2. **Man-day figures:** EAINT-6475 "2", EAINT-10937 "4", EAINT-12339 "3", EAINT-12412 "2"; EAINT-9203 and EAINT-8638 "—" `[each <KEY>-jira.md, item 7]` → `knowledge/cr-test-scenario-catalogue.md`.
3. **EAINT-6475 chassis QA-Issues** (EAINT-6992, 7006, 10110, 10123, 10124) `[EAINT-6475-jira.md, item 9]` → `knowledge/flow-jomcheck.md` §5a item 1.

## Sources read

1. `_reference/tickets/Studying/EAINT-12386/EAINT-12386-study.md` (Scout study, SRD-based version).
2. `_reference/tickets/Studying/EAINT-12386/SRD_EAINT-12386_v0.4_20261026-text.md` (full).
3. `_reference/tickets/Studying/EAINT-12386/EAINT-12386-jira.md` (refreshed 27/10/2026, 8:18:01 pm).
4. Jira captures fetched 27/10/2026: `_reference/tickets/Studying/EAINT-6475/`, `EAINT-9203/`, `EAINT-8638/`, `EAINT-10937/`, `EAINT-12339/` `-jira.md`; existing `EAINT-12412-jira.md`.
5. Text copies in `_reference/sharepoint/qa-team-ts/`: EAINT-6475, EAINT-9203, EAINT-8638, EAINT-10937, EAINT-12339, EAINT-12412, EAINT-10089 (all sheets read); EAINT-7495, EAINT-9786, EAINT-10168 (keyword search only).
6. Earlier TS studies: `_reference/tickets/EAINT-10089/EAINT-10089-qa-team-ts-study.md`, `_reference/tickets/EAINT-12339/EAINT-12339-qa-team-ts-study.md`, `_reference/tickets/EAINT-12412/EAINT-12412-qa-team-ts-study.md`.
7. `data/pipeline/work/EAINT-12386/scenarios.md` (Elf, 5 TS), `data/pipeline/answers.json` (cron answer).
8. `knowledge/flow-jomcheck.md` (§5a, §7e, §7o, §9g, 12412 items 7-12), `knowledge/esim.md`, `knowledge/cr-test-scenario-catalogue.md` (### JomCheck), `_reference/html/esim/jomcheck-report-edit-2026-10-05.html`.
9. `_reference/miro-links.txt` — no EAINT-12386 line.
