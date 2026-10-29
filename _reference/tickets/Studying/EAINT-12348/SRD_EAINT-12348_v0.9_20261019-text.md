# SRD_EAINT-12348_v0.9_20261019.docx — text copy (27/10/2026, 5:13:30 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users |
| Version | Version 0.9 |
| Latest Revision Date | 19.10.2026 (Monday) |

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
| 0.3 | 07.10.2026 (Wed) | Chee Mei Jia | a. Removed Organisation Name and updated Company Type change in Section 2.2.4 ⏎ b. Added data import, mandatory fields and TIN Number in Section 2.2.4 ⏎ c. Added flow access, PBT filter and JPJ submission in Section 2.2.5 ⏎ d. Added PBT Pre-Checking Transaction Number in Section 2.2.6 ⏎ e. Updated Section 1.5, 2.1.2, 2.2.1 and Certificate of Destruction in Section 2.2.8 |
| 0.4 | 08.10.2026 (Thurs) | Chee Mei Jia | a. Updated transaction number and RHB Payment ID in Section 2.2.6 ⏎ b. Added Invoice and e-Invoice in Section 2.2.9 ⏎ c. Updated Section 1.5, Section 2.1.2 and Section 2.2.3 ⏎ d. Added Pre-Checking Email, updated Company Type and TIN Number in Section 2.2.4 ⏎ e. Updated JPJ Submission Identifier in Section 2.2.5 |
| 0.5 | 09.10.2026 (Fri) | Chee Mei Jia | a. Updated user access, data import and account fields in Section 2.2.4 ⏎ b. Updated Step 2, Step 5 and transaction listing in Section 2.2.5 ⏎ c. Added JPJ submission fields in Section 2.2.5.1 to Section 2.2.5.3 ⏎ d. Updated RHB Payment ID in Section 2.2.6 ⏎ e. Updated Section 2.2.7, Section 2.2.8 and Section 2.2.9 |
| 0.6 | 12.10.2026 (Mon) | Chee Mei Jia | a. Updated data import, account fields and TIN Number in Section 2.2.4 ⏎ b. Updated flow access, Step 5 and JPJ submission in Section 2.2.5 ⏎ c. Added Section 2.2.5.4 and updated Section 2.2.5.3 ⏎ d. Updated RHB Payment ID in Section 2.2.6 and Section 2.2.6.1 ⏎ e. Updated Section 1.5, 2.2.2, 2.2.3, 2.2.8 and Section 2.2.9 |
| 0.7 | 14.10.2026 (Wed) | Chee Mei Jia | a. Updated account fields and JPJ submission in Section 2.2.4 and 2.2.5 ⏎ b. Updated Section 2.2.5.3 and PBT Shortform in Section 2.2.5.4 ⏎ c. Updated PBT running number and RHB Payment ID in Section 2.2.6 ⏎ d. Updated Invoice and e-Invoice in Section 2.2.9 ⏎ e. Updated Master List Data Import in Section 2.2.4 and added Section 2.2.4.1 |
| 0.8 | 15.10.2026 (Thurs) | Chee Mei Jia | a. Updated document format to the latest SRD template ⏎ b. Updated Master List Data Import and examples in Section 2.2.4 to 2.2.6 ⏎ c. Added PBT Perakuan in Section 2.2.5.5 ⏎ d. Updated Receipt No and AATF Perakuan in Section 2.2.5 ⏎ e. Added COD email, cancellation, modules, search and pre-checking in Section 2.2.8 to 2.2.13 |
| 0.9 | 19.10.2026 (Mon) | Chee Mei Jia | a. Updated Receipt No in Section 2.2.5.3 ⏎ b. Updated Certificate of Destruction in Section 2.2.8 and Section 2.2.8.1 ⏎ c. Updated PBT Settings and daily pre-checking limit in Section 2.2.11 and 2.2.13 |

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
| 8 | Mock Up_EAINT-12348_PBT Portal_20261009.html | Attached to this ticket | Screen mockup for the PBT portal |
| 9 | Mock Up_EAINT-12348_BackOffice Portal_20261012.html | Attached to this ticket | Screen mockup for the BackOffice portal |
| 10 | Sample_EAINT-12348_Dereg Invoice PBT_20261012 and Sample_EAINT-12348_Dereg e-Invoice PBT_20261012 | Attached to this ticket | Deregistration Invoice and e-Invoice for a PBT buyer |
| 11 | Sample_EAINT-12348_eDereg Pre-Checking Invoice PBT_20261012 and Sample_EAINT-12348_eDereg Pre-Checking e-Invoice PBT_20261012 | Attached to this ticket | eDereg Pre-Checking Invoice and e-Invoice for a PBT buyer |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | A PBT organisation is a reference record only. It is selected by an AATF user during deregistration and cannot log in to eDereg. ⏎ Extend a PBT organisation to an eDereg user that logs in and creates deregistration transactions in the same way as an AATF user. ⏎ The existing AATF operating flow remains unchanged. |
| 2.1.2 | Key Value(s) Expected | 1. PBT organisations create deregistration transactions directly instead of going through an AATF. ⏎ 2. PBT transactions are distinguished from AATF transactions by a dedicated running number. ⏎ 3. PBT onboarding is controlled through the BackOffice Portal. |
| 2.1.3 | Additional Note(s) | PBT master list is sourced from the KPKT listing and provided by the requestor. |

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
| 3 | Enhancement to RHB payment reconciliation | Confirmed by developer that the PBT changes do not affect RHB payment reconciliation. RHB payment reconciliation is included in QA testing. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. AATF ⏎ 2. BackOffice |
| 3 | Module | PBT (eDereg) |
| 4 | Request | Enable a PBT organisation to log in to eDereg and create deregistration transactions in the same way as an AATF organisation. |
| 5 | Additional Note | 1. Business scope is expanding to include PBT users. Existing PBT company type only supports listing of PBT names within AATF function and cannot create an operational PBT user account. ⏎ 2. PBT master list reference: https://pbtpay.kpkt.gov.my/pbt ⏎ 3. Licensed AATF list reference: https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ ⏎ 4. PBT master list and licensed AATF list files to be attached to this ticket. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Company Type in Manage AATF/PBT Account provides an AATF option and a PBT option. ⏎ 2. A PBT record is used as a reference. The AATF user selects the PBT at Step 2 of the deregistration transaction creation flow. ⏎ 3. A PBT is not able to log in to the eDereg Portal and is not able to create a deregistration transaction. ⏎ 4. Deregistration transactions carry a single running number in the format D690000638. ⏎ 5. PBT Shortform is captured as free text when Company Type is PBT. |
| 2 | Expected New Handling / Behaviour | 1. An authorised BackOffice user creates a PBT company account with login access to the eDereg Portal. ⏎ 2. A PBT user logs in and creates deregistration transactions using the same 6 step flow as an AATF user. ⏎ 3. A deregistration transaction created by a PBT user receives a running number in the format PBT690000001. ⏎ 4. The existing AATF running number sequence in the format D690000638 remains unchanged. ⏎ 5. A PBT user views only the deregistration transactions created by that PBT organisation. ⏎ 6. A PBT does not hold a Business Registration Number. A PBT holds 1 Registration Number provided by LHDN (MyInvois Portal) for e-Invoice use, captured in Company Reg. No. on the PBT account. ⏎ 7. Company Type cannot be changed once the account is created. ⏎ 8. PBT master list and licensed AATF list are imported as PBT and AATF company accounts. Mandatory fields with no source data are completed by Operations team before the account is saved. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Manage AATF/PBT Account (Create New) | Company Type = PBT creates an account with login access. |
| 2 | BackOffice — Manage AATF/PBT Account (Update) | PBT company account is maintained, activated and inactivated. |
| 3 | BackOffice — Deregistration Transaction Enquiry | PBT running number and PBT organisation are displayed and searchable. |
| 4 | PBT Portal — Login | A PBT company account logs in to the eDereg Portal. |
| 5 | PBT Portal — Create Deregistration Transaction (Step 2 Vehicle) | PBT / Individu lists INDIVIDU - INDIVIDU and the logged-in PBT only. |
| 6 | AATF and PBT Portal — Create Deregistration Transaction (Step 5 Payment) | Payment Summary follows the eDereg Pre-Checking Step 2 Payment layout, for both AATF and PBT users. |
| 7 | PBT Portal — Deregistration Transaction Listing | Only transactions created by the logged-in PBT account are listed. |
| 8 | PBT Portal — Deregistration Transaction Details | PBT details are displayed in place of AATF details. |
| 9 | PBT Portal — Upload Certificate of Destruction (COD) | PBT labels and PBT Shortform are displayed in place of AATF and Company labels. |
| 10 | Deregistration and eDereg Pre-Checking Invoice and e-Invoice | Buyer shows the PBT account for a PBT transaction. |
| 11 | PBT Portal — eDereg Pre-Checking Transaction Listing | Cancel is displayed only while Payment is not OK. |
| 12 | BackOffice — Deregistration Transaction Enquiry and eDereg Pre-Checking Transaction Listing | Cancel is displayed for Pending and Failed PBT transactions, including when Payment is OK. |
| 13 | PBT Portal — Homepage, Reports and Settings | PBT user accesses the same modules, reports and settings as an AATF user. |
| 14 | BackOffice — JPJ XML Log (Deregistration) and RHB Payment Transaction | PBT records are included and searchable. |
| 15 | Certificate of Destruction email | Sent to the vehicle owner, PBT and DOE for a PBT transaction. |
| 16 | PBT Portal — Create Deregistration Transaction (Step 2 eDereg Pre-Checking Enquiry) | Pre-checking is checked against the PBT account's own approved records, valid for 6 months. |

