# eMOVE — standalone logistics service (flow)

**Draft — not yet walked on a live environment (2026-10-26).** eMOVE is not
built in production: "eMOVE is not found anywhere in eauto prod code (0e21bef3db,
2026-10-22)" `[from lib/eautoFlows/modules/wholesale.ts line 372]`. Every line
below comes from Jira, Teams or Miro. No DOM handle is recorded.

Ticket: **EAINT-12019** "🔴[eAuto-UCD] eMOVE – Standalone Logistics Service".
Jira status REQ REFINEMENT IN PROGRESS -EAUTO. Miro column "26TH NOV DEPLOYMENT
(SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)", card fields all
blank `[from _reference/tickets/Studying/EAINT-12019/EAINT-12019-miro-card.md]`.

Tag used on every behaviour line: `[unconfirmed — from <source>, not seen live]`.
Summary-level mirror of this flow also sits in
[flow-wholesale.md](flow-wholesale.md) § "Flow: Logistics (delivery) and
standalone eMOVE"; this file is the detailed draft.

## 0. Source status

1. **SRD v0.8 is NOT in the repo.** Latest = "SRD_EAINT-12019_v0.8_20261021.docx"
   (uploaded 2026-10-21 10:53). No PDF. It is a draft — no v1.0 baseline yet.
   `[from _reference/tickets/Studying/EAINT-12019/EAINT-12019-study.md §2 item 6]`
2. **Mockups NOT in the repo:** "EAINT-12019_eMOVE_Logistics_UCD_20261009.html",
   "..._Backoffice_20261009.html", "..._Driver_PickUp_20261009.html",
   "..._Driver_DropOff_20261009.html". `[same, §2 item 7]`
3. Read: Jira description (via the study file, verbatim rows), Jira SRD version
   table remarks, Jira Remarks field, Teams CR group
   `_reference/teams/EAINT-12019-eMOVE-Standalone-Logistics.md` (2026-08-26 to
   2026-10-14), Teams sweep `EAINT-12019-teams-since-2026-10-16.md`.
4. **Action:** drop SRD v0.8 and the four 20261009 mockups into
   `_reference/tickets/Studying/EAINT-12019/`.

## 1. Why this flow matters

1. Existing behaviour: "Logistic arrangement is only available after a wholesale
   buy/sell is confirmed." and "Finance arrangement from Wholesale to Finance is
   currently done manually." `[from Jira EAINT-12019 description row 4, via study §4]`
2. Why: "broaden the logistic reach under the eAuto wholesale marketplace."
   `[from Jira EAINT-12019 description row 3]`
3. BA framing: "there is nothing related to the wholesale flow, this is the
   logistics standalone module. which eAuto already subscribe the logistic service,
   other than just provide the service to wholesale customer, actually they can
   expand the service to more customer on using logistics service."
   `[from Teams EAINT-12019, 2026-08-28 12:25, Mei Jia Chee (BA)]`
4. Size: "It's a large, multi-repo ticket (58 requirements across 4 flows)"
   `[from Teams EAINT-12019, 2026-08-26 17:34, Nur Izfarwiza (dev, since left) — about SRD v0.1]`.

## 2. Entry points

1. **UCD Portal › eMOVE** — own module. "eMOVE — new standalone module in UCD Portal.
   Confirmed 26.08.2026: not placed under STMS (eSTM & UCD to UCD)."
   `[unconfirmed — from Jira EAINT-12019 description row 2, not seen live]`
2. Gate: "Available after UCD-to-UCD (interstate transfer) and eSTM (approved) are
   complete." `[unconfirmed — from Jira description row 5 item 2, not seen live]`
   Sources for the gate: [flow-ucd-to-ucd.md](flow-ucd-to-ucd.md) (Interstate) and
   [flow-estm.md](flow-estm.md) (approved eSTM).
3. Earlier placement question (superseded): "Nurul will confirm with Ket Ming again
   on the entry points (whether to have standalone module or in the UCD to UCD & eSTM
   flow)" `[from Jira Remarks field, Mei Jia, 16.07.2026]`.
