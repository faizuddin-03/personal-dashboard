# Insurance — products, eligibility and test setup

## ⚠️ Read this before quoting anything below

**Underwriting rules change, and this file will go stale without warning.** The
product rules here — engine sizes, vehicle ages, sum insured bands, what gets
declined — are **reference, not authority**. Insurers revise underwriting
continuously, and a rule that held last quarter may simply not hold today.

So:

- Never assert one of these limits as an expected result in a test script without
  checking it still holds. Treat a mismatch as "the rule moved", not "the system
  is wrong".
- **If the system, an SRD, or a requestor contradicts anything here, raise it —
  don't silently follow the file and don't silently rewrite it.** Say what the
  file claims, what the new source says, and ask whether to update the entry.
  Then update it in the same change if the answer is yes.

Everything in this file is `[from QA team, 2026-08-12]` unless tagged otherwise.
The underwriting rules are not verified against code in this repo; the
EAINT-11864 and test-setup sections below cite the automation and captures that
back them. Automation detail for the reminder lives in
[flow-quotation-reminder.md](flow-quotation-reminder.md); the inbox in
[mailtrap.md](mailtrap.md).

## Before testing — data rules per system

These are setup rules, not underwriting, and they don't drift the way the product
rules do.

| System | Rule |
|---|---|
| **eAuto** | Do **not** use real IC or SSM numbers — but the **format must be real** (`xxxxxx-A`, etc.) |
| **Secarang** | Use **real** IC and SSM numbers |
| **FI-Flow** | Create a hire purchase record, then change the response code to **69E** at **step 4, after the JPJ enquiry and before proceeding to payment** |

### An eSTM is required to PURCHASE, not to quote

The line to hold: **quoting is free, buying needs an approved eSTM.**

| What you want to do | Needs an eSTM? |
|---|---|
| Get a Free Quote — enter vehicle no + IC, see insurer prices, **generate a quotation** | **No.** Vehicle number and IC are enough |
| Proceed to payment and create the insurance | **Yes — an approved eSTM** |

So "checking" (quote comparison, quotation generation, expiry behaviour) is
reachable with no eSTM at all, and only the purchase leg needs one.
`[from QA team, 2026-08-14]`

### ⚠️ The quotation is generated at STEP 3, not at step 1

`[from QA team, 2026-08-17]`

**Rule of thumb, stated plainly so it doesn't get relearned: any insurance run
that stops before step 3 (payment form) will NOT show up in the Insurance
Transaction Listing. No row, at any status, however you filter it.** This is
not a bug and not something the automation is doing wrong — nothing is written
server-side until step 3 is reached, so there is nothing for the listing to
show. `[from Faizuddin, 2026-08-18]`

| Stop at | Quotation record / listing row | Reminder email |
|---|---|---|
| Step 1 (quotes shown) | **none** | **yes** |
| Step 2 (coverage) | **none** | **yes** |
| Step 3 (payment form) | yes — a row exists, status **`PENDING`** ("Pending Payment") | yes |

Seeing insurer cards is not "a quotation generated". Nothing is persisted until
step 3, so a step-1 or step-2 run leaves **nothing in the listing at all**.

⚠️ **Correction, 2026-08-18: the step-3 row is NOT `DRAFT` ("Quotation").** This
file previously claimed it was, `[from QA team, 2026-08-17]` — a live capture of
an unpaid step-3 transaction shows status `PENDING` ("Pending Payment") instead:
`_reference/html/eauto/insurance-listing-pending-payment-row.html`. Trust the
capture over the earlier claim. Practical effect: any check for "did step 3
persist something" must accept **either** `DRAFT` or `PENDING` as proof — see
`RESUMABLE_STATUSES` in `scripts/eauto-quotation-reminder/pages/
InsuranceListingPage.ts`. Whether `DRAFT` is reachable via some other path
remains unconfirmed; what's certain is that stopping at step 3 specifically
produces `PENDING`.

**The email is still sent.** A separate backend process detects that the user
dropped out at step 1 or 2 and sends the reminder off the back of that. That
process has **no UI whatsoever** — no listing row, no status, nothing to look at.

**Consequence: for a step-1 or step-2 stop, Mailtrap is the only validation
that exists.** Any check that opens the insurance listing and looks for the
vehicle will find nothing and report a failure against a system that is working
correctly — which is exactly what EAINT-11864 TS01 did before 2026-08-17.

### Navigating away from step 3 too fast can lose the write

**Landing on `body#payment` is not proof the DRAFT row exists yet.** The
quotation-reminder automation was moving straight from "step 3 is visible" to
checking the Insurance Transaction Listing, with no settle time at all — and
the row sometimes was not there. If the persist happens on a call that fires
after the payment page paints, rather than one the page render blocks on, a
same-page `page.goto()` fired that fast can cancel it mid-flight, the same way
navigating away cancels any other in-flight request on the page you are
leaving.

