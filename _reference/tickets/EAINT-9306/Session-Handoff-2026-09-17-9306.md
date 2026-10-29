# Session handoff — 2026-09-17 (EAINT-9306)

Scratch note for resuming later. Not part of the knowledge base — safe
to delete once picked back up. Supersedes the 2026-09-14 (and earlier:
2026-08-26/2026-08-27/2026-09-02/2026-09-03/2026-09-04/2026-09-10/
2026-09-11) versions of this file (renamed forward each session; the
newest section is always at the top).

## 2026-09-17 — no direct session work; one automated Teams-sync finding
folded in (perakuan consent-declaration feature confirmed deployed and
regressed clean)

Today had no direct user-driven session on this ticket — the only new
information came from the hourly `teams-knowledge-sync` background agent
(Windows Scheduled Task `ClaudeHourlyTeamsSync`), which runs unattended
and checks Teams for whichever ticket(s) it judges currently active, then
writes findings straight into `knowledge/`, not into this handoff.
Recording it here too since it resolves a real open question from the
2026-09-14 handoff below.

**Finding**: the pending question in `knowledge/flow-edereg.md` (section
42) — whether SRD V1.2's perakuan-declaration feature shipped as
scheduled — is now answered. Teams confirms QA signed off staging/uat1 on
2026-09-14, deployment completed 2026-09-15 morning, and regression
already shows the pre-checking popup live in dereg step 2.
`knowledge/flow-edereg.md` was updated directly by the sync agent (now
section 44; the old speculative section 42 line was struck through, not
deleted). No test scripts were touched, no automation was run, no new
bugs found today.

Later same-day sync runs (hourly, throughout the afternoon) re-checked
Teams again and found nothing further new for this ticket — each
confirmed the section-44 entry already captured everything reachable.

Everything else below (from the 2026-09-14 handoff) is unchanged and
still the actual state of the ticket's automation/test-case work — this
was purely a one-fact addition, not a new working session.

---
## 2026-09-14 — TS12 Part 2 debugged twice live (both attempts failed,
real bug in the pass condition found); TS6 Part 1 and CPC_E2E_TS2 diagnosed
as one-off environment/data issues, not script bugs; dashboard's Bulk Run
folded into the single-run picker (multi-select queue); a real
`DeregTransactionPage` gap found and fixed along the way

### 1. CPC_E2E_TS12 Part 2 — two live runs today, both failed, root cause
now understood but the CORRECT fix is still unbuilt

**Run 1 (original single-decline form)**: failed immediately — after the
one inline ER (RHB API Down) decline, the Pre-Checking listing still
showed a "Resubmit" link, so the test's `if (resubmitAttempt.resubmitLinkFound)
throw` fired. This confirmed the spec's own pre-flagged unknown (whether
ER auto-cancels after exactly one decline) was wrong as written.

**Fix built in response**: rewrote the test to loop — resubmit via the
listing (`openViaListingAndResubmit()`/`attemptResubmitPayment()`) up to
`MAX_RESUBMIT_ROUNDS = 5` times until the listing stopped offering
"Resubmit" at all, THEN check `trxStatus === 'Cancelled'`. Timeout raised
9 → 15 min. Typechecked clean.

**Run 2 (the loop)**: ran all 5 rounds, never reached "no Resubmit link" —
FAILED again, but for a NEW reason. Every round's native dialog was
identical: `"ER - Sila TUNGGU 12 minit kemudian klik 'Resubmit'..."`
("please WAIT 12 minutes then click Resubmit"). **RHB "ER" has its own
~12-minute cooldown between real attempts — never documented before this
run** (distinct from RE's already-known ~6-minute
`waitOutPaymentResetTimer()`). The loop fired all 5 rounds back-to-back in
under 2 minutes, so only round 1 was ever a genuine second attempt —
rounds 2-5 just re-hit the same cooldown block.

**The actual bug, found after Faizuddin pushed back on the loop
("of course it won't pass... I mean the code for RHB fail thingy")**:
re-reading `knowledge/flow-edereg.md`'s own pre-existing note (§36 sweep,
"TS12 Part 2... expects its single declined payment to end Cancelled") —
the ORIGINAL design assumed ONE decline should be enough, the opposite of
what the loop assumed. More importantly: **both the original test AND the
loop use "is the Resubmit link still showing?" as a proxy for "is it
Cancelled yet?"**, but `openViaListingAndResubmitExpectingCancellation()`'s
own doc comment already flags that proxy as **GENUINELY UNCONFIRMED** —
the Resubmit link may render even on an already-Cancelled row. Neither run
ever read the real `trxStatus` field right after the first decline to
check directly.

**Agreed next fix — NOW BUILT** (picked back up later the same day, in a
separate session on this same file — Faizuddin said "yes, fix it. TOUCH
ONLY CPC_E2E_TS12. DONT TOUCH ANYTHING ELSE"): dropped the Resubmit-link
gate entirely. After the single ER decline, the test now goes straight to
`getListingStatusForVehicle()` and asserts `trxStatus === 'Cancelled'`
directly — that's the real pass condition. The Resubmit-link probe
(`openViaListingAndResubmitExpectingCancellation()`) still runs, but purely
informational now (logged as `resubmitProbe` in the RESULT JSON, never a
hard failure). Timeout reverted 15 → 9 min (no more multi-round wait).
**Only this one file touched**, per explicit instruction — no other spec,
page object, or dashboard file edited.

Files touched: `tests/edereg-precheck-ts12-part2.spec.ts` (header comment
rewritten with the full two-correction history, loop removed, direct
`trxStatus` check in). Typechecks clean (only pre-existing, unrelated
`.next/dev/types/validator.ts` errors show up, untouched by this change).
**NOT yet re-run live in this (trxStatus-direct) form** — that's the
immediate next step. Memory (`eaint-9306-ts11-ts12-need-retest.md`) still
needs updating to reflect this rebuild once it's re-run.

### 2. CPC_E2E_TS6 Part 1 — hung on a genuine "Working..." spinner,
diagnosed via the run's own recording, NOT a script bug

Failed with `TimeoutError: locator.waitFor: Timeout 90000ms exceeded` on
`#result-container` right after payment confirmed. Pulled the published
run video (`public/qa-artifacts/eauto-edereg-precheck/<runId>/main-1.webm`)
and grabbed a frame with `ffmpeg` at the timeout point — the page was
genuinely stuck at Step 2 "Payment" showing a "Working..." spinner, never
advanced to Step 3. Ruled out a decline-shape gap (my first guess) once the
frame showed no retry/decline screen either — just a stalled AJAX/backend
round trip. **Verdict: one-off environment/network hang, not a script or
expected-result issue.** Recommended a plain re-run with a fresh vehicle no.
(see item 3) — not yet re-run.

**Reusable technique worth remembering**: `ffmpeg -ss <seconds> -i
<recording>.webm -frames:v 1 <out>.png` pulls a single frame from a
published run recording for visual diagnosis when the live browser isn't
reachable — used here and it's exactly what resolved the ambiguity between
"declined payment" vs. "genuine hang".

### 3. CPC_E2E_TS2 — diagnosed as vehicle-number contamination, not a
script/expectation change

A separate TS2 run reported `RESULT.status: "FAIL"` despite Playwright
itself reporting "1 passed". Root cause: `HXA191` already had 2 prior
Pre-Checking rows on file from an earlier run, so Step 2's gate opened
immediately (`"Vehicle gate already satisfied"`) and the whole
Failed→repurchase flow this test needs to exercise never triggered.
**Always use a fresh, never-tested vehicle no. for TS2 (or any
vehicle-not-exist/repurchase case)** — reusing one across runs silently
invalidates the scenario. Nothing changed in the script.

### 4. Dashboard — Bulk Run folded into the single-run picker; a real
`DeregTransactionPage` gap found and fixed

Per Faizuddin's ask: hid the standalone `BulkRunPanel` (commented out, not
deleted) and rebuilt the same "pick several, run one at a time" behaviour
directly into `/eauto/edereg-precheck`'s main picker:
- Test case picker is now checkboxes (multi-select), not a radio.
- Continuations are multi-selectable too via the SAME checkboxes already
  used for "Copy selected" (dual purpose now).
- Hitting Run builds one ordered queue — selected test cases (auto-
  incrementing the Vehicle Reg No. field, RE-wait cases pushed to the end)
  followed by selected continuations (each keeping its OWN already-patched
  vehicle no., never incremented) — run strictly one at a time through the
  existing single `RUN_KEY` background-run channel (no more separate bulk
  key).
- Every queue item gets its own expandable result card with the FULL
  detail fields (not a condensed version) — precheck/deregistration/retry/
  payment/SRD-checklist/JPJ-XML-log, same depth the old single-run page had.
- Video downloads across several items land pre-sorted into per-TS-named
  folders inside the zip (builds on the folder-aware `download-videos`
  route change from earlier this session).

**Real gap found while investigating item 1's "email consent" question**:
`DeregTransactionPage.fillConsentEmailIfPresent()`'s own doc comment
claimed THREE call sites (`resolveVehicleGate()`, `attemptInlinePayment()`,
`attemptInlineRetryAfterCancellation()`) but the third one was silently
missing the actual call — MU_TS9/TS10/TS12 (the only callers of
`attemptInlineRetryAfterCancellation()`) were exposed to the same blank-
email-validation-stall risk every other flow was already patched against.
**Fixed** — one line added, no spec-level changes needed since it's inside
the shared page-object method.

