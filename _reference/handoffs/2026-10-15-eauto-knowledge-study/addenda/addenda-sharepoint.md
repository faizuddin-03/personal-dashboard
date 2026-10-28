# Addenda for existing knowledge files — from the SharePoint sweep (2026-10-16)

Facts found in the SharePoint CR test scenarios and the Notion export that belong in
existing knowledge files. Nothing below has been applied. Tag format as in
`knowledge/business-rules-from-test-scenarios.md`: `#NNN` is the catalogue number in
`knowledge/cr-test-scenario-catalogue.md` (Appendix A maps it to the file).

---

## knowledge/README.md

1. Add three index rows:
   1. `cr-test-scenario-catalogue.md` — one row per CR test-scenario workbook in the QA
      Team SharePoint library (140 workbooks, eAuto + Secarang/CIBO), grouped by module,
      with editor, date, sheets, environment named and key rules.
   2. `business-rules-from-test-scenarios.md` — module-by-module business rules,
      validations, messages, file formats and fees stated in those workbooks, with
      sheet/row provenance and a contradictions list.
   3. `qa-process-from-notion-export.md` — QA process facts from the QA Team Notion
      export (accounts, test emails, browsers, regression checklists, SIT).
2. Add tag forms to "The one rule": `[from SharePoint TS #NNN <ticket>, sheet <s>, row <n>]`
   and `[from Notion export, <page>]`.

## knowledge/cibo.md

1. Answers the open "is BoldPay a second live Secarang gateway" gap: before EAINT-12327,
   CIBO Payment Report showed "Bold Pay" for **Makrokiosk** transactions, "Fiuu" for
   Secarang on/after the cutoff, "RMS" before it, and "RHB" for eAuto.
   `[from SharePoint TS #129 EAINT-11541, sheet EAINT-11541, rows 3-10]`
2. CIBO role matrix after EAINT-9840 (Admin all modules; Admin Insurance = Dashboard,
   Transaction Management, Payment Report, Commission Report, Discount Code Management;
   Temporary Insurance Staff = same minus Discount Code Management; Ops Support =
   Dashboard + Transaction Management with Print & Export hidden).
   `[from SharePoint TS #138 EAINT-9840, sheet TS Post-Implementation, rows 2, 24, 34, 52, 54]`
3. Money columns: Service Tax = Gross Premium × 8%; stamp duty always RM10; discount codes
   EAUTOOFF10 10% (auto on eAuto), RJC7 7%, COTEAM 5%, SCW5 5%; eAuto commission 10%
   automatic; RJC7 sub-agent commission 3%; Total Direct Cost and Gross Profit formulas.
   `[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, rows 4-10]`
   `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, rows 10-13]`
4. Secarang receipt shows Discount + Total Amount only for codes MF / EAUTO / ER.
   `[from SharePoint TS #133 EAINT-8331, 8334 & 7199, sheet EAINT-8331, 8334 & 7199, rows 14, 17]`
5. Lonpac (Secarang) 14-day renewal grace after expiry.
   `[from SharePoint TS #137 EAINT-9062, sheet EAINT-9062, rows 2-3]`

## knowledge/flow-cibo.md

1. §4.3 export type: the EAINT-9979 script expects "Transaction_Management_YYMMDDHHmm.csv
   e.g: Transaction_Management_202605080846", i.e. a CSV — this settles the
   `[unconfirmed]` xlsx-vs-csv question for Transaction Management (still unverified
   live). `[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, row 2]`
2. The 40-column order in §4.3 matches the EAINT-9979 Reference sheet "NEW VER" column
   (Transaction Ref. No. … JPJ, Remark, Special Remark). `[from SharePoint TS #140 EAINT-9979, sheet Reference, rows 4-43]`
3. Older file name "Transaction_Management_ {YYYYMMDD}" (EAINT-8657, Oct 2025).
   `[from SharePoint TS #134 EAINT-8657 & 8956, sheet 8657 & 8956 (Latest), row 11]`
4. Payment Report export "Payment_Report_YYMMDDHHmm.csv".
   `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, row 2]`
5. Referred Risk Log export column order and formats (Inquiry Date "DD-MM-YYYY HH:MM"
   24h, Inquiry By "UCDID/userID"). `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 3; sheet Reference, meta rows 3-4]`

## knowledge/flow-jomcheck.md

