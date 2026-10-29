# EAINT-11982 automation

Playwright harness for the BackOffice **Extend application expiry** feature.
Credentials come from the shared store (`~/.claude/secrets/eauto.env`) via
`src/accounts.js` — nothing is re-entered here and no password is ever written
to this folder.

**Requirements, since 26-08-2026:** the ticket has its own SRD —
`../EAINT-11982_SRD_v1.0_20260826.pdf`, eleven numbered requirements
(`EAINT-11982-REQ-001…011`), text extraction in `../srd-v1.0-text.txt`. The
parent `../EAINT-11868_SRD_v1.4_20260826.pdf` restates the same feature in its
§2.2.5. Cite a REQ ID, not a section number. Two of the eleven disagree with
what this harness has measured — **C7** (does the button vanish or grey out
after an extension?) and **C8** (does the window really open only 30 days
before expiry?) — so read the "Where the SRD and the build disagree" section
below before treating either as an expected result.

## Setup

```bash
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and fill in the fixture application numbers.
Leave every `_PASS` blank — they belong in the shared store, not here.

Confirm the logins still work before anything else:

```bash
npm run check:login ops_jasons hubadmin_bochar
```

A stale password is indistinguishable from a permission defect once a suite is
running, so this check comes first every time.

## Step one: capture ground truth

**Done, 25-08-2026 — the modal has been opened.** A discover run against
NA68001099 read the live dialog and the page's own JavaScript, so the locators
in `src/application.js` are ground truth rather than Figma guesses. What it
settled:

| | |
| --- | --- |
| Button | `#extend-application-btn` (`.extend-btn`) |
| Dialog | jQuery UI — Cancel/Confirm sit in the `.ui-dialog` **wrapper's** buttonpane, not inside `#extend-dialog` |
| Remark | `textarea#extend-remarks`, `maxlength 3000`, no placeholder, **no `required`** — the mandatory rule is client-side `.trim()` JS that renders `#extend-remarks-error` and sends nothing |
| Request | `POST {contextPath}admin/form/extend`, FormData `{ uuid, remarks }` |
| Success | `location.reload()` |
| Failure | modal closes, custom **"Unable to proceed"** dialog carries the server message |
| Esc | `closeOnEscape: false` — dead by design |
| × | **hidden**, same as Figma. jQuery UI emits `.ui-dialog-titlebar-close` but the dialog ships it as `style="display: none;"`. The 25-08 capture listed it as present because it read button *titles* out of the DOM without a visibility check — withdrawn 26-08 (vault C6) |

Re-run it whenever the build changes:

```bash
npm run discover -- --app-no NA68001099
```

It logs in, walks the listing, the Application tab and the Registration
Documents tab, and writes an ARIA snapshot, the text, the HTML and a screenshot
of each into `discovery/`. Then it **opens the Extend modal and dumps its real
fields to `discovery/05-extend-modal.json` without confirming** — opening costs
nothing, confirming would spend the application's one and only extension (R1).

### Probing one awkward record

```bash
npm run probe:rejected                    # the Q25 record, default uuid
Q25_UUID=<uuid> npm run probe:rejected    # any other record
npm run probe:rejected -- --headed        # watch it
```

Read-only. Navigates with **no wait condition at all**, then polls what the
document actually becomes and prints every request still in flight when it
stops. Written for Q25 and kept because it is the only tool here that can tell
"the page is broken" apart from "the page is fine and the harness is waiting for
an event that never fires". Writes `discovery/50-rejected-detail.{png,html,log.txt}`.

### Proving a filter actually filters, and counting the whole population

```bash
npm run probe:status                       # every Application Status, one filtered search each
npm run probe:expired                      # all 289 Expired records, bucketed around the 90-day window
npm run probe:expired -- --status Approved # same census for any status
```

Both are read-only and both exist because of mistakes worth not repeating.

`probe:status` sets the Application Status dropdown to each value in turn and
prints what the dropdown holds AFTER the search, the server's record count, and
the status of every row that came back. It was written to settle whether the
listing filter was broken — the first filtered sweep returned rows of the wrong
status — and it showed the results lagging the query by exactly one, which is a
harness race, not a filter defect. Keep it: "the filter is broken" is a claim
worth one minute of proof before it reaches a ticket.

`probe:expired` walks the **whole** filtered population through the listing's
own AJAX endpoint (`pageNo` 1..totalPages, same session, still a GET) and
reports days past expiry, whether each row could host the button at all, and the
nearest candidates on each side of the 90-day boundary. On 26-08-2026 it found
289 Expired applications where a page-one read had found 15 — including the
day-90 and day-91 records TS08 had been waiting on dev to fabricate.

### Comparing the two staging front doors

```bash
npm run compare:instances                     # uat4 then eauto
npm run compare:instances -- --headed
EV_INSTANCES=uat4,eauto EV_APP_NO=NA68001099 npm run compare:instances
```

Read-only. Logs into each instance in turn, walks *its own* Onboarding menu,
opens the application's registration-documents page and reports the sidebar
labels, the date strings verbatim, and whether Extend renders.

**What it found on 26-08-2026, and what it means for every later "is this
existing behaviour?" question:** both front doors land on the SAME url for the
same record — `/obs/admin/form/edit-registration-doc/<uuid>` — with Extend
present and enabled on both. `/obs` has **no instance segment**: the onboarding
app is deployed once on staging and `/uat4` and `/eauto` are two doors into it.
**staging/eauto is not a pre-CR reference.** Answer those questions from the SRD,
from Figma history, or from production instead.

## Step two: build a fixture

> **EVERY TRANSACTION IS CREATED FROM THE PRE-APPLICATION FORM.** Charmain,
> 27-08-2026: *"make sure all transaction created from preapplication, i dont
> want the manual application way to create the trx, we didnt cover that part in
> this ticket."* There is one route and no flag to change it — `npm run fixture`
> starts at `/obs/preOnb/recaptcha` and walks the dealer's real journey.
> BackOffice's **UCD New Application** panel is closed: `--route backoffice`
> exits with the reason, `npm run genlink` refuses, and
> `src/onboarding.js generateApplicationLink` throws unless
> `EV_ALLOW_BO_NEW_APPLICATION=1` is set deliberately — whose one sanctioned use
> is re-creating the R19 stub (TS51) if NA68001100 is lost. See vault **R22**.
>
> **What this gives up, and why it costs nothing here.** The manual route was the
> only one that could produce an **SSM** business type (the public form's
> `checkSSM.do` rejects every generated BRN and falls back to Business Trading).
> Business type has no bearing on the expiry date or on Extend, so no scenario in
> the register loses coverage. It was also cheaper — no reCAPTCHA, one payment
> instead of two — and it never worked end to end regardless: it stalls at
> `approve-app` because the assignee's edit page has no "Submit for Approval"
> button, and what it leaves behind is an R19 stub with no expiry date at all.

Every positive Extend case needs its own application, because the extension is
once-only (R1) — and getting one to Approved with documents verified is roughly
12 minutes of hands-on clicking. That, not the assertions, is what makes the E2E
cases expensive.

```bash
npm run fixture              # new dealer, headed, assisted
npm run fixture -- --dry-run # show the generated dealer and the phase plan
npm run fixture -- --resume  # carry on with the newest half-built one
```

It walks the whole chain — Pre-Application Form, RM 108.00 payment, BackOffice
approval, the dealer Application Form, Submit for Approval, Approve,
registration documents, Verified, registration fee — and stops with the
Application No and the expiry date printed, ready to paste into `.env`.

**It pauses at exactly two points, and neither is a locator problem:**

- **the reCAPTCHA** — you tick the box in the open browser; the script watches
  the page, carries on by itself, and saves the session to `.auth/`. ~~**Measured
  24-08-2026: that session is reusable.**~~ **Re-measured 26-08-2026 evening: it
  is NOT.** `npm run check:gate` is bounced back to the gate, so the tick is
  **once per fixture**, not once per session — and since the pre-application flow
  is now the only route, that tick is the whole fixture cost. See the gate entry
  under "What the first real run taught us".
- **the FPX gateway** — twice, for the pre-application fee and the registration
  fee. The builder drives the gateway window itself: it follows the
  `/obs/preOnb/landing/<uuid>/<bank>` redirect, dumps each screen, and clicks the
  approve control. It stops at exactly one thing — **a password field**.

  FPX B2C / Maybank2u lands on Fiuu's sandbox at
  `bank-simulator.fiuu.com/MB2U0227/login`, which wants a username and password
  and does not print test credentials on the page. Fill `FIUU_SIM_USER` /
  `FIUU_SIM_PASS` in the shared store (`~/.claude/secrets/eauto.env`) and the
  builder logs in itself — **host-locked to `bank-simulator.fiuu.com`**; any
  other login form pauses for a human regardless. Left blank, the login stays a
  manual step and the pause message says which key to fill. Either way the
  screens after the login (TAC, status Approved, Pay Now) are driven
  automatically.

  The wait is 30 minutes by default (`EV_PAY_WAIT_MS`). It was 10, which is
  shorter than the time it takes a person to walk over and log in — and timing
  out there costs the whole pre-application, because the form must be refilled
  from scratch.

**The build stops one step short of Create Account, on purpose.** Hardcopy Doc =
Registered removes the Extend button entirely (R9), so creating the company
account would destroy the fixture it just built. It also never clicks Extend —
building a fixture and spending its one extension are different acts, and the
second belongs to a test.

### The first run is assisted, and that is the point

Everything past the gate is unobserved. `preapp-flow.har` is 60 entries of
reCAPTCHA challenge traffic and not one `/obs/preOnb/` form request, so the
23-08-2026 recording never got through — which means the Pre-Application Form's
field names, page count and button labels are known only from the SRD's prose.

The field maps in `src/preapp.js` turn that prose into hint lists, and every
field goes through `src/assist.js`, which tries them in order and:

- records which hint actually matched, into `discovery/locators-learned.json`;
- on a miss, dumps the page (aria + text + html + png) to `discovery/` and waits
  for you to do that one field by hand, logging it to
  `discovery/assisted-steps.log`.

Fold `locators-learned.json` back into the maps after the first run and the
build is unattended between the two gates. Set `EV_NO_PROMPT=1` and a miss fails
loudly instead of waiting — that is the mode to use once the maps are real.

Phases are checkpointed to `fixtures/<label>.json`, so a build that breaks at
step seven resumes instead of starting another dealer:

```bash
npm run fixture -- --resume fx-260824-1130 --from regdocs
npm run fixture -- --resume fx-260824-1130 --only record
```

Phase names, in order: `gate`, `preapp`, `approve-preapp`, `appform`, `assign`,
`submit-approval`, `approve-app`, `regdocs`, `verify-regdocs`, `regfee`,
`record`.

`assign` is the approver handing the record to the assignee via the sidebar
Assignee dropdown + Save — the 23-08-2026 video shows it as its own act before
the assignee opens the record. The dropdown holds display names
("CHARMAIN EA CHIANG chg"), so override with `--assignee-name` or
`EV_ASSIGNEE_NAME` if the assignee login changes. The full video-verified flow,
screen by screen, is in `FLOW.md`.

The generated dealer is unique per run by construction — company name, BRN, TIN
and the `+stamp` e-mail all carry the same run stamp, because a duplicate BRN
fails at the *end* of the form, after the reCAPTCHA has already been paid for by
hand. Correct any generated value for good in `fixtures/profile.json`.

