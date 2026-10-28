# Automation Testing section — rules

## Scope: this file governs the "Automation Testing" area only

These rules apply to the dashboard's **Automation Testing** section and the
ticket-driven Playwright suites behind it. They are about how the section is
*organised* — navigation, runner controls, scheduling — and don't generalise to
the Insurance Checker, Secarang or WA Blaster.

**Code design is a separate question.** Any check that compares observed data
against expected data — email, portal page, PDF, export, or several sources against
each other — follows
[data-verification-standard.md](data-verification-standard.md).

For how a Playwright spec is written and how the dashboard spawns it, see
[automation-playbook.md](automation-playbook.md).
`[from QA team, 2026-08-13 / 2026-08-14]`

**Team repos.** CR and regression scripts are consolidated into
`github.com/modefair/eauto-qa-automation`, using the `consolidate` branch flow
(see [qa-team-process.md](qa-team-process.md)). The older team repo is
`github.com/modefair/eautoAutomation-Playwright`.
`[from Teams eAuto QAs, 2026-09-15 18:46 and 2026-09-30 10:31, Hui Xin Lee; 2026-09-14 09:50, Hui Xin Lee]`

## Navigation

- A single side-menu dropdown titled **"Automation Testing"**.
- One page per ticket, and the page is **named with the ticket number only** —
  `11864`, not `EAINT-11864` and not a descriptive title.
- New tickets get new pages under the same dropdown.

`[from QA team, 2026-08-13]`

**Superseded on 2026-10-15 — the dropdown is now a page.** Faizuddin: "instead
of a dropdown, when i click the sidemenu 'tickets', it will open a page with a
list of all the ticket's automation. view can have card or list view, detailed
or simple view." So:

- The sidebar item **"Tickets"** is one link to `/tickets` (`app/tickets/page.tsx`).
- `/tickets` lists every per-ticket page from `lib/ticketAutomations.ts` with
  two toggles remembered per browser: **Cards / List** and **Detailed / Simple**.
  Cards and rows carry the ticket number, status pill (Automated / Partly /
  Semi / Data checker / Paused / Planned), the Jira summary, and in detailed
  mode the notes, module, portals, scripts path and TS coverage bar.
- **A new ticket page = one entry in `TICKET_AUTOMATIONS`**, not a sidebar
  edit. The sidebar stays highlighted on any `href` in that catalogue.
- Page naming rule is unchanged: ticket number only; combined pages use
  "12107 + 12327" style.

`[from Faizuddin, 2026-10-15]`

**The eAuto group is a page too (2026-10-21).** Faizuddin: "make the eAuto
sidebar section have its own page, just like the tickets page". The sidebar
item **"eAuto"** is one link to `/eauto` (`app/eauto/page.tsx`), listing the
module pages from `lib/eautoModules.ts` with the same toggles. **A new module
page = one entry in `EAUTO_MODULES`.** Both pages share
`components/AutomationCatalog.tsx`; /eauto sorts by name, /tickets by ticket no.

`[from Faizuddin, 2026-10-21]`

## Number fields: plain text, digits only

Standing rule, 2026-10-15 [source: Faizuddin: "make the format simple text but
accept numbers only. because for the current one, if i click backspace, it
will automatically display 1 instead of clearing it. so if i want to change to
another number, i type 420, it will become 1420"]. Every number field on a
dashboard page uses `components/NumericTextInput.tsx`: `type="text"` +
`inputMode="numeric"`, digits only, may be empty while editing, min / max /
fallback applied on blur or Enter — never `<input type="number">`, never a
clamp-on-every-keystroke `onChange`.

Still `type="number"` on 2026-10-15 (not changed — outside this request):
`app/eauto/duitnow-qr/TestScriptTab.tsx` 266, 270; `app/eauto/bdp-creator/page.tsx`
193, 203; `app/daily-update/page.tsx` 285, 289; `app/kanban/page.tsx` 272,
1088 (kanban takes 0.5 steps, so it needs a decimal variant, not this one).

## Runner controls on each page

- **Environment picker, chosen before the run.** The target environment changes
  often, so it is a run-time choice in the UI, never a hardcoded value. Base URL
  and credentials must reach the spec from the API route, the same way
  `EAUTO_BASE_URL` and friends already do.
- **Time picker beside the Run button.** With no time set the button reads
  **"Run"**. Pick a specific time and it becomes **"Set Schedule"**.

**Timing requirements belong to individual tickets, not to any flow.** The
insurance flow has no timing rule of its own — you can quote and purchase at any
hour. Only a ticket whose *subject* is timing imposes one, and the picker exists to
serve those. Never carry a ticket's clock constraint into a flow document or a
general rule. `[from QA team, 2026-08-14]`

**When a ticket does need a specific moment, scheduling the run start is not
enough.** What has to land at the chosen moment is a *specific click*. EAINT-11864,
for example, needs its decisive click one minute before an hourly cronjob (10:59
for the 11:00 run). A run launched at 10:59:00 still has to log in, load the page
and wait out the AJAX, so the click lands after the hour and the scenario is
silently invalid. Start the run early with a margin and have the spec **block on
wall-clock time immediately before the decisive action**.
`[from QA team, 2026-08-13]`

Which click is decisive is a per-ticket question. For EAINT-11864, the question
"is the quotation persisted by **Show My Result** or by **selecting an
insurer**?" was **answered 2026-08-17 — neither** (supersedes the earlier
`[unconfirmed]`). Nothing persists until insurance step 3 (the payment form); the
reminder backend detects step-1/2 drop-offs without any row. The decisive click
for timing is still `#to-show-result` (the stamp the cron keys on, `[from QA
team, 2026-08-13]`), held via `holdForSchedule()` immediately before it. See
[flow-insurance-purchase.md](flow-insurance-purchase.md).
`[verified: scripts/eauto-quotation-reminder/tests/quotation-reminder.spec.ts:86-91; from QA team, 2026-08-17]`

