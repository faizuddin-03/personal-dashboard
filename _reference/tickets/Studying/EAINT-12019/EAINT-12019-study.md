<!-- Study of EAINT-12019. First written 2026-10-26 from Jira (Atlassian MCP, read only), Miro capture 2026-10-26,
     Teams export 2026-10-16 and repo knowledge/. Refreshed 2026-10-27 (Jira Scout, pass 1) from EAINT-12019-jira.md
     (captured 27/10/2026 3:49 pm). Refreshed 2026-10-27 (Jira Scout, pass 2) from EAINT-12019-jira.md (captured
     27/10/2026 6:55 pm), the SRD -text.md copies and the 17 mock-up -text.md copies now in this folder.
     SRD v0.8 body is now read in full through its text copy. -->

# EAINT-12019 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira Summary):** "🔴[eAuto-UCD] eMOVE – Standalone Logistics Service"
2. **Jira status:** **REQ REFINEMENT IN PROGRESS -EAUTO** (Type: Task). Jira Updated "2026-10-21T10:53:39.780+0800". `[EAINT-12019-jira.md items 2, 6; capture 27/10/2026 6:55:28 pm]`
3. **Priority:** Medium.
4. **Fix version:** "—" (none). **Exp. Deploy Date (cf 10087):** "—". **ETA for Testing (cf 10057):** "—". **[QA] Est Man-day (cf 10081):** "—". `[EAINT-12019-jira.md items 4, 7]`
5. **Labels:** "260720-260724, July2026, ProductBacklog". Commitment Month "Sept2026" `[from 2026-10-26 MCP read; not in the 2026-10-27 captures]`.
6. **QA (cf 10041):** "—" (empty). Miro card "- QA:" blank.
7. **BA / Assignee / Reporter:** Chee Mei Jia `[EAINT-12019-jira.md item 3]`.
8. **Developer (customfield_10040):** empty in Jira (2026-10-26 read). Teams: "if not mistaken, Wei Ting Lim will help on this ticket" `[Teams EAINT-12019, 2026-10-11 21:47, dev lead]`. Earlier dev Nur Izfarwiza (left).
9. **Request raised by:** "🔴eAuto Ops / Support Team". Source ticket: "EAUTO-936" `[Jira description row 6]`. SRD also names cross-department ticket "CCB-827 — EAUTO MOVE (eMOVE)" `[SRD v0.8 §1.5 row 3]`.
10. **Deployment date (Miro column):** **"26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)"** `[EAINT-12019-miro-card.md line 7]`. Jira has no date.
11. **Links / Sub-tasks / Parent:** "—" for all three `[EAINT-12019-jira.md items 8–10]`.
12. **Test env:** **not stated** in Jira, Miro or SRD v0.8. `[unconfirmed]` staging `/eauto` instance per standing memory.
13. **Latest SRD:** **v0.8, 21.10.2026** — still a draft. "This section records all modifications to the document until it reaches Version 1.0" `[SRD v0.8 §1.3]`. **188 requirements** (REQ-001 to REQ-188) `[SRD v0.8 Appendix]`.
14. **Portals (SRD):** "1. UCD ⏎ 2. BackOffice ⏎ 3. Logistics Driver" `[SRD v0.8 §2.2.1 row 2]`.

## Changes since last study (2026-10-27)

Compared: `EAINT-12019-jira.md` captured **6:55 pm** against the study pass written from the **3:49 pm** capture.

1. **Status:** **no change** — still "REQ REFINEMENT IN PROGRESS -EAUTO".
2. **Fix version:** **no change** — still "—".
3. **Jira Updated timestamp:** **no change** — still "2026-10-21T10:53:39.780+0800". No Jira edit since SRD v0.8 upload.
4. **Description:** **no change** (6 General Information rows and 8-row SRD table identical).
5. **New comments:** **none**. "## Comments (0)" `[EAINT-12019-jira.md line 37]`.
6. **New Jira attachments:** **none**. Same 25 files; newest still "SRD_EAINT-12019_v0.8_20261021.docx — 126374 bytes, 2026-10-21T10:53:39.793+0800".
7. **New in this folder (local, not Jira):**
   1. **Text copies of all 8 SRDs** (`*-text.md`, converted 27/10/2026 ~4:50 pm). SRD v0.8 body is **now read in full**.
   2. **All 17 mock-up .html files** plus their `-text.md` copies. The 4 latest (20261009) are read.
8. **Corrections to the previous pass (made wrong by the SRD body):**
   1. "SRD .docx files are NOT read" / "SRD body is still unread" — **wrong now**. v0.8 read via text copy.
   2. "The 17 mock-up .html files are still not in the folder" — **wrong now**.
   3. **Entry gate** — old QA scope said "available only after UCD to UCD interstate complete and eSTM approved". SRD widens it: "It is available for transactions approved in STMS and eSTM, including UCD-to-UCD interstate transfer." `[SRD v0.8 §2.2.4 REQ-003]`. Any one approved STMS, UCD to UCD or eSTM is enough, and the dealer must be buyer or seller (REQ-030).
   4. **Finance / MotoHub** — old QA scope item 9 listed "vendor payment request (MotoHub PO), payment-status tracking". SRD puts it **out of scope**: "MotoHub vendor payment and finance module build" — "Detailed finance flow is tracked separately and only referenced in this document." `[SRD v0.8 §2.1.2 row 1]`. Only the **SRD-side** SST Payment Report and listing reconciliation stay in scope.
   5. **Charges Matrix Setup in BO** — old QA scope item 10. SRD: "BackOffice Logistics Charges Matrix Setup page build" is out of scope; "eMOVE consumes that same matrix and does not build a second setup page." `[§2.1.2 row 5]`. Regression only.
   6. **Vehicle type in fee** (old open question 5) — **answered**. Fee is distance tier + Door-to-Door legs only: "Logistics Fee is the tier price for the measured distance." `[§2.2.7 REQ-093]`. Vehicle Type is "Field Mandatory: Optional" `[REQ-033]`. Jira row 6 ("auto-calculated by distance, vehicle type …") is out of date.
   7. **Charges matrix** (old open question 6) — **answered**: tiers from EAINT-12119; "RM200.00 per Door-to-Door leg. Hub carries no charge." `[REQ-095]`; "Wholesale and eMOVE share 1 charges matrix." `[REQ-098]`.
   8. **JPJ Approved Date window** (old open question 9) — **answered**: "No limit is applied on the JPJ Approved Date." `[REQ-003]`.
   9. **Wholesale conflict check** (old open question 8) — **answered** by REQ-051 (see Requirements §F).
   10. **Driver entry path "REQ-060"** — in v0.8, REQ-060 is "Vehicle Type" on Step 2. The driver question is now **REQ-172**, still open (see Open questions).
   11. **DO + QR "no changes"** (Teams 2026-09-15) — partly overtaken. SRD keeps the Wholesale **layout** but gives eMOVE its own **DO numbers** ("EM690000025P" / "EM690000025D") and **email subject** "[eMOVE Logistic] Arrangement - …" `[REQ-166, §2.2.16]`.
