# EAINT-8826 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-8826 — "[eAuto-BackOffice] To grant Reset Payment Permission for eSTM & STMS".
2. **Portal:** **Back Office** (BO), with a **UCD** check after the reset. **Modules:** STMS and eSTM.
3. **Workbook:** "EAINT-8826 - [eAuto-BackOffice] To grant Reset Payment Permission for eSTM & STMS.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 22/09/2025, 3:58:50 pm.
4. **Sheets:** one sheet, "EAINT-8826".
5. **Columns:** "TS No. | Test Objective | BO Account | Test Scenarios | Expected Result | QA | Test Result" (sheet EAINT-8826, R1).
6. **Scenarios:** **10** (8826_TS1 to 8826_TS10). STMS = TS1–TS5; eSTM = TS6–TS10.
7. **Results:** **10 PASS**, 0 FAIL (column "Test Result", R3–R13).
8. **Tester:** QA column reads "Nabila" on every row. **Dates:** none written in the sheet; only the SharePoint modified date (22/09/2025).
9. **Environment:** not stated in the sheet.

## 2. What the ticket changed, as the TS shows it

1. Named BO accounts get a **[Reset]** button in the **Action column** of the BO transaction listings for STMS and eSTM.
2. [Reset] works on a transaction where **RHB Payment = Failed** and **Transaction Status = Failed**, whether JPJ Enquiry is OK or Failed, and for both Individual and Company transactions.
3. After the reset, the **UCD can pay again** for the same transaction.
4. The TS does not show a new role or menu; it checks per named BO account. [unconfirmed] The permission is granted per user, not per role.

## 3. Scenarios

### A. BO > Transaction Relevant > STMS Transaction Listing (sheet EAINT-8826, R2)

1. **8826_TS1** (R3, account eautochinwei) — UCD creates an **STMS Individual** transaction to Step 5 with JPJ Enquiry OK, RHB Payment Failed; BO resets it; UCD checks payment again. Expected: "- Able to reset payment for STMS transaction in Backoffice ⏎ - UCD able to make payment again".
2. **8826_TS2** (R4, kokping) — Reset an **STMS Individual** transaction with JPJ Enquiry **Failed**, RHB Payment Failed. Expected: "- Able to reset payment for STMS transaction in Backoffice".
3. **8826_TS3** (R5, eautoxiayuan) — Reset an **STMS Company** transaction with JPJ Enquiry **OK**, RHB Payment Failed. Expected: same as TS2.
4. **8826_TS4** (R6, eautohamal) — Reset an **STMS Company** transaction with JPJ Enquiry **Failed**, RHB Payment Failed. Expected: same as TS2.
5. **8826_TS5** (R7, wahidahzaki) — Check the button shows on the STMS listing. Expected: "- [Reset] button is displayed in the Action column".

### B. BO > Transaction Relevant > eSTM Transaction Listing (sheet EAINT-8826, R8)

1. **8826_TS6** (R9, eautochinwei) — UCD creates an **eSTM Individual** transaction to Step 5 with JPJ Enquiry OK, RHB Payment Failed; BO resets it; UCD checks payment again. Expected: "- Able to reset payment for eSTM transaction in Backoffice ⏎ - UCD able to make payment again".
2. **8826_TS7** (R10, kokping) — Reset an **eSTM Individual** transaction with JPJ Enquiry **Failed**, RHB Payment Failed. Expected: "- Able to reset payment for eSTM transaction in Backoffice".
3. **8826_TS8** (R11, wahidahzaki) — Reset an **eSTM Company** transaction with JPJ Enquiry **OK**, RHB Payment Failed. Expected: same as TS7.
4. **8826_TS9** (R12, eautohamal) — Reset an **eSTM Company** transaction with JPJ Enquiry **Failed**, RHB Payment Failed. Expected: same as TS7.
5. **8826_TS10** (R13, eautoxiayuan + eautojrjaya) — Check the button shows. Expected: "- [Reset] button is displayed in the Action column". **Note:** objective says eSTM but step 2 reads "BO > STMS Transaction Listing" — likely a copy slip in the sheet [unconfirmed].

## 4. Business rules and system behaviour the TS reveals

1. **Menu path** for both listings: "BO > Transaction Relevant > STMS Transaction Listing" (R2) and "BO > Transaction Relevant > eSTM Transaction Listing" (R8).
2. **Reset control location:** "Click [Reset] in Action column" (R3 step 5; R4–R6, R10–R12 step 4).
3. **State that qualifies for reset** (UCD-created case): "Create STMS Individual transaction until Step 5: ⏎ - JPJ Enquiry = OK ⏎ - RHB Payment = Failed ⏎ - Transaction Status = Failed" (R3); same for eSTM (R9).
4. **JPJ Enquiry state does not block reset:** TS2/TS4/TS7/TS9 use "JPJ Enquiry = Failed ⏎ - RHB Payment = Failed ⏎ - Transaction Status = Failed" and all PASS (R4, R6, R10, R12).
5. **Payment is reached at Step 5** of the UCD STMS/eSTM flow: "until Step 5" (R3, R9).
6. **After reset:** "UCD > Verify payment is reset and user able to make payment again" (R3 step 6, R9 step 6); expected "UCD able to make payment again".
7. The TS does **not** state the post-reset status values (Payment, Tx Status, Remarks). Existing knowledge gives them from another source (see §7, item 4).

