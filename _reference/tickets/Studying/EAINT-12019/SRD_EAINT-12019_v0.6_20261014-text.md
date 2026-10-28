# SRD_EAINT-12019_v0.6_20261014.docx — text copy (27/10/2026, 4:50:24 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-UCD] eMOVE – Standalone Logistics Service |
| Version | Version 0.6 |
| Latest Revision Date | 14.10.2026 (Wednesday) |

CONTENTS
1.0 DOCUMENT INFORMATION 4
1.1 Purpose 4
1.2 Intended Audience 4
1.3 Revision History 4
1.4 Glossary of Terms 6
1.5 Associated Document(s) 8
2.0 REQUIREMENT 10
2.1 High-Level Requirement Overview 10
2.1.1 Assumptions 11
2.1.2 Out-of-Scope 12
2.2 Key Highlights and Baseline Requirements 13
2.2.1 Background 13
2.2.2 Existing Issue & Expected Behaviour 15
2.2.3 Affected Pages 16
2.2.4 UCD Portal — eMOVE Entry & Logistics Landing 17
2.2.5 UCD Portal — Logistics Transaction Listing 19
2.2.5.1 UCD Portal — Search & Filter Panel 20
2.2.5.2 UCD Portal — Listing Columns 26
2.2.6 UCD Portal — Create Logistics Request (Wizard) 33
2.2.6.1 Step 1 — Vehicle Search & Details 35
2.2.6.2 Step 1 — Pick-Up & Drop-Off Details 40
2.2.6.3 Step 2 — Summary & Charges 54
2.2.6.4 Step 3 — Payment 64
2.2.6.5 Payment Scenarios 68
2.2.7 UCD Portal — Logistics Charges & Pricing 70
2.2.8 UCD Portal — eMOVE Transaction Details Page 73
2.2.9 eMOVE Transaction & Payment ID Formats 78
2.2.10 BackOffice — eMOVE Transaction Listing 80
2.2.10.1 BackOffice — Search & Filter Panel 82
2.2.10.2 BackOffice — Listing Columns 95
2.2.11 BackOffice — eMOVE Transaction Details Page 102
2.2.12 Amount Reconciliation 107
2.2.13 BackOffice — Logistics Hub 108
2.2.14 BackOffice — Logistics Pricing History 109
2.2.15 Delivery Order 110
2.2.16 Delivery Order Email — Content 114
2.2.17 Logistics Driver — Pick-Up Scan & Photo Upload 116
2.2.18 Logistics Driver — Drop-Off Scan & Photo Upload 118
2.2.19 Failed Pick-Up / Drop-Off Handling 120
Appendix — Requirement Change Log 124

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 06.08.2026 (Thurs) | Chee Mei Jia | Initial Draft |
| 0.2 | 04.09.2026 (Fri) | Chee Mei Jia | Updated Section 1.5 Associated Documents ⏎ Updated Sections 2.1.1 to 2.2.8 ⏎ Updated Section 2.2.12 Charges Matrix Setup ⏎ Removed Section 2.2.16 Pending Items |
| 0.3 | 14.09.2026 (Mon) | Chee Mei Jia | Updated Sections 1.4 and 1.5 ⏎ Updated Sections 2.1.1 to 2.2.12 ⏎ Added Sections 2.2.10 and 2.2.13 ⏎ Renumbered Sections 2.2.11 to 2.2.17 |
| 0.4 | 17.09.2026 (Thurs) | Chee Mei Jia | Updated Section 2.1.1 Assumptions ⏎ Updated Sections 2.2.6 and 2.2.7 ⏎ Updated Section 2.2.13 Amount Reconciliation ⏎ Updated Sections 1.4, 1.5, 2.2.5 and 2.2.11 ⏎ Added Section 2.2.15 Delivery Order |
| 0.5 | 09.10.2026 (Fri) | Chee Mei Jia | a. Added open items for confirmation in Sections 2.2.6, 2.2.11 and 2.2.12. ⏎ b. Added open items for confirmation in Sections 2.2.15, 2.2.17 and 2.2.19. ⏎ c. Updated Additional Note in Section 2.2.1. ⏎ d. Added Sections 2.2.15 and 2.2.16 from EAINT-12119. ⏎ e. Restructured Sections 2.2.6 to 2.2.16. |
| 0.6 | 14.10.2026 (Wed) | Chee Mei Jia | a. Removed open items in Sections 2.2.6 and 2.2.9. ⏎ b. Confirmed Trans Type and RHB Ref 2 in Section 2.2.9. |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | eMOVE / eAuto MOVE | Standalone car logistics service under eAuto, covering arrangement and delivery. |
| 2 | UCD | Used Car Dealer. |
| 3 | eSTM | Electronic Sale & Transfer Module. eMOVE is available once eSTM is approved. |
| 4 | STMS | Sales & Transfer Management System. |
| 5 | SST | Sales & Service Tax. |
| 6 | ROC | Registration of Company number. |
| 7 | Trx No | Transaction Number. |
| 8 | PO | Purchase Order, used for vendor payment through MotoHub. |
| 9 | MotoHub | Vendor payment platform used for Logistics Driver and transporter payment requests. |
| 10 | Hub-to-Hub | Pick-Up and Drop-Off at eAuto branch hubs. |
| 11 | Door-to-Door | Pick-Up and/or Drop-Off at a custom address. |
| 12 | Pricing Tier | Charge band determined by distance range of a delivery. |
| 13 | Logistics Price | Amount charged to a Used Car Dealer for a delivery falling within a pricing tier. |
| 14 | Hub Management | BackOffice page maintained under EAINT-12119 holding hub records, their verification status and their active status. |
| 15 | DO | Delivery Order. |
| 16 | PIC | Person In Charge, the receiver named for a Drop-Off. |
| 17 | RHB | Bank used to collect eMOVE payment. |
| 18 | Company ID | Identifier of a Used Car Dealer company, appended to Reference 1 sent to RHB. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12019 — [eAuto-UCD] eMOVE – Standalone Logistics Service | https://mfservices.atlassian.net/browse/EAINT-12019 | Internal IT ticket |
| 2 | EAUTO-936 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/EAUTO-936 | Source ticket |
| 3 | CCB-827 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/CCB-827 | Cross-department ticket |
| 4 | EAINT-12119 — Logistics: Interstate Price Tier for Logistics Delivery | https://mfservices.atlassian.net/browse/EAINT-12119 | Internal IT ticket, baselined at Version 1.3 on 23.09.2026. Logistics pricing, distance measurement, hub management, address validation and payment re-pricing are delivered under this ticket. eMOVE follows that same logic. |
| 5 | EAINT-11731 — eAuto-Wholesale: implement new Logistics Flow | https://mfservices.atlassian.net/browse/EAINT-11731 | Internal IT ticket, baselined at Version 1.3 on 06.07.2026. eMOVE Delivery Order follows the format delivered under this ticket. |
| 6 | eAuto Delivery Order templates (Seller and Buyer copies) | eAuto_DeliveryOrder_Seller_20260706 and eAuto_DeliveryOrder_Buyer_20260706 | Layout reference for the eMOVE Delivery Order, covering the Vehicle Photo Checklist, acknowledgement blocks and Logistics Verification QR block. |
| 7 | EAINT-2450 — [eAuto] [STMS] Transaction Listing: issue e-Invoice following successful transaction | SRD_EAINT-2450_e-Invoice_STMS_Transaction_Listing_V1_0_12062025 | Internal IT ticket, baselined at Version 1.0 on 12.06.2025. LHDN Response Status values, column and filter follow behaviour delivered under this ticket. |
| 8 | EAINT-638 — STMS & eSTM Housekeeping Cronjob | SRD_EAINT-638_STMS_eSTM_Housekeeping_Cronjob_20241212_V1_1 | Internal IT ticket, baselined at Version 1.1 on 12.12.2024. 45-day transaction expiry handling follows behaviour delivered under this ticket. |
| 9 | eMOVE Prototypes — UCD Portal, BackOffice and Logistics Driver | 1. EAINT-12019_eMOVE_Logistics_UCD_20261009.html ⏎ 2. EAINT-12019_eMOVE_Logistics_Backoffice_20261009.html ⏎ 3. EAINT-12019_eMOVE_Logistics_Driver_PickUp_20261009.html ⏎ 4. EAINT-12019_eMOVE_Logistics_Driver_DropOff_20261009.html | Reference for wizard flow, charges breakdown and delivery status layout. |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Introduce eMOVE, a standalone car logistics module in UCD Portal, available after a UCD-to-UCD interstate transfer or eSTM is complete. Used Car Dealers can request Pick-Up and delivery, pay online, track delivery progress and receive invoices. |
| 2.1.2 | Key Value(s) Expected | 1. Broaden logistics reach under eAuto wholesale marketplace. ⏎ 2. Offer logistics as a self-service module with automated charging and delivery tracking. |
| 2.1.3 | Additional Note(s) | Vendor payment is handled through MotoHub, by creating a Purchase Order followed by a payment request, and is settled monthly by quantity of completed jobs. ⏎ Logistics pricing follows a charges matrix maintained under EAINT-12119. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Tier values and distance ranges follow charges matrix maintained under EAINT-12119. Door-to-Door surcharge is a fixed rate already in use in Wholesale production, and eMOVE applies that same rate. |
| 2 | eMOVE is available only after a UCD-to-UCD interstate transfer or eSTM is completed and approved. |
| 3 | Vendor payment is handled through MotoHub, by creating a Purchase Order followed by a payment request, and is settled monthly by the quantity of completed jobs. |
| 4 | SST is charged at 8% on eAuto Fee only. As no eAuto Fee is charged in this phase, SST amount is RM0.00. |
| 5 | Only the first 3 vehicle types are supported in this phase: Sedan / Hatchback, SUV / MPV and Pick-Up / 4x4. ⏎ Motorcycle and Commercial / Lorry are shown in the dropdown, greyed out and labelled (Coming Soon). |
| 6 | eMOVE is an internal module for this phase. It applies only to STMS and eSTM approved transactions, including UCD-to-UCD interstate transfer. |
| 7 | eAuto measures distance used for pricing. Logistics provider does not supply it. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | MotoHub vendor payment and finance module build | Detailed finance flow is tracked separately and only referenced in this document. |
| 2 | Non-UCD portals | eMOVE is delivered in UCD Portal only for this phase. |
| 3 | Native Logistics Driver mobile application development | Logistics Driver flow is shown as a web and mobile prototype. Native application build is separate. |
| 4 | Public or open access to eMOVE | Confirmed that this phase applies to an internal module only, limited to STMS and eSTM approved transactions. ⏎ Opening eMOVE to public use is a future phase and is not covered by this document. |
| 5 | BackOffice Logistics Charges Matrix Setup page build | Matrix setup page and interstate distance tier are delivered under EAINT-12119. eMOVE consumes that same matrix and does not build a second setup page. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. UCD ⏎ 2. BackOffice ⏎ 3. Logistics Driver |
| 3 | Module | eMOVE, a new standalone module in UCD Portal. |
| 4 | Request | Introduce eMOVE, a standalone logistics module for vehicle Pick-Up and Drop-Off. ⏎ Note: eMOVE applies to transactions already approved in STMS, including UCD to UCD, and in eSTM. |
| 5 | Additional Note | 1. Transfer options are Door-to-Door and Hub-to-Hub, selected separately for Pick-Up and for Drop-Off. ⏎ 2. Logistics fee is calculated automatically by distance, vehicle type, delivery method and location. ⏎ 3. Vendor payment is made through MotoHub and settled monthly by quantity of completed jobs. ⏎ 4. This phase is internal only, covering STMS and eSTM approved transactions including UCD to UCD interstate transfer. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | Not applicable. eMOVE is a new module and has no existing behaviour. |
| 2 | Expected New Handling / Behaviour | 1. Offer logistics as a standalone module in UCD Portal, for internal use in this phase. ⏎ 2. Available for STMS and eSTM approved transactions, including UCD-to-UCD interstate transfer. ⏎ 3. Used Car Dealer requests delivery. eAuto arranges Pick-Up and delivery, and charges per matrix. ⏎ 4. Logistics Driver scans a QR code to upload photos and update delivery status. ⏎ 5. Invoice and e-invoice are generated after payment. ⏎ 6. BackOffice portal to view eMOVE transaction listing, including payment status. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | UCD Portal — Home / Logistics Landing | New Logistics entry point and eMOVE landing page. |
| 2 | UCD Portal — Logistics Transaction Listing | New listing of eMOVE transactions. |
| 3 | UCD Portal — Create Logistics Request (Wizard) | New 3-step create flow covering vehicle and locations, summary and charges, then payment. |
| 4 | UCD Portal — Transaction Details | New details page with charges, delivery status and documents. |
| 5 | BackOffice — eMOVE Transaction Listing | New listing with filters, added to existing menu. |
| 6 | BackOffice — Transaction Details | New details page with documents, tracking and photo viewer. |
| 7 | BackOffice — Logistics Hub | No change to this module. eMOVE reads its hub listing from Hub Management and its rates from Logistics Charges Matrix Setup. For more details, refer to EAINT-12119. |
| 8 | Logistics Driver — Pick-Up & Drop-Off Scan | New scan, photo upload and failure handling flows. |

### 2.2.4 UCD Portal — eMOVE Entry & Logistics Landing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-001 | eMOVE Entry Point | Add a Logistics entry in UCD Portal home to access eMOVE module. | Selecting Logistics from UCD Portal home navigates to eMOVE Logistics landing page. |
| 2 | EAINT-12019-REQ-002 | Landing Options | Logistics landing presents 2 actions. ⏎ Button Name: TRANSACTION LISTING ⏎ 1. Button Function: Click to open the logistics transaction listing in Section 2.2.5. ⏎ Button Name: CREATE NEW LOGISTICS ⏎ 1. Button Function: Click to open the create logistics request wizard in Section 2.2.6. | Example 1: Used Car Dealer opens the Logistics landing ⏎ a. TRANSACTION LISTING and CREATE NEW LOGISTICS are both displayed. |
| 3 | EAINT-12019-REQ-003 | Service Availability | eMOVE is offered as a standalone module in UCD Portal. ⏎ For this phase eMOVE is internal only. It is available for transactions approved in STMS and eSTM, including UCD-to-UCD interstate transfer. ⏎ Open: whether an approved STMS or eSTM transaction must fall within a time window is pending confirmation by requestor. ⏎ Example under consideration: Used Car Dealer keys in vehicle number ABC1234. System checks for an approved STMS or eSTM transaction within 7 days. Where one is found, related information is prepopulated. Where none is found, or the approval is more than 7 days old, an error message is shown. ⏎ Popup Content: There is no approved STMS & eSTM within 7 days. | Example 1: STMS or eSTM transaction is approved, including UCD-to-UCD interstate transfer ⏎ a. eMOVE is available for the vehicle. ⏎ Example 2: STMS or eSTM transaction is not yet approved ⏎ a. eMOVE is not offered for the vehicle. ⏎ Example 3: Vehicle has no STMS or eSTM transaction ⏎ a. eMOVE is not offered. Access beyond internal use is not supported in this phase. |

### 2.2.5 UCD Portal — Logistics Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-004 | Listing Sort Order | Listing is sorted by created date and time, newest first. | Example 1: Several transactions created on different dates ⏎ a. Most recently created transaction is shown in row 1. ⏎ Example 2: Several transactions created on the same date ⏎ a. Where the created time is the same, rows are ordered by Transaction No in descending order. |
| 2 | EAINT-12019-REQ-005 | e-Invoice Submission Precondition | An e-Invoice is submitted to LHDN only after payment succeeds. A transaction with a failed payment is never submitted, so its LHDN Response Status stays a dash and Remarks carry the payment failure text only. | Example 1: Payment status is OK ⏎ a. e-Invoice is submitted to LHDN and LHDN Response Status reflects that outcome. ⏎ Example 2: Payment status is Failed ⏎ a. No e-Invoice is submitted. ⏎ b. LHDN Response Status is a dash. ⏎ c. Remarks carry the payment failure text. ⏎ Example 3: Payment status is Pending ⏎ a. No e-Invoice is submitted and LHDN Response Status is a dash. |

