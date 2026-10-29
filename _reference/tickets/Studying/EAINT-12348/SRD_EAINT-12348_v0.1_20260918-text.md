# SRD_EAINT-12348_v0.1_20260918.docx — text copy (27/10/2026, 5:13:23 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users |
| Version | Version 0.1 |
| Latest Revision Date | 18.09.2026 (Friday) |

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

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | PBT | Pihak Berkuasa Tempatan, the local authority organisation in Malaysia. |
| 2 | AATF | Authorised Automotive Treatment Facility, a facility licensed to treat end-of-life vehicles. |
| 3 | eDereg | Electronic deregistration service used to deregister a vehicle. |
| 4 | KPKT | Kementerian Pembangunan Kerajaan Tempatan, the reference source for the PBT master list. |
| 5 | DOE | Department of Environment, the reference source for the licensed AATF master list. |
| 6 | Master List | A maintained reference list of organisations that a user selects from when creating a company account. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12348 — [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/EAINT-12348 | Internal IT ticket |
| 2 | EAUTO-1058 — Enhancement for eDereg Module for PBT | https://mfservices.atlassian.net/browse/EAUTO-1058 | Source ticket |
| 3 | CCB-956 — EAUTO / To Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/CCB-956 | Cross-department ticket |
| 4 | PBT listing published by KPKT | https://pbtpay.kpkt.gov.my/pbt | Reference source for the PBT master list |
| 5 | Licensed AATF listing published by DOE | https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ | Reference source for the licensed AATF master list |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Extend eDereg services so that PBT organisations can be registered as active eDereg users with a login-enabled organisation account. ⏎ PBT transactions carry their own running number and PBT users select their organisation from a maintained master list. ⏎ Existing AATF operating flow, accounts and running number sequence remain unchanged. |
| 2.1.2 | Key Value(s) Expected | 1. Business scope of eDereg extended from AATF organisations to PBT organisations. ⏎ 2. PBT onboarding is controlled through the BackOffice instead of manual workaround. ⏎ 3. PBT transactions are clearly distinguished from AATF transactions by a dedicated running number. ⏎ 4. Organisation data accuracy improved because users select from a complete master list instead of free text. |
| 2.1.3 | Additional Note(s) | PBT master list is sourced from KPKT and the licensed AATF master list is sourced from DOE. ⏎ Master list files are attached to the internal ticket for development reference. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Existing AATF company accounts, eDereg transactions and running number sequence remain unchanged. |
| 2 | PBT users follow the same eDereg transaction flow as AATF users unless stated otherwise in this document. |
| 3 | eDereg fees, payment flow and JPJ rules applied to PBT transactions are the same as AATF transactions. |
| 4 | PBT master list and licensed AATF master list are provided and maintained by the business team. |
| 5 | A PBT organisation is onboarded only after the BackOffice user has verified the organisation against the master list. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | End-to-end UI/UX revamp of the eDereg Portal | Covered under EAINT-12252. |
| 2 | Making eDereg Pre-Checking a compulsory step | Covered under EAINT-9306. |
| 3 | Changes to JPJ integration rules, eDereg fees and payment flow | No change required for this enhancement. |
| 4 | Migration of existing PBT names already recorded under the AATF function | To be confirmed with requestor before development starts. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. AATF ⏎ 2. BackOffice |
| 3 | Module | PBT (eDereg) |
| 4 | Request | Enable PBT organisations to be registered as active eDereg users and to access eDereg services, while preserving the existing AATF operating flow. |
| 5 | Additional Note | 1. Business scope is expanding to include PBT users. Existing PBT company type only supports listing of PBT names within the AATF function and cannot create an operational PBT user account. ⏎ 2. PBT master list reference: https://pbtpay.kpkt.gov.my/pbt ⏎ 3. Licensed AATF list reference: https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ ⏎ 4. PBT master list and licensed AATF list files to be attached to this ticket. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. eDereg login and services are available to AATF users only. ⏎ 2. Selecting Company Type = PBT records a PBT name for use in the AATF function but does not create a PBT account with login access. ⏎ 3. There is no dedicated running number sequence for PBT transactions. ⏎ 4. The account form does not display a complete PBT or licensed AATF organisation list based on the selected Company Type. |
| 2 | Expected New Handling / Behaviour | 1. An authorised BackOffice user is able to create, maintain, activate and deactivate a PBT company account that can log in and use eDereg services. ⏎ 2. Company Type provides at least AATF and PBT options. ⏎ 3. A mandatory Organisation Name dropdown appears after Company Type is selected and loads the matching active master list. ⏎ 4. Company Type = PBT displays only PBT organisations and Company Type = AATF displays only licensed AATF organisations. ⏎ 5. Each PBT eDereg transaction receives a unique sequential reference in the format PBT0000001, PBT0000002 and onward, while the existing AATF running number sequence remains unchanged. ⏎ 6. The system blocks saving without an organisation selection and blocks a duplicate active account for the same organisation. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Manage Company Account (Create) | Company Type gains a PBT option and a new mandatory Organisation Name field driven by Company Type. |
| 2 | BackOffice — Manage Company Account (Update) | PBT company account can be maintained, activated and deactivated. |
| 3 | BackOffice — Manage Company Account (Listing) | PBT company accounts are listed and searchable alongside AATF company accounts. |
| 4 | AATF Portal — Login | A PBT company account is able to log in and access eDereg services. |
| 5 | AATF Portal — eDereg Transaction Creation | A transaction created by a PBT account receives a PBT running number. |
| 6 | AATF Portal — eDereg Transaction Listing & Details | PBT running number is displayed and searchable. |

### 2.2.4 BackOffice — Manage Company Account

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12348-REQ-001 | Company Type Option | Company Type in Manage Company Account provides at least an AATF option and a PBT option. ⏎ Company Type remains a single selection field. | Company Type dropdown displays both AATF and PBT options when creating or updating a company account. |
| 2 | EAINT-12348-REQ-002 | Organisation Name Field | A new mandatory Organisation Name field is added to Manage Company Account. ⏎ The field is displayed only after a Company Type is selected. | Organisation Name field appears once Company Type is selected and is marked as mandatory. |
| 3 | EAINT-12348-REQ-003 | Organisation List by Company Type | Organisation Name loads the active master list that matches the selected Company Type. ⏎ Changing Company Type reloads the Organisation Name list and clears any previous selection. | Example 1: Company Type = PBT ⏎ a. Organisation Name displays only active PBT organisations from the PBT master list. ⏎ Example 2: Company Type = AATF ⏎ a. Organisation Name displays only active licensed AATF organisations from the AATF master list. ⏎ Example 3: Company Type changed after an organisation was selected ⏎ a. Previous selection is cleared and the list reloads for the newly selected Company Type. |
| 4 | EAINT-12348-REQ-004 | Mandatory Organisation Selection | The company account cannot be saved without an Organisation Name selection. | Example 1: Organisation Name selected ⏎ a. Company account is saved successfully. ⏎ Example 2: Organisation Name not selected ⏎ a. Save is blocked and an inline mandatory field message is displayed. |
| 5 | EAINT-12348-REQ-005 | Duplicate Active Account Prevention | The system blocks a second active company account for an organisation that already has one. ⏎ The check applies within the same Company Type. | Example 1: Organisation has no active account ⏎ a. Company account is created successfully. ⏎ Example 2: Organisation already has an active account ⏎ a. Save is blocked and a duplicate organisation message is displayed. ⏎ Example 3: Organisation has an inactive account only ⏎ a. A new active account is allowed to be created. |
| 6 | EAINT-12348-REQ-006 | Account Activation & Deactivation | An authorised BackOffice user is able to activate and deactivate a PBT company account. ⏎ A deactivated PBT account is not able to log in to the eDereg Portal. | Example 1: PBT account set to active ⏎ a. Account is able to log in and access eDereg services. ⏎ Example 2: PBT account set to inactive ⏎ a. Login is blocked and existing transactions of that account remain unchanged. |
| 7 | EAINT-12348-REQ-007 | Organisation Name Field Specification | Organisation Name is a searchable dropdown populated from the master list. ⏎ Free text entry is not allowed; the user selects a value from the list. | Field specification: ⏎ a. Field type: dropdown with search ⏎ b. Source: active master list of the selected Company Type ⏎ c. Min Length: not applicable (selection only) ⏎ d. Max Length: follows master list value ⏎ e. Special Character: Yes, as recorded in the master list ⏎ f. Alphanumeric: Yes ⏎ g. Only Allow English: Yes ⏎ h. Mandatory / Optional: Mandatory ⏎ Specification to be confirmed by requestor before development starts. |

### 2.2.5 Organisation Master List

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 8 | EAINT-12348-REQ-008 | PBT Master List | A master list of PBT organisations across Malaysia is maintained in the system. ⏎ The list holds approximately 154 PBT organisations. | Organisation Name displays the full PBT master list when Company Type = PBT. ⏎ Each PBT organisation appears once in the list. |
| 9 | EAINT-12348-REQ-009 | Licensed AATF Master List | A master list of all licensed AATF organisations across Malaysia is maintained in the system. | Organisation Name displays the full licensed AATF master list when Company Type = AATF. ⏎ Only organisations with an active licence status appear in the list. |
| 10 | EAINT-12348-REQ-010 | Master List Maintenance | Each master list record carries an active or inactive status. ⏎ Only active records are selectable in Manage Company Account. | An inactive master list record is not selectable for a new company account. ⏎ An existing company account already linked to a record that turns inactive is not affected. ⏎ Maintenance screen and ownership of master list updates to be confirmed by requestor. |

### 2.2.6 eDereg Portal — PBT User Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 11 | EAINT-12348-REQ-011 | PBT Account Login | An active PBT company account is able to log in to the eDereg Portal using the same login page as AATF users. | A PBT account with valid credentials logs in successfully and lands on the eDereg homepage. |
| 12 | EAINT-12348-REQ-012 | eDereg Service Access | A logged-in PBT user is able to access eDereg services, including transaction creation, listing and details. ⏎ Existing AATF user access is unchanged. | Example 1: PBT user logged in ⏎ a. eDereg services are accessible and transactions can be created. ⏎ Example 2: AATF user logged in ⏎ a. Existing eDereg services and menu remain exactly as before this enhancement. |
| 13 | EAINT-12348-REQ-013 | Transaction Ownership | An eDereg transaction created by a PBT account is tied to that PBT organisation. ⏎ A PBT user views only its own organisation transactions. | Transaction listing of a PBT account returns only transactions created by that organisation. |

### 2.2.7 eDereg Transaction Numbering

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 14 | EAINT-12348-REQ-014 | PBT Running Number | A dedicated running transaction number is generated for a transaction created by a PBT account. ⏎ Format is PBT followed by a 7-digit running number, starting from PBT0000001. | Example 1: First PBT transaction ⏎ a. Transaction reference is PBT0000001. ⏎ Example 2: Subsequent PBT transactions ⏎ a. Transaction references run in sequence as PBT0000002, PBT0000003 and onward. |
| 15 | EAINT-12348-REQ-015 | AATF Running Number Unchanged | The existing AATF running number sequence continues without reset or change. | An AATF transaction created after this enhancement continues the existing AATF sequence. |
| 16 | EAINT-12348-REQ-016 | Reference Display & Search | PBT running number is displayed in the transaction listing and transaction details. ⏎ PBT running number is searchable in the BackOffice and the eDereg Portal. | Searching a PBT reference number returns the matching transaction in the listing. ⏎ Transaction details display the PBT reference number as the transaction reference. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12348-REQ-001 | Added | Company Type provides a PBT option |
| 2 | 0.1 | EAINT-12348-REQ-002 | Added | New mandatory Organisation Name field |
| 3 | 0.1 | EAINT-12348-REQ-003 | Added | Organisation list driven by Company Type |
| 4 | 0.1 | EAINT-12348-REQ-004 | Added | Mandatory organisation selection before save |
| 5 | 0.1 | EAINT-12348-REQ-005 | Added | Duplicate active account prevention |
| 6 | 0.1 | EAINT-12348-REQ-006 | Added | PBT account activation and deactivation |
| 7 | 0.1 | EAINT-12348-REQ-007 | Added | Organisation Name field specification |
| 8 | 0.1 | EAINT-12348-REQ-008 | Added | PBT master list maintained in system |
| 9 | 0.1 | EAINT-12348-REQ-009 | Added | Licensed AATF master list maintained in system |
| 10 | 0.1 | EAINT-12348-REQ-010 | Added | Master list active and inactive handling |
| 11 | 0.1 | EAINT-12348-REQ-011 | Added | PBT account login to eDereg Portal |
| 12 | 0.1 | EAINT-12348-REQ-012 | Added | PBT access to eDereg services |
| 13 | 0.1 | EAINT-12348-REQ-013 | Added | Transaction ownership by PBT organisation |
| 14 | 0.1 | EAINT-12348-REQ-014 | Added | Dedicated PBT running number |
| 15 | 0.1 | EAINT-12348-REQ-015 | Added | AATF running number remains unchanged |
| 16 | 0.1 | EAINT-12348-REQ-016 | Added | PBT reference display and search |
