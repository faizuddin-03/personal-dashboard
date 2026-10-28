<!-- Study of EAINT-12348. First written 2026-10-26 (SRD not available then).
     Refreshed 2026-10-27 by the Jira Scout from the Jira capture of 2026-10-27 17:13, the local copies of every
     attachment (SRD v1.0 docx text copy, SRD v1.1 PDF, mock-up text copies, AATF list PDF), the Teams files and repo knowledge/.
     Re-checked 2026-10-27 by the Jira Scout against the Jira capture of 2026-10-27 20:08:57 (no Jira change since 17:13;
     attachment count corrected 32 → 33). -->

# EAINT-12348 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users"
2. **Jira status:** **REQ REVIEW IN PROGRESS - EAUTO** (Task). Updated **2026-10-26 15:10**. Created 2026-09-17 08:26. Captured **2026-10-27 20:08:57**.
3. **Priority:** Medium.
4. **Fix version:** **"[QA]Ready for Testing Tickets (2026-11-02)"** (new since last study). Labels: "260914-260918", "ProductBacklog", "September2026".
5. **ETA for Testing (cf 10057):** **2026-10-29** (was 2026-10-27). Exp. Deploy Date (cf 10087): "—". [QA] Est Man-day (cf 10081): "—".
6. **QA (cf 10041):** **empty** ("—"). Miro card "- QA:" also blank.
7. **BA:** Chee Mei Jia (Jira assignee and reporter; SRD "Revised By" on every version).
8. **Dev:** Sia Zhong Tai — "Sia Zhong Tai please help on this ticket" `[Teams EAINT-12348, 2026-09-28 15:22, dev lead]`.
9. **Deployment date (Miro):** column **"26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)"** `[EAINT-12348-miro-card.md]`. Card "- To deploy on:" blank.
10. **Test env:** not stated in Jira, Miro, SRD or Teams. Miro "- Test Env:" blank.
11. **Latest SRD:** **v1.1, 23.10.2026** — sent to requestor for review: "sent out srd v1.1 for requestor to review ya" `[Teams, 2026-10-23 15:26, BA]`. Not signed off yet.
12. **Comments:** 0. Links / sub-tasks / parent: none.
13. **Attachments:** **33** (newest "SRD_EAINT-12348_v1.1_20261023.pdf — 694903 bytes, 2026-10-23T15:23:30.760+0800" plus its duplicate).

## Changes since last study (2026-10-27)

### A. Since the 2026-10-27 17:13 refresh (capture 2026-10-27 20:08:57)

1. **Status:** **no change** — "REQ REVIEW IN PROGRESS - EAUTO" `[Jira capture line 6]`.
2. **Fix version:** **no change** — "[QA]Ready for Testing Tickets (2026-11-02)" `[line 8]`.
3. **Updated timestamp:** **no change** — "2026-10-26T15:10:31.228+0800" `[line 10]`. Nobody edited the ticket after the 17:13 refresh.
4. **Other fields:** **no change** — ETA for Testing "2026-10-29"; QA "—"; Exp. Deploy Date "—"; [QA] Est Man-day "—" `[lines 7, 11]`.
5. **Description:** **no change** — same 6-row General Information table, Supporting Materials table and 11-row SRD table.
6. **New comments:** **none** — "## Comments (0)" `[line 44]`.
7. **New attachments:** **none.** Every upload date is on or before 2026-10-23.
8. **Correction to this study:** the attachment list has **33** files, not 32 as written at 17:13 `[capture lines 48–80]`. The 17:13 count was a miscount, not a removed file.
9. **Repo:** no new Teams file, no `_reference/tickets/EAINT-12348/` folder, no new knowledge/ or `lib/ticketStudies.ts` entry since 17:13.

### B. Since the first study (2026-10-26)

Compared with the study written 2026-10-26 (Jira read then: updated 2026-10-23 15:25).