9. **Earlier pass (3:49 pm capture) vs 2026-10-26 study** — kept for history:
   1. No Jira change; SRD .docx files downloaded locally; Teams sweep 2026-10-16 to 2026-10-26 added (SRD v0.7, v0.8, dev added, Nurul meeting).
   2. Meeting date corrected: message sent Wed 2026-10-21 says "this coming Friday" → **2026-10-23** `[unconfirmed — worked out from the weekday]`; `knowledge/flow-emove.md` §7 item 10 says 2026-10-24 (a Saturday).

## Sources read

1. **`EAINT-12019-jira.md`** — Jira fields, description, comments (0), attachment list (25). Captured 2026-10-27 6:55 pm.
2. **`SRD_EAINT-12019_v0.8_20261021-text.md`** — **read in full** (651 lines, §1.0 to Appendix).
3. **Older SRD text copies** (v0.1–v0.7) — present; **not studied line by line** (superseded by v0.8). Only grepped for "Open:" / "pending confirmation": v0.7 has 7 hits, v0.8 has 8 (v0.8 adds "Open: IT list address is being prepared by IT." in REQ-166).
4. **Mock-ups (20261009, latest per SRD §1.5 row 9), text copies read:** `EAINT-12019_eMOVE_Logistics_UCD_20261009-text.md`, `..._Backoffice_20261009-text.md`, `..._Driver_PickUp_20261009-text.md`, `..._Driver_DropOff_20261009-text.md`.
5. **Older mock-ups** (20260806, 20260904, 20260914, 20260917) — text copies present, **not read** (superseded).
6. **`EAINT-12019-jira-comments.md`** — 0 comments, 0 worklogs; Remarks field (2 BA notes, 16.07.2026 and 21.07.2026). Read 2026-10-26.
7. **`EAINT-12019-miro-card.md`** — template only, every field blank.
8. **`EAINT-12019-teams-since-2026-10-16.md`** — Teams sweep 2026-10-16 to 2026-10-26 10:50.
9. **`EAINT-12019-related-history.md`** — past Wholesale / 12119 / 12403 TS rows and traps (Scribe, 2026-10-27).
10. **`_reference/teams/EAINT-12019-eMOVE-Standalone-Logistics.md`** — CR group 2026-08-26 to 2026-10-14 (via the 2026-10-26 study). `_reference/teams/_chat-list.md` lists the chat only.
11. **Knowledge:** `knowledge/README.md`, `knowledge/flow-emove.md` (incl. §10 SRD v0.8 body), `knowledge/flow-wholesale.md` §"Flow: Logistics (delivery) and standalone eMOVE", `knowledge/teams-decisions-by-ticket.md` §EAINT-12019, `knowledge/people-and-roles.md`, `knowledge/cr-ledger.md` row 25, `lib/ticketStudies.ts` (EAINT-12019 entry), `lib/eautoFlows/modules/wholesale.ts`.
12. **`_reference/tickets/EAINT-12019/`** — folder does not exist.
13. **The .docx files themselves** are not opened; their text copies are used (rule: read a .docx through its `-text.md`). Images inside the SRD are not kept in the text copy ("images not kept").

## What changes

1. **Portal:** "UCD Portal" `[Jira description row 1]`. SRD adds **BackOffice** and **Logistics Driver** pages `[SRD §2.2.1 row 2]`.
2. **Module:** "eMOVE — new standalone module in UCD Portal.  Confirmed 26.08.2026: not placed under STMS (eSTM & UCD to UCD)." `[Jira row 2]`
3. **What:** "It offers car logistics (arrangement & delivery) after a UCD-to-UCD interstate transfer or eSTM (approved) is complete." `[Jira row 3]`
4. **Why:** "Objective: broaden the logistic reach under the eAuto wholesale marketplace." `[Jira row 3]`
5. **Phase limit:** "eMOVE is an internal module for this phase. It applies only to STMS and eSTM approved transactions, including UCD-to-UCD interstate transfer." `[SRD §2.1.1 assumption 6]`
6. **Affected pages (SRD §2.2.3, verbatim names):**
   1. "UCD Portal — Home / Logistics Landing"
   2. "UCD Portal — Logistics Transaction Listing"
   3. "UCD Portal — Create Logistics Request (Wizard)"
   4. "UCD Portal — Transaction Details"
   5. "BackOffice — eMOVE Transaction Listing"
   6. "BackOffice — Transaction Details"
   7. "BackOffice — Logistics Hub" — "No change to this module."
   8. "Logistics Driver — Pick-Up & Drop-Off Scan"
7. **Pricing / vendor (Jira row 6):** "Transfer options: Door-to-Door and Hub-to-Hub.  Logistics fee auto-calculated by distance, vehicle type, delivery method, and location accessibility.  Vendor payment via MotoHub (create PO → payment request), paid monthly by quantity of completed jobs.  Charges matrix to be confirmed." — partly overtaken by SRD (see Changes item 8.6–8.7).

## Requirements

### Expected new behaviour (Jira description row 5, verbatim)

1. "Offer the logistic service as a standalone module in the UCD Portal, with its own entry point."
2. "Available after UCD-to-UCD (interstate transfer) and eSTM (approved) are complete."
3. "UCD clicks eMOVE to request car delivery; the system arranges the pickup/delivery schedule and charges accordingly (follow the charges matrix)."
4. "Driver scans a QR code to upload photos and update delivery status."
5. "Invoice and e-invoice generated after payment is made."
6. "Finance module for vendor payment requests, with payment-status tracking." — **out of scope per SRD §2.1.2 row 1**.

### SRD v0.8 key requirements (verbatim, by section)

**A. Entry (§2.2.4)**

1. **REQ-001:** "Selecting Logistics from UCD Portal home navigates to eMOVE Logistics landing page."
2. **REQ-002:** buttons "TRANSACTION LISTING" and "CREATE NEW LOGISTICS".
3. **REQ-003:** "No limit is applied on the JPJ Approved Date. A transaction approved at any time is eligible". Example 3: "No approved STMS, UCD to UCD or eSTM transaction for that vehicle ⏎ a. Used Car Dealer cannot proceed."

**B. UCD listing (§2.2.5)**