### 2.2.4 BackOffice — Manage AATF/PBT Account

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12348-REQ-001 | PBT Account Login Access | Existing: ⏎ A PBT record is saved as a reference and is not able to log in to the eDereg Portal. ⏎ New Expected: ⏎ a. Company Type = PBT saves a company account with login access to the eDereg Portal. ⏎ b. Company Type AATF and PBT use the same set of fields for the main user, including Login ID and Password. Only the section label differs: Director / Owner Details for AATF and Main User Details for PBT. | Example 1: Company Type = PBT saved with an active status ⏎ a. The PBT account logs in to the eDereg Portal successfully. ⏎ Example 2: Company Type = PBT saved with an inactive status ⏎ a. Login is blocked and existing transactions of that account remain unchanged. ⏎ Example 3: Company Type = AATF ⏎ a. Login behaviour remains as before this enhancement. |
| 2 | EAINT-12348-REQ-002 | BackOffice User Access | Existing: ⏎ Manage AATF/PBT Account is accessed by authorised BackOffice users. ⏎ New Expected: ⏎ All BackOffice users can view and access Manage AATF/PBT Account. The access setting follows Manage Company Accounts under BackOffice > Account Management. | Example 1: Any BackOffice user opens BackOffice > Account Management ⏎ a. Manage AATF/PBT Account is displayed and accessible, the same as Manage Company Accounts. |
| 3 | EAINT-12348-REQ-003 | Company Type Change After Creation | Existing: ⏎ Company Type is editable on the Update AATF/PBT Company Account page after the account is created. ⏎ New Expected: ⏎ Company Type cannot be changed once the account is created. Update AATF/PBT Company Account displays Company Type as read-only. | Example 1: Create New AATF/PBT Company Account ⏎ a. Company Type is selectable. ⏎ Example 2: Update AATF/PBT Company Account ⏎ a. Company Type is displayed and cannot be changed. |
| 4 | EAINT-12348-REQ-004 | Master List Data Import | Existing: ⏎ a. A PBT record held under the AATF function is a reference entry with a PBT Shortform and a PBT name. ⏎ b. No licensed AATF list is held in the system. ⏎ New Expected: ⏎ a. Every record in the PBT master list is imported as a PBT company account, except the 4 existing PBT records in production listed in Section 2.2.4.1. 154 PBT company accounts are created. ⏎ b. The 4 existing PBT records in production are migrated to PBT company accounts. After deployment they log in as PBT and create deregistration and eDereg Pre-Checking transactions. ⏎ c. Every record in the licensed AATF list is imported as an AATF company account, except a licensed AATF that already holds a company account in production. Car Medic Sdn Bhd is not imported on this basis. ⏎ d. Imported PBT and AATF company accounts are saved with Company Account Status New. ⏎ e. A mandatory field with no source data, or a value with no matching dropdown value, is stored empty on import. ⏎ f. An imported account with no Login ID and Password is not able to log in. Login ID and Password sit under Director / Owner Details for Company Type AATF and under Main User Details for Company Type PBT. ⏎ g. Where an Abbreviation is shared by 2 or more PBT organisations, PBT Shortform is imported as listed in Section 2.2.5.4, for example MDKerian and MDKeningau. ⏎ h. MAJLIS BANDARAYA PULAU PINANG is imported with: ⏎ i. TIN Number: F10320870040 ⏎ ii. Company Reg. No.: AKT/07/0701/0001 ⏎ iii. SST Registration Number: P11-1809-32000202 ⏎ i. Company Reg. No. is not mandatory when Company Type is PBT. It is stored empty for an imported PBT account, except MAJLIS BANDARAYA PULAU PINANG in item h. ⏎ PBT master list mapping to Create New AATF/PBT Company Account: ⏎ a. Official PBT Name to Company Name ⏎ b. Abbreviation to PBT Shortform ⏎ c. State / Federal Territory to State, matched by state name to the State dropdown value, for example Selangor to SELANGOR (10) ⏎ Licensed AATF list mapping to Create New AATF/PBT Company Account: ⏎ a. Nama premis to Company Name ⏎ b. Alamat, text before the postcode, to Mailing Address ⏎ c. Alamat, postcode, to Postcode ⏎ d. Alamat, state, to State, matched by state name to the State dropdown value ⏎ e. Alamat, town after the postcode, to City, matched to the City dropdown value ⏎ f. Alamat, Daerah, to District, matched to the District dropdown value ⏎ g. No. telefon to Contact Number, stored as digits only | Example 1: PBT master list imported ⏎ a. 154 PBT company accounts are created. The 4 existing PBT records in production listed in Section 2.2.4.1 are not imported. ⏎ b. Company Name, PBT Shortform and State are filled from Official PBT Name, Abbreviation and State / Federal Territory. ⏎ c. Company Reg. No. and other fields with no source data are stored empty, except MAJLIS BANDARAYA PULAU PINANG in Example 9. ⏎ Example 2: Licensed AATF list imported ⏎ a. 4 AATF company accounts are created. ⏎ b. Car Medic Sdn Bhd is not imported. ⏎ Example 3: Jaring Metal Industries Sdn Bhd ⏎ a. Mailing Address: No.7&9, Jalan Sungai Kayu Ara 32/37, Taman Perindustrian Berjaya, Seksyen 32 ⏎ b. Postcode: 40460 ⏎ c. State: SELANGOR (10) ⏎ d. City: Shah Alam ⏎ e. District: empty ⏎ f. Contact Number: 0357408823 ⏎ Example 4: Kitaran Recovery Sdn Bhd ⏎ a. Mailing Address: Lot 336613 Mukim Sungai Raya ⏎ b. Postcode: 31300 ⏎ c. State: PERAK (08) ⏎ d. City: empty ⏎ e. District: Kinta ⏎ f. Contact Number: 053577002 ⏎ Example 5: Eco-R Malaysia Sdn Bhd ⏎ a. Mailing Address: Eco-R (Malaysia) Sdn Bhd, No.4A, Jalan Bestari 5/KU7, Taman Perindustrian Kapar Bestari ⏎ b. Postcode: 42200 ⏎ c. State: SELANGOR (10) ⏎ d. City: Kapar ⏎ e. District: empty ⏎ f. Contact Number: 0333598807 ⏎ Example 6: YonMing Euro Used Parts Sdn Bhd ⏎ a. Mailing Address: No.27, Lebuh Perusahaan Klebang 11, Kawasan Perindutrian IGB ⏎ b. Postcode: 31200 ⏎ c. State: PERAK (08) ⏎ d. City: Chemor ⏎ e. District: empty ⏎ f. Contact Number: 052916663 ⏎ Example 7: Imported AATF account with no Login ID and Password ⏎ a. The account is not able to log in until Login ID and Password are filled under Director / Owner Details. ⏎ Example 8: Imported PBT account with no Login ID and Password ⏎ a. The account is not able to log in until Login ID and Password are filled under Main User Details. ⏎ Example 9: Imported MAJLIS BANDARAYA PULAU PINANG account ⏎ a. TIN Number F10320870040, Company Reg. No. AKT/07/0701/0001 and SST Registration Number P11-1809-32000202 are filled. ⏎ Example 10: Existing deregistration transaction referencing a migrated PBT ⏎ a. The transaction reference and its PBT reference remain unchanged. |
| 5 | EAINT-12348-REQ-005 | Mandatory Field Completion | Existing: ⏎ Update AATF/PBT Company Account saves when every mandatory field is filled. ⏎ New Expected: ⏎ a. An imported account with an empty mandatory field is saved only after every mandatory field is filled. ⏎ b. Existing mandatory field validation on Update AATF/PBT Company Account applies to imported accounts. | Example 1: Imported account updated with every mandatory field filled ⏎ a. The account is saved. ⏎ Example 2: Imported account updated with a mandatory field still empty ⏎ a. The account is not saved and the empty mandatory field is flagged. ⏎ Example 3: Account not imported ⏎ a. Update behaviour remains as before this enhancement. |
| 6 | EAINT-12348-REQ-006 | TIN Number | Existing: ⏎ Create New and Update AATF/PBT Company Account do not capture a TIN Number. ⏎ New Expected: ⏎ a. TIN Number is added to Company Details on Create New and Update for Company Type AATF and PBT. ⏎ b. TIN Number is an optional free text field, following the TIN Number field on the UCD company account. ⏎ c. TIN Number of the account is used as Buyer TIN on the e-Invoice. | Example 1: Company Type = AATF ⏎ a. TIN Number is displayed and the account saves with or without a value. ⏎ Example 2: Company Type = PBT ⏎ a. TIN Number is displayed, for example MAJLIS BANDARAYA PULAU PINANG with TIN Number F10320870040. ⏎ Example 3: Imported AATF or PBT account ⏎ a. TIN Number is stored empty and is completed by Operations team on Update. ⏎ Example 4: Update AATF/PBT Company Account with TIN Number changed ⏎ a. The new TIN Number is saved and used as Buyer TIN on the next e-Invoice. |
| 7 | EAINT-12348-REQ-007 | Pre-Checking Email | Existing: ⏎ Company Email is used for deregistration submission. The email used for eDereg Pre-Checking submission is held in the database and is not displayed. ⏎ New Expected: ⏎ a. Pre-Checking Email is displayed in Company Details on Create New and Update AATF/PBT Company Account, beside Company Email. ⏎ b. Pre-Checking Email is mandatory. ⏎ c. A checkbox Same as Company Email is displayed beside Pre-Checking Email and is ticked by default. ⏎ d. When Same as Company Email is ticked, Pre-Checking Email takes the Company Email value and is not editable. When it is unticked, Pre-Checking Email is entered separately. ⏎ e. Pre-Checking Email is used for eDereg Pre-Checking submission. ⏎ f. Pre-Checking Email applies to Company Type AATF and PBT. | Example 1: Create New with Same as Company Email ticked ⏎ a. Pre-Checking Email shows the Company Email value and cannot be edited. ⏎ Example 2: Create New with Same as Company Email unticked and Pre-Checking Email empty ⏎ a. The account is not saved and Pre-Checking Email is flagged as mandatory. ⏎ Example 3: Update with Same as Company Email ticked and Company Email changed ⏎ a. Pre-Checking Email takes the new Company Email value. ⏎ Example 4: Update with Same as Company Email unticked ⏎ a. Pre-Checking Email is editable and keeps its own value when Company Email changes. ⏎ Example 5: eDereg Pre-Checking submission ⏎ a. Pre-Checking Email is used. ⏎ Example 6: Deregistration submission ⏎ a. Company Email is used as before this enhancement. |
| 8 | EAINT-12348-REQ-008 | PBT Account Form Fields | Existing: ⏎ Create New and Update AATF/PBT Company Account display the same fields for Company Type AATF and PBT, apart from PBT Shortform and DOE Email. ⏎ New Expected: ⏎ When Company Type is PBT, on Create New and Update AATF/PBT Company Account: ⏎ a. Director / Owner Details is labelled Main User Details. ⏎ b. Company Reg. No. is displayed and holds the 1 Registration Number provided by LHDN (MyInvois Portal) to the PBT for e-Invoice use, for example AKT/07/0701/0001. A PBT does not hold a Business Registration Number. ⏎ c. New Company Reg. No. is not displayed. ⏎ d. Same as Mailing Address, Showroom Address, Showroom Postcode, Showroom State, Showroom City and Showroom District are not displayed. ⏎ e. SST Registration Number is displayed in Company Details beside TIN Number, as an optional free text field, for example P11-1809-32000202 for MAJLIS BANDARAYA PULAU PINANG. Buyer SST Registration Number on the e-Invoice takes this value. ⏎ f. When Company Type is AATF, all fields display as before this enhancement and SST Registration Number is not displayed. ⏎ g. Transaction Payment Details (RHB Account Number, Pay on behalf and Group) behave the same for Company Type PBT as for Company Type AATF. ⏎ h. PBT Listing and PBT Selected remain for Company Type AATF only, as before this enhancement. | Example 1: Create New with Company Type = PBT ⏎ a. Section label shows Main User Details. ⏎ b. Company Reg. No. is displayed for the PBT Registration Number. ⏎ c. SST Registration Number is displayed beside TIN Number. ⏎ d. New Company Reg. No. and all Showroom fields are not displayed. ⏎ Example 2: Create New with Company Type = AATF ⏎ a. Director / Owner Details, Company Reg. No., New Company Reg. No. and all Showroom fields are displayed as before this enhancement. ⏎ Example 3: Update of a PBT account, for example MAJLIS BANDARAYA PULAU PINANG ⏎ a. Section label shows Main User Details. ⏎ b. Company Reg. No. shows AKT/07/0701/0001 and SST Registration Number shows P11-1809-32000202. ⏎ c. New Company Reg. No. and all Showroom fields are not displayed. ⏎ Example 4: Update of an AATF account ⏎ a. Fields display as before this enhancement and SST Registration Number is not displayed. |

