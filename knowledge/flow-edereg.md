# eDereg (AATF) — Pre-Checking compulsory gate (EAINT-9306)

Supersedes the architecture-only version of this file `[from Faizuddin,
2026-08-20]`. The detail below adds the actual flow/test-scenario content from
two sources: the dev's QA test guide (Claude artifact, `[from dev, shared
2026-08-21]`) and the QA test plan
`_reference/tickets/EAINT-9306/[eAuto - AATF] Deregistration - Test Plan (2).pdf`
`[from Faizuddin, 2026-08-21]`, which also carries Faizuddin's own coverage
notes embedded in it ("Faiz's Notes" section). The AATF-side URL map and DOM
handles (§3, §4) were added 2026-08-21 from live HTML captures; the
Back-Office side is still not captured (see §9).

## 1. Why this matters

EAINT-9306 makes eDereg Pre-Checking (DPC) a compulsory gate before an AATF
company can create a Deregistration transaction: "A Deregistration can no
longer be created unless the vehicle already has an Approved + Paid +
JPJ-Approved eDereg Pre-Checking whose JPJ approval is within the last 6
months." **The new Dereg flow differs from the old one** — the QA test plan
explicitly warns "use the old flow for reference only," so don't assume old
Dereg automation (if any exists) still matches step numbering or gating
behaviour.

First automation work in the AATF portal / eDereg module / STMS-for-AATF
space — no prior flow document exists for any of these modules.

## 2. Entry points

Two distinct flows reach the same gate, both **verified** from the test plan:

- **"Pre-check done in enquiry" flow** — the AATF user creates an eDereg
  Pre-Checking Enquiry directly (own screen/entry point) *before* starting a
  Deregistration transaction. By the time they reach Deregistration Step 2 and
  enter the vehicle number, a qualifying pre-check already exists, so the gate
  passes immediately (or shows the appropriate failure state if the existing
  pre-check doesn't qualify).
- **"Pre-check done in step 2" flow** — the AATF user starts a Deregistration
  transaction with a vehicle that has **no** prior pre-check. At Step 2, the
  system detects this and triggers the pre-checking enquiry **inline**,
  including its own payment dialog, before allowing the Deregistration to
  continue.

Both flows converge on the same validation rule (§5) and the same downstream
pages (§6 UI locations).

## 3. URL map

**Verified 2026-08-21** — live HTML captured across the full AATF flow (both
entry points), saved under `_reference/codebases/AATF/` (see that folder's
index in [_reference/html/README.md](../_reference/html/README.md)). All env
`uat1`.

Home / menu:
- `/uat1/view/aatf/home` — AATF home, compulsory-gate banner
- `/uat1/view/aatf/dereg/view.do` — eDereg menu (4 buttons)

eDereg Pre-Checking Enquiry (standalone entry point):
- `/uat1/view/aatf/dereg/precheck/enquiry/main.do` — steps 1 Vehicle → 2 Payment
  → 3 Result, all rendered on this SAME url (SPA-style content swap, not
  separate navigations)
- `/uat1/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=<plate>&autoSearch=true`
  — pre-checking listing, pre-filtered by vehicle no. (this is the target of
  the Dereg details page's "eDereg Pre-Checking: Yes" link, §6)
- `/uat1/view/aatf/dereg/precheck/enquiry/view.do?id=<transactionId>` —
  pre-checking transaction details

Deregistration transaction (create → submit):
- `/uat1/view/aatf/dereg/transaction/view.do` — category selection (MyKad/MyPR)
- `/uat1/view/aatf/dereg/transaction/wskad.do` — MyKad/thumbprint POST target,
  owner auth (step 1) and AATF rep auth (step 3, second sub-screen)
- `/uat1/view/aatf/dereg/transaction/data-entry.do` — step 2 Vehicle details;
  **this is the compulsory-gate enforcement point** (§5.1) — form posts to
  `/uat1/ajax/aatf/dereg/transaction/save-form.do`
- `/uat1/aatf/dereg/transaction/wskad-owner-consent.do` — owner's-copy consent
  MyKad POST target (step 3, first sub-screen)
- `/uat1/view/aatf/dereg/transaction/save-owner-consent.do` — redirect target
  after owner consent auth completes, lands on the AATF's-copy consent screen
- `/uat1/view/aatf/dereg/transaction/jpj-enq.do` — step 4 JPJ Check (redirect
  target after AATF rep's own MyKad auth completes)
- `/uat1/view/aatf/dereg/transaction/cancel.do` — cancel target from every
  MyKad/thumbprint auth screen
- `/uat1/view/aatf/dereg/transaction/mykad-photo.get?id=<transactionId>` —
  serves the scanned MyKad photo back for display
- Step 5 Payment and step 6 Deregister have **no distinct URL captured** — same
  in-place content-swap pattern as the pre-checking steps; only their rendered
  HTML was captured, not a network trace

Deregistration transaction (view/listing):
- `/uat1/view/aatf/dereg/enquiry/main.do` — transaction listing
- `/uat1/view/aatf/dereg/enquiry/view.do?id=<transactionId>` — transaction
  details, incl. the new "eDereg Pre-Checking:" row (§6) and the COD
  ("Certificate of Destruction") follow-up link
- `/uat1/view/aatf/dereg/cod/auth-aatf.do?id=<transactionId>` — "Upload COD"
  action from the listing, a separate post-deregistration workflow not
  otherwise covered by this ticket's captures
- `/uat1/view/aatf/dereg/photo/view.do?id=<refNo>%2FPhoto1` — uploaded vehicle
  photo viewer

**Not yet captured**: the JPJ XML Log (Deregistration Pre-Checking) screen and
every Back-Office-side page listed in §6 — only the AATF-side pages above have
live HTML behind them so far.

## 4. The real DOM handles

**Verified 2026-08-21** for the AATF-side pages above; see the header comments
in each `_reference/codebases/AATF/*.html` file for the full breakdown.
Highlights relevant to automation:

- **`#precheck-result`** (on step 2 Vehicle details, `data-entry.do`) — the
  gate's live indicator div, starts with class `hidden`. Populated inline
  (no navigation) after the vehicle-no. field is filled: red
  `icon-alert-red.svg` + "Approved eDereg Pre-Checking within 6 months is
  required to proceed" when blocked, green `icon-success-green.svg` + "This
  vehicle is allowed to create eDereg transaction" once satisfied.
- **Two inline dialogs fire from that same page when blocked**:
  `#precheck-popup` (re-renders the RM10.40 fee breakdown + Next/Cancel) then,
  after a `blockUI` "Working..." overlay, `#payment-result` (the same
  12-attribute JPJ result block as the standalone flow, + a Close button).
  Both stay in the DOM afterward (`display:none`), so a selector search must
  not assume they're absent once dismissed.
- **Payment failure vs. JPJ failure are two different dialog shapes, both
  captured 2026-08-21** (`_reference/codebases/AATF/EAINT-9306-dereg-step2-precheck-jpj-failed.html`
  and `...-payment-failed-retry.html`, same transaction `DPC260821000009` /
  vehicle `HXA002`):
  - **JPJ-Failed** (payment succeeded, JPJ check itself came back
    `VEL000045E`): `#payment-result` shows the 12-attribute result block with
    a single **Close** button — this is a terminal outcome for that
    payment/enquiry attempt, matches the standalone flow's failure shape.
  - **Payment-Failed** (e.g. RHB `IF` — insufficient funds, §5.3): the JPJ
    check never runs; `#precheck-popup` instead re-renders with a
    **"Payment History"** block listing every prior failed attempt for this
    transaction, a `#reset-timer` countdown ("Waiting for RHB to reset
    payment"), and a **Next / Cancel** buttonpane (not Close). **Clicking
    Next re-attempts the SAME payment** — it does not just refresh/re-display
    the failed result. A **native browser `confirm()` popup fires before this
    page/dialog renders**, and fires again on every Next-triggered retry —
    confirmed live by Faizuddin, not visible in the static HTML. Automating a
    payment-retry loop must handle `page.on('dialog')` at this point the same
    way as the step-4 JPJ-check confirm (§4 above), not treat the retry as a
    plain click-and-wait.
- **Native browser `confirm()` popups, not jQuery UI dialogs**, appear at two
  points late in the Deregistration flow: after step 4's "I hereby agree..."
  checkbox → Next, and after clicking "Make Payment" in step 4's JPJ-check
  result. **No HTML exists for these** — they must be driven via Playwright's
  `page.on('dialog')` handler, not a DOM locator. This is a different
  confirmation mechanism from the jQuery UI dialogs used everywhere else in
  this flow (`#enquire-dialog`, `#payment-dialog`, `#category-confirmation`,
  `#confirm-reset-dialog`), so a script built against one pattern will not
  work against the other — check which mechanism a given step uses before
  writing the wait/confirm logic.
- **MyKad/thumbprint auth widget** (`#mykad-container` /
  `#mykad-control-container`) is IDENTICAL structure and event-handler script
  across all three auth points in this flow (dereg step 1 owner, step 3 owner
  consent, step 3 AATF rep) — only `api.sendMykadDataPath` /
  `api.continueNextPagePath` / `api.additionalInfo` differ per screen (see §3
  for the actual values). `#continueButton` only enables once
  `photoReady`/`dataReady`/`verified` are all truthy in the client-side
  `control` object — i.e. **the real hardware/emulator round-trip must
  complete before Next is clickable**, this can't be skipped by just
  submitting the form. Resolved 2026-08-21: see
  [knowledge/mykad-emulator.md](mykad-emulator.md) for the bypass — a local
  emulator at `localhost:7878`, distinct from eSIM.
- **`#to-auth-aatf`** (AATF's-copy consent Next button) carries `class="hidden"`
  in the HTML both before and after ticking the consent checkbox — visibility
  is toggled by an inline `style="display: inline-block;"` added after
  ticking, which overrides the class. A selector checking `.hidden` alone will
  misread this button's state; check computed visibility instead.

## 5. Decision points and what they branch on

### 5.1 The four-condition gate (core rule)

All four must be true simultaneously for a Deregistration to proceed:

- Pre-Checking transaction status = **Approved**
- Payment status = **Paid**
- JPJ pre-check enquiry status = **Approved**
- JPJ approval timestamp within the **last 6 months**

Only one qualifying record is required — a later failed attempt does **not**
invalidate an earlier approval that still qualifies (see MU_TS1/TS2, §5.4).
Validation is **company-specific**: a pre-check approved under one AATF
company does not satisfy the gate for a different company on the same vehicle
(MU_TS5–MU_TS8 exercise this directly). `[from dev guide, 2026-08-21]`

### 5.2 JPJ enquiry response codes seen in the test plan

- `GLB000000I` — Approved / success.
- `VEL000100E` — Failed, "Vehicle Not Exist."
- `VEL000045E` — Failed, generic JPJ error code (distinct from vehicle-not-exist).

These three response values are what the test plan uses to **steer** the
pre-check outcome during testing, via eSIM (see [esim.md](esim.md)) — the same
mechanism used elsewhere for steering eSTM/JPJ responses by vehicle prefix.

**Resolved 2026-08-21.** It took three eSIM captures to find the right
entity. `/esim/dereg-enquiry-resp` was captured first
(`_reference/html/esim/dereg-enquiry-list.html`) — `GLB000000I` and
`VEL000045E` are both present there, but **`VEL000100E` is not**, in any of
its 55 rows; that entity turned out to govern a different, earlier JPJ call
("JPJ Check", step 4 of the Deregistration transaction). `VEL000100E` then
turned up on `/esim/dereg-submission-resp`
(`_reference/html/esim/dereg-submission-list.html`) — but that one governs
the JPJ **Deregistration Final Submission** step (step 6 "Deregister"), also
not Pre-Checking. The actual answer is **`/esim/dereg-precheck-enquiry-resp`**
(`_reference/html/esim/dereg-precheck-enquiry-list.html` +
`dereg-precheck-enquiry-edit.html`) — confirmed by its field set matching the
AATF pre-checking result screen exactly (`Vehicle Record`, `Vehicle Status`,
`Verified Status`, `Usage Code`, JPJ/JSJ/Agency Blacklist, `Claim Ownership`,
`Vehicle In Investigation`, `Vehicle Condition`) and by a remark on one row
explicitly reading "eDereg PreChecking." `VEL000100E` is present there too
(3 of its 19 rows). See [esim.md](esim.md) § Dereg Precheck for the full
writeup — that section also documents the fuller field set this entity needs
set (not just Response Code) for a realistic scenario.

Also: `scripts/eauto-esim`'s `ENTITIES` map does not yet register any of
`dereg-enquiry`, `dereg-submission`, or `dereg-precheck-enquiry` — these
entities need adding before this suite can drive them, though the suite's
actual field-write logic is entity-agnostic (same suite EAINT-11864 reused
for its TS06 69E case), so this is expected to be a registration-only change.
Note also (from Faizuddin, confirmed on Dereg Submission): steering a
scenario is a plain edit to the **Response Code** text field on the matching
`Vn Start With` record — there is no separate "outcome type" selector, so the
automation must write the exact code string (`VEL######E`, `GLB######[IE]`,
etc.) itself. On Dereg Precheck specifically, the response code is one of 15
fields on the record — a realistic scenario likely needs the Y/N/NA fields
set consistently with the code too, not just the code in isolation.

### 5.3 Payment outcome codes seen in the test plan

`OK` (success), `IF` ("Insufficient Fund(s)" — spelled out in several eSIM
remarks, e.g. "aliah OK - success, IF - Insufficient Fund"), `RE` (a
timeout/retry-window failure — one eSIM remark spells it out as "RE - 6
minutes timer", not insufficient funds), and **"RHB API Down"** (an explicit
simulated gateway outage, distinct from a normal decline) — steered via the
SAME `rhb-transfer` eSIM entity, code `ER`
(`RHB_TRANSFER_RESPONSE_CODE_API_DOWN`, `utils/esim.ts`; confirmed by
Faizuddin 2026-08-27 — previously had no known trigger). Test scenarios
combine these with the JPJ response codes above to hit every Approved /
Failed(Vehicle Not Exist) / Failed(JPJ error code) combination, both fresh and
after the 6-month expiry patch (§5.5).

**Resolved 2026-08-21**: `IF`/`RE` are set on the **RHB Transfer** entity
(`/esim/rhb-transfer-resp`), not Dereg Enquiry — confirmed by live HTML
(`_reference/html/esim/rhb-transfer-list.html`). Two of its rows even name
eDereg Pre-Checking directly in their remark ("eSTM & eDereg PreChecking -
Char", "eDereg PreChecking - Char"), confirming this entity governs
pre-checking payment specifically, not just STMS/eSTM. See
[esim.md](esim.md) § RHB Transfer for the full field/code writeup.

### 5.4 Trx Status values observed

`Approved`, `Failed` (either payment or JPJ pre-checking can cause this),
`Pending`, `Cancelled`, `Expired`. There is deliberately **no "Pending" status
carried into Step 2 after a refresh** — per the test plan's yellow note: "if
refresh will start back from beginning, does not save the details." Treat any
mid-flow refresh as resetting Step 2's in-progress pre-check attempt, not as
resuming it.

### 5.5 Expiry — two different mechanisms, don't conflate them

- **6-month SRD expiry**: an *Approved* pre-check becomes ineligible once its
  JPJ approval timestamp is more than 6 months old. Test scenarios simulate
  this by asking dev to "patch trx to expire (after 6 months)" — there is no
  in-app way to fast-forward this, it's a data patch.
- **Cronjob-driven `Expired` status** (separate from the above): any
  Pre-Checking transaction **not in Approved status** expires automatically
  **1 day** after creation, via a daily cronjob that runs at **23:59:59**.
  `Pending`, `Failed`, and stale non-approved states are what this catches
  — the cronjob explicitly does **not** touch `Approved` or already-
  `Expired`/`Failed` records (CJ_TS2–CJ_TS4 assert "cronjob didn't pick up
  the trx" for those). Only `CJ_TS1` (Failed) and `CJ_TS5` (Pending) get
  flipped to `Expired` with `Remarks = Transaction Expired`. **For
  testing, ask dev to trigger the cronjob manually** rather than waiting
  for the real 23:59:59 run.
- **CONFIRMED 2026-08-28, per Faizuddin — the cronjob also excludes
  same-day records.** The 23:59:59 run checks each candidate row's creation
  date, and a row created on **the same calendar day as the run itself**
  is skipped, not just "not yet a full day old" in a rolling-hours sense.
  Concretely: a Pending/Failed record created any time on, say, 28 August
  will NOT be picked up by that night's 23:59:59 run on 28 August — it
  first becomes eligible at the run on 29 August (assuming it's still
  Pending/Failed by then). **This retroactively explains CJ_TS1's own
  first live run (2026-08-28, EAINT-12240 raised)**: vehicle HXA088's
  Failed record was created at 11:36 AM that same day and checked again at
  11:50 AM/3:12 PM the SAME day — well before that night's cronjob run
  even had a chance to consider it, let alone skip it for being same-day.
  **EAINT-12240 needs re-evaluating** — the observed "stuck on Failed"
  behaviour may be entirely expected (checked too early on the creation
  day itself) rather than a genuine bug; don't treat the ticket as
  confirmed until CJ_TS1 Part 2 is re-run on a record that's now at least
  one full calendar day old.
  *(A "7 days" reading of this rule was floated and retracted the same
  day — 1 day is the confirmed figure, per Faizuddin's own correction.)*

**Full CJ_TS1–5 steps** [source: Faizuddin's direct Miro paste, 2026-08-27 —
the test plan PDF itself (`_reference/tickets/EAINT-9306/[eAuto - AATF]
Deregistration - Test Plan (2).pdf`) is a Skia/headless-Chrome SVG-to-PDF
export whose text layer extracts in scrambled column order — unreadable via
`pdftotext`, this Miro paste is the only legible source]. Each row's own
✅/❌ is this TEST CASE's OWN execution-result marker (per the ticket-wide
convention `lib/ticketStudies.ts` already documents — "✅ Pass, ❌ Failed" —
placed at the TS title), NOT a data field:

- **CJ_TS1** (starting Trx Status: Failed) — 1. Create new Deregistration
  until step 2. 2. Purchase Pre-Check, RHB Payment = Failed, JPJ Pre-Check
  Status = Failed. 3. Wait until cronjob runs. Expected: Trx Status =
  Expired (cronjob picks it up), Remarks = "Transaction Expired", rest
  unchanged.
- **CJ_TS2** (starting Trx Status: Failed) — 1. Create new Deregistration
  until step 2. 2. Purchase Pre-Check, JPJ Pre-Check Status = Failed. 3.
  Wait until cronjob runs. Expected: Trx Status stays Failed (cronjob does
  NOT pick it up), all details unchanged.
- **CJ_TS3** (starting Trx Status: Expired) — 1. Create new Deregistration
  until step 2. 2. Purchase Pre-Check, JPJ Pre-Check Status = Passed. 3.
  Ask dev to run the cronjob once, forcing status to Expired. 4. Wait
  until the NEXT cronjob run. Expected: Trx Status stays Expired (cronjob
  doesn't re-pick-up an already-Expired row), all details unchanged.
- **CJ_TS4** (starting Trx Status: Approved) — 1. Create new
  Deregistration until step 2. 2. Purchase Pre-Check, JPJ Pre-Check
  Status = Approved. 3. Wait until cronjob runs. Expected: Trx Status
  stays Approved (cronjob never touches Approved), all details unchanged.
- **CJ_TS5** (starting Trx Status: Pending) — 1. Create new Deregistration
  until step 2. 2. Reach the pre-check popup, do NOT pay. 3. Wait until
  cronjob runs. Expected: Trx Status = Expired (cronjob picks it up),
  Remarks = "Transaction Expired", rest unchanged.

Built as automation 2026-08-27 — see §32.

### 5.6 Multi-user / race-condition behaviour (AATF Multiple Users, MU_TS1–12)

A Main user and a Sub user (same company) or two Main users (different
companies) can act on the same vehicle number concurrently. Key branches
verified in the test plan:

- **Same company, both Approved** (MU_TS1/TS2): each user's Deregistration is
  independent — the listing shows 2 separate transactions, not a collision.
- **Concurrent payment retry** (MU_TS4, MU_TS8): the *second* user to click
  Pay gets **"Duplicate RHB payment requests have been detected... please
  refresh the page to view the payment details"** rather than a second charge
  — then, on refresh/redirect, sees the *first* user's outcome already applied
  (`Payment Paid` / `Transaction Approved` prompts appear in sequence for the
  second user).
- **Resubmit after JPJ-Failed** (MU_TS5/TS6): whichever user resubmits from
  the Transaction Listing gets redirected straight to "Step 3" showing the
  existing JPJ Pre-Checking result — it does not re-run the enquiry.
- **Cancel/Expire races**: a BackOffice-side cancel (MU_TS9/TS10) or a cronjob
  expiry (MU_TS11/TS12) can land while another user still has the transaction
  open — that user's next action (refresh, resubmit, pay, retry) must surface
  `"Transaction Cancelled"` / `"Transaction Expired"` rather than silently
  succeeding, and the system "pre-searches" the transaction in the listing
  afterward so the user lands on the current state, not a stale view.

## 6. UI locations affected (compliance banner / gate / new fields)

`[from dev guide, 2026-08-21]`:

- **AATF → Dereg → data-entry (vehicle page)** — the primary gate, fires on
  vehicle-field exit.
- **AATF home, Dereg landing, Dereg transaction view** — a compliance banner.
  The exact wording is captured in the test plan's Announcement Message table
  (AM_TS1–AM_TS4): shown under the Home page nav buttons, under the eDEREG
  page's options buttons, and under the "Create Deregistration Transaction —
  Kategori ID" option (both with and without its popup). Message text: *"Effective
  immediately, AATF is required to complete the eDereg Pre-checking process
  prior to proceeding with Deregistration, and Deregistration may only be
  carried out upon successful completion of the said pre-checking."* — **red,
  bolded**.
- **AATF and back-office Dereg enquiry views** — a new **"eDereg
  Pre-Checking:"** row. Its **Yes** hyperlink (positioned under "e-Invoice
  Validation Date:") redirects to the Pre-Checking Transaction Listing, with
  the Vehicle No. field auto-filled from the details page, showing **all**
  existing transactions for that vehicle (not filtered to one).
- **Back-office eDereg Pre-Checking listing** — gains a vehicle-number search
  field.
- **JPJ XML Log (Deregistration Pre-Checking)** — searchable by **Vehicle No.**
  or **Transaction Ref. ID** (OF_TS5 exercises this directly, including
  cross-referencing a Trx Ref No. obtained from the pre-check listing page).

Full list of pages the QA plan says to remember for coverage: Figma
(UI/UX — see link below), AATF eDereg Pre-Checking Enquiry Steps, AATF eDereg
Pre-Checking Transaction Listing Page, AATF eDereg Pre-Checking Transaction
Details Page, JPJ XML Log (Deregistration Pre-Checking), BO eDereg
Pre-Checking Transaction Listing Page, BO eDereg Pre-Checking Transaction
Details Page, eDereg Pre-Checking Slip Pengesahan (AATF & BO).

Figma design reference (UI/UX only, not automatable):
`https://www.figma.com/design/I3HOoBRG97sO3Nkjo9dx2I/eAuto-AATF?node-id=2239-2416&p=f&t=J5hWGDl51S7y0G98-0`

## 7. Preconditions and test data

- **Vehicle number state matters going in.** Several scenarios explicitly
  require "ensure VN does not have any prior pre-checking trx" as a setup
  step — ordinary vehicle-number reuse across scenarios will contaminate
  results.
- **Two AATF user accounts are required for the Multiple Users block**: a
  Main + Sub pair from the *same* company, and a Main + Main pair from
  *different* companies. Both pairings are exercised across MU_TS1–12.
- **STMS and AATF use different accounts** — carried over from the prior
  architecture note; scenarios needing both log out of one and into the other
  mid-scenario.
- **Some scenarios need a mid-run dev patch** (backdating a pre-check's JPJ
  approval past 6 months, or forcing a cronjob run) — those test scripts are
  authored/numbered in Parts (Part 1 → hand off to dev → Part 2), per the
  prior architecture note. Confirmed applicable here: CPC_E2E_TS4–6 and
  CPC_E2E_TS10–12 (the "Expired (After 6 Months)" scenario blocks) all require
  this patch.
- Result-icon convention for this ticket's test scripts, per the QA plan:
  ✅ Pass, ❌ Failed, 🚧 In Progress — put this icon at the TS title, not just
  in a results column.
- **Default AATF test account**: `faizuddinAATF` / `password`, confirmed by
  Faizuddin 2026-08-21 — set this as the runner's default login (overridable
  per run), same pattern as eSIM's `admin`/`admin` default in
  `scripts/eauto-esim/data/config.ts`.
- **This round's scope, confirmed 2026-08-21**: get the automation completing
  the AATF-side eDereg flow end-to-end first (Pre-Checking → Deregistration →
  JPJ Deregistration success) — Back-Office verification is explicitly phase 2
  and out of scope for now (no BO HTML captured at all yet, see §9). Within
  that, start with **one happy-path case** before attempting the rest of the
  38-case script — `CPC_E2E_TS1` or `CPC_E2E_TS2` are the obvious first picks
  (see `lib/ticketStudies.ts`'s `automation.groups`, both already assessed as
  automatable with no dev-patch dependency).

## 8. Traps

- **Don't reuse the old Dereg flow's assumptions.** The test plan calls this
  out explicitly — screen order, field behaviour, and the gate itself are new.
- **A mid-flow refresh does not resume Step 2's in-progress pre-check** — it
  restarts from the beginning (§5.4). A script that expects to survive a
  reload mid-pre-check will silently lose state.
- **The cronjob only catches non-Approved statuses, and only after ~1 day**
  (also excludes same-day records, §5.5) — don't expect it to expire an
  `Approved` record; that's the separate 6-month rule (§5.5), which needs a
  manual dev patch, not the cronjob.
- **Concurrent-user payment collisions surface as a "duplicate request"
  message, not a silent double-charge or a crash** — if a test sees a second
  charge succeed instead of that message, that's the defect, not a script bug.
- **Vehicle No. field has input-shaping behaviour**: rejects non-alphanumeric
  characters outright, silently strips spacebar input, and auto-uppercases
  lowercase input (OF_TS3) — a script typing a raw lowercase plate should still
  assert the field ends up uppercase, not treat mismatched case as a script
  error.
- Environment is **[TBC]** in the QA plan itself, but confirmed as **uat1**
  by Faizuddin (2026-08-21) for this repo's automation — don't reopen this by
  defaulting to a different env just because the QA plan is silent.
- **Category-select page renders the SAME category as two separate links** —
  `EAINT-9306-dereg-create-category-select.html` STATE 1 has an image link
  and a text link, both `.owner-category[category="1"]`, in adjacent `<td>`s.
  A class+attribute locator for that category is a strict-mode violation
  (Playwright refuses to click 2 matches) — confirmed live 2026-08-22, first
  real run of the Deregistration continuation. Target the text link by
  accessible name (`getByRole('link', { name: 'Orang Awam Malaysia (MyKad)' })`)
  instead; both links fire the identical click handler, so this isn't a
  functional choice, just a way to get back to one element. Worth checking
  whether the MyPR category (`category="0"`) has the same doubled-link shape
  before automating it.
- **Every MyKad/thumbprint auth screen can trigger a browser device
  permission prompt (Allow/Block) that silently hangs a fresh automation
  context** — confirmed live 2026-08-22. See
  [mykad-emulator.md](mykad-emulator.md) § "Browser device permission
  prompt" for the full writeup and the fix (`grantPermissions()` pre-granted
  in the session fixture). A hang with no error at a MyKad step is this, not
  a broken selector or a dead emulator connection — check this first.
- **After that fix, the SAME screens can still show a "Dermalog Biometric
  Device — Update Required" full-page gate** — a separate issue. Two
  theories (browser binary; `navigator.webdriver`) were tried and both
  turned out to be dead ends. **Confirmed actual cause, 2026-08-22**: Chrome
  console showed `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS` — Chrome's
  Local Network Access feature blocking the page's own `ws://localhost:7878`
  connection because the page is loaded from a public origin. **Fixed and
  confirmed working**: `playwright.config.ts`'s `launchOptions.args` adds
  `--disable-features=LocalNetworkAccessChecks,...` (see
  [mykad-emulator.md](mykad-emulator.md) § "Dermalog Biometric Device —
  Update Required" gate for the full history, including the two dead ends).
- **After THAT fix, a blank second browser tab appears and stalls the flow
  right after MyKad auth, before step 2 loads** — confirmed live and fixed
  2026-08-22, a bug in this suite's own code, not the portal: the MyKad
  emulator's hidden helper page was being left open, and the session
  helper's "last open page = active page" heuristic started handing that
  blank page back instead of the real AATF tab. See
  [mykad-emulator.md](mykad-emulator.md) § "Blank second tab stalls the flow
  after MyKad auth" — fixed by closing the emulator's helper page after
  every `insertCard()` call instead of keeping one open across the flow.
- **Step 2's `#precheck-result` gate check is off-click (fires on blur, not
  on input)** — confirmed live 2026-08-22: filling `#vehicleRegNo` alone
  never triggered it; the script just hung waiting for `.success` to
  appear. An explicit `.blur()` after filling reproduces the "click away
  from the field" a manual tester does without thinking about it. Fixed in
  `DeregTransactionPage.fillVehicleDetails()`.
- **All step-2 file uploads (`#aatfConsent`, `#photo1`/`#photo2`/`#photo3`)
  need a real file, not a placeholder** — a 1x1 placeholder PNG silently
  failed to attach for both the consent field and the three vehicle photos
  (confirmed live 2026-08-22 for `#aatfConsent`; the photos were still on
  the placeholder approach and untested live as of the same session). Per
  standing instruction, all four fields now use the same real PDF
  (`_reference/dummies/Test PDF.pdf`, supplied by Faizuddin) via
  `DUMMY_UPLOAD_PATH` in `DeregTransactionPage.ts` — no need for a
  real *photo*, just a real file. `vehicleMake`/`vehicleModel`/`vehicleYear`
  still use the "OTHER" + free-text fallback described in §4.
- **File uploads must be attached LAST, right before `#to-continue`, not
  interleaved with the other fields** — confirmed live 2026-08-24:
  `#aatfConsent` was being set before the `#vehicleMake`/`#vehicleModel`
  selects were switched to "Others" (which reveals the "Other Vehicle
  Make"/"Other Model" free-text fields via a DOM update); that update wiped
  out the already-attached file. Symptom was confusing — `#to-continue`'s
  click threw no exception and showed no dialog, the page just silently
  stayed on the same step-2 "Owner & Vehicle Details" form, and the failure
  only surfaced two calls later as an unrelated-looking timeout waiting for
  `#owner-consent` on step 3. Fixed by moving all four `setInputFiles()`
  calls to immediately before the `#to-continue` click, and by having
  `fillVehicleDetails()` explicitly wait for `#aatfConsent` to detach
  (i.e. confirm the page actually left step 2) right after that click,
  throwing a clear diagnostic instead of letting it surface downstream.
- **`#to-continue` (step 2 Next) needed `withNativeConfirm()` too, same as
  `#to-enquiry`/`#to-payment` on later steps** — confirmed live 2026-08-24:
  after fixing the file-attach-order bug above, the form still didn't
  submit even with every required field correctly filled (file type wasn't
  the issue either — confirmed manually that the real portal accepts ANY
  file for the photo fields, not just images). Manual testing with the
  exact same field values submitted fine, which pointed at an unhandled
  native `confirm()` dialog on submit — Playwright auto-dismisses an
  unhandled native dialog exactly as if Cancel were clicked, which looks
  identical to "the click did nothing." Fixed by wrapping the
  `#to-continue` click in `this.session.withNativeConfirm()`.

## 9. What is NOT covered yet

- **CONFIRMED LIVE END-TO-END, 2026-08-24.** `scripts/eauto-edereg-precheck`
  runs the full happy path in one continuous run: login → AATF home → eDEREG
  menu → eDereg Pre-Checking Enquiry (vehicle no. + consent → ENQUIRE NOW →
  pay → JPJ result → Done) → straight into creating a Deregistration
  transaction for the SAME vehicle no. → category select → Step 1 Owner
  MyKad auth → Step 2 Vehicle details (compulsory gate + all 4 file uploads)
  → Step 3 owner-consent + AATF-consent + rep auth → Step 4 JPJ Check →
  Step 5 Payment → Step 6 Deregister result — end to end, no manual
  intervention beyond having the MyKad emulator's `localhost:7878` page
  reachable. **This is now the reference happy flow for the AATF
  Deregistration module** — any future ticket automating a screen in this
  module (or another MyKad/thumbprint-auth screen elsewhere) should start
  from `pages/DeregTransactionPage.ts` and this file's §3/§4/§8, not from
  rediscovery. The full list of live-confirmed fixes that got it there is in
  §8 below and in [mykad-emulator.md](mykad-emulator.md) — read both before
  changing `DeregTransactionPage.ts` or `mykadEmulator.ts`.
- **`DeregTransactionPage.resolveVehicleGate()` — shared gate-resolution
  method backing BOTH Deregistration entry points, built/refactored
  2026-08-24.** Originally `fillVehicleDetails()` assumed the gate was
  always already green (true for CPC_E2E_TS1's "pre-check done in enquiry"
  entry point). Generalized so `fillVehicleDetails()` calls
  `resolveVehicleGate()` first: if `#precheck-result` is already `.success`,
  nothing more happens; if `.error`, it drives the inline "buy pre-checking
  now" flow (`#precheck-popup` → Next → `#payment-result` → Close, built from
  `EAINT-9306-dereg-step2-precheck-jpj-failed.html` and
  `...-payment-failed-retry.html`) and reports whether the gate is satisfied
  afterward. This lets `fillVehicleDetails()` work for the "pre-check done
  in step 2" entry point too (CPC_E2E_TS7/TS8/TS9) — Approved closes into a
  satisfied gate and the rest of Step 2 continues; Failed resets
  `#vehicleRegNo` to blank instead (CPC_E2E_TS2/TS8's dead end) and
  `fillVehicleDetails()` throws, since there's nothing left to submit — call
  `resolveVehicleGate()` directly for a scenario expecting that outcome.
  Assumes VEL0001xxE-style codes resolve like the JPJ-Failed popup shape
  (payment succeeds, JPJ itself fails, single Close button) rather than the
  Payment-Failed shape (Payment History + countdown + native-confirm-gated
  Next retry) — if the popup instead shows a countdown/Payment-History
  block, that assumption was wrong and the payment-failed-retry pattern
  (native `confirm()` handling, `withNativeConfirm()`) applies instead. Also
  worth noting for whoever debugs this: the result block in
  `#payment-result` reuses the id `responseDesc` for BOTH "JPJ Pre-Checking
  Status" and "Enquiry Response" (confirmed from the captured HTML) — unlike
  the standalone enquiry's `#result-container`, which has only one.
  `resolveVehicleGate()` reads JPJ status off `#jpjStatusLabel` instead and
  takes the LAST `#responseDesc` match for the response text.
- **CPC_E2E_TS2 built 2026-08-24, NOT yet run live** —
  `tests/edereg-precheck-vehicle-not-exist.spec.ts` (its own Playwright
  project, `edereg-precheck-vehicle-not-exist`, per
  `playwright.config.ts` — each ticket case is a separate project scoped to
  its own spec file, not a shared `testMatch`, so the dashboard route's
  single-test PROGRESS:/RESULT: parsing never sees two tests' output mixed
  together). Steers eSIM's Dereg Precheck entity to `VEL000100E` (`utils/
  esim.ts`'s `ensureEsimVehicleNotExistPath()`), runs the standalone enquiry
  expecting Failed, then calls `DeregTransactionPage.createFromHome('MYPR')`
  and `resolveVehicleGate()`, expecting `satisfied: false`. **Never driven
  live** — in particular, MyPR's category link is captured
  (`EAINT-9306-dereg-create-category-select.html` STATE 1, `category="0"`,
  same doubled image+text link shape as MyKad) but its OWN post-confirm
  owner-auth widget has never been captured. This assumes MyPR reuses the
  identical MyKad/thumbprint widget (§4's "IDENTICAL structure" note was
  only confirmed for the MyKad category) — if the first live run hangs or
  shows something unexpected right after the category-confirmation dialog,
  this assumption is the first thing to check, and whatever the real screen
  looks like needs capturing per the standing HTML rule.
- **CPC_E2E_TS3 built 2026-08-27, NOT yet run live** —
  `tests/edereg-precheck-rhb-api-down.spec.ts` (project
  `edereg-precheck-rhb-api-down`, dashboard testCase `rhb-api-down`).
  Genuinely blocked earlier this session (no known trigger for "RHB API
  Down" — see the now-resolved `eaint-9306-rhb-api-down-unconfirmed`
  memory), resolved once Faizuddin confirmed the SAME `rhb-transfer` eSIM
  entity as IF/RE, code `ER`. Single-part (no 6-month-expiry patch needed —
  confirmed directly, "no need to make 2 parts"): standalone enquiry ->
  `PrecheckEnquiryPage.attemptStandalonePayment()` (built 2026-08-27 for
  MU_TS9B) steered to `ER`, expecting `declined: true`. **Scoped narrower
  than TS2/TS7/TS8/TS9's own pattern** — those continue into a
  Deregistration attempt for the same vehicle afterward; TS3's own literal
  continuation steps weren't available when built (only the blocker itself
  was documented), so this version stops after the standalone decline and
  a listing read (logged, not hard-asserted — whether a payment-level
  decline persists a real record through this specific entry point is
  unconfirmed). GENUINELY UNCONFIRMED, inherited from
  `attemptStandalonePayment()`'s own doc comment: whether the standalone
  flow's FIRST payment attempt really declines the same way the Retry
  button does (never observed live for ANY code through this method, `ER`
  included).
- **CPC_E2E_TS7 built 2026-08-24, NOT yet run live** —
  `tests/edereg-precheck-step2-first-approved.spec.ts` (project
  `edereg-precheck-step2-first-approved`). The "pre-check done in step 2"
  entry point's Approved case: no standalone enquiry, MyKad category,
  `fillVehicleDetails()`'s inline `resolveVehicleGate()` call does the
  pre-check purchase at Step 2 itself, then the flow continues through the
  rest of Deregistration same as CPC_E2E_TS1's continuation. Needs a vehicle
  with NO prior pre-check (the opposite precondition from CPC_E2E_TS1) — if
  a vehicle number gets reused across both test cases' runs, this one will
  see `usedInlinePrecheck: false` because a pre-check from the earlier run
  already satisfies the gate, which is the wrong entry point for what this
  case is meant to exercise. This is the first live exercise of the inline
  popup's APPROVED outcome — CPC_E2E_TS2 only demonstrated Failed — so if
  the gate does not turn green after Close (unlike CPC_E2E_TS2's blank-reset
  shape), that is new information worth capturing.
- **CPC_E2E_TS8 built 2026-08-24, NOT yet run live** —
  `tests/edereg-precheck-step2-first-vehicle-not-exist.spec.ts` (project
  `edereg-precheck-step2-first-vehicle-not-exist`). Same entry point as
  CPC_E2E_TS7 (no standalone enquiry, vehicle must have NO prior pre-check)
  but CPC_E2E_TS2's category/response code (MyPR, VEL000100E) — i.e. the
  Failed half of TS7's Approved/Failed pair through the SAME
  `resolveVehicleGate()` call, expecting `satisfied: false`. Every piece
  here has been exercised individually (TS2's Failed branch, TS7's
  no-standalone-enquiry MyPR entry) but not in this exact combination —
  check §9's TS2/TS7 entries first if something doesn't match.
- **CPC_E2E_TS9 built 2026-08-24, NOT yet run live** —
  `tests/edereg-precheck-step2-first-retry-approved.spec.ts` (project
  `edereg-precheck-step2-first-retry-approved`). Same entry point as
  CPC_E2E_TS8 (no standalone enquiry, MyPR, vehicle must have NO prior
  pre-check) with `VEL000045E` ("Failed - JPJ error code", a THIRD distinct
  code from TS2/TS8's `VEL000100E` — new `DEREG_PRECHECK_RESPONSE_CODE_JPJ_ERROR`
  constant and `ensureEsimJpjErrorPath()` helper in `utils/esim.ts`) for the
  first attempt, but then RE-STEERS eSIM to the happy-path code
  (`ensureEsimHappyPath()`) and calls `resolveVehicleGate()` a SECOND time on
  the SAME vehicle no. — the first Failed enquiry doesn't leave behind a
  qualifying pre-check, so the inline popup runs again rather than skipping
  straight to green. Required splitting `fillVehicleDetails()` into three
  composable pieces (`fillOwnerContactFields()`, `resolveVehicleGate()`,
  `submitVehicleDetails()`) since `fillVehicleDetails()` itself only
  supports a single gate attempt — this test calls the pieces directly:
  `fillOwnerContactFields()` once, `resolveVehicleGate()` twice, then
  `submitVehicleDetails()` once satisfied. **Whether the SECOND
  `resolveVehicleGate()` call behaves identically to the first — the same
  `#precheck-popup`/`#payment-result` shapes reappearing cleanly after a
  Close, rather than some different state left over from the first attempt
  — is unconfirmed** and is the main thing to check if this run behaves
  unexpectedly.
- **CPC_E2E_TS4 (the first "6-month SRD expiry" case) built 2026-08-24 as a
  TWO-PART run, per Faizuddin's standing workflow for any case needing a
  mid-scenario dev patch** (see "Two-part (dev-patch) automation, dashboard
  workflow" below) — `tests/edereg-precheck-ts4-part1.spec.ts` (project
  `edereg-precheck-ts4-part1`) runs the standalone enquiry only and stops;
  `...-ts4-part2.spec.ts` (project `edereg-precheck-ts4-part2`) continues for
  the SAME vehicle no. once a dev has backdated its JPJ-approval timestamp
  past 6 months, reusing `fillVehicleDetails()`'s inline-popup path exactly
  like CPC_E2E_TS7 — an EXPIRED pre-check doesn't satisfy the gate any more
  than an absent one does, so the same code path applies. **Note on the
  source PDF itself**: this row's own text literally reads "CPC_E2E_TS1",
  not "CPC_E2E_TS4" — confirmed via raw PDF text extraction, not a
  transcription error on our end. Treated as TS4 per its position in the
  "Expired (After 6 Months)" block (immediately before the correctly
  labelled TS5/TS6) and `lib/ticketStudies.ts`'s pre-existing
  `automation.groups` mapping. Neither part has been run live —
  Part 2's "expired-pre-check-vs-no-pre-check" equivalence is the main
  assumption to check if it behaves unexpectedly.
- **CPC_E2E_TS5/TS6 built 2026-08-24, same two-part shape as TS4, NOT yet
  run live** — `tests/edereg-precheck-ts5-part1/2.spec.ts` and
  `...-ts6-part1/2.spec.ts`. Both Part 2s introduce a THIRD popup shape at
  the inline pre-check purchase, never before automated: a DECLINED payment
  (RHB `IF`/`RE` codes), which re-renders `#precheck-popup` with a
  `#payment-history-portion` list of prior failed attempts and Next/Cancel
  buttons — no `#payment-result`, no Close — instead of `resolveVehicleGate`'s
  two already-tested shapes (immediate green gate; a single-Close-button
  terminal result). Built entirely from
  `EAINT-9306-dereg-step2-precheck-payment-failed-retry.html` and its own
  header-comment note from Faizuddin: **a real native browser `confirm()`
  fires on every payment attempt that gets DECLINED** (not on a successful
  one) — this is why `resolveVehicleGate()`'s own Next-click got wrapped in
  `withNativeConfirm()` too as a defensive no-op, and why the new
  `DeregTransactionPage.attemptInlinePayment()`/`beginInlinePaymentFlow()`
  always wrap it. See "Declined-payment retry shape" below for the full
  breakdown. **TS5's `waitOutPaymentResetTimer()` originally guessed at the
  `#reset-timer` countdown's DOM completion signal, which had a real bug
  confirmed live 2026-08-24 (see that section) — now just waits the
  confirmed fixed 6 minutes instead.**
- **CPC_E2E_TS10/TS11/TS12 built 2026-08-24 — the "pre-check done in step 2"
  counterparts of TS4/TS5/TS6, same two-part shape, NOT yet run live.**
  `tests/edereg-precheck-ts{10,11,12}-part1/2.spec.ts`. The one structural
  difference from TS4-6: **all three Part 1s use the SAME Approved inline
  outcome**, regardless of which payment-decline code each case ultimately
  exercises in Part 2 — a Failed inline pre-check (`resolveVehicleGate`)
  resets `#vehicleRegNo` to blank instead of persisting anything (the
  TS2/TS8 dead-end shape), so there is nothing to hand off for an expiry
  patch unless Part 1 actually reaches the green gate first. Part 1 stops
  right after `resolveVehicleGate()` reports `satisfied` (never calls
  `submitVehicleDetails()`, never continues into Step 3+) — the abandoned
  Deregistration transaction it leaves behind is fine to discard; only the
  underlying Pre-Checking record matters. Part 2 then reuses TS4/TS5/TS6
  Part 2's code EXACTLY. **One thing assumed, unconfirmed:** that an
  inline-Approved pre-check is the same kind of record a dev can backdate
  the same way as a standalone-Enquiry one.

  **All three Part 2s checked against Faizuddin's own literal test-plan
  text, 2026-08-27, and TWO of the three turned out wrong** — this was
  the "TS4-6 mirror" assumption's own paragraph above talking about a
  shared shape that never actually held for TS11/TS12:

  - **TS10 [Approved] — CONFIRMED CORRECT AS BUILT.** Literal text: single
    retry attempt, happy path, Approved/OK/OK, then Details Page -> "Yes"
    hyperlink -> redirects to Pre-Check Listing -> full checklist. Matches
    `ts10-part2.spec.ts` exactly (`ensureEsimHappyPath` + one
    `fillVehicleDetails()` call + full Deregistration completion +
    `runPostDeregSrdChecklist()`).
  - **TS11 — REWRITTEN 2026-08-27, was completely wrong.** The OLD build
    steered `RE` (payment reset-timer decline) — genuinely unrelated to
    what TS11 actually tests. Literal text: after the expiry patch, retry
    comes back **JPJ Pre-Checking = VEL000045E** (a JPJ-level failure, the
    SAME code `CPC_E2E_TS9` uses), THEN re-steer to `GLB000000I` and retry
    AGAIN -> Approved -> the same Details-Page/"Yes"-hyperlink/checklist
    tail as TS10. This is TS9's own already-built "`resolveVehicleGate()`
    called TWICE, re-steering eSIM between attempts" pattern (§ TS9's own
    bullet), reused verbatim in `ts11-part2.spec.ts` — the only difference
    from TS9 is the precondition (expired pre-check, not "no prior
    pre-check") and category (`MYKAD`, matching TS10/12). The `[Failed -
    Vehicle Not Exist]` bracket label on this row is ALSO wrong (same
    label/content mismatch pattern as TS4/5/6) — `VEL000045E` is the
    JPJ-error code, not `VEL000100E`.
  - **TS12 — corrected TWICE this session.** First correction: the RHB
    code itself was `IF` (insufficient funds) until this session; the real
    code is `ER` ("RHB API Down", `RHB_TRANSFER_RESPONSE_CODE_API_DOWN` in
    `utils/esim.ts`). **Second correction, same day, after checking the
    literal text**: the OLD build only repeated `attemptInlinePayment()`
    four times and asserted every attempt declined — it never checked the
    ACTUAL pass condition. The real scenario ends with **Trx Status =
    Cancelled** and the listing's own "Resubmit" link becoming
    UNAVAILABLE — reuses MU_TS10's own
    `openViaListingAndResubmitExpectingCancellation()` (generic despite
    its BO-cancel-era name) to assert `resubmitLinkFound === false`, plus
    a `getListingStatusForVehicle()` check for `trxStatus === 'Cancelled'`.
    GENUINELY UNCONFIRMED: whether ONE declined "ER" attempt is enough to
    auto-cancel the record (this build's own assumption, since the literal
    text reads as only two actions — "Attempt to make payment > Unable to
    resubmit payment" — not a counted retry loop) or whether it takes
    several attempts first; if the first live run shows the record still
    Failed (not Cancelled) after one decline, add more attempts before the
    resubmit check.
  **Transaction ID, corrected 2026-08-24**: this entry point has no
  `#result-container`/`Done` screen, but per Faizuddin there IS a way to get
  the transaction ID — the "eDereg Pre-Checking Transaction Listing" page,
  filtered by vehicle no., "View" on the matching row. Implemented as
  `PrecheckEnquiryPage.findTransactionIdByVehicleNo(envSegment,
  vehicleRegNo)`: navigates to
  `.../view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=<plate>&autoSearch=true`
  (§3 URL map), takes the first `#result table` row's "View" link, and reads
  `?id=` off its `href` — confirmed shape from
  `_reference/codebases/AATF/EAINT-9306-precheck-details-and-listing.html`
  (captured 2026-08-21, only 1 row existed there). Assumes exactly one
  pre-checking transaction exists for the vehicle at call time (true right
  after Part 1's own inline pre-check) — `.first()` would need to become a
  real row-selection strategy if that's ever not the case. NEVER exercised
  live via automation.

## Two-part (dev-patch) automation, dashboard workflow

Any test case needing a dev to manually patch data mid-scenario (backdating
a JPJ-approval timestamp past 6 months, for now — CPC_E2E_TS4-6/TS10-12) is
split into two Playwright projects/spec files instead of one, per Faizuddin,
2026-08-24:

- **Part 1** runs up to the exact point where the patch becomes necessary,
  then stops — its `RESULT:` JSON carries `part: 1`, `status: 'PART1_DONE'`,
  `tsNo`, `vehicleRegNo`, `transactionId` (extracted from the current page's
  `?id=` URL param, e.g. `.../auth-owner-consent.do?category=1&id=<uuid>` →
  `<uuid>` — the same pattern already used by `PrecheckEnquiryPage.done()`
  and `DeregTransactionPage.payAndDeregister()`), `nextAction` (a plain-text
  instruction for what to ask dev for), and `continuesAs` (the Part 2
  test-case value the dashboard should generate a continuation entry for).
- **Part 2** takes the SAME vehicle no. as input and continues from there,
  once the patch is confirmed done.
- `app/eauto/edereg-precheck/page.tsx` shows Part 1's result as a distinct
  amber "send to dev" card — TS No. / Vehicle Number / Transaction ID in a
  monospace block with a Copy button. **Continuations are generated per
  completed Part 1 run, not a static option** — Part 1 can be (and is
  expected to be) run multiple times with different vehicle numbers, so
  each completion appends its own entry (TS + vehicle no. + transaction id +
  timestamp) to a `localStorage`-persisted list, rendered in a "Continuation"
  card that stays hidden entirely until at least one entry exists. Selecting
  an entry sets both the test case and the vehicle no. fields; a small × on
  each entry removes it manually. **Selection is a click on the row, not a
  radio button** (changed 2026-08-27, per Faizuddin: "remove the
  radiobutton, just make it highlight when i want to choose which one to
  run") — the highlight itself (`border-indigo-600 bg-indigo-950/30`) was
  already independent of the input element, so this only touched the
  clickable target, not the highlight logic. **Automatic removal, added 2026-08-24, per
  Faizuddin**: when a Part 2 run finishes, a PASS (`status: 'SUCCESS'`)
  removes its continuation entry automatically — nothing left to do with it.
  A FAIL leaves the entry in place on purpose: the underlying dev-patch data
  (vehicle no. + already-expired pre-check) is still valid, so once whatever
  broke is fixed, the SAME entry lets the user retry with the SAME data
  rather than redoing Part 1 from scratch. Each entry also has an Info
  toggle to view/copy just its Vehicle Number + Transaction ID (added
  2026-08-24), and a card-level "Copy all" button that copies every
  continuation's Vehicle Number + Transaction ID at once. **A THIRD copy
  option, added 2026-08-27 per Faizuddin** ("allow me to select the TS to
  copy the details, since i dont want to copy all, just a select few"): a
  checkbox on each entry (`selectedContinuations`, a `Set<string>` of
  ids — separate from the existing radio button, which still controls
  which ONE entry is the active Part 2 selection) plus a "Copy selected
  (N)" button that only appears once at least one is checked, sitting
  next to "Copy all" rather than replacing either one-at-a-time or
  copy-everything. The dashboard's top row is a `grid-cols-[1fr_4fr]`
  split (no responsive breakpoint — this is a desktop tool, and gating a
  fixed ratio behind a `lg:` breakpoint silently collapsed to a stacked
  layout on a high-DPI display where the CSS viewport width can differ a
  lot from the physical screenshot size) — left column is the run inputs
  (env, vehicle no, credentials, Run/Stop), right column (4× wider) holds
  "Test case" and "Continuation" side by side. All run results (steps,
  result card, video, log) live in a second, full-width row below.
  `app/api/eauto-edereg-precheck/run/route.ts`'s `testCase` →
  Playwright-project map grows by two entries per two-part case
  (`<name>-part1`, `<name>-part2`), and its own kill-timeout was raised from
  10 to 16 minutes to give CPC_E2E_TS5 Part 2's real ~6-minute wait room.

## Declined-payment retry shape — NEVER confirmed live, built 2026-08-24

A payment that gets DECLINED by the gateway itself (RHB `IF` — insufficient
funds, or `RE` — a reset-timer window, per §5.3) is a THIRD shape at the
inline pre-check purchase, distinct from the two `resolveVehicleGate()`
already handles (immediate green gate; a terminal `#payment-result` with a
single Close button, for Approved/JPJ-Failed outcomes where the payment
itself succeeded). Built entirely from
`EAINT-9306-dereg-step2-precheck-payment-failed-retry.html` — an IF capture
— plus its own header-comment note from Faizuddin:

- `#precheck-popup` re-renders with a `#payment-history-portion` list of
  every prior failed attempt for this transaction, and a Next/Cancel
  buttonpane (no Close). `DeregTransactionPage.attemptInlinePayment()`
  detects this via `#payment-history-portion`'s visibility.
- **A real native browser `confirm()` fires on EVERY attempt that gets
  DECLINED — not on a successful attempt.** This is the test plan's own
  "payment failed message popup > Click [OK]" step; `withNativeConfirm()`
  auto-accepts it transparently, so no separate jQuery-dialog handling was
  needed for that step. Since this can happen on the very FIRST attempt too
  (not just retries), `resolveVehicleGate()`'s own Next-click is now also
  wrapped in `withNativeConfirm()` defensively — harmless when no native
  dialog fires (true for every already-confirmed scenario), but would have
  reproduced the exact "#to-continue looked like it did nothing" failure
  mode (§8) for any scenario that hits a decline.
  - Clicking "Next" on the Payment History dialog retries the SAME payment
    (and re-triggers the native confirm on another decline) — `Dereg
    TransactionPage.attemptInlinePayment()` is written so the SAME method
    call handles the first attempt and every retry identically, since it's
    always just "click Next on whichever dialog is currently open."
  - `#reset-timer`/`#clockdiv` (a "Waiting for RHB to reset payment."
    countdown) exists in the DOM for the IF capture too, but hidden — this
    is why it's assumed to be an `RE`-specific ("RE" = reset) UI element,
    not universal to every decline. **Unconfirmed.**
    **Bug, confirmed live 2026-08-24 (Faizuddin: "the automation shut down
    too early")**: `waitOutPaymentResetTimer()` used to poll the countdown
    widget's own DOM for completion (`.minutes`/`.seconds` reaching "00"),
    with `if (!timer ...) return true` as a fallback — meaning "the guessed
    selector found nothing" was treated as "the countdown already finished,"
    so the wait resolved in well under a second instead of anywhere near 6
    minutes, and the retry ran immediately (before the gateway's real reset
    window had elapsed). **Fixed**: Faizuddin confirmed the real countdown
    is a FIXED 6 minutes, enforced by the payment gateway itself (not just a
    UI display) — a retry attempted before it elapses won't succeed even
    after re-steering eSIM to the happy-path code. `waitOutPaymentResetTimer()`
    now just waits `6 * 60_000 + 30_000` ms unconditionally (30s padding
    past the 6-minute mark), dropping the DOM-guess entirely. Both TS5 and
    TS11 Part 2 already budget `test.setTimeout(16 * 60_000)`, comfortably
    covering the confirmed 6.5-minute wait plus the rest of each flow.
  - `#payment-history-portion`'s duplicate-`id`-free structure (no
    `responseDesc` collision issue here, unlike `#payment-result`) means no
    special selector care was needed for reading it — this suite doesn't
    currently read the Payment History rows' content at all, only detects
    the dialog's presence.

- `pages/DeregTransactionPage.ts` drives all 6 Deregistration steps, using
  `utils/mykadEmulator.ts` (a second WebSocket connection to
  `ws://localhost:7878/IDCard`, protocol taken from
  `_reference/html/mykad-emulator/control-panel.html`) for the three MyKad
  auth points.
- **BO side — started 2026-08-24 for the JPJ XML Log specifically, still not
  run live.** Phase 2 was confirmed out of scope on 2026-08-21 (see §7) —
  that stands for BO transaction verification generally, but a first BO leg
  was built anyway because the SRD's own CPC_E2E_TS1 checklist asks for a
  "JPJ XML Log" check (see "TS1 SRD checklist" section below for the full
  breakdown, and `pages/BoLoginPage.ts`/`pages/JpjXmlLogPage.ts` for the
  implementation). BO login: `faizuddinBO1`/`password` (Faizuddin,
  2026-08-24), same shared eAuto login page as the AATF account, redirects to
  `/<segment>/home/` instead of `/view/aatf/home`.
- **Resolved 2026-08-21**: the fingerprint-bypass emulator's UI/API is now
  documented in [knowledge/mykad-emulator.md](mykad-emulator.md) — a local
  WebSocket server + control panel at `localhost:7878`, distinct from the
  eSIM bypass used by eSTM, do not port that logic over. It has to be applied
  at all three MyKad/thumbprint auth points in the Deregistration flow (§4),
  not just the first — the emulator itself doesn't know which screen is
  asking, it just answers whoever's listening on `/IDCard`.
- The "multiple different reports" cross-verification mentioned in the prior
  architecture note is still unspecified (which reports).
- Whether `openTrackedContext()`'s existing per-test evidence recording (see
  [automation-playbook.md](automation-playbook.md)) actually covers this
  ticket's context shape (repeat eSIM visits, the new emulator, STMS-vs-AATF
  login switches) remains unconfirmed — verify when building, not before.

## 10. TS1 SRD checklist — added 2026-08-24, NOT yet run live

Faizuddin's own SRD checklist for CPC_E2E_TS1 lists 4 items beyond the happy
path itself. All 4 are now built into `tests/edereg-precheck.spec.ts` (the
happy-path script) — none have been exercised live yet.

- **Pre-checking details / Payment details shown correctly** —
  `PrecheckEnquiryPage.verifyDetailsPage()`, called right after `done()`
  lands on the Pre-Checking transaction's Details page
  (`.../precheck/enquiry/view.do?id=...`). Confirms `#responseVehicleNo`
  matches, `#responseDesc` is non-empty, and every row under the "Payment
  Details" `.title2` heading contains "OK" — built from
  `EAINT-9306-precheck-details-and-listing.html`'s own note that this page
  reuses the SAME `#responseVehicleNo`/`#jpjStatusLabel`/`#responseDesc`
  field ids as the standalone flow's Step 3 Result screen. Also extracts the
  human-readable Ref No. (e.g. `PC68001111`) from the title bar for later
  JPJ XML Log lookups. **The checklist's "Failed" enquiry/payment sub-cases
  are NOT built here — CPC_E2E_TS2 already drives a Failed enquiry + Failed
  inline payment end-to-end**, per Faizuddin's own call (2026-08-24) not to
  duplicate it.
  - **Bug, confirmed live 2026-08-24, took THREE attempts to actually fix.**
    This method originally waited on `#result-container`, then
    `#responseVehicleNo` — both guesses from an earlier capture
    (`EAINT-9306-precheck-details-and-listing.html`) that had elided the
    whole Result section with a comment ("same block as STATE 3") instead of
    real markup. Both timed out and threw, silently killing the run right
    after the Pre-Checking leg — looked from the dashboard like the flow
    "just stopped" before Deregistration ever started. **The comment's
    assumption was simply wrong, not just incomplete** — a live capture
    (`EAINT-9306-precheck-details-live-2026-08-24.html`, pasted by Faizuddin)
    proved this page has NEITHER id: vehicle no. is a plain `<span>` inside
    `td.title1` (no id), the overall Trx Status is a `<span>` in `td.title1`'s
    next sibling `<td>`, and "Enquiry Response:" is a plain `<span>` in a
    table row (no id either). Only `#validAsAt`/`#vehicleRecord`/
    `#vehicleStatus`/`#verifiedStatus`/`#usageCode`/`#jpjBlacklist`/
    `#jsjBlacklist`/`#agencyBlacklist`/`#claimOwnership`/
    `#vehicleInInvestigation`/`#vehicleCondition` actually carry over — none
    of which this method needed to read. **Also found**: the live page
    reuses `id="verifiedStatus"` a SECOND time on the unrelated "Note: Able
    to proceed for eDereg" row — a real duplicate-id bug in the page itself,
    not a capture artefact. Fixed by reading the vehicle no./Trx Status/
    Enquiry Response off their actual markup instead of assumed ids;
    `PrecheckDetailsCheck.jpjStatusLabel` was renamed to `trxStatus` to stop
    implying it's the same value as `PrecheckResult.jpjStatusLabel` ('OK'/
    'Failed', Step 3 Result screen only) — it isn't.
- **"Yes" hyperlink in details page** — this is NOT on the Pre-Checking's own
  Details page; it's the "eDereg Pre-Checking: Yes" row on the
  **Deregistration** transaction's Details page (the page
  `payAndDeregister()` lands on after Done), positioned directly under
  "e-Invoice Validation Date:" in the same row grid — confirmed layout,
  `EAINT-9306-dereg-details-and-listing.html`.
  `DeregTransactionPage.verifyPrecheckingYesLink()` asserts the link's
  `href` (`.../precheck/enquiry/main.do?vehicleNo=<VN>&autoSearch=true`),
  clicks it, and confirms the resulting listing's `#vehicleNo` field is
  auto-filled and has at least one row. "The listing will show all existing
  transactions" is read as "every pre-checking transaction for THIS
  vehicle" (the `autoSearch` param is vehicle-scoped), not every transaction
  system-wide — flag if that reading turns out wrong on first run. Also
  extracts the Deregistration's own Ref No. (e.g. `D680000560`).
- **JPJ XML Log — check with Vehicle No. AND Transaction Ref. ID.** The BO
  home menu (`EAINT-9306-bo-home-menu.html`) lists TWO separate JPJ XML Log
  pages — Faizuddin confirmed BOTH are in scope for this checklist item:
  - `/view/dereg/precheck/jpj/log/main.do` — the ticket's own log
    (`EAINT-9306-bo-jpj-xml-log-precheck.html`). Response Data field order
    confirmed from `_reference/JPJ XML Log - Code Splitter/✂️[QA] JPJ XML
    LOG - TEXT SPLITTER.xlsx` (sheets " 🟧eDEREG PRE-CHECKING - JPJ EN..." /
    "🟧eDEREG PRE-CHECKING - JPJ ENQ...", Faizuddin 2026-08-24), decoded by
    `utils/jpjXmlLogDecode.ts` — same 11 fields, same order, as the
    `#result-container` block already used elsewhere in this suite. Request
    Data's Receipt No./EFT Reference No. are in the SWAPPED (newer IDD)
    order per that sheet's own footnote, confirmed against a live captured
    row — do not "fix" this back to the sheet's literal original order. One
    response field (`trailingUnknown`, e.g. `2026082483685479`) appears on
    every live sample but isn't documented in the splitter sheet at all —
    kept raw, not guessed at. The script cross-checks this log's decoded
    Response Code against the AATF-side flow's own JPJ result.
  - `/view/dereg/jpj/log` — the Deregistration leg's own log
    (`EAINT-9306-bo-jpj-xml-log-dereg.html`). Different field layout
    entirely (MyKad no., category, vehicle no., chassis/engine no., emails —
    no code-splitter reference exists for this one), so the script only
    checks for row existence by each search mode, not a decoded
    cross-check.
  - Both pages share the same search form (`#type` radio: `vehicleNo` /
    `refNo`, `#to-search`) and results-table shape, one column apart (the
    Pre-Checking log has an extra "Search By" column) — one shared page
    object, `pages/JpjXmlLogPage.ts`, handles both via `basePath`.
  - **Requires its own login** — `pages/BoLoginPage.ts`, `faizuddinBO1`/
    `password` (Faizuddin, 2026-08-24), same shared `/public/login/` page as
    the AATF account but redirects to `/<segment>/home/`. Runs in a
    **separate browser context** opened mid-test
    (`page.context().browser()!.newContext()`), closed again before the
    script ends — this suite has never logged in as two different accounts
    in the same run before this.
- **Biggest unknowns, all NEVER run live**: the BO login itself (redirect
  URL assumed from the nav bar's `href`, never actually driven through
  login); whether `#type[value="vehicleNo"]`/`#type[value="refNo"]` are the
  correct radio-check targets (there are TWO `id="type"` elements on the
  page, one per radio — a duplicate-id shape Playwright's `.check()` should
  still resolve correctly via the `[value=...]` attribute selector, but
  untested); and whether the Pre-Checking log's decoded Response Code
  actually matches the AATF-side flow's own code on a live run.
- **Bug found and fixed 2026-08-24, live capture confirmed**:
  `verifyDetailsPage()`'s ORIGINAL guess (`#responseVehicleNo`, mirroring the
  standalone Step 3 Result screen's ids) does not exist on this page either —
  a live capture Faizuddin pasted
  (`EAINT-9306-precheck-details-live-2026-08-24.html`) proved the Details
  page has NEITHER `#result-container` (the very first guess) NOR
  `#responseVehicleNo`/`#jpjStatusLabel`/`#responseDesc`. Both guesses came
  from an earlier capture's comment ("same 12-attribute block as STATE 3")
  which was simply WRONG, not incomplete. The real page: vehicle no. is the
  first plain `<span>` in `td.title1` (no id), the overall Trx Status is a
  `<span>` in `td.title1`'s next sibling `<td>`, "Enquiry Response:" is a
  plain `<span>` in a table row (no id). `PrecheckDetailsCheck.jpjStatusLabel`
  was renamed to `trxStatus` since it's genuinely a different value, not the
  same field under a wrong id. Also found: the live page reuses
  `id="verifiedStatus"` a SECOND time, on the unrelated "Note: Able to
  proceed for eDereg" row — a real duplicate-id bug in the page itself.
  **`verifyDetailsPage()` now reads the correct markup and this bug is
  fixed** — confirmed by matching the pasted live HTML field-by-field, not
  by a third guess.

### Rolled out to every other TS, per Faizuddin — 2026-08-24, NOT yet run live

The same 4 checklist items apply beyond just TS1, with one rule: **a
two-part (dev-patch) case only checks on its LAST part** — Part 1 never has
the details on screen to check (it stops right after producing/expiring the
pre-check, before anything the checklist cares about renders). Factored into
`utils/srdChecklist.ts` (`runPostDeregSrdChecklist()` for a case that
completes a full Deregistration, `runJpjXmlLogChecklist()` standalone for
the JPJ-XML-Log-only cases) rather than re-deriving the BO-login/JPJ-log
dance in each spec file. `PrecheckEnquiryPage.findTransactionIdByVehicleNo()`
+ a `page.goto()` to its `view.do?id=...` URL substitutes for `precheck.
done()` at entry points that never call it (the "pre-check done in step 2"
ones) — its `.first()`-row assumption is CONFIRMED newest-first by both BO
JPJ XML Log captures.

- **Full checklist (all 4 items)** — CPC_E2E_TS1 (already built),
  CPC_E2E_TS7, CPC_E2E_TS9, and the LAST part of CPC_E2E_TS4/TS5/TS10/TS11:
  every one of these completes a full Deregistration transaction
  (`payAndDeregister()` returns), so the Deregistration Details page (for
  the "Yes" hyperlink) and a real, persisted Approved Pre-Checking
  transaction (for the details-page check) both exist to check against.
- **Pre-Checking details/payment + JPJ XML Log only, no "Yes" hyperlink** —
  CPC_E2E_TS2. This standalone-entry-point case DOES persist a real
  Pre-Checking transaction even on a Failed enquiry (unlike the inline
  entry point), so `precheck.verifyDetailsPage()` (called directly, same as
  TS1 — no listing lookup needed since `precheck.done()` already landed
  there) and the Pre-Checking JPJ XML Log both have something real to check.
  No Deregistration Details page ever renders here (the inline retry fails
  the same gate and stops at Step 2), so no "Yes" hyperlink check and no
  Deregistration-log-by-ref-no search (still searched by vehicle no.,
  informationally).
- **JPJ XML Log only (vehicle no. search), nothing else** — the LAST part of
  CPC_E2E_TS6/TS12. Both are deliberately exploratory (repeated payment
  declines, no re-steer to success, no dev-patch continuation beyond Part
  2) — no Deregistration ever completes and no Approved Pre-Checking
  transaction gets created in Part 2 either, so the "Yes" hyperlink check
  and the Pre-Checking details-page check have nothing to check against.
  Only the JPJ XML Log's Vehicle No. search still runs, since that doesn't
  depend on anything having succeeded.
- **Nothing added** — CPC_E2E_TS8. Same inline "pre-check done in step 2"
  Failed shape as CPC_E2E_TS2, but through the entry point that does NOT
  persist anything on Failed (`resolveVehicleGate`'s own dead-end shape) —
  there is no real transaction record at all to check, unlike TS2's
  standalone-entry Failed case.

## 11. Multi-tab video evidence — fixed 2026-08-24

**The problem, confirmed by Faizuddin**: whenever this suite opens an extra
tab/window (the MyKad emulator's throwaway page per `insertCard()` call, the
BO context this ticket's JPJ XML Log checks use), that tab's own recording
was silently dropped. Root cause: Playwright's `video: 'on'`
(`playwright.config.ts`) records EVERY page in a context as its OWN
`.webm` file — it never merges pages within a context into one recording.
The dashboard route's `publishVideo()` (`app/api/eauto-edereg-precheck/
run/route.ts`) just walked `test-results/` for every `.webm` and copied
whichever one happened to be newest by file-modified-time — every other
tab's evidence was thrown away, and "newest" wasn't even reliably the main
flow's own video (everything tends to get flushed to disk around the same
moment, at test teardown).

A SEPARATE gap on top of that: a manually-created `browser.newContext()`
(the BO context) does NOT inherit `use.video: 'on'` from the config at
all — that has to be passed explicitly via `recordVideo` on the
`newContext()` call, or it records nothing whatsoever.

**Fix — per Faizuddin's chosen option, concatenate into ONE continuous
video (ffmpeg, already installed on this machine) rather than showing
multiple separate clips**:

- `scripts/eauto-edereg-precheck/utils/videoManifest.ts` — every helper that
  opens/closes its OWN sub-page appends an entry (`{ label, path }`, one
  JSON object per line) to `test-results/video-manifest.jsonl`, in the
  TRUE order those pages occurred (not file mtime, which is unreliable —
  see above). Reset at the very start of every test
  (`fixtures/sessionFixture.ts`'s `session` fixture calls
  `resetVideoManifest()`) so a previous run's manifest can never leak into
  the next one's concatenation.
  - `MykadEmulatorClient.insertCard()` records its own page right after
    closing it (a video's `.path()` only resolves once the page is
    actually closed).
  - `utils/srdChecklist.ts`'s `runJpjXmlLogChecklist()` now passes
    `recordVideo: { dir: <test-results>, size: { width: 1920, height: 1080 } }`
    to the BO context's `newContext()` call (matching the main config's
    viewport, so ffmpeg never has to reconcile a resolution mismatch), and
    records that page's video too, right after `boContext.close()`.
- `publishVideo()` (route.ts) now: reads the manifest; treats whichever
  `.webm` file is NOT listed in it as "the main page's own video" (always
  first, since the whole test starts there — this holds regardless of file
  mtime); then ffmpeg-concatenates \[main video\] + \[manifest entries, in
  their recorded order\] into one `run.webm`, via the concat demuxer
  (`-f concat -safe 0`) with a re-encode (`-c:v libvpx`, NOT `-c copy` —
  separately-recorded clips aren't guaranteed byte-identical codec params
  even at matching resolutions). Falls back to the OLD "just copy the
  newest" behaviour if ffmpeg is missing or the concat fails, so a run
  never ends up with literally no video.
- **Smoke-tested 2026-08-24** (two synthetic 2-second clips, concatenated
  via the exact command `publishVideo()` runs) — produced a clean 4-second
  output. The real per-run behaviour (does the MAIN-vs-manifest split
  actually land in the right order on a live multi-tab run, does a ~9-16
  minute real run's concat finish inside a reasonable time) is still
  UNCONFIRMED — this has never been exercised against an actual Playwright
  test run, only a synthetic ffmpeg-only check of the concat command
  itself.

**REVERSED 2026-08-27, per Faizuddin — concatenation abandoned in favour of
publishing every recording SEPARATELY, plus a burned-in timestamp.** Several
MU_TS scenarios have genuinely CONCURRENT actions across two browsers
(User A / User B / BackOffice) — stitching them into one continuous video
made it impossible to tell what happened at the same real-world moment, or
to judge pass/fail per user from the single file. Piloted first on MU_TS1
before rolling out further:

- `app/api/eauto-edereg-precheck/run/route.ts`'s `publishVideo()` (single
  ffmpeg-concatenated file) replaced with `publishVideos()` — copies EVERY
  `.webm` (main page + every manifest entry) as its OWN file into
  `public/qa-artifacts/eauto-edereg-precheck/`, returning `{ label, url }[]`
  instead of one string. `concatVideos()`/ffmpeg are no longer called at
  all (the function was removed, not just unused) — no codec/resolution
  reconciliation needed anymore since nothing gets re-encoded together.
- Dashboard response shape changed from `video?: string` to
  `videos?: { label: string; url: string }[]`
  (`app/eauto/edereg-precheck/page.tsx`) — renders one `<video>` element per
  entry, each labeled, in a responsive grid instead of a single player.
- **New: a live timestamp overlay**, since separately-published videos have
  no shared clock to correlate concurrent moments across browsers.
  `utils/overlay.ts` grew `TIMESTAMP_OVERLAY_INIT_SCRIPT` — burns a small
  fixed clock (top-right, monospace, updates every second) onto every
  recorded frame, injected via `context.addInitScript()` so it survives
  every navigation within that context. Wired into
  `fixtures/sessionFixture.ts` for the MAIN page/context — this covers
  EVERY test automatically, no per-spec change needed for the main
  recording. Any test that opens its OWN separate context (User B,
  BackOffice, etc.) needs one extra line,
  `await <context>.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT)`, right
  after creating that context — added to MU_TS1's own `userBContext` as
  the pilot.
- **`recordSubPageVideo()`'s own manifest mechanism (utils/videoManifest.ts)
  needed NO changes** — it already labels and lists every sub-page video;
  the route-side change just stopped concatenating what it already had.
  This means once MU_TS1's pilot is confirmed live, rolling out to every
  OTHER test in the suite needs ONLY the one-line
  `context.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT)` addition per
  test's own manually-created context(s) — the route/dashboard/manifest
  side already applies universally.

**Confirmed live 2026-08-27, MU_TS1 pilot — PASSED.** Separate `.webm`
files (`main-1.webm`, `main-2.webm`, three `sub-N-mykad-emulator.webm`,
`sub-4-mu-ts1-user-b.webm`) all landed correctly in
`public/qa-artifacts/eauto-edereg-precheck/`, confirming `publishVideos()`
works end-to-end. The dashboard not showing them turned out to be a stale
browser bundle (pre-dating the `page.tsx` change), not a real bug — a hard
refresh fixed it.

**Rolled out to every OTHER test in the suite, same day, per Faizuddin
("apply this for all TS in 9306")** — the one-line
`context.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT)` addition, per
manually-created context, added to: MU_TS2 (User C), MU_TS3 (User C),
MU_TS4 (User B), MU_TS5 (User C), MU_TS6 (User B), MU_TS7 (User B), MU_TS8
(User B), MU_TS9 (User B + BO), MU_TS9B (User B + BO), MU_TS10 (BO ×2 +
User B), the "dual create" diagnostic (UCD2), and `utils/srdChecklist.ts`'s
own BO context (feeds TS1 and most single-user tests' SRD checklist, not
just the Multiple Users cases).

**One real gap found and fixed while rolling this out**: MU_TS10's three
manually-created contexts (`boContext1`, `userBContext`, `boContext2`) had
**no `recordVideo` config at all** — User B's and BO's actions were never
being recorded in that test, a pre-existing bug unrelated to this rollout
but caught by it. Fixed: all three now pass the same `recordVideo` config
every other sub-context uses, and the two BO contexts (which never called
`recordSubPageVideo()` either) now do.

NOT yet re-run live for any test besides MU_TS1's own pilot — the
timestamp overlay's legibility and the separate videos' correctness on a
genuinely concurrent multi-browser run are still open for the rest of the
suite.

**Follow-up, same day — selectable download added.** Faizuddin asked for a
way to pick which of the now-separate recordings to download together,
rather than only being able to play each one individually in the browser.
New route `app/api/eauto-edereg-precheck/download-videos/route.ts`: takes
`{ files: string[] }` (the same `url` values `publishVideos()` returns),
resolves each to a real file inside `public/qa-artifacts/
eauto-edereg-precheck/` (rejecting anything that would resolve outside
that folder — `path.basename()` strips any path component the client
sends, so no `..` traversal is possible), and returns either the file
directly (exactly one selected) or a zip (more than one). Zipping uses
PowerShell's `Compress-Archive` on Windows (no new npm dependency, and
this whole suite already assumes a local Windows machine — the MyKad
emulator, VPN, `taskkill` elsewhere in `../run/route.ts`) with a `zip` CLI
fallback for other platforms. `app/eauto/edereg-precheck/page.tsx` grew a
checkbox per video, a Select all/Deselect all toggle, and a "Download"
button that POSTs the selection and triggers a browser download via a
`Blob`/`URL.createObjectURL()`. NOT yet tried live.

## 12. Deliberate slowdown on "details" screens — added 2026-08-24, NOT yet run live

**Why**: too fast to actually read back on the recorded video afterward,
per Faizuddin — the whole point of the multi-tab recording fix above (§11)
is having usable evidence, which a screen that's on camera for a couple
hundred ms doesn't give you. **Explicitly scoped to screens DISPLAYING
something back to the tester — NOT to form-filling steps**, per Faizuddin's
own instruction ("if it's the part of filling the details, that one can
keep as is").

- `CONFIG.detailsPauseMs` (`data/config.ts`, default `4000`, override via
  `DPC_DETAILS_PAUSE_MS`) and `PrecheckSession.pauseForDetails()`
  (`utils/session.ts`) — a thin `page.waitForTimeout()` wrapper, called
  right after a screen finishes rendering whatever it's showing, before
  anything clicks/navigates away.
- Applied at every confirmed "displaying details" moment across BOTH page
  objects: `PrecheckEnquiryPage.readResult()` (Step 3 Result), `.
  verifyDetailsPage()` (Pre-Checking Details page), `.
  findTransactionIdByVehicleNo()` (the listing, before navigating into a
  row's details); `DeregTransactionPage.resolveVehicleGate()` and `.
  attemptInlinePayment()` (the inline pre-check payment result popup, in
  ALL three shapes — Approved/Failed terminal result, AND the declined
  Payment History popup), `.jpjCheck()` (Step 4 JPJ check result), `.
  payAndDeregister()` (Step 6 final result AND the Deregistration Details
  page it lands on after Done), `.verifyPrecheckingYesLink()` (the listing
  after clicking "Yes"); `JpjXmlLogPage`'s shared `readRows()` (every JPJ
  XML Log search result, for both logs) — that class has no
  `PrecheckSession` (runs in the BO context), so it pauses directly via
  `CONFIG.detailsPauseMs` instead of the session helper.
- **Deliberately NOT paused**: `resolveVehicleGate()`'s "already
  satisfied" branch (the green/red gate icon on the Step 2 form itself) —
  judged as part of the step-2 FORM, not a dedicated details screen, so it
  stays at full speed along with the rest of form-filling. Revisit if
  Faizuddin wants that one slowed too.
- Every form-filling step (vehicle/consent, owner/contact fields, file
  uploads, MyKad/thumbprint auth) is untouched — still runs at whatever
  speed it already ran at.
- Confirmed live 2026-08-26 (CPC_E2E_TS5 Part 2, full run through
  Deregistration) — the reset-timer wait, the retry, and the rest of the
  flow all completed correctly once the two bugs in §14 were fixed.
- **Scroll-into-view added 2026-08-26, per Faizuddin**: holding still at
  the TOP of a page taller than the fixed 1920x1080 viewport
  (playwright.config.ts) never showed anything below the fold on the
  recording — a real gap the pause alone didn't fix. `pauseForDetails()`
  now checks `document.documentElement.scrollHeight` against
  `window.innerHeight`; if the page is actually taller, it splits
  `detailsPauseMs` into a read-at-top half, a smooth `window.scrollTo()` to
  the bottom, and a read-at-bottom half. A screen that already fits
  (most jQuery UI dialogs — the payment/pre-check popups are small) just
  holds still as before, no pointless scroll. Doesn't scroll back to top
  afterward — unnecessary, since Playwright's own click()/fill() auto-scroll
  their target into view regardless of current scroll position. NOT yet
  run live — needs a real recording watched through a tall page (the
  Pre-Checking/Deregistration Details pages are the likely candidates) to
  confirm the split timing is actually enough to read both halves.

## 13. VPN reminder during the RE reset-timer wait — added 2026-08-24, NOT yet run live

**Why**: Faizuddin's VPN tends to disconnect during CPC_E2E_TS5/TS11 Part
2's real ~6.5-minute idle wait (`DeregTransactionPage.
waitOutPaymentResetTimer()`, §11's bug-fix section) — and the automation
needs the VPN again right after, to re-steer eSIM before retrying payment.
Scoped narrowly, per Faizuddin: only this wait, not a general VPN-timeout
feature, and the exact lead time doesn't matter ("does not need to be
exactly 1 minute, as long as it's before eSIM") — anchored to "before eSIM
gets touched again," not to any confirmed VPN auto-disconnect duration
(nothing in this repo documents one).

**The architectural wrinkle this had to work around**: the dashboard's
`fetch()` to `/api/eauto-edereg-precheck/run` doesn't resolve until the
WHOLE test finishes — the route spawns the child process and only replies
once it closes (`child.on("close", ...)`). There is no live progress
channel while a run is in flight, so a warning timed to something
happening MID-run needs its own separate, actively-polled channel:

- `scripts/eauto-edereg-precheck/utils/waitStatus.ts` — `writeWaitStatus()`
  writes a small JSON marker (`test-results/wait-status.json`: `{ label,
  startedAtMs, waitMs }`) the MOMENT the wait starts;
  `clearWaitStatus()` removes it the moment the wait ends (success or not,
  via `finally`). Also cleared at the very start of every test
  (`fixtures/sessionFixture.ts`'s `session` fixture, alongside the video
  manifest reset) so a stale marker from a previous run can't leak in.
  `waitOutPaymentResetTimer()` is the only caller.
- `app/api/eauto-edereg-precheck/wait-status/route.ts` — a lightweight GET
  route that just reads that marker back (`{ waiting: false }` if it
  doesn't exist).
- `app/eauto/edereg-precheck/page.tsx` — while `running` is true, polls
  that route every 5s (`WAIT_STATUS_POLL_MS`). Once a wait marker is seen,
  computes `remaining = startedAtMs + waitMs - Date.now()`; once
  `remaining <= 60_000` (`VPN_REMINDER_THRESHOLD_MS`), shows:
  - A fixed, full-width, pulsing red banner ("RECONNECT THE VPN NOW...").
  - The browser tab TITLE flickering between "⚠ RECONNECT VPN NOW" and the
    page's normal title every 800ms — easy to miss the banner if the tab
    isn't focused for a 6.5-minute wait, and a title flicker is visible
    even from another tab/window.
  - Both clear the instant the wait marker disappears (wait ended) or the
    run stops being `running`.
- Deliberately did NOT build: an actual browser `Notification` API popup
  (needs an explicit permission grant first, and per-user setup wasn't
  asked for) or a general "VPN might disconnect" feature covering every
  automation page — scope is this one wait, per Faizuddin.
- NOT yet run live — the whole mechanism (marker file write/read timing
  across two separate Node processes, the poll cadence actually catching
  the 1-minute window, whether the banner/title flicker are noticeable
  enough in practice) is unconfirmed until an actual TS5/TS11 Part 2 run
  is watched through the reset-timer wait.

## 14. `attemptInlinePayment()` declined-check race — confirmed live 2026-08-26, fixed

CPC_E2E_TS5 Part 2's first live run got past the confirmed-fixed 6.5-minute
`waitOutPaymentResetTimer()` wait (§11/§13) fine, but then hung 90s on
`#payment-result` and Playwright killed the browser on timeout. The retry
had, in fact, been declined a SECOND time (RE again) — the failure
screenshot showed the Payment History popup with 2 entries and a fresh
`#reset-timer` counting down. `attemptInlinePayment()`'s declined-check was
the bug:

```ts
const declined = await p.locator('#payment-history-portion').isVisible().catch(() => false);
```

Called with no wait, immediately after the native `confirm()` dialog is
dismissed. On a decline, `#payment-history-portion` can take a moment to
render, so the immediate check caught "not visible yet," read that as *not*
declined, and fell through to waiting on `#payment-result` (the
success-only element) — which never appears on a real decline, hence the
90s hang. **Fixed** by racing both outcomes instead, same pattern
`fillVehicleRegNoAndCheckGate()` already uses:

```ts
await p.locator('#payment-history-portion, #payment-result').first()
  .waitFor({ state: 'visible', timeout: 90_000 });
const declined = await p.locator('#payment-history-portion').isVisible().catch(() => false);
```

**That first fix was itself wrong — confirmed live 2026-08-26 on the very
next run.** The combined-selector `.first()` above hit the SAME
duplicate-id trap `flow-ucd-shell.md` § "Traps in the shared markup"
documents for the UCD-side portals (`#dialog-campaign-close-btn` etc.):
this AATF page also carries a hidden/stale `#payment-result` node earlier
in DOM order than the real, visible `#payment-history-portion` decline
popup. `.first()` over the un-scoped selector locked onto that hidden
`#payment-result` copy every poll ("178 × locator resolved to hidden
`<div id="payment-result">`"), so it timed out the full 90s even while the
real decline popup was genuinely on screen and visible the whole time.
Playwright's own test-teardown then closed the browser on the throw — from
the outside this looks like "the automation just closed the browser by
itself," and since a THIRD reset-timer had already started counting down
by then (the retry really was declined again), it can look like it closed
*during* a countdown, without that countdown ever reaching 00:00 — but
that's this bug's 90s hang playing out, not the wait code itself
misbehaving. **Fixed properly** by scoping both sides to `:visible`, per
the codebase's own "never assume `#id` is unique" rule:

```ts
await p.locator('#payment-history-portion:visible, #payment-result:visible').first()
  .waitFor({ state: 'visible', timeout: 90_000 });
const declined = await p.locator('#payment-history-portion:visible').isVisible().catch(() => false);
```

`resolveVehicleGate()`'s own `#payment-result` wait (used by every
Approved-only inline flow — TS1/TS4/TS7/TS9/TS10/TS11/TS12 Part 1) was
also `:visible`-scoped defensively, since it's the identical selector on
the identical page — never confirmed broken there (every run through it so
far has been the Approved shape, no decline in the mix), but no reason to
assume it's safe just because it hasn't been hit yet.

**Confirmed by this same run, independent of the locator bug**: the retry
genuinely WAS declined a second time (RE again) after
`ensureEsimHappyPath()` re-steered both eSIM and RHB Transfer to OK. That
part is now unambiguous (the Payment History table showed two fresh
09:55am RE entries, not a locator artifact) — but *why* it declined again
is still open. Two live-confirmed bugs down, this one still unexplained:
possibly the re-steer doesn't propagate before the click, possibly TS5
genuinely needs more than one retry. `attemptInlinePayment()` only ever
gets called twice in `edereg-precheck-ts5-part2.spec.ts` (no retry loop) —
if a clean re-run declines again, that assumption needs revisiting before
anything else.

**Resolved, 2026-08-26, clean re-run**: with the `:visible` fix in place,
CPC_E2E_TS5 Part 2 ran all the way through — the retry succeeded, the gate
turned green, and the rest of Deregistration (owner/AATF consent, JPJ
check, pay & deregister) completed normally. Per Faizuddin: "its working
perfectly now, even after the timer finished, it can continue with the
change payment and what not." The single declined-retry seen on the prior
run was most likely just RHB's own gateway variance (a real possible
outcome, not a code bug) rather than a re-steer timing issue — no retry
loop was added, and none has been needed since.

## 15. AM_TS1-4 — Announcement Message banner, added 2026-08-26, NEVER RUN LIVE

**Test plan table** (`[eAuto - AATF] Deregistration - Test Plan (2).pdf`,
block "4 — Announcement Message", read directly from the PDF 2026-08-26 —
`pdftotext -layout` mangles this table since it sits side-by-side with the
Cronjob table and their rows interleave; had to render+crop the page with
`pdftoppm` and read it as an image instead). All 4 rows check the exact
SAME message/style, just 4 different screens/states — one shared "Message
Details" cell spans all 4 TS rows:

| TS No. | Page | Position |
|---|---|---|
| AM_TS1 | Home | Under the homepage navigation buttons |
| AM_TS2 | eDEREG | Under the eDEREG page options buttons |
| AM_TS3 | CREATE DEREGISTRATION TRANSACTION - KATEGORI ID | Under the MyKad/MyPR option |
| AM_TS4 | CREATE DEREGISTRATION TRANSACTION - KATEGORI ID (with popup) | Under the MyKad/MyPR option, below the popup |

Message: *"Effective immediately, AATF is required to complete the eDereg
Pre-checking process prior to proceeding with Deregistration, and
Deregistration may only be carried out upon successful completion of the
said pre-checking."* Format: 1. Red 2. Bolded.

**Automation**: `pages/AnnouncementBannerPage.ts` (`checkBanner()`) +
`tests/edereg-precheck-am.spec.ts`, project `edereg-precheck-am`, dashboard
testCase `am`. Since this is a pure navigate-and-check flow with no
transaction to create, all 4 checks run in ONE spec/one dashboard run
instead of one spec each (per Faizuddin's own framing — "very simple one
... just going to pages and checking it"):

1. AM_TS1 on AATF home (already there right after login).
2. Click `#DEREGISTRATION` → AM_TS2 on the eDEREG menu.
3. Click `#deregTransaction` → AM_TS3 on the Kategori ID category page.
4. Click the MyKad category link (`getByRole('link', { name: 'Orang Awam
   Malaysia (MyKad)' })`) → the category-confirmation popup opens → AM_TS4,
   banner checked WITH the popup still open. Dismissed via "TIDAK" (No)
   afterward, not "YA" — this test never needs a real transaction.

`checkBanner()` locates the banner by its own text (`getByText('AATF is
required to complete the eDereg Pre-checking process', { exact: false })`)
since the div carries no id or class on any of the 3 screens — just inline
`style="color:red; font-weight:bold"`. Reads `getComputedStyle()` to assert
red (`rgb(255, 0, 0)`) and bold (`font-weight: bold` or `>= 700`), not just
text presence, since the test plan's own "Format: 1. Red 2. Bolded" line
makes styling part of the expected result, not just the message text.

**Selectors confirmed from live HTML** for AM_TS1-3
(`EAINT-9306-aatf-home-and-menu.html` STATE 1 (home) and STATE 3 (eDEREG
menu), `EAINT-9306-dereg-create-category-select.html` STATE 1 (category
page) — all captured 2026-08-21). **AM_TS4 is the one unconfirmed piece**:
that capture's STATE 2 (the popup open) was never actually captured as real
markup, only described in a comment (`#category-confirmation`, buttons
TIDAK/YA). The banner div sits outside the jQuery UI dialog/overlay in
STATE 1's markup, so it should stay in the DOM and visible underneath the
popup — but that's an assumption, not a confirmed live behaviour, until
this runs and either confirms it or turns up a real capture-worthy
surprise (per the standing HTML-capture rule, if it does).

## 16. OF_TS1-3 — Other Functions, added 2026-08-26, NEVER RUN LIVE

**Test plan table** (`[eAuto - AATF] Deregistration - Test Plan (2).pdf`,
block "5 — Other Functions", read the same way as AM's table 2026-08-26 —
render+crop with `pdftoppm` and read as an image, `pdftotext -layout`
mangles side-by-side tables). All 3 live on Deregistration Step 2's Vehicle
Details form:

| TS No. | Scenario | Steps | Expected Results |
|---|---|---|---|
| OF_TS1 | Cancel pre-checking in step 2 | After the popup for the pre-check appears, click **Cancel** | Popup removed; error message under Vehicle No. field reads "**Approved eDereg Pre-Checking within 6 months is required to proceed**", bright red |
| OF_TS2 | Leave the Vehicle No. field blank | Fill in all details except **Vehicle No.** | Popup "**Vehicle No. is required.**"; field turns **yellow** with **red** text inside |
| OF_TS3 | Different input types in Vehicle No. field | (a) non-numeric/non-letter chars (b) spacebar (c) lowercase letters | (a) rejected (b) auto-removed (c) auto-capitalized |

**Automation**: `pages/OtherFunctionsPage.ts` + `tests/edereg-precheck-of.spec.ts`,
project `edereg-precheck-of`, dashboard testCase `of`. Combined into ONE
spec/run, same reasoning as AM_TS1-4 — all 3 stop at Step 2, no real
transaction created:

1. `createFromHome('MYKAD')` + `authenticateOwner()` to reach Step 2.
2. OF_TS1 — `cancelPrecheckPopup()`.
3. OF_TS2 — `submitWithBlankVehicleNo()`.
4. OF_TS3 — `checkVehicleNoInputShaping()`.

**OF_TS1 — confirmed live, reusing an already-proven code path.**
`DeregTransactionPage.fillVehicleRegNoAndCheckGate()` was made public for
this (previously private, shared internally by `resolveVehicleGate()`/
`beginInlinePaymentFlow()`) — it's the EXACT SAME gate check
`beginInlinePaymentFlow()` uses, and that method's own first call is what
CPC_E2E_TS5 Part 2 ran live successfully 2026-08-26 (§14). That run proves
the inline `#precheck-popup` opens right after the gate-check AJAX resolves
to `.error` — no separate `#to-continue`/Next click needed first, despite
`EAINT-9306-dereg-step2-vehicle-details.html`'s own capture comment saying
"Clicking Next... triggers a jQuery UI popup" (that comment describes a
DIFFERENT trigger path — the popup can also fire on Next when Step 2 is
submitted with an unresolved gate — not the ONLY way it opens). `Cancel` is
clicked instead of `Next` — untested action on an otherwise-proven dialog,
should be low-risk but is still a first for this suite.

**OF_TS2 is the one real gap.** No live HTML capture exists for the
blank-Vehicle-No. validation state — the test plan only describes it
("popup 'Vehicle No. is required.'", field turns yellow/red). Checked
`_reference/codebases/AATF/` and `_reference/html/` for any prior capture
of an `is-required`-class field's actual validation popup (that class
appears on plenty of other AATF/eSTM fields, e.g. `#contactNo`, `#email`,
`estm-step2-buyer-vehicle.html`'s own fields) — none exists anywhere in the
repo, so this isn't a shared/already-solved pattern to borrow from either.
`submitWithBlankVehicleNo()`'s checks past the `#to-continue` click are
broad and best-effort (any "vehicle no. is required" text anywhere on the
page, plus `#vehicleRegNo`'s own computed background/text color) —
**expect this to need a real fix on the first live run**: capture whatever
the actual markup turns out to be (per the standing HTML-capture rule) and
tighten the selector in the same change.

**OF_TS3 needed no captured markup at all** — pure DOM input-shaping,
checked by typing into `#vehicleRegNo` with `pressSequentially()` (not
`.fill()` — `.fill()` sets the value directly and may not fire the
keydown/input events the page's own filtering JS listens for) and reading
back `.inputValue()`. Lowest-risk of the 3.

**Precondition, same as every other "gate BLOCKED" scenario in this
suite**: `vehicleRegNo` must NOT have an approved pre-check within the last
6 months, or OF_TS1's popup never appears. Use a fresh/unused plate via the
dashboard form — the shared happy-path vehicle (already Approved multiple
times this session, see §14) will NOT work here.

## 17. OF_TS5 — JPJ XML Log, added 2026-08-26, NEVER RUN LIVE

**Test plan row**: Page column left blank/grey (not "Deregistration - Step
2" like OF_TS1-3 — this one's BO-side). Steps: (1) Login as BO and go to
JPJ XML Log, (2) enter Vehicle No. that was purchased pre-check through
Deregistration step 2, (3) enter Transaction Ref No. (obtainable from the
pre-check listing page). Expected: "Ensure all details displayed
correctly." Per Faizuddin's own framing for this build: "go to create
transaction (user provide fresh VN without any pre-checking transaction).
at step 2, just do up until purchase pre-check succesfull, and then
proceed with the BO JPJ XML log."

**Automation**: `tests/edereg-precheck-of-ts5.spec.ts`, project
`edereg-precheck-of-ts5`, dashboard testCase `of-ts5`. Built ENTIRELY out
of already-proven pieces, no new page-object code needed:

1. `ensureEsimHappyPath()` + `createFromHome('MYKAD')` + `authenticateOwner()`
   + `fillOwnerContactFields()` — identical setup to CPC_E2E_TS10 Part 1.
2. `resolveVehicleGate(vehicleRegNo)` — same call CPC_E2E_TS10 Part 1 uses
   to trigger the inline pre-check purchase and stop the INSTANT the gate
   turns green, never calling `submitVehicleDetails()`/continuing into Step
   3+. Throws if the gate isn't satisfied — this case has nothing to check
   in the JPJ log without a real, persisted pre-check.
3. `PrecheckEnquiryPage.findTransactionIdByVehicleNo()` +
   `verifyDetailsPage()` — same two-step lookup `runPostDeregSrdChecklist()`
   already uses for this exact "inline entry point has no `Done` screen"
   gap (§ "UI locations affected" / CPC_E2E_TS10/11/12's own bullet) — gets
   the internal transaction id, navigates to the details view, reads the
   real `Ref No.:` text off it.
4. `runJpjXmlLogChecklist()` (`utils/srdChecklist.ts`, unchanged) — same
   BO-login + dual-search (Vehicle No., then Ref No.) helper every other TS
   case's checklist already calls. `deregRefNo` passed as `''` since this
   case never creates a real Deregistration transaction — only the
   Pre-Checking log is searched, matching CPC_E2E_TS2's same reasoning for
   skipping the Deregistration-log half.

Nothing here is a new selector or a new assumption — every piece was
already built and, for `resolveVehicleGate()`'s Approved-outcome path and
`runJpjXmlLogChecklist()`'s BO-login dance, already used successfully by
other confirmed-live or previously-built specs. The only genuinely new
composition is chaining them in THIS order and stopping exactly where
OF_TS5 stops. **Precondition, same as CPC_E2E_TS7/TS10 Part 1**:
`vehicleRegNo` must have NO prior pre-checking transaction, or Step 2's
gate shows green immediately with no inline popup — the wrong entry point
for this case.

## 18. OF_TS4 — Pre-Checking Reset Payment, added 2026-08-26, REBUILT
2026-08-28, NEVER RUN LIVE

**Correction, 2026-08-28**: the original build below was wrong in one
specific way — Part 2 created a BRAND NEW Deregistration transaction on the
same vehicle no. instead of continuing the SAME transaction Part 1
declined. Per Faizuddin: "there's an issue with this logic. the part 2
cannot use another transaction. it must use the same transaction. so
basically, the automation needs to stay on the same transaction, i will
ask dev to patch the payment transaction, and tell the automation to
continue running it." That's the wrong shape for a PAYMENT reset — unlike
CPC_E2E_TS4/5/6/10/11/12's expiry-timestamp backdate (the record's age
changes, a brand-new session picking it back up by vehicle no. is fine),
here the dev is patching THIS specific transaction's payment state, so the
automation has to still be looking at the same one afterward.

**Rebuilt as a single run using the dashboard pause/continue mechanism**
(`utils/pauseSignal.ts`, the same one MU_TS11/TS12 use, §30/§31) instead of
a Part 1/Part 2 file split: `tests/edereg-precheck-of-ts4.spec.ts`, project
`edereg-precheck-of-ts4`, dashboard testCase `of-ts4`. The old
`edereg-precheck-of-ts4-part1/-part2.spec.ts` files, their two Playwright
projects, and their `of-ts4-part1`/`of-ts4-part2` dashboard wiring are all
deleted — no continuation entry is generated for this case anymore, same as
MU_TS11/TS12 aren't two-part either.

Flow now: first payment attempt declines (RHB IF) on the SAME
`#precheck-popup` that stays open through the whole test → look up the
transaction ID via a second tab (same login, doesn't disturb the open
popup) → `pauseForDashboardContinue()` — dashboard shows a Continue button,
ask the dev to reset the payment on that exact transaction ID → resume on
the SAME popup for Attempt A (retrigger) → Attempt B (retry) → re-steer
eSIM to OK → Attempt C (succeed) → continue through the rest of
Deregistration. `mykad` is kept open for the whole test now (closed only in
the outer `finally`), matching CPC_E2E_TS9's own
two-`resolveVehicleGate()`-calls-in-one-run convention, not the original
Part 1 file's early close (which only made sense when the test ended right
after the first decline).

**New, genuinely unconfirmed risk this rebuild introduces**: whether the
SAME `#precheck-popup` actually survives the pause/continue round-trip at
all — MU_TS11/TS12 keep THEIR own popups open across a pause too, but as of
this rebuild neither of those has been confirmed live either, so there's no
existing live evidence this pattern works for any popup, this one included.

Everything below this note describes the ORIGINAL (now superseded) build —
kept for the test-plan reasoning and step-by-step framing, which are all
still accurate; only "which transaction Part 2 acts on" changed.



**Test plan row**: Page "During purchasing pre-checking enquiry in
Deregistration step 2". Steps: (1) Create new Deregistration Transaction,
VN with no approved pre-check, (2) at Step 2 proceed with pre-checking,
RHB Payment = IF > provide Trx ID to dev for reset payment, (3) click
[Next] to retrigger eDereg Pre-Checking RHB Payment, (4) observe popup
message, (5) proceed until able to do Deregistration, (6) complete the
Deregistration until Trx Status = Approved, Payment = OK, JPJ
Pre-Checking = OK. Expected: (1) popup message after retrigger reads
"Rhb payment internal error, please try again later.", (2) able to proceed
after resetting payment.

**A NEW two-part shape, distinct from every other dev-patch case in this
suite.** CPC_E2E_TS4/5/6/10/11/12 all hand off for an EXPIRY patch
(backdate a JPJ-approval timestamp past 6 months) — the underlying record
itself doesn't change, just its age. OF_TS4 hands off for a PAYMENT RESET
instead — some other server-side state tied to a declined-and-stuck
payment attempt, not a timestamp. Clarified directly by Faizuddin
2026-08-26 (quoted in full since this shape isn't derivable from the test
plan text alone):

> (part 1) create new deregistration with fresh VN > at step 2, will
> purchase pre-checking with payment = IF > stop part 1 [...] (Part 2)
> create new deregistration using the same VN > at step 2, will purchase
> the payment again (this is why i call it retrigger, because we retrigger
> the payment function) > observe message error in the test scenario table
> > click [Next] to retry the payment again > check the details in the
> payment popup. it should show new payment reference in the payment
> history. the payment history list is in the popup also. make sure to
> scroll to capture all the payment history details > open eSIM and change
> the payment to OK > proceed until complete deregistration flow

**Automation**: `tests/edereg-precheck-of-ts4-part1.spec.ts` /
`...-part2.spec.ts`, projects `edereg-precheck-of-ts4-part1`/`-part2`,
dashboard testCases `of-ts4-part1`/`of-ts4-part2`.

- **Part 1** — same shape as CPC_E2E_TS10 Part 1 (inline entry,
  `beginInlinePaymentFlow()` instead of `resolveVehicleGate()` since this
  case WANTS the decline), steered to `RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS`
  (`'IF'`) via `setRhbTransferCode()`. Stops the instant the first attempt
  declines; looks up the Pre-Checking transaction ID via
  `PrecheckEnquiryPage.findTransactionIdByVehicleNo()`, same as TS10-12
  Part 1, to hand to the dev.
- **Part 2 makes THREE payment attempts**, not the usual two:
  1. **Attempt A** ("retrigger") — `beginInlinePaymentFlow()` again on a
     BRAND NEW Deregistration transaction (same vehicle no.) — eSIM's RHB
     Transfer is left steered to `IF` from Part 1; nothing resets it at
     the start of Part 2, since the dev's "reset payment" is a backend
     action unrelated to our own eSIM mock. Confirmed by Faizuddin: the
     expected "Rhb payment internal error, please try again later."
     popup is the SAME native `confirm()` dialog every other decline
     already fires — just different wording this time, not a new popup
     shape. Checked (not hard-asserted — logged as a WARNING on mismatch,
     since this exact wording is unconfirmed until a live run) via the
     new `dialogMessage` field on `PaymentAttemptResult`.
  2. **Attempt B** — `attemptInlinePayment()` retried, still declined,
     logs a NEW entry into the SAME popup's Payment History list.
  3. **Only now** — `ensureEsimHappyPath()` re-steers to OK.
  4. **Attempt C** — `attemptInlinePayment()` again, expects success, gate
     turns green, continues through the rest of Deregistration exactly
     like CPC_E2E_TS1/TS5/TS7/TS9's own continuations.

**Two things extended in shared code because OF_TS4 needed them, benefiting
every other case too**:
1. `PrecheckSession.withNativeConfirmCapture()` (`utils/session.ts`) — same
   as `withNativeConfirm()` but also returns the dialog's own `.message()`
   text. `DeregTransactionPage.attemptInlinePayment()` now uses this
   instead of the plain version, and `PaymentAttemptResult` grew a
   `dialogMessage` field — every existing caller (TS5/TS6/TS11/TS12 Part 2)
   gets this for free, unused unless they choose to read it.
2. `PrecheckSession.pauseForDetails()` — extended to scroll WITHIN the
   topmost visible `.ui-dialog`'s own `.ui-dialog-content` when THAT
   overflows, not just the outer page (§12's original scroll-to-bottom
   only checked `document.documentElement.scrollHeight`, which never
   changes when it's a DIALOG's own box that's too tall, not the page).
   Directly needed for OF_TS4's "make sure to scroll to capture all the
   payment history details" — and since `attemptInlinePayment()` already
   calls `pauseForDetails()` right after a decline (§12), this happens
   automatically with no new code in either OF_TS4 spec, and now also
   applies retroactively to TS5/TS6/TS11/TS12's own Payment History popups
   if theirs ever grows past the visible box.

**Still open**: whether Attempt A's specific wording is really because of
the dev's reset action, or would say the same thing on ANY retry of an
already-declined transaction regardless of a reset — no way to tell from
this script alone, only from watching what the dev's action actually
changes. First live run is the real test of the whole shape.

## 19. MU_TS1 — AATF Multiple Users, same company, added 2026-08-26, NEVER RUN LIVE

**Test plan row, as written**: Trx Status Approved, "2 Users / Same
company". Pre-requisite: AATF User A (Main) & User B (Sub) are from the
same company. Steps: (1) User A creates a new Deregistration, Step 2 input
vehicle no., (2) continue until Pre-Checking Enquiry = Successful, (3)
proceed until Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK,
(4) User B creates a new Deregistration, Step 2 input the SAME vehicle no.,
(5) proceed until Trx Status = Approved, Payment = OK, JPJ Pre-Checking =
OK, (6) ensure eDereg Pre-Checking Transaction Listing Page shows 2
different transactions.

**The written test plan is confirmed OUT OF DATE for this row — Faizuddin,
2026-08-26, take note for every future MU_TS case too, not just this one.**
Two corrections, both load-bearing for the automation's design:

1. **User A must NEVER complete a real Deregistration.** Steps 2-3's "Trx
   Status = Approved, Payment = OK, JPJ Pre-Checking = OK" are the INLINE
   PRE-CHECK's own status fields (same 3 fields the Pre-Checking listing
   shows), not the Deregistration transaction's final status. User A
   creates the Deregistration only to reach Step 2's compulsory gate, buys
   the pre-check inline, and STOPS — identical stopping point to
   CPC_E2E_TS10 Part 1 (`resolveVehicleGate()`, never
   `submitVehicleDetails()`). Per Faizuddin: **"once a vehicle number has
   proceeded with the deregistration, it cannot do [it] again"** — a real
   Deregistration is a one-time, irreversible action per vehicle in this
   system. If User A completed one, User B's own "reuse the pre-check"
   flow would have nothing left to prove (the vehicle would already be
   permanently deregistered) and the test vehicle would be burned for any
   future rerun. **User B, by contrast, DOES go all the way through a REAL
   completed Deregistration** — confirmed explicitly: "user B should go
   all the way and complete the deregistration." The whole point of this
   scenario is confirming the pre-check REUSE works (User B's gate comes
   up already green, no second purchase) — full completion is already
   covered elsewhere (CPC_E2E_TS1/TS7), so only one of the two users needs
   to prove it end-to-end here.
2. **Step 6's listing check is the Deregistration Transaction Listing
   (`/dereg/enquiry/main.do`), not the Pre-Checking one — and expects
   EXACTLY 1 row, not 2.** Per Faizuddin: "any deregistration that does not
   proceed to step 3 will not show up in the listing. this is because the
   deregistration will actually start in step 3." Since User A never
   reaches Step 3, only User B's transaction is ever a real, listed
   Deregistration record.

**Automation**: `pages/DeregTransactionListingPage.ts` (new — the
Deregistration listing had no page object yet, only the Pre-Checking one)
+ `tests/edereg-precheck-mu-ts1.spec.ts`, project `edereg-precheck-mu-ts1`,
dashboard testCase `mu-ts1`, group "AATF Multiple Users".

- **User A**: `createFromHome('MYKAD')` + `authenticateOwner()` +
  `fillOwnerContactFields()` + `resolveVehicleGate(vehicleRegNo)` — expects
  `satisfied && usedInlinePrecheck` (fresh vehicle, real inline purchase).
  Throws if not — nothing for User B to reuse otherwise.
- **User B**: a genuinely SEPARATE browser context and login
  (`CONFIG.subUsername`/`subPassword`, new fields added 2026-08-26,
  default `faizAATFsub2`/`password` per Faizuddin — same company as the
  main account). `LoginPage.login()` grew an optional `credentials`
  override param for this (`{ username, password }`, defaults to
  `CONFIG.username`/`password` — every existing caller unaffected).
  `fillVehicleDetails()` resolves User B's OWN gate check internally —
  expected to land on the "already satisfied" branch (no popup,
  `usedInlinePrecheck: false`) since the vehicle now qualifies via User
  A's pre-check. Throws if it triggers its own inline purchase instead —
  that would mean pre-check eligibility is NOT actually shared within a
  company, contradicting Faizuddin's own confirmation of the expected
  behaviour. Continues through `submitVehicleDetails()` /
  `ownerConsentAndAuth()` / `aatfConsentAndAuth()` / `jpjCheck()` /
  `payAndDeregister()` — a REAL completed Deregistration.
- User B's context gets its own `recordVideo`, folded into the manifest via
  `recordSubPageVideo()` — same pattern `runJpjXmlLogChecklist()`'s BO
  context already uses (§11).
- Users run STRICTLY SEQUENTIALLY, never concurrently — User A's
  `MykadEmulatorClient` connection fully closes before User B's context
  even opens. `knowledge/mykad-emulator.md` flags multi-session handling
  between the emulator connection and the AATF page's own connection as
  UNCONFIRMED for anything beyond one connection at a time — running the
  two users concurrently would be exactly the untested case that note
  warns about, so this script deliberately avoids it.
- Final check: `DeregTransactionListingPage.countTransactionsForVehicle()`
  searches by vehicle no. and expects exactly 1 row (User B's).

**Confirmed live 2026-08-26 — MU_TS1's whole scenario actually works.** The
run completed exactly as designed: User A bought the pre-check and stopped
(`usedInlinePrecheck: true`), User B's gate came up already-satisfied with
NO popup (`usedInlinePrecheck: false`) and went all the way through a real
completed Deregistration (`jpjDeregistrationStatus: "OK - TRANSACTION
SUCCESSFUL"`). Confirms the pre-check-sharing business rule Faizuddin
described really is per-company, not per-user or per-transaction.

**One real bug found on this same run**: the final listing check itself
returned 0 instead of 1, even though the transaction genuinely existed (the
video's true last frame showed exactly 1 row, HXA049, owner "MUHAMMAD
FAIZUDDIN SUB2", Approved). `#to-search` is a real `type="submit"` inside
`#search-form` — a full page reload, not an AJAX update.
`countTransactionsForVehicle()` originally did `.click()` then a SEPARATE
`waitForDomReady()` call, which races the reload: a frame captured
mid-video (before the true final one) showed the page mid-reload — Vehicle
No. field blank again, "please click to show record(s)" placeholder back —
proving the row count was read off a page that hadn't finished reloading
yet. **Fixed** by pairing the click with the load-state wait via
`Promise.all()` (click and wait started together, not sequentially) plus a
belt-and-suspenders check that `#vehicleNo` actually shows the searched
value before trusting the row count. Same root-cause shape as the
declined-payment popup race from earlier the same day (§14) — click, then
immediately reading page state in a SEPARATE await, without pairing the
wait to the action that triggers the change.

**Not yet decided / not built**: whether the SRD checklist
(`runPostDeregSrdChecklist()`) should run against User B's completed
transaction too. Left out for now to keep this first MU_TS case's scope to
exactly what the test plan (corrected) asks for — revisit if Faizuddin
wants it added.

**Second live run, 2026-08-27 — the reload-race fix above held (no repeat of
that symptom), but the SAME "0 instead of 1" result came back anyway, from a
DIFFERENT cause.** The listing check was run from User A's own session
(`page`/`session`, the vehicle-prefix `HXA060` this run) — but User A's own
Deregistration never reached Step 3 (stopped at the inline pre-check, by
design). Confirmed via the video/RESULT log that User B's Deregistration had
genuinely completed (`jpjDeregistrationStatus: "OK - TRANSACTION
SUCCESSFUL"`, a real `transactionId`) — so the 0 wasn't a false negative on
the reload, it was User A's session genuinely having nothing of its own to
find. **This means the Deregistration Transaction Listing is scoped to the
LOGGED-IN ACCOUNT, not the company** — the same root cause §21 already
found for the DIFFERENT-company case (MU_TS2/MU_TS3), now confirmed to apply
WITHIN a same company too, contradicting the assumption (used only for the
Pre-Checking-eligibility rule, not this listing) that same-company records
are mutually visible. **Fixed**: the listing check now runs from User B's
OWN session (`userBPage`/`sessionB`, moved inside User B's own try block,
before `userBContext.close()`), the same "check from whoever's own
transaction it is" principle §21 already established — not yet re-run live
to confirm the fix.

**MyKad identity per user, resolved 2026-08-26 (two attempts, first
reverted)**: User A and User B need DIFFERENT emulator identities
(`insertCard()` previously always sent the same hardcoded `FaizuddinAATF`
card for every caller). A first fix (profile NAME lookup against the
control panel's own `localStorage`) turned out fundamentally broken for
automation and was caught before ever working live — Faizuddin: "its not
choosing... i think the automation injects the ic and name," both users
still coming through identical. Root cause: a fresh Playwright browser
context never shares `localStorage` with a human's own real browser, so a
saved control-panel profile is invisible to automation regardless of name.
**Corrected fix**: `MykadEmulatorClient` now takes `{ nric, name }`
directly, injected into the card at construction — see
`knowledge/mykad-emulator.md`'s "Automation shape" section for the full
story of both attempts. This spec's User B now constructs its own
`MykadEmulatorClient` with `{ nric: CONFIG.mykadNricSub, name:
CONFIG.mykadNameSub }` — confirmed identity, 2026-08-26: NRIC
`030117-14-1005`, name `MUHAMMAD FAIZUDDIN SUB2`. Also driven by
Faizuddin's broader plan to hand this whole suite to colleagues — each one
types their own AATF account's NRIC/name into the dashboard, no code
change needed.

## 20. MU_TS2 — AATF Multiple Users, DIFFERENT company, added 2026-08-26, NEVER RUN LIVE

**Test plan row**: shares its Steps/Expected Results cell verbatim with
MU_TS1 in the PDF — never actually rewritten for the different-company
case. Per Faizuddin: "you can use this one, since the old steps/expected
results is outdated." Confirmed directly what the ONE real behavioural
difference is: "since the company is different, so their pre-checking
should be different. so the expected results is that company B [C] needs
to do their own pre-checking in step 2 of deregistration" — i.e. pre-check
eligibility is COMPANY-scoped, not globally vehicle-scoped. This is the
opposite of MU_TS1's confirmed reuse behaviour (§19) — same vehicle, same
underlying pre-check mechanism, but a DIFFERENT company gets the gate
BLOCKED instead of already-green.

**Third identity added, confirmed 2026-08-26**: "User C" — a genuinely
different company from the main account (User A) and the same-company sub
(User B). Login `CONFIG.subUsername2`/`subPassword2` (default
`AzfarAATF`/`abcd1234`), MyKad `CONFIG.mykadNricSub2`/`mykadNameSub2`
(default `020406081081` / `"23 , 24,25"` — genuinely that name, per
Faizuddin checking the DB directly, not a placeholder or a parsing error).
`app/api/eauto-edereg-precheck/run/route.ts` passes these through as
`DPC_SUB2_USERNAME`/`DPC_SUB2_PASSWORD`/`DPC_MYKAD_NRIC_SUB2`/
`DPC_MYKAD_NAME_SUB2`. Dashboard: the "User B / User C" column in the Test
Data card is shared/interchangeable (§ dashboard layout, same day) — which
one shows is driven by the selected test case's `multiUser: "same" |
"different"` flag, never both at once, per Faizuddin ("no scenario where i
need to test same and different company at the same time").

**Automation**: `tests/edereg-precheck-mu-ts2.spec.ts`, project
`edereg-precheck-mu-ts2`, dashboard testCase `mu-ts2`, `multiUser:
"different"`. Nearly identical shape to MU_TS1 (`resolveVehicleGate()` for
User A, stop at Step 2; a separate browser context/login for the second
user; sequential never concurrent, same mykad-emulator.md multi-session
caveat) with two differences:

1. **Inverted gate assertion** — `fillVehicleDetails()` for User C is
   expected to land on `usedInlinePrecheck: true` (own inline purchase
   fires) rather than MU_TS1's `false` (reuse, no popup). Throws if it
   comes back already-satisfied instead — that would mean cross-company
   reuse is happening, contradicting Faizuddin's confirmed rule.
2. **TWO listing checks, not one** — `PrecheckEnquiryPage` grew a new
   `countTransactionsForVehicle()` (same shape as
   `DeregTransactionListingPage`'s own method, but reusing the CONFIRMED
   `autoSearch=true` URL param `findTransactionIdByVehicleNo()` already
   uses — no manual fill+click, so none of that listing's reload-race bug
   applies here):
   - **Pre-Checking listing**: expect **2** rows — User A's AND User C's,
     since each bought their own separate pre-check this time. This is the
     one piece of the ORIGINAL test plan wording that's actually CORRECT
     for this case (unlike MU_TS1, where "2 different transactions" needed
     correcting to "1").
   - **Deregistration listing**: expect **1** row (User C's only) — same
     "only counts once Step 3 is reached" rule confirmed live for MU_TS1;
     User A never gets there regardless of which company's pre-check gate
     they hit.

Not yet run live — the core assumption (different-company gate genuinely
comes up blocked, not reused) rests entirely on Faizuddin's direct
confirmation, same evidentiary weight as MU_TS1's reuse claim before ITS
first live run (which then held up exactly as described). No reason
assumed here to doubt it, but flagging since it's the one thing this whole
script hinges on.

## 21. MU_TS3 — AATF Multiple Users, DIFFERENT company, RE decline, added 2026-08-26, NEVER RUN LIVE

**Test plan row**: Trx Status "Failed (Payment)", "2 Users / Different
Company". Confirmed by Faizuddin, after an initial mix-up over which of
MU_TS3/TS4 is same vs. different company (his first detailed description
was actually MU_TS4, not this one): "its the same flow [as MU_TS2], just
that since its different company, it should have different transaction
and should not affect each other." So MU_TS3 = MU_TS2's shape (§20) with
the inline pre-check purchase going through an RE decline-then-retry
first, and the two companies' countdowns confirmed INDEPENDENT — contrast
with MU_TS4 (same company, not yet built), which per Faizuddin's earlier
description expects a SHARED transaction/countdown instead.

**Automation**: `tests/edereg-precheck-mu-ts3.spec.ts`, project
`edereg-precheck-mu-ts3`, dashboard testCase `mu-ts3`, `multiUser:
"different"`. Composes pieces already proven individually, no genuinely
new mechanism except the countdown-read:

1. `setRhbTransferCode(..., RESET_TIMER)` once, shared eSIM entity (keyed
   by vehicle prefix, not by company — both users' attempts see the same
   steering).
2. User A: `beginInlinePaymentFlow()` — same call CPC_E2E_TS5/TS11 Part 2
   already confirmed live — first attempt declines (RE). STOPS, same
   "User A never completes a real Deregistration" rule as MU_TS1/TS2.
3. User C (different company, separate context): `beginInlinePaymentFlow()`
   too — Step 2 gate is ALSO blocked (confirmed MU_TS2's own-pre-check
   rule) — their own first attempt ALSO declines (RE), independent
   countdown.
4. **New**: `DeregTransactionPage.readResetTimerRemaining()` —
   `#clockdiv .minutes`/`.seconds`, confirmed markup from
   `EAINT-9306-dereg-step2-precheck-payment-failed-retry.html`, but never
   read live before this script. Diagnostic ONLY — does not gate or affect
   `waitOutPaymentResetTimer()`'s own fixed-duration wait (§14's bug/fix
   stands unchanged). Read once per user, right after their own decline;
   the spec computes each countdown's implied END timestamp (read time +
   remaining) and logs the gap between them — expected to be substantial
   (User C's own MyKad auth + form-filling takes real wall-clock time
   after User A's decline), which is the actual proof of independence.
   Logged, not hard-asserted against a threshold, since this is the first
   live look at whether `#clockdiv` even parses correctly at all.
5. Wait out User C's OWN countdown only (`waitOutPaymentResetTimer()`,
   called on User C's page) — User A's is never waited out, since User A's
   transaction is abandoned regardless.
6. Re-steer to OK, User C retries, succeeds, completes a REAL
   Deregistration — same shape as TS5 Part 2 / MU_TS2's User C leg.
7. Same two listing checks as MU_TS2 (§20): Pre-Checking listing expects
   2 rows, Deregistration listing expects 1 (User C's only).

**Timeout headroom, learned the hard way already once (§14)**: this test
does meaningfully more work than TS5/TS11 Part 2 (two full logins/MyKad
auths, the same 6.5-minute wait, PLUS User C's full submit → consent → JPJ
→ pay flow, PLUS two listing checks) — `test.setTimeout(20 * 60_000)`, and
`app/api/eauto-edereg-precheck/run/route.ts`'s own outer kill timer raised
from 16 to 22 minutes (`TIMEOUT_MS`, `maxDuration`) so the two aren't an
exact tie this time — deliberately budgeted with headroom instead of
waiting to hit the same race again.

**Next up**: MU_TS4 (same company) — per Faizuddin's own earlier
description (before the TS3/TS4 mix-up was caught), that one expects the
SAME underlying transaction/countdown shared across both users' browser
windows, User B able to continue on User A's own payment result without
creating a second transaction, and ending with only 1 Pre-Checking + 1
Deregistration transaction total. Genuinely new mechanism, not yet
designed in code — needs its own confirmation pass before building,
separate from this one.

**Confirmed live 2026-08-26 — first real run, one design bug found (both
listing checks), everything else worked.** User A's decline, User C's
independent decline+retry+full-completion all happened exactly as
designed (`independenceCheck` showed an ~84s gap between the two
countdowns' implied end times — real evidence of two separate timers, not
shared). The listing checks were wrong though:
`precheckListingRowCount: 1` (expected 2), `deregListingRowCount: 0`
(expected 1) — despite User C's Deregistration having genuinely completed
(`jpjDeregistrationStatus: "OK"`, real transaction id). Checked the
video's TRUE final frame (not a race — Vehicle No. field was correctly
filled, search had genuinely completed): from User A's own session, the
Pre-Checking listing showed exactly 1 row — **User A's own abandoned,
never-retried decline**, sitting there with a live "Resubmit" link — and
the Deregistration listing said "Transaction not found."

**Root cause: both listings are scoped to the LOGGED-IN ACCOUNT/COMPANY,
not global.** User A's session has no visibility into a different
company's records at all — not a timing issue, a genuine access-scope
fact about the system, discovered here for the first time (MU_TS1 never
would have surfaced this, since same-company sub-accounts apparently DO
share visibility — worth re-confirming that assumption too if it's ever in
doubt). Confirmed by Faizuddin: check each listing from the user whose OWN
transaction it is, not from a shared/single vantage point. **Fixed in both
MU_TS2 and MU_TS3** (MU_TS2 never having been run live yet, corrected
preemptively from the same finding): Pre-Checking listing now checked from
BOTH User A's session (expect 1) and User C's session (expect 1),
Deregistration listing checked ONLY from User C's session (expect 1) —
dropped entirely from User A's session, since that would just be an
uninformative 0 every time. The test plan's literal "2 different
transactions" wording is now understood to mean "2 transactions exist
total, one per company," not "2 rows visible from any single account's own
listing view" — nobody's own AATF login can ever see that count directly
without a BO/global vantage point, which neither MU_TS2 nor MU_TS3 uses.

One more inconsistency noted, not yet investigated: User A's decline
(`dialogMessage: ""`) didn't capture the native dialog's text, while User
C's did (the full "RE - Sila TUNGGU..." message). Possibly a timing quirk
specific to the very first native dialog of a run — low priority, flagged
for whoever looks at this scenario next.

## 22. MU_TS4 — AATF Multiple Users, SAME company, concurrent retry, added 2026-08-26, NEVER RUN LIVE

**Test plan row** (Trx Status "Failed (Payment)", "2 Users / Same company —
retry payment at the same time"). This is the scenario Faizuddin actually
described in detail BEFORE the TS3/TS4 mix-up was caught (§21's "Next up"
note) — confirmed once the real MU_TS4 text was read from the PDF. Steps:
(1) User A creates a Deregistration, Step 2, no valid pre-check, (2)
proceeds until Pre-Checking payment = **IF** (not RE — no countdown
anywhere in this row, unlike Faizuddin's own paraphrase), (3) User B opens
the SAME transaction via the Pre-Checking listing (not a new one), (4)
both attempt to retry payment at the same time, (5) system prompts
"Payment Paid", (6) OK, redirect User B to listing, (7) another prompt
"Transaction Approved", (8) OK, system pre-searches, (9) Trx Status =
Approved/Payment=OK/JPJ Pre-Checking=OK, (10) check Step Page, Transaction
Listing, Details Page all show correctly.

**Confirmed directly by Faizuddin** (quoted in full, since none of this is
derivable from the test plan text alone):
1. "if resubmit, it will go to the pre-checking flow" — the listing's
   "Resubmit" link (confirmed to exist from a live MU_TS3 screenshot's
   Action column, "View | Resubmit") reopens the SAME inline
   `#precheck-popup` shape already confirmed live via
   `DeregTransactionPage.attemptInlinePayment()` — just reached from the
   listing instead of from inside a live Deregistration Step 2.
2. "yes, the alert is the same" — the native `confirm()` dialog mechanism
   (`withNativeConfirmCapture`) applies here too.
3/4. Pass condition, exact quote: "it depends on whoever clicked first.
   since its hard to simulate actual miliseconds perfect, as long as both
   of them gets different message, its okay. so make it considered as
   pass if they get either 1 of the expected results... that part is
   meant to be observed. it doesnt matter which part gets it first... as
   long as one of them get expected results A, and the other gets
   expected results B, its fine and considered pass." NOT hard-matched
   against the literal "Payment Paid"/"Transaction Approved" wording
   (never confirmed live) — the actual check is just: both dialog
   messages are non-empty AND different from each other.

**Automation**: `pages/PrecheckEnquiryPage.ts` grew two new methods —
`openViaListingAndResubmit()` (navigate to the listing, autoSearch, click
Resubmit) and `attemptResubmitPayment()`. `tests/edereg-precheck-mu-ts4.spec.ts`,
project `edereg-precheck-mu-ts4`, dashboard testCase `mu-ts4`, `multiUser:
"same"` (User B here is the SAME-company sub-account, `CONFIG.subUsername`/
`mykadNricSub` — identical identity MU_TS1 uses, NOT the different-company
User C).

Flow: User A's `DeregTransactionPage` instance (`deregA`) is deliberately
declared OUTSIDE its own setup `try` block — its `#precheck-popup` needs
to stay open for the later race, unlike every other MU_TS case where User
A's flow ends and gets abandoned. User B never touches MyKad at all —
they only act on an EXISTING Pre-Checking record via the listing, never
create their own owner identity. Both sides' retries fire via a single
`Promise.all([deregA.attemptInlinePayment(), precheckB.attemptResubmitPayment()])`
so they actually compete, not run sequentially. Final state checked via
`findTransactionIdByVehicleNo()` + `verifyDetailsPage()` from User A's own
session (same company as User B, confirmed mutually visible per MU_TS1,
knowledge/flow-edereg.md §19/§21) — expects `trxStatus === 'Approved'`
regardless of which side "won" the race.

**First live run, confirmed wrong assumption, corrected same day.**
`attemptResubmitPayment()` originally assumed Resubmit reopened the SAME
inline `#precheck-popup` shape as `attemptInlinePayment()` (a
`.ui-dialog`), so it called `session.confirmDialog()` — which specifically
waits for `.ui-dialog:visible`. The run failed: "Expected the
#precheck-popup payment dialog ('Next') after Resubmit, none appeared,"
because Resubmit does NOT open a dialog at all.

**Real shape, confirmed via a live HTML capture Faizuddin pasted directly**
(saved per the standing rule:
[`EAINT-9306-precheck-resubmit-standalone.html`](../_reference/codebases/AATF/EAINT-9306-precheck-resubmit-standalone.html)):
Resubmit lands on the STANDALONE "eDereg Pre-Checking Enquiry" flow's OWN
Step 2 (Payment) page — a full page with its own header/wizard
(`#custom-header`, "1 Vehicle → 2 Payment → 3 Result"), not a modal at
all. It reuses the SAME inner ids as the inline popup though
(`#payment-history-portion`, `#payment-status`, `#reset-timer`/`#clockdiv`)
— same underlying template, just rendered standalone here instead of
wrapped in a jQuery UI dialog. The retry control is a plain button,
**`#to-retry-rhb`** ("RETRY"), not `#to-payment`.

Faizuddin then clicked RETRY live and pasted the RESULT of that too,
resolving the remaining uncertainty in one step: clicking `#to-retry-rhb`
opens a jQuery UI dialog — **`#payment-dialog`** ("Are you sure to make
payment? No refund is allowed...", Yes/No) — NOT the `#confirm-reset-dialog`
checkbox NOTIFICATION this doc originally worried about (that div exists
in the page's markup but never actually triggered on this click — may be
for a different action entirely, e.g. the dev-side "reset payment" flow
from OF_TS4, not the tester's own retry). Clicking "Yes" on the WINNING
side of the race lands directly on `#result-container` (Step 3 Result) —
the exact same element `PrecheckEnquiryPage.readResult()` already parses.

`attemptResubmitPayment()` rewritten accordingly: click `#to-retry-rhb` →
`withNativeConfirmCapture(() => confirmDialog(20_000, 'Yes'))` (native
`confirm()` wrapping kept per Faizuddin's "yes, the alert is the same,"
even though this particular live click-through didn't surface one — still
a defensive no-op if none fires) → check whether `#result-container`
appeared. If yes, read `#responseVehicleNo`/`#responseDesc` and return
`outcome: 'approved'`. If not, return `outcome: 'declined-or-redirected'`
with whatever dialog message was captured — **the LOSING side of the race
is STILL UNCONFIRMED**, since the one live click-through captured here
happened to be the winner. Per the test plan and Faizuddin's own
description, the loser is expected to get its own native message then
possibly get redirected to the listing entirely (test plan steps 6-7) —
handled defensively rather than asserted, since MU_TS4's actual pass
condition (Faizuddin, §3/4 above) only needs the two outcomes to differ
from each other, not a specific shape for the loser.

**Lesson for future captures in this ticket**: when asking for a page's
HTML to fix a selector, the request needs to name the SCREEN precisely
(title, visible headings) — the first HTML Faizuddin sent back was a real,
useful capture, but of a DIFFERENT page (the inline Deregistration Step 2
popup, already-confirmed markup) than the one actually needed. Re-asking
with a more specific description ("the page titled X, with wizard Y, no
modal overlay") got the right one on the second try.

**Confirmed live 2026-08-26, second run — the whole scenario actually
works.** User A won the race (`declined: false`, real success,
`GLB000000I - TRANSACTION SUCCESSFUL`, `dialogMessage: ""`). User B lost
— and got `dialogMessage: "Transaction Approved"`, **confirming the test
plan's own step 7 verbatim, live, for the first time**. Final
`trxStatus: "Approved"`. The `#confirm-reset-dialog` checkbox gate still
never fired. The declined-or-redirected branch resolved cleanly with no
new selector issues.

**One more bug found and fixed on this same run, in the SPEC's own pass
condition, not the automation logic**: the script originally required
BOTH sides' `dialogMessage` to be non-empty before calling it a pass — but
a native `confirm()` only ever fires on a DECLINED/blocked outcome
(confirmed throughout this whole suite); a WINNING attempt has nothing to
confirm and so has no dialog at all, `dialogMessage: ""` by design, not by
failure. That made the script report `"status":"FAIL"` on a run that had
actually gone exactly right. **Fixed**: the real check is `userAWon !==
userBWon` (`attemptA2.declined === false` / `attemptB.outcome ===
'approved'`) — exactly one side reaches success directly, not "both
produced text." **General lesson for any future concurrent-race
assertion in this suite**: don't assume every branch of a race produces
a comparably-shaped side effect (like a dialog message) — verify what a
CORRECT run's data actually looks like before writing the pass condition,
not just what a plausible-sounding one would.

MU_TS4 is now considered CONFIRMED WORKING end-to-end.

## 23. MU_TS5 — AATF Multiple Users, DIFFERENT company, isolation check, added 2026-08-26, NEVER RUN LIVE

**The written test plan text is SUPERSEDED entirely** by a corrected
version Faizuddin gave directly, 2026-08-26 (the original PDF row
described a "User B searches the listing, attempts to make payment, gets
a duplicate-RHB-payment message" scenario — not what's actually built):

> Pre-requisite: AATF User A (Main) & User B (Main) are from different
> company (attempt to make payment after JPJ Pre-Checking = Failed)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number. Ensure vehicle number does not have valid pre-check
> 2. Proceed with payment but JPJ Pre-Checking = Failed (VEL000100E), Trx
>    Status = Failed
> 3. User B create new Deregistration with the same vehicle number
> 4. Proceed with payment but JPJ Pre-Checking = Failed (VEL000100E), Trx
>    Status = Failed. Ensure the pre-check listing creates a new
>    transaction
> 5. User A redo checking in step 2 of Deregistration with JPJ
>    Pre-Checking = OK
> 6. User B redo checking in step 2 of Deregistration with JPJ
>    Pre-Checking = Failed (VEL000100E). Ensure User B cannot proceed with
>    the deregistration

**The actual intent, per Faizuddin directly**: "since this precheck is in
a new flow, i need to make sure the function will not affect globally. so
if User A passes, i need to make sure if when user B does and expected to
fail, it will fail, and will not pass using User A's result." This is an
ISOLATION test — proving a different company's pre-check state can't leak
across companies for the same vehicle no. — not a payment-collision test
like MU_TS4.

**Why the eSIM has to change back and forth, explicitly**: eSIM steering
is per-VEHICLE-PREFIX, confirmed throughout this whole suite, NOT
per-company. If the automation left the JPJ code at "OK" for User C's own
redo (right after setting it OK for User A's redo), a pass would prove
nothing — both would succeed just because the shared code was happy, not
because the app enforces isolation. Per Faizuddin: "the automation will
need to change the details in the eSim multiple times." Sequence built:
Failed (both first attempts) → OK (User A's redo ONLY) → Failed again
(User C's redo) — genuinely re-steered back to the FAILING code right
before the one attempt that needs to prove it still fails independently.

**"User B (Main), different company" maps to this suite's existing User C
identity** (`CONFIG.subUsername2`/`subPassword2`, default `AzfarAATF`) —
kept for naming consistency with MU_TS2/TS3 rather than the test plan's
own literal "User B" label.

**Automation**: `tests/edereg-precheck-mu-ts5.spec.ts`, project
`edereg-precheck-mu-ts5`, dashboard testCase `mu-ts5`, `multiUser:
"different"`. No new page-object code at all — composes two
already-established shapes directly:
- CPC_E2E_TS9's own "`resolveVehicleGate()` called TWICE on the same live
  Step 2 page, re-steering eSIM between attempts" pattern — itself never
  confirmed live before this (TS9's own header comment says so). Used for
  BOTH User A's redo AND User C's redo, on their own respective
  still-open Deregistration transactions (both `deregA`/`deregC` declared
  outside their setup `try` blocks, same shape as MU_TS4's persistent
  `deregA`).
- MU_TS2/TS3's "separate browser context per company, listing checked
  from each one's own session" pattern (confirmed live) — used for the
  "pre-check listing creates a new transaction" check, expecting 1 row
  from EACH company's own session, not 2 from one shared view.

**Neither user is driven to a real completed Deregistration** — the
corrected steps stop at confirming each gate's satisfied/not-satisfied
state, and per the established one-time-per-vehicle rule (MU_TS1, §19),
there's no reason to spend the test vehicle here.

**Lowest-risk of the "new mechanism" MU_TS cases so far** — everything it
composes has either been confirmed live already (the separate-context/
listing pattern) or was ALREADY built and awaiting its own first live run
regardless (TS9's retry pattern) — MU_TS5 doesn't introduce any new
selector or page shape of its own, just a new SEQUENCE of already-known
pieces. If anything breaks, it's more likely to reveal something about
TS9's own retry mechanism than about MU_TS5 specifically.

**First live run (2026-08-26) FAILED — not on TS9's retry mechanism, but
on page-handle reuse.** `PrecheckEnquiryPage.countTransactionsForVehicle()`
navigates whatever page `session.waitForActivePage()` resolves to via
`p.goto(...)` — and `session.active()` (§ session.ts) always returns the
LAST page in the browser context, not any specific page reference. The
spec had called `countTransactionsForVehicle()` directly against `page`/
`userCPage` (each user's OWN Deregistration Step 2 tab, still open for the
redo two steps later), so the listing check stranded User A's tab on the
Pre-Checking Transaction Listing page instead. The next call —
`deregA.resolveVehicleGate()` for User A's redo, still targeting `page` —
found no `#vehicleRegNo` at all and timed out after 30s
(`locator.fill: Timeout 30000ms exceeded`). Both first attempts (Failed)
and both listing counts (1/1, correct) had already completed fine before
this — the bug was purely in what happened to the page state afterward,
not in the isolation logic itself.

**Fix**: each listing count now runs on a throwaway tab —
`await page.context().newPage()` / `await userCContext.newPage()` — reusing
the SAME `session`/`sessionC` object (so `PrecheckEnquiryPage` still targets
the right browser context) but never touching `page`/`userCPage` directly.
The ephemeral tab is closed right after its count, which drops it from
`context.pages()` and makes `session.active()` fall back to the original
Deregistration tab again — exactly where each user's later redo needs it.
No change to TS9's retry pattern was needed; that part is still unconfirmed
live and remains the main residual risk for the NEXT run.

## 24. MU_TS6 — AATF Multiple Users, SAME company, User A's Failed pre-check superseded by User B's completed one, added 2026-08-26, NEVER RUN LIVE

**First written version (built, then abandoned after its first live run
exposed a wrong precondition)**:

> Pre-requisite: AATF User A (Main) & User B (Main) are from same company
> (resubmit from trx listing after JPJ Pre-Checking = Failed)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number. Ensure vehicle number does not have valid pre-check
> 2. Proceed until Pre-Check Enquiry = VEL000100E
> 3. User B search and resubmit the transaction in Transaction Listing page
> 4. System redirect User B to Step 3 and show JPJ Pre-Checking result
> 5. Ensure Step Page, Transaction Listing, JPJ XML Log and Details Page
>    showing correctly

Built exactly as written (reusing MU_TS4's already-confirmed-live
Resubmit/RETRY path), first live run 2026-08-26: User A's Failed attempt
completed correctly, but User B's `openViaListingAndResubmit()` never
reached the Pre-Checking listing at all — `p.goto(main.do?vehicleNo=...
&autoSearch=true)` redirected User B to a **"New Deregistration
Transaction" Owner & Vehicle Details form, pre-filled with User A's own
MyKad identity** (`MUHAMMAD FAIZUDDIN BIN BIDI / 030217141005`) instead.
Diagnosis: same-company + an in-progress (never completed/cancelled)
Deregistration draft appears to make the AATF portal redirect ANY
navigation on a second same-company session back to RESUMING that draft,
rather than honoring the URL actually requested — a genuine, previously
undocumented app behaviour, not a selector bug. `openViaListingAndResubmit()`
itself is unaffected by this finding (still correct for MU_TS4's own
shape, where there's no dangling incomplete draft at the point it runs).

**Faizuddin's replacement, given directly after that diagnosis,
2026-08-26** — used in full, no further correction needed:

> Pre-requisite: AATF User A (Main) & User B (Main) are from same company
> (resubmit from trx listing after JPJ Pre-Checking = Failed)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number. Ensure vehicle number does not have valid pre-check
> 2. Proceed until Pre-Check Enquiry = VEL000100E
> 3. User B create Deregistration using the same vehicle number with JPJ
>    Pre-Checking = OK and proceed until complete deregistration
> 4. User A opens pre-check listing and ensure the same failed pre-check
>    changes to OK
> 5. Ensure Step Page, Transaction Listing, JPJ XML Log and Details Page
>    showing correctly

No more Resubmit mechanism at all — User B creates their OWN new
Deregistration for the same vehicle no. (own MyKad auth, MU_TS1's own
shape), and since the ONLY existing Pre-Checking record for the vehicle is
Failed (not valid/satisfying), User B's own Step 2 gate check triggers its
OWN inline purchase — `DeregTransactionPage.fillVehicleDetails()`'s normal
"not already satisfied" branch, steered to Approved this time — then
proceeds through a real completed Deregistration
(`ownerConsentAndAuth` → `aatfConsentAndAuth` → `jpjCheck` →
`payAndDeregister`, MU_TS1's own already-confirmed-live completion chain).

Step 4's actual claim under test: this does NOT create a second, separate
Pre-Checking transaction — the SAME record User A's Failed attempt created
is expected to update in place to OK (unlike MU_TS2/TS3's
different-company case, where a genuinely new row IS expected). Checked
via a new `PrecheckEnquiryPage.getListingStatusForVehicle()` — reads the
listing's actual "JPJ Pre-Checking"/"Trx Status" column text for the first
row, not just a row count (column order confirmed from a live listing
snapshot captured during the first MU_TS6 run) — from User A's own
still-open session (same-company listing visibility confirmed live,
MU_TS1/TS4).

**First live run, 2026-08-26 — the "updates in place" assumption was
wrong.** The app does NOT update User A's existing Failed record — it
creates a genuinely separate second row instead (`getListingStatusForVehicle()`
correctly reported `rowCount: 2`: the original Failed row, untouched,
plus a new Approved one alongside it). This is a real product/design
finding, not an automation bug — `getListingStatusForVehicle()` itself
worked correctly.

Cross-checked against the dev-authored QA test guide Faizuddin shared as a
Claude Artifact (saved to
`_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html`
per the standing HTML-capture rule), §2 "The rule being enforced":

> Only one record has to satisfy all four. A later failed or cancelled
> attempt does **not** cancel out an earlier approved one — if any
> precheck for that vehicle was approved within the last 6 months, the
> vehicle can proceed.

Stated for the opposite chronological order (approved-then-failed) but the
implication is the same either way: **multiple coexisting records per
vehicle+company is the intended design** — the gate looks across ALL
records for a qualifying one, it doesn't expect any single record to be
mutated. The guide's own two "reused, not duplicated" scenarios are
narrower than MU_TS6's case: an abandoned UNPAID attempt (cancelled before
payment), and a FAILED PAYMENT retry (RHB decline, resumes in retry mode
with history — MU_TS4's own shape). Neither is "payment succeeded, JPJ
rejected" (MU_TS6's `VEL000100E`), so the guide never actually promised
reuse for this specific case — today's result lines up with the
documented rule better than the corrected test plan's own step 4 wording
did.

**Decision, per Faizuddin, 2026-08-26: keep the pass condition expecting
exactly 1 row, and deliberately flag the real 2-row outcome as FAIL.** No
code change from the first build was needed — `rowCount === 1` was already
required for `SUCCESS` in the spec's own status computation, so this was
already the actual behaviour; the change here is only that it's now a
confirmed, deliberate assertion rather than an untested guess.

Step 5 reuses `utils/srdChecklist.ts`'s `runPostDeregSrdChecklist()` on
User B's own session while still open — the SAME full-completion checklist
every other completed-Deregistration case in this ticket uses (Step Page,
Transaction Listing, the "eDereg Pre-Checking: Yes" link, JPJ XML Log,
Details Page all in one call). Its JPJ XML Log leg
(`runJpjXmlLogChecklist`) has never been exercised live for ANY case in
this ticket yet — same residual risk already flagged for every earlier
case that reaches this code path.

User B is the SAME-company sub-account (`CONFIG.subUsername`/
`subPassword`, `mykadNricSub`/`mykadNameSub`) — same identity MU_TS1/TS4
use.

**Automation**: `tests/edereg-precheck-mu-ts6.spec.ts`, project
`edereg-precheck-mu-ts6`, dashboard testCase `mu-ts6`, `multiUser: "same"`.

## 25. MU_TS7 — AATF Multiple Users, DIFFERENT company, resume an abandoned pre-check after another company buys its own, added 2026-08-26, NEVER RUN LIVE

Test plan, as given by Faizuddin, 2026-08-26 — no wording correction, but
three interpretive gaps he resolved directly before this build:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from different
> company
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number.
> 2. Stop until pre-checking enquiry popup appears
> 3. Go to the pre-check listing an ensure the transaction on the vehicle
>    number is Pending
> 4. User B go to eDereg Pre-Checking Transaction and make transaction
>    using the same vehicle number
> 5. Proceed with the eDereg Pre-Checking until Trx Status = Approved,
>    Payment = OK, JPJ Pre-Checking = OK
> 6. User A resubmit with the Deregistration process from the listing page
> 7. Do deregistration with the same vehicle number until the status for
>    the Deregistration Transaction is Trx Status = Approved, Payment = OK

**Gap 1 — checking the listing without losing the open popup.** Step 3
needs the Pre-Checking listing while User A's own inline `#precheck-popup`
is still open (never Next'd, never Cancelled — genuinely abandoned, unlike
OF_TS1 which Cancels it). Resolved: a SECOND TAB in User A's own browser
context (`page.context().newPage()`), same reasoning as MU_TS5's own
listing-check fix (§23) — the tab holding the open popup is never
navigated.

**Gap 2 — which listing step 6 means.** "Resubmit ... from the listing
page" could mean either listing. Resolved: the Pre-Checking listing, not
the Deregistration listing — MU_TS1 already established an incomplete
Deregistration only appears on the Deregistration Transaction Listing once
it reaches Step 3, and User A here never gets that far (stuck at Step 2's
popup the whole time), so there's nothing for the Deregistration listing
to show.

**Gap 3 — does step 7 need a real completed Deregistration.** Resolved:
yes, drive it all the way through (Step 3 consent → Step 4 JPJ check →
Step 5/6 payment+deregister, MU_TS1's own completion chain) — this vehicle
is only ever deregistered once in this test (User B never touches
Deregistration at all, only the standalone Pre-Checking enquiry), so no
conflict with the "a vehicle can't be deregistered twice" rule (§19).

**"User B (Sub), different company" maps to this suite's existing User C
identity** (`CONFIG.subUsername2`/`subPassword2`, default `AzfarAATF`) —
same slot MU_TS2/TS3/TS5 use, kept for naming consistency.

**Two genuinely unconfirmed shapes, built best-effort and flagged rather
than guessed silently:**
- `PrecheckEnquiryPage.resumePendingPayment()` (new) — step 6's actual
  payment button. Every other Resubmit case built so far (MU_TS4/TS6) is
  for a record with an EXISTING payment attempt (declined or
  JPJ-rejected), which renders `#to-retry-rhb` ("RETRY") with a Payment
  History block — confirmed live. A genuinely Pending/never-attempted
  record (MU_TS7's own case) may instead render the standalone flow's
  ordinary `#to-payment` ("NEXT") button, since there's no history to show
  yet. The method checks for either and clicks whichever renders.
- Step 7's re-entry into a real Deregistration — after the Step 2 popup is
  abandoned (never Cancelled) and the vehicle's pre-check instead gets
  paid entirely through the listing, this build calls
  `dereg.createFromHome('MYKAD')` again on the SAME session to start the
  Deregistration proper. Per MU_TS6's own first-run finding (§24), a
  same-company navigation while a draft is pending gets redirected to
  RESUME that draft rather than starting fresh — if that happens here too,
  `authenticateOwner()` may land on an already-authenticated Step 2 form
  instead of a fresh Owner Authentication screen, and this sequence would
  need adjusting.

**Automation**: `tests/edereg-precheck-mu-ts7.spec.ts`, project
`edereg-precheck-mu-ts7`, dashboard testCase `mu-ts7`, `multiUser: "different"`.

**CONFIRMED LIVE 2026-08-27, PASSED, both unconfirmed shapes resolved:**
- Gap/shape 1 (`resumePendingPayment()`): a genuinely Pending/never-attempted
  record renders the standalone flow's **`#to-payment` ("NEXT")** button, not
  `#to-retry-rhb`. Confirmed — the guessed either-or check correctly picked
  this branch.
- Gap/shape 2 (re-entry into Deregistration): calling
  `dereg.createFromHome('MYKAD')` again on the same session did NOT hit the
  MU_TS6-style "redirected to resume a pending draft" behaviour — User A had
  no pending Deregistration draft (only an abandoned pre-check popup, never a
  Step-3+ draft), so §24's finding doesn't apply here; a fresh Owner
  Authentication screen rendered normally and the flow completed end-to-end
  (`jpjCheckStatus: OK`, `jpjDeregistrationStatus: OK - TRANSACTION SUCCESSFUL`).
- Step 2's vehicle gate was reported already satisfied
  (`usedInlinePrecheck: false`) — User A's resumed-and-paid pre-check from
  the listing satisfied the gate, so no second inline pre-check popup
  appeared in Deregistration proper.
- No bugs found; this run validated existing guesses rather than surfacing
  new behaviour.

## 26. MU_TS8 — AATF Multiple Users, SAME company, simultaneous first payment attempt (inline popup vs. listing resume), added 2026-08-27, NEVER RUN LIVE

Test plan, as given by Faizuddin 2026-08-27, no wording correction:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from same company
> (submit payment at the same time)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number. Ensure vehicle number does not have valid pre-check
> 2. Stop until pre-checking enquiry popup appears
> 3. User B go to eDereg Pre-Checking Transaction Listing and search the
>    transaction
> 4. Both users attempt to make payment at the same time (Click [Yes]
>    button on payment popup)
> 5. System prompt error message "Duplicate RHB payment requests have been
>    detected. This RHB payment request will not be sent. Please refresh
>    the page to view the payment details."
> 6. User A redirected to Deregistration Step 2 with pre-checking enquiry
>    popup
> 7. User B tries again using the same Vehicle Number until pre-checking
>    status is Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK
> 8. Check details after payment
> 9. User A continues with the Deregistration process until Deregistration
>    status is Trx Status = Approved, Payment = OK (This status is for the
>    Deregistration transaction)

**GENERALIZED per MU_TS4's own established pass condition** (§22, Faizuddin
2026-08-26: "it depends on whoever clicked first... as long as both of them
gets different message, its okay... it doesn't matter which part gets it
first"). Steps 6/7 name User A as the loser and User B as the eventual
winner, but MU_TS4's own live run showed the actual winner is a genuine
race, not fixed by role. This build treats "who loses" as an OUTCOME to
observe and retries WHICHEVER side actually lost — not hard-coded to User A.

This is the scenario the pre-existing §5.6 write-up already anticipated for
BOTH MU_TS4 and MU_TS8 together ("the second user to click Pay gets
'Duplicate RHB payment requests...'"), but MU_TS4's own live run got
"Transaction Approved" instead — so MU_TS8's literal message (step 5) is
flagged unconfirmed here too, not assumed just because the test plan quotes
it.

User A's setup (create Deregistration, Step 2, stop at the inline popup
with the gate blocked, never Next/Cancel) is IDENTICAL to MU_TS7's own User
A setup (§25) — reused verbatim, since both scenarios need a genuinely
Pending/never-attempted record open on Step 2. User B is the SAME-company
sub-account (`CONFIG.subUsername`/`subPassword`) — same identity MU_TS1/TS4
use, NOT the different-company User C (MU_TS2/TS3/TS5/TS7's `subUsername2`).

**New page-object method**: `PrecheckEnquiryPage.attemptResumePendingPayment()`
— a race-safe sibling of MU_TS7's `resumePendingPayment()`. The original
THROWS if no result screen appears (correct for MU_TS7's solo/uncontested
resume); this one returns `{ outcome: 'approved' | 'declined-or-redirected',
dialogMessage, ... }` instead, mirroring `attemptResubmitPayment()`'s shape
— the losing side of a race is an expected outcome here, not an exception.

**Automation**: `tests/edereg-precheck-mu-ts8.spec.ts`, project
`edereg-precheck-mu-ts8`, dashboard testCase `mu-ts8`, `multiUser: "same"`.
Race fired via `Promise.all([dereg.attemptInlinePayment(),
precheckB.attemptResumePendingPayment()])`. Pass condition: exactly one side
resolves directly (`userAWon !== userBWon`); whichever side lost is
reconciled to the resolved state (see the CORRECTED note below for User B's
side). User A then continues the SAME still-open Deregistration to a real
completion (`submitVehicleDetails`/`ownerConsentAndAuth`/
`aatfConsentAndAuth`/`jpjCheck`/`payAndDeregister`) — step 9.

**First live run, 2026-08-27 — CONFIRMED the race itself: User A won
directly (inline popup succeeded first try, `GLB000000I - TRANSACTION
SUCCESSFUL`), User B lost (`outcome: 'declined-or-redirected'`,
`dialogMessage: ''` — the "Duplicate RHB..." text did NOT fire; same
pattern as MU_TS4's own "message wording never matches the test plan"
precedent, §22). FAILED on the loser's retry, not the race itself.**
Original design re-opened the listing via `openViaListingAndResubmit()` and
raced `attemptResumePendingPayment()` again — but once User A's win
resolved the record to Approved, the listing's "Resubmit" link disappears
entirely (an Approved row only offers "View"), so waiting for "Resubmit"
timed out after 15s (`TimeoutError: locator.waitFor... getByRole('link', {
name: 'Resubmit' })`). **Fixed**: User B's loser-side branch no longer tries
to re-pay at all — it just checks `getListingStatusForVehicle()` and
expects `trxStatus === 'Approved'`, the same "the loser only needs to
OBSERVE the resolved state, not independently reach success" principle
MU_TS4 already established. NOT yet re-run to confirm this fix (nor has
User A's own loser-retry branch — still `attemptInlinePayment()` again,
unchanged — ever been exercised live, since User A won this run).

**THREE GENUINELY UNCONFIRMED SHAPES from the original build, one now
resolved**:
1. The literal "Duplicate RHB payment requests..." dialog text (step 5) —
   **RESOLVED, did not fire.** User B's losing `dialogMessage` was empty,
   matching MU_TS4's own precedent rather than the test plan's literal
   quote.
2. Step 6's "redirected to Deregistration Step 2 with pre-checking enquiry
   popup" — still UNCONFIRMED, since User A won this run rather than
   losing. `attemptInlinePayment()`'s already-confirmed "declined" branch
   remains the assumption for whenever User A loses instead.
3. Whether the loser's retry resolves Approved immediately — **PARTIALLY
   ANSWERED**: for User B specifically, there's no "retry" possible at all
   once the record is Approved (no button left to click) — the fix above
   just checks the listing directly instead. Still open for User A's own
   loser branch.

`edereg-precheck-mu-ts8` is also registered in `playwright.config.ts` and
wired as dashboard testCase `mu-ts8` in
`app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx`.

## 27. MU_TS9 — AATF Multiple Users, SAME company, BackOffice cancels the transaction, added 2026-08-27, NEVER RUN LIVE

Test plan, as given by Faizuddin 2026-08-27, no wording correction:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from same company
> (refresh Step 2 Trx Status = Cancelled)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number without valid pre-check
> 2. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 3. User B resubmit transaction from Transaction Listing Page
> 4. User A proceed to make payment but Payment = Failed (due to IF)
> 5. BackOffice user cancel the transaction vio BO Transaction Listing page
> 6. User A and User B refresh Step 2
> 7. System prompt error message "Transaction Cancelled"
> 8. Click [OK] button and system pre-search the trx in Transaction Listing
>    page, Trx Status = Cancelled
> 9. Ensure Step Page, Transaction Listing and Details Page showing
>    correctly

**FIRST BACKOFFICE-SIDE MUTATING ACTION IN THIS TICKET.** Every prior BO use
(`BoLoginPage`, `JpjXmlLogPage`, `srdChecklist.ts`'s checklist) was
READ-ONLY.

**WHICH BO PAGE — CORRECTED 2026-08-27, same day.** Faizuddin first pasted
the BO "Deregistration Transaction Enquiry" page's HTML for this step, then
caught his own mistake: the RIGHT page is the "eDereg Pre-Checking
Transaction Listing" instead. The transaction cancelled throughout this
whole scenario (Pending -> Failed -> Cancelled, step 2's own "Trx Status =
Pending" being the PRE-CHECK's field) is the ONE Pre-Checking transaction
both User A (inline `#precheck-popup`) and User B (listing Resubmit,
`openViaListingAndResubmit()`) are independently looking at — the SAME
underlying record, not two separate ones. This resolves what would
otherwise have been the scenario's biggest open question (does cancelling a
Deregistration draft cascade to a separate Pre-Checking transaction?) — it
doesn't need to, since there's only ever been one record here.

The mistaken Deregistration listing capture/page object was KEPT, not
deleted — [`_reference/codebases/AATF/EAINT-9306-bo-dereg-transaction-listing.html`](../_reference/codebases/AATF/EAINT-9306-bo-dereg-transaction-listing.html)
and `BoDeregTransactionListingPage` are both real and may be useful for a
future Deregistration-side BO scenario, just not this one — their own
header comments were updated to drop the MU_TS9 framing rather than
claim a use they no longer have.

**New page object**: `BoPrecheckTransactionListingPage`
(`/view/dereg/precheck/enquiry/main.do` — inferred from the "View" links'
own href in the CORRECT capture, same no-`/aatf/`-segment pattern both
`JpjXmlLogPage` BO routes already confirmed). Confirmed from
[`_reference/codebases/AATF/EAINT-9306-bo-precheck-transaction-listing.html`](../_reference/codebases/AATF/EAINT-9306-bo-precheck-transaction-listing.html)
(pasted by Faizuddin 2026-08-27, both before/after-Search states, 39 real
result rows). 13-column table — Company Name/ROC, Vehicle, Transaction No.,
Created At, Payment, JPJ Pre-Checking, Trx Status, LHDN Response Status,
Remarks, Special Remarks, Action — a DIFFERENT shape from both the AATF-side
`PrecheckEnquiryPage` listing reader and the BO Deregistration listing (16
columns, no "Special Remarks"). Search fields differ too: this page's Trx
Status select is `#status`, not `#to-filter` like the Deregistration
listing's equivalent — and there is NO "Includes Draft Trx" checkbox here at
all (not needed; a Pre-Checking transaction is a top-level record from
creation, unlike a Deregistration draft stuck at Step 2).

**Same jQuery UI datepicker mechanism as the Deregistration listing** —
`#fromDate` compulsory before Search, `selectFromDateToday()` reused
verbatim (click `#fromDate` -> `.ui-datepicker-today a`).

**The "Cancel" action's markup is now CONFIRMED, for real** — the corrected
capture has genuine Pending/Failed rows (unlike the Deregistration listing's
own capture, which only ever showed Approved rows). Every row with Trx
Status Pending or Failed shows `<a href="#" class="to-cancel"
txid="<uuid>" title="to cancel <refNo>">Cancel</a>` right after "View" (` |
` separated) — confirmed present across multiple real Pending/Failed rows,
confirmed ABSENT on every Approved/Expired row (checked across all 39 rows
in the capture). `href="#"` — a JS click handler keyed off `txid`, not real
navigation.

**TWO SHAPES STILL GENUINELY UNCONFIRMED**, flagged per the standing rule:
1. The Cancel link's own CLICK HANDLER behaviour past the selector itself —
   does it raise a native `confirm()` first? AJAX or full reload afterward?
   Not visible in the capture's own trimmed `<script>` block (only the
   generic per-page header script was included).
   `cancelFirstMatchingRow()` listens for a dialog defensively but doesn't
   require one.
2. Whether the native "Transaction Cancelled" dialog fires on a plain
   `page.reload()` itself (modeled the same way as every other "system
   prompt error message" in this suite, via `withNativeConfirmCapture()`),
   versus needing some other trigger first — checked on BOTH User A's and
   User B's side and HARD-ASSERTED on both, since it's genuinely the same
   shared record for both now (not the cascade-across-two-records question
   the original, mistaken build had to hedge on).

**Automation**: `pages/BoPrecheckTransactionListingPage.ts` (new),
`tests/edereg-precheck-mu-ts9.spec.ts` (rewritten same day, after the
correction), project `edereg-precheck-mu-ts9` registered in
`playwright.config.ts`, dashboard testCase `mu-ts9` wired in
`app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx`. User A's setup (create Deregistration,
Step 2, stop at the inline popup with the gate blocked) is IDENTICAL to
MU_TS7/TS8's own User A setup. User B never actually pays in this scenario
— only User A attempts payment (IF, declined) per the test plan's own
step 4. Final check: the Pre-Checking listing (`getListingStatusForVehicle()`)
expects `trxStatus === 'Cancelled'`.

**First live run, 2026-08-27 — BO cancel CONFIRMED working, real dialog
captured ("Succesfully cancel.") — resolves unconfirmed shape #1 above
entirely.** FAILED on the refresh assertion instead: `page.reload()` fired
NO dialog. Faizuddin confirmed directly the refresh action itself is
correct ("they refresh the page in while they are in step 2") — the bug was
in how the dialog was CAPTURED, not the action. The failure's own page
snapshot showed a "Working..." heading still active well after the reload's
own load event — the app was still running an async status check when
`session.withNativeConfirmCapture()` had already stopped listening (that
helper only listens for the duration of the action it wraps, i.e.
`page.reload()`'s own load-complete promise, not whatever fires
asynchronously afterward). The reloaded Step 2 also came back as a
genuinely BLANK "New Deregistration Transaction" Owner & Vehicle Details
form (Owner Authentication persisted from session; Vehicle No./Engine
No./Chassis No. all blank) — consistent with a dialog that simply hadn't
fired yet at snapshot time, not with "no such dialog exists."

**Fixed**: a new local helper, `reloadAndCaptureDialog()`, keeps the dialog
listener attached for an EXTRA 10s grace window after the reload's own load
event, long enough for a delayed async check to complete and fire its
dialog. Both User A's and User B's refresh now use it instead of
`session.withNativeConfirmCapture()`. NOT yet re-run to confirm this fix —
whether "Transaction Cancelled" actually fires within that window (shape
#2 above) is still open.

**Second live run, 2026-08-27, SAME DAY — never even reached the refresh
fix above.** Failed one step earlier this time: the BO Pre-Checking listing
search found 0 rows for the vehicle, even though User A's Failed (IF)
record definitely existed (the run had just gotten through the declined
payment right before). The EXACT SAME `BoPrecheckTransactionListingPage`
code had found rows and cancelled successfully on the FIRST live run — no
code changed between the two runs, so this reads as a genuine
intermittent/timing issue, not a selector bug. No screenshot of the BO
page existed to confirm what it actually showed — `boPage` is a manually
created context, never the fixture-tracked `page` Playwright auto-snapshots
on failure, so the failure's own error-context capture showed User A's page
instead (a "New Deregistration Transaction" blank form), which is a red
herring specific to this test's own multi-context shape, not evidence about
the BO page at all.

**Leading theory: a datepicker click race** — `selectFromDateToday()`
clicked `.ui-datepicker-today a` right after clicking `#fromDate`, with no
verification the field actually received a value. If the widget hadn't
rendered yet, the click could silently land on nothing, leaving `#fromDate`
blank — and since this page's OWN form marks BOTH "From" and "To" as
required (`*`), a blank date could plausibly make the search silently
no-op or return an empty/wrong range, unlike the sibling Deregistration
listing where Faizuddin confirmed only "From" is enforced.

**Fixed defensively, NOT yet confirmed as the real root cause**:
1. `selectDateToday()` (renamed, generalized from `selectFromDateToday()`)
   now verifies the target field's `inputValue()` is non-empty after the
   click and THROWS a clear diagnostic message if not, rather than
   silently continuing to a search that might not even run.
2. `searchByVehicleNo()` now fills BOTH `#fromDate` and `#toDate` with
   today, instead of leaving "To" blank.
3. The spec's own BO try block now screenshots `boPage` on any failure
   (`test-results/mu-ts9-bo-failure.png`) before the context closes, so a
   future failure in this block has actual visual evidence instead of the
   User-A-page red herring.

If the next run still fails here, the `inputValue()` check should at least
narrow it to "the date genuinely wasn't set" vs. "the date was set but the
search still found nothing" — two very different follow-ups.

**Third live run, 2026-08-27, SAME DAY — same 0-rows failure, but now with
a real screenshot, which disproved the datepicker theory outright and
found the actual root cause.** `mu-ts9-bo-failure.png` showed Vehicle No.
"HXA067" and BOTH Date Created fields correctly showing "27/08/2026" —
the date-selection fix worked exactly as intended, ruling out the
datepicker-race theory entirely. The real problem: the page still showed
its **"Working..." blockUI overlay** at the moment rows were read.

**Root cause: `#to-search` on this page is an AJAX call, not a full page
reload** — a wrong assumption carried over from the sibling
`DeregTransactionListingPage`/`BoDeregTransactionListingPage` (both
confirmed real full-page-reload behaviour) without ever separately
verifying it here. `waitForLoadState('domcontentloaded')` resolves almost
immediately because there's no real navigation to wait for at all, so the
row read ran while the AJAX response was still in flight.

**Fixed**: `searchByVehicleNo()` no longer pairs the click with
`waitForLoadState()`. It now waits for a "View" link to appear in
`#result` instead — the same wait target `PrecheckEnquiryPage`'s own
listing readers (`findTransactionIdByVehicleNo`/`countTransactionsForVehicle`/
`getListingStatusForVehicle`) already use for their own AJAX/
rendered-in-place searches — tolerating a genuinely empty result via the
timeout, same as those readers' own fallback. NOT yet re-run to confirm.

**Lesson for this whole BO-listing family going forward**: "looks like the
same search-form shape" does NOT mean "same click-triggers-what
mechanism" — the Deregistration listing's confirmed full-reload behaviour
was silently assumed to carry over to the Pre-Checking listing without any
direct evidence for THIS page specifically. Worth re-checking directly
(e.g. watching for a URL change, or the network tab) rather than
inferring from a visually similar sibling, next time a new BO listing page
is added.

**Fourth live run, 2026-08-27, SAME DAY — the AJAX-wait fix worked, BO
cancel confirmed again end-to-end.** Failed at the SAME place as run 1: the
refresh-dialog assertion, still an empty `dialogMessage` on User A's side
even with the 10s grace window. Faizuddin asked directly why the flow isn't
completing (without authorizing any further code change at that point) —
the answer, confirmed from a fresh screenshot: refreshing Step 2 produces
**NO dialog and NO visible error of any kind** — just a silently blank,
freshly-reset "Owner & Vehicle Details" form (Owner Authentication still
filled from session; Vehicle No./Engine No./Chassis No./Mobile/Email all
empty). Waiting longer doesn't help — there's genuinely nothing to catch.
**This is now understood as the real, confirmed live behaviour of the
Deregistration-embedded inline flow specifically** — not a bug in the
automation's capture. The mismatch is between the test plan's step 7
("System prompt error message 'Transaction Cancelled'") and what the app
actually does on this particular entry point. **Raised as EAINT-12233**
under this same parent (EAINT-9306) — the ticket's own evidence screenshot
still needs manually attaching (no browser-automation tooling was
available in-session to do it via Chrome).

**Rebuilt a third time, 2026-08-27, SAME DAY — trigger changed from a
passive REFRESH to an ACTIVE RETRY, per Faizuddin's own direct
instruction ("make TS9 follow TS10") after MU_TS10's own first live run
successfully captured "Transaction Cancelled" via an active retry click
(not a refresh) on its own User A.** Faizuddin's own reasoning, confirmed
directly when asked why the two scenarios differed even though they "hit
the same flow": they DON'T hit the same flow — a plain page reload is a
passive re-request with nothing being submitted, while clicking "Next" on
a still-open Payment History popup is an ACTIVE submit hitting the
server's own payment-retry endpoint, which is exactly where a
state-validation rejection ("Transaction Cancelled") would sensibly fire.
**The refresh finding above is NOT retracted** — it remains the real,
separately-confirmed answer to the test plan's own literal "refresh Step
2" wording (and the basis for EAINT-12233); this rebuild answers a
DIFFERENT question (does an active retry behave differently) rather than
re-testing the same one.

User A's retry reuses `DeregTransactionPage.
attemptInlineRetryAfterCancellation()`, already built/fixed for MU_TS10.
User B's is NEW: `PrecheckEnquiryPage.
attemptStandaloneRetryAfterCancellation()` — checks for EITHER
`#to-retry-rhb` or `#to-payment` (same either-or uncertainty
`resumePendingPayment()` already handles), doesn't throw if the "Are you
sure to make payment?" confirm dialog never appears (a cancelled record
may skip straight to a rejection instead), and applies the
grace-window + hold-before-accept dialog-capture fix FROM THE START this
time, rather than discovering the same capture-timing bug a third time.
Neither user's dialog text is hard-asserted in this rebuild's own pass
condition — only the final listing status (`Cancelled`) is, for both;
whether an active retry on this SAME-company, SHARED-transaction shape
behaves like MU_TS10's own (different-company, separate-transaction) User
A did is the genuinely open question this rebuild exists to answer. NEVER
RUN LIVE (this version).

## 28. MU_TS9B — same scenario as MU_TS9, but via the STANDALONE Pre-Checking flow instead of the Deregistration-embedded popup, added 2026-08-27, NEVER RUN LIVE

Built at Faizuddin's own request, specifically to compare behaviour: "add a
new automation that will do the same thing, but instead of doing the
initial precheck in deregistration flow, it will use the pre-check flow. i
want to compare the behaviour between the two." Directly motivated by
MU_TS9's own finding above — does the STANDALONE flow's Step 2 ALSO stay
silent on a BO cancel + refresh, or does it show something MU_TS9's inline
popup doesn't?

**Structural difference from MU_TS9**: User A here NEVER touches
Deregistration at all — only `openFromHome()`/`fillVehicleAndConsent()`/
`enquireNow()` (Steps 1→2 of the standalone flow, same as CPC_E2E_TS1/
MU_TS7's User B leg), stopping at the Pending record before paying. User
B's own leg is UNCHANGED from MU_TS9 (`openViaListingAndResubmit()`) —
User B was already using the standalone flow in MU_TS9 too.

**New page-object method**: `PrecheckEnquiryPage.attemptStandalonePayment()`
— decline-aware version of `pay()` (which only ever handles the happy
path; every prior standalone-flow test was Approved-only). Built from
MU_TS4's own finding that the RETRY button (reached via listing Resubmit)
and this flow's own "NEXT" button render the SAME underlying page/template
— so a first-attempt decline is assumed to look identical to a retry
decline (native `confirm()` with the decline message, then
`#to-retry-rhb` + `#payment-history-portion` instead of
`#result-container`). **GENUINELY UNCONFIRMED** — if wrong, the method
simply times out after 90s waiting for either shape, which is itself
informative for this comparison.

**Deliberately NOT hard-asserted**: unlike MU_TS9, this test does not fail
on either user's refresh-dialog result — the whole purpose is to OBSERVE
and compare, not re-assert an expectation already shown once to not hold.
`status` in the RESULT JSON only depends on the declined payment, the BO
cancel, and the final listing status (`Cancelled`) — all three already
confirmed to work via MU_TS9's own live runs. Both refresh dialogs are
logged under a `comparisonAgainstMuTs9` key instead.

**Automation**: `pages/PrecheckEnquiryPage.ts` grew
`attemptStandalonePayment()`; `tests/edereg-precheck-mu-ts9b.spec.ts`,
project `edereg-precheck-mu-ts9b` registered in `playwright.config.ts`,
dashboard testCase `mu-ts9b` wired in
`app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx`. Reuses the SAME
`BoPrecheckTransactionListingPage`/`reloadAndCaptureDialog()` shapes MU_TS9
already confirmed working — the BO side and the reload mechanics are not
new here, only User A's own entry point into the pre-check is.

**First live run, 2026-08-27 — PASSED, and the comparison this build
existed for came back clean: the standalone flow behaves DIFFERENTLY from
the inline one.** Both User A's and User B's refresh captured a real
dialog, `"Transaction Cancelled"` — the literal wording the original test
plan predicted, and the exact opposite of MU_TS9's own empty-dialog result
on the Deregistration-embedded inline flow. `attemptStandalonePayment()`'s
own unconfirmed assumption held too — the first attempt declined exactly
like a retry would (`#to-retry-rhb`/`#payment-history-portion`, native
dialog with the IF wording).

**Follow-up, same day**: Faizuddin watched the recording and couldn't see
the "Transaction Cancelled" popup on screen, despite the captured text
being accurate — because `reloadAndCaptureDialog()` auto-accepted the
dialog the instant it fired, before it ever rendered a visible frame (a
real native dialog blocks nothing else while pending; Playwright can
resolve it via CDP essentially instantly). **Fixed in BOTH MU_TS9 and
MU_TS9B**: `reloadAndCaptureDialog()` now holds the dialog open for
`CONFIG.detailsPauseMs` (4s, the same "let a DISPLAYING screen sit for the
recording" constant `pauseForDetails()` uses, §12) before calling
`dialog.accept()`, via a `setTimeout` inside the `'dialog'` handler — the
captured `dialogMessage` itself is unaffected, only the timing of the
accept call changes. Not yet re-run to confirm the dialog is now visible
in the recording (no reason to expect it wouldn't be, low risk).

**MU_TS9B hidden from the dashboard picker, 2026-08-27** — Faizuddin: "hide
ts9b from the dashboard, but dont remove it, i might need it again in the
future." The `mu-ts9b` entry in `app/eauto/edereg-precheck/page.tsx`'s
`TEST_CASES` array is commented out (not deleted) — the Playwright project,
the dashboard route mapping, the spec file, and `attemptStandalonePayment()`
all still exist and work; running it just requires uncommenting that one
line (or invoking the `edereg-precheck-mu-ts9b` Playwright project
directly).

## 29. MU_TS10 — AATF Multiple Users, DIFFERENT company, BackOffice cancels BOTH separate transactions, added 2026-08-27, NEVER RUN LIVE

Test plan, as given by Faizuddin 2026-08-27:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from different
> company (resubmit and make/retry payment after cancel)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number without valid pre-check
> 2. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 3. User B searches the transaction from Transaction Listing Page
> 4. User A proceed to make payment but Payment = Failed (due to IF)
> 5. BackOffice user cancel the transaction vio BO Transaction Listing page
> 6. User B searches resubmit transaction from Transaction Listing page
> 7. System prompt error message "Transaction Cancelled"
> 8. Click [OK] button and system pre-search the trx in Transaction
>    Listing page, Trx Status = Cancelled
> 9. User A attempt to retry payment / make payment
> 10. System prompt error message "Transaction Cancelled"
> 11. Click [OK] button and system pre-search the trx in Transaction
>     Listing page, Trx Status = Cancelled
> 12. Ensure Step Page, Transaction Listing and Details Page showing
>     correctly

**CORRECTED (round 1) per Faizuddin's own direct clarification, same
message**: "is the same as ts9, but the users are from different
companies, so they should have different transactions. they are not
using the same transactions." The literal wording above ("User B
searches THE transaction"/"searches resubmit transaction") reads as User
B acting on User A's own record — same shape as MU_TS9 — but per this
correction, User B has their OWN SEPARATE Pre-Checking transaction for the
SAME vehicle no. throughout, never User A's.

**First live run, 2026-08-27 (round-1 build) — FAILED, and the finding is
WHY the plan got rewritten a second time.** Round 1 had User B create
their own transaction via the STANDALONE flow, then "resubmit" it after
BO's cancel. It never got that far: **the "Resubmit" link itself no
longer rendered on the Cancelled row at all** ("No 'Resubmit' link found
for HXA073 — the Cancelled row may not offer one") — confirming live that
this listing's "Resubmit" action is gated to non-terminal (Pending/Failed)
rows, same rule already confirmed for `BoPrecheckTransactionListingPage`'s
own "Cancel" link (§27's own finding, now shown to generalize to this
OTHER listing's action too).

**CORRECTED (round 2) — the test plan itself was rewritten by Faizuddin
in response**, dropping "resubmit" entirely:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from different
> company (resubmit and make/retry payment after cancel)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number without valid pre-check
> 2. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 3. User A proceed to make payment but Payment = Failed (due to IF)
> 4. BackOffice user cancel the transaction vio BO Transaction Listing page
> 5. User B follows the same step as User A from step 1 until step 4
> 6. System prompt error message "Transaction Cancelled"
> 7. Click [OK] button and system pre-search the trx in Transaction
>    Listing page, Trx Status = Cancelled
> 8. User A attempt to retry payment / make payment
> 9. System prompt error message "Transaction Cancelled"
> 10. Click [OK] button and system pre-search the trx in Transaction
>     Listing page, Trx Status = Cancelled
> 11. User B attempt to retry payment / make payment
> 12. System prompt error message "Transaction Cancelled"
> 13. Ensure Step Page, Transaction Listing and Details Page showing
>     correctly

Reading confirmed directly with Faizuddin before rebuilding: BOTH users
now stay on the DEREGISTRATION-embedded inline flow throughout (User B's
own setup becomes IDENTICAL to User A's — create Deregistration, Step 2,
inline popup, decline IF — just their own company's identity), each gets
their OWN transaction cancelled by BO SEPARATELY (right after their own
decline — User A's is cancelled BEFORE User B even starts, matching the
plan's own step ordering, not both at once), and BOTH retry via their own
still-open inline popup's "Next" button rather than via the listing at
all. `PrecheckEnquiryPage.openViaListingAndResubmitExpectingCancellation()`
and the round-1 standalone-flow setup are KEPT (not deleted) — the method
itself worked exactly as designed (reported the missing link instead of a
useless generic timeout) — just no longer used by this particular test.

**Rebuilt automation** (round 2): each BO cancel reuses
`BoPrecheckTransactionListingPage.cancelAllMatchingRows()` — called TWICE,
once right after each user's own decline, each time only ever finding 1
NEWLY-cancellable row (the other user's, once already cancelled, is
naturally skipped since `a.to-cancel` no longer renders for it). User B
now needs their OWN `MykadEmulatorClient` (`CONFIG.mykadNricSub2`/
`mykadNameSub2`, different-company identity) instead of the standalone
flow's no-MyKad path.

**GENUINELY UNCONFIRMED, flagged per the standing rule**: whether clicking
"Next" on an already-cancelled record's still-open Payment History popup
(a CLICK, not a page reload) shows "Transaction Cancelled", something
else, or nothing — MU_TS9 only ever confirmed a plain REFRESH stays silent
on this same Deregistration-embedded entry point; this specific trigger
(a retry click) has never been exercised live before, for EITHER user
now (both are on the inline flow this time, unlike round 1 where User B's
dialog was hard-asserted via the standalone flow's already-confirmed
behaviour). `DeregTransactionPage.attemptInlineRetryAfterCancellation()`
reports whatever happens without asserting a specific DOM shape
afterward. NEITHER user's dialog text is hard-asserted in round 2's pass
condition — only the final listing status (`Cancelled`) is, for both.

**Automation**: `pages/BoPrecheckTransactionListingPage.ts` grew
`cancelAllMatchingRows()`; `pages/PrecheckEnquiryPage.ts` grew
`openViaListingAndResubmitExpectingCancellation()` (built round 1, kept,
unused by round 2); `pages/DeregTransactionPage.ts` grew
`attemptInlineRetryAfterCancellation()`; `tests/edereg-precheck-mu-ts10.spec.ts`
(fully rewritten for round 2), project `edereg-precheck-mu-ts10`
registered in `playwright.config.ts`, dashboard testCase `mu-ts10` wired
in `app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx`.

**First live run, 2026-08-27 (round 2) — PASSED, but with a genuine
capture-timing bug found and fixed, not yet re-confirmed.** Both declines,
both BO cancels, and both final listing checks (`Cancelled`) came back
exactly as expected. The two retries' own dialogs came back asymmetric,
though: User A's captured `"Transaction Cancelled"` (the literal wording),
User B's came back EMPTY — same code, same action, and (per Faizuddin's
own correct pushback) NOT a cross-user race, since the two run strictly
sequentially with no concurrency between them at all.

**Root cause: the SAME per-request capture-timing gap already found and
fixed for MU_TS9's `reloadAndCaptureDialog()`.** The original
`attemptInlineRetryAfterCancellation()` wrapped the click in
`session.withNativeConfirmCapture()`, whose dialog listener only stays
attached for the duration of the action it wraps (here, `confirmDialog()`'s
own click-and-return) — but the app's own "Transaction Cancelled" dialog
can fire as a separate async follow-up AFTER the click resolves, not
bundled into it. User A's happened to be fast enough to catch; User B's,
under the exact same code, apparently wasn't — a real finding about MY OWN
capture window's fragility, not a real behavioural difference between the
two companies.

**Fixed**: `attemptInlineRetryAfterCancellation()` now listens manually
with an EXTRA grace window after the click (matching
`reloadAndCaptureDialog()`'s own fix), and holds the dialog open for
`CONFIG.detailsPauseMs` before accepting so it's visible in the recording
too. NOT yet re-run to confirm this resolves User B's own empty result —
whether BOTH users genuinely get "Transaction Cancelled" on this retry
trigger is still the open question this test exists to answer.

## 30. MU_TS11 — AATF Multiple Users, DIFFERENT company, both expire via cronjob, single run with dashboard pause/continue, added 2026-08-27, rebuilt 2026-08-27, NEVER RUN LIVE

Test plan, as given by Faizuddin 2026-08-27:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from different
> company (attempt refresh & resubmit after Trx Status = Expired)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number without valid pre-check
> 2. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 3. User B create another transaction using the same vehicle number
> 4. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 5. Wait until cronjob runs, Trx Status = Expired
> 6. User A & User B refresh Step 2
> 7. System shows the step 2 page for Deregistration Transaction
> 8. User A & User B attempts to resubmit transaction from Transaction
>    Listing page
> 9. System displays error message "Transaction Expired"
> 10. Click [OK] button and system pre-search the trx in Transaction
>     Listing page, Trx Status = Expired

**Originally built as the first two-part multi-user case in this ticket**
(modelled on CPC_E2E_TS10/11/12's own hand-off-to-a-dev shape), then
**rebuilt the same day into a SINGLE run** that pauses mid-flow for the
dashboard's Continue button, per Faizuddin: "i need the continue button
to still be on the exact same transaction, to see what the transaction
does." No payment attempt happens anywhere in this whole scenario
(Pending -> Expired only, never Failed) — unlike MU_TS9/10, this needs no
eSIM steering at all.

**The pause/continue mechanism** (`scripts/eauto-edereg-precheck/utils/
pauseSignal.ts`, new 2026-08-27): `pauseForDashboardContinue(label)` writes
a `test-results/pause-status.json` marker and polls for
`test-results/continue-signal.json` (2s interval, default 25 min timeout)
without touching either browser context — both users' inline popups stay
OPEN, on the SAME live sessions, for the whole pause. Two new API routes
mirror the existing `wait-status`/Stop-button precedents:
`app/api/eauto-edereg-precheck/pause-status/route.ts` (GET, dashboard
polls this) and `.../continue/route.ts` (POST, the Continue button hits
this). `fixtures/sessionFixture.ts` resets both marker files at the start
of every run, same reasoning as its existing `clearWaitStatus()` call. The
dashboard (`page.tsx`) polls `pause-status` every `WAIT_STATUS_POLL_MS`
while `running` and renders an amber banner + Continue button when paused.
`app/api/eauto-edereg-precheck/run/route.ts`'s own child-process timeout
was raised (`maxDuration` 1320 -> 2400, `TIMEOUT_MS` 22 -> 40 min) to leave
room for the pause on top of MU_TS11's own setup/resume steps. **Caveat,
by design**: this only works for waits of minutes-to-an-hour — a paused
run still holds two live logged-in browser sessions, so it can't survive
an overnight wait the way the old Part 1/Part 2 split could (Part 2 used
to start a brand-new session).

**Pause banner extended to carry transaction ID(s), 2026-08-27** — per
Faizuddin: "since MU_TS11 & 12 have different companies/transactions,
make sure the part 2 is able to handle this multiple transaction ID, if
they have different ID." `pauseForDashboardContinue()`'s signature grew
an `opts.transactions?: { label, transactionId }[]` array (in
`utils/pauseSignal.ts`, alongside the original `label` string) so the
dashboard can show/copy AS MANY transaction IDs as the scenario actually
has — MU_TS11 passes two (`User A`/`User B`, genuinely separate
per-company records, looked up via the same second-tab trick used for the
transaction-ID lookups earlier in the same test); MU_TS12 passes ONE
(`Shared (User A & User B)` — it's a single same-company record, looked
up the same way right before its own pause). The `pause-status` route
passes `transactions` straight through (it already spreads the whole
status object); the dashboard's pause banner renders each one plus a
"Copy" button that copies all of them, one per line, labelled — not
hardcoded to exactly one.

Looking up each side's transaction ID without disturbing its still-open
popup uses the "second tab, same context" trick MU_TS7 already
established (every `PrecheckEnquiryPage` method operates on
`session.active()` — the LAST page opened in the context — so a fresh tab
becomes the target without touching the tab underneath it).

**"Refresh Step 2" (step 6) — WRONG interpretation built 2026-08-27,
CORRECTED 2026-08-28.** The original build (below, kept for history) read
this as "cancel the stale popup and start a whole NEW Deregistration
attempt" — explicitly NOT a literal reload. **Faizuddin corrected this
directly, in caps: "REFRESH MEANS REFRESH THE PAYMENT."** — step 6 is a
literal browser refresh of Step 2's own inline pre-check popup/payment
screen, the SAME action MU_TS9 already exercises on a Cancelled record
(§27, `page.reload()` — confirmed live to render a silently blank "Owner &
Vehicle Details" form, no dialog, no error, EAINT-12233). MU_TS11 needs
this SAME literal-reload action, just against an Expired record instead
of a Cancelled one — a different terminal status MU_TS9 never covered, so
it's still a genuinely new observation, not a repeat. **REBUILT 2026-08-28**:
the cancel-then-create-new-Deregistration step is gone, replaced with a
local `reloadAndCaptureDialog()` helper (same shape as MU_TS9B's own)
doing a plain `page.reload()`/`userBPage.reload()` on each user's own
still-open Step 2 tab, holding any native dialog open for
`CONFIG.detailsPauseMs` before accepting (visible in the recording) and
logging whatever came back — NOT hard-asserted, since MU_TS9's own
"silent" finding was for a Cancelled record, not Expired. Step 8's
listing/Resubmit check is UNCHANGED (still hard-asserts the link is
absent) — but the Resubmit-link-found result from the PRE-rebuild live
run doesn't count as a confirmed app inconsistency, since that run
reached step 8 via the wrong refresh action. **Checked MU_TS12 for the
same mistake, per Faizuddin's own follow-up — it does NOT have this
bug.** MU_TS12 never has a "refresh" step at all; its own test plan says
"attempt to make payment"/"attempt to retry payment" (an active click via
`attemptStandaloneRetryAfterCancellation()`/`attemptInlineRetryAfterCancellation()`),
and it only ever calls `createFromHome()` once. Built correctly from the
start. NEVER RUN LIVE in this corrected form.

**Original (WRONG) reasoning, kept for history**: "since the SAME browser
sessions stay alive across the pause, this means each user first cancels
their own now-stale popup, then creates ANOTHER Deregistration attempt for
the SAME vehicle no., reaching Step 2 again — the now-Expired precheck
doesn't satisfy the gate, so the SAME inline popup shape reappears
automatically. NOT a literal browser reload. Since this scenario doesn't
want either user buying a fresh pre-check here, each clicks 'Cancel' on
that popup (OF_TS1's own already-confirmed shape) before moving to the
actual check." This was presented as "confirmed directly with Faizuddin
before building" — it wasn't actually correct, a lesson on its own: a
confirmation exchange can still land on the wrong shared understanding: reconfirm
against the LITERAL word used ("refresh") rather than the shape that
seemed to make sense at build time.

**Step 8's "resubmit ... Transaction Expired" reuses
`PrecheckEnquiryPage.openViaListingAndResubmitExpectingCancellation()`
VERBATIM** (built for MU_TS10, §29) — despite its name, the method is
generic: click "Resubmit", capture whatever native dialog fires (or
report cleanly if the link isn't there at all). Per Faizuddin's live-run
feedback 2026-08-27, both previously-unconfirmed shapes are now settled:
1. **CONFIRMED: the "Resubmit" link does NOT render on an Expired row** —
   "the resubmit link will not render on expired row. for the expired
   transactions, user cannot do anything anymore." Same gating MU_TS10
   confirmed for a Cancelled row now confirmed for Expired too. Hard-
   asserted (`resubmitLinkFound === false`) for both users.
2. **The literal "Transaction Expired" wording is deliberately NOT
   asserted** — "No need to do hard check on the literal wording. that one
   i will check the recording and check it manually myself." Only the
   FINAL listing status (`Expired`) is hard-asserted, for both users.

**Automation**: single file `tests/edereg-precheck-mu-ts11.spec.ts`,
project `edereg-precheck-mu-ts11` in `playwright.config.ts`, dashboard
testCase `mu-ts11` (a normal, single `TEST_CASES` entry — no Part 2
continuation wiring needed) in `app/api/eauto-edereg-precheck/run/route.ts`
and `app/eauto/edereg-precheck/page.tsx`. No new page-object methods
needed — composes `findTransactionIdByVehicleNo()`,
`fillVehicleRegNoAndCheckGate()`, `openViaListingAndResubmitExpectingCancellation()`,
and `getListingStatusForVehicle()`, all already built for earlier cases,
plus the new `pauseForDashboardContinue()`.

## 31. MU_TS12 — AATF Multiple Users, SAME company, User A's Failed (IF) payment expires via cronjob while User B's shared standalone Payment page stays open, single run with dashboard pause/continue, added 2026-08-27, NEVER RUN LIVE

Test plan, as given by Faizuddin 2026-08-27:

> Pre-requisite: AATF User A (Main) & User B (Sub) are from different
> company (make and retry payment after Trx Status = Expired)
> 1. User A go to create new Deregistration. At step 2, input vehicle
>    number without valid pre-check
> 2. Proceed until pre-check enquiry pops up, Trx Status = Pending
> 3. Open another tab and login with User B AATF account
> 4. User B search the transaction in Transaction Listing page
> 5. User A proceed to make payment but Payment = Failed (due to IF), Trx
>    Status = Failed
> 6. Wait until cronjob runs, Trx Status = Expired
> 7. User B attempt to make payment
> 8. System prompt error message "Transaction Expired"
> 9. Click [OK] button and system pre-search the trx in Transaction
>    Listing page, Trx Status = Expired
> 10. User A attempt to retry payment
> 11. System prompt error message "Transaction Expired"
> 12. Click [OK] button and system pre-search the trx in Transaction
>     Listing page, Trx Status = Expired

**"Different company" in the pasted header is a stale copy-paste,
CONFIRMED with Faizuddin before building — the same issue MU_TS2's own
plan had (§20).** The flow only ever creates ONE transaction (User A's);
User B never creates their own, only searches/pays on THAT one — that
only makes sense if User B shares User A's exact record, i.e. SAME
company. User B is `CONFIG.subUsername`/`subPassword`, the identity
MU_TS1/TS4/TS8/TS9 already use — not the different-company User C.

**Nearly identical shape to MU_TS9 (§27) up through the Failed payment.**
User A's setup (create Deregistration, Step 2, stop at the inline popup
with the gate blocked) is IDENTICAL to MU_TS7/8/9's own User A setup.
"User B search the transaction in Transaction Listing page" (step 4) is
read the same way MU_TS9's own step 3 ("User B resubmit transaction from
Transaction Listing Page") was built —
`PrecheckEnquiryPage.openViaListingAndResubmit()`, landing User B on the
standalone Step 2 (Payment) page without paying yet. User A's payment
(step 5) reuses `DeregTransactionPage.attemptInlinePayment()` steered to
RHB "IF" (insufficient funds) verbatim from MU_TS9.

**Diverges from MU_TS9 at the terminal event, and reuses MU_TS11's own
rebuild (§30) for it**: MU_TS9's transaction goes Failed -> Cancelled via
a BackOffice action; TS12's own goes Failed -> Expired via the SAME
cronjob MU_TS11 hands off to a dev. Built as a SINGLE run that pauses via
`pauseForDashboardContinue()` (`utils/pauseSignal.ts`) rather than a Part
1/Part 2 split — both User A's inline popup (now showing the declined
Payment History) and User B's standalone Payment page stay OPEN, on the
SAME live sessions, across the pause. Per Faizuddin, 2026-08-27: "in both
TS11 and 12, it says that needs to wait for cronjob to run right? so...
make sure to separate the 2 processes at that moment in time. after
patching, both TS will continue the steps at that point in the process."
Simpler than MU_TS11's own pause in one respect — no second-tab
transaction-ID lookup needed here, since User B's own context already has
its target page open from step 4 and never needs to look anything up by
vehicle no. before the pause.

**Steps 7/10's "attempt to make payment"/"attempt to retry payment" reuse
MU_TS9's own retry methods VERBATIM** — despite MU_TS9 naming them for a
BO-cancelled record, both are generic click-and-capture helpers: User B
via `PrecheckEnquiryPage.attemptStandaloneRetryAfterCancellation()`
(clicks whichever of `#to-retry-rhb`/`#to-payment` renders on the page
they've had open since step 4), User A via
`DeregTransactionPage.attemptInlineRetryAfterCancellation()` (clicks
"Next" on the still-open Payment History popup). Per Faizuddin's TS11
feedback, applied here too: the literal "Transaction Expired" dialog
wording is NOT hard-asserted — only the FINAL listing status (`Expired`)
is, for both users.

GENUINELY UNCONFIRMED, flagged per the standing rule: whether either
retry mechanic surfaces ANY dialog on this shared-transaction, same-
company shape at all — MU_TS9's own live run showed a PLAIN refresh stays
completely silent on this entry point (EAINT-12233), and even the
active-retry mechanic's own dialog text has never matched the test plan's
literal quote in this suite (MU_TS4/TS8/TS9's shared lesson). Logged, not
gated on.

**Automation**: single file `tests/edereg-precheck-mu-ts12.spec.ts`,
project `edereg-precheck-mu-ts12` in `playwright.config.ts`, dashboard
testCase `mu-ts12`, `multiUser: "same"`, wired in
`app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx`. No new page-object methods needed —
composes `openViaListingAndResubmit()`, `attemptInlinePayment()`,
`attemptStandaloneRetryAfterCancellation()`,
`attemptInlineRetryAfterCancellation()`, and `getListingStatusForVehicle()`,
all already built for earlier cases, plus `pauseForDashboardContinue()`.

## 32. CJ_TS1–5 — Cronjob expiry behaviour, single-user, ALL as classic Part 1/Part 2 splits, added 2026-08-27, NEVER RUN LIVE

Full step text: §5.5. Per Faizuddin, 2026-08-27, explicit and deliberate
choice AGAINST reusing MU_TS11/TS12's pause/continue mechanism here: "i
want to make all 5 TS with 2 parts. before and after cronjob. the before
will create the transactions up till the mentioned status. the after
will check the status and the other details." Part 1 = "before" (create,
stop at the row's own starting Trx Status, hand off for the dev/cronjob).
Part 2 = "after" (fresh session, PURE READ — no Deregistration, no
MyKad, no payment — just `PrecheckEnquiryPage.getListingStatusForVehicle()`
against the same vehicle no.). Simpler than every other Part 2 in this
suite for exactly that reason: none of these five ever continues the
transaction into anything further.

**`getListingStatusForVehicle()` extended** (`pages/PrecheckEnquiryPage.ts`)
to also read the Remarks column (index 8 of the confirmed 10-column
order, §24) — every prior caller only needed Payment/JPJ
Pre-Checking/Trx Status, but CJ_TS1/TS5's own expected result hinges on
`Remarks = "Transaction Expired"` specifically, not just the status.

**CJ_TS2 Part 1 deliberately uses the STANDALONE "eDereg Pre-Checking
Enquiry" entry point, not the literal "Create new Deregistration until
step 2" wording.** The Deregistration-embedded inline entry resets
`#vehicleRegNo` to blank on a JPJ-Failed outcome instead of persisting a
record (confirmed live, CPC_E2E_TS2/TS8's dead-end shape — see
ts10-part1.spec.ts's own doc comment) — a dead-end record can't be
checked post-cronjob at all. CPC_E2E_TS5 Part 1 hit this exact problem
for this exact shape and already resolved it this exact way; followed
that precedent rather than re-asking. CJ_TS1 (RHB IF decline) doesn't have
this problem — a DECLINED inline payment DOES persist, confirmed live by
MU_TS9 (BO successfully found and cancelled that shape) — so CJ_TS1 uses
the inline entry point as written, via `attemptInlinePayment()`.

**CJ_TS1 Part 1 also steers the Dereg Precheck (JPJ) response code to
VEL000045E, added 2026-08-28**, per Faizuddin: "i want you to change the
eSIM jpj response code to VEL also. i know it doesnt even hit it, but just
in case want to test the system stills calls for the checking thing."
Belt-and-suspenders only — the gate's JPJ-then-payment ordering means the
RHB "IF" payment decline is still expected to be what actually produces
the Failed outcome here, same as before this change. Set directly via
`setEsimResponseCode('dereg-precheck-enquiry', ...)`, NOT via
`ensureEsimJpjErrorPath()` (that helper also resets RHB Transfer back to
OK, which would undo the payment-decline steering this test needs) — RHB
Transfer stays on "IF" throughout. Part 2 is untouched; its only job is
confirming the cronjob picks up the Failed pre-check and expires it
correctly through the eDereg flow.

**CJ_TS3 needed a header-comment correction, not a build change.** Its
own starting Trx Status is already "Expired," which the daily cronjob can
never produce from an Approved record (§5.5: "explicitly does NOT touch
Approved") — so step 3's "ask dev to run cronjob... make sure status is
EXPIRED" is read as a direct DB patch forcing the status (same kind of
one-off dev intervention the 6-month SRD patch already uses elsewhere in
this suite), not a literal cronjob run, mislabelled the same way "refresh
Step 2" turned out to mean something other than a literal reload in
MU_TS9/TS11. Part 1 only produces the Approved record via the inline
entry (`resolveVehicleGate()`, same as CJ_TS4); BOTH the DB patch and the
wait for the NEXT real cronjob run happen during the hand-off. Part 2's
own Remarks read is logged, NOT hard-asserted — whether a direct DB patch
sets the same "Transaction Expired" text the cronjob itself writes is
genuinely unconfirmed, unlike CJ_TS1/TS5's cronjob-written Remarks (which
ARE hard-asserted).

**CJ_TS4 and CJ_TS5** are the two "boring" confirmations of the standing
rule (§5.5) — Approved never touched, Pending gets picked up — built the
same way as their closest existing precedent (CJ_TS4 = CJ_TS3's own
inline-Approved setup minus the DB-patch twist; CJ_TS5 = MU_TS7/8/9/11's
own "stop at the inline popup, never Next, never Cancel" User A setup,
no eSIM steering needed since nothing ever pays).

**Automation**: 10 files,
`tests/edereg-precheck-cj-ts{1,2,3,4,5}-part{1,2}.spec.ts`, matching
projects in `playwright.config.ts`, all 10 testCases wired in
`app/api/eauto-edereg-precheck/run/route.ts` (both parts, per the
existing Part 1/Part 2 convention); only the five Part 1s appear in
`page.tsx`'s static `TEST_CASES` (new "Cronjob" group) — Part 2s are
dynamically generated `PendingContinuation` entries, same convention as
every other two-part case in this suite. No new page-object methods
needed beyond the `getListingStatusForVehicle()` Remarks extension above.

## Others (ad hoc diagnostic builds, not one of the numbered test-plan cases)

### Same-company dual create — does UCD2 reuse UCD1's still-Pending pre-check, or create a new one?, added 2026-08-27, NEVER RUN LIVE

Requested directly by Faizuddin, 2026-08-27, verbatim: "make a simple
automation that will use 2 ucd from the same company. i want the first
one to make pre-check transaction, but dont proceed with payment yet. i
want the 2nd one to do the same, but this time until the end. i want to
check on whether does the 2nd ucd uses the same precheck transaction, or
does it create a new one. the 2nd ucd DOES NOT CONTINUE FROM THE LISTING.
it goes through the create pre-check. all of these are done through
pre-check transaction."

**Not one of the numbered MU_TS/AM_TS/OF_TS/CPC_E2E_TS cases** — a
standalone question, asked separately from any test plan, about the
standalone Pre-Checking flow's own "create" entry point specifically.
Deliberately different from every MU_TS case built so far: BOTH UCDs go
through `openFromHome()`/`fillVehicleAndConsent()`/`enquireNow()` for the
SAME vehicle no. — UCD2 never touches the listing or "Resubmit" at all,
which is the one thing this build exists to rule out as a confound.

**Context — what's already known**: MU_TS1 (§19) confirmed same-company
users reuse an already-APPROVED pre-check through the DEREGISTRATION
flow's own gate check (`resolveVehicleGate()`). This build asks the SAME
underlying "does same-company sharing apply here" question, but for a
still-PENDING (never paid, never Approved) transaction, through the
STANDALONE flow's own creation step — never exercised this way before.
Genuinely unconfirmed outcome, built to OBSERVE rather than assert a
specific answer — the RESULT log's own `verdict` field states the actual
finding (1 row throughout = reused; 2+ rows = separate) rather than the
test failing or passing on it.

**Automation**: `tests/edereg-precheck-same-company-dual-create.spec.ts`,
project `edereg-precheck-dual-create` registered in `playwright.config.ts`,
dashboard testCase `dual-create` wired in
`app/api/eauto-edereg-precheck/run/route.ts` and
`app/eauto/edereg-precheck/page.tsx` under a NEW "Others" group (per
Faizuddin's own instruction to file ad hoc builds like this one
separately from "Multiple Users"). UCD1 = Main (`CONFIG.username`/
`password`), UCD2 = Sub, same company (`CONFIG.subUsername`/`subPassword`
— the same identity MU_TS1/TS4/TS8/TS9 use). eSIM steered to the happy
path throughout, since UCD2 needs to reach a real Approved result. No new
page-object methods — composes `PrecheckEnquiryPage`'s already-existing
methods only, including the "separate tab for a listing check, don't
navigate the tab mid-flow" pattern MU_TS7 established (§25), used here
for BOTH UCD2's post-enquiry check and its final check so UCD2's own
Step 2/Details tabs are never disturbed.

**Removed 2026-09-01, per Faizuddin — the "Others" dashboard group (which
held only this one diagnostic) was removed entirely.** Reasoning above
kept for history; if a future case needs the same "does UCD2 reuse UCD1's
still-Pending precheck" question answered, this is the reference build to
start from. `PrecheckEnquiryPage`'s own "separate tab for a listing check"
pattern this build used is unaffected — it's shared infra other specs
still rely on.

## Extra Coverage (gaps found by cross-checking the dev's QA test guide against every existing TS, added 2026-08-28)

Faizuddin asked for a crosscheck between this suite's automation and the
dev-authored QA test guide
(`_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html`)
— which scenarios from the guide's own §3 "Test scenarios" list are still
NOT covered, or only partially covered, by any of the 38 numbered
CPC_E2E_TS/AM_TS/CJ_TS/OF_TS/MU_TS cases. An Explore agent read every
spec's actual ASSERTIONS (not just filenames/comments) against the guide's
10 numbered scenarios. Findings, then what got built for each:

- **Solid already**: guide scenarios 1 (valid precheck → allowed), 2 (no
  precheck → inline flow → approved), 8 (different company blocked), and
  the compliance banner (AM_TS1-4) all have genuine assertions somewhere in
  the suite. Nothing built for these.
- **Scenario 4** (a later failure doesn't undo an earlier approval) — NOT
  covered. MU_TS6 (§24) tests the OPPOSITE order (Failed-first, then a
  second user's Approved). **EC_TS1** built.
- **Scenario 5** (abandoned precheck reused, not duplicated) — NOT
  covered. OF_TS1 only checks the popup closes, never re-triggers the gate
  or checks the listing row count. **EC_TS2** built (also folds in
  scenario 3's "unpaid" sub-case, below).
- **Scenario 3** (five invalid-precheck subtypes should each block a fresh
  Deregistration) — PARTIALLY covered. Only "Approved but >6 months old"
  is genuinely re-tested (TS4/5/6 Part 2). Unpaid/Pending is now covered by
  EC_TS2's own second round. JPJ-rejected was covered by **EC_TS3** — since
  removed 2026-09-01, per Faizuddin: he'd already covered this sub-case
  himself elsewhere, so it was redundant. **EC_TS4**
  built for BackOffice-cancelled. Expired is still NOT separately covered
  as a fresh-gate-check (CJ_TS1-5's own Part 2 is explicitly a pure read,
  never re-tests the gate) — see "Still open" below.
- **Scenario 6** (failed-payment precheck resumes in retry mode with
  history) — PARTIALLY covered. OF_TS4 declines/retries/succeeds but keeps
  ONE popup open continuously via pause/continue, never a genuine
  cancel-and-return round trip. **EC_TS5** built, using the Pre-Checking
  listing's "Resubmit" link (confirmed live via MU_TS4) as the "come back
  later" mechanism.
- **Scenario 7** (long Payment History scrolls at a small viewport) — NOT
  covered. The suite's whole default viewport is a fixed 1920x1080
  (`playwright.config.ts`); nothing anywhere overrides it. **EC_TS6**
  built, using `test.use({ viewport: { width: 1366, height: 768 } })` —
  confirmed this is file-scoped, doesn't touch the shared config. **Removed
  2026-09-01, per Faizuddin — already covered by his own existing testing.**
- **Scenario 9** (JPJ receipt email populated on an inline-created
  precheck) — NOT covered. `jpjReceiptEmail` was only ever used as a form
  INPUT, never read back off anything. **EC_TS7** built — reads it via the
  BO JPJ XML Log's own Request Data, decoded with the already-confirmed
  `decodePrecheckRequestData()`'s `companyEmail` field
  (`utils/jpjXmlLogDecode.ts`) — that decoder existed already but no TS had
  ever actually called it for this purpose.
- **Scenario 10** ("eDereg Pre-Checking: Yes" row + link, checked on BOTH
  the AATF and the BACK-OFFICE enquiry views) — PARTIALLY covered, and
  deliberately NOT built further this round. The AATF side is checked
  everywhere via `srdChecklist.ts`. **No back-office Dereg-enquiry page
  object exists in this suite at all** (only BO precheck-listing/login/JPJ-log
  pages exist) — per this repo's own standing rule against writing
  selectors for a page with no captured HTML, building this blind wasn't
  attempted. Needs Faizuddin to paste the BO Dereg enquiry → view page's
  HTML first.

All seven (**EC_TS1–EC_TS7**) were single-user builds, filed under a NEW
"Extra Coverage" dashboard group (distinct from the now-removed "Others"
group above, which was for ad hoc diagnostics not tied to any specific
coverage gap) — `tests/edereg-precheck-ec-ts{1..7}.spec.ts`,
Playwright projects `edereg-precheck-ec-ts{1..7}`, dashboard testCases
`ec-ts{1..7}`. Every one composes ONLY already-confirmed page-object
methods — no new selectors were guessed for any of them. **NEVER RUN
LIVE, any of them.**

**Genuinely open questions, flagged rather than guessed around (verify
these on first live run)**:
1. **EC_TS1** assumes the standalone "create" flow lets you `enquireNow()`
   again for a vehicle that ALREADY has a valid Approved precheck on file
   — never done anywhere else in this suite. If the app instead blocks/
   redirects before Step 2, `enquireNow()`'s own dialog-wait will simply
   throw, which is itself informative.
2. **EC_TS2** assumes an abandoned (Cancelled-before-paying) popup
   persists a row at all. If it persists nothing, `rowCount1`/
   `transactionId1` come back 0/'' — the finding, not a script bug.
3. **EC_TS4** assumes an abandoned Step-2 popup (this test's own first
   Deregistration attempt) doesn't leave a resumable draft behind, per
   MU_TS7's own confirmed finding for the SAME shape — untested for THIS
   specific combination (declined-payment popup specifically, not
   MU_TS7's own abandoned-before-any-payment shape).
4. **EC_TS7** reports `emailMatchesConfiguredInput` but doesn't gate on it
   — per the guide's own caveat, a company-level configured email may
   legitimately differ from the form's own typed value. Only "is it
   populated at all" is the hard pass condition.

**EC_TS8 added same day, per Faizuddin's follow-up decision** — the
"Expired" subtype above got built after all: classic Part 1/Part 2 split
(NOT the pause/continue mechanism) — same reasoning as CJ_TS1-5 (§32),
since Faizuddin was explicit that cronjob-dependent cases use the two-part
pattern, not pause/continue. **Part 1 was IDENTICAL in shape to CJ_TS1
Part 1** (produce a real Failed precheck via a declined RHB "IF" inline
payment, hand off for the dev to run the cronjob). **Part 2 diverged from
CJ_TS1 Part 2**: after confirming the same Expired/Remarks precondition
CJ_TS1 Part 2 already checks, it went further — started a FRESH
Deregistration for the same vehicle+company and confirmed the gate was
STILL blocked (via `OtherFunctionsPage.cancelPrecheckPopup()`, same
pattern EC_TS4 uses) — the actual EC_TS8 assertion CJ_TS1 Part 2 never
attempts. **Removed 2026-09-01, per Faizuddin — already covered by his own
existing testing.**

**Dashboard now supports running two tests SIMULTANEOUSLY, added 2026-08-28**,
per Faizuddin: "is it possible to run both MU_TS11 & 12 at the same time?
because its hard for the dev to patch the data one by one. easier if can
multiple at once." Explicitly NOT a script change — MU_TS11/TS12 (and every
other test) run exactly as before; the fix is entirely in the dashboard's
own plumbing, which used to assume only ONE run could ever be in flight:

- `app/api/eauto-edereg-precheck/runState.ts` — was a single set of fields
  (`currentChild`/`runOutputBuffer`/etc.), now a `Map<runId, RunEntry>`.
- `page.tsx`'s own `run()` generates a `crypto.randomUUID()` runId BEFORE
  the (blocking) POST to `/run` even resolves, so the live-log/pause-status
  polls that start the instant `running` flips true already know which
  run they belong to. Sent as `DPC_RUN_ID` to the spawned Playwright child.
- `utils/pauseSignal.ts` reads `DPC_RUN_ID` and scopes its pause/continue
  filenames to it (`pause-status-<runId>.json` instead of one shared
  `pause-status.json`) — falls back to the old unscoped names when
  `DPC_RUN_ID` isn't set (a plain `npx playwright test` run outside the
  dashboard still works unchanged).
- `pause-status`/`continue`/`live-log`/`run` (DELETE) routes all take a
  `runId` (query param or body) and read/write the correspondingly-scoped
  file or map entry.

**Why this mattered, concretely**: before this, running two tests at once
meant whichever paused SECOND overwrote the first's pause banner entirely,
and clicking Continue wrote ONE shared signal file — so continuing one
paused run would ALSO wake the other, even if the dev had only patched
one of the two underlying records. Two browser tabs, each running its own
test case, now stay fully independent.

**ROUND 2, same day — the first fix above was incomplete.** Faizuddin
tried it live: "running both at the same time in different tabs did not
work. the popup will only show one or the other. not both at the same
time." Root cause, confirmed directly in Playwright's own source
(`node_modules/playwright/lib/runner/index.js`,
`createRemoveOutputDirsTask()`): **`npx playwright test` wipes its ENTIRE
`outputDir` at the START of every invocation**, unless
`preserveOutputDir` is set. Every project in `playwright.config.ts` shares
ONE `outputDir` (`test-results/`, no per-project override) — so starting
MU_TS12 while MU_TS11 was still paused didn't just leave the runId-scoped
filenames alone, it deleted the WHOLE `test-results/` folder including
MU_TS11's pause file, out from under it. The runId-scoped naming from
round 1 was necessary but not sufficient — it only prevents two files
from colliding by NAME, not the whole containing folder being wiped.

**Round 2 fix — two parts**:
1. **Pause/continue files moved OUT of `test-results/` entirely**, into a
   new `.run-signals/` folder (`utils/pauseSignal.ts`, plus the
   `pause-status`/`continue` routes) — never Playwright's `outputDir`, so
   nothing it does on startup can touch these files regardless of how many
   runs overlap.
2. **Each spawned Playwright process now gets its OWN `--output` folder**
   (`test-results-<runId>/`, `run/route.ts`'s spawn call) — a genuinely
   separate `outputDir` per run, so Playwright's own startup wipe is
   scoped to only the run that's actually starting, never a different one
   still in flight. `utils/videoManifest.ts`'s new `videoRunDir()` helper
   resolves the SAME per-run folder (via the same `DPC_RUN_ID` env var)
   for the video-manifest file and every manually-created browser
   context's own `recordVideo.dir` — updated across all 14 files that had
   it hardcoded to the old shared path (every MU_TS spec, the dual-create
   diagnostic, `utils/srdChecklist.ts`'s BO context). `publishVideos()`
   now reads from that per-run folder and deletes it after copying videos
   into the published output, so these scratch folders don't pile up.

**Still not scoped, deliberately** (low-risk, flagged not fixed): the VPN
reset-timer wait banner (`utils/waitStatus.ts`, `wait-status/route.ts`) —
only relevant to CPC_E2E_TS5/TS11 Part 2's own RE wait, which MU_TS11/TS12
never trigger.

**NOT yet re-tried live with this round-2 fix** — first real test is
whenever MU_TS11 + MU_TS12 (or any two tests) are actually run together
again.

**Still open, not built**: guide scenario 10's back-office half ("eDereg
Pre-Checking: Yes" row check on the BO Dereg enquiry view) — per Faizuddin,
2026-08-28, deliberately left for a later session: he'll paste the BO Dereg
enquiry → view page's HTML when he's back, then it can be built the normal
way. No blind selectors written for it.

**Dashboard bug found and fixed, 2026-08-28**: the VPN gate (`app/eauto/
edereg-precheck/page.tsx`) only ever checked `TEST_CASES.find(...)
?.skipVpnGate` — but every two-part case's Part 2 is a DYNAMICALLY
generated continuation, never listed in `TEST_CASES` at all, so that
lookup always came back `undefined` for any Part 2, forcing the VPN
confirmation dialog even for CJ_TS1-5's own Part 2 (a pure listing read)
and EC_TS8 Part 2 (re-checks the gate via the portal directly, since
removed 2026-09-01 — already covered by Faizuddin's own testing) — neither
of which calls anything in `utils/esim.ts`, confirmed by grepping every
Part 2 spec for an esim import. Fixed with a new `VPN_GATE_SKIP_TEST_CASES`
set the Run button's `onClick` also checks. Deliberately does NOT include
ts4/5/6/10/11/12-part2 — those DO re-steer eSIM to retry payment, so they
still need the VPN gate.

**EC_TS9 added, per Faizuddin's direct request**: a repeated Failed
pre-check (payment succeeds, JPJ rejects — `ensureEsimJpjErrorPath()`,
VEL000045E) should RECALL the same Pre-Checking transaction, not create a
second one. Single AATF user, Deregistration Step 2's inline flow: fill
owner contact fields once, then `DeregTransactionPage.resolveVehicleGate()`
twice in a row (pay -> JPJ Failed -> Close, then the same thing again on
the SAME vehicle, same still-failing eSIM code — deliberately not re-steered
between attempts, unlike CPC_E2E_TS9's own two-attempt sequence which flips
to Approved on the retry). `resolveVehicleGate()` already does the
"payment succeeds, popup appears, Close" part of the flow on each call —
nothing new needed there. Checked from BOTH sides: the AATF listing
(`PrecheckEnquiryPage.getListingStatusForVehicle()`, whose own `rowCount`
covers the AATF-side count) and the BackOffice "eDereg Pre-Checking
Transaction Listing" (`BoPrecheckTransactionListingPage.searchByVehicleNo()`,
same BO login pattern MU_TS9 already uses). Pass condition: both attempts
Failed, AND exactly 1 row on both listings.

**Worth flagging — this may contradict MU_TS6's own confirmed finding
(§24 above)**: MU_TS6 found a JPJ-rejected precheck resubmitted by a
DIFFERENT user/session on the same vehicle+company creates a genuinely
SEPARATE second row, not an in-place update — the opposite of what EC_TS9
expects. EC_TS9's case is narrower (the SAME session repeating the SAME
failing attempt, not a different user's fresh Deregistration afterward), so
it may genuinely behave differently — untested territory. If the live run
disagrees with the 1-row expectation, treat that the same way MU_TS6's own
2-row result was treated: a real, confirmed finding, not a script bug.
Precondition: vehicleRegNo must have no prior
Pre-Checking transaction (same as CPC_E2E_TS7/TS8/TS9).

**Removed 2026-09-01, per Faizuddin** — deemed close enough in shape to
EC_TS1 (a later-vs-earlier precheck question on the same vehicle) that a
separate case wasn't worth keeping. Reasoning above kept for history —
if a future case needs the same "repeated Failed precheck" question
answered, this is the reference build to start from.

**Script bug found and fixed, 2026-08-29 — missing the suite's own standard
opening `closeBanners()` boilerplate, not a `done()`-specific gap.** EC_TS1's
first live run timed out (30s) clicking `#DEREGISTRATION` in
`openFromHome()`: a `.ui-dialog` (`#dialog-announcement`) was intercepting
pointer events on top of it. First guess was that `done()`'s navigation to
the Details page spawned it (added a `closeBanners()` there) — WRONG: the
second live run failed at the exact same spot, but on the test's very
FIRST `openFromHome()` call, before Record A even starts. Real cause:
EC_TS1 and EC_TS3 (EC_TS3 itself later removed 2026-09-01, per Faizuddin —
he'd already covered that sub-case himself) were the only two specs in this whole suite missing the
standard `session.logUrl('after login'); await session.closeBanners();`
pair every other test (MU_TS*, CJ_TS*, OF_TS*) already
runs immediately after login, before touching the page at all — an
announcement banner can already be sitting there right after login, not
just after a later navigation. EC_TS4 had the same gap, caught by
cross-checking every EC_TS file's own opening lines rather than waiting to
hit it live a third time. **Fixed by copying the exact same two lines every
other spec already uses**, added to EC_TS1/TS3/TS4 right at the top of the
test body.

**Correction, 2026-09-01 — that cross-check MISSED EC_TS5.** EC_TS5's own
first live run hit the identical banner failure at the identical spot
(`openFromHome()`'s `#DEREGISTRATION` click), because the earlier audit's
own conclusion ("only EC_TS4 is missing it") was wrong — EC_TS5 never had
the pair either, it was just misread in the same sweep. Re-checked EVERY
EC_TS file's opening lines directly (not from memory) this time — EC_TS5
was the only one still missing it; EC_TS1/2/4/6/7/8/9 all confirmed to
already have it. Fixed the same way. **Lesson for next time: when auditing
a whole group for a specific gap, verify the negative claim ("only X is
missing it") by re-reading the full list back, not by eyeballing a large
`sed` dump once.**

The earlier `done()`-specific `closeBanners()` call added to
EC_TS1/TS3 is left in place too (still a real defensive gap for the second
navigation) but the missing opening pair was the actual first-run blocker.
If a NEW "Extra Coverage" test is added later, copy the same opening pair from any
existing EC_TS file rather than skipping it.

**Third live attempt, same day — the REAL blocker for Record B was never a
banner at all.** With the opening boilerplate fixed, Record A ran clean
end-to-end (Approved, real transaction ID). Record B's own
`precheck.openFromHome()` then timed out on `#DEREGISTRATION` again — but
this time with NO dialog-interception noise in the error, just a plain
"element not found" timeout. Real cause: `done()` leaves the session on the
Details page (`view.do?id=...`), which is NOT the AATF home page
`openFromHome()`'s own doc comment assumes ("AATF home -> eDEREG menu ->
...") — unlike `DeregTransactionPage.createFromHome()`, which clicks
`#home-link` itself first specifically so it can be called from anywhere,
`PrecheckEnquiryPage.openFromHome()` never has this need under normal use
(every other caller reaches it fresh after login, already on home) and so
never gained the same defensive click. EC_TS1 is the first spec in this
suite to call `openFromHome()` a SECOND time, later, from a non-home page —
genuinely new territory. Fixed by adding the same `#home-link` click
EC_TS1's own test body now does before Record B's `openFromHome()`, not by
changing the shared page object (kept the fix scoped to the one "Extra Coverage"
spec, per Faizuddin's instruction not to touch anything outside the Extra Coverage
group). If a future case needs `openFromHome()` a second time mid-session
too, copy this same `#home-link` click rather than assuming the plain call
works.

**Fourth live attempt, same day — the core scenario itself PASSED, then the
bolted-on SRD checklist broke on the same "two records for one vehicle"
shape.** Record A Approved, Record B declined, and the actual EC_TS1
question got a real, confirmed answer: the fresh Deregistration's gate
check came back `ALREADY SATISFIED (Record A still qualifies)`, and the
Deregistration completed end-to-end — Faizuddin's read of guide scenario 4
holds live, a later failure does NOT undo an earlier approval. Broke next,
in `runPostDeregSrdChecklist()`'s own details-page check: `"Enquiry
Response:"` came back empty. Real cause — `runPostDeregSrdChecklist()`
internally calls `PrecheckEnquiryPage.findTransactionIdByVehicleNo()`,
which grabs the NEWEST pre-check record for the vehicle (a correct
assumption everywhere else this suite uses it — see the two-part cases'
own note above about `.first()` needing to land on the newest row). Here
the newest record is Record B — declined, never completed — so its own
Details page has nothing under "Enquiry Response" to show. Fixed by NOT
calling `runPostDeregSrdChecklist()` as a black box for this one case:
EC_TS1 now reproduces its body inline, pointed at the already-known
`transactionIdA` (Record A, Approved) instead of re-deriving whichever
record happens to be newest. Scoped entirely to EC_TS1's own spec file —
`srdChecklist.ts` itself is untouched, since its "newest record" assumption
is correct for every other caller. Any FUTURE "Extra Coverage" (or other) case that
deliberately leaves more than one pre-check record on a vehicle before
running the SRD checklist needs the same targeted-ID treatment, not the
plain `runPostDeregSrdChecklist()` call.

**EC_TS4 first live run, 2026-09-01 — a genuinely different cause from
EC_TS1/EC_TS3's own banner gaps: a leftover OPEN dialog, not a fresh one.**
Round 1's own declined-payment popup (`beginInlinePaymentFlow()`'s Payment
History shape) is deliberately abandoned in place — nothing ever clicks its
Cancel button, per the test's own "abandoning this Deregistration attempt
in place" comment. That popup's modal backdrop (`.ui-widget-overlay`)
stayed on screen the whole time BackOffice was cancelling the transaction
in a separate context, then blocked round 2's own `createFromHome()`
clicking `#home-link` — confirmed live via the exact interception message
(`.ui-widget-overlay intercepts pointer events`), not the `#dialog-
announcement` pattern EC_TS1/EC_TS3 hit. Fixed: `session.confirmDialog(15_000,
'Cancel')` right before round 2 starts, closing round 1's own leftover
popup for real. Any future case that deliberately leaves a Deregistration
attempt's own popup open across an intervening step (a BO action, a lookup)
needs the same explicit close before touching that page again — a
still-open dialog isn't the same failure mode as a stray announcement
banner, even though both show up as a blocked click. NEVER RUN LIVE (this
fix unconfirmed).

**"Extra" renamed to "Extra Coverage," EC_TS1-9 renamed from EX_TS1-9,
2026-09-01.** Every file, project name, dashboard testCase, and doc
reference (this whole section, `playwright.config.ts`, `app/api/
eauto-edereg-precheck/run/route.ts`, `app/eauto/edereg-precheck/page.tsx`,
`lib/ticketStudies.ts`) updated together — no functional change, naming
only.

**EC_TS2 REBUILT the same day, per Faizuddin's own literal steps** —
replacing the original "cancel the popup twice on the SAME still-open Step
2 page" build. New shape: round 1 creates a Deregistration, hits the gate,
and CANCELS the resulting payment popup without paying (unchanged
mechanism, `OtherFunctionsPage.cancelPrecheckPopup()`). Round 2 is now a
GENUINELY NEW Deregistration transaction — `createFromHome()` again (its
own fresh MyKad owner auth), not a re-filled field on the same page — and
this time COMPLETES the pre-check purchase via `resolveVehicleGate()`
instead of cancelling a second time. The actual question this rebuild
answers is closer to the guide's own "come back later" framing than the
original same-page re-trigger was: does a genuinely separate later
Deregistration attempt reuse the SAME abandoned Pending record (1 row,
same transaction ID, now Approved) or create a new one alongside it. Same
open questions as the original build (whether an abandoned popup persists
any row at all) plus a new one: whether `resolveVehicleGate()`'s payment
on round 2 behaves like a first-time purchase or a resume of round 1's own
abandoned attempt — `resolveVehicleGate()` doesn't distinguish the two
itself. NEVER RUN LIVE (this rebuilt form).

**Fifth live attempt, same day — timed out on `#owner-consent`
(Step 2 -> Step 3) after the gate-check itself succeeded.** Gate came back
satisfied, Step 2 submitted cleanly, then `ownerConsentAndAuth()` timed out
waiting for `#owner-consent` with a plain "element never resolved" error —
no dialog-interception detail this time, so UNLIKE the earlier confirmed
banner failures, this one is NOT confirmed to be the same cause. Best
working hypothesis (not yet verified against a screenshot/recording):
Step 2 -> Step 3 is a fresh render that can spawn its own
`#dialog-announcement`, same as every other transition in this file — no
other test in the suite needs a `closeBanners()` call at this exact point,
but none of them do as much prior same-session navigation as EC_TS1 (two
standalone creates, listing lookups) before reaching it, so a stray banner
landing here is more likely for this case specifically. Added
`session.closeBanners()` between `submitVehicleDetails()` and
`ownerConsentAndAuth()`, scoped to EC_TS1's own file only —
`DeregTransactionPage.ts` itself (shared by every other TS) was NOT
touched. **If this still fails the same way, don't assume it's fixed —
check the recording for what's actually on screen before guessing again.**

**EC_TS5 first live run, 2026-09-01 — resume itself CONFIRMED live, then
broke on its own listing re-check navigating away the resumed view.** The
core question worked: decline, "leave and come back" via the listing's
Resubmit link, retry button + Payment History both rendered, same
transaction ID and row count before/after resuming — all confirmed real.
Broke next at `attemptResubmitPayment()`, timing out on `#to-retry-rhb`.
Real cause: `PrecheckEnquiryPage.findTransactionIdByVehicleNo()`/
`countTransactionsForVehicle()` both navigate whichever page
`PrecheckSession.active()` currently considers active — the newest still-open
page in the context (`session.ts`'s own `active()`). Calling them directly
on `precheck` (the SAME page as the resumed retry-mode view) right after
confirming that view rendered correctly carried that exact page away to the
listing — so by the time `attemptResubmitPayment()` tried to click
`#to-retry-rhb`, the page was showing the listing instead, not the payment
view. Fixed the same way EC_TS2 already handles the identical class of
problem: run the "confirm same record" lookup from a SEPARATE tab
(`page.context().newPage()`), so the main page's resumed view is never
disturbed — the tab becomes the session's "active" page only for the
duration of the lookup, then closing it hands "active" back to the main
page automatically. Scoped to EC_TS5's own file. NEVER RUN LIVE (this fix
unconfirmed) — worth remembering as a general rule for this suite: ANY
`PrecheckEnquiryPage` listing lookup navigates the CURRENT active page, so
call it from a throwaway tab whenever the main page's own state (a specific
screen, a specific mode) still matters afterward.

**EC_TS7B added, 2026-09-01, directly implementing the guide's own caveat
on scenario 9** — off the back of EC_TS7's first live run, which confirmed
`companyEmail` genuinely comes back blank on the inline/DEREG-form path
(manually decoded: `HXA115~...~202208153901~~systemtest@eauto.my`, the
double `~~` confirming field 10 is truly empty, not a decode-position bug —
see EC_TS7's own live-run note below). But the guide's own text says: "If
the email is blank, first confirm the AATF company actually has a precheck
email configured before raising it" — EC_TS7 alone can't answer that.
EC_TS7B runs the IDENTICAL check (same decode, same field, same BO JPJ XML
Log lookup) via the STANDALONE "eDereg Pre-Checking Enquiry" flow instead
of the inline one. Two readings: standalone ALSO blank -> this company has
no precheck email configured at all, EC_TS7's blank result isn't a defect
on its own; standalone POPULATED -> proves the company IS configured with
one, so EC_TS7's blank result is a real, path-specific bug worth raising.
No pass/fail verdict on the email itself (diagnostic, not a known-correct-
outcome case) — read its RESULT's `verdict` field alongside EC_TS7's own
output. Simpler build than EC_TS7: the standalone flow's own `done()`
already lands on the Details page directly, no separate
`findTransactionIdByVehicleNo()` + re-navigate needed. NEVER RUN LIVE.

**EC_TS7 first live run, 2026-09-01 — the email genuinely comes back
blank, confirmed by hand, not a decoder bug.** `companyEmail` came back
empty in the automated run; Faizuddin manually pasted the raw Request Data
string and counted the `~`-delimited fields by hand, confirming the
decoder read the right position (field 10, sitting directly between the
double `~~` after `202208153901` and before `systemtest@eauto.my` in field
11/Email CC) — the blank is real, not a parsing mistake. Also worth noting:
field 11 (Email CC) holds `systemtest@eauto.my`, not anything tied to the
actual configured account — a generic-looking system address, not
`inputs.jpjReceiptEmail`. Per the guide's own caveat, this alone isn't
enough to raise as a defect yet — see EC_TS7B above, built specifically to
answer "does this company even have a precheck email configured at all."

**Both EC_TS7 and EC_TS7B removed 2026-09-01, per Faizuddin.** The
confirmed-blank finding above (real, hand-verified, not a decoder bug) and
the still-open "does this company have a precheck email configured"
question are NOT resolved — they're just no longer tracked by automation
in this suite. If this needs picking back up later, the raw Request Data
decode logic (`utils/jpjXmlLogDecode.ts`'s `decodePrecheckRequestData()`,
field 10 of 11) and the reasoning above are still there to build from.

## 33. CPC_E2E_TS2 — Vehicle No. field does NOT clear on the reused-VN
inline retry, and page-load timing fixed everywhere in this suite

> **⚠️ SUPERSEDED IN PART BY §40 (2026-09-04).** Everything below about the
> reshow was observed on **VEL000100E**, which Faizuddin has since confirmed
> is the ONE code that ALLOWS a repurchase (new precheck transaction each
> time, repeatable). So step 3's ruling — "`closed-direct` for this setup is
> correct, not a bug" — does not hold for VEL000100E, and TS2's assertion has
> been changed accordingly. The reshow rule itself still stands for other
> failed codes (§37 confirmed it on VEL000045E). Read §40 before acting on
> anything in this section. **EAINT-12268, raised and then corrected during
> the events below, is now closed for good — see §41; treat every mention of
> it here as history, not an open item.**

**Two separate findings from CPC_E2E_TS2 live runs, 2026-09-02:**

**(a) What "not satisfied" looks like at Step 2 depends on WHY it's not
satisfied — two different, both-correct dialog shapes, sorted out over
several passes on 2026-09-02 (kept here so the false starts aren't
repeated):**

1. First pass: found the Vehicle No. field stays filled (not blank) on
   CPC_E2E_TS2's reused-VN setup, on two vehicle numbers (HXA122, HXA123),
   even after ruling out a timing race with a settle-wait. Assumed this was
   a bug because it differed from Faizuddin's manual repro on a BRAND-NEW
   vehicle no., which gets a full Cancel/Next payment popup then a
   Close-only result, field clearing after.
2. Second pass: re-checked against SRD V1.1 §2.3.2.1 (the section V1.1's
   own changelog says it updated — a first attempt at this had wrongly
   assumed that changelog note meant a different section and cited V1.0's
   Scenario 2/3 instead; **always read the CURRENT SRD version in full
   before citing it, never assume a changelog note is about something
   else**). Found NEW Scenario 4 ("Done eDereg Pre-Checking (Payment
   Successful) & JPJ Enquiry Failed") and read it as saying the reused-VN
   case should STILL get a fresh payment popup on the first Step 2 entry.
   Raised **EAINT-12268** on this reading.
3. **CORRECTED a third time, by Faizuddin directly, overriding the SRD-literal
   reading above:** when a vehicle ALREADY has a Failed pre-check on file,
   re-entering it at Step 2 should just PULL UP and DISPLAY that existing
   failed result — a plain reshow, nothing more. Close just closes the
   popup and returns to Step 2; no new payment attempt is expected, and the
   Vehicle No. field's state afterward is not a pass/fail condition. So
   `dialogShape: 'closed-direct'` (a single result-only dialog, "Close"
   only, no payment step) for this setup **is correct, not a bug** — the
   'paid' shape (full Cancel/Next payment popup) belongs to a genuinely
   first-time check, i.e. a vehicle with NO prior pre-check on file at all.
   **EAINT-12268 corrected by Faizuddin manually** to match.

**Automation's pass/fail expectation now matches this corrected
understanding.** `VehicleGateResult` (`DeregTransactionPage.resolveVehicleGate()`)
reports `dialogShape: 'paid' | 'closed-direct'` plus `vehicleFieldBlank`
(logged for reference only, not asserted) on both branches.
`edereg-precheck-vehicle-not-exist.spec.ts`'s (CPC_E2E_TS2) own SUCCESS
condition requires `gate.satisfied === false && gate.dialogShape ===
'closed-direct'` — confirmed live 2026-09-02 on a third vehicle no.
(HXA131): the app consistently shows `closed-direct`, and per step 3 above
that's the correct/expected result, so this test should now report
SUCCESS, not FAIL. If a future run needs the OTHER shape (a genuinely
fresh, never-checked vehicle no.), assert `dialogShape === 'paid'` instead
— see `CPC_E2E_TS8` / `step2-first-vehicle-not-exist.spec.ts` for that
setup, which correctly expects 'paid' (a real first-ever check, nothing to
reshow yet).

**Extended to TS8 and TS9, per Faizuddin directly: the reshow rule applies
to ANY prior Failed pre-check, not just a standalone one — including one
created via the SAME inline "pre-check done in step 2" entry point TS8/TS9
themselves use.** This has different consequences for each:

- **CPC_E2E_TS8** (`step2-first-vehicle-not-exist.spec.ts`) only ever makes
  ONE `resolveVehicleGate()` call on a vehicle with NO prior pre-check at
  all — nothing to reshow yet on that single call, so `dialogShape: 'paid'`
  stays correct. Only change: tidied to hold 3s after Close before ending,
  matching TS2's pattern, and the SUCCESS condition now explicitly asserts
  `dialogShape === 'paid'`.
- **CPC_E2E_TS9** (`step2-first-retry-approved.spec.ts`) — **fully
  rewritten**, its original premise no longer holds. It used to re-enter the
  SAME vehicle no. a second time after re-steering eSIM to Approved,
  expecting a fresh payment popup that succeeds this time. Now understood:
  the second entry ALSO just reshows the FIRST attempt's stale Failed
  result (`dialogShape: 'closed-direct'`) — re-steering eSIM beforehand
  does not change this, since no fresh JPJ check actually runs on a reshow.
  So this scenario can no longer reach Approved / a real Deregistration via
  this mechanism. Rewritten to demonstrate the reshow-only behavior
  deliberately: re-steer to Approved BEFORE the second entry specifically to
  prove the reshow ignores the underlying eSIM code, then end there (no
  Deregistration continuation, since it's now unreachable). Title changed
  too ("Failed then re-entry reshows the same result") — this suite selects
  tests by Playwright `--project`, not `--grep` on the title, so the rename
  needed no route/config changes, only the dashboard's own label text in
  `app/eauto/edereg-precheck/page.tsx` (updated to match). NEVER RUN LIVE in
  this corrected form.

**(b) Root cause of an earlier confusing symptom (a different popup message
than the same manual action) found: filling `#vehicleRegNo` immediately
after `domcontentloaded`, before the page's own gate-check JS finished
settling.** Generalized into a repo-wide rule —
`knowledge/automation-playbook.md` § "Page-load timing" — and a new
`PrecheckSession.waitForPageSettled()` helper (waits for load, then an
extra 2s) now gates `fillVehicleRegNoAndCheckGate()`. Also applied to
`JpjXmlLogPage.open()`, since Faizuddin separately observed that page
switching into "DEREG Transaction Enquiry" after typing a vehicle no. on
the eDereg Pre-Checking log — a plausible symptom of the same class of bug
(acting before the page's own client-side setup, i.e. which log type it's
showing, has settled). NOT yet confirmed live in this fixed form.

**(c) Still open, not investigated this round**: the JPJ XML Log check
itself (`runJpjXmlLogChecklist`) still finds 0 rows for the precheck ref no.
even though the precheck transaction genuinely persisted (Details page
shows it, 2 payment rows). Whether the page-load-timing fix above resolves
this, or whether there's a separate cause, needs a live re-run to tell.

## 34. CPC_E2E_TS3 renumbered — the old "RHB API Down" build was never TS3;
the real TS3 is a JPJ-error-code case, built fresh 2026-09-02

Faizuddin pasted the CURRENT literal test-plan text for CPC_E2E_TS3: "Create
eDereg Pre-Checking Enquiry with Trx Status = Failed, Enquiry Response =
VEL000045E > Create Deregistration Trx using MyKad > At step 2 ensure error
message shown properly > Click [Close] > Observe Vehicle No. field and error
message is shown > Ensure Step Page, Transaction Listing, JPJ XML Log and
Details Page showing correctly." This does NOT match what was built under
"CPC_E2E_TS3" since 2026-08-27 (`edereg-precheck-rhb-api-down.spec.ts`,
"RHB API Down", RHB Transfer code "ER") — confirmed with Faizuddin directly:
**TS3's real definition changed / was always this**, and the RHB-API-Down
build was simply never actually TS3.

**RHB-API-Down build renumbered to "TS number TBD"** per Faizuddin (don't
guess a replacement number) — title, dashboard label
(`app/eauto/edereg-precheck/page.tsx`), and RESULT `tsNo` field all updated
to drop the "TS3" claim, code/behavior otherwise untouched. Still a real,
useful scenario, just parked without a confirmed number.

**Real CPC_E2E_TS3 built fresh**: `edereg-precheck-ts3-jpj-error.spec.ts`,
Playwright project `edereg-precheck-ts3`, dashboard testCase `ts3`. Same
shape as CPC_E2E_TS2 (`edereg-precheck-vehicle-not-exist.spec.ts`) —
standalone precheck fails, Deregistration created, re-entering the SAME
vehicle no. at Step 2 pulls up the existing Failed result (reshow only,
`dialogShape: 'closed-direct'`), Close, scenario ends — substituting
VEL000045E for VEL000100E (`ensureEsimJpjErrorPath`, not
`ensureEsimVehicleNotExistPath`) and MyKad for MyPR category. UNLIKE TS2
(which dropped all further checks per Faizuddin's own instruction), this
TS3's own literal steps explicitly ask for more, so kept: the standalone
precheck's own Details Page (`verifyDetailsPage()`), the eDereg
Pre-Checking Transaction Listing (`getListingStatusForVehicle()`), and the
BO JPJ XML Log search (`runJpjXmlLogChecklist()`) — same pieces TS2
originally had before being scoped down. Also added a best-effort read of
`#precheck-result`'s own text after Close (`gateMessageAfterClose`,
NOT hard-asserted) for "observe... error message is shown" — no dedicated
"remark under the field" selector has ever been captured live, so nothing
more specific is guessed; if a real HTML capture turns up a distinct
element for that remark, tighten this to read it directly instead.
"Step Page" from the literal steps is the Deregistration Step 2 page
itself, implicitly covered by `resolveVehicleGate()` running on it — no
separate check added for it.

NEVER RUN LIVE. Typecheck clean (spec, playwright.config.ts, page.tsx,
run/route.ts).

## 35. MU_TS5 first live run FAILED — same reshow-vs-redo root cause as
CPC_E2E_TS9, fixed the same way

> **⚠️ SUSPECT — see §40 (2026-09-04).** This test steers **VEL000100E**, the
> one code now confirmed to ALLOW a repurchase, yet it observed and now
> asserts the reshow. Deliberately NOT rewritten yet: confirm the mechanism
> with a live CPC_E2E_TS2 run first, then flip this and MU_TS6 together.

MU_TS5's "User A redo -> Approved" step threw live, 2026-09-02:
`attemptA2.satisfied` stayed `false` after re-steering eSIM to Approved and
re-entering the same vehicle no. on User A's own still-open Step 2 form —
the progress log showed `dereg-step2-inline-precheck-closed: "Vehicle No.
field blank after Close: false"`, the message only the `closed-direct`
(reshow) branch of `resolveVehicleGate()` logs, confirming it reshowed the
FIRST attempt's stale Failed result instead of running a fresh check. Same
root cause as CPC_E2E_TS9's own correction (§33/§34): once a vehicle has a
Failed pre-check on file, re-entering it on the same still-open form always
reshows the stale result, regardless of eSIM re-steering — Approved is
unreachable this way.

**This broke the test's actual premise**, not just one assertion — MU_TS5
was built to prove "does User A's now-Approved state leak to User C"
(different-company isolation), but User A can never reach Approved via
this redo mechanism, so that specific leak can't be exercised at all.
**Redefined what "isolation" means for this test**: both User A's and
User C's redos should each reshow their OWN stale Failed result
(`dialogShape: 'closed-direct'`, satisfied: false) even after eSIM is
re-steered — proving the reshow is scoped per-company (User C's redo
doesn't show User A's data) and independent of the underlying eSIM code,
not proving Approved-state isolation anymore. Both throw conditions and the
RESULT status now assert `dialogShape === 'closed-direct'` for both redos
instead of `attemptA2.satisfied === true`. eSIM re-steer calls kept
unchanged (still useful evidence the reshow ignores the code either way).
Typecheck clean. NOT yet re-run live in this corrected form.

**MU_TS6 checked — same root cause, BIGGER implication.** See §36 below.

## 36. MU_TS6 first live run FAILED — confirms the Failed-precheck reshow is
COMPANY-scoped, not draft/session-scoped; premise fully rewritten

> **⚠️ SUSPECT — see §40 (2026-09-04).** Also **VEL000100E**. Note the irony:
> the ORIGINAL premise abandoned below (User B is offered a real purchase of
> their own) is what the new repurchase rule would RESTORE. Deliberately NOT
> rewritten a third time on inference — confirm with a live CPC_E2E_TS2 run
> first. The company-scoping half of the finding is independent of this and
> may well still hold.

MU_TS6's own live run threw inside `fillVehicleDetails()` at User B's Step
2: `gate.satisfied` was `false` after User B's OWN brand-new Deregistration
(separate login, separate browser context, never touched this vehicle no.
before) entered the SAME vehicle no. User A had just failed on. The
progress log showed the same `closed-direct` tell (`"Vehicle No. field
blank after Close: false"`) — meaning User B, on a genuinely first-ever
visit to their own Step 2 form, ALSO just got the reshow of User A's stale
Failed result instead of being offered a fresh purchase.

**This generalizes TS9/MU_TS5's finding**: the Failed-precheck reshow isn't
scoped to "the same still-open form being re-entered" — it's scoped to the
**vehicle + company**, full stop. ANY session under the same company hits
the reshow the moment that vehicle has a Failed record on file, even a
session that's never seen that form before. Confirmed by asking first
(`AskUserQuestion`) before rewriting, given how much bigger this implication
is than TS9/MU_TS5's own fix.

**MU_TS6 fully rewritten** — its old premise ("User B's own fresh attempt
supersedes User A's Failed record with a completed Deregistration") is now
provably unreachable: User B can never get past the reshow to make a real
payment, so a completed Deregistration is impossible through this flow.
Redefined what the test proves: that the reshow applies across DIFFERENT
users/sessions, not just re-entry on one form. User A's first attempt still
expects the full payment popup (`dialogShape: 'paid'`, genuinely first-ever
check for this vehicle); User B's own separate-session first entry now
expects `dialogShape: 'closed-direct'` (the reshow) instead of a fresh
purchase; the Pre-Checking listing check flipped from expecting the record
to change to OK, to expecting it STAYS exactly 1 row, still Failed — nothing
superseded it. Dropped: User B's `ownerConsentAndAuth`/`aatfConsentAndAuth`/
`jpjCheck`/`payAndDeregister`/`runPostDeregSrdChecklist()` calls, all
unreachable now that the gate never gets satisfied. Test title, file header,
and dashboard label (`app/eauto/edereg-precheck/page.tsx`) all updated to
drop the "superseded by a completed one" framing. Typecheck clean. NEVER RUN
LIVE in this corrected form.

**Worth a broader sweep now**: any OTHER test in this suite that assumes a
Failed precheck can be superseded/resolved by a LATER attempt — same
company, same OR different session — should be treated as suspect until
checked against this now-confirmed company-scoped reshow rule. Not audited
this round; check case-by-case as each is next run live, same as TS9/
MU_TS5/MU_TS6 were.

## 37. CPC_E2E_TS11 Part 2 first live run FAILED — the reshow rule claims its
fourth test, exactly as §36 predicted; premise redefined the same way

CPC_E2E_TS11 Part 2's first-ever live run threw, 2026-09-03 (uat1, prefix
HX): `Expected the retry to come back Approved (GLB000000I) — got
satisfied=false (undefined / undefined)`.

**The first attempt was perfect** and is worth keeping as positive
evidence: on the now-EXPIRED pre-check Part 1 created, the gate offered a
genuinely fresh purchase (`dialogShape: 'paid'`, full payment round trip),
which came back `Failed / VEL000045E - PLEASE CONTACT HELPDESK - VELVE`,
Vehicle No. field blank after Close. **An EXPIRED record does not trigger
the reshow — only a FAILED one does.** That distinction is why
CPC_E2E_TS10 Part 2 remains valid (it never fails a first attempt, so no
Failed record ever exists) while this one did not.

**The second attempt hit the reshow.** After `ensureEsimHappyPath()`
re-steered Dereg Precheck to GLB000000I, the re-entry returned
`satisfied=false` with `jpjStatus`/`responseDesc` both `undefined` and
logged `dereg-step2-inline-precheck-closed: "Vehicle No. field blank after
Close: false"` — the message ONLY `resolveVehicleGate()`'s `closed-direct`
branch emits, and the `undefined` fields are that branch's own tell (it
never reads `#jpjStatusLabel`/`#responseDesc` at all). Same root cause as
§33 (CPC_E2E_TS9), §35 (MU_TS5) and §36 (MU_TS6): once a vehicle has a
Failed pre-check on file, re-entry only reshows it, and eSIM re-steering
changes nothing because no fresh JPJ check runs.

**Why this file was stale:** it was written 2026-08-27, FIVE DAYS before
the reshow rule was discovered (2026-09-02), and was deliberately modelled
on CPC_E2E_TS9's then-current "resolveVehicleGate() twice, re-steer
between attempts" retry pattern — the very pattern TS9 was itself rewritten
to abandon. §36's closing note ("any OTHER test in this suite that assumes
a Failed precheck can be superseded/resolved by a LATER attempt should be
treated as suspect until checked") called this exactly.

**Redefined per Faizuddin, 2026-09-03** — same fix as TS9/MU_TS5/MU_TS6.
The test now asserts the reshow instead of the unreachable recovery:
`firstAttempt` must be `satisfied: false` + `dialogShape: 'paid'`, and
`secondAttempt` must be `satisfied: false` + `dialogShape: 'closed-direct'`,
with both shapes now hard-checked (the old build checked neither, which is
why the failure surfaced as a confusing `undefined / undefined` rather than
a clear "it reshowed"). Dropped as unreachable from a VEL000045E first
attempt: `submitVehicleDetails`, `ownerConsentAndAuth`,
`aatfConsentAndAuth`, `jpjCheck`, `payAndDeregister`, and
`runPostDeregSrdChecklist()` (all 4 of its items need a completed
Deregistration on screen). Test title updated to "JPJ-error then re-entry
reshows the same result"; no dashboard label change was needed, since Part 2
options are generated dynamically as `{tsNo} — Part 2` rather than listed
statically in `TEST_CASES`.

**Kept, but NOT asserted:** the plan's "Ensure details in eDereg
Pre-Checking Listing are displayed correctly" step, read via
`getListingStatusForVehicle()` at the very END of the run and reported
only. Two reasons it's last and soft: reading it between the two attempts
would navigate away from the still-open Step 2 form and lose it, and no
expected row shape for this setup has ever been confirmed live — asserting
a guessed one would repeat the mistake this rewrite exists to fix.

**Test-plan conflict, deliberately NOT raised as a bug.** TS11's literal
plan text still says "Set eSim Dereg Enq. Response = GLB000000I > Continue
with eDereg Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK > Go
to Details Page > Ensure Yes hyperlink is displayed and click it". Per the
§33 step-3 ruling (Faizuddin, overriding an SRD-literal reading, after
which EAINT-12268 was manually corrected), the reshow is CORRECT app
behaviour — so that plan step is simply unachievable, not a defect.
Faizuddin chose "redefine the test" over "raise a QA issue" when asked,
2026-09-03. If the team later wants that coverage back, it needs a plan
change, not a script change.

Typecheck clean. NOT yet re-run live in this corrected form.

**Still unaudited against the reshow rule** (§36's sweep remains
outstanding): CPC_E2E_TS4/TS5/TS6 Part 2 and CPC_E2E_TS12 Part 2 all
involve a Failed/declined first attempt followed by further action on the
same vehicle. TS12 Part 2 is the least likely to be affected — it expects
its single declined payment to end Cancelled rather than expecting any
later attempt to succeed — but none have been checked case-by-case.

## 38. SRD V1.1 §2.3.2.1, read in full 2026-09-04: repurchase on re-entry
depends on WHERE the prior attempt failed — payment vs JPJ enquiry

`SRD_EAINT-9306_..._V1.1_20260901.pdf`, section 2.3.2.1, pages 13-18, gives
this literally and self-consistently once read start to finish — the whole
document, not just the changelog's "Scenario 4" pointer (§33's own first
pass made that mistake). It describes THREE distinct failure shapes at
Deregistration Step 2, each with its own "if user enters the same vehicle
number again" note:

- **Scenario 2/3 — no eDereg Pre-Checking on file yet, or payment itself
  failed** (pages 13-15): popup runs Step 1 (vehicle/payment details) → Step
  2 (Payment) → Step 3 (Result). If Step 3 comes back Failed, Close clears
  the Vehicle No. field and blocks Step 3. **Note: "If user enter the same
  vehicle number again, process will be repeated from #1"** — i.e. the FULL
  popup restarts, including a genuinely fresh payment attempt. This is a
  real repurchase.
- **Scenario 4 — payment already succeeded, but the JPJ enquiry itself came
  back Failed** (pages 16-18, new in v1.1, blue-highlighted): popup runs
  Step 1 → Step 2 (Payment, Successful this time) → Step 3 (Result, JPJ
  Enquiry). If the JPJ status is Failed, Close clears the Vehicle No. field,
  blocks Step 3, and shows a remark under the field ("Your eDereg
  Pre-Checking is unsuccessful. Kindly contact our Customer Service at
  03-27798899"). **Note: "If user enters the same vehicle number again: The
  eDereg Pre-Checking Enquiry popup will be shown again, displaying the SAME
  JPJ Pre-Checking Status = Failed result."** No new payment, no fresh JPJ
  check — a plain reshow. **No repurchase in this case.**

**This is exactly the app's live "reshow rule"** (§33-§37: once a vehicle
has a Failed pre-check on file, re-entry only reshows the stale result,
company-scoped, eSIM re-steering doesn't matter) — for the specific case
where the failure was a JPJ-enquiry Failed, not a declined payment. §33's
first pass misread Scenario 4 as promising a fresh payment popup on re-entry
(the reading behind the now-corrected EAINT-12268); reading the full section
shows the SRD was already internally consistent with what the app actually
does, and Faizuddin's override in §33 was correct on both the app AND (once
read properly) the SRD text itself.

**⚠️ AMENDED BY §40 (2026-09-04): the SRD's Scenario 4 has an undocumented
per-code exception.** `VEL000100E` IS a JPJ-enquiry failure, and therefore
falls under Scenario 4 as written — but Faizuddin has confirmed it is the one
code that DOES allow a repurchase, creating a new precheck transaction each
time. The SRD text draws no such distinction, so on this point the SRD looks
incomplete rather than the app wrong. Read §40 alongside the answer below.

**Practical answer**: "pre-check failed at Deregistration Step 2, same
vehicle number entered again — can the user repurchase?" is **YES if
the failure was on the PAYMENT leg** (Scenario 2/3 — restarts the full
popup from #1; the dev's own QA guide refines this to "the SAME precheck
resumed in retry mode with its Payment History", not a new record);
**YES if the JPJ enquiry failed with `VEL000100E`** (per §40 — and unlike the
payment case it creates a NEW precheck transaction each time, repeatably);
**NO for any other JPJ-enquiry failure** (Scenario 4 — reshows the same stale
Failed result, no fresh check, no new payment; confirmed on VEL000045E). All of this ticket's automation (CPC_E2E_TS2/TS3/TS9,
MU_TS5/TS6, CPC_E2E_TS11 Part 2) exercises the JPJ-Enquiry-Failed shape
(VEL0000xxE codes), i.e. Scenario 4 — none of it has yet exercised a genuine
Scenario 2/3 payment-decline-then-repurchase case at this specific gate.

## 39. JPJ Code Checker — the result-dialog shape, and the sweep that
catalogues which code produces which Note

Built 2026-09-04, per Faizuddin. **Not a test case** — a data-gathering
sweep. The question it answers: the eDereg Pre-Checking Enquiry result popup
ends with a `Note:` line whose wording (and colour) varies by JPJ response
code, and nobody has the mapping across the ~100 codes.

**The result dialog, from two live captures made the same day** (the first
captures for this ticket saved under the repo's own HTML rule, both under
`_reference/tickets/EAINT-9306/`):

| | `...-dereg-01-...-VEL000045E.html` | `...-dereg-02-...-VEL000100E.html` |
|---|---|---|
| Enquiry Response | `VEL000045E - PLEASE CONTACT HELPDESK - VELVE` | `VEL000100E - VEHICLE RECORD NOT EXIST` |
| `#vehicleRecord` | `N/A` (class `value black`) | `Not Exist` (class `value red fw-700`) |
| Per-attribute rows | **absent entirely** | **all 9 present** |
| Note | "The system is currently unavailable. Kindly contact our Customer Service at 03-27798899" | "Unable to proceed for eDereg" |
| Note colour | `<span class="fw-700 black">` | `<span class="fw-700 red">` |

Both share: container `#payment-result > #result-content > #result-container`,
dialog title "eDereg Pre-Checking Enquiry", a single `Close` button,
`#jpjStatusLabel` (hidden input, value `Failed`/`OK`), `#responseVehicleNo`,
and a `Valid As At` cell whose id is literally `value`. The 9 attribute rows
when present: `#vehicleStatus`, `#verifiedStatus`, `#usageCode`,
`#jpjBlacklist`, `#jsjBlacklist`, `#agencyBlacklist`, `#claimOwnership`,
`#vehicleInInvestigation`, `#vehicleCondition`.

**Two selector traps, both real in this markup:**
- **`#responseDesc` is a DUPLICATE id** — it is on BOTH the "JPJ Pre-Checking
  Status" cell and the "Enquiry Response" cell. `resolveVehicleGate()`
  already relies on `.last()` meaning Enquiry Response. The probe reads all
  matches positionally instead, so a code that omits the status row still
  yields the right Enquiry Response.
- **The Note `<span>` has no id.** Target it structurally as
  `#result-container td.center.value span.fw-700`. Do NOT loosen this to a
  bare `.fw-700` — `#vehicleRecord` carries that class too (on the `<td>`,
  in the VEL000100E shape), and a bare match would read "Not Exist" as the note.

**What was built** (all additive; `DeregTransactionPage` deliberately
untouched, per `dont-touch-working-automation` — its `resolveVehicleGate()`
reads only 2 fields and reads *nothing* on the reshow branch, so it cannot
serve this purpose without being changed):
- `utils/jpjCodeProbe.ts` — `readPrecheckResultDialog()` scrapes the whole
  dialog (status, both response cells, vehicle record, every attribute row,
  the note **and its colour class**, plus the raw table text as a safety
  net); `probeJpjCode()` drives one code end to end and never throws for an
  app-level outcome, recording `outcome: 'read' | 'reshow' | 'gate-open' |
  'no-dialog' | 'error'` instead so one odd code can't abort the sweep. Its
  interaction sequence copies `resolveVehicleGate()`'s proven one verbatim
  (`withNativeConfirm` → topmost visible `.ui-dialog` → Close-only vs Next →
  `#payment-result:visible`). It also takes a **PNG proof shot of the whole
  dialog** (`.ui-dialog`, not just `#payment-result`, so the title bar is in
  frame) before clicking Close, into `jpj-code-screenshots/<CODE>.png` —
  best-effort, so a failed screenshot never costs the row its scraped data.
- `tests/edereg-precheck-jpj-code-checker.spec.ts` — creates **one**
  Deregistration, MyKad-auths the owner, holds at Step 2 for the whole
  sweep, and never completes the Deregistration. Per code: steer eSIM, type
  the next running vehicle number, pay, scrape, Close.
- Project `edereg-precheck-jpj-codes` (`video: 'off'` — a multi-hour run
  would otherwise produce an enormous recording of no evidential value; the
  deliverable is the table).
- Dashboard tab "JPJ Code Checker" (`app/eauto/edereg-precheck/JpjCodeCheckerTab.tsx`),
  code list pasted from Excel into a textarea, results shown grouped by note
  plus a "Copy for Excel" TSV button. Uses the shared background-run store,
  not a page-owned fetch, since the sweep outlives any one page view.
- Route reuse: one more `PROJECTS` entry (`"jpj-codes"`) plus `DPC_JPJ_CODES`
  / `DPC_JPJ_FRESH`. Its own 4-hour kill timer, so every other case keeps the
  40-minute cap it has today.

**Design points that are NOT arbitrary:**
1. **A fresh vehicle number per code is mandatory.** The §33/§35/§36/§37
   reshow rule means a reused number silently reports the FIRST code's note
   for every code after it. The running series (`HXZ0001`, `HXZ0002`, …) is
   what makes each probe a genuine first-ever check. The probe flags a
   Close-only dialog as `outcome: 'reshow'` rather than banking a false row.
2. **The whole series must keep ONE eSIM prefix.** eSIM keys by the first two
   characters (`vehiclePrefix()`), so `HXZ0001…HXZ0100` all steer the single
   `HX` record — that record is what gets rewritten each iteration. Both the
   UI and the spec refuse a start value whose series would cross a boundary.
3. **RHB Transfer is set to OK once, not per code.** A declined payment means
   no JPJ enquiry runs at all and there is no result dialog to read.
4. **Rows flush to `jpj-code-results.json` after every code**, and a re-run
   skips codes already recorded as `read` (retrying reshow/error rows). The
   route reads that file back regardless of how the run ended, so Stop and
   timeout both still return a partial table.
5. **IT MUST NEVER FAIL — explicit instruction from Faizuddin, 2026-09-04,
   and the reason this file has no assertions at all.** A checker has no
   expected result, so there is nothing to assert: an unfamiliar note, a
   brand-new note nobody has catalogued, a blank note, or a code that behaves
   unlike every other code IS the answer, not an error, and none of it may
   interrupt the sweep or discard a row. Concretely: the spec body is wrapped
   in try/finally so the `RESULT:` line is emitted no matter what; `status`
   is `COMPLETE` or `STOPPED_EARLY`, never `FAIL`; a single code's problem is
   banked as a row and the loop continues; three probe failures in a row
   trigger a **self-heal** (rebuild the Deregistration draft via
   `openStep2()`, up to 3 times) rather than an abort, since that pattern
   means a broken session rather than a surprising note; and eSIM writes get
   two attempts each. The ONLY early exit is infrastructure being genuinely
   unreachable (VPN gone, or the draft unrebuildable) — and that exits
   gracefully with every row kept and the test still passing.
   **Do not add assertions here.** If a scenario ever needs a pass/fail
   expectation, it belongs in its own spec.
6. **Screenshots are the deliverable's evidence half.** `GET
   /api/eauto-edereg-precheck/jpj-codes/download` returns a zip of every PNG
   plus a `summary.csv` index (code → note → colour → file); the same route
   with `?file=<name>.png` serves one shot, which is how the dashboard shows
   inline thumbnails. They live in the SCRIPT folder, not `public/`, for two
   reasons: they must survive between resumed batches, and `publishVideos()`
   wipes its own public artefact folder at the end of every run.
7. **Two copy buttons, deliberately.** "Copy 2 columns" (error code + note,
   sorted by code, `read` rows only) is the one for sharing — a Teams message
   or a lookup table wants exactly those two fields. "Copy all columns" keeps
   the full nine-column export for analysis. Both are TSV so they paste into
   Excel as columns.

### FIRST LIVE RUN — 72 codes, uat1, 2026-09-04 [verified: dashboard sweep, 72/72 read, 72/72 screenshots]

**Result: only 2 of 72 codes produce a specific note. The other 70 all share
one generic message.**

| Note | Colour | Codes | Attribute rows |
|---|---|---|---|
| "The system is currently unavailable. Kindly contact our Customer Service at 03-27798899" | black | **70** — every code tested except the two below | **absent** |
| "Unable to proceed for eDereg" | red | 1 — `VEL000100E` (VEHICLE RECORD NOT EXIST) | present |
| "Able to proceed for eDereg" | *neither red nor black* | 1 — `GLB000000I` (TRANSACTION SUCCESSFUL) | present |

The 70 generic codes span every family: `ENF000008E/9E/12E/13E`,
`GLB0000{01,02,03,05,06,07,30,33,45,47,48,53,55,56}E`,
`GLB000{223,224,225,228,436,451,452,453,454,480,481,509,510}E`,
`REF000{006,007,009}E`, `REV000{001,017,019,020,022,023,024,048,049}E`,
`VEL000{001,006,007,008,009,010,014,015,016,044,045,050,051,066,083,084,
102,103,120,165,166,200,403,404,546,547,548}E`. Full rows (and the note
verbatim per code) in `jpj-code-results.json`; PNG per code in
`jpj-code-screenshots/`.

**Worth raising with the team**: the popup only gives a meaningful message
for the success case and for "vehicle record not exist". All 70 other JPJ
error codes — including genuine data problems like blacklists, ownership
claims and refund/enforcement errors — are collapsed into the same "system is
currently unavailable, call Customer Service" text, which misdescribes the
cause to the AATF user. Not raised as a defect yet; it is a product/UX
decision, not a spec violation (nothing in SRD V1.1 §2.3.2.1 defines
per-code note wording).

**Third note was a discovery.** "Able to proceed for eDereg" (`GLB000000I`)
was not one of the two shapes the reference captures established — direct
vindication of the no-assertions rule in point 5: a build that asserted
"note must be one of the two known values" would have reported a false
failure on the success code.

**Known small gap**: `GLB000000I`'s note colour recorded as empty, because
`readPrecheckResultDialog()` only tests for `red` and `black` classes. It is
presumably `green`. The screenshot has the truth; the recorded field does
not. One-line fix to the colour branch whenever it next matters.

**CONFIRMED LIVE 2026-09-04 — see the first-run result below.** Both of the
open unknowns resolved themselves in that run: (a) the app DOES allow ~72
successive inline pre-checks on ONE still-open Deregistration draft — the
self-heal in point 5 never had to fire; (b) an OK code (`GLB000000I`) in the
middle of the sweep did NOT interfere with the codes after it. The remaining
note: (c) whether an OK code leaves the gate green
in a way that interferes with the next code's probe (it shouldn't — a new,
never-checked vehicle number re-opens the gate — but it is unverified);
(c) there is still **no master list of the ~100 codes anywhere in the repo**
— eSIM's Response Code is a free-text input, not a dropdown, so the list is
pasted in by hand each sweep.

## 40. VEL000100E IS THE REPURCHASE EXCEPTION — the reshow rule is
per-code, not universal [per Faizuddin, 2026-09-04]

**The rule, as given:**

- **`VEL000100E` (VEHICLE RECORD NOT EXIST) is the ONLY code that allows a
  repurchase.**
- A repurchase **creates a brand-new eDereg Pre-Checking transaction** — it
  does not reuse, resume or mutate the failed one.
- **Each repurchase = one new precheck transaction**, so the Pre-Checking
  listing for that vehicle grows by one row every time.
- It is **repeatable without limit**: as long as the steered code stays
  `VEL000100E`, the user can repurchase again and again.

**This narrows §33/§35/§36/§37's reshow rule rather than replacing it.** The
corrected statement of the rule is:

> Once a vehicle has a FAILED pre-check on file, re-entering it at Step 2
> only reshows that stale result and no fresh JPJ enquiry runs — **except
> when the failure was `VEL000100E`, which instead offers a fresh purchase
> and creates a new precheck transaction each time.**

§37's own evidence already showed the rule was narrower than first written
(an EXPIRED record does not trigger the reshow, only a FAILED one does).
This is the same kind of narrowing, one level deeper: not every Failed
record behaves alike — the response code matters.

**⚠️ UNRESOLVED CONFLICT WITH LIVE OBSERVATIONS — do not silently discard
this.** Three tests recorded `dialogShape: 'closed-direct'` (the reshow, no
payment popup) on runs that were steered to **VEL000100E**, which is exactly
the code that should have offered a repurchase:

| § | Test | Code | Observed |
|---|---|---|---|
| §33 | CPC_E2E_TS2 | VEL000100E | `closed-direct` on HXA122, HXA123, HXA131 |
| §35 | MU_TS5 | VEL000100E | `closed-direct` on User A's redo |
| §36 | MU_TS6 | VEL000100E | `closed-direct` on User B's first-ever entry |

§37 (CPC_E2E_TS11 Part 2) also saw the reshow but used **VEL000045E**, so it
is consistent with the new rule and unaffected.

**Most plausible reconciliation, NOT yet verified:** the automation may have
stopped one step too early. `resolveVehicleGate()` takes its
`closed-direct` branch the moment a **Close** button exists on the dialog,
clicks Close, and returns. If the repurchase flow shows the previous failed
result FIRST (Close-only), clears the Vehicle No. field, and only offers a
fresh payment popup when the number is entered *again*, then every one of
those three tests would have recorded the reshow and never discovered the
repurchase — none of them re-entered the number a third time. That would
make both facts true simultaneously. The alternative is that a fix landed
between 2026-09-02 and now.

`utils/repurchaseProbe.ts` is deliberately written to distinguish these two
without assuming either: it re-enters the same vehicle number over several
rounds and records what each round produced, so the first live run answers
the question instead of a guess doing it.

**Consequences to settle once a live run confirms the mechanism:**
1. **EAINT-12268 — nothing to settle. Dropped for good, see §41.** It was
   raised on the SRD-literal reading, then corrected to match §33's ruling,
   and is now closed permanently as a miscommunication rather than a defect.
   Do not reopen it on the strength of §40; if VEL000100E's repurchase
   behaviour ever needs a ticket, raise a fresh one.
2. **MU_TS5 (§35) and MU_TS6 (§36) are NOT rewritten yet, on purpose.** Both
   are VEL000100E and both currently assert the reshow, so both are suspect.
   MU_TS6's premise has already been rewritten twice (its original premise —
   "User B's own fresh attempt is offered a real purchase" — is the one the
   new rule would *restore*), so a third rewrite is not worth doing on
   inference. Confirm with a live CPC_E2E_TS2 run first, then flip them in
   one go.
3. **SRD V1.1 §2.3.2.1 Scenario 4** (§38) says a JPJ-enquiry-failed re-entry
   reshows the same result, with no per-code carve-out. `VEL000100E` is a
   JPJ-enquiry failure, so the SRD as written does not describe this
   exception. Worth raising with the BA — the SRD may be incomplete rather
   than the app wrong.

**Automation updated (2026-09-04, NOT yet run live):**
- `utils/repurchaseProbe.ts` — new. `probeRepurchase()` re-enters the vehicle
  number for N rounds, classifying each round as `paid` (fresh purchase
  offered and completed) or `reshow`, and counting Pre-Checking listing rows
  before and after **on a throwaway tab** (`context.newPage()`) so it never
  navigates the still-open Step 2 form away — §35's own bug.
- **CPC_E2E_TS2** (`edereg-precheck-vehicle-not-exist.spec.ts`) — its
  SUCCESS condition changed from `dialogShape === 'closed-direct'` to
  "a repurchase was offered AND each repurchase created a new precheck row".
- **CPC_E2E_TS8** (`edereg-precheck-step2-first-vehicle-not-exist.spec.ts`) —
  keeps its `dialogShape === 'paid'` assertion for the genuinely first-ever
  check (unaffected: nothing to reshow yet), and now continues into the same
  repurchase check afterward.

**Both extended to run to COMPLETION, 2026-09-04 (per Faizuddin, same
session).** Neither test could finish a Deregistration on the repurchase
alone: while eSIM stays on `VEL000100E` every pre-check fails, so the
compulsory gate can never go green no matter how many repurchases happen.
Both now run three phases:

1. Pre-check fails on `VEL000100E`.
2. `probeRepurchase(..., 2)` — two repurchases, each of which must be OFFERED
   and must add its own listing row.
3. `ensureEsimHappyPath()` re-steers to `GLB000000I`, then
   `fillVehicleDetails()` buys ONE final pre-check (that call runs
   `resolveVehicleGate()` internally, so it IS the final purchase) which comes
   back Approved, and the run continues `ownerConsentAndAuth` →
   `aatfConsentAndAuth` → `jpjCheck` → `payAndDeregister` →
   `verifyPrecheckingYesLink` to Done.

Phase 3 is what makes the repurchase right meaningful — the user keeps buying
until they get a result they can proceed on. SUCCESS now requires all three
phases. `dialogShape` from the first re-entry is still only reported, never
asserted (§40's open mechanism question).

Two structural notes for whoever runs these next: the **MyKad emulator and
`DeregTransactionPage` now stay alive for the whole test** rather than being
closed after the gate step — phase 3 needs three more auth round trips, and
closing early stranded them. And **`test.setTimeout` went 9 → 25 minutes** on
both, since each run is now up to five successful payments plus four eSIM
browser spawns; still inside the run route's own 40-minute cap so a hang
fails in the test (with a step list and video) rather than in the route.

Cost note: a TS2 run now makes **up to five real payments** on UAT (standalone
enquiry, the first re-entry, two repurchases, the final Approved purchase) at
RM10.40 each.
- **CPC_E2E_TS6 Part 1** — untouched. It steers VEL000100E but only runs the
  standalone enquiry and never reaches the Step 2 gate, so repurchase does
  not arise.

## 41. NO OPEN QA ISSUES FROM THIS STUDY — every bug ticket raised is
dropped for good [per Faizuddin, 2026-09-04]

**All QA issues raised out of the EAINT-9306 study are closed permanently.
Every one turned out to be miscommunication, not a defect.** That explicitly
includes **EAINT-12268** (the "Step 2 should offer a fresh payment popup on a
reused vehicle number" issue, raised 2026-09-02 on an SRD-literal reading of
V1.1 Scenario 4, then manually corrected, and now dropped).

**Why this section exists rather than a one-line edit:** EAINT-12268 is cited
in six places across this file (§33 twice, §37, §38, §40) plus
`pages/DeregTransactionPage.ts`, because the reasoning around it drove three
test rewrites. Those citations are deliberately left in place as HISTORY —
they explain why the tests look the way they do. This section is the single
authority on its STATUS so a future session reading any of them doesn't
mistake a historical mention for live work.

**How to apply:**
- Do not reopen, chase, or re-raise EAINT-12268. Do not treat any "flagged
  for revisiting" note about it as outstanding.
- Do not infer an open defect from a `FAIL` verdict in this suite. Several
  are deliberate: MU_TS6 (§24) still asserts 1 row and flags the real 2-row
  outcome as FAIL by Faizuddin's own instruction; §37's TS11 plan step is
  unachievable-by-design rather than broken.
- Findings recorded here that were never raised as tickets stay unraised
  unless Faizuddin says otherwise — notably §39's result that 70 of 72 JPJ
  codes collapse into the same "system is currently unavailable" note, and
  §40's observation that SRD V1.1 Scenario 4 documents no per-code
  repurchase exception. Both are product/BA conversations, not defects.
- If VEL000100E's repurchase behaviour ever does need a ticket, raise a
  FRESH one rather than reviving a closed issue.

## 42. NEW "Perakuan eDereg Pre-Checking - AATF" consent declaration on the
Vehicle+Payment Details popup, with a mandatory email field — SRD V1.2,
2026-09-11 [verified: SRD V1.2 pages 11-16 + live HTML pasted by Faizuddin,
2026-09-11 — `_reference/html/edereg/dereg-step2-precheck-consent-dialog-email-field.html`]

SRD V1.2 (10.09.2026) added sections 2.2.4-2.2.6 (REQ-001..007): the SAME
Step 2 popup `resolveVehicleGate()`/`attemptInlinePayment()` already drive —
the "Vehicle and Payment Details" screen shown before the fresh-purchase
JPJ round trip — now ALSO carries a Malay-language consent declaration
("PERAKUAN eDEREG PRE-CHECKING - AATF") above the Payment Summary. It is not
a separate popup or an extra step; same dialog, same Next/Cancel buttons,
new content inserted above the existing fee table.

The declaration has ONE editable field: email address (`#dpc-consent-email`).
Per REQ-004/005, it's prepopulated from the AATF company's DB record when
one exists (dev-patched only for now — the BO company-details page doesn't
surface it yet, a separate enhancement ticket), and left blank if not — the
tester must key one in either way, since the field is mandatory. Per REQ-007
the whole declaration shows ONCE per new transaction (RHB payment status
Pending) and is NOT shown again on a resubmit/retry (RHB status Failed).

**Automation fix, 2026-09-11:** `DeregTransactionPage.fillConsentEmailIfPresent()`
— checks the currently-open dialog for `#dpc-consent-email`, leaves a
prepopulated value alone, fills `FALLBACK_CONSENT_EMAIL` ('tester@email.com')
when blank. Called right before every existing Next-click on this dialog:
`resolveVehicleGate()`'s 'paid'-shape branch and `attemptInlinePayment()`
(covers `beginInlinePaymentFlow()` and every decline retry) — i.e. every
CPC_E2E_TS1-12 test, since they all route through one of those two methods.
No-ops cleanly when the field isn't present (retries/resubmits, or the
'closed-direct' reshow shape), so it's safe to call unconditionally rather
than needing to know in advance whether the declaration will show.

**Not yet updated for this SRD change:** `utils/repurchaseProbe.ts` and
`utils/jpjCodeProbe.ts` click the same dialog's "Next" independently (their
own copy of the shape-detection block, not routed through
`DeregTransactionPage`) — they'll hit the same blank-email validation stall
if ever run against a build with this declaration live. Fix them the same
way (a shared helper, or inline the same check) before relying on either
probe again.

### Teams-sourced scope/deployment history behind SRD V1.2 (source: Teams, "eAuto QAs" group chat + the dedicated "EAINT-9306 EAUTO" chat, 2026-09-08 to 2026-09-10 — synced 2026-09-15, no newer Teams activity found beyond this at sync time)

These decisions predate and explain the SRD V1.2 mechanics above; none of
them were previously tagged with Teams provenance in this file.

- **Invoice / e-Invoice / JPJ Official Receipt scope addition was
  REJECTED from 9306 — routed to its own CR instead.** BA raised it
  2026-09-08 16:04 (wanting Invoice/e-Invoice to show both Dereg and eDereg
  Pre-Checking data, plus a new JPJ Official Receipt button on Dereg).
  Charmain pushed back same day as redundant with the existing eDPC listing
  redirect. Batrisyia closed it 2026-09-08 17:08: "Ops agree to proceed with
  whatever we have concluded. No changes needed. They will create new CR
  for the recent feedback." **Do not treat the two dev QA artifacts under
  `_reference/tickets/EAINT-9306/` as current on this point** — both predate
  this decision and still describe the invoice/e-invoice item as live scope.
  `(source: Teams, Batrisyia, 2026-09-08)`
- **Delivery method for the perakuan declaration — "Method 2" (hold
  everything, ship the declaration together) was chosen over "Method 1"
  (ship what was already built + hardcode the email, add perakuan later).**
  Mei Jia Chee laid out both options 2026-09-09 15:01; Charmain confirmed
  "yup2" 2026-09-09 16:02. Consequence: **9306 was pulled from the
  2026-09-10 deployment and retargeted to 2026-09-15 night or 2026-09-16
  morning** — i.e. the deployment this SRD V1.2 declaration work is for is
  landing at or around the date this knowledge-base entry is being synced.
  ~~Worth confirming with the team whether it actually shipped on schedule
  before assuming the declaration is live in any given environment.~~
  **⚠️ AMENDED 2026-09-17: confirmed shipped, on schedule, morning of
  2026-09-15 (Tuesday).** In the dedicated "EAINT-9306 EAUTO" Teams chat:
  Faizuddin himself posted Monday 2026-09-14 18:20 that "QA has completed
  testing for EAINT-9306 on staging/uat1 (eAuto) with no outstanding
  issues. It's ready for morning deployment on 15 Sep (Tuesday)." Goh Kai
  Jiaeh confirmed Tuesday 2026-09-15 08:38, "hi all, fyi deployment is
  done." Faizuddin then posted regression evidence the same morning,
  2026-09-15 09:08: "QA has done regression ya. As of 9.00 AM; Pre-checking
  popup shows in deregistration step 2 / 1 approved precheck transaction /
  No deregistration transactions yet." No newer activity in that chat as
  of this 2026-09-17 sync — treat the declaration as live wherever that
  deployment target environment was as of 2026-09-15.
  `(source: Teams, Mei Jia Chee / Charmain, 2026-09-09; deployment
  confirmation source: Teams, "EAINT-9306 EAUTO" chat — Faizuddin/Goh Kai
  Jiaeh, 2026-09-14/15)`
- **The `deregPrecheckCompanyEmail` field is editable, same as the
  standalone pre-checking flow already allows** — asked 2026-09-09 16:02,
  answered 2026-09-10 09:55 by Mei Jia Chee. SRD V1.2 (REQ-004/005) later
  formalized this as a proper prepopulated-and-editable field; an earlier
  general-chat reading from 2026-09-09 15:57 (that the field was
  backend-only/blank-by-default) is superseded by this, not wrong so much
  as answered more precisely once written down.
  `(source: Teams, Mei Jia Chee, 2026-09-10)`
- **BA confirmed directly that the perakuan declaration applies ONLY to
  first-time-purchase transactions, never to resubmit or RE (RHB-reset)
  cases**: "perakuan we just wan to apply to those first time purchase ya.
  no need to apply to those resubmit & RE case." SRD V1.2 §2.2.6 (REQ-007)
  formalizes exactly this rule. One nuance the SRD itself still leaves
  unnamed: it says the no-perakuan condition applies to "resubmitted"
  payments but never explicitly names the RE/RHB-reset-countdown case by
  name — still worth a one-line confirm with BA/dev if a test result ever
  turns on that distinction. `(source: Teams, BA, 2026-09-09/10)`

## 43. Dashboard Bulk Run — multiple DIFFERENT test cases, auto-incremented
vehicle no., videos now kept PER RUN instead of one shared/wiped folder
[this session]

Added `app/eauto/edereg-precheck/BulkRunPanel.tsx`: pick several test cases
from the same grouped list the single-run picker uses, give one starting
Vehicle Reg No., and each picked test case runs ONCE against its own
auto-incremented vehicle no. (1st picked → the starting value, 2nd → next
number, …) — **multiple different TS, not one TS repeated**, confirmed
directly by Faizuddin after an initial build got this backwards. Runs
strictly sequentially (see the file's own header comment for why —
`hooks/useBackgroundRuns.ts`'s `startRun()` closure and this route's
video-publish step both assume one run at a time); continues through
individual failures; RE-wait test cases (CPC_E2E_TS5 Part 2, MU_TS3 — a
real fixed ~6.5-minute payment reset-timer wait, confirmed by grepping for
`waitOutPaymentResetTimer()`/`RESET_TIMER` usage — `shared.ts`'s
`RE_WAIT_TEST_CASES`) are automatically moved to the END of the run order,
per Faizuddin, so a long fixed wait doesn't sit in front of faster ones.

Two real bugs found and fixed while building this, both in shared
infrastructure the SINGLE-run panel also uses (not bulk-only):

1. **React error: "Cannot update a component (AppShell) while rendering a
   different component (BulkRunPanel)."** Root cause: the queue-advance
   effect called `runIndex()` (which calls `startRun()`, itself a `setRuns`
   on AppShell) FROM INSIDE a `setBulk(prev => ...)` updater function.
   Updater functions must be pure — React can invoke them more than once —
   so a side effect inside one that itself triggers another component's
   state update is exactly this class of bug. Fixed by mirroring `bulk`
   into a ref (`bulkRef`), computing the next state from
   `bulkRef.current` as a plain object, calling `setBulk(next)` (no updater
   function), and only THEN calling `runIndex()` as a separate statement
   after the state update, never inside it.

2. **`publishVideos()` (`run/route.ts`) wiped the ENTIRE shared
   `public/qa-artifacts/eauto-edereg-precheck` folder and republished on
   EVERY run** — fine for a single manual run (only the latest ever
   mattered) but fatal for Bulk Run: by the time a batch of N test cases
   finished, only the LAST one's videos would still exist on disk, every
   earlier one already overwritten. Fixed: `publishVideos()` now writes
   into its own `PUBLIC_ART/<runId>/` subfolder instead of the shared root,
   never deleting other runs' folders — `pruneOldRunFolders()` bounds total
   disk use instead (oldest folders beyond `KEEP_RUN_FOLDERS = 60` deleted
   on every publish, generous past one full bulk batch across this
   ticket's ~40 selectable test cases). `download-videos/route.ts` and
   `trim-video/route.ts` both used to resolve a video URL by
   `path.basename()` + a flat-parent-dir check, which breaks once URLs
   carry a `<runId>/` segment — both now go through a new shared
   `app/api/eauto-edereg-precheck/artifactPath.ts`'s `resolveArtifactPath()`,
   which accepts either the new `<runId>/<file>` shape or a bare legacy
   flat filename, still rejecting anything that could escape via `..` or
   an absolute path.

Each bulk item's own finished `RunResponse` (result/progress/log/videos) is
now kept on that item, not just the last one — an expandable "Details"
accordion per item (steps, a condensed result summary, the raw log, and a
checkbox+open-link per recording) lets a whole batch be inspected after
the fact, plus a panel-wide "Download selected videos" that can pull
recordings from several different test cases in the batch into one zip
(same `download-videos` endpoint the single-run panel already used).

NEVER RUN LIVE in this form — first real bulk batch will also be the first
live test of `pruneOldRunFolders()`'s pruning and the per-run video-folder
change generally.

## 44. Perakuan (SRD V1.2) deployed to production and regressed — 2026-09-15,
found via Teams sync

**The perakuan consent-declaration feature (§42) is now LIVE, not just
built/tested in uat.** Sequence, all in the dedicated "EAINT-9306 EAUTO"
Teams chat:

- Faizuddin, Monday 2026-09-14 18:20: "QA has completed testing for
  EAINT-9306 on staging/uat1 (eAuto) with no outstanding issues. It's ready
  for morning deployment on 15 Sep (Tuesday)."
- Goh Kai Jiaeh, Tuesday 2026-09-15 08:38: "hi all, fyi deployment is done."
- Faizuddin, Tuesday 2026-09-15 09:08 — post-deployment regression, "As of
  9.00 AM": Pre-checking popup shows in deregistration step 2; 1 approved
  precheck transaction; no deregistration transactions yet.

`(source: Teams, Faizuddin/Goh Kai Jiaeh, "EAINT-9306 EAUTO" chat, 2026-09-15)`

No further 9306 activity found in Teams after 2026-09-15 09:08 (checked "This
week" filter across all chats as of 2026-09-17 — nothing from 9/16 or 9/17).
This means: the automation rebuild/re-run work described in the
2026-09-14 session handoff (TS12 Part 2 trxStatus-direct fix, TS6/TS2
diagnoses, Bulk Run merge) still needs to be reconciled against a now-LIVE
perakuan build — worth confirming the `.spec.ts` suite's assumptions (e.g.
`fillConsentEmailIfPresent()`) still match production, not just uat1, before
trusting further automated runs.

**Update, Teams sync 2026-09-18**: still no further 9306 activity in Teams —
the dedicated "EAINT-9306 EAUTO" chat has moved into Faizuddin's own
"Completed JIRA Tickets" folder in Teams (as opposed to the "In Progress"
folder, which now holds EAINT-12166, EAINT-12167, EAINT-12107, and
EAINT-12028 instead). Faizuddin's own daily To-Do Plan posts in "eAuto QAs"
(checked through 2026-09-18 09:10) do not list EAINT-9306. Treat this ticket
as not currently active — the TS11/TS12 retest gap in
[[eaint-9306-ts11-ts12-need-retest]] is still open, but nobody is working it
right now. `(source: Teams, folder placement + daily To-Do Plan posts,
"eAuto QAs" chat, 2026-09-18)`
