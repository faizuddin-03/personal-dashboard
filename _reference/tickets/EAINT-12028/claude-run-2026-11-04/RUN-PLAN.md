# EAINT-12028: Claude-driven test run plan (staging uat1)

Prepared 2026-11-04 on the second laptop, while staging was being deployed. Nothing has run yet.

## How each TS is run

- Session context: `_reference/handoffs/Session-Handoff-2026-11-04.md`. Method:
  `knowledge/claude-driven-testing.md`. Recorder: `scripts/claude-run/recorder.js`.
- Claude drives the browser itself (Playwright plugin), not the `scripts/eauto-12028` suite.
  Expected points come from that suite's specs (`scripts/eauto-12028/tests/*.spec.ts`,
  `data/expected.ts`) and the TS workbook.
- **Recording:** one 1920×1080 video per TS, in the same style as the suite's demo mode
  (`BasePage.demoHighlight`):
  - **amber** outline: the element about to be clicked or typed into
  - **green** outline: an observed result that matches
  - **red** outline: an observed result that does not match
  - A caption at the bottom left gives the TS and the current step.
  - A screenshot is taken at every check.
- **Evidence:** `claude-run-2026-11-04/<TS>/`, holding `NN-<check>.png`, the `.webm` video
  (git-ignored, because the files are large) and one line per TS in `RESULTS.md`.
- **Environment:** `https://staging.eauto.my/uat1`, BackOffice. It is reachable without VPN
  (HTTP 200, 2026-11-04).
- **Logins:** the dashboard defaults (`app/eauto/12028/Runner.tsx` DEFAULT_USERS), all with the
  shared staging password:

  | Role | Login |
  |---|---|
  | Drafter | mfared |
  | Second Drafter | eautozara |
  | Reviewer | eautonurul |
  | Approver | kmcheah |
  | Multi-role | mfizni |
  | No role | onghongkee |
  | Super Admin | **none given** |