4. **Driver pages** — Pick Up and Drop Off scan pages (mockup names only).
5. **BackOffice** — pages named by the first dev, never confirmed: "eMOVE Transaction
   Listing, Transaction Details, and Logistics Charges Matrix Setup — is that the
   complete list?" `[from Teams EAINT-12019, 2026-08-28 10:27, dev question; BA did not answer]`
6. **Finance** — "Finance module for vendor payment requests, with payment-status
   tracking." `[unconfirmed — from Jira description row 5 item 6]`

## 3. Flow steps (Jira description row 5, verbatim)

`[unconfirmed — from Jira EAINT-12019 description row 5, not seen live]`

1. "Offer the logistic service as a standalone module in the UCD Portal, with its own entry point."
2. "Available after UCD-to-UCD (interstate transfer) and eSTM (approved) are complete."
3. "UCD clicks eMOVE to request car delivery; the system arranges the pickup/delivery
   schedule and charges accordingly (follow the charges matrix)."
4. "Driver scans a QR code to upload photos and update delivery status."
5. "Invoice and e-invoice generated after payment is made."
6. "Finance module for vendor payment requests, with payment-status tracking."

### Search / eligibility check (SRD §2.2.6)

1. v0.7: "Removed JPJ Approved Date limit in Sections 2.2.4 and 2.2.6"; "Added
   Wholesale conflict check in Section 2.2.6". `[unconfirmed — from Jira SRD version table v0.7, 19.10.2026]`
2. v0.8: "Updated Search message and check order in Section 2.2.6". `[unconfirmed — from Jira SRD version table v0.8, 21.10.2026]`
3. Branches (inferred, need SRD): vehicle not from an Interstate UCD to UCD or
   approved eSTM → blocked; vehicle in a Wholesale deal → "Wholesale conflict"
   blocked. Messages unknown.

### Request, fee and payment

1. Transfer options: "Door-to-Door and Hub-to-Hub."
   `[unconfirmed — from Jira description row 6]`
2. Fee: "Logistics fee auto-calculated by distance, vehicle type, delivery method,
   and location accessibility." ... "Charges matrix to be confirmed." `[same]`
3. Interstate tiers (shared with Wholesale): "Up to 250: base 300. 251-400: base 450.
   401-600: base 650. Over 600: base 1,000." `[from flow-wholesale.md, EAINT-12119 — Done]`;
   SRD v0.5 "Added Sections 2.2.15 and 2.2.16 from EAINT-12119".
4. Payment: v0.6 "Confirmed Trans Type and RHB Ref 2 in Section 2.2.9" `[from Jira SRD version table]`.
5. Payee: "emove payment will go to eAuto Sdn Bhd ya. / for wholesale part will go to
   eAuto Digits which is related to the ticket EAINT-11884"
   `[from Teams EAINT-12019, 2026-10-14 18:27, Mei Jia Chee]`
6. After payment: invoice and e-Invoice (row 5 item 5).

### Delivery (driver)

1. "Driver scans a QR code to upload photos and update delivery status." (row 5 item 4)
2. QR and DO reuse Wholesale: "the QR and Delivery Order use the existing flow and
   template / there are no changes on QR and delivery order in this ticket"
   `[from Teams EAINT-12019, 2026-09-15 14:21, Mei Jia Chee]`. Wholesale logistics
   = EAINT-11731, see [flow-wholesale.md](flow-wholesale.md).
3. Photo storage: "for emove photo i store in s3 ya" `[from Teams EAINT-12019, 2026-10-14 10:19, Wei Ting Lim (dev)]`.
4. Driver details: v0.7 "Added Logistics Driver details in Section 2.2.19"; v0.8
   "Added server-side messages in Sections 2.2.11 and 2.2.19". `[from Jira SRD version table]`
5. Open: QR-first (Wholesale style) or QR **or** reg-no as alternate paths
   (REQ-060) — unanswered `[from Teams EAINT-12019, 2026-09-17 10:43, dev question]`.

### BackOffice listing, cancellation, retry

`[unconfirmed — from Jira SRD version table remarks, SRD body not read]`