1. **Status:** **no change** — still "REQ REVIEW IN PROGRESS - EAUTO".
2. **Fix version:** **added** — was "No fix version"; now "[QA]Ready for Testing Tickets (2026-11-02)" `[Jira capture line 8]`.
3. **ETA for Testing:** **2026-10-27 → 2026-10-29** `[Jira capture line 11]`.
4. **Updated timestamp:** 2026-10-23 15:25 → **2026-10-26T15:10:31** `[Jira capture line 10]`. The field changes above are the only visible difference.
5. **Description:** **no change.** Same 6-row General Information table, Supporting Materials table and 11-row SRD table (v0.1 to v1.1).
6. **New comments:** **none** ("## Comments (0)").
7. **New attachments:** **none.** Same 33 files; newest is still "SRD_EAINT-12348_v1.1_20261023.pdf — 694903 bytes, 2026-10-23T15:23:30.760+0800" plus its duplicate.
8. **New in the repo (not a Jira change):** local copies of every attachment now sit in this folder, with `-text.md` copies of the docx and html files. **SRD v1.1 is now read.** This makes several parts of the 2026-10-26 study wrong; fixed below:
   1. **PBT transaction number** is **"PBT690000001"** (PBT + year + month + 7 digits), not "PBT0000001" as in the Jira description `[SRD v1.0/v1.1 §2.2.2 #2 item 3; REQ-016]`.
   2. **PBT pre-check number** is **"PBTPC69000001"** `[REQ-019]` — the Teams proposal was adopted.
   3. **"Organisation Name" field is gone.** SRD v0.3 remark: "Removed Organisation Name and updated Company Type change in Section 2.2.4" `[SRD §1.3, v0.3 row]`. Jira description rows 3 and 5 still describe it (stale).
   4. **Receipt No** confirmed "Fixed number: 0807 for AATF, 0810 for PBT" `[SRD §2.2.5.3 field 4]`.
   5. **5-vehicle daily limit:** answered — "this handling has been removed last year ya" `[Teams, 2026-10-19 09:45, BA]`; SRD REQ-037 "No Daily Pre-Checking Limit".
   6. **JPJ identifier without BRN:** answered by REQ-015 and §2.2.5.4 (PBT Shortform rule, 24 PBTs).
   7. **"PBT Portal"** is the same eDereg login: "An active PBT company account logs in to the eDereg Portal using the same login page as an AATF user." `[REQ-009 a]`
   8. **EAINT-12252 overlap:** settled — "End-to-end UI/UX revamp of the eDereg Portal | Covered under EAINT-12252." `[SRD §2.1.2 #1]`
   9. **Old "QA scope" draft** (section 5 of the old study, built from the Jira description) is replaced by the 40 SRD requirements below.

## Sources read

1. **Jira capture** `EAINT-12348-jira.md` (27/10/2026 20:08:57; earlier read at 17:13): fields, description, 0 comments, 33 attachments.
   1. `EAINT-12348-jira-comments.md` (read 2026-10-26): "Comment count: 0." Its line 3 "last updated 2026-10-23 15:25" is now stale (Jira: 2026-10-26 15:10).
2. **SRD v1.1** `SRD_EAINT-12348_v1.1_20261023.pdf` (88 pages). Read as images: pages 1–19, 30–38, 41–43, 51, 58–64, 67–88 (every section the v1.1 revision row names, plus the change log).
   1. Duplicate `SRD_EAINT-12348_v1.1_20261023 (e4865ad4-...).pdf` — same size (694,903 bytes); not opened separately.
3. **SRD v1.0** `SRD_EAINT-12348_v1.0_20261019-text.md` — read in full. Used for sections v1.1 says it did not change (§2.2.4, §2.2.6, §2.2.7, §2.2.9).
4. **SRD v0.1–v0.9** docx text copies: not re-read; superseded. Their remarks are in the SRD §1.3 revision table.
5. **Mock-ups:** `Mock Up_EAINT-12348_PBT Portal_20261020 (...)-text.md` read in full; `Mock Up_EAINT-12348_BackOffice Portal_20261020 (...)-text.md` searched (menu, company list). Older mock-ups (20261007, 20261009, 20261019) not re-read; superseded.
6. **AATF list** `20260223-SENARAI-KEMUDAHAN-RAWATAN-AUTOMOTIF-BERLESEN-AATF (1) (1).pdf` — read (5 AATFs, all "Aktif").
7. **Not read (no text copy):** `Malaysia_PBT_Master_List_eDereg (1).xlsx`; the 8 sample PDFs (`Sample_EAINT-12348_*`) — not opened this run.
8. **Teams:** `EAINT-12348-teams-since-2026-10-16.md` (2026-10-16 to 2026-10-26); `_reference/teams/EAINT-12348-PBT-as-eDereg-Users.md` (2026-09-28 to 2026-10-15, quotes kept from the 2026-10-26 study).
9. **Miro:** `EAINT-12348-miro-card.md` (template only, every field blank).
10. **Repo:** `knowledge/flow-edereg.md` (§45.4 lines 5068–5101, line 5480), `knowledge/teams-decisions-by-ticket.md` §EAINT-12348, `knowledge/cr-ledger.md` row 24, `knowledge/people-and-roles.md`, `lib/ticketStudies.ts` (lines 930–955). No `_reference/tickets/EAINT-12348/` folder exists.