1. **Sort (REQ-004):** "newest first"; same time → "ordered by Transaction No in descending order."
2. **e-Invoice (REQ-005):** "An e-Invoice is submitted to LHDN only after payment succeeds."
3. **Filters (REQ-006–013):** Vehicle No. (partial match, max 10), Transaction No. (full match, max 20), Date Created From/To ("Mandatory unless another filter is set"; To auto = From + 1 month or today; popup "Please select From Date and To Date."), Service Type, Payment Status ("All, -, Pending, Failed, OK"), Tx Status ("All, Pending, Completed, Failed, Expired, Cancelled"), Delivery Status ("All, -, Pending Pick-Up, In Transit, Delivered, Pick-Up Failed, Delivery Failed").
4. **Service Type options (REQ-010):** "1. All ⏎ 2. Door-to-Door ⏎ 3. Hub-to-Hub ⏎ 4. Door Pick-Up / Hub Drop-Off ⏎ 5. Hub Pick-Up / Door Drop-Off"
5. **Columns (REQ-014–028):** #, Vehicle, Trx No, Created At ("DD-MM-YYYY HH:mm in 24-hour time"), **Service** (v0.8, "shown on the UCD Portal listing after Created At"), Pick-Up (state), Drop Off (state), Payment, Delivery, Tx Status, LHDN Response Status, Amount (RM), Remarks, Action.
6. **Status combinations (REQ-027):** 7 rows, e.g. "Payment failed: Payment "Failed", Delivery "-", Tx Status "Failed"" and "Row 6 is final unless BackOffice re-arranges the job, which returns the request to row 3."
7. **Cancel remark (REQ-025):** "CANCELLED BY eautoadmin on 25-09-2026 16:38" / "CANCELLED BY ucdberjaya on 25-09-2026 16:38".

**C. 45-day expiry (§2.2.6 REQ-029)**

1. "A daily housekeeping cron job runs at 2am, processes records in batches of 100". "Follows EAINT-638."
2. Eligible: "Request created but not yet paid", "Payment status Pending", "Payment status Failed". "A transaction with Payment status OK is never expired, whatever its delivery status."
3. On expiry: Tx Status "Expired", Remarks "Transaction Expired", "Cancel Flag - set to N", "Cancelled By - set to 99000/cronjob".

**D. Wizard Step 1 — vehicle (§2.2.6.1)**

1. **Search (REQ-030)** check order: "1. The vehicle has no Approved STMS or eSTM. ⏎ 2. The Used Car Dealer company is not the buyer or seller of that transaction. ⏎ 3. The vehicle already has an open eMOVE request."
2. **Fail popup:** "There is no approved STMS or eSTM for this vehicle under your company." A non-party dealer "sees the same message as a vehicle with no approved transaction".
3. **Vehicle fields (REQ-031):** Engine No and Chassis No prepopulated and "read-only once prepopulated"; "Vehicle Make & Model and Manufacturing Year are mandatory and must be completed before Next."
4. **Colour (REQ-032):** optional, alphabet only, max 30.
5. **Vehicle Type (REQ-033):** optional; prepopulated from a matching insurance record; "Motorcycle and Commercial / Lorry are greyed out and not selectable in this phase."

**E. Wizard Step 1 — Pick-Up & Drop-Off (§2.2.6.2)**

1. **Service per leg (REQ-034):** Pick-Up "Door-to-Door Pickup (+RM200)" / "Drop at Hub"; Drop-Off "Door-to-Door Drop-Off (+RM200)" / "Collect at Hub". "Door-to-Door adds RM200.00 per leg."
2. **State (REQ-035/043):** 13 states; "Exclude Sabah, Sarawak and Labuan from the listing." Shown as "NAME (CODE) … for example SELANGOR (10)" (Pick-Up note only).
3. **Postcode (REQ-037/045):** numeric, exactly 5.
4. **Address (REQ-038/046):** min 10, max 255. Errors "Pick Up Address must be at least 10 characters." / "Drop Off Address must be at least 10 characters." — "Displayed in red below the text field. No popup is shown."
5. **Contact Person (REQ-039/047):** alphabet only, max 100. **Contact No (REQ-040/048):** numeric, 9 to 11.
6. **Preferred Pick-Up Date (REQ-041):** "Future dates only." "Maximum 30 days ahead of today." "Typing is not allowed." Format "DD-MM-YYYY".
7. **Hub (REQ-050):** "Only active, verified hubs with a location are offered." Hub leg shows "only State, Hub, Contact Person and Contact No". Same hub both legs → "charged at the lowest tier of the charges table, with no Door-to-Door charge". Empty state popup "No hub available in {State}."
8. **Next (REQ-052):** "Where all 4 pass, the transaction is created and saved with Transaction Status Pending." "eMOVE has no Draft transaction status." Address fail popup "We could not find the address. Please check and try again, or contact support at 03-27798899."

**F. Wholesale conflict (REQ-051)**

1. "A Used Car Dealer cannot create an eMOVE request while a Wholesale transaction for the same vehicle is paid and its logistics is not yet completed."
2. "The same check applies in reverse. A Wholesale transaction cannot be created while an eMOVE request for the same vehicle is in progress."
3. "Check runs on Step 1 when Next is clicked." "Wholesale logistics is treated as completed once its delivery status is Delivered."
4. Popup: "This vehicle has a Wholesale logistics job in progress. Please complete it before creating an eMOVE request."

**G. Step 2 — Summary & Charges (§2.2.6.3)**

1. Read-only labels REQ-053–069; empty Colour / Vehicle Type / Remarks show "-".
2. **Logistics Fee (REQ-070):** tier price; note "Distance 330 km".
3. **Door-to-Door charges (REQ-071/072):** "200.00" or "0.00" per leg.
4. **eAuto Fee (REQ-073):** "RM0.00 in this phase. Line stays in the breakdown." **SST (REQ-074):** "8% of eAuto Fee, so RM0.00 in this phase."
5. **Total (REQ-075):** label "Total Amount Payable (inclusive of Service Tax 8%)". Examples: "Standard tier RM450 with Door-to-Door at both ends ⏎ a. Total Amount Payable shows 850.00."; "Base tier RM300 with Drop at Hub and Collect at Hub ⏎ a. Total Amount Payable shows 300.00."; Extended "1,050.00"; Premium "1,400.00".
6. **Buttons (REQ-076):** "Save & Continue Later", "Make Payment", "Resubmit". Stale price popup: "The logistics price has been updated. The charges shown have been refreshed. Please review the new amount before continuing." "Charges are re-checked when Make Payment or Retry is pressed, not when the page opens."

**H. Step 3 — Payment (§2.2.6.4–2.2.6.5)**

1. Labels REQ-077–086 (Transaction No, Vehicle No, locations, Total Amount Paid, Service Type per leg, Make & Model, Payment Status, Submission Date / Time "DD-MM-YYYY HH:mm").
2. **Bank no response (REQ-087):** status stays "Pending"; "A retry re-sends the same Payment ID and the same RHB Reference 1"; "There is no limit on the number of payment retries until the request expires." Popup "There is error with RHB system. Please retry payment after 10 minutes."
3. **Failed (REQ-089):** dealer stays on Step 2; Payment History shows attempt no., date/time, "Bank, being RHB", Payment ID, status, bank reason. Example "Failed (IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI.)"
4. **Pending (REQ-091):** "No invoice or e-Invoice is available."

**I. Pricing (§2.2.7)**

1. **Distance (REQ-094):** "measured by road between the 2 points"; Door leg from door address, Hub leg from hub address.
2. **Shared matrix (REQ-098):** "A tier rate is changed in BackOffice ⏎ a. Both wholesale and eMOVE use the new rate."
3. **Payment Reset on re-price (REQ-100):** "eMOVE uses no one-time password."
4. **Audit (REQ-101):** "An eMOVE audit record is written, separate from wholesale."