Typechecks clean on all touched dashboard files (`page.tsx`,
`download-videos/route.ts`, `BulkRunPanel.tsx` untouched/hidden). Dev
server compiles and serves the route with no runtime errors (Chrome
extension wasn't connected this session, so no live click-through
verification — that's still outstanding).

### Immediate next step

1. **TS12 Part 2 — the trxStatus-direct fix is now BUILT** (item 1 above,
   done later the same day): drops the Resubmit-link gate, checks
   `getListingStatusForVehicle()`'s `trxStatus` directly after the single ER
   decline. **NOT yet re-run live in this form** — that's the actual next
   step now, not building it.
2. **Re-run CPC_E2E_TS6 Part 1** with a fresh vehicle no. — last failure was
   a one-off "Working..." hang, not a script bug.
3. **Re-run CPC_E2E_TS2** with a FRESH, never-used vehicle no. — last
   failure was HXA191 contamination from an earlier run, not a script bug.
4. **CPC_E2E_TS11 Part 2 still needs its corrected (reshow-form) rewrite
   re-run** — untouched today, carried over from 2026-09-03/2026-09-11.
5. **The merged dashboard picker (Bulk Run → single picker) has NEVER been
   run live** — first live use will also be the first real test of the
   multi-select queue, the per-TS video-folder zip, and the
   continuation-multi-run behaviour together.
6. **MU_TS9/TS10/TS12 have never been re-run since the
   `attemptInlineRetryAfterCancellation()` consent-email fix** — worth
   confirming none of them now stall differently with the email field
   actually being filled.
7. Everything still open from 2026-09-11 below (CPC_E2E_TS2/TS8 3-phase
   repurchase confirmation, MU_TS5/MU_TS6 flip, the standalone
   perakuan-declaration HTML capture, `repurchaseProbe.ts`/`jpjCodeProbe.ts`
   email-field fixes) remains untouched — see that section directly below.

### Timesheet

**Not logged in this session** — no CapacityTrack entry created or
verified for 2026-09-14 here. Today's billable-looking work: the TS12
Part 2 double-debug (two live runs + a rewrite), the TS6/TS2 diagnoses, the
`ffmpeg` frame-extraction technique, the Bulk Run → single-picker dashboard
revamp, and the `attemptInlineRetryAfterCancellation()` fix.

## 2026-09-11 — SRD V1.2 consent-declaration automated; TS1-12 checked
against real code (3 gaps found + fixed); jira-ticket-study skill gained
Teams search; dashboard gained multi-TS Bulk Run (3 real bugs found + fixed
along the way, one caught live by Faizuddin after shipping); true
concurrent execution scoped but NOT built; a SEPARATE concurrent session
manually live-testing a dev-reported email discrepancy

**⚠️ TWO Claude sessions worked this ticket on the same day, editing this
SAME file concurrently — confirmed by both sessions hitting stale-file
write errors on each other's edits while writing their own sections.**
Threads 1-5 and 6.5 below are the automation-code session (`.spec.ts`
fixes, the Bulk Run feature, the skill update, and a live bug found in
Bulk Run right after it shipped). Thread 6 is the OTHER session's — no
code touched there, a manual/live browser investigation only. **Read
`git log`/`git diff` on this file before trusting anything below as
current** — section numbers here are already non-sequential (6.5 sits
after 6) specifically because both sessions kept saving on top of each
other; a THIRD session picking this up may find yet another gap.

Seven separate threads today across the two sessions, in order (1-5, 6.5,
then 6 physically last in the file though written by the other session
mid-way through). Automation-only for 1-5/6.5 — Timesheet not logged in
this session, same as every recent one; see the bottom.

### 1. SRD V1.2's new consent declaration — automated

Faizuddin pasted the live Step 2 HTML showing the NEW "Perakuan eDereg
Pre-Checking - AATF" declaration on the Vehicle+Payment Details popup
(the SAME dialog `resolveVehicleGate()`/`attemptInlinePayment()` already
drive, not a separate step) — one editable field, email address
(`#dpc-consent-email`), sometimes prepopulated from the AATF company's DB
record, sometimes blank (mandatory either way). Per REQ-007 it shows ONCE
per new transaction (RHB status Pending), never again on retry/resubmit.

**Saved per the standing rule**:
`_reference/html/edereg/dereg-step2-precheck-consent-dialog-email-field.html`.

**Fixed**: new `DeregTransactionPage.fillConsentEmailIfPresent()` — checks
the currently-open dialog for the field, leaves a prepopulated value
alone, fills a fallback (`tester@email.com`) when blank. Called right
before every existing Next-click on this dialog
(`resolveVehicleGate()`'s 'paid'-shape branch, `attemptInlinePayment()` —
covers `beginInlinePaymentFlow()` and every decline retry), so it's a
one-place fix covering ALL of CPC_E2E_TS1-12, since every one of them
routes through one of those two methods. No-ops cleanly when the field
isn't present, so safe to call unconditionally.

**Not yet updated**: `utils/repurchaseProbe.ts` and `utils/jpjCodeProbe.ts`
click the same dialog's "Next" independently, outside
`DeregTransactionPage` — they'll hit the same blank-email validation stall
if ever run against a build with this declaration live. Fix the same way
before relying on either probe again.

Full write-up: `knowledge/flow-edereg.md` §42.

### 2. TS1-12's updated literal test-plan text checked against the ACTUAL
built code — three real gaps found and fixed

Faizuddin pasted "updated versions" of CPC_E2E_TS1-12's literal steps in
three batches; each was checked not just against `flow-edereg.md`'s own
descriptions but by directly reading every `.spec.ts` file (a real gap
in the first pass — see below). Findings:

- **TS1, TS4, TS5, TS6, TS7, TS8, TS10, TS12 — all correct, no changes
  needed.** Codes, categories, decline behaviours, and bracket-label
  mismatches (a few rows' `[Failed - X]` label doesn't match its own
  response code — a pre-existing, already-documented quirk, not new) all
  matched the current build exactly.
- **TS2 — correct on mechanics** (VEL000100E repurchase-to-completion,
  confirmed rule per §40), but the build was missing the JPJ XML Log
  check its own updated text asks for — dropped 2026-09-02 under the OLD
  dead-end assumption, never re-added after the 2026-09-04 rewrite that
  made it actually complete a full Deregistration. **Fixed**: added.
- **TS3 — genuinely changed from the version validated earlier the same
  session.** New text adds a SECOND re-entry ("Try again using the same
  VN") with a specific field-clearing claim (clears after the 1st Close,
  stays showing after the 2nd). **Fixed**: added the second
  `resolveVehicleGate()` call (same pattern TS9 already uses),
  hard-asserting `dialogShape === 'closed-direct'` on both entries (the
  confirmed part) while only REPORTING the field-clear timing (unconfirmed
  by any live capture, so not asserted — same caution the file already
  used for its single-entry version).
- **TS9 — was missing its ENTIRE checklist.** Its own text asks for "Step
  Page, Transaction Listing, JPJ XML Log and Details Page" at the end; the
  build did nothing after the second reshow at all. **Fixed**: added the
  listing check, a Details-page check (via
  `findTransactionIdByVehicleNo()` + a direct `goto`, since this entry
  point never calls `precheck.done()`), and the JPJ XML Log check — same
  approach TS3 already uses for its own no-completed-Deregistration case.
- **TS11 — checklist only half-done.** Already had the Transaction Listing
  read; its own header comment explicitly DROPPED the Details Page/JPJ
  XML Log items as "unreachable" (reasoning about the Deregistration-side
  checklist, which really is unreachable here) without considering the
  Pre-Checking-side equivalent TS3/TS9 use, which IS reachable (a real
  Failed transaction persists from the first attempt). **Fixed**: added
  both, same pattern as TS9.

**Self-caught process gap, worth remembering**: the first comparison pass
for TS1/2/7/8/9/10 (batch 2) was done against `flow-edereg.md`'s own
descriptions of those files, NOT the files themselves — asked directly
"have you compared all twelve with the existing automation codes?" and
had to admit the gap, then actually opened every file. That direct
re-check is what surfaced TS9's missing checklist and TS11's half-done
one — the doc's own summary had gone stale relative to the code in both
cases. **Lesson for next time: read the actual spec file, not just its
own doc-comment summary, before confirming anything is "correct."**

All four fixed files (`edereg-precheck-vehicle-not-exist.spec.ts`,
`edereg-precheck-ts3-jpj-error.spec.ts`,
`edereg-precheck-step2-first-retry-approved.spec.ts`,
`edereg-precheck-ts11-part2.spec.ts`) typecheck clean. **NEVER RUN LIVE in
these forms** — same as everything else in this thread.

### 3. `jira-ticket-study` skill — Teams search added

Faizuddin asked for the skill to also read Teams chat, since some
decisions only happen there (this session's own SRD V1.2/perakuan history
from 2026-09-10 is a live example). No Teams MCP tool is connected in this
environment, so — per his own choice between the two options offered —
it now uses Claude in Chrome: reuses an existing Teams tab if one's open,
otherwise opens one; searches the bare issue key in Teams' own search bar
(not browser find); reads matching threads for context, not just the
matched line; refuses to attempt a login if it hits a sign-in screen
(falls back gracefully, doesn't block the study). New Step 3 in
`.claude/skills/jira-ticket-study/SKILL.md`, everything after it
renumbered; output template gained a `Teams search:` line; Teams findings
now get folded into Overview/Decisions/Open-questions with a
`(source: Teams, <person>, <date>)` tag, same fact/inference discipline
as the ticket/SRD.

Noted but not touched: a stale `.claude/skills/jira-ticket-study.skill`
zip file (dated Jul 14) sits next to the live skill directory — looks
like an old packaged export, not on the active load path. Flagged for
Faizuddin, not removed.

### 4. Dashboard — "Bulk Run" built on `/eauto/edereg-precheck`

**What it does**: pick several DIFFERENT test cases from the same grouped
list the single-run picker uses, give one starting Vehicle Reg No., and
each picked test case runs ONCE, in order, against its own
auto-incremented vehicle no. (1st picked → the starting value, 2nd → next
number, …). **Important correction mid-build**: the first version repeated
ONE test case N times — wrong; Faizuddin clarified directly ("multiple
TS. not single TS but multiple times") and it was rebuilt around a
multi-select test-case picker instead.

Runs strictly ONE AT A TIME (see thread 5 below for why NOT concurrent);
continues through individual failures, Stop aborts; **RE-wait test cases
(CPC_E2E_TS5 Part 2, MU_TS3 — a real fixed ~6.5-minute payment
reset-timer wait) automatically move to the END of the run order**, per
Faizuddin's own follow-up request, so a long fixed wait doesn't sit in
front of faster ones queued behind it.

**Two real infrastructure bugs found and fixed along the way** (both
affect the SINGLE-run panel too, not just bulk):

1. **React error: "Cannot update a component (AppShell) while rendering a
   different component (BulkRunPanel)."** Hit live while testing. Root
   cause: the queue-advance effect called `runIndex()` (→ `startRun()` →
   AppShell's `setRuns`) FROM INSIDE a `setBulk(prev => ...)` updater
   function — updaters must stay pure. Fixed by mirroring `bulk` state
   into a ref, computing the next state as a plain object from the ref,
   calling `setBulk(next)` with no updater function, and only THEN
   calling `runIndex()` as a separate statement, never nested inside a
   setState call.
2. **`publishVideos()` (`run/route.ts`) wiped the ENTIRE shared
   `public/qa-artifacts/eauto-edereg-precheck` folder and republished on
   EVERY run** — harmless for a single manual run (only the latest ever
   mattered) but fatal for a bulk batch: by the time N test cases
   finished, only the LAST one's recordings would still exist, every
   earlier one already deleted. **Fixed**: each run now publishes into
   its OWN `PUBLIC_ART/<runId>/` subfolder instead of the shared root;
   `pruneOldRunFolders()` bounds total disk use (keeps the newest 60
   run-folders) instead of the old wipe-every-time approach. New shared
   `app/api/eauto-edereg-precheck/artifactPath.ts`'s `resolveArtifactPath()`
   updated `download-videos/route.ts` and `trim-video/route.ts` to
   resolve the new `<runId>/<file>` URL shape (still rejecting `..`/
   absolute-path escapes; falls back to accepting a bare legacy flat
   filename too).

**Per-item Details + downloads, per Faizuddin's follow-up ask** ("find a
way for me to download the recordings... and look at the logs/details of
each TS... to understand what happened"): each bulk item now keeps its
own full result (not just a one-line summary) — an expandable "Details"
accordion per item shows the step list, a condensed result breakdown
(pre-check/JPJ/deregistration status, payment attempts, details-page
check, JPJ XML Log hits, etc. — a shorter version of page.tsx's own much
longer result panel), the raw log, and a checkbox+"Open" per recording.
A panel-wide "Download selected" button (same `download-videos` endpoint
the single-run panel already used) can zip up recordings from several
DIFFERENT test cases in the batch together.

New/changed files: `app/eauto/edereg-precheck/shared.ts` (new — the
types/constants moved out of `page.tsx` so `BulkRunPanel.tsx` could import
them without a circular dependency: `TEST_CASES`, `TEST_CASE_GROUPS`,
`VPN_GATE_SKIP_TEST_CASES`, `RE_WAIT_TEST_CASES`, `FormState`,
`RunResult`/`RunResponse`, `TestCase`), `app/eauto/edereg-precheck/
BulkRunPanel.tsx` (new), `app/api/eauto-edereg-precheck/artifactPath.ts`
(new), `run/route.ts`, `download-videos/route.ts`, `trim-video/route.ts`
(all three updated for the per-run video-folder change), `page.tsx`
(imports from `./shared` now, renders `<BulkRunPanel form={form} />`).

Typechecks clean, `next build` compiles (one pre-existing, unrelated
failure in `shopping-cart/run/route.ts`, untouched by any of this).
**NEVER RUN LIVE** — first real bulk batch will also be the first live
test of the per-run video-folder change and its pruning.

Full write-up: `knowledge/flow-edereg.md` §43.

### 5. Concurrent (parallel) bulk execution — scoped, explicitly NOT built

Faizuddin asked whether bulk items could run at the same time instead of
sequentially, and what data issues that would cause — answered in full
before he said "no need to do it yet." Kept here since it's the natural
next ask if bulk speed becomes a priority:

1. **Hard blocker specific to this feature**: `knowledge/esim.md` confirms
   eSIM response codes are keyed by the vehicle number's PREFIX (2-3
   chars), not the full number — every bulk-generated vehicle no. shares
   the same prefix by construction (incrementing digits only), so
   concurrent items would race on the exact same eSIM row. Needs a
   different vehicle-numbering scheme (different prefixes per concurrent
   item), not just removing the sequential wait.
2. `publishVideos()`'s old global-wipe behaviour (fixed in thread 4 above)
   would have been a second blocker — now moot for bulk specifically, but
   worth remembering this was found BECAUSE of the concurrency question.
3. `utils/waitStatus.ts` (VPN reset-timer banner) is still ONE shared file,
   not scoped per run — confirmed already flagged in `flow-edereg.md` as
   "deliberately not fixed, low-risk" back when only MU_TS11+MU_TS12 (which
   never trigger it) were run concurrently. A general bulk feature could
   easily include CPC_E2E_TS5/TS11 (which DO trigger it) alongside
   something else, reopening this gap.
4. Client-side: `BulkRunPanel` currently uses ONE fixed run key with
   strict sequencing. `hooks/useBackgroundRuns.ts` CAN track several runs
   at once (proven once, for MU_TS11+MU_TS12, each in its own browser
   tab — see the 2026-08-28 entries below) but only with a UNIQUE key per
   concurrent item; reusing one key while a run is still in flight lets
   the old run's resolution clobber the new one's state.
5. **Unconfirmed**: whether the SAME AATF login can hold multiple
   concurrent sessions at all — every existing proof of concurrency in
   this suite (MU_TS2 onward) is between two DIFFERENT accounts, never
   the same one twice.

Verdict given: possible, but needs (1)+(3)+(4) fixed and (5) verified live
first — not a quick flip. Nothing built for this; explicitly deferred.

### 6.5 (added after thread 6 below, by the SAME session that did threads
1-5) — Bulk Run's `PART1_DONE` classification bug, found LIVE by Faizuddin
right after thread 4 shipped, fixed; a confusing follow-up turned out to be
stale cached data, not a new bug

**This file is being edited by two sessions concurrently today — the edit
right above this one (thread 6) landed while this edit was in progress,
and this section is being added back on top of it.** Numbered "6.5" rather
than renumbering everything, specifically so neither session's edits stomp
the other's section numbers if both save again. **If picking this up
later: check `git log`/`git diff` on this file before trusting section
numbers or "current" claims below — they may already be stale again.**

Faizuddin ran Bulk Run for real (first live use, thread 4's own build) on
exactly the 6 Part-1-only test cases — **TS4, TS5, TS6, TS10, TS11, TS12**
— and caught it immediately: all 6 showed a plain green "success" check,
identical to a fully-passed test, when what actually happened is each one
deliberately stopped at `PART1_DONE` (create the pre-check, stop, hand
vehicle+transaction to dev for a patch). Root cause: the classification
logic only checked `data.stopped`/`data.error`/a non-SUCCESS-or-PART1_DONE
status to mean "fail" — everything else, including `PART1_DONE`, fell
through to plain "success." Nothing distinguished "actually finished" from
"stopped here on purpose, dev action needed."

**Fixed**: new `BulkStatus` value `"needs-patch"` (amber arrow icon, not
green). When an item's result is `part === 1 && status === "PART1_DONE"`,
it now (a) shows its own visible dev-handoff box directly on the row — TS
No./Vehicle Number/Transaction ID + a "Copy for dev" button, not tucked
behind the Details accordion, since it's actionable — and (b) writes an
entry into the SAME `CONTINUATIONS_KEY` localStorage list the single-run
panel's own Continuation card reads, so a Part 1 picked inside a bulk
batch shows up there too, ready to select for Part 2. `PendingContinuation`/
`CONTINUATIONS_KEY` moved from `page.tsx` into `shared.ts` so both files
write to the same list.

**Follow-up confusion, resolved**: Faizuddin then reported only TS12
showed up in the Continuation list, and (on being asked) that the other
five were STILL showing "pass" even after the fix. Diagnosed as stale
`localStorage`, not the fix failing — `BulkRunPanel`'s own bulk-state
cache (`edereg_precheck_bulk_state`) persists across reloads by design (so
a batch survives navigating away), and it only reflects whatever
classification logic was live AT THE TIME each item finished — the fix
doesn't retroactively reclassify already-stored results. He was looking at
the SAME earlier run (from before the fix landed), not a fresh one.
**Not yet confirmed** — told him to re-run the same 6-item batch; that
re-run hasn't happened yet as of this note. Offered (not yet built,
awaiting his answer): a "Clear results" button on Bulk Run so an old
batch's stale state can't cause this same confusion again.

Typechecks clean. `shared.ts`/`page.tsx`/`BulkRunPanel.tsx` all touched
again — see `git diff` for the exact shape, this note is the reasoning,
not a diff.

### 6. THIS SESSION (concurrent, manual) — live browser investigation of
dev's verbally-reported email bug between the standalone Pre-Checking
Enquiry and the Deregistration inline flow

Faizuddin relayed a dev comment (imprecisely recalled, not a written
ticket) about "something with the email from the normal flow and the
dereg flow" — asked to reproduce it by hand in the browser rather than
via the `.spec.ts` suite: create a pre-check STANDALONE under one email,
then run Deregistration for the SAME vehicle and check what email the
Deregistration side shows/uses. Credentials `faizuddinAATF`/`password`,
uat1; MyKad emulator instructions read from `knowledge/mykad-emulator.md`
for the localhost:7878 biometric step (not yet reached — see below).

**Real, confirmed finding — relevant to thread 1 above, found
independently before reading it**: the STANDALONE "eDereg Pre-Checking
Enquiry" Step 1 screen (`.../precheck/transaction/main.do`) now ALSO
carries the new "PERAKUAN eDEREG PRE-CHECKING - AATF" declaration text —
not just the Deregistration-side inline popup thread 1 patched today.
Confirmed live via DOM read: it reuses the PRE-EXISTING `#jpjReceiptEmail`
field id (not a new `#dpc-consent-email`-style id), prepopulated from the
AATF company's DB record (`faizuddin@modefair.com` for this account,
matching thread 1's REQ-004/5 finding), freely editable. So the SRD V1.2
declaration was added to BOTH entry points by dev, under TWO DIFFERENT
field ids depending on entry point — standalone reuses `jpjReceiptEmail`,
Deregistration's inline popup uses the new `dpc-consent-email`. Neither
`PrecheckEnquiryPage` (standalone) nor today's `fillConsentEmailIfPresent()`
fix (Deregistration-only) currently accounts for the standalone side
having gained this declaration wording too — `PrecheckEnquiryPage.
fillVehicleAndConsent()` still just fills the old fields blind, which
happens to still work here only because the id didn't change, not because
it was updated for this. Not yet saved as an HTML capture per the standing
rule — **do that first thing next session** (`_reference/html/edereg/
precheck-standalone-perakuan-declaration.html`), then fold into
`knowledge/flow-edereg.md` alongside thread 1's §42.

**In progress, NOT yet reached the actual comparison**: created a fresh
standalone pre-check on vehicle **HXZ8801** with a deliberately distinct
email (`outside-flow-a@test.com`, not the prepopulated company one) to
trace it through. First attempt steered to `VEL000100E` (Faizuddin's own
choice, to confirm the §40 repurchase rule) — Failed as expected. Second
attempt (repurchase, same vehicle + email) currently sitting at the
`#to-payment` "Are you sure to make payment?" native `confirm()` — this is
a REAL native browser dialog (unlike the vehicle-number confirm, which is
a styled DOM element `find()` can click), and Claude-in-Chrome's browser
tools cannot programmatically accept a native dialog; Faizuddin has been
manually clicking Yes/accepting each one live in his own browser session
alongside this one. **Next action on resume: check whether that second
payment attempt reached an Approved result**, then proceed to Create
Deregistration Transaction for HXZ8801 (MyKad category, MyKad emulator per
`knowledge/mykad-emulator.md`) and read whatever email value shows on the
Deregistration side's own consent/vehicle-details screens, to compare
against `outside-flow-a@test.com`. **The actual dev-reported bug has NOT
been reproduced or confirmed yet** — everything above is scaffolding
toward it, not the finding itself.

### Immediate next step

1. **THIS SESSION, resume first**: confirm HXZ8801's second pre-check
   attempt result, then create a Deregistration transaction for the same
   vehicle and read every email field encountered (Step 2's `#email`
   owner-contact field, the `#dpc-consent-email` declaration if it still
   shows given a qualifying pre-check may satisfy the gate immediately
   with no popup at all, the Pre-Checking Details/listing pages) against
   `outside-flow-a@test.com` — that comparison is the actual ask.
2. **Bulk Run HAS now been run live once** (thread 6.5) — TS4/5/6/10/11/12
   as a 6-item batch, which is what surfaced the `PART1_DONE` bug. **Ask
   Faizuddin to re-run that SAME 6-item batch** to confirm the fix: each
   should now show the amber "needs-patch" box + a Copy-for-dev button,
   and all 6 should appear in the main panel's Continuation card. If any
   still show plain green "success," the fix itself has a real gap, not
   just stale cache — check `data.result.part`/`status` are actually
   coming back as `1`/`'PART1_DONE'` for that specific case first.
3. Then the corrected TS2/TS3/TS9/TS11 scripts specifically, to confirm
   the newly-added checklist items (Details Page/Transaction Listing/JPJ
   XML Log lookups via `findTransactionIdByVehicleNo()`) actually resolve
   against real Pre-Checking records, and that the new consent-declaration
   email fix (`fillConsentEmailIfPresent()`) doesn't stall on the real
   popup.
4. **Fix `utils/repurchaseProbe.ts` and `utils/jpjCodeProbe.ts`** for the
   same consent-declaration email requirement — flagged in thread 1, not
   yet done. Also now applies to `PrecheckEnquiryPage.fillVehicleAndConsent()`
   per thread 6's finding above — three call sites outstanding, not two.
5. **Still fully open, untouched today**: the entire 2026-09-04
   automation thread (CPC_E2E_TS2/TS8 3-phase repurchase runs never
   confirmed live, MU_TS5/MU_TS6 flip still pending, TS11/TS12 Part 2
   reruns) — see that section further down this same file.
6. If Bulk Run's true-concurrency version ever gets greenlit: start with
   the eSIM prefix problem (thread 5, item 1) — it's the one that
   silently corrupts results rather than just erroring, so it has to be
   solved first, not last.

### Timesheet

**Not logged in this session** — no CapacityTrack entry created or
verified for 2026-09-11 here. Today's billable-looking work: the
consent-declaration automation fix, the TS1-12 literal-text cross-check
(including the direct-code-read correction), the jira-ticket-study Teams
update, and the Bulk Run feature build (including the two infra bug
fixes and the concurrency scoping discussion).

## 2026-09-10 — no automation run today; this was a scope/requirements
session. Teams (both the general QA chat and the dedicated ticket chat)
studied 9/7 through today, the two dev QA artifacts re-read, a fresh
BA-narrowed TS list built and published, and SRD V1.2 downloaded + studied
cover to cover

Different kind of day for this ticket — nothing from the 2026-09-04
section's automation thread (CPC_E2E_TS2 3-phase repurchase run, MU_TS5/
MU_TS6 flip, TS11/TS12 Part 2 reruns) was touched. That whole thread is
exactly where 2026-09-04 left it — **read that section below if picking
up automation work**, it's a separate, still-open track from what's here.

### 1. Teams studied, 9/7 → 9/10, both the "eAuto QAs" group chat and the
dedicated "EAINT-9306 EAUTO" ticket chat

**Nothing posted on Monday 9/7 in either chat that mentions 9306.**

**Invoice / e-Invoice / JPJ Official Receipt scope addition — REJECTED,
going into its own CR, confirmed NOT part of 9306.** BA raised it 9/8
16:04 (Invoice + e-Invoice show both Dereg and eDereg Pre-Checking data;
new JPJ Official Receipt button needed on Dereg since it doesn't have one
today). Charmain pushed back same day (redundant with the existing eDPC
listing redirect). Batrisyia's 9/8 17:08 update closed it: *"Ops agree to
proceed with whatever we have concluded. **No changes needed.** They will
create new CR for the recent feedback."* **Do not re-litigate this against
the two dev artifacts below — both predate this decision and still
describe the invoice/e-invoice item as if it were live scope. It isn't.**

**Perakuan (declaration) popup — this IS 9306's real scope this week.**
Mei Jia Chee laid out two delivery options 9/9 15:01 (Method 1: ship what
was built + hardcode the email today, add perakuan later; Method 2: hold
everything, ship perakuan together next window). **Method 2 was chosen**
(Charmain confirmed "yup2" 9/9 16:02) — **9306 was pulled from the 9/10
deployment**, retargeting 9/15 night or 9/16 morning. Batrisyia shared the
UI mockup for the perakuan popup 9/9 18:22.

**Email-field question, asked 9/9 16:02, answered 9/10 09:55**: Mei Jia
Chee said the `deregPrecheckCompanyEmail` field is "editable like how they
purchase for the standalone pre checking." **SRD V1.2 (see below) now
formalizes this properly** — it's a real prepopulated + editable field,
not the backend-only/blank-by-default read from the general QA chat's
9/9 15:57 XML-log finding. That earlier finding isn't wrong, just
superseded by the actual requirement once written down.

### 2. Dev's two QA artifacts re-read (`9306 - artifact for QA from dev`)

Per Faizuddin's instruction: **artifact 1 (core gate logic) is settled,
ignore it.** Artifact 2 ("Extra requirements" — the perakuan popup) is the
live one, and it has since been **redeployed in place by dev** to reflect
the 10/9 BA change — same URL, now dated "effective 10 Sep 2026," and it
explicitly distinguishes first-purchase (perakuan shown) from resume/
retry/RE (perakuan not shown, original window). Confirms email validation
detail not in the Teams thread: letters/digits/dot/underscore/hyphen only,
max 100 characters.

### 3. TS list built for the perakuan popup, revised live against the BA
scope call, published as an artifact

Built an 18-feature + 6-regression TS list from artifact 2. **BA then said
directly** ("perakuan we just wan to apply to those first time purchase
ya. no need to apply to those resubmit & RE case") — list revised on the
spot to drop perakuan-reappearance assumptions from every retry/RE test.
SRD V1.2's §2.2.6 (REQ-007) formalizes exactly this rule afterward.

Published as artifact **"Perakuan Scope Study"**:
https://claude.ai/code/artifact/ff148091-1144-4838-be57-efd320fe3eba —
linked from `9306 - artifact for QA from dev`, labelled "Updated
Requirements Study 10/9/2026, 3:35pm". Local source:
`_reference/tickets/EAINT-9306/9306-perakuan-ts-study.html`.

**One open gap in that list, flagged but not yet resolved**: SRD V1.2
names the no-perakuan condition as "resubmitted" payment only — it never
explicitly names the RE/RHB-reset countdown case. TS13–TS16 currently
assume RE falls under the same no-perakuan rule as a normal resubmit.
Worth a one-line confirm with BA/dev before treating that as settled.

### 4. SRD V1.2 downloaded and studied in full (no edits made, per
instruction)

BA uploaded it to Jira today (attachment 156529, PDF, + 156527 docx, +
the HTML mockup as attachment 156528 — all uploaded together by Chee Mei
Jia at 2026-09-10 17:07). No Jira attachment-download tool exists in this
session's toolset — **worked around it via the logged-in Chrome session**:
opened the Jira issue, drove the attachment panel's own "More actions >
Download" control via JS, then copied the file out of
`Downloads\Chrome\` into `_reference/tickets/EAINT-9306/`. Saved as
`SRD_EAINT-9306_eDereg_Pre-Check_Compulsory_in_Deregistration_V1_2_20260910.pdf`.
**Worth remembering as the general pattern for downloading Jira
attachments in future sessions** — no direct MCP tool covers it.

Per its own revision log, V1.2 changed exactly three things (everything
else carries over from V1.1): added §2.2.4 (Declaration Display,
REQ-001–006), §2.2.5 (Declaration Wording), §2.2.6 (Declaration Display
Condition, REQ-007), and updated §1.5 (Associated Documents, added the
HTML mockup reference). All three are now the formal, written version of
what Teams had been saying informally — including the REQ-004/REQ-005
email-field mechanics (prepopulated from a DB value dev has to patch in
until a separate BackOffice enhancement ticket lands to expose it on the
Company Details page; confirmed-in-production example given is Car
Medic's `edereg@carmedic.com.my`) and REQ-007's exact wording: *"Declaration
is displayed 1 time only, on a new transaction where the RHB payment
status is Pending. It is not displayed again when the payment is
resubmitted."*

### Immediate next step

1. **Confirm whether RE (RHB-reset countdown) counts as "resubmitted"**
   for REQ-007's no-perakuan rule — the SRD doesn't name it explicitly.
   Quick BA/dev check, then TS13–TS16 in the Perakuan Scope Study artifact
   are fully settled.
2. **Nothing to test yet** — the perakuan build is targeted for 9/15 night
   or 9/16 morning deployment (Method 2). Nothing in this thread has run
   live.
3. When it lands: run the Perakuan Scope Study TS list (TS1–TS18 +
   TS-R1–R6) as the regression pass Charmain flagged is needed once 9306
   deploys.
4. **Separate and still fully open**: the automation-testing thread from
   2026-09-04 (CPC_E2E_TS2/TS8 3-phase repurchase runs, MU_TS5/MU_TS6
   flip, TS11/TS12 Part 2 reruns). Untouched today — see the 2026-09-04
   section below in this same file.
5. If the invoice/e-invoice/JPJ-receipt CR gets raised as its own ticket,
   it needs its own TS list — none exists yet, since it was never in scope
   for 9306's automation or this week's perakuan study.

### Timesheet

**Not logged in this session** — no CapacityTrack entry created or
verified for 2026-09-10 here. Today's billable-looking work: the Teams
study (both chats, 9/7–9/10), re-reading the two dev artifacts, building
and revising the TS list under live BA input, publishing the Perakuan
Scope Study artifact, and downloading + studying SRD V1.2 end to end.

## 2026-09-04 — JPJ Code Checker built AND run (72 codes, 3 notes found);
then VEL000100E turned out to be a repurchase EXCEPTION, narrowing the
reshow rule and reversing CPC_E2E_TS2's expectation

Busiest session on this ticket in a while. Four distinct threads, in order.

### 1. Studied the repurchase question against SRD V1.1 (§38)

Read `SRD_EAINT-9306_..._V1.1_20260901.pdf` §2.3.2.1 **in full** (pages
13-18) rather than off the changelog pointer — the mistake §33 made once
already. Answer at the time: repurchase depends on WHERE the failure was.
Scenario 2/3 (payment failed) says "process will be repeated from #1";
Scenario 4 (payment OK, JPJ enquiry Failed — new in V1.1) says re-entry
"will be shown again, displaying the same JPJ Pre-Checking Status = Failed
result", i.e. a reshow, no repurchase. That matched the live-observed
reshow rule exactly, which was the reassuring part. **Superseded in part by
thread 3 below** — see §40.

Also cross-checked the dev's own QA test guide
(`EAINT-9306-artifact-qa-test-guide-from-dev.html`) at Faizuddin's request:
it covers the PAYMENT-failure case (scenario 6 — "resumed in retry mode,
with its history", i.e. the SAME record, and creating a fresh row each
attempt was the bug they FIXED) and the abandoned-never-paid case
(scenario 5 — reused, not duplicated). It says **nothing** about the
JPJ-enquiry-failure re-entry case, and its own opening line ("creates (or
resumes) a precheck and opens the payment dialog inline") is what led
everyone to expect an actionable dialog every time. That silence is
precisely why the reshow took four failed tests to find.

### 2. Built the JPJ Code Checker — and it RAN CLEAN, first time

New third tab on `/eauto/edereg-precheck` ("JPJ Code Checker"), for
cataloguing what NOTE each JPJ response code shows on the pre-check result
popup. Paste the code list from Excel into a textarea; per code it steers
eSIM, types the next running vehicle number at Step 2, pays, screenshots +
scrapes the popup, closes, and moves on. Never completes a Deregistration.

- New `utils/jpjCodeProbe.ts` (dialog reader + PNG proof shot),
  `tests/edereg-precheck-jpj-code-checker.spec.ts`, project
  `edereg-precheck-jpj-codes` (`video: 'off'` — a multi-hour run's recording
  is huge and worthless), `JpjCodeCheckerTab.tsx`, and
  `api/.../jpj-codes/download` (zip of PNGs + `summary.csv`; `?file=` serves
  one for inline thumbnails).
- `DeregTransactionPage` deliberately UNTOUCHED — `resolveVehicleGate()`
  reads only 2 fields and nothing at all on its reshow branch, so it
  couldn't serve this without being changed.
- **It has NO assertions, by explicit instruction.** A checker has no
  expected result; an unfamiliar note IS the answer. `status` is
  `COMPLETE`/`STOPPED_EARLY`, never `FAIL`; three probe failures in a row
  self-heal by rebuilding the Deregistration draft; only a VPN drop ends it
  early, gracefully. **Do not add assertions to that spec.**
- Rows flush to `jpj-code-results.json` after every code and a re-run skips
  codes already captured, so Stop is safe and batching works.

**FIRST LIVE RUN, 72 codes, uat1: 72/72 read, 72/72 screenshots.** Result —
only TWO codes get a specific note; the other 70 share one generic message:

| Note | Colour | Codes | Attribute rows |
|---|---|---|---|
| "The system is currently unavailable. Kindly contact our Customer Service at 03-27798899" | black | **70** | absent |
| "Unable to proceed for eDereg" | red | 1 — `VEL000100E` | present |
| "Able to proceed for eDereg" | *neither red nor black* | 1 — `GLB000000I` | present |

That third note was a genuine DISCOVERY — not one of the two shapes the
reference captures established. Direct vindication of the no-assertions
rule: a build asserting "note must be one of the two known values" would
have reported a false failure on the success code.

Two follow-ups from it: **(a)** the estimate constant
(`SECONDS_PER_CODE = 90`) is a guess, and the eSIM leg dominates because
`setEsimResponseCode()` spawns a WHOLE new Playwright process per code
(runner boot + fresh Chromium + eSIM login + list + edit + save + teardown,
all over the VPN). Doing the eSIM edit in-session — log in once, then just
goto/fill/save per code — would cut ~40-70s per code to ~4-8s, i.e. ~108
min down to ~30-40 min for 72 codes. **Scoped and offered, NOT built** —
Faizuddin hasn't decided. **(b)** `GLB000000I`'s note colour recorded as
empty because `readPrecheckResultDialog()` only tests for `red`/`black`
classes; it's presumably `green`. Screenshot has the truth, the field
doesn't. One-line fix whenever it matters.

Also added, after he asked: a **"Copy 2 columns"** button (error code + note
only, sorted, `read` rows only) alongside the renamed "Copy all columns" —
the 9-column export is more than a Teams message needs.

Full write-up: `knowledge/flow-edereg.md` **§39**.

### 3. ⚠️ THE BIG ONE — VEL000100E allows REPURCHASE (§40)

Faizuddin, directly: **`VEL000100E` is the ONLY code that allows a
repurchase. Each repurchase creates a brand-new pre-check transaction (not a
resume, not a mutation). It is repeatable without limit.**

This NARROWS the reshow rule rather than replacing it. Corrected statement:

> Once a vehicle has a FAILED pre-check on file, re-entry at Step 2 only
> reshows the stale result — **except when the failure was `VEL000100E`,
> which offers a fresh purchase and creates a new transaction each time.**

Same kind of narrowing §37 already found (an EXPIRED record doesn't trigger
the reshow, only a FAILED one) — one level deeper: not every Failed record
behaves alike, the response code matters.

**UNRESOLVED CONFLICT — read this before running anything.** Three tests
recorded `dialogShape: 'closed-direct'` (the reshow) on runs steered to
**VEL000100E**, the very code that should have sold them another:

| § | Test | Observed |
|---|---|---|
| §33 | CPC_E2E_TS2 | `closed-direct` on HXA122, HXA123, HXA131 |
| §35 | MU_TS5 | `closed-direct` on User A's redo |
| §36 | MU_TS6 | `closed-direct` on User B's first-ever entry |

(§37/TS11 Part 2 also saw the reshow but on **VEL000045E**, so it's
consistent with the new rule and unaffected.)

**Most plausible reconciliation, NOT verified**: the app shows the previous
failed result FIRST (Close-only), clears the Vehicle No. field, and only
offers a fresh payment popup on a FURTHER re-entry — and
`resolveVehicleGate()`, which returns the instant it sees a Close button,
stopped one step short. None of those three tests entered the number a third
time. That would make both facts true at once. The alternative is a fix
landing between 2026-09-02 and now.

So `utils/repurchaseProbe.ts` is written to **observe, not assume**: it
re-enters the number over N rounds, classifies each as `paid`/`reshow`, and
counts Pre-Checking listing rows before/after — on a **throwaway tab**
(`context.newPage()`), because `countTransactionsForVehicle()` navigates via
`goto()` and would otherwise strand the open Step 2 form, which is exactly
§35's own bug.

### 4. CPC_E2E_TS2 + TS8 rewritten: repurchase, then run to completion

Both now three phases:
1. Pre-check fails on `VEL000100E` (standalone for TS2, inline for TS8).
2. `probeRepurchase(..., 2)` — two repurchases, each must be OFFERED and add
   its own listing row.
3. `ensureEsimHappyPath()` re-steers to `GLB000000I`, then
   `fillVehicleDetails()` buys ONE final pre-check (that call runs
   `resolveVehicleGate()` internally, so it IS the final purchase) which
   comes back Approved → `ownerConsentAndAuth` → `aatfConsentAndAuth` →
   `jpjCheck` → `payAndDeregister` → `verifyPrecheckingYesLink`, to Done.

Phase 3 was added on Faizuddin's explicit "yes" after he asked whether TS2
retried payment and proceeded to completion. It's REQUIRED, not optional:
while the code stays `VEL000100E` every pre-check fails, so the gate can
never go green and no number of repurchases could finish a Deregistration.
Re-steering is what makes the repurchase right meaningful.

Structural notes for whoever runs these:
- **The MyKad emulator + `DeregTransactionPage` now live for the WHOLE
  test.** Both specs used to close the emulator right after the gate step;
  phase 3 needs three more thumbprint auths, so closing early stranded them.
- **`test.setTimeout` 9 → 25 min** on both (up to five real payments + four
  eSIM spawns per run). Still inside the run route's 40-min cap, so a hang
  fails in the test — with a step list and video — not in the route.
- `dialogShape` from the first re-entry is REPORTED, never asserted — that's
  §40's open question, and the `verdict` block in each RESULT spells out
  exactly which phase failed so nobody has to dig through nested JSON.
- **Cost**: a TS2 run makes up to FIVE real payments on UAT at RM10.40 each
  (standalone, first re-entry, two repurchases, final Approved). TS8 is one
  fewer.
- **CPC_E2E_TS6 Part 1 untouched** — steers VEL000100E but never reaches the
  Step 2 gate, so repurchase doesn't arise.

Dashboard labels for both updated to "… → repurchase → complete".

### 5. All QA issues DROPPED for good (§41)

Per Faizuddin: **every bug ticket raised out of this study is closed
permanently — all of it miscommunication, not defects.** Explicitly includes
**EAINT-12268**.

Recorded as its own section (§41) rather than a one-line edit, because
EAINT-12268 is cited in six places across `flow-edereg.md` plus
`DeregTransactionPage.ts` — those citations explain WHY three tests look the
way they do, so they stay as history while §41 is the single authority on
STATUS. Also guarded there: don't infer an open defect from a `FAIL` in this
suite (MU_TS6 deliberately asserts 1 row and flags the real 2-row outcome as
FAIL; §37's TS11 plan step is unachievable by design), and the two findings
never raised as tickets (§39's 70-of-72 generic note, §40's SRD gap) stay
unraised as BA/product conversations.

### Immediate next step

1. **Run CPC_E2E_TS2 in its new 3-phase form** — this is the priority. It
   settles §40's open mechanism question (does VEL000100E reshow once then
   sell, or sell straight away?) and it's the gate on item 2. Nothing else
   from today has been run live.
2. **Then flip MU_TS5 and MU_TS6** — both VEL000100E, both currently assert
   the reshow, both suspect. Deliberately NOT rewritten yet: MU_TS6's
   premise has already been rewritten twice and the ORIGINAL abandoned
   premise ("User B is offered a real purchase of their own") is what §40
   would RESTORE. A third rewrite on inference isn't worth it — confirm with
   TS2 first, then do both in one pass. MU_TS6's company-scoping half is
   independent and may well still hold.
3. **Run CPC_E2E_TS8's new form** too (same three phases, inline entry).
4. **Decide on the eSIM in-session optimisation** (thread 2a above) — worth
   ~70 min on a 72-code sweep, costs ~60 lines of new eSIM code in the
   edereg suite plus `ignoreHTTPSErrors` on that one project.
5. **Still outstanding from 2026-09-03, untouched today**: re-run
   CPC_E2E_TS11 Part 2 in its corrected form; run CPC_E2E_TS12 Part 2 (never
   run live in any form — open question on whether RHB "ER" auto-cancels
   after ONE declined payment); and finish §36's reshow-rule audit sweep of
   CPC_E2E_TS4/TS5/TS6 Part 2 + TS12 Part 2. §40 makes that audit MORE
   valuable, not less — it now has to check the response code per case, not
   just "was there a Failed record".

### Timesheet

**NOT logged in this session** — no CapacityTrack entry was created or
verified for 2026-09-04 here. Still to do at EOD, covering: the SRD V1.1
repurchase study, the JPJ Code Checker build + its 72-code live run, the
§40 rule capture and the TS2/TS8 rewrites. Also unlogged and separate:
anything on EAINT-12257 (DuitNow QR) from the same day.

## 2026-09-03 — CPC_E2E_TS11 Part 2's FIRST live run failed on the reshow
rule, exactly as §36 predicted; redefined rather than raised as a bug

Short, single-issue session. Picked up from the standing reminder that
CPC_E2E_TS11/TS12 Part 2 had both been rewritten 2026-08-27 and never run
live. Faizuddin ran **TS11 Part 2** (uat1, prefix HX) — it failed:
`Expected the retry to come back Approved (GLB000000I) — got
satisfied=false (undefined / undefined)`.

**Diagnosis (not a script flake — a real, already-documented app rule).**
The first attempt was perfect and is worth keeping as positive evidence:
on Part 1's now-EXPIRED pre-check the gate offered a genuinely fresh
purchase (`dialogShape: 'paid'`, full payment round trip), which came back
`Failed / VEL000045E - PLEASE CONTACT HELPDESK - VELVE`, Vehicle No. field
blank after Close. The SECOND attempt — after `ensureEsimHappyPath()`
re-steered Dereg Precheck to GLB000000I — returned `satisfied=false` with
`jpjStatus`/`responseDesc` both `undefined`, logging
`dereg-step2-inline-precheck-closed: "Vehicle No. field blank after Close:
false"`. That message is emitted ONLY by `resolveVehicleGate()`'s
`closed-direct` branch, and the `undefined` fields are that branch's own
tell (it never reads `#jpjStatusLabel`/`#responseDesc`). It had reshown the
first attempt's stale Failed result.

Root cause is the company-scoped Failed-precheck reshow rule already
settled in §33/§35/§36: once a vehicle has a Failed pre-check on file, any
later entry only redisplays it — no fresh JPJ check runs, so eSIM
re-steering is a no-op and Approved is unreachable via a retry.

**Key distinction worth remembering: the reshow keys on a FAILED record,
not an EXPIRED one.** That's precisely why CPC_E2E_TS10 Part 2 stays valid
(it never fails a first attempt, so no Failed record ever exists) while
TS11 Part 2 did not.

**Why this file was stale**: written 2026-08-27, FIVE DAYS before the
reshow rule was discovered (2026-09-02), and deliberately modelled on
CPC_E2E_TS9's then-current "resolveVehicleGate() twice, re-steer between
attempts" retry pattern — the very pattern TS9 was itself rewritten to
abandon. §36's closing note called this exactly.

**Resolution — Faizuddin chose "redefine the test", NOT "raise a QA
issue"** (asked explicitly, given the §36 precedent of confirming before
rewriting a premise). Same fix already applied to TS9/MU_TS5/MU_TS6:
- Now asserts the reshow: `firstAttempt` = `satisfied: false` +
  `dialogShape: 'paid'`; `secondAttempt` = `satisfied: false` +
  `dialogShape: 'closed-direct'`. **Both shapes are now hard-checked** —
  the old build checked neither, which is why the failure surfaced as a
  cryptic `undefined / undefined` instead of a clear "it reshowed."
