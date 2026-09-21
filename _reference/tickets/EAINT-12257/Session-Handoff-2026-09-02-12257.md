# Session handoff — 2026-09-02 (EAINT-12257 ticket study)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up.

## Status as of 2026-09-02
Ran `/skills jira-ticket-study` on EAINT-12257 ("🔴[eAuto-Application] Add
DuitNow QR Payment Channel for Pre-application and Application"). Ticket has
**zero attachments** and **zero comments** — no SRD exists, and the ticket
is still **REQ GATHERING & ANALYSIS IN QUEUE**. Full study written to
`lib/ticketStudies.ts` (prepended, renders at `/jira/studies`). Nothing has
been built yet — no automation, no test script exists for this ticket.

**Same-day update**: Faizuddin followed up with details from an IRL
discussion with the dev in charge (not a written spec). Captured as a new
section in `knowledge/eauto-payments.md` ("DuitNow QR channel (EAINT-12257)
— dev-discussed shape, pre-SRD"), tagged `[from dev discussion, ticket
EAINT-12257, 2026-09-02]` since none of it is confirmed yet. The study's
`decisions`/`openItems` in `lib/ticketStudies.ts` were updated to match.

## What this ticket is (one-liner)
Adds DuitNow QR as a fourth UCD onboarding payment tile (Pre-application and
Application), alongside the three tiles already covered by EAINT-12153
(Card, FPX B2B, FPX B2C) — existing methods stay unchanged. Full detail:
`lib/ticketStudies.ts` → key `"EAINT-12257"`.

## What the dev discussion added (not in any SRD yet)
- Selecting DuitNow QR opens a popup showing the QR code, with a **Cancel
  Transaction** button and a countdown **timer**.
- The scan/paying side only ever offers **Approve** or **Reject** — no other
  outcome.
- QA must check the **invoice/e-invoice amount** matches what was charged.
- Testing needs a **physical phone** to scan and act on the QR — this can't
  be driven by Playwright the way the FPX/Fiuu chain (`scripts/eauto-payment-channels/`)
  can for the other three tiles.
- Open from the dev: whether **both iPhone and Android** need covering, or
  one is representative.
- Open from the dev: whether a **captcha** step exists on Pre-application
  ("maybe," not confirmed).

Full write-up with provenance: `knowledge/eauto-payments.md`.

## What's in this folder
Nothing yet — created this session, ready for the SRD/mockup once they
exist. No HTML or documents have been shared for this ticket.

## Open questions that block writing test scenarios
1. **Testing environment** — not stated anywhere (no field, no comments, no
   SRD).
2. **iPhone vs. Android** — is coverage of both required, or is one
   representative?
3. **Captcha on Pre-application** — real requirement or not?
4. **Relationship to EAINT-12153** — is this a narrower follow-on to that
   same payment-channels initiative, or a separate parallel one? Worth
   confirming since EAINT-12153's own script already reserved TS7/TS8 for
   "QR Code" with `test.skip` and no steps written — avoid scoping QR test
   cases twice.
5. **No headless Approve/Reject path is known** — unlike the Fiuu sandbox's
   response picker for the other three tiles, nothing suggests a non-phone
   way exists to trigger the QR outcome. Assume **manual-only** until told
   otherwise by dev.

## Update 2026-09-03 — the work is now a script modification, not a build

The **senior QA already has working automation for Pre-application and
Application**. Nothing new needs building for this ticket. The whole job is:

> take that existing script and **modify its payment step** so it drives to the
> DuitNow QR popup, **pauses for Faizuddin to scan the QR on a physical phone**
> and approve/reject, then resumes and asserts the outcome.

That makes the channel **semi-automated (human-in-the-loop)** — the
"manual-only" verdict below is superseded. Only the phone beat is manual.

**Faizuddin will hand over the senior's script** in a later session. Do not
write a replacement from scratch, and do not restructure the script — modify
only the payment step (see the `dont-touch-working-automation` rule).

Design notes to raise once the script is in hand:
- The pause needs to be a real wait, not a fixed sleep — resume on the page
  changing state (popup closes / success page), with a generous timeout that
  outlives the popup's own countdown.
- Run **headed**, not headless: the QR has to be visible on screen to scan.
- Keep the cancel-button and timer-expiry paths as separate scenarios; those
  two need no phone at all and can stay fully automated.

## Next steps for whoever picks this up
1. Get the testing environment confirmed — nothing else proceeds without it.
2. Ask the dev to settle the iPhone/Android and captcha open items.
3. Once an SRD or mockup exists, save it to this folder per the HTML/PDF
   capture standing rule and re-run the study.
4. Wait for the senior's Pre-application/Application script from Faizuddin,
   then modify its payment step per the 2026-09-03 update above.

## Update 2026-09-04 — script built, one blocker remains

The handover script arrived and has been built out in full:
`scripts/eauto-duitnow-qr/` (login, onboarding, dealer forms, listing,
identity generation, human-gate waits for reCAPTCHA + QR scan, FPX auto-pay
for the non-QR leg) and `app/eauto/duitnow-qr/` (dashboard page — Checker tab
+ Test Script tab, same shape as EAINT-12153's page).

Two real scenarios are wired in, both readable in
`app/eauto/duitnow-qr/scenarios.ts` and `scripts/eauto-duitnow-qr/tests/happy-flow.spec.ts`:

- **12257_TS01** — Pre-application fee (RM 108) paid by DuitNow QR (phases 1-2).
- **12257_TS02** — Registration fee (RM 990) paid by DuitNow QR (phases 1-11).
  Pays the pre-application fee by FPX on purpose, so the operator is only
  asked to scan once, at the payment point actually under test.
- **12257_TS99** — dummy, UI preview only, no spec/backend. Delete once TS01/TS02
  are confirmed running for real.

**The one remaining blocker**: the DuitNow QR tile selector
(`#payment-duitnow-qr` in `scripts/eauto-duitnow-qr/src/payment.ts`) and the
popup locator in `payByQr` are both `[UNVERIFIED]` — no HTML has ever been
captured for that payment step, so the whole QR-specific path is still a guess
built from the dev's verbal description. Nothing else stops a run except
this. Per the HTML capture standing rule, the first live pass that reaches
the payment step must save the tile + popup HTML into this folder (or
`_reference/html/eauto/`) before the selectors are corrected.

**BackOffice/Fiuu credential defaults** were added to the dashboard form
(`app/eauto/duitnow-qr/TestScriptTab.tsx`, per
`[[defaults-belong-in-the-dashboard]]` — prefill lives in the form, not a
script env fallback) and the password fields were switched from masked to
plain text for easier copy-checking during runs:

| Role | Username | Password |
|---|---|---|
| Approver | `jasons` | `Pw12345` |
| Assignee | `mfared` | `eauTo>!2026@` |
| Fiuu simulator | `Gaara` | `letmepaywithsand` |

## Next steps (superseding the 2026-09-02 list above)
1. Run TS01 headed against staging to reach the DuitNow QR payment step.
2. Capture the tile + popup HTML per the standing rule, save it to this
   folder, then correct the selectors in `src/payment.ts`.
3. Re-run TS01 end to end with a real phone scan; then TS02.
4. Still open from the dev: iPhone vs Android coverage, captcha on
   Pre-application.
