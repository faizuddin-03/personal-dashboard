# EAINT-10108 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD] STMS - Enhance Perakuan Step 1 & Step 3 Wording to Require Customer Email Address"
2. **Jira status:** **Done** (Task). Updated 2026-10-27 10:53 (Jira "Updated: 2026-10-27T10:53:50.573+0800").
3. **Priority:** Medium. **Category:** Enhancement. **Requested by (field, read 2026-10-26):** "🔴eAuto Ops / Support Team".
4. **Fix version:** "S34.16-20261027🌞" (release date 2026-10-27). **Exp. Deploy Date (cf 10087):** 2026-10-27. Labels: 261019-261023, October2026, ProductBacklog.
5. **QA (Jira cf[10041]):** Charmain Ea Chiang. Miro card: "QA: Charmain?".
6. **BA:** Lim Yi Link (Jira assignee and reporter; Miro "BA: Yi Link").
7. **Dev:** Yi Fung Tan (Jira Developer field, read 2026-10-26). Teams: the dev lead took it himself, "i taking it up , will update if further assign" (CR group, 2026-10-20 09:56).
8. **Deployment date:** **27 Oct 2026 (Tue) morning** — Miro column "27TH OCT DEPLOYMENT"; Jira Exp. Deploy Date 2026-10-27.
9. **Test env:** **staging/uat3** — Jira "Code Merge Environment" (read 2026-10-26); Teams CR group 2026-10-22 09:46 (QA): "can use staging/uat3 for this ticket ya". Miro "Test Env:" blank.
10. **ETA for Testing (cf 10057):** 2026-10-22. **QA est. man-day (Jira, read 2026-10-26):** 0.375. **Miro:** "Est. Testing Mandays: 3 hours (1 QA)". **Teams:** "Est. Testing Mandays: 1 day (1 QA)" (CR group, 2026-10-19 15:01, QA).
11. **Created:** 2026-03-13. **Links / sub-tasks / parent:** none.

## Changes since last study (2026-10-27)

1. **Status:** "Ready for Prod Deployment" (2026-10-26 study) → **"Done"** (Jira capture 2026-10-27 11:40; ticket "Updated: 2026-10-27T10:53:50.573+0800").
2. **Fix version:** **no change** — still "S34.16-20261027🌞 (2026-10-27)".
3. **Description:** **no change** — General Information rows 1-6 are word for word the same as quoted in the 2026-10-26 study.
4. **New comments:** **none** — Jira capture "## Comments (0)".
5. **New attachments:** **none** — Jira capture "## Attachments" is empty.
6. **Meaning** [unconfirmed]: Done on the release date points to the 27 Oct morning production deployment having gone out. No Jira comment or Teams message in the repo confirms the deploy itself.
7. **Fixes to the old study (not Jira changes):** the 2026-10-26 study said "No message mentions 10108" in Teams. That was wrong — `EAINT-10108-teams-since-2026-10-16.md` and `_reference/teams/eAuto-QAs.md` carry the CR group chat, QA EOD posts and the QA result. The Teams section and open questions below are corrected.

## Sources read

1. **Jira capture** `EAINT-10108-jira.md` (2026-10-27 11:40): fields, description, 0 comments, no attachments.
2. **Earlier Jira read** `EAINT-10108-jira-comments.md` (2026-10-26, Atlassian MCP): no comments, sub-tasks, links, attachments, remote links or worklog. Fields not in the new capture (Developer, Code Merge Environment, QA man-day, Requested by) are kept from that read.
3. **Miro card** `EAINT-10108-miro-card.md` (from `_miro-board-capture-2026-10-26.md` lines 85-106).
4. **Teams sweep** `EAINT-10108-teams-since-2026-10-16.md` (captured 2026-10-26; CR group, eAuto QAs, eAuto Secarang Main Group, 2026-10-16 to 2026-10-26 10:50).
5. **Teams exports:** `_reference/teams/eAuto-QAs.md` lines 643, 665, 669, 687, 691, 705, 707, 717; `_reference/teams/eAuto-Secarang-Main-Group.md` line 411.
6. **SRD:** **none.** No SRD attached to the ticket. The description points to "documents shared by Ops Team on 13.10.2026 (Tues)" — **not in the repo, not read**.
7. **No .docx, PDF, image or Excel** file exists in the Studying folder. Teams "[image]" attachments (dev screenshot 2026-10-21 10:28, QA evidence 2026-10-23 09:20) were **not captured, not read**.
8. **`_reference/tickets/EAINT-10108/`:** does not exist.
9. **Knowledge:** `knowledge/README.md`, `knowledge/flow-stms.md`, `knowledge/flow-stms-addons.md`, `knowledge/flow-ucd-to-ucd.md`, `knowledge/teams-decisions-by-ticket.md` lines 295-307 and 423-424, `knowledge/cr-ledger.md` line 915, `knowledge/people-and-roles.md` lines 97 and 118.
10. **`lib/ticketStudies.ts`** entry EAINT-10108 (lines 186-219).