**Every transaction this rig creates is tagged `CHARMAIN`** — the company name
is `CHARMAIN QA11982 <yymmdd-hhmm>-<seq> <TYPE SUFFIX>`, e.g.
`CHARMAIN QA11982 260826-1545-920 ENTERPRISE`. Charmain, 26-08-2026: the rows
have to be hers at a glance in a listing the rest of the team is also writing
to, so typing `charmain` into the listing's Company Name filter returns them and
nothing else. Unique **and** tagged are both enforced by
`fixture.brandBusinessName()`, which runs *after* `fixtures/profile.json` and
`--overrides` are merged — so a pinned name (the SSM path needs a real
company's) keeps its own words and still gets the tag prefixed and the run stamp
appended. Override the tag itself with `EV_OWNER_TAG=<word>` if someone else
runs the rig. Fixtures built before 26-08 keep their old `QA11982 MOTORS …`
names — those are live records on staging and renaming the checkpoint would only
break the lookups that find them.

## Business types: 2 of 5 are automatable

```bash
npm run probe:types            # all five, step one only, no payment
npm run probe:types -- --type LLP
```

Measured 24-08-2026:

| Business type | Verdict | Why |
| --- | --- | --- |
| Sdn Bhd / Bhd | FALLBACK | needs a real BRN |
| Sole Proprietorship / Partnership | FALLBACK | needs a real BRN |
| LLP | FALLBACK | needs a real BRN |
| Business Trading (Sabah) | REVIEW | drivable with generated data |
| Business Trading (Sarawak) | REVIEW | drivable with generated data |

The three SSM types send the BRN to `/obs/preOnb/checkSSM.do`. Staging answered
`200 {"registered":false,...,"unexpectedResult":null}` for a well-formed
generated number — a healthy live lookup that simply does not know it. The page
then calls `fallbackToBusinessTrading()` and returns, so the form switches path
instead of advancing. **No generated BRN can ever pass**, whatever its shape,
which makes this a data question for dev/BA — does the staging SSM connector have
a test dataset? — and not something the harness can work around.

For EAINT-11982 this is not blocking: the expiry is created + 90 days regardless
of business type, so the two trading types are sufficient fixtures for every
Extend case. It matters only if the SSM path itself is ever what is under test.

Two smaller findings from the same probe, both worth a line in the ticket:

- The TIN warning fires even on a well-formed TIN, because the TIN is validated
  against the SSM record rather than against a format. It is non-blocking by
  design — the page's own copy says `Click "Next" to proceed` — and the builder
  presses Next twice, as instructed.
- On fallback the page selected **Business Trading (Sabah)** for a company with
  no connection to Sabah. It takes the first non-SSM radio, which is arbitrary
  rather than incorrect.

Each run leaves one unpaid draft pre-application per type. Drafts never gain an
expiry date, so they cannot be mistaken for fixtures.

### What the form really validates

Less than the SRD's prose implies, so the generated formats buy credibility, not
passage:

- New BRN / Old BRN / Business Trading License No — minimum **4** characters
- TIN — minimum **9**, maximum 15; no prefix or checksum rule
- Postcode — exactly 5; Mobile No — maximum 11
- The company name is upper-cased by the page

## The suites

```bash
npm run test:gating      # read-only — safe to run repeatedly
npm run test:status      # read-only — the full status/combination + assignee sweeps
npm run test:modal       # opens the modal, never confirms — safe
npm run test:extend      # DESTRUCTIVE — spends extensions from the pool
npm run test:race        # DESTRUCTIVE — two-session clashes, pool-fed (R10; LOWER PRIORITY)
npm run test:roles       # read-only account sweep — now ASSERTS REQ-004's eighteen
npm run test:api         # replays the captured request — needs one grand-tour run first
npm run test:e2e         # prints the live blocked-list for the E2E chains
npm run report
```

**Added 26-08-2026 evening — the seven suites that closed the scripting gap.**
Twenty-three scenarios had no script at all; these are them. Read the header
comment of each file before running it, because three of them can spend a real
extension and two need a human for exactly one act.

```bash
npm run test:population  # TS50  read-only  the 50 Approved records nothing asserted
npm run test:stubs       # TS51  read-only  + TS46 (N/A, recorded not deleted)
npm run test:surfaces    # TS43 TS34 TS35 TS29 — R14's listing + export sweep
npm run test:window      # TS54 TS49  the upper bound: which day, and by which rule
npm run test:endpoint    # TS45 TS52 TS53  the server-side gate, past the button
npm run test:midflight   # TS38.1-.3 TS37 TS40  a change under an open pop-up
npm run test:overnight   # E2E_TS9 TS55 E2E_TS10  two sittings, across the cron
npm run test:readonly    # everything above that neither writes nor spends
```

| suite | costs | needs |
| --- | --- | --- |
| `test:population` | nothing | — |
| `test:stubs` | nothing (one expected-refusal POST) | the inertness half wants `STUB_FOIL_APP_NO` + `EV_ALLOW_WRITES=1` |
| `test:surfaces` | 3 pool fixtures (TS35 is free) | `EXTEND_APP_POOL` |
| `test:window` | nothing — patching never spends an extension | VPN + `EV_ALLOW_EXPIRY_PATCH=1` + `WINDOW_APP_NO` |
| `test:endpoint` | nothing IF the build refuses; a fixture if it does not | `EV_ALLOW_ENDPOINT_PROBE=1` + throwaway `ENDPOINT_APP_NO` |
| `test:midflight` | 1–2 pool fixtures; TS37/TS40 are TERMINAL | `EV_ALLOW_EXPIRY_PATCH=1`; TS37/TS40 need `EV_MANUAL_REGISTER=1` |
| `test:overnight` | 1 fixture, spent | two sittings: `EV_OVERNIGHT=evening` then `=morning` |

Two of these are worth knowing about beyond their scenario numbers:

- **`test:window` collapsed TS54 from nine months to one sitting.** The vault's
  design named two fixed fixtures and six probe days between 30-08-2026 and
  02-05-2027, one of which was the deciding reading — correct, and unrunnable
  before May 2027. `dates.rulesDisagreeOn()` instead finds an expiry for which
  **today** falls strictly between the two candidate closing days, so the two
  rules predict opposite things about one record and a single reading settles
  it. As of 26-08-2026 that expiry is **2026-05-27** (+90d = 25-08, +3mo =
  27-08): button present means three calendar months, absent means ninety days.
- **`test:midflight` runs TS37 and TS40 semi-automated rather than by hand.**
  Registered is reachable only through Create Account, which the harness does
  not drive. So the script does everything else — opens the pop-up, types the
  remark — and then either watches the listing for Registered (TS37, up to 15
  minutes) or counts down in the console (TS40) before driving the rest itself.
  One manual act instead of a manual case.

### The fixture pool

Destructive tests no longer share one `EXTEND_APP_NO` — they draw from
`EXTEND_APP_POOL` (comma-separated application numbers, each Approved, never
extended, not Registered). `src/pool.js` records consumption in
`fixtures/pool-used.json` so a re-run cannot point a test at a spent fixture;
tests that PROVE nothing was committed (TS27 offline, TS32 dead session) hand
their fixture back. `EXTEND_APP_NO` still works as a pool of one.

```bash
npm run pool:status                          # census staging, write nothing
npm run pool:build -- --want 10 --write-env  # census, then build the shortfall
```

**Census first, build only the shortfall.** A build creates a real dealer, a
real application and a real payment on shared staging, so building ten when
staging already holds four is four avoidable records in a database other people
are testing against.

**Only records the rig created are auto-enrolled.** The 26-08 census found five
eligible Approved records and only two were ours — the others were
`FAIZUDDIN 11978 06` (a different ticket), `TEST APPLICATION DIRECTOR` and
`115366TS08`. An eligible record is not an unclaimed one, and R1 makes the
mistake expensive: handing someone else's application to a destructive test
spends its ONE extension and nothing gives it back. They return to a greyed
record carrying a remark they did not write, and the cheapest explanation
available to them is "the build is broken". `--include-foreign` overrides, and
is deliberately awkward to type.

**`src/pool.js` carries a `RESERVED` set, and it is load-bearing.**
`poolMembers()` folds `EXTEND_APP_NO` in for compatibility, and on this project
that variable had been left pointing at **NA68001099, the already-extended
greyed control**. Nothing crashed: `take()` handed it out, the test found a
greyed button, and the failure read *"this application has already been
extended"* — indistinguishable from the build wrongly greying a fresh record.
The exclusion is now enforced in code (NA68001099, NA68001100, NA62000987, plus
`EV_POOL_EXCLUDE`) rather than trusted to `.env` hygiene.

**Building more fixtures is not unattended, and that is an environment problem
rather than a harness one.** See *What this harness cannot do*.

### Coverage matrix (69 rows — every one has a script)

**26-08-2026 evening: the scripting gap is closed.** Twenty-three scenarios had
no automation at all; they now do, and the assertion suite is **103 tests across
22 files** (was 76 across 15). The rows below still describe what each case
COSTS and what it is waiting on — a script is not a pass, and only TS50 has been
run of the new set.

| Status | Scenarios |
| --- | --- |
| **PASSED 26-08, by reading a surface** | **TS19** (REQ-009, no email) — **green**, read out of the **Mailtrap `modefair` sandbox (2581833)** in Charmain's own browser via MCP, on her instruction *"no need, just use mcp to check using my browser"* — **no API token was needed and none was added**. Nothing for NA68001099 since the fixture was built two days earlier; nothing resembling an extension notice near the 04:02 PM click; and the liveness control came free (mail 7 minutes before the check, a whole fixture run 3 hours before). **Q38 closed, `ts19-dev-message.md` withdrawn unsent.** The token path below stays available for unattended runs but is **not** how this pass was obtained |
| **Runs today, read-only, and asserting a requirement** | **TS13** (`npm run test:audit`) — the UCD Application Audit Log's `[Extend] old: - new: Yes` block, verbatim, plus old → new expiry, `[Extended By]` = the clicker, the remark whole, one Extend row per application (R1) and the rendered table agreeing with the endpoint. **Passing 26-08** against the extension spent that afternoon; costs nothing and spends nothing |
| **Runs today, read-only** | **TS51** (R19 — a BackOffice-generated stub must be left completely alone: no control, no invented expiry, and nothing changed by extending a different application; `NA68001100` is the reference stub), TS01.1–.7*, TS02.1–.9*, **TS08.1–.3 (the window boundary — no longer blocked, see below)**, **TS41.1** and **TS42** (assignment does not gate the button), TS18 (read-only half), **TS15 — now asserting REQ-004's blocked-account list, no longer record-only**, **TS44 (how early the button appears — the C8 evidence; FAILS by design)**, **TS47** (Expired → Approved after a post-expiry extension, on the listing column, the detail sidebar and the status filter — REQ-007/R16, scripted and waiting on one spent extension), C2/C4/R9/R11 gating, **the post-expiry census** and the **status × hardcopy matrix census** (both record-only — see below), **TS50** (the Approved records with no registration-documents page — 6 with a page against 50 without. **Written 26-08 evening as `npm run test:population`**: it splits and COUNTS both halves, opens at least three of the no-page records, and asserts the control is absent from the markup on every surface *and* absent for REQ-001(a)'s reason rather than the window's. The positive control is asserted first and hard, because a run that finds no button anywhere has measured a broken session) |
| **No longer date-bound — read-only, runs any day** | **TS49** — the closing-day probe. It used to be a discriminator between a date boundary and a timestamp boundary, needing two readings on one specific day either side of the expiry time. **Q39's mechanism collapsed that fork**: the only time-of-day machinery in the feature is the midnight cron (R12) and the bound is date arithmetic, so the expectation is flat — present and enabled for the WHOLE closing day — and the case became a DEFECT CHECK. **Written 26-08 evening in `npm run test:window`**, and no longer tied to NA62000987 or to 28-08: the support tool patches any fixture onto its own closing day, so it runs today. Absence there is the one-day-early window NA62000984 hinted at, now reproducible on a known fixture instead of inferred from one sighting |
| **Runs today, opens modal only** | TS12.1–.5, TS20, TS10.3 (probe), TS36 modal-copy parity |
| **Runs today, writes and restores** | **TS41.2** — reassigns one application and puts the assignee back (`EV_ALLOW_WRITES=1 ASSIGNEE_APP_NO=<no>`); supersedes the old TS15.8, which asserted nothing. **TS48** — switches BOChar to Probation, asserts it can reach neither the page nor the button, and restores it (`EV_ALLOW_ROLE_SWITCH=1`); the restore is itself an assertion |
| **Runs today, spends a pool fixture** | TS04, TS10.1–.2 (released if R2 holds), TS10.4–.7 + TS11 + TS24 + TS31 + TS34.1 + TS35 (grand tour, one extension), TS14/E2E_TS5, TS25, TS27†, TS28, **TS29 (now the FULL case, in `test:surfaces` — page, listing, export and exactly one audit row with coherent attribution; TS14 keeps the UI half)**, TS30, TS32†, TS23 (client-clock) |
| **Scripted, waiting on a fixture env var** | **TS01.8 (`EXTENDED_REGISTERED_APP_NO`** — extended-then-Registered; the transition is manual and terminal), TS05 (`EXPIRED_APP_NO`), TS06 (`PAST_WINDOW_APP_NO`), TS07 (`PAST_WINDOW_EXTENDED_APP_NO`), **TS08.4–.5 only** (`TS08_APP_NOS` — .1–.3 now run unattended), TS09 (`TS09_APP_NOS`), TS22 (`TS22_APP_NO`), TS17.1 + TS17.2 (`EV_DEPLOY_DATE`), TS33 (`SIBLING_APP_NO`), E2E_TS4 (`EXTENDED_THEN_EXPIRED_APP_NO`), E2E_TS7/TS16 (`DEALER_LINK`), E2E_TS8 (pinned to NA68001164 in `takeFixtures.js` since 31-08 — **now filmed and spent**; a re-run needs a fresh pre-deploy record plus `EV_COMPARATOR_APP_NO` / `EV_COMPARATOR_UUID` naming an already-extended POST-deploy record, which is only read) — the date-patched ones are all **Q12** |
| **Scripted, request shape known** | TS26.1–.4 + TS15.9 — the endpoint and body were read from the page JS on 25-08, so `discovery/extend-request.json` is a convenience, not a prerequisite; TS26 can now run *before* an extension is spent. **TS45** (a REQ-004-blocked account calling the endpoint directly) is the same technique against the new requirement — **written 26-08 evening in `npm run test:endpoint`, alongside TS52 and TS53**. All three share `src/endpoint.js`, which REFUSES to send without a CSRF token: the first hand-built replay omitted it, got 403 with an empty body, and reported that as enforcement. It was Spring Security rejecting the request before the handler, and it would have closed Q19 on a false pass |
| **Added 26-08 night — read-only, one specific pair of days** | **TS54** — separates the two readings of the window's upper bound that the vault was holding at once (R5: *"the boundary data CANNOT separate the two readings"*; TS49's expected result asserts 3 calendar months anyway). **Written 26-08 evening in `npm run test:window`, and it does NOT need the two fixtures or the nine months.** The vault's design named expiry 01-06-2026 (30-08 against 01-09) and 01-02-2027 (02-05 against 01-05) with six probe days between them — correct, and unable to report before May 2027. `dates.rulesDisagreeOn()` takes the vault's own escape hatch instead: an expiry for which **today** falls strictly between the two candidate closing days makes the two rules predict OPPOSITE things about one record, so ONE reading decides. Today that expiry is **2026-05-27** (+90d = 25-08, +3mo = 27-08) — present means three calendar months, absent means ninety days. The inverse arm (a three-month span containing February, where 90 days is the LATER bound) is not reachable today and is confirmation rather than decision; re-run in Dec–Feb to close it. The only write is one expiry patch; the case extends nothing |
| **Added 26-08 night — writes, and spans the midnight cron** | **TS55** — the dealer's link read the morning AFTER the ORIGINAL expiry passed, on a **pre**-expiry extension. TS16 is the dealer side of a *post*-expiry extension and E2E_TS9 is the BackOffice side of a *pre*-expiry one, so this is the gap between them, and it is where a **half-applied extension** hides: the application date moves, the link's own validity does not, BackOffice reads Approved on a future date while the dealer is locked out on the old one — and R6's greyed button makes it unrecoverable. Run it on E2E_TS9's night, on the same fixture shape: one night gives both cases their reading, and reading both surfaces on the same morning is what turns a disagreement into evidence. Needs the un-extended negative control or "the link works" only proves links never expire |
| **Added 26-08 night — raw replay, declared UNRECORDED** | **TS52** (the mandatory remark **at the server**) and **TS53** (a **Probation role** at the extend endpoint). Both are the TS26/TS45 shape exactly — an in-page request from a real session, judged on the response plus four read-backs (expiry unmoved, no remark row, button still enabled, no audit row) — so there is no eAuto screen to film. TS52 exists because **R2 names it and TS26 does not carry it**: R2 says *"TS26.2 (replay the request with an empty remark) is therefore the only way to learn whether the server enforces the rule at all"*, and TS26's four calls are re-send / already-extended / past-window / not-assigned. Four variants: absent field, empty string, whitespace-only, single character (the last is expected to be **accepted** — a bad remark, not a blank one). TS53 completes the 2×2 of button/endpoint against username/role, of which three squares were filled, and needs a **HubAdmin control on the same request shape** or a refusal proves nothing. Both can **spend an extension** if the server wrongly accepts — throwaway fixtures only |
| **Out of scope for this ticket** | **TS46** — a reactivated application must never be extendable (REQ-005's third acceptance criterion). Charmain, 26-08-2026: no need to test. Reactivation is EAINT-11868 and is not deployed here, and a hand-made "reactivated-looking" record proves nothing about the flag the build checks. Marked **N/A** in the vault rather than deleted, because the requirement still exists — revive it if 11868 lands in this environment before sign-off. ~~TS13~~ — **revived the same evening, see the row below.** It was N/A for about four hours on the ruling that the audit log was backend; Charmain reversed that by pointing at the screen, and the team then stated the `[Extend]` block as a requirement. Q18 is **answered**, not dropped, and the audit-log steps pruned from TS23, TS26, TS29, TS37, TS38, TS39 and TS40 are back |
| **Deliberately not automated** | TS21 (exploratory, with dev), TS23 DB half, TS36 visual parity (design-review flow — MD-249 pending, and invisible to QA's Jira account as of 26-08, so ask the BA when it freezes), TS18's Revert/Hardcopy writes. ~~E2E_TS9 (overnight job)~~ — **scripted 26-08 evening as `npm run test:overnight`**, a two-sitting suite (`EV_OVERNIGHT=evening` then `=morning`) that carries its baseline across the night in `fixtures/overnight.json`. Without that file the morning leg refuses to run, because "still Approved" is unfalsifiable when it was Approved yesterday too |

\* **filter-driven**, not page-one-driven: each sweep SETS the listing dropdowns
and reads the server's own record count, so an empty combination is a stated
fact with a number behind it (NOT COVERED in the run annotations) rather than a
silent pass. The status and hardcopy values come off the page
(`listing.filterOptions`), so a value added on the server shows up as a new
uncovered case instead of being missed. Every probe also goes through
`assertLegalState()` — the R11 triple — so a fourth button state cannot slip
past a sweep.
† releases its fixture back when the no-commit proof passes.

**Run order for a fresh environment:** `discover` → `test:gating` (read-only,
and its census tells you which fixtures the environment already has) +
`test:modal` → fill `EXTEND_APP_POOL` → `test:extend` → `test:race` →
`test:api`.

**`test:gating`** covers the three things the walkthrough settled and nothing
that writes:

- **C2** — the expiry date renders as the `Application Expiry Date` column on
  the UCD Application Listing, and equals created + 90 days, to the minute.
- **C4 / Q11** — Extend is in the Registration Documents right sidebar beside
  Application Status, and *not* in the page header (which carries Create
  Account). **This is expected behaviour, confirmed by Yi Link 26-08-2026** —
  C4 closed, EAINT-12226 closed. The assertion stays as a regression guard, but
  the sidebar is now the *correct* answer, not a recorded divergence: if the
  button ever moves to the header, that is the defect.
- **R9** — `Hardcopy Doc = Registered` removes the button entirely; Approved and
  not-yet-Registered shows it; anything not Approved does not.
- **R6 / R11** — an already-extended application is greyed with the once-only
  message, and that is the *only* state where a non-clickable button is legal.

### The audit log is a QA surface — measured 26-08-2026 (R18)

Charmain: *"any changes should show in this audit log,
`https://staging.eauto.my/obs/admin/audit-log/enquiry` — i think need to include
ts to cover this part."* Then the team stated the requirement outright:

> if Assignee / any BO user clicked **[Extend]**, System should display:
> `[Extend]` / `old: -` / `new: Yes`

`npm run probe:audit -- --role ops_jasons --from 20/08/2026 --to 26/08/2026`
measured it before a word of scenario was written. **Four findings, and three of
them would have made a scenario fail for reasons that have nothing to do with the
build:**

1. **A pasted URL answers 403 with an empty body** — every account, ops_jasons
   included. /obs needs the session handoff. The menu item is
   `<li class="obs-auth-required" data-type="OBS_AUDIT_LOG_LISTING">` and its
   door is `/uat4/api/admin/onboarding/auth-redirect.do?type=OBS_AUDIT_LOG_LISTING`,
   which lands on the page with **200**. **Never report "no permission" from a
   pasted URL.**
2. **Both log dates are mandatory.** `#to-search` alerts *"Please input Log Date
   (From) and Log Date (To)"* and returns `false`, so a company-only search never
   submits — and reads exactly like an empty log.
3. **The rows paint after `networkidle`.** Read too early and the page says *"No
   records found matching your search criteria"* while the network has already
   returned **53 records**. This happened during the probe itself.
4. **There is no application-number filter** — `logDateFrom`, `logDateTo`,
   `companyRoc`, `businessTrading`, `companyName`. Company name is the key, which
   is the second dividend of the `CHARMAIN` fixture tag: one search returns every
   row this rig caused.

`src/auditLog.js` wraps all four: `open()` goes through the redirect, `search()`
always sends both dates and reads the JSON endpoint
(`/obs/admin/audit-log/enquiry/search?pageNo=1&logDateFrom=&logDateTo=&companyRoc=&businessTrading=&companyName=`),
and `parseDescription()` splits the line-based Description into
`[Block] old/new` pairs. **`checkExtendEntry()` is the stated requirement as one
predicate**, returning *which* half failed rather than throwing.

**What the log actually recorded for the extension spent on 26-08 at 04:02 PM:**

```
[Extend]                      old: -                 new: Yes
[Application Expiry Date]     old: 22-11-2026 9:10pm new: 22-12-2026 9:10pm
[Application Extension Date]  old: -                 new: 26-08-2026 4:02pm
[Extended By]                 old: -                 new: 99000/jasons
[Remarks]                     old: -                 new: zzzzzzzzz
[Application Status]          old: Approved          new: Approved
```

Who, when, old → new expiry, the extension date, the clicker, the remark **and**
the status — one row holds the whole extension, which makes it the sharpest place
to catch a partial write. Two consequences worth knowing: the **remark has a
third surface** here (R14 keeps it off the listing and export; an audit trail
that hid it would be useless), and **`[Application Status]` is a fourth surface
for REQ-007's Expired → Approved flip**, after the listing column, the sidebar
and the status filter — TS47 owns that comparison.

`npm run test:audit` asserts all of it **read-only, today**, against the rows the
log already holds — no fixture, no extension spent. The half that needs a fresh
extension (the log's `old:` value against a before-state captured *before* the
click) rides the grand tour in `extend-lifecycle.spec.js`.

### The R14 sweep boundary, and what enforces it (26-08-2026)

Charmain's rule is *"all the ts should check these 2 places"* — the listing's
Remarks column and column 23 of the export. **62 rows carry the sweep text**, which
covers every one of the 60 recordable rows — TS43 is the single declared exemption,
because the export IS that scenario rather than a check bolted onto it — and
the ones that do not are a written list in the vault's R14 note, not an
oversight: nothing is extended in them, so no remark exists to leak and no expiry
moves (the visibility censuses TS01/TS02/TS06, the read-only reach cases TS13,
TS15, TS42, TS44, TS46, TS48, TS49, TS50, TS51, TS54, plus TS18/TS19/TS36 which
are not data surfaces at all, and TS26/TS45/TS52/TS53 which are raw replay).

## Where the house-format evidence stands — `npm run evidence:coverage`

*Added 27-08-2026 night.* The board, derived from the sidecars every time it runs and
never stored, because a stored completeness figure goes stale the moment a ceiling
changes — and ceilings change here weekly.

```
npm run evidence:coverage    # the board: takes vs FINISHED checklists, per shape
npm run evidence:gaps        #   + which POINTS are missing, across how many takes
npm run evidence:todo        #   + runnable now vs blocked on fixture supply
npm run takes:plan           # what the read-only batch would film — runs nothing
npm run takes:readonly       # RUN it. Never sets EV_SPEND, so nothing is spent
```

**It prints two numbers side by side, and only the second supports a sign-off.**
Late on 27-08 it read *"20 takes across 17 of 60 scenarios"* with **14** finished
checklists, of which **12 are complete AND matching** — the other two filmed a control
state their scenario does not claim (TS03/TS07, the C7 regression, deliberately):
complete as coverage, findings as results. The board says so on its own headline rather
than letting `14` read as `14 passed`.

**A point the fixture cannot offer is not a gap.** When a record has no Extend control
there is no pop-up to open, so the recorder drops `modal-open` / `modal-cancelled` /
`button-after` to NOT APPLICABLE with the measured state quoted and writes its own
reduced ceiling. The board credits that drop — the score reads `12+3/15` — and the
credit is **fenced to those three keys**, because a checklist that shrinks to fit
whatever a take managed would let every take score full marks. Before this was fixed,
three finished takes were branded `RESHOOT` and re-recorded to identical scores.

**And it reports whether a scenario CAN reach its ceiling at all.** A ceiling counts
every declared trigger point; until 27-08 night nothing counted whether a recorder
branch existed to reach one — so a scenario could sit permanently at 15/16 with the
board calling it SHORT, as though a re-record would fix it, when the missing point had
no code behind it. **43 of 60 were in that state.** Fifteen branches were written the
same night, then the remaining 24 in the same session, so it now reads **60 of 60** —
every recordable scenario can reach a full checklist. That took four pieces of new
machinery: `src/secondSession.js` (a second window with its own pointer, checklist and
cookies, for the race and dealer families), `src/handback.js` (the take stops and waits
for a human, because Create Account cannot be driven at all), and three legs that drive
the action itself — `validation` confirms on an empty remark, `nohalf` cuts the network
the instant Confirm is sent, `bounce` clears cookies under the open pop-up. The drivable
set is read out of the recorder itself, never hand-kept.

Both new modules are proven offline — `npm run probe:legs` — and **neither has run
live**. Each executes for the first time on a take that spends an irreversible
extension, so cut frames on the first take of each family and check the camera saw what
the sidecar claims.

**`evidence:gaps` is for reading BEFORE re-recording anything.** A point missing across
many unrelated takes is one broken leg of the recorder, not many bad takes — it sorts
the misses by how many takes share them and lists every take by recording time, so
*"everything filmed after 16:40 is complete"* names the fix without opening a sidecar.

**`takes:readonly` is safe to start and walk away from.** It derives its plan from
`evidence:coverage --plan`, so it cannot go stale: a scenario that reaches its ceiling
drops out by itself and one whose ceiling grew comes back in. It re-uses the record each
take was already filmed on, pre-flights `check:points` / `probe:still` / `probe:framing`
and refuses to start if any is red, pauses between takes (staging bounces a run of quick
logins to `/uat4/home/?err=OBS`, which reads exactly like a wrong password), and copies
`test-results/` out after EVERY invocation — Playwright empties it at the start of the
next one, which is how most of the 27-08 pm batch's videos were lost. Scenarios never
filmed at all are NOT in the batch, because nothing names a record for them; it prints
those separately rather than quietly covering 13 of 19.

It owns the screen while it runs: headed, full-desktop ffmpeg capture, browser pinned
topmost. Roughly five minutes a take.

**`npm run check:points` is what keeps the two halves honest.** It compares this
rig's classification (`src/triggerPoints.js`) against the vault's actual sweep
text on every run, so a case that gains or loses the sweep in the vault shows up
here as drift rather than as a quiet difference. On 26-08 it caught four
scenarios a parallel session had added, and they split two ways:

- **TS47 gained the sweep.** It was written as a status case (REQ-007's Expired →
  Approved flip) but it types a remark and Confirms — it *is* an extension, so
  R14 covers it. The status half is untouched; TS47 still owns R16.
- **TS48, TS49 and TS50 are `GATING_PLAIN`** — read-only, no fixture, no writes,
  no extension spent — and are now on R14's boundary list too.

It caught the next four the same way, **within a minute of the insert**, and the
split is the useful part because each arm has a different reason:

- **TS55 gained the sweep.** It types a remark and Confirms, so the remark exists
  and both surfaces have to be read. Its block says to sweep on the morning of
  step 7 rather than the evening of step 3 — the point of the case is what the two
  surfaces say once the ORIGINAL expiry has passed. Note that this case produces
  **no** Expired → Approved flip (it extends before expiry, R3), so a status
  change on either surface is itself the finding.
- **TS54 is `GATING_PLAIN`** — read-only, like TS48/TS49/TS50. The support-tool
  expiry patches in its preconditions are writes, but the take extends nothing.
- **TS52 and TS53 are `UNRECORDED`** — the TS26/TS45 raw-replay shape, no UI to
  film beyond the response body.

**The mechanical lesson, since it cost a wrong first guess:** the checker greps
for the `TWO-SURFACE SWEEP (R14)` block in a scenario's **`expected`** field, not
in its steps. All four of these carried sweep *steps* from the house template and
were still correctly reported as un-swept.

`TS13` was briefly declared `UNRECORDED` on the ruling that the audit log was
backend (Q18 dropped). **That was reversed the same evening** — it is a screen
(Menu > Onboarding > UCD Application Audit Log), R18 owns it, and it now sits in
`GATING_PLAIN`: read-only by design, because it asserts the row an extension
already left behind and performs no extension of its own.

### Disabled vs hidden — R11, ruled 26-08-2026

Charmain's ruling: **a greyed Extend button means "already extended", never
"not allowed".** Three renderings and no others —

| Rendering | When |
| --- | --- |
| enabled | never extended, AND status in **{Approved, Expired}**, AND not Registered, AND inside the window (expiry − 30d … expiry **+ 3 calendar months**), AND it has a registration-documents page |
| greyed + once-only tooltip | the extension has been spent, AND status in {Approved, Expired}, AND not Registered. **The window does not apply** — a spent extension leaves it nothing to govern, so the greyed button persists past expiry + 3 months |
| absent | everything else: status outside {Approved, Expired}; Registered; never extended and outside the window; no registration-documents page; the dealer-side view |

**CORRECTED THE SAME EVENING, and the correction is the interesting part.** The
status test is a **two-value whitelist** — Charmain, 26-08: *"should hide the
button when application status is not approved or expired, or hardcopy doc is
registered"*. Approved **or Expired** keeps the button; Pending / KIV / Rejected /
Draft hide it.

**So Expired does NOT remove the greyed button.** An intermediate version of this
table said it did, propagated from one clause of an earlier sentence (*"if updated
to other status then only hide it, like application status expired"*). It flipped
E2E_TS4 and forked TS07/E2E_TS6, and Charmain reversed it: an application extended
once and since expired still shows **greyed + the once-only message**. Registered,
or a status outside the two, is what removes it.

**On an Expired record the rendering therefore reports the history** — never
extended and inside the window → **enabled**; already extended → **greyed**. Same
status, opposite rendering, and the difference is the spent extension. A
screenshot of each side by side is what proves the rule; either alone looks like
it contradicts the other.

Three things follow for this harness:

- `extendState()` reports **`present` (visible)** and **`inDom`** separately.
  It used to be a DOM count, so a `display:none` node would have read as a
  rendered button — the same mistake that manufactured the C6 modal-× finding.
  Today the build omits the button server-side, so the two agree; they are
  measured apart to notice the day they stop.
- `assertLegalState()` in `extend-visibility.spec.js` runs over every probe, so
  a fourth state cannot slip through a sweep unnoticed.
- **TS01.8** (`EXTENDED_REGISTERED_APP_NO`) asserts the new case. Its *setup* is
  manual and terminal: Registered is only reachable through Create Account —
  the Hardcopy dropdown offers Pending UCD / Incomplete Docs / Pending Assignee
  and nothing else — and it destroys the fixture. Run it last, on a fixture the
  grand tour has already finished with.

### REQ-004: eighteen accounts that cannot extend (26-08-2026)

The new SRD answers the role question QA has been asking since 24-08, in a
shape nobody predicted: **not a role matrix, a list of eighteen usernames.**
Every other BackOffice user may view and click Extend. `BLOCKED` in
`tests/extend-roles.spec.js` holds the list verbatim, and TS15 now asserts both
halves of the acceptance criterion instead of recording a table.

Three things to keep straight when reading a run:

- **"Cannot view", not "cannot click".** For a blocked account the button must
  be **absent**. A greyed one would satisfy the second half and still be a
  defect, because under R11 greyed means *already extended* and nothing else.
- **Match on the username, never on the role.** Five of the six CSE accounts in
  the shared store are on the list — `eautochinwei`, `eautohamal`,
  `eautojrjaya`, `eautoxiayuan`, `kokping` — and `eautomie` is not. That one
  account is the whole discriminator between a username check and a role check
  in the build; a run that skips it cannot tell the two apart.
- **Coverage is TWELVE of eighteen, and that is the whole scope (fixed
  26-08-2026).** Censused on the user-account listing, which can be searched by
  login id without a password (`npm run probe:rolemap`): **twelve of the eighteen
  exist on staging/uat4, all Active** — 3 Admin, 9 HubAdmin, none Probation — and
  **six do not exist on this instance at all**: `tempstaff`, `mfnabila`,
  `mfnadhirah`, `mfaliah`, `mfmaisarah`, `mfteckyung`.

  The census is the move worth copying: it answered *does this account exist here*
  and *what role does it hold* for all eighteen **without a single password**, and
  it split one vague gap into two precise ones — only one of which was QA's to
  close. Going to Ops first would have meant asking for thirteen passwords, six of
  which do not exist.

  **All twelve logins are now in the shared store and `check:login`-verified** —
  two came off the team's *Staging/Beta Test Checklist* sheet, five from Charmain,
  keyed `hubadmin_wahidahzaki`, `hubadmin_shamini`, `hubadmin_jenilyn`,
  `hubadmin_nashwa`, `hubadmin_vegas`, `hubadmin_zuhaira`, `hubadmin_nicholas`.
  The six production-only names are **deprioritised, out of scope for staging**,
  and the run names them as a stated exclusion **with a reason** rather than
  printing them as NOT COVERED. *12 of 18 with six explained is complete for this
  environment; 12 of 18 with six unexplained is not.*

  **One password, one copy — deliberately.** All seven new accounts share the
  standard staging password, and it was never re-typed per account: it was read
  once, verified programmatically against the copy already stored for
  `cse_chinwei`, and that stored value reused. This matters more here than
  anywhere else in the suite, because **a wrong password on a *blocked* account
  produces "no Extend button" — exactly the result the test wants. A typo would
  have looked like a pass.** Run `check:login` before any REQ-004 sweep.

  The list is Ops-maintained configuration (SRD Assumption 2), so it can change
  without a deployment, and so can account membership: re-read REQ-004 and re-run
  the census before trusting last week's green run. **Whether the list is code
  that ships with the build or per-environment config is the one open question**
  — if config, staging's copy and production's copy are different objects and no
  number of staging logins says anything about production.

The fixture route (`jasons` approving, `bochar` as assignee) uses no blocked
account, so nothing measured before today needs re-checking. Whether the
exclusion is enforced server-side is **Q32**, and **TS45** is the probe.

**First run: 26-08-2026, and it passed** (`npm run test:roles`, 17.5 min,
`discovery/76-ts15-req004.json`). The five blocked accounts then in the store got
**no button in the markup** — `inDom: false`, not a CSS-hidden node — and the
twelve unlisted ones got it present and enabled. `eautomie` saw the button while
the five blocked CSE accounts did not, which is what proves the gate is by
username. R15 verified.

**THAT PASS IS SUPERSEDED AND MUST BE RE-RUN.** It ran against a **17-account**
store; seven blocked accounts were added the same evening, and the first sweep
afterwards **failed** with a cause that was not captured (the run log was
truncated to its tail). Until a full-output re-run reports, TS15 has no
trustworthy result. **A stale Pass on a sweep whose population has grown is worse
than no result** — it reads as coverage of accounts it never touched. Capture the
whole log, not the tail.

**And the role model was measured** (`discovery/78-q6-role-map.json`): the build
has three roles — **Admin 69, HubAdmin 126, Probation 47** — and both Admin and
HubAdmin hold blocked *and* unblocked accounts, which proves the username check
more strongly than `eautomie` alone. "CSE", "Ops" and "Finance" are QA labels;
the system does not know them, so the Finance login is a HubAdmin (Q35 asks the
BA whether the finance function should extend). **Probation cannot reach the
module at all** — no Onboarding group in the menu — and that is the feature's
one genuine role gate.

Two things that run taught the harness, both fixed the same hour:

- **`NO_ACCESS_KINDS` was gating the assertions.** Finance (`eautoaccount`) and
  Hub Admin (`bochar`) both reached the Registration Documents page and both saw
  an enabled button — that matrix was written for other screens and does not
  describe `/obs`. Because the spec had used it to decide which rows to judge,
  it would have excused exactly those two rows, and a blocked Finance account
  that *did* see the button would have passed silently. Now only the measured
  `reached` suppresses an assertion; the label rides along as
  `unexpectedAccess` for the reader, and the BA question is **Q35**.
- **Coverage counted rows, not people.** `EDIT_USER` and `OPS_JASONS` are both
  `jasons`, so "13 proved present" was really 12 usernames. The annotation
  counts distinct usernames now.

The general shape, for the fourth time in this project: **a table written
elsewhere standing in for a measurement.** If a value can be observed in the
run, observe it.

### Where the SRD and the build disagree — C7 and C8 (26-08-2026)

The document that arrived today contradicts two things this harness has been
asserting. Neither is settled, so neither is coded as an expectation:

- **C7 — after an extension. RESOLVED 26-08-2026, and the build was right.**
  REQ-005 says the button "shall stop displaying"; Figma 9058-30492 and the
  `.extend-btn:disabled` CSS the build ships say *greyed with the once-only
  tooltip*. Charmain ruled for **greyed**, so REQ-005's wording is incomplete
  rather than the build being wrong — and the parent SRD never actually
  disagreed (11868 v1.4 §2.2.5 hedges it as "hidden/disabled" and "becomes
  unavailable"; only the new document committed to the wrong verb). **Assert the
  greyed rendering now** — the record-and-do-not-grade instruction is withdrawn.
  What goes to the BA is a wording amendment, not a question.
- **C8 — before expiry. RULED 26-08-2026, and it is a defect.** Charmain: the
  window is **expiry - 30 days to expiry + 90 days**, and both ends are rules.
  So REQ-003 is right and the build is wrong at the lower end — it offers Extend
  from approval onwards, measured at 88 days out. **TS44 now asserts absence
  beyond 30 days and fails**, which is the evidence the defect is raised on; its
  other half (the button DOES appear inside the last 30 days) has no fixture,
  because staging holds no Approved record in that band.

  Two knock-ons the suites carry now:

  - `windowState()` in `tests/extend-visibility.spec.js` splits TS01's presence
    assertion on days-to-expiry. Until the ruling this suite asserted "Approved
    and not Registered => button present" and **passed** — on rows that were all
    months from expiry. Same observations, opposite meaning: they were sightings
    of the defect. A suite only catches what it was told to look for, and "the
    build does X, so X is the rule" is how a defect becomes a baseline.
  - **TS04 lost its fixture.** A pre-expiry extension is only legal inside the
    last 30 days, so the easiest positive case in the set queued behind the dev
    date-patch (Q12) with the boundary cases — **until the evening of 26-08, when
    the support tool answered Q12 and it became a two-minute setup:**
    `npm run set-expiry -- --app-no NA… --state in-window`.

  **The upper bound is three CALENDAR MONTHS, not 90 days** — confirmed with the
  BA on 26-08 after QA had spent two days testing to a verbal "90 days". The SRD
  was right; the request to reword it was withdrawn before it was sent. The rule
  in full:

  | | |
  | --- | --- |
  | created + **90 days** | the initial expiry date |
  | initial expiry **- 30 days** | the button appears |
  | initial expiry **+ 3 calendar months** | the button is hidden after this |

  Anchored to the **initial** expiry date, not the extended one. `src/dates.js`
  owns the arithmetic — `addCalendarMonths` (month-end clamped: 31 Jan + 3
  months = 30 Apr, per the timeanddate.com reference) and `windowState`, which
  returns `before-window` / `in-window` / `after-window` / **`closing-day`**
  plus the real `opensOn` and `closesOn` dates — the fourth state is the day
  that is exactly `closesOn`, and TS08 and TS01 **record** it rather than
  asserting on it. **Never re-derive the boundary with a day count:** three
  calendar months is 89 days from 28 Feb, 90 from 30 Nov and 92 from 31 May, so
  `daysPast <= 90` misclassifies rows by up to two days — the exact width of the
  boundary these suites test. That bug was live in `extend-boundaries.spec.js`
  for two days and is now fixed.

  One boundary observation is still open, and it now has a scenario and a
  question of its own. NA62000984 sat exactly on its +3-month date and showed
  **no** button. `scripts/probe-boundary-day.js` ruled out the innocent
  explanation — no "Application Extended Remarks" row, no green banner, expiry
  unmoved, so the record was **never extended** — and its neighbours behave
  exactly as the rule says, which rules out status and eligibility too. Two
  readings survive:

  - **(a)** the window **closes one day early**: last eligible day is
    `closesOn - 1`, a one-day REQ-003 defect;
  - **(b)** the boundary is the **timestamp**, not the date: expiry 26-05
    **14:37** closes at 26-08 **14:37** and the probe ran at **15:07**, half an
    hour late. The build would be right, and **Q4** ("day only, ignore time")
    wrong for the window.

  They are told apart for free: probe one never-extended record on its closing
  day, before and after its time of day. That is **TS49**, and
  `scripts/probe-closing-soon.js` keeps the candidate list current
  (**NA62000987 closes 28-08-2026 09:19**). Until it runs, `windowState`
  returns `closing-day` and the suites print it as unresolved rather than
  guessing — which is why TS08 is green again after failing on that row.
  **Q39** asks dev the same thing, because the answer also says whether the
  30-day opening bound behaves the same way, which TS49 does not probe.

The general rule this is an instance of: when a requirement and a measurement
disagree, the harness records both and the register carries the conflict.
Coding the document's side would turn a question into a red run; coding the
build's side would launder a possible defect into an expectation.

### `test:race` is now requirement-backed, and lower priority (26-08-2026)

The "Item 2 - Expiry Extension" restatement states the concurrency behaviour
outright and quotes the refusal string verbatim, so it is now **R10** in the
vault rather than a dev-guide claim buried in Q17. Two consequences for this
suite:

- `REFRESH_MSG` in `tests/extend-concurrency.spec.js` asserts the required
  string, not a guessed one. **A mismatch is a straight defect** — the old
  "judge intent before raising" hedge on Q17 is retired.
- The restatement marks concurrency **lower priority**. If the schedule
  tightens, run `test:extend` and `test:gating` first and let `test:race` wait.
  TS14 is the exception worth keeping near the front: it is the once-only rule
  (R1, the heart of the feature) under load.

**Q27, raised the same day and since narrowed:** the restatement's "the Extend
button is no longer displayed once the 3-month extension window has passed" is
*unqualified*, which read literally contradicts R6 — where an already-extended
application keeps a greyed button. The 26-08 ruling settled the Registered half
(Registered removes it, TS01.8) and said nothing about the window, so for a while
**TS07 and E2E_TS6 asserted QA's reading rather than the BA's words**.

**CLOSED 26-08-2026 evening, and they were right.** Charmain settled it on the
neighbouring row — an extended record whose extended expiry has passed *"should
be greyed + once only msg"* — which closes the window half by the same logic:
the greyed rendering is a **memory of the spent extension**, not a state, so
nothing about the date or the status decays it. Registered remains the one
confirmed remover (R9 / TS01.8). A brief rewrite of this family as a fork on the
status was reverted the same evening; do not reintroduce it.

Both are runnable: the date-patch wait went with Q12 (26-08 evening), and the
Expired-status wait went with the cron recipe (26-08 night — see "Manufacturing
a status"). What is left for each is an already-extended fixture, which only a
real click can produce.

It also runs the **post-expiry census**, which asserts nothing and measures
instead: every Expired row on the first listing page, how far past expiry it is,
whether it has a registration-documents page at all, and — for a few of them —
whether Extend renders. That census is what showed Q12 (the dev date-patch) does
not block the ordinary post-expiry case: on 25-08 staging held 15 Expired
applications, all inside the 90-day window, 7 of them with a
registration-documents page, and the three probed all offered Extend, enabled, 56
days after expiry. Re-run it after any environment reset — the fixture numbers
below will change, the shape of the answer probably will not.

**Pick post-expiry fixtures by the Hardcopy column, not by the expiry date.** A
row showing "-" never submitted registration documents, so it has no page for the
button to live on, and it will read as "no Extend" for the wrong reason.

**`test:extend`** covers TS04, TS05 and the E2E_TS1 arithmetic. Every run
consumes a fixture, so it takes its application from `EXTEND_APP_NO` rather than
`APP_NO`, retries are off, and workers are pinned to one. Point it at a fresh
application each time.

## The evidence still this CR is judged on (26-08-2026)

Charmain's rule, in her words: *the test evidence screenshot should be the
application page with the extend button — if it has the extend button, screenshot
the page showing that; if not, screenshot the same page showing it is not there.*

So one trigger point carries this CR: **`extend-state`**, cut as
`_extend-state-fullscreen.jpg`. Three states, one frame, one page:

| Record | What the still shows |
| --- | --- |
| Eligible | Extend **OFFERED**, ringed, on the Registration Documents page |
| Already extended | Extend **GREYED**, with the pointer parked on it so the once-only tooltip is visible |
| Registered / out of window | **NO Extend control**, on that same page, ringed on the sidebar |

Three things about this are deliberate, and each one is a mistake already made
somewhere in this repo:

- **The absent case is filmed, not skipped.** An absence is only evidence if the
  same frame proves the check could have found a presence. Skipping the shot
  where there is no button produces a take whose gating scenario has no evidence
  at all — only a checklist saying it went looking.

- **Absence is anchored on the SIDEBAR, not on the body.** The build removes
  `span.extend-wrap` from the markup entirely, so there is nothing to ring. The
  old code spotlighted `page.locator('body')`, which rings the whole screen and
  therefore rings nothing. `app.extendRegion()` falls back to the sidebar panel
  because that panel carries **Application No** and **Application Status** in the
  same frame — the two values that make the still read as *"not offered on THIS
  application"* rather than *"some page, no button"*.

- **No anchor means no tick.** If there is neither a control nor a sidebar, the
  point is recorded as MISSING with that reason rather than banking a frame that
  proves nothing. In practice `assertRealApplication()` catches that first — a
  BackOffice stub has no sidebar (R19) — but the recorder refuses on its own
  rather than trusting it to.

`extend-state` sits in `CORE` and is omitted by no shape.

## The no-op probe, and the sweep that is no longer optional (27-08-2026)

Charmain, on the first TS01 take: *"click inside the extend button and check the
popup then quit, then check everything again after, the listing the excel file the
button (still enable), do the before after check for all ts even without any
action."*

Two changes, and the second one **reverses a standing rule of this rig**.

**1 — Every take whose button is enabled now opens the pop-up and quits it.**
Opening it spends nothing: R1 is spent at Confirm, not at click. A gating take used
to look at the button and stop, which left the cheapest evidence in this CR on the
floor — the dialog is the first thing any reviewer clicks.

| Point | What it films |
| --- | --- |
| `modal-open` | The pop-up with its copy readable — title, instruction, Remarks field, Cancel/Confirm — and asserted against the Figma baseline, not merely photographed |
| `modal-cancelled` | **Cancel**, and only Cancel. Esc (`closeOnEscape: false`) and the × (`display:none`) are dead *by design*, so a take that quit with Esc would film a dismissal that failed and score it as one that worked. TS12 owns those exits. |
| `button-after` | The control **through a full page reload**, still present and still enabled |

The reload is the point of the third one. Re-reading the same DOM proves only that
the rig did not change it; the claim worth filming is that the *server* still
regards the application as extendable.

**Confirm is never touched.** Cancel is located by an exact `/^cancel$/i` role name
and the leg refuses the point outright if it cannot find one, rather than reaching
for whatever else sits in the buttonpane — the control next to Cancel spends the
fixture.

Where the button is **greyed or absent** (TS13 and TS15 arrive extended, TS06 is
past the window, TS46/TS48/TS50 have no control), the three points are dropped at
runtime and reported under **NOT APPLICABLE** with the measured state that caused
it. That is the only runtime drop the recorder may make, and it is fenced three
ways — only those keys, only off a state the sidecar prints verbatim, and never
folded into the captured count. A checklist that shrinks to fit what a take managed
to film would let every take score full marks.

**2 — The R14 sweep now runs on every shape.** It used to come off any take that
performed no extension, on the reasoning that a take which changes nothing has
nothing to sweep. That is backwards: a take that changes nothing is the **only**
kind that can show the two surfaces are *stable*. Fourteen scenarios carried that
exemption and all fourteen lost it.

So R14 has two directions now, chosen by whether the take confirmed anything, and
both of them fail loudly:

| | Application Expiry Date | Remarks |
| --- | --- | --- |
| **confirmed** | MOVED, on the listing and in export col 13 | absent from both |
| **not confirmed** | UNCHANGED on both | unchanged on both |

The sweep used to *caption* the expiry and *assert* only the remark, so a take could
film an expiry that had not moved under a caption saying it had, and still tick
every point.

**And the export gained a BEFORE** (`export-before`). It had an AFTER leg and no
BEFORE one, so its baseline was the listing — a different surface. A surface read
once can say what it currently holds; it cannot say it did not move. The two
workbooks are now compared cell-for-cell on **both** columns, off the PowerShell
leg's own `ROW <r> COL <name> = <value>` output.

### One export, one window, both columns (27-08-2026, evening)

*"You can just export once to check both expiry date and remarks, no need to export
2 times."*

This reverses the split made the same morning, and the reversal is sound because the
**premise** moved rather than the principle. The split was made on a true
observation: Application Expiry Date is column 13 and Remarks column 23, so one
frame could hold only one of them and a caption asserting both was asserting half.
That is true of the sheet **as exported**. It is not true of the sheet **as shown** —
hide the 50 columns nobody is testing and both sit side by side with the application
number between them.

So R20 §3's two-halves rule is not repealed here, it is **satisfied**: a rule with
two halves still needs both halves in the frame that claims them; what changed is
that one frame can now do it. Three consequences:

- **The two trigger points survive**, ticked off the *same* still. Merging them into
  one would let a take that framed only one column score full marks.
- **Framing is measured, not assumed.** `open-xlsx-highlighted.ps1` reports
  `FRAMED <column> = True|False` from the window's own `VisibleRange`, and a column
  outside it fails *its own* point. Without that, this is the original fault wearing
  a tidier frame.
- **Hiding is a view change**, on a workbook opened `ReadOnly` and never saved, with
  the SHA-256 printed either side. The caption says so — a reviewer looking at a
  five-column sheet has to know why it is five columns.

Excel opens **twice** per take now (once per export) instead of three times, which
also takes ~15s of dead air out of the video.

Two traps worth keeping in mind if you touch that script: `AutoFit()` and any
assignment to `ColumnWidth` **unhide** the column they touch, so the width-capping
loop must skip hidden columns or it undoes the framing one column at a time; and the
multi-column parameter is a **pipe-separated string**, not `[string[]]`, because
under `powershell.exe -File` every argument arrives as one literal token — `'A,B'`
binds a one-element array holding `"A,B"` and then matches no header at all.

### The field the CR is about (28-08-2026) — `extended-remarks` / `extended-remarks-none`

*"all ts that click and confirm the extend, should include Application Extended
Remarks: field value checking in the details page rightsidebar"*, then *"all non
extend ts also need to include but to check the field is not showing"*.

Read the checklist as it stood that morning and the hole is plain:

| surface | what was asserted |
| --- | --- |
| listing Remarks column | remark **absent** (R14) |
| export column 23 | remark **absent** (R14) |
| audit log row | remark **present** (R18) |
| **details page sidebar** | **nothing** |

Two absences and an internal record. **A build that stored the remark and never
displayed it to a user would have scored full marks on every take in this rig.** The
one exception was TS11's `readback` — one scenario out of sixty.

The row was already here, as a *boolean*: five scripts test
`/Application Extended Remarks/i` against the sidebar text to decide whether a record
has ever been extended. None reads the VALUE, and a record whose row is present but
**blank** answers that boolean "yes, extended" while the remark itself is gone.

**Two keys, mirroring `audit-after` / `audit-none`.** `extended-remarks` on the 37
rows that Confirm — the row is showing and reads exactly what was typed;
`extended-remarks-none` on the 23 that do not — the row is not showing at all. One
key would let a take tick whichever claim it could reach. `check:points` fails a row
carrying both, neither, or the wrong one for its shape.

**The exception is measured, never listed.** Five rows arrive on an already-extended
fixture (`ARRIVES_EXTENDED`), where the row is *correctly* present with an earlier
remark in it — "not showing" would fail every one of them. So the recorder reads the
row BEFORE the take does anything and the claim is *unchanged*; on a never-extended
record unchanged **is** absent, which is the literal check. A hand-kept list of which
rows are which would drift the first time a fixture changed.

Three things `application.readExtendedRemarks()` refuses to do, each because this rig
has already been bitten by the alternative:

1. **It never reads from `body`.** `attachSpotlight` appends its caption to
   `document.documentElement`, and the caption for *this point* necessarily contains
   the words "Application Extended Remarks". The same fault on `Application No:`
   failed TS51 six times across three takes.
2. **It never returns a label as a value.** innerText puts each row on its own line,
   so an EMPTY row is followed directly by the next row's label and the obvious
   one-line regex returns **"Application Status:"** as the remark. Present-and-blank
   is a different finding from present-with-a-value.
3. **It never lets an unreadable sidebar look like an absent row.** `control` is true
   only when the same text also carried "Application No:" — the positive control, in
   the same reading. A dealer view, a stub (R19) and a dead support session all
   render no sidebar and all three would otherwise produce a confident "not showing".

It is bounded to **4 s**, not the default 30. The interesting cases for this reader
are the ones with no sidebar, and on those `innerText()` waits out the full
actionTimeout before returning the answer the caller already suspected — two reads
per take plus a re-open is two minutes of dead camera on exactly the takes whose
subject *is* the absence. Measured on the offline probe: 31 s -> 5 s.

```bash
npm run probe:remarks
```

Part 1 is free and always runs: a fake sidebar on `about:blank` in five states,
including the overlay trap — and it asserts the trap really fired, so the check could
have failed. Part 2 takes `--extended <appNo> --never <appNo>` and asserts the reader
returns **different** answers for the two records, which is what makes an "absent"
reading mean absent rather than blind. Read-only: it opens two pages and reads text,
so it spends no extension.

The assertion suite carries the same rule at its ten succeed-by-design call sites via
`app.checkExtendedRemarks()`, which reports and lets the caller assert — the same
contract as `extendState()`. `extend-surfaces.js`'s `extendVia()` is the suite's
control for it: absent before the click, present with the remark two lines later, in
one test.

Ceilings moved with all of this — **gating-plain 16+, gating-swept 13+, extend
16+**. `npm run check:points` asserts the floors and is the source of truth; the
numbers in this file are a copy and copies go stale.

The vault's **Evidence** section reads the same file back: it names the key shot
apart from the other stills, shows it as the hero frame of the take, prints which
of the three states it proves, and counts **takes missing the key shot** as an
alert — a take can otherwise film eight perfectly good stills of everything
except the thing under test.

## The on-screen checklist is a SUMMARY (28-08-2026)

Charmain, watching a take expand its trigger-points panel: *"make the trigger points
list showing on the recording short simple and clear, like a summary, now they are too
long that make the section very big when expand"*.

**Every point now carries two texts, and they answer different questions.**

| | who reads it | what it says | length |
|---|---|---|---|
| `short` | the RECORDING | a summary a person can take in during the ~1.9s the panel is open at 15fps | one line, **≤44 chars**, enforced |
| `label` | the sidecar + the summary `.txt` | the audit sentence — which column, which requirement, what would make the tick a lie | free |

Nothing was deleted. The audit sentence moved to where it is actually read.

### It was worse than "too big" — it was silently CLIPPED

Measured, not assumed — the panel rendered in a real browser at 1920x1080, both ways:

| take | before (full labels) | now (`short`) |
|---|---|---|
| gating-plain, 18 points | 304x580px, **156px of rows cut off** | 218x391px, nothing clipped |
| extend, 20 points | 304x580px, **294px of rows cut off** | 226x426px, nothing clipped |

`max-height:52vh` with `overflow:hidden` does not scroll and does not complain: rows
past the cap simply leave the frame. So the Sweep group — the R14 halves, the audit
row, the sidebar remark — was off the bottom of **every tick** of a full checklist,
and the panel was also 304px wide against the 300px the caption placer reserves for it.
Both faults were invisible from the log, the sidecar and the exit code. Only the pixels
had them.

### Three things changed with it

- **It fits, or it goes wide, never clipped.** The panel measures itself and reflows to
  two or three columns — the *"wide short band, never a tall strip up the side of the
  content"* the standard has always asked for, and only affordable once rows were one
  line each. Two triggers: content past the cap (the correctness bug) and a column past
  40% of viewport height (Charmain's actual complaint). It never widens past the display.
  Real takes run `viewport: null`, maximized to whatever screen the operator has, so
  `52vh` is a different number of pixels on every machine and *"it fits on mine"* is not
  a property of the rig. `cols` goes in the sidecar.
- **The caption reserves the MEASURED footprint.** It was a hardcoded 300 x 55%-of-
  viewport band — honest at 304x580, over-reserving ~190px of height once rows shrank.
  The panel publishes its open **size** (`__qaPanelOpenSize`); the placer reserves that
  at the panel's home corner. Size only, never the dodged position: reserve where the
  panel fled to and the two chase each other frame by frame.
- **The four R14 sweep labels stopped asserting the wrong thing.** They read a flat
  *"the Application Expiry Date cell, moved"* — written when the sweep belonged to
  extend takes only. Since 27-08 **every** recordable scenario sweeps, and on the 23
  gating rows the whole point is that the expiry did **not** move. Both branches are
  named now. `short` names the cell and no verdict at all, because one line cannot
  state a two-branch claim — on camera the verdict is the caption's job.

### What enforces it

`npm run check:points` fails on a point with no `short`, and on a `short` too long to
stay on one line. The renderer's `p.short || p.label` fallback exists so a point added
without one is still VISIBLE — not so it can be left out.

`npm run probe:still` asserts the geometry, at **1366x768 and 1280x720** as well as at
1600x1000, with 21 stand-in rows at the full 44-char ceiling: no row clipped, every row
one line, the reflow firing rather than the cap cutting, and a dodge not rewriting the
published home footprint.

## Traps this harness has already fallen into

Each one cost a run, and each is now guarded in code. They are listed because a
new spec that reaches past the helpers can re-open any of them.

- **`stage5Status` does not mean "registration documents were submitted".**
  It is *Hardcopy & Acc Created*, a LATER step, and filtering on it as a proxy
  for "has a registration-documents page" silently drops records that do have
  one. TS44 and TS08 both pick candidates this way and TS44 reported "6 with a
  page" out of 56 Approved. TS50 opened records the filter had excluded and found
  `NA68001097` and `NA68001095` each serving
  `/obs/admin/form/edit-registration-doc/<uuid>` at HTTP 200 with the Extend
  control on it — the true split is **9 / 29 / 18**. The damage is double-sided:
  the C8 population is understated, and "no candidate available" from those
  suites is not evidence that staging holds none.
- **A missing export column reads as an empty cell.** `columns[index - 1]` is
  `columns[-1]` when the header is not found, which is `undefined`, and
  `row[undefined]` is `undefined` too — so an assertion like *"the expiry cell is
  empty"* PASSES on a workbook that has no expiry column at all. Vacuous passes
  are the one failure mode a sweep must not have, so `exportSheet.cell(result,
  role)` throws instead, naming the columns it did find. Never read an export
  cell positionally.
- **`windowState()` takes the listing STRING, not a parsed `Date`.** It parses
  internally, so handing it a Date runs `/^\d{4}-\d{2}-\d{2}/` against
  `"Fri Nov 20 2026 …"`, matches nothing, and returns `unknown` for every record.
  The first TS50 run reported "0 of 3 sampled are inside the window" about
  records that plainly were, and a finding branch gated on `in-window` could
  never fire. Pass `now` as `dates.today()` too — the boundaries are local
  midnights, so `+now === +closesOn` is never true when `now` carries a time and
  the closing day quietly stops existing.
- **Take the Edit link from the ROW, not from the page.**
  `getByRole('link', { name: /edit/ }).first()` opens whatever sits at the top
  of the results. On the 25-08 run that quietly sent four different application
  statuses to the same Approved fixture, and TS02 duly reported an Extend button
  for "Draft" and "Rejected" — a false defect that looked entirely real. Use
  `listing.openRow(page, row)` / `listing.reopenRow(page, row)`.
- **The listing's Search is AJAX, and the count line is already on the page.**
  The single worst trap so far, because it produced a defect report against the
  application (26-08). `#to-search` serialises `#search-form` and fires a GET at
  `admin/form/enquiry/search`, then rebuilds the table in the success callback.
  The old wait — `getByText(/record\(s\) in total/i).waitFor()` — is satisfied by
  the count line the PREVIOUS search left behind, so every filtered search read
  the previous result set. The first status sweep therefore reported Draft rows
  coming back from the Pending filter, Re-evaluate rows from Approved, and a
  record count that belonged to the query before: a listing filter that looked
  comprehensively broken and was working perfectly. Probing it (`npm run
  probe:status`) showed the results lagging by exactly one query, which is a
  race, not a filter bug. `listing.submitSearch` now waits for the *response* to
  that request, then for the app's own `#overlay` (jQuery `ajaxStart`/`ajaxStop`)
  to drop, then for two identical reads of the rendered table 300 ms apart.
  Never click Search directly — go through `listing.search()`.
  **The wider rule: waiting for something that is already true is not waiting.**
- **Page one is not the population.** The listing renders 100 rows a page and
  paginates the rest, and `readRows` only ever sees what is rendered. The 25-08
  post-expiry census read page one of an *unfiltered* search, found 15 Expired
  applications and none beyond the 90-day window, and TS06/TS08/TS09 were filed
  as blocked on a dev date-patch for a fixture that could not exist. Filtering by
  Expired and walking the pages says **289** — 65 inside the window, 224 beyond
  it, and both the day-90 and the day-91 record TS08 needed. Use
  `listing.searchAll()` (same AJAX endpoint, `pageNo` walked from inside the
  page) before concluding that something does not exist on staging.
- **The empty state is a ROW.** A search with no matches renders one
  `<td colspan="100%">No records found matching your search criteria</td>`, which
  `readRows` counted as a data row — so a zero-result filter looked like a
  one-row result whose row had no Edit link. It surfaced in the 26-08 TS41/TS42
  sweeps as "COULD NOT OPEN — row 0 (unidentified)" where the honest answer was
  "no such application exists". Now dropped in `readRows`; always cross-check
  `rows.length` against the `total` a search returns.
- **A field that is not there yet is not a locator miss.** The sidebar's
  Assignee dropdown does not exist on a freshly submitted application — the
  approver's edit page renders UCD Group and Application Status only, with the
  value carried in a hidden `#assigneeUserIdHidden`. The visible
  `#assigneeUserId` appears once the record is further along. `assignApplication`
  used to route that into the assisted-miss hand-over and stop the build dead on
  a page that was behaving correctly; it now reports
  `{ assigned: false, stage }` and `approve-app` retries once the control is
  there. Ask *"is this field supposed to exist at this point?"* before hunting a
  better selector. (A `css` hint of `select[id*="assignee" i]` also matched the
  hidden input — hence the `:not([id$="Hidden"])` guard.)
- **Bank the identity before the risky act.** The `assign` phase learns the
  Application No — the expensive half — and used to write its checkpoint only
  after assigning, so a failed assignment threw the number away and the resume
  re-found a record it had already found. Checkpoint what you have learned as
  soon as you learn it.
- **The Application Form's TIN check is acknowledge-once.**
  `validateTinAgainstBrn()` runs inside the "Unsaved Changes" dialog's confirm
  handler: the first call stores `tinMismatchAckKey` (TIN|regNo), shows *"The TIN
  is invalid... Click Next to proceed"* and returns **false**; the second call
  with the same key returns true and the draft saves. So step 1 needs
  **Next -> Save & Continue, twice over**. The old code did
  next -> saveContinue -> next and stopped one click short with a dialog still
  open. Generated TINs never validate against a generated BRN, so **every**
  fixture hits this. Advancing a step is now a cycle of up to
  three attempts, not a fixed run of clicks.
- **A Draft row has no application number.** Searching for `''` matches every
  numberless row, so `findByApplicationNo` now refuses a blank argument.
  Rows without numbers are re-identified by company name.
- **A 404 is not a blank page.** `/form/edit-registration-doc/<uuid>` returns
  "404 - NOT FOUND" for an application whose registration documents were never
  submitted. That used to surface as "blank even after re-entering through the
  menu", i.e. as a session failure. `gotoObs` now throws `OBS_NOT_FOUND` and
  `app.goto` falls back to the Application tab and says which tab it reached.
  Extend only ever renders on the registration-documents page, so a row without
  one is *out of scope*, not a missing button.
- **Tab names must be exact.** `name: 'Application'` also matches
  "Pre-Application"; `.first()` then picks the active tab, whose href is `#`
  and whose parent div swallows the pointer — a 20-second timeout that reads
  like a broken tab bar.
- **The `/obs` session handoff.** Direct navigation to `/obs` returns 39 bytes
  of blank HTML until one menu click has happened in the session. Always
  navigate through `src/obs.js`, never `page.goto`.
- **Never wait on a page lifecycle. These pages do not finish loading.** The
  Rejected record read as a 30-second hang twice — once on `load`, then again on
  `domcontentloaded` after the first "fix". Probed on 26-08 with no wait
  condition at all, it returns its whole 252 KB document in **1.2 s**; what never
  happens is `readyState` leaving `"loading"`, because ~48 static assets
  (`/web/jquery/*`, the `/uat4` toolbar images, `/obs/js/jquery-2.2.4.min.js`)
  never answer. Neither lifecycle event ever fires, so waiting for one waits for
  an image. Use `obs.gotoDocument()` — it commits the navigation and polls for a
  document big enough to be real — and, in `listing.openRow`, `waitUntil:
  'commit'` plus a DOM-size check. This is not Rejected-specific.
- **Nothing may hardcode an instance in a URL.** `src/obs.js` used to carry
  `HOME = BASE + '/uat4/home/'`. Logged into `/eauto`, `enterObs` walked to the
  *uat4* home, bounced to a login page, and reported "no UCD Application Listing
  item in the Onboarding menu for this account" — a permissions story for what
  was a wrong-instance navigation. It now reads `BASE + '/' + INSTANCE +
  '/home/'`. Treat any other literal instance in a path the same way.
- **Look at a picture before writing down a design delta.** Two "findings" so
  far were manufactured by reading the DOM as though it were the screen: the
  phantom Extend on Draft/Rejected above, and C6's modal ×. Both were plausible;
  both died to a screenshot in under a minute.

- **…and the mirror image: some real text is invisible on purpose.** The
  once-only message is a HOVER tooltip — `.extend-tip` inside
  `span.extend-wrap`, `display:none` until `.extend-wrap:hover`. `innerText()`
  returns nothing for it, so reading it "the visible way" would have failed TS03
  on a perfectly correct build. `extendMessage()` takes it from `textContent`.
  The same fact bites evidence: a screenshot of the greyed button does not show
  its reason unless the mouse is parked on it, so TS36 has to hover — and so does
  the recorder's own key shot, which is why `90-evidence.spec.js` hovers before
  framing a greyed control (see the section above).

- **A dump written to a FIXED filename is destroyed by its own next run — and the
  date-sensitive probes here are exactly the ones that cannot be re-taken.** Twice
  on 27-08-2026, in two sessions, inside an hour: `81-boundary-day.json` (the
  closing-day capture EAINT-12231's sibling ticket rests on) and
  `98-pool-census.json` (the pre-fix shortlist reading). One came back off a
  transcript, the other only as a summary. `src/archive.js` now moves the previous
  file into `discovery/archive/` under **the timestamp it describes** (`ranAt`/`at`,
  falling back to mtime), with a `__n` suffix so two runs on the same day do not
  collide. Wired into every evidence-writing probe. The two `hold-*.js` scripts are
  deliberately NOT guarded — their output is a capture handshake, re-derived every
  run, and archiving it is clutter rather than preservation.

- **`listing.ANY` does not mean "widen to All" — it means "leave the filter
  alone".** `search()` skips any key whose value is `''`/`null`/`ANY`, so
  `search(page, {applicationStatus: listing.ANY})` is a NO-OP. The listing's status
  filter is sticky server-side and survives the full page load in `listing.open()`,
  so a run that reads Approved and then looks up an Expired record by number gets
  0 rows — and passing `ANY` to clear it changes nothing. Sweep the records that
  match a filter while that filter is still the most recent search.
  **Checked by hand 27-08-2026 and it is NOT a product defect**: the dropdown
  honestly shows `Approved` throughout, and a human who selects All and searches
  gets their record. UI and server agree. Do not raise it without repeating that
  hand check.

- **THROW ON NOT-FOUND, and assign the observation only after the read succeeds.**
  This is the rule the two traps above both reduce to, and it is worth more than
  "widest search first" because a throw is enforced and an ordering convention has
  to be remembered. `findByApplicationNo` throws on 0 rows; `probe-boundary-day`
  wraps each record and sets `row.error`, leaving `buttonPresent` **undefined** —
  so a stale filter can never manufacture "no button", and because `onClosingDay`
  is set in the same try, an errored row can never be picked as the boundary
  record either. The dangerous shape is any probe where a missing row falls
  through to a falsy default. **It applies to aggregate counts too**: a run that
  printed "0 of 22 have a registration-documents page" had actually failed to open
  22 of 22. A count that does not separate *observed false* from *never observed*
  is the same bug wearing a different hat.

- **A 403 with an EMPTY BODY is not evidence of a refusal — it is the shape of a
  request that never arrived.** Three separate places now: the audit log answers
  a pasted URL that way (R18), and `probe-extend-endpoint.js` did it twice on
  26-08. Run 1 of that probe POSTed `admin/form/extend` at an ineligible record
  with **no CSRF header**, got 403-empty, and reported *"refused server-side —
  the endpoint enforces, it does not merely render."* **That was a false pass.**
  Spring Security rejects a missing token with exactly that signature *before*
  the handler runs, so the record was never evaluated. Every `/obs` page sets
  `const csrfToken = "…"` in an inline script and installs it via
  `$.ajaxSetup`, so the sidebar's own call carries it; a hand-built replay that
  omits it is a replay of nothing. The probe now **scrapes the token and refuses
  to send without one** rather than producing a meaningless result.

- **…and in the same script, a comparison that could not fail.** It read the
  row's expiry as `applicationExpiryDate`. The field is **`expiryDate`**
  (`src/listing.js` COLUMNS). So it got `undefined`, compared `undefined` to
  `undefined`, and declared the record unchanged **without ever reading the one
  value an extension moves.** Two defects, one script, both pointing the same
  way: **a negative assertion whose PASS branch is reachable by a request that
  never happened, or a field that does not exist, is a coin flip that always
  lands on green.** Every negative check here needs a positive control in the
  same run, or an explicit note saying it lacks one — which is why the Q19
  finding is recorded as "a good signal, not a proof" until the grand tour
  supplies a call that *succeeds*.

## What this harness cannot do

- ~~**the tick is reusable**~~ — **NOT reusable. Re-measured 26-08-2026 evening,
  and this is the single biggest constraint on the ticket.** `npm run check:gate`
  restored `.auth/preapp-state.json`, asked for `/obs/preOnb/form`, and was
  bounced to the gate; asking `/obs/preOnb/recaptcha` got the widget again. Its
  verdict, verbatim: *"NOT REUSABLE — the gate is enforced per build, so every
  fixture needs a human at the keyboard for the tick."*

  The 24-08 entry above claimed the opposite and was believed for two days. It is
  left struck through rather than deleted, because the difference between "one
  tick ever" and "one tick per fixture" is the difference between a pool that
  fills itself overnight and one that costs a person an afternoon.

  **So fixture supply, not scripting, is now what limits this ticket**, and the
  one route there is does not escape it:

  | route | captcha | fees | works? |
  | --- | --- | --- | --- |
  | pre-application (the only one) | one tick PER BUILD | RM 108 + RM 990 | **yes**, all 11 phases (fx-260826-1408-024 → NA68001101) |
  | ~~`backoffice`~~ **closed 27-08 (R22)** | none | RM 990 only | **no** — stalled at `approve-app` |

  The BackOffice route was closed by Charmain's ruling that every transaction be
  created from the Pre-Application Form, and it had already failed on its own
  terms: the assignee's edit page carries no "Submit for Approval" button, so the
  record never leaves Pending and the approver then has no Approve button.
  Reproduced 26-08 20:59 on **NA68001102**. **Do not reach for the Application
  Status dropdown to get past it** — that was tried and it produced NA68001100:
  Approved on the listing, every workflow column `-`, no expiry at all, dealer
  step 4 still server-side read-only. That record is the R19 stub TS51 is written
  about. The dropdown sets the FIELD; the button runs the WORKFLOW.

  **The ask worth making is Google's published reCAPTCHA test keys on staging.**
  One environment change makes the whole pool unattended, and it is a better use
  of the conversation than anything QA can do from this side.
- **The payment gateway logins come from the shared store.** Fiuu's bank
  simulator asks for a username and password; `FIUU_SIM_USER` / `FIUU_SIM_PASS`
  in `~/.claude/secrets/eauto.env` covers it, typed only on
  `bank-simulator.fiuu.com` and nowhere else. That pair IS filled, and it works —
  both payments in the 26-08 build drove themselves. So the reCAPTCHA above is
  genuinely the only hands-on step left in a public-route build.

- ~~**Expiry dates cannot be patched from here.**~~ **No longer true (26-08-2026)
  — Q12 is answered.** The support tool at
  `http://172.30.202.23:8888/eauto-support/obs/reset-expiry` takes an application
  trx no and an expiry date and sets it, so TS05/TS08/TS09 and the C8 and Q39
  probes now run on demand instead of waiting for the calendar. See **Patching an
  expiry date** below. The remaining limit is narrower and worth stating
  precisely: it needs the **VPN**, it is behind an **ADMIN-only portal sign-in** of
  its own, and it sets a **date** — the time of day comes from the record's
  existing expiry, which it preserves. So the sub-day half of TS08 (.4/.5) is
  reachable only at whatever time of day the fixture already carries; you choose
  the fixture, not the clock.

- ~~**TS19 cannot be proved by automation**~~ — **it can, since 26-08-2026
  evening: the environment sends into Mailtrap.** Charmain: *"the email part can
  check in mailtrap, as long as there is no email sending after the extension then
  should be pass, just check 1 or 2 should be sufficient."* A mail **catcher**
  beats the mailbox this entry was built around: it intercepts the whole outgoing
  stream to any address, so it covers the **BackOffice-user half of REQ-009** that
  no dealer inbox could, and "nothing for this application" becomes a statement
  about everything the system tried to send.

  The **negative control** that made this look unautomatable also got cheaper —
  and then it turned out to already exist. It never needed a known-mailing action
  on a second fixture: the environment generates mail continuously, so the
  catcher's own recent traffic is the control. **TS19 passed on 26-08 evening**
  from a browser read of the `modefair` sandbox, with mail arriving 7 minutes
  before the check and a complete fixture run 3 hours before it.

  Two ways to read it, and they are for different jobs. **By browser (how the pass
  was obtained, and what Charmain asked for):** open the sandbox, search the
  application number, confirm nothing since the click. No token, nothing stored.
  **By token (`src/mailtrap.js`, for unattended runs):** set `MAILTRAP_API_TOKEN`
  and `MAILTRAP_INBOX_ID` in `~/.claude/secrets/eauto.env` and the assertions ride
  the two extensions the suite already spends. Without them they **skip with a
  readable reason** — "no token" and "no email" must never look the same.

### Reading the catcher — the four things that bite (31-08-2026)

All four were found by walking the sandbox by hand in Charmain's own Chrome,
read-only. Three of them were faults in the recorder's own leg.

1. **The inbox route is `https://mailtrap.io/sandboxes/<id>` with NOTHING after
   it.** `/sandboxes/<id>/messages` is a 404 and so is `/inboxes` — the recorder
   built the first of those for a week. `/messages/` only works followed by a
   message id. Reached in the UI through Email Testing -> Projects -> modefair;
   the route redirects to `.../settings` with the list in the left pane either
   way. Override with `MAILTRAP_INBOX_URL`.

2. **The timestamp on screen is UTC and nothing says so — MYT minus 8.** Measured
   on two messages: the header bar read `2026-08-31 00:00` where the mail's own
   `Date` header read `Mon, 31 Aug 2026 08:00:06 +0800`. TS19's whole argument is
   arrival time against click time, so **read the `Date` header** (Show Headers ->
   Email Headers) or the list's relative "N ago", which IS local. Never quote the
   header bar.

3. **An error page is not an empty inbox.** `signedIn()` tests for the words "sign
   in", which a 404 does not contain — so a wrong URL read as a readable mailbox
   and `mailbox-before` would have ticked green over it. `mailtrap.inboxScreenState()`
   is four-valued (`error` / `login` / `empty` / `inbox`) for that reason:
   collapsing the first into the third writes the wrong cause into the sidecar.

4. **The sandbox is perishable — 586 of a 600 cap, oldest evicted.** Evidence here
   ages out. So an absence is only evidence when the same search returns the
   record's OTHER mail: `mailtrap.reminderVerdict()` **refuses** a zero-row result
   rather than passing it, because zero cannot tell "no reminder was sent" from
   "nothing for this record is in the catcher".

Points: TS19 carries `mailbox-live` / `mailbox-before` / `mailbox-after` across its
own Confirm. **TS21** and **E2E_TS10** carry `mailbox-reminder-none`, and **E2E_TS9**
carries `mailbox-rearm` — one search each of a record whose cron night is already
over, driven through the inbox's `quick_filter` box. Two keys because the claims
differ: on a Registered record any reminder is the fault, whereas E2E_TS9's cycle
was RE-ARMED by the extension (11868 v1.4 §2.2.4 item 8), so there the date inside
the mail decides and the leg refuses rather than asserting.

```bash
npm run mailtrap:signin      # ONCE per session — saves .auth/mailtrap.json
npm run probe:mailbox        # the decision proved offline, 37/37, including refusals
```

**Sign in before you film, not during.** The catcher window is opened with no
cookies, so without a saved session a take stops in the MIDDLE of the recording
and waits for a person — a login page and a wait, in frame. `mailtrap:signin`
opens a browser, you sign in yourself, and only the session cookie is written to
`.auth/mailtrap.json` (gitignored, same treatment as `support.json`). The rig
never sees the password and never types one.

Signing in ON THE SPOT is also fine, and is the default: a take with no saved
session hands you the Mailtrap window mid-recording and waits. Nothing is spent
while it waits. The saved session is an optimisation — it removes the pause, it is
not a precondition.

What the take does do is TELL YOU UP FRONT, before `pool.take()` reserves a fixture,
so "you will be asked to sign in" arrives before the recording rather than three
minutes into it. A missing `MAILTRAP_INBOX_ID` is the one hard refusal — that cannot
be fixed on the spot, because there is no inbox to open at all. Sessions expire: a
take that suddenly pauses again has a stale state, not a broken route.

The gate covers exactly the four rows that read mail — **TS19, TS21, E2E_TS9,
E2E_TS10** — and nothing else.

## Patching an expiry date (the support tool, 26-08-2026)

```bash
npm run expiry:states                 # what each boundary resolves to TODAY
npm run probe:support                 # dump the form, print the lines to pin
npm run set-expiry -- --app-no NA68001099 --state opens-tomorrow
npm run set-expiry -- --app-no NA68001099 --date 2026-05-26 --dry-run
EV_ALLOW_EXPIRY_PATCH=1 SUPPORT_APP_NO=NA68001099 npm run test:patch
```

`http://172.30.202.23:8888/eauto-support/obs/reset-expiry` takes an application
trx no and an expiry date and sets it. That is **Q12**, and Q12 is what filed
TS08.4/.5, TS09 and TS22 as blocked with the note "nothing on the QA side can
patch an expiry date". Something can.

**Name the boundary, not the date.** `--state` runs `src/dates.js` *backwards*
through the same `windowState()` the assertions read, so a fixture and the test
that judges it cannot disagree about where the window is. Computing the date by
hand is wrong in both directions: the window's two ends count in different units
(30 **days** before expiry, 3 **calendar months** after), and the far end clamps
at month ends, so "today − 90 days" misses the closing day by up to two days —
the exact size of the boundary under test. Targets: `in-window`,
`expires-today`, `opens-today`, `opens-tomorrow`, `before-window`,
`expired-in-window`, `closing-day`, `closed-yesterday`, `after-window`.

Some targets are **unreachable on some days**, and the tool says so rather than
substituting a neighbour: nothing closes on 31 December, because 31 September
does not exist. That is the calendar, not a bug.

### It is behind its own sign-in (found 26-08-2026, first connected run)

`/eauto-support/obs/reset-expiry` answers **302 → `/eauto-support/login`**. That is
a Spring Security form (`_csrf`, `username`, `password`, `remember-me`) belonging
to a *separate* application — "eAuto Support Portal — Internal Developer Support
Platform", footer "Internal use only. Contact IT Support for access". **An eAuto
BackOffice session does not open it.**

The credential lives in the shared store (`~/.claude/secrets/eauto.env`), never in
`automation/.env`, and there are two ways to point at it — never both, because a
second copy of a password drifts and then whichever the code reads is the one that
decides:

```
SUPPORT_ACCOUNT=ops_jasons        # the portal accepts an existing eAuto login
SUPPORT_USER= / SUPPORT_PASS=     # the portal has its own user list
```

The form offers *Remember me for 7 days*; the harness ticks it and saves the jar
to `.auth/support.json`, so the sign-in is roughly weekly rather than per run —
the same trick that made the reCAPTCHA gate a once-per-session cost. `npm run
probe:support -- --no-signin` observes the gate instead of passing through it.

**A login page is not a broken form.** The first probe reported "trx: not found on
the page at all" about somebody else's sign-in screen, which is the same class of
error as diagnosing an off-VPN host as a slow server. Two fixes came out of that
run and both are load-bearing: the page is now judged on its **body**, not its
byte count (this portal's `<head>` carries a blocking `cdn.tailwindcss.com`
script, so for a few hundred milliseconds the document is a complete-looking
563-byte page with *no body at all*), and the gate is detected by URL as well as
by a password field found via id/name/autocomplete — Alpine binds this one's
`type` attribute only after parse, so an early read sees a plain text input.

### What it actually is: a 3-step wizard (measured 26-08-2026)

Not a form. An htmx wizard that swaps `#flow` in place:

| Step | What | Endpoint |
| --- | --- | --- |
| 1 | `#applicationNumber` + Search | `POST /eauto-support/htmx/obs/reset-expiry/validate` |
| 2 | the record's real details + `input[type=date]#newExpiry` (pre-filled with the current expiry) and a live **Resulting expiry** preview | `POST …/reset-expiry/execute` with `confirmed=false` |
| 3 | "Are you sure?" → the write | same form, flag flipped |

`support.lookup()` stops at step 2 and is worth having on its own: it is the only
surface QA has that shows `obs_application.expired_at` to the **microsecond**
(`2026-12-22T21:10:17.357665`) — the listing renders it to the minute — plus the
status, created date and company, with no BackOffice login.

Four sentences the tool says about itself, each of which changes a test:

- *"Sets `obs_application.expired_at` to a date you choose (any date; a past date
  warns, never refuses)"* — so **every** target in `--list-states` is reachable.
- *"Does NOT reactivate an EXPIRED/REJECTED application — it only changes the
  date"* / *"the application status is never touched"* — it moves the date
  **underneath** the record's existing status. That is exactly what the gating
  tests want, because they are about the button and not about the status.
  ~~And it means TS06 still cannot be manufactured this way: a genuinely
  Expired-*status* record beyond the window has to be found, not made.~~ —
  **superseded 26-08-2026 night; see "Manufacturing a status" below. The tool
  is half the machine.**
- *"time of day preserved from the current expiry"* — **this is what makes Q39
  testable.** Proven by moving a fixture one day and back: `21:10:17.357665`
  survived intact, so a patched fixture can be probed either side of its own time
  of day, and the `afterAll` restore is exact rather than approximate.
- *"Automatic full-row backup created before the change (kept indefinitely)"* — a
  mis-patch is recoverable from the tool's own backup, not only from our restore.

It also **short-circuits an identical date** ("Expiry date is already … No change
applied"), which `setExpiry` reports as outcome **`no-change`**, not `success` —
that sentence matches the success pattern while meaning the opposite, and a
fixture setup must be able to tell "it is where I wanted" from "I moved it there".
`--allow-same` re-writes the current date deliberately, which is how the path gets
exercised without moving anything.

### Manufacturing a status: the tool owns the date, the cron owns the status

Charmain, 26-08-2026 night, on E2E_TS3: *"you can actually simulate with the
support tool, make the expiry date today and wait until the next day cronjob run
will pickup the trx and update to expired. same applies to all related ts."*

The bullet above had been read as a limit on the *feature*, and it is only a
limit on the *tool*. The auto-expire job is a **daily cron at midnight** (R12)
and it reads the date this tool writes, so QA controls its input:

```bash
npm run set-expiry -- --app-no <no> --state expires-today   # the tool: DATE
#   ... first midnight ...                                  # the cron: STATUS
```

| Want | Route | Nights |
| --- | --- | --- |
| Expired, inside the window | `--state expires-today`, one midnight | 1 |
| Expired, **beyond** the window | **two-hop:** `expires-today` → midnight → `--state after-window` | 1 |
| Expired on an already-extended record | extend, then patch the **extended** expiry to `expires-today`, one midnight | 1 |

**The two-hop works because of the very sentence that looked like the blocker.**
The tool never re-statuses, so once the cron has written Expired, moving the date
underneath it leaves the status alone. **Cron first, tool second** — the other
order depends on a scan predicate nobody has measured (does the job sweep every
past-expiry row, or only the ones that crossed over last night?). Worth finding
out: patch one fixture straight to `after-window` and see. Either result is a
measurement.

**Do not expect the reverse.** Patching an Expired record's date into the future
does not restore Approved. Only an extension does (REQ-007/R16), and that flip is
the thing under test, not a fixture tool.

**Two things still genuinely outside the tool.** The **time of day** — no field,
so TS22 must choose a fixture whose existing time suits it. And the
**extension** — TS07/E2E_TS4/E2E_TS6 need one spent by a real click first.

**The false pass this prevents, which matters more than the unblocking.** A date
patched into the past does *not* make a record Expired the same day. So any case
whose subject is the Expired → Approved flip — TS05, TS47, E2E_TS2, TS16,
E2E_TS7, TS34 — run on a same-day patch reads **Approved before the click,
Approved after, and passes having proved nothing**. Read the status *before* the
click and record it.

**And it turns three overnight assertions into evidence.** E2E_TS9, E2E_TS10 and
TS21 all assert that something did *not* happen overnight, and all of them pass
if the cron never ran. `tests/extend-overnight.spec.js` now arms a **control
pair** — `CRON_CONTROL_APP_NO` (not Registered) must read Expired by morning,
`CRON_CONTROL_REGISTERED_APP_NO` must not. The pair proves the job fired *and*
that it skips Registered rows, which is the half of R12 the census could only
reach by non-interleaving. The non-Registered control then becomes the
TS06/E2E_TS3 fixture with one more patch — and unlike any found record, its
"never extended" is a fact rather than a sidebar reading.

### Four things this wiring refuses to do

- **Run off VPN.** The host is a private address. Every entry point TCP-probes it
  first (`src/vpn.js`) and exits **2** with a message naming FortiClient, because
  Playwright's own diagnosis of an unroutable host — `Timeout 30000ms exceeded` —
  reads as a slow server, and behind a captive DNS the page *loads* with no form
  on it and the harness reports a missing feature on a page it never reached.
- **Guess at the page.** The operation drives the wizard's real ids
  (`#applicationNumber`, `#newExpiry`, the execute form) — no scoring. That matters
  because the scorer, run against the live page, nominated the sidebar's **"eSTM"
  nav button** as the submit: a heuristic good enough to explore with is not good
  enough to write with. `npm run probe:support` still scores the page, but only to
  report drift, and it exits non-zero when step 1's selectors stop resolving.
- **Believe the tool's own success banner.** A banner is a claim about a request.
  The **UCD Application Listing** is the only surface that shows expiry (C2), so
  every patch is read back off it, and `set-expiry` exits non-zero when the
  listing disagrees. `support.patch()` throws outright — a spec that continues on
  an unverified patch produces a confident wrong answer about the feature.
- **Guess which record to change.** `--app-no` is required and is deliberately
  *not* defaulted from `APP_NO`/`EXTEND_APP_NO`. A mutating command that reads its
  target from the environment will one day move the wrong fixture's expiry. Every
  patch also appends a line to `discovery/96-expiry-patches.jsonl`, so "who moved
  this fixture" has an answer.

### What the patch suite proves, and what it only records

`tests/extend-expiry-patch.spec.js` is opt-in (`EV_ALLOW_EXPIRY_PATCH=1`, same
reasoning as `EV_ALLOW_ROLE_SWITCH`: it mutates a record other people's runs may
be using) and restores the original expiry in an `afterAll`. Patching the expiry
does **not** spend the extension (R1), so one fixture serves the whole file.

The **first test is a positive control** and runs first on purpose — a fixture
patched into the window must show an enabled button. Without it, every absent
button in the later tests has a second explanation ("the patch broke the record")
and the file proves nothing; it is the same discipline TS19 needs.

`TS08.4` then asserts the **requirement** — no button the day before the window
opens — which means **it fails while C8 stands** (the build was measured opening
the window ~88 days early). That failure, on a fixture patched to a known date, is
the reproducible C8 evidence the earlier measurement could not be. Do not loosen
it. `Q39` is the opposite: it **records** what the build does on the closing day
and asserts nothing, because the date-vs-timestamp reading is unresolved and
asserting either would hide a real off-by-one or fail green builds daily. It also
reports whether the patch preserved the record's time of day — if the tool writes
`00:00`, no patched fixture can test the timestamp reading at all, which is worth
knowing before anyone plans a run around it.

## The role model (measured 26-08-2026)

```bash
npm run probe:rolemap     # read-only: every stored login's real BO role
npm run probe:roles       # preflight; add -- --write --roles Probation to switch
npm run dump:useradmin    # the BO user-admin screens on this instance
```

This build has **three** BackOffice roles, and QA's own labels were hiding it.
The user-account listing's `userRole` filter and the edit screen's `role` radios
both offer **Admin · HubAdmin · Probation** and nothing else. "CSE", "Ops" and
"Finance" are the credential store's labels for whose login it is; the system
does not know them.

**"Superadmin" is `jasons`** (Charmain, 26-08-2026) — the team's name for that
account, not a fourth role. Its role is HubAdmin, TS15 already sweeps it, and it
comes back with the button present and enabled. There is nothing extra to test,
and the question that was drafted for the BA about it has been withdrawn.

| System role | Staging | Reaches the module | Extend |
| --- | --- | --- | --- |
| HubAdmin | 126 | yes | yes, unless the username is on REQ-004's list |
| Admin | 69 | yes | yes, unless the username is on REQ-004's list |
| Probation | 47 | **no** — no Onboarding group in the menu | never renders |

Both Admin and HubAdmin hold REQ-004-blocked *and* unblocked accounts, which
proves the block is a **username** check more strongly than `eautomie` alone
did: same role, opposite outcomes. Probation is the one genuine role gate.

Two traps in that measurement, both recorded in the scripts:

- **Login ID is cell 1 of the user-listing row, not cell 0** — cell 0 is the row
  number. Matching on cell 0 matches nothing and the first attempt at this hung
  with no output at all.
- **A refusal on a direct `/obs` URL is not a permission result.** The Probation
  take got HTTP 403 on `/obs/admin/enquiry`; so did the HubAdmin control run
  immediately after the restore, because `/obs` needs the menu-click session
  handoff (`src/obs.js`). The menu absence is the finding; the 403 is an
  artefact of how the probe navigated.

**The Probation gate is asserted, not just measured — TS48.** It lives in the
suite rather than in the script, and it checks **two** things, because on a page
that never opens "no button" is true for a reason that has nothing to do with
this feature:

```bash
EV_ALLOW_ROLE_SWITCH=1 ROLES_APP_NO=NA68001099 npx playwright test extend-roles --grep TS48
```

Passing as of 26-08-2026 (25.5 s): no Onboarding group, no listing item, the page
does not open, no Extend button, not even a hidden one — and BOChar restored with
`isOnboardingAssignee` unmoved. The TS15 sweep carries the same assertion for any
Probation login that ever lands in the credential store, and it fires *before*
the REQ-004 username pair so a role gate is never recorded as an account gate.

Both TS48 and `probe:roles --write` switch a **shared** UAT account's role, and
both go through `src/boRoles.js`, which addresses the subject by URL, matches the
login id exactly (`BOChar1` is a different account, already on Probation),
touches only the `role` radio, reads `isOnboardingAssignee` before and after,
restores in a `finally`, and verifies the restore on both the edit screen and the
listing row. TS48 needs `EV_ALLOW_ROLE_SWITCH=1` so it never rides a plain
`npm run test:roles`, and a failed restore fails it with a message telling you to
fix the account by hand — otherwise the next person to notice would be debugging
their own suite.

## Layout

```
src/accounts.js      shared credential registry (portable copy, do not edit)
src/env.js           base URL, instance, screen URLs, role mapping
src/login.js         instance login + the silent-auth-failure guard
src/obs.js           the /obs session handoff + the 404-vs-blank distinction
src/listing.js       UCD Application Listing — search, read rows, open a ROW, read expiry
src/application.js   detail page, sidebar, Extend button state, the modal (ground truth),
                     plus assertRealApplication() — refuses a BO-generated STUB as a
                     fixture (R19) instead of reporting 'no Extend button'
src/pool.js          fixture pool — hand out, record, release an unspent fixture
src/assist.js        hint-list locators for unobserved screens; dumps on a miss
src/preapp.js        UCD side — the gate, the pre-application form, FPX, uploads
src/onboarding.js    BackOffice side — approve, submit for approval, Verified
src/fixture.js       the unique dealer per run, and the phase checkpoints
src/boRoles.js       BO user roles — read one, switch it, restore it (TS48 + probe:roles)
src/auditLog.js      the UCD Application Audit Log (R18) — the /obs handshake, the
                     mandatory date range, the JSON endpoint, and checkExtendEntry()
src/mailtrap.js      the mail catcher TS19 reads (REQ-009) — both Mailtrap API
                     shapes, checkNoMailSince(), and the liveness reading that
                     keeps an empty-inbox pass honest
src/triggerPoints.js the checklist — CORE + per-scenario EXTRA, the three shapes and
                     their ceilings. TWO texts per point: `short` for the recording,
                     `label` for the sidecar (see the 28-08 section above)
src/spotlight.js     the in-page overlays — ring, caption, cursor, and the trigger-point
                     panel that measures itself, reflows to columns and dodges the
                     evidence rather than covering it
src/annotate.js      the banner, the narration footer and the step/verdict state
src/vpn.js           TCP preflight — is the VPN up, and say FortiClient if not
src/support.js       the eAuto support tool: find its form, set an expiry, verify it
src/dates.js         the window's arithmetic — 30 days before, 3 CALENDAR months after
                     (month-end clamped), the inverse (expiryForState) that turns a
                     named boundary into a date to patch, and rulesDisagreeOn() which
                     finds the expiry that makes 90-days and 3-months disagree TODAY
src/exportSheet.js   the listing's Export as a readable workbook, and the R14 two-surface
                     sweep eight scenarios carry. Resolves columns by HEADER, never by
                     position, and reports drift from the 26-08 baseline (13/19/23 of 55)
src/endpoint.js      POST admin/form/extend, built by hand. REFUSES to send without the
                     CSRF token — a 403 without it says nothing about eligibility, and
                     reading one as enforcement nearly closed Q19 on a false pass
scripts/check-login  does each stored password still work
scripts/discover     ground-truth capture, modal included (never confirms)
scripts/build-fixture  one dealer, gate to Approved, resumable
scripts/probe-types    can each business type be driven? (no payment)
scripts/check-gate-reuse  is the saved reCAPTCHA session still good?
scripts/hold-regdocs      park an application at Verified so Extend stays visible
scripts/check-access      which screens does each stored account reach (Q6)
scripts/probe-bo-role-map does the whole role census, read-only (Q6, REQ-004)
scripts/probe-bo-roles    switch one account's role and put it back (Probation)
scripts/dump-user-admin   the BO user-admin screens on this instance
scripts/probe-support-tool  dump the reset-expiry form, print the selectors to pin
scripts/set-expiry        set one application's expiry, by date or by named boundary
scripts/probe-extend-endpoint  fire admin/form/extend by hand at an INELIGIBLE record
                     (Q19 / TS26 / TS51.8). Carries the X-CSRF-TOKEN, refuses to send
                     without it, and reads the row before and after
scripts/build-pool         census staging FIRST, build only the shortfall. Auto-enrols
                     only records the rig created — an eligible record is not an
                     unclaimed one, and spending someone else's costs them their only
                     extension (R1). --include-foreign to override, deliberately awkward
scripts/build-date-fixtures  every boundary fixture in one command, by NAMED boundary
                     rather than by typed date. Says plainly which three (TS06, TS07,
                     E2E_TS4) patching cannot produce, and why
tests/               the suites
discovery/           dumps + locators-learned.json — read this before writing specs
fixtures/            checkpoints, profile.json overrides, generated upload files
.auth/               the saved post-reCAPTCHA session (never committed)
```

---

## 27-08-2026 — the evidence batch, and what it found

Nine gating takes recorded (nothing spent — no take reached Confirm). Eight scored
their full ceiling. Then the batch found something none of them was looking for.

### C8 re-measured: the window rule changed mid-batch

`NA67001077` carried an enabled Extend button at 12:14 and none at 13:01, with
`Application Status` and `Hardcopy & Acc Created` identical either side and no
extension performed. A six-record sweep at 14:40 splits perfectly on **30 days** —
`NA66001071` (14 days out) shows the control, everything from 34 days out does not.
The lower bound now behaves as REQ-003 specifies. **C8 looks fixed; not closed,
because nobody has confirmed a deploy.** See `FIXTURES.md` and vault C8.

Consequence for the pool: fixtures built when the button appeared ~88 days early
are mostly **out of window** now. `NA66001071` is the only known-good in-window
subject, and there is **no already-extended in-window record at all**, so TS03 and
TS07 have no fixture until one is patched with `npm run set-expiry`.

### R21 — the assertion that was missing

The recorder ticked `extend-state` for whichever state it filmed, and nothing
asserted that it was the state the scenario claims. TS01 scored 12/12 over a page
with no Extend control on it. `src/expectedState.js` now declares the expected
control state per scenario and the recorder asserts it; `npm run check:points`
fails if any recordable scenario has none.

### Rig faults fixed in the same pass — all of which had been passing

| file | fault |
|---|---|
| `src/auditLog.js` | `searchOnScreen` returned the PREVIOUS search's table; both waits were no-ops (`networkidle` settles before the AJAX; `waitFor` on a `tr` is satisfied by the empty-state row). Now waits for the search's own response, blanks the tbody first, and reports `repainted` |
| `src/framing.js` | the gate asked `Get-Process \| MainWindowTitle` while the pinner asks `EnumWindows`; they disagree once `pinOnTop()` has run, so it failed on a good rig. Now goes through `focus-window.ps1 -Query` |
| `src/login.js` | `logout()` leaked a `page.once('dialog')` when there was no link to click, so a later dialog had two handlers and the second threw after its action succeeded — this left the shared `BOChar` account on Probation |
| `tests/90-evidence.spec.js` | TS48's leg had no budget and no logging; it once ran nine minutes silently. Now stamps every step and abandons at `EV_TS48_BUDGET_MS` (default 5 min), restoring either way |

`scripts/restore-bochar-role.js` puts `BOChar` back to HubAdmin and asserts the
read-back on both surfaces. Run it if any TS48 take dies mid-flight.

### Take scores

| scenario | score | status |
|---|---|---|
| TS13 | 14/14 | valid |
| TS06 | 12/12 | valid |
| TS48 | 14/14 | weakened — its CORE half is the positive control that a non-Probation role CAN see the control, and the record was out of window |
| TS02, TS21 | 12/12, 14/14 | weakened — absence is expected, but on an out-of-window fixture it is over-determined |
| TS01.1, TS03, TS42, TS15 | 12/12, 13/13, 12/12, 14/14 | **not evidence** — all four claim a present or greyed button and filmed an absence. Re-record on in-window fixtures |


---

## E2E SEGMENT 1 — the creation half (28-08-2026)

Nine E2E rows film from the public reCAPTCHA gate (E2E_TS8 is exempt). Two segments:
segment 1 creates the record and patches its expiry into the window, spending NO
extension; segment 2 performs the extension and is REFUSED without `--12235-fixed`.

```
bash scripts/run-e2e-gate-takes.sh --go E2E_TS1     # ONE human gate: the reCAPTCHA
bash scripts/run-e2e-gate-takes.sh --segment 2 --go E2E_TS1 --12235-fixed
```

**Only the reCAPTCHA needs a person — in the CREATION flow.** Both Fiuu payments drive
themselves from the shared store (`FIUU_SIM_*`) — simulator login, TAC, Approved, Pay
Now — and pause only if that pair is stale. `creation.humanGatesNow()` computes the real
number and the runner prints it; `probe-creation-branches.js` asserts both directions.

**One take outside that flow has a second human gate, added 29-08-2026: TS19.** Its
mailbox points film the Mailtrap inbox, and a signed-out catcher hands back to the
operator to sign in — credentials are never typed on camera and never by the rig. If
nobody is there the leg refuses its points and says so rather than filming a login page
and calling it an inbox. Nothing else in the 29-08 shapes needs a person: TS53's role
switch is automated end to end (and restores the account in `finally`), and the endpoint
family drives itself.

Eight points, and the ORDER is load-bearing — the patch runs BEFORE the four
BackOffice reads, or they describe a record still 90 days from expiry:

| # | point | asserts |
|---|---|---|
| 1 | `create-preapp` | RM 108 payment-done page READ: `Payment Status: PAID` |
| 2 | `create-regfee` | RM 990 payment-done page, same |
| 3 | `create-patch-expiry` | the support tool brings the expiry into the window |
| 4 | `create-bo-listing` | the Expiry Date cell **and its column header**, ringed together |
| 5 | `create-bo-export` | the workbook OPEN in Excel, expiry column measurably in frame |
| 6 | `create-bo-detail` | whether the Extend button is SHOWING |
| 7 | `create-bo-audit` | no `[Extend]` row yet — segment 2 baseline (R18) |
| 8 | `seam-declared` | the seam, on camera |

The seven intermediate creation phases run unchecked and unspotlighted; the gate is
filmed but not ringed. `creationPointsFor()` returns this list for EVERY gate row, so
the other eight inherit it.

**Unchecked is not the same as unfilmed** (28-08-2026). Those phases earn no trigger
point, but the six of them that happen in BackOffice are still handed the camera — see
below. Charmain, watching the 11:51 TS3 take: *"all the action you did in BO is not
recorded"*. `checked` decides what is SCORED; `bo` decides what is ON CAMERA, and the
hand-over used to require both, so narrowing the checklist had silently narrowed the
film.

Pre-flight, and each gate is there because it has already cost a take:

```
probe:creation   every creation branch executes (offline)
check:points     register and checklists agree
probe:still      stills can be cut clear of the overlay
probe:cursor     the pointer is on screen from page BIRTH
probe:pointer    it ARRIVES on the control before every click (asserted at mousedown)
VPN burst        3 of 3 probes to the support tool — it dropped mid-take three runs running
probe:framing    the recorded display will see the browser
```

**Eleven legs open their own window and are flagged `bo: true`** — every BackOffice
leg, whether or not it is scored:

| | legs | scored? |
|---|---|---|
| BackOffice flow | `approve-preapp`, `assign`, `submit-approval`, `approve-app`, `verify-regdocs`, `record` | no — filmed only |
| BackOffice reads | `patch-expiry`, `bo-listing`, `bo-export`, `bo-detail`, `bo-audit` | yes, 5 points |

For each, the recorder maximizes, hands the marker over AND calls
`placeWindowOnRecordedDisplay`. `onPhaseEnd` hands the marker BACK to the dealer, so a
BackOffice leg in the middle of the flow returns the camera for the next dealer step.
The three dealer legs (`gate`, `appform`, `regdocs`) must NOT be flagged — the payment
checks would lose their own frame. `probe:creation` asserts both directions.

The UCD dealer browser is closed after `regfee` — the application payment, and the
dealer's last action — so the camera stops flicking back to it between BackOffice
checks.

Until 28-08 the hand-over was gated on `checked && bo`, so the six BackOffice flow legs
ran behind the pinned dealer window and never reached a frame. Cutting frames from the
11:51 TS3 take across 95s–245s — the span holding all five mid-flow BackOffice steps —
returned nothing but the dealer window, one tab, `rig: dealer` in the corner.

**State 28-08-2026 06:45: E2E_TS1 segment 1 = 8/8 on NA68001111**, verified by cutting
frames from the mp4, not by reading the sidecar.

### Arm-aware rows: four things to declare, not one (01-09-2026)

Adding arms to a row touches more than `SWEPT_ARMS`. Measured the hard way on E2E_TS10,
one fault per day:

1. **`SWEPT_ARMS`** in `src/triggerPoints.js` - the recorder reads this.
2. **`TWO_ARMED`** in `src/lifecycle.js` - the reconcile sweep reads this. `npm run
   check:points` now fails if the two disagree, naming the row.
3. **`pointsFor` scoping** - a point about a cron night must come off the arm that films
   BEFORE that night, or the setup sitting ticks it for nothing.
4. **`src/expectedState.js`** - must become a function of the arm. E2E_TS10 arm B stands
   on a REGISTERED record where R9 removes the control, so it expects `absent`, not the
   `greyed` its siblings expect. A flat value made a 16/16 take report MISMATCH.

The take also writes a `LIFECYCLE (ARM B)` line, and the sweep matches that prefix to
learn which arm filmed. It used to hard-code `E2E_TS4` as the row name on every armed
row - fixed to use the take's own ref, and the sweep now also accepts a bare `ARM B`
line so takes filmed before the fix still classify.
