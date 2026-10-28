# SRD_EAINT-12019_v0.3_20260914.docx — text copy (27/10/2026, 4:50:21 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-UCD] eMOVE – Standalone Logistics Service |
| Version | Version 0.3 |
| Latest Revision Date | 14.09.2026 (Monday) |

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
| 0.2 | 04.09.2026 (Fri) | Chee Mei Jia | Updated Section 1.5 Associated Documents ⏎ Updated Sections 2.1.1 to 2.2.8 ⏎ Updated Section 2.2.12 Charges Matrix Setup ⏎ Removed Section 2.2.16 Pending Items |
| 0.3 | 14.09.2026 (Mon) | Chee Mei Jia | Updated Sections 1.4 and 1.5 ⏎ Updated Sections 2.1.1 to 2.2.12 ⏎ Added Sections 2.2.10 and 2.2.13 ⏎ Renumbered Sections 2.2.11 to 2.2.17 |

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
| 9 | MotoHub | Vendor payment platform used for driver and transporter payment requests. |
| 10 | Hub-to-Hub | Pickup and drop-off at eAuto branch hubs. |
| 11 | Door-to-Door | Pickup and/or drop-off at a custom address. |
| 12 | Pricing Tier | Charge band determined by distance range of a delivery. |
| 13 | Logistics Price | Amount charged to a Used Car Dealer for a delivery falling within a pricing tier. |
| 14 | Hub Management | BackOffice page maintained under EAINT-12119 holding hub records, their verification status and their active status. |
| 15 | RHB | Bank used to collect eMOVE payment. |
| 16 | Company ID | Identifier of a Used Car Dealer company, appended to Reference 1 sent to RHB. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12019 — [eAuto-UCD] eMOVE – Standalone Logistics Service | https://mfservices.atlassian.net/browse/EAINT-12019 | Internal IT ticket |
| 2 | EAUTO-936 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/EAUTO-936 | Source ticket |
| 3 | CCB-827 — EAUTO MOVE (eMOVE) | https://mfservices.atlassian.net/browse/CCB-827 | Cross-department ticket |
| 4 | EAINT-12119 — Logistics: Interstate Price Tier for Logistics Delivery | https://mfservices.atlassian.net/browse/EAINT-12119 | Internal IT ticket, baselined at Version 1.0 on 11.09.2026. Logistics pricing, distance measurement, hub management, address validation and payment re-pricing are delivered under this ticket. eMOVE follows that same logic. |
| 5 | UCD Portal Prototype — eMOVE Logistics | Shared separately by Business Analyst | Reference for wizard flow, charges breakdown and delivery status layout. |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Introduce eMOVE, a standalone car logistics module in UCD Portal, available after a UCD-to-UCD interstate transfer or eSTM is complete. Used Car Dealers can request pickup and delivery, pay online, track delivery progress and receive invoices. |
| 2.1.2 | Key Value(s) Expected | 1. Broaden logistics reach under eAuto wholesale marketplace. ⏎ 2. Offer logistics as a self-service module with automated charging and delivery tracking. |
| 2.1.3 | Additional Note(s) | Vendor payment is handled through MotoHub, by creating a Purchase Order followed by a payment request, and is settled monthly by quantity of completed jobs. ⏎ Logistics pricing follows a charges matrix maintained under EAINT-12119. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Tier values and distance ranges follow charges matrix maintained under EAINT-12119. Door-to-Door surcharge is a fixed rate already in use in Wholesale production, and eMOVE applies that same rate. |
| 2 | eMOVE is available only after a UCD-to-UCD interstate transfer or eSTM is completed and approved. |
| 3 | Vendor payment is handled through MotoHub, by creating a Purchase Order followed by a payment request, and is settled monthly by the quantity of completed jobs. |
| 4 | SST is charged at 8% on eAuto Fee only. As no eAuto Fee is charged in this phase, SST amount is RM0.00. |
| 5 | All vehicle types are eligible unless requestor confirms restrictions. |
| 6 | eMOVE is an internal module for this phase. It applies only to STMS and eSTM approved transactions, including UCD-to-UCD interstate transfer. Confirmed by Ket Ming on 03.09.2026. |
| 7 | eAuto measures distance used for pricing. Logistics provider does not supply it. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | MotoHub vendor payment and finance module build | Detailed finance flow is tracked separately and only referenced in this document. |
| 2 | Non-UCD portals | eMOVE is delivered in UCD Portal only for this phase. |
| 3 | Native driver mobile application development | Driver flow is shown as a web and mobile prototype. Native application build is separate. |
| 4 | Public or open access to eMOVE | Confirmed that this phase applies to an internal module only, limited to STMS and eSTM approved transactions. ⏎ Opening eMOVE to public use is a future phase and is not covered by this document. |
| 5 | BackOffice Logistics Charges Matrix Setup page build | Matrix setup page and interstate distance tier are delivered under EAINT-12119. eMOVE consumes that same matrix and does not build a second setup page. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. UCD ⏎ 2. BackOffice ⏎ 3. Driver |
| 3 | Module | eMOVE, a new standalone module in UCD Portal. ⏎ Confirmed by Ket Ming on 03.09.2026: not placed under STMS (eSTM & UCD to UCD). |
| 4 | Request | Introduce eMOVE, a standalone logistics module for car pickup and delivery after a UCD-to-UCD interstate transfer or eSTM. |
| 5 | Additional Note | Source ticket: EAUTO-936. ⏎ Transfer options: Door-to-Door and Hub-to-Hub. ⏎ Logistics fee is calculated automatically by distance, vehicle type, delivery method and location. ⏎ Vendor payment through MotoHub, settled monthly by completed jobs. ⏎ This phase is internal only, covering STMS and eSTM approved transactions including UCD-to-UCD interstate transfer. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | Not applicable. eMOVE is a new module and has no existing behaviour. |
| 2 | Expected New Handling / Behaviour | 1. Offer logistics as a standalone module in UCD Portal, for internal use in this phase. ⏎ 2. Available for STMS and eSTM approved transactions, including UCD-to-UCD interstate transfer. ⏎ 3. Used Car Dealer requests delivery. eAuto arranges pickup and delivery, and charges per matrix. ⏎ 4. Driver scans a QR code to upload photos and update delivery status. ⏎ 5. Invoice and e-invoice are generated after payment. ⏎ 6. BackOffice portal to view eMOVE transaction listing, including payment status. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | UCD Portal — Home / Logistics Landing | New Logistics entry point and eMOVE landing page. |
| 2 | UCD Portal — Logistics Transaction Listing | New listing of eMOVE transactions. |
| 3 | UCD Portal — Create Logistics Request (Wizard) | New 3-step create flow covering vehicle and locations, summary and charges, then payment. |
| 4 | UCD Portal — Transaction Details | New details page with charges, delivery status and documents. |
| 5 | BackOffice — eMOVE Transaction Listing | New listing with filters, added to existing menu. |
| 6 | BackOffice — Transaction Details | New details page with documents, tracking and photo viewer. |
| 7 | BackOffice — Logistics Hub | No change to this module. eMOVE reads its hub listing from Hub Management and its rates from Logistics Charges Matrix Setup. For more details, refer to EAINT-12119. |
| 8 | Driver App — Pick-Up & Drop-Off Scan | New scan, photo upload and failure handling flows. |