- Dropped as unreachable from a VEL000045E first attempt:
  `submitVehicleDetails`, `ownerConsentAndAuth`, `aatfConsentAndAuth`,
  `jpjCheck`, `payAndDeregister`, `runPostDeregSrdChecklist()` (all 4 of
  its items need a completed Deregistration on screen).
- Kept but NOT asserted: the plan's "Ensure details in eDereg Pre-Checking
  Listing are displayed correctly", via `getListingStatusForVehicle()` at
  the very END and reported only. Last because reading it between the two
  attempts would navigate away from the still-open Step 2 form; soft
  because no expected row shape for this setup has ever been confirmed
  live, and asserting a guessed one would repeat the exact mistake this
  rewrite fixes.
- Test title updated to "JPJ-error then re-entry reshows the same result".
  **No dashboard change needed** — Part 2 options are generated
  dynamically as `{tsNo} — Part 2`, not listed statically in `TEST_CASES`.

Typecheck clean (note: the root `tsconfig.json` EXCLUDES `scripts/`, so
`npx tsc --noEmit` at the repo root does NOT cover this suite — check specs
directly from `scripts/eauto-edereg-precheck/`). NOT yet re-run live in
this corrected form.

**Deliberately NOT raised as a bug.** TS11's literal plan text still says
"Set eSim Dereg Enq. Response = GLB000000I > Continue with eDereg Trx
Status = Approved, Payment = OK, JPJ Pre-Checking = OK > Go to Details
Page > Ensure Yes hyperlink is displayed and click it". Per the §33 step-3
ruling (Faizuddin, overriding an SRD-literal reading, after which
EAINT-12268 was manually corrected), the reshow is CORRECT behaviour — so
that plan step is unachievable, not a defect. **If the team wants that
coverage back, it needs a test-plan change, not a script change.**

