# SRD_EAINT-5566_STMS_Mobile Application_V1.0_20250122.docx — text copy (29/10/2026, 5:12:19 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto] Mobile App – Phase 1 |
| Targeted Platform(s) | eAuto – UCD |
| Version | Version 1.0 |
| Latest Revision Date | 22.01.2025 (Wed) |

CONTENTS
1. DOCUMENT INFORMATION 3
1.1 Purpose 3
1.2 Intended Audience 3
1.3 Revision History 3
1.4. Glossary Of Terms 4
1.5 Associated Document(s) – if any 5
2.0 REQUIREMENT 6
2.1 High Level Requirement 6
2.2. Specific Requirement 8
2.2.1: Specific Requirement > UCD Portal 8
2.2.1.1 Mobile Application - Login 9
2.3.1.1 Mobile Application – Homepage 15
2.4.1.1 Mobile Application – STMS (Module Page) 18
2.5.1.1 Mobile Application – STMS (Create Transaction) 20
2.6.1.1 Mobile Application – STMS (Transaction Listing) 63
2.7.1.1 Mobile Application – STMS (Company) SSM Handling 74
2.8.1.1 Mobile Application – Force Update 82
2.9.1.1 Mobile Application – Maintenance Page 85

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
| 0.1 | 25.11.2024 (Mon) | Johnes Khar Lai Huat | Initial Draft |
| 0.2 | 31.12.2024 (Tues) | Johnes Khar Lai Huat | Updated Document based on latest requirement |
| 0.3 | 21.01.2025 (Tues) | Johnes Khar Lai Huat | Updated Document based on latest requirement |
| 1.0 | 22.01.2025 (Wed) | Johnes Khar Lai Huat | Updated Document |

Note: Update made to the document is highlighted in blue

## 1.4. Glossary Of Terms
This section defines key terminology and acronyms used throughout the document, providing clarity and ensuring a common understanding among all audiences of the document.

| # | Abbreviation/ Terminology/Terms | Interpretation/Description |
| 1 | BO user | Back Office user |
| 2 | UCD | Used Car Dealer |
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

High Level Requirement 2.1.1 eAuto – Mobile Application

| # | Item | Description |
| a | Problem Statement | a. Present handling ⏎ Current eAuto system does not have any mobile application. ⏎ b. Enhancement Required: ⏎ To develop a mobile application that has similar functionalities with current eAuto web portal. |
| b | Targeted Portal(s) | a. eAuto – UCD |
| c | Impacted Key Stakeholder(s) & Impact Description | a. eAuto – UCD ⏎ Primary reason: Enhancement takes place on UCD portal ⏎ b. eAuto – Back Office users ⏎ Primary reason: Enhancement takes place on BO portal |
| d | Additional Note(s) - if any | 1. This is phase 1 for this enhancement ⏎ 1. The enhancement is phased out in order to make it feasible to deploy asap. ⏎ 1. Listing has existing records |

## 2.2. Specific Requirement
The section offers a detailed breakdown of the high-level requirements, specifying the exact criteria and functionalities that the system must achieve to fulfil the enhancement’s overall objective(s).

#### 2.2.1: Specific Requirement > UCD Portal

| # | Affected Page | Specification Requirement (SR) Reference |
| Figure | Table |
| | | | |
| | | | |
| | | | |

2.2.1.1 Mobile Application - Login

