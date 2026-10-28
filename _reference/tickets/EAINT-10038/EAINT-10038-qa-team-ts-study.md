# EAINT-10038 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-10038 - [eAuto] To Update Super Admin User Role.md` (captured 27/10/2026, 9:00:03 pm). Cell text only; formatting, colours and images not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-10038/EAINT-10038-jira.md` (captured 27/10/2026, 5:23:56 pm). No attachments listed; **no SRD** exists for this ticket.
3. **Knowledge:** `knowledge/flow-bo-shell.md` §4.3 items 6–7, `knowledge/business-rules-from-test-scenarios.md` item 10, `knowledge/cr-test-scenario-catalogue.md` row 003, `knowledge/flow-apt.md` lines 52/64, `knowledge/flow-stms.md` lines 289/302, `knowledge/production-regression-scope.md` line 953.
4. **lib/ticketStudies.ts:** no entry for EAINT-10038.
5. **Not read:** the original .xlsx (only the text copy). Cell colours, comments and any hidden sheets are unknown.

## 1. Header

1. **Ticket:** EAINT-10038 — "🔴[eAuto] To Update Super Admin User Role" (Jira Summary). Type Task, Status Done, Priority Medium.
2. **Portal:** **BackOffice (BO)**. Jira Description: "Portals Affected: - BO Portal".
3. **Workbook:** "EAINT-10038 - [eAuto] To Update Super Admin User Role.xlsx", library "eAuto - CR Test Scenarios", modified 28/05/2026, 5:46:01 pm.
4. **Sheets:** "Test Scenario" (11 step rows, R2–R12) and "access ref" (menu access matrix, R3–R115).
5. **Scenarios:** **5** (10038_TS01 – 10038_TS05). TS04 and TS05 span 4 step rows each.
6. **Results:** **11 of 11 step rows "Pass"**, so **5 of 5 scenarios Pass**. No Fail rows.
7. **Tester:** QA column "Aliah" on every row (Jira QA field: "Aliah Maisarah"). No test date written in the sheet.
8. **Dates (Jira):** created 2026-03-04; ready for testing 2026-05-21; ETA for Testing 2026-05-22; deployed to Production 2026-06-03, fix version "S30.1-20260603🌞".

## 2. What the ticket changed

1. **Two BO accounts removed from Super Admin.** Jira Description: "Remove the above two Back Office user accounts from the Super Admin user role" for "Hong Kee (Login ID: onghongkee)" and "Rosalind (Login ID: rosalindkhoo)".
2. **As the TS shows it:** after the change both accounts have **Hub Admin** access. Test Scenario R2 and R3: "Ensure that the account have the same access as Hub Admin".
3. **Super Admin itself unchanged.** A remaining Super Admin (jasons) keeps full access. Test Scenario R4: "Ensure that the account have the access of a Super Admin role".
4. **Accounts also deactivated in the TS.** TS04/TS05 untick "Activate" on both accounts and confirm they cannot log in. The Jira Description does not ask for deactivation. Whether this was a required change or only a test of the edit screen is **[unconfirmed]**.
5. **Data-only change.** No code, screen or SRD; it is a role assignment on two production accounts. [unconfirmed — inferred from the Description and the "Support" label]

## 3. Scenarios

### A. Role access after the change

1. **10038_TS01** — login BO as onghongkee → "Ensure that the account have the same access as Hub Admin". Pass.
2. **10038_TS02** — login BO as rosalindkhoo → "Ensure that the account have the same access as Hub Admin". Pass.
3. **10038_TS03** — login BO as jasons → "Ensure that the account have the access of a Super Admin role". Pass.

### B. Deactivate the account (as jasons, Super Admin)

1. **10038_TS04** (onghongkee):
   1. Manage Back Office User Account → Login ID "onghongkee" → Search → "User Account Listing will be displayed." (R5)
   2. "Edit" hyperlink in Action column → "User will be redirected to Update User Page" (R6)
   3. Untick Activate → Update → Logout → "Account Status for Login ID onghongkee will be Inactive" (R7)
   4. Login as onghongkee → "User unable to login as account status is Inactive" + pop-up "Unable to login. Please contact your supervisor or admin." (R8)
2. **10038_TS05** (rosalindkhoo): same four steps (R9–R12). R11 expected result still names **onghongkee** — a copy error in the sheet; it should read rosalindkhoo. [unconfirmed — inferred from R9 and R12]

## 4. Business rules and system behaviour

1. **Inactive BO login message.** "User unable to login as account status is Inactive ⏎ ⏎ An error pop-up message will be displayed as "Unable to login. Please contact your supervisor or admin."" (Test Scenario, R8; same at R12).
2. **Deactivation path.** "Navigate to Manage Back Office User Account ⏎ In Login ID field, enter onghongkee ⏎ Click Search button" → "Click on the "Edit" hyperlink in the Action column" → "Untick the Activate checkbox. ⏎ Click the Update button" (Test Scenario, R5–R7).
3. **Account status values.** "Account Status for Login ID onghongkee will be Inactive" (Test Scenario, R7). The edit page is titled "Update User Page" (R6).
4. **Role matrix columns.** Header row: "Sub-Menu | Jason Seah ⏎ SuperAdmin | Ong Hong Kee ⏎ Hub Admin | HUB ADMIN" (access ref, R3). Columns 2 and 3 are identical on every row, confirming onghongkee = Hub Admin.
5. **Menus Super Admin only (✔ | ✘ | ✘), by category (access ref):**
   1. **Account Management:** "Company Account Listing (Limited Features For UCD To UCD)" (R11), "Manage AATF/PBT Account" (R12).
   2. **Reports:** "JPJ Reports" (R15), "Account Balance Summary" (R16), "Account Balance Summary (Month / Year)" (R17), "Account Deposit / Adjustment Report" (R18), "Company POB Balance Report" (R19), "POB Payment Report" (R20), "Statement of Account (UCD)" (R21), "Transaction Summary Report" (R22), "Transaction Summary Report (State)" (R23), "Interim Payment Report" (R25), "Inter-Branch Transfer History Report" (R27).
   3. **Support Tools:** "RHB Reconciliation Audit Log" (R65), "JPJ Hasil Audit Log" (R66).
   4. **Proforma Invoice / e-Invoice:** "Generate Proforma Invoice" (R79), "Proforma Invoice / e-Invoice Listing" (R80).
   5. **Settings (Hub Admin):** "Bulk Submission Setup (JPJ Enquiry, Payment)" (R103), "Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log" (R104), "Bulk Submission Control for System Maintenance" (R105), "Bypass Purchase SSM (STMS & eSTM)" (R106), "JomCheck Report Listing" (R107).
   6. **JPJ Reports (whole category, R108):** all seven items R109–R115, incl. "eAuto Reconciliation Summary Report" (R109) and "JPJ eSTM Report (HASIL)" (R115).
