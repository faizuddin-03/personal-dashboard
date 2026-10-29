# CR ledger — one durable entry per change request

## How to read this

1. One section per Jira ticket the repo knows about, sorted by key. Each section
   records the **durable outcome** of the CR: what the system now does because of
   it, the settled decisions (who, when), the SRD version trail, where the test
   script and evidence live, what automation exists in this repo, related bug
   tickets, deploy date / release version, and the QA and dev PIC.
2. This file is the agreed exception to the "no sprint state" rule in
   `README.md`. It still does **not** hold moment-to-moment status. "Open
   questions" are dated as "at last sight" and may already be answered elsewhere.
3. Every fact carries a provenance tag. Tags used here:
   `[from SRD EAINT-xxxx vN.N §n]`, `[from handoff YYYY-MM-DD EAINT-xxxx]`
   (a `_reference/tickets/<KEY>/Session-Handoff-*.md`), `[from NOTES.md EAINT-xxxx]`,
   `[from lib/ticketStudies.ts · <key>]`, `[from study <file>]` (a
   `*-study.html/.md` under `_reference/tickets/`), `[from Teams, date, person]`
   (quoted inside a repo file), `[from Teams via memory digest, date]`
   (`memory/teams-catchup-2026-10-06-to-15.md` or
   `memory/current-active-tickets-2026-09-15.md`), `[from appraisal proof pack
   2026-10-15]` (`_reference/inbox/appraisal-FY2026-proofs.md`, Jira/SharePoint
   data compiled that day), `[from knowledge/<file> §n]`, `[unconfirmed]`.
4. Release/deployment dates are collected chronologically in `releases.md`.
5. SharePoint paths follow the convention in `_reference/README.md` and the
   appraisal proof pack: CR test scripts in
   `QATeam/Shared Documents/1. eAuto Project/eAuto - CR Test Scenarios/`, CR
   evidence in `.../eAuto - Test Evidence/1. Enhancement CR/<KEY>/`, production
   regression in `.../eAuto - Test Evidence/3. Production Regression/`,
   Secarang/CIBO scripts in `2. Secarang & CIBO Project/Enhancement CR Test
   Scenario/` and evidence in `2. Secarang & CIBO Project/Test Evidence/Enhancement
   CR/`. `[from appraisal proof pack 2026-10-15]` Local copies sit in
   `_reference/tickets/<KEY>/` named `<KEY> - <Jira summary>.xlsx`.
6. Module family maps worth knowing before reading single entries:
   a. Shopping Cart family: CCB-618 (umbrella) → EAINT-10960 (Software
      Installation) → EAINT-11880 (Biometric Device Purchase) → EAINT-11881
      (Change Main User) / EAINT-11882 (Account Termination); bugs 11996 / 12095 /
      12103 / 12104 sit under 11880; EAINT-12167 (serial capture) feeds
      EAINT-12166 (DO generation). `[from handoff 2026-09-17 EAINT-11880]`
   b. JomCheck lineage: EAINT-10089 / 10937 / 11175 (permission and sharing),
      EAINT-12339 (API v2.0), EAINT-12412 (invoice split), EAINT-12386 (chassis
      special chars). `[from knowledge/flow-jomcheck.md index row in README.md]`
   c. UCD onboarding payments: EAINT-12153 (Card + FPX B2B) → EAINT-12257
      (DuitNow QR) ; EAINT-12414 is a production bug on the same payment step.
   d. CIBO: EAINT-11934 (Payment Report UCD Name, prod 2026-07-24) → EAINT-12058
      (Transaction Listing UCD Name) → EAINT-12151 (date fields) → EAINT-12327
      (Payment Mode format, with EAINT-12107 on the Secarang side).

---

## EAINT-9306 — [eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow

1. **Module / portal:** AATF portal, eDereg Pre-Checking + Deregistration Step 2;
   BackOffice Dereg enquiry and eDereg Pre-Checking listing. `[from lib/ticketStudies.ts · EAINT-9306]`
2. **SRD trail** (`_reference/tickets/EAINT-9306/`): V0.1 29.12.2025 Initial Draft; V0.2
   02.01.2026 "To add announcement for eDereg Pre-Checking"; V1.0 02.01.2026 "To send
   out for external review"; V1.1 01.09.2026 "Updated Section 2.3.2.1 Input Field &
   Validation Specification"; V1.2 10.09.2026 (Chee Mei Jia) "Added Section 2.2.4
   eDereg Pre-Checking Enquiry Declaration / Added Section 2.2.5 eDereg Pre-Checking
   Enquiry Declaration Wording". Authors Batrisyia Hasanah Nursyamsi (V0.1–V1.1).
   `[from SRD EAINT-9306 V1.2 §1.3]`
3. **What it changed (durable):**
   a. "introduce a validation check during Step 2 when an AATF user creates a new
      eDereg transaction. The system will verify whether the entered vehicle number
      has been approved in the eDereg Pre-Checking listing. If the vehicle number is
      not approved, the system will block the user from proceeding to Step 3".
      `[from SRD EAINT-9306 V1.2 §2.1.1]`
   b. Gate = Approved + Paid + JPJ-Approved pre-check within the last 6 months, all
      four conditions at once; two entry points (standalone enquiry first, or inline
      at Step 2). `[from lib/ticketStudies.ts · EAINT-9306]`
   c. Red bold announcement banner on AATF Home, eDEREG page and Create
      Deregistration option (REQ-002); "eDereg Pre-Checking: Yes" hyperlink row on
      AATF and BO Dereg enquiry views (REQ-003); vehicle-number search on the BO
      eDereg Pre-Checking listing (REQ-004). `[from lib/ticketStudies.ts · EAINT-9306]`
   d. V1.2 added the **"Perakuan eDereg Pre-Checking - AATF" consent declaration**
      on the Step 2 Vehicle+Payment popup with one editable email field
      (`#dpc-consent-email`, prepopulated from the company record when present,
      mandatory, letters/digits/dot/underscore/hyphen, max 100 chars). Shown on
      first-time purchase only, never on resubmit / RE retry (REQ-007).
      `[from handoff 2026-09-17 EAINT-9306, 2026-09-11 and 2026-09-10 sections]`
      `[from Teams, 2026-09-10 ~15:30, BA (Mei Jia Chee): "The perakuan we just wan to apply to those first time purchase ya. No need to apply to those resubmit & RE case."]` (quoted in `9306-perakuan-ts-study.html`)
   e. Expiry has two mechanisms: the 6-month SRD rule on an Approved pre-check's
      JPJ-approval age (dev patch only), and a daily cronjob at 23:59:59 that expires
      non-Approved pre-checks after ~1 day, skipping same-day records.
      `[from lib/ticketStudies.ts · EAINT-9306]`
   f. Multiple coexisting pre-check records per vehicle+company are intended: "a
      later failed or cancelled attempt does not cancel out an earlier approved one".
      `[from lib/ticketStudies.ts · EAINT-9306, quoting the dev QA guide]`
   g. RHB "ER" (API Down) has its own ~12-minute cooldown between attempts, separate
      from RE's ~6-minute reset timer. `[from handoff 2026-09-17 EAINT-9306, 2026-09-14 §1]`
4. **Settled decisions:**
   a. Invoice / e-Invoice / JPJ Official Receipt scope addition rejected from 9306;
      Ops "will create new CR for the recent feedback". `[from Teams, 2026-09-08 17:08, Batrisyia]` via `[from handoff 2026-09-17 EAINT-9306, 2026-09-10 §1]`
   b. "Method 2" chosen: hold the build and ship the perakuan popup together;
      9306 pulled from the 9/10 deployment, retargeted 15 Sep. `[from Teams, 2026-09-09 16:02, Charmain "yup2"]` via the same handoff.
   c. Phase split: this round stops at a working AATF-side flow; BO verification is
      phase 2. `[from lib/ticketStudies.ts · EAINT-9306, Faizuddin 2026-08-21]`
   d. Dev-patch-dependent scenarios are authored as Part 1 / Part 2 around the
      handoff; default AATF account `faizuddinAATF`. `[from lib/ticketStudies.ts · EAINT-9306]`
   e. Environment uat1. `[from lib/ticketStudies.ts · EAINT-9306, Faizuddin 2026-08-21]`
5. **Open at last sight (2026-09-17):** SRD V1.2 names only "resubmitted" as the
   no-perakuan case and never names RE explicitly (TS13–16 assume RE is covered).
   `[from handoff 2026-09-17 EAINT-9306, 2026-09-10 §3]` TS11 Part 2 and TS12 Part 2
   automation have no clean live pass. `[from memory eaint-9306-ts11-ts12-need-retest.md, 2026-09-14]`
6. **TS / evidence:** QA test plan PDF `_reference/tickets/EAINT-9306/[eAuto - AATF] Deregistration - Test Plan (2).pdf`
   (38 cases: CPC_E2E_TS1–12, AM_TS1–4, CJ_TS1–5, OF_TS1–5, MU_TS1–12) `[from lib/ticketStudies.ts · EAINT-9306]`;
   perakuan TS list (18 feature + 6 regression) in `9306-perakuan-ts-study.html`
   `[from study 9306-perakuan-ts-study.html]`; SharePoint TS
   `EAINT-9306 - 🔴[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step ....xlsx` (2026-06-25);
   evidence folder EAINT-9306 (Old + New Requirements, CPC_E2E_TS1–TS12, PRK TS01–TS11);
   post-deploy regression `20260915 - 15th September Morning Deployment`. `[from appraisal proof pack 2026-10-15 §A, §C]`
7. **Automation in repo:** `scripts/eauto-edereg-precheck/` (52 specs) + `app/eauto/edereg-precheck`
   with BulkRun/CustomRun/JPJ-code checker tabs; happy path confirmed live
   2026-08-24. `[from appraisal proof pack 2026-10-15 §D]` `[from lib/ticketStudies.ts · EAINT-9306]`
   Flow doc `knowledge/flow-edereg.md`; MyKad bypass `knowledge/mykad-emulator.md`.
8. **Related bug tickets:** EAINT-12233, 12240, 12251, 12258, 12268, 12340 (all
   QA-Issues raised by Faizuddin). `[from appraisal proof pack 2026-10-15 §B]`
   EAINT-12240 may not be a real bug (cronjob skips same-day records). `[from handoff 2026-09-17 EAINT-9306, 2026-08-28 section]`
9. **Deploy / release:** S33.6-20260915, Done; staging/uat1 signed off 2026-09-14
   18:20, "deployment is done" 2026-09-15 08:38 (Goh Kai Jiaeh), regression posted
   09:08. `[from knowledge/flow-edereg.md §44]` `[from appraisal proof pack 2026-10-15 §A]`
   QA man-days 8. `[from appraisal proof pack 2026-10-15 §A]`
10. **PIC:** QA Faizuddin; Jira assignee Batrisyia Hasanah Binti Nursyamsi, reporter
    Izni Zurni; dev confirmation by Goh Kai Jiaeh. `[from lib/ticketStudies.ts · EAINT-9306]` `[from knowledge/flow-edereg.md §44]`
11. **SharePoint script:** catalogue #098 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
12. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-9306.

---

## EAINT-10960 — [eAuto-UCD & BO] Shopping Cart – Software Installation module

1. **Module / portal:** UCD Service Hub > Software Installation; BO listing. Earliest
   EAINT phase of the Shopping Cart family (CCB-618). `[from handoff 2026-09-17 EAINT-11880]`
2. **SRD trail** (`_reference/tickets/EAINT-11880/SRD_EAINT-10960_Software_Installation_V1.2_20260724.pdf`):
   0.1 06.07.2026 Initial Draft; 0.2 10.07.2026 "Updated changes mainly in the flow
   and figma link"; 1.0 13.07.2026 "To send out for external review"; 1.1 16.07.2026
   and 1.2 24.07.2026 "Updated changes based on discussion with team and Ops".
   Author Batrisyia Hasanah Binti Nursyamsi. `[from SRD EAINT-10960 V1.2 §1.3]`
3. **What it changed:** self-service installation booking flow for UCDs (date + fixed
   time slot) with slot capacity control, reschedule handling and status tracking.
   "Number of Installations... No limit on the number of installation" (p.15
   §2.3.2.1) — the fact that settled EAINT-11996. `[from SRD EAINT-10960 V1.2 §2.1.2]` `[from handoff 2026-09-17 EAINT-11880]`
4. **TS / evidence / automation:** Service Hub rules in `knowledge/eauto-service-hub.md`;
   `tests/service-hub` suite covers the module family. Only title/version captured
   here; deep distillation is elsewhere.
5. **Related bugs:** EAINT-11951, 11970, 11972, 12025, 12091. `[from appraisal proof pack 2026-10-15 §B]`
6. **Deploy / release:** S31.9-20260727, Done, 7 QA man-days; 28 Jul 2026 regression
   evidence folder `20260728 - 28th July 2026 Deployment (eAuto Shopping Cart & Payment Report ...)`. `[from appraisal proof pack 2026-10-15 §A]`
7. **PIC:** QA Faizuddin. `[from appraisal proof pack 2026-10-15 §A]`
8. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § Shopping cart (EAINT-10960 / 11880 / 11881 / 11882 / 12099).
9. **Update 2026-10-27 from Charmain repo:** the team registry lists Charmain's SI/BDP
   suite as "EAINT-10960 Software Installation and EAINT-11880 BDP (Charmain)", with
   99 `si-e2e-*` + 14 `si-prc-*` scenario scripts for this CR. `[charmain-repo: intake/sources.yaml:121, 127-129]`
   Conflict (PIC): item 7 names QA Faizuddin `[from appraisal proof pack 2026-10-15 §A]`;
   the registry credits the SI suite to Charmain. Both may be true (shared testing);
   not resolved. Suite details: `flow-device-purchase.md` § "Charmain's SI/BDP suite".

---

## EAINT-11864 — [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase

