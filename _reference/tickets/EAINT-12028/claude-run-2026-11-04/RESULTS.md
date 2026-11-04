# EAINT-12028: Claude-driven run results (staging uat1)

Plan: `RUN-PLAN.md`. One folder per TS, holding the screenshots and the video. Fails and
blocks in full detail, for Faizuddin to pick what to raise: `FAILS-AND-BLOCKS.md`.

## Progress at a glance (end of 2026-11-04)

**Dashboard:** TS Tracker → EAINT-12028, column "Claude uat1 04-11". It is fed from
`scripts/claude-run/results/EAINT-12028.json`; screenshot `ts-tracker-12028.png`.

```
69 TS   ████████████████████░░░░░░░░ 20 pass · 8 fail · 16 blocked · 20 not started yet · 5 not in this run
```

| Status | Count | TS |
|---|---|---|
| ✅ Pass | 20 | 01, 02, 03, 04, 05, 08, 10, 14, 22, 27, 30, 31, 32, 34, 38, 44, 45, 46, 64, 65 |
| ❌ Fail | 8 | 07, 25, 26, 28, 35, 49 (wording / TS out of date: F3–F8) · **58** (no module Logout, EAINT-12752) · **60** ("Unauthorized" page, F1, possible new bug) |
| ⛔ Blocked | 16 | 09, 47 (no data) · 11, 12, 13 (month-close) · 15 (no Super Admin) · 16–19 (test transactions) · 24, 43 (BA rules) · 29 (`eautonurul` already signed) · 56, 57 (PDF names + Full month) · 61 (timeout) |
| ⏳ Not started yet | 20 | **On hold until Faizuddin's TS36 on 2026-11-05:** 36, 37, 39, 40, 41, 42, 48, 50, 51, 52, 55, 66 · **manual, not yet attempted:** 53, 54, 59, 62, 63, 67, 68, 69 |
| — Not in this run | 5 | 06, 20, 21, 23, 33 (ran on the main laptop 2–3 Nov) |

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
| 12028_TS09 | **blocked (fixture)** | — | Needs a closed month with zero transactions; every closed 2026 month (Jan–Oct) has transactions. | — |