Fixed 2026-08-18 in `scripts/eauto-quotation-reminder`: `InsuranceStepsPage.
expectStep(3)` now waits for network idle plus a settle buffer before
returning, and `InsuranceListingPage.hasQuotation()` retries its search a few
times instead of trusting one look — the same shape as the retry
`scripts/eauto-e2e`'s `TransactionEnquiryPage` already uses for exactly this
kind of "backend hasn't caught up yet" gap. `[from Faizuddin, 2026-08-18]`

Read "quotation generated" in the rest of this file with that in mind: where it
means *a row the cron can pick up*, it implies the run reached step 3.

⚠️ **Don't turn that capability into a scope reduction for EAINT-11864.** "The
system lets you quote without an eSTM" is true; "so 11864's cases don't need one"
is **false**, and the two were conflated once already. Read the preconditions:

| Case | eSTM |
|---|---|
| TS01, TS04, TS07 | *"An approved eSTM transaction must be created"* — a precondition, even though the entry point is Get Free Quote |
| TS02, TS03, TS06 | Created inside the steps |
| **TS05** | *"Must NOT have an approved eSTM"* — the **only** case needing none |

So six of the seven automatable cases need an eSTM; the capability only buys you
TS05. `[verified against the team script, 2026-08-17]` See
[flow-insurance-purchase.md](flow-insurance-purchase.md).

If you're only preparing test data, stop before buying the insurance — leave it
unpurchased so the record stays reusable.

## Car — what's available

- **Comprehensive and TPFT only. TPO is declined.**
- TPFT is only shown if the vehicle has **no financing / loan agreement**.
- TPFT is **ICE/Hybrid only**.

| | Comprehensive | TPFT |
|---|---|---|
| Max engine capacity | 5,000 cc | 3,100 cc (ICE/Hybrid only) |
| Vehicle age | up to 30 yrs | 6–40 yrs (WM) · 3–40 yrs (EM) |
| Sum insured | RM 10,000 – RM 1,000,000 | RM 5,000 – RM 30,000 |

WM / EM are West and East Malaysia — note the East Malaysia minimum age is **3
years**, not 6.

**Sum insured deviation from the system-recommended value:**

- More than **10% either way** → **referral triggered**.
- **Under** the recommended value by less than 10% → the **average clause may
  apply**, and the customer fills an **Under-insurance Form**.

## Car — when TPFT appears

Three distinct paths, and they behave differently. The 20-year mark is the divider.

| Vehicle age | Comprehensive outcome | Other conditions | Result |
|---|---|---|---|
| **> 20 yrs** | never attempted | — | TPFT shown **directly** (New **and** Renewal) |
| **≤ 20 yrs** | **all** comprehensive quotes failed | TPFT must itself return successfully | TPFT shown as the **only** option |
| **≤ 20 yrs** | at least one comprehensive succeeded | sum insured **≤ RM 20,000**, **New transaction only** | TPFT shown as an **extra** option alongside Comprehensive |

Two traps in that table. In the "all comprehensive failed" case TPFT is not a
guaranteed fallback — if the TPFT call itself fails there is no option to show. And
the third row is **New transactions only**: the same vehicle on a Renewal will not
get the extra TPFT option.

## Car — Hak Milik gate (eSTM)

Whether the quote came through the eSTM flow decides whether TPFT is offered at all:

- **TPFT shown** when `estmTransactionId` is **blank**, **or** `isHakMilik == false`.
- **TPFT hidden** when the quote comes from the **eSTM flow** and `isHakMilik == true`.

**Open question:** Shamini has asked for the rationale — *why* the eSTM flow
suppresses TPFT when Hak Milik is true. Until that's answered, treat the behaviour
as observed-but-unexplained: test what it does, don't assert why. `[unconfirmed]`

## Quote sequence (control sequence)

Which insurers show, and in what order, is controlled per CR. These rules come from
past CR test scripts; the exact insurer order changes every few months, so take it
from the newest CR, not from this list.

1. **Generic rules** `[from SharePoint TS #060 EAINT-8467, sheet Insurance Sequence TS, rows 4-9]`:
   1. The quotes page shows "the Top 2 of available insurance providers" `[row 4]`.
   2. Timestamp "Quotation retrieved on: DD/MM/YYYY, HH:MMam/pm" at the bottom; a
      disclaimer top right `[row 4]`.
   3. Changing postcode, transmission/variant, going Back or changing Sum Insured keeps
      the same order `[rows 5, 7, 9]`.
2. **Takaful counts once.** "Takaful - Comprehensive & TPFT is counted as one
   insurance", so "top 2" can show three cards, e.g. "1. Takaful (Comprehensive) 2.
   Takaful (TPFT) 3. Chubb".
   `[from SharePoint TS #110 EAINT-9713, sheet Get Free Quote Sequence TS, meta row 2 and row 4]`
3. **X-Star** (hire purchase tagged to X STAR TECHNOLOGY MALAYSIA SDN BHD): "Confirmed
   with BA for XStar there is no specific sequence".
   `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, row 13]`
