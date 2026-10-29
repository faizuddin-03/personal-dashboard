# SRD_EAINT-12406_v0.1_20260929 (1d7e46c7-0db7-4d55-84f7-5150d019ee20).docx — text copy (27/10/2026, 5:17:30 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording |
| Version | Version 0.1 |
| Latest Revision Date | 29.09.2026 (Tuesday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 29.09.2026 (Tues) | Chee Mei Jia | Initial Draft |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| | | |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12406 — [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording | https://mfservices.atlassian.net/browse/EAINT-12406 | Internal IT ticket |
| 2 | CCB-992 — ESI / To Allow and Display Allianz in Secarang Including Logo and Wording | https://mfservices.atlassian.net/browse/CCB-992 | Cross-department ticket |
| 3 | ESI-361 — To allow Allianz in Secarang | https://mfservices.atlassian.net/browse/ESI-361 | Source ticket |
| 4 | Mock Up — Secarang About Us & Support Pages (HTML) | Mock Up_EAINT-12406_Secarang_20260929.html | Screen mockup for Allianz name in Our partnership and Allianz contact section |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Enable Allianz back in Secarang production using existing Allianz flow, with updated insurer sequence and Allianz name on About Us and Support pages. |
| 2.1.2 | Key Value(s) Expected | Offers customers 1 more insurer choice in Secarang, in line with Management direction to grow Serba Sentral. |
| 2.1.3 | Additional Note(s) | |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | Secarang |
| 2 | Portal | Secarang |
| 3 | Module | Allianz |
| 4 | Request | To allow and display Allianz in Secarang, including logo and wording |
| 5 | Additional Note | Based on direction from Management to grow Serba Sentral ⏎ Insurer sequence and display locations confirmed with Shamini on 29 Sep 2026 |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | a. Allianz is available in Secarang but disabled in production. ⏎ b. Only Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad are displayed at: ⏎ i. About Us > Our partnership ⏎ ii. Support > Need to contact insurance company? |
| 2 | Expected New Handling / Behaviour | a. Enable Allianz back in Secarang production. ⏎ b. Existing Allianz flow remains unchanged. No new handling needed. ⏎ c. Display only available Allianz quotations. ⏎ d. Insurer sequence in Secarang: Lonpac > Allianz > Tokio Marine. ⏎ e. Display Allianz logo in Secarang. ⏎ f. Display Allianz name at: ⏎ i. About Us > Our partnership ⏎ ii. Support > Need to contact insurance company? |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | Quotation Page | Allianz enabled back; insurer sequence. |
| 2 | About Us > Our partnership | Allianz name added to partnership wording. |
| 3 | Support > Need to contact insurance company? | New Allianz contact section. |

### 2.2.4 Quotation Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-001 | Enable Allianz | Existing: ⏎ Allianz is available in Secarang but disabled in production. ⏎ New Expected: ⏎ a. Enable Allianz back in Secarang production. ⏎ b. Existing Allianz flow and options remain unchanged. No new handling needed. | Example 1: Allianz returns a quotation ⏎ a. Allianz quotation is displayed. ⏎ b. Customer can complete purchase using existing Allianz flow. |
| 2 | EAINT-12406-REQ-002 | Display Available Quotation Only | Allianz is displayed only when Allianz returns a quotation. ⏎ Other insurers are not affected when Allianz has no quotation. | Example 1: Allianz quotation available ⏎ a. Allianz quotation is displayed. ⏎ Example 2: Allianz quotation not available ⏎ a. Allianz is not displayed. ⏎ b. Other available insurer quotations are displayed as usual. |
| 3 | EAINT-12406-REQ-003 | Insurer Sequence | Existing: ⏎ Lonpac > Tokio Marine ⏎ New Expected: ⏎ Lonpac > Allianz > Tokio Marine ⏎ Insurer without available quotation is skipped; the rest keep the same order. | Example 1: All 3 insurers available ⏎ a. Displayed as Lonpac, Allianz, Tokio Marine. ⏎ Example 2: Lonpac not available ⏎ a. Displayed as Allianz, Tokio Marine. ⏎ Example 3: Allianz not available ⏎ a. Displayed as Lonpac, Tokio Marine. ⏎ Example 4: Tokio Marine not available ⏎ a. Displayed as Lonpac, Allianz. |
| 4 | EAINT-12406-REQ-004 | Allianz Logo | Display existing Allianz logo on Allianz quotation, same as before it was disabled. | Example 1: Allianz quotation displayed ⏎ a. Allianz logo is shown on Allianz quotation. |

### 2.2.5 About Us — Our Partnership

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-005 | Partnership Wording | Existing: ⏎ "...products from several key insurers, including Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." ⏎ New Expected: ⏎ "...products from several key insurers, including Lonpac Insurance Bhd, Allianz General Insurance Company (Malaysia) Berhad and Tokio Marine Insurans (Malaysia) Berhad." ⏎ Allianz full name to be confirmed by requestor. | Example 1: Customer opens About Us > Our partnership ⏎ a. Wording lists Lonpac, Allianz and Tokio Marine, in this order. ⏎ b. Rest of the paragraph remains unchanged. |

### 2.2.6 Support — Need to Contact Insurance Company?

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-006 | Allianz Contact Section | Existing: ⏎ Contact sections shown for Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad. ⏎ New Expected: ⏎ a. Add Allianz contact section between Lonpac and Tokio Marine. ⏎ b. Same format as existing insurers: insurer name header with expand / collapse, contact details listed below. ⏎ Allianz contact details: ⏎ 1. Road Assistance Hotline (24 Hours): to be confirmed ⏎ 2. Customer Service: to be confirmed ⏎ Allianz display name and any other contact line (e.g. General Line) to be confirmed by requestor. | Example 1: Customer opens Support > Need to contact insurance company? ⏎ a. Sections displayed as Lonpac, Allianz, Tokio Marine. ⏎ Example 2: Customer expands Allianz section ⏎ a. Allianz contact details are displayed. ⏎ Example 3: Customer collapses Allianz section ⏎ a. Allianz contact details are hidden, same as other insurers. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12406-REQ-001 | Added | Initial draft |
| 2 | 0.1 | EAINT-12406-REQ-002 | Added | Initial draft |
| 3 | 0.1 | EAINT-12406-REQ-003 | Added | Initial draft |
| 4 | 0.1 | EAINT-12406-REQ-004 | Added | Initial draft |
| 5 | 0.1 | EAINT-12406-REQ-005 | Added | Initial draft |
| 6 | 0.1 | EAINT-12406-REQ-006 | Added | Initial draft |
