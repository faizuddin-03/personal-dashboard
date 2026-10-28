# EAINT-12153 study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** "🔴[eAuto-Application] Add B2B Payment Channel for Pre-application and Application"
2. **Title (Miro, verbatim):** "EAINT-12153 - 🔴[eAuto-Application] Add B2B Payment Channels for Pre-application and Application (B2B)"
3. **Jira status:** **Testing In 1st Env** (updated 2026-10-26 09:58).
4. **Priority:** Medium. **Type:** Task. **Labels:** 260803-260807, August2026, ProductBacklog.
5. **QA (Jira cf[10041]):** Muhammad Faizuddin Bin Bidi. **Miro:** "QA: Faiz".
6. **BA:** Lim Yi Link (Jira assignee; Miro "BA: Yi Link"). **Reporter:** Chee Mei Jia (BA/SA).
7. **Developer:** Lim Xiwei (Tracy) per the 2026-09-02 split message (Teams). Mong Guo Hao reported 12153 code-review status 2026-09-11 to 2026-09-29 (Teams). No Jira developer field read.
8. **Deployment date:** **29 Oct 2026** — Miro column "29TH OCT DEPLOYMENT"; Jira fix version `S34.1X-20261029🌞`, release date 2026-10-29, description "Main item(s): 1. Pre-Application & Application - Payment Gateway for DuitNow & B2B".
9. **Test env:** Miro "Test Env:" blank. QA-Issue EAINT-12588 says "staging/obs". Memory note: staging onboarding runs at `staging.eauto.my/obs/...` (12257 issues say "staging/eauto"). `[inference]` onboarding has no branch instance; same staging for both.
10. **Estimate:** Miro "Est. Testing Mandays: 3 days (1 QA)" — base 2 + buffer 1.