4. **East Coast UCDs** have their own sequence (EAINT-9564): after eSTM, top 2
   "Syarikat Takaful Malaysia (Third Party, Fire & Theft (TFT)) … Syarikat Takaful
   Malaysia (Comprehensive)". `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, rows 9-14]`
5. **Company category** quotes Chubb (and Takaful) only: "company will only have Chubb
   & Takaful". `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, row 14]`
6. **Islamic hire purchase** — a hire purchase whose name contains "Islamic" triggers
   the Islamic sequence; the list of Islamic HP names is in sheet "Islamic Hire
   Purchase" of the same workbook.
   `[from SharePoint TS #069 EAINT-8595, sheet Insurance Sequence TS, meta row 2; sheet Islamic Hire Purchase]`

## Sum-insured price range

Underwriting-style rules — the warning at the top of this file applies.

1. **Chubb, no X-Star HP, vehicle ≤10 years:** "The lowest price in the pricing range
   should NOT be lower than 90% of the recommended price … NOT be higher than 140%".
   `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 6]`
2. **Chubb with X-Star HP, ≤15 years:** ceiling 170%. `[… sheet New Transactions, row 33]`
3. **Chubb before EAINT-10044:** ceiling 110%.
   `[from SharePoint TS #004 EAINT-10044, sheet Regression Testing, row 16]`
4. **Lonpac X-Star:** ceiling 150%.
   `[from SharePoint TS #009 EAINT-10435, sheet Existing Transactions, row 5]`
   **Lonpac minimum** is rounded up to the nearest 1,000: "ISM - (ISM × 10%) → round up
   to nearest 1,000 Example: RM 25,300 - RM 2,530 = RM 22,770 → RM 23,000".
   `[from SharePoint TS #009 EAINT-10435, sheet New Trxns (Scoped Down TS), row 6]`
5. **RM10,000 floor:** "For recommended Sum Insured: - < RM10,000, the Chubb Quotation
   SHOULD NOT be displayed. - = RM10,000, other options less than RM10,000 SHOULD NOT
   be displayed." `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 19]`
6. **RM80,000 cap** on Get Free Quote applies to non-X-Star HP vehicles; not capped
   otherwise. `[… sheet New Transactions, rows 18, 29]`
7. **Over the age limit:** "The Sum Insured dropdown becomes an uneditable textfield".
   `[… sheet New Transactions, row 20]`

## Quotation inputs and price re-check

