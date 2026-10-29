# Session handoff — 2026-09-25 (EAINT-12167)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. **Supersedes `Session-Handoff-2026-09-23-12167.md`
and `Session-Handoff-2026-09-24-12167.md`** (both deleted in this update —
everything still relevant from either is folded in below).

## What this ticket is (one-liner)
Adds Number of Device (auto-filled, disabled) and Device Serial No. (one
field per unit) to a Device Purchase Service Request. Ops keys in serials
while Delivery Status = New; saving with Delivery Status set to Arranged
locks the fields and triggers EAINT-12166's Delivery Order flow. This ticket
is the upstream data source EAINT-12166 depends on.

## Status as of 2026-09-25
Both tickets still live on uat1. Today's session was lighter than 09-23/24 —
no new TS scenarios were automated. The main event was a real defect
investigation (two-column serial display collapsing to one column) that
ended in a new QA-Issue, **EAINT-12408**, raised and fully evidenced.
**Teams-sync (two automated runs today, 09:34 and 10:36):** happy-flow
walkthrough question answered by Faizuddin ("Ya, the happy flow is ready for
walkthrough," 10:34); QA-testing-status question re-pinged by Charmain
(08:38), still unanswered; a new TS-count data point surfaced (12166 25/30,
12167 29/29) on top of the existing 32/24/38 discrepancy — see EAINT-12166's
handoff for the full status rundown, shared across both tickets.

## Today's findings

### 1. New QA-Issue raised: EAINT-12408 — two-column serial display collapses to one column
Investigation started from a live DOM comparison of today's SR page against
the 09-22 automated capture. Two wrong turns, then a confirmed root cause:

- **Not an injection-method difference.** Automation and manual entry both
  just set `.value` on existing `<input class="op-ship-serial">` fields —
  neither changes surrounding DOM structure.
- **Not a device-count or locator-logic issue.** `.op-ship-serial` selects
  by class across the whole grid regardless of column wrapper
  (`col-l`/`col-r`); automation fills all 40 fields in the same DOM order as
  manual entry.
- **Viewport theory tried and disproven.** `playwright.config.ts`'s chromium
  project had no explicit viewport, defaulting to `devices["Desktop
  Chrome"]`'s 1280×720. Set explicitly to 1920×1080 to test the theory —
  disproven immediately: a normal manual open of the same SR (SR69001409)
  also rendered 1 column, ruling out browser/viewport entirely. Change was
  reverted (see EAINT-12166's handoff for what the viewport setting is now,
  a separate dev-convenience fix unrelated to this bug).
- **Real root cause, confirmed via live computed CSS + DOM inspection**:
  `#ins-detail .ins-serial-col` has `float: left; padding-right: 24px;
  white-space: nowrap;` — no fixed width, so each column shrink-to-fits its
  widest line of text. The `.ins-serials` container is fixed at **300px**
  wide. SR69001409 (automation-generated) has every serial exactly 12
  characters, all uppercase — each column renders ~161.6px, so two side by
  side need ~323px, which doesn't fit in 300px, so column 2 wraps below
  column 1. SR69001448 (comparison, shorter/mixed-case serials) fits within
  300px and renders the intended two-column layout side by side.
- **In plain terms**: the serial-column box has a fixed width; automation
  always generates serials at the maximum allowed length (12 chars) in all
  caps, which is wider than typical manual entries, so automation-generated
  data is what pushes the layout past its fixed-width container.
- **QA-Issue created**: `[eAuto - BO] Device Serial No. list on Service
  Request Details page shows as a single stacked column instead of two
  side-by-side columns`, parent EAINT-12167, priority Low, assignee
  `zhan.choon` (same dev on the related EAINT-12394/12399/12404 QA-Issues).
  Two comparison screenshots attached and saved locally:
  `EAINT-12408-SR69001409-1col-uat1-2026-09-25.jpg` (stacked, automation) and
  `EAINT-12408-SR69001448-2col-uat1-2026-09-25.jpg` (side-by-side,
  comparison).
- **Live HTML saved** per this repo's standing rule before analysis began:
  `EAINT-12167-sr-details-two-col-serials-uat1-2026-09-25.html`.

### 2. Report Engine regression checklist (R1–R5) — still blocked, not run
Same R1–R5 scope as 09-24 (Insurance e-Contract PDF, Insurance CP58 PDF,
Insurance Add User Authorization + Declaration PDF, eSTM Buyer Authentication
PDF slip, Company Management Print DO manual form). Faizuddin confirmed he's
running the TS01–TS08 suite manually and doing R1–R5 himself; no
URLs/logins/navigation steps for any of R1–R5 exist in the knowledge base
still — automation stood down entirely, waiting on his manual results.

### 3. New standing rule reinforced today: SRD-driven Q&A on EAINT-12166's DO upload requirement
Faizuddin asked what SRD language "Allow DO creation for Device Purchase.
Until DO generation is available, provide an upload space for the DO or
other documents; hide this upload space once the DO can be generated" means
for coverage, and whether the dev artifact/automation script addresses it —
this was a scoping/clarification exchange, not a new automated check; no
code change resulted today. Worth checking against the dev artifact and
automation script next session if this wasn't already resolved in chat.

### 4. Housekeeping (shared with EAINT-12166)
The hourly `ClaudeHourlyTeamsSync` scheduled task was throttled to run once
daily at 3:00 PM (Mon–Fri only), then deleted entirely later in the day, per
explicit request — unrelated to test coverage but affects how/when future
Teams-sync findings land in the knowledge base going forward (no more hourly
syncs; syncs now only run when explicitly invoked, e.g. this morning's two
runs before the task was deleted).

## What's in this folder now
- `EAINT-12167_SRD_..._v1.2_20260817.pdf`, `EAINT-12167-study.html`,
  `EAINT-12167-EAINT-12166-combined-study.html`,
  `EAINT-12167-backoffice-01-sr-details-uat1.html`,
  `EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html`,
  `EAINT-12167-functional-TS-draft-2026-09-22.md`, `EAINT-12167 artifact
  lists.txt`, the three Delivery Order sample PDFs, the manual-repro
  `.mp4` — all unchanged today.
- `EAINT-12167-sr-details-two-col-serials-locked-uat1-2026-09-23.html` —
  from 09-23, unchanged today.
- **New today**:
  `EAINT-12167-sr-details-two-col-serials-uat1-2026-09-25.html` (live
  capture behind the EAINT-12408 investigation),
  `EAINT-12408-SR69001409-1col-uat1-2026-09-25.jpg`,
  `EAINT-12408-SR69001448-2col-uat1-2026-09-25.jpg` (both attached to the
  new Jira ticket and saved locally).

Also relevant outside this folder: `tests/service-hub/playwright.config.ts`
(viewport experiment tried/reverted, then reset — see EAINT-12166's handoff
for the final state and why).

## Open items
Carried forward, unchanged unless noted:
1. **`USDP_02`/`03`'s expected results in the saved functional TS draft
   still unreconciled against dev's guide** — unchanged, not touched today.
2. **Access-control (REQ-009's 18 named accounts) still not tested against
   the actual named list** — unchanged; the User Access Regression tool
   (built 09-24) checks a different/broader account set. Not run again
   today.
3. **Combined artifact TS counts still unreconciled, and the discrepancy
   has grown** — now four data points (32, 24, 38, plus today's 25/30 and
   29/29 from the 9:20 AM "To Do Plan" post) — see EAINT-12166's handoff.
4. **Concurrency TS still not drafted** — unchanged.
5. **EAINT-12404's "it depends tho" from Zhan Choon remains unresolved** —
   not raised again today; still needs a direct follow-up question.
6. **`/uat1` vs `/uat3` environment-name discrepancy** — unchanged, not
   revisited; all of today's work referenced `uat1`.
7. **TS04's real trigger condition for "incomplete details"** — still a
   genuine open question for dev/BA, unchanged.
8. **The 8-scenario suite (TS01–TS08) still has not had a clean full
   automated run today** — Faizuddin ran it manually instead; no automated
   baseline pass/fail signal produced today.
9. **User Access Regression still not confirmed on a real (non-dummy) run**
   — unchanged from 09-24.
10. **New today: EAINT-12408 needs a dev response** — created today with
    root cause fully documented and evidenced; no reply from zhan.choon yet
    as of writing.
11. **New today: the DO-upload-space SRD question (item 3 above) wasn't
    fully resolved in this session** — worth confirming against the dev
    artifact/automation script whether it's covered.

## Next steps for whoever picks this up
1. Follow up on EAINT-12408 once zhan.choon responds — the root cause
   (fixed-width container + all-caps 12-char automation serials) is fully
   documented; the fix itself (widen the container, or wrap differently) is
   a dev decision, not further QA investigation.
2. Fold in Faizuddin's manual R1–R5 report-engine regression results once
   available (shared with EAINT-12166).
3. Ask Wong Zhan Choon directly what "it depends tho" means for EAINT-12404
   (unchanged ask, now several days old).
4. Reconcile the now four-way TS-count discrepancy (see EAINT-12166's
   handoff for the full detail).
5. Run the full 8-scenario automated suite cleanly end-to-end for an actual
   automated baseline (today's execution was manual only).
6. Confirm whether the DO-upload-space requirement (item 3 above) is
   covered by the dev artifact and automation script, or still open.
7. Consider adding `EAINT-12167`/`EAINT-12166` entries to
   `lib/ticketStudies.ts` — still nothing there, same gap every prior
   handoff has flagged.

## Durable-knowledge candidates (flagged, not written here)
- `knowledge/flow-device-purchase.md` gained the EAINT-12408 root-cause
  finding today (fixed-width `.ins-serials` container, `float`+`nowrap`
  shrink-to-fit columns, automation's 12-char-all-caps serials as the
  trigger) plus the two Teams-sync sections (happy-flow reply, re-pinged
  QA-status question, new TS-count data) — already written, no further
  action needed there right now.
- No entry for `EAINT-12167` (or `EAINT-12166`) exists yet in
  `lib/ticketStudies.ts` — confirmed still empty today, same gap flagged in
  every prior handoff.
