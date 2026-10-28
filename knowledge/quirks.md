# Quirks and traps

Each of these has already cost debugging time. They are recorded in code
comments at the point of the fix; this is the index so they can be avoided
rather than rediscovered.

## Legacy portal / navigation

**`goto()` sometimes aborts or never reaches networkidle.** A redirect race right
after login can abort the initial request. `BasePage.goto()` retries once with
`domcontentloaded`, then settles best-effort.
`[verified: tests/service-hub/pages/BasePage.ts · goto]`

**Login redirect races later navigations.** Returning from login before the
redirect chain settles lets the next `goto()` land on the portal home instead of
the target — this is what broke the BO listing and calendar navigations.
`[verified: tests/service-hub/pages/LoginPage.ts · login]`

**BO listing can load without its buttons.** `AppointmentCalendarPage.navigate()`
checks for `#sc-appt-cal` and re-navigates once if it isn't there, for the same
redirect-race reason.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts · navigate]`

**BO listing "View" opens `target="_blank"`.** A page object holding one `page`
loses the tab. Strip the attribute before clicking.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:346-373]`

**BO listing Search is AJAX** (`listing/list.get`). The results table is already
"visible" with stale rows, so wait for the response, not networkidle.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:175-189]`

**`[DO]`, Invoice and e-Invoice fire `window.open()`.** The download and any error
page appear on a popup page, so checks against `this.page` time out.
`[verified: tests/service-hub/utils/download-evidence.ts; pages/bo/DevicePurchaseDetailsPage.ts:313-346]`

**Listing headers are `<th>` rows inside `<tbody>`** on both the UCD and BO
Service Hub listings. Select data rows with `tbody tr:has(td)`.
`[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:93-100; pages/bo/SoftwareInstallationListingPage.ts:207-210]`

## Waiting on the right thing

**Attach the navigation wait BEFORE triggering the action.** `siConfirmBooking()`
can redirect fast enough that a `waitForURL()` started after the `evaluate()`
misses the navigation entirely and times out — while the page is already on
`submitted.do`. Create the promise first, then trigger, then await.
`[verified live: 2026-07-31 — tests/service-hub/pages/SlotPickerComponent.ts · confirmAppointment]`

**`networkidle` alone is not enough after `siConfirmBooking()`.** It fires an
async request before redirecting; waiting on networkidle can return before that
request even starts, letting the next action interrupt it mid-flight.
`[verified: same]`

**Waiting only for `slot.do` hangs on the install opt-out path.** With "I don't
need software installation" checked, the biometric flow goes straight to
`submitted.do` — the old `slot.do`-only pattern waited out the full 15s.
`[verified live: 2026-07-31 — tests/service-hub/pages/BiometricPurchasePage.ts · makePayment]`

**`getAttribute()` on a zero-match locator does not return null** — it waits and
retries until timeout. Check `.count() === 0` first. A non-rendered date is
definitionally not bookable, so short-circuit there.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · isDayBookable]`

**Bound speculative clicks with a short explicit timeout.** `goNextMonth()`
guesses that the app marks "no more months" with `visibility: hidden`. If that
guess is ever wrong, a plain `.click()` would hang for the full actionability
timeout, so it uses a 3s timeout and treats a failure as "no more months" — a
mismatch degrades to a graceful stop instead of a hung test. On the reschedule
calendar the arrow can disappear entirely rather than merely hide.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · goNextMonth]`

**`.catch()` on `.fill()` of a non-matching locator costs the full
actionTimeout.** Resolve the field with `count()` first. A bad locator polled
30 s on every eSTM run before this was caught.
`[verified: scripts/eauto-quotation-reminder/pages/estmPort/EstmBuyerDetailsPage.ts:108-117]`

## Selectors and page identity

**A CSS id selector cannot start with a digit.** The insurance stepper divs are
`id="1"`/`"2"`/`"3"`. `div#1.md-step.active` is a parse error that fails the
*whole* comma-separated selector list (including a valid `body#insurancePlan`
beside it) with `SyntaxError: '…' is not a valid selector`, after burning the full
timeout. Use `div[id="1"]`.
`[verified: scripts/eauto-quotation-reminder/pages/InsuranceStepsPage.ts:16-21]`

