# SRD_EAINT-12386_v0.1_20261009.docx — text copy (27/10/2026, 4:50:05 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-UCD] JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report |
| Version | Version 0.1 |
| Latest Revision Date | 09.10.2026 (Friday) |

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

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | UCD | Used Car Dealer. |
| 2 | VOC | Vehicle Ownership Certificate issued by JPJ. |
| 3 | JomCheck | Vehicle report service purchased by UCD through eAuto. |
| 4 | ezAuto | Service provider of the JomCheck Gateway API. |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12386 — JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report | https://mfservices.atlassian.net/browse/EAINT-12386 | Internal IT ticket |
| 2 | EAUTO-1067 — JOMCHECK ENHANCEMENT | https://mfservices.atlassian.net/browse/EAUTO-1067 | Source ticket |
| 3 | CCB-987 — EAUTO / JomCheck Enhancement - Remove Special Character from Chassis No & Auto-Resubmit on Empty Report | https://mfservices.atlassian.net/browse/CCB-987 | Cross-department ticket |
| 4 | Enhancement Request-18092026- Jomcheck Enhancement.docx | Enhancement Request form dated 18.09.2026 (Thurs) | Requirement source |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Allow UCD to key in Chassis No as printed in the VOC. System removes special characters before submitting the Chassis No to JomCheck. |
| 2.1.2 | Key Value(s) Expected | Reduce number of empty and failed JomCheck reports, which reduces number of refund transactions. |
| 2.1.3 | Additional Note(s) | JomCheck API accepts alphanumeric only, with a maximum of 17 characters. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | JomCheck API accepts alphanumeric only, with a maximum of 17 characters, as advised by ezAuto. |
| 2 | Temporary fix in production, which blocks UCD from proceeding to payment when JomCheck returns an error, remains in place after this enhancement. |

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
| 1 | Existing Issue / Behaviour | 1. Chassis No printed in the VOC contains alphanumeric and special characters. ⏎ 2. JomCheck API accepts alphanumeric only, with a maximum of 17 characters. ⏎ 3. Chassis No submitted with special characters is rejected by JomCheck API with the response message "Invalid Chassis No.". ⏎ 4. Before the temporary fix, UCD received an empty report and requested a refund. ⏎ 5. Temporary fix in production blocks UCD from proceeding to payment when JomCheck API returns an error. |
| 2 | Expected New Handling / Behaviour | 1. UCD keys in Chassis No as printed in the VOC, including special characters. ⏎ 2. System removes all special characters from the Chassis No before submitting it to JomCheck. ⏎ 3. When the Chassis No exceeds 17 characters after special characters are removed, system displays "Chassis No. Not Found" and UCD is unable to proceed to payment. ⏎ 4. When JomCheck API returns "Invalid Chassis No.", system displays "Chassis No. Not Found" and UCD is unable to proceed to payment. ⏎ 5. Cron job to resubmit the request when an empty report code is received is pending confirmation with requestor on whether it can be removed. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | UCD — JomCheck | Chassis No input, special character removal, length validation and submission to JomCheck. |
| 2 | Cron Job — JomCheck | Resubmission to JomCheck when an empty report code is received. Pending confirmation with requestor. |

