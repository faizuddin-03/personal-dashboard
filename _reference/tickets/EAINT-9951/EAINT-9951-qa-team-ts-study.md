# EAINT-9951 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9951 - [eAuto - Service Portal] Add Credit Company Name as Filter and Column in Hire Purchase Record Creation Listing Page for Users of EAUTO SDN BHD.md` (cell text only; formatting, colours, images and dropdowns not kept).
2. **Ticket folders:** `_reference/tickets/EAINT-9951/` and `_reference/tickets/Studying/EAINT-9951/` — **neither existed** before this study. No SRD, Jira export or HTML capture for this ticket in the repo.
3. **lib/ticketStudies.ts:** no entry for EAINT-9951.
4. **knowledge/:** `business-rules-from-test-scenarios.md` §14 (lines 849-871), `cr-test-scenario-catalogue.md` rows 294 and 471, `production-regression-scope.md` §11.3 line 1001, `flow-service-portal-shell.md` (whole file), `README.md`.
5. **Not read:** the original .xlsx (only the text copy), the SRD (not in repo), Jira ticket, Teams.

## 1. Header

1. **Ticket:** EAINT-9951 — "[eAuto - Service Portal] Add Credit Company Name as Filter and Column in Hire Purchase Record Creation Listing Page for Users of EAUTO SDN BHD".
2. **Portal / module:** **Service Portal** (bank / credit company portal) → Hire Purchase Ownership → **Hire Purchase Record Creation Listing** (`/<env>/credit/home/hp-record` per `flow-service-portal-shell.md` §3).
3. **Workbook:** "EAINT-9951 - [eAuto - Service Portal] Add Credit Company Name as Filter and Column in Hire Purchase Record Creation Listing Page for Users of EAUTO SDN BHD.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 19/03/2026, 3:47:04 pm.
4. **Sheets:** 2.
   1. **Functional TS** — 16 TS ids (9951_Func_TS01–TS16), **82 rows** (R3–R84).
   2. **Permission TS** — 13 TS ids (9951_PERM_TS01–TS13), **13 rows** (R3–R15).
5. **Total:** 29 TS ids, 95 test rows.
6. **Results:** **95 PASS, 0 FAIL**, nothing pending (every "Test Result" cell reads "PASS").
7. **Tester:** "Teck Yung" in the QA column of every row. Full name "Chin Teck Yung" per `knowledge/cr-test-scenario-catalogue.md` row 294.
8. **Dates:** none written in the sheet. Workbook modified 19/03/2026. Production deployment **20260325** per `knowledge/production-regression-scope.md` §11.3 ("| EAINT-9951 | 20260325 | Service Portal HP listing | Yes |").
9. **Environment:** not named anywhere in the sheet.

## 2. What the ticket changed, as the TS shows it

1. **New "Credit Company Name" filter and column** on the Hire Purchase Record Creation Listing, shown **only to EAUTO SDN BHD Superadmin** users. Permission TS R3 expected: ""Credit Company Name" filter and column is displayed correctly."
2. EAUTO SDN BHD Superadmin sees **all HP records across credit companies**. Permission TS R3: "Can Search and view ALL HP records (XStar + Carsome) correctly".
3. EAUTO SDN BHD Superadmin is **view-only**. Permission TS R3: "UNABLE to create new / edit Hire Purchase Record".
4. **Credit company users (XStar, Carsome)** keep their own view: own records only, create/edit allowed, **no** Credit Company Name filter/column. Permission TS R12: ""Credit Company Name" filter and column is NOT displayed".
5. The rest of the Functional TS is a **regression of the existing filters** (Dealer Company Name, New BRN, Vehicle No., dates, Owner IC No, Record Status, eSTM Trx Status, Insurance Purchase (eAuto), eLKM, eVOC, Reset, Create/Edit) [unconfirmed — inferred; the sheet does not mark which filters are new].

## 3. Scenarios

### A. Functional TS — search and filter

