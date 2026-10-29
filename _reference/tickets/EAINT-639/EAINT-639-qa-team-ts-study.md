# EAINT-639 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; no other file changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-639 -🟣[eAuto] To R&D - Cron job for JPJ Monthly Report.md` (text copy dated "27/10/2026, 8:42:51 pm"; "Cell text only, row by row; formatting and images are not kept").
2. **Ticket folders:** `_reference/tickets/EAINT-639/` and `_reference/tickets/Studying/EAINT-639/` — **none existed** before this study. No SRD, no Jira export, no ticket notes in the repo.
3. **lib/ticketStudies.ts:** no EAINT-639 entry.
4. **knowledge/ (grep EAINT-639):** `business-rules-from-test-scenarios.md:758-760`, `cr-test-scenario-catalogue.md:250, 388`, `cr-ledger.md:1157-1164`, `flow-payments-fees.md:284-285`, `production-regression-scope.md:941`, `script-inventory-team.md:52, 265`. Also `flow-bo-shell.md:128` for the BO report route.
5. **Not read:** the SRD (v0.3 is named in `cr-ledger.md:1162-1163`, but no copy is in the repo). The Jira ticket itself was not opened (no connector use in this unattended run).

## 1. Header

1. **Ticket:** EAINT-639 — R1 title "EAINT- 639 - 🟣[eAuto] To R&D - Cron job for JPJ Monthly Report".
2. **Module / portal:** **BackOffice (BO)** reports + **email** delivery of a generated **JPJ Monthly Report**. Modules covered in the report: **STMS, APT, eSTM** (Sheet1 R4-R6).
3. **Workbook:** "EAINT-639 -🟣[eAuto] To R&D - Cron job for JPJ Monthly Report.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 29/06/2026, 2:31:28 pm.
4. **Sheets:** 1 — **Sheet1**.
5. **Scenarios:** **10** (639_TS1 to 639_TS10, rows R3-R12).
6. **Results:** **10 Pass, 0 Fail** (column "Test Result", R3-R12).
7. **Tester:** QA column = "Maisarah" on every row (a QA engineer on the team).
8. **Dates:** none written in the sheet. Deployment record: "| EAINT-639 | 20260630 | JPJ monthly report cron | Dev |" `[knowledge/production-regression-scope.md:941]` — deployed **30 Jun 2026**, prod verification = **Dev** ("Dev = dev checks", `production-regression-scope.md:831`).

## 2. What the ticket changed, as the TS shows it

1. A **cron job** generates the **JPJ Monthly Report** automatically: "Cron runs automatically on the 1st at 3:00 AM and starts generation." (Sheet1 R3, Expected Result).
2. The report carries two figures per module, **"Transaksi"** and **"Hasil JPJ (RM)"**, which must match BO's **Transaction Summary Report** fields "Approved Transaction" and "JPJ Fees (RM)" (Sheet1 R4-R6).
3. The report has **totals** for both columns (Sheet1 R7-R8).
4. The report is **emailed as a link**, not an attachment: "Email is sent to the recipient and link for JPJ Monthly Report is included in the email" (Sheet1 R9).
5. The link is **permission-gated** and **expires** (Sheet1 R11-R12).

## 3. Scenarios

### A. Schedule

1. **639_TS1** — cron triggers on schedule. Step: "1. Set system date to 1st of month, 03:00 AM." Expected: "Cron runs automatically on the 1st at 3:00 AM and starts generation." Pass. Remark: "manual trigger" (R3).

### B. Figures match BO (per module)

1. **639_TS2** — "To verify STMS "Transaksi" and "Hasil JPJ (RM)" is correct". Expected: "Approved Transaction = TRANSAKSI ⏎ JPJ Fees (RM) = Hasil JPJ (RM) ⏎ Both fields are same as BO". Pass (R4).
2. **639_TS3** — same check for **APT**. Same expected. Pass (R5).
3. **639_TS4** — same check for **eSTM**. Same expected. Pass (R6).

### C. Totals

1. **639_TS5** — "The total amount in"Transaksi" is calculated correctly". Expected: "The total value should be same after total up". Pass (R7).
2. **639_TS6** — "The total amount in"Hasil JPJ (RM)" is calculated correctly". Same expected. Pass (R8).

### D. Email and link access

1. **639_TS7** — "To verify email is sent to the recipient". Expected: "Email is sent to the recipient and link for JPJ Monthly Report is ⏎ included in the email". Pass (R9).
2. **639_TS8** — "To verify recipient can access the link". Expected: "Recipient should can access the link". Pass (R10).
3. **639_TS9** — "To verify who doesn't have permission can't access the link". Expected: "The link should not be accessible". Pass (R11).
4. **639_TS10** — "To verify JPJ Monthly Report can't access after expiry date". Expected: "The link should not be accessible". Pass. Remark: "expiry set to 10 minutes" (R12).

## 4. Business rules and system behaviour