1. **Chubb TIN No (EAINT-9641):** mandatory after eSTM approval ("This field is
   required"); optional on Get Free Quote; not displayed on the VEL000069E path.
   `[from SharePoint TS #108 EAINT-9641, sheet Sheet1, rows 3-6]`
2. **Price re-check before payment (EAINT-9611):** if the insurer price changed, popup
   "Price has changed. Click OK to reload and view the updated pricing" with [OK]
   `[from SharePoint TS #105 EAINT-9611, sheet Gross Premium change TS - eSIM, row 5]`.
   Paying a day later moves the policy start: "The start date of the Period of
   Insurance is set to the payment date".
   `[from SharePoint TS #105 EAINT-9611, sheet Date Change TS - Insurance API, row 4]`

## Insurance notifications (referred risk, monthly commission)

1. **WhatsApp video on referred risk (EAINT-11867)** `[from SharePoint TS #022 EAINT-11867, sheet Sheet1]`:
   1. Referred Risk Log records before 01.06.2026 are excluded `[row 2]`.
   2. The quote request goes to "All available insurers except the original failed
      insurer" `[row 6]`.
   3. No WhatsApp when the vehicle already has a purchase `[row 5]` or all insurers
      fail `[row 7]`.
   4. Car gets Car.mp4, motorcycle Motor.mp4 `[rows 9-10]`.
   5. "Exactly one WhatsApp message is sent for the record, regardless of the number
      of insurers that returned a successful quotation." `[row 13]`
   6. Only the originally referred insurer quoting → not sent.
      `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 13]`
2. **Monthly commission (EAINT-10082).** WhatsApp and email to the UCD on "the 2nd day
   of every month"; WhatsApp text "Hi {UCD Company}, your monthly commission summary
   for eAuto Insurance is available." `[from SharePoint TS #006 EAINT-10082, sheet EAINT-10082, row 4]`;
   email subject "eAuto – Monthly Commission Achievement" `[… row 5]`.
   1. A new Main Director receives it after a director change `[rows 8-9]`.
   2. Commission "0": neither is sent `[rows 10-11]`.
   3. Office number: no WhatsApp, email still sent `[rows 12-13]`.
   4. Authorised users (insurance@eauto.my) receive it and see UCD replies when in CC
      `[rows 14-15]`.
   5. Report "automatically sent on the 3rd day of every month" in xlsx `[row 16]`.
3. **Secarang WhatsApp recipients after EAINT-11759:** Payment success goes to the user
   only; Cover note failed and JPJ rejected go to Shamini only.
   `[from Teams EAINT-11759, 2026-09-14 10:05, Batrisyia]`

## Insurance cron jobs and simulating failures

1. **Cron intervals**, daily 8am–11pm: Secarang JPJ Status and Cover Note every 1 min;
   eAuto Cover Note every 5 min; eAuto JPJ Status every 1 min.
   `[from Teams EAINT-12171, 2026-09-02 13:11, Charmain Ea Chiang]`
2. The insurance JPJ enquiry, resubmit cover note and resubmit refer-case cron jobs are
   **off on staging branches**; ask dev to turn them on per branch.
   `[from Teams eAuto & Secarang Main Group, 2026-08-01, Goh Kai Jiaeh]`
3. To simulate an insurer API that is down, set the eSIM insurance quotation for
   Lonpac/TMIM to `false`. `[from Teams DM Charmain Ea Chiang, 2026-06-03]`

Full catalogue: [business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md) §6.

## Motorcycle — what's available

- **Comprehensive only.** TPFT is **declined**, and the **TP API does not apply**.
- The **All Riders endorsement is pre-ticked and cannot be toggled in UCD**. It
  appears in the quotation details.

| | Limit |
|---|---|
| Engine — ICE/Hybrid | 50–500 cc |
| Engine — Electric | ≤ 5,000 watt |
| Policyholder age | 16–80 |

Age **81+** is not a flat decline — it's **subject to no fault claim in the last 3
years**.

## EAINT-11864 — both halves run on the segment the dashboard sends

**Corrected 2026-10-15.** This section previously claimed *"EAINT-11864 runs on
/uat1 — and the eSTM half runs on sit2"* and that *"an eSTM created by the
automation does NOT exist in the environment the quotation runs in"*
(`[from QA team, 2026-08-17]`). The code does not do that: the eSTM leg derives
its environment **from the same base URL as the quotation** —
`envSegment()` takes the last path segment of `QR_BASE_URL` and passes it as
`ESTM_ENV_SEGMENT` to the spawned `scripts/eauto-estm`, and the in-process
`EstmHandoffPage` uses the same value. `[verified: scripts/eauto-quotation-reminder/
utils/estm.ts:39-43, 60-61, 76-78; pages/EstmHandoffPage.ts:72-79]` So the
eSTM and the quotation are always on one segment, and the "two halves" trap no
longer exists.

What is still true, and environment-dependent by design:

1. The segment is a **per-ticket choice** — pick the one the ticket's build is
   deployed to, never bake it into a rule
   ([eauto-portals.md](eauto-portals.md)). The dashboard's first preset and
   `config.ts:13`'s default are only the segment this ticket was deployed to at
   the time (`app/eauto/quotation-reminder/page.tsx:225-229`). Note that
   `scripts/eauto-quotation-reminder/.env.example:3` still names a different
   default than `data/config.ts:13` — the env file is stale.
2. The eSTM identity bypass (`faizuddinsub2` patched to slot `zzz/22`) is **set
   up per environment** by a manual UCD step; a segment where that patch does
   not exist blocks eSTM step 3 with "Please use login user's mykad"
   (`scripts/eauto-estm/data/config.ts:23-34`). So before running an
   eSTM-creating case on a new segment, confirm the patch there.
3. The DOM captures behind the selectors came from one run on one segment
   (`[verified: live HTML from uat4, 2026-08-14]` tags in
   [flow-insurance-purchase.md](flow-insurance-purchase.md)); the 2026-08-18/19
   captures came from a different one. The selectors held across both.

## Quotation reminder email (EAINT-11864) — Discount, not Commission

The reminder email sent to a UCD for a generated-but-unpurchased quotation shows
a **Discount Amount**. The SRD (v1.1, 2026-07-22) says *Commission Amount* — that
wording is **out of date**: the field was changed to Discount and the SRD was
never revised. Assert **Discount**, sourced from the insurance quotation.

Sender is **`imonitor@eauto.my`**. (The team test script writes `imonitor@auto.my`
in places — that is a typo, not a second address.)
`[from QA team, 2026-08-13]`

### The cronjob window, and what "outside the window" means

The reminder is sent by an **hourly cronjob that runs 07:00–23:00 daily**. A
quotation is picked up by the **next** run after it was generated — a 10:59
transaction emails at 11:00. Only **one** email is ever sent per quotation.
`[from QA team, 2026-08-13]` The team script's own note: *"Will run every hour
7am-11pm"*, *"3:59 -> 4.00 pickup / 00:00 -> 07:00 pickup"*
`[from ticket EAINT-11864 test script, notes rows 19]`. Dev confirmation: the
email is sent 7AM–11PM; emails due overnight go out at 7AM.
`[from Teams EAINT-11864, 2026-07-29 12:41, Yi Link Lim]`

**For testing the cron is run every 10 minutes** (13:00, 13:10, 13:20, …) so a
scenario does not take hours. The automation models the grid with
`QR_CRON_INTERVAL_MINUTES` (default 60) and `QR_CRON_FIRST_HOUR` /
`QR_CRON_LAST_HOUR` (7 / 23); `nextCronRun()` and `inDeadWindow()` in
`scripts/eauto-quotation-reminder/utils/schedule.ts` are the executable form of
this rule. `[from Faizuddin, 2026-08-18; verified: data/config.ts:89-103]`

**When no reminder is due**, per the team script: the purchase completed before
the pickup run (TS04), the vehicle has no approved eSTM (TS05), or the quotation
came through the 69E redirect (TS06 — reason not recorded anywhere,
`[unconfirmed]`). A quotation generated in the dead window is delayed to 07:00,
not suppressed (TS07). `[from ticket EAINT-11864 test script]`

Because the last run of the day is **23:00**, the dead window is **after 23:00
until 07:00**. A quotation generated in that gap gets no email until the 07:00
run. Two consequences for testing it:

- **23:00 itself is inside the window, not outside it.** A quotation generated at
  exactly 23:00 races the final run and the expected result is ambiguous. To test
  the dead window, generate at a time clearly past it — 23:30 is safe, 23:00 is
  not.
- A "no email was sent" assertion is only meaningful when paired with the later
  07:00 check that the **same** mailbox query does find it. On its own, an empty
  mailtrap equally means the quotation was never created or the query is wrong.
  Report the pair as one verdict.

`[reasoned from the 07:00–23:00 rule above, 2026-08-14 — the boundary behaviour at
exactly 23:00 is [unconfirmed]; confirm with the dev before relying on it]`

**The email always beats the quotation's expiry — this is a non-issue.** A
quotation expires 24 hours after it is generated (see
[flow-insurance-purchase.md](flow-insurance-purchase.md)), while the reminder goes
out at the next cron run, at most a few hours later. Even the worst case — 23:30
generation, no run until 07:00 — is 7.5 hours, well inside 24. So there is no
scenario where a quotation expires *before* its reminder fires, and "what happens
to the email if the quotation expired first" needs no test case.
`[from QA team, 2026-08-14]`

### Verifying it: read the inbox in a signed-in browser

**Not via the Mailtrap API.** The team's working email check opens the sandbox
inbox in a browser that is already signed in and reads the mail there — see
[data-verification-standard.md](data-verification-standard.md) § The working check
does NOT use the Mailtrap API. Inbox:
`https://mailtrap.io/sandboxes/2581833/messages`. `[from QA team, 2026-08-17]`

**Implemented** in `scripts/eauto-quotation-reminder/utils/mailtrap.ts`: the run
route resolves the `modefair.com` Chrome profile by account, the spec copies its
session files and launches headed Chrome on them, and an unreadable inbox is
`blocked`. Everything about that reader — including that its row selectors are
still unverified and that it only matches the vehicle number against the list,
never a message body — is in [mailtrap.md](mailtrap.md). **It cannot run on
GitHub Actions**, which is why the overnight case is split (quotation on
Actions, inbox by hand next morning). `[verified: utils/mailtrap.ts;
app/api/eauto-quotation-reminder/run/route.ts · resolveWorkProfile]`

What the reference tool at `_reference/automation code/Mailtrap-Email-Checker/`
still gives you is the **contract shape** — which fields to assert, the absence
check for the dead window, and `blocked` instead of a false pass when the inbox
can't be reached. Borrow that; leave its `Api-Token` transport alone.

A new contract entry is needed — the existing ones cover SI/BDP appointment mail
only, and **no code asserts the reminder's content today**. What goes in it
(also recorded in [mailtrap.md](mailtrap.md) § 5b):

| Contract field | Value for the quotation reminder |
|---|---|
| `from` | `imonitor@eauto.my` |
| `subjectRe` | **[unconfirmed]** — read it off the inbox in the browser before writing the regex |
| `bodyMustContain` | Vehicle No; **Discount** Amount (not "Commission" — see above) |
| `dynamicFields` | vehicle no, discount amount, recipient UCD |
| `baselineRef` | SRD v1.1 2026-07-22, with the Commission→Discount correction noted |
| `trigger` | hourly cron 07:00–23:00, next run after the quotation is generated; once only |

Two traps carried over from the reference tool, which is hardcoded to the
appointment emails. They are logic bugs, not transport ones, so they apply just as
much to a browser-driven check:

1. **Assert exactly one.** This ticket guarantees a single email per quotation,
   but `assertEmail` takes `matches[0]` and passes — it would not catch a
   duplicate. Count the matches. TS03 exists precisely to prove the second cron
   run adds nothing.
2. **Scope the absence check to THIS email.** `assertNoEmail` defaults to
   `/eAuto:\s*Your Software Installation Appointment/i`. Reused as-is for the
   dead-window check it searches for the wrong mail and passes unconditionally —
   the exact false green that scenario exists to rule out.

`[verified by reading the reference tool, 2026-08-14; contract values from the
EAINT-11864 study, 2026-08-13]`

The quotation-reminder spec handles both: `assertInbox('one')` asserts
`toHaveLength(1)` and `assertInbox('none')` asserts `toHaveLength(0)` over rows
mentioning the vehicle number, with a +3-minute grace after the cron run
(`scripts/eauto-quotation-reminder/tests/quotation-reminder.spec.ts:150-169`).

### The step-3 row, the resume control, and what the automation treats as "unpaid"

1. A step-3 stop leaves a **`PENDING` ("Pending Payment")** row. Its Action
   cell carries `a.to-view[data="<uuid>"]` "View" and `a.to-payment[data="<uuid>"]`
   **"Resubmit"** — the control that re-enters step 3.
   `[verified: _reference/html/eauto/insurance-listing-pending-payment-row.html:296-299]`
2. The automation counts either `Quotation` or `Pending Payment` as "this run
   left something for the cron" (`RESUMABLE_STATUSES = [DRAFT, PENDING]`,
   `scripts/eauto-quotation-reminder/pages/InsuranceListingPage.ts:32-33`) and
   never drives the status dropdown, because combining it with the vehicle
   filter hid an existing row (`[from Faizuddin, 2026-08-18]`).
