# Worked examples — a full day, end to end

One complete run of the flow, so you can see what each step actually produces. The names, tickets
and numbers are illustrative; the shapes are real.

Read this alongside `remark-templates.md`, which has a per-template example for each of the ten.

---

## The day being logged

A Wednesday. The QA engineer ran an automation suite, retested a fix, sat in the daily huddle, and
spent part of the afternoon on the shared framework.

---

## Step 1 — What Teams gave us

**From their Teams messages that day** — this is the EOD update they posted to the QA group:

```
EOD update 27/8
1. EAINT-12094 - ran full automation suite, 22 scenarios, all PASS
2. EAINT-12140 - retested 3 fixes - Done
3. Huddle in the morning
4. Framework - added the retry helper
```

**What that gives us, and what it does not.** Four candidate items. No durations on any of them.
"Done" on item 2 says the task finished, **not what it found** — that still has to be asked.
Item 4 has no ticket and is framework work, which is non-billable.

> **Never log straight from an update.** It is a candidate list. Durations and outcomes come from
> the person, not from the message.

---

## Step 2 — What CapacityTrack already had

Read the day back before asking anything, so you don't propose an entry that already exists:

```
ALREADY LOGGED (1) · 0.5h
  • eAuto Core   Daily QA huddle   Billable · Meeting   30m
```

So the huddle is done. Three items left to ask about.

---

## Step 3 — Decide what you can decide

Settle the template and the classification **before** asking anything, so the questions in Step 4
are only the ones the person can answer.

| Item | Template | Class | Why |
|---|---|---|---|
| EAINT-12094 automation run | **05** Execute testing | Billable · Delivery | Scripts for the client's application |
| EAINT-12140 retest | **05** Execute testing | Billable · Delivery | Retesting the client's fixes |
| Framework retry helper | **10** Non-billable work | **Non-billable** · Internal tools | Reusable across clients — no single client can be invoiced |

Same skill, same day, opposite answer on the third one. That is the framework trap, and it is the
single most common misclassification.

Nothing here needed a question. State it anyway so it can be corrected:

```
I've classified these — correct me if any is wrong:
  EAINT-12094  automation run      → Template 05, Billable · Delivery
  EAINT-12140  retest              → Template 05, Billable · Delivery
  Framework retry helper           → Template 10, Non-billable · Internal tools
```

---

## Step 4 — Interview for the fields those templates need

Template 05 needs Task, Method, Progress, Result, Blocker, Note. Template 10 needs Task, Method,
Progress, Blocker, **Why non-billable**, Note. So the questions are:

```
EAINT-12094 — automation suite, 22 scenarios all passed.   [Template 05]
  → What did it find — all passed, or any failures?         (Result)
  → How long did the run and the evidence check take?       (duration)
  → Did it run unattended alongside anything else?          (parallel time)
  → Where did the evidence go?                              (Note)

EAINT-12140 — retested 3 fixes, "Done".                     [Template 05]
  → What did the retest find — all 3 verified, or any fail? (Result)
  → How long?                                               (duration)

Framework — added the retry helper.                         [Template 10]
  → How long?                                               (duration)
  → Shared framework, or scripts for one client's app?      (confirms non-billable)
  → What exactly did you build?                             (Task must name the item)
```

Notice what was **not** asked: which template, whether it's billable, Delivery or Meeting, or
the percentage (arithmetic). Nine questions became six.

Their answers:

```
12094  — 4h, ran in the background while I did 12140. Shared window was 7h.
         All 22 passed, no defects. Evidence on SharePoint.
12140  — 3h. All 3 verified and closed, nothing new raised.
Framework — about 2h 30m. Shared framework, everyone uses it. A retry helper
         for flaky steps, with unit tests.
```

**The parallel answer is the important one.** 4h + 3h looks like 7h of work, and it is — but only
because they named the shared window. Without asking, two long entries on one day would have looked
like double claiming.

**"Done" was not an outcome.** Item 2 said "Done" and meant "all 3 verified and closed" — but only
after being asked.

---

