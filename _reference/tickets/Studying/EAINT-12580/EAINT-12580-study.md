# EAINT-12580 — study (2026-10-27)

## 1. Header
1. **Title (Jira, verbatim):** [eAuto - Insurance Cancellation] Copy of IC split saves watermark pieces instead of the IC as Front IC / Back IC
2. **Type:** **Bug** · **Labels:** none
3. **Jira status:** **Done** (updated 2026-10-27 10:54).
4. **Priority:** Medium
5. **QA (cf[10041]):** **Muhammad Amirul Azfar Bin Kamarulazam** · Miro card: "QA: **Azila**" — **conflict**. Teams status posts are by Amirul Azfar (§9).
6. **BA:** Miro "BA:" blank.
7. **Dev / people:** Reporter **Boo Jin Siang**. Jira assignee now **Lim Yi Link** (was Boo Jin Siang on 2026-10-26). Assignee change at Done is likely a hand-back, not a new dev [unconfirmed].
8. **Fix version:** **"S34.16-20261027🌞" (2026-10-27)**.
9. **Exp. Deploy Date (cf 10087):** **2026-10-27** · **ETA for Testing (cf 10057):** 2026-10-23.
10. **Deployment (Miro column):** **TBC** (Miro capture 2026-10-26; superseded by the Jira fix version).
11. **Test env:** Miro: "Test Env: /preprod1". Teams (Amirul Azfar, 2026-10-26 12:25): "12580 got no branch, it affects all branch ya".
12. **Est. mandays (Miro):** "1.5 days (1 QA)" (1 base + 0.5 buffer).
13. **Description "Environment" field (verbatim):** "Production" — the bug was found on production.
14. **Sub-task:** **EAINT-12647** "[eAuto - UCD] STMS Step 5 Insurance Cancellation Pop-up - Copy of IC with the back above the front is split with the sides swapped (MyTentera card)".
15. **Created:** 2026-10-21 20:24.

## Changes since last study (2026-10-27)
Compared with the study of 2026-10-26 and the Jira capture `EAINT-12580-jira.md` (captured 27/10/2026 11:41:45 am).
1. **Status:** "Ready in 1st Env" → **"Done"** (Jira updated 2026-10-27T10:54:04).
2. **Fix version:** none → **"S34.16-20261027🌞 (2026-10-27)"**. Exp. Deploy Date field now "2026-10-27"; ETA for Testing "2026-10-23".
3. **Assignee:** Boo Jin Siang → **Lim Yi Link**. Reporter unchanged (Boo Jin Siang).
4. **New sub-task:** **EAINT-12647** — "Copy of IC with the back above the front is split with the sides swapped (MyTentera card)". A new split defect found during testing [unconfirmed: inferred from it being a sub-task of this bug].
5. **Description:** **no change** to the text quoted in §3 / §5. The "Environment" row ("Production") and "Browser" row ("Not browser-specific (the IC is split after upload)") were in the description before but not recorded in the old study; now added.
6. **Comments:** **none** ("## Comments (0)").
7. **Attachments:** **none** (attachment list empty).
8. **Teams (already in repo, missed by the old study):** deploy plan, branch and prod-regression decisions on 2026-10-26 (§9). The old line "no hit for 12580 in `_reference/teams/`" was wrong and is corrected.

## 2. Sources read
1. Jira capture `EAINT-12580-jira.md` (2026-10-27 11:41): fields, description, **0 comments**, **no attachments**, links (Relates EAINT-12022), sub-task EAINT-12647.
2. Old Jira comments file `EAINT-12580-jira-comments.md` (2026-10-26): "No comments".
3. Miro card: `EAINT-12580-miro-card.md` (capture 2026-10-26).
4. Teams: `EAINT-12580-teams-since-2026-10-16.md` (Teams search "12580", 2026-10-26) and `_reference/teams/eAuto-QAs.md` lines 713, 725-747.
5. Azfar repo study: `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/01-research/study.md` lines 67, 111, 255, 336, 343 (IC front/back split origin) — read 2026-10-26, not re-read.
6. Knowledge: `knowledge/flow-stms-addons.md` (lines 235-255 IC flow; line 322 "EAINT-12580: Watermark case. Referenced, not read."), `knowledge/teams-decisions-by-ticket.md` line 315-317, `knowledge/cr-ledger.md` line 921, `knowledge/people-and-roles.md` lines 89, 121; `lib/ticketStudies.ts` lines 340-365.
7. **SRD: none exists** — Bug ticket. No .docx / PDF / image / Excel in the folder. Jira links an accuracy study artifact: https://claude.ai/artifact/1tdcTq7Sre6bekTmDsZKWw (**not opened**; no browser this task).
8. `_reference/tickets/EAINT-12580/` — does not exist.
9. **EAINT-12647** — only its summary is known (from the 12580 capture); the sub-task itself was **not read**.