### 2.2.4 UCD Portal — eMOVE Entry & Logistics Landing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-001 | eMOVE Entry Point | Add a Logistics entry in UCD Portal home to access eMOVE module. | Selecting Logistics from UCD Portal home navigates to eMOVE Logistics landing page. |
| 2 | EAINT-12019-REQ-002 | Landing Options | Logistics landing presents 2 actions: view existing logistics transactions, and create a new logistics request. | Landing page displays a listing entry and a Create entry point. |
| 3 | EAINT-12019-REQ-003 | Service Availability | eMOVE is offered as a standalone module in UCD Portal. ⏎ For this phase eMOVE is internal only. It is available for transactions approved in STMS and eSTM, including UCD-to-UCD interstate transfer. | Example 1: STMS or eSTM transaction is approved, including UCD-to-UCD interstate transfer ⏎ a. eMOVE is available for the vehicle. ⏎ Example 2: STMS or eSTM transaction is not yet approved ⏎ a. eMOVE is not offered for the vehicle. ⏎ Example 3: Vehicle has no STMS or eSTM transaction ⏎ a. eMOVE is not offered. Access beyond internal use is not supported in this phase. |

### 2.2.5 UCD Portal — Logistics Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-004 | Listing Columns | Columns shown in UCD Portal logistics transaction listing, in display order. | 1. # - row number within current result set ⏎ 2. Vehicle - vehicle registration number ⏎ 3. Trx No - Logistics Transaction No, format per REQ-041 ⏎ 4. Created At - date and time a request was created, format DD-MM-YYYY HH:mm in 24-hour time ⏎ 5. Pickup - pickup state ⏎ 6. Drop Off - drop-off state ⏎ 7. Payment - payment status per REQ-006 ⏎ 8. Delivery - delivery status per REQ-007 ⏎ 9. Tx Status - transaction status derived per REQ-009 ⏎ 10. LHDN Response Status - status per REQ-008 ⏎ 11. Amount (RM) - total amount, 2 decimal places with a thousands separator ⏎ 12. Remarks - dash when empty ⏎ 13. Action - View, opens Transaction Details |
| 2 | EAINT-12019-REQ-005 | Listing Sort Order | Listing is sorted by created date and time, newest first. | Example 1: Several transactions created on different dates ⏎ a. Most recently created transaction is shown in row 1. ⏎ Example 2: Several transactions created on the same date ⏎ a. Later time of creation is shown first. |
| 3 | EAINT-12019-REQ-006 | Payment Status Values | Payment status reflects payment outcome. | Payment status is one of: OK, Pending or Failed. |
| 4 | EAINT-12019-REQ-007 | Delivery Status Values | Delivery status reflects logistics and delivery progress. | Delivery status is one of: blank, Pending Pick Up, In Transit, Delivered, Pickup Failed or Delivery Failed. |
| 5 | EAINT-12019-REQ-008 | LHDN Response Status Values | LHDN Response Status reflects outcome of e-Invoice submission to LHDN. ⏎ Values follow the set already in production on other eAuto products: OK, Failed, a dash, and N/A. ⏎ Where status is Failed, Remarks carry the reason returned. Remarks column is also used for payment failure text. ⏎ Mapping for the rare case where LHDN returns no response, and which remark is shown where payment and LHDN both fail, are pending confirmation by the requestor. | Example 1: Submission accepted by LHDN ⏎ a. LHDN Response Status is OK. ⏎ Example 2: Submission rejected by LHDN because a TIN could not be verified ⏎ a. LHDN Response Status is Failed. ⏎ b. Remarks show: TIN verification failed. Kindly provide correct TIN information to eAuto customer service. ⏎ Example 3: Submission rejected by LHDN because no TIN was supplied ⏎ a. LHDN Response Status is Failed. ⏎ b. Remarks show: No TIN info has been provided. ⏎ Example 4: No response returned by LHDN ⏎ a. LHDN Response Status is a dash. This is a rare case. ⏎ b. Mapping pending confirmation by the requestor. ⏎ Example 5: e-Invoice not applicable to that transaction ⏎ a. LHDN Response Status is N/A. |
| 6 | EAINT-12019-REQ-009 | Derived Transaction Status | Transaction status is derived from payment status and delivery status, not entered manually. | Example 1: Payment Failed, or Delivery is Pickup Failed or Delivery Failed ⏎ a. Transaction status is Failed. ⏎ Example 2: Payment is OK and Delivery is Delivered ⏎ a. Transaction status is Completed. ⏎ Example 3: Any other combination ⏎ a. Transaction status is Pending. |
| 7 | EAINT-12019-REQ-010 | Row Action | Selecting a row opens Transaction Details page. | Selecting a listing row navigates to that transaction's details. |