**J. UCD Transaction Details (§2.2.8)**

1. Header, vehicle block, locations, charges breakdown (REQ-102–105).
2. **Delivery Status track (REQ-106):** 5 nodes "Logistics Created ⏎ Payment Received ⏎ Pending Pick-Up ⏎ In Transit ⏎ Delivered"; "A failed node is shown in red with the failure reason in its caption."
3. **Documents (REQ-107):** Invoice and e-Invoice. e-Invoice only when LHDN accepted; none when payment Failed or Pending.

**K. ID formats (§2.2.9)**

1. **Transaction No (REQ-108):** "Template: EMYM0000001"; month "October: 0 ⏎ c. November: N ⏎ d. December: D". Example "EM680000001".
2. **Payment ID (REQ-109):** "Template: EMYYMMDD0000001". Example "EM2608050000001".
3. **Trans Type (REQ-110)** and **RHB Ref 2 (REQ-112):** "EMOVE". **RHB Ref 1 (REQ-111):** "EMYYMMDD0000001-[Company ID]", example "EM2608050000001-1040141".

**L. BackOffice listing (§2.2.10)**

1. **Access (REQ-113):** "1 eMOVE page is added to existing BackOffice home menu without removing existing items." Mock-up menu name "eMOVE Logistics Transaction" under "Transactions Relevant".
2. **Empty on load (REQ-114):** search blocked without date or another filter; popup "Please select From Date and To Date."
3. **Cancel (REQ-116):** Pending or Failed only; "Every BackOffice user can cancel a transaction. No additional permission is applied." Remark "CANCELLED BY {username} on {DD-MM-YYYY HH:mm}"; audit log written.
4. **Filters (REQ-117–131):** Company Name, Vehicle No., Vehicle Type ("All, -, Sedan / Hatchback, SUV / MPV, Pickup / 4x4"), Transaction No., Date Created From/To, Pick-Up Date From/To (To auto = From + 1 month; "Future dates are selectable, up to today plus 30 days"), Cancelled Date From/To ("Maximum range of 1 month"; "Selecting a Cancelled Date clears the Created and Pick-Up date filters."), Service Type, Payment Status, Tx Status, Delivery Status, LHDN Response Status ("N/A is not offered").
5. **Columns (REQ-132–151):** adds Company Name, Company ROC, Vehicle Type, Cancelled Date, Cancelled By ("99000/cronjob"), and **Delivered Date** — "Column is placed before the Action column in the BackOffice listing." Error "Delivered Date range cannot exceed 1 month."

**M. BackOffice details (§2.2.11)**

1. **Header (REQ-152):** "WMJ7742 (Ref No.: EM690000019) - Transaction Details".
2. **Buttons (REQ-153):** Invoice, e-Invoice, **Delivery Order** — "The 3 buttons appear on 1 row, aligned right."
3. **Tracking (REQ-155):** "A failed node also shows the Next Action in its caption."
4. **Special Remark (REQ-156):** max 255; "visible in BackOffice only"; audit logged; "eMOVE BackOffice pages are available to the Admin and HubAdmin roles"; "No listing export is delivered in this phase."
5. **Photos (REQ-157):** "Photos are shown in BackOffice only. They are not displayed on the UCD Portal." 12 photos per set.
6. **Refund (REQ-158):** "Finance refunds the Used Car Dealer manually, outside the system"; "No automatic cancellation email is sent to the logistics partner in this phase."
7. **Re-arrange (REQ-159):** shown when "Pick-Up Failed" or "Delivery Failed". Failed Pick-Up → "Pending Pick-Up"; failed Drop-Off → "In Transit". "The same Delivery Order is kept."
8. **Reset Payment (REQ-160):** "A retry re-uses the same Payment ID. A new Payment ID is taken only after a payment reset."

**N. Reconciliation (§2.2.12)**

1. **REQ-161:** "How the logistics portion is reconciled, and against what, is pending confirmation by requestor."
2. **REQ-162:** reconcile from BO listing "filtered by date with Payment status OK". New page "SST Payment Report (eMOVE)" — "Date boxes … show DD/MM/YYYY". "eMOVE is already included in the automatic Revenue Report All eAuto Transactions CSV, as product type EMOVE."

**O. Logistics Hub / Pricing History (§2.2.13–2.2.14)**

1. **REQ-163:** Hub Management and Charges Matrix Setup — "No change is made to either page in this CR."
2. **REQ-164:** "eMOVE pricing decisions are written to the same store, so eMOVE records appear on that page." (Logistics Pricing History.)

**P. Delivery Order + email (§2.2.15–2.2.16)**

1. **REQ-165:** "Two copies are produced per job: a Pick-Up copy … and a Drop-Off copy". "Acknowledgement labels are pending confirmation by requestor."
2. **REQ-166 numbers:** "EM690000025P" / "EM690000025D".
3. **REQ-166 emails:** DO arrangement "From: wholesale@eauto.my ⏎ To and CC: wholesale@eauto.my and the logistics partner"; DO failure "From: imonitor@eauto.my ⏎ To: IT list and Operations at wholesale@eauto.my"; send final failure "To: IT list"; driver failure report "To: wholesale@eauto.my only ⏎ The Used Car Dealer is not emailed". "Open: IT list address is being prepared by IT."
4. **REQ-167:** "Payment is Pending or Failed ⏎ a. No Delivery Order is generated and no email is sent."
5. **REQ-168:** prepopulated vehicle fields; "Left blank for the Logistics Driver to complete by hand: ⏎ 1. Variant ⏎ 2. Transmission ⏎ 3. Mileage (km) ⏎ 4. Fuel Type / EV ⏎ 5. Date ⏎ 6. Lorry No". PDF: dates "DD-MM-YYYY"; 2-line address joined; curly quotes → straight; overflow cut off.
6. **REQ-169 QR:** "static, never expires, and the 2 codes are different."
7. **REQ-170:** "Dispatch Note is carried on the Pick-Up copy and the Delivery Order acknowledgement on the Drop-Off copy." Wholesale version used.
8. **§2.2.16 subject:** "[eMOVE Logistic] Arrangement - [Pick-Up DO Number] / [Drop-Off DO Number] - [Vehicle Number]"; sample "[eMOVE Logistic] Arrangement - EM690000019P / EM690000019D - WMJ7742".

**Q. Logistics Driver (§2.2.17–2.2.19)**

