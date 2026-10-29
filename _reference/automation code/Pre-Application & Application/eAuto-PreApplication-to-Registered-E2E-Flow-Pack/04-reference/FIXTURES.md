# EAINT-11982 — fixture provisioning, 27-08-2026

For the headless run of all 65 scenarios. Written so the tick session can be
done in one sitting without re-deriving anything.

---

## The one number that decides everything

**`check:gate`, re-run 27-08: NOT REUSABLE.** The reCAPTCHA gate on
`/obs/preOnb/form` bounces every build to `/obs/preOnb/recaptcha`, so each
fixture build needs a human at the keyboard for the tick and an FPX simulator
pass. Nothing in the rig can change that — it is the argument for asking that
staging use reCAPTCHA test keys.

Everything below is organised around avoiding builds, because a build is the only
expensive thing here.

## Two kinds of fixture, provisioned by completely different means

| | READ-ONLY case | DESTRUCTIVE case |
|---|---|---|
| What it asserts | what a record SHOWS | what changes when Extend is CLICKED |
| Spends the one extension (R1) | no | **yes** |
| Ownership matters | no — any record in the right state will do | **yes** — spending someone else's costs them their only extension |
| Provisioned by | finding one, or patching an expiry (support tool, VPN) | a fresh build, one human tick each |
| Reusable tomorrow | yes | no, one shot |

The trap this table exists to stop: patching an expiry **never** spends the
extension, so a patched fixture is cheap and re-patchable, while a destructive
fixture is gone the moment a test clicks the button.

---

## Provisioned today, zero human ticks