### 2.2.5.1 UCD Portal — Search & Filter Panel

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-006 | Vehicle No. | Refer to Vehicle No. on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 10 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Alphanumeric, system will auto remove from the text field. ⏎ 2. Spacing is removed automatically. ⏎ 3. Entry is displayed in uppercase automatically. ⏎ 4. Field stops accepting input at 10 characters, so the maximum cannot be exceeded. | Example 1: wmj 7742 keyed in ⏎ a. Field displays WMJ7742. ⏎ b. Listing returns that vehicle only. ⏎ Example 2: Left empty ⏎ a. Vehicle No is not applied as a filter. ⏎ Example 3: 10 characters already keyed in and a further character is typed ⏎ a. The 11th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 2 | EAINT-12019-REQ-007 | Transaction No. | Refer to Transaction No. on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric only. ⏎ 2. Min Characters: 1 ⏎ 3. Max Characters: 20 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 20 characters, so the maximum cannot be exceeded. | Example 1: EM690000019 keyed in ⏎ a. Listing returns that transaction only. ⏎ Example 2: Left empty ⏎ a. Transaction No is not applied as a filter. ⏎ Example 3: 20 characters already keyed in and a further character is typed ⏎ a. The 21th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 3 | EAINT-12019-REQ-008 | Date Created From | Refer to Date Created From on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Mandatory unless another filter is set ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. | Example 1: 01-09-2026 selected ⏎ a. Listing returns transactions created on or after 01-09-2026. |
| 4 | EAINT-12019-REQ-009 | Date Created To | Refer to Date Created To on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Mandatory unless another filter is set ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. ⏎ 2. On selecting Date Created From, the system auto selects this field. ⏎ 3. Auto selected value is 1 month after Date Created From, or today where that falls in the future. ⏎ 4. Future dates cannot be selected. | Example 1: Today is 11.10.2026 and Date Created From is 01.01.2026 ⏎ a. Date Created To is auto selected as 11.10.2026. ⏎ Example 2: Date Created From is 01.09.2026 ⏎ a. Date Created To is auto selected as 01.10.2026. |
| 5 | EAINT-12019-REQ-010 | Service Type | Refer to Service Type on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. Door-to-Door ⏎ 3. Hub-to-Hub ⏎ 4. Door Pick-Up / Hub Drop-Off ⏎ 5. Hub Pick-Up / Door Drop-Off | Example 1: All selected ⏎ a. Listing returns every service type. ⏎ Example 2: Door-to-Door selected ⏎ a. Listing returns Door-to-Door requests only. ⏎ Example 3: Hub-to-Hub selected ⏎ a. Listing returns Hub-to-Hub requests only. ⏎ Example 4: Door Pick-Up / Hub Drop-Off selected ⏎ a. Listing returns that combination only. ⏎ Example 5: Hub Pick-Up / Door Drop-Off selected ⏎ a. Listing returns that combination only. |
| 6 | EAINT-12019-REQ-011 | Payment Status | Refer to Payment Status on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. - ⏎ 3. Pending ⏎ 4. Failed ⏎ 5. OK | Example 1: All selected ⏎ a. Listing returns every payment status. ⏎ Example 2: "-" selected ⏎ a. Listing returns requests with no payment attempted. ⏎ Example 3: Pending selected ⏎ a. Listing returns requests awaiting a bank response. ⏎ Example 4: Failed selected ⏎ a. Listing returns rejected payments only. ⏎ Example 5: OK selected ⏎ a. Listing returns confirmed payments only. |
| 7 | EAINT-12019-REQ-012 | Tx Status | Refer to Tx Status on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. Pending ⏎ 3. Completed ⏎ 4. Failed ⏎ 5. Expired ⏎ 6. Cancelled | Example 1: All selected ⏎ a. Listing returns every transaction status. ⏎ Example 2: Pending selected ⏎ a. Listing returns Pending requests only. ⏎ Example 3: Completed selected ⏎ a. Listing returns Completed requests only. ⏎ Example 4: Failed selected ⏎ a. Listing returns Failed requests only. ⏎ Example 5: Expired selected ⏎ a. Listing returns Expired requests only. ⏎ Example 6: Cancelled selected ⏎ a. Listing returns Cancelled requests only. |
| 8 | EAINT-12019-REQ-013 | Delivery Status | Refer to Delivery Status on the UCD Portal logistics transaction listing filter. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. - ⏎ 3. Pending Pick-Up ⏎ 4. In Transit ⏎ 5. Delivered ⏎ 6. Pick-Up Failed ⏎ 7. Delivery Failed | Example 1: All selected ⏎ a. Listing returns every delivery status. ⏎ Example 2: "-" selected ⏎ a. Listing returns requests not yet arranged. ⏎ Example 3: Pending Pick-Up selected ⏎ a. Listing returns requests awaiting collection. ⏎ Example 4: In Transit selected ⏎ a. Listing returns requests in transit. ⏎ Example 5: Delivered selected ⏎ a. Listing returns delivered requests. ⏎ Example 6: Pick-Up Failed selected ⏎ a. Listing returns failed collections. ⏎ Example 7: Delivery Failed selected ⏎ a. Listing returns failed deliveries. |

### 2.2.5.2 UCD Portal — Listing Columns

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-014 | # | Row number within the current result set. | Example 1: 7 transactions returned ⏎ a. First row shows 1, last row shows 7. |
| 2 | EAINT-12019-REQ-015 | Vehicle | Refer to the vehicle number the Used Car Dealer keyed in at Step 1. | Example 1: Request created for WMJ7742 ⏎ a. Column shows WMJ7742. |
| 3 | EAINT-12019-REQ-016 | Trx No | Logistics Transaction No, format per EAINT-12019-REQ-104. | Example 1: Transaction created in September 2026 ⏎ a. Column shows EM690000019. |
| 4 | EAINT-12019-REQ-017 | Created At | Date and time the request was created. ⏎ Format DD-MM-YYYY HH:mm in 24-hour time. | Example 1: Created on 2 September 2026 at 9.15am ⏎ a. Column shows 02-09-2026 09:15. |
| 5 | EAINT-12019-REQ-018 | Pick-Up | State the vehicle is collected from. Not a date. | Example 1: Pick-Up hub is in Selangor ⏎ a. Column shows Selangor. |
| 6 | EAINT-12019-REQ-019 | Drop Off | State the vehicle is delivered to. Not a date. | Example 1: Drop-Off address is in Johor ⏎ a. Column shows Johor. |
| 7 | EAINT-12019-REQ-020 | Payment | Payment status per EAINT-12019-REQ-020. | Example 1: Payment not yet attempted ⏎ a. Column shows "-". ⏎ Example 2: Payment submitted and awaiting bank response ⏎ a. Column shows "Pending". ⏎ Example 3: Bank rejected the payment ⏎ a. Column shows "Failed". ⏎ Example 4: Bank confirmed the payment ⏎ a. Column shows "OK". |
| 8 | EAINT-12019-REQ-021 | Delivery | Delivery status per EAINT-12019-REQ-021. | Example 1: Logistics job not yet arranged ⏎ a. Column shows "-". ⏎ Example 2: Job created and awaiting Logistics Driver collection ⏎ a. Column shows "Pending Pick-Up". ⏎ Example 3: Logistics Driver collected the vehicle ⏎ a. Column shows "In Transit". ⏎ Example 4: Logistics Driver completed Drop-Off ⏎ a. Column shows "Delivered". ⏎ Example 5: Logistics Driver could not collect the vehicle ⏎ a. Column shows "Pick-Up Failed". ⏎ Example 6: Logistics Driver could not hand over the vehicle ⏎ a. Column shows "Delivery Failed". |
| 9 | EAINT-12019-REQ-022 | Tx Status | Transaction status derived per EAINT-12019-REQ-012. | Example 1: Payment is OK and Delivery is Delivered ⏎ a. Column shows "Completed". ⏎ Example 2: Payment or Delivery has failed ⏎ a. Column shows "Failed". ⏎ Example 3: Any other combination ⏎ a. Column shows "Pending". ⏎ Example 4: Expired by housekeeping ⏎ a. Column shows "Expired". ⏎ Example 5: Cancelled by a BackOffice user ⏎ a. Column shows "Cancelled". |
| 10 | EAINT-12019-REQ-023 | LHDN Response Status | Refer to e-Invoice submission outcome. | Example 1: No e-Invoice submitted, or awaiting validation feedback ⏎ a. Column shows "-". ⏎ Example 2: LHDN (MyInvois Portal) accepted the submission ⏎ a. Column shows "OK". ⏎ Example 3: LHDN (MyInvois Portal) rejected the submission ⏎ a. Column shows "Failed". ⏎ Note: N/A is carried from the production value set but cannot occur in eMOVE, which was delivered after e-Invoice deployment. |
| 11 | EAINT-12019-REQ-024 | Amount (RM) | Refer to total amount paid by the Used Car Dealer. ⏎ 2 decimal places with a thousands separator. | Example 1: Total charged is RM850 ⏎ a. Column shows 850.00. ⏎ Example 2: Total paid is RM1,000 ⏎ a. Column shows 1,000.00. |
| 12 | EAINT-12019-REQ-025 | Remarks | Remark held against the transaction. Dash when empty. | Example 1: No remark held against the transaction ⏎ a. Column shows empty. ⏎ Example 2: Transaction expired by housekeeping ⏎ a. Column shows "Transaction Expired". ⏎ Example 3: Cancelled by a BackOffice user with login ID eautoadmin ⏎ a. Column shows "CANCELLED BY eautoadmin on 25-09-2026 16:38". ⏎ Example 4: Cancelled by a UCD user with login ID ucdberjaya ⏎ a. Column shows "CANCELLED BY ucdberjaya on 25-09-2026 16:38". |
| 13 | EAINT-12019-REQ-026 | Action | Refer to the links available on the transaction row. ⏎ Link Name: View ⏎ 1. Link Function: Click to open the eMOVE Transaction Details page for that transaction. ⏎ Link Name: Cancel ⏎ 1. Link Function: Click to cancel that transaction. Transaction Status is updated to "Cancelled", and Cancelled Date, Cancelled By and Remarks are stamped. ⏎ Additional Handling/Notes: ⏎ 1. Transaction Status "Pending", or "Failed" with no payment made: both Used Car Dealer and BackOffice user can cancel. ⏎ 2. Transaction Status "Failed" with payment made: only a BackOffice user can cancel. ⏎ 3. Transaction Status "Completed", "Expired" or "Cancelled": Cancel is not offered. | Example 1: Transaction Status is "Pending" ⏎ a. Column shows "View" and "Cancel". ⏎ Example 2: Transaction Status is "Failed" with no payment made ⏎ a. Column shows "View" and "Cancel". ⏎ Example 3: Transaction Status is "Failed" with payment made ⏎ a. Column shows "View" only for a Used Car Dealer. ⏎ Example 4: Transaction Status is "Completed", "Expired" or "Cancelled" ⏎ a. Column shows "View" only. ⏎ Example 5: "View" clicked ⏎ a. eMOVE Transaction Details page is displayed. ⏎ Example 6: "Cancel" clicked and confirmed ⏎ a. Transaction Status is updated to "Cancelled". ⏎ b. Listing is refreshed and "Cancel" is no longer offered on that row. |

### 2.2.6 UCD Portal — Create Logistics Request (Wizard)

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-027 | 45-Day Transaction Expiry | An eMOVE transaction that has not been completed is expired 45 days after its created date. ⏎ A daily housekeeping cron job runs at 2am, processes records in batches of 100, and updates every transaction created 45 days or more before that run. Follows EAINT-638. ⏎ Statuses eligible for expiry: ⏎ 1. Saved draft not yet submitted ⏎ 2. Payment status Pending ⏎ 3. Payment status Failed ⏎ A transaction with Payment status OK is never expired, whatever its delivery status. ⏎ Fields updated on expiry: ⏎ 1. Transaction Status - updated to Expired ⏎ 2. Remarks - updated to Transaction Expired, replacing any payment failure text held ⏎ 3. Cancel Flag - set to N ⏎ 4. Cancelled Date - real time that batch ran, so records in different batches carry different times ⏎ 5. Cancelled By - set to 99000/cronjob | Example 1: Draft or unpaid transaction created 45 days or more before a cron run ⏎ a. Transaction Status is updated to Expired. ⏎ b. Remarks show Transaction Expired. ⏎ c. Cancel Flag is set to N. ⏎ d. Cancelled Date is stamped with that batch run time and Cancelled By is 99000/cronjob. ⏎ Example 2: Transaction created less than 45 days before a cron run ⏎ a. Transaction is left unchanged. ⏎ Example 3: Transaction with Payment status OK ⏎ a. Transaction is not expired, whatever its delivery status. ⏎ Example 4: Transaction with Payment status Failed carrying payment failure text in Remarks ⏎ a. Transaction is expired and Remarks are replaced with Transaction Expired. ⏎ Example 5: Records not completed within a single run ⏎ a. Remaining records are picked up on the next daily run, together with any newly eligible records. |

### 2.2.6.1 Step 1 — Vehicle Search & Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-028 | Vehicle Search | Refer to the vehicle number the Used Car Dealer keys in and searches on. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 10 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Alphanumeric, system will auto remove from the text field. ⏎ 2. Spacing is removed automatically. ⏎ 3. Entry is displayed in uppercase automatically. ⏎ 4. Field stops accepting input at 10 characters, so the maximum cannot be exceeded. ⏎ Criteria 1: an approved STMS, UCD to UCD, or eSTM transaction exists for that vehicle. ⏎ Criteria 2: JPJ Approved Date falls within 7 days, counting the approval date as Day 1. ⏎ Button Name: Search ⏎ 1. Button Function: Click to run both criteria and, where both pass, prepopulate the vehicle fields below. | Example 1: Vehicle approved on 11.10.2026 and searched on 17.10.2026, which is Day 7 ⏎ a. Both criteria pass. ⏎ b. Vehicle fields are prepopulated. ⏎ Example 2: Vehicle approved on 11.10.2026 and searched on 18.10.2026, which is Day 8 ⏎ a. Criteria 2 fails and the Used Car Dealer cannot proceed. ⏎ Example 3: No approved STMS, UCD to UCD or eSTM transaction for that vehicle ⏎ a. Criteria 1 fails and the Used Car Dealer cannot proceed. ⏎ Popup Content: There is no approved STMS & eSTM within 7 days. ⏎ Example 4: 10 characters already keyed in and a further character is typed ⏎ a. The 11th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 2 | EAINT-12019-REQ-029 | Prepopulated Vehicle Fields | Refer to the vehicle fields prepopulated from Step 2 of the source transaction, being STMS, UCD to UCD or eSTM. ⏎ Field Type: Text Field (Read Only) ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty before Search ⏎ Additional Handling/Notes: ⏎ 1. Prepopulated fields are Engine No, Chassis No, Vehicle Make & Model and Manufacturing Year. ⏎ 2. Fields are read-only and cannot be edited by the Used Car Dealer. | Example 1: Source transaction is an approved STMS or UCD to UCD ⏎ a. All 4 fields are prepopulated and read-only. ⏎ Example 2: Source transaction is an approved eSTM ⏎ a. Engine No and Chassis No are prepopulated. ⏎ b. Vehicle Make & Model and Manufacturing Year are pending confirmation by requestor. |
| 3 | EAINT-12019-REQ-030 | Colour | Refer to the vehicle colour. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphabet only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 30 ⏎ Additional Handling/Notes: ⏎ 1. Not prepopulated. Keyed in by the Used Car Dealer. ⏎ 2. If key in other than Alphabet, system will auto remove from the text field. ⏎ 3. Field stops accepting input at 30 characters, so the maximum cannot be exceeded. | Example 1: Used Car Dealer keys in Silver ⏎ a. Colour shows Silver. ⏎ Example 2: Used Car Dealer leaves it empty ⏎ a. Colour is empty and the request can still proceed. ⏎ Example 3: 30 characters already keyed in and a further character is typed ⏎ a. The 31th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 4 | EAINT-12019-REQ-031 | Vehicle Type | Refer to the vehicle type. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: -- Select (optional) -- ⏎ Field Dropdown Option: ⏎ 1. Sedan / Hatchback ⏎ 2. SUV / MPV ⏎ 3. Pickup / 4x4 ⏎ 4. Motorcycle (Coming Soon) ⏎ 5. Commercial / Lorry (Coming Soon) ⏎ Additional Handling/Notes: ⏎ 1. Where a matching insurance record is held, the matching option is prepopulated. Where none is held, it is left empty. ⏎ 2. A prepopulated value stays editable. Used Car Dealer may select another option. ⏎ 3. Motorcycle and Commercial / Lorry are greyed out and not selectable in this phase. | Example 1: Insurance record holds SUV / MPV ⏎ a. Vehicle Type is prepopulated with SUV / MPV. ⏎ b. Used Car Dealer may change it to another selectable option. ⏎ Example 2: No insurance record held ⏎ a. Vehicle Type is empty and no message is shown. ⏎ Example 3: Used Car Dealer opens the dropdown ⏎ a. Motorcycle (Coming Soon) and Commercial / Lorry (Coming Soon) are shown greyed out and cannot be selected. |