1. Chassis-number search rules (EAINT-6475): radio default Vehicle Number; chassis keeps
   * / - and space, strips other specials and non-ASCII, uppercases, max 30; not-found
   texts; API-down text "Jomcheck API is temporarily unavailable now, please try again in
   10 minutes." → Tx Failed and no [Pay Now]. `[from SharePoint TS #050 EAINT-6475, sheet Functional TS, rows 7-22; sheet E2E TS, rows 8-22; sheet Regression TS, row 8]`
2. BO JomCheck Report Listing (EAINT-8638) is exact-match ("Partial Vehicle Number |
   Result will display unmatched"); "0 record(s) in total" and header-only CSV on no
   match. `[from SharePoint TS #073 EAINT-8638, sheet SnF Fields & Results, row 26; sheet E2E, row 10]`
3. Resubmit visibility (EAINT-9203 v2): Payment OK + Tx Failed → UCD hidden, BO shown;
   otherwise hidden on both. v1 conflicts for Payment Failed + Tx Failed.
   `[from SharePoint TS #093 EAINT-9203, sheet 9203 TS v2 (May), rows 8-15; sheet 9203 TS v1 (Zuhaira), row 12]`
4. Maintenance popup and Pending state (EAINT-9786).
   `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, row 4]`
5. Sharing window text "until {date d30 > dd-mm-yyyy}" (30 days) and section hidden when
   no credit company is configured. `[from SharePoint TS #010 EAINT-10937, sheet E2E, rows 15, 18]`
6. Credit-company API (EAINT-11757): RS256 · RSA-3072 keys; key states Active →
   Expiring → Revoked; audit COMPANY_CREATED / CREDENTIAL_ISSUED; generic 401 for all
   auth failures; documentUrl + documentUrlExpiresAt, PDF not in JSON.
   `[from SharePoint TS #016 EAINT-11757, sheet Sheet1, rows 7-15]`
7. BO "Payment To" date picker: default today, no future, max 30 days.
   `[from SharePoint TS #043 EAINT-1245, sheet Sheet1, rows 3-7]`

## knowledge/flow-ucd-shell.md

1. **Possible conflict with the recorded `dialogSelectorOrder`** (profile-updates before
   cny and raya): the CNY, Hari Raya and East Coast scripts expect the campaign popup
   before Company Profile Update (`#100 EAINT-9559, sheet EAINT-9559, row 9`;
   `#101 EAINT-9560, sheet EAINT-9560, row 14`; `#102 EAINT-9564, sheet Popup display, row 11`).
   Ask whether the order changes per campaign before editing.
2. Campaign popup behaviour the scripts test: English first, 7-second English↔Chinese
   switch, shown once per login, not on return to Homepage or Insurance.
   `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, rows 4, 6]` `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, rows 4, 8-9]`
3. East Coast popup: East Coast HQ/branch only, gone on day 31.
   `[from SharePoint TS #102 EAINT-9564, sheet Popup display, rows 4-14]`
4. Firefox → Chrome announcement (EAINT-12180): Firefox only, every login, title
   "Announcement 公告", Firefox support ends 31 December 2026.
   `[from SharePoint TS #036 EAINT-12180, sheet Scenario Testing, rows 3, 9, 17; sheet Functional Testing, rows 6-7]`
5. Transaction Restriction popup on create: "You are currently restricted from creating
   transactions. Please contact eAuto at 03-27798899."
   `[from SharePoint TS #089 EAINT-9044, sheet E2E Scenarios - eSTM, row 2]`

## knowledge/eauto-insurance.md

1. Generic quote-sequence rules: top 2 providers; "Quotation retrieved on: DD/MM/YYYY,
   HH:MMam/pm"; order stable through postcode/variant/back/sum-insured changes.
   `[from SharePoint TS #060 EAINT-8467, sheet Insurance Sequence TS, rows 4-9]`
2. Takaful Comprehensive + TPFT count as one insurer in "top 2".
   `[from SharePoint TS #110 EAINT-9713, sheet Get Free Quote Sequence TS, meta row 2]`
3. X-Star has no specific sequence; East Coast UCDs have their own sequence; company
   category quotes Chubb (and Takaful) only.
   `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, rows 9-14]`
4. Islamic hire purchase triggers its own sequence; HP name list in the workbook.
   `[from SharePoint TS #069 EAINT-8595, sheet Insurance Sequence TS, meta row 2; sheet Islamic Hire Purchase]`
5. Sum-insured price range: Chubb 90–140% (≤10 yrs, no X-Star), 90–170% (X-Star ≤15 yrs),
   pre-CR 110%; Lonpac X-Star up to 150%, Lonpac min rounded up to nearest 1,000; RM10,000
   floor hides the quotation; RM80,000 cap for non-X-Star HP on Get Free Quote; over-age
   → uneditable sum insured. `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, rows 6, 18-20, 29, 33; sheet Regression Testing, row 16]` `[from SharePoint TS #009 EAINT-10435, sheet New Trxns (Scoped Down TS), row 6; sheet Existing Transactions, row 5]`
6. Chubb TIN mandatory after eSTM approval, optional on Get Free Quote, hidden on the
   VEL000069E path. `[from SharePoint TS #108 EAINT-9641, sheet Sheet1, rows 3-6]`
7. Price re-check popup "Price has changed. Click OK to reload and view the updated
   pricing"; policy start = payment date.
   `[from SharePoint TS #105 EAINT-9611, sheet Gross Premium change TS - eSIM, row 5; sheet Date Change TS - Insurance API, row 4]`
8. Referred-risk WhatsApp video and monthly commission notification rules (see
   business-rules §6.5).

## knowledge/flow-insurance-purchase.md

1. Insurance receipt: new [Receipt] button, file Receipt_VehicleNo.pdf; older
   transactions keep [Insurance Invoice] / Invoice.pdf; receipt number OR-{MMYY}-{0001}.
   `[from SharePoint TS #051 EAINT-6673, sheet E2E TS, rows 4, 12]` `[from SharePoint TS #125 EAINT-6673 [OUTDATED], sheet Official Receipt, rows 10-12]`
2. Hire purchase fields on details and e-Cert (User Submission / Returned by JPJ / HIRE
   PURCHASE OWNERS; CIBO Claimed by). `[from SharePoint TS #107 EAINT-9617, sheet E2E Scenarios, rows 3-6]`
3. Selected sum insured and premium must match on Step 4, UCD and BO listings, BO CSV,
   CIBO listing and Service Portal Insurance tab — a ready cross-surface check list.
   `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 13]`

## knowledge/flow-estm.md

1. Sub UCD eLKM cap RM2,000.00 per transaction and its message; Main UCD uncapped.
   `[from SharePoint TS #064 EAINT-8534, sheet WEB, rows 8-13]`
2. Butir-butir Hak Milik table columns after EAINT-4328; Slip Pengesahan TEMPOH SAH table
   only with eLKM; date-based old formats. `[from SharePoint TS #047 EAINT-4328, sheet Test Scenario, rows 3, 17; sheet Slip Pengesahan, rows 2-7]`
3. Hak Milik cronjob failure link + "Upload failed. Please retry."; Service Portal "Hak
   Milik = J" (cronjob, eSIM STMS Enquiry 4K) vs "E" (bought in eSTM).
   `[from SharePoint TS #062 EAINT-8523, sheet Sheet1, rows 4-6]` `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow, rows 3, 13]`
4. BO JPJ Enquiry (New) XML tail LKM Indicator ~ Duration ~ eVOC Indicator.
   `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, rows 10-13]`

## knowledge/esim.md

1. Insurance prefixes used by QA: VB → cover note submission failed; VF → JPJ signal
   rejected. `[from SharePoint TS #065 EAINT-8536, sheet EAINT-8536, rows 9-13]`
2. eDereg vehicle numbers: GLB000000I success, VEL000100E failed, ENF000013E cancelled,
   VEL000102E final submission failed. `[from SharePoint TS #075 EAINT-8655 & 9043, sheet E2E Flow, rows 3-9]`
3. STMS Enquiry response code 4K is set to make the Hak Milik cronjob buy the document
   from JPJ. `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow, row 3]`
4. EAINT-12403 used QA-specific prefixes per scenario (e.g. one prefix with RHB Transfer
   IF to force a failed payment, switched to OK after the BO reset).
   `[from SharePoint TS #042 EAINT-12403, sheet APT, rows 20-23]`
5. Notion: "remember to connect to VPN first" before opening the e-simulator.
   `[from Notion export, QA Home/eAuto Secarang Test Environment URL & Account Creation.pdf]`

## knowledge/eauto-payments.md

1. RHB failed-payment remark for insufficient funds: "IF - Wang di dalam akaun RHB anda
   TIDAK MENCUKUPI…". `[from SharePoint TS #042 EAINT-12403, sheet APT, row 20]`
2. RHB maintenance window error "NP - Sistem Pembayaran RHB dibawah penyelengaraan antara
   10.30mlm - 8.30pg." `[from SharePoint TS #092 EAINT-9141, sheet UI Change (Insurance Quotation), row 20]`
3. RHB statement references: Ref 1 "{TransactionNo}-{VehicleNo}", Ref 2
   "{TransactionNo}/{STMS|JCK|OTH|DPC}", description "ETUKARMILIK CR".
   `[from SharePoint TS #123 RHB 25.06.2026 2, sheet Bank Statement, rows 7-14]`
4. BO payment reset and APT resubmit cronjob rules (business-rules §1.2, §2.6).

## knowledge/flow-edereg.md

1. eDereg Pre-Checking e-Invoice/Invoice outcomes by TIN and payment, remark text for
   invalid TIN, LHDN resubmission cronjob. `[from SharePoint TS #075 EAINT-8655 & 9043, sheet E2E Flow, rows 3-13]`
2. AATF Payment Report types and export name. `[from SharePoint TS #111 EAINT-9715, sheet Filter, rows 4-12]`
3. AATF thumbprint pages (Step 1 owner MyKad, Step 3 login user MyKad, COD Step 1).
   `[from SharePoint TS #121 List of Modules and Pages that requires Thumbprint (UCD & AATF), sheet AATF, rows 3-15]`
4. Email for testing: Dereg cannot use @modefair.com because JPJ sends the email after
   payment. `[from Notion export, QA Home/Email for Testing.pdf]`

## knowledge/flow-ucd-onboarding.md

1. Type of Business options and BRN / Business Trading License fields; TIN mismatch
   warning. `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-5972, rows 3-23]`
2. UCD Group values Corporate, Association, Authorised Dealer, UCD, Motor, Recon; BO
   listing column position. `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-10164, rows 5, 20]`
3. Application expiry cronjob outcomes per status (Expired email; Rejected/Approved
   untouched). `[from SharePoint TS #014 EAINT-11536, sheet EAINT-11829, rows 3-14]`
4. Approved Date / TAT columns and format. `[from SharePoint TS #014 EAINT-11536, sheet EAINT-11536, rows 4-20]`
5. Showroom edit rules (no "No Showroom" for UCD; locked at Pending Approver); Save >
   Activate only. `[from SharePoint TS #027 EAINT-11978, sheet Test Script, rows 2-9]` `[from SharePoint TS #028 EAINT-11979, sheet Test Script, row 2]`
6. Approval emails after EAINT-12341 (two emails, Template 1/2, RHB Support appointment
   letter, subjects). `[from SharePoint TS #041 EAINT-12341, sheet Sheet1, rows 13-36]`
7. RHB Offer Letter sample file names by business type.
   `[from SharePoint TS #037 EAINT-12219, sheet Test Scenarios, rows 2-3]`

## knowledge/flow-bo-shell.md

1. Transaction Restriction radio (below Block STMS Category, default No) and listing
   filter (All/Yes/No). `[from SharePoint TS #089 EAINT-9044, sheet (FT) BO Update Company Account, rows 3, 11; sheet (SnF) BO Manage Company Account, rows 3-4]`
2. [Reset] in STMS/eSTM listing Action column next to [View] and [Cancel] for Failed
   payments. `[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, row 7]` `[from SharePoint TS #042 EAINT-12403, sheet APT, row 56]`
3. Company audit log entry format "[Field] Old: X New: Y". `[from SharePoint TS #052 EAINT-6762, sheet Company Account Audit Log, rows 10-30]`
4. Company account field validation messages (postcode, mailing address, director
   name/email). `[from SharePoint TS #083 EAINT-8774, sheet Sheet1, rows 4-11]`
5. Super Admin vs Hub Admin menu matrix. `[from SharePoint TS #003 EAINT-10038, sheet access ref, rows 3-32]`
6. Bank/Credit Company account checkboxes and defaults (EAINT-11175).
   `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, rows 4-6]`

## knowledge/eauto-portals.md

1. Browser priority (Notion): UCD/AATF Firefox; BO/JPJ Chrome then Firefox — to be
   superseded by Chrome-only from 1 January 2027 (EAINT-12180).
   `[from Notion export, QA Home/eAuto - Web Browser Testing Priority.pdf]`
2. Test account creation steps for UCD, BO user, AATF (real IC for director, Group = C4,
   Pay on behalf, Role = HubAdmin). `[from Notion export, QA Home/eAuto Secarang Test Environment URL & Account Creation.pdf]`
3. Production test-account process via MJ. `[from Notion export, QA Home/Production Account Creation.pdf]`

## knowledge/mailtrap.md

1. Which modules send to Mailtrap (BMK, eVOC, JomCheck OTP/WhatsApp) and which to the
   real address (Dereg, insurance); no disposable emails; no @modefair.com when staging
   points at JPJ or RHB staging. `[from Notion export, QA Home/Email for Testing.pdf]`

## knowledge/test-scripts.md

1. The team's blank template `[TEMPLATE] EAINT-XXXX - XXXX.xlsx` and most 2025 scripts
   open with three header rows "Ticket(s):", "Test environment:", "Test objective:" and
   use columns TS No / Priority / Test Objective / Entry Point / Pre-Requisite / Test
   Scenarios / Expected Result / QA / Test Result / Remarks. `[from SharePoint TS #126 [TEMPLATE] EAINT-XXXX, sheet EAINT-8652, meta rows 1-5]` `[from SharePoint TS #068 EAINT-8564, sheet EAINT-8564, rows 1-7]`
2. Bigger 2026 scripts add an "Overall Progress" / "Progress Tracker" sheet with
   auto-counted Pass/Fail/Pending per sheet, and sometimes a "Configuration" sheet with
   environment and accounts. `[from SharePoint TS #010 EAINT-10937, sheet Progress Tracker]` `[from SharePoint TS #036 EAINT-12180, sheet Overall Progress]`
3. Fee-change CRs mark rows whose test data "MUST be created BEFORE Dev pushes the new
   price". `[from SharePoint TS #042 EAINT-12403, sheet APT, row 8]`
4. Where the team's past CR scripts live: SharePoint `1. eAuto Project/eAuto - CR Test
   Scenarios/` and `2. Secarang & CIBO Project/Enhancement CR Test Scenario/`; local
   copies under `_reference/sharepoint/`; index `knowledge/cr-test-scenario-catalogue.md`.

## knowledge/releases.md

1. Production deployment history from the folder names in `eAuto - Test Evidence/3.
   Production Regression/` (96 folders, 2025-05-19 → 2026-10-14) — see
   business-rules §17 for the list source. Notable: "20260331 - 31st Mar 2026 (Add RM5
   STMS & UTU)", "20260630 - … (MacroKiosk + Recon + Adhoc)", "20261001 - LKM Refund +
   STMS APT Increase Service Charge". `[from SharePoint library listing 2026-10-16]`

## knowledge/quirks.md

1. `EAINT-8606.xlsx` in the CR folder contains the EAINT-8534 script.
   `[from SharePoint TS #070 EAINT-8606, sheet WEB, meta row 1]`
2. The EAINT-9900 Referred Risk Log script names the export "Payment_Report_…csv",
   probably a copy error. `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 2]`
3. Some workbooks (EAINT-10937, EAINT-12180 Configuration sheets; EAINT-9840 role sheets)
   contain live-looking test credentials in plain text — do not copy them into the repo.

## knowledge/cr-ledger.md

1. Many CRs in the ledger now have a SharePoint script catalogued — add a pointer line
   "SharePoint script: catalogue #NNN" to each matching entry (#021 EAINT-11864, #031
   EAINT-12107, #034 EAINT-12151, #035 EAINT-12153, #038 EAINT-12257, #040 EAINT-12339,
   #098 EAINT-9306, #130 EAINT-11934, #131 EAINT-12058).
2. New CRs with durable rules but no ledger entry: EAINT-12289, EAINT-12403 (fees),
   EAINT-12341 (approval emails), EAINT-12180 (Chrome migration popup), EAINT-12055 /
   10168 (reconciliation), EAINT-11757 (JomCheck API). Their rules are in
   business-rules-from-test-scenarios.md.
