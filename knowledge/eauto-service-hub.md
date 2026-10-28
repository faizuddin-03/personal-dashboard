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

### Public holiday list from Google Calendar (EAINT-12088, requested, not live)

No SRD exists; the Jira description is the only spec. All quotes from Jira
EAINT-12088 description, read 2026-10-26. `[from ticket EAINT-12088, Jira description]`

1. Today the list is manual: "Public holidays are currently maintained manually - Dev has to input the PH list and manually assign which dates are marked as PH." `[General Information #4]`
2. Source after the change: "Use Kuala Lumpur + National (Malaysia) public holidays from Google Calendar." `[Additional Requirements #1]`
3. Tentative PH that moves: "System syncs and moves the greyed-out PH date from Monday to Tuesday accordingly. If the newly-blocked date (Tuesday) already has UCD appointment(s) booked ... the system will not auto-cancel/move them". `[Additional Requirements #5]`
4. Email for that case: From imonitor@eauto.my, To support@eauto.my, Cc ops@eauto.my, subject "Public Holiday Calendar Update - Booked Appointments Affected"; body lists "Date being blocked", "previously tentative on", "Total booked appointments: [X] bookings on the newly-blocked date". `[Additional Requirements #6]`
5. The +2 buffer base for Sunday / Sunday+Monday PH is a conflict, kept in [flow-service-hub.md](flow-service-hub.md) §8.
6. Not stated anywhere: sync time and frequency, what happens if Google is down, whether the old manual list stays as fallback, whether Jira's "IT to notify" means a person or the system. `[source: Studying EAINT-12088 study §10 #6-#9, 2026-10-27]` `[unconfirmed]`
7. Miro test areas, verbatim: "UCD > SI Flow", "UCD > BDP + SI Flow", "BackOffice > Appointment Calendar", "Reschedule flow", "Observed and tentative date", "To compare gcal with system", "Moved and blocked > Reminder Email". `[from Miro card EAINT-12088, board "eAuto - QA Resource Planning", captured 2026-10-26]`

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

---

## Flow document

The step-by-step flow, URL map, verbatim DOM handles, data-arrangement
helpers and traps for this module are in
[flow-service-hub.md](flow-service-hub.md) (added 2026-10-15). The BackOffice
serial-capture / Delivery Order half is in
[flow-device-purchase.md](flow-device-purchase.md). This file keeps the
business rules only.

## Corrections to the sections above (2026-10-15, checked against the SRDs and the live captures)

1. **Payment confirmation copy.** Above, `ENV.text.paymentConfirm` is quoted as
   "Sure to submit this payment?". The SRD says: `"Sure to proceed with
   payment?"` with buttons Back/X and Next.
   `[from SRD EAINT-10960 v1.2 §2.3.2.1 #2.1; SRD EAINT-11880 v1.2 §2.3.2.1 #2.4.ii]`
   No spec asserts `ENV.text.paymentConfirm`, so the mismatch has never been
   caught live. `[verified: grep paymentConfirm — only config.ts:75]` Treat the
   code string as `[unconfirmed]` until a run checks the dialog text.
2. **Same-day reschedule outcome.** Above: the system sets remark "UCD
   rescheduled on the same day." and the page object looks for an appointment
   with Status **Failed** (`ServiceRequestDetailsPage.hasFailedAppointment`).
   The current SRDs say two different things:
   1. SI SRD v1.2 (highlighted change): the affected record is set to
      Installation Status = **"Pending"** with that remark; remark shown on the
      UCD Service Request Details → Appointment Details and on the BO listing
      Remarks column / Details "Reason of Failed".
      `[from SRD EAINT-10960 v1.2 §2.3.2.1 #6 note iii]`
   2. BDP SRD v1.2: a reschedule to the **same date and time slot** is blocked
      upfront with "The new appointment date and time slot must be different
      from the current appointment.", so Failed "is no longer expected to occur
      as a Tx Status and has been removed from the Status filter".
      `[from SRD EAINT-11880 v1.2 §2.3.2.2 #2 v (highlighted)]`
   The live Status dropdown **still has a Failed value** (`FAILED`).
   `[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:6-8 (verified live)]`
   The same-day scenario (SC_RH_TS01) is done manually; nothing automated
   proves which of the three is live. `[verified: specs/reschedule-handling.spec.ts:48-51]`
   Status: **open contradiction** — do not assert Failed, Pending or the block
   without a live check.