3. Two code comments still say the step-3 row is `DRAFT` — `utils/paths.ts:19-20`
   and `tests-nightly/nightly-quotation.spec.ts:33`. They are stale wording,
   not behaviour; the checks accept `PENDING`.

### What each EAINT-11864 case needs, and what it deviates from

The case-by-case table (entry point, insurer, login, stop step, deviations from
the team sheet) is in [flow-quotation-reminder.md](flow-quotation-reminder.md)
§ 7. Two deviations matter when reading a result against the sheet: the
automation's insurer choice is not the sheet's (it prefers Chubb and falls back
to the first card), and TS02/TS03/TS06 always log in as the eSTM bypass user,
not the Main/Sub UCD the sheet names. `[verified: tests/quotation-reminder.spec.ts]`

## The insurance transaction has no "update" action

An insurance transaction has exactly **two** actor-recording events: **create**
and **make payment**. There is no separate edit/update step a UCD can perform
afterwards.

The consequence that matters when reading audit-style fields: a **"last updated
by"** value on an insurance transaction is **always the user who made the
payment**, because payment is the final action. It is not a third, independent
actor.

This is why EAINT-12058's three name columns collapse to two distinct people at
most — created-by can differ from paid-by (a Sub UCD creates, a Main UCD pays),
but last-updated-by simply follows paid-by. A test expecting three different
names would be asserting something the flow cannot produce.
`[from QA team, 2026-08-13]`

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Test titles are tested expectations, not verified
behaviour. Inventory: `script-inventory-team.md`.

