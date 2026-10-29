# EAINT-12336 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-12336/brief.json` (written 2026-10-27).

1. **High-level scope:**
   1. Fiuu onboarding payments (Pre-application and Application) are **reconciled** on the existing BO reconciliation page.
   2. **Match:** "Approved" + "Registration Fee OK" record with its Fiuu Transaction ID in the Fiuu Excel → matched, not listed.
   3. **Mismatch:** record missing from the Fiuu file, Fiuu row with no eAuto record, wrong amount, failed / pending payments.
   4. **Every Fiuu channel:** Card, FPX Personal, FPX Business (B2B approves later), DuitNow QR; failed-then-success retries.
   5. **Dates:** payment vs approved date, weekend / holiday, cross-month.
   6. **Listing, Summary, PDF and roles:** onboarding type in the filter, totals, View page = PDF, Finance / Ops / other BO user access.
   7. **Regression:** RHB reconciliation for the existing 13 modules unchanged.
2. **Estimated testing time:** **5 man-days** (range **4.5–5.5**), confidence **low** [unconfirmed]. Official figure: Jira "[QA] Est Man-day (cf 10081)" is **blank** (`EAINT-12336-jira.md:11`); no Miro figure.
3. **Modules / pages to cover:**
   1. **BO JPJ Reports (BO):** eAuto Reconciliation Summary Listing — Reconciliation Listing tab, Summary tab, Download PDF, Export — **changed** (new Fiuu source and onboarding type).
   2. **BO Application (BO):** Application Listing (Pre-Application tab, Registration Fee filter), Pre-Application / Application details → Payment Details — **source data** for the match (Status, Registration Fee, Payment ID).
   3. **UCD onboarding (UCD web; mobile named in Jira):** Pre-Application page 2 payment, Application Page 5 payment — **create** the Fiuu payments; mobile change not stated [unconfirmed].
   4. **Fiuu merchant portal (external, sandbox):** transaction listing Excel download — **test input** [unconfirmed: access].
   5. **BO JPJ Reports regression (BO):** eAuto Reconciliation Summary Report, eAuto Reconciliation Summary Report (eAuto Plus), JPJ Hasil upload — **regression** of the RHB flow on the same module.

## Header

1. **Module / portal:** BackOffice → JPJ Reports → **eAuto Reconciliation Summary Listing** (reconciliation page) + **UCD onboarding payment** (Pre-application RM 108 / Application RM 990, paid through **Fiuu**). `[Scout study, "What changes" #1–#3, "Requirements" R3–R4]`
2. **Past tickets kept:** **5** — EAINT-10168, EAINT-12055, EAINT-12113 (reconciliation page); EAINT-12153, EAINT-12257 (onboarding Fiuu payment).
3. **Own official TS:** **none** in the QA Team folder. No SRD on the ticket. `[Scout study, Header #10]`
4. **Dropped (name-only match):**
   1. EAINT-11934, EAINT-11541 — CIBO / Secarang payment reports. Different portal.
   2. EAINT-12107 — Secarang-Fiuu ShopeePay/GrabPay. Secarang merchant account, not eAuto onboarding.
   3. EAINT-1245 — JomCheck Transaction Listing. Different page.
   4. EAINT-11855, EAINT-8826 — Reset Payment permission / auto reset. Not onboarding, not the recon page.
5. **Linked tickets with no past TS found:** EAINT-12259, EAINT-12414, EAINT-12588, EAINT-12097. `fetch.mjs ts EAINT-12259` → "No workbook matches". EAINT-11883 and EAINT-11887 live as **sheets inside** the EAINT-10168 workbook.

## Related past tickets

1. **EAINT-10168** — "[eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-10168 - [eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance.md`
   2. Why: **built the page** 12336 extends ("same page as the current reconciliation"). Holds sheets EAINT-11883 and EAINT-11887. Has a **non-RHB data source precedent** (Insurance).
