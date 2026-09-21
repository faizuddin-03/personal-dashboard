# Flow: Biometric Device Purchase — Serial Capture & Delivery Order (BackOffice)

`[from tickets EAINT-12167 and EAINT-12166 — SRD study + Teams CR-group chat history, both read live 2026-09-18. Neither ticket has a live/staging build confirmed reachable yet (Jira status: Code Review on both as of 2026-09-17); this file is SRD+Teams-derived, not yet checked against a running app.]`

## Why this flow matters

Two tickets, one dependency chain, both owned by Faizuddin ("spearhead both
going forward", 2026-09-15 session). **EAINT-12167** adds Device Serial No.
capture to the existing "Update Shipping Details" popup on a Device Purchase
Service Request. **EAINT-12166** adds a one-click DO-generation button that
prints those serial numbers onto a Delivery Order PDF. 12166 cannot be
meaningfully tested without 12167's serial data existing first.

## EAINT-12167 — Device SN input on the Service Request Details page

`[verified: full 22-page SRD v1.2 read directly, 2026-09-18 — REQ IDs below are
the SRD's own, superseding the earlier summarized read this file used to cite]`

**Two separate surfaces get the two new fields, not one — don't conflate them:**

1. **Service Request Details page, Shipping Details section** — the SRD's
   "Affected Pages" (§2.2.3) names THIS as where "Number of Device" and
   "Device Serial No." are added, "positioned under Consignment Number"
   (REQ-001). This is the static page — the one captured live in
   `EAINT-12167-backoffice-01-sr-details-uat1.html` (pre-change baseline,
   uat1, 2026-09-18) — not a popup.
2. **The "Update Shipping Details" pop-up** — REQ-010 separately states the
   *Device Serial No.* field **group** displays here (numbered sequentially,
   2-per-row, scrollable). REQ-010 does not itself say Number of Device is
   also shown in the pop-up — that's inferred from REQ-006's example
   ("...displayed and editable when the BO user updates the shipping
   details"), not independently stated. Treat as likely but not
   SRD-explicit.

**Number of Device (REQ-001/002)** — auto-filled, disabled, mandatory
(meaning the system must never leave it blank — there's nothing for a user to
type). No longer a 1–10 dropdown (that design was struck out in v1.1).
**Critical v1.2 clarification, easy to miss:** its value is the **total
quantity for the whole transaction, not the quantity on this one device
record** — REQ-001's own acceptance criteria states this explicitly. The
live-captured baseline page already shows a *different*, pre-existing field
with a similar-sounding value — `Purchase Device: 1 unit(s)` — which is NOT
the same field and may show a different number once a multi-device
transaction is involved.

**Device Serial No. (REQ-003/004/005/010)** — one box per unit, count always
equals Number of Device (i.e. the transaction total, uncapped in this SRD —
see the "three different numbers" note below), 8–12 chars alphanumeric +
spaces, mandatory, special characters auto-stripped as typed (not rejected),
12 chars is a hard input stop, under 8 on save blocks with "Device Serial No.
must be between 8 and 12 characters." Two-per-row, scrollable pop-up group
per REQ-010.

**Listing display (REQ-011, v1.2) is the OPPOSITE of the Details page:** the
Biometric Device Purchase & Software Installation Listing shows one row per
device, and on THAT page Number of Device always displays as `1` with just
that row's own single serial — never the transaction total. REQ-011's own
worked example: a 10-unit transaction → Listing shows 10 rows (each `1` +
own serial) → **the Service Request Details page shows all 10 serials**
(transaction-wide), for every one of those 10 records. Same field name,
opposite scope, depending which page you're reading it on — a genuine QA
trap if you assert the wrong expected value on the wrong page.

**Open structural question — not resolved by any source, needs dev
confirmation before writing a definitive test case for multi-device orders:**
the Jira dev comment (zhan.choon, 2026-08-12) describes ONE shared shipping
update covering an entire multi-device purchase — *"Ops keys in all the
serial numbers in one go... because the delivery details are shared by the
whole request — one update covers all the devices in it."* But the
live-captured baseline page shows each device as its **own independent**
Service Request (`SR69001385`) with its **own** Delivery Status/Date/
Consignment Number/"Update Shipping Details" button — and REQ-011 itself
says "each device purchased in the same transaction has its own record."
Those two don't obviously reconcile: if 10 devices really are 10 separate SR
records each with independently-trackable shipping (consistent with "each
parcel ships max 10 devices" possibly meaning different parcels/dates per
record), then "one update covers all 10" contradicts each SR having its own
independent shipping fields — unless there's a shared parent record driving
all 10 that isn't visible in this single-device capture. The one live page
we have is a 1-unit purchase, so it can't disambiguate either way. **Get a
live capture of an actual multi-device transaction's SR Details pages before
trusting either reading**, and chase this directly with Lim Yi Link/dev.

**Three different numbers get thrown around for this ticket — don't
conflate them:**
- The SRD's now-dead **1–10 dropdown** (removed in v1.1, replaced by
  auto-fill with no stated ceiling in 12167's own SRD).
- The SRD's own **illustrative "10 devices" example** in REQ-011 — just an
  example number, not a rule.
- The real **40-unit order cap** — this belongs to **EAINT-12166's**
  REQ-007 (the UCD-side purchase-quantity cap), confirmed via Teams, **not**
  anything 12167's SRD states. 12167 only reads whatever quantity was
  purchased; it doesn't cap anything itself. See the EAINT-12166 section
  below for the actual source.

**Locked-SN-typo handling — RESOLVED, Option A.** Once Delivery Status moves
to Arranged, the SN fields lock and cannot be edited by anyone, including a
senior Hub Admin. A mistyped serial is fixed only by raising an IT support
ticket. `[from Teams EAINT-12167 chat, Yi Link Lim 17/08 10:47: "Fix by IT
support request. Confirmed with Ops that no one can edit the keyed SN"]` —
this settles the open question the 2026-09-15 handoff flagged as unresolved
(the SRD itself never states which of the two options was picked; the answer
only exists in this Teams thread, not in the SRD or the Jira comment thread).

**Duplicate-SN rejection** — a build rule (no two devices can share a serial,
since one physical device only ships once), asserted in the original dev
question but **never restated as a REQ/acceptance-criteria row anywhere in
the SRD body** `[from ticket EAINT-12167 comment, zhan.choon 2026-08-12]`.
Treat as intended behaviour to test, but confirm it's actually implemented
once a build is reachable — nothing in Teams or the SRD re-confirms it was
built as stated.

**Access restriction (REQ-009) — SRD writes it as a fresh access requirement
to build; "already a no-op" is only the dev's own unverified claim.** The
SRD's own wording is "Grant access to the new fields to all Hub Admin users,
except the accounts listed" — phrased as something to implement. The claim
that all 18 accounts are *already* excluded from "Update Shipping Details"
today, so nothing new needs building, comes only from zhan.choon's Jira
comment (2026-08-12) — asserted, not independently tested by QA. Don't take
it as settled; check the 18 accounts against real BO access once a build is
reachable, same as any other access-restriction case.

**Old requests** (already past "New" status before this ships) will simply
show a blank serial number — no retroactive backfill possible.

Chat has been quiet since **21 August 2026** (last message: a Figma design
link from Yi Link Lim to Wong Zhan Choon) — no further decisions or status
updates through the 2026-09-18 recheck. Jira comment thread (2026-08-12,
zhan.choon) mirrors this same Q&A but the ticket's Jira comments were never
updated with the resolution — **the resolution lives only in Teams, not in
Jira**, so don't rely on the Jira comment thread alone for this ticket.

## EAINT-12166 — Delivery Order (DO) generation

One-click "DO" button on the Device Purchase Transaction Details page,
auto-generates a Delivery Order PDF reusing the existing DO
template/format from Company Management. Depends on EAINT-12167's serial
data being present.

- **DO values are snapshotted at generation time, not re-derived on every
  view/download.** SRD v1.1 change: "Value in Delivery Order once generated
  then will use those information, not generate on the spot"
  `[from Teams EAINT-12166 chat, Mei Jia Chee 28/08 17:22]` — this is
  REQ-008's snapshot rule (edit company name/address/tel/recipient after
  generating, re-download the same DO, still shows the original values).
- **UCD Portal max unit set to 40** — matches EAINT-12167's order cap exactly
  `[from Teams EAINT-12166 chat, Mei Jia Chee 28/08 17:22, "To set the max
  unit of dermlaog as 40 units"]`. The two tickets' 40-unit ceilings are the
  same number by design, not a coincidence — confirm both are actually wired
  to the same limit once live, don't test them as independent boundaries.
- SRD v1.1 (28 Aug) confirmed OK by the requestor 2026-09-02
  `[from Teams EAINT-12166 chat, Mei Jia Chee 02/09 15:16]` — no v1.2 exists.
- Chat quiet since **2 September 2026** (last message: requestor sign-off on
  v1.1) — no further activity through the 2026-09-18 recheck.
- Ticket summary still mentions "Interim Document Upload Space" but the SRD
  dropped that from scope as of v0.4 (confirmed with the requestor earlier) —
  don't test it, don't be confused by the ticket title.

## Effort estimate and deployment timeline (source: Teams, May Chin Mei Theng ↔ Faizuddin DM, 2026-09-15/16 — a different channel than the dedicated 12166/12167 group chats cited above, which are still quiet since 21 Aug/2 Sept)

- **Combined effort estimate: 6 days including buffer** — Faizuddin proposed
  12166 = 3+2 = 5 days, 12167 = 1+1 = 2 days (12166 the larger of the two
  "since dev said its quite complicated"); May Chin noted this is against an
  original 4+2-day estimate `(source: Teams, Faizuddin/May Chin Mei Theng, DM,
  2026-09-15 17:37-17:43)`. This 6-day combined figure was later published in
  Faizuddin's own QA study-artifact digest and approved by May Chin on
  2026-09-17 10:01.
- **If the original 4+2 estimate had held, both tickets would have been ready
  for testing the morning of 18 Sept 2026** (today, at time of this sync) —
  May Chin's own words: *"if follow original estimation 4+2, by right should
  be ready for testing on 18th Sept morning"* `(source: Teams, May Chin Mei
  Theng, DM, 2026-09-15 17:43)`. Whether that actually held is unconfirmed —
  see status check below.
- **As of 2026-09-15 17:50**, Faizuddin's own status check: **EAINT-12167 —
  "Done dev and code review."** **EAINT-12166 — "not sure cus dev on AL
  [annual leave] until friday"** `(source: Teams, Faizuddin, DM to May Chin
  Mei Theng, 2026-09-15 17:50)`. This is a more specific/newer readiness
  signal than the dedicated-chat "ready for testing confirmed by dev 2026-08-
  20 (12167)" note above — 12167 looks genuinely closer to testable than
  12166, which was still blocked on a dev's leave as of 15 Sept.
- **Fallback deploy date if the dev doesn't get it ready for testing by 17
  Sept morning: 28 Sept morning** `(source: Teams, May Chin Mei Theng, DM,
  2026-09-15 17:43)` — matches the ticket's own Fix Version
  `S33.X-20260928` already on file, so this isn't a new date, just Teams
  confirming the same number is the real fallback, not just a Jira field.
- Testing environment is still not stated anywhere in this thread either —
  the "no environment confirmed" gap from the 2026-09-15 session handoff
  still stands.

## Status update — 2026-09-18 (source: Teams, eAuto QAs channel)

- **Both tickets have moved from "waiting on dev" into active TS-drafting.**
  Faizuddin's own daily to-do post: **EAINT-12166 — "To draft TS"**;
  **EAINT-12167 — "To continue draft TS"** `(source: Teams, Faizuddin, eAuto
  QAs channel, "Faizuddin - To Do Plan (18-09-2026 9.10 AM)", posted 09:33)`.
  This supersedes the "12166 not sure, dev on AL until Friday" status quoted
  above from 2026-09-15 — the AL blocker has evidently cleared and QA has
  started scripting both. No Jira status change or environment confirmation
  accompanies this — it's Faizuddin's own progress note, not a dev/requestor
  decision, so treat it as a readiness signal only, not a new fact about
  either ticket's behaviour.
- The two dedicated CR-group chats (cited throughout this file) were
  rechecked again at this sync and remain silent — 12167 still ends 21
  August (Figma link), 12166 still ends 2 September (requestor sign-off).
  No new decisions, scope changes, or answered questions turned up beyond
  what's already recorded above.

## Status update — 2026-09-18 (later same-day recheck), source: Teams, eAuto QAs channel

A second pass through the general **eAuto QAs** channel (not the two dedicated
CR-group chats, which remain quiet as recorded above) turned up two new
details, both from the day before this file's last sync:

- **EAINT-12166's 40-unit cap is dev-complete but not deployed anywhere yet.**
  Answering a *different* ticket's question (EAINT-11996, about digit limits
  on similar quantity fields — out of scope here except as the source of this
  detail), Faizuddin wrote: *"For BDP, the latest SRD - EAINT-12166 mentions
  it should have limit 40. Dev already made changes for this ticket, but
  since its tentatively planned for 28th of Sept, the changes are still not
  pushed yet"* `(source: Teams, Faizuddin, eAuto QAs channel, 2026-09-17
  17:04)`. This is new: it confirms the dev-on-AL blocker noted in the
  2026-09-15 handoff has cleared and the code itself is written — but also
  explains why no environment has ever been reachable for this ticket: the
  change isn't pushed to any environment yet, and isn't expected to be until
  the 28 Sept fallback date already on file. Don't read "dev already made
  changes" as "buildable/testable now" — it isn't, anywhere, yet.
- **EAINT-12167 TS drafting is further along than the bare "To continue draft
  TS" to-do line suggests.** Faizuddin's own EOD update the same day: *"EAINT-
  12167 ... Organized the possible scenarios (Estimated ~15TS); Started
  drafting TS"* `(source: Teams, Faizuddin, eAuto QAs channel, EOD Update
  17-09-2026 6.30 PM)`. EAINT-12166 stayed at "To draft TS" with no
  equivalent progress note. This is Faizuddin's own status, not a
  dev/requestor decision — a readiness signal only, same caveat as the
  09:33 to-do note above.
- The two dedicated CR-group chats were rechecked again and remain silent —
  no new content beyond what's already recorded in this file.

## Preconditions and test data

- **No testing environment confirmed anywhere** for either ticket — not in
  Jira fields, not in the SRDs, not in Teams. Still needs to be asked before
  execution can be scheduled.
- Jira status "Code Review" on both tickets, unchanged since before
  2026-09-10, despite Teams showing "ready for testing" confirmed by dev on
  2026-08-20 (12167) — a known status-reliability gap on this project; don't
  trust the `status` field alone to mean untestable.

## What is NOT covered

- **One live capture exists now**: `EAINT-12167-backoffice-01-sr-details-uat1.html`
  (uat1, 2026-09-18) — but it's the **pre-change baseline**, captured before
  12167/12166 have been pushed to staging. It gives real DOM for the
  existing Shipping Details table and the `#op-ship-dialog` popup, but shows
  none of the new fields yet, and can't resolve the one-record-vs-shared-
  record structural question above (it's a 1-unit purchase). No DO-generation
  page (12166) has been captured at all yet.
- The 17/08 (12167) and 19/08 (12166) Teams meeting recordings/recaps were
  not opened this session — only the chat text was read. If a decision seems
  to be missing from the chat text, the recap may hold it; not yet checked.
- 12166's exact DO field-to-source mapping (which fields come from Company
  Management vs. the transaction) was not traced in this session — only the
  snapshot-timing and max-unit facts above were confirmed via Teams.

