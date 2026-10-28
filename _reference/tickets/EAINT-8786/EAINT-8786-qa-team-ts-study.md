# EAINT-8786 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read only; nothing in
`knowledge/`, `lib/` or `app/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8786- To update the latest PDS for Syarikat Takaful Malaysia.md`
   (captured "28/10/2026, 10:02:23 am"; cell text only, no formatting or images).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8786/EAINT-8786-jira.md` (captured 27/10/2026).
3. **Knowledge:** `knowledge/business-rules-from-test-scenarios.md` lines 470-472 and 996-998;
   `knowledge/cr-test-scenario-catalogue.md` rows 085 and 135; `knowledge/flow-secarang-insurance.md`
   lines 688-716; `knowledge/eauto-insurance.md` lines 528-593.
4. **`lib/ticketStudies.ts`:** no entry for EAINT-8786 (grep found no match).
5. **Not read:** the SRDs (`SRD_EAINT-8786_To_Update_STM_PDS_V0.1` and `V1.0`, .docx/.pdf) and
   the two PDS PDFs. They are listed as Jira attachments only; no copy exists in `_reference/`.
   Nothing below is taken from the SRD.
6. **Not read:** the separate Secarang workbook (catalogue #135). This study covers the eAuto
   UCD workbook only.

## 1. Header

1. **Ticket:** EAINT-8786. Jira summary: "⚪[eAuto][Secarang] To update the latest PDS for
   Syarikat Takaful Malaysia" (Jira capture line 5). Status "Done"; parent "EAINT-3221 INSURANCE".
2. **Workbook title (eAuto side):** "⚪[eAuto][UCD]To update the latest PDS for Syarikat Takaful
   Malaysia" (sheet "EAINT-8786 - UCD eAuto", R1).
3. **Module / portal:** **UCD eAuto — Insurance**, reached two ways: "Insurance > Get A free
   Qoute'" (R3-R6) and "eSTM" (R7-R15).
4. **Workbook:** "EAINT-8786- To update the latest PDS for Syarikat Takaful Malaysia.xlsx",
   SharePoint library "eAuto - CR Test Scenarios", modified 10/09/2025, 10:39:56 am.
5. **Sheets:** one — "EAINT-8786 - UCD eAuto".
6. **Scenarios:** **13 rows** (R3-R15). Each row carries two insurance-type columns, so up to
   26 checks.
7. **TS numbers:** the "TS No." column is **empty in every row**.
8. **Results:** "Test Result" and "Remark" columns are **empty in every row**. No Pass/Fail recorded.
9. **Tester / dates:** none written in the sheet. The catalogue names a tester for row 085
   (`knowledge/cr-test-scenario-catalogue.md` line 88); not repeated here as it is not in the sheet.

## 2. What the ticket changed, as the TS shows it

1. **Takaful Malaysia PDS documents replaced** with the latest version, in English and BM.
2. **Where the PDS shows on eAuto:** the "More Information" section at **Step 1 – Quotes**
   ("+More Info") and **Step 2 – Optional Coverage** ("View Plan Details").
3. **Policy email:** the confirmation email ZIP from Takaful Malaysia must hold the latest PDS
   (R14 only).
4. **Version named in Jira, not in the TS:** attachments "STMAB PDS(BM) Takaful myMotor-Kenderaan
   Persendirian V01 08-2025.pdf" and "STMAB PDS(E) Takaful myMotor-Private Car V01 08-2025.pdf"
   (Jira capture lines 34-35). The TS never names a file or version to compare against.

## 3. Scenarios

Common expected result "**PDS links**" below = verbatim (R3): "1. Ensure the Product Disclosure
Sheet (PDS) is available in English and Bahasa Malaysia (BM). 2.The links to both versions must
be enabled and clearly visible. 3. When clicked, each link should: - Open the correct document in
a new tab or window. - Display the latest version of the PDS."

### A. Get A Free Quote (no eSTM) — Sub User, "User - level ✅"

1. **R3** — Individual, Step 1 "Click '+More Info'" → **PDS links**; Comprehensive and TPFT.
2. **R4** — Individual, Step 2 "Click on 'View Plan Details'" → **PDS links**; Comprehensive and TPFT.
3. **R5** — Company, Step 1 "+More Info" → **PDS links**; TPFT in both type columns.
4. **R6** — Company, Step 2 "View Plan Details" → **PDS links**; TPFT in both type columns.

### B. eSTM flow — Main User, "Company - level ✅"

Scenario text: "eSTM happy flow - until step 6 - Redirect to Insurance Step 1 All Quotations page".

1. **R7** — Individual, Step 1 "+More Info" → **PDS links** (first column says "new tab" only, not "or window").
2. **R8** — Individual, Step 2 "View Plan Details" → **PDS links**.
3. **R9** — Individual, "Step 3 & 4 -Proceed Until Payment & Insurance Successfully Purchased" → **PDS links**.

### C. eSTM flow — Sub User, "User - level ✅"

1. **R10** — Individual, Step 1 "+More Info" → **PDS links**.
2. **R11** — Individual, Step 2 "View Plan Details" → **PDS links**.
3. **R12** — Individual, Step 3 & 4 to purchase → **PDS links**.
4. **R13** — Company, Step 1 "+More Info" → **PDS links**.
5. **R14** — Company, Step 2 "View Plan Details" → **email ZIP**: "1. Ensure that the user
   receives a confirmation email from Syarikat Takaful Malaysia upon successful insurance purchase."
   … "3. Ensure that the ZIP file includes the latest Product Disclosure Sheet (PDS). 4. The PDS
   must be in English version and reflect the most up-to-date information."
6. **R15** — Company, "Step 3 & 4- Proceed Until Payment & Insurance Successfully Purchased" → **PDS links**.

## 4. Business rules and system behaviour the TS reveals

1. **PDS in two languages, both linked.** "Ensure the Product Disclosure Sheet (PDS) is available
   in English and Bahasa Malaysia (BM)." (sheet "EAINT-8786 - UCD eAuto", R3).
2. **Links open in a new tab.** "Open the correct document in a new tab or window." (R3); R7 first
   column: "Open the correct document in a new tab." (R7).
3. **PDS location on Step 1.** "Step 1 - Qoutes … 1. Click '+More Info' … 2. Look under the 'More
   Information' section" (R3, Page Affected).
4. **PDS location on Step 2.** "Step 2 - Optional Coverage … 1. Click on 'View Plan Details' …
   2. Look under the 'More Information' section" (R4, Page Affected).
5. **Email ZIP holds English PDS only.** "The email should include a ZIP file attachment containing
   relevant policy documents." and "The PDS must be in English version" (R14). The email comes
   "from Syarikat Takaful Malaysia" (R14).
6. **eSTM leads into Insurance Step 1.** "eSTM happy flow - until step 6 - Redirect to Insurance
   Step 1 All Quotations page" (R7, Scenario to Trigger). Matches the existing memory note that
   the insurance redirect comes after full eSTM completion [unconfirmed link — the TS gives no step names].
7. **Cover types tested:** "Comprehensive" and "TPFT" (R2-R4 Insurance Type columns). Jira
   Materials list only "Comprehensive" (Jira capture line 24) — whether TPFT uses the same PDS is
   [unconfirmed].
8. **Permission split.** Main User = "Company - level ✅" (R7); Sub User = "User - level ✅" (R3).

## 5. Test data, environments, accounts, setup

1. **Accounts:** "Main User" and "Sub User" roles only. No logins, no company names.
   No credentials present.
2. **Environment:** not stated in the sheet.
3. **Vehicles:** none named. Only "Individual" / "Company" vehicle category.
4. **Email inbox:** R14 needs access to the purchaser's email; inbox not named.
5. **Payment:** R9, R12, R14, R15 go to "Insurance Successfully Purchased"; method not named.

## 6. Gaps and risks for regression

1. **Never marked.** No Test Result in any row, so the eAuto PDS update is not proven by this
   sheet. Same gap already noted for the Secarang sheet (`knowledge/flow-secarang-insurance.md` line 701).
2. **No version to check against.** "Display the latest version of the PDS" (R3) gives no version
   label. The current version is now "V2 02-2026" (`knowledge/eauto-insurance.md` line 569), so
   the V01 08-2025 files of this ticket are **superseded**. A regression must assert the version label.
3. **R14 / R15 look swapped** [unconfirmed]. R14 is "Step 2 - Optional Coverage" but expects the
   purchase email; R15 is "Step 3 & 4 … Successfully Purchased" but expects on-page links.
4. **Email ZIP checked once.** Only R14 (Company, Sub User) checks the email. Individual purchases
   (R9, R12) and Main User purchases never check the ZIP.
5. **Company Comprehensive not covered.** R5 and R6 list "TPFT" in both type columns; Company +
   Comprehensive is missing [unconfirmed whether a copy slip].
6. **eSTM rows R7-R15 leave the first Insurance Type blank**, so which cover the first expected
   result applies to is unclear.
7. **Main User on Get A Free Quote not covered** (R3-R6 are Sub User only); **Main User Company
   vehicle via eSTM not covered** (R7-R9 are Individual only).
8. **Step 3 / Step 4 PDS location not described.** R9, R12, R15 expect links but give no click path.
   The EAINT-9215 map puts a PDS disclaimer at Step 3 "under the payment summary section"
   (`knowledge/eauto-insurance.md` line 582) — not mentioned here.
9. **Content not checked.** "Open the correct document" is the only content check; no check of
   product name (Private Car vs Kenderaan Persendirian) or that BM link does not open the EN file.
10. **Motorcycle not covered.** Takaful Malaysia documents cover Private Car only
    (`knowledge/flow-secarang-insurance.md` line 704); the TS does not test what a motorcycle shows.

## 7. Contradictions with existing knowledge

1. **"new tab" vs "new tab or window".** `knowledge/business-rules-from-test-scenarios.md` line 470
   says "opening in a new tab"; the TS mostly says "new tab or window" (R3). Minor.
2. **Catalogue row 085 lists "EAINT-8786 - UCD eAuto:0 | 0"** (`knowledge/cr-test-scenario-catalogue.md`
   line 88). The sheet has 13 scenario rows (R3-R15). The "0" likely counts TS numbers or results,
   not rows [unconfirmed].
3. **Jira title says "[Secarang]"**, the eAuto workbook says "[eAuto][UCD]". One key covers both
   portals (catalogue rows 085 and 135).

## Knowledge candidates

1. **eAuto PDS click path (Takaful Malaysia).** Step 1: "Click '+More Info'" then "Look under the
   'More Information' section"; Step 2: "Click on 'View Plan Details'" then "Look under the 'More
   Information' section". `[from SharePoint TS EAINT-8786, sheet EAINT-8786 - UCD eAuto, R3-R4]`
   Target: `knowledge/eauto-insurance.md`, Takaful Malaysia section.
2. **Takaful Malaysia purchase email.** "confirmation email from Syarikat Takaful Malaysia" with "a
   ZIP file attachment containing relevant policy documents"; the PDS inside is "English version".
   `[from SharePoint TS EAINT-8786, sheet EAINT-8786 - UCD eAuto, R14]` Target: `knowledge/eauto-insurance.md`.
3. **EAINT-8786 eAuto TS never marked.** All 13 rows (R3-R15) have empty Test Result and TS No.
   `[from SharePoint TS EAINT-8786, sheet EAINT-8786 - UCD eAuto, R3-R15]` Target:
   `knowledge/eauto-insurance.md` beside the Secarang note in `flow-secarang-insurance.md` line 701.
4. **EAINT-8786 PDS version was V01 08-2025**, now superseded by V2 02-2026.
   `[from ticket EAINT-8786, Jira attachments lines 34-35]` + `knowledge/eauto-insurance.md` line 569.
   Target: `knowledge/eauto-insurance.md` item 5.
5. **Catalogue row 085 count "0"** should read 13 scenario rows, 0 results [unconfirmed meaning of
   the column]. Target: `knowledge/cr-test-scenario-catalogue.md` line 88.
