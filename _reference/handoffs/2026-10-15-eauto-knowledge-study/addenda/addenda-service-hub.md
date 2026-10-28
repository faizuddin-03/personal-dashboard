# Addenda for other knowledge files — from the Service Hub study (2026-10-15)

Each entry: target file → section → text to add (provenance included).

---

## knowledge/eauto-portals.md → "Portals and roles"

1. Add after the CSE bullet: Ops and CSE are the two BO roles the SRDs name
   for this module, with login IDs. Ops: kmcheah, jasons, mfared, nikmuhamad,
   eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni. CSE: eautochinwei,
   eautohamal, eautojrjaya, eautoxiayuan, kokping, eautomie. CSE cannot cancel a
   Biometric Device Purchase and has no Export access.
   `[from SRD EAINT-10960 v1.2 §2.2.3; SRD EAINT-11880 v1.2 §2.2.3]`
2. UCD role split: Software Installation is open to all UCD users; Biometric
   Device Purchase to the main user only. `[from SRD EAINT-10960 v1.2 §2.2.3 "UCD"]`

## knowledge/eauto-portals.md → "Credentials"

Add `EAUTO_BO2_USER / _PASS` — a second BO Hub Admin account used only for
EAINT-12166 TS02's "Officer B" check; the leg skips when blank.
`[verified: tests/service-hub/utils/config.ts:11-14; specs/device-purchase-do-ts02.spec.ts:82-85]`

## knowledge/eauto-portals.md → "URL structure"

1. The UCD Service Hub pages: `/view/ucd/service-hub/view.do` (dashboard),
   `installation.do`, `purchase.do`, `installation/slot.do`,
   `installation/submitted.do`, `installation/reschedule.do`, `listing.do`,
   `receipt.do`. `[verified: tests/service-hub/utils/config.ts:104-116]`
2. BO Service Hub API endpoints seen live: listing search
   `GET /api/admin/service-hub/listing/list.get`; shipping save
   `POST /api/admin/service-hub/biometric/update-shipping.do`; UCD purchase
   `POST /api/ucd/service-hub/purchase/create.do`; UCD invoice
   `/download/ucd/service-hub/invoice-pdf.do?transactionId=`.
   `[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html:21; specs/device-purchase-do-ts02.spec.ts:108; selection-step capture form action; SR-details capture]`
3. The live reschedule URL carries a second param:
   `reschedule.do?id=<txn>&apptIds=<uuid[,uuid]>`.
   `[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:172]`

## knowledge/eauto-portals.md → "Login redirect chain"

BO accounts without listing permission land on `main.do` with `#sc-search`
present but **without** `input[name="requestedFrom"]` — that absence is the
"no listing access" signal. `[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:95-107 (live 2026-09-24)]`

---

## knowledge/quirks.md → "Legacy portal / navigation"

1. **BO listing "View" opens `target="_blank"`.** A page object holding one
   `page` loses the tab; strip the attribute before clicking.
   `[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:346-373]`
2. **BO listing Search is AJAX** (`listing/list.get`); the results table is
   already "visible" with stale rows, so wait for the response, not networkidle.
   `[verified: same file:175-189]`
3. **`[DO]`, Invoice and e-Invoice fire `window.open()`** — the download and
   any error page appear on a popup page; checks against `this.page` time out.
   `[verified: tests/service-hub/utils/download-evidence.ts; pages/bo/DevicePurchaseDetailsPage.ts:313-346]`

## knowledge/quirks.md → "Modals"

1. **Reschedule and Resubmit share `a.sc-resubmit`** on the UCD listing — match
   on text. `[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:151-160]`
2. **`siSaveDate()` closes the modal before its request lands**; opening the
   next date too early leaves `#si-ovl` never appearing. Poll `.si-bookbadge`.
   `[verified: tests/service-hub/pages/ReschedulePage.ts:70-88]`
3. **jQuery datepicker singleton (`#ui-datepicker-div`)**: after a forced
   dismiss, a plain click may not reopen it — call
   `jQuery("#id").datepicker("show")`; dismiss by `_hideDatepicker()` +
   `display:none` + clicking the dialog title bar.
   `[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts:241-264, 378-394]`
4. **The datepicker fallback silently picks a day in the wrong month** unless
   month/year selects are driven first. `[verified: same file:170-183]`
5. **Details-page Yes/No buttons are plain `.ui-dialog-buttonpane button`**,
   not `.confirm-dialog-btn`. `[verified: tests/service-hub/pages/bo/SoftwareInstallationDetailsPage.ts:72-85]`

## knowledge/quirks.md → "Dates"

