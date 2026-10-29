# Automation playbook — how a spec is built here

> **This file is the eAuto-specific authority** — page objects, portal quirks, how
> the dashboard spawns runs. It covers how a spec *drives* the system.
>
> For how a spec **verifies data** — contracts, source adapters, normalisation,
> comparing several sources against each other, PDFs — see
> [data-verification-standard.md](data-verification-standard.md). That is the
> standard for the verification half of every scenario, and carries no eAuto
> knowledge. `[from QA team, 2026-08-14]`

## Suite layout

```
tests/service-hub/
  playwright.config.ts   testDir ./specs, chromium only, workers 1, retries 0, timeout 60s
  specs/                 one spec file per rule area
  pages/                 page objects, all extending BasePage
  pages/bo/              BO-portal page objects
  fixtures/              test-fixtures.ts — the extended `test`
  utils/                 config.ts (ENV, PATHS), arrange.ts, tracked-context.ts
  reporters/             step-reporter.ts — emits the step tree for the runner UI
```

`[verified: tests/service-hub/**]`

Standalone Playwright projects also live under `scripts/` (`eauto-e2e`,
`eauto-insurance`, `secarang-insurance`, `eauto-estm`,
`eauto-quotation-reminder`, `eauto-jomcheck`), each with their own
`package.json` and config. They are driven by their own dashboard API routes.

