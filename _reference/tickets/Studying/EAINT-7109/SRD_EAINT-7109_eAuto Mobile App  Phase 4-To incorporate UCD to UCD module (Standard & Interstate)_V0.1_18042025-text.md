# SRD_EAINT-7109_eAuto Mobile App  Phase 4-To incorporate UCD to UCD module (Standard & Interstate)_V0.1_18042025.docx — text copy (29/10/2026, 5:12:20 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | |
| Targeted Platform(s) | |
| Version | |
| Latest Revision Date | |

CONTENTS
1. DOCUMENT INFORMATION 3
1.1 Purpose 3
1.2 Intended Audience 3
1.3 Revision History 3
1.4. Glossary Of Terms 4
1.5 Associated Document(s) – if any 5
2.0 REQUIREMENT 6
2.1 High Level Requirement 6
2.2. Specific Requirement 7
2.2.1: Specific Requirement > 7
2.2.1.1 Title 8
2.2.1.2 Title 10

# 1. DOCUMENT INFORMATION
This section provides essential details about the System Requirements Document, including its purpose, scope, intended audience, and version history. It serves as a foundational reference for all stakeholders involved in the project, ensuring a shared understanding of the document's objectives and structure.

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
The section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference.
Once the document is baselined at Version 1.0, any new changes will be assessed based on their severity. If the changes are significant, an addendum may be created to address them. For less critical updates, a formal change request may be submitted, ensuring that all modifications are properly reviewed, approved, and documented while maintaining alignment with the original requirements and project objectives.

| Version No | Date | Revised By | Reason for Revision |
| | | | |
| | | | |
| | | | |

Note: Update made to the document is highlighted in blue

## 1.4. Glossary Of Terms
This section defines key terminology and acronyms used throughout the document, providing clarity and ensuring a common understanding among all audiences of the document.

| # | Abbreviation/ Terminology/Terms | Interpretation/Description |
| | | |
| | | |
| | | |

## 1.5 Associated Document(s) – if any
This section records essential information and recommends reviewing the following documents, as they provide valuable support and context for the contents of this document.

| # | Item | Location / URL | Rationale for Relevance |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

# 2.0 REQUIREMENT
This section outlines the key specifications needed for the successful development of the system. It includes two main parts: High-Level Requirements , which summarize the project’s goals and essential functions, and Specific Requirements , which detail the exact criteria and tasks the system must meet. Together, these components meant to provide a clear understanding of what is needed to guide the development process and align stakeholder expectations.

# 2.1 High Level Requirement
The section reflects the general requests of stakeholders while providing a broad overview and context for the project’s goals without delving into detailed specifications.

High Level Requirement 2.1.1. Title

| # | Item | Description |
| a | Problem Statement | |
| b | Targeted Portal(s) | |
| c | Impacted Key Stakeholder(s) & Impact Description | |
| d | Additional Note(s) - if any | |

## 2.2. Specific Requirement
The section offers a detailed breakdown of the high-level requirements, specifying the exact criteria and functionalities that the system must achieve to fulfil the enhancement’s overall objective(s).

## 2.2.1: Specific Requirement >

| # | Affected Page | Specification Requirement (SR) Reference |
| Figure | Table |
| | | | |
| | | | |
| | | | |