## What changes

1. **Portal:** "1. AATF 2. BackOffice" `[SRD §2.2.1 #2]`. **Module:** "PBT (eDereg)" `[§2.2.1 #3]`.
2. **What:** "Enable a PBT organisation to log in to eDereg and create deregistration transactions in the same way as an AATF organisation." `[§2.2.1 #4]`
3. **Why:** "Business scope is expanding to include PBT users. Existing PBT company type only supports listing of PBT names within AATF function and cannot create an operational PBT user account." `[§2.2.1 #5]`
4. **Out of scope (§2.1.2):** UI/UX revamp ("Covered under EAINT-12252."); "Changes to JPJ integration rules, eDereg fees and payment flow"; "Enhancement to RHB payment reconciliation" — but "RHB payment reconciliation is included in QA testing."
5. **Affected pages (§2.2.3, v1.1):** 16 rows; **#11 "PBT Portal — eDereg Pre-Checking Transaction Listing" struck out** in v1.1; **#17 added**: "PBT Portal — Create Deregistration Transaction (Step 2 AATF selection) | PBT selects the AATF assigned to dispose of the vehicle. Only active AATF are listed."

### Requirements (SRD v1.1; 40 IDs, 2 removed)

**BackOffice — Manage AATF/PBT Account (§2.2.4, unchanged in v1.1)**

1. **REQ-001** login access: "Company Type = PBT saves a company account with login access to the eDereg Portal." Inactive → "Login is blocked and existing transactions of that account remain unchanged."
2. **REQ-002** "All BackOffice users can view and access Manage AATF/PBT Account. The access setting follows Manage Company Accounts under BackOffice > Account Management."
3. **REQ-003** "Company Type cannot be changed once the account is created. Update AATF/PBT Company Account displays Company Type as read-only."
4. **REQ-004** master list import: "154 PBT company accounts are created"; the 4 existing prod PBTs (§2.2.4.1: 5040001, 5040002, 5050001, 5100001) are migrated, not imported; "4 AATF company accounts are created"; "Car Medic Sdn Bhd is not imported"; status "New"; no Login ID/Password → cannot log in. MBPP imported with "TIN Number F10320870040, Company Reg. No. AKT/07/0701/0001 and SST Registration Number P11-1809-32000202".
5. **REQ-005** imported account with an empty mandatory field "is not saved and the empty mandatory field is flagged."
6. **REQ-006** TIN Number: "optional free text field"; "used as Buyer TIN on the e-Invoice". AATF and PBT.
7. **REQ-007** Pre-Checking Email: "mandatory"; checkbox "Same as Company Email ... ticked by default"; ticked → not editable; "used for eDereg Pre-Checking submission". AATF and PBT.
8. **REQ-008** PBT form: "Director / Owner Details is labelled Main User Details"; "New Company Reg. No. is not displayed"; Showroom fields hidden; "SST Registration Number is displayed ... as an optional free text field" (PBT only); "PBT Listing and PBT Selected remain for Company Type AATF only".

**PBT Portal — user access (§2.2.5)**

9. **REQ-009** login on the same page as AATF; inactive → "Login is blocked."
10. **REQ-010** PBT runs Pre-Checking (Vehicle, Payment, Result) and Create Deregistration (ID category + Steps 1–6) "exactly as an AATF user does". PBT Perakuan per §2.2.5.5.
11. **REQ-011** Step 2 "PBT / Individu is a mandatory dropdown with exactly 2 options, and no option is selected by default: a. INDIVIDU - INDIVIDU b. The logged-in PBT".
12. **REQ-040 (new in v1.1)** "When the logged-in user is a PBT, Step 2 displays an additional mandatory dropdown labelled AATF, for the PBT to select the AATF assigned to dispose of the vehicle." Defaults "-- Select AATF --"; "lists AATF company accounts with an active Company Account Status only"; selected AATF feeds "[Nama AATF] in the COD email" and "AATF Location in the COD submission". AATF user: "The AATF dropdown is not displayed." `[SRD v1.1 p.32–33]`
13. **REQ-012** Step 5 Payment Summary, **PBT and AATF**: "eAuto Service Fee: RM 35.00", "Service Tax 8%: RM 2.80", "Total Amount Payable (inclusive of Service Tax 8%): RM 37.80", no JPJ Fee line.
14. **REQ-013** listing shows only own transactions; PBT filter for PBT user = "All selected by default plus exactly 2 options: INDIVIDU - INDIVIDU and the logged-in PBT".
15. **REQ-014** details page shows "PBT, Company Reg. No., PBT Address and PBT Contact No."
16. **REQ-015** JPJ submission sends "the eAuto Company ID of the PBT account, which starts with 5"; "The PBT Name field carries the PBT Shortform"; shortform rule for the 24 shared abbreviations (§2.2.5.4), cut to 10 characters.
17. **§2.2.5.2 COD submission field 7 "AATF Location" (changed v1.1):** "For a PBT transaction: refer to the Mailing Address of the AATF selected at Create Deregistration Transaction Step 2 (REQ-040)." Was "Pending: address of the licensed AATF that disposed of the vehicle".
18. **§2.2.5.5 PBT Perakuan:** all 3 screens still "Pending requestor."