1. **Module / portal:** UCD insurance quotation; hourly cronjob + email. `[from memory eaint-11864-automation-status.md]`
2. **What it changed:** hourly cronjob 07:00–23:00 emails a UCD when an approved
   eSTM has no completed insurance purchase; delivered the next hour (10:59 →
   11:00); anything after 23:00 waits for the 07:00 run; one email only; sender
   `imonitor@eauto.my`; content shows Vehicle No and Discount Amount (SRD says
   "Commission", stale). Quotations expire 24 hours to the minute. `[from memory eaint-11864-automation-status.md, 2026-08-13/17]`
3. **Settled decisions:** automate only the quotation-creating steps; email checked
   through a logged-in Chrome profile on Mailtrap (sandbox 2581833), not the
   Mailtrap API (senior QA, 2026-08-17); purchasing on staging is fine (sandbox
   payment) so TS04 buys; a fresh vehicle number per run. `[from memory eaint-11864-automation-status.md]`
4. **Open at last sight (2026-08-18):** whether QA can trigger the cronjob on demand;
   whether the quotation is persisted on "Show My Result" or on insurer select;
   nightly run off-laptop vs Chrome-profile check conflict. `[from memory eaint-11864-automation-status.md]`
5. **TS / evidence:** 12 cases `11864_TS01`–`TS12`, local
   `_reference/tickets/EAINT-11864/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase (2).xlsx`;
   SharePoint TS 2026-08-19; evidence folder EAINT-11864 (24 videos). `[from appraisal proof pack 2026-10-15 §C]`
6. **Automation in repo:** `scripts/eauto-quotation-reminder` (2 specs / 8 tests,
   nightly config) + `app/eauto/quotation-reminder`. `[from appraisal proof pack 2026-10-15 §D]`
   Paused 2026-08-13 pending team decisions. `[from memory eaint-11864-automation-status.md]`
7. **Related bugs:** EAINT-12199, 12213. `[from appraisal proof pack 2026-10-15 §B]`
8. **Deploy / release:** S32.8-20260820, Done, 2.5 man-days. `[from appraisal proof pack 2026-10-15 §A]`
9. **PIC:** QA Faizuddin. `[from appraisal proof pack 2026-10-15 §A]`
10. **SharePoint script:** catalogue #021 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
11. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-11864.

---

## EAINT-11880 — 🔴[eAuto-UCD & BackOffice] Shopping Cart - To Create Biometric Device Purchase Module

1. **Module / portal:** UCD Proforma Invoice / e-Invoice > Biometric Device Purchase;
   BO Biometric Device Purchase & Software Installation Listing. `[from SRD EAINT-11880 V1.2 §2.1.1]`
2. **SRD trail** (`_reference/tickets/EAINT-11880/SRD_EAINT-11880_Biometric_Purchase_V1.2_20260724.pdf`;
   duplicate in `_reference/tickets/Shopping Cart/`): 0.1 10.07.2026 Initial Draft;
   0.2 13.07.2026 "Added file name for Invoice and e-Invoice"; 1.0 14.07.2026 "To send
   out for external review"; 1.1 16.07.2026 and 1.2 24.07.2026 "Updated changes based
   on discussion with team and Ops". Author Batrisyia Hasanah Binti Nursyamsi. `[from SRD EAINT-11880 V1.2 §1.3]`
3. **What it changed:** "introduce a Biometric Device Purchase module under Proforma
   Invoice / e-Invoice in the UCD portal, allowing UCD to: 1. Book installation
   appointment (date + fixed time slot) 2. Receive confirmation/reschedule emails";
   slot capacity control, reschedule handling, Completed/Failed tracking for CSE.
   Quantity fields "accept integer values only; no additional maximum applies beyond
   the per-session appointment allocation caps (3 per session, 6 per day)" (p.22).
   The 40-unit purchase cap came later via EAINT-12166. `[from SRD EAINT-11880 V1.2 §2.1]` `[from handoff 2026-09-17 EAINT-11880]`
4. **Related bugs (children):** EAINT-11980, 11981, 11996, 12026, 12050, 12056, 12095,
   12103, 12104. `[from appraisal proof pack 2026-10-15 §B]` Four of them shipped as
   the "21st Sept Deployment Items" batch (see their entries).
5. **Deploy / release:** parent status Done by 2026-09-17; part of the Shopping Cart
   phase deployed with S31.9-20260727 (28 Jul regression). `[from handoff 2026-09-17 EAINT-11880]` `[from appraisal proof pack 2026-10-15 §A]` `[unconfirmed]` for the exact release key of 11880 itself.
6. **Automation / knowledge:** `tests/service-hub` (page objects `BiometricPurchasePage.ts`,
   `SoftwareInstallationListingPage.ts`); `knowledge/flow-device-purchase.md`.
7. **PIC:** QA Charmain Ea Chiang / Teck Yung Chin raised the child bugs; Faizuddin
   QA on the 21 Sept batch. `[from study EAINT-11996-study.md]` `[from appraisal proof pack 2026-10-15 §A]`
8. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § Shopping cart (EAINT-10960 / 11880 / 11881 / 11882 / 12099).
9. **Update 2026-10-27 from Charmain repo:** Charmain's SI/BDP suite covers this CR with
   114 `bdp-e2e-*` + 20 `bdp-prc-*` (pricing) scenario scripts on a custom harness,
   Mailtrap email assertions, zero `expect()`; status inventoried, "every scenario is a
   rewrite". `[charmain-repo: intake/sources.yaml:129]` Child bug retest seen:
   `_retest-12085.js`; design-stage probe `x-consign-12049.js`.
   `[charmain-repo: intake/reports/charmain-shopping-cart.md:1769-1785]` See
   `flow-device-purchase.md` § "Charmain's SI/BDP suite" and `script-inventory-team.md`.

---

## EAINT-11934 — [CIBO] Payment Report UCD Name column (context only)

1. Payment Report Listing + CSV got the **UCD Name** column (between `UCD` and
   `Vehicle No`), in production since 2026-07-24 (S31.8). The Transaction Management
   Listing half was cut ("difficulty on Dev side to display the value in this
   page") and moved to EAINT-12058. Records before 2025 show no UCD Name (data
   migration boundary, accepted). `[from knowledge/cibo.md, BA testing plans 2026-08-13]`
2. Executed by Maisarah; the old script still marks the cut surface Pass. `[from knowledge/cibo.md]`
3. **SharePoint script:** catalogue #130 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`

---

## EAINT-11996 — [UCD - Software Installation] Functional Issues for Quantity Selector in Step 1

1. **Type:** QA-Issue subtask under EAINT-11880. Reporter Teck Yung Chin, assignee
   zhan.choon, priority Low. `[from study 21st Sept Deployment Items/EAINT-11996-study.md]`
2. **What it fixed:** the Quantity Selector stripped digits along with letters on
   alphanumeric input, and a first fix (retested 27 Jul, "Redev") truncated digits
   past position 4 ("TY1234" → "12"). Expected: only letters stripped, any digit
   length accepted. Applies to all Quantity Selectors in Service Hub. `[from study EAINT-11996-study.md]`
3. **Settled:** there is **no documented 4-character limit** anywhere; Number of
   Installations has no cap (EAINT-10960 SRD p.15 §2.3.2.1) — the 4-char behaviour was
   always a bug. Do not confuse with the 40-unit Purchase Quantity cap (EAINT-12166
   REQ-007). `[from handoff 2026-09-17 EAINT-11996]`
4. **Open at last sight (2026-09-17):** environment conflict (ticket `staging/sit2` vs
   Teams `/uat1`); Jira still On Hold while riding the batch. `[from handoff 2026-09-17 EAINT-11996]`
5. **Evidence:** repro videos `2026-07-17_17-28-19.mp4` and `11996 Retest - Redev.mp4`
   on the ticket; batch brief artifact
   https://claude.ai/code/artifact/2e2bcab9-7d8a-4fb6-bc7d-07609c437187. `[from handoff 2026-09-17 EAINT-11996]`
6. **Deploy / release:** S33.8-20260921, Done, 0.9 man-days for the 4-ticket batch.
   `[from appraisal proof pack 2026-10-15 §A]` Deployment schedule: "21st Sept Morning
   Deployment - Faiz". `[from Teams, 2026-09-16 16:25, May Chin Mei Theng]` via EAINT-12095-study.md.
7. **PIC:** QA Faizuddin; dev zhan.choon (Wong Zhan Choon). `[from study EAINT-11996-study.md]`

---

## EAINT-12028 — [eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)

1. **Module / portal:** BackOffice Home → Reports → Association Payment Listing
   (brand-new module). `[from lib/ticketStudies.ts · EAINT-12028]`
2. **SRD trail** (`_reference/tickets/EAINT-12028/EAINT-12028_SRD_v1.1_20260731.pdf`):
   0.1 23.07.2026; 0.2 27.07.2026 Initial Draft; 0.3 29.07.2026 "Removed
   Finance-related handling; refined details and renumbered Requirement IDs"; 1.0
   30.07.2026 "Added association charge rates (FMC RM1, MMSDA RM2), the amount
   calculation, and the FMC & MMSDA Payment Request field mapping ... This is the
   baseline"; 1.1 31.07.2026 "Added total Car/Motorcycle transaction columns (Summary
   & Details) counted by JPJ Approved Date; confirmed Attn = Marie Ann". Author Chee
   Mei Jia. `[from SRD EAINT-12028 v1.1 §1.3]`
3. **What it changes:** "Introduce a new BackOffice module, Association Payment
   Listing, that automates association / vendor payment requests ... produces a
   monthly summary listing and state-level details for the Ops team, and routes each
   month through a Drafter → Reviewer → Approver workflow with on-screen
   e-signature." Phase 1 covers Car and Motorcycle only; JomCheck deferred (liaised
   with Nurul 23.07.2026). `[from SRD EAINT-12028 v1.1 §2.1]` Rates FMC RM1.00/car,
   MMSDA RM2.00/motorcycle; counts by JPJ Approved Date; roles hardcoded by login
   (Drafter eautozara/mfared/mfizni, Reviewer eautonurul/mfizni, Approver
   kmcheah/mfizni); Finance payment date future-only via date picker; signature
   captured once per role; Payment Request PDFs "Payment Requisition_<Association>_<Month> <Year>.pdf"
   downloadable only after full approval. `[from lib/ticketStudies.ts · EAINT-12028, REQ-003..019]`
4. **Settled decisions:** Finance disbursement out of scope (v0.2); private + company
   vehicles totalled together per type; per-state breakdown uses the dealer's UCD
   company state, not the plate; Payment Requisition PDF format confirmed final
   2026-08-21; PDF download not role-restricted (all three roles once fully
   approved); KIV never locks the Drafter out (confirmed gap, deferred item L2).
   `[from handoff 2026-09-14 EAINT-12028]` `[from lib/ticketStudies.ts · EAINT-12028]`
5. **Build state:** branch `dev/feat/EAINT-12028`, MR !1 (129 files, +10,920) ⛔ BLOCK
   code review on 2026-09-04 (1 blocker, 2 high incl. H1 cross-module role confusion
   and H2 open redirect); fix pass 8/10 coded. `[from memory eaint-12028-mr1-blocked-2026-09-04.md]`
6. **Open at last sight (2026-10-15):** environment never stated; zero-transaction
   state display; state row order (SRD 01–16 vs mockup); Ops SOP for
   cancelled-but-JPJ-approved transactions; sample xlsx not downloaded.
   `[from handoff 2026-09-14 EAINT-12028]` **ON HOLD**: "MJ ytd updated us that 12028
   need to on hold first as we got other higher priority tickets" `[from Teams via memory digest, 2026-10-15 09:56, May Chin]`;
   "not going to deploy on end of this month anymore" `[from Teams via memory digest, 2026-10-14 12:03, Mei Jia]`.
7. **TS / evidence:** 27-scenario high-level TS
   `_reference/tickets/EAINT-12028/EAINT-12028 - [eAuto-BackOffice] New Module – Association Payment Listing (...).xlsx`
   (drafted 2026-09-04, never executed); Miro board for the high-level flow (Charmain,
   2026-09-04 / 09-18 / 09-22). `[from handoff 2026-09-14 EAINT-12028]` `[from appraisal proof pack 2026-10-15 §G]`
8. **Automation in repo:** none. Flow doc `knowledge/flow-association-payment-listing.md`
   (mockup + dev QA guide `EAINT-12028-artifact-qa-test-guide-from-dev.html`). `[from handoff 2026-09-14 EAINT-12028]`
9. **Related tickets:** EAUTO-977, CCB-848. `[from lib/ticketStudies.ts · EAINT-12028]`
10. **Deploy / release:** was S34.X-20261005, then "[QA]Ready for Testing Tickets"
    (2026-09-14), then S34.X-20261029 slot; now on hold, date TBA. 10 man-days
    estimated. `[from appraisal proof pack 2026-10-15 §A]` `[from Teams via memory digest, 2026-10-14]`
    **Update 2026-10-26:** Jira status "In Development" (since 2026-10-05); fix version
    **S35.X-20261126 🌞** (release 2026-11-26); Exp. Deploy Date 26/Nov/26 (set
    2026-10-19). Miro column "26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC,
    Target Deployment: TBC)"; Miro "QA: Faiz", "BA: MJ". Jira Developer field still
    "izfarwiza"; assignee Shane (Kasheng Liew). `[from study EAINT-12028-study.md §1]`
11. **PIC:** QA Faizuddin (assigned by May Chin 2026-09-14 09:25; Jira assignee stays
    Chee Mei Jia); dev Kasheng Liew, who took over on 2026-09-24. `[from memory eaint-12028-mr1-blocked-2026-09-04.md]` `[from Teams via memory digest, 2026-10-14]` `[from Teams sweep, 2026-10-16]`
12. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12028
    (the deploy needs downtime; the KIV month-lock bug found 2026-09-29; car count rule).

---

## EAINT-12058 — [CIBO-Transaction Listing] Add UCD Full Name & Login ID columns to Transaction Listing

