# Flow: Association Payment Listing (BackOffice)

`[from ticket EAINT-12028 — mockup HTML only, association-payment-listing-mockup_20260731.html, _reference/tickets/EAINT-12028/. NOT a live system yet — ticket is still Ready For Development. Every DOM handle below is the MOCKUP's own id/class, offered as the closest available reference; real build ids may differ once shipped and must be re-confirmed with a live capture at that point.]`

## Flow + roles artifact (browser reference)

Published diagram combining the flow (steps 1–8, entry through PDF) with the login-ID → role
mapping, for quick reference while working this ticket:
**https://claude.ai/code/artifact/7f84d14c-d908-4cb0-b045-a4ec86d8ab93**

Source: `_reference/tickets/EAINT-12028/EAINT-12028-flow-and-roles-artifact.html`. **To update**:
edit that source file, then republish with the Artifact tool passing the same `file_path` (or the
URL above via `url` from a fresh session) — this keeps the same link rather than creating a new
one. Update it whenever the flow/role facts below change (environment confirmed, MR !1 merged,
KIV/reject behaviour re-confirmed against a real build, etc.) so the published page doesn't drift
from this document.

## Why this flow matters

Brand-new BackOffice module, no prior version to compare against. This is the
first written record of its structure — the SRD (`lib/ticketStudies.ts`, key
`EAINT-12028`) states the business rules; this file records the concrete
pages, DOM, and branching the mockup demonstrates so the eventual automation
doesn't start from a blank page.

## Entry points

- **Verified (mockup)**: BackOffice Home → Reports menu → "Association
  Payment Listing" (new item, bold, green "NEW" badge) → Summary page.
- No other entry point is shown or implied anywhere (no direct deep-link from
  a transaction listing, no email/notification trigger).

## Page map

Three pages, one `id="page"` div each, shown/hidden via a `.page.active`
class toggle (`show(id)` in the mockup — a single-page app, not real page
navigations. **Unconfirmed whether the real build is also SPA-style or does
full page loads** — flag this before writing a Playwright waiter around it.)

| Page | `id` | Reached via |
|---|---|---|
| BackOffice Home | `#home` | default |
| Summary | `#summary` | `showSummary()` |
| Details (one month) | `#details` | `showDetails(m)` from a Summary row's View link |

Breadcrumb on both Summary and Details: `Home › Reports › Association Payment
Listing` (Details appends `› <Month> <Year>`).

## Summary page — DOM and behaviour

- Filters bar: `#sel-year` (year `<select>`, mockup only has 2026 hardcoded —
  SRD REQ-002 says years from 2026 onward), `#sel-role` (**mockup-only** role
  switcher explicitly labelled "mockup display only — real system determines
  role by login ID" — do not expect this dropdown in the real build), Search
  button (`applySearch()`).
- Summary table `#tbl-summary`, columns in order: `#`, Month, Car
  Transactions, Cars (RM), Motorcycle Transactions, Motorcycles (RM), Drafter
  Status, Reviewer Status, Approver Status, Payment Date, Action (View link,
  `<a class='view' onclick='showDetails(m)'>View »</a>`).
- Footer row label switches between **"YEAR TO DATE (Jan–Jun)"** (partial
  year) and **"FULL YEAR TOTAL"** (all 12 months have data) — not mentioned in
  the SRD at all. Worth a test case: confirm the label is correct for
  whichever year/month-count is live.
- A month with no data yet shows "No data" **only in the Drafter Status
  cell**; every other cell in that row (transaction counts, amounts, other
  status columns, payment date, action) shows a plain `-`. SRD REQ-004 just
  says "months with no data show 'No data'" without specifying which cell —
  the mockup's placement is a concrete UI detail to check against once built.
- Status pills: `pill2 pending|approved|kiv|review` — grey/green/amber/red.
  Class map: `Pending→pending, Approved→approved, KIV→kiv, Review Again→review`.

## Details page — DOM and behaviour

Two `.wf-bar` divs stacked: `#wf-bar` (role tag, 3 status pills, Finance
Payment Date tag if set, action buttons, contextual note) and `#inv-bar`
(payment-request download buttons or a pending note).

- **Vehicle Breakdown by State** table `#tbl-veh` — header literally reads
  "PEN & E. MALAYSIA" for the state column (not "State"). Columns: `#`,
  state, Car Transactions, Cars (RM), Motorcycle Transactions, Motorcycles
  (RM). 16 rows + a TOTAL footer row.
  - **State display order in the mockup is NOT the SRD's numeric 01–16
    order** — it's roughly alphabetical (Johor, Kedah, Kelantan, Melaka,
    Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak,
    Selangor, Terengganu, KL, Labuan, Putrajaya), even though each state's
    own parenthetical code (01–16) matches the SRD. **Unconfirmed which
    order the real build uses** — don't assume alphabetical when writing a
    row-order assertion; check the live page first.
  - Amount formula confirmed matching SRD: Cars (RM) = car transaction count
    × RM1 (FMC rate); Motorcycles (RM) = motorcycle count × RM2 (MMSDA rate).
  - Footnote in the mockup: "Motorcycle figures are sample/placeholder data
    for layout illustration only" — the mockup's own bike numbers are not
    meaningful test-expectation data, just layout filler.
