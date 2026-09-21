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

## Test-artefact plumbing

**`browser.newContext()` does not inherit `use.video`.** Only the
fixture-managed default `page`/`context` gets the project's video/trace config,
so manually created contexts recorded nothing at all. Use
`openTrackedContext()`.
`[verified: tests/service-hub/utils/tracked-context.ts]`

## Spreadsheets

**A test-script cell must not start with a bare `-`** — Excel parses a leading
hyphen as a formula. Bullets are written **space-dash-space** (` - item`); the
leading space is what stops the formula parse. Steps and expected results use
numbers, not bullets. (An earlier note here said to use "•" — superseded.)
`[from QA team, 2026-08-14; supersedes the EAINT-12153 convention]`

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