| Var | Record | How | Serves | State |
|---|---|---|---|---|
| `PAST_WINDOW_EXTENDED_APP_NO` | NA68001101 | retired spent pool fixture, expiry patched 2026-12-24 → **2026-04-29** (after-window) | TS07, E2E_TS6, **TS58.1–.4** | **TS07 FAILS — and NOT on this record.** Filmed 27-08 15:59, 13/13, `claims "greyed"; measured "absent"`. But 1101 is outside the window, so its absence is over-determined and dev can dismiss it. Use it as COVERAGE only; the probative record is NA68001086 **AND IT IS TS58.1–.4'S FIXTURE (added 29-08 night).** TS58 walks this record ACROSS the far bound — four patches, `expired-in-window` → `closes-tomorrow` → `closing-day` → `closed-yesterday` — and RESTORES the starting expiry at the end, asserting the restore, because the R14 sweep in the same take reads that value. Being already patched and already past the close is what makes it the right record: nothing else has to be built. Do NOT point TS58 at NA68001099 / NA67001077 / NA66001057 (TS57 reads those three where they stand) or at NA68001086 (TS03's in-window control). |
| `EXTENDED_THEN_EXPIRED_APP_NO` | NA68001086 | retired spent pool fixture, expiry patched 2026-12-08 → **2026-08-27 15:46** (02:27Z, `resultingState: in-window`) | E2E_TS4 **and TS03/TS07** | **DOUBLE DUTY — do not re-patch it.** Today it is the one already-extended, unambiguously in-window record, so it is the C7 defect's probative evidence (`TS03_NA68001086_...`, 13/13, `present=false inDom=false`). Tonight's cron flips it to Expired for E2E_TS4, and Expired is inside the two-value whitelist, so it keeps serving TS03 afterwards |
| `TS49_APP_NO` | NA62000984 | **DO NOT USE** — restored to its original date, expiry **2026-05-26 14:37**, so its closing day was yesterday | TS49 | **NOT RUN.** The assertion arm skipped correctly; the recorder took `EV_APP_NO` directly and filmed a 12/14 take on the wrong record (`boundary-am` missing — the scenario's whole subject). Real evidence of a post-window absence, no evidence of the closing-day rule. Next: **NA62000987**, naturally on its closing day 28-08 (09:19), or patch any never-extended record with `--state closing-day` |
| `PAST_WINDOW_APP_NO` | NA62000939 | **found** — Expired 2026-02-14, beyond the window, never extended | TS06, E2E_TS3, TS26.3 | set |
| `APP_NO` | NA68001099 | already extended, expiry 2026-12-22 — **116 days out, so out of window** | every read-only page assertion | set, but it is **not** a greyed control any more: it renders no button at all, and after the C8 fix that is explained by the window alone. Fine as a page-structure subject, useless as evidence about extensions |

### The move worth remembering

`build-date-fixtures.js` reported TS07 and E2E_TS4 as **NOT REACHABLE BY
PATCHING** — both need a record whose one extension is *already spent*, and
patching cannot spend one. But that is exactly what a **retired pool fixture
is**. Three of them were sitting in `EXTEND_APP_POOL` being counted as a dry
pool. Two ticks' worth of fixture came out of records already written off.

*Read a spent fixture as a fixture of a different shape, not as a dead one.*

Both are now RESERVED in `src/pool.js` so `take()` cannot hand them back out.

---

## What still needs a build

**Every build starts at the Pre-Application Form.** Charmain, 27-08-2026: *"make
sure all transaction created from preapplication, i dont want the manual
application way to create the trx, we didnt cover that part in this ticket."*
`npm run fixture` has one route and no flag to change it; BackOffice's **UCD New
Application** panel now refuses (vault **R22**). That is why every build below is
counted at *one human tick each* — the manual route was the only captcha-free way
in, and it is closed. It also never produced an extendable record, so no build
plan here gets shorter or longer because of the ruling.

Your call on 27-08 was **build our own** rather than patch other people's
records, so the 10 eligible foreign records on staging are left alone. The census
is unambiguous about why the question came up:

```
Approved population: 55; 10 shortlisted; 10 not ours; 0 unspent usable fixtures

> **SUPERSEDED 28-08-2026 ~06:45.** The pool is no longer dry. Two records were built
> at the reCAPTCHA gate by E2E segment 1 and patched INTO the extension window:
>
> | record | state | note |
> |---|---|---|
> | **NA68001111** | Approved, expiry 2026-08-28, Extend showing+enabled, never extended | segment 1 filmed **8/8**, frame-verified |
> | **NA68001110** | same | segment 1 filmed 7 of 8 honestly (its export point ticked on an Excel window that was not on camera) |
>
> Both are valid segment-2 fixtures. Neither has spent its one extension (R1).
> Re-run `npm run pool:status` before relying on this — a census goes stale, and the
> midnight cron flips a past-dated Approved record to Expired.
```

### Destructive set

`pool.take()` is called **15 times with 4 `release()`**, so a complete
destructive run needs roughly **11 fresh fixtures**, one tick each.

### Date-patched set

**13 targets** (`npm run fixtures:dates:plan`), each needing its own
never-extended subject — one record has one expiry, so they cannot share. Two of
the 13 can be **found** rather than built on the right day:

- `ts08-1` closing-day → NA62000984 **today**
- `ts08-3` closes-tomorrow → NA62000987 **today** (its closing day is 28-08)

`ts54` needs an expiry that puts today strictly between the 90-day and
3-calendar-month closing days — a property of the calendar, so it is reachable
some days and not others. `npm run expiry:states` says which.

---

## The tick session, in order

```bash
npm run check:gate
```

Confirms the gate is still per-build before you commit to sitting.

```bash
npm run pool:build -- --want 11 --write-env
```

Eleven builds, one reCAPTCHA tick and one FPX pass each. Fills
`EXTEND_APP_POOL`. This is the destructive set — do it first, because the date
targets can be served by any never-extended record and the destructive ones
cannot.

```bash
npm run pool:build -- --want 24 --write-env
```

The thirteen date subjects, on top of the eleven. Then:

```bash
npm run fixtures:dates -- --from-pool --write-env
```

Patches each subject to its boundary and — new today — **claims it out of the
destructive pool**, because a record patched out of the window would otherwise be
handed to a spend case that then found no button and reported it as a defect.

Two targets need the subject chosen for its **time of day**, not just its date:
TS08 positions 4 and 5 want an expiry a few minutes behind and a few minutes
ahead of the hour you run at. The support tool preserves the time of day and has
no time field, so this is a selection problem. `npm run probe:closing` prints
every candidate's time of day.

---

## Time-boxed — these expire

| Thing | Window | Why |
|---|---|---|
| NA62000984 after-14:37 reading | **today only** | today is its closing day. The before-14:37 half is taken (TS49 passed). The after half completes the Q39 evidence pair: `npm run probe:transition -- --app-no NA62000984 --at 14:37` |
| NA62000987 | **tomorrow, around 09:19** | its closing day is 28-08; same before/after pair |
| E2E_TS4 (NA68001086) | **after tonight's midnight** | the tool moved the date; only the cron writes the status. Confirm the listing reads **Expired** before running it |
| `ts54` | some days only | needs the two rules to disagree today |

---

## Three traps closed today

**`pool.claim()`** — `build-date-fixtures.js` took pool members as subjects and
patched their expiry out of the window. Nothing was spent, so every measure in
`pool.js` still called them unspent and `take()` would hand a before-window
record to a destructive test, which would find no button and report a build
defect. Moving a date is a kind of consumption even though nothing was consumed.

**TS08 provisioning was two rows for a five-record positional variable.** The
planner described the *lower* bound (expiry − 31d, − 30d); the test documents
`TS08_APP_NOS` as five records about the *upper* bound, read by position. TS08
skips below five, so two could never make it run — while the planner reported
success. Had it ever reached five by accident, positions 1 and 2 would have been
before-window records read as after-window ones: a wrong answer instead of no
answer. When a variable is positional, the provisioner has to carry the
consumer's order, and nothing in a comma-separated string complains if it does
not.

**TS49 asserted a verdict that depended on the clock.** It asserted the button
present for the whole closing day, on the 26-08 "date bound" ruling. Measurement
reversed that on 27-08 — two records patched onto the same closing day split on
the clock alone, 14:37-not-yet-reached showing the button and 09:19-elapsed not —
so the test was green before its fixture's time of day and fabricated a
ONE-DAY-EARLY defect after it. It now reads the clock itself
(`dates.closingMoment`), which also means the fixture is valid at any hour
instead of only before 14:37.

---

# The verification run — 27-08, headless, 21.5 min

`npx playwright test --project=chromium` with the fixtures above. Nothing was
spent; no write gate was set.

**25 passed / 7 failed / 71 skipped / 1 did not run.** This morning's run was
24 / 6 / 71 / 3, so the fixture work moved two cases from skipped to passing
(TS07, TS49) and one from a misleading failure to a clean skip (TS04, which now
skips because `EXTEND_APP_NO` is empty instead of failing on a spent record).

## Genuine product findings — 2

| | Records | Reading |
|---|---|---|
| **C8** (open) | NA68001097 **85 days** out, NA67001077 **35 days**, NA66001069 **31 days** | never extended, button present AND enabled, all outside REQ-003's 30-day window |
| **C9** (new, propose) | TS35 | listing renders `YYYY-MM-DD HH:MM`, export renders `HH:MM:SS` — same value, two shapes |

C8's three records are all clean this time: never extended, enabled, so none of
them is R6's greyed memory being misread.

## Everything else that failed is the rig or a fixture — 5

| Test | Why it failed | Fix |
|---|---|---|
| **C2** | "expiry is 120 days after creation, expected 90" — it fell back to `APP_NO` = NA68001099, whose 120 = 90 + the spent 30 | C2 must assert on a never-extended record. Same class as the TS15 fix: derive the legal state, do not trust the fixture |
| **E2E_TS4** | "the extended period has itself expired" — expected past, got a future timestamp | my patch put NA68001086 at **today 15:46**, which had not elapsed at 10:56. It needs an expiry already past: re-patch to 2026-08-26 |
| **TS50** | the stage-5 heuristic disproof still reproduces | by design — it is the thing under test |
| **TS08.3** | NA63000990, 81 days past expiry and inside the window, graded button-ABSENT | **did not reproduce.** A direct read of the same record minutes later: `present:true, enabled:true, className:extend-btn, pointerEvents:auto`. So this is an intermittent false negative, which is worse than a stable one — it will fabricate a defect at random. Needs one more look before anyone writes it up |
| **TS01/TS44** | the C8 records above | not a rig fix — the defect |

## F7 — the same rig-bug family as this morning's F1/F3/F4

TS08.1–.3 grades candidates without establishing that an absent button has no
innocent explanation — no registration-documents page, Registered, or already
extended. F1, F3 and F4 each fixed one instance of exactly this in a different
test. TS08's picker is the fourth, and the TS08.3 non-reproduction may be a
fifth cause (a read taken before the control paints).

**A boundary test that grades ineligible records reports the eligibility rule as
a boundary defect.**

## Blocked right now: the VPN dropped

Re-patching NA68001086 failed the preflight — FortiClient is running but the
tunnel is down. Every expiry patch and every `@patch` test needs it:

```bash
npm run probe:support
```

Reconnect FortiClient, then that confirms reachability in milliseconds.

---

# The exact skip accounting — JSON reporter, 27-08 11:26

`--reporter=json`, so these are the reasons the run actually recorded, not an
estimate. **27 passed / 5 failed / 72 skipped.** (Two of the seven failures went
green when `EXTENDED_APP_NO` and `FORMAT_APP_NO` were filled with the record they
were already asking for; TS08.3 passed this time, confirming it was the
intermittent read rather than a defect.)

| Cause | Tests | What clears it |
|---|---|---|
| pool dry | **19** | the 11 builds |
| write gate off | **14** | one env flag each — see below |
| **cascade: an earlier step never ran** | **9** | nothing of their own. The grand tour's first step needs the pool; TS26.1–.4 need the request it captures |
| **`APP_NO` is the spent control** | **8** | **one fresh eligible fixture — see below** |
| overnight two-sitting | 7 | a midnight |
| per-case fixture var unset | 5 | TS08, TS09, TS22, TS33, TS51.6–.7  (E2E_TS8 cleared 31-08 — NA68001164, now spent) |
| settings flag, not a fixture | 4 | `EV_MATRIX`, `EV_DEPLOY_DATE`, `EV_MANUAL_REGISTER` |
| declared / N/A / traceability | 5 | nothing — by design |

## The highest-leverage fixture in the whole run

Eight tests skip on one line: *"application NA68001099 is not eligible
(present=true, enabled=false)"*. They are

TS12.1 Cancel · TS12.2 close icon · TS12.3 Esc · TS12.4 click-outside ·
TS12.5 reopen-clears-remark · TS20 responsive · TS36 copy parity · TS10.3 over-max

**Every one of them is read-only.** They open the modal and cancel, resize, or
read copy — none submits. So they need an *eligible* record, not a *spendable*
one, and **one fixture serves all eight and is still unspent afterwards**.

That is the first build to do, and it changes the arithmetic: the tick session
does not have to be all-or-nothing. One tick buys eight tests.

## The write gates, by flag

| Flag | Tests | Also needs |
|---|---|---|
| `EV_OVERNIGHT` | 7 | a midnight between two sittings |
| `EV_ALLOW_EXPIRY_PATCH` | 6 | **the VPN, and no build at all** |
| `EV_ALLOW_ENDPOINT_PROBE` | 4 | two throwaway fixtures |
| `EV_ALLOW_WRITES` | 3 | a fixture to write to |
| `EV_MANUAL_REGISTER` | 2 | a human Register step |
| `EV_ALLOW_ROLE_SWITCH` | 1 | TS48 — switches a shared account's role |

`EV_ALLOW_EXPIRY_PATCH` is the cheap one: six tests, one flag, no build — just
the tunnel back up.

---

# 27-08-2026, afternoon — the window rule changed under the batch (C8)

The evidence batch caught it by accident, which is the only reason it was caught.
**NA67001077 carried an enabled Extend button at 12:14 and none at 13:01**, with
`Application Status = Approved` and `Hardcopy & Acc Created = Pending UCD -
Incomplete Docs` identical in both readings, expiry unchanged, and no extension
performed — an extension GREYS the button and a greyed button is still
`inDom=true`. This read `inDom=false`.

A six-record sweep as HubAdmin `BOChar` at 14:40 splits perfectly on **30 days**:

| record | expiry | days out | Extend |
|---|---|---|---|
| NA66001071 | 2026-09-11 15:50 | **14** | **present, enabled** |
| NA67001077 | 2026-10-01 01:55 | 34 | absent |
| NA68001096 | 2026-11-18 16:01 | 82 | absent |
| NA68001093 | 2026-11-18 15:17 | 82 | absent |
| NA68001097 | 2026-11-20 16:26 | 84 | absent |
| NA68001099 | 2026-12-22 21:10 | 116 | absent |

Reading: the lower bound now behaves as REQ-003 specifies, so **C8 looks FIXED**.
Not closed — QA measured a behaviour change and nobody has confirmed a deploy. Ask
whether staging was redeployed between 12:14 and 13:01 on 27-08.

## What this does to the fixture pool

**Nearly every fixture in this file is now out of window.** The pool was built when
the button appeared ~88 days early, so records with a November or December expiry
were perfectly good subjects. They are not any more.

| need | fixture | state |
|---|---|---|
| in-window, Approved, never extended | **NA66001071** (expiry 2026-09-11, 14 days out) | the ONLY known-good one — and it is `not ours` per the census |
| already extended AND in window | **NA68001086** (expiry patched to 2026-08-27 15:46) | **it exists now** — made with `npm run set-expiry` at 02:27Z, no build and no human tick, since patching an expiry never spends the extension. It is the C7 defect's probative record and it is **re-patchable**, so the TS03/TS07 retest costs one patch plus one read-only take |
| out of window, near side | NA67001077 (34 days) | useful as the negative boundary control for a C8 regression take |
| past the far end | NA62000939 (expired 2026-02-14) | unaffected |

**The cheap route to an in-window fixture is the support tool, not a build.**
`npm run set-expiry` patches an expiry date without a human tick and without
spending anything, so any Approved record can be pulled inside 30 days. That also
makes the already-extended-and-in-window fixture reachable: take NA68001099, which
is already extended, and patch its expiry to within 30 days of today.

Read the expiry back off the LISTING afterwards — the tool's banner is not evidence.

## Two facts from the parallel session, 27-08 late afternoon

**NA62000984 is PATCHED and awaiting restore.** Its expiry currently reads
`2026-05-27 14:37`; its real value is `2026-05-26 14:37` (status Expired, never
extended). The restore failed when the VPN tunnel dropped. **If you read that
record's expiry off staging before the restore lands, you are reading a fixture,
not the environment.** Retry, once the tunnel is back:

```
node scripts/set-expiry.js --app-no NA62000984 --date 2026-05-26 --yes
```

`.env`'s `TS49_APP_NO=NA62000984` depends on that patch and goes stale the moment
the restore lands — see the STATE NOTICE under the line. The repoint to
`NA62000987` (closing day 28-08 09:19, natural and unpatched) is Charmain's call,
and TS49 must not run against 987 before 28-08.

**Support-tool expiry patches do NOT appear in the BackOffice audit log.** Five
patches on 27-08 produced no rows. This protects the `audit-none` leg — a patched
fixture cannot fake an `[Extend]` row — but it also means the log cannot prove a
record is pristine. For that, read the expiry off the listing and compare it with
the record's natural value. See vault R18.

---

# 27-08-2026 night — the take-fixture map, and what is ready for the next run

Everything below is now **machine-readable** in `automation/src/takeFixtures.js` and
**measurable** with `npm run takes:ready`. This section is the prose version; the file
is the authority, because the file is what the runner reads.

## Why a map at all

`run-readonly-takes.sh` derived each take's record from `r.best.appNo` — the
application number of whichever *earlier* take scored highest. That is history, not a
precondition. It kept sending TS48 to a record that is already extended and out of
window, and TS01.1–.7 / TS42 to a record 35 days from expiry while both declare
`offered`. The takes were fine; the plan was quoting the past.

The runner now applies the map over the derived plan: it **repoints** a ref the map
has an opinion about, and **drops** one the map marks blocked or unchosen, saying so
on stderr rather than filming it and failing.

## Patched tonight (support tool, VPN, each verified off the listing)

| Record | Was | Now | Serves |
|---|---|---|---|
| NA67001077 | 2026-10-01 01:55, before-window, control absent | **2026-09-11 01:55**, in-window, **control ENABLED** | TS01.1–.7, TS42 |
| NA62000984 | 2026-05-26 14:37, after-window | **2026-05-27 14:37**, closing-day | TS49 |
| NA67001075 | 2026-10-01 15:14, before-window | **2026-05-28 15:14**, in-window | TS54 (banked, Pass) |

**NA67001075 WAS PATCHED A SECOND TIME on 31-08-2026** — `--state expired-in-window` moved it to
**2026-08-24 15:14**, past its expiry and inside the three-month window, so TS17.4–.5 could film R4
on a legacy record. It is now **SPENT** (extended 31-08 18:56) and is not restorable: the patch is
reversible, the extension is not. TS54 already reads Pass off its banked take, so nothing is owed it.

All the patches are logged in `discovery/96-expiry-patches.jsonl`. None belongs to the rig,
so all three are reversible and should be restored when the takes are done.

## Ready without a write

| Scenario | Record | Boundary |
|---|---|---|
| TS08.1–.3 (.1) | NA66001071 | in-window, control offered |
| TS08.1–.3 (.2) | NA68001092 | ~75d before expiry — cannot age into the window overnight |
| TS08.1–.3 (.3) | NA62000939 | Expired, ~194d past expiry |
| TS48 | NA66001071 | any never-extended in-window record (repointed off NA68001099) |
| TS51 | NA68001100 | the BackOffice stub — dealer view, no sidebar, and that IS the subject |

`TS08.1–.3` is **one register row covering three boundaries**, so it needs three
sittings with `EV_APP_NO` set explicitly. It is not three refs — an earlier draft of
the map invented `TS08.1` / `TS08.2` / `TS08.3`, which `expectedState.js` does not
know, so they fell through to the extend-shaped default of `offered` and three
correctly-placed fixtures were reported STALE.

## DATE-BOUND — rebuild at run time, never the night before

- **TS49 / NA62000984.** Closing day is today only. Read `windowState(raw)` with its
  DEFAULT `now` (midnight): that gives `closing-day` and the precondition passes.
  Passing a wall-clock `now` gives `after-window` and disagrees with every assertion
  in the suite. `closingMoment` = 14:37, already elapsed tonight, so only the AFTER
  half of Q39 is filmable — the BEFORE half needs a record whose expiry time-of-day
  falls later than the run.
- **TS54 / NA67001075.** `rulesDisagreeOn()` gave 2026-05-28 **for today**: +90d
  closes 26-08, +3 months closes 28-08. The straddle lasts **one day**. Recompute,
  never hardcode.

**The midnight cron is why these cannot be pre-built.** R12's auto-expire job runs
daily at 00:00, so an Approved record patched to a past expiry is flipped to Expired
overnight. That is why TS08's late boundary is taken on NA62000939, already Expired,
rather than on a patched Approved record.

## Blocked — and no fixture changes it

- **TS13**, **TS15.1–.9** — **EAINT-12235**. Both declare `present` on an
  already-extended record, and on this build such a record shows no control at all.
  `95-c7-retest.jsonl` settles that no patch helps: NA68001104 with its expiry reset
  **back into the window** still read `present:false, inDom:false`.
- **TS17.1 / TS17.2** — **DONE. Both FILMED AND PASSED 29-08 night**, read-only, nothing
  spent: TS17.1 on NA66001069 **17/17 MISSING 0 MATCH** (22:38), TS17.2 on NA68001086
  **15/15 MISSING 0 MATCH** (22:42). Kept below as the record of what had blocked them.
  Two stale claims cleared:
  `EV_DEPLOY_DATE` is **set** — `2026-08-19`, in `automation/.env:83`, ruled by Charmain
  on 29-08 — and the row-level contradiction is gone now that the combined row is split.
  Both halves have a declared fixture: **NA66001069** (natural, delta=90, control
  enabled) for TS17.1 and **NA68001086** (already extended 26-08, audit row filmed) for
  TS17.2. Pre-deploy provenance still cannot be manufactured — records are found, not
  built — but that never blocked these two; the combined row asking for an enabled
  button and a spent record at once did.
- **TS46** — 11868 reactivation undeployed; out of scope since 26-08.

## Two open questions for Charmain

1. **TS44's R21 row contradicts its own scenario.** `expectedState.js` says
   `'TS44': 'offered'`; the recorder's `lower-bound` branch asserts
   `.toBe('absent')` past 30 days. Post-C8-fix the scenario's claim is the absence.
   Third instance of this fault (after TS01.7 and E2E_TS3). Not changed — editing the
   table changes which takes pass.
2. **TS50 may not describe a distinct population.** Its objective cites "6 of 56
   Approved have a registration-documents page, so 50 do not". Tonight's sweep opened
   22 of 56: 11 had no page, but every one of those *also* had no expiry and did not
   open in BackOffice — they are R19 stubs, which is **TS51's** subject. Picking one
   would file TS51 evidence under TS50's name.

## One trap closed, and it nearly produced a false finding

The first version of `find-unfilmed-fixtures.js` searched Approved, then **Expired**,
then opened each Approved record. `listing.search` leaves the status dropdown where it
is, so every lookup ran inside the Expired filter and answered *"not found on the
listing (0 rows)"* — all 22 probes, including records another script had read
correctly minutes earlier. The failure was harmless; the **conclusion** was not.
"None found" for TS50 reads as evidence about the population and was evidence about a
dropdown. Same family as the `listing.search` bug that once made 47 records look both
Registered and Expired. The script now runs one status search, and every "NONE" line
states the sample size and that it is a sample.

---

# 28-08-2026, pm — THE POOL IS FAR DEEPER THAN `pool:status` REPORTS

This section supersedes the "avoid builds at all costs" framing above for the
**extend** rows. It does not change the reCAPTCHA fact — it removes the need to hit it.

## ~12 extend fixtures are reachable with ZERO human ticks

`pool:status` reported **"1 unspent usable fixture"** (NA68001105) and rejected eleven
records with *"the button is not enabled — absent from the markup"*. Read literally that
is eleven dead records and eleven builds at a human tick each.

A read-only listing sweep of all eleven says otherwise. **Every one is Approved, never
extended, with a live future expiry — simply 74-90 days out, BEFORE the window.** Not the
no-expiry case, not Registered. Each is **one `set-expiry --state opens-today` patch away**
from being a usable extend fixture: ~1 minute, no gate, no FPX, no tick.

| Record | expiry time of day | stage3 | verified Extend |
|---|---|---|---|
| NA68001117 | 11:52 | Checked | `present=true enabled=true` |
| NA68001115 | 11:38 | Checked | `present=true enabled=true` (SPENT — TS27 re-run) |
| NA68001114 | 09:02 | Pending UCD | not probed |
| NA68001108 | 05:50 | Checked | not probed |
| NA68001107 | 05:35 | Checked | not probed |
| NA68001097 | 16:26 | Pending UCD | `present=true enabled=true` |
| NA68001096 | 16:01 | Pending UCD | not probed |
| NA68001094 | 15:39 | Pending UCD | not probed |
| NA68001093 | 15:17 | Pending UCD | not probed |
| NA68001091 | 10:18 | Pending UCD | not probed |
| NA68001092 | 15:58 | Checked | `present=true enabled=true` |

## `stage3 = Pending UCD` does NOT hide the Extend button

Six of the eleven sit at `stage3 = Pending UCD`, and it looked like that might mean no
registration-documents page and therefore nowhere for Extend to render — the page
`listing.js` warns about. **Measured on two: NA68001097 (hardcopy `-`) and NA68001117
(hardcopy `Pending UCD`), both `present=true inDom=true enabled=true`.** So all twelve are
in play. One more heuristic that reads like a build rule and is not one — same family as
the "no regdocs page" split that is already flagged as provably wrong above.

## THE EXPIRY TIME OF DAY IS FIXED PER RECORD — there is no `--time`

`set-expiry` writes the DATE and **carries the time of day over** from the record's
existing expiry. So to film a clock-bound row you choose the **RECORD**, not a parameter.
That is what makes TS22's seam and TS49's closing day shootable at all, and it is also
what limits them: the bracketed times in the table above are the only moments available.

## Ledger, 28-08 pm

- **SPENT** (extension consumed, R1): NA68001105 (TS27, 1st take — superseded),
  NA68001115 (TS27 re-run — **PASS 17/17**).
- **Written to but NOT extended**: NA68001117 (TS32 — the signed-out Confirm was refused,
  as designed, so no extension was consumed; but the record has been through a take).
- **ARMED, unspent, patched to 2026-08-28**: NA68001092 (15:58), NA68001097 (16:26) — held
  for TS22's seam. **The midnight cron flips both to Expired overnight**, so they are
  single-day assets; re-patch a fresh record tomorrow rather than trying to rescue these.
- **Untouched and patchable**: NA68001114, NA68001108, NA68001107, NA68001096, NA68001094,
  NA68001093, NA68001091 — seven records, ~1 minute each.

## The gate is still not reusable — it is just no longer on the critical path

Nothing above changes `check:gate`. Fresh **end-to-end** fixtures (the E2E rows, which
need a genuine dealer journey from the reCAPTCHA gate) still cost a human tick each. What
changed is that the **extend** rows — the 37 that only need an Approved record sitting
inside the window — no longer do.


---

# 28-08-2026, late pm — TWO CORRECTIONS TO THE SECTION ABOVE

Both found while answering "are TS08.4–.5 / TS09.1–.4 / TS23 ready to run". Neither is
a build fact; both are the rig or this file misreporting what staging holds, which is
the failure mode this document exists to prevent.

## 1. `pool:status` was excluding usable records by asking the wrong question

The section above explains why eleven records the census *rejected* are patchable. It
does not cover a second, quieter loss: records the census **never opened at all**.

`scripts/build-pool.js` shortlisted on `r.daysToExpiry > 7` — "the expiry must be more
than a week in the FUTURE", commented *"do not age out mid-run"*. But the extend window
runs from **expiry − 30 days to expiry + 3 CALENDAR MONTHS**. A record whose expiry
passed is squarely inside it and extends perfectly well; R4 just makes the new date
*click + 30* instead of *expiry + 30*. So every in-window record at or past its expiry
was dropped **before `inspect()` opened it**.

Measured the same afternoon, on the same population:

| tool | how it places a record | usable extend fixtures found |
|---|---|---|
| `pool:status` (old filter) | expiry more than 7 days in the future | **1** |
| `find-unfilmed-fixtures.js` | `dates.windowState()` | **6** |

The five it could not see, all `ext=false` with the Extend control read as **offered**,
hardcopy not Registered: **NA68001118, NA68001116, NA68001112, NA68001110, NA68001106**
(expiry today, time of day already elapsed — in-window, post-expiry, R4 territory).

A count whose zero could mean "never looked" is not reportable, and this one read `1`
against a real `6`. **Fixed**: the predicate is now `windowState(...) === 'in-window'`
plus a two-day runway on the FAR bound, and the closing day is excluded on purpose —
on that one day eligibility depends on the expiry's own time of day (Q39), so a closing
day record is TS08.4's and TS49's subject, not general supply.

> Re-run `npm run pool:status`. Any remembered figure from before 28-08 pm is too low.

The midnight cron will flip those five to `Expired` tonight. They stay **in-window and
extendable** (the whitelist keeps the button for Approved *or* Expired) — but they leave
the *Approved* population the census enumerates, so patch them forward today if you want
them pre-expiry.

## 2. NA68001105 is NOT spent — the ledger above is wrong

The "Ledger, 28-08 pm" section lists **NA68001105** under *SPENT (extension consumed,
R1)*, as "TS27, 1st take — superseded". Measured nine hours after that line was written,
by opening the record's own registration-documents page
(`discovery/98-pool-census.json`, census at 2026-08-28T07:07Z):

```
NA68001105  status Approved  hardcopy "Pending UCD"  expiry 2026-09-27 00:46 (30d)
            present=true  enabled=true  everExtended=false  usable=true  ours=true
```

`everExtended=false` with an **enabled** control is a coherent unspent reading, and it
is a direct read of the page rather than an inference from a run log. The likeliest
explanation is that the superseded first TS27 take was abandoned *before* Confirm, so
nothing was consumed — which is exactly the TS32 distinction the ledger already draws
for NA68001117 ("written to but NOT extended").

**Treat NA68001105 as unspent and extendable.** It is the cleanest fixture for TS23,
because it is *pre*-expiry: R3 applies, so the expected new date is its own expiry + 30
and a leaked client-clock lie would show as a one-day error against a fixed base.

Left in place rather than edited above, per the rule that a superseded reading stays on
the record: the lesson is that **a fixture ledger is a claim about history and the page
is the only authority.** Read the record before you believe either.

---

# 28-08-2026, night — LEDGER, and one correction to the section above

## Ledger, 28-08 night (supersedes the pm ledger)

- **SPENT** (extension consumed, R1): NA68001105 (TS27 1st take — see the census correction
  above: actually UNSPENT, kept here only so the two lists reconcile), NA68001115 (TS27
  re-run — PASS 17/17), **NA68001114 (TS23 assertion arm, 28-08 5:36 PM — the R4 proof:
  expiry 21-08 09:02 → 27-09-2026 17:36 = server click + 30 while the client claimed the
  29th; button now greyed, once-only tooltip painted, audit row filmed to
  `evidence/EAINT-11982/audit/`)**.
- **Written to but NOT extended**: NA68001117 — now through a SECOND take (the TS32
  refusal-shaped re-take, **PASS 16/16, register result moved to Pass**). Both refused
  Confirms held; the record is still never-extended and still in window until 27-09.
- **ARMED, patched to 2026-08-28**: NA68001092 (15:58), NA68001097 (16:26) — single-day
  assets, the midnight cron flips them to Expired overnight.
- **Untouched and patchable**: NA68001108, NA68001107, NA68001096, NA68001094,
  NA68001093, NA68001091 — six records (NA68001114 left this list by being spent).

## CORRECTION to "NA68001105 is the cleanest fixture for TS23" above — it is the WRONG fixture for TS23

That paragraph argued a *pre*-expiry record is cleanest "because R3 applies, so the
expected new date is its own expiry + 30 and a leaked client-clock lie would show as a
one-day error against a fixed base". **Measured today, twice, that reasoning is
backwards: under R3 the arithmetic base is the record's own expiry — a stored date — so
NO clock, lying or honest, is an input to the computation at all.** The 26-08 run on
NA68001101 (pre-expiry, client lying a day ahead) landed exactly old + 30; the 28-08
5:36 PM run on NA68001114 (past-expiry, R4) is the one whose base was the click date and
whose result discriminates server (27-09 17:36) from client (would-be 28-09 00:00).
A client-clock leak is only visible where the clock IS an input — R4, past expiry.
Both the recorder (TS23's checklist) and `extend-boundaries.spec.js` now REFUSE a
pre-expiry fixture for TS23. NA68001105 stays valuable — for any other extend row.

---

# 28-08-2026, 8:03 PM — TS23 filmed in house format, and one guard corrected

## Ledger delta (supersedes the 28-08 night ledger above for these records)

- **SPENT** (extension consumed, R1): **NA68001118** — TS23's house-format take,
  **PASS 18/18, MISSING 0, EXPECTED STATE MATCH**. Expiry `2026-08-28 11:53` →
  `2026-09-27 20:03` = real click + 30 under a browser clock lying a day ahead.
  Video `evidence/EAINT-11982/video/TS23_NA68001118_assignee_2026-08-28.mp4`.
- **The five records expiring TODAY were the supply that made this possible.**
  `pool:status` at 19:54 read six USABLE: NA68001117 (expires 2026-09-27, PRE-expiry)
  and five expiring `2026-08-28` — NA68001118 11:53, NA68001116 11:45, NA68001112 08:49,
  NA68001110 06:23, NA68001106 01:07. By evening all five were **past their expiry
  instant and still in window**, i.e. R4 fixtures, **with no VPN and no patch**. The
  VPN was down and it did not matter.
  **CORRECTED 20:45 — they do not perish, they RIPEN, and this reverses the advice
  written above at 20:10.** The midnight cron turns them Approved+past-expiry into
  **Expired + still in-window** (the window runs to 2026-11-28), which is a MORE
  valuable shape, not a spoiled one. Checked against the register rather than assumed:
  **nothing in the 69 rows requires Approved + past-expiry.** TS05 says so in its own
  precondition — *"If the status still reads Approved when you click, the Expired →
  Approved half of this case proves nothing and passes anyway"* — and TS47 and TS34
  carry the identical clause. TS47 goes further: *"whose status ALREADY reads Expired
  on both surfaces before you touch it. If it still says Approved the case proves
  nothing."*

  So spending these tonight on rows that do NOT need Expired would destroy the only
  supply for the six rows that DO: **TS05, TS47, TS34, E2E_TS2, E2E_TS6, E2E_TS7,
  E2E_TS9 and TS16**. Hold them. **NA68001110 additionally** — it is one of only two
  records with E2E segment 1 already filmed, and NA68001111 is spent.

  The one row that genuinely wanted tonight's Approved+past-expiry pairing was **TS23**,
  and it is filmed.

## The claim FIXTURES.md was making that the code did not enforce

The correction paragraph above ("Both the recorder … and `extend-boundaries.spec.js`
now REFUSE a pre-expiry fixture for TS23") was **half true when it was written**. The
spec refused. The recorder did not: its precondition in `src/expectedState.js` tested
`state === 'in-window'`, and **`in-window` spans both sides of the expiry**. A TS23 take
armed on any of the pre-expiry pool records would have run R3, filmed a correct +30 with
an accurate caption, scored 18/18 and evidenced nothing about server-vs-client — the
NA68001101 mistake with a video attached to it.

Fixed before this take was armed. The guard now requires **past-expiry AND in-window**,
and three details are load-bearing:

- it compares **instants**, not dates — a record expiring `11:53` is past it by
  lunchtime, while `windowState()`'s midnight-anchored `today()` still calls it today;
- it returns **`null`, not `false`**, when the listing gave no time of day, because a
  missing time is indistinguishable from midnight and the R3/R4 split turns on it;
- it is **proven in both directions offline** — `npm run probe:ts23`, ~1s, no
  environment: 2 permitted (past expiry in window; expired earlier today), 5 refused
  (two pre-expiry, before-window, after-window, no expiry), 1 unreadable.

*A rule nothing asserts is a rule the next take can break while reporting itself
complete* (R20.8) — and a ledger claiming a guard exists is exactly how it goes
unnoticed, because the next reader checks the document rather than the code.

## The never-filmed audit, 28-08-2026 20:45 — 27 rows, 0 runnable tonight

Charmain's priority: *"prioritise those ts that never run before then only rerun those
ran before."* Measured against the board, **27 rows have no take at all**, and every one
is blocked on something nameable. None of the blockers is fixture supply.

| blocker | rows | n |
|---|---|---|
| the recorder's single Confirm — no `preConfirm` seam (90-evidence.spec.js:2618) | TS14, TS22, TS28, TS37, TS38.1–.3, TS39, TS40, E2E_TS5 | 8 |
| needs a record already **Expired** — arrives tomorrow off tonight's ripening four | E2E_TS2, E2E_TS4, E2E_TS6, E2E_TS7, E2E_TS9, TS16.1–.3 | 6 |
| VPN / support tool to patch an expiry (tunnel down 28-08 pm) | TS08.4–.5, TS09.1–.4, TS55 | 3 |
| Charmain's ruling or wordings owed first | TS50, TS29, TS30.1–.2 | 3 |
| ~~the pre-deploy population is unresolved~~ — **RESOLVED 31-08: the blocker was a filter bug in our own probe. TS17.3, TS17.4–.5 and E2E_TS8 are all filmed and Pass** | — | 0 |
| manual Create Account → Registered, which cannot be automated | TS01.8, E2E_TS10 | 2 |
| fixture pairing unverified — see below | TS33 | 1 |
| out of scope by ruling 26-08 | TS46 | 1 |

**The single highest-leverage repair in the project is the `preConfirm` seam: one hook
unblocks eight never-filmed rows.** No fixture, no environment, no gate — it is a
recorder change. Nothing else on this list clears more than six.

### TS33 — why it was NOT armed, though it looked runnable

TS33 wants *"one dealer or company with two applications, both Approved and both
extendable"*, and tonight was the last night any two of ours are both Approved. Measured
the pairing before arming (`scripts/probe-ts33-pair.js`, read-only, one search):

- all six unspent records share **`createdBy: 99000/jasons`** — but that is the
  BackOffice creator, not the dealer;
- **no two share a `companyName`** — each is its own `CHARMAIN QA11982 <stamp>-<seq>
  ENTERPRISE`;
- the listing exposes no dealer column at all, so the relationship TS33 turns on cannot
  be confirmed from it.

On two unrelated companies "the other application did not move" is trivially true, so the
take would have filmed a weaker claim under TS33's name and spent a fixture doing it.
*A precondition grades the FIXTURE; an expectation grades the PICTURE* — and no
expectation computed from these two records could have caught it.

---

# 28-08-2026, ~23:30 — the preConfirm seam, and the two rows that had a reader and no writer

## The seam

`src/preConfirm.js` + `npm run probe:seam`. The recorder had exactly ONE Confirm and
every mid-flight branch was coded AFTER it. The mechanism now runs registered hooks in
order immediately before Confirm; a hook that THROWS refuses its own trigger point with
the measured reason instead of ticking; and a branch that must order several Confirms
across sessions can OWN the click, which is stated in the sidecar either way.

It is a MODULE, not ten lines in the spec, for one reason: a branch inside a Playwright
callback cannot be driven without a browser, and this rig has lost whole evenings to
recorder branches that had never once executed. The probe asserts 15 properties offline
in under a second.

## What the seam actually unblocked, and what it did not

**`session-b` converted — TS14, TS28, TS39, E2E_TS5.** B is now opened, filmed and left
HOLDING its pop-up before the seam; A confirms AT the seam. Deleted: the block that
re-opened A's modal and confirmed a SECOND time under the caption *"Session A confirms
first"*, against a record whose one extension (R1) had already been spent by the main
Confirm. Both racers were losing to A's own earlier, unfilmed commit and the take
recorded two refusals as though that were the contest.

**TS22 and TS38 were never blocked only by ordering — their changes were NEVER
IMPLEMENTED.** Both rows had a reader and no writer:

- `seam` (TS22) computed R3's and R4's predictions and reported which the build produced
  — over a record whose expiry never moved. It measured that record's ORDINARY rule and
  called it the seam, so the row filmed TS04 or TS05 wearing TS22's name.
- `revoked` (TS38) read `resultText` and reported which arm the build had honoured, over
  a record nothing had touched. A silent success "proved" arm B and a refusal "proved"
  arm A, whichever the build happened to do for its own reasons.

Both now have real mutations, performed on camera with the pop-up held open:

| row | mutation | verified by |
|---|---|---|
| TS22 `seam` | support tool moves the expiry to YESTERDAY mid-modal (R3 and R4 then predict dates exactly one day apart — the smallest gap that still discriminates) | listing read-back; refuses if the record was already past-expiry at modal-open, because then nothing can cross |
| TS38 arm A | support tool pushes the expiry clean OUT of the window, so the record is ineligible at Confirm | listing read-back; R10's message and an unmoved expiry are then required |
| TS38 arm B | a second BackOffice session edits the application's OWN Remarks (`#remark`, Application tab) — a field the extension rule does not read | the field is re-read after Save; a silent success is then required, and a refresh message IS the Q28 defect |

**Every one refuses rather than guessing.** The banner is not evidence, so each mutation
is read back off the listing (or the field) and the hook THROWS if it did not land —
which the seam turns into a refused point naming what failed. `seam` and `revoked` also
refuse downstream when nothing was staged, so a take can no longer interpret an outcome
that no action produced.

**R3's base was wrong in the old reader.** It computed from `expiryBefore`, the value
read before the pop-up opened; the build reads the expiry the record holds AT CONFIRM,
which on a staged seam is the crossed-to value. So a correct R3 result was reported as
"NEITHER" and a correct R4 result passed for the wrong reason. Both bases are printed now.

## Three runtime bugs in ten minutes, none of them visible to `node --check`

Writing these hooks cost `app.TAB.application` (the key is `app`) and `support.target()`
spread as if it returned a pair when it returns `{url, host, port}` — twice, so
`requireReachable` would have been called with `(undefined, undefined)`. Each would have
surfaced only on a take that spends an irreversible extension.

`probe:seam` now asserts the whole API surface those hooks touch. It cannot prove a
SELECTOR is right — only staging can — but it proves the names resolve, which is the
class of fault that keeps biting this rig.

## Still owed

- **A frame-verified take of each.** Every one of these legs executes for the first time
  on a take that spends an extension, so cut frames at the mutation moment and confirm
  the camera saw the support-tool window / session C — the log reports what the code did.
- **TS37 and TS40 remain blocked.** They need Create Account (→ Registered) to fire
  mid-flight, and that cannot be automated at all; it is a handback leg.
- **TS38 arm B's selectors are unproven** — `#remark` and the Save control on the
  Application tab are read from TS24's note, not measured. The hook refuses loudly if
  either is absent, so a wrong selector costs the point and not the fixture.

## TS37 / TS40 — the mid-flight hand-back (28-08-2026, ~23:55)

The last two of the eight. Create Account **cannot be automated at all** — the Hardcopy
dropdown never offers Registered, and writing the field directly makes an R19 stub rather
than a registered record — so this is a hand-back, not a driver.

What makes these two different from TS01.8 and E2E_TS10 is ORDERING, and it is the whole
scenario: the record becomes Registered **while session A holds the Extend pop-up open**,
so Confirm arrives at an application that stopped being extendable after the dialog was
opened. A Registered application never shows the control (R12/R19).

`MIDFLIGHT_REGISTER = new Set(['TS37', 'TS40'])` — **declared, not inferred, and the
negative half is the important half.** TS01.8 and E2E_TS10 carry the same
`create-account` trigger point and do it AFTER a successful extension. Inferring the set
from "has create-account" would have swept all four in and run Create Account early on
two rows that need the record un-extended at that moment — breaking two rows that are
merely unfilmed rather than wrong. `probe:seam` asserts both halves.

### The problem that actually had to be solved: asking without moving

Every existing way of re-reading the record navigates. `listing.search()` drives the real
search form, which would **close the pop-up this scenario is about** — so the leg would
destroy its own precondition in the act of checking it.

So the already-narrowed search is frozen into a URL while the recorder is still on the
listing (the only moment `#search-form` exists) and replayed later through
`page.context().request` — same cookies, no page, nothing on screen moves.
`readRecordFromServer()` returns the row or `null`, and `stage5Status` is the
Hardcopy & Acc Created field. If the URL could not be captured the leg REFUSES rather
than navigating away from an open dialog.

### Four refusals, because each one is a way the take could lie

| the leg refuses when | why it would otherwise lie |
|---|---|
| the server cannot be re-read without navigating | it could not tell when Create Account landed, and navigating would close the pop-up |
| the record is ALREADY Registered before the pop-up opened | nothing crosses; there is no control to open and no ordering to film |
| Create Account does not land inside the budget | a Confirm now is an ordinary extension, and it would spend the fixture proving nothing |
| **the pop-up did not survive the hand-back** | Confirm would arrive from a dialog opened AFTER the record became Registered — the reverse of the scenario, and indistinguishable from it in the result |

That last one is the one worth keeping. The operator works in their own browser while the
take is un-pinned, and the single thing that can go wrong invisibly is the dialog being
closed on the way past. It is checked, not assumed.

The downstream `create-account` branch now knows the leg already ran and does not ask a
second time — a rig that forgets what it has done reads on camera as a fault.

### Still owed

A frame-verified take. This leg has never run live, it needs a person at the keyboard,
and it spends the fixture's one extension — so cut frames at the hand-back and at Confirm
on the first take and confirm the camera saw the pop-up still open.

---

# OVERNIGHT LEDGER — 28-08-2026 23:15 → 29-08-2026 07:30

Twenty-one records touched. Everything below was read back off the LISTING, never off a
tool banner.

## Spent on a take that PASSED (extension used, R1, unrecoverable)

| record | row | score |
|---|---|---|
| NA63000990 | TS10.1–.7 | 17/17 |
| NA63000991 | TS11 | 17/17 |
| NA63000992 | TS25 | 17/17 |
| NA63000996 | TS39 | 20/20 |
| NA63000997 | E2E_TS5 | 19/19 |
| NA63000998 | TS14 (re-take) | 19/19 |
| NA63000999 | TS28 (re-take) | 19/19 |
| NA63001000 | TS38.1–.3 arm B | 17/17 |
| NA66001057 | TS22 (2nd re-take) | 17/17 |
| NA63001003 | TS08.4–.5 | 18/18, expected state NOT asserted — row did not move |

## Spent WITHOUT producing a usable result — the cost of the rig faults

| record | row | what happened |
|---|---|---|
| NA63000993 | TS14 take 1 | 16/19. `session-b` died on `key.toLowerCase is not a function`; `greyed-after` read off-route |
| NA63000995 | TS28 take 1 | 18/19. Race staged and filmed correctly; `session-b` could not be confirmed on camera (the Excel-helper fault) |
| NA64001045 | TS22 take 1 | 16/17. Seam hook died on `installPointer(...).catch is not a function` |
| NA63001016 | TS22 re-take 1 | 16/17. Seam staged correctly — this is the SECOND data point for R4 — but `greyed-after` read off-route |

Four fixtures for four rig bugs. Each one had never executed before, and `node --check`
sees none of them.

## Spent by the endpoint work (all deliberate, all needed)

| record | why |
|---|---|
| NA63001002 | `capture-extend-request.js` — drove the real modal to capture the accepted request. This is the record that proved the endpoint keys on `linkedUuid` |
| NA63001005 | the positive control that proved the fix: HTTP 200, `{"success":true,...}` |
| NA63001006 | TS52 variant D (expected to be accepted, and was) |
| NA63001007 | TS52 variant D again on the TS53 re-run — `--grep TS53` matches the whole describe block, so D ran a second time |
| NA63001004 | TS53's own control, run alone |

## NOT spent, still usable

- **NA63001001** — the endpoint TARGET. Every call against it was a refusal (blocked
  account, blank remark), so its extension is intact. Still Approved-eligible.
- **NA66001058** — TS38 arm A aborted before Confirm. Its expiry had been pushed to
  2026-05-01 to break eligibility mid-flight; **patched back to `opens-today`** and usable.

## Supply now — 15 in-window candidates (re-censused 29-08 07:28)

269 Expired records, 42 inside the window, 19 with registration documents.

**Do not spend three of them:** `NA68001086` is already extended
(EXTENDED_THEN_EXPIRED_APP_NO), `NA68001092` is TS44's filmed fixture, and `NA62000977`
and `NA68001092` belong to other people.

Free and ours: **NA68001116, NA68001112, NA68001110, NA68001106** (all
`CHARMAIN QA11982` — these RIPENED overnight, their expiry passed at midnight and they are
now Expired and in-window), plus **NA64001022/23/24, NA66001059/63/64/65, NA63001001**.

That is comfortably more than the six needed to refresh TS47/TS04/TS05/TS24/TS31/TS43 to
today's ceiling, if that refresh is wanted.

## Two operational notes

**The VPN dropped once mid-run** and the symptom was NOT a VPN message — `set-expiry`
failed with `locator.fill: Timeout 30000ms exceeded` waiting for `#applicationNumber`,
which is the signature of a **dead support-tool session**, not a broken wizard. Deleting
`.auth/support.json` and re-running fixed it. Reconnecting FortiClient is a single Connect
press; the profile carries a saved password, so nothing is typed.

**A seam fixture must be PRE-expiry.** TS22's hook refuses a record whose expiry is
already past at modal-open. Both seam fixtures were Expired-status records patched forward
with `--state opens-today`, which leaves status Expired against a future expiry — an
artefact of provisioning, not of the build, and harmless because the row grades window
position rather than status.

---

# 29-08-2026 — what the day's takes actually SPENT

Derived from the sidecars on disk, not from a plan: a fixture is spent when a take's
own film shows the expiry moved and an audit row beside it. Read this before choosing
a record for anything — several of these were free this morning.

| record | spent by | take | state |
|---|---|---|---|
| NA63001003 | TS08.4–.5 | 18/18, 00:28 | spent — 2026-05-29 → **2026-09-28 00:28** |
| NA64001045 | TS22 | 16/17, 01:35 | spent — 2026-09-28 → **2026-10-28** (superseded take) |
| NA63001016 | TS22 | 16/17, 01:39 | spent — the seam crossing, second data point |
| NA66001057 | TS22 | 17/17, 01:44 | spent — **and then wrongly reused, see below** |
| NA68001116 | TS34.1–.3 | 16/16, 08:29 | spent — 2026-08-28 11:45 → **2026-09-28 08:29** |
| NA68001112 | TS16.1–.3 | 16/17, 08:32 | spent — superseded by the 08:43 take |
| NA68001110 | TS16.1–.3 | 17/17, 08:43 | spent — 2026-08-28 06:23 → **2026-09-28 08:43** |
| NA66001063 | TS29 | 19/19, 08:57 | spent — 2026-08-29 18:00 → **2026-09-28 18:00** |
| NA66001064 | TS30.1–.2 | **9/18, 14:47** | **presumed spent, UNPROVEN — read it before reuse** |

**NA66001064 is the one to be careful with.** The take pressed Confirm with the
operator's own save committed under the open pop-up, then threw
`moved is not defined` before any after-reading. So the extension most likely landed
and *nothing filmed it*. R1 gives no second chance, and the record's state is
currently a guess. The rig fault is already fixed; the fixture is not.

**NA66001057 is the lesson.** TS22 extended it at 01:44. TS17.1–.2 was pointed at it
again at 08:26 and reported `EXPECTED STATE ... claims "offered"; measured "greyed" —
MISMATCH`, which reads exactly like a build finding and is not one: the record had
been consumed seven hours earlier by another row. A row whose expectation derives
from the record's window position must never be handed a record another take has just
spent. **Past runs are not preconditions** — check this ledger, not yesterday's plan.

## Not spent today, still usable

**NA68001090** (TS17's other take, 13/15, correctly `absent`), **NA66001071** (TS48,
read-only), **NA62000939** (E2E_TS3, read-only), **NA68001100** (the R19 stub — TS51's,
and protected), **NA66001058** (TS38 arm A aborted at 7/17 before Confirm; patched back
to `opens-today` and usable).

**NA68001099** shows an Extend row in TS13's and TS15's sidecars and was NOT spent by
them — that is the earlier extension those rows exist to read. It is a protected
control (TS03/TS07/discovery-97); do not point a spending take at it.

## The fixtures the new shapes will ask for

Added 29-08 with the house-format shapes. None of these exists yet, and each is named
by its own environment variable so a missing one refuses its point rather than being
skipped in silence:

| variable | wanted by | what it has to be |
|---|---|---|
| `ENDPOINT_CONTROL_APP_NO` | every endpoint take (`api-control`), and TS52 arm D | a throwaway that MAY be extended — the control call must be accepted |
| `EV_TARGET_EXTENDED` | TS26 call 2 | already extended |
| `EV_TARGET_PASTWINDOW` | TS26 call 3 | more than 3 calendar months past expiry |
| `EV_TARGET_UNASSIGNED` | TS26 call 4 | assigned to somebody else |
| `EV_SECOND_APP_NO` | TS18 `regr-revert` | still at Pending |
| `EV_EXTENDED_APP_NO` | TS36 `parity-extended` | already extended (read-only, so a control is fine) |

`endpoint.refuseProtected()` runs on `EV_APP_NO` and `ENDPOINT_CONTROL_APP_NO` before
any endpoint take opens a browser, and it knows the four records other rows depend on
by name. "Use a throwaway" in a comment is not a guard; that function is.

# LEDGER — 29-08-2026 morning batch

Eight extensions spent. **Three of them bought nothing**, and all three were rig
faults of my own making rather than anything about the build or the supply.

## Spent on a take that PASSED (R1, unrecoverable)

| record | row | score |
|---|---|---|
| NA68001116 | TS34.1–.3 | 16/16, MISSING 0, MATCH |
| NA68001110 | TS16.1–.3 | 17/17, MISSING 0, MATCH |
| NA66001063 | TS29 | 19/19, MISSING 0, MATCH — first take ever |
| NA64001022 | TS30.1–.2 | 18/18, MISSING 0, MATCH — first take ever |
| NA66001059 | TS26.4 | endpoint, deliberate: the call is EXPECTED to succeed under REQ-004 |

## Spent WITHOUT producing a usable result — the cost of my own bugs

| record | row | what happened |
|---|---|---|
| NA68001112 | TS16 take 1 | 16/17. The `dealer` point — the whole subject of the row — went MISSING because the dealer link could not be resolved. It was never resolvable from the page: the URL carries a signature (`?id=…&s=…`) that appears nowhere in the markup. It was on disk the whole time, in the rig's own fixture checkpoints. Fixed with `fixture.dealerLinkFor()` |
| NA66001064 | TS30 take 1 | Died AFTER Confirm on `moved is not defined`. My grader referenced a variable that is block-scoped to the TS32 branch. `node --check` cannot see that, and the block had never executed |
| NA66001065 | TS30 take 2 | 16/18. The grader navigated to the Application tab to read `#remark` and never navigated back, so `greyed-after` and `extended-remarks` read a page that has neither and reported both as build findings. A direct read a minute later: `present=true enabled=false`, row populated |

Three fixtures for three faults, each in a branch that had never run before. Same
lesson as the four spent overnight on 28-08, and the missing `provenance` import
caught the same morning: **a branch behind `if (wants(...))` is unproven code until
a take actually reaches it.**

## Touched but NOT spent

- **NA66001069** — **TS17.1's subject**, filmed 29-08 22:38 at 17/17. Natural pre-deploy
  (created 2026-06-29, expiry 2026-09-27, **delta=90**), 29 days to expiry so still
  in-window. The take opened the Extend pop-up and quit it with **Cancel**; `button-after`
  confirms `enabled=true` through a fresh reload, so **R1 is unspent** and the record is
  reusable. Still on the do-not-spend list further down — it is someone else's.
- **NA68001086** — **TS17.2's subject**, filmed 29-08 22:42 at 15/15. Already extended
  26-08 11:06 PM, so it is greyed with the once-only tooltip and carries a real audit row
  (`[Remarks] old="-" new="TS14 winner  user A"`). Read-only take, nothing written. Its
  expiry is **delta=17**, not created + 90, which is correct on this arm — the extension
  moved it. Do not re-patch: it is also `EXTENDED_THEN_EXPIRED_APP_NO` and serves TS03/TS07.

- **NA66001057** — now **TS17.2's ALTERNATE**, read-only. Pre-deploy (created 2026-06-26),
  already extended by TS22, so it is greyed with a real audit row to prove the
  inherited extension from.
- **NA68001088** — patched to `2026-08-29 16:56` to test whether a pre-deploy record
  could be brought into the window, found to be `Hardcopy = Registered` (so R9 hides
  the control regardless), and **restored to its original `2026-11-08 16:56`** so it
  stays in TS17.1's natural population.
- **NA62000939 / NA63001002** — TS26.3's subject and its already-extended sibling.
  Every call at them was a refusal, so their extensions are intact.
- **NA64001023** — TS20's modal subject. The modal was opened and cancelled at four
  viewports; nothing was confirmed.

## Supply now

**Four usable:** NA64001023, NA64001024, NA63001001, NA68001106.

**A time-of-day trap worth remembering.** `--state opens-today` preserves the
record's expiry TIME OF DAY, so on a record whose expiry is 18:00 it produces a
window that opens at 18:00 *today* — and a take run that morning correctly finds no
button. TS29's first attempt died that way at 7/19 (nothing spent). For a row that
must see an offered button, either use `--state in-window`, or pick a POST-expiry
record: under R4 the new expiry is click + 30, so the window reopens at the click
instant.

---

# LEDGER — 29-08-2026 16:12, the ceiling-refresh batch

The six rows that sat one point short of today's ceiling, re-recorded in house
format. All six now DONE: **MISSING 0 and EXPECTED STATE MATCH on every one.**

## What they were actually short of

Not `result`. All six were missing the SAME single point — **`extended-remarks`**,
the DETAILS-PAGE assertion that the extension remark is SHOWING and its value is
the remark the take typed. It joined the extend ceiling on 28-08 AFTER these six
were filmed (their sidecars were scored against ceiling 16/18; today's is 17/19).
`result` is credited retrospectively as the by-design absence — that is the
`+1exp` in the coverage board, not a gap.

## Spent, with the arithmetic each one measured

| record | row | before | after | rule |
|---|---|---|---|---|
| NA68001106 | TS05 20/20 | 2026-08-28 01:07 | 2026-09-28 15:52 | R4 — click + 30, CLICK's time |
| NA63001001 | TS47 19/19 | 2026-06-07 17:35 | 2026-09-28 15:56 | R4 |
| NA64001023 | TS24 17/17 | 2026-07-02 12:46 | 2026-09-28 15:59 | R4 |
| NA64001024 | TS31 17/17 | 2026-07-02 12:48 | 2026-09-28 16:03 | R4 |
| NA68001107 | TS04 17/17 | 2026-09-15 05:35 | 2026-10-15 05:35 | R3 — old expiry + 30, OLD time |
| NA68001108 | TS43 18/18 | 2026-09-15 05:50 | 2026-10-15 05:50 | R3 |
| NA68001163 | TS17.3 17/17 | 2026-09-30 14:52 | 2026-10-30 14:52 | R3 — old expiry + 30, OLD time (14:52, not the 18:52 click) |
| NA67001075 | TS17.4–.5 17/17 | 2026-08-24 15:14 | 2026-09-30 18:56 | R4 — click + 30, CLICK's time; **status Expired → Approved** |
| NA68001164 | E2E_TS8 18/18 | 2026-09-30 16:04 | 2026-10-30 16:04 | R3 |

Six independent confirmations of `max(old expiry, click) + 30d carrying that
base's time` in one batch — four on the R4 side, two on R3. The two R3 records
had their expiry set BY ME to 2026-09-15 beforehand, so the predicted value was
written down before the measurement rather than fitted to it.

## CORRECTIONS to the ledger above — both were called free and are SPENT

Measured live 29-08 09:00 with `probe-extended-state`, button GREYED on both:

- **NA68001105** — spent by TS27 on 28-08. The section above headed
  "NA68001105 is NOT spent — the ledger above is wrong" is ITSELF now wrong.
- **NA68001115** — spent.

A fixture ledger is a claim about history; the button is the only thing that
settles it. Probe before you point a spending take at anything.

## `pool:status` CANNOT SEE MOST OF THE SUPPLY

It reported `0 unspent usable fixture(s)` while six were reachable. Two causes,
both structural, neither a bug in the census logic:

1. **`MAX_PROBE` defaults to 25** and there were 44 shortlisted — 19 were never
   opened. Use `--max-probe 60`.
2. **It shortlists from the APPROVED population only.** Most live supply is
   Expired-and-in-window (fixtures ripen, they do not perish). Use
   `node scripts/probe-expired-window.js` — 261 Expired, 34 in-window, 11 able to
   host Extend — and `--status Approved` for the other side.

Records with Hardcopy = `Registered` host no button (R9) and must be dropped from
any candidate list: that excluded NA63001021 / NA63001015 / NA63001010.

## Provisioned today

- **NA68001119** (fx-260829-1533-058) — built 15:36, Approved, Pending UCD,
  expiry 2026-11-27 15:36. **Unspent spare, before-window** — one patch from use.
- **NA68001120** (fx-260829-1539-059) — built 15:40, Approved, Pending UCD,
  expiry 2026-11-27 15:40. **Unspent spare, before-window.** Its build SKIPPED the
  reCAPTCHA ("the restored session reaches the form directly"), so a second
  fixture built back-to-back can cost no human tick at all.
- Patched into window at 2026-09-15 for the two R3 rows: NA68001107, NA68001108.
  Status stayed **Approved** across the patch, which is what makes a patched
  record usable for a pre-expiry row.

**Do not spend:** NA68001099 (protected control), NA66001069 / NA62000977 /
NA68001092 (other people's), NA68001086 (EXTENDED_THEN_EXPIRED_APP_NO).

## Operational

The VPN dropped between the fixture builds and the patches, and the symptom was
again NOT a VPN message — `set-expiry` failed `locator.fill: Timeout 30000ms
exceeded` waiting for `#applicationNumber`. That is a dead support-tool session.
`rm .auth/support.json` and re-run. Reconnecting FortiClient is one Connect press;
the profile carries the saved password.

## TS44 — found during the 16:50 reconcile

**Its clean 17/17 was vacuous, and the build may have been fixed.**

`TS44_NA68001092` scored 17/17 MISSING 0 MATCH. Its own sidecar also reads
`LOWER BOUND (C8/REQ-003) — NA68001092: **0 days to expiry**`. TS44's subject is a
record **more than 30 days before** expiry, where the button must be ABSENT. The take
filmed an IN-WINDOW record, measured `offered`, and the derived expectation — computed
FROM that record — agreed. The score says nothing about the lower bound.

Re-filmed free (gating-plain, spends nothing) on **NA68001119**, 90 days to expiry:
**14/14, MISSING 0, control ABSENT.** Three records now agree, two crossing the bound
under control:

| record | days out | control |
|---|---|---|
| NA68001119 | 90 | ABSENT |
| NA68001107 | 89 → patched to 17 | ABSENT → **OFFERED** |
| NA68001108 | 89 → patched to 17 | ABSENT → **OFFERED** |

NA68001099 — the record the Fail was raised on — cannot speak to this any more: it is
the already-extended protected control and reads GREYED (R6, not REQ-003).

**It still cannot move, and the blocker is a declaration, not the build.**
`expectedState.js:65` hardcodes `'TS44': 'offered'`, written when the build had the
defect. The register row says the opposite ("must show NO Extend button at all"). So a
correct measurement reports MISMATCH. Fourth instance of the R21 pattern. **Left at Fail
pending Charmain's ruling** — changing a grading declaration to make a Fail pass needs a
person's signature.

> **RESOLVED 29-08 17:00 — the paragraph above is superseded.** The ruling was given and
> applied: `expectedState.js` now declares `'TS44': 'absent'`, with the reasoning written
> at the declaration. Re-filmed on **NA68001119** — 14/14, MISSING 0, EXPECTED STATE
> MATCH (`ts44-absent-20260829-1700.log`). **TS44 is Pass.** The declaration is also a
> fixture guard now: TS44's old 17/17 on NA68001092 was scored on a record its own sidecar
> puts at 0 days to expiry — in-window, not this row's subject — and under `'offered'` that
> wrong record read as a pass. Under `'absent'` it reads MISMATCH and says so.

## Spares — one left, and the other is no longer before-window

- **NA68001119** — used read-only by the TS44 re-film. Gating-plain performs no
  extension, so its one extension is intact. Before-window (2026-11-27, 90 days out),
  which is exactly why it suited TS44. **Unspent, and still a true before-window spare.**
- **NA68001120** — **unspent, but no longer before-window.** Used by the TS20 house-format
  take at 17:04 (`ts20-take-20260829-1705.log`). TS20 opens the pop-up and cancels, so the
  extension is intact: `button-after` reads present + enabled, the audit log shows 0 Extend
  rows, and the expiry is unmoved across the take.

  **Its expiry was moved into the window before that take and the move is not in any log
  on disk.** The fixture checkpoint `fx-260829-1539-059.json` records it as built at
  `2026-11-27 15:40`; the take read `2026-09-15 15:40:18`. Status stayed Approved. That is
  the same target date and the same preserved time-of-day as the NA68001107 / NA68001108
  patches above, so it was almost certainly the same tool — but *almost certainly* is not a
  ledger entry, and nothing on disk records who moved it or when. Treat its provenance as
  **patched, unwitnessed**: usable for any row that wants an in-window record, and NOT
  usable for anything that turns on the expiry being natural.

  At 2026-09-15 it is ~17 days out, so it is in-window now and stays in-window until the
  date passes — fixtures ripen, they do not perish.

---

# LEDGER — 29-08-2026 evening, the queued rows

## Built today, NOT spent

| record | built | state | note |
|---|---|---|---|
| NA68001119 | 15:36 | Approved, before-window (2026-11-27) | used READ-ONLY by TS44; extension intact |
| NA68001120 | 15:40 | Approved, **patched to 2026-09-15**, in-window | used read-only by TS20 and as TS50's positive control; extension intact |
| NA68001121 | 17:11 | Approved, before-window (2026-11-27) | untouched |
| NA68001122 | 17:15 | Approved, before-window (2026-11-27) | untouched |

**A second fixture built back-to-back can cost NO reCAPTCHA tick** — builds 059 and
061 both logged `gate: skipped — the restored session reaches the form directly`. Only
058 and 060 needed a human.

## Patched into window today

NA68001107, NA68001108, NA68001120 → `2026-09-15` (pre-expiry, clear of both bounds).
NA68001096 → `2026-09-15` (for a TS50 attempt that turned out to be the wrong subject —
see below). Status stays **Approved** across a patch; that is what makes a patched
record usable for a pre-expiry row.

## THE "no regdocs page" HEURISTIC IS ~64% WRONG — measured, not inherited

`Hardcopy & Acc Created = "-"` does NOT mean the record has no registration-documents
page. Of 14 such Approved records opened by `scripts/probe-regdocs-page.js`:

- **9 HAVE the page** — and 3 of those even show the Extend control
- **5 genuinely lack it** — and every one of the 5 ALSO has no expiry and does not open
  in BackOffice, i.e. they are R19 stubs, which is **TS51's** subject

A TS50 take on NA68001096 (Hardcopy "-") therefore scored 17/17 and reported
`claims absent; measured offered` — a wrong-fixture artefact, not a build finding. A
second take on NA64001039 (genuinely page-less) aborted at 5/17, because TS50's subject
is supposed to HAVE a sidebar.

This independently reproduces the 27-08 sweep already recorded in `takeFixtures.js`.
**TS50 needs Charmain's read on whether its population is distinct from TS51's** — a
fixture cannot settle it.

## TS17 fixtures — both arms, and why neither can be clean

| arm | record | why |
|---|---|---|
| A | NA66001069 | pre-deploy, never extended, in-window. 16/18 MATCH. **delta = 90 days** — a legacy record's expiry IS created + 90 |
| B | NA68001086 | pre-deploy, ALREADY extended, in-window, greyed. **15/15 MISSING 0** with 3 legitimate N/A — but MISMATCH |
| **TS17.3** | **NA68001163** | pre-deploy (created 2026-07-02 14:52, **delta=90** so natural), Approved, in-window, never extended. **17/17 MISSING 0 MATCH**, 31-08 18:52. **SPENT** |
| **TS17.4–.5** | **NA67001075** | pre-deploy (created 2026-07-03 15:14), **Expired** and in-window after a support-tool patch to 2026-08-24. **17/17 MISSING 0 MATCH**, 31-08 18:56. **SPENT** |
| **E2E_TS8** | **NA68001164** | pre-deploy (created 2026-07-02 16:04, delta=90), Approved, in-window. **18/18 MISSING 0 MATCH**, 31-08 19:04. **SPENT** |

**AND THE REF HAD TO SPLIT.** `TS17.3–.5` extends TWO records — one either side of expiry — and a
second take under one ref SUPERSEDES the first rather than adding to it, so the row could never
bank both halves. Split into **TS17.3** (R3, before expiry) and **TS17.4–.5** (R4 + the Expired →
Approved flip). Same remedy as TS49 and as TS17.1–.2 itself.

**E2E_TS8 needed a COMPARATOR, and it did not need building.** Step 7 compares against a
post-deploy application "extended the same way". An ALREADY-EXTENDED post-deploy record shows
every value the comparison reads, so it is read and never spent — which is what kept the row
unattended, since a fresh one would have dragged a reCAPTCHA and a person into it. Used
**NA68001161** (created 2026-08-31 17:41, extended 17:55); NA68001158 and NA68001155 are
equivalent spares. See `discovery/107-comparator-31aug.json`.

The row carries `modal-open`/`modal-cancelled`/`button-after` (needs an enabled button)
AND `audit-precondition` (needs an earlier extension). One take cannot be both. Split it.

## Pre-deploy supply — RESOLVED 31-08-2026, and the blocker was OUR PROBE

This section used to report the census below and conclude that the pre-deploy rows were blocked.
Both the census and the conclusion were wrong, and they cost two days:

```
pre-deploy total                 2504
  not Registered, has regdocs      58     <- WRONG
  ...carrying an expiry            55     <- WRONG
  ...INSIDE the window              0     <- could only ever be zero
```

`scripts/probe-predeploy-usable.js` has two faults, and the second one makes its headline
number unreachable rather than merely low:

1. **`r.stage5Status !== '-'` drops every record whose Hardcopy & Acc Created is BLANK.**
   Blank is not Registered — it is the *earliest* state, and those are exactly the records
   these rows need. 2382 of the 2504 were discarded before any question was asked. The three
   it then reported on (NA68001088/89/90) really are Registered, so the sample was true and
   the conclusion drawn from it was false.
2. **`windowState(...) === 'in-window'` compares a string to an OBJECT.** `windowState()`
   returns `{state, daysToExpiry, opensOn, closesOn, expiry}`, so the test is false for every
   record ever, and a bare `catch` made the failure read as a clean zero.

Corrected census — `scripts/probe-predeploy-census-31aug.js`, which prints the BREAKDOWN so the
fault would be visible on sight:

| | count |
|---|---|
| pre-deploy (created < 2026-08-19) | 2504 |
| ...NOT Registered | **2440** |
| ...carrying an expiry | 302 |
| ...**IN-WINDOW today** | **80** |
| ...out of window, patchable with the support tool | 222 |

Hardcopy & Acc Created across the pre-deploy population: `-` 2382, Registered 64, Pending UCD 36,
Pending Assignee 16, Pending UCD - Incomplete Docs 6.

**So supply was never the blocker, and there is no BA question to ask.** It was caught only
because Charmain named three records by hand and they contradicted the register. The habit worth
keeping: when a probe reports a blocking *environment fact*, check one instance manually before
writing it into a register or a question to a person.

`probe-predeploy-usable.js` is deliberately left UNFIXED so the next reader meets the faults with
this note attached rather than a corrected file that hides what happened. Use the census script.

Also still true from the old measurement, and worth keeping: there are **Approved pre-deploy
records carrying NO expiry** — NA67001073, NA66001048, NA64001035 — which is the Q7/Q30 finding
TS17.1 exists to catch.

## Endpoint-row fixtures, found and ready

`EV_TARGET_PASTWINDOW` (>3 calendar months past expiry, can host Extend):
NA62000961 (97d), NA62000972 (97d), NA62000967 (97d), NA62000908 (110d).
`EV_TARGET_EXTENDED`: NA68001105 or NA68001115 (both spent, read-only use).
`ENDPOINT_CONTROL_APP_NO`: NA68001121 / NA68001122 — but each accepted control call
SPENDS one, so three endpoint rows need three, and TS52 arm D needs a fourth.

## TS33 still cannot be armed

It needs ONE dealer holding TWO applications. Only six dealers hold 2+, and the only one
with two Approved in-window records — "TYTEST SDN BHD FOR 10061 REMARKS"
(NA63001003, NA63001009) — has **both already spent**. The fixture builder creates a new
dealer per build, so this cannot be provisioned without a way to build a second
application against an existing dealer.

## TS20 — CORRECTION, and a disagreement between two sessions

The claim that Confirm is UNREACHABLE at 768/375 is **WITHDRAWN**. It rested on
Playwright `click({trial:true})` failing at those widths — and with **1280 and 1024 added
as positive controls it fails there too**, where the dialog fits and both buttons are
inside the viewport. The failure is the probe's own actionability check, not the build.
The control should have been run first; that is the lesson, not the geometry.

Still standing, measured twice by two methods: the dialog is pinned at **x=400..880,
480px, identical at 1280 / 1024 / 768 / 375** — it does not re-centre or reflow.
Cutting the other way: the page **is** horizontally scrollable at 768/375
(`document.scrollWidth` 880), so Confirm may be *reached* by scrolling.

TS20's row has two clauses and they may not both fail — *"nothing is cut off"* looks
violated at rest; *"both buttons can be reached"* may be satisfied. A parallel session
read the same red as a rig artefact. **Charmain decides which reading governs.** TS20
stays Pass, notes-only, no QA-Issue raised.


## 29-08-2026 evening — the E2E segment-1 batch

**NA68001123 is a SPARE, not evidence.** Created at the gate for E2E_TS1 at 18:38, but the
VPN flapped mid-take and the `create-patch-expiry` leg failed (ETIMEDOUT), so the take came in at
**6/8** and its record was never patched. It is Approved, never extended, and still at
**created+90d — OUT of window**, which makes it a genuine dealer-created before-window
record: usable for any row that wants one, one patch from being usable for any row that
does not. E2E_TS1 was re-filmed from the gate on a fresh record rather than patching this
one off-camera, because the patch is a FILMED LEG of segment 1, not a precondition.

The same take produced a **false finding** — `create-bo-detail` reported the correctly
absent Extend button as "a record that was just patched INTO the window ... compare
EAINT-12235". Do not act on it. The record was never patched. Guard added the same
evening; see the memory note on failed preconditions.


### Fixture accounting for the 29-08 evening E2E batch

| record | row | state | verdict |
| --- | --- | --- | --- |
| NA68001123 | E2E_TS1 attempt 1 | Approved, created+90d, never extended | **SPARE** — VPN dropped, patch never ran |
| NA68001124 | E2E_TS1 attempt 2 | **SPENT** — extended 19:38, expiry 2026-09-13 19:03 -> 2026-10-13 19:03 | film truncated by a duplicate launch; R1 gone, never re-filmable |
| NA68001125 | E2E_TS6 | **SPENT** — extended, then pushed to 2026-05-01 | segment 2 filmed 16/17; the miss is a build finding |
| NA68001126 | E2E_TS2 | Approved, expiry 2026-08-29 (expires tonight) | **HELD for tomorrow** — segment 2 after the cron |
| NA68001127 | E2E_TS7 | Approved, expiry 2026-08-29 (expires tonight) | **HELD for tomorrow** — segment 2 after the cron |
| NA68001128 | E2E_TS1 attempt 3 | Approved, created+90d, never extended | **SPARE** — VPN dropped again |
| NA68001129 | E2E_TS1 attempt 4 | **SPENT** — extended, 2026-09-13 -> 2026-10-13 | segment 2 filmed **17/17 clean**; E2E_TS1 is Pass |

**Two usable before-window spares came out of the failures: NA68001123 and NA68001128.**
Both are genuine dealer-created records at created+90d, never extended, one patch from
serving any in-window row and already right for any before-window one.

**Do not start another patching batch without the keepalive running** —
`node scripts/vpn-keepalive.js --minutes 120`. The tunnel dies on a ~15-minute idle
timeout and that is what cost NA68001123 and NA68001128.

---

# LEDGER — 30-08-2026 00:30, the EAINT-12238 retest

`node scripts/retest-12238.js --app-no <rec>` — BEFORE/AFTER on the listing's Last
Updated Date, with the Extend done through the UI in between. **Both runs PASS.**

| record | built | patched to | extended at | Last Updated before -> after | verdict |
|---|---|---|---|---|---|
| NA68001134 | 30-08 00:08 | 2026-09-15 (00:33) | 00:38:35 | 00:33 -> **00:38** | PASS — **SPENT** |
| NA68001135 | 30-08 00:12 | 2026-09-15 (00:41) | 00:42:33 | 00:41 -> **00:42** | PASS — **SPENT** |

Expiry moved 15-09 -> 15-10 on both, and the audit log carries one Extend row per
record at the same minute (99000/BOChar). Evidence in `automation/retest-12238/`
and copied to `Downloads/EAINT-12238 retest evidence/`.

**Still unspent from the overnight build:** NA68001136, NA68001137 (Approved,
before-window at 2026-11-28, one patch from use), plus the earlier spares
NA68001119 / NA68001121 / NA68001122 / NA68001123 / NA68001128.

## The shared `[QA-EVID]` marker crossed two sessions

The first run's BEFORE still came back showing **another session's TS36.2 take**, not
this one's browser. `focus-window.ps1` finds a window by SUBSTRING of its title, and
every rig window carries `[QA-EVID]` — so with a parallel take filming, the pinner
grabs whichever it enumerates first, and the desktop grab is of that window. It also
means this run's pin was briefly above THEIR recording at 00:37-00:38.

`scripts/retest-12238.js` now marks its window `[QA-12238]`, which contains no other
marker and is contained by none. **Any script that pins a window for a desktop grab
needs a marker of its own** while a second session may be filming — see
[[one-take-films-at-a-time]] and [[parallel-sessions-share-this-repo]].

---

## 30-08-2026 NIGHT — eight builds, and how they were spent

Built back to back on **one reCAPTCHA tick** (`scripts/queue-fixture-builds.sh 4`, chained
twice). The gate session had expired after ~4 idle hours, so the FIRST build waited for a
human and the other seven logged `gate: skipped`. That is the whole cost of eight fixtures.

| record | state as left | who has it |
| --- | --- | --- |
| NA68001130 · 131 · 132 | in-window (2026-09-15), unspent, **Pending Assignee**, Create Account verified visible to jasons | held for TS37 · TS40 · E2E_TS10 |
| NA68001133 | **SPENT** — TS52's positive control, accepted 02:29 | — |
| NA68001134 | **SPENT** by the PARALLEL session 12:38am (EAINT-12238 retest) — and its expiry was then reset by us at 02:06. See below. | damaged |
| NA68001135 | **SPENT** by the parallel session 12:42am, expiry 2026-10-15 00:12 — intact | EAINT-12238 |
| NA68001136 | **SPENT** — TS45 control, landed 02:19 from a concurrent run | — |
| NA68001137 | unspent, before-window (2026-11-28) | **the last spare** — one patch from usable |

Also spent tonight: **NA68001120** (TS19), **NA68001122** (TS53 control), **NA68001123**
(TS45 control, pre-fix — refused, so NOT spent, then spent later). **NA68001121** is the
shared endpoint SUBJECT and is still unspent — the endpoint rows never extend their subject.

### Two traps that cost real time, both ours

**`--state opens-today` is not "in window now".** It set expiry to 2026-09-29 **17:11**, and
the window opens at the expiry's OWN TIME OF DAY (Q39) — so at 01:23 six freshly patched
records correctly showed no Extend control and were nearly written up as a defect. Use
`--date 2026-09-15` for a record that must be extendable immediately.

**`set-expiry` silently does nothing without `--yes`.** It prints a reassuring
`Support tool : … (reachable, 33 ms)` line, asks for a typed confirmation the shell cannot
answer, and ends `Nothing submitted.` Six patches evaporated that way. Only opening the
records afterwards caught it — never trust the patch's own output.

**The support session dies every few calls.** `locator.fill: Timeout … #applicationNumber`
is a DEAD SESSION, not a selector bug. `rm -f .auth/support.json` and re-run.

### Ownership is NOT the company name

The NA63/NA64/NA66 records carry other teams' company names and were released for our use.
The signal a record is OURS is the **Application Extended Remarks** row carrying an `EV TS…`
tag written by one of our takes. NA63000990 ("10061 ROC ONE", remark `EV TS10.1.7`) is ours
and is TS01.8's free fixture. NA66001065 (`NAT11829TS04`, EAINT-11829) and NA66001059 are
NOT — leave them.

### Create Account: the precondition nobody had measured

`Create Account` appears at Hardcopy = **Pending Assignee** and at no other value, and the
flow is split across two accounts that cannot see each other's half:

    Hardcopy → "Pending Assignee"     as BOChar (the ASSIGNEE — only they can move it)
              ↓
       Create Account appears          visible ONLY to jasons (the approver)
              ↓
       fill mandatory fields → Registered

`scripts/set-hardcopy.js` drives step 1 and verifies step 2 in a separate approver session.
Do not spend it on a record that is not ours: it is irreversible and R9 then hides the
Extend control for ever.

---

# 30-08-2026 EVENING — the day's fixture ledger

Recorded because five records changed hands in one afternoon and four of them are
now unusable. The pool is EMPTY at the end of this: nothing unspent remains.

## What each record ended as

| Record | Ended | Why it is finished |
|---|---|---|
| NA68001130 | extended, greyed | TS08.4 — spent as designed |
| NA68001131 | extended, greyed | TS26's positive control — spent as designed |
| NA68001137 | **Registered** | TS37 — Create Account committed on camera |
| NA68001141 | extended, greyed | TS55 — spent as designed |
| NA68001142 | extended, greyed, Pending Assignee | **spent for nothing** — see below |
| NA68001143 | **Registered** | registered by hand while diagnosing the Create Account flow |
| NA68001144 | extended, greyed | TS33's first take — spent on a rig fault, see below |
| NA68001145 | extended, greyed | TS33 re-take — spent as designed |
| NA68001146 | **Registered** | deliberate sacrifice: the Create Account dry run |
| NA68001147 | extended, greyed | **spent for nothing** — see below |
| NA68001148 | **Registered** | TS40's first take — spent on a rig fault, see below |
| NA68001149 | **Registered** | TS40 — Create Account committed on camera |

**REGISTERED IS TERMINAL.** R9 removes the Extend control permanently, so a Registered
record serves no row that needs a control — ever. Five of the twelve above are in that
state. Only NA68001139 (extended, Pending Assignee, held for TS01.8) is still useful.

## The three that were spent for nothing, and what each one teaches

**NA68001142 — an untested driver pointed at a live row.** The Create Account driver
was written and wired, and then run for the first time inside a REAL take. It failed on
its first call (`root.locator is not a function` — open() returns `{kind, root}` and the
caller passed the wrapper), fell back to the human hand-back, and the budget lapsed
twice. Every part of that failure was reachable for free: `available()`, `open()`,
`describe()` and `fill()` all run before the irreversible `submit()`.

  The rule this bought: **exercise a driver on a record you can afford to lose BEFORE
  pointing it at a row.** `scripts/probe-create-account-dry.js` stops before submit and
  found four more blockers in twenty minutes.

**NA68001144 and NA68001148 — a leg that navigated away and did not come back.** Both
takes read something on the LISTING and left the page there, so everything downstream
read a search page with no Extend button on it. The rig REFUSED rather than filing a
false R6 regression, which is correct and is still not free: a refusal after the record
has been drawn is a record drawn.

  The rule, now written into both legs: **any leg that navigates away owes the return.**
  It was written into the isolation leg in the afternoon and then not followed in the
  coherence leg written that evening — the same fault twice in one day.

## Builds: four ticks, seven records

| Sitting | Records | For |
|---|---|---|
| 15:46 | NA68001144 + NA68001145 | the TS33 pair — ONE tick for two, shared company |
| 16:53 | NA68001146 + NA68001147 | the Create Account sacrifice, and TS37 |
| 18:19 | NA68001148 | TS40, first attempt |
| 18:42 | NA68001149 | TS40 |

**Queue them.** `bash scripts/queue-fixture-builds.sh N` reuses the warm gate session, so
the second and later builds log `gate: skipped` and run unattended. The 15:46 sitting
proves it: two records, one tick, fourteen minutes.

**A pair sharing one company is now buildable** — `--company "<name>"`, added for TS33.
Only the display name is shared; TIN, licence and SST stay unique per record.
`node scripts/check-shared-company.js` proves it offline, 12/12, before a tick is spent.

## Create Account — the flow, measured

It is TWO steps, not one, and the second was invisible until Charmain filmed it:

1. **Create Account** (approver session, `Pending Assignee` records only) opens a
   CONFIRMATION dialog — "Are you sure you want to proceed for company account
   creation?" — with No / Yes and **zero inputs**.
2. **Yes NAVIGATES** to `/uat4/view/account/company-obs/new.do?id=<uuid>` — *Create New
   Company Account*, a 149-control form with **Save at the TOP**.
3. **Save** -> `Hardcopy & Acc Created = Registered`.

Most of the form arrives pre-filled from the application. Six things are required and
empty, plus two that only surface as alerts:

| Field | id | Note |
|---|---|---|
| Mailing Address | `#address` | not `#mailingAddress` |
| Postcode | `#postCode` | **capital C** |
| Contact Number | `#phone` | |
| State / City / District | `#state` `#city` `#district` | **cascading** — City is filled by State's AJAX, District by City's |
| Attach IC / Passport | `#PrimaryUserFile` | the ONE upload not inherited |
| Main User Login ID | `#primaryUserLoginName` | must be unique on the environment |
| Main User password | `#primaryUserLoginPassword` | `EV_CA_PRIMARY_PASSWORD` |
| Save | `#to-create-company` | `input[type=button]` with a VALUE, not text |

**THE FORM VALIDATES WITH `alert()`, AND PLAYWRIGHT DISMISSES DIALOGS AUTOMATICALLY.**
This is the single most expensive thing on the page. With nothing listening, Save
produced no error text, no POST and no reason — the page was naming every problem to
nobody. `saveCompanyForm()` now captures dialogs, and the last four blockers came out in
four runs. Nothing on the form carries `required` in the markup either, so a generic
"fill the required fields" pass selects zero controls and reports success.

---

## 31-08-2026 — the day's ledger

**Built (two, on ONE reCAPTCHA tick — the gate session is reused: `gate: skipped — the restored
session reaches the form directly`).** `--until <phase>` was added to `build-fixture.js` to stop a
build mid-workflow instead of running through to Approved.

| record | built for | state now |
| --- | --- | --- |
| NA68001156 | TS18.2 `EV_SECOND_APP_NO` | **CONSUMED** — reverted to UCD by the take |
| NA68001158 | TS18.2 `EV_THIRD_APP_NO` | **extension SPENT** as TS53's control; still serves regr-account |

**Spent:** NA68001155 (TS53 control on a run that could not work — see below), NA68001158 (TS53
control, the run that did), NA68001156 (TS18.2's revert).

**Survived read-only:** NA68001121 (TS18.1 subject AND TS53 subject — audit log shows 0 Extend rows
written on both takes), NA68001132 (TS18.2 subject).

**No unspent extend-capable spares remain.** Anything extend-shaped needs a build.

### WHAT A BUILD ACTUALLY LEAVES BEHIND, MEASURED

The phase name is NOT the Application Status, and this cost most of an afternoon:

| stop at | Application Status | what renders |
| --- | --- | --- |
| `submit-approval` | **Pending** | Pre-Application, Application. **No Registration Documents tab at all** |
| `regdocs` | **Approved** | + Registration Documents, **Revert to UCD** (`#to-revert-ucd`), Verified |
| `verify-regdocs` | **Approved** | Revert to UCD gone, Verified gone, uploads locked. **No `#hardcopyStatus`** |
| `record` (complete) | **Approved** | `#hardcopyStatus` + Update, Invoice. Expiry = created + 90d |

So a row needing the hardcopy field needs a COMPLETE build; TS18.2's "a spare still at PENDING"
meant the DOCUMENTS pending UCD, at the `regdocs` stop, where the status reads Approved.

### THE EXTEND WINDOW IS NOT SYMMETRIC

`dates.windowState` is the authority. Expiry **2026-11-29** reads `before-window`, opening
2026-10-29 — the window is **1 month BEFORE expiry to 3 months AFTER**. A fresh build (created +
90 days) is therefore NOT extendable on the day it is built, and its missing Extend button is
correct behaviour, not a defect. NA68001158 had to be patched with
`set-expiry -- --state in-window --yes` before it could serve as an endpoint control.

### TWO HALF-BUILT CHECKPOINTS EXIST

`fx-260831-1108-133` and `fx-260831-1120-135` were both driven to completion, but a bare
`npm run fixture -- --resume` takes the NEWEST half-built checkpoint. **Name the id.**

## 31-08-2026 EVENING — three built for the TS53 / TS40 re-runs

Built back to back on one reCAPTCHA tick (`bash scripts/queue-fixture-builds.sh`); the first run
timed out at the 300-second gate and was resumed from its checkpoint with
`npm run fixture -- --resume fx-260831-1724-137`, so nothing was lost. All three were then patched
`--state in-window --yes` from their born expiry of 2026-11-29.

| record | state after tonight | notes |
| --- | --- | --- |
| **NA68001160** | Approved, expiry 2026-08-31 17:37, **never extended** | TS53 subject. The Probation call is refused, so its one extension is NOT spent — a genuine SPARE. Tonight’s cron flips it to Expired, which keeps it in-window and still extendable. |
| **NA68001161** | **SPENT** — extended by TS53’s positive control (HTTP 200, ACCEPTED, the record CHANGED) | Nothing further to give. |
| **NA68001162** | **Registered** — terminal | TS40. Create Account won the race, so no extension was performed; R9 has removed the control for ever. |

Both takes came back clean on their new records — TS53 15/15 and TS40 16/16, MISSING 0, state
MATCH — with the identical scores to the takes they replace. That was the predicted outcome:
TS53’s two endpoint points are N/A under Charmain’s 31-08 ruling however many times it runs, and
TS40 dropped the same three points because Create Account won the race again.

**The support-tool session died mid-run** and reported `locator.fill: Timeout 30000ms exceeded —
waiting for locator('#applicationNumber')`, which reads like a selector fault and is not one.
Deleting `.auth/support.json` fixed it on the first retry.

**NA68001160 is the only unspent extend-capable record on staging** as of this evening.

## 31-08-2026 NIGHT — FIVE RECORDS STAGED FOR TOMORROW MORNING, and one pairing is wrong

None of these was in this ledger until now. The staging was done out of band between
13:00 and 18:30 and only ever written into `RERUN-01sep.md`. Every line below is read
from `discovery/96-expiry-patches.jsonl` (timestamps there are UTC; MYT = +8) or from
the take's own sidecar — not from the runbook.

| record | expiry now | how it got there | who reads it tomorrow |
| --- | --- | --- | --- |
| **NA68001121** | 2026-09-30 17:11 | patched to expires-today 13:04, then **extended** by E2E_TS9 arm A at 13:08 | E2E_TS9 arm B — the job must read the NEW date and leave it **Approved** |
| **NA68001154** | 2026-08-31 10:17 (elapsed) | extended by E2E_TS4 arm A to 2026-09-30 10:17, then patched back **inside the take** by the lifecycle leg | E2E_TS4 arm B (subject) **and** E2E_TS9 arm B (cron control) — read-only in both |
| **NA68001157** | 2026-08-31 13:22 (elapsed) | extended 13:22, patched back to expires-today at **13:47** | E2E_TS10 arm B — **see the warning below** |
| **NA68001159** | **2026-09-30 14:01** | patched in-window 14:00, extended 14:01, **never patched back** | nothing — and that is the problem |
| **NA66001067** | 2026-08-31 18:00 | patched expires-today at 13:03 | TS21 — the reminder night |

**NA68001154's patch is not in the patch ledger** and its absence means nothing: E2E_TS4
arm A patches through `support.setExpiry` from inside the recorder, which does not write
that file. The tool's own reply is in the take's sidecar. Do not read a missing ledger
line as a missing patch — see the `observed false vs never observed` rule.

### E2E_TS10 — ARM A'S FILM AND ARM A'S STAGED RECORD ARE DIFFERENT RECORDS

`RERUN-01sep.md` says "Arm A is BANKED at 17/18 — do not re-film it" and then hands arm B
`EV_APP_NO=NA68001157`. Those two sentences are about two different records, and neither
one alone can carry the row.

Three arm-A takes exist for 31-08:

| take | score | what it reached |
| --- | --- | --- |
| NA68001153 | 16/19 | rig fault — the control was read on `/obs/admin/enquiry`, not the application route |
| **NA68001157** | **16/18** | **never reached Registered** — `create-account` timed out at Pending Assignee after 481s; `create-account` and `control-gone` both REFUSED |
| **NA68001159** | **17/18** | reached **Registered**, `control-gone` filmed (`present=false inDom=false`); only `greyed-after` missing, and that is the known ordering fault |

So the banked 17/18 is **NA68001159**. But NA68001159 was never patched back after its
extension — its expiry is **2026-09-30 14:01**, a month out. Tonight's cron will not touch
it because the date has not arrived, so an arm B pointed there proves nothing.

**How that was established, because the first attempt got it right for the wrong reason.**
The first evidence offered was that NA68001159 has no post-extension row in
`96-expiry-patches.jsonl` — which proves nothing, since an in-take patch never reaches that
file (NA68001154's does not either, four paragraphs up). The real evidence is the take's own
checklist: **it has no `lifecycle` point at all.** Both E2E_TS10 arm-A takes ran as the plain
`extend` shape, ceiling 18, with the eighteen points ending at `create-account` and
`control-gone`. The staging patch lives in the lifecycle leg, and that leg was never on the
checklist, so nothing in the take could have staged the record. Compare E2E_TS4 arm A, whose
17-point checklist does carry `lifecycle` and whose sidecar quotes the tool's reply.

That distinction matters beyond this row: **the ledger's silence is never evidence a patch
did not happen.** Ask the checklist whether a leg existed, then the sidecar whether it ran.

And NA68001157, which IS staged, has an arm-A film that never reached Registered — the
one state the row's whole claim ("extended, THEN Registered, THEN the extended expiry
passes") is built on.

**The runbook's cron table also calls NA68001157 "Registered". Nothing on disk shows that.**
Its only take ended at Pending Assignee, and no later take or hand-drive is recorded. It
may well have been driven by hand after 13:41 — but that is unwitnessed, and a
precondition nobody measured is exactly what grades the fixture.

**This is Charmain's call, not a fix to make overnight.** The three options, with what
each costs:

1. **Drive NA68001159 to a staged state** — patch its extended expiry back to expires-today.
   Too late for tonight's cron; it makes the row filmable the morning after next, on the
   record that already holds the good arm-A film. Costs a day, spends nothing.
2. **Confirm NA68001157 really is Registered, and re-shoot its arm A.** Keeps tomorrow's
   date, but re-films an arm and needs the record to still have its transition.
3. **Point arm B at NA68001157 as written.** Cheapest, and the row then spans two records —
   the history it claims never happened to either one.

Nothing here is urgent tonight: no patch made now can change what the cron does to these
records, because the cron reads dates that are already set.

### NA68001121'S OLDER ENTRIES IN THIS FILE ARE NOW STALE

Line ~1237 has it as "Approved, before-window (2026-11-27) | untouched" and the 31-08 day
ledger lists it under **"Survived read-only"** with "audit log shows 0 Extend rows written
on both takes". Both were true when written and are not now: **E2E_TS9 arm A extended it at
13:08 today**, 18/18. It is spent, and it is tomorrow's E2E_TS9 subject. Do not point
anything else at it.

### STILL TRUE: NA68001160 is the only unspent extend-capable record

The pre-deploy family went tonight — NA68001163, NA67001075 and NA68001164 are all spent
on their 19:00 takes. None of the five staged records above is a spare: four are spent and
NA68001159 is spent as well as mis-staged.

## 01-09-2026 MORNING — FOUR TAKES, NOTHING SPENT

All four were gating-swept: no extension, no patch, no build, no payment. The fixture
position is exactly as it was at the end of 31-08.

| record | used as | still |
| --- | --- | --- |
| `NA68001154` | E2E_TS4 arm B subject **and** E2E_TS9 arm B cron control | spent, now Expired |
| `NA68001121` | E2E_TS9 arm B subject | spent, stayed Approved (the claim) |
| `NA68001157` | E2E_TS10 arm B subject | spent, Registered, untouched by the cron |
| `NA66001067` | TS21 subject | never extended; Registered, untouched |
| `NA62000939` | TS21 control | Expired, read-only |

**`NA68001154` did two jobs in one night and both were read-only** - it is E2E_TS4 arm B's
own subject and E2E_TS9 arm B's cron control. That is only sound because neither take
clicks anything on it: one reads that it expired on the EXTENDED date, the other reads
merely that it expired at all.

**Still true: `NA68001160` is the only unspent extend-capable record.** Nothing this
morning changed that, and `NA68001159` remains spent and mis-staged (expiry 2026-09-30,
so no cron will touch it).