### 2.2.4.1 Existing PBT Records in Production
PBT records that exist in production before this enhancement is deployed.

| # | Account ID | PBT Name |
| 1 | 5040001 | Majlis Bandaraya Melaka Bersejarah |
| 2 | 5040002 | Majlis Perbandaran Jasin |
| 3 | 5050001 | Majlis Bandaraya Seremban |
| 4 | 5100001 | Majlis Perbandaran Kajang |

### 2.2.5 PBT Portal — PBT User Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 9 | EAINT-12348-REQ-009 | PBT User Login | Existing: ⏎ The eDereg Portal is accessed by AATF users only. ⏎ New Expected: ⏎ a. An active PBT company account logs in to the eDereg Portal using the same login page as an AATF user. ⏎ b. A logged-in PBT user accesses the eDereg module, including transaction creation, listing and details. | Example 1: Active PBT account with valid credentials ⏎ a. Login succeeds and the eDereg homepage is displayed. ⏎ Example 2: Inactive PBT account ⏎ a. Login is blocked. |
| 10 | EAINT-12348-REQ-010 | eDereg Flow Access | Existing: ⏎ eDereg Pre-Checking and Create Deregistration Transaction are available to an AATF user only. ⏎ New Expected: ⏎ A PBT user accesses both flows exactly as an AATF user does: ⏎ a. eDereg Pre-Checking Enquiry: ⏎ i. Step 1 Vehicle ⏎ ii. Step 2 Payment ⏎ iii. Step 3 Result ⏎ b. Create Deregistration Transaction: ⏎ i. Sila Pilih Kategori ID — Orang Awam Malaysia (MyKad) or Penduduk Tetap Malaysia (MyPR) ⏎ ii. Step 1 Owner ⏎ iii. Step 2 Vehicle ⏎ iv. Step 3 PBT ⏎ v. Step 4 JPJ Check ⏎ vi. Step 5 Payment ⏎ vii. Step 6 Deregister ⏎ The Perakuan content shown to a PBT user on Create Deregistration Transaction Step 1, Step 3 and eDereg Pre-Checking Step 1 is listed in Section 2.2.5.5. ⏎ The Perakuan content shown to an AATF user remains as before this enhancement. | Example 1: PBT user completes eDereg Pre-Checking Enquiry ⏎ a. The Vehicle, Payment and Result steps behave the same as for an AATF user. ⏎ Example 2: PBT user creates a deregistration transaction ⏎ a. The ID category selection and Steps 1 to 6 behave the same as for an AATF user. ⏎ Example 3: AATF user ⏎ a. Both flows remain as before this enhancement. |
| 11 | EAINT-12348-REQ-011 | PBT / Individu Options At Step 2 | Existing: ⏎ PBT / Individu is a mandatory dropdown under AATF Details at Step 2 Vehicle of Create Deregistration Transaction. The AATF user selects Individu or a PBT from the PBT list, for example MBS - MAJLIS BANDARAYA SEREMBAN. ⏎ New Expected: ⏎ When the logged-in user is a PBT, PBT / Individu is a mandatory dropdown with exactly 2 options, and no option is selected by default: ⏎ a. INDIVIDU - INDIVIDU ⏎ b. The logged-in PBT, for example MBPJ - MAJLIS BANDARAYA PETALING JAYA ⏎ When the logged-in user is an AATF, PBT / Individu behaves as before this enhancement. | Example 1: MBPJ user opens Step 2 Vehicle ⏎ a. PBT / Individu shows no selection and lists only INDIVIDU - INDIVIDU and MBPJ - MAJLIS BANDARAYA PETALING JAYA. ⏎ Example 2: MBPJ user clicks Next without selecting PBT / Individu ⏎ a. Step 2 does not proceed and PBT / Individu is flagged as mandatory. ⏎ Example 3: AATF user opens Step 2 Vehicle ⏎ a. PBT / Individu lists Individu and the PBT list as before this enhancement. |
| 12 | EAINT-12348-REQ-012 | Standard Payment Summary At Step 5 | Existing: ⏎ Step 5 Payment of Create Deregistration Transaction shows the transaction summary with Click NEXT to pay and DEREGISTER. ⏎ New Expected: ⏎ For both PBT and AATF users, Step 5 Payment shows a Payment Summary in the same layout as Step 2 Payment of eDereg Pre-Checking Enquiry. Deregistration has no JPJ Fee, so the Payment Summary has these lines: ⏎ a. eAuto Service Fee: RM 35.00 ⏎ b. Service Tax 8%: RM 2.80 ⏎ c. Total Amount Payable (inclusive of Service Tax 8%): RM 37.80 | Example 1: PBT user reaches Step 5 Payment ⏎ a. Payment Summary shows eAuto Service Fee RM 35.00, Service Tax 8% RM 2.80 and Total Amount Payable RM 37.80, in the same layout as eDereg Pre-Checking Step 2 Payment, with no JPJ Fee line. ⏎ Example 2: AATF user reaches Step 5 Payment ⏎ a. Payment Summary shows the same lines and amounts as for a PBT user. |
| 13 | EAINT-12348-REQ-013 | Transaction Listing Scope | Existing: ⏎ The deregistration transaction listing returns the transactions of the logged-in AATF company account. The PBT filter lists All, INDIVIDU - INDIVIDU and the PBT organisations. ⏎ New Expected: ⏎ a. The listing returns only the transactions created by the logged-in account. ⏎ b. A PBT user views only transactions created by that PBT organisation. ⏎ c. For a PBT user, the PBT filter has All selected by default plus exactly 2 options: INDIVIDU - INDIVIDU and the logged-in PBT, for example MBPJ - MAJLIS BANDARAYA PETALING JAYA. ⏎ d. For an AATF user, the PBT filter remains as before this enhancement: All selected by default, plus INDIVIDU - INDIVIDU and all active PBT organisations. | Example 1: PBT user logged in ⏎ a. Only transactions created by that PBT organisation are listed. ⏎ b. PBT filter shows All (selected), INDIVIDU - INDIVIDU and MBPJ - MAJLIS BANDARAYA PETALING JAYA only. ⏎ Example 2: AATF user logged in ⏎ a. Only transactions created by that AATF organisation are listed. ⏎ b. PBT filter shows All (selected), INDIVIDU - INDIVIDU and all active PBT organisations as before this enhancement. |
| 14 | EAINT-12348-REQ-014 | PBT Details Display | Existing: ⏎ The deregistration transaction details page displays AATF, Company Reg. No., Company Address and Company Contact No. ⏎ New Expected: ⏎ For a transaction created by a PBT user the page displays PBT, Company Reg. No., PBT Address and PBT Contact No. Company Reg. No. shows the 1 Registration Number provided by LHDN (MyInvois Portal) to the PBT. | Example 1: Transaction created by MAJLIS BANDARAYA PULAU PINANG ⏎ a. Company Reg. No. shows AKT/07/0701/0001. ⏎ Example 2: Transaction created by an AATF user ⏎ a. Company Reg. No. is displayed as before this enhancement. |
| 15 | EAINT-12348-REQ-015 | JPJ Submission Identifier | Existing: ⏎ Deregistration submission to JPJ sends the fields listed in Section 2.2.5.1 for an AATF account. ⏎ New Expected: ⏎ a. Deregistration submission for a PBT transaction follows the existing submission. ⏎ b. eDereg Pre-Checking submission for a PBT transaction follows the deregistration submission. ⏎ c. Both send the eAuto Company ID of the PBT account, which starts with 5. ⏎ d. The input for each submission field, for AATF and for PBT, is listed in Section 2.2.5.1 for deregistration, Section 2.2.5.2 for Certificate of Destruction and Section 2.2.5.3 for eDereg Pre-Checking. ⏎ e. The PBT Name field carries the PBT Shortform. ⏎ f. 10 abbreviations are shared by 2 to 4 PBT organisations, 24 PBT organisations in total. All 24 are listed in Section 2.2.5.4. ⏎ g. For these 24, the PBT Shortform sent follows this rule: ⏎ i. MD, MP, MB or DB, followed by the place name without spaces, for example MDKerian and MDKeningau. ⏎ ii. Where the place name has 2 or more words, each word except the last is shortened to its first letter, for example MPKKangsar. ⏎ iii. Where the result is more than 10 characters, it is cut to the first 10 characters, for example MPKSamarah, MPKSelango, MPPenampan and MPPengeran. | Example 1: Deregistration submitted by a PBT user ⏎ a. The submission sends the eAuto Company ID of the PBT account, which starts with 5. ⏎ Example 2: eDereg Pre-Checking submitted by a PBT user ⏎ a. The submission sends the same eAuto Company ID as for deregistration. ⏎ Example 3: PBT user selects INDIVIDU - INDIVIDU at Step 2 ⏎ a. PBT Name sends INDIVIDU. ⏎ Example 4: PBT with an Abbreviation not shared, for example MAJLIS BANDARAYA PETALING JAYA ⏎ a. PBT Name sends MBPJ. ⏎ Example 5: PBT with a shared Abbreviation, for example MAJLIS DAERAH KERIAN ⏎ a. PBT Name sends MDKerian. ⏎ Example 6: PBT whose place name has 2 or more words, for example MAJLIS PERBANDARAN KUALA KANGSAR ⏎ a. PBT Name sends MPKKangsar. ⏎ Example 7: PBT whose PBT Shortform is more than 10 characters, for example MAJLIS PERBANDARAN KOTA SAMARAHAN ⏎ a. PBT Name sends MPKSamarah, the first 10 characters. ⏎ Example 8: Transaction created by an AATF user ⏎ a. The submission remains as before this enhancement. |