## 2. Sources read
1. **Jira EAINT-12153** via Atlassian MCP, 2026-10-26. 0 comments. 1 sub-task (EAINT-12588, Done). 1 link (relates to EAINT-12259, Done). 0 remote links.
2. **Attachments (Jira):** SRD v0.1/v1.0 20260810 (docx, pdf), v1.1 20260824 (docx, pdf), **v1.2 20260904 (docx, pdf, uploaded 2026-09-07)**, `EAINT-12153_B2B_Pending_Approval_Mockups.html`.
3. **SRD v1.2 (latest):** **retrieved** — copied from `_reference/tickets/EAINT-12153/` into this folder (`EAINT-12153_SRD_[eAuto-Application] Add B2B Payment Channel for Pre-application and Application_v1.2_20260904.pdf`). Text read with `pdftotext`.
4. **Miro card:** `EAINT-12153-miro-card.md`.
5. **Teams export** `_reference/teams/EAINT-12153-12257-12259-Onboarding-Payment-Channels.md` (to 2026-10-16).
6. **Knowledge:** `knowledge/flow-payment-channels.md` (§0, §4e, §9, §9c items 11-15, 2026-10-22/23 entries), `knowledge/cr-ledger.md` § EAINT-12153, `knowledge/teams-decisions-by-ticket.md` Part B.
7. **Existing ticket folder (not edited):** `_reference/tickets/EAINT-12153/` — official TS text snapshot v38, mockups, Session-Handoff-2026-09-01, guided-capture, First_QR_TestRun.
8. **OneDrive** `eAuto Documents\EAINT-12153\` — only two "Suggestion by Claude" workbooks. No copy of the official SharePoint TS v42.
9. **Run artifacts** `public/qa-artifacts/eauto-12153/` (folder timestamps 2026-10-22 17:03 to 2026-10-23 16:27).

## 3. What changes
1. **Portal / module:** UCD onboarding — **Pre-application** payment step (Business Info Review) and **Application** step 5 Payment.
2. **What (SRD v1.2 §2.2.4):** REQ-001 Credit or Debit Card; **REQ-002 Online Banking (Business)**; REQ-003 "Keep the existing FPX (Personal) option available and unchanged."
3. **Scope after split:** card was cut out to EAINT-12259 and patched to prod 2026-09-02; QR to EAINT-12257. 12153 = **B2B only**. `[from Teams, 2026-09-02 11:19, BA]`
4. **B2B approval flow (SRD §2.2.5, verbatim):** "After the potential UCD makes payment, the system redirects them to the Pending Approval page, and the transaction requires the authorizer to approve it within 7 days."
   1. REQ-004 redirect to Pending Approval page.
   2. REQ-005 approved → existing success redirect.
   3. REQ-006 pending → Pending Approval summary page on revisit.
   4. REQ-007 not approved in 7 days → back to payment page, existing unsuccessful handling.
   5. REQ-008 "Payment Submitted Date Time" field, format "DD-MM-YYYY hh:mm AM/PM".
   6. REQ-009 "Payment Date Time" shows "-" while pending.
5. **New email (SRD §2.3):** sender `imonitor@eauto.my`, CC `apply@eauto.my`, subject "[Pre-Application/Application No] [Company Name]: Payment Pending Approval - Awaiting Authorizer Approval".
6. **Why (SRD 2.1.2, verbatim):** "Provide new UCDs with additional payment methods during onboarding, reducing payment friction and improving onboarding completion."

## 4. New vs existing behaviour
1. **Existing (SRD 2.2.2, verbatim):** "A new potential UCD can only make the onboarding payment via FPX (Personal)." Card added since by EAINT-12259.
2. **New:** Online Banking (Business) tile with B2B bank list; maker Authorize → eAuto **"Payment is Pending Approval"** page; checker approves on Fiuu → success.
3. **As built on staging (verified 2026-10-22, flow-payment-channels §9c item 14):**
   1. Business bank tiles: Maybank `FPX_M2E`, CIMB, AmBank, Public, RHB, HLB, HSBC, **"Affin Bank B2B" `FPX_B2B_ABBM`**.
   2. Paid page Payment Method reads e.g. "FPX Online Banking (Maybank)" — no "Business"/"B2B" in the name.
   3. While pending, BO Application listing Registration Fee = **"Pending UCD"**.
4. **New Fiuu sandbox page (2026-10-23):** "Order Authorized" page with tranID + one-time **Decide code**, 120 s redirect (flow-payment-channels §9c item 15).

## 5. QA scope
1. **Miro (verbatim):** "Testing Scope: (Automation)"; "Pre Application > Payment Page"; "Application > Payment Page"; business types "Sdn Bhd / ROC", "ROB", "LLP", "Business Trading (Sabah)", "Business Trading (Sarawak)"; payment types "Credit or Debit Card", "VISA", "MasterCard", "Online Banking (Business) - B2B".
2. **Official TS:** SharePoint workbook (QATeam › 1. eAuto Project › eAuto - CR Test Scenarios). Repo snapshot v38 (TS1–TS8). Memory note: **v42 = TS1–TS12** (TS9–TS12 FPX retry rows added 2026-10-22). v42 not available locally.
3. **TS1–TS8 (v38 per flow-payment-channels §0):** TS1–TS2 B2B Success / Failed; TS3 B2B Pending Approval revisit → Approved; TS4 B2B Failed > Success then authorizer approves; TS5–TS8 FPX (B2C) and card regression.
4. **Note B15 (verbatim, flow-payment-channels §0 item 4):** new B2B requirements tested on "the popup page from Fiuu side only".

## 6. Current state and what remains before 29 Oct
1. **Automation runs seen** (`public/qa-artifacts/eauto-12153/`): TS1 (10-22), TS02, TS03, TS04, TS05, TS06 (10-23). `[inference]` pass/fail per TS not readable from folder names; check the dashboard result or SharePoint status column.
2. **First full B2B run passed — 12153_TS1, 2026-10-22** (Pre-App P261022/00902, Application NA60001193). `[verified: run log, flow-payment-channels §9c item 14]`
3. **No artifacts yet for TS07–TS12** (card regression + FPX retry rows). `[inference]` not yet run by automation.
4. **EAINT-12588** (Pending Approval needs refresh) — **Done**, retested 2026-10-22.
5. **AffinMax naming fix pending** — 2026-10-22 staging still "Affin Bank B2B" (`FPX_B2B_ABBM`). Faizuddin told dev "the affin bank option dont work anymore only can do thru affin max"; dev replied "okay noted ya, but using the same logo for Affin right?". Follow-up was planned 2026-10-23; outcome not recorded.
6. **Remaining checklist `[inference]`:**
   1. Re-read SharePoint v42; record status for TS1–TS12.
   2. Run TS07–TS12 (card regression, FPX retry).
   3. Confirm AffinMax tile change is deployed, re-run one Affin B2B case.
   4. Sign-off message in the CR group before 29 Oct.

## 7. Affected regression areas
1. **FPX (Personal) / B2C** — REQ-003 "behaves exactly as before". Shares the payment step.
2. **Credit or Debit Card** (EAINT-12259, live in prod since 2026-09-02).
3. **DuitNow QR** (EAINT-12257) — same release `S34.1X-20261029`, same page.
4. **BO Pre-Application / Application listing** — Registration Fee column states (OK / Failed / Pending UCD).
5. **Invoice / e-Invoice** after payment. e-Invoice download not offered on staging (TIN issue) — treated as PASS (flow-payment-channels, 2026-10-22).
6. **Payment Pending Approval email** (new) and existing payment success emails.

## 8. Test data / env needs
1. **Fiuu sandbox B2B banks (FAQ, verbatim):** "ABB (Affin Bank), ABBM (Affin Bank Multi-Bank), HLB (Hong Leong Bank) only". TS banks Maybank, CIMB, AmBank, Public, HSBC are not simulated for B2B.
2. Checker page `https://bank-simulator.fiuu.com/fpx-b2b/pending` + Order ID + Decide code.
3. Fresh companies per run (SSM types hit a live registry lookup; Business Trading Sabah/Sarawak automatable). Fake TIN rules per memory.
4. Registration fee now **RM 1,500.00** (was RM 990) — verified 2026-10-21.
5. Mailtrap / inbox for the Pending Approval email.

