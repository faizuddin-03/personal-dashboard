# EAINT-12121 — study (2026-10-26)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD] SSM: Remove 7 Days Validation After First Purchase to Allow SSM Repurchase"
2. **Jira status:** **Code Review** (Task). Updated 2026-10-21 16:08.
3. **Priority:** Medium.
4. **Fix version:** "S35.X-20261102 🌞/🌚" (release date 2026-11-02). Labels: 260727-260731, July2026, ProductBacklog.
5. **QA (Jira cf[10041]):** Muhammad Amirul Azfar Bin Kamarulazam. Miro card: "- QA:" (blank).
6. **BA:** Lim Yi Link (Miro card "- BA: Yi Link"; SRD author). Jira assignee is also the BA [Jira assignee field is not the dev].
7. **Dev:** Wong Zhan Choon (Jira user "zhan.choon") — `[from Teams EAINT-12121, 2026-08-06 16:59]` "Wong Zhan Choon, please help on this also".
8. **Reporter:** Chee Mei Jia.
9. **Deployment date (Miro):** column **"READY FOR TESTING TICKETS"** — **no date**. Card: "- To deploy on:" (blank).
10. **Test env:** **not stated.** Miro: "- Test Env:" (blank), "- Test Env Point to: -". Jira has no env field value. Teams 2026-08-24 09:50 (Senior QA): "please wait for QA's greenlight ya, dont deploy to any staging env first".
11. **Test together with EAINT-12230** (Miro card of 12230: "- Test together with EAINT-12121").

## Sources read

