# EAINT-12028 — study (2026-10-28)

Older ticket folder: `_reference/tickets/EAINT-12028/` (left untouched; referenced below). All 11 Jira attachments are now in this Studying folder, with text copies for the .docx, .html and .xlsx files.

## Header

1. **Title (verbatim, Jira Summary):** "🔴[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)"
2. **Jira status:** **In Development** (since 2026-10-05 11:21). Type **Task**. Priority **Medium**. Jira "Updated: 2026-10-19T14:51:36.167+0800".
3. **Fix version:** "S35.X-20261126 🌞 (2026-11-26)". Exp. Deploy Date (cf 10087) "2026-11-26". Labels "260720-260724, July2026, ProductBacklog".
4. **QA (cf[10041]):** **Muhammad Faizuddin Bin Bidi** (set 2026-09-14 by the QA manager). Miro "QA: Faiz".
5. **BA:** Chee Mei Jia (Jira Reporter; SRD author). Miro "BA: MJ".
6. **Dev:** Jira Assignee "**Shane**" (Kasheng Liew), who took over 2026-09-24 per Teams. Jira Developer field = original dev "izfarwiza" (account since removed).
7. **Deployment date:** **26 Nov 2026**. Miro column "26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)".
8. **Test env:** **not stated** — Miro "Test Env:" blank; not in Jira, SRD or Teams.
9. **Effort:** Miro "Est. Testing Mandays: 10 days (1 QA)" ("Base Testing Time: 8 days" + "Buffer (Req Change + Bug Fix + Retest Bug): 2 days"), "~150 TS". Jira "[QA] Est Man-day (cf 10081): 10".
10. **ETA for Testing (cf 10057):** "2026-08-28" (stale).
11. **Links / sub-tasks / parent:** none ("—"). Text references: EAUTO-977, CCB-848.

## Changes since last study (2026-10-28)

Compared against the 2026-10-26 study and the 2026-10-28 11:17 Jira capture (`EAINT-12028-jira.md`).

1. **Status:** **no change** — "In Development".
2. **Fix version:** **no change** — "S35.X-20261126 🌞 (2026-11-26)". Exp. Deploy Date still "2026-11-26".
3. **Description:** **no change** — same six-row General Information table and same SRD history table (v0.1 to v1.1).
4. **New comments:** **none** — "## Comments (0)".
5. **New attachments:** **none** — same 11 files; newest is still "EAINT-12028_SRD_v1.1_20260731.pdf — 329325 bytes, 2026-07-31T17:04:36.698+0800".
6. **Jira "Updated" timestamp:** "2026-10-19T14:51:36.167+0800" — same as the last change recorded at the 2026-10-26 study (QA lead moved Exp. Deploy Date to 26/Nov/26). **No Jira change found after 2026-10-26.** [unconfirmed] The re-study trigger may come from the capture tool, not from a real Jira edit.
7. **Teams:** no new EAINT-12028 messages in `_reference/teams/` (exports still end 2026-10-16; last ticket-chat message 2026-10-14 12:03).
8. **What is new locally (not in Jira):**
   1. **Sample ASSOCIATIONS PAYMENT REQUISITION xlsx is now downloaded and read.** The 2026-10-26 study said "not in repo" — now wrong, fixed below.
   2. **Older SRDs (v0.1–v1.0) and older mockups now read.** Found: Finance view-only role removed after v0.1; date format changed; older mockups had a Motorcycles total bug. See "SRD history" below.
   3. **Sample vs SRD differences found** (Attn name, FMC account holder text, Malay month, an extra "Address" row). See Open questions 11–14.

## Sources read