1. **Module / portal:** CIBO > Transaction Management > Transaction Listing + CSV export. `[from knowledge/cibo.md]`
2. **What it changed:** re-delivers the UCD Name column on the Transaction
   Management Listing that EAINT-11934 cut, by a new name-retrieval approach
   ("the current way to display the name is not straightforward"). `[from knowledge/cibo.md, 12058 description]`
3. **TS / evidence:** local
   `_reference/tickets/EAINT-12058/EAINT-12058 - [CIBO-Transaction Listing] Add UCD Full Name & Login ID columns to Transaction Listing.xlsx`
   (plus a superseded v0.1 copy) — the filename precedent for the team's test-script
   naming rule; SharePoint `2. Secarang & CIBO Project/Enhancement CR Test Scenario/`
   (2026-08-14); evidence folder 12058 under Secarang; post-deploy regression
   `20260817 - 17th August 2026 Deployment` (EAINT-12058, STMS, eSTM videos). `[from appraisal proof pack 2026-10-15 §A, §C]` `[from _reference/README.md]`
4. **Automation:** none (no CIBO page objects in the repo). `[from lib/ticketStudies.ts · EAINT-12327 automation]`
5. **Deploy / release:** S32.7-20260817, Done, 1 man-day. `[from appraisal proof pack 2026-10-15 §A]`
6. **PIC:** QA Faizuddin. `[from appraisal proof pack 2026-10-15 §A]`
7. **SharePoint script:** catalogue #131 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`

---

## EAINT-12095 — [UCD - Biometric Device Purchase] Service Request Details - Long shipping address overflows instead of wrapping

1. **Type:** QA-Issue under EAINT-11880, priority Lowest, reporter Charmain Ea Chiang
   (raised 2026-07-27, deferred "next phase"). `[from study EAINT-12095-study.md]`
2. **What it fixed:** Shipping Address on the UCD Service Request Details page now
   wraps (word-break) instead of overflowing under Appointment Details with a
   horizontal scrollbar. Repro: Ref No SR67001086, staging test id
   `33e7af31-a90b-42a8-be72-637af2659886`. `[from study EAINT-12095-study.md]`
3. **Note:** "Seems like the initial fix for UCD broke the BO page" — follow-up to
   dev Wong Kar Kin. `[from Teams, 2026-09-17 16:20, Faizuddin]` via appraisal proof pack §G.
4. **Deploy / release:** S33.8-20260921, Done. `[from appraisal proof pack 2026-10-15 §A]`
5. **PIC:** QA Faizuddin; dev Wong Kar Kin. `[from appraisal proof pack 2026-10-15 §G]`

---

## EAINT-12103 — [BackOffice - Biometric Device Purchase] Listing - Enter key does not trigger search

1. **Type:** QA-Issue under EAINT-11880, priority Medium, reporter Charmain Ea
   Chiang, assignee Xiwei Lim. `[from study EAINT-12103-study.md]`
2. **What it fixed:** pressing Enter in a filled Search & Filter field on the BO
   Biometric Device Purchase & Software Installation Listing now fires the same
   search as the Search button. `[from study EAINT-12103-study.md]`
3. **Open at last sight (2026-09-17):** behaviour of Enter on an empty filter field
   unstated. `[from handoff 2026-09-17 EAINT-12103]`
4. **Deploy / release:** S33.8-20260921, Done. `[from appraisal proof pack 2026-10-15 §A]`
5. **PIC:** QA Faizuddin; dev Lim Xiwei ("Tracey"). `[from study EAINT-12103-study.md]`

---

## EAINT-12104 — [BackOffice - Biometric Device Purchase] Listing - Filter panel and listing layout misaligned vs existing module

1. **Type:** QA-Issue under EAINT-11880, priority Low, reporter Charmain Ea Chiang,
   assignee Xiwei Lim; original bug observed on Production (eauto.my) 28-07-2026. `[from study EAINT-12104-study.md]`
2. **What it fixed:** filter panel pairs Date Requested From/To on one row, Time Slot
   aligns in the grid, listing table stays within the page margin — matching eSTM
   Transaction Enquiry. Screenshots `image-20260728-083212.png` (actual) /
   `image-20260728-083220.png` (expected) on the ticket. `[from study EAINT-12104-study.md]`
3. **Deploy / release:** S33.8-20260921, Done. `[from appraisal proof pack 2026-10-15 §A]`
4. **PIC:** QA Faizuddin; dev Lim Xiwei. `[from study EAINT-12104-study.md]`

---

## EAINT-12107 — [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay

1. **Module / portal:** Secarang checkout (Fiuu gateway); CIBO Payment Channels
   filter, Transaction Details, Payment Report. `[from lib/ticketStudies.ts · EAINT-12107]`
2. **SRD trail** (`_reference/tickets/EAINT-12107/SRD_EAINT-12107_..._v1.1_20260911.pdf`,
   text `srd-v1.1.txt`): 0.1 03.09.2026; 0.2 10.09.2026 Initial Draft; 1.0 10.09.2026
   "Updated Sections 2.1 to 2.2.5 / Added Section 2.2.6 Payment Flow / Send out for
   external review"; 1.1 11.09.2026 "Added Section 2.2.7 Payment Channel Filter /
   Added Section 2.2.8 Testing Eligibility / Updated Section 2.2.3" (Jira row also
   names "Added Section 2.2.9 Payment Reference ID"). Author Lim Yi Link. `[from SRD EAINT-12107 v1.1 §1.3]` `[from lib/ticketStudies.ts · EAINT-12107]`
3. **What it changes:** ShopeePay and GrabPay tiles under Fiuu, each with Full Amount
   and a BNPL sub-option (SPayLater, PayLater by Grab); tenure handled by
   Shopee/Grab, not stored (assumption 3); CIBO "Fiuu - eWallet" filter group with 4
   checkboxes (REQ-011–013); e-wallet transactions carry `EW` in the Payment Reference
   ID, e.g. `LON20260908SEW0002`, shown in 5 places incl. the CIBO Payment Report
   (REQ-014/015). Only GrabPay Full Amount is testable in the Fiuu sandbox (§2.2.8).
   `[from lib/ticketStudies.ts · EAINT-12107]`
4. **Settled decisions:** any one insurer is enough — all share the gateway
   (Charmain via KJ, relayed 2026-09-11 16:37); agreed scope E2E GrabPay OK / Failed
   / regression of Card or FPX + dev-patched ShopeePay / SPayLater / PayLater by Grab
   + CIBO functional (May Chin and Faizuddin, 2026-09-11 16:31–18:21, 1 + 1 days);
   "it's confirmed that we can disable any payment method by data patching" (Shane,
   Jira 2026-09-09); "can deploy in morning ya" for this CR and 12327 (Kasheng Liew,
   2026-10-07 12:55). `[from NOTES.md EAINT-12107]` `[from lib/ticketStudies.ts · EAINT-12107]`
5. **Ownership trail:** TS drafted by Faizuddin and handed to Amirul Azfar 2026-09-15
   (May Chin); back to Faizuddin 2026-10-15 10:11 at "1 + 1 = 2 days", tested
   together with EAINT-12327; Jira QA field still names Azfar. `[from NOTES.md EAINT-12107]` `[from Teams via memory digest, 2026-10-15]`
6. **Open at last sight (2026-10-15):** dev-patched BNPL/ShopeePay rows not yet
   requested; regression TS portion "pending" since 2026-09-15; listing-row text per
   channel not in this SRD (12327 defines it); no 12327 format string for Fiuu Card
   or Fiuu FPX (raise with Yi Link); whether the parent "Fiuu - eWallet" tick clears
   when a child is unticked. `[from NOTES.md EAINT-12107, TS v0.2 notes]`
7. **TS / evidence:** execution copy
   `_reference/tickets/EAINT-12107/EAINT-12107 + EAINT-12327 - Combined TS - [Secarang-Fiuu] ShopeePay and GrabPay + [CIBO] Payment Mode Column Format.xlsx`
   (rows 4–18 = 12107 v0.2, rows 20–27 = 12327_TS01..08); standalone v0.2
   `EAINT-12107 - [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.xlsx`;
   two superseded copies; SharePoint `EAINT-12107 - ⚪[Secarang-Fiuu] ... .xlsx`
   (2026-09-17, last modified by Azfar). `[from NOTES.md EAINT-12107]` `[from appraisal proof pack 2026-10-15 §C]`
   Study pages `EAINT-12107-study.html`, `EAINT-12107-12327-12412-release-S34X-study.html`.
8. **Automation in repo:** none yet; `scripts/secarang-insurance` drives Fiuu checkout
   and is the base for a GrabPay branch; `app/eauto` 12107+12327 page exists as
   layout only, controls disabled. `[from lib/ticketStudies.ts · EAINT-12107]` `[from lib/changelog.ts CURRENT_CHANGES]`
   QA Portal task for 12107 is read-only to Faizuddin while Azfar is QA PIC. `[from study EAINT-12107-12327-12412-release-S34X-study.html]`
9. **Related tickets:** EAINT-12327, ESI-355. `[from lib/ticketStudies.ts · EAINT-12107]`
10. **Deploy / release:** S34.X-20261020/21 TBC (release date 2026-10-20, version
    description "Main item(s): 1. Secarang - ShopeePay & GrabPay 2. CIBO - Payment &
    Transaction Listing"); staging up since 2026-09-07 (Secarang) and 2026-09-09
    (CIBO). Jira status Code Review; dev "ready for testing" since 15.09.2026. `[from NOTES.md EAINT-12107]`
11. **PIC:** QA Faizuddin (Jira field Azfar); assignee Lim Yi Link; dev Shane
    (Jira Dev field) / Kasheng Liew (deployment slot); reporter Chee Mei Jia. `[from NOTES.md EAINT-12107]` `[from lib/ticketStudies.ts · EAINT-12107]`
12. **SharePoint script:** catalogue #031 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
13. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12107.

---

## EAINT-12151 — [CIBO-Transaction Management] Rename Date Fields & Add Insurance Creation Date Filter and Listing Column

1. **Module / portal:** CIBO > Transaction Management > Transaction Listing (filter
   panel, listing columns, CSV export, print). `[from handoff 2026-09-28 EAINT-12151]`
2. **SRD trail** (`_reference/tickets/EAINT-12151/EAINT-12151-SRD_v1.0_20260820.pdf`):
   0.1 17.08.2026 Initial Draft; 0.2 19.08.2026 "Revised Existing Issue; added filter,
   Export and Print requirements"; 0.3 20.08.2026 "Clarified Insurance Creation Date
   refers to Payment Date Time"; 1.0 20.08.2026 baseline. Author Chee Mei Jia. `[from SRD EAINT-12151 v1.0 §1.3]`
3. **What it changed:** "Standardise the transaction listing date fields with the
   payment report and introduce an insurance creation date reference in both the
   filter and the listing." `[from SRD EAINT-12151 v1.0 §2.1.1]` Existing date fields
   renamed to be explicit; new "Insurance Creation Date" filter + column + export +
   print; Date Range Type dropdown. `[from handoff 2026-09-28 EAINT-12151]`
4. **Settled decisions:** "Insurance Creation Date" = insurance payment table's
   `last_updated_at`, not the JPJ-approved date `[from Teams, 2026-08-20 12:17, Mong Guo Hao]`;
   keep date+time under the existing "Payment" column framing (Shamini via Mei Jia
   Chee, 2026-08-27); environment `cibo/staging` (user-supplied); "do not update
   anything in the JIRA" (standing instruction, Faizuddin). `[from handoff 2026-09-28 EAINT-12151]`
5. **Open at last sight (2026-09-28):** CCB-896 / ESI-334 never pulled into the
   study; no `flow-cibo-transaction-listing.md` exists. `[from handoff 2026-09-28 EAINT-12151]`
6. **TS / evidence:** final 5 scenarios TS01–TS05 (Faizuddin's own, replacing the
   32/36-scenario drafts) in
   `_reference/tickets/EAINT-12151/EAINT-12151 - [CIBO-Transaction Management] Rename Date Fields & Add Insurance Creation Date Filter and Listing Column.xlsx`;
   artifact https://claude.ai/code/artifact/c46497b9-29d9-48c1-b1a1-ce5772e716e7;
   SharePoint TS (2026-09-28) and evidence folder EAINT-12151; post-deploy
   regression `20260930 - 30th September Morning Deployment Items` (EAINT-12151 +
   CIBO Regression). `[from handoff 2026-09-28 EAINT-12151]` `[from appraisal proof pack 2026-10-15 §A, §C, §G]`
7. **Automation in repo:** none.
8. **Deploy / release:** S33.12-20260930, Done; "planned to deploy on 30 Sept (Wed)
   morning ya" `[from Teams, Thu 2026-09-24 12:03, Yi Link Lim]`; assigned by Charmain
   2026-09-21 15:43 with a 1.5-day estimate, deployed on schedule. `[from memory eaint-12151-deployment-30sep.md]` `[from appraisal proof pack 2026-10-15 §A, §F]`
9. **PIC:** QA Faizuddin (Jira assignee stayed Chee Mei Jia); dev Mong Guo Hao;
   BA Chee Mei Jia / Yi Link Lim. `[from handoff 2026-09-28 EAINT-12151]`
10. **SharePoint script:** catalogue #034 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`

---

## EAINT-12153 — [eAuto-Application] Add Payment Channels for Pre-application and Application

1. **Module / portal:** UCD Pre-application and Application, Onboarding Payment
   step. `[from lib/ticketStudies.ts · EAINT-12153]`
2. **SRD trail** (`_reference/tickets/EAINT-12153/EAINT-12153_SRD_..._v1.1_20260824.pdf`):
   0.1 10.08.2026 Initial Draft; 1.0 10.08.2026 "Send out for external review"; 1.1
   24.08.2026 "a. Added Online Banking (Business) authorizer approval flow (REQ-004 to
   REQ-007). b. Added Pending Approval page. c. Updated the Expected Behaviour
   section." Author Lim Yi Link. `[from SRD EAINT-12153 v1.1 §1.3]` 1.2 04.09.2026
   (uploaded 07.09.2026) "Added Payment Submitted Date Time field (REQ-008), Payment
   Date Time field (REQ-009), and the Payment Pending Approval email notification
   template (Section 2.3)." Title renamed to "Add B2B Payment Channel …". No v1.3 file
   in Jira despite Teams 2026-09-07 15:55. `[from SRD EAINT-12153 v1.2 §1.3, copy in
   _reference/tickets/EAINT-12153/]`