2. **EAINT-12055** — "eAuto-BackOffice Exclude Successful Resubmission Transaction from Reconciliation Listing".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-12055 - eAuto-BackOffice Exclude Successful Resubmission Transaction from Reconciliation Listing.md`
   2. Why: latest change to the **match logic** on the same listing; covers new vs existing records and retroactive matching.
3. **EAINT-12113** — "🐞[eAuto-BackOffice] Unable to Get SSM Data in Recon Listing when SSM Payment Date & Approved Date are Different".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-12113-[eAuto-BackOffice] Unable to Get SSM Data in Recon Li.md`
   2. Why: **payment date vs approved date** gap on the same listing; onboarding "Approved" also comes later than payment [unconfirmed].
4. **EAINT-12153** — "🔴[eAuto-Application] Add Payment Channels for Pre-application and Application".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.md`
   2. Why: creates the **Fiuu onboarding transactions** 12336 reconciles; checks "Registration Fee = OK" and BO Payment Details.
5. **EAINT-12257** — "🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.md`
   2. Why: adds **DuitNow QR** Fiuu transactions (approved / rejected / cancelled / expired) — all will appear in the Fiuu export.

## What was tested before

1. **EAINT-10168** (88 TS + 11 regression, per sheet "Progress Tracking" R11, R17):
   1. RECONLS_TS1–TS12_WS — "No. of eAuto Trx < No. of RHB Trx", one per module. `[sheet "eAuto < RHB", R5–R17]`
   2. RECONLS_TS13–TS14 — "Payment go through twice for 1 transaction" (eSTM, eVOC). `[sheet "eAuto < RHB", R24–R25]`
   3. RECONLS_TS15–TS27 — "No. of eAuto Trx = No. of RHB Trx", one per module. `[sheet "eAuto = RHB", R4–R16]`
   4. RECONLS_TS27–TS39 — "No. of eAuto Trx > No. of RHB Trx", one per module. `[sheet "eAuto > RHB", R4–R16]`
   5. RECONSL_SS_TS1 — "Payment made on weekends and/or public holiday". `[sheet "Special Scenarios", R10]`
   6. RECONSL_SS_TS2 — "Finance upload RHB transaction to Synology after 10am but before 12pm". `[sheet "Special Scenarios", R11]`
   7. RECON_ROLEPERM_TS1–TS4 — access, transaction types, Summary section, search per user role. `[sheet "Special Scenarios", R5; sheet "EAINT-11887", R24–R27]`
   8. 11883_TS1–TS4 — consolidated RHB file over weekend / holiday / month-end. `[sheet "EAINT-11883", R3–R6]`
   9. A&FERSL-TS06–TS30 — tabs, Payment Date filter, Transaction Type filter, Reset, Export, audit trail. `[sheet "S&F – Access & Filter", R4–R33]`
   10. L&CERSL-TS01–TS19 — totals section, Payment Date, Kod Hasil, Transaction Type, amounts, Refund Required. `[sheet "S&F – Listing & Columns", R4–R23]`
   11. JPJRBOREG_TS1–TS7, JPJHSLREG_TS1–TS4 — JPJ Reports and JPJ Hasil regression. `[sheet "Regression", R3–R16]`
2. **EAINT-12055** (52 TS, per sheet "Test Progress" R9):
   1. NEW_RECONLS_TS01–TS12 — "Payment OK and resubmission approved on different dates (same month) → mismatch pair excluded from listing after match." `[sheet "New Transaction", R4–R15]`
   2. NEW_RECONLS_TS13–TS24 — same, "in different calendar months (patched dates)". All **N/A**. `[sheet "New Transaction", R17–R28]`
   3. EXT_RECONLS_TS01–TS12 — "Transaction paid (OK) BEFORE deployment, resubmitted/approved AFTER deployment → mismatch pair excluded retroactively." `[sheet "Existing Transaction", R4–R15]`
   4. SPS_RECONLS_TS01 — recon matched → "RHB statement re-uploaded → manual recon triggered → verify mismatch does not reappear (permanent hide)". `[sheet "Special Scenarios ", R5]`
   5. REG_RECONLS_TS01–TS10 — same-day match baseline; "JPJ Final Submission FAILED but RHB Payment completed"; "JPJ Final Submission APPROVED but RHB Payment not received/failed". `[sheet "Regression", R4–R20]`