Figure 2.2.1.1: Login page
[image: A screenshot of a login box

Description automatically generated]
Figure 2.2.1.2: Show password Figure 2.2.1.3: Hide password
[image: A screenshot of a login box

Description automatically generated] [image: A screenshot of a login box

Description automatically generated]
Figure 2.2.1.4: Login Error message Figure 2.2.1.5: Session Expired message
[image: A screenshot of a login screen

Description automatically generated] [image: A screenshot of a login screen

Description automatically generated]
Table 2.2.1.1: SR – Login Page

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Username | New | Text field | M | a. Text field with “Enter username” placeholder. ⏎ b. Mandatory field that requires user to enter their existing username. ⏎ Limitation: ⏎ Currently there is no limitation on UCD portal (website) |
| 2 | b | Password | New | Text field | M | a. By default, text field will be set to hidden. ⏎ b. Text field with “Enter password” placeholder. ⏎ c. Mandatory field that requires user to enter their existing password. ⏎ Limitation: ⏎ Currently there is no limitation on UCD portal (website) |
| 3 | c | View password | New | Button | - | a. Click to view hidden password (Figure 2.1.1.2). ⏎ b. Click to hide password (Figure 2.1.1.3). |
| 4 | d | Login | New | Button | - | System handling: ⏎ When user clicks on “Login” button, system has a validation check to ensure username and password exists in database. ⏎ Login successful: ⏎ If both username and password match and exist, redirect user to homepage. ⏎ Login failed: ⏎ If username or password does not match, system displays Login Error message above Username (refer to item #5). |
| 5 | Figure 2.1.1.4 | Login Error | New | Label | - | a. Display login error message above Username field. ⏎ b. System will display login error message if user fail login authentication. ⏎ Error Message Title: ⏎ Login Error ⏎ Error Message Content: ⏎ Please check your login name or password and try again. |
| 6 | Figure 2.1.1.5 | Session Expired | New | Label | - | a. Display session expired message above Username field. ⏎ b. System will display session expired message if user has not accessed the application in more than 1 hour (cookie expire time). ⏎ Error Message Title: ⏎ Your session has expired ⏎ Error Message Content: ⏎ Please log in again to continue. |

2.3.1.1 Mobile Application – Homepage
Figure 2.3.1.1: Mobile App- Homepage Figure 2.3.1.2: Mobile App- Homepage (Logout)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.3.1.1: Mobile App- Homepage

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Logout button | New | Button | - | a. Click on “Logout” button to prompt confirmation popup (refer item #4). |
| 2 | b | UCD Details | New | Read-only | - | a. To display logged-in UCD details: ⏎ 1. Company Name ⏎ 1. UCD User’s Name ⏎ 1. RHB Account Number: Active/Inactive |
| 3 | c | UCD Services | New | Text-Button | - | a. To display available services provided in eAuto Mobile App: ⏎ 1. STMS ⏎ 1. eSerahan ⏎ 1. BMK (Coming Soon) ⏎ 1. Insurance (Coming Soon) ⏎ 1. JomCheck (Coming Soon) |
| 4 | Figure 2.3.1.2 | Logout confirmation popup | New | Popup | - | a. To prompt Logout confirmation popup when UCD click on “Logout” button (refer item #1) ⏎ Popup Title: ⏎ Logout ⏎ Popup Message: ⏎ Are you sure want to logout? ⏎ Popup Buttons: “No” & “Yes” ⏎ 1. Click “No” to close popup and remain at Homepage. ⏎ 1. Click “Yes” to close popup and redirect user to Login Page (refer Figure 2.2.1.1) |

2.4.1.1 Mobile Application – STMS (Module Page)
[image: A screenshot of a phone

Description automatically generated]
Table 2.4.1.1: SR – STMS (Module Page)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | STMS | New | Label | - | Page title: ⏎ STMS |
| 2 | a | STMS Transaction Listing | New | Text-button | - | a. Click on “STMS Transaction Listing” to redirect UCD to STMS Transaction Listing page (refer Figure 2.6.1.1). |
| 3 | b | Create New Transaction | New | Text-button | - | a. Click on “Create New Transaction” to redirect UCD to STMS Category selection page (refer Figure 2.5.1.1). ⏎ System Handling: ⏎ Note: Similar to UCD web portal |

2.5.1.1 Mobile Application – STMS (Create Transaction)
Figure 2.5.1.1: Category
[image: A screenshot of a phone

Description automatically generated]
Table 2.5.1.1: SR – STMS Create Transaction (Category)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | New STMS Transaction | New | Label | - | Page title: ⏎ New STMS Transaction |
| 2 | a | Sila Pilih Kategori ID PENJUAL | New | Button | - | Title: ⏎ Sila Pilih Kategori ID PENJUAL: - ⏎ Content: ⏎ Display seller category for user to select: - ⏎ 1. MALAYSIAN ⏎ (马来西亚公民) ⏎ 1. MyPR – PEMASTAUTIN TETAP ⏎ (红色身份证) ⏎ 1. SYARIKAT ⏎ (公司) ⏎ System to redirect UCD to Step 1 after selecting Category. |
| 3 | b | Back button | New | Button | - | Click to redirect UCD to STMS Module page. |

Figure 2.5.2.1: Dermalog not detected Figure 2.5.2.2: Progress details
[image: A screen shot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.2.1: SR – STMS (Dermalog not detected) & (Progress details)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Fingerprint Verification | New | Label | - | To display when system cannot detect dermalog device. ⏎ Title: ⏎ Fingerprint Verification ⏎ Content: ⏎ Please plugin the dermalog to continue fingerprint verification |
| | a | Progress Bar | New | - | - | To display STMS transaction progress according to the number of steps available and the current step that user is on. ⏎ System handling: ⏎ To update accordingly as user progress through the transaction. ⏎ Note: To add a checkmark for every step passed. ⏎ Clickable UI: ⏎ Able to click on the progress bar to open the Progress Details section to enquire more details on the steps. |
| | B | Back button | New | Button | - | Click to return back to STMS Module page. |
| | c | Progress Details | New | Read-only | - | To display STMS steps 1 to 6 with more detail and show current update on every step. ⏎ Section Header: ⏎ Progress ⏎ Section Title: ⏎ STMS transaction from <category> to UCD (Used Car Dealer) ⏎ Section Content: ⏎ Please continue the following steps to complete the transaction. ⏎ 1. Seller Authentication ⏎ 1. Seller & Vehicle Details ⏎ 1. Buyer Authentication ⏎ 1. JPJ Check ⏎ 1. Payment ⏎ 1. JPJ Transfer ⏎ Note: To add a checkmark for every step passed. This section is not clickable and is only for view. |
| | D | Close button | New | Button | - | Click to close Progress Details section |

Figure 2.5.3.1: Mobile App – STMS (Step 1: Seller Authentication)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.3.1: SR – STMS (Step 1: Seller Authentication)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Seller Authentication | New | Label | - | Page title: ⏎ Seller Authentication |
| 2 | a | User IC Details | New | - | - | a. Text fields that do not allow user to input manually. ⏎ b. Will auto populate with seller’s IC details once click on “Read MyKad” (refer to item #5). |
| 3 | b | User Instruction | New | Read-only | - | User instruction to help guide user on how to complete Step 1 successfully. |
| 4 | c | Cancel | New | Button | - | Click on “Cancel” to prompt confirmation popup. ⏎ Popup Message Title: ⏎ Cancel ⏎ Popup Message Content: ⏎ Sure to cancel? ⏎ Popup Button: “No” and “Yes” ⏎ 1. Click on “No” to close popup and remain at STMS Step 1. ⏎ 1. Click on “Yes” to close popup and redirect to STMS Create Transaction (Category) page. |
| 5 | d | Read MyKad | New | Button | - | a. Click on “Read MyKad” to proceed with MyKad scanning. ⏎ b. Text fields in User IC Details (refer to item #2) will auto populate with the IC details that was inserted in the dermalog. |
| 6 | e | Verify | New | Button | - | Click on “Verify” to proceed with thumb print scanning. |
| 7 | f | Next | New | Button | - | Click on “Next” to redirect to STMS Step 2. |

Figure 2.5.4.1: Mobile App – STMS (Step 2: Seller & Vehicle Details)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.4.1: SR – STMS (Step 2: Seller & Vehicle Details)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Seller & Vehicle Details | New | Label | - | Page title: ⏎ Seller & Vehicle Details |
| 2 | a | Seller Authentication Details | New | Read-only | - | a. To display seller details that was acquired during STMS Step 1. ⏎ b. This detail section includes seller: - ⏎ 1. MyKad No ⏎ 1. Name ⏎ 1. Address ⏎ 1. MyKad Picture ⏎ c. This section is not clickable and cannot be edited. |
| 3 | b | Seller & Vehicle Details | New | Button | - | a. Include two separate buttons “Seller’s Contact Details” and “Vehicle Details”. ⏎ b. By clicking on each button, user will be redirected to respective pages. ⏎ 1. Click on “Seller’s Contact Details” button to redirect to Seller’s Contact Details page (refer Figure 2.5.4.2). ⏎ 1. Click on “Vehicle Details” button to redirect to Vehicle Details page (refer Figure 2.5.4.4). |
| 4 | c | Next | New | Button | - | Click on “Next” to proceed to STMS Step 3. ⏎ System handling: ⏎ When click on “Next” button, system will run a validation check to ensure both sections in Seller & Vehicle Details have been completed. If system detects any incomplete section, system will display an error message (refer item #5). If all sections have been completed redirect to Step 3. |
| 5 | d | Incomplete Seller & Vehicle Details | New | Label | - | Display error message below Seller & Vehicle Details label to indicate incomplete sections in seller & vehicle details. ⏎ Error message content: ⏎ Please complete the below sections to continue. |

Mobile App – STMS (Step 2: Seller’s Contact Details)
Figure 2.5.4.2: Seller’s Contact Details Figure 2.5.4.3: Incomplete Contact Details
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.4.2: SR – STMS (Step 2: Seller’s Contact Details)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Seller’s Contact Details | New | Label | - | Page title: ⏎ Seller’s Contact Details |
| 2 | a | Mobile No | New | Text field | M | a. Text field with “Enter mobile no” text. ⏎ b. Mandatory field that requires user to enter their mobile no. ⏎ System handling: ⏎ 1. Only numbers (0-9) are allowed. ⏎ 1. Only 9 to 11 digits are allowed. |
| 3 | b | Email Address | New | Text field | M | a. Text field with “Enter email address” text. ⏎ b. Mandatory field that requires user to enter their email address. ⏎ System handling: ⏎ Only letters (a-z), numbers (0-9), dot (.), underscore (_) and hyphen (-) are allowed. |
| 4 | c | Address | New | Text field | M | a. By default address field will be auto filled with address information acquired from seller’s MyKad on Step 1. ⏎ b. UCD still allowed to manually edit address field. ⏎ System Handling: ⏎ Note: Similar to UCD web portal |
| 5 | d | Same as MyKad | New | Checkbox | - | a. By default checkbox will be ticked. ⏎ b. Re-tick checkbox will repopulate address field with seller’s MyKad address on Step 1. ⏎ Note: Will not include this function in Phase 1 |
| 6 | e | Confirm | New | Button | - | Click on “Confirm” to return back to Seller & Vehicle Details page (refer Figure 2.5.4.1). ⏎ Validation: ⏎ To have validation checking to ensure all fields are filled up successfully. System will display error message if it detects incomplete fields (refer Figure 2.5.4.3). |

Mobile App – STMS (Step 2: Vehicle Details)
Figure 2.5.4.4: Vehicle Details Figure 2.5.4.5: Incomplete Vehicle Details
[image: A screenshot of a phone

Description automatically generated]
Table 2.5.4.3: SR – STMS (Step 2: Vehicle Details)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Vehicle Details | New | Label | - | Page title: ⏎ Vehicle Details |
| 2 | a | Vehicle No | New | Text Field | M | a. Text field with “Enter vehicle no” placeholder. ⏎ b. Mandatory field that requires user to enter their vehicle no. ⏎ System handling: ⏎ Accept only char (case insensitive), letters (a-z), numbers (0-9) and auto capitalize. |
| 3 | b | Chassis No | New | Text Field | M | a. Text field with “Enter chassis no” placeholder. ⏎ b. Mandatory field that requires user to enter their chassis no. ⏎ System handling: ⏎ Accept only char (case insensitive), letters (a-z), numbers (0-9), special characters (/*-), blank space and auto capitalize. |
| 4 | c | Engine No | New | Text Field | M | a. Text field with “Enter engine no” placeholder. ⏎ b. Mandatory field that requires user to enter their engine no. ⏎ System handling: ⏎ Accept only char (case insensitive), letters (a-z), numbers (0-9), special characters (/*-), blank space and auto capitalize. |
| 5 | d | Vehicle Make / Model | New | Button | M | Click on “Vehicle Make / Model” button to open Vehicle Make section (refer Figure 2.5.4.6). |
| 6 | e | Manufacturing Year | New | Button | M | Click on “Manufacturing Year” button to open Manufacturing Year section (refer Figure 2.5.4.9). |
| 7 | f | Confirm | New | Button | - | Click on “Confirm” to return back to Seller & Vehicle Details page (refer Figure 2.5.4.1). ⏎ Validation: ⏎ To have validation checking to ensure all fields are filled up successfully. System will display error message if it detects incomplete fields (refer Figure 2.5.4.5). |

Mobile App – STMS (Step 2: Vehicle Details 2.0)
Figure 2.5.4.6: Search Vehicle Make Figure 2.5.4.7: Search Vehicle Make (Other) Figure 2.5.4.8: Search Vehicle Model
[image: A screenshot of a search box

Description automatically generated] [image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Figure 2.5.4.9: Search Vehicle Model Figure 2.5.4.10: Search Vehicle Model
[image: A screenshot of a car registration

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.4.4: SR – STMS (Step 2: Vehicle Details 2.0)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Search vehicle make | New | Text Field | - | a. Search filter that allows user to search for a specific vehicle make from the list. ⏎ b. If the search input has no match, listing will display an “Other” option that user can select (refer Figure 2.5.4.7). ⏎ c. After a vehicle make has been selected, system will redirect to Vehicle Model section (refer Figure 2.5.4.8). |
| 2 | b | X button | New | Button | - | Click on “X” button to close Vehicle Make section and remain at Vehicle Details page. |
| 3 | c | Search vehicle model | New | Text Field | - | a. Search filter that allows user to search for a specific vehicle model from the list. ⏎ b. If the search input has no match, listing will display an “Other” option that user can select, similar to vehicle make section. ⏎ Note: To remove “Other” option in Mobile App. |
| 4 | d | Back button | New | Button | - | Click on the back button to return to Vehicle Make section (refer Figure 2.5.4.6). |
| 5 | e | Manufacturing year | New | Date picker | - | Display year picker for user to select. ⏎ System handling: ⏎ Display current year as default and allow to scroll back to 60 years from current year. |
| 6 | f | X button | New | Button | - | Click on “X” button to close Manufacturing Year section and remain at Vehicle Details page. |
| 7 | g | Seller & vehicle details completed | New | - | - | Add a checkmark at each section once completed. |

Figure 2.5.5.1: Mobile App – STMS (Step 3: Buyer Authentication)
Note - STMS Step 3: Buyer Authentication is similar to STMS Step 1: Seller Authentication. Only changes are towards the page title.
[image: A screenshot of a cell phone

Description automatically generated]
Table 2.5.5.1: SR – STMS (Step 3: Buyer Authentication)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Buyer Authentication | New | Label | - | Page title: ⏎ Buyer Authentication |

Mobile App – STMS (Step 4: Submission (JPJ Checking))
Figure 2.5.6.1: Step 4: Submission (JPJ Checking) Figure 2.5.6.2: Step 4: Submission (JPJ Check Popup)
[image: Screens screenshot of a screenshot of a phone

Description automatically generated] [image: Screens screenshot of a phone

Description automatically generated]
Table 2.5.6.1: SR – STMS (Step 4: Submission (JPJ Checking))

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Submission (JPJ Checking) | New | Label | - | Page title: ⏎ Submission (JPJ Checking) |
| 2 | a | Seller/Dealer Details tab | New | Button | - | a. Separate tab that contains seller and dealer details. ⏎ b. To display either seller or dealer details depending on which tab is clicked on. ⏎ c. By default, page will select and display seller tab. |
| 3 | b | Seller details | New | Read-only | - | Seller details contain seller’s information such as: - ⏎ 1. Name ⏎ 1. MyKad No ⏎ 1. Vehicle No |
| 4 | c | Engine/Chassis No | New | Text Field | - | a. Engine/Chassis No field will contain input that was given in Step 2. ⏎ b. This fields are still editable on Step 4. ⏎ c. Contain same validation checking as Engine & Chassis No field in Step 2. |
| 5 | d | Next button | New | Button | - | Click “Next” to open up JPJ Check popup (refer item #7). ⏎ System Handling: ⏎ Note: Similar to UCD web portal |
| 6 | e | Dealer details | New | Read-only | - | Dealer details contain dealer’s information such as: - ⏎ 1. Used Car Dealer’s Name ⏎ 1. Used Car Dealer’s MyKad No ⏎ 1. Company Name ⏎ 1. Company Reg No ⏎ 1. Company Address ⏎ 1. Company Contact No |
| 7 | f | JPJ Check popup | New | Popup | - | a. To prompt JPJ Check popup when UCD clicks on “Next” button (refer item #5) ⏎ b. Checkbox will be unticked by default. ⏎ c. Tick checkbox to enable “Proceed JPJ Check” button (Item #8) ⏎ d. Click on “Back” button to close popup and remain at Step 4. |
| 8 | g | Proceed JPJ Check button | New | Button | - | a. Button disabled by default. ⏎ b. Only enable button once UCD ticks on JPJ Check popup checkbox (refer item #7). ⏎ c. Click “Proceed JPJ Check” to proceed with JPJ Enquiry. ⏎ System Handling: ⏎ Note: Similar to UCD web portal |

Mobile App – STMS (Step 4: Submission (JPJ Checking) 2.0)
Figure 2.5.6.4: Step 4 Success Figure 2.5.6.5: Step 4 Failed Figure 2.5.6.6: Step 4 Engine/Chassis No
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a car registration

Description automatically generated]
Table 2.5.6.2: SR – STMS (Step 4: Submission (JPJ Checking) 2.0)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | JPJ Enquiry status | New | Label | - | Display latest JPJ Enquiry status ⏎ Scenario A: ⏎ If pass JPJ Enquiry: - ⏎ Status header: ⏎ JPJ Enquiry Success ⏎ Status content: ⏎ You may proceed to the next step. ⏎ Scenario B: ⏎ If failed JPJ Enquiry: - ⏎ Status header: ⏎ JPJ Enquiry Failed ⏎ Status content: ⏎ <jpj_error_description> |
| 2 | b | JPJ Enquiry tab | New | Button | - | a. JPJ Enquiry tab will be added into the existing Seller/Details tab. ⏎ b. Click on “JPJ Enquiry” tab to display JPJ Enquiry details (refer item #3). |
| 3 | c | JPJ Enquiry details | New | Read-only | - | JPJ Enquiry details contain information such as: - ⏎ 1. JPJ Enquiry Status ⏎ 1. Valid As At ⏎ 1. Blacklisted ⏎ 1. Hak Milik Dituntut ⏎ 1. Condition Code ⏎ 1. Response Code |
| 4 | d | Continue Later button | New | Button | - | Click on “Continue Later” button to redirect to STMS listing page. |
| 5 | e | Next button | New | Button | - | Click on “Next” button to proceed to STMS Step 5. ⏎ System handling: ⏎ The “Next” button will only be available if user pass JPJ Enquiry at Step 4 successfully. |
| 6 | f | Resubmit button | New | Button | - | a. Click on “Resubmit” button to resubmit Step 4 JPJ Check. ⏎ System handling: ⏎ The “Resubmit” button will only be available if user fails JPJ Enquiry at Step 4. |
| 7 | g | Engine/Chassis No | New | Text Field | M | a. Users are still allowed to edit engine and chassis no field under the Seller Details tab. ⏎ b. Validation checking for both fields are still the same as previously. |

Mobile App – STMS (Step 5: Payment)
Figure 2.5.7.1: Make Payment page Figure 2.5.7.2: View Transaction Details
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.7.1: SR – STMS (Step 5: Payment)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Payment | New | Label | - | Page title: ⏎ Payment |
| 2 | a | Transaction Details | New | Read-only | - | Display the vehicle no and seller name with an additional text button that allows user to click and view additional details of the transaction (refer item #3). ⏎ Section Content: ⏎ 1. <vehicle no> ⏎ *Acquired from Step 2* ⏎ 1. <Seller’s name> ⏎ * Acquired from Step 1* ⏎ 1. View Transaction Details ⏎ *Clickable text* |
| 3 | - | View Transaction Details | New | Text button | | Click on “View Transaction Details” text button to bring up the Seller/Dealer Details tab (refer item #7) |
| 4 | b | Payment Summary | New | Read-only | - | Display payment summary in detail with the total amount payable. ⏎ Payment Summary content but not limited to: - ⏎ 1. JPJ Fee ⏎ 1. eAuto Fee ⏎ 1. Service Tax 8% ⏎ 1. Total Amount Payable |
| 5 | c | Continue Later button | New | Button | - | Click on “Continue Later” button to redirect to STMS listing page. |
| 6 | d | Make Payment button | New | Button | - | Click on “Make Payment” button to proceed to STMS Step 6. ⏎ Scenario A : If payment is successful, user will be redirected to Step 6. ⏎ Scenario B: If payment failed, user would remain at Step 5 with error message displayed (refer Figure 2.5.7.3). |
| 7 | e | Seller/Dealer Details tab | New | Button | - | a. To display either seller or dealer details depending on which tab is clicked on. ⏎ b. By default, page will select and display seller tab. |
| 8 | f | X button | New | Button | | Click on “X” button to close Seller/Dealer Details section and remain at Payment page. |

Mobile App – STMS (Step 5: Payment -Failed)
Figure 2.5.7.3: Payment Failed page Figure 2.5.7.4: Payment Failed page (RE)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.5.7.2: SR – STMS (Step 5: Payment)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Payment Failed | New | Label | - | Display a Payment Failed error message below the progress bar if user hit payment failed. |
| 2 | b | Payment History | New | Read-only | - | a. Display Payment History to notify user on the payment failed details. ⏎ Payment History Content: ⏎ 1. Date & Time ⏎ 1. RHB (<payment_id>-<vehicle no>) – Failed (<RHB_error_code> - <Error desc>) ⏎ b. Payment History will only display the latest update. ⏎ c. To include a “Show All” text button to allow user to click and view a complete view of the entire Payment History. |
| 3 | c | Retry button | New | Button | - | Click on “Retry” button to retry payment again. If payment is successful, user will be redirected to STMS Step 6. |
| 4 | Figure 2.5.7.4 | Retry with timer button | New | Button | - | In cases where user hits <RHB Error = RE>, the “Retry” button will be disabled with a countdown timer. Once the countdown has completed, the “Retry” button will be enabled back. |

Mobile App – STMS (Step 6: JPJ Transfer)
Figure 2.5.8.1: JPJ Transfer Successful
[image: Screens screenshot of a phone

Description automatically generated]
Table 2.5.8.1: JPJ Transfer Successful

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | JPJ Transfer | New | Label | - | Page title: ⏎ JPJ Transfer |
| 2 | a | Back button | New | Button | - | Click on “Back” button to redirect UCD to STMS Module page. |
| 3 | b | View Details button | New | Button | - | Click on “View Details” button to redirect UCD to that transaction’s details page. |
| 4 | c | Download Documents button | New | Button | - | Click on “Download Documents” to display Download Documents tab (refer item #5). |
| 5 | d | Download Documents tab | New | Text button | - | Click on “Slip Pengesahan” or “Invoice” to download respective files in PDF format. |

2.6.1.1 Mobile Application – STMS (Transaction Listing)
Mobile App – STMS (Transaction Listing)
Figure 2.6.1.1: Default Listing Figure 2.6.1.2: Listing with transactions Figure 2.6.1.3: No record found
[image: A screenshot of a search box

Description automatically generated] [image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.6.1.1: SR – STMS (Transaction Listing)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | STMS Transaction Listing | New | Label | - | Page title: ⏎ STMS Transaction Listing |
| 2 | a | Back button | New | Button | - | Click on “Back” button to redirect back to STMS module page. |
| 3 | b | Refresh button | New | Button | - | Click on “Refresh” button to refresh the listing page. ⏎ System Handling: ⏎ To update transaction listing with the latest transaction created. |
| 4 | c | Search & Filter button | New | Button | - | Click on “Search & Filter” to redirect to Search & Filter page (refer Figure 2.6.1.4). |
| 5 | d | Apply Search button | New | Button | - | Click on “Apply Search” to redirect to Search & Filter page (refer Figure 2.6.1.4). |
| 6 | Figure 2.6.1.2 | - | New | - | - | System Handling: ⏎ To add a number indicator in Search & Filter button according to the number of filters added. |
| 7 | Figure 2.6.1.2 | - | New | - | - | To display transaction listing according to the latest transaction created. |
| 8 | Figure 2.6.1.3 | - | New | Label | - | Display “No record found. Try again.” page when there is no record found after search. |

Mobile App – STMS (Search & Filter)
Figure 2.6.1.4: Search & Filter Figure 2.6.1.5: Date Created Figure 2.6.1.6: Date Created (Month & Year)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a calendar

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]

Figure 2.6.1.7: Transaction Status Figure 2.6.1.8: Search & Filter with input
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.6.1.2: SR – STMS (Search & Filter)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Search & Filter | New | Label | - | Page title: ⏎ Search & Filter |
| 2 | a | Vehicle No | New | Text field | - | a. Text field with “Enter vehicle no” placeholder. ⏎ b. Validation checking similar to existing UCD portal. |
| 3 | b | Transaction No | New | Text field | - | a. Text field with “Enter transaction no” placeholder. ⏎ b. Validation checking similar to existing UCD portal. |
| 4 | c | Date Created | New | Date picker | - | a. Text field with “Select date created” placeholder. ⏎ b. Click to open Date Created section (refer Figure 2.6.1.5). ⏎ Note: ⏎ Will not include this function in Phase 1 |
| 5 | d | Transaction Status | New | Button | - | a. Text field with “Select transaction status” placeholder. ⏎ b. Click to open Transaction Status section (refer Figure 2.5.1.7). |
| 6 | e | Reset/Search button | New | Button | - | System Handling: ⏎ To disable both Reset and Search buttons if all search & filter fields are empty. |
| 7 | Figure | Date calendar | New | Date picker | - | a. By default current date will be selected. ⏎ b. Dates after current date will be disabled. ⏎ c. Allow user to select any specific date range in 30 days period. |
| 8 | f | Month & Year picker | New | Button | - | Click to display a month & year picker for user to select. ⏎ System handling: ⏎ Display current month & year as default and allow to scroll back to 10 years from current year. |
| 9 | g | Month navigator | New | Button | | To include a back and next button to navigate through the calendar according to the months. |
| 10 | h | Reset date button | New | Button | - | Click on “Reset” button to reset date created filter. |
| 11 | i | Apply Date button | New | Button | - | Click on “Apply Date” button to apply date created filter. |
| 11 | j | Reset button | New | Button | - | Click on “Reset” button to clear all fields and return it back to default state. |
| 12 | k | Search button | New | Button | - | Click on “Search” button to search and display existing records that matches with filters added. |

Mobile App – STMS (Transaction Details)
Figure 2.6.2.1: Transaction Details page (Failed) Figure 2.6.2.1: Transaction Details page (Pending)
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.6.2.1: SR – STMS (Search & Filter)

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | - | Search & Filter | New | Label | - | Page title: ⏎ Search & Filter |
| 2 | a | Transaction status | New | Label | - | Display transaction’s status accordingly. |
| 3 | b | Transaction details tab | New | Button | - | Transaction details tab allows user to navigate through the transaction details according to tab selected. |
| 4 | c | Resubmit button | New | Button | - | System Handling: ⏎ To display a “Resubmit” button if the transaction’s status is at: - ⏎ 1. Pending ⏎ 1. Failed ⏎ Note: Transaction failed due to payment or 1 st JPJ Enquiry only are allowed to resubmit |
| 5 | d | Back button | New | Button | - | Click on the back button to redirect back to STMS Transaction Listing page. |

2.7.1.1 Mobile Application – STMS (Company) SSM Handling
Figure 2.7.1.1: SSM Permission Checking
[image: A screenshot of a phone

Description automatically generated] [image: A screenshot of a phone

Description automatically generated]
Table 2.7.1.1: SSM Permission Checking

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | SYARIKAT ⏎ (公司) | New | Button | - | a. SSM Permission checking to be done on Category selection page. ⏎ b. To add SMM Permission checking when UCD clicks on “SYARIKAT (公司)”. ⏎ System Handling: ⏎ If system detects UCD has company level SSM Permission, it will prompt the SSM Error Popup (refer Figure Figure 2.7.1.3). |
| 2 | b | Next button | New | Button | - | a. SSM Permission checking to be done on STMS: Company Step 1 to 2 (After thumbprint verification). ⏎ b. To add SSM Permission checking when UCD clicks on “Next” button. ⏎ System Handling: ⏎ If system detects UCD has company level SSM Permission, it will prompt the SSM Error Popup (refer Figure Figure 2.7.1.3). |

If UCD (without SSM perm) has uploaded 3 files in Step 2 and then re-enable SSM permission; system would not prompt any error message and would allow UCD to continue with the transaction as usual.
Note: This is the existing behavior in Web for SSM Permission handling
Figure 2.7.1.2: SSM File Checking
[image: A screenshot of a phone

Description automatically generated]
Table 2.7.1.2: SSM File Checking

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | a | Resubmit button | New | Button | - | a. SSM File checking to be done on STMS Transaction Details page. ⏎ b. To add SMM File checking when UCD clicks on “Resubmit” button. ⏎ System Handling: ⏎ If system detects the transaction contains less than three Files uploaded in Step 2, it will prompt the SSM Error Popup (refer Figure Figure 2.7.1.3). |

Figure 2.7.1.3: SSM Error Popup
[image: A screenshot of a phone

Description automatically generated]
Table 2.7.1.3: SSM Error Popup

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | Figure 2.7.1.3 | SSM Error Popup | New | Popup | - | a. System to prompt SSM Error Popup during SSM Permission Checking (refer Table 2.7.1.1) or SSM File Checking (refer Table 2.7.1.2). ⏎ Popup Message Title: ⏎ ERROR ⏎ Popup Message Content: ⏎ Please proceed to eAuto website to continue this transaction. ⏎ Popup Button: “OK” ⏎ Scenario A: ⏎ SSM Permission checking on Category selection page. Click “OK” to close popup and remain at Category selection page. ⏎ Scenario B: ⏎ SSM Permission checking on STMS: Company Step 1 to 2. Click “OK” to close popup and redirect UCD to STMS Transaction Listing page. ⏎ Scenario C: ⏎ SSM File checking on STMS Transaction Details page. Click “OK” to close popup and remain at Transaction Details page. |

2.8.1.1 Mobile Application – Force Update
Figure 2.8.1.1: Force Update popup
[image: A screenshot of a phone

Description automatically generated]
Table 2.8.1.1: Force Update popup

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | Figure 2.8.1.1 | Force Update popup | New | Popup | - | a. System to prompt Force Update popup if it detects UCD to be using an older version of the eAuto Mobile App. ⏎ System Handling: ⏎ Version checking will be done and triggered at the following pages: ⏎ 1. Splash screen ⏎ 1. Login page when UCD clicks on “Login” button. ⏎ Popup Message Title: ⏎ Update Required ⏎ Popup Message Content: ⏎ Your app version is outdated. Please update to the latest version of the eAuto Mobile App for a better experience! ⏎ Popup Button: “Update Now” ⏎ 1. Click “Update Now” to close popup and redirect user to eAuto Mobile App in Google Play Store. |

2.9.1.1 Mobile Application – Maintenance Page
Figure 2.9.1.1: Maintenance Page
[image: A screenshot of a phone

Description automatically generated]
Table 2.9.1.1: Maintenance Page

| # | Callout | Field | Existing / New field | Field format | Mandatory (M) / Optional (O) | Update description |
| 1 | Figure 2.9.1.1 | Maintenance Page | New | - | - | a. System to display Maintenance Page if a rollback is required. ⏎ b. UCD unable to access or utilize eAuto Mobile App as long as the Maintenance Page is displayed. ⏎ System Handling: ⏎ Maintenance flag will be turned on in the backend. |