1. **REQ-172:** "Open: whether QR scan is delivered in this phase, or vehicle registration entry only, is pending confirmation by requestor." "A Drop-Off scan is not accepted before Pick-Up is complete." Popup "No active delivery order was found for this vehicle number."
2. **REQ-174/179:** popup "Vehicle number does not match the delivery order. Please check and try again." (wording marked "Open").
3. **REQ-175:** "12 photos are uploaded regardless of the Engine Start (no photo) label on checklist item 12." Hub legs: driver "still scans, takes the 12 photos and uploads them at the hub." Popup "Failed to upload photo {N}. Tap to retry."
4. **REQ-176 / 181:** after Pick-Up submit "In Transit"; after Drop-Off submit "Delivered".
5. **REQ-183 Reason:** mandatory, max 255.
6. **REQ-184 Evidence:** "Minimum 1 photo. ⏎ 2. Maximum 3 photos. ⏎ 3. Maximum 10MB per photo. ⏎ 4. File type: jpg, jpeg, png, webp." "iPhone HEIC photos are refused".
7. **REQ-185:** Pick-Up failure → "Pick-Up Failed" + "Failed"; Drop-Off failure → "Delivery Failed" + "Failed".
8. **REQ-187/188:** Logistics Driver Name (alphabet, max 100) and Contact No (numeric 9–11), both mandatory. Server messages "Please key in the Logistics Driver Name." / "Logistics Driver Name may contain letters only (maximum 100 characters)." / "Please key in the Logistics Driver Contact No." / "Logistics Driver Contact No must be 9 to 11 digits."

### SRD version remarks (Jira SRD table, verbatim)

1. **v0.2 (04.09.2026):** "Updated Section 1.5 Associated Documents  Updated Sections 2.1.1 to 2.2.8  Updated Section 2.2.12 Charges Matrix Setup  Updated Section 2.2.16 Pending Items". SRD §1.3 says "Removed Section 2.2.16 Pending Items".
2. **v0.3 (14.09.2026):** "Updated Sections 1.4 and 1.5  Updated Sections 2.1.1 to 2.2.12  Added Sections 2.2.10 and 2.2.13  Renumbered Sections 2.2.11 to 2.2.17"
3. **v0.4 (17.09.2026):** "Updated Section 2.1.1 Assumptions  Updated Sections 2.2.6 and 2.2.7  Updated Section 2.2.13 Amount Reconciliation  Updated Sections 1.4, 1.5, 2.2.5 and 2.2.11  Added Section 2.2.15 Delivery Order"
4. **v0.5 (09.10.2026):** "Added open items for confirmation in Sections 2.2.6, 2.2.11 and 2.2.12  Added open items for confirmation in Sections 2.2.15, 2.2.17 and 2.2.19  Updated Additional Note in Section 2.2.1  Added Sections 2.2.15 and 2.2.16 from https://mfservices.atlassian.net/browse/EAINT-12119  Restructured Sections 2.2.6 to 2.2.16"
5. **v0.6 (14.10.2026):** "Removed open items in Sections 2.2.6 and 2.2.9  Confirmed Trans Type and RHB Ref 2 in Section 2.2.9"
6. **v0.7 (19.10.2026):** "Removed JPJ Approved Date limit in Sections 2.2.4 and 2.2.6  Updated vehicle detail fields in Section 2.2.6  Added Wholesale conflict check in Section 2.2.6  Confirmed Delivery Order number, email and legal pages in Section 2.2.15  Added Logistics Driver details in Section 2.2.19  Applied build team confirmations across Sections 2.2.5 to 2.2.19". SRD §1.3 lists item f in full: "Applied build team confirmations: Delivery Order field population, Pick-Up Date filter, Resubmit, hub leg fields, status combinations, bank no-response handling, refund, re-arrange, Reset Payment, Delivered Date and reconciliation." and g "Confirmed evidence photo types and size limit in Section 2.2.19."
7. **v0.8 (21.10.2026):** "Updated Search message and check order in Section 2.2.6  Standardised date format in Sections 2.2.6 and 2.2.15  Updated cancellation handling in Section 2.2.12  Moved Delivered Date column in Section 2.2.11  Added server-side messages in Sections 2.2.11 and 2.2.19  Added logistics email recipients in Section 2.2.15  Added Service column in Section 2.2.5  Added SST Payment Report in Section 2.2.12  Corrected Retry, Resubmit, Re-arrange and filter notes"
8. **Section-number note:** the remark section numbers do not always match the v0.8 body. Example: "Moved Delivered Date column in Section 2.2.11" — the column sits in **§2.2.10.2** (REQ-151); "Updated cancellation handling in Section 2.2.12" — cancel rules sit in **§2.2.5.2 / §2.2.10** (REQ-026, REQ-116). `[unconfirmed]` remarks may use pre-restructure numbers.

## New vs existing behaviour

1. **Existing (Jira row 4):** "Logistic arrangement is only available after a wholesale buy/sell is confirmed."
2. **Existing (Jira row 4):** "Finance arrangement from Wholesale to Finance is currently done manually."
3. **Existing (SRD §2.2.2 row 1):** "Not applicable. eMOVE is a new module and has no existing behaviour."
4. **Existing repo fact:** Wholesale logistics (EAINT-11731) makes Delivery Orders after buyer full payment; DO numbers "WSS<8 digits>" / "WSB<8 digits>" `[EAINT-12019-related-history.md, Wholesale v3 EM_DN_TS1 / EM_DO_TS1]`. eMOVE uses "EM…P" / "EM…D".
5. **Existing repo fact:** Interstate tiers "Up to 250: base 300. 251-400: base 450. 401-600: base 650. Over 600: base 1,000." `[knowledge/flow-emove.md §3, from flow-wholesale.md, EAINT-12119]` — consistent with SRD REQ-075 examples.
6. **Existing repo fact:** "eMOVE is not found anywhere in eauto prod code (0e21bef3db, 2026-10-22)" `[lib/eautoFlows/modules/wholesale.ts line 372]`.
7. **New:** Logistics tile on UCD home; landing, listing, 3-step wizard, details page; BO listing + details with Cancel, Re-arrange, Reset Payment, Special Remark, photo viewer; SST Payment Report (eMOVE); Logistics Driver Pick-Up / Drop-Off pages with failure report; 45-day expiry cron; payee **eAuto Sdn Bhd**.

## QA scope

1. **Miro card:** no scope written ("- Testing Scope: (Automation)" with no items; mandays blank).
2. **From SRD v0.8** `[draft — re-check if v0.9 / v1.0 lands]`:
   1. **Entry + landing** (REQ-001–003).
   2. **Vehicle Search** — check order, non-party dealer, open eMOVE, no date limit (REQ-030); vehicle fields (REQ-031–033).
   3. **Pick-Up / Drop-Off fields** — 4 service combinations, field rules, date picker window, hub list, same-hub rule, address-not-found (REQ-034–052).
   4. **Wholesale conflict** both directions (REQ-051).
   5. **Charges** — 4 tiers × Door/Hub legs, eAuto Fee and SST at 0.00, stale price refresh, audit and pricing history (REQ-070–075, 093–101, 164).
   6. **Payment** — OK, Failed (Payment History), Pending / no response, Retry, Resubmit, Save & Continue Later; Payment ID / Ref 1 / Trans Type / Ref 2 (REQ-076–092, 108–112).
   7. **Invoice + e-Invoice** after OK only (REQ-005, 107, 153).
   8. **UCD listing + details** — filters, columns, status combinations, delivery track (REQ-004–028, 102–107).
   9. **BO listing + details** — filters, columns, Cancel, Re-arrange, Reset Payment, Special Remark, photos, roles (REQ-113–160).
   10. **45-day expiry** cron (REQ-029).
   11. **Delivery Order PDFs + emails** — numbers, field population, QR, legal pages, failure alerts (REQ-165–171, §2.2.16).
   12. **Logistics Driver** — Pick-Up, Drop-Off, order rule, vehicle-number match, 12 photos, failure report with evidence and driver details (REQ-172–188).
   13. **SST Payment Report (eMOVE)** + Revenue CSV product type "EMOVE" (REQ-162).