- **Audit Log** table `#tbl-log` — columns `#`, Date/Time, Role, Action/
  Status, Remarks. Empty state: "No activity yet." Matches SRD REQ-015.

## Workflow decision points (mockup logic — matches SRD REQ-009–012, adds detail SRD doesn't)

Role for the session comes from `curRole` (in the real system, from login
ID per SRD REQ-003 — the mockup's role dropdown is a stand-in for that).

- **Drafter** can act (Approve or KIV) whenever `drafter` status is
  `Pending`, `Review Again`, **or `KIV`** — i.e. clicking KIV does NOT lock
  the Drafter out. The Drafter can KIV repeatedly or flip to Approve at will;
  KIV never blocks re-attempting. This answers the open question from the
  initial ticket study ("what happens after Drafter clicks KIV") — **mockup
  behaviour only, not SRD-stated, re-confirm once live.**
- **Reviewer** can act only when `drafter === 'Approved'` AND reviewer status
  is `Pending` or `Review Again`. Reject requires mandatory remarks
  (`askReject()` blocks submit with an empty textarea) and sets
  `reviewer='Pending'`, `drafter='Review Again'` — sends it back one full
  step, matching SRD REQ-011.
- **Approver** can act only when `reviewer === 'Approved'` AND approver
  status is `Pending` or `Review Again`. Reject sets `approver='Pending'`,
  `reviewer='Review Again'` — matches SRD REQ-012. Approve triggers the
  Finance Payment Date modal before finalising.
- Disabled buttons carry a contextual note explaining why (e.g. "Waiting for
  the Drafter to approve first.", "Drafter has already approved this month.
  Waiting for the Reviewer.") — good candidate text for a "waiting note"
  assertion once built, though exact wording may change.

## Modals

| Modal | `id` | Trigger | Key behaviour |
|---|---|---|---|
| Reject remarks | `#rmk-modal` | Reviewer/Approver Reject | `#rmk-text` textarea; submit blocked with `alert('Remarks are required to reject.')` if empty |
| Finance payment date | `#date-modal` | Approver Approve (after signature) | `#pay-date` (`type=date`), `onkeydown="return false"` + `onpaste="return false"` block manual entry; `min` set to tomorrow; submit re-validates `date <= today → alert('Payment date must be a future date.')` — matches SRD REQ-013 exactly, including the date-picker-only restriction |
| Signature | `#sig-modal` | First-ever approval by a role | `#sig-pad` `<canvas>`, mouse+touch drawing; `signatures[role]` stored client-side and silently reused on every later approval by that role — modal never reappears once signed once, matches SRD REQ-014 |

Approve sequence for Drafter/Reviewer/Approver is always
`ensureSignature(role, callback)` first (signs once, then runs callback) —
Reviewer/Drafter don't get the payment-date step; only Approver's callback
also calls `askDate()` before finalising.

## Payment Request generation

- Only rendered once `isFullyApproved(m)` (`drafter && reviewer && approver`
  all `'Approved'`) — before that, `#inv-bar` shows only the pending note
  from SRD REQ-016 verbatim.
- **Download is not role-restricted.** REQ-016 gates the buttons on the
  month's approval state only, never on who's logged in. The mockup's own
  source comment confirms the intent: `// Invoice bar - shown for ALL roles
  on details; downloadable once fully approved` (line ~508). So Drafter,
  Reviewer and Approver can all see and download both PDFs once the month
  is fully approved — nothing limits it to just the Approver. [confirmed:
  mockup source comment + SRD REQ-016 silence, 2026-09-14 — re-check once
  the real build is reachable, this is inferred from a mockup, not a
  standalone SRD line.]
- Two buttons: "FMC Payment Request" (`downloadInvoice(m,'Cars')`), "MMSDA
  Payment Request" (`downloadInvoice(m,'Motorcycles')`).
- Filename: `Payment Requisition_<FMC|MMSDA>_<Month> <Year>.pdf` — matches
  SRD REQ-016's example exactly. **Note: the mockup actually generates an
  HTML file with a `.pdf` extension (a `Blob` of type `text/html`), not a
  real PDF** — purely a mockup shortcut; the real system must generate an
  actual PDF.
- Generated document layout matches SRD REQ-017/018/019's field mapping
  closely, EXCEPT: **the mockup's own "Pay to" table renders every value cell
  empty** (Account Holder Name, Address, Bank Name, Bank Account No., Person
  in charge, Contact Number, Email Address are all blank `<td></td>`) — the
  SRD's fixed values for these fields (e.g. FMC's Alliance Bank a/c
  1404-6001-0016-661) are NOT reproduced in the mockup's generated document.
  Treat the SRD field-mapping tables as authoritative for these fixed values,
  not the mockup's generated file.
- **Role → real name mapping, confirmed via the mockup's hardcoded
  "Prepared/Checked/Approved by" names** (useful alongside SRD REQ-003's
  username mapping):
  - Drafter → "Muhammad Fared" (username `mfared` per SRD)
  - Reviewer → "Nurul Saadiah" (username `eautonurul` per SRD)
  - Approver → "Chia Ket Ming" (username `kmcheah` per SRD)
  - `eautozara` and `mfizni` (the other mapped usernames) have no real name
    shown anywhere in the mockup — still unconfirmed.
- "Requestor" and "Date" fields in the mockup are populated from the
  Approver's own approval date / a hardcoded name, not dynamically from
  whichever Drafter actually approved — **mockup shortcut only**; SRD
  REQ-018/019 clearly state Requestor = "full name of the Drafter who
  approved" (a real per-month value), so don't take the mockup's hardcoding
  as the intended real behaviour.

## Preconditions and test data

- Nothing exists yet — no environment assigned (see
  `_reference/tickets/EAINT-12028/Session-Handoff-2026-09-02-12028.md`).
- Seed/sample data in the mockup (2026 Jan–Jun, various workflow states; 2025
  full year, all fully approved) is illustrative only — not real transaction
  counts, and Motorcycle figures are explicitly flagged placeholder.

## Traps (mockup-derived, re-confirm once live)

- The "Role" selector on Summary is **mockup-only** — don't expect it in the
  real page; role there comes from the logged-in account. Building automation
  against multiple roles means logging in as different mapped users, not
  switching a dropdown.
- State breakdown row order may not match the SRD's numeric 01–16 sequence —
  verify the real order before hardcoding row-position assertions.
- The generated "PDF" is an HTML blob in the mockup; don't assume the real
  file will render/parse the same way a true PDF would.
- Footer total-row label changes wording depending on whether all 12 months
  have data — a naive assertion on one fixed label text will break depending
  on which month range is being viewed.

## QA Test Guide (dev-authored, from MR !1's engineering review)

`[source: dev/engineering-authored QA test guide, artifact shared 2026-09-04, saved verbatim at
_reference/tickets/EAINT-12028/EAINT-12028-artifact-qa-test-guide-from-dev.html — built from SRD
v1.1 plus a 2026-09-04 engineering review of eauto-backoffice MR !1 (dev/feat/EAINT-12028 -> main).
This is the first concrete evidence the module has actually been built past mockup stage — it
describes a real running app across 3 services, not the Reports-menu mockup above.]`

**As of 2026-09-04, this is NOT ready for staging.** MR !1 (129 files, +10,920, 40 commits) carries
a ⛔ BLOCK code-review verdict: 1 blocker, 2 high, 7 medium findings (13 more lower-severity items
deferred). A fix pass for all 10 blocking findings was actively in progress at capture time
(8 of 10 coded). Two of the ten are directly test-relevant and get their own security cases below:
**H1** (a role from one BackOffice module could authorize a different module's pages) and **H2**
(an open redirect on session-expiry/logout). Re-test both once the fix CR lands — don't trust a
pre-fix build's behaviour on them. Full deploy checklist (settings keys on all 3 core editions,
shared `X-API-KEY`, browser-resolvable base URLs, one-time DB migration, `eauto-cron`'s own
`dev/feat/EAINT-12028` branch merged) also needs to be confirmed done before this can go to staging.

**System shape** (new information — supersedes the mockup's "unconfirmed SPA vs full-page" question
for the real build): three services, not one page. `eauto` core (entry point, hosts the Reports
menu) hands off via SSO to `eauto-backoffice` (renders Summary/Details — never log in there
directly, only ever arrive via the core menu link), and `eauto-cron` runs the month-close job.
Local dev ports: core `http://localhost:8080/eauto`, backoffice `http://localhost:8095/backoffice`
— **dev-box addresses, not a SIT/UAT/PREPROD URL**, so the open item "which environment is this
tested on" is still open; this only tells us the topology once an environment exists. Shared
dependencies: `eauto-mysql` (this module has no DB of its own) and `minio` (S3-compatible object
storage for signatures + PDFs).

**Test accounts, same mapping as the SRD, plus what to specifically exercise with each:**
- `eautozara`, `mfared` — Drafter: first-approval signature capture, KIV, Reject-back-to-Drafter
  re-entry.
- `eautonurul` — Reviewer: Approve / Reject-with-remarks.
- `kmcheah` — Approver: final approve + mandatory future payment date, PDF generation trigger.
- `mfizni` — all three roles: confirms **one signature is reused across all three signature blocks**
  on the generated PDF; also the fastest way to solo-walk a month through the whole workflow.
- Any user with **no** role row at all — negative case: the Reports menu link is still visible in
  core, but the module itself must 403. "Visibility ≠ authorization" is the guide's own framing.
- Signature is captured **per person, not per role** — plan test order so the pad appears exactly
  once per test user, across every month/role they touch.

**Test data is not live-computed — it comes from a month-close job.** Nothing shows on the listing
until a month is "closed": a scheduled job (or a manual trigger) freezes that month's approved
count × rate into a snapshot.
- Manual trigger for QA: `GET {eauto-cron}/eautocron/sys/manual/association-payment-month-close/{year}/{month}`
  — force-close any past month on demand instead of waiting for the real schedule.
- Machine path (what core/cron actually call): `POST /ext/association/{year}/{month}/close`
  (needs `X-API-KEY`).
- Real schedule: `eauto-cron`, 00:05 on the 1st of the month — don't wait for this in testing.
- Three states you'll see per month: **"–" not yet closed** (no snapshot, no figures, no actions);
  **"0.00" closed, no data** (closed but zero qualifying transactions — confirm workflow buttons
  still work here, don't assume zero means broken); **real figures, closed** (the main path).
- What counts toward a month's figures: approved **+ paid** STMS/eSTM/APT transactions, by
  **JPJ Approved Date** (matches the SRD decision already recorded above), grouped by the
  **dealer's registered state** (not the vehicle's plate state — new detail, not in the SRD
  excerpt studied earlier), split `CAR`+`COMM_CAR` (RM1.00 each) and `BIKE`+`COMM_BIKE` (RM2.00
  each).

**Test cases are organized 1:1 against REQ-001 through REQ-019**, each tagged P1 (core happy-path/
gate, must pass before sign-off), P2 (important edge case), or P3 (nice-to-confirm). P1s: REQ-003
(role from login ID, including a no-role user hitting the Details URL directly → 403), REQ-004
(monthly figures cross-checked against core's own Transaction Summary Report by State — a concrete
independent source to verify against, not just eyeballing), REQ-008 (16 states + TOTAL, exact
`#,##0.00` formatting), REQ-009 (sequential approval enforced **server-side**, not just
UI-disabled — try forcing the underlying request directly), REQ-013 (future-only, picker-only date;
explicitly test typed/pasted input has no effect), REQ-014 (signature shown once, silently reused
after), REQ-016 (download gated on full approval, including a direct-URL-bypass attempt → 403),
REQ-017/018/019 combined (file naming, every fixed/flexible field on both FMC and MMSDA documents,
and that a second download returns the identical archived file rather than a fresh re-render).
Full step-by-step for every REQ-ID is in the saved HTML.

**Security & session checks — not in the SRD (it's a functional spec) but flagged as
account-takeover-class, so first-class test cases:** replay a used SSO hand-off URL (expect 401
"Token already used" on reuse, never a second login); cross-app logout propagation both directions
(core logout must invalidate a live BackOffice tab; BackOffice logout must land back on core and
require a fresh hand-off); idle-timeout bounce (clean re-auth, no dead-end error page); a no-role
user's hand-off succeeding but the module 403ing; **H1** cross-module role confusion (re-test once
the fix lands — not independently reproducible with only one module live today); **H2** open
redirect on session-expiry/logout (must always land on a trusted core origin); concurrent
double-submit from two tabs as the same approving user (expect 409 on the second submit, only one
audit-log row created).

**Cross-cutting checks beyond the SRD's happy path:** month-close idempotency (close once → 200
CLOSED; close again → 200 SKIPPED_ALREADY_CLOSED with the DB row unchanged; close a not-yet-fully-
approved month → 409 SKIPPED_NOT_APPROVED, never a silent no-op or 500); storage sanity to confirm
with a dev (signature stored once per user, referenced by object key, never re-drawn; downloaded
PDFs byte-identical on repeat download — served from the archive, not re-rendered); out-of-role/
out-of-sequence actions always 403 or rejected, never a silent success, including on an
already-fully-approved (terminal) month; numbers cross-checked against core's own report as the
independent source of truth.