Written up in full as `knowledge/flow-edereg.md` **§37**.

### Immediate next step
1. **Re-run CPC_E2E_TS11 Part 2** in its corrected form (needs a fresh
   Part 1 + a dev expiry patch first) — never run as rewritten.
2. **Run CPC_E2E_TS12 Part 2** — still never run live in ANY form. Its own
   open question stands: whether RHB "ER" (API Down) auto-cancels after
   exactly ONE declined payment (what the build assumes) or takes several.
   If the first run shows the record still Failed rather than Cancelled,
   add more attempts before the resubmit check.
3. **Finish §36's sweep — still outstanding.** CPC_E2E_TS4/TS5/TS6 Part 2
   and TS12 Part 2 all involve a Failed/declined first attempt followed by
   further action on the same vehicle, and none have been audited against
   the reshow rule. TS12 Part 2 is least likely to be affected (it expects
   its single decline to end Cancelled, not a later attempt to succeed).
   TS11 was the first to prove the risk is real — worth auditing these on
   paper before burning live runs on them.

### Timesheet — logged same day

CapacityTrack entry submitted and verified for 2026-09-03: **eAuto Core ·
EAINT-9306 · Billable · Delivery · 2h 30m**, covering the TS11 Part 2 live
run, the diagnosis, the rewrite, the documentation, and the test-evidence
cleanup as one block (Faizuddin's own call — one duration for the whole
session rather than split entries). Blocked deliberately NOT ticked: the
dev expiry patch is a normal precondition of a two-part case, not a live
blocker. Remark carries `CR Progress: 42/42 (100%)` and `Test Evidence
clean and upload: Complete` as their own lines.

Day total at time of logging was 2h 30m of 8h (logged mid-afternoon; the
rest of 2026-09-03 was to be logged at EOD). Not logged here and still
outstanding for that day: the EAINT-12257 DuitNow QR scope session from
earlier the same morning, and the team standup if one happened.

