# EAINT-8538 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-8538, "[eAuto - Proforma Invoice] To Allow User Upload Payment Slip and Add Remarks".
2. **Module / portal:** **BackOffice (BO) › Proforma Invoice Details page.** Menu URLs in `knowledge/flow-bo-shell.md` §3.8.
3. **Workbook:** "EAINT-8538 - [eAuto - Proforma Invoice] To Allow User Upload Payment Slip and Add Remarks.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 01/10/2025, 11:21:54 am. Catalogue entry #066 in `knowledge/cr-test-scenario-catalogue.md`.
4. **Sheets:** 2.
   1. "Functional & Scenario Testing" — 27 functional ids (8538_FT_TS1 to TS27) over 32 rows, plus "Multiple User Scenarios" (8538_MUS_TS1, 2 rows).
   2. "Role Testing" — 8 ids (8538_RoT_TS1 to TS8), 8 rows.
5. **Scenario count:** **37** distinct checks (27 FT + 2 MUS + 8 RoT). 42 result rows in total, because 5 FT ids run over two rows.
6. **Results:** **42 of 42 rows "Pass".** No Fail, no blank result, Remarks column empty on every row.
7. **Tester:** one QA engineer (column "QA" = "Charmain" on every row). **No test dates** are written in the sheet.
8. **Deployment:** production 2025-10-13, prod regression marked verified: "| EAINT-8538 | 20251013 | Proforma payment slip | Yes |" `[knowledge/production-regression-scope.md, §11.3]`.

## 2. What the ticket changed, as the TS shows it

1. **New Payment Slip section** on the Proforma Invoice Details page, below the Invoice Breakdown: [Browse Files...], uploaded file rows with [Delete], [OPEN ALL] and [Update].
2. **New Remarks textbox** below the Invoice Breakdown, shown for every invoice status (Draft, OK, Cancelled).
3. **Save is manual:** nothing is stored until [Update] → "Sure to update?" → [OK].
4. **Upload is optional:** the paid / e-Invoice flow still works with no slip.
5. **Role split:** BO users upload/delete while the invoice is OK + Unpaid; Finance users only view.

## 3. Scenarios

### 3a. Upload rules — [Browse Files...]

1. **8538_FT_TS1** (P1) — mark Paid and generate e-Invoice with no slip and blank Remarks → "Ensure the Proforma Invoice transaction able to proceed successfully without uploading Payment Slip (as it is not mandatory)".
2. **8538_FT_TS2** (P1) — upload 5 slips of 5MB at once → "Ensure system allows to upload the Payment Slip successfully".
3. **8538_FT_TS3** (P1) — slip > 5MB → "Ensure system shows "File size exceeded." validation message beside [Browse Files...]".
4. **8538_FT_TS4** (P1) — pdf / jpeg / png → upload succeeds.
5. **8538_FT_TS5** (P1) — csv / xlsx / docx / jpg → "Ensure system shows "Invalid file type." validation message beside [Browse Files...]".
6. **8538_FT_TS6** (P1) — 1 slip uploaded → "Ensure [Browse Files...] button is showing & remain enabled."
7. **8538_FT_TS7** (P1) — 5 slips at once → all upload; "[Browse Files...] button is showing but disabled."
8. **8538_FT_TS8** (P3) — try more than 5 → button disabled at the 5th; "system does NOT allow to upload more than 5 files."

### 3b. [Delete]

1. **8538_FT_TS9** (P2) — 1 slip → "Ensure [Delete] is showing on the right of {payment_slip_filename}".
2. **8538_FT_TS10** (P1, 2 rows) — 5 slips → [Delete] on each row; delete the 2nd → "Ensure 2nd Payment Slip is removed & show the remaining 4 Payment Slips correctly".

### 3c. [OPEN ALL]

1. **8538_FT_TS11** (P1) — no slip → "Ensure [OPEN ALL] button is NOT showing in Payment Slip section".
2. **8538_FT_TS12** (P1, 2 rows) — 1 slip + [Update] → [OPEN ALL] shows below the file; click → "Ensure the uploaded Payment Slip is displaying in a new tab."
3. **8538_FT_TS13** (P1, 2 rows) — 5 slips + [Update] → click → "Ensure all the uploaded Payment Slips are displaying in 5 new tabs."