**Known limitations — already accepted, don't file fresh reports on these:** JomCheck (Phase 1
scope, already known); no real money movement (Finance handles disbursement outside this module,
already known); vendor bank details not editable here (already known); **a KIV'd month has no
"un-KIV" button** — same open question raised from the mockup study, now confirmed as a real known
gap (deferred item L2) needing a business decision, not a code fix; the app must run as a single
instance (in-memory session replay-guard/registry — an ops/deployment concern, not something QA
can exercise from the UI); an S3 region mismatch in the guide author's own personal test
environment (not relevant once a real environment exists); `eauto-cron`'s own
`dev/feat/EAINT-12028` branch not yet merged — if the manual month-close endpoint 404s, this is
almost certainly why.

**Bug reports should reference:** the exact REQ-ID/case or security-case name, the test user/role
logged in as, the month under test, expected vs. actual, and any console/network output — several
flows return meaningful HTTP status codes (401/403/409) worth attaching directly.

## Priority / scope discussion (source: Teams, May Chin Mei Theng ↔ Faizuddin DM, 2026-09-15/16)

- **This ticket has been deprioritized behind EAINT-12107 and a batch of four
  small "shopping cart" tickets.** May Chin's stated priority order (based on
  deployment date): 1) four shopping cart tickets deploying 21 Sept (EAINT-
  11996, 12095, 12103, 12104), 2) EAINT-12107 — TBC deployment in September,
  3) **EAINT-12028 — TBC deployment in October** `(source: Teams, May Chin Mei
  Theng, DM, 2026-09-15 09:33)`. This corrects the impression from the
  2026-09-14 session handoff that 12028 was moving toward active testing
  soon — it is now the lowest priority of the three, October at the earliest.