3. **EAINT-12113** (6 TS rows):
   1. RECONLS_TS01, TS03, TS05 — same-day payment and approval "(existing/baseline behaviour must not regress)" for JomCheck, SSM, Insurance. `[sheet "TS - EAINT-12113", R3, R5, R7]`
   2. RECONLS_TS02, TS04, TS06 — "retrieved in Recon Listing under its Approved Date when approval happens 2 days after payment". `[sheet "TS - EAINT-12113", R4, R6, R8]`
4. **EAINT-12153** (12 TS):
   1. 12153_TS1–TS8 — per channel and result: FPX (B2B) Success / Failed / "Pending Approval (revisit) > Approved" / "Failed > Success"; FPX (B2C); Card (Credit) VISA; Card (Debit) Mastercard. `[Sheet1, R4–R11]`
   2. 12153_TS9 — "Check : BO Payment Details after redo payment". `[Sheet1, R12]`
   3. 12153_TS12 — "Check : BO listing payment status". Steps include "BO - Filter Registration Fee = Failed and click Search" and "BO - Filter Registration Fee = OK and click Search". `[Sheet1, R15]`
5. **EAINT-12257** (13 TS):
   1. 12257_TS1–TS5 — "Happy Flow - Approved Payment", "Negative Flow - Reject Payment & Retry Payment", "Cancel transaction", "Close QR Code Window", "Timer Expiry". `[Sheet1, R4–R8]`
   2. 12257_TS6–TS10 — regression of FPX (B2C), Card, FPX (B2B). `[Sheet1, R10–R14]`
   3. 12257_TS11 — "Reject Payment & Retry Payment - BO Payment Details"; 12257_TS13 — "Timer Expiry - BO listing payment status". `[Sheet1, R15, R17]`

## Reusable scenarios

1. **Match / no-match triad** → adapt as Fiuu vs eAuto onboarding:
   1. eAuto = Fiuu (matched, not listed) ← RECONLS_TS15 pattern. `[10168, "eAuto = RHB"]`
   2. eAuto > Fiuu (Approved onboarding record missing from Fiuu file) ← RECONLS_TS27 pattern. `[10168, "eAuto > RHB"]`
   3. eAuto < Fiuu (Fiuu row with no Approved / Registration Fee OK record) ← RECONLS_TS1 pattern. `[10168, "eAuto < RHB"]`
   4. Run each for **Pre-application** and **Application** legs [unconfirmed: whether pre-app is in scope of "Registration Fee OK"].
2. **Double payment** ← RECONLS_TS13: maps to Fiuu "Failed > Success" retry (12153_TS4, TS8, TS9) — one reference, several Fiuu Transaction IDs.
3. **Payment date ≠ approved date** ← 12113 RECONLS_TS02; 12153_TS3 (B2B "Pending Approval (revisit) > Approved").
4. **Weekend / holiday / month-end** ← RECONSL_SS_TS1, 11883_TS1–TS4.
5. **Retroactive matching of existing records** ← EXT_RECONLS_TS01 (only if the SRD says existing records apply).
6. **Re-upload does not duplicate / reappear** ← SPS_RECONLS_TS01.
7. **Filter + listing checks** ← A&FERSL-TS19 (Transaction Type dropdown "contains exactly" list — must gain the onboarding type), A&FERSL-TS21–TS24, L&CERSL-TS01–TS07 (totals), L&CERSL-TS13 (Kod Hasil " - " for non-JPJ types), L&CERSL-TS15 (Transaction Type label).
8. **Roles** ← RECON_ROLEPERM_TS1–TS4 (Ops / Finance / Insurance / other BO user; with / without permission).
9. **Data creation** ← 12153_TS1–TS8 and 12257_TS1–TS5 steps to create paid onboarding records per channel.
10. **Regression** ← REG_RECONLS_TS01 (same-day RHB match) and JPJRBOREG_TS1–TS3 (Summary / Reconcile Now / Download PDF / JPJ Hasil upload).

## Known traps

