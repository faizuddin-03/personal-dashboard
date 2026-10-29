# SRD_EAINT-12348_v0.3_20261007.docx — text copy (27/10/2026, 5:13:25 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users |
| Version | Version 0.3 |
| Latest Revision Date | 07.10.2026 (Wednesday) |

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
| 0.3 | 07.10.2026 (Wed) | Chee Mei Jia | a. Removed Organisation Name and updated Company Type change in Section 2.2.4 ⏎ b. Added Master List Data Import, Mandatory Field Completion and TIN Number in Section 2.2.4 ⏎ c. Added eDereg flow access, PBT filter and JPJ Submission Identifier in Section 2.2.5 ⏎ d. Added PBT Pre-Checking Transaction Number in Section 2.2.6 ⏎ e. Updated Section 1.5, 2.1.2, 2.2.1 and Certificate of Destruction in Section 2.2.8 |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | PBT | Pihak Berkuasa Tempatan, the local authority organisation in Malaysia. |
| 2 | AATF | Authorised Automotive Treatment Facility, a facility licensed to treat end-of-life vehicles. |
| 3 | eDereg | Electronic deregistration service used to deregister a vehicle. |
| 4 | KPKT | Kementerian Pembangunan Kerajaan Tempatan, the reference source for the PBT master list. |
| 5 | DOE | Department of Environment, the reference source for the licensed AATF listing. |
| 6 | COD | Certificate of Destruction issued after a vehicle is destroyed. |
| 7 | MyKad | Malaysian identity card held by a Malaysian citizen. |
| 8 | MyPR | Malaysian identity card held by a permanent resident. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12348 — [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/EAINT-12348 | Internal IT ticket |
| 2 | EAUTO-1058 — Enhancement for eDereg Module for PBT | https://mfservices.atlassian.net/browse/EAUTO-1058 | Source ticket |
| 3 | CCB-956 — EAUTO / To Enable PBT Organisations as Active eDereg Users | https://mfservices.atlassian.net/browse/CCB-956 | Cross-department ticket |
| 4 | PBT listing published by KPKT | https://pbtpay.kpkt.gov.my/pbt | Reference purpose only |
| 5 | Licensed AATF listing published by DOE | https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ | Reference purpose only |
| 6 | Malaysia_PBT_Master_List_eDereg.xlsx | Attached to EAUTO-1058 | Source data for PBT company account import |
| 7 | 20260223-SENARAI-KEMUDAHAN-RAWATAN-AUTOMOTIF-BERLESEN-AATF.pdf | Attached to EAUTO-1058 | Source data for AATF company account import |
| 8 | Mock Up_EAINT-12348_PBT Portal_20261007 | https://claude.ai/artifact/PdzbmthydcG9b3fNpERCZ4 | Screen mockup for the PBT portal |
| 9 | Mock Up_EAINT-12348_BackOffice Portal_20261007 | https://claude.ai/artifact/U24ULKVbcj6yxiJaWkNXmF | Screen mockup for the BackOffice portal |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 1 | Enhancement Overview | A PBT organisation is a reference record only. It is selected by an AATF user during deregistration and cannot log in to eDereg. ⏎ Extend a PBT organisation to an eDereg user that logs in and creates deregistration transactions in the same way as an AATF user. ⏎ The existing AATF operating flow remains unchanged. |
| 2 | Key Value(s) Expected | 1. PBT organisations create deregistration transactions directly instead of going through an AATF. ⏎ 2. PBT transactions are distinguished from AATF transactions by a dedicated running number. ⏎ 3. PBT onboarding is controlled through the BackOffice Portal. |
| 3 | Additional Note(s) | PBT master list is sourced from the KPKT listing and provided by the requestor. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Existing AATF company accounts, deregistration transactions and running number sequence remain unchanged. |
| 2 | A PBT uses the same payment method as an AATF. The PBT creates its own RHB bank account. |
| 3 | A PBT follows the same deregistration transaction flow as an AATF unless stated otherwise in this document. |
| 4 | PBT master list is provided by the requestor and maintained by the business team. |
| 5 | A PBT company account is created by an authorised BackOffice user. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | End-to-end UI/UX revamp of the eDereg Portal | Covered under EAINT-12252. |
| 2 | Changes to JPJ integration rules, eDereg fees and payment flow | No change required for this enhancement. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. AATF Portal ⏎ 2. BackOffice Portal |
| 3 | Module | PBT (eDereg) |
| 4 | Request | Enable a PBT organisation to log in to eDereg and create deregistration transactions in the same way as an AATF organisation. |
| 5 | Additional Note | 1. Business scope is expanding to include PBT users. ⏎ 2. PBT master list reference: https://pbtpay.kpkt.gov.my/pbt ⏎ 3. Licensed AATF list reference: https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ ⏎ 4. The PBT master list and licensed AATF list are imported directly as company accounts, in place of an Organisation Name field and a master list selection on account creation. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Company Type in Manage AATF/PBT Account provides an AATF option and a PBT option. ⏎ 2. A PBT record is used as a reference. The AATF user selects the PBT at Step 2 of the deregistration transaction creation flow. ⏎ 3. A PBT is not able to log in to the eDereg Portal and is not able to create a deregistration transaction. ⏎ 4. Deregistration transactions carry a single running number in the format D690000638. ⏎ 5. PBT Shortform is captured as free text when Company Type is PBT. |
| 2 | Expected New Handling / Behaviour | 1. An authorised BackOffice user creates a PBT company account with login access to the eDereg Portal. ⏎ 2. A PBT user logs in and creates deregistration transactions using the same 6 step flow as an AATF user. ⏎ 3. A deregistration transaction created by a PBT user receives a running number in the format PBT0000001. ⏎ 4. The existing AATF running number sequence in the format D690000638 remains unchanged. ⏎ 5. A PBT user views only the deregistration transactions created by that PBT organisation. ⏎ 6. A PBT does not hold a company registration number. PBT Shortform is displayed in place of Company Reg. No. in the PBT Portal. ⏎ 7. An existing AATF company account is switched to Company Type PBT. Transactions created before the switch keep the D prefix and transactions created after the switch use the PBT prefix. ⏎ 8. PBT master list and licensed AATF list are imported as PBT and AATF company accounts. Mandatory fields with no source data are completed by Operations team before the account is saved. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Manage AATF/PBT Account (Create New) | Company Type = PBT creates an account with login access. |
| 2 | BackOffice — Manage AATF/PBT Account (Update) | PBT company account is maintained, activated and inactivated. |
| 3 | BackOffice — Deregistration Transaction Enquiry | PBT running number and PBT organisation are displayed and searchable. |
| 4 | PBT Portal — Login | A PBT company account logs in to the eDereg Portal. |
| 5 | PBT Portal — Create Deregistration Transaction (Step 2 Vehicle) | PBT Organisation is set from the logged-in PBT account. |
| 6 | PBT Portal — Deregistration Transaction Listing | Only transactions created by the logged-in PBT account are listed. |
| 7 | PBT Portal — Deregistration Transaction Details | PBT details are displayed in place of AATF details. |
| 8 | PBT Portal — Upload Certificate of Destruction (COD) | PBT labels and PBT Shortform are displayed in place of AATF and Company labels. |

### 2.2.4 BackOffice — Manage AATF/PBT Account

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12348-REQ-001 | PBT Account Login Access | Existing: ⏎ A PBT record is saved as a reference and is not able to log in to the eDereg Portal. ⏎ New Expected: ⏎ a. Company Type = PBT saves a company account with login access to the eDereg Portal. ⏎ b. Login ID and Password captured under Director / Owner Details apply to the PBT account. | Example 1: Company Type = PBT saved with an active status ⏎ a. The PBT account logs in to the eDereg Portal successfully. ⏎ Example 2: Company Type = PBT saved with an inactive status ⏎ a. Login is blocked and existing transactions of that account remain unchanged. ⏎ Example 3: Company Type = AATF ⏎ a. Login behaviour remains as before this enhancement. |
| 2 | EAINT-12348-REQ-002 | BackOffice User Access | Existing: ⏎ Manage AATF/PBT Account is accessed by authorised BackOffice users. ⏎ New Expected: ⏎ The following BackOffice users are granted view and access rights to Manage AATF/PBT Account: ⏎ a. eautonurul ⏎ b. nikmuhamad ⏎ c. mfmeijia | Example 1: Logged in as eautonurul, nikmuhamad or mfmeijia ⏎ a. Manage AATF/PBT Account is displayed and accessible. ⏎ Example 2: Logged in as any other BackOffice user ⏎ a. Access remains as before this enhancement. |
| 3 | EAINT-12348-REQ-003 | Company Type Change After Creation | Existing: ⏎ Company Type is editable on the Update AATF/PBT Company Account page after the account is created. ⏎ New Expected: ⏎ a. An existing AATF company account is switched to Company Type PBT. ⏎ b. Deregistration transactions created before the switch keep the running number prefix D. ⏎ c. Deregistration transactions created after the switch use the running number prefix PBT. | Example 1: AATF account switched to PBT, transaction created before the switch ⏎ a. Transaction reference remains in the format D690000638. ⏎ Example 2: AATF account switched to PBT, transaction created after the switch ⏎ a. Transaction reference is issued in the format PBT0000001. ⏎ Example 3: Company Type not changed ⏎ a. Running number behaviour remains as before this enhancement. |
| 4 | EAINT-12348-REQ-004 | Master List Data Import | Existing: ⏎ a. A PBT record held under the AATF function is a reference entry with a PBT Shortform and a PBT name. ⏎ b. No licensed AATF list is held in the system. ⏎ New Expected: ⏎ a. Every record in the PBT master list is imported as a PBT company account. ⏎ b. Every record in the licensed AATF list is imported as an AATF company account. ⏎ c. Existing PBT records held under the AATF function are migrated to PBT company accounts. ⏎ d. A mandatory field with no source data is stored empty on import. ⏎ PBT master list mapping to Create New AATF/PBT Company Account: ⏎ a. Official PBT Name to Company Name ⏎ b. Abbreviation to PBT Shortform ⏎ c. State / Federal Territory to State, matched by state name to the State dropdown value, for example Selangor to SELANGOR (10) ⏎ Company Reg. No. is not mandatory when Company Type is PBT and is stored empty for an imported PBT account. ⏎ Licensed AATF list mapping to Create New AATF/PBT Company Account: ⏎ a. Nama premis to Company Name ⏎ b. Alamat, text before the postcode, to Mailing Address ⏎ c. Alamat, postcode, to Postcode ⏎ d. Alamat, state, to State, matched by state name to the State dropdown value ⏎ e. Alamat, town after the postcode, to City, matched to the City dropdown value ⏎ f. Alamat, Daerah, to District, matched to the District dropdown value ⏎ g. No. telefon to Contact Number, stored as digits only ⏎ A value not stated in Alamat, or with no matching dropdown value, is stored empty. ⏎ A licensed AATF that already holds a company account in production is excluded. Car Medic Sdn Bhd is excluded on this basis. ⏎ An imported account with no Login ID and Password under Director / Owner Details is not able to log in. ⏎ 10 abbreviations are shared by 2 to 4 PBT organisations, for example MDK, MPP and MPS. Extending a shared abbreviation with the distinguishing part of the PBT name, for example MDKerian and MDKeningau, is pending developer confirmation. ⏎ 3 records are marked Review Required: Majlis Daerah Telupid, Majlis Daerah Gedong and Majlis Daerah Sebuyau. Inclusion is pending confirmation. | Example 1: PBT master list imported ⏎ a. 158 PBT company accounts are created. ⏎ b. Company Name, PBT Shortform and State are filled from Official PBT Name, Abbreviation and State / Federal Territory. ⏎ c. Company Reg. No. and other fields with no source data are stored empty. ⏎ Example 2: Licensed AATF list imported ⏎ a. 4 AATF company accounts are created. ⏎ b. Car Medic Sdn Bhd is not imported. ⏎ Example 3: Jaring Metal Industries Sdn Bhd ⏎ a. Mailing Address: No.7&9, Jalan Sungai Kayu Ara 32/37, Taman Perindustrian Berjaya, Seksyen 32 ⏎ b. Postcode: 40460 ⏎ c. State: SELANGOR (10) ⏎ d. City: Shah Alam ⏎ e. District: empty ⏎ f. Contact Number: 0357408823 ⏎ Example 4: Kitaran Recovery Sdn Bhd ⏎ a. Mailing Address: Lot 336613 Mukim Sungai Raya ⏎ b. Postcode: 31300 ⏎ c. State: PERAK (08) ⏎ d. City: empty ⏎ e. District: Kinta ⏎ f. Contact Number: 053577002 ⏎ Example 5: Eco-R Malaysia Sdn Bhd ⏎ a. Mailing Address: Eco-R (Malaysia) Sdn Bhd, No.4A, Jalan Bestari 5/KU7, Taman Perindustrian Kapar Bestari ⏎ b. Postcode: 42200 ⏎ c. State: SELANGOR (10) ⏎ d. City: Kapar ⏎ e. District: empty ⏎ f. Contact Number: 0333598807 ⏎ Example 6: YonMing Euro Used Parts Sdn Bhd ⏎ a. Mailing Address: No.27, Lebuh Perusahaan Klebang 11, Kawasan Perindutrian IGB ⏎ b. Postcode: 31200 ⏎ c. State: PERAK (08) ⏎ d. City: Chemor ⏎ e. District: empty ⏎ f. Contact Number: 052916663 ⏎ Example 7: Imported account with no Login ID and Password ⏎ a. The account is not able to log in until Login ID and Password are filled under Director / Owner Details. ⏎ Example 8: Existing deregistration transaction referencing a migrated PBT ⏎ a. The transaction reference and its PBT reference remain unchanged. |
| 5 | EAINT-12348-REQ-005 | Mandatory Field Completion | Existing: ⏎ Update AATF/PBT Company Account saves when every mandatory field is filled. ⏎ New Expected: ⏎ a. An imported account with an empty mandatory field is saved only after every mandatory field is filled. ⏎ b. Existing mandatory field validation on Update AATF/PBT Company Account applies to imported accounts. | Example 1: Imported account updated with every mandatory field filled ⏎ a. The account is saved. ⏎ Example 2: Imported account updated with a mandatory field still empty ⏎ a. The account is not saved and the empty mandatory field is flagged. ⏎ Example 3: Account not imported ⏎ a. Update behaviour remains as before this enhancement. |
| 6 | EAINT-12348-REQ-006 | TIN Number | Existing: ⏎ Create New and Update AATF/PBT Company Account do not capture a TIN Number. ⏎ New Expected: ⏎ a. TIN Number is added to Company Details on Create New and Update when Company Type is AATF. ⏎ b. TIN Number is an optional free text field, following the TIN Number field on the UCD company account. ⏎ c. TIN Number is not displayed when Company Type is PBT, as a PBT does not hold a TIN Number. | Example 1: Company Type = AATF ⏎ a. TIN Number is displayed and the account saves with or without a value. ⏎ Example 2: Company Type = PBT ⏎ a. TIN Number is not displayed. ⏎ Example 3: Imported AATF account ⏎ a. TIN Number is stored empty and is completed by Operations team on Update. |

### 2.2.5 PBT Portal — PBT User Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 7 | EAINT-12348-REQ-007 | PBT User Login | Existing: ⏎ The eDereg Portal is accessed by AATF users only. ⏎ New Expected: ⏎ a. An active PBT company account logs in to the eDereg Portal using the same login page as an AATF user. ⏎ b. A logged-in PBT user accesses the eDereg module, including transaction creation, listing and details. | Example 1: Active PBT account with valid credentials ⏎ a. Login succeeds and the eDereg homepage is displayed. ⏎ Example 2: Inactive PBT account ⏎ a. Login is blocked. |
| 8 | EAINT-12348-REQ-008 | eDereg Flow Access | Existing: ⏎ eDereg Pre-Checking and Create Deregistration Transaction are available to an AATF user only. ⏎ New Expected: ⏎ A PBT user accesses both flows exactly as an AATF user does: ⏎ a. eDereg Pre-Checking Enquiry: ⏎ i. Step 1 Vehicle ⏎ ii. Step 2 Payment ⏎ iii. Step 3 Result ⏎ b. Create Deregistration Transaction: ⏎ i. Sila Pilih Kategori ID — Orang Awam Malaysia (MyKad) or Penduduk Tetap Malaysia (MyPR) ⏎ ii. Step 1 Owner ⏎ iii. Step 2 Vehicle ⏎ iv. Step 3 PBT ⏎ v. Step 4 JPJ Check ⏎ vi. Step 5 Payment ⏎ vii. Step 6 Deregister | Example 1: PBT user completes eDereg Pre-Checking Enquiry ⏎ a. The Vehicle, Payment and Result steps behave the same as for an AATF user. ⏎ Example 2: PBT user creates a deregistration transaction ⏎ a. The ID category selection and Steps 1 to 6 behave the same as for an AATF user. ⏎ Example 3: AATF user ⏎ a. Both flows remain as before this enhancement. |
| 9 | EAINT-12348-REQ-009 | PBT Organisation At Step 2 | Existing: ⏎ PBT / Individu is a dropdown at Step 2 of the deregistration transaction creation flow. The AATF user selects the PBT or selects Individu. ⏎ New Expected: ⏎ a. When the logged-in user is a PBT, PBT Organisation displays that PBT organisation and is not editable. ⏎ b. When the logged-in user is an AATF, the field remains a dropdown and behaves as before this enhancement. | Example 1: PBT user logged in ⏎ a. PBT Organisation displays the logged-in PBT organisation and cannot be changed. ⏎ Example 2: AATF user logged in ⏎ a. PBT / Individu remains selectable with the existing option list. |
| 10 | EAINT-12348-REQ-010 | Transaction Listing Scope | Existing: ⏎ The deregistration transaction listing returns the transactions of the logged-in AATF company account. ⏎ New Expected: ⏎ a. The listing returns only the transactions created by the logged-in account. ⏎ b. A PBT user views only transactions created by that PBT organisation. ⏎ The PBT filter displays All and INDIVIDU - INDIVIDU by default, followed by the PBT organisations. ⏎ The PBT filter displays only PBT organisations with Company Account Status Activated. | Example 1: PBT user logged in ⏎ a. Only transactions created by that PBT organisation are listed. ⏎ Example 2: AATF user logged in ⏎ a. Only transactions created by that AATF organisation are listed. |
| 11 | EAINT-12348-REQ-011 | PBT Details Display | Existing: ⏎ The deregistration transaction details page displays AATF, Company Reg. No., Company Address and Company Contact No. ⏎ New Expected: ⏎ a. For a transaction created by a PBT user the page displays PBT, PBT Shortform, PBT Address and PBT Contact No. ⏎ b. Company Reg. No. is replaced by PBT Shortform and returns the PBT shortform value. | Example 1: Transaction created by a PBT user ⏎ a. PBT Shortform is displayed in place of Company Reg. No. ⏎ Example 2: Transaction created by an AATF user ⏎ a. Company Reg. No. is displayed as before this enhancement. |
| 12 | EAINT-12348-REQ-012 | JPJ Submission Identifier | Existing: ⏎ JPJ submission sends the AATF Business Registration Number (BRN). ⏎ New Expected: ⏎ a. A PBT does not hold a BRN. JPJ submission for a PBT transaction sends the PBT Shortform in place of the BRN. ⏎ b. Where 2 or more PBT organisations share an abbreviation, the PBT Shortform sent is extended with the distinguishing part of the PBT name. ⏎ Sending the PBT Shortform in place of the BRN, and the extended format, are pending developer confirmation. | Example 1: Transaction created by MBPJ ⏎ a. MBPJ is sent in place of the BRN. ⏎ Example 2: Transaction created by Majlis Daerah Kerian ⏎ a. MDKerian is sent in place of the BRN, as MDK is shared with Majlis Daerah Keningau. ⏎ Example 3: Transaction created by Majlis Daerah Keningau ⏎ a. MDKeningau is sent in place of the BRN. ⏎ Example 4: Transaction created by an AATF user ⏎ a. The AATF BRN is sent as before this enhancement. |

### 2.2.6 Deregistration Transaction Numbering

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 13 | EAINT-12348-REQ-013 | PBT Running Number | Existing: ⏎ All deregistration transactions carry a single running number in the format D690000638. ⏎ New Expected: ⏎ A transaction created by a PBT user receives a running number in the format PBT followed by a 7 digit running number, starting from PBT0000001. | Example 1: First transaction created by a PBT user ⏎ a. Transaction reference is PBT0000001. ⏎ Example 2: Subsequent transactions created by a PBT user ⏎ a. Transaction references run in sequence as PBT0000002, PBT0000003 and onward. |
| 14 | EAINT-12348-REQ-014 | AATF Running Number | Existing: ⏎ AATF transactions carry a running number in the format D followed by a 9 digit running number. ⏎ New Expected: ⏎ The AATF running number sequence continues without reset or change. | An AATF transaction created after this enhancement continues the existing D690000638 sequence. |
| 15 | EAINT-12348-REQ-015 | Reference Display And Search | Existing: ⏎ The transaction reference is displayed in the transaction listing and transaction details and is searchable by Transaction No. ⏎ New Expected: ⏎ A PBT running number is displayed and searchable in the same fields in the PBT Portal and the BackOffice Portal. | Example 1: Search by a PBT reference number ⏎ a. The matching transaction is returned in the listing. ⏎ Example 2: Search by an AATF reference number ⏎ a. The matching transaction is returned as before this enhancement. |
| 16 | EAINT-12348-REQ-016 | PBT Pre-Checking Transaction Number | Existing: ⏎ An eDereg Pre-Checking transaction number is PC followed by year, month and a 6 digit running number, for example PC69001611. ⏎ Year is the last digit of the year. Month is written as: ⏎ a. January to September: 1 to 9 ⏎ b. October: 0 ⏎ c. November: N ⏎ d. December: D ⏎ New Expected: ⏎ a. A pre-checking transaction created by a PBT user uses a separate running number in the format PBTPC followed by year, month and a 6 digit running number, starting from PBTPC69000001. ⏎ b. The PBTPC number uses the same year and month format as the PC number. ⏎ c. A pre-checking transaction created by an AATF user keeps the existing PC format. ⏎ Whether the 13 character PBTPC number fits the fields passed to RHB and JPJ is pending developer confirmation. | Example 1: First pre-checking transaction created by a PBT user ⏎ a. Transaction number is PBTPC69000001. ⏎ Example 2: Pre-checking transaction created by a PBT user in October 2026 ⏎ a. Transaction number begins with PBTPC60. ⏎ Example 3: Pre-checking transaction created by a PBT user in November 2026 ⏎ a. Transaction number begins with PBTPC6N. ⏎ Example 4: Pre-checking transaction created by a PBT user in December 2026 ⏎ a. Transaction number begins with PBTPC6D. ⏎ Example 5: Pre-checking transaction created by an AATF user ⏎ a. Transaction number continues the existing PC sequence, for example PC69001612. |

### 2.2.7 BackOffice — Deregistration Transaction Enquiry

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 17 | EAINT-12348-REQ-017 | PBT Transaction Enquiry | Existing: ⏎ The PBT filter returns transactions where the AATF user selected that PBT at Step 2. ⏎ New Expected: ⏎ a. The PBT filter also returns transactions created by a PBT user. ⏎ b. The PBT filter displays All and INDIVIDU - INDIVIDU by default, followed by the PBT organisations. | Example 1: PBT filter = MBPJ - MAJLIS BANDARAYA PETALING JAYA ⏎ a. Transactions where the AATF user selected MBPJ at Step 2 are returned. ⏎ b. Transactions created by the MBPJ PBT user are returned. ⏎ Example 2: PBT filter = INDIVIDU - INDIVIDU ⏎ a. Transactions where the AATF user selected Individu at Step 2 are returned. ⏎ Example 3: PBT filter = All ⏎ a. Transactions are returned regardless of PBT. |

### 2.2.8 Certificate of Destruction

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 18 | EAINT-12348-REQ-018 | Certificate Of Destruction | Existing: ⏎ An AATF user uploads a Certificate of Destruction (COD) for an approved deregistration transaction through Upload Certificate of Destruction (COD). ⏎ New Expected: ⏎ A PBT user uploads a COD exactly as an AATF user does: ⏎ a. Deregistration Transaction Listing displays Upload COD beside View when Tx Status is Approved and COD is No. ⏎ b. Step 1 PBT displays PBT Authentication with MyKad details and thumbprint verification. ⏎ c. Step 2 Vehicle displays Upload Date & Certificate with Date of Destruction and Upload Certificate, both mandatory. ⏎ d. Step 3 Submit displays COD Submitted with Date of COD, JPJ Decomposition Status and Submission Date/Time. ⏎ e. Company labels display as PBT labels and Company Reg. No. displays as PBT Shortform. ⏎ Step 3 is labelled Submit on every step of Upload Certificate of Destruction (COD). | Example 1: Approved transaction with COD No ⏎ a. Action displays View and Upload COD. ⏎ Example 2: Approved transaction with COD Yes ⏎ a. Action displays View only. ⏎ Example 3: PBT user submits Date of Destruction and certificate ⏎ a. COD Submitted is displayed with JPJ Decomposition Status OK - TRANSACTION SUCCESSFUL. ⏎ b. COD in the listing displays Yes. ⏎ Example 4: AATF user ⏎ a. Upload Certificate of Destruction (COD) remains as before this enhancement. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.3 | EAINT-12348-REQ-001 | Added | PBT account with login access to the eDereg Portal |
| 2 | 0.3 | EAINT-12348-REQ-002 | Added | BackOffice user access to Manage AATF/PBT Account |
| 3 | 0.3 | EAINT-12348-REQ-003 | Added | Company Type change after account creation |
| 4 | 0.3 | EAINT-12348-REQ-004 | Added | PBT master list and licensed AATF list import |
| 5 | 0.3 | EAINT-12348-REQ-005 | Added | Mandatory field completion for imported accounts |
| 6 | 0.3 | EAINT-12348-REQ-006 | Added | TIN Number on the AATF company account |
| 7 | 0.3 | EAINT-12348-REQ-007 | Added | PBT user login to the eDereg Portal |
| 8 | 0.3 | EAINT-12348-REQ-008 | Added | eDereg Pre-Checking and deregistration flow access for a PBT user |
| 9 | 0.3 | EAINT-12348-REQ-009 | Added | PBT Organisation set from the logged-in PBT account |
| 10 | 0.3 | EAINT-12348-REQ-010 | Added | Transaction listing scoped to the logged-in account |
| 11 | 0.3 | EAINT-12348-REQ-011 | Added | PBT details displayed in place of AATF details |
| 12 | 0.3 | EAINT-12348-REQ-012 | Added | PBT Shortform sent to JPJ in place of the BRN |
| 13 | 0.3 | EAINT-12348-REQ-013 | Added | Dedicated PBT running number |
| 14 | 0.3 | EAINT-12348-REQ-014 | Added | AATF running number remains unchanged |
| 15 | 0.3 | EAINT-12348-REQ-015 | Added | PBT reference display and search |
| 16 | 0.3 | EAINT-12348-REQ-016 | Added | Separate pre-checking transaction number for a PBT user |
| 17 | 0.3 | EAINT-12348-REQ-017 | Added | PBT transaction enquiry in the BackOffice Portal |
| 18 | 0.3 | EAINT-12348-REQ-018 | Added | Certificate of Destruction upload for a PBT user |