### 2.2.6 UCD Portal — Create Logistics Request (Wizard)

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-011 | Step 1 — Vehicle | Step 1 selects a vehicle to move from a completed transfer or eSTM, and shows plate, vehicle type and colour. | Vehicle plate, Vehicle Type and Colour are displayed. Vehicle Type and Colour show a dash when no value is held. |
| 2 | EAINT-12019-REQ-012 | Vehicle Type Values | Vehicle Type offers a fixed list of 5 values. A dash is displayed wherever no value is held, in this module and in BackOffice. | 1. Sedan / Hatchback ⏎ 2. SUV / MPV ⏎ 3. Pickup / 4x4 ⏎ 4. Motorcycle ⏎ 5. Commercial / Lorry |
| 3 | EAINT-12019-REQ-013 | Vehicle Type Prefill | Vehicle Type is prefilled from an existing insurance record when a value is available. When no value is available, this field is left blank for a Used Car Dealer to fill in. ⏎ Field stays optional in both cases. | Example 1: Insurance record found for the vehicle ⏎ a. Vehicle Type is prefilled with a value from that insurance record. ⏎ b. Message "You may change it if incorrect." is displayed below that field. ⏎ c. Value remains editable. ⏎ Example 2: No insurance record found for the vehicle ⏎ a. Vehicle Type is left blank for a Used Car Dealer to fill in. ⏎ b. No message is displayed. |
| 4 | EAINT-12019-REQ-014 | Service Type | Choose Hub-to-Hub or Door-to-Door. Pickup and drop-off legs are selectable independently. | Example 1: Hub-to-Hub ⏎ a. Both pickup and drop-off are at eAuto branch hubs. ⏎ Example 2: Door-to-Door ⏎ a. Pickup and drop-off may each be at a custom address, chosen independently. |
| 5 | EAINT-12019-REQ-015 | Pickup Location | Select a pickup hub by state, or enter a pickup address. Pickup Remarks are optional. | Pickup location is captured. Remarks are optional and may be left blank. |
| 6 | EAINT-12019-REQ-016 | Drop-off Location | Select a drop-off hub by state, or enter a drop-off address. Drop-off Remarks are optional. | Drop-off location is captured. Remarks are optional and may be left blank. |
| 7 | EAINT-12019-REQ-017 | Preferred Pickup Date | Select a Preferred Pickup Date within an allowed rolling window. | Date picker restricts selection to that allowed monthly window. |
| 8 | EAINT-12019-REQ-018 | Hub Address Master | Hub list available for selection is taken from Hub Management page maintained under EAINT-12119. | Hubs offered for pickup and drop-off match records held in Hub Management. |
| 9 | EAINT-12019-REQ-019 | East Malaysia Restriction | An eMOVE request with a pickup or drop-off address in Sabah, Sarawak or Labuan is not accepted. ⏎ Check runs on Step 1 when a Used Car Dealer clicks Next. Message shown follows EAINT-12119 REQ-025. | Example 1: Address is in Sabah, Sarawak or Labuan ⏎ a. Step 1 remains displayed and Step 2 is not reached. ⏎ b. Message defined under EAINT-12119 REQ-025 is displayed. ⏎ Example 2: Address is in Peninsular Malaysia ⏎ a. Request proceeds to Step 2. |
| 10 | EAINT-12019-REQ-020 | Address Field Validation | Validation applied to a Door-to-Door pickup or drop-off address, so that an address captured is complete enough to be matched to a coordinate. | 1. Address: minimum 10 characters, maximum 255 characters, English only ⏎ 2. Postcode: numeric only, exactly 5 digits ⏎ 3. State: dropdown, values follow eSTM Step 2 excluding Sabah, Sarawak and Labuan ⏎ 4. City: dropdown, values follow eSTM Step 2 excluding Sabah, Sarawak and Labuan |
| 11 | EAINT-12019-REQ-021 | Delivery Address Validation | A Door-to-Door pickup or drop-off address is validated against a mapping service when a Used Car Dealer clicks Next on Step 1. A valid address proceeds to Step 2. An invalid address stays on Step 1 and an error message is shown. ⏎ Validation mechanism, fallback service and message shown follow EAINT-12119 REQ-024, REQ-026 and REQ-027. | Example 1: Address is matched ⏎ a. A coordinate is stored and Step 2 is displayed. ⏎ b. Charges shown on Step 2 are calculated from that coordinate. ⏎ Example 2: Address cannot be matched ⏎ a. No coordinate is stored and Step 1 remains displayed. ⏎ b. This message is shown, per EAINT-12119 REQ-027: We could not find the address. Please check and try again, or contact support at 03-27798899. |
| 12 | EAINT-12019-REQ-022 | Step 2 — Summary & Charges | Step 2 shows a request summary with an automatically calculated charges breakdown before payment. | Summary displays vehicle, service type, locations and full charges breakdown. |
| 13 | EAINT-12019-REQ-023 | Full Address Display | Step 2 summary and Step 3 confirmation display full pickup and drop-off address, not only city and state. | Example 1: Door-to-Door pickup or drop-off ⏎ a. Address line, postcode, city and state are displayed together as 1 full address. ⏎ Example 2: Hub pickup or drop-off ⏎ a. Hub name, state and full hub address are displayed. |
| 14 | EAINT-12019-REQ-024 | Step 3 — Payment | Step 3 collects payment. On success a transaction is created. ⏎ Save & Continue Later behaviour, and maximum number of days before a draft becomes Expired, are pending confirmation by requestor. | Example 1: Payment success ⏎ a. Transaction is created and Payment status is OK. ⏎ Example 2: Payment declined ⏎ a. Payment status is Failed and a decline message is displayed. |
| 15 | EAINT-12019-REQ-025 | Remarks Field Validation | Validation specification for Pickup Remarks and Drop-off Remarks. Proposed values pending confirmation by requestor. | 1. Min Length: 0 ⏎ 2. Max Length: 255 ⏎ 3. Special Character: Yes ⏎ 4. Alphanumeric: Yes ⏎ 5. Only Allow English: No ⏎ 6. Mandatory / Optional: Optional |