## 2026-09-02 — round 2: CPC_E2E_TS2 live debugging spiraled into a
company-scoped "Failed pre-check reshow" rule that broke TS9, MU_TS5, and
MU_TS6, all now rewritten to match

Long back-and-forth debugging CPC_E2E_TS2 live, several wrong turns
correctly caught and fixed in order — kept here so nobody re-litigates them:

1. **Dashboard 404s fixed** — stale `.next` cache after the big `WA Blaster
   Code Reference` → `_reference/codebases/wa-blaster` rename confused the
   dev server. Killed it, deleted `.next`, restarted; routes 200 again.
2. **CPC_E2E_TS2 first live run failed** at `resolveVehicleGate()` waiting
   for a "Next" button that never appeared — traced via a Snagit capture to
   a DIFFERENT dialog shape (single "Close" button, no payment step) for a
   vehicle that already has a Failed pre-check on file. Added
   `dialogShape: 'paid' | 'closed-direct'` detection to
   `DeregTransactionPage.resolveVehicleGate()`.
3. **Wrong SRD citation caught and fixed** — first pass cited SRD V1.0
   Scenario 2/3 (wrong scenario, and wrong version — V1.1's own changelog
   flagged the EXACT section this bug lives in, missed the first time).
   Re-read V1.1 in full, found NEW Scenario 4, raised **EAINT-12268** citing
   it.
4. **Faizuddin corrected the SRD reading directly** — a vehicle with an
   existing Failed pre-check should just PULL UP and DISPLAY that result
   (`dialogShape: 'closed-direct'`), Close does nothing further. NOT a bug.
   Reverted the automation's pass condition to match; Faizuddin fixed
   EAINT-12268's Jira description himself.
5. **Page-load timing rule added** — root-caused a separate confusing
   symptom (wrong popup message) to filling `#vehicleRegNo` right after
   `domcontentloaded`, before the page's own JS settled. New repo-wide rule:
   `knowledge/automation-playbook.md` § "Page-load timing" — wait for load,
   then hold 2s more, before ANY input, across the whole suite (not just
   this ticket). New `PrecheckSession.waitForPageSettled()` helper.
6. **Extended the reshow rule to CPC_E2E_TS9** — per Faizuddin, applies to
   an INLINE Failed pre-check too, not just a standalone one. TS9's whole
   "retry after re-steering eSIM succeeds" premise no longer holds — fully
   rewritten to expect the SAME reshow on the second entry instead.
7. **CPC_E2E_TS3 renumbered** — the literal CURRENT test-plan text Faizuddin
   pasted for TS3 (VEL000045E, MyKad, Deregistration continuation) doesn't
   match what was built as "TS3" since 2026-08-27 (RHB API Down). Confirmed
   with Faizuddin: TS3's real definition changed. Real TS3 built fresh
   (`edereg-precheck-ts3-jpj-error.spec.ts`); old RHB-API-Down build
   renamed away from "TS3" (now "[TS TBD]"), then REMOVED from the
   dashboard picker entirely per Faizuddin (commented out, not deleted —
   same pattern as `mu-ts9b`).
8. **MU_TS5 first live run failed the SAME way as TS9** — rewritten so both
   User A's and User C's "redo" now correctly expect the reshow, not
   Approved. Redefined what "isolation" means here (reshow stays scoped
   per-company, not "Approved state doesn't leak" — Approved was never
   reachable to leak in the first place).
