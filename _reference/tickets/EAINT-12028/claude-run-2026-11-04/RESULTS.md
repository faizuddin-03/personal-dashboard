# EAINT-12028: Claude-driven run results (staging uat1)

Plan: `RUN-PLAN.md`. One folder per TS, holding the screenshots and the video. Fails and
blocks in full detail, for Faizuddin to pick what to raise: `FAILS-AND-BLOCKS.md`.

## Progress at a glance (end of 2026-11-04)

**Dashboard:** TS Tracker → EAINT-12028, column "Claude uat1 04-11". It is fed from
`scripts/claude-run/results/EAINT-12028.json`; screenshot `ts-tracker-12028.png`.

```
69 TS   32 pass · 16 fail · 18 blocked · 1 left for Faizuddin (TS36) · 2 not in this run   (66 of 67 done)
```

| Status | Count | TS |
|---|---|---|
| ✅ Pass | 32 | 01–05, 08, 10, 14, 22, 23, 27, 30, 31, 32, 34, 38, 40, 41, 44, 45, 46, 50, 51, 52, 53, 55, 64, 65, 66, 67, 68, 69 |
| ❌ Fail | 16 | **Wording / TS out of date:** 07, 25, 26, 28, 33, 35, 37, 39, 48, 49 (F3–F8, F10, F12, F14) · **58** (header, EAINT-12752) · **59, 60, 63** (bare "Unauthorized" page, F1, **possible new bug**) · **61** (still signed in after 16 min idle, F9, **possible new bug**) · **54** (PDF address ignores the month, F11, low) |
| ⛔ Blocked | 18 | 09, 21, 47 (no fitting month) · 11, 12, 13 (month-close) · 15 (no Super Admin) · 16–19 (test transactions) · 24, 43 (BA rules) · 29, 42 (no unsigned Reviewer / Approver left) · 56, 57 (PDF names; PDFs saved, F13) · 62 (header, EAINT-12752) |
| ⏳ Faizuddin | 1 | 36 (Approver `kmcheah` first signature, 2026-11-05) |
| — Not in this run | 2 | 06, 20 (ran on the main laptop 2–3 Nov) |

**Month states at the end of the day** (D / R / A):

| Months | State |
|---|---|
| Feb, May, Aug, Sep | **Fully approved**, payment date 05-11-2026 |
| Jan, Jun | DRA / P / P |
| **Mar** | DA / **RA** / P: **ready for Faizuddin's TS36**. SETUP-06: `eautonurul` approved it as Reviewer, 04-11-2026 12:37. |
| Apr, Jul, Oct | DA / P / P |

**TS36 tomorrow:**
1. Log in as `kmcheah` and View **March**.
2. Click [Approve]: the signature pad should appear, because `kmcheah` has never approved.
3. Sign, then pick tomorrow's date.

If a second Reviewer Approved month is needed, have `eautonurul` approve Apr, Jul or Oct first.

