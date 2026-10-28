# EAINT-11868_SRD_[eAuto-Application] To Implement Email Reminders, Expiry Extension and Application Link Reactivation_v1.0_20260730.docx — text copy (27/10/2026, 5:25:41 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [eAuto-Application] To Implement Email Reminders, Expiry Extension & Application Link Reactivation |
| Version | Version 1.0 |
| Latest Revision Date | 30.07.2026 (Thurs) |

CONTENTS
1.0 DOCUMENT INFORMATION 3
1.1 Purpose 3
1.2 Intended Audience 3
1.3 Revision History 3
1.4 Glossary of Terms 4
1.5 Associated Document(s) 4
2.0 REQUIREMENT 6
2.1 High-Level Requirement Overview 6
2.2 Key Highlights and Baseline Requirements 7
2.2.1 Background 7
2.2.2 Existing Issue & Expected Behaviour 8
2.2.3 Affected Pages 9
2.2.4 Automated Reminder Emails 10
2.2.5 Application Expiry Extension 11
2.2.6 Application Link Reactivation 13
2.2.7 Pending Items 16

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 23.07.2026 (Thurs) | Lim Yi Link | Initial Draft |
| 0.2 | 30.07.2026 (Thurs) | Lim Yi Link | 1. Added sample scenario in Section 2.2.5 ⏎ 1. Added expected behaviour in Section 2.2.6 |
| 1.0 | 30.07.2026 (Thurs) | Lim Yi Link | Send out for external review |

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | Potential UCD | Prospective Used Car Dealer going through the onboarding journey. |
| 2 | Assignee | eAuto internal staff / BackOffice reviewer handling the application. |
| 3 | PA | Pre-Application |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-11868 — [eAuto-Application] To Implement Email Reminders, Expiry Extension & Application Link Reactivation | https://mfservices.atlassian.net/browse/EAINT-11868 | Main enhancement ticket |
| 2 | EAUTO-947 — ENHANCEMENT REQUEST FOR PRE-ONBOARDING AND ONBOARDING (REMINDER, EXTENSION & REACTIVATION) | https://mfservices.atlassian.net/browse/EAUTO-947 | Source enhancement request |
| 3 | CCB-824 — EAUTO / To Implement Email Reminders, Expiry Extension & Application Link Reactivation | https://mfservices.atlassian.net/browse/CCB-824 | Change Control Board ticket |
| 4 | Figma Design (UI/UX Reference) | a. Extend feature: ⏎ https://www.figma.com/design/0S3hEtbYShUSNS3OZS6PyC/Onboarding-form?node-id=9058-29823&t=DVf2SGZndP8SaMCJ-1 ⏎ b. Reactive feature: ⏎ https://www.figma.com/design/0S3hEtbYShUSNS3OZS6PyC/Onboarding-form?node-id=9058-33746&t=DVf2SGZndP8SaMCJ-1 | UI/UX design reference for the Extend and Reactivation features |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Implement three enhancements to the eAuto Application flow for potential UCDs: automated reminder emails, a one-time application expiry extension, and application link reactivation. |
| 2.1.2 | Key Value(s) Expected | Reduce onboarding drop-off by proactively reminding UCDs of pending actions, give assignees flexibility to extend an application once, and allow expired application links to be reactivated after payment. |
| 2.1.3 | Additional Note(s) | Ops team to provide 5 email templates in total: 6 reminder scenarios. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | Potential UCD |
| 3 | Module | UCD Application Form |
| 4 | Request | Implement automated reminder emails, a one-time application expiry extension, and application link reactivation for potential UCDs. |
| 5 | Additional Note | - |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | There are currently no automated reminders sent to potential UCDs, no mechanism for an assignee to extend an application before it expires, and expired application links cannot be reactivated. |
| 2 | Expected New Handling / Behaviour | The system sends automated reminder emails at defined triggers, allows the assignee to extend an application once, and allows expired application links to be reactivated via email after payment (valid for 90 days from payment date). |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | Application (Assignee / BackOffice view) | Extend button and entry of extension remarks. |
| 2 | Application – Right Sidebar | Display of extension remarks. |
| 3 | Email Templates | 6 email templates to be provided / updated: ⏎ a. Application approval reminder ⏎ b. Application expiry reminder (2 months) ⏎ c. Application expiry reminder (1 month) ⏎ d. Payment reminder ⏎ e. Hardcopy submission reminder ⏎ f. Reactivation email ⏎ Note: A button will be added in the existing expiration email template for application reactivation. |
| 4 | Reactivation Confirmation Page | Redirect to a new tab for the UCD to confirm application link reactivation. |

### 2.2.4 Automated Reminder Emails

| # | Item | Description | Acceptance Criteria |
| 1 | Application approval reminder | System sends a reminder email to the potential UCD 3 days after the Assignee approves the application, prompting them to complete the application. | Reminder email is sent automatically 3 days after application approval when the application is still incomplete. |
| 2 | Application expiry reminder (2 months) | System sends a reminder email 2 months before the application expiration date to complete the application. | Reminder email is sent automatically 2 months before the application expiry date. |
| 3 | Application expiry reminder (1 month) | System sends a reminder email 1 month before the application expiration date to complete the application. | Reminder email is sent automatically 1 month before the application expiry date. |
| 4 | Payment reminder | System sends a payment reminder email 1 day after the Softcopy Docs status = "Checked" if the UCD has not made payment. | Payment reminder email is sent automatically 1 day after Softcopy Docs = "Checked" when no payment has been received. |
| 5 | Hardcopy submission reminder | System sends a reminder email 3 days after the UCD has made payment, prompting them to submit the required hardcopy documents. | Hardcopy reminder email is sent automatically 3 days after payment is completed. |
| 6 | Email templates (Ops) | 5 email templates (one per scenario above) to be provided by the Ops team. | All 5 reminder email templates provided by Ops are configured and used for the correct scenario. |

