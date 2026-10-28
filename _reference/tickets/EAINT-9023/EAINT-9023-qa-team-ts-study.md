# EAINT-9023 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9023 - [eAuto] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign.md` (cell text only; formatting, colours and images not kept).
2. **Ticket folders:** `_reference/tickets/EAINT-9023/` and `_reference/tickets/Studying/EAINT-9023/` — **no files existed** before this study.
3. **lib/ticketStudies.ts:** no entry for EAINT-9023.
4. **knowledge/:** `cr-test-scenario-catalogue.md` rows 62 and 440; `business-rules-from-test-scenarios.md` §6.1; `eauto-insurance.md` "Quote sequence (control sequence)"; `flow-zurich-takaful.md` §2 and §4a.
5. **Not read:** Jira ticket, SRD, Teams. Run was unattended; no SRD file is in the repo for this ticket.

## 1. Header

1. **Ticket:** EAINT-9023 — "[eAuto] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign" (Sheet1 R2).
2. **Module / portal:** eAuto **UCD → Insurance quotation (Step 1–3)**, reached from eSTM and from Insurance > Get a Free Quote.
3. **Workbook:** "EAINT-9023 - [eAuto] To change Insurance Control Sequence for Lonpac Quarter 4 Campaign.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 17/10/2025, 9:41:21 am.
4. **Sheets:** 1 — "Sheet1".
5. **Scenarios:** **8** (9023_EAUTO_TS1 – TS8). P1: 7, P2: 1.
6. **Results:** **PASS 7**, **Not Started 1** (TS2). No Fail.
7. **Tester:** QA column reads "Teck Yung" on TS1, TS3–TS8; TS2 blank. No test dates in the sheet.
8. **Environment:** "Test environment: staging/eauto" (Sheet1 R4).
9. **Jira link:** "https://mfservices.atlassian.net/issues/?filter=12425&selectedIssue=EAINT-9023" (Sheet1 R1).
10. **Sister ticket:** EAINT-9024 is the Secarang version ("Lonpac Q4 control sequence (Secarang)", `knowledge/cr-test-scenario-catalogue.md` row 331).

## 2. What the ticket changed, as the TS shows it

1. **Insurer order** on the Insurance Quotation page changed for the **Lonpac Q4 2025 campaign**. Test objective cell (R5) is **empty**; the order itself is not written anywhere in the sheet.
2. From the expected results, the order tested is **Chubb → Lonpac → Tokio Marine** [unconfirmed — inferred]:
   1. TS3/TS4: all three quote → top 2 = "1. Chubb✅ ⏎ 2. Lonpac✅" (R10, R11).
   2. TS1: Chubb missing → "1. Lonpac✅ ⏎ 2. Tokio Marine✅" (R8).
   3. TS6: Lonpac missing → "1. Chubb✅ ⏎ 2. Tokio Marine✅" (R13).
3. **Top 2 only** after eSTM; **all insurers** on Get a Free Quote without approved eSTM (TS7, TS8).
4. **MessageBird** must be disabled before buying: "Select any insurance quotation, ensure messagebird is disabled" (R8 step 12, repeated in R9–R13).

## 3. Scenarios

### A. Entry: eSTM Step 5 payment successful

1. **TS1 (P1, PASS)** — eSTM (MyKad), Sub UCD; data Chubb❌ Lonpac✅ Tokio Marine✅. Expected: "Display ONLY top 2 insurance: ⏎ 1. Lonpac✅ ⏎ 2. Tokio Marine✅" (R8).
2. **TS2 (P2, Not Started)** — eSTM (Company), Main UCD; Chubb✅ Lonpac✅ Tokio Marine❌. Expected: "Display ONLY top 2 insurance: ⏎ (company will only have Chubb quotation) ⏎ 1. Chubb ✅" (R9).

### B. Entry: eSTM Step 4→5 JPJ enquiry failed with VEL000069E

1. **TS3 (P1, PASS)** — eSTM (MyPR), Sub UCD; all three quote; failure inline at Step 4→5. Expected: "Display ONLY top 2 insurance: ⏎ 1. Chubb✅ ⏎ 2. Lonpac✅" (R10). Remark: "The insurance displayed only Lonpac." (R10).
2. **TS4 (P1, PASS)** — eSTM (MyKad), Main UCD; Chubb✅ Lonpac✅ Tokio Marine❌; "Quit Step Page, resubmit from eSTM Transaction Listing Page" then 69E. Expected: top 2 Chubb, Lonpac (R11).

