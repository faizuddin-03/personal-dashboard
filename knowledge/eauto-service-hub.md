# eAuto Service Hub — business rules

The authority for these values is `ENV` in `tests/service-hub/utils/config.ts`.
Read from it; don't copy the numbers into new code.

## Slot capacity

- **3 bookings per slot** (per session).
- **6 bookings per day** (UCD Portal).
- **2 slots per day**: Morning 10am–12pm, Afternoon 2pm–4pm.

`[verified: tests/service-hub/utils/config.ts · ENV.slotCapacity]`

In the slot picker, slot index `0` = morning, `1` = afternoon — the DOM ids
follow the same indexing (`#si-cnt0`/`#si-cnt1`, `#si-cap0`/`#si-cap1`).
`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

## Calendar window (SRD 2.3.2.1 #3)

The calendar shows **only the current month and the following month** — a
2-month window, not an open-ended lookahead. A date beyond it never renders a
cell at all, so it is definitionally not selectable.
`[verified: tests/service-hub/utils/config.ts · ENV.calendar.monthsVisible; SlotPickerComponent.isDayBookable]`

Important distinction when writing tests:

- `ENV.calendar.monthsVisible` (2) is for **asserting the rule**.
- `ENV.calendar.searchMonthsAhead` (6) is for **test-data arrangement only** —
  finding any open date to book against. Staging's shared calendar has been
  fully booked through the real 2-month window, while genuine open dates exist
  further out, so finder helpers page this far forward to avoid spurious
  arrangement failures. Never use it to assert the 2-month rule.

`[verified: tests/service-hub/utils/config.ts · ENV.calendar comments, dated 2026-07-30]`

## Which dates are blocked (UCD)

Blocked = not selectable, which means either greyed out (`si-muted`) or not
rendered at all. The known blocked categories, each covered by a spec:

- Today and tomorrow
- Any previous date (and it shows no slot badge)
- More than 2 months out
- Weekends
- Public holidays (the date is supplied per-run via `EAUTO_PUBLIC_HOLIDAY`;
  the spec skips rather than fails when it isn't provided)

`[verified: tests/service-hub/specs/calendar-rules.spec.ts · SC_SCB_11–20]`

## Reschedule rules (SRD 2.3.2.1 #6, UCD self-service)

1. **+2 days minimum** — today and tomorrow are blocked; earliest selectable
   date is today + 2 (`ENV.reschedule.blackoutDays`).
2. **Availability fallback** — if the +2 date is full, the next available date
   after it is offered instead, so the earliest *bookable* date may be later
   than +2.
3. Bound by the 6-slots/day capacity.

Via CSE (call-in): no date limit, no slot cap.

`[verified: tests/service-hub/utils/config.ts · ENV.reschedule]`

When a UCD reschedules to today's date through the portal, the system sets the
remark **"UCD rescheduled on the same day."** (SRD 2.3.2.1 #5 note iii).
`[verified: tests/service-hub/utils/config.ts · ENV.text.sameDayRescheduleRemark]`

## Pricing

- Software installation: **RM 50.00**
- SST: **8%**
- Software installation total: **RM 54.00**
- Biometric device: **RM 850.00**

`[verified: tests/service-hub/utils/config.ts · ENV.pricing]`

## Exact UI copy

`ENV.text` holds verbatim SRD wording so tests fail loudly if copy drifts.
Currently covered: the payment confirmation popup, the slot-clash popup, the
reschedule confirmation, the same-day reschedule remark, and the
request-submitted confirmation.
`[verified: tests/service-hub/utils/config.ts · ENV.text]`

One correction already baked in: the reschedule confirmation says "you will
**lose** your current appointment", not "lost". `[verified live: SIT2]`

Add new copy assertions to `ENV.text` rather than inlining strings in specs.

## Purchase flows

**Software Installation** (`installation.do`): quantity stepper → Make Payment
(`#si-pay-btn`) → jQuery UI confirm dialog → redirect to `slot.do`.
`[verified: tests/service-hub/pages/SoftwareInstallationPage.ts]`