### 3d. [Update] and unsaved changes

1. **8538_FT_TS14** (P1, 2 rows) — 2 slips + Remarks + [Update] → "Sure to update?" with [Cancel] & [OK]; [OK] → "Proforma Invoice updated successfully." and Remarks shown.
2. **8538_FT_TS15** (P1, 2 rows) — 3 slips + [Update] → [Cancel] → "Ensure the confirmation message is closed & user remained in the same page".
3. **8538_FT_TS16** (P1) — upload + Remarks, refresh without [Update] → slips and Remarks cleared.
4. **8538_FT_TS17** (P1) — delete a saved slip + clear saved Remarks, refresh without [Update] → "5 Payment Slips remain unchanged" and "Remarks remain unchanged".

### 3e. Remarks field

1. **8538_FT_TS18** (P1) — 2,000 characters → "System should allow to update the Remarks field."
2. **8538_FT_TS19** (P2) — 2,001 characters → "System should block user from entering the 2,001st character".
3. **8538_FT_TS20** (P2) — alphanumeric + special characters + space → allowed.
4. **8538_FT_TS21** (P2) — Chinese characters → "System should auto-remove chinese characters".

### 3f. Remarks by invoice status (TS22–TS25 are one chained flow, steps 1–8)

1. **8538_FT_TS22** (P1) — Draft → Remarks saved.
2. **8538_FT_TS23** (P1) — Generated, OK + Unpaid → Remarks updated.
3. **8538_FT_TS24** (P1) — Paid, OK + Paid → Remarks updated.
4. **8538_FT_TS25** (P1) — e-Invoice Status = OK → Remarks updated.
5. **8538_FT_TS26** (P1) — Draft then Cancelled → Remarks saved.
6. **8538_FT_TS27** (P1) — Generated then Cancelled → Remarks saved.

### 3g. Multiple users

1. **8538_MUS_TS1** (row 36) — User A then User B each upload 5 slips → "System should show the 5 Payment Slips uploaded by User B (whichever last updated)".
2. **8538_MUS_TS1** (row 37, same id reused) — User A edits Remarks, User B clears it → "System should show blank Remarks updated by User B (whichever last updated)".

### 3h. Role Testing (BO user vs Finance user)

1. **8538_RoT_TS1** — Draft → both roles: no Payment Slip; Remarks textbox shown.
2. **8538_RoT_TS2** — Cancelled before generate → both: no Payment Slip; Remarks shown.
3. **8538_RoT_TS3** — OK + Unpaid → **BO:** full controls; **Finance:** view only. Payment Slip section and Remarks shown.
4. **8538_RoT_TS4** — Cancelled after generate (Payment Status Unpaid) → both: no Payment Slip; Remarks shown.
5. **8538_RoT_TS5** — Finance [Mark as Paid], OK + Paid → **both** roles view only.
6. **8538_RoT_TS6** — [Generate e-Invoice], pending LHDN → both view only.
7. **8538_RoT_TS7** — LHDN response Failed → both view only.
8. **8538_RoT_TS8** — LHDN response Success (e-Invoice OK) → both view only.

## 4. Business rules and system behaviour