Status values (from Azfar's cr-runner):
- pass
- fail
- observed: no documented expected result, so it was captured only
- blocked (environment | fixture | question)
- on hold
- not run

## Month states (survey after the deploy)

Survey 2026-11-04, after the deploy. Logged in as `mfared` (Muhammad Fared). Evidence:
`_survey/` (video, Summary screenshot, Audit Log screenshots).

**Deploy check:** the module still opens in the same tab at
`https://staging.eauto.my/backoffice/admin/association`. Title "Association Payment Listing";
the page title is "eAuto Backoffice". The Details URL is `/backoffice/admin/association/2026/<n>`.
The `#action-panel`, `#tbl-log` and Summary columns are as in the 2026-11-03 rebuild.

| Month | Car tx | Moto tx | Drafter | Reviewer | Approver | Payment Date | Audit Log (newest first) | Used by |
|---|---|---|---|---|---|---|---|---|
| January | 987 | 24 | Approved | Approved | Pending | - | EAUTO NURUL Reviewer Approved (signed) 03-11 17:59; Muhammad Fared Drafter Approved (signed) 03-11 17:33 | |
| February | 404 | 38 | KIV | Pending | Pending | - | (not read) | |
| March | 375 | 6 | Review Again | Pending | Pending | - | Reviewer rejected twice (12028_TS30 automation, 03-11) after two Drafter approvals by Fared | |
| April | 644 | 69 | KIV | Pending | Pending | - | (not read) | |
| May | 238 | 19 | Approved | Approved | Pending | - | EAUTO NURUL Reviewer Approved (signed) 03-11 18:03; EAUTO ZARA Drafter Approved (signed) 03-11 17:55 | |
| June | 185 | 16 | Approved | Pending | Pending | - | (not read) | |
| July | 184 | 6 | Approved | Pending | Pending | - | (not read) | |
| August | 230 | 1 | Approved | Pending | Pending | - | (not read) | |
| September | 451 | 22 | Approved | Approved | Pending | - | 13 rows; includes Chia Ket Ming (Approver) **Rejected** 02-11 18:06, Nur Izni (mfizni) as all three roles, EAUTO NURUL Reviewer Approved (signed) 03-11 18:01 | |
| October | 1,009 | 56 | Pending | Pending | Pending | - | Fared KIV → ZARA Undo KIV → ZARA KIV → ZARA Undo KIV (02-11) | |
| November | - | - | - | - | - | - | not closed yet | |
| December | - | - | - | - | - | - | not closed yet | |

YEAR TO DATE TOTAL: 4,707 car tx / RM 4,707.00; 257 motorcycle tx / RM 514.00.

### What the survey means for the run

1. **Reviewer `eautonurul` has already signed:** "Approved (signed)" on Jan, May and Sep, all on
   03-11. **TS29 (Reviewer first approval with the pad) can no longer be a first signature with
   `eautonurul`.**
2. **Approver `kmcheah` (Chia Ket Ming) has never approved:** only one Reject, on Sep. **TS36
   (Approver first signature) is still possible with `kmcheah`.** Keep off Approver approvals.
3. **There is no fully approved month.** All TS that need one wait for an Approver approval:
   TS39, TS50–TS57 and the Full parts of TS25 / TS33.
4. **No month is untouched:** October is Pending but has KIV and Undo KIV history. TS47
   ("No workflow actions recorded yet") has no month until November is closed, or a month is
   reset by the developer.
5. **Undo KIV returns a month to Pending** (October), and a different Drafter can undo
   (ZARA undid Fared's KIV). So Feb and Apr (KIV) can become Pending months again.
6. **No Reviewer Review Again month exists.** TS35 and TS49 cover only the states that do exist.

## Results

| TS | Status | Month | What was checked / what happened | Evidence |
|---|---|---|---|---|
| 12028_TS01 | **pass** | — | `mfared` (Muhammad Fared): link listed under Reports (count 1); the Summary opens in the same tab at `/backoffice/admin/association` with the heading "Association Payment Listing", `#sel-year` and `#btn-search` | `12028_TS01/` |
| 12028_TS02 | **pass** | — | `eautonurul` (EAUTO NURUL): same checks | `12028_TS02/` |
| 12028_TS03 | **pass** | — | `kmcheah` (Chia Ket Ming): same checks | `12028_TS03/` |
| 12028_TS04 | **pass** | — | `mfizni` (Nur Izni Binti Zurni): same checks | `12028_TS04/` |
| 12028_TS05 | **pass** | — | `onghongkee` (Ong Hong Kee): Reports shows only "Vehicle Movement Report (UCD)" and "Reset Payment Report", link count 0. **EAINT-12716 looks fixed after the 2026-11-04 deploy** (the bug was found with Jason Seah); it can be retested. Jira not touched. | `12028_TS05/` |
| 12028_TS07 | **fail** (1 of 5 points) | Oct (for Payment Date) | Pass: Year filter has only 2026; 12 rows January–December; the columns in TS order plus Action; October (Approver Pending) shows Payment Date "-". **Fail: the total row label reads "YEAR TO DATE TOTAL"; the expected "YEAR TO DATE (Jan – Oct)" comes from mock-up line 600 and is marked [unconfirmed] in the spec.** Needs Faizuddin or the BA to say which wording is right before anything is raised. | `12028_TS07/05-FAIL…png` |
| 12028_TS08 | **pass** | Jan–Oct | Every closed month: Cars (RM) = count × 1.00 and Motorcycles (RM) = count × 2.00 (e.g. Oct 1,009 → 1,009.00; 56 → 112.00). Totals 4,707 / 4,707.00 and 257 / 514.00 equal the sum of the months. | `12028_TS08/` |
| 12028_TS10 | **pass** | June | View → Details "Association Payment Listing — June 2026" (`/2026/6`) with `#tbl-veh`; Details TOTAL 185 / 185.00 / 16 / 32.00 = Summary row; back link reads **"Summary"** (`a#ap-summary`; the TS says "← Back to Summary") → `/backoffice/admin/association?year=2026` with the heading and Year filter | `12028_TS10/` |
| 12028_TS14 | **pass** | October | 16 state rows, JOHOR (01) … WILAYAH PERSEKUTUAN PUTRAJAYA (16), names as live; TOTAL row; every state Cars RM = ×1.00 and Motorcycles RM = ×2.00; TOTAL 1,009 / 1,009.00 and 56 / 112.00 = sum of states. Headers: # / State / Car Transactions / Cars (RM) / Motorcycle Transactions / Motorcycles (RM) | `12028_TS14/` |
| 12028_TS25 | **fail (wording)**, partial | Jun (DA) | Only DA was checked: there is no Reviewer Review Again month and no fully approved month. Pass: on Jun (Drafter Approved) `mfared` sees no [Approve] / [KIV]. **Fail: "You hold DRAFTER … not your turn yet." is not on the page; the note reads "Waiting for the Reviewer."** | `12028_TS25/` |
| 12028_TS28 | **fail (wording)** | Oct (Pending), Feb (KIV), Mar (DRA) | Pass: `eautonurul` sees no [Approve] / [Reject] in all 3 states. **Fail: there is no `#wf-not-your-turn` line and no "Awaiting the next role in the approval sequence."** The notes are: Pending and DRA "Waiting for the Drafter. You can act once the Drafter has approved."; KIV "On hold. The Drafter put this month in KIV on 03-11-2026. Nothing to do until the Drafter resumes it." | `12028_TS28/` |
| 12028_TS35 | **fail (wording)**, partial | Oct, Feb, Jun, Mar | RRA not checked (no such month). Pass: `kmcheah` sees no [Approve] / [Reject] in Pending / KIV / DA / DRA. **Fail: same wording change.** Approver notes: Pending and DRA "Waiting for the Drafter." (shorter than the Reviewer's); KIV as in TS28; DA "Waiting for the Reviewer. You can act once the Reviewer has approved." | `12028_TS35/` |
| 12028_TS49 | **fail (wording)**, partial | Oct, Feb, Jun, Mar, Jan (RA) | RRA not checked (no such month). Pass: no FMC / MMSDA Payment Request buttons in Pending / KIV / DA / DRA / RA. **Fail: the pending note reads "Payment Request documents *become* available for download once …"; the SRD REQ-016 wording is "*will be* available".** Already open with the SA (flow file "Live build captures" #5). Also seen: on Jan (RA) `kmcheah` sees [Reject] [Approve] and "Your turn as Approver. Approve and pick the Finance payment date, or Reject with remarks to return it to the Reviewer." Nothing was clicked. | `12028_TS49/` |
| 12028_TS58 | **fail**, partial | — | Pass: BO Home shows "Muhammad Fared"; the Summary opens straight from the BO hand-off with no second login. **Fail: the module page has no Logout to click.** The only header control is `a#back-to-backoffice` "Back to Backoffice" → `/uat1/home/` (same cause as EAINT-12752). The "module Logout → BO login → Back does not return" steps cannot be done. | `12028_TS58/` |
| 12028_TS60 | **fail** | — | Pass: tab 2 has the Summary open; in tab 1 the BO header Logout ("Sure to logout?" accepted) goes to `/uat1/public/login/`. **Fail: refreshing tab 2 does not show the BO login.** It goes to `https://staging.eauto.my/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING` and shows a bare server page: "**Unauthorized** — This server could not verify that you are authorized to access the document requested. Either you supplied the wrong credentials (e.g., bad password), or your browser doesn't understand how to supply the credentials required." The Summary is no longer reachable, so the session did end, but the user gets an error page, not the login. Possible QA-Issue: Faizuddin to decide. | `12028_TS60/03-tab2-after-refresh.png`, `12028_TS60.webm` + `-tab2.webm` |
| 12028_TS47 | **blocked (fixture)** | — | Needs a month with no workflow actions; October is Pending but has KIV / Undo KIV rows. Possible after November closes (1 Dec) or a developer reset. | — |
| 12028_TS22 | **pass** | **March** (DRA → **DA**) | `mfared`: before, "Review Again · your turn", buttons [KIV] [Approve], note "Returned by the Reviewer (EAUTO NURUL) on 03-11-2026: …". [Approve] → **no signature pad** (Fared has signed before) → Drafter Status "Approved"; Audit Log Drafter-Approved rows 2→3, newest `04-11-2026 11:26 · Muhammad Fared · Drafter · Approved (signed)`. Note after: "Waiting for the Reviewer." | `12028_TS22/` |
| 12028_TS26 | **fail (wording only)**; all actions pass | **October** (Pending → **DA**), June (DA, view) | `eautozara` (EAUTO ZARA): Oct "Pending · your turn", [KIV] [Approve] → [Approve] → no pad (ZARA signed before, on May 03-11) → Drafter "Approved"; new row `04-11-2026 11:27 · EAUTO ZARA · Drafter · Approved (signed)`. June (approved by another Drafter): **no [Approve] / [KIV]** ✔. Fails only on the old not-your-turn wording: the note reads "Waiting for the Reviewer." (see F3). | `12028_TS26/` |
| SETUP-01 | setup (not a TS) | **February** (KIV → **Pending**) | `mfared` [Undo KIV]. Before: note "On hold. You put this month in KIV on 03-11-2026. Undo KIV to bring it back to Pending.", button [Undo KIV] only. After: "Pending · your turn", [KIV] [Approve]; Audit Log row `04-11-2026 11:28 · Muhammad Fared · Drafter · Undo KIV` | `SETUP-01-feb-undo-kiv/` |
| 12028_TS64 | **pass** | **February** (Pending → **DA**) | `mfared`, February open in 2 tabs. Tab 1 [Approve] → no pad → "Approved". Tab 2 (not refreshed) [Approve] → **refused**: the page shows "Someone else already actioned this month. Please refresh and try again." and now shows Drafter Approved, no buttons, no browser alert. Tab 1 refreshed: Drafter "Approved"; Drafter-Approved rows 0 → **1** (exactly one), `04-11-2026 11:28 · Muhammad Fared · Drafter · Approved (signed)` | `12028_TS64/` (+ `-tab2.webm`, `NN-tab2-after-second-approve.png`) |
| SETUP-02 | setup | **April** (KIV → Pending) | `mfared` [Undo KIV]; row `04-11-2026 11:30 · Muhammad Fared · Drafter · Undo KIV` | `SETUP-02-apr-undo-kiv/` |
| 12028_TS44 | **pass** | **April** (Pending → **KIV**) | `mfizni` (Nur Izni Binti Zurni): "Pending · your turn", [KIV] [Approve] → [KIV] (no confirm popup, no alert) → Drafter "KIV"; Drafter-KIV rows 1→2, newest `04-11-2026 11:30 · Nur Izni Binti Zurni · Drafter · KIV`. Note after: "On hold. You put this month in KIV on 04-11-2026. Undo KIV to bring it back to Pending."; button [Undo KIV] | `12028_TS44/` |
| SETUP-03 | setup | **April** (KIV → Pending) | `mfared` [Undo KIV] on mfizni's KIV (note before: "On hold. Nur Izni Binti Zurni put this month in KIV on 04-11-2026. …"), so **a different Drafter can undo** | `SETUP-03-apr-undo-kiv/` |
| 12028_TS27 | **pass** | **April** (Pending → **DA**) | `mfared` [Approve] → **no signature pad within 5 s** → Drafter "Approved"; newest row `04-11-2026 11:31 · Muhammad Fared · Drafter · Approved (signed)` | `12028_TS27/` |
| 12028_TS38 | **pass** | **January** (RA → **RRA**) | `kmcheah` (**Reject only, no signature used**). Reject popup: [Submit Reject] disabled with nothing typed, with blank remarks, and with 5 spaces; enabled once remarks are typed. [Cancel] → statuses unchanged, Approver-Rejected rows 0→0. Then reject with "Claude 12028_TS38 reject 2026-11-04 11:34" → Reviewer "Review Again"; new row `04-11-2026 11:32 · Chia Ket Ming · Approver · Rejected (returned to Reviewer) · (Payment Date blank) · Claude 12028_TS38 reject 2026-11-04 11:34`; Summary January: Reviewer "Review Again", Payment Date "-". *(The When time 11:32 is about 2 min behind this laptop's clock; noted only.)* | `12028_TS38/` |
| 12028_TS46 | **pass** | **September** (RA → **RRA**) | `mfizni` as Approver: before, [Reject] [Approve], note "Your turn as Approver. …". Reject "Claude 12028_TS46 reject 2026-11-04 11:34" → Reviewer "Review Again · your turn" (mfizni is also the Reviewer); Approver-Rejected rows 3→4, newest `04-11-2026 11:33 · Nur Izni Binti Zurni · Approver · Rejected (returned to Reviewer) · · Claude 12028_TS46 reject …` | `12028_TS46/` |
| 12028_TS45 | **pass** | **July** (DA → DRA → **DA**) | `mfizni` as Reviewer: before, [Reject] [Approve], note "Your turn as Reviewer. Approve to send to the Approver, or Reject with remarks to return it to the Drafter." Reject "Claude 12028_TS45 reject 2026-11-04 11:35" → Drafter "Review Again · your turn"; row `04-11-2026 11:33 · Nur Izni Binti Zurni · Reviewer · Rejected (returned to Drafter) · · Claude 12028_TS45 …`. Note then "Returned by the Reviewer (Nur Izni Binti Zurni) on 04-11-2026: \"Claude 12028_TS45 reject …\". Check and approve again.", [KIV] [Approve]. [Approve] as Drafter → no pad → Drafter "Approved"; row `04-11-2026 11:33 · Nur Izni Binti Zurni · Drafter · Approved (signed)` | `12028_TS45/` |
| 12028_TS25 part 2 (RRA) | **fail (wording)** | January (RRA, view) | `mfared`: no [Approve] / [KIV] ✔; note "Waiting for the Reviewer." (old not-your-turn line expected, F5). The Full part is still not run. | `12028_TS25-part2-RRA/` |
| 12028_TS35 part 2 (RRA) | **fail (wording)** | January (RRA, view) | `kmcheah`: no [Approve] / [Reject] ✔; note "Waiting for the Reviewer. You can act once the Reviewer has approved." (F4). TS35 now covers all 5 states. | `12028_TS35-part2-RRA/` |
| 12028_TS49 part 2 (RRA) | **fail (wording)** | January (RRA, view) | `kmcheah`: no FMC / MMSDA buttons ✔; pending note "become available…" (F6). TS49 now covers all 6 states. | `12028_TS49-part2-RRA/` |
| 12028_TS30 | **pass** | **June** (DA → **DRA**) | `eautonurul`: before, [Reject] [Approve], note "Your turn as Reviewer. Approve to send to the Approver, or Reject with remarks to return it to the Drafter." Reject popup: blank → disabled, 5 spaces → disabled, remarks → enabled; [Cancel] → unchanged, no row. Reject "Claude 12028_TS30 reject 2026-11-04 11:38" → Drafter "Review Again"; row `04-11-2026 11:36 · EAUTO NURUL · Reviewer · Rejected (returned to Drafter) · · Claude 12028_TS30 …`; Summary June Drafter Status "Review Again" | `12028_TS30/` |
| 12028_TS32 | **pass** | **January** (RRA → **DRA**) | `eautonurul`: before, note "Returned by the Approver (Chia Ket Ming) on 04-11-2026: \"Claude 12028_TS38 reject …\". Review and approve again, or reject to the Drafter.", [Reject] [Approve]. Reject "Claude 12028_TS32 reject …" → Drafter "Review Again"; row `04-11-2026 11:37 · EAUTO NURUL · Reviewer · Rejected (returned to Drafter) · · Claude 12028_TS32 …` | `12028_TS32/` |
| 12028_TS31 | **pass** | **September** (RRA → **RA**) | `eautonurul`: [Reject] [Approve] both shown (note "Returned by the Approver (Nur Izni Binti Zurni) on 04-11-2026: …"). [Approve] → no pad → Reviewer "Approved"; Reviewer-Approved rows 4→5, newest `04-11-2026 11:37 · EAUTO NURUL · Reviewer · Approved (signed)`. **September = the month for TS41.** | `12028_TS31/` |
| 12028_TS34 | **pass** | **August** (DA → **RA**) | `eautonurul` [Approve] → **no signature pad within 5 s** → Reviewer "Approved"; row `04-11-2026 11:38 · EAUTO NURUL · Reviewer · Approved (signed)` | `12028_TS34/` |
| 12028_TS65 | **pass** | **February** (DA → **RA**) | `eautonurul`, 2 tabs. Tab 1 [Approve] → Reviewer "Approved". Tab 2 (not refreshed) [Approve] → refused: "Someone else already actioned this month. Please refresh and try again.", no alert. Refreshed: Reviewer-Approved rows 0→**1** exactly, `04-11-2026 11:38 · EAUTO NURUL · Reviewer · Approved (signed)` | `12028_TS65/` (+ `-tab2.webm`) |
| 12028_TS23 | **pass** (re-run; it stopped at its precondition on the main laptop 2 Nov) | **January** (DRA → **KIV**) | `mfared`: "Review Again · your turn", [KIV] [Approve] → [KIV] → Drafter "KIV"; new row `04-11-2026 11:55 · Muhammad Fared · Drafter · KIV`. Note after: "On hold. You put this month in KIV on 04-11-2026. Undo KIV to bring it back to **Review Again**." | `12028_TS23/` |
| SETUP-04 | setup | **January** (KIV → **DRA**) | `mfared` [Undo KIV] → back to "Review Again · your turn" (not Pending), with the Reviewer's return note shown again. Row `04-11-2026 11:56 · Muhammad Fared · Drafter · Undo KIV`. **Undo KIV restores the state the month had before the KIV.** | `SETUP-04-jan-undo-kiv/` |
| 12028_TS21 | **blocked (fixture)** | — | Needs a month with all statuses Pending. None is left: every 2026 month has a Drafter action, and Undo KIV restores the earlier state, so a Pending month comes only from November closing or a developer reset. | — |
| 12028_TS67 | **pass** (deviation) | January (DRA, Reviewer Pending) | `eautonurul` (no buttons on the page). **Dev tools:** filled the page's own `#wf-form` with role=REVIEWER, action=APPROVE (version 6, the page's own `_csrf`) and submitted it to `/backoffice/admin/association/2026/1/<id>/action`. The server **refused**, and the page showed "… cannot act until the Drafter has approved." After refresh: Reviewer still "Pending", Reviewer-Approved rows 1→1. *Deviation: the TS asks for an all-Pending month; none exists (see TS21), so the run used January, where the Drafter has not approved.* | `12028_TS67/` |
| 12028_TS68 | **pass** (deviation) | March (DA, Reviewer Pending) | Dev tools as above with role=APPROVER, action=APPROVE, paymentDate=2026-11-05 → **refused**: "… cannot act until the Reviewer has approved." After refresh: Approver "Pending", Approver-Approved rows 0→0; Summary March Payment Date "-". *Deviation: logged in as `mfizni` (holds Approver) instead of `kmcheah`, to protect kmcheah's first signature for TS36.* | `12028_TS68/` |
| 12028_TS59 | **fail** (security part passes) | — | `mfared`. Hand-off captured: `/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING` → 302 → `/backoffice/public/auth/token?r=%2Fadmin%2Fassociation&t=<JWT, ~45 s life>` → 302 → `/backoffice/admin/association`. First use opens the Summary ✔. BO header Logout, then the same token address 11 s after first use (inside its life): **Summary not opened ✔**, but the user lands on `/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING` with the bare "**Unauthorized** — This server could not verify that you are authorized …" page, **not "Token already used"** ✘ (same page as F1). | `12028_TS59/` |
| 12028_TS62 | **blocked by EAINT-12752 (header)** | — | Needs the module's logout address to change its redirect target. The module header shows only "Back to Backoffice", which Faizuddin raised as **EAINT-12752 item 2** ("header itself is incorrect", Faizuddin 2026-11-04). Shane replied 2026-11-03 that it is "expected, not a bug" and gave no reason beyond how to get back; still open between Faizuddin and the developer. Related check under TS63 (b): the hand-off `r=` target is validated. | — |
| EAINT-12752 retest (item 1, favicon) | **pass** | — | Shane 2026-11-03: "favicon: fixed … deployed to uat1, pls retest". BO home `/uat1/images/favicon.ico` and module `/backoffice/common/favicon.ico` are **the same file** (34,494 bytes, identical hash; types image/vnd.microsoft.icon vs image/x-icon). Item 2 (header) is not retestable: still only "Back to Backoffice". Jira not touched. | `EAINT-12752-retest-favicon/` |
| 12028_TS63 | **fail** (outside-site part passes) | — | `mfared`, outside target `https://example.com/`. (a) Logged in, expiry address `…auth-redirect.do?module=association&target=https://example.com/` → stays on eAuto and opens the Summary (target ignored) ✔. (b) Fresh hand-off with `r=https://example.com/` → page "**Invalid redirect target**", stays on eAuto ✔. (c) Logged out (stand-in for an expired session; the timeout is unknown, B9), same expiry address → outside site **not** opened ✔, but the bare "**Unauthorized**" page, **not the BO login** ✘ (F1). | `12028_TS63/` |
| 12028_TS61 | **fail** | March (view only) | `mfared`, Details open, **no click / key / scroll for 16 min** (12:08–12:24). The page's own `#session-cfg` says idle 900 s / warn 120 s / ping 30 s. ✔ At 13 min 30 s `#idle-modal` shows "Still there? Your session is about to expire from inactivity. Stay signed in to keep your work. [Stay signed in]". ✘ At 16 min, refresh → **still signed in**: March Details shown, no login, no error page. The session did not end at the 15 minutes the page warns about. No keep-alive was sent (it is gated on real activity). See F9. | `12028_TS61/` (≈17 min video) |
| **Batch 3** | | | **Full approval through `mfizni`** (Faizuddin: "yes, do that"). `kmcheah` is still unsigned for TS36: it only viewed, downloaded and sent a refused Reject. Approver-action TS ran as `mfizni`. The payment-date value was set directly, because the picker cannot be scripted. | |
| SETUP-05 | setup | **May** (RA → **Full**) | `mfizni` [Approve] as Approver → **no signature pad** (mfizni signed earlier as Drafter / Reviewer, so **signatures look per person, not per role**; relevant to TS43) → date popup → 2026-11-05 → [Confirm Approve]. Row `04-11-2026 12:24 · Nur Izni Binti Zurni · Approver · Approved (signed) · 05-11-2026`. Note: "Fully approved on 04-11-2026. Finance pay date: 05-11-2026. The FMC and MMSDA Payment Request PDFs are ready below." | `SETUP-05-may-full-by-mfizni/` |
| 12028_TS50 | **pass** | May (Full) | `kmcheah`: [FMC Payment Request] and [MMSDA Payment Request] shown; pending note gone. The addresses are `/backoffice/admin/association/2026/5/<id>/pdf?type=FMC` and `…?type=MMSDA` | `12028_TS50/` |
| 12028_TS39 | **fail (wording)** | May (Full) | `kmcheah`: no [Approve] / [Reject] ✔; Summary Payment Date still 05-11-2026 ✔. ✘ The note is not "Fully approved."; it reads "Fully approved on 04-11-2026. Finance pay date: 05-11-2026. The FMC and MMSDA Payment Request PDFs are ready below." (F10) | `12028_TS39/` |
| 12028_TS55 | **pass** | May (Full) | `kmcheah` downloads FMC twice: "Payment Requisition_FMC_May 2026.pdf" both times, **byte-identical** (25,266 bytes, same SHA-256), same text | `12028_TS55/` |
| 12028_TS51 | **pass** | May (Full) | `mfared` downloads "Payment Requisition_FMC_May 2026.pdf" and "Payment Requisition_MMSDA_May 2026.pdf". Page images: `fmc-page-1.png`, `mmsda-page-1.png` | `12028_TS51/` |
| 12028_TS52 | **pass** | May (Full) | `eautonurul` downloads both; text identical to the Drafter's copies | `12028_TS52/` |
| 12028_TS25 part 3 (Full) | **fail (wording)** | May (Full) | `mfared`: no [Approve] / [KIV] ✔; note is the "Fully approved on …" line, not the workbook's "Drafter has already approved this month. Waiting for the Reviewer." (F10) | `12028_TS25-part3-Full/` |
| 12028_TS33 part 2 (Full) | **fail (wording)** | May (Full) | `eautonurul`: no [Approve] / [Reject] ✔; note is the "Fully approved on …" line, not "Reviewer has already approved. Waiting for the Approver." (F10). The RA part already ran on the main laptop 3 Nov. | `12028_TS33-part2-Full/` |
| 12028_TS53 | **pass** | May (Full) | `kmcheah` copies the FMC address and logs out; `onghongkee` opens it → the module answers **"No access to this module"**; no PDF (direct request: 302 to `auth-redirect.do`) | `12028_TS53/` |
| 12028_TS54 | **fail (literal)**, low risk | Jan (not Full) | (a) May's address with the month changed `/2026/5/` → `/2026/1/` (May's id kept) **downloads "Payment Requisition_FMC_May 2026.pdf"** (200, application/pdf): the server ignores the month in the path and serves by id. (b) January's own id `/2026/1/1387d32e…/pdf?type=FMC` → refused (302), no PDF ✔. January's figures did not leak, but the TS's "no PDF downloaded" is not met. (F11) | `12028_TS54/` |
| 12028_TS69 | **pass** (message odd) | May (Full) | `kmcheah`, dev tools: `#wf-form` role=APPROVER, action=REJECT, remarks "Claude 12028_TS69 forced reject" → refused; May still Approver "Approved", both PDF buttons still shown. The page message was "… cannot act until the **Reviewer** has approved.", which is wrong for a month the Reviewer already approved (noted in F11) | `12028_TS69/` |
| 12028_TS37 | **fail (wording)**; all guards hold | February (RA, not approved by this TS) | `mfizni`. [Approve] → no pad → popup "Approve — Finance Payment Date … Only a future date is allowed. Select from the date picker only — typing or pasting is disabled.", `min=2026-11-05`. [Cancel] → Approver Pending, no row, Summary "-" ✔. Blank + [Confirm] → alert "**Please pick a future payment date.**" ✘ (TS: "Please select a payment date."). Today / yesterday: **not selectable** in the picker ✔. Forced in, the page still **POSTs the form** (it has no check of its own) and the **server refuses**: "payment date must be a future date (got 2026-11-04)." / "(got 2026-11-03)." ✔. Typed `06112026` → field empty ✔; Ctrl+V → empty ✔. Approver stays Pending ✔. (F12) | `12028_TS37/`, `12028_TS37-part2-dates/`, `12028_TS37-check-after/` |
| 12028_TS40 | **pass** (as mfizni) | **February** (RA → **Full**) | No signature pad ✔; "Approve — Finance Payment Date" popup shown ✔; approved with 2026-11-05: `04-11-2026 12:34 · Nur Izni Binti Zurni · Approver · Approved (signed) · 05-11-2026` | `12028_TS40/` |
| 12028_TS41 | **pass** (as mfizni) | **September** (RA after reject loop → **Full**) | Approve with tomorrow → Approver "Approved"; FMC + MMSDA buttons shown | `12028_TS41/` |
| 12028_TS66 | **pass** (as mfizni) | **August** (RA → **Full**) | Two tabs: tab 1 approves with 2026-11-05; tab 2 (not refreshed) with 2026-11-06 → refused, "Someone else already actioned this month. Please refresh and try again."; Approver-Approved rows 0 → **1**; Summary Payment Date **05-11-2026** (tab 1's) | `12028_TS66/` (+ `-tab2.webm`) |
| 12028_TS48 | **fail (wording / order)**, corrected 2026-11-04 evening (first marked pass) | September (Full) | `mfared`. ✘ Columns read When / Actor / Role / Action / Payment Date / Remarks; the TS expects Date/Time, Role, Action/Status, Remarks (F14). ✘ The page lists the **newest row first**; the suite (SA mock-up) expects oldest first. *(The first write-up said "oldest first": that was wrong, see `02-audit-log.png`.)* ✔ Every reject row has its remarks; all 15 rows kept, in time order (newest first), containing Drafter Approved → Reviewer Approved → Approver Rejected → Reviewer Approved → Approver Approved; no image in the Audit Log | `12028_TS48/` |
| 12028_TS42 | **blocked** | — | Needs an Approver who has never signed; `mfizni`'s first signature went in SETUP-05 and `kmcheah` is kept for TS36. Run it with `kmcheah` instead of TS36 if Faizuddin wants (it starts with the first signature too). | — |
| 12028_TS56, TS57 | **blocked (input)**; PDFs saved | May (Full) | Need the names that should print on the PDFs. **Seen on the PDFs** (see F13): Requestor / Prepared by EAUTO ZARA 03-11-2026, Checked by EAUTO NURUL 03-11-2026, Approved by Nur Izni Binti Zurni 04-11-2026, with signature images; FMC MYR 238.00 "TWO HUNDRED THIRTY EIGHT ONLY", MMSDA MYR 38.00 "THIRTY EIGHT ONLY"; header "eAuto Sdn **.Bhd.**" | `12028_TS51/` PDFs + page images |
| 12028_TS53, TS54, TS69 | (superseded: run above) | — | Each needs a fully approved month: TS53 / TS54 need its PDF download address, TS69 needs a Reject on it. Possible after Faizuddin's TS36 on 2026-11-05. | — |
| 12028_TS09 | **blocked (fixture)** | — | Needs a closed month with zero transactions; every closed 2026 month (Jan–Oct) has transactions. | — |