1. v0.8 "Added Service column in Section 2.2.5".
2. v0.8 "Moved Delivered Date column in Section 2.2.11".
3. v0.8 "Updated cancellation handling in Section 2.2.12".
4. v0.8 "Corrected Retry, Resubmit, Re-arrange and filter notes".

### Finance / vendor payment

1. "Vendor payment via MotoHub (create PO → payment request), paid monthly by
   quantity of completed jobs." `[unconfirmed — from Jira description row 6]`
2. v0.8 "Added SST Payment Report in Section 2.2.12". `[from Jira SRD version table]`

## 4. Emails and notifications

1. v0.7: "Confirmed Delivery Order number, email and legal pages in Section 2.2.15".
2. v0.8: "Added logistics email recipients in Section 2.2.15".
   `[unconfirmed — from Jira SRD version table; recipients, subjects and bodies not read]`
3. No email text is in the repo.

## 5. Regression named

1. "for wholesale part will need to regress, maybe on DO generation + qr scanning,
   since we will share those between emove and wholesale logistic"
   `[from Teams EAINT-12019, 2026-10-14 16:10, Wei Ting Lim]`
2. Wholesale TS are chatbot-driven and manual only — Wholesale regression here is manual.
3. Entry sources: UCD to UCD Interstate completion, eSTM approval.
4. EAINT-12119 interstate tiers, EAINT-11824 pricing matrix (Hub-to-Hub = Door-to-Door + RM200 per flow-wholesale.md).

## 6. Preconditions and test data (planned)

1. UCD account with a completed **UCD to UCD Interstate** transfer and an **approved
   eSTM**. eSTM can be made by `scripts/eauto-estm` (never edit `estm-legacy`).
2. Driver access to Pick Up / Drop Off pages on a phone.
3. BO and Finance logins.
4. Charges matrix values — "to be confirmed".
5. Test env not stated in Jira or Miro.

## 7. Open conflicts and questions

1. **Readiness vs date:** SRD still v0.8 draft, status REQ REFINEMENT, Miro dates all TBC.
2. **Vehicle type in fee:** Jira row 6 lists "vehicle type"; dev noted acceptance
   criteria "only cover distance tier + door surcharge + eAuto Fee + SST"
   `[Teams 2026-08-28 10:27]`. BA reply: "i dont think is the suitable time to answer u anything".
3. **Charges matrix:** "to be confirmed" vs EAINT-12119 tiers vs EAINT-11824 +RM200.
4. **Distance source:** lookup table fixed or editable — unanswered (2026-08-28).
5. **Hub master list:** own or same as Wholesale — unanswered (2026-09-10 14:49).
6. **QR per transaction or general** — BA pointed to Wholesale flow (2026-09-15).
7. **REQ-060 driver path** — QR-first vs alternate reg-no entry — unanswered.
8. **Wholesale conflict check** — definition needs SRD.
9. **Finance / MotoHub** — in this release or later.
10. **Requirement meeting** with Nurul, 2026-10-24 11:00, Meeting Room 1 — outcome not posted
    `[from Teams EAINT-12019, 2026-10-21 10:54, Mei Jia Chee]`.
11. **QA owner** not assigned. Dev = Wei Ting Lim (Teams 2026-10-11 21:47); Jira Developer field empty.

## 8. Related tickets

1. EAINT-11731 — Wholesale logistics flow (Done); QR + DO reused.
2. EAINT-12119 — Interstate price tier, Wholesale and standalone (Done 2026-10-16).
3. EAINT-11824 — Logistics pricing matrix (Closed 2026-08-07).
4. EAINT-11884 — RHB for eAuto Digits (Wholesale payee; To Do).
5. EAINT-12378 — Wholesale logistics full payment RHB "RE" error (To Do).
6. EAUTO-936 — source request.

## 9. Not covered

1. Every URL, page and DOM handle.
2. SRD v0.8 body: §2.2.4–2.2.19 content, messages, email recipients, cancellation rules.
3. Driver page layout and photo rules.

## 10. SRD v0.8 body (text copy read 2026-10-27)

