# EAINT-8536 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-8536 — Jira summary "⚪[eAuto & Secarang][Insurance] To WhatsApp-notify 018-2884889 for successfully paid but failed cover note submissions trx" `[Jira capture, Summary]`.
2. **Status:** "Done"; **fix version** "S22.9-20251029 (2025-10-29)"; deploy comment "This ticket has been deployed on 29 October 2025 (Wednesday)." `[Jira capture, Comments, 2025-11-06]`.
3. **Parent / sub-task:** parent "EAINT-7566 [INS] Whatsapp Notification"; sub-task "EAINT-9054 [Secarang] Not receiving Failed Cover Note Submission whatsapp message" `[Jira capture, items 9-10]`.
4. **Module / portal:** **Insurance** purchase on **Secarang** (Homepage) and **eAuto** (via eSTM → Insurance); output is a **WhatsApp** message via **MessageBird**.
5. **Workbook:** "EAINT-8536 - [eAuto & Secarang] [Insurance] To enable WhatsApp notifications to 018-2884889 for failed cover note submissions.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 27/10/2025, 9:59:33 am.
6. **Sheets:** one — "EAINT-8536".
7. **Scenarios:** **7** (WA_FAILCN_TS1 – TS7).
8. **Results:** **6 PASS, 1 N/A, 0 Fail** `[sheet EAINT-8536, R9-R15, Test Result column]`.
9. **Tester:** "Nick" in the QA column for TS1-TS6; TS7 QA cell is blank `[R9-R15]`. Jira QA field = the same tester `[Jira capture, item 3]`. No dates written in the sheet.
10. **Test environment:** "Test environment: staging/preprod2" `[R4]`.

### Sources read

1. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-8536 - [eAuto & Secarang] [Insurance] ... .md` (cell text only; formatting and colours not kept).
2. Jira capture: `_reference/tickets/Studying/EAINT-8536/EAINT-8536-jira.md`.
3. knowledge/: `esim.md`, `business-rules-from-test-scenarios.md`, `cr-test-scenario-catalogue.md`, `flow-platform.md`, `flow-insurance-purchase.md`, `flow-zurich-takaful.md`, `teams-decisions-by-ticket.md`, `qa-team-process.md`, `environments-history.md`.
4. **Not read:** the SRDs (V0.1 – V1.2, .docx/.pdf) are Jira attachments only; no copy exists in the repo. The attachment "image-20251023-083710.png" was not read.
5. `lib/ticketStudies.ts`: no EAINT-8536 entry.

## 2. What the ticket changed (as the TS shows it)

1. **New WhatsApp alert** to the support number when payment succeeds but **cover note submission fails**: "Verify WhatsApp is sent to 018-2884889 when cover note submission fails after successful payment." `[R6]`.
2. Covers **both** platforms: Secarang (Private) and eAuto (Individual, Company) `[R9-R11]`.
3. Existing **JPJ Signal Rejected** alert and **success** messages are only regression `[R12-R15, Remarks "REGRESSION"]`.

## 3. Scenarios

### A. New — cover note submission failed (P1)

1. **WA_FAILCN_TS1** — Secarang Homepage, Private Car, **Tokio Marine**, prefix **VB**, "Cover Note Submissions = FAILED" → WhatsApp to 018-2884889 with the failed-cover-note template. **PASS.** Remark "https://mfservices.atlassian.net/browse/EAINT-9054 ⏎ ⏎ Retested ok" `[R9]`.
2. **WA_FAILCN_TS2** — eAuto via eSTM, Individual, **Lonpac**, prefix **VB** → same template. **PASS.** `[R10]`.
3. **WA_FAILCN_TS3** — eAuto via eSTM, Company, **Chubb**, prefix **VB** → same template. **PASS.** `[R11]`.

### B. Regression — JPJ Enquiry rejected (P2)

4. **WA_FAILCN_TS4** — labelled "Regression - Secarang (Homepage)", prefix **VF**, "JPJ Enquiry = REJECTED" → "Lonpac Insurance JPJ Signal Rejected:" template. **PASS.** `[R12]`.
5. **WA_FAILCN_TS5** — eAuto, Company VN, **Chubb**, prefix **VF** → "Created from eAuto. ⏎ Chubb Insurance JPJ Signal Rejected:" template. **PASS.** `[R13]`.

### C. Regression — happy flow success message (P2)

6. **WA_FAILCN_TS6** — Secarang, Private, **Lonpac**, "Transaction Status = Insurance Created" → WhatsApp "to BUYER" "{insurer_name} Insurance Successfully Created on eAuto". **PASS.** `[R14]`.
7. **WA_FAILCN_TS7** — eAuto, Company, **Chubb**, Insurance Created → same buyer message. **N/A**, remark "eAuto Successful Insurance Created whatsapp message is disabled" `[R15]`.

## 4. Business rules and system behaviour

1. **Failed cover note template** (verbatim) `[sheet EAINT-8536, R9, Expected Result]`:
   "Hi, ⏎ {insurer_name} Insurance Transaction Failed at Cover Note Submission & Payment Paid ⏎ ⏎ Error: Transaction success ⏎ Vehicle No.: {vn} ⏎ Sum Insured: RM {x,xxx.xx} ⏎ Premium Amount: RM {x,xxx.xx} ⏎ Time: {dd-mm-yyyy hh:mm am/pm} ⏎ Please take note & attend."
2. **Same template** for Secarang and eAuto in the new scenarios — R10 and R11 match R9 word for word; **no** "Created from eAuto." prefix there `[R9-R11]`.
3. **No "Cover Note No." line** in the failed template. Matches SRD V1.1: "To remove ‘Cover Note No.’ line in WhatsApp message template" `[Jira capture, Description row 3]`.
4. **Template opens and closes with fixed text** ("Hi," / "Please take note & attend."). Matches SRD V1.2: "To update the WhatsApp template based on Meta’s new policy – template cannot start and end with parameter" `[Jira capture, Description row 4]`.
5. **eSIM prefixes:** "input valid vehicle details with prefix VB" → cover note FAILED `[R9-R11]`; "prefix VF" → "JPJ Enquiry = REJECTED" `[R12-R13]`.
6. **Prefix is dev-made:** "Dev will hardcode specific vehno prefix to allow sending of required whatsapp message" `[R10 and R11, Remarks]`.
7. **MessageBird must be on:** "Note: ensure messagebird is enabled" `[R9-R15, Pre-Requisite]`.
8. **JPJ Signal Rejected — Secarang template** `[R12]`: "Lonpac Insurance JPJ Signal Rejected: ⏎ ⏎ Error: SUCCESS ⏎ Cover Note No.: {ecert_no} ⏎ Vehicle No.: {vn} ⏎ Sum Insured: RM {x,xxx.xx} ⏎ Premium Amount: RM {x,xxx.xx} ⏎ Time: {dd-mm-yyyy hh:mm am/pm}".
9. **JPJ Signal Rejected — eAuto template** adds a header and footer `[R13]`: "Created from eAuto. ⏎ Chubb Insurance JPJ Signal Rejected: ... Time: {dd-mm-yyyy hh:mm am/pm} ⏎ Thank you."
10. **Success message to buyer** (Secarang) `[R14]`: "{insurer_name} Insurance Successfully Created on eAuto ⏎ ⏎ Vehicle No.: {vn} ⏎ Vehicle Brand & Model, Year: ⏎ Customer name: {buyer_name} ⏎ Sum Insured: RM {x,xxx.xx} ⏎ Premium Amount: RM {x,xxx.xx} ⏎ Created by: {buyer_name} ⏎ Created time & date: {dd-mm-yyyy hh:mm am/pm} ⏎ Payment by: {buyer_name} ⏎ Payment time & date: {dd-mm-yyyy hh:mm am/pm}".
11. **eAuto success WhatsApp is off:** "eAuto Successful Insurance Created whatsapp message is disabled" `[R15, Remarks]` (as of the 2025 test).
12. **Secarang alert had a bug first:** sub-task "EAINT-9054 [Secarang] Not receiving Failed Cover Note Submission whatsapp message" `[Jira capture, item 9]`, retested ok `[R9, Remarks]`.

## 5. Test data, environments, accounts, setup

1. **Environments:** staging / preprod2 `[R4]`.
2. **Insurers:** Tokio Marine (Secarang Private), Lonpac (eAuto Individual, Secarang Private), Chubb (eAuto Company) `[R9-R15, Pre-Requisite]`.
3. **Vehicle prefixes:** VB (cover note fail), VF (JPJ reject); plain valid VN for happy flow `[R9-R15]`.
4. **eAuto entry:** "Create eSTM Transaction ... Proceed until Approved and create Insurance transaction" `[R10]`.
5. **Recipient phone:** 018-2884889 (support number, not a tester phone).
6. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **Sheet inconsistencies** (copy with care):
   1. TS4 is titled "Regression - Secarang (Homepage)" but its steps say "Create eAuto Insurance Transaction (Private) ⏎ 1. Create eSTM Transaction" `[R12]`.
   2. TS4 Pre-Requisite says "Lonpac" but step 4 says "Select Tokio Marine insurance"; expected says "Lonpac Insurance JPJ Signal Rejected" `[R12]`.
   3. TS5 and TS7 are "Company VN" but step 2 says "Category = Individual" `[R13, R15]`.
2. **"Error: Transaction success"** inside a failure alert `[R9]` looks odd; whether the Error line carries the insurer's raw response is not stated [unconfirmed].
3. **Not covered:** Secarang Company / Motorcycle; other insurers (RHB, Takaful, Zurich etc.); exactly-one-message check; no alert when cover note succeeds; no alert when payment fails.
4. **Recipient may have changed since.** EAINT-12342 (2026-09) reworked alert recipients: "SRD v1.2 removes eAuto Support and adds Wani's number" `[teams-decisions-by-ticket.md, EAINT-12342, 2026-09-29 10:22]` and "Cover note sending was changed to support several recipients" `[same, 2026-09-29 16:54]`. Whether 018-2884889 still receives this alert is [unconfirmed] — check SRD EAINT-9117 / 12342 before asserting it.
5. **eAuto success message** status (still disabled in 2026?) [unconfirmed]; EAINT-12342 note says "success messages still go to the customer" `[teams-decisions-by-ticket.md, EAINT-12342, 2026-09-28 12:36]`.
6. **Prefixes VB / VF are history:** "Past prefixes (8536 "VB" / "VF", board "ZA" / "ZB") are history only" `[flow-zurich-takaful.md, item 6]`. Ask dev for the current prefix before reuse.
7. **Shared MessageBird switch:** turning it on affects others — "remember to inform in QA group and Main Group before you connect to messagebird ya" `[environments-history.md, line 194-195]`.

## 7. Comparison with knowledge/

1. `esim.md` § Codes and prefixes item 1 and `business-rules-from-test-scenarios.md` item 3 already hold the VB/VF prefixes and the template — **consistent** with this study.
2. `business-rules-from-test-scenarios.md` item 3 says "eAuto transactions are prefixed "Created from eAuto."" citing row 13. **Correction needed:** R13 is the **JPJ Signal Rejected** regression template; the new failed-cover-note template for eAuto (R10, R11) has **no** such prefix.
3. `flow-platform.md` line 283 lists EAINT-8536 with no detail; `flow-insurance-purchase.md` has no failed-cover-note WhatsApp entry.
4. No `knowledge/` file records the **dev-hardcoded prefix** remark or the **eAuto success WhatsApp disabled** remark.

## Knowledge candidates

1. **Fix in `business-rules-from-test-scenarios.md` item 3:** the "Created from eAuto." header belongs to the eAuto **JPJ Signal Rejected** alert, not the failed-cover-note alert. Source: `[SharePoint TS EAINT-8536, sheet EAINT-8536, R10, R11, R13]`.
2. **`flow-insurance-purchase.md` — alerts section:** failed cover note after paid → WhatsApp "{insurer_name} Insurance Transaction Failed at Cover Note Submission & Payment Paid" to 018-2884889, same text on Secarang and eAuto; deployed 2025-10-29. Source: `[SharePoint TS EAINT-8536, R9-R11]`, `[Jira EAINT-8536 comment 2025-11-06]`. Add note that EAINT-12342 later changed recipients [unconfirmed effect].
3. **WhatsApp templates must start and end with fixed text** (Meta policy). Source: `[Jira EAINT-8536 Description, SRD V1.2 row, 27.08.2025]`. Fits `flow-platform.md` WhatsApp rules.
4. **eAuto "Insurance Successfully Created" WhatsApp disabled** (as of Oct 2025). Source: `[SharePoint TS EAINT-8536, R15 Remarks]`. Re-verify against EAINT-12342 [unconfirmed].
5. **eSIM failure prefixes for insurance are dev-hardcoded per ticket.** Source: "Dev will hardcode specific vehno prefix to allow sending of required whatsapp message" `[SharePoint TS EAINT-8536, R10 Remarks]`. Fits `esim.md` § Codes and prefixes.
6. **JPJ Signal Rejected WhatsApp text** — Secarang vs eAuto versions (eAuto adds "Created from eAuto." and "Thank you."). Source: `[SharePoint TS EAINT-8536, R12, R13]`.