9. **MU_TS6 first live run revealed a BIGGER version of the same bug** — the
   reshow is COMPANY-scoped, not draft/session-scoped: User B's own
   brand-new Deregistration (separate login, never touched this vehicle
   before) ALSO just got the reshow instead of a fresh purchase. MU_TS6's
   whole premise ("User B supersedes User A's Failed record with a
   completed Deregistration") is provably unreachable now — fully
   rewritten to prove the reshow crosses sessions instead.

**Everything above is now typecheck-clean but NOT re-run live in corrected
form.** Full details, every citation, and the exact code changed:
`knowledge/flow-edereg.md` §33-36.

**Standing warning for next time, per §36's own closing note**: any OTHER
test in this suite that assumes a Failed pre-check gets superseded/resolved
by a LATER attempt (same company OR different) should be treated as
suspect until checked against this now-confirmed company-scoped reshow
rule — this wasn't a one-off in three separate tests, it's a real pattern
in the app. Check case-by-case as each is next run live.

## 2026-09-02 — OF_TS4 tested manually, found broken, QA-Issue raised

Faizuddin ran OF_TS4 (Pre-Checking Reset Payment) by hand, not via the
automation built 2026-08-26/28 — that build has still never been run live
(see the 2026-08-26 entry below). Two symptoms found: after a dev resets
the payment mid pre-checking enquiry, retriggering it directly throws an
error demanding the user choose a payment method again instead of resuming
the reset payment; separately, resubmitting the same transaction via the
eDereg Pre-Checking Transaction Listing page shows a blank page with only
a title, no payment form at all. Neither matches the test plan's own
expected result for OF_TS4 ("Rhb payment internal error, please try again
later." → able to proceed after resetting payment).

**QA-Issue raised**: **EAINT-12258** (`/skills eauto-qa-issue-ticket`),
under parent EAINT-9306, priority Medium, environment staging/uat1, status
To Do (not on hold), Developer/assignee left blank per Faizuddin's own
instruction (no prior QA-Issue under this parent had one set to suggest a
default from). Staging Test reference: Trx ID
`ee03cef1-30ea-4e46-a946-df64076b65fc`. Expected-result cell cites the QA
Test Plan's own OF_TS4 row directly (text only — no Chrome/browser-
automation tooling was available in this session to embed a screenshot
inline, same recurring limitation as EAINT-12233/-12240's own unattached
evidence). **Faizuddin is attaching the reproduction video to the ticket
himself** — it's a video, which per the skill's own findings can't be
embedded inline via automation anyway (silently dropped even when
`file_upload` "succeeds"), so this was always going to be a manual step.

## 2026-08-28 — round 2: the first simultaneous-run fix was incomplete —
Playwright itself wipes its shared output folder on every run, root-caused
and fixed for real this time

You tried the round-1 fix live: "running both at the same time in
different tabs did not work. the popup will only show one or the other.
not both at the same time." Dug into Playwright's own runner source and
confirmed the real cause: `npx playwright test` deletes its ENTIRE
`outputDir` at the start of every invocation, and every project in this
suite shares ONE `outputDir` (`test-results/`). Starting MU_TS12 while
MU_TS11 was paused wiped the whole folder — including MU_TS11's pause
file — regardless of the runId-scoped filenames from round 1.

**Fixed for real**: pause/continue files moved to a new `.run-signals/`
folder (never Playwright's own outputDir, so nothing wipes it) —
`utils/pauseSignal.ts` + the `pause-status`/`continue` routes. Separately,
each spawned Playwright process now gets its OWN `--output
test-results-<runId>` folder (`run/route.ts`), so its startup wipe only
ever touches its own run. Updated the 14 files that hardcoded the old
shared `test-results` path for their manual browser-context recordings
(every MU_TS spec, dual-create, `srdChecklist.ts`) to use a new shared
`videoRunDir()` helper instead — all resolve to the same per-run folder
via `DPC_RUN_ID`. `publishVideos()` cleans up each run's scratch folder
after copying its videos out, so these don't pile up on disk. Added the
new folder patterns to `.gitignore`. Typecheck clean on both sides.

**NOT yet re-tried live** — this is the actual fix for what you hit;
next time you run two tests together is the real test of it.

**Superseded in part 2026-09-11**: `publishVideos()`'s own FINAL published
output (`public/qa-artifacts/eauto-edereg-precheck`) was still ONE shared,
wiped-every-run folder even after this fix — this fix only scoped the
Playwright-side scratch `test-results-<runId>` folders and the pause
files, not the published-video destination. See this file's 2026-09-11
section, thread 4, for the fix (per-run `PUBLIC_ART/<runId>/` subfolder +
`pruneOldRunFolders()`), found while building Bulk Run.

## 2026-08-28 — dashboard now supports running two tests simultaneously (no
script changes) — built specifically so MU_TS11 + MU_TS12 can be batched
into ONE dev handoff instead of two

You asked if MU_TS11 and MU_TS12 could run at the same time so the dev
doesn't have to patch data one-by-one, explicitly NOT wanting the test
scripts combined — just the automation as-is, run in two tabs, with all 4
transaction IDs copyable. Confirmed the blocker was the DASHBOARD's own
plumbing (single global pause/continue files + single-run server state),
not the tests — fixed with a per-run `runId` (client-generated
`crypto.randomUUID()`) threaded through `runState.ts` (now a Map),
`pauseSignal.ts` (scoped filenames via `DPC_RUN_ID`), and the
pause-status/continue/live-log/run routes. Typecheck clean on both the
Next.js app and the scripts side.

**How to use it**: open the dashboard in two browser tabs, run MU_TS11 in
one and MU_TS12 in the other. Both will pause independently with their own
Continue button and their own Copy-transactions button (MU_TS11 gives 2
IDs, MU_TS12 gives 1) — copy from each tab and combine into one message to
the dev, then click Continue on each once the dev confirms both are
patched.

**Known gaps, not fixed** (flagged in `knowledge/flow-edereg.md`, not
urgent for this use case): video publishing is still one shared folder
(two runs finishing close together could overwrite each other's video
files on disk, though each tab's own in-memory video links stay correct),
and the VPN reset-timer banner is still global (only matters for
TS5/TS11 Part 2's own RE wait, which MU_TS11/TS12 never trigger). NOT yet
tried live — first real test of this is whenever you actually run
MU_TS11 + MU_TS12 together.

**Video-publishing gap fixed 2026-09-11** — see this file's own section
above (thread 4). The VPN reset-timer banner is STILL global/unfixed —
flagged again during the 2026-09-11 concurrency scoping discussion
(thread 5), still low-risk for MU_TS11/TS12 specifically, higher-risk for
a general Bulk Run batch that could include TS5/TS11.

## 2026-08-28 — MU_TS11's "refresh Step 2" was built WRONG — refresh means
a literal browser refresh, not cancel-and-start-a-new-Deregistration

You caught it from the live run's own log/behavior and corrected it
directly: "REFRESH MEANS REFRESH THE PAYMENT." The build's own step 6
("User A & User B refresh Step 2") was interpreted as cancel the stale
popup + start a whole new Deregistration transaction (going back through
MyKad IC auth) — explicitly NOT a literal reload, per the spec's own
comment claiming this was "confirmed directly with Faizuddin before
building." That confirmation landed on the wrong shared understanding.
Real meaning: a literal `page.reload()` on Step 2's own still-open popup —
the SAME action MU_TS9 already exercises on a Cancelled record (silently
blank, no dialog, EAINT-12233) — just against an Expired record this time,
which MU_TS9 never covered.

Corrected in `knowledge/flow-edereg.md` §30 (old reasoning kept, labelled
WRONG, for the history), **and MU_TS11's spec itself is now REBUILT**: the
cancel-then-new-Deregistration step is gone, replaced with a local
`reloadAndCaptureDialog()` helper (same shape as MU_TS9B's own) doing a
literal `page.reload()`/`userBPage.reload()` on each user's own still-open
Step 2 tab. Logged, not hard-asserted (unconfirmed whether an Expired
record refreshes silently like MU_TS9's Cancelled one did, or shows
something). Step 8's Resubmit check is untouched — but today's
Resubmit-found result from BEFORE the rebuild still doesn't count as a
confirmed app inconsistency, since that run reached it via the wrong
action. Typecheck clean. NEVER RUN LIVE in this corrected form.

**Also checked MU_TS12 for the same mistake, per your follow-up — it's
clean.** MU_TS12 never has a "refresh" step at all; it only calls
`createFromHome()` once and uses active retry clicks
(`attemptStandaloneRetryAfterCancellation()`/`attemptInlineRetryAfterCancellation()`)
for its own "attempt to make/retry payment" steps. Built correctly from
day one, nothing to fix there.

## 2026-08-28 — cronjob ALSO skips same-day records — likely explains
EAINT-12240, re-evaluate before treating it as a real bug

Per Faizuddin, confirmed: the 23:59:59 cronjob checks each candidate row's
creation date, and a row created the SAME calendar day as the run is
skipped — it only becomes eligible at the FOLLOWING day's run. This
retroactively explains CJ_TS1's own "stuck on Failed" result from earlier
today: vehicle HXA088 was created at 11:36 AM and checked at 11:50 AM/
3:12 PM the SAME day, well before that night's run could even consider it.
**EAINT-12240 may not be a real bug** — re-run CJ_TS1 Part 2 on a record
that's now at least a full calendar day old before drawing any conclusion.
Documented in `knowledge/flow-edereg.md` §5.5, and flagged directly in
`edereg-precheck-cj-ts1-part2.spec.ts`/`cj-ts5-part2.spec.ts`'s own header
comments so this isn't rediscovered from scratch.

(A "7 days" reading was floated and retracted the same day — **1 day is
the confirmed figure**, per Faizuddin's own correction right after.)

## 2026-08-28 — rest of today's progress: dashboard fixes, video trim tool,
CJ_TS1's first live run (real bug found + ticket raised)

Dashboard/tooling work, outside the EX_TS build covered below:
- **Sidebar dropdowns now start collapsed** (`components/Sidebar.tsx`) —
  all four groups (JIRA, Productivity, eAuto, Tickets) default closed;
  click to expand. Includes the "Tickets" group that holds the 9306 link.
- **Copy buttons added to the log panels** (`app/eauto/edereg-precheck/page.tsx`)
  — both the live log (while running) and the raw run log (after) now have
  a Copy button next to their collapse toggle.
- **Single-video trim tool built** — new
  `app/api/eauto-edereg-precheck/trim-video/route.ts` (ffmpeg trim+concat,
  frame-accurate, outputs to a separate `eauto-edereg-precheck-trimmed/`
  folder so it survives the next run's video-republish cleanup) + a
  `VideoTrimPanel` component on the dashboard — mark segments to KEEP off
  the existing video player, export, get a trimmed clip + download link.
  Side-by-side (horizontal-only) combine was discussed but NOT built —
  scoped, not started. Not yet tried live.
- **CJ_TS1 Part 1 now also steers the JPJ code to VEL** (belt-and-suspenders,
  per your request) — `tests/edereg-precheck-cj-ts1-part1.spec.ts`, via
  `setEsimResponseCode()` directly (not `ensureEsimJpjErrorPath()`, which
  would've undone the RHB "IF" steer this test also needs). Part 2
  untouched.
- **VPN-gate dashboard bug found and fixed**: the Run button's VPN
  confirmation only ever checked `TEST_CASES.find(...)?.skipVpnGate`, but
  every two-part case's own Part 2 is a dynamically-generated continuation
  that never appears in `TEST_CASES` — so it always asked for VPN
  confirmation, even for CJ_TS1-5 Part 2 and EX_TS8 Part 2, neither of
  which touches `utils/esim.ts` (confirmed by grepping every Part 2 spec).
  Fixed with a new `VPN_GATE_SKIP_TEST_CASES` set. TS4/5/6/10/11/12's own
  Part 2s deliberately left alone — those DO re-steer eSIM.

**CJ_TS1's first-ever live run, both parts**: Part 1 ran clean (VPN gate
correctly skipped after the fix, RHB "IF" declined as expected, transaction
persisted). Part 2 — run twice, ~1h22m apart (11:50 AM and 3:12 PM) —
**FAILED both times**: vehicle HXA088's Failed pre-check (PC68001241) never
flipped to Expired, while OTHER rows in the same BackOffice listing (e.g.
HXA091, PC68001245) correctly show Expired in both captures — proving the
cronjob runs and works in general, it's just not picking up HXA088's
record specifically. This is a REAL backend bug, not a script issue or a
"cronjob hasn't run yet" timing question.

**QA-Issue raised**: **EAINT-12240** (`/skills eauto-qa-issue-ticket`),
under parent EAINT-9306, priority Medium, status To Do (not on hold),
Developer left unassigned (you said "ignore this part" when asked who to
assign — pick a dev and set it whenever). **The two before/after
screenshots still need manually attaching** — no Chrome-driving/
device-bridge tooling was available in this session to embed them, same
recurring limitation as MU_TS9's own still-unattached screenshot (item 8
below). Drag `4.png` (11:50 AM) and `5.png` (3:12 PM) into the ticket's
Actual Result cell or Attachments panel yourself.

## 2026-08-28 — almost all of the "Immediate next step" re-run list done
manually by Faizuddin, off-session

He ran almost all of the numbered re-runs below himself (outside this
session, results not yet reported here). **No action needed from Claude
on those items right now** — status is open for discussion whenever he
wants to walk through outcomes. Do not assume PASS/FAIL for any of them
until he says so explicitly; nothing in this file has been updated with
real results yet. Still untouched: attaching the MU_TS9 screenshot to
EAINT-12233 (item 8), and the TS4/TS5/TS6 literal-test-plan audit (item 9)
— both still open as originally written.

## 2026-08-28 — "Extra" group built: 7 new TS filling gaps found by
cross-checking the dev's QA test guide against every existing TS

You asked to crosscheck this suite's automation against the dev-authored
QA test guide's own 10 scenarios, then build automation for everything
found not-covered/partially-covered (excluding "haven't been run live,"
which every TS in this suite shares anyway). Built **EX_TS1–EX_TS7** under
a new "Extra" dashboard group — full reasoning, the exact gap each one
fills, and 5 flagged open questions per-test: `knowledge/flow-edereg.md`'s
new "Extra" section (right after "Others"). Typecheck clean. NEVER RUN
LIVE, any of them — this is entirely today's build, nothing exercised.

You then answered the 5 compiled questions one by one (all "recommended"
options, no changes to EX_TS1/4/7's flagged assumptions), plus a 6th:
build the "Expired" subtype after all. **EX_TS8 (Part 1/Part 2) built** —
classic two-part split like CJ_TS1-5, Part 1 identical to CJ_TS1 Part 1,
Part 2 goes further (fresh Deregistration, confirm gate still blocked).
Dashboard testCase `ex-ts8-part1` (Part 2 dynamic-only, usual convention).
Typecheck clean. NEVER RUN LIVE.

**Not built, needs your input before it can be**: guide scenario 10's
back-office half ("eDereg Pre-Checking: Yes" row check on the BO Dereg
enquiry view) — no BO Dereg-enquiry page HTML has ever been captured in
this suite (only BO precheck-listing/login/JPJ-log pages exist), and per
the repo's own standing rule, selectors don't get guessed for an uncaptured
page. **You said you'll paste that page's HTML** (BO → Dereg enquiry →
view, for any transaction) in a later session — this can be built the same
way everything else was once you do.

## 2026-08-28 — OF_TS4 corrected: Part 2 was using a NEW transaction, must
stay on the SAME one; rebuilt as a single pause/continue run

Per Faizuddin: "there's an issue with this logic. the part 2 cannot use
another transaction. it must use the same transaction. so basically, the
automation needs to stay on the same transaction, i will ask dev to patch
the payment transaction, and tell the automation to continue running it."
The original two-file build (Part 1 declines RHB IF and hands off a Trx ID,
Part 2 creates a BRAND NEW Deregistration on the same vehicle no.) was the
wrong shape for a payment reset — unlike the expiry-patch two-part cases
(TS4/5/6/10/11/12) where only the record's age changes, here the dev
patches THIS specific transaction, so the automation has to still be
looking at it afterward. Rebuilt as a single run using the same dashboard
pause/continue mechanism MU_TS11/TS12 already use
(`utils/pauseSignal.ts`): `tests/edereg-precheck-of-ts4.spec.ts`, project
`edereg-precheck-of-ts4`, dashboard testCase `of-ts4` (single entry, no
continuation). Old `of-ts4-part1`/`-part2` files, projects, and dashboard
wiring deleted. Full reasoning: `knowledge/flow-edereg.md` §18 (rewritten).
NEVER RUN LIVE — same open question as MU_TS11/TS12: whether the
`#precheck-popup` genuinely survives the pause/continue round-trip has no
confirmed live evidence yet for ANY case using this mechanism.

## 2026-08-27 — MU_TS7 run live, PASSED, no bugs

Both previously-unconfirmed shapes resolved clean:
- `resumePendingPayment()` on a genuine Pending/never-attempted record
  renders `#to-payment` ("NEXT"), not `#to-retry-rhb` — the either-or guess
  picked the right branch.
- Re-entering Deregistration after the abandoned Step 2 popup did NOT
  collide with MU_TS6's "resumes a pending draft" finding — User A had no
  Step-3+ draft (only an abandoned popup), so a fresh Owner Authentication
  screen rendered and the flow completed end-to-end.
Full result: `knowledge/flow-edereg.md` §25.

## 2026-08-27 — MU_TS8 built (same company, simultaneous first payment
attempt: User A's inline popup races User B's listing-side resume of the
same Pending record). Full reasoning: `knowledge/flow-edereg.md` §26.
**NEVER RUN LIVE.** New page-object method:
`PrecheckEnquiryPage.attemptResumePendingPayment()` (race-safe sibling of
MU_TS7's `resumePendingPayment()`). Registered as Playwright project
`edereg-precheck-mu-ts8` and dashboard testCase `mu-ts8`. Three unconfirmed
shapes flagged in §26 — the literal "Duplicate RHB payment requests..."
dialog text, whether the loser's redirect really lands back on the inline
popup, and whether one retry is enough to observe the resolved state.

## 2026-08-27 — MU_TS1 re-run, FAILED on a listing-scope bug, fixed (not
yet re-confirmed live)

User A/User B's Deregistration flow itself completed correctly (User B's
`jpjDeregistrationStatus: "OK - TRANSACTION SUCCESSFUL"`, real
transactionId), but the final Deregistration Transaction Listing check
came back 0 instead of 1. NOT a repeat of the already-fixed reload-race bug
— that fix held. Real cause: the check ran from User A's session, but User
A's own Deregistration never reached Step 3 (by design, it stopped at the
inline pre-check) — User A's account genuinely has nothing of its own in
that listing. Confirms the listing is scoped to the LOGGED-IN ACCOUNT, not
the company (same root cause §21 found for different companies, now shown
to apply within a same-company pair too). **Fixed**: the check now runs
from User B's own session instead. Full reasoning:
`knowledge/flow-edereg.md` §19. Needs a re-run to confirm the fix.

## 2026-08-27 — MU_TS8 first live run, FAILED on the loser's retry, fixed
(not yet re-confirmed live)

The race itself worked and answered a real question: User A won directly
(inline popup succeeded), User B lost with an EMPTY dialog message — the
test plan's "Duplicate RHB payment requests..." text did NOT fire, same
"predicted wording doesn't match reality" pattern as MU_TS4. The FAILURE
was in the retry logic: User B's loser-branch tried to re-open the listing's
"Resubmit" link and race payment again — but once User A's win resolved the
record to Approved, that link no longer exists (an Approved row only shows
"View"), so it timed out after 15s. **Fixed**: User B's loser branch now
just checks the listing status directly (expects Approved) instead of
trying to pay again — the loser only needs to observe the resolved state,
not independently reach success. Full reasoning: `knowledge/flow-edereg.md`
§26. User A's own loser-retry branch is unchanged and still unconfirmed
(User A won this run, so it was never exercised).

## 2026-08-27 — MU_TS9 built, then CORRECTED same day (same company,
BackOffice cancels the shared Pre-Checking transaction)

First build used the wrong BO page (Faizuddin pasted the "Deregistration
Transaction Enquiry" listing by mistake) with a fully blind-guessed "Cancel"
selector. He caught it and pasted the CORRECT page — the "eDereg
Pre-Checking Transaction Listing" — which turned out to have real
Pending/Failed rows, so the "Cancel" action is now CONFIRMED for real:
`<a class="to-cancel" txid="<uuid>">Cancel</a>`, present only on
Pending/Failed rows, absent on Approved/Expired ones. This also resolved
the scenario's biggest ambiguity: the transaction User A and User B are both
looking at is the SAME one Pre-Checking record, not two separate ones, so
cancelling it is expected to affect both of their refreshes — no cascade
question needed. Rewrote the spec around `BoPrecheckTransactionListingPage`
(new); kept the original (mistaken but real) `BoDeregTransactionListingPage`
and its capture, un-wired from any test, in case it's useful later. Full
reasoning: `knowledge/flow-edereg.md` §27. **NEVER RUN LIVE** — two shapes
still unconfirmed (the Cancel link's own click-handler behaviour past the
selector, and whether refresh alone triggers the "Transaction Cancelled"
dialog), both far narrower gaps than before the correction.

## 2026-08-27 — MU_TS9, three live runs same day: BO cancel confirmed,
then two rounds of chasing the SAME 0-rows symptom to its real cause

Run 1: BO cancel worked (real "Succesfully cancel." dialog), failed later
on the refresh-detection step — fixed with `reloadAndCaptureDialog()`.

Run 2: failed a step earlier — BO Pre-Checking listing search found 0 rows
for a vehicle known to have a real record. No screenshot existed to show
why (boPage isn't Playwright's auto-snapshotted page). Guessed a datepicker
click race, fixed defensively (verify the date field actually got a value,
fill "To" as well as "From"), added a screenshot-on-failure for next time.

Run 3: SAME 0-rows symptom — but this time the new screenshot
(`mu-ts9-bo-failure.png`) settled it. Vehicle No. and BOTH dates were
correctly filled (disproving the datepicker theory outright) — the page
was still showing its "Working..." overlay when rows were read. **Real
cause**: `#to-search` on this specific listing is an AJAX call, not a full
page reload like its sibling BO listing — a wrong assumption carried over
without separately checking it here. Fixed: wait for a "View" link to
appear instead of `waitForLoadState()`. Full reasoning:
`knowledge/flow-edereg.md` §27 (also has a general lesson for any future BO
listing page: don't assume the same click-mechanism just because the form
looks similar). Not yet re-run.

## 2026-08-27 — MU_TS9 fourth live run: AJAX-wait fix confirmed, BO cancel
confirmed AGAIN — but the refresh genuinely shows nothing, live

The date + AJAX-wait fixes both held: BO search found the row, Cancel
worked. Failed again at the SAME refresh-dialog assertion as run 1 — but
this time it's understood as REAL confirmed behaviour, not a capture bug.
A fresh screenshot showed User A's refreshed Step 2 landing on a silently
blank "Owner & Vehicle Details" form — no dialog, no error text, nothing.
The Deregistration-embedded inline flow's own refresh just doesn't surface
"Transaction Cancelled" at all, contradicting the test plan's step 7. Left
as-is per instruction (no more guessing at this specific assertion for now).

## 2026-08-27 — MU_TS9B built: same scenario via the STANDALONE Pre-Checking
flow, for direct comparison

Faizuddin asked for a second automation covering the identical scenario,
but with User A creating the pre-check through the standalone "eDereg
Pre-Checking Enquiry" flow instead of the Deregistration-embedded inline
popup — specifically to see whether the STANDALONE flow's own refresh
behaves differently (shows an actual cancelled notice) where the inline
one stayed silent. New page-object method:
`PrecheckEnquiryPage.attemptStandalonePayment()` (decline-aware, GENUINELY
UNCONFIRMED — built from MU_TS4's evidence that the retry-button page and
this flow's own payment page are the same template). Unlike MU_TS9, this
test does NOT hard-assert on either refresh's dialog result — it's built to
observe and compare, not re-litigate an already-known-silent expectation.
Registered as Playwright project `edereg-precheck-mu-ts9b`, dashboard
testCase `mu-ts9b`. Full reasoning: `knowledge/flow-edereg.md` §28.
NEVER RUN LIVE.

## 2026-08-27 — MU_TS9B first live run: PASSED, comparison confirmed the
standalone flow behaves DIFFERENTLY from the inline one

Both User A's and User B's refresh captured a real `"Transaction
Cancelled"` dialog — the exact wording the original test plan predicted,
and the opposite of MU_TS9's own silent (empty dialog) result on the
Deregistration-embedded inline flow. So: the inline popup's refresh
genuinely shows nothing (confirmed via MU_TS9's own runs), but the
standalone flow's refresh genuinely does show the cancelled notice — a
real, useful behavioural difference between the two entry points.

Faizuddin then watched the recording and couldn't see the dialog on
screen, despite the captured text being accurate — the dialog was
auto-accepted the instant it fired, before it ever rendered a visible
frame. Fixed in both MU_TS9 and MU_TS9B: `reloadAndCaptureDialog()` now
holds the dialog open for 4s (`CONFIG.detailsPauseMs`, the same constant
`pauseForDetails()` uses elsewhere) before accepting, so it's actually
visible in the recording next time. Full reasoning:
`knowledge/flow-edereg.md` §28. Not yet re-run to confirm the dialog is
now visibly rendered (low risk — the captured message itself doesn't
change, only when it gets dismissed).

## 2026-08-27 — a QA-Issue raised for MU_TS9's own finding; MU_TS9B hidden
from the dashboard; MU_TS10 built

**EAINT-12233** raised under parent EAINT-9306 (priority Low, unassigned,
To Do) for the confirmed live finding: refreshing Deregistration Step 2
after a BackOffice pre-check cancel shows no message at all, while the
standalone Pre-Checking flow's own refresh correctly shows "Transaction
Cancelled" for the identical action. **The evidence screenshot still needs
manually attaching** — no browser-automation tooling was available in this
session to do it via Chrome, so it's on you to drag
`scripts\eauto-edereg-precheck\test-results\edereg-precheck-mu-ts9-...\test-failed-1.png`
into the ticket's Actual Result cell yourself.

Per your request, `mu-ts9b` is now commented out of the dashboard picker
(not deleted — the project/route/spec/page-object all still work, just
hidden from the dropdown).

**MU_TS10 built** — the different-company sibling of MU_TS9. Corrected
from the literal test plan per your own clarification: User B has their
OWN separate transaction throughout (never User A's), so BOTH transactions
get cancelled by BO and BOTH users independently resubmit/retry into
"Transaction Cancelled." User B's own dialog is hard-asserted (standalone
flow, already confirmed via MU_TS9); User A's retry-after-cancel is only
observed, not asserted (a click, not a refresh — genuinely never tested
before). Full reasoning: `knowledge/flow-edereg.md` §29. NEVER RUN LIVE.

## 2026-08-27 — a "same-company dual create" diagnostic built, before
MU_TS10's own first run

Faizuddin asked for a simple, separate diagnostic (not tied to any
numbered test-plan case): two same-company UCDs, BOTH going through the
standalone Pre-Checking flow's own "create" step (`enquireNow()`) for the
SAME vehicle no. — UCD1 stops before paying, UCD2 goes all the way to
Approved, never touching the listing/Resubmit at all. The question: does
UCD2 end up reusing UCD1's still-Pending transaction, or create a
genuinely separate one? Built to OBSERVE, not assert a specific answer —
the RESULT log's own `verdict` field states the finding directly. Filed
under a NEW "Others" dashboard group (per Faizuddin's own instruction),
testCase `dual-create`. Full reasoning: `knowledge/flow-edereg.md`,
"Others" section. NEVER RUN LIVE — this was built specifically to run
BEFORE MU_TS10's own first live run, since its answer may reveal whether
MU_TS10's own assumptions (each company gets a genuinely separate
transaction) need adjusting for the SAME-company case too.

## 2026-08-27 — MU_TS10 first live run FAILED (round 1), test plan rewritten
in response, MU_TS10 fully rebuilt (round 2)

Round 1 (User B on the standalone flow, resubmitting after BO's cancel)
failed exactly at the flagged gap: the "Resubmit" link doesn't render on a
Cancelled row at all — confirming the same gating rule already known for
BO's own "Cancel" link (§27) generalizes to this listing's "Resubmit"
too. Faizuddin rewrote the test plan in response, dropping "resubmit"
entirely: BOTH users now stay on the Deregistration-embedded inline flow
throughout (User B's setup becomes identical to User A's, just their own
company's identity), each gets their OWN transaction cancelled by BO
separately (right after their own decline, not both at once), and both
retry via their own still-open popup's "Next" button instead of the
listing. Confirmed this reading with Faizuddin before rebuilding. Fully
rewrote the spec around this — round 1's page-object method
(`openViaListingAndResubmitExpectingCancellation()`) is kept, just unused
by this version. Full reasoning: `knowledge/flow-edereg.md` §29. NEVER RUN
LIVE (round 2). Neither user's retry dialog is hard-asserted this time —
that's the genuinely open question round 2 exists to answer.

## 2026-08-27 — MU_TS10 (round 2) first live run: PASSED, one real capture
bug found and fixed

Both declines, both BO cancels, and both final listing checks
(`Cancelled`) worked exactly as expected. But the two retries' dialogs
came back asymmetric: User A got `"Transaction Cancelled"`, User B got
empty — same code, same action, run strictly sequentially (Faizuddin
correctly pushed back that this can't be a cross-user race, since there's
no concurrency between them at all). Root cause: the SAME per-request
capture-timing gap already found for MU_TS9's `reloadAndCaptureDialog()`
— the dialog listener stopped listening right after the click resolved,
but the app's own "Transaction Cancelled" check can fire a beat later as
a separate async follow-up. Fixed `attemptInlineRetryAfterCancellation()`
with the same grace-window + hold-before-accept pattern. Full reasoning:
`knowledge/flow-edereg.md` §29. NOT yet re-run to confirm both users now
get a real answer.

## 2026-08-27 — MU_TS9 rebuilt a third time: trigger changed from refresh
to active retry, matching MU_TS10

You asked why MU_TS9 (silent on refresh) and MU_TS10 (showed "Transaction
Cancelled" on retry) seemed inconsistent despite "hitting the same flow" —
they don't: a refresh is passive (nothing submitted), while clicking
"Next" on the still-open popup is an active retry that actually hits the
server's payment endpoint, which is where a rejection would sensibly
fire. You then asked to "make TS9 follow TS10" — done: both User A and
User B in MU_TS9 now actively retry instead of refreshing. User A reuses
the already-fixed `attemptInlineRetryAfterCancellation()`; User B gets a
new `PrecheckEnquiryPage.attemptStandaloneRetryAfterCancellation()`, built
with the grace-window dialog-capture fix from the start this time. The
original refresh finding (silent, EAINT-12233) is NOT retracted — this
rebuild just answers a different question. Full reasoning:
`knowledge/flow-edereg.md` §27. NEVER RUN LIVE (this version) — whether an
active retry on this same-company shared-transaction shape behaves like
MU_TS10's own separate-transaction case did is the open question now.

## 2026-08-27 — video recording reworked: separate files per browser +
a burned-in timestamp, piloted on MU_TS1

You asked for two things: (1) every browser that pops up records and
publishes as its OWN separate video instead of being ffmpeg-concatenated
into one continuous file — concurrent multi-user actions were impossible
to judge from a single stitched video — and (2) a visible date/time on the
recordings so separate videos can still be lined up by eye. Both done and
piloted on MU_TS1 specifically, per your instruction, before touching
anything else:

- `publishVideos()` (route.ts) replaces the old ffmpeg-concat
  `publishVideo()` — every `.webm` now gets copied and published
  individually, returned as `{ label, url }[]`.
- The dashboard now renders one `<video>` per browser, each labeled, in a
  grid instead of one player.
- New `TIMESTAMP_OVERLAY_INIT_SCRIPT` (utils/overlay.ts) burns a live
  clock into the top-right corner of every recorded frame. Wired into the
  MAIN page for every test automatically via the shared session fixture —
  no per-test change needed for that part. MU_TS1's own `userBContext` got
  the one extra line needed for ITS separate recording, as the pilot.
- Because the underlying per-page video manifest (`videoManifest.ts`)
  already labels every sub-page recording, rolling this out to every OTHER
  test needs ONLY that same one-line `context.addInitScript(...)` addition
  per test's own manually-created context — the route/dashboard side
  already applies universally once MU_TS1 confirms it works.

Full reasoning: `knowledge/flow-edereg.md` §11. **NOT yet run live** — this
needs a real MU_TS1 run to confirm both the separate videos actually
display and the timestamp is legible before rolling out to the rest of
the suite.

## 2026-08-27 — MU_TS1's video pilot CONFIRMED live, then rolled out to
every other test in the suite

MU_TS1's run passed and published 6 separate `.webm` files correctly (main
+ 3 MyKad-emulator popups + User B). The dashboard not showing them at
first was just a stale browser bundle — hard refresh fixed it, no backend
bug. Per your instruction ("apply this for all TS in 9306"), the same
one-line `context.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT)` addition
went into every other test's own manually-created context: MU_TS2-TS9,
MU_TS9B, MU_TS10, the "dual create" diagnostic, and `srdChecklist.ts`'s BO
context (which feeds TS1 and most single-user tests too, not just
Multiple Users). Found and fixed a real pre-existing gap along the way:
MU_TS10's three sub-contexts had NO `recordVideo` config at all, so User
B's and BO's actions were never being recorded there — now fixed. Full
reasoning: `knowledge/flow-edereg.md` §11. Everything besides MU_TS1
itself is unconfirmed live with this change — worth watching for on each
test's next run.

## 2026-08-27 — selectable video download added to the dashboard

Right after the separate-videos rollout, you asked for a way to pick which
recordings to download together. Added: a checkbox on each video, a
Select all/Deselect all toggle, and a "Download" button. New API route
`download-videos` zips the selection (PowerShell `Compress-Archive`, no
new dependency) or hands back a single file directly if only one's
picked. Full reasoning: `knowledge/flow-edereg.md` §11. NOT yet tried
live — worth a quick check next time you're on the dashboard with a
finished run showing videos.

## 2026-08-27 — MU_TS11 built: first two-part MULTI-USER case (different
company, both expire via cronjob)

Modelled on CPC_E2E_TS10/11/12's own "produce a transaction, hand off for
a dev-side patch, resume in Part 2" shape, but for TWO companies at once.
Confirmed the Part 1/Part 2 split with you before building: Part 1 has
both users create their own separate Pending pre-check for the same
vehicle, then hands off (vehicle no. + each side's own transaction ref)
asking the dev to run the cronjob so both expire. Part 2 is a brand-new
session — "refresh Step 2" means each user creates another Deregistration
attempt for the same vehicle (not a literal browser reload), cancels the
inline popup that reappears, then resubmits from the Pre-Checking listing
and checks for "Transaction Expired." Reuses MU_TS10's own
`openViaListingAndResubmitExpectingCancellation()` verbatim — no new
page-object methods needed. Also fixed a small dashboard gap: Part 2 is
the first case that's both two-part (excluded from the static picker) and
multi-user (needs the same picker to know which credential fields to
show) — added an explicit fallback so User C's fields don't disappear
when Part 2 is selected. Full reasoning: `knowledge/flow-edereg.md` §30.
NEVER RUN LIVE — dashboard testCase `mu-ts11-part1` (Part 2 only exists as
a dynamically generated continuation after Part 1 finishes).

**Superseded later the same day — see the entry directly below.**

## 2026-08-27 — MU_TS11 rebuilt as a single run with dashboard
pause/continue; Resubmit-on-Expired confirmed absent

Per your feedback on the Part 1/Part 2 build above: "1. the resubmit link
will not render on expired row. for the expired transactions, user cannot
do anything anymore 2. No need to do hard check on the literal wording.
that one i will check the recording and check it manually myself. and for
the pause thing, i want you to build it for TS11."

Built the dashboard-driven pause/continue mechanism you asked about
(`scripts/eauto-edereg-precheck/utils/pauseSignal.ts` +
`app/api/eauto-edereg-precheck/pause-status` and `.../continue` routes +
a polling effect/Continue banner in `page.tsx`) and used it to collapse
MU_TS11 into ONE run: both users' inline popups stay open on the SAME
live sessions while the test pauses; the dashboard shows a Continue
button; you ask the dev to run the cronjob, then click Continue — no more
browser restart between "Part 1" and "Part 2." Deleted the old
`edereg-precheck-mu-ts11-part1/-part2.spec.ts` files and their
`playwright.config.ts`/`run/route.ts`/`page.tsx` wiring; single file
`tests/edereg-precheck-mu-ts11.spec.ts`, dashboard testCase `mu-ts11` (a
normal single entry now, no continuation hack needed). Also updated the
test itself: the "Resubmit" link's absence on an Expired row is now
HARD-ASSERTED (you confirmed it live), and the literal "Transaction
Expired" dialog wording is no longer checked at all (you'll verify that
manually from the recording). Full reasoning: `knowledge/flow-edereg.md`
§30 (rewritten). Caveat carried into the doc: the pause only holds up for
minutes-to-an-hour, not overnight — a paused run still keeps two logged-in
browser sessions alive. NEVER RUN LIVE — dashboard testCase `mu-ts11`.

## 2026-08-27 — MU_TS12 built: same pause/continue mechanism, applied to a
Failed-payment-expires-via-cronjob scenario

You asked for the same treatment on TS12's own test plan (User A's Failed
(IF) payment eventually expires via cronjob while User B still has the
shared record's Payment page open; both then attempt to pay/retry into
Expired). Same blocker as MU_TS2 originally had: the pasted plan's own
"different company" header didn't match the flow (only ONE transaction
ever gets created; User B just searches/pays on User A's). Confirmed with
you first — same company, User B is the Main's own Sub
(`subUsername`/`subPassword`), sharing User A's exact record.

Nearly identical shape to MU_TS9 up through the Failed payment (same
User A setup, same `openViaListingAndResubmit()` for User B, same
`attemptInlinePayment()` steered to RHB IF) — diverges at the terminal
event: MU_TS9 goes Failed -> Cancelled via a BO action, TS12 goes Failed
-> Expired via the cronjob, so it reuses MU_TS11's pause/continue
mechanism instead of BO. Simpler than TS11's own pause: no second-tab
transaction-ID lookup needed, since User B's context already has its
target page open before the pause. Steps 7/10's "attempt to
pay"/"retry payment" reuse MU_TS9's own retry methods
(`attemptStandaloneRetryAfterCancellation()`/
`attemptInlineRetryAfterCancellation()`) verbatim — both are generic
despite their MU_TS9-era names. Literal "Transaction Expired" wording not
hard-asserted (same convention as TS11); only the final `Expired` listing
status is, for both users. Single file
`tests/edereg-precheck-mu-ts12.spec.ts`, dashboard testCase `mu-ts12`,
`multiUser: "same"`. Full reasoning: `knowledge/flow-edereg.md` §31.
NEVER RUN LIVE.

## 2026-08-27 — CJ_TS1-5 built: classic Part 1/Part 2 splits (deliberately
NOT the pause/continue mechanism)

You asked for all 5 cronjob scenarios (§5.5's full step text, pasted from
Miro after the PDF test plan turned out unreadable via `pdftotext` — it's
a Skia/headless-Chrome SVG export with scrambled column order) built as
automation, explicitly as the OLD two-part pattern this time: "the before
will create the transactions up till the mentioned status. the after
will check the status and the other details." Part 2 for all 5 is a pure
read — fresh session, just `getListingStatusForVehicle()`, no
Deregistration/MyKad/payment at all.

Extended `getListingStatusForVehicle()` to also read the Remarks column
(needed for CJ_TS1/TS5's "Remarks = Transaction Expired" check). Two
build decisions worth knowing about:
- **CJ_TS2 Part 1 uses the standalone Enquiry entry, not the literal
  "Create new Deregistration" wording** — the inline entry point resets
  to blank on a JPJ-Failed outcome instead of persisting a record
  (confirmed dead-end, same problem CPC_E2E_TS5 already solved the same
  way).
- **CJ_TS3's own "ask dev to run cronjob... EXPIRED" is read as a direct
  DB patch**, not a literal cronjob run — the cronjob can't touch an
  Approved row on its own (§5.5), so this has to be a data patch, same
  category as the 6-month SRD expiry patch elsewhere in this suite.

10 files total (`tests/edereg-precheck-cj-ts{1..5}-part{1,2}.spec.ts`),
all wired into `playwright.config.ts` + `run/route.ts` (both parts) +
`page.tsx` (Part 1s only, new "Cronjob" group — Part 2s are dynamic
continuations like every other two-part case). Full reasoning:
`knowledge/flow-edereg.md` §32. NEVER RUN LIVE.

## 2026-08-27 — CPC_E2E_TS3 built (blocker resolved), CPC_E2E_TS12 corrected
(was IF, is actually RHB API Down)

You asked whether TS3/TS12 were already built. TS12 was (already two-part,
Approved -> 6-month expiry patch -> decline retries) but steered to `IF`
insufficient-funds; TS3 genuinely wasn't — it was the one blocked case
flagged in the (now-deleted) `eaint-9306-rhb-api-down-unconfirmed` memory,
no known trigger for "RHB API Down." You then confirmed the trigger: same
`rhb-transfer` eSIM entity as IF/RE, code `ER`
(`RHB_TRANSFER_RESPONSE_CODE_API_DOWN`, `utils/esim.ts`).

Built accordingly: **TS3** single-part (`edereg-precheck-rhb-api-down.spec.ts`,
dashboard testCase `rhb-api-down`) — standalone enquiry,
`attemptStandalonePayment()` steered to `ER`, expects declined. Scoped
narrower than TS2/7/8/9's own pattern (no Deregistration continuation —
TS3's literal continuation steps weren't available). **TS12** corrected in
place — `edereg-precheck-ts12-part2.spec.ts` now steers `ER` instead of
`IF`; TS4/5/6/10/11 untouched (never about API Down). Full reasoning:
`knowledge/flow-edereg.md` §9 (TS3 bullet) and the CPC_E2E_TS10/11/12
bullet (TS12 correction). NEVER RUN LIVE.

## 2026-08-27 — Two small dashboard UI asks: select-a-few continuation
copy, multi-transaction pause banner

1. **"allow me to select the TS to copy the details, since i dont want to
   copy all, just a select few"** — added a checkbox per continuation
   entry (`selectedContinuations`) and a "Copy selected (N)" button next
   to the existing "Copy all" — doesn't replace either the one-at-a-time
   Info-panel copy or Copy all, just adds the missing middle option.
2. **"since MU_TS11 & 12 have different companies/transactions, make sure
   the part 2 is able to handle this multiple transaction ID, if they
   have different ID"** — `pauseForDashboardContinue()` (`utils/
   pauseSignal.ts`) now takes an optional `transactions: {label,
   transactionId}[]` array alongside its label string. MU_TS11 passes
   TWO (User A/User B — genuinely separate per-company records); MU_TS12
   passes ONE (it's a single shared same-company record — added a
   transaction-ID lookup there too, which it didn't have before). The
   pause banner shows/copies however many there are, not hardcoded to
   one. Full reasoning: `knowledge/flow-edereg.md` §30 and the "Two-part
   (dev-patch) automation" section.

## 2026-08-27 — CPC_E2E_TS11/TS12 were WRONG, checked against your literal
test-plan text and rewritten (TS10 confirmed correct)

You flagged CPC_E2E_TS11 ran with Payment = RE even though your test
scenario didn't mention any payment failure — that led to pulling the
literal test-plan text for TS10/TS11/TS12 and checking all three before
touching anything:

- **TS10 [Approved]** — confirmed correct as already built. No change.
- **TS11** — was completely wrong. It had been steering `RE` (a payment
  reset-timer decline) since 2026-08-24; your text shows it's actually a
  **JPJ-level failure** (`VEL000045E`) on the retry, then a re-steer and a
  SECOND retry that succeeds — the exact same shape `CPC_E2E_TS9` already
  has (`resolveVehicleGate()` twice, re-steering eSIM between attempts).
  Rewrote `ts11-part2.spec.ts` to reuse TS9's own pattern instead.
- **TS12** — the RHB code was already corrected to `ER` earlier this
  session, but the OLD build never checked the real pass condition. Your
  text says the transaction ends up **Cancelled**, with the listing's own
  "Resubmit" unavailable — the build only repeated declined payment
  attempts 4 times and never asserted either of those. Rewrote
  `ts12-part2.spec.ts` to check both (reusing MU_TS10's
  `openViaListingAndResubmitExpectingCancellation()`), flagged unconfirmed
  whether ONE decline is enough to trigger Cancelled or if it takes more.

Full reasoning: `knowledge/flow-edereg.md`'s CPC_E2E_TS10/11/12 bullet
(rewritten). Both typecheck clean. NEVER RUN LIVE — first attempt at
either corrected shape.

## Immediate next step

MU_TS7 and MU_TS9B are confirmed live and passing. MU_TS9 has been fully
rebuilt around an active-retry trigger and never run in this form. MU_TS8
still has a fix awaiting a re-run. MU_TS10 just got a dialog-capture fix
AND a video-recording gap fix that both need a re-run. The "dual create"
diagnostic is built but never run. Suggested order, cheapest/most
informative first:
1. Re-run MU_TS10 — confirms the dialog-capture fix actually catches User
   B's own "Transaction Cancelled", AND that BO/User B are now actually
   being recorded (the gap just fixed).
2. Run MU_TS9 (rebuilt) — first live look at whether an active retry
   surfaces the message on this same-company/shared-transaction shape.
3. Run the "dual create" diagnostic — independent of the above, still
   worth running.
4. Re-run MU_TS8 — confirms the loser's-retry fix works; if User A loses
   this time instead, it's the first live look at that branch too; also
   the first live check of the timestamp overlay on a genuinely
   concurrent (racing) scenario.
5. Re-run TS1 (happy path, CPC_E2E_TS1 — not to be confused with MU_TS1
   above) — confirms the SRD checklist additions and pacing together, now
   also carrying the timestamp overlay via `srdChecklist.ts`'s BO context.
6. Run CPC_E2E_TS10/11/12 Part 1 — never run at all.
7. Run TS5 Part 2 — confirms the reset-timer fix (~6.5 min wait) and is
   the real test of the VPN reminder banner's timing. (TS11 Part 2 no
   longer uses the reset-timer at all — see the 2026-08-27 correction
   below — so it's not a substitute for this check anymore.)
8. Attach the MU_TS9 screenshot to EAINT-12233 (manual, browser tooling
   unavailable this session).
9. **Re-verify TS4/TS5/TS6 against their literal test-plan text**, the
   same way TS10/11/12 just got checked — TS11 turned out to be steering
   completely the wrong RHB code despite being "confirmed" since
   2026-08-24, so the other two-part builds haven't actually been
   cross-checked against real steps either; they're just as likely to
   have the same kind of gap.

## 2026-08-26 finding — MU_TS6, same vs. different precheck transaction

MU_TS6 (same company: User A's Deregistration gets a JPJ-rejected
`VEL000100E` pre-check, then User B — same company — creates their own new
Deregistration for the same vehicle, steered to Approved) ran live. The
build had assumed User B's new attempt would UPDATE User A's existing
Failed record in place (1 row total) — **wrong**. The app creates a
genuinely SEPARATE second row instead (2 rows: the original Failed one,
untouched, plus a new Approved one).

Cross-checked against the dev-authored QA test guide Faizuddin shared as a
Claude Artifact (saved to
`_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html`).
Its stated rule: **"Only one record has to satisfy all four. A later
failed or cancelled attempt does not cancel out an earlier approved one"**
— i.e. multiple coexisting records per vehicle+company is the intended
design; the gate looks across ALL records for a qualifying one rather than
expecting any single record to be mutated.

The guide names exactly TWO situations where a record IS reused instead of
a new one being created — and JPJ-rejected (MU_TS6's own failure mode,
`VEL000100E`) is **neither** of them:
1. Abandoned, unpaid (cancelled the dialog before ever paying) — reused,
   same record, no new row.
2. Failed payment (RHB decline) — reused, resumed in retry mode with
   Payment History intact.

So: a JPJ-rejected precheck resubmitted/retried should be expected to
create a NEW, separate precheck transaction, not reuse the old one — this
matches what MU_TS6's live run actually showed, not a bug. Per Faizuddin,
MU_TS6's pass condition deliberately keeps expecting exactly 1 row and
flags the real 2-row outcome as FAIL (a deliberate choice, not an
oversight). Full reasoning: `knowledge/flow-edereg.md` §24.

Note for MU_TS7 (above): its own trigger is a Pending/unpaid record being
resumed — situation 1 above, which the guide DOES say gets reused, not
duplicated. So MU_TS7 should expect the SAME precheck transaction
throughout, unlike MU_TS6.

---

## Older status (2026-08-24, superseded by the above — kept for history)

The full happy path (CPC_E2E_TS1: Pre-Checking Enquiry → Deregistration,
all 6 steps) was **CONFIRMED LIVE END-TO-END earlier today** — that was
where the 2026-08-22 session left off blocked (photo upload), and it got
fixed and finished before today's big work started. From there, today was
almost entirely: building out the remaining test cases, adding an SRD
checklist to most of them, and fixing three real bugs (one in the new
checklist code, two in existing automation). **NONE of today's new or
changed code has been run live yet** — that's the whole job for next time.

## What got built today

1. **CPC_E2E_TS10/TS11/TS12** — the "pre-check done in step 2" counterparts
   of TS4/TS5/TS6 (the 6-month-expiry, two-part dev-patch cases). Part 1
   creates the pre-check inline and stops; Part 2 (after a dev expires it)
   redoes the flow and completes. `tests/edereg-precheck-ts{10,11,12}-part{1,2}.spec.ts`.
2. **SRD checklist** — 4 items (Pre-Checking/Deregistration details pages,
   the "eDereg Pre-Checking: Yes" hyperlink, the JPJ XML Log under a
   separate BO login) rolled out to TS1, TS2, TS7, TS9, and the LAST part
   of TS4/5/6/10/11/12 (TS8 gets nothing — no persisted record to check;
   TS6/TS12's last part gets only the JPJ-log-by-vehicle-no. piece — no
   completed Deregistration to check the rest against). Shared logic lives
   in `utils/srdChecklist.ts`, `pages/BoLoginPage.ts`, `pages/JpjXmlLogPage.ts`,
   `utils/jpjXmlLogDecode.ts` (field-decode reference from Faizuddin's own
   Code Splitter xlsx, cross-checked against a live BO capture).
3. **Dashboard continuation UI** — per-entry "view/copy details" (vehicle
   no. + transaction ID only), a "copy all" button, and auto-removal: a
   PASSED Part 2 run clears its continuation entry; a FAILED one stays so
   the same vehicle no./data can be retried once whatever broke is fixed.
4. **Multi-tab video recording fix** — every extra tab (MyKad emulator
   popup, BO login context) used to get silently dropped from the
   dashboard's video, since Playwright records each page separately and
   the old code just grabbed whichever `.webm` was newest. Now every tab's
   video gets ffmpeg-concatenated into one continuous recording, in true
   chronological order (`utils/videoManifest.ts` + rewritten
   `publishVideo()` in the run route). Smoke-tested the ffmpeg command
   itself (works); the real multi-tab ordering has NOT been confirmed on
   an actual run yet.
5. **Deliberate slowdown on "details" screens** — every screen that
   DISPLAYS something (results, details pages, log searches) now holds for
   ~4s before moving on, so the video is actually watchable afterward.
   Form-filling steps are untouched, still full speed
   (`CONFIG.detailsPauseMs`, `PrecheckSession.pauseForDetails()`).
6. **VPN reminder during the RE reset-timer wait** — a flashing red banner
   + browser-tab-title flicker on the dashboard, firing about 1 minute
   before the ~6.5-minute RE wait ends and the automation needs the VPN
   again (`utils/waitStatus.ts`, a new `wait-status` API route, polling in
   `app/eauto/edereg-precheck/page.tsx`). Scoped ONLY to this wait, not a
   general VPN feature.

## Bugs found and fixed today

1. **Pre-Checking Details page — wrong field ids, twice.** Added the
   details-page check assuming it reused the standalone flow's
   `#result-container`/`#responseVehicleNo`/`#jpjStatusLabel`/`#responseDesc`
   ids (per an OLDER capture's comment, which just elided that whole
   section instead of showing real markup). Both guesses were wrong — a
   live HTML paste from Faizuddin proved the real page has NEITHER id; it
   uses plain, un-id'd `<span>`s in specific table positions instead. Fixed
   by reading the actual markup. `PrecheckEnquiryPage.verifyDetailsPage()`.
2. **TS5/TS11 Part 2's RE reset-timer wait was basically skipped.**
   `waitOutPaymentResetTimer()` polled the countdown widget's own (guessed,
   never-confirmed) DOM for completion, with `if (!timer ...) return true`
   — meaning "the guessed selector found nothing" was read as "the
   countdown is already done." Since the selector never matched anything
   real, the wait resolved in under a second instead of ~6 minutes, and
   the automation retried the payment far too early. Faizuddin confirmed
   the real duration is a fixed 6 minutes (enforced by the gateway itself,
   not just a UI display) — fixed by dropping the DOM guess and just
   waiting `6 * 60_000 + 30_000` ms unconditionally.
3. *(Not a bug, but worth flagging)* Every fix above and every new
   checklist/video/pacing addition is still **NEVER RUN LIVE** — today was
   entirely build + reasoning + one confirmed live diagnosis (the
   details-page stall), not a full live pass through everything.

## Files touched today (non-exhaustive, the big ones)

- New: `pages/BoLoginPage.ts`, `pages/JpjXmlLogPage.ts`,
  `utils/jpjXmlLogDecode.ts`, `utils/srdChecklist.ts`,
  `utils/videoManifest.ts`, `utils/waitStatus.ts`,
  `tests/edereg-precheck-ts{10,11,12}-part{1,2}.spec.ts`,
  `app/api/eauto-edereg-precheck/wait-status/route.ts`.
- Changed: `pages/PrecheckEnquiryPage.ts`, `pages/DeregTransactionPage.ts`,
  `utils/mykadEmulator.ts`, `utils/session.ts`, `fixtures/sessionFixture.ts`,
  `data/config.ts`, `playwright.config.ts`,
  `app/api/eauto-edereg-precheck/run/route.ts`,
  `app/eauto/edereg-precheck/page.tsx`,
  `tests/edereg-precheck.spec.ts`,
  `tests/edereg-precheck-vehicle-not-exist.spec.ts`,
  `tests/edereg-precheck-step2-first-approved.spec.ts`,
  `tests/edereg-precheck-step2-first-retry-approved.spec.ts`,
  `tests/edereg-precheck-ts{4,5,6}-part2.spec.ts`.
- New HTML captures (per the standing rule): `_reference/codebases/AATF/
  EAINT-9306-bo-home-menu.html`, `...-bo-jpj-xml-log-dereg.html`,
  `...-bo-jpj-xml-log-precheck.html`, `...-precheck-details-live-2026-08-24.html`.
- `knowledge/flow-edereg.md` grew §9 (TS10-12), §10 (SRD checklist), §11
  (multi-tab video), §12 (details-screen pacing), §13 (VPN reminder) —
  full reasoning and open questions for everything above lives there, this
  file is just the quick-resume pointer.
- `lib/ticketStudies.ts` and `_reference/html/README.md` updated to match.

## Immediate next step (when you're back)

**Run something live — nothing today has been exercised for real yet.**
Suggested order, roughly cheapest/most-informative first:

1. Re-run TS1 (happy path) — confirms the SRD checklist additions (details
   pages, Yes-link, BO login + JPJ XML Log) actually work, and gives a
   first real look at the multi-tab video concat + the details-screen
   pacing on a run that's fully understood already.
2. Run TS10/TS11/TS12 Part 1 — never run at all; the "Approved regardless
   of TS" assumption for Part 1's inline pre-check, and the missing
   transaction ID (looked up via listing instead), both need checking.
3. Run TS5 or TS11 Part 2 (after their Part 1 + a dev's expiry patch) —
   confirms the reset-timer fix actually waits ~6.5 minutes now, and is the
   real test of the VPN reminder banner's timing.
4. Watch whichever run's video all the way through — confirms the ffmpeg
   concat produced one continuous recording in the right order, and that
   4 seconds is actually enough to read each details screen.

Known still-open, not urgent: RHB API Down (CPC_E2E_TS3) still has no
confirmed way to trigger it — do not build automation for it without
checking with Faizuddin first (per his own instruction, 2026-08-24).