1. **Schedule:** "Cron runs automatically on the 1st at 3:00 AM and starts generation." (Sheet1 R3). The test itself was a **"manual trigger"** (Sheet1 R3, Remark) — the real 1st-of-month 3:00 AM run was not observed in testing.
2. **Field mapping to BO:** "Approved Transaction = TRANSAKSI" and "JPJ Fees (RM) = Hasil JPJ (RM)" (Sheet1 R4-R6, Test Steps step 4). BO source page: "Go to Transaction Summary Report" then "Filter by module and date" (Sheet1 R4, steps 2-3).
3. **Only approved transactions count** in "Transaksi" — inferred from the mapping to "Approved Transaction" [unconfirmed].
4. **Modules in scope:** STMS (R4), APT (R5), eSTM (R6). No other modules (e.g. eLKM, eDereg, JomCheck) appear in the TS [unconfirmed whether the report includes them].
5. **Delivery:** link in email, "link for JPJ Monthly Report is ⏎ included in the email" (Sheet1 R9).
6. **Access control:** "Open link using account who doesn't have permission" → "The link should not be accessible" (Sheet1 R11). The link needs a **logged-in account with permission** [unconfirmed which permission or portal].
7. **Expiry:** "Open link after expiry date" → "The link should not be accessible" (Sheet1 R12). Testing used a shortened expiry: "expiry set to 10 minutes" (Sheet1 R12, Remark). The **production expiry period** is not stated [unconfirmed].
8. **BO route:** Transaction Summary Report = `/<env>/view/report/tx-summary-report`, "no flow doc yet" `[knowledge/flow-bo-shell.md:128]`.

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated in the sheet [unconfirmed; likely staging].
2. **Setup:** system date / cron set to "1st of month, 03:00 AM" (R3), run by **manual trigger** (R3 Remark). Expiry shortened to **10 minutes** for TS10 (R12 Remark) — needs dev/config access.
3. **Accounts:** a BO login (R4-R6), an email **recipient** (R9-R10), and an account **without permission** (R11). No account names written.
4. **Credentials:** **none present** in the sheet.
5. **Recipient list:** not named in the sheet [unconfirmed who receives the email].
6. **Team tooling:** a Python verifier by another QA engineer, `by-ticket/eaint-639-jpj-monthly-report`, "checks a dev-generated xlsx monthly report against SRD v0.3" `[knowledge/cr-ledger.md:1157-1163]`. So the report file is an **xlsx** [per that source; not stated in this TS].

## 6. Gaps or risks a regression should still cover

1. **Real schedule not observed:** TS1 used a manual trigger; the actual 1st-of-month 3:00 AM run was not proven in the sheet. Prod verification was "Dev" only (`production-regression-scope.md:941`).
2. **Report period:** no TS checks **which month** the report covers (previous calendar month expected [unconfirmed]) or month-boundary transactions (e.g. approved 23:59 on last day).
3. **Date basis:** no TS states whether BO filter uses **approved date** or **transaction date** — a mismatch risk against the report.
4. **Zero / empty month:** no TS for a module with no approved transactions (0 vs blank vs missing row).
5. **Other modules:** only STMS, APT, eSTM tested; no check that other JPJ modules (eLKM, eDereg, etc.) are correctly excluded or included.
6. **Report layout:** no TS for headers, period label, file name, or format of the generated file.
7. **Production expiry:** only a 10-minute test expiry was tested; the real expiry value is not checked.
8. **Failure handling:** no TS for cron failure, re-run, or duplicate email if the job runs twice.
9. **Recipient list:** no TS checks the email goes **only** to the intended recipients, nor the email subject/body wording.
10. **TS5/TS6 wording:** "Total up all the "Transaksi" value" — no row says the totals were also matched to BO's own total.

## Knowledge candidates

1. **JPJ Monthly Report — cron and delivery** (for a future `knowledge/flow-jpj-monthly-report.md` or `flow-bo-shell.md` reports section): "Cron runs automatically on the 1st at 3:00 AM and starts generation." `[from SharePoint TS EAINT-639, Sheet1, R3]`; delivered as a link in email `[Sheet1 R9]`; link is permission-gated `[Sheet1 R11]` and expires `[Sheet1 R12]`. Already summarised in `business-rules-from-test-scenarios.md:758-760`; a flow file would add the steps below.
2. **Report-to-BO mapping:** "Approved Transaction = TRANSAKSI" and "JPJ Fees (RM) = Hasil JPJ (RM)", checked on BO "Transaction Summary Report", "Filter by module and date", for STMS, APT and eSTM `[from SharePoint TS EAINT-639, Sheet1, R4-R6]`. Fills part of the "no flow doc yet" gap at `flow-bo-shell.md:128`.
3. **Testing trap:** the cron was tested by **"manual trigger"** `[Sheet1 R3 Remark]` and link expiry was shortened to **"expiry set to 10 minutes"** `[Sheet1 R12 Remark]` — both need dev help to reproduce. Consistent with the standing rule that eAuto cron cannot be triggered on demand by QA (memory: eAuto cron interval rule) [unconfirmed whether the 639 cron is one of those].
4. **Prod verification gap:** deployed 20260630 with Verified = "Dev" `[knowledge/production-regression-scope.md:941]` — QA has not confirmed a real scheduled run in prod.