### 2.2.5.1 Deregistration Submission to JPJ
Fields that eAuto sends to JPJ in the deregistration submission.

| # | Field | Type | Length | Not Null | Description | AATF Input | PBT Input |
| 1 | Owner ID No | CHAR | 20 | Y | Refer to Owner IC Number (Individual) | 900101015678 | 900101015678 |
| 2 | Owner ID Category | CHAR | 1 | Y | 0 = MyKad, 1 = MyPR | 0 | 0 |
| 3 | Registration Number | CHAR | 20 | Y | Refer to Vehicle Registration Number | VAN1234 | VAN1234 |
| 4 | Chasis No | CHAR | 30 | Y | Refer to Vehicle Chassis Number | CH12345678 | CH12345678 |
| 5 | Engine No | CHAR | 22 | Y | Refer to Vehicle Engine Number | EN12345678 | EN12345678 |
| 6 | AATF Email | CHAR | 100 | Y | Refer to AATF's / PBT's Company Email Address (from Company Details - Company Email field) | admin@abcaatf.com | dereg@mbpj.gov.my |
| 7 | Owner Email | CHAR | 100 | Y | Refer to Owner's Email Address (from Deregistration Transaction Step 1 Perakuan) | azli@example.com | azli@example.com |
| 8 | AATF ID No | CHAR | 10 | Y | Refer to AATF's / PBT's eAuto Company ID | 4150011 | 5020001 |
| 9 | AATF Name | CHAR | 150 | Y | Refer to AATF's Company Name or PBT's Full Name | ABC AATF SDN BHD | MAJLIS BANDARAYA PETALING JAYA |
| 10 | PBT Name | CHAR | 10 | Y | Refer to the selection at Deregistration Transaction Step 2 PBT / Individu. If a PBT is selected, the PBT Shortform is sent. If Individu is selected, INDIVIDU is sent. | INDIVIDU | MBPJ |

Example Submission

| # | Account Type | Example Submission (fields 1 to 10 in order, separated by ~) |
| 1 | AATF | 900101015678~0~VAN1234~CH12345678~EN12345678~admin@abcaatf.com~azli@example.com~4150011~ABC AATF SDN BHD~INDIVIDU |
| 2 | PBT | 900101015678~0~VAN1234~CH12345678~EN12345678~dereg@mbpj.gov.my~azli@example.com~5020001~MAJLIS BANDARAYA PETALING JAYA~MBPJ |

### 2.2.5.2 Certificate of Destruction Submission to JPJ (mySIKAP)
Fields that eAuto sends to JPJ mySIKAP in the Certificate of Destruction (COD) submission.

| # | Field | Type | Length | Not Null | Description | AATF Input | PBT Input |
| 1 | Owner ID No | CHAR | 20 | Y | Refer to Owner IC Number (Individual) | 900101015678 | 900101015678 |
| 2 | Owner ID Category | CHAR | 1 | Y | 0 = MyKad, 1 = MyPR | 0 | 0 |
| 3 | Registration Number | CHAR | 20 | Y | Refer to Vehicle Registration Number | VAN1234 | VAN1234 |
| 4 | Chasis No | CHAR | 30 | Y | Refer to Vehicle Chassis Number | CH12345678 | CH12345678 |
| 5 | Engine No | CHAR | 22 | Y | Refer to Vehicle Engine Number | EN12345678 | EN12345678 |
| 6 | Decomposition Date | DATE | | Y | Refer to Date of Destruction (from Upload COD Step 2 Vehicle), in yyyy-mm-dd | 2026-09-24 | 2026-09-24 |
| 7 | AATF Location | CHAR | 150 | Y | Refer to AATF's / PBT's Mailing Address (from Company Details - Mailing Address field) | LORONG 0/9-A & B, JALAN 1, TAMAN 2, 55000 KUALA LUMPUR | JALAN YONG SHOOK LIN, SEKSYEN 52, 46200 PETALING JAYA, SELANGOR |

Example Submission

| # | Account Type | Example Submission (fields 1 to 7 in order, separated by ~) |
| 1 | AATF | 900101015678~0~VAN1234~CH12345678~EN12345678~2026-09-24~LORONG 0/9-A & B, JALAN 1, TAMAN 2, 55000 KUALA LUMPUR |
| 2 | PBT | 900101015678~0~VAN1234~CH12345678~EN12345678~2026-09-24~JALAN YONG SHOOK LIN, SEKSYEN 52, 46200 PETALING JAYA, SELANGOR |

### 2.2.5.3 eDereg Pre-Checking Submission to JPJ (mySIKAP)
Fields that eAuto sends to JPJ mySIKAP in the eDereg Pre-Checking submission.

| # | Field | Type | Length | Not Null | Description | AATF Input | PBT Input |
| 1 | Registration Number | CHAR | 20 | Y | Refer to Vehicle Registration Number (from eDereg Pre-Checking Step 1 Vehicle Registration Number) | VAN1234 | VAN1234 |
| 2 | EFT DateTime | CHAR | 26 | Y | Refer to the date and time of the RHB payment for the pre-checking | 2026-09-24 10:34:29.000 | 2026-09-24 10:34:29.000 |
| 3 | EFT No | CHAR | 30 | Y | Refer to the RHB Payment ID Ref 2 of the pre-checking payment (Section 2.2.6.1) | DPC260924000005 | DPC260924000005 |
| 4 | Receipt No | CHAR | 20 | Y | Refer to the receipt number generated by eAuto for the pre-checking payment: ⏎ a. YYMMDD, for example 260924 ⏎ b. Fixed number: 0807 for AATF, 0810 for PBT ⏎ c. 4 digit running number, for example 0003 | 26092408070003 | 26092408100003 |
| 5 | Ag Code | CHAR | 100 | Y | Fixed value 72404 | 72404 | 72404 |
| 6 | Revenue Code | CHAR | 10 | Y | Fixed value 2910002 | 2910002 | 2910002 |
| 7 | Payment Mode | CHAR | 1 | Y | Fixed value E (Electronic Funds) | E | E |
| 8 | Amount Paid | DECIMAL | 6 | Y | Refer to the JPJ Fee of the pre-checking payment | 5.00 | 5.00 |
| 9 | Company No | CHAR | 30 | Y | Refer to AATF's / PBT's Company Registration Number (from Company Details - New Company Reg. No. field for AATF, Company Reg. No. field for PBT) | 202001023456 | AKT/07/0701/0001 |
| 10 | Email1 | CHAR | 100 | Y | Refer to AATF's / PBT's Email, used to receive the JPJ Official Receipt from JPJ | precheck@abcaatf.com | precheck@mbpp.gov.my |
| 11 | Email2 | CHAR | 100 | N | Refer to eAuto's Email, receipt@eauto.my, used to receive a copy of the JPJ Official Receipt from JPJ | receipt@eauto.my | receipt@eauto.my |

Example Submission

