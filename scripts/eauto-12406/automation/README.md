# eAuto automation

The automation every CR in `../cr/` runs on: page objects and flows for each UCD
module, BackOffice and AATF, eSim, the MyKad emulator, real Firefox 36, and the
per-TS evidence gate. New here: `../ONBOARDING.md` first.

It follows `eauto-qa-automation` conventions (`github.com/modefair/eauto-qa-automation`,
the team repo) so it can merge into that repo without a rewrite.

## What this adds that the team repo does not have

| | |
|---|---|
| **STMS — all six steps** | Seller scan → vehicle → buyer scan → JPJ check → payment → transfer |
| **eSerahan — all six steps** | Add-ons, both endings, and the insurance divert |
| **eSim client** | REST, generic over all 24 simulator entities. The team repo has nothing for eSim |
| **JPJ error-code map** | 21 P1–P4 codes from the team's checklist, each on a collision-free prefix |
| **RHB error-code map** | 19 P1–P4 codes. RHB is the gateway for *every* module |
| **Insurance** | Mapped: free-quote entry, and the three arrival routes told apart |
| **Test-data generator** | Vehicle counter, and the 3-use cap on a mobile or email |

## What it takes FROM the team repo

Everything structural, so nothing has to be re-shaped at merge time:

| Convention | Where |
|---|---|
| Path aliases `@fixtures` `@pages/*` `@auth/*` `@data/*` `@config/*` | `tsconfig.json` |
| `BasePage` + `requireVisible()` that fails loudly | `src/pages/base.page.ts` |
| `test.extend` fixtures; specs import from `@fixtures`, never `@playwright/test` | `src/fixtures/test.ts` |
| Personas — `ucdSession('ucdE2E')`, credentials only in env keys | `config/personas.ts` |
| `BASE_URL` + `BASE_PATH` composed; **no hostname committed** | `config/environments.ts`, `env/` |
| `@step("…")` on page methods | `src/fixtures/step.ts` |
| `tests/<env>/<slice>/<screen>/<slice>-<screen>.<kind>.spec.ts` | `tests/` |
| `e2e` is always `@destructive` and staging-only; `production` greps it out | `playwright.config.ts` |
| `tests/_explore/` for tools wearing a spec's clothes | `tests/_explore/` |
| Real Chrome, not bundled Chromium | `playwright.config.ts` |

One alias is new: **`@flows/*`**. A multi-screen journey helper has no home in
the team repo yet, because it has no e2e specs yet.

## Setup

```bash
npm ci
npx playwright install chromium
cp env/env-default env/.staging.env-local   # then fill it in
```

`env/.*.env-local` is gitignored and is the only place a credential lives.
One `env/.staging.env-local` serves every staging instance; choose the branch
with `INSTANCE=uat1` (or `TEST_ENV=uat1`), e.g. `INSTANCE=preprod1 npx playwright test …`.
No per-instance file is needed (`config/load-env.ts`).

The **MyKad Reader Emulator** must be running before any spec that scans a card.
**eSim needs the company VPN** — but only for *seeding*. A spec that merely reads
a canned response needs nothing, because the vehicle prefix already selects it.

## Running

```bash
npm run test:staging                      # the e2e journeys
npm run test:e2e -- --grep @P1            # one priority band
npm run probe                             # the exploration tools, no ledger
npm run test:list

npx tsx scripts/seed-jpj-codes.ts         # once — 21 JPJ prefixes
npx tsx scripts/seed-rhb-codes.ts         # once — 19 RHB prefixes, both legs
npx tsx scripts/seed-rhb-codes.ts --check # report drift, change nothing
```

`retries` is 0 and `workers` is 1, both on purpose — see below.

## A CR run (since 16.10.2026)

One way for every CR test, built from what EAINT-12022 taught (`cr/README.md` has the whole flow):

| Piece | Where | What it guarantees |
|---|---|---|
| `ts` fixture | `src/fixtures/ts-run.ts` | one tab and one continuous video per TS; portals switched on screen in that tab (`ts.portal`); new-tab links and downloads shown in it; a screenshot per expected point (`ts.prove`) |
| the gate | same file | the moment a TS ends: VALID → `cr/<T>/05-evidence/<TS>/`, else `05-evidence/FAILED/<TS>/<when>_<why>/` with `reason.txt` |
| eSim steps | `src/fixtures/esim-step.ts` | `ts.esim.lkmBalance / eligibility / rhb / set`: any value, on our own prefixes only, shown in the video, put back at the end |
| run script | `scripts/cr-run.mjs` | lane lock, VPN watchdog only while running, video always on, one automatic re-run of environment failures, a verdict per TS |
| projects | `playwright.config.ts` | `cr` = gated `*.cr.spec.ts` only; `cr-tools` = a ticket's one-off `*.spec.ts` (no gate) |
| self-test | `cr/_selftest/` | `node scripts/cr-run.mjs --ticket _selftest --instance preprod1 --lane 2 --no-vpn --ts ST_TS1,ST_TS2,ST_TS3` must give VALID, DEFECT, EVIDENCE |
| probe run | `scripts/probe-run.mjs` | one probe (`cr/<T>/03-spec/probes*/`, project `cr-tools`) on a lane: the same lane lock, VPN watchdog while it runs (`PROBE_VPN=0` for a read-only UCD / BO look), video on; a `*.py` probe runs with `FF36_PY` |

Shared, reusable code stays here (flows, pages, fixtures); everything that belongs to one
ticket lives in `cr/<TICKET>/` and is never imported by another ticket.

