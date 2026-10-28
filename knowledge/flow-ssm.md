# SSM document purchase and permissions (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/ssm.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- SSM is the company-registration document from the Suruhanjaya Syarikat Malaysia. eAuto buys it for a company seller (STMS) or company buyer (eSTM), checks that the company and its representative match the transaction, and reuses it for 7 days. BO settings decide whether a user must buy it, upload documents, or bypass the purchase. Shallow area for Faizuddin: Azfar's repo is the main source.
- Portals: UCD Portal, Public /obs (Pre-Application), Back Office, Rafftech SSM e-Info API (external), RHB (payment), eSim (staging)
- Related modules: stms, estm, onboarding, company-profile-einvoice, backoffice, payments-fees

## Glossary
- SSM: Suruhanjaya Syarikat Malaysia. The company registrar. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- ROB / ROC / LLP: Business types in the SSM lookup. eSim itemType B = ROB (Registration of Business), C = ROC (Registration of Company), L = LLP. [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
- BRN: Business Registration Number. A new 12-digit number and an old one (e.g. 597436-Q, written with '-A' in the SSM document). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- SSM Permission (company): BO company box 'STMS - Company Category' (ssmPermission) and 'ESTM - Company Category' (estmSsmPermission). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Bypass Purchase SSM (user): BO user box (stmsSsmBypass / estmSsmBypass). The user uploads all documents and does not buy SSM. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [jira: EAINT-8802 2026-01]
- Hybrid model: The older model (EAINT-8526 / 8532) that combined a company-level and a user-level SSM permission. Superseded by 8802. [ts: EAINT-8526/8532 SSM_HM_TS1-TS8] [mine: 02b-my-knowledge.md Module SSM]

## Flow: Enquire, buy and submit an SSM document
- The system enquires with SSM, the UCD pays through RHB, then the SSM document is submitted and downloaded. It is bought from four places.
- Portals: UCD Portal, Public /obs, Rafftech SSM e-Info API, RHB (payment), eSim on staging

### Entry points and steps
- Entry point "STMS Step 4 [Purchase SSM] (company seller)": UCD › STMS › Step 4 › [Purchase SSM] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [azfar: eauto-qa-azfar:01-azfar-repo.md Flow: STMS Company seller - SSM Permission / Purchase SSM at Step 4]
  - Offered only when the company SSM permission says so. Azfar found both the STMS and ESTM company boxes must be ticked before the transaction starts.
  1. Pop-up 1: Purchase SSM Document | where: UCD › STMS › Step 4 | Seller Company Name and Seller SSM Number (<ROC>-A). 'Please reconfirm ...'. [Cancel] [Next]. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
  2. Pop-up 2: Payment Summary | where: UCD › STMS › Step 4 | 'SSM Profile & Admin Fees: RM 18.00, eAuto Service Tax: RM 1.44, Total Amount Payable: RM 19.44 ... validity of the SSM document is 7 days only'. [Cancel] [Make Payment] (class confirm-wfw-dialog-btn). Pays by RHB. | affects: RHB payment; BO SSM Transaction listing; SSM XML Log [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
     - If An Approved SSM document for the same number exists within 7 days -> Step 4 reuses it. No purchase.
     - If Two sessions buy the same SSM -> Popup 'SSM Document for this Seller Company was purchased recently.' [OK]/[X], then Step 4 refreshes and reuses it.
  3. Verification | where: UCD › STMS › Step 4 | After payment the document is verified. See the verification flow. | affects: SSM verification flow [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Entry point "eSTM Step 4 (company buyer)": UCD › eSTM › Step 4 [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase] [ts: EAINT-8802 E2E_eSTM_TS1]
  1. Purchase SSM as a company buyer | where: UCD › eSTM › Step 4 | Same purchase as STMS. An SSM bought in eSTM is auto-retrieved in STMS for the same ROC. | affects: eSTM; STMS [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
- Entry point "Pre-Application (public /obs)": Public /obs › Pre-Application › Step 1 (blur on New BRN) and Step 2 payment [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase] [azfar: eauto-qa-azfar:knowledge/cross-portal/onboarding.md]
  1. SSM enquiry on the New BRN, auto-purchase on payment | where: Public /obs › Pre-Application | Step 1 does the SSM enquiry when the user leaves the New BRN field. Step 2 payment auto-purchases the document. | affects: Onboarding [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
- Entry point "Company / Business Profile 'Agree to Purchase'": UCD › Company / Business Profile Update › Agree to Purchase [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
  1. Buy SSM for the profile update | where: UCD › Company / Business Profile | The profile update (driven by Type of Business: ROB, ROC, TLN, LLP) can buy SSM data. | affects: Company Profile and e-Invoice [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
- Entry point "Repurchase without the 7-day block (FUTURE)": UCD › STMS / eSTM › Step 4 (EAINT-12121) [jira: EAINT-12121 2026-10] [jira: EAINT-12230 2026-10]
  - Code Review, S34.X-20261028. Not live.
  1. Allow repurchase the same or next day | where: UCD › Step 4 | Removes the 7-day block after the first purchase so the UCD does not need an IT patch. Adds cross-flow repurchase (STMS to eSTM), download of the latest SSM only, and Sub UCD repurchase. EAINT-12230 adds duplicate-purchase validation on the payment step. [jira: EAINT-12121 2026-10]
  2. SRD v1.0 (18.08.2026) rules, verbatim. Copy: `_reference/tickets/Studying/EAINT-12121/EAINT-12121_SRD_v1.0_20260818-text.md`. Not live. [from ticket EAINT-12121, SRD v1.0]
     - §2.2.2 #2: "Allow UCD to repurchase SSM starting from the same day, 10 minutes after the previous purchase." "Allow UCD to repurchase SSM regardless of the SSM status." "No IT patching is required."
     - §2.1.1 Assumptions: "The 10-minute cooling period is counted from the previous SSM purchase, not from the first purchase." "Each SSM repurchase is charged the standard SSM fee. No free repurchase is granted." "The SSM document remains valid to download for 7 days from its purchase date. This validity period is unchanged."
     - REQ-002/003: within 10 minutes "[Purchase SSM] button is not displayed"; "No error message is shown to the UCD." The button appears by "a. Refreshing the page manually b. Selecting “No” in the Payment Confirmation popup"; "the system shall auto-refresh the page after the UCD selects “No”."
     - REQ-004: previous status OK or Failed, "Repurchase is allowed". REQ-012: "Upon purchasing SSM in the STMS flow, the UCD shall be able to repurchase SSM in the eSTM flow." REQ-014: "another UCD user shall be able to repurchase SSM, regardless of which user made the earlier purchase."
     - REQ-006: UCD downloads "the latest SSM document". REQ-007: "BO shall be able to download the SSM documents in a zip file." REQ-013: "the UCD shall no longer be able to view or download the SSM document of any previous purchase, even when the previous SSM status was OK." If the latest is Failed, "no SSM document is available to the UCD until the next successful purchase."
     - REQ-008: "Each repurchase creates a new record in the SSM Transaction Listing. The record of the previous purchase remains." REQ-011: same for "the eAuto Reconciliation Summary Listing". REQ-009: "Each SSM purchase has its own invoice and e-Invoice. The latest document is displayed as the first document in the list." REQ-010: invalid TIN → "Record is added in the Consolidated e-Invoice Listing and submitted to LHDN".
     - §2.2.3 #8: "UCD Portal - STMS and eSTM Listing Page > Resubmit" — "Entry into the SSM repurchase flow through the Resubmit action."
     - Conflict inside the SRD: §2.1.2 Out-of-Scope says "SSM document download handling in UCD Portal and BackOffice" ("UCD and BO continue to download the latest SSM document"), yet REQ-006/007/013 define download rules and REQ-007 gives BO a zip. [source: Studying EAINT-12121 study §Open questions #5, 2026-10-27]
     - Jira text says "(within same day or next day)" with no 10-minute rule; the SRD adds it. SRD wins. [source: Studying EAINT-12121 study §Open questions #7, 2026-10-27]
  3. EAINT-12230 (Bug, no SRD; the Jira description is the requirement) — double charge through an already-open Payment Confirmation dialog. Not live. [from ticket EAINT-12230, Jira description, read 2026-10-26]
     - The gap, verbatim: "The "transaction is paid" refusal added recently only applies when user clicks Purchase SSM — it does not apply when a user confirms payment from a dialog that was already open on their screen, which stays valid for about 24 hours."
     - Two routes (Jira table, verbatim): "Search step | Clicks **Purchase SSM** on Step 4 | Yes — refuses, no charge"; "Payment step | Clicks **Yes** on a Payment Confirmation dialog already open | **No — charges again**".
     - Expected after the fix (Jira, verbatim): "Colleague in the same company already **paid** this BRN, **not yet Approved** | Refuse payment — no charge"; "Winning purchase **Approved**, 10-minute cooldown **not elapsed** | Refuse payment — no charge"; "Winning purchase **Approved**, 10-minute cooldown **elapsed** | **Allow** repurchase — must keep working"; "Clerk **retries payment on their own** already-paid row | **Allow** — return existing payment, no 2nd charge".
     - Repro (Jira scenario, verbatim): "A opens 10:00, B opens 10:01 (dialog left open), A pays 10:05, B clicks Yes 10:06 → charged twice, 2 paid rows". Needs two users of the same UCD company on different STMS deals for the same seller BRN. Proof of no double charge = count of paid rows in BO SSM Transaction Listing. [source: Studying EAINT-12230 study §Test data #1, §QA scope #4, 2026-10-27]
     - [unconfirmed] The "recent change" the bug refers to is the EAINT-12121 build, not production, so 12230 fixes 12121's new guard. [source: Studying EAINT-12230 study §New vs existing #3, from QA colleague's study, 2026-10-27]
     - Conflict: cooldown anchor. 12230 Jira says "within 10 min of approval"; 12121 SRD Assumption says "counted from the previous SSM purchase". [source: Studying EAINT-12230 study §Open questions #2, 2026-10-27]
     - Conflict: 12230 refuses a paid-not-Approved purchase; 12121 REQ-004 allows repurchase "regardless of the SSM status". [source: same, #3]
     - Open: refusal message on the payment step is defined nowhere; Jira names the button "Yes" while this file's pop-up 2 names it [Make Payment]; eSTM payment step not named; same-company only, or any UCD on the same BRN (the old EAINT-5155 rule was database-wide). [source: same, #1, #4-#6]

### Cross-module effects (what it affects)
- BO SSM Transaction listing, SSM XML Log (/view/ssm/xml-log), Bypass Purchase SSM page and audit log. [azfar: eauto-qa-azfar:knowledge/portals/backoffice/portal.md] [mine: 02b-my-knowledge.md Module SSM]
- Invoices: SSM Document, SSM Invoice, SSM e-Invoice on Transaction Details. MyInvois e-invoice code 022. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [mine: 02b-my-knowledge.md Module SSM]
- Reconciliation type SSM. Main UCD vs Sub UCD dimension (EAINT-8526 history). [azfar: eauto-qa-azfar:cr/EAINT-8526/LEDGER.md]
- Payment reports: SSM is included in the Payment Breakdown Report and UCD Payment Report. [ts: EAINT-7495] [ts: EAINT-3090]

### Cronjobs
- SSM Final Submission resubmit | Every 2 minutes | When SSM Final Submission fails, the screen says 'Verification unavailable now. Please call eAuto at 1700816186' and shows [SSM Invoice]. The cronjob resubmits every 2 minutes. [azfar: eauto-qa-azfar:cr/EAINT-9247/LEDGER.md] [miro: PO_SSM_FS] [ts: EAINT-9247 TS31-TS32]
- [unconfirmed] SSM transaction expiry | After 7 days | An SSM transaction expires after 7 days. [azfar: eauto-qa-azfar:cr/EAINT-9247/LEDGER.md]

### Roles
- UCD users who create STMS or eSTM Company transactions. BO sees SSM Transactions and the XML Log. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- The SSM data lives in eSim on staging: ssm-enquiry-resp, ssm-rob-submission-resp, ssm-roc-submission-resp (page1 to page6; page3 = directors, page4 = shareholders) and ssm-llp-submission-resp. A company needs rows in BOTH the enquiry and the submission entities. [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase] [azfar: eauto-qa-azfar:knowledge/cross-portal/onboarding.md]

### Where the transaction goes
- The SSM document is stored for 7 days (counted to 23:59:59) and reused by any deal on the same SSM number, across modules. The transaction then continues at Step 4 to Make Payment. [azfar: eauto-qa-azfar:cr/EAINT-5155/LEDGER.md] [azfar: eauto-qa-azfar:cr/EAINT-9247/LEDGER.md]

### Rules
- SSM price RM19.44 = RM18.00 SSM Profile and Admin Fees + RM1.44 eAuto Service Tax. One fee line on screen (staging /uat1/, 21.10.2026). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
  - Conflict: other version: RM15.00 + RM3.00 + RM1.44 = RM19.44 (EAINT-10691). [mine: 02b business-rules §1.2] [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026] (Older workbooks (10691 regression in 9247, 2026-04) split the fee.)
  - Conflict: other version: RM18.64. [jira: EAINT-5155 2025-01] (SRD 5155 is older still.)
- SSM response codes: 001 Authentication error, 002 Duplicate Order Code, 003 Not Found, 004 Found (Pending), 005 Confirm (Approved), 006 Insufficient Balance, 007 Search Not Done, 008 Duplicate, 009 Unable to Supply Data (popup 'Purchase SSM Document'), 010 Found and Available, 011 PDF file and Second Endpoint expired. [mine: 02b-my-knowledge.md Module SSM]
- The SSM record need not be a real company on staging, but it must never have been used before. eSim enquiry and submission rows must match what is keyed in (Company Name, Reg No, and a director whose IC is the Step 1 representative). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- A bought document is stored for 7 days and reused by a new STMS on the same number whatever eSim says afterwards. After a mismatch, seed a NEW company. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- The seed command alone is not enough. What eAuto compares is page1 of ssm-roc-submission-resp (<NAME>, <REF_NO>, <NEW_REF_NO>) and the page3 directors. Enquiry Roc = old number without '-A'. Submission REF_NO = {Roc}-A, NEW_REF_NO = {New Roc}, ROC_STATUS EXISTING. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Upload rules: up to 5MB, pdf/jpeg/png. Type of Business radios are unselected by default. LLP needs an Authorisation Letter. [mine: 02b-my-knowledge.md Module SSM] [jira: EAINT-4942 2024-11]

### QA scope to check
- Check the purchase pop-ups, price lines and RHB payment for STMS and eSTM. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [ts: EAINT-8802]
- Check each SSM type: ROB, ROC, LLP, with the matching eSim rows. [ts: EAINT-9247] [azfar: eauto-qa-azfar:01-azfar-repo.md Module SSM Document purchase]
- Check SSM Final Submission failure: message, [SSM Invoice] button, cronjob resubmit. [ts: EAINT-9247 TS31-TS32]
- Check reuse within 7 days across STMS and eSTM, and the duplicate-purchase popup. [azfar: eauto-qa-azfar:cr/EAINT-9247/LEDGER.md]
- Check BO SSM Transaction listing, SSM XML Log and the invoices (SSM Document, SSM Invoice, SSM e-Invoice). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- Check Payment Breakdown Report and Reconciliation include SSM, including a payment date different from the approved date. [ts: EAINT-12113] [jira: EAINT-12113 2026-08]
- Check SSM validation ignores Page 2 and Page 6 of the document (EAINT-12132). [jira: EAINT-12132 2026-08]

### Ticket history
- EAINT-5155 (2025-01): Company seller: SSM identity check at Step 4 and Purchase SSM. [latest]
- EAINT-9247 (2026-04): LLP added. Go-live 27.04.2026. [latest]
- EAINT-10691 (2026-04): SSM SST amount. [latest]
- EAINT-12132 (2026-08): SSM validation excludes Page 2 and Page 6. Done 07.08.2026. [latest]
- EAINT-12113 (2026-08): SSM data missing in Reconciliation Listing when payment date and approved date differ. [latest]
- EAINT-12121 (2026-10): FUTURE: remove 7-day lock, repurchase. Code Review. [latest]
- EAINT-12230 (2026-10): FUTURE: duplicate SSM purchase validation. Code Review. [latest]
- EAINT-8683 (2025-08): Data patch: enable SSM Permission for 24 companies. [latest]
- EAINT-8688 (2025-08): Data patch: untick Block STMS Category. [latest]

### Open questions
- EAINT-5155 'Pending confirmation from IT side' item #9: what if the SSM is paid but the transaction is not Approved within 7 days?
- Popup titles and prices differ between the SRD and the screen. Repo rule: use the screen wording.
- In EAINT-9247 TS13-16 are the 'Multiple UCDs' two users of one company or two companies?
- Ask eAuto Q15 (SSM document enquiry and purchase, prod code) has not arrived yet. A later pass adds it.

## Flow: SSM permissions and Bypass Purchase SSM (BO settings)
- Two BO settings decide what a company user must do at Step 2 and Step 4: the company SSM permission and the user's Bypass Purchase SSM.
- Portals: Back Office, UCD Portal

### Entry points and steps
- Entry point "BO Manage Company Accounts > Purchase SSM Document section": BO › Account Management › Manage Company Accounts › Create / Edit › 'Purchase SSM Document' [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [ts: EAINT-8802 BO_PERM_TS1]
  - Three boxes: ssmPermission (STMS - Company Category), estmSsmPermission (ESTM - Company Category), bypassPurchaseSsmPermission (Bypass Purchase SSM - User Category).
  1. Tick the company boxes | where: BO › Manage Company Accounts | Ticking the bypass box lists the company on BO › view/bypass-purchase-ssm/view.do. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Entry point "BO Settings > Bypass Purchase SSM": BO › Settings (Hub Admin) › Bypass Purchase SSM (view/bypass-purchase-ssm/view.do) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [mine: flow-bo-shell.md §3.10] [mine: 02b-my-knowledge.md Module SSM]
  1. Edit per-user ticks | where: BO › Bypass Purchase SSM › Edit (edit.do) | Each user has an stmsSsmBypass and an estmSsmBypass box. The page has Export Excel and an audit log. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [mine: 02b-my-knowledge.md Module SSM]
     - If Audit log search -> Log Date From and To are mandatory, max 30 days. Columns: #, Date, UCD Company Name, UCD User Full Name, By, Description (EAINT-9842).
- Entry point "UCD Step 2 uploads and Step 4 buttons": UCD › STMS / eSTM › Step 2 and Step 4 [ts: EAINT-8802 E2E_STMS_TS1-TS6] [mine: 02b-my-knowledge.md Module SSM]
  1. The permission matrix decides the path | where: UCD › Step 2 and Step 4 | See the rules below. A permission change mid-flow is re-evaluated at [Make Payment] or [Resubmit] on Step 4. If it changes mid-flow the popup 'Upload Seller Company Information' shows with [Update Document]. Make Payment is greyed until updated. [ts: EAINT-8802 SSMPERM_STMS_TS1-TS4] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### Cross-module effects (what it affects)
- UCD homepage still shows the SSM Document module. No SSM transaction is created when bypassed. SSM items are hidden in all steps. [ts: EAINT-8802 E2E_STMS_TS1]
- BO audit log and Excel export capture permission changes. [ts: EAINT-8802 BO_PERM_TS1] [jira: EAINT-9842 2026-06]
- Company Account audit log and remarks (see EAINT-6762) after data patches. [ts: EAINT-8688]

### Roles
- Bypass Purchase SSM page: Settings (Hub Admin); jasons, mfared, nikmuhamad, mfizni. The audit log is hidden from unauthorised BO users. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [mine: 02b-my-knowledge.md Module SSM]
- The SSM Permission setting is at company level only. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-5155]
- Main UCD, Sub UCD, and eSTM L1 and Approval users are covered by the permission matrix. [ts: EAINT-8802]

### Where the transaction goes
- Normal STMS or eSTM flow continues to Step 6 Approved. [ts: EAINT-8802]

### Rules
- Matrix (EAINT-8802, current): User Bypass ticked, with any company state: proceeds without buying SSM, uploads 3 documents. Company SSM ticked and user bypass not ticked: must buy SSM, uploads 1 document (Board Resolution or Authorisation Letter), [Purchase SSM] shows at Step 4. Neither ticked: no purchase, 3 documents. [ts: EAINT-8802 E2E_STMS_TS1-TS6] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [mine: 02b-my-knowledge.md Module SSM]
- 3 documents: Sdn Bhd or Bhd = SSM Company Profile + Company Board Resolution + Staff Employment Pass & MyKad. Sole Proprietorship or Partnership = SSM Business Profile + Authorisation Letter + Staff Employment Pass & MyKad. [ts: EAINT-8802] [jira: EAINT-4942 2024-11]
- Both the STMS and the ESTM company boxes must be ticked for Purchase SSM to be offered at STMS Step 4 (Azfar, 21.10.2026). Untick them afterwards. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- SSM Permission applies to STMS and eSTM company transactions only, not UCD to UCD. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### QA scope to check
- Run the matrix: company yes/no x user bypass yes/no x STMS/eSTM x company type x Main/Sub x web/mobile. [ts: EAINT-8802] [ts: EAINT-8526/8532 SSM_HM_TS1-TS8]
- Check permission revoked or granted while at Step 4, after a failed JPJ enquiry and resubmit. [ts: EAINT-8802 SSMPERM_STMS_TS2-TS4]
- Check existing transactions created before and after the deployment. [ts: EAINT-8802 Existing Transaction sheet]
- Check BO user permissions: who sees and ticks the bypass checkbox. Check the audit log and Excel export. [ts: EAINT-8802 BO_PERM_TS1] [jira: EAINT-9842 2026-06]
- Check the regression with bypass unticked. [ts: EAINT-8802]
- Check data-patched companies (SSM Permission on, Block STMS Category unticked) before and after, on staging and production. [ts: EAINT-8683] [ts: EAINT-8688]

### Ticket history
- EAINT-8802 (2026-01): Bypass Purchase SSM BO page. Current model. [latest]
- EAINT-8526 (2025-07): SSM hybrid model, company + user level. [legacy, superseded by EAINT-8802]
- EAINT-8532 (2025-07): SSM hybrid model (paired with 8526). [legacy, superseded by EAINT-8802]
- EAINT-8683 (2025-08): Data patch for 24 companies. [latest]
- EAINT-8688 (2025-08): Untick Block STMS Category for 24 companies. [latest]
- EAINT-8652: Data patch.
- EAINT-9842 (2026-06): Dedicated audit log for the bypass page. [latest]

### Open questions
- Which document pairing is current? EAINT-8526: Main UCD STMS uses Company Board Resolution, Sub UCD eSTM uses Authorisation Letter. EAINT-8802: the reverse. Confirm with the team.
- The user-level SSM permission under EAINT-8526 needed a dev patch (no UI in that TS).

## Flow: Verify the SSM document against the transaction
- After the document is bought, eAuto compares its company name, registration numbers and directors with what the seller typed at Step 1.
- Portals: UCD Portal, Back Office

### Entry points and steps
- Entry point "After Purchase SSM at Step 4": UCD › STMS Step 4 › [Purchase SSM] › [Next] / payment done [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison] [ts: EAINT-12022 T56, T65, T14]
  1. Compare Company Name and numbers | where: UCD › STMS › Step 4 | The system compares the SSM document's Company Name (and OLDNAME for ROC) with the Step 1 Company Name. The old name also counts as a match (TS3 PASS). The ROB variant is in T65. The director is matched on IC number only against the Step 1 seller. ROB must be ACTIVE and ROC must be EXISTING. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
     - If Match -> Popup 'SSM Document Verification - Verification successful: The seller representative's information matches the SSM document.' [OK]. Step 4 offers Make Payment.
     - If Company Name does not match -> Popup 'Verification failed: The seller representative's Business Registered Name does not match the SSM document.' Tx Status Cancelled. Remarks 'AUTO-CANCELLED BY eAuto on dd-mm-yyyy hh:mm'. Only [Create Again], which goes to Step 1 with Company Name and BRN pre-populated and not editable. The existing SSM document is reused. BO shows Cancelled By = System.
     - If Business Registration Number does not match -> Popup 'Verification failed: The seller representative's Business Registration Number does not match the SSM document.' Tx stays Pending. Save & Continue Later only. The SSM fee is already paid (EAINT-10119 SRD V1.2 §2.2.2 flow B).
  2. Resubmit after a purchase | where: UCD › STMS › Listing › Resubmit | Within 7 days of the purchase the transaction goes to Step 5. After 7 days it goes back to Step 4 to repurchase. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Entry point "Bulk Payment SSM check": UCD › STMS › Bulk Payment Submission (Company transactions) [jira: EAINT-12054 2026-08] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
  1. Re-check SSM per transaction | where: UCD › STMS › Bulk Payment Submission | With SSM bypass permission: all 3 required documents must be uploaded before payment. Without it: the Board Resolution or Authorisation Letter is uploaded and the existing SSM validation passes. Prod code: StmsBulkPaymentSsmValidationHandler marks an item SkippedSsm when the check fails at run time. [jira: EAINT-12054 SRD v1.2 2026-08] [jira: EAINT-12054 2026-08]

### Cross-module effects (what it affects)
- STMS and SSM Transaction Listing and Details (UCD + BO), SSM Document / Invoice / e-Invoice buttons. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison]
- A mismatch in Name sets the STMS to Cancelled. A mismatch in BRN leaves it Pending. [jira: EAINT-10119 2026-10] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### Roles
- UCD user. BO sees 'Cancelled By = System'. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison]

### Where the transaction goes
- Match: continue to payment and Approved. Mismatch: Cancelled with Create Again, or Pending with Save & Continue Later. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### Rules
- A UCD user's own IC is refused as the company representative. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Reg No format: QA597435 is rejected. 540323-T style and the 12-digit new BRN are accepted. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- [unconfirmed] The remark example in T14 says 'AUTO-CANCELLED BY system' while the format line says 'BY eAuto'. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison]

### QA scope to check
- Check name match, OLDNAME match, name mismatch and BRN mismatch for ROC and ROB. [ts: EAINT-12022 T56 SSMCOMPNAME_ROC_TS1-TS3] [ts: EAINT-12022 T65]
- Check Create Again pre-populates Step 1 and reuses the SSM document. [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison]
- Check the BO view shows Cancelled By = System. [ts: EAINT-12022 T14]
- Check the bulk-payment SSM check for a company transaction. [jira: EAINT-12054 2026-08]

### Ticket history
- EAINT-10119 (2026-10): Name and BRN mismatch handling. Done 05.10.2026, live S34.2-20261001. [latest]
- EAINT-12054 (2026-08): Bulk payment SSM check, SRD v1.2, Done 21.08.2026. [latest]
- EAINT-12132 (2026-08): Validation excludes Page 2 and Page 6. [latest]
- EAINT-12022 (2026-10): Board rows T14, T56, T65 cover the comparison (47 TS). [latest]
- EAINT-5155 (2025-01): Original identity check. [legacy, superseded by EAINT-10119]

### Open questions
- Is the remark 'AUTO-CANCELLED BY eAuto' or 'BY system'? The T14 example and format line differ.

## Additions from Charmain's QA repo — SSM in STMS bulk payment, EAINT-12054 (added 2026-10-27)
- Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (commit 0ab45d1), intake inventory of `by-ticket/eaint-12054-stms-bulk-payment`. **A colleague's test titles, not verified live by us.** Her SRD rules and build notes for 12054 are in `flow-stms.md` § "Additions from Charmain's QA repo"; not repeated here. Tag: `[charmain-repo: <path>:<line>]`.
- BO permission paths she sets up: "force purchase path (company STMS ON, bypass OFF)"; "bypass path (company STMS OFF, gate ON) — restore" [charmain-repo: intake/reports/charmain-12054.json:639-640]
  - Conflict: Glossary above says "Bypass Purchase SSM (user): BO user box (stmsSsmBypass / estmSsmBypass)". Her path treats company STMS OFF as the bypass path. Her notes (obs): company STMS permission off = every user treated as having bypass; the "Bypass Purchase SSM" gate only decides whether the company can be enrolled. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:284-288]
- Probe: "is the SSM bypass settable per user? (gate ticked, dumped, restored)" [charmain-repo: intake/reports/charmain-12054.json:729]
- "a blocked transaction pays after its SSM documents are purchased" [charmain-repo: intake/reports/charmain-12054.json:2217]
- "a permission change mid-session takes effect without re-login" [charmain-repo: intake/reports/charmain-12054.json:2317]
- "SSM Purchase verification error (ROB dummy director)" [charmain-repo: intake/reports/charmain-12054.json:1774]
- Data tools: `fresh-ssm-no` ("EVERY pool slot gets a unique, correctly shaped registration number"; "LLP varies BOTH the ROC and the New ROC, keeping both shapes"), `expire-ssm` ("expire SSM by refNo (login from .env)"), `set-esim-response` ("read / patch an eSim SSM response record"). [charmain-repo: intake/reports/charmain-12054.json:3482, 3540-3542, 3838]