## Step 5 — Combine check

Run every pair past the combine-or-split table. **A split is the default.**

Here nothing combines, and each is a split for a different reason — name them so the person can see
the reasoning:

- 12094 and 12140 are **different tickets** → split. (They share a clock window, which is a
  *parallel-time* note, not a combine.)
- The framework hour is **non-billable** while the others are billable → split, always.

Had two of them been the same ticket and both billable — say, drafting scenarios and then a quick
call with Dev about those same scenarios — that is a combine candidate, and it gets **asked, never
merged silently**:

```
These two look combinable — same ticket, both billable to eAuto Core,
and the follow-up was part of getting the drafting done:

  A. EAINT-11759  drafted test scenarios              2h
  B. EAINT-11759  confirmed scope with Dev and BA     30m

Combine into one 2h 30m entry, or keep them separate?
```

## Step 6 — The composed entries

**Entry 1 — Template 05, execute testing (automation variant)**

```
Task: Ran the automation suite for EAINT-12094 (STMS Bulk Payment SSM
Checking) and checked the evidence.
   • Automation: Playwright against uat1 on our own staging. Went through each
     scenario's evidence against the expected result.
   • Progress: 100% (all 22 scenarios executed) - PASS only
   • Result: All 22 passed. No defects raised. Testing complete.
   • CR status: In testing.
   • Note: The suite runs unattended, so this ran in parallel with EAINT-12140.
     4h of the shared 7h window is attributed here. Evidence uploaded to
     SharePoint.
```

**Entry 2 — Template 05, retest**

```
Task: Executed retesting on EAINT-12140 (UCD - Vehicle Registration).
   • Method: Manual on Staging, Chrome. Retested the 3 fixes from the 25 August
     deployment.
   • Progress: 100% (completed)
   • Result: All 3 fixes verified and closed. Nothing new raised.
   • CR status: Deployed to production.
   • Note: Ran in parallel with EAINT-12094. 3h of the shared 7h window is
     attributed here.
```

**Entry 3 — Template 10, non-billable**

```
Task: Added a retry helper to the QA automation framework.
   • Method: Manual. Wrote the helper and covered it with unit tests.
   • Progress: 100% (helper merged)
   • Why non-billable: The automation framework is a shared ModeFair internal
     tool. No single client can be invoiced for it.
```

Note what entry 3 does **not** have: no `Category:` line (the form's dropdown carries that), and no
ticket. It names the actual thing built — "a retry helper", not "worked on the framework".

---

## Step 7 — The draft that goes back for approval

Show every field and the arithmetic, and wait:

```
ALREADY LOGGED (1) · 0.5h
  • eAuto Core   Daily QA huddle              Billable · Meeting     30m

TO ADD (3) · 9.5h
  1. eAuto Core  EAINT-12094  Billable · Delivery        4h
  2. eAuto Core  EAINT-12140  Billable · Delivery        3h
  3. —           Internal tools  Non-billable         2h 30m

DAY TOTAL: 10.0h  ⚠ over the 8h cap — 2.0h will not count
BILLABLE: 7.5h of 10.0h (75%)
```

**The flag matters.** A day caps at 8h. Logging 10h means 2h counts toward nothing — not the
billable percentage, not the 40-hour week. Surface it and let the person decide what to do, rather
than quietly trimming an entry yourself.

---

## What this example is showing you

- **The update is a starting list, not a source of truth.** Every duration and every outcome in the
  final entries came from asking, not from the message.
- **The template is chosen before the interview, not after.** That is what makes the questions
  short: you ask for the fields that template needs, and nothing else.
- **Never ask what you can work out.** Template, billable class, Delivery vs Meeting, the
  percentage, the environment when a source names it — all decided, then stated for correction.
- **"Done" is not a result.** Item 2 said "Done" and meant "all 3 verified and closed" — but only
  after being asked.
- **Parallel work has to be declared on both entries**, with the split stated.
- **The framework hour looks exactly like the delivery hours** and is classified the opposite way.
- **Nothing was submitted until the draft above was approved.**