2a. **Restudy 2026-10-21:** scope is B2B only since the 2026-09-02 split (card →
   EAINT-12259, QR → EAINT-12257). Jira In Development; fix version "[QA]Ready for
   Testing Tickets" (2026-11-02). Full update in `lib/ticketStudies.ts · EAINT-12153`.
3. **What it changes:** three tiles on the payment step, two new — Credit or Debit
   Card, Online Banking (Business) = FPX B2B — plus the existing Online Banking
   (Personal) = FPX B2C relabelled; Fiuu sandbox, same gateway as Secarang; B2B
   routes to a Pending Approval page and needs authorizer approval within 7 days
   (REQ-004–007). `[from lib/ticketStudies.ts · EAINT-12153]` `[from handoff 2026-09-01 EAINT-12153]`
4. **Settled decisions:** channel model corrected 2026-08-13 (three tiles, two new);
   gateway failures tested via the Fiuu response picker — our side of the boundary
   only; undefined rules (limits, timeouts, late callbacks, refunds) stay existing
   behaviour. `[from lib/ticketStudies.ts · EAINT-12153]`
5. **Open at last sight (2026-09-02):** environment (run-time picker planned); is the
   Fiuu 3DS OTP readable in the DOM; separate charges for Pre-application vs
   Application; TS1/TS2 B2B pending-approval rework not done; TS7/TS8 "TBC with BA".
   `[from handoff 2026-09-01 EAINT-12153]`
6. **TS / evidence:** `_reference/tickets/EAINT-12153/EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels ...(Sheet1) 11.24 1.9.2026.csv`
   (TS1–TS8); SharePoint TS 2026-09-01. `[from appraisal proof pack 2026-10-15 §C]`
   **OFFICIAL since 2026-10-21:** SharePoint v38 (12153_TS1–TS8: B2B ×4 incl. Pending
   Approval revisit, B2C ×2, card ×2), team-agreed. Text copy
   `_reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md`.
   The 2026-09-01 CSV and the "Suggestion by Claude" workbook are superseded.
   `[from Faizuddin, 2026-10-21]`
7. **Automation in repo:** `scripts/eauto-payment-channels/` skeleton (6 projects
   TS3–TS8, every page object throws `PendingHtmlCapture`); `scripts/eauto-company-checker`
   + `app/eauto/company-details-checker` (ROC/New ROC/TIN duplicate checker, Checker +
   Test Script tabs). `[from handoff 2026-09-01 EAINT-12153]` `[from appraisal proof pack 2026-10-15 §D]`
8. **Related tickets:** EAUTO-1018, CCB-897, EAINT-12257. `[from lib/ticketStudies.ts · EAINT-12153]`
9. **Deploy / release:** fix version "QA Ready for Testing", In Development; 3.5
   man-days. `[from appraisal proof pack 2026-10-15 §A]` FPX B2B "not deployed yet" as
   of 2026-09-30. `[from EAINT-12414-teams-thread-2026-09-30.md, Faizuddin scope decisions]`
   **Update 2026-10-26:** Jira status "Testing In 1st Env" (updated 2026-10-26 09:58);
   fix version **S34.1X-20261029🌞** (release 2026-10-29, "Main item(s): 1.
   Pre-Application & Application - Payment Gateway for DuitNow & B2B"); Miro column
   "29TH OCT DEPLOYMENT", "QA: Faiz", est. 3 days. On staging/obs from 2026-10-22
   14:41. Progress 6/12 (50%) on 2026-10-26; bug EAINT-12588 raised and resolved.
   Test-complete deadline EOD 28 Oct. `[from study EAINT-12153-study.md §1]`
   `[from Teams eAuto QAs, 2026-10-22 10:29, Charmain Ea Chiang]` "we are targeting 29 Oct for the deployment of both EAINT-12153 and EAINT-12257 ya."
10. **PIC:** QA Faizuddin; assignee Lim Yi Link; reporter Chee Mei Jia. `[from lib/ticketStudies.ts · EAINT-12153]`
11. **SharePoint script:** catalogue #035 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
12. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12153 / EAINT-12257 / EAINT-12259.

---

## EAINT-12166 — [eAuto-BackOffice] Service Hub: Enable DO Creation for Device Purchase

1. **Module / portal:** BackOffice Device Purchase Transaction Details ("DO" button),
   BO listing; UCD purchase quantity cap. `[from SRD EAINT-12166 v1.1 §2.1]`
2. **SRD trail** (`_reference/tickets/EAINT-12166/EAINT-12166_SRD_v1.1_20260828.pdf`):
   0.1 11.08.2026; 0.2 12.08.2026 Initial Draft; 0.3 13.08.2026 "Populated Section
   2.2.5 Delivery Order field data source mapping ... per sync-up with Yeng (13.08)";
   0.4 14.08.2026 / 0.5 18.08.2026 / 0.6 19.08.2026 "Aligned the SRD to the finalized
   Delivery Order design (Existing UCD) and updated scope and additional notes; email
   notification removed"; 1.0 19.08.2026 "Updated scope, document layout, and
   Delivery Order generation details"; 1.1 28.08.2026 "Removed content applicable to
   DO Type = New Registration; scope limited to DO Type = Device Purchase ... This is
   the baseline". Author Chee Mei Jia. `[from SRD EAINT-12166 v1.1 §1.3]`
3. **What it changed:** "Enable BackOffice to generate a Delivery Order for a Device
   Purchase transaction directly from the Transaction Details page. The Delivery Order
   is auto-populated by the system and produced as a PDF." Reuses the Company
   Management "Print DO" template; "The UCD portal must set the maximum purchase
   quantity to 40 units per transaction" (REQ-007); DO Type = Device Purchase only.
   `[from SRD EAINT-12166 v1.1 §2.1]` Split DO: a parcel ships at most 10 devices, a
   40-unit order goes out across several DOs (TS02 = 20+20). `[from study EAINT-12167-EAINT-12166-combined-study.html]` `[from handoff 2026-09-25 EAINT-12166]`
   Snapshot rule: the DO snapshots data at generation. `[from lib/testEvidence.ts, "12166_67_E2E_TS03 — snapshot rule"]`
4. **Settled decisions:** interim "Document Upload Space" dropped from scope as of
   v0.4, never built — don't test it `[from handoff 2026-09-25 EAINT-12166, item 7]`;
   TS20/TS23/TS24 checked manually against TS02 footage rather than rebuilt in
   automation (Faizuddin, 2026-09-25); evidence named by bare TS id
   (`12166_67_E2E_TS01`), Faizuddin 2026-09-24. `[from lib/testEvidence.ts]`
5. **Open at last sight (2026-09-25):** TS21/TS22 (25-device uneven 20+5 split) never
   exercised; TS04 "incomplete details" trigger; next-day DO-number reset
   un-automatable; Report-Engine-down blank page HTML never captured; TS-count
   discrepancy (32/24/38 vs 25/30, 29/29) unreconciled. `[from handoff 2026-09-25 EAINT-12166]`
6. **TS / evidence:** 8 E2E `12166_67_DOSN_TS01`–`TS08` + 24 (12166) + 38 (12167) = 70
   `[from memory eaint-12166-12167-ts-count-2026-09-22.md]`; combined study artifact
   https://claude.ai/code/artifact/272e5af6-2f09-475b-aef5-6ea929e24bc9 (source
   `_reference/tickets/EAINT-12167/EAINT-12167-EAINT-12166-combined-study.html`); dev QA
   guide (author tracey) annotated copy `EAINT-12166-dev-QA-guide-annotated.html`
   `[from EAINT-12166 artifact lists.txt]`; SharePoint evidence folder EAINT-12166;
   post-deploy regression `20260928 - 28th September Morning Deployment Items/20260928 - 0900AM`
   (EAINT-12166 BackOffice + UCD). `[from appraisal proof pack 2026-10-15 §A, §C]`
   R1–R5 Report Engine regression checklist (e-Contract, CP58, Add User
   Authorization, eSTM Buyer Authentication slip, Company Management Print DO) run
   manually by Faizuddin. `[from handoff 2026-09-25 EAINT-12166]`
7. **Automation in repo:** `tests/service-hub/specs/device-purchase-do-ts01..08.spec.ts`
   (77 tests / 15 files across the suite), `app/eauto/12166` + `app/api/eauto/12166`
   (run, live-log, resume, download-all), `lib/eautoRunRegistry.ts`; viewport
   1920×1200, detailed-mode timeout. **The team benchmark for every new eauto-*
   automation (Faizuddin, 2026-09-30).** `[from handoff 2026-09-25 EAINT-12166]` `[from appraisal proof pack 2026-10-15 §D]`
   Flow doc `knowledge/flow-device-purchase.md`.
8. **Related bugs:** EAINT-12404 (Zhan Choon "it depends tho", unresolved 2026-09-25). `[from handoff 2026-09-25 EAINT-12166]`
9. **Deploy / release:** S33.11-20260928, Done, 4 man-days `[from appraisal proof pack 2026-10-15 §A]`;
   uat1 deploy needed "senior to help deploy one repo and run sql so probably tmr
   morning" `[from Teams, 2026-09-22 17:05, Lim Xiwei]` via `knowledge/flow-device-purchase.md`;
   "12166 and 12167 on track to deploy on 28 Sep morning?" → "Ya, as of now, still on
   track." `[from Teams, 2026-09-24 10:42–10:43, Charmain / Faizuddin]` via the same file.
   Dev wrote "EAINT-12166 is ready in staging/uat2" `[from Teams EAINT-12166, 2026-09-23 09:32, Lim Xiwei]`;
   this is most likely a typo for uat1: QA signed off "on staging/uat1" `[same chat, 2026-09-25 17:50, Faizuddin]`
   and uat2 had been removed on 2026-07-06 (`environments-history.md`).
10. **PIC:** QA Faizuddin; dev Lim Xiwei ("Tracey", branch `dev/feat/EAINT-12166`);
    BA Chee Mei Jia; Yi Link Lim coordinating. `[from EAINT-12166 artifact lists.txt]` `[from handoff 2026-09-25 EAINT-12166]`
11. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12166 (the uat2/uat1 note above).

---

## EAINT-12167 — [eAuto-BackOffice] Allow Ops to Input Device SN on Device Purchase Service Request Info Page When Updating Delivery Status to Arranged

1. **Module / portal:** BackOffice Service Request Details > Shipping Details (Update
   Shipping Details popup); BO Biometric Device Purchase & Software Installation
   Listing. `[from SRD EAINT-12167 v1.2 §2.2.3]`
2. **SRD trail** (`_reference/tickets/EAINT-12167/EAINT-12167_SRD_..._v1.2_20260817.pdf`):
   0.1 11.08.2026 Initial Draft; 1.0 11.08.2026 "Send out for external review"; 1.1
   17.08.2026 "Updated Number of Device and Device Serial No. requirements based on
   review feedback"; 1.2 17.08.2026 "Added record-level display of Number of Device
   and Device Serial No. in the listing and details page". Author Lim Yi Link. `[from SRD EAINT-12167 v1.2 §1.3]`
3. **What it changed:** "Allow BO users to record the number of devices and each
   device serial number when updating the shipping details of a Device Purchase
   service request." `[from SRD EAINT-12167 v1.2 §2.1.1]` Number of Device auto-filled
   and read-only; one Device Serial No. field per unit (up to 40); 8–12 characters,
   letters and digits only; duplicates rejected within and across transactions;
   Delivery Status can only move to Arranged; saving with Arranged locks the fields
   and triggers 12166's DO flow; listing and details show Number of Device and Device
   Serial Number (blank for pre-release rows). `[from EAINT-12167-functional-TS-draft-2026-09-22.md]` `[from handoff 2026-09-25 EAINT-12167]`
4. **Settled decisions:** locked-SN typo handling = Option A, fix only by IT support
   request; no one, including a senior Hub Admin, can edit a keyed serial once
   Arranged `[from Teams, 2026-08-17, EAINT-12167 CR group]` via the combined study;
   unit cap raised from 10 to 40 (Teams 14–17 Aug) `[from study EAINT-12167-EAINT-12166-combined-study.html]`;
   dev QA guide corrects the SRD: special characters are REJECTED on save, not
   stripped while typing; 13-char serials can be typed and are caught by the length
   message on Save. `[from EAINT-12167 artifact lists.txt]`
5. **Open at last sight (2026-09-25):** USDP_02/03 expected results vs dev guide
   unreconciled; REQ-009's 18 named BO accounts not tested against the real list;
   concurrency TS not drafted; `/uat1` vs `/uat3` naming; EAINT-12404 "it depends
   tho". `[from handoff 2026-09-25 EAINT-12167]`
6. **TS / evidence:** functional TS draft (Miro, reviewed by Charmain 2026-09-22
   "so far ok") saved as `_reference/tickets/EAINT-12167/EAINT-12167-functional-TS-draft-2026-09-22.md`
   (12167_LDP_01–11, 12167_USDP_01–09); execution 2026-09-22: 19 pass, 1 fail
   (USDP_TS06 → EAINT-12394) `[from memory eaint-12167-ts-execution-2026-09-22.md]`;
   live HTML captures `EAINT-12167-backoffice-01-sr-details-uat1.html`,
   `...update-shipping-details-popup-uat1-2026-09-22.html`,
   `...two-col-serials-locked-uat1-2026-09-23.html`, `...two-col-serials-uat1-2026-09-25.html`;
   three DO sample PDFs; `Update shipping details different user - Success.mp4`;
   SharePoint evidence folder EAINT-12167. `[from handoff 2026-09-25 EAINT-12167]` `[from appraisal proof pack 2026-10-15 §C]`