## Unattended runs that straddle a closed cronjob window

Some scenarios can only be observed across hours when nobody is at a machine —
EAINT-11864's dead-window case generates a quotation after 23:00, checks that no
email arrives, then re-checks after the 07:00 cronjob run. The laptop is off
overnight, so these run on a **cloud runner (GitHub Actions)**, not locally.
Rules that follow from that:

- **Pin the timezone explicitly.** Runners are UTC. A ticket whose whole subject
  is timing produces useless evidence if its timestamps are 8 hours off, so set
  `TZ=Asia/Kuala_Lumpur` for the job and log **both** MYT and UTC on every
  recorded step. Cron expressions are UTC too: 23:30 MYT is `15:30` UTC, and
  07:10 MYT is `23:10` UTC on the **previous** day.
- **One job cannot span the gap.** A GitHub Actions job is capped at 6 hours;
  23:30 → 07:00 is 7.5. It has to be separate scheduled runs that hand state
  forward — the quotation's identity (vehicle no, transaction id, recipient,
  exact creation timestamp) written as an artifact by the first run and read by
  the second.
- **Scheduled runs fire late, so place checks where lateness is harmless.**
  Actions cron is routinely 5–30+ minutes late and can be skipped. A "no email
  yet" check scheduled at 06:45 that slips past 07:00 sees the email and reports
  a false failure. Put negative checks deep inside the dead window (00:05, not
  06:45) and positive checks after the boundary with a poll, where being late
  only makes them safer.
- **Never assert an absence alone.** Assert the precondition really happened
  first, and treat the later positive check as the control for the negative one.

`[design decision, 2026-08-14 — cron delay behaviour is documented GitHub
Actions behaviour; the rest is reasoned, not yet verified by a real overnight run]`

**Current state of the EAINT-11864 workflow.** `.github/workflows/nightly-quotation.yml`
exists with its schedule commented out (`workflow_dispatch` only) and does NOT
set `TZ=Asia/Kuala_Lumpur`; the spec logs both `toISOString()` and local
`toString()` instead. The 07:00 half is not automated at all, because the inbox
read needs the signed-in Chrome profile (see [mailtrap.md](mailtrap.md)).
`[verified: .github/workflows/nightly-quotation.yml; tests-nightly/nightly-quotation.spec.ts]`

## The Excel test script is a guide for humans, not a spec for the automation

**The steps in the Excel test script are written to guide a human tester through
the flow. They are not a one-to-one rule for the automation.** Do not translate
the sheet row-by-row into Playwright steps, and do not treat a mismatch between
the sheet and the script as a defect in the script.

**The automation is built from the reference implementation** — the existing
working script or code reference provided for that ticket — not from the sheet.
The sheet tells you *what outcome is being proven*; the reference tells you *how
the flow is actually driven*. When the two disagree on mechanics, the reference
wins; when they disagree on intent, ask.

Practical consequences:

- A single sheet step often expands into several automated actions, and several
  sheet steps often collapse into one — both are correct and neither needs
  justifying.
- Human-only phrasing ("observe that…", "verify the screen shows…") maps to an
  assertion, not to a UI interaction.
- Steps that exist purely to orient a human (navigate, log in, scroll to) may be
  handled by shared setup in the reference rather than appearing in the spec.
- Don't add steps to the sheet to make it match the automation. The sheet stays
  lean and readable for the human running it manually.

`[from Faizuddin, 2026-09-03]`

## Standing rule: every new automation gets "detailed mode" (slow + highlighted)

**Every future Playwright automation in this repo must ship with the same
slowed-down, highlighted playback mode built for the EAINT-12166/12167 E2E
suite (`tests/service-hub/specs/device-purchase-do-ts*.spec.ts`).** Per
Faizuddin, 2026-09-24: *"every future automation we make WILL FOLLOW EXACTLY
like that, where it will have slowed down and highlighted version."* This is
not optional per-ticket polish — it's a baseline requirement, same tier as
having a runner page at all.

**The one exception: a "checker," not a "tester."** Per Faizuddin,
2026-09-24: *"the only time an automation does not need to be slowed is when
the automation is a 'checker', not a 'tester'."* A checker validates data —
no recording, no pass/fail against expected UI behaviour, nothing a reviewer
needs to watch step-by-step (the `/eauto/checker` ROC/TIN validity checks are
the existing example). A tester exercises a flow and proves a UI/business
outcome — that's everything else, including permissions/regression checks
like "User Access Regression" that aren't tied to a specific ticket TS.
**When genuinely unsure which one a new automation is, ask rather than
default either way.**

**What "detailed mode" actually is**, reference implementation in
`tests/service-hub/pages/BasePage.ts`:
- `demoMode` (a protected getter) is true when the `PW_DETAILED` env var is
  `"1"` — gate every demo action behind this, never behind a hardcoded flag.
