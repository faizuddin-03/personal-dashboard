# EAINT-12253 study (2026-10-26)

## 1. Header
1. **Title (verbatim):** "🔴[eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027"
2. **Jira status:** **Testing In 1st Env** (updated 2026-10-21 14:19).
3. **Priority:** Medium. **Type:** Task.
4. **QA (Jira field):** Muhammad Amirul Azfar. **Miro:** "QA: May".
5. **BA:** Lim Yi Link (Jira BA, assignee, reporter). **Miro:** "BA: Yi Link".
6. **Developer (Jira field):** zhan.choon. Earlier dev in Teams: Wong Kar Kin (2026-08-28 to 09-08).
7. **Deployment date:** **28 Oct 2026** — Miro column "28TH OCT DEPLOYMENT"; Jira Exp. Deploy Date `2026-10-28`; Fix version `S34.17-20261028🌞`, description "Main item(s): 1. Mozila - Last Step Popup".
8. **Test env:** **staging/uat1** — Jira Code Merge Environment and Miro "Test Env: staging/uat1".
9. **Estimates:** Jira QA man-day 5; Miro "Est. Testing Mandays: 5 days (1 QA)". Jira ETA for Testing 2026-09-08 (stale).

## 2. Sources read
1. **Jira EAINT-12253** via Atlassian MCP, read 2026-10-26. 0 comments. 1 sub-task (EAINT-12574). 1 link (relates to EAINT-12180, Done). 0 remote links.
2. **Jira EAINT-12574** (QA-Issue sub-task, Closed) — description + 1 BA comment (see `EAINT-12253-jira-comments.md`).
3. **SRD v1.1, 03.09.2026** — latest of 4 attachments (v1.0 20260901 docx/pdf, v1.1 20260903 docx/pdf). **Retrieved:** copied from `_reference/codebases/eauto-qa-azfar/cr/EAINT-12253/00-input/` to this folder as `EAINT-12253_SRD__..._v1_1_20260903.pdf` (179,089 bytes, same size as Jira attachment 155721). Text read from `.../01-intake/raw/srd.md`.
4. **Miro card** — capture lines 110-155 (`EAINT-12253-miro-card.md`).
5. **Teams export** `_reference/teams/EAINT-12180-12253-Firefox-to-Chrome-Announcement.md` (2026-08-26 to 2026-09-08); `_reference/teams/eAuto-QAs.md` lines 373, 376; `knowledge/teams-decisions-by-ticket.md` lines 151-160.
6. **Azfar's CR folder (read-only):** `_reference/codebases/eauto-qa-azfar/cr/EAINT-12253/` — `STATUS.md`, `00-input/teams-chat-2026-10-20.md`, 38-39 TS, evidence to 22.10.2026.
7. **Knowledge:** `knowledge/flow-stms.md` lines 58, 148, 155, 197, 208.

## 3. What changes
1. **Portal:** SRD §2.2.1 "Portal | UCD & AATF". Jira "Affected Portal | UCD".
2. **Module:** "Transaction Flow" (SRD) / "Transaction Last Step" (Jira).
3. **What:** a **Browser Reminder popup** at the last step of a transaction, for **Mozilla Firefox** users only, detected by user agent (SRD REQ-001).
4. **Why (SRD 2.1.1, verbatim):** "informing Mozilla Firefox users that support ends on 31 December 2026 and that Google Chrome is required from 1 January 2027."
5. **Transaction types (SRD v1.1 REQ-001, verbatim):** "1. STMS (including UCD to UCD & wholesale) 2. eSTM 3. BMK 4. APT 5. Insurance 6. Service hub 7. JomCheck 8. Deregistration 9. e-Dereg Pre-Checking"
6. **Exclusion (verbatim):** "Note: The browser reminder shall not be displayed for Company/Business Profile Update."
7. **Content (REQ-002):** title "Browser Reminder 浏览器提醒"; English above divider, Chinese below. English text (verbatim): "Mozilla Firefox support will end on 31 December 2026. Starting 1 January 2027, please use Google Chrome to access eAuto and complete your transactions. For a smoother and more secure experience, we recommend switching to Google Chrome early."
8. **Buttons (REQ-003):** "Continue 继续" closes popup, transaction continues; "View User Guide 查看操作指南" opens UCD User Guide in new tab. "The transaction is not blocked before 1 January 2027."