**Numbering and RHB (§2.2.6, unchanged in v1.1)**

19. **REQ-016** "PBT followed by year, month and a 7 digit running number, for example PBT690000001". Month: 1–9, "October: 0", "November: N", "December: D".
20. **REQ-017** AATF "continues the existing D690000638 sequence."
21. **REQ-018** PBT number displayed and searchable in PBT Portal and BackOffice.
22. **REQ-019** pre-check: "PBTPC followed by year, month and a 6 digit running number, starting from PBTPC69000001". AATF keeps PC.
23. **REQ-020 / §2.2.6.1** PBT Ref 1 = "P followed by the AATF prefix", e.g. "PDRG260924000005-PUTRAJAYA1234", "PDPC260924000005-PUTRAJAYA1234"; Ref 2 same as AATF ("DRG"; "DPC260924000005"); TransType stays DRG / DPC; max 30 characters.

**BackOffice enquiry, COD, invoice (§2.2.7–2.2.9)**

24. **REQ-021** BO PBT filter "also returns transactions created by a PBT user."
25. **REQ-022 (changed v1.1)** PBT uploads COD "exactly as an AATF user does". "Sender Email: ~~mppkm@eauto.my~~ dereg@eauto.my". AATF for COD = "the AATF selected at Create Deregistration Transaction Step 2 (REQ-040)". Recipients: vehicle owner, "Company Email of the PBT selected at Step 2", "DOE Email of the PBT selected at Step 2, or azlan@doe.gov.my when INDIVIDU - INDIVIDU is selected". Failed JPJ COD → "COD email is not sent."
26. **§2.2.8.1 COD email (changed v1.1):** "Daripada : eAuto <dereg@eauto.my>"; body "pusat Kemudahan Rawatan Automotif Berlesen [Nama AATF]".
27. **REQ-023** Invoice / e-Invoice Buyer = PBT account; "Buyer TIN shows the TIN Number of the PBT account"; Buyer Registration Number = LHDN registration number; "Buyer SST Registration Number" from the account.

**Cancellation and expiry (§2.2.10, changed v1.1)**

28. **REQ-024 REMOVED:** "Removed. Cancel is available to BackOffice users only. The eDereg Portal has no Cancel." `[SRD v1.1 p.68]`
29. **REQ-025** BO Deregistration Transaction Enquiry and BO eDereg Pre-Checking Transaction Listing show Cancel for PBT "Pending or Failed, including when Payment is OK"; not for "Approved, Cancelled or Expired". Remark (v1.1): "follow the existing cancellation remark format, for example CANCELLED BY [BackOffice user] on [DD-MM-YYYY HH:MM]." Name: "i. BackOffice Deregistration Transaction Enquiry: the BackOffice login ID ii. Any other place: eauto". Examples: pre-check → "CANCELLED BY eauto on 13-09-2026 10:15"; dereg → "CANCELLED BY eautoadmin on 13-09-2026 10:20".
30. **REQ-026** 30-minute expiry same as AATF; cron "runs daily at ~~3am~~ 2am".

**PBT Portal — modules, labels, reports, settings (§2.2.11)**

31. **REQ-027** modules: Homepage, Deregistration, Reports, Settings, Download, Contact Us. "STMS, UCD to UCD, APT, e-Serahan (eSTM), eClassified, Insurance and User Guides are not accessible to a PBT user."
32. **REQ-028** AATF labels → PBT labels (8 pairs, e.g. "AATF's Name to PBT's Rep").
33. **REQ-029 (changed v1.1)** "PBT Payment Report"; "Transaction Type lists DEREG - Deregistration and eDereg Pre-Checking, the same as an AATF user." Plus Audit Trail Log. Own records only.
34. **REQ-030** Settings: Confirmation of Registration; Manage Users (Main User, Super Admin, Sub User; 4 permissions).