## 3. What changes
1. **Portal (verbatim):** "eAuto > STMS > Insurance Cancellation add-on"
2. **Module (verbatim):** "Copy of IC upload and the Front IC / Back IC images saved from it"
3. **Problem (verbatim):** "When a seller uploads a Copy of IC with a watermark across the page (e.g. \"For proton use only\"), the system can save two pieces of the watermark as the Front IC and Back IC instead of the card. The upload is accepted with no error, and these wrong images are sent to the insurance partner."
4. **Cause (verbatim):** "The system cuts the front and back out of the upload by looking for card-shaped areas. Watermark text can look like two cards, and nothing checks that the cut-out pieces are really the IC. The IC check reads the full upload, which is a genuine IC, so it passes."
5. **Expected (verbatim):** "The Front IC shows the full photo side and the Back IC the full back, with nothing cut off. If both sides cannot be found with certainty, the upload is rejected with \"Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy.\" Wrong images are never saved."
6. **Impact (verbatim):** "The partner receives unusable IC images, so the cancellation can be held up while the seller believes the upload succeeded. Staff must find these cases by hand. No amount is charged wrongly."
7. **Additional note (verbatim):** "Testing also showed a card photographed on a table and a sideways photocopy are not found at all. An improved splitting method is being evaluated."
8. **Where the change sits (Teams, Amirul Azfar, 2026-10-26 16:38, verbatim):** "the changes is only on step-5 ai checking for ic".

## 4. New vs existing behaviour
1. **Existing:** watermarked upload accepted; Front IC / Back IC may be watermark crops; sent to partner (Runnerku).
2. **New:** Front / Back must be the real card sides, nothing cut off; otherwise **reject** with the new message.
3. **New error message (verbatim):** "Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy."
4. **Known remaining defect:** EAINT-12647 — back-above-front layout on a **MyTentera** card splits with **sides swapped**.

## 5. QA scope
1. **Miro card (verbatim):** "Testing Scope: (Automation)" — no further lines.
2. **Jira key point (verbatim):** "a successful upload proves nothing - open the saved Front IC and Back IC and check they show the real card."
3. Upload shapes (Azfar study line 255, verbatim): "one image with both sides · front only · front + back in one PDF · rotated / cropped, all through the front / back split API"
4. Add from Jira: **watermarked PDF** (both sides, one page, repeated text watermark), **card photographed on a table**, **sideways photocopy**.
5. Add from EAINT-12647: **back above front** layout, **MyTentera** card — check Front IC / Back IC are not swapped.
6. For each: upload accepted? → open saved Front IC / Back IC → real card, correct side, nothing cut off; or rejected with exact message.
7. **Prod regression:** none planned. Teams (Amirul Azfar, 2026-10-26 16:38): "I think for this one cannot do any prod regression as the changes is only on step-5 ai checking for ic". Senior QA (16:39): "oh i see, okie i will update the scope, thanks ya".

## 6. Affected regression areas
1. Insurance Cancellation pop-up at STMS Step 5 — Copy of IC upload + AI check.
2. Documents sent to Runnerku (frontIc / backIc).
3. **LKM Refund** Copy of IC upload, if it shares the split API [unconfirmed].
4. **EAINT-12585** — reuse/prepopulate documents between LKM Refund and IC (To Do) [related, from Jira search 2026-10-26].
5. **All staging branches** — Teams (2026-10-26 12:25): "it affects all branch ya". The split runs on a shared service, not per branch [unconfirmed].

## 7. Test data / env needs
1. **Env:** Miro "/preprod1"; Teams says "12580 got no branch, it affects all branch ya" — any staging branch shows the fix.
2. IC image set: clean, watermarked ("For proton use only"-style), photographed on table, sideways photocopy, front-only, both sides one image, both sides one PDF, **MyTentera back-above-front**.
3. Where saved Front IC / Back IC can be viewed (BO IC details? document preview? DB?) — **not stated** in Jira.
4. Split API (Teams 08.09, per Azfar study line 111): `http://172.30.202.23:8000/docs` — `POST /v1/split/identity-card`, `GET /v1/split/download/{token}`.

## 8. Dependencies / related
1. **EAINT-12022** — Insurance Cancellation base (linked "Relates"), Done.
2. **EAINT-12647** — sub-task, MyTentera back-above-front split swapped. Status not captured.
3. **EAINT-12585** — reuse documents between LKM Refund and IC (To Do).
4. **EAINT-12626** — separate fix deployed with 12253 on 28.10; same QA. Not linked to 12580.
5. "improved splitting method is being evaluated" — fix approach may change.

