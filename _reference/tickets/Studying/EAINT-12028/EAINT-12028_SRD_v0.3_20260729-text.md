# EAINT-12028_SRD_v0.3_20260729.docx — text copy (28/10/2026, 11:17:54 am)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-BackOffice] New Module - Association Payment Listing (Automate Association / Vendor Payment Requests) |
| Version | Version 0.3 |
| Latest Revision Date | 29.07.2026 (Wednesday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 23.07.2026 (Thurs) | Chee Mei Jia | Initial Draft |
| 0.2 | 27.07.2026 (Mon) | Chee Mei Jia | Removed Finance-related handling; refined details and renumbered Requirement IDs. |
| 0.3 | 29.07.2026 (Wed) | Chee Mei Jia | Added association charge rates (FMC RM1, MMSDA RM2), the amount calculation, and the FMC & MMSDA Payment Request field mapping (fixed vs flexible values). |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | FMC / FMCCAM | Association / vendor that receives payment for approved car transactions |
| 2 | MMSDA | Association / vendor that receives payment for approved motorcycle transactions |
| 3 | KIV | Keep In View — an item placed on hold pending recheck |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12028 — New Module: Association Payment Listing | https://mfservices.atlassian.net/browse/EAINT-12028 | Main enhancement ticket for this SRD |
| 2 | EAUTO-977 — Finance payment request module | https://mfservices.atlassian.net/browse/EAUTO-977 | Source enhancement request |
| 3 | CCB-848 — EAUTO / Finance payment request module | https://mfservices.atlassian.net/browse/CCB-848 | Change Control Board ticket |
| 4 | Payment Request to Association Automation (slide deck) | Attachment in EAUTO-977 | Business requirement slide deck (sourced from EAUTO-977) |
| 5 | Association Payment Listing UI mockup | HTML mockup | UI / workflow reference for this enhancement |
| 6 | Sample Associations Payment Requisition (Excel) | Attachment in EAINT-12028 | Source of the FMC / MMSDA requisition field values |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Introduce a new BackOffice module, Association Payment Listing, that automates association / vendor payment requests. The system records entries, produces a monthly summary listing and state-level details for the Ops team, and routes each month through a Drafter → Reviewer → Approver workflow with on-screen e-signature. |
| 2.1.2 | Key Value(s) Expected | Eliminates manual Excel compilation and cross-division effort; provides proper entry records and summary listings; digitalises the approval workflow with e-signature and audit trail; improves tracking and turnaround. |
| 2.1.3 | Additional Note(s) | Phase 1 covers Car and Motorcycle only. JomCheck is deferred to a later phase (liaised with Nurul on 23.07.2026). |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | The approval sequence is fixed: Drafter → Reviewer → Approver. |
| 2 | The acting role is determined by the logged-in user ID (not selected manually). |
| 3 | Each role signs once; the signature is stored and reused for all future approvals. |
| 4 | Payment amounts are derived from the count of approved STMS, eSTM and APT transactions. |
| 5 | Only a future date may be selected as the Finance payment date. |
| 6 | Payment Request documents are generated only after all 3 roles have approved. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | JomCheck payment listing and payment request | Deferred to a later phase (liaised with Nurul on 23.07.2026); Phase 1 covers Car and Motorcycle only |
| 2 | Actual disbursement / payment execution | Handled outside this module via the existing finance payment process |
| 3 | Vendor bank account master data maintenance | Not part of this enhancement |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | BackOffice |
| 3 | Module | New Module: Association Payment Listing |
| 4 | Request | Automate association / vendor payment requests with entry records, a monthly summary listing, an approval workflow, and payment request generation. |
| 5 | Additional Note | Phase 1: Car and Motorcycle only; JomCheck deferred. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | Ops manually exports approved STMS, eSTM and APT transactions, compiles them in Excel by vehicle and state, and reports the figures. The process is manual, cross-division and time-consuming, with no entry records or summary listing. |
| 2 | Expected New Handling / Behaviour | The system auto-calculates the monthly amounts by vehicle type and state and presents them to the Ops team as a summary listing with state-level details. Each month is approved through the Drafter → Reviewer → Approver workflow with e-signature, and the Approver records the Finance payment date. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice Home — Reports menu | New menu item "Association Payment Listing" added under Reports. |
| 2 | Association Payment Listing — Summary | Monthly summary listing per year with amounts, workflow statuses and payment date. |
| 3 | Association Payment Listing — Details | Monthly state-level breakdown (Cars and Motorcycles), approval workflow, audit log and payment request download. |

### 2.2.4 Reports Menu — New Entry

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-001 | New menu item | Add "Association Payment Listing" under the Reports section of the BackOffice home page. | The item appears under Reports; clicking it navigates to the Association Payment Listing summary page. |

### 2.2.5 Summary Listing

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-002 | Year filter + Search | Provide a Year filter (available years start from 2026) and a Search button. Only Year is required as a filter. ⏎ Button Name: Search ⏎ Button Function: Click to search and display the listing records for the selected year | Example 1: Year filter set to 2026, click "Search" ⏎ → The listing displays the records for year 2026. |
| 2 | EAINT-12028-REQ-003 | Role by user ID | The acting workflow role is determined automatically from the logged-in user ID (no manual role selector). Mapping: ⏎ 1. Drafter: eautozara, mfared, mfizni ⏎ 2. Reviewer: eautonurul, mfizni ⏎ 3. Approver: kmcheah, mfizni ⏎ A user may hold more than one role (e.g. mfizni). | The available workflow actions are based on the user's mapped role(s); a user not mapped to any role cannot perform Drafter / Reviewer / Approver actions. |
| 3 | EAINT-12028-REQ-004 | Monthly rows & amounts | List all 12 months with Cars (RM) and Motorcycles (RM) amounts by month; months with no data show "No data". | Each month shows its Car and Motorcycle totals; a year-to-date / full-year total row is displayed. |
| 4 | EAINT-12028-REQ-005 | Workflow status columns | Show Drafter Status, Reviewer Status and Approver Status columns reflecting each approval stage. | Each status column shows one of the following values: ⏎ 1. Drafter Status ⏎ 1. Pending ⏎ 2. Approved ⏎ 3. KIV ⏎ 4. Review Again ⏎ 2. Reviewer Status ⏎ 1. Pending ⏎ 2. Approved ⏎ 3. Review Again ⏎ 3. Approver Status ⏎ 1. Pending ⏎ 2. Approved ⏎ (All three statuses start as Pending.) |
| 5 | EAINT-12028-REQ-006 | Finance Payment Date column | Show the Finance payment date selected by the Approver, in DD-MM-YYYY format; display "-" when not yet set. | Example 1: Approver has approved with a Finance payment date ⏎ → Column shows the date in DD-MM-YYYY format, e.g. 31-07-2026. ⏎ Example 2: Not yet approved by Approver ⏎ → Column shows "-". |
| 6 | EAINT-12028-REQ-007 | View action | Provide a View link per month. | Clicking View opens the details page for that month. |

### 2.2.6 Details — Vehicle Breakdown

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-008 | State-level breakdown | Show a single combined table by state with two amount columns — Cars (RM) and Motorcycles (RM) — plus a TOTAL row. The 16 states shown are: ⏎ 1. Johor (01) ⏎ 2. Kedah (02) ⏎ 3. Kelantan (03) ⏎ 4. Melaka (04) ⏎ 5. Negeri Sembilan (05) ⏎ 6. Pahang (06) ⏎ 7. Pulau Pinang (07) ⏎ 8. Perak (08) ⏎ 9. Perlis (09) ⏎ 10. Selangor (10) ⏎ 11. Terengganu (11) ⏎ 12. Sabah (12) ⏎ 13. Sarawak (13) ⏎ 14. W.P. Kuala Lumpur (14) ⏎ 15. W.P. Labuan (15) ⏎ 16. W.P. Putrajaya (16) ⏎ Amount per state = count of approved STMS / eSTM / APT transactions for that state × the association rate. | All 16 states are listed with a TOTAL row. ⏎ Amounts are displayed in #,##0.00 format (2 decimal places, comma as thousands separator). Example: 38,785.00 ⏎ Car and Motorcycle values are shown separately and not combined. ⏎ Association charge rates: ⏎ 1. FMC (Car) = RM1.00 per approved transaction ⏎ 2. MMSDA (Motorcycle) = RM2.00 per approved transaction ⏎ Example: 38,785 approved car transactions × RM1.00 = RM38,785.00. ⏎ Example: 1,456 approved motorcycle transactions × RM2.00 = RM2,912.00. |

### 2.2.7 Approval Workflow & E-Signature

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-009 | Sequential approval | Enforce the sequence Drafter → Reviewer → Approver. A role can act only after the previous role has approved. | Action buttons are disabled with a waiting note until the previous step is approved. |
| 2 | EAINT-12028-REQ-010 | Drafter action | Drafter reviews the amount and clicks Approve or KIV. | Example 1: Amount is correct ⏎ → Drafter clicks Approve; Drafter Status = Approved. ⏎ Example 2: Amount is not correct ⏎ → Drafter clicks KIV; Drafter Status = KIV. |
| 3 | EAINT-12028-REQ-011 | Reviewer action | Reviewer reviews the amount and clicks Approve or Reject (remarks mandatory on Reject). | Example 1: Amount is correct ⏎ → Reviewer clicks Approve; Reviewer Status = Approved. ⏎ Example 2: Amount is not correct ⏎ → Reviewer clicks Reject with remarks; returns to Drafter, Drafter Status = Review Again. |
| 4 | EAINT-12028-REQ-012 | Approver action | Approver reviews the amount and clicks Approve or Reject (remarks mandatory on Reject). | Example 1: Amount is correct ⏎ → Approver clicks Approve; proceeds to payment date entry. ⏎ Example 2: Amount is not correct ⏎ → Approver clicks Reject with remarks; returns to Reviewer, Reviewer Status = Review Again. |
| 5 | EAINT-12028-REQ-013 | Finance Payment Date on Approve | When the Approver approves, prompt a date picker to capture the Finance payment date (mandatory, future date only). The date can ONLY be chosen from the on-screen date picker — manual typing, pasting or any other input into the field is not allowed. | Example 1: Future date selected from the date picker ⏎ → Date is saved and shown as the Finance payment date. ⏎ Example 2: Empty or past date ⏎ → Rejected with a validation message; approval is not completed. ⏎ Example 3: User attempts to type or paste a date ⏎ → Input is blocked; only date-picker selection is accepted. |
| 6 | EAINT-12028-REQ-014 | On-screen e-signature | Capture an on-screen signature on a role's first approval; store and reuse it for future approvals. | Example 1: First approval by the role ⏎ → Signature pad is shown; the signature is captured and stored. ⏎ Example 2: Subsequent approvals ⏎ → The stored signature is reused; the pad is not shown again. |

### 2.2.8 Audit Log

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-015 | Approval audit trail | Record the date/time, role, action/status and remarks for every workflow update on the month, shown on the details page. | Example 1: Drafter Approve ⏎ → Log "Drafter — Approved" with date/time and signature. ⏎ Example 2: Drafter KIV ⏎ → Log "Drafter — KIV" with date/time. ⏎ Example 3: Reviewer Approve ⏎ → Log "Reviewer — Approved" with date/time and signature. ⏎ Example 4: Reviewer Reject ⏎ → Log "Reviewer — Rejected (returned to Drafter)" with remarks. ⏎ Example 5: Approver Approve ⏎ → Log "Approver — Approved" with date/time, signature and the Finance payment date. ⏎ Example 6: Approver Reject ⏎ → Log "Approver — Rejected (returned to Reviewer)" with remarks. ⏎ Example 7: Signature capture record ⏎ → On a role's first approval the captured signature is recorded against that approval entry (stored for reference; not displayed as an image in the log). |

### 2.2.9 Payment Request Generation

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12028-REQ-016 | Download availability | Payment Request documents (FMC for Car, MMSDA for Motorcycle) can be downloaded from the details page once the month is fully approved (Drafter + Reviewer + Approver). | Example 1: Month fully approved (Drafter + Reviewer + Approver) ⏎ → The FMC and MMSDA payment request download buttons are available. ⏎ Example 2: Not fully approved ⏎ → The buttons are hidden and a pending note is shown: ⏎ "Payment Request documents will be available for download once the Drafter, Reviewer and Approver have all approved." ⏎ File name format: ⏎ Payment Requisition_<Association>_<Month> <Year>.pdf ⏎ Example: Payment Requisition_FMC_January 2026.pdf |
| 2 | EAINT-12028-REQ-017 | Document format | Generate the Payment Request following the Online Payment Requisition format: company header, To / Attn / Adds, Date / Requestor, Reason for Payment, Pay to, Amount Payable (figures and words), and Prepared / Checked / Approved by. | The generated document matches the required format; the amount in words matches the amount in figures. |

### 2.2.10 Payment Request Document — Field Mapping (FMC) [REQ-018]
Requirement ID: EAINT-12028-REQ-018 — Field-by-field mapping of the FMC Online Payment Requisition, indicating which values are Fixed and which are Flexible (retrieved by the system). Based on the sample requisition (FMC).

| # | Field | Type | Value / Source & Format |
| 1 | Company header (name & address) | Fixed | eAuto Sdn. Bhd. 200401038456 (676967-T); Level 15, Sunway Tower; 86, Jalan Ampang; 50450 Kuala Lumpur |
| 2 | Document title | Fixed | ONLINE PAYMENT REQUISITION |
| 3 | To | Fixed | Finance @ eAuto Sdn Bhd |
| 4 | Attn | Fixed | Marie Ann (to be confirmed with Marie) |
| 5 | Adds | Fixed | Level 15, Sunway Tower; 86, Jalan Ampang; 50450 Kuala Lumpur |
| 6 | Date | Flexible | Approver's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 7 | Requestor | Flexible | Full name of the Drafter who approved |
| 8 | Reason for Payment (line 1) | Fixed | eAUTO PAYMENT TO FMCCAM |
| 9 | Reason for Payment (line 2 — Month Year) | Flexible | The record month, English short form. Format: MON YYYY (e.g. JUN 2026) |
| 10 | Pay to — Account Holder Name | Fixed | FED OF MOTOR & CREDIT COMPANIES ASSO MSI (PPM-001-14-11041979) |
| 11 | Pay to — Bank Name | Fixed | Alliance Bank Malaysia Berhad |
| 12 | Pay to — Bank Account No. | Fixed | 1404-6001-0016-661 |
| 13 | Pay to — Person in charge | Fixed | Lai Wooi Ping |
| 14 | Pay to — Contact Number | Fixed | 03-9200 6880 / 012-4801052 |
| 15 | Pay to — Email Address | Fixed | cpanet@gmail.com |
| 16 | Amount Payable | Flexible | Display the amount from the report for that month. Format: XX,XXX.00 (figures) plus the amount in words |
| 17 | Prepared by | Flexible | Drafter's signature + full name + Drafter's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 18 | Checked by | Flexible | Reviewer's signature + full name + Reviewer's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 19 | Approved by | Flexible | Approver's signature + full name + Approver's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |

### 2.2.11 Payment Request Document — Field Mapping (MMSDA) [REQ-019]
Requirement ID: EAINT-12028-REQ-019 — Field-by-field mapping of the MMSDA Online Payment Requisition, indicating which values are Fixed and which are Flexible (retrieved by the system). Based on the sample requisition (MMSDA).

| # | Field | Type | Value / Source & Format |
| 1 | Company header (name & address) | Fixed | eAuto Sdn. Bhd. 200401038456 (676967-T); Level 15, Sunway Tower; 86, Jalan Ampang; 50450 Kuala Lumpur |
| 2 | Document title | Fixed | ONLINE PAYMENT REQUISITION |
| 3 | To | Fixed | Finance @ eAuto Sdn Bhd |
| 4 | Attn | Fixed | Marie Ann (to be confirmed with Marie) |
| 5 | Adds | Fixed | Level 15, Sunway Tower; 86, Jalan Ampang; 50450 Kuala Lumpur |
| 6 | Date | Flexible | Approver's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 7 | Requestor | Flexible | Full name of the Drafter who approved |
| 8 | Reason for Payment (line 1) | Fixed | eAUTO PAYMENT TO MMSDA |
| 9 | Reason for Payment (line 2 — Month Year) | Flexible | The record month, English short form. Format: MON YYYY (e.g. MAY 2026) |
| 10 | Pay to — Account Holder Name | Fixed | MALAYSIA MOTORCYCLE & SCOOTER DEALERS ASSOCIATION (MMSDA) |
| 11 | Pay to — Bank Name | Fixed | PBB |
| 12 | Pay to — Bank Account No. | Fixed | 308-208-810-3 |
| 13 | Pay to — Person in charge | Fixed | Wee Hong (President) |
| 14 | Pay to — Contact Number | Fixed | 603 9285 6666 |
| 15 | Pay to — Email Address | Fixed | mmsda.kl@gmail.com |
| 16 | Amount Payable | Flexible | Display the amount from the report for that month. Format: XX,XXX.00 (figures) plus the amount in words |
| 17 | Prepared by | Flexible | Drafter's signature + full name + Drafter's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 18 | Checked by | Flexible | Reviewer's signature + full name + Reviewer's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |
| 19 | Approved by | Flexible | Approver's signature + full name + Approver's approved date. Format: DD-MM-YYYY (e.g. 29-07-2026) |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12028-REQ-001 | Added | New menu entry under Reports |
| 2 | 0.1 | EAINT-12028-REQ-002 | Added | Summary year filter and search |
| 3 | 0.1 | EAINT-12028-REQ-003 | Added | Role determined by user ID |
| 4 | 0.1 | EAINT-12028-REQ-004 | Added | Monthly Car and Motorcycle amounts |
| 5 | 0.1 | EAINT-12028-REQ-005 | Added | Drafter/Reviewer/Approver status columns |
| 6 | 0.1 | EAINT-12028-REQ-006 | Added | Approver Finance payment date column |
| 7 | 0.1 | EAINT-12028-REQ-007 | Added | View link to month details |
| 8 | 0.3 | EAINT-12028-REQ-008 | Added | State breakdown + amount calculation (rates) |
| 9 | 0.1 | EAINT-12028-REQ-009 | Added | Enforce Drafter to Approver sequence |
| 10 | 0.1 | EAINT-12028-REQ-010 | Added | Drafter Approve or KIV |
| 11 | 0.1 | EAINT-12028-REQ-011 | Added | Reviewer Approve or Reject |
| 12 | 0.1 | EAINT-12028-REQ-012 | Added | Approver Approve or Reject |
| 13 | 0.1 | EAINT-12028-REQ-013 | Added | Date-picker-only future Finance payment date |
| 14 | 0.1 | EAINT-12028-REQ-014 | Added | First-time e-signature capture |
| 15 | 0.1 | EAINT-12028-REQ-015 | Added | Audit log of approvals |
| 16 | 0.2 | EAINT-12028-REQ-016 | Added | Payment request download when approved |
| 17 | 0.2 | EAINT-12028-REQ-017 | Added | Online Payment Requisition format |
| 18 | 0.3 | EAINT-12028-REQ-018 | Added | FMC Payment Request field mapping (fixed vs flexible) |
| 19 | 0.3 | EAINT-12028-REQ-019 | Added | MMSDA Payment Request field mapping (fixed vs flexible) |