**BackOffice — search and logs (§2.2.12)**

35. **REQ-031** Company Name / Company ROC also return PBT transactions (e.g. "AKT/10/1001/0008").
36. **REQ-032 (changed v1.1)** JPJ XML Log (Deregistration) returns PBT dereg records, e.g. "PBT690000003"; **"JPJ XML Log (eDereg Pre-Checking) also returns PBT eDereg Pre-Checking records, for example PBTPC69000008"**.
37. **REQ-033 (changed v1.1)** RHB Payment Transaction: search by **Transaction ID** — "PBT690000009" or "PBTPC69000015"; no longer by RHB Payment ID.

**PBT Portal — eDereg Pre-Checking (§2.2.13)**

38. **REQ-034** pre-check counts for the same organisation only (AATF ↔ PBT not shared).
39. **REQ-035** approved pre-check valid 6 months.
40. **REQ-036** declaration shown once per new transaction; not on resubmit.
41. **REQ-037** no daily pre-check limit (standalone and at Step 2).
42. **REQ-038 REMOVED:** "Removed. eDereg Pre-Checking is not a column on Deregistration Transaction Listing." `[SRD v1.1 p.81]`
43. **REQ-039** View / Resubmit on pre-check listing, same as AATF.

## New vs existing behaviour

1. **Existing:** "A PBT is not able to log in to the eDereg Portal and is not able to create a deregistration transaction." `[SRD §2.2.2 #1 item 3]`
2. **Existing:** "Deregistration transactions carry a single running number in the format D690000638." `[§2.2.2 #1 item 4]`
3. **Existing:** "PBT Shortform is captured as free text when Company Type is PBT." `[§2.2.2 #1 item 5]`
4. **New:** PBT logs in, runs Pre-Checking and the 6-step Dereg flow, own numbering (PBT6..., PBTPC6...), own RHB Ref 1 (PDRG / PDPC), e-Invoice with TIN.
5. **New for AATF too:** Step 5 Payment Summary layout (REQ-012); TIN Number and mandatory Pre-Checking Email on the account form (REQ-006, REQ-007); Company Type read-only on Update (REQ-003); all BO users see Manage AATF/PBT Account (REQ-002); COD email sender dereg@eauto.my (REQ-022) [unconfirmed whether the sender change also applies to AATF COD emails]; cron 2am (REQ-026) [unconfirmed whether the existing AATF cron moves too].
6. **Existing repo fact:** BO Deregistration listing has a PBT filter `select#to-pbt` with PBT ids `5020001`…`5140001` `[knowledge/flow-edereg.md ~line 5026]`.
7. **Existing repo fact:** AATF/PBT companies live in **BO Manage AATF/PBT Account** (`/view/account/dereg/aatf`) `[lib/eautoFlows/modules/dereg.ts line 382]`.

## QA scope

1. **Miro card:** no scope written. "Testing Scope: (Automation)", "Est. Testing Mandays: days (1 QA)", "Regression Testing:" all blank.
2. **SRD-driven scope:** 38 active requirements above (REQ-001 to REQ-040, minus REQ-024 and REQ-038), across BackOffice and PBT login, with AATF regression on every shared page.
3. **Out-of-scope note to honour:** RHB reconciliation not changed but "included in QA testing" `[SRD §2.1.2 #3]`.

## Affected regression areas

1. **AATF eDereg end to end** — Pre-Checking (EAINT-9306 gate), Dereg Steps 1–6, COD. "pbt and aatf are sharing the same page actually" `[Teams, 2026-10-12 10:04, dev]`.
2. **AATF Step 5 Payment** — new Payment Summary layout applies to AATF (REQ-012 Example 2).
3. **AATF numbering** D6... and PC6... must continue (REQ-017, REQ-019 Example 5).
4. **AATF Step 2** — PBT / Individu lists all PBTs; AATF dropdown not shown (REQ-011 Example 3, REQ-040 Example 5).
5. **BO Manage AATF/PBT Account** — existing AATF accounts: new TIN / Pre-Checking Email fields, read-only Company Type; search filters per `knowledge/flow-edereg.md` line 5476.
6. **BO Deregistration Transaction Enquiry / Pre-Checking listing** — Cancel rules and remark format.
7. **JPJ XML Log (Deregistration / eDereg Pre-Checking)**, **RHB Payment Transaction**, **AATF Payment Report** (Transaction Type list).
8. **COD email** sender change; **e-Invoice / LHDN** for AATF with the new TIN field.
9. **RHB reconciliation** with PDRG / PDPC refs.