3. **Out of scope (SRD §2.1.2):** MotoHub / finance module, non-UCD portals, native driver app, public access, Charges Matrix Setup page build.

## Mock-up (20261009) vs SRD v0.8 differences

The mock-ups pre-date SRD v0.6–v0.8. SRD wins `[unconfirmed — SRD is the later document]`.

1. **UCD listing filters:** mock-up has "Pickup Date" and no Service Type; Payment Status lacks "-"; Tx Status lacks Expired / Cancelled. SRD REQ-006–013 has Service Type and the full option lists, no Pick-Up Date filter on UCD.
2. **UCD listing columns:** mock-up has no **Service** column (added v0.8, REQ-028).
3. **Make & Model / Year:** mock-up "Auto-filled after Search"; SRD REQ-031 says "Keyed in by the Used Car Dealer".
4. **Contact No:** mock-up value "012-3456789" (hyphen); SRD REQ-040 "Numeric only."
5. **Step 2:** mock-up shows a separate "Estimated Distance" row; SRD REQ-070 shows distance as a note under Logistics Fee.
6. **Step 3:** mock-up shows "Payment ID" and "RHB Reference 1"; SRD REQ-077–086 does not list them.
7. **Mock-up REQ numbers** differ from SRD v0.8 (mock-up "Simulate a tier price change before payment (REQ-029)"; v0.8 REQ-029 = 45-day expiry).
8. **Evidence photo size:** mock-up "each ≤ 5MB"; SRD REQ-184 "Maximum 10MB per photo."
9. **Driver failure screen:** mock-up "BackOffice and the UCD have been notified."; SRD REQ-166 "The Used Car Dealer is not emailed, so the Logistics Driver page states that BackOffice has been notified."
10. **Driver failure form:** mock-up has no Logistics Driver Name / Contact No fields (SRD REQ-187/188, added v0.7).
11. **Driver confirm screen:** mock-up shows "Variant"; SRD REQ-168 leaves Variant blank for the driver to fill by hand on the DO.

## Affected regression areas

1. **Wholesale logistics:** "for wholesale part will need to regress, maybe on DO generation + qr scanning, since we will share those between emove and wholesale logistic" `[Teams, 2026-10-14 16:10, dev]`. Plus the **reverse conflict check**: "A Wholesale transaction cannot be created while an eMOVE request for the same vehicle is in progress." `[REQ-051]`
2. **Shared charges matrix** — a BO rate change hits both (REQ-098). **Logistics Pricing History** gains eMOVE rows (REQ-164).
3. **STMS / UCD to UCD / eSTM** approved transactions (entry source) — `knowledge/flow-ucd-to-ucd.md`, `knowledge/flow-estm.md`.
4. **BO home menu** — new item, existing items kept (REQ-113).
5. **Revenue Report All eAuto Transactions CSV** — new product type "EMOVE" (REQ-162).
6. **RHB payment + e-Invoice** for UCD.
7. Note: Wholesale TS are chatbot-driven and **manual only** (standing memory) — Wholesale regression here is manual.

## Test data / env needs

1. **Test env:** not stated. `[unconfirmed]` staging.
2. **Source transaction:** a vehicle with an **approved STMS, UCD to UCD or eSTM** where the test dealer is **buyer or seller** (REQ-030). A second dealer (non-party) for the negative case. `[unconfirmed]` automation can create an approved eSTM via existing eSTM scripts.
3. **Insurance record** for the vehicle to test Vehicle Type prefill (REQ-033), and one without.
4. **Hubs:** an active, verified hub per state used; a state with no hub; a hub with no usable coordinate (REQ-050).
5. **Distances** that land in each of the 4 tiers (REQ-070, 075).
6. **RHB outcomes:** OK, Failed (e.g. "IF"), no response — via eSIM RHB prefix (see related-history traps 3–4).
7. **Wholesale transaction** for the same vehicle, paid and not delivered (REQ-051).
8. **Driver** access to Pick-Up / Drop-Off pages on a phone; jpg/png/webp photos, a >10MB photo, a HEIC photo (REQ-184).
9. **BO logins:** Admin and HubAdmin roles (REQ-156).
10. **45-day expiry:** a transaction 45+ days old, or a dev patch of created date `[unconfirmed]`.
11. **Photo storage:** "for emove photo i store in s3 ya" `[Teams, 2026-10-14 10:19, dev]`.
12. **Email:** staging recipients for DO email — "Addresses are held as settings and can differ per environment" `[REQ-166]`; actual staging values not stated.

## Dependencies / related tickets

1. **EAINT-11731** — "To implement new Logistics Flow". **Done**. DO layout reused ("eMOVE Delivery Order follows the format delivered under this ticket." `[SRD §1.5 row 5]`).
2. **EAINT-12119** — "Logistics: Interstate Price Tier for Logistics Delivery (Wholesale and Standalone Service)". **Done** (2026-10-16). "eMOVE follows that same logic." `[SRD §1.5 row 4]`
3. **EAINT-11824** — "Logistics Pricing - Matrix". **Closed** (2026-08-07).
4. **EAINT-2450** — e-Invoice LHDN Response Status values `[SRD §1.5 row 7]`.
5. **EAINT-638** — 45-day housekeeping cron `[SRD §1.5 row 8]`.
6. **EAINT-11884** — "RHB Implementation for eAuto Digits Sdn Bhd". **To Do**. Wholesale payee; eMOVE payee differs.
7. **EAINT-12378** — Wholesale Logistics Full Payment: RHB "RE" error code. **To Do**.
8. **EAUTO-936** (source), **CCB-827** (cross-department) `[SRD §1.5 rows 2–3]`.
9. No Jira issue links, sub-tasks or QA-Issues on 12019 (unchanged 2026-10-27 6:55 pm).

## Teams decisions (verbatim)

Items 1–7 from `_reference/teams/EAINT-12019-eMOVE-Standalone-Logistics.md`; items 8–10 from `EAINT-12019-teams-since-2026-10-16.md`.