## EAINT-12166 — DO-generation mockup vs SRD field mapping (session 2026-09-21)

`[from _reference/tickets/EAINT-12166/eAuto_BackOffice_Existing_Mockup_20260818.html`
`, a working client-side prototype (jsPDF PDF generator, not a static image),`
`cross-checked line-by-line against EAINT-12166_SRD_v1.1_20260828.pdf §2.2.4/`
`2.2.5, both read in full this session]`

The mockup renders an actual PDF client-side from a `TXN` sample-data object
(8 transactions: 1/2/3/5/10/20/25/40 units) and reproduces the DO layout in
detail — this is a genuinely useful reference for what the real PDF should
look like, not just a wireframe. Verified matches and gaps below.

**Verified exact matches (safe to treat as confirmed expected behaviour):**
- Split logic — blocks of 20, remainder on the final DO, serials numbered
  continuously across the split (`ZF ` + 8-digit zero-padded number) — matches
  REQ-003 precisely, including the worked 25-unit (20+5) and 40-unit (20+20)
  examples.
- Split annotation string is character-for-character `"Split order · N of M ·
  X units total"` — matches REQ-003's exact wording.
- Empty-appointment message is character-for-character `"No appointment has
  been selected yet — to be arranged with the UCD."` — matches field-mapping
  row 19 exactly.
