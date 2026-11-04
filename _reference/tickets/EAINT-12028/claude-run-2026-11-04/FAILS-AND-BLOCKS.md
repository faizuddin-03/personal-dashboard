# EAINT-12028: fails and blocks, for Faizuddin to review

Run: Claude-driven, staging **uat1**, 2026-11-04, after the morning deploy. Second laptop.
Faizuddin, 2026-11-04: "keep super detailed tracked of the fail and block. i will review and
tell you which on to raise". **Nothing is raised in Jira until he picks.**

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
- **Related:**
  - TS61 (session expiry should return to BO login "without an error page") is likely to show
    the same thing.
  - TS63 (session-expiry redirect) is manual.
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
- **To decide:**
  - Is EAINT-12752 enough (it asks for the full BO header, which includes Logout), or should
    "no Logout on the module" be raised on its own?
  - Re-run TS58 after 12752 is fixed.

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

## B9 · 12028_TS61: blocked: session timeout

- **Needs:** the module's session timeout in minutes, from the developer.

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