### 2.2.6.2 Step 1 — Pick-Up & Drop-Off Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-032 | Service Type Selection | Refer to the service type chosen separately for Pick-Up and for Drop-Off. ⏎ Field Type: Radio Button ⏎ Field Mandatory: Mandatory ⏎ Field Default: Not selected ⏎ Field Option — Pick-Up Location: ⏎ 1. Door-to-Door Pickup (+RM200) ⏎ 2. Drop at Hub ⏎ Field Option — Drop Off Location: ⏎ 1. Door-to-Door Drop-Off (+RM200) ⏎ 2. Collect at Hub ⏎ Additional Handling/Notes: ⏎ 1. Door-to-Door Pickup: Logistics Driver collects the vehicle from the Used Car Dealer address and brings it to the Logistics Hub. ⏎ 2. Drop at Hub: Used Car Dealer sends the vehicle to the Logistics Hub themselves. ⏎ 3. Door-to-Door Drop-Off: Logistics Driver delivers the vehicle from the Logistics Hub to the receiving address. ⏎ 4. Collect at Hub: receiving party collects the vehicle from the Logistics Hub themselves. ⏎ 5. Door-to-Door adds RM200.00 per leg. Pick-Up and Drop-Off are charged separately. ⏎ 6. Hub-to-Hub carries no additional charge. | Example 1: Door-to-Door selected for Pick-Up only ⏎ a. RM200.00 is added once. ⏎ Example 2: Door-to-Door selected for both Pick-Up and Drop-Off ⏎ a. RM200.00 is added twice, totalling RM400.00. ⏎ Example 3: Drop at Hub and Collect at Hub selected ⏎ a. No surcharge is added. |
| 2 | EAINT-12019-REQ-033 | Pick-Up — State | Refer to Pick-Up location state. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Mandatory ⏎ Field Default: -- Select State -- ⏎ Field Dropdown Option: ⏎ 1. Selangor ⏎ 2. Kuala Lumpur ⏎ 3. Penang ⏎ 4. Perak ⏎ 5. Johor ⏎ 6. Melaka ⏎ 7. Negeri Sembilan ⏎ 8. Pahang ⏎ 9. Kedah ⏎ 10. Kelantan ⏎ 11. Terengganu ⏎ 12. Perlis ⏎ 13. Putrajaya ⏎ Additional Handling/Notes: ⏎ 1. Exclude Sabah, Sarawak and Labuan from the listing. | Example 1: Used Car Dealer opens the State dropdown ⏎ a. Sabah, Sarawak and Labuan are not listed. ⏎ Example 2: Selangor selected ⏎ a. State shows Selangor and the City / Town list is filtered to Selangor. |
| 3 | EAINT-12019-REQ-034 | Pick-Up — City / Town | Refer to Pick-Up location city or town. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Mandatory ⏎ Field Default: -- Select City / Town -- ⏎ Additional Handling/Notes: ⏎ 1. Display based on the State selected. ⏎ 2. Values follow eSTM Step 2. ⏎ 3. Sabah, Sarawak and Labuan towns are not listed. | Example 1: State is Selangor ⏎ a. City / Town lists Selangor towns only, for example Petaling Jaya. ⏎ Example 2: No State selected ⏎ a. City / Town is empty and cannot be opened. |
| 4 | EAINT-12019-REQ-035 | Pick-Up — Postcode | Refer to Pick-Up location postcode. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Numeric only. ⏎ 2. Min Characters: 5 ⏎ 3. Max Characters: 5 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Numeric, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 5 characters, so the maximum cannot be exceeded. | Example 1: 47800 keyed in ⏎ a. Postcode is accepted. ⏎ Example 2: 4780 keyed in ⏎ a. Postcode is rejected as it is not 5 digits. ⏎ Example 3: 5 characters already keyed in and a further character is typed ⏎ a. The 6th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 5 | EAINT-12019-REQ-036 | Pick-Up — Address | Refer to Pick-Up location address. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric and special character allowed. ⏎ 2. English characters only. ⏎ 3. Min Characters: 10 ⏎ 4. Max Characters: 255 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Example 1: No. 12, Jalan PJS 8/4, Mentari Court keyed in ⏎ a. Address is accepted. ⏎ Example 2: Fewer than 10 characters keyed in ⏎ a. Address is rejected. ⏎ Error Message: Pick Up Address must be at least 10 characters. ⏎ Displayed in red below the text field. No popup is shown. ⏎ Example 3: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 6 | EAINT-12019-REQ-037 | Pick-Up — Contact Person | Refer to the person handling the vehicle at the Pick-Up location. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphabet only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 100 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Alphabet, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 100 characters, so the maximum cannot be exceeded. | Example 1: Amshar Amin keyed in ⏎ a. Contact Person shows Amshar Amin. ⏎ Example 2: Left empty ⏎ a. Contact Person is rejected as it is mandatory. ⏎ Example 3: 100 characters already keyed in and a further character is typed ⏎ a. The 101th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 7 | EAINT-12019-REQ-038 | Pick-Up — Contact No | Refer to the contact number of the Contact Person. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Numeric only. ⏎ 2. Min Characters: 9 ⏎ 3. Max Characters: 11 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Numeric, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 11 characters, so the maximum cannot be exceeded. | Example 1: 0123456789 keyed in ⏎ a. Contact No is accepted. ⏎ Example 2: Letters keyed in ⏎ a. Letters are removed from the text field automatically. ⏎ Example 3: 11 characters already keyed in and a further character is typed ⏎ a. The 12th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 8 | EAINT-12019-REQ-039 | Pick-Up — Preferred Pick-Up Date | Refer to the date the Used Car Dealer wants the vehicle collected. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Selectable from the calendar only. Typing is not allowed. ⏎ 2. Future dates only. ⏎ 3. Maximum 30 days ahead of today. ⏎ Additional Handling/Notes: ⏎ 1. Format displayed: DD/MM/YYYY. ⏎ 2. Today, past dates and anything beyond 30 days are greyed out and not clickable. | Example 1: Today is 11.10.2026 and the calendar is opened ⏎ a. 12.10.2026 to 10.11.2026 are selectable. ⏎ b. 11.10.2026 and earlier are greyed out. ⏎ c. 11.11.2026 and later are greyed out. ⏎ Example 2: A selectable date is chosen ⏎ a. Field shows the date in DD/MM/YYYY format. ⏎ Example 3: Used Car Dealer types into the field ⏎ a. Typing is blocked and no value is entered. |
| 9 | EAINT-12019-REQ-040 | Pick-Up — Remarks | Refer to Pick-Up location remarks. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric and special character allowed. ⏎ 2. English characters only. ⏎ 3. Min Characters: 0 ⏎ 4. Max Characters: 255 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Example 1: Gate access code, contact before arrival keyed in ⏎ a. Remarks shows that text. ⏎ Example 2: Left empty ⏎ a. Remarks is empty and the request can still proceed. ⏎ Example 3: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 10 | EAINT-12019-REQ-041 | Drop-Off — State | Refer to Drop-Off location state. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Mandatory ⏎ Field Default: -- Select State -- ⏎ Field Dropdown Option: ⏎ 1. Selangor ⏎ 2. Kuala Lumpur ⏎ 3. Penang ⏎ 4. Perak ⏎ 5. Johor ⏎ 6. Melaka ⏎ 7. Negeri Sembilan ⏎ 8. Pahang ⏎ 9. Kedah ⏎ 10. Kelantan ⏎ 11. Terengganu ⏎ 12. Perlis ⏎ 13. Putrajaya ⏎ Additional Handling/Notes: ⏎ 1. Exclude Sabah, Sarawak and Labuan from the listing. | Example 1: Used Car Dealer opens the State dropdown ⏎ a. Sabah, Sarawak and Labuan are not listed. ⏎ Example 2: Selangor selected ⏎ a. State shows Selangor and the City / Town list is filtered to Selangor. |
| 11 | EAINT-12019-REQ-042 | Drop-Off — City / Town | Refer to Drop-Off location city or town. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Mandatory ⏎ Field Default: -- Select City / Town -- ⏎ Additional Handling/Notes: ⏎ 1. Display based on the State selected. ⏎ 2. Values follow eSTM Step 2. ⏎ 3. Sabah, Sarawak and Labuan towns are not listed. | Example 1: State is Selangor ⏎ a. City / Town lists Selangor towns only, for example Petaling Jaya. ⏎ Example 2: No State selected ⏎ a. City / Town is empty and cannot be opened. |
| 12 | EAINT-12019-REQ-043 | Drop-Off — Postcode | Refer to Drop-Off location postcode. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Numeric only. ⏎ 2. Min Characters: 5 ⏎ 3. Max Characters: 5 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Numeric, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 5 characters, so the maximum cannot be exceeded. | Example 1: 47800 keyed in ⏎ a. Postcode is accepted. ⏎ Example 2: 4780 keyed in ⏎ a. Postcode is rejected as it is not 5 digits. ⏎ Example 3: 5 characters already keyed in and a further character is typed ⏎ a. The 6th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 13 | EAINT-12019-REQ-044 | Drop-Off — Address | Refer to Drop-Off location address. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric and special character allowed. ⏎ 2. English characters only. ⏎ 3. Min Characters: 10 ⏎ 4. Max Characters: 255 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Example 1: No. 5, Jalan Molek 1/10, Taman Molek keyed in ⏎ a. Address is accepted. ⏎ Example 2: Fewer than 10 characters keyed in ⏎ a. Address is rejected. ⏎ Error Message: Drop Off Address must be at least 10 characters. ⏎ Displayed in red below the text field. No popup is shown. ⏎ Example 3: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 14 | EAINT-12019-REQ-045 | Drop-Off — Contact Person | Refer to the person handling the vehicle at the Drop-Off location. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphabet only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 100 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Alphabet, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 100 characters, so the maximum cannot be exceeded. | Example 1: Amshar Amin keyed in ⏎ a. Contact Person shows Amshar Amin. ⏎ Example 2: Left empty ⏎ a. Contact Person is rejected as it is mandatory. ⏎ Example 3: 100 characters already keyed in and a further character is typed ⏎ a. The 101th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 15 | EAINT-12019-REQ-046 | Drop-Off — Contact No | Refer to the contact number of the Contact Person. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Numeric only. ⏎ 2. Min Characters: 9 ⏎ 3. Max Characters: 11 ⏎ Additional Handling/Notes: ⏎ 1. If key in other than Numeric, system will auto remove from the text field. ⏎ 2. Field stops accepting input at 11 characters, so the maximum cannot be exceeded. | Example 1: 0123456789 keyed in ⏎ a. Contact No is accepted. ⏎ Example 2: Letters keyed in ⏎ a. Letters are removed from the text field automatically. ⏎ Example 3: 11 characters already keyed in and a further character is typed ⏎ a. The 12th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 16 | EAINT-12019-REQ-047 | Drop-Off — Remarks | Refer to Drop-Off location remarks. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric and special character allowed. ⏎ 2. English characters only. ⏎ 3. Min Characters: 0 ⏎ 4. Max Characters: 255 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Example 1: Gate access code, contact before arrival keyed in ⏎ a. Remarks shows that text. ⏎ Example 2: Left empty ⏎ a. Remarks is empty and the request can still proceed. ⏎ Example 3: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 17 | EAINT-12019-REQ-048 | Hub Selection | Refer to the Logistics Hub selected where Drop at Hub or Collect at Hub is chosen. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Mandatory ⏎ Field Default: -- Select Hub -- ⏎ Additional Handling/Notes: ⏎ 1. Hub list is filtered by the selected State. ⏎ 2. Values are taken from the Hub Management page maintained under EAINT-12119. | Example 1: Drop at Hub selected with State Selangor ⏎ a. Hub list shows Selangor hubs held in Hub Management. ⏎ Example 2: A hub with no usable coordinate is selected ⏎ a. Request cannot be priced and Step 2 is not reached. |
| 18 | EAINT-12019-REQ-049 | Next Button Validation | Validation run when Next is clicked on Step 1. ⏎ Button Name: Next ⏎ 1. Button Function: Click to validate every field on Step 1 and, where all pass, create the transaction and open Step 2 in Section 2.2.6.3. ⏎ Field Validation: ⏎ 1. All mandatory fields are completed. ⏎ 2. Each field passes its own validation in this section. ⏎ 3. A Door-to-Door address is matched by the mapping service. ⏎ 4. Distance is resolved so the request can be priced. ⏎ Additional Handling/Notes: ⏎ 1. Where all 4 pass, the transaction is created and saved with Transaction Status Pending. ⏎ 2. eMOVE has no Draft transaction status. A request is either not yet created, or created with Transaction Status Pending. | Example 1: All validation passes ⏎ a. Transaction is created and saved with Transaction Status Pending. ⏎ b. Step 2 is displayed. ⏎ Example 2: A mandatory field is empty ⏎ a. Transaction is not created. ⏎ b. Step 1 remains displayed with the error shown below that field. ⏎ Example 3: Address cannot be matched ⏎ a. Transaction is not created. ⏎ b. Step 1 remains displayed. ⏎ Popup Content: We could not find the address. Please check and try again, or contact support at 03-27798899. |