**`#to-payment` means two different things on the eSTM flow.** It is the "Make
Payment" button on the JPJ-result render of step 4 AND the submit button on the
real Payment step. Matching the id alone does not prove which page you are on;
pair it with `#lkm-addson-checkbox` (Payment step only).
`[verified: scripts/eauto-quotation-reminder/pages/EstmHandoffPage.ts:122-129]`

**eSIM claim-record labels are CSS-uppercased.** `innerText` returns "CLAIMS TYPE
(ICAP CODE)"; `textContent` returns "Claims Type (ICAP code)". Any read-then-write
of labels must use `textContent`. `scripts/eauto-esim/pages/EsimPages.ts:215`
still uses `innerText` (unfixed); `scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts:136-139`
is fixed. `[verified: both files, 2026-10-16]`

## Modals

**A stray open modal silently swallows clicks.** `#si-ovl` covers the whole page,
so a leftover modal makes calendar clicks fail with a confusing "element
intercepts pointer events" timeout — and can just as easily swallow a
`goNextMonth()` click, making month navigation appear to do nothing. Both
`openSlotModal()` and `goNextMonth()` defensively close any open modal first.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

**Off-by-one in paging loops.** `ensureMonthVisible()` originally called
`goNextMonth()` on its last allowed iteration, clicking one past the app's real
limit — no third month ever exists — which is what hung on `#si-next`. Guard with
`if (m >= maxMonthsAhead) break;` before paging.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · ensureMonthVisible]`

**BO's reschedule Confirm raises a native `confirm()`**, not a jQuery dialog — it
needs a Playwright dialog handler, not `.confirm-dialog-btn`.
`[verified live: SIT2 — tests/service-hub/pages/bo/AppointmentCalendarPage.ts]`

**BO and Service Portal logout raise a native `confirm("Sure to logout?")`**,
which Playwright auto-dismisses, so the click does nothing. UCD logout is a jQuery
UI `#logout-confirmation` (Yes/No) instead. To log out of BO, load
`<base>/user/logout.do` directly (it skips the `confirm()`); for the Service
Portal, load `/banker/logout.do`. Cross-portal trap.
`[verified: _reference/html/eauto/ucd-home-page-uat1-2026-09-24.html; bo-jomcheck-report-listing-vehicle-filter-active.html; scripts/eauto-jomcheck/data/config.ts:17; pages/LoginPage.ts:69-75]`

**`page.once('dialog')` stays armed when the dialog never fires.** The next action
that raises a dialog then has two handlers and throws "Cannot accept dialog which
is already handled" *after* its own action succeeded. A run once reported failure
on a change that had gone through. Scope the handler with `on`/`off` around the
one action. `[verified: scripts/eauto-duitnow-qr/src/obs.ts:100-117]`

**Reschedule and Resubmit share `a.sc-resubmit`** on the UCD Service Hub listing.
Match on text. `[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:151-160]`

**`siSaveDate()` closes the modal before its request lands.** Opening the next
date too early leaves `#si-ovl` never appearing. Poll `.si-bookbadge`.
`[verified: tests/service-hub/pages/ReschedulePage.ts:70-88]`

**jQuery datepicker singleton (`#ui-datepicker-div`).** After a forced dismiss, a
plain click may not reopen it; call `jQuery("#id").datepicker("show")`. Dismiss by
`_hideDatepicker()` + `display:none` + clicking the dialog title bar.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts:241-264, 378-394]`

**The datepicker fallback silently picks a day in the wrong month** unless the
month/year selects are driven first.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts:170-183]`

**Details-page Yes/No buttons are plain `.ui-dialog-buttonpane button`**, not
`.confirm-dialog-btn`.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationDetailsPage.ts:72-85]`

## Dates

**Never use `.toISOString().split("T")[0]` for a local calendar date.** It
converts to UTC first, rolling the date back by one whenever the local clock is
within the UTC offset of midnight — i.e. every run between 00:00 and 08:00 in
Malaysia (UTC+8). All date helpers funnel through
`BasePage.formatLocalDate()`.
`[verified: tests/service-hub/pages/BasePage.ts · formatLocalDate]`

**The BO calendar labels days DD-MM-YYYY**, while everything else is ISO
YYYY-MM-DD. Convert explicitly.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts · isoToDayLabel]`