- **May Chin flagged a scope concern**, prompted by Faizuddin's own timesheet
  entry mentioning "20+ TS" for this ticket: *"im abit worried 12028 coz i
  doubt the scope is that small"* `(source: Teams, May Chin Mei Theng, DM,
  2026-09-15 09:30)`. Faizuddin's response, worth recording as his own
  working assessment rather than a confirmed fact: the flow itself "is not
  that long and complicated," the size comes from "multiple statuses for
  different items, so the combination is a lot" — i.e. the 20+ test-scenario
  count reflects the workflow-state combinatorics (Drafter/Reviewer/Approver
  × KIV/Reject/Approve, etc.), not scope creep beyond the SRD.
- As of 2026-09-15, **test scenarios for this ticket were still not done**;
  Faizuddin was "mapping out all the possible flows/branches" before drafting
  them, and had a Miro board already set up (from May Chin) to work from
  `(source: Teams, Faizuddin, DM to May Chin Mei Theng, 2026-09-15 09:35-
  09:37)`.
- No further discussion in the dedicated "EAINT-12028 [eAuto-BackOffice]..."
  group chat since 04/09 (reconfirmed live 2026-09-18) — this priority/scope
  exchange happened only in the May Chin DM, not the ticket's own group chat.

## ⚠️ UPDATE 2026-09-18 — deployment now being asked about same-day, not October

`(source: Teams, dedicated "EAINT-12028 [eAuto-BackOffice] New Module..."
group chat, 2026-09-18)` — the dedicated group chat, quiet since 04/09, had
one new exchange this morning that appears to move the timeline up from the
"TBC deployment in October" priority note above:

- **Mei Jia Chee, 18/09/2026 11:07**: *"hiii Nur Izfarwiza Binti Mohd Talib
  Jin Siang Boo, can help to advise this ticket can proceed morning
  deployment?"*
- **Jin Siang Boo, 18/09/2026 11:31**: *"I think should be ok"*

This is a tentative go-ahead, not a firm confirmation, and it's unclear from
the message alone whether "morning deployment" means this module is going to
a shared SIT/staging environment today or something narrower (e.g. a dev-box
push). It directly contradicts the 2026-09-15 "TBC deployment in October"
estimate from May Chin recorded above — **treat the October estimate as
possibly stale, not the current plan**, and chase a firm environment/date
confirmation before assuming this ticket is still low-priority/October-only.
The generic "eAuto Deployment Notification" Teams channel showed a
`staging/sit4` deploy succeeding around the same time window but didn't name
EAINT-12028 specifically, so this is not yet independently corroborated as
*this* ticket's deploy — flag as the next thing to verify, not an established
fact.

## What is NOT covered

- No BackOffice login/session DOM captured (the mockup starts already
  logged in as "Adrian Tan" — a demo name, not a real mapped role user; the
  QA test guide above describes the real SSO hand-off flow but no live HTML
  of it has been captured yet either).
- Still no SIT/UAT/PREPROD environment/URL — the QA test guide's URLs are a
  dev box (localhost), not a shared testing environment. This open item is
  unchanged.
- JomCheck payment listing/request — out of scope for Phase 1 entirely, not
  shown in the mockup or the QA test guide.
- Nothing about how Finance actually receives/uses the downloaded PDF
  (explicitly out-of-scope per the SRD).
- MR !1's actual code/diff was not reviewed in this session — only the
  QA test guide's own summary of the engineering review. If deeper detail
  on the 10 blocking findings is needed, ask for the review itself.