### 2.2.6.3 Step 2 — Summary & Charges

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-050 | Vehicle Number | Refer to Vehicle Number displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Vehicle Number ⏎ Field Source: Prepopulated from Step 1. | Example 1: Vehicle Number held on the request ⏎ a. Vehicle Number shows WMJ7742. |
| 2 | EAINT-12019-REQ-051 | Service Type | Refer to Service Type displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Service Type ⏎ Field Source: Prepopulated from Step 1. | Example 1: Service Type held on the request ⏎ a. Service Type shows Door-to-Door Pick-Up, Door-to-Door Drop-Off. |
| 3 | EAINT-12019-REQ-052 | Engine No | Refer to Engine No displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Engine No ⏎ Field Source: Prepopulated from Step 1. | Example 1: Engine No held on the request ⏎ a. Engine No shows 2NR4451120. |
| 4 | EAINT-12019-REQ-053 | Chassis No | Refer to Chassis No displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Chassis No ⏎ Field Source: Prepopulated from Step 1. | Example 1: Chassis No held on the request ⏎ a. Chassis No shows MHFXX445112. |
| 5 | EAINT-12019-REQ-054 | Vehicle Make & Model | Refer to Vehicle Make & Model displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Vehicle Make & Model ⏎ Field Source: Prepopulated from Step 1. | Example 1: Vehicle Make and Model held on the request ⏎ a. Vehicle Make & Model shows Toyota / Vios 1.5 G. |
| 6 | EAINT-12019-REQ-055 | Manufacturing Year | Refer to Manufacturing Year displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Manufacturing Year ⏎ Field Source: Prepopulated from Step 1. | Example 1: Manufacturing Year held on the request ⏎ a. Manufacturing Year shows 2021. |
| 7 | EAINT-12019-REQ-056 | Colour | Refer to Colour displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Colour ⏎ Field Source: Prepopulated from Step 1. Shows "-" where left empty. | Example 1: Colour held on the request ⏎ a. Colour shows Silver. ⏎ Example 2: Colour left empty on Step 1 ⏎ a. Colour shows "-". |
| 8 | EAINT-12019-REQ-057 | Vehicle Type | Refer to Vehicle Type displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Vehicle Type ⏎ Field Source: Prepopulated from Step 1. Shows "-" where left empty. | Example 1: Vehicle Type held on the request ⏎ a. Vehicle Type shows Sedan / Hatchback. ⏎ Example 2: Vehicle Type left empty on Step 1 ⏎ a. Vehicle Type shows "-". |
| 9 | EAINT-12019-REQ-058 | Pick-Up Location | Refer to Pick-Up Location displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Pick-Up Location ⏎ Field Source: Prepopulated from Step 1. ⏎ Additional Handling/Notes: ⏎ 1. Door-to-Door shows the full address as Address, Postcode City, State. ⏎ 2. Hub shows the hub name, state and full hub address. | Example 1: Door-to-Door selected ⏎ a. Pick-Up Location shows No. 12, Jalan PJS 8/4, Mentari Court, 47800 Petaling Jaya, Selangor. ⏎ Example 2: Hub selected ⏎ a. Pick-Up Location shows the hub name, state and full hub address. |
| 10 | EAINT-12019-REQ-059 | Pick-Up Contact Person | Refer to Pick-Up Contact Person displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Pick-Up Contact Person ⏎ Field Source: Prepopulated from Step 1. | Example 1: Pick-Up Contact Person held on the request ⏎ a. Pick-Up Contact Person shows Amshar Amin. |
| 11 | EAINT-12019-REQ-060 | Pick-Up Contact No | Refer to Pick-Up Contact No displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Pick-Up Contact No ⏎ Field Source: Prepopulated from Step 1. | Example 1: Pick-Up Contact No held on the request ⏎ a. Pick-Up Contact No shows 0123456789. |
| 12 | EAINT-12019-REQ-061 | Pick-Up Remarks | Refer to Pick-Up Remarks displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Pick-Up Remarks ⏎ Field Source: Prepopulated from Step 1. Shows "-" where left empty. | Example 1: Pick-Up Remarks held on the request ⏎ a. Pick-Up Remarks shows Gate access code, contact before arrival. ⏎ Example 2: Pick-Up Remarks left empty on Step 1 ⏎ a. Pick-Up Remarks shows "-". |
| 13 | EAINT-12019-REQ-062 | Drop-Off Location | Refer to Drop-Off Location displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Drop-Off Location ⏎ Field Source: Prepopulated from Step 1. ⏎ Additional Handling/Notes: ⏎ 1. Door-to-Door shows the full address as Address, Postcode City, State. ⏎ 2. Hub shows the hub name, state and full hub address. | Example 1: Door-to-Door selected ⏎ a. Drop-Off Location shows No. 5, Jalan Molek 1/10, Taman Molek, 80100 Johor Bahru, Johor. ⏎ Example 2: Hub selected ⏎ a. Drop-Off Location shows the hub name, state and full hub address. |
| 14 | EAINT-12019-REQ-063 | Drop-Off Contact Person | Refer to Drop-Off Contact Person displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Drop-Off Contact Person ⏎ Field Source: Prepopulated from Step 1. | Example 1: Drop-Off Contact Person held on the request ⏎ a. Drop-Off Contact Person shows Lim Wei Jie. |
| 15 | EAINT-12019-REQ-064 | Drop-Off Contact No | Refer to Drop-Off Contact No displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Drop-Off Contact No ⏎ Field Source: Prepopulated from Step 1. | Example 1: Drop-Off Contact No held on the request ⏎ a. Drop-Off Contact No shows 0198765432. |
| 16 | EAINT-12019-REQ-065 | Drop-Off Remarks | Refer to Drop-Off Remarks displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Drop-Off Remarks ⏎ Field Source: Prepopulated from Step 1. Shows "-" where left empty. | Example 1: Drop-Off Remarks held on the request ⏎ a. Drop-Off Remarks shows Call on arrival. ⏎ Example 2: Drop-Off Remarks left empty on Step 1 ⏎ a. Drop-Off Remarks shows "-". |
| 17 | EAINT-12019-REQ-066 | Preferred Pick-Up Date | Refer to Preferred Pick-Up Date displayed on Step 2. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Preferred Pick-Up Date ⏎ Field Source: Prepopulated from Step 1. ⏎ Field Format: DD-MM-YYYY | Example 1: Preferred Pick-Up Date is 11 October 2026 ⏎ a. Preferred Pick-Up Date shows 11-10-2026. |
| 18 | EAINT-12019-REQ-067 | Logistics Fee | Refer to Logistics Fee displayed in the Step 2 charges breakdown. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Logistics Fee ⏎ Field Format: 2 decimal places with a thousands separator. ⏎ Additional Handling/Notes: ⏎ 1. Tier price for the measured distance. ⏎ 2. A small note below the amount shows the measured distance only, for example Distance 330 km. | Example 1: Measured distance is 330 km, Standard tier ⏎ a. Logistics Fee shows 450.00. ⏎ b. Note below shows Distance 330 km. ⏎ Example 2: Measured distance is 720 km, Premium tier ⏎ a. Logistics Fee shows 1,000.00. ⏎ b. Note below shows Distance 720 km. |
| 19 | EAINT-12019-REQ-068 | Door-to-Door Pickup Charge | Refer to Door-to-Door Pickup Charge displayed in the Step 2 charges breakdown. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Door-to-Door Pickup Charge ⏎ Field Format: 2 decimal places with a thousands separator. ⏎ Additional Handling/Notes: ⏎ 1. RM200.00 where Door-to-Door Pickup is selected on Step 1. ⏎ 2. RM0.00 where the hub option is selected on Step 1. | Example 1: Door-to-Door Pickup selected on Step 1 ⏎ a. Door-to-Door Pickup Charge shows 200.00. ⏎ Example 2: Hub option selected on Step 1 ⏎ a. Door-to-Door Pickup Charge shows 0.00. |
| 20 | EAINT-12019-REQ-069 | Door-to-Door Drop-Off Charge | Refer to Door-to-Door Drop-Off Charge displayed in the Step 2 charges breakdown. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Door-to-Door Drop-Off Charge ⏎ Field Format: 2 decimal places with a thousands separator. ⏎ Additional Handling/Notes: ⏎ 1. RM200.00 where Door-to-Door Drop-Off is selected on Step 1. ⏎ 2. RM0.00 where the hub option is selected on Step 1. | Example 1: Door-to-Door Drop-Off selected on Step 1 ⏎ a. Door-to-Door Drop-Off Charge shows 200.00. ⏎ Example 2: Hub option selected on Step 1 ⏎ a. Door-to-Door Drop-Off Charge shows 0.00. |
| 21 | EAINT-12019-REQ-070 | eAuto Fee | RM0.00 in this phase. Line stays in the breakdown. | Example 1: Any request ⏎ a. eAuto Fee shows 0.00. |
| 22 | EAINT-12019-REQ-071 | SST | 8% of eAuto Fee, so RM0.00 in this phase. | Example 1: eAuto Fee is RM0.00 ⏎ a. SST shows 0.00. |
| 23 | EAINT-12019-REQ-072 | Total Amount Payable | Refer to Total Amount Payable displayed in the Step 2 charges breakdown. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Total Amount Payable (inclusive of Service Tax 8%) ⏎ Field Format: 2 decimal places with a thousands separator. ⏎ Additional Handling/Notes: ⏎ 1. Sum of Logistics Fee, Door-to-Door Pickup Charge, Door-to-Door Drop-Off Charge, eAuto Fee and SST. ⏎ 2. Amount shown here is the amount payable on Step 3. | Example 1: Standard tier RM450 with Door-to-Door at both ends ⏎ a. Total Amount Payable shows 850.00. ⏎ Example 2: Base tier RM300 with Drop at Hub and Collect at Hub ⏎ a. Total Amount Payable shows 300.00. ⏎ Example 3: Extended tier RM650 with Door-to-Door at both ends ⏎ a. Total Amount Payable shows 1,050.00. ⏎ Example 4: Premium tier RM1,000 with Door-to-Door at both ends ⏎ a. Total Amount Payable shows 1,400.00. |
| 24 | EAINT-12019-REQ-073 | Step 2 Actions | Button Name: Save & Continue Later ⏎ 1. Button Function: Click to leave the request and return to the UCD Portal home page. Transaction Status remains Pending and no change is made. ⏎ Button Name: Make Payment ⏎ 1. Button Function: Click to open Step 3 in Section 2.2.6.4. | Example 1: Save and Continue Later clicked ⏎ a. Used Car Dealer is redirected to the UCD Portal home page. ⏎ b. Transaction Status remains "Pending". ⏎ Example 2: Make Payment clicked with an unchanged tier price ⏎ a. Step 3 is displayed with the amount shown on Step 2. ⏎ Example 3: Make Payment clicked after the tier price changed ⏎ a. Step 2 is refreshed with the current price. ⏎ b. Payment is not taken on the old amount. ⏎ Popup Content: The logistics price has been updated. The charges shown have been refreshed. Please review the new amount before continuing. ⏎ Example 4: Payment fails ⏎ a. Used Car Dealer remains on Step 2. ⏎ b. Payment History and the Retry button are displayed, per Section 2.2.6.5. |

### 2.2.6.4 Step 3 — Payment

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-074 | Transaction No | Refer to Transaction No displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Transaction No ⏎ Field Source: Generated on creation. | Example 1: Transaction confirmed after successful payment ⏎ a. Transaction No shows EM690000019. |
| 2 | EAINT-12019-REQ-075 | Vehicle Number | Refer to Vehicle Number displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Vehicle No ⏎ Field Source: Prepopulated from Step 1. | Example 1: Transaction confirmed after successful payment ⏎ a. Vehicle Number shows WMJ7742. |
| 3 | EAINT-12019-REQ-076 | Pick-Up Location | Refer to Pick-Up Location displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Pick-Up Location ⏎ Field Source: Prepopulated from Step 1. Full address. | Example 1: Transaction confirmed after successful payment ⏎ a. Pick-Up Location shows No. 12, Jalan PJS 8/4, Mentari Court, 47800 Petaling Jaya, Selangor. |
| 4 | EAINT-12019-REQ-077 | Drop-Off Location | Refer to Drop-Off Location displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Drop-Off Location ⏎ Field Source: Prepopulated from Step 1. Full address. | Example 1: Transaction confirmed after successful payment ⏎ a. Drop-Off Location shows No. 5, Jalan Molek 1/10, Taman Molek, 80100 Johor Bahru, Johor. |
| 5 | EAINT-12019-REQ-078 | Total Amount Paid | Refer to Total Amount Paid displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Total Amount Paid ⏎ Field Source: Carried from Step 2. ⏎ Field Format: 2 decimal places with a thousands separator. | Example 1: Standard tier with Door-to-Door at both ends ⏎ a. Total Amount Paid shows 850.00. ⏎ Example 2: Premium tier with Door-to-Door at both ends ⏎ a. Total Amount Paid shows 1,400.00. |
| 6 | EAINT-12019-REQ-079 | Service Type — Pick-Up | Refer to Service Type — Pick-Up displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Service Type (Pick-Up) ⏎ Field Source: Prepopulated from Step 1. | Example 1: Door-to-Door Pickup selected on Step 1 ⏎ a. Service Type (Pick-Up) shows Door-to-Door Pickup. ⏎ Example 2: Drop at Hub selected on Step 1 ⏎ a. Service Type (Pick-Up) shows Drop at Hub. ⏎ Example 3: Door-to-Door Pickup selected ⏎ a. Door-to-Door Pickup Charge of RM200.00 is included in the amount paid. ⏎ Example 4: Drop at Hub selected ⏎ a. No Pick-Up surcharge is included in the amount paid. |
| 7 | EAINT-12019-REQ-080 | Service Type — Drop-Off | Refer to Service Type — Drop-Off displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Service Type (Drop-Off) ⏎ Field Source: Prepopulated from Step 1. | Example 1: Door-to-Door Drop-Off selected on Step 1 ⏎ a. Service Type (Drop-Off) shows Door-to-Door Drop-Off. ⏎ Example 2: Collect at Hub selected on Step 1 ⏎ a. Service Type (Drop-Off) shows Collect at Hub. ⏎ Example 3: Door-to-Door Drop-Off selected ⏎ a. Door-to-Door Drop-Off Charge of RM200.00 is included in the amount paid. ⏎ Example 4: Collect at Hub selected ⏎ a. No Drop-Off surcharge is included in the amount paid. |
| 8 | EAINT-12019-REQ-081 | Vehicle Make & Model | Refer to Vehicle Make & Model displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Vehicle Make & Model ⏎ Field Source: Prepopulated from Step 1. | Example 1: Vehicle Make and Model held on the request ⏎ a. Vehicle Make & Model shows Toyota / Vios 1.5 G. |
| 9 | EAINT-12019-REQ-082 | Payment Status | Refer to Payment Status displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Payment Status ⏎ Field Source: Set by the payment outcome. | Example 1: Transaction confirmed after successful payment ⏎ a. Payment Status shows OK. |
| 10 | EAINT-12019-REQ-083 | Submission Date / Time | Refer to Submission Date / Time displayed on Step 3. ⏎ Field Type: Label (Read Only) ⏎ Label Name: Submission Date / Time ⏎ Field Source: Stamped when payment is submitted. Format DD-MM-YYYY HH:mm. | Example 1: Transaction confirmed after successful payment ⏎ a. Submission Date / Time shows 02-09-2026 09:15. |

### 2.2.6.5 Payment Scenarios

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-084 | Payment Success | Payment approved by RHB. | Example 1: Payment approved ⏎ a. Transaction is created and Payment Status is "OK". ⏎ b. Step 3 is displayed. ⏎ c. Invoice and e-Invoice become available. |
| 2 | EAINT-12019-REQ-085 | Payment Failed | Payment rejected by RHB. ⏎ Used Car Dealer remains on Step 2 and a Payment History section is displayed above the Payment Summary. ⏎ Payment History shows, per attempt: ⏎ 1. Attempt number ⏎ 2. Date and time of the attempt ⏎ 3. Bank, being RHB ⏎ 4. Payment ID of that attempt ⏎ 5. Payment Status ⏎ 6. Bank reason returned | Example 1: Payment rejected on insufficient funds ⏎ a. Used Car Dealer remains on Step 2. ⏎ b. Payment Status shows "Failed". ⏎ c. Payment History shows: 1. 08-01-2026 10:59am - RHB (EM2609020000019) - Failed (IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI.) |
| 3 | EAINT-12019-REQ-086 | Retry Payment | Button Name: Retry ⏎ 1. Button Function: Click to attempt payment again for the same request. Displayed only where the payment failed. | Example 1: Retry clicked and payment succeeds ⏎ a. Payment History keeps the failed attempt and adds the successful attempt. ⏎ b. Payment Status shows "OK". ⏎ Example 2: Retry clicked and payment fails again ⏎ a. A further attempt is added to Payment History. ⏎ b. Retry remains displayed. |
| 4 | EAINT-12019-REQ-087 | Payment Pending | Payment submitted and awaiting a response from RHB. | Example 1: Bank response not yet returned ⏎ a. Payment Status shows "Pending". ⏎ b. No invoice or e-Invoice is available. |
| 5 | EAINT-12019-REQ-088 | Stale Price at Payment | Tier price changed between Step 2 and Step 3. | Example 1: Make Payment clicked after the tier price changed ⏎ a. Step 2 is refreshed with the current price. ⏎ b. Payment is not taken on the old amount. |

### 2.2.7 UCD Portal — Logistics Charges & Pricing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-089 | Tier Pricing Source | Logistics Fee is the tier price for the measured distance. ⏎ Tiers and rates follow EAINT-12119. | Example 1: Distance falls in the Standard tier ⏎ a. Logistics Fee is the Standard tier rate. |
| 2 | EAINT-12019-REQ-090 | Distance Measurement & Tier Assignment | Distance is measured by road between the 2 points on the request. ⏎ 1. Door-to-Door leg measures from the door address. ⏎ 2. Hub leg measures from the hub address. ⏎ Measured on Step 1. A request that cannot be measured does not reach Step 2. | Example 1: Both addresses resolve ⏎ a. Distance is measured and a tier is assigned. ⏎ Example 2: An address cannot be resolved ⏎ a. Step 1 remains displayed and no tier is assigned. |
| 3 | EAINT-12019-REQ-091 | Door-to-Door Surcharge | RM200.00 per Door-to-Door leg. Hub carries no charge. | Example 1: Door-to-Door at both ends ⏎ a. RM400.00 in total. ⏎ Example 2: Hub at both ends ⏎ a. RM0.00. |
| 4 | EAINT-12019-REQ-092 | eAuto Fee | No eAuto Fee is charged in this phase. ⏎ eAuto Fee line is retained in charges breakdown, as Operations team may introduce a charge in a future phase. Charge amount is not decided yet. | eAuto Fee is RM0.00 per transaction. ⏎ eAuto Fee line remains visible in charges breakdown with a value of RM0.00. |
| 5 | EAINT-12019-REQ-093 | SST | SST is charged on eAuto Fee only. ⏎ As no eAuto Fee is charged in this phase, SST amount is RM0.00. | SST is 8% of eAuto Fee. ⏎ An eAuto Fee of RM0.00 gives an SST of RM0.00. |
| 6 | EAINT-12019-REQ-094 | Applies to Both | Wholesale and eMOVE share 1 charges matrix. | Example 1: A tier rate is changed in BackOffice ⏎ a. Both wholesale and eMOVE use the new rate. |
| 7 | EAINT-12019-REQ-095 | Stale Price Handling | Amount on Step 2 is the amount payable on Step 3. ⏎ A price change in between refreshes Step 2. | Example 1: Price unchanged ⏎ a. Payment is taken on the Step 2 amount. ⏎ Example 2: Price changed ⏎ a. Step 2 is refreshed and payment is not taken on the old amount. |
| 8 | EAINT-12019-REQ-096 | Payment Reset | A re-price resets the payment instruction and stamps the new amount. ⏎ eMOVE uses no one-time password. | Example 1: Request re-priced before payment ⏎ a. Payment instruction is reset to the new amount. |
| 9 | EAINT-12019-REQ-097 | Re-price Audit Record | Each eMOVE re-price is written to an eMOVE audit record. | Example 1: Request re-priced ⏎ a. An eMOVE audit record is written, separate from wholesale. |