1. Jira EAINT-12121 via Atlassian MCP, 2026-10-26: description, 4 attachments, 0 comments, 0 sub-tasks, 1 link (EAINT-12230 "relates to"), 0 remote links.
2. **SRD v1.0, 18.08.2026** (PDF, Jira attachment id 154521, 179,956 bytes). Copied from the QA colleague's repo clone (git branch `origin/12121-past-miro-board`, read-only `git show`) — byte size matches the Jira attachment.
   1. Copy: `EAINT-12121_SRD_v1.0_20260818.pdf`
   2. Text: `EAINT-12121_SRD_v1.0_20260818-text.md` (extracted by that repo's tool; no images).
   3. Other attachments not read: v0.1 docx (20260812), v0.2 docx (20260818), v1.0 docx (20260818).
3. Miro capture `_reference/tickets/Studying/_miro-board-capture-2026-10-26.md` lines 344-380 (card copied to `EAINT-12121-miro-card.md`).
4. Teams export `_reference/teams/EAINT-12121-12230-SSM-Repurchase-7-Days.md` (captured 2026-10-16; chat 2026-08-06 to 2026-08-24).
5. `knowledge/teams-decisions-by-ticket.md` §EAINT-12121 / EAINT-12230; `knowledge/flow-ssm.md`; `knowledge/flow-stms.md`.
6. QA colleague's prior study (read-only, git branch `origin/12121-past-miro-board` in `_reference/codebases/eauto-qa-azfar`): `cr/EAINT-12121/STATUS.md`, `cr/EAINT-12121/01-research/study.md`, `cr/EAINT-12121/02-plan/ESTIMATE.md`, `cr/EAINT-12230/STATUS.md`, `cr/EAINT-12230/01-research/study.md` (all dated 2026-10-20).
7. OneDrive `eAuto Documents\` — no EAINT-12121 folder.

## What changes

1. **Portal:** UCD + BackOffice. **Module:** SSM (STMS & eSTM). SRD §2.2.1.
2. **What:** remove the 7-day block on SSM repurchase. SRD §2.1.1: "Remove the 7-day validation that blocks SSM repurchase after the first purchase. Allow UCD to repurchase SSM starting from the same day."
3. **Why:** SRD §2.2.2 #1: "The system blocks the repurchase within 7 days of the first purchase." / "IT has to patch the SSM status and SSM Payment Date." / "CSE informs the UCD that the repurchase can proceed."
4. **Where (SRD §2.2.3 Affected Pages):**
   1. UCD Portal - SSM Purchase (STMS Step 4) — "Display of the [Purchase SSM] button after the cooling period."
   2. UCD Portal - SSM Purchase (eSTM Step 4) — same.
   3. UCD Portal - STMS and eSTM Details Page — "Download of the latest SSM document."
   4. BackOffice - STMS and eSTM Details Page — "Download of the latest SSM document."
   5. BackOffice - SSM Transaction Listing — "New record added for every SSM purchase."
   6. BackOffice - Consolidated e-Invoice Listing — "New record added when the UCD has an invalid TIN."
   7. BackOffice - eAuto Reconciliation Summary Listing — "New record added when the UCD repurchases SSM."
   8. UCD Portal - STMS and eSTM Listing Page > Resubmit — "Entry into the SSM repurchase flow through the Resubmit action."
5. **Requirements (SRD v1.0):**
   1. **REQ-001** remove 7-day validation. "Note: The SSM document is still valid to download for 7 days only."
   2. **REQ-002** **10-minute cooling period**: "Repurchase attempted within 10 minutes from the previous purchase → [Purchase SSM] button is not displayed".
   3. **REQ-003** button display: "No error message is shown to the UCD." Button appears by "a. Refreshing the page manually b. Selecting "No" in the Payment Confirmation popup" — "the system shall auto-refresh the page after the UCD selects "No"."
   4. **REQ-004** repurchase regardless of previous SSM status (OK or Failed).
   5. **REQ-005** standard fee every purchase. "No free repurchase is granted."
   6. **REQ-006** UCD downloads latest SSM document (within / after 7 days).
   7. **REQ-007** BO downloads SSM documents **in a zip file**.
   8. **REQ-008** one new SSM Transaction Listing record per purchase; previous record remains.
   9. **REQ-009** new invoice + e-Invoice per purchase; "The latest document is displayed as the first document in the list."
   10. **REQ-010** invalid TIN → Consolidated e-Invoice Listing + submitted to LHDN.
   11. **REQ-011** one new eAuto Reconciliation Summary Listing record per repurchase.
   12. **REQ-012** cross-flow: "Upon purchasing SSM in the STMS flow, the UCD shall be able to repurchase SSM in the eSTM flow."
   13. **REQ-013** UCD sees latest SSM only, even if latest = Failed ("⚠ Special Scenario": 1st OK, 2nd Failed → 1st document no longer displayed).
   14. **REQ-014** repurchase by any UCD user ("Main UCD and sub UCD are examples only").
6. **Assumptions (SRD §2.1.1):** 10 minutes "counted from the previous SSM purchase, not from the first purchase"; "The SSM document remains valid to download for 7 days from its purchase date."

## New vs existing behaviour

1. **Existing:** [Purchase SSM] hidden if an Approved SSM for the company was bought within 7 days; repurchase needs an IT patch. `[from SRD §2.2.2 #1]`
2. **New:** [Purchase SSM] hidden only for 10 minutes after the previous purchase; shown after that, any status, any user, STMS → eSTM. `[from SRD REQ-001..004, 012, 014]`
3. **New:** every repurchase = new charge, new invoice/e-Invoice, new BO listing rows. `[from SRD REQ-005, 008, 009, 011]`
4. **Unchanged:** 7-day download validity of each document. `[from SRD §2.1.1 #3]`
5. **Changed per Teams (not in Jira description):** Rafftech does not block eAuto on same-BRN repeat purchase — `[from Teams EAINT-12121, 2026-08-10 10:24, senior dev]` "Rafftech feedback that our account is excluded for this 008 checking which meant can purchase same BRN within 3 hours."

## QA scope (Miro card + SRD)

1. **Est. mandays (Miro):** "9 days (1 QA)" = "Base Testing Time: 7 days" + "Buffer ...: 2 days". Card also says "~100 TS".
2. **Testing scope (Miro):** "(Manual + Automation Testing)".
3. **Module Affected (Miro, verbatim):** "STMS Company", "eSTM Company".
4. **[Purchase SSM] button (Miro, verbatim):** "Before 10min - hide", "After 10min - show", "Before 7 days - show", "After 7 days - show".
5. **Other card items (verbatim):** "STMS & eSTM Existing Transactions", "Cross Module (STMS + eSTM) Checking", "SSM 7 Days Handling", "SSM Cronjob Resubmission", "SSM Document Validation Checking", "Business / Company Status Checking FAILED", "Director / Owner IC Checking FAILED", "e-Info returned WRONG Info", "SSM 2 Layer Permission???".
6. **SRD-driven checks:** REQ-001 to REQ-014 above, across STMS and eSTM, main and sub UCD, SSM OK vs Failed, TIN valid vs invalid.
7. **Prior draft exists:** the QA colleague drafted a **joint 12121 + 12230 set of 64 TS** (sheets: Repurchase 14, Cooling Period 11, Duplicate Payment 15, Documents 11, BO Listings 4, Regression 9), "awaiting gate 0", on 2026-10-20. `[from Azfar repo branch origin/12121-past-miro-board, cr/EAINT-12121/STATUS.md]` His estimate: "6 QA-days for both (5–8)" vs Miro "9 days".

## Affected regression areas

1. STMS / eSTM Step 4 SSM purchase popups and payment confirmation (RHB). `knowledge/flow-ssm.md`, `knowledge/flow-stms.md`, `knowledge/flow-estm.md`.
2. **Resubmit routing** from STMS / eSTM listing (SRD §2.2.3 #8).
3. **SSM cronjob resubmission** for Failed SSM (Miro card item).
4. **EAINT-10119** company name / BRN vs SSM checks (live S34.2-20261001) — runs on each repurchased document. `[from Azfar study §Regression]`
5. SSM Permission / Bypass Purchase SSM (EAINT-8802).
6. Bulk Payment SSM check (EAINT-12054). `[from Azfar study]`
7. BO: SSM Transaction Listing, Reconciliation Summary, Consolidated e-Invoice, STMS/eSTM Details zip download.
8. UCD reports (Payment Report, Download Payment Document). `[from Azfar study]`

## Test data / env needs

1. **Environment:** not named anywhere. Must be the same build as EAINT-12230.
2. **eSim** SSM enquiry / submission responses: `knowledge/esim.md`; captures `_reference/html/esim/ssm-enquiry-resp-list.html`, `_reference/html/esim/ssm-roc-submission-resp-list.html`. Set eSIM codes before every run (memory rule).
3. **Two users of one UCD company** (main + sub) for REQ-014. Not recorded in knowledge. `[from Azfar study Q17]`
4. Company with SSM Permission ticked and no user bypass. `[from Azfar study Q10]` "On preprod1 (29.09) [Purchase SSM] did not appear with `ssmPermission` ticked".
5. UCD with **invalid TIN** for REQ-010.
6. "After 7 days" rows need a **dev date patch** (past practice, EAINT-9247 / 8802). `[from Azfar study Q20]`
7. RHB bank file / recon run for REQ-011. `[from Azfar study Q19]`
8. SSM fee today: RM19.44 `[from Azfar study, WB 9247]` — do not use as an expected value unless on screen (his repo rule).

## Dependencies / related tickets

1. **EAINT-12230** (Bug, Code Review) — "relates to"; duplicate-purchase check on payment step. Test together (Miro).
2. SRD §1.5: **EAUTO-1006** "ENHANCEMENT REQUEST - SSM REPURCHASED"; **CCB-886** "EAUTO | To Remove 7 Days Validation After First Purchase and Allow SSM Repurchase".
3. Prior art: EAINT-5155 (SSM integration, 7-day rule), EAINT-9247 (LLP), EAINT-8802 (Bypass), EAINT-10119 (name/BRN check), EAINT-12113 / 10168 / 12055 (Recon).

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-12121-12230-SSM-Repurchase-7-Days.md` (export ends 2026-10-16; last message 2026-08-24).

1. `[2026-08-07 12:08, dev]` "From what I found is will return response code "008" when requesting within the timeframe, current timeframe I checked is 3 hours"
2. `[2026-08-10 10:24, senior dev]` "Rafftech feedback that our account is excluded for this 008 checking which meant can purchase same BRN within 3 hours."
3. `[2026-08-11 18:01, BA]` "confirmed with Nurul to have 10 min cooling down period. Within this 10 min period, UCD is unable to repurchase this SSM Document. System only allow UCD to repurchase ssm after this cool down period."
4. `[2026-08-14 17:07, BA]` "STMS purchased SSM, UCD can repurchase SSM in eSTM." / "If UCD repurchase case, system remain unchanged to allow BO download SSM documents in zip file." / "Nurul: No, system should only allow UCD to download latest SSM doc. If 2nd purchase, SSM Status = Failed, UCD unable to view & download SSM Doc for 1st purchase."
5. `[2026-08-24 09:07, BA]` "this ticket dont have planned deployment date just yet. QA side will advice staging env once it is confirmed."
6. `[2026-08-24 09:11, BA]` "Kindly update the ticket status to "Code Review" ya / once deployed to staging, kindly update to "Ready in 1st env""
7. `[2026-08-24 09:50, Senior QA]` "please wait for QA's greenlight ya, dont deploy to any staging env first"

## Open questions / conflicts

1. **Test environment + deployment date** — not set in Jira, Miro, or Teams. Fix version moved to **S35.X-20261102** (Jira 2026-10-26); the QA colleague's notes and `knowledge/flow-stms.md` still say **S34.X-20261028**.
2. **QA owner:** Jira QA = the QA colleague (Azfar); Miro "QA:" blank. Confirm who tests.
3. **10-minute anchor conflict:** SRD Assumption 1 "counted from the previous SSM purchase" vs EAINT-12230 "Winning purchase **Approved**, 10-minute cooldown not elapsed". `[Azfar study C1]`
4. **Failed / paid-not-Approved previous purchase:** SRD REQ-004 "Allow ... regardless of the SSM status" vs EAINT-12230 row 1 "Colleague ... already **paid** this BRN, **not yet Approved** → Refuse payment". `[Azfar study C2]`
5. **Download out of scope vs requirements:** SRD §2.1.2 lists "SSM document download handling in UCD Portal and BackOffice" as Out-of-Scope ("UCD and BO continue to download the latest SSM document"), yet REQ-006/007/013 define download behaviour and REQ-007 says BO downloads a **zip** (not "latest"). `[Azfar study C3]`
6. **Recon listing:** REQ-011 "new record ... for every SSM repurchase" vs current rule that matched eAuto = RHB rows are not listed. `[Azfar study C5, from EAINT-10168]`
7. **Jira description vs SRD:** Jira says "(within same day or next day). System allow UCD to repurchase" — no 10-minute rule; SRD v0.1+ adds it. SRD wins.
8. **Button labels:** REQ-003 says "No" on the Payment Confirmation popup; EAINT-5155 SRD labels were [Proceed]/[Back]. Observe on screen. `[Azfar study C7]`
9. **Miro card vs SRD:** card says "Before 7 days - show / After 7 days - show" (consistent with REQ-001) and lists "SSM 2 Layer Permission???" — not in SRD; meaning unknown.
10. **Past team Miro board** for this ticket noted by the QA colleague, not read: https://miro.com/app/board/uXjVLpTBxtE=/?moveToWidgets=AQAJoezsiPuCgIAwAgGAAbyro5sBtsreRtuWvFSn8PUD49XSgQY — **not in `_reference/miro-links.txt`** (append when the user confirms).

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-ssm.md` (entry "Repurchase without the 7-day block (FUTURE)"), `knowledge/flow-stms.md`, `knowledge/flow-estm.md`, `knowledge/esim.md`.
2. eSTM automation: `app/eauto/estm` (maintained suite; never edit `/eauto/estm-legacy`). STMS / E2E runner: `app/api/eauto-e2e/run/route.ts`.
3. QA colleague's joint draft (read-only): `_reference/codebases/eauto-qa-azfar` branch `origin/12121-past-miro-board`, `cr/EAINT-12121/01-intake/EAINT-12121_Test_Scenarios_draft.xlsx`, `scenarios.yaml`, `01-research/study.md`; live board artifact https://claude.ai/artifact/UKp164vuctFJWjNBhbZDbW.
4. eSim captures: `_reference/html/esim/ssm-enquiry-resp-list.html`, `_reference/html/esim/ssm-roc-submission-resp-list.html`.