1. **Slip is optional.** "Ensure the Proforma Invoice transaction able to proceed successfully without uploading Payment Slip (as it is not mandatory)" `[sheet Functional & Scenario Testing, R3]`.
2. **Size limit 5MB per file.** "Manually upload 5 Payment Slips with 5MB at the same time" passes `[R4]`; over 5MB → "File size exceeded." `[R5]`.
3. **File types.** Accepted: "acceptable File Type = pdf / jpeg / png" `[R6]`. Rejected: "unacceptable File Type = csv / xlsx / docx/ jpg" → "Invalid file type." `[R7]`. **jpeg is accepted but jpg is rejected** — as written. [unconfirmed] whether this is a real system rule or a sheet typo.
4. **Max 5 files.** "[Browse Files...] button is showing but disabled when the 5th payment slip has been uploaded and system does NOT allow to upload more than 5 files." `[R10]`.
5. **[OPEN ALL] only after save.** Shown "below of {payment_slip_filename} uploaded" after "Click on [Update] button" `[R15, R17]`; hidden when "no payment slip uploaded" `[R14]`. Each file opens in its own tab: "displaying in 5 new tabs." `[R18]`.
6. **Save dialogs.** Confirm: "Message Content: "Sure to update?" ⏎ Button: [Cancel] & [OK]" `[R19]`. Success: "Message Content: "Proforma Invoice updated successfully." ⏎ Button: [OK] ⏎ Note: The payment slips uploaded will be stored in database" `[R20]`.
7. **Unsaved changes are lost on refresh.** "All Payment Slips uploaded will be cleared off (as they have not been saved in the database yet)" `[R23]`. Deletes and Remarks removal also do not stick without [Update] `[R24]`.
8. **Remarks limit 2,000.** 2,000 saves `[R25]`; "System should block user from entering the 2,001st character" `[R26]`.
9. **Chinese characters stripped.** "System should auto-remove chinese characters" `[R28]`.
10. **Remarks editable at every status,** incl. Draft, Paid, e-Invoice OK and Cancelled `[R29–R34]`.
11. **Last save wins** for both slips and Remarks: "(whichever last updated)" `[R36, R37]`.
12. **Payment Slip section hidden** for Draft and Cancelled: "Ensure below Invoice Breakdown does NOT show Payment Slip." `[sheet Role Testing, R4, R5, R7]`. This holds even for a cancelled invoice with Payment Status "Unpaid" `[Role Testing, R7]`.
13. **BO user at OK + Unpaid:** "if no payment slip: ⏎ - [Browse Files...] ⏎ - [Update] ⏎ ⏎ if payment slip uploaded: ⏎ - {payment_slip_file} ⏎ - [Delete] ⏎ - [OPEN ALL] ⏎ - [Browse Files...] ⏎ - [Update]" `[Role Testing, R6]`.
14. **Finance user, and BO user once Paid:** "if no payment slip: ⏎ No payment slip found. ⏎ - [Update] ⏎ ⏎ if payment slip uploaded: ⏎ - {payment_slip_file} ⏎ - [OPEN ALL] ⏎ - [Update]" `[Role Testing, R6 Finance column; R8–R11 both columns]`. So after [Mark as Paid] **nobody can add or delete slips**; [Update] stays (for Remarks) [unconfirmed reason].
15. **Who marks Paid:** "Finance user clicks [Mark as Paid]" and "Finance user clicks [Generate e-Invoice]" `[Role Testing, R8–R11]`. Ops creates, generates and cancels `[Role Testing, R4–R7]`.

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated in the sheet.
2. **BO user logins named:** "Expected Result - BO User ⏎ (jasons, rosalindkhoo, soxian, mfizni)" `[Role Testing, R2]`.
3. **Finance user login named:** "Expected Result - Finance User ⏎ (eautoaccount)" `[Role Testing, R2]`.
4. **Credentials:** none present (login IDs only, no passwords).
5. **Test files needed:** 5MB and >5MB files; pdf, jpeg, png; csv, xlsx, docx, jpg.
6. **Test text needed:** 2,000 and 2,001 characters; special characters; Chinese characters.
7. **Two BO sessions** for the multi-user rows `[R36, R37]`.
8. **LHDN states** Pending, Failed and Success were reached for the e-Invoice rows `[Role Testing, R9–R11]`. How Failed was produced is not written.
9. Prod deploy note: "Please inform BA about the updated proforma invoice, so that ops and finance are aware it's for testing purposes." `[Deployment Checklist, 20251013 R51, via knowledge/production-regression-scope.md §8.4 item 8]`.

## 6. Gaps or risks a regression should still cover