1. `EAINT-12028-jira.md` — Jira capture 2026-10-28 11:17: fields, description, 0 comments, 11 attachments.
2. `EAINT-12028-jira-comments.md` — 0 comments; changelog to 2026-10-19.
3. `EAINT-12028-miro-card.md` — Miro "eAuto - QA Resource Planning" card, captured 2026-10-26.
4. **SRD v1.1 (2026-07-31) — latest.** Read via `EAINT-12028_SRD_v1.1_20260731-text.md`. PDF copy present (329,325 bytes, same size as the Jira attachment).
5. Older SRDs read via text copies: v0.1 (23.07), v0.2 (27.07), v0.3 (29.07), v1.0 (30.07). `EAINT-12028_SRD_v1.0_20260730.pdf` not opened separately (same content as its .docx text copy [unconfirmed]).
6. Mockups read via text copies: `association-payment-listing-mockup_20260731-text.md` (latest), `association-payment-listing-mockup-text.md` (27.07), `association-payment-listing-mockup (19acf3b0-…)-text.md` (30.07).
7. `Sample ASSOCIATIONS PAYMENT REQUISITION_20260728-text.md` — sheets "FMC Payment" and "MMSD Payment" (cell text only; some cells show "[object Object]" or a formula, so the figure cells are not readable).
8. Older folder `_reference/tickets/EAINT-12028/`: SRD v1.1, mockup, dev QA guide `EAINT-12028-artifact-qa-test-guide-from-dev.html`, flow artifact, 27-scenario TS xlsx, `Session-Handoff-2026-09-14-12028.md` (content used through `knowledge/flow-association-payment-listing.md` and the 2026-10-26 study; not re-opened this run).
9. Teams: `_reference/teams/EAINT-12028-Association-Payment-Listing.md`, `DM-May-Chin-Mei-Theng.md`, `DM-Charmain-Ea-Chiang.md`, `eAuto-QAs.md`, `eAuto-Secarang-Main-Group.md` (grep EAINT-12028 / 12028).
10. Knowledge: `knowledge/README.md`, `knowledge/flow-association-payment-listing.md`, `knowledge/cr-ledger.md` § EAINT-12028, `knowledge/people-and-roles.md`, `knowledge/flows.md`, `knowledge/flow-bo-shell.md` (line 501), `knowledge/teams-decisions-by-ticket.md` § EAINT-12028 (via the 2026-10-26 study).
11. `lib/ticketStudies.ts` key "EAINT-12028" (studiedAt "2026-10-26").
12. Miro high-level flow board `https://miro.com/app/board/uXjVHrYDgq8=/?share_link_id=681586431515` `[_reference/miro-links.txt line 6]` — **not opened** (no browser in this run).

### Attachment list (Jira, unchanged)

1. EAINT-12028_SRD_v0.1_20260723.docx; v0.2_20260727.docx; v0.3_20260729.docx; v1.0_20260730.docx/.pdf; **v1.1_20260731.docx/.pdf (latest)** — all in this folder.
2. association-payment-listing-mockup.html (2026-07-27), "(19acf3b0-…).html" (2026-07-30), **association-payment-listing-mockup_20260731.html** (latest) — all in this folder.
3. Sample ASSOCIATIONS PAYMENT REQUISITION_20260728.xlsx (64,303 bytes) — **now in this folder** with a text copy.

## What changes

1. **Portal / module:** "Affected Portal | BackOffice"; "Affected Module | New Module – Association Payment Listing". `[Jira description rows 1-2]` Menu path: SRD §2.2.3 row 1 "New menu item "Association Payment Listing" added under Reports."
2. **What:** "Automate association/vendor payment requests to Associates (FMC, MMSDA, JomCheck). System to record entries and produce summary listings that the current process lacks." `[Jira description row 3]`
3. **Expected behaviour:** "1. System retrieves data and auto-calculates monthly payment amounts to vendors. 2. Generate invoice for FMC and MMSDA. 3. Generate payment request with approval line (Ops), routed directly to Finance to view, approve and proceed with payment. 4. Track transaction listing, review date, approved date, submit-to-finance date and payment date. 5. Statement of account for FMC and MMSDA to track monthly amount and payout. 6. BackOffice view for Ops team review." `[Jira description row 5]`
4. **Why:** "Ops manually exports approved STMS, eSTM & APT transactions and compiles them in Excel by vehicle/state. Report is sent to Finance to verify and make payment. Process is manual, cross-division and time-consuming, with no entry records or summary listing." `[Jira description row 4]`
5. **Phase 1 scope:** SRD §2.1 row 2.1.3 "Phase 1 covers Car and Motorcycle only. JomCheck is deferred to a later phase (liaised with Nurul on 23.07.2026)."
6. **Jira description vs SRD:** Jira row 5 still says "routed directly to Finance to view, approve" and "Statement of account for FMC and MMSDA". SRD v1.1 has **no Finance role** and **no statement of account** requirement. SRD v0.2 "Removed Finance-related handling". **SRD wins.**

