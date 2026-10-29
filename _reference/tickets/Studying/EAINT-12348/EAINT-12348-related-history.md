<!-- Written by Scribe (pipeline history character), 2026-10-27.
     Sources: QA Team TS text copies in _reference/sharepoint/qa-team-ts/, knowledge/cr-test-scenario-catalogue.md,
     knowledge/flow-edereg.md, Jira captures fetched 2026-10-27 17:19 into _reference/tickets/Studying/<KEY>/. -->

# EAINT-12348 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-12348/brief.json` (2026-10-27).

1. **High-level scope**
   1. **BO Manage AATF/PBT Account:** create / update PBT and AATF accounts — new TIN, SST, Pre-Checking Email fields, read-only Company Type, all BO users get access.
   2. **PBT master list import:** 154 PBT + 4 AATF accounts created with status New; 4 existing prod PBTs migrated.
   3. **PBT login to eDereg:** active / inactive login, allowed modules only, PBT labels.
   4. **PBT eDereg Pre-Checking and Create Deregistration Steps 1–6:** PBT / Individu and AATF dropdowns at Step 2, Step 5 payment summary, PBT6… / PBTPC6… numbers, PDRG / PDPC RHB refs.
   5. **JPJ submission, COD upload and COD email** for PBT (Company ID starts with 5, PBT Shortform, sender dereg@eauto.my).
   6. **Invoice / e-Invoice** with PBT Buyer TIN, Registration No and SST No.
   7. **BO Cancel, 30-minute expiry, PBT Payment Report, Manage Users, BO search, JPJ XML Log, RHB Payment Transaction** for PBT records.
   8. **AATF regression** on every shared page (same pages as PBT).
2. **Estimated testing time:** **14 man-days**, range **13–16**, confidence **low** [unconfirmed]. Official figures: Jira "[QA] Est Man-day (cf 10081): "—"" and Miro "Est. Testing Mandays: days (1 QA)" (blank) `[EAINT-12348-study.md Header #5; QA scope #1]`.
3. **Modules / pages to cover**
   1. **Account Management (BackOffice):** Manage AATF/PBT Account — Create / Update Company Account, AATF/PBT Account Listing, Confirmation of Registration (PDF) — changed by REQ-001 to REQ-008 (account form, import, access).
   2. **Login and Homepage (AATF / PBT eDereg Portal):** Login page, Homepage menu — PBT login and module access (REQ-009 PBT login, REQ-027 PBT modules, REQ-028 PBT labels).
   3. **eDereg Pre-Checking (AATF / PBT eDereg Portal):** eDereg Pre-Checking Enquiry, eDereg Pre-Checking Transaction Listing and Details — PBT runs it; AATF regression (REQ-019 PBTPC number, REQ-034 same-org pre-check, REQ-035 6-month validity, REQ-036 declaration once, REQ-039 View / Resubmit).
   4. **Deregistration (AATF / PBT eDereg Portal):** Create Deregistration Transaction Steps 1–6, Deregistration Transaction Listing and Details, Upload COD — changed (REQ-011 PBT / Individu dropdown, REQ-040 AATF dropdown, REQ-012 Step 5 summary, REQ-013 own listing, REQ-022 COD).
   5. **Reports and Settings (AATF / PBT eDereg Portal):** PBT / AATF Payment Report, Audit Trail Log, Settings > Confirmation of Registration, Settings > Manage Users — REQ-029 PBT Payment Report, REQ-030 Settings.
   6. **eDereg (BackOffice):** Deregistration Transaction Enquiry, eDereg Pre-Checking Transaction Listing — PBT filter, Cancel and remark (REQ-021, REQ-025).
   7. **Settings / logs (BackOffice):** JPJ XML Log (Deregistration), JPJ XML Log (eDereg Pre-Checking), RHB Payment Transaction — PBT records searchable (REQ-032, REQ-033).
   8. **Documents and finance (BackOffice / email):** Invoice and e-Invoice PDF, COD email, eAuto Reconciliation report — PBT Buyer details (REQ-023), RHB reconciliation "included in QA testing" `[SRD §2.1.2 #3]`.