## Test data / env needs

1. **Environment:** not named anywhere.
2. **BO login** that can open Manage AATF/PBT Account. REQ-002 says all BO users; `_reference/inbox/eauto-flows-run/11-conflicts.md` line 329 recorded Super Admin only (pre-change).
3. **Active PBT account** with Login ID/Password (Main User), TIN, Company Reg. No., Pre-Checking Email. Mock-up example: MBPJ, Company ID 5020001, "AKT/10/1001/0008", login "mbpjdereg" `[PBT mock-up 20261020, Manage Users]` — mock-up data only.
4. **Imported (status New) PBT/AATF** accounts to test REQ-004/005; one of the 4 migrated prod PBTs (e.g. 5050001 Seremban) for REQ-004 b / Example 10.
5. **Inactive PBT** for login block; **inactive AATF** for REQ-040 Example 2b.
6. **PBTs with shared abbreviations** (e.g. MAJLIS DAERAH KERIAN → "MDKerian"; KOTA SAMARAHAN → "MPKSamarah") for REQ-015.
7. **Vehicles** valid for JPJ enquiry; one with an AATF pre-check only (REQ-034 Example 2); a 7-month-old PBT pre-check needs a date patch [unconfirmed].
8. **Sub User** with "View Deregistration Transaction Listing" only (REQ-030 Example 2).
9. **Mailbox access** for owner / PBT / DOE email and dereg@eauto.my sender check.

## Dependencies / related tickets

1. **EAINT-9306** — eDereg Pre-Check compulsory. Done (2026-09-15). Base flow.
2. **EAINT-12252** — UI/UX revamp of eDereg Portal for AATF and PBT, To Do. Out of scope here `[SRD §2.1.2 #1]`.
3. **EAUTO-1058** "Enhancement for eDereg Module for PBT" (source ticket); **CCB-956** "EAUTO | To Enable PBT Organisations as Active eDereg Users" `[SRD §1.5 #2, #3]`.
4. No Jira links, sub-tasks or QA-Issues on 12348.

## Teams decisions (verbatim)

Sources: `_reference/teams/EAINT-12348-PBT-as-eDereg-Users.md` (to 2026-10-15) and `EAINT-12348-teams-since-2026-10-16.md` (to 2026-10-26).

1. `[2026-09-28 10:20, dev lead]` "could be around 5 to 6 days ya" (excluding new AATF UI).
2. `[2026-10-07 14:32, BA]` "Existing is PC69001611 (PC + Y+M+ 6 digits running number). Can help to check if we can have PBTPC69000001" — adopted as REQ-019.
3. `[2026-10-07 14:32, BA]` "for PBT dont have BRN. Suggestion - to send with PBT Shortform but gt duplicated." — settled by REQ-015 / §2.2.5.4.
4. `[2026-10-08 16:37, BA]` "confirmed PBT will have TIN. hence, will have e-invoice".
5. `[2026-10-12 10:04, dev]` "pbt and aatf are sharing the same page actually, so technically can do either both also see or i add a condition to hide it for aatf." — REQ-012 applies the Step 5 summary to both.
6. `[2026-10-12 17:44, dev manager]` "Ya 30 chars but this doc is quite old one."
7. `[2026-10-15 21:28, dev lead]` "I think should be Insurance cancellation \"0809\"".
8. `[2026-10-19 08:19, BA]` "okkkies, if that the case i believe for the PBT version we will use \"0810\" ya."
9. `[2026-10-19 09:45, BA]` "as liaised just now - this handling has been removed last year ya" (5-vehicle limit).
10. `[2026-10-19 10:48, BA]` "the flow is confirmed, now just pending the perakuan part from ops team"
11. `[2026-10-19 11:07, dev]` "i think next Monday EOD including code review" (= 2026-10-26, excluding Perakuan).
12. `[2026-10-22 14:18, BA]` "uploaded new version for SRD v1.1 ya. let me know by tmr 10am if there is any feedback ya else i will send our SRD tmr for requestor to review after that"
13. `[2026-10-23 15:26, BA]` "Everyone, just to share that sent out srd v1.1 for requestor to review ya"

## Open questions / risks for testing