Source for every line here unless stated: `_reference/tickets/Studying/EAINT-12019/SRD_EAINT-12019_v0.8_20261021-text.md`.
Mockups dated 20261009 (UCD, Backoffice, Driver_PickUp, Driver_DropOff) and their
`-text.md` copies sit in the same folder. SRD is still a v0.8 draft: every line is
`[from ticket EAINT-12019, SRD v0.8 — draft, not seen live]`.

### 10a. Entry and eligibility

1. **Entry:** "Selecting Logistics from UCD Portal home navigates to eMOVE Logistics landing page." (§2.2.4 REQ-001)
2. **Landing buttons:** "TRANSACTION LISTING" and "CREATE NEW LOGISTICS". (§2.2.4 REQ-002)
3. **Source transactions:** "It is available for transactions approved in STMS and eSTM, including UCD-to-UCD interstate transfer." (§2.2.4 REQ-003)
4. **No date limit:** "No limit is applied on the JPJ Approved Date." (§2.2.4 REQ-003)
5. **Search check order** (§2.2.6.1 REQ-030): "1. The vehicle has no Approved STMS or eSTM. ⏎ 2. The Used Car Dealer company is not the buyer or seller of that transaction. ⏎ 3. The vehicle already has an open eMOVE request."
6. **Who can request:** buyer or seller company of the source transaction (REQ-030 check 2). A non-party "sees the same message as a vehicle with no approved transaction, and is never told that another dealer has an eMOVE in progress." (REQ-030)
7. **Search fail popup:** "There is no approved STMS or eSTM for this vehicle under your company." (REQ-030)
8. **Vehicle fields** (REQ-031): Engine No and Chassis No prepopulated and read-only; "Vehicle Make & Model and Manufacturing Year are mandatory and must be completed before Next."
9. **Vehicle types:** "Only the first 3 vehicle types are supported in this phase: Sedan / Hatchback, SUV / MPV and Pickup / 4x4." Motorcycle and Commercial / Lorry are "greyed out and labelled (Coming Soon)". (§2.1.1 assumption 5)

### 10b. Charges (§2.2.7)

1. **Tier source:** "Logistics Fee is the tier price for the measured distance. ⏎ Tiers and rates follow EAINT-12119." (REQ-093)
2. **Tier ranges (KM):** 0 to 250 / 250.001 to 400 / 400.001 to 600 / 600.001 and above, base 300.00 / 450.00 / 650.00 / 1,000.00 `[from ticket EAINT-12119, SRD v1.3 §2.2.5 REQ-003 — see teams-decisions-by-ticket.md § EAINT-12119 item 7]`
3. **Distance:** "Distance is measured by road between the 2 points on the request." "A request that cannot be measured does not reach Step 2." (REQ-094)
4. **Door-to-Door:** "RM200.00 per Door-to-Door leg. Hub carries no charge." Example "Door-to-Door at both ends ⏎ a. RM400.00 in total." (REQ-095)
5. **eAuto Fee and SST:** "eAuto Fee is RM0.00 per transaction." "An eAuto Fee of RM0.00 gives an SST of RM0.00." (REQ-096, REQ-097)
6. **Shared matrix:** "Wholesale and eMOVE share 1 charges matrix." (REQ-098)
7. **Stale price popup:** "The logistics price has been updated. The charges shown have been refreshed. Please review the new amount before continuing." (§2.2.6.3 REQ-076)

### 10c. Statuses, Resubmit, Cancel, expiry

1. **Status combinations** (§2.2.5.2 REQ-027), verbatim rows:
   1. "Created, not yet paid: Payment "-", Delivery "-", Tx Status "Pending""
   2. "Payment failed: Payment "Failed", Delivery "-", Tx Status "Failed""
   3. "Dealer retries and pays: Payment "OK", Delivery "Pending Pick-Up", Tx Status "Pending""
   4. "Vehicle picked up: Payment "OK", Delivery "In Transit", Tx Status "Pending""
   5. "Vehicle delivered: Payment "OK", Delivery "Delivered", Tx Status "Completed""
   6. "Pick-Up or Drop-Off failed: Payment "OK", Delivery "Pick-Up Failed" or "Delivery Failed", Tx Status "Failed""
   7. "Cancelled or expired: Payment and Delivery unchanged, Tx Status "Cancelled" or "Expired""
   8. "Row 6 is final unless BackOffice re-arranges the job, which returns the request to row 3."