3. **"+2 days minimum" vs the SRD's booking rule.** The SRD's normal-booking rule
   says "Appointment can only be booked from the next day onwards (no same-day
   booking via the portal)" `[from SRD EAINT-10960 v1.2 §2.3.2.1 #4 rule 1]`; the
   +2 rule is written only under Reschedule `[§2.3.2.1 #6 Rules]`. The live
   calendar greys **today and tomorrow on both** the purchase and reschedule
   calendars. `[verified: specs/calendar-rules.spec.ts:54-60 (Add New) and 103-112 (Reschedule)]`
4. **Biometric step-2 URL `make-payment.do`** above is a code comment only;
   no wait or capture confirms it. `[unconfirmed — tests/service-hub/pages/BiometricPurchasePage.ts:8]`
5. **Free-install booking is all-or-nothing** (above, "A device purchase comes
   with one free installation"): booking some but not all units is blocked;
   only the opt-out skips booking. The BDP SRD contradicts itself on this
   (one sentence says free slots are optional, the next — highlighted — says
   every requested installation must be booked). Live behaviour wins.
   `[verified: specs/slot-capacity-boundary.spec.ts:159-199, 226-271; from QA team, 2026-07-30/31; from SRD EAINT-11880 v1.2 §2.3.2.1 #3.5]`

## Which pages belong to the module (SRD scope)

UCD: Software Installation Module (SI), Biometric Device Purchase Module (BDP),
Service Request Listing, Service Request Details Page.
BO (menu "Proforma Invoice / e-Invoice"): Biometric Device Purchase & Software
Installation Listing, Service Request Details Page, Appointment Calendar Page.
`[from SRD EAINT-10960 v1.2 §2.2.1-2.2.2; SRD EAINT-11880 v1.2 §2.2.1-2.2.2]`

## Module permissions (SRD)

1. UCD: Software Installation — all users; Biometric Device Purchase — **main
   user only**. `[from SRD EAINT-10960 v1.2 §2.2.3 "UCD"]`
2. BO Ops — full access; login IDs kmcheah, jasons, mfared, nikmuhamad,
   eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni.
3. BO CSE — SI transactions full access; BDP: "View only for biometric-related
   fields (e.g. Update Shipping Details); CSE may act on the installation
   appointment bundled in a BDP transaction (reschedule / mark completed / mark
   failed), but cannot cancel a BDP transaction — cancellation is Ops-only."
   Export: no access. Login IDs eautochinwei, eautohamal, eautojrjaya,
   eautoxiayuan, kokping, eautomie.
   `[from SRD EAINT-10960 v1.2 §2.2.3 (highlighted); same list in SRD EAINT-11880 v1.2 §2.2.3]`
4. The automation uses one BO account for everything; CSE/Ops differences are
   untested. `[verified: tests/service-hub/utils/config.ts:8-9]`

## Reference numbers and payment references

1. Service Request reference: `SR{Year}{Month}{6_digits_running_no}`, e.g.
   SR67000001. `[from SRD EAINT-10960 v1.2 §2.3.2.2 #2.2]` Live examples:
   SR69001391, SR69001395. `[verified: listing capture, SR-details capture]`
   The BO page object also accepts letters after SR (`/^SR[A-Za-z]*\d+$/`) from an
   older scheme (SRI…/SRB…). `[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:274-277]`
   That scheme, as stated in Teams: `SRI{Year}{Month}{6}` and `SRB{Year}{Month}{6}`;
   the month is 1–9, then O, N, D.
   `[from Teams EAINT-12099 group, 2026-07-14 09:50, Charmain Ea Chiang]`
2. RHB Payment Reference: Ref 1 `SR{YYYYMMDD}{6-digit running no}-{Company ID}`
   e.g. SR20260701000001-1040141; Ref 2 `SOFTINSTALL/`, `BIODEV/`,
   `SOFTINSTALL_BIODEV/`. `[from SRD EAINT-10960 v1.2 §2.3.2.4 (highlighted); SRD EAINT-11880 v1.2 §2.3.2.4]`
   Live payment line: `23-09-2026 11:28am - RHB (SR20260923000002-1109700) - OK`.
   `[verified: _reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html · ol.rec-pay-list]`
3. Invoice line-item descriptions (Finance-confirmed): "Dermalog Biometric
   Device", "Dermalog Software Installation Service". File names
   `Software_Installation_Invoice.pdf` / `_e-Invoice.pdf`,
   `Biometric_Device_Invoice.pdf` / `_e-Invoice.pdf`.
   `[from SRD EAINT-11880 v1.2 §2.3.2.4 #1-2; SRD EAINT-10960 v1.2 §2.3.2.4 #1-2]`
   The automation only checks that the download name contains "pdf".
   `[verified: specs/device-purchase-do-ts01.spec.ts:120-124]`
4. **Planned (EAINT-12123, not live): a 2-digit suffix per record under one SR.**
   "Each record under the same running number should be suffixed with a 2-digit
   running number to differentiate them, e.g. SR67000001-01, SR67000001-02,
   SR67000001-03, SR67000001-04". The details page must show the same suffix:
   "The differentiated suffix must also be reflected on the Software
   Installation/Biometric Device Purchase Details page for an individual record
   (e.g. SR67000021-01), consistent with the suffix shown in the Listing."
   `[from ticket EAINT-12123, Jira description + Additional Note, read 2026-10-26]`
   1. BO pages the Miro card lists: "Service Request Listing Page", "Export Excel file", "Reference No search field", "Service Request Transaction Details Page", "Appointment Calendar > Add Appointment", "Appointment Calendar / Installation Failed > Reschedule Appointment". `[from Miro card EAINT-12123, captured 2026-10-26]` SRD V1.1 (2026-09-11) §2.2.3 is not in the repo to confirm it.
   2. Not stated: whether a single-record SR also gets "-01"; whether search by the base SR returns all "-NN" rows; whether device and installation rows share one sequence; any UCD-side change. `[source: Studying EAINT-12123 study §10, 2026-10-27]` `[unconfirmed]`
   3. Trap once live: the BO page object anchors `/^SR[A-Za-z]*\d+$/` (lines 245, 284, 287, 294), which rejects "SR67000001-01". `[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:245-294]`

## Payment (SRD) — what the automation does not see

Payment is "RHB direct debit"; on failure the "Payment" popup shows RHB's
reason (e.g. "Wang di dalam akaun RHB anda TIDAK MENCUKUPI."), the attempt is
logged with Payment Status "Failed", **UCD cannot retry — only a Back button to
the listing — and the transaction becomes Cancelled**.
`[from SRD EAINT-10960 v1.2 §2.3.2.1 #2.4; SRD EAINT-11880 v1.2 §2.3.2.1 #6]`
Payment Details on the details pages list every attempt as
`[Date & time] - [Channel (Transaction Ref No)] - [Status]`, failed attempts
retained. `[from SRD EAINT-10960 v1.2 §2.3.2.3 #4]` None of this is driven by the
suite — see flow-service-hub.md §11.

## Biometric Device Purchase step 1-2 rules (SRD)

1. Quantity default 1, "−" disabled at 1, numeric typing allowed; helper "Each
   biometric device purchase comes with one free software installation".
   `[from SRD EAINT-11880 v1.2 §2.3.2.1 #1.1; verified: selection-step capture]`
   Cap 40 per transaction comes from EAINT-12166 REQ-007, not this SRD.
   `[verified: knowledge/flow-device-purchase.md]` A parcel holds at most 10
   devices; an order at most 40.
   `[from Teams EAINT-12167, 2026-08-14 10:08, Yi Link Lim]`
2. Recipient Name auto-populates from the Main User, up to 200 chars, auto
   capitalised; Contact No numeric, Malaysian format; "Ship to showroom
   address" ticked by default and read-only address, untick to type.
   `[from SRD EAINT-11880 v1.2 §2.3.2.1 #1.2-1.4]`
3. Step 2 cases: (1) free install only; (2) free + additional at RM54 each
   ("One free installation is included with each device. Additional
   installations cost RM 54.00 each (RM 50.00 + RM 4.00 SST)"); (3) opt-out —
   the Software Installation line is struck through, "No installation
   appointment will be scheduled." in red, **the free entitlement is forfeited
   and cannot be claimed later**, Additional Installation greyed to 0.
   `[from SRD EAINT-11880 v1.2 §2.3.2.1 #2-#4]`
4. A free-install stepper ("You are entitled to [N] free software
   installations", min 1, max = units) is described (highlighted) — not seen in
   any page object or capture. `[from SRD EAINT-11880 v1.2 §2.3.2.1 #2.1; unconfirmed live]`
5. Every installation (free or paid) is valid **2 months from purchase**
   (e.g. 10/10/2026 → 10/12/2026); the Confirm Appointment step shows "Your
   appointment for software installation is valid for 2 months from your
   purchase date." `[from SRD EAINT-11880 v1.2 §2.3.2.1 #2.1 note, #3.5 note; SRD EAINT-10960 v1.2 §2.3.2.1 #6.1.iv]`
   `[from Teams EAINT-12099 group, 2026-07-20 16:34, Kin Hang Aw]`

## Slot-picker copy and counters (SRD)

Dialog title "Installation Appointment"; "Remaining software installation
appointment to allocate : 3"; sessions "0 of 3 booked"; green "Selected (n)"
badge; tally "Booked 3 of 3 appointment(s)."; Not Available popup "Slot
Unavailable. Sorry, some selected time slot are booked. Please try again with
another time slot or dates." with OK. `[from SRD EAINT-10960 v1.2 §2.3.2.1 #5-#6]`
Live tally markup is `Booked <span id="si-alloc-count"> of <span id="si-alloc-total">`.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts:43-46]`

## Service Request status lifecycle (Tx Status, UCD listing)

1. `-` while Payment is neither OK nor Failed.
2. **Pending** while at least one appointment is not final; a Failed
   appointment is non-final (it goes to reappointment).
3. **Cancelled** when all appointments are Cancelled, or Payment = Failed.
4. **Completed** only when all appointments are final and at least one is
   Completed.
5. **Expired** when no installation (free or paid) is claimed within 2 months of
   purchase (buy 6 July → expire 7 September); enforced by a **daily cron**
   that flips installation and transaction records; applies to SI and BDP.
6. Terminal values: Completed, Cancelled, Expired — no further change.
`[from SRD EAINT-10960 v1.2 §2.3.2.2 #2.6 i-v (v highlighted), §2.3.2.5 #2 note 7]`
Listing colours: Pending blue, Completed green, Expired/Cancelled/"-" black;
Payment "OK" green / "Failed" red / "–"; e-Invoice Status OK/Failed/–; sorted
latest Date Requested first; 20 per page UCD, "No record found. Try again."
`[from SRD EAINT-10960 v1.2 §2.3.2.2 #2, #4]`
Code: `TxStatus` values ALL/NEW/PENDING/COMPLETED/FAILED/CANCELLED/EXPIRED.
`[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:8]`

**Per-appointment status** (Appointment/Installation Status): Pending blue,
Completed green, Failed red, Cancelled/Expired/"-" black. "New" is a Delivery
Status value only; a paid-but-unscheduled installation shows Installation
Status "-". `[from SRD EAINT-11880 v1.2 §2.3.2.5 #2.14 note (highlighted)]`
BO status banner on UCD details: "Installation request completed." green /
"Installation request failed." red. `[from SRD EAINT-10960 v1.2 §2.3.2.6 #6.3, #7.4]`
Reason of Failed persists after a reappointment returns the status to Pending;
repeat failure overwrites it (no history). `[from SRD EAINT-10960 v1.2 §2.3.2.6 #3.6 (highlighted)]`

## Listing actions and cancellation authority (SRD)

1. UCD Action column: View; Reschedule — SI requests with Tx Status PENDING
   only; Resubmit — only on a paid-but-unscheduled row (Payment OK, no
   appointment), resumes at Step 2 Appointment; never on a failed-payment row.
   `[from SRD EAINT-10960 v1.2 §2.3.2.2 #3 (highlighted)]`
   Live: Reschedule and Resubmit share `a.sc-resubmit`. `[verified: ServiceRequestListingPage.ts:151-160]`
2. UCD **cannot self-cancel** a Service Request. `[from SRD EAINT-10960 v1.2 §2.3.2.5 #2 note 6]`
3. BO Cancel link shows while Installation Status is "-", "New", "Pending" or
   "Failed"; hidden once Completed/Cancelled/Expired. Popup "Sure to cancel?".
   `[from SRD EAINT-10960 v1.2 §2.3.2.5 #2.18.ii (highlighted)]` Live: `#sc-cancel-dialog`.
   `[verified: listing capture:436]`
4. Cancellation scenarios (Payment = OK): BDP + paid install (Pending) and BDP +
   booked free install (Pending) — Ops cancels per appointment slot; BDP with no
   booking ("-") — Ops cancels the transaction, Tx Status → Cancelled directly;
   SI Pending — Ops and CSE per slot; SI "-" — Ops and CSE, Tx Status →
   Cancelled directly. Ops can cancel SI and BDP; CSE can cancel SI only.
   `[from SRD EAINT-10960 v1.2 §2.3.2.5 #2 notes 1-6 (highlighted)]`

## BO listing rules (SRD + live)

1. Filters: Reference No., Company Name, **Date Requested From/To mandatory,
   defaults to the current month, min 1 day max 1 month**, Company ROC,
   Delivery Date From/To (BDP only), Delivery Status (BDP only), Appointment
   Date From/To (max 1 month), Installation Status (All/-/Pending/Completed/
   Failed/Cancelled/Expired), Time Slot, Payment Status (All/OK/Failed), LHDN
   Response Status (All/OK/Failed/-). Buttons Search, Export, Reset, Appointment
   Calendar. `[from SRD EAINT-10960 v1.2 §2.3.2.5 #1]`
   Live `<select>` values: deliveryStatus `-`/`New`/`Arranged`/`Delivered`;
   paymentStatus `Paid` (shown as OK)/`Failed`; lhdnStatus `OK`/`Failed`/`New`
   (shown as "-"); timeSlot checkboxes `__NONE__`/`1000_1200`/`1400_1600`.
   `[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html · #sc-filter-form]`
2. Columns (live, 20): #, Reference No., Service Type, Date Requested, Company
   Name, Company ROC, Device, **Device Serial No.** (EAINT-12167 REQ-011),
   Delivery Date, Installation Request, Appointment Date, Time Slot, Payment
   Status, LHDN Response Status, Delivery Status, Installation Status, Date
   Completed, Remarks, Special Remarks, Action. `[verified: same capture · thead]`
   Device shows "-" and Delivery Status "-" for a standalone SI; Installation
   Request shows "Yes" for a standalone SI, "-" if no installation.
   `[from SRD EAINT-11880 v1.2 §2.3.2.5 #2.6, #2.8, #2.13]`
3. 50 records per page; "No records found." `[from SRD EAINT-10960 v1.2 §2.3.2.5 #4]`
4. Export → `Biometric_Device_Installation_List_YYYYMMDD.xlsx`, all records in the
   current listing. `[from SRD EAINT-10960 v1.2 §2.3.2.5 #3; verified: SoftwareInstallationListingPage.ts:396-405]`
5. Text-field validation (all UCD/BO text fields incl. remarks): accept letters,
   numbers, special characters, spaces; **block Chinese and other non-English
   characters** (user input only; system remarks may keep Chinese). Quantity
   fields: integers only, no cap beyond 3/session 6/day.
   `[from SRD EAINT-10960 v1.2 §2.3.2.2 #1 note; SRD EAINT-11880 v1.2 §2.3.2.2 #1 note (highlighted)]`

## BO details page rules (SRD)

1. Mark Completed popup: "Are you sure want to mark the installation
   appointment as completed?" No/Yes. Mark Failed popup: "Please select the
   reason causing the installation failed:" radio Reappointment / Laptop/PC
   Issues / Other (free text, 100 chars). `[from SRD EAINT-10960 v1.2 §2.3.2.6 #6-#7]`
   Live radio values are `Reappointment`, `LaptopIssue`, `Other`; over-length
   text shows "Reason must not exceed 100 characters." `[verified: popup capture:145-157]`
2. Concurrency (optimistic lock): a second Ops user's update is blocked with an
   "Error" popup — Update Shipping Details: "Unable to proceed. This record was
   just updated by another user."; Installation Status: "Unable to proceed.
   This Service Request has been completed, failed, expired or cancelled."; OK
   refreshes. Four worked scenarios (shipping A/B, Completed vs Failed,
   Completed vs Completed, Failed vs Completed). `[from SRD EAINT-10960 v1.2 §2.3.2.6 #8; SRD EAINT-11880 v1.2 §2.3.2.6 #9 (highlighted)]`
   Live dialogs `#op-concurrent-dialog`, `#op-installstate-dialog` carry that
   exact text. `[verified: popup capture:160-169]` Never triggered by automation.
3. Shipping (BDP): Delivery Status cannot revert; once Arranged, Delivery Date
   and Consignment Number are locked and only Arranged → Delivered remains;
   Consignment Number becomes a hyperlink to the citylink tracking page.
   `[from SRD EAINT-11880 v1.2 §2.3.2.6 #3.8 rules 1-2, #3.4]` Live: the select
   offers one option; the Update button disappears at Delivered.
   `[verified: tests/service-hub/pages/bo/DevicePurchaseDetailsPage.ts:82-104, 211-226]`
4. DO number: SRD format "YYYYMMDD/DP001" with "Before 12PM → today's date;
   after 12PM → tomorrow's date. The running number resets daily."
   `[from SRD EAINT-11880 v1.2 §2.3.2.3 #3.3]` Live format is `20260923/DP-0005`
   (hyphen, 4 digits) and the suite asserts `/^\d{8}\/DP-\d{4}/`; the 12PM
   date rule has not been observed. `[verified: SR-details capture; specs/device-purchase-do-ts01.spec.ts:100]`
   **Open contradiction** on the exact format and on the noon rule.
5. Appointment Details on a BDP without an installation: panel shows "No
   appointment record found" in red (BO) / is not displayed (UCD).
   `[from SRD EAINT-11880 v1.2 §2.3.2.6 #4 note; §2.3.2.3 #4 note]`

## BO Appointment Calendar rules (SRD)

Month dropdown + Search; two time slots per date; each slot lists confirmed
appointments as a numbered company list; counters "Morning - 3", "Afternoon - 3
(Full)" with "(Full)" red at capacity; the cap "applies to UCD Portal bookings
only; the indicator is informational for CSE"; dates with no appointments show
"-". Reschedule dialog: read-only Company Name, Installation Status (Pending /
Failed), Reference No., Current Appointment Date; New Appointment Date; Time
Slot radio; Cancel/Confirm. Add dialog: "Please enter the company name to add
installation appointment."; Company Name + Search; Reference No. + Search;
Appointment Date ("mandatory dropdown" in the SRD — **live it is a datepicker**);
Time Slot radio. `[from SRD EAINT-10960 v1.2 §2.3.2.7 #1-#4; verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts:33-42]`
Emails: a reschedule by CSE also triggers the Reschedule Email, which lists only
the rescheduled appointment(s). `[from SRD EAINT-10960 v1.2 §2.3.2.1 #8 (highlighted)]`

## Emails (SRD, not automated)

Sender support@eauto.my. Confirmation on successful booking: subject
"eAuto: Your Software Installation Appointment is Confirmed — [UCD Company
Name]", table # / Date / Time / Paid Amount, CS phone 03-27798899. Reschedule:
subject "... has been Rescheduled — [UCD Company Name]", same body, only the
rescheduled appointment(s). `[from SRD EAINT-10960 v1.2 §2.3.2.1 #7-#8]`

In the BDP email, Paid Amount is the total paid; a free installation shows "-".
`[from Teams EAINT-12124, 2026-09-28 09:34, Kasheng Liew]`

BDP email rules (EAINT-12124, not live). All quotes from Jira EAINT-12124
description, read 2026-10-26; SRD V1.0 (2026-09-11) is not in the repo.
`[from ticket EAINT-12124, Jira description]`

1. New email: "Create an email notification for Biometric Device Purchase, sent from support@eauto.my, with CC to support@eauto.my."
2. One email for a combined order: "If Software Installation is purchased together with Biometric Device Purchase, send 1 combined email instead of separate emails (Software Installation itself has no change)."
3. Reschedule after a combined order: "If Software Installation is subsequently rescheduled, only the existing Software Installation Rescheduled email is sent; Biometric Device Purchase details are not repeated and no new combined email is triggered."
4. SI templates unchanged: "The existing standalone Software Installation Confirmation and Software Installation Rescheduled email templates are not changed under this enhancement. They continue to be sent as-is."
5. Miro test matrix, verbatim: "Biometric Device Purchase", "Biometric Device Purchase + Software Installation (Free)", "Biometric Device Purchase + Software Installation (Add On)", "Software Installation"; scenarios "E2E Happy Flow", "Payment = Failed". `[from Miro card EAINT-12124, captured 2026-10-26]`
6. Not stated: the trigger point (payment success or booking), whether "Payment = Failed" sends anything, and the To address. `[source: Studying EAINT-12124 study §10 #3, #4, #6, 2026-10-27]` `[unconfirmed]`


## Special Remark business rules from Charmain's repo — EAINT-12131 (added 2026-10-27)

Colleague notes, not verified live. Details and sources in [flow-service-hub.md](flow-service-hub.md) § "Additions from Charmain's QA repo — Special Remark for CSE".

1. CSE may type, edit and save the Special Remark on the BDP & SI Transaction Details page; Ops keeps its access; the listing Special Remarks column then reads "Yes". `[charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:42-48]`
2. Remark max 500 characters, trimmed, held per appointment; non-English text is damaged on save (older platform defect). `[charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:243-254,284-295]`
3. CSE has no Export control on the BO listing; Ops does. `[charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:319-321]`