### 2.2.7 UCD Portal — Logistics Charges & Pricing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-026 | Tier Pricing Source | Logistics base charge for an eMOVE request is tier price shown on Step 2, and that is the amount a Used Car Dealer pays on Step 3. ⏎ Tier structure, tier values, distance ranges, how they are maintained and how a change takes effect all follow EAINT-12119. This document does not restate them. | Charge applied to an eMOVE request matches tier price held under EAINT-12119 at the moment Step 2 is displayed. |
| 2 | EAINT-12019-REQ-027 | Distance Measurement & Tier Assignment | Distance used to assign a tier is measured between 2 points an eMOVE request was created with. A Door-to-Door leg is measured from a door address. A Hub-to-Hub leg is measured from a hub address held in Hub Management. Pickup and drop-off are resolved independently, so 1 request may use a door address at one end and a hub address at the other. ⏎ Distance is resolved on Step 1 when a Used Car Dealer clicks Next, so a request that cannot be priced is stopped at Step 1 and never reaches Step 2. ⏎ Measurement logic follows EAINT-12119 REQ-028. | Example 1: Both ends resolve to a coordinate ⏎ a. Measured distance is matched to a tier and that tier's price is applied. ⏎ b. Step 2 is displayed with that charge. ⏎ Example 2: A selected hub has no usable coordinate ⏎ a. Distance cannot be measured, so that request cannot be priced. ⏎ b. Step 1 remains displayed and Step 2 is not reached. ⏎ Example 3: A hub location is corrected after a request was created ⏎ a. Correction applies to requests created after it. ⏎ b. Requests already priced keep their price. |
| 3 | EAINT-12019-REQ-028 | Door-to-Door Surcharge | A Door-to-Door leg adds RM200.00 on top of tier price. Pickup and drop-off are charged independently, so a delivery that is Door-to-Door at both ends carries 2 surcharges. ⏎ This is a fixed rate already in use in Wholesale production. eMOVE applies that same rate. Surcharge is applied by payment service. | Example 1: Seller address to hub, then hub to buyer address ⏎ a. RM200.00 is added for seller to hub. ⏎ b. RM200.00 is added for hub to buyer. ⏎ c. Total surcharge is RM400.00. ⏎ Example 2: Door-to-Door at one end only ⏎ a. RM200.00 is added once. ⏎ Example 3: Hub-to-Hub ⏎ a. No surcharge is added. |
| 4 | EAINT-12019-REQ-029 | eAuto Fee | No eAuto Fee is charged in this phase. ⏎ eAuto Fee line is retained in charges breakdown, as Operations team may introduce a charge in a future phase. Charge amount is not decided yet. | eAuto Fee is RM0.00 per transaction. ⏎ eAuto Fee line remains visible in charges breakdown with a value of RM0.00. |
| 5 | EAINT-12019-REQ-030 | SST | SST is charged on eAuto Fee only. ⏎ As no eAuto Fee is charged in this phase, SST amount is RM0.00. | SST is 8% of eAuto Fee. ⏎ An eAuto Fee of RM0.00 gives an SST of RM0.00. |
| 6 | EAINT-12019-REQ-031 | Applies to Both | Pricing applies to both wholesale and standalone logistics requests. ⏎ Both use one charges matrix maintained under EAINT-12119. eMOVE does not hold its own pricing table. | Same charges logic is used regardless of whether a request originates from wholesale or standalone. |
| 7 | EAINT-12019-REQ-032 | Stale Price Handling | Amount shown on Step 2 is the amount payable on Step 3. Where a tier price changed between Step 2 and Step 3, an error message is displayed and that page is refreshed with a current price, following EAINT-12119 REQ-012. ⏎ Which transaction statuses are affected, and which are never re-priced, follows EAINT-12119 REQ-011 to REQ-016. | Example 1: Tier price unchanged between Step 2 and Step 3 ⏎ a. Used Car Dealer pays the amount shown on Step 2. ⏎ Example 2: Tier price changed between Step 2 and Step 3 ⏎ a. An error message is displayed. ⏎ b. Page is refreshed with a current price and that current price becomes payable. ⏎ Example 3: Request is already paid or approved ⏎ a. Request is never re-priced. |
| 8 | EAINT-12019-REQ-033 | Payment Reset | Where a re-price changes an amount, existing eMOVE payment instruction is reset and a new amount is stamped on that request before payment can be completed. ⏎ No one-time password is used in eMOVE, so no password re-issue applies. | Example 1: Amount changed while a request was unpaid ⏎ a. Existing payment instruction is reset. ⏎ b. New amount is stamped on that request and is payable. ⏎ Example 2: Amount unchanged ⏎ a. Existing payment instruction stands. |
| 9 | EAINT-12019-REQ-034 | Re-price Audit Record | Every eMOVE re-price is written to an eMOVE re-price audit record, separate from wholesale audit record, following separation set out in EAINT-12119 REQ-016. | An eMOVE re-price is retrievable from eMOVE audit record and does not appear in wholesale record. |