- `demoHighlight(target, opts?)` — outlines the element being acted on or
  checked (amber by default; pass `{color: "green"}` for "here's the result"
  and `{color: "red"}` for a failure/rejection being demonstrated), holds for
  `demoDelay` ms, then restores the element's original style. No-ops
  instantly when `demoMode` is false, and is wrapped in its own try/catch so
  highlighting can never break a test.
- `demoPause(ms?)` — a bare wait, same default delay, for moments with no
  single element to highlight (e.g. after a page transition).
- `demoDelay` — defaults to 1400ms, overridable via `PW_DETAILED_DELAY`.
- `suppressDemo(fn)` — temporarily disables demo mode for a block of code
  that runs many times in a loop (e.g. filling 40 serial number boxes) so the
  recording doesn't turn into 40 individual highlighted pauses; used
  selectively, not as a way to skip the pattern.

**Wiring required alongside it, every time:**
- The API route that spawns the spec must accept a `detailed` flag from the
  request body and set `PW_DETAILED: detailed === false ? "0" : "1"` in the
  child process's env — **default ON**, matching the 12166 runner
  (`app/api/eauto/12166/run/route.ts`).
- The dashboard page must expose a "Detailed (slow + highlighted)" checkbox,
  checked by default, next to the other run options.

**Standing rule — run-option defaults for every NEW automation page:
Headless = OFF (unchecked), Detailed = ON (checked).** Faizuddin,
2026-10-15: "for all automations, the headless and detailed option, make it
be default [headless = no] and [detailed = yes]", then "not change the
current dashboard. just update the knowledge/skills". So:
- New pages: `DEFAULT_UI_STATE` (or the initial `useState`) uses
  `headless: false, detailed: true`; the run route keeps reading
  `body.headless` / `body.detailed` as sent.
- Existing pages are left as they are (several still default Headless ON:
  jomcheck, 12412, 12107, 12166 tabs, shopping-cart, bdp-creator). Change
  one only when asked.
- A "checker" (see below) may still default Headless ON; this rule is for
  testers.
`[from Faizuddin, 2026-10-15]`
- `playwright.config.ts`'s per-test `timeout` must scale for detailed mode —
  the 12166 suite uses `detailedMode ? 240_000 : 60_000`. A DO-flow test with
  logins, listing searches, popup fields and downloads racks up 30–40
  highlighted steps at ~1.4s each; the fixed 60s default timeout was blown
  through the moment detailed mode got wired in (2026-09-23) until this was
  bumped. **Any new automation reusing the same `playwright.config.ts` needs
  to confirm its own worst-case step count still fits inside the detailed
  timeout, and bump it if not** — this is the same class of bug as TS04's
  manual-gate timeout (see the TS04 entries in
  [flow-device-purchase.md](flow-device-purchase.md)): a test that's
  correct but gets killed by an unrelated ceiling before it can prove it.

**Why this exists:** the point of detailed mode is that a reviewer watching
the recording afterward can follow exactly what the automation looked at and
did, step by step, instead of trusting a pass/fail label. This was worth
enough to Faizuddin that it's now the default expectation for every
automation this repo builds, not a nice-to-have added late.

`[from Faizuddin, 2026-09-24]`

## Standing rule: several TS run as a queue (like 9306)

**Running several TS = a QUEUE, one TS per run call, exactly like 9306 —
standing rule, 2026-10-01.** Faizuddin: "the bulk run is not working. i want
it to work exactly like 9306. update the automation skill to do it like
that." Sending every selected TS to the run route as ONE Playwright `--grep`
call is wrong: EAINT-12339's 17-TS runs at 17:05 and 17:12 were both killed at
exactly 10:00 by the route's own `TIMEOUT_MS`, leaving no per-TS results.
Copy `app/eauto/edereg-precheck/page.tsx` (`QueueState`, `runQueueIndex`,
the `processedRunId` advance effect):
- Run builds one queue item per selected TS (checklist order, setup first)
  and calls the run route with `scenarios: [thatOneTitle]` — strictly one at
  a time, under ONE background-run key.
- An effect consumes each finished run once (`processedRunId`), stores its
  response on the item (passed/failed/stopped), then starts the next. A
  failure does NOT stop the queue; Stop ends it and marks the rest stopped.
- Read the latest queue through a ref (`queueRef`) and start the next run
  AFTER `setQueue`, never inside a setState updater.
- Persist the queue in localStorage so it survives navigating away.
- Everything the run needs (creds, per-TS vehicle numbers, toggles) is frozen
  into the queue at start, so editing the form mid-queue changes nothing.
- Each TS is its own run folder → its own evidence, zip and history entry;
  results show one card per TS plus a compact queue status strip.
Worked example: `app/eauto/jomcheck/page.tsx` (EAINT-12339).

## Standing rule: act on the page only the way a person can

**Act on the page only the way a person can — never inject a value.
Standing rule, 2026-10-15.** Faizuddin: "never inject a value. it should be
done exactly how a human would, by clicking and choosing (for dropdowns or
checklist) and typed in (if the field requires it to type)."

1. **Buttons, links, tabs, radios, checkboxes:** a real `click()` /
   `check()` on the visible, enabled element (or its own label).
