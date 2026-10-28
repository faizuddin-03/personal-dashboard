# EAINT-12230 — study (2026-10-26)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD] SSM: Add Duplicate Purchase Validation on Payment Step to Prevent Double Charge"
2. **Jira status:** **Code Review**. Issue type **Bug**. Updated 2026-10-21 16:08.
3. **Priority:** Medium.
4. **Fix version:** "S35.X-20261102 🌞/🌚" (release date 2026-11-02). Labels: 260824-260828, Aug2026, ProductBacklog.
5. **QA (Jira cf[10041]):** Muhammad Amirul Azfar Bin Kamarulazam. Miro "- QA:" blank.
6. **BA:** not set (Miro "- BA:" blank). Same Teams group as EAINT-12121 (BA Lim Yi Link).
7. **Dev:** reporter is the dev "zhan.choon" (Wong Zhan Choon). **Assignee: none.**
8. **Deployment date (Miro):** column **"READY FOR TESTING TICKETS"** — **no date**.
9. **Test env:** not stated (Miro "- Test Env:" blank). Must be same build as EAINT-12121.
10. **Miro note (verbatim):** "- Test together with EAINT-12121".

## Sources read

1. Jira EAINT-12230 via Atlassian MCP, 2026-10-26: description, **0 attachments**, 0 comments, 0 sub-tasks, link "relates to" EAINT-12121, 0 remote links.
2. **SRD: none exists** — Jira has no attachments. Description is the only requirement source.
3. Miro capture lines 382-402 (card in `EAINT-12230-miro-card.md`).
4. Teams `_reference/teams/EAINT-12121-12230-SSM-Repurchase-7-Days.md` — no message names 12230 (ticket created 2026-08-27; last message 2026-08-24).
5. QA colleague's study (read-only): `_reference/codebases/eauto-qa-azfar`, branch `origin/12121-past-miro-board`, `cr/EAINT-12230/STATUS.md`, `cr/EAINT-12230/01-research/study.md` (2026-10-20).
6. Related study in this folder: `../EAINT-12121/EAINT-12121-study.md` (SRD v1.0 of 12121 copied there).

## What changes

1. **Portal:** UCD. **Module:** SSM purchase, STMS Step 4 → Payment Confirmation.
2. **Problem (Jira, verbatim):** "A UCD company can be charged twice for the same BRN. The "transaction is paid" refusal added recently only applies when user clicks Purchase SSM — it does not apply when a user confirms payment from a dialog that was already open on their screen, which stays valid for about 24 hours."
3. **Two routes (Jira table):**
   1. "Search step | Clicks **Purchase SSM** on Step 4 | Yes — refuses, no charge"
   2. "Payment step | Clicks **Yes** on a Payment Confirmation dialog already open | **No — charges again**"
4. **Impact (Jira):** "the company pays twice for one SSM document, no refund." / "It's a regression — old prod blocked this; the recent change removed an over-broad lock (correctly) and fitted the replacement to only one of the two doors."
5. **Expected after fix (Jira, verbatim rows):**
   1. "Colleague in the same company already **paid** this BRN, **not yet Approved** | Refuse payment — no charge"
   2. "Winning purchase **Approved**, 10-minute cooldown **not elapsed** | Refuse payment — no charge"
   3. "Winning purchase **Approved**, 10-minute cooldown **elapsed** | **Allow** repurchase — must keep working"
   4. "Clerk **retries payment on their own** already-paid row | **Allow** — return existing payment, no 2nd charge"

## New vs existing behaviour

1. **Existing (on the 12121 build):** duplicate check only on [Purchase SSM]; a stale open Payment Confirmation dialog charges again. `[from Jira description]`
2. **New:** the same check also runs on [Yes] of the payment dialog.
3. `[inference, from QA colleague's study]` The "today" in the ticket is the **12121 build**, not production ("the recent change removed an over-broad lock" = the 7-day block). So 12230 is a fix to 12121's new guard. Confirm with dev.

## QA scope (Miro card + Jira)

