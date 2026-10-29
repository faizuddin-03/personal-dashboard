# Session handoff — 2026-10-26 (EAINT-12257)

Scratch note for resuming later. Not part of the knowledge base.
Supersedes `Session-Handoff-2026-09-02-12257.md` (deleted). That note covered
the pre-SRD study and the old `/eauto/duitnow-qr` build; all of it is out of date.

Sources: session transcript `690be69a-ce32-4f9a-93b6-8fa1dc616122.jsonl`
(main work), `102b0199-…jsonl` (future-deployment study, Teams sweep),
`git status` (all suite/page files still uncommitted, no commits today),
`knowledge/flow-payment-channels.md`, `knowledge/flow-ucd-onboarding.md`.

## One-liner

1. Adds **DuitNow QR** as a payment channel for the Pre-Application fee and the
   Application (Registration) fee in UCD onboarding. Full study:
   `lib/ticketStudies.ts`, key `EAINT-12257`.

## Status as of 2026-10-26

1. **Jira:** Testing In 1st Env. Fix version `S34.1X-20261029`, deploy
   **Thu 29 Oct morning**. `[from lib/ticketStudies.ts, studied 2026-10-26]`
2. **QA deadline:** testing must finish by **EOD 28 Oct**. `[from Teams sweep, 102b0199 transcript]`
3. **Official TS:** SharePoint **v27** (uploaded today; v25 kept in version history).
4. **Automation:** `scripts/eauto-12257/`, dashboard `/eauto/12257`. Uncommitted.
5. **Bugs:**
   1. **EAINT-12625:** **Closed** today. Reassigned to Faizuddin.
   2. **EAINT-12627** (timer expiry → Pending, no message): **still To Do**.

## Today's work

### A. Teams scope + source check

1. High-level scope written for Teams in Faizuddin's nested format.
   Artifact: https://claude.ai/artifact/LuRaJ2ENKnhi8LrSsG3yD7
2. **ROB left out** (no ROB row in official TS v19).
3. **Closing the gateway page:** no SRD covers it. Only the TS (12257_TS4, row 7, E2) expected the message.

### B. EAINT-12625 closed, TS + automation updated

1. Closed via `/qa-issue-retest` with comment 57993, verbatim:
   "Follow existing behaviour where it will not show error message if close the payment gateway page".
2. `qa-issue-retest` skill updated:
   1. CLOSED lozenge = **green**.
   2. Any status change → reassign to Faizuddin.
3. **Official TS v27** changes:
   1. **TS3 (Cancel):** Pre-App returns to **Business Info Review**, declaration **unticked**, no error message. Application returns to **Page 5**, no error message. BO step removed.
   2. **TS4 (close QR window):** no error message, BO step removed.
   3. **TS12 (Cancel + reopen):** no error message; unticked declaration on Pre-App leg.
   4. **Faiz's Note E25/E26:** "No error message - follow existing behaviour (EAINT-12625, 26/10/2026)".
4. **Automation** (12257, 12153, Pre-App suites): Cancel/close assert **no** message; BO Failed check skipped for these rows.
5. Saved HTML: `_reference/html/eauto/obs-preonb-review-after-duitnow-cancel.html`.
6. OneDrive copy: `eAuto Documents/EAINT-12257/EAINT-12257 - official TS v25 + no-error-message update 2026-10-26.xlsx`.
7. **Caveat raised by Claude (not settled):** EAINT-12625 was about **Cancel Transaction**, not closing the page. The comment covers closing only.

### C. Card failure method (shared with 12153)

1. Failed card attempt now uses **Mastercard 5200 0000 0000 1096** + **wrong OTP 000000** on 3D Secure.
2. **Confirmed by Faizuddin**, verbatim: "for card, we can use invalid OTP to simulate the failed payment. so no need for the other options".
3. Wrong CVV / wrong expiry picker added, then **removed** the same day.
4. Old card **5555 5555 5555 4440** does not fail (12257_TS09 paid on first attempt).
5. Saved browser settings still held the 5555 card. Page load now **migrates** it to 5200….
6. CANCEL on the 3D Secure page = Pending, not Failed.

### D. Business Trading (Sabah / Sarawak) data (shared with 12153)

1. No Excel, no eSIM. Per a colleague: "All the data was made up."
2. **Licence:** `SBH/TL/9` / `SWK/TL/9` + 6 digits, auto-filled, shuffle button.
3. **Application TIN: always required** (12257_TS08 showed "This field is required"). Taken from a spent Excel row.
4. **"Include TIN" switch:** now only decides whether the **Pre-Application** also gets the TIN.
5. **TIN pool:** dashboard sends up to 15 spare TINs. On the LHDN **"Service Unavailable"** pop-up (or "already used / exists / duplicate"), the run swaps TIN. **Stops after 3** refusals in a row.
6. **Ledger:** `TIN_USED` / `TIN_SPOILED` lines mark TINs used on the dashboard. Shuffle skips TIN Status = PRESENT and run-used rows.
7. **Application step 1:** Motor Vehicle Association **"No" always ticked**, re-checked before every Next.