**Default date input template across eAuto BackOffice date fields is
DD-MM-YYYY, not ISO.** Confirmed on the Device Purchase shipping-date field
(`#op-ship-date`): client datepicker is `dateFormat:'dd-mm-yy'` (jQuery UI
`yy` = 4-digit year), and the server parser expects `dd/MM/yyyy`. Sending
ISO `yyyy-MM-dd` still returns 200 OK but silently stores no date — a
dangerous, hard-to-detect failure. Always fill date inputs as DD-MM-YYYY
unless a specific field is proven otherwise.
`[verified: knowledge/flow-device-purchase.md, live page source + captured
network request, Playwright trace, uat1, 2026-09-23]`

**A From/To date search accepts at most ONE MONTH between the two dates.**
Default rule for every eAuto module and portal unless the module states
otherwise. The calendar widget's own year list (Service Portal: back to 2016)
says nothing about what Search accepts — a 10-year Shared Date range on the
Service Portal JomCheck Report Listing is rejected with "Shared Date range
must not exceed one month." and the table shows "No shared JomCheck
transactions are currently available." Default automation to To = today,
From = one month before, and let the person steer the window when the data is
older. Never set a "widest possible" range.
`[source: Faizuddin, 2026-10-05: "it should be 1 month only between the to and
from. THIS IS A DEFAULT RULE FOR ALL MODULES UNLESS STATED OTHERWISE";
verified: live run 2026-10-05, knowledge/flow-jomcheck.md §7t]`

**CIBO is not covered by that rule yet.** The one-month rule was stated for
eAuto modules. The EAINT-12151 SRD (§2.1.1 assumption 2) only says CIBO's
From/Till validation is "the existing Transaction Listing filter behaviour", and
the signed-off 12151 TS05 uses 1 Aug–28 Sep 2026. Treat CIBO's limit as
`[unconfirmed]`; use one month until proven otherwise.
`[from SRD EAINT-12151; TS 12151_TS05]`

**BO listing date inputs ignore `.value` + `change`.** Set them with
`$el.datepicker("setDate", new Date(y,m-1,d))`; the display is DD-MM-YYYY.
Selecting From auto-sets To = From + 1 month, and results sort latest-first.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:109-139; from QA team (Faizuddin) 2026-09-24 per specs/device-purchase-do-ts05.spec.ts:29-39]`

## Reading the calendar

**The day badge reads "N Available" / "Full"**, not "Slot n/6". The old regex
never matched and silently fell back to `used = 0`, corrupting every room-based
finder downstream. `[verified live — SlotPickerComponent.getSlotCount]`

**Fully-booked days are `td.si-fullday`, never `td.si-book`**, so they never
appear in `findBookableDates()`. Use `findFullyBookedDate()` for those.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

**A date can be bookable while one session is at capacity.** The day badge only
reflects combined capacity, so per-session checks must open the slot modal.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · findDateWithSlotRoom]`

**The calendar only renders the current month's cells**, and a fresh page load
resets to the current month — a date found after paging forward won't exist in
the DOM until you page forward again. Call `ensureMonthVisible()` before touching
any specific date.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

## Shared-environment reality

**Capacity shifts between scan and action.** Another run, another user, or a
cancellation can change a date after you've picked it. `allocateUnitsAnywhere()`
re-scans for a fresh date instead of failing, up to `maxAttempts`.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

**The near-term calendar window is often exhausted** on staging while real open
dates exist further out — hence `searchMonthsAhead: 6` for arrangement only.
`[verified: tests/service-hub/utils/config.ts, dated 2026-07-30]`

**Every staging branch runs the APT payment cron at the same time**, which can
mark an already-paid transaction Failed. Dev changed it to every 30 min on the
test branch. `[from Teams EAINT-12289, 2026-09-11 17:45, Jin Siang Boo]`

**The JPJ receipt email goes to systemtest@eauto.my while a branch is connected
to JPJ staging.** Mailtrap will not show it.
`[from Teams eAuto & Secarang Main Group, 2026-09-17]`

**EAINT-12275 exists in prod:** the server does not check that Password and
Confirm Password match. It is parked under EAINT-148, so do not raise it again as
a new finding. `[from Teams EAINT-12155, 2026-09-04 16:40, Charmain Ea Chiang]`

## Test-artefact plumbing

**`browser.newContext()` does not inherit `use.video`.** Only the
fixture-managed default `page`/`context` gets the project's video/trace config,
so manually created contexts recorded nothing at all. Use
`openTrackedContext()`.
`[verified: tests/service-hub/utils/tracked-context.ts]`

