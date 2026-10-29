# Flow: Biometric Device Purchase — Serial Capture & Delivery Order (BackOffice)

`[from tickets EAINT-12167 and EAINT-12166 — SRD study + Teams CR-group chat history, both read live 2026-09-18. Neither ticket has a live/staging build confirmed reachable yet (Jira status: Code Review on both as of 2026-09-17); this file is SRD+Teams-derived, not yet checked against a running app.]`

## Why this flow matters

Two tickets, one dependency chain, both owned by Faizuddin ("spearhead both
going forward", 2026-09-15 session). **EAINT-12167** adds Device Serial No.
capture to the existing "Update Shipping Details" popup on a Device Purchase
Service Request. **EAINT-12166** adds a one-click DO-generation button that
prints those serial numbers onto a Delivery Order PDF. 12166 cannot be
meaningfully tested without 12167's serial data existing first.

## Quantity caps and module family

1. **Number of Installations** (Software Installation, EAINT-10960 SRD p.15
   §2.3.2.1) has **no limit**. **Purchase Quantity** (Biometric Device
   Purchase) is capped at **40 units per transaction** via EAINT-12166 REQ-007.
   The "4 characters" in EAINT-11996 is the bug, not a rule.
   `[from handoff 2026-09-17 EAINT-11880]` `[from handoff 2026-09-17 EAINT-11996]`
2. **Module family map:** CCB-618 → EAINT-10960 → EAINT-11880 → EAINT-11881 /
   11882; bugs 11996 / 12095 / 12103 / 12104 sit under 11880.
   `[from handoff 2026-09-17 EAINT-11880]`
3. **EAINT-12095 regression note:** "Seems like the initial fix for UCD broke
   the BO page" — the UCD word-wrap fix (long shipping address) caused a BO
   regression, raised with Wong Kar Kin. `[from Teams, 2026-09-17 16:20,
   Faizuddin]` via appraisal proof pack §G.
4. **Parcel vs order:** a parcel holds at most **10** devices, an order at
   most **40**. `[from Teams EAINT-12167, 2026-08-14 10:08, Yi Link Lim]`
   This is the source of the "each parcel ships max 10 devices" reading in
   the EAINT-12167 section below.
5. **Reference formats:** `SRI{Year}{Month}{6}` and `SRB{Year}{Month}{6}`
   (which module each belongs to is not stated in the source). The month is one
   character: 1–9, then O, N, D. `[from Teams EAINT-12099 group, 2026-07-14
   09:50, Charmain Ea Chiang]`
6. The free software installation appointment is valid for **2 months** from
   purchase. `[from Teams EAINT-12099 group, 2026-07-20 16:34, Kin Hang Aw]`
7. The BDP email **Paid Amount** is the total paid; a free installation shows
   "-". `[from Teams EAINT-12124, 2026-09-28 09:34, Kasheng Liew]`

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

**The 18 blocked accounts, verbatim from SRD v1.2 §2.2.6 (REQ-009)**
`[verified: read directly from
_reference/tickets/EAINT-12167/EAINT-12167_SRD_..._v1.2_20260817.pdf, 2026-09-22]`
— these accounts must NOT be able to view/edit Number of Device or Device
Serial No.; every other Hub Admin account should be able to:
eautohamal, eautojenilyn, eautojrjaya, eautonashwa, eautoshamini, eautovegas,
eautoxiayuan, kokping, tempstaff, wahidahzaki, mfnabila, mfnadhirah,
mfzuhaira, eautochinwei, mfaliah, mfmaisarah, mfnicholas, mfteckyung.

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

**The Update Shipping Details popup's Delivery Date field is `dd-MM-yyyy`,
and the server parses `dd/MM/yyyy` — sending ISO `yyyy-MM-dd` is accepted
with a 200 OK but silently stores NO date.** `[verified: live page source +
captured network request, Playwright trace, uat1, 2026-09-23]` The app's
own client JS, verbatim:

```js
$("#op-ship-date").datepicker({ dateFormat:'dd-mm-yy', ... })  // jQuery UI 'yy' = 4-digit year
var shipDate = $.trim($("#op-ship-date").val());
deliveryDate: shipDate.replace(/-/g, "/"),  // shown dd-MM-yyyy; server parseDate expects dd/MM/yyyy
```

So the field reads its **raw input value** (setting `.value` directly is
fine — the datepicker's internal state is never consulted), and the only
transform before POSTing is `-` → `/`. A human picking 26 Sep 2026 yields
`26-09-2026` → `26/09/2026`, which parses correctly. Feeding it ISO
`2026-09-26` yields `2026/09/26`, parsed as dd/MM/yyyy → day 2026, month
09, year 26 → nonsense; the server answers **200 OK**, persists every
other field (they're plain strings), and stores no Delivery Date.

**Why that is so expensive to debug:** the record then shows
`Delivery Date: -`, and the NEXT status change (Arranged → Delivered) is
blocked forever — the reopened popup renders that field empty, its own
"This field is required" validation refuses every Update click, the popup
never closes, and its modal overlay (`.ui-widget-overlay`) then intercepts
every subsequent click on the page, so the DO download and everything
after it time out too. One wrong date format surfaces as four unrelated-
looking timeouts in a later officer's session. Confirmed NOT related to
split orders, device count, or weekend dates — all three were ruled out
(Faizuddin reproduced 40-device and 2-DO split cases manually with the
date persisting correctly).

Fixed 2026-09-23 in `tests/service-hub/pages/bo/DevicePurchaseDetailsPage.ts`
— `setDeliveryDate()` now converts ISO → `dd-MM-yyyy` before writing and
asserts the field holds it afterwards. Callers still pass ISO (what
`BasePage.daysFromToday()` produces); the conversion lives in one place.

**Also confirmed from the same source:** `opShipSave()`'s own comment reads
*"No confirm step — a validated Update POSTs directly"* — there is no
native `confirm()` on this save, so no dialog handler belongs here (a
stray armed `page.once("dialog")` would risk swallowing TS08's
duplicate-serial alert instead). The real endpoint is
`POST <env>/api/admin/service-hub/biometric/update-shipping.do`,
`application/x-www-form-urlencoded`, `X-Requested-With: XMLHttpRequest`,
params `transactionId` (the `detail.do?id=` value), `baseVersion`,
`deliveryStatus`, `deliveryDate`, `consignmentNo`, `recipientName`,
`shippingAddress`, `contactNo`, repeated `deviceSerialNos`.

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
- **Field #19 "(B) Appointment" (Appointment Slots) is per DEVICE UNIT, not
  per software installation** `[verified: SRD v1.1 §2.2.5 row 19, read
  directly 2026-09-22]` — one row per device showing that unit's selected
  delivery date & time, or the empty-appointment message if none selected.
  On a split order, appointment rows follow the device units on that specific
  DO (slots 1–20 on the first, 21–25 on the second for a 25-unit split); the
  empty-appointment note repeats on every split page if none of those units
  has a slot. **Extra software installations have zero effect on this
  section** — don't test installation count against Appointment Slots, test
  it against Payment Amount (row 11) instead, which is the field the SRD
  actually ties installation count to (see next bullet).
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

**One correction to what the SRD implied — build actually differs:**
1. **Special characters in Serial No. are REJECTED on save** ("letters,
   digits and spaces only"), **not auto-stripped while typing** as 12167's
   SRD literally states. Any TS written against the "auto-strip" wording is
   now wrong — rewrite as a rejection case.
   `[confirmed: Faizuddin, 2026-10-23]` **Superseded: special characters are
   STRIPPED.** Live (TS08, 2026-09-24) and SRD v1.2 strip; the dev guide's
   "rejected on save" is not current behaviour.

**Reverted 2026-09-24, per Faizuddin — the SRD's "12 chars is a hard input
stop" wording was correct all along; the "13th char CAN be typed, caught by
the save-time message" claim below was itself the wrong one, not a
correction.** The field's `maxlength=12` genuinely blocks a 13th keystroke —
there is no UI path to ever hold 13 characters, so the save-time length
message only ever fires for the TOO-SHORT case (under 8), never for
too-long. `tests/service-hub/specs/device-purchase-do-ts08.spec.ts`'s
13-character step now asserts the field truncates to 12 chars with no error
shown, instead of force-setting the value via JS to prove a save-time
message existed for a state the real UI can never reach.
~~2. A 13-character serial CAN be typed and is caught by "Device Serial No.
must be between 8 and 12 characters." on Save — not blocked at input as the
SRD's "12 chars is a hard input stop" wording implied. The same message
fires for both 7-char (too short) and 13-char (too long).~~ (superseded —
kept struck through rather than deleted, since this was asserted as a
confirmed live finding earlier this session; if it resurfaces, that's a
real regression worth re-flagging, not just restoring old text.)

**Genuine SRD-vs-build contradiction, not a correction — flag both sources
when writing this TS:** the BO Service Request **listing has no serial
column at all** ("Serial column removed from the listing (serials live on
the detail page)"; dev test 9.9: "No serial column; everything else as
before."). This **contradicts 12167 SRD v1.2's REQ-011**, which states the
listing shows one row per device with its own serial. Trust the dev guide
for what was actually built, but don't silently drop REQ-011 from the record
— note the contradiction when this ships.

**2026-09-22 — RESOLVED via live capture: the listing DOES show a Device
Serial No. column, contradicting dev's earlier guide claim, not the SRD.**
`[verified: live HTML,
_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html,
staging.eauto.my/uat1, 2026-09-22]` The BO listing's actual `<thead>` has
both "Device" and "Device Serial No." columns; every Biometric Device
Purchase row shows `Device = 1` with its own serial cell (`-` when unkeyed),
matching REQ-011 exactly. **Trust this live capture over dev's guide on this
point** — the guide's "no serial column, everything else as before" claim is
now shown to be stale or wrong. Same session's SR Details page for the same
SR (SR69001391) shows `Number of Device: 6` (transaction total) while the
listing shows `Device: 1` per row — confirms REQ-011's "opposite scope on
the two pages" behaviour live, not just from the SRD text.

**2026-09-22 — Update Shipping Details popup captured live for the first
time** `[verified: live HTML,
_reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html,
staging.eauto.my/uat1, 2026-09-22]`:
- `#op-ship-devcount` is plain read-only text, not an input — matches
  REQ-002 (view-only, no free text).
- `#op-ship-status` (Delivery Status select), while the record is New, has
  **only one `<option>`: "Arranged"** — not a full state dropdown. Confirms
  "user can only select Arranged" from New is built as a single-option
  select, not a disabled/filtered multi-option one.
- Every `.op-ship-serial` input carries `maxlength="12"` and its own
  `.op-ship-serial-err` div directly underneath it ("This field is
  required", hidden by default) — **the form's OWN error-handling design is
  inline-per-field**, which directly supports the QA-Issue already raised
  (EAINT-12394) that showing the duplicate-SN message as a native browser
  `alert()` instead is inconsistent with how every other field error on this
  same popup is built to render.
- Two concurrency dialogs exist in the page DOM, with exact text — **direct
  answers to two "Concurrency — questions for dev" items** in the combined
  study artifact, no longer open:
  - `#op-concurrent-dialog`: *"Unable to proceed. This record was just
    updated by another user."* — answers the "same-SR concurrent save"
    question. OK refreshes the page.
  - `#op-installstate-dialog`: *"Unable to proceed. This Service Request has
    been completed, failed, expired or cancelled."* — installation-status
    concurrency, not shipping directly, but the same protective pattern.
  Both are tagged `EAINT-11953` in the HTML comments — a **different**
  ticket already implemented this locking, worth checking if it predates
  12167 or was built alongside it.

**2026-09-22 — the actual reviewed functional TS bakes in both contradictions
above as untested assumptions, not just theoretical gaps.** Faizuddin's
functional TS for 12167 (drafted on Miro, Charmain-reviewed "so far ok" on
09-21, raw capture at
`_reference/tickets/EAINT-12167/EAINT-12167-functional-TS-draft-2026-09-22.md`)
was written *before* dev's QA guide was read this same week, and it assumes
the **pre-dev-guide, SRD-literal behaviour on both points**:
- `12167_LDP_01`–`06` explicitly test for a **Device Serial Number column on
  the listing page** — the opposite of what dev's guide says was built (no
  column at all). If dev's guide is right, these 6 TS fail immediately on a
  real build; if they pass, dev's guide is stale. Either way this needs a
  live check before execution, not an assumption.
- `12167_USDP_02`/`03` test that Chinese characters and symbols are
  **"stripped live as user types" / "stripped on paste"** — i.e. the
  auto-strip behaviour from the SRD's literal wording, the exact behaviour
  the "two corrections" section above says dev's guide **overturned**
  (special characters are *rejected on save*, "letters, digits and spaces
  only", not silently stripped). `12167_USDP_01`'s 13-character case does
  match dev's guide (typable, caught by the length message on Save), so this
  isn't a wholesale rewrite of the draft — just these two TS's expected
  results are specifically the ones now in question.
  `[confirmed: Faizuddin, 2026-10-23]` USDP_02/03 question resolved: serial
  special characters are stripped (the draft's expectation stands).
- **Practical implication:** since Charmain already reviewed and approved
  this draft, whoever executes `USDP_02`/`03` and `LDP_01`–`06` should watch
  the actual result closely rather than assume the written "Expected Result"
  is correct — one of {this draft, dev's QA guide} is wrong on these two
  points, and only a live build settles which.

**Delivery Status is a three-state chain, not two:** New → Arranged →
Delivered. Reopening an Arranged order only offers the Arranged→Delivered
move (serials shown greyed, not editable). **Once Delivered, the "Update
Shipping Details" button is not rendered at all** `[verified: manual repro
video "Update shipping details different user - Success.mp4" + live
automation, 2026-09-24]` — Delivered is terminal, so there's nothing left
to update, and the app reflects that by removing the trigger button
entirely rather than showing it disabled or leaving fields merely locked
once reopened. An automated check that tries to reopen the popup post-
Delivered will hang waiting for a `.btn-update` that never appears — assert
the button is **absent** instead.

Attempting an invalid jump (e.g. Delivered→Arranged or Delivered→New)
**via the real API** (`POST .../api/admin/service-hub/biometric/
update-shipping.do`, form-urlencoded) returns **`200` with a short body,
literally `INVALID_STATUS`** `[verified: live network response, 2026-09-24]`
— not the full sentence below. The full wording:

*"Invalid delivery status change. Delivery status can only move New →
Arranged → Delivered."*

is a UI-level message (client-side, mapped from the code) — unconfirmed
whether the raw API ever returns that sentence verbatim in any response
body; don't assert on it directly. Assert on the actually-persisted status
after a reload instead, which is what the real rule is anyway.

**Duplicate-SN message — CORRECTED 2026-09-24, confirmed live**
`[verified: live run, device-purchase-do-ts08.spec.ts, 2026-09-24]`:
*"Duplicate serial number."* — the earlier-recorded longer sentence,
*"Duplicate device serial number. Each serial number must be unique."*, was
never actually confirmed live; it was an assumption that went unchallenged
until this run's assertion failed against the real text.

**Duplicate-SN rendering CORRECTED 2026-09-24** `[Faizuddin, manual check]`:
QA-Issue EAINT-12394 (message shown as a native browser `alert()` instead of
an inline field error, inconsistent with every other error on this popup — see
the 2026-09-22 entry above) is **no longer reproducible**. It now renders
**inline**, same as required/length errors, under the Serial No. input — no
dialog at all. `device-purchase-do-ts08.spec.ts` asserted on a `page.dialog`
listener that then hung forever waiting for a dialog that never fires;
switched to the same `.op-ship-serial-err` DOM locator used by every other
check on this popup.

**Duplicate-SN — which field gets flagged, CONFIRMED 2026-09-24**
`[Faizuddin]`: when two Device Serial No. fields hold the same value, only the
**LATER** occurrence shows the "Duplicate serial number." error — the
**FIRST** occurrence shows no error at all. This is **expected behaviour, not
a bug** — QA-Issue EAINT-12404 was raised over this exact observation (with
the opposite justification, that the first field should also be flagged so
the user can tell which fields are duplicated), then closed once Faizuddin
confirmed the current behaviour is the intended one.

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
- UCD's own **Service Request Details page** (reached from the UCD's Service
  Request Listing — same page shape as the BO Service Request Details page,
  rendered for the UCD account) now also shows the Delivery Order Number(s),
  comma-separated for split orders — not previously documented anywhere.
  Same display on both the BO Service Request Details page and this UCD one.
  `[naming correction, 2026-09-23, Faizuddin]` **There is no separate "UCD
  Receipt" page — that name was a misnomer from earlier in this file and in
  the combined study artifact.** The DO Number renders directly on this same
  Service Request Details page the UCD lands on for that transaction
  (`[verified: live HTML,
  _reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html,
  staging.eauto.my/uat1, 2026-09-23]` — SR69001395, Delivery Status Arranged,
  shows `Delivery Order Number: 20260923/DP-0005`). It carries a "Shipping
  Details" block (Purchased Device, Delivery Status, Delivery Order Number,
  Consignment Number, Delivery Date, Shipping Address, Recipient Name,
  Contact No — no serial numbers, those stay BO-only) and only an Invoice
  download button — no DO PDF download control exists on the UCD side, DO
  download is BO-only; UCD only ever sees the DO **number** as text. Every
  other mention of "Receipt" anywhere in this file, in the combined study
  artifact, and in any prior session note should be read as this same
  Service Request Details page — the combined study artifact's own text has
  already been corrected to say so.
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

## Teams recheck, 2026-09-22 09:50 — still not deployed to uat1

`[from Teams, eAuto QAs channel, checked live 2026-09-22 — both dedicated
CR-group chats (EAINT-12166 and EAINT-12167) were also reopened and found
unchanged since the 2026-09-21 15:52 uat1 announcement already on file above
— no new messages in either]`

- **Charmain Ea Chiang asked Faizuddin directly whether both tickets are
  ready for testing on staging/uat1**: *"Hi morning Muhammad Faizuddin Bin
  Bidi, just checking ya, are EAINT-12166 and EAINT-12167 ready for testing
  on staging/uat1?"* `(source: Teams, Charmain Ea Chiang, eAuto QAs channel,
  2026-09-22 09:49)`.
- **Faizuddin's answer confirms uat1 is still not deployed as of this
  morning**: *"dev side ready but not deployed yet. Just asked them to
  deploy today"* `(source: Teams, Faizuddin, eAuto QAs channel, 2026-09-22
  09:50)`. This is a direct update on the open item flagged in the
  2026-09-21 afternoon recheck above ("don't assume uat1 is live/testable
  without checking again") — as of this check it is confirmed **still not
  testable**, and Faizuddin has now (2026-09-22 morning) chased dev again to
  deploy it today. Only a thumbs-up reaction followed; no further reply from
  dev/Charmain in this thread as of this check.

## Teams recheck, 2026-09-22 midday — deployment to uat1 authorized and started

`[from Teams, live DMs with Wong Zhan Choon ("Zack," 12167 dev), Lim Xiwei
("Tracey," 12166 dev), Mei Jia Chee (dev, unrelated ticket's UAT occupying
the env), and Charmain Ea Chiang — all read live 2026-09-22 around
midday/lunchtime, later than the 09:50 channel post already on file above]`

- **⚠️ AMENDED — uat1 deployment moved from "asked, not yet done" to
  "authorized and dev started" within the same morning.** The full DM
  sequence with Wong Zhan Choon: 09:48 Faizuddin asked "for 12167, have the
  changes been deployed?" → 09:49 "I believe not yet" → Faizuddin asked if
  deploy is possible after lunch → "yea possible" → 09:50 Zhan Choon: "it's
  already done development, let me know when can we deploy" → Faizuddin:
  "whenever ready, can start deploy actually" → 09:51 Zhan Choon: "ok then I
  will liaised with Tracey ticket to deploy to uat1" `(source: Teams, Wong
  Zhan Choon, DM, 2026-09-22 09:48-09:52)`. This is the dev-side follow
  through on Faizuddin's 09:50 channel post to Charmain.
- **The blocker was a shared environment, not code readiness** — /uat1 was
  occupied by Mei Jia Chee's UAT for an unrelated ticket, and dev wanted to
  deploy 12166/12167 during her lunch break rather than mid-UAT. Faizuddin
  separately asked **Charmain** (11:54-12:05) how long Mei Jia's UAT would
  run and whether deploying 12166/12167 would require a tomcat restart that
  could disrupt it — Charmain: "normally will last whole day, until 5pm then
  continue tmr" and, on the tomcat-restart risk, "oh i see, then better ask
  MJ first" `(source: Teams, Charmain Ea Chiang, DM, 2026-09-22
  11:54-12:05)`. Faizuddin then asked **Mei Jia Chee directly** when her UAT
  would break for lunch so deploy could happen safely; at **12:23 Mei Jia
  confirmed "we go lunch break dah, can proceed deploy yaa"** `(source:
  Teams, Mei Jia Chee, DM, 2026-09-22 12:09-12:23)`.
- **Faizuddin gave both devs the go-ahead within the same minute**: to Wong
  Zhan Choon at 12:23, "Okay Zack, can start deploy now ya" → Zhan Choon
  12:24 "okieee" `(source: Teams, Wong Zhan Choon, DM, 2026-09-22
  12:07-12:24)`. **⚠️ AMENDED below — the outcome of this deploy attempt is
  now known: 12167 succeeded (with a mid-deploy hiccup, corrected same
  hour), 12166 was deliberately held back, not a code-readiness failure.**

## Teams recheck, 2026-09-22 afternoon — 12167 deployed to uat1 (with a corrected mid-deploy error), 12166 deliberately held back

`[from Teams, live DMs with Wong Zhan Choon, Lim Xiwei ("Tracey"), and
Charmain Ea Chiang, all read live 2026-09-22 early-to-mid afternoon — later
than the midday "authorized and started" section above. The two dedicated
CR-group chats were also rechecked and remain silent since 2026-09-21 15:52
(uat1 announcement) — no new content there.]`

- **EAINT-12167 is deployed to uat1, confirmed done.** Full DM sequence with
  Wong Zhan Choon: 12:24 "okieee" → 12:51 "ok i deployed EAINT-12167" →
  Faizuddin 12:52 "Okay thanks. Have you updated tracey yet?" → Zhan Choon
  12:53 "wait" / **"i deployed wrong"** → Faizuddin 12:53 "ahh okekey" →
  Zhan Choon 13:03 **"ok done ald ya"** `(source: Teams, Wong Zhan Choon, DM,
  2026-09-22 12:24-13:03)`. **There was a genuine mid-deploy mistake
  ("deployed wrong"), corrected within the same 10 minutes** — worth a
  sanity check of the actual uat1 build before trusting it blindly, even
  though dev's own follow-up message says it's done. No indication of what
  "deployed wrong" actually meant (wrong branch/wrong ticket/wrong
  environment) — not asked in this thread.
- **EAINT-12166 was deliberately NOT deployed alongside 12167** — this
  supersedes reading the earlier "authorized and dev started" note as
  meaning both tickets. Faizuddin to Wong Zhan Choon, 13:04: *"Okay thanks
  ya. I think for tracey's ticket, we wait first lah"* → to Lim Xiwei
  directly, 13:05: *"Tracey, i think for your ticket 12166, we dont deploy
  now first lah. Make way for UAT to finish first"* → Lim Xiwei: "oh okayss"
  → Faizuddin: "I'll update you later when safe to deploy. Thanks ya"
  `(source: Teams, Wong Zhan Choon / Lim Xiwei, DM, 2026-09-22 13:03-13:05)`.
  **Reason given: making way for Mei Jia Chee's unrelated UAT to finish
  first** (the same shared-/uat1-environment concern already on file from
  the midday section above), not a code or dev-readiness problem.
- **⚠️ AMENDED — the reason Faizuddin gave Charmain shortly after differs in
  wording from the reason given directly to Lim Xiwei/Zhan Choon above,
  worth flagging as a minor inconsistency, not necessarily a contradiction.**
  At 14:21, Faizuddin told Charmain: *"Also to update, we've only been able
  to deploy 12167 first. **Got issues so couldnt deploy 12166 in time.** I
  will proceed with testing 12167 first ya"* `(source: Teams, Charmain Ea
  Chiang, DM, 2026-09-22 14:21)` — "got issues" reads more like a technical
  blocker than the "making way for UAT" reason given to the devs 13:03-13:05.
  Both may be true (the UAT-conflict decision plus some other issue), but
  only the UAT-conflict reason has a concrete DM trail; "got issues" is
  otherwise unexplained. Worth clarifying with Faizuddin directly if this
  matters for a defect/delay writeup.
- **Faizuddin also reported the combined E2E and functional scenarios as
  complete** in that same 14:21 message to Charmain, sharing a Miro link and
  asking her to review when possible. Charmain (14:26): *"ok noted ya,
  please follow up with dev again on 12166 EOD today"* / *"i will review the
  ts later when im free"* → Faizuddin (14:28): "okay will do" `(source:
  Teams, Charmain Ea Chiang, DM, 2026-09-22 14:21-14:28)`. This is the
  latest content in this DM thread as of this check — no confirmation yet
  that Charmain has reviewed, and no EOD dev follow-up on 12166 visible yet.
- **Practical implication for whoever picks this up next:** as of this
  afternoon check, **only EAINT-12167 is live/testable on uat1**; EAINT-12166
  is still not deployed anywhere, pending a later, unscheduled window once
  MJ's UAT clears. Don't assume both tickets are testable together on uat1
  without re-checking — re-verify current deploy status before scheduling
  execution for 12166 specifically.
- **REQ-009's BackOffice-user access-limitation question surfaced but is
  only weakly answered.** Faizuddin sent the SRD's §2.2.6 "BackOffice User
  Access" screenshot (REQ-009: all Hub Admin users can view/update the new
  Device SN fields **except** 18 named accounts — eautohamal, eautojenilyn,
  eautojrjaya, eautonashwa, eautoshamini, eautovegas, eautoxiayuan, kokping,
  tempstaff, wahidahzaki, mfnabila, mfnadhirah, mfzuhaira, eautochinwei,
  mfaliah, mfmaisarah, mfnicholas, mfteckyung) to both Lim Xiwei and Wong
  Zhan Choon, asking whether those 18 accounts can view the BDP & SI Listing
  at all, or are fully blocked. **Lim Xiwei (12166's own dev) said this is
  not her area** — *"12167 need ask zhan choon mine is 12166"* `(source:
  Teams, Lim Xiwei, DM, 2026-09-22 12:03-12:05)`, confirming the dev
  ownership split: **Tracey/Lim Xiwei owns 12166, Wong Zhan Choon owns
  12167.** Wong Zhan Choon then answered, but only tentatively: **"they
  cannot view i believe"** `(source: Teams, Wong Zhan Choon, DM, 2026-09-22
  12:02-12:07)` — read as an unconfirmed lean, not a dev-tested fact; worth
  re-confirming once uat1 is reachable rather than scripting a TS on it as
  settled.

## Teams recheck, 2026-09-22 later afternoon — Faizuddin's own post-deploy sanity check on 12167, environment-name discrepancy flagged

`[from Teams, DM with Mei Jia Chee, read live 2026-09-22 — the same DM thread
already on file above for the lunch-break/UAT-conflict coordination; this is
the next message in that same thread, timestamped after the 12:24-13:05 deploy
exchanges with Wong Zhan Choon/Lim Xiwei already recorded. Both dedicated
CR-group chats (12166/12167) and the eAuto QAs channel were also rechecked at
this pass and remain unchanged since the 2026-09-21 15:52 uat1 announcement /
2026-09-22 09:50 channel post already on file — no new content in either.]`

- **Faizuddin did his own quick sanity check after Wong Zhan Choon's "ok done
  ald ya" deploy confirmation**, rather than only relying on dev's word: at
  13:08 he told Mei Jia Chee, *"Hii Mei jia. We've finished deploying the
  changes. I tried to check briefly on /uat3. seems like can open the pages
  normally ya"* `(source: Teams, Faizuddin, DM to Mei Jia Chee, 2026-09-22
  13:08)`. No reply from Mei Jia Chee yet as of this check. This is a new,
  useful data point beyond dev's own "done" — Faizuddin himself opened pages
  post-deploy and they loaded without error.
- **⚠️ Environment-name discrepancy, not yet resolved: this message says
  `/uat3`, but every other reference in this file (the 21-09 15:52
  announcement to both CR-group chats, the 22-09 12:05 DM asking Mei Jia when
  UAT breaks for lunch, and Charmain's 09:49 channel question) says `/uat1`.**
  Either this is a slip in Faizuddin's own message (typed the wrong digit) or
  the actual deploy/check target genuinely differs from the announced `/uat1`
  plan — nothing in the thread clarifies which. **Don't assume `/uat1` and
  `/uat3` are the same environment or that this is a harmless typo — confirm
  which one actually holds the 12167 changes before pointing test execution at
  either.**

## TS01 correction, 2026-09-23 — explicit assertion added: no [DO] button while status is New

`[from Faizuddin, 2026-09-23, correcting the combined study artifact's
12166_67_DOSN_TS01 chain]` The E2E chain's first pass through the BO Service
Request Details page (right after the initial `View`, before any shipping
details are entered) must assert **`[DO]` button does not appear** while
Delivery Status = New. This wasn't in the chain's wording as originally
transcribed this session — it only said "Ensure Delivery Status = New" with
no follow-on assertion about the button. The underlying fact was already on
file (`Preconditions and test data` / "What is NOT covered" sections above,
and the dev QA guide's §5.3: "An unshipped (status = New) order shows DO
Number as '-' with no DO button"), but TS01's own click-chain text needs this
explicit assertion added so the automation checks for the button's absence at
that step, not just its presence later once Arranged. **The [DO] button only
ever appears once Delivery Status = Arranged** — never on New, matching the
already-documented New/Arranged/Delivered state table.

## Teams recheck, 2026-09-22 evening — 12166 deploy pushed to "tomorrow morning," reason now specific (senior dev needed for repo + SQL)

`[from Teams, live DMs with Lim Xiwei ("Tracey") and Charmain Ea Chiang, read
live 2026-09-22 ~17:05-17:14 — later than every other section in this file.
Both dedicated CR-group chats (EAINT-12166 and EAINT-12167) and the eAuto QAs
channel were also rechecked at this pass and remain unchanged since the
2026-09-21 15:52 uat1 announcement / 2026-09-22 09:50 channel post already on
file — no new content in either.]`

- **EAINT-12166's deploy has a concrete new timeline: "probably tomorrow
  morning," not just an unscheduled "wait for UAT to clear."** Faizuddin
  asked Lim Xiwei directly at 17:04, *"Hi tracey, are you able to deploy the
  changes for 12166 this evening?"* → Lim Xiwei, 17:05: *"hmm i need senior
  to help deploy one repo and run sql so probably tmr morning :D"* → Faizuddin:
  "ohh okayy no problem. Thanks ya" `(source: Teams, Lim Xiwei, DM, 2026-09-22
  17:04-17:05)`. **This supersedes the earlier framing (13:03-14:21 section
  above) that the only blocker was making way for Mei Jia's UAT** — that may
  still be true as a contributing factor, but the concrete blocker as of this
  evening is a **technical dependency (needs a senior dev to deploy one repo
  and run a SQL script)**, not purely an environment-scheduling one.
- Faizuddin relayed the same update to **Charmain** immediately after: 17:05,
  *"For 12166, dev need senior help to deploy the repo and run sql, so
  tomorrow morning can deploy"* → Charmain, 17:14: *"okie thanks for the
  update"* `(source: Teams, Charmain Ea Chiang, DM, 2026-09-22 17:05-17:14)`.
  This closes the loop Charmain opened earlier at 14:26 ("please follow up
  with dev again on 12166 EOD today") — the EOD follow-up happened and
  produced this answer.
- **Practical implication:** whoever picks up EAINT-12166 next should expect
  it to land on uat1 (or wherever it's deployed) **the morning of 2026-09-23
  at the earliest**, contingent on senior-dev availability — re-verify rather
  than assuming it's live, since this is still a "probably," not a confirmed
  deploy.

## Teams recheck, 2026-09-23 morning — 12166 deployed to uat1 as predicted, testing underway on both tickets

`[from Teams: EAINT-12166 dedicated CR-group chat, and the eAuto QAs channel's
Huddle Agenda (23/09/2026) post, both read live 2026-09-23. The EAINT-12167
dedicated CR-group chat was also rechecked and remains unchanged since the
2026-09-21 15:52 uat1 announcement already on file — no new content there.]`

- **EAINT-12166 landed on uat1 this morning, confirming the "probably tomorrow
  morning" prediction from the 2026-09-22 evening section above.** Lim Xiwei
  ("Tracey," 12166's dev) posted to the dedicated CR-group chat: *"hi all,
  EAINT-12166 is ready in staging/uat1"* `(source: Teams, Lim Xiwei, EAINT-12166
  CR-group chat, 2026-09-23 09:32)`. Two thumbs-up reactions followed, no
  further discussion. This resolves the open item from the prior session's
  handoff ("re-verify rather than assume it's live") — it is now live.
- **Testing has started on 12166, at 0% so far** and **12167 is now 50% through
  (pass-only count)** — per Faizuddin's own Huddle Agenda post: **EAINT-12166 —
  "QA will start testing today," Overall CR Testing Progress: 0/32 (0.00%)**;
  **EAINT-12167 — "Continue testing," Overall CR Testing Progress: 19/38
  (50.00%) - Pass Only** `(source: Teams, Faizuddin, eAuto QAs channel, Huddle
  Agenda 23-09-2026, posted ~09:38-09:48)`. This is newer and more specific
  than any progress figure previously on file for either ticket — treat 32 as
  12166's current TS count for CR testing purposes (note: this differs from
  the "24 TS" figure recorded in the 2026-09-22 session handoff/knowledge
  note — the 32 here may include additional TS added since, or count
  differently; not reconciled in this session, flag for whoever executes
  against it) and 38 matches 12167's already-recorded total.
- No new content turned up in either dedicated CR-group chat beyond the 09:32
  deploy announcement above (12166) — 12167's chat is still silent since the
  21-09 15:52 uat1 announcement.

## Teams recheck, 2026-09-23 late morning — no new content since the Huddle Agenda; one dated discrepancy surfaced from re-reading Faizuddin's own EOD-update history

`[from Teams: full re-search of both the eAuto QAs channel and Faizuddin's own
self-chat (his private notes-to-self scratchpad) for both ticket keys, plus
both dedicated CR-group chats, all rechecked live 2026-09-23 late morning.
Teams' own search bar was used, filtered to "Today" first (confirmed nothing
past the 09:38-10:02 Huddle Agenda posts already on file — the 10:02 one is
just Faizuddin re-pasting the same agenda into his own self-chat, not new
content), then unfiltered to review his historical EOD-update posts in full for
anything not yet folded in.]`

- **⚠️ Flagging, not resolving, a dated contradiction about concurrent/
  concurrency TS status for 12166/12167 found while re-reading Faizuddin's own
  EOD-update history.** His **Monday (2026-09-21) 18:45 EOD post** states, for
  EAINT-12166: *"Drafted TS for functional and concurrent flow with
  EAINT-12167"* `(source: Teams, Faizuddin, eAuto QAs channel, "Faizuddin - EOD
  Update," posted Monday 18:45 — note the post's own title text says
  "21-09-2026 6:15 AM," an internal date/time label that doesn't match the
  actual post time; treat the Teams-assigned timestamp as authoritative)`. Read
  plainly, this says concurrent (concurrency/race-condition) TS had already
  been drafted for this ticket pair by end of day 21 Sept. **This appears to
  conflict with what's already on file from the very next day's session**: the
  2026-09-22 Dev QA Guide section above lists *"Concurrency TS still not
  drafted — the two dialog messages captured live this session answer 2 of 8
  'questions for dev,' but no TS have been written from them yet"* as an open
  item, and the 09-21 afternoon recheck section (sourced from an 11:37-11:42
  DM with Charmain, earlier the same day as this EOD post) has Faizuddin
  telling her concurrent TS "not yet... currently starting for 12166, so will
  do it together." **Not reconciled in this session** — possible explanations
  include the EOD post being a same-day plan/self-report that didn't hold up,
  wording ambiguity ("functional and concurrent flow" could mean "tested the
  functional flow, concurrently with 12167" rather than "drafted concurrency
  TS"), or the 09-22 session's "still not drafted" note itself being stale.
  Whoever next touches concurrency TS for either ticket should ask Faizuddin
  directly rather than trust either source alone.
- **No other new content.** Faizuddin's Tuesday (2026-09-22) 18:40 EOD post
  (title text also misdated "21-09-2026 6.20 PM," same labelling quirk as
  above) reports EAINT-12166 as *"Completed TS - 8 Combined E2E & 24 Functional
  Scenarios, Pending dev to deploy to staging /uat1"* and EAINT-12167 as
  *"Started testing, Issue Raised: EAINT-12394, Overall CR Testing Progress:
  19/38 (50.00%) - Pass Only"* `(source: Teams, Faizuddin, eAuto QAs channel,
  EOD Update, posted Tuesday 18:40)` — both figures already match what's on
  file (24 TS/8 combined E2E for 12166 from the 09-22 handoff; 19/38 50% for
  12167 already recorded via the 09-23 Huddle Agenda). This just confirms the
  50% figure was already reached by EOD 09-22, not newly hit the morning of
  09-23 — a minor timing clarification, not a new fact.
- Both dedicated CR-group chats (EAINT-12166, EAINT-12167) were reopened once
  more and remain unchanged from what's already on file above — 12166 ends at
  the 09:32 deploy announcement, 12167 still silent since 21-09 15:52.

## First live DO PDF captured, 2026-09-23 — Report Engine confirmed working again

`[verified: live PDF, _reference/tickets/EAINT-12167/Delivery_Order_SR69001394
Sample.pdf, staging.eauto.my/uat1, 2026-09-23, generated by Faizuddin clicking
[DO] on the same SR69001394 record tracked earlier this session — the one
that had been throwing "Delivery Order could not be generated" while Report
Engine was down]` The click succeeded this time and produced a real PDF —
**Report Engine is reachable on uat1 again**, at least for this record. This
resolves several points that were previously only documented, never seen:

- **Every static field renders exactly as dev's guide described:** Delivery
  Order No. `20260923/DP-0004` (matches the confirmed `yyyyMMdd/DP-000N`
  scheme); Company Name/Reg./Address/Tel pulled straight from the Company
  Management record captured earlier this session (`FAIZUDDIN AUTO TEST
  (030311-A)`, `24, JALAN SULAM EMPAT, 19/14D`); both serials
  (`SNSFG23T3D`, `AS2GW45HSB`) match the ones keyed into the Update Shipping
  Details popup for this same SR, captured earlier; "Issued by" name is
  **Jason Seah** — the same BO user whose name appeared in the header of the
  BO SR Details page captured earlier for this SR, confirming Issued-by =
  the officer who keyed the serials, not whoever clicks DO.
- **Appointment Slots section header text confirmed verbatim:** *"Appointment
  Slots — one per device unit"*, laid out as two numbered columns, each row
  reading `<day>, <DD Mon YYYY> · <h:mm am/pm> – <h:mm am/pm>` (e.g. `Wed, 04
  Nov 2026 · 10:00 am – 12:00 pm`). One row per device (2 devices → 2 rows),
  matching REQ's "per device unit" rule — extra installations have no
  visible effect here, as already documented.
- **Payment Amount wording confirmed live, but only the zero-extras case:**
  *"RM 1700.00, TWO SOFTWARE INSTALLATION"* for a 2-device order with no
  extra installs purchased — the word count ("TWO") equals the device
  quantity here, exactly as expected when quantity = install count. **This
  does NOT yet confirm the quantity + extras arithmetic** — no live PDF with
  actual extra installations purchased exists yet, so whether the word count
  correctly becomes "quantity + extras" (not just quantity) is still
  unverified. Get one more capture: a purchase with extra installs actually
  selected in step 3 (Appointment), then its DO.
- **Filename note:** the file is named `Delivery_Order_SR69001394 Sample.pdf`
  — matches dev's guide's stated pattern `Delivery_Order_<SR ref>.pdf`, but
  the trailing `" Sample"` looks like Faizuddin's own rename after saving,
  not necessarily the literal browser-downloaded filename. **Confirm the
  exact downloaded filename (unrenamed) before asserting it in a TS.**
- **No split annotation shown** — correct, this is a 2-unit order, well under
  the 20-unit split threshold, so `"Split order · N of M · X units total"`
  correctly does not appear. Still no live capture of an actual 21+ unit
  split PDF.
- **Layout matches the mockup's described shape** — logo top-left, bordered
  tables, English + Malay labels throughout, "ADMIN" designation under
  Issued-by, "Device Warranty : 1 YEAR" remark — all as dev's guide claimed.

**Still outstanding after this capture:** the extras-arithmetic case on
Payment Amount, a 21+ unit split-order PDF, and confirming the literal
downloaded filename (not a renamed copy).

## Both remaining PDF gaps closed, 2026-09-23 (same session, minutes later)

`[verified: live PDFs, both in _reference/tickets/EAINT-12167/ —
"Delivery_Order_2_Extra_Installations Sample.pdf" and
"Delivery_Order_25_Orders Sample.pdf", staging.eauto.my/uat1, 2026-09-23]`

**Extras arithmetic — CONFIRMED.** A 2-device order with 2 extra
installations purchased on top shows `Payment Amount : RM 1808.00, FOUR
SOFTWARE INSTALLATION` — 2 devices' free installs + 2 extras = 4, spelled
out in words. This is the first live proof the word count really is
quantity + extras, not just quantity (the earlier 2-unit/0-extras capture
couldn't distinguish the two). No breakdown is shown anywhere — it's one
combined number, exactly as documented, with no way to tell from the DO
alone how much was free vs. paid extra.

**"No appointment selected" message — now seen live, and it's a distinct UI
element, not plain text.** Both this capture and the 25-unit split capture
below have no appointment booked, and both render it the same way: under
the "Appointment Slots — one per device unit" header, a **shaded, bordered,
centered, italicized box** reading *"No appointment has been selected yet —
to be arranged with the UCD."* — replacing the two-column slot table
entirely (not appended below it). Matches the exact wording already on file,
now confirmed as its own callout box, not an inline sentence.

**25-unit split order — mostly confirmed, but one claim from the mockup
cross-check is WRONG, live evidence overrides it:**
- Two DOs generated, `20260924/DP-0001` (Split order · 1 of 2 · 25 units
  total, 20 devices, serials row-numbered 1–20) and `20260924/DP-0002` (2 of
  2, 5 devices). Split annotation wording and "N of 2 · X units total"
  format confirmed exactly as documented.
- **CORRECTION to the mockup-derived claim "serials numbered continuously
  across the split":** live output shows the **row index restarts at 1** on
  the second page (device rows 1–5), it does **not** continue as 21–25.
  The mockup-based session note earlier in this file (2026-09-21) asserted
  continuous numbering "matches the mockup's generator" — that assertion is
  now shown to be **wrong for the real build**. The actual serial *values*
  (e.g. `46EBD5RF6NG7`) are of course still unique per device; it's only the
  **printed row number label** that resets per page, not a transaction-wide
  running count.
- Both pages show the **same** Payment Ref./Date, Payment Amount (`RM
  21250.00, TWENTY-FIVE SOFTWARE INSTALLATION` — 25 devices, 0 extras, word
  count = quantity again), Issued-by name/date — confirms these are
  transaction-level fields repeated identically on every split page, not
  recalculated per page.
- **New nuance on the date-prefix rule:** this 25-unit split's DO numbers
  carry the `20260924` date prefix, but the printed **"Date" field on the
  document itself reads "23 SEP 2026"**. Same split seen on the 2-extra-
  installs DO above (`20260924/DP-0003`, Date field also "23 SEP 2026").
  So **the DO number's date prefix and the document's own printed Date
  field are not always the same value** — consistent with the documented
  "a shipping save after 12:00 noon is dated the next day" rule applying to
  the **number prefix** specifically, while the **Date field** stays the
  actual calendar date the save happened. Don't assume they always match
  when writing a TS around either one.
- **Running counter, no repeats, confirmed live end to end:** the 20-unit
  order and its 5-unit remainder took `DP-0001`/`DP-0002` under the
  `20260924` prefix; the very next shipment saved under the same day-prefix
  (the 2-extra-installs one) took `DP-0003` — sequential, no gaps, no
  repeats, exactly as REQ/dev's guide describe.

**All three PDF gaps flagged earlier this session are now closed.** Nothing
outstanding on the DO PDF itself except: the exact literal (unrenamed)
downloaded filename, and the "Report Engine down" / "incomplete details"
error UI mechanism (still never observed, since Report Engine is working
again as of this session — that gap can only be closed the next time it
goes down).

## Teams recheck, 2026-09-23 midday — second EAINT-12167 bug raised and fixed same day (EAINT-12399, naming issue)

`[from Teams, live DM with Wong Zhan Choon, read live 2026-09-23 ~14:15 —
later than every other section in this file. Both dedicated CR-group chats
(EAINT-12166, EAINT-12167) and the eAuto QAs channel were also rechecked via
Teams' own search, filtered to "Today," and found unchanged since the
09:32-10:02 posts already on file above — no new content there.]`

- **A second bug for EAINT-12167 was raised and fixed within the same
  lunchtime window today**, distinct from EAINT-12394 (already on file).
  Full DM sequence: 12:25 Wong Zhan Choon, continuing yesterday's deploy
  thread: *"i will push the fix bug later lunchtime"* / *"currently only got
  1 bug for ticket EAINT-12167?"* → Faizuddin: *"actually got another one,
  raising right now"* → Zhan Choon: *"okok"* → Faizuddin: *"simple fix, just
  naming issue"* → 12:31 Faizuddin posted
  `https://mfservices.atlassian.net/browse/EAINT-12399` with *"Here ya"* →
  Zhan Choon: *"okok I deliver during lunchtime"* → Faizuddin: *"okekey"* →
  **13:02 Zhan Choon: "ald deployed ya"** → 14:08 Faizuddin: *"Oorait tengs"*
  `(source: Teams, Wong Zhan Choon, DM, 2026-09-23 12:25-14:08)`.
- **New fact: EAINT-12399 exists** — a second, separate bug ticket for
  EAINT-12167, described by Faizuddin only as a "simple fix, just naming
  issue" (no further detail exchanged in this thread on what the naming
  issue actually is — check the Jira ticket directly for the description).
  **Already fixed and deployed as of 13:02 today**, same-day turnaround.
  This brings EAINT-12167's known bug count to at least two: EAINT-12394
  (duplicate-SN popup-vs-inline, already on file) and this new EAINT-12399
  (naming issue). Re-verify the fix on whichever environment holds 12167's
  changes (the unresolved `/uat1` vs `/uat3` discrepancy from the
  2026-09-22 section above still applies here too).

## Teams recheck, 2026-09-24 morning — Report Engine root cause confirmed by dev directly, R1-R5 regression checklist now written (was only "discussed," per 09-23's open item), EAINT-12166's TS count settled at 32

`[from Teams, live DM with Lim Xiwei ("Tracey," dev for EAINT-12166), covering
2026-09-23 11:48-15:42 — later than the 14:15 cutoff on the section above, so
genuinely new. Also checked live: both dedicated CR-group chats (EAINT-12166,
EAINT-12167) — unchanged since 09-23 09:32 and 09-21 15:52 respectively,
nothing new; the eAuto QAs channel through 2026-09-24 09:41 — only Faizuddin's
own routine EOD/to-do posts, no new decisions from anyone else; and DM with
Wong Zhan Choon — unchanged since 09-23 14:08 (already on file above).]`

- **Report Engine outage root cause, confirmed directly by dev (not just
  inferred from documentation as the 09-23 session had to do):** Lim Xiwei,
  11:48: *"i think the report repo didn't deploy properly, i kacau-ing senior
  right now."* This **corrects/sharpens** the prior session's own diagnosis —
  it wasn't simply "a settings value not yet configured on a fresh deploy" as
  guessed at the time, it was **a deploy of dev's own code change that failed
  partway.** At 14:51 Lim Xiwei: *"finally done deploy see if new transaction
  working now?"* → Faizuddin, 14:57: *"okay, its working now, thanks ya."*
  `(source: Teams, Lim Xiwei, DM, 2026-09-23 11:48-14:57)`.
- **The underlying code change, per dev's own explanation (15:16):** *"oh
  previously the url to call the report repo is hardcoded, now we move to a
  single file so its maintainable, this one just test one time happyflow they
  are still working then can dei."* — confirms the Report Engine address used
  to be hardcoded per PDF-generating flow; it's now read from one shared
  settings value instead. This is the change that produced the R1-R5
  regression risk below. `(source: Teams, Lim Xiwei, DM, 2026-09-23 15:16)`.
- **The R1-R5 Report Engine regression checklist — flagged as still-only-
  discussed in the 2026-09-23 session handoff — has in fact already been
  turned into a written checklist and sent to dev**, superseding that "still
  needs to become a written checklist" open item. Faizuddin sent dev (Lim
  Xiwei) an actual artifact image at 15:14 titled *"6 · Regression — Report
  Engine address moved to settings,"* flagged **"NEEDS A DECISION,"** reading:
  *"Run in every environment (SIT, staging, prod smoke). Five existing PDF
  flows used to have the Report Engine address written into the code; they
  now all read it from one settings value. If that value is wrong or missing
  in an environment, all five break at once — so generate each PDF below once
  per environment after deploy."* The five rows:
  - **R1 — Insurance — e-Contract**: generate an insurance e-Contract PDF
    (with and without signature) → expected: PDF downloads and looks as
    before.
  - **R2 — Insurance — CPS8**: generate a CPS8 PDF → expected: PDF downloads
    and looks as before.
  - **R3 — Insurance — Add User Authorization**: generate the Add User
    Authorization PDF and its Declaration PDF → expected: both download and
    look as before.
  - **R4 — eSTM — Buyer Authentication**: complete an eSTM buyer
    authentication that produces the PDF slip → expected: slip generates as
    before.
  - **R5 — Company Management — Print DO (New Registration)**: use the
    existing manual Print DO form under Company Management → expected: prints
    as before — this old form is unchanged apart from where it reads the
    address.
  `(source: Teams, Faizuddin, DM with Lim Xiwei, 2026-09-23 15:14, image
  attachment)`. **Still not executed as an actual smoke pass on uat1** — this
  was sent as a checklist, not run yet; the 2026-09-23 handoff's open item #6
  should be read as "checklist written, execution still pending," not
  "nothing done."
- **New, still-open sub-thread from the same DM**: Faizuddin, 15:26: *"Do you
  know how to access the pages for these reports? cus some of them i cant
  find, even when i ask my seniors."* Lim Xiwei, 15:27: *"hmm this i need time
  to look into it also just let me know what are the remaining and will
  update u when i finish handling one 104 ticket."* Faizuddin, 15:42: *"Okay i
  try to search for it again, if still cannot i'll let you know."* **Unresolved
  as of this check** — dev has not yet come back with page-access help for
  the R1-R5 checklist above, and this is a precondition for actually running
  it. `(source: Teams, Lim Xiwei / Faizuddin, DM, 2026-09-23 15:26-15:42)`.
- **EAINT-12166's TS count of 32 (not 24) now looks settled, not just
  disputed.** The 09-23 handoff flagged "32 vs 24" as an open reconciliation
  item. Faizuddin's own EOD post that same evening (23-09-2026 6:15 PM) and
  his next-morning to-do post (24-09-2026 9:30 AM) **both independently use
  32** as the denominator: *"Overall CR Testing Progress: 5/32 (15.62%) - Pass
  Only"* in both posts, unchanged overnight (no new testing between the two
  posts). This doesn't come with an explicit "we recounted and 32 is right"
  statement, but two independent same-person postings agreeing on 32 over 24
  is stronger signal than the single unreconciled Huddle Agenda mention that
  originally raised the question. `(source: Teams, Faizuddin, eAuto QAs
  channel, "Faizuddin - EOD Update (23-09-2026 6.15 PM)" and "Faizuddin - To
  Do Plan (24-09-2026 9.30 AM)")`.
- **EAINT-12167 progress ticked up one point overnight**: 19/38 (09-23
  Huddle Agenda, already on file) → **20/38 (52.63%)**, per both the 09-23
  6:15 PM EOD post and the 09-24 9:30 AM to-do post. No new bug or scope
  change accompanied this, just one more passing scenario.

## Teams recheck, 2026-09-24 midday — deploy date confirmed (28 Sep), dev asks whether QA testing has started on both tickets

`[from Teams, live check of both dedicated CR-group chats (EAINT-12166,
EAINT-12167) and the eAuto QAs channel, all read live 2026-09-24 around
midday, covering the window after the 09:41 cutoff on the section above.
DM with Lim Xiwei and DM with Wong Zhan Choon were also rechecked — both
unchanged since the timestamps already on file (2026-09-23 15:42 and 14:08
respectively), nothing new in either.]`

- **A concrete deploy date is now on record for both tickets: 28 September
  morning.** Charmain Ea Chiang, eAuto QAs channel, 10:42: *"Hi morning Faiz,
  12166 and 12167 on track to deploy on 28 Sep morning?"* → Faizuddin, 10:43:
  *"Hi morning. Ya, as of now, still on track."* This is new — no prior
  session had a specific deploy date for either ticket, only "probably
  tomorrow" (which resolved to the 09-23 uat1 deploy) and general staging
  talk. `(source: Teams, Charmain Ea Chiang / Faizuddin, eAuto QAs channel,
  2026-09-24 10:42-10:43)`.
- **Dev (Yi Link Lim) asked, in both dedicated CR-group chats, whether QA
  testing has started and asked for the ticket status to be updated** —
  same message posted in each chat within a minute of the other:
  - EAINT-12166 chat, 10:29: *"hi all, Just to check, has QA side start
    testing on this ticket? If yes, can help to update the ticket status?"*
  - EAINT-12167 chat, 10:28 (edited): same wording.
  **Unanswered as of this check** — no reply from Faizuddin or anyone else
  in either chat yet. This is a live, open action item, not just chatter:
  whoever picks this up next should reply/update the Jira status, since
  dev is explicitly blocked on knowing this to proceed.
  `(source: Teams, Yi Link Lim, EAINT-12166 chat 2026-09-24 10:29 and
  EAINT-12167 chat 2026-09-24 10:28)`.

## TS04 automated 2026-09-24 — manual pause/resume for the Report Engine hand-off

Previously excluded because stopping/restarting the Report Engine is a real
infra action only a dev can do mid-run. Per Faizuddin: *"implement a pause
function, where it will pause at a certain time, i ask dev to patch, i
resume the automation, it pause, i ask dev to patch again, and i resume
again."*

`device-purchase-do-ts04.spec.ts` pauses twice via
`tests/service-hub/utils/manualGate.ts`'s `waitForManualResume()` — once to
ask dev to STOP the Report Engine, later to ask dev to RESTART it. Mechanics:

- The run's spawned process gets `PW_GATE_DIR` (set by `run/route.ts`,
  `<recordDir>/_run/gates`) — the gate writes a `<gateId>.waiting.json` file
  there and polls for a `<gateId>.resume` file every 2s (20-minute cap).
- Since `run/route.ts`'s whole HTTP request blocks until the child process
  exits, the dashboard learns the run's folder name (`ts`) through a new
  client-generated `runId` (the same UUID `useBackgroundRuns.startRun()`
  already sends in the POST body) mapped in-memory via
  `lib/eautoRunRegistry.ts` — `register` at spawn time, `resolve` by the new
  `live-log`/`resume` routes, `unregister` on process close.
- `app/api/eauto/12166/live-log/route.ts` (newly wired into this page's
  `startRun` call via `liveLogUrl`) is polled every 2s by the EXISTING
  `useBackgroundRuns` hook — reused as-is, no hook changes — and returns the
  waiting gate as a single marker line: `[GATE:waiting:<gateId>] <message>`.
  The dashboard page parses that back out of `bgRun.liveLog` and shows a
  pause banner + Resume button; clicking it POSTs to the new
  `app/api/eauto/12166/resume/route.ts`, which writes the `.resume` file the
  paused test is polling for.
- Running TS04 outside the dashboard (`npx playwright test` directly) is a
  no-op pause — `PW_GATE_DIR` is unset, so `waitForManualResume()` skips
  straight through. There's no one to click Resume in that context anyway.

**CRITICAL FIX 2026-09-24 (found during a review before the first real dev
hand-off, per Faizuddin: "make sure it will run smoothly so that i dont
have to ask dev to do it again and again and again") — the test's own
timeout would have killed it long before either gate could ever be
answered.** `playwright.config.ts`'s default per-test timeout is only 240s
in detailed mode (60s otherwise) — nowhere near the up-to-20-minutes-per-gate
a dev might genuinely need, across TWO gates. Without a fix, Playwright
itself would have force-failed the test around the 4-minute mark, almost
certainly before a dev even saw the first pause — exactly the repeated-ask
failure mode this whole feature exists to prevent. Fixed with
`test.setTimeout(60 * 60 * 1000)` at the top of TS04's test body (60
minutes — comfortably covers 2×20min gates plus the actual automation
steps). Also bumped `run/route.ts`'s `maxDuration` from 900 to 3600 for the
same reason, though that Next.js route-segment setting only matters on a
platform that enforces it (e.g. Vercel) — irrelevant for local execution,
which is how TS04 must run anyway (a human has to be present to coordinate
with dev in real time). **If any other test ever needs a manual gate, it
needs this same `test.setTimeout()` treatment — the global config timeout
is not enough on its own.**

**FIRST REAL RUN, 2026-09-24 — the manual gate worked exactly as designed**
(waited ~10 minutes for dev to stop the Report Engine, resumed cleanly on
click), the purchase/shipping flow worked, and the Report-Engine-down
behaviour itself matched REQ-006 exactly — but `clickDoExpectingError()`
still failed, because it was checking the wrong page.

**CONFIRMED LIVE: `[DO]` fires via `window.open()` on failure too, same as
the success path** (`downloadWithLabeledVideo`'s own doc comment already
established this for the success case). On a Report-Engine-down failure,
that new popup navigates to a **blank page showing the error text directly**
— not an inline element or dialog on the original page, and not a download
either. The original page never shows this text at all. Fixed
`clickDoExpectingError()` to race for the popup the same way the download
path does, and check whichever page actually received it (falls back to the
original page if no popup opens, in case a future build changes this to
inline). **The exact HTML of that blank error page still hasn't been saved**
— the user had pasted it earlier in the session but no longer has it, and
it was never written to `_reference/` per this repo's standing rule before
it was lost. Capture and save it the next time this runs, so the selector
here can eventually be tightened from a whole-page text search to something
precise.

**Not automated within TS04** (see the spec's own header comment):
- the "incomplete details" DO-generation-error branch — what data actually
  triggers it is still an open question, no known way to arrange it live yet.
- the next-calendar-day DO-number-reset check — needs the run to genuinely
  cross a real day boundary, which a single automated run can't force.

## TS05 automated 2026-09-24 — real legacy records, not fabricated ones

Previously excluded (`NOT_AUTOMATED` in `app/eauto/12166/page.tsx`) because a
fresh automation run can only ever create NEW records, and TS05 specifically
needs a transaction that predates the 12166/12167 release. Per Faizuddin:
*"select any transactions with the appropriate status from before 15/9/2026...
if its possible to not change the status, avoid changing it. but if the
scenario requires for it to move on, then change the status, no issue."*

`device-purchase-do-ts05.spec.ts` now searches the real BO
`Biometric Device Purchase & Software Installation Listing` for whatever
pre-release records genuinely exist (Date Requested between 01-01-2020 and
14-09-2026 — the day before the assumed 2026-09-15 cutoff), and skips a leg
gracefully with a clear reason if none qualify, rather than inventing one.
Every check TS05 needs is read-only (View + assert), so no record's status is
ever advanced — the "change status if the scenario requires it" permission
was granted but never actually needed here.

**BO listing has a real `serviceType` filter** the page object didn't expose
yet — `select[name="serviceType"]`, values `""` (All) / `SOFTWARE_INSTALLATION`
/ `BIOMETRIC_PURCHASE` `[verified: live HTML,
_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html]`.
Added to `SoftwareInstallationListingPage.searchWithFilters()` — needed
because this listing combines both service types, and the `deliveryStatus`
filter alone doesn't scope out Software Installation rows on every deployment.
Also added `getRowServiceType()` and `getRowDateRequested()` getters (same
header-lookup-with-column-offset-fallback pattern as the existing row
getters) so a picked row's real service type and date can be logged, not just
assumed from the filter.

**CORRECTED 2026-09-24 — the click-chain's "no Serial Number column" step is
stale, don't re-assert it.** First live run picked a record dated TODAY
(24-09-2026) despite `requestedTo: "14-09-2026"`, and the test's final
assertion ("listing must never show a Serial Number column") failed — but
that specific assertion was wrong regardless: this listing's own capture
(`_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html`,
2026-09-22) already confirmed live that a **"Device Serial No." column DOES
exist** — that capture resolved an earlier SRD-vs-dev-guide contradiction in
*favour of the column existing* (REQ-011). The combined study artifact's
`12166_67_DOSN_TS05` click-chain predates that resolution and was never
updated. Flipped the assertion to expect the column present.

**Date Requested filter — default system behaviour** `[Faizuddin, 2026-09-24
— not yet captured via live HTML, add a capture next time this runs]`:
- Selecting a "From" date auto-sets "To" = From **+ 1 calendar month**. There
  is no way to search a wide multi-year range in one request — the
  effective search window this listing (and likely other listings sharing
  the same filter widget) can return is capped at one month.
- Results sort **latest-first**. So a search with "From = 15/9" still shows
  TODAY'S record at the top of the list whenever today falls inside that
  auto-set one-month window — which it will, for any recent From date.
- **Why this broke TS05's first live run — REVISED, the real cause was
  narrower than first suspected:** the test set `requestedFrom` to a
  far-past date and `requestedTo` to the release cutoff, expecting a wide
  historical range. Fixing the math to a proper one-month window (from
  14-08-2026 to 14-09-2026, matching the auto-fill behaviour) still returned
  today's record. That isolates the actual bug:
  `SoftwareInstallationListingPage.setDateInput()` was setting the input's
  `.value` directly and firing a generic `change` event — a technique
  confirmed to work for a DIFFERENT field on a DIFFERENT form
  (`#op-ship-date` in the Update Shipping Details popup, where the raw POST
  payload was confirmed to just read the input's literal value). This
  listing's search does not behave the same way: the raw-value approach
  never registered at all, and the search silently fell back to its default
  unfiltered "latest 50" results every time, regardless of what date range
  was requested. **Don't assume a `.value`-bypass trick that worked on one
  form works on another — each form's real JS wiring needs its own
  confirmation.**
- **Fix, in `SoftwareInstallationListingPage.setDateInput()`:** drive the
  input through the widget's own `$(el).datepicker("setDate", date)` API
  instead of raw `.value` assignment — this is the same code path a real
  calendar-day click takes (formats the value, fires the widget's own
  `onSelect`), which is what the search actually depends on. Falls back to
  the raw-value method only if jQuery/the datepicker instance can't be found
  on the element (defensive; shouldn't trigger in practice on this app).
- **Also kept, in `device-purchase-do-ts05.spec.ts`'s `findPreReleaseRow()`:**
  search a genuine one-month-wide window ending AT OR BEFORE the desired
  cutoff, stepping back a month at a time (up to 24 months) if a window
  returns nothing, rather than requesting an oversized range. Every picked
  row's own Date Requested is re-verified against the cutoff before use, so
  a future regression in either the widget-driving method or this
  auto-fill behaviour fails loudly at the pick step with a message naming
  the filter, instead of silently testing the wrong (non-legacy) record.
- **Applies beyond TS05:** any future automation against a "Date Requested
  From/To" (or similarly-paired) filter on this listing, or on any other
  eAuto listing sharing the same filter widget, should assume this same
  1-month-auto-fill + latest-first-sort behaviour by default, not a wide
  free-form range.

**BO listing sees every company's transactions; UCD listing only sees the
logged-in account's OWN company's** `[confirmed live, 2026-09-24]`. TS05's
first company-blind pick found a perfectly real legacy record on the BO
side (SR69001381), then that same reference 404'd on the UCD Service
Request Listing — not a bug, just a scope mismatch: the UCD test account
can only ever see its own company's requests. **Applies to any future
automation that picks a BO-visible record and then expects to find it
again on the UCD side** — always scope the BO search to the UCD test
account's own company first (`companyName` filter on
`SoftwareInstallationListingPage.searchWithFilters()`), or the pick is a
coin flip.

**TS05 DESCOPED TO BO-SIDE ONLY, 2026-09-24, per Faizuddin — his
environment has no transactions from the previous month.** The company-scope
fix above was implemented (`findPreReleaseRow()` took an optional
`companyName` filter, New-status leg scoped to `COMPANY = "FAIZUDDIN AUTO
TEST"`), then immediately removed along with it: the UCD-side "Service
Request Details shows '-'" check and the ">40 quantity clamp" check both
need a UCD login and a record scoped to that account's company, and neither
is available right now. `device-purchase-do-ts05.spec.ts` currently only
runs the two BO-listing checks (no `[DO]` button pre-release; DO Number
`-` + no button on a New-status legacy record) and the Serial No. column
check — all BO-only, no `companyName` filter needed since nothing gets
reused on the UCD side anymore. **Re-add the UCD-side legs (and the
company-scoping they need) once a genuinely pre-release transaction exists
for the account this suite logs in as.**

**Company name is a second hardcoded, QA-identity-tied fixture, same shape
as credentials — not yet made portable.** `COMPANY = "FAIZUDDIN AUTO TEST"`
(used in `device-purchase-do-ts03.spec.ts`, and previously in TS05 before
the descope above) is a literal string, not derived from `ENV` the way
`ucdUsername`/`ucdPassword` already are. Another QA running this suite
under their own login (different company, e.g. `KeretaBersatu` /
`QAUser001`) would have TS03 fail outright (searches Company Management for
a company that doesn't exist under their account) rather than skip. If this
suite is ever shared with other QAs, the company name needs the same
treatment as the login credentials — a config value (e.g.
`EAUTO_UCD_COMPANY`) read through `ENV`, with a matching dashboard form
field — not a hardcoded literal. Not done yet; flagged here so it isn't
forgotten if/when sharing this suite comes up again.

## Teams recheck, 2026-09-24 midday (later) — EAINT-12404 reopened with dev, unresolved

`[from Teams, live DM with Wong Zhan Choon ("Zack," 12167 dev), 2026-09-24
11:57-12:00 — new content, later than the 09:41-10:43 cutoff already on file
above. Both dedicated CR-group chats (EAINT-12166, EAINT-12167) and the eAuto
QAs channel were also rechecked live and remain unchanged since the Yi Link
Lim 10:28/10:29 "has QA testing started" question already on file — still no
reply from Faizuddin or anyone else in either chat as of this check. DM with
Lim Xiwei ("Tracey," 12166 dev) also rechecked, unchanged since 2026-09-23
15:42, already on file.]`

- **⚠️ Possible re-opening of EAINT-12404 (the "only the LATER duplicate-SN
  occurrence gets flagged, not the first" behaviour), not yet resolved either
  way.** Faizuddin asked Wong Zhan Choon directly: *"Hi Zack, can help take a
  look at this?"* → Zhan Choon: *"yea what is it"* → Faizuddin: *"the display
  of error message for duplicated fields"*, then pasted
  `https://mfservices.atlassian.net/browse/EAINT-12404` → Zhan Choon: *"hmmm"*
  / **"it depends tho"** `(source: Teams, Wong Zhan Choon, DM, 2026-09-24
  11:57-12:00)`. This is the entire exchange — no further reply from either
  side as of this check, and Zhan Choon's "it depends tho" is not explained
  (depends on what isn't stated in the thread).
- **This directly concerns the already-recorded fact above**: *"Duplicate-SN —
  which field gets flagged, CONFIRMED 2026-09-24... the LATER occurrence shows
  the error, the FIRST occurrence shows no error at all. This is expected
  behaviour, not a bug — QA-Issue EAINT-12404 was raised over this exact
  observation..., then closed once Faizuddin confirmed the current behaviour
  is the intended one."* That "closed, confirmed intended" note was written
  earlier the same day as this DM (per the file's own section ordering) — this
  DM is Faizuddin himself going back to dev afterward, and dev's only answer so
  far ("it depends tho") reads as **not a clean confirmation that closing the
  issue was correct** — it could mean the behaviour is more conditional than
  the earlier "confirmed intended" note assumed. **Don't treat the EAINT-12404
  close as final until this thread gets an actual answer** — flag for whoever
  picks this up next to ask Zhan Choon directly what "it depends" refers to,
  rather than re-asserting either the "closed, intended" or "reopened, bug"
  framing as settled.

## Teams recheck, 2026-09-24 afternoon — asked dev to deliberately stop Report Engine for TS04's capture, dev lacks permission

`[from Teams, live DM with Lim Xiwei ("Tracey," 12166 dev), 2026-09-24
14:09-14:11 — later than the 11:57-12:00 cutoff on the section above. Both
dedicated CR-group chats (EAINT-12166, EAINT-12167), the eAuto QAs channel, and
DM with Wong Zhan Choon were also rechecked live and remain unchanged since the
timestamps already on file above — no new content in any of them.]`

- **Faizuddin directly asked for the controlled Report Engine outage TS04 has
  been waiting on**: *"Hi tracey, is it possible to disable the report engine
  for like a minute or two?"* → Lim Xiwei, 14:10: *"hmm its possible but i dont
  have the permission so myb can ask seniors"* → Faizuddin, 14:11: *"ahh okay
  thanks. i'll ask them"* `(source: Teams, Lim Xiwei, DM, 2026-09-24
  14:09-14:11)`.
- **New fact: 12166's own dev cannot stop Report Engine herself** — it needs a
  senior's involvement, the same "need senior to help" pattern already on file
  from the 2026-09-22 evening deploy section (senior needed to deploy one repo
  and run SQL). This directly affects the still-open TS04 gaps documented under
  "TS04 automated 2026-09-24" and "What's NOT covered": the "Report Engine
  down" / "incomplete details" error UI has still never been captured live, and
  this exchange shows why progress on that has stalled again — the request has
  moved from "no one asked yet" to "asked, dev can't do it alone, will chase a
  senior," but no senior has been looped in or replied as of this check. Not
  resolved — whoever picks this up next should follow up on whether Faizuddin
  reached a senior, rather than assume this request is still pending in the
  same place.
- A separate DM with Charmain Ea Chiang (23/09 11:40-12:13) surfaced a "UCD
  Receipt Page" naming discussion resolving to "Transaction Details Page" —
  checked and confirmed **out of scope for this ticket pair**: Faizuddin's own
  message frames it explicitly as *"during the shopping cart tickets"*, a
  different module, not EAINT-12166/12167's already-resolved "UCD Receipt page
  is really the Service Request Details page" naming correction. Noted here
  only so a future session doesn't conflate the two "Receipt page" naming
  questions — they are different tickets' pages with a coincidentally similar
  question, not the same fact.

## Teams recheck, 2026-09-25 morning — testing close to done on both tickets, dev asks for a happy-flow walkthrough "latest by today," Faizuddin's own review request to Charmain still not actioned

`[from Teams, live check 2026-09-25 morning: DM with Charmain Ea Chiang
(new content found dated 2026-09-24 17:24-17:31, not previously on file),
both dedicated CR-group chats (EAINT-12166, EAINT-12167 — same new message
posted in each, 2026-09-25 08:48/09:09), and the eAuto QAs channel
(Faizuddin's own 2026-09-25 9:20/9:32 AM to-do post). Nothing else in any of
these threads was new past what's already captured above.]`

- **Faizuddin asked Charmain Ea Chiang (DM) to review his test scenarios
  before closing out, and set a self-imposed finish target of "lunch"
  the next day (25 Sept).** *"Hi Charmain. Sorry to disturb you but i've
  almost finished testing 12166 & 12167. Whenever you're available, can you
  review my existing scenarios, in case i might've missed some. I plan to
  finalize and close everything by lunch tomorrow if possible"* → Charmain,
  same thread: *"Hi Faiz, okie noted ya, thanks for the update but im
  currently abit occupied with other CRs will review them tmr ya i will
  update you again"* → Faizuddin: *"okay, thanks a lot ya."* This exchange
  predates (and explains) the "wrap up by lunch" wording in the 09-25
  to-do post below — it's Faizuddin's own target, not something Charmain
  committed to a specific time for. **As of this check, Charmain has not
  yet sent the review or the "update" she promised.** `(source: Teams,
  Muhammad Faizuddin Bin Bidi / Charmain Ea Chiang, DM, 2026-09-24
  17:24-17:31)`.
- **Progress numbers moved since the 09-24 EOD figures (5/32 and 20/38):
  EAINT-12166 now 25/30 (83.33%), EAINT-12167 now 29/29 (100%), pass-only.**
  Per Faizuddin's own "To Do Plan (25-09-2026 9.20 AM)" post in the eAuto QAs
  channel: EAINT-12166 status *"To wrap up testing by lunch"*; EAINT-12167
  status *"To re-check scenarios and wrap up by lunch"* (with the note "E2E
  is combined in EAINT-12166" repeated as before). **This changes the
  denominator again — 12166 is now counted out of 30 (not 32, not 24) and
  12167 out of 29 (not 38)** — a further, unreconciled shift in the TS-count
  discrepancy that prior sessions already flagged as unsettled; still no
  explicit "we recounted, here's why" statement accompanying the change, just
  a new number appearing in the daily post. `(source: Teams, Faizuddin, eAuto
  QAs channel, "Faizuddin - To Do Plan (25-09-2026 9.20 AM)," posted 09:32)`.
- **Dev (Yi Link Lim) posted the same new ask in both dedicated CR-group
  chats: confirm whether the happy flow is ready for a walkthrough, because
  "SA side" needs to walk through with Ops "latest by today."** Exact wording,
  posted within ~20 minutes of each other:
  - EAINT-12166 chat, 08:48: *"Can QA side help to confirm whether happy flow
    for this ticket is ready for walkthrough? SA side need to have a
    walkthrough session with Ops latest by today ya"*
  - EAINT-12167 chat, 09:09: identical wording.
  **Unanswered in both chats as of this check** — this is a live, same-day
  deadline blocking a downstream SA/Ops walkthrough, distinct from (and more
  time-pressured than) the still-unanswered "has QA testing started" question
  from 09-24 that sits directly above each of these messages in their
  respective threads. Charmain also re-pinged Faizuddin by name in both chats
  at 08:38, quoting Yi Link Lim's original 09-24 10:28/10:29 question: *"Hi
  morning Muhammad Faizuddin Bin Bidi, can help to update on this?"* — also
  still unanswered. `(source: Teams, Yi Link Lim / Charmain Ea Chiang,
  EAINT-12166 chat 2026-09-25 08:38/08:48 and EAINT-12167 chat 2026-09-25
  08:38/09:09)`.

## Teams recheck, 2026-09-25 late morning — happy-flow walkthrough confirmed ready, in both dedicated chats

`[from Teams, live check ~10:34, both dedicated CR-group chats (EAINT-12166,
EAINT-12167) — the same reply posted verbatim in both, directly answering
the "SA side needs a walkthrough with Ops latest by today" question already
on file from the 08:48/09:09 section above. The eAuto QAs channel and
Faizuddin's DM with Charmain Ea Chiang were also rechecked and remain
unchanged since the 09:32 to-do post and Yesterday-17:31 messages already on
file — no new content in either.]`

- **Faizuddin answered Yi Link Lim's walkthrough-readiness question, the
  same wording in both chats:** *"Hi. Ya, the happy flow is ready for
  walkthrough"* `(source: Teams, Faizuddin, EAINT-12166 chat 2026-09-25
  10:34 and EAINT-12167 chat 2026-09-25 10:34)`. This resolves the "live,
  same-day deadline" item flagged as unanswered in the section above — SA
  can now proceed with the Ops walkthrough for both tickets. No reply from
  Yi Link Lim yet in either chat as of this check.
- **The separate "has QA testing started / update the ticket status"
  question (Yi Link Lim, 09-24 10:28/10:29, re-pinged by Charmain 09-25
  08:38) is still not explicitly answered** — the 10:34 reply only confirms
  happy-flow readiness for the walkthrough, it does not itself state the
  Jira status was updated or say "yes testing has started" in so many words.
  Treat as a strong implicit signal (testing must be far enough along for a
  happy-flow walkthrough to be offered) but not a direct answer to that
  specific question — don't assume the Jira status field has actually been
  updated without checking Jira directly.

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Test titles are Charmain's tested expectations,
not verified behaviour. Inventory and verdicts: `script-inventory-team.md`.

### Special Remark (EAINT-12131) — BDP / SI Transaction Details, BackOffice

The spec's own header calls the screen "BDP Transaction Details".
`[charmain-repo: intake/reports/charmain-12131-migration.md:89-94]` Rules her
38-case spec asserts (verbatim titles, `charmain-12131.json`):

1. "TC-01 Special Remark field is editable"; "TC-02 Dedicated Update button + confirm dialog" `[charmain-repo: intake/reports/charmain-12131.json:244-245]`
2. "TC-10 Exactly 500 chars saves fully"; "TC-11 >500 chars is capped by maxlength (type + paste)" `[charmain-repo: intake/reports/charmain-12131.json:251-252]`
3. "TC-23 Listing \"Special Remarks\" column flags the transaction" `[charmain-repo: intake/reports/charmain-12131.json:258]`
4. "TC-39 Special Remark belongs to the appointment, not the whole request"; "TC-40 Export: Special Remarks flag is per appointment; siblings may be indistinguishable" `[charmain-repo: intake/reports/charmain-12131.json:261-262]`
5. "TC-28 Concurrent edit — last write wins, no corruption" `[charmain-repo: intake/reports/charmain-12131.json:264]`
6. "TC-24 Special Remark editable + saveable on a Software Installation txn" `[charmain-repo: intake/reports/charmain-12131.json:269]`
7. "TC-35 Listing Export is role-gated — absent for CSE, present for Ops" `[charmain-repo: intake/reports/charmain-12131.json:274]`
8. "TC-36 A CSE the SRD omits can edit Special Remark on BDP (team-wide entitlement)" `[charmain-repo: intake/reports/charmain-12131.json:275]`
9. "TC-38 CSE cannot update the delivery-related fields (only Special Remark is carved out)" `[charmain-repo: intake/reports/charmain-12131.json:276]`
10. API: "TC-17 Edit-capable update authorised at API"; "TC-18 Read-only role rejected at API" `[charmain-repo: intake/reports/charmain-12131.json:204-205]`
11. Data trap: two skips are data-dependent ("no multi-appointment request in this
    date range"). `[charmain-repo: intake/reports/charmain-12131-migration.md:86-87]`
12. Role trap: the read-only leg switches the role of `BOChar`, "a shared UAT
    account", and a `finally` returns it to Hub Admin. Do not run it in parallel with
    anyone using that account. `[charmain-repo: intake/reports/charmain-12131-migration.md:32-35]`

Relation to item 9: the CSE carve-out (only Special Remark editable) matters for
EAINT-12167, which lets Ops input Device SN on the same Service Request Info page.
`[unconfirmed]` whether CSE can see the SN field.

### Charmain's SI/BDP suite (EAINT-10960 / EAINT-11880)

1. Folder `by-module/shopping-cart-si-bdp/automation/`. Executed families: 114
   `bdp-e2e-*`, 99 `si-e2e-*` (some with `b` variants), 20 `bdp-prc-*`, 14
   `si-prc-*` (`prc` = pricing). Outside the inventory: 32 `x-*` "design-stage
   catalogue and abuse-path probes" and one `_retest`. `[charmain-repo: intake/sources.yaml:127-129]`
   `[charmain-repo: intake/reports/charmain-shopping-cart.md:27-273]`
2. Library: `harness.js`, `si-flow.js`, `bdp-flow.js`, `pricing-flow.js`,
   `cross-check.js`, `email-contracts.js`, `report-flow.js`, `annotate.js`, plus
   `mailtrap` and `rules`. `[charmain-repo: intake/reports/charmain-shopping-cart.md:1769-1785]` `[charmain-repo: intake/briefs/charmain.md:120]`
3. Hosts in the code: `staging.eauto.my`, `www.citylinkexpress.com` (courier
   tracking link), `mailtrap.io`. `[charmain-repo: intake/reports/charmain-shopping-cart.md:1795-1799]`
4. No `expect()` anywhere; verification is 702 `h.step()` calls on the raw
   `playwright` library. 14 GB of run artefacts were left out. `[charmain-repo: intake/sources.yaml:129]`
5. Use: coverage checklist against `tests/service-hub` (our benchmark suite), not
   code to copy. Scenario files by number are the fastest way to find a case for
   EAINT-12123 (Reference No.), EAINT-12124 (BDP email CC), EAINT-12087 (SI slot
   expiry), EAINT-12099 (inventory) and EAINT-12333 (Proforma Invoice).