### 2.2.8 UCD Portal — eMOVE Transaction Details Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-098 | Details Header | Header of the eMOVE Transaction Details page. ⏎ Fields shown: ⏎ 1. eMOVE Transaction No ⏎ 2. Transaction Status badge | Example 1: Transaction EM690000019 with Payment OK and Delivery Delivered ⏎ a. Header shows EM690000019. ⏎ b. Status badge shows Completed. ⏎ Example 2: Transaction cancelled by a BackOffice user ⏎ a. Status badge shows Cancelled. |
| 2 | EAINT-12019-REQ-099 | Vehicle Information | Vehicle block on the details page. ⏎ Fields shown: ⏎ 1. Vehicle Number ⏎ 2. Engine No ⏎ 3. Chassis No ⏎ 4. Vehicle Make & Model ⏎ 5. Manufacturing Year ⏎ 6. Colour ⏎ 7. Vehicle Type | Example 1: Vehicle fields held on the request ⏎ a. Vehicle Number shows WMJ7742. ⏎ b. Engine No shows 2NR4451120. ⏎ c. Chassis No shows MHFXX445112. ⏎ d. Vehicle Make & Model shows Toyota / Vios 1.5 G. ⏎ e. Manufacturing Year shows 2021. ⏎ Example 2: Colour and Vehicle Type left empty on Step 1 ⏎ a. Both show "-". |
| 3 | EAINT-12019-REQ-100 | Locations & Remarks | Pick-Up and Drop-Off block on the details page. ⏎ Fields shown: ⏎ 1. Pick-Up Location, full address ⏎ 2. Pick-Up Contact Person and Contact No ⏎ 3. Pick-Up Remarks ⏎ 4. Drop-Off Location, full address ⏎ 5. Drop-Off Contact Person and Contact No ⏎ 6. Drop-Off Remarks ⏎ 7. Preferred Pick-Up Date | Example 1: Door-to-Door Pick-Up ⏎ a. Pick-Up Location shows No. 12, Jalan PJS 8/4, Mentari Court, 47800 Petaling Jaya, Selangor. ⏎ b. Pick-Up Contact shows Amshar Amin, 0123456789. ⏎ Example 2: Drop at Hub selected ⏎ a. Pick-Up Location shows the hub name, state and full hub address. ⏎ Example 3: Remarks left empty ⏎ a. Remarks shows "-". |
| 4 | EAINT-12019-REQ-101 | Charges Breakdown | Refer to the charges block on the eMOVE Transaction Details page, in display order. ⏎ 1. Logistics Fee ⏎ 2. Door-to-Door Pickup Charge ⏎ 3. Door-to-Door Drop-Off Charge ⏎ 4. eAuto Fee ⏎ 5. SST ⏎ 6. Total Amount Paid ⏎ Additional Handling/Notes: ⏎ 1. All amounts show 2 decimal places with a thousands separator. ⏎ 2. A small note below Logistics Fee shows the measured distance. ⏎ 3. Breakdown totals reconcile to the amount paid. | Example 1: Standard tier RM450 with Door-to-Door at both ends ⏎ a. Logistics Fee shows 450.00. ⏎ b. Door-to-Door Pickup Charge shows 200.00. ⏎ c. Door-to-Door Drop-Off Charge shows 200.00. ⏎ d. eAuto Fee shows 0.00. ⏎ e. SST shows 0.00. ⏎ f. Total Amount Paid shows 850.00. ⏎ Example 2: Base tier RM300 with Drop at Hub and Collect at Hub ⏎ a. Door-to-Door Pickup Charge shows 0.00. ⏎ b. Door-to-Door Drop-Off Charge shows 0.00. ⏎ c. Total Amount Paid shows 300.00. ⏎ Example 3: Premium tier RM1,000 with Door-to-Door at both ends ⏎ a. Total Amount Paid shows 1,400.00. |
| 5 | EAINT-12019-REQ-102 | Delivery Status Section | Refer to the Delivery Status section on the eMOVE Transaction Details page. ⏎ Displayed as a horizontal track of 5 fixed nodes, left to right: ⏎ 1. Logistics Created ⏎ 2. Payment Received ⏎ 3. Pending Pick-Up ⏎ 4. In Transit ⏎ 5. Delivered ⏎ Additional Handling/Notes: ⏎ 1. Each node carries a caption below it showing the date and time, or the activity. ⏎ 2. A failed node is shown in red with the failure reason in its caption. | Example 1: Payment is OK and delivery status is Delivered ⏎ a. All 5 nodes are shown complete. ⏎ Example 2: Payment is OK and delivery status is In Transit ⏎ a. Logistics Created, Payment Received and Pending Pick-Up are complete. ⏎ b. In Transit is the current node. ⏎ c. Delivered is not yet reached. ⏎ Example 3: Payment is Pending or Failed ⏎ a. Only Logistics Created is complete. ⏎ b. Payment Received shows Awaiting payment, or a payment failed caption where payment status is Failed. ⏎ c. Remaining nodes are not yet reached. ⏎ Example 4: Delivery status is Pick-Up Failed ⏎ a. Pending Pick-Up is shown as a failed node in red, with failure reason in its caption. ⏎ b. In Transit and Delivered are not reached. ⏎ Example 5: Delivery status is Delivery Failed ⏎ a. Pending Pick-Up and In Transit are complete. ⏎ b. Delivered is shown as a failed node in red, with failure reason in its caption. |
| 6 | EAINT-12019-REQ-103 | Documents | Document actions on the details page. ⏎ Button Name: Invoice ⏎ 1. Button Function: Click to open the invoice for this transaction. ⏎ Button Name: e-Invoice ⏎ 1. Button Function: Click to open the e-Invoice for this transaction. | Example 1: Payment Status is "OK" and LHDN (MyInvois Portal) accepted the submission ⏎ a. Invoice is available. ⏎ b. e-Invoice is available. ⏎ Example 2: Payment Status is "OK" and LHDN (MyInvois Portal) rejected the submission ⏎ a. Invoice is available. ⏎ b. e-Invoice is not available. ⏎ Example 3: Payment Status is "OK" and the e-Invoice is awaiting validation feedback ⏎ a. Invoice is available. ⏎ b. e-Invoice is not available. ⏎ Example 4: Payment Status is "Failed" ⏎ a. No document is available. ⏎ Example 5: Payment Status is "Pending" ⏎ a. No document is available. |

### 2.2.9 eMOVE Transaction & Payment ID Formats

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-104 | eMOVE Transaction No Format | Refer to eMOVE Transaction Number. ⏎ Format: ⏎ 1. Prefix = EM ⏎ 2. Y = Last digit of current Year ⏎ 3. M = Current Month ⏎ 4. Running No. = 7 digits. ⏎ Template: EMYM0000001 ⏎ Month is written as: ⏎ a. January to September: 1 to 9 ⏎ b. October: 0 ⏎ c. November: N ⏎ d. December: D | Example: EM680000001 |
| 2 | EAINT-12019-REQ-105 | eMOVE Payment ID Format | Refer to eMOVE Payment ID. ⏎ Format: ⏎ 1. Prefix = EM ⏎ 2. YY = Current Year in 2 digits ⏎ 3. MM = Current Month in 2 digits ⏎ 4. DD = Current Date in 2 digits ⏎ 5. Running No. = 7 digits. ⏎ Template: EMYYMMDD0000001 | Example: EM2608050000001 |
| 3 | EAINT-12019-REQ-106 | Trans Type | Refer to Trans Type sent to RHB. ⏎ Fixed value identifying this module. | Example: EMOVE |
| 4 | EAINT-12019-REQ-107 | RHB Ref 1 | Refer to Reference 1 sent to RHB. ⏎ Format: ⏎ 1. eMOVE Payment ID ⏎ 2. Hyphen ⏎ 3. Company ID ⏎ Template: EMYYMMDD0000001-[Company ID] | Example: EM2608050000001-1040141 |
| 5 | EAINT-12019-REQ-108 | RHB Ref 2 | Refer to Reference 2 sent to RHB. ⏎ Fixed value identifying this module. | Example: EMOVE |

### 2.2.10 BackOffice — eMOVE Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-109 | Listing Access | eMOVE transaction listing is accessible in BackOffice within full module menu. | 1 eMOVE page is added to existing BackOffice home menu without removing existing items. |
| 2 | EAINT-12019-REQ-110 | Mandatory Date Filter | Listing is empty on load. Date Created From and Date Created To are mandatory unless another filter is set. | Example 1: No date and no other filter is set ⏎ a. Search is blocked. ⏎ Popup Content: Please select From Date and To Date. ⏎ Example 2: Another filter is set, including Vehicle Type ⏎ a. Search is allowed without Date Created. |
| 3 | EAINT-12019-REQ-111 | Listing Sort Order | Listing is sorted by created date and time, newest first. | Example 1: Several transactions created on different dates ⏎ a. Most recently created transaction is shown in row 1. ⏎ Example 2: Several transactions created on the same date ⏎ a. Where the created time is the same, rows are ordered by Transaction No in descending order. |
| 4 | EAINT-12019-REQ-112 | Cancel Action | Action column offers Cancel alongside View, for transactions whose Tx Status is Pending or Failed only. Cancel is available in BackOffice only and is not offered on the UCD Portal. ⏎ Completed, Expired and Cancelled are end states. Cancel is not offered for any of them, so a transaction cannot be cancelled twice. ⏎ Every BackOffice user can cancel a transaction. No additional permission is applied. ⏎ On cancellation, Remarks are set to CANCELLED BY {username} on {DD-MM-YYYY HH:mm}, replacing any text held. ⏎ Each cancellation is written to an audit log recording the BackOffice user who performed it and the date and time. | Example 1: Tx Status is Pending ⏎ a. Cancel is offered in the Action column. ⏎ Example 2: Tx Status is Failed ⏎ a. Cancel is offered in the Action column. ⏎ Example 3: Tx Status is Completed, Expired or Cancelled ⏎ a. Cancel is not offered. Only View is available. ⏎ Example 4: Cancel is confirmed by a BackOffice user ⏎ a. Transaction Status is updated to Cancelled. ⏎ b. Cancelled Date is stamped with the date and time, and Cancelled By records that BackOffice user. ⏎ c. Remarks show CANCELLED BY jasons on 20-08-2026 20:56, following the username and timestamp of that cancellation. ⏎ d. An audit log entry is written holding the BackOffice user, the date and time, and the transaction cancelled. |

### 2.2.10.1 BackOffice — Search & Filter Panel

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-113 | Company Name | Refer to Used Car Dealer company name. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Max Characters: 100 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 100 characters, so the maximum cannot be exceeded. | Example 1: Berjaya entered ⏎ a. Listing returns transactions of companies whose name contains Berjaya. ⏎ Example 2: 100 characters already keyed in and a further character is typed ⏎ a. The 101th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 2 | EAINT-12019-REQ-114 | Vehicle No. | Refer to vehicle registration number. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric only. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 10 ⏎ Additional Handling/Notes: ⏎ 1. Entry is displayed in uppercase automatically. ⏎ 2. Spacing is removed automatically. ⏎ 3. If key in other than Alphanumeric, system will auto remove from the text field. ⏎ 4. Field stops accepting input at 10 characters, so the maximum cannot be exceeded. | Example 1: wmj 7742 keyed in ⏎ a. Field displays WMJ7742. ⏎ b. Listing returns that vehicle only. ⏎ Example 2: Left empty ⏎ a. Vehicle No is not applied as a filter. ⏎ Example 3: 10 characters already keyed in and a further character is typed ⏎ a. The 11th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 3 | EAINT-12019-REQ-115 | Vehicle Type | Refer to vehicle type held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. - ⏎ 3. Sedan / Hatchback ⏎ 4. SUV / MPV ⏎ 5. Pickup / 4x4 ⏎ Additional Handling/Notes: ⏎ 1. Motorcycle and Commercial / Lorry are not offered, as they cannot be selected on Step 1 in this phase. | Example 1: All selected ⏎ a. Listing returns every vehicle type. ⏎ Example 2: "-" selected ⏎ a. Listing returns requests with no vehicle type held. ⏎ Example 3: Sedan / Hatchback selected ⏎ a. Listing returns Sedan / Hatchback requests only. ⏎ Example 4: SUV / MPV selected ⏎ a. Listing returns SUV / MPV requests only. ⏎ Example 5: Pickup / 4x4 selected ⏎ a. Listing returns Pickup / 4x4 requests only. |
| 4 | EAINT-12019-REQ-116 | Transaction No. | Refer to eMOVE Transaction No. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric only. ⏎ 2. Max Characters: 20 ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 20 characters, so the maximum cannot be exceeded. | Example 1: EM690000019 entered ⏎ a. Listing returns that transaction only. ⏎ Example 2: 20 characters already keyed in and a further character is typed ⏎ a. The 21th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 5 | EAINT-12019-REQ-117 | Date Created From | Refer to lower bound of the created date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Mandatory unless another filter is set ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. | Example 1: 01-09-2026 selected ⏎ a. Listing returns transactions created on or after 01-09-2026. |
| 6 | EAINT-12019-REQ-118 | Date Created To | Refer to upper bound of the created date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Mandatory unless another filter is set ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. ⏎ 2. On selecting Date Created From, the system auto selects this field. ⏎ 3. Auto selected value is 1 month after Date Created From, or today where that falls in the future. ⏎ 4. Future dates cannot be selected. | Example 1: Today is 11.10.2026 and Date Created From is 01.01.2026 ⏎ a. Date Created To is auto selected as 11.10.2026. ⏎ b. A future date cannot be selected. ⏎ Example 2: Date Created From is 01.09.2026 ⏎ a. Date Created To is auto selected as 01.10.2026. ⏎ Example 3: A future date is clicked ⏎ a. Date is greyed out and cannot be selected. |
| 7 | EAINT-12019-REQ-119 | Pick-Up Date From | Refer to lower bound of the preferred Pick-Up date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. | Example 1: 04-09-2026 selected ⏎ a. Listing returns transactions with Pick-Up on or after 04-09-2026. |
| 8 | EAINT-12019-REQ-120 | Pick-Up Date To | Refer to upper bound of the preferred Pick-Up date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. ⏎ 2. On selecting Pick-Up Date From, the system auto selects this field. ⏎ 3. Auto selected value is 1 month after Pick-Up Date From, or today where that falls in the future. ⏎ 4. Future dates cannot be selected. | Example 1: Today is 11.10.2026 and Pick-Up Date From is 01.01.2026 ⏎ a. Pick-Up Date To is auto selected as 11.10.2026. ⏎ b. A future date cannot be selected. ⏎ Example 2: Pick-Up Date From is 01.09.2026 ⏎ a. Pick-Up Date To is auto selected as 01.10.2026. ⏎ Example 3: A future date is clicked ⏎ a. Date is greyed out and cannot be selected. |
| 9 | EAINT-12019-REQ-121 | Cancelled Date From | Refer to lower bound of the cancelled date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Maximum range of 1 month. ⏎ Additional Handling/Notes: ⏎ 1. Selecting a Cancelled Date clears the Created and Pick-Up date filters. | Example 1: 01-08-2026 selected ⏎ a. Created and Pick-Up date filters are cleared. |
| 10 | EAINT-12019-REQ-122 | Cancelled Date To | Refer to upper bound of the cancelled date range. ⏎ Field Type: Date Picker ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Maximum range of 1 month. ⏎ Additional Handling/Notes: ⏎ 1. Selectable from the calendar only. ⏎ 2. On selecting Cancelled Date From, the system auto selects this field. ⏎ 3. Auto selected value is 1 month after Cancelled Date From, or today where that falls in the future. ⏎ 4. Future dates cannot be selected. ⏎ 5. Selecting a Cancelled Date clears the Created and Pick-Up date filters. | Example 1: Today is 11.10.2026 and Cancelled Date From is 01.01.2026 ⏎ a. Cancelled Date To is auto selected as 11.10.2026. ⏎ b. A future date cannot be selected. ⏎ Example 2: Cancelled Date From is 01.09.2026 ⏎ a. Cancelled Date To is auto selected as 01.10.2026. ⏎ Example 3: A future date is clicked ⏎ a. Date is greyed out and cannot be selected. |
| 11 | EAINT-12019-REQ-123 | Service Type | Refer to service type held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. Door-to-Door ⏎ 3. Hub-to-Hub ⏎ 4. Door Pick-Up / Hub Drop-Off ⏎ 5. Hub Pick-Up / Door Drop-Off | Example 1: All selected ⏎ a. Listing returns every service type. ⏎ Example 2: Door-to-Door selected ⏎ a. Listing returns Door-to-Door requests only. ⏎ Example 3: Hub-to-Hub selected ⏎ a. Listing returns Hub-to-Hub requests only. ⏎ Example 4: Door Pick-Up / Hub Drop-Off selected ⏎ a. Listing returns that combination only. ⏎ Example 5: Hub Pick-Up / Door Drop-Off selected ⏎ a. Listing returns that combination only. |
| 12 | EAINT-12019-REQ-124 | Payment Status | Refer to payment status held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. - ⏎ 3. Pending ⏎ 4. Failed ⏎ 5. OK | Example 1: All selected ⏎ a. Listing returns every payment status. ⏎ Example 2: "-" selected ⏎ a. Listing returns requests with no payment attempted. ⏎ Example 3: Pending selected ⏎ a. Listing returns requests awaiting a bank response. ⏎ Example 4: Failed selected ⏎ a. Listing returns rejected payments only. ⏎ Example 5: OK selected ⏎ a. Listing returns confirmed payments only. |
| 13 | EAINT-12019-REQ-125 | Tx Status | Refer to transaction status held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. Pending ⏎ 3. Completed ⏎ 4. Failed ⏎ 5. Expired ⏎ 6. Cancelled | Example 1: All selected ⏎ a. Listing returns every transaction status. ⏎ Example 2: Pending selected ⏎ a. Listing returns Pending requests only. ⏎ Example 3: Completed selected ⏎ a. Listing returns Completed requests only. ⏎ Example 4: Failed selected ⏎ a. Listing returns Failed requests only. ⏎ Example 5: Expired selected ⏎ a. Listing returns Expired requests only. ⏎ Example 6: Cancelled selected ⏎ a. Listing returns Cancelled requests only. |
| 14 | EAINT-12019-REQ-126 | Delivery Status | Refer to delivery status held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. - ⏎ 3. Pending Pick-Up ⏎ 4. In Transit ⏎ 5. Delivered ⏎ 6. Pick-Up Failed ⏎ 7. Delivery Failed | Example 1: All selected ⏎ a. Listing returns every delivery status. ⏎ Example 2: "-" selected ⏎ a. Listing returns requests not yet arranged. ⏎ Example 3: Pending Pick-Up selected ⏎ a. Listing returns requests awaiting collection. ⏎ Example 4: In Transit selected ⏎ a. Listing returns requests in transit. ⏎ Example 5: Delivered selected ⏎ a. Listing returns delivered requests. ⏎ Example 6: Pick-Up Failed selected ⏎ a. Listing returns failed collections. ⏎ Example 7: Delivery Failed selected ⏎ a. Listing returns failed deliveries. |
| 15 | EAINT-12019-REQ-127 | LHDN Response Status | Refer to LHDN (MyInvois Portal) response status held on the request. ⏎ Field Type: Dropdown ⏎ Field Mandatory: Optional ⏎ Field Default: All ⏎ Field Dropdown Option: ⏎ 1. All ⏎ 2. OK ⏎ 3. Failed ⏎ 4. - ⏎ Additional Handling/Notes: ⏎ 1. N/A is not offered, as it cannot occur in eMOVE. N/A marks transactions completed before e-Invoice deployment, and eMOVE was delivered after that date. | Example 1: All selected ⏎ a. Listing returns every response status. ⏎ Example 2: OK selected ⏎ a. Listing returns requests accepted by LHDN (MyInvois Portal) only. ⏎ Example 3: Failed selected ⏎ a. Listing returns requests rejected by LHDN (MyInvois Portal) only. ⏎ Example 4: "-" selected ⏎ a. Listing returns requests not yet submitted, or awaiting validation feedback. |