1. **Not Wholesale:** "there is nothing related to the wholesale flow, this is the logistics standalone module." `[2026-08-28 12:25, BA]`
2. **QR + DO reused:** "the QR and Delivery Order use the existing flow and template / there are no changes on QR and delivery order in this ticket" `[2026-09-15 14:21, BA]`. **Partly overtaken** by SRD v0.8 (own DO numbers and email subject — Changes item 8.11).
3. **Dev handover:** "if not mistaken, Wei Ting Lim will help on this ticket" `[2026-10-11 21:47, dev lead]`.
4. **Photos in S3:** "for emove photo i store in s3 ya" `[2026-10-14 10:19, dev]`.
5. **Regression:** "for wholesale part will need to regress, maybe on DO generation + qr scanning" `[2026-10-14 16:10, dev]`.
6. **Payee:** "emove payment will go to eAuto Sdn Bhd ya. / for wholesale part will go to eAuto Digits which is related to the ticket EAINT-11884" `[2026-10-14 18:27, BA]`.
7. **Earlier dev questions** `[2026-08-28 10:27, 2026-09-10 14:49, 2026-09-17 10:43]` — status after SRD v0.8:
   1. Vehicle type effect on charges — **answered** (no effect, REQ-093).
   2. Distance lookup table editable or fixed — **answered**: measured by road (REQ-094); tiers from EAINT-12119 matrix.
   3. Hub master list — **answered**: Hub Management under EAINT-12119 (REQ-050, REQ-163).
   4. QR per transaction vs general — **answered**: 2 static QR codes per job, one per copy (REQ-169).
   5. QR-first vs reg-no path (old "REQ-060") — **still open** as REQ-172.
8. **SRD v0.7:** "Everyone, just to update that srd v0.7 is available yaa." `[2026-10-20 08:09, BA]`
9. **SRD v0.8:** "Everyone, just to update that srd v0.8 is available ya" `[2026-10-21 10:54, BA]`
10. **Requirement meeting:** "Wei Ting Lim Tan Yi Fung, will have discussion with Nurul on this coming Friday 11am at Meeting Room 1 ya" `[2026-10-21 10:54, BA]`. Friday = 2026-10-23 `[unconfirmed]`. **Outcome not posted** up to 2026-10-26 10:50.
11. **SRD names a Nurul decision:** "Confirmed by Nurul on 19-10-2026 that Variant, Transmission, Mileage and Fuel Type are not required for an eMOVE transaction and may stay blank." `[SRD v0.8 §2.2.15 REQ-168]`
12. **SRD names a dev agreement:** SST Payment Report (eMOVE) "is a copy of the SST reports already used by the other modules, as agreed with Wei Ting." `[SRD v0.8 §2.2.12 REQ-162]`
13. **No QA, staging or deployment messages** 2026-10-16 to 2026-10-26.

## Open questions / risks for testing

1. **Readiness vs date:** Jira **REQ REFINEMENT IN PROGRESS**, SRD **v0.8 draft** (no v1.0), no fix version, Jira Developer field empty — Miro puts it in **26TH NOV** with all dates TBC.
2. **QA not assigned** in Jira or Miro. Confirm Faizuddin is QA.
3. **Meeting outcome (2026-10-23):** may change SRD v0.8. Watch for v0.9.
4. **SRD open items still in v0.8** (verbatim):
   1. REQ-161: "How the logistics portion is reconciled, and against what, is pending confirmation by requestor."
   2. REQ-165: "Acknowledgement labels are pending confirmation by requestor."
   3. REQ-166: "Open: IT list address is being prepared by IT."
   4. REQ-172: "Open: whether QR scan is delivered in this phase, or vehicle registration entry only, is pending confirmation by requestor."
   5. REQ-174: "Open: Popup Content shown where the entered number does not match a Delivery Order is pending confirmation by requestor."
   6. REQ-175: "Open: Popup Content shown on a failed photo upload is pending confirmation by requestor."
   7. REQ-179: "Open: Popup Content shown where the entered number does not match a Delivery Order, and where Pick-Up is not yet complete, is pending confirmation by requestor."
   8. REQ-186: "Open: notification on a failed Pick-Up or Drop-Off is proposed as an email to the logistics team mailbox, with the Used Car Dealer company email in copy. The mailbox address is pending confirmation by requestor."
5. **SRD contradictions (ask the BA before TS):**
   1. **Who can Cancel:** REQ-026 "both Used Car Dealer and BackOffice user can cancel" (UCD listing) vs REQ-116 "Cancel is available in BackOffice only and is not offered on the UCD Portal."
   2. **Retry button:** REQ-090 "Displayed where Payment status is Pending or Failed, the same as BMK and STMS.Displayed only where the payment failed." — two rules in one cell.
   3. **When is the transaction created:** REQ-052 "the transaction is created and saved with Transaction Status Pending" at Step 1 Next vs REQ-088 "Payment approved ⏎ a. Transaction is created and Payment Status is "OK"."
   4. **Failure email to UCD:** REQ-166 "The Used Car Dealer is not emailed" vs REQ-186 Open "with the Used Car Dealer company email in copy" vs mock-up "BackOffice and the UCD have been notified."
   5. **Delivered Date filter:** REQ-151 "offered as a date range filter" and error "Delivered Date range cannot exceed 1 month." — but the BO filter list (REQ-117–131) has no Delivered Date filter.
   6. **No-response popup vs no limit:** REQ-087 popup "Please retry payment after 10 minutes." vs "There is no limit on the number of payment retries". `[unconfirmed]` whether a 10-minute block is enforced.
   7. **Payment History example:** "08-01-2026 10:59am - RHB (EM2609020000019)" — date does not match the Payment ID date (02-09-2026) and uses am/pm, not the 24-hour "DD-MM-YYYY HH:mm" used elsewhere `[REQ-089]`.
   8. **Self-references:** REQ-020 Payment "per EAINT-12019-REQ-020"; REQ-021 Delivery "per EAINT-12019-REQ-021" — point at themselves.
6. **Jira description vs SRD:** Jira row 5 item 6 (Finance module) and row 6 ("vehicle type", "Charges matrix to be confirmed") are not updated to match SRD §2.1.2 and §2.2.7.
7. **Hub-to-Hub vs Door-to-Door surcharge direction:** SRD "Door-to-Door adds RM200.00 per leg" / "Hub-to-Hub carries no additional charge." `[REQ-034]`. Repo note "Hub-to-Hub = Door-to-Door + RM200 (EAINT-11824)" `[knowledge/flow-wholesale.md, flow-emove.md §5 item 4]` reads the other way. Source sheet header: "Expected Price (Hub-to-Hub) ⏎ Note: Door-to-Door + RM200" `[Wholesale v3, sheet "EAINT-11824" R2]` — `[unconfirmed]` probably means Door-to-Door price = Hub-to-Hub + RM200.
8. **Same hub both legs:** charged "at the lowest tier" (REQ-050) — confirm with dev how distance 0 is handled.
9. **Staging email recipients:** Wholesale TS expected "CC: mytriodistribution@gmail.com" (outside address) `[related-history trap 16]`. Check staging settings before triggering DO emails `[unconfirmed]`.
10. **45-day expiry test** needs aged data or a date patch.
11. **Size:** 188 requirements in v0.8 (v0.1 had "58 requirements across 4 flows" `[Teams, 2026-08-26 17:34, earlier dev]`). Mandays not set on Miro.

