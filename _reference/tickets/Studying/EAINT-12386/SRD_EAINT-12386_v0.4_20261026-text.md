# SRD_EAINT-12386_v0.4_20261026.docx — text copy (27/10/2026, 4:50:05 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-UCD] JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report |
| Version | Version 0.4 |
| Latest Revision Date | 26.10.2026 (Monday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 09.10.2026 (Fri) | Chee Mei Jia | Initial Draft |
| 0.2 | 22.10.2026 (Thurs) | Chee Mei Jia | Updated Chassis No error message in Section 2.2.2 and Section 2.2.4; Updated cron job scope in Section 2.2.5; Added Scenario Matrix in Section 2.2.4.1 |
| 0.3 | 23.10.2026 (Fri) | Chee Mei Jia | a. Removed item 4 in Section 1.5. ⏎ b. Updated special character trimming to backend handling before payment. ⏎ c. Updated Chassis No field maximum length to 30 characters. ⏎ d. Added note on JomCheck payment done page for empty report. ⏎ e. Updated cron job retry interval and attempts in Section 2.2.5. |
| 0.4 | 26.10.2026 (Mon) | Chee Mei Jia | a. Updated existing behaviour on Invalid Chassis No. response handling. ⏎ b. Updated references to JomCheck precheck API. ⏎ c. Confirmed trimming applies to precheck and submission API. ⏎ d. Added JomCheck precheck API behaviour and trimming scope. |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | UCD | Used Car Dealer. |
| 2 | VOC | Vehicle Ownership Certificate issued by JPJ. |
| 3 | JomCheck | Vehicle report service purchased by UCD through eAuto. |
| 4 | ezAuto | Service provider of the JomCheck Gateway API. |
| 5 | JomCheck Precheck API | JomCheck API called before payment to check the Chassis No or Vehicle No. Also referred to as enquiry API. |
| 6 | JomCheck Submission API | JomCheck API called to request the report after payment is made. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12386 — JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report | https://mfservices.atlassian.net/browse/EAINT-12386 | Internal IT ticket |
| 2 | EAUTO-1067 — JOMCHECK ENHANCEMENT | https://mfservices.atlassian.net/browse/EAUTO-1067 | Source ticket |
| 3 | CCB-987 — EAUTO / JomCheck Enhancement - Remove Special Character from Chassis No & Auto-Resubmit on Empty Report | https://mfservices.atlassian.net/browse/CCB-987 | Cross-department ticket |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Allow UCD to key in Chassis No as printed in the VOC. System removes special characters at backend before submitting the Chassis No to JomCheck. |
| 2.1.2 | Key Value(s) Expected | Reduce number of empty and failed JomCheck reports, which reduces number of refund transactions. |
| 2.1.3 | Additional Note(s) | JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters, as advised by ezAuto. |
| 2 | Existing handling, where system detects the “Invalid Chassis No.” response from JomCheck precheck API and blocks UCD directly, is retained after this enhancement. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. UCD ⏎ 2. Cron Job |
| 3 | Module | JomCheck |
| 4 | Request | Allow UCD to key in Chassis No as printed in the VOC. System removes special characters before submitting the Chassis No to JomCheck. |
| 5 | Additional Note | 1. Reduce number of empty reports, which in turn reduces number of refund transactions. ⏎ 2. ezAuto advised that maximum characters for Chassis No is 17 and only alphanumeric is accepted. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Chassis No printed in the VOC contains alphanumeric and special characters. ⏎ 2. Chassis No field at UCD frontend accepts alphanumeric and special characters, with a maximum of 30 characters. ⏎ 3. JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters. ⏎ 4. Chassis No submitted with special characters is rejected by JomCheck precheck API with the response message "Invalid Chassis No.". ⏎ 5. Before this blocking was in place, UCD received an empty report and requested a refund. ⏎ 6. System detects the "Invalid Chassis No." response from JomCheck precheck API and blocks UCD directly from proceeding to payment. ⏎ 7. JomCheck precheck API returns whether a report is available only when the enquiry is made with Vehicle No. Report availability is not returned when the enquiry is made with Chassis No. ⏎ 8. When precheck is done with Chassis No, JomCheck precheck API is still able to return whether the Chassis No is invalid. |
| 2 | Expected New Handling / Behaviour | 1. UCD frontend handling remains as it is today. UCD keys in the Chassis No as required, including alphanumeric and special characters, with a maximum of 30 characters. ⏎ 2. System removes all special characters from the Chassis No at backend before submitting the request to JomCheck precheck API and submission API. ⏎ 3. Backend checks the trimmed Chassis No before UCD is allowed to proceed to payment. 17 characters or fewer: UCD proceeds to payment. More than 17 characters: system does not submit to JomCheck, displays "Invalid Chassis Number." and UCD is unable to proceed to payment. ⏎ 4. When JomCheck precheck API returns "Invalid Chassis No.", system displays "Invalid Chassis Number." and UCD is unable to proceed to payment. ⏎ 5. When the report returned is empty, a note is displayed on the JomCheck payment done page advising UCD to download the report again later. ⏎ 6. Cron job resubmission applies only to empty reports that are not caused by the Invalid Chassis Number validation. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | UCD — JomCheck | Chassis No input at frontend, backend trimming, length validation before payment and submission to JomCheck. |
| 2 | UCD — JomCheck Payment Done | Note displayed to UCD when the report returned by JomCheck is empty. |
| 3 | Cron Job — JomCheck | Resubmission to JomCheck when an empty report code is received, excluding Invalid Chassis Number cases. |

### 2.2.4 UCD — JomCheck Search by Chassis No

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12386-REQ-001 | Chassis No Field at UCD Frontend | Existing: ⏎ a. Chassis No field accepts alphanumeric and special characters, with a maximum of 30 characters. ⏎ b. Value keyed in is submitted to JomCheck as keyed in. ⏎ New Expected: ⏎ a. Frontend handling remains as it is today. Field accepts alphanumeric and special characters, with a maximum of 30 characters. ⏎ b. Field is mandatory. ⏎ c. No trimming is done at frontend. Trimming and length validation are handled at backend, as stated in EAINT-12386-REQ-002 and EAINT-12386-REQ-003. | Example 1: UCD keys in Chassis No with special character, e.g. JTD-12345-678901234 ⏎ a. Value is accepted in the field with no error displayed. ⏎ Example 2: UCD keys in Chassis No without special character, e.g. JTD12345678901234 ⏎ a. Value is accepted in the field with no error displayed. ⏎ Example 3: Chassis No is left blank ⏎ a. System blocks the search and the field is flagged as mandatory. ⏎ Example 4: UCD keys in more than 30 characters ⏎ a. Field stops further input at 30 characters, following existing handling. |
| 2 | EAINT-12386-REQ-002 | Special Character Trimmed at Backend Before Submission to JomCheck | Existing: ⏎ Chassis No is submitted to JomCheck precheck API with special characters included, and the API responds with "Invalid Chassis No.". ⏎ New Expected: ⏎ a. Backend removes all special characters from the Chassis No before submitting the request to JomCheck. ⏎ b. Only alphanumeric characters are submitted to JomCheck. ⏎ c. Value displayed on the UCD screen remains as keyed in, including the special characters. Trimming is not visible to UCD. ⏎ d. Trimming applies to both the JomCheck precheck API call and the submission API call. | Example 1: Chassis No keyed in as JTD-12345-678901234 ⏎ a. Backend submits JTD12345678901234 to JomCheck precheck API. ⏎ b. Screen continues to display JTD-12345-678901234. ⏎ Example 2: Chassis No keyed in without special character ⏎ a. Value is submitted to JomCheck as keyed in. ⏎ Example 3: JomCheck report purchased before deployment ⏎ a. Report remains as purchased, with no resubmission and no change. ⏎ Example 4: JomCheck search performed after deployment ⏎ a. Backend trimming applies to every new search. |
| 3 | EAINT-12386-REQ-003 | Backend Length Check Before Payment | JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters. ⏎ Existing: ⏎ Chassis No is submitted to JomCheck precheck API regardless of its length, and the API responds with "Invalid Chassis No.". ⏎ New Expected: ⏎ a. Backend counts the Chassis No after all special characters are trimmed. ⏎ b. Check is done before UCD is allowed to proceed to payment. ⏎ c. 17 characters or fewer: backend submits the Chassis No to JomCheck precheck API and UCD proceeds to payment. ⏎ d. More than 17 characters: backend does not submit to JomCheck precheck API, displays the message below, and UCD is unable to proceed to payment. ⏎ Error Message: Invalid Chassis Number. | Example 1: 17 characters or fewer after removal, e.g. JTD-12345-678901234 becomes JTD12345678901234 (17 characters) ⏎ a. Backend submits the Chassis No to JomCheck precheck API. ⏎ b. UCD proceeds to payment following the existing flow. ⏎ Example 2: More than 17 characters after removal, e.g. JTD-123456-7890123456 becomes JTD1234567890123456 (19 characters) ⏎ a. Backend does not submit the Chassis No to JomCheck precheck API. ⏎ b. "Invalid Chassis Number." is displayed on the screen. ⏎ c. UCD is unable to proceed to payment. |
| 4 | EAINT-12386-REQ-004 | Invalid Chassis No. Returned by JomCheck Is Blocked | Existing: ⏎ System detects the "Invalid Chassis No." response from JomCheck precheck API and blocks UCD directly from proceeding to payment. ⏎ New Expected: ⏎ a. Existing blocking behaviour is retained after this enhancement. ⏎ b. When JomCheck precheck API returns "Invalid Chassis No.", system displays the message below and UCD is unable to proceed to payment. ⏎ c. Precheck with Chassis No does not return report availability, but it does return whether the Chassis No is invalid. ⏎ Error Message: Invalid Chassis Number. | Example 1: JomCheck precheck API returns "Invalid Chassis No." ⏎ a. "Invalid Chassis Number." is displayed on the screen. ⏎ b. UCD is unable to proceed to payment. ⏎ Example 2: JomCheck precheck API returns a valid report ⏎ a. UCD proceeds to payment following the existing flow. |

### 2.2.4.1 Scenario Matrix

| # | Scenario | Submit to Precheck API | Message Displayed | Remark |
| 1 | Chassis No keyed in with special character, 17 characters or fewer after backend trim | Yes, alphanumeric only | None | Backend trims before submission. UCD proceeds to payment. |
| 2 | Chassis No keyed in without special character, 17 characters or fewer | Yes, as keyed in | None | Nothing to trim. UCD proceeds to payment. |
| 3 | Chassis No keyed in with special character, more than 17 characters after backend trim | No | Invalid Chassis Number. | Length decides, counted after backend trim. UCD is unable to proceed to payment. |
| 4 | Chassis No keyed in without special character, more than 17 characters | No | Invalid Chassis Number. | Length decides. UCD is unable to proceed to payment. |
| 5 | Chassis No is 17 characters or fewer after backend trim but not found by JomCheck precheck API | Yes, alphanumeric only | Invalid Chassis Number. | JomCheck precheck API response decides. UCD is unable to proceed to payment. |
| 6 | Chassis No is left blank | No | Field is flagged as mandatory | Frontend mandatory check runs before backend trim and submission. |
| 7 | UCD keys in more than 30 characters at the field | No | None | Frontend maximum length decides. Existing handling retained. |

### 2.2.5 Cron Job — JomCheck Empty Report Resubmission

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12386-REQ-005 | Cron Job Resubmission on Empty Report Code | Existing: ⏎ Empty report is received by UCD, and UCD requests a refund. ⏎ New Expected: ⏎ a. Cron job applies only to empty reports that are not caused by the Invalid Chassis Number validation in EAINT-12386-REQ-003 and EAINT-12386-REQ-004. ⏎ b. Cron job picks up the empty report code and resubmits the request to JomCheck to obtain the report. ⏎ c. Cron job retries the request every 1 minute, up to a maximum of 5 attempts. Interval and number of attempts are pending confirmation with developer. ⏎ d. When the report is still empty after the maximum number of attempts, system performs no further action. Refund is handled manually by Ops team. | Example 1: JomCheck returns an empty report code that is not an Invalid Chassis Number case ⏎ a. Cron job resubmits the request and the report is retrieved. ⏎ Example 2: JomCheck returns "Invalid Chassis No." ⏎ a. No resubmission is triggered. Handling follows EAINT-12386-REQ-004. ⏎ Example 3: JomCheck returns a valid report ⏎ a. No resubmission is triggered. ⏎ Example 4: Report is still empty after 5 attempts ⏎ a. System performs no further action. ⏎ b. Ops team handles the refund manually. |

### 2.2.6 UCD — JomCheck Payment Done Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12386-REQ-006 | Note on JomCheck Payment Done Page for Empty Report | Existing: ⏎ UCD receives an empty report with no guidance on the screen, and requests a refund. ⏎ New Expected: ⏎ a. When the report returned by JomCheck is empty, system displays a note on the JomCheck payment done page. ⏎ b. Note is displayed together with the existing payment done content. ⏎ Note Content: Please try again to download report 10 mins later. | Example 1: Report returned by JomCheck is empty ⏎ a. Note is displayed on the JomCheck payment done page. ⏎ b. Cron job resubmission runs as stated in EAINT-12386-REQ-005. ⏎ Example 2: Report returned by JomCheck is not empty ⏎ a. No note is displayed and the report is available for download. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12386-REQ-001 | Added | Chassis No field accepts VOC format |
| 2 | 0.1 | EAINT-12386-REQ-002 | Added | Special character removed before JomCheck submission |
| 3 | 0.1 | EAINT-12386-REQ-003 | Added | Blocked when exceeding 17 characters after removal |
| 4 | 0.1 | EAINT-12386-REQ-004 | Added | Blocked when JomCheck returns Invalid Chassis No. |
| 5 | 0.1 | EAINT-12386-REQ-005 | Added | Cron job resubmission on empty report code |
| 6 | 0.2 | EAINT-12386-REQ-003 | Modified | Error message updated to Invalid Chassis Number. |
| 7 | 0.2 | EAINT-12386-REQ-004 | Modified | Error message confirmed as Invalid Chassis Number. |
| 8 | 0.2 | EAINT-12386-REQ-005 | Modified | Cron job scope narrowed to non Invalid Chassis Number cases |
| 9 | 0.3 | EAINT-12386-REQ-001 | Modified | Frontend handling retained with maximum of 30 characters |
| 10 | 0.3 | EAINT-12386-REQ-002 | Modified | Special character trimming moved to backend handling |
| 11 | 0.3 | EAINT-12386-REQ-003 | Modified | Length check done at backend before UCD proceeds to payment |
| 12 | 0.3 | EAINT-12386-REQ-005 | Modified | Retry every 1 minute up to 5 attempts; Ops handles refund manually |
| 13 | 0.3 | EAINT-12386-REQ-006 | Added | Note on JomCheck payment done page for empty report |
| 14 | 0.4 | EAINT-12386-REQ-002 | Modified | Trimming applies to both JomCheck precheck API and submission API |
| 15 | 0.4 | EAINT-12386-REQ-004 | Modified | Existing blocking on Invalid Chassis No. response stated correctly |