## Header

1. **Module / portal:** **eDereg (PBT as eDereg users)** on **AATF portal (eDereg login, shared with PBT)** and **BackOffice** — "1. AATF 2. BackOffice" `[SRD v1.1 §2.2.1 #2, via EAINT-12348-study.md]`.
2. **Past tickets kept:** **8** (5 full CR workbooks + 3 partial references; EAINT-10038 access matrix added 2026-10-27).
3. **Dropped as name-only matches:** EAINT-9951 (Service Portal HP listing), EAINT-6762 (UCD Company Account audit log), EAINT-11175 and EAINT-10937 (JomCheck), EAINT-11979 (Pre-App verify button), EAINT-9805 (Mobile App STMS Phase 6; its study `_reference/tickets/EAINT-9805/EAINT-9805-qa-team-ts-study.md` has 0 hits for dereg / AATF / PBT, checked 2026-10-27). None touch eDereg, AATF/PBT accounts or AATF reports.
5. **Same list, second copy:** EAINT-7229 (frontend to Chrome) "List of Modules and Pages that requires Thumbprint (UCD & AATF)" — catalogue row 118 says "Same as row 121"; kept under the EAINT-9944 thumbprint-list entry, not counted twice.
4. **Own official TS:** **none** in the QA Team folder yet.
5. **Earlier TS studies:** no `_reference/tickets/*/*-qa-team-ts-study.md` exists (Glob, 2026-10-27).

## Related past tickets

1. **EAINT-9306** — "🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow"
   1. Workbook: `QA Team - eAuto - CR Test Scenarios/EAINT-9306 - 🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow.xlsx`
   2. Why: **linked ticket**; same **Create Deregistration Step 2 pre-check gate** PBT must pass (REQ-010, REQ-034, REQ-035, REQ-036). Done 2026-09-15.
2. **EAINT-8655 & 9043** — "[eAuto - eDereg Pre-Checking] To issue e-Invoice and Invoice for successfully paid transaction starting from 1 Nov 2025"
   1. Workbook: `.../EAINT-8655 & 9043 - [eAuto - eDereg Pre-Checking] To issue e-Invoice and Invoice for successfully paid transaction starting from 1 Nov 2025.xlsx`
   2. Why: same **eDereg Pre-Checking e-Invoice / Invoice** flow; **Buyer TIN / SST / Registration No** checks map to REQ-006 and REQ-023; BO Cancel on pre-check listing maps to REQ-025.
3. **EAINT-8773 (+8742)** — "[eAuto-AATF & BackOffice] Add Showroom Address and Decision Maker Details in AATF/PBT Account Listing"
   1. Workbook: `.../EAINT-8773 - [eAuto-AATF & BackOffice] Add Showroom Address and Decision Maker Details in AATFPBT Account Listing.xlsx`
   2. Why: same page **BO Manage AATF/PBT Accounts > Create / Edit Company Account** (REQ-001 to REQ-008) and **AATF Settings > Confirmation of Registration** (REQ-030). Showroom fields are now hidden for PBT (REQ-008).
4. **EAINT-8781 (+8735)** — "[eAuto-BackOffice] Company Account Listing & AATF/PBT Account Listing To add filter and column for Decision Maker Details"
   1. Workbook: `.../EAINT-8781-[eAuto-BackOffice] Company Account Listing & AATFPBT Account Listing To add filter and column for Decision Maker Details.xlsx`
   2. Why: same page **BO Manage AATF/PBT Account > AATF/PBT Account Listing** (search, columns, Export CSV) — regression for the 154 imported PBT accounts (REQ-004).
