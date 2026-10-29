# Code tour — what to read, in what order

Playwright + plain Node, CommonJS. This is the **working rig, copied as-is**, not a
cleaned-up package: it runs against staging and it needs the shared credential store.
Read it to see how each screen was actually driven.

Every file below is heavily commented, and the comments carry the *reasoning* —
including, in several places, the wrong version and why it was wrong. That is the point
of them.

---

## Read these four, in this order

| File | Lines | What it holds |
| --- | --- | --- |
| **`scripts/build-fixture.js`** | ~600 | **The orchestrator.** The 11 phases, the CLI, the resume logic, and the route guard. Start here — its header comment is a summary of the whole flow. |
| **`src/preapp.js`** | 1437 | **The entire dealer journey.** The pre-application form, the review page, payment-method selection, the FPX popup, the Fiuu simulator, the Application Form's three steps, the file uploads, the registration documents, and the registration fee. The single biggest file and the most reusable. |
| **`src/onboarding.js`** | 531 | **The BackOffice half.** Approve pre-application, read the dealer link, assign, set UCD Group + Submit for Approval, approve the application, verify registration documents, read the finished record. |
| **`src/listing.js`** | 583 | **The UCD Application Listing.** Column map, filter map, the AJAX search that produced a false defect report, pagination, row identification, cell reads. Read `submitSearch` even if you use nothing else. |

---

## Everything else, by job

### The flow

| File | Job |
| --- | --- |
| `src/creation.js` | The E2E creation flow as **data** — the `PHASES` array and the `LEGS` array with one entry per phase. If you want the flow as a machine-readable structure rather than as code, read the top 250 lines of this file. |
| `src/application.js` | The BackOffice application page: the three tabs, the right sidebar reader, the 404 handling. |
| `src/createAccount.js` | The Create Account button and its confirmation dialog. |
| `src/companyAccount.js` | The Create New Company Account form — the 149-control page, the cascading state/city/district, and the `alert()` reader. |
| `src/lifecycle.js` | Per-scenario claims about what state a record should be in. |

### Plumbing

| File | Job |
| --- | --- |
| `src/accounts.js` | **Portable credential registry** — any `<KEY>_USER` / `<KEY>_PASS` pair in the environment becomes a runnable account, so adding a person is two lines of config and no code. Copy this file into any eAuto project unchanged. |
| `src/login.js` | Log in, log out, and veil the screen while credentials are typed (so a recording never captures a password). |
| `src/env.js` | Base URL, instance, **every screen URL in one place**, and the approver/assignee role mapping. Read this file to get the URL map in 25 lines. |
| `src/obs.js` | The `/obs` session handoff. **Direct navigation to `/obs` returns 39 bytes of blank HTML until one menu click has happened** — this module is the reason that is not a mystery. |
| `src/assist.js` | The **assisted-first-run** mechanism: try a list of locator hints in order, record which one matched, and on a miss dump the page and wait for a human to do that one field. Then fold the learned locators back into the maps. This is how the flow was mapped in the first place. |
| `src/fixture.js` | Generates a unique dealer identity per run (company name, BRN, TIN, stamped emails) and manages the phase checkpoints. |

### Tooling around the flow

| File | Job |
| --- | --- |
| `src/support.js` | The internal expiry-reset tool — a 3-step wizard behind its own sign-in, on the VPN. Expiry-extension specific, but a good model for driving an internal admin tool. |
| `src/dates.js` | Date arithmetic and window states. |
| `src/exportSheet.js` | Reads the listing's Excel export. Note `cell()` **throws** rather than returning `undefined` for a missing column — see trap 12 in `05-known-traps.md`. |
| `src/auditLog.js` | The UCD Application Audit Log. |
| `src/boRoles.js` | Switches a BackOffice role on a **shared** account and restores it in a `finally`. |
| `src/mailtrap.js` | Reads the mail catcher, by browser or by token. |
| `src/provenance.js` | Picks records by **provenance** (created before a deploy) rather than by date. |
| `src/archive.js` | Moves a previous dump aside under the timestamp it describes, so a fixed filename cannot destroy an irreplaceable capture. |
| `src/vpn.js` | VPN reachability probing. |

---

## Scripts worth knowing

```bash
npm run fixture                          # build one, headed, assisted
npm run fixture -- --dry-run             # show the generated dealer and the phase plan
npm run fixture -- --resume <label>      # carry on with a named half-built one
npm run fixture -- --until submit-approval   # park it at an intermediate state

npm run check:gate                       # is the saved reCAPTCHA session still good?
npm run check:login                      # can we log in at all?
npm run probe:types                      # all five business types, step one only, no payment
npm run probe:ssm                        # what checkSSM.do actually answers
npm run discover                         # dump the screens to ./discovery
npm run dump                             # dump one screen
```

Create-Account / Registered:

```bash
node scripts/probe-create-account-states.js               # where does the button render? reads only
node scripts/probe-create-account-dry.js                  # fill, stop before the submit
node scripts/probe-company-form-fields.js <NA...> --try-save   # ask the form if it is satisfied, create nothing
node scripts/probe-create-account-commit.js <NA...> --yes-i-mean-it   # irreversible
node scripts/set-hardcopy.js                              # move Hardcopy & Acc Created
```

The full script list is in `package.json` (about 130 entries — most are
expiry-extension specific).

---

## Configuration

`.env.example` is 16KB of **documented** configuration — every key has a comment
saying what it is for and what happens when it is blank. It is the best single
reference for what this rig can be pointed at.

The keys that matter for the flow:

```
EAUTO_BASE=https://staging.eauto.my
EAUTO_INSTANCE=uat4
EV_APPROVER=ops_jasons
EV_ASSIGNEE=hubadmin_bochar
EV_PAY_WAIT_MS=              # default 30 min; do not shorten below ~10
EV_NO_PROMPT=                # 1 = a locator miss fails loudly instead of waiting
EV_OWNER_TAG=CHARMAIN        # tags every generated company name
```

**Passwords are not in `.env` and never were.** They live in
`~/.claude/secrets/eauto.env` and are read by `src/accounts.js`. The Fiuu simulator
pair (`FIUU_SIM_USER` / `FIUU_SIM_PASS`) is there too, and is typed **only** on
`bank-simulator.fiuu.com` — the host lock is in `src/preapp.js`.

---

## Reference data

| File | What |
| --- | --- |
| `reference-data/locators-learned.json` | **The confirmed selector map.** Every entry records the hint list that was tried, **which hint actually matched**, and when. This is measured, not guessed — it is the most directly reusable artefact in the pack. |
| `reference-data/example-fixture-checkpoint.json` | A complete real build: all 11 phases with timestamps, the generated dealer profile, the dealer link, and the resulting record (`NA68001162`, Approved, created `2026-08-31 17:45`, expiry `2026-11-29 17:45`, `daysFromCreated: 90`). Four minutes wall-clock, gate to record. |

---

## The one test spec included

`tests/91-e2e-creation.spec.js` — the creation half of an end-to-end run, as a
Playwright spec with a video recorder attached. It is a separate spec and a separate
project deliberately, so that experiments on it could not endanger the working
recorder.

The other ~25 specs in the project are all about the expiry-extension feature and are
not included.