**Standing rule (Faizuddin, 2026-09-30): app/eauto/12166 + tests/service-hub
are the benchmark for how a NEW eauto-* automation project's standard flow
should be built** — not just a project each session invents its own
convention for. Every new project should carry:
- A scenario checklist page (checkbox list of `{id, title, summary}`, title
  matching the spec's `test()` title exactly, "Select all"/"Clear"), not a
  raw `--grep` text box — the list only grows over a ticket's life.
- `PW_HEADED` / `PW_VIDEO=1` / `PW_DETAILED` env vars wired from the
  dashboard page's Headless/Detailed checkboxes into the spawned Playwright
  process, and a `BasePage.demoPause()`/`demoHighlight()` pair (amber
  before acting, green on a checked read) gated on `PW_DETAILED`, so a run's
  recording is reviewable step by step — see "Demo / detailed mode" below.
- Both the `json` reporter (`PW_JSON_REPORT`, pass/fail + duration) AND a
  `step-reporter.ts` (`PW_STEP_REPORT`, the `test.step()` tree) merged
  together in the run route, with a `toPlainEnglish()` friendly-error
  translation alongside the raw error.
- The newest `.webm` published to `public/qa-artifacts/<project>/` and
  played back in a `<video>` element.

`eauto-jomcheck` (EAINT-12339, created 2026-09-30) follows this in full —
`scripts/eauto-jomcheck/pages/BasePage.ts` (demo mode),
`scripts/eauto-jomcheck/reporters/step-reporter.ts`,
`app/api/eauto-jomcheck/run/route.ts`, `app/eauto/jomcheck/page.tsx`. Use it
as the reference alongside 12166/service-hub when scaffolding the next one.
`[verified: scripts/*, app/api/*]`

⚠️ **Quote `--grep` when spawning through a Windows shell.** The run routes use
`spawn(..., { shell: process.platform === 'win32' })` so `npx.cmd` resolves, which
means **cmd.exe re-parses the argv**. Titles are joined with `|`, and cmd reads an
unquoted `|` as a pipe — so the command dies with
`'<second title>' is not recognized as an internal or external command`. It works
with **one** scenario selected and breaks from two onwards, which is the normal
case. Wrap the whole grep value in double quotes on win32.
`[verified live: eauto-quotation-reminder route, 2026-08-17]`
A title that itself contains `"` (e.g. `= "Yes"`) would end that quoting early —
replace each `"` in the pattern with `.` (regex "any character", still matches
the real quote) rather than deleting it. Also put the child's **stderr** in the
returned log: a run that dies in cmd.exe writes only to stderr, and without it
the dashboard shows a blank result ("it will load for a bit, and then nothing
happens" — eauto-jomcheck, 2026-10-01, whose route had the quoting comment but
not the code). `[verified: spawn through cmd.exe, 3 titles incl. quotes — 1
found unquoted, 3 found quoted, 2026-10-01]` The JomCheck route now does both
(double quotes on win32, every `"` → `.`).
`[verified: app/api/eauto-jomcheck/run/route.ts:478-488]`

`public/qa-artifacts/eauto-estm/` keeps only the latest `run.webm`: the eSTM
route deletes every earlier file before copying.
`[verified: app/api/eauto-estm/run/route.ts:39-60]`

## Config conventions

- **Nothing hardcoded that an env var could supply.** Credentials, base URL and
  per-run test data all come through `ENV`.
- **URLs go in `PATHS`**, as functions when they take an id.
- **Business rules go in `ENV`** with a comment citing the SRD clause, so a spec
  reads as a check of a named rule rather than a magic number.
- **Exact UI copy goes in `ENV.text`** so wording drift fails loudly.

`[verified: tests/service-hub/utils/config.ts]`

## Page-object conventions

Extend `BasePage`, which provides:

- `goto(path)` — retries once with a `domcontentloaded` wait when the legacy
  portal aborts the initial request or never reaches networkidle.
- `getTxnIdFromUrl()` — returns the whole `key=value` pair across all three id
  schemes (see [eauto-portals.md](eauto-portals.md)).
- jQuery UI dialog helpers: `waitForDialog()`, `acceptConfirmDialog()`
  (`.confirm-dialog-btn`), `dismissConfirmDialog()` (`.cancel-dialog-btn`).
- Date helpers: `today()`, `daysFromToday(n)`, `yesterday()`, `nextWeekend()`,
  `dateMonthsAhead(n)`, `earliestRescheduleDate()`.
- Demo-mode helpers: `demoPause()`, `demoHighlight()`, `suppressDemo()`.

Declare locators as `readonly` class fields. Where the app exposes a JS function
for an action (`siStep`, `siSaveDate`, `siConfirmBooking`…), call it via
`page.evaluate` instead of clicking — that is the established pattern here.

`[verified: tests/service-hub/pages/BasePage.ts, SlotPickerComponent.ts]`

## Spec conventions

- Import `test` / `expect` from `../fixtures/test-fixtures`, never from
  `@playwright/test` directly, so the fixtures are available.
- Test titles **start with the scenario ID** — `"11864_TS01: <scenario>"` for new
  specs; existing Service Hub specs keep their legacy `"SC_SCB_TS11: …"` form. This
  is a hard contract — see Test-script IDs below.
- Wrap assertions in `test.step("Expected: …")`. The custom step reporter turns
  these into the runner UI's pass/fail checklist, so step titles are read by a
  human and should state the expectation.
- **Skip, don't fail, when a precondition can't be arranged.** Shared staging
  often has no reschedulable appointment or no public-holiday date keyed in; a
  spec that fails in that case reports a false defect.
  ```ts
  if (!(await openRescheduleCalendar(...))) {
    test.skip(true, "No reschedulable appointment to open a calendar from.");
    return;
  }
  ```
- Prefer **finder helpers over hardcoded date offsets**. `findDateMatching()`
  takes a predicate over a `DateSlotInfo` snapshot, so a scenario condition
  ("morning full, afternoon has room") is expressed declaratively.
  `openSlotModal()` deliberately throws if handed an unbookable date, telling you
  to use a finder.
- **Verify without mutating where possible.** Stepper values (`#si-cnt0`) update
  instantly on click, so capacity-limit checks can be asserted without ever
  saving — no real booking is made and the shared calendar's totals stay clean.
- **Always give an optional action an explicit timeout.** A "try it, ignore
  failure" action written as `locator.click().catch(() => {})` does **not** fail
  fast — Playwright polls for the whole `actionTimeout` before rejecting, so each
  absent element costs the full wait. `scripts/eauto-estm` sets
  `actionTimeout: 30000` and had five unbounded ones, roughly 150s of invisible
  waiting in a bad run. Write `click({ timeout: 10_000 }).catch(() => {})`.
  Never fall back between two selectors by catching a `fill()`/`click()` —
  gate on `count()` (which returns immediately) and pick the locator first.
  `[verified live: eSTM run stalled ~30s on the chassis field, 2026-08-13]`

`[verified: tests/service-hub/specs/calendar-rules.spec.ts, slot-capacity-boundary.spec.ts, pages/SlotPickerComponent.ts]`

### Searching for existing data (rule, 2026-10-05)

When a TS needs an EXISTING record (a pre-push transaction, a failed
transaction, a report with N claims), the search for it is a SEPARATE finder,
not part of the TS. Faizuddin, 2026-10-05: "make it the rule when going to
make automation for searching data", then — after an in-test search made TS27
too slow — "a button in their row, where it will check for available data
headless and fast in the background. after finishing, it will display the
data to be used, so i can copy and paste in the main handling up top in the
dashboard" / "revert the TS27 and 31 to accept value, and run the checking".
The rule:

0. **The TS takes a typed value (required). The search is a "Find data" button
   on the TS row.** It runs its own Playwright test (`<ticket>_FIND_<TS>`,
   not a TS, never in the checklist) headless, without video or demo pauses,
   through its own API route and output folder, and shows the record on the
   row with Copy / "Use in the field above". The TS run itself stays short
   and fully recorded. Worked example: `scripts/eauto-jomcheck/tests/
   find-pre-push-data.spec.ts` + `utils/prePushFinder.ts` +
   `app/api/eauto-jomcheck/find-data/route.ts`.
1. **Typed input is what the TS uses.** The finder only suggests; the person
   pastes (or clicks "Use"). Nothing is picked silently inside the TS.
2. **Search one calendar month at a time.** eAuto's From/To date filters
   accept at most one month (`knowledge/quirks.md` → Dates). Start with the
   month the person named (for EAINT-12339: August 2026, "before September")
   and pick the dates in the widget — year select, month select, real day
   click. Never `.fill()` a readonly date field, never `datepicker('setDate')`.
3. **An older month only when the month is EMPTY.** Faizuddin, 2026-10-05:
   "when i said check for the previous month, i only mean to check IF there
   are no transactions. if automation finds transactions, then use that
   transaction. no need to go through all". If the search returns rows, the
   test works with those rows and does not look further back. Cap the
   look-back (12 months).
4. **How many results to look at depends on where the condition is visible.**
   - Condition visible on the search page itself (TS31: Payment OK + Tx
     Failed): look at only the first 2 results. Faizuddin, 2026-10-05: "2 is
     enough" / "only need to check at most 2 transactions". If neither
     qualifies, STOP with a message naming the month and the rows looked at.
   - Condition only visible on ANOTHER page (TS27: the claim count is on the
     Report Listing, not the Enquiry): check every candidate of the month,
     across every result page. Faizuddin, 2026-10-05, after a live run stopped
     at 2 of 14: "make the automation go through the pages it needed to make
     sure it has the needed data". Move to the older month only when the
     whole month has no match.
4b. **The finder runs FAST and headless** (PW_DETAILED=0, PW_VIDEO=0).
   Faizuddin, 2026-10-05: "make it fast. only slow down for the part where
   the VN is confirmed to have the numbers" — the slow, recorded part is the
   TS itself, which then runs on the pasted value. (`BasePage.fastDiscovery`
   still exists for any in-test lookup that must stay quiet.)
4c. **Filter by the company the NEXT step can see.** BackOffice listings show
   every UCD company's records; a UCD login sees only its own. A record found
   in BO is usable in UCD only if its Company Name is the UCD login's company
   (`CONFIG.ucdCompanyName`). Live, 2026-10-05: TS31 picked another
   company's transaction and UCD said "No record found. Try again."
5. **Print what was searched and what was picked** as `DETAIL:` lines — every
   month window with its From/To as the page shows them, the rows considered,
   and the record chosen — so the reviewer can confirm the pick.

Worked examples: `scripts/eauto-jomcheck/tests/pre-push-user-vehicle.spec.ts`
(TS27: Approved + a 1-claim listing row; TS31: Failed with Payment OK) and
`BoJomCheckTransactionEnquiryPage.searchByStatusBetween()` /
`pickDate()`. Flow notes in `knowledge/flow-jomcheck.md` §7w.
`[source: Faizuddin, 2026-10-05, this session; not yet run live]`

## Page-load timing — wait before every input, everywhere

**Never fill or click a field the instant a page/dialog appears — the eAuto
system (and every related system this repo automates: eSIM, Secarang, WA
Blaster, etc.) takes noticeably longer to finish initializing than
`domcontentloaded` implies.** Filling too early has produced a genuinely
different, misleading result — not just a flaky timeout: on EAINT-9306's
CPC_E2E_TS2, entering the Vehicle No. field right after Step 2 loaded (only
gated on `waitForLoadState('domcontentloaded')`, no further pause) surfaced a
DIFFERENT popup/message than the one a human tester sees performing the same
action by hand, because the page's own JS/gate-check state was not finished
settling yet.

**The rule: after a page is confirmed loaded, wait an additional ~2 seconds
before typing/clicking into any of its fields.** This applies to every input
on every page across the whole suite — not just the flagged case above, and
not just this ticket's scripts. `waitForActivePage()`/`waitForDomReady()`
(`utils/session.ts` here, `BasePage.goto()` in `tests/service-hub`) only wait
for `domcontentloaded`, which fires before the app's own client-side setup is
done — that gap is exactly where the wrong-popup bug above came from.

`[from Faizuddin, 2026-09-02 — confirmed live: CPC_E2E_TS2's inline
pre-check popup showed a different message than the same manual action,
traced to filling `#vehicleRegNo` immediately after Step 2's `domcontentloaded`
with no settle time]`

## Cross-portal tests

A test that needs both portals at once (BO acting while UCD observes) opens a
second context via `openTrackedContext(browser, testInfo)` — **not**
`browser.newContext()`. The plain call does not inherit `use.video` from the
config, so manually created contexts were silently recording nothing; the helper
enables video into the same per-test output folder so both sides of the flow end
up in one place. Arrangement helpers live in `utils/arrange.ts` and return `null`
rather than throwing, so callers skip.
`[verified: tests/service-hub/utils/tracked-context.ts, arrange.ts]`

## How the dashboard runs the suite

`POST /api/eauto/shopping-cart/run` spawns:

```
npx playwright test --config tests/service-hub/playwright.config.ts --grep "<titles>"
```

- The `--grep` pattern is built from the **scenario titles the UI sends**, regex-escaped
  and joined with `|`. So a scenario's `title` in `app/eauto/shopping-cart/page.tsx`
  must match the spec's `test("…")` title exactly, or the run silently matches nothing.
- Artefacts go to `test-evidence/<YYYY-MM-DD_HHMM>/`, one folder per run in local
  time, with `report.json` (JSON reporter) and `steps.json` (step reporter) tucked
  into a `_run/` subfolder so they don't sit among the evidence.
- Env vars injected per run: `EAUTO_BASE_URL`, `EAUTO_UCD_USER`/`_PASS`,
  `EAUTO_BO_USER`/`_PASS`, `EAUTO_UCD2_USER`/`_PASS`, `EAUTO_PUBLIC_HOLIDAY`,
  `EAUTO_REF_NO`, plus `PW_HEADED`, `PW_VIDEO=1`, `PW_OUTPUT_DIR`,
  `PW_JSON_REPORT`, `PW_STEP_REPORT`, `PW_DETAILED`.

`[verified: app/api/eauto/shopping-cart/run/route.ts]`

Adding a scenario to the dashboard therefore means three things, not one:
the spec, the scenario entry with an identical title, and (if it needs new
input) the env var wired through both the route and `ENV`.

**Other runners share `tests/service-hub/playwright.config.ts`:**

1. `/api/eauto/shopping-cart/run` — the SC_* suites (above).
2. `/api/eauto/12166/run` — E2E TS01-08. Adds `EAUTO_BO2_*` and `PW_GATE_DIR`,
   registers the run in `lib/eautoRunRegistry.ts`, publishes evidence to
   `public/qa-artifacts/eauto-12166/<ts>/`, keeps 10 run folders.
3. `/api/eauto/bdp-creator/run` — `--grep "create-bdp"`, result JSON via
   `PW_RESULT_PATH`.
4. `/api/eauto/user-access-regression/run` — `PW_UAR_ACCOUNTS`, with
   `PW_RESULT_PATH` as a directory.

`[verified: app/api/eauto/shopping-cart/run/route.ts:195-220; app/api/eauto/12166/run/route.ts:32-49, 246-271; app/api/eauto/bdp-creator/run/route.ts:49-61; specs/user-access-regression.spec.ts:14-18]`

**Manual gate.** `waitForManualResume(page, gateId, message)` writes
`<PW_GATE_DIR>/<gateId>.waiting.json`; `/api/eauto/12166/live-log` surfaces it as
`[GATE:waiting:<id>] <msg>`; the Resume button posts `/api/eauto/12166/resume`,
which touches `<gateId>.resume`. Default wait 20 min. Outside the dashboard the
gate no-ops (see [quirks.md](quirks.md) § Test-artefact plumbing).
`[verified: tests/service-hub/utils/manualGate.ts; app/api/eauto/12166/live-log/route.ts; app/api/eauto/12166/resume/route.ts]`

## Test-script IDs and evidence naming

Every test title starts with its script ID. **The rule, for anything new:
`<ticket-number>_TS<NN>` — ticket number only, no project or module prefix, no
underscore before the number, and the number padded to two digits.**
`11864_TS01`, not `11864_TS_01`, not `11864_TS1` and not `SC_SCB_TS11`. This
matches the Excel script's TS No. exactly, so one id follows a case from the
spreadsheet to the spec to the evidence folder. See
[test-scripts.md](test-scripts.md) for the script side.
`[from QA team, 2026-08-17 — supersedes the unpadded `11864_TS1` form recorded
2026-08-14]`

**Numbers come from the test scenarios, never from a counter**, so a scenario that
stays manual leaves a gap (`TS01`, `TS03`) rather than renumbering the ones after it.

⚠️ **Existing titles stay as they are.** The Service Hub specs use the older
module-prefixed form (`SC_SCB_TS11: Book for current day and the next day`, with a
1–6 letter submodule). **Do not rename them** — the runner selects
tests by `--grep` on the exact title, so a rename that misses either the spec or
`app/eauto/shopping-cart/page.tsx` silently matches nothing. Leave them; write new
ones the short way.

Whatever the id, it is the whole naming scheme. After a run,
`organizeTestEvidence()` renames Playwright's hash-named per-test folder and its
generic files (examples below use the legacy form, as that is what exists today):

```
test-evidence/2026-08-12_1432/
  SC_SCB_TS11 - Book for current day and the next day/
    SC_SCB_TS11.webm            main context recording
    SC_SCB_TS11 - BO.webm       extra cross-portal contexts keep their label
    SC_SCB_TS11 - failure.png
    SC_SCB_TS11 - trace.zip
  _run/  report.json, steps.json