## 9. Teams decisions
1. **2026-10-26 09:24, Amirul Azfar (eAuto QAs):** "EAINT-12580 ... Status : / To prepare test data and start testing / Overall CR Testing Progress : TBC".
2. **Deploy date — 2026-10-26 12:11-12:12, eAuto QAs:** Senior QA: "how about 12580 ya?" → Amirul Azfar: "They plan to deploy it tomorrow, currently also testing testing this ticket ya". Matches the fix version date 2026-10-27.
3. **Branch — 2026-10-26 12:24-12:25:** Senior QA: "Azfar, please make sure the changes are deployed to the correct staging branch ya" → Amirul Azfar: "Alright, currently 12626 is on /uat1 and 12580 got no branch, it affects all branch ya".
4. **Prod regression — 2026-10-26 16:37-16:39:** Senior QA: "Hi Amirul Azfar remember to draft the prod regression scope for 12580 ya, i will verify on prod tmr" → Amirul Azfar: "I think for this one cannot do any prod regression as the changes is only on step-5 ai checking for ic" → Senior QA: "oh i see, okie i will update the scope, thanks ya".
5. Background only (from Azfar study line 111, verbatim): "**08.09, Jin Siang (dev): new requirement, not in SRD v1.0.** The user-uploaded IC is **split into front and back images** by an internal API … QA should try several IC upload combinations (G2)." Original Teams message not in local exports.

## 10. Open questions / conflicts
1. **QA owner:** Jira QA = Azfar; Miro QA = Azila. Teams posts show Azfar doing the testing.
2. **Where to view** the saved Front IC / Back IC on staging — not stated; needed for every case.
3. **Accuracy bar:** "with certainty" — what confidence rejects an upload? Accept rate on the 294-image study not quoted in Jira.
4. **Table photo / sideways photocopy:** Jira says "not found at all" — expected result for these (reject with message, or must pass) is not stated.
5. **Does the fix also apply to LKM Refund** Copy of IC? Not stated.
6. **EAINT-12647 open at Done:** parent is Done and deployed 2026-10-27 while the swapped-sides sub-task exists. Status and fix date of 12647 unknown.
7. **Test evidence:** no comment, attachment or TS count in Jira; Teams progress last reported "TBC" (2026-10-26 09:24).

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-stms-addons.md` §Insurance Cancellation (line 245: pop-up fields, 5MB, PDF/PNG/JPG/JPEG; "[Next] runs the AI check (3 messages)").
2. Azfar repo `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/` — study.md (G2, Q14), SRD v1.2, `Required Document based on Insurer_v1.1_20260721.xlsx`.
3. Azfar repo upload assets: `_reference/codebases/eauto-qa-azfar/automation/assets/uploads/`.

## 12. Where this ticket contradicts repo knowledge
1. `knowledge/cr-ledger.md` line 921: "Ready in 1st Env | none | TBC" — now **Done**, fix version **S34.16-20261027**, deploy **2026-10-27**.
2. `knowledge/people-and-roles.md` line 121: "EAINT-12580 and EAINT-12589: Boo Jin Siang is reporter and assignee in Jira." — assignee is now **Lim Yi Link**.
3. `knowledge/flow-stms-addons.md` line 322: "EAINT-12580: Watermark case. Referenced, not read." — now studied; adds a new reject message and a "real card" check after upload.
4. `knowledge/teams-decisions-by-ticket.md` lines 315-317: has only the 09:24 status post; misses the 12:12, 12:25 and 16:38 decisions.
5. `lib/ticketStudies.ts` line 348: status "Ready in 1st Env (2026-10-26)" and line 361 "Deploy TBC" — now stale.

## Knowledge candidates
1. **flow-stms-addons.md (IC pop-up step):** new reject message for Copy of IC — "Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy." Source: [jira: EAINT-12580 description, Expected result, 2026-10-27].
2. **flow-stms-addons.md (traps):** "a successful upload proves nothing - open the saved Front IC and Back IC and check they show the real card." Source: [jira: EAINT-12580 description, Reference for QA].
3. **flow-stms-addons.md (traps):** IC split is not tied to a staging branch — "12580 got no branch, it affects all branch ya". Source: [from Teams eAuto QAs, 2026-10-26 12:25, Amirul Azfar].
4. **flow-stms-addons.md (known issues):** MyTentera card with back above front splits with sides swapped. Source: [jira: EAINT-12647 summary, as sub-task of EAINT-12580, 2026-10-27].
5. **production-regression-scope / releases:** EAINT-12580 shipped in S34.16-20261027 with no prod regression — "cannot do any prod regression as the changes is only on step-5 ai checking for ic". Source: [from Teams eAuto QAs, 2026-10-26 16:38, Amirul Azfar].
6. **cr-ledger.md / people-and-roles.md / teams-decisions-by-ticket.md:** update per §12.