1. **Dates do not line up:** Jira ETA for Testing **2026-10-29**; fix version "[QA]Ready for Testing Tickets (2026-11-02)"; Miro **26TH NOV** (all TBC); status still **REQ REVIEW IN PROGRESS**. Dev ETA was 2026-10-26 EOD. [unconfirmed] the fix version is a QA intake bucket, not a deploy date.
2. **QA not assigned** in Jira or Miro.
3. **SRD v1.1 not signed off** — under requestor review since 2026-10-23. Further changes possible.
4. **Perakuan still "Pending requestor."** for all 3 PBT screens `[SRD §2.2.5.5]`. Mock-up marks the Step 1 declaration and Pre-Checking Perakuan "TO CONFIRM". These steps cannot be tested to a fixed text yet.
5. **Jira description is stale vs SRD:** it still says "mandatory Organisation Name field" and "format PBT0000001". SRD wins (v0.3 removed Organisation Name; REQ-016 gives PBT690000001).
6. **REQ-024 removal scope:** v1.1 says "The eDereg Portal has no Cancel." v1.0 said PBT cancels "with Cancel at Step 4 or Step 5, the same as an AATF user." Is the Step 4/5 Cancel removed for AATF too, or only for PBT? [unconfirmed]
7. **REQ-040 has no mock-up.** Latest PBT mock-up (20261020) Step 2 shows only "PBT/Individu" — no AATF dropdown. Jira SRD row 11 lists "Mock Up - BackOffice Portal & PBT Portal" for v1.1, but no 20261023 mock-up is attached.
8. **COD email recipients when PBT picks INDIVIDU:** Example 5 sends only to owner and "azlan@doe.gov.my" — the PBT's own Company Email gets nothing. Confirm intended.
9. **Owner email source:** REQ-022 says "email captured at Create Deregistration Transaction Step 2"; §2.2.5.1 field 7 says "from Deregistration Transaction Step 1 Perakuan". Mock-up shows Email on the "Owner & Vehicle Details" page.
10. **Cron 3am → 2am and sender mppkm@ → dereg@:** PBT only, or AATF as well? [unconfirmed]
11. **REQ-002 vs repo note:** all BO users vs "Super Admin only" in `11-conflicts.md` line 329. **Settled 2026-10-27:** not a conflict. "Super Admin only" is the **pre-change** state, from the EAINT-10038 QA TS `access ref` sheet R12 ("Manage AATF/PBT Account | ✔ | ✘ | ✘" — Super Admin / Hub Admin / HUB ADMIN). EAINT-10038 Jira holds no access rule for this menu (description: "Remove the above two Back Office user accounts from the Super Admin user role"; Done, prod 2026-06-03). REQ-002 changes it: Existing "accessed by authorised BackOffice users" → New "All BackOffice users can view and access". Test as before/after.
12. **Repo date drift:** `_reference/inbox/eauto-flows-run/08-jira-3months.md` line 747 and `lib/eautoFlows/modules/dereg.ts` line 264 say "SRD v1.1 2026-10-20"; SRD says "23.10.2026 (Friday)".
13. **PBT master list xlsx not read** (no text copy) — the 154 count and Abbreviation values are taken from the SRD only.

## Suggested test focus