1. **Our insurance quote checker is in the team repo.** `scripts/eauto-insurance`
   was migrated 2026-09-23 to `tools/insurance-quote-checker/` as a standalone
   tool, after the human reversed a drop: "this is a tool other QA can use".
   `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:3]` It is "a
   bulk Excel-in/Excel-out insurance-quote batch checker ... no assertions, just
   SUCCESS/NO_VEHICLE_INFO/ERROR status collection" and drives "BO > Insurance >
   quote enquiry". `[charmain-repo: intake/sources.yaml:56]`
   a. Matches this repo: logic identical (diff 2026-10-27; comments differ).
   b. Differs: the team copy removed the hard-coded fallback BO login;
      `scripts/eauto-insurance/data/users.ts:14-15` here still has it.
      `[charmain-repo: intake/reports/faizuddin-insurance-migration.md:13]`
2. **BO Insurance menu pages the legacy production suite covers** (each a P1
   search-and-filter spec): "BO Insurance Transaction", "BO Insurance Payment
   Transaction", "BO Insurance Payment OTP Log", "BO Insurance Permission Listing",
   "BO Insurance Refer Risk Log", "BO Upload Insurance e-Certificate".
   `[charmain-repo: intake/reports/legacy-shared.md:52-57]` `[charmain-repo: intake/reports/legacy-shared.json:2254-2556]`
3. **BO Insurance Transaction listing filters** (legacy load test `INSBOPT_TS*`):
   Insurance Company (example value "'RHB Insurance Berhad'"), "'Yes/ No'
   Over-insured", From / To date, Payment From / To date, Transaction Status
   values "Insurance Created", "Pending Payment", "Failed"; multi-filter Company
   Name + Company ROC + Vehicle No. `[charmain-repo: intake/reports/legacy-shared.json:532-551]`
   The status labels agree with `flow-eauto-insurance-enquiry.md` (`SUCCESS` =
   Insurance Created, `PENDING` = Pending Payment).
4. **UCD insurance user permission** is raced by Charmain's
   `backoffice-audit/src/modules/ucd-insurance-user-permission.js` (414 lines):
   two contexts hit Save together to see what the audit trail records.
   `[charmain-repo: intake/reports/charmain-backoffice-audit.md:36]` `[charmain-repo: intake/sources.yaml:140]`