1. **jpg vs jpeg** — re-check which is really rejected; sheet rejects "jpg" and accepts "jpeg" `[R6, R7]`.
2. **Mixed batch** — one valid + one invalid file in the same pick is not tested.
3. **Upload in steps** — e.g. 3 then 2 to reach 5, then delete one and re-enable [Browse Files...], is not tested (only "at the same time").
4. **Exactly 5MB vs 5.01MB** boundary not split; TS2 uses "5MB" files only.
5. **Delete then [Update]** — the TS proves delete is lost on refresh `[R24]`, but no row saves a delete and re-opens the page.
6. **Remarks in print / export** — no row checks if Remarks or slips appear on the printed Proforma Invoice, e-Invoice PDF or listing export.
7. **Finance cannot upload** is checked by sight only; no row tries a direct upload path.
8. **Duplicate ids:** "8538_MUS_TS1" is used for two different checks `[R36, R37]`; any re-run sheet should split them.
9. **Later changes on the same page:** EAINT-11069 "Proforma [Mark as Paid]" (prod 20260506) and EAINT-12333 (new "[Generate Invoice & e-Invoice] button", not live) touch the same Details page. A regression should confirm the Payment Slip / Remarks section and role matrix still match §4 items 12–14 [unconfirmed impact].
10. **Prod data:** "Proforma Invoice (No data)" `[Deployment Checklist, 20260813 R45, via production-regression-scope.md §8.4 item 4]` — prod regression may need a test invoice raised first.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8538 - [eAuto - Proforma Invoice] To Allow User Upload Payment Slip and Add Remarks.md` — cell text only; formatting, colours and images not kept.
2. `_reference/tickets/EAINT-8538/` and `_reference/tickets/Studying/EAINT-8538/` — **do not exist**. No SRD, Jira text or Teams notes read for this ticket.
3. `knowledge/business-rules-from-test-scenarios.md` §10 item 12; `knowledge/cr-test-scenario-catalogue.md` row 066; `knowledge/production-regression-scope.md` §8.4, §11.3; `knowledge/flow-bo-shell.md` §3.8; `knowledge/flow-company-profile-einvoice.md` (Proforma lines).
4. `lib/ticketStudies.ts` — EAINT-8538 appears only in the `related` list of EAINT-12333. No study of its own.
5. **No `knowledge/flow-proforma-*.md` exists.** flow-bo-shell.md §3.8 says "no flow doc yet" for both Proforma pages.

## Notes against existing knowledge

1. `knowledge/business-rules-from-test-scenarios.md` §10 item 12 says "Finance users view only: "No payment slip found."". **Incomplete:** the TS shows **BO users are also view-only once the invoice is Paid** `[Role Testing, R8–R11]`, and the section is hidden for Draft and Cancelled `[Role Testing, R4, R5, R7]`.
2. Same item cites "max 5 files, [Browse Files...] disabled at 5 `[rows 9-10]`" and "Remarks up to 2,000 characters `[row 25]`" — matches this text copy (R9–R10, R25). No contradiction.
3. That item does not record: Chinese characters auto-removed `[R28]`, last-save-wins `[R36, R37]`, [OPEN ALL] only after save `[R15]`, or Remarks editable at every status `[R29–R34]`.

## Knowledge candidates

1. **New flow file `knowledge/flow-proforma-invoice.md`** (none exists; flow-bo-shell.md §3.8 says "no flow doc yet"). Seed: Details page Payment Slip + Remarks section, the status × role matrix in §4 items 12–15, the [Update] → "Sure to update?" → "Proforma Invoice updated successfully." save path. Source: `[from SharePoint TS #066 EAINT-8538, sheets Functional & Scenario Testing R19–R20 and Role Testing R4–R11]`.
2. **Correct business-rules item 12:** add "after [Mark as Paid], BO and Finance both view only (no [Browse Files...], no [Delete])" and "Payment Slip section hidden for Draft and Cancelled, Remarks textbox always shown". Source: `[from SharePoint TS #066 EAINT-8538, sheet Role Testing, rows 4–11]`.
3. **Remarks rules:** 2,000 max, the 2,001st character blocked; "System should auto-remove chinese characters". Source: `[from SharePoint TS #066 EAINT-8538, sheet Functional & Scenario Testing, rows 25, 26, 28]`.
4. **Concurrency rule:** slips and Remarks are last-save-wins, "(whichever last updated)". Source: `[from SharePoint TS #066 EAINT-8538, sheet Functional & Scenario Testing, rows 36–37]`.
5. **Role logins for Proforma tests:** BO user "(jasons, rosalindkhoo, soxian, mfizni)", Finance "(eautoaccount)" — environment not stated. Source: `[from SharePoint TS #066 EAINT-8538, sheet Role Testing, row 2]`. Tag `[unconfirmed]` for current validity.
6. **Regression link:** EAINT-12333 study (lib/ticketStudies.ts) should list the Payment Slip / Remarks section among Details-page regression items. Source: this study §6 item 9 `[unconfirmed]`.