## What changes

1. **Portal / module:** UCD › **STMS** — Jira "Affected Portal | UCD", "Affected Module | STMS".
2. **What:** add the word **"pemohon"** to the email line of 4 Perakuan texts:
   1. **Step 1 Perakuan Penjual – Individual (item iii)**
   2. **Step 1 Perakuan Penjual – Company (item iii)**
   3. **Step 3 Perakuan UCD Berdaftar – Individual** ("section Pulangan Balik Hasil Lesen Kenderaan Motor (LKM), item i")
   4. **Step 3 Perakuan UCD Berdaftar – Company** ("section Pulangan Balik Hasil Lesen Kenderaan Motor, item i")
3. **Why (Jira row 3, verbatim):** "to ensure only the customer's email address is entered for LKM Refund applications, so the customer receives refund notifications and updates directly, and UCD does not use their own email address."
4. **Requested by (Jira row 6, verbatim):** "Requested by Mr. Morvin."

## Requirements (Jira description — no SRD)

1. **Existing Step 1 (row 4, verbatim):** "Saya juga bersetuju Butir-Butir Bayaran Balik LKM akan dihantar ke alamat emel <Masukkan Emel> dan sesalinan akan dihantar kepada emel lkmrefund@eauto.my jika saya memilih (√) di petak permohonan Pulangan Balik Hasil LKM;"
2. **New Step 1 Individual (row 5, verbatim):** "Saya juga bersetuju Butir-Butir Bayaran Balik LKM akan dihantar ke alamat emel pemohon <Insert emel pemohon> dan sesalinan akan dihantar kepada emel lkmrefund@eauto.my jika saya memilih (√) di petak Permohonan Pulangan Balik Hasil LKM;"
3. **New Step 1 Company (row 5, verbatim):** "Saya juga bersetuju Butir-Butir Bayaran Balik LKM akan dihantar ke alamat emel pemohon <Insert emel pemohon> dan sesalinan dihantar kepada emel lkmrefund@eauto.my jika saya memilih (√) di petak Permohonan Pulangan Balik Hasil LKM;"
4. **New Step 3 Individual (row 5, verbatim):** "<"Auto populate" nama UCD>(Pembeli) mengesahkan bahawa alamat emel pemohon yang dimasukkan <"auto populate" emel "pemohon"> bagi tujuan permohonan Pulangan Balik Hasil LKM adalah tepat dan sah jika <"Auto populate" nama pemohon>(Penjual) memilih (√) di petak Permohonan Pulangan Balik Hasil LKM;"
5. **New Step 3 Company (row 5, verbatim):** "<"Auto Populate" nama UCD>(Pembeli) mengesahkan bahawa alamat emel pemohon yang dimasukkan <"auto populate" emel "pemohon"> bagi tujuan permohonan Pulangan Balik Hasil LKM adalah tepat dan sah jika <"Auto Populate" nama pemohon> memilih (√) di petak permohonan Pulangan Balik Hasil LKM;"
6. **Jira note (row 5, verbatim):** "Word in bold (pemohon) is the new wording added."
7. **Ops naming rule (row 6, verbatim):** "file name without "(Syarikat)" = Individual; file name with "(Syarikat)" = Company."
8. **Scope narrowed in Teams (CR group, 2026-10-21 14:19, BA, verbatim):** "can ignore them, just ensure to add the "pemohon" word will do" — reply to the dev's screenshot of other differences (2026-10-21 10:28, "need your feedback [image]"). So **only "pemohon" is required**; other differences between Jira text and the screen are out of scope.

## New vs existing behaviour

1. **Existing:** Perakuan says "alamat emel" only. Jira row 4: "Step 1 & Step 3 Perakuan only mention "alamat emel" without stating it must be the pemohon's (customer's) email address."
2. **New:** Perakuan says "alamat emel **pemohon**" in all 4 texts.
3. **Repo knowledge of the current screens:**
   1. Step 1 Perakuan title "PERAKUAN STMS / TH / LKM REFUND - PENJUAL"; text names lkmrefund@eauto.my — `knowledge/flow-stms-addons.md` line 29.
   2. "On preprod1 an extra LKM refund email field (#sellerEmail) shows." — same line.
   3. Step 3 Perakuan "PERAKUAN STMS / TH - UCD BERDAFTAR" — `knowledge/flow-stms.md` line 42.