1. **BO account form:** Create New PBT vs AATF field sets (REQ-008); Company Type read-only on Update (REQ-003); TIN optional; Pre-Checking Email mandatory + "Same as Company Email" checkbox (REQ-007 Examples 1–4).
2. **Import results:** 154 PBT + 4 AATF, Car Medic absent, status New, MBPP values filled, 4 migrated prod PBTs log in (REQ-004, REQ-005).
3. **PBT login:** active / inactive / no credentials (REQ-001, REQ-009); module access and STMS link blocked (REQ-027).
4. **Step 2:** PBT / Individu 2 options, no default (REQ-011); AATF dropdown, active AATFs only, mandatory (REQ-040); pre-check from same org only, 6-month validity (REQ-034, REQ-035).
5. **Numbers:** PBT6..., PBTPC6..., month letter 0 / N / D; AATF D6... and PC6... continue (REQ-016–019). Test month rollover if testing crosses Oct → Nov.
6. **Payment:** Step 5 summary RM 35.00 / 2.80 / 37.80 for both PBT and AATF (REQ-012); PDRG / PDPC Ref 1 and 30-char limit with a long plate (REQ-020).
7. **JPJ payloads:** Company ID starting 5, PBT Shortform incl. shared and 10-char cut cases, Receipt No "0810", Company No = PBT Company Reg. No. (REQ-015, §2.2.5.1–2.2.5.3) — check via JPJ XML Log.
8. **COD:** upload as PBT; AATF Location = selected AATF address; email from dereg@eauto.my with [Nama AATF] = selected AATF; recipients for PBT vs INDIVIDU; no email on failed JPJ (REQ-022, §2.2.8.1).
9. **Invoice / e-Invoice:** Buyer details, TIN, Registration No., SST No. for PBT (REQ-023); compare with the 20261019 samples.
10. **Cancel:** no Cancel in eDereg Portal; BO Cancel for Pending / Failed incl. Payment OK; remark "eautoadmin" (BO Dereg Enquiry) vs "eauto" (elsewhere) (REQ-024 removed, REQ-025).
11. **Expiry:** Resubmit at 20 vs 40 minutes; 2am cron (REQ-026).
12. **Listings / reports:** own-only listing and PBT filter (REQ-013); no eDereg Pre-Checking column (REQ-038 removed); PBT Payment Report with both Transaction Types (REQ-029); Audit Trail; Manage Users permissions (REQ-030).
13. **BO search / logs:** Company Name / ROC (REQ-031); JPJ XML Log split by Dereg / Pre-Checking (REQ-032); RHB Payment Transaction by Transaction ID (REQ-033).
14. **AATF regression** on every shared page above.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-edereg.md` — eDereg flow, BO listing selectors, PBT filter (~line 5026), AATF payment refs (§45.4), Manage AATF/PBT Account search fields (line 5476).
2. `lib/eautoFlows/modules/dereg.ts` — module map, BO Manage AATF/PBT Account path (line 382).
3. `scripts/eauto-edereg-precheck/` + `app/eauto/edereg-precheck/` — existing Pre-Checking automation. [unconfirmed] base for PBT login runs.
4. `_reference/html/edereg/dereg-step2-precheck-consent-dialog-email-field.html` — captured Step 2 dialog.
5. `knowledge/script-inventory-team.md` line 260 — a colleague's `backoffice-audit` harness covers AATF / Dereg company account modules.

## Knowledge candidates

1. **flow-edereg.md §45.4 conflict can be closed.** PBT dereg number "PBT followed by year, month and a 7 digit running number, for example PBT690000001"; pre-check "PBTPC followed by year, month and a 6 digit running number, starting from PBTPC69000001" `[SRD v1.1 §2.2.2 #2 item 3; REQ-016; REQ-019]`.
2. **AATF payment refs no longer dev-hedged.** §2.2.6.1 lists AATF (Existing): Dereg Ref 1 "DRG260914000020-HXA224", Ref 2 "DRG"; Pre-check Ref 1 "DPC260924000005-VAN1234", Ref 2 "DPC260924000005" `[SRD v1.0 §2.2.6.1, unchanged in v1.1]`. Upgrade the `[unconfirmed]` tag in flow-edereg.md lines 5068–5075.
3. **Pre-check Receipt No format:** "YYMMDD" + "Fixed number: 0807 for AATF, 0810 for PBT" + "4 digit running number", e.g. "26092408070003" `[SRD §2.2.5.3 field 4]`.
4. **Existing AATF dereg number format:** "D followed by year, month and a 7 digit running number, for example D690000638"; month "October: 0", "November: N", "December: D" `[SRD REQ-016 Existing]`.
5. **Existing JPJ dereg payload** is 10 "~"-separated fields ending "AATF ID No ~ AATF Name ~ PBT Name" `[SRD §2.2.5.1]`.
6. **Existing prod PBT records:** 5040001 Majlis Bandaraya Melaka Bersejarah, 5040002 Majlis Perbandaran Jasin, 5050001 Majlis Bandaraya Seremban, 5100001 Majlis Perbandaran Kajang `[SRD §2.2.4.1]`.
7. **Existing cancellation remark format:** "CANCELLED BY [BackOffice user] on [DD-MM-YYYY HH:MM]" `[SRD v1.1 REQ-025 b]`.
8. **Existing daily 5-vehicle pre-check limit is gone:** "The earlier limit of 5 eDereg Pre-Checking enquiries per user per day for different vehicle numbers has been removed, as confirmed by the developer." `[SRD REQ-037 Existing]`
9. **cr-ledger.md row 24** and **lib/ticketStudies.ts lines 952–955** are stale: ETA now 2026-10-29, fix version "[QA]Ready for Testing Tickets (2026-11-02)", SRD v1.1 now in the Studying folder.
