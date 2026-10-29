# Production regression scope (from the eAuto Deployment Checklist, 2023 to Oct 2026)

What QA may and may not do in **production** after a deployment, how past CRs were
verified there, and which CR is a precedent for which type of change. Distilled
from every production deployment sheet in "eAuto Deployment Checklist (Y2023 -
2026).xlsx" (149 sheets, one per deployment, 2023-01-04 to 2026-10-20).

## 1. Purpose and how to use

1. **Source.** `_reference/excel/eAuto Deployment Checklist (Y2023 - 2026).xlsx`.
   The file is gitignored because it holds plain-text prod logins. This file holds
   none of them. Usernames are named by role only.
2. **Quote convention.** Quotes are verbatim, except that a username, a person's name
   or a phone number inside a quote is replaced with a bracketed role, e.g.
   `[superadmin account]`, `[dev]`, `[BA]`. Passwords, URL hosts and phone numbers are
   never copied.
3. **Tags.** `[from Deployment Checklist, <sheet name> R<row>]`. The sheet name is the
   tab name, not the date in the sheet's own header (see section 10). `000` and
   `001` are the tabs "Login_Credential" and "Deployment Checklist".
4. **Use at the start of every production CR checklist.** Read in this order:
   a. Section 2, before deployment day.
   b. Sections 3 and 4, to set the stop point for each module the CR touches.
   c. Section 6, to find the verification pattern for the CR type.
   d. Section 11, to find a precedent CR in the same module.
5. **Production is a different job from staging.** QA checks that the change shows
   up and that nothing broke. QA does not run full test scenarios. Most rows end
   at a stop point, not at "Approved".
6. **Related files.** [releases.md](releases.md), [cr-ledger.md](cr-ledger.md),
   [qa-team-process.md](qa-team-process.md), [people-and-roles.md](people-and-roles.md),
   [flow-jomcheck.md](flow-jomcheck.md), [flow-cibo.md](flow-cibo.md),
   [flow-secarang-insurance.md](flow-secarang-insurance.md),
   [flow-payment-channels.md](flow-payment-channels.md).

## 2. Before deployment

1. **Own production accounts.** The checklist asks: "Does all the QA(s) who are
   supporting the Night Deployment has their own Production account for testing?
   (UCD, BackOffice, and AATF account)". If no: "Please reach out to [QA lead] to
   look for PL / BA to request permission from eAuto Ops to create Production
   account for the QA(s) (to gather & request all at once)".
   `[from Deployment Checklist, 001 R2]`
   Who to ask: the QA lead, then the PL or BA, then eAuto Ops.
2. **Superadmin account.** "Do we need Production Backoffice Superadmin account /
   access for testing?" Action: "if Yes, Please reach out to [superadmin owner] / BA
   to request permission from her on this during working hour (BEFORE the
   deployment)" and "Note: Do share PL / BA the purpose why you need the Prod BO
   Superadmin account." `[from Deployment Checklist, 001 R3]`
   Who to ask: the superadmin account owner (a BA), with the PL copied. Ask in
   working hours, before the deployment.
3. **Superadmin is needed for:** e-Invoice / Consolidated e-Invoice listing, JomCheck
   Report Listing, Biometric Device Purchase and Software Installation listing,
   Hire Purchase record listing, bypass SSM audit log, eAuto Service Portal.
   Rows say "Requires [superadmin account] superadmin account access ..."
   `[from Deployment Checklist, 20260928 R46]` `[from Deployment Checklist, 20260727 R45]`
   `[from Deployment Checklist, 20260311 R46]`
4. **New test company.** "Before deployment, please get eAuto ([approver]) approval on
   creating a new test UCD company in production." `[from Deployment Checklist, 000 R16]`
   a. "Company Name: TEST<yyyymmdd>" `[from Deployment Checklist, 000 R18]`
   b. "Company Reg. No. : <yyyymmdd>-T" `[from Deployment Checklist, 000 R19]`
   c. "Please inactivate the testing company account after done testing & inform
      eAuto by drop email to the support mailbox" `[from Deployment Checklist, 000 R20]`
   Who to ask: the eAuto approver named in 000 R16.
5. **Test back-office accounts.** "Please inactivate the testing backoffice account
   (probation & admin role) after done testing." `[from Deployment Checklist, 000 R5]`
   Row wording: "*Remember to deactivate user account after testing*", "Account
   need to be activated first", "Use own Backoffice account".
   `[from Deployment Checklist, 20261020(AM) R27-R29]`
6. **Existing test companies.** "UCD TEST", "UCD TEST 2", "CREDIT COMPANY TEST" and
   "AATF Test Sdn Bhd" (AATF Main User) are the long-lived prod test entities.
   `[from Deployment Checklist, 20261020(AM) R26]` `[from Deployment Checklist, 20260810 R50]`
   `[from Deployment Checklist, 20250728 R45]`
7. **Accounts that are never available.** One Global (UCD-UCD standard): "no longer have
   Prod One Global account for testig". `[from Deployment Checklist, 000 R24]`
   Chailease (Services): "(only can be accessed via whitelist IP)".
   `[from Deployment Checklist, 000 R8]`
8. **Credentials rule, every sheet R2.** "Note that all login credentials shall be
   kept secured and for internal use only as production data is private and
   confidential." `[from Deployment Checklist, 20261020(AM) R2]`
9. **Browsers.** The template lists **Firefox V36.0.4** for UCD and AATF rows (thumbprint
   needs the old Java applet or the web socket) and **Chrome** for back office and
   the other portals. `[from Deployment Checklist, 20261020(AM) R6-R9]`
   a. IE 8 and IE 11 were in the template until 2024-02-29: "Browser Issue for
      IE11, decided to change regression testing to Firefox V36.0.4 browser."
      `[from Deployment Checklist, 20240229 R10]`
   b. Chrome with the web socket was added for thumbprint on 2025-12-17.
      `[from Deployment Checklist, 20251217 - Chrome (Applet WS) R42]`
   c. Chrome shows this error on the applet path: "[ Update Required ] Please
      update Dermalog Biometric Device to the latest version or make sure it's
      installed correctly. If not, use Firefox version 36 to create a transaction."
      `[from Deployment Checklist, 20251217 - Firefox (Applet ONLY) R42]`
   d. Insurance quotes: "Do quote throughout browsers".
      `[from Deployment Checklist, 20261020(AM) R18]`
10. **Deployment slots.** The sheet name carries the slot.
    a. **Night (PM) slots** were the default: 10.50 PM (Apr-May 2026), 11 PM (2025).
       A cron that runs at 11 PM cannot be checked that night: "Unable to check for
       8699 post deployment at night as last hour to run is 11pm but that is the
       scheduled deployment time." `[from Deployment Checklist, 20251124 R47]`
    b. **AM slots** appear in 2026: 20260603 (8.40 AM), 20260624 (8:30 AM), 20260731,
       20261020(AM). `[from Deployment Checklist, 20260603 R1]`
    c. **Next-day morning** is a separate monitoring row on most sheets:
       "Next Day Morning After Deployment". See section 7.2.
    d. **Cut-off during the night.** "11:30 PM: QA pause testing. [named person] will
       deploy EAINT-10067 to prod. - QA do a quick check based on the scope"
       `[from Deployment Checklist, 20260311 R48]`
       "If Deployment complete BEFORE 11:30PM" and "If Deployment complete AFTER
       11:30PM" gave two test paths for eDereg Pre-Checking.
       `[from Deployment Checklist, 20250612 R42]`
11. **Header on every sheet.** "REMINDER: PLEASE USE RANDOM CARPLATE THAT WILL NOT
    EXIST IN PROD (eg: TEST123)". `[from Deployment Checklist, 20261020(AM) R4]`
12. **Confirm what was deployed.** "Reverted, should NOT show the changes for this
    ticket, as it was excluded from tonight's deployment"
    `[from Deployment Checklist, 20251013 R54]`
    "Note: This ticket has code reverted from deployment. Need to verify existing trx
    invoice template remain unchanged ..." `[from Deployment Checklist, 20250519 R53]`
13. **Before regression on an infra CR.** "Before start regression, need to make sure
    dev has already done changes for this ticket." `[from Deployment Checklist, 20241106 R46]`

## 3. Hard limits in production

Every line below is verbatim. The tag shows where it was seen in the newest sheets.
Older sheets repeat most of them.

### 3.1 Test data and stops

1. "REMINDER: PLEASE USE RANDOM CARPLATE THAT WILL NOT EXIST IN PROD (eg: TEST123)"
   `[from Deployment Checklist, 20261020(AM) R4]`
2. "Use random car plate & JPJ will surely fail in Step 4"
   `[from Deployment Checklist, 20261020(AM) R7]`
3. "For all transaction except UCD-UCD interstate, able to perform until step 4 JPJ
   Enquiry only" `[from Deployment Checklist, 20261020(AM) R6]`
4. "For UCD-UCD interstate transaction, able to perform until Step 2 only"
   `[from Deployment Checklist, 20261020(AM) R6]`
5. "DO NOT proceed transaction till step 4, STOP at step 3 then click [HOME] button
   to exit" (Deregistration) `[from Deployment Checklist, 20261020(AM) R22]`
6. "Test until enquiry vehicle no ONLY" (JomCheck purchase)
   `[from Deployment Checklist, 20261020(AM) R16]`
7. "Able to perform until Step 2 (check on NCD Vehicle field also)" and "Quotation will
   not be saved" (Motor Insurance) `[from Deployment Checklist, 20261020(AM) R18]`
8. "Able to get quotation and proceed until payment page" (Secarang)
   `[from Deployment Checklist, 20261020(AM) R43]`
9. Valid special characters in Engine and Chassis only: "slash (/), asterisk (*), dash
   (-) and space ( )". `[from Deployment Checklist, 20261020(AM) R22-R23]`

### 3.2 Payments and gateways

1. "DO NOT PROCEED WITH PAYMENT (WHOLESALE / JOMCHECK)!!!"
   `[from Deployment Checklist, 20260727 R47]`
2. "DO NOT PROCEED WITH MAKING PAYMENT" (Device Purchase)
   `[from Deployment Checklist, 20260928 R45]`
3. "DO NOT MAKE PAYMENT" (Software Installation quantity selector)
   `[from Deployment Checklist, 20260921 R45]`
4. "Do not proceed with payment" (eDereg Pre-Check) `[from Deployment Checklist, 20260915 R45]`
5. "Close payment popup and exit step page" (Pre-Application)
   `[from Deployment Checklist, 20260225 R42]`
6. "(DO NOT PROCEED [PAY NOW])" (JomCheck chassis search)
   `[from Deployment Checklist, 20260318 R42]`
7. "DO NOT PROCEED WITH CLICKING [UPDATE]" (Device SN popup)
   `[from Deployment Checklist, 20260928 R46]`