### 2.2.4 UCD — JomCheck Search by Chassis No

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12386-REQ-001 | Chassis No Field Accepts VOC Format | Existing: ⏎ Chassis No field accepts alphanumeric only. Special character keyed in by UCD is submitted to JomCheck as keyed in. ⏎ New Expected: ⏎ a. Chassis No field accepts the value exactly as printed in the VOC, including alphanumeric and special characters. ⏎ b. Field is mandatory. ⏎ c. No maximum length is applied on the field itself. Length validation is applied on the value after special characters are removed, as stated in EAINT-12386-REQ-003. | Example 1: UCD keys in Chassis No with special character, e.g. JTD-12345-678901234 ⏎ a. Value is accepted in the field with no error displayed. ⏎ Example 2: UCD keys in Chassis No without special character, e.g. JTD12345678901234 ⏎ a. Value is accepted in the field with no error displayed. ⏎ Example 3: Chassis No is left blank ⏎ a. System blocks the search and the field is flagged as mandatory. |
| 2 | EAINT-12386-REQ-002 | Special Character Removed Before Submission to JomCheck | Existing: ⏎ Chassis No is submitted to JomCheck with special characters included, and JomCheck API responds with "Invalid Chassis No.". ⏎ New Expected: ⏎ a. System removes all special characters from the Chassis No before submitting it to JomCheck. ⏎ b. Only alphanumeric characters are submitted to JomCheck. ⏎ c. Value displayed on the screen remains as keyed in by UCD, including the special characters. | Example 1: Chassis No keyed in as JTD-12345-678901234 ⏎ a. System submits JTD12345678901234 to JomCheck. ⏎ b. Screen continues to display JTD-12345-678901234. ⏎ Example 2: Chassis No keyed in without special character ⏎ a. Value is submitted to JomCheck as keyed in. ⏎ Example 3: JomCheck report purchased before deployment ⏎ a. Report remains as purchased, with no resubmission and no change. ⏎ Example 4: JomCheck search performed after deployment ⏎ a. Special character removal applies to every new search. |
| 3 | EAINT-12386-REQ-003 | Chassis No Exceeding 17 Characters After Removal Is Blocked | JomCheck API accepts alphanumeric only, with a maximum of 17 characters. ⏎ Existing: ⏎ Chassis No is submitted to JomCheck regardless of its length, and JomCheck API responds with "Invalid Chassis No.". ⏎ New Expected: ⏎ a. System counts the Chassis No after all special characters are removed. ⏎ b. 17 characters or fewer: system submits the Chassis No to JomCheck. ⏎ c. More than 17 characters: system does not submit to JomCheck, displays the message below, and UCD is unable to proceed to payment. ⏎ Display Message: Chassis No. Not Found | Example 1: 17 characters or fewer after removal, e.g. JTD-12345-678901234 becomes JTD12345678901234 (17 characters) ⏎ a. Chassis No is submitted to JomCheck. ⏎ b. UCD proceeds to payment following the existing flow. ⏎ Example 2: More than 17 characters after removal, e.g. JTD-123456-7890123456 becomes JTD1234567890123456 (19 characters) ⏎ a. Chassis No is not submitted to JomCheck. ⏎ b. "Chassis No. Not Found" is displayed on the screen. ⏎ c. UCD is unable to proceed to payment. |
| 4 | EAINT-12386-REQ-004 | Invalid Chassis No. Returned by JomCheck Is Blocked | Existing: ⏎ JomCheck API returns "Invalid Chassis No." when the Chassis No is not valid. Temporary fix in production blocks UCD from proceeding to payment. ⏎ New Expected: ⏎ a. Behaviour is retained after this enhancement. ⏎ b. When JomCheck API returns "Invalid Chassis No.", system displays the message below and UCD is unable to proceed to payment. ⏎ Display Message: Chassis No. Not Found | Example 1: JomCheck API returns "Invalid Chassis No." ⏎ a. "Chassis No. Not Found" is displayed on the screen. ⏎ b. UCD is unable to proceed to payment. ⏎ Example 2: JomCheck API returns a valid report ⏎ a. UCD proceeds to payment following the existing flow. |

### 2.2.5 Cron Job — JomCheck Empty Report Resubmission

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12386-REQ-005 | JomCheck Report Resubmission on Empty Report Code | This requirement is pending confirmation with requestor on whether it can be removed, as the special character removal in Section 2.2.4 is expected to resolve the empty report. ⏎ Existing: ⏎ Empty report is received by UCD, and UCD requests a refund. ⏎ New Expected: ⏎ a. Cron job picks up the empty report code and resubmits the request to JomCheck to obtain the report. ⏎ b. Resubmission follows the existing behaviour where a purchase made a second time after the first empty report was successful, at a few minutes interval. | Example 1: JomCheck returns an empty report code ⏎ a. Cron job resubmits the request and the report is retrieved. ⏎ Example 2: JomCheck returns a valid report ⏎ a. No resubmission is triggered. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12386-REQ-001 | Added | Chassis No field accepts VOC format |
| 2 | 0.1 | EAINT-12386-REQ-002 | Added | Special character removed before JomCheck submission |
| 3 | 0.1 | EAINT-12386-REQ-003 | Added | Blocked when exceeding 17 characters after removal |
| 4 | 0.1 | EAINT-12386-REQ-004 | Added | Blocked when JomCheck returns Invalid Chassis No. |
| 5 | 0.1 | EAINT-12386-REQ-005 | Added | Cron job resubmission on empty report code |