1. **Upload timing.** "At 12pm, system will pick up the RHB transactions uploaded after 10am as there's no reconciliation yet happened at 10am" `[10168, "Special Scenarios", R11, RECONSL_SS_TS2]`. Whether the Fiuu file follows the same 10am / 12pm runs is [unconfirmed].
2. **Cross-month needs patched dates.** "Payment/approval dates are patched to simulate the month-end boundary (31 Jul -> 1 Aug); actual recon run dates are whichever day testing executes." All 12 rows ended **N/A**. `[12055, "New Transaction", R17–R28]`
3. **Some modules cannot be resubmitted.** "As per checked with dev, unable to resubmit Dereg Final Submission" `[12055, "New Transaction", R8]`; "unable to resubmit STMS (Wholesale) Final Submission,  record remain mismatch" `[12055, "Existing Transaction", R4]`.
4. **Payment vs approval split.** "Expect 2 mismatch entries with same Payment Ref No. & amount: bank-only on payment date, system-only on approved date." `[12113, "TS - EAINT-12113", R4]`. Onboarding approval by BO comes after payment [unconfirmed]; same split risk.
5. **Bank file prerequisite.** "RHB bank file uploaded to Synology for the test date." `[10168, "S&F – Listing & Columns", R6, L&CERSL-TS03]`; "Known mismatch data in preprod2." `[R7, L&CERSL-TS04]`. 12336 needs a **Fiuu merchant-portal Excel** for the test date instead.
6. **Non-RHB source precedent.** "Insurance type returns results (separate data source from RHB)" — marked Automatable "No" `[10168, "S&F – Access & Filter", R24, A&FERSL-TS24]`; "Insurance uses different logic from eAuto Core" `[10168, "S&F – Listing & Columns", R19, remark]`.
7. **Hard-coded dropdown list.** A&FERSL-TS19 expects the dropdown "contains exactly" 13 options `[10168, "S&F – Access & Filter", R19]`. Adding onboarding breaks this regression row unless updated.
8. **B2B approves later.** 12153_TS3 "Payment Status : Pending Approval (revisit) > Approved" `[12153, Sheet1, R6]`. Payment date in Fiuu vs eAuto may differ.
9. **Retry keeps Payment ID.** "Payment Details section shows the same Payment ID, Payment Method and Date/Time as the payment details page, with Payment Status = Paid" `[12153, Sheet1, R12, 12153_TS9]`. Fiuu export holds failed + successful rows for one Payment ID [unconfirmed].
10. **Cancelled / closed QR = Failed.** "Cancel the payment | Failed | No error message - follow existing behaviour (EAINT-12625, 26/10/2026)" `[12257, Sheet1, R25]`. These Failed rows will sit in the Fiuu export.
11. **Card test data source unclear.** "Card Details (Cannot remember either Razorpay or Fiuu. Need to confirm first)" `[12153, Sheet1, R18]`. Sandbox credentials are in `[12153, Sheet1, R17]`.
12. Added 2026-10-27 from the earlier TS studies:
   1. **Cross-month recon was never executed** for the resubmission-exclusion ticket (EAINT-12055): "Cross-month (SRD §2.2.4 item 2) was never executed." `[_reference/tickets/EAINT-12055/EAINT-12055-qa-team-ts-study.md:132]`
   2. **Backend follow-up fix shipped untested:** "Follow-up backend fix EAINT-12215 shipped without QA" `[EAINT-12055-qa-team-ts-study.md:135]`. Current recon behaviour may differ from the 12055 TS.
   3. **Pre-Application listing has no payment column.** "The Pre-Application listing has **no payment column**" — payment-channels TS rows that check "Registration Fee = OK" there likely mean the Application listing `[_reference/tickets/EAINT-12153/EAINT-12153-qa-team-ts-study.md:96]`. Same open point as 12336's match rule for the pre-application leg.
   4. **Card failure note is wrong:** sheet card "5555555555554440" "does not fail"; working method is "Mastercard 5200 0000 0000 1096 + wrong OTP on 3D Secure" `[EAINT-12153-qa-team-ts-study.md:94]`.
   5. **Registration fee amount changed:** "Registration fee changed to RM 1,500.00 on staging" `[EAINT-12153-qa-team-ts-study.md:104]`. Amount checks in the Fiuu match must use the live fee [unconfirmed which leg].
   6. **DuitNow QR payment set on a phone:** "Open on phone: https://bank-simulator.fiuu.com/duitnow/viewqr" `[_reference/tickets/EAINT-12257/EAINT-12257-qa-team-ts-study.md:31]`.