## 4. New vs existing behaviour
1. **Existing (SRD 2.2.2):** "No browser reminder is displayed at the last step of a transaction".
2. **New:** popup at last step in Firefox; none in Chrome (SRD REQ-001 Example 2); none on Company/Business Profile Update (Example 3).
3. **As built (Azfar first look 21.10, STATUS.md CD1):** "Reminder only shown to Firefox < 37 (`isLegacyFirefox()`)" — **"CLOSED 21.10: intended (Azfar / BA: only Firefox 36 / Java-applet users)"**.
4. **As built (STATUS.md CD2):** popup shows again after F5 — raised EAINT-12574, **closed by BA**: "This ticket can be closed as we can remain existing behaviour in staging." (Jira, 2026-10-21 12:23).
5. **As built (STATUS.md CD3):** "SRD v1.1 still says 'before the user confirms or submits'; build + BA (21.10) show it after payment".

## 5. QA scope
1. **Miro (verbatim, key lines):**
   1. "User Type: Main & Sub UCD"
   2. "Firefox: should show the popup" / "Chrome / any other Browser (eg: Edge): should NOT show the popup (Regression)"
   3. Step per module: "STMS - step 6", "STMS Wholesale - step 6", "UCD to UCD - Standard - step 6", "UCD to UCD - Interstate - step 6", "BMK - step 6", "APT - step 6", "Insurance - step 4", "Service Hub - step 4", "Jomcheck - show after Payment success", "Dereg - step 6", "e-Dereg Pre-checking - step 3"
   4. eSTM: "After eSTM Approval Flow - eSTM Step 6 should NOT show popup > redirect to Insurance Step 1 > Insurance Step 4 show popup"; "69E Flow - Insurance Step 4 show popup > eSTM Step 6 show popup"
   5. Functional: "[View PDF Guide  查看操作指南] button --> open User Guide in a new tab"; "[Continue 继续] button --> close the popup & return to the last step of Transaction"
   6. Scenario: "Manually refresh the page w/o closing popup - should show popup"; "Close the banner & refresh the page - should NOT show popup"
2. **SRD:** REQ-001 (trigger + 9 types + exclusion), REQ-002 (wording EN/CN), REQ-003 (2 buttons).
3. **Progress already made (Azfar STATUS.md, "End of 21.10.2026", updated 22.10):** "39 TS: 33 PASS · 0 FAIL · 2 N/A · 1 deprio · 3 not run". Not run: FF_TS7, BEH_TS1 (APT, waiting Dev answer), FF_TS4 (wholesale). Deprio: FF_TS14 (bulk). Results board: claude.ai/artifact/97trv2YiqahtzZMu9qz9BZ.

## 6. Affected regression areas
1. **Chrome / Edge** on every listed transaction — no popup (Miro "(Regression)").
2. **Last-step pages** of STMS, UCD to UCD, wholesale, eSTM (+ insurance redirect, 69E), BMK, APT, Insurance, Service Hub, JomCheck, Deregistration, e-Dereg Pre-Checking — buttons [Done] etc. still usable after Continue.
3. **Company/Business Profile Update** (Pre e-Invoice) — no popup.
4. **EAINT-12180 homepage announcement** — must not change (out of scope, SRD 2.1.2 item 3).
5. **Footer** "Best Compatible With Mozilla Firefox V36.0.4" — unchanged (Teams 2026-09-03 16:19).

## 7. Test data / env needs
1. **Firefox 36** (popup only for Firefox < 37 per build) + Chrome/Edge.
2. **Main UCD and Sub UCD**, **AATF** account (Dereg / e-Dereg).
3. Paid transactions per module on staging/uat1. Azfar's eSim prefixes OUP, IL, IM and seeded records listed in `STATUS.md`.
4. **Wholesale accounts + Decision Maker** — still open (STATUS.md Q9).

## 8. Dependencies / related tickets
1. **EAINT-12180** — homepage announcement popup, **Done**, hot-patched to prod 2026-09-08 (Jira link "relates to"; Teams).
2. **EAINT-12574** — QA-Issue, Closed, not a defect (refresh shows popup again).
3. **CCB-933**, **EAUTO-1028** (WebSocket migration) — SRD §1.5.
4. Mockup: SRD names "EAINT-12180_popup_mockup_rect_v4.html" — not attached anywhere; Azfar used mockup 26.08: `_reference/codebases/eauto-qa-azfar/cr/EAINT-12253/00-input/EAINT-12180_popup_20260826.html`.

