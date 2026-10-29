---
name: eauto-automation-scaffold
description: Scaffold a new eAuto Playwright automation project (a scripts/eauto-<name> project + its app/eauto/<name> dashboard page + app/api/eauto-<name>/run route). Use whenever the user asks to "build automation", "create a runner/checker page", or "automate" a ticket/module for eAuto, or asks for a new TS scenario/page object inside an existing eauto-* project. app/eauto/12166 + tests/service-hub are the standing benchmark (Faizuddin, 2026-09-30) — never invent a lighter-weight convention.
---

# eauto-automation-scaffold

Every new eauto-* Playwright project — and every new scenario added to an
existing one — follows the **same standard flow** as `app/eauto/12166`
(`E2ETestsTab.tsx` + `app/api/eauto/12166/run/route.ts`) and
`tests/service-hub`. This is not optional per-project style; it is a standing
rule. `scripts/eauto-jomcheck` (EAINT-12339, built 2026-09-30) is the newest
worked example of the whole pattern applied from scratch — read it alongside
12166 when scaffolding the next one.

**Never build a lighter version** (a raw `--grep` text box instead of a
checklist, no demo mode, no video) because the ticket "only needs a quick
check" — the checklist/demo-mode/video machinery costs almost nothing to
include and every project ends up needing it as soon as a second scenario or
a failure needs reviewing.

## 1. The Playwright project — `scripts/eauto-<name>/`

```
scripts/eauto-<name>/
  package.json          same shape as scripts/eauto-jomcheck/package.json
  playwright.config.ts  PW_HEADED / PW_VIDEO / PW_DETAILED-aware, json + step reporters
  data/config.ts         CONFIG — baseUrl (env-switchable), every path/timeout
  data/users.ts           UserCredentials, env-based, never hardcoded real creds
  pages/BasePage.ts       demo mode (below) + dismissBanners()
  pages/*.ts              one page object per screen, extends BasePage
  reporters/step-reporter.ts   copied verbatim from tests/service-hub
  tests/*.spec.ts         test.step() wrapped, titles are stable TS ids
```

Copy `scripts/eauto-jomcheck/playwright.config.ts` and
`reporters/step-reporter.ts` **verbatim** — don't re-derive the
`PW_HEADED`/`PW_VIDEO`/`PW_DETAILED`/reporter wiring by hand.

**Viewport trap**: setting `viewport` only in the top-level `use` block is
not enough — `devices['Desktop Chrome']` (spread into each `projects[].use`)
carries its own 1280x720 viewport and silently overrides it, since the
project's `use` is applied after the top-level one. Set `viewport` again
**inside the project block, after the spread**:
`use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }`.
Confirmed as a real (not hypothetical) bug 2026-10-01 in `eauto-jomcheck` —
the top-level 1920x1080 was silently getting clobbered back to 1280x720 —
and it's the exact same trap `tests/service-hub/playwright.config.ts`
already documents inline. Check both places whenever a run's recording
looks narrower than expected.