## Past QA-Issues mentioned

Updated 2026-10-27: summaries for 11823 / 11800 / 11801 added from their Jira captures (fetched by Scout). **None of the three states a root cause.**

1. **EAINT-11823** — on RECONLS_TS17 (eSTM, eAuto = RHB). `[10168, "eAuto = RHB", R6]`
   1. Summary: "[eAuto - BO / JPJ Hasil] Downloaded PDF does not match View Report data for eSTM Reconciliation Summary" `[EAINT-11823-jira.md:5]`
   2. Failed: View page showed H0272423 and H0272424; the downloaded PDF showed "H0272423 only", "H0272424 is missing". `[Description, Actual Result]`
   3. QA-Issue, Done, Medium. Retest comment 2026-06-22: "Retested & Verified OK on staging/preprod2".
   4. Root cause: not stated. [unconfirmed] PDF export dropped a result code.
2. **EAINT-11800** — on RECONLS_TS20 (eDereg Pre-Checking, eAuto = RHB). `[10168, "eAuto = RHB", R9]`
   1. Summary: "[eAuto - BO] eAuto Reconciliation Summary Listing - JPJ Fee for eDereg Pre-Checking should not be displayed in the listing" `[EAINT-11800-jira.md:5]`
   2. Expected: "Only eAuto Fee should be displayed in the listing when there’s mismatch for eDereg Pre-Checking transaction" `[Description table]`
   3. QA-Issue, Done, Medium; raised 2026-06-18, retested 2026-06-19.
   4. Root cause: not stated. [unconfirmed] Wrong fee type shown for the module.
3. **EAINT-11801** — on RECONLS_TS26 (Insurance, eAuto = RHB). `[10168, "eAuto = RHB", R15]`
   1. Summary: "[eAuto - BO] eAuto Reconciliation Summary Listing - Insurance transaction with no mismatch is being displayed in the listing" `[EAINT-11801-jira.md:5]`
   2. Steps: "Create eSTM + Insurance transaction - Insurance: - Status: Insurance Created - Payment: OK" `[EAINT-11801-jira.md:20]`
   3. QA-Issue, Done, Medium; raised 2026-06-18, retested 2026-06-19 (evidence "RECONLS_TS26.mp4").
   4. Root cause: not stated. [unconfirmed] Matched pair not excluded from the listing.
4. **EAINT-12113** — itself a Bug on the recon listing ("Unable to Get SSM Data in Recon Listing…"). `[Jira capture, 2026-10-27]`
5. **EAINT-12625** — referenced for QR cancel / close behaviour, "26/10/2026". `[12257, Sheet1, R25–R26]`
6. **Lessons for 12336** [unconfirmed]:
   1. 11800 and 11801 (both **non-RHB-style modules**) broke "matched = not listed". The new "eAuto = Fiuu" TS must check that matched onboarding rows are **not listed** and that only the **correct fee** shows.
   2. 11823: add a TS comparing the **View page vs downloaded PDF** for the onboarding / Fiuu result.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — the official figure lives in the QA Portal, which agents do not open.

1. **Comparable tickets:**

| Ticket | Area | TS count (text copy) | [QA] Est Man-day (cf 10081) | Source of man-day |
|---|---|---|---|---|
| EAINT-10168 | New recon page, 13 modules | 88 + 11 regression | "—" (blank) | `_reference/tickets/Studying/EAINT-10168/EAINT-10168-jira.md:11`, fetched 2026-10-27 |
| EAINT-12055 | Recon match-logic change | 52 | "4" | `_reference/tickets/Studying/EAINT-12055/EAINT-12055-jira.md:11`, fetched 2026-10-27 |
| EAINT-12113 | Recon bug, 3 modules | 6 | "3" | `_reference/tickets/Studying/EAINT-12113/EAINT-12113-jira.md:11`, fetched 2026-10-27 |
| EAINT-12153 | Onboarding Fiuu channels | 12 | "3.5" | `_reference/tickets/Studying/EAINT-12153/EAINT-12153-jira.md:11` |
| EAINT-12257 | Onboarding DuitNow QR | 13 | "3" | `_reference/tickets/Studying/EAINT-12257/EAINT-12257-jira.md:11` |

   1. EAINT-12336 own field: "**[QA] Est Man-day (cf 10081):** —" `[EAINT-12336-jira.md:11]`. Scout study quotes **no** Miro or other man-day figure.
   2. 12113 catalogue says 7 TS (`knowledge/cr-test-scenario-catalogue.md:241`); the text copy has 6 rows.
