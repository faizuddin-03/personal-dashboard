# SRD_EAINT-9215_eAuto_To_Reflect_NDDP_Changes_for_STMAB_V1.1_20112025.docx — text copy (27/10/2026, 5:42:15 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad |
| Targeted Platform(s) | eAuto |
| Version | Version 1.1 |
| Latest Revision Date | 20.11.2025 (Thu) |

CONTENTS
1. DOCUMENT INFORMATION 4
1.1 Purpose 4
1.2 Intended Audience 4
1.3 Revision History 4
1.4. Glossary Of Terms 5
1.5 Associated Document(s) – if any 6
2.0 REQUIREMENT 7
2.1 High Level Requirement 7
2.2. Specific Requirement 8
2.2.1: Specific Requirement > UCD 9
2.2.1.1 Insurance Homepage 10
2.2.1.2 Takaful Malaysia Contact Info 13
2.2.1.3 Insurance Purchase – Step 1 15
2.2.1.4 Insurance Purchase – Step 2 17
2.2.1.5 Insurance Purchase – Step 3 20
2.2.1.6 Insurance Purchase – Step 4 23
2.2.1.7 Standard Plan Details 25

# DOCUMENT INFORMATION
This section provides essential details about the System Requirements Document, including its purpose, scope, intended audience, and version history. It serves as a foundational reference for all stakeholders involved in the project, ensuring a shared understanding of the document's objectives and structure.

1.
1. Purpose

The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
The section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference.
Once the document is baselined at Version 1.0, any new changes will be assessed based on their severity. If the changes are significant, an addendum may be created to address them. For less critical updates, a formal change request may be submitted, ensuring that all modifications are properly reviewed, approved, and documented while maintaining alignment with the original requirements and project objectives.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 19.11.2025 (Wed) | Aishah Dhabitah Nor Azman | Initial Draft |
| 1.0 | 20.11.2025 (Thu) | Aishah Dhabitah Nor Azman | To send out for external review |
| 1.1 | 20.11.2025 (Thu) | Aishah Dhabitah Nor Azman | Correction for typing error |

Note: Update made to the document is highlighted in blue

## 1.4. Glossary Of Terms
This section defines key terminology and acronyms used throughout the document, providing clarity and ensuring a common understanding among all audiences of the document.

| # | Abbreviation/ Terminology/Terms | Interpretation/Description |
| 1 | BO user | Back Office user |
| 2 | UCD | Used Car Dealer |

## 1.5 Associated Document(s) – if any
This section records essential information and recommends reviewing the following documents, as they provide valuable support and context for the contents of this document.

| # | Item | Location / URL | Rationale for Relevance |
| | | | |

# 2.0 REQUIREMENT
This section outlines the key specifications needed for the successful development of the system. It includes two main parts: High-Level Requirements , which summarize the project’s goals and essential functions, and Specific Requirements , which detail the exact criteria and tasks the system must meet. Together, these components meant to provide a clear understanding of what is needed to guide the development process and align stakeholder expectations.

# 2.1 High Level Requirement
The section reflects the general requests of stakeholders while providing a broad overview and context for the project’s goals without delving into detailed specifications.

High Level Requirement 2.1.1 ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad

| # | Item | Description |
| a | Problem Statement | a. Present handling ⏎ Currently, eAuto is not in compliance with Bank Negara Malaysia’s NDDP requirements for Syarikat Takaful Malaysia. ⏎ b. Reason for raising this request ⏎ This enhancement is required to ensure compliance with the NDDP requirements. ⏎ c. Enhancement Required ⏎ To implement the updates needed to ensure compliance with the NDDP requirements. ⏎ d. Benefit of implementing this enhancement ⏎ Ensures maximum revenue collection and safeguards the company’s financial interests. |
| b | Targeted Portal(s) | 1. eAuto |
| c | Impacted Key Stakeholder(s) & Impact Description | 1. eAuto User ⏎ Primary reason: Enhancement takes place on eAuto portal. |
| d | Additional Note(s) - if any | |

## 2.2. Specific Requirement
The section offers a detailed breakdown of the high-level requirements, specifying the exact criteria and functionalities that the system must achieve to fulfil the enhancement’s overall objective(s).

#### 2.2.1: Specific Requirement > UCD

| # | Affected Page | Specification Requirement (SR) Reference |
| Figure | Table |
| 2.2.1.1 | Insurance Homepage | Figure 2.2.1.1: Insurance Homepage | Table 2.2.1.1: SR – Insurance Homepage |
| 2.2.1.2 | Takaful Malaysia contact Info | Figure 2.2.1.2: Takaful Malaysia Contact Info | Table 2.2.1.2: SR – Takaful Malaysia Contact Info |
| 2.2.1.3 | Insurance Purchase – Step 1 | Figure 2.2.1.3: Insurance Purchase – Step 1 | Table 2.2.1.3: SR – Insurance Purchase – Step 1 |
| 2.2.1.4 | Insurance Purchase – Step 2 | Figure 2.2.1.4: Insurance Purchase – Step 2 | Table 2.2.1.4: SR – Insurance Purchase – Step 2 |
| 2.2.1.5 | Insurance Purchase – Step 3 | Figure 2.2.1.5: Insurance Purchase – Step 3 | Table 2.2.1.5: SR – Insurance Purchase – Step 3 |
| 2.2.1.6 | Insurance Purchase – Step 4 | Figure 2.2.1.6: Insurance Purchase – Step 4 | Table 2.2.1.6: SR – Insurance Purchase – Step 4 |
| 2.2.1.7 | Standard Plan Details | Figure 2.2.1.7: Standard Plan Details | Table 2.2.1.7: SR – Standard Plan Details |

