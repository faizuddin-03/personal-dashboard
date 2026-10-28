# SRD_EAINT-12406_v0.3_20261001.docx — text copy (27/10/2026, 5:17:31 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording |
| Version | Version 0.3 |
| Latest Revision Date | 01.10.2026 (Thursday) |

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
| 0.2 | 30.09.2026 (Wed) | Chee Mei Jia | Updated Section 1.5 Associated Documents ⏎ Updated Section 2.1 High-Level Requirement Overview ⏎ Updated Sections 2.2.2 to 2.2.9 |
| 0.3 | 01.10.2026 (Thurs) | Chee Mei Jia | Updated Sections 2.2.1, 2.2.3, 2.2.5, 2.2.8 and 2.2.9 |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | CIBO | Secarang back office portal |
| 2 | SSM | Suruhanjaya Syarikat Malaysia (Companies Commission of Malaysia) |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12406 — [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording | https://mfservices.atlassian.net/browse/EAINT-12406 | Internal IT ticket |
| 2 | CCB-992 — ESI / To Allow and Display Allianz in Secarang Including Logo and Wording | https://mfservices.atlassian.net/browse/CCB-992 | Cross-department ticket |
| 3 | ESI-361 — To allow Allianz in Secarang | https://mfservices.atlassian.net/browse/ESI-361 | Source ticket |
| 4 | Mock Up — Secarang About Us, FAQs & Support Pages (HTML) | Mock Up_EAINT-12406_Secarang_20260930.html | Screen mockup for Allianz name, FAQ answer and contact section |
| 5 | Mock Up — CIBO Transaction Management, Details & Receipt (HTML) | Mock Up_EAINT-12406_CIBO Transaction Management_20260930.html | Screen mockup for Allianz transaction and receipt |
| 6 | EAINT-12406 — Allianz in Secarang: SA Impact Brief | https://claude.ai/artifact/FX4YJNpnMjVUakvmAYhwpw | Development impact analysis and open questions |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | Enable Allianz back in Secarang production using existing Allianz flow, with updated insurer sequence and Allianz name on Home, About Us, FAQs and Support pages. |
| 2.1.2 | Key Value(s) Expected | Offers customers 1 more insurer choice in Secarang, in line with Management direction to grow Serba Sentral. |
| 2.1.3 | Additional Note(s) | a. Existing Allianz journey (quote, add-ons, payment, cover note, callbacks, receipt) is still in production code; full end-to-end test is required as it has not run in production since May 2025. ⏎ b. Finance to sign off Allianz sales and commission shown under agency Serba Sentral in CIBO payment and commission reports. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | Secarang |
| 2 | Portal | Secarang |
| 3 | Module | Allianz |
| 4 | Request | To allow and display Allianz in Secarang, including logo and wording |
| 5 | Additional Note | Based on direction from Management to grow Serba Sentral ⏎ Insurer sequence and display locations confirmed with Shamini on 29 Sep 2026 ⏎ Receipt company number format and Allianz product documents confirmed with Shamini on 1 Oct 2026 |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | a. Allianz quoting was switched off for Secarang in May 2025 and Allianz was removed from Secarang screens in Sept 2025. ⏎ b. Only Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad are displayed at: ⏎ i. Home page insurer logos ⏎ ii. About Us > Our partnership ⏎ iii. FAQs > Which insurers can I get instant quotation from? ⏎ iv. Support > Need to contact insurance company? |
| 2 | Expected New Handling / Behaviour | a. Enable Allianz back in Secarang production. ⏎ b. Existing Allianz flow remains unchanged. No new handling needed. ⏎ c. Handling when customer has no Allianz quotation to be confirmed (show unavailable card or hide). ⏎ d. Insurer sequence in Secarang: Lonpac > Allianz > Tokio Marine. ⏎ e. Display Allianz logo on Home page and Quotation page. ⏎ f. Display Allianz name at: ⏎ i. About Us > Our partnership ⏎ ii. FAQs > Which insurers can I get instant quotation from? ⏎ iii. Support > Need to contact insurance company? |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | Home Page | Allianz logo between Lonpac and Tokio Marine. |
| 2 | Quotation Page | Allianz enabled back; insurer sequence; Allianz logo. |
| 3 | About Us > Our partnership | Allianz name added to partnership wording. |
| 4 | FAQs | Allianz added to instant quotation insurer list. |
| 5 | Support > Need to contact insurance company? | New Allianz contact section. |
| 6 | Receipt (Secarang & CIBO) | Allianz company number shown in new SSM format, same as Tokio Marine. |

### 2.2.4 Home Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-001 | Allianz Logo on Home Page | Existing: ⏎ Home page insurer logos show Lonpac and Tokio Marine. ⏎ New Expected: ⏎ Show Allianz logo between Lonpac and Tokio Marine, using existing Allianz logo file. | Example 1: Customer opens Home page ⏎ a. Logos displayed as Lonpac, Allianz, Tokio Marine. |

### 2.2.5 Quotation Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-002 | Enable Allianz | Existing: ⏎ Allianz is available in Secarang but disabled in production. ⏎ New Expected: ⏎ a. Enable Allianz back in Secarang production. ⏎ b. Existing Allianz flow and options remain unchanged. No new handling needed. ⏎ Allianz only returns a quotation for individual owners renewing their insurance. | Example 1: Individual owner, renewal, Allianz returns a quotation ⏎ a. Allianz quotation is displayed. ⏎ b. Customer can complete purchase using existing Allianz flow. |
| 2 | EAINT-12406-REQ-003 | No Allianz Quotation | Applies when Allianz has no quotation, e.g. company vehicle or non-renewal. ⏎ Option A: Show "Allianz – Quotation unavailable" card, same as Lonpac and Tokio Marine today. Card appears after Tokio Marine. ⏎ Option B: Hide Allianz card. Other insurers keep Lonpac > Tokio Marine order. ⏎ Existing behaviour and final option to be confirmed with development team and requestor. | Example 1: Company vehicle ⏎ a. Allianz shown as unavailable (Option A) or not shown (Option B). ⏎ Example 2: Individual owner, non-renewal ⏎ a. Same as Example 1. ⏎ Example 3: Allianz quotation not available, others available ⏎ a. Other available insurer quotations are displayed as usual. |
| 3 | EAINT-12406-REQ-004 | Insurer Sequence | Existing: ⏎ Lonpac > Tokio Marine ⏎ New Expected: ⏎ Lonpac > Allianz > Tokio Marine ⏎ Insurer without available quotation is skipped; the rest keep the same order. ⏎ Development team to confirm no other enabled insurer (e.g. Chubb) is dropped, as maximum 3 quotations are shown. | Example 1: All 3 insurers available ⏎ a. Displayed as Lonpac, Allianz, Tokio Marine. ⏎ Example 2: Lonpac not available ⏎ a. Displayed as Allianz, Tokio Marine. ⏎ Example 3: Allianz not available ⏎ a. Displayed as Lonpac, Tokio Marine (per REQ-003). ⏎ Example 4: Tokio Marine not available ⏎ a. Displayed as Lonpac, Allianz. |
| 4 | EAINT-12406-REQ-005 | Allianz Logo on Quotation | Display existing Allianz logo on Allianz quotation, same as before it was disabled. | Example 1: Allianz quotation displayed ⏎ a. Allianz logo is shown on Allianz quotation. |
| 5 | EAINT-12406-REQ-006 | Allianz Product Documents | Allianz documents on Secarang (policy wording, product disclosure sheet, privacy notice, claim guide) are dated 2022. ⏎ No update required. Enable and use existing documents in system. | Example 1: Customer opens Allianz product documents ⏎ a. Existing Allianz documents in system are displayed. |

### 2.2.6 About Us — Our Partnership

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-007 | Partnership Wording | Existing: ⏎ "...products from several key insurers, including Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." ⏎ New Expected: ⏎ Option A (ticket wording): "...including Lonpac Insurance Bhd, Allianz General Insurance Company (Malaysia) Berhad and Tokio Marine Insurans (Malaysia) Berhad." ⏎ Option B (previous wording before Allianz was hidden): Serba Sentral offers Allianz directly; partners offer Lonpac and Tokio Marine. Exact previous sentence to be provided by development team. ⏎ Wording to be approved by requestor (Compliance / Management). | Example 1: Customer opens About Us > Our partnership ⏎ a. Approved Allianz wording is displayed. ⏎ b. Rest of the page remains unchanged. |

### 2.2.7 FAQs

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-008 | Instant Quotation Insurer List | Existing: ⏎ "Which insurers can I get instant quotation from?" lists: ⏎ 1. Lonpac Insurance Bhd ⏎ 2. Tokio Marine Insurans (Malaysia) Berhad ⏎ New Expected: ⏎ 1. Lonpac Insurance Bhd ⏎ 2. Allianz General Insurance Company (Malaysia) Berhad ⏎ 3. Tokio Marine Insurans (Malaysia) Berhad ⏎ Allianz full name to be confirmed by requestor. | Example 1: Customer opens FAQs and expands the question ⏎ a. Answer lists Lonpac, Allianz and Tokio Marine, in this order. ⏎ b. Other FAQ questions remain unchanged. |

### 2.2.8 Support — Need to Contact Insurance Company?

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-009 | Allianz Contact Section | Existing: ⏎ Contact sections shown for Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad. ⏎ New Expected: ⏎ a. Add Allianz contact section between Lonpac and Tokio Marine. ⏎ b. Same format as existing insurers: insurer name header with expand / collapse, contact details listed below. ⏎ Allianz contact details: ⏎ Allianz contact numbers to be shared by requestor. More than 1 contact line can be displayed. ⏎ For reference, previous Support page showed 24-Hours Helpline: 1800 22 5542. | Example 1: Customer opens Support > Need to contact insurance company? ⏎ a. Sections displayed as Lonpac, Allianz, Tokio Marine. ⏎ Example 2: Customer expands Allianz section ⏎ a. Allianz contact details are displayed. ⏎ Example 3: Customer collapses Allianz section ⏎ a. Allianz contact details are hidden, same as other insurers. |

### 2.2.9 Receipt

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12406-REQ-010 | Allianz Company Number | Existing: ⏎ Insurer shown as: ⏎ Allianz General Insurance Company (Malaysia) Berhad (735426-V) ⏎ New Expected: ⏎ Follow Tokio Marine format: insurer name, then new business registration number (BRN) with old number in brackets. ⏎ Tokio Marine (current): ⏎ Tokio Marine Insurans (Malaysia) Berhad ⏎ 198601000381 (149520-U) ⏎ Allianz (new): ⏎ Allianz General Insurance Company (Malaysia) Berhad ⏎ 00601015674 (735426-V) ⏎ BRN to be verified: 11 digits given, new SSM format is 12 digits. | Example 1: Customer or CIBO user opens receipt for Allianz transaction ⏎ a. Insurer shows Allianz name with new BRN and old number in brackets, same layout as Tokio Marine. ⏎ Example 2: Receipt for Tokio Marine or Lonpac transaction ⏎ a. No change. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.3 | EAINT-12406-REQ-001 | Added | Initial draft |
| 2 | 0.3 | EAINT-12406-REQ-002 | Added | Initial draft |
| 3 | 0.3 | EAINT-12406-REQ-003 | Added | Initial draft |
| 4 | 0.3 | EAINT-12406-REQ-004 | Added | Initial draft |
| 5 | 0.3 | EAINT-12406-REQ-005 | Added | Initial draft |
| 6 | 0.3 | EAINT-12406-REQ-006 | Added | Initial draft |
| 7 | 0.3 | EAINT-12406-REQ-007 | Added | Initial draft |
| 8 | 0.3 | EAINT-12406-REQ-008 | Added | Initial draft |
| 9 | 0.3 | EAINT-12406-REQ-009 | Added | Initial draft |
| 10 | 0.3 | EAINT-12406-REQ-010 | Added | Initial draft |