2. **Resubmit:** "Click to reopen Step 2 for a saved request so the Used Car Dealer can complete payment. Displayed on the listing and on the Transaction Details page where Payment status is a dash, Pending or Failed, the same as the Service Hub Resubmit link." (REQ-076)
3. **Cancel — SRD contradicts itself:**
   1. UCD listing REQ-026: "Transaction Status "Pending", or "Failed" with no payment made: both Used Car Dealer and BackOffice user can cancel."
   2. BO listing §2.2.10.2 REQ-116: "Cancel is available in BackOffice only and is not offered on the UCD Portal."
   3. Cancel remark format: "CANCELLED BY {username} on {DD-MM-YYYY HH:mm}" (REQ-116). Unsettled; ask the BA. `[source: pipeline EAINT-12019, Elf scenarios, 2026-10-27]`
4. **45-day expiry** (§2.2.6 REQ-029): "A daily housekeeping cron job runs at 2am, processes records in batches of 100"; "A transaction with Payment status OK is never expired, whatever its delivery status."; "Cancelled By - set to 99000/cronjob"; Remarks "Transaction Expired". Follows EAINT-638.
5. **Transaction No format** example: "EM690000019" (§2.2.5.1 REQ-007).

### 10d. Delivery Order and emails (§2.2.15)

1. **DO numbers:** "Pick-Up copy Delivery Order number is EM690000025P." / "Drop-Off copy Delivery Order number is EM690000025D." (REQ-166 example)
2. **DO email:** "From: wholesale@eauto.my ⏎ To and CC: wholesale@eauto.my and the logistics partner". "Addresses are held as settings and can differ per environment without a code change." (REQ-166)
3. **Failed Pick-Up / Drop-Off email:** "To: wholesale@eauto.my only ⏎ The Used Car Dealer is not emailed". (REQ-166)
4. **Attachments:** "2 PDFs, named Delivery Order Pick-Up Copy and Delivery Order Drop-Off Copy." (REQ-166)
5. **Staging recipient unknown.** Past Wholesale TS expected "CC: mytriodistribution@gmail.com" (Wholesale v3, sheet "EAINT-11731" R20), an outside address. Check staging settings with the developer before triggering a DO email. `[source: pipeline EAINT-12019, Scout + Elf, 2026-10-27]` `[unconfirmed]`

### 10e. Logistics Driver (§2.2.17)

1. **Load a job:** "Logistics Driver scans a QR code or enters vehicle registration to load a Pick-Up job." (REQ-172)
2. **Still open:** "whether QR scan is delivered in this phase, or vehicle registration entry only, is pending confirmation by requestor." (REQ-172)
3. **Order:** "A Drop-Off scan is not accepted before Pick-Up is complete." (REQ-172)
4. **Popups:** "No active delivery order was found for this vehicle number." (REQ-172); "Vehicle number does not match the delivery order. Please check and try again." (REQ-174, wording marked open)
5. **Numbering trap:** in v0.8, REQ-060 is "Vehicle Type" on Step 2, not the driver path. The "REQ-060" in the 2026-09-17 Teams dev question (§7 item 7) used an older SRD numbering. `[unconfirmed]`

### 10f. Out of scope (§2.1.2)

1. "MotoHub vendor payment and finance module build" — "Detailed finance flow is tracked separately and only referenced in this document."
2. "BackOffice Logistics Charges Matrix Setup page build" — "eMOVE consumes that same matrix and does not build a second setup page."
3. "Non-UCD portals" and "Native Logistics Driver mobile application development".

### 10g. More SRD v0.8 rules (second pass, 2026-10-27)

Same source and tag as §10 unless stated. Found by `[source: pipeline EAINT-12019, Scout study "Knowledge candidates" 5–8, 10, 2026-10-27]`, quotes checked against the SRD text copy.