**BO listing date inputs ignore `.value` + `change`** — set them with
`$el.datepicker("setDate", new Date(y,m-1,d))`, DD-MM-YYYY display; selecting
From auto-sets To = From + 1 month and results sort latest-first.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:109-139; from QA team (Faizuddin) 2026-09-24 per specs/device-purchase-do-ts05.spec.ts:29-39]`

## knowledge/quirks.md → "Reading the calendar"

**Listing headers are `<th>` rows inside `<tbody>`** on both the UCD and BO
Service Hub listings — select `tbody tr:has(td)`.
`[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:93-100; pages/bo/SoftwareInstallationListingPage.ts:207-210]`

## knowledge/quirks.md → "Test-artefact plumbing"

1. **Playwright ran every `test()` in a fresh worker despite `workers: 1`**;
   module-level result arrays were lost. Write per-test result files.
   `[verified: tests/service-hub/specs/user-access-regression.spec.ts:35-48 (live 2026-09-24)]`
2. **Inline error divs are always in the DOM** (`display:none`, default text
   "This field is required") — assert visibility, not `textContent`.
   `[verified: specs/device-purchase-do-ts08.spec.ts:79-92]`
3. **`.fill()` bypasses per-keystroke input filtering**; use
   `pressSequentially()` or clipboard paste to exercise live stripping.
   `[verified: specs/device-purchase-do-ts08.spec.ts:116-128]`
4. **Hardcoded serial numbers collide with the previous run** (uniqueness is
   system-wide); the rejected save leaves Delivery Status at New.
   `[verified: tests/service-hub/utils/serials.ts:1-16]`
5. **A manual gate (`PW_GATE_DIR`) no-ops outside the dashboard**, so a test
   that relies on a human pause behaves differently under `npx playwright test`.
   `[verified: tests/service-hub/utils/manualGate.ts:21-36]`

---

## knowledge/eauto-payments.md → new short section "Service Hub (SI/BDP) payment"

1. The SRDs describe the Service Hub payment as "RHB direct debit" with a
   confirmation popup "Sure to proceed with payment?" (Back/X, Next); failure
   shows RHB's reason, logs a Failed attempt, blocks retry (Back only) and sets
   the transaction to Cancelled. `[from SRD EAINT-10960 v1.2 §2.3.2.1 #2; SRD EAINT-11880 v1.2 §2.3.2.1 #6]`
2. In the automated path there is no gateway page: `#si-pay-btn` →
   `.confirm-dialog-btn` → `slot.do`/`submitted.do`.
   `[verified: tests/service-hub/pages/SoftwareInstallationPage.ts:43-49; pages/BiometricPurchasePage.ts:147-160]`
3. RHB Payment Reference format: Ref 1 `SR{YYYYMMDD}{6-digit running}-{Company ID}`;
   Ref 2 `SOFTINSTALL/`, `BIODEV/`, `SOFTINSTALL_BIODEV/`. Live example on the
   UCD details page: `RHB (SR20260923000002-1109700) - OK`.
   `[from SRD EAINT-10960 v1.2 §2.3.2.4; verified: EAINT-12166 SR-details capture]`
4. Pricing: SI RM50 + 8% SST = RM54; device RM850, no SST.
   `[verified: tests/service-hub/utils/config.ts:64-69; from SRD EAINT-11880 v1.2 §2.3.2.3 #6]`

---

## knowledge/automation-playbook.md → "How the dashboard runs it"

1. Three runners share `tests/service-hub/playwright.config.ts`:
   `/api/eauto/shopping-cart/run` (SC_* suites, env `EAUTO_PUBLIC_HOLIDAY`,
   `EAUTO_REF_NO`, `EAUTO_UCD2_*`), `/api/eauto/12166/run` (E2E TS01-08, adds
   `EAUTO_BO2_*`, `PW_GATE_DIR`, registers the run in `lib/eautoRunRegistry.ts`,
   publishes evidence to `public/qa-artifacts/eauto-12166/<ts>/`, keeps 10 run
   folders), `/api/eauto/bdp-creator/run` (`--grep "create-bdp"`, result JSON
   via `PW_RESULT_PATH`), `/api/eauto/user-access-regression/run`
   (`PW_UAR_ACCOUNTS`, `PW_RESULT_PATH` as a directory).
   `[verified: app/api/eauto/shopping-cart/run/route.ts:195-220; app/api/eauto/12166/run/route.ts:32-49, 246-271; app/api/eauto/bdp-creator/run/route.ts:49-61; specs/user-access-regression.spec.ts:14-18]`
2. Manual gate mechanism: `waitForManualResume(page, gateId, message)` writes
   `<PW_GATE_DIR>/<gateId>.waiting.json`, `/api/eauto/12166/live-log` surfaces
   it as `[GATE:waiting:<id>] <msg>`, the Resume button posts
   `/api/eauto/12166/resume` which touches `<gateId>.resume`; default wait 20 min.
   `[verified: tests/service-hub/utils/manualGate.ts; app/api/eauto/12166/live-log/route.ts; app/api/eauto/12166/resume/route.ts]`
3. Evidence naming: `testIdFromTitle()` recognises `SC_SCB_TS11: …` and
   `12166_67_E2E_TS01`; extra contexts are labelled via `closeTrackedContext(ctx, testInfo, label)`
   → `<ID> - <label>.webm`; PDFs are rendered to PNG with `renderPdfToEvidence()`.
   `[verified: lib/testEvidence.ts:31-32; tests/service-hub/utils/tracked-context.ts; utils/pdf.ts:60-78]`
4. Detailed mode: `PW_DETAILED=1` (default on) → `BasePage.demoHighlight/demoPause`,
   ~1400 ms per step (`PW_DETAILED_DELAY`), test timeout 240 s; finders wrap
   scans in `suppressDemo()`. `[verified: tests/service-hub/pages/BasePage.ts:138-220; playwright.config.ts:6-15]`

---

## knowledge/flows.md → "Modules with no flow document yet"

Remove "Service Hub (SI/BDP appointments, partly covered by `tests/service-hub`)" —
it now has `flow-service-hub.md`.

## knowledge/README.md and knowledge/flows.md → index rows

See the final report (rows supplied there).

---

## _reference/html/README.md → "eauto/" table (note only; file not edited)

The BO listing capture `bo-biometric-device-purchase-software-installation-listing.html`
(uat1, 2026-09-22) is not listed in the README index table.