##### 2.2.1.1 Insurance Homepage
Figure 2.2.1.1: Insurance Homepage

Table 2.2.1.1: SR – Insurance Homepage

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a, b | Motor Insurance | Existing | Display | - | To update the text from ‘Motor Insurance’ to ‘Motor Insurance or Takaful’ |
| 2 | - | Page Title: Insurance | Existing | Display | - | To update the page title from ‘INSURANCE’ to ‘INSURANCE OR TAKAFUL’ |
| 3 | c | Insurance Transaction Listing | Existing | Button | - | To update the button name from ‘INSURANCE TRANSACTION LISTING’ to ‘INSURANCE OR TAKAFUL TRANSACTION LISTING’ |
| 4 | d | Update Insurance Permission | Existing | Button | - | To update button name from ‘UPDATE INSURANCE PERMISSION’ to ‘UPDATE INSURANCE OR TAKAFUL PERMISSION’ |
| 5 | e, f, g, h | Contact Info section | Existing | Display | - | To include Takaful related wording on all Insurance wording in the section ⏎ Current | To amend to |
| Insurance Companies Contact Info | Insurance Companies or Takaful Operator Contact Info |
| Insurance partners | Insurance partners or Takaful Operator |
| Insurance plans | Insurance or Takaful plans |
| Policy Wording | Policy Wording or Certificate Wording |

##### 2.2.1.2 Takaful Malaysia Contact Info
Figure 2.2.1.2: Takaful Malaysia Contact Info

Table 2.2.1.2: SR – Takaful Malaysia Contact Info

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Motor Insurance | Existing | Display | - | Upon clicking on Takaful Malaysia logo on ‘Insurance Companies or Takaful Operator Contact Info’ section, will display a popup for Takaful Malaysia Contact Info. |

##### 2.2.1.3 Insurance Purchase – Step 1
Figure 2.2.1.3: Insurance Purchase – Step 1

Note: The attached picture is provided as a sample. The actual changes will follow the format shown in the sample.
Table 2.2.1.3: SR – Insurance Purchase – Step 1

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a, b, c | Insurance Quotation | Existing | Display | - | To include Takaful related wording on insurance quotation card for Takaful selection ⏎ Insurance | Takaful |
| Sum Insured | Sum Covered |
| Insurance Premium | Takaful Contribution |
| Premium after NCD | Contribution after NCD |

##### 2.2.1.4 Insurance Purchase – Step 2
Figure 2.2.1.4: Insurance Purchase – Step 2

Table 2.2.1.4: SR – Insurance Purchase – Step 2

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a, b, c, d | Takaful Plan section | Existing | Display | - | To display ‘Syarikat Takaful Malaysia Am Berhad (1246486-D)’ on company field ⏎ To amend the field name for takaful: ⏎ Insurance | Takaful |
| Insurance Plan | Takaful Plan |
| Total Sum Covered | Total Sum Covered |
| Period of Insurance | Period of Takaful |

| 2 | e, f, g, h, I, j | Quotation section | | | - | To include Takaful related wording for Takaful selection ⏎ Insurance | Takaful |
| Sum Insured | Sum Covered |
| Insurance Premium | Takaful Contribution |
| Premium after NCD | Contribution after NCD |

| 3 | k | Disclaimer | New | Display | - | To display a disclaimer of relationship between Bintang Prospek and Syarikat Takaful Malaysia ⏎ Disclaimer: ⏎ This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor of Takaful Malaysia |

##### 2.2.1.5 Insurance Purchase – Step 3
Figure 2.2.1.5: Insurance Purchase – Step 3

Table 2.2.1.5: SR – Insurance Purchase – Step 3

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Disclaimer | Existing | Display | - | To display disclaimer under the payment summary section ⏎ Disclaimer: ⏎ By continuing, you agree to our Privacy Policy and terms of Use, you declare to have read, understood and accepted the selected insurer’s or takaful operator’s Product Disclosure Sheet and acknowledge your duty to exercise reasonable care in furnishing information, further declaring that you have provided the information fully and accurately. Furthermore, a standard commission associated with the product will be applied when you proceed with the purchase of this product on this platform. ⏎ Alternatively, for commission-free purchase of similar product, you may visit our respective insurance partner’s or takaful operator’s website or any of their physical branches. ⏎ Notes: ⏎ To display these items in hyperlink: ⏎ 1. Privacy Policy ⏎ 1. Terms of Use ⏎ 1. Product Disclosure Sheet (latest English version) |

##### 2.2.1.6 Insurance Purchase – Step 4
Figure 2.2.1.6: Insurance Purchase – Step 4

Table 2.2.1.6: SR – Insurance Purchase – Step 4

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Wording | Existing | Display | - | To include Takaful related wording ⏎ Current | To amend to |
| Insurance | Insurance or Takaful |
| Insurance Provider | Insurance or Takaful Provider |

| 2 | c | Disclaimer for Refund and Cancellation | New | Display | | To display disclaimer for Refund and Cancellation ⏎ Disclaimer: ⏎ Refund and Cancellation ⏎ Customers who have participated to the takaful product through our website may request a refund or cancel their takaful coverage. ⏎ Kindly refer to the intermediary or the Takaful Operator’s Customer Service Unit (CSU) for further details. |

##### 2.2.1.7 Standard Plan Details
Figure 2.2.1.7: Standard Plan Details

Table 2.2.1.7: SR – Standard Plan Details

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | + More Info / View Plan Details | Existing | Display | - | To update the latest PDS and Certificate Wording (for both BM and English) |