5. **Insurance test-data creators:** Charmain's `tools/macrokiosk-fixtures`
   `flows/eauto-insurance-create.js`, `eauto-insurance-listing.js`,
   `_lib/insurance.js` (255 lines). Not tests; they make insurance transactions
   exist. `[charmain-repo: intake/reports/charmain-macrokiosk.md:32, 46-48]`
6. **EAINT-12175 Lonpac:** Charmain's folder includes `make-lonpac-fixture.mjs`,
   `finish-lonpac-uat4.mjs` and `probe-insurer-name.mjs`, run on uat4 and staging.
   `[charmain-repo: intake/reports/charmain-12175.md:29-45]` `[charmain-repo: intake/sources.yaml:228]`
   Ledger entry: `cr-ledger.md` § EAINT-12175 item 11.

## Takaful Malaysia (STM) — NDDP disclosures and product documents

Source: EAINT-12078 study (Secarang NDDPs for STM) and its related history. No SRD
exists yet for EAINT-12078; facts below come from its attachments and from the eAuto
precedent EAINT-9215 (eAuto NDDP changes for STMAB).
`[source: pipeline EAINT-12078, Scout study | Scribe related history, 2026-10-27]`

1. **"STM" in Insurance ticket titles = Syarikat Takaful Malaysia**, not the STMS /
   eSTM module. Product files are prefixed "STMAB"; PDS EN p.1 names "Syarikat Takaful
   Malaysia Am Berhad (Takaful Malaysia)". `[from ticket EAINT-12078, attachments]`
   Write "Takaful Malaysia" in TS and evidence names to avoid the clash.
2. **NDDP checklist — 7 disclosure items.** Title: "DISTRIBUTION OF TAKAFUL PRODUCTS
   BY CORPORATE AGENTS VIA NDDP"; intro: "The intermediaries distributing takaful
   products via NDDPs must clearly and prominently disclose the following information
   to financial consumers:". Signed 17/11/2025 and 05/12/2025.
   `[from ticket EAINT-12078, NDDP Monitoring Checklist (Bintang Prospek) PDF, pp.1-3]`
   1. **No. 1** "Name of the company".
   2. **No. 2** "The type of relationship between the company and the intermediary
      distributing the takaful products via the NDDP." (No. 1 and 2 evidence: "This
      product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized
      distributor of Takaful Malaysia".)
   3. **No. 3** "The level of services to be expected from the company or intermediary
      distributing the takaful products via the NDDP."
   4. **No. 4** commission-free alternative statement, shown "prior to enabling
      financial consumers to proceed with final confirmation of purchase."
   5. **No. 5** "A detailed breakdown of takaful contribution amount, commission or
      remuneration, as well as relevant fees and charges, ..."
   6. **No. 6** "The takaful contribution refund policy, immediately after payment
      (i.e. not via a link to another document)."
   7. **No. 7** "No marking up of takaful contribution or imposing any additional
      charges to financial consumers on the NDDP."
3. **NDDP = non-direct distribution platform** `[unconfirmed]` expansion; not spelled
   out in any source read.
4. **Refund disclaimer wording: eAuto shipped "participated to".** EAINT-9215 SRD
   V1.1 (20.11.2025) line 167: "Customers who have participated to the takaful product
   through our website may request a refund or cancel their takaful coverage." The
   EAINT-12078 checklist No. 6 evidence reads "Customers who have participated in the
   takaful product through our website ...". Which wording a new CR expects is
   `[unconfirmed]` — take it from that CR's SRD.
   `[source: pipeline EAINT-12078, Scribe related history, 2026-10-27]`
5. **Current Takaful myMotor (private car) document versions** (attached 2026-10-13):
   PDS EN "Product Disclosure Sheet V2 02-2026", "Date: 1 February 2026"; PDS BM
   "Helaian Penerangan Produk V2 02-2026"; Certificate Wording
   "STMAB/Takaful myMotor-Private Car/V2.0(E)/05-2026" (40 pages); Sijil
   "STMAB/Takaful myMotor-Kereta Persendirian/V2.0(BM)/05-2026" (41 pages). The older
   label seen in EAINT-9215 TS R8 was "V01 08-2025". `[from ticket EAINT-12078, attachment footers]`
6. **Fees (PDS EN p.2 illustration):** "Wakalah Fee ... 26% of total takaful
   contribution", of which "Commission 10% of total takaful contribution"; "(+) 8%
   Service Tax". Illustration amounts are not expected test values.
   `[from ticket EAINT-12078, PDS EN p.2]`
7. **Cancellation (PDS EN p.2):** "Upon cancellation, you are entitled to a pro-rated
   refund of the contribution provided you have not made any claim. There will be no
   cancellation fee." `[from ticket EAINT-12078, PDS EN p.2]`