### 2.2.8 UCD Portal — Transaction Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-035 | Details Header | Show Transaction No or Listing Reference, together with derived transaction status. | Header shows Transaction No or Listing Reference and a transaction status badge. |
| 2 | EAINT-12019-REQ-036 | Vehicle Information | Show plate, vehicle type and colour. | Vehicle Type and Colour show a dash when no value is held. |
| 3 | EAINT-12019-REQ-037 | Locations & Remarks | Show pickup and drop-off locations and their remarks. | Pickup Remarks and Drop-off Remarks show a dash when empty. |
| 4 | EAINT-12019-REQ-038 | Charges Breakdown | Show charges breakdown covering base charge by tier, door-to-door surcharge, eAuto Fee, SST and total. | Breakdown totals reconcile to amount paid. |
| 5 | EAINT-12019-REQ-039 | Transaction Progress Timeline | Show a transaction progress timeline in a horizontal layout, with 5 fixed nodes running left to right and a connector line drawn between them: Logistics Created, Payment Received, Pending Pick Up, In Transit and Delivered. ⏎ Logistics Created is always complete. Payment Received is driven by payment status. Pending Pick Up, In Transit and Delivered are driven by delivery status. ⏎ Each node carries a caption below it: created date and time on Logistics Created, payment date and time once paid, and a description of driver activity on remaining nodes. | Example 1: Payment is OK and delivery status is Delivered ⏎ a. All 5 nodes are shown complete. ⏎ Example 2: Payment is OK and delivery status is In Transit ⏎ a. Logistics Created, Payment Received and Pending Pick Up are complete. ⏎ b. In Transit is the current node. ⏎ c. Delivered is not yet reached. ⏎ Example 3: Payment is Pending or Failed ⏎ a. Only Logistics Created is complete. ⏎ b. Payment Received shows Awaiting payment, or a payment failed caption where payment status is Failed. ⏎ c. Remaining nodes are not yet reached. ⏎ Example 4: Delivery status is Pickup Failed ⏎ a. Pending Pick Up is shown as a failed node in red, with failure reason in its caption. ⏎ b. In Transit and Delivered are not reached. ⏎ Example 5: Delivery status is Delivery Failed ⏎ a. Pending Pick Up and In Transit are complete. ⏎ b. Delivered is shown as a failed node in red, with failure reason in its caption. |
| 6 | EAINT-12019-REQ-040 | Documents | Invoice and e-Invoice are available after payment. | Example 1: Payment is OK ⏎ a. Invoice and e-Invoice buttons are available. ⏎ Example 2: Payment Failed ⏎ a. A decline message is displayed and documents are not available. ⏎ Example 3: Payment Pending ⏎ a. Invoice and e-Invoice are not available. |

### 2.2.9 Transaction & Payment ID Formats

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-041 | Logistics Transaction No Format | Format: EMYM{7-digit running number}, where Y is a single-digit year and M is month. | Example: EM680000001 |
| 2 | EAINT-12019-REQ-042 | Payment ID Format | Format: EMYYMMDD{7-digit running number}, where YY is a 2-digit year, MM is month and DD is date. | Example: EM2608050000001 |

### 2.2.10 RHB Payment Reference Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-043 | RHB Payment Reference 1 | Reference 1 sent to RHB follows this format: EMYYMMDD{7-digit running number}-{Company ID} ⏎ This is Payment ID from REQ-042, followed by a hyphen and Company ID. | Example 1: Reference 1 for an eMOVE payment ⏎ a. Example: EM2608050000001-1040141 |
| 2 | EAINT-12019-REQ-044 | RHB Payment Reference 2 | Reference 2 sent to RHB is a fixed value identifying this module. | Example 1: Reference 2 for an eMOVE payment ⏎ a. Value is EMOVE for every eMOVE payment. |

