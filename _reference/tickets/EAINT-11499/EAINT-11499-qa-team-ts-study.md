# EAINT-11499 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-11499 - [eAuto-BackOffice] Enable MVD Agreement Access Controls for CSE.md` (cell text only; formatting and images not kept).
2. **knowledge/** grep for EAINT-11499: `business-rules-from-test-scenarios.md:705-708`, `cr-test-scenario-catalogue.md:221, 352`, `production-regression-scope.md:954`.
3. **Module context:** `knowledge/eauto-portals.md:31-39, 279-282` (BO roles), `knowledge/flow-ucd-company-listing.md` (Manage Company Accounts), `knowledge/flow-company-profile-einvoice.md:28-34` and `knowledge/flow-ucd-onboarding.md:649` (where the MVD Agreement is signed).
4. **Not found:** `_reference/tickets/EAINT-11499/` had no files before this study; `_reference/tickets/Studying/EAINT-11499/` does not exist; `lib/ticketStudies.ts` has no entry for EAINT-11499.
5. **Not read:** the Jira ticket and SRD (no local copy; this run is unattended and works from local files only). The original `.xlsx` at `_reference/sharepoint/eauto-cr-test-scenarios/` was not opened; the text copy was used.

## 1. Header

1. **Ticket:** EAINT-11499.
2. **Module / portal:** eAuto **Back Office (BO)** → Account Management → Manage Company Accounts → Company Details → **MVD Agreement** button.
3. **Workbook:** "EAINT-11499 - [eAuto-BackOffice] Enable MVD Agreement Access Controls for CSE.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 24/06/2026, 5:57:31 pm.
4. **Sheets:** one — "Test Scenario".
5. **Columns (R1):** "TS No. | Test Scenario & Steps | Login ID | Expected Result | QA | Test Result (P/F)".
6. **Scenarios:** **9** (11499_TS01 – 11499_TS09).
7. **Results:** **9 Pass, 0 Fail** (column "Test Result (P/F)", R2–R10).
8. **Tester:** QA column reads "Aliah" on every row (a QA engineer on the team).
9. **Dates:** none written in the sheet. Environment: not stated in the sheet.

## 2. What the ticket changed, as the TS shows it

1. **CSE users get view-only access** to the MVD Agreement from BO Company Details. They see the **UCD version without the thumbprint** and **cannot download** it (TS01–TS05).
2. **An authorised user (jasons) can download** the full MVD document, which **includes the MyKad picture and thumbprint** (TS06).
3. **Everyone else does not see the button** — Hub Admin, Admin and Probation (TS07–TS09).

## 3. Scenarios

### A. CSE — view only, no thumbprint, no download

1. **11499_TS01** — login "eautochinwei" → expected "User able to click on the MVD Agreement. ⏎ The agreement displayed is the UCD Version, where there is no thumbprint. ⏎ ⏎ Ensure that user have a read-only access and is unable to download the document." → Pass.
2. **11499_TS02** — login "eautohamal" → same expected result → Pass.
3. **11499_TS03** — login "eautoxiayuan" → same expected result → Pass.
4. **11499_TS04** — login "kokping" → same expected result → Pass.
5. **11499_TS05** — login "eautomie" → same expected result → Pass.

### B. Authorised download — full document

6. **11499_TS06** — login "jasons" → expected "System will initiate the download of the MVD Document." and "Ensure that the MVD Agreement includes the picture of MyKad and the thumbprint" → Pass.

### C. Unauthorised — button hidden

7. **11499_TS07** — "Any other HubAdmin not specified" → "The button will not appear for unauthorised user" → Pass.
8. **11499_TS08** — "Any other Admin not specified" → same → Pass.
9. **11499_TS09** — "Any Probation not specified" → same → Pass.

## 4. Business rules and system behaviour

1. **Navigation path:** "Login to Back Office ⏎ Navigate to Account Management > Manage Company Accounts ⏎ Search for a Company Name ⏎ e.g INOFIX SDN BHD ⏎ ⏎ In the Company Account Listing, click on the Company Name to go to the Company Details Page ⏎ Click on the MVD Agreement button." `[sheet Test Scenario, R2]`
2. **CSE view:** "The agreement displayed is the UCD Version, where there is no thumbprint." `[sheet Test Scenario, R2–R6]`
3. **CSE restriction:** "Ensure that user have a read-only access and is unable to download the document." `[sheet Test Scenario, R2–R6]`
4. **Authorised download:** "System will initiate the download of the MVD Document." `[sheet Test Scenario, R7]` — the click downloads; it does not open a viewer.
5. **Full document content:** "Ensure that the MVD Agreement includes the picture of MyKad and the thumbprint" `[sheet Test Scenario, R7]`
6. **Unauthorised users:** "Unauthorised user will not have the permission to view or download the MVD Agreement ⏎ The button will not appear for unauthorised user" `[sheet Test Scenario, R8–R10]`
7. **Two versions of the agreement exist:** a "UCD Version" without thumbprint, and a full version with MyKad picture and thumbprint `[sheet Test Scenario, R2, R7]`. [unconfirmed] The UCD version is likely the one the main user reads at Profile Step 3 before thumbprint verification (`knowledge/flow-company-profile-einvoice.md:34`).
8. **Role reading [unconfirmed]:** "jasons" is listed as an **Ops** login in `knowledge/eauto-portals.md:34`, so the authorised download role is likely Ops. The TS does not name the role.

## 5. Test data, environments, accounts, setup

1. **Company:** "e.g INOFIX SDN BHD" `[sheet Test Scenario, R2–R10]` — any company with a signed MVD Agreement is implied [unconfirmed].
2. **Accounts named:** eautochinwei, eautohamal, eautoxiayuan, kokping, eautomie (CSE), jasons (authorised). Generic: "Any other HubAdmin not specified", "Any other Admin not specified", "Any Probation not specified".
3. **Credentials:** none in the sheet (login IDs only).
4. **Environment:** not stated.

## 6. Gaps and risks for regression

1. **CSE login not tested:** `knowledge/eauto-portals.md:36` lists **eautojrjaya** as CSE; it is not in TS01–TS05.
2. **Only one authorised user tested:** jasons. The other Ops logins in `knowledge/eauto-portals.md:34` (kmcheah, mfared, nikmuhamad, eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni) were not checked. Whether all Ops can download is unknown [unconfirmed].
3. **Super Admin not covered.** EAINT-10038 gives Super Admin its own menus (`knowledge/business-rules-from-test-scenarios.md:700-704`); its MVD access is not tested here.
4. **Finance login not covered** — a separate login per `knowledge/eauto-portals.md:280`.
5. **"Read-only, unable to download" has no stated method.** No check of right-click save, browser PDF toolbar, print, or the direct document URL. A CSE could still save the file if the viewer allows it [unconfirmed].
6. **No negative company case:** a company with **no signed MVD Agreement** (button state, error) is not tested.
7. **Hub Admin / Admin / Probation share one login** whose role Ops switches (`knowledge/eauto-portals.md:279-281`). TS07–TS09 rely on the role being switched each time; the sheet does not record that.
8. **Step text in R7–R10 repeats the search and click** ("Search for a company … Search for a Company Name …") — copy-paste noise, not a separate step.
9. **Production:** precedent table records EAINT-11499 on 20260603 as **"No"** (unable to test in prod) `[knowledge/production-regression-scope.md:954]`. Related precedents: EAINT-11494 "BO MVD agreement access" 20260520 `[line 963]` and EAINT-8578 "BO MVD agreement button" 20250728 `[line 1088]` — link to this ticket [unconfirmed].
10. **Date quirk:** workbook modified 24/06/2026, after the 20260603 prod row — sheet was edited after deployment [unconfirmed reason].

## 7. Against existing knowledge

1. **Consistent** with `knowledge/business-rules-from-test-scenarios.md:705-708` and `knowledge/cr-test-scenario-catalogue.md:221`. No contradiction.
2. **Adds** to `knowledge/flow-ucd-company-listing.md`: the Company Details page has an **MVD Agreement button** whose visibility is role-based. That flow file does not mention it.
3. **Adds** to `knowledge/eauto-portals.md` BO roles: a CSE permission beyond Service Hub (MVD view-only).

## Knowledge candidates

1. **BO Company Details → MVD Agreement button is role-gated.** CSE: "The agreement displayed is the UCD Version, where there is no thumbprint." and "unable to download the document"; authorised (jasons): "System will initiate the download of the MVD Document." with "the picture of MyKad and the thumbprint"; others: "The button will not appear for unauthorised user". → `knowledge/flow-ucd-company-listing.md` (Company Details section). `[from SharePoint TS EAINT-11499, sheet Test Scenario, R2, R7, R8]`
2. **CSE role permission (BO, outside Service Hub):** CSE can open the MVD Agreement view-only. → `knowledge/eauto-portals.md` BO roles. `[from SharePoint TS EAINT-11499, sheet Test Scenario, R2–R6]`
3. **Test company for MVD checks:** "e.g INOFIX SDN BHD". → `knowledge/flow-ucd-company-listing.md` test data. `[from SharePoint TS EAINT-11499, sheet Test Scenario, R2]`
4. **Open question to verify:** which role(s) beyond jasons may download — the TS names only one user. [unconfirmed]