2. **Dropdowns:** a native `<select>` → `selectOption()` with the option a
   person would pick (the native list is not part of the page, so this is
   the closest equal to clicking it). A custom dropdown (select2, jQuery UI,
   a styled list) → click it open, then click the option.
3. **Text fields:** type into the visible, editable field with `fill()`;
   use `pressSequentially()` when the field reacts per key (autocomplete,
   input masks, search-as-you-type).
4. **Date fields:** open the picker and click the day. A readonly
   datepicker cannot be typed into — see the eauto-automation-scaffold skill
   §3, readonly datepicker bullet.
5. **File uploads:** click the upload control and answer the file chooser
   (`page.waitForEvent('filechooser')` → `setFiles()`). `setInputFiles()` on
   the input only when the page has no visible control to click, with a
   comment saying so.
6. **Never:** write `.value`, `.checked`, `.disabled` or `.selectedIndex` in
   page JavaScript; `dispatchEvent()` to fake an input / change / click;
   remove a `readonly` or `disabled` attribute; use `{ force: true }` to act
   on something a person could not click. If an element is hidden, covered
   or disabled, do what a person does first (scroll, close the banner, meet
   the precondition). If that is not possible, fail with a message naming
   the blocker. Never force it.
7. **Reading is fine.** `evaluate()` / `innerText()` to READ the page is
   allowed; only writing state is banned. Reaching a page is covered by
   "Navigate via clicks, not URLs" (eauto-automation-scaffold skill §7).
8. **Tolerated for now:** `{ force: true }` on the real close button of a
   banner or overlay inside `dismissBanners()` — it is still the control a
   person clicks.