1. **Wholesale conflict** (§2.2.6.2 REQ-051): "A Used Car Dealer cannot create an eMOVE request while a Wholesale transaction for the same vehicle is paid and its logistics is not yet completed." Reverse: "A Wholesale transaction cannot be created while an eMOVE request for the same vehicle is in progress." Runs "on Step 1 when Next is clicked". Popup: "This vehicle has a Wholesale logistics job in progress. Please complete it before creating an eMOVE request."
2. **Hub leg** (REQ-050): "Only active, verified hubs with a location are offered." Same hub both legs: "charged at the lowest tier of the charges table, with no Door-to-Door charge". Popup: "No hub available in {State}."
3. **Step 1 Next** (REQ-052): "eMOVE has no Draft transaction status. A request is either not yet created, or created with Transaction Status Pending." Address popup: "We could not find the address. Please check and try again, or contact support at 03-27798899."
4. **ID formats** (§2.2.9):
   1. Trx No (REQ-108): "Template: EMYM0000001"; month "October: 0", "November: N", "December: D". Example "EM680000001".
   2. Payment ID (REQ-109): "Template: EMYYMMDD0000001". Example "EM2608050000001".
   3. Trans Type and RHB Ref 2 (REQ-110, REQ-112): "EMOVE".
   4. RHB Ref 1 (REQ-111): "Template: EMYYMMDD0000001-[Company ID]". Example "EM2608050000001-1040141".
5. **Payment ID reuse** (§2.2.11 REQ-160): "A retry re-uses the same Payment ID. A new Payment ID is taken only after a payment reset."
6. **BO roles and export** (REQ-156): "eMOVE BackOffice pages are available to the Admin and HubAdmin roles"; "No listing export is delivered in this phase."; "Special Remark is visible in BackOffice only".
7. **Photos** (REQ-157): "Photos are shown in BackOffice only. They are not displayed on the UCD Portal." 12 photos per set.
8. **Paid cancellation** (REQ-158): "The system records the cancellation only. No refund is processed by eMOVE."; "No automatic cancellation email is sent to the logistics partner in this phase."
9. **Re-arrange** (REQ-159): "The same Delivery Order is kept. No new Delivery Order number is issued." Failed Pick-Up returns to "Pending Pick-Up"; failed Drop-Off "returns to In Transit, as the vehicle has already been collected."
10. **QR** (§2.2.15 REQ-169): "Each copy carries 1 QR code in the Logistics Verification block. The code is static, never expires, and the 2 codes are different."
11. **DO email subject** (§2.2.16): "[eMOVE Logistic] Arrangement - [Pick-Up DO Number] / [Drop-Off DO Number] - [Vehicle Number]". Example "[eMOVE Logistic] Arrangement - EM690000019P / EM690000019D - WMJ7742".
12. **Failure evidence** (§2.2.19 REQ-184): "Minimum 1 photo." "Maximum 3 photos." "Maximum 10MB per photo." "File type: jpg, jpeg, png, webp." "iPhone HEIC photos are refused, with instructions to switch the camera format."
13. **Hub-to-Hub surcharge:** "Hub-to-Hub carries no additional charge." (§2.2.6.2, text copy line 230).
14. **DO field population** (§2.2.15 REQ-168): left blank for the driver: "1. Variant ⏎ 2. Transmission ⏎ 3. Mileage (km) ⏎ 4. Fuel Type / EV ⏎ 5. Date ⏎ 6. Lorry No". "Dates printed on the Delivery Order use DD-MM-YYYY, for example 20-10-2026." Two-line address prints on 1 line "joined with a comma and a space"; curly quotes print straight; long text "is cut off". "The database and the eAuto screens keep exactly what the Used Car Dealer typed. Only the printed PDF is adjusted."
15. **Trap — Wholesale DO values do not carry over.** Past Wholesale TS expected "WSS<8 digits>", "DD Mmmm YYYY" and prefilled Variant / Transmission / Mileage / Fuel `[Wholesale v3, sheet "EAINT-11731", R47–R61]`. eMOVE uses "EM…P" / "EM…D" (REQ-166), DD-MM-YYYY and blank driver fields (REQ-168). Do not reuse Wholesale DO expected values. `[source: pipeline EAINT-12019, Scribe related history trap 21, 2026-10-27]`

### 10h. More SRD v0.8 self-contradictions (ask the BA before TS)

`[source: pipeline EAINT-12019, Scout study "Open questions" 5, 2026-10-27]`