### 2.2.11 BackOffice — eMOVE Transaction Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-045 | Listing Access | eMOVE transaction listing is accessible in BackOffice within full module menu. | 1 eMOVE page is added to existing BackOffice home menu without removing existing items. |
| 2 | EAINT-12019-REQ-046 | Filter Layout | Filters are arranged in 3 rows. | 1. Row 1: Company Name, Vehicle No, Vehicle Type, Transaction No ⏎ 2. Row 2: Date Created From, Date Created To, Pickup Date From, Pickup Date To ⏎ 3. Row 3: Service Type, Payment, Transaction Status, Delivery ⏎ Vehicle Type filter offers All, a dash for records with no value, and the 5 values in REQ-012. |
| 3 | EAINT-12019-REQ-047 | Mandatory Date Filter | Listing is empty on load. Date Created From and Date Created To are mandatory unless another filter is set. | Example 1: No date and no other filter is set ⏎ a. Message "Please select From Date and To Date." is displayed. ⏎ Example 2: Another filter is set, including Vehicle Type ⏎ a. Search is allowed without Date Created. |
| 4 | EAINT-12019-REQ-048 | Listing Columns | Columns shown in BackOffice eMOVE transaction listing, in display order. | 1. # - row number within current result set ⏎ 2. Company Name - Used Car Dealer company name ⏎ 3. Company ROC - Registration of Company number of that dealer ⏎ 4. Vehicle - vehicle registration number ⏎ 5. Vehicle Type - vehicle type held on that request, values per REQ-012, dash when no value is held ⏎ 6. Trx No - Logistics Transaction No, format per REQ-041 ⏎ 7. Created At - date and time a request was created, format DD-MM-YYYY HH:mm in 24-hour time ⏎ 8. Service - Hub-to-Hub, Door-to-Door, Door Pickup with Hub Drop-off, or Hub Pickup with Door Drop-off ⏎ 9. Pickup - pickup state ⏎ 10. Drop Off - drop-off state ⏎ 11. Payment - payment status per REQ-006 ⏎ 12. Delivery - delivery status per REQ-007 ⏎ 13. Tx Status - transaction status derived per REQ-050 ⏎ 14. LHDN Response Status - status per REQ-008 ⏎ 15. Amount (RM) - total amount, 2 decimal places with a thousands separator ⏎ 16. Remarks - dash when empty ⏎ 17. Action - View, opens Transaction Details |
| 5 | EAINT-12019-REQ-049 | Listing Sort Order | Listing is sorted by created date and time, newest first. | Example 1: Several transactions created on different dates ⏎ a. Most recently created transaction is shown in row 1. ⏎ Example 2: Several transactions created on the same date ⏎ a. Later time of creation is shown first. |
| 6 | EAINT-12019-REQ-050 | Derived Transaction Status | Transaction status derivation is identical to UCD Portal listing. | Pickup Failed, Delivery Failed or Payment Failed results in a transaction status of Failed. |

### 2.2.12 BackOffice — Transaction Details

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-051 | Details Header | A single reference line plus transaction status. | Header follows this format: plate (Ref No.: Sxxx) - Transaction Details, with transaction status displayed. |
| 2 | EAINT-12019-REQ-052 | Document Buttons | Invoice, e-Invoice and Delivery Order buttons are aligned together. | 3 document buttons appear on one row, aligned right. |
| 3 | EAINT-12019-REQ-053 | Vehicle & Remarks | Show colour, vehicle type, pickup remark and drop-off remark. | Values show a dash when empty. |
| 4 | EAINT-12019-REQ-054 | Delivery Tracking | Show delivery tracking with In Transit and Delivered timestamps, failure handling and a Next Action note. ⏎ Next Action follows the flow already in place on the existing eAuto delivery tracking page. No new handling is defined here. | Failure records show reason and Next Action, following existing page behaviour. |
| 5 | EAINT-12019-REQ-055 | Special Remark | BackOffice user can record a free-text Special Remark against a transaction and update it. | Example 1: Special Remark entered and updated ⏎ a. Remark is saved against that transaction and displayed on reopening. ⏎ Example 2: Special Remark left empty ⏎ a. No remark is stored. |
| 6 | EAINT-12019-REQ-056 | Vehicle Photos | BackOffice user can view driver-uploaded pickup and drop-off photos through a photo viewer. | Photo viewer opens pickup and drop-off photo sets. Production requires backend photo storage. |

### 2.2.13 Amount Reconciliation

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-057 | Charges Breakdown Reconciliation | Amount shown on a transaction is made up of logistics base charge, Door-to-Door surcharge, eAuto Fee and SST. ⏎ In this phase eAuto Fee and SST are both RM0.00, so the amount charged equals logistics base charge plus any Door-to-Door surcharge. ⏎ How the logistics portion is reconciled, and against what, is pending confirmation by the requestor. | Charges breakdown on UCD Portal Transaction Details and on BackOffice Transaction Details show the same figures for a given transaction. ⏎ Breakdown lines total to the amount paid. ⏎ Reconciliation basis pending confirmation by the requestor. |
| 2 | EAINT-12019-REQ-058 | Reconciliation Reporting | Report or view used to reconcile eMOVE logistics amounts is pending confirmation by the requestor. | Pending confirmation by the requestor. |