- **Rules (taken from Azfar's cr-runner):**
  - Never re-run to get a green.
  - A failure is reported with what was expected and what happened, and nothing more.
  - No Jira action without Faizuddin's OK.
  - Keep going when one TS blocks.

## Skipped: already run on the main laptop (2–3 Nov)

TS06, TS20, TS21, TS23, TS33 (findings under `_reference/tickets/EAINT-12028/`).

## Decisions from Faizuddin (2026-11-04)

1. There is no flow back to Pending, and there shouldn't be one: only KIV, Reject and moving
   forward. When test data runs out, Faizuddin asks the developer to reset the months.
2. **First-signature TS are skipped today: TS29 (Reviewer) and TS36 (Approver).** Faizuddin will
   run those himself on 2026-11-05. Do not approve as `eautonurul` or `kmcheah` on any month
   before then, because that would use up their first signature. So C1 / C2 / C3 / C4, which
   need Reviewer or Approver approvals, wait unless Faizuddin says otherwise.
3. **Audit Log:** check only that the rows from this run's own actions are there. Extra rows
   from earlier runs or setup steps are ignored.
4. **Months are chosen automatically:** read the Summary before each workflow TS, pick a month
   already in the needed state, or move one forward (PREP-style setup steps, recorded and marked
   as setup). Show the month allocation to Faizuddin before the first setup click.

## Batch 2: month allocation, **approved by Faizuddin 2026-11-04** ("yes"), including `eautonurul` approving and rejecting

Track every fail and block in `FAILS-AND-BLOCKS.md` in full detail. Faizuddin picks which to raise.

Facts from the survey:
- Reviewer `eautonurul` has already signed (Jan, May, Sep).
- Approver `kmcheah` has never approved; it has one Reject.
- **A Reject never signs**, so Approver rejects as `kmcheah` do not use up TS36.
- KIV can be undone by any Drafter, which returns the month to Pending. This lets a Pending
  month be reused for KIV tests.

| Step | Month (state now) | Who | TS | Ends |
|---|---|---|---|---|
| 1 | Mar (DRA) | mfared | TS22 Drafter Approve on Review Again (no pad: Fared has signed) | DA |
| 2 | Oct (Pending) | eautozara | TS26 Second Drafter approves a Pending month, then is blocked on Jun (DA) | DA |
| 3 | Feb (KIV) | mfared | setup: Undo KIV → Pending | Pending |
| 4 | Feb (Pending) | mfared | TS64 Drafter Approve from two tabs → one audit row | DA |
| 5 | Apr (KIV) | mfared | setup: Undo KIV → Pending | Pending |
| 6 | Apr (Pending) | mfizni | TS44 Multi-role KIV → Drafter Status KIV | KIV |
| 7 | Apr (KIV) | mfared | setup: Undo KIV → Pending | Pending |
| 8 | Apr (Pending) | mfared | TS27 Drafter second approval reuses the signature, no pad | DA |
| 9 | Jan (RA) | kmcheah | TS38 Approver Reject needs remarks → Reviewer Review Again (**reject only, no signature**) | RRA |
| 10a | Sep (RA) | mfizni | TS46 Multi-role Approver Reject → Reviewer Status Review Again (reject only) | RRA |
| 10b | Sep (RRA) | mfizni | TS45 Multi-role Reviewer Reject, then re-approves as Drafter (mfizni has already signed as Drafter and as Reviewer) | DA |

**Only if Faizuddin allows `eautonurul` to approve and reject** (its first signature is
already gone):

| Step | Month (state now) | Who | TS | Ends |
|---|---|---|---|---|
| 10 | Jun (DA) | eautonurul | TS30 Reviewer Reject needs remarks → Drafter Review Again | DRA |
| 11 | Jan (RRA) | eautonurul | TS32 Reviewer Reject on a Review Again month | DRA |
| 12 | May (RA) → Approver reject → RRA (setup, kmcheah reject) | eautonurul | TS31 Reviewer re-approves an RRA month | RA |
| 13 | Jul (DA) | eautonurul | TS34 Reviewer second approval reuses the signature | RA |
| 14 | Aug (DA) | eautonurul (two tabs) | TS65 Reviewer Approve from two tabs | RA |

**Held until after Faizuddin's TS36 (Approver first signature) on 2026-11-05:**
TS37, TS39, TS40, TS41, TS42, TS50–TS57, TS66, and the Full parts of TS25 / TS33.
TS43 (Multi-role completes a month alone) also waits for the BA's signature rule (`expectSig`).

## Batch 3: full approval through `mfizni` (Faizuddin: "yes, do that", 2026-11-04)

- **Why:** `kmcheah` stays untouched for Faizuddin's TS36 on 2026-11-05. The multi-role
  `mfizni` (holds Approver, has never approved) makes the fully approved months instead, so the
  Full-month TS can run today.
- **Cost, accepted:** `mfizni`'s first Approver signature is used up, which TS43 (signature
  rule) may need later.
- **SETUP-05:** `mfizni` approves May (Reviewer Approved) with tomorrow's payment date →
  fully approved.
  - The payment-date field blocks typing and pasting, so its value is set directly (setup
    only).
- **Then, on Full months:**
  - TS39 (Approver buttons hidden; viewed as `kmcheah`)
  - TS50 (Approver sees both downloads; `kmcheah` views and downloads, no signing)
  - TS51 / TS52 (Drafter / Reviewer download)
  - TS55 (second download is the same file)
  - TS53 / TS54 (download address as the no-role user / for a non-Full month)
  - TS69 (forced Reject on a Full month)
  - TS25 / TS33 Full parts
  - TS48 (Audit Log after a reject loop: Sep or Jan history)
- **Approver-action TS run as `mfizni` (deviation, logged per TS):**
  - TS66 (two tabs) on Aug
  - TS37 (date popup checks) on Feb
  - TS41 (approve after the Reviewer re-approved) on Sep
  - TS40 (second approval reuses the signature)
  - TS42 is not meaningful: `mfizni`'s first signature is gone after SETUP-05.
- **Still blocked:** TS56 / TS57 (need the full names for the PDFs; the PDFs are downloaded
  and saved for Faizuddin to check).