**Biometric Device Purchase** — two steps:
1. `purchase.do`: device qty, recipient, contact, delivery address → Next
2. `make-payment.do`: free/paid install options → Make Payment → confirm dialog

It redirects to `slot.do`, **except** when "I don't need software installation"
is checked — then it goes straight to `submitted.do`, because there is no slot
to pick and `slot.do` never renders. Waiting only for `slot.do` in that case
hangs for the full timeout.
`[verified live: 2026-07-31 — recorded in tests/service-hub/pages/BiometricPurchasePage.ts · makePayment]`

A device purchase comes with **one free installation**. Buying a device and
leaving the slot page without booking leaves that free install unallocated
against a fresh reference — which is how BO "Add Appointment" tests arrange
their test data.
`[verified: tests/service-hub/utils/arrange.ts · arrangeBdpReferenceViaUCD]`

## Payment on these flows is not a gateway hop

"Make Payment" on the Software Installation and Biometric flows goes through a
jQuery UI confirmation dialog and then straight to `slot.do`/`submitted.do` —
no payment gateway page is involved in the automated path.
`[verified: tests/service-hub/pages/SoftwareInstallationPage.ts, BiometricPurchasePage.ts · makePayment]`

Do not assume the UCD **onboarding** payment step behaves the same way; that is
a different module and has not been inspected. See
[eauto-payments.md](eauto-payments.md).

## Calendar DOM (UCD slot picker)

Selectors derived from the real `slot.do` / `reschedule.do` HTML+JS:

- Grid `#si-grid`, month label `#si-mo`, arrows `#si-prev` / `#si-next`
- Day cells `td[data-date="YYYY-MM-DD"]`; classes `si-book` (bookable),
  `si-muted` (greyed), `si-fullday` (6/6 — never also `si-book`)
- Badges: `.si-badge` reads **"N Available"** or **"Full"** — *not* the
  "Slot n/6" format an earlier version assumed, which silently made every
  room-based finder compute used=0. `[verified live]`
- Booking marks: `.si-bookbadge` (already booked), `.si-selbadge` (selected)
- Modal overlay `#si-ovl`; per-slot capacity text `#si-cap0`/`#si-cap1` reads
  "N of M" or "fully booked"; steppers `#si-cnt0`/`#si-cnt1`
- Footer tally: `Booked <span id="si-alloc-count"> of <span id="si-alloc-total">`
- Unavailable popup `#si-uovl`

The page exposes JS functions the page object calls directly instead of
clicking: `siStep(slot, ±1)`, `siRowRemove(slot)`, `siSaveDate()`,
`siCloseModal()`, `siConfirmBooking()`, `siCloseUnavail()`.

`[verified: tests/service-hub/pages/SlotPickerComponent.ts]`

## BO Appointment Calendar DOM

- Reached via `#sc-appt-cal` on the listing.
- Month bar: `#cal-back`, `#cal-month-picker`, `#cal-month-value` (hidden ISO
  month), `#cal-search`, `#cal-add-btn`.
- `#cal-table` rows: `td.cal-date` holds `span.cal-daynum` formatted
  **DD-MM-YYYY** (note: not ISO — convert), plus two `div.cal-cap` reading
  "Morning - N" / "Afternoon - N (Full)". Morning and afternoon `<td>`s hold
  `ol.cal-ol > li` with `a.cal-rs onclick="acRsOpen('<apptId>')"` and
  `span.cal-co` = "n. COMPANY NAME".
- Reschedule dialog `#ac-rs-dialog` (jQuery UI) — Confirm raises a **native
  browser `confirm()`**, which needs a Playwright dialog handler.
- Add dialog `#ac-add-dialog`: the New/Existing Record type radio is **gone**
  and Reference No. is always required now. Typing the **exact** company name
  auto-binds `#ac-add-cid` on search — there is no dropdown to click.

`[verified live: SIT2 — recorded in tests/service-hub/pages/bo/AppointmentCalendarPage.ts class doc]`

## BO "Mark Failed" reasons

`Reappointment`, `Laptop/PC Issues`, `Other` (SRD 2.3.2.6 #7).
`[verified: tests/service-hub/utils/config.ts · ENV.failedReasons]`