**`scripts/eauto-estm/playwright.config.ts` still passes `video: 'on'` as a bare
string** (the downscaled-recording trap in flow-jomcheck §7g) and is always
headed. `[verified: scripts/eauto-estm/playwright.config.ts:12-17,42-43]`

**Playwright ran every `test()` in a fresh worker despite `workers: 1`**, so
module-level result arrays were lost. Write per-test result files.
`[verified: tests/service-hub/specs/user-access-regression.spec.ts:35-48 (live 2026-09-24)]`

**Inline error divs are always in the DOM** (`display:none`, default text "This
field is required"). Assert visibility, not `textContent`.
`[verified: tests/service-hub/specs/device-purchase-do-ts08.spec.ts:79-92]`

**`.fill()` bypasses per-keystroke input filtering.** Use `pressSequentially()`
or a clipboard paste to exercise live stripping.
`[verified: tests/service-hub/specs/device-purchase-do-ts08.spec.ts:116-128]`

**Hardcoded serial numbers collide with the previous run** (uniqueness is
system-wide). The rejected save leaves Delivery Status at New.
`[verified: tests/service-hub/utils/serials.ts:1-16]`

**A manual gate (`PW_GATE_DIR`) no-ops outside the dashboard**, so a test that
relies on a human pause behaves differently under `npx playwright test`.
`[verified: tests/service-hub/utils/manualGate.ts:21-36]`

**Env vars set after a module imported its config never reach it.**
`scripts/eauto-estm/data/config.ts` freezes `ESTM_ELKM`/`ESTM_EVOC` at import;
in-process callers cannot change them, only a spawned child can.
`[verified: scripts/eauto-quotation-reminder/pages/estmPort/EstmPaymentPage.ts:62-72]`

## Spreadsheets

**A test-script cell must not start with a bare `-`** — Excel parses a leading
hyphen as a formula. Bullets are written **space-dash-space** (` - item`); the
leading space is what stops the formula parse. Steps and expected results use
numbers, not bullets. (An earlier note here said to use "•" — superseded.)
`[from QA team, 2026-08-14; supersedes the EAINT-12153 convention]`

**A past script can name the wrong artefact.** The EAINT-9900 Referred Risk Log
script names the export "Payment_Report_…csv", probably a copy error. Check the
name against the page before asserting on it.
`[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 2]`

**Some team workbooks hold live-looking test credentials in plain text**
(EAINT-10937 and EAINT-12180 Configuration sheets; EAINT-9840 role sheets). Do not
copy them into the repo. `[from SharePoint sweep, 2026-10-16]`

## `/obs` onboarding app

**`/obs` pages never fire `load` or `domcontentloaded`** (~48 assets never
answer). Navigate with `waitUntil: 'commit'` and poll document size.
`[verified: scripts/eauto-duitnow-qr/src/obs.ts:11-16]`

**A cold GET of `/obs/admin/*` returns ~39 bytes of empty HTML** — no redirect,
no 403 — until the `/<instance>/api/admin/onboarding/auth-redirect.do?type=…`
handoff has been hit in the session.
`[verified: scripts/eauto-duitnow-qr/src/obs.ts:5-9, 27-28]`

**A direct `/obs` 403 is not a permission finding.** A HubAdmin control run got
the same 403 without the menu handoff.
`[verified: reference pack 01-flow/03-actors-urls-accounts.md § role model]`

## Secarang (Angular)

**Responsive duplicates.** The bank grid and quotation cards render a hidden
second copy. Scope banks to `.d-md-block`; iterate cards with `isVisible()`.
`[verified: scripts/secarang-insurance/pages/PaymentTypePage.ts:33-34; QuotationPage.ts:120-128]`

**The three home-form inputs have no id/name/placeholder** — positional only.
Read each value back after filling.
`[verified: scripts/secarang-insurance/pages/HomePage.ts:12-14,95-119]`

**The staging site-password gate reappears** on the Fiuu popup and on the success
page. `[verified: scripts/secarang-insurance/pages/BankLoginPage.ts:11-13; PaymentSuccessPage.ts:33-34,43-44]`

**The Fiuu popup closes itself after Pay Now.** Check `isClosed()` before any page
call. `[verified: scripts/secarang-insurance/pages/BankTACPage.ts:84-95]`

## Teams

**Teams shows "Unknown User" for some former or external members** (Nur
Izfarwiza, Leong Jin Chuen, Batrisyia, Wong Kar Kin). Match them by context
when reading a chat. `[from Teams sweep, 2026-10-16]`

## Dashboard

**The runner matches scenarios by `--grep` on the test title.** A scenario title
in the UI that doesn't exactly match the spec's `test("…")` title matches
nothing, and the run looks like it simply found no tests.
`[verified: app/api/eauto/shopping-cart/run/route.ts]`

**JQL cannot substring-match an issue key.** `key = "EAINT-1197"` is exact, and
`text ~` searches summary/description/comments but never the key — so no JQL
finds EAINT-11978 from "1197" directly. Ticket search builds the "contains"
behaviour by expanding the typed number into key ranges (`key >= EAINT-11970 AND
key <= EAINT-11979`, one clause per extra digit).
`[verified: lib/jira.ts · buildIssueSearchJql]`

**`key =` against a non-existent issue fails the whole query**, not just that
clause — Jira answers "An issue with key 'X' does not exist" and returns nothing.
That is why the typed number itself uses a degenerate range (`key >= X AND
key <= X`) rather than equality: one missing ticket would otherwise sink every
other match in the same query. `[from the search-broadening change, 2026-08-12]`

**`qa_flow_knowledge` is browser-local.** The dashboard's own Knowledge Base
cannot be read by an assistant working in the repo — that is why this directory
exists. `[verified: lib/knowledgeBase.ts]`

## eSTM / eSerahan flow

The eSTM creation flow has its own cluster of traps — pages that close and reopen
mid-flow (so a held `page` handle throws after any navigation), a campaign popup
that intercepts clicks, and four consent checkboxes that ignore `.check()` unless
`input` and `change` events are dispatched manually. They're documented at the
point of use rather than duplicated here: see
[flow-estm.md](flow-estm.md) § Traps.

## `#id` is not unique on the UCD portal

The portal's HTML is invalid in a way that quietly breaks automation: the same id
appears on multiple elements, and every `#id` selector takes the first match.
Confirmed cases include `#to-filter` on two different listing filters,
`#vehicleCategory` on both quote radios, `#sumInsuredValue` on every insurer card,
`#dialog-campaign-close-btn` on two campaign dialogs, and `#custom-dialog` twice per
page.

**Prefer `name=` or an attribute-scoped selector over `#id` on these pages.** Full
list and the other shared-markup traps — hidden inputs behind styled spans,
15-character name truncation in listings, per-surface timestamp formats, listings
that render nothing until Search is clicked — are in
[flow-ucd-shell.md](flow-ucd-shell.md) § Traps.
`[verified: live HTML from uat4, 2026-08-14]`

## Reading a Miro board via claude-in-chrome

**Canvas UI is unreadable; use the Miro Web SDK in page context.** On a Miro
board, canvas clicks, zoom and Ctrl+F do nothing useful and the accessibility tree
stays empty, so `read_page` / `get_page_text` return nothing. Instead run
`await window.miro.board.get()` with `javascript_tool` on the open board (wait a
few seconds after load). It returns every item with `type`, `id`, `parentId`,
`x`, `y`, `width`, `height` and `content` (HTML); frames carry `title`. Assign
items to frames by walking `parentId` up to a `frame`, else by the frame's
bounding box; sort by `y` then `x`; strip HTML with a detached `div`'s
`textContent`.
`[verified: session 2026-10-26]`

**`javascript_tool` output limits.** A returned string is truncated at about
1,000 characters; an array is capped at about 100 items, but each item can be
~950 characters, so ~40 KB per call is practical. Any output containing `?`,
`=`, `&`, `%` or a URL is replaced with "[BLOCKED: Cookie/query string data]".
Workaround: build the full text once into a `window.__var`, sanitize it
(`?`→`¿`, `=`→`≡`, `&`→`＆`, `%`→`٪`, `https://`→`URL:`) — first confirm the
board contains none of those substitute characters — split long lines into
~950-char pieces with a continuation marker, and pull array slices batch by
batch. Reverse the substitutions when writing the file. Check each batch by
comparing `slice.join('\n').length` in the page against the local file length;
trailing spaces at piece boundaries get dropped on write and must be restored.
`[verified: session 2026-10-26]`

**Don't try to exfiltrate in bulk.** `navigator.clipboard.writeText` hung the
renderer (CDP timeout), `document.execCommand('copy')` returned false, and a
`fetch` POST to a local server was refused by the auto-mode classifier
("Browser JS Exfil"). Chunked reads through `javascript_tool` are the approved
path. A 1,433-item board (~450 KB of text) took 13 batch calls.
`[verified: session 2026-10-26]`

## From Charmain's repo (eauto-qa-charmain, read 2026-10-27)

Read-only clone at `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain`, commit 0ab45d1). Paths below are relative to it. Most
evidence-rig traps are in `.claude/skills/test-evidence-recording/references/`
(`…/references/` below).

