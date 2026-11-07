# Master Regression Checklist — eAuto Staging/SIT2 (Web Socket run, 2025)

Study of the team's Google Sheet **"🧪Regression Checklist | eAuto | Staging/SIT2 |
20251217 (Web Socket)"**, read 2026-11-06 via Claude in Chrome, read only — nothing was
changed in the sheet.

1. Link: `https://docs.google.com/spreadsheets/d/1aOcpN9L6_bgHURvO5DXKs1GZ5t9H2V_ABccbsw1Qp7Y/edit`
   (opened on gid `88167614` = PROGRESS TRACKING).
2. Source tag used below: `[reg-sheet <tab>, read 2026-11-06]`.
3. Related: [qa-process-from-notion-export.md](qa-process-from-notion-export.md) §5 (where
   this checklist sits among the team's master checklists),
   [production-regression-scope.md](production-regression-scope.md) (prod side, different
   workbook), [flow-mobile-app.md](flow-mobile-app.md) (APP tabs).
4. No local copy kept. Raw rows were read in the browser only; re-open the link to re-check
   a row.

## 1. What this run was

1. Environment cell: `https://staging.eauto.my/sit2/public/login/`. `[reg-sheet PROGRESS TRACKING, row 2]`
2. Test Date cell, verbatim: "26th Sept - ?". `[same, row 3]`
3. Test Result cell links a QA Team SharePoint folder (`modefair.sharepoint.com/:f:/s/QATeam/...`). The same link heads every module tab as "Regression Test Result:". `[same, row 4; every module tab row 1]`
4. Purpose, from the title and the PROGRESS "REGRESSION WEB SOCKET" block: regression for
   the Firefox/Java-applet → Chrome + Web Socket (Dermalog) move. Every module got a
   "Thumbprint Related Test Scenarios" block for this. `[reg-sheet PROGRESS TRACKING rows 55-82; CHANGE LOG #235-#255]`
5. Weekly targets for the Web Socket regression, verbatim: 24/10/2025 – 25%, 31/10/2025 –
   50%, 7/11/2025 – 75%, 14/11/2025 – 100%. A second table sets Wed/Fri targets from
   22/10/2025 (15%) to 21/11/2025 (100%). `[reg-sheet PROGRESS TRACKING rows 56-68]`
6. Latest dates seen in "Tested On": 17/12/25 (LPUCDAATFREG_TS1, User Guide/Download
   rows). The run was still being worked in December 2025. `[reg-sheet LOGIN & HOMEPAGE row 4; UCD - USER GUIDE tab]`

## 2. Final counts (PROGRESS TRACKING)

1. Grand total, verbatim row: "Total Count per Status|0|0|0|820|2998|3818|3620|129|Total
   Completion|100.00%" — columns Not Started | In Progress | Failed | Pass | N/A | Total |
   Manual | Automation. `[reg-sheet PROGRESS TRACKING row 51]`
2. So: **3,818 TS, 820 Pass, 2,998 N/A, 0 Failed**. "100%" means every row has a status,
   not that every row was run. Most rows were marked N/A (not in this run's scope).
3. Per-module highlights (Pass / N/A / Total):
   1. UCD: Login & Homepage 19/26/45, STMS 152/396/548, eSTM 194/974/1168, UCD-UCD
      59/56/115, APT 5/10/15, Insurance 78/130/208, JomCheck 6/14/20, BMK 75/62/137, Pre
      e-Invoice 62/20/82, Reports 8/0/8, Settings 22/0/22, Cron Job 0/14/14.
   2. APP UCD: Login 0/25, STMS 0/219, eSTM 0/365 — **mobile app not run at all**.
   3. AATF: Login 25/0, Dereg 87/4/91, eDereg Pre-Checking 10/4/14.
   4. Backoffice: every BO tab 0 Pass, all N/A (Onboarding alone is 512 rows).
   5. JPJ Hasil 7, JPJ Dereg 3, Bintang Prospek 10 — all N/A.
   `[reg-sheet PROGRESS TRACKING rows 7-50]`
4. Web Socket sub-total: "Total Count per Status|0|0|0|810|810|100.00%" (UCD + AATF Pass
   rows only). `[same, row 82]`
5. Count note, verbatim: "Total Manual + Automation not necessarily tally with Total Count
   because: - All status formula on the left include counts from both Manual & Auto Status,
   but some TS may test with Manual / Automation only ... - However, Manual + Auto count
   should tally with Not Started count". `[same, row 54]`

## 3. Automation status

1. "AUTOMATION SCRIPT OVERALL PROGRESS" total, verbatim: "Total Count per Status|3543|0|130|3673|Total Completion|3.54%"
   (Not Ready | Script In Progress | Script Ready | Total). `[reg-sheet PROGRESS TRACKING row 134]`
2. Script Ready exists only for: UCD STMS 9, UCD eSTM 89, BO Onboarding 32. Everything else 0. `[same, rows 92-133]`
3. TABLE OF CONTENT "Automation Status" column: "Script Not Ready" on almost every row;
   STMS and eSTM say "Not Started"; BO Onboarding "Not Started". `[reg-sheet TABLE OF CONTENT]`
4. The same column carries names plus "Java 7"/"Java 8" next to some modules (e.g. JOMCHECK
   "Charmain 0 Java 7", BMK "Azila 0 Java 8"). Meaning not stated. `[unconfirmed]` — reads like
   a per-QA browser/Java split for an earlier run.
5. Status dropdowns: Manual result = Pass / Failed / N/A / Not Started / Testing In
   Progress; Automation result adds Script In Progress / Not Ready. `[reg-sheet PROGRESS TRACKING rows 83-98]`
6. Change-log banner, verbatim: "PLEASE REMEMBER TO NOTIFY AUTOMATION TEAM FOR ANY TS ADDED / REMOVED / AMENDED". `[reg-sheet CHANGE LOG row 1]`

## 4. Workbook structure

1. Visible tabs (35): Deployed JIRA Tickets (Jan - July 25), PROGRESS TRACKING, TABLE OF
   CONTENT & REGRESSION SCOPE, CHANGE LOG - ADD/REMOVE SCENARIO, then one tab per module:
   UCD, APP, AATF & BO - LOGIN & HOMEPAGE; UCD - STMS / eSTM / UCD to UCD / BMK / APT /
   INSURANCE / JOMCHECK / PRE E-INVOICE / REPORTS / SETTINGS / CRON JOB / USER
   GUIDE,DOWNLOAD,CONTACT US; APP - STMS / eSTM; AATF - DEREG; BO - ACCOUNT MANAGEMENT /
   REPORTS / INSURANCE / PRE E-INVOICE / ONBOARDING / TRANSACTION RELEVANT / EAUTO PLUS /
   SUPPORT TOOLS / PROFORMA INVOICE / E-INVOICE / SETTINGS / SETTINGS (HUB ADMIN) / JPJ
   REPORTS; JPJ HASIL; JPJ DEREG; BINTANG PROSPEK.
2. Hidden/old tabs: "0[DONE] Deployed JIRA Tickets (Mar - Sept)", "0[DONE] Deployed JIRA
   Tickets (Oct - Dec 24)", "0[OLD] UCD - STMS", "0[OLD] UCD - eSTM". Not read.
3. Module tab columns, verbatim: "TS No.|Priority|User|Module|Scenarios|Regression
   Coverage|Tested On (Date)|Tested By (QA)|Execute By|Test Result (Manual)|Test Result
   (Auto)|Remarks". Some tabs say "No." instead of "TS No."; LOGIN swaps Tested By/On.
4. Rows are grouped under section-title rows (e.g. "Thumbprint Related Test Scenarios",
   "E2E Flow", "LHDN Negative Scenarios", "Existing Transaction - Created Before e-Invoice
   Deployment").
5. Priority P1-P4 per module in TABLE OF CONTENT. P1: UCD Login, STMS, eSTM, UCD-UCD, APT,
   Pre e-Invoice, BO Login, plus key BO pages (Manage Company Accounts, AATF/PBT account,
   e-Invoice setup listing, SST/GST reports, STMS/APT/eSTM/SSM transactions, Audit Trail,
   JPJ Hasil Audit Log, JPJ Enquiry (New), Resubmit JPJ Final Submission STMS/eSTM, Generate
   Proforma Invoice, RHB Payment Transaction, JPJ XML Log APT/STMS/ESTM, JPJ reports, JPJ
   Hasil reports). P4: BO Insurance Endorsement and old JPJ Enquiry. `[reg-sheet TABLE OF CONTENT]`
6. Regression Scope ✔/✗ per module: ✔ for UCD and AATF modules (except Cron Job, AATF
   User Guide, Dereg & Settings), ✔ for "LISTING SEARCH & FILTER". **✗ for every APP and
   every Backoffice/JPJ/Bintang row** — matches the all-N/A counts. `[same]`
7. Scope remark pattern, verbatim: "✔ - E2E UI & Thumbprint related TS" / "✔ - UI related TS". `[same]`

## 5. TS ID scheme (find a row by prefix)

| Prefix | Tab / area |
|---|---|
| `LPUCDAATFREG_`, `LLUCDREG_`, `LLAATFREG_`, `LLBOREG_`, `LLAPPREG_` | Login page / login-logout per portal |
| `LLUCD_THUMBP_`, `LLAATF_THUMBP_` | First-time account activation with thumbprint |
| `HPUCDREG_`, `HPAATFREG_`, `HPAPPREG_`, `FIAPPREG_` | Homepage / app homepage, force update, functional |
| `4915_`, `RT_`, `PT_` | Announcement popup content (EAINT-4915), by role and by permission |
| `STMS_MD_`, `STMS_THUMBP_`, `STMSUCDREG_*`, `STMSROC_`, `4332_`, `5431_` | UCD STMS |
| `eSTM_MD_`, `eSTM_THUMBP_`, `eSTMUCDREG_*` | UCD eSTM |
| `UCD2UCD_*`, `UCD2UCDREG_*`, `UCD2UCDROC_`, `5431_UCD2UCD_` | UCD to UCD |
| `APTUCDREG_*` | APT |
| `INSUCD_*`, `INSUCDREG_`, `5776_`/`5816_`/`5817_` (Chubb), `4932_` (Tokio Marine motorbike), `UPDATECODE_` (Lonpac), `UNHIDERHB_` (RHB) | UCD Insurance |
| `JOM_MD_`, `JOMUCDREG_*` | JomCheck |
| `BMK_*`, `BMKUCDREG_`, `BMKPERM_`, `BMKROC_`, `BMKHOME_`, `BMKPOPUP_` | BMK |
| `SSMPE_*`, `SSMPEUCDREG_*` | Pre e-Invoice (SSM / Company Profile) |
| `RPTUCDREG_`, `SUCDREG_`, `SUCD_THUMBP_`, `CJUCDREG_`, `UGUCDREG_`/`DWUCDREG_`/`CUUCDREG_` | UCD Reports, Settings, Cron, Guide/Download/Contact |
| `STMSAPPREG_*`, `eSTMAPPREG_*` | Mobile app STMS / eSTM |
| `AATFDRG_*`, `AATFDRGREG_`, `AATFDRGPRECHK_*`, `DWAATFREG_` | AATF Dereg + eDereg Pre-Checking |
| `AMBOREG_`, `TVH_REG_`, `RPTBOREG_`, `INSBOREG_`, `SSMPE_PERMBO_`, `ONBOREG_`/`ONBOLTREG_`/`NEWOBWIZREG_`/`ONBO_7064_`, `TRBOREG_`, `EAPBOREG_`, `STBOREG_`, `PFBOREG_`/`PFBO_NEG_`, `SBOREG_`, `SHABOREG_`, `JPJRBOREG_` | Backoffice tabs |
| `JPJHSLREG_`, `JPJDRGREG_`, `BPREG_` | JPJ Hasil, JPJ Dereg, Bintang Prospek portals |

## 6. Thumbprint (Web Socket) scenario pattern

1. Every thumbprint flow repeats one 9-outcome block. Verbatim outcome labels from LOGIN:
   "Thumbprint Successful", "Not connected to Dermalog", "Insert MyKad error", "MyKad
   verification failed", "Thumbprint verification failed", "Connection lost", "Cancel
   transaction", "Unable to read photo", "Dermalog \"Update Required\" error message". `[reg-sheet LOGIN & HOMEPAGE LLUCD_THUMBP_TS1-TS9]`
2. How to force two of them, verbatim remarks:
   1. Unable to read photo: "1. Click [Read MyKad] / 2. While MyKad reading, pull out MyKad".
   2. Update Required: "1. End Web Socket via Task Manager / 2. Verify error message popup".
   `[same, TS8 and TS9 remarks; repeated in every module tab]`
3. Wrong-director check, verbatim: "1. Change Director's IC No / 2. At Step 3 will hit error
   \"Please use Login User's MyKad\"" (STMS, eSTM, UCD-UCD, BMK, Dereg). Pre e-Invoice
   wording differs: "Please use Main User's MyKad". `[STMS_THUMBP_TS19 etc.; SSMPE_THUMBP_TS10]`
4. Thumbprint counts per tab: STMS 57, eSTM 111, UCD-UCD 38, Insurance 45, BMK 58, Pre
   e-Invoice 40, Settings 18, AATF Dereg 78, UCD login 9, AATF login 18. All Pass, almost
   all by Nadhirah (some Nabila, Azfar). `[section summaries per tab]`
5. Insurance thumbprint flows: Director verification to accept the Insurance Commercial
   Agreement, to add / remove / inactivate an insurance user, and the Sub-user Insurance User
   Activation page. Pre e-Invoice flows: Company/Business Profile update for ROB, ROC,
   Trading License, LLP. Settings: Add New User Account (Main and Sub). `[UCD - INSURANCE, UCD - PRE E-INVOICE, UCD - SETTINGS]`
6. Observed defect noted against LLUCD_THUMBP_TS4 / LLAATF_THUMBP_TS4 / TS13 (Nabila, 26/9/2025),
   verbatim extract: "Placed the wrong thumbprint immediately, without waiting for the MyKad
   details to populate. Result: Despite the thumbprint failure, the MyKad details were
   successfully read." ... "Although the thumbprint was successful, the MyKad details were not
   displayed." ... "the same steps were tested in STMS and eSTM modules. Result: The
   transaction was able to proceed even when the MyKad details were empty." Row status still
   PASS. Feeds [mykad-emulator.md](mykad-emulator.md) and [flow-platform.md](flow-platform.md).

## 7. Facts stated in Remarks (durable, verbatim)

1. Cron schedules (UCD - CRON JOB, all marked N/A):
   1. stmsJpjSubmissionTrigger "*Disabled in Staging" — "Run cron job every Hour (sent between 0900 - 2300 except 1400)".
   2. aptJpjSubmissionTrigger1 "Sent Daily on 08.30 AM"; aptJpjSubmissionTrigger2 "Sent Daily on 17.50 PM" (both disabled in staging).
   3. JpjExpiryNotificationTrigger, JpjPermanentTransferTrigger: "*Disabled in Staging. To trigger, please provide vehicleNo and company id to dev".
   4. ReconciliationTask: disabled; needs "vehicleNo, company roc no, and EFT numbe[r]" to trigger.
   5. estmJpjSubmissionTrigger disabled — "Sent Hourly between 0820 – 2320".
   6. batchDocumentJob disabled.
   7. Enabled in staging: InterstateExpiredTrigger "Daily 2.30am"; DeregTransactionExpired, STMS Housekeeping, eSTM Housekeeping "Daily 2am"; eDereg Pre-Checking Cronjob "Daily 12.30am".
   `[reg-sheet UCD - CRON JOB CJUCDREG_TS1-TS14]`
2. Insurance cron jobs: InsuranceQuotationExpired "*Enabled in staging daily 2am";
   InsuranceEnquiryJpjStatusJob "every 2min / 9 am - 11.59 pm"; InsuranceResubmitCoverNote
   "every 30 min / 9am -11.59 pm"; InsuranceResubmitReferredCase "5min / 9am-11.59 pm";
   InsuranceDownloadECertificate was disabled under EAINT-4921 then "Cron job enabled again,
   thus system will trigger ecert email & policy for both RHB & Chubb". `[reg-sheet UCD - INSURANCE INSUCDREG_TS55-TS60]`
3. Insurance remarks, verbatim:
   1. "RHB disabled on staging and prod" (East Malaysia postcode refer-risk case). `[INSUCDREG_TS27]`
   2. "No save & conitnue later button". `[INSUCDREG_TS35]`
   3. "Cant download e-cert in staging". `[INSUCDREG_TS47]`
   4. "Current behavior in PROD: If the VN does not reach 4K, the HP field is not mandatory. However, once it hits 4K, the HP field becomes mandatory." `[INSUCDREG_TS50]`
   5. "Chubb will now generate e-cert and insurance policy". `[INSUCDREG_TS7-TS8]`
   6. NCD test data: "QS7352T -> 981225155072". `[INSUCDREG_TS23]`
   7. eSTM + insurance: "Checked with dev, there is no handling to check for existing insurance when landing on Step 1. System only has checking on Insurance Step 3 during payment". `[reg-sheet UCD - eSTM eSTMUCDREG_E2E_TS236]`
   8. BO Endorsement: "As confirmed with MJ, this module is not in use anymore". `[reg-sheet BO - INSURANCE INSBOREG_TS3]`
4. Insurance flows listed in the checklist (entry points to cover): Get a Free Quote flow,
   VEL000069E (eLKM code) Step 4 to 5 flow, After eSTM Approved flow, eSTM Details page >
   Insurance Banner flow; insurers RHB, Takaful Malaysia, TPFT, Chubb, Lonpac, Tokio Marine.
   `[INSUCDREG_TS1-TS13, TS71-TS74]` — compare [flow-insurance-purchase.md](flow-insurance-purchase.md), [flow-quotation-reminder.md](flow-quotation-reminder.md).
5. JomCheck OTP mobile rules tested: prefix 01, prefix 601, length 9-11 digits, other
   prefixes rejected; "Note: Ensure OTP is regressed" (Sub UCD purchase). `[reg-sheet UCD - JOMCHECK]`
6. UCD Reports: "Download Payment Document" needs "dev help to generate the download document". `[RPTUCDREG_TS3]`
7. BO Support Tools: Resubmit JPJ Final Submission STMS/eSTM/eAuto Plus carry "EAINT-4510 -
   existing issue" (STMS also "EAINT-3979 - existing issue"). TOC: Resubmit JPJ Final
   Submission (eAuto Plus) "Note: Only IT Team has access". `[reg-sheet BO - SUPPORT TOOLS STBOREG_TS19-TS21; TABLE OF CONTENT #106]`
8. BO Pre e-Invoice permission rows name staging BO accounts for role checks: "mfadminstaging / mfprobstaging / mfhubstaging" (Admin / Probation / Hub Admin). `[reg-sheet BO - PRE E-INVOICE SSMPE_PERMBO_UCDREG_TS10]`
9. BMK sections include "Transaction Auto-Cancelled AFTER 10 mins logic", "UCD manually
   cancels", "BO manually cancels", "Attempt to copy & paste Step 3 URL". `[reg-sheet UCD - BMK]` — see [flow-bmk.md](flow-bmk.md).
10. STMS sections cover TH/SSM permission matrix (❌/✅ TH × ❌/✅ SSM), SSM negative
    flows (status, director IC, invalid company no, RHB payment, final submission), SSM
    7-day handling, SSM duplicate payment, Bulk JPJ Enquiry / Bulk Payment, auto-resubmit
    on 4Q--803 with new ROC. `[reg-sheet UCD - STMS]` — see [flow-stms.md](flow-stms.md), [flow-ssm.md](flow-ssm.md).
11. eSTM sections cover permission matrix (eLKM + eVOC / eLKM only / eVOC only / none),
    SSM company category, add-on services, retry/reset/resubmit, VEL000069E, VEL000396E,
    eLKM resend with eLKM = N, jpjApprovedAt, region code 11/21, auto-resubmit on
    GLB000301E and VEL000400E. `[reg-sheet UCD - eSTM]` — see [flow-estm.md](flow-estm.md).
12. eSTM automation remarks: "*Script does not include where Insurance VEL000069E, only
    normal Happy Flow with eLKM and eVOC". `[eSTMUCDREG_E2E_TS8, TS80, TS145]`

## 8. Change log and master-checklist upkeep

1. CHANGE LOG has 255 entries, 25/09/2024 → 7/11/2025; running Total Count grew 556 → 3616. `[reg-sheet CHANGE LOG]`
2. Entry types: "NEW SCENARIO ADDED", "SCENARIOS REMOVED", "UPDATE EXECUTE BY (MINUS
   MANUAL)" (scripts ready → Automation), "UPDATE EXECUTE BY - ADD MANUAL" (script not ready).
3. Big batches: eSTM E2E 140+41+39+13 (Charmain, 8/11/2024); BO Edit Onboarding Form 254
   (EAINT-5687, 17/3/2025); APP STMS/eSTM tabs (EAINT-5566 mobile app phase 1, 06/02/2025);
   Thumbprint blocks for all modules (Charmain 18-19/08/2025, then Nabila and Nadhirah to
   7/11/2025); Home Page UCD/AATF Firefox-only announcement TS (Azfar, 4/11/2025).
4. The "Deployed JIRA Tickets (Jan - July 25)" tab maps each deployed CR to its master
   checklist update: column "Updated in Master Checklist?" (TRUE/FALSE) and "TS Traceability
   No.". Standard remark wordings, verbatim:
   1. "Regression scope is already included in: - Master eAuto Regression Checklist, <TAB>".
   2. "Permission patching in Production, no regression required".
   3. "Company patching in Production, no regression required".
   4. "Ticket mainly for design purpose".
   5. "Updated in Master SnF Checklist" (Search & Filter checklist, prefixes like `STMSBOSF_`, `ESTMBOSF_`, `APTBOSF_`).
   6. "*Need to create another regression checklist for eAuto mobile app" (EAINT-5376, EAINT-6014).
   7. "*Dasboard 3.0 is NOT included in Staging / Production Regression Scope" (EAINT-7090).
   `[reg-sheet Deployed JIRA Tickets (Jan - July 25)]`
5. Rule implied for any new CR: when it ships, add its TS to the matching module tab, log it
   in CHANGE LOG with the CR key, and fill the Deployed JIRA row. `[inferred from the three tabs; unconfirmed as a written rule]`

## 9. People seen in the sheet

QA names in Tested By / change log: Nadhirah, Nabila, Teck Yung, Azfar, Charmain, Azila,
Zuhaira, Nick (Nicholas Lim), Dura, May, Jasmin, Johnes, Safiah, Sze Choong, Kasturi,
Ashleigh, Zoe. Roles: see [people-and-roles.md](people-and-roles.md). Faizuddin does not
appear in this run.