## 9. Dependencies / related tickets
1. **EAINT-12259** (card, Done, S33.1-20260902).
2. **EAINT-12257** (DuitNow QR, same release).
3. **EAINT-12588** (QA-Issue, Done).
4. **EAINT-12414** (two live defects on this payment step, per flow-payment-channels header).
5. SRD associated: EAUTO-1018, CCB-897.

## 10. Teams decisions (verbatim, export ends 2026-10-16)
1. `[_reference/teams/EAINT-12153-12257-12259-Onboarding-Payment-Channels.md, 2026-08-24 16:59, BA]` "Just to update that B2B is enabled in prod."
2. `[same, 2026-09-02 11:19, BA]` "we will separate this payment channels ticket into three tickets ... 1 EAINT-12153 ... B2B / Tracy; 2 EAINT-12257 ... DuitNow QR / Mong; 3 EAINT-12259 ... Credit or Debit Card / Tracy."
3. `[same, 2026-09-07 18:36, BA]` "Payment Method - No need to categorize whether this trx is B2B or C2B. \"[Approval Deadline Date] at 12:00 PM\" in email template (Section 2.3) a. Approval Deadline Date = Submitted Payment Date + 7 Day b. 12 PM - remain unchanged. Submitted Payment Date Time is only displayed for B2B payment method."
4. `[same, 2026-08-19 14:26, QA Faizuddin]` "it is 1 + 1 days If the QR is enabled, the effort is 1.5 + 1 days ya"
5. `[same, 2026-09-29 10:58, dev Mong]` "both tickets are ready for testing, but not deployed yet"
6. `[same, 2026-10-01 15:40, BA]` "As of now, there is no planned deployment date for this ticket just yet"

## 11. Open questions / conflicts
1. **AffinMax vs "Affin Bank B2B":** fix deployed to staging? Tile name/value after fix unknown. (Teams to dev 2026-10-22 vs staging 2026-10-22.)
2. **SRD v1.3:** Teams 2026-09-07 15:55 "I have uploaded SRD v1.3 to JIRA" — Jira has only v1.2 (uploaded 2026-09-07 15:54). Confirm v1.2 is final.
3. **REQ-007 7-day expiry:** not in the official TS (left out on purpose per memory). No way to simulate 7 days on sandbox. Confirm with BA that it is out of QA scope.
4. **Miro scope vs split:** Miro card still lists "Credit or Debit Card / VISA / MasterCard" — card shipped in EAINT-12259. `[inference]` regression only.
5. **Pending Approval email (SRD §2.3):** not listed in TS v38 snapshot. Check whether v42 covers it.
6. **Test env field blank on Miro**; 12588 says staging/obs, 12257 issues say staging/eauto.
7. **TS v38 vs v42:** repo snapshot is v38; latest per memory is v42. Re-read SharePoint before quoting.

## 12. Existing repo knowledge / automation to reuse
1. `knowledge/flow-payment-channels.md` — full DOM, B2B maker/checker flow, traps.
2. `knowledge/flow-ucd-onboarding.md` — surrounding onboarding journey.
3. `scripts/eauto-12153/` + `app/eauto/12153/` (`app/api/eauto-12153/run`) — TS runner incl. `12153_GUIDE_B2B` guided capture.
4. `scripts/eauto-preapp/` + `app/eauto/preapp/`; `scripts/eauto-payment-channels/` (older skeleton).
5. `_reference/html/fiuu/bank-simulator-fpx-b2b-*.html`, `_reference/html/eauto/obs-preonb-payment-pending-approval.html`.
6. `_reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md`.