### 2.2.10.2 BackOffice — Listing Columns

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-128 | # | Row number within the current result set. | Example 1: 12 transactions returned ⏎ a. First row shows 1, last row shows 12. |
| 2 | EAINT-12019-REQ-129 | Company Name | Used Car Dealer company that created the request. | Example 1: Request created by Berjaya Mega Motors ⏎ a. Column shows Berjaya Mega Motors Enterprise. |
| 3 | EAINT-12019-REQ-130 | Company ROC | Registration of Company number of that dealer. | Example 1: Dealer ROC held on the account ⏎ a. Column shows 200401038456. |
| 4 | EAINT-12019-REQ-131 | Vehicle | Vehicle registration number of the vehicle being moved. | Example 1: Request created for WMJ7742 ⏎ a. Column shows WMJ7742. |
| 5 | EAINT-12019-REQ-132 | Vehicle Type | Vehicle type held on the request, values per EAINT-12019-REQ-031. ⏎ Dash when no value is held. | Example 1: Vehicle Type left blank by the dealer ⏎ a. Column shows a dash. |
| 6 | EAINT-12019-REQ-133 | Trx No | Logistics Transaction No, format per EAINT-12019-REQ-104. | Example 1: Transaction created in September 2026 ⏎ a. Column shows EM690000019. |
| 7 | EAINT-12019-REQ-134 | Created At | Date and time the request was created. ⏎ Format DD-MM-YYYY HH:mm in 24-hour time. | Example 1: Created on 2 September 2026 at 9.15am ⏎ a. Column shows 02-09-2026 09:15. |
| 8 | EAINT-12019-REQ-135 | Service | Service type selected for the request. | Example 1: Both legs at a custom address ⏎ a. Column shows Door-to-Door. |
| 9 | EAINT-12019-REQ-136 | Pick-Up | State the vehicle is collected from. Not a date. | Example 1: Pick-Up hub is in Selangor ⏎ a. Column shows Selangor. |
| 10 | EAINT-12019-REQ-137 | Drop Off | State the vehicle is delivered to. Not a date. | Example 1: Drop-Off address is in Johor ⏎ a. Column shows Johor. |
| 11 | EAINT-12019-REQ-138 | Payment | Payment status per EAINT-12019-REQ-020. | Example 1: Payment not yet attempted ⏎ a. Column shows "-". ⏎ Example 2: Payment submitted and awaiting bank response ⏎ a. Column shows "Pending". ⏎ Example 3: Bank rejected the payment ⏎ a. Column shows "Failed". ⏎ Example 4: Bank confirmed the payment ⏎ a. Column shows "OK". |
| 12 | EAINT-12019-REQ-139 | Delivery | Delivery status per EAINT-12019-REQ-021. | Example 1: Logistics job not yet arranged ⏎ a. Column shows "-". ⏎ Example 2: Job created and awaiting Logistics Driver collection ⏎ a. Column shows "Pending Pick-Up". ⏎ Example 3: Logistics Driver collected the vehicle ⏎ a. Column shows "In Transit". ⏎ Example 4: Logistics Driver completed Drop-Off ⏎ a. Column shows "Delivered". ⏎ Example 5: Logistics Driver could not collect the vehicle ⏎ a. Column shows "Pick-Up Failed". ⏎ Example 6: Logistics Driver could not hand over the vehicle ⏎ a. Column shows "Delivery Failed". |
| 13 | EAINT-12019-REQ-140 | Tx Status | Transaction status derived per EAINT-12019-REQ-012. | Example 1: Payment is OK and Delivery is Delivered ⏎ a. Column shows "Completed". ⏎ Example 2: Payment or Delivery has failed ⏎ a. Column shows "Failed". ⏎ Example 3: Any other combination ⏎ a. Column shows "Pending". ⏎ Example 4: Expired by housekeeping ⏎ a. Column shows "Expired". ⏎ Example 5: Cancelled by a BackOffice user ⏎ a. Column shows "Cancelled". |
| 14 | EAINT-12019-REQ-141 | Cancelled Date | Date and time the transaction was cancelled or expired. ⏎ Format DD-MM-YYYY HH:mm in 24-hour time. Dash when no value is held. | Example 1: Expired by housekeeping at 2am on 17 August 2026 ⏎ a. Column shows 17-08-2026 02:00. |
| 15 | EAINT-12019-REQ-142 | Cancelled By | User or system that cancelled the transaction. Dash when no value is held. | Example 1: Expired by the housekeeping cron job ⏎ a. Column shows 99000/cronjob. |
| 16 | EAINT-12019-REQ-143 | LHDN Response Status | e-Invoice submission outcome per EAINT-12019-REQ-023. | Example 1: No e-Invoice submitted, or awaiting validation feedback ⏎ a. Column shows "-". ⏎ Example 2: LHDN (MyInvois Portal) accepted the submission ⏎ a. Column shows "OK". ⏎ Example 3: LHDN (MyInvois Portal) rejected the submission ⏎ a. Column shows "Failed". ⏎ Note: N/A cannot occur in eMOVE, as eMOVE was delivered after e-Invoice deployment. |
| 17 | EAINT-12019-REQ-144 | Amount (RM) | Total amount charged, 2 decimal places with a thousands separator. | Example 1: Total paid is RM850 ⏎ a. Column shows 850.00. ⏎ Example 2: Total paid is RM1,000 ⏎ a. Column shows 1,000.00. |
| 18 | EAINT-12019-REQ-145 | Remarks | Remark held against the transaction. Dash when empty. | Example 1: No remark held against the transaction ⏎ a. Column shows empty. ⏎ Example 2: Transaction expired by housekeeping ⏎ a. Column shows "Transaction Expired". ⏎ Example 3: Cancelled by a BackOffice user with login ID eautoadmin ⏎ a. Column shows "CANCELLED BY eautoadmin on 25-09-2026 16:38". ⏎ Example 4: Cancelled by a UCD user with login ID ucdberjaya ⏎ a. Column shows "CANCELLED BY ucdberjaya on 25-09-2026 16:38". |
| 19 | EAINT-12019-REQ-146 | Action | Refer to the links available on the transaction row. ⏎ Link Name: View ⏎ 1. Link Function: Click to open the eMOVE Transaction Details page for that transaction. ⏎ Link Name: Cancel ⏎ 1. Link Function: Click to cancel that transaction. Transaction Status is updated to "Cancelled", and Cancelled Date, Cancelled By and Remarks are stamped. ⏎ Additional Handling/Notes: ⏎ 1. Transaction Status "Pending", or "Failed" with no payment made: both Used Car Dealer and BackOffice user can cancel. ⏎ 2. Transaction Status "Failed" with payment made: only a BackOffice user can cancel. ⏎ 3. Transaction Status "Completed", "Expired" or "Cancelled": Cancel is not offered. | Example 1: Transaction Status is "Pending" ⏎ a. Column shows "View" and "Cancel". ⏎ Example 2: Transaction Status is "Failed" with no payment made ⏎ a. Column shows "View" and "Cancel". ⏎ Example 3: Transaction Status is "Failed" with payment made ⏎ a. Column shows "View" and "Cancel" for a BackOffice user. ⏎ Example 4: Transaction Status is "Completed", "Expired" or "Cancelled" ⏎ a. Column shows "View" only. ⏎ Example 5: "View" clicked ⏎ a. eMOVE Transaction Details page is displayed. ⏎ Example 6: "Cancel" clicked and confirmed ⏎ a. Transaction Status is updated to "Cancelled". ⏎ b. Listing is refreshed and "Cancel" is no longer offered on that row. |

### 2.2.11 BackOffice — eMOVE Transaction Details Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-147 | Details Header | Refer to the header of the BackOffice eMOVE Transaction Details page. ⏎ Fields shown: ⏎ 1. Vehicle Number ⏎ 2. Reference No ⏎ 3. Transaction Status badge | Example 1: Transaction EM690000019 for vehicle WMJ7742 ⏎ a. Header shows WMJ7742 (Ref No.: EM690000019) - Transaction Details. ⏎ b. Status badge shows Completed. ⏎ Example 2: Transaction cancelled by a BackOffice user ⏎ a. Status badge shows Cancelled. |
| 2 | EAINT-12019-REQ-148 | Document Buttons | Refer to the document actions on the BackOffice details page. ⏎ Button Name: Invoice ⏎ 1. Button Function: Click to open the invoice for this transaction. ⏎ Button Name: e-Invoice ⏎ 1. Button Function: Click to open the e-Invoice for this transaction. ⏎ Button Name: Delivery Order ⏎ 1. Button Function: Click to open the Delivery Order for this transaction. ⏎ Additional Handling/Notes: ⏎ 1. The 3 buttons appear on 1 row, aligned right. | Example 1: Payment Status is "OK" and LHDN (MyInvois Portal) accepted the submission ⏎ a. Invoice is available. ⏎ b. e-Invoice is available. ⏎ Example 2: Payment Status is "OK" and LHDN (MyInvois Portal) rejected the submission ⏎ a. Invoice is available. ⏎ b. e-Invoice is not available. ⏎ Example 3: Payment Status is "OK" and the e-Invoice is awaiting validation feedback ⏎ a. Invoice is available. ⏎ b. e-Invoice is not available. ⏎ Example 4: Payment Status is "Failed" ⏎ a. No document is available. ⏎ Example 5: Payment Status is "Pending" ⏎ a. No document is available. |
| 3 | EAINT-12019-REQ-149 | Vehicle & Remarks | Refer to the vehicle block on the BackOffice details page. ⏎ Fields shown: ⏎ 1. Vehicle Number ⏎ 2. Engine No ⏎ 3. Chassis No ⏎ 4. Vehicle Make & Model ⏎ 5. Manufacturing Year ⏎ 6. Colour ⏎ 7. Vehicle Type ⏎ 8. Pick-Up Remarks ⏎ 9. Drop-Off Remarks | Example 1: Vehicle fields held on the request ⏎ a. Vehicle Number shows WMJ7742. ⏎ b. Engine No shows 2NR4451120. ⏎ c. Chassis No shows MHFXX445112. ⏎ d. Vehicle Make & Model shows Toyota / Vios 1.5 G. ⏎ e. Manufacturing Year shows 2021. ⏎ Example 2: Colour, Vehicle Type and Remarks left empty ⏎ a. Each shows "-". |
| 4 | EAINT-12019-REQ-150 | Delivery Tracking | Refer to the Delivery Status section on the eMOVE Transaction Details page. ⏎ Displayed as a horizontal track of 5 fixed nodes, left to right: ⏎ 1. Logistics Created ⏎ 2. Payment Received ⏎ 3. Pending Pick-Up ⏎ 4. In Transit ⏎ 5. Delivered ⏎ Additional Handling/Notes: ⏎ 1. Each node carries a caption below it showing the date and time, or the activity. ⏎ 2. A failed node is shown in red with the failure reason in its caption. ⏎ 3. A failed node also shows the Next Action in its caption. | Example 1: Payment OK and delivery Delivered ⏎ a. All 5 nodes are shown complete. ⏎ Example 2: Delivery status is Pick-Up Failed ⏎ a. Pending Pick-Up is shown in red with the failure reason and Next Action. ⏎ Example 3: Payment Pending ⏎ a. Only Logistics Created is complete. |
| 5 | EAINT-12019-REQ-151 | Special Remark | Refer to the free-text remark a BackOffice user records against a transaction. ⏎ Field Type: Text Field ⏎ Field Mandatory: Optional ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Min Characters: 0 ⏎ 2. Max Characters: 255 ⏎ Button Name: Update Special Remark ⏎ 1. Button Function: Click to save the Special Remark against that transaction. ⏎ Additional Handling/Notes: ⏎ 1. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Example 1: Special Remark entered and updated ⏎ a. Remark is saved against that transaction and displayed on reopening. ⏎ Example 2: Special Remark left empty ⏎ a. No remark is stored. ⏎ Example 3: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 6 | EAINT-12019-REQ-152 | Vehicle Photos | Refer to the Logistics Driver photos attached to the transaction. ⏎ Button Name: View Photos ⏎ 1. Button Function: Click to open the photo viewer showing the Pick-Up and Drop-Off photo sets. ⏎ Additional Handling/Notes: ⏎ 1. Photos are shown in BackOffice only. They are not displayed on the UCD Portal. | Example 1: Pick-Up and Drop-Off both complete ⏎ a. Photo viewer opens both photo sets, 12 photos each. ⏎ Example 2: Pick-Up complete and Drop-Off not yet done ⏎ a. Photo viewer opens the Pick-Up set only. |

