# EAINT-12406 — study (2026-11-02)

## Header

1. **Title (verbatim, Jira):** "⚪[Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording"
2. **Jira status:** **Ready For Development** (Task). Jira "Updated": "2026-10-28T15:29:25.295+0800" (`EAINT-12406-jira.md` line 10). Capture time "02/11/2026, 9:26:16 am" (line 1).
3. **Priority:** Medium.
4. **Fix version:** **"S35.X-20261106 🌞 (2026-11-06)"** (line 8). Labels: 260921-260925, ProductBacklog, September2026.
5. **QA (Jira cf[10041]):** **blank** ("—", line 7). **[QA] Est Man-day (cf 10081): "5"** (line 11).
6. **BA:** Lim Yi Link (Jira assignee; SRD v0.5 to v1.1 author). Earlier BA Chee Mei Jia wrote v0.1 to v0.4 and is the reporter. `[from Teams EAINT-12406, 2026-10-06 08:50, Mei Jia Chee]` "Yi Link Lim, will handle this ticket and proceed from SRD v0.4 to wrap up the requirements ya"
7. **Dev:** Mong Guo Hao. `[from Teams EAINT-12406, 2026-10-22 09:54, Tan Yi Fung]` "Mong Guo Hao, please help on this, tq"
8. **ETA for testing:** **2026-10-28** (Jira cf[10057], line 11). `[from Teams EAINT-12406, 2026-10-26 15:50, Mong Guo Hao]` "Hi 28/10 will be ready for testing". **Date has passed; status is still "Ready For Development"** — no hand-over to testing recorded in Jira or the Teams capture.
9. **Exp. Deploy Date (cf[10087]):** **"2026-11-06"** (line 11). Matches the fix version S35.X-20261106. No deployment date in the Teams capture (ends 2026-10-26).
10. **Test env:** **staging /ia** (`https://staging.secarang.com/ia`). `[Faizuddin, dashboard chat, 2026-10-27]` "will host on /ia. the time to deploy will be updated later". Not stated in Jira, SRD or Teams. Deploy time to /ia still not recorded.
11. **Requestor sign-off:** `[from Teams EAINT-12406, 2026-10-26 16:08, Yi Link Lim]` "Also, we get greenlight from shamini to proceed this ticket ya."
12. **Links / sub-tasks / comments:** none (0 / 0 / 0).
13. **Portals:** **Secarang** (public site) + **CIBO** (receipt and Transaction Details). `[from SRD v1.1 §2.2.3 #6, #7]`

## Changes since last study (2026-11-03)

Source: Atlassian connector, live read 2026-11-03 (Jira "updated" "2026-11-02T15:20:30.882+0800").

1. **Status: changed.** "Ready For Development" → **"In Development"**.
2. **QA (cf 10041): changed.** Was blank. Now **"Muhammad Amirul Azfar Bin Kamarulazam"** and **"Muhammad Faizuddin Bin Bidi"**. Faizuddin picks up via KT from Azfar (Teams DM).
3. **Fix version: renamed.** Now **"S35.5-20261106 🌞"**, release date "2026-11-06", description "Main item(s): / 1. Secarang - Allianz". This ticket is the main item of the 6 Nov release.
4. **Unchanged:** Exp. Deploy Date "2026-11-06", ETA for Testing "2026-10-28", assignee "Lim Yi Link", 0 comments, 0 links, 0 sub-tasks, 14 attachments (newest still SRD v1.1).
5. **Azfar KT chat: captured** (retry same day). See § "Knowledge transfer from Azfar (2026-11-03)" below.

## Knowledge transfer from Azfar (2026-11-03)

Sources:
1. Teams DM `_reference/teams/DM-Amirul-Azfar-EAINT-12406-KT.md` (2026-11-03 04:20–04:26 MYT).
2. Azfar repo `github.com/modefair/eauto-qa-azfar`, folder `cr/EAINT-12406/` (local clone `_reference/codebases/eauto-qa-azfar`, fetched 2026-11-03, origin/main 6c04297). Copy of its STATUS.md: `_reference/tickets/EAINT-12406/EAINT-12406-azfar-STATUS-20261103.md`.
3. TS board artifact `https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT` (live data; shell saved as `_reference/tickets/EAINT-12406/EAINT-12406-azfar-ts-board-artifact-20261103.html`). Header on 2026-11-03: "42% 19 / 45 passed", "3 failed · 2 RE-RUN · 7 KIV · 1 BLOCKED · 13 not run", "Defects 0 tickets".

### What Azfar said (verbatim, DM)
1. "Tapi kena tambah sikit yang guna real api" — some TS must be added that use the **real Allianz API** (SIT pass). /ia/ is on the **simulator** today.
2. "lepastu sekarang ada blocker tu" — blockers are open (list below).
3. "ada semua info sekali pasal 12406" — the repo holds all 12406 info.