```

`closeTrackedContext()` writes only the portal label (`BO.webm`) at record time; the
ID prefix is applied afterwards by the runner, so the title is never baked into a
filename mid-test. `[verified: lib/testEvidence.ts, app/api/eauto/shopping-cart/run/route.ts]`

`testIdFromTitle()` recognises both `SC_SCB_TS11: …` and `12166_67_E2E_TS01`.
Extra contexts are labelled via `closeTrackedContext(ctx, testInfo, label)` →
`<ID> - <label>.webm`. PDFs are rendered to PNG with `renderPdfToEvidence()`.
`[verified: lib/testEvidence.ts:31-32; tests/service-hub/utils/tracked-context.ts; utils/pdf.ts:60-78]`

Renaming a test title means renaming it in **both** the spec and
`app/eauto/shopping-cart/page.tsx`, or `--grep` matches nothing.

## Demo / detailed mode

`PW_DETAILED=1` (the runner UI's toggle, default on) makes `BasePage` slow down
and highlight elements so a recording is reviewable step by step: amber outline
for "about to act", green for "here is the result", red for a removal.
`PW_DETAILED_DELAY` overrides the 1400ms default. Every helper is a no-op when
off, and highlighting is best-effort — it must never fail a test. Wrap calendar
scans in `suppressDemo()` so they stay fast and don't flood the recording with
pulses on dates the test never acts on. With detailed mode on, the test timeout
is 240 s. `[verified: tests/service-hub/pages/BasePage.ts · demo mode section
(138-220); playwright.config.ts:6-15]`

Extended 2026-09-23 to the EAINT-12166/12167 Device Purchase DO page objects
(`LoginPage`, `BiometricPurchasePage`, `DevicePurchaseDetailsPage`,
`ServiceRequestListingPage`, `ServiceRequestDetailsPage`,
`CompanyManagementPage`, BO `SoftwareInstallationListingPage`) — every button
click scrolls into view + highlights before acting, and every read of a
checked value (DO Number, Delivery Status, Consignment Number, Company
Details) highlights the row/field it came from in green. `PW_DETAILED` is
wired into `app/api/eauto/12166/run/route.ts` and the "Detailed" checkbox on
`app/eauto/12166/page.tsx`, same convention as shopping-cart. Popup-tab
downloads (DO/Invoice/e-Invoice — `window.open()`-triggered, see
`utils/download-evidence.ts`) are separately labeled rather than left as
unlabeled numbered duplicates.

## Repo-wide notes

- `next build` does not gate on ESLint here, and the codebase already carries
  many pre-existing `react-hooks/set-state-in-effect` violations plus a standing
  `tsc --noEmit` error count (~40 lines across `app/`, `components/`, `lib/`).
  When checking your own work, filter the output to the files you touched
  instead of expecting a clean run.
  `[verified: package.json scripts; npx tsc --noEmit and npx eslint output, 2026-08-13]`
- The vendored WA Blaster copy lives at `_reference/codebases/wa-blaster` and is
  excluded from `tsconfig.json`. Before that exclusion it contributed 5,491 of
  the 5,531 `tsc --noEmit` error lines, burying the real ones.
  `[verified: npx tsc --noEmit before/after the exclusion, 2026-08-13]`
- Client-side state in the dashboard is stored in `localStorage` under keys like
  `qa_flow_state`, `qa_flow_knowledge`, `test_tracker_crs`, `notes`,
  `jira_read_mentions`, `jira_study_notes`. The backup helper exports **all** of
  `localStorage`, so new keys are included automatically.
  `[verified: lib/*.ts stores; lib/jira.ts · exportLocalStorage]`

## Patterns from Charmain's repo (eauto-qa-charmain, read 2026-10-27)

Read-only clone at `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain` of `modefair/eauto-qa-gpt`, commit 0ab45d1, 2026-10-13).
Much of her `src/` was brought in 2026-09-21 from `eauto-qa-azfar`. Listed here:
what is worth reusing, what differs from our conventions, and what not to copy.

### Worth reusing

1. **Env-file ladder:** `ENV_FILE` → `env/.<TEST_ENV>.env-local` (gitignored) →
   `env/env-default` (committed, every value blank). Values are read through
   functions, never import-time constants.
   `[charmain-repo: playwright.config.ts:8-22; config/environments.ts:14-50]`
2. **Personas:** a spec asks for a role (`login.as('ucdE2E')`); the persona maps to
   env key names and a `destructive` flag. Missing keys throw naming the key.
   `[charmain-repo: config/personas.ts:1-122]`
3. **Pre-login host/instance guard** — see eauto-portals.md § "From Charmain's repo".
   `[charmain-repo: config/environments.ts:57-77]`
4. **`@step("…")` method decorator** wraps a page-object method in `test.step`,
   so reports read as named actions without call-site boilerplate.
   `[charmain-repo: src/fixtures/step.ts:1-23; src/pages/ucd/apt-listing.page.ts:25]`
5. **One `pages` fixture** that builds page objects lazily, plus `ucdSession(persona)`
   / `boSession(persona)` (log in, settle, clear popups). Replaced a legacy
   637-line file of 180 fixture entries that had a duplicate-registration bug.
   `[charmain-repo: src/fixtures/test.ts:10-82]`
6. **Every test gets an `environment` annotation** (`staging /uat1`), so a result
   read weeks later states what it ran against.
   `[charmain-repo: src/fixtures/test.ts:84-88]`
7. **`requireVisible(locator, what)`** fails loudly with the control name and URL
   instead of returning null. `[charmain-repo: src/pages/base.page.ts:13-27]`
8. **`Listing` component addresses columns by header text:** `column(header)`,
   `row(header, value, also?)` (extra columns to disambiguate), `cell(row, header)`,
   `recordCount()` reads the "No. of Records" label, `expectHeaders([...])`.
   A renamed column fails with the column list in the message.
   `[charmain-repo: src/pages/components/listing.ts:1-104]`
9. **Composable flow with `stopAfter`:** `runStmsFlow(page, { mykad, stopAfter,
   vehiclePrefix, matchResult, … })` runs the STMS wizard up to a named step
   (`category`, `seller`, `vehicle`, `buyer`, `jpjCheck`, `jpjEnquiry`, `payment`,
   `transfer`) and returns what later steps need (vehicle no., transaction id).
   One function serves "seed a complete STMS" and "get to step 2 and stop".
   The flow never logs in itself, so the spec names its persona.
   `[charmain-repo: src/flows/stms.flow.ts:1-214]`
10. **Shared wizard base:** STMS and eSerahan are the same wizard with different
    labels — category tiles, jQuery confirms, MyKad panel, `<div class="next-btn">`
    action controls with ids. A new module is a subclass.
    `[charmain-repo: src/pages/wizard.page.ts:1-16]`
11. **`submitPaymentAndReadResult()`** returns `{outcome: "transferred"}` or
    `{outcome: "rejected", message}` instead of waiting for a URL that a correct
    rejection never produces. Same idea for JPJ: wait for "Response Code:".
    `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:238-284]`
12. **Downloads helper:** `captureDownload(page, click)` accepts the native confirm
    and waits for the `download` event in one `Promise.all`; `sheetColumns()` /
    `sheetRows()` read XLSX; `findRow(rows, match)` requires every given column to
    match and throws on 0 or >1 hits. `[charmain-repo: src/utils/downloads.ts:21-95]`
13. **Screen probe (exploration tool, not a test):** signs in, clicks a menu path
    (`PROBE_PATH='Reports|Transaction Summary Report'`, never a URL), then dumps
    the current screen in ONE `page.evaluate` — fields (label found 4 ways incl.
    the neighbouring `<td>`), buttons, links, tables (headers, row count, row
    actions), messages, frames — into `docs/modules/<slice>/<module>/<label>.probe.json`
    with sorted keys and ids stripped from the URL, so a re-probe is a clean
    `git diff`. Never clicks, fills or submits on the probed screen. Production
    probing needs `PROBE_ALLOW_PRODUCTION=1`. Fits our "save every page" and
    "explore = click every option" work as a structured companion to raw HTML.
    `[charmain-repo: src/probe/screen-probe.ts:1-378; tests/_explore/screen-probe.spec.ts:1-166]`
14. **Playwright config choices:** test timeout 25 min (the longest eSerahan run
    measured 25 min across four portals and JPJ), expect 60 s, action 90 s,
    navigation 120 s, viewport 1920×1080, `ignoreHTTPSErrors`, real Chrome
    (`channel: "chrome"`), LNA launch flag, workers 1 unless overridden,
    screenshot / video / trace only on failure, JSON report per run id, reporters
    off under `--list`. Projects: `staging`, `production` (greps out
    `@destructive`), `explore` (`@probe` only), `evidence` (headed, real window,
    Playwright video off — ffmpeg records the desktop).
    `[charmain-repo: playwright.config.ts:24-130]`
15. **Layout:** `tests/<env>/<slice>/<screen>/<slice>-<screen>[.<ticket>].<e2e|func>.spec.ts`;
    a header block (`@subject`, `@ledger`, `@plan`, `@env`, `@status`); tags
    `@P1-3`, `@e2e`, `@func`, `@destructive`, `@readonly`, `@evidence`; imports from
    `@fixtures` aliases only. `[charmain-repo: tests/README.md:1-138; tsconfig.json paths]`

### Test data generators (`src/data/`)

1. **Vehicle numbers come from a counter per prefix**, not random:
   `nextVehicleNumber("TE")` → `TE000001`, `TE000002` … (`padTo` default 6). The
   prefix picks eSim's canned JPJ outcome; "TE" = response code 00 on staging.
   Max vehicle-number length eAuto accepts is NOT established — `padTo` is a
   setting. `[charmain-repo: src/data/generator.ts:1-72; src/flows/stms.flow.ts:90-94]`
2. **Mobile / email reused at most 3 times**, counted across runs in
   `state/usage.json` (gitignored, machine-local); a corrupt file throws rather
   than silently resetting the caps. Mobile = `01` + 8 random digits; email =
   `qa.stms.<base36 time><3 digits>@<domain>`.
   `[charmain-repo: src/data/generator.ts:4-16, 30-120]`
3. **Engine / chassis shapes** copy real staging data: engine `"<d>G/ <7 digits>"`
   (e.g. `4G/ 1929171`), chassis `"<3 digits>/ AH-<4 digits>"` (e.g. `555/ AH-1119`).
   `[charmain-repo: src/data/generator.ts:127-135]`
4. STMS defaults: make "Chery", year "2012", buyer card = seller card.
   `[charmain-repo: src/flows/stms.flow.ts:146-154]`
5. **Conflict:** her default email domain is `example.test`; our rule is fake
   test emails use `@testingz.com`, never `@modefair.com`.
   `[charmain-repo: src/data/generator.ts:90]`
6. Named MyKad identities live in `src/data/cards.ts` (one is a colleague's real
   NRIC labelled "staging test data" — do not copy it; ours come from the
   dashboard). `[charmain-repo: src/data/cards.ts:20-38]`

### Where her conventions differ from ours

1. **Conflict — test titles.** Hers: `"EAINT-12345-TS3 — <scenario>"`, also legacy
   `ESTMUCDREG_TS100`. Ours: `<ticket>_TS<NN>: <scenario>` (two digits).
   `[charmain-repo: tests/README.md:107-116]`
2. **Conflict — run evidence.** Her Playwright config keeps video only on failure;
   ticket evidence comes from a separate ffmpeg desktop "recorder rig". Our runner
   pages record every TS run (Playwright video) and publish it per TS.
   `[charmain-repo: playwright.config.ts:65-71]`
3. **Conflict — slow/highlight mode.** She has no `PW_DETAILED` equivalent; her
   rig draws a synthetic cursor, a yellow ring and captions instead (see
   automation-testing.md § "Charmain's evidence rig").
4. Her MyKad client talks to the emulator from Node; ours opens a page — see
   mykad-emulator.md § "From Charmain's repo" §4.

### Patterns NOT to copy (break our "act like a person" rule)

1. **Hiding overlays by writing styles and removing nodes:**
   `tools/insurance-quote-checker/pages/BasePage.ts:123-141` sets
   `style.display='none'`, `visibility='hidden'`, `pointerEvents='none'` on popup
   ancestors, removes `.modal-backdrop`, and clears `body.modal-open`. This file is
   a port of OUR `scripts/eauto-insurance/pages/BasePage.ts` (same lines 123-141),
   which is not yet in the violators list in automation-testing.md.
2. **`{ force: true }` on popup closers:** `tools/insurance-quote-checker/pages/BasePage.ts:103, 112`
   and `src/pages/components/popup-sweep.ts:66, 80` — banner / campaign close
   buttons only, so tolerated under rule item 8.
3. **Readonly date fields written by script:** her EAINT-12131 rig's
   `helpers.setDateField()` removes `readonly`, sets the value and dispatches
   `input` / `change`. Banned here; open the picker and click the day.
   `[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12131.md:710-712]`
4. **Silent substitution:** STMS `fillVehicleDetails` falls back to option index 1
   when the requested Model label is missing, so a run can proceed on a model
   nobody asked for. `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:96-103]`
5. **Fixed sleeps:** the insurance checker waits 3 s after load and 5 s after each
   click (`waitForTimeout`). Ours is the same file; prefer state waits.
   `[charmain-repo: tools/insurance-quote-checker/data/config.ts:23-28; pages/EnquiryPage.ts:91, 113, 152]`
6. **Shared-account repair:** her rig rewrote a shared BO account's Contact No
   (one-way) so a role switch would save. Changing shared accounts needs the
   owner's approval. `[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12131.md:890-900]`

Clean: `src/` page objects and `src/fixtures/` write no page state — reads via
`evaluate` only (`validationMessages`, `probeScreen`, MyKad readiness).

### Insurance quote checker — it is our script

`tools/insurance-quote-checker/` is a port (2026-09-23) of our
`scripts/eauto-insurance`. Pages, utils and spec logic are unchanged. Differences:
credentials come only from env (`EAUTO_USERNAME` / `EAUTO_PASSWORD`, throw if
missing) — our `scripts/eauto-insurance/data/users.ts:14-15` still has hardcoded
fallback values. Default base URL `staging.eauto.my/sit3`; standalone
`playwright.config.ts`; `.env.example` lists `EAUTO_BASE_URL`, `EAUTO_USERNAME`,
`EAUTO_PASSWORD`, `EAUTO_DEFAULT_IC`, `EAUTO_DEFAULT_POSTCODE`,
`INSURANCE_CONCURRENCY`. `[charmain-repo: tools/insurance-quote-checker/README.md:15-25; data/users.ts:1-33]`

Logic, for reference (BO `view/insurance/insurance-quote-enquiry/`):
1. Per vehicle: open the enquiry fresh; re-login if bounced to `/login`.
2. Company category → tick `input[name="vehicleCategory"][value="company"]`;
   fill `#vehicleRegNo`, `#buyerRefIdCompanyROC` (IC / ROC).
3. One `dialog` handler for the whole flow (accept + log); `#to-show-result`
   is AJAX, no navigation; poll until "Working..." clears, "Unable to retrieve"
   shows, `#postcode` or `#vehicle-detail` appears.
4. "Unable to retrieve your vehicle information" → `NO_VEHICLE_INFO`.
5. `#postcode` visible → fill, click Show Result again.
6. `#varientSeriesType` (some motorbikes) → choose the first real option.
7. Read `#vehicle-detail td.quote-label` + next cell (Make, Model, Manufacturing
   Year, Engine Capacity, Transmission, Variant; a `<select>` cell reads its
   selected option).
8. `#to-continue` (Get Quote) → per `.plan-detail-table`: insurer name
   (`.plan-name`, "TokioMarine" → "Tokio Marine"), Cover Type (text before
   "Period"), "Allow to purchase insurance:", "Refer Risk", Total Price (`RM n`).
9. Workers: vehicles split into `INSURANCE_CONCURRENCY` chunks (default 4), one
   logged-in context each; output flushed to xlsx after every vehicle.

`[charmain-repo: tools/insurance-quote-checker/pages/EnquiryPage.ts:11-262; utils/batch.ts:1-42; fixtures/authFixture.ts:1-49]`