##### 2.2.1.1 Homepage
Figure 2.2.1.1.1: Title
Table 2.2.1.1: SR – Title

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| | | UCD to UCD | New | Button | - | To display new available service provided in eAuto Mobile App. ⏎ Content: ⏎ UCD to UCD ( RM25 [#FF4000] only*) ⏎ Dealer to Dealer ⏎ Position: Between STMS and eSerahan. ⏎ Function: Click on the button will redirect to UCD to UCD Module Page. ⏎ Notes: May refer to Figure 2.2.1.1.1. |

##### 2.2.1.2 UCD to UCD Module Page
Figure 2.2.1.2.1: Title
Table 2.2.1.2: SR – Title

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | | UCD to UCD | New | Label | - | Refer to page title. ⏎ Page Title: UCD to UCD |
| | | Standard | New | Button | - | Refer to content. ⏎ Content: ⏎ Standard [#0B4C5F] ⏎ Function: Click on the button will redirect to UCD to UCD transaction Step 1. |
| | | Interstate | New | Button | - | Refer to content. ⏎ Content: ⏎ Interstate [#0B4C5F] ⏎ Buyer & Seller in different location ⏎ 1. Seller thumbprint now and save the transaction. [#FF4000] ⏎ 2. Buyer can later login into his own eAuto account to complete the transaction. [#FF4000] ⏎ Function: Click on the button will redirect to Interstate Module page. |
| | | Back button | New | Button | - | Refer to function. ⏎ Function: Click on the button will redirect back to Homepage. |

##### 2.2.1.3 UCD to UCD Standard Transaction Step 1
Figure 2.2.1.3.1: Title
Table 2.2.1.3.1: SR – Title

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| | | Fingerprint Verification | New | Label | - | To display when mobile app could not detect dermalog device. ⏎ Title: Fingerprint Verification ⏎ Content: ⏎ Please plugin the dermalog to continue fingerprint verification. ⏎ Notes: May refer to Figure |
| | | Progress Bar | New | - | - | To display UCD to UCD transaction progress according to the number of steps available and the current step that UCD is on. ⏎ System handling: ⏎ 1. To update accordingly as UCD progress through the transaction. ⏎ 1. To add a checkmark for every step passed. ⏎ 1. Click on the progress bar to open the Progress Details section. (Refer to item #4) |
| | | Back button | New | Button | - | Refer to function. ⏎ Function: Click on the button will redirect back to UCD to UCD Module page. |
| | | Progress Details | New | Read Only | - | To display UCD to UCD Step 1 to 6 with more detail and show current update on every step. ⏎ Section Header: ⏎ Progress ⏎ Section Title: ⏎ New STMS transaction from UCD (used car dealer) to UCD (used car dealer) ⏎ Section Content: ⏎ 1. Seller (Owner) Authentication ⏎ 1. Seller & Vehicle Details ⏎ 1. Buyer (Buyer) Authentication ⏎ 1. JPJ Check ⏎ 1. Payment ⏎ 1. JPJ Transfer ⏎ Notes: ⏎ 1. To add a checkmark for every step passed. |
| | | X | New | Button | - | Refer to function. ⏎ Function: Click on the button will close Progress Details section and remain at Step 1. |

Figure 2.2.1.3.1: Title
Table 2.2.1.3.1: SR – Title

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| | | Seller Authentication | New | Label | - | Refer to page title. ⏎ Page title: Seller Authentication |
| | | Seller’s IC Details | New | - | - | Refer to function. ⏎ Function: To auto-populate with seller’s IC details after UCD click on [Read MyKad] button. |
| | | Cancel | New | Button | - | Click on [Cancel] button will prompt confirmation popup. ⏎ Popup Message Title: ⏎ Cancel ⏎ Popup Message Content: ⏎ Sure to cancel? ⏎ Popup Button: ⏎ 1. “No”: Close the popup and remain at Step 1. ⏎ 1. “Yes”: Close the popup and redirect to UCD to UCD Module page. |
| | | Read MyKad | New | Button | - | Refer to function. ⏎ Function: Click on [Read MyKad] button to proceed with MyKad scanning. |
| | | Verify | New | Button | - | Refer to function. ⏎ Function: ⏎ 1. Once system auto-populate Seller’s IC details, [Read MyKad] button will be hidden and [Verify] button will be display. ⏎ 1. Click on [Verify] button to proceed with thumbprint scanning. |
| | | Next | New | Button | - | Refer to function. ⏎ Function: ⏎ 1. Once verification passed on thumbprint scanning, [Verify] button will be hidden and [Next] button will be display. ⏎ 1. Click on [Next] button to redirect to Step 2. |

Figure 2.2.1.4.1: Title
Table 2.2.1.4.1: SR – Title

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| | | Seller & Vehicle Details | New | Label | - | Refer to page title. ⏎ Page title: Seller & Vehicle Details |
| | | Seller Authentication Details | New | Read Only | - | To display Seller details that was acquired during Step 1. ⏎ Content: ⏎ 1. MyKad No ⏎ 1. Name ⏎ 1. Address ⏎ 1. MyKad Picture |
| | | Company Details | New | Button | M | Refer to function. ⏎ Function: ⏎ 1. Click on [Company Details] button to redirect to Company Details page. (Refer to) |
| | | Seller’s Contact Details | New | Button | M | Refer to function. ⏎ Function: ⏎ 1. Click on [Seller’s Contact Details] button to redirect to Seller’s Contact Details page. (Refer to) |