6. **Menus both roles see (✔ | ✔ | ✔):** every other row, e.g. "Manage Backoffice User Accounts" (R6), "Vehicle Movement Report (UCD)" (R24), "Reset Payment Report" (R26), all Insurance, Onboarding, Transactions Relevant, eAuto Plus Relevant and Settings rows, "Manual APT Trigger" (R68), "Customize Display Message" (R102).
7. **No row is Hub Admin only.** No row shows ✘ for Super Admin.

### Where this touches existing knowledge

1. **flow-bo-shell.md §4.3 item 6 and business-rules item 10** list only six Super-Admin-only menus and cite "rows 3-32" / "rows 11-23". The sheet has **about 30** Super-Admin-only rows (item 5 above). The knowledge list is incomplete, not wrong.
2. **flow-bo-shell.md item 6 conflict** (2026-08-21 Hub Admin capture shows Company Account Listing (Limited…), Manage AATF/PBT Account and JPJ Reports) stays open. The matrix was written ~May 2026; the conflict is not resolved by this TS. [unconfirmed]
3. **flow-apt.md line 64** says Manual APT Trigger is "visible only to SuperAdmin and Hub Admin". The matrix compares only these two roles, so it **does not prove "only"**. Other roles are not tested.
4. **flow-stms.md line 289** ("JPJ Reports is SuperAdmin only") matches R15 and R108–R115.

## 5. Test data, environment, accounts

1. **Accounts:** onghongkee, rosalindkhoo (the two changed accounts), jasons (Super Admin, used to edit). Login ID column only; **no passwords in the sheet**.
2. **Environment:** not written in the sheet. Jira comment, developer, 2026-05-21: "ready for testing in staging/uat3".
3. **Setup:** none beyond the role change. TS04/TS05 leave both accounts **Inactive** on the test environment; no step reactivates them.

## 6. Gaps and risks for regression

1. **Menu-by-menu check not recorded.** TS01–TS03 have one expected line each; the sheet does not show each menu was opened. Regression should spot-check a few ✔/✘ rows per role.
2. **Direct URL access not tested.** Hidden menus were not tested by typing the page URL as Hub Admin. Per flow-bo-shell §4.3 the menu is filtered by CSS class (`$("div."+_userRole).show()`), so a hidden menu may still open by URL. [unconfirmed]
3. **No reactivation scenario.** Ticking Activate again and logging in is not covered.
4. **Other roles not covered.** Normal/Admin BO roles are absent from the matrix.
5. **Existing session not covered.** Behaviour of a user already logged in when deactivated or when the role changes is untested.
6. **R11 copy error** (onghongkee in TS05) — a reader may verify the wrong account.
7. **Production effect.** The change targets real named accounts. Prod regression (production-regression-scope.md line 953) marks it "No" for regression; no prod check is recorded here.

## Knowledge candidates

1. **Full Super-Admin-only menu list** for `knowledge/flow-bo-shell.md` §4.3 item 6 and `business-rules-from-test-scenarios.md` item 10 — replace the six-item list with section 4 item 5 above. Source: `[from SharePoint TS #003 EAINT-10038, sheet access ref, R11–R12, R15–R23, R25, R27, R65–R66, R79–R80, R103–R107, R108–R115]`.
2. **No Hub-Admin-only menu exists** (no ✘ under SuperAdmin). Source: `[from SharePoint TS #003 EAINT-10038, sheet access ref, R3–R115]`.
3. **BO deactivation path**: Manage Back Office User Account → search Login ID → "Edit" in Action column → "Update User Page" → untick "Activate" → Update → status "Inactive". Source: `[from SharePoint TS #003 EAINT-10038, sheet Test Scenario, R5–R7]`. Candidate for `knowledge/flow-bo-shell.md`.
4. **Fix the citation row ranges** in flow-bo-shell.md ("rows 3-32") and business-rules item 10 ("rows 11-23"): the six named menus sit at R11, R12, R15, R16, R21, R22.
5. **Soften flow-apt.md line 64 "only"** — the matrix compares SuperAdmin and Hub Admin only. Source: `[from SharePoint TS #003 EAINT-10038, sheet access ref, R3]`.
6. **Ticket record:** removal of onghongkee and rosalindkhoo from Super Admin, deployed "S30.1-20260603", Production 03.06.2026. Source: Jira Description; comment, ticket reporter, 2026-06-03: "This ticket has been pushed to Production on 03.06.2026 (Wednesday)."