| # | Account Type | Example Submission (fields 1 to 11 in order, separated by ~) |
| 1 | AATF | VAN1234~2026-09-24 10:34:29.000~DPC260924000005~26092408070003~72404~2910002~E~5.00~202001023456~precheck@abcaatf.com~receipt@eauto.my |
| 2 | PBT | VAN1234~2026-09-24 10:34:29.000~DPC260924000005~26092408100003~72404~2910002~E~5.00~AKT/07/0701/0001~precheck@mbpp.gov.my~receipt@eauto.my |

### 2.2.5.4 PBT Shortform for Duplicated Abbreviations
PBT Shortform sent in the PBT Name field of the deregistration submission when an Abbreviation is shared by 2 or more PBT organisations. The PBT Shortform is MD, MP, MB or DB followed by the place name without spaces. Where the place name has 2 or more words, each word except the last is shortened to its first letter, for example MPKKangsar for Majlis Perbandaran Kuala Kangsar. The PBT Name field accepts up to 10 characters. Where the rule gives more than 10 characters, the PBT Shortform is cut to the first 10 characters: MPKSamarah, MPKSelango, MPPenampan and MPPengeran.

| # | Official PBT Name | Abbreviation | PBT Shortform Sent | Length | Within Limit |
| 1 | MAJLIS DAERAH GEDONG | MDG | MDGedong | 8 | Yes |
| 2 | MAJLIS DAERAH GERIK | MDG | MDGerik | 7 | Yes |
| 3 | MAJLIS DAERAH KENINGAU | MDK | MDKeningau | 10 | Yes |
| 4 | MAJLIS DAERAH KERIAN | MDK | MDKerian | 8 | Yes |
| 5 | MAJLIS DAERAH REMBAU | MDR | MDRembau | 8 | Yes |
| 6 | MAJLIS DAERAH ROMPIN | MDR | MDRompin | 8 | Yes |
| 7 | MAJLIS DAERAH SERIAN | MDS | MDSerian | 8 | Yes |
| 8 | MAJLIS DAERAH SUBIS | MDS | MDSubis | 7 | Yes |
| 9 | MAJLIS PERBANDARAN KUALA KANGSAR | MPKK | MPKKangsar | 10 | Yes |
| 10 | MAJLIS PERBANDARAN KULIM | MPKK | MPKulim | 7 | Yes |
| 11 | MAJLIS PERBANDARAN KOTA SAMARAHAN | MPKS | MPKSamarah | 10 | Yes |
| 12 | MAJLIS PERBANDARAN KUALA SELANGOR | MPKS | MPKSelango | 10 | Yes |
| 13 | MAJLIS PERBANDARAN MANJUNG | MPM | MPManjung | 9 | Yes |
| 14 | MAJLIS PERBANDARAN MUAR | MPM | MPMuar | 6 | Yes |
| 15 | MAJLIS PERBANDARAN PADAWAN | MPP | MPPadawan | 9 | Yes |
| 16 | MAJLIS PERBANDARAN PEKAN | MPP | MPPekan | 7 | Yes |
| 17 | MAJLIS PERBANDARAN PENAMPANG | MPP | MPPenampan | 10 | Yes |
| 18 | MAJLIS PERBANDARAN PENGERANG | MPP | MPPengeran | 10 | Yes |
| 19 | MAJLIS PERBANDARAN SANDAKAN | MPS | MPSandakan | 10 | Yes |
| 20 | MAJLIS PERBANDARAN SEGAMAT | MPS | MPSegamat | 9 | Yes |
| 21 | MAJLIS PERBANDARAN SELAYANG | MPS | MPSelayang | 10 | Yes |
| 22 | MAJLIS PERBANDARAN TAIPING | MPT | MPTaiping | 9 | Yes |
| 23 | MAJLIS PERBANDARAN TAWAU | MPT | MPTawau | 7 | Yes |
| 24 | MAJLIS PERBANDARAN TEMERLOH | MPT | MPTemerloh | 10 | Yes |

### 2.2.5.5 PBT Perakuan
Perakuan content shown to a PBT user. The Perakuan content shown to an AATF user remains as before this enhancement.

| # | Screen | Perakuan Content |
| 1 | Create Deregistration Transaction Step 1 Owner | Pending requestor. |
| 2 | Create Deregistration Transaction Step 3 PBT | Pending requestor. |
| 3 | eDereg Pre-Checking Step 1 | Pending requestor. |

### 2.2.6 Deregistration Transaction Numbering

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 16 | EAINT-12348-REQ-016 | PBT Running Number | Existing: ⏎ A deregistration transaction number is D followed by year, month and a 7 digit running number, for example D690000638. ⏎ New Expected: ⏎ a. A transaction created by a PBT user receives a running number in the format PBT followed by year, month and a 7 digit running number, for example PBT690000001. ⏎ b. Year is the last digit of the year. ⏎ Month is written as: ⏎ a. January to September: 1 to 9 ⏎ b. October: 0 ⏎ c. November: N ⏎ d. December: D | Example 1: Transaction created by a PBT user in September 2026 ⏎ a. Transaction number begins with PBT69, for example PBT690000001. ⏎ Example 2: Transaction created by a PBT user in October 2026 ⏎ a. Transaction number begins with PBT60. ⏎ Example 3: Transaction created by a PBT user in November 2026 ⏎ a. Transaction number begins with PBT6N. ⏎ Example 4: Transaction created by a PBT user in December 2026 ⏎ a. Transaction number begins with PBT6D. |
| 17 | EAINT-12348-REQ-017 | AATF Running Number | Existing: ⏎ AATF transactions carry a running number in the format D followed by year, month and a 7 digit running number. ⏎ New Expected: ⏎ The AATF running number sequence continues without change. | An AATF transaction created after this enhancement continues the existing D690000638 sequence. |
| 18 | EAINT-12348-REQ-018 | Reference Display And Search | Existing: ⏎ The transaction reference is displayed in the transaction listing and transaction details and is searchable by Transaction No. ⏎ New Expected: ⏎ A PBT running number is displayed and searchable in the same fields in the PBT Portal and the BackOffice Portal. | Example 1: Search by a PBT reference number ⏎ a. The matching transaction is returned in the listing. ⏎ Example 2: Search by an AATF reference number ⏎ a. The matching transaction is returned as before this enhancement. |
| 19 | EAINT-12348-REQ-019 | PBT Pre-Checking Transaction Number | Existing: ⏎ An eDereg Pre-Checking transaction number is PC followed by year, month and a 6 digit running number, for example PC69001611. ⏎ Year is the last digit of the year. Month is written as: ⏎ a. January to September: 1 to 9 ⏎ b. October: 0 ⏎ c. November: N ⏎ d. December: D ⏎ New Expected: ⏎ a. A pre-checking transaction created by a PBT user uses a separate running number in the format PBTPC followed by year, month and a 6 digit running number, starting from PBTPC69000001. ⏎ b. The PBTPC number uses the same year and month format as the PC number. ⏎ c. A pre-checking transaction created by an AATF user keeps the existing PC format. | Example 1: First pre-checking transaction created by a PBT user ⏎ a. Transaction number is PBTPC69000001. ⏎ Example 2: Pre-checking transaction created by a PBT user in October 2026 ⏎ a. Transaction number begins with PBTPC60. ⏎ Example 3: Pre-checking transaction created by a PBT user in November 2026 ⏎ a. Transaction number begins with PBTPC6N. ⏎ Example 4: Pre-checking transaction created by a PBT user in December 2026 ⏎ a. Transaction number begins with PBTPC6D. ⏎ Example 5: Pre-checking transaction created by an AATF user ⏎ a. Transaction number continues the existing PC sequence, for example PC69001612. |
| 20 | EAINT-12348-REQ-020 | RHB Payment ID | Existing: ⏎ An RHB Payment ID is DRG for a deregistration payment or DPC for a pre-checking payment, followed by year, month, day, a 6 digit running number and the vehicle number, for example DRG260914000016-EATRT454. ⏎ New Expected: ⏎ a. A payment made by a PBT user uses the PBT RHB Payment ID set in Section 2.2.6.1. TransType stays DRG or DPC. Ref 1 is P followed by the AATF prefix, for example PDRG260924000005-PUTRAJAYA1234 for deregistration and PDPC260924000005-PUTRAJAYA1234 for pre-checking. ⏎ b. Ref 2 for a PBT payment stays the same as AATF: DRG for deregistration, and DPC followed by year, month, day and a 6 digit running number for pre-checking. ⏎ c. A payment made by an AATF user keeps the existing RHB Payment ID set. ⏎ d. JPJ and RHB each accept a Payment ID of up to 30 characters. ⏎ e. RHB payment information for AATF and PBT is listed in Section 2.2.6.1. | Example 1: Deregistration payment made by a PBT user ⏎ a. TransType DRG, Ref 1 PDRG260924000005-PUTRAJAYA1234, Ref 2 DRG. ⏎ Example 2: Pre-checking payment made by a PBT user ⏎ a. TransType DPC, Ref 1 PDPC260924000005-PUTRAJAYA1234, Ref 2 DPC260924000005. ⏎ Example 3: Deregistration payment made by an AATF user ⏎ a. TransType DRG, Ref 1 DRG260914000020-HXA224, Ref 2 DRG, as before this enhancement. ⏎ Example 4: Pre-checking payment made by an AATF user ⏎ a. TransType DPC, Ref 1 DPC260924000005-VAN1234, Ref 2 DPC260924000005, as before this enhancement. |

### 2.2.6.1 RHB Payment Information

| # | Transaction | Field | AATF (Existing) | PBT (New) |
| 1 | Deregistration | TransType | DRG | DRG |
| 2 | Deregistration | Ref 1 | DRG260914000020-HXA224 | PDRG260924000005-PUTRAJAYA1234 |
| 3 | Deregistration | Ref 2 | DRG | DRG |
| 4 | eDereg Pre-Checking | TransType | DPC | DPC |
| 5 | eDereg Pre-Checking | Ref 1 | DPC260924000005-VAN1234 | PDPC260924000005-PUTRAJAYA1234 |
| 6 | eDereg Pre-Checking | Ref 2 | DPC260924000005 | DPC260924000005 |