### C. Entry: Insurance banner on approved eSTM details page

1. **TS5 (P1, PASS)** — eSTM (Company), Sub UCD; click "[Get Free Quote for {vn}]". Expected: "Display ALL insurance: ⏎ (company will only have Chubb quotation) ⏎ 1. Chubb✅" (R12).
2. **TS6 (P1, PASS)** — eSTM (MyPR), Main UCD; Chubb✅ Lonpac❌ Tokio Marine✅. Expected: "Display ONLY top 2 insurance: ⏎ 1. Chubb✅ ⏎ 2. Tokio Marine✅" (R13).

### D. Entry: Insurance > Get a Free Quote, no approved eSTM

1. **TS7 (P1, PASS)** — Individual (VN + IC), Sub UCD. Expected: "Display ALL insurance: ⏎ 1. Chubb✅ ⏎ 2. Lonpac✅ ⏎ 3. Tokio Marine✅" (R14).
2. **TS8 (P1, PASS)** — Company (VN + ROC), Sub UCD. Expected: "Display ALL insurance: ⏎ (company will only have Chubb quotation) ⏎ 1. Chubb✅" (R15).

### Common steps in every scenario

1. Verify order and visibility on Step 1 → change **Postcode / Sum Insured / Variant-Transmission** → [Apply changes] → verify again.
2. Go to **Step 2, BACK** to Step 1 → verify; go to **Step 3, BACK** to Step 1 → verify.
3. TS1–TS6 then buy insurance to completion; TS3/TS4 also complete eSTM to "Step 6, Tx Status = Approved". TS7/TS8 stop at Step 2 → Step 1 check (no purchase).

## 4. Business rules and system behaviour

1. **Top 2 after eSTM:** "Display ONLY top 2 insurance" — Sheet1 R8, R9, R10, R11, R13.
2. **Missing quote is skipped, next insurer fills the slot:** R8 (Chubb❌ → "1. Lonpac✅ ⏎ 2. Tokio Marine✅") and R13 (Lonpac❌ → "1. Chubb✅ ⏎ 2. Tokio Marine✅").
3. **Company gets Chubb only:** "company will only have Chubb quotation" — Sheet1 R9, R12, R15.
4. **Get a Free Quote without approved eSTM shows all:** "Display ALL insurance: ⏎ 1. Chubb✅ ⏎ 2. Lonpac✅ ⏎ 3. Tokio Marine✅" — Sheet1 R14.
5. **Order must survive changes and Back:** "Verify the priority order and visibility of insurance providers" after Apply changes, Step 2 BACK and Step 3 BACK — Sheet1 R8–R15.
6. **69E routes to insurance:** "Step 4 to 5 JPJ Enquiry = Failed (due to VEL000069E) ⏎ 4. Redirect to Insurance Quotation Page Step 1" — Sheet1 R10; same after resubmit from listing, R11.
7. **eSTM still completes after the insurance detour:** "Complete eSTM Transacation until Step 6, Tx Status = Approved" — Sheet1 R10, R11.
8. **Banner button label:** "Click [Get Free Quote for {vn}]" — Sheet1 R12, R13.
9. **Free Quote form:** "Category = Individual, input valid vn & ic, click [Show My Result]" (R14); "Category = Company, input valid vn & roc" (R15).
10. **MessageBird off when buying:** "ensure messagebird is disabled" — Sheet1 R8–R13.

## 5. Test data, environments, accounts

1. **Environment:** staging/eauto (R4).
2. **UCD accounts:** "Sub UCD" and "Main UCD" named per scenario; no logins in the sheet. **No credentials present.**
3. **Customer types:** MyKad, MyPR, Company — eSTM; Individual and Company — Free Quote.
4. **Test data (R8 only):** "VJD5372" plus an IC number (present in sheet, not copied here).
5. **Remarks vehicle list (R8):** "eAuto ⏎ 1. WB9573N - all ⏎ 2. WB2328G - rhb, tkf, chubb, lnp ⏎ 3. WB8848X - all" and "Secarang ⏎ 1. CEA9239 [IC] ⏎ 2. MCP9228 680585-K" — vehicle numbers with the insurers that quote for them. Status of these vehicles today is unknown [unconfirmed].
6. **Insurer-availability matrix** per scenario is a pre-requisite (✅/❌ per insurer); TS rows 9–15 have empty "Test Data:" cells — the VN used is not recorded.

## 6. Gaps and risks for regression