8. **eAuto page map for the NDDP items (EAINT-9215, eAuto only):** Step 2 =
   distributor disclaimer; Step 3 = commission / PDS disclaimer "under the payment
   summary section"; Step 4 = "Refund and Cancellation"; Insurance Homepage logo popup
   = "Takaful Malaysia Contact Info"; Standard Plan Details = PDS + Certificate Wording
   (BM + EN). The EAINT-9215 SRD has no rule for the breakdown box (items 5 and 7).
   `[source: pipeline EAINT-12078, Scout study "Dependencies" item 8 | Scribe related history, 2026-10-27]`
9. **Two names for Takaful Malaysia on eAuto.** Step 2 shows "Syarikat Takaful Malaysia
   Am Berhad (1246486-D)" (EAINT-9215 TS R14); the listing filter shows "Takaful
   Malaysia Berhad" (EAINT-9214 TS R5). Check which name a CIBO / BO filter uses before
   asserting. `[source: pipeline EAINT-12078, Scribe related history "Known traps" 7, 2026-10-27]`
10. **Old document labels in past TS steps** — EAINT-9215 R8: "[STMAB PDS(BM) Takaful
   myMotor-Kenderaan Persendirian V01 08-2025]". Do not copy these link names into a new TS.
   `[source: pipeline EAINT-12078, Scribe related history "Known traps" 3, 2026-10-27]`

## Chubb corporate UBO capture (planned — EAINT-12097, Chubb mandatory UBO capture)

Planned, not built. The ticket is To Do with no SRD; the only source is the
insurer's `API Partner Briefing UBO.pdf` (Jira attachment, 2026-07-28). Treat every
point as [unconfirmed] until an SRD exists.
`[from ticket EAINT-12097, API Partner Briefing UBO.pdf]`

1. **Who:** "Corporate / company client journeys only, for Motor. Individual client
   journeys are NOT affected." (PDF p1, At a Glance). In eAuto terms: company
   Vehicle Category with the Chubb card chosen [unconfirmed].
2. **UBO section:** "a minimum of 1 and a maximum of 4" records (PDF §2 #1, p2).
   Filled from the Chubb API response; typed in by the user when the response has
   none (PDF §2 #2-#3).
3. **Key rule (PDF p2, orange box):** "UBO details are mandatory. Whether they arrive
   from the API or are typed in by the user, the journey must not be allowed to
   continue without a minimum of 1 complete UBO record."
4. **Mandatory fields conflict inside the PDF:** §2 #4 says "Name, IC / Passport and
   Country"; the §3 table (p2) marks only **Name** "Mandatory". §3 also cites a
   "Section 7" the PDF does not contain. Open until the API spec arrives.
5. **Two touchpoints (PDF §4, pp3-4):** Touchpoint 1 "Before Quotation Issuance";
   Touchpoint 2 "Before Confirm Purchase (after a break in the journey)", where the
   Chubb API is called again and refreshed details overwrite the old ones. "Where
   the refresh returns no details, RETAIN and proceed with the UBO details captured
   earlier at quotation stage." (PDF §2 #7).
6. **Not changing (PDF §5, p5):** "Individual (non-corporate) client journeys — no
   change at all." Sanction screening "remains performed by Chubb".
7. **Test data:** eSIM Insurance API has no UBO response type today (see
   [esim.md](esim.md) § Insurance API and Insurance Quotation pages); the developer
   would have to add it. `[source: pipeline EAINT-12097, Scout study, 2026-10-27]`

## Staging traps from past insurance test scripts

Found while studying EAINT-12097 (Chubb mandatory UBO capture).
`[source: pipeline EAINT-12097, Scribe related history §Known traps, 2026-10-27]`

1. **Reminder email link goes to prod.** "Link redirects to prod environment -
   Existing behaviour" `[from SharePoint TS EAINT-11864, sheet 11864, R10, Remarks]`.
   Do not use it to resume a quotation on staging.
2. **A break in the journey is made by a developer date patch.** "Ask dev to patch
   Created Date to 1 day before today's date" `[from SharePoint TS EAINT-9611, sheet
   Date Change TS - Insurance API, R6]`. A natural 1-day wait can expire the quote
   first (see [flow-insurance-purchase.md](flow-insurance-purchase.md), 24-hour expiry).
3. **Resubmit re-check was never settled in EAINT-9611 (insurer API re-call before
   payment).** "Pending dev and BA side to confirm whether we want the Resubmit button
   to trigger and show the price change or not" `[from SharePoint TS EAINT-9611, sheet
   Gross Premium change TS - eSIM, R27, Remarks]`.
4. **JPJ submission can stay Pending.** "Submission Status to JPJ keeps staying at
   Pending status for long time" `[from SharePoint TS EAINT-9641, Sheet1, R5, Remarks]`.
5. **Downloadables are dummy on staging.** "Downloadables are returning dummy data so
   cannot be viewed as well." `[from SharePoint TS EAINT-9611, sheet Date Change TS -
   Insurance API, R5, Remarks]`
