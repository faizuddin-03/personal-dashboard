# EAINT-12019_SRD_v0.1_20260806.docx — text copy (27/10/2026, 4:50:20 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-UCD] eMOVE – Standalone Logistics Service for UCD-UCD Interstate Transfer & eSTM |
| Version | Version 0.1 |
| Latest Revision Date | 06.08.2026 (Thursday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 06.08.2026 (Thurs) | Chee Mei Jia | Initial Draft |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | eMOVE / eAuto MOVE | Standalone car logistics service under eAuto (arrangement & delivery). |
| 2 | UCD | Used Car Dealer. |
| 3 | eSTM | Electronic Sale & Transfer Module; eMOVE is available once eSTM is approved. |
| 4 | STMS | Sales & Transfer Management System. |
| 5 | SST | Sales & Service Tax. |
| 6 | ROC | Registration of Company number. |
| 7 | Trx No | Transaction Number. |
| 8 | PO | Purchase Order (used for vendor payment via MotoHub). |
| 9 | MotoHub | Vendor payment platform used for driver/transporter payment requests. |
| 10 | Hub-to-Hub | Pickup and drop-off at eAuto branch hubs. |
| 11 | Door-to-Door | Pickup and/or drop-off at a custom address. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12019 — [eAuto-UCD] eMOVE – Standalone Logistics Service for UCD-UCD Interstate Transfer & eSTM | https://mfservices.atlassian.net/browse/EAINT-12019 | Main enhancement ticket |
| 2 | EAUTO-936 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/EAUTO-936 | Source enhancement request |
| 3 | CCB-827 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/CCB-827 | Change Control Board ticket |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Introduce eMOVE, a standalone car logistics service in the UCD Portal, available after a UCD-to-UCD interstate transfer or eSTM is complete. UCDs can request pickup/delivery, pay online, track delivery and receive invoices. |
| 2.1.2 | Key Value(s) Expected | Broaden logistics reach under the eAuto wholesale marketplace; offer logistics as a self-service, monetised service with automated charging and delivery tracking. |
| 2.1.3 | Additional Note(s) | Vendor (driver/transporter) payment handled via MotoHub (PO → payment request), settled monthly by completed job quantity. Charges matrix to be confirmed. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Logistics charges matrix values (distance tiers, door-to-door surcharge, eAuto Fee) are placeholders pending confirmation by the requestor (Nurul). |
| 2 | eMOVE is available only after a UCD-to-UCD interstate transfer or eSTM is completed/approved. |
| 3 | Vendor payment is handled via MotoHub (PO → payment request), settled monthly by completed job quantity. |
| 4 | SST is charged at 8% on the eAuto Fee only. |
| 5 | All vehicle types are eligible unless the requestor confirms restrictions. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | MotoHub vendor payment / finance module build | Detailed finance flow tracked separately; only referenced here. |
| 2 | Non-UCD portals | eMOVE is delivered in the UCD Portal only for this phase. |
| 3 | Native driver mobile app development | Driver flow shown as a web/mobile prototype; native app build is separate. |
| 4 | Automated distance / geo-routing engine | Distances are assumed provided/estimated; auto-routing is out of scope. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | UCD (with supporting BackOffice and Driver flows) |
| 3 | Module | TBC — standalone module, or under STMS (eSTM & UCD to UCD) |
| 4 | Request | Introduce eMOVE, a standalone logistics service for car pickup/delivery after UCD-to-UCD interstate transfer or eSTM. |
| 5 | Additional Note | Source ticket: EAUTO-936. Transfer options: Door-to-Door and Hub-to-Hub. Logistics fee auto-calculated by distance, vehicle type, delivery method and location. Vendor payment via MotoHub, paid monthly by completed jobs. Charges matrix to be confirmed. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Logistics arrangement is only available after a wholesale buy/sell is confirmed. ⏎ 2. Finance arrangement from Wholesale to Finance is currently done manually. |
| 2 | Expected New Handling / Behaviour | 1. Offer logistics as a standalone service in the UCD Portal. ⏎ 2. Available after UCD-to-UCD (interstate transfer) and eSTM (approved). ⏎ 3. UCD requests delivery; system arranges pickup/delivery and charges per matrix. ⏎ 4. Driver scans QR to upload photos and update delivery status. ⏎ 5. Invoice and e-invoice generated after payment. ⏎ 6. Finance module for vendor payment requests with status tracking. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | UCD Portal — Home / Logistics Landing | New Logistics entry point and eMOVE landing. |
| 2 | UCD Portal — Logistics Transaction Listing | New listing of eMOVE transactions. |
| 3 | UCD Portal — Create Logistics Request (Wizard) | New 3-step create flow (vehicle/locations → summary/charges → payment). |
| 4 | UCD Portal — Transaction Details | New details page with charges, timeline and documents. |
| 5 | BackOffice — eMOVE Transaction Listing | New listing with filters, added to existing menu. |
| 6 | BackOffice — Transaction Details | New details page with documents, tracking and photo viewer. |
| 7 | BackOffice — Logistics Charges Matrix Setup | New matrix setup page with audit trail. |
| 8 | Driver App — Pick-Up & Drop-Off Scan | New scan, photo upload and failure-handling flows. |

### 2.2.4 UCD Portal — eMOVE Entry & Logistics Landing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-001 | eMOVE Entry Point | Add a "Logistics" entry in the UCD Portal home to access the eMOVE service. | Clicking Logistics from the UCD home navigates to the eMOVE Logistics landing page. |
| 2 | EAINT-12019-REQ-002 | Landing Options | The Logistics landing presents two actions: view existing logistics transactions, and create a new logistics request. | Landing displays a listing entry and a "Create" entry point. |
| 3 | EAINT-12019-REQ-003 | Service Availability | eMOVE is offered as a standalone service and is available only after the related transfer is complete. | Example 1: UCD-to-UCD interstate transfer OR eSTM is approved/complete ⏎ → eMOVE is available for the vehicle. ⏎ Example 2: Transfer / eSTM not yet complete ⏎ → eMOVE is not offered for the vehicle. |

### 2.2.5 UCD Portal — Logistics Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-004 | Listing Columns | Listing shows Transaction No, Created date, Vehicle, Service Type, Pickup, Drop-off, Payment status, Delivery status, Tx status and Amount (RM). | All listed columns are visible and populated per transaction. |
| 2 | EAINT-12019-REQ-005 | Payment Status Values | Payment status reflects the payment outcome. | Payment status is one of: OK / Pending / Failed. |
| 3 | EAINT-12019-REQ-006 | Delivery Status Values | Delivery status reflects the logistics/delivery progress. | Delivery status is one of: - / Pending Pick Up / In Transit / Delivered / Pickup Failed / Delivery Failed. |
| 4 | EAINT-12019-REQ-007 | Derived Tx Status | Tx status is derived from payment and delivery status (not entered manually). | Example 1: Payment Failed OR Delivery = Pickup Failed OR Delivery Failed ⏎ → Tx status = Failed. ⏎ Example 2: Payment OK AND Delivery = Delivered ⏎ → Tx status = Completed. ⏎ Example 3: Any other combination ⏎ → Tx status = Pending. |
| 5 | EAINT-12019-REQ-008 | Row Action | Selecting a row opens the Transaction Details page. | Clicking a listing row navigates to that transaction's details. |

### 2.2.6 UCD Portal — Create Logistics Request (Wizard)

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-009 | Step 1 — Vehicle | Step 1 selects the vehicle to move (from a completed transfer / eSTM) and shows plate, vehicle type and colour. | Vehicle plate, Vehicle Type and Colour display; Vehicle Type and Colour show "-" when no value. |
| 2 | EAINT-12019-REQ-010 | Service Type | Choose Hub-to-Hub or Door-to-Door. Pickup and drop-off legs are selectable independently. | Example 1: Hub-to-Hub → both pickup and drop-off at eAuto branch hubs. ⏎ Example 2: Door-to-Door → pickup and/or drop-off at a custom address, each leg chosen independently. |
| 3 | EAINT-12019-REQ-011 | Pickup Location | Select pickup hub (by state) or enter a pickup address; Pickup Remarks optional. | Pickup location captured; Remarks optional and may be left blank. |
| 4 | EAINT-12019-REQ-012 | Drop-off Location | Select drop-off hub (by state) or enter a drop-off address; Drop-off Remarks optional. | Drop-off location captured; Remarks optional and may be left blank. |
| 5 | EAINT-12019-REQ-013 | Preferred Pickup Date | Select a Preferred Pickup Date within the allowed rolling window (e.g. 05.08–04.09). | Date picker restricts selection to the allowed monthly window. |
| 6 | EAINT-12019-REQ-014 | Hub Address Master | Hub list per state follows the eAuto branch hub address master (includes Perlis → Alor Setar and Putrajaya → Shah Alam). | State dropdown lists all states incl. Perlis and Putrajaya; hubs match the branch master. |
| 7 | EAINT-12019-REQ-015 | Step 2 — Summary & Charges | Step 2 shows the request summary with an auto-calculated charges breakdown before payment. | Summary displays vehicle, service type, locations and full charges breakdown. |
| 8 | EAINT-12019-REQ-016 | Step 3 — Payment | Step 3 collects payment. On success the transaction is created. | Example 1: Payment success → transaction created, Payment status = OK. ⏎ Example 2: Payment declined → Payment status = Failed, decline message shown. |
| 9 | EAINT-12019-REQ-017 | Remarks Field Validation | Validation specs for Pickup / Drop-off Remarks (proposed — to confirm). | Min Length: 0 ⏎ Max Length: 255 ⏎ Special Character: Yes ⏎ Alphanumeric: Yes ⏎ Only Allow English: No ⏎ Mandatory / Optional: Optional |

### 2.2.7 UCD Portal — Logistics Charges & Pricing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-018 | Distance Tier Pricing | Base logistics charge is set by distance tier. | ≤ 250 km → RM300 ⏎ 251–400 km → RM450 ⏎ 401–600 km → RM650 ⏎ > 600 km → RM1000 |
| 2 | EAINT-12019-REQ-019 | Door-to-Door Surcharge | Door-to-Door adds a surcharge per leg, applied to pickup and drop-off independently. | +RM200 per Door-to-Door leg (pickup and drop-off charged separately). |
| 3 | EAINT-12019-REQ-020 | eAuto Fee | A fixed eAuto Fee is charged per transaction (placeholder value, pending confirmation). | eAuto Fee = RM20 per transaction. |
| 4 | EAINT-12019-REQ-021 | SST | SST is charged on the eAuto Fee only. | SST = 8% of eAuto Fee (RM1.60 on RM20). |
| 5 | EAINT-12019-REQ-022 | Applies to Both | Pricing applies to both wholesale and standalone logistics requests. | Same charges logic used regardless of wholesale or standalone origin. |

### 2.2.8 UCD Portal — Transaction Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-023 | Details Header | Show Transaction No / Listing Ref and the derived Tx status. | Header shows Trx No / Listing Ref and Tx status badge. |
| 2 | EAINT-12019-REQ-024 | Vehicle Info | Show plate, vehicle type and colour. | Vehicle Type and Colour show "-" when no value. |
| 3 | EAINT-12019-REQ-025 | Locations & Remarks | Show pickup and drop-off locations and their remarks. | Pickup / Drop-off Remarks show "-" when empty. |
| 4 | EAINT-12019-REQ-026 | Charges Breakdown | Show the charges breakdown: base (by tier), door-to-door surcharge, eAuto Fee, SST and total. | Breakdown totals reconcile to the amount paid. |
| 5 | EAINT-12019-REQ-027 | Delivery Timeline | Show a delivery tracking timeline including In Transit / Delivered timestamps and failure nodes. | Example 1: Normal → Created → Pending Pick Up → In Transit → Delivered. ⏎ Example 2: Failed → a red failure node (Pickup Failed / Delivery Failed) is shown on the timeline. |
| 6 | EAINT-12019-REQ-028 | Documents | Invoice and e-Invoice are available after payment. | Example 1: Payment OK → Invoice and e-Invoice buttons available. ⏎ Example 2: Payment Failed → decline message shown (e.g. RHB decline); documents not available. ⏎ Example 3: Payment Pending → Remarks empty. |

### 2.2.9 Transaction & Payment ID Formats

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-029 | Logistics Transaction No Format | Format: EM + Y + M + running number (to confirm with Nurul). | Example: EM680000001. |
| 2 | EAINT-12019-REQ-030 | Payment ID Format | Format: EM + current year (YY) + string month + string date + running number (to confirm with Nurul). | Example: EM260805000001. |

### 2.2.10 BackOffice — eMOVE Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-031 | Listing Access | eMOVE transaction listing is accessible in the BackOffice, within the full module menu. | The two eMOVE pages are added to the existing BackOffice home menu without removing existing items. |
| 2 | EAINT-12019-REQ-032 | Filter Layout | Filters arranged in three rows. | Row 1: Company Name / Vehicle No / Transaction No ⏎ Row 2: Date Created From* / To / Pickup Date From / To ⏎ Row 3: Service Type / Payment / Tx Status / Delivery |
| 3 | EAINT-12019-REQ-033 | Mandatory Date Filter | Listing is empty on load; Date Created From & To are mandatory unless another filter is set. | Example 1: No date and no other filter → "Please select From Date and To Date." ⏎ Example 2: Another filter set → search allowed without Date Created. |
| 4 | EAINT-12019-REQ-034 | Listing Columns | Columns shown in the listing. | #, Company Name, Company ROC, Vehicle, Vehicle Type, Trx No, Created At, Service, Pickup, Drop Off, Payment, Delivery, Tx Status, e-Invoice, Amount (RM), Remarks, Action. |
| 5 | EAINT-12019-REQ-035 | Derived Tx Status | Tx status derivation is identical to the UCD listing. | Pickup Failed / Delivery Failed or Payment Failed → Tx status = Failed. |

### 2.2.11 BackOffice — Transaction Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-036 | Details Header | Single reference line plus Tx status. | Header format: <plate> (Ref No.: Sxxx) - Transaction Details, with Tx status. |
| 2 | EAINT-12019-REQ-037 | Document Buttons | Invoice, e-Invoice and Delivery Order buttons aligned together. | The three document buttons appear on the same row, right-aligned. |
| 3 | EAINT-12019-REQ-038 | Vehicle & Remarks | Show colour, vehicle type, pickup remark and drop-off remark. | Values show "-" when empty. |
| 4 | EAINT-12019-REQ-039 | Delivery Tracking | Show delivery tracking with In Transit / Delivered timestamps, failure handling and a Next Action note. | Failure records show reason and Next Action. |
| 5 | EAINT-12019-REQ-040 | Vehicle Photos | BackOffice user can view driver-uploaded pickup and drop-off photos via a photo viewer. | Photo viewer opens pickup and drop-off photo sets. Note: production requires backend photo storage. |

### 2.2.12 BackOffice — Logistics Charges Matrix Setup

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-041 | Matrix Access | A Charges Matrix Setup page allows updating logistics prices per tier. | The setup page is reachable and lists all rate tiers. |
| 2 | EAINT-12019-REQ-042 | Editable Rates | Rate values are editable (numeric input). | Rate fields accept numeric values only. |
| 3 | EAINT-12019-REQ-043 | Mandatory Reason | Each save requires a Reason to be entered. | Save is blocked until a Reason is provided. |
| 4 | EAINT-12019-REQ-044 | Audit Trail | A change history logs who, when, old → new value and reason for every change. | Change history records Changed By, timestamp, tier, old value, new value and reason; numbering is ascending. |
| 5 | EAINT-12019-REQ-045 | Applies to Both | Matrix pricing applies to both wholesale and standalone. | Updated rates take effect for both request types. |

### 2.2.13 Driver App — Pick-Up Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-046 | Scan Vehicle | Driver scans the QR code / enters the vehicle registration to load the pick-up job. | Entering a valid registration loads the matching pick-up job. |
| 2 | EAINT-12019-REQ-047 | Confirm Details | Confirmation screen shows the Vehicle and UCD (seller) details. | Confirm screen shows vehicle and UCD name / ROC. |
| 3 | EAINT-12019-REQ-048 | Photo Upload | Driver uploads the required 12 photos before submitting. | Submit is enabled only when 12/12 photos are captured. |
| 4 | EAINT-12019-REQ-049 | Status Update | On submit, the delivery status is updated. | After submit, delivery status = In Transit. |

### 2.2.14 Driver App — Drop-Off Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-050 | Drop-off Scan | Driver scans / enters the vehicle registration to load the drop-off job. | Entering a valid registration loads the matching drop-off job. |
| 2 | EAINT-12019-REQ-051 | Drop-off Party | Confirmation screen shows the Drop-Off To party (Buyer / Dealer). | Shows Name, ROC and Drop-Off Address. |
| 3 | EAINT-12019-REQ-052 | Drop-off Photos | Driver uploads the required 12 drop-off photos before submitting. | Submit is enabled only when 12/12 photos are captured. |
| 4 | EAINT-12019-REQ-053 | Status Update | On submit, the delivery status is updated. | After submit, delivery status = Delivered. |

### 2.2.15 Failed Pick-Up / Drop-Off Handling

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-054 | Report Issue | Driver can report an inability to pick up or drop off the vehicle ("Can't pick up this vehicle? Report an issue"). | A report-issue path is available from the confirmation screen. |
| 2 | EAINT-12019-REQ-055 | Reason (Free Text) | Driver types a Reason as free text (no dropdown). | Reason is a mandatory free-text field. |
| 3 | EAINT-12019-REQ-056 | Evidence Photo | Evidence photo required to submit a failure. | Min 1, max 3 evidence photos; each max 5MB. |
| 4 | EAINT-12019-REQ-057 | Failed Status | Submitting a failure updates the delivery and Tx status. | Example 1: Pick-up failure → Delivery status = Pickup Failed, Tx status = Failed. ⏎ Example 2: Drop-off failure → Delivery status = Delivery Failed, Tx status = Failed. |
| 5 | EAINT-12019-REQ-058 | BackOffice Visibility | BackOffice can view the failure reason and evidence photos. | Failure reason, evidence photos and Next Action are visible in BackOffice details. |

### 2.2.16 Pending Items

| # | Item | Status |
| 1 | Trx No format (EM680000001) and Payment ID format (EM260805000001) — confirm with Nurul. | Pending |
| 2 | eMOVE open to all vehicle types? — confirm with Nurul. | Pending |
| 3 | Save & Continue Later behaviour and max days before a draft becomes Expired — confirm with Nurul. | Pending |
| 4 | eAuto Fee value (RM20 placeholder) — confirm with Nurul. | Pending |
| 5 | Charges matrix values (distance tiers, door-to-door surcharge) — confirm with Nurul. | Pending |
| 6 | Module placement: standalone vs under STMS — confirm with Nurul. | Pending |
| 7 | Input field validation specs (Remarks / Address) — confirm with Nurul. | Pending |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12019-REQ-001 | Added | Initial draft requirement |
| 2 | 0.1 | EAINT-12019-REQ-002 | Added | Initial draft requirement |
| 3 | 0.1 | EAINT-12019-REQ-003 | Added | Initial draft requirement |
| 4 | 0.1 | EAINT-12019-REQ-004 | Added | Initial draft requirement |
| 5 | 0.1 | EAINT-12019-REQ-005 | Added | Initial draft requirement |
| 6 | 0.1 | EAINT-12019-REQ-006 | Added | Initial draft requirement |
| 7 | 0.1 | EAINT-12019-REQ-007 | Added | Initial draft requirement |
| 8 | 0.1 | EAINT-12019-REQ-008 | Added | Initial draft requirement |
| 9 | 0.1 | EAINT-12019-REQ-009 | Added | Initial draft requirement |
| 10 | 0.1 | EAINT-12019-REQ-010 | Added | Initial draft requirement |
| 11 | 0.1 | EAINT-12019-REQ-011 | Added | Initial draft requirement |
| 12 | 0.1 | EAINT-12019-REQ-012 | Added | Initial draft requirement |
| 13 | 0.1 | EAINT-12019-REQ-013 | Added | Initial draft requirement |
| 14 | 0.1 | EAINT-12019-REQ-014 | Added | Initial draft requirement |
| 15 | 0.1 | EAINT-12019-REQ-015 | Added | Initial draft requirement |
| 16 | 0.1 | EAINT-12019-REQ-016 | Added | Initial draft requirement |
| 17 | 0.1 | EAINT-12019-REQ-017 | Added | Initial draft requirement |
| 18 | 0.1 | EAINT-12019-REQ-018 | Added | Initial draft requirement |
| 19 | 0.1 | EAINT-12019-REQ-019 | Added | Initial draft requirement |
| 20 | 0.1 | EAINT-12019-REQ-020 | Added | Initial draft requirement |
| 21 | 0.1 | EAINT-12019-REQ-021 | Added | Initial draft requirement |
| 22 | 0.1 | EAINT-12019-REQ-022 | Added | Initial draft requirement |
| 23 | 0.1 | EAINT-12019-REQ-023 | Added | Initial draft requirement |
| 24 | 0.1 | EAINT-12019-REQ-024 | Added | Initial draft requirement |
| 25 | 0.1 | EAINT-12019-REQ-025 | Added | Initial draft requirement |
| 26 | 0.1 | EAINT-12019-REQ-026 | Added | Initial draft requirement |
| 27 | 0.1 | EAINT-12019-REQ-027 | Added | Initial draft requirement |
| 28 | 0.1 | EAINT-12019-REQ-028 | Added | Initial draft requirement |
| 29 | 0.1 | EAINT-12019-REQ-029 | Added | Initial draft requirement |
| 30 | 0.1 | EAINT-12019-REQ-030 | Added | Initial draft requirement |
| 31 | 0.1 | EAINT-12019-REQ-031 | Added | Initial draft requirement |
| 32 | 0.1 | EAINT-12019-REQ-032 | Added | Initial draft requirement |
| 33 | 0.1 | EAINT-12019-REQ-033 | Added | Initial draft requirement |
| 34 | 0.1 | EAINT-12019-REQ-034 | Added | Initial draft requirement |
| 35 | 0.1 | EAINT-12019-REQ-035 | Added | Initial draft requirement |
| 36 | 0.1 | EAINT-12019-REQ-036 | Added | Initial draft requirement |
| 37 | 0.1 | EAINT-12019-REQ-037 | Added | Initial draft requirement |
| 38 | 0.1 | EAINT-12019-REQ-038 | Added | Initial draft requirement |
| 39 | 0.1 | EAINT-12019-REQ-039 | Added | Initial draft requirement |
| 40 | 0.1 | EAINT-12019-REQ-040 | Added | Initial draft requirement |
| 41 | 0.1 | EAINT-12019-REQ-041 | Added | Initial draft requirement |
| 42 | 0.1 | EAINT-12019-REQ-042 | Added | Initial draft requirement |
| 43 | 0.1 | EAINT-12019-REQ-043 | Added | Initial draft requirement |
| 44 | 0.1 | EAINT-12019-REQ-044 | Added | Initial draft requirement |
| 45 | 0.1 | EAINT-12019-REQ-045 | Added | Initial draft requirement |
| 46 | 0.1 | EAINT-12019-REQ-046 | Added | Initial draft requirement |
| 47 | 0.1 | EAINT-12019-REQ-047 | Added | Initial draft requirement |
| 48 | 0.1 | EAINT-12019-REQ-048 | Added | Initial draft requirement |
| 49 | 0.1 | EAINT-12019-REQ-049 | Added | Initial draft requirement |
| 50 | 0.1 | EAINT-12019-REQ-050 | Added | Initial draft requirement |
| 51 | 0.1 | EAINT-12019-REQ-051 | Added | Initial draft requirement |
| 52 | 0.1 | EAINT-12019-REQ-052 | Added | Initial draft requirement |
| 53 | 0.1 | EAINT-12019-REQ-053 | Added | Initial draft requirement |
| 54 | 0.1 | EAINT-12019-REQ-054 | Added | Initial draft requirement |
| 55 | 0.1 | EAINT-12019-REQ-055 | Added | Initial draft requirement |
| 56 | 0.1 | EAINT-12019-REQ-056 | Added | Initial draft requirement |
| 57 | 0.1 | EAINT-12019-REQ-057 | Added | Initial draft requirement |
| 58 | 0.1 | EAINT-12019-REQ-058 | Added | Initial draft requirement |
