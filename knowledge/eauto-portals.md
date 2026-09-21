# eAuto — portals, roles, environments

## Portals and roles

- **UCD Portal** — the dealer-side self-service portal. Buys software
  installations and biometric devices, books and reschedules appointments.
  `[verified: tests/service-hub/utils/config.ts · PATHS.ucd*]`
- **BO (Back Office) Portal** — internal. Holds the "Biometric Device Purchase &
  Software Installation Listing" and the Appointment Calendar, and can add or
  reschedule appointments on a UCD's behalf.
  `[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts]`
- **CIBO** — **not an eAuto portal.** A separate system that nonetheless shows
  eAuto insurance transactions, making it a third verification surface after UCD
  and BO. See [cibo.md](cibo.md). `[from QA team, 2026-08-13]`
- **CSE (call-in)** — a distinct path from UCD self-service, with different
  rules: no date limit and no per-day slot cap, bound only by CSE capacity.
  `[verified: tests/service-hub/utils/config.ts · ENV.reschedule comment, SRD 2.3.2.1 #6]`

The 6-bookings-per-day cap binds **UCD Portal bookings only**. On the BO
calendar the "(Full)" indicator is informational — CSE can still add past it.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts · BoDateSlotInfo doc]`

## Environments

Base URL pattern: `https://staging.eauto.my/<env>` where `<env>` is a path
segment, not a subdomain — e.g. `uat1`, `uat4`, `sit2`, `sit3`.
`[verified: tests/service-hub/playwright.config.ts · use.baseURL; scripts/eauto-e2e/data/config.ts · CONFIG.baseUrl]`

### Never tie an environment to a general rule

**The environment is chosen per ticket, based on which one is free and usable for
that deployment.** It is not fixed, and it changes often. So:

- A general rule, business rule or flow document must **never** name an
  environment as part of the rule.
- An environment belongs to **a specific ticket**, and is recorded there — the
  ticket, its study, or its test script.
- Automation takes the environment as a **run-time input**, never a constant. This
  is why the Automation Testing runner has an environment picker
  (see [automation-testing.md](automation-testing.md)).
- Anything below that names an env is either a **code default** (what a script
  falls back to when nothing is passed) or an observation from **one captured run**
  — neither is "the environment to use".

`[from QA team, 2026-08-14]`

The code defaults differ between entry points, so never assume which env a run hit
— read it from the env var:

| Where | Env var | Default in code |
|---|---|---|
| Service Hub suite (config) | `EAUTO_BASE_URL` | `https://staging.eauto.my/uat4` |
| Service Hub playwright.config | `EAUTO_BASE_URL` | `https://staging.eauto.my/uat1` |
| eauto-e2e script | `E2E_ENV` | `sit3` |

`[verified: tests/service-hub/utils/config.ts · ENV.baseUrl; tests/service-hub/playwright.config.ts; scripts/eauto-e2e/data/config.ts]`

Staging is **shared and persistent**. Other runs and other users change data
underneath a test: a date's capacity can shift between scanning for room and
acting on it, and the near-term calendar window is often exhausted.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · allocateUnitsAnywhere doc; ENV.calendar.searchMonthsAhead comment, dated 2026-07-30]`

## Credentials

All injected as env vars, never hardcoded. `EAUTO_UCD_USER` / `_PASS`,
`EAUTO_BO_USER` / `_PASS`, and a second UCD account `EAUTO_UCD2_USER` / `_PASS`
that exists specifically for concurrency tests.
`[verified: tests/service-hub/utils/config.ts · ENV]`

## URL structure

Paths are centralised in `PATHS` — always add there rather than inlining a URL.
`[verified: tests/service-hub/utils/config.ts · PATHS]`

Notable specifics worth knowing before guessing a URL:

- Login is `/public/login/`.
- The Listing's "View" link goes to `receipt.do`, **not** `details.do` —
  `details.do` does not exist as a distinct page. `[verified live: uat4]`
- BO has no stable direct URL for the Appointment Calendar. It is reached from
  `/view/bo/service-hub/listing/main.do` by clicking the "Appointment Calendar"
  button (`#sc-appt-cal`), so the page object navigates through the listing.
- The BO detail page needs **both** `txnId` and `apptId` — one row per
  appointment.

`[verified: tests/service-hub/utils/config.ts · PATHS comments]`

## The transaction-id query param differs per surface — read it, never assume it

Three forms are in use. **There is no single "current" one** — it varies by module,
so always take it from the live page:

| Param | Seen on |
|---|---|
| `?txnId=<number>` | oldest Service Hub redirects |
| `?transactionId=<uuid>` | **insurance** details — `/view/ucd/insurance/enquiry/view.do?transactionId=` `[verified: live HTML, 2026-08-14]` |
| `?id=<uuid>` | **eSTM** details — `/view/ucd/estm/enquiry/view.do?id=` `[verified: live HTML, 2026-08-14]`; also current Service Hub redirects |

An earlier version of this file called `?id=` "current" as though it were global.
It isn't: eSTM and insurance genuinely differ, so a helper written for one breaks on
the other.
`[verified live: SIT2 — recorded in tests/service-hub/pages/BasePage.ts · getTxnIdFromUrl doc; corrected against live HTML 2026-08-14]`

Consequence for any new code: never hardcode the param name.
`BasePage.getTxnIdFromUrl()` returns the whole `key=value` pair so callers can
splice it into a follow-up URL as `?${txnId}`, and URL waits should match all
three, e.g. `/slot\.do\?(id|txnId|transactionId)=/`.
`[verified: tests/service-hub/pages/BasePage.ts, SoftwareInstallationPage.ts · makePayment]`

## Login redirect chain

Submitting login kicks off a redirect chain to the portal home. Returning
before it settles lets a later `goto()` race the in-flight redirect and land on
the home page instead of the intended target — this is exactly what made the BO
listing and calendar navigations fail. `LoginPage.login()` therefore waits until
the URL has actually left `/public/login`, then waits for networkidle.
`[verified: tests/service-hub/pages/LoginPage.ts · login]`

BO login has no reliable landing-page assertion, so it asserts only that the URL
is no longer the login page, with a message naming bad BO credentials as the
likely cause. `[verified: tests/service-hub/pages/LoginPage.ts · loginAsBO]`