8. "DON'T proceed to Confirm Refire" (Wholesale marketing, a real WhatsApp goes out)
   `[from Deployment Checklist, 20260812 R46-R47]`
9. Allowed payment touch: "Click [Pay Now] > Verify payment popup > Close the popup".
   `[from Deployment Checklist, 20260810 R49]`
10. Reset payment is not advised: "for prod not advised to do any reset payment for
    existing transactions" `[from Deployment Checklist, 20240918 R51]`
    Exception: payment-failed APT and STMS test records named in a CR comment.
    `[from Deployment Checklist, 20261001(PM) R48]`
11. **No gateway payment of any kind is completed in prod.** See section 8.6.

### 3.3 Transactions QA cannot create

1. "Unable to test on prod, as we can't create insurance transaction in prod"
   `[from Deployment Checklist, 20260820 R45]`
2. "Unable to test on prod, as we can't create STMS transaction in prod"
   `[from Deployment Checklist, 20260820 R46]`
3. "Unable to test on prod, as we can't create Pre-Application transaction in prod"
   `[from Deployment Checklist, 20260902(AM) R46]`
4. "Unable to test in production as QA is unable to create a successful Secarang
   insurance transaction in production." `[from Deployment Checklist, 20261001(AM) R45]`
5. "Unable to test in production as QA is unable to get the insurance quotation from
   Macrokiosk" `[from Deployment Checklist, 20261001(AM) R46]`
6. "Unable to test as require to initiate Wholesale Transaction on chatbot"
   `[from Deployment Checklist, 20260721 R45]`
7. "Unable to verify as require Wholesale STMS transaction creation"
   `[from Deployment Checklist, 20260615 R47]`
8. "Unable to verify on prod as involves creating & updating action in BO & UCD. Note:
   Not advisable to run automation scripts (Create/Update) on prod"
   `[from Deployment Checklist, 20260506 R44]`
9. "UCD: Unable to test. Shipping address can only be created after payment"
   `[from Deployment Checklist, 20260921 R46]`
10. "Unable to verify as this page is only accessible after payment and clicking the
    'Create Account' button" `[from Deployment Checklist, 20260813 R46]`

### 3.4 Back office, JPJ and clean-up

1. "DON'T TOUCH on sensitive functions (eg: Create, Edit, Update, Delete, Remove,
   Submit Transaction, Payment-related)" `[from Deployment Checklist, 20261020(AM) R30]`
2. "For JPJ Enquiry (New), please DO NOT TRIGGER any SEARCH."
   `[from Deployment Checklist, 20261020(AM) R30]`
3. Per-module "do not touch" examples in the 2024 master list: "Perform Bulk JPJ /
   Payment Enquiry", "Resubmit pending transaction", "Add User, Remove User", "Cancel"
   on GST/SST reports, "Choose Files and Submit" on Upload Insurance e-Certificate.
   `[from Deployment Checklist, 202409xx Server Upgrade R24-R25]`
   `[from Deployment Checklist, 202409xx Server Upgrade R127-R129]`
   `[from Deployment Checklist, 202409xx Server Upgrade R140]`
4. "Can verify the page but DO NOT to proceed resubmit."
   `[from Deployment Checklist, 20240826 R47]`
5. "Ensure only AATF Test Sdn Bhd Main User account able to access this modules"
   (Confirmation of Registration) `[from Deployment Checklist, 20261020(AM) R26]`
6. Data changed on a shared test company must go back: "Change UCD TEST director to
   own account. DONT FORGET TO CHANGE BACK AFTER FINISH TESTING"
   `[from Deployment Checklist, 20260928 R45]`
   "can test using UCD Test Company, but need to update back to the original
   information ya." `[from Deployment Checklist, 20240826 R60]`
7. Uploaded test data must be removed: "*To delete report from JPJ Hasil portal after
   upload" `[from Deployment Checklist, 20240918 R52]`
   "Ensure remove any added alternative once done testing"
   `[from Deployment Checklist, 20260715 R46]`
8. Test permissions are removed by dev: "request dev to patch out permission
   (unenroll) once done testing" `[from Deployment Checklist, 20260715 R47]`
9. Date range: "Please make sure to search & filter the date for 1 month only"
   `[from Deployment Checklist, 202409xx Server Upgrade R2]`
10. Pre-Application: "TS1, please DONT proceed to create pre-application. TS2, please
    DONT do any action (eg. cancel the application)"
    `[from Deployment Checklist, 20260708 R52]`

### 3.5 Things QA cannot see or reach

1. "Unable to verify in prod environment as QA is NOT able to receive any WA
   notification msg when there's a Successful Transaction."
   `[from Deployment Checklist, 20250303 R45]`
2. "Unable to verify on QA's side as no access to Insurance shared mailbox & whatsapp
   recipient" `[from Deployment Checklist, 20260429 R42]`
3. "Unable to test in production as we cannot proceed with the insurance purchase and
   verify the email received." `[from Deployment Checklist, 20260421 R42]`
4. "Unable to test on prod, as we don't have the production account credentials for
   CSE team." `[from Deployment Checklist, 20260820 R47]`
5. "Unable to regress as theres no active One Global Account"
   `[from Deployment Checklist, 20261020(AM) R10]`
6. "Unable to access, incorrect password ... (deprio as per [named person])" (Ops
   Dashboard) `[from Deployment Checklist, 20261020(AM) R37]`
7. Finance-owned reports: "*cannot test as we dont have finance acc in prod"
   `[from Deployment Checklist, 202409xx Server Upgrade R127-R129]`
   "Unable to verify in production as only '[finance account]' has access to this
   report" `[from Deployment Checklist, 20240325 R38]`
8. Recon-only states: "changes can only be verified when transaction in a mismatch
   state, and has its payment made on one date, and resubmitted/approved on a
   different (later) date" `[from Deployment Checklist, 20260817 R47]`
9. Known slowness: CIBO "page keeps loading indefinitely. Current workaround is to
   ask dev to restart the SerbaSentral API". `[from Deployment Checklist, 20260520 R43]`
10. Browser cache after deploy: "UCD login before deployment > UCD relogin after
    deployment > browser cache issue using outdated JavaScript files" ... "Force reload
    > Issue Resolved" `[from Deployment Checklist, 20260408 R42]`

## 4. Stop points per module

Current template (Oct 2026). Older sheets match unless a note says so.

| Module | How far QA may go | Data rule | Source |
|---|---|---|---|
| STMS Malaysian / Company | Step 4, first JPJ enquiry only | Random plate (TEST123). JPJ fails in Step 4 by design | `[from Deployment Checklist, 20261020(AM) R6-R7]` |
| eSTM Malaysian / Company | Step 4, JPJ enquiry only | Random plate | `[from Deployment Checklist, 20261020(AM) R8-R9]` |
| UCD-UCD Standard single / bulk | Step 4. Needs thumbprint and a One Global account | Transfer target is ONE GLOBAL CONNECT TRADING. Not runnable now | `[from Deployment Checklist, 20261020(AM) R10-R11]` |
| UCD-UCD Interstate single / bulk | Step 2 only | Random plate | `[from Deployment Checklist, 20261020(AM) R12-R13]` |
| BMK Malaysian / Registered UCD | Step 4 JPJ enquiry only | Random plate | `[from Deployment Checklist, 20261020(AM) R14-R15]` |
| JomCheck purchase | Vehicle (or chassis) enquiry only. No pay | Invalid number (JOMCTEST0000, TEST0009) gives Pending | `[from Deployment Checklist, 20261020(AM) R16]` `[from Deployment Checklist, 20261005(PM) R45]` `[from Deployment Checklist, 20260302 R42]` |
| Motor Insurance quote | Step 2, quote not saved | Check NCD Vehicle field. Try all browsers | `[from Deployment Checklist, 20261020(AM) R18]` |
| Resubmit failed txn | Page only; go back to Step 4 | "Ensure UCD details remain unchange" | `[from Deployment Checklist, 20261020(AM) R19-R20]` |
| Deregistration (AATF) | Step 3, then click [HOME] | Random plate. Engine/Chassis special chars limited | `[from Deployment Checklist, 20261020(AM) R22-R23]` |
| eDereg Pre-Checking | Step 2 (Pending). No pay | Invalid vehicle number | `[from Deployment Checklist, 20251029 R41]` `[from Deployment Checklist, 20260915 R45]` |
| Pre-Application | Step 2 payment popup, then close | Dummy data. List the application numbers for the BA | `[from Deployment Checklist, 20260225 R42]` |
| Application (onboarding) | Create link, fill, submit on dummy data, then Reject | Dummy data | `[from Deployment Checklist, 20260225 R43]` |
| Secarang | Quote, then payment page (Step 4 or 5), quit | Plate of a real eSTM test case, or random | `[from Deployment Checklist, 20261020(AM) R43]` `[from Deployment Checklist, 20251029 R44]` `[from Deployment Checklist, 20250416 R44]` |
| Software Installation | Step 1 (price, SST on screen) | No payment | `[from Deployment Checklist, 20260731 R45]` |
| Biometric Device Purchase | Step 1 to 2. Quantity rules, price, no payment. BO: listing, [DO] button | Quantity cap 40 | `[from Deployment Checklist, 20260928 R45]` |
| Wholesale chatbot | Up to the payment page. Never pay or Confirm Refire | Prod Wholesale WhatsApp number | `[from Deployment Checklist, 20260727 R47]` `[from Deployment Checklist, 20260812 R46]` |
| BO modules | Open, search, filter, export. Nothing that creates or changes | One-month date range | `[from Deployment Checklist, 20261020(AM) R30]` |
| JPJ Hasil | Access, listing and export | Own JPJ Hasil test user | `[from Deployment Checklist, 20261020(AM) R32-R34]` |
| CIBO | Listing populates, export works | Existing data | `[from Deployment Checklist, 20261020(AM) R44]` |
| Service Portal | Access and search listing | Superadmin account | `[from Deployment Checklist, 20261020(AM) R42]` |

## 5. Standard regression block

The block sits at rows R6 to R44 of every sheet from 20260810 to 20261020(AM). It is
identical in all of them. Only the tester, browser, End Task and a few System values
change. `[from Deployment Checklist, 20261020(AM) R6-R44]`

### 5.1 Items, what each checks, history

