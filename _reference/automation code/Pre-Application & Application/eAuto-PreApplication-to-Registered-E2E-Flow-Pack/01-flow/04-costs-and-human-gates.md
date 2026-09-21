# What one application actually costs

Read this before estimating any Pre-Application / Application ticket. The
**assertions are cheap; the fixtures are what cost money.**

## By hand

**~12 minutes of continuous hands-on clicking** to get one dealer from the reCAPTCHA
gate to *Approved with registration documents verified*. Two payments, two logins,
three surfaces, eleven steps. The 23-08-2026 walkthrough recording is 12m 45s and
that is a person who knows the flow and is not stopping to think.

## Automated

| | Measured |
| --- | --- |
| **Machine time, gate to `record`** | **~4 minutes** (31-08-2026 build: 09:44:42 → 09:48:36) |
| Unattended runs | ~8m25s including the recorder's own overhead |
| Human attention | **one reCAPTCHA tick**, and often not even that |

## The human gates, honestly counted

There is **one**, and it is the reCAPTCHA.

- **The reCAPTCHA is not solvable from this side.** Expect *multiple* challenges —
  the recording shows three back to back (motorcycles → bus with a "Please try
  again" → crosswalks) before VERIFY passed, ~55 seconds of a person's time.
- **The build waits 300 seconds for you, then stops cleanly.** The message is
  `STOPPED: timed out waiting for the operator`. **Nothing is lost** — the
  checkpoint is intact; resume it by name. Do not start a fresh build, that wastes a
  record and asks for another tick.
- **Both FPX payments drive themselves.** The builder follows the
  `/obs/preOnb/landing/<uuid>/<bank>` redirect, logs into the Fiuu simulator from the
  shared credential store, and drives the TAC, the status dropdown (**Approved**) and
  Pay Now. It stops at exactly one thing — **a password field on a host that is not
  `bank-simulator.fiuu.com`**. Host-locked, deliberately.
- **The payment wait is 30 minutes** (`EV_PAY_WAIT_MS`). It used to be 10, which is
  shorter than the time it takes a person to walk over — and **timing out there costs
  the whole pre-application**, because the form must be refilled from scratch.

### The tick is per BUILD, not per session — but a queued batch shares one

This flip-flopped twice and the difference matters enormously for planning:

- A **cold** build needs a tick. `npm run check:gate` restored a saved session, asked
  for the form, and was bounced straight back to the gate.
- A build started **while the previous session is still alive** logs
  `gate: skipped — the restored session reaches the form directly` and runs start to
  finish **unattended**.

Measured across four builds on 29-08-2026: two needed a tick, two did not.

**So: queue the builds back to back and ask for one tick, not one per fixture.**
Planning six fixtures as six interruptions overstates the cost by a factor of six.
Do not promise it will always skip — the saved session does expire, and a build that
finds it dead stops and waits.

**Announce the tick in the same breath as starting the queue.** On 31-08 a launch
expired unattended and cost a full cycle.

### The one ask worth making of dev/infra

**Google's published reCAPTCHA test keys on staging.** One environment change makes
the entire fixture pipeline unattended. It is a better use of the conversation than
anything QA can build from this side.

---

## Money per fixture

**RM 1,098.00** of simulated payment (RM 108.00 + RM 990.00) through the Fiuu
sandbox. No real money, but note that **every positive test that consumes a record
needs its own application** if the feature under test is once-only.

---

## What limits supply: creation, not scripting

Worth stating plainly, because it changes how you plan a ticket. Once the flow is
automated, the constraint is not writing tests — it is **producing records**. Every
scenario that consumes a record's state is competing for the same pool, and a record
consumed by an irreversible act (Create Account → **Registered**) is gone.

Practical consequences:

- **Bank the identity as soon as you learn it.** The `assign` phase learns the
  Application No — the expensive half — so it writes its checkpoint *before* the
  risky act, not after. A failed assignment used to throw the number away.
- **Dry-run any irreversible driver on a record you have already spent.** A live
  take is the most expensive possible test harness. We have a `--dry-run` that stops
  before the submit, and a `--yes-i-mean-it` that commits on a named sacrifice.
- **Prefer moving ONE record across a boundary** over building a ladder of different
  records. A ladder holds nothing fixed; one record moved holds every other variable
  fixed by construction. (This exact mistake manufactured a phantom 30-day defect —
  see `05-known-traps.md`.)

---

## Time-of-day and calendar constraints

Two things you cannot control, and one you can:

| | Owner | Can QA force it? |
| --- | --- | --- |
| The expiry **date** | the support tool (`/eauto-support/obs/reset-expiry`) | **yes** — needs the VPN and its own sign-in |
| The expiry **time of day** | the record's existing expiry, which the tool preserves | **no** — you choose the fixture, not the clock |
| The **status** flip to Expired | a **midnight cron** | **no** — nothing on the QA side can force it |

That last row is why some end-to-end scenarios genuinely cannot be filmed in one
sitting: they need a status only the overnight job writes. Plan a declared seam
rather than pretending otherwise.

The VPN is the fragile part of any support-tool step, not the rig. On three
consecutive runs the tunnel was up at 44ms sixty seconds before launch and gone by
the time the patch ran — and it came back on its own with a *different* address. A
sustained pre-flight probe (18/18 over 85 seconds) bought **nothing**: it is a drop
and re-establish, recurring every few minutes. Probing harder is the wrong axis; the
step should **retry across the reconnect window**.