### State when handed over (STATUS.md "Where it ended — morning 30.10.2026")
1. **Deployed to /ia/ on 29.10** by Dev. Tested 29.10 to 30.10. CIBO = `https://staging.secarang.com/cibo` ("/ia/cibo is NOT CIBO").
2. **46 TS, 5 sheets:** CP (Secarang pages, 9), QT (Quotation, 10), E2E (Allianz purchase, 12), RC (Receipt and CIBO, 11), RG (Regression, 4).
3. **PASS 19:** "CP_TS1–6, CP_TS8 · QT_TS1 · E2E_TS4, TS5, TS9, TS10 · RC_TS3, TS5, TS6, TS9, TS10 · RG_TS1, RG_TS3".
4. **FAIL 3:** "RC_TS1 (D1 + D2), RC_TS2 (D1), RC_TS8 (D1)".
5. **KIV 7:** "E2E_TS1–3 (cover note Q44) · QT_TS7 (document dates, BA) · RC_TS11 (recorded; needs QT_TS4) · CP_TS7, E2E_TS8 (production, on hold by you)".
6. **BLOCKED 1:** "E2E_TS12: RM2,510.87 can't be paid on the Fiuu sandbox (FPX + card P15 > MYR 2,000, GrabPay blank) — Q46".
7. **RE-RUN 2:** "RC_TS4 E5, RG_TS2 (need QT_TS4's Lonpac purchase)".
8. **Not run:** QT_TS2 / TS4 / TS5 / TS6 (need Dev's "unavailable" simulator plates), 8 orange ON HOLD (CP_TS9, QT_TS3, QT_TS8, QT_TS9, QT_TS10, E2E_TS6, E2E_TS7, E2E_TS11), RC_TS7.
9. **Deprioritised:** RG_TS4 (eAuto insurer order; "eAuto and Secarang are different systems").

### Defects drafted, NOT raised in Jira
1. **D1 (Low)** — Allianz BRN follows "Berhad" instead of its own line. Secarang receipt PDF, CIBO receipt PDF, e-receipt email. Data: HXA0011A–14A, BR60006349–52, old BR55004010. SRD REQ-010. Azfar: "You can raise it To Do, or On Hold for the BA first (this is Q42)."
2. **D2 (Medium)** — "Premium after NCD" RM882.16, expected RM862.16 ("Basic 1,203.08 − NCD 360.92 + All Drivers 20.00"). Every Allianz receipt since deploy. Console clue: "TypeError … reading 'amount' at autoAddAddonIfAllianz".
3. Draft files: Azfar repo `cr/EAINT-12406/05-evidence/issues/D1/`, `D2/`.

### Open questions to send
1. **Dev (Mong Guo Hao):** Q44 cover note / policy / e-Certificate missing on every paid Allianz purchase (EAINT-6345); Q46 paying > RM2,000 on Fiuu sandbox; simulator plates for Allianz / Lonpac / Tokio Marine unavailable and individual non-renewal.
2. **BA (Lim Yi Link):** Q42 (D1 wrap vs line break), Q45 (no "Unpaid" badge), N1 (Print view not a receipt?), QT_TS7 (documents dated 2020, not 2022), Q16 (Allianz commission RM0.00 for RJC7), Q40 (company vehicle card vs "no insurer supports companies"), Q43 (CRM record).
3. **Observations for Dev, not 12406:** blank window on P15 refusal; card payment hung (BR60006337); CIBO full-listing print HTTP 404; simulator ignores gender; Serba Sentral staging API seemed down 30.10 afternoon.

### Test data and setup
1. Plates HXA0001A–HXA0020A (made up). On the simulator "all three insurers quote any made-up car": Lonpac RM819.07, Allianz RM862.16, Tokio Marine RM1,355.08 (29.10).
2. About 35 paid Allianz purchases + 1 Tokio Marine on /ia/. Receipts went to Azfar's Gmail Spam (sender noreplyiatest@bintangprospek.com).
3. Real-API pass: "with Allianz's real API the data must be real (Allianz checks the IC for a quotation)". SIT candidate row named: E2E_TS9 (gender pricing).
4. Run evidence / videos (`04-runs/`, `05-evidence/` images) are git-ignored and live **only on Azfar's main laptop**. Logins file `automation/env/.staging.env-local` is not in git.

### Next steps (from STATUS.md + DM)
1. Jira moved to **In Development** 02.11 15:20 by Dev. STATUS.md: "Ask Dev what is being changed before re-running anything."
2. Raise D1 + D2 (QA-Issue skill; D1 To Do or On Hold per Q42).
3. Send the Dev and BA questions above.
4. When Dev answers: Q44 → re-run E2E_TS1–3; Q46 → E2E_TS12; plates → QT_TS2/4/5/6, then RG_TS2, RC_TS4 E5, RC_TS11.
5. Add real-API (SIT) TS once Dev confirms when /ia/ can switch to the Allianz UAT API.
6. Before SharePoint upload: move E2E_TS9 evidence out of `05-evidence/FAILED/` (it passed after v6c).

## Changes since last study (2026-11-02)

Compared: Jira capture "27/10/2026, 8:25:31 pm" (used by the 2026-10-27 study) vs Jira capture "02/11/2026, 9:26:16 am" (`EAINT-12406-jira.md` line 1).

1. **Status:** **no change.** Still "Ready For Development" (line 6) — even though ETA for Testing "2026-10-28" has passed.
2. **Fix version: changed.** Was "[QA]Ready for Testing Tickets (2026-11-02)". Now **"S35.X-20261106 🌞 (2026-11-06)"** (line 8). The ticket is now planned for the **6 Nov 2026 release**.
3. **Exp. Deploy Date (cf 10087): changed.** Was "—". Now **"2026-11-06"** (line 11).
4. **[QA] Est Man-day (cf 10081): changed.** Was "—". Now **"5"** (line 11). Sits at the top of the 4-5 range in `EAINT-12406-related-history.md` § Estimated testing effort #3 (single figure there was 4.5).
5. **Jira "Updated": changed.** Was "2026-10-26T17:08:50.481+0800". Now "2026-10-28T15:29:25.295+0800" (line 10). The 2026-10-28 edit most likely set the three fields above [unconfirmed — capture holds no change history].
6. **Unchanged fields:** QA (cf 10041) "—", Assignee "Lim Yi Link", ETA for Testing "2026-10-28", Links / Sub-tasks / Parent "—" (lines 7, 11-14).
7. **Description:** **no change.** SRD table still ends at row 7 "26.10.2026 (Monday) | v1.1 | Updated Section 2.2.3 Affected Pages Added Section 2.2.10 Transaction Details" (line 34).
8. **New comments:** **none.** "## Comments (0)" (line 36).
9. **New attachments:** **none.** Still 14; newest is still "SRD_EAINT-12406_v1.1_20261026.pdf — 196927 bytes, 2026-10-26T16:06:07.535+0800, by Lim Yi Link" (line 53). SRD v1.1 text copy re-read: requirements REQ-001 to REQ-011 unchanged.
10. **Teams:** no newer capture. `_reference/teams/EAINT-12406-Secarang-Allianz.md` still ends at 2026-10-26 16:08. Anything said in Teams after that (e.g. the 2026-10-28 hand-over) is **not in the repo**.
11. **Knowledge updated since last study:** `knowledge/flow-secarang-insurance.md` § "Update 2026-10-27 from EAINT-12406" (lines 789-836) and `knowledge/flow-cibo.md` §4.4a (lines 359-361) now carry this ticket's facts. Knowledge candidates 1-5 below are **done**; "Contradictions with knowledge/" #1 and #4 are updated to match.
12. **What this makes wrong in the study:** Header #2, #4, #5, #8, #9; Open questions #1 and #2; Contradictions #1, #3 and #4. All fixed below.

## Changes since last study (2026-10-27)

Compared: Jira capture of 2026-10-27 17:17 (used by the first study) vs Jira capture "27/10/2026, 8:25:31 pm" (`EAINT-12406-jira.md` line 1).

1. **Status:** no change. Still "Ready For Development" (`EAINT-12406-jira.md` line 6).
2. **Fix version:** no change. Still "[QA]Ready for Testing Tickets (2026-11-02)" (line 8).
3. **Jira "Updated" field:** no change. Still "2026-10-26T17:08:50.481+0800" (line 10). Jira itself records no edit after the first study.
4. **Other fields:** no change. QA (cf 10041) "—", Exp. Deploy Date "—", ETA for Testing "2026-10-28", [QA] Est Man-day "—", Links / Sub-tasks / Parent "—" (lines 7, 11-14).
5. **Description:** no change. SRD table still ends at row 7 "26.10.2026 (Monday) | v1.1" (line 34).
6. **New comments:** none. "## Comments (0)" (line 36).
7. **New attachments:** none. Still 14; newest is "SRD_EAINT-12406_v1.1_20261026.pdf — 196927 bytes, 2026-10-26T16:06:07.535+0800, by Lim Yi Link" (line 53).
8. **Teams:** no new message. Last capture in `_reference/teams/EAINT-12406-Secarang-Allianz.md` still ends at 2026-10-26 16:08 (Yi Link Lim, "Also, we get greenlight from shamini to proceed this ticket ya.").
9. **New repo material:** `EAINT-12406-related-history.md` (2026-10-27) now sits in this folder. It records host "staging/ia" and that Allianz data "can get from dev/stakeholder later" (Known traps #6 items 3-4). Both already match Open questions #1 and #5 below.
10. **Result:** nothing in this study is made wrong by the recheck. The change flag most likely came from the new capture time, not a Jira edit [unconfirmed].

## Sources read

1. Jira capture `EAINT-12406-jira.md` (2026-10-27 17:17; recaptured 2026-10-27 20:25; **recaptured 2026-11-02 09:26** — fix version, Exp. Deploy Date, QA Est Man-day and Updated changed): fields, description, 0 comments, 14 attachments.
   1. **2026-11-02 recheck also read:** SRD v1.1 text copy (full, unchanged); Teams `EAINT-12406-Secarang-Allianz.md` (no new lines); grep of `knowledge/`, `lib/ticketStudies.ts`, `_reference/teams/`, `_reference/tickets/EAINT-12406/` for "12406"; `knowledge/flow-secarang-insurance.md` lines 14-89 and 789-836; `knowledge/flow-cibo.md` lines 345-361. Older SRD and mock-up text copies were not re-read line by line (same attachments, same sizes as the Jira list).
   2. Also read: `EAINT-12406-related-history.md` (2026-10-27) — past related tickets, reusable scenarios, effort estimate. Read fully.
2. **SRD v1.1, 26.10.2026** — text copy `SRD_EAINT-12406_v1.1_20261026-text.md` (images not kept). Main source for this study. PDF copy present, not opened separately (same version).
3. **SRD v0.2, 30.09.2026** — text copy, read §2.2 to compare open options (REQ-003, 004, 006, 007, 009, 010).
4. SRD v0.1, v0.3, v0.4, v0.5, v1.0 text copies — present; **not read line by line**. Changes between them taken from the v1.1 Revision History (§1.3) and Change Log (Appendix).
5. Mock-ups (text copies):
   1. `Mock Up_EAINT-12406_Secarang_20261015` — latest Secarang mock-up (About Us, FAQs, Support). Read fully.
   2. `Mock Up_EAINT-12406_Secarang_20260929` — first draft. Read fully.
   3. `Mock Up_EAINT-12406_Secarang_20260930` — grepped for Allianz changes only.
   4. `Mock Up_EAINT-12406_CIBO Transaction Management_20261006` — text copy shows only the empty listing (page is built by script). Read the `.html` source lines 160-188 for the insurer data.
   5. `Mock Up_EAINT-12406_CIBO Transaction Management_20260930` — not read (v0.3/v0.4 say "no changes, may refer to v0.2"; 20261006 is the newer one).
   6. **No Home page or Quotation page mock-up** exists in the attachments.
6. Teams: `_reference/teams/EAINT-12406-Secarang-Allianz.md` (2026-09-29 to 2026-10-26); `_reference/teams/eAuto-Secarang-Main-Group.md` line 342 (group created); `_reference/teams/_chat-list.md` line 28.
7. Knowledge: `knowledge/README.md`, `knowledge/flow-secarang-insurance.md`, `knowledge/flow-cibo.md` §4.4 / §4.4a, `knowledge/flow-zurich-takaful.md` §2, `knowledge/teams-decisions-by-ticket.md` line 257, `knowledge/cr-ledger.md` line 1019.
8. `lib/ticketStudies.ts` — **no entry** for EAINT-12406 (rechecked 2026-11-02). `_reference/tickets/EAINT-12406/` — **does not exist** (rechecked 2026-11-02). `_reference/miro-links.txt` and the 2026-10-26 Miro capture — **no EAINT-12406 card**.
9. **Not read:** SA impact brief `https://claude.ai/artifact/FX4YJNpnMjVUakvmAYhwpw` (SRD §1.5 #6) — external link, not downloaded. CCB-992 and ESI-361 (SRD §1.5 #2, #3) — not captured.
   1. **2026-11-02: cannot be captured.** Toolbox `fetch.mjs issue` returned "CCB-992 was not found in Jira (or this login cannot see it)." and the same for ESI-361. The Atlassian connector returned "Issue does not exist or you do not have permission to see it." for both. No copy exists anywhere in the repo. The Jira capture mentions neither.

## What changes

1. **Portal / module:** "Secarang" / "Allianz". `[SRD v1.1 §2.2.1 #2, #3]`
2. **What:** `[SRD v1.1 §2.1.1]` "Enable Allianz back in Secarang production using existing Allianz flow, with updated insurer sequence and Allianz name on Home, About Us, FAQs and Support pages."
3. **Why:** `[SRD v1.1 §2.1.2]` "Offers customers 1 more insurer choice in Secarang, in line with Management direction to grow Serba Sentral."
4. **History:** `[SRD v1.1 §2.2.2 #1 a]` "Allianz quoting was switched off for Secarang in May 2025 and Allianz was removed from Secarang screens in Sept 2025."
5. **Full E2E required:** `[SRD v1.1 §2.1.3 a]` "Existing Allianz journey (quote, add-ons, payment, cover note, callbacks, receipt) is still in production code; full end-to-end test is required as it has not run in production since May 2025."
6. **Finance sign-off:** `[SRD v1.1 §2.1.3 b]` "Finance to sign off Allianz sales and commission shown under agency Serba Sentral in CIBO payment and commission reports."
7. **Affected pages (SRD v1.1 §2.2.3, verbatim):**
   1. Home Page — "Allianz logo between Lonpac and Tokio Marine."
   2. Quotation Page — "Allianz enabled back; insurer sequence; Allianz logo."
   3. About Us > Our partnership — "Allianz name added to partnership wording."
   4. FAQs — "Allianz added to instant quotation insurer list."
   5. Support > Need to contact insurance company? — "New Allianz contact section."
   6. Receipt (Secarang & CIBO) — "Allianz company number shown in new SSM format, same as Tokio Marine."
   7. Transaction Details (CIBO) — "Allianz company registration number shown below insurer name, same as Tokio Marine." (**new in v1.1**)

## Requirements (SRD v1.1)

1. **REQ-001 Home logos:** "Show Allianz logo between Lonpac and Tokio Marine, using existing Allianz logo file." AC: "Logos displayed as Lonpac, Allianz, Tokio Marine."
2. **REQ-002 Enable Allianz:** "Existing Allianz flow and options remain unchanged. No new handling needed." / "Allianz only returns a quotation for individual owners renewing their insurance." AC: "Allianz quotation is displayed." / "Customer can complete purchase using existing Allianz flow."
3. **REQ-003 No Allianz quotation:** "Applies when Allianz has no quotation, e.g. company vehicle or non-renewal." / "Show "Allianz – Quotation unavailable" card, same as Lonpac and Tokio Marine today. Card appears after Tokio Marine." AC: company vehicle and individual non-renewal → "Allianz shown as unavailable"; "Other available insurer quotations are displayed as usual."
4. **REQ-004 Sequence:** "Lonpac > Allianz > Tokio Marine" / "Insurer without available quotation is skipped; the rest keep the same order." AC examples: all 3 → "Lonpac, Allianz, Tokio Marine"; Lonpac not available → "Allianz, Tokio Marine"; Allianz not available → "Lonpac, Tokio Marine (per REQ-003)"; Tokio Marine not available → "Lonpac, Allianz".
5. **REQ-005 Quotation logo:** "Display existing Allianz logo on Allianz quotation, same as before it was disabled."
6. **REQ-006 Product documents:** "Allianz documents on Secarang (policy wording, product disclosure sheet, privacy notice, claim guide) are dated 2022." / "No update required. Enable and use existing documents in system."
7. **REQ-007 Partnership wording (new text):** "Serba Sentral offers Allianz and collaborates with other insurance partners to offer products from Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." AC: "Rest of the page remains unchanged."
8. **REQ-008 FAQ list:** "1. Lonpac Insurance Bhd ⏎ 2. Allianz General Insurance Company (Malaysia) Berhad ⏎ 3. Tokio Marine Insurans (Malaysia) Berhad". AC: "Other FAQ questions remain unchanged."
9. **REQ-009 Support contact section:** between Lonpac and Tokio Marine; "insurer name header with expand / collapse"; "Allianz contact details: 24-Hours Helpline, 1800 22 5542."; sentence below: "You can request 24/7 towing and roadside assistance from Allianz by calling the toll-free Allianz Road Rangers Helpline at 1800-22-5542". AC covers expand and collapse.
10. **REQ-010 Receipt company number:** existing "Allianz General Insurance Company (Malaysia) Berhad (735426-V)"; new "Allianz General Insurance Company (Malaysia) Berhad ⏎ 200601015674 (735426-V)", "same layout as Tokio Marine" ("198601000381 (149520-U)"). AC Example 2: "Receipt for Tokio Marine or Lonpac transaction ⏎ a. No change." Applies to **customer and CIBO user**.
11. **REQ-011 CIBO Transaction Details (v1.1):** "In CIBO > Transaction Management > Transaction Details, display the new company registration number with the old number in brackets below the insurer name, same as Tokio Marine." / "Other insurers (e.g.: RHB, Lonpac, etc.) remain unchanged." AC: "Insurer shows Allianz name, with 200601015674 (735426-V) below it."

## New vs existing behaviour

1. **Existing:** only Lonpac and Tokio Marine on Home logos, About Us, FAQs, Support. `[SRD v1.1 §2.2.2 #1 b]`
2. **New:** Allianz quotes again (individual + renewal only), shown between Lonpac and Tokio Marine everywhere. `[REQ-001..005, 008, 009]`
3. **New:** Allianz "Quotation unavailable" card when no quote (company car, non-renewal), placed **after Tokio Marine**. `[REQ-003]`
4. **Changed:** About Us sentence is **reworded**, not just extended. `[REQ-007]`
5. **Changed:** Allianz receipt + CIBO Transaction Details show new BRN "200601015674 (735426-V)" on its own line. `[REQ-010, REQ-011]`
6. **Unchanged:** the Allianz purchase journey, add-ons, payment, 2022 product documents. `[REQ-002, REQ-006]`

## How the requirement settled (SRD v0.2 → v1.1)

1. **REQ-003:** v0.2 had "Option A" (unavailable card) vs "Option B: Hide Allianz card". v0.5 change log: "Confirmed Option A (unavailable card); removed Option B".
2. **REQ-004:** v0.2 note "Development team to confirm no other enabled insurer (e.g. Chubb) is dropped, as maximum 3 quotations are shown." v0.5 change log: "Removed pending note on other enabled insurers". **No answer recorded** — see Open question 3.
3. **REQ-006:** v0.2 "Requestor to confirm documents are still current, or provide latest version." → v1.1 "No update required."
4. **REQ-007:** v0.2 offered Option A (ticket wording, Allianz in the list) or Option B (previous wording). v1.1 uses the Option B style sentence.
5. **REQ-009:** first mock-up (2026-09-29) had placeholders "Road Assistance Hotline (24 Hours) [HOTLINE NUMBER]" / "Customer Service [CUSTOMER SERVICE NUMBER]". v1.1 has one line "24-Hours Helpline 1800 22 5542" + the Road Rangers sentence.
6. **REQ-010:** v0.2 "new 12-digit SSM company number format ... to be confirmed by requestor" → v0.3 confirmed. `[SRD v1.1 §2.2.1 #5]` "Receipt company number format and Allianz product documents confirmed with Shamini on 1 Oct 2026"
7. **REQ-011:** added in v1.1 (2026-10-26).

## Mock-up details (for expected results)

1. **Secarang mock-up 20261015, About Us:** "Serba Sentral offers Allianz and collaborates with other insurance partners to offer products from Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." (matches REQ-007).
2. **FAQ order (same mock-up):** "Lonpac Insurance Bhd" / "Allianz General Insurance Company (Malaysia) Berhad" / "Tokio Marine Insurans (Malaysia) Berhad".
3. **Support (same mock-up):** Lonpac lines "Road Assistance Hotline (24 Hours) 1300 88 1138", "Customer Service 03 2262 8666", "General Line 03 2262 8688 / 03 2723 7888"; Allianz "24-Hours Helpline 1800 22 5542" + Road Rangers sentence; Tokio Marine "Road Assist Hotline (24 Hours) 1800 88 1301 / 03 2053 5800", "Customer Service Hotline 1800 88 0812". In the mock-up the Allianz section is shown **expanded** ("−"), others collapsed ("+") [unconfirmed whether that is a default or just the mock-up state].
4. **CIBO mock-up 20261006 (`.html` lines 173-176):** Allianz `reg` = "200601015674 (735426-V)" tagged "Changed: new BRN"; Tokio Marine `reg` = "198601000381 (149520-U)"; **Lonpac has no `reg`** (no number shown). Allianz add-on name in sample data: "Allianz Road Rangers".
5. **CIBO mock-up sample rows** use platforms "Secarang" and "Secarang-MK" with Allianz, statuses "Pending payment", "Quotation expired", "Failed" (lines 181-185) [unconfirmed — sample data only].

## Open questions / risks for testing

1. **Test environment — answered 2026-10-27: staging /ia.** `[Faizuddin, dashboard chat, 2026-10-27]` "will host on /ia. the time to deploy will be updated later". ETA for testing 2026-10-28 (Jira cf[10057]); **deploy time to /ia still open**. Jira, SRD v0.1 to v1.1 and the Teams EAINT-12406 chat name no host (rechecked 2026-11-02).
   1. **2026-11-02:** ETA 2026-10-28 has passed but Jira status is still "Ready For Development". Confirm with the developer whether the build is on /ia before starting. **Release is 2026-11-06** (fix version "S35.X-20261106 🌞 (2026-11-06)", Exp. Deploy Date "2026-11-06") — testing window is short.
2. **QA owner blank** in Jira (cf[10041], "—" on 2026-11-02). **[QA] Est Man-day now "5"** (set by 2026-10-28). No Miro card found.
3. **Other insurers in the sequence.** SRD only orders Lonpac, Allianz, Tokio Marine. `knowledge/flow-secarang-insurance.md` §1 #4 lists "Lonpac, Zurich, Tokio Marine, Allianz", the regression default insurer is "Zurich" (§5 #6), and `knowledge/flow-zurich-takaful.md` §2 #4 gives a Secarang order with Zurich and STM before Lonpac (EAINT-8608, not deployed). The v0.2 "maximum 3 quotations" / Chubb note was removed with no recorded answer. **Where Zurich sits when both are on one host is undefined.** [unconfirmed]
4. **REQ-003 vs REQ-004 wording.** REQ-004 says an insurer without a quote is "skipped", but REQ-003 shows an Allianz "Quotation unavailable" card "after Tokio Marine". Confirm on screen: unavailable cards for Lonpac / Tokio Marine also move to the end? (REQ-003 "same as Lonpac and Tokio Marine today" suggests yes [unconfirmed]).
5. **Test data for an Allianz quote.** REQ-002: quotes only "for individual owners renewing their insurance". The made-up /ia plates (HXA0001A… with one IC) are proven for Lonpac only (`flow-secarang-insurance.md` §7 #15 a). Whether Allianz on staging quotes them, and what "renewal" means for test data, is unknown. Likely needs a **real renewal-due vehicle + owner IC** or a dev stub. [unconfirmed]
   1. **2026-10-27: deferred, not blocking.** `[Faizuddin, dashboard chat, 2026-10-27]` "that one we can request the data later". Host is /ia, so the HXA plates + IC 030217141005 can at least be tried there first [unconfirmed whether Allianz quotes them].
6. **Company vehicle case.** Prior 12107 testing: "there are no insurance in secarang that supports company" `[flow-secarang-insurance.md §7 #17 g, from QA team 2026-10-20]`. Company car is the main REQ-003 trigger — expect all cards unavailable or the "no instant quotation" popup instead of cards [unconfirmed].
7. **Full Allianz E2E (SRD §2.1.3 a)** covers "cover note, callbacks" — needs Allianz's own staging/UAT API live behind the Secarang host. Not confirmed anywhere.
8. **Finance / commission reports (SRD §2.1.3 b)** — "CIBO payment and commission reports" are not in §2.2.3 Affected Pages and have no REQ. Confirm whether QA checks Allianz rows in CIBO Payment Report / commission report.
9. **Jira description is outdated vs SRD v1.1:**
   1. Partnership wording in Jira "...including Lonpac Insurance Bhd, Allianz General Insurance Company (Malaysia) Berhad and Tokio Marine Insurans (Malaysia) Berhad." vs REQ-007 new sentence. **SRD wins.**
   2. Jira Support format "(Road Assistance Hotline, Customer Service)" vs REQ-009 "24-Hours Helpline, 1800 22 5542" + sentence. **SRD wins.**
   3. Jira omits Home logos, FAQs, Receipt and CIBO Transaction Details.
10. **Home page and Quotation page have no mock-up.** Logo order expected from REQ-001 / REQ-005 text only.
11. **Receipt layout.** REQ-010 puts the BRN on a new line under the name. Check both the Secarang receipt PDF and the CIBO Receipt button (`flow-cibo.md` §4.4a lists "Certificate of Insurance / Policy Schedule / Receipt").
12. **Allianz product documents dated 2022** are accepted as is (REQ-006). Do not raise the 2022 date as a defect.
13. **Old Allianz transactions** (before May 2025) in CIBO: REQ-011 does not say whether the new BRN line shows on old records too [unconfirmed — likely yes if rendered from insurer master data].
14. **Payment rails since Allianz was last live:** EAINT-12107 added ShopeePay / GrabPay via Fiuu (2026). Allianz has never run with them. Not mentioned in the SRD [unconfirmed whether in scope; SRD §2.1.3 a says "payment"].

## Contradictions with knowledge/

1. `knowledge/flow-secarang-insurance.md` §1 #4 lists Allianz as a current Secarang insurer — **wrong for production**: SRD v1.1 §2.2.2 #1 a says Allianz was "switched off for Secarang in May 2025". It may still exist on staging.
   1. **2026-11-02:** partly resolved. The same file now has § "Update 2026-10-27 from EAINT-12406" #1 (line 794) "Allianz was off Secarang before 12406." §1 #4 itself (line 29) is not reworded, so the two lines still read differently.
2. `knowledge/teams-decisions-by-ticket.md` line 257 says "briefing 2026-10-16 3PM". Teams shows the briefing moved: `[2026-10-19 13:35, Yi Link Lim]` "Sorry all, lets have briefing session today around 3PM ya"; nobody joined (`[2026-10-19 15:07]` "Since no one is joining, lets reschedule it to later session around 4PM"); dev briefing held `[2026-10-22 16:15]` "ok we start here".
3. `knowledge/cr-ledger.md` line 1019 lists EAINT-12406 as "SRD stage only" — outdated (still unchanged 2026-11-02). Now SRD v1.1, requestor green light, Ready For Development, ETA 2026-10-28, **fix version S35.X-20261106, Exp. Deploy Date 2026-11-06**. `knowledge/teams-decisions-by-ticket.md` line 258 heading "(SRD stage only)" is outdated for the same reason.
4. ~~`knowledge/flow-cibo.md` §4.4 / §4.4a has no insurer-name or BRN line on Transaction Details.~~ **Resolved by 2026-11-02:** §4.4a lines 359-361 now read "Insurer line with BRN: Tokio Marine shows "198601000381 (149520-U)" below the insurer name; EAINT-12406 adds Allianz "200601015674 (735426-V)" in the same layout." No contradiction left.

## Suggested test focus

1. **Secarang static pages** (no purchase needed):
   1. Home: logo order Lonpac, Allianz, Tokio Marine (REQ-001).
   2. About Us > Our partnership: exact REQ-007 sentence; rest unchanged.
   3. FAQs > "Which insurers can I get instant quotation from?": 3 names in order; other FAQs unchanged.
   4. Support: Allianz section between Lonpac and Tokio Marine; expand shows "24-Hours Helpline 1800 22 5542" + Road Rangers sentence; collapse hides it.
2. **Quotation page:**
   1. Individual + renewal → Allianz card with logo, order Lonpac > Allianz > Tokio Marine (REQ-002, 004, 005).
   2. Each "not available" example in REQ-004 (Lonpac / Allianz / Tokio Marine missing).
   3. Company vehicle and individual non-renewal → "Allianz – Quotation unavailable" card after Tokio Marine (REQ-003).
3. **Allianz end-to-end purchase** (SRD §2.1.3 a): add-ons, confirmation, payment (FPX at least), success page, receipt PDF, cover note / e-Certificate email, Allianz product documents open (REQ-006).
4. **Receipt** (REQ-010): Allianz name + "200601015674 (735426-V)" on Secarang receipt and CIBO receipt; Lonpac and Tokio Marine receipts unchanged.
5. **CIBO Transaction Details** (REQ-011): Allianz row shows the BRN line; one Lonpac and one non-Secarang (e.g. RHB, eAuto) row unchanged.
6. **CIBO listing / reports** (regression): Allianz transaction appears in Transaction Management, Payment Management, Payment Report with "Secarang" platform [scope per Open question 8].
7. **Negative / regression:** failed and cancelled Allianz payment return to Select Payment Method (existing 12107 behaviour); Lonpac and Tokio Marine purchases unaffected.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-secarang-insurance.md` — full Secarang flow, DOM handles, /ia host, site gate, test cards, traps.
2. `scripts/secarang-insurance` (FPX regression, checker) and `scripts/eauto-12107` (Lonpac / Tokio Marine flows, CIBO page objects incl. `CiboTransactionDetailsPage`). `QuotationPage` reads the insurer from `img[alt]` minus " logo" — usable for the order check [unconfirmed Allianz alt text].
3. Plate / SSM checker `/eauto/secarang-plate-checker` — can test which plates get an Allianz quote without buying.
4. HTML captures: `_reference/html/cibo/transaction-details.html`, `_reference/html/secarang/*` (payment pages only). **No capture** of Secarang Home, About Us, FAQs, Support or Quotation page — save these on first access (AGENTS.md rule).

## Knowledge candidates

**Status 2026-11-02:** candidates 1-5 are **already in knowledge/** (`flow-secarang-insurance.md` lines 789-836, `flow-cibo.md` lines 359-361). Candidate 6 and the new candidate 7 are still open.

1. **Allianz was off Secarang production from May 2025 (quoting) and Sept 2025 (screens).** Source: SRD EAINT-12406 v1.1 §2.2.2 #1 a. Target: `knowledge/flow-secarang-insurance.md` §1 #4.
2. **Allianz only quotes individual owners on renewal; company / non-renewal → "Allianz – Quotation unavailable" card after Tokio Marine.** Source: SRD v1.1 REQ-002, REQ-003. Target: `flow-secarang-insurance.md` §5 #6.
3. **Secarang insurer order after 12406: Lonpac > Allianz > Tokio Marine.** Source: SRD v1.1 REQ-004. Target: `flow-secarang-insurance.md`; cross-ref `flow-zurich-takaful.md` §2 #4.
4. **Insurer BRN strings:** Allianz "200601015674 (735426-V)", Tokio Marine "198601000381 (149520-U)"; Lonpac shows none. Source: SRD v1.1 REQ-010 / REQ-011; CIBO mock-up 20261006 `.html` lines 174-176. Target: `knowledge/flow-cibo.md` §4.4a.
5. **Secarang Support contact numbers** (Lonpac, Allianz, Tokio Marine). Source: Secarang mock-up 20261015 text copy lines 160-178. Target: `flow-secarang-insurance.md` (new "static pages" section).
6. **EAINT-12406 people:** BA Lim Yi Link (from v0.5), dev Mong Guo Hao, requestor Shamini. Source: Teams EAINT-12406 2026-10-06 08:50, 2026-10-22 09:54, 2026-10-26 16:08. Target: `knowledge/teams-decisions-by-ticket.md` line 257 (also fix briefing date) and `knowledge/cr-ledger.md` line 1019 (no longer "SRD stage only").
7. **EAINT-12406 release plan:** fix version "S35.X-20261106 🌞 (2026-11-06)", Exp. Deploy Date "2026-11-06", [QA] Est Man-day "5"; QA field still blank. Source: Jira capture 2026-11-02 09:26 (`EAINT-12406-jira.md` lines 7, 8, 11). Target: `knowledge/cr-ledger.md` line 1019.