| Item (row) | What it verifies | First seen | Notes and deprioritised |
|---|---|---|---|
| STMS Malaysian, STMS Company (R6-R7) | UCD Step 4, UCD listing, resubmit from listing, UCD details, BO listing, BO details, BO export, BO JPJ XML Log | 20230104 as "STMS Malaysian" and "STMS MyPR" `[from Deployment Checklist, 20230104 R5]` | Second row labelled "Company" from 20250813. Nearly always the only STMS row actually run |
| eSTM Malaysian, eSTM Company (R8-R9) | Same list as STMS | 20230104 | Run on most CR sheets |
| UCD-UCD Standard single / bulk (R10-R11) | Transfer to the One Global company | 20230104 | Needs thumbprint and One Global account. 20241211: "Unable to regress this as hitting validation "User is not the wakil of One Global"" `[from Deployment Checklist, 20241211 R10]`. "Unable to regress" since |
| UCD-UCD Interstate single / bulk (R12-R13) | Step 2 | 20230104 | "Deprioritized" from 20250714 except two sheets in Aug 2025 |
| BMK Malaysian, Registered UCD (R14-R15) | Step 4 JPJ enquiry | 20240403 `[from Deployment Checklist, 20240403 R13-R14]` | Run when BMK is touched |
| Purchase JomCheck Report (R16) | Reaches vehicle enquiry | 20240403 `[from Deployment Checklist, 20240403 R15]` | Run with JomCheck CRs |
| Motor Insurance access permission (R17) | Sub-user without permission | 20230104 `[from Deployment Checklist, 20230104 R13]` | "Not relevent anymore after INS385 deployment as sub user with no permission can get quote" since 20240715 `[from Deployment Checklist, 20240715 R18]`. Not assigned in 2026 |
| Create quotation, Motor Insurance (R18) | Quote at Step 2, NCD field | 20230104 | Run with insurance CRs |
| Resubmit failed txn, same UCD / different sub-user (R19-R20) | UCD details unchanged | 20230104 | Run occasionally |
| Download APT Invoice (R21) | UCD invoice with One Global account | 20240829 `[from Deployment Checklist, 20240829 R20]` | N/A: no One Global account |
| Deregistration MyKad / MyPR (R22-R23) | Step 3 then [HOME] | AATF block 20240110 `[from Deployment Checklist, 20240110 R18]`; the "STOP at step 3" note 20240229 `[from Deployment Checklist, 20240229 R18]` | Run only when AATF is touched |
| AATF Payment Report, Audit Trail Log (R24-R25) | Report opens, export | 20240110 | "Cannot Verify Export button cause doesnt have any record of payment for AATF". Not run in 2026 |
| Confirmation of Registration (R26) | Only the AATF test Main User can open it | 20240110 | No thumbprint needed |
| BO login HubAdmin / Admin / Probation (R27-R29) | Role sees its menus | 20230104 | Deactivate after test |
| BO Firefox / Chrome (R30-R31) | Open P1 and P2 modules, no error page. Generate DO | 20230104 (wording changed, see 5.2) | Generate DO step first seen 20240110 `[from Deployment Checklist, 20240110 R26]` |
| JPJ Hasil (R32-R34) | Access, Senarai Transaksi STMS/APT/eSTM, Senarai BMK/HTM/eLKM, listing and export | 20230104; split into two Senarai rows 20240829 `[from Deployment Checklist, 20240829 R32-R33]` | Run on some sheets Oct 2025 to Feb 2026; not run Aug-Oct 2026 |
| Services, chailease (R35) | "Ensure show account inactive message" | 20230104 | "(deprio as per [named person])" on sheets 20260728 to 20261020 `[from Deployment Checklist, 20261020(AM) R35]` |
| UCD reports, One Global sub-user (R36) | Reports open | 20230104 | N/A: no One Global account |
| Ops Dashboard (R37), Ops Jira (R38) | Access and login page only | 20230104 | "(deprio as per [named person])" |
| Bintang Prospek (R39) | "able to access portal and perform basic functions" | 20230104 | Run on a few 2026 sheets, not Aug-Oct 2026 |
| Load / Stress Testing (R40) | Page load under load | 20240807 `[from Deployment Checklist, 20240807 R36]` | 20260225: "Not required as checked with dev, there are not significant amount of records to require load test" `[from Deployment Checklist, 20260225 R40]` |
| Search & Filter regression (R41) | "Basic regression on quick search & search now for ALL eAuto Core Transactions modules"; "*Not required to perform thorough SnF cases" | 20240826 `[from Deployment Checklist, 20240826 R38]` (not in 20240807) | Sheet title names the staging round, e.g. "2025082x (APT Cronjob + ...)" |
| eAuto Service Portal (R42) | "Able to access and search listing" | 20260519 `[from Deployment Checklist, 20260519 R42]` | Needs superadmin account |
| Secarang (R43) | Quote, then payment page | In "Secarang & CIBO Regression Checklist" 20250416 `[from Deployment Checklist, 20250416 R42]`; own row 20260519 `[from Deployment Checklist, 20260519 R43]` | |
| CIBO (R44) | "All listing populate transactions correctly and able to download/export documents/CSV" | same as Secarang `[from Deployment Checklist, 20260519 R44]` | Run 20260930 for EAINT-12151 |

The "Deprioritized" tag in Tested by is first seen 20240401.
`[from Deployment Checklist, 20240401 R5]` In 2026 the usual run is one STMS row and
one eSTM row. `[from Deployment Checklist, 20261014(PM) R6-R9]`

### 5.2 How wording and scope changed

1. **BO sensitive-function wording.** 20240715: "Do not touch on sensitive function
   (eg: Create, Edit, Remove, Submit Transaction)". 20241106: "Do NOT touch ... (eg:
   Create, Edit, Update, Delete, Remove, Submit Transaction, Payment-related)". 20250224:
   "DON'T TOUCH" form plus "For JPJ Enquiry (New), please DO NOT TRIGGER any SEARCH."
   Aug-Sep 2025: row read "To test GENERATE DO ONLY". 2026: DON'T TOUCH form again.
   `[from Deployment Checklist, 20241106 R30]` `[from Deployment Checklist, 20250224 R30]`
2. **BO row scope.** 20240704 to 20240725: spam-click [Search Now] 7-8 times and time
   the Export CSV. 20240807 to 20240829: "Access deployment tickets related module
   only". `[from Deployment Checklist, 20240704 R30]` `[from Deployment Checklist, 20240807 R28]`
3. **Generate DO.** BO > Manage Company Accounts > "UCD TEST" > [Print DO] > Delivery
   Order Type "Device Purchase", Remark "Testing Purpose", Date = deployment date >
   [Generate] > "Ensure DO PDF file is downloaded successfully & showing the details
   correctly". Reason: "insurance e-contract shares same service with DO printing".
   `[from Deployment Checklist, 20261020(AM) R30]`
4. **Integration Test row.** Seen once. Items from the dev priority list: Onboarding,
   Quick Search, eInvoice Listing, SSM Transaction Listing, JomCheck Enquiry, JPJ
   Enquiry, RHB Enquiry, Download JPJ Receipt. JomCheck and JPJ Enquiry left
   unticked. `[from Deployment Checklist, 20260525 R45]`
5. **Closing row.** "Monitor P1 modules to ensure there are no abnormal transactions
   - STMS - eSTM" under "Next Day Morning After Deployment". Titled "Support After
   Deployment" 20260603 to 20260721. `[from Deployment Checklist, 20261020(AM) R45]`
   Extra line on 20260921 and 20260928: "Monitor Biometric Device Purchase & Software
   Installation Listing to ensure there are no abnormal transactions".
6. **Full-regression sheets.** Server upgrade, DB security, DB schema revert and web
   socket sheets re-ran the whole block: 20241003, 202409xx master list, 20240822,
   20240613, and three 20251217 tabs (one per browser path).
   a. 20240822 (DB schema revert) added an "eLKM Visibility Regression" list of 22
      items. `[from Deployment Checklist, 20240822 R12]`
   b. 20260105: "Scope has already been reduced, as there are no code changes
      involved." `[from Deployment Checklist, 20260105 R41]`
7. **Thumbprint SSL tests.** Matrix of browser x Java: Firefox Java 7 STMS, Java 8 eSTM
   and BMK, Chrome STMS, Edge eSTM, Chrome Dereg. Record "Thumbprint = PASS" and
   "JPJ Enquiry Step 4 = PASS" for each combination.
   `[from Deployment Checklist, 20260316 R42]`

## 6. Verification patterns by CR type

Each pattern: what QA does in prod, then 1 to 3 precedents.

1. **Listing / export column or filter.** Open the listing, check the column position and
   value on existing records, export and compare. Where only the database has the
   value, ask dev for a screenshot.
   a. EAINT-12151: "Set the date range to 1 month from current date"; "Download the
      Excel and PDF file"; "Ensure data is displayed correctly in the CIBO Listing,
      Excel and PDF File" `[from Deployment Checklist, 20260930 R45]`
   b. EAINT-12430: "New 'LKM Refund Amount' column added after 'Application Status'
      column" `[from Deployment Checklist, 20261008(AM) R45]`
   c. EAINT-12058: "Ask dev to screenshot the database and check for the newly added
      columns" `[from Deployment Checklist, 20260817 R48]`
2. **Price or fee.** Check the price on screen (no payment). Check existing invoice,
   e-Invoice and Slip Pengesahan did not change. Next morning, open a real new
   Approved transaction.
   a. EAINT-12403: "Verify the price display on UCD portal ... updated to RM25"; next
      day "STMS, Tx Status = Approved, Service Charge = 35"; "APT, Tx Status =
      Approved, Service Charge = 125" `[from Deployment Checklist, 20261001(PM) R48-R49]`
   b. EAINT-12289: "All existing trx invoice, e-invoice and Slip Pengesahan will
      remain unchanged" `[from Deployment Checklist, 20260917 R45]`
   c. EAINT-8409: "eAuto Service Fee = 5.00", "Service Tax 8% = 0.40", "Total Amount
      Payable (inclusive of Service Tax 8%) = 10.40"
      `[from Deployment Checklist, 20250731 R45]`
3. **Invoice, e-Invoice, LHDN.** Old documents are checked on existing transactions.
   New documents are checked by monitoring real transactions, never by paying.
   a. EAINT-12126: "Monitor modules below, ensure able to get LHDN = OK", then one
      tick per module with real data, "(No data)" for the rest
      `[from Deployment Checklist, 20260813 R45]`
   b. EAINT-8550: three date bands of existing transactions, old vs new template, then
      a next-day check after the 1 AM cron `[from Deployment Checklist, 20251013 R50]`
   c. EAINT-11143: "After deployment, check for any approved trx in production
      (include both invoice and e-invoice)" with "(If there are no new trx at night,
      morning support will check)" `[from Deployment Checklist, 20260506 R47]`
4. **Document generation (PDF, DO, receipt).** Compare an old transaction (unchanged)
   with a new one after the cut-off.
   a. EAINT-12166: Delivery Status = New "[DO] button is not displayed"; new trx
      "[DO] button is displayed and able to download"
      `[from Deployment Checklist, 20260928 R45]`
   b. EAINT-4328: existing eSTM from three date bands, "ensure remain unchanged"
      `[from Deployment Checklist, 20260630 R51]`
   c. EAINT-7809: "Cutoff date = 19/05/2025, check on Approved trx"
      `[from Deployment Checklist, 20250519 R52]`