1. **Miro:** "Testing Scope: (Automation + Manual Testing)"; mandays blank ("Est. Testing Mandays: days (1 QA)"); "Test together with EAINT-12121".
2. **Jira test scenarios (verbatim):**
   1. "Works today — B clicks Purchase after A pays → refused, 1 paid row ✅"
   2. "THE BUG — A opens 10:00, B opens 10:01 (dialog left open), A pays 10:05, B clicks Yes 10:06 → charged twice, 2 paid rows ❌"
   3. "Cooldown — within 10 min of approval → refused; after 10 min → repurchase must be allowed"
   4. "Own retry — user retrying their own paid row must succeed, never be blocked"
   5. "Same user, same deal repurchase — must stay allowed (the old lock wrongly blocked this)"
3. **Prior draft:** joint with 12121 — sheet "3 Duplicate Payment", **12230_TS1-15** (6 P1, 8 P2, 1 P3), awaiting gate 0. QA decision there: "12230's expected results come from its **ticket description only**; no SRD will be requested". `[from Azfar repo, cr/EAINT-12230/STATUS.md, 2026-10-20]`
4. Evidence of no double charge: count paid rows in BO SSM Transaction Listing (+ RHB payment). `[from Jira "1 paid row" / "2 paid rows"; 12121 SRD REQ-008]`

## Affected regression areas

1. Everything in EAINT-12121 (same build). See `../EAINT-12121/EAINT-12121-study.md`.
2. RHB payment retry path ("own retry"). `knowledge/eauto-payments.md`, `knowledge/flow-payment-channels.md`.
3. Old duplicate guard popup (from EAINT-5155) "SSM Document for this Seller Company was purchased recently." — whether it stays. `[from Azfar study, SRD 5155 v1.4]`
4. eSTM payment step — not named in the ticket.

## Test data / env needs

1. **Two users of the same UCD company**, two sessions (normal + incognito), working **different STMS deals with the same seller BRN**. `[from Jira "two users in the same company work on different STMS deals for the same seller company"]`
2. A way to hold a purchase in "paid, not yet Approved" (e.g. eSim SSM submission Failed). `[from Azfar study Q7]`
3. Real 10-minute waits unless dev patches times. `[from Azfar study Q8]`
4. Same environment / build as EAINT-12121; not named.

## Dependencies / related tickets

1. **EAINT-12121** (Code Review, same fix version) — "relates to".
2. Prior art: EAINT-5155 (duplicate payment checking on SSM Enquiry, Payment, Retry Payment), EAINT-9247 "Multiple UCDs – Duplicate Payment – Same ROC" rows. `[from Azfar study]`

## Teams decisions (verbatim)

1. No Teams message names EAINT-12230 in the 2026-10-16 export. The 10-minute rule it relies on: `[Teams EAINT-12121, 2026-08-11 18:01, BA]` "confirmed with Nurul to have 10 min cooling down period. Within this 10 min period, UCD is unable to repurchase this SSM Document."
2. Newer Teams chat (after 2026-10-16) not covered here.

## Open questions / conflicts

1. **No SRD.** Refusal message on the payment step not defined in Jira. Neither ticket gives wording. `[Azfar study Q16 / C2]`
2. **Cooldown anchor:** Jira "within 10 min of **approval**" vs 12121 SRD Assumption 1 "counted from the previous SSM **purchase**". `[C1]`
3. **Paid-not-Approved / Failed:** Jira row 1 refuse vs 12121 REQ-004 "regardless of the SSM status". `[C2/C3]`
4. **Scope:** Jira "same company"; old 5155 rule was database-wide by SSM number (any UCD). Is a second UCD company on the same BRN refused or allowed? `[Azfar study C5]`
5. **eSTM:** ticket names STMS only. Is eSTM payment step also fixed?
6. **Button labels:** Jira "Yes"; 5155 SRD [Proceed]. Observe on screen.
7. **No assignee, no BA** on the ticket; Miro BA / QA / mandays blank.
8. **Env + deployment date** not set; fix version S35.X-20261102 vs QA colleague's notes "S34.X-20261028 / release 2026-10-28".
9. How to reproduce "own already-paid row" retry on demand. `[Azfar study Q6]`

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-ssm.md` (FUTURE entry), `knowledge/flow-stms.md`, `knowledge/eauto-payments.md`.
2. STMS/E2E runner `app/api/eauto-e2e/run/route.ts`; eSTM `app/eauto/estm`.
3. QA colleague's joint draft (read-only): branch `origin/12121-past-miro-board`, `cr/EAINT-12121/01-intake/scenarios.yaml` sheet 3; board artifact https://claude.ai/artifact/UKp164vuctFJWjNBhbZDbW.