### 2.2.14 BackOffice — Logistics Hub

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-059 | Logistics Hub Pages | Hub Management and Logistics Charges Matrix Setup are both delivered under EAINT-12119. eMOVE does not build either page. ⏎ Matrix access, editable rates, mandatory reason on save, audit trail and application to both wholesale and standalone all follow EAINT-12119. For more details, refer to that document. | eMOVE reads its hub listing from Hub Management and its rate tiers from Logistics Charges Matrix Setup, with no eMOVE-side setup page. |

### 2.2.15 Driver App — Pick-Up Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-060 | Scan Vehicle | Driver scans a QR code or enters vehicle registration to load a pick-up job. | Entering a valid registration loads that matching pick-up job. |
| 2 | EAINT-12019-REQ-061 | Confirm Details | Confirmation screen shows vehicle and Used Car Dealer seller details. | Confirmation screen shows vehicle, Used Car Dealer name and ROC. |
| 3 | EAINT-12019-REQ-062 | Photo Upload | Driver uploads 12 required photos before submitting. | Submit is enabled only when 12 of 12 photos are captured. |
| 4 | EAINT-12019-REQ-063 | Status Update | On submit, delivery status is updated. | After submit, delivery status is In Transit. |

### 2.2.16 Driver App — Drop-Off Scan & Photo Upload

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-064 | Drop-off Scan | Driver scans or enters vehicle registration to load a drop-off job. | Entering a valid registration loads that matching drop-off job. |
| 2 | EAINT-12019-REQ-065 | Drop-off Party | Confirmation screen shows Drop-Off To party, being buyer or dealer. | Screen shows name, ROC and drop-off address. |
| 3 | EAINT-12019-REQ-066 | Drop-off Photos | Driver uploads 12 required drop-off photos before submitting. | Submit is enabled only when 12 of 12 photos are captured. |
| 4 | EAINT-12019-REQ-067 | Status Update | On submit, delivery status is updated. | After submit, delivery status is Delivered. |

