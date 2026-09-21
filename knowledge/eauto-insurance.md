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
None of it is verified against code in this repo.

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

## EAINT-11864 runs on **/uat1** — and the eSTM half runs on **sit2**

`[from QA team, 2026-08-17]`

| Half | Environment | Why it is pinned there |
|---|---|---|
| Insurance / quotation-reminder (the ticket) | **`staging.eauto.my/uat1`** | The insurance code changes for this ticket are deployed to uat1. Any other segment exercises the OLD code, so a pass there proves nothing about the ticket. |
| eSTM creation | **`staging.eauto.my/sit2`** | The identity bypass is only set up on sit2 — `faizuddinsub2` is patched to slot `zzz/22` there, and the patch is per-environment. |

Applied 2026-08-17: `QR_BASE_URL` defaults to uat1 in
`scripts/eauto-quotation-reminder/data/config.ts`, and the dashboard page
defaults to the UAT1 preset. It was uat4 before, which is where the DOM captures
in `knowledge/` came from — so **the selectors are uat4-derived**. If one misses
on uat1, that is the first thing to suspect, not a broken flow.

⚠️ **The two halves are on different environments, so an eSTM created by the
automation does NOT exist in the environment the quotation runs in.** That is
fine for *quoting* — Get Free Quote needs only a vehicle number and an IC, no
eSTM (see above). It is NOT fine for any case whose precondition is a real
approved eSTM **in uat1**; for those the eSTM has to be created on uat1 by hand,
or a uat1 bypass slot has to be patched. `[unconfirmed which 11864 cases this
actually blocks — resolve before trusting a green run]`

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
`[from QA team, 2026-08-13]`

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

What the reference tool at `_reference/automation code/Mailtrap-Email-Checker/`
still gives you is the **contract shape** — which fields to assert, the absence
check for the dead window, and `blocked` instead of a false pass when the inbox
can't be reached. Borrow that; leave its `Api-Token` transport alone.

A new contract entry is needed — the existing ones cover SI/BDP appointment mail
only. What goes in it:

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