1. **9951_Func_TS01** (R3) — Search with no filter → "Prompt error message, "Please select From Date and To Date." with [OK] button."
2. **9951_Func_TS02** (R4–R10) — **Credit Company Name** text box: empty → "Returns all records."; full and partial (beginning, middle/end) → matching records; not found → "Display “0 record(s) in total” and no records in the result table."; special character → "Display records matching the special characters (If Any)"; Chinese → "Unable to search with Chinese characters and system will auto remove Chinese characters".
3. **9951_Func_TS03** (R11–R17) — **Dealer Company Name**: same 7 cases and outcomes as TS02 (partial middle/end matches).
4. **9951_Func_TS04** (R18–R24) — **New BRN**: full and partial (beginning) match; **partial middle/end → 0 records** (R21); special character → 0 records (R23); Chinese removed.
5. **9951_Func_TS05** (R25–R31) — **Vehicle No.**: full, partial beginning and **partial middle/end match** (R28); special character → 0 records (R30); Chinese removed.
6. **9951_Func_TS06** (R32–R41) — **Date Record Created From\* & To\***: empty → "Please select From Date and To Date."; 1 day, 3–4 days, 1 week, 1 month, change month/year → records in range; To removed → "Please select To Date."; From removed → "Please select From Date."; over 1 month → "Ensure user unable to filter more than 1 month date range."; To before From → "Ensure user unable to change "To" date to be earlier than "From" date."
7. **9951_Func_TS07** (R42–R48) — **Owner IC No**: full and partial beginning match; **partial middle/end → 0 records** (R45); special → 0 records; Chinese removed.
8. **9951_Func_TS08** (R49–R55) — **Record Status** dropdown: All, Active, Expired, Complete, Inactive, "B", "T".
9. **9951_Func_TS09** (R56–R58) — **eSTM Trx Status**: All, Approved, "-".
10. **9951_Func_TS10** (R59–R61) — **Insurance Purchase (eAuto)**: All, Complete, "-".
11. **9951_Func_TS11** (R62–R64) — **eLKM**: All, Yes, "-".
12. **9951_Func_TS12** (R65–R67) — **eVOC**: All, Yes, "-".
13. **9951_Func_TS13** (R68–R81) — **14 multi-filter combinations**, e.g. date + Credit Company Name, Credit Company Name + Dealer + Status "Expired", all four status dropdowns "-" or all positive, "Apply All filter" → "Displays records that match the search input and selected filter."

### B. Functional TS — actions

1. **9951_Func_TS14** (R82) — [Create New] → "Redirects to the Create New Hire Purchase Record, ensure the user can create a new record with valid inputs in all fields." Remark: "Tested together in with the permission TS".
2. **9951_Func_TS15** (R83) — Edit hyperlink for Active and Inactive → "Redirects to the Edit New Hire Purchase Record page, ensure all details and status are shown correctly." Same remark.
3. **9951_Func_TS16** (R84) — Reset → "Clears all filters." Note: "To test this in all search & filter scenarios. After applying search / filter, click reset to clear the search & filter, then reapply another filter."

### C. Permission TS

| TS | Role | Company | Users | Link on Home | Listing result |
|---|---|---|---|---|---|
| PERM_TS01–04 (R3–R6) | Superadmin | EAUTO SDN BHD | Existing (kmcheah, jasons, mfizni, eautoops) | **Shown** | View ALL; no create/edit; Credit Company Name filter + column shown |
| PERM_TS05 (R7) | Admin | EAUTO SDN BHD | Existing (hongkee) | **NOT shown** | — |
| PERM_TS06 (R8) | Admin | EAUTO SDN BHD | New | **NOT shown** | — |
| PERM_TS07–08 (R9–R10) | Credit Company User | "Any existing credit company (except XStar & Carsome)" | Existing / New | **NOT shown** | — |
| PERM_TS09 (R11) | Credit Company User | "New Credit Company" | New | **NOT shown** | Remark "Put this for P2" |
| PERM_TS10–11 (R12–R13) | Credit Company User | "X STAR TECHNOLOGY MALAYSIA SDN BHD" | Existing / New | **Shown** | Own XStar records; create + edit; filter/column NOT shown |
| PERM_TS12–13 (R14–R15) | Credit Company User | "Carsome Capital Sdn. Bhd." | Existing / New | **Shown** | Own Carsome records; create + edit; filter/column NOT shown |

"Shown" means all three of: "The Hire Purchase Record Creation Listing link is available", "It appears under the Hire Purchase Ownership section", "It is shown in the top left menu dropdown" (Permission TS R3, col "eAuto Service Portal > HomePage").

## 4. Business rules and system behaviour

