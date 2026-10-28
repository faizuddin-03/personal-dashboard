# SRD_EAINT-12348_v0.2_20260928.docx — text copy (27/10/2026, 5:13:24 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users |
| Version | Version 0.2 |
| Latest Revision Date | 28.09.2026 (Monday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 18.09.2026 (Fri) | Chee Mei Jia | Initial Draft |
| 0.2 | 28.09.2026 (Mon) | Chee Mei Jia | a. Updated Section 2.1 and Section 2.2 ⏎ b. Replaced Section 2.2.4 to Section 2.2.8 ⏎ c. Updated Section 1.5 Associated Document(s) |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | PBT | Pihak Berkuasa Tempatan, the local authority organisation in Malaysia. |
| 2 | AATF | Authorised Automotive Treatment Facility, a facility licensed to treat end-of-life vehicles. |
| 3 | eDereg | Electronic deregistration service used to deregister a vehicle. |
| 4 | KPKT | Kementerian Pembangunan Kerajaan Tempatan, the reference source for the PBT master list. |
| 5 | DOE | Department of Environment, the reference source for the licensed AATF listing. |
| 6 | COD | Certificate of Destruction issued after a vehicle is destroyed. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12348 — [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/EAINT-12348 | Internal IT ticket |
| 2 | EAUTO-1058 — Enhancement for eDereg Module for PBT | https://mfservices.atlassian.net/browse/EAUTO-1058 | Source ticket |
| 3 | CCB-956 — EAUTO / To Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/CCB-956 | Cross-department ticket |
| 4 | PBT listing published by KPKT | https://pbtpay.kpkt.gov.my/pbt | Reference source for the PBT master list |
| 5 | Licensed AATF listing published by DOE | https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ | Reference source for the licensed AATF listing |
| 6 | EAINT-12348_eAuto_PBT Portal_20260927 | https://claude.ai/artifact/PdzbmthydcG9b3fNpERCZ4 | Screen mockup for the PBT portal |
| 7 | EAINT-12348_eAuto_BackOffice Portal_20260927 | https://claude.ai/artifact/U24ULKVbcj6yxiJaWkNXmF | Screen mockup for the BackOffice portal |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 1 | Enhancement Overview | A PBT organisation is currently a reference record only. It is selected by an AATF user during deregistration and cannot log in to eDereg. ⏎ Extend a PBT organisation to an eDereg user that logs in and creates deregistration transactions in the same way as an AATF user. ⏎ The existing AATF operating flow remains unchanged. |
| 2 | Key Value(s) Expected | 1. PBT organisations create deregistration transactions directly instead of going through an AATF. ⏎ 2. PBT transactions are distinguished from AATF transactions by a dedicated running number. ⏎ 3. PBT onboarding is controlled through the BackOffice. |
| 3 | Additional Note(s) | PBT master list is sourced from the KPKT listing and provided by the requestor. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Existing AATF company accounts, deregistration transactions and running number sequence remain unchanged. |
| 2 | A PBT uses the same payment method as an AATF. The PBT creates its own RHB bank account, as confirmed by Operations team. |
| 3 | A PBT follows the same deregistration transaction flow as an AATF unless stated otherwise in this document. |
| 4 | PBT master list is provided by the requestor and maintained by the business team. |
| 5 | A PBT company account is created by an authorised BackOffice user. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | End-to-end UI/UX revamp of the eDereg Portal | Covered under EAINT-12252. |
| 2 | Making eDereg Pre-Checking a compulsory step | Covered under EAINT-9306. |
| 3 | Changes to JPJ integration rules, eDereg fees and payment flow | No change required for this enhancement. |
| 4 | Migration of existing PBT records held under the AATF function | To be confirmed with requestor before development starts. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. AATF Portal ⏎ 2. BackOffice Portal |
| 3 | Module | PBT (eDereg) |
| 4 | Request | Enable a PBT organisation to log in to eDereg and create deregistration transactions in the same way as an AATF organisation. |
| 5 | Additional Note | 1. Business scope is expanding to include PBT users. Existing PBT company type only supports listing of PBT names within the AATF function and cannot create an operational PBT user account. ⏎ 2. PBT master list reference: https://pbtpay.kpkt.gov.my/pbt ⏎ 3. Licensed AATF list reference: https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ ⏎ 4. PBT master list file is attached to this ticket. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Company Type in Manage AATF/PBT Account already provides an AATF option and a PBT option. ⏎ 2. A PBT record is used only as a reference. The AATF user selects the PBT at Step 2 of the deregistration transaction creation flow. ⏎ 3. A PBT is not able to log in to the eDereg Portal and is not able to create a deregistration transaction. ⏎ 4. Deregistration transactions carry a single running number in the format D690000638. ⏎ 5. PBT Shortform is captured as free text when Company Type is PBT. |
| 2 | Expected New Handling / Behaviour | 1. An authorised BackOffice user creates a PBT company account with login access to the eDereg Portal. ⏎ 2. A PBT user logs in and creates deregistration transactions using the same 6 step flow as an AATF user. ⏎ 3. A deregistration transaction created by a PBT user receives a running number in the format PBT0000001. ⏎ 4. The existing AATF running number sequence in the format D690000638 remains unchanged. ⏎ 5. A PBT user views only the deregistration transactions created by that PBT organisation. ⏎ 6. A PBT does not hold a company registration number. PBT Shortform is displayed in place of Company Reg. No. in the PBT Portal. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Manage AATF/PBT Account (Create New) | Company Type = PBT creates an account with login access. |
| 2 | BackOffice — Manage AATF/PBT Account (Update) | PBT company account is maintained, activated and inactivated. |
| 3 | BackOffice — Deregistration Transaction Enquiry | PBT running number and PBT organisation are displayed and searchable. |
| 4 | PBT Portal — Login | A PBT company account logs in to the eDereg Portal. |
| 5 | PBT Portal — Create Deregistration Transaction (Step 2 Vehicle) | PBT Organisation is set from the logged-in PBT account. |
| 6 | PBT Portal — Deregistration Transaction Listing | Only transactions created by the logged-in PBT account are listed. |
| 7 | PBT Portal — Deregistration Transaction Details | PBT details are displayed in place of AATF details. |

### 2.2.4 BackOffice — Manage AATF/PBT Account

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12348-REQ-001 | PBT Account Login Access | Existing: ⏎ A PBT record is saved as a reference only and is not able to log in to the eDereg Portal. ⏎ New Expected: ⏎ Company Type = PBT saves a company account with login access to the eDereg Portal. ⏎ Login ID and Password captured under Director / Owner Details apply to the PBT account. | Example 1: Company Type = PBT saved with an active status ⏎ a. The PBT account logs in to the eDereg Portal successfully. ⏎ Example 2: Company Type = PBT saved with an inactive status ⏎ a. Login is blocked and existing transactions of that account remain unchanged. ⏎ Example 3: Company Type = AATF ⏎ a. Login behaviour remains exactly as before this enhancement. |
| 2 | EAINT-12348-REQ-002 | Organisation Name | Organisation Name is a new mandatory field requested in the source ticket. ⏎ Field definition, placement and its relationship with the existing PBT Shortform field are pending requestor confirmation. ⏎ The licensed AATF master list requested in the source ticket is pending requestor confirmation on its purpose and whether it remains in scope. | Pending requestor confirmation. |
| 3 | EAINT-12348-REQ-003 | BackOffice User Access | Existing: ⏎ Manage AATF/PBT Account is accessed by authorised BackOffice users. ⏎ New Expected: ⏎ The following BackOffice users are granted view and access rights to Manage AATF/PBT Account: ⏎ a. eautonurul ⏎ b. nikmuhamad ⏎ c. mfmeijia | Example 1: Logged in as eautonurul, nikmuhamad or mfmeijia ⏎ a. Manage AATF/PBT Account is displayed and accessible. ⏎ Example 2: Logged in as any other BackOffice user ⏎ a. Access remains as before this enhancement. |
| 4 | EAINT-12348-REQ-004 | Company Type Change After Creation | Existing: ⏎ Company Type is editable on the Update AATF/PBT Company Account page after the account is created. ⏎ New Expected: ⏎ Company Type remains editable after the account is created. | Pending developer advice on whether changing Company Type after creation is to be blocked. |

### 2.2.5 PBT Portal — PBT User Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 5 | EAINT-12348-REQ-005 | PBT User Login | Existing: ⏎ The eDereg Portal is accessed by AATF users only. ⏎ New Expected: ⏎ An active PBT company account logs in to the eDereg Portal using the same login page as an AATF user. ⏎ A logged-in PBT user accesses the eDereg module, including transaction creation, listing and details. | Example 1: Active PBT account with valid credentials ⏎ a. Login succeeds and the eDereg homepage is displayed. ⏎ Example 2: Inactive PBT account ⏎ a. Login is blocked. |
| 6 | EAINT-12348-REQ-006 | PBT Organisation At Step 2 | Existing: ⏎ PBT / Individu is a dropdown at Step 2 of the deregistration transaction creation flow. The AATF user selects the PBT or selects Individu. ⏎ New Expected: ⏎ When the logged-in user is a PBT, PBT Organisation displays that PBT organisation and is not editable. ⏎ When the logged-in user is an AATF, the field remains a dropdown and behaves as before this enhancement. | Example 1: PBT user logged in ⏎ a. PBT Organisation displays the logged-in PBT organisation and cannot be changed. ⏎ Example 2: AATF user logged in ⏎ a. PBT / Individu remains selectable with the existing option list. |
| 7 | EAINT-12348-REQ-007 | Transaction Listing Scope | Existing: ⏎ The deregistration transaction listing returns the transactions of the logged-in AATF company account. ⏎ New Expected: ⏎ The listing returns only the transactions created by the logged-in account. ⏎ A PBT user views only transactions carrying a PBT running number created by that PBT organisation. | Example 1: PBT user logged in ⏎ a. Only transactions created by that PBT organisation are listed. ⏎ Example 2: AATF user logged in ⏎ a. Only transactions created by that AATF organisation are listed. |
| 8 | EAINT-12348-REQ-008 | PBT Details Display | Existing: ⏎ The deregistration transaction details page displays AATF, Company Reg. No., Company Address and Company Contact No. ⏎ New Expected: ⏎ For a transaction created by a PBT user the page displays PBT, PBT Shortform, PBT Address and PBT Contact No. ⏎ A PBT does not hold a company registration number. Company Reg. No. is replaced by PBT Shortform and returns the PBT shortform value. | Example 1: Transaction created by a PBT user ⏎ a. PBT Shortform is displayed in place of Company Reg. No. ⏎ Example 2: Transaction created by an AATF user ⏎ a. Company Reg. No. is displayed as before this enhancement. |

### 2.2.6 Deregistration Transaction Numbering

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 9 | EAINT-12348-REQ-009 | PBT Running Number | Existing: ⏎ All deregistration transactions carry a single running number in the format D690000638. ⏎ New Expected: ⏎ A transaction created by a PBT user receives a running number in the format PBT followed by a 7 digit running number, starting from PBT0000001. | Example 1: First transaction created by a PBT user ⏎ a. Transaction reference is PBT0000001. ⏎ Example 2: Subsequent transactions created by a PBT user ⏎ a. Transaction references run in sequence as PBT0000002, PBT0000003 and onward. |
| 10 | EAINT-12348-REQ-010 | AATF Running Number | Existing: ⏎ AATF transactions carry a running number in the format D followed by a 9 digit running number. ⏎ New Expected: ⏎ The AATF running number sequence continues without reset or change. | An AATF transaction created after this enhancement continues the existing D690000638 sequence. |
| 11 | EAINT-12348-REQ-011 | Reference Display And Search | Existing: ⏎ The transaction reference is displayed in the transaction listing and transaction details and is searchable by Transaction No. ⏎ New Expected: ⏎ A PBT running number is displayed and searchable in the same fields in both the PBT Portal and the BackOffice Portal. | Example 1: Search by a PBT reference number ⏎ a. The matching transaction is returned in the listing. ⏎ Example 2: Search by an AATF reference number ⏎ a. The matching transaction is returned as before this enhancement. |

### 2.2.7 BackOffice — Deregistration Transaction Enquiry

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 12 | EAINT-12348-REQ-012 | PBT Transaction Enquiry | Existing: ⏎ The enquiry page provides a PBT filter that returns transactions where the AATF user selected that PBT at Step 2. ⏎ Category Type provides All, Individu and PBT. ⏎ New Expected: ⏎ The PBT filter also returns transactions created by a PBT user. ⏎ Category Type distinguishes a transaction where the PBT was selected by an AATF user from a transaction created by a PBT user. | Category Type option labels are pending requestor confirmation. |

### 2.2.8 Certificate of Destruction

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 13 | EAINT-12348-REQ-013 | Certificate Of Destruction | The deregistration transaction details page holds a COD document button, an Authorised Representative (Uploaded COD) block covering Name, MyKad No, Mobile No, Vehicle Destruction Date and COD Uploaded on, and a JPJ COD Submission entry. ⏎ The COD flow for a PBT user is pending requestor confirmation. | Pending requestor confirmation. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.2 | EAINT-12348-REQ-001 | Added | PBT account with login access to the eDereg Portal |
| 2 | 0.2 | EAINT-12348-REQ-002 | Added | Organisation Name pending requestor confirmation |
| 3 | 0.2 | EAINT-12348-REQ-003 | Added | BackOffice user access to Manage AATF/PBT Account |
| 4 | 0.2 | EAINT-12348-REQ-004 | Added | Company Type change after account creation |
| 5 | 0.2 | EAINT-12348-REQ-005 | Added | PBT user login to the eDereg Portal |
| 6 | 0.2 | EAINT-12348-REQ-006 | Added | PBT Organisation set from the logged-in PBT account |
| 7 | 0.2 | EAINT-12348-REQ-007 | Added | Transaction listing scoped to the logged-in account |
| 8 | 0.2 | EAINT-12348-REQ-008 | Added | PBT details displayed in place of AATF details |
| 9 | 0.2 | EAINT-12348-REQ-009 | Added | Dedicated PBT running number |
| 10 | 0.2 | EAINT-12348-REQ-010 | Added | AATF running number remains unchanged |
| 11 | 0.2 | EAINT-12348-REQ-011 | Added | PBT reference display and search |
| 12 | 0.2 | EAINT-12348-REQ-012 | Added | PBT transaction enquiry in the BackOffice Portal |
| 13 | 0.2 | EAINT-12348-REQ-013 | Added | Certificate of Destruction pending requestor confirmation |
