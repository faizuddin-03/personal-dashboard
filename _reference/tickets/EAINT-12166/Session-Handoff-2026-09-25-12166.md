# Session handoff — 2026-09-25 (EAINT-12166)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. **Supersedes `Session-Handoff-2026-09-24-12166.md`**
(deleted in this update — everything still relevant from it is folded in
below). Today was lighter than 09-24 on new automation builds — no new TS20–
TS24 scenarios were actually built — but real coverage-gap analysis and one
resolved SRD question happened for this ticket specifically (see below).
Most of the rest of today's hands-on work (report-engine regression attempt,
serial-column bug diagnosis) is shared with EAINT-12167 — see that ticket's
09-25 handoff for the serial-column root-cause/QA-Issue angle; this file
tracks the DO-generation/Report-Engine side, the TS20–TS24 coverage review,
and the shared status.

## What this ticket is (one-liner)
Adds a one-click "DO" button on the Device Purchase Transaction Details page
that auto-generates a Delivery Order PDF, reusing the existing DO
template/format from Company Management. Depends on EAINT-12167's
serial-number data existing first.

## Status as of 2026-09-25
Both tickets still live on uat1. **Teams-sync findings this morning (two
automated syncs, 09:34 and 10:36):**
1. New "To Do Plan" post (9:20 AM) shows a further shift in the TS-count
   discrepancy: **EAINT-12166 25/30 (83.33%)**, EAINT-12167 29/29 (100%) —
   yet another set of numbers on top of the already-flagged 32/24/38
   discrepancy from earlier sessions. **Still unreconciled, not settled.**
2. Charmain Ea Chiang re-pinged at 08:38, re-quoting yesterday's unanswered
   "has QA testing started" question from Yi Link Lim.
3. A DM from yesterday evening: Faizuddin asked Charmain to review test
   scenarios, self-set "finalize by lunch tomorrow." Charmain acknowledged,
   said busy with other CRs, will review "tmr" — **no follow-up sent as of
   today.**
4. Yi Link Lim separately asked (in both CR chats) whether the happy flow
   is ready for an SA/Ops walkthrough — **Faizuddin replied this morning,
   10:34: "Hi. Ya, the happy flow is ready for walkthrough."** This closes
   out that specific open question from 09-24.
5. The other open question from 09-24 (whether QA testing has started /
   Jira status update) is **still unanswered** — same blocker carried
   forward.

