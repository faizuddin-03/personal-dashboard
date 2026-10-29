<!-- Written 2026-10-28 by Scribe (pipeline history step), after Faizuddin's reply "try again" (no earlier copy of this
     file existed on disk, so this is a full first pass). Read only from the repo: knowledge/, _reference/sharepoint/,
     _reference/tickets/, data/pipeline/. Toolbox: fetch.mjs ts EAINT-12028 (no match). -->

# EAINT-12028 — related history (2026-10-28)

## Ticket brief

1. **High-level scope:**
   1. **New menu + Summary page:** Reports → Association Payment Listing, Year filter + Search, 12 month rows, car / motorcycle counts and RM, 3 status columns, Payment Date, View.
   2. **Details page:** state breakdown (16 states + TOTAL), RM1.00 per car (FMC), RM2.00 per motorcycle (MMSDA), audit log.
   3. **Approval workflow:** Drafter Approve / KIV → Reviewer Approve / Reject → Approver Approve / Reject; sequence enforced; remarks mandatory on Reject.
   4. **E-signature + payment date:** pad on first approval only, reused later; Finance payment date future-only, picker-only.
   5. **Payment Request PDFs:** FMC and MMSDA, after full approval only; file name, fixed and flexible fields, amount in words.
   6. **Role and permission:** role from login ID, multi-role user (mfizni), no-role user blocked; menu visibility.
   7. **Month-close data:** figures frozen by the eauto-cron month-close job; cross-check against Transaction Summary Report (State).
   8. **Regression:** BO login / logout / SSO (core change), other BO Reports menu items.
   9. **Beyond the Miro board (one TS per case, 68 TS):** security and session checks, out-of-sequence and direct-URL attempts, month-close states, every PDF field as expected lines inside one TS.
2. **Estimated testing time:** **10 man-days** (base 8 + buffer 2, 1 QA), range **8–12**, confidence **medium**. Option B chosen: one TS per case [answered by Faizuddin on 2026-10-29]; Elf draft now **68 TS** (12028_TS01–TS68). Official: Miro "Est. Testing Mandays: 10 days (1 QA)"; Jira "[QA] Est Man-day (cf 10081): 10". Detail in "Estimated testing effort".
3. **Modules / pages to cover:**
   1. **Association Payment Listing (BO):** Reports menu, Summary page, Details page, Reject remarks popup, Finance payment date popup, Signature popup, FMC / MMSDA Payment Request PDF — new.
   2. **BO login / logout / SSO hand-off (core → backoffice):** regression, core login/logout changed.
   3. **Transaction Summary Report (State) (BO):** cross-check source for monthly figures.
   4. **eauto-cron month-close job:** data source for every month.
   5. **STMS / eSTM / APT (UCD):** approved + paid car and motorcycle transactions — test data.

## Changes 2026-10-28