- Device Warranty defaults to "1 year" (REQ-004) and Additional Remark Type is
  fixed "DEVICE PURCHASE" (row 9) — both match.
- DO button appears on Purchase-only and Purchase+Installation Transaction
  Details screens, and is correctly **absent** on the Installation-only
  screen — matches the Affected Pages scope (Device Purchase transactions
  only).

**Gaps/mismatches — mockup cannot be trusted as-is for these, verify against
the real build instead:**
1. **Company Name / Company Reg. No.** — SRD field-mapping table (§2.2.5)
   lists these as two separate DO fields (rows 2 and 3). The mockup combines
   them into a single row: `COMPANY NAME ( ROC )`. Don't assume the combined
   layout is final.
2. **Payment Ref. / Date wording** — SRD's sample value is literally `"REF
   <ref>, DATED <date>"` (row 10). The mockup just concatenates `<ref> ·
   <date>` with no "REF"/"DATED" words. If a TS asserts exact text here,
   confirm against the real build, not the mockup.
3. **"Issued by — Name"** is hardcoded to "Ahmad Bin Ali" for every sample
   transaction in the mockup. The real field (row 13) should be the actual
   BackOffice user who keyed the SN via EAINT-12167 — the mockup cannot
   demonstrate this dynamic binding; needs live-build verification.
4. **REQ-001's generation trigger and REQ-006's two error states are not
   modeled at all.** The mockup's DO button is always clickable against
   static pre-filled data; there is no representation of the pre-consignment-
   note state or of either error message ("required details are incomplete" /
   "could not be generated"). Remains untestable until a real build exists.
5. Sample data already covers good split boundaries (20, 25, 40 units) but
   has no 21-unit sample (the "just past the 20 boundary" case) — worth
   adding as its own TS regardless of what the mockup shows.

## Dev QA Guide (session 2026-09-21) — source of truth, supersedes several
## mockup/SRD assumptions above

`[from "EAINT-12166 Delivery Order QA Guide", dev's own artifact (author:
tracey), shared 2026-09-22, branch dev/feat/EAINT-12166 — EAINT-12167's
serial-capture section "ships on this branch", merged 2026-09-03. Read in
full via browser this session — see EAINT-12166's artifact lists.txt for the
link. This is dev's own test guide, not the SRD — treat every line as build
intent confirmed by dev, still worth a live-environment sanity check once
reachable.]`

**Resolves the filename/numbering gap flagged earlier this session:**
- **Download filename:** `Delivery_Order_<SR ref>.pdf` — NOT the mockup's own
  invented `DeliveryOrder_<ref>_<DOnumber>.pdf` pattern. Don't test against
  the mockup's filename.
- **DO Number format:** `yyyyMMdd/DP-0001`, from a **new per-date counter**
  that restarts each day. **New rule, not in either SRD:** a shipping save
  made **after 12:00 noon is dated the next day** — the date prefix is a
  business-day cutoff, not simply the calendar date of the save.
- **Race-safety confirmed by dev's own test case:** ship a 40-device order
  then a 5-device order same day → numbers run in sequence, no repeats (e.g.
  0001+0002, then 0003) — directly answers the "double-generation race"
  question raised in the Concurrency section of the combined artifact.
  Numbering restarts at `.../DP-0001` under the new date prefix the next
  calendar day.
- **DO Number and "Issued by" are locked at the FIRST shipping save,
  forever.** Dev's own test: have a *different* officer update the
  transaction later (e.g. mark Delivered) and download the DO again — same
  numbers, **Issued-by still shows the ORIGINAL officer's full name (not the
  login id)** and the original date; nothing re-issues. This is dev's own
  confirmation of the answer already given earlier this session (SN-keyer =
  Issued-by, not whoever clicks DO later).

**Two corrections to what the SRD implied — build actually differs:**
1. **Special characters in Serial No. are REJECTED on save** ("letters,
   digits and spaces only"), **not auto-stripped while typing** as 12167's
   SRD literally states. Any TS written against the "auto-strip" wording is
   now wrong — rewrite as a rejection case.
2. **A 13-character serial CAN be typed** and is caught by "Device Serial
   No. must be between 8 and 12 characters." on Save — **not blocked at
   input** as the SRD's "12 chars is a hard input stop" wording implied. The
   same message fires for both 7-char (too short) and 13-char (too long).

**Genuine SRD-vs-build contradiction, not a correction — flag both sources
when writing this TS:** the BO Service Request **listing has no serial
column at all** ("Serial column removed from the listing (serials live on
the detail page)"; dev test 9.9: "No serial column; everything else as
before."). This **contradicts 12167 SRD v1.2's REQ-011**, which states the
listing shows one row per device with its own serial. Trust the dev guide
for what was actually built, but don't silently drop REQ-011 from the record
— note the contradiction when this ships.

**Delivery Status is a three-state chain, not two:** New → Arranged →
Delivered. Reopening an Arranged order only offers the Arranged→Delivered
move (serials shown greyed, not editable). Attempting an invalid jump (e.g.
Delivered→Arranged or Delivered→New) via the browser console gives exactly:
*"Invalid delivery status change. Delivery status can only move New →
Arranged → Delivered."* Update any state-transition table built earlier this
session to add the Delivered state and this exact validation message.

**Duplicate-SN message resolved** (was an open question this session):
*"Duplicate device serial number. Each serial number must be unique."*

**REQ-006 error handling — both SRD messages confirmed verbatim, plus a new
failure mechanism not in either SRD:**
- Report Engine stopped, then save shipping on a paid order → **save still
  succeeds** — status, serials, and DO numbers are all assigned; only the
  **stored PDF generation is skipped**.
- Still stopped, click DO → within seconds: *"Delivery Order could not be
  generated. Please try again."* If required details are missing instead:
  *"Unable to generate Delivery Order: required details are incomplete."*
  Both match the SRD's REQ-006 wording exactly.
- Once Report Engine is back up, click DO again on that same order → PDF
  **generates live and downloads fine** (no stored copy ever existed for
  that order — accepted permanently: it live-generates from then on). This
  is the mechanism behind the top-of-doc note "DO download button (stored
  PDF, live fallback)" — the fallback path only ever engages for orders
  whose stored-PDF generation failed at save time.
- Every DO download writes **one BO audit-log entry** listing **all** DO
  numbers of the transaction — useful as a verification point.

**New cross-module regression risk — not visible in either SRD, worth its
own regression pass every environment after deploy:** the Report Engine URL
moved from a hardcoded `http://localhost:8088` to
`settings.eauto.report.engine.api.url`, now shared by **five existing,
otherwise-unrelated report flows**: Insurance e-Contract, Insurance CP58,
Insurance Add User Authorization (+ its Declaration PDF), eSTM Buyer
Authentication (PDF slip), and Company Management Print DO (New
Registration). A wrong or missing value in **any one environment breaks all
five at once**, silently. Needs a one-PDF-per-flow smoke check in SIT,
staging, and prod after every deploy — flagged `NEEDS A DECISION` in dev's
own guide.