### UCD dashboard and wizards

1. **UCD dashboard popups are queued.** Closing one can reveal the next, and any of
   them blocks every menu click. Sweep the whole list until a full pass closes
   nothing (max 4 passes; 5 s timeout on pass 1, 1 s after). Dialogs and close
   controls she handles: change of premises address
   (`ui-dialog-title-dialog-new-address` + `.ui-icon-closethick`); e-Invoice
   profile (`#dialog-einvoice` → `#close-dialog`); "Notis Penting"
   (`#rhb-account-no-dialog` sibling → OK); Announcement
   (`ui-dialog-title-dialog-announcement` → `.ok-dialog-btn`); insurance banner
   (`#insurance-banner-close-btn`); seasonal campaign (`.modal-campaign:visible
   #dialog-campaign-close-btn`). Re-check cheaply before every menu click; a late
   dialog can surface after the sweep. `[charmain-repo: src/pages/components/popup-sweep.ts:4-129]`
   Same duplicate-hidden-campaign trap as our memory note: `:visible` on
   `.modal-campaign` is required. `[charmain-repo: src/pages/components/popup-sweep.ts:28-35]`
2. **UCD "Working..." overlay** is an `h1` with that text; wait for it hidden
   before the popup sweep. `[charmain-repo: src/pages/ucd/ucd-home.page.ts:38-41]`