## Suggested test focus

`[from SRD v0.8 draft — re-check against any later version]`

1. **Entry gate first:** approved STMS / UCD to UCD / eSTM (old and recent); no approved transaction; non-party dealer (same message); open eMOVE already; Wholesale conflict both directions.
2. **Step 1 field rules:** auto-strip, uppercase, max-length stops, address min 10 errors, date picker window (tomorrow to +30), Sabah/Sarawak/Labuan hidden, hub leg hides address fields.
3. **Fee:** each of 4 tiers × (Door/Door, Door/Hub, Hub/Door, Hub/Hub); totals 300.00 / 850.00 / 1,050.00 / 1,400.00; same hub both legs; stale price popup after a BO rate change.
4. **Payment:** OK → Step 3 + Invoice + e-Invoice + DO; Failed → Payment History + Retry; no response → Pending + same Payment ID; Reset Payment → new Payment ID; Save & Continue Later → Resubmit.
5. **ID formats:** Trx No month code (Oct = 0, Nov = N, Dec = D); Payment ID; RHB Ref 1 with Company ID; Trans Type / Ref 2 "EMOVE".
6. **DO + email:** P and D numbers, field population, blank driver fields, PDF text clean-up, subject template, attachment names, no DO on Pending / Failed.
7. **Driver:** Pick-Up then Drop-Off (Drop-Off blocked before Pick-Up), wrong vehicle number, 12 photos with upload retry, failure report (reason, 1–3 evidence ≤10MB, HEIC refused, driver name/contact server messages).
8. **Statuses + BO actions:** all 7 status-combination rows; Cancel rules (after BA answer on UCD Cancel); Re-arrange returns Pending Pick-Up / In Transit; Special Remark BO only; photos BO only.
9. **Listings:** filters on both portals, mandatory date rule, Cancelled Date clears others, column order (Service after Created At; Delivered Date before Action).
10. **Expiry cron:** unpaid / Pending / Failed expire at 45 days; OK never expires.
11. **Reports:** SST Payment Report (eMOVE) DD/MM/YYYY; Revenue CSV "EMOVE".
12. **Regression (manual):** Wholesale DO generation + QR scan; Wholesale create blocked by open eMOVE; Charges Matrix and Pricing History pages unchanged.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-emove.md` — draft flow incl. §10 SRD v0.8 body (2026-10-27, not walked live).
2. `knowledge/flow-wholesale.md` §"Flow: Logistics (delivery) and standalone eMOVE".
3. `EAINT-12019-related-history.md` — reusable Wholesale TS rows (LGF, EM_DN, EM_DO, EM_LOGISTICS, LOG_FEE) and 19 traps.
4. `lib/eautoFlows/modules/wholesale.ts` (eMOVE glossary, flow, open question line 372).
5. `knowledge/flow-ucd-to-ucd.md` §"Flow: Interstate" and `knowledge/flow-estm.md` + `scripts/eauto-estm/` + `app/eauto/estm/` — create the approved source transaction. Do not edit `estm-legacy`.
6. `knowledge/teams-decisions-by-ticket.md` §EAINT-12019.
7. No existing Wholesale / logistics automation in `scripts/`.

## Knowledge candidates

1. **`knowledge/flow-emove.md` §0 items 1, 2 and 4** say "SRD v0.8 is NOT in the repo", "Mockups NOT in the repo" and ask to drop them in. Wrong now — §10 of the same file already reads them. `[source: folder listing 2026-10-27; SRD text copy 4:50 pm]`
2. **`knowledge/flow-emove.md` §7 items 2, 3, 4, 5, 6, 8, 9** are answered by SRD v0.8: vehicle type not in fee (REQ-093), matrix (REQ-095, 098), distance by road (REQ-094), hubs from Hub Management (REQ-050, 163), 2 static QR per job (REQ-169), Wholesale conflict defined (REQ-051), Finance out of scope (§2.1.2 row 1). Item 7 (driver path) is now REQ-172, still open.
3. **`knowledge/flow-emove.md` §7 item 10** dates the Nurul meeting "2026-10-24". Message sent Wed 2026-10-21 says "this coming Friday" → 2026-10-23 `[unconfirmed]`. `[source: Teams EAINT-12019, 2026-10-21 10:54, BA]`
4. **`knowledge/flow-emove.md` §2 item 2 / §3** quote the Jira gate "after UCD-to-UCD (interstate transfer) and eSTM (approved)". SRD widens it to any approved STMS / UCD to UCD / eSTM where the dealer is buyer or seller. `[source: SRD v0.8 §2.2.4 REQ-003, §2.2.6.1 REQ-030]`
5. **SRD contradictions** to add to `flow-emove.md` §10: Retry rule (REQ-090), transaction created at Step 1 vs at payment (REQ-052 vs REQ-088), UCD not emailed vs UCD in copy (REQ-166 vs REQ-186), Delivered Date filter missing from filter list (REQ-151 vs REQ-117–131). `[source: SRD v0.8]`
6. **ID formats** for `flow-emove.md`: Trx No "EMYM0000001" (Oct 0, Nov N, Dec D), Payment ID "EMYYMMDD0000001", RHB Ref 1 "EMYYMMDD0000001-[Company ID]", Trans Type / Ref 2 "EMOVE". `[source: SRD v0.8 §2.2.9 REQ-108–112]`
7. **BO facts** for `flow-emove.md`: roles "Admin and HubAdmin"; "No listing export is delivered in this phase."; photos BO only; refund manual; Re-arrange keeps the same DO; Reset Payment gives a new Payment ID. `[source: SRD v0.8 §2.2.11 REQ-156–160]`
8. **Email subject** "[eMOVE Logistic] Arrangement - [Pick-Up DO Number] / [Drop-Off DO Number] - [Vehicle Number]" and failure senders "imonitor@eauto.my". `[source: SRD v0.8 §2.2.15 REQ-166, §2.2.16]`
9. **`knowledge/flow-wholesale.md` / `flow-emove.md` §5 item 4** "Hub-to-Hub = Door-to-Door + RM200" reads opposite to SRD "Door-to-Door adds RM200.00 per leg" / "Hub-to-Hub carries no additional charge." `[source: SRD v0.8 §2.2.6.2 REQ-034; Wholesale v3 sheet "EAINT-11824" R2]` — needs a re-word, `[unconfirmed]` which reading the 11824 sheet meant.
10. **Mock-up vs SRD gaps** (evidence ≤5MB vs 10MB; "UCD have been notified"; no driver name fields) — mock-ups are older than SRD. `[source: Driver_PickUp / Driver_DropOff 20261009 text copies; SRD REQ-184, 166, 187–188]`
11. **`lib/ticketStudies.ts` EAINT-12019 entry** says the SRD is "NOT retrieved — drop into the Studying folder". Now in the folder and read. `[source: folder listing 2026-10-27]`