### Pages (SRD §2.2.3)

1. "BackOffice Home — Reports menu" — "New menu item "Association Payment Listing" added under Reports."
2. "Association Payment Listing — Summary" — "Monthly summary listing per year with amounts, workflow statuses and payment date."
3. "Association Payment Listing — Details" — "Monthly state-level breakdown (Cars and Motorcycles), approval workflow, audit log and payment request download."

### Requirements (SRD v1.1)

1. **REQ-001** menu item — "The item appears under Reports; clicking it navigates to the Association Payment Listing summary page."
2. **REQ-002** Year filter + Search — "Provide a Year filter (available years start from 2026) and a Search button. Only Year is required as a filter."
3. **REQ-003** role by login — "Mapping: 1. Drafter: eautozara, mfared, mfizni 2. Reviewer: eautonurul, mfizni 3. Approver: kmcheah, mfizni A user may hold more than one role (e.g. mfizni)." / "a user not mapped to any role cannot perform Drafter / Reviewer / Approver actions."
4. **REQ-004** monthly rows — columns "Car Transactions", "Cars (RM)", "Motorcycle Transactions", "Motorcycles (RM)"; "Months with no data show "No data"."; "A year-to-date / full-year total row is displayed."; "counted based on the JPJ Approved Date."
5. **REQ-005** status columns — Drafter "Pending / Approved / KIV / Review Again"; Reviewer "Pending / Approved / Review Again"; Approver "Pending / Approved"; "(All three statuses start as Pending.)"
6. **REQ-006** Finance Payment Date column — "in DD-MM-YYYY format; display "-" when not yet set."
7. **REQ-007** View link — "Clicking View opens the details page for that month."
8. **REQ-008** state breakdown — "The 16 states shown are" Johor (01) to W.P. Putrajaya (16); "Amounts are displayed in #,##0.00 format"; "FMC (Car) = RM1.00 per approved transaction"; "MMSDA (Motorcycle) = RM2.00 per approved transaction"; "Example: 1,456 approved motorcycle transactions × RM2.00 = RM2,912.00."
9. **REQ-009** sequence — "Action buttons are disabled with a waiting note until the previous step is approved."
10. **REQ-010** Drafter — "Approve or KIV".
11. **REQ-011** Reviewer — "Approve or Reject (remarks mandatory on Reject)"; Reject "returns to Drafter, Drafter Status = Review Again."
12. **REQ-012** Approver — "Approve or Reject (remarks mandatory on Reject)"; Reject "returns to Reviewer, Reviewer Status = Review Again."
13. **REQ-013** payment date — "mandatory, future date only"; "Empty or past date → Rejected with a validation message"; "User attempts to type or paste a date → Input is blocked".
14. **REQ-014** e-signature — "Signature pad is shown" on first approval; "The stored signature is reused; the pad is not shown again."
15. **REQ-015** audit log — seven log examples, e.g. "Reviewer — Rejected (returned to Drafter)" with remarks; signature "not displayed as an image in the log".
16. **REQ-016** download — buttons only when fully approved; else note "Payment Request documents will be available for download once the Drafter, Reviewer and Approver have all approved."; file name "Payment Requisition_<Association>_<Month> <Year>.pdf", e.g. "Payment Requisition_FMC_January 2026.pdf".
17. **REQ-017** document format — "the amount in words matches the amount in figures."
18. **REQ-018 / REQ-019** FMC / MMSDA field mapping — 19 rows each, Fixed vs Flexible. Key flexible rows: "Date | Flexible | Approver's approved date. Format: DD-MM-YYYY"; "Requestor | Flexible | Full name of the Drafter who approved"; "Reason for Payment (line 2 — Month Year) | Flexible | The record month, English short form. Format: MON YYYY (e.g. JUN 2026)"; "Amount Payable | Flexible | ... Format: XX,XXX.00 (figures) plus the amount in words". Attn row: "Attn | Fixed | Marie Ann".