### 2.2.17 Failed Pick-Up / Drop-Off Handling

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12019-REQ-068 | Report Issue | Driver can report an inability to pick up or drop off a vehicle. | A report issue path is available from confirmation screen. |
| 2 | EAINT-12019-REQ-069 | Reason (Free Text) | Driver types a reason as free text, with no dropdown. | Reason is a mandatory free-text field. |
| 3 | EAINT-12019-REQ-070 | Evidence Photo | An evidence photo is required to submit a failure. | Minimum 1 and maximum 3 evidence photos, each up to 5MB. |
| 4 | EAINT-12019-REQ-071 | Failed Status | Submitting a failure updates delivery status and transaction status. | Example 1: Pick-up failure ⏎ a. Delivery status is Pickup Failed and transaction status is Failed. ⏎ Example 2: Drop-off failure ⏎ a. Delivery status is Delivery Failed and transaction status is Failed. |
| 5 | EAINT-12019-REQ-072 | BackOffice Visibility | BackOffice can view failure reason and evidence photos. | Failure reason, evidence photos and Next Action are visible on BackOffice details page. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.3 | EAINT-12019-REQ-001 | Added | Draft requirement at version 0.3 |
| 2 | 0.3 | EAINT-12019-REQ-002 | Added | Draft requirement at version 0.3 |
| 3 | 0.3 | EAINT-12019-REQ-003 | Added | Draft requirement at version 0.3 |
| 4 | 0.3 | EAINT-12019-REQ-004 | Added | Draft requirement at version 0.3 |
| 5 | 0.3 | EAINT-12019-REQ-005 | Added | Draft requirement at version 0.3 |
| 6 | 0.3 | EAINT-12019-REQ-006 | Added | Draft requirement at version 0.3 |
| 7 | 0.3 | EAINT-12019-REQ-007 | Added | Draft requirement at version 0.3 |
| 8 | 0.3 | EAINT-12019-REQ-008 | Added | Draft requirement at version 0.3 |
| 9 | 0.3 | EAINT-12019-REQ-009 | Added | Draft requirement at version 0.3 |
| 10 | 0.3 | EAINT-12019-REQ-010 | Added | Draft requirement at version 0.3 |
| 11 | 0.3 | EAINT-12019-REQ-011 | Added | Draft requirement at version 0.3 |
| 12 | 0.3 | EAINT-12019-REQ-012 | Added | Draft requirement at version 0.3 |
| 13 | 0.3 | EAINT-12019-REQ-013 | Added | Draft requirement at version 0.3 |
| 14 | 0.3 | EAINT-12019-REQ-014 | Added | Draft requirement at version 0.3 |
| 15 | 0.3 | EAINT-12019-REQ-015 | Added | Draft requirement at version 0.3 |
| 16 | 0.3 | EAINT-12019-REQ-016 | Added | Draft requirement at version 0.3 |
| 17 | 0.3 | EAINT-12019-REQ-017 | Added | Draft requirement at version 0.3 |
| 18 | 0.3 | EAINT-12019-REQ-018 | Added | Draft requirement at version 0.3 |
| 19 | 0.3 | EAINT-12019-REQ-019 | Added | Draft requirement at version 0.3 |
| 20 | 0.3 | EAINT-12019-REQ-020 | Added | Draft requirement at version 0.3 |
| 21 | 0.3 | EAINT-12019-REQ-021 | Added | Draft requirement at version 0.3 |
| 22 | 0.3 | EAINT-12019-REQ-022 | Added | Draft requirement at version 0.3 |
| 23 | 0.3 | EAINT-12019-REQ-023 | Added | Draft requirement at version 0.3 |
| 24 | 0.3 | EAINT-12019-REQ-024 | Added | Draft requirement at version 0.3 |
| 25 | 0.3 | EAINT-12019-REQ-025 | Added | Draft requirement at version 0.3 |
| 26 | 0.3 | EAINT-12019-REQ-026 | Added | Draft requirement at version 0.3 |
| 27 | 0.3 | EAINT-12019-REQ-027 | Added | Draft requirement at version 0.3 |
| 28 | 0.3 | EAINT-12019-REQ-028 | Added | Draft requirement at version 0.3 |
| 29 | 0.3 | EAINT-12019-REQ-029 | Added | Draft requirement at version 0.3 |
| 30 | 0.3 | EAINT-12019-REQ-030 | Added | Draft requirement at version 0.3 |
| 31 | 0.3 | EAINT-12019-REQ-031 | Added | Draft requirement at version 0.3 |
| 32 | 0.3 | EAINT-12019-REQ-032 | Added | Draft requirement at version 0.3 |
| 33 | 0.3 | EAINT-12019-REQ-033 | Added | Draft requirement at version 0.3 |
| 34 | 0.3 | EAINT-12019-REQ-034 | Added | Draft requirement at version 0.3 |
| 35 | 0.3 | EAINT-12019-REQ-035 | Added | Draft requirement at version 0.3 |
| 36 | 0.3 | EAINT-12019-REQ-036 | Added | Draft requirement at version 0.3 |
| 37 | 0.3 | EAINT-12019-REQ-037 | Added | Draft requirement at version 0.3 |
| 38 | 0.3 | EAINT-12019-REQ-038 | Added | Draft requirement at version 0.3 |
| 39 | 0.3 | EAINT-12019-REQ-039 | Added | Draft requirement at version 0.3 |
| 40 | 0.3 | EAINT-12019-REQ-040 | Added | Draft requirement at version 0.3 |
| 41 | 0.3 | EAINT-12019-REQ-041 | Added | Draft requirement at version 0.3 |
| 42 | 0.3 | EAINT-12019-REQ-042 | Added | Draft requirement at version 0.3 |
| 43 | 0.3 | EAINT-12019-REQ-043 | Added | Draft requirement at version 0.3 |
| 44 | 0.3 | EAINT-12019-REQ-044 | Added | Draft requirement at version 0.3 |
| 45 | 0.3 | EAINT-12019-REQ-045 | Added | Draft requirement at version 0.3 |
| 46 | 0.3 | EAINT-12019-REQ-046 | Added | Draft requirement at version 0.3 |
| 47 | 0.3 | EAINT-12019-REQ-047 | Added | Draft requirement at version 0.3 |
| 48 | 0.3 | EAINT-12019-REQ-048 | Added | Draft requirement at version 0.3 |
| 49 | 0.3 | EAINT-12019-REQ-049 | Added | Draft requirement at version 0.3 |
| 50 | 0.3 | EAINT-12019-REQ-050 | Added | Draft requirement at version 0.3 |
| 51 | 0.3 | EAINT-12019-REQ-051 | Added | Draft requirement at version 0.3 |
| 52 | 0.3 | EAINT-12019-REQ-052 | Added | Draft requirement at version 0.3 |
| 53 | 0.3 | EAINT-12019-REQ-053 | Added | Draft requirement at version 0.3 |
| 54 | 0.3 | EAINT-12019-REQ-054 | Added | Draft requirement at version 0.3 |
| 55 | 0.3 | EAINT-12019-REQ-055 | Added | Draft requirement at version 0.3 |
| 56 | 0.3 | EAINT-12019-REQ-056 | Added | Draft requirement at version 0.3 |
| 57 | 0.3 | EAINT-12019-REQ-057 | Added | Draft requirement at version 0.3 |
| 58 | 0.3 | EAINT-12019-REQ-058 | Added | Draft requirement at version 0.3 |
| 59 | 0.3 | EAINT-12019-REQ-059 | Added | Draft requirement at version 0.3 |
| 60 | 0.3 | EAINT-12019-REQ-060 | Added | Draft requirement at version 0.3 |
| 61 | 0.3 | EAINT-12019-REQ-061 | Added | Draft requirement at version 0.3 |
| 62 | 0.3 | EAINT-12019-REQ-062 | Added | Draft requirement at version 0.3 |
| 63 | 0.3 | EAINT-12019-REQ-063 | Added | Draft requirement at version 0.3 |
| 64 | 0.3 | EAINT-12019-REQ-064 | Added | Draft requirement at version 0.3 |
| 65 | 0.3 | EAINT-12019-REQ-065 | Added | Draft requirement at version 0.3 |
| 66 | 0.3 | EAINT-12019-REQ-066 | Added | Draft requirement at version 0.3 |
| 67 | 0.3 | EAINT-12019-REQ-067 | Added | Draft requirement at version 0.3 |
| 68 | 0.3 | EAINT-12019-REQ-068 | Added | Draft requirement at version 0.3 |
| 69 | 0.3 | EAINT-12019-REQ-069 | Added | Draft requirement at version 0.3 |
| 70 | 0.3 | EAINT-12019-REQ-070 | Added | Draft requirement at version 0.3 |
| 71 | 0.3 | EAINT-12019-REQ-071 | Added | Draft requirement at version 0.3 |
| 72 | 0.3 | EAINT-12019-REQ-072 | Added | Draft requirement at version 0.3 |