7. **Automation in repo:** shared with 12166 — `tests/service-hub`, `app/eauto/12166`;
   User Access Regression tool (built 2026-09-24, not confirmed on a real run). `[from handoff 2026-09-25 EAINT-12167]`
8. **Related bugs:** EAINT-12394 (duplicate SN error shown as native alert), 12399
   (fixed same day 2026-09-23), 12404, 12408 (two-column serial list collapses to one
   column: `.ins-serials` fixed 300px vs shrink-to-fit `.ins-serial-col`, tripped by
   12-char all-caps serials). `[from appraisal proof pack 2026-10-15 §B]` `[from handoff 2026-09-25 EAINT-12167]`
9. **Deploy / release:** S33.11-20260928, Done, 2 man-days; same deploy as 12166. `[from appraisal proof pack 2026-10-15 §A]`
10. **PIC:** QA Faizuddin; dev Wong Zhan Choon (zhan.choon, all QA-Issues) with the
    serial-capture section shipped on Lim Xiwei's 12166 branch; BA Lim Yi Link. `[from handoff 2026-09-25 EAINT-12167]` `[from EAINT-12167 artifact lists.txt]`
11. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12167.

---

## EAINT-12175 — [Secarang & eAuto-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link

1. **Module / portal:** Secarang About Us / FAQ / Support / Add-on / Confirmation
   pages (REQ-001–005, already live); eAuto UCD + BackOffice Insurance Company filter
   and result table (REQ-012–015). `[from NOTES.md EAINT-12175]` `[from study EAINT-12175-study.html]`
2. **SRD trail** (`_reference/tickets/EAINT-12175/EAINT-12175_SRD_v1.1_20260923.pdf`):
   0.1 02.09.2026 Initial Draft; 0.2 04.09.2026 "Secarang items (REQ-001 to REQ-005)
   deployed to production on 11 August 2026. Acceptance Criteria updated accordingly";
   1.0 07.09.2026 "To send out for external review"; 1.1 23.09.2026 (Chee Mei Jia)
   "Updated Section 2.1, 2.2.2, 2.2.3 and 2.2.5; Standardised Insurer Name to Lonpac
   Insurance Bhd for Insurance Company Filter and Result Table in UCD and BackOffice".
   Author Batrisyia Hasanah Binti Nursyamsi. `[from SRD EAINT-12175 v1.1 §1.3]`
3. **What it changes:** "Correct the insurer company name display from 'Lonpac
   Insurance Berhad' to the shortened 'Lonpac Insurance Bhd' across affected Secarang
   pages, and update the outdated Smart Driver Personal Accident (SDPA) Policy Wording
   document link on the Secarang Add-on page ... For eAuto, the insurer name is
   standardised to 'Lonpac Insurance Bhd' in the Insurance Company filter and result
   table on UCD and BackOffice." Request from Lonpac (Chan Lee Chuen), email "Urgent
   - changes needed on seCarang platform (LIVE)", 11–12 Aug 2026. `[from SRD EAINT-12175 v1.1 §2.1]`
   SDPA link `lonpac.com/downloads/policywordings-eassistsmartdriver.pdf`. `[from study EAINT-12175-study.html]`
4. **Settled:** insurer identity runs on `planCode`, so REQ-012–015 is a label fix,
   not matching logic; UCD filter `select[name=insuranceCompany]` values RHB /
   Takaful / Chubb / Lonpac / TokioMarine, both selects share `id="to-filter"`.
   `[from NOTES.md EAINT-12175]` (citing `knowledge/flow-insurance-purchase.md:268, 469-470`)
5. **Open at last sight (2026-09-25):** environment unassigned; Insurance Dashboard
   chart in or out of scope; hidden blast radius — BackOffice Pemaju Payment Report
   via the separate `/motorInsurance/login/` portal; "Invoice PDF" vs REQ-011 Receipt
   PDF; no test scenarios drafted; Teams not searched. `[from handoff 2026-09-25 EAINT-12175]`
6. **TS / evidence:** none drafted. Study `EAINT-12175-study.html`
   (artifact 22ee8d0c-ce28-4ec3-a4d5-906fa4281bf2), code-audit prompt
   `EAINT-12175-code-audit-prompt.html`. `[from handoff 2026-09-25 EAINT-12175]`
7. **Automation in repo:** none for the BackOffice side; `scripts/eauto-e2e/pages/TransactionEnquiryPage.ts`
   reads the UCD 'Insurance Company' column. Flow doc created
   `knowledge/flow-eauto-insurance-enquiry.md` (leads from a code-reading chatbot,
   not live-verified). `[from NOTES.md EAINT-12175]`
8. **Deploy / release:** Secarang part live 2026-08-11; eAuto part fix version
   S34.X-20261002, status In Development (2026-09-25). `[from NOTES.md EAINT-12175]` No
   later deploy record in the repo. `[unconfirmed]`
9. **PIC:** assignee / dev Shane; reporter Batrisyia Hasanah Binti Nursyamsi; QA not
   named in the repo. `[from NOTES.md EAINT-12175]`
10. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12175.
11. **Update 2026-10-27 from Charmain repo:** Charmain has a 21-file automation folder
    for this CR, `by-ticket/eaint-12175-lonpac-insurer-name`: `run-ts.mjs`,
    `probe-insurer-name.mjs`, `make-lonpac-fixture.mjs`, `finish-lonpac-uat4.mjs`,
    `check-uat4-accounts.cjs`, `compare-instances.mjs`, `check-lonpac.mjs`,
    `probe-secarang.mjs` / `probe-secarang2.mjs`, `probe-pdf.mjs`, `sweep-bo-module.cjs`,
    and a 1,461-line evidence recorder. Hosts hit: `staging.eauto.my`, `lonpac.com`
    (9), `secarang.com` (7). `[charmain-repo: intake/reports/charmain-12175.md:29-45]`
    `[charmain-repo: intake/reports/charmain-12175.json]` Registry: "Worked 2 October
    2026 ... Ran against UAT4 as well as staging, which no other source here does. No
    ledger." `[charmain-repo: intake/sources.yaml:228]` So QA was Charmain and her runs
    used **uat4** and staging; this answers item 5's "environment unassigned" (at
    2026-09-25) for her runs only.

---

## EAINT-12257 — 🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application

1. **Module / portal:** UCD Pre-application and Application onboarding payment step
   (fourth tile beside 12153's three). `[from lib/ticketStudies.ts · EAINT-12257]`
2. **SRD trail:** none at first study (2026-09-02). Since then: 0.1 and 1.0 on
   10.09.2026 "Send out for external review", author Lim Yi Link; REQ-001–006, plus
   §2.2.6 two items "Pending (Fiuu)". Text in
   `_reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910-text.md`.
   `[from Jira EAINT-12257 attachments, read 2026-10-21]`
2a. **Restudy 2026-10-21:** Jira status Code Review; fix version "[QA]Ready for Testing
   Tickets" (2026-11-02); Developer Mong Guo Hao; no staging deployment date (Teams
   2026-10-01 15:40). Full update in `lib/ticketStudies.ts · EAINT-12257`.
3. **What it changes (dev-stated, pre-SRD):** selecting DuitNow QR opens a popup with
   the QR, a Cancel Transaction button and a countdown; the paying side offers only
   Approve or Reject; QA checks the invoice/e-invoice amount. `[from lib/ticketStudies.ts · EAINT-12257, dev discussion 2026-09-02]`
4. **Settled decisions:** the phone screens are out of jurisdiction (Fiuu's system) —
   only eAuto's reaction is under test (Faizuddin, 2026-09-03); semi-automated
   human-in-the-loop by modifying the senior QA's existing onboarding script, not a
   new build (Faizuddin, 2026-09-03); dashboard holds the BO/Fiuu defaults (jasons,
   mfared, Fiuu simulator Gaara). `[from lib/ticketStudies.ts · EAINT-12257]` `[from handoff 2026-09-02 EAINT-12257, 2026-09-04 update]`
5. **Open at last sight (2026-09-04):** environment; iPhone vs Android; captcha on
   Pre-application; relationship to 12153's reserved TS7/TS8; QR tile/popup
   selectors UNVERIFIED (no HTML ever captured). `[from handoff 2026-09-02 EAINT-12257]`
6. **TS / evidence:** SharePoint `EAINT-12257 - 🔴[eAuto-Application] Add DuitNow QR Payment Channel ....xlsx` (2026-09-03). `[from appraisal proof pack 2026-10-15 §C]`
   **OFFICIAL since 2026-10-21:** same SharePoint file, v19 (12257_TS1–TS9 + TS11, no
   TS10), team-agreed. Text copy
   `_reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md`.
   The "Suggestion by Claude" workbook is superseded. `[from Faizuddin, 2026-10-21]`
7. **Automation in repo:** `scripts/eauto-duitnow-qr/` + `app/eauto/duitnow-qr`
   (12257_TS01 pre-application fee RM 108 by QR; 12257_TS02 registration fee RM 990 by
   QR, full 11 phases; headed only; only Business Trading (Sabah/Sarawak) automatable
   because SSM types hit a live registry lookup). `[from lib/ticketStudies.ts · EAINT-12257]`
8. **Deploy / release:** fix version "QA Ready for Testing", status Code Review
   (2026-10-15). `[from appraisal proof pack 2026-10-15 §A]`
   **Update 2026-10-26:** Jira status "Testing In 1st Env" (updated 2026-10-26 10:02);
   fix version **S34.1X-20261029🌞** (release 2026-10-29); Miro column "29TH OCT
   DEPLOYMENT", "QA: Faiz", est. 3 days. On staging/obs from 2026-10-22 11:20 (QA-Issues
   say "staging/eauto"). Progress 3/13 (23.07%) on 2026-10-26. Bugs EAINT-12625
   (Closed 2026-10-26, existing behaviour kept) and EAINT-12627 (To Do).
   `[from study EAINT-12257-study.md §1]` `[from EAINT-12257-jira-comments.md]`
9. **PIC:** QA Faizuddin; assignee Chee Mei Jia; reporter Lim Yi Link. `[from lib/ticketStudies.ts · EAINT-12257]`
   On 2026-10-26 Jira shows assignee **Lim Yi Link** (assignee and reporter); dev Mong
   Guo Hao. `[from study EAINT-12257-study.md §1]`
10. **SharePoint script:** catalogue #038 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
11. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12153 / EAINT-12257 / EAINT-12259.

---

## EAINT-12327 — [CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report

1. **Module / portal:** CIBO > Transaction Management > Transaction Listing (+export);
   CIBO > Payment Report (+export). `[from lib/ticketStudies.ts · EAINT-12327]`
2. **SRD trail** (`_reference/tickets/EAINT-12327/EAINT-12327-SRD-v1.0-20260917.pdf` +
   `.txt`): 0.1 17.09.2026 Initial Draft; 1.0 17.09.2026 baseline. Author Lim Yi Link.
   The 7 format strings in §2.2.4 did not survive text extraction; they are in the
   Jira description row 3. `[from SRD EAINT-12327 v1.0 §1.3]` `[from NOTES.md EAINT-12327]`
3. **What it changes:** Payment Mode becomes one string in the order gateway, method,
   details: "BoldPay | eWallet – TouchNGo / BoldPay | Online Banking – FPX-Bank Name /
   BoldPay | Credit/Debit Card – MBBMGATE_MS / Fiuu | eWallet – ShopeePay – Full
   Amount – Single Payment / Fiuu | eWallet – ShopeePay – BNPL – Installment / Fiuu |
   eWallet – GrabPay – Full Amount – Single Payment / Fiuu | eWallet – GrabPay – BNPL –
   Installment". New Payment Mode column on the Transaction Listing after Payment,
   before Discount Code (dash when blank); Payment Report keeps the column position
   but replaces the bare gateway name. Purpose: "to analyse which group of users the
   payment under Secarang comes from. Refer to source ticket ESI-355." `[from NOTES.md EAINT-12327, Jira description rows 3, 5, 6]` `[from lib/ticketStudies.ts · EAINT-12327 REQ-001..007]`
4. **Settled decisions:** Kasheng Liew took over from Wong Kar Kin (2026-10-01 10:35);
   "not done yet. transaction listing and payment report both untouched on latest
   staging, need frontend and backend. 12107 got some parts can reuse" (Kasheng,
   2026-09-28 13:21); morning deployment with 12107 (Kasheng, 2026-10-07 12:55); "test
   together with 12107" (May Chin, 2026-10-15 10:11). `[from NOTES.md EAINT-12327]`
5. **Open at last sight (2026-10-15):** staging build date; back-fill of historical
   rows; bank-name source for FPX; no format string for Fiuu Card / Fiuu FPX; QA
   Portal task has no Dev/QA PIC. `[from NOTES.md EAINT-12327]` `[from study EAINT-12107-12327-12412-release-S34X-study.html]`
6. **TS / evidence:** standalone generated workbook
   `_reference/tickets/EAINT-12327/EAINT-12327 - [CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report.xlsx`;
   execution copy is the combined workbook in `_reference/tickets/EAINT-12107/`
   (rows 20–27 = 12327_TS01..08). `[from NOTES.md EAINT-12327]`
7. **Automation in repo:** none (no CIBO page objects). `[from lib/ticketStudies.ts · EAINT-12327]`
8. **Related tickets:** EAINT-12107, ESI-355, CCB-949. `[from lib/ticketStudies.ts · EAINT-12327]`
9. **Deploy / release:** S34.X-20261020/21 TBC (release 2026-10-20), Ready For
   Development on 2026-10-15. `[from NOTES.md EAINT-12327]`
10. **PIC:** QA Faizuddin (with 12107); assignee / reporter Lim Yi Link; dev Kasheng
    Liew. `[from NOTES.md EAINT-12327]`

---

## EAINT-12339 — [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0

1. **Module / portal:** BackOffice JomCheck Report Listing + export; Service Portal
   Hire Purchase Ownership > JomCheck Report Listing; UCD JomCheck Transaction
   Details report button. `[from study EAINT-12339-study.html]`