PBT examples use PUTRAJAYA1234, the longest vehicle registration number, to show the maximum length. PBT Ref 1 is P followed by the AATF prefix (PDRG or PDPC), year, month, day, a 6 digit running number, then the vehicle number. Both PBT Ref 1 examples are 30 characters, within the 30 character limit of JPJ and RHB. PBT Ref 2 stays the same as AATF.

### 2.2.7 BackOffice — Deregistration Transaction Enquiry

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 21 | EAINT-12348-REQ-021 | PBT Transaction Enquiry | Existing: ⏎ The PBT filter returns transactions where the AATF user selected that PBT at Step 2. ⏎ New Expected: ⏎ a. The PBT filter also returns transactions created by a PBT user. ⏎ b. The PBT filter has All selected by default, followed by INDIVIDU - INDIVIDU and all active PBT organisations. | Example 1: PBT filter = MBPJ - MAJLIS BANDARAYA PETALING JAYA ⏎ a. Transactions where the AATF user selected MBPJ at Step 2 are returned. ⏎ b. Transactions created by the MBPJ PBT user are returned. ⏎ Example 2: PBT filter = INDIVIDU - INDIVIDU ⏎ a. Transactions where the AATF user selected Individu at Step 2 are returned. ⏎ Example 3: PBT filter = All ⏎ a. Transactions are returned regardless of PBT. |

### 2.2.8 Certificate of Destruction

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 22 | EAINT-12348-REQ-022 | Certificate Of Destruction | Existing: ⏎ An AATF user uploads a Certificate of Destruction (COD) for an approved deregistration transaction through Upload Certificate of Destruction (COD). ⏎ New Expected: ⏎ A PBT user uploads a COD exactly as an AATF user does: ⏎ a. Upload COD is a hyperlink in the Action column of DEREGISTRATION TRANSACTION LISTING, reached from the eDEREG module on the homepage. It displays beside View when Tx Status is Approved and COD is No. ⏎ b. Step 1 PBT displays PBT Authentication with MyKad details and thumbprint verification. ⏎ c. Step 2 Vehicle displays Upload Date & Certificate with Date of Destruction and Upload Certificate, both mandatory. ⏎ d. Step 3 Submit displays COD Submitted with Date of COD, JPJ Decomposition Status and Submission Date/Time. ⏎ e. Company labels display as PBT labels, and Company Reg. No. shows the PBT Registration Number. ⏎ f. The fields sent to JPJ mySIKAP on COD submission are listed in Section 2.2.5.2. ⏎ g. When JPJ returns a successful COD submission, the COD email in Section 2.2.8.1 is sent with the COD attached, following the AATF behaviour. ⏎ Requestor advised that a PBT sends the vehicle to a licensed AATF for disposal, and the PBT only does the deregistration. Whether a PBT transaction still requires a COD, and who uploads it, is pending requestor confirmation. ⏎ Sender Email: ⏎ mppkm@eauto.my ⏎ Recipient Email: ⏎ a. Vehicle owner: email captured at Create Deregistration Transaction Step 2 ⏎ b. PBT: Company Email of the PBT selected at Step 2 ⏎ c. DOE: DOE Email of the PBT selected at Step 2, or azlan@doe.gov.my when INDIVIDU - INDIVIDU is selected ⏎ Step 3 is labelled Submit on every step of Upload Certificate of Destruction (COD). | Example 1: Approved transaction with COD No ⏎ a. Action displays View and Upload COD. ⏎ Example 2: Approved transaction with COD Yes ⏎ a. Action displays View only. ⏎ Example 3: PBT user submits Date of Destruction and certificate ⏎ a. COD Submitted is displayed with JPJ Decomposition Status OK - TRANSACTION SUCCESSFUL. ⏎ b. COD in the listing displays Yes. ⏎ Example 4: COD submitted by MBPJ with MBPJ - MAJLIS BANDARAYA PETALING JAYA selected at Step 2 ⏎ a. COD email is sent to the vehicle owner, to MBPJ Company Email and to MBPJ DOE Email. ⏎ Example 5: COD submitted by MBPJ with INDIVIDU - INDIVIDU selected at Step 2 ⏎ a. COD email is sent to the vehicle owner and to azlan@doe.gov.my. ⏎ Example 6: JPJ returns a failed COD submission ⏎ a. COD email is not sent. ⏎ Example 7: AATF user ⏎ a. Upload Certificate of Destruction (COD) remains as before this enhancement. |

### 2.2.8.1 Certificate of Destruction Email — Content
For a PBT transaction the vehicle is disposed of at a licensed AATF, so [Nama AATF] would be the AATF that did the disposal. Whether this email applies to a PBT transaction depends on whether a PBT transaction requires a COD, pending requestor confirmation.

| # | Item | Description |
| 1 | Content Template | Daripada : eAuto <mppkm@eauto.my> ⏎ Kepada : Pemilik Kenderaan, PBT, JAS <all relevant email addresses> ⏎ Tajuk : SIJIL PELUPUSAN KENDERAAN (COD) - [Nombor Pendaftaran Kenderaan] 车辆报废证书 (COD) - [Nombor Pendaftaran Kenderaan] ⏎ Salam Sejahtera ⏎ Tuan/Puan, ⏎ Perkara di atas adalah dirujuk. ⏎ 2. Adalah dimaklumkan bahawa kenderaan [Nombor Pendaftaran Kenderaan] milik [Nama Pemilik] telah dibatalkan pendaftaran pada [DD/MM/YYYY] dan selesai dilupuskan di pusat Kemudahan Rawatan Automotif Berlesen [Nama AATF] pada [DD/MM/YYYY]. ⏎ 3. Bersama ini disertakan Sijil Pengesahan Pelupusan Kenderaan untuk rujukan dan rekod anda. ⏎ Terima kasih. ⏎ Admin eAuto ⏎ 您好 ⏎ 先生/女士， ⏎ 请参考以上标题。 ⏎ 2. 获悉，属于 [Nama Pemilik] 的车辆 [Nombor Pendaftaran Kenderaan] 已在 [DD/MM/YYYY] 注销，并已在 [DD/MM/YYYY] 的持照汽车处理设施中心 [Nama AATF] 进行处置。 ⏎ 3.随函附上车辆报废证书，供您查阅和记录。 ⏎ 谢谢。 ⏎ eAuto管理员 |
| 2 | Content Sample | Daripada : eAuto <mppkm@eauto.my> ⏎ Kepada : Pemilik Kenderaan, PBT, JAS <all relevant email addresses> ⏎ Tajuk : SIJIL PELUPUSAN KENDERAAN (COD) - WA1234B 车辆报废证书 (COD) - WA1234B ⏎ Salam Sejahtera ⏎ Tuan/Puan, ⏎ Perkara di atas adalah dirujuk. ⏎ 2. Adalah dimaklumkan bahawa kenderaan WA1234B milik NORAINI BINTI OSMAN telah dibatalkan pendaftaran pada 21/09/2026 dan selesai dilupuskan di pusat Kemudahan Rawatan Automotif Berlesen ABC AATF SDN BHD pada 22/09/2026. ⏎ 3. Bersama ini disertakan Sijil Pengesahan Pelupusan Kenderaan untuk rujukan dan rekod anda. ⏎ Terima kasih. ⏎ Admin eAuto ⏎ 您好 ⏎ 先生/女士， ⏎ 请参考以上标题。 ⏎ 2. 获悉，属于 NORAINI BINTI OSMAN 的车辆 WA1234B 已在 21/09/2026 注销，并已在 22/09/2026 的持照汽车处理设施中心 ABC AATF SDN BHD 进行处置。 ⏎ 3.随函附上车辆报废证书，供您查阅和记录。 ⏎ 谢谢。 ⏎ eAuto管理员 |

### 2.2.9 Invoice and e-Invoice

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 23 | EAINT-12348-REQ-023 | PBT Invoice And e-Invoice | Existing: ⏎ Deregistration Invoice, Deregistration e-Invoice, eDereg Pre-Checking Invoice and eDereg Pre-Checking e-Invoice show the AATF company as Buyer. ⏎ New Expected: ⏎ For a transaction created by a PBT user: ⏎ a. Buyer Name, Address, Email and Contact Number show the PBT account details. ⏎ b. Payment Reference No. shows the PBT RHB Payment ID. ⏎ c. eDereg Pre-Checking Invoice page 2 shows the PBT name as Nama Pemunya Berdaftar. ⏎ d. eDereg Pre-Checking Invoice page 3 shows the Perakuan signed at Pre-Checking Step 1. ⏎ e. An e-Invoice is generated for a PBT transaction and submitted to LHDN (MyInvois Portal). Buyer TIN shows the TIN Number of the PBT account. ⏎ f. Buyer Registration Number on the Invoice and e-Invoice, and No. Kad Pengenalan / No. Daftar Perniagaan on the eDereg Pre-Checking Invoice page 2, show the 1 Registration Number provided by LHDN (MyInvois Portal) to the PBT, for example AKT/07/0701/0001 for MAJLIS BANDARAYA PULAU PINANG. ⏎ g. Buyer SST Registration Number on the e-Invoice shows the SST Registration Number of the PBT account (Company Details - SST Registration Number field), for example P11-1809-32000202 for MAJLIS BANDARAYA PULAU PINANG. | Example 1: Deregistration paid by MBPJ ⏎ a. Invoice and e-Invoice Buyer shows MAJLIS BANDARAYA PETALING JAYA with the MBPJ address, email and contact number. ⏎ Example 2: Pre-checking paid by MBPJ ⏎ a. Invoice page 2 shows MAJLIS BANDARAYA PETALING JAYA. ⏎ b. Invoice page 3 shows the Perakuan signed at Pre-Checking Step 1. ⏎ Example 3: e-Invoice for MAJLIS BANDARAYA PULAU PINANG ⏎ a. Buyer TIN shows F10320870040. ⏎ Example 4: Transaction created by an AATF user ⏎ a. Invoice and e-Invoice remain as before this enhancement. |