5. **Payment gateway.** Stop before payment. If the CR fixes a payment-page bug, test on
   staging and monitor in prod.
   a. EAINT-10126 (Fiuu retry): "Issue retested on staging, to monitor on prod during
      morning support only" `[from Deployment Checklist, 20260316 R42]`
   b. EAINT-12232: "Unable to test on prod, as we can't create Pre-Application
      transaction in prod" `[from Deployment Checklist, 20260902(AM) R46]`
   c. EAINT-6771 (RHB API resume): "Create Secarang Transaction until Step 5 Payment
      Page and Quit" `[from Deployment Checklist, 20250416 R44]`
6. **JomCheck.** See section 8.1.
7. **CIBO.** See section 8.2.
8. **Secarang / insurance.** Quote only. Messages and policy documents cannot be seen.
   a. EAINT-8822: "Verify able to obtain Lonpac quotation without matching IC with
      vehicle number" `[from Deployment Checklist, 20250922 R45]`
   b. EAINT-10044: "Proceed until step 2 and verify sum insured and final total price."
      `[from Deployment Checklist, 20260401 R42]`
   c. EAINT-11759: "Unable to test in production as QA is unable to create a
      successful Secarang insurance transaction in production. Get BE Audit Log from
      Dev" `[from Deployment Checklist, 20261001(AM) R45]`
9. **Cron job / backend only.** QA cannot see it on deploy night. Choose one:
   a. Next-day check on an existing record due to change: EAINT-11829 "Monitor the
      existing transaction that will exipred at (1/7/2026 00:00)"
      `[from Deployment Checklist, 20260630 R45]`
   b. Dev checks: EAINT-12171 "[dev] will verify in prod"
      `[from Deployment Checklist, 20260910 R46]`
   c. No QA action: EAINT-9845 "No action required from QA post deployment"
      `[from Deployment Checklist, 20260318 R43]`
   d. Dev triggers the cron by hand: "[dev] Manually trigger cronjob for 14/7/2025
      (deployment night); Subsequent day cronjob will run at 11pm"
      `[from Deployment Checklist, 20250714 R42]`
10. **Report.** Open, filter, export. Finance-owned or recon reports are often not
    QA-checkable.
    a. EAINT-12018: "SnF - Transaction Type Dropdown": options include Software
       Installation, Biometric Device Purchase `[from Deployment Checklist, 20260727 R49]`
    b. EAINT-12260: "[dev] will verify in prod" `[from Deployment Checklist, 20260910 R47]`
    c. EAINT-7495 (zero data): "Note: UCD Test will display 0 records as no payment
       transactions" `[from Deployment Checklist, 20260520 R44]`
11. **Permission / role.** Use an authorised account and an unauthorised one.
    a. EAINT-11175: "Authorized User : [superadmin account] (can view, tick/untick &
       save changes)"; "Non-Authorized User : [other BO account] (can view, disabled &
       non editable)" `[from Deployment Checklist, 20260810 R50]`
    b. EAINT-10515: SuperAdmin, HubAdmin, Admin can see the section; the Probation
       role "CANNOT" `[from Deployment Checklist, 20260415 R44]`
    c. EAINT-8549: "Verify unable to see & access Consolidated e-Invoice Listing" with
       own BO account `[from Deployment Checklist, 20250731 R42]`
12. **Button visibility.** Find existing records in each state. The state list is the TS.
    a. EAINT-11982: TS1 "Approved + expiry within 30 days: [Extend] showing" through TS5
       "NOT showing" `[from Deployment Checklist, 20260902(AM) R45]`
    b. EAINT-5972: "Cancel Pre-Application button can be seen when Pre-Application
       Status = New" `[from Deployment Checklist, 20260708 R52]`
13. **Email.** Needs a shared inbox and a real event.
    a. EAINT-12341: check the apply mailbox "(confirm with Ops)" for approvals after the
       release `[from Deployment Checklist, 20261007(AM) R45]`
    b. EAINT-10690: "Unable to test in production as we cannot proceed with the
       insurance purchase and verify the email received."
       `[from Deployment Checklist, 20260421 R42]`
14. **Wholesale / WhatsApp.** Prod Wholesale number, up to payment or re-fire.
    a. EAINT-12000: "source listed vehicle -> shows in marketing listing, can re-fire";
       "DON'T proceed to Confirm Refire" `[from Deployment Checklist, 20260812 R46]`
    b. EAINT-11890: list a car by photo; "DO NOT PROCEED WITH PAYMENT (WHOLESALE /
       JOMCHECK)!!!" `[from Deployment Checklist, 20260727 R47]`
    c. EAINT-11870: "Once done testing, inform [dev] can proceed cleanup & also
       re-terminate the UCDs" `[from Deployment Checklist, 20260727 R46]`
15. **Validation / input.** Type the bad value, see the message, stop.
    a. EAINT-11996: paste "F03x!04" into the quantity field, "Ensure the field only
       shows the numbers" `[from Deployment Checklist, 20260921 R45]`
    b. EAINT-9306: "Enter an invalid vehicle number - Ensure the pre-check pops up with
       the 'Perakuan' ... Click [Close] - Ensure no pre-checking transaction is
       created" `[from Deployment Checklist, 20260915 R45]`
16. **Text, label, address or logo.** Walk each listed screen and compare text. Old
    records keep the old value.
    a. EAINT-8620 (hotline): 7 screens listed `[from Deployment Checklist, 20251013 R49]`
    b. EAINT-8756: "before 5th May ... old address (Mutiara); 5th May - new address
       (Sunway)" `[from Deployment Checklist, 20251029 R45]`
17. **Data patch.** Sample, do not check all.
    a. EAINT-11558: "Selectively pick 5 UCDs to check the transaction restriction status"
       `[from Deployment Checklist, 20260603 R48]`
    b. EAINT-10510: "*Select any 3 company accounts from the provided list"
       `[from Deployment Checklist, 20260415 R43]`
18. **SSL / thumbprint / infra.** Run the thumbprint matrix (5.2 item 7). Infra change:
    "Covered with Prod usual regression" `[from Deployment Checklist, 20250826 R46]`
19. **Backend swap (e.g. BRN switch).** Run the affected modules, then inspect the JPJ
    XML Log next morning. EAINT-8622: "to check JPJ XML Log in BackOffice: (enure all
    sending NEW BRN and can get approved status from JPJ)"
    `[from Deployment Checklist, 20261019(PM) R46]`

## 7. Existing-data and monitoring techniques

### 7.1 Pick existing transactions by state

1. Record the IDs of existing prod transactions per state and give them as test data
   in the row Comment. QA does not create new ones.
2. **EAINT-10089 structure** `[from Deployment Checklist, 20260914 R45]`:
   a. TS1: "Payment = OK, Tx Status = Approved - All status remain - BackOffice >
      JomCheck Fee remain as RM18 - BackOffice > Not showing the Share Report feature
      - Service Portal > Ownership Claim Listing JomCheck = Yes - Service Portal > Not
      showing in JomCheck Report Listing"
   b. TS2: "Payment Status = -, Tx status = Pending"
   c. TS3: "Failed to Retrieve Report, Tx status = Failed"
   d. TS4: "Payment Status = Failed, Tx status = Failed - Tx Status updated to Pending,
      without Payment History"
   e. TS5: new JomCheck "Test until enquiry vehicle no ONLY - Check Share Report
      feature (both UCD and BO)"
3. **Other uses.**
   a. EAINT-11982: five states by expiry date `[from Deployment Checklist, 20260902(AM) R45]`
   b. EAINT-4328: three eSTM date bands, with and without eLKM
      `[from Deployment Checklist, 20260630 R51]`
   c. EAINT-8550: three date bands and LHDN status
      `[from Deployment Checklist, 20251013 R50]`
   d. Reset-payment test records for payment-failed APT and STMS
      `[from Deployment Checklist, 20261001(PM) R48]`
4. **Existing transactions as the negative case.** "All existing trx invoice,
   e-invoice and Slip Pengesahan will remain unchanged".
   `[from Deployment Checklist, 20260917 R45]`

### 7.2 Next-day morning monitoring

1. The row is "Next Day Morning After Deployment". It checks real new transactions.
   `[from Deployment Checklist, 20261020(AM) R45]`
2. Typical lines:
   a. "EAINT-12022 - STMS + IC transaction, Tx Status = Approved, Service Charge = 38"
      `[from Deployment Checklist, 20261014(PM) R46]`
   b. "EAINT-104, 10093, 10119 - STMS + LKM Refund transaction, Tx Status = Approved -
      Check JPJ XML Log (STMS)" `[from Deployment Checklist, 20261001(PM) R49]`
   c. "EAINT-10089, 10937, 11175 JomCheck Enhancement - JomCheck, check for Approved
      trx, make sure fee is RM20" `[from Deployment Checklist, 20260915 R46]`
   d. "CIBO > Transaction Management - Monitor production for new Macrokiosk
      transactions" `[from Deployment Checklist, 20261001(AM) R47]`
   e. "Monitor IC transaction running no & sequence display correctly"
      `[from Deployment Checklist, 20261020(AM) R45]`
3. **When there is no real transaction yet:** "To monitor until new trxn with Payment =
   Failed is created, as the logic will auto cancel trxn after 10 mins"
   `[from Deployment Checklist, 20260731 R48]`
   "So far, there are no HP record yet. I will continue to monitor from time to time."
   `[from Deployment Checklist, 20260429 R44]`
4. **The window can start later than the deploy:** "To monitor new transactions
   11/12/2025 9AM onwards" `[from Deployment Checklist, 20251210 R42]`

### 7.3 Dev-assisted checks

1. **DB screenshot.** "Ask dev to screenshot the database and check for the newly
   added columns" `[from Deployment Checklist, 20260817 R48]`
2. **Audit log.** "Get BE Audit Log from Dev" `[from Deployment Checklist, 20261001(AM) R45]`
3. **Dev verifies.** "Dev ([dev]) will check in prod on 14 August"
   `[from Deployment Checklist, 20260813 R48]` "[dev] will verify in prod"
   `[from Deployment Checklist, 20260910 R46]`
4. **Dev checks data QA cannot see.** "Check with dev if IP capture successfully on the
   following: i. Successful login to UCD ii. Successful thumbprint step 1 iii.
   Successful thumbprint step 3" `[from Deployment Checklist, 20250918 R42]`
   "Provide Company ID to dev to verify captured IP in DB (Step 1 & 3)"
   `[from Deployment Checklist, 20251013 R45]`
5. **Dev patches data.** "request dev to patch out permission" (section 3.4);
   "Request dev to help patch Business Type" `[from Deployment Checklist, 20250528 R43]`;
   "[dev] to patch Payment = OK, SSM Final = -" `[from Deployment Checklist, 20250224 R42]`
6. **Backend logs.** "Request backend logs from [dev] for verification"
   `[from Deployment Checklist, 20260630 R48]`
