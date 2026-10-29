# Session handoff — 2026-10-26 (EAINT-12153)

Scratch note for resuming later. Not part of the knowledge base.
Supersedes `Session-Handoff-2026-09-01-12153.md` (deleted). That note covered
the 2026-09-01 CapacityTrack task and the old `scripts/eauto-payment-channels/`
skeleton; the work has since moved to `scripts/eauto-12153/` and `/eauto/12153`.

Sources: session transcript `690be69a-ce32-4f9a-93b6-8fa1dc616122.jsonl`
(main work), `102b0199-…jsonl` (future-deployment study, Teams sweep),
`git status` (all suite/page files still uncommitted, no commits today),
`knowledge/flow-payment-channels.md`, `knowledge/flow-ucd-onboarding.md`.

## One-liner

1. Adds **Credit/Debit Card** and **Online Banking (Business) – FPX B2B** to
   Pre-Application and Application payment in UCD onboarding; FPX (Personal)
   retained. Full study: `lib/ticketStudies.ts`, key `EAINT-12153`.

## Status as of 2026-10-26

1. **Jira:** Testing In 1st Env. Fix version `S34.1X-20261029`, deploy
   **Thu 29 Oct morning**. `[from lib/ticketStudies.ts, studied 2026-10-26]`
2. **QA deadline:** testing must finish by **EOD 28 Oct**. `[from Teams sweep, 102b0199 transcript]`
3. **Official TS:** SharePoint v42 (TS1–TS12). No local copy of v42. `[from study subagent report]`
4. **Automation:** `scripts/eauto-12153/`, dashboard `/eauto/12153`. Uncommitted.
5. **TS results carried in (start of day):** TS01, TS05, TS06 Pass. TS02–TS04 Failed 23 Oct, no passing re-run on record.

## Today's work

Most changes were made in **both** 12153 and 12257 (confirmed table in transcript, 07:08).

### A. Card failure method

1. Failed card attempt now uses **Mastercard 5200 0000 0000 1096** + **wrong OTP 000000** on 3D Secure.
2. **Confirmed by Faizuddin**, verbatim: "for card, we can use invalid OTP to simulate the failed payment. so no need for the other options".
3. Wrong CVV / wrong expiry picker added, then **removed** the same day.
4. Old card **5555 5555 5555 4440** does not fail.
5. Saved browser settings still held the 5555 card. Page load now **migrates** it to 5200….
6. **Proven in a run:** 12153_TS08 log shows "wrong OTP 000000 typed" → "Unsuccessful Payment", on both legs.
7. Pre-App suite also uses wrong OTP (no picker).
8. Not changed: `scripts/eauto-payment-channels/utils/runPaymentLeg.ts:108` still has the 5555 card (old suite, outside 12153/12257).

### B. Business Trading (Sabah / Sarawak) data

1. No Excel, no eSIM. Per a colleague: "All the data was made up."
2. **Licence:** `SBH/TL/9` / `SWK/TL/9` + 6 digits, auto-filled, shuffle button.
3. **Application TIN: always required.** Taken from a spent Excel row (at least one of ROC / New ROC / TIN already used).
4. **"Include TIN" switch:** now only decides whether the **Pre-Application** also gets the TIN.
5. **TIN pool:** up to 15 spare TINs sent. On the LHDN **"Service Unavailable"** pop-up (or "already used / exists / duplicate"), the run swaps TIN. **Stops after 3** refusals in a row.
6. **Ledger:** `TIN_USED` / `TIN_SPOILED` lines mark TINs used on the dashboard. Shuffle skips TIN Status = PRESENT and run-used rows.
7. **Application step 1:** Motor Vehicle Association **"No" always ticked**, re-checked before every Next.

### C. Runner changes

1. **BO listing:** searches as soon as Search appears. Removed the 30 s `settleObs` wait.
2. **Passed TS auto-unticked** on the dashboard. Failed/stopped stay ticked.
3. **Deploy notice** moved to the page title (once per ticket).
4. **DuitNow Cancel/close** rule (EAINT-12625, no error message) also ported to this suite's `qrLeg.ts`. The 12153 workbook has no DuitNow rows, so it was not edited.
5. **Reopen step** (shared with 12257): closes old browser first, retries "Access Denied" up to 5x, handles page 1 with data kept.

### D. 12153 batch run results (TS07–TS12)

| TS | Result | Cause / fix |
|---|---|---|
| TS07 | Failed | Card VISA, Business Trading (Sarawak). TIN typed, then **blanked by late form load**; "This field is required". **Fixed** in both suites: wait for step 1 to load, re-check 1.5 s after typing, `keepTin` retype before every Next. |
| TS08 | **Pass** | Mastercard wrong OTP then success, Sdn Bhd. |
| TS09 | **Pass** | FPX B2C Maybank → CIMB, failed then redo, BO Payment Details. |
| TS10 | Failed | reCAPTCHA in the reopened browser not ticked within 5 min. **Fixed**: `bringToFront()` on the new window. |
| TS11 | Failed | reCAPTCHA missed by the user. **Not a script issue.** |
| TS12 | **Pass** | FPX B2C HSBC → Affin Bank, failed then redo, BO listing status, Business Trading (Sarawak). |

## What's in this folder now

1. SRD v1.1 and v1.2 PDFs, B2B mockups HTML, the 1.9.2026 CSV.
2. `EAINT-12153-official-TS-sharepoint-v38-20261021.md` (older than live v42).
3. `First_QR_TestRun/`, `guided-capture/`.
4. Two "Suggestion by Claude" workbooks.
5. This handoff.

## Open items

1. **Re-run** 12153 **TS07, TS10, TS11**. TS10/TS11 need the reCAPTCHA ticked in the new window.
2. **TS02–TS04:** failed 23 Oct; no re-run seen today.
3. **Re-drop** `company-details-checker_2026-10-22.xlsx` so the **TIN Status** column is read (32 TINs marked PRESENT).
4. **Watch:** if a run stops after 3 TIN refusals, the TIN + made-up licence pair is the cause. Run with "Include TIN" off.
5. **AffinMax:** dev said on 22 Oct it was renamed on staging; staging still showed "Affin Bank B2B" (FPX_B2B_ABBM) in today's 12257_TS10 tile list. Dev answer not recorded.
6. **EAINT-12627** (QR timer expiry) is a 12257 bug, but the 12153 suite carries the same `qrLeg.ts` expectation.
7. **Old CapacityTrack task** (log 2026-09-01) from the superseded handoff: never confirmed done. Memory says the timesheet may no longer be needed (May, 2026-10-05). Confirm with Faizuddin before acting.

## Next steps

1. Reload `/eauto/12153` (picks up the card migration) and re-drop the company Excel.
2. Re-run TS07, TS10, TS11; then TS02–TS04.
3. Commit the suite and page files once runs settle (all still untracked).