## Work done this session (2026-09-25)
1. **Faizuddin confirmed he ran the TS01–TS08 suite manually today** (not
   via the dashboard's automated run) — "no, i did manually, so all that's
   left is for the report engine regression testing." No new automation
   build for this ticket today.
2. **Report Engine regression checklist (R1–R5) — attempted, blocked again,
   stood down.** Confirmed scope (unchanged from 09-24's written checklist):
   R1 Insurance e-Contract PDF, R2 Insurance CP58 PDF, R3 Insurance Add User
   Authorization + Declaration PDF, R4 eSTM Buyer Authentication PDF slip,
   R5 Company Management Print DO (New Registration) manual form. No
   knowledge-file gap was closed today — still no URLs, logins, or
   navigation steps documented for any of R1–R5. Faizuddin explicitly said
   he'd gather the starting points himself ("NO, I SAID IM DOING IT
   MANUALLY. IM JUST LETTING YOU KNOW SO THAT YOU WOULDNT MAKE ANYTHING BY
   YOURSELF") — automation stood down, waiting for his manual results to
   fold into the knowledge file.
3. **Playwright viewport experiment — tried, disproven, reverted, then
   re-set to match the real screen.** Diagnosing the serial-number
   two-column display bug (full root cause in EAINT-12167's handoff), the
   session first set `playwright.config.ts`'s chromium project viewport to
   1920×1080 to test a viewport-cause theory. Confirmed **not the cause**
   (manual opens showed the same 1-column collapse), so the change was
   reverted. Later, Faizuddin separately reported his own real browser
   looked "stretched" at 1920×1080 (not matching his actual 1920×1200
   screen resolution) — diagnosed as likely Windows display scaling,
   non-maximized window, or browser zoom. Viewport was then set to
   **1920×1200** to match his real screen, which is the setting now live in
   `tests/service-hub/playwright.config.ts`. This is unrelated to the
   serial-column bug (already disproven as the cause) — purely a
   dev-environment convenience fix.
4. **`playwright.config.ts` also gained a `detailedMode`-scaled timeout**
   (`240_000` when `PW_DETAILED=1`, else `60_000`) — carried over from
   09-24's "detailed mode" work, now with an inline comment explaining why
   (detailed-mode's ~1.4s per-step pauses can blow a fixed 60s timeout on
   longer flows).
5. **Timesheet note recorded for today**: creating the regression checklist
   for EAINT-12166/12167 counts toward today's timesheet entry — see
   EAINT-12167's handoff for the EAINT-12408 QA-Issue raised in the same
   session, which also counts.
6. **Housekeeping, unrelated to test coverage**: the hourly
   `ClaudeHourlyTeamsSync` scheduled task (was silently consuming credits by
   opening Teams chat every hour) changed to run **once daily at 3:00 PM,
   Monday–Friday only**, then later in the day **deleted entirely** per
   explicit request.
7. **SRD "Interim Document Upload Space" question — asked and reconfirmed,
   no code change.** Faizuddin asked what the SRD's dropped upload-space
   requirement means for coverage and whether the dev artifact/automation
   addresses it. Answer, from existing knowledge plus a fresh check: per
   `knowledge/flow-device-purchase.md:212-214`, the SRD "dropped that from
   scope as of v0.4, confirmed with the requestor earlier" — this was
   already known, not a new finding today —
   and `EAINT-12166-dev-QA-guide-annotated.html` has no mention of "upload"
   anywhere, consistent with it never having been built. **Settled: don't
   test it, no automation gap here.**
8. **Functional-TS coverage review, TS20–TS24, against the actual automated
   suite — real gap found, not yet built.** Faizuddin shared a
   functional-TS table (12166_FS_TS20 through TS24 — split-DO annotation
   wording, uneven-split 25→20+5, per-DO Number of Device on that uneven
   split, serial continuity across the DO boundary, full 21-field DO mapping
   per SRD §2.2.5) and asked whether the current suite
   (`tests/service-hub/specs/device-purchase-do-ts01..08.spec.ts`) covers
   it. Checked all 8 spec files directly:
   - **TS20 (split annotation wording)** — not asserted precisely (TS02 only
     does a loose `/Split order/i` substring match, doesn't check the full
     wording or that it appears on both pages), but TS02's real 40-device
     (20+20) run does go through the actual split-DO flow and downloads the
     2-page PDF — **eyeball-verifiable** from that existing recording/PDF.
   - **TS21 (25→20+5 uneven split)** — **not exercised at all.** Every
     automated run in the suite uses 1, 2, 3, 5, or 40 devices; none uses
     25. No recording exists to check by eye. Needs a brand-new test
     scenario, not a stricter assertion on an existing one.
   - **TS22 (per-DO Number of Device on that 25-device uneven split)** —
     same as TS21, **not exercised at all**, same reason (no 25-device run
     exists).
   - **TS23 (serial continuity across the DO boundary)** — not asserted, but
     TS02's 40-device split crosses the same 20/21 serial boundary position
     (just from a 40-unit split, not 25) — **eyeball-verifiable** from that
     recording.
   - **TS24 (full 21-field DO mapping per SRD §2.2.5)** — not asserted field
     by field (TS01/TS02 only check a handful: DO number, "Number of
     Device" label, appointment text/time), but both TS01 and TS02 generate
     real DO PDFs with all fields rendered — **eyeball-verifiable** by
     manually checking a downloaded PDF against the SRD's 21-field list.
   - Faizuddin's call: check TS20/TS23/TS24 manually against existing
     TS02 footage rather than rebuild automation for them now. TS21/TS22
     were left as a genuine, unresolved coverage gap — no new scenario was
     built this session.

## What's in this folder now
- `EAINT-12166_SRD_v1.1_20260828.pdf`, `EAINT-12166-study.html`,
  `eAuto_BackOffice_Existing_Mockup_20260818.html`,
  `EAINT-12166-dev-QA-guide-annotated.html`, `EAINT-12166 artifact
  lists.txt` — all unchanged today.
- The six live HTML captures from 09-23 — unchanged today.
- Still no `_reference/tickets/EAINT-12166/` capture of the Report-Engine-
  down blank error page — carried forward, unchanged, still the single most
  important capture gap.

Also relevant outside this folder: `app/eauto/12166/`, `app/api/eauto/12166/`
(`run`, `live-log`, `resume`, `download-all`), `lib/eautoRunRegistry.ts`,
`tests/service-hub/specs/device-purchase-do-ts0{1..8}.spec.ts`,
`tests/service-hub/playwright.config.ts` (viewport + detailed-mode timeout,
both touched today).

## Open items
Carried forward from 09-24, unchanged unless noted:
1. **Report-Engine-down blank error page's exact HTML still not saved
   anywhere** — unchanged.
2. **TS04's "incomplete details" trigger is still a genuine open question**
   — unchanged.
3. **TS04's next-day DO-number-reset check is still un-automatable** —
   unchanged.
4. **Second Report Engine outage request stalled** — no update found today
   on whether a senior got looped in.
5. **EAINT-12404's "it depends tho" from Zhan Choon remains unresolved** —
   not raised again today; see EAINT-12167's handoff, this is primarily a
   12167-side item.
6. **Dev is still waiting on a QA-testing-status reply in both CR-group
   chats** — Charmain re-pinged again this morning (08:38); still no reply
   sent as of today. This is now a repeated, not just outstanding, blocker.
7. **R1–R5 Report Engine regression checklist still not executed** —
   Faizuddin is running it manually himself; results not yet folded back in.
8. **`COMPANY = "FAIZUDDIN AUTO TEST"` hardcoded fixture still isn't
   portable** — unchanged, deferred.
9. **TS05's UCD-side legs still removed** — unchanged.
10. **TS-count discrepancy has grown, not shrunk** — now a third and fourth
    data point (25/30 and 29/29, per 9:20 AM "To Do Plan" post) on top of
    the existing 32/24/38 discrepancy. Needs reconciling with whoever posts
    those numbers, not further guessing.
11. **Charmain's test-scenario review, self-set for "lunch today," has not
    happened** — she said busy with other CRs, will review "tmr." Track
    whether that actually happens tomorrow.
12. **BDP-creator's `getLoggedInCompanyName()` selector is still
    unconfirmed live** — unchanged, not touched today.
13. **New today: TS21/TS22 (25-device uneven-split 20+5 scenario) are not
    exercised by any current automation run** — no recording, no assertion,
    nothing to eyeball. Needs a brand-new test scenario in
    `tests/service-hub/specs/device-purchase-do-ts0{1..8}.spec.ts` (or a new
    `ts09`+), not a stricter assertion bolted onto an existing one.
14. **New today: TS20/TS23/TS24 are automatable but not yet automated** —
    currently only eyeball-verifiable against TS02's existing 40-device
    (20+20) recording/PDF. Faizuddin chose to manually verify from that
    footage rather than have automation build stricter assertions this
    session; whether to still tighten TS02's assertions later is an open
    call, not a closed one.

## Next steps for whoever picks this up
1. Reply to Charmain/Yi Link Lim on QA-testing status and Jira status
   update — this has now been asked twice (yesterday, re-pinged today) and
   is a live, worsening blocker for dev.
2. Fold in Faizuddin's manual R1–R5 report-engine regression results once
   he has them, and update `knowledge/flow-device-purchase.md` accordingly.
3. Ask Wong Zhan Choon directly what "it depends tho" means for EAINT-12404
   (unchanged ask from 09-24).
4. Reconcile the now four-way TS-count discrepancy (32/24/38, plus today's
   25/30 and 29/29) — ask whoever posts the "To Do Plan" numbers directly
   rather than assuming any one figure is authoritative.
5. Follow up with Charmain on the test-scenario review she deferred to
   "tmr."
6. Once a genuinely pre-release transaction exists for this suite's own UCD
   account, re-add TS05's UCD-side legs (unchanged from 09-24).
7. Build a new automated scenario for a 25-device order producing an uneven
   20+5 split, to actually exercise TS21 and TS22 — nothing today covers
   this case at all.
8. Decide whether TS20/TS23/TS24 should get stricter automated assertions
   (full annotation-wording match, serial-continuity check, full 21-field
   DO mapping) or stay as manual-eyeball checks against TS02's existing
   footage — Faizuddin deferred this decision today, didn't close it.

## Durable-knowledge candidates (flagged, not written here)
- `knowledge/flow-device-purchase.md` gained two new dated Teams-sync
  sections today (09:34 and 10:36 syncs) — the happy-flow-walkthrough reply,
  the re-pinged QA-status question, the Charmain review commitment, and the
  new 25/30 / 29/29 progress numbers — already written by the automated
  teams-knowledge-sync agent, no further action needed there right now.
- No entry for `EAINT-12166` exists yet in `lib/ticketStudies.ts` — same gap
  every prior handoff has flagged, unchanged today.
