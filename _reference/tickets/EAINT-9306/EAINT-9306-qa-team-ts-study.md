# EAINT-9306 — QA Team test script study (2026-10-27)

Written unattended by the SharePoint Scribe. Read-only study; no other file changed.

## Sources read

1. **Workbook text copy** — `_reference/sharepoint/qa-team-ts/EAINT-9306 - 🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow.md` (captured "27/10/2026, 8:47:52 pm"). Cell text only; **colours, bold and images are not in the copy**, so in-cell formatting could not be checked.
2. **Jira capture** — `_reference/tickets/Studying/EAINT-9306/EAINT-9306-jira.md`.
3. **Session handoff** — `_reference/tickets/EAINT-9306/Session-Handoff-2026-09-17-9306.md` (lines 1–905 read; the older half not read).
4. **Knowledge** — `knowledge/flow-edereg.md` §1–§6, §45, §47 and the JPJ code-checker table (lines 4348–4476); `knowledge/cr-test-scenario-catalogue.md` row 098.
5. **Not opened this run:** the SRD PDFs (V1.0, V1.1, V1.2) and the test-plan PDF in `_reference/tickets/EAINT-9306/`. SRD content below is quoted from `flow-edereg.md` §47, which diffed those PDFs on 2026-10-15.

## 1. Header

1. **Ticket:** EAINT-9306 — "🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow".
2. **Jira state:** "Status: Done", "Fix versions: S33.6-20260915🌞 (2026-09-15)". Developer comment 2026-09-15: "This ticket has been deployed to Production on 15.09.2026 (Tuesday)." QA field: Faizuddin.
3. **Module / portal:** **AATF portal → eDEREG** (Deregistration Step 2 and Pre-Checking Enquiry). Back Office (BO) Dereg details is covered by one scenario (FC_TS7).
4. **Workbook:** "EAINT-9306 - 🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow.xlsx", SharePoint library "eAuto - CR Test Scenarios", **modified 25/06/2026, 11:01:06 am**. Catalogue row 098 in `knowledge/cr-test-scenario-catalogue.md`.
5. **Sheets:** "E2E", "Functional", "Sheet 3" (empty).
6. **Scenarios:** **13 TS ids** — 4 on E2E (9306_E2E_TS1–TS4), 9 on Functional (9306_FC_TS1–TS9). Some TS span two to four rows (step parts).
7. **Results:** **none recorded.** The "QA" and "Test Result (P/F)" columns are empty on every row.
8. **Tester / dates:** none written in the sheet. Row 1 of both sheets holds the Figma link only.
9. **Status of the draft:** Functional R21 has an unnumbered note: "To add E2E flow for the pre-check funtion". FC_TS6/TS7 carry the Remark "include for E2E". **The workbook reads as an unfinished draft** [unconfirmed].
10. **Timing:** the workbook was last modified **25/06/2026**, before SRD V1.1 (01.09.2026) and V1.2 (10.09.2026). It cannot reflect those two versions.

## 2. What the ticket changed, as the TS shows it

1. **Compulsory gate at Dereg Step 2.** After the Vehicle Number is entered and focus leaves the field, the system checks for an approved pre-check within 6 months (E2E sheet R3, steps 5–7).
2. **Inline purchase when the gate fails.** A payment popup opens with "Approved eDereg Pre-Checking within 6 months is required to proceed" (E2E R4). Paying runs the pre-check enquiry inline, then returns the user to Step 2 (E2E R5).
3. **Success message under the field:** "This vehicle is allowed to create eDereg Transaction", in green (E2E R3).
4. **New "eDereg Pre-Checking:" item** on AATF and BO Dereg transaction details, value "Yes" (hyperlink) or "-" (Functional R12, R14).
5. **Red bold announcement** on AATF home, eDEREG page and the Kategori ID page (Functional R16–R19).

## 3. Scenarios

### 3a. E2E sheet — full Deregistration flow

1. **9306_E2E_TS1** (R3) — vehicle with an approved pre-check within 6 months, MyKad. Expected: "This vehicle is allowed to create eDereg Transaction", "The message is in green colour", "Able to proceed until complete transaction".
2. **9306_E2E_TS2** (R4–R5) — vehicle with no pre-check, **MyPR**. Expected: popup "Approved eDereg Pre-Checking within 6 months is required to proceed"; after Next, "GLB000000I – ENQUIRY SUCCESSFUL"; success message; complete transaction.
3. **9306_E2E_TS3** (R6–R7) — vehicle with an **invalid pre-check under 6 months**, MyKad. Same expected results as TS2: popup, purchase, success, complete.
4. **9306_E2E_TS4** (R8–R9) — vehicle with an **approved pre-check over 6 months old**, MyPR. Same expected results as TS2.

### 3b. Functional sheet — gate behaviour and payment