7. **Browser dev tools.** For a listing moved to Elastic Search: F12 Network tab, check
   the Request URL. `[from Deployment Checklist, 20250519 R55]`

### 7.4 Waived or unable to test, and who confirmed

1. "Excluded, as confirmed with [BA]. QA does not need to test this ticket."
   `[from Deployment Checklist, 20261001(AM) R48]`
2. "As confirmed by [QA], unable to test in production after the deployment."
   `[from Deployment Checklist, 20260914 R48]`
3. "As confirmed by [QA] & [dev], unable to test in production after the deployment."
   `[from Deployment Checklist, 20260914 R49-R50]`
4. "Confirmed with BA ([BA]), not required to involve QA"
   `[from Deployment Checklist, 20260429 R45]`
5. "No action required from QA post deployment"
   `[from Deployment Checklist, 20260415 R45]`
6. "Unable to verify this in prod tonight, as discussed with [BA]" (no insurance hubadmin
   account on prod) `[from Deployment Checklist, 20260708 R45]`
7. "BA will get them to check tomorrow morning." `[from Deployment Checklist, 20260817 R45]`
8. Pattern: the confirmer is a BA, PL, dev or QA lead named in the cell. Copy the
   wording and name the confirmer.

## 8. Module notes

### 8.1 JomCheck

1. Purchase stops at enquiry: "Test until enquiry vehicle no ONLY".
   `[from Deployment Checklist, 20261020(AM) R16]`
2. Invalid-number negative test: "Ensure result shows 'Vehicle number not found. Try
   again with another vehicle'" `[from Deployment Checklist, 20261005(PM) R45]`
   Pending result with invalid number: "UCD JomCheck Listing > Status = Pending - BO
   JomCheck Listing > Status = Pending" `[from Deployment Checklist, 20260302 R42]`
3. Chassis search: "For Chassis No as there is no 'enquiry' available on JomCheck's
   side, any input will be considered as 'chassis found' and allow to purchase."
   `[from Deployment Checklist, 20260318 R42]`
4. New report data can only be seen on a real Approved transaction after go-live:
   "#2 TO VERIFY AFTER JOMCHECK SIDE DONE DEPLOYMENT & IF HAVE APPROVED NEW TRANSACTION
   (eta: after 12am)" `[from Deployment Checklist, 20260421 R46]`
5. JomCheck v2.0: BO JomCheck Report Listing columns are checked on old (raw / "N/A")
   and new (range statements, Yes/No, severity values) transactions. Needs the
   superadmin account. `[from Deployment Checklist, 20261005(PM) R45]`
6. Service Portal counters: "(Only applicable if there are real transactions already
   made)" `[from Deployment Checklist, 20261005(PM) R45]`
7. JomCheck invoice, e-Invoice, SST report: existing records and next-day monitoring
   only. "UCD JomCheck Details > Invoice ... BO SST Payment Report (JomCheck) - BO
   e-Invoice / Consolidated e-Invoice Listing"
   `[from Deployment Checklist, 20260810 R55]`
   "No credentials to use for SST Payment Report (JomCheck) verification on production"
   `[from Deployment Checklist, 20260318 R42]`
8. Fee: "Jomcheck Unit Price - RM20, Tax Amount - RM1.60"
   `[from Deployment Checklist, 20260810 R54]`
9. Not testable: EAINT-11757 credit-company API `[from Deployment Checklist, 20260914 R48]`;
   EAINT-12279 Wholesale price `[from Deployment Checklist, 20260914 R50]`.
10. Permission add-ons (EAINT-11175, 10937): tick and untick on "CREDIT COMPANY TEST",
    open then close the pay popup. `[from Deployment Checklist, 20260810 R49-R53]`
11. Old payment-amount CR: "Need to submit Jomcheck with real payment & verify the
    Payment amount" `[from Deployment Checklist, 20240403 R36-R37]`. Not repeated in
    2025-2026. Treat as history, not a rule.

### 8.2 CIBO

1. CIBO is checked on existing data: sysadmin login lists all modules, search, export.
   `[from Deployment Checklist, 20260520 R47]`
2. Column checks use the explicit column list from the CR (Referred Risk Log 20 columns,
   Transaction Management about 37 columns, Payment Report columns).
   `[from Deployment Checklist, 20260520 R48-R50]`
3. A new Secarang transaction taken to Step 4 or 5 creates a CIBO record without
   payment: "Proceed to Step 5 Payment Method page to create record in CIBO"
   `[from Deployment Checklist, 20250630 R53]`; "Secarang > Continue transactions until
   Step 4; Go to CIBO > Transaction Management; Export CSV"
   `[from Deployment Checklist, 20251022 R43]`
4. For Secarang rows the eAuto UCD columns show "-". `[from Deployment Checklist, 20260817 R48]`
5. Template CIBO row: "All listing populate transactions correctly and able to
   download/export documents/CSV". `[from Deployment Checklist, 20261020(AM) R44]`
6. Macrokiosk: "New module > Macrokiosk Template Management - All toggle enabled by
   default" `[from Deployment Checklist, 20261001(AM) R47]`

### 8.3 Secarang and insurance

1. Secarang: quote, then payment page. Messages (WhatsApp, email, receipt) cannot be
   received. `[from Deployment Checklist, 20250731 R46]`
2. Insurance: Get a Free Quote to Step 2, compare the UCD quote with BO "Insurance Quote
   Enquiry", quote not saved. `[from Deployment Checklist, 20260401 R42]`
3. "Note: Lonpac quotation is currently enabled in prod env."
   `[from Deployment Checklist, 20260624 R46]`
4. Anything after Step 4 of eSTM (Chubb hire-purchase, eLKM error unhide): "Unable to
   verify in prod as need to create transaction past Step 4 - eSTM"
   `[from Deployment Checklist, 20250312 R43]`
5. Insurance WhatsApp sender change: monitor next morning and ask dev for backend logs.
   `[from Deployment Checklist, 20260630 R48]`
6. Insurance Cancellation (IC) on STMS: verified next morning on a real STMS
   transaction. `[from Deployment Checklist, 20261014(PM) R46]`
7. Motor insurance access row: "Not relevent anymore after INS385 deployment".
   `[from Deployment Checklist, 20261020(AM) R17]`

### 8.4 e-Invoice and LHDN (MyInvois)

1. First e-Invoice CRs: 20250618 (BMK) and 20250630 (STMS, eSTM, APT, JomCheck, SSM,
   Dereg). Stated limit: "Note: Unable to test: - e-Invoice generation & PDF - Live
   Payment". `[from Deployment Checklist, 20250630 R43-R49]`
2. Rule for the first LHDN-OK transaction: "1. During Deployment, ask BA & Dev to help
   monitor Prod if there's any Approved Trnx with LHDN = OK". Then check Trnx Details
   [e-Invoice], Slip Pengesahan, listing LHDN status and dates, e-Invoice PDF, MyInvois
   portal, BO export. `[from Deployment Checklist, 20250630 R58]`
3. Later pattern: "Monitor modules below, ensure able to get LHDN = OK" per module.
   `[from Deployment Checklist, 20260813 R45]` `[from Deployment Checklist, 20260820 R48]`
4. "Consolidated e-Invoice (Unable to test in prod)", "Credit Note (No data)",
   "Proforma Invoice (No data)". `[from Deployment Checklist, 20260813 R45]`
5. MyInvois portal: "Unable to test on production MyInvois"
   `[from Deployment Checklist, 20250731 R43]`
6. Listing access needs the superadmin account: "Use [superadmin owner]'s BO Prod account to access
   e-Invoice / Consolidated e-Invoice Listing" (read as the superadmin
   account) `[from Deployment Checklist, 20251029 R43]`
7. Credit note done on existing data: raise a credit note on an existing Proforma
   Invoice with "P. Invoice Status = OK" and "e-Invoice Status = OK", edit, [Cancel
   Request], raise again. `[from Deployment Checklist, 20260610 R45]`
8. Proforma: "Please inform BA about the updated proforma invoice, so that ops and
   finance are aware it's for testing purposes." `[from Deployment Checklist, 20251013 R51]`

### 8.5 SST reports and service tax

1. SST reports in the sheets: SST Payment Report (JomCheck), GST/SST Payment Report
   (eDereg), GST/SST Revenue Report. All "unable to verify in prod" or finance-run.
   `[from Deployment Checklist, 20260318 R42]` `[from Deployment Checklist, 20251029 R43]`
2. 2024 rule: finance checks them: "QA unable to verify, [named person] will test";
   "Require [named person] from finance to check". `[from Deployment Checklist, 20240704 R42]`
   `[from Deployment Checklist, 20240523 R52]`
3. SST on screen is checked at payment pages without paying: "Installation, Service Tax
   and Total Amount Payable" `[from Deployment Checklist, 20260731 R45]`
4. SST in invoices: "New pricing will only display 1st May 2026, 12.00AM onwards"; only
   the old invoice was checked. `[from Deployment Checklist, 20260427 R44]`
5. Service tax rate change: EAINT-408 "Service Tax Revision from 6% to 8%", "QA to
   compare the screenshots". `[from Deployment Checklist, 20240229 R34]`

### 8.6 Payment gateways

1. **Fiuu.** Only EAINT-10126 (20260316) and EAINT-12232 (20260902(AM)). Neither verified
   in prod. `[from Deployment Checklist, 20260316 R42]`
   `[from Deployment Checklist, 20260902(AM) R46]`
2. **RHB.** Appears only as: the BO "RHB Payment Transaction" page (search and
   export), the insurance quote card (hidden or shown), BMK CSV field "RHB ID (eAuto)",
   reconciliation, split debit "Split AATF Debit to eAuto / JPJ", an approved-mail
   recipient. No RHB payment is made in prod.
   `[from Deployment Checklist, 20250731 R45]` `[from Deployment Checklist, 20260731 R48]`
   `[from Deployment Checklist, 20250519 R51]`
3. Known RHB page issue: "RHB Payment Transaction = If search all is queried and
   returned approx. > 4000 data, then search specific transaction ID / veh no will
   result in infinite loading (existing issue and not due this ticket...)"
   `[from Deployment Checklist, 20240530 R55]`
4. **Real SSM payment in the past.** "to use real RHB account when make SSM payment"
   `[from Deployment Checklist, 20250224 R42]`. The SSM payment was failed on purpose in
   the next CRs. `[from Deployment Checklist, 20250115 R42]`
5. **BoldPay and DuitNow.** Not found in any of the 149 sheets. No precedent.
6. **FPX.** Only "Trigger FPX Job" in the 2024 server-upgrade master list.
   `[from Deployment Checklist, 202409xx Server Upgrade R199]`

### 8.7 Service Portal

1. Access needs the superadmin account. `[from Deployment Checklist, 20261020(AM) R42]`
2. Listing and ZIP content tests used existing transactions for BBHM + JomCheck +
   Insurance; "To monitor new transactions 11/12/2025 9AM onwards".
   `[from Deployment Checklist, 20251210 R42]`
