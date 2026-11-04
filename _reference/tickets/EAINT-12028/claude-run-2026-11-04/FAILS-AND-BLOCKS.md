# EAINT-12028: fails and blocks, for Faizuddin to review

Run: Claude-driven, staging **uat1**, 2026-11-04, after the morning deploy. Second laptop.
Faizuddin, 2026-11-04: "keep super detailed tracked of the fail and block. i will review and
tell you which on to raise". **Nothing is raised in Jira until he picks.**

> **WORDING RULE, decided 2026-11-04 evening (Faizuddin):** "for the wordings, follow the mockup. log
> this as fail, but dont raise ticket yet".
>
> - The SRD sets the rules but almost never the exact words. The words come from the SA mock-up
>   (`_reference/tickets/Studying/EAINT-12028/association-payment-listing-mockup_20260731.html`).
> - Every message, note and label is now expected **as the mock-up words it**. Where the live build
>   differs, that is a **fail**, logged here and **not raised yet**.
> - Where an entry below quotes another expected wording (the 2 Nov capture "You hold … not your turn
>   yet"), the mock-up wording in this table replaces it:
>
> | Entry | TS | Mock-up wording (expected) | Mock-up line | Live build |
> |---|---|---|---|---|
> | F3, F8 | TS28 | Reviewer on Pending / KIV / DRA: "Waiting for the Drafter to approve first." | 480 | "Waiting for the Drafter. You can act once the Drafter has approved." / KIV "On hold. …" |
> | F4 | TS35 | Approver on Pending / KIV / DA / DRA / RRA: "Waiting for the Reviewer to approve first." | 487 | "Waiting for the Drafter." / "Waiting for the Reviewer. You can act once …" / KIV "On hold. …" |
> | F5, F8 | TS25, TS26 | Drafter on DA / RRA / Full: "Drafter has already approved this month. Waiting for the Reviewer." | 474 | "Waiting for the Reviewer." (Full: "Fully approved on …") |
> | F10 | TS33 | Reviewer on RA / Full: "Reviewer has already approved. Waiting for the Approver." | 481 | (RA not seen) / Full: "Fully approved on …" |
> | F10 | TS39 | Approver on Full: "Fully approved." | 488 | "Fully approved on 04-11-2026. Finance pay date: … PDFs are ready below." |
> | F6 | TS49 | "Payment Request documents will be available for download once …" (the SRD says the same) | 516 | "… become available …" |
> | F7 | TS07 | "YEAR TO DATE (Jan–<last month>)" | 600 | "YEAR TO DATE TOTAL" |
> | F12 | TS37 | Blank: "Please select a payment date." · past/today: "Payment date must be a future date." | 541 | "Please pick a future payment date." · server "payment date must be a future date (got …)." |
> | F14 | TS48 | Columns "# · Date / Time · Role · Action / Status · Remarks"; rows oldest first | 546-548 | "When · Actor · Role · Action · Payment Date · Remarks"; newest first |
> | F15 | TS30, TS38 | Blank / spaces remarks: "Remarks are required to reject." | 538 | No message; [Submit Reject] stays disabled |
> | F16 | TS30, TS32, TS38, TS46 | Log Action "Rejected — returned to Drafter" / "… Reviewer" | 522, 524 | "Rejected (returned to Drafter)" / "… Reviewer)" |
> | — | TS47 | Empty log: "No activity yet." | 547 | (not seen: no empty month) |
>
> - **Note on F16:** the TS workbook (TS30 / TS32 / TS38 / TS46) and SRD REQ-015 say "Rejected
>   (returned to Drafter)", which matches the live build. Under the mock-up rule it is logged as a
>   fail. Faizuddin can overrule this one.
> - **Not wording, so not changed:** the mock-up and the TS show the buttons **disabled**, while the
>   live build **hides** them. The automation still expects "not on the page" `[open]`.
> - The automation (`scripts/eauto-12028`) expects the mock-up wording from 2026-11-04 evening.

Every entry gives:
- the TS
- the step
- the expected result and its source
- the exact actual result
- the URL, user and month
- the evidence
- **Claude's classification**, one of:
  - *Possible defect*: the build differs from the SRD / mock-up / an agreed rule
  - *TS out of date*: the build changed, and the TS wording or expected result may need updating
  - *Already raised*: covered by an existing Jira
  - *Blocked*: could not run, and why
- what would unblock it or what to decide

Evidence paths are relative to this folder. Each `<TS>/<TS>.webm` is the full highlighted
recording; red-outlined screenshots (`NN-FAIL*.png` or the named step) show the failing point.

Status column: **open** = waiting for Faizuddin · raise / don't raise / update TS = his decision.

---

## Index

| # | TS | Kind | Short | Decision |
|---|---|---|---|---|
| F1 | 12028_TS60 | Possible defect | Core logout → refresh module tab gives a bare "Unauthorized" page, not the BO login | open |
| F2 | 12028_TS58 | Already raised (EAINT-12752) / blocked part | Module page has no Logout; the logout + Back steps can't be done | open |
| F3 | 12028_TS28 | TS out of date | Not-your-turn line and note replaced by role-specific notes (Reviewer) | open |
| F4 | 12028_TS35 | TS out of date | Same, for the Approver | open |
| F5 | 12028_TS25 | TS out of date + blocked part | Same, for the Drafter; RRA and Full parts not run | open |
| F6 | 12028_TS49 | TS out of date / SA question | PDF pending note "become available" vs SRD "will be available"; RRA part not run | open |
| F7 | 12028_TS07 | TS out of date / BA question | Total row label "YEAR TO DATE TOTAL" vs mock-up "YEAR TO DATE (Jan – Oct)" | open |
| F8 | 12028_TS26 | TS out of date (same as F3) | All actions pass; only the June not-your-turn wording fails ("Waiting for the Reviewer.") | open |
| F1 also covers | 12028_TS59, TS63 (c) | Possible defect (same cause) | Used hand-off / logged-out expiry address → bare "Unauthorized" page instead of "Token already used" / BO login; the security part passes | open |
| B12 | 12028_TS21 | Blocked | No all-Pending month left (Undo KIV restores the earlier state) | open |
| B13 | 12028_TS62 | Blocked by EAINT-12752 item 2 (header) | The module header has no Logout; Shane says it is "expected", Faizuddin says the header is incorrect | open |
| Retest | EAINT-12752 item 1 | Pass | Favicon now the same eAuto icon (identical file) | ready to comment DONE on item 1 if Faizuddin wants |
| B14 | 12028_TS53, TS54, TS69 | Blocked | Need a fully approved month (after TS36) | open |
| F10 | TS39, TS25 / TS33 Full parts | TS out of date | One "Fully approved on … Finance pay date … PDFs are ready below." note for every role | open |
| F11 | TS54 (+ TS69 message) | Fail as written, low risk | PDF address ignores the month in the path (serves by id); TS69 refusal message names the Reviewer | open |
| F12 | TS37 | Wording + observation | Blank alert "Please pick a future payment date."; the page posts past dates and only the server refuses | open |
| F15 | TS30, TS38 | Fail (wording), not raised | No "Remarks are required to reject." message on blank / spaces remarks; [Submit Reject] is only disabled | log only |
| F16 | TS30, TS32, TS38, TS46 | Fail (wording), not raised | Log Action "Rejected (returned to …)" vs mock-up "Rejected — returned to …" (TS workbook and SRD match the build) | log only |
| F14 | TS48 | TS out of date / decision | Audit Log column names (When, Action vs Date/Time, Action/Status) and row order (newest first vs oldest first); first marked pass by mistake | open |
| F13 | TS56 / TS57 PDFs | Check | Header ".Bhd." typo copied from the mock-up; FMC "(PPM-…)" printed on the Address row | open |
| B15 | TS42 | Blocked | No unsigned Approver left except `kmcheah` (kept for TS36) | open |
| F9 | 12028_TS61 | Possible defect | Warning shows at 13 min, but still signed in after 16 min idle (page says 15 min) | open |
| Note | 12028_TS67, TS68 | Pass with deviation | TS67 on a DRA month (no Pending month); TS68 as `mfizni`, not `kmcheah` | for info |
| B1 | 12028_TS09 | Blocked | No closed month with zero transactions | open |
| B2 | 12028_TS47 | Blocked | No month without workflow actions | open |
| B3 | TS11–TS13 | Blocked | Month-close cron: wait time and a closable month needed | open |
| B4 | TS15 | Blocked | No Super Admin login | open |
| B5 | TS16–TS19 | Blocked | Known test transactions and expected counts needed | open |
| B6 | TS24 | Blocked | BA's final KIV rule needed | open |
| B7 | TS43 | Blocked | BA's signature rule needed | open |
| B8 | TS56, TS57 | Blocked | Full names for the PDFs needed (and a fully approved month) | open |
| B9 | TS61 | Blocked | Session timeout from the developer | open |
| B10 | TS29 | Blocked (cannot be "first") | `eautonurul` already signed on 03-11; Faizuddin to run it with another way / user | open |
| B11 | TS36 + all Full-month TS | On hold | Faizuddin runs TS36 (Approver first signature) on 2026-11-05 | open |

---

## F1 · 12028_TS60: core logout, then refresh the module tab → bare "Unauthorized" page

- **Classification:** Possible defect (wrong page shown). It is not a security hole: the module
  is no longer reachable.
- **User / env:** `mfared` (Muhammad Fared), staging uat1. **Month:** n/a.
- **Steps:**
  1. Log in to BO uat1 as mfared (tab 1).
  2. Open a second tab → BO Home → Reports → Association Payment Listing → the Summary opens at
     `https://staging.eauto.my/backoffice/admin/association`.
  3. Tab 1: BO Home → header **Logout** → browser confirm "Sure to logout?" → OK → tab 1 is at
     `https://staging.eauto.my/uat1/public/login/`. ✔
  4. Tab 2: refresh.
- **Expected** (TS60, spec `tests/m-session.spec.ts` "Check the tab shows the BO login, not the
  Summary"): the tab shows the **BO login page**; the Summary is not shown.
- **Actual:** the Summary is not shown ✔, but the tab ends at
  `https://staging.eauto.my/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING`
  and shows a bare server page:
  > **Unauthorized**
  > This server could not verify that you are authorized to access the document requested. Either you supplied the wrong credentials (e.g., bad password), or your browser doesn't understand how to supply the credentials required.

  There is no link back to the login and no eAuto header. The user is stuck on an error page.
- **Evidence:**
  - `12028_TS60/03-tab2-after-refresh.png` (red outline)
  - `12028_TS60/02-tab1-logged-out.png`
  - `12028_TS60/01-tab2-summary.png`
  - Videos: `12028_TS60/12028_TS60.webm` (tab 1) and `12028_TS60-tab2.webm` (tab 2)
- **Same "Unauthorized" page seen in two more TS (one cause, three symptoms):**
  - **TS59:** a used hand-off address, opened after logout, does not open the Summary ✔. But
    instead of "Token already used" the user gets this "Unauthorized" page, at
    `/uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING`
    (`12028_TS59/`).
  - **TS63 (c):** the expiry address, logged out, with `target=https://example.com/` →
    outside site not opened ✔, but the "Unauthorized" page instead of the BO login
    (`12028_TS63/`).
  - **Likely cause:** whenever the BO session is gone, `auth-redirect.do` answers with a bare
    401 page instead of sending the user to `/uat1/public/login/`.
  - TS61 (session expiry should return to the BO login "without an error page") will very
    likely show the same thing.
- **To decide:** raise as a QA-Issue (suggested Medium, under EAINT-12028, developer Shane), or
  not.

## F2 · 12028_TS58: module page has no Logout

- **Classification:** Already raised: EAINT-12752 (header shows only "Back to Backoffice").
  Part of the TS is blocked by it.
- **User / env:** `mfared`, uat1.
- **Passed:**
  - BO Home shows "Muhammad Fared".
  - BO → Reports → Association Payment Listing opens the Summary
    (`/backoffice/admin/association`) **with no second login page** (no username field).
- **Expected** (TS58 steps 3–5, spec "Click Logout on the Association Payment Listing page"):
  1. A Logout on the module page logs out to the BO login.
  2. The browser Back button then shows the BO login, not the Summary.
- **Actual:**
  - The module page has **no Logout control**. The only header control is
    `<a id="back-to-backoffice" href="https://staging.eauto.my/uat1/home/">Back to Backoffice</a>`.
  - No `#logout-form`, no `#btn-logout`, and no link or button with "Logout".
  - The steps can't be done.
- **Evidence:** `12028_TS58/` (`03-…no-module-logout` red, `02-summary-no-second-login`), video
  `12028_TS58.webm`.
- **Jira check (2026-11-04).** EAINT-12752 (Low, Shane, "Ready in 1st Env") item 2 asks for
  the header to match other BO pages (Home, Menu, user's name, My Account, Logout).
  - **Shane's only comment** (2026-11-03 17:39), quoted in full for the header part:
    > "header: this is expected, not a bug. backoffice pages only show "back to backoffice", the name / my account / logout are removed on purpose. user go back to eauto using back to backoffice, and logout from eauto also end the backoffice session"
  - **No reason is given:** no SRD or mock-up reference, and no word on who decided or why.
    He only says how to get back and log out.
  - **Faizuddin, 2026-11-04:** "its not about logout, but its about the header, because the
    header itself is incorrect". So TS58's module-logout steps and TS62 stay blocked by
    12752 item 2 until he and the developer / BA settle the header.
  - **Gap in the workaround:** after "logout from eAuto", the module tab shows the bare
    "Unauthorized" page (F1), not the login.
- **Item 1 (favicon) retested 2026-11-04: pass.** Both pages serve the same eAuto icon file
  (evidence `EAINT-12752-retest-favicon/`).
- **To decide:** reply to Shane on item 2 with the source for the expected header, or accept
  it and update TS58 / TS62.

## F3 · 12028_TS28: Reviewer not-your-turn: wording changed

- **Classification:** TS out of date (the build was rebuilt on 2026-11-03).
- **User / env:** `eautonurul` (EAUTO NURUL), uat1.
- **Months used:** Oct (Pending), Feb (KIV), Mar (Drafter Review Again).
- **Passed:** in all 3 states `#action-panel` has **no [Approve] / [Reject]** (no buttons at all).
- **Expected** (spec `utils/checks.ts` `expectNotYourTurn`, from the 2026-11-02 live capture):
  - `#wf-not-your-turn` reads "You hold REVIEWER for this module, but it is not your turn yet."
  - The note reads "Awaiting the next role in the approval sequence."
- **Actual:** there is no `#wf-not-your-turn` element. `#ap-note .ap-note-text` reads:

  | Month | State | Note shown |
  |---|---|---|
  | Oct | Pending | "Waiting for the Drafter. You can act once the Drafter has approved." |
  | Feb | KIV | "On hold. The Drafter put this month in KIV on 03-11-2026. Nothing to do until the Drafter resumes it." |
  | Mar | Drafter Review Again | "Waiting for the Drafter. You can act once the Drafter has approved." |

- **Evidence:** `12028_TS28/` (`NN-<state>-not-your-turn` red), video.
- **Same failure as:** the 3 Nov TS33 run (main laptop findings `EAINT-12028-12028_TS33-findings-2026-11-03`).
- **To decide:** update the TS expected results to the new notes, or ask the SA/BA whether the
  old wording was required.

## F4 · 12028_TS35: Approver not-your-turn: wording changed

- **Classification:** TS out of date.
- **User / env:** `kmcheah` (Chia Ket Ming), uat1. **Viewed only, nothing clicked.**
- **Months used:** Oct (Pending), Feb (KIV), Jun (Drafter Approved), Mar (Drafter Review Again).
  **Reviewer Review Again was not checked:** no month is in that state. It becomes possible after
  TS38 (Batch 2).
- **Passed:** no [Approve] / [Reject] in any of the 4 states.
- **Expected:** as F3, with "You hold APPROVER …".
- **Actual notes:**

  | Month | State | Note shown |
  |---|---|---|
  | Oct | Pending | "Waiting for the Drafter." |
  | Mar | DRA | "Waiting for the Drafter." |
  | Feb | KIV | "On hold. The Drafter put this month in KIV on 03-11-2026. Nothing to do until the Drafter resumes it." |
  | Jun | DA | "Waiting for the Reviewer. You can act once the Reviewer has approved." |

  The Approver's Pending / DRA note is **shorter** than the Reviewer's: no "You can act once…".
  This may be on purpose, since the Approver can't act after the Drafter alone either.
- **Evidence:** `12028_TS35/`, video.
- **To decide:** as F3.
- **RRA part, done later the same day** (`12028_TS35-part2-RRA/`, January after TS38):
  - no [Approve] / [Reject] ✔
  - note "Waiting for the Reviewer. You can act once the Reviewer has approved."
  - TS35 now covers all 5 states; every button check passes and every wording check fails.

## F5 · 12028_TS25: Drafter buttons after the Drafter step: wording; partial

- **Classification:** TS out of date, and blocked in part.
- **User / env:** `mfared`, uat1. **Month:** Jun (Drafter Approved).
- **Passed:** no [Approve] / [KIV] on Jun.
- **Expected:** "You hold DRAFTER for this module, but it is not your turn yet." and "Awaiting
  the next role in the approval sequence."
- **Actual:** note "Waiting for the Reviewer." There is no not-your-turn line.
- **RRA part, done later the same day** (`12028_TS25-part2-RRA/`, January after TS38): no
  [Approve] / [KIV] ✔; note "Waiting for the Reviewer." ✘ (wording).
- **Still not run:** the fully approved part and the Summary "Drafter Status Approved" on that
  month. There is no fully approved month until an Approver approves, after TS36 on 2026-11-05.
- **Evidence:** `12028_TS25/`, video.

## F6 · 12028_TS49: PDF pending note wording; partial

- **Classification:** TS out of date / SA question. Already noted as open with the SA in
  `knowledge/flow-association-payment-listing.md` ("Live build captures" #5).
- **User / env:** `kmcheah`, uat1. **Viewed only.**
- **Months used:** Oct (Pending), Feb (KIV), Jun (DA), Mar (DRA), Jan (Reviewer Approved). RRA
  was not checked (no such month yet).
- **Passed:** `#pdf-bar` has **no FMC / MMSDA Payment Request** buttons in any of the 5 states.
- **Expected** (SRD v1.1 REQ-016 Example 2, `data/expected.ts` PENDING_NOTE): "Payment Request
  documents **will be available** for download once the Drafter, Reviewer and Approver have
  all approved."
- **Actual (all 5 states):** "Payment Request documents **become available** for download once
  the Drafter, Reviewer and Approver have all approved."
- **Also seen:** on Jan (Reviewer Approved) `kmcheah` sees [Reject] [Approve] and the note "Your
  turn as Approver. Approve and pick the Finance payment date, or Reject with remarks to return
  it to the Reviewer." Nothing was clicked.
- **Evidence:** `12028_TS49/` (`NN-<state>-pending-note` red), video.
- **RRA part, done later** (`12028_TS49-part2-RRA/`, January): no download buttons ✔; same note ✘.
  TS49 now covers all 6 non-final states.
- **To decide:** SA answer on "become" vs "will be".

## F7 · 12028_TS07: Summary total row label

- **Classification:** TS out of date / BA question. The spec marks this point `[unconfirmed]`.
- **User / env:** `mfared`, uat1.
- **Passed (4 of 5):**
  - The Year filter has only 2026.
  - 12 rows, January–December.
  - Columns `# | Month | Car Transactions | Cars (RM) | Motorcycle Transactions | Motorcycles (RM) | Drafter Status | Reviewer Status | Approver Status | Payment Date | Action`.
  - October (Approver Pending) has Payment Date "-".
- **Expected** (mock-up line 600, spec `b-summary.spec.ts`): the total row label is
  "YEAR TO DATE (Jan – Oct)", with the range ending at the last closed month.
- **Actual:** "YEAR TO DATE TOTAL". The same label was already in the 2026-11-02 capture.
- **Evidence:** `12028_TS07/` (the `total-label` red screenshot), video.
- **To decide:** which wording the BA wants.

## F8 · 12028_TS26: second Drafter: all actions pass, wording fails

- **Classification:** TS out of date (same cause as F3).
- **User / env:** `eautozara` (EAUTO ZARA), uat1.
- **Months:**
  - **October**: Pending → Drafter Approved by this TS. Before: "Pending · your turn",
    [KIV] [Approve].
  - **June**: already Drafter Approved by `mfared`.
- **Passed:**
  - October [Approve] → no signature pad (ZARA signed before, on May 03-11) → Drafter
    "Approved".
  - One new row: `04-11-2026 11:27 · EAUTO ZARA · Drafter · Approved (signed)`.
  - June: **no [Approve] / [KIV]** for the second Drafter.
- **Expected but not on the page:** on June, "You hold DRAFTER for this module, but it is not
  your turn yet." and "Awaiting the next role in the approval sequence."
- **Actual:** note "Waiting for the Reviewer."
- **Evidence:** `12028_TS26/` (`NN-june-note` red), video.

---

## F9 · 12028_TS61: the session does not expire at the 15 minutes the page warns about

- **Classification:** Possible defect, or a TS / config question.
- **User / env:** `mfared`, uat1. Month: March Details (view only).
- **Config on the page:** `#session-cfg` `data-idle="900"`, `data-warn="120"`,
  `data-ping="30"`.
- **The keep-alive** (`GET /backoffice/admin/association/keepalive`) is sent only after a
  click, keydown or scroll; none happened.
- **Steps:**
  1. Log in.
  2. Reports → Association Payment Listing → View March.
  3. No mouse, keys or scroll for 16 minutes (2026-11-04 12:08–12:24 MYT).
  4. Refresh.
- **Expected** (TS61, spec `m-session.spec.ts`): after the timeout the user returns to the BO
  login, without an error page.
- **Actual:**
  - At **13 min 30 s** `#idle-modal` shows "Still there? Your session is about to expire
    from inactivity. Stay signed in to keep your work. [Stay signed in]" ✔.
  - At **16 min**, refresh → **still signed in**: "Association Payment Listing — March
    2026", the state table, no login, no error page ✘.
- **Possible reasons, for the developer:**
  - The server session timeout is longer than the 900 s the page shows.
  - Or only the page's warning uses 900 s.
- **Not tried:** waiting longer to find the real server timeout.
- **Evidence:**
  - `12028_TS61/` (`NN-idle-warning`, `NN-after-16-min-before-refresh`, `NN-after-refresh`
    red)
  - ~17-minute video
- **To decide:** raise it, or ask the developer what the server timeout is first.

## F10 · 12028_TS39 (+ the Full parts of TS25 and TS33): the note on a fully approved month

- **Classification:** TS out of date / wording.
- **The page shows one note to every role** on a fully approved month:
  > "Fully approved on 04-11-2026. Finance pay date: 05-11-2026. The FMC and MMSDA Payment Request PDFs are ready below."
- **The TS / workbook expects:**

  | TS | Role | Expected note |
  |---|---|---|
  | TS39 | Approver | "Fully approved." |
  | TS25 | Drafter | "Drafter has already approved this month. Waiting for the Reviewer." |
  | TS33 | Reviewer | "Reviewer has already approved. Waiting for the Approver." |

- **The buttons are correctly hidden** in all three.
- **Evidence:** `12028_TS39/`, `12028_TS25-part3-Full/`, `12028_TS33-part2-Full/`.
- **To decide:** update the TS or ask the SA.

## F11 · 12028_TS54: the PDF address ignores the month in its path (+ TS69's message)

- **Classification:** fail as written, low risk.
- **User:** `kmcheah`.
- **What happened:**
  - May's FMC address with only the month changed (`/backoffice/admin/association/2026/1/7f66cb31-…/pdf?type=FMC`, May's id) → **200, application/pdf, "Payment Requisition_FMC_May 2026.pdf"**.
  - The server serves by id and ignores the month and year in the path.
  - January's own id (`/2026/1/1387d32e-…/pdf?type=FMC`) → 302 to `auth-redirect.do`, no PDF ✔.
  - So a not-approved month's PDF is not served, but the TS's "Access blocked; no PDF downloaded" is not met for the edited address.
- **Also (TS69):** a forced Approver Reject on fully approved May was refused correctly. The
  message, however, said "… cannot act until the **Reviewer** has approved.", which is wrong on
  a month where the Reviewer approved. Minor.
- **Evidence:** `12028_TS54/`, `12028_TS69/`.
- **To decide:** raise "path month not checked" (Low), or accept it.

## F12 · 12028_TS37: blank-date message wording; the page does not check the date itself

- **Classification:** wording (fail) + an observation.
- **Blank date:** alert "Please pick a future payment date."; the TS expects "Please select a
  payment date.". This was already known from the 2026-11-02 capture (flow file "Live build
  captures" #9).
- **Observation:**
  - The picker cannot select today or the past (`min` = tomorrow).
  - If such a value gets in anyway, the page **still submits the form**; there is no
    client-side check.
  - The **server refuses**: "payment date must be a future date (got 2026-11-04)." It is lower
    case and includes "(got …)"; the TS wording is "Payment date must be a future date.".
  - Typed and pasted dates are blocked (the field stays empty).
- **Evidence:** `12028_TS37/` (the first run stopped after the forced-today step),
  `12028_TS37-part2-dates/` (today / yesterday / typed / pasted, with the POST bodies),
  `12028_TS37-check-after/` (February untouched).

## F14 · 12028_TS48: Audit Log column names and row order (corrected from pass)

- **Classification:** TS out of date / decision. Found on 2026-11-04 evening while cross-checking the
  automation (`scripts/eauto-12028/tests/i-audit-log.spec.ts`) against this run: the run had marked
  TS48 pass by reading the columns and order loosely.
- **TS expected:** "Audit Log columns Date/Time, Role, Action/Status, Remarks" and "keeps all rows in
  time order". The suite adds Payment Date (SRD REQ-015 Example 5), leaves Actor out, and reads "time
  order" as **oldest first** (SA mock-up adds rows at the bottom).
- **Actual (September, `02-audit-log.png`):** columns **When | Actor | Role | Action | Payment Date |
  Remarks**; rows listed **newest first** (04-11-2026 12:35 at the top, 02-11-2026 13:44 at the
  bottom).
- **Passed:** reject remarks shown; all 15 rows kept; the reject-loop sequence is all there; no
  signature image.
- **To decide:** accept "When" / "Action" and newest-first (update the TS and the suite), or raise.

## F13 · Payment Request PDFs: things to check (TS56 / TS57 still need the names)

- **Header** reads "eAuto Sdn **.Bhd.** 200401038456 (676967-T)".
  `scripts/eauto-12028/data/expected.ts` lists exactly this as the mock-up's typo
  (`PDF_WRONG.headerTypo`, mock-up line 409). The build copied the typo.
- **FMC "Pay to":** "(PPM-001-14-11041979)" prints on the **Address** row.
  `expected.ts` has it as part of the Account Holder Name ("FED OF MOTOR & CREDIT COMPANIES ASSO
  MSI (PPM-001-14-11041979)"), and the FMC PDF has no Address value.
- **Correct, per expected.ts:**
  - Attn "Marie Ann"
  - reasons "eAUTO PAYMENT TO FMCCAM" / "eAUTO PAYMENT TO MMSDA", "MAY 2026"
  - bank details
  - amounts MYR 238.00 / 38.00 with words
  - Prepared / Checked / Approved names, dates and signature images
- **Evidence:** `12028_TS51/01-fmc.pdf`, `02-mmsda.pdf`, `fmc-page-1.png`,
  `mmsda-page-1.png`.

---

## B1 · 12028_TS09: blocked: no zero-transaction month

- **Needs:** a closed 2026 month with 0 car and 0 motorcycle transactions.
- **Found:** every closed month (Jan–Oct) has transactions. The lowest is August, with 230 car
  and 1 motorcycle transactions.
- **Unblock:** a developer could seed or close an empty month, or the TS could use a year with
  no data. Faizuddin to decide.

## B2 · 12028_TS47: blocked: no untouched month

- **Needs:** a closed month whose Audit Log reads "No workflow actions recorded yet."
- **Found:** every closed month has Audit Log rows. October is Pending but has 4 rows
  (Fared KIV, ZARA Undo KIV, ZARA KIV, ZARA Undo KIV on 02-11).
- **Unblock:** November closes on 2026-12-01, or a developer reset.

## B3 · 12028_TS11–TS13: blocked: month-close

- **Needs:** the month-close cron interval (the "wait minutes" input) and a month that can still
  be closed. TS13 also needs a fully approved month.
- **Unblock:** the developer gives the cron interval and how to trigger month-close on uat1.

## B4 · 12028_TS15: blocked: no Super Admin login

- **Needs:** a Super Admin login to read Transaction Summary Report (State) and compare it with
  the Details state counts.

## B5 · 12028_TS16–TS19: blocked: test transactions

- **Needs:** for each TS, the state code, vehicle type and expected counts of known transactions
  (private + company, JPJ Approved Date month, approved-not-paid, dealer state vs plate state).

## B6 · 12028_TS24: blocked: KIV rule

- **Needs:** the BA's final KIV rule: can the Drafter act on a KIV month ("can act"), or is it
  locked? The live build shows **Undo KIV** to the Drafter on a KIV month.

## B7 · 12028_TS43: blocked: signature rule

- **Needs:** the BA's rule, signature "per role" or "per person", for a multi-role user
  completing a month alone. It also needs `mfizni`'s first Approver approval, which does not
  affect `kmcheah`'s TS36.

## B8 · 12028_TS56, TS57: blocked: names + a fully approved month

- **Needs:**
  - the Drafter, Reviewer and Approver full names exactly as they should print on the FMC and
    MMSDA Payment Request PDFs
  - a fully approved month (after TS36)

## B9 · 12028_TS61: session timeout: **unblocked 2026-11-04**

- **Found without the developer:** the Details page's `#session-cfg` on uat1 sets idle 900 s
  (15 min), a warning from 13 min, and a ping every 30 s.
- TS61 was then run with a real 16-minute idle. See `RESULTS.md` for the outcome.

## B10 · 12028_TS29: cannot be a "first" signature with `eautonurul`

- **Found:** `eautonurul` already has "Approved (signed)" Reviewer rows on Jan (03-11 17:59),
  Sep (03-11 18:01) and May (03-11 18:03).
- **To decide:** run TS29 with another Reviewer-role user who has never signed, or accept that
  it was effectively covered on 03-11.

## B11 · Approver-approve TS: on hold until 2026-11-05

- **Faizuddin runs TS36** (the Approver `kmcheah` first signature) himself.
- **Until then nothing approves as `kmcheah`.** Rejects are fine, because a Reject does not sign.
- **On hold:**
  - TS37, TS39, TS40, TS41, TS42, TS50–TS57, TS66
  - the Full parts of TS25 and TS33