4. **Knowledge gap:** `knowledge/flow-stms.md` History lists EAINT-9204 as the "[latest]" Perakuan change (line 139). It does not record EAINT-10108. See Knowledge candidates.

## QA scope

1. **Miro (verbatim):** "Testing Scope: (Automation Testing)", "E2E Happy Flow", "Individual", "Company", "Make sure Step 1 and 3 Perakuan, Slip Pengesahan PDF showing correctly".
2. **Executed (eAuto QAs, 2026-10-22 20:10, QA EOD, verbatim):** "Test Scenarios Executed: 5 (Automation Script) E2E Happy Flow: TS1 - TS3 Existing Transactions: TS4 - TS5 Overall CR Testing Progress : 5/5 (100%) - Done".
3. **QA result (CR group, 2026-10-23 09:20, QA, verbatim):** "QA has completed testing for EAINT-10108 on staging/uat3 (eAuto) with no outstanding issues. It's ready for morning deployment on 27 Oct (Tuesday)." Evidence posted for "STMS Individual - MyKad" and "STMS Company" (images not captured).
4. **Evidence (eAuto QAs, 2026-10-26 08:09, QA, verbatim):** "Status : Uploaded test evidence in Sharepoint - Done / Overall CR Testing Progress : Ready for Prod Deployment".
5. **Regression (Secarang Main Group, 2026-10-26 10:20, QA, verbatim):** "27th October Morning Deployment Items + Regression testing on staging/uat3 (eAuto) has been completed with no more pending issues."
6. **Prod regression prep (eAuto QAs, 2026-10-26 08:19, QA, verbatim):** "Status : To prepare Production Regression Checklist".

## Affected regression areas

1. **STMS Individual and Company E2E** (Miro "E2E Happy Flow").
2. **Slip Pengesahan PDF** — holds "company copy, seller copy, Perakuan Penjual, Perakuan Pembeli" (`knowledge/flow-stms.md` line 81).
3. **Existing transactions** — QA ran TS4-TS5 for these. Repo rule: "If Transaction thumbprinted before the Perakuan deploy and resumed after it -> The Slip Pengesahan keeps the Perakuan version it was thumbprinted with." (`knowledge/flow-stms.md` line 43, from EAINT-9204). Whether this held for 10108 is not recorded [unconfirmed].
4. **LKM Refund add-on** — Perakuan text is about the LKM refund email [unconfirmed].
5. **UCD to UCD** has its own Perakuan titles ("PERAKUAN UCD TO UCD - PENJUAL", "PERAKUAN STMS (UCD to UCD) - PEMBELI" — `knowledge/flow-ucd-to-ucd.md` lines 28, 33). Not named in Jira or Miro; likely untouched [unconfirmed].

## Test data / env needs

1. **Env:** staging/uat3 (now Done; production after 27 Oct deploy [unconfirmed]).
2. **Data:** STMS Individual (MyKad) seller and Company seller; a vehicle with LKM refund balance if the email line only matters with LKM Refund [unconfirmed].
3. **Ops source documents of 13.10.2026** — needed to compare full Perakuan text. Not in repo.

## Dependencies / related tickets

1. **EAINT-9204** (2026-01) — introduced Perakuan at Step 1 and Step 3 (`knowledge/flow-stms.md` line 139).
2. **EAINT-12431 / EAINT-12329** — LKM Refund owner email + WhatsApp (`knowledge/flow-stms-addons.md` lines 48-51) [unconfirmed: same "customer email" purpose].
3. **EAINT-12022 / EAINT-104** — LKM Refund add-on.
4. Same release "S34.16-20261027🌞"; next day EAINT-12253 (28 Oct) — `knowledge/teams-decisions-by-ticket.md` line 423.

## Teams decisions (verbatim)

