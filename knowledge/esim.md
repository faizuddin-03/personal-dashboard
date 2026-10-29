# eSIM — the eAuto Simulator

The internal simulator that decides what JPJ, insurance, LKM, SSM, payment and
the rest **reply** to eAuto. QA uses it to force a specific response code for a
vehicle, which is how scenarios like "eSTM returns VEL000069E" or "JPJ times
out" get arranged at all.

This is its own file, not a section of an eAuto flow doc, because eSIM is a
separate application with its own login, its own URL, its own UI conventions and
around a dozen entity groups.

```
Login   https://172.30.202.114:9089/esim/login
User    admin        Password  admin
```

`[from QA team, 2026-08-17]`

## The captured HTML

Everything below is distilled from real page source, and **that source is saved**
— so a selector can be re-checked without a VPN or a login:

| Capture | What it holds |
|---|---|
| [`_reference/html/esim/login.html`](../_reference/html/esim/login.html) | Sign-in form, complete |
| [`_reference/html/esim/app-shell.html`](../_reference/html/esim/app-shell.html) | Sidebar + top bar — identical on every page, and the map of all 12 entity groups |
| [`_reference/html/esim/estm-enquiry-list.html`](../_reference/html/esim/estm-enquiry-list.html) | List, search bar, pager; rows trimmed to 4 representative ones |
| [`_reference/html/esim/estm-enquiry-edit.html`](../_reference/html/esim/estm-enquiry-edit.html) | **The edit form, complete and untrimmed** — every id, name, type, required marker |
| [`_reference/html/esim/estm-submission-list.html`](../_reference/html/esim/estm-submission-list.html) | List only; its edit form is still uncaptured |
| [`_reference/html/esim/dereg-enquiry-list.html`](../_reference/html/esim/dereg-enquiry-list.html) | Full 55-record list (EAINT-9306) |
| [`_reference/html/esim/dereg-enquiry-edit.html`](../_reference/html/esim/dereg-enquiry-edit.html) | **The edit form, complete and untrimmed** |
| [`_reference/html/esim/rhb-transfer-list.html`](../_reference/html/esim/rhb-transfer-list.html) | List, 122 records, trimmed to representative rows (full code inventory in the file's header) |
| [`_reference/html/esim/rhb-transfer-edit.html`](../_reference/html/esim/rhb-transfer-edit.html) | **The edit form, complete and untrimmed** |
| [`_reference/html/esim/rhb-transfer-view-after-save.html`](../_reference/html/esim/rhb-transfer-view-after-save.html) | Post-save view page, confirming the save→view redirect for this entity too |
| [`_reference/html/esim/dereg-submission-list.html`](../_reference/html/esim/dereg-submission-list.html) | Full 52-record list (EAINT-9306); edit form still uncaptured |
| [`_reference/html/esim/dereg-precheck-enquiry-list.html`](../_reference/html/esim/dereg-precheck-enquiry-list.html) | Full 19-record list — **the entity that steers eDereg Pre-Checking's JPJ result** |
| [`_reference/html/esim/dereg-precheck-enquiry-edit.html`](../_reference/html/esim/dereg-precheck-enquiry-edit.html) | **The edit form, complete and untrimmed** |
| [`_reference/html/esim/dereg-precheck-enquiry-view-after-save.html`](../_reference/html/esim/dereg-precheck-enquiry-view-after-save.html) | Post-save view page, confirming the save→view redirect for this entity too |
| [`_reference/html/esim/jomcheck-enquiry-edit.html`](../_reference/html/esim/jomcheck-enquiry-edit.html) | **JomCheck Enquiry edit form, complete** — record #20, `HX`/`HX` (2026-09-30) |
| [`_reference/html/esim/jomcheck-report-edit.html`](../_reference/html/esim/jomcheck-report-edit.html) | **JomCheck Report edit form, complete**, incl. one claim-record block, the `<template>` and the add/remove script — record #19 (2026-09-30) |
| [`_reference/html/esim/jomcheck-report-edit-2026-10-05.html`](../_reference/html/esim/jomcheck-report-edit-2026-10-05.html) | Same form as left on 2026-10-05 (no claims, Simulator Details Only = Yes); proves `select#result` Success/Failed is the field that fails a purchase |

Raw HTML lives in `_reference/` rather than here because this file is meant to be
read whole at the start of a task — see
[`_reference/html/README.md`](../_reference/html/README.md) for the convention.

## Three things that will waste your time first

1. **VPN only.** `172.30.202.114` is unreachable off the VPN, and the failure is
   a connection timeout — which reads like a broken selector, not a network
   problem. The dashboard page gates every run behind an explicit "Confirmed VPN
   Connected" step for exactly this reason. The QA Notion page says the same for
   manual use: "remember to connect to VPN first" before opening the e-simulator.
   `[from Notion export, QA Home/eAuto Secarang Test Environment URL & Account Creation.pdf]`
2. **HTTPS on a bare IP**, so the certificate can never match a hostname.
   Playwright needs `ignoreHTTPSErrors: true` or every navigation fails at TLS.
3. **The URL is fixed.** eSIM is one shared instance — there is no `uat4`/`sit3`
   equivalent. Never add an environment picker for it.
   Faizuddin: "eSim have no environment. it is only a simulator to simulate the
   outcomes of certain scenarios in the eauto/secarang website". Captures of eSIM
   pages need no environment tag. `[Faizuddin, dashboard chat to Scribe, 2026-10-27]`

## Everything is keyed by vehicle-number PREFIX

The organising idea of the whole simulator: each entity table holds rows keyed by
**`Vn Start With`** — a prefix that is **always 2 characters**, like `HX`, `M1`
(Faizuddin, 2026-10-01: "the eSim Prefix is ALWAYS 2 characters only" —
corrects an earlier "2–3 character" note here). A request for vehicle
`HX1234` gets the row whose prefix is `HX`.

That has consequences worth holding on to:

- **It is a shared namespace.** Testers claim prefixes and write their name in
  the Remark (`Faiz - eSTM Enq`, `Azila Testing`, `kinhang - test`). Some carry
  explicit warnings — `pls dont change - for automation use`, and
  `CHUBB UAT ON 30.3.2026 (DO NOT DELETE OR MODIFY THIS PREFIX UNTIL FURTHER
  NOTICE)`. **Read the Remark before editing someone else's prefix.**
- **Prefixes should be unique**, but nothing enforces it. Editing on a duplicate
  is ambiguous, so automation must refuse rather than pick one.
- The **Remark column is the de-facto index** of which codes a prefix is set up
  to return — often listing several (`VEL000401E VEL000069E GLB000000I`).

### Standing rule: set every code the flow needs before EVERY run, happy path included

Because the namespace is shared, **never assume a prefix is resting at the
success code just because that's what it should be** — someone else using the
same prefix may have steered it to a failure code and not restored it (or is
mid-scenario right now). `[from Faizuddin, 2026-08-21]`

Concretely: before starting any automated flow that reads a value eSIM
controls (enquiry result, payment result, etc.), write the code(s) that flow
needs for **all** the entities it touches — not just the one whose failure
would be obvious. This applies to the happy path exactly as much as to a
deliberately-steered failure scenario; skipping it on the happy path is how a
stale failure code from another tester turns into a false failure that looks
like a script or portal bug. See `scripts/eauto-edereg-precheck/utils/esim.ts`
(`ensureEsimHappyPath`) for the reference implementation — it sets both
`dereg-precheck-enquiry` and `rhb-transfer` codes before every run of that
suite's one test, modelled on the single-entity version already proven in
`scripts/eauto-quotation-reminder/utils/esim.ts`.

## UI conventions, shared by every entity

Learn these once; they repeat across all ~30 entity pages.

| Thing | Selector |
|---|---|
| App shell (proves you're logged in) | `aside.sidebar` |
| Search box | `#searchInput` |
| Table | `#dataTable`, rows `#dataTable tbody tr` |
| Record count | `#recordCount` |
| Row actions | `a[href$="/view"]`, `a[href$="/edit"]`, delete `<form action$="/delete">` |
| Edit form | `form[action$="/save"]`, hidden `input[name=id]` |
| Save | `form[action$="/save"] button[type=submit]` |

`[verified: live HTML, 2026-08-17]`

### Saving lands on the record's VIEW page, not back on the list

⚠️ Cost a failed run on 2026-08-17. Submitting the edit form redirects to
`/<entity>/<id>/view`, which shows:

- an alert — `Estm Enquiry Resp saved successfully.`
- a **Record Details** block listing every field and its new value

It does **not** return to the list, so waiting for `#dataTable` after saving
times out on a save that actually worked. Assert on the success text instead —
and note the view page is also all the proof you need, so there is no reason to
navigate back to the list and re-search to confirm the write.
`[verified live: the failed run's post-save DOM, 2026-08-17]`

### ⚠️ Search is client-side, and that is good news

`#searchInput` does **not** hit the server. It filters the already-rendered rows
by toggling `style="display:none"`, and **every record is in the DOM** even
though the pager says "Showing 1-10 of 287".

So:

- **Match on visibility, not presence.** `tr` counts include hidden rows;
  `locator('visible=true')` is what tells you what matched.
- You never need to page through 29 pages to reach a record — search reaches it.
- The match is a **substring**, so searching `AB` also surfaces `ABC`. Narrow to
  an exact `Vn Start With` before acting.

### Form fields: resolve by label, not by id

Every field is `label.form-label[for=<inputId>]` wrapping `<span>Field Name</span>`
(plus `<span class="required">*</span>` when required), with the input carrying
that same id and name.

Resolving **label text → `for` → `#id`** is better than hardcoding ids: the same
code then works on entity forms whose HTML has never been captured, and a renamed
field fails loudly instead of silently writing nothing.

Careful with the ids themselves — several are misspelled in the app:
**`delayMiliSeconds`** (one `l`), and the label reads "Delay Milliseconds".

## eSTM Enquiry — `/esim/estm-enquiry-resp`

The main one for insurance and eSTM work. 287 records as of 2026-08-17.

Field labels, in form order (`*` = required by the form, and already populated,
so "leave blank to keep" is always safe):

`Vn Start With*` · `Loan` · `Claim` · `JSJ Status*` · `Sekat Status*` ·
`JPJ Enq Status*` · `Condition Code 1/2/3` · `Response Code*` · `Usage Code*` ·
`Body Type*` · `JPJ Revenue Code` · `Payment Amount*` · `FIS Revenue Code` ·
`FIS Amount*` · `LKM Revenue Code` · `LKM Amount` · `LKM Effective Date` ·
`LKM Expiry Date` · `Declaration Area` · `Delay Milliseconds*` · `EVOC Email` ·
`New Owner Name` · `Remark`

Input types: `Payment Amount`, `FIS Amount`, `LKM Amount`, `Delay Milliseconds`
are `number`; the two dates are `datetime-local` (`YYYY-MM-DDTHH:mm`); `Remark`
is a textarea; the rest are text — including the status fields, which hold `"0"`
as text. `[verified: live HTML of the edit form, 2026-08-17]`

### Values seen in the wild

- **Response Code** — `GLB000000I` is the success/OK code and by far the most
  common. Error codes follow `VEL######E`, `GLB######E`, `REF######E`,
  `REV######E`, `ENF######E`. **`VEL000069E`** is the one insurance work cares
  about: it is the "no valid insurance" branch that auto-redirects eSTM into the
  insurance flow (see [flow-estm.md](flow-estm.md) § eSTM → insurance handoff).
  One row uses the literal `jpjtimeout` as a response code.
- **Usage Code** `AA`/`AB`/`AC`/`AD`/`AE`/`BF` · **Body Type** `MKR`, `MSL`,
  `VAN`, `MUV`, `PIC`, `13N`
- **Declaration Area** `SEMENANJUNG`, `SARAWAK`, `LANGKAWI` (casing is
  inconsistent — `Semenanjung` also appears)
- **Delay Milliseconds** is normally `0`; set it (e.g. `20000`) to simulate a
  slow JPJ. One row holds `10000` and another `20000` for timeout testing.
- Dates render as `2025-04-29T23:06+08:00[Asia/Kuala_Lumpur]` in the list — a
  Java `ZonedDateTime`, not the `datetime-local` value you typed.
- **Remark accepts Drools rule text.** Several rows hold whole
  `rule "eSTM Enquiry Rule N" when ... then $req.setFinalCode("..."); end`
  blocks, which is how a prefix returns a *different* code on each successive
  call. Don't mistake that for a free-text note.

## Dereg Enquiry — `/esim/dereg-enquiry-resp`

Captured for EAINT-9306 (eDereg Pre-Checking compulsory gate) `[from Faizuddin,
2026-08-21]`. 55 records at capture time; full capture (rows past #10 are
client-side-paginated, `style="display:none"`, not a trim) at
[`_reference/html/esim/dereg-enquiry-list.html`](../_reference/html/esim/dereg-enquiry-list.html),
edit form at
[`_reference/html/esim/dereg-enquiry-edit.html`](../_reference/html/esim/dereg-enquiry-edit.html).

Fields, in form order: `Vn Start With*` · `Response Code*` · `Delay
Milliseconds*` · `Remark`. Same shape as eSTM Enquiry's core fields, without
the STMS-specific business fields (Loan, Claim, JSJ/Sekat status, etc.).

Response codes seen: mostly `GLB######[IE]` (success is `GLB000000I`) and
`VEL######E`, plus a handful of `ENF######E` and `REV######E`. Full set at
capture: `GLB000000I` (success), `GLB000001E`–`GLB000228E` (various field/
data errors), `VEL000006E`–`VEL000549E` (vehicle/chassis/engine/owner
mismatches, blacklists, deadlocks), `ENF000008E/9E/12E` (enforcement
deadlocks), `REV000048E/49E` (deadlock).

### ⚠️ This is NOT the entity that steers eDereg Pre-Checking's JPJ codes

**Resolved 2026-08-21 — see § Dereg Precheck below.** The dev's QA guide and
the QA test plan for EAINT-9306 (see [flow-edereg.md](flow-edereg.md) §5.2)
cite three JPJ response codes used to steer *pre-checking* enquiry outcomes:
`GLB000000I` (Approved), `VEL000100E` ("Vehicle Not Exist"), `VEL000045E`
(generic JPJ error). `GLB000000I` and `VEL000045E` do appear in this Dereg
Enquiry table — but **`VEL000100E` does not**, anywhere in the 55 captured
rows. It took two more entities to find where `VEL000100E` actually lives:
first `/esim/dereg-submission-resp` (which turned out to govern the JPJ
*Deregistration Final Submission* step, step 6, not Pre-Checking), then
`/esim/dereg-precheck-enquiry-resp` — **that** is the entity Pre-Checking
actually reads from, confirmed by its field shape matching the Pre-Checking
result screen exactly and by a remark explicitly naming "eDereg PreChecking."
Dereg Enquiry itself governs a related but distinct JPJ call earlier in the
Deregistration transaction ("JPJ Check", step 4) — three JPJ-facing eSIM
entities across this one ticket, none interchangeable.

Separately, the payment-outcome codes `IF` and `RE` cited in the same test
plan (see [flow-edereg.md](flow-edereg.md) §5.3) don't appear here either —
this table only holds JPJ enquiry codes, not payment outcomes. **Resolved**:
`IF`/`RE` are RHB Transfer response codes, not Dereg Enquiry ones — see below.

## RHB Transfer — `/esim/rhb-transfer-resp`

**This is where `IF` and `RE` (the payment-outcome codes cited in the
EAINT-9306 dev guide/test plan) actually live** `[verified: live HTML,
2026-08-21]`. Captures:
[`_reference/html/esim/rhb-transfer-list.html`](../_reference/html/esim/rhb-transfer-list.html)
(122 records, trimmed to representative rows — full code inventory in the
file's header comment),
[`_reference/html/esim/rhb-transfer-edit.html`](../_reference/html/esim/rhb-transfer-edit.html)
(complete form), and
[`_reference/html/esim/rhb-transfer-view-after-save.html`](../_reference/html/esim/rhb-transfer-view-after-save.html).

Fields, in form order: `Vn Start With*` · `Response Code*` · `Description*` ·
`Delay Milliseconds*` · `Remark` (a `<textarea>` here, unlike Dereg Enquiry's
plain text `Remark`).

Response codes seen: `OK` (success — by far the most common), `IF`
("Insufficient Fund(s)" — spelled out explicitly in several remarks, e.g. row
94's Description is literally "Insufficient Funds" and row 49's remark reads
"aliah OK - success, IF - Insufficient Fund"), `RE` (row 128's remark spells
it out: "RE - 6 minutes timer" — a timeout/retry-window failure, not
insufficient funds), plus rarer `NF`, `NR`, `RP`, `ER-T`, `DL`, `DR`, `NA`.
Several rows carry Drools rule text in Remark
(`rule "RHB Transfer Rule N" when $req: SimulatorRequest() then
$req.setFinalCode("IF"); end`), the same multi-call-steering mechanism
documented for eSTM Enquiry above — a prefix can return a different code on
successive calls rather than a single fixed one.

**`ER` has its own ~12-minute cooldown.** Code `ER` ("RHB API Down",
`RHB_TRANSFER_RESPONSE_CODE_API_DOWN`) enforces a ~12-minute wait between genuine
payment attempts. The native dialog reads "ER - Sila TUNGGU 12 minit kemudian klik
'Resubmit'...". This is separate from `RE`'s 6-minute reset timer.
`[from Session-Handoff-2026-09-17-9306.md, 2026-09-14 §1 — CPC_E2E_TS12 Part 2 live run 2]`

**`IF` remark text.** A prefix set to `IF` produces the failed-payment remark
"Remarks = IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI…"; EAINT-12403 used a
QA prefix set to `IF` to force a failed payment, then switched it to `OK` after the
BO reset. `[from SharePoint TS #042 EAINT-12403, sheet APT, rows 20-23]`

**Confirmed in use for eDereg Pre-Checking payment specifically**, not just
STMS/eSTM: row `EA` (#38)'s remark reads "eSTM & eDereg PreChecking - Char"
and row `4070002` (#90)'s remark reads "eDereg PreChecking - Char" — both OK
rows kept clean for happy-path testing. `[verified: live HTML, 2026-08-21]`

Prefix `HX` appears in both this table (#140, `OK`, remark "Faiz") and in
Dereg Enquiry's captured row (#57, `GLB000000I`, remark "Faiz -
GLB000000I, GLB000003E") — the same shared testing prefix used across both
entities by the same tester.

## Dereg Submission — `/esim/dereg-submission-resp`

Governs the JPJ **Deregistration Final Submission** step — step 6 "Deregister"
of the AATF Deregistration transaction (see
[flow-edereg.md](flow-edereg.md) §3) — as distinct from Dereg Enquiry (the
earlier JPJ Check step) and Dereg Precheck (the standalone eDereg
Pre-Checking enquiry, see below). 52 records at capture time; full
capture (rows past #10 are client-side-paginated, `style="display:none"`, not
a trim) at
[`_reference/html/esim/dereg-submission-list.html`](../_reference/html/esim/dereg-submission-list.html)
`[verified: live HTML, 2026-08-21]`. Edit form not yet captured.

Fields, list columns (edit form not yet seen, but this entity's list has
matched its form on every other Dereg/eSTM entity so far): `Vn Start With` ·
`Response Code` · `Delay Milliseconds` · `Remark`. Same shape as Dereg
Enquiry.

**Automation note from Faizuddin**: the response code (`VEL######E`,
`GLB######[IE]`, `ENF######E`, `REV######E`) goes in the **Response Code**
field, and **must be changed manually by the automation code** — i.e. there is
no separate "type" selector; steering a scenario means editing this one text
field on the record matching the target vehicle's `Vn Start With` prefix, same
mechanic as every other eSIM entity in this file.

Response codes seen: `GLB000000I` (success — including several with
plain-language successful remarks like "OK", "nick"), a long tail of
`GLB######E`/`VEL######E`/`ENF######E`/`REV######E` failure codes covering
vehicle-not-found, chassis/engine/owner mismatches, blacklists (JPJ/JSJ/
Sekat), deadlocks, duplicates, and "PLEASE CONTACT HELPDESK" variants per
sub-system suffix (`VELVE`, `VELLD`, `VELVH`, `VELVO`, `VELOD`, `VELCO`,
`ENFBL`, `ENFJS`, `CMNOW`, `REFOW`, `OLCAM`, `REVRF`, `ENFAB`). Two rows are
explicit multi-outcome test aids: #101 (`WH`, remark "ALIAH - VEL000066E
VEHICLE STATUS NOT ACTIVE, GLB000000I success") and #102 (`FZ`, remark "Faiz -
REV000001E (reset payment)").

## Dereg Precheck — `/esim/dereg-precheck-enquiry-resp`

**This is the entity that steers eDereg Pre-Checking's own JPJ enquiry
result** — resolved 2026-08-21, closing the question left open in § Dereg
Enquiry and § Dereg Submission above. Confirmed two ways: (1) its field set —
`Vehicle Record`, `Vehicle Status`, `Verified Status`, `Usage Code`, `JPJ
Blacklist`, `JSJ Blacklist`, `Agency Blacklist`, `Claim Ownership`, `Vehicle
In Investigation`, `Vehicle Condition` — matches the AATF pre-checking result
screen field-for-field (see
`_reference/codebases/AATF/EAINT-9306-precheck-payment-and-result.html`,
STATE 3); (2) row 10 (prefix `EA`)'s remark literally reads "eDereg
PreChecking - Char." 19 records at capture time; full capture (rows past #10
are client-side-paginated, not a trim) at
[`_reference/html/esim/dereg-precheck-enquiry-list.html`](../_reference/html/esim/dereg-precheck-enquiry-list.html),
edit form at
[`_reference/html/esim/dereg-precheck-enquiry-edit.html`](../_reference/html/esim/dereg-precheck-enquiry-edit.html),
post-save view at
[`_reference/html/esim/dereg-precheck-enquiry-view-after-save.html`](../_reference/html/esim/dereg-precheck-enquiry-view-after-save.html)
`[verified: live HTML, 2026-08-21]`.

Fields, in form order: `Vn Start With*` · `Response Code*` · `Vehicle
Record*` (select: Y/N/NA) · `Vehicle Status*` (Y/N/NA) · `Verified Status*`
(Y/N/NA) · `Usage Code*` (Y/N/NA) · `JPJ Blacklist*` (Y/N/NA) · `JSJ
Blacklist*` (Y/N/NA) · `Agency Blacklist*` (Y/N/NA) · `Claim Ownership*`
(Y/N/NA) · `Vehicle In Investigation*` (Y/N/NA) · `Vehicle Condition*`
(Y/N/NA) · `Delay Milliseconds*` · `Receipt Delay Milliseconds` (optional) ·
`Remark` (optional). By far the richest field set of any Dereg entity — the
plain `Vn Start With` + `Response Code` + `Delay Milliseconds` + `Remark`
shape used by Dereg Enquiry, Dereg Submission, and RHB Transfer doesn't carry
enough detail to populate a full pre-checking result screen, which is
consistent with this being the one entity of the four that has to.

Response codes seen: mostly `GLB000000I` (success), plus `VEL000045E` (row 6)
and **`VEL000100E`** (rows 11, 15, 18 — this is the code that was missing
from Dereg Enquiry and confirmed the search needed to continue). Automation
note applies here too (see § Dereg Submission): editing the **Response Code**
field is a plain text edit, no type selector — but note this entity's other
11 Y/N/NA fields likely also need setting consistently with the response
code for a realistic scenario (e.g. blacklist fields plausibly `Y` alongside
a blacklist-flavoured failure code), not just the code field in isolation.

Prefix `HX` appears here too (#19, `GLB000000I`, remark "Faiz -
REV000001E") — the same shared testing prefix seen on RHB Transfer #140 and
Dereg Enquiry #57.

### All four entities are now registered in `scripts/eauto-esim`

`data/config.ts`'s `ENTITIES` map registers `dereg-enquiry`,
`dereg-submission`, `dereg-precheck-enquiry`, and `rhb-transfer` alongside the
pre-existing `estm-enquiry`/`estm-submission` (`[verified:
scripts/eauto-esim/data/config.ts, 2026-08-21]`), and `app/eauto/esim/page.tsx`
has matching `Field[]` constants + `Entity` entries for each. This was a
registration-only change, not new automation logic — the suite's actual
automation (login, label-resolved field writes, read-back verification) is
entity-agnostic by design, same suite reused for EAINT-11864's TS06. One real
fix rode along: `EsimPages.applyChanges()` previously called `.fill()`
unconditionally, which throws on `<select>` elements — Dereg Precheck's form
is mostly `<select>` fields, so this would have broken the moment anyone
steered it. Now branches on tag name to call `.selectOption()` where needed.

## eSTM Submission — `/esim/estm-submission-resp`

54 records. List columns: `Vn Start With`, `Response Code`, `Refund Amount`,
`LKM Security Number`, `Delay Milliseconds`, `Receipt Delay Milliseconds`,
`Remark`.

⚠️ **Its edit form HTML has not been captured**, so those are list headers, not
confirmed field labels. On eSTM Enquiry the list headers matched the form labels
exactly, which makes it a fair inference — but treat it as `[unconfirmed]` until
someone opens the form. `scripts/eauto-esim` resolves fields by label and prints
the form's real field list when a label is missing, so a wrong guess fails
loudly. `[unconfirmed, 2026-08-17]`

## Jomcheck — `/esim/jomcheck-enquiry-resp` and `/esim/jomcheck-report-resp`

Two entities, two different jobs — don't conflate them. Captured 2026-09-30
(Faizuddin: "i want to share with you the eSim pages for JomCheck Enquiry and
JomCheck Report"), for EAINT-12339. Both registered in `scripts/eauto-esim`'s
`ENTITIES` map and in `app/eauto/esim/page.tsx`'s dashboard picker.

**JomCheck Enquiry** (`_reference/html/esim/jomcheck-enquiry-edit.html`)
controls whether JomCheck returns a vehicle-found result at all — no claim
data lives here. Fields: `Vn Start With` / `Cn Start With` (prefix, same as
every other entity), `Result` (Yes/No), `Delay Milliseconds`, `Start Date` /
`End Date`.

**JomCheck Report** (`_reference/html/esim/jomcheck-report-edit.html`) is the
entity that actually carries claim data. Top-level fields describe the
**report summary**: `Simulator Details Only (No Default)`, `Possible Total
Loss`/`Possible BER`, `Result` (Success/Failed), `Delay Milliseconds`, `Total
Lost Actual`/`Total Lost BER`, `Windscreen History`/`Flood History`/`Total
Loss History`, `Latest Mileage`/`Latest Mileage Date`, `Accident Count`, `Max
Severity`, `Multiple VIN`, and vehicle-identity fields (`VIN`, `Veh Year`,
`Veh Make Desc`, `Veh Model Desc`, `Veh Engine`, `Veh Transmission`, `Veh
Variant`, `Market Value`, `New Net Selling Price`, `Veh Registration No`,
`Created Date`, `Reference ID`, `Start Date`/`End Date`).

Below that sits a **dynamic, repeatable claim-record sub-form** — "Claim
Records (`result.claimList[].value[]`)". "+ Add Claim Record" clones a
`<template>` client-side (`claimValues[__IDX__].*`, index from
`#claimRecordList`'s `data-next-index`); "Remove Record" deletes one block.
Every claim record carries `vehYear`, `vehMakeDesc`, `vehModelDesc`, `vehTrim`,
`vin`, `lossDate`, `authorizedDate`, `claimType`, `accidentType`, `mileage`,
`approvedParts`, `severity`, `claimsType` (ICAP code), `totalPartsChanged`,
`mileageRange`, `possibleTotalLoss`, `possibleBER`. Added/removed records are
only persisted when **Save Changes** is clicked — same trip as every other
field on the page, not a separate submit.

**This is the mechanism that forces a specific claim set — built.** Supersedes
the earlier "not built yet / the generic editor can't drive it" note. Two
implementations exist:

1. `scripts/eauto-esim/pages/EsimPages.ts` `EntityEditPage.readClaimRecords()`
   (lines 205-222), `removeAllClaimRecords()` (228-236, clicks each block's
   `button:has-text("Remove Record")`) and `addClaimRecords()` (244-266, clicks
   `getByRole('button', { name: '+ Add Claim Record' })`, waits up to 5 s for the
   new block, fills fields found by
   `.form-group:has(label:text-is("<label>")) input` / `select`). Driven by
   `ESIM_CLAIM_RECORDS` (JSON array of label→value maps) and
   `ESIM_CLEAR_CLAIM_RECORDS=1` (`data/config.ts:56,62`).
2. `scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts` — the same logic run in the
   test's own page (`replaceClaims()` lines 148-173), used by every EAINT-12339
   eSim TS. See § JomCheck automation in the test page below.

Claim-record labels have **no `for` attribute** (unlike every top-level field),
so they resolve through the sibling input inside the same `.form-group`,
scoped to one `.claim-record`. `[verified: _reference/html/esim/jomcheck-report-edit.html:289-335]`

### ⚠ Record #19 (`HX`/`HX`) only PARTIALLY governs the live Report Listing

`[verified: live, 2026-10-03]` Faizuddin cross-checked a real BO JomCheck
Report Listing row (chassis no. `HX890429JF2302D3`, uat1, 01-10-2026 09:18,
transaction `J600008383`) against eSim's `jomcheck-report-resp` record #19
(`Vn`/`Cn` = `HX`/`HX`) field-by-field:

- **Matched exactly**: `totalLostActual` → Total Loss History (Actual),
  `possibleTotalLoss` → Possible Total Loss, `totalLostBER` → Total Loss
  History (BER), `possibleBER` → Possible BER, `windscreenHistory` →
  Windscreen Claim, `floodHistory` → Flood History, `multipleVin` →
  Multiple Registration of Car Plate / Chassis No., `latestMileage` → Last
  Mileage Recorded, `accidentCount` → Accident Record.
- **Did NOT match** — these are blank on the eSim record, yet the live
  listing showed real values: `vehMakeDesc` (Honda), `vehModelDesc` (Civic),
  `vehYear` (2009), `vehVariant` (full spec string), `vehEngine` (1799),
  `vehTransmission` (Automatic), `vin` (the VIN shown inside the Chassis
  Number column), `marketValue`/`newNetSellingPrice` (Avg. Market Value /
  Approx. New Car Price).
  **The claim-record sub-form on record #19 has ZERO rows saved**, yet the
  live listing showed 2 full claim lines (Date of Loss/Authorized, Odometer,
  Type of Claim, Parts Approved, Severity) — none of that per-claim detail
  came from this eSim record either.

**Reading**: this matches the workbook's own Golden Rule #2/#3 ("if
connected to API, the PDF contains actual details... results from API are
random and cannot be pre-determined") — this transaction was served by the
real/live source for anything eSim leaves blank, not eSim alone, even with
an `HX`-prefixed eSim record present. `useDbReport` (`Simulator Details Only
(No Default)`) was `No` on record #19 at the time.

**Confirmed:** with `Simulator Details Only (No Default)` = `No`, fields left
blank on eSim fall back to default data. [source: Faizuddin, 2026-10-01:
"some of the details left blank will fall to default data"] So a scenario
that needs a value to stay truly blank (zero claim records, a claim with no
ClaimsType) must set it to `Yes`. `[unconfirmed]` that `Yes` keeps every
blank field blank — confirm on the first EAINT-12339 TS12/TS15/TS20 run.

How the JomCheck automation uses it (`scripts/eauto-jomcheck/utils/esimPurchase.ts`,
`NO_DEFAULT_FIELD`): every eSim run sets the field explicitly — `Yes` for
TS12, TS15 and TS20 (`noDefault: true`), `No` for every other run — and the
snapshot/restore covers it, so the result never depends on what another
tester left.

### ⚠ `Vn Start With` and `Cn Start With` are independent keys, not a pair

`[verified: live, both jomcheck-enquiry-resp and jomcheck-report-resp list
pages, 172.30.202.114, 2026-10-03]` Unlike most other entities (where the
prefix is one value), **both JomCheck entities key separately by VN prefix
and CN prefix** — a vehicle-no. purchase is matched against `Vn Start With`;
a chassis-no. purchase is matched against `Cn Start With`, on the SAME table.
These are not required to agree, and either can be blank:

- Most rows set both to the same value (e.g. `HX`/`HX`, `BQ`/`BQ`, `TY`/`TY`)
  — the common case, where a vehicle-no. and chassis-no. purchase against
  that prefix resolve to the same record.
- Several rows set them to genuinely DIFFERENT prefixes on one record —
  Enquiry row 3 (`Vn: PM` / `Cn: LK`), row 12 (`Vn: TL` / `Cn: CA`), row 13
  (`Vn: WB` / `Cn: A5`); Report row 5 (`Vn: TL` / `Cn: HG`), row 8 (`Vn: WB`
  / `Cn: 1R`), row 11 (`Vn: DJ` / `Cn: DKL`).
- On the Report entity specifically, `Cn Start With` is **optional** (no
  `*` on its label, unlike Enquiry where both are required) — several rows
  have it blank (Vn set, Cn empty: rows 1/2/3/4/7/13/17/18), and at least one
  row has the reverse (Report row 14: `Vn` blank, `Cn: HF` — a chassis-only
  record with no vehicle-no. match at all).

**Practical consequence for EAINT-12339's TS03** (purchase by chassis no.,
checks the same re-sourced fields as a vehicle-no. purchase): the chassis no.
used MUST have its own `Cn Start With` prefix set up on the Report entity
(and ideally Enquiry too) for JomCheck to return anything — it is not enough
that the prefix happens to work for vehicle-no. purchases. `HX`/`HX` (record
#20 on Enquiry, #19 on Report) has both set, confirmed working for either
path.

## The other entity groups

Not yet explored; listed so the next person knows what exists rather than
rediscovering the nav. All follow the same list/edit/search conventions.

| Group | Pages |
|---|---|
| STMS / eSTM | STMS Enquiry, STMS Submission, eSTM Enquiry, eSTM Submission, eSTM Cancel, APT Submission |
| Deregistration | Enquiry, Submission, Decomposition, Precheck |
| RHB | Enquiry, Transfer, Service Hub, Account Info |
| LKM | Enquiry, Submission |
| LKM Refund | OCR Doc, Inquiry |
| BMK | Enquiry, Submission |
| **Insurance** | **Insurance API**, **Insurance Quotation** |
| **Jomcheck** | **Enquiry, Report** — see § Jomcheck above |
| SSM | Enquiry, ROB, ROC, LLP |
| Payments | BoldPay Responses (keyed by vehicle reg prefix) |
| OTH | Enquiry, Submission |

**Insurance API** and **Insurance Quotation** are the obvious next ones to map
for EAINT-11864 and insurance work generally.

### Insurance API and Insurance Quotation pages (captured 2026-10-27)

Captures: `_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174951.html`
(Insurance API) and `_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174716.html`
(Insurance Quotation). Environment not recorded in either header [unconfirmed].

1. **Insurance API** — page title "Insurance API Resps", 472 records, "Create New"
   links to `/esim/insurance-api-resp/new`. Columns verbatim: "ID", "Vehicle Reg No",
   "Insurance Plan Code", "Insurance Request Type", "Response", "Is TPFT",
   "Delay Milliseconds". Server-side search box: "Search by Vehicle Reg No...".
   `[verified: live HTML, EAINT-12097-pasted-20261027-174951.html lines 246-295]`
2. **Response** holds the raw insurer reply (XML for Chubb), one row per
   Vehicle Reg No + Plan Code + Request Type. Chubb request types present:
   "VEH", "BASEPREM", "BENECODE", "FINALPREM", "CONFIRM", "JPJENQ". No UBO, CTOS or
   B360 response exists. `[source: pipeline EAINT-12097, Scout chat + Scribe related history, 2026-10-27]`
3. **Insurance Quotation** — page title "Insurance Quotation Controls", 8 records,
   URL `/esim/insurance-quotation-control`. Columns verbatim: "ID", "Plan Code",
   "Quotation Display", "State Code", "Vehicle Type". No UBO column.
   `[verified: live HTML, EAINT-12097-pasted-20261027-174716.html lines 246-288]`
4. **Who changes what:** "because the API page is dev territory, so i need to ask
   them to change anything" — Insurance API rows are changed by the developer on
   QA's request, not by QA. `[Faizuddin, dashboard chat to Scout, 2026-10-27]`
   Same pattern in EAINT-9611: "Ask Dev to change Premium Amount on eSIM".
   `[source: pipeline EAINT-12097, Scout chat, 2026-10-27, citing EAINT-9611 TS sheet "Gross Premium change TS - eSIM", R4 step 6]`
5. **"Quotation Display" = "No"** meaning is not known (RHB row ID 1 and Chubb row
   ID 2 show "No"). Check insurer quotes still show on Step 1 before testing.
   [unconfirmed]

## Codes and prefixes named in CR test scripts

Values the team's CR scripts set in eSIM. Which entity row each lives in is not
recorded in the scripts unless stated.

1. **Insurance prefixes (EAINT-8536):** vehicle prefix `VB` → cover note submission
   failed; `VF` → JPJ signal rejected.
   `[from SharePoint TS #065 EAINT-8536, sheet EAINT-8536, rows 9-13]`
2. **eDereg vehicle-number codes (EAINT-8655 / 9043):** `GLB000000I` success,
   `VEL000100E` failed, `ENF000013E` cancelled, `VEL000102E` final submission failed.
   `[from SharePoint TS #075 EAINT-8655 & 9043, sheet E2E Flow, rows 3-9]`
3. **STMS Enquiry response code `4K`** is set to make the Hak Milik cronjob buy the
   document from JPJ (the Service Portal then shows "Hak Milik = J" — see
   [flow-estm.md](flow-estm.md) § After completion).
   `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow, row 3]`
4. **Per-scenario QA prefixes (EAINT-12403):** the script used QA-specific prefixes
   per scenario, e.g. one prefix with RHB Transfer `IF` to force a failed payment,
   switched to `OK` after the BO reset (see § RHB Transfer).
   `[from SharePoint TS #042 EAINT-12403, sheet APT, rows 20-23]`

## Automating it — `scripts/eauto-esim`

Driven from the dashboard at **/eauto/esim** via
`app/api/eauto-esim/run/route.ts`.

The contract: **an empty field means no change.** Only fields the user typed into
are written, which is what makes it safe against a shared simulator other people
depend on. The route drops blanks, and so does the spec's config parser — blank
must never be read as "clear this value".

Env: `ESIM_ENTITY`, `ESIM_PREFIX`, `ESIM_CHANGES` (JSON of *label* → value),
`ESIM_USER`/`ESIM_PASS` (default `admin`/`admin`), `ESIM_HEADLESS`.

The run refuses rather than guesses when a prefix is **missing** or
**duplicated**, and reads the row back after saving so success means the write
actually landed, not merely that the redirect happened.

## Standing pattern: a TS that changes eSim — VPN gate + always-restore

**Originated on EAINT-11864's TS06** (2026-08-18) and reused since by
EAINT-9306's eDereg Pre-Check suite. Any future TS that needs to steer eSim
data before its own flow runs (EAINT-12339's eSim TS already do, in the
in-page form described in item 1) should follow this exact shape rather than inventing a lighter one
— asked to check "which ticket applied this eSim handling" (Faizuddin,
2026-09-30): it's these two.

**1. eSim runs IN THE TEST'S OWN BROWSER PAGE — standing rule from
2026-10-01.** Faizuddin: "the eSim must also be open in the same browser as
the main testing, so that user can know how the eSim is set up when
rewatching the test evidence." The set-up (and the restore) must be in the
run's video, so a page object drives eSim with the same `page` the test
uses — log in, open the record by exact prefix, show the values, save.
Needs `ignoreHTTPSErrors: true` in the suite's playwright.config (eSim is
HTTPS on a bare IP). Worked example: `scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts`
+ `utils/esimPurchase.ts` (EAINT-12339): save the prefix's current values
in-page, set the test's values, run the flow, then write the saved values
back in `afterEach` on the same page (so the restore is recorded too).
Restore to the SAVED values, not a wipe or a fixed constant, when the record
holds more than one field (e.g. JomCheck claim records).

**Older shape, still used by EAINT-11864 and EAINT-9306 (not migrated):** a
`utils/esim.ts` per suite, spawning `scripts/eauto-esim` as a child
process — not importing it (they run from different processes: the
suite's own Playwright run vs. this dashboard's Next.js server). Same
contract every time: `ESIM_ENTITY`, `ESIM_PREFIX`, `ESIM_MODE=write`,
`ESIM_CHANGES` (JSON), parse the `RESULT:{...}` stdout line, and detect a
disconnected VPN by pattern-matching the error text
(`ERR_CONNECTION|ERR_ADDRESS_UNREACHABLE|ERR_TIMED_OUT|net::ERR|ECONNREFUSED|ETIMEDOUT`)
so the failure message says "the VPN looks disconnected" instead of a raw
Playwright timeout. See `scripts/eauto-quotation-reminder/utils/esim.ts` and
`scripts/eauto-edereg-precheck/utils/esim.ts` — copy the shape, don't
reinvent it per suite.

Quotation-reminder usage specifically: `scripts/eauto-quotation-reminder/utils/esim.ts`
writes exactly one field — `Response Code` on entity `estm-enquiry` for the
2-character prefix — via `ESIM_ENTITY/ESIM_PREFIX/ESIM_MODE=write/ESIM_CHANGES`,
`npx playwright test --project=esim`; success = a `RESULT:{…}` line. Codes:
`GLB000000I` OK (resting state), `VEL000069E` force-insurance redirect.
`[verified: utils/esim.ts:22-27, 65-73, 101-115]`

**2. The spec sets the value, runs its flow, then ALWAYS restores in a
`finally`** — eSIM is a single shared instance keyed by vehicle-number
prefix, so a test that dies partway through must never leave the prefix
poisoned for whoever tests that prefix next. Export the resting/OK value as a
named constant (`RESPONSE_CODE_OK`, `DEREG_PRECHECK_RESPONSE_CODE_OK`, ...)
and restore to exactly that. If the restore itself fails, `console.log` a
`WARNING` naming the prefix and the value it should have gone back to — don't
throw and mask the test's own real result, but don't stay silent either.

```ts
test('<TS>: ...', async ({ page }) => {
  const prefix = vehiclePrefix(CONFIG.vehicleNo);
  try {
    await setEsimResponseCode(prefix, RESPONSE_CODE_FORCE_X);
    // ... the actual flow ...
  } finally {
    const restore = await setEsimResponseCode(prefix, RESPONSE_CODE_OK);
    if (!restore.ok) console.log(`[TS] WARNING: could not restore prefix "${prefix}" — ${restore.reason}. Fix by hand.`);
  }
});
```

**3. The dashboard gates Run behind a VPN-confirmation modal — never runs
silently.** The JomCheck dashboard (EAINT-12339) briefly used warning text
only, then got the popup too (Faizuddin, 2026-10-01) — no exception now. Compute a `needsVpn` (or similarly-named) boolean from whether
any selected scenario touches eSim; the Run button's `onClick` branches
`needsVpn ? setVpnAsk(true) : run()` instead of calling `run()` directly.
Opening the modal must run nothing — only its "Confirmed" button calls
`run()`. See `app/eauto/quotation-reminder/page.tsx` (`vpnAsk` state, the
fixed-overlay modal with "Not yet — cancel" / "Confirmed VPN Connected") for
the plain version, and `app/eauto/edereg-precheck/page.tsx` for the richer
one (adds a mid-run countdown reminder and a flipping document-title alert
when a timed reset window is about to need the VPN again — reach for that
extra layer only if a TS genuinely has a time-boxed VPN dependency mid-run,
not by default).

**4. Anything not specified above follows the existing suite's own
conventions** — same `PW_HEADED`/`PW_VIDEO`/credential-field/running-counter
patterns as every other eauto-* automation project (see
`.claude/skills/eauto-automation-scaffold/SKILL.md`). This pattern only adds
the VPN gate and the set/run/restore wrapper on top; it doesn't replace
anything else in the standard scaffold.

## Full page map — every entity URL (from the sidebar)

`[verified: _reference/html/esim/app-shell.html:16-141]` All under
`https://172.30.202.114:9089`. Sidebar groups are `button.sidebar-group-toggle`
with `onclick="toggleGroup('group-<x>')"`; the open page's `<li>` carries
`sidebar-nav-item active`.

| Group (`#group-…`) | Page label | List URL |
|---|---|---|
| `group-stms` STMS / eSTM | STMS Enquiry | `/esim/stms-enquiry-resp` |
| | STMS Submission | `/esim/stms-submission-resp` |
| | eSTM Enquiry | `/esim/estm-enquiry-resp` |
| | eSTM Submission | `/esim/estm-submission-resp` |
| | eSTM Cancel | `/esim/estm-cancel-submission-resp` |
| | APT Submission | `/esim/apt-submission-resp` |
| `group-dereg` Deregistration | Dereg Enquiry | `/esim/dereg-enquiry-resp` |
| | Dereg Submission | `/esim/dereg-submission-resp` |
| | Dereg Decomposition | `/esim/dereg-decomposition-resp` |
| | Dereg Precheck | `/esim/dereg-precheck-enquiry-resp` |
| `group-rhb` RHB | RHB Enquiry | `/esim/rhb-enquiry-resp` |
| | RHB Transfer | `/esim/rhb-transfer-resp` |
| | Service Hub | `/esim/service-hub-resp` |
| | RHB Account Info | `/esim/rhb-account-info` |
| `group-lkm` LKM | LKM Enquiry | `/esim/lkm-enquiry-resp` |
| | LKM Submission | `/esim/lkm-submission-resp` |
| `group-lkm-refund` LKM Refund | Refund OCR Doc | `/esim/lkm-refund-ocr-document-resp` |
| | Refund Inquiry | `/esim/lkm-refund-inquiry-resp` |
| `group-bmk` BMK | BMK Enquiry | `/esim/bmk-enquiry-resp` |
| | BMK Submission | `/esim/bmk-submission-resp` |
| `group-insurance` Insurance | Insurance API | `/esim/insurance-api-resp` |
| | Insurance Quotation | `/esim/insurance-quotation-control` (note: `-control`, not `-resp`) |
| `group-jomcheck` Jomcheck | JomCheck Enquiry | `/esim/jomcheck-enquiry-resp` |
| | JomCheck Report | `/esim/jomcheck-report-resp` |
| `group-ssm` SSM | SSM Enquiry | `/esim/ssm-enquiry-resp` |
| | SSM ROB | `/esim/ssm-rob-submission-resp` |
| | SSM ROC | `/esim/ssm-roc-submission-resp` |
| | SSM LLP | `/esim/ssm-llp-submission-resp` |
| `group-payments` Payments | BoldPay Responses | `/esim/bold-pay-response` |
| `group-oth` OTH | OTH Enquiry | `/esim/oth-enquiry-resp` |
| | OTH Submission | `/esim/oth-submission-resp` |

Other app URLs: home `/esim/` (`a.sidebar-brand`), logout `/esim/logout`,
login `/esim/login` (form `action="/esim/login" method="post"`).

Per-record URL pattern, every entity: `/<entity>/new` (list's **Create New**
`a.btn.btn-primary`), `/<entity>/<id>/view`, `/<entity>/<id>/edit`,
`POST /<entity>/<id>/delete`, `POST /<entity>/save` (edit form).
`[verified: estm-enquiry-list.html:37,127-133; dereg-enquiry-list.html:211]`

## Login page — exact DOM

`[verified: _reference/html/esim/login.html:19-66]`

| Element | Selector / text |
|---|---|
| Heading | `<h1>eAuto Simulator</h1>` |
| Username | `input[name="username"]` (placeholder "Enter your username", `required`, `autofocus`), label text `USERNAME` without `for` |
| Password | `input[name="password"]` (placeholder "Enter your password") |
| Remember me | `#remember-me` (`name="remember-me"`) — unused by automation |
| Submit | `button.login-btn` (`type="submit"`) |

A failed login re-renders the same form, so success is asserted on
`aside.sidebar` (20 s), never on the absence of an error
(`scripts/eauto-esim/pages/EsimPages.ts:17-22`).

## List page — exact DOM

`[verified: _reference/html/esim/estm-enquiry-list.html:20-133, estm-submission-list.html:141-143]`

| Element | Selector / text |
|---|---|
| Title | `h1.page-title` e.g. "Estm Enquiry Resps"; subtitle `<span id="recordCount">287</span> records` |
| Create | `a[href="/esim/<entity>/new"].btn.btn-primary` "Create New" |
| Search | `#searchBar` > `input#searchInput` (placeholder "Search records...", `autocomplete="off"`) |
| No match | `#noSearchResults` (hidden by default) → `.empty-state p` "No matching records found." |
| Table | `#dataTableWrap` > `table.data-table#dataTable`; first `<th class="col-id">ID`, last `<th class="col-actions">ACTIONS` |
| Row cells | `td` 0 = ID, `td` 1 = **Vn Start With** (what both page objects read, `EsimPages.ts:60`, `EsimJomCheckPage.ts:78`) |
| Row actions | `a[href="/esim/<entity>/<id>/view"]`, `a[href="…/edit"]`, `<form action="…/delete" method="post" onsubmit="return confirm('Are you sure you want to delete this record?');">` |
| Pager | `.pagination-bar#paginationBar` > `.pagination-info#paginationInfo` "Showing 1-10 of 54 results" + `.pagination-controls#paginationControls` |

Rows 11+ arrive with `style="display:none"` — that is pagination, not a
search filter. **Delete is one native `confirm()` away** — no automation in this
repo ever clicks a delete control; keep it that way on a shared simulator.

## Edit-form ids per entity (captured records)

All forms are `form[action="/esim/<entity>/save"] method="post"` with hidden
`input[name="id"]`, and every top-level field is
`label.form-label[for=<id>] > span` + `input|select|textarea#<id>[name=<id>]`.

| Entity | Captured record | Field ids in form order (`*` = `required`) | Source |
|---|---|---|---|
| eSTM Enquiry | #306, prefix `HX`, remark "Faiz - eSTM Enq" | `vnStartWith*`, `loan`, `claim`, `jsjStatus*`, `sekatStatus*`, `jpjEnqStatus*`, `conditionCode1/2/3`, `responseCode*`, `usageCode*`, `bodyType*`, `jpjRevenueCode`, `paymentAmount*`, `fisRevenueCode`, `fisAmount*`, `lkmRevenueCode`, `lkmAmount`, `lkmEffectiveDate`, `lkmExpiryDate`, `declarationArea`, `delayMiliSeconds*`, `evocEmail`, `newOwnerName`, `remark` | `estm-enquiry-edit.html:59-268` |
| Dereg Enquiry | #57, `HX`, remark "Faiz - GLB000000I, GLB000003E" | `vnStartWith*`, `responseCode*`, `delayMiliSeconds*`, `remark` (text input) | `dereg-enquiry-edit.html:156-189` |
| Dereg Precheck | #19, `HX`, remark "Faiz - REV000001E" | `vnStartWith*`, `responseCode*`, selects `vehicleRecord*`, `vehicleStatus*`, `verifiedStatus*`, `usageCode*`, `jpjBlacklist*`, `jsjBlacklist*`, `agencyBlacklist*`, `claimOwnership*`, `vehicleInInvestigation*`, `vehicleCondition*` (options `""` "-- Select --", `Y`, `N`, `NA`), `delayMiliSeconds*`, **`receiptDelayMilliSeconds`** (double `l`, capital `S` — spelled differently from `delayMiliSeconds`), `remark` | `dereg-precheck-enquiry-edit.html:17-70` |
| RHB Transfer | #140, `HX`, `OK`/`OK` | `vnStartWith*`, `responseCode*`, `description*`, `delayMiliSeconds*`, `remark` (textarea) | `rhb-transfer-edit.html:50-77` |
| JomCheck Enquiry | #20, `HX`/`HX` | `vnStartWith*`, `cnStartWith*`, select `result*` (`""` "-- Select --", `Yes`, `No`), `delayMiliSeconds*`, `startDate`/`endDate` (`datetime-local`) | `jomcheck-enquiry-edit.html:53-105` |
| JomCheck Report | #19, `HX`/`HX` | see § JomCheck Report — full form below | `jomcheck-report-edit.html:81-420` |

The HX record on eSTM Enquiry (#306) held, at capture: Response Code
`GLB000000I`, Usage `AB`, Body `MKR`, JPJ Revenue `2361007`, Payment Amount
`100.00`, FIS Revenue `2354071`, FIS Amount `50.00`, LKM Revenue `2354072`,
LKM Amount `200.00`, Declaration Area `Semenanjung`, EVOC Email
`faizuddin@modefair.com`, New Owner Name `COMPANY FAIZUDDIN`, status fields
`0`. These are a snapshot of a shared record, not defaults to rely on.
`[verified: estm-enquiry-edit.html:142-259, captured 2026-08-17]`

### Save confirmation differs slightly by entity

| Entity | Landing URL | Alert |
|---|---|---|
| eSTM Enquiry | `/<entity>/<id>/view` | `Estm Enquiry Resp saved successfully.` |
| RHB Transfer | `/rhb-transfer-resp/140/view` | `div.alert.alert-success > span` "RHB Transfer Resp saved successfully." + `button.close-btn` "×" |
| Dereg Precheck | `/dereg-precheck-enquiry-resp/19` (**no `/view` suffix** in the capture header) | `div.alert.alert-success > span` "Dereg Precheck Enquiry Resp saved successfully." then `.detail-card` |

Both page objects assert `getByText(/saved successfully/i)` (20 s), which
covers every variant; never wait on a URL suffix.
`[verified: rhb-transfer-view-after-save.html:50-53; dereg-precheck-enquiry-view-after-save.html:1-22]`

## JomCheck Report — full form

`[verified: _reference/html/esim/jomcheck-report-edit.html:72-420; jomcheck-report-edit-2026-10-05.html]`
Page title `h1.page-title.page-title-sm` "Edit Jomcheck Report Resp #19";
card header "EDIT RECORD"; actions `a.btn.btn-outline` "Cancel" →
`/esim/jomcheck-report-resp` and `button.btn.btn-primary[type=submit]`
"Save Changes".

| Label | id / name | Type | Notes |
|---|---|---|---|
| Vn Start With | `vnStartWith` | text | **not** `required` on this entity |
| Cn Start With | `cnStartWith` | text | not required |
| Simulator Details Only (No Default) | `useDbReport` | select `true`="Yes" / `false`="No" | no blank option |
| Possible Total Loss | `possibleTotalLoss` | select `true`/`false` | no blank option at vehicle level |
| Possible BER | `possibleBER` | select `true`/`false` | no blank option |
| Result | `result` | select `""` "-- Select --" / `Success` / `Failed`, `required` | Failed = pay but no report (TS31) |
| Delay Milliseconds | `delayMiliSeconds` | number, `required` | |
| Total Lost Actual / Total Lost BER | `totalLostActual` / `totalLostBER` | text | free text like "2 RECORD" |
| Windscreen History / Total Loss History / Flood History | `windscreenHistory` / `totalLossHistory` / `floodHistory` | text | e.g. "YES", "4 RECORD", "No Record Found" |
| Latest Mileage / Latest Mileage Date | `latestMileage` / `latestMileageDate` | text | e.g. "120500" / "30 Mar 2026" |
| Accident Count | `accidentCount` | number | |
| Max Severity | `maxSeverity` | text | e.g. "Medium" |
| Multiple VIN | `multipleVin` | text | e.g. "No" |
| Veh Registration No / Created Date / Reference ID | `vehRegistrationNo` / `createdDate` / `referenceID` | text | |
| VIN / Veh Year / Veh Make Desc / Veh Model Desc / Veh Engine / Veh Transmission / Veh Variant | `vin`, `vehYear`, `vehMakeDesc`, `vehModelDesc`, `vehEngine`, `vehTransmission`, `vehVariant` | text | blank on HX → live/default data fills them |
| Market Value / New Net Selling Price | `marketValue` / `newNetSellingPrice` | number | |
| Start Date / End Date | `startDate` / `endDate` | datetime-local | |

**Claim Records** — `#claim-records`, heading "Claim Records
(result.claimList[].value[])", note "Added/removed here and saved together when
you click **Save Changes**." List container `#claimRecordList[data-next-index]`;
template `<template id="claimRecordTemplate">` with `__IDX__`; inline script
defines `window.addClaimRecord()` (clones template, `nextIdx++`) and
`window.removeClaimRecord(btn)` (`btn.closest('.claim-record').remove()`).
Buttons: `button.btn.btn-outline[onclick="addClaimRecord()"]` "+ Add Claim
Record"; per block `button.btn.btn-danger-outline[onclick="removeClaimRecord(this)"]`
"Remove Record". Each block holds hidden `claimValues[N].id` (blank on a new
block), then:

| Label (exact, used as automation key) | name |
|---|---|
| Veh Year | `claimValues[N].vehYear` |
| Veh Make Desc | `.vehMakeDesc` |
| Veh Model Desc | `.vehModelDesc` |
| Veh Trim | `.vehTrim` |
| VIN | `.vin` |
| Loss Date | `.lossDate` |
| Authorized Date | `.authorizedDate` |
| Claim Type | `.claimType` (the deprecated v1.9 field) |
| Accident Type | `.accidentType` |
| Mileage | `.mileage` (deprecated raw figure) |
| Approved Parts | `.approvedParts` (deprecated) |
| Severity | `.severity` (free text; eAuto passes it through) |
| Claims Type (ICAP code) | `.claimsType` |
| Total Parts Changed | `.totalPartsChanged` (band text) |
| Mileage Range | `.mileageRange` (band text) |
| Possible Total Loss | `.possibleTotalLoss` select `""` "-- Not set --" / `true` "Yes" / `false` "No" |
| Possible BER | `.possibleBER` same options |

Labels are styled uppercase by CSS — read them with `textContent`, never
`innerText` (see trap 3 below).

**Values the EAINT-12339 suite types into the band fields** (pass-through,
verbatim): Mileage Range `0 to 10,000 km`, `10,001 to 20,000 km`, …,
`290,001 to 300,000 km`, `More than 300,000 km`, `Not Specified`; Total Parts
Changed `1 to 10 parts`, `11 to 20 parts`, `21 to 30 parts`, …,
`91 to 100 parts`, `More than 100 parts`, `No information available.`
`[verified: scripts/eauto-jomcheck/tests/esim-claim-boundaries.spec.ts:102-272]`

**HX record #19 state as left on 2026-10-05** (the capture's own header):
Simulator Details Only = Yes, Possible Total Loss = No, Possible BER = No,
Result = Success, no claim records, Total Lost Actual "0 RECORD", Total Lost
BER "RECORD", Windscreen "YES", Total Loss History "4 RECORD", Flood "No Record
Found", Latest Mileage 120500 / "30 Mar 2026", Accident Count 3, Max Severity
"Medium", Multiple VIN "No". The 2026-09-30 capture of the same record had
Total Lost Actual "2 RECORD" and Total Lost BER "3 RECORD" — other testers and
automation runs change it. Never assume these values; set them.

## `scripts/eauto-esim` — code map

`[verified: scripts/eauto-esim/** and app/api/eauto-esim/run/route.ts, app/eauto/esim/page.tsx, 2026-10-16]`

### Config knobs (`data/config.ts`)

| Knob | Env var | Default | Line |
|---|---|---|---|
| Base URL | — (fixed, no override by design) | `https://172.30.202.114:9089/esim` | 9 |
| Entities | — | `estm-enquiry`, `estm-submission`, `dereg-enquiry`, `dereg-submission`, `dereg-precheck-enquiry`, `rhb-transfer`, `jomcheck-enquiry`, `jomcheck-report` → path + label | 12-21 |
| Login | `ESIM_USER` / `ESIM_PASS` | `admin` / `admin` | 26-27 |
| Entity | `ESIM_ENTITY` | `estm-enquiry` | 30 |
| Mode | `ESIM_MODE` | `write` (`read` reports only) | 33 |
| Prefix | `ESIM_PREFIX` | required, uppercased, matched exactly | 36 |
| Changes | `ESIM_CHANGES` | `{}` — JSON label→value; blanks dropped; invalid JSON throws `ESIM_CHANGES is not valid JSON` | 45, 65-78 |
| Claim records to add | `ESIM_CLAIM_RECORDS` | `[]` — JSON array; blanks KEPT (a blank claim field stays blank) | 56, 80-97 |
| Clear claims first | `ESIM_CLEAR_CLAIM_RECORDS` | only `"1"` is true | 62 |
| Headless | `ESIM_HEADLESS` | `"1"` = headless | playwright.config.ts:18 |
| Script dir | `EAUTO_ESIM_SCRIPT_DIR` | `scripts/eauto-esim` | route:11-12 |

`assertConfig()` (lines 99-109) throws on: no prefix; unknown entity (lists
the known keys); write mode with no changes AND no claim work ("No changes
were given — every field was left blank, so there is nothing to apply.").

### Playwright config (`playwright.config.ts`)

Project `esim`, `timeout` 5 min, `workers: 1`, `retries: 0`, reporter `list`,
`ignoreHTTPSErrors: true` (required — bare-IP HTTPS), viewport 1600×950,
`navigationTimeout` 45 s, `actionTimeout` 20 s, screenshot only on failure,
**`video: 'off'`** — it is a data-setup tool, not a test.

### Spec (`tests/esim-edit.spec.ts`) — one test, two modes

Title `eSIM: update simulator record by vehicle prefix`. Login →
`EntityListPage.open()` → `findEditUrl(prefix)` → `EntityEditPage.open()`. Then:

- **read**: `readAllFields()` (+ `readClaimRecords()` for `jomcheck-report`),
  prints `[step] Read N fields — nothing was changed` and
  `RESULT:{status:"SUCCESS",mode:"read",entity,prefix,fields[,claimRecords]}`.
- **write**: `applyChanges()` → optional `removeAllClaimRecords()` →
  optional `addClaimRecords()` → `save()` → `viewPageText()` spot-check; any
  value not visible after save prints `[warn] "<label>" saved as "<v>" but that
  value isn't visible on the record — eSIM may have reformatted it.` Then
  `RESULT:{status,mode:"write",entity,prefix,applied:[{label,from,to,onPage}],claimsRemoved,claimsAdded}`.

### Page objects (`pages/EsimPages.ts`)

| Method | What it does | Lines |
|---|---|---|
| `LoginPage.login()` | `goto /esim/login`, fill `input[name="username"]`/`input[name="password"]`, click `button.login-btn, button[type="submit"]`, expect `aside.sidebar` 20 s with message "eSIM login did not reach the app shell — wrong credentials, or the VPN is not connected." | 9-24 |
| `EntityListPage.open()` | `goto <base><path>`, expect `#dataTable` 20 s | 32-37 |
| `findEditUrl(prefix)` | fill `#searchInput`, wait 600 ms, read visible rows' `td:nth(1)`, exact case-insensitive match; 0 → "No record with Vn Start With exactly … The search surfaced: …"; >1 → "N records share the prefix … refusing to guess" | 47-83 |
| `EntityEditPage.open(url)` | relative hrefs prefixed with `https://172.30.202.114:9089`; expect `form[action$="/save"]` | 90-94 |
| `inputIdForLabel(label)` | `label.form-label:has(span:text-is("<label>"))` → `for`; missing → error listing every label on the form | 102-113 |
| `readAllFields()` | every `label.form-label[for]` → first `span` text → `#id` value | 121-135 |
| `applyChanges()` | per label: `select` → `selectOption(value)`, else `fill`; logs `[step] <label>: "<before>" → "<value>"` | 138-158 |
| `save()` | click `form[action$="/save"] button[type="submit"]`, expect `/saved successfully/i` 20 s | 168-178 |
| claim methods | see § Jomcheck above | 200-266 |

`selectOption(value)` matches an option's **value or label**, so `Yes` and
`true` both work on the JomCheck selects.

### Run route (`app/api/eauto-esim/run/route.ts`)

`maxDuration = 600`; `TIMEOUT_MS` 8 min (kill message "Timed out after 8
minutes. Is the VPN still connected?"); spawns `npx playwright test
--project=esim`; refuses with 500 + install instructions when
`scripts/eauto-esim/node_modules` is missing; 400 when no prefix ("A vehicle
prefix is required.") or, in write mode, no non-blank change ("Every field was
left blank, so there is nothing to change."). Parses the last `RESULT:` line
and every `[step]` line. VPN hint when no RESULT and the output matches
`/ERR_CONNECTION|ERR_ADDRESS_UNREACHABLE|ERR_TIMED_OUT|net::ERR|ECONNREFUSED|ETIMEDOUT/i`:
"Could not reach 172.30.202.114 — the VPN looks disconnected. Reconnect and run
again." `DELETE` kills the child tree (`taskkill /T /F` on Windows).
`[verified: route.ts:9-152]`

### Dashboard (`app/eauto/esim/page.tsx`)

`RUN_KEY = "eauto/esim"` (background run survives navigation). Entity
picker; "Vehicle prefix to find *" (auto-uppercased, placeholder "e.g. HX");
Headless checkbox; **Fetch** (read mode, needs only the prefix) and **Run**
(write); Stop; Eraser button "Clear all fields". Both Fetch and Run open the
VPN modal first ("Is your VPN connected?" → "Confirmed VPN Connected"); the
modal says plainly whether it will read or write. Field lists per entity are
`Field[]` constants (lines 61-213); `Vn Start With` carries placeholder
"only to RENAME the prefix" because filling it renames the record. Preset
chips: Response Code `GLB000000I` (success / OK), `VEL000401E`, `VEL000069E`
(no valid insurance — redirects eSTM into the insurance flow), `VEL000392E`;
Y/N/NA chips for Dereg Precheck; `Yes`/`No` for JomCheck Enquiry Result;
`true`/`false` for the JomCheck Report selects; `Success`/`Failed` for Report
Result. `[verified: page.tsx:13,23,53-236,370-385]`

## JomCheck automation in the test page (`scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts`)

`[verified: file lines 18-218]`

- Own base `ESIM_BASE = 'https://172.30.202.114:9089/esim'`, entity paths
  `enquiry` → `/jomcheck-enquiry-resp`, `report` → `/jomcheck-report-resp`.
- `gotoList()` throws "Could not reach the e-simulator (172.30.202.114) — the
  VPN looks disconnected." on navigation error; logs in only if
  `input[name="username"]` is visible (`ESIM_USER`/`ESIM_PASS` via
  `CONFIG.esimUser/esimPass`, blank → `admin`).
- `openRecord()` requires **exactly one** visible row whose `td:nth(1)` equals
  the prefix ("Expected exactly 1 eSim <entity> record with prefix …").
- `REPORT_VEHICLE_FIELDS` = `Simulator Details Only (No Default)`, `Possible
  Total Loss`, `Possible BER`, `Result` — read and restored with the claims.
- `readState(prefix)` → `{ enquiryResult, claims, reportFields }`;
  `applyState()` writes Enquiry Result (saves only if changed), then the
  Report's fields, then `replaceClaims()` (remove all, add each), then one save.
- `setReportResult(prefix, 'Success'|'Failed')` changes only the Report
  `Result` and saves only when it changed.
- `utils/esimPurchase.ts`: prefix = first 2 characters of the vehicle no.
  (`esimPrefixOf`); every purchase sets Enquiry Result `Yes`, Report `Result`
  `Success`, `Simulator Details Only (No Default)` = `Yes` only when the TS
  passes `noDefault: true`, else `No`; snapshot logged as
  `[esim] <prefix> snapshot: <json>`; restore in `test.afterEach` with 3 extra
  minutes (`registerEsimRestoreHook`). A test that buys twice on one prefix
  keeps the FIRST snapshot.

## Traps found in code (2026-10-16)

1. **The dashboard cannot write claim records.** `ESIM_CLAIM_RECORDS` /
   `ESIM_CLEAR_CLAIM_RECORDS` exist only in the spec's config; the run route
   never passes them, and it rejects a write with no field changes. Claim
   records are set only by the JomCheck suite's in-page code (or a hand-run of
   `scripts/eauto-esim` with the env vars). The dashboard's JomCheck Report note
   ("this generic editor can't drive it") is still accurate for the dashboard.
   `[verified: route.ts:84-91,100-109]`
2. **`.env.example` is stale** — it lists only `estm-enquiry | estm-submission`
   as entity values; eight are valid (`data/config.ts:12-21`).
3. **`EsimPages.readClaimRecords()` still reads labels with `innerText`**
   (`EsimPages.ts:215`), which returns the CSS-uppercased text ("CLAIMS TYPE
   (ICAP CODE)"). Writing that read straight back through
   `addClaimRecords()` fails with "No claim-record field labelled …". The
   JomCheck suite's copy was fixed to `textContent` after every restore failed
   on 2026-10-01 (`EsimJomCheckPage.ts:136-139`); the generic suite was not.
   `[verified: both files, 2026-10-16]`
4. **Chassis-only records are unreachable by automation.** Both page objects
   match on `td:nth(1)` = Vn Start With. A JomCheck Report row with blank Vn
   and only `Cn Start With` set (e.g. Report row 14, `Cn: HF`) cannot be opened
   by either. Set the VN prefix on such a record first, or edit by hand.
5. **`Vn Start With` is a rename, not a search.** Typing into it in the
   dashboard renames the shared prefix for everyone.
6. **Deleting is one `confirm()` click.** Nothing in the repo deletes; do not
   add it.

## SSM — seeding a company for UCD onboarding (verified 2026-10-21)

Onboarding's SSM check (`/obs/preOnb/checkSSM.do`) reads eSIM, not the real
registry. A company needs **two rows**, created by hand in the eSIM screens:

1. **SSM Enquiry** (`/esim/ssm-enquiry-resp/new`): Response Code `004`, ROC = old
   BRN **without** the check letter (letter prefixes stay, e.g. `KT0307773`,
   `PG0380337`), New ROC = 12-digit BRN, Company Name, Item Type `C` (Sdn Bhd) /
   `B` (ROB) / `L` (LLP), Remark, Delay `0`, Check Digit = the letter (`P`).
   As soon as this row exists, `checkSSM.do` answers `registered:true` with
   `refNo` = `<ROC>-<check>`. Verified: row #278 → `{"refNo":"KT0307773-P",
   "newRefNo":"201203099294","referenceName":"UDIN ONBOARD TESTING SDN0001",
   "registered":true,"itemType":"C"}`.
2. **SSM ROC submission** (`/esim/ssm-roc-submission-resp/new`): Response Code
   `005`, same ROC / New ROC / Company Name / Check Digit, Backup Link, and XML in
   Page 1 (company: `<NAME>`, `<REF_NO>{roc}-{check}</REF_NO>`, `<NEW_REF_NO>`,
   `<ROC_STATUS>EXISTING</ROC_STATUS>`, addresses), Page 2 (share capital), Page 3
   (`<DIRECTORS>`, IC dashed `030217-14-1005`), Page 4 (`<SHAREHOLDERS>`), Page 5
   (`<CHARGES>`), Page 6 (`<FINANCIAL>`). Copy Pages 2/5/6 verbatim from an
   existing good row (template used: #3, Azila's CH2, remark "AZILA - DO NOT
   CHANGE" — read only). This row feeds the SSM document eAuto buys after the
   pre-application payment (directors pre-fill the application form).
   Example: row #173, 1 director `DOOMFIST DIRECTOR A`.
3. ROB / LLP submission screens (`/esim/ssm-rob-submission-resp`,
   `/esim/ssm-llp-submission-resp`) not yet used by hand; Azila's
   `ssm-seed.ts` documents ROB `businessInfo` / `currentOwnerInfo` and LLP
   `involvements` tags.

The list page's "Search records…" box filters only the rows already loaded in
the page, but every list page loads **all** rows (client-side pager), so the
search does cover the whole table. `[verified: ssm-enquiry-resp-list.html, 152
rows in one page, 2026-10-21]`

Naming convention for Faizuddin's test companies: `UDIN ONBOARD TESTING
<TYPE><NNNN>` (`SDN0001`, `SOLEPROP0001`, `LLP0001`, `SABAH0001`, `SARAWAK0001`),
directors named after game characters ("DOOMFIST DIRECTOR A"), director IC
`030217141005`. `[from Faizuddin, 2026-10-21]`

### eSIM SSM screens are server-rendered forms, not a REST API (2026-10-21)

The `new` / `edit` screens post `form[action="/esim/ssm-…-resp/save"]`; list rows carry
`td.col-id` plus `a[href="/esim/<entity>/<id>/edit"]`. Azila's 12341 `EsimClient`
assumes a JHipster `/esim/api/...` REST API and says itself it was never verified — the
12153 suite (`scripts/eauto-12153/pages/EsimSsmPage.ts`) drives the forms instead.
Submission field names: `responseCode roc newRoc companyName backupLink page1..page6 remark
delayMiliSeconds checkDigit` (ROC). ROB / LLP field names are assumed to be Azila's column
names (`businessInfo currentOwnerInfo previousOwnerInfo` / `basicProfile regOfficeAdd
regBizAddresses bizCodes involvements`); the suite copies every field of the donor form by
name, so it does not depend on them. `[unconfirmed for ROB/LLP]`

⚠ The capture `ssm-roc-submission-resp-new.html` stops inside the form after Backup Link
although its header says "Trimmed: nothing". The page1..page6, remark, delay and
check-digit fields and the Save button are missing from the file. Recapture it
(`ssm-enquiry-resp-new.html` is complete). `[verified: file contents, 2026-10-21]`

## Never overwrite another tester's SSM rows (2026-10-22)

Faizuddin, 2026-10-22, asked whether the onboarding automation edits other people's SSM details, then chose "only overwrite our own rows". Applies to `scripts/eauto-12153`, `scripts/eauto-12257` and `scripts/eauto-preapp` (`EsimSsmPage.foreignRow`).

1. **Matching rows:** before seeding, every SSM Enquiry and ROC/ROB/LLP submission row matching the company (same ROC **or** same New ROC) is opened read-only (no Save).
2. **Reuse rule:** a matching row is reused (overwritten) only when its remark starts with "UDIN QA". Our runs write "UDIN QA EAINT-<ticket> <TS>" or "UDIN QA Create Pre-Application …".
3. **Someone else's row:** the run leaves it untouched and takes the next free company of the same type from the dashboard's company Excel (`*_COMPANY_ALTERNATES`, up to 5). It prints `COMPANY-SKIP {…}` / `COMPANY-USED {…}` lines, and the dashboard marks those companies used.
4. **Donor row:** the donor row a submission is cloned from is only ever read.

### Sidebar group opens itself after load — don't toggle early (2026-10-22)

On a list page, the eSIM sidebar opens the current page's group (e.g. SSM on the ROC list) a moment after the page loads. 12257_TS1 checked the "SSM Enquiry" link before that, saw it hidden, clicked the "SSM" heading, and closed the group the page was opening; the click then timed out. `openList()` in the onboarding suites now waits for load, then up to 3 s for the link, and clicks the heading only while the link is still hidden (up to 3 tries). `[verified: 12257_TS1 trace + screenshot, 2026-10-22; fix unrun]`

### List rows fill in after the table appears — wait for #recordCount (2026-10-22)

12257_TS2 read the SSM ROC list right after `table tbody` appeared and got 2 of 125 rows; donor #3 was missing, so seeding stopped ("No donor row to copy"). `openList()` in the onboarding suites now waits for the URL path, then until the `table tbody tr` count reaches `#recordCount` (header "N records"); without that element, until the count holds for 1.5 s. 60 s limit, then a clear error. `[verified: 12257_TS2 trace, 2026-10-22; fix unrun]`


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- Instances /eauto/, /uat1/ and /sit2/ share one database; /preprod1/ has its own. [azfar: knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires]
- SSM, Insurance, Insurance Cancellation and JomCheck run on eSIM or the real API depending on the instance; dev switches it. [azfar: knowledge/_core/environments.md]
- Unpaid draft cleanup: Dereg drafts expire (about 50 minutes, 2026-10-21); BMK drafts auto-cancelled; Interstate UCD to UCD expires at 48 hours; STMS/eSTM Pending, APT, Insurance Pending Payment and JomCheck Pending survive the night. [azfar: knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires]
- [unconfirmed] Fiuu sandbox: QA said it cannot take more than RM1,000, but two RM1,500 FPX payments were PAID on 2026-09-23. [azfar: knowledge/cross-portal/onboarding payment rules]

## LLP submission row `involvements` (confirmed 2026-10-23)

Source: eSIM `/esim/ssm-llp-submission-resp` row #2 ("AZ YC GROUP PLT", ROC `LLP0031001-LGN`, New ROC `202204000729`, Check Digit blank, 13 fields), read by 12153_TS04 (trace, 2026-10-23). Read only — not ours.

1. One `<involvement id='N'>…</involvement>` per person. Tags: `<involveType>` (`CO` = COMPLIANCE OFFICER, `PT` = PARTNER), `<involveTypeDesc>`, `<involveName>`, `<involveIdType>01</involveIdType>` (`NRIC`), `<involveId>` (12 plain digits), `<involveEffectiveFromDt>`, `<entityNo>` (the PT block carries the LLP number), `<address>…</address>`.
2. Row #2 has the same person as CO and PT.
3. The LLP number keeps its `-LGN` suffix as the ROC, with no check digit; the New ROC's digits 5–6 are `04`.
4. Automation: `cloneLlpPeople()` in `utils/ssmXml.ts` (12153, 12257, preapp) repeats the first PT block per person, keeps the CO block with the first person, renumbers the ids. `rebrand()` swaps the donor's LLP number in `<entityNo>`. The earlier guessed IC tags (`IC_NEW`/`NEW_IC`/`IC`/`ID_NO`/`IDNO`) were wrong — 12153_TS04 failed on them.