### E. Runner changes (shared with 12153)

1. **BO listing:** searches as soon as Search appears. Removed the 30 s `settleObs` wait.
2. **Passed TS auto-unticked** on the dashboard. Failed/stopped stay ticked.
3. **Deploy notice** moved to the page title (once per ticket), on all 7 automation pages.

### F. Run results today

| TS | Result | Cause / fix |
|---|---|---|
| TS03 | Not run | Staging Tomcat down (login page timed out). Faizuddin: "tomcat issue. need to wait to restart". |
| TS05 | Not run | eSIM donor row #3 page loaded blank during recovery. Leftover Enquiry row #471. |
| TS07 | Unknown | Was running at 12:36; no result in transcript. |
| TS08 | Failed | Application TIN blank → "This field is required". **Fixed** (TIN always sent). |
| TS09 | Failed | 5555 card did not fail. **Fixed** (5200 card + wrong OTP). |
| TS10 | **Pass** | FPX B2B Maybank → CIMB, Business Trading (Sarawak). |
| TS11 | Failed | Only check failed: BO "03:48PM" vs UCD "03:48pm". **Fixed** (case-insensitive). |
| TS12 | Failed ×2 | 1st: "Access Denied" lock on reopen. **Fixed**: close old browser first, retry up to 5x (30 s apart). 2nd: reopened link lands on **page 1 with data kept** (EAINT-12414 scope). **Fixed**: script checks details kept, presses Next, ticks declaration, retries DuitNow. Access Denied typo also fixed. |
| TS13 | Failed | Open bug **EAINT-12627**. Timer expiry → no message; Registration Fee stays "Pending UCD"; Failed filter 0 rows. |

### G. EAINT-12627 sources

1. **SRD v1.0 REQ-005**, verbatim: "The system shall treat the transaction as failed when any of the following occurs: a. The timer reaches 00:00 before payment completes …".
2. Acceptance, verbatim: "The existing message is shown: "Unsuccessful Payment — Something went wrong and your payment didn't go through. Please choose a payment method and retry.""
3. **Official TS5, row 8:** "After the timer expire, error message Unsuccessfull Payment ... 3. Ensure Payment = Failed".
4. SRD PDF downloaded today (Jira attachment 156533): `_reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910.pdf`.
5. SRD page 11 with REQ-005 boxed: https://claude.ai/artifact/JPADM78Nrab92BjecyJNqM (private).
6. **TS05 vs TS13:** same timer flow. TS13 adds BO listing checks and runs on Business Trading (Sabah).

## What's in this folder now

1. `EAINT-12257-SRD-v1.0-20260910.pdf` (new today) + `-text.md`.
2. `EAINT-12257-official-TS-sharepoint-v19-20261021.md` (older than live v27).
3. Two "Suggestion by Claude" workbooks.
4. This handoff.

## Open items

1. **Re-run** 12257 **TS11** and **TS12** to confirm today's fixes.
2. **Not re-run after fixes / blocked today** (from transcript): TS03, TS05, TS08, TS09. TS04 (BO hang, 23 Oct) and TS02 (failed 22 Oct) — no re-run seen. TS07 result unknown.
3. **EAINT-12627 decision:** fix, or close as existing behaviour like 12625. TS05 and TS13 stay failed until then.
4. **EAINT-12625 scope gap:** the comment covers closing the page, the ticket covers Cancel. Teams sweep notes no BA ruling seen.
5. **Re-drop** `company-details-checker_2026-10-22.xlsx` so the **TIN Status** column is read (32 TINs marked PRESENT).
6. **Watch:** if TS08 stops after 3 TIN refusals, the TIN + made-up licence pair is the cause. Run with "Include TIN" off.
7. **Application Page 5 after Cancel:** only "no error message" checked. Page 5 HTML not captured.
8. **eSIM form wait:** script reads the donor form without waiting for it. Offered, not changed.
9. **AffinMax:** staging still "Affin Bank B2B" in today's TS10 tile list (FPX_B2B_ABBM). Dev answer not recorded.
10. **Prod:** Teams 19 Aug said Fiuu had not enabled DuitNow QR in prod. Nothing newer. `[from study subagent report]`

## Next steps

1. Reload `/eauto/12257` (picks up the card migration) and re-drop the company Excel.
2. Re-run TS11, TS12, then the blocked/unfixed rows in item 2 above.
3. Chase the EAINT-12627 decision with BA/dev before 28 Oct EOD.
4. Commit the suite and page files once runs settle (all still untracked).