1. `[CR group, 2026-10-19 15:01, QA]` "yup2 the testing estimation is as follows: Est. Testing Mandays: 1 day (1 QA) Base Testing Time: 0.5 day Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day"
2. `[CR group, 2026-10-20 09:56, dev lead]` "i taking it up , will update if further assign"
3. `[CR group, 2026-10-21 10:32, BA]` "Currently we dont have any expected deployment date just yet. Just to check, can we slot this ticket into 28 Oct 2026?"
4. `[CR group, 2026-10-21 14:19, BA]` "can ignore them, just ensure to add the "pemohon" word will do"
5. `[CR group, 2026-10-21 14:49, QA]` "we are targeting to deploy this ticket on 27 Oct (Tuesday) ya i will confirm the staging environment for testing tmr."
6. `[CR group, 2026-10-22 09:46, QA]` "can use staging/uat3 for this ticket ya"
7. `[CR group, 2026-10-22 11:26, dev]` "Fyi, the changes is ready on staging/uat3."
8. `[CR group, 2026-10-22 11:58, dev lead]` "cover the consent pdf , right?" — **no reply captured**.
9. `[CR group, 2026-10-23 09:20, QA]` "QA has completed testing for EAINT-10108 on staging/uat3 (eAuto) with no outstanding issues."
10. `[Secarang Main Group, 2026-10-22 11:47, PM]` "Rescheduled [image] 28.10.2026 (Wed) 27.10.2026 (Tues) - Morning Session".

## Open questions / risks for testing

1. **Production deploy not confirmed in writing.** Jira is Done, but no Teams message in the repo says "deployed to prod" for 10108 (sweep ends 2026-10-26 10:50).
2. **Consent / Slip Pengesahan PDF:** dev asked "cover the consent pdf , right?" (2026-10-22 11:58); no reply captured. Miro scope includes the Slip PDF; Jira does not. Evidence images not in repo, so whether the PDF carries "pemohon" is not verifiable here.
3. **No SRD.** Wording source is "documents shared by Ops Team on 13.10.2026" — not in repo.
4. **Company wording differs from Individual:** Company Step 1 "dan sesalinan dihantar" vs Individual "dan sesalinan akan dihantar"; Company Step 3 has no "(Penjual)". Per BA 2026-10-21 14:19 these differences can be ignored; only "pemohon" is required.
5. **Placeholder** "<Masukkan Emel>" vs "<Insert emel pemohon>" — not settled; covered by the same "can ignore them" reply [unconfirmed].
6. **Other modules:** `_reference/inbox/eauto-flows-run/08-jira-3months.md` line 17 tags it "STMS / eSTM / APT"; Jira names STMS only.
7. **Estimate mismatch (closed, for records):** Miro "3 hours", Jira 0.375 man-day, Teams "1 day". Teams figure was the agreed one.
8. **Resolved since 2026-10-26 study:** "who tested, on which env" — QA Charmain Ea Chiang, staging/uat3, 5/5 pass (see QA scope).

## Suggested test focus

1. **Ticket is Done** — no new CR testing expected for Faizuddin.
2. **If a production regression check is needed** (QA posted "To prepare Production Regression Checklist", 2026-10-26 08:19): open STMS Step 1 and Step 3 for Individual and Company; check "alamat emel pemohon" appears in all 4 Perakuan texts.
3. **Slip Pengesahan PDF** on one new Individual and one Company transaction — check the Perakuan sections carry "pemohon".
4. **One existing (pre-deploy) transaction** — check its Slip keeps the old Perakuan version, per `knowledge/flow-stms.md` line 43 [unconfirmed for 10108].
5. **Reuse:** `_reference/codebases/eauto-qa-azfar/automation/src/flows/stms.flow.ts` and `stms-company.flow.ts` (read-only; copy into repo proper if used). No STMS automation in this repo's `scripts/` (from ls, 2026-10-26).

## Knowledge candidates

1. **`knowledge/cr-ledger.md` line 915:** status "Ready for Prod Deployment" → "Done". Source: Jira capture 2026-10-27 11:40, "**Status:** Done".
2. **`knowledge/flow-stms.md` History:** add "EAINT-10108 (2026-10): "pemohon" added to the email line of Step 1 Perakuan Penjual and Step 3 Perakuan UCD Berdaftar, Individual and Company. [latest]". Source: Jira description row 5; Fix version "S34.16-20261027🌞".
3. **`knowledge/flow-stms-addons.md` line 29:** Step 1 Perakuan LKM email line now reads "alamat emel pemohon". Source: Jira description row 5.
4. **`knowledge/teams-decisions-by-ticket.md` §EAINT-10108:** add evidence uploaded — `[from Teams eAuto QAs, 2026-10-26 08:09, Charmain Ea Chiang]` "Status : Uploaded test evidence in Sharepoint - Done"; and the unanswered dev question `[from Teams EAINT-10108, 2026-10-22 11:58, Tan Yi Fung]` "cover the consent pdf , right?".
5. **`lib/ticketStudies.ts`** EAINT-10108: `studiedAt` → 2026-10-27; `jira.status` → "Done (2026-10-27)". Source: Jira capture 2026-10-27.