### 2.2.12 Amount Reconciliation

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-153 | Charges Breakdown Reconciliation | Amount shown on a transaction is made up of logistics base charge, Door-to-Door surcharge, eAuto Fee and SST. ⏎ In this phase eAuto Fee and SST are both RM0.00, so the amount charged equals logistics base charge plus any Door-to-Door surcharge. ⏎ How the logistics portion is reconciled, and against what, is pending confirmation by requestor. | Charges breakdown on UCD Portal Transaction Details and on BackOffice Transaction Details show the same figures for a given transaction. ⏎ Breakdown lines total to the amount paid. ⏎ Reconciliation basis pending confirmation by the requestor. |
| 2 | EAINT-12019-REQ-154 | Reconciliation Reporting | Report or view used to reconcile eMOVE logistics amounts is pending confirmation by the requestor. | Pending confirmation by the requestor. |

### 2.2.13 BackOffice — Logistics Hub

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-155 | Logistics Hub Pages | Hub Management and Logistics Charges Matrix Setup are existing BackOffice pages delivered under EAINT-12119. ⏎ No change is made to either page in this CR. ⏎ Additional Handling/Notes: ⏎ 1. eMOVE reads its hub listing from Hub Management. ⏎ 2. eMOVE reads its rate tiers from Logistics Charges Matrix Setup. | Example 1: eMOVE request created with Drop at Hub ⏎ a. Hub list is read from Hub Management with no change to that page. ⏎ Example 2: eMOVE request priced ⏎ a. Rate tier is read from Logistics Charges Matrix Setup with no change to that page. |

### 2.2.14 BackOffice — Logistics Pricing History

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-156 | Logistics Pricing History | Logistics Pricing History is an existing BackOffice page delivered under EAINT-12119. It shows how a delivery was priced, searched by reference, with the current pricing position and every pricing decision recorded. ⏎ No change is made to that page in this CR. ⏎ Additional Handling/Notes: ⏎ 1. eMOVE pricing decisions are written to the same store, so eMOVE records appear on that page. | Example 1: eMOVE Transaction No searched on that page ⏎ a. Pricing history of that eMOVE request is displayed. ⏎ Example 2: eMOVE request priced or re-priced ⏎ a. A pricing decision is recorded and appears on that page. |

### 2.2.15 Delivery Order

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-157 | Delivery Order Format | eMOVE Delivery Order uses the same format as the Wholesale Delivery Order. ⏎ Two copies are produced per job: a Pick-Up copy carrying Pick-Up details, and a Drop-Off copy carrying Drop-Off details. Each holds header and contact block, Date and Lorry No, Service Type, Vehicle Details, Vehicle Photo Checklist, an acknowledgement block, and a Logistics Verification block holding the QR code. ⏎ Acknowledgement labels are pending confirmation by requestor. | Example 1: A logistics job is created ⏎ a. A Pick-Up copy and a Drop-Off copy are produced, each following the Wholesale layout. |
| 2 | EAINT-12019-REQ-158 | Delivery Order Number | Delivery Order number is the Logistics Transaction No followed by a single-letter suffix. ⏎ 1. Pick-Up copy - suffix P ⏎ 2. Drop-Off copy - suffix D ⏎ Pending confirmation by requestor. | Example 1: Logistics Transaction No is EM690000025 ⏎ a. Pick-Up copy Delivery Order number is EM690000025P. ⏎ b. Drop-Off copy Delivery Order number is EM690000025D. ⏎ Example 2: Both copies generated for one job ⏎ a. Number printed in the Logistics Verification block matches the number in the document header on each copy. |
| 3 | EAINT-12019-REQ-159 | Generation Trigger & Format | Both Delivery Orders are generated together as PDF once payment succeeds and a logistics transaction is created. ⏎ Open: whether Operations can retrieve either Delivery Order from the Transaction Details page after generation is pending confirmation by requestor. ⏎ Delivery Orders are emailed to the logistics partner once both copies are generated. Subject and body are in Section 2.2.16. ⏎ Sender Email: ⏎ wholesale@eauto.my ⏎ Pending confirmation by requestor. ⏎ CC Email: ⏎ wholesale@eauto.my ⏎ Recipient Email: ⏎ logistics partner email ⏎ Pending confirmation by requestor. ⏎ Attachments: 2 PDFs, named Delivery Order Pick-Up Copy and Delivery Order Drop-Off Copy. ⏎ Language: English. ⏎ A failed send is retried. A persistent failure is surfaced to the Operations team. | Example 1: Payment status becomes OK ⏎ a. Both copies are generated as PDF at the same point. ⏎ b. Logistics arrangement email is sent with both PDFs attached. ⏎ Example 2: Payment is Pending or Failed ⏎ a. No Delivery Order is generated and no email is sent. ⏎ Example 3: Email fails to send ⏎ a. Send is retried, and a persistent failure is surfaced to the Operations team. |
| 4 | EAINT-12019-REQ-160 | Field Population | Vehicle Details and party details are prepopulated from the logistics request. Date and Lorry No are left blank for the Logistics Driver to complete on the spot. ⏎ Fields with no source held in eMOVE today. Source for each is pending confirmation by requestor: ⏎ 1. Make ⏎ 2. Model ⏎ 3. Variant ⏎ 4. Year ⏎ 5. Transmission ⏎ 6. Chassis No. ⏎ 7. Engine No. / Motor No. ⏎ 8. Mileage (km) ⏎ 9. Fuel Type / EV | Pick-Up and Drop-Off name, phone and address on each copy match the values held on that logistics request. ⏎ Registration No, Colour and Service Type are populated from the logistics request. |
| 5 | EAINT-12019-REQ-161 | QR Code | Each copy carries 1 QR code in the Logistics Verification block. The code is static, never expires, and the 2 codes are different. ⏎ QR code is for logistics Logistics Driver use only, not for the Pick-Up or Drop-Off party, and carries an internal note saying so. | Example 1: Logistics Driver scans a Delivery Order QR code ⏎ a. Logistics Driver is taken to the upload page for that copy. ⏎ b. Logistics Driver enters the Vehicle Registration Number. ⏎ c. Logistics Driver confirms the vehicle and party details shown. ⏎ d. Logistics Driver uploads the vehicle photos from the checklist. |
| 6 | EAINT-12019-REQ-162 | Legal Pages | Whether the Dispatch Note and Delivery Order legal pages are carried is pending confirmation by requestor. | Pending confirmation by requestor. |
| 7 | EAINT-12019-REQ-163 | Generation Failure | Where a Delivery Order fails to generate, the system retries. A persistent failure is surfaced to the Operations team. | Example 1: Generation fails once ⏎ a. System retries generation. ⏎ Example 2: Generation keeps failing ⏎ a. Operations team is alerted. |

### 2.2.16 Delivery Order Email — Content

| # | Item | Description |
| 1 | Content Template | Subject: [eMOVE Logistic] Arrangement - [Pick-Up DO Number] / [Drop-Off DO Number] - [Vehicle Number] ⏎ Hi team, ⏎ Delivery order(s) have been issued for logistics transaction [Transaction Number]: ⏎ Pick-Up DO: [Pick-Up DO Number] ⏎ Drop-Off DO: [Drop-Off DO Number] ⏎ Vehicle: [Vehicle Number] - [Make and Model] ⏎ PDFs of the delivery order(s) are attached to this email. ⏎ - eAuto MOVE Logistics system (automated) |
| 2 | Content Sample | Subject: [eMOVE Logistic] Arrangement - EM690000019P / EM690000019D - WMJ7742 ⏎ Hi team, ⏎ Delivery order(s) have been issued for logistics transaction EM690000019: ⏎ Pick-Up DO: EM690000019P ⏎ Drop-Off DO: EM690000019D ⏎ Vehicle: WMJ7742 - Toyota / Vios 1.5 G ⏎ PDFs of the delivery order(s) are attached to this email. ⏎ - eAuto MOVE Logistics system (automated) |

### 2.2.17 Logistics Driver — Pick-Up Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-164 | Scan Vehicle | Logistics Driver scans a QR code or enters vehicle registration to load a Pick-Up job. ⏎ Open: whether QR scan is delivered in this phase, or vehicle registration entry only, is pending confirmation by requestor. ⏎ Pick-Up copy QR code is scanned at Pick-Up and the Drop-Off copy QR code at Drop-Off. A Drop-Off scan is not accepted before Pick-Up is complete. | Entering a valid registration loads that matching Pick-Up job. |
| 2 | EAINT-12019-REQ-165 | Confirm Details | Confirmation screen shows vehicle and Used Car Dealer seller details. | Confirmation screen shows vehicle, Used Car Dealer name and ROC. |
| 3 | EAINT-12019-REQ-166 | Vehicle Number Match | Logistics Driver enters the Vehicle Registration Number after scanning, and confirms the vehicle and party details shown. Photos are accepted only where that number matches the Delivery Order scanned. ⏎ Open: Popup Content shown where the entered number does not match a Delivery Order is pending confirmation by requestor. | Example 1: Entered number matches the Delivery Order ⏎ a. Confirmation screen is shown and photo upload is allowed. ⏎ Example 2: Entered number does not match ⏎ a. Upload is not allowed and the Logistics Driver is asked to check the number. |
| 4 | EAINT-12019-REQ-167 | Photo Upload | Logistics Driver uploads 12 required photos before submitting. ⏎ 12 photos are uploaded regardless of the Engine Start (no photo) label on checklist item 12. ⏎ Where an upload fails, the Logistics Driver can retry. Status advances only once every required photo is uploaded. ⏎ Open: Popup Content shown on a failed photo upload is pending confirmation by requestor. | Submit is enabled only when every required photo is captured. |
| 5 | EAINT-12019-REQ-168 | Status Update | On submit, delivery status is updated. | After submit, delivery status is In Transit. |

### 2.2.18 Logistics Driver — Drop-Off Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-169 | Drop-Off Scan | Logistics Driver scans or enters vehicle registration to load a Drop-Off job. | Entering a valid registration loads that matching Drop-Off job. |
| 2 | EAINT-12019-REQ-170 | Drop-Off Party | Confirmation screen shows Drop-Off To party, being buyer or dealer. | Screen shows name, ROC and Drop-Off address. |
| 3 | EAINT-12019-REQ-171 | Drop-Off Vehicle Number Match | Logistics Driver enters the Vehicle Registration Number after scanning the Drop-Off copy, and confirms the vehicle and party details shown. Photos are accepted only where that number matches the Delivery Order scanned. ⏎ Open: Popup Content shown where the entered number does not match a Delivery Order, and where Pick-Up is not yet complete, is pending confirmation by requestor. | Example 1: Entered number matches the Delivery Order ⏎ a. Confirmation screen is shown and photo upload is allowed. ⏎ Example 2: Entered number does not match ⏎ a. Upload is not allowed and the Logistics Driver is asked to check the number. |
| 4 | EAINT-12019-REQ-172 | Drop-Off Photos | Logistics Driver uploads 12 required Drop-Off photos before submitting. | Submit is enabled only when 12 of 12 photos are captured. |
| 5 | EAINT-12019-REQ-173 | Status Update | On submit, delivery status is updated. | After submit, delivery status is Delivered. |