5. **EAINT-9715** — "[eAuto][AATF] To enhance AATF Payment Reports module by adding new transaction type"
   1. Workbook: `.../EAINT-9715 - [eAuto][AATF] To enhance AATF Payment Reports module by adding new transaction type.xlsx`
   2. Why: same **Reports > AATF Payment Report**; REQ-029 renames it "PBT Payment Report" for PBT with "DEREG - Deregistration and eDereg Pre-Checking, the same as an AATF user."
6. **EAINT-10168** (partial — Dereg rows only) — "[eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance"
   1. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-10168 - [eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance.md`
   2. Why: SRD says "RHB payment reconciliation is included in QA testing" `[SRD §2.1.2 #3, via study]`; this workbook holds the Dereg and eDereg Pre-Checking reconciliation rows.
7. **EAINT-9944 / 7229 reference list** (partial) — "List of Modules and Pages that requires Thumbprint (UCD & AATF)"
   1. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-9944 - [eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2/List of Modules and Pages that requires Thumbprint (UCD & AATF).md`
   2. Why: lists the **AATF Dereg thumbprint steps** a PBT user will hit "exactly as an AATF user does" (REQ-010, REQ-022, REQ-030).
8. **EAINT-10038** (partial — sheet access ref only; added 2026-10-27) — "[eAuto] To Update Super Admin User Role"
   1. Text copy: `_reference/sharepoint/qa-team-ts/EAINT-10038 - [eAuto] To Update Super Admin User Role.md`
   2. Why: its **BO menu access matrix** is the "before" state for REQ-002 (Manage AATF/PBT Account access).

## What was tested before

1. **EAINT-9306** (13 TS)
   1. 9306_E2E_TS1 — "To test the full flow with VN = Have approved Pre-Check transaction within 6 months" `[E2E!R3]`
   2. 9306_E2E_TS2 — "To test the full flow with VN = No prior pre-check transaction" `[E2E!R4-R5]`
   3. 9306_E2E_TS3 — "To test vehicle number with invalid pre-check that is less than 6 months" `[E2E!R6-R7]`
   4. 9306_E2E_TS4 — "To test vehicle number with valid pre-check that is more than 6 months" `[E2E!R8-R9]`
   5. 9306_FC_TS1 — "To test cancelling the eDereg Pre-Checking Enquiry" `[Functional!R3]`
   6. 9306_FC_TS2 / TS3 — "To test Payment failed [RHB Code = IF]" / "[RHB Code = RE]" `[Functional!R4-R7]`
   7. 9306_FC_TS4 / TS5 — "Pre-checking returned failed = VEL000100E – VEHICLE RECORD NOT EXIST" / "Pre-checking function unavailable = VEL000045E – PLEASE CONTACT HELPDESK - VELVE" `[Functional!R8-R11]`
   8. 9306_FC_TS6 / TS7 — "[AATF] To check new item/column in dereg transaction details" / "[BO] ..." `[Functional!R12-R15]`
   9. 9306_FC_TS8 — "To check the announcement is appearing in the required pages" `[Functional!R16-R19]`
   10. 9306_FC_TS9 — "To test leaving the Vehicle No. field blank" `[Functional!R20]`
2. **EAINT-8655 & 9043** (83 TS ids)
   1. 8655_TS1–TS7 — new transactions: "eDereg Pre-Checking Happy Flow (Valid TIN)", "(Invalid TIN)", "Negative Flow (Valid TIN) - Trx Status = Cancelled" etc. `[E2E Flow!R3-R9]`
   2. 8655_TS8–TS14 — "LHDN Resubmission Cronjob" and "Consolidated e-Invoice Cronjob" `[E2E Flow!R10-R24]`
   3. 8655_TS15–TS33 — "Existing Transactions (Before Deployment & Before Cutoff Date)" `[E2E Flow!R19-R54]`
   4. 8655_FUNC_EINV_TS1–TS17 — e-Invoice PDF Buyer block: Name, Registration Number, **TIN**, **SST Registration Number**, Contact, Email, Vehicle Number, Address `[Functional Testing (e-Invoice)!R3-R19]`
   5. 8655_FUNC_INV_TS1–TS13 — same fields on the Invoice PDF `[Functional Testing (Invoice)!R2-R14]`
   6. 8655_SNF_TS1–TS20 — search and filter, incl. "BO > GST / SST Payment Report (eautoaccount)" `[Functional Testing (Invoice)!R17-R23]`
3. **EAINT-8773** (154 TS) + 8742 sheet (21 TS)
   1. 8773_ECA_TS01–TS71 — "Manage AATF/PBT Accounts > Edit Company Account": Decision Maker Name / Contact / Email, Showroom Address / Postcode / State / City / District, copy checkboxes `[8773!R8-R78]`
   2. 8773_ECA_TS72–TS142 — same fields on "Manage AATF/PBT Accounts > Create Company Account" `[8773!R79-R149]`
   3. 8773_COR_TS1–TS12 — "Confirmation of Registration (PDF)" in BO and "Settings > Confirmation of Registration" in AATF, existing and new company `[8773!R150-R161]`
4. **EAINT-8781** (47 TS) + 8735 sheet (4 TS)
   1. 8781_SNF_TS21–TS39 — "Manage AATF/PBT Account > AATF/PBT Account Listing" search and filters `[8781!R33-R50]`
   2. 8781_CAL_TS06–TS10 — AATF/PBT Account Listing columns and "Export CSV" `[8781!R60-R64]`
   3. 8735_CAL_TS03–TS04 — CSV with commas in name fields `[8735 !R10-R11]`
5. **EAINT-9715** (10 TS)
   1. 9715_F_TS1–TS6 — Payment Date, "Transaction Type", Payment Status, Transaction Status, "Generate Now", "Export" `[Filter!R2-R12]`
   2. 9715_TS1–TS4 — "No transaction made on current date", "New eDereg Pre-Checking Enquiry is made", "New Deregistration transaction is made", "There are transaction made, 2 weeks before current date." `[E2E!R2-R10]`
6. **EAINT-10168** (Dereg rows only)
   1. RECONLS_TS5 / TS6 — "No. of eAuto Trx < No. of RHB Trx" for "Dereg" / "eDereg Pre-Checking" `[text copy lines 51-52]`
   2. RECONLS_TS19 / TS20 — "No. of eAuto Trx = No. of RHB Trx" `[lines 76-77]`
   3. RECONLS_TS31 / TS32 — "No. of eAuto Trx > No. of RHB Trx" `[lines 95-96]`
7. **Thumbprint list** — AATF sheet: "Create New Transaction (MyKad, MyPR)" "STEP 3 ONLY"; "Upload Certificate of Destruction (COD)"; "Manage Users"; "First Time Login New AATF (Main User)" `[AATF!R3-R19]`

## Reusable scenarios

1. **Step 2 pre-check gate as PBT** — adapt **9306_E2E_TS1–TS4** with "Login into a PBT account"; add REQ-034 (AATF pre-check does not count for PBT).
2. **Pre-check payment fail / JPJ fail as PBT** — adapt **9306_FC_TS1–TS5**; check PBTPC number and PDPC Ref 1 (REQ-019, REQ-020).
3. **Dereg details "eDereg Pre-Checking: Yes" link** — **9306_FC_TS6 / TS7** as AATF + PBT regression.
4. **PBT e-Invoice Buyer block** — adapt **8655_FUNC_EINV_TS4–TS7** (TIN, SST) and **8655_FUNC_EINV_TS2–TS3** (Registration Number) for REQ-006 / REQ-023; source field moves to the PBT account form.
5. **Valid / invalid / blank TIN outcome** — adapt **8655_TS1, TS2, TS9** for PBT transactions.
6. **BO Cancel on pre-check listing** — adapt **8655_TS3, TS4, TS6** for REQ-025 (Pending / Failed incl. Payment OK; remark format).
7. **Account form field validation** — reuse **8773_ECA** pattern for new **TIN Number**, **SST Registration Number**, **Pre-Checking Email** + "Same as Company Email" checkbox (copy-checkbox pattern = **8773_ECA_TS33–TS37**).
8. **Confirmation of Registration for PBT** — adapt **8773_COR_TS4, TS7, TS11** for REQ-030 (Showroom hidden for PBT).
9. **AATF/PBT Account Listing regression** — **8781_SNF_TS21–TS39**, **8781_CAL_TS06–TS10** after the 154-PBT import.
10. **PBT Payment Report** — adapt **9715_F_TS2, 9715_TS2, 9715_TS3, 9715_F_TS6** (Transaction Type list, own records, export).
11. **RHB reconciliation** — rerun **RECONLS_TS19 / TS20** with PDRG / PDPC refs.
12. **BO menu access (REQ-002)** — reuse the **EAINT-10038 access ref** matrix (R3, R5, R12): log in as Super Admin and Hub Admin; before deploy Hub Admin = ✘, after deploy = ✔ and opens the page, same as Manage Company Accounts. (added 2026-10-27)

## Known traps

1. **Pre-check expiry cron makes "before deployment" Pending rows unusable:** "Cronjob will run on a daily basis and transaction with Pending status today will become Expired on the next day. Hence, this TS is unable to be executed as it is not valid in Production" `[8655 E2E Flow!R23, Remarks]`. Relevant to REQ-026 (cron 2am).
2. **Real TIN needed for e-Invoice:** "Note: To use real valid TIN Number to allow successful generation of eInvoice" `[8655 Functional Testing (e-Invoice)!R6-R7]`.
3. **Cron checks need the developer:** "Verify transaction didn't picked up by cronjob (to get help from dev)" `[8655 E2E Flow!R11]`.
4. **Multiple payment fails:** "simulate fail more than one time. if fail multiple time, payment history must increase" `[9306 Functional!R4, Remarks]`.
5. **RHB ER cooldown:** "RHB "ER" has its own ~12-minute cooldown between real attempts" `[_reference/tickets/EAINT-9306/Session-Handoff-2026-09-17-9306.md, 2026-09-14 §1]`.
6. **Reused vehicle numbers break gate tests:** "Always use a fresh, never-tested vehicle no. for TS2 (or any vehicle-not-exist/repurchase case)" `[same handoff, 2026-09-14 §3]`.
7. **VEL000100E is the only repurchase code:** "`VEL000100E` is the ONLY code that allows a repurchase. Each repurchase creates a brand-new pre-check transaction" `[same handoff, 2026-09-04 §3]`.
8. **Consent email field ids differ by entry point:** "standalone reuses `jpjReceiptEmail`, Deregistration's inline popup uses the new `dpc-consent-email`" `[same handoff, 2026-09-11 §6]`. Relevant to REQ-007 Pre-Checking Email.
9. **AATF/PBT listing email search was already flaky:** "Found existing issue related to 'Email Address' field where some return result, but some don't ⏎ As checked with dev, it is an existing query logic" `[8781!R50, Remarks]`.
10. **AATF/PBT Export CSV hides Decision Maker:** "Should NOT show any Decision Maker Details" `[8781!R64]`.
11. **Menu access changes with REQ-002 (settled 2026-10-27).** Not a conflict; before vs after.
   1. **Before:** "Manage AATF/PBT Account | ✔ | ✘ | ✘" under header "Sub-Menu | Jason Seah ⏎ SuperAdmin | Ong Hong Kee ⏎ Hub Admin | HUB ADMIN" `[EAINT-10038 TS text copy, sheet access ref, R12 and R3]` — Hub Admin cannot see it.
   2. **After:** "All BackOffice users can view and access Manage AATF/PBT Account. The access setting follows Manage Company Accounts under BackOffice > Account Management." `[SRD v1.0 §2.2.4 REQ-002, unchanged in v1.1, via Scout 2026-10-27]`.
   3. **Target matrix:** "Manage Company Accounts | ✔ | ✔ | ✔" `[10038 access ref R5]` — so Hub Admin should get ✔.
   4. EAINT-10038 Jira holds no access rule; the matrix is another QA's screen check from ~2026-05-28. [unconfirmed] still live on staging today.
12. **Thumbprint on Dereg:** "Step 3 - AATF | Please use login user's MyKad" `[Thumbprint list AATF!R6]` — PBT tester needs a MyKad / emulator tied to the PBT login user [unconfirmed].

## Past QA-Issues mentioned

1. **EAINT-9306** sub-tasks `[EAINT-9306-jira.md line 13]`: EAINT-12233, EAINT-12240, EAINT-12251, EAINT-12258, EAINT-12268, EAINT-12340.
   1. EAINT-12240: "Failed eDereg Pre-Checking transaction does not auto-expire via the daily cronjob" — retest for REQ-026.
   2. EAINT-12340: "Deregistration proceeds even when the vehicle status is not Active on the pre-check".
2. **EAINT-8655** sub-tasks `[EAINT-8655-jira.md line 13]`: EAINT-9053 ("e-Invoice PDF - Incorrect 'Classification'"), EAINT-9056, EAINT-9061, EAINT-9084.
3. **EAINT-8773** sub-tasks `[EAINT-8773-jira.md line 13]`: EAINT-9090, EAINT-9091, EAINT-9095, EAINT-9100, EAINT-9130 ("Confirmation of Registration PDF – “Address” column should be “Business Address”").
4. **EAINT-8781** sub-tasks `[EAINT-8781-jira.md line 13]`: EAINT-9089, EAINT-9109 ("Export CSV – All name related fields become misaligned when containing commas"), EAINT-9131, EAINT-9200, EAINT-9241.
5. **EAINT-9715** sub-tasks `[EAINT-9715-jira.md line 13]`: EAINT-11247, EAINT-11249, EAINT-11257, EAINT-11334, EAINT-11384.
6. **EAINT-10168** row: "https://mfservices.atlassian.net/browse/EAINT-11800" on RECONLS_TS20 `[text copy line 77]`.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — the official figure lives in the QA Portal, which agents do not open.

1. **Comparable tickets**

| Ticket | Scope | TS ids in text copy | QA-Issues | [QA] Est Man-day (cf 10081) |
|---|---|---|---|---|
| EAINT-9306 | Step 2 pre-check gate | 13 | 6 | **8** `[EAINT-9306-jira.md line 11]` |
| EAINT-8655 & 9043 | Pre-check e-Invoice / Invoice | 83 | 4 | "—" `[EAINT-8655-jira.md line 11]` |
| EAINT-8773 (+8742) | AATF/PBT account form fields | 154 (+21) | 5 | "—" `[EAINT-8773-jira.md line 11]` |
| EAINT-8781 (+8735) | AATF/PBT + Company listing filters | 47 (+4) | 5 | "—" `[EAINT-8781-jira.md line 11]` |
| EAINT-9715 | AATF Payment Report | 10 | 5 | "—" `[EAINT-9715-jira.md line 11]` |

   1. **EAINT-12348 itself:** "[QA] Est Man-day (cf 10081): "—"" `[EAINT-12348-study.md Header #5]`; Miro "Est. Testing Mandays: days (1 QA)" blank `[study, QA scope #1]`.
   2. **Dev estimate (not QA):** "could be around 5 to 6 days ya" `[Teams, 2026-09-28 10:20, dev lead, via study]`.
2. **Expected TS count for EAINT-12348:** **80–110**. 38 active REQs spread over BO account form, import, PBT login, Step 2, numbering, payment refs, JPJ payloads, COD email, e-Invoice, cancel, expiry, reports, BO logs, plus AATF regression on shared pages. Wider than 9306 (13 TS, one gate) and touches the areas of 8655, 8773 and 9715 at once; field-validation depth like 8773 is not needed (only 3 new fields).
3. **Estimate in man-days: 13–16 (best single figure 14)**
   1. **TS drafting:** 2.5 (SRD v1.1, 88 pages; reuse rows listed above).
   2. **Test execution:** 7 (PBT E2E with JPJ / RHB / eSIM steering, COD + mailbox checks, e-Invoice with real TIN, BO logs, AATF regression).
   3. **Retest / QA-Issue buffer:** 2.5 (comparables raised 4–6 QA-Issues each).
   4. **Automation build:** 1.5–4, only if requested — adapt `scripts/eauto-edereg-precheck` to a PBT login [unconfirmed reuse]. Manual-only total: **12**.
4. **Confidence: low.**
   1. SRD v1.1 not signed off; Perakuan "Pending requestor." `[study, Open questions #3, #4]`.
   2. Test env and QA not assigned `[study, Header #6, #10]`.
   3. Would rise to medium once SRD is signed off, REQ-040 mock-up arrives and a PBT login exists on staging.

## Knowledge candidates

For the Sage to fold into `knowledge/` (Scribe does not edit it).

1. **BO menu access before EAINT-12348 (PBT as eDereg users):** "Manage AATF/PBT Account | ✔ | ✘ | ✘" for SuperAdmin / Hub Admin / HUB ADMIN `[EAINT-10038 TS copy, access ref R12]`; REQ-002 opens it to all BO users. Target: `knowledge/flow-edereg.md` near line 5476.
2. **Pending pre-check rows expire overnight**, so "before deployment" Pending cases cannot be run: "Cronjob will run on a daily basis and transaction with Pending status today will become Expired on the next day." `[8655 E2E Flow!R23, Remarks]`.
3. **e-Invoice tests need a real TIN:** "Note: To use real valid TIN Number to allow successful generation of eInvoice" `[8655 Functional Testing (e-Invoice)!R6]`.
4. **AATF/PBT Account Listing Export CSV leaves out Decision Maker:** "Should NOT show any Decision Maker Details" `[8781!R64]`.

## Sources read

1. `_reference/tickets/Studying/EAINT-12348/EAINT-12348-study.md` (Scout, 2026-10-27).
2. QA Team TS text copies in `_reference/sharepoint/qa-team-ts/`: EAINT-9306, EAINT-8655 & 9043, EAINT-8773, EAINT-8781, EAINT-9715, EAINT-10168 (Dereg rows), EAINT-9944 thumbprint list (AATF sheet).
3. Dropped after check: EAINT-9951, EAINT-6762, EAINT-11175, EAINT-10937, EAINT-11979 (titles only; no eDereg / AATF content).
4. `knowledge/cr-test-scenario-catalogue.md` — "### AATF / eDereg" section (lines 265-272) and line 217.
5. `knowledge/flow-edereg.md` — lines 4762-4763, 5026, 5077-5100, 5455-5481.
6. `_reference/tickets/EAINT-9306/Session-Handoff-2026-09-17-9306.md` (lines 1-905).
7. Jira captures fetched 2026-10-27 17:19 with `fetch.mjs issue`: EAINT-9306, EAINT-8655, EAINT-8773, EAINT-8781, EAINT-9715 (`_reference/tickets/Studying/<KEY>/<KEY>-jira.md`).
8. `_reference/sharepoint/qa-team-ts/INDEX.md` — **not found** at that path.
9. **Added 2026-10-27 (after Scout reply):** `_reference/sharepoint/qa-team-ts/EAINT-10038 - [eAuto] To Update Super Admin User Role.md` (sheet access ref R3, R5, R12, checked); Scout answer citing `_reference/tickets/Studying/EAINT-10038/EAINT-10038-jira.md` and SRD v1.0 text line 132.