1. **9306_FC_TS1** (R3) — Cancel on the pre-check popup. Expected: "System will return back to page Step 2" and the error under Vehicle Number: "Approved eDereg Pre-Checking within 6 months is required to proceed".
2. **9306_FC_TS2** (R4–R5) — payment failed, **RHB IF**. Expected first popup: "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. 你的RHB银行余额不足."; second popup "Payment pop up with payment history error code". Then set eSIM to 00: "System show eDereg Pre-Checking Enquiry pop up with response code = GLB000000I – ENQUIRY SUCCESSFUL". Remark: "simulate fail more than one time. if fail multiple time, payment history must increase".
3. **9306_FC_TS3** (R6–R7) — payment failed, **RHB RE**. Expected first popup: "RE - Sila TUNGGU 6 minit kemudian klik ‘Resubmit’. Sistem RHB sedang diproses. (RHB 网络障碍，请等 6分钟后再点击Resubmit。）". Then 00 → GLB000000I.
4. **9306_FC_TS4** (R8–R9) — pre-check failed **VEL000100E**. Expected: popup response "VEL000100E – VEHICLE RECORD NOT EXIST"; after Close, "The Vehicle No. field is blank".
5. **9306_FC_TS5** (R10–R11) — pre-check failed **VEL000045E**. Expected: response "VEL000045E – PLEASE CONTACT HELPDESK - VELVE" and the note "Note: The system is currently unavailable. Kindly contact our Customer Service at 03-27798899"; after Close, field blank.

### 3c. Functional sheet — details pages, announcement, validation

1. **9306_FC_TS6** (R12–R13) — **[AATF]** Dereg details. Expected: "eDereg Pre-Checking:" under e-invoice validation date, value "Yes (Hyperlink)" or "-"; Yes redirects to the Pre-Checking listing, Vehicle No. auto-filled, all pre-checks for that vehicle listed.
2. **9306_FC_TS7** (R14–R15) — **[BO]** Dereg details. Same expected results as FC_TS6. **Steps still say "Login into an AATF account"** — a copy-paste slip; BO login is not described.
3. **9306_FC_TS8** (R16–R19) — announcement on four places: home, eDEREG page, Kategori ID page, and after clicking MyKad ("The same message is still displayed under the popup").
4. **9306_FC_TS9** (R20) — Vehicle No. left blank, Next. Expected: red "This field is required."

## 4. Business rules and system behaviour the TS reveals

1. **Gate message, blocked:** "Approved eDereg Pre-Checking within 6 months is required to proceed" (E2E R4; Functional R3). Matches `flow-edereg.md` §4 and SRD §2.2.2.
2. **Gate message, passed:** "This vehicle is allowed to create eDereg Transaction" (E2E R3). The live DOM and SRD use a lower-case "transaction" ("This vehicle is allowed to create eDereg transaction", `flow-edereg.md` §4). **Capital "T" in the TS is a wording difference**; a strict text match would fail.
3. **Gate trigger:** "Click anywhere other than the VN field. Observe the loading popup" (E2E R3, step 6). Matches `flow-edereg.md` §6: "fires on vehicle-field exit".
4. **Invalid or expired pre-check is treated like none:** TS3 ("invalid Pre-Check transaction within 6 months") and TS4 ("approved Pre-Check transaction more than 6 months") both expect the purchase popup (E2E R6, R8).
5. **Enquiry success text:** "GLB000000I – ENQUIRY SUCCESSFUL" (E2E R5). The JPJ code checker recorded `GLB000000I` as "TRANSACTION SUCCESSFUL" (`flow-edereg.md` line 4456). **Description text differs**; check which the popup shows [unconfirmed].
6. **Payment failure keeps a history:** "if fail multiple time, payment history must increase" (Functional R4, Remarks). Matches the "Payment History" block in `flow-edereg.md` §4.
7. **RE wait is 6 minutes:** "RE - Sila TUNGGU 6 minit kemudian klik ‘Resubmit’" (Functional R6). The separate **ER code waits 12 minutes** (handoff 2026-09-14) and **the TS does not cover ER**.
8. **VEL000045E note:** "Note: The system is currently unavailable. Kindly contact our Customer Service at 03-27798899" (Functional R10). The code checker found the same note on **70 of 72 codes** (`flow-edereg.md` line 4348).
9. **Close clears the field:** "The Vehicle No. field is blank" after VEL000100E and VEL000045E (Functional R9, R11). Matches SRD V1.1 Scenario 4.
10. **The TS stops at the first Close.** Later behaviour is not covered:
    1. SRD V1.1 adds that re-entering the same vehicle shows "the same JPJ Pre-Checking Status = Failed result" (`flow-edereg.md` §47).
    2. Faizuddin's rule: **VEL000100E is the only code that allows a repurchase** (handoff 2026-09-04, thread 3).
11. **Details item placement:** "\"eDereg Pre-Checking:\" is placed under e-invoice validation date" (Functional R12). The live capture places it **in the next row, beside "Manufacturing Year:"**, below e-Invoice Validation Date (`flow-edereg.md` §45 correction).
12. **Yes link lists all pre-checks:** "The listing displays all the pre-checking transactions for the selected vehicle" (Functional R13). Matches `flow-edereg.md` §6.
13. **Announcement text** (Functional R16): "Effective immediately, AATF is required to complete the eDereg Pre-checking process prior to proceeding with Deregistration, and  Deregistration may only be carried out upon successful completion of the said pre-checking." Shown "in bolded red". The TS cell has a **double space** before "Deregistration may"; `flow-edereg.md` §6 has a single space.
14. **Vehicle No. is mandatory:** "This field is required." (Functional R20). SRD §2.3.2.1 also gives "alphabet + digit, min length 3" (`flow-edereg.md` §47). **The TS does not test the format or length rules.**