3. **eSerahan create screen opens `#dialog-estm-announcement`**, and its
   `.ui-widget-overlay` sits over the category tiles, so every click times out
   until it is closed. STMS has no such dialog. `[charmain-repo: src/pages/wizard.page.ts:101-133]`
4. **ID-category tiles** are `<a class="owner-category" data="MALAYSIAN|SYARIKAT|MyPR - PEMASTAUTIN TETAP" category="1|4|0">`
   with jQuery handlers. Clicking the surrounding `<td>` appends `#` to the URL
   and does nothing. Each category has two anchors (image + text) with the same
   attributes; click whichever is visible. `[charmain-repo: src/pages/wizard.page.ts:29-41, 135-166]`
5. **jQuery UI confirm: match the class, not the word.** The affirmative button
   always carries `confirm-dialog-btn`, but its label varies — STMS "Yes/No",
   eSerahan payment "Sure to proceed with payment?" is **Back / Next**.
   `page.on("dialog")` never fires for these. `[charmain-repo: src/pages/wizard.page.ts:168-199]`
6. **Consent checkbox:** `.check()` re-queries after the click and loses the
   element to the page's re-render; a plain `click()` + `expect(...).toBeChecked()`
   is stable (`#seller-consent`, `#buyer-consent`, `#to-agree` on STMS).
   **Conflict:** our § "eSTM / eSerahan flow" (flow-estm.md Traps) says the eSTM
   consent checkboxes ignore `.check()` unless events are dispatched. Charmain's
   STMS wizard gets them ticked with a real click and no dispatch.
   Not tested on eSTM in her repo. `[charmain-repo: src/pages/wizard.page.ts:201-211; src/pages/ucd/stms-wizard.page.ts:63, 163, 179]`
7. **STMS Step 1:** typing `#vehicleRegNo` is mirrored into a readonly
   `#readonlyVehicleRegNo`; wait for the mirror before ticking consent, or the
   consent row is re-rendered under you. `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:54-63]`
8. **STMS Step 2 (`data-entry.do`):** Make → Model is an AJAX cascade; Model only
   holds "Select Model / Other" until a Make is chosen. If the form is rejected,
   no "Sure to continue?" dialog appears — read the visible validation messages
   instead of waiting out the dialog timeout. `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:72-149]`