3. Timestamp CR: "Use transactions with a small time gap of several minutes and
   above". `[from Deployment Checklist, 20251210 R43]`
4. Hire Purchase listing: "Non EAUTO SDN BHD User - Verify unable to access Hire
   Purchase record listing page". `[from Deployment Checklist, 20260325 R42]`
5. Financial-institution tagging flows used a dummy plate; the first JPJ enquiry fails
   by design. `[from Deployment Checklist, 20260128 R42]`

### 8.8 Wholesale

1. Chatbot flows cannot be run unless a Wholesale transaction can be started:
   "Unable to test as require to initiate Wholesale Transaction on chatbot".
   `[from Deployment Checklist, 20260721 R45]`
2. UI parts are checked: permission tick/untick, listings, Alternative Vehicle
   Maintenance and its audit log, agreements.
   `[from Deployment Checklist, 20260715 R46]`
3. Setup needed: "Requires enroll (tick) Manage Wholesale Company Account > UCD Test >
   To view 'Wholesale' module on UCD as Main User".
   `[from Deployment Checklist, 20260715 R47]`
4. At the first prod release: "Deployment to production only, no transactions should be
   available yet as Beta begins on 16/6/2026". `[from Deployment Checklist, 20260610 R46]`
5. Next-day line: "Check Wholesale Backoffice Chat History - Monitor eSTM & STMS
   message & ensure no spam behavior (starting on 22/7/2026)".
   `[from Deployment Checklist, 20260721 R48]`
6. Wholesale TS are chatbot-driven and tested by hand; do not list them as an
   automation gap (see the project memory rule).

## 9. Wording templates

Copy these forms. Change the reason only.

1. **Unable to test.**
   a. "Unable to test on prod, as we can't create <module> transaction in prod"
      `[from Deployment Checklist, 20260820 R45]`
   b. "Unable to test on prod, as we don't have the production account credentials for
      <team>." `[from Deployment Checklist, 20260820 R47]`
   c. "Unable to verify as require <state>" `[from Deployment Checklist, 20260615 R47]`
   d. "Unable to test as require to do up until payment step to trigger request"
      `[from Deployment Checklist, 20251013 R42]`
   e. "Unable to verify in Production as this can only be tested when Payment is made &
      e-Invoice is generated successfully" `[from Deployment Checklist, 20250630 R54]`
2. **Monitor.**
   a. "Monitor P1 modules to ensure there are no abnormal transactions - STMS - eSTM"
      `[from Deployment Checklist, 20261020(AM) R45]`
   b. "To monitor new transactions <date> onwards"
      `[from Deployment Checklist, 20251124 R47]`
   c. "Unable to test on prod, to monitor post deployment"
      `[from Deployment Checklist, 20260810 R45]`
   d. "QA will monitor for successful insurance transactions the following morning
      (1/7/2026)." `[from Deployment Checklist, 20260630 R48]`
3. **Ask dev.**
   a. "Ask dev to screenshot the database and check for the newly added columns"
      `[from Deployment Checklist, 20260817 R48]`
   b. "Get BE Audit Log from Dev" `[from Deployment Checklist, 20261001(AM) R45]`
   c. "Request backend logs from [dev] for verification"
      `[from Deployment Checklist, 20260630 R48]`
   d. "[dev] will verify in prod" `[from Deployment Checklist, 20260910 R46]`
4. **Only if real data exists.** "(Only applicable if there are real transactions
   already made)" `[from Deployment Checklist, 20261005(PM) R45]`
5. **Superadmin needed.** "Requires [superadmin account] superadmin account access ..."
   `[from Deployment Checklist, 20260928 R46]`
6. **Waived.** "Excluded, as confirmed with [BA]. QA does not need to test this ticket."
   `[from Deployment Checklist, 20261001(AM) R48]`
7. **Data present or absent.** "(No data)" per module
   `[from Deployment Checklist, 20260813 R45]`; "Unable to verify using existing trxns
   coz there are currently no trxns with Payment = Failed found in prod"
   `[from Deployment Checklist, 20260731 R48]`
8. **Verified on part.** "Can only verify for BMK existing trnx that Failed LHDN due to
   Invalid TIN / No TIN" `[from Deployment Checklist, 20250630 R55]`
9. **Stop point inside a TS.** "7. DO NOT PROCEED WITH MAKING PAYMENT"
   `[from Deployment Checklist, 20260928 R45]`
10. **Clean-up line.** "DONT FORGET TO CHANGE BACK AFTER FINISH TESTING"
    `[from Deployment Checklist, 20260928 R45]`
11. **Result on a TS with no data.** "Unable to verify due to no data"
    `[from Deployment Checklist, 20261002(AM) R45]`

## 10. Source quirks

1. **Header dates are often wrong.** Cite the tab name.
   a. 20261008(AM) header says "7th October 2026 (AM)".
   b. 20260930, 20260928, 20260921, 20260917, 20260915 all say "15th September 2026
      (AM)". `[from Deployment Checklist, 20260930 R1]`
   c. 20260902(PM) says "(AM)".
   d. 20260618 says "Exercise Date: 15th June 2026 (11.00 PM)", same as 20260615.
      `[from Deployment Checklist, 20260618 R1]`
   e. 20260708 says "8th July 2026 (PM)" and sits before 20260715 in tab order.
   f. 20260105 says "Deployment Date: 10 December 2025"; so do the three 20251217 tabs.
      `[from Deployment Checklist, 20260105 R1]`
   g. 20241211 and 20241217 say "27 November 2024". 20240530 says 23 May 2024. 20231130
      says 20 Nov 2023. 20231118 and 20231108 both say 08 Nov 2023. 20230130 says 11
      Jan 2023. Several early-2023 tabs keep template text such as "e.g. 21 Mar".
2. **Duplicate sheets.** 20231118 and 20231108 are identical. 20251124 and 20251112
   carry identical CR rows. 20231130 and 20231120 share the title "112023-03".
3. **Label differences.** "Exercise Date" replaces "Deployment Date" on several 2026 tabs.
   The tab 20260902 (AM) has an underscore in its name.
4. **Merged cells shift columns.** When Browser or Tested by is empty, remarks land in
   the Tested by column. "Deprioritized", "N/A" or a name in Tested by is not a result.
   The result is the End Task tick (true = ticked, false = unticked, blank = none).
5. **Row numbering.** 20251029 has no "Deployment Date" row, so its rows are one lower.
   Item numbers skip on 20250122, 20250115 and 20250528 (hidden rows).
6. **A comment can hold another CR.** EAINT-8183 sits inside the Comment cell of the
   EAINT-7578 row. `[from Deployment Checklist, 20250618 R42]`
7. **Tabs with no CR rows:** 20260728, 20260519, 20260213 (regression only). 20241003
   and 20240822 re-ran the whole block.
8. **Undated template tabs:** "202409xx Server Upgrade", "WIP Master Checklist", "OLD
   Template" (March 2023 style).
9. **Test data in Comment cells** (plates, quotation IDs, application numbers) is not
   copied here. Ask for fresh data each time.
10. **Source files read in 6 parts.** Counts of CR rows differ by part because some
    rows group several keys. Use the sheet, not a row count, as the reference.

## 11. Precedent index, 2025 and 2026

Date = sheet name (yyyymmdd). Verified: **Yes** = checked in prod; **Part** = existing data
or part of the TS; **No** = unable to test; **Mon** = monitor or next-day; **Dev** = dev
checks; **Waive** = QA not needed; **-** = nothing recorded.

### 11.1 2026-08-10 to 2026-10-20

| Key | Date | Module | Verified |
|---|---|---|---|
| EAINT-12548 | 20261020(AM) | UCD/BO STMS Insurance Cancellation numbers | Mon |
| EAINT-8622 | 20261019(PM) | Backend BRN switch (JPJ) | Part |
| EAINT-12022 | 20261014(PM) | STMS Insurance Cancellation | Mon |
| EAINT-12430 | 20261008(AM) | UCD/BO LKM Refund column | Yes |
| EAINT-12341 | 20261007(AM) | Email approved application | Mon |
| EAINT-12339 | 20261005(PM) | JomCheck v2.0 | Part |
| EAINT-12175 | 20261002(AM) | Secarang/insurance Lonpac name | Part |
| EAINT-104 | 20261001(PM) | STMS LKM Refund | Mon |
| EAINT-10093 | 20261001(PM) | LKM Refund enhancement | Mon |
| EAINT-10119 | 20261001(PM) | STMS SSM validation | Mon |
| EAINT-12403 | 20261001(PM) | STMS/APT fee increase | Yes |
| EAINT-11759 | 20261001(AM) | Secarang notification sender | No |
| EAINT-12217 | 20261001(AM) | Secarang Macrokiosk opt-out | No |
| EAINT-12218 | 20261001(AM) | CIBO Macrokiosk templates | Part |
| EAINT-12324 | 20261001(AM) | Wholesale stock notification | Waive |
| EAINT-12421 | 20261001(AM) | UCD homepage poster | Yes |
| EAINT-12151 | 20260930 | CIBO Transaction Management dates | Yes |
| EAINT-12166 | 20260928 | BO Device Purchase DO | Yes |
| EAINT-12167 | 20260928 | BO Device SN | Yes |
| EAINT-11996 | 20260921 | UCD quantity selector | Yes |
| EAINT-12095 | 20260921 | BO Device Purchase address | Part |
| EAINT-12103 | 20260921 | BO Device Purchase Enter key | Yes |
| EAINT-12104 | 20260921 | BO Device Purchase layout | Yes |
| EAINT-12289 | 20260917 | APT fee RM20 | Yes |
| EAINT-9306 | 20260915 | AATF eDereg Pre-Check | Yes |
| EAINT-10089 | 20260914 | JomCheck sharing and fee | Part |
| EAINT-10937 | 20260914 | Service Portal JomCheck | Part |
| EAINT-11175 | 20260914 | BO credit company permissions | - |
| EAINT-11757 | 20260914 | JomCheck credit company API | No |
| EAINT-12042 | 20260914 | Wholesale STMS reference no | No |
| EAINT-12279 | 20260914 | Wholesale JomCheck price | No |
| EAINT-12155 | 20260910 | Password rule, all portals | Yes |
| EAINT-12171 | 20260910 | Insurance cron interval | Dev |
| EAINT-12260 | 20260910 | e-Invoice revenue report | Dev |
| EAINT-12200 | 20260902(PM) | Wholesale bot v2 | - |
| EAINT-12109 | 20260902(PM) | Wholesale chatbot /help | - |
| EAINT-12198 | 20260902(PM) | Wholesale JomCheck availability | - |
| EAINT-12224 | 20260902(PM) | Wholesale photo listing | - |
| EAINT-11982 | 20260902(AM) | Application [Extend] button | Yes |
| EAINT-12232 | 20260902(AM) | Pre-Application Fiuu popup | No |
| EAINT-11864 | 20260820 | Insurance email reminder | No |
| EAINT-12054 | 20260820 | STMS bulk SSM check | No |
| EAINT-12131 | 20260820 | BO CSE special remark | No |
| EAINT-12214 | 20260820 | e-Invoice LHDN certificate | Mon |
| EAINT-11952 | 20260817 | BO user access | No |
| EAINT-12031 | 20260817 | STMS bulk | No |
| EAINT-12055 | 20260817 | BO reconciliation exclusion | No |
| EAINT-12058 | 20260817 | CIBO listing columns | Yes |
| EAINT-12113 | 20260817 | BO recon SSM data | No |
| EAINT-12126 | 20260813 | e-Invoice field validation | Mon |
| EAINT-11979 | 20260813 | BO remove Verify button | No |
| EAINT-11978 | 20260813 | Application showroom address | Part |
| EAINT-3170 | 20260813 | Insurance JPJ status cron | Dev |
| EAINT-11998 | 20260812 | Wholesale template | - |
| EAINT-12000 | 20260812 | Wholesale re-fire | Yes |
| EAINT-11999 | 20260812 | Wholesale marketing module | Yes |
| EAINT-12113 | 20260810 | BO recon SSM data | No |
| EAINT-11757 | 20260810 | JomCheck credit company API | No |
| EAINT-11175 | 20260810 | BO permission checkboxes | Part |
| EAINT-10937 | 20260810 | Service Portal JomCheck | Part |
| EAINT-10089 | 20260810 | JomCheck fee RM20 | Part |