## 9. Teams decisions (verbatim)
1. "received feedback from QA to separate ticket for Announcement popup & browser reminder" — BA, 2026-09-01 18:09, `EAINT-12180-12253-Firefox-to-Chrome-Announcement.md`.
2. "All trx type listed here shud be included (if UCD using firefox browser)" — BA, 2026-09-01 09:22, same file.
3. "We have missed out to include below modules to display browser reminder: UCD to UCD (Standard / Interstate), Derege-Dereg. Besides, to highlight that confirmed with Ops that system DO NOT display browser reminder for Update Company Profile (as known as Pre e-Invoice)" — BA, 2026-09-03 09:51, same file.
4. "We should remain unchanged for this footer after deployment of 12180 ya. We will address this once we dont allow UCD to use firefox" — BA, 2026-09-03 16:19, same file.
5. "also EAINT-12253 the changes cover too many pages already, will suggest to do deployment" — Dev, 2026-09-04 15:56, same file.
6. "please don't deploy EAINT-12253 to staging/uat4 first until QA give greenlight" — QA, 08.09 — from Azfar's summary `00-input/teams-chat-2026-10-20.md` (summary, not transcript).
7. Dev owner change + deploy 28.10: "Asked Tan Yi Fung which dev takes over this ticket; planning deploy 28.10.2026 (Wed)" — 20.10 14:25, same Azfar summary (paraphrased there).
8. Teams exports end 2026-10-16; newer chat swept by a separate agent.

## 10. Open questions / conflicts
1. **Refresh rule conflict:** Miro "Close the banner & refresh the page - should NOT show popup" and SRD REQ-001 "Displayed once per transaction." vs BA closing EAINT-12574: "we can remain existing behaviour in staging" (popup shows again after F5). Miro card and SRD not updated.
2. **Firefox version:** SRD says "Mozilla Firefox" (any version); build shows only to Firefox < 37 — accepted by BA per Azfar STATUS.md CD1. SRD not updated.
3. **Timing:** SRD "before the user confirms or submits" vs build "after payment" on the final step (STATUS.md CD3: "BA to update SRD").
4. **Scope lists differ:** Jira description 7 types; SRD v1.1 9 types (+ Deregistration, e-Dereg Pre-Checking); Miro 13 lines incl. wholesale and 69E flow.
5. **SRD internal conflict:** §2.1.2 Out-of-Scope "Browser reminder on portals other than UCD" vs §2.2.1 "Portal | UCD & AATF".
6. **Button label:** Miro "View PDF Guide 查看操作指南" vs SRD "View User Guide 查看操作指南".
7. **QA owner:** Miro "QA: May" vs Jira QA = Azfar (Azfar ran the TS).
8. **Still open (STATUS.md):** APT reminder only on Step 6 reached by F5 (CD4, Q23); wholesale flow (Q9); bulk payment (Q5, deprioritised).

## 11. Existing repo knowledge / automation to reuse
1. Azfar's full CR folder (read-only): `_reference/codebases/eauto-qa-azfar/cr/EAINT-12253/` — `01-intake/scenarios.yaml`, `EAINT-12253_Test_Scenarios_draft.xlsx`, `05-evidence/12253_*`, `STATUS.md`.
2. Azfar's Firefox 36 driver: `_reference/codebases/eauto-qa-azfar/automation/src/ff36/` (`bridge.py`, `journeys.ts`), fixture `src/fixtures/ff36-step.ts`.
3. Azfar's flows per module: `automation/src/flows/*.flow.ts` (stms, stms-company, ucd2ucd, estm, bmk, apt, insurance, service-hub, jomcheck, dereg).
4. This repo: `knowledge/flow-stms.md` (Browser Reminder notes lines 58, 155, 197); `scripts/eauto-estm`, `scripts/eauto-jomcheck`, `scripts/eauto-edereg-precheck`, `scripts/eauto-insurance` for last-step navigation.
5. EAINT-12180 TS text: `_reference/inbox/eauto-flows-run/ts-text/EAINT-12180_-_eAuto-UCD_Homepage_-_To_Display_Announcement_Popup_for_Mozilla_Firefox_to_Go.txt`.