## 5. Test data, environments, accounts, setup

1. **Account:** "Login into an AATF account" — no username named. **No credentials in the sheet.**
2. **Environment:** not stated in the sheet.
3. **Categories:** MyKad (E2E TS1, TS3) and **MyPR** (E2E TS2, TS4).
4. **eSIM steering:**
   1. "Set eSim RHB Transfer = IF", "= RE", "= 00" (Functional R4–R7).
   2. "Set eSim Dereg Precheck = VEL000100E", "= VEL000045E" (Functional R8, R10).
5. **Vehicle preconditions** (E2E "Before testing" lines): approved pre-check within 6 months; no pre-check; invalid pre-check within 6 months; approved pre-check over 6 months. **The TS does not say how to make the over-6-months record**; `flow-edereg.md` line 275 says this needs a dev patch ("patch trx to expire (after 6 months)").
6. **Figma:** "https://www.figma.com/design/l3HOoBRG97sO3Nkjo9dx2l/eAuto-AATF?node-id=2239-2416&p=f&t=lCrMU3X7SUrEW6nu-0" (both sheets, R1).

## 6. Gaps and risks a regression should still cover

1. **Perakuan declaration (SRD V1.2, REQ-001–007)** — absent. Covers the email field (prepopulated, editable, mandatory), shown only on a new transaction, "not displayed again when the payment is resubmitted" (`flow-edereg.md` §47). It is in production since 15.09.2026.
2. **Re-entry after a failed pre-check** — absent. Covers the reshow rule (SRD V1.1 Scenario 4) and the VEL000100E repurchase exception.
3. **Company-specific validation** — absent. A pre-check from one AATF company must not pass the gate for another (`flow-edereg.md` §5.1).
4. **Approved then later failed** — absent. An earlier approval should still pass. Sub-task **EAINT-12251** ("Internal Server Error at Step 2 when the vehicle already has an Approved pre-check plus a later Declined one") shows this broke once.
5. **Standalone Pre-Checking Enquiry entry point** — only used as a precondition, never tested itself.
6. **RHB ER (12-minute cooldown) and Resubmit from the listing** — absent. Sub-task **EAINT-12258** concerns a Resubmit failure.
7. **Vehicle status not Active on the pre-check** — absent. Sub-task **EAINT-12340**: "Deregistration proceeds even when the vehicle status is not Active on the pre-check".
8. **Cronjob expiry of failed pre-checks** — absent. Sub-task **EAINT-12240**.
9. **BO cancel then refresh at Step 2** — absent. Sub-task **EAINT-12233**.
10. **JPJ XML Log (Deregistration Pre-Checking)** and **Payment Report** entries — not checked.
11. **FC_TS7 (BO)** has AATF login steps; a regression should state the BO path.
12. **Vehicle No. format** (alphabet + digit, min length 3) — only the blank case is covered.
13. **Text differences to watch** in any automated assert: "Transaction" vs "transaction" (§4 item 2); "ENQUIRY SUCCESSFUL" vs "TRANSACTION SUCCESSFUL" (§4 item 5); the double space in the announcement (§4 item 13).

## Knowledge candidates

1. **Second QA Team TS exists for 9306**, separate from the test-plan PDF used for automation. It uses ids 9306_E2E_TS1–TS4 and 9306_FC_TS1–TS9, has no results, and was last modified 25/06/2026, before SRD V1.1/V1.2. Target: `knowledge/flow-edereg.md` sources list. Source: this workbook, both sheets.
2. **MyPR category is used in the E2E flow** (E2E R4 "Choose MyPR. Proceed until Step 2"; R8). Target: `knowledge/flow-edereg.md` §3/§5 if the automation covers only MyKad [unconfirmed — not checked against the specs].
3. **RHB IF first-popup wording:** "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. 你的RHB银行余额不足." Source: Functional R4. Already in `flow-edereg.md` line 4973 as a Remarks value; could be added to `knowledge/eauto-payments.md` as the popup text.
4. **RHB RE first-popup wording:** "RE - Sila TUNGGU 6 minit kemudian klik ‘Resubmit’. Sistem RHB sedang diproses. (RHB 网络障碍，请等 6分钟后再点击Resubmit。）". Source: Functional R6. Target: `knowledge/eauto-payments.md`.
5. **Possible GLB000000I description mismatch:** TS says "GLB000000I – ENQUIRY SUCCESSFUL" (E2E R5); the code checker recorded "TRANSACTION SUCCESSFUL" (`flow-edereg.md` line 4456). Needs a live check before either is treated as fact [unconfirmed].
6. **Gate success message capitalisation:** TS "eDereg Transaction" (E2E R3) vs live/SRD "eDereg transaction". Target: `knowledge/flow-edereg.md` §4 as a note for text asserts.
