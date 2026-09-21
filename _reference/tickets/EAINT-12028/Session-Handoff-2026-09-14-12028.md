# Session handoff — 2026-09-14 (EAINT-12028)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. **Supersedes
`Session-Handoff-2026-09-04-12028.md`** (deleted in this update — everything
still relevant from it is folded in below).

## What this ticket is (one-liner)
Replaces a manual monthly Excel process with a new eAuto BackOffice module
that auto-calculates association/vendor payments (FMC for cars, MMSDA for
motorcycles), takes each month through a Drafter → Reviewer → Approver
e-signature workflow, and generates the Payment Request PDF once fully
approved. Phase 1 = Car + Motorcycle only; JomCheck deferred. Full
requirement-by-requirement detail: `lib/ticketStudies.ts` → key
`"EAINT-12028"`.

## Status as of 2026-09-14 — you are now QA on this ticket
Jira's changelog shows two silent events this morning, **no comment
explaining either**:
- `08:19` Fix Version flipped `S34.X-20261005🌚` → `[QA]Ready for Testing
  Tickets` (Chee Mei Jia)
- `09:25` **QA field set to Muhammad Faizuddin Bin Bidi**, by May Chin

The `status` field itself is still stuck on "Ready For Development" — it
has not transitioned. Treat the fixVersion move as a practical "go ahead"
signal, not a confirmed green light; ask Chee Mei Jia or May Chin why this
happened today, since nothing written explains it.

**MR !1's review state is unverified as of today.**
`https://masterjedi.modefair.com/eauto/eauto-backoffice/-/merge_requests/1`
did not load in the browser this session (likely needs VPN/on-prem
network). As of the 2026-09-04 snapshot it was ⛔ BLOCKED (1 blocker, 2
high, 7 medium code-review findings; a fix pass for all 10 was in progress,
8/10 coded, not yet merged). Two findings are test-relevant, not just
internal cleanup — re-check both once the fix lands, don't trust a pre-fix
build:
- **H1** — a role from one BackOffice module could authorize a different
  module's pages (cross-module role confusion).
- **H2** — an open redirect on session-expiry/logout.

**Do not sign off staging readiness** until (1) MR !1's review flips clean
and merges, and (2) the testing environment is confirmed — still nowhere
in the ticket, SRD, or Teams as of today.

## Teams check this session (2026-09-14)
Searched the dedicated group chat ("EAINT-12028 [eAuto-BackOffice] New
Module...", 14 members) and the wider `EAINT-12028` keyword search across
Teams. **No messages after 2026-09-04 11:17** in the dedicated group — so
there is no human explanation yet for today's Jira changes. The only other
hits were recurring automated daily-digest posts in the "eAuto QAs" channel
(self-posted, not fresh discussion).

Prior Teams discussion (through 2026-09-04) settled three implementation
questions, now folded into `lib/ticketStudies.ts`'s decisions:
- Private + company vehicles are **totaled together** per type (car/moto),
  not split.
- Per-state breakdown uses the **dealer's registered/UCD company state**,
  not the vehicle's number-plate state.
- Whether Ops has a formal SOP for excluding cancelled-but-JPJ-approved
  transactions was raised by Mei Jia but **never confirmed** — still open.
- The Payment Requisition PDF **format was confirmed final** on 2026-08-21
  (an actual sample PDF was shared and approved by the ops-facing
  stakeholder; ignore its filename, that part wasn't final).

## New finding this session: who can download the FMC/MMSDA PDFs
**Not role-restricted.** SRD REQ-016 gates the download buttons on the
month's full-approval state only, never on identity. The mockup's own
source comment confirms intent: `// Invoice bar - shown for ALL roles on
details; downloadable once fully approved` (line ~508 of
`association-payment-listing-mockup_20260731.html`). So Drafter, Reviewer
and Approver can all see/download both PDFs once fully approved — nothing
limits it to just the Approver. Captured in
`knowledge/flow-association-payment-listing.md` (Payment Request generation
section) and `lib/ticketStudies.ts` (decisions). Re-check against the real
build once reachable — this is inferred from a mockup comment plus SRD
silence, not a standalone SRD line.

## What's in this folder now
- `EAINT-12028_SRD_v1.1_20260731.pdf` — latest SRD (unchanged since
  2026-09-02).
- `association-payment-listing-mockup_20260731.html` — mockup HTML,
  studied in `knowledge/flow-association-payment-listing.md`.
- `EAINT-12028-artifact-qa-test-guide-from-dev.html` — dev QA test guide,
  captured 2026-09-04.
- `EAINT-12028-flow-and-roles-artifact.html` — source for the published
  flow/roles diagram (https://claude.ai/code/artifact/7f84d14c-d908-4cb0-b045-a4ec86d8ab93).
- `EAINT-12028 - [...] .xlsx` — the 27-scenario high-level test script +
  Test Scope sheet, drafted 2026-09-04. Still unused — nothing has been
  executed against it.

## Still not in this folder (carried over, unchanged)
`Sample ASSOCIATIONS PAYMENT REQUISITION_20260728.xlsx` — no tool available
this session could download Jira attachment binaries either. Still needs a
manual drag-in or a future session with Chrome/browser automation.

## Open items (carried over + new)
1. **Testing environment still unconfirmed.** Nowhere in the ticket, SRD,
   or Teams. Needs the requestor (Chee Mei Jia) or dev to confirm —
   especially now that you're QA of record.
2. **Has MR !1's fix pass completed and merged?** Unverified today — check
   the MR URL directly once you have VPN/on-prem access.
3. **Why did the ticket flip to Ready-for-Testing and get reassigned today
   with no explanation?** Worth a direct ping to Chee Mei Jia or May Chin.
4. Zero-transaction state display (RM0.00 vs omitted) — still open, SRD
   gives no worked example.
5. Details page state row order (SRD numeric 01–16 vs mockup's
   alphabetical-ish order) — still open, don't hardcode a row-position
   assertion until checked live.
6. Ops' SOP for cancelled-but-JPJ-approved transactions — Mei Jia asked
   Jin Siang Boo to double-check on 2026-09-04; no answer visible in Teams
   since.
7. Sample xlsx attachment still not pulled down (see above).

## Next steps for whoever picks this up
1. Chase the environment confirmation and the MR !1 merge status — both
   still block moving from "scenarios drafted" to "scenarios can actually
   be run."
2. Ask why the ticket was reassigned/re-bucketed today — the answer may
   itself resolve the environment or MR-status open items.
3. Once environment + a mergeable build exist, turn the 27 high-level
   scenarios into detailed, executable test steps (URLs, exact selectors,
   real test data) — the QA guide's own REQ-by-REQ cases and security
   checklist remain the richer source to expand from, more so than the
   mockup.
4. Re-confirm KIV, state row order, zero-transaction display, and the
   all-roles PDF-download behaviour against the real build once
   accessible — all four are flagged open/inferred above.
5. Keep the flow/roles artifact and
   `knowledge/flow-association-payment-listing.md` in sync as facts get
   confirmed — don't let the published diagram drift from the written
   knowledge.
6. No automation exists for this ticket yet — nothing built to run or
   re-run.