Checks a CR spec reuses (moved out of EAINT-12253 / 12626 / 12650, 27.10.2026; a ticket's `_checks.ts`
re-exports them under its own names):

| What | Where |
|---|---|
| Firefox 36: run a plan keeping the points read before a bridge failure (`runFf36`, `rethrow`), prove from a step (`proveFf`, `proveFfAs`), the Browser Reminder as read (`reminderComplete`, `stateWords`, `proveAfterContinueAndF5`, `REMINDER_SRD`), the screen an APT payment lands on (`aptLandingOf`, `isStep6`), the AZFARAZO sub user (`subUcdUser`) | `src/ff36/checks.ts` |
| No Browser Reminder in Chrome / a current Firefox: a watcher from the start of the TS plus a read per screen (`NoReminder`, `at()` for a screen the flow passes through) | `src/fixtures/no-reminder.ts` |
| eSim RHB OK / IF around a step, under the machine-wide lock, logged and put back (`withRhbLocked`, `rhbAround`, `withRhbOkLogged`) | `src/fixtures/esim-switch.ts` |
| Data one TS hands to a later one, also from an earlier run's VALID TS (`handOff`, `takeOver`, `takeOverFromValidRun`) | `src/fixtures/ts-handoff.ts` |
| APT set-up: Approved STMS, BO Manual APT Trigger, the listing until Payment OK + Approved, Payment Details counted by RHB reference, the IM eSim guard | `src/fixtures/apt-steps.ts` |
| Probe screen dump (controls, dialogs, step headings) for learning a screen | `src/fixtures/page-dump.ts` |

## The two prefix maps

eSim picks its canned response from the **start of the vehicle number**, so a
test chooses its outcome by choosing a prefix. No record is edited, so runs
never collide.

| Map | Namespace | Entity | Codes |
|---|---|---|---|
| JPJ enquiry | `Y*` | `stms-enquiry-resp` | 21 (P1–P4) |
| RHB payment | `Z*` | `rhb-transfer-resp` **and** `stms-enquiry-resp` | 19 (P1–P4) |

**The RHB map seeds both entities.** eSim keys JPJ and RHB on the same prefix in
different tables, so a vehicle seeded only for RHB never gets past the JPJ check
at step 4 and its payment code is never exercised at all.

### The one case prefixes cannot express

eSerahan's insurance divert needs the **same vehicle** to answer `GLB000000I` at
step 4 and `VEL000069E` at step 5. That is a mid-run edit of a shared record —
unavoidable, and the probe restores the value in a `finally`.

### Prefixes that must not be written

`TT WZ AA SA MC QS WT PC` in `rhb-transfer-resp` — other people's runs depend on
them (Jin Siang Boo, 17 Sep 2026). `EsimClient` **refuses** these, matching in
both directions because eSim matches by starts-with.

**Prefix ownership is per entity.** `VV` in `estm-enquiry-resp` is Azfar's; `VV`
in `stms-enquiry-resp` is Mei Jia's. Checking one table and assuming proves
nothing.

## Three traps, all now encoded

| Trap | Truth |
|---|---|
| **"Update Required — Dermalog Biometric Device"** | Not a version problem — it is the *connection-failed* state. Chrome blocks an HTTPS page from reaching `localhost`, hence `--disable-features=LocalNetworkAccessChecks` |
| **An open port 7878 means the emulator is up** | **No.** The real `DermalogMyBioIDService` takes the same port. It demands `wsPublicKey`, rejects `/IDCard/<channel>`, and goes silent without hardware. Readiness is a correct `GETCARD` reply, never an open socket |
| **Waiting for the next screen to decide an outcome** | A failed JPJ enquiry shows `Resubmit`, not "Make Payment". A failed RHB payment **does not navigate at all** — it raises a dialog. Both turn a correct refusal into a timeout |

Plus one about the card itself: **insert it AFTER the page asks to read.** The
page sends `INIT` when its socket opens, and `INIT` clears channel card state,
so an early insert is wiped and the page waits forever.

## Parallel runs: one lane each (since 21.10.2026)

The portal's `mykad-websocket-v2.js` hardcodes `ws://localhost:7878/IDCard`
(2026-09-15), so the fixture relays each page's socket to its lane's own
emulator channel `/IDCard/lane<N>` (`src/fixtures/mykad.ts`). A lane is one UCD
user with its own lock; `scripts/cr-run.mjs --lane auto` lets the broker pick
free lanes by need (single / ucd2ucd / main+sub). Roster: `env/lanes.json`, or
your own `env/lanes.local.json` (`ONBOARDING.md`). Details: `env/lanes.md`.

eSim responses are still global per prefix, so parallel runs use different
prefixes, and a mid-run eSim switch takes the eSim switch lock.

## Status — everything here is PRE-LEDGER

No spec has been through `./bin/review s`, and no assertion block has been
signed. Every header says `@status draft` and no test title carries a case id,
because there is no ledger for one to come from.

**So none of this may gate sign-off.** It proves the journeys run and that the
error codes still behave. Turning that into coverage is a ledger and a signed
plan, in the team repo, through its gates.

What is proved, and what is not:

| Proved | Not proved |
|---|---|
| Each JPJ code fails and blocks payment | That its *message* matches the checklist wording |
| Each RHB code stops the payment and says something | Same — the wording is not asserted |
| The journeys complete end to end | That any screen is *correct* |

## Knowledge

The written rules and module maps live one level up in `../knowledge/`. Their
destination in the team repo is `docs/modules/<slice>/<module>/`,
`docs/runbooks/` and `docs/lessons.md`.