### 11.2 2026-04-08 to 2026-07-31

| Key | Date | Module | Verified |
|---|---|---|---|
| EAINT-12102 | 20260731 | UCD Service Tax, Device Purchase Step 2 | Yes |
| EAINT-12105 | 20260731 | Service Hub email CC | No |
| EAINT-684 | 20260731 | BO JPJ XML Log (BMK) | Yes |
| EAINT-3425 | 20260731 | BO BMK CSV RHB ID | No |
| EAINT-10960 | 20260727 | Software Installation module | Yes |
| EAINT-11870 | 20260727 | Wholesale chatbot hybrid assist | Yes |
| EAINT-11890 | 20260727 | Wholesale list by photo | Yes |
| EAINT-11880 | 20260727 | Biometric Device Purchase module | Yes |
| EAINT-12018 | 20260727 | BO recon summary Service Hub | Yes |
| EAINT-12045 | 20260727 | UCD Download Payment Document | Yes |
| EAINT-12046 | 20260727 | UCD Payment Breakdown Report | Yes |
| EAINT-12053 | 20260727 | UCD Payment Report | Yes |
| EAINT-11888 | 20260721 | Wholesale chatbot resend | No |
| EAINT-11949 | 20260721 | Wholesale logistics v1 removal | - |
| EAINT-11987 | 20260721 | UCD Wholesale STMS message | Yes |
| EAINT-11887 | 20260708 | BO recon summary permission | No |
| EAINT-11877 | 20260708 | Wholesale chatbot checking | No |
| EAINT-11857 | 20260708 | Wholesale photo PDF | No |
| EAINT-11835 | 20260708 | UCD user guidelines | Yes |
| EAINT-11763 | 20260708 | Application document | No |
| EAINT-11731 | 20260708 | Wholesale logistics | No |
| EAINT-10164 | 20260708 | BO UCD Group label | Part |
| EAINT-5972 | 20260708 | Pre-Application enhancement | Yes |
| EAINT-11860 | 20260715 | Wholesale auto-recommend | No |
| EAINT-11862 | 20260715 | BO Alternative Vehicle | Yes |
| EAINT-11872 | 20260715 | UCD eSTM recommendation message | Yes |
| EAINT-11885 | 20260715 | Wholesale photo/PDF | No |
| EAINT-11886 | 20260715 | Wholesale inbound cap | - |
| EAINT-11829 | 20260630 | Application cron to Expired | Yes |
| EAINT-11536 | 20260630 | Pre-App/App listing columns | Yes |
| EAINT-10168 | 20260630 | BO Reconciliation Summary | Yes |
| EAINT-9117 | 20260630 | Insurance WhatsApp sender | Mon |
| EAINT-9064 | 20260630 | Secarang Macrokiosk message | Yes |
| EAINT-8669 | 20260630 | Macrokiosk insurance messaging | Mon |
| EAINT-4328 | 20260630 | eSTM Slip Pengesahan Dari/Hingga | Yes |
| EAINT-3210 | 20260630 | BO STMS CSV columns | Yes |
| EAINT-1245 | 20260630 | BO JomCheck listing date | Yes |
| EAINT-639 | 20260630 | JPJ monthly report cron | Dev |
| EAINT-10168 | 20260624 | BO Reconciliation Summary | Part |
| EAINT-10435 | 20260624 | Insurance Lonpac sum insured | Part |
| EAINT-11057 | 20260618 | STMS usage code | Yes |
| EAINT-11758 | 20260618 | BO Application assignee | No |
| EAINT-11719 | 20260615 | Wholesale legal documents | Yes |
| EAINT-11755 | 20260615 | Wholesale eSTM block | No |
| EAINT-11756 | 20260615 | Wholesale STMS flags | No |
| EAINT-11781 | 20260615 | APT index | Yes |
| EAINT-8700 | 20260610 | BO Credit Note | Yes |
| EAINT-9860 | 20260610 | Wholesale listing (with 10099, 10481) | Yes |
| EAINT-9842 | 20260603 | BO bypass SSM audit log | Yes |
| EAINT-10038 | 20260603 | BO super admin role | No |
| EAINT-11499 | 20260603 | BO MVD agreement access | No |
| EAINT-11558 | 20260603 | BO transaction restriction patch | Yes |
| EAINT-7495 | 20260520 | UCD Payment Report | Yes |
| EAINT-9715 | 20260520 | AATF Payment Report | Yes |
| EAINT-9642 | 20260520 | JPJ receipt number column | Yes |
| EAINT-9840 | 20260520 | CIBO permissions | Yes |
| EAINT-9900 | 20260520 | CIBO Referred Risk Log export | Yes |
| EAINT-9979 | 20260520 | CIBO Transaction export | Yes |
| EAINT-10052 | 20260520 | CIBO Payment Report export | Yes |
| EAINT-11494 | 20260520 | BO MVD agreement access | - |
| EAINT-10435 | 20260511 | Insurance Lonpac sum insured | - |
| EAINT-3090 | 20260506 | UCD Payment Breakdown Report | Yes |
| EAINT-7496 | 20260506 | UCD report (zero data) | Yes |
| EAINT-10935 | 20260506 | Audit log concurrency | No |
| EAINT-11069 | 20260506 | Proforma [Mark as Paid] | No |
| EAINT-11073 | 20260506 | UCD Payment Breakdown info | No |
| EAINT-11143 | 20260506 | Invoice number rotation | Mon |
| EAINT-11144 | 20260506 | Invoice download error | Yes |
| EAINT-10082 | 20260429 | Insurance commission WhatsApp | No |
| EAINT-10520 | 20260429 | Invoice queue | Mon |
| EAINT-10966 | 20260429 | Insurance HP listing | Mon |
| EAINT-11043 | 20260429 | Secarang discount code | Waive |
| EAINT-8646 | 20260427 | BO SSM XML Log | Yes |
| EAINT-9247 | 20260427 | SSM for LLP | Yes |
| EAINT-10691 | 20260427 | SSM invoice SST | Part |
| EAINT-10942 | 20260427 | BO transaction restriction | Waive |
| EAINT-10690 | 20260421 | Takaful policy email | No |
| EAINT-10919 | 20260421 | UCD typo | Yes |
| EAINT-6762 | 20260421 | BO company audit log (with 10920) | Yes |
| EAINT-10921 | 20260421 | DB load fix | Part |
| EAINT-10922 | 20260421 | JomCheck pricing names | Part |
| EAINT-10929 | 20260421 | BO audit trail | Yes |
| EAINT-8638 | 20260415 | BO JomCheck Report Listing | Yes |
| EAINT-10510 | 20260415 | BO transaction restriction patch | Yes |
| EAINT-10515 | 20260415 | BO restriction view by role | Yes |
| EAINT-10519 | 20260415 | Insurance Chubb age limit | Waive |
| EAINT-9044 | 20260408 | Transaction Restriction setting | Yes |
| EAINT-9555 | 20260408 | Logo update | Yes |
| EAINT-10187 | 20260408 | Takaful PDS | Yes |

### 11.3 2025-10-13 to 2026-04-01

