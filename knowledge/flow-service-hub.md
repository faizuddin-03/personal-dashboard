# Flow: Service Hub — Software Installation, Biometric Device Purchase, appointments, reschedule, BO calendar

`[distilled 2026-10-15 from tests/service-hub/** (the running automation),
the two module SRDs in _reference/tickets/EAINT-11880/, the live captures
under _reference/html/eauto/ and _reference/tickets/EAINT-12166|12167/, and
the dashboard runners under app/eauto/ + app/api/eauto/. Every fact carries
its source. Environment names appear only as "code default" or "one captured
run", never as a rule — see eauto-portals.md.]`

Business rules (capacity numbers, pricing, status logic, cancellation
authority) live in [eauto-service-hub.md](eauto-service-hub.md). This file is
the **flow**: entry points, URLs, DOM, branches, data arrangement, traps. The
BackOffice serial-capture / Delivery Order half of Biometric Device Purchase is
in [flow-device-purchase.md](flow-device-purchase.md); this file links to it
rather than repeating it.

---

## 1. Why this flow matters, and what depends on it

Service Hub is the UCD-portal module where a dealer buys **Software
Installation** appointments or a **Biometric Device (Dermalog)** and books the
installation slots that come with it; BackOffice (Ops/CSE) then manages those
appointments on a shared calendar, marks them Completed/Failed, cancels them,
and — for devices — ships them (EAINT-12167 serials, EAINT-12166 DO).
`[from SRD EAINT-10960 v1.2 §2.1.1, §2.2.4; SRD EAINT-11880 v1.2 §2.1.1, §2.2.4]`

What depends on it:

1. **EAINT-12166 / EAINT-12167** (DO generation, serial capture) cannot be
   tested without a Biometric Device Purchase created through this flow —
   every `device-purchase-do-ts0X` spec starts with `arrangeBdpReferenceViaUCD()`.
   `[verified: tests/service-hub/utils/arrange.ts · arrangeBdpReferenceViaUCD; specs/device-purchase-do-ts01..08.spec.ts]`
2. The **BO Add Appointment** tests need an unbooked free installation, which
   only a device purchase that exits the slot page without booking can create.
   `[verified: tests/service-hub/utils/arrange.ts:5-15]`
3. The **Create BDP** dashboard page (`/eauto/bdp-creator`) and the
   **User Access Regression** tab on `/eauto/12166` both drive this flow.
   `[verified: app/eauto/bdp-creator/page.tsx:12-17; tests/service-hub/specs/user-access-regression.spec.ts:5-18]`

### "Shopping Cart" is the CR family name for this module