## Step 0: survey (read-only, first thing after the deploy)

1. Log in as Drafter and open the Summary for 2026.
2. Record every month's Drafter / Reviewer / Approver status and Payment Date in
   `RESULTS.md` → "Month states".
3. Check the deploy did not change the DOM again. The 2026-11-03 rebuild is described in
   `knowledge/flow-association-payment-listing.md` "Summary page rebuilt".

Months only move forward. KIV and fully approved are end states, except that the Drafter can
Undo KIV. The chains below are therefore assigned **after** the survey, to whichever months are
in the right state.

## Order of work

### Batch 1: read-only, no month used up

| TS | What | Needs |
|---|---|---|
| TS01–TS04 | Each role sees the link and opens the Summary | — |
| TS05 | No-role user does not see the link (known bug EAINT-12716) | — |
| TS07, TS08, TS09, TS10 | Summary layout, rates and totals, zero month, View → Details → back | a closed month |
| TS14 | Details: 16 states, TOTAL, rates | a closed month |
| TS47 | New month Audit Log is empty | a Pending month with no actions |
| TS25, TS28, TS35, TS49 | Buttons hidden or not-your-turn notes across states | whichever months the survey finds in each state |
| TS58, TS60 | BO login hand-off; core logout closes the module tab | — |

### Batch 2: workflow chains (each one uses up a month)

| Chain | Start | Steps (in order) | Ends | Then read-only on it |
|---|---|---|---|---|
| C1 two-tab | Pending | TS64 Drafter approve from 2 tabs → TS65 Reviewer 2 tabs → TS66 Approver 2 tabs | Full | TS39, TS50, TS51, TS52, TS55, TS56, TS57 |
| C2 reject loop | Pending | Drafter approve → TS30 Reviewer reject → TS22 Drafter approve (Review Again) → TS31 Reviewer re-approve? / TS38 Approver reject → TS41 | Full | TS48 Audit Log after a reject loop |
| C3 signatures | Pending | TS27 Drafter second approval reuses signature → TS34 Reviewer reuses → TS42 Approver signature kept after Cancel → TS40 | Full | — |
| C4 date popup | Reviewer Approved | TS37 Approver date popup: cancel, blank, today, past, typed, pasted | (stays RA unless confirmed) | then TS36 |
| C5 KIV | Pending | TS24 Drafter action on a KIV month (final KIV rule: needs `expectKiv`) | KIV | — |
| C6 second drafter | Pending + Drafter Approved | TS26 eautozara approves a Pending month; blocked on a DA month | DA | — |
| C7 reviewer reject on RRA | Reviewer Review Again | TS32 | DRA | — |
| C8 multi-role | 4 Pending months | TS43 (needs `expectSig`), TS44, TS45, TS46 | various | — |
| C9 first approvals | Pending | TS29 Reviewer first approve with the pad; TS36 Approver first approve with tomorrow's date | — | only valid if that user has never signed: **check** |

About 8–10 months are needed in total. If the survey finds fewer usable months, I'll run the
P1 TS first and ask before going further.

## Blocked until Faizuddin gives an input

| TS | Missing |
|---|---|
| TS11, TS12, TS13 | Month-close runs on a cron: need the wait in minutes, and a month that can still be closed |
| TS15 | Super Admin login (Transaction Summary Report (State)) |
| TS16–TS19 | Known test transactions: state, vehicle type, expected counts |
| TS24 | Final KIV rule from the BA ("can act" / "locked") |
| TS43 | Final signature rule from the BA ("per role" / "per person") |
| TS56, TS57 | Full names of the Drafter, Reviewer and Approver as they should print on the PDF |
| TS61 | Session timeout in minutes (from the developer) |

## Manual TS (no script): Claude can do these by hand in the browser

TS53 (no-role user hits the PDF address), TS54 (PDF address of a month that isn't fully
approved), TS59 (re-use a used SSO hand-off address), TS62 / TS63 (outside-address redirect on
logout and on session expiry), TS67, TS68, TS69 (forced actions out of turn: by direct request
from the page, using the logged-in session).