1. **Date range required.** "Prompt error message, "Please select From Date and To Date." with [OK] button." (Functional TS R3, R32). Single-side messages: "Please select To Date." (R38), "Please select From Date." (R39). The [OK] button suggests a **popup**, not the inline red text used on the JomCheck Report Listing [unconfirmed].
2. **Max one month.** "Ensure user unable to filter more than 1 month date range." (Functional TS R40). The exact message is **not recorded**.
3. **To cannot be before From.** "Ensure user unable to change "To" date to be earlier than "From" date." (Functional TS R41).
4. **Name fields match anywhere.** Credit Company Name and Dealer Company Name partial middle/end: "Displays records matching the partial Credit Company Name." (R7), "Displays records matching the partial Dealer Company Name." (R14). Vehicle No. likewise (R28).
5. **New BRN and Owner IC match from the start only.** Partial middle/end: "Display “0 record(s) in total” and no records in the result table." (Functional TS R21, R45).
6. **Special characters return nothing** for New BRN, Vehicle No. and Owner IC (R23, R30, R47); for the two name fields they match "(If Any)" (R9, R16).
7. **Chinese characters are stripped.** "Unable to search with Chinese characters and system will auto remove Chinese characters" (R10, R17, R24, R31, R48).
8. **Empty result text:** "0 record(s) in total" (R8 and others) — same counter wording as the JomCheck Report Listing (`flow-service-portal-shell.md` §4.3).
9. **Record Status values:** All, Active, Expired, Complete, Inactive, "B" — "(Insurance BER case)" (R54), "T" — "(Insurance TL case)" (R55).
10. **"-" in eSTM Trx Status** = "Displays records that are not tagged to any “Approved” eSTM transaction." (R58).
11. **Status dropdown options:** Insurance Purchase (eAuto) = All / Complete / "-" (R59–R61); eLKM = All / Yes / "-" (R62–R64); eVOC = All / Yes / "-" (R65–R67).
12. **Edit is available for Active and Inactive** records: "Click Edit hyperlink to edit Hire Purchase Record for Record Status below: - Active - Inactive" (R83). Whether Expired / Complete / B / T can be edited is not stated.
13. **Access is by role and company, not just company.** EAUTO SDN BHD Superadmin sees the link (Permission TS R3); EAUTO SDN BHD Admin does not (R7); XStar and Carsome users do (R12, R14); other credit companies do not (R9).
14. **Only XStar and Carsome use HP record creation** among credit companies [unconfirmed — inferred from Permission TS R3 "ALL HP records (XStar + Carsome)" and R9 "except XStar & Carsome"].

### Contradictions with existing knowledge

1. `knowledge/business-rules-from-test-scenarios.md` §14 item 3 says "partial match on Credit Company Name, Dealer Company Name, New BRN, Vehicle Number, Owner IC". **Wrong for New BRN and Owner IC** — middle/end partial returns 0 records (Functional TS R21, R45).
2. Same file, item 3: "The link shows only for EAUTO SDN BHD users". **Wrong** — XStar and Carsome credit company users also see it (Permission TS R12–R15), and EAUTO SDN BHD **Admin** does not (R7–R8). The new **filter and column** is the part limited to EAUTO SDN BHD Superadmin.
3. `knowledge/flow-service-portal-shell.md` §4.2: the category carries `Admin HubAdmin Normal`, "so every role sees it". True for the category, but the **HP Record Creation Listing link itself is role/company gated** (Permission TS R7–R11).
4. `flow-service-portal-shell.md` §7 item 1 records the JomCheck one-month error as inline red text "Shared Date range must not exceed one month.". This page uses popups with [OK] for missing dates (R3); the one-month behaviour here may differ [unconfirmed].
5. `flow-service-portal-shell.md` §8 item 1 lists HP Record Creation Listing as "label and href only". This study gives its filter set but **no DOM** — still no capture.

### Sheet defects (as written)

1. **Copy-paste expected results.** Insurance Purchase "Complete" (R60), eLKM "Yes" (R63), eVOC "Yes" (R66) all read "Displays records with "Approved" eSTM Transaction Status."; their "-" rows (R61, R64, R67) read "not tagged to any “Approved” eSTM transaction." The real rule per filter is not stated [unconfirmed what was checked].
2. **R68** "From & To (Date Record Created) + Credit Company Name" expects "Displays records within the selected date range with Record Status = "Active"." — no status filter in the input.
3. **R20** expected "Displays records matching the partial Partial New BRN (Beginning)." — duplicated word.
4. **TS ids reused** across rows (e.g. 9951_Func_TS02 on R4–R10), so a single id is not a single test.
5. **R1 header** lists "Data Type" but **no "Steps" or "Test Data" column** — actual values used are not recorded.