## 5. Test data, environments, accounts, setup

1. **BO accounts used (usernames only, no credentials present):** eautochinwei (TS1, TS6), kokping (TS2, TS7), eautoxiayuan (TS3, TS10), eautohamal (TS4, TS9), wahidahzaki (TS5, TS8), eautojrjaya (TS10).
2. [unconfirmed] These six are the BO users granted the Reset permission by this CR.
3. **Data setup:** TS1 and TS6 create a fresh UCD transaction and force **RHB Payment = Failed**; the sheet does not say how the failure was produced. TS2–TS4 and TS7–TS9 use existing listing rows in the required state.
4. **Environment:** not written in the sheet.
5. **UCD account:** not named.

## 6. Gaps or risks a regression should still cover

1. **No negative test:** no scenario checks that a BO account **without** the permission does **not** see [Reset].
2. **Non-failed rows:** no check that [Reset] is hidden on Pending, Approved or Successful payments.
3. **UCD pay-again** checked only for Individual (TS1, TS6); not for Company or for JPJ Enquiry = Failed rows.
4. **Post-reset state** (Payment value, Transaction Status, Remarks, [Reset] link gone) not asserted.
5. **Confirm dialog** and the **BO Reset Payment Report** entry are not covered.
6. **TS10** may have tested the STMS listing instead of eSTM (see §3 B.5), so [Reset] visibility on the eSTM listing for eautoxiayuan / eautojrjaya is only indirectly covered.
7. **Each account is not tested on every case:** e.g. kokping only on Individual + JPJ Failed. Per-user coverage is spread, not full.

## 7. Comparison with existing knowledge

1. **knowledge/flow-stms.md L273–275, L288, L298:** consistent. The TS backs "Reset works as long as RHB Payment = Failed" for OK/Failed JPJ, Individual/Company.
2. **knowledge/flow-bo-shell.md L178–182** and **knowledge/business-rules-from-test-scenarios.md L176–180** cite "rows 3, 7". Row 3 holds "UCD able to make payment again"; row 7 holds "[Reset] button is displayed in the Action column". Citations are correct; the eSTM equivalents are **rows 9 and 13**.
3. **knowledge/flow-estm.md:** has **no** BO Reset Payment section. This TS shows the same reset applies to the BO eSTM Transaction Listing — a gap in that flow file.
4. **Post-reset values** in flow-stms.md L274 ("Payment '-', Tx Pending, Remarks cleared, Reset link gone") come from the Azfar repo, not from this TS. This TS neither confirms nor contradicts them.
5. **knowledge/cr-test-scenario-catalogue.md L227:** "10" scenarios, tester Nabila, 2025-09-22 — matches.
6. No ticket folder existed under `_reference/tickets/EAINT-8826/` or `_reference/tickets/Studying/EAINT-8826/`; no entry for EAINT-8826 in `lib/ticketStudies.ts`.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8826 - [eAuto-BackOffice] To grant Reset Payment Permission for eSTM & STMS.md` (text copy 28/10/2026, 10:01:11 am; cell text only, formatting and images not kept).
2. `knowledge/flow-stms.md`, `knowledge/flow-bo-shell.md`, `knowledge/business-rules-from-test-scenarios.md`, `knowledge/flow-estm.md` (grep "reset"), `knowledge/cr-test-scenario-catalogue.md`, `knowledge/flow-payments-fees.md`, `knowledge/flow-apt.md` (grep EAINT-8826).
3. Not read: the original .xlsx (formatting, colours, images); Jira ticket and SRD (not available to this unattended run).

## Knowledge candidates

1. **flow-estm.md — add BO Reset Payment entry point:** "BO > Transaction Relevant > eSTM Transaction Listing" with "Click [Reset] in Action column"; works for eSTM Individual and Company, JPJ Enquiry OK or Failed, when "RHB Payment = Failed" and "Transaction Status = Failed". Source: `[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, rows 8–12]`.
2. **flow-estm.md — UCD effect:** after BO reset, "UCD able to make payment again". Source: `[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, row 9]`.
3. **flow-stms.md / flow-estm.md — named accounts tested with Reset:** eautochinwei, kokping, eautoxiayuan, eautohamal, wahidahzaki, eautojrjaya. Source: `[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, column "BO Account", R3–R13]`. Tag [unconfirmed] that this is the full granted list.
4. **flow-bo-shell.md / business-rules-from-test-scenarios.md — add eSTM row refs:** extend "rows 3, 7" to "rows 3, 7, 9, 13". Source: same sheet.
5. **Note on TS10:** objective eSTM, step reads "BO > STMS Transaction Listing" (sheet EAINT-8826, R13). Regression should re-check [Reset] visibility on the eSTM listing.