### 2.2.5 Application Expiry Extension

| # | Item | Description | Acceptance Criteria |
| 1 | Extend button availability | The Extend button is available only when BOTH conditions are met: ⏎ a. The UCD can submit registration documents (Softcopy & Hardcopy) after Application Status = Approved; AND ⏎ b. The "Hardcopy & Acc Created" status is NOT "Registered". ⏎ Note: The Extend button is displayed regardless of the current status of Softcopy Docs and Hardcopy & Acc Created (except when Hardcopy & Acc Created = Registered). | Extend button is visible/enabled only when both conditions are met and the application has not been extended before. |
| 2 | Extend button unavailable | The Extend button is not available when the Hardcopy status = "Registered". | Extend button is hidden/disabled when Hardcopy status is "Registered". |
| 3 | One-time extension | Each application is eligible for one (1) 30-day extension only. ⏎ Special Scenario: ⏎ 1. If the application expires after the 30-day extension, the Assignee must pay the RM108 reactivation fee to reactivate the application. ⏎ 1. Once reactivated, the application is not eligible for any further extension . ⏎ 1. If the application expires again, it cannot be extended and another reactivation is required. ⏎ Loop scenario: Application Expired → Extended → Expired → Reactivated → Expired Again → Reactivated (No Extension Allowed) | System prevents a second extension; the Extend button becomes unavailable after one extension. |
| 4 | No auto email | No automated email is triggered by the extension action. | No email is sent when an extension is performed. |
| 5 | Extension remarks | a. The assignee can enter remarks for each extension. ⏎ b. The Remarks field follows the existing behaviour of the Remarks field in the Application. ⏎ c. Remarks are displayed on the right sidebar. | Assignee can enter remarks during extension; remarks are saved and displayed in the right sidebar. |

### 2.2.6 Application Link Reactivation

| # | Item | Description | Acceptance Criteria |
| 1 | Reactivate button in email | a. Add a button in the existing email template to reactivate the application. ⏎ b. When clicked, the UCD is redirected to a new tab showing a confirmation page. | Reactivate button appears in the email; clicking it opens a new tab displaying the reactivation confirmation page. |
| 2 | Reactivation confirmation page | The UCD confirms reactivation on the confirmation page. | Confirmation page loads in a new tab and allows the UCD to proceed with reactivation. |
| 3 | Reactivation validity (90 days) | Once the UCD has successfully paid the Pre-Application Fee (RM108) , the system shall: ⏎ a. Reactivate the application link for 90 days , calculated from the payment date. ⏎ b. Create a new Pre-Application (PA) record for each reactivation. ⏎ c. Allow the UCD to continue the onboarding process using the same application link . ⏎ d. Ensure the latest Pre-Application (PA) record and the associated Application reflect the latest SSM document information for SSM Registered Company. | 1. After successful payment of the Pre-Application Fee (RM108), the application link shall be reactivated and remain valid for 90 days, calculated from the payment date. ⏎ 1. A new Pre-Application (PA) record/transaction shall be created for each successful reactivation. ⏎ 1. The latest Pre-Application (PA) record and the associated Application Form (A Form) for SSM Registered Company shall display the latest SSM document information. |
| 4 | Technical limitation (backend) | a. An Application can only be associated with the latest Pre-Application (PA) record. ⏎ b. Previous PA records (e.g. PA v1) will no longer contain the application link after a reactivation. ⏎ c. After reactivation, the Application is linked only to the latest PA record (e.g. PA v2) | Only the latest Pre-Application (PA) record shall retain the application link. Previous PA records shall no longer contain the application link. |
| 5 | No maximum reactivation limit | There is no maximum limit on the number of reactivations. | The UCD can reactivate the application any number of times. |
| 6 | Reactivation after re-expiry (extended application) | Special scenario: ⏎ a. If an application that was previously extended expires again, the potential UCD is required to pay RM108 to reactivate the link again. ⏎ b. Upon successful payment, the application is reactivated for 90 days from the payment date. | When an extended application expires again, the UCD must pay RM108 before the link is reactivated; the application is then valid for 90 days from the payment date. |
| 7 | Email template | Edit and add reactivate button to existing expired email template. ⏎ Updated Email Template: ⏎ Dear Sir / Madam, ⏎ We regret to inform you that your application has expired due to no action being taken within the stipulated validity period of 90 days, which expired on [Expiration Date] at 12:00 PM. ⏎ If you still wish to proceed with the application process, you may reactivate your application by clicking the button below. Once reactivated, you may continue your application through the eAuto portal. ⏎ [Reactivate Application button] ⏎ For further assistance or inquiries, please contact us at apply@eauto.my . ⏎ Best regards, ⏎ eAuto Sdn Bhd ⏎ Level 15 Sunway Tower ⏎ Jalan Ampang, 50450 Kuala Lumpur ⏎ Customer Service: 03-27798899 ⏎ WhatsApp: 012-2001324 ⏎ [eAuto Logo] | Reactivation email template with a working reactivate button. |

### 2.2.7 Pending Items

| # | Item | Status |
| 1 | Ops team to provide 6 email templates (5 reminder scenarios + 1 reactivation email with reactivate button). | Pending |