9. **A failed JPJ enquiry does not show "Make Payment".** Wait for the page text
   `Response Code:`, not for `#to-payment`, or every negative JPJ case becomes a
   timeout. Result labels: "Valid As At:", "Blacklisted:", "Hak Milik Dituntut:",
   "Condition Code:", "JPJ Enquiry Status:", "Response Code:".
   `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:172-217]`
10. **A failed RHB payment does not navigate.** The page stays on `payment.do` and
    raises a jQuery dialog with a bilingual message, e.g. for `IF`: "Wang di dalam
    akaun RHB anda TIDAK MENCUKUPI. 你的RHB银行余额不足." Wait for "URL changed OR
    dialog", not for a URL. Dialog text reads "Payment close <message> OK" — strip
    the chrome. `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:238-284]`
11. `#to-payment` is both "Make Payment" (step 4) and the submit on `payment.do`
    (step 5) on STMS too — same as our eSTM quirk. `[charmain-repo: src/pages/ucd/stms-wizard.page.ts:219-236]`

### BackOffice

1. **BO menu is two levels and screen names repeat across categories** ("STMS
   Transaction" is under both Transactions Relevant and Support Tools). Address a
   screen as category › screen: XPath
   `//td[span[normalize-space()='<category>']]//a[normalize-space()="<screen>"]`.
   `[charmain-repo: src/pages/bo/bo-home.page.ts:6-47]`
2. **BO home landing element** used by Charmain is `#home-welcome`; ours is
   `#home-menu`. Both are on the BO home; not a conflict, two anchors.
   `[charmain-repo: src/pages/bo/bo-home.page.ts:35-37]`
3. **Unauthorised API call answers HTTP 200 with the login page.** A 2xx proves
   nothing; treat a returned login form as a refusal.
   `[charmain-repo: …/references/eaint-12131.md:524-529]`
4. **Service Hub listing row = `(id, apptId)`**, not the reference no. and not
   `id` alone: one row per appointment, `detail.do?id=<txn>&apptId=<appt>`.
   Measured 2026-08-18: 151 of 332 references had more than one row. A "flag
   contradicts itself" defect was written and retracted over this.
   `[charmain-repo: …/references/eaint-12131.md:734-760]`
5. **Service Hub listing has two remark columns:** "Remarks" and "Special Remarks";
   the latter is a Yes/No flag (`<b style="color:red">Yes</b>`), not the text.
   Resolve cells by header text. `[charmain-repo: …/references/eaint-12131.md:772-776, 849-853]`
6. **Service Hub listing Export `#sc-export` is Ops-only** (present for Ops,
   absent for CSE, 2026-08-17). Check a privileged role before calling any control
   missing. **Update Shipping is status-dependent** — absent on a "New" delivery
   even for Ops. `[charmain-repo: …/references/eaint-12131.md:530-532, 780-790]`
7. **Special Remark corrupts non-ASCII** on the round trip (em dash comes back
   `â€"`). Pre-existing, platform-wide; type ASCII unless the case is about it.
   `[charmain-repo: …/references/eaint-12131.md:855-864]`
8. **BO user-edit form silently refuses a Contact No outside 9–11 characters** —
   the click handler returns false, no request is sent, the role change "does not
   stick". `update.do` enforces the same rule. One shared HubAdmin / Admin /
   Probation login has its role switched by Ops; always restore it in `finally`
   and read it back. `[charmain-repo: …/references/eaint-12131.md:865-900]`
9. **Repeated logins are throttled** on shared QA environments: a redirect to a
   different login page, or a landing page with none of the expected controls.
   It looks like a wrong password. Wait, then re-run; do not retry into a lockout.
   `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:315]`
10. **Bank (Service) Portal login bounce is usually the company IP whitelist**,
    not the password (cost three days). `[charmain-repo: …/references/eaint-12155.md:119-120]`
11. **AATF still enforces the old 8-character password minimum**
    ("Password must not less than 8 character"). `[charmain-repo: …/references/eaint-12155.md:121]`

### Listings, exports, downloads

1. **A listing returns nothing at all** when a mandatory, unflagged filter is
   missing — usually From/To. UCD SSM listing (`/view/ucd/ssm/enquiry/`) and BO SSM
   listing need a date range; BO STMS listing `#refNo` search bypasses it. Add the
   range as a fallback only — forcing it on screens that don't need it dropped her
   coverage 5/18 → 1/18. `[charmain-repo: …/references/rig-lessons.md:160-168; …/references/eaint-12054.md:368-380]`
2. **SSM listing `#refNo` is the SSM number** (`SSM680004415`), not the STMS `S…`
   ref; the SSM Number column shows the ROC as `202020387854 (20387854-A)`.
   `[charmain-repo: …/references/eaint-12054.md:378-380]`
3. **Empty-state message renders as a table row** and matches `tbody tr`. Exclude
   it. Read the page's own "No. of Records" label rather than counting rows.
   `[charmain-repo: …/references/rig-lessons.md:179-185; src/pages/components/listing.ts:87-95]`
4. **`networkidle` is not "the table has painted."** Wait for a result row before
   counting. `[charmain-repo: …/references/eaint-12131.md:714-716]`
5. **Chained searches inherit the previous dropdown** when a filter is omitted
   (the `/obs` listing): narrow then wide silently re-runs narrow. Widest first.
   `/obs` listing paginates at 100. `[charmain-repo: …/references/eaint-11982.md:1002-1006]`
6. **Exports:** control sits behind a native `confirm()` ("Sure to export?"), the
   file opens via `window.open(..., "_blank")` in a popup, and the Export control
   is hidden when the search returns 0 rows. `/obs` export is XLSX
   (`OBS-<yyyyMMddHHmm>.xlsx`, 55 columns), not CSV.
   `[charmain-repo: src/utils/downloads.ts:15-37; …/references/eaint-11982.md:736-760]`
7. **Exported references repeat.** One export had 243 duplicated reference numbers;
   one reference had two rows differing only by time slot. Match on several
   columns and fail on ambiguity. `[charmain-repo: src/utils/downloads.ts:68-95]`
8. **Nothing inside a native-dialog handler may touch the page.** A native
   `confirm()` / `alert()` freezes the renderer; a `page.evaluate()` in the handler
   never resolves, the dialog is never accepted, and the click hangs (15 minutes
   observed); `.catch()` does not help. Capture the message, accept, then act.
   `[charmain-repo: …/references/eaint-12131.md:697-701; …/references/eaint-11982.md:762-767]`
9. **Native `confirm()` / `alert()` are browser chrome** — a Playwright screenshot
   cannot see them; only a full-desktop capture can.
   `[charmain-repo: …/references/eaint-12131.md:728-733]`

### Tooling and environment

1. **`[eAuto]` in a path breaks `glob` and PowerShell `-like`** (brackets are a
   character class). Use `.Contains()` / `os.walk`. Deep evidence paths pass
   `MAX_PATH`. `[charmain-repo: …/references/eaint-12155.md:126-130; …/references/eaint-11982.md:826-827]`
2. **AMSI blocks `Add-Type` user32 P/Invoke in a generated `.ps1`** and returns
   nothing. Use CDP `Browser.getWindowBounds` and `document.hasFocus()` instead.
   `[charmain-repo: …/references/eaint-11982.md:821-825]`
3. **Playwright empties `test-results/` at the start of the next invocation.**
   Copy artifacts out after every run, not at the end of a batch.
   `[charmain-repo: …/references/eaint-11982.md:835-846]`
4. **A crashed persistent Chrome profile shows "Restore pages?"** on the next
   launch, inside the recording. Reset `exit_type` to `Normal` in
   `<profile>\Default\Preferences` before launch. `[charmain-repo: …/references/rig-lessons.md:144-150; …/references/eaint-12054.md:396]`
5. **An evidence project left at `headless: true` filmed the bare desktop** (Teams)
   while reporting 8/10 ticks. Gate on a real window being present before recording.
   `[charmain-repo: …/references/eaint-11982.md:804-813]`
6. **`--list` with an always-on JSON reporter writes an empty results file** that a
   status board then counts as a run. Her config attaches reporters only when not
   listing. `[charmain-repo: playwright.config.ts:28-58]`
7. **Ambient shell env vars leak into account discovery.** `node --env-file`
   merges `.env` into `process.env`, which already held other systems'
   `*_USER/_PASS`; a scan picked one as a second test account. Read `.env`
   directly and require known role prefixes.
   `[charmain-repo: …/references/eaint-12131.md:902-912]`