Existing scripts that break this rule are listed below. Fixing one is a separate, deliberate change per script (see "Don't
touch working automation"); never edit `scripts/eauto-estm-legacy`.

### Scripts that break this rule today (audited 2026-10-15)

Found by searching for `.value =`, `.checked =`, `.disabled = false`,
`dispatchEvent(`, `force: true` and `setInputFiles(` under `scripts/` and
`tests/`. Listed, not fixed — each fix is its own change.

**Writes a value or a tick in page JavaScript (most serious):**

| File | Line(s) | What it does |
|---|---|---|
| `scripts/eauto-e2e/pages/PaymentPage.ts` | 72 | Sets a select's `.value` and fires change |
| `scripts/eauto-duitnow-qr/src/payment.ts` | 44-46, 167-168, 188-190 | Ticks a radio, sets a select, writes the TAC box |
| `scripts/eauto-duitnow-qr/src/dealer.ts` | 207-209 | Writes an input's value |
| `scripts/eauto-estm/utils/session.ts` | 175-177 | Re-enables and ticks a checkbox |
| `scripts/eauto-estm/pages/PaymentPage.ts` | 39-40 | Sets `.checked` |
| `scripts/eauto-estm/pages/BuyerDetailsPage.ts` | 62-64, 143-145 | Re-enables and ticks the consent checkbox |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmSession.ts` | 164-166 | Same as the eSTM session helper |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmPaymentPage.ts` | 30-31 | Sets `.checked` |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmBuyerDetailsPage.ts` | 57-59, 138-140 | Re-enables and ticks consent |
| `scripts/eauto-quotation-reminder/pages/EstmHandoffPage.ts` | 250-251 | Unticks via `.checked = false` |
| `tests/service-hub/pages/ServiceRequestListingPage.ts` | 193-194 | Fallback ticks via `.checked` |
| `tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts` | 134-135 | Writes a date into the field |
| `tests/service-hub/pages/bo/DevicePurchaseDetailsPage.ts` | 157-158 | Writes a field value |
| `scripts/eauto-estm-legacy/tests/estm-bypass-test.spec.ts` | 292-295, 327-330, 396-400 | Re-enables and ticks — frozen baseline, never edit |
| `scripts/eauto-insurance/pages/BasePage.ts` | 123-141 | `dismissBanners()` fallback hides popup ancestors via `style.display/visibility/pointerEvents`, removes `.modal-backdrop`, clears `body.modal-open` — added 2026-10-27, found while comparing Charmain's port `[charmain-repo: tools/insurance-quote-checker/pages/BasePage.ts:123-141]` |

**`{ force: true }` on a page control (not a banner close button):**

| File | Line(s) |
|---|---|
| `scripts/eauto-12107/pages/VehicleDetailsPage.ts` | 66, 137, 152 |
| `scripts/eauto-12107/pages/QuotationPage.ts` | 54 |
| `scripts/eauto-12107/pages/HomePage.ts` | 72-73 |
| `scripts/secarang-insurance/pages/VehicleDetailsPage.ts` | 66, 137, 152 |
| `scripts/secarang-insurance/pages/QuotationPage.ts` | 54 |
| `scripts/secarang-insurance/pages/HomePage.ts` | 72-73 |
| `scripts/eauto-estm/utils/session.ts` | 170 |
| `scripts/eauto-estm/pages/CreateTransactionPage.ts` | 40 |
| `scripts/eauto-estm/pages/BuyerDetailsPage.ts` | 51, 55 |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmSession.ts` | 159 |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmCreateTransactionPage.ts` | 42 |
| `scripts/eauto-quotation-reminder/pages/estmPort/EstmBuyerDetailsPage.ts` | 46, 50 |
| `tests/service-hub/pages/ServiceRequestListingPage.ts` | 188 |
| `scripts/eauto-estm-legacy/tests/estm-bypass-test.spec.ts` | 253, 276, 284, 321 — frozen baseline |

**`setInputFiles()` straight on the input (no file-chooser click):**
`scripts/eauto-edereg-precheck/pages/OtherFunctionsPage.ts` 126-129 and
`scripts/eauto-edereg-precheck/pages/DeregTransactionPage.ts` 621-624. WA
Blaster files are ignored by standing rule.

**Tolerated (item 8):** `force: true` on banner close buttons in the
`dismissBanners()` / session helpers of eauto-company-checker, eauto-12107,
eauto-insurance, eauto-jomcheck, eauto-payment-channels, eauto-estm,
eauto-edereg-precheck and eauto-quotation-reminder.

**Clean:** the EAINT-12412 code (`scripts/eauto-jomcheck/tests/invoice-split-12412*.spec.ts`,
`utils/invoicePdf.ts`) writes no page state.

The eSTM consent checkbox is disabled until a precondition the scripts skip.
The fix there is to meet that precondition the way a person does, not to
keep forcing it. Confirm the real precondition with Faizuddin before changing
anything.

## Standing rule: test-data setups fill a pool, never a TS

**Test-data setups never feed a TS automatically — they fill a pool the
person picks from. Standing rule, 2026-10-15.** Faizuddin: "for every test
data preparation, it will not automatically connect it to any TS. because i
want to be able to make multiple test data, and use those test data into the
related TS. so if the first run failed, i have multiple test data i can
choose from to run it again."

- **No hard link.** A setup's title, summary and DETAIL labels do not name
  a TS ("type this into TS06" is wrong). A TS never reads a setup's output by
  itself.
- **"How many" per setup** (1-10, persisted in UI state). Run queues that many
  runs of the setup, each with its OWN vehicle no. off the running counter
  (per-queue-item env merged over the shared body). A count above 1 needs
  auto-advance ON.
- **Test data pool** (its own collapsible section under the setup box). Each
  PASSED producer run adds one record: kind, vehicle no., transaction no. /
  id (read from the spec's `Vehicle No.` / `Transaction No.` /
  `Transaction ID` DETAIL lines — keep those labels exact), environment,
  created time, source. A TS that itself creates reusable data (e.g. a
  purchase TS another TS reads) may produce records too. Persist in
  localStorage per page. Rows get Copy and Remove; an "Add a record by hand"
  form covers data made outside the automation.
- **Choose the record when selecting the scenario. Standing rule,
  2026-10-15.** Faizuddin: "every ticket that requires test script to fetch
  a data from test data pool, user should be able to choose which data they
  want when select the scenario". Ticking a TS that consumes pool data opens
  a picker INSIDE that TS row, right under its checkbox: the pool records of
  the kinds that TS accepts, newest first, each showing vehicle no.,
  transaction no., environment, date and last use, plus a free-text field
  for a value not in the pool. Nothing is preselected. Run refuses to start
  while a ticked TS has no record chosen, naming the TS. Warn on the row
  when the chosen record was made on another environment. Run configuration
  may mirror the choice, but the row is where it is made.
- **Usage log.** When a TS run on a picked vehicle no. finishes passed or
  failed, append {TS, status, time} to that record, shown as chips in the
  pool and as "last: TSnn passed/failed" in the picker — so a retry picks an
  unused record. Consumed data (e.g. a Failed transaction a TS resubmitted)
  is removed by the person, not automatically.
- Worked example: `app/eauto/12412/page.tsx` (`DATA_KINDS`, `DataRecord`,
  `recordDataOutcome()`, the pool section, the TS pickers).

## Standing rule: the multi-TS dashboard layout is the standard

Faizuddin, 2026-10-01: "make the current dashboard layout for multiple TS to be the
standard in the automation skill moving forward." Every runner page uses the layout
of `app/eauto/jomcheck/page.tsx`: VPN popup on Run, confirm popup on Stop, pass/fail
bar with an "All TS" download, queue strip, ONE card per TS (own video, files,
Details, steps, zip), combined Detailed log with per-TS headers, Past runs grouped
by TS. Full spec: `.claude/skills/eauto-automation-scaffold/SKILL.md` §5 rule 14.

## Standing rule: evidence and results per TS

**Evidence and results are PER TS, never combined per run — standing rule,
2026-10-01.** Faizuddin, after learning a 3-TS run kept only the last TS's
video: "then how am i supposed to know which test evidence for which TS?",
then: "for multiple run, i should still be able to choose to download each
test evidence individually. also for the results in the dashboard, each TS
should have their own sections and details displayed without being
connected/combined with other TS."
- **Map evidence per test from Playwright's JSON report**, not from "newest
  file on disk": each `results[0].attachments` entry gives that test's own
  `video` and failure `screenshot` path, and `results[0].stdout` its own
  `DETAIL:` lines. Parse results FIRST, then publish.
- **Name every file after its own TS**, as the workbook writes it:
  `<ticket>_TSnn.webm` (its own video), `<ticket>_TSnn-failed.png`, and
  downloads saved as `<ticket>_TSnn-<what>-<id>.<ext>`. A file is assigned
  to the check whose label carries the same `TSnn`; one with no TS number
  stays at run level only.
- **Each check in the response carries its own** `tsLabel`, `evidence[]`,
  `video` and `details[]`.
- **Dashboard: one card per TS** — header (status, title, duration,
  "Selected (n)" and "<ticket>_TSnn evidence" zip buttons), then its own
  video, file list (checkbox + per-file Download) and Details on the left,
  its own steps/error on the right. Nothing from another TS appears in it.
  A "Whole run" zip button sits in the pass/fail summary; "Past runs" groups
  each run's files by TS prefix with a per-TS zip.
- Worked example: `app/api/eauto-jomcheck/run/route.ts` (`parseResults`,
  `publishEvidence`) and `app/eauto/jomcheck/page.tsx` (per-TS cards,
  `groupByTs`). `[verified live: 2-test self-run through the real route,
  2026-10-01 — each TS got its own .webm, screenshot, file and details; per-TS
  zip contained only that TS's 3 files]`
- **Bulk download bar wherever there are 2+ TS / runs (2026-10-21).**
  Faizuddin: "for ALL evidence part, if got multiple runs, allow option to
  download all, pass only, fail only, selected". Use
  `components/EvidenceBulkDownload.tsx`: buttons All / Passed only / Failed
  only / Selected (n), plus an `EvidenceGroupCheckbox` on each TS card and
  past-run row. Queue pages download one zip per TS / run; 12166 E2E and User
  Access Regression send `folders` to their download-all route for one zip.
  Pass / fail for Past runs comes from `results` in each run's `meta.json`
  (runs published before 2026-10-21 have none, so they count as neither).
  `[verified: route test 2026-10-21 — 12166 folder zip held only TS01; "../x"
  rejected]`

## Standing rule: capture the module flow every session

**After every session that touches an automation flow, write down how the flow
works — or update what's already written — before finishing.**

The goal is that automating the *next* ticket in a module is cheaper than the
last, because the flow is already documented instead of being rediscovered by
clicking through staging. The scripts are the by-product; the flow knowledge is
the asset that compounds.

Flow documents live here as **flat files named `flow-<module>.md`** — e.g.
`flow-estm.md`, `flow-insurance-purchase.md`. Flat because
`app/api/knowledge/route.ts` lists bare `.md` filenames only and ignores
subdirectories, so anything nested is invisible on the `/knowledge` page.

Each flow document should record the entry points into the flow, the steps and
what identifies each one, the decision points and what they branch on, the real
DOM handles used to drive it, and the preconditions needed to reach it. Tag
provenance as usual, and add the file to the index in
[README.md](README.md). `[from QA team, 2026-08-13]`

## Standing rule — test inputs are typed on the dashboard (2026-10-16)



Every input a TS needs (transaction refs, vehicle nos., SSM, logins) is typed on

the runner page. Fields start blank and are required per selected TS; the

script reads the env var with **no fallback value** and fails naming the

dashboard field. Never prefill with records found while exploring.

Faizuddin, 2026-10-16: "everything that requires input will be need to be

inputted in the dashboard. not you making the values automatically. that is

the rule of the automation/dashboard stuffs we do". `[user rule]`

## Two traps found on the first 12412 live run (2026-10-19)

1. **Main video = the largest video, not the first attachment.** A click that
   opens a short-lived tab (a PDF download) gives the test extra 1-second
   videos, and Playwright may list them before the main one. Picking the
   first video published a 1-second clip as the TS recording. Fixed in
   `app/api/eauto-12412/run/route.ts` (sort video attachments by file size,
   largest first). Same fix applied to `app/api/eauto-jomcheck/run/route.ts` and
   `app/api/eauto-12107/run/route.ts` the same day. Any new run route copies it.
   `[verified: 12412_TS01 run, 2026-10-19 — video.webm 22 MB, video-1/-2 5 KB]`
2. **pdf-parse output has no spaces between cells** ("022JOMCHECK REPORT",
   "118.0018.00"). Never use `\b` word boundaries to find a code or value in
   PDF text; use a substring check or `(?<!\d)…(?!\d)`. See
   flow-jomcheck.md §9h. `[verified: live e-Invoice, uat1, 2026-10-19]`

## Standing rule: a pasted run log gets a findings page (2026-10-20)

1. Faizuddin, 2026-10-20: "every time i give log of my automation run to ask you what
   the issue is, you will generate me this artifact/website with all the relevant
   screenshots". `[user rule]`
2. How: the `run-findings-page` skill (`.claude/skills/run-findings-page/SKILL.md`).
   Per failed check: TS quote, SRD section screenshot (or "Nothing on this"), red-box
   run screenshot, exported-file rows, question for dev. Example:
   `_reference/tickets/EAINT-12107/EAINT-12107-TS06-findings-2026-10-20/`.
3. Every failure screenshot carries a red box + caption on the cell at fault
   (`BasePage.captureIssue`, scripts/eauto-12107). Port it to other suites when they
   are next touched.
4. Quote only an SRD rule that governs the failing behaviour. Trap, 2026-10-20: SRD 12107
   §2.2.7 covers how filter ticks behave, not what the filtered results display.
5. Artifact publishing cannot read the scratchpad; keep the page and its images under
   `_reference/tickets/<KEY>/`.

## Standing rule: eAuto tools keep only their result, saved on the server (2026-10-21)

Faizuddin: "for eAuto automations (basically the ones not connected to any TS, just
for automation) i want to remove the recording. no need recording or evidence. the
only thing i need is the result to be saved. so lets say i run a checker and close my
laptop. the next day, once i open my laptop again, the results of the checker is still
there and i can use it immediately". Scope confirmed the same day: Shopping Cart,
Insurance Purchase E2E and Secarang Regression are test runs and KEEP their recording.

1. **No recording / evidence** on the tool pages. Create eSTM: `video: 'off'` in
   `scripts/eauto-estm/playwright.config.ts`, the route no longer publishes a video.
   Create Pre-Application: `record = false`, no evidence, no Past runs. eSIM, the
   checkers, Create BDP and Insurance availability never recorded.
2. **Result saved on the server**: each tool route ends with `jsonAndSave(key, runId,
   payload)` (`lib/server/savedResults.ts`) → `data/saved-results/<key>.json`
   (gitignored), one file per key, replaced by the next run. Keys:
   `lib/savedRunKeys.ts`. Read / clear: `GET|DELETE /api/saved-results?key=`.
3. **Restored in the browser**: `hooks/useBackgroundRuns.ts` reads every tool key on
   load, never prunes tool results after 24 h, and when a run's request dies
   (laptop asleep → `TypeError`) marks it orphaned and polls the saved copy every
   15 s for up to 6 h. Insurance availability (AppShell jobs) does the same via
   `waitForSavedResult()`; its POST sends `saveKey` so the Secarang Regression tab,
   which shares `/api/secarang/check`, is not saved over it. A page's Clear also
   deletes the server copy.
4. A new tool page = add its run key to `SAVED_RESULT_KEYS` and wrap its route's
   final responses in `jsonAndSave`.
`[verified 2026-10-21: pre-app dry run saved data/saved-results/eauto_preapp.json with
the run's runId; GET returned it; DELETE removed it; no evidence folder written]`

## TS Tracker tallies with /tickets (2026-10-22)

[source: Faizuddin, 2026-10-22: "can you make the TS tracker automatically tally with the tickets page"; chose all four options: same CR list, same TS list per CR, progress on /tickets cards, status from last run]

1. **A ticket page's TS list is read from its own `const SCENARIOS` and `const TS_SECTIONS`** by `lib/server/ticketTsCatalog.ts` (TypeScript parser, nothing executed), served at `GET /api/ts-tracker/catalog`. New ticket pages must keep those two array names, with plain-literal `title` / `section` / `order` / `kind` / `notBuilt` / `deprio` fields, or their TS never reach the tracker.
2. A scenario counts as a TS when its title has a TS id (`12107_TS05: …`, `12166_67_E2E_TS01`) and `kind` is absent or `"ts"`. Objective = the title after the colon, else the summary. CR = the page's Jira key whose number is the id prefix, else its first key.
3. `lib/tsTrackerTally.ts` runs when /tests or /tickets opens. It adds missing CRs and TS through `mergeImport` (objectives filled only when empty), fills status for untouched cases from the runner pages' queue state and the background-run store, and remembers deleted CRs / TS in localStorage `ts_tracker_dismissed` so they are not re-added.

## Charmain's evidence rig — what it does, what to borrow (read 2026-10-27)

Source: `.claude/skills/test-evidence-recording/` and `test-evidence-upload/`
in the read-only clone `_reference/codebases/eauto-qa-charmain/` (commit 0ab45d1).
Tags: `[charmain-repo: <path>:<line>]`, paths relative to that clone; `…/rec/` =
`.claude/skills/test-evidence-recording/`, `…/up/` = `.claude/skills/test-evidence-upload/`.
Her rig is a separate recorder (ffmpeg full-desktop capture + in-page overlay),
not Playwright video. The rig code itself is not in this repo; only its rules
and per-CR notes (EAINT-12054, 12131, 11982, 12155, 11759).

### Rules worth borrowing

1. **One scenario = one fresh fixture = one unbroken recording.** A take that
   borrows another take's setup is not evidence for this scenario. If running
   consumes the fixture (payment, terminal status, one-shot token), record on the
   first run. `[charmain-repo: …/rec/SKILL.md:10-16]`
2. **The fixture must prove the scenario's mechanism**, not only its outcome
   (a "blocked because verification failed" take was armed on a fixture blocked
   for another reason). Encode the rule as a guard that refuses the wrong fixture
   before anything is spent. `[charmain-repo: …/rec/SKILL.md:18-24]`
3. **Trigger-point checklist per take** — every page agreed in scope is a named
   point, shown live in the video and written to a sidecar `.txt`. Never tick a
   point that was not captured; an unreachable screen stays unticked with its
   reason. `[charmain-repo: …/rec/SKILL.md:55-83]`
4. **Three layers of pages:** changed by the CR; preconditions (config,
   permissions, simulator records, which account); downstream (every listing /
   detail / report where the record lands, both portals). A confirmation dialog
   only claims an outcome; the listings prove it. `[charmain-repo: …/rec/SKILL.md:26-51]`
5. **Before AND after on every take**, including takes that change nothing — the
   only way to show a surface did not move. `[charmain-repo: …/rec/SKILL.md:178-193]`
6. **Re-find the record with the same search** (same filters, dates, sort) as the
   leg that opened it; a looser search reports "row missing".
   `[charmain-repo: …/rec/SKILL.md:172-174]`
7. **Every frame names the account in the app's own words** — film the app's
   identity header, not the rig's label. Log in before recording starts so
   credentials never appear on camera. `[charmain-repo: …/rec/SKILL.md:87-95, 176]`
8. **Film the whole detail page**: scroll ~80% of the viewport per step with
   overlap, pause ~1.6 s, return to top; clear highlights before scrolling.
   `[charmain-repo: …/rec/SKILL.md:49; …/rec/references/eaint-12131.md:490-496]`
9. **An evidence value must have a failing branch.** Ask "what would this take
   show if the feature were broken?" — a password case that re-set the fixture's
   password to itself passed 11 takes while proving nothing. Derive values against
   the fixture's current state. `[charmain-repo: …/rec/SKILL.md:131-137]`
10. **Audit the sidecar text, not the take status.** Grep for the rig's own
    warnings (`INCONCLUSIVE`, `take aborted`, `did not reach`). Count finished
    checklists, not takes. `[charmain-repo: …/rec/SKILL.md:139-157]`
11. **Verify a finished take by cutting frames from the video**
    (`ffmpeg -ss <t> -i <mp4> -frames:v 1 … ` → PNG). A full checklist and exit 0
    cannot see which tab was on screen — a 12/12 take was frozen on a static page
    because the View link opened a second tab. `[charmain-repo: …/rec/references/eaint-12131.md:680-695]`
12. **Hold native `confirm()` / `alert()` ~2 s before accepting** and take a
    desktop still; they are browser chrome that Playwright screenshots cannot see.
    Never touch the page inside the dialog handler (deadlock).
    `[charmain-repo: …/rec/references/eaint-12131.md:697-701, 728-733]`
13. **A best-effort action needs a short explicit timeout** (2–3 s) and a logged
    reason when it fails — the same rule as our playbook § Spec conventions.
    `[charmain-repo: …/rec/SKILL.md:307]`
14. **Gate an expensive run on the environment first** — probe VPN / eSim with a
    burst (e.g. 12 probes, 3 s apart), not one ping; a fresh FortiClient tunnel
    flaps for 1–2 minutes while the adapter reads "Up".
    `[charmain-repo: …/rec/SKILL.md:85; …/rec/references/eaint-12054.md:318-346]`
15. **Personal data in evidence** (IC numbers, names, addresses) is the data
    subject's decision; ask once, record the answer. Mask every sink (video AND
    sidecar). `[charmain-repo: …/rec/SKILL.md:145-149]`