### SRD history (from the older SRD text copies)

1. **v0.1 had a Finance role:** "EAINT-12028-REQ-016 | Finance view-only | The Finance role (user ID: eautoaccount) can view the summary and details but has no workflow actions." `[SRD v0.1 §2.2.9]` Removed in v0.2: "Removed Finance-related handling". `[SRD v1.1 §1.3]`
2. **Date format changed:** v0.1 REQ-006 "in DD.MM.YYYY format ... e.g. 31.07.2026" → v1.1 "in DD-MM-YYYY format ... e.g. 31-07-2026".
3. **Attn:** v0.3 and v1.0 "Marie Ann (to be confirmed with Marie)" → v1.1 "Marie Ann". `[SRD v1.1 Appendix rows 22-23]` "Attn confirmed as "Marie Ann""
4. **Transaction count columns** added only in v1.1 (Appendix rows 20-21).
5. **Older mockups (27.07, 30.07)** have no transaction-count columns, and their total row shows Motorcycles "234,183.00" (the count, not × RM2). Latest mockup (31.07) shows "234,183 | 468,366.00". **Use only the 31.07 mockup.**

### Sample requisition xlsx (BA attachment, 28.07.2026)

1. Sheets: "FMC Payment" and "**MMSD Payment**" (the "MMSD" spelling the Jira note calls a deck typo).
2. FMC sheet R8 "Attn: | Justin Ng"; R9 "Requestor: | Muhammad Fared"; R14 "eAUTO PAYMENT TO FMCCAM ⏎ JUN 2026"; R30 "EIGHTY THREE THOUSAND THIRTY FIVE ONLY".
3. FMC Pay-to: R20 "Account Holder Name | | | FED OF MOTOR & CREDIT COMPANIES ASSO MSIA"; R21 "Address | | | (PPM-001-14-11041979)".
4. MMSDA sheet R14 "eAUTO PAYMENT TO MMSDA ⏎ MEI 2026"; R19 "Account Holder Name | | | MALAYSIA MOTORCYCLE & SCOOTER DEALERS"; R20 "Address | | | ASSOCIATION (MMSDA)"; R29 "TWO THOUSAND NINE HUNDRED TWELVE ONLY".
5. Sign-off names (FMC R38): "Muhammad Fared | | | | Nurul Saadiah | | | Chia Ket Ming" under "Prepared by: / Checked by: / Approved by:" (R34).
6. **Amount-in-words cross-checks:** 83,035 = the latest mockup's June car count ("6 | June | 83,035 | 83,035.00"); 2,912 = SRD REQ-008 example "RM2,912.00". [unconfirmed] that the sample used these exact figures — the figure cells read as "[object Object]".

## New vs existing behaviour

1. **Existing:** manual Excel export + compile + send to Finance. `[Jira description row 4]`
2. **New:** brand-new module; no existing page to regress inside it. Core login/logout touched → downtime. `[Teams 2026-08-26 11:46, original dev]`

## QA scope (Miro "Testing Scope: (Automation + Manual)")

1. "E2E Approval Workflow"
2. "Search and Filter"
3. "Role and Permission"
4. "E-Signature"
5. "~150 TS" — existing draft has **27 high-level scenarios** (`_reference/tickets/EAINT-12028/EAINT-12028 - [...].xlsx`, 2026-09-04, never executed). `[handoff 2026-09-14]`
6. Security re-checks from MR !1 review: **H1** cross-module role confusion, **H2** open redirect on session-expiry/logout. `[handoff 2026-09-14; flow-association-payment-listing.md QA Test Guide]`

## Affected regression areas

1. **BO login / logout / SSO** — "some changes in the login/logout updates in core". `[Teams 2026-08-26 11:46]`
2. **Role permissions across BO modules** (H1). `[handoff 2026-09-14]`
3. **eauto-cron** month-close job. `[flow-association-payment-listing.md QA Test Guide]`
4. Source data: STMS, eSTM, APT approved transactions; BO Transaction Listing export (state basis). `[Jira description row 4; Teams 2026-09-04 10:45]`
5. **Reports menu** on BackOffice Home (new item added among existing report links). `[SRD §2.2.3 row 1; mockup Reports list]`
6. Miro card lists no regression items ("Regression Testing:" blank).