### 2.2.10 Transaction Cancellation and Expiry

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 24 | EAINT-12348-REQ-024 | PBT User Cannot Cancel After Payment OK | Existing: ⏎ PBT user has no access to the eDereg Portal. ⏎ New Expected: ⏎ a. eDereg Pre-Checking Transaction Listing displays Cancel to a PBT user only while Payment is not OK, that is Trx Status Pending or a failed payment. ⏎ b. Once Payment is OK, Cancel is not displayed to the PBT user, including when JPJ Pre-Checking fails. ⏎ c. Deregistration Transaction Listing does not display Cancel. A PBT user cancels a deregistration transaction with Cancel at Step 4 or Step 5, the same as an AATF user. ⏎ d. Cancel at Step 4 or Step 5 is not allowed once the transaction is Expired or created more than 30 minutes ago. Tx Status is updated to Expired. | Example 1: Pre-checking transaction with Trx Status Pending ⏎ a. Action displays View and Cancel. ⏎ Example 2: Pre-checking transaction with a failed payment, for example IF or RE ⏎ a. Action displays View and Cancel. ⏎ Example 3: Pre-checking transaction with Payment OK and JPJ Pre-Checking Failed ⏎ a. Action displays View only. ⏎ Example 4: Deregistration transaction in any status ⏎ a. Deregistration Transaction Listing displays no Cancel. ⏎ Example 5: PBT user clicks Cancel at Step 5 within 30 minutes of creation ⏎ a. The transaction is cancelled. ⏎ Example 6: PBT user clicks Cancel at Step 5 more than 30 minutes after creation ⏎ a. Cancel is not allowed and Tx Status is updated to Expired. |
| 25 | EAINT-12348-REQ-025 | BackOffice User Cancels A PBT Transaction | Existing: ⏎ A BackOffice user cancels an AATF deregistration or eDereg Pre-Checking transaction with Cancel on the transaction listing. ⏎ New Expected: ⏎ a. Deregistration Transaction Enquiry and eDereg Pre-Checking Transaction Listing in BackOffice display Cancel for a PBT transaction with Trx Status Pending or Failed, including when Payment is OK. ⏎ b. Cancel updates Trx Status to Cancelled and Remarks to CANCELLED BY [BackOffice user] on [DD-MM-YYYY HH:MM]. ⏎ c. Cancel is not displayed for a transaction that is Approved, Cancelled or Expired. | Example 1: PBT pre-checking transaction with Payment OK and JPJ Pre-Checking Failed ⏎ a. BackOffice displays View and Cancel. ⏎ b. After Cancel, Trx Status shows Cancelled and Remarks shows CANCELLED BY eautoadmin on 13-09-2026 10:15. ⏎ Example 2: PBT deregistration transaction with Payment OK and JPJ Dereg Failed ⏎ a. BackOffice displays View and Cancel. ⏎ Example 3: PBT transaction that is Approved, Cancelled or Expired ⏎ a. BackOffice displays View only. |
| 26 | EAINT-12348-REQ-026 | PBT Transaction Expiry | Existing: ⏎ A deregistration transaction with Tx Status Pending or Failed expires 30 minutes after it is created. ⏎ New Expected: ⏎ A PBT deregistration transaction follows the same expiry rule as an AATF transaction: ⏎ a. A transaction with Tx Status Pending or Failed can be resubmitted within 30 minutes from its created date and time. ⏎ b. After 30 minutes, Resubmit updates Tx Status to Expired and returns the user to Deregistration Transaction Listing. ⏎ c. A cron job runs daily at 3am and updates every Pending or Failed transaction created more than 30 minutes ago to Expired. | Example 1: PBT user clicks Resubmit 20 minutes after creation ⏎ a. The transaction continues from the step it stopped at. ⏎ Example 2: PBT user clicks Resubmit 40 minutes after creation ⏎ a. Tx Status is updated to Expired and the user returns to Deregistration Transaction Listing. ⏎ Example 3: Pending transaction not resubmitted ⏎ a. The 3am cron job updates Tx Status to Expired. |

### 2.2.11 PBT Portal — Modules, Labels, Reports and Settings

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 27 | EAINT-12348-REQ-027 | PBT Module Access Same As AATF | Existing: ⏎ PBT user has no access to the eDereg Portal. ⏎ New Expected: ⏎ A PBT user accesses the same modules as an AATF user: ⏎ a. Homepage ⏎ b. Deregistration ⏎ c. Reports ⏎ d. Settings ⏎ e. Download ⏎ f. Contact Us ⏎ STMS, UCD to UCD, APT, e-Serahan (eSTM), eClassified, Insurance and User Guides are not accessible to a PBT user. | Example 1: PBT user logs in ⏎ a. Homepage shows the Deregistration module only. ⏎ b. Reports, Settings, Download and Contact Us are accessible. ⏎ Example 2: PBT user opens an STMS link ⏎ a. Access is not allowed. |
| 28 | EAINT-12348-REQ-028 | AATF Labels Display As PBT For A PBT User | Existing: ⏎ PBT user has no access to the eDereg Portal. ⏎ New Expected: ⏎ Every AATF label shown to a PBT user displays as PBT. This covers Create Deregistration Transaction Step 4 to Step 6, Upload Certificate of Destruction (COD), Deregistration Transaction Details and eDereg Pre-Checking Transaction Details: ⏎ a. AATF's Name to PBT's Rep ⏎ b. AATF's MyKad No. to PBT's Rep MyKad No ⏎ c. Company Name to PBT Name ⏎ d. Company Address to PBT Address ⏎ e. Company Contact No. to PBT Contact No ⏎ f. AATF Company Information to PBT ⏎ g. AATF Authorised Representative to PBT's Authorised Representative ⏎ h. AATF Authorised Representative (Uploaded COD) to PBT's Authorised Representative (Uploaded COD) | Example 1: MBPJ user reaches Step 5 Payment ⏎ a. Labels show PBT's Rep, PBT's Rep MyKad No, PBT Name, Company Reg No, PBT Address and PBT Contact No. ⏎ Example 2: MBPJ user opens Deregistration Transaction Details ⏎ a. Sections show PBT, PBT's Authorised Representative and PBT's Authorised Representative (Uploaded COD). ⏎ Example 3: AATF user ⏎ a. Labels remain as before this enhancement. |
| 29 | EAINT-12348-REQ-029 | PBT Reports | Existing: ⏎ PBT user has no access to the eDereg Portal. ⏎ New Expected: ⏎ Reports shows the same reports to a PBT user as to an AATF user: ⏎ a. AATF Payment Report, labelled PBT Payment Report for a PBT user. Transaction Type lists DEREG - Deregistration only. ⏎ b. Audit Trail Log ⏎ Each report returns the records of the logged-in PBT account only. | Example 1: MBPJ user opens Reports ⏎ a. PBT Payment Report and Audit Trail Log are displayed. ⏎ Example 2: MBPJ user exports PBT Payment Report ⏎ a. Only payments made by MBPJ are listed. |
| 30 | EAINT-12348-REQ-030 | PBT Settings | Existing: ⏎ PBT user has no access to the eDereg Portal. ⏎ New Expected: ⏎ Settings shows the same functions to a PBT user as to an AATF user: ⏎ a. Confirmation of Registration, with AATF wording displayed as PBT ⏎ b. Manage Users, with Main User, Super Admin and Sub User roles and these module permissions: ⏎ i. Create Deregistration Transaction ⏎ ii. Upload COD ⏎ iii. View Deregistration Transaction Listing ⏎ iv. Report | Example 1: MBPJ Main User opens Manage Users ⏎ a. Super Admin and Sub User accounts of MBPJ are listed. ⏎ Example 2: MBPJ Main User adds a Sub User with View Deregistration Transaction Listing only ⏎ a. The Sub User sees Deregistration Transaction Listing. Create Deregistration Transaction and Upload COD are not displayed. |

### 2.2.12 BackOffice — Search and Logs

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 31 | EAINT-12348-REQ-031 | PBT Transactions Found By Company Name And ROC | Existing: ⏎ Company Name and Company ROC on BackOffice Deregistration Transaction Enquiry search AATF transactions. ⏎ New Expected: ⏎ a. Company Name also returns PBT transactions by PBT name. ⏎ b. Company ROC also returns PBT transactions by the PBT Registration Number. | Example 1: Company Name = MAJLIS BANDARAYA PETALING JAYA ⏎ a. Transactions created by MBPJ are listed. ⏎ Example 2: Company ROC = AKT/10/1001/0008 ⏎ a. Transactions created by MBPJ are listed. |
| 32 | EAINT-12348-REQ-032 | PBT Records In JPJ XML Log | Existing: ⏎ JPJ XML Log (Deregistration) under Settings (Hub Admin) searches AATF deregistration transactions by Vehicle No. or Transaction Ref No. ⏎ New Expected: ⏎ a. Vehicle No. also returns PBT deregistration and eDereg Pre-Checking records. ⏎ b. Transaction Ref No. also returns a PBT running number, for example PBT690000003 or PBTPC69000008. | Example 1: Transaction Ref No. = PBT690000003 ⏎ a. Request and response data sent to JPJ for that transaction are listed. ⏎ Example 2: Transaction Ref No. = PBTPC69000008 ⏎ a. Request and response data sent to JPJ for that pre-checking are listed. |
| 33 | EAINT-12348-REQ-033 | PBT Payments In RHB Payment Transaction | Existing: ⏎ RHB Payment Transaction under Settings includes AATF deregistration and eDereg Pre-Checking payments. ⏎ New Expected: ⏎ a. PBT deregistration and eDereg Pre-Checking payments are included. ⏎ b. A PBT payment is searchable by its RHB Payment ID, for example PDRG260924000005-PUTRAJAYA1234 or PDPC260924000005-PUTRAJAYA1234. | Example 1: Search by PDRG260924000005-PUTRAJAYA1234 ⏎ a. The PBT deregistration payment is listed. ⏎ Example 2: Search by an AATF RHB Payment ID ⏎ a. Result remains as before this enhancement. |