1. **Faizuddin's reply:** "try again". No related-history file or brief existed, so the full study was redone and both files written.
2. Searched the QA Team folder for this ticket: `fetch.mjs ts EAINT-12028` → "No workbook matches "EAINT-12028"". No official TS exists yet.
3. **Second pass (Faizuddin's reply):** "https://miro.com/app/board/uXjVHrYDgq8=/ this is miro link for the high level flow graph". Link appended to `_reference/miro-links.txt`. Board saved: `_reference/miro/uXjVHrYDgq8=-2026-10-28.md`.
   1. Reader saved **4 text items** only. Board has "2 mindmap, 1 table" `[capture header line 5]`; their content was **not captured**, so the flow graph itself is still unread.
   2. Added the board's 3 open notes to **Known traps** items 7–9 and the matching **Reusable scenarios** items 3 and 5. Ticket brief unchanged.
4. **Third pass (Faizuddin's reply):** "it basically shows the possible changes in the status. and also which user can change which status". Board graph content is now known by his description; **Known traps** item 10 updated. Ticket brief unchanged (same scope as SRD v1.1 REQ-003 — role by user ID, REQ-005 — workflow status columns, REQ-009 to REQ-012 — sequence and per-role actions).
5. **Hand-off (Faizuddin's reply):** "so you need to do anything else? if not, pass to elf". Related history **complete**; passed to Elf. The 3 questions for the team do not block TS drafting; rows that depend on them stay [unconfirmed].
6. **Coverage update (Faizuddin's reply):** "btw, the miro is not complete, so we need more coverage. my lead estimates +-180 TS". Changed: expected TS count **~180** (was 80–150); range **8–14** (was 8–12); confidence **low** (was medium); scope line 9 and a **Security & Session** block added to the brief; **Known traps** item 10 no longer treats the board as the full matrix. Man-days kept at **10** (official).
7. **Elf's answer on the ~180 TS (2026-10-28):** current draft `data/pipeline/work/EAINT-12028/scenarios.md` has **24 TS** and already maps every SRD v1.1 REQ-001 to REQ-019; the gap is depth plus 8 dev-guide checks with no TS (SSO replay, direct download before approval, double submit, finished-month actions, repeated month-close, repeat download, H1 cross-module role, server-side sequence). Reaching ~180 needs one row per check, which clashes with "**Cap around 40 scenarios per subject**" and "Same trigger + same setup = one TS with several expected lines." `[knowledge/test-scripts.md "Ideas from Charmain's repo" items 5 and 2]`. Decision is with Faizuddin; see "Estimated testing effort" item 3. Brief unchanged.

## Changes 2026-10-29

1. **Faizuddin's decision:** "lets go with option B. dont forget to tell elf to update the TS also". TS sizing is now **one TS per case** (same trigger + same setup = one TS with several expected lines), plus the 8 missing dev-guide checks: **~60–80 TS**, not ~180.
2. Changed: brief scope line 9, estimate range **8–14 → 8–12**, confidence **low → medium**, "Estimated testing effort" items 3–5. Man-days kept at **10**.
3. Elf asked to update the TS (scenarios.md / scenarios.json).
4. **Elf's answer:** already done. `scenarios.md` and `scenarios.json` hold **68 TS** (12028_TS01–TS68; checked: no TS69). Dev-guide checks: SSO replay → 12028_TS58; direct download before approval → TS52–TS53; double submit → TS63–TS65; finished month → TS25, TS33, TS39, TS68; repeated month-close → TS12–TS13; repeat download → TS54; server-side sequence → TS66–TS68 (manual). **H1 cross-module role** has no TS — Regression gap **R2**, because "not independently reproducible with only one module live today" `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`. Planned sheets: A–D Menu / Summary / month-close / figures (19), E–I Workflow + audit log (28), J–M Payment Request / login / security (21) `[scenarios.md Open points 12]`.
5. **Workbook state (corrected 2026-10-29):** the current workbook `EAINT-12028 - [...] (Automate Association_Vendor Payment Requests).xlsx` is the **68-TS, one-sheet** build from `ts-spec.json` (ends at 12028_TS68, no TS69). The old 174-TS build is now the `(superseded v1).xlsx` copy; Faizuddin's 27-scenario draft (hyphen name, 2026-09-04) is a separate file. Earlier line here said the folder workbook was still the 174-TS build — out of date. Workbook content not opened by an agent `[unconfirmed]`. Brief scope line 9 and estimate basis say **68 TS**.
6. **Workbook decision:** "built in 1 sheet for now. since it wont affect automation, i will update if need change later" [answered by Faizuddin on 2026-10-29]. Elf confirmed the one-sheet rebuild was already done (item 5); the 3-sheet split is deferred to Faizuddin. Brief unchanged.

## Header

1. **Module / portal:** **BackOffice**, new module **Association Payment Listing** `[EAINT-12028-study.md §3 item 1]`.
2. **Past tickets kept:** **6** — EAINT-8638, EAINT-10168, EAINT-639, EAINT-10038, EAINT-9842, EAINT-8538.
3. **Own official TS:** **none** in the QA Team folder. Own draft: `_reference/tickets/EAINT-12028/EAINT-12028 - [eAuto-BackOffice] New Module – Association Payment Listing (Automate Association-Vendor Payment Requests).xlsx` (27 high-level scenarios, 2026-09-04, never executed) `[EAINT-12028-study.md §5 item 5]`. No text copy of it in the repo.
4. **Dropped (name-only match):**
   1. **EAINT-1245** (JomCheck Transaction Listing "Payment To"), **EAINT-7495 / 7496 / 3090** (UCD payment reports and documents) — UCD-side or field tweaks, no approval workflow.
   2. **EAINT-12055 / 12113** (Reconciliation Listing fixes) — reconciliation logic, kept only through the parent EAINT-10168.
   3. **EAINT-8826 / 8766** (BO Reset Payment / Cancel permission) — per-user grants on existing pages, not a role workflow.
5. **No past TS covers:** a 3-step approval chain, on-screen e-signature, or a future-only date picker. Grep of `_reference/sharepoint/qa-team-ts/` for "Reviewer", "Approver", "signature", "Drafter", "FMC", "MMSDA" — no hit in a BO report TS.

## Related past tickets

1. **EAINT-8638** — "🔴[eAuto-BackOffice] To Create JomCheck Report Listing".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8638 - 🔴[eAuto-BackOffice] To Create JomCheck Report Listing.md` (sheets "SnF Fields & Results", "E2E", "Authorized Users").
   2. **Why related:** last **new BO report page** with a named-user access list. Its authorised users include all five 12028 role logins: kmcheah, mfizni, eautonurul, mfared, eautozara.
2. **EAINT-10168** — "[eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-10168 - [eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance.md` (94 rows, 11 sheets) `[knowledge/cr-test-scenario-catalogue.md #008]`.
   2. **Why related:** BO monthly report built from STMS / eSTM / APT approved transactions, with **Download PDF**, audit trail on download, and a role-limited view.
3. **EAINT-639** — "🟣[eAuto] To R&D - Cron job for JPJ Monthly Report".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-639 -🟣[eAuto] To R&D - Cron job for JPJ Monthly Report.md` (10 TS).
   2. **Why related:** **1st-of-month cron** that builds a monthly STMS / APT / eSTM figure, checked against **Transaction Summary Report** — same pattern as the 12028 month-close job.
4. **EAINT-10038** — "[eAuto] To Update Super Admin User Role".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-10038 - [eAuto] To Update Super Admin User Role.md` (sheets "Test Scenario", "access ref").
   2. **Why related:** BO **Reports menu matrix** by role; lists "Transaction Summary Report (State)" under Reports.
5. **EAINT-9842** — "[eAuto - BackOffice] To Add Audit Log for Bypass Purchase SSM (STMS & eSTM)".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9842 - [eAuto - BackOffice] To Add Audit Log for Bypass Purchase SSM (STMS & eSTM).md` (sheets "Search & Filter", "Functionality", "Permission").
   2. **Why related:** BO **audit log** columns + **permission sheet** layout (allowed users vs "not specified" users).
6. **EAINT-8538** — "[eAuto - Proforma Invoice] To Allow User Upload Payment Slip and Add Remarks".
   1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8538 - [eAuto - Proforma Invoice] To Allow User Upload Payment Slip and Add Remarks.md` (sheets "Functional & Scenario Testing", "Role Testing").
   2. **Why related:** **Role Testing** sheet with one expected-result column per user group and status columns per row — fits the Drafter / Reviewer / Approver × status matrix.

## What was tested before

1. **EAINT-8638 (all rows "Pass"):**
   1. **8638_PS_TS1** (sheet "Authorized Users", R4) — "To verify these accounts are accessible to perform search, view filtered records, and download the results with correct data matching the listing" | "kmcheah". Same row for mfizni (R5), eautonurul (R6), mfared (R10), eautozara (R12).
   2. **8638_PS_TS11** (R14) — "Any other HubAdmin not specified" → ""JomCheck Report Listing" will be hidden for not authorized user". Same for "Any other Admin not specified" (R15) and "Any Probation not specified" (R16).
   3. **8638_SnF_TS14** (sheet "SnF Fields & Results", R18) — "Verify results will be displayed when "Search Now" is clicked".
   4. **8638_SnF_TS24** (R31) — "Audit Log | Backend | Search and export CSV" → "Activity is recorded in backend along with BO account username".
2. **EAINT-10168:**
   1. **A&FERSL-TS07** (sheet "S&F – Access & Filter", R6) — "Mandatory field — search blocked if Payment Date is empty" → "System displays the validation message: "Please select both Payment Date (From) and Payment Date (To)." No results are returned." Pass.
   2. **A&FERSL-TS28** (R31) — "Verify Audit Trail Log in backend when user download PDF of eAuto Reconciliation Summary Report". Pass.
   3. **JPJRBOREG_TS3** (sheet "Regression", R5) — "Summary tab: ⏎ - Search and compare with Reconciliation tab to make sure they are both showing the same result ⏎ - Download PDF file". PASS.
   4. Sheet "EAINT-11887", R18 — "Module remains hidden from menu/direct URL if applicable".
3. **EAINT-639 (all rows "Pass"):**
   1. **639_TS1** (R3) — "Cron triggers on schedule" → "Cron runs automatically on the 1st at 3:00 AM and starts generation." Remark "manual trigger".
   2. **639_TS2** (R4) — steps "1. Login BO ⏎ 2. Go to Transaction Summary Report ⏎ 3. Filter by module and date ⏎ 4. Verify these fields are same same as the report: ⏎ Approved Transaction = TRANSAKSI". TS3 (APT, R5) and TS4 (eSTM, R6) repeat it per module.
   3. **639_TS5** (R7) — "The total amount in"Transaksi" is calculated correctly" → "The total value should be same after total up".
   4. **639_TS9** (R11) — "To verify who doesn't have permission can't access the link" → "The link should not be accessible".
4. **EAINT-10038:**
   1. **10038_TS04** (sheet "Test Scenario", R8) — inactive account → ""Unable to login. Please contact your supervisor or admin."" Pass.
   2. Sheet "access ref", R23 — "Transaction Summary Report (State) | ✔ | ✘ | ✘" (Super Admin only).
5. **EAINT-9842:**
   1. **9842_PS_TS05** (sheet "Permission", R6) — "Any other HubAdmin not specified" → "Bypass Purchase SSM (STMS & eSTM) Audit Log will be hidden for not authorized user". Pass.
6. **EAINT-8538:**
   1. Sheet "Role Testing", R2 header — "Expected Result - BO User ⏎ (jasons, rosalindkhoo, soxian, mfizni) | Expected Result - Finance User ⏎ (eautoaccount)".
   2. **8538_RoT_TS5** (R8) — "Finance user clicks [Mark as Paid]". Pass.

## Reusable scenarios

1. **Role access per login** ← **8638_PS_TS1–TS10** (one row per allowed user). For 12028: one row per mapped user (eautozara, mfared, mfizni, eautonurul, kmcheah), expected = the actions REQ-003 (role by user ID) allows.
2. **Unauthorised users** ← **8638_PS_TS11–TS13**, **9842_PS_TS05–TS07** ("Any other HubAdmin / Admin / Probation not specified"). 12028 expectation differs — see "Known traps" item 1.
3. **Monthly figures vs an independent report** ← **639_TS2–TS4** (compare with Transaction Summary Report per module). For 12028: Details page car / motorcycle count per state vs **Transaction Summary Report (State)**, then × RM1 / RM2. Still open on the team board — see "Known traps" item 8 `[unconfirmed]`.
4. **Total row** ← **639_TS5 / TS6** (sum the column). For 12028: TOTAL footer on Details and the year total on Summary.
5. **Cron by manual trigger** ← **639_TS1** remark "manual trigger". For 12028: month-close via the manual trigger URL in the dev QA guide `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`. Board note "To confirm how to simulate cronjob" is still open — see "Known traps" item 9.
6. **PDF download + audit** ← **A&FERSL-TS28** (audit trail on PDF download), **JPJRBOREG_TS3** (PDF matches on-screen data). For 12028: FMC / MMSDA Payment Request matches Details totals.
7. **Search button** ← **8638_SnF_TS14**. For 12028: Year filter + Search (REQ-002 — Year filter + Search).
8. **Role × status matrix layout** ← **EAINT-8538 "Role Testing"** (one expected column per user group). For 12028: columns Drafter / Reviewer / Approver, rows per status combination. The team board's flow graph holds this same matrix (Known traps item 10).
9. **Hidden from menu and direct URL** ← sheet "EAINT-11887" R18 of EAINT-10168. For 12028: no-role user opens the Details URL directly.

## Known traps

1. **Menu visible, page blocked:** dev guide says the no-role user sees the link but "the module itself must 403" `[knowledge/flow-association-payment-listing.md "QA Test Guide", test accounts]`. Past BO reports expected the page "will be hidden for not authorized user" `[EAINT-8638 "Authorized Users" R14; EAINT-9842 "Permission" R6]`. Do not copy the past "hidden" expectation `[unconfirmed]` until the BA confirms.
2. **Transaction Summary Report (State) is Super Admin only:** "Transaction Summary Report (State) | ✔ | ✘ | ✘" `[EAINT-10038 "access ref" R23]`. The cross-check needs a Super Admin login, not a role login `[unconfirmed]`.
3. **Cron needs a manual trigger:** 639_TS1 remark "manual trigger" `[EAINT-639 Sheet1 R3]`. Never wait for the real schedule.
4. **Link expiry was shortened for test:** "expiry set to 10 minutes" `[EAINT-639 Sheet1 R12]`. Time-based rules need a dev-side setting.
5. **PDF vs screen mismatch happened before:** EAINT-11823 "Downloaded PDF does not match View Report data for eSTM Reconciliation Summary" `[knowledge/cr-test-scenario-catalogue.md line 249]`. Check PDF amounts against the Details page every time.
6. **Multi-role user hides role bugs:** mfizni holds all three roles (REQ-003). Run each role with a single-role login first.
7. **PDF format not settled on the board:** "To confirm the document format for the FMC Payment Request and MMSDA Payment Request" `[_reference/miro/uXjVHrYDgq8=-2026-10-28.md item 4, Frame 1]`. Until confirmed, expected fields come from SRD v1.1 REQ-018 / REQ-019 (FMC / MMSDA field mapping) and `Sample ASSOCIATIONS PAYMENT REQUISITION_20260728-text.md` `[unconfirmed]`.
8. **No direct way to check monthly counts:** "To confirm how to crosscheck the total number of transactions for each month for each vehicle category (currently in system no direct way to check this value)" `[same file, item 4]`. The dev guide names Transaction Summary Report by State as the source `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`; whether it splits car vs motorcycle and counts by JPJ Approved Date is not known `[unconfirmed]`.
9. **Cron simulation not settled:** "To confirm how to simulate cronjob" `[same file, item 4]`. The dev guide gives a manual month-close trigger; whether it is reachable on the test env is not known `[unconfirmed]`.
10. **Board flow graph = status transitions + who can change them:** "it basically shows the possible changes in the status. and also which user can change which status" [answered by Faizuddin on 2026-10-28]. The 2 mindmaps and 1 table were not captured by the reader `[_reference/miro/uXjVHrYDgq8=-2026-10-28.md header line 5]`, so node wording is unread. Use SRD v1.1 REQ-005 (status values) and REQ-009 to REQ-012 (who acts, in what order) as the written source for the same matrix `[unconfirmed: assumed the graph matches the SRD]`. **The board is not complete:** "btw, the miro is not complete, so we need more coverage" [answered by Faizuddin on 2026-10-28]. TS must go past the board: SRD REQ-001 to REQ-019 plus the dev guide's security, session and month-close checks `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`.

## Past QA-Issues mentioned

1. **EAINT-10493** — on **8638_SnF_TS5 / TS6** (special characters in Vehicle No) `[EAINT-8638 "SnF Fields & Results" R9–R10]`.
2. **EAINT-10487** — on **8638_SnF_TS17 / TS19 / TS22** (empty filter, partial match) `[R24, R26, R29]`.
3. **EAINT-10509** — on **8638_SnF_TS20 / TS23** ("0 record(s) in total") `[R27, R30]`.
4. **EAINT-11823, 11800, 11801** — Reconciliation Summary PDF / listing bugs on EAINT-10168 `[knowledge/cr-test-scenario-catalogue.md lines 249–251]`.
5. **EAINT-639, 10038, 9842, 8538:** no QA-Issue key in the rows quoted.

## Estimated testing effort

1. **Comparable tickets:**

| Ticket | What | TS rows | "[QA] Est Man-day (cf 10081)" |
|---|---|---|---|
| EAINT-8638 | New BO report listing + access list | 48 (24 SnF + 11 E2E + 13 PS) | "—" `[cr-test-scenario-catalogue.md line 195]` |
| EAINT-10168 | BO monthly reconciliation report + PDF | 94 `[catalogue #008]` | "—" `[catalogue line 246]` |
| EAINT-639 | Monthly cron report | 10 | not fetched |
| EAINT-10038 | BO role menu change | 5 | not fetched |

2. **EAINT-12028 itself:** Miro "Est. Testing Mandays: 10 days (1 QA)", "Base Testing Time: 8 days", "Buffer (Req Change + Bug Fix + Retest Bug): 2 days", "~150 TS" `[EAINT-12028-miro-card.md lines 15–17, 25]`; Jira "[QA] Est Man-day (cf 10081): 10" `[EAINT-12028-jira.md line 11]`.
3. **TS count:** **68** in Elf's draft (12028_TS01–TS68, 2026-10-29), inside the expected ~60–80 — one TS per case plus the missing dev-guide checks: "lets go with option B" [answered by Faizuddin on 2026-10-29]. Replaces the ~180 (QA lead's count, "my lead estimates +-180 TS", 2026-10-28), which needed one row per check. Elf draft before the change: **24 TS**.
4. **Estimate: 10 man-days (range 8–12):** base **8**, buffer **2**, **1 QA**. Official figure kept. 68 TS in 8 base days is ~8–9 TS a day, but each TS walks a month through the workflow and checks several lines `[unconfirmed]`.
5. **Confidence: medium.** Test env and MR !1 fix state still unknown. Test env still not named; MR !1 fix state unknown `[EAINT-12028-study.md §11 items 1, 4]`.

## Sources read

1. `_reference/tickets/Studying/EAINT-12028/EAINT-12028-study.md`, `EAINT-12028-miro-card.md`, `EAINT-12028-jira.md` (line 11).
2. `_reference/tickets/Studying/EAINT-12028/EAINT-12028_SRD_v1.1_20260731-text.md` (REQ-001 to REQ-019 rows).
3. `knowledge/flow-association-payment-listing.md`, `knowledge/cr-test-scenario-catalogue.md` (BackOffice sections), grep of `knowledge/` for "eautozara", "8638_PS", "Transaction Summary Report (State)".
4. Text copies under `_reference/sharepoint/qa-team-ts/`: EAINT-8638 (full), EAINT-639 (full), EAINT-10038 (full), EAINT-10168 (grep: access, PDF, regression rows), EAINT-9842 and EAINT-8538 (grep: permission / role rows).
5. `node scripts/pipeline/tools/fetch.mjs ts EAINT-12028` — no match.
6. `data/pipeline/knowledge-review.json` (EAINT-12028 KIV entry already waiting), `data/pipeline/answers.json` (no EAINT-12028 entry).
7. **2026-10-28:** `_reference/miro/uXjVHrYDgq8=-2026-10-28.md` (Miro board "EAINT-12028", via `fetch.mjs miro`).

## Knowledge candidates

1. **Past BO report access pattern:** unauthorised users got the page "hidden" (8638_PS_TS11, 9842_PS_TS05), while the 12028 dev guide expects menu visible + 403. Worth a line in `knowledge/flow-association-payment-listing.md` Traps. `[source: EAINT-8638 "Authorized Users" R14; EAINT-9842 "Permission" R6]`
2. **Team board open notes (EAINT-12028):** PDF format, monthly count cross-check ("currently in system no direct way to check this value"), cron simulation — all "To confirm". `[source: _reference/miro/uXjVHrYDgq8=-2026-10-28.md item 4]`
3. **Cross-check source is Super Admin only:** "Transaction Summary Report (State) | ✔ | ✘ | ✘" — affects which login does the 12028 figures check. `[source: EAINT-10038 "access ref" R23]`

## Questions for the team

1. Should a BO user with no Association role see the **Association Payment Listing** menu item? Dev guide: "the Reports menu link is still visible in core, but the module itself must 403" `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`; past BO reports: "will be hidden for not authorized user" `[EAINT-8638 "Authorized Users" R14]`; SRD REQ-003 (role by user ID) only says "a user not mapped to any role cannot perform Drafter / Reviewer / Approver actions". (a) visible + blocked (b) hidden. (for: the BA)
2. Does **Transaction Summary Report (State)** split car vs motorcycle and count by JPJ Approved Date, so QA can cross-check the monthly figures? Team board: "currently in system no direct way to check this value" `[_reference/miro/uXjVHrYDgq8=-2026-10-28.md item 4]`. (for: the developer)
3. Is the manual month-close trigger ("GET {eauto-cron}/eautocron/sys/manual/association-payment-month-close/{year}/{month}" `[knowledge/flow-association-payment-listing.md "QA Test Guide"]`) open on the test env? (for: the developer)