## Test data / env needs

1. **Environment** — unknown; dev's guide used dev-box addresses only. `[flow-association-payment-listing.md QA Test Guide]`
2. **Role logins** hardcoded: Drafter eautozara / mfared / mfizni; Reviewer eautonurul / mfizni; Approver kmcheah / mfizni. `[SRD REQ-003]` Plus one **unmapped** BO user (negative case).
3. **Monthly transaction data** — approved + paid car/motorcycle (private + company) STMS / eSTM / APT records, incl. JPJ-cancelled cases.
4. **Month-close** must run before a month shows figures; manual trigger in the dev guide. `[flow-association-payment-listing.md QA Test Guide]`
5. Finance payment date: future-only picker. `[SRD REQ-013]`
6. **Expected PDF values:** SRD §2.2.10 / §2.2.11 field tables (fixed bank and contact values are there verbatim). The sample xlsx is **not** the expected result where it differs from the SRD (Open questions 11–14).

## Dependencies / related tickets

1. EAUTO-977 (source ticket), CCB-848. `[SRD §1.5 rows 2-3]`
2. MR !1 on `dev/feat/EAINT-12028` — was ⛔ BLOCK 2026-09-04; merge state unverified since. `[cr-ledger.md #5]`
3. Same Miro column: EAINT-11868, EAINT-12348, EAINT-12019 (26 Nov). `[cr-ledger.md table rows 22-25]`

## Teams decisions (exports end 2026-10-16; file `_reference/teams/EAINT-12028-Association-Payment-Listing.md` unless stated)

1. `[2026-08-04 12:00, BA]` "Requestor given green light for srd v1.1 ya"
2. `[2026-08-04 14:12, BA]` rates may change in future: "yes, there is a possibility"
3. `[2026-08-04 16:19, BA]` same person holding multiple roles may approve: "yes, there is a possibility on this ya"
4. `[2026-08-05 14:26, BA]` Pay-To / Attn on PDF: "as of now just make it as fixed info will do ya"
5. `[2026-08-26 12:12, dev lead]` "then this one need downtime, sorry If really need prepare for urgent deployment, then can deploy and hide the link in backoffice first"
6. `[2026-08-28 14:36, QA lead]` "please wait for QA's greenlight ya, dont deploy to any staging env first"
7. `[2026-09-04 10:32, BA]` "Item #1 - yes, no need to separate whether is private or company, as long as is car then total up the amount will do, same goes to motorcycle Item #2 - i dont think that ops team got this SOP, can u check again?"
8. `[2026-09-04 10:45 / 11:17, dev lead / BA]` "think we use UCD company state ya" — "yes ... they export file from backoffice trx listing ya"
9. `[2026-09-24 14:32, dev lead]` "Hi Kasheng Liew please help on this ticket."
10. `[2026-09-29 16:04, new dev]` "all ok except 1 bug.. once drafter click KIV.. nobody can approve that month anymore.. so the payment request can never be generated.. im fixing it now"
11. `[2026-10-14 12:03, BA]` "hiiii Everyone, just to update that this ticket will rearrange ya. not going to deploy on end of this month anymore. will update again on the targeteddeployment date"
12. `[DM-Charmain-Ea-Chiang.md, 2026-09-18 11:10, QA lead]` "(12028 estimate 8+2) oh i see, okie then i remain as 8+2 first ya"
13. `[DM-May-Chin-Mei-Theng.md, 2026-09-14 11:03, Faiz]` "I estimate it to be 2+2. not complicated to test but if there are any issues, might take some time for dev to fix"
14. On-hold quote "MJ ytd updated us that 12028 need to on hold first as we got other higher priority tickets" is cited as `[Teams via memory digest, 2026-10-15 09:56]` in `knowledge/cr-ledger.md`; **not found in the `_reference/teams/` exports**. Superseded by the 26 Nov Jira date (set 2026-10-19).