### 2.2.13 PBT Portal — eDereg Pre-Checking

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 34 | EAINT-12348-REQ-034 | Pre-Checking Counts For The Same Organisation Only | Existing: ⏎ Create Deregistration Transaction Step 2 allows an AATF user to proceed when the vehicle has an approved eDereg Pre-Checking. ⏎ New Expected: ⏎ a. A PBT user proceeds at Step 2 only when the vehicle has an approved eDereg Pre-Checking created by the same PBT account. ⏎ b. An eDereg Pre-Checking created by an AATF account does not count for a PBT account, and an eDereg Pre-Checking created by a PBT account does not count for an AATF account. | Example 1: MBPJ enters VAN1234 at Step 2 and MBPJ has an approved pre-checking for VAN1234 ⏎ a. Message shows This vehicle is allowed to create eDereg transaction. ⏎ Example 2: MBPJ enters VAN1234 at Step 2 and only ABC AATF SDN BHD has an approved pre-checking for VAN1234 ⏎ a. eDereg Pre-Checking Enquiry popup is displayed and MBPJ must complete its own pre-checking. |
| 35 | EAINT-12348-REQ-035 | Approved Pre-Checking Valid For 6 Months | Existing: ⏎ An approved eDereg Pre-Checking is valid for 6 months for an AATF user. ⏎ New Expected: ⏎ An approved eDereg Pre-Checking created by a PBT user is valid for 6 months from its approval. After 6 months the PBT user completes a new eDereg Pre-Checking before proceeding at Step 2. | Example 1: MBPJ pre-checking approved 3 months ago ⏎ a. MBPJ proceeds to Step 3. ⏎ Example 2: MBPJ pre-checking approved 7 months ago ⏎ a. eDereg Pre-Checking Enquiry popup is displayed and a new pre-checking is required. |
| 36 | EAINT-12348-REQ-036 | Declaration Shown Once Per New Transaction | Existing: ⏎ The eDereg Pre-Checking Enquiry declaration is displayed 1 time only to an AATF user, on a new transaction where the RHB payment status is Pending. ⏎ New Expected: ⏎ The same rule applies to a PBT user. The declaration is not displayed again when the payment is resubmitted. | Example 1: PBT user opens a new eDereg Pre-Checking with RHB payment status Pending ⏎ a. The declaration is displayed. ⏎ Example 2: PBT user resubmits a payment with RHB payment status Failed ⏎ a. The declaration is not displayed. |
| 37 | EAINT-12348-REQ-037 | No Daily Pre-Checking Limit | Existing: ⏎ The earlier limit of 5 eDereg Pre-Checking enquiries per user per day for different vehicle numbers has been removed, as confirmed by the developer. ⏎ New Expected: ⏎ A PBT user has no daily limit on eDereg Pre-Checking, the same as an AATF user. This covers: ⏎ a. eDereg Pre-Checking standalone process ⏎ b. eDereg Pre-Checking purchased at Create Deregistration Transaction Step 2 | Example 1: MBPJ user pre-checks a 6th different vehicle number on the same day ⏎ a. The enquiry proceeds to payment. No limit popup is displayed. ⏎ Example 2: MBPJ user purchases eDereg Pre-Checking at Create Deregistration Transaction Step 2 after 5 pre-checks today ⏎ a. The eDereg Pre-Checking Enquiry popup proceeds as normal. |
| 38 | EAINT-12348-REQ-038 | eDereg Pre-Checking Link On Deregistration Listing | Existing: ⏎ eDereg Pre-Checking on the AATF Deregistration Transaction Listing shows Yes as a hyperlink when a pre-checking exists for the vehicle, or - when none exists. ⏎ New Expected: ⏎ a. For a PBT user, eDereg Pre-Checking shows Yes when the PBT account has a pre-checking for the vehicle, or - when it has none. ⏎ b. Yes opens eDereg Pre-Checking Transaction Listing for that vehicle number, showing the PBT account's own records only. | Example 1: MBPJ clicks Yes on the row for VAN1234 ⏎ a. eDereg Pre-Checking Transaction Listing opens filtered by VAN1234, with MBPJ records only. ⏎ Example 2: MBPJ has no pre-checking for the vehicle ⏎ a. eDereg Pre-Checking shows -. |
| 39 | EAINT-12348-REQ-039 | Resubmit On Pre-Checking Listing Same As AATF | Existing: ⏎ eDereg Pre-Checking Transaction Listing displays View and Resubmit to an AATF user. Resubmit opens Step 2 Payment of the transaction. ⏎ New Expected: ⏎ A PBT user sees View and Resubmit on eDereg Pre-Checking Transaction Listing in the same way as an AATF user. | Example 1: MBPJ pre-checking with a failed payment ⏎ a. Action displays View and Resubmit. Resubmit opens Step 2 Payment. ⏎ Example 2: MBPJ pre-checking that is Approved ⏎ a. Action displays View only, the same as an AATF user. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.9 | EAINT-12348-REQ-001 | Added | PBT account with eDereg Portal login access |
| 2 | 0.9 | EAINT-12348-REQ-002 | Added | BackOffice user access to Manage AATF/PBT Account |
| 3 | 0.9 | EAINT-12348-REQ-003 | Added | Company Type cannot be changed after account creation |
| 4 | 0.9 | EAINT-12348-REQ-004 | Added | PBT master list and licensed AATF list import |
| 5 | 0.9 | EAINT-12348-REQ-005 | Added | Mandatory field completion for imported accounts |
| 6 | 0.9 | EAINT-12348-REQ-006 | Added | TIN Number on AATF and PBT accounts |
| 7 | 0.9 | EAINT-12348-REQ-007 | Added | Mandatory Pre-Checking Email with copy checkbox |
| 8 | 0.9 | EAINT-12348-REQ-008 | Added | PBT account form fields |
| 9 | 0.9 | EAINT-12348-REQ-009 | Added | PBT user login to the eDereg Portal |
| 10 | 0.9 | EAINT-12348-REQ-010 | Added | PBT access to deregistration and pre-checking flow |
| 11 | 0.9 | EAINT-12348-REQ-011 | Added | PBT / Individu options at Step 2 |
| 12 | 0.9 | EAINT-12348-REQ-012 | Added | Step 5 Payment Summary for PBT and AATF |
| 13 | 0.9 | EAINT-12348-REQ-013 | Added | PBT transaction listing scope and PBT filter |
| 14 | 0.9 | EAINT-12348-REQ-014 | Added | PBT details displayed in place of AATF details |
| 15 | 0.9 | EAINT-12348-REQ-015 | Added | PBT eAuto Company ID sent to JPJ |
| 16 | 0.9 | EAINT-12348-REQ-016 | Added | PBT running number with year and month |
| 17 | 0.9 | EAINT-12348-REQ-017 | Added | AATF running number remains unchanged |
| 18 | 0.9 | EAINT-12348-REQ-018 | Added | PBT reference display and search |
| 19 | 0.9 | EAINT-12348-REQ-019 | Added | Separate pre-checking transaction number for a PBT user |
| 20 | 0.9 | EAINT-12348-REQ-020 | Added | PBT RHB Payment ID set |
| 21 | 0.9 | EAINT-12348-REQ-021 | Added | PBT transaction enquiry in the BackOffice Portal |
| 22 | 0.9 | EAINT-12348-REQ-022 | Added | Certificate of Destruction upload for a PBT user |
| 23 | 0.9 | EAINT-12348-REQ-023 | Added | PBT Invoice and e-Invoice |
| 24 | 0.9 | EAINT-12348-REQ-024 | Added | PBT user cannot cancel after payment OK |
| 25 | 0.9 | EAINT-12348-REQ-025 | Added | BackOffice user cancels a PBT transaction |
| 26 | 0.9 | EAINT-12348-REQ-026 | Added | PBT transaction expiry after 30 minutes |
| 27 | 0.9 | EAINT-12348-REQ-027 | Added | PBT module access same as AATF |
| 28 | 0.9 | EAINT-12348-REQ-028 | Added | AATF labels display as PBT |
| 29 | 0.9 | EAINT-12348-REQ-029 | Added | PBT reports |
| 30 | 0.9 | EAINT-12348-REQ-030 | Added | PBT settings |
| 31 | 0.9 | EAINT-12348-REQ-031 | Added | PBT transactions found by name and ROC |
| 32 | 0.9 | EAINT-12348-REQ-032 | Added | PBT records in JPJ XML Log |
| 33 | 0.9 | EAINT-12348-REQ-033 | Added | PBT payments in RHB Payment Transaction |
| 34 | 0.9 | EAINT-12348-REQ-034 | Added | Pre-checking counts for same organisation only |
| 35 | 0.9 | EAINT-12348-REQ-035 | Added | Approved pre-checking valid for 6 months |
| 36 | 0.9 | EAINT-12348-REQ-036 | Added | Declaration shown once per new transaction |
| 37 | 0.9 | EAINT-12348-REQ-037 | Added | No daily pre-checking limit |
| 38 | 0.9 | EAINT-12348-REQ-038 | Added | Pre-checking link on deregistration listing |
| 39 | 0.9 | EAINT-12348-REQ-039 | Added | Resubmit on pre-checking listing |