**Video-resolution trap (different from the viewport trap above, same
symptom's cousin): `video: 'on'` as a bare string gets DOWNSCALED by
Playwright, even with the viewport trap already fixed.** Confirmed live,
2026-10-03, EAINT-12339: Faizuddin's viewport was correctly 1920x1080, yet
the recorded `.webm` was visibly pixelated. Cause: Playwright's `video`
option, passed as a plain `'on'`/`'off'` string, lets Playwright choose its
OWN recording size — which defaults to the viewport **scaled down to fit an
800x800 box** (1920x1080 becomes ~800x450) regardless of how large the real
viewport is. Fix: pass the object form with an explicit `size` matching the
real viewport —
```ts
video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
```
instead of `video: videoOn ? 'on' : 'off'`. **This bug is not
jomcheck-specific — it was found in EVERY other eauto-* project's
`playwright.config.ts` at the time of this fix** (`eauto-e2e`,
`eauto-edereg-precheck`, `eauto-estm`, `eauto-estm-legacy`,
`eauto-quotation-reminder`, `secarang-insurance`, and the benchmark itself,
`tests/service-hub`), all using the bare-string form. **Any new project
scaffolded from this skill must use the object form with explicit `size`
from the start** — and if you're ever asked to look at an existing
project's recording quality, check this before assuming the problem is
something else. Fixing the other already-existing projects is a separate,
deliberate decision for whoever owns them — don't silently touch files
outside what you were asked to fix, even when you recognise the same bug.

## 2. Demo mode — `BasePage.ts`

**Also port `waitForDialog()` / `acceptConfirmDialog()` /
`dismissConfirmDialog()`** — every jQuery UI Yes/No confirm across this app
(logout, payment, deletion, ...) uses the same `.confirm-dialog-btn`/
`.cancel-dialog-btn` classes, so these three helpers work everywhere, not
just where they were first needed. Confirmed 2026-10-02: `payNow()` in
`UcdJomCheckPurchasePage` clicked "Pay Now" and immediately read the result
text without accepting the "Payment" confirm dialog that click opens — the
page silently never advanced, and the assertion failed against the STALE
pre-click text. **Any button whose click plausibly triggers a confirmation
(pay, delete, submit-with-side-effects) needs a `waitForDialog()` +
`acceptConfirmDialog()` immediately after the click, not an assumption that
one click finishes the action.** If you haven't captured what the dialog
actually looks like yet, ask the user to trigger it once and paste the
resulting HTML — same "ask, never invent" rule as everything else, applied
to dialogs specifically.

**After accepting a confirm dialog that triggers a REAL backend call (a
payment, a submission to a live API), wait for a REAL UI SIGNAL that the
action finished — not for a text match.** EAINT-12339's TS02, 2026-10-03,
went through two attempts:
- **First attempt (wrong): poll `#result`'s text for a change.** Assumed a
  real payment eventually rewrites `#result` to a success message, the same
  way the eSim-backed fast path does. Faizuddin caught this: "after clicking
  pay now, the automation still checks the wording for Vehicle Number Found.
  by right, shouldnt check that anymore" — a real API-connected payment
  doesn't reliably update that text at all; waiting on it is checking the
  wrong thing.
- **Second attempt (correct): wait for a button/element that is PROVABLY
  absent before and present after the action, regardless of wording.** For
  JomCheck, `#to-view-report` ("Download Report") doesn't exist on the
  pre-payment screen and does exist on the post-payment one (confirmed from
  both captured HTML states) — so `payNow()` now does
  `this.downloadReportBtn().waitFor({ state: 'visible', timeout:
  CONFIG.paymentProcessingTimeout })` instead of any text comparison.
  **Find this kind of structural signal for every "did the real backend
  call actually finish" wait** — a button that only appears on success, a
  status badge, a section that only renders once data loads — rather than
  matching copy that may not be designed to change at all. Expose it as a
  public boolean helper (`isReportReady()`) so every spec's own "confirm it
  completed" step asserts the real signal too, not wording.

**Give this wait its OWN timeout constant, separate from whatever
general-purpose one BasePage already has** — a real payment/API round-trip
can take minutes, not seconds (EAINT-12339: Faizuddin confirmed ~2 minutes
end to end, so `paymentProcessingTimeout` was set to 5 for headroom), and you
don't want every OTHER poll in the suite defaulting to that same
multi-minute ceiling. **Raise the suite's `playwright.config.ts` per-test
`timeout` to comfortably exceed this new wait ceiling too** — a 5-minute
wait inside a 60s/180s-per-test config just gets killed by Playwright itself
before it ever finishes, regardless of how correct the wait logic is. This
matters most for any TS whose own precondition is "connect to the live API"
(vs. an eSim-backed one) — put the fix in the SHARED method (here,
`payNow()`) so every TS that calls it is covered at once, not just the one
that happened to surface the bug.

**Every TS whose own precondition is "connect to the live API" must
download AND PERSIST whatever it downloads, regardless of what else in the
test passes or fails.** Faizuddin, 2026-10-03: "for all JomCheck API ts,
make sure it downloads and save the report, whatever the scenario is. Since
the download from JomCheck is limited, we need to make sure we get all
details possible in case need to refer in the future." A live-API download
is often rate-limited or otherwise precious (JomCheck: 20 reports/day per
the workbook's own Golden Rule) — losing one to a discarded temp file is
losing a real, hard-to-repeat resource. Save it via
`BasePage.saveDownloadAsEvidence()` (or inline the same `PW_EVIDENCE_DIR`
check if the method also needs to parse the file, e.g. for a PDF/Excel
crosscheck — see `UcdJomCheckPurchasePage.downloadReportAsText(label)`:
saves to evidence AND returns parsed text, falling back to a deleted temp
file only when no evidence dir is configured). **Label every such save with
the scenario id + the identifying value** (e.g. `"TS02-report-HXA0007A"`) —
several API-requiring TS can share one run's evidence folder, and a generic
label lets one overwrite another's saved file. Do this unconditionally,
as early as the download becomes possible (right after the payment/API call
completes) — not gated behind a later assertion that might throw first and
skip it.

Port `demoMode` / `suppressDemo()` / `demoDelay` / `demoPause()` /
`demoHighlight()` from `scripts/eauto-jomcheck/pages/BasePage.ts` (itself
ported from `tests/service-hub/pages/BasePage.ts`) into every new project's
`BasePage.ts`, unchanged.

Then, in every page object:
- **Before acting** (fill/click/check): `await this.demoHighlight(locator)`
  (amber, the default).
- **On a value the test reads and asserts**: `await this.demoHighlight(cell,
  { color: 'green' })` before reading it.
- Wrap any bulk scan/finder loop (searching many rows for one match) in
  `this.suppressDemo(async () => { ... })` so it doesn't flood the recording.

This is not decoration — it's what makes the recording reviewable step by
step instead of an unreadable fast-forward blur.

**Evidence capture (Faizuddin, 2026-10-02)**: `BasePage` also carries two
evidence helpers, ported from `scripts/eauto-jomcheck/pages/BasePage.ts`:
- `captureEvidence(label, target?)` — a plain screenshot (full page, or one
  locator) saved under `PW_EVIDENCE_DIR` (set by the run route per-run; a
  no-op when unset, so bare CLI runs never break). Call this at any point a
  reviewer would want a still image beyond the video — e.g. the exact
  moment a value was read.
- `captureHighlightedPdfEvidence(label, pdfPath, highlightBox, opts?)` —
  **"if the scenario requires to cross check with pdf, or anything that is
  downloaded, make sure to save the screenshot of the PDF with the part
  that is being checked to be highlighted, so that users know what to look
  at when reviewing the screenshot."** Opens the downloaded PDF in
  Chromium's own viewer (a plain `page.goto('file://...')` renders it
  natively), draws a red highlight box + caption at the given pixel
  coordinates, screenshots it, and saves it as evidence. **Never fake the
  coordinates** — if you don't know exactly where the checked text sits,
  say so in the spec/PR rather than passing a guessed box; a wrong
  highlight is worse than none, since it tells the reviewer to look at the
  wrong spot. Any scenario that downloads a PDF/invoice/report and asserts
  on its contents should call this, not just eyeball the download succeeded.
  **Prefer `capturePdfWithHighlights()` (`scripts/eauto-jomcheck/utils/pdfHighlight.ts`,
  2026-10-15) for every new suite.** Chromium's built-in PDF viewer does not
  exist in a headless run (the default), and the helper above needs
  hand-measured boxes. The new helper draws the saved PDF with pdf.js (the
  copy bundled in `pdf-parse`, no new dependency) in its own unrecorded
  browser context, gets each word's exact position from pdf.js, boxes every
  occurrence of each checked string, and writes `<label>-checked.png` next to
  the PDF with a caption listing what was found and, in bold, what is "Not on
  the PDF". Call it right after the download, before any assertion, with the
  exact strings the assertions check. Verified on the EAINT-12412 SRD sample
  invoice and e-Invoice (13/13 and 14/14 items boxed on the right words).
  Copy the file into a new suite's `utils/` and add `--lib es2020,dom` if the
  suite typechecks files on their own.
  **Colours (Faizuddin, 2026-10-19: "if it pass, the box is green. but if its
  incorrect, the incorrect details will have red boxes"):** pass a spec, not a
  flat list — `{ expected, forbidden?, anchors?, perLine? }`. GREEN = expected
  item found; RED = a forbidden item found, a line missing its per-line code,
  or the row (`anchors`) where a missing expected item belongs; anything with
  nowhere to box is listed in red in the caption. The caller must say which
  result it expects (12412: `'two-line'` / `'one-line'`), so a correct
  "before" document is green, not red. Worked example:
  `buildHighlightSpec()` in `scripts/eauto-jomcheck/utils/invoicePdf.ts`.
- **Programmatically crosschecking a PDF's actual text (not just a visual
  screenshot) uses `pdf-parse`** — EAINT-12339's TS02 (2026-10-03): download
  via `page.waitForEvent('download')`, `download.saveAs()` to a temp file
  (`os.tmpdir()`), `pdfParse(fs.readFileSync(tmpPath))`, then
  `.text.replace(/\s+/g, ' ').trim().toUpperCase()` for a normalised string
  to run `.includes()`/`.toContain()` checks against — delete the temp file
  in a `finally`. Add `pdf-parse` + `@types/pdf-parse` to the suite's own
  `package.json` (it's a per-project dependency, not hoisted) and copy the
  pattern from `scripts/secarang-insurance/pages/PaymentSuccessPage.ts`
  (`downloadReceiptPDF()`/`_comparePDFWithSuccess()`) or
  `scripts/eauto-jomcheck/pages/UcdJomCheckPurchasePage.ts`
  (`downloadReportAsText()`) rather than re-deriving it. **Only assert on
  values the UI side actually populated** — crosschecking a blank/`N/A`
  listing cell against the PDF is meaningless, it "matches" trivially. This
  complements `captureHighlightedPdfEvidence()` above, it doesn't replace
  it — the screenshot is for a human reviewer, the parsed text is for the
  assertion itself.
- **A TS that downloads an Excel export (`.xlsx`/`.csv`) follows the SAME
  two rules as a PDF — include it in evidence, AND verify it if automation
  can.** Faizuddin, 2026-10-03: "for downloading excels, the automation must
  also allow the excel to be included in the test evidence bulk download.
  if automation is able to check, make sure the automation can check and
  verify also. do this for future TS where it needs to download excel."
  - **Evidence**: `BasePage.saveDownloadAsEvidence(download, label)` saves
    ANY downloaded file (not just a screenshot) under `PW_EVIDENCE_DIR`,
    keeping its own extension — call it right after
    `page.waitForEvent('download')` resolves. This requires the run route's
    `publishEvidence()` to copy every file under `PW_EVIDENCE_DIR`, not just
    `.png` (it used to filter to `.png` only, which silently dropped
    anything else) — classify each by extension (`classifyEvidenceKind()`:
    image/video/file) so the dashboard can show a sensible icon, and widen
    `EvidenceItem["kind"]` to `"video" | "image" | "file"` in both the run
    route and the dashboard page (`FileSpreadsheet` icon for `"file"`, next
    to the existing `Film`/`ImageIcon`). Copy
    `scripts/eauto-jomcheck/pages/BasePage.ts`'s `saveDownloadAsEvidence()`
    and `app/api/eauto-jomcheck/run/route.ts`'s `classifyEvidenceKind()` /
    widened `publishEvidence()` loop rather than re-deriving either.
  - **Verification**: if the suite can parse the file, it MUST assert on its
    contents, not just confirm a download happened. `exceljs` (already a
    dependency in every eauto-* project scaffolded from this skill) reads
    `.xlsx` — `new Workbook().xlsx.load(buffer)`, then walk
    `worksheet.getRow(n).getCell(colIndex)` for the values the TS's expected
    result actually names. Save the download to a temp file first
    (`os.tmpdir()`, delete it in a `finally`), same shape as the PDF
    `pdf-parse` pattern above — don't invent a different temp-file
    convention for Excel vs. PDF.
  - Only when NEITHER evidence inclusion NOR verification is possible (e.g.
    the file format genuinely can't be parsed, or the TS's own expected
    result is something no parser could check) does bare
    "a download happened" become acceptable — and that gap should be stated
    explicitly in the spec's comment and `knowledge/flow-<module>.md`, same
    as any other partial-scope TS (see §5 item 11, the dev-dependent-sub-step
    rule, below).

## 3. Test specs

- **Act on the page only the way a person can — never inject a value.
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

  Existing scripts that break this rule are listed in
  `knowledge/automation-testing.md` § "Act on the page only the way a person
  can". Fixing one is a separate, deliberate change per script (see "Don't
  touch working automation"); never edit `scripts/eauto-estm-legacy`.
- One `test()` per TS scenario, title exactly `"<TICKET>_TSNN: <one-line
  summary>"` (or `TSNN/TSMM` when one test covers two scenarios) — this title
  is matched **exactly** by the dashboard's scenario list and the run route's
  `--grep`. Renaming it means renaming it in both places.
- **Wrap EVERY user-visible action in its own `test.step('<plain-language
  sentence>')`, not just the assertion blocks** — Faizuddin, 2026-10-02: "i
  want the steps to be similar to 9306, where it lists out one by one...
  its literally the human language for what it did." One step per login,
  per navigation, per field filled, per button clicked, per thing read and
  checked — `'Log in to UCD'`, `'Open the JomCheck purchase page'`, `'Enter
  vehicle number HXA0001A and submit'`, `'Confirm the vehicle was found'`,
  not one giant step covering the whole flow. The run route's
  `filterSteps()` keeps ONLY `test.step` entries — Playwright's own
  auto-recorded `expect`/`pw:api` steps are dropped even when they failed
  (not just when they passed), so an unwrapped action is invisible in the
  dashboard's step list, and a step wrapped too coarsely just shows one
  vague line instead of the sequence a reviewer actually wants.
- **A listing/search page's blank state and its post-search state are often
  structurally different, not just empty-vs-populated** — the blank state
  may have no `<table>` at all (the header row only renders once a search
  returns ≥1 row). Confirmed 2026-09-30: `BoJomCheckReportListingPage`'s
  `getColumnHeaders()` (used by TS16, "all 29 columns present") returned `[]`
  because the spec asserted on headers right after `goto()`, before ever
  calling `searchByVehicleNo()` — the blank listing genuinely has no table
  to read headers from. Before writing an assertion that reads table/list
  structure, check the captured HTML's blank-state file
  (`_reference/html/eauto/*.html`, "STATE 1" vs "STATE 2" in the header
  comment) for whether the structure exists pre-search — if the blank state
  wasn't captured, search first defensively rather than assuming the markup
  is there.
- **A date field rendered with `readonly` + `class="hasDatepicker"` CANNOT be
  `.fill()`'d — Playwright refuses to act on a readonly element at all, and
  the call just times out after the full `actionTimeout` (30s default)
  waiting for "element to be editable", never reaching whatever comes
  after.** Confirmed live, 2026-10-03, EAINT-12339's TS27: looked exactly
  like "the automation didn't click Search" from the outside, but the real
  cause was a `.fill()` silently stuck on a jQuery UI datepicker field the
  whole time. **This is a site-wide jQuery UI convention, not one page's
  quirk** — the fix already existed in
  `scripts/eauto-edereg-precheck/pages/BoDeregTransactionListingPage.ts`
  (EAINT-9306) before this ticket ever needed it: click the field to open
  `#ui-datepicker-div`, then click `.ui-datepicker-today a` — jQuery UI
  always marks the CURRENT calendar day with that class regardless of which
  month the widget happens to be showing, so it needs no foreknowledge of
  today's date. **This only gets you "today"** — picking an earlier
  month/year needs the real opened-widget HTML to implement without
  guessing (some datepicker instances expose prev/next arrows only, others
  `changeMonth`/`changeYear` dropdowns) — don't invent the navigation without
  seeing it live. Before writing ANY `.fill()` against a date input, check
  whether the captured HTML marks it `readonly` — if so, this is the
  pattern, not a timing/wait-longer fix.
- **Never assert an exact row count (`toBe(1)`) on a listing search keyed by
  a value that can be REUSED across runs — assert `toBeGreaterThan(0)`
  instead.** EAINT-12339's TS02, 2026-10-03: once run more than once against
  the same fixed/reused vehicle no. (a real registered vehicle, reused
  because the auto-advance counter was deliberately turned off — see item 6
  in §5), the search correctly returned 3 rows, one per past purchase — the
  test's `toBe(1)` was wrong, not the automation. This isn't limited to a
  deliberately-reused value: a chassis no. has NO auto-advancing counter at
  all (see §5 item 6's "no auto-generation" sub-point), so any TS keyed on
  one is in this position on every 2nd+ run regardless of any toggle
  (EAINT-12339's TS03 had the identical latent bug). Use `toBe(1)` only for
  a value you can be certain is freshly generated and never reused (an
  auto-advancing counter at its default setting) — anything else, assert
  presence (`toBeGreaterThan(0)`) and read row 0 on the documented assumption
  that the listing sorts newest-first (confirm this per-app rather than
  assuming it generalizes).
- **A TS that spans two accounts (e.g. UCD to buy, then BO to check) uses ONE
  page/context, not two separate `browser.newContext()` calls** — Faizuddin,
  2026-10-01: "for multiple users TS without concurrent running, it should
  use the same browser so that the recording will be able to record
  everything in one recording only." Log out of the first account
  (`LoginPage.logout()` — loads the logout URL directly, skipping the native
  `confirm()` dialog the real logout link triggers) then log into the second
  **on the same `page`**, so the whole flow lands in one `.webm`. Only reach
  for a second `browser.newContext()` when two accounts genuinely need to be
  live in parallel (concurrent, not sequential) — see
  `scripts/eauto-jomcheck/tests/ucd-purchase-to-bo-listing.spec.ts` for the
  worked example (UCD purchase → `logout()` → BO check, one `page`
  throughout).

## 4. The run route — `app/api/eauto-<name>/run/route.ts`

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

Where a bullet below says "the newest .webm" or one Evidence box for the
whole run, the rule above replaces it.

Copy the shape of `app/api/eauto-jomcheck/run/route.ts` (itself following
`app/api/eauto/12166/run/route.ts`):
- Accepts `scenarios: string[]` (exact `test()` titles, not a raw grep
  string) — the dashboard sends ONE per call (queue rule above); the array
  stays for setup utilities and older callers — escape regex metachars, join with `|`, pass as `--grep`.
- Sets `PW_HEADED` (from the `headless` toggle → `PW_HEADED=0` when true)
  and `PW_DETAILED` (from the `detailed` toggle). The dashboard always
  sends both; their DEFAULTS live in the page (§5 rule 5: Headless OFF,
  Detailed ON). Also sets `PW_JSON_REPORT`,
  `PW_STEP_REPORT`, and `PW_EVIDENCE_DIR` (a scratch
  `test-results/_run/evidence/` dir — see §2's evidence capture) — all
  pointing at a `test-results/_run/` scratch dir.
- **`PW_VIDEO` is NOT hardcoded to `"1"`** — a test-data-setup run never
  records. Faizuddin, 2026-10-02: "running a test data setup wont record. it
  will simply show the details." Accept `record?: boolean` in the POST body
  (dashboard computes it: `false` only when EVERY selected scenario is
  `kind: "setup"`), set `PW_VIDEO: record !== false ? "1" : "0"`, and skip
  the video-lookup half of `publishEvidence()` entirely when `record` is
  false — a STALE `.webm` from an earlier recorded run must never get
  mistaken for this run's (Playwright writes no new file at all when
  `PW_VIDEO=0`, so "newest .webm on disk" would silently pick up the wrong
  one).
- **`DETAIL:` lines replace the recording for a setup run** — any spec can
  print `console.log('DETAIL:' + JSON.stringify({ label, value }))` for a
  plain fact worth surfacing (vehicle no., transaction id, reference no.,
  anything "usefull for any particular test data setup" per Faizuddin).
  `parseDetails(output)` scans the run's full stdout for these lines and
  returns `{label, value}[]` in the response as `details` — always parsed,
  regardless of `record`, so a TS that happens to emit one still gets it
  shown; the dashboard just prioritizes it as the primary panel only when
  there's no video.
- After the process exits: `loadStepsByTitle()` the step report,
  `parseResults()` the JSON report merging in each test's steps, and run
  `toPlainEnglish()` on any error to produce `friendlyError` alongside the
  raw `error`.
- **Always return the FULL raw stdout+stderr as `log`, not just on
  failure** — `checks.length ? undefined : result.output` (the earlier
  "only when nothing else parsed" convention) hides the technical detail on
  every successful run. Faizuddin, 2026-10-02: the log needs a copy button
  at the bottom "so that i can copy and send it to claude" — that only works
  if it's actually there to copy, win or lose.
- Generate a `runId` (`String(Date.now())` — fine here, this is a normal
  Next.js route, not a Workflow script) and `publishEvidence(runId,
  evidenceDir, runLabel)`: copy every `.png` under `PW_EVIDENCE_DIR` PLUS the
  newest `.webm` into `public/qa-artifacts/eauto-<name>/<runId>/`, pruning any
  OLDER run's folder (this dashboard only ever shows the latest run), and
  return `{ video, evidence: {label, url, kind}[] }` alongside `runId` AND
  `runLabel` in the response — copy `scripts/eauto-jomcheck`'s
  `publishEvidence()` rather than re-deriving it.
- **Naming: the recording and the bulk-download zip are named after the TS
  number(s), WITH the ticket prefix, matching the TS workbook exactly —
  never a bare "TS01", never the runId or a generic "run"** — Faizuddin,
  2026-10-02: "the naming of the recording must be the TS number. same goes
  for the zip file for bulk download." Then, 2026-10-03, after a first pass
  dropped the ticket prefix: "the test evidence naming must follow the
  excel. in excel, it is showing like this: 12339_TS01" — the workbook's own
  "TS No." column IS "12339_TS01", so that's the label, not "TS01".
  `deriveRunLabel(scenarios: string[])` groups every `TSNN` found in each
  selected title under that title's OWN leading ticket number (the digits
  before the first `_`), so a combined title like `"12339_TS18/TS19: ..."`
  correctly produces `"12339_TS18_TS19"` (both codes under the one ticket),
  not `"12339_TS18_TS19"`'s naive cousin `"TS18_12339_TS19"` or a bare
  `"TS18_TS19"`. A non-TS "setup" scenario has no `TSNN` so it falls back to
  the bit before the colon, still under its ticket prefix (`"12339_PURCHASE"`).
  Use this label for the video's filename (`${runLabel}.webm`, not
  `run.webm`) and pass it through to the download-all route (as `runLabel`
  in the POST body) so the zip's `Content-Disposition` filename matches —
  the `runId` stays purely internal (which public/ subfolder to read), never
  user-facing. Copy `scripts/eauto-jomcheck`'s `deriveRunLabel()` verbatim —
  it already handles the multi-code-one-ticket grouping correctly.
- **Screenshot labels (`captureEvidence()`'s `label` argument, §2) follow
  `<ticket>_<TS Number>-<what it's checking, kept general>`** — e.g.
  `"12339_TS16-column-headers"`, `"12339_TS17-non-blank-values"` —
  Faizuddin, 2026-10-02: "the name can be general, doesn't have to be
  specific"; then 2026-10-03: "the test evidence naming must follow the
  excel. in excel, it is showing like this: 12339_TS01" — same ticket-prefix
  rule as the recording/zip label above, applied to every individual
  evidence file too, not just the run-level name. The TS number makes it
  obvious which scenario produced the file once it's sitting alongside every
  other run's evidence in a downloaded zip; the description after the dash
  just needs to say what's being looked at, not spell out the exact
  assertion.
- A second route, `app/api/eauto-<name>/download-all/route.ts`: accepts
  `{ runId, runLabel?, files?: string[] }`, zips either every file in that
  run's public folder or just the given filenames (PowerShell
  `Compress-Archive` on win32, `zip` elsewhere — copy
  `app/api/eauto/12166/download-all/route.ts`'s approach), and streams the
  zip back named `${runLabel}.zip` (falling back to `runId` only if no
  label was sent). Validate `runId` against `/^[0-9]+$/`, `runLabel` against
  `/^[\w-]+$/`, and each filename against `/^[\w.-]+$/` before touching the
  filesystem with them.
- Support `DELETE` (Stop) via the same `stopRequested`/`killTree` pattern —
  copy it, don't re-derive.

## 5. The dashboard page — `app/eauto/<name>/page.tsx`

Copy the shape of `app/eauto/jomcheck/page.tsx` / `app/eauto/12166`'s
`E2ETestsTab.tsx`. **Nine standing rules, all from Faizuddin (2026-09-30
through 2026-10-02), non-negotiable for any new page — not just this one**:

1. **A `SCENARIOS: Scenario[]` array**, one entry per automated TS/utility
   (`id`, `title` matching the spec's `test()` title exactly, `summary`,
   optional flags like `needsServicePortal`/`needsUcd` for conditional
   credential fields) — **never a free-text grep box**. Add one row here
   every time a new spec is added.
2. **TS scenarios are sorted in ascending order** by TS number — give each
   entry an `order: number` (its lowest covered TS number: `12339_TS05/TS17`
   → `order: 5`) and render `SCENARIOS.filter(s => s.kind === "ts").sort((a,
   b) => a.order - b.order)`, never hand-ordered array position alone
   (easy to get wrong once entries get added out of order later).
3. **Test-data-setup utilities get their OWN section, never mixed into the
   TS checklist, and that section is rendered ABOVE the TS section** — a
   `kind: "ts" | "setup"` field splits `SCENARIOS` into two arrays, each
   rendered as its own box with its own "Select all"/"Clear" (a shared
   `selected: Set<string>` underneath is fine — the split is
   presentational). Setup goes first because it reads in the order the work
   actually happens: prepare the data, then run the TS against it. "Let me
   type a vehicle no. and just create the purchase" is a `kind: "setup"`
   entry (e.g. `eauto-jomcheck`'s `12339_PURCHASE`), not a TS row and not a
   separate page — the same checklist+flag pattern handles both.
4. **Run configuration (env URL, credentials, vehicle numbers, Headless/
   Detailed) lives in ONE horizontal section at the TOP of the page, never
   a narrow sidebar column** — a sidebar wastes width and pushes config
   below the fold on a tall scenario list. Use a `grid grid-cols-1
   sm:grid-cols-2 lg:grid-cols-4 gap-3` card above the scenario sections,
   with conditional fields (UCD/Service Portal creds, fresh-vehicle-no.)
   appearing inline in that same grid, not as a separate popover or column.
5. **The page must look exactly the same after navigating away and back** —
   not just the run result (which already persists via `useApp()`'s
   `runs`/`startRun`/`stopRun`, see `hooks/useBackgroundRuns.ts`), but the
   FORM itself: which scenarios were checked, and the Headless/Detailed
   toggles. Persist `{ selected: string[], headless, detailed }` to
   `localStorage` (a second key alongside the credentials one, e.g.
   `eauto_<name>_ui_state`) and restore it in the initial `useState`, with a
   `useEffect` that re-saves on every change. Credentials already had this
   pattern (`eauto_<name>_creds`) — extend it to cover the checklist and
   toggles too, don't leave them resetting on remount.
   **Defaults for a new page: `headless: false`, `detailed: true`**
   (Headless unchecked, Detailed checked) — Faizuddin, 2026-10-15: "for all
   automations, the headless and detailed option, make it be default
   [headless = no] and [detailed = yes]". Applies to every NEW runner page
   you scaffold; do NOT edit existing pages' defaults unless asked ("not
   change the current dashboard. just update the knowledge/skills").
   Checker pages (not testers) may keep Headless on.
6. **Any value that must be unique per run (a vehicle no. that can't be
   reused, anything that "creates a new transaction")** gets a
   dashboard-generated running counter, not a field the person retypes every
   click. Store an integer counter in `localStorage`
   (`eauto_<name>_vn_counter`), format it per whatever scheme the user gives
   you (`eauto-jomcheck`'s: prefix `HX` + one extension letter, default `A`
   + 4-digit zero-padded running number + trailing `A` marking it
   automation-made — `formatVehicleNo(n) => "HXA" + pad(n,4) + "A"`), show it
   in an editable text field (never read-only — override must stay
   possible) with a regenerate button, and **auto-advance the counter the
   moment Run is clicked** (a value is "used" once submitted, pass or fail —
   don't wait for success to advance it, and don't require the person to
   manually bump it either).
   - Two or more selected scenarios that each need their own unique value in
     the SAME run must not share one field/env var — a single `--grep`
     invocation runs them all against one env, so one shared `freshVehicleNo`
     would hand them the identical vehicle no. and collide. Give each such
     scenario its own `vehicleEnvVar` (e.g. `JOMCHECK_TS05_VEHICLE_NO` /
     `JOMCHECK_TS17_VEHICLE_NO`) in the `SCENARIOS` array; at Run time, walk
     the selected scenarios and hand out consecutive values off the SAME
     running counter (`vnCounter`, `vnCounter + 1`, ...), passing them as a
     `vehicleEnvVars: Record<string,string>` map in the run request body that
     the run route spreads straight into the child process env. Advance the
     counter by however many distinct values were actually handed out, not by
     a flat 1. (EAINT-12339, TS05/TS17 split, 2026-10-02 — see
     `app/eauto/jomcheck/page.tsx`.)
   - **Give the running counter its own on/off toggle, not just the
     regenerate button.** Faizuddin, 2026-10-03: some TS (e.g. EAINT-12339's
     TS02/TS27, which need a REAL already-registered vehicle no., not a
     synthetic one — see the "requires a live API" pattern two items below)
     need the field to stay exactly as typed across runs, not auto-advance.
     Add a small toggle button beside the field (an icon that visually
     flips — e.g. `Repeat` tinted indigo when ON, `Lock` tinted amber when
     OFF — with a `title` explaining the current state), persisted in the
     same UI-state `localStorage` blob as every other toggle. When ON,
     behavior is unchanged (per-scenario distinct values off the counter,
     auto-advance after Run). **When OFF, every scenario needing a vehicle
     no. gets the LITERAL field value — no per-scenario incrementing, no
     counter advance afterward** — fixed mode means exactly one fixed value,
     collisions across scenarios become the person's own call once they've
     turned the counter off. Hide the regenerate button while OFF (nothing
     to reload) and swap the helper text under the field to say it's fixed.
7. **(Superseded 2026-10-01 for multi-TS runs: one card per TS — see the
   per-TS rule at the top of §4. The box described here is now each TS card's
   left half.)** **Evidence is NOT its own full-width section — it lives INSIDE the left
   (recording) column, alongside the video** — Faizuddin, 2026-10-02, final
   revision: "theres 2 section: run recording and evidence. i want you to
   remove evidence. the run recording should be evidence, where the
   recording and PDF should be placed. that should also be the place to
   select and download multiple evidences." One box, titled "Evidence", in
   the left half of the recording/steps grid (rule below): the video player
   at the top (if this run recorded), then every captured file (the
   recording itself included, plus any screenshots/PDF captures) as a list
   — one row per item with a checkbox + a direct `<a href={e.url}
   download>` — with "Selected (N)" / "All" download buttons in the box's
   own header (posting `{ runId, files: [...selected] }` / `{ runId }` to
   the download-all route). **No "Select all"/"Clear" pair here** (unlike
   the scenario checklists in rules 1-3, where Select-all/Clear stays) —
   with a handful of files, per-row checkboxes are enough. Build the
   downloaded blob via `fetch` → `blob()` → an in-memory `<a>` click (same
   pattern as `app/eauto/12166`'s `downloadAllEvidence()`), not a bare link
   to the zip route (that would send the browser to a POST-only URL with no
   body). When this run produced no evidence at all (e.g. it failed before
   anything was captured) but DID produce `details` (a setup run), the left
   column falls back to the Details panel instead — see the layout rule
   below for the full left/right shape.
8. **Sections collapse** — when a page has more than one config/checklist
   box (Run configuration, Test data setup, Test scenarios, ...), wrap each
   in a shared `<Section>` component: a clickable header with a
   chevron that toggles a `collapsed` boolean, content hidden when
   collapsed. Collapse state is per-section (`Record<string, boolean>`
   keyed by section id) and persists in the SAME `ui_state` localStorage
   object as rule 5's `selected`/`headless`/`detailed` — a page with
   several sections should remember which ones were left open, same as
   everything else on the page. Don't build a one-off accordion per page;
   copy `eauto-jomcheck`'s `Section` component.
   **Trap**: the header must be a `<div role="button" tabIndex={0}
   onKeyDown={...}>`, NOT a real `<button>` — the `extra` slot (Select
   all/Clear) renders its own `<button>`s inside it, and nested `<button>`
   elements are invalid HTML that React flags as a hydration error.
   Confirmed 2026-10-02.
9. **Keep a bounded HISTORY of past runs' evidence — never prune to
   latest-only.** Superseded 2026-10-03: this used to say only the latest
   run's evidence exists on disk, pruned on every new run. That's wrong
   whenever ANY evidence in the suite is a limited/precious resource (a
   rate-limited API download, e.g. JomCheck's 20 reports/day) — pruning on
   every run can silently delete an EARLIER run's download the moment a
   LATER, unrelated run finishes. Faizuddin, 2026-10-03, after being asked
   whether an old download would survive a later run: "Yes, do that" (keep
   history instead). The shape:
   - `publishEvidence()` writes a `meta.json` (runLabel, timestamp, scenario
     titles) into each run's own folder, making every run folder
     self-describing — no separate growing manifest to keep in sync.
   - It prunes only once a `HISTORY_LIMIT` constant is exceeded (default 30,
     override via an env var) — oldest first, by each folder's own
     `meta.json` timestamp, not OS mtime (which an unrelated file access can
     refresh).
   - A new `GET /api/eauto-<name>/history` route lists every still-present
     run (newest first, reading each `meta.json` + directory listing).
   - The dashboard gets a collapsed-by-default **"Past runs"** section,
     lazy-loading on first expand (never fetched on every render) and
     refetching once the current run finishes. Each past run expands to its
     own file list with the same individual `Download` links, plus a
     "Download All" for that run.
   - `downloadEvidence()` (or equivalent) takes an optional `{ runId,
     runLabel }` target instead of hardcoding "the current run", so the same
     function serves both the live run's evidence AND any past run's.
   - `download-all/route.ts` needs no changes if it already takes an
     arbitrary `runId`/`runLabel` rather than assuming "the latest run" —
     verify this before assuming a change is needed there.
   Copy `scripts/eauto-jomcheck`'s `app/api/eauto-jomcheck/history/route.ts`
   and the dashboard's "Past runs" section rather than re-deriving either.
10. **A TS that steers eSim data before its own flow gets the VPN gate +
    always-restore pattern — never a bare run.** Originated on EAINT-11864's
    TS06, reused by EAINT-9306's eDereg Pre-Check suite (Faizuddin,
    2026-09-30, asked which ticket this came from — checked and it's these
    two). Full pattern, worked examples and the eSim entities themselves are
    in `knowledge/esim.md` § "Standing pattern: a TS that changes eSim" — read
    it before wiring a new one rather than re-deriving the shape. Summary:
    - **eSim runs in the test's own page, so the set-up is in the video**
      (Faizuddin, 2026-10-01: "the eSim must also be open in the same browser
      as the main testing, so that user can know how the eSim is set up when
      rewatching the test evidence"). Copy
      `scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts` +
      `utils/esimPurchase.ts`; set `ignoreHTTPSErrors: true`. Older suites
      (EAINT-11864, EAINT-9306) still use the shape below — don't copy it
      for new work:
    - (older) A `utils/esim.ts` in the suite spawns `scripts/eauto-esim` as a child
      process (never imported — different processes) with
      `ESIM_ENTITY`/`ESIM_PREFIX`/`ESIM_MODE=write`/`ESIM_CHANGES`, parses the
      `RESULT:{...}` line, and turns a connection-error pattern into "the VPN
      looks disconnected" rather than a raw timeout.
    - The spec sets the value, runs its flow, then restores the prefix to its
      named OK constant in a `finally` — unconditionally, logging a
      `WARNING` (not throwing) if the restore itself fails. eSIM is one
      shared instance keyed by vehicle prefix; a dead test must never leave
      it poisoned for the next person.
    - The dashboard computes a `needsVpn` boolean from the selected
      scenarios and routes Run's `onClick` through a confirmation modal
      (`needsVpn ? setVpnAsk(true) : run()`) — opening the modal runs
      nothing, only its "Confirmed" button does. See
      `app/eauto/quotation-reminder/page.tsx` (`vpnAsk`) for the plain
      version; rule 14 sets the standard wording (heading + 2 buttons only).
11. **A TS whose workbook steps include a manual/dev-dependent sub-step
    (raw API responses, logs only dev can pull, data only dev can confirm)
    still gets automated for everything else — never skipped wholesale.**
    EAINT-12339's TS35, 2026-10-03: "for TS35, only check what the
    automation can do. if the details require me to check with dev, then
    ignore that part only." TS35's own steps end with "Request for raw API
    response from dev", and 2 of its 7 expected fields are only visible in
    that raw response (the BO listing only exposes a vehicle-level rollup,
    not the claim-level fields the raw response would carry) — so the test
    automates the other 5 fields the UI actually shows, and the workbook's
    unreachable sub-step is simply not implemented. Document the gap
    explicitly, close to the code and in `knowledge/flow-<module>.md` — name
    exactly which part is skipped and why it's structurally out of reach
    (not just "not done yet"), so the next person doesn't waste time trying
    to extend automation into a sub-step no UI can ever expose.
12. **A TS that needs EXACT boundary values a live/random data source can
    never reliably reproduce drives eSim's own dynamic sub-forms, not just
    its top-level fields.** EAINT-12339's TS05-TS15/TS18/TS19 need specific
    mileage/parts/claim-code combinations (e.g. 9,999 vs. 10,000 vs. 10,001
    km either side of a bucket edge) — purchasing against the real API can't
    guarantee these (results are random), only eSim setting them directly
    can. When the relevant eSim entity has a repeatable sub-form (jomcheck-
    report's "Claim Records": `+ Add Claim Record`/`Remove Record`, `.claim-
    record` blocks), extend `scripts/eauto-esim` itself rather than building
    a parallel mechanism in the consuming suite:
    - A sub-form's own field labels may carry NO `for` attribute (unlike
      every top-level field `EntityEditPage.applyChanges()` already
      handles) — resolve them via the sibling input inside the SAME
      `.form-group`/block wrapper, scoped to one block at a time, not by
      `for`/`id`. Check the captured HTML before assuming either pattern.
    - Add `removeAllClaimRecords()` (loop-clicking "Remove Record" until
      none remain — always-clear-first, so a leftover record from a
      previous test never bleeds in) and `addClaimRecords(records)` (click
      "+ Add", resolve each new block's own fields, tag-detect
      `select`/`input` same as `applyChanges()`) to `EntityEditPage`. New
      `ESIM_CLAIM_RECORDS` (JSON array of label→value maps) and
      `ESIM_CLEAR_CLAIM_RECORDS` env vars drive them from `esim-edit.spec.ts`.
    - The consuming suite's `utils/esim.ts` wraps this exactly like a
      top-level `ESIM_CHANGES` write — same spawn-as-child-process shape,
      same `RESULT:` parsing, same VPN-disconnect detection.
    - **A dedicated eSim prefix is required, not optional** — these tests
      repeatedly clear-and-overwrite one record's claim data, which would
      corrupt any OTHER test relying on a SHARED prefix for its own (e.g.
      random/live-API) purpose. No default env var value; fail loudly if
      unset rather than guessing a prefix (knowledge/esim.md: "ask before
      claiming a prefix" — a shared namespace is a human decision).
    - **When a field's exact semantics are ambiguous** (e.g. the entity
      exposes both an old-schema raw-number field and a new-schema one, and
      it's unclear which drives display), set BOTH to the same value rather
      than guessing — document the ambiguity in the spec's header comment
      and in `knowledge/flow-<module>.md`, and flag it as needing
      confirmation on one live run before trusting it broadly.
13. **Once a ticket's TS list outgrows ~20 rows, the checklist mirrors the
    source workbook's OWN sections — one collapsible box per section,
    collapsed by default — not one flat list.** EAINT-12339, 2026-10-04
    (Faizuddin): "i want you to make the TS into their own collapsable
    sections, just like based on the excel. make the TS section closed by
    default. user will click to expand it." At 49 TS a flat list is
    unscannable and stops matching how the team actually reads the sheet.
    - A `TS_SECTIONS` constant holds the workbook's section letters and
      headings VERBATIM, in its own order; `Scenario.section` tags each row;
      the page renders `TS_SECTIONS.map(...)` of `Section` boxes. Use
      decimal `order` values (e.g. `19.1`) to place a TS where the SHEET
      puts it, not where its number would sort — a workbook routinely files
      a high-numbered new TS mid-section.
    - **Collapsed-by-default needs its own toggle.** `collapsed[id]` is
      undefined until first touched, so render as `collapsed[id] !== false`
      and flip with `prev[id] === false`. Reusing the normal
      `toggleSection()` (`!prev[id]`) turns undefined into `true`
      (collapsed → collapsed) and makes the first click look broken.
    - Give the group an **Expand all / Collapse all** pair, per-section
      Select all/Clear, and a per-section count (`3/5 automated`) plus a
      selected-count badge so a collapsed box still says whether anything
      inside it is queued to run.
    - **Every TS in the workbook gets a row, including ones with no spec** —
      mark them `notBuilt: true`, render them disabled/greyed with a "Not
      built" badge and a one-line reason (usually an open-question id), and
      exclude them from Select-all, the automated count, and
      `VALID_SCENARIO_IDS`. A section that silently omits its unbuilt rows
      reads as "fully covered" when it isn't — the same honesty rule the
      "Not automated yet" footer exists for, applied per section. Replace
      that one shared footer with a per-section note.
    - Verify with a script that every scenario has a `section` and that each
      section's membership/order matches the sheet — a missing `section`
      makes the row vanish from the UI entirely rather than erroring.

14. **The multi-TS results layout below is THE standard for every runner page —
    standing rule, 2026-10-01.** Faizuddin: "make the current dashboard layout
    for multiple TS to be the standard in the automation skill moving forward."
    Worked example: `app/eauto/jomcheck/page.tsx`. It replaces the older
    single-grid layout described under "Also, always" below (the
    evidence-left / steps-right grid for the whole run, and the "Renders, top to
    bottom" order) wherever they differ. Top to bottom, in the run section:
    1. **Run / Stop row.** Run goes through a **"Is your VPN connected?" popup**
       (heading + "Not yet — cancel" / "Confirmed VPN Connected", no body text)
       whenever any selected TS needs eSim; otherwise it runs straight away.
       Stop goes through a **"Stop this run?" popup** ("No — keep running" /
       "Yes — stop the run"), noting that a stopped eSim TS skips its restore.
    2. **Pass/fail summary bar**, full width: "N/M passed, K failed" plus an
       **"All TS (n files)"** button that downloads one zip per TS.
    3. **Queue strip** (only when 2+ TS are queued): "Queue · done/total" and one
       small chip per TS id — pending (grey), running (spinner), passed (green),
       failed (red), stopped (amber). A TS that ended with no result shows its
       reason in one line under the chips.
    4. **One card per TS**, full width, in queue order — never a combined view:
       - Header: status icon, the exact TS title, duration in seconds,
         **"Selected (n)"** (zip of the ticked files of THIS TS) and
         **"<ticket>_TSnn evidence"** (zip of all of THIS TS's files, named
         `<ticket>_TSnn.zip`).
       - Left half: this TS's own video, then its file list (tick box, icon,
         `<ticket>_TSnn-…` name, per-file **Download** link), then its own
         **Details** (its DETAIL: lines). "No evidence captured for this TS."
         when empty.
       - Right half: its friendly error (if any), then its flat step list —
         always visible, no toggle.
       - Stacks to one column on narrow screens.
    5. **Run evidence box** only for files not tied to any TS (e.g. a stopped
       run) — so nothing is ever hidden.
    6. **Detailed log**, full width, always expanded, with Copy: every queued
       TS's raw log one after another, each under `===== <title> =====`.
    7. **Past runs** (collapsed): each run's files grouped by their
       `<ticket>_TSnn` prefix, with a per-TS zip button and per-file links.
    This layout is driven by the per-TS queue and per-TS evidence rules in §4 —
    each queued TS is its own run, so its card, folder and zip are its own.
    A single selected TS is just a 1-item queue: same card, no queue strip.

15. **Test-data setups never feed a TS automatically — they fill a pool the
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
      2026-10-15.** Faizuddin: "every ticket that requires test script to
      fetch a data from test data pool, user should be able to choose which
      data they want when select the scenario". Ticking a TS that consumes
      pool data opens a picker INSIDE that TS row, right under its checkbox:
      the pool records of the kinds that TS accepts, newest first, each
      showing vehicle no., transaction no., environment, date and last use,
      plus a free-text field for a value not in the pool. Nothing is
      preselected. Run refuses to start while a ticked TS has no record
      chosen, naming the TS. Warn on the row when the chosen record was made
      on another environment. Run configuration may mirror the choice, but
      the row is where it is made.
    - **Usage log.** When a TS run on a picked vehicle no. finishes passed or
      failed, append {TS, status, time} to that record, shown as chips in the
      pool and as "last: TSnn passed/failed" in the picker — so a retry picks an
      unused record. Consumed data (e.g. a Failed transaction a TS resubmitted)
      is removed by the person, not automatically.
    - Worked example: `app/eauto/12412/page.tsx` (`DATA_KINDS`, `DataRecord`,
      `recordDataOutcome()`, the pool section, the TS pickers).

16. **Number fields are plain text that accepts digits only — standing
    rule, 2026-10-15.** Faizuddin: "make the format simple text but accept
    numbers only. because for the current one, if i click backspace, it will
    automatically display 1 instead of clearing it. so if i want to change
    to another number, i type 420, it will become 1420". Never
    `<input type="number">`, and never clamp or default the value on every
    keystroke. Use `components/NumericTextInput.tsx`: `type="text"` +
    `inputMode="numeric"`, non-digits dropped as typed, the field may be
    empty while editing, and min / max / fallback apply only on blur or
    Enter. First used on the 12412 setup "How many" field.

Also, always:
- Uses `useApp()`'s `runs`/`startRun`/`stopRun` (survives navigating away —
  see `hooks/useBackgroundRuns.ts`), never a page-owned `fetch`.
- A "Not automated yet" footer under the TS section listing what's
  known-missing and why (so the page is honest about coverage, not just what
  is wired up).
- **(Superseded by rule 14 for the results area — kept for history.)**
  **Evidence (or, for a setup run with none, its Details panel) and Steps
  render in TWO SEPARATE, EQUAL-SIZE containers — evidence/details on the
  LEFT, steps on the RIGHT** — Faizuddin, 2026-10-02, revised three times
  across the same day: first "beside the recording... so the video can
  shrink" (an asymmetric `1fr_360px` grid); then "the video and steps
  should be in separate section/container. it should be same [size], and
  the video is on the left side, while the steps are on the right side"
  (equal `grid-cols-2`, still a separate full-width Evidence section below
  it); then finally "theres 2 section: run recording and evidence. i want
  you to remove evidence. the run recording should be evidence" — folding
  the evidence list INTO the left cell (rule 7). Final shape: `grid
  grid-cols-1 lg:grid-cols-2 gap-4 items-start`, left cell is the Evidence
  box (rule 7) when `res.evidence.length`, else the Details panel
  (`res.details`, see §4) when the run didn't record, else empty; right
  cell is the per-check results list. Stacks to one column on narrow
  screens.
- **Every check's step list is ALWAYS fully visible, never behind a
  collapse/expand toggle** — Faizuddin, 2026-10-02: "so that user can know
  what the automation did in a glance without having to watch the whole
  recording," reinforced on the same day: "the steps shouldnt contain the
  log readings. its literally the human language for what it did." Render
  `c.steps` with a flat `<StepList>` (checkmark + `s.title`, nothing else —
  copy `eauto-jomcheck`'s `StepList` component, not the earlier `StepTree`
  with its collapse button and inline raw-error `<pre>`). No `expandedSteps`
  state needed at all now that §3's `filterSteps()` never lets raw
  pw:api/expect noise through — there's nothing left to hide behind a
  toggle.
- **The "Detailed log" section takes the old Evidence section's slot,
  full-width, right after the evidence/steps grid — and is ALWAYS fully
  expanded, no collapse toggle** — Faizuddin, 2026-10-02: "the current
  evidence section should be replaced with the proper detailed log that i
  can copy and share to you." It's the FULL raw stdout+stderr (§4 always
  returns it now, not just on failure), with its own Copy button
  (`navigator.clipboard.writeText`) in the section header, ready to paste
  into a Claude conversation without an extra click to expand it first.
- (Superseded by rule 14.) Renders, top to bottom: pass/fail summary (full width), the
  evidence/details + steps grid described above, then the always-expanded
  Detailed log.
- **When the user gives you a default credential for a role** (e.g. "UCD
  username: faizuddin / password: password"), put it in the page's
  `DEFAULT_CREDS` object so the field arrives pre-filled — never make it a
  placeholder-only hint, and never hardcode it as the ONLY value (the input
  must stay editable, same `useState`-backed field as everything else).
  Mirror the same value in the script's `data/users.ts` fallback (`||
  'faizuddin'`) so a bare CLI run without the dashboard also works — the two
  are kept in sync manually, there's no shared import across the app/scripts
  boundary. Confirmed 2026-10-01 (`eauto-jomcheck`'s `ucdUsername`/
  `ucdPassword` defaults).

## 6. Sidebar

Add one entry under **Tickets** (`components/Sidebar.tsx`) labelled with the
ticket number alone, a one-line comment above it citing the ticket and
anything explicitly out of scope (e.g. "Wholesale excluded — chatbot-driven").

## 7. Navigate via clicks, not URLs

**Standing rule (Faizuddin, 2026-09-30): page objects reach a screen by
clicking the real UI control that gets there — the button, tile, or link a
person would actually click — never `page.goto()` to a hardcoded deep path.**
Only the very first landing page after login (UCD/BO home, Service Portal
home) is ever loaded by URL, and only as a fallback for when that page isn't
already on screen (e.g. the first navigation of the run) — check whether the
target control is already present before falling back to a direct load:

```ts
async goto(): Promise<void> {
  if (!(await this.someHomeMenuLink().count())) {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.someHomePath}`, { ... });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }
  await this.demoHighlight(this.someHomeMenuLink());
  await this.someHomeMenuLink().click();
  await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
  await this.settleAfterLoad();
}
```

This means the click path from home to every target screen must be
**captured and confirmed**, not guessed — see `scripts/eauto-jomcheck/pages/
UcdJomCheckPurchasePage.ts` (`#jomcheck` home tile → `#create-tx` menu
button), `BoJomCheckReportListingPage.ts` (BO home's "Settings (Hub Admin)"
category → "JomCheck Report Listing" link), and
`ServicePortalJomCheckListingPage.ts` (Service Portal home's "Hire Purchase
Ownership" category → "JomCheck Report Listing" link) as the three worked
examples — each cites the exact `_reference/html/eauto/*.html` capture the
selector came from. If the click path from a home/menu page to a target
screen isn't captured yet, **ask the user for it** (have them click through
and paste the resulting HTML) rather than guessing a link text or href —
this is the same "ask, never invent" rule in §8 below, just applied to
navigation specifically.

`CONFIG` paths for non-home pages become documentation only (a comment
noting what link/text lands there), not something ever passed to
`page.goto()` directly.

## 8. Ask, never invent

If a page's real selectors, login field names, or URL paths aren't already
known from a captured HTML file (`_reference/html/eauto/`) or existing
script, **capture the page first** (see the repo's HTML-capture standing
rule) — don't guess a selector and ship it silently. If you must guess
something not yet confirmed (e.g. a login URL inferred from a logout link),
say so explicitly in a code comment and flag it to the user as an open
question, exactly as was done for `ServicePortalLoginPage`'s login URL.

## Reference implementations, newest first

1. `scripts/eauto-jomcheck/` + `app/api/eauto-jomcheck/run/route.ts` +
   `app/eauto/jomcheck/page.tsx` (EAINT-12339, 2026-09-30) — the most
   complete from-scratch worked example.
2. `tests/service-hub/` + `app/api/eauto/12166/run/route.ts` +
   `app/eauto/12166/E2ETestsTab.tsx` (EAINT-12166/12167) — the original
   pattern this was all benchmarked against.