## Current state vs September memory

1. **Was:** status Ready For Development, MR !1 blocked, on hold (Sept–mid Oct).
2. **Now (2026-10-28, unchanged since 2026-10-26):** status **In Development** (dev took it 2026-10-05); target **26 Nov** (Jira Exp. Deploy Date + Fix Version + Miro). Miro says SIT/UAT/Target "TBC".
3. MR !1 merge state, KIV fix, H1/H2 fixes — **unverified** (no Jira comments, no Teams after 10-14 in exports).

## Open questions / risks for testing

1. **Test env** — never stated (Jira, SRD, Teams, Miro).
2. **TS count:** Miro "~150 TS" vs existing 27 high-level scenarios vs QA's Sept estimate "2+2" vs Jira 10 man-days.
3. **KIV behaviour conflict:** handoff/flow file say "KIV never locks the Drafter out" (mockup) and "a KIV'd month has no "un-KIV" button" (dev guide, deferred item L2); Teams 2026-09-29 new dev: "once drafter click KIV.. nobody can approve that month anymore" (being fixed). Confirm the final KIV rule.
4. **MR !1** — merged and H1/H2 fixed? Unverified since 2026-09-04.
5. **Cancelled-but-JPJ-approved** transactions: BA "i dont think that ops team got this SOP, can u check again?" (2026-09-04) — never answered.
6. **Zero-transaction month** display ("No data" vs "0.00") and **state row order** (SRD 01–16 vs mockup). `[handoff 2026-09-14 items 4-5; flow file]`
7. **Downtime** deployment needed (2026-08-26) — confirm night slot for 26 Nov.
8. **SIT/UAT dates** "TBC" on Miro.
9. **Developer field** still shows the original dev; assignee is the new dev — confirm dev PIC.
10. **Jira description still mentions Finance** ("routed directly to Finance to view, approve") and a "Statement of account"; SRD v1.1 has neither. Do not test them unless the BA says otherwise.
11. **Attn name:** sample xlsx FMC R8 "Justin Ng" vs SRD v1.1 "Marie Ann". SRD wins (v1.1 "Attn confirmed as "Marie Ann"").
12. **FMC account holder text:** sample R20 "FED OF MOTOR & CREDIT COMPANIES ASSO MSIA" vs SRD §2.2.10 row 10 "FED OF MOTOR & CREDIT COMPANIES ASSO MSI (PPM-001-14-11041979)". SRD drops the final "A" and moves the PPM number into the name. [unconfirmed] typo in SRD — ask BA which text the PDF must show.
13. **"Address" row:** sample has a Pay-to "Address" row (FMC R21, MMSDA R20). SRD §2.2.10 / §2.2.11 have no Address row. [unconfirmed] whether the PDF shows an Address line.
14. **Month language:** sample MMSDA R14 "MEI 2026" (Malay) vs SRD "English short form ... (e.g. MAY 2026)". SRD wins; check the PDF shows "MAY".
15. **Unmapped user access:** dev guide says a no-role user must get 403 on the module, but the Reports link is still visible. SRD REQ-003 only says they "cannot perform Drafter / Reviewer / Approver actions". [unconfirmed] whether view-only access is allowed.
16. **v0.1 Finance user "eautoaccount"** was removed. [unconfirmed] whether the build still grants it any access — worth one negative check.

## Suggested test focus