**Other confirmed facts:**
- UCD's own purchase **Receipt** page now also shows the Delivery Order
  Number(s), comma-separated for split orders — not previously documented
  anywhere. Same display on both the BO detail page and the UCD receipt.
- An unshipped (status = New) order shows DO Number as `"-"` with no DO
  button, on both pages.
- A device purchase created **before this release** opens normally and shows
  its old DO number if any, but has **no DO button** — by design, legacy
  orders don't carry the data the new PDF needs.
- Quantity-cap boundary: clearing the UCD quantity box or typing 0 and
  leaving the field corrects the value to **1**, not 0 — a boundary not
  previously recorded. The 40-cap is enforced **server-side** too (confirmed
  by attempting to submit >40 via the browser console — server rejects it).
- The generated DO shows the company's **registered address**, never the
  delivery/shipping address, even for a long multi-line address (nothing
  truncated).
- Installation count on the DO is printed in words = quantity + extra
  installations, never blank, never the word "FREE" — matches the SRD's
  Payment Amount rule exactly.
- EAINT-12099 (Inventory Control / Stock Out) is explicitly **not** on this
  branch — DO creation stays tied to the shipping save only, confirmed
  out-of-scope for this round.
- New Report Engine template name: `ServiceHubDeliveryOrder` — useful for
  filing defects against the right component.