### 2.2.19 Failed Pick-Up / Drop-Off Handling

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-174 | Report Issue | Logistics Driver can report an inability to pick up or Drop-Off a vehicle. | A report issue path is available from confirmation screen. |
| 2 | EAINT-12019-REQ-175 | Reason | Refer to the reason the Logistics Driver could not complete the job. ⏎ Field Type: Text Field ⏎ Field Mandatory: Mandatory ⏎ Field Default: Empty ⏎ Field Validation: ⏎ 1. Alphanumeric and special character allowed. ⏎ 2. English characters only. ⏎ 3. Min Characters: 1 ⏎ 4. Max Characters: 255 ⏎ Additional Handling/Notes: ⏎ 1. Keyed in by the Logistics Driver on the failure report. ⏎ 2. Reason is displayed on the BackOffice eMOVE Transaction Details page. ⏎ 3. Field stops accepting input at 255 characters, so the maximum cannot be exceeded. | Reason is a mandatory free-text field. ⏎ Example 1: 255 characters already keyed in and a further character is typed ⏎ a. The 256th character is not accepted by the field. ⏎ b. No error message is displayed. |
| 3 | EAINT-12019-REQ-176 | Evidence Photo | Refer to the evidence photos uploaded with a failure report. ⏎ Button Name: Upload Photo ⏎ 1. Button Function: Click to open the device file picker and attach evidence photos to the failure report. ⏎ Field Validation: ⏎ 1. Minimum 1 photo. ⏎ 2. Maximum 3 photos. ⏎ 3. Maximum 5MB per photo. ⏎ 4. File type: jpg, png. ⏎ Additional Handling/Notes: ⏎ 1. File type to be double checked with Development. | Example 1: 1 jpg photo attached ⏎ a. Photo is accepted and Submit becomes available. ⏎ Example 2: 4 photos attached ⏎ a. Fourth photo is rejected as the maximum is 3. ⏎ Example 3: A photo above 5MB attached ⏎ a. Photo is rejected. ⏎ Example 4: No photo attached ⏎ a. Submit is not available. |
| 4 | EAINT-12019-REQ-177 | Failed Status | Submitting a failure updates delivery status and transaction status. | Example 1: Pick-Up failure ⏎ a. Delivery status is Pick-Up Failed and transaction status is Failed. ⏎ Example 2: Drop-Off failure ⏎ a. Delivery status is Delivery Failed and transaction status is Failed. |
| 5 | EAINT-12019-REQ-178 | BackOffice Visibility | BackOffice can view failure reason and evidence photos. | Failure reason, evidence photos and Next Action are visible on BackOffice details page. ⏎ Open: whether BackOffice and the Used Car Dealer are notified on a failed Pick-Up or Drop-Off, and through which channel, is pending confirmation by requestor. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.5 | EAINT-12019-REQ-001 | Added | Draft requirement at version 0.5 |
| 2 | 0.5 | EAINT-12019-REQ-002 | Added | Draft requirement at version 0.5 |
| 3 | 0.5 | EAINT-12019-REQ-003 | Added | Draft requirement at version 0.5 |
| 4 | 0.5 | EAINT-12019-REQ-004 | Added | Draft requirement at version 0.5 |
| 5 | 0.5 | EAINT-12019-REQ-005 | Added | Draft requirement at version 0.5 |
| 6 | 0.5 | EAINT-12019-REQ-006 | Added | Draft requirement at version 0.5 |
| 7 | 0.5 | EAINT-12019-REQ-007 | Added | Draft requirement at version 0.5 |
| 8 | 0.5 | EAINT-12019-REQ-008 | Added | Draft requirement at version 0.5 |
| 9 | 0.5 | EAINT-12019-REQ-009 | Added | Draft requirement at version 0.5 |
| 10 | 0.5 | EAINT-12019-REQ-010 | Added | Draft requirement at version 0.5 |
| 11 | 0.5 | EAINT-12019-REQ-011 | Added | Draft requirement at version 0.5 |
| 12 | 0.5 | EAINT-12019-REQ-012 | Added | Draft requirement at version 0.5 |
| 13 | 0.5 | EAINT-12019-REQ-013 | Added | Draft requirement at version 0.5 |
| 14 | 0.5 | EAINT-12019-REQ-014 | Added | Draft requirement at version 0.5 |
| 15 | 0.5 | EAINT-12019-REQ-015 | Added | Draft requirement at version 0.5 |
| 16 | 0.5 | EAINT-12019-REQ-016 | Added | Draft requirement at version 0.5 |
| 17 | 0.5 | EAINT-12019-REQ-017 | Added | Draft requirement at version 0.5 |
| 18 | 0.5 | EAINT-12019-REQ-018 | Added | Draft requirement at version 0.5 |
| 19 | 0.5 | EAINT-12019-REQ-019 | Added | Draft requirement at version 0.5 |
| 20 | 0.5 | EAINT-12019-REQ-020 | Added | Draft requirement at version 0.5 |
| 21 | 0.5 | EAINT-12019-REQ-021 | Added | Draft requirement at version 0.5 |
| 22 | 0.5 | EAINT-12019-REQ-022 | Added | Draft requirement at version 0.5 |
| 23 | 0.5 | EAINT-12019-REQ-023 | Added | Draft requirement at version 0.5 |
| 24 | 0.5 | EAINT-12019-REQ-024 | Added | Draft requirement at version 0.5 |
| 25 | 0.5 | EAINT-12019-REQ-025 | Added | Draft requirement at version 0.5 |
| 26 | 0.5 | EAINT-12019-REQ-026 | Added | Draft requirement at version 0.5 |
| 27 | 0.5 | EAINT-12019-REQ-027 | Added | Draft requirement at version 0.5 |
| 28 | 0.5 | EAINT-12019-REQ-028 | Added | Draft requirement at version 0.5 |
| 29 | 0.5 | EAINT-12019-REQ-029 | Added | Draft requirement at version 0.5 |
| 30 | 0.5 | EAINT-12019-REQ-030 | Added | Draft requirement at version 0.5 |
| 31 | 0.5 | EAINT-12019-REQ-031 | Added | Draft requirement at version 0.5 |
| 32 | 0.5 | EAINT-12019-REQ-032 | Added | Draft requirement at version 0.5 |
| 33 | 0.5 | EAINT-12019-REQ-033 | Added | Draft requirement at version 0.5 |
| 34 | 0.5 | EAINT-12019-REQ-034 | Added | Draft requirement at version 0.5 |
| 35 | 0.5 | EAINT-12019-REQ-035 | Added | Draft requirement at version 0.5 |
| 36 | 0.5 | EAINT-12019-REQ-036 | Added | Draft requirement at version 0.5 |
| 37 | 0.5 | EAINT-12019-REQ-037 | Added | Draft requirement at version 0.5 |
| 38 | 0.5 | EAINT-12019-REQ-038 | Added | Draft requirement at version 0.5 |
| 39 | 0.5 | EAINT-12019-REQ-039 | Added | Draft requirement at version 0.5 |
| 40 | 0.5 | EAINT-12019-REQ-040 | Added | Draft requirement at version 0.5 |
| 41 | 0.5 | EAINT-12019-REQ-041 | Added | Draft requirement at version 0.5 |
| 42 | 0.5 | EAINT-12019-REQ-042 | Added | Draft requirement at version 0.5 |
| 43 | 0.5 | EAINT-12019-REQ-043 | Added | Draft requirement at version 0.5 |
| 44 | 0.5 | EAINT-12019-REQ-044 | Added | Draft requirement at version 0.5 |
| 45 | 0.5 | EAINT-12019-REQ-045 | Added | Draft requirement at version 0.5 |
| 46 | 0.5 | EAINT-12019-REQ-046 | Added | Draft requirement at version 0.5 |
| 47 | 0.5 | EAINT-12019-REQ-047 | Added | Draft requirement at version 0.5 |
| 48 | 0.5 | EAINT-12019-REQ-048 | Added | Draft requirement at version 0.5 |
| 49 | 0.5 | EAINT-12019-REQ-049 | Added | Draft requirement at version 0.5 |
| 50 | 0.5 | EAINT-12019-REQ-050 | Added | Draft requirement at version 0.5 |
| 51 | 0.5 | EAINT-12019-REQ-051 | Added | Draft requirement at version 0.5 |
| 52 | 0.5 | EAINT-12019-REQ-052 | Added | Draft requirement at version 0.5 |
| 53 | 0.5 | EAINT-12019-REQ-053 | Added | Draft requirement at version 0.5 |
| 54 | 0.5 | EAINT-12019-REQ-054 | Added | Draft requirement at version 0.5 |
| 55 | 0.5 | EAINT-12019-REQ-055 | Added | Draft requirement at version 0.5 |
| 56 | 0.5 | EAINT-12019-REQ-056 | Added | Draft requirement at version 0.5 |
| 57 | 0.5 | EAINT-12019-REQ-057 | Added | Draft requirement at version 0.5 |
| 58 | 0.5 | EAINT-12019-REQ-058 | Added | Draft requirement at version 0.5 |
| 59 | 0.5 | EAINT-12019-REQ-059 | Added | Draft requirement at version 0.5 |
| 60 | 0.5 | EAINT-12019-REQ-060 | Added | Draft requirement at version 0.5 |
| 61 | 0.5 | EAINT-12019-REQ-061 | Added | Draft requirement at version 0.5 |
| 62 | 0.5 | EAINT-12019-REQ-062 | Added | Draft requirement at version 0.5 |
| 63 | 0.5 | EAINT-12019-REQ-063 | Added | Draft requirement at version 0.5 |
| 64 | 0.5 | EAINT-12019-REQ-064 | Added | Draft requirement at version 0.5 |
| 65 | 0.5 | EAINT-12019-REQ-065 | Added | Draft requirement at version 0.5 |
| 66 | 0.5 | EAINT-12019-REQ-066 | Added | Draft requirement at version 0.5 |
| 67 | 0.5 | EAINT-12019-REQ-067 | Added | Draft requirement at version 0.5 |
| 68 | 0.5 | EAINT-12019-REQ-068 | Added | Draft requirement at version 0.5 |
| 69 | 0.5 | EAINT-12019-REQ-069 | Added | Draft requirement at version 0.5 |
| 70 | 0.5 | EAINT-12019-REQ-070 | Added | Draft requirement at version 0.5 |
| 71 | 0.5 | EAINT-12019-REQ-071 | Added | Draft requirement at version 0.5 |
| 72 | 0.5 | EAINT-12019-REQ-072 | Added | Draft requirement at version 0.5 |
| 73 | 0.5 | EAINT-12019-REQ-073 | Added | Draft requirement at version 0.5 |
| 74 | 0.5 | EAINT-12019-REQ-074 | Added | Draft requirement at version 0.5 |
| 75 | 0.5 | EAINT-12019-REQ-075 | Added | Draft requirement at version 0.5 |
| 76 | 0.5 | EAINT-12019-REQ-076 | Added | Draft requirement at version 0.5 |
| 77 | 0.5 | EAINT-12019-REQ-077 | Added | Draft requirement at version 0.5 |
| 78 | 0.5 | EAINT-12019-REQ-078 | Added | Draft requirement at version 0.5 |
| 79 | 0.5 | EAINT-12019-REQ-079 | Added | Draft requirement at version 0.5 |
| 80 | 0.5 | EAINT-12019-REQ-080 | Added | Draft requirement at version 0.5 |
| 81 | 0.5 | EAINT-12019-REQ-081 | Added | Draft requirement at version 0.5 |
| 82 | 0.5 | EAINT-12019-REQ-082 | Added | Draft requirement at version 0.5 |
| 83 | 0.5 | EAINT-12019-REQ-083 | Added | Draft requirement at version 0.5 |
| 84 | 0.5 | EAINT-12019-REQ-084 | Added | Draft requirement at version 0.5 |
| 85 | 0.5 | EAINT-12019-REQ-085 | Added | Draft requirement at version 0.5 |
| 86 | 0.5 | EAINT-12019-REQ-086 | Added | Draft requirement at version 0.5 |
| 87 | 0.5 | EAINT-12019-REQ-087 | Added | Draft requirement at version 0.5 |
| 88 | 0.5 | EAINT-12019-REQ-088 | Added | Draft requirement at version 0.5 |
| 89 | 0.5 | EAINT-12019-REQ-089 | Added | Draft requirement at version 0.5 |
| 90 | 0.5 | EAINT-12019-REQ-090 | Added | Draft requirement at version 0.5 |
| 91 | 0.5 | EAINT-12019-REQ-091 | Added | Draft requirement at version 0.5 |
| 92 | 0.5 | EAINT-12019-REQ-092 | Added | Draft requirement at version 0.5 |
| 93 | 0.5 | EAINT-12019-REQ-093 | Added | Draft requirement at version 0.5 |
| 94 | 0.5 | EAINT-12019-REQ-094 | Added | Draft requirement at version 0.5 |
| 95 | 0.5 | EAINT-12019-REQ-095 | Added | Draft requirement at version 0.5 |
| 96 | 0.5 | EAINT-12019-REQ-096 | Added | Draft requirement at version 0.5 |
| 97 | 0.5 | EAINT-12019-REQ-097 | Added | Draft requirement at version 0.5 |
| 98 | 0.5 | EAINT-12019-REQ-098 | Added | Draft requirement at version 0.5 |
| 99 | 0.5 | EAINT-12019-REQ-099 | Added | Draft requirement at version 0.5 |
| 100 | 0.5 | EAINT-12019-REQ-100 | Added | Draft requirement at version 0.5 |
| 101 | 0.5 | EAINT-12019-REQ-101 | Added | Draft requirement at version 0.5 |
| 102 | 0.5 | EAINT-12019-REQ-102 | Added | Draft requirement at version 0.5 |
| 103 | 0.5 | EAINT-12019-REQ-103 | Added | Draft requirement at version 0.5 |
| 104 | 0.5 | EAINT-12019-REQ-104 | Added | Draft requirement at version 0.5 |
| 105 | 0.5 | EAINT-12019-REQ-105 | Added | Draft requirement at version 0.5 |
| 106 | 0.5 | EAINT-12019-REQ-106 | Added | Draft requirement at version 0.5 |
| 107 | 0.5 | EAINT-12019-REQ-107 | Added | Draft requirement at version 0.5 |
| 108 | 0.5 | EAINT-12019-REQ-108 | Added | Draft requirement at version 0.5 |
| 109 | 0.5 | EAINT-12019-REQ-109 | Added | Draft requirement at version 0.5 |
| 110 | 0.5 | EAINT-12019-REQ-110 | Added | Draft requirement at version 0.5 |
| 111 | 0.5 | EAINT-12019-REQ-111 | Added | Draft requirement at version 0.5 |
| 112 | 0.5 | EAINT-12019-REQ-112 | Added | Draft requirement at version 0.5 |
| 113 | 0.5 | EAINT-12019-REQ-113 | Added | Draft requirement at version 0.5 |
| 114 | 0.5 | EAINT-12019-REQ-114 | Added | Draft requirement at version 0.5 |
| 115 | 0.5 | EAINT-12019-REQ-115 | Added | Draft requirement at version 0.5 |
| 116 | 0.5 | EAINT-12019-REQ-116 | Added | Draft requirement at version 0.5 |
| 117 | 0.5 | EAINT-12019-REQ-117 | Added | Draft requirement at version 0.5 |
| 118 | 0.5 | EAINT-12019-REQ-118 | Added | Draft requirement at version 0.5 |
| 119 | 0.5 | EAINT-12019-REQ-119 | Added | Draft requirement at version 0.5 |
| 120 | 0.5 | EAINT-12019-REQ-120 | Added | Draft requirement at version 0.5 |
| 121 | 0.5 | EAINT-12019-REQ-121 | Added | Draft requirement at version 0.5 |
| 122 | 0.5 | EAINT-12019-REQ-122 | Added | Draft requirement at version 0.5 |
| 123 | 0.5 | EAINT-12019-REQ-123 | Added | Draft requirement at version 0.5 |
| 124 | 0.5 | EAINT-12019-REQ-124 | Added | Draft requirement at version 0.5 |
| 125 | 0.5 | EAINT-12019-REQ-125 | Added | Draft requirement at version 0.5 |
| 126 | 0.5 | EAINT-12019-REQ-126 | Added | Draft requirement at version 0.5 |
| 127 | 0.5 | EAINT-12019-REQ-127 | Added | Draft requirement at version 0.5 |
| 128 | 0.5 | EAINT-12019-REQ-128 | Added | Draft requirement at version 0.5 |
| 129 | 0.5 | EAINT-12019-REQ-129 | Added | Draft requirement at version 0.5 |
| 130 | 0.5 | EAINT-12019-REQ-130 | Added | Draft requirement at version 0.5 |
| 131 | 0.5 | EAINT-12019-REQ-131 | Added | Draft requirement at version 0.5 |
| 132 | 0.5 | EAINT-12019-REQ-132 | Added | Draft requirement at version 0.5 |
| 133 | 0.5 | EAINT-12019-REQ-133 | Added | Draft requirement at version 0.5 |
| 134 | 0.5 | EAINT-12019-REQ-134 | Added | Draft requirement at version 0.5 |
| 135 | 0.5 | EAINT-12019-REQ-135 | Added | Draft requirement at version 0.5 |
| 136 | 0.5 | EAINT-12019-REQ-136 | Added | Draft requirement at version 0.5 |
| 137 | 0.5 | EAINT-12019-REQ-137 | Added | Draft requirement at version 0.5 |
| 138 | 0.5 | EAINT-12019-REQ-138 | Added | Draft requirement at version 0.5 |
| 139 | 0.5 | EAINT-12019-REQ-139 | Added | Draft requirement at version 0.5 |
| 140 | 0.5 | EAINT-12019-REQ-140 | Added | Draft requirement at version 0.5 |
| 141 | 0.5 | EAINT-12019-REQ-141 | Added | Draft requirement at version 0.5 |
| 142 | 0.5 | EAINT-12019-REQ-142 | Added | Draft requirement at version 0.5 |
| 143 | 0.5 | EAINT-12019-REQ-143 | Added | Draft requirement at version 0.5 |
| 144 | 0.5 | EAINT-12019-REQ-144 | Added | Draft requirement at version 0.5 |
| 145 | 0.5 | EAINT-12019-REQ-145 | Added | Draft requirement at version 0.5 |
| 146 | 0.5 | EAINT-12019-REQ-146 | Added | Draft requirement at version 0.5 |
| 147 | 0.5 | EAINT-12019-REQ-147 | Added | Draft requirement at version 0.5 |
| 148 | 0.5 | EAINT-12019-REQ-148 | Added | Draft requirement at version 0.5 |
| 149 | 0.5 | EAINT-12019-REQ-149 | Added | Draft requirement at version 0.5 |
| 150 | 0.5 | EAINT-12019-REQ-150 | Added | Draft requirement at version 0.5 |
| 151 | 0.5 | EAINT-12019-REQ-151 | Added | Draft requirement at version 0.5 |
| 152 | 0.5 | EAINT-12019-REQ-152 | Added | Draft requirement at version 0.5 |
| 153 | 0.5 | EAINT-12019-REQ-153 | Added | Draft requirement at version 0.5 |
| 154 | 0.5 | EAINT-12019-REQ-154 | Added | Draft requirement at version 0.5 |
| 155 | 0.5 | EAINT-12019-REQ-155 | Added | Draft requirement at version 0.5 |
| 156 | 0.5 | EAINT-12019-REQ-156 | Added | Draft requirement at version 0.5 |
| 157 | 0.5 | EAINT-12019-REQ-157 | Added | Draft requirement at version 0.5 |
| 158 | 0.5 | EAINT-12019-REQ-158 | Added | Draft requirement at version 0.5 |
| 159 | 0.5 | EAINT-12019-REQ-159 | Added | Draft requirement at version 0.5 |
| 160 | 0.5 | EAINT-12019-REQ-160 | Added | Draft requirement at version 0.5 |
| 161 | 0.5 | EAINT-12019-REQ-161 | Added | Draft requirement at version 0.5 |
| 162 | 0.5 | EAINT-12019-REQ-162 | Added | Draft requirement at version 0.5 |
| 163 | 0.5 | EAINT-12019-REQ-163 | Added | Draft requirement at version 0.5 |
| 164 | 0.5 | EAINT-12019-REQ-164 | Added | Draft requirement at version 0.5 |
| 165 | 0.5 | EAINT-12019-REQ-165 | Added | Draft requirement at version 0.5 |
| 166 | 0.5 | EAINT-12019-REQ-166 | Added | Draft requirement at version 0.5 |
| 167 | 0.5 | EAINT-12019-REQ-167 | Added | Draft requirement at version 0.5 |
| 168 | 0.5 | EAINT-12019-REQ-168 | Added | Draft requirement at version 0.5 |
| 169 | 0.5 | EAINT-12019-REQ-169 | Added | Draft requirement at version 0.5 |
| 170 | 0.5 | EAINT-12019-REQ-170 | Added | Draft requirement at version 0.5 |
| 171 | 0.5 | EAINT-12019-REQ-171 | Added | Draft requirement at version 0.5 |
| 172 | 0.5 | EAINT-12019-REQ-172 | Added | Draft requirement at version 0.5 |
| 173 | 0.5 | EAINT-12019-REQ-173 | Added | Draft requirement at version 0.5 |
| 174 | 0.5 | EAINT-12019-REQ-174 | Added | Draft requirement at version 0.5 |
| 175 | 0.5 | EAINT-12019-REQ-175 | Added | Draft requirement at version 0.5 |
| 176 | 0.5 | EAINT-12019-REQ-176 | Added | Draft requirement at version 0.5 |
| 177 | 0.5 | EAINT-12019-REQ-177 | Added | Draft requirement at version 0.5 |
| 178 | 0.5 | EAINT-12019-REQ-178 | Added | Draft requirement at version 0.5 |