2. **Expected TS count for EAINT-12336:** **25–40.** One new source (Fiuu) and one module (onboarding, 2 legs, 4 channels) on an existing page — smaller than 12055's 13-module grid, larger than 12113. Regression of RHB recon adds ~5–8.
3. **Estimate in man-days:** **5** (range **4.5–5.5**)
   1. TS drafting: **1** (no SRD yet; reuse 10168 / 12055 layout).
   2. Test execution: **2–2.5** (create onboarding payments per channel/leg, export Fiuu file, run recon, check listing + summary, roles).
   3. Retest / QA-Issue buffer: **0.5–1** (recon tickets raised 3 QA-Issues on 10168).
   4. Automation build: **1**, partial only — onboarding payment creation can reuse `scripts/eauto-payment-channels` / `scripts/eauto-duitnow-qr` [unconfirmed]; Fiuu merchant-portal export and recon run timing stay manual.
4. **Confidence: low.** No SRD, Fiuu feasibility unconfirmed, upload method (file vs API) unknown `[Jira description, row 6]`. Would rise once the SRD names the page, upload method, match key and scope of existing records.

## Sources read

1. `_reference/tickets/Studying/EAINT-12336/EAINT-12336-study.md` (Scout study, 2026-10-27).
2. `_reference/tickets/Studying/EAINT-12336/EAINT-12336-jira.md` (field line 11).
3. `_reference/sharepoint/qa-team-ts/EAINT-10168 - [eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance.md` (text copy 27/10/2026 2:31:55 pm).
4. `_reference/sharepoint/qa-team-ts/EAINT-12055 - eAuto-BackOffice Exclude Successful Resubmission Transaction from Reconciliation Listing.md` (text copy 27/10/2026 5:34:14 pm).
5. `_reference/sharepoint/qa-team-ts/EAINT-12113-[eAuto-BackOffice] Unable to Get SSM Data in Recon Li.md` (fetched 2026-10-27 via `fetch.mjs ts`).
6. `_reference/sharepoint/qa-team-ts/EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.md`.
7. `_reference/sharepoint/qa-team-ts/EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.md`.
8. Jira captures fetched 2026-10-27: EAINT-12055, EAINT-10168, EAINT-12113; existing captures EAINT-12153, EAINT-12257.
9. `knowledge/business-rules-from-test-scenarios.md` §11; `knowledge/cr-test-scenario-catalogue.md` rows 008, 029, 032.
10. Added 2026-10-27: `_reference/tickets/Studying/EAINT-11823/EAINT-11823-jira.md`, `EAINT-11800/EAINT-11800-jira.md`, `EAINT-11801/EAINT-11801-jira.md` (captured by Scout 27/10/2026).
11. Added 2026-10-27: TS studies `_reference/tickets/EAINT-12055/EAINT-12055-qa-team-ts-study.md`, `_reference/tickets/EAINT-12153/EAINT-12153-qa-team-ts-study.md`, `_reference/tickets/EAINT-12257/EAINT-12257-qa-team-ts-study.md`.
12. Searched, nothing relevant: CIBO user-ID listing ticket (EAINT-11934), CIBO RMS→Fiuu label ticket (EAINT-11541), Secarang ShopeePay/GrabPay ticket (EAINT-12107), JomCheck Transaction Listing ticket (EAINT-1245) — grep "merchant|transaction id|reconcil" = 0 hits; `fetch.mjs ts EAINT-12259` (Card channel ticket) = no workbook; `data/pipeline/answers.json` = no entry for 12336 / reconciliation / onboarding.
13. Correction 2026-10-27: TS studies **do exist** for 12055, 12153, 12257. Earlier line said none existed.