- Deploy precondition: `sql/2026-08-17-EAINT-12166/master.sql` creates the DO
  tables and counter, runs its own pre-deploy duplicate check (must return
  zero rows) and one-time seeding; Report Engine must be redeployed with the
  new template and `settings.eauto.report.engine.api.url` set correctly per
  environment before any of this is testable.

## Teams recheck, 2026-09-21 (later same day)

`[from Teams, eAuto QAs channel + both dedicated CR-group chats, rechecked
2026-09-21 after the mockup/SRD study above]`

- **EAINT-12167's TS draft is now complete, not just started.** Faizuddin
  posted a Miro link in eAuto QAs: *"Hi, i've finished drafting the TS for
  12167. Is anyone able to review it? Thank you"* `(source: Teams,
  Faizuddin, eAuto QAs channel, 2026-09-21 11:26)`. This supersedes the
  09-17 EOD note ("Organized the possible scenarios (Estimated ~15TS);
  Started drafting TS") — drafting is now finished and awaiting review.
  Only a single emoji reaction followed; nobody has reviewed or replied yet
  as of this check, so no new decision or correction came out of it.
- **No equivalent progress update for EAINT-12166** turned up in this
  recheck — it remains at the 09-17 "To draft TS" status with no newer note
  found.
- Both dedicated CR-group chats (`EAINT-12166 [...]` and `EAINT-12167
  [...]`) were reopened and read to their actual end: 12166's chat is still
  silent since 02 September 2026 (last message: requestor sign-off on SRD
  v1.1); 12167's chat is still silent since 21 August 2026 (Figma design
  link from Wong Zhan Choon). Neither had any new content — the "silent
  since" facts already on file above are unchanged and reconfirmed.
- A same-day 21st-September morning deployment summary in eAuto QAs
  mentions "BDP & SI" among P1 modules with approved transactions already in
  production and no issues — but this is a routine cross-module production
  monitoring post, not a comment on 12166/12167 specifically (both are still
  Code Review/pre-build per every other signal on file), and "BDP" here is
  not confirmed to mean this ticket pair's Biometric Device Purchase module.
  Not treated as a deployment signal for these tickets; flagged only so a
  future session doesn't mistake it for one.

## Huddle Agenda, 2026-09-21 09:54 — 28 Sept is now the scheduled deployment slot, not just a fallback (source: Teams, Faizuddin, eAuto QAs channel)

`[from a "Huddle Agenda (21/09/2026)" post by Faizuddin in eAuto QAs, 09:54,
rechecked live 2026-09-21 — a different post than the 11:26 TS-review Miro
link and the 11:41 deployment-monitoring post already recorded above, both
of which remain the latest content in that channel; no reply thread touched
12166/12167 specifically]`

- **Both tickets appear together under a "[28 September 2026] - Morning"
  planned-deployment heading**, alongside unrelated tickets scheduled for
  the same slot (EAINT-104, EAINT-10093, EAINT-10119 for 24 Sept; EAINT-11759/
  12217/12218 for 1 Oct) `(source: Teams, Faizuddin, eAuto QAs channel,
  Huddle Agenda 21-09-2026, 09:54)`. This is the first time 28 Sept has
  appeared as an actual scheduled item in a deployment agenda rather than
  only as the Fix Version field and the "fallback if dev doesn't make it"
  date quoted from May Chin's 15 Sept DM — treat it as the current working
  deployment date for both tickets, superseding "fallback" framing, though
  it's still Faizuddin's own planning post, not a dev/PM confirmation that
  the code is actually ready to ship that day.
- **EAINT-12166's status moved from "To draft TS" (17 Sept) to "QA currently
  drafting test scenarios"** — the same phrase used for 12167, which had
  already reached "finished drafting" per the 11:26 Miro post earlier in the
  day. So as of this Huddle Agenda, 12166 is still mid-draft while 12167 is
  already done and awaiting review — the gap between the two tickets' TS
  progress noted in the 09-17/09-18 status updates persists `(source: Teams,
  Faizuddin, eAuto QAs channel, Huddle Agenda 21-09-2026, 09:54)`.
- A colleague (Charmain Ea Chiang, 09:56-10:01) replied to this same Huddle
  Agenda post but her feedback was scoped entirely to **EAINT-12341** (an
  unrelated ticket — date TBC) — nothing about 12166/12167 was raised or
  corrected in that thread.

## Afternoon recheck, 2026-09-21 — TS review landed, staging env picked, DO-guide artifact handoff confirmed (source: Teams)

`[rechecked live again ~16:00 same day as the two sections above, since
several hours of afternoon Teams activity had happened since the 11:26/09:54
posts already on file — DMs with Charmain Ea Chiang and Lim Xiwei ("Tracey")
plus the two dedicated CR-group chats]`

- **⚠️ AMENDED.** The claim two sections up — *"Only a single emoji reaction
  followed; nobody has reviewed or replied yet as of this check"* (re:
  12167's 11:26 Miro TS-review request) — is now superseded. Charmain Ea
  Chiang did review it: *"Faiz, 12167 you drafted majority on functional ts
  right?"* → Faizuddin: *"Yup"* → Charmain: *"how about concurrent ts ya?"*
  → Faizuddin: *"That one not yet. currently starting for 12166, so will do
  it together"* → Charmain: *"okie can"*, then *"i have reviewed your
  EAINT-12167 functional ts ya, so far ok"* `(source: Teams, Charmain Ea
  Chiang, DM, 2026-09-21 11:37-11:42)`. Two new facts fall out of this:
  1. **12167's *functional* TS is reviewed and passed** ("so far ok") — this
     is beyond "finished drafting, awaiting review."
  2. **TS for this ticket pair splits into "functional" and "concurrent"
     categories.** Concurrent TS (concurrency/race-condition scenarios, e.g.
     two Ops updating the same SR simultaneously) has **not been started**
     for 12167, and Faizuddin's plan is to draft it **together with 12166's
     TS**, not as a separate 12167-only pass. Don't expect a concurrent-TS
     count inside the "~15TS" 12167 estimate quoted earlier — that estimate
     predates this split.
- **Staging environment for both tickets is now tentatively decided: uat1.**
  Faizuddin posted the same message to both dedicated CR-group chats
  (EAINT-12166 and EAINT-12167): *"Hi Everyone. We tentatively plan to use
  /uat1 for the staging environment ya. Thank you"* `(source: Teams,
  Faizuddin, EAINT-12166 and EAINT-12167 CR-group chats, 2026-09-21 15:52)`.
  Only thumbs-up reactions followed in both chats — no dev/PM pushback, but
  also no explicit confirmation beyond the reactions. Read as "the working
  plan," not yet a locked decision.
- **That staging announcement was itself the follow-through on a DM
  exchange with Charmain earlier the same day**, which also surfaces a new
  blocker: Faizuddin asked Charmain (as she's the one who can deploy) "can i
  request... the affected areas and pages for EAINT-12166" from dev
  (Tracey/Lim Xiwei) at 12:45; separately Charmain (in the deployment
  context) asked Faizuddin to "inform in group when can proceed to deploy to
  staging," and Faizuddin replied *"Okay, for now i need to wait until got
  free env. Maybe some time after lunch i'll update the group ya"* `(source:
  Teams, Faizuddin, DM with Lim Xiwei, 2026-09-21 12:45-12:51)`. **Reachable
  staging for testing isn't just a code-readiness question — it's gated on
  environment availability**, and the 15:52 uat1 announcement is Faizuddin
  reporting that env became free, not a new deploy having actually happened
  yet; don't assume uat1 is live/testable for these tickets without checking
  again.
- **Lim Xiwei ("Tracey," dev) delivered the requested EAINT-12166 affected
  areas/pages list as a claude.ai artifact** at 14:29: *"hihi
  [artifact link] this is the first version i will continuously update same
  artifact if theres any code changes"* `(source: Teams, Lim Xiwei, DM,
  2026-09-21 14:29)`. This is the same artifact link already on file as the
  "[Dev, source of truth] EAINT-12166 Delivery Order QA Guide" in
  `_reference/tickets/EAINT-12166/EAINT-12166 artifact lists.txt`, already
  read in full and folded into this file's "Dev QA Guide" section above —
  no new content beyond the two facts above (Charmain's TS review, the
  free-env blocker/uat1 plan). The one new operational note: Tracey
  described it as a **living document she'll keep updating on code
  changes**, so a future session should re-open the link rather than assume
  the 2026-09-21 read is still current once code lands.
- A further Faizuddin→Charmain DM at 14:26 ("for this morning's deployment...
  BDP & SI... P1 modules are okay... password has been repatched...") was
  checked and is **not about EAINT-12166/12167** — no ticket number, general
  cross-module production deployment monitoring — excluded per scope, noted
  here only so a future session doesn't rediscover and misfile it.