| Key | Date | Module | Verified |
|---|---|---|---|
| EAINT-10044 | 20260401 | Insurance Chubb sum insured | Yes |
| EAINT-9641 | 20260401 | Chubb API TIN | Yes |
| EAINT-9611 | 20260401 | Insurance API inception date | Yes |
| EAINT-9951 | 20260325 | Service Portal HP listing | Yes |
| EAINT-6475 | 20260318 | JomCheck chassis search | Part |
| EAINT-9845 | 20260318 | Consolidated e-Invoice cron | Waive |
| EAINT-10120 | 20260318 | Synology revenue cron | Waive |
| EAINT-10112 | 20260316 | SSL cert, thumbprint | Yes |
| EAINT-10126 | 20260316 | Fiuu retry payment | Mon |
| EAINT-8011 | 20260311 | JPJ TLS 1.2 | Part |
| EAINT-9141 | 20260311 | Chubb MY CAR plus plan UI | Yes |
| EAINT-10024 | 20260311 | BO Pre-App director display | Yes |
| EAINT-10061 | 20260311 | BO Application listing LHDN filter | Part |
| EAINT-10062 | 20260311 | e-Invoice listing Application type | Part |
| EAINT-10063 | 20260311 | BO existing director display | Yes |
| EAINT-10067 | 20260311 | SSL cert, Dermalog | Yes |
| EAINT-10066 | 20260309 | Slip Pengesahan on JPJ modules | Yes |
| EAINT-9786 | 20260302 | JomCheck API spec 1.6 | Part |
| EAINT-8780 | 20260225 | Pre Onboarding Form | Yes |
| EAINT-9158 | 20260225 | Application form upload | Yes |
| EAINT-9560 | 20260225 | Hari Raya campaign popups | Yes |
| EAINT-9618 | 20260128 | FI flow HP backward mapping | Yes |
| EAINT-9712 | 20260128 | FI eSTM flow tagging | Yes |
| EAINT-9204 | 20260122 | JPJ Official Receipt | Yes |
| EAINT-9714 | 20260122 | Insurance EC sequence | Yes |
| EAINT-9720 | 20260122 | FI insurance Step 1 | No |
| EAINT-8802 | 20260114 | SSM bypass | Yes |
| EAINT-9233 | 20260114 | BO default permissions | Yes |
| EAINT-9627 | 20260114 | Backend thread fix | Part |
| EAINT-9208 | 20251229 | FI eSTM flow | Yes |
| EAINT-9636 | 20260112 | eLKM/eVOC optional | Yes |
| EAINT-7229 | 20260105 | Web socket signing certificate | Yes |
| EAINT-7229 | 20251217 | Web socket replaces applet (3 tabs) | Yes |
| EAINT-9103 | 20251210 | Service Portal redesign | Part |
| EAINT-9332 | 20251210 | Service Portal timestamp | Yes |
| EAINT-8735 | 20251124 | BO company CSV | Yes |
| EAINT-8742 | 20251124 | BO decision maker validation | Yes |
| EAINT-8781 | 20251124 | BO AATF listing filter | Yes |
| EAINT-8773 | 20251124 | AATF showroom listing | Yes |
| EAINT-9081 | 20251124 | Tokio Marine JPJ status | No |
| EAINT-8699 | 20251124 | Service Portal eSTM display | Part |
| EAINT-8655 | 20251029 | eDereg Pre-Check e-Invoice | Part |
| EAINT-9043 | 20251029 | eDereg invoice | Part |
| EAINT-9063 | 20251029 | e-Invoice listing filter | Part |
| EAINT-8536 | 20251029 | Insurance failed cover note WhatsApp | No |
| EAINT-8756 | 20251029 | Invoice address | Yes |
| EAINT-8523 | 20251022 | Hak Milik cron | Yes |
| EAINT-8657 | 20251022 | CIBO listing fields | Yes |
| EAINT-8956 | 20251022 | CIBO listing fields | Yes |
| EAINT-9051 | 20251022 | eSTM invoice speed | Yes |
| EAINT-8852 | 20251013 | IP/Telco SSM x eSTM | No |
| EAINT-8851 | 20251013 | IP/Telco SSM x STMS | No |
| EAINT-8850 | 20251013 | IP/Telco Transfer History | No |
| EAINT-8833 | 20251013 | IP/Telco BMK | Dev |
| EAINT-8774 | 20251013 | BO validation | Yes |
| EAINT-8686 | 20251013 | JomCheck API 1.4 | No |
| EAINT-8627 | 20251013 | Company address update | Yes |
| EAINT-8620 | 20251013 | Hotline number | Yes |
| EAINT-8550 | 20251013 | Invoice template, no TIN | Yes |
| EAINT-8538 | 20251013 | Proforma payment slip | Yes |
| EAINT-8514 | 20251013 | e-Invoice batch cron | No |
| EAINT-9012 | 20251013 | JPJ message sender | No |
| EAINT-9013 | 20251013 | Insurance banner | Waive |

### 11.4 2025-01-15 to 2025-09-22

| Key | Date | Module | Verified |
|---|---|---|---|
| EAINT-8830 | 20250922 | IP/Telco Insurance | No |
| EAINT-8031 | 20250922 | SSM financial info | No |
| EAINT-8831 | 20250922 | SSM e-Invoice code | Part |
| EAINT-8822 | 20250922 | Lonpac ID mismatch | Yes |
| EAINT-8834 | 20250922 | Lonpac unhide | Yes |
| EAINT-8770 | 20250918 | Wholesale IP/Telco | Dev |
| EAINT-8668 | 20250826 | APT resubmit cron | Mon |
| EAINT-8687 | 20250826 | JomCheck duplicate submit | No |
| EAINT-8644 | 20250826 | BO decision maker, showroom | Yes |
| EAINT-8645 | 20250826 | BO CSV decision maker | Yes |
| EAINT-7584 | 20250826 | Tomcat non-root | Part |
| EAINT-7585 | 20250826 | MySQL non-root | Part |
| EAINT-8659 | 20250813 | e-Invoice document code | No |
| EAINT-8549 | 20250731 | Consolidated e-Invoice listing | Yes |
| EAINT-8582 | 20250731 | MyInvois buyer name | No |
| EAINT-8534 | 20250731 | eLKM sub-user limit | No |
| EAINT-8409 | 20250731 | eDereg fee RM5 | Yes |
| EAINT-7199 | 20250731 | Secarang receipt templates (with 8331, 8334) | Part |
| EAINT-8564 | 20250728 | TnG winner popup | Yes |
| EAINT-8570 | 20250728 | Hide popups | Yes |
| EAINT-8571 | 20250728 | eAuto TIN on Contact Us | Yes |
| EAINT-8572 | 20250728 | Profile update popup wording | Yes |
| EAINT-8578 | 20250728 | BO MVD agreement button | No |
| EAINT-8491 | 20250714 | e-Invoice resubmit cron | Yes |
| EAINT-8526 | 20250714 | SSM permission by user | No |
| EAINT-8532 | 20250714 | SSM permission, mobile app | No |
| EAINT-8539 | 20250714 | Hide Lonpac | Yes |
| EAINT-8540 | 20250714 | Secarang hide Lonpac | Yes |
| EAINT-2450 | 20250630 | e-Invoice STMS and TH | Part |
| EAINT-7576 | 20250630 | e-Invoice eSTM/eVOC/eLKM | Part |
| EAINT-7577 | 20250630 | SSM e-Invoice label | Part |
| EAINT-7579 | 20250630 | e-Invoice APT | Part |
| EAINT-7580 | 20250630 | e-Invoice JomCheck | Part |
| EAINT-7581 | 20250630 | e-Invoice SSM | Part |
| EAINT-7582 | 20250630 | e-Invoice Dereg | Part |
| EAINT-7583 | 20250630 | Proforma Invoice module | Part |
| EAINT-7609 | 20250630 | Insurance e-Invoice fields | Part |
| EAINT-7980 | 20250630 | CIBO e-Invoice fields | Yes |
| EAINT-7981 | 20250630 | Secarang e-Invoice fields | Yes |
| EAINT-8406 | 20250630 | e-Invoice class code | No |
| EAINT-8407 | 20250630 | LHDN failed remarks | Part |
| EAINT-8410 | 20250630 | TIN handling | No |
| EAINT-7578 | 20250618 | e-Invoice BMK | Part |
| EAINT-8183 | 20250618 | Insurance campaign removal | Yes |
| EAINT-5459 | 20250612 | AATF eDereg Pre-Check | Yes |
| EAINT-5676 | 20250612 | BO eDereg Pre-Check | Yes |
| EAINT-7935 | 20250612 | JPJ Hasil eDereg report | Part |
| EAINT-8099 | 20250612 | BO JPJ Hasil audit log | Yes |
| EAINT-8124 | 20250612 | BO RHB Payment Transaction | No |
| EAINT-8066 | 20250528 | TIN min 9 characters | Yes |
| EAINT-6585 | 20250519 | Onboarding e-Invoice fields | Yes |
| EAINT-6499 | 20250519 | Pre-eInvoice phase 1 | Yes |
| EAINT-7918 | 20250519 | Address change popup | Yes |
| EAINT-7959 | 20250519 | Invoice address | Yes |
| EAINT-7956 | 20250519 | Hide RHB quote | Yes |
| EAINT-7809 | 20250519 | Invoice address KL | Yes |
| EAINT-6673 | 20250519 | Insurance invoice to receipt | Part |
| EAINT-7248 | 20250519 | WhatsApp recipient JPJ rejected | No |
| EAINT-6544 | 20250519 | Interstate listing Elastic Search | Yes |
| EAINT-6770 | 20250416 | RHB API resume (eAuto) | Yes |
| EAINT-6771 | 20250416 | RHB API resume (Secarang) | Yes |
| EAINT-6842 | 20250416 | Insurance campaign message | Yes |
| EAINT-7031 | 20250416 | Secarang renew reminder template | - |
| EAINT-7345 | 20250416 | Secarang reminder recipients | - |
| EAINT-6014 | 20250407 | Mobile app phase 2 BE | Part |
| EAINT-6475 | 20250319 | JomCheck chassis search | - |
| EAINT-5930 | 20250319 | Digital onboarding wizard | Yes |
| EAINT-5749 | 20250319 | Onboarding wording | Yes |
| EAINT-7063 | 20250319 | Onboarding input fix | Yes |
| EAINT-7064 | 20250319 | Onboarding upload fix | Yes |
| EAINT-7065 | 20250319 | Onboarding validation | Yes |
| EAINT-7116 | 20250319 | BO onboarding error message | Yes |
| EAINT-4932 | 20250312 | Tokio Marine motorbike | Yes |
| EAINT-6646 | 20250312 | Chubb unhide on eLKM error | No |
| EAINT-5687 | 20250312 | BO edit onboarding form | Yes |
| EAINT-5843 | 20250312 | UCD Application Listing | Yes |
| EAINT-5845 | 20250312 | Application status | Yes |
| EAINT-6859 | 20250312 | Onboarding ROC check | Yes |
| EAINT-4902 | 20250303 | Insurance quote control | Yes |
| EAINT-6598 | 20250303 | Secarang support contact | Part |
| EAINT-6608 | 20250303 | Secarang hide road tax | Yes |
| EAINT-6610 | 20250303 | Secarang WhatsApp recipients | No |
| EAINT-6611 | 20250303 | Secarang hide chatbot | Yes |
| EAINT-6501 | 20250303 | Secarang quote control | Yes |
| EAINT-6542 | 20250303 | JomCheck OTP sub user | No |
| EAINT-6545 | 20250303 | Insurance OTP removal | No |
| EAINT-6778 | 20250303 | SSM purchase 1940 UCDs | Yes |
| EAINT-5376 | 20250224 | eSTM buyer identity (SSM) | Yes |
| EAINT-6574 | 20250224 | SSM permission 971 UCDs | Yes |
| EAINT-6439 | 20250224 | SSM duplicate payment | No |
| EAINT-6629 | 20250224 | Do not call RHB insurance API | Yes |
| EAINT-6369 | 20250220 | Lonpac API code | Part |
| EAINT-6435 | 20250220 | Lonpac unhide eLKM error | No |
| EAINT-5566 | 20250122 | Mobile app phase 1 BE | - |
| EAINT-5776 | 20250122 | Chubb API 1 of 3 | No |
| EAINT-5816 | 20250122 | Chubb API 2 of 3 | Yes |
| EAINT-5817 | 20250122 | Chubb API 3 of 3 | Yes |
| EAINT-5155 | 20250115 | STMS seller identity (SSM) | Yes |
| EAINT-5861 | 20250115 | Homepage announcement | Yes |
| EAINT-6086 | 20250115 | SSM permission 200 UCDs | Yes |
| EAINT-5874 | 20250115 | Wholesale landing page | Yes |

Older sheets (2023 to 2024, 100+ more CRs) were read for sections 2 to 9 but are not
indexed here. Open the workbook tab by date if a precedent is needed.