1. **Role gating (REQ-003, 009):** each mapped login sees only its own actions; mfizni can walk all three steps; unmapped user blocked; out-of-sequence actions rejected server-side.
2. **Workflow branches (REQ-005, 010–012, 015):** Drafter Approve / KIV; Reviewer Reject → "Review Again"; Approver Reject → Reviewer "Review Again"; reject remarks mandatory; each step logged in the Audit Log with the exact wording.
3. **KIV recovery:** after KIV, can the month still be approved (the 2026-09-29 bug)?
4. **Payment date (REQ-006, 013):** future-only, picker-only, typing/paste blocked; Summary shows DD-MM-YYYY.
5. **E-signature (REQ-014):** pad shown once per user, reused after; mfizni's one signature in all three blocks.
6. **Figures (REQ-004, 008):** car × RM1.00, motorcycle × RM2.00, #,##0.00 format, 16 states + TOTAL, JPJ Approved Date month, private + company totalled, UCD company state; cross-check against an independent BO report.
7. **PDF (REQ-016–019):** download hidden until fully approved (pending note verbatim); file name format; every Fixed/Flexible field vs SRD tables; amount in words matches figures; month in English "MON YYYY".
8. **Summary page (REQ-001, 002, 007):** menu entry, Year filter from 2026, 12 month rows, "No data" months, total-row label.
9. **Regression:** BO login / logout / SSO, other BO module roles (H1), session-expiry redirect (H2), Reports menu.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-association-payment-listing.md` (page map, DOM from mockup, workflow decision points, dev QA guide, traps).
2. `_reference/tickets/EAINT-12028/` (SRD v1.1, mockup, dev QA guide, flow artifact, 27-scenario xlsx, handoff 2026-09-14).
3. `lib/ticketStudies.ts` key "EAINT-12028" (requirements REQ-001..019, decisions, open items) → renders at `/jira/studies`.
4. `knowledge/cr-ledger.md` § EAINT-12028; `knowledge/teams-decisions-by-ticket.md` § EAINT-12028; `knowledge/people-and-roles.md` items 8, 13.
5. **No automation exists.** Benchmark for new automation: `app/eauto/12166` + `tests/service-hub` (eauto-automation-scaffold skill).

### Where this study contradicts current knowledge

1. `knowledge/flow-association-payment-listing.md` line 3: "ticket is still Ready For Development" — Jira now "In Development" (since 2026-10-05).
2. Same file lines 5-10: "Status 2026-10-15: ON HOLD" — superseded by Jira Exp. Deploy Date "2026-11-26" and fix version "S35.X-20261126".
3. Same file line 189 cites `Session-Handoff-2026-09-02-12028.md` — not in `_reference/tickets/EAINT-12028/` (only `Session-Handoff-2026-09-14-12028.md` exists).
4. `knowledge/cr-ledger.md` § EAINT-12028 item 2 SRD trail reads "0.2 27.07.2026 Initial Draft; 0.3 29.07.2026 "Removed Finance-related handling..."" — off by one version. SRD v1.1 §1.3: "0.1 | 23.07.2026 (Thurs) | Chee Mei Jia | Initial Draft"; "0.2 | 27.07.2026 (Mon) | Chee Mei Jia | Removed Finance-related handling; refined details and renumbered Requirement IDs."
5. `knowledge/cr-ledger.md` § EAINT-12028 item 6 "sample xlsx not downloaded" and item 10 "now on hold, date TBA" — both out of date.

## Knowledge candidates

1. **Sample requisition differs from SRD** (Attn "Justin Ng" vs "Marie Ann"; "ASSO MSIA" vs "ASSO MSI (PPM-001-14-11041979)"; extra "Address" row; Malay "MEI" vs English "MAY"). SRD v1.1 is the expected result. Source: `Sample ASSOCIATIONS PAYMENT REQUISITION_20260728-text.md` FMC R8, R20-R21, MMSDA R14, R19-R20; SRD v1.1 §2.2.10 rows 4, 10, §2.2.11 row 9. → `flow-association-payment-listing.md`.
2. **Finance role removed after SRD v0.1** ("The Finance role (user ID: eautoaccount) can view the summary and details but has no workflow actions."). Source: SRD v0.1 §2.2.9 REQ-016; SRD v1.1 §1.3 row 0.2. → `flow-association-payment-listing.md`.
3. **Sign-off real names** on the sample match the flow file: "Muhammad Fared", "Nurul Saadiah", "Chia Ket Ming". Source: sample FMC R38. → confirms `flow-association-payment-listing.md` role → name list.
4. **Status / date fixes** for `flow-association-payment-listing.md` (In Development, 26 Nov) and `cr-ledger.md` § EAINT-12028 (SRD trail, sample downloaded, no longer on hold). Source: `EAINT-12028-jira.md` (2026-10-28 capture), SRD v1.1 §1.3.