1. **TS2 never run** — Company after successful eSTM payment (Main UCD). Not Started.
2. **TS3 PASS conflicts with its remark.** Expected "1. Chubb✅ ⏎ 2. Lonpac✅" but remark says "The insurance displayed only Lonpac." (R10). Likely Chubb did not quote for that vehicle [unconfirmed]; the result should have been backed by data.
3. **TS5 expects "Display ALL"** on the approved-eSTM banner (R12), while TS6 on the same entry expects "ONLY top 2" (R13). For Company both give the same single Chubb card, so TS5 did not test the top-2 cut [unconfirmed].
4. **No negative check that the 3rd insurer is hidden** with all three quoting, except TS3/TS4 — and TS3's remark shows that case was not seen.
5. **Test data not recorded** for TS2–TS8; cannot re-run with the same vehicles.
6. **No Takaful / RHB / Zurich** in scope; remarks show WB2328G quotes "rhb, tkf", so the sequence position of those insurers is untested here.
7. **Order is campaign-specific** (Q4 2025). Superseded by later CRs (EAINT-9214 Takaful, EAINT-9713, EAINT-11977/12020, EAINT-8606). Do not reuse this order as a current expectation.

## 7. Contradictions with knowledge/

1. **69E entry shows top 2, not all.** `knowledge/flow-zurich-takaful.md` §4a #2: "system lands on Insurance Step 1 showing **all** insurers". This TS expects "Display ONLY top 2 insurance" for 69E (Sheet1 R10, R11). Rule may differ per CR/date [unconfirmed].
2. **Free Quote without eSTM = all** (Sheet1 R14) is **superseded** by EAINT-9713 "To Update Free Quote (Without eSTM) to Show Top 2 Insurers" (`knowledge/cr-test-scenario-catalogue.md` row 64). `knowledge/business-rules-from-test-scenarios.md` §6.1 #5 still states "Get Free Quote without an approved eSTM shows all insurers" without noting it was superseded.
3. **Catalogue summary is misleading.** `cr-test-scenario-catalogue.md` row 62 says "Top 2 after eSTM payment: Lonpac, Tokio Marine". That is only because Chubb had no quote in TS1's data (R8 pre-requisite "Chubb❌"). The full-quote top 2 is Chubb, Lonpac (R10, R11).
4. **Approved-eSTM banner:** `flow-zurich-takaful.md` §4a #3 says "only the top two"; TS5 (R12) says "Display ALL" for Company. Agrees in effect (Company has one quote) [unconfirmed].

## Knowledge candidates

1. **Missing quote → next insurer moves up into the top 2.** Source: Sheet1 R8 ("Chubb❌" → "1. Lonpac✅ ⏎ 2. Tokio Marine✅") and R13 ("Lonpac❌" → "1. Chubb✅ ⏎ 2. Tokio Marine✅"), EAINT-9023 TS, 17/10/2025. Target: `knowledge/eauto-insurance.md` "Quote sequence".
2. **Correct catalogue row 62:** Q4 2025 order with all quoting = Chubb → Lonpac → Tokio Marine [unconfirmed — inferred from Sheet1 R10, R11, R14]. Target: `knowledge/cr-test-scenario-catalogue.md`.
3. **Mark §6.1 #5 as superseded** by EAINT-9713 (Free Quote without eSTM now top 2). Source: Sheet1 R14 vs catalogue row 64. Target: `knowledge/business-rules-from-test-scenarios.md` and `eauto-insurance.md`.
4. **69E entry point top-2 vs all conflict** — record both: EAINT-9023 Sheet1 R10/R11 "Display ONLY top 2 insurance" vs `flow-zurich-takaful.md` §4a #2 "all insurers". Needs confirmation on staging. Target: `knowledge/flow-zurich-takaful.md` or a control-sequence flow file.
5. **eSTM resumes after insurance detour:** after 69E → insurance purchase, eSTM still completes "until Step 6, Tx Status = Approved". Source: Sheet1 R10, R11. Target: `knowledge/flow-estm.md`.
6. **Disable MessageBird before buying insurance on staging:** "Select any insurance quotation, ensure messagebird is disabled". Source: Sheet1 R8–R13. Target: `knowledge/environments-history.md` (MessageBird section).
7. **Sequence-check pattern** used by the team: verify after Apply changes, after Step 2 BACK, after Step 3 BACK, across Sub/Main UCD and MyKad/MyPR/Company. Source: Sheet1 R8–R15. Target: `knowledge/automation-playbook.md` (reuse for future control-sequence CRs).