The SRD titles are literally *"[eAuto-UCD & BackOffice] Shopping Cart - To
Create Software Installation Module"* (EAINT-10960) and *"... Shopping Cart -
To Create Biometric Device Purchase Module"* (EAINT-11880).
`[from SRD EAINT-10960 v1.2 cover; SRD EAINT-11880 v1.2 cover]`
Umbrella feature requests: **CCB-618** "New Feature - Shopping Cart (To Replace
Proforma Invoice)" and **CCB-832** "Shopping Cart - Create Biometric Device
Purchase Module". `[from SRD EAINT-10960 v1.2 §1.5 row 1; SRD EAINT-11880 v1.2 §1.5 row 1]`
Phase map: EAINT-10960 (Software Installation, first SRD draft 06.07.2026) →
EAINT-11880 (Biometric Device Purchase, first draft 10.07.2026) → EAINT-11881
(Change Main User) → EAINT-11882 (Account Termination); EAINT-12099 is the
Teams chat name for the 11881/11882 batch.
`[from _reference/tickets/EAINT-11880/Session-Handoff-2026-09-17-11880.md · "Traced the module family tree"; SRD revision tables]`
The UCD listing's Service Type filter already carries a `CHANGE_MAIN_USER`
value, so 11881 shares this listing.
`[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:5 · ServiceType]`
In the dashboard, "Shopping Cart" is the runner page for this suite
(`/eauto/shopping-cart`, subtitle "eAuto Service Hub · automated end-to-end
checks"). `[verified: app/eauto/shopping-cart/page.tsx:434-435; components/Sidebar.tsx:50]`
Child QA-Issues of 11880: EAINT-11996, 12095, 12103, 12104 (the "21st Sept
Deployment Items" batch). `[from _reference/tickets/EAINT-11880/Session-Handoff-2026-09-17-11880.md]`
EAINT-11953 added the two BO concurrency dialogs.
`[verified: _reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html:160-169 · HTML comments "EAINT-11953"]`

---

## 2. Portals, roles, accounts

| Portal / role | What it does here | Source |
|---|---|---|
| **UCD Portal** (dealer) | Buys SI / BDP, books slots, reschedules (self-service), views listing + details, downloads Invoice | `[verified: tests/service-hub/utils/config.ts:104-116 · PATHS]` |
| UCD — all users | Software Installation | `[from SRD EAINT-10960 v1.2 §2.2.3 "UCD 1. Software Installation – All users"]` |
| UCD — main user only | Biometric Device Purchase | `[from SRD EAINT-10960 v1.2 §2.2.3 "2. Biometric Device Purchase – Only main user"]` |
| **BO — Ops** | Full access to the BO listing; cancels SI **and** BDP; Update Shipping Details; Export | `[from SRD EAINT-10960 v1.2 §2.2.3 "Ops · Full access"; SRD EAINT-11880 v1.2 §2.3.2.5 #2 note 4]` |
| **BO — CSE** (call-in) | SI transactions full access; BDP view-only for biometric fields; can reschedule / mark completed / mark failed the bundled install; **cannot cancel a BDP**; Export: no access | `[from SRD EAINT-10960 v1.2 §2.2.3 "2. CSE" (highlighted)]` |
| Ops login IDs (SRD) | kmcheah, jasons, mfared, nikmuhamad, eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni | `[from SRD EAINT-10960 v1.2 §2.2.3; identical list in SRD EAINT-11880 v1.2 §2.2.3]` |
| CSE login IDs (SRD) | eautochinwei, eautohamal, eautojrjaya, eautoxiayuan, kokping, eautomie | `[from SRD EAINT-10960 v1.2 §2.2.3; identical list in SRD EAINT-11880 v1.2 §2.2.3]` |

The automation has no CSE-vs-Ops distinction: one BO account
(`EAUTO_BO_USER`) does everything, and a second BO Hub Admin (`EAUTO_BO2_USER`)
exists only for TS02's "Officer B" check. The 18 accounts barred from the
serial fields (EAINT-12167 REQ-009) are in flow-device-purchase.md.
`[verified: tests/service-hub/utils/config.ts:8-14; knowledge/flow-device-purchase.md · "The 18 blocked accounts"]`

Credentials and per-run inputs — all env vars, injected by the runner, never
hardcoded:

| Env var | Used for | Source |
|---|---|---|
| `EAUTO_BASE_URL` / `EAUTO_ENV_PATH` | base URL (code default `https://staging.eauto.my/uat4` in config.ts, `/uat1` in playwright.config.ts — a known mismatch, see eauto-portals.md) | `[verified: config.ts:2-3; playwright.config.ts:27]` |
| `EAUTO_UCD_USER/_PASS` | primary UCD account; its company must be **the exact name** the BO tests type (`COMPANY = "FAIZUDDIN AUTO TEST"`) | `[verified: config.ts:5-6; specs/add-appointment-bo.spec.ts:31-35]` |
| `EAUTO_UCD2_USER/_PASS` | second UCD for the 15-minute-hold concurrency tests | `[verified: config.ts:16-18; specs/slot-capacity-boundary.spec.ts:419-421]` |
| `EAUTO_BO_USER/_PASS` | BO (Hub Admin / Ops) | `[verified: config.ts:8-9]` |
| `EAUTO_BO2_USER/_PASS` | second BO Hub Admin, TS02 Officer B | `[verified: config.ts:11-14]` |
| `EAUTO_PUBLIC_HOLIDAY` | YYYY-MM-DD; holiday tests skip when empty | `[verified: config.ts:20-26; specs/calendar-rules.spec.ts:89-93]` |
| `EAUTO_REF_NO` | existing SR reference (declared; no current spec reads it) | `[verified: config.ts:27; grep — only config.ts and the runner reference it]` |
| `EAUTO_SLOT_PER_SLOT` / `EAUTO_SLOT_PER_DAY` | override 3 / 6 | `[verified: config.ts:30-31]` |
| `EAUTO_CREATE_BDP_QTY` / `_EXTRA_INSTALLS` / `_SKIP_INSTALL` / `PW_RESULT_PATH` | Create BDP utility | `[verified: specs/create-bdp.spec.ts:19-24]` |
| `PW_UAR_ACCOUNTS` (JSON array) + `PW_RESULT_PATH` (a **directory** here) | User Access Regression | `[verified: specs/user-access-regression.spec.ts:14-18, 41-48]` |
| `PW_HEADED`, `PW_VIDEO`, `PW_OUTPUT_DIR`, `PW_JSON_REPORT`, `PW_STEP_REPORT`, `PW_DETAILED`, `PW_DETAILED_DELAY`, `PW_GATE_DIR` | runner plumbing | `[verified: playwright.config.ts:3-23; pages/BasePage.ts:149,169; utils/manualGate.ts:12-23]` |

---

## 3. Entry points

| # | Entry | Status | Source |
|---|---|---|---|
| E1 | UCD Service Hub dashboard → **SOFTWARE INSTALLATION** tile | verified (tile text) | `[verified: pages/ServiceHubPage.ts:6 · getByText("SOFTWARE INSTALLATION")]` |
| E2 | UCD Service Hub → **BIOMETRIC DEVICE PURCHASE** tile | verified | `[verified: pages/ServiceHubPage.ts:7]` |
| E3 | UCD Service Hub → **SERVICE REQUEST LISTING** tile | verified | `[verified: pages/ServiceHubPage.ts:8]` |
| E4 | UCD home tile **SERVICE HUB** `#servicehub` → `/view/ucd/service-hub/view.do` | verified (ucd-shell capture) | `[verified: knowledge/flow-ucd-shell.md:110]` |
| E5 | Direct `goto()` of every PATHS entry (all page objects navigate by URL, not by tile) | verified, the usual path in the suite | `[verified: pages/*.navigate()]` |
| E6 | Listing row **Reschedule** link → modal → reschedule calendar | verified live | `[verified: pages/ServiceRequestListingPage.ts:162-200 · clickReschedule]` |
| E7 | Listing row **Resubmit** link (paid-but-unscheduled) → resumes at slot.do / payment | known, not automated; same `a.sc-resubmit` class as Reschedule | `[verified: pages/ServiceRequestListingPage.ts:151-160; from SRD EAINT-10960 v1.2 §2.3.2.2 #3.3]` |
| E8 | Listing row **View** → `receipt.do` (UCD Service Request Details) | verified | `[verified: pages/ServiceRequestListingPage.ts:137-149; config.ts:111-115]` |
| E9 | Step-4 **Done** (`a.rs-btn`) → `receipt.do?id=` | verified capture | `[verified: _reference/tickets/EAINT-12166/EAINT-12166-ucd-bdp-purchase-step4-submission-uat1-2026-09-23.html · a.rs-btn]` |
| E10 | BO listing `/view/bo/service-hub/listing/main.do` → **View** (new tab) → `detail.do` | verified | `[verified: pages/bo/SoftwareInstallationListingPage.ts:346-373]` |
| E11 | BO listing → **Appointment Calendar** button `#sc-appt-cal` (no direct URL) | verified | `[verified: pages/bo/AppointmentCalendarPage.ts:60-70; config.ts:117-121]` |
| E12 | BO calendar → **Reschedule** (`a.cal-rs`) / **Add Appointment** (`#cal-add-btn`) | verified | `[verified: pages/bo/AppointmentCalendarPage.ts:306-311, 415-420]` |
| E13 | Confirmation / reschedule **emails** (support@eauto.my) | not automated; checked only via its on-screen proxy (UCD listing) | `[from SRD EAINT-10960 v1.2 §2.3.2.1 #7-#8; verified: specs/bo-calendar-limits.spec.ts:215-227]` |
| E14 | BO home menu → listing (click path) | not recorded for this module; the suite always uses E5 | `[unconfirmed]` |

---

## 4. URL map

Base: `https://staging.eauto.my/<env>`; `<env>` is a path segment.
`[verified: tests/service-hub/playwright.config.ts:27 · use.baseURL]`

### UCD

| Step | URL | You've arrived when | Source |
|---|---|---|---|
| Login | `/public/login/` | `input[type="text"]` + `input[type="password"]`; after submit URL leaves `/public/login` → `/view/ucd/home.do` | `[verified: config.ts:104; pages/LoginPage.ts:29-40]` |
| Service Hub dashboard | `/view/ucd/service-hub/view.do` | tiles by text | `[verified: config.ts:106; pages/ServiceHubPage.ts]` |
| SI step 1 Payment | `/view/ucd/service-hub/installation.do` | `#si-qty-view`, `#si-pay-btn` | `[verified: config.ts:107; pages/SoftwareInstallationPage.ts:6-13]` |
| SI/BDP step Appointment (slot picker) | `/view/ucd/service-hub/installation/slot.do?<id-pair>` | `#si-grid` | `[verified: config.ts:108; pages/SoftwareInstallationPage.ts:47 waits `/slot\.do\?(id|txnId|transactionId)=/`]` |
| Submission | `/view/ucd/service-hub/installation/submitted.do?<id-pair>` | `.rs-title` "Request Submitted" | `[verified: config.ts:109; pages/SlotPickerComponent.ts:514; step-4 capture]` |
| BDP step 1 Selection | `/view/ucd/service-hub/purchase.do` — form POSTs `/api/ucd/service-hub/purchase/create.do` | `#qty`, `#authorizedReceiver` | `[verified: config.ts:110; selection-step capture · form action]` — the capture header's "biometric-purchase.do (or equivalent)" is a guess; `PATHS.biometricPurchase` is what the green suite uses |
| BDP step 2 Payment | `make-payment.do` | `#installOptOut`, `#extraInstalls`, `#si-pay-btn` | `[unconfirmed — only a doc comment, pages/BiometricPurchasePage.ts:8; no waitForURL asserts it]` |
| BDP step 3 Appointment | same `slot.do` picker as SI | `#si-grid` | `[verified: pages/BiometricPurchasePage.ts:154 waits `/(slot|submitted)\.do\?(id|txnId|transactionId)=/`]` |
| BDP step 4 Submission | `submitted.do` — Done `a.rs-btn` → `receipt.do?id=<uuid>` | `.rs-title` | `[verified: step-4 capture]` |
| Service Request Listing | `/view/ucd/service-hub/listing.do` | `input[name="referenceNo"]`, "Search Now" | `[verified: config.ts:111; pages/ServiceRequestListingPage.ts:32-39]` |
| Service Request Details | `/view/ucd/service-hub/receipt.do?<id-pair>` — **there is no `details.do`** and no separate "Receipt" page; the page is titled "Service Request Details" but the URL says `receipt.do` | `.rec-ref`, `.rec-status` | `[verified: config.ts:111-115; pages/ServiceRequestDetailsPage.ts:9-12, 32-36; SR-details capture breadcrumb]` |
| Reschedule calendar | `/view/ucd/service-hub/installation/reschedule.do?id=<txn>&apptIds=<uuid[,uuid...]>` (live) — `PATHS.reschedule(txnId)` builds the `?id=` form only | `#si-grid` with `.si-bookbadge` | `[verified: pages/ServiceRequestListingPage.ts:172; config.ts:116]` |
| Invoice PDF (UCD) | `/download/ucd/service-hub/invoice-pdf.do?transactionId=<uuid>` via `window.open` | download | `[verified: SR-details capture · .rec-inv-btn onclick]` |

**The `<id-pair>` is the whole `key=value` query pair** — `id=<uuid>` (current),
`transactionId=<uuid>`, or `txnId=<number>` (oldest). `BasePage.getTxnIdFromUrl()`
returns it with its key and callers splice it as `?${txnId}`; every URL wait
matches all three. `[verified: pages/BasePage.ts:30-51; config.ts:95-101]`

### BackOffice

| Step | URL | You've arrived when | Source |
|---|---|---|---|
| Login | `/public/login/` (same page as UCD); only assertion is "URL left /public/login" | — | `[verified: pages/LoginPage.ts:43-52]` |
| Biometric Device Purchase & Software Installation Listing | `/view/bo/service-hub/listing/main.do`; Search is an AJAX GET to `/api/admin/service-hub/listing/list.get` (`#sc-filter-form` action) | `#sc-search` | `[verified: config.ts:122-123; listing capture:21; pages/bo/SoftwareInstallationListingPage.ts:175-189]` |
| Service Request Details (SI **and** BDP — same endpoint) | `/view/bo/service-hub/detail.do?<id-pair>&apptId=<uuid>` — one row/URL per appointment | `.ins-title` "Service Request #SR…" | `[verified: config.ts:124-131; listing capture:202 href]` |
| Update Shipping Details save | `POST /api/admin/service-hub/biometric/update-shipping.do`, form-urlencoded, `X-Requested-With: XMLHttpRequest`, params `transactionId`, `baseVersion`, `deliveryStatus`, `deliveryDate`, `consignmentNo`, `recipientName`, `shippingAddress`, `contactNo`, repeated `deviceSerialNos` | — | `[verified: specs/device-purchase-do-ts02.spec.ts:106-121; knowledge/flow-device-purchase.md · "The real endpoint"]` |
| Appointment Calendar | **no stable URL** — click `#sc-appt-cal` on the listing | `#cal-table` visible | `[verified: pages/bo/AppointmentCalendarPage.ts:60-70]` |
| Export | download named `Biometric_Device_Installation_List_YYYYMMDD.xlsx`; `#sc-export` is hidden until a search has run | — | `[verified: pages/bo/SoftwareInstallationListingPage.ts:396-414; from SRD EAINT-10960 v1.2 §2.3.2.5 #3]` |
| Company Management (used by TS03 snapshot test) | `/view/account/company` → `/view/account/company/edit.get?id=<companyAccountId>`; Update posts `/view/account/company/update.do` | `#to-search`, `#to-update-company` | `[verified: config.ts:133-135; pages/bo/CompanyManagementPage.ts:16-26, 84]` |

---

## 5. The real DOM handles — verbatim

### 5.1 Login (shared UCD/BO page)

| Target | Selector | Source |
|---|---|---|
| username | `input[type="text"]` `.first()` | `[verified: pages/LoginPage.ts:6]` |
| password | `input[type="password"]` `.first()` | `[verified: pages/LoginPage.ts:7]` |
| submit | `button[type="submit"], input[type="submit"]` `.first()` | `[verified: pages/LoginPage.ts:8]` |

Strategy: after click, `waitForURL(u => !/\/public\/login/i.test(u))` (20 s) then
`networkidle` — otherwise the next `goto()` races the redirect chain and lands
on home. `[verified: pages/LoginPage.ts:24-32]`

### 5.2 Service Hub dashboard

Tiles are matched by text: `getByText("SOFTWARE INSTALLATION")`,
`getByText("BIOMETRIC DEVICE PURCHASE")`, `getByText("SERVICE REQUEST LISTING")`
(`exact: false`). `[verified: pages/ServiceHubPage.ts:6-8]` Real ids/classes for
these tiles have never been captured. `[unconfirmed]`

### 5.3 Software Installation step 1 (`installation.do`)

| Target | Selector | Source |
|---|---|---|
| visible quantity | `#si-qty-view` (read with `inputValue()`) | `[verified: pages/SoftwareInstallationPage.ts:6,24]` |
| hidden quantity | `#siQty` | `[verified: :7]` |
| stepper + / − | `.si-step button` with text `+` / `−` (U+2212, not a hyphen) | `[verified: :8-9]` |
| fee / tax / total | `#si-fee-amt`, `#si-tax-amt`, `#si-tot` | `[verified: :11-13]` |
| Make Payment | `#si-pay-btn` | `[verified: :10]` |
| confirm dialog | `.ui-dialog` → Yes `.confirm-dialog-btn`, No `.cancel-dialog-btn` | `[verified: pages/BasePage.ts:74-87]` |

### 5.4 Biometric Device Purchase step 1 (`purchase.do`) — complete form

`[verified: _reference/tickets/EAINT-12166/EAINT-12166-ucd-bdp-purchase-selection-step-uat1-2026-09-23.html (form never trimmed); pages/BiometricPurchasePage.ts:13-20]`

| Field | Markup | Note |
|---|---|---|
| Purchase Device | `<input type="text" id="qty" name="qty" class="bio-qty" value="1" oninput="bioQtyType(this)" onchange="bioValidateQty()">` | plain text input; defaults "1" |
| − / + | `<button id="bio-qty-minus" onclick="bioStep(-1)" disabled>` / `<button id="bio-qty-plus" onclick="bioStep(1)">` | page object uses `button[onclick="bioStep(1)"]` / `bioStep(-1)`; "+" self-disables at 40 `[verified: pages/BiometricPurchasePage.ts:14-15, 41-47]` |
| quantity error | `<div id="bio-stock-err" class="bio-stock-err" style="display:none">` | cap message asserted loosely: `"A maximum of 40 devices can be purchased per transaction."` only if the div has text `[verified: specs/device-purchase-do-ts02.spec.ts:33-36]` |
| helper text | `<span class="bio-helper">Each biometric device purchase comes with one free software installation</span>` | |
| Recipient Name | `<input id="authorizedReceiver" name="authorizedReceiver" class="f-text" oninput="bioClearErr('authorizedReceiver')">` + `#err-authorizedReceiver` "This field is required" | prefilled from Main User |
| Contact No | `<input id="contactNo" name="contactNo" inputmode="numeric">` + `#err-contactNo` | prefilled |
| Ship to showroom | `<input type="checkbox" id="shipToShowroom" name="shipToShowroom" value="Y" checked onclick="bioToggleShip()">` | checked by default |
| Delivery address | `<textarea id="deliveryAddress" name="deliveryAddress" class="bio-addr locked" readonly>` + `#err-deliveryAddress` | readonly while showroom is ticked |
| Next | `<button type="submit" class="bio-btn next">Next</button>`; form `onsubmit="return bioSubmitCheck();"` POST `/api/ucd/service-hub/purchase/create.do` | `[verified: pages/BiometricPurchasePage.ts:20 · button.bio-btn.next]` |
| Back | `<a class="bio-btn back" href="/<env>/view/ucd/service-hub/view.do">` | goes to the Service Hub dashboard, not the listing |
| step indicator | `.flow-steps .fs-step` with `.fs-num` 1-4 and `.fs-lbl` Selection / Payment / Appointment / Submission; `active` / `done` classes | 4 steps live, vs the SRD's 3-step SI wizard |
| back-button guard | `pushState` + `popstate` redirecting to the Service Hub dashboard | from capture header comment |

**FUTURE — EAINT-12349 (not built, SRD v0.2 body not read):** the single `#deliveryAddress` textarea is planned to split into separate address fields. SRD v0.2 change remarks (27.10.2026), verbatim: "Split shipping address into separate fields", "Confirmed showroom address prefill", "Default address handling remains as existing", "District set as mandatory". Field names and order not known. `[from ticket EAINT-12349, Jira SRD table row v0.2]` `[unconfirmed]` until built.

**Known defect today (reason for EAINT-12349):** with "Ship to showroom address" ticked, the shown address "does not include postcode and area in some cases, and address shown does not tally with backend record." Do not raise it as a new issue; it is already logged. `[from ticket EAINT-12349, Jira description row 4]`

### 5.5 Biometric Device Purchase step 2 (payment/options)

| Target | Selector | Source |
|---|---|---|
| "I don't need software installation" | `#installOptOut` (checkbox) | `[verified: pages/BiometricPurchasePage.ts:23]` |
| extra installs value | `#extraInstalls` | `[verified: :24]` |
| extra + / − | `#bio-extra-plus` / `#bio-extra-minus` | `[verified: :25-26]` |
| Make Payment | `#si-pay-btn` (same id as SI) | `[verified: :27]` |
| free-install stepper (SRD "Software Installation — [N] request(s)") | — | `[unconfirmed — not in any page object, no capture of step 2 exists]` |

### 5.6 Slot picker (`slot.do` and `reschedule.do` — one shared component)

`[verified: pages/SlotPickerComponent.ts:26-52 unless noted]`

| Target | Selector / strategy |
|---|---|
| grid, month label, arrows | `#si-grid`, `#si-mo`, `#si-prev`, `#si-next` |
| day cell | `td[data-date="YYYY-MM-DD"]`; classes `si-book` (bookable), `si-muted` (greyed), `si-fullday` (6/6 — never also `si-book`) `[:82-100]` |
| day badge | `.si-badge` reads **"N Available"** or **"Full"** — `getSlotCount()` parses `/(\d+)\s*Available/i`, `/full/i` `[:137-145]` |
| booked / selected marks | `.si-bookbadge` (existing booking, orange), `.si-selbadge` (selected in this session) `[:147-157]` |
| modal overlay | `#si-ovl` (full-page; blocks clicks when left open) |
| per-slot steppers | `#si-cnt0` morning, `#si-cnt1` afternoon (inputs, read `inputValue()`) |
| per-slot capacity text | `#si-cap0` / `#si-cap1` → "N of M" or contains "fully booked" `[:414-428]` |
| per-slot remove | `#si-rowx0` / `#si-rowx1` |
| footer tally | `<div class="si-tally">Booked <span id="si-alloc-count">1</span> of <span id="si-alloc-total">1</span></div>` `[:43-46]` |
| confirm button | `#si-confirm-booking` (ReschedulePage.ts:7) / `button:has-text('Confirm'), .si-abtn:has-text('Confirm')` |
| client error when not all units booked | `#si-clienterr` `[verified: specs/slot-capacity-boundary.spec.ts:146]` |
| slot-unavailable popup | `#si-uovl` |
| page JS the automation calls instead of clicking | `siStep(slot, ±1)`, `siRowRemove(slot)`, `siSaveDate()`, `siCloseModal()`, `siConfirmBooking()`, `siCloseUnavail()` `[:444-576]`; `siOpenSlot(date)` also exists `[verified: scripts/debug-reschedule.ts:228]` |

Slot index convention: **0 = morning 10:00am–12:00pm, 1 = afternoon 2:00pm–4:00pm**
everywhere (UCD ids, BO radios, `BoTimeSlot`). `[verified: pages/SlotPickerComponent.ts:35; pages/bo/AppointmentCalendarPage.ts:5]`

### 5.7 Reschedule entry modal and reschedule page

| Target | Selector | Source |
|---|---|---|
| row action link | `a.sc-resubmit` filtered `hasText: "Reschedule"` — **the same class is reused for "Resubmit"**, only the text differs | `[verified: pages/ServiceRequestListingPage.ts:151-160]` |
| in-page modal | `.sc-modal` over `#sc-resched-ovl`; text "Please select the appointment(s) you wish to reschedule" | `[verified: :167-171]` |
| per-appointment checkbox / select-all | `.sc-resched-cb` / `#sc-resched-all` (checked with `force: true`, fallback sets `.checked` + dispatches `change`) | `[verified: :171, 185-197]` |
| Confirm | `.sc-btn-confirm` → navigates to `reschedule.do?id=…&apptIds=…` **with the chosen appointment(s) already removed** | `[verified: :172-175, 198]` |
| Confirm Appointment on calendar | `#si-confirm-booking` → jQuery dialog → `.confirm-dialog-btn` / `.cancel-dialog-btn` | `[verified: pages/ReschedulePage.ts:7, 55-68]` |
| Done | `getByText("Done")`; live markup `a.rs-btn` | `[verified: pages/ReschedulePage.ts:6; scripts/debug-reschedule.ts:331]` |

### 5.8 UCD Service Request Listing (`listing.do`)

`[verified: pages/ServiceRequestListingPage.ts:31-43, 93-106]`

| Target | Selector |
|---|---|
| Reference No | `input[name="referenceNo"], input[placeholder*="Reference"]` |
| Service Type | `select[name="serviceType"]` — values `ALL`, `BIOMETRIC_PURCHASE`, `SOFTWARE_INSTALLATION`, `CHANGE_MAIN_USER` |
| Status | `select[name="status"]` — values `ALL`, `NEW` (label "-"), `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `EXPIRED` (verified live against the dropdown; no "Approved") |
| Date Requested From/To, Payment Date From/To | `input[name="dateRequestedFrom"]`, `dateRequestedTo`, `paymentDateFrom`, `paymentDateTo` |
| Search / Reset | `getByText("Search Now")` / `getByText("Reset")` |
| results | `table` `.first()` → data rows `tbody tr:has(td)` (the header is a `<th>` row **inside `<tbody>`**) |
| columns (0-indexed) | 0 `#`, 1 Reference No, 2 Service Type, 3 Date Requested, 4 Payment, 5 Tx Status, 6 e-Invoice Status, 7 Remarks, 8 Action |
| View | `row.getByText("View")` |

### 5.9 UCD Service Request Details (`receipt.do`) — live markup

`[verified: _reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html; pages/ServiceRequestDetailsPage.ts:15-40]`

| Target | Markup |
|---|---|
| breadcrumb | `.breadcrumb` Home / Service Hub / Service Request Listing / `<div class="page-name">SR69001395</div>` |
| Back | `<button class="btn-blue-outline" onclick="location='/<env>/view/ucd/service-hub/listing.do'">« Back</button>` |
| reference / status | `<span class="rec-ref">SR69001395</span>` `<span class="rec-status" style="color:blue;">Pending</span>` |
| Invoice | `<button class="rec-inv-btn" onclick="window.open('/<env>/download/ucd/service-hub/invoice-pdf.do?transactionId=…')">Invoice</button>` — only Invoice on a BDP with LHDN Failed; **no DO download on the UCD side** |
| top details | `.rec-sec .rec-grid2.rec-topdetail .rec-row` → `span.k` label / `span.v` value: "Service Type:", "Date Requested:", "e-Invoice Submission Date:", "LHDN Response Status:", "e-Invoice Validation Date:" |
| e-Invoice note | `.rec-einv-note` "e-Invoices are only available for customers with a valid TIN. e-Invoices can only be issued for transactions within the current calendar month." |
| Shipping Details (BDP only) | `.rec-sec` containing `h4` "Shipping Details"; rows "Purchased Device:", "Delivery Status:", "Delivery Order Number:", "Consignment Number:", "Delivery Date:", "Shipping Address:", "Recipient Name:", "Contact No:" — page object: `.rec-sec` `{ has: h4 "Shipping Details" }` → `.rec-row` `{ has: .k hasText label }` → `.v` |
| Appointment Details (SI / BDP with install) | `.rec-appt-tbl` → `tbody tr`, cells `#` / Appointment Date / Time Slot / Status (status = last `td`) |
| Payment Details | `h4` "Payment Details:" → `ol.rec-pay-list li` e.g. `1. 23-09-2026 11:28am - RHB (SR20260923000002-1109700) - <b style="color:#008E00;">OK</b>`; fee rows `.rec-fee .rec-fee-row .k/.v` |

`paymentDetailsSection` (`[class*='payment'], .sr-payment`) and
`feeSummarySection` (`[class*='fee'], .sr-fee`) in the page object are guesses
that predate the capture; prefer `ol.rec-pay-list` / `.rec-fee`.
`[verified: pages/ServiceRequestDetailsPage.ts:28,40 vs capture]`

### 5.10 Submission page (step 4 / `submitted.do`) — live markup

`[verified: _reference/tickets/EAINT-12166/EAINT-12166-ucd-bdp-purchase-step4-submission-uat1-2026-09-23.html]`
`.rs-wrap .rs-panel` → `.rs-head img.rs-tick` + `.rs-title` "Request Submitted";
`.rs-msg` "We have received your request and you will receive an email for
confirmation."; `.rs-sec .rs-sec-title` "Biometric Device Purchase Details" /
"Payment Details"; lines `.rs-line .rs-k` / `.rs-v` ("Purchased Device:",
"Recipient Name:", "Contact No:", "Shipping Address:", "Paid Amount:",
"Biometric Device:", "Total Paid:"); `a.rs-btn` Done → `receipt.do?id=`.

### 5.11 BO Biometric Device Purchase & Software Installation Listing — live markup

`[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html (form untrimmed); pages/bo/SoftwareInstallationListingPage.ts:56-77]`

| Target | Markup |
|---|---|
| filter form | `<form id="sc-filter-form" method="GET" action="/<env>/api/admin/service-hub/listing/list.get">`, hidden `name="pageNo"` |
| text filters | `input[name="referenceNo"]`, `input[name="companyName"]`, `input[name="roc"]` |
| date filters (all `readonly`, `class="sc-datepicker hasDatepicker"`, ids are random `dp<digits>` — **do not use the id**) | `requestedFrom`\*, `requestedTo`\*, `deliveryDateFrom`, `deliveryDateTo`, `appointmentDateFrom`, `appointmentDateTo` |
| Delivery Status | `select[name="deliveryStatus"]`: `""` All, `-`, `New`, `Arranged`, `Delivered` |
| Installation Status | `select[name="status"]`: `""` All, `-`, `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `EXPIRED` |
| Time Slot | fake dropdown `#sc-slot-dd` (`#sc-slot-face` select showing "All", `#sc-slot-overlay`, panel `#sc-slot-panel`) with checkboxes `#sc-slot-all name="timeSlotAll"`, `.sc-slot-item name="timeSlot"` values `__NONE__`, `1000_1200`, `1400_1600` |
| Service Type | `select[name="serviceType"]`: `""` All, `SOFTWARE_INSTALLATION`, `BIOMETRIC_PURCHASE` |
| Payment Status | `select[name="paymentStatus"]`: `""` All, `Paid` (label **OK**), `Failed` |
| LHDN Status | `select[name="lhdnStatus"]`: `""` All, `OK`, `Failed`, `New` (label "-") |
| buttons | `#sc-search`, `#sc-export` (hidden until a search runs), `#sc-reset`, `#sc-appt-cal` in `#sc-button-group` |
| results | `#sc-combined-tbl` in `#sc-result-region`; `#sc-result-count` "33 record(s) in total"; data rows `tbody tr:has(td)` |
| **live column order (20)** | `#`, Reference No., Service Type, Date Requested, Company Name, Company ROC, **Device, Device Serial No.**, Delivery Date, Installation Request, Appointment Date, Time Slot, Payment Status, LHDN Response Status, Delivery Status, Installation Status, Date Completed, Remarks, Special Remarks, Action |
| row example | `td` "SR69001391" / "Biometric Device Purchase" / `17-09-2026<br>16:09` / company / ROC / `1` / `-` / `-` / `1` / `27-11-2026` / `2pm -<br>4pm` / `<b style="color:green">OK</b>` ×2 / `<b style="color:blue">New</b>` / `<b style="color:blue">Pending</b>` / `-` / `<td class="rmk">` / `<b style="color:blue">No</b>` / actions |
| View | `<a href="/<env>/view/bo/service-hub/detail.do?id=<uuid>&apptId=<uuid>" target="_blank" rel="noopener">View</a>` — page object strips `target` before clicking |
| Cancel | `<a href="#" onclick="return scCancel('<apptId>');">Cancel</a>` → `#sc-cancel-dialog` "Sure to cancel?" (jQuery UI, buttons in `.ui-dialog-buttonpane`) |

Column-index strategy: the page object's `COL` map (19 entries, no serial
column) is **stale against the live 20-column thead**; it survives because
getters try the `<thead th>` text first (`cellTextByHeader`) and then anchor on
the Reference-No cell (`getColOffset`). Use header-name lookups, never
`COL.<name>` beyond `companyRoc`. `[verified: pages/bo/SoftwareInstallationListingPage.ts:34-54, 212-261 vs listing capture thead]`

Date-filter strategy: set through the widget —
`$el.datepicker("setDate", new Date(y, m-1, d))` — not `.value` + `change`,
which the search silently ignores. Values are **DD-MM-YYYY**.
`[verified: pages/bo/SoftwareInstallationListingPage.ts:109-139]`
Selecting a From date auto-sets To = From + 1 month; results sort latest-first.
`[from QA team (Faizuddin), 2026-09-24 — recorded in specs/device-purchase-do-ts05.spec.ts:29-39; not yet captured live]`

### 5.12 BO Service Request Details — Software Installation controls

`[verified: pages/bo/SoftwareInstallationDetailsPage.ts:15-32, 79-116; popup capture:143-171]`

| Target | Markup |
|---|---|
| header | `.ins-topbar .ins-title` "Service Request #SR69001391" |
| Installation Failed » | `<button class="btn-fail" onclick="opFailOpen()">` |
| Installation Completed » | `<button class="btn-success" onclick="opSuccess()">` |
| Mark Completed dialog | `#op-success-dialog` "Are you sure want to mark the installation appointment as completed?" — jQuery dialog titled "Installation Completed", buttons plain `.ui-dialog-buttonpane button` "Yes"/"No" (**not** `.confirm-dialog-btn`) |
| Mark Failed dialog | `#op-fail-dialog` title "Installation Failed"; "Please select the reason causing the installation failed:"; radios `input[name="op-fail-reason"]` values `Reappointment`, `LaptopIssue` (label "Laptop/PC Issues"), `Other`; `#op-fail-other-wrap` → `textarea#op-fail-other` placeholder "Please specify the reason", `#op-fail-other-err` "Reason must not exceed 100 characters." |
| Special Remark | `#ins-special-remark` + `<button class="btn-update" onclick="opSaveRemark()">Update Special Remark</button>` |
| Invoice / e-Invoice | `button.btn-inv[onclick="opInvoice()"]`, `button.btn-inv[onclick="opEInvoice()"]` |
| concurrency dialogs | `#op-concurrent-dialog` title "Error": "Unable to proceed. This record was just updated by another user."; `#op-installstate-dialog` title "Error": "Unable to proceed. This Service Request has been completed, failed, expired or cancelled." (OK refreshes) |
| key/value tables | `table.ins-kv` rows `td.k` label + value `td`; labels seen live: Date Requested, Company Name, Company ROC, e-Invoice Submission Date, LHDN Response Status, e-Invoice Validation Date, Software Installation, Appointment Status, Appointment Date, Time Slot, Date Completed, User Name, Contact Number, Purchase Device, Biometric Device, Number of Device, Device Serial No., Delivery Status, Delivery Date, Delivery Order Number, Consignment Number, Recipient Name, Shipping Address, Contact No |

`appointmentStatus` (`[class*='appt-status'], .appointment-status`) and the
`specialRemarkInput` selector in `SoftwareInstallationDetailsPage` are
SRD-inferred, not captured; the live remark box is `#ins-special-remark`.
`[verified: pages/bo/SoftwareInstallationDetailsPage.ts:11-13, 28-31 vs popup capture ids]`

### 5.13 BO Service Request Details — Biometric Device Purchase shipping controls

Full detail in flow-device-purchase.md; the handles, for completeness:
`[verified: pages/bo/DevicePurchaseDetailsPage.ts:27-42; popup capture:177-237]`

| Target | Markup |
|---|---|
| static shipping table | `.ins-kv.ins-ship` rows `td.k` |
| Update Shipping Details | `<button class="btn-update" onclick="opShipOpen()">Update Shipping Details</button>` — **absent once Delivered** |
| DO button | `<button class="btn-inv" onclick="opDo()">` — only once Arranged |
| popup | `#op-ship-dialog` inside `.ui-dialog.op-ship-dlg`, title `#ui-dialog-title-op-ship-dialog` "Update Shipping Details" |
| Delivery Date | `<input id="op-ship-date" readonly class="hasDatepicker">` `dateFormat:'dd-mm-yy'`; `#op-ship-date-err` |
| Delivery Status | `<select id="op-ship-status">` — **only the single legal next option** (`Arranged` from New; `Delivered` from Arranged); `#op-ship-status-err` |
| Consignment | `#op-ship-consign`, `#op-ship-consign-err` |
| Number of Device | `<span id="op-ship-devcount">6</span>` (text, not input) |
| serials | `#op-ship-serials` → `#op-ship-serial-grid` → `.op-ship-serial-cell.op-ship-serial-cell-l/-r` → `span.op-ship-serial-no` "1." + `<input class="op-ship-serial" maxlength="12" placeholder="type serial number">` + `<div class="op-err op-ship-serial-err" style="display:none">This field is required</div>`; locked state adds class `ship-locked` + `readonly` |
| hidden echo fields | `#op-ship-recipient`, `#op-ship-address`, `#op-ship-contact` |
| buttons | `.ui-dialog-buttonpane button` "Cancel" / "Update"; **no native confirm on Update** |

**FUTURE — EAINT-12349 (not built, SRD v0.2 body not read):** the one Delivery Date is planned to become two labels, "Ship Out Date" and "Delivered Date"; Ops selects the Delivered Date when setting Delivered. SRD v0.2 change remarks, verbatim: "Added delivered date picker rules", "Labels: Ship Out Date & Delivered Date", "No revert once marked Delivered", "Pending: delivered date picker range". Jira description row 4 states today's gap: "delivery date in Update Shipping Details is fixed to ship-out date, so OPS cannot record actual delivered date." `[from ticket EAINT-12349, Jira description rows 4-5 + SRD table row v0.2]` `[unconfirmed]` until built.

### 5.14 BO Appointment Calendar

`[verified: pages/bo/AppointmentCalendarPage.ts:19-55 class doc + body]`

| Target | Selector |
|---|---|
| month bar | `#cal-back`, `#cal-month-picker` (datepicker), `#cal-month-value` (hidden ISO month), `#cal-search`, `#cal-add-btn` |
| grid | `#cal-table tbody tr`; `td.cal-date span.cal-daynum` = **DD-MM-YYYY**; two `div.cal-cap` per row: "Morning - N" / "Afternoon - N (Full)" (count span gets class `full`) |
| appointments | morning/afternoon `td` → `ol.cal-ol > li` → `<a class="cal-rs" onclick="acRsOpen('<apptId>')">Reschedule</a>` + `<span class="cal-co">n. COMPANY NAME</span>` |
| Reschedule dialog | `#ac-rs-dialog` (jQuery UI): read-only `#ac-rs-name`, `#ac-rs-status`, `#ac-rs-ref`, `#ac-rs-cur`; `#ac-rs-date` (readonly datepicker); radios `input[name="ac-rs-slot"]` value `0`/`1`; Confirm/Cancel in `.ui-dialog-buttonpane`; **Confirm raises a native `confirm()`** → `page.once("dialog", d => d.accept())` |
| Add dialog | `#ac-add-dialog`: `#ac-add-name` + `#ac-add-search` (exact company name auto-binds hidden `#ac-add-cid`; **no `.ac_results` dropdown any more**); `#ac-add-ref-fld` → `#ac-add-refno` + `#ac-add-ref-search`; error signals `#ac-add-noreq` (no active request) and `#ac-add-alloc-no` (no allocation remaining); `#ac-add-date` datepicker; radios `#ac-add-slot-0` / `#ac-add-slot-1`; Confirm raises native `confirm()`; **the New/Existing Record radio is gone — Reference No. is always required** |
| datepicker | `#ui-datepicker-div`; month/year `select.ui-datepicker-month` / `select.ui-datepicker-year`; selectable day `td:not(.ui-state-disabled):not(.ui-datepicker-other-month) a.ui-state-default`; past = `ui-datepicker-unselectable ui-state-disabled`, weekend adds `ui-datepicker-week-end` |

Strategies that matter:

1. Open pickers programmatically: `jQuery("#ac-add-date").datepicker("show")` —
   a plain click can silently fail to reopen after a previous force-close.
   `[verified: pages/bo/AppointmentCalendarPage.ts:378-391, 517-528]`
2. Dismiss with `jQuery.datepicker._hideDatepicker()` + `display:none` + blur,
   then click the dialog title bar; the picker overlays the slot radios.
   `[verified: :241-264]`
3. `pickDatepickerDay(iso)` navigates month/year selects first; without that,
   a date in the next month silently fell back to "last selectable day of the
   wrong month". `[verified: :170-239]`
4. Poll `#ac-add-cid` / race `#ac-add-noreq` vs `#ac-add-alloc-no` instead of
   fixed sleeps. `[verified: :468-515]`
5. `addAppointment()` returns the **DD-MM-YYYY actually committed** (read back
   from `#ac-add-date`) or `null`; callers skip on null (arrange-else-skip).
   `[verified: :447-553]`

### 5.15 Company Management (BO) — used by the DO snapshot test

`input[name="name"]#name`, `#to-search`, result link
`a[href*="/view/account/company/edit.get"]` with company text; edit page
`input#name`, `input#registrationCompany`, `textarea#address`, `input#postCode`,
`input#phone`, `#to-update-company`.
`[verified: pages/bo/CompanyManagementPage.ts:16-26, 48; _reference/tickets/EAINT-12166/EAINT-12166-company-management-edit-details-uat1-2026-09-23.html]`

---

## 6. Step-by-step flows

### 6.1 Software Installation purchase (UCD)

1. `goto installation.do` → set quantity with the `.si-step` buttons (no limit
   on the number of installations). `[verified: pages/SoftwareInstallationPage.ts:28-35; from SRD EAINT-10960 v1.2 §2.3.2.1 #1.3 "No limit on the number of installation"]`
2. Click `#si-pay-btn` → `.ui-dialog` → `.confirm-dialog-btn` → wait for
   `slot.do?(id|txnId|transactionId)=`. **No gateway page**: the dialog is the
   whole payment step in the automated path. `[verified: pages/SoftwareInstallationPage.ts:43-49]`
   The SRD calls this payment "RHB direct debit" and the popup copy "Sure to
   proceed with payment?" with Back/X and Next. `[from SRD EAINT-10960 v1.2 §2.3.2.1 #2]`
3. On `slot.do`: `#si-alloc-total` = quantity bought; open a `td.si-book`
   cell → `#si-ovl` → `siStep(slot,+1)` per unit → `siSaveDate()` → repeat
   until `#si-alloc-count` = total → `siConfirmBooking()` → `submitted.do`.
   `[verified: pages/SlotPickerComponent.ts:332-385, 505-523]`
4. Confirming with units unbooked shows `#si-clienterr` and stays on `slot.do`.
   `[verified: specs/slot-capacity-boundary.spec.ts:125-157 · SC_SCB_TS07]`

### 6.2 Biometric Device Purchase (UCD)

1. Step 1 `purchase.do`: qty (`bioStep` buttons, or type + blur for the >40
   clamp), recipient, contact, showroom checkbox or address → `button.bio-btn.next`.
   `[verified: pages/BiometricPurchasePage.ts:48-112, 163-184]`
2. Step 2: optionally `#installOptOut`, optionally `#extraInstalls` via
   `#bio-extra-plus`; `#si-pay-btn` → confirm dialog → redirect.
   `[verified: :114-160]`
3. Branch on the redirect:
   1. install kept → `slot.do` with `#si-alloc-total` = devices + extra installs;
   2. opt-out ticked → **straight to `submitted.do`**; `slot.do` never renders.
   `[verified: pages/BiometricPurchasePage.ts:138-146 (live 2026-07-31); specs/slot-capacity-boundary.spec.ts:201-224 · SC_SCB_TS09]`
4. Booking on `slot.do` is **all-or-nothing** across free and paid units:
   partial booking is blocked (`#si-clienterr`); only the opt-out skips booking.
   `[verified: specs/slot-capacity-boundary.spec.ts:159-199 (TS08), 226-271 (TS10); from QA team, 2026-07-30/31]`
   The SRD says the opposite in one sentence ("the free installation slots need
   not be selected to proceed as it is optional") and the same in the next
   (highlighted: "Booking a slot is mandatory for every installation requested —
   both the free entitlement and any paid"). The live behaviour is all-or-nothing.
   `[from SRD EAINT-11880 v1.2 §2.3.2.1 #3.5 — internal contradiction; live wins]`
5. Leaving `slot.do` without booking leaves the free install unallocated against
   a fresh reference — this is how test data for BO Add Appointment and the
   12166/12167 suite is arranged. `[verified: utils/arrange.ts:5-15, 73-85]`
6. Step 4 Done → `receipt.do?id=`; the reference is read from the listing's
   top `BIOMETRIC_PURCHASE` row, not from the submission page.
   `[verified: utils/arrange.ts:87-96; specs/create-bdp.spec.ts:50-57]`

### 6.3 UCD self-service reschedule

1. Listing → Search Now → find a row with `a.sc-resubmit:has-text("Reschedule")`
   (only SI requests with Tx Status Pending expose it). `[verified: pages/ServiceRequestListingPage.ts:202-209; from SRD EAINT-10960 v1.2 §2.3.2.2 #3.2]`
2. Click → `.sc-modal` → tick `#sc-resched-all` → `.sc-btn-confirm` →
   `reschedule.do?id=…&apptIds=…`. The selected appointment(s) are **already
   removed** on arrival. `[verified: :162-200]`
3. Pick a new `td.si-book` → `siStep` → `siSaveDate()` → `#si-confirm-booking` →
   dialog "Are you sure you want to reschedule? By proceeding you will **lose**
   your current appointment." → `.confirm-dialog-btn` → Done.
   `[verified: pages/ReschedulePage.ts:48-68, 90-150; config.ts:80-83 (live: "lose", SRD: "lost")]`
4. Entering via `ReschedulePage.navigate(txnId)` directly (bypassing the modal)
   still shows the old booking; `rescheduleToNewDate()` then clears it first
   (`siRowRemove` + save + poll `.si-bookbadge` gone). `[verified: pages/ReschedulePage.ts:70-133]`
5. Re-saving the same booked date then confirming raises *some* `.ui-dialog`;
   the wording is "tbc" in the QA doc. `[verified: specs/reschedule-handling.spec.ts:257-291 · SC_RH_TS13]`
   The BDP SRD says same date+slot is blocked with "The new appointment date and
   time slot must be different from the current appointment." `[from SRD EAINT-11880 v1.2 §2.3.2.2 #2 v (highlighted); not confirmed live]`

### 6.4 BO listing → details → Complete / Fail / Cancel

1. `main.do` → fill filters (Date Requested From/To mandatory per SRD; code
   only fills what it is given) → `#sc-search` → wait for the `listing/list`
   response, not networkidle. `[verified: pages/bo/SoftwareInstallationListingPage.ts:141-195; from SRD EAINT-10960 v1.2 §2.3.2.5 #1.3]`
2. View → strip `target` → `detail.do` (wait `/detail\.do/`). `[verified: :346-373]`
3. Mark Completed: `.btn-success` → dialog "Installation Completed" → Yes.
   `[verified: pages/bo/SoftwareInstallationDetailsPage.ts:58-70]`
4. Mark Failed: `.btn-fail` → radio `op-fail-reason` → (Other → textarea) → Yes.
   `[verified: :87-116]`
5. Cancel from the listing: `a[onclick*="scCancel"]` → `#sc-cancel-dialog`
   "Sure to cancel?" → affirmative button (matched `/yes|ok|confirm/i`, else first).
   `[verified: :375-394]`

### 6.5 BO Appointment Calendar — reschedule and add

1. Listing → `#sc-appt-cal` → `#cal-table`. `[verified: pages/bo/AppointmentCalendarPage.ts:60-70]`
2. Reschedule: `a.cal-rs` → `#ac-rs-dialog` → show `#ac-rs-date` picker → pick
   day (last selectable by default) → `input[name="ac-rs-slot"][value=n]` →
   Confirm → accept native `confirm()` → networkidle. `[verified: :306-311, 370-407]`
3. Add: `#cal-add-btn` → company → `#ac-add-search` → wait `#ac-add-cid` →
   reference → `#ac-add-ref-search` → race error divs → date → slot → Confirm →
   native confirm → dialog closed = success. `[verified: :456-553]`
4. CSE calendar dates: past and weekends disabled; today, tomorrow and dates
   beyond 2 months **enabled** (no +2 blackout, no 2-month window for CSE).
   `[verified: :266-299 (live); specs/bo-calendar-limits.spec.ts:230-371]`
5. Full sessions: CSE can still add/reschedule into a "(Full)" session; the
   count keeps numbering past the cap. `[verified: specs/add-appointment-bo.spec.ts:75-173; specs/bo-calendar-limits.spec.ts:373-434; from SRD EAINT-10960 v1.2 §2.3.2.7 #2.3]`

### 6.6 BDP shipping and DO (BO)

Covered in [flow-device-purchase.md](flow-device-purchase.md). Summary of the
chain the suite drives: `arrangeBdpReferenceViaUCD` → BO listing search
`{referenceNo, deliveryStatus:"New"}` → View → `openUpdateShippingDetails` →
`setDeliveryDate` (dd-MM-yyyy) → `setConsignmentNumber` → `fillSerialNumbers(uniqueSerials(n))`
→ `setDeliveryStatusToNextOption` → `submitUpdateShippingDetails` → DO number
matches `/^\d{8}\/DP-\d{4}/` → `downloadDeliveryOrder()` (window.open popup →
download, PDF rendered to PNG evidence).
`[verified: specs/device-purchase-do-ts01.spec.ts:59-130; pages/bo/DevicePurchaseDetailsPage.ts:151-310; utils/pdf.ts; utils/download-evidence.ts]`

---

## 7. Decision points and branches

| Fork | Condition | Branches | Source |
|---|---|---|---|
| Which id scheme is in the URL | deployment | `id=` (current) / `transactionId=` / `txnId=` — read, never assume | `[verified: pages/BasePage.ts:30-51]` |
| After BDP Make Payment | `#installOptOut` ticked? | yes → `submitted.do`; no → `slot.do` | `[verified: pages/BiometricPurchasePage.ts:138-160]` |
| Can Confirm proceed | `#si-alloc-count` == `#si-alloc-total` | no → `#si-clienterr`, stay; yes → `submitted.do` | `[verified: specs/slot-capacity-boundary.spec.ts:125-157]` |
| Day cell state | class | `si-book` openable; `si-muted` greyed; `si-fullday` refuses to open (`openSlotModal` throws); not rendered = outside 2-month window | `[verified: pages/SlotPickerComponent.ts:82-115, 395-412]` |
| Per-session room | `#si-cap0/1` | "N of M" → room = M−N; "fully booked" → 0; stepper refuses past 3 | `[verified: :414-451; specs/slot-capacity-boundary.spec.ts:36-68]` |
| Slot taken by another user before Confirm | server | `#si-uovl` popup "Sorry, some selected time slot are booked. Please try again with another time slot or dates." | `[verified: specs/slot-capacity-boundary.spec.ts:470-474, 557-566; config.ts:77-78]` |
| Reschedule link present | SI request **and** Tx Status Pending | else no link; Resubmit may be present instead (same class) | `[verified: pages/ServiceRequestListingPage.ts:151-209]` |
| Reschedule calendar entry | via listing modal vs direct URL | old booking already removed vs still present | `[verified: pages/ReschedulePage.ts:114-121]` |
| Booked date inside +2 blackout | `si-muted` | cannot open → skip removal; confirm discards it anyway | `[verified: pages/ReschedulePage.ts:108-113]` |
| `#si-next` at window end | `style` contains `hidden`, or attribute missing (reschedule calendar), or click times out (3 s) | stop paging | `[verified: pages/SlotPickerComponent.ts:525-561]` |
| BO View | `target="_blank"` | strip target or lose the `page` handle | `[verified: pages/bo/SoftwareInstallationListingPage.ts:346-373]` |
| BO account has listing access | `input[name="requestedFrom"]` present | absent → no listing access (also no update access) — a positive UAR finding | `[verified: pages/bo/SoftwareInstallationListingPage.ts:95-107; specs/user-access-regression.spec.ts:142-150]` |
| Add Appointment company search | exact name | binds `#ac-add-cid`; partial/ambiguous → stays empty, no error | `[verified: pages/bo/AppointmentCalendarPage.ts:428-446]` |
| Add Appointment reference search | state of the reference | `#ac-add-noreq` / `#ac-add-alloc-no` / cancelled → text "cancelled" / expired → text `/expired|invalid|not found/i` | `[verified: :491-515; specs/add-appointment-bo.spec.ts:205-208; specs/bo-calendar-limits.spec.ts:469-472]` |
| Delivery Status select | current status | one option only: New→Arranged, Arranged→Delivered; Delivered → button gone | `[verified: pages/bo/DevicePurchaseDetailsPage.ts:82-104, 211-226]` |
| Serial save | validation | blank "This field is required"; <8 "Device Serial No. must be between 8 and 12 characters."; 13th char never enters (`maxlength=12`); symbols/Chinese stripped live; duplicate → later field "Duplicate serial number." (inline, first occurrence unflagged) | `[verified: specs/device-purchase-do-ts08.spec.ts:67-203 (live 2026-09-24)]` |
| [DO] click | Report Engine state | popup page with PDF download, or popup showing "Delivery Order could not be generated. Please try again." | `[verified: pages/bo/DevicePurchaseDetailsPage.ts:295-346; specs/device-purchase-do-ts04.spec.ts:85-89]` |
| Service type at DO time | SI-only vs BDP | SI-only never shows [DO] or shipping; BDP shows [DO] once Arranged | `[verified: specs/device-purchase-do-ts07.spec.ts:65-110]` |

---

## 8. Business rules the flow enforces (authority file per value)

Full text in eauto-service-hub.md; the ones a script must know, with where the
value lives so they are not copied:

| Rule | Authority | Source |
|---|---|---|
| 3 per session, 6 per day, 2 sessions (10am–12pm, 2pm–4pm) | `ENV.slotCapacity` | `[verified: config.ts:29-33; from SRD EAINT-10960 v1.2 §2.3.2.1 #4 rule 2]` |
| UCD cannot book today or tomorrow; earliest = today+2 | `ENV.reschedule.blackoutDays = 2`; `BasePage.earliestRescheduleDate()` | `[verified: config.ts:35-45; pages/BasePage.ts:113-115; specs/calendar-rules.spec.ts:54-60]` — the SRD's "from the next day onwards" (§2.3.2.1 #4 rule 1) is **weaker** than the live calendar, which greys tomorrow too |
| Calendar shows current + following month only | `ENV.calendar.monthsVisible = 2` (assert) vs `searchMonthsAhead = 6` (arrangement only) | `[verified: config.ts:47-62]` |
| Weekends and public holidays greyed (holidays purple, Google Calendar list) | `ENV.publicHoliday` per run | `[verified: specs/calendar-rules.spec.ts:81-99; from SRD EAINT-10960 v1.2 §2.3.2.1 #4 rule 4]` |

> **CONFLICT — EAINT-12088 reschedule buffer base (added 2026-10-26, `[unconfirmed]` pending BA).**
> 1. Repo rule (row above): "UCD cannot book today or tomorrow; earliest = today+2" — `ENV.reschedule.blackoutDays = 2`, counted **from today**.
> 2. Jira EAINT-12088 counts the +2 buffer **from the last greyed-out PH day**. [source: Jira EAINT-12088 description, Additional Requirements #2, read 2026-10-26: "PH falls on Sunday → replacement PH observed on Monday. Monday slot is greyed out (not selectable). UCD can select Tuesday slot. Earliest reschedule date is Wednesday (standard +2 day buffer applies from Monday)."] [source: same, #3: "Earliest reschedule date is Thursday (standard +2 day buffer applies from Tuesday, the last greyed-out day)."] [source: same, #4: "PH handling only greys out the affected date(s) from being selectable; the standard +2 day advance rule then applies as normal from that point."]
> 3. Also unclear: Scenario A lets the UCD "select Tuesday slot" but gives "Earliest reschedule date is Wednesday" — booking and reschedule may follow different rules.
> 4. Do not change `blackoutDays` or `earliestRescheduleDate()` until the BA (Batrisyia) answers. 12088 status Code Review, no SRD. [source: _reference/tickets/Studying/EAINT-12088/EAINT-12088-study.md §10 #4, #5]
| CSE: no date limit, no slot cap | code comment + BO specs | `[verified: config.ts:43; specs/bo-calendar-limits.spec.ts]` |
| 15-minute slot lock after Confirm (SRD) — the suite waits the literal 15 min and checks the slot is still confirmable / clash popup appears | `FIFTEEN_MIN_MS` | `[verified: specs/slot-capacity-boundary.spec.ts:5-6, 378-567; from SRD EAINT-10960 v1.2 §2.3.2.1 #5.4 note]` |
| Pricing SI RM50 + 8% SST = RM54; device RM850 (no SST) | `ENV.pricing` | `[verified: config.ts:64-69; from SRD EAINT-11880 v1.2 §2.3.2.3 #6]` |
| Purchase quantity cap 40, "+" disables at 40, typed 41 corrects to 40 | — (EAINT-12166 REQ-007) | `[verified: specs/device-purchase-do-ts02.spec.ts:27-37; knowledge/flow-device-purchase.md]` |
| Mark Failed reasons | `ENV.failedReasons` | `[verified: config.ts:92]` |
| Exact copy asserted | `ENV.text` | `[verified: config.ts:73-89]` |
| Export filename | `SoftwareInstallationListingPage.expectedExportFilename()` | `[verified: pages/bo/SoftwareInstallationListingPage.ts:396-405]` |
| DO number `YYYYMMDD/DP-NNNN`, sequence continues same day | regex in TS01/TS04 | `[verified: specs/device-purchase-do-ts01.spec.ts:100; ts04:132-141]` |
| Serial uniqueness is system-wide | `uniqueSerials()` | `[verified: utils/serials.ts]` |
| DO installation count printed in words = qty + extras | `installationCountWords()` | `[verified: utils/words.ts]` |

---

## 9. Preconditions and test data

1. **Shared, persistent staging.** Nothing resets; the near-term calendar is
   routinely exhausted; capacity shifts between scan and act. Finders page up to
   6 months ahead and `allocateUnitsAnywhere()` re-scans up to 10 times.
   `[verified: config.ts:54-62; pages/SlotPickerComponent.ts:349-385]`
2. **Every scenario arranges its own data or skips.** Pattern: arrange via UCD
   on the same `page`, re-login as BO, `test.skip(true, reason)` on `null`.
   One browser, sequential logins — `LoginPage.login()` always re-navigates to
   `/public/login/` and re-submits, so account switching mid-test is safe.
   `[verified: utils/arrange.ts:17-33; specs/add-appointment-bo.spec.ts:44-52]`
3. **Fresh BDP reference** = `arrangeBdpReferenceViaUCD(page, {deviceQty, additionalInstalls, skipInstall, shipToShowroom, deliveryAddress, bookSlot})`.
   `bookSlot:true` books a random slot for all installs (used when installs ≤ 5
   so the DO shows appointment dates); default leaves it unbooked (what BO Add
   Appointment needs). Returns the top `BIOMETRIC_PURCHASE` row's reference.
   `[verified: utils/arrange.ts:31-99; specs/device-purchase-do-ts01.spec.ts:23-28]`
4. **Fresh SI reference** = `SoftwareInstallationPage.purchaseInstallation(n)` then
   the top `SOFTWARE_INSTALLATION` row. `[verified: specs/device-purchase-do-ts07.spec.ts:23-36]`
5. **A booked appointment to reschedule** = buy 1 SI, `findDateWithRoom(1)`,
   `allocateUnitsAnywhere(1, date)`, `confirmAppointment()`.
   `[verified: specs/reschedule-handling.spec.ts:36-46]`
6. **Reschedulable row for view-only checks** = first listing row with the
   Reschedule link; verify `#si-grid` attached before trusting it.
   `[verified: specs/slot-capacity-boundary.spec.ts:280-304]`
7. **Dates found by predicate**, never offsets: `findDateMatching(info => …)` over
   `DateSlotInfo {date, dayUsed, dayTotal, dayRoom, morning{booked,max,room}, afternoon{…}}`;
   wrappers `findDateWithRoom`, `findDateWithSlotRoom`, `findDateWithSlotFull`,
   `findFullyBookedDate`, `findEmptyBookableDate`, `findAnyBookableDate`.
   `[verified: pages/SlotPickerComponent.ts:12-19, 159-324]` BO counterpart
   `AppointmentCalendarPage.findDateMatching` scans the **visible month only**,
   skips past dates, needs no modal. `[verified: pages/bo/AppointmentCalendarPage.ts:108-141]`
8. **Capacity-cap checks never save** — they assert the stepper value
   (`getStepperValue`) refuses to exceed 3, so the shared calendar is untouched.
   `[verified: pages/SlotPickerComponent.ts:430-442; specs/slot-capacity-boundary.spec.ts:30-68]`
9. **Second UCD** (`EAUTO_UCD2_*`) for TS23/TS24: opened in
   `openTrackedContext(browser, testInfo)` so its video records; closed with
   `closeTrackedContext(ctx, testInfo, "UCD B books the same slot")`.
   `[verified: utils/tracked-context.ts; specs/slot-capacity-boundary.spec.ts:446-463]`
10. **Second BO** (`EAUTO_BO2_*`) for TS02 Officer B; leg skips if blank.
    `[verified: specs/device-purchase-do-ts02.spec.ts:82-85]`
11. **Public holiday** must be keyed per run; **Expired** records
    (2 months unclaimed, nightly cron) and **dev-patched** states (TS10/22,
    APBO_TS06/07) cannot be arranged — those tests skip or are excluded.
    `[verified: specs/reschedule-handling.spec.ts:7-14, 175-187; specs/add-appointment-bo.spec.ts:26-29; from SRD EAINT-10960 v1.2 §2.3.2.2 #2 v]`
    **CONFLICT — EAINT-12087 vs SRD EAINT-10960 on the expiry cron (added 2026-10-26, `[unconfirmed]` pending BA).**
    1. Jira EAINT-12087 says no expiry cron exists and asks for one at 60 days. [source: Jira EAINT-12087 description, read 2026-10-26: "No cronjob currently exists to auto-expire installation slot transactions when the UCD does not proceed with the paid/free slot after payment. Such transactions remain unresolved indefinitely."] [source: same: "Payment made on 27.07.2026 → slot valid until 25.09.2026 → cronjob runs on 26.09.2026 and marks the transaction as expired."]
    2. SRD EAINT-10960 v1.2 already describes a daily cron at 2 months. Wording as distilled in this repo (the SRD text itself is not saved in the repo): "Expired when no installation (free or paid) is claimed within 2 months of purchase (buy 6 July → expire 7 September); enforced by a **daily cron** that flips installation and transaction records; applies to SI and BDP." [source: knowledge/eauto-service-hub.md §Service Request status lifecycle #5, from SRD EAINT-10960 v1.2 §2.3.2.2 #2.6 v]
    3. Code reading also names an existing job (ServiceHubAppointmentExpiredJob, daily 01:00). [unconfirmed] [source: lib/eautoFlows/modules/service-hub.ts:131-133]
    4. Open: is 12087 a new job or a change to the existing one; 60 days from payment vs 2 months from purchase; SI only or also BDP free installation. [source: _reference/tickets/Studying/EAINT-12087/EAINT-12087-study.md §Open questions #1, #2, #4]
12. **Pre-release records** (TS05) are found by stepping one-month windows
    backwards from `RELEASE_CUTOFF = 2026-09-14` and verifying the row's own Date
    Requested; read-only. `[verified: specs/device-purchase-do-ts05.spec.ts:46-110]`
13. **Company Details edits are restored in `finally`** (TS03) — the UCD test
    account's address/phone are shared data. `[verified: specs/device-purchase-do-ts03.spec.ts:101-108]`
14. **Safety:** no real money moves — the "payment" is a jQuery confirm; no
    gateway. `[verified: pages/SoftwareInstallationPage.ts:43-49]` Serial/consignment
    values are timestamp-unique (`TS01${Date.now()}`.slice(-12), `uniqueSerials`).
    `[verified: specs/device-purchase-do-ts01.spec.ts:72-73]`
15. **Runner inputs:** Shopping Cart page takes env, headless, Detailed, UCD/BO/UCD2
    creds, Public Holiday, Reference No; selected scenario **titles** are joined
    into `--grep`. 12166 page adds BO2 and a Resume button for TS04's manual
    gate (`PW_GATE_DIR/<gateId>.waiting.json` ↔ `<gateId>.resume`, 20-min
    default). Create BDP takes qty/extra/skip + UCD creds only.
    `[verified: app/eauto/shopping-cart/page.tsx:26-156; app/api/eauto/shopping-cart/run/route.ts:195-220; app/api/eauto/12166/run/route.ts:246-271; utils/manualGate.ts; app/api/eauto/bdp-creator/run/route.ts:49-61]`

---

## 10. Traps

Each has cost a debugging session; the cross-module ones are also in quirks.md.

1. **Attach `waitForURL` before `siConfirmBooking()`**; `networkidle` alone
   returns before its async request even starts. `[verified: pages/SlotPickerComponent.ts:496-523]`
2. **Waiting only for `slot.do` hangs on the BDP opt-out path.** `[verified: pages/BiometricPurchasePage.ts:138-146]`
3. **`.si-badge` reads "N Available"/"Full"**, not "Slot n/6" — the old regex made
   every finder think used=0. `[verified: pages/SlotPickerComponent.ts:131-145]`
4. **A stray `#si-ovl` swallows every click**, including `#si-next`. Both
   `openSlotModal()` and `goNextMonth()` close it first. `[verified: :387-412, 539-545]`
5. **Off-by-one month paging**: guard `if (m >= maxMonthsAhead) break;` before
   `goNextMonth()`; the reschedule calendar can drop `#si-next` entirely.
   `[verified: :62-80, 546-553]`
6. **`getAttribute()` on a zero-match locator waits to timeout** — check
   `.count()` first; an unrendered date is simply not bookable. `[verified: :82-92]`
7. **A date can be bookable while one session is full**; per-session room is
   only inside the modal. `[verified: :231-256]`
8. **`siSaveDate()` closes the modal before its save request lands**; clicking a
   new date too early leaves the next modal unopenable — poll the
   `.si-bookbadge` away first. `[verified: pages/ReschedulePage.ts:70-88]`
9. **`a.sc-resubmit` is shared by Reschedule and Resubmit.** `[verified: pages/ServiceRequestListingPage.ts:151-160]`
10. **The listing header is a `<th>` row inside `<tbody>`** (UCD and BO) — use
    `tbody tr:has(td)`. `[verified: pages/ServiceRequestListingPage.ts:93-100; pages/bo/SoftwareInstallationListingPage.ts:207-210]`
11. **BO View opens `target="_blank"`** — the page object strips it. `[verified: pages/bo/SoftwareInstallationListingPage.ts:346-373]`
12. **BO Search is AJAX**; `#sc-combined-tbl` is already "visible" with the
    previous rows — wait for the `listing/list` response. `[verified: :175-189]`
13. **BO date inputs ignore `.value`** — use `datepicker("setDate")`; values are
    DD-MM-YYYY. `[verified: :109-139]`
14. **Update Shipping Details' Delivery Date is `dd-MM-yyyy`**; ISO saves 200 OK
    with no date and blocks the next transition. `[verified: pages/bo/DevicePurchaseDetailsPage.ts:123-166]`
15. **No native confirm on Update** — an armed `page.once("dialog")` would
    swallow an unrelated later dialog. `[verified: :251-270]`
16. **Hardcoded serials collide with your own previous run** (system-wide
    uniqueness) and the rejected save leaves Delivery Status at New. `[verified: utils/serials.ts:1-16]`
17. **Serial error divs are always in the DOM** (`display:none`, default text
    "This field is required") — assert visibility, not text. `[verified: specs/device-purchase-do-ts08.spec.ts:79-92]`
18. **`.fill()` bypasses the live character stripping** — use
    `pressSequentially()` or a clipboard paste to exercise it. `[verified: :116-128]`
19. **BO reschedule/add Confirm is a native `confirm()`**, not a jQuery dialog.
    `[verified: pages/bo/AppointmentCalendarPage.ts:399-406, 538-545]`
20. **Datepicker reopen/dismiss races** — see §5.14 strategies. `[verified: :241-264, 378-394]`
21. **Datepicker fallback picks the wrong month silently** unless month/year
    selects are driven first. `[verified: :170-183]`
22. **`#cal-table` has no "blocked" concept** — the real gate is the dialog
    datepicker. `[verified: :266-281]`
23. **BO calendar days are DD-MM-YYYY**; convert from ISO. `[verified: :72-86]`
24. **`new Date().toISOString().split("T")[0]` rolls the date back before 08:00
    MYT** — use `BasePage.formatLocalDate()` (the debug script still has the bug).
    `[verified: pages/BasePage.ts:89-101; scripts/debug-reschedule.ts:159-162]`
25. **Login redirect races the next `goto()`** — both listing page objects
    re-navigate once if their anchor button is missing. `[verified: pages/LoginPage.ts:24-32; pages/bo/AppointmentCalendarPage.ts:61-70]`
26. **`browser.newContext()` records no video** — use `openTrackedContext()`. `[verified: utils/tracked-context.ts:5-16]`
27. **[DO] fires `window.open`** — the download and any error text live on the
    popup page, not `this.page`; the recording never shows the PDF, so it is
    rendered to PNG. `[verified: utils/download-evidence.ts; pages/bo/DevicePurchaseDetailsPage.ts:295-346; utils/pdf.ts:49-78]`
28. **Playwright ran each `test()` in its own worker despite `workers: 1`** —
    module-level result arrays are lost; write per-test files. `[verified: specs/user-access-regression.spec.ts:35-48]`
29. **Detailed mode (`PW_DETAILED=1`, default on) adds ~1.4 s per highlighted
    step** — timeouts scale to 240 s; scans wrap in `suppressDemo()`.
    `[verified: playwright.config.ts:6-15; pages/BasePage.ts:138-176]`
30. **Runner matches by exact `test()` title**; a UI title that drifts matches
    nothing. `[verified: app/eauto/shopping-cart/page.tsx:29-32; app/api/eauto/shopping-cart/run/route.ts:195]`
31. **TS04 run outside the dashboard**: the manual gate no-ops, so the Report
    Engine legs run against a live engine; run it from `/eauto/12166`.
    `[verified: utils/manualGate.ts:21-36; specs/device-purchase-do-ts04.spec.ts:16-22]`
32. **The Add Appointment fallback date is "last selectable day of the displayed
    month"** and the follow-up `getSlotCount()` only scans the displayed month —
    use the returned date, never an offset. `[verified: specs/add-appointment-bo.spec.ts:55-72]`
33. **Automation-generated 12-char all-caps serials overflow the 300 px
    `.ins-serials` box** and collapse the two-column display (EAINT-12408) —
    a layout defect, not a data error. `[from _reference/tickets/EAINT-12167/Session-Handoff-2026-09-25-12167.md §1]`

---

## 11. What is NOT covered

1. **BDP step 2 (payment/options) has no capture**; its URL and the free-install
   stepper the SRD describes are unverified. `[unconfirmed]`
2. **The Service Hub dashboard tiles' real ids**, the SI step-1 page HTML and
   `slot.do` / `reschedule.do` / `submitted.do` (SI variant) HTML are not saved
   under `_reference/html/eauto/` — selectors come from page objects that were
   derived from the live DOM but the pages themselves were never kept.
   `[verified: ls _reference/html/eauto — no service-hub UCD captures besides the 12166 three]`
3. **Payment failure path** (RHB "Wang di dalam akaun RHB anda TIDAK MENCUKUPI",
   Tx Status → Cancelled, no retry, Back only) — SRD only, never driven.
   `[from SRD EAINT-10960 v1.2 §2.3.2.1 #2.4; SRD EAINT-11880 v1.2 §2.3.2.1 #6]`
4. **Resubmit** link flow. `[from SRD EAINT-10960 v1.2 §2.3.2.2 #3.3]`
5. **Emails** (confirmation / reschedule) — only the listing proxy is checked.
6. **Same-day reschedule outcome** (SC_RH_TS01 removed, done manually); the
   remark/status contradiction is recorded in eauto-service-hub.md.
7. **SC_RH_TS09** (Friday-only), **TS10/TS22** (dev-patched holiday),
   **TS12/TS24** (expected behaviour TBC), **APBO_TS06/07** (dev-patched Expired).
   `[verified: specs/reschedule-handling.spec.ts:7-14, 189-196, 247-255; specs/add-appointment-bo.spec.ts:26-29]`
8. **CSE-vs-Ops permission differences** (cancel authority, Export access) —
   one BO account is used for everything.
9. **Concurrency (optimistic lock) dialogs** `#op-concurrent-dialog` /
   `#op-installstate-dialog` — captured, never triggered. `[from SRD EAINT-11880 v1.2 §2.3.2.6 #9]`
10. **Invoice / e-Invoice content** — only that a PDF downloads. `[verified: specs/device-purchase-do-ts01.spec.ts:120-124]`
11. **Export content** — only the filename helper exists. 
12. **BO "Date Requested From auto-sets To"** — team-reported, not captured.
13. **Change Main User / Account Termination** (EAINT-11881/11882) — not studied.
14. **UCD listing filters by date / payment date** — present in the page object,
    never asserted.
15. **12166 gaps** (incomplete-details error, next-day DO reset, 25-device
    uneven split, 21-field DO mapping) — see flow-device-purchase.md and the
    2026-09-25 handoffs.


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- BO Reconciliation Summary Listing (EAINT-12018) and Consolidated e-Invoice listing (EAINT-12027, closed). [jira: EAINT-12018 2026-07]
- Known email defect: dash in the reschedule email subject shows as ? (not RFC 2047 encoded; Mailtrap 2026-07-15). [azfar: automation/src/data/email-contracts.ts]
- [unconfirmed] Permission for the main user to let a sub user buy the device is in requirement gathering. [jira: EAINT-12164 2026-08]
- Multi-appointment requests roll up into one Tx Status (EAINT-11956); Status filter has Cancelled (EAINT-11912); Reference No. excludes the transaction id (EAINT-11913). [jira: EAINT-11956] [jira: EAINT-11912] [jira: EAINT-11913]


## Additions from Charmain's QA repo — Special Remark for CSE, EAINT-12131 (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). **Status: her notes and a draft ledger (BO-SERVICE-HUB-BDP-SI, 36 entries, none with a case), not verified live by us.** Built from her pack (40 cases TC-01 to TC-40, 39 Pass, 1 N/A as of 2026-08-19). (doc) = SRD states it; (obs)/(dim) = her observation or reasoning; QA rulings 17–19 Aug 2026 are QA decisions. Tag: `[charmain-repo: <path>:<line>]`.

1. Ticket: EAINT-12131 "Enable CSE to Update Special Remark on Shopping Cart Listing"; dev ticket CCB-890. SRD v1.0 07.08.2026 (v0.1 06.08.2026 word for word the same). SRD kept outside her repo (REQ-004 names five staff logins). Not in our repo. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:3-15] [charmain-repo: docs/modules/bo/service-hub-bdp-si/README.md:44-45]
2. SRD's page path: "Service Hub > Biometric Device Purchase & Software Installation > Transaction Details page". [charmain-repo: docs/modules/bo/service-hub-bdp-si/README.md:28]
3. Before 12131: CSE "not able to type or update" the Special Remark (§2.2.2 item 1). After: CSE may type, edit and save (REQ-001, REQ-002); Ops unchanged (REQ-003, "OPS can still edit and save the Special Remark; no change"); REQ-004 names five CSE logins, the CSE team has six. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:42-46,174-176]
4. REQ-002: "after saving, the 'Special Remarks' column in the Listing shows 'Yes'". The cell shows "Yes", never the text. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:182-186]
5. REQ-001/002 say "Biometric Device Purchase" only, while §2.1.1 and §2.2.3 name the shared BDP & SI page; the build allows SI too. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:345]
6. The sixth CSE (not named in REQ-004) was refused 17 Aug and allowed from 18 Aug 2026; pack ruled "yes" 18 Aug. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:169-173,344]
7. CSE still cannot edit the delivery fields (Delivery Status, Delivery Date, Delivery Order Number, Consignment Number, Recipient, Shipping Address) and has no Update Shipping Details. SI has no delivery section. (obs) [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:196-198]
8. Save flow (obs): browser confirm "Sure to update special remark?", then "Special Remark Update Successful". [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:309-311]
9. Max 500 characters: 500 saves in full; typing or pasting more stops at 500, no error (obs, no SRD). Spaces around a remark are trimmed; spaces-only saves as empty and the flag stays "No". [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:252-254,306-308]
10. **Encoding defect:** Chinese, Arabic, emoji, Word em dash or curly quote come back as other characters (an em dash as three); damage happens at save. Seen also on another module's Special Remark and as Ops; pack set it outside 12131 as an older platform defect. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:243-248,351]
11. The remark is held **per appointment**: two appointment rows of one request keep their own remark and flag. The export has a Special Remarks Yes/No column but no column naming the appointment. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:284-295,350]
12. CSE has **no Export control** on the listing; Ops has one (pack ruled intended 19 Aug 2026). [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:319-321,346]
13. Remark editable on Pending, Failed, Arranged and Cancelled; not yet seen on Completed. Later save wins with no warning. The dealer never sees the Special Remark on UCD. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:278-283,355,364]
14. Trap: a refused save request is answered with the sign-in page at HTTP 200, so only the stored remark shows whether a save was refused. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:338]
15. Audit logging of a remark change: pack called it "struck through in the SRD" and out of scope; neither SRD version mentions it. [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:354]
16. Open: should a cleared remark set the flag back to "No"? Do Hub Admin, Admin, Probation, Finance reach the module at all? Which other BO pages carry a Special Remark (e.g. STMS enquiry)? [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:357-360]
17. Consistency note: §2 of this file lists six CSE logins from SRD 10960 / 11880; Charmain's 12131 SRD REQ-004 grants five of the six. Not a conflict about who is CSE; a conflict about who may edit the remark (point 6). [charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:45]