2. **SRD trail** (`_reference/tickets/EAINT-12339/SRD_EAINT-12339_v0.3_20260928.docx`,
   `SRD_EAINT-12339_v1.0_20260929.docx`): 0.1 18.09.2026 Initial Draft; 0.2 25.09.2026
   "a. Updated Section 1.5, 2.1.2, 2.1.3 and 2.2.1. b. Updated 2.2.2 and 2.2.3. c.
   Replaced 2.2.4. d. Added 2.2.5–2.2.8"; 0.3 28.09.2026 "a. Updated display handling
   in Section 2.2.2 and Section 2.2.4. b. Added transaction scope scenario in Section
   2.2.4. c. Added note on API scope in Section 2.1.3. d. Added source ticket in
   Section 1.5"; 1.0 29.09.2026 baseline. Author Chee Mei Jia. `[from SRD EAINT-12339 v1.0 §1.3]`
   Also `EAINT-12339-ezAuto-Technical-Spec-2.0.pdf`.
3. **What it changed:** ezAuto's Gateway API moves v1.9 → v2.0; three fields eAuto
   read are deprecated (return "N/A"/null), two added. BO listing grows 27 → 29
   columns: Odometer Reading re-sourced from `MileageRange` (10,000 km bands, "More
   than 300,000 km", null → "Not Specified"); Type of Claim from `ClaimsType`
   (code mapped to description with code in brackets, e.g. "Windscreen (WS)", null →
   "-"); Total No. of Parts Approved from `TotalPartsChanged` (10-step bands, "More
   than 100 parts", null → "No information available."); new BO-only columns Possible
   Total Loss and Possible BER. Severity expands 4 → 6 bands (LOW 1–5%, MEDIUM 6–15%,
   HIGH 16–30%, SEVERE 31–50%, CRITICAL 51–70%, CATASTROPHIC >70%); Service Portal
   counters go 4 → 6. New handling applies only to transactions created after
   deployment; multi-claim columns keep the numbered 1-line-per-claim display (v0.3
   reversed v0.2's collapse). `[from study EAINT-12339-study.html]`
4. **Settled decisions:** official TS is the pasted 46-row sheet, no Remarks/OQ
   references; old TS40–42 (Service Portal counter tests) deleted, TS43–49 → TS40–46
   (Faizuddin, 2026-10-05 09:28); TS34 (audit log) deprioritised (2026-10-05 11:07);
   TS37–39 rebuilt as buy-and-share with "X STAR TECHNOLOGY MALAYSIA SDN BHD";
   TS31 uses eSim JomCheck REPORT `select#result` = Failed; eAuto date filters max
   one month From→To "DEFAULT RULE FOR ALL MODULES UNLESS STATED OTHERWISE"; TS45
   no-match text "No records found. Please ensure there are existing JomCheck report
   purchase records."; API limit under v2.0 is 20 reports per day: "the JomCheck API only allows up to 20
   Reports per day ya" `[from Teams EAINT-12339, 2026-09-30 11:03, Faizuddin]`; "Find data" finder rules (one-month windows from Aug 2026,
   older month only if empty, all companies). `[from handoff 2026-10-05 EAINT-12339]` `[from memory eaint-12339-ts-renumbered-2026-10-01.md]`
5. **Open at last sight (2026-10-05):** OQ-01, 02, 03, 04, 06, 07, 08, 09, 12, 13, 15
   unanswered by BA/dev; TS02/TS36 PDF crosscheck (real ezAuto PDF prints the raw ICAP
   code under "Filing Category") parked; TS32 still asserts claim entry order; TS43
   items 2–4 need the raw API response. `[from handoff 2026-10-05 EAINT-12339]`
6. **Result:** "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12, not
   verified by a pasted log). `[from handoff 2026-10-05 EAINT-12339]` Testing complete
   announced 2026-10-05 15:32 ("Sharepoint - EAINT-12339"). `[from appraisal proof pack 2026-10-15 §G]`
7. **TS / evidence:** `_reference/tickets/EAINT-12339/EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0.xlsx`
   (current), `N-EAINT-12339 ... (Azila review, renumbered).xlsx` (49 rows, out of
   date), `Azila Review - ... Reviewed_20261001.xlsx`, `Azfar - EAINT-12339_Test_Scenarios_draft.xlsx`,
   `(legacy-style).xlsx`; TS27 report PDFs HXJ0001 / VML4392 (uat1, 2026-10-01);
   SharePoint TS 2026-10-05 and evidence folder EAINT-12339. `[from handoff 2026-10-05 EAINT-12339]` `[from appraisal proof pack 2026-10-15 §C]`
   Automation vs TS audit: `EAINT-12339-automation-audit-2026-10-01.md`.
8. **Automation in repo:** `scripts/eauto-jomcheck/` (12 files / 45 tests incl.
   `tests/find-pre-push-data.spec.ts`), `app/eauto/jomcheck`, `app/api/eauto-jomcheck/`
   (run, find-data); not committed as of 2026-10-05. `[from handoff 2026-10-05 EAINT-12339]` `[from appraisal proof pack 2026-10-15 §D]`
   Flow doc `knowledge/flow-jomcheck.md` §6–§7z.
9. **Related tickets:** EAINT-10089 / 10937 (sharing, out of scope), EAINT-12412,
   EAINT-12386. `[from study EAINT-12339-study.html]` `[from Teams via memory digest]`
10. **Deploy / release:** S34.4-20261005, Done, 3 man-days; production switch
    05.10.2026 night, ezAuto completing 11:30pm (SRD §2.1.3; Jira description's
    20.09.2026 is stale); "KJ hotfix 6 Oct for invalid JomCheck API result". `[from study EAINT-12339-study.html]` `[from appraisal proof pack 2026-10-15 §A]` `[from Teams via memory digest, 2026-10-14]`
11. **PIC:** QA Faizuddin (study page listed Amirul Azfar as QA at the 2026-09-28
    study; Azila reviewed the workbook 2026-10-01); dev rui.luan; BA Chee Mei Jia. `[from study EAINT-12339-study.html]` `[from appraisal proof pack 2026-10-15 §F]`
12. **SharePoint script:** catalogue #040 in `knowledge/cr-test-scenario-catalogue.md` (Appendix A gives the file and path). `[from SharePoint library listing 2026-10-16]`
13. **Teams-only decisions:** `knowledge/teams-decisions-by-ticket.md` Part B § EAINT-12339.

---

## EAINT-12412 — [eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge

1. **Module / portal:** UCD and BackOffice JomCheck transaction details — invoice
   (`#to-print-invoice`) and e-Invoice (`#to-print-e-invoice`) downloads; e-Invoice
   submitted to LHDN. `[from lib/ticketStudies.ts · EAINT-12412]`
2. **SRD trail** (`_reference/tickets/EAINT-12412/EAINT-12412-SRD-v1.0-20260930.pdf`
   and `...-reupload-20261009.pdf` + `.txt`): 0.1 28.09.2026 Initial Draft; 0.2
   29.09.2026 "Updated Section 2.1.1 and 2.1.2; Added Revenue Split Assumption and
   Out-of-Scope Items and Renamed JomCheck Line Item"; 0.3 30.09.2026 "Updated Section
   2.1, 2.2.2, 2.2.5 and 2.2.6; Renamed Both Invoice Line Items and Confirmed
   e-Invoice Classification Code"; 1.0 30.09.2026 baseline. The first v1.0 PDF
   (2026-10-01 copy) lacked the v0.3 row and the renames; the 2026-10-09 re-upload
   (attachment 159431) carries them. Author Chee Mei Jia. `[from SRD EAINT-12412 v1.0 (re-upload) §1.3]` `[from NOTES.md EAINT-12412]`
3. **What it changes:** "Split JomCheck charge on invoice and e-Invoice into 2 line
   items: JomCheck report and JomCheck service charge." Line 1 RM18.00 + SST RM1.44 =
   RM19.44; line 2 RM2.00 + SST RM0.16 = RM2.16; total stays RM21.60; SST 8% on each
   line; revenue split stays eAuto RM6 / ezAUTO Asia RM14; "Applies only to JomCheck
   transactions approved after deployment"; both e-Invoice lines classification code
   022. `[from SRD EAINT-12412 v1.0 (re-upload) §2.1, REQ-001..006]`
4. **Settled decisions:** Option A invoice wording only (BA answer Q1, 2026-09-29);
   "Nurul will update Marie that invoice will show RM18 + RM2" (Q2); approval date
   decides the cut-off (Q5); screens unchanged (Q6); line names "JomCheck report" /
   "JomCheck service charge" and code 022 (re-uploaded SRD, 2026-10-09 — Jira summary
   and BA answer Q3 are stale); requestor green light for SRD v1.0 (Mei Jia Chee,
   2026-10-01 14:27); morning-session deployment (Sia Zhong Tai, 2026-10-12 16:37).
   `[from NOTES.md EAINT-12412]` `[from lib/ticketStudies.ts · EAINT-12412]` `[from Teams via memory digest, 2026-10-12]`
5. **Open at last sight (2026-10-15):** staging env and push date; how QA sees the
   LHDN payload (MyInvois sandbox login unknown); Wholesale chatbot JomCheck purchase
   on the chosen env; cancelled/refunded transactions and credit notes; QA Portal
   scope is wider than the SRD (Wholesale, SST Payment Report, MyInvois,
   failed-then-resubmit TS3). `[from lib/ticketStudies.ts · EAINT-12412]` `[from study EAINT-12107-12327-12412-release-S34X-study.html]`
6. **TS / evidence:** no workbook in the repo yet; study `EAINT-12412-study.html`
   (artifact HpGQcVFtaZYQKs6K3R63cn); sample invoice / e-Invoice PDFs + txt
   (2026-09-30). `[from NOTES.md EAINT-12412]`
7. **Automation in repo:** extend `scripts/eauto-jomcheck` (TS04 already downloads
   both PDFs; needs a PDF text parser). `[from lib/ticketStudies.ts · EAINT-12412]`
8. **Related tickets:** CCB-994, EAUTO-1070, EAINT-10089 (RM18 → RM20 price
   increase), EAINT-12339, EAINT-12386. `[from lib/ticketStudies.ts · EAINT-12412]`
9. **Deploy / release:** S34.X-20261020/21 TBC (release 2026-10-20); dev incl. code
   review due Fri 2026-10-09; Jira Ready For Development on 2026-10-15; QA estimate
   1 + 1 days (May Chin, 2026-10-15 10:11); briefing recorded 2026-10-05 11:01–11:09. `[from NOTES.md EAINT-12412]` `[from Teams via memory digest, 2026-10-15]`
10. **PIC:** QA Faizuddin; dev Sia Zhong Tai; BA / assignee / reporter Chee Mei Jia;
    dev analysis Goh Kai Jiaeh. `[from NOTES.md EAINT-12412]`

---

## EAINT-12414 — 🔴[eAuto - Onboarding] Pre-Application Form - Resets to Step 1 on reload & no error shown for failed Credit/Debit Card payment

1. **Type:** Task (production bug fix), priority Medium, reporter Boo Jin Siang, dev
   Mong Guo Hao, no SRD (zero attachments), fix MR eauto-onboarding !331. `[from EAINT-12414-jira-ticket.md]`
2. **Module / portal:** Potential UCD > Pre-Application Form (public form), Step 2
   Payment (Credit or Debit Card). Environment Staging → `staging/obs`. `[from EAINT-12414-jira-ticket.md]` `[from EAINT-12414-teams-thread-2026-09-30.md]`
3. **What it changes:** (1) refreshing or reopening a saved form restores the step
   reached (incl. Type of Business selection) instead of resetting to Step 1; (2) a
   failed card payment that returns to the same tab lands on Step 2 with the message
   "Unsuccessful Payment - Something went wrong and your payment didn't go through.
   Please choose a payment method and retry.", declaration still ticked and payment
   methods shown; no repeat banner after a second reload. `[from EAINT-12414-jira-ticket.md]`
4. **Settled decisions (Faizuddin, 2026-09-30):** defect testing is Pre-Application
   only; FPX regression Personal only (B2B not deployed); environment `staging/obs`;
   one full Pre-application → Application happy-flow walkthrough (11 phases) as the
   only regression; Chrome and Firefox only. Dev scope (Mong Guo Hao, 2026-09-29
   16:06): Type of Business on reload; failed card payment lands on step 2 with T&C
   ticked, methods shown, banner; successful card and FPX payment. `[from EAINT-12414-teams-thread-2026-09-30.md]` `[from study EAINT-12414-scope-brief.html]`
5. **Open at last sight (2026-09-30):** deployment date; whether the Application
   module shares the defect. `[from EAINT-12414-teams-thread-2026-09-30.md]`
6. **TS / evidence:** scope brief `EAINT-12414-scope-brief.html` (8 scenarios); no
   workbook in the repo.
7. **Automation in repo:** none; `scripts/eauto-duitnow-qr` / `knowledge/flow-ucd-onboarding.md`
   cover the same form.
8. **Deploy / release:** "9 Oct EAINT-12414 + EAINT-12461 (dev-tested, no QA)". `[from Teams via memory digest, 2026-10-14, Mei Jia's October plan]`
   No Jira fix version at capture. `[from EAINT-12414-jira-ticket.md]`
9. **PIC:** QA advice requested from Faizuddin (May Chin, 2026-09-29 19:44); final
   deploy went without QA; dev Mong Guo Hao. `[from EAINT-12414-teams-thread-2026-09-30.md]` `[from Teams via memory digest, 2026-10-14]`

---

## Status snapshot 2026-10-26 (25 future-deployment tickets)

Moment-in-time status, kept as one dated table so it can be replaced whole. Jira
status and fix version as read on 2026-10-26 `[from study <KEY>-study.md §1, in
_reference/tickets/Studying/<KEY>/]`; Miro column from the "eAuto - QA Resource
Planning" board `[from _miro-board-capture-2026-10-26.md]`; planned deploy from
Teams where one was set (`teams-decisions-by-ticket.md`). Chronological view:
`releases.md`. QA/BA mismatches between sources: `people-and-roles.md` §5.

| # | Ticket | Jira status (2026-10-26) | Fix version | Miro column | Planned deploy | Test env |
|---|---|---|---|---|---|---|
| 1 | EAINT-12431 LKM Refund WhatsApp/email to car owner (Part 1) | Ready for Prod Deployment | S34.15-20261026 🌞 | 26TH OCT DEPLOYMENT | **Deployed 2026-10-26 AM**, WhatsApp only `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]` | staging/uat4 |
| 2 | EAINT-12589 Ins Cancellation Balance % on listings/export (bug) | Done | S34.15-20261026 🌞 | 26TH OCT DEPLOYMENT | **Deployed 2026-10-26**, no QA `[from Teams DM Charmain Ea Chiang, 2026-10-26 09:37]` | /uat4 (Miro) |
| 3 | EAINT-10108 STMS Perakuan email wording | Ready for Prod Deployment | S34.16-20261027🌞 | 27TH OCT DEPLOYMENT | 2026-10-27 AM `[from Teams EAINT-10108, 2026-10-21 14:49, Charmain Ea Chiang]` | staging/uat3 |
| 4 | EAINT-12253 Firefox→Chrome browser reminder | Testing In 1st Env | S34.17-20261028🌞 | 28TH OCT DEPLOYMENT | 2026-10-28 AM `[from Teams EAINT-12180, 2026-10-20 14:25, Mei Jia Chee]`; QA 36/36 PASS | staging/uat1 |
| 5 | EAINT-12153 B2B payment channel | Testing In 1st Env | S34.1X-20261029🌞 | 29TH OCT DEPLOYMENT | 2026-10-29 AM `[from Teams eAuto QAs, 2026-10-22 10:29, Charmain Ea Chiang]`; 6/12 | staging/obs |
| 6 | EAINT-12257 DuitNow QR | Testing In 1st Env | S34.1X-20261029🌞 | 29TH OCT DEPLOYMENT | 2026-10-29 AM (same source); 3/13 | staging/obs |
| 7 | EAINT-11179 LKM/IC add-on Step 5→4 | To Do | none | TBC (pending requirement) | none; "Not Ready for Testing" `[from Teams eAuto QAs, 2026-10-20 08:25, Charmain Ea Chiang]` | not stated |
| 8 | LKM Refund Phase 2 | no Jira key found | – | TBC (update by 8/10/2026) | none (card "To deploy on: 5th Mar" is carry-over from Phase 1 per capture note) | not stated |
| 9 | EAINT-12580 IC split saves watermark pieces (bug) | Ready in 1st Env | none | TBC | none | /preprod1 (Miro) |
| 10 | EAINT-8767 Insurance Quotation Expired cron + Special Remarks | In Development | [QA]Ready for Testing Tickets | READY FOR TESTING TICKETS | none | not stated |
| 11 | EAINT-12121 SSM remove 7-day validation | Code Review | S35.X-20261102 🌞/🌚 | READY FOR TESTING TICKETS | none in Teams; QA: 28 Oct not possible `[from Teams eAuto QAs, 2026-10-20 14:14, Amirul Azfar]` | not stated |
| 12 | EAINT-12230 SSM duplicate purchase validation (bug) | Code Review | S35.X-20261102 🌞/🌚 | READY FOR TESTING TICKETS | with 12121 | not stated |
| 13 | EAINT-12087 Auto-expire SI slot after 60 days | Code Review | [QA]Ready for Testing Tickets | READY FOR TESTING TICKETS | none | not stated |
| 14 | EAINT-12123 Differentiate Reference No. (BDP & SI) | Code Review | [QA]Ready for Testing Tickets | READY FOR TESTING TICKETS | none | not stated |
| 15 | EAINT-12124 BDP email with CC to Support | Code Review | [QA]Ready for Testing Tickets | READY FOR TESTING TICKETS | none | not stated |
| 16 | EAINT-12125 12-char password, existing users | In Development | [QA]Ready for Testing Tickets | PACKAGE - ENFORCE 12-CHAR PASSWORD | none | not stated |
| 17 | EAINT-12228 Forgot Password link | In Development | [QA]Ready for Testing Tickets | PACKAGE - ENFORCE 12-CHAR PASSWORD | none | not stated |
| 18 | EAINT-12299 Rename Chinese-character filenames | Code Review | [QA]Ready for Testing Tickets | PACKAGE - ENFORCE 12-CHAR PASSWORD | none | not stated |
| 19 | EAINT-12333 Invoice for Proforma Invoice module | Code Review | [QA]Ready for Testing Tickets | PACKAGE - ENFORCE 12-CHAR PASSWORD | none | not stated |
| 20 | EAINT-12088 Public holidays via Google Calendar | Code Review | [QA]Ready for Testing Tickets (S34.X-20261026🌞 removed 2026-10-19) | 3RD NOV DEPLOYMENT | 2026-11-03 per Miro only; Jira Exp. Deploy Date cleared 2026-10-19 | not stated |
| 21 | EAINT-12099 Shopping Cart Inventory Control | REQ REVIEW IN PROGRESS - EAUTO | S35.X-20261105 🌞 (set 2026-10-26) | 5TH NOV DEPLOYMENT | 2026-11-05 (Jira Exp. Deploy Date 5/Nov/26); split, leftovers → EAINT-12635 `[from Teams EAINT-12099 group, 2026-10-26 10:16, Mei Jia Chee]` | not stated |
| 22 | EAINT-12028 Association Payment Listing | In Development | S35.X-20261126 🌞 | 26TH NOV DEPLOYMENT (all TBC) | 2026-11-26 (Jira Exp. Deploy Date 26/Nov/26) | not stated |
| 23 | EAINT-11868 Reminder emails + reactivation | Code Review | [QA]Ready for Testing Tickets | 26TH NOV DEPLOYMENT (all TBC) | 2026-11-26 per Miro only | staging/uat1 (Miro) |
| 24 | EAINT-12348 PBT as eDereg users | REQ REVIEW IN PROGRESS - EAUTO | none | 26TH NOV DEPLOYMENT (all TBC) | 2026-11-26 per Miro; Jira "ETA for Testing" 2026-10-27 | not stated |
| 25 | EAINT-12019 eMOVE standalone logistics | REQ REFINEMENT IN PROGRESS -EAUTO | none | 26TH NOV DEPLOYMENT (all TBC) | 2026-11-26 per Miro only | not stated |

## Tickets seen only in the release plan (no study in the repo)

Recorded here so the keys resolve; details live only in
`memory/teams-catchup-2026-10-06-to-15.md`. `[from Teams via memory digest, 2026-10-14]`

1. EAINT-12341 — approved-application emails to UCD + RHB Support; deployed 7 Oct AM. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-12341 / EAINT-12461. SharePoint rules: `business-rules-from-test-scenarios.md` §12 item 8 (#041).
2. EAINT-12430 — LKM Refund Amount column; 8 Oct AM; May Chin tested on staging/uat1. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-12430 / EAINT-12431 / EAINT-12329.
3. EAINT-12461 — with 12414, 9 Oct, dev-tested only. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-12341 / EAINT-12461.
4. EAINT-12119 (logistics interstate price tier) + EAINT-12462 + serbasentral cert
   renewal — 12 Oct night; bugs EAINT-12453/12454; reset-payment part → EAINT-12378. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-12119.
5. EAINT-12022 — Insurance Cancellation; 14 Oct night; Azfar night / Azila morning;
   319/319 before deploy; prod issue 15 Oct 02:26 (listing restricted to 8 accounts,
   patched); bugs 12427, 12432–12436, 12439–12441; staging/preprod1.
6. EAINT-8622 — Old BRN → New BRN for JPJ Enquiry; Charmain; staging/uat3; deploy 19
   Oct night; blocker EAINT-12535 fixed 14 Oct; issues 12540/12541/12542. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-8622.
7. EAINT-12442 — CIBO Referred Risk Log max 1 month; deploy without QA agreed
   (Charmain, 14 Oct); night deployment.
8. EAINT-12431 / 12329 — LKM refund notifications, split 14 Oct; Charmain On Hold at
   70% TS. Teams: `teams-decisions-by-ticket.md` Part A § EAINT-12430 / EAINT-12431 / EAINT-12329.
   **Update 2026-10-26:** EAINT-12431 deployed to prod 26 Oct morning (S34.15-20261026 🌞),
   WhatsApp only; email waits for the bizsupport@eauto.my mailbox. Bug EAINT-12600
   (Company transaction sent the messages) fixed before deploy. Jira status "Ready for
   Prod Deployment" at read time. `[from study EAINT-12431-study.md §1]`
   `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]` "QA has completed the prod regression testing and will continue to monitor prod from time to time"

## Tickets with no cr-ledger section, seen in Teams

Their decisions live in `teams-decisions-by-ticket.md` Part A; nothing is
duplicated here. Tickets already listed in the release-plan section above carry
their own pointer. `[from Teams sweep, 2026-10-16]`

1. EAINT-11540 — IC number validation.
2. EAINT-11759 — Secarang MessageBird / Macrokiosk split.
3. EAINT-11868 / EAINT-11982 — Application expiry extension and reactivation.
4. EAINT-11878 — JPJ Rejected WhatsApp when Lonpac returns cover note and JPJ status together.
5. EAINT-11978 — Showroom address and ownership edit. SharePoint rules: `business-rules-from-test-scenarios.md` §12 item 6 (#027).
6. EAINT-12019 — eMOVE standalone logistics.
7. EAINT-12054 — STMS bulk payment SSM checking.
8. EAINT-12055 — Reconciliation listing excludes resubmission records. SharePoint rules: `business-rules-from-test-scenarios.md` §11 item 8 (#029).
9. EAINT-12078 — Secarang NDDPs for STM.
10. EAINT-12121 / EAINT-12230 — SSM repurchase (7-day validation removed).
11. EAINT-12123 — Different reference numbers for multiple records under one Service Request.
12. EAINT-12124 — Service Hub BDP email with CC to Support.
13. EAINT-12130 — (group first opened as EAINT-12022).
14. EAINT-12155 / EAINT-12125 — 12-character password policy.
15. EAINT-12171 — Insurance cron intervals.
16. EAINT-12180 / EAINT-12253 — Firefox to Chrome migration notices. SharePoint rules: `business-rules-from-test-scenarios.md` §7 item 8 (#036).
17. EAINT-12219 — RHB Offer Letter sample replaced. SharePoint rules: `business-rules-from-test-scenarios.md` §12 item 9 (#037).
18. EAINT-12228 — Forgot Password link.
19. EAINT-12289 — APT price change and failed-payment reset. SharePoint rules: `business-rules-from-test-scenarios.md` §1.2 (#039).
20. EAINT-12299 — Chinese-character file names.
21. EAINT-12333 — Proforma invoice module.
22. EAINT-12342 — WhatsApp alert recipients.
23. EAINT-12344 — BackOffice permission page.
24. EAINT-12348 — PBT organisations as eDereg users.
25. EAINT-12386, EAINT-12406, EAINT-12424 — SRD stage only.
26. EAINT-12403 — STMS and APT service charge increase (effective 01.10.2026). SharePoint rules: `business-rules-from-test-scenarios.md` §1.1 and §1.2 (#042).

## Tickets with rules only in the SharePoint sweep

Durable rules from their CR test scripts are in
`business-rules-from-test-scenarios.md`; nothing is duplicated here.
`[from SharePoint library listing 2026-10-16]`

1. EAINT-10168 — reconciliation / eAuto = RHB amounts: §11 (#008).
2. EAINT-11757 — JomCheck API for credit companies: §5 item 10 (#016, #001); also `flow-jomcheck.md` §5a.
3. EAINT-12055, 12180, 12219, 12289, 12341, 12403 — see the pointers in the two sections above.


---

## Update 2026-10-27 from Charmain repo — tickets with team automation

Source: read-only clone `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain`, commit `0ab45d1`, last commit 2026-10-13), folder
`intake/`. Tag: `[charmain-repo: <path>:<line>]`. Test titles quoted below are
**tested expectations from her scripts**, not verified system behaviour.
Who owns what, where, and the verdicts: `script-inventory-team.md`.

### EAINT-11982 — Application expiry Extend button (BackOffice)

1. **Automation:** Charmain, `by-ticket/eaint-11982-application-expiry-extension`,
   23 JS files, 25 describes, 107 test titles; verdict "**re-author** into a module
   subject". Ledgers `BO-APPLICATION-EXTEND-BUTTON` (16) + `BO-APPLICATION-EXTEND` (27).
   `[charmain-repo: intake/reports/charmain-decisions.md:22, 46]`
2. **Rules her tests assert** (title text verbatim):
   a. "TS04 — before expiry: new expiry = original + 30 days, status stays Approved" `[charmain-repo: intake/reports/charmain-11982.json:615]`
   b. "TS05 / TS47 — after expiry: new expiry = click date + 30 days, Expired flips to Approved on BOTH surfaces" `[charmain-repo: intake/reports/charmain-11982.json:616]`
   c. "TS08.1–.3 (read-only) — the window closes at expiry + 3 calendar months" `[charmain-repo: intake/reports/charmain-11982.json:750]`
   d. "TS23 — the click date comes from the server, not the client" `[charmain-repo: intake/reports/charmain-11982.json:755]`
   e. "C2 — the expiry date is on the listing, and it is created + 90 days" `[charmain-repo: intake/reports/charmain-11982.json:1091]`
   f. "C4 / Q11 — Extend is in the Registration Documents sidebar, not the header" `[charmain-repo: intake/reports/charmain-11982.json:1092]`
   g. "R9 — Hardcopy Doc = Registered removes the button entirely" `[charmain-repo: intake/reports/charmain-11982.json:1093]`
   h. "R6 / R11 — an already-extended application is greyed, and says why" `[charmain-repo: intake/reports/charmain-11982.json:1094]`
   i. "TS01.8 — extended, then Registered: the greyed button goes too (R9 beats R6)" `[charmain-repo: intake/reports/charmain-11982.json:1636]`
   j. "TS06 — never extended, beyond 3 months after expiry: no button at all (R7)" and "TS07 — already extended, beyond 3 months: greyed message outlives the window (R6)" `[charmain-repo: intake/reports/charmain-11982.json:1641-1642]`
   k. "TS21 — Registered rows whose expiry has passed: still not Expired (R12)" `[charmain-repo: intake/reports/charmain-11982.json:1644]`
   l. "TS41.1 — Approved applications show the same button whoever they are assigned to"; "TS42 — the other status columns do not gate Extend either" `[charmain-repo: intake/reports/charmain-11982.json:660-662]`
   m. "TS10.1–.2 — empty and whitespace-only remarks are refused, nothing committed"; "TS52 variant D — a single-character remark IS accepted" `[charmain-repo: intake/reports/charmain-11982.json:1281, 994]`
   n. "TS14 / E2E_TS5 — two users confirm: one wins, the loser gets the refresh message" `[charmain-repo: intake/reports/charmain-11982.json:811]`
   o. "TS38.1 — the window closes under an open pop-up: REFUSED"; "TS38.2 — the assignee changes under an open pop-up: SUCCEEDS" `[charmain-repo: intake/reports/charmain-11982.json:1187-1188]`
   p. "TS48 — a Probation account cannot reach the page or the button" `[charmain-repo: intake/reports/charmain-11982.json:1483]`
   q. "TS50 — the Extend control is absent, and absent for the REQ-001(a) reason" (Approved with no registration documents) `[charmain-repo: intake/reports/charmain-11982.json:1390]`
   r. "TS51.1–.4 — no Extend control anywhere, and no expiry invented for it" (BackOffice-generated stub); "TS46 — a reactivated application can never be extended" `[charmain-repo: intake/reports/charmain-11982.json:1533, 1538]`
   s. "E2E_TS9 — the auto-expire job read the EXTENDED date, not the original"; "TS55 — the dealer link survives the ORIGINAL expiry, and its step still submits" `[charmain-repo: intake/reports/charmain-11982.json:1335-1336]`
   t. "TS13.4 — the log is reachable through the menu handshake, and a pasted URL is not" `[charmain-repo: intake/reports/charmain-11982.json:705]`
   u. "TS12.2 — close icon (baseline says there is none)" `[charmain-repo: intake/reports/charmain-11982.json:1274]`
3. These agree with `flow-application-reactivation.md` §4 (+30 days before / after
   expiry, 3-month window, status back to Approved, no email). Items e, f, g, i, k,
   p, q, r, s are not in that file yet.
4. **Data:** reads `APP_NO`, `EXTEND_APP_NO`, `EXTEND_APP_POOL`, `PAST_WINDOW_APP_NO`,
   `EXTENDED_THEN_EXPIRED_APP_NO`, `TS49_APP_NO`, `FORMAT_APP_NO` from `.env`;
   "Several are probably consumed by now". `[charmain-repo: intake/briefs/charmain.md:125-129]`
5. **Relevance:** EAINT-11868 (future #23) keeps Extend as regression.

### EAINT-12054 — STMS bulk payment SSM checking (UCD + BO)

1. **Automation:** Charmain, `by-ticket/eaint-12054-stms-bulk-payment`, 74 TS files,
   103 tests: 4 functional specs (`01-ssm-matrix`, `02-closure-loop`,
   `03-batch-behaviour`, `04-regression`), 26 data tools, 38 probes; 14 page objects.
   Verdict "**re-author, not keep-as-is.**"; ledger `UCD-STMS-BULK-PAYMENT` (40
   entries, from 167 source scenarios). `[charmain-repo: intake/reports/charmain-decisions.md:24, 45]` `[charmain-repo: intake/sources.yaml:66]`
2. **Rules her tests assert** (verbatim titles):
   a. "matrix batch: every seller state x every business type" `[charmain-repo: intake/reports/charmain-12054.json:2168]`
   b. "a blocked transaction pays after its SSM documents are purchased" `[charmain-repo: intake/reports/charmain-12054.json:2217]`
   c. "all-blocked batch: progress completes and nothing is paid"; "clean batch: no popup at all and every transaction pays" `[charmain-repo: intake/reports/charmain-12054.json:2264-2265]`
   d. "boundary: a full batch of ${BULK_MAX} — popup must size to the list"; "boundary: the UI must refuse more than ${BULK_MAX}" `[charmain-repo: intake/reports/charmain-12054.json:2267-2268]`
   e. "Bulk JPJ Enquiry popup wording is unchanged"; "popup titles stay distinct per screen"; "a permission change mid-session takes effect without re-login" `[charmain-repo: intake/reports/charmain-12054.json:2315-2317]`
   f. BO SSM permission paths: "force purchase path (company STMS ON, bypass OFF)" and "bypass path (company STMS OFF, gate ON)" `[charmain-repo: intake/reports/charmain-12054.json:639-640]`
3. **Trap:** projects `A_BYPASS` / `B_NO_BYPASS` / `C_COMPANY_OFF` "do not exist here,
   so the specs would skip and report green". `[charmain-repo: intake/reports/charmain-decisions.md:24]`
4. **Data tools worth reusing:** `fresh-ssm-no` ("EVERY pool slot gets a unique,
   correctly shaped registration number"; "LLP varies BOTH the ROC and the New ROC,
   keeping both shapes"), `set-esim-response` (patch + revert eSIM SSM response),
   `set-rhb-response` (patch + restore RHB transfer response), `expire-ssm`,
   `prep-rob` / `prep-roc` / `prep-llp`, `bo-set-bypass`, `pay-transaction`.
   `[charmain-repo: intake/reports/charmain-12054.json:3540-3542]` `[charmain-repo: intake/reports/charmain-12054.md:23-100]`
5. **Relevance:** EAINT-12121 / 12230 SSM (future #11, #12).

### EAINT-12131 — Special Remark on BDP / SI Transaction Details (BackOffice)

1. **Automation:** Charmain, `by-ticket/eaint-12131-special-remark`, 4 JS files, 42
   test titles (TC-01 … TC-40); ledger `BO-SERVICE-HUB-BDP-SI` (34). Answered
   2026-10-13 "`1-2 drop, 3 rewrite, 4 keep`", then blocked: no `.assertions.yaml`,
   and the spec needs a JS-to-TS rewrite of 1,266 lines plus 28 helper functions.
   `[charmain-repo: intake/reports/charmain-12131-migration.md:4, 47-62]`
2. Production regression precedent: 2026-08-20 "BO CSE special remark". `[from knowledge/production-regression-scope.md:880]`
3. Rules her tests assert: see `flow-device-purchase.md` § "Special Remark (EAINT-12131)".
4. **Relevance:** EAINT-8767 adds "Special Remarks" to insurance (future #10) — same
   field idea, different module; her TC list is a ready checklist shape.

### EAINT-12155 — 12-character password complexity (UCD, BO, AATF, bank)

1. **Automation:** Charmain, `by-ticket/eaint-12155-password-complexity`, 18 files, 62
   test titles; "NOT ONE reusable functional spec: 14 probes ... 3 contract tests ...
   1 recorder". Verdict "ledger, not spec"; ledgers `UCD-USER-PASSWORD` (24),
   `BO-USER-PASSWORD` (39), `AATF-USER-PASSWORD` (11), plus `bo-account-forms-password`.
   `[charmain-repo: intake/sources.yaml:96]` `[charmain-repo: intake/reports/charmain-decisions.md:28, 48]`
2. **Rules her probes assert** (verbatim titles):
   a. "TS121 — Ctrl+V of a valid value is refused; typing the same value works" `[charmain-repo: intake/reports/charmain-12155.json:945]`
   b. "TS122 — every paste route is blocked, because the guard is bound to the paste EVENT" `[charmain-repo: intake/reports/charmain-12155.json:171]`
   c. "TS135 — submit stays enabled on an invalid password" `[charmain-repo: intake/reports/charmain-12155.json:953]`
   d. "TS143 — a compliant password beginning with = or +" `[charmain-repo: intake/reports/charmain-12155.json:955]`
   e. "TS139a — double submit creates ONE account, not two" `[charmain-repo: intake/reports/charmain-12155.json:321]`
   f. "TS53 — a gated account tries a deep link past the change-password prompt" `[charmain-repo: intake/reports/charmain-12155.json:484]`
   g. Recorder contract: "the whitelist in CONTRACT is exactly fourteen characters" — her model of the allowed special characters, `[unconfirmed]` against the SRD. `[charmain-repo: intake/reports/charmain-12155.json:1407]`
3. **Accounts:** `QA121550101`, `QA121551017`, `QA121551125`, `QA121551133`,
   `QA121551854`, `QA121551882`, `QA121551884` (UCD), `QA121552254` (bank), "created
   at known compliance states". `[charmain-repo: intake/briefs/charmain.md:81-82]`
4. **Relevance:** EAINT-12125 12-character password and EAINT-12228 Forgot Password
   (future #16, #17).

### EAINT-104 — STMS LKM Refund (UCD + BO)

1. **Automation:** Charmain, `by-ticket/eaint-104-lkm-refund`, 334 files: Python
   document / fixture builders (IC one-pagers, bank statements) and 36 asserting
   `.mjs` scripts; no Playwright spec. Ledgers `UCD-STMS-LKM-REFUND` (38) +
   `BO-LKM-REFUND` (40) from 143 scenarios. `[charmain-repo: intake/sources.yaml:107]` `[charmain-repo: intake/reports/charmain-decisions.md:49]`
2. **Child tickets her scripts retest** (from file names): EAINT-9970 (retry payment,
   enquiry failure, retry redirect), EAINT-9971 (no charge), EAINT-9974 (first
   payment, state permission), EAINT-10485 (matrix), EAINT-11360 (bank statement),
   EAINT-12388 (preview), EAINT-12389 (borders, permission control), EAINT-12400 /
   12401 (report) / 12402; plus `test-export-audit-log`, `verify-step6`.
   `[charmain-repo: intake/reports/charmain-104.md:27-62]`
3. Hosts: `172.30.202.114` (eSIM, 23 hits), `172.30.202.23` (2), `staging.eauto.my`.
   `[charmain-repo: intake/reports/charmain-104.json]`
4. Registry, written 2 Oct 2026: "EAINT-104 is still awaiting production deployment".
   `[charmain-repo: intake/reports/charmain-decisions.md:28]` Conflict:
   `production-regression-scope.md:845` lists EAINT-104 deployed "20261001(PM)". The
   deployment record is the later source; treat 104 as deployed.
5. **Relevance:** EAINT-12431 LKM Refund notifications (future #1), LKM Refund Phase 2
   (future #8), EAINT-11179 add-on step move (future #7).

### EAINT-639 — JPJ Monthly Report verification

1. **Automation:** Charmain, `by-ticket/eaint-639-jpj-monthly-report`, Python:
   `compare.py`, `validators.py`, `rules.py`, `report_reader.py`, `staging.py`,
   `verify_jpj_report.py`, `make_sample.py`, `make_dev_from_staging.py`, `app.py`,
   pytest `test_compare.py`, `test_negative.py`. "checks a dev-generated xlsx monthly
   report against SRD v0.3 ... the only jpj material anyone has".
   `[charmain-repo: intake/reports/charmain-639.md:27-37]` `[charmain-repo: intake/sources.yaml:118]`

### EAINT-12126 — LHDN e-Invoice (field validation)

1. **Automation:** Charmain, `by-ticket/eaint-12126-lhdn`, 26 `.mjs` files:
   `eaint-12126-regression.mjs` (775 lines), `eaint-12126-evidence.mjs`,
   `consolidated-einvoice-check.mjs`, `capture-myinvois.mjs`, `probe-seller-identity`,
   `probe-c12-identity`, `probe-export*`, `probe-wholesale`, `probe-ucd-wholesale`,
   `probe-feb2026`, `probe-round3` … `probe-round7`. `[charmain-repo: intake/reports/charmain-lhdn.md:27-52]`
2. Hosts reached: `preprod-mytax.hasil.gov.my`, `preprod.myinvois.hasil.gov.my` (LHDN
   pre-production portals), `staging.eauto.my`. `[charmain-repo: intake/reports/charmain-lhdn.md:233-235]`
3. Deploy precedent: 2026-08-13, "e-Invoice field validation". `[from knowledge/production-regression-scope.md:887]`

### EAINT-8622 — New BRN for JPJ Enquiry and Final Submission

1. **Automation:** Charmain, `by-ticket/eaint-8622-new-brn-jpj`, 10 `.cjs` scripts:
   `brn-toggle-test`, `run-stms`, `read-jpj-logs`, `read-jpj-log-plates`,
   `read-companies`, `esim-set-field`, `preflight`, `check-login`, `walk`,
   `restore-brn`. Started 13 Oct 2026. `[charmain-repo: intake/reports/charmain-8622.md:27-36]`
2. **Trap:** "the suite changes a company BRN and puts it back" — always run
   `restore-brn` after. `[charmain-repo: intake/sources.yaml:239]`
3. Reaches eSIM at `172.30.202.114`. `[charmain-repo: intake/reports/charmain-8622.json]`

### Legacy tickets with automation in the shared repo (`eautoAutomation-Playwright`)

1. EAINT-4285 (eSTM step 2 individual, prepopulated address), EAINT-4323 (eSTM + eLKM
   with eLKM permission, 12 / 6 months), EAINT-5339 (eSTM, 8 specs with 0 live tests),
   EAINT-5147 (STMS, 8 specs), EAINT-5431 (STMS / UCD to UCD email address validation,
   MyPR / Malaysian / Company). `[charmain-repo: intake/reports/legacy-shared.md:134-145]` `[charmain-repo: intake/reports/legacy-shared.json:7299-7469]`
2. Details: `flow-estm.md` § "Legacy shared repo".

### Azfar's tickets

1. STMS wizard E2E migrated as `UCD-STMS` draft; STMS JPJ error-code matrix (21
   cases, "~7% known flake") and STMS RHB payment codes deferred.
   `[charmain-repo: intake/reports/azfar-migration.md:11-16, 42-48]`
