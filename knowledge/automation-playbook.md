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
`eauto-quotation-reminder`), each with their own `package.json` and config. They
are driven by their own dashboard API routes.
`[verified: scripts/*, app/api/*]`

⚠️ **Quote `--grep` when spawning through a Windows shell.** The run routes use
`spawn(..., { shell: process.platform === 'win32' })` so `npx.cmd` resolves, which
means **cmd.exe re-parses the argv**. Titles are joined with `|`, and cmd reads an
unquoted `|` as a pipe — so the command dies with
`'<second title>' is not recognized as an internal or external command`. It works
with **one** scenario selected and breaks from two onwards, which is the normal
case. Wrap the whole grep value in double quotes on win32.
`[verified live: eauto-quotation-reminder route, 2026-08-17]`

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

Renaming a test title means renaming it in **both** the spec and
`app/eauto/shopping-cart/page.tsx`, or `--grep` matches nothing.

## Demo / detailed mode

`PW_DETAILED=1` (the runner UI's toggle, default on) makes `BasePage` slow down
and highlight elements so a recording is reviewable step by step: amber outline
for "about to act", green for "here is the result", red for a removal.
`PW_DETAILED_DELAY` overrides the 1400ms default. Every helper is a no-op when
off, and highlighting is best-effort — it must never fail a test. Wrap calendar
scans in `suppressDemo()` so they stay fast and don't flood the recording with
pulses on dates the test never acts on.
`[verified: tests/service-hub/pages/BasePage.ts · demo mode section]`

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