16. **Values typed into the system should be plain ASCII** derived from a login or
    record id, never a display label (an em dash in a label failed an unrelated
    take). `[charmain-repo: …/rec/SKILL.md:288]`
17. **Downloaded artefact = evidence:** open it read-only, never save, hash before
    and after, highlight the row under test, match on the whole row, not one id.
    `[charmain-repo: …/rec/SKILL.md:110-129]`

Rig mechanics we do not use (synthetic cursor that arrives before every click,
yellow `#facc15` ring, checklist panel layout, window pinning for Excel legs):
`[charmain-repo: …/rec/SKILL.md:225-311]`. Read it before building a desktop
recorder; our runner uses Playwright video + `PW_DETAILED` highlighting instead.

### Upload to the evidence library (her skill)

1. Library root: `QA Team - Documents\OneDrive - MODE FAIR SDN BHD\QA Team - Documents`
   (doubled nesting is a sync artefact) → `eAuto Project\eAuto - Test Evidence\`
   `1. Enhancement CR` / `2. Staging Regression` / `3. Production Regression`.
   CR folders are pre-created by others; match on ticket number (names are
   truncated, carry emoji, may cover several tickets). Stop if the folder already
   has files. `[charmain-repo: config/evidence.yaml:114-157; …/up/SKILL.md:12-41]`
2. Upload the video and downloaded files only — no stills, sidecars, manifests,
   or run summaries (a stale `_run-summary.txt` showed a FAIL for a passing case).
   Pick the take whose sidecar shows a full checklist, not the newest file.
   `[charmain-repo: …/up/SKILL.md:43-98]`
3. Paths: SharePoint full-path ceiling ~400 chars; team's longest existing path
   325; title cap 28 chars; copy with the `\\?\` prefix. Charmain, 2026-09-01:
   name downloads `TS11 - 1.xlsx`, `TS11 - 2.xlsx` (short) with a
   `READ ME FIRST.txt` index. `[charmain-repo: …/up/SKILL.md:100-185; config/evidence.yaml:159-168]`
4. SharePoint rewrites every uploaded Office file (adds customXml, docProps
   parts), so a size/hash verify flips from OK to mismatch minutes later; compare
   Office files part by part. `[charmain-repo: …/up/SKILL.md:204-210; scripts/evidence/probe_office_compare.py]`

**Conflicts with our rules:**
1. **TS numbering.** Hers: `TS<n>` with no zero padding (`TS9`, not `TS09`).
   Ours: always two digits (`TS01`). `[charmain-repo: …/up/SKILL.md:115]`
2. **Destination.** Hers: the shared QA Team evidence library. Ours: files for
   "my SharePoint" go to Faizuddin's personal OneDrive `eAuto Documents\EAINT-XXXXX\`
   folder, never the QA Team site (since 2026-10-21).
3. **Recording.** Hers: Playwright video only on failure; evidence from the
   separate desktop recorder. Ours: every TS run keeps its Playwright video and
   publishes it per TS (this file § "Evidence and results per TS").