## 5. Test data, environments, accounts

1. **Environment:** not stated.
2. **Accounts (Permission TS col "User ID"):** EAUTO SDN BHD Superadmin `kmcheah` (R3), `jasons` (R4), `mfizni` (R5), `eautoops` (R6); EAUTO SDN BHD Admin `hongkee` (R7). Others "ANY". `jasons` is likely the "Jason Seah" superadmin default in `scripts/eauto-jomcheck/data/users.ts` [unconfirmed].
3. **Credentials present** in Permission TS Remarks R3, R4, R5.
4. **Credit companies:** "X STAR TECHNOLOGY MALAYSIA SDN BHD" (R12), "Carsome Capital Sdn. Bhd." (R14), a "New Credit Company" (R11), plus any other existing company (R9).
5. **Data needed:** HP records under both XStar and Carsome; records in each Record Status incl. B and T; records with and without Approved eSTM, Complete insurance, eLKM Yes, eVOC Yes. No search values are recorded.

## 6. Gaps and risks for regression

1. **Credit Company Name column values** — no row checks the column text against the real company per record, only "displayed correctly".
2. **Exact one-month message** not captured (R40).
3. **Export / pagination / sorting** of the listing not covered.
4. **Credit Company Name filter for XStar/Carsome** — only "NOT displayed" checked; no check that a URL/param tamper cannot pull another company's records.
5. **EAUTO Superadmin view-only** — only absence of create/edit is asked; direct URL to the create/edit page not tested.
6. **Edit on Expired, Complete, B, T** not covered (R83 lists Active and Inactive only).
7. **Insurance Purchase / eLKM / eVOC filters** — expected results are wrong copies (§4 sheet defect 1), so the real pass criteria are unknown.
8. **New credit company** case flagged "Put this for P2" (R11) — production check scope unclear.
9. **Leading/trailing spaces, case sensitivity** in the text filters not tested.

## Knowledge candidates

1. **Correct** `business-rules-from-test-scenarios.md` §14 item 3: New BRN and Owner IC No match **from the start only**; middle/end partial → "Display “0 record(s) in total” and no records in the result table." `[from SharePoint TS EAINT-9951, sheet Functional TS, rows 21, 45]`. Name fields and Vehicle No. match anywhere `[… rows 7, 14, 28]`.
2. **Correct** same item: HP Record Creation Listing link shows for **EAUTO SDN BHD Superadmin, XStar and Carsome** users; hidden for EAUTO SDN BHD Admin and other credit companies `[from SharePoint TS EAINT-9951, sheet Permission TS, rows 3-15]`. Credit Company Name filter + column only for EAUTO SDN BHD Superadmin `[… rows 3, 12, 14]`.
3. **Add to** `flow-service-portal-shell.md` §3/§8: HP Record Creation Listing filters — Credit Company Name, Dealer Company Name, New BRN, Vehicle No., Date Record Created From\*/To\*, Owner IC No, Record Status (All/Active/Expired/Complete/Inactive/B/T), eSTM Trx Status (All/Approved/-), Insurance Purchase (eAuto) (All/Complete/-), eLKM (All/Yes/-), eVOC (All/Yes/-); actions Create New, Edit, Reset `[from SharePoint TS EAINT-9951, sheet Functional TS, rows 3-84]`. Note in §4.2 that this link is role-gated, unlike the category.
4. **Add:** EAUTO SDN BHD Superadmin is **view-only** on HP records — "UNABLE to create new / edit Hire Purchase Record" `[from SharePoint TS EAINT-9951, sheet Permission TS, row 3]`.
5. **Add:** Record Status "B" = "(Insurance BER case)", "T" = "(Insurance TL case)" `[from SharePoint TS EAINT-9951, sheet Functional TS, rows 54-55]`.
6. **Add:** date validation popups on this page — "Please select From Date and To Date." / "Please select To Date." / "Please select From Date." with [OK] `[from SharePoint TS EAINT-9951, sheet Functional TS, rows 3, 38, 39]`.
7. **Lead:** capture the HP Record Creation Listing HTML (no DOM in the repo) before any automation of this page.
