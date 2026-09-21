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

Raw HTML lives in `_reference/` rather than here because this file is meant to be
read whole at the start of a task — see
[`_reference/html/README.md`](../_reference/html/README.md) for the convention.

## Three things that will waste your time first

1. **VPN only.** `172.30.202.114` is unreachable off the VPN, and the failure is
   a connection timeout — which reads like a broken selector, not a network
   problem. The dashboard page gates every run behind an explicit "Confirmed VPN
   Connected" step for exactly this reason.
2. **HTTPS on a bare IP**, so the certificate can never match a hostname.
   Playwright needs `ignoreHTTPSErrors: true` or every navigation fails at TLS.
3. **The URL is fixed.** eSIM is one shared instance — there is no `uat4`/`sit3`
   equivalent. Never add an environment picker for it.

## Everything is keyed by vehicle-number PREFIX

The organising idea of the whole simulator: each entity table holds rows keyed by
**`Vn Start With`** — a 2–3 character prefix like `HX`, `M1`, `1AE`. A request
for vehicle `HX1234` gets the row whose prefix is `HX`.

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
| Jomcheck | Enquiry, Report |
| SSM | Enquiry, ROB, ROC, LLP |
| Payments | BoldPay Responses (keyed by vehicle reg prefix) |
| OTH | Enquiry, Submission |

**Insurance API** and **Insurance Quotation** are the obvious next ones to map
for EAINT-11864 and insurance work generally.

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

## Reused for EAINT-11864 TS06

`scripts/eauto-quotation-reminder/utils/esim.ts` spawns this suite exactly the
way the dashboard route does (`npx playwright test --project=esim`, same env
vars, same `RESULT:` parsing) to set the Response Code for TS06's 69E case —
**this suite itself is untouched.** `[from Faizuddin, 2026-08-18]`

- Prefix = the vehicle number's **first 2 characters** (`vehiclePrefix()`).
- Sets `Response Code` to `VEL000069E` before the eSTM flow runs, and always
  restores it to `GLB000000I` afterwards in a `finally` — this is a shared
  instance, so a run that dies partway through must not leave the prefix
  poisoned for whoever tests it next.