1. **Retry button** (REQ-090), two rules in one cell: "Displayed where Payment status is Pending or Failed, the same as BMK and STMS.Displayed only where the payment failed."
2. **When the transaction is created:** REQ-052 "create the transaction and open Step 2" at Step 1 Next vs REQ-088 "Payment approved ⏎ a. Transaction is created and Payment Status is "OK"."
3. **Failure email to the UCD:** REQ-166 "The Used Car Dealer is not emailed" vs REQ-186 Open "with the Used Car Dealer company email in copy".
4. **Delivered Date filter:** REQ-151 error "Delivered Date range cannot exceed 1 month." but the BO filter list has no Delivered Date filter `[unconfirmed — Scout reading of REQ-117–131]`.

### 10i. Mock-up 20261009 vs SRD v0.8

Mock-ups are older than SRD v0.6–v0.8; follow the SRD `[unconfirmed]`. `[source: pipeline EAINT-12019, Scout study "Mock-up vs SRD", 2026-10-27]`

1. Evidence photo: mock-up "each ≤ 5MB" vs SRD "Maximum 10MB per photo." (REQ-184).
2. Driver failure screen: mock-up "BackOffice and the UCD have been notified." vs SRD "the Logistics Driver page states that BackOffice has been notified." (REQ-166).
3. Make & Model / Year: mock-up "Auto-filled after Search" vs SRD "Keyed in by the Used Car Dealer" (REQ-031).
4. Mock-up REQ numbers do not match SRD v0.8 numbers. Quote SRD ids only.

## 11. Test traps carried over from Wholesale logistics and EAINT-12119

Found by `[source: pipeline EAINT-12019, Scribe related history "Known traps", 2026-10-27]`. Each applies to eMOVE only as far as eMOVE shares the code `[unconfirmed]`.

1. **Old flat fee means a bug:** "Think when test nvr put 400 / So if got 400 mean bug ady" `[Teams EAINT-12119, 2026-09-23 17:50, the developer]`.
2. **Price on screen is not live:** "after you update in backoffice, the website wont update update, it need to know price change from server / that why i said need to click pay" `[Teams EAINT-12119, 2026-09-25 11:59, the developer]`. eMOVE re-checks on Make Payment / Retry (REQ-076, §10b item 7).
3. **Request Approval cooldown:** "for the request approval failed, need to wait 1 mins / coz you just request, cannot request again in one min" `[Teams EAINT-12119, 2026-10-08 11:26, the developer]`.
4. **Distance source:** "i will impl with google api first, if google failed, fall back to open street map" `[Teams EAINT-12119, 2026-09-08 17:26, the developer]`.
5. **Hub-to-Hub skips address checks:** "1. Hub to Hub? If yes, skip every check below." `[Teams EAINT-12119, 2026-10-05 10:34, the developer]`.
6. **QR test needs one device:** "One device scan for both seller (UCD) & logistic (BO - Pickup QR) ⏎ 2. Same device scan for both buyer (UCD) & logistic (BO - Dropoff QR)" `[Wholesale v3, sheet "10 June 2026 Scope", R7 REQ_TS6]`.
7. **Time rules need a developer date patch:** "Dev patched to 2026-07-06 14:43:43.0" for the 24-hour Reject rule `[Wholesale v3, sheet "EAINT-11731", R103 11731_6JUL_TS4]`. Same likely for eMOVE 45-day expiry (REQ-029) `[unconfirmed]`.
8. **Old Wholesale transactions keep the old flow:** "Transaction should be old logistic flow" `[Wholesale v3, sheet "EAINT-11731", R110–R113, 11731_EXS_TS1–TS4]`. Include existing Wholesale transactions in DO + QR regression `[unconfirmed]`.
9. **Interstate setup:** "UCD A: AZFARAZO (must hold the vehicle)" and "UCD B sees "TO THUMB IN BY <created + 48 h>"" `[EAINT-12403 text copy, R33, R34]`.
10. **Failed RHB payment:** "RHB Transfer is IF by default: switch it to OK only to pay, then back to IF" `[EAINT-12403 text copy, R38]`.
