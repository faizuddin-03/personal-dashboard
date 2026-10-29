# EAINT-12119_SRD_v0.2_20260807.docx — text copy (27/10/2026, 5:24:02 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | eAuto Logistics: Interstate Price Tier for Logistics Delivery |
| Version | Version 0.2 |
| Latest Revision Date | 07.08.2026 (Friday) |

CONTENTS

# 1.0 DOCUMENT INFORMATION

## 1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure the system meets business goals. Sign-off is required for development to start, and any changes must follow the System Enhancement Management process.

## 1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, or validating the system requirements.

## 1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes may result in an addendum, while less critical updates may be handled through a formal change request.

| Version No | Date | Revised By | Reason for Revision |
| 0.1 | 06.08.2026 (Thurs) | Chee Mei Jia | Initial Draft |
| 0.2 | 07.08.2026 (Fri) | Chee Mei Jia | Updated Sections 1.4, 1.5, 2.1.2, 2.2.1, 2.2.3, 2.2.5, 2.2.6 and 2.2.7 |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | Pricing Tier | Charge band determined by the original price range of a delivery |
| 2 | Suggested Base Rate | Amount charged to the Used Car Dealer for a delivery falling within a pricing tier |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12119 — Logistics: Interstate Price Tier for Logistics Delivery | https://mfservices.atlassian.net/browse/EAINT-12119 | Main development ticket for this requirement |
| 2 | EAUTO-1004 — Wholesale Enhancement: Interstate Price Tier | https://mfservices.atlassian.net/browse/EAUTO-1004 | Source enhancement request raised by Operations |
| 3 | CCB-884 — EAUTO / Wholesale Enhancement: Interstate Price Tier | https://mfservices.atlassian.net/browse/CCB-884 | Change Control Board ticket |
| 4 | BackOffice Prototype — Logistics Charges Matrix Setup | Shared separately by Business Analyst | Reference for the page layout and change history behaviour |

# 2.0 REQUIREMENT

## 2.1 High-Level Requirement Overview

| # | Item | Description |
| 2.1.1 | Enhancement Overview | To introduce a configurable interstate pricing tier for logistics delivery, maintained from BackOffice. ⏎ When a tier rate is amended, pending transactions are re-priced so the Used Car Dealer pays the new rate. |
| 2.1.2 | Key Value(s) Expected | 1. Interstate charges can be maintained by Operations without a code change. ⏎ 2. Price charged to the Used Car Dealer stays aligned with the charge given by the logistics company to eAuto. ⏎ 3. Every rate change is recorded with the person responsible, the old and new value, and the reason. |
| 2.1.3 | Additional Note(s) | Refer to the attached Excel file in EAUTO-1004 for the full interstate charges listing. |

### 2.1.1 Assumptions

| # | Assumption |
| 1 | Round one of this enhancement covers Wholesale Logistics only. |
| 2 | Tier names and original price ranges are fixed values and are not configurable by BackOffice users. |
| 3 | The existing Reset Payment mechanism in eAuto BackOffice can be reused to re-price pending transactions. |
| 4 | The distance determination method used to assign a pricing tier will be confirmed by the logistics provider before development starts. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | Standalone Logistics service | Deferred to a later phase. Round one covers Wholesale Logistics only. ⏎ For the standalone module, refer to EAUTO-936 and EAINT-12019. |
| 2 | Sabah, Sarawak and Labuan addresses | Excluded from the Logistics service for this release. |
| 3 | Configuration of tier names and original price ranges | Fixed values for this release. Only the suggested base rate is configurable. |
| 4 | Sea freight rate type | Not applicable while East Malaysia addresses are excluded. |
| 5 | Notification to the Used Car Dealer on repricing | Not required. Confirmed on 07.08.2026. The re-priced amount is shown on the full payment page when the Used Car Dealer proceeds to pay. |

## 2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the requestor will be responsible to review and confirm.

### 2.2.1 Background

| # | Affected Item | Description |
| 1 | Project | eAuto |
| 2 | Portal | 1. BackOffice ⏎ 2. UCD |
| 3 | Module | Logistics |
| 4 | Request | To maintain the interstate price tier from BackOffice and re-price pending transactions when a rate is changed. |
| 5 | Additional Note | Refer to the attached Excel file in EAUTO-1004 for the full interstate charges listing. |

### 2.2.2 Existing Issue & Expected Behaviour

| # | Item | Description |
| 1 | Existing Issue / Behaviour | 1. Wholesale logistics does not have an interstate price. ⏎ 2. Delivery charges follow the existing tier only, with no separate interstate rate. ⏎ 3. No BackOffice page exists to maintain the logistics charges. |
| 2 | Expected New Handling / Behaviour | 1. A new BackOffice page allows the suggested base rate of each pricing tier to be maintained. ⏎ 2. Interstate price follows the tier, corresponding to the charge given by the logistics company to eAuto. ⏎ 3. On saving a rate change, pending transactions are re-priced so the Used Car Dealer pays the new rate and no longer pays the old rate. ⏎ 4. Applies to Wholesale Logistics for this release. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Home Menu | New menu item added under the Account Management section. |
| 2 | BackOffice — Logistics Charges Matrix Setup | New page for maintaining the suggested base rate of each pricing tier. |
| 3 | BackOffice — Logistics Charges Matrix Setup (Change History) | New section recording every rate change with the person responsible and the reason. |
| 4 | UCD — Wholesale Listing — Full Payment Page | Payment is automatically reset and the new pricing is reflected when a rate change affects a transaction that has not been paid. |

### 2.2.4 BackOffice — Menu Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-001 | New Menu Item | Add a new menu item named Logistics Charges Matrix Setup under the Account Management section of the BackOffice home menu. | The menu item appears as the last item under Account Management and opens the Logistics Charges Matrix Setup page. |

### 2.2.5 BackOffice — Logistics Charges Matrix Setup Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-002 | Pricing Tier Listing | Display the four pricing tiers with the tier name and the original price range. Tier name and original price range are display only. | The setup table displays the following columns: ⏎ 1. # ⏎ 2. Tier ⏎ 3. Original Price Range (RM) ⏎ 4. Suggested Base Rate (RM) ⏎ The page lists the four tiers as follows: ⏎ 1. Tier 1 (Base): original price range less than or equal to 250, suggested base rate 300.00 ⏎ 2. Tier 2 (Standard): original price range 251 to 400, suggested base rate 450.00 ⏎ 3. Tier 3 (Extended): original price range 401 to 600, suggested base rate 650.00 ⏎ 4. Tier 4 (Premium): original price range more than 600, suggested base rate 1,000.00 ⏎ Tier name and original price range cannot be edited from this page. |
| 2 | EAINT-12119-REQ-003 | Suggested Base Rate Input | Provide an editable input for the suggested base rate of each tier. | Each tier row shows an editable suggested base rate field. ⏎ On page load, each field is pre-filled with the value currently in effect. |
| 3 | EAINT-12119-REQ-004 | Suggested Base Rate Validation | Apply validation on the suggested base rate input. | 1. Min Length: 4 ⏎ 2. Max Length: 10 ⏎ 3. Special Character: Yes, comma as thousands separator and full stop as decimal separator only ⏎ 4. Alphanumeric: No, numeric input only ⏎ 5. Only Allow English: Not applicable, numeric input only ⏎ 6. Mandatory / Optional: Mandatory ⏎ The rate is displayed and stored in the format 1,000.00, using a comma as the thousands separator and two decimal places. ⏎ Value must be greater than zero. ⏎ Invalid entry displays the message: Please enter a valid amount. |
| 4 | EAINT-12119-REQ-005 | Reason / Remarks Input | Provide a mandatory reason field that must be completed before a rate change can be saved. | 1. Min Length: 5 ⏎ 2. Max Length: 255 ⏎ 3. Special Character: Yes ⏎ 4. Alphanumeric: Yes ⏎ 5. Only Allow English: Yes ⏎ 6. Mandatory / Optional: Mandatory |
| 5 | EAINT-12119-REQ-006 | Save Changes | Save the amended suggested base rates together with the reason entered. | Example 1: One or more base rates amended and reason completed ⏎ → Changes are saved, one Change History entry is created per amended tier, and the reason field is cleared. A confirmation message is displayed: N tier rate change(s) saved and logged to Change History, where N is the number of tiers amended. ⏎ Example 2: Save selected without amending any base rate ⏎ → Save is blocked with the message: No rate changes to save. ⏎ Example 3: Base rate amended but reason left blank ⏎ → Save is blocked with the message: Reason / Remarks is required to save a rate change. The cursor focuses the reason field. |
| 6 | EAINT-12119-REQ-007 | Cancel | Discard any unsaved edits and return to the BackOffice home menu. | Selecting Cancel returns the user to the home menu. No change is written to the pricing tier values or the Change History. |
| 7 | EAINT-12119-REQ-008 | Scope Note Display | Display a note stating the scope of the pricing maintained on this page. | The page displays the note: This pricing applies to both Wholesale and Standalone Logistics. |

### 2.2.6 Rate Change Impact on Pending Transactions

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-009 | Automatic Payment Reset | When a BackOffice user saves an amended suggested base rate, the system automatically resets the payment of every affected transaction that has not been paid. No manual action is required from the BackOffice user. | Example 1: Amended tier affects a transaction that has not been paid ⏎ → The system automatically resets the payment for that transaction as part of the save. ⏎ Example 2: Amended tier does not affect any transaction ⏎ → No payment reset is performed. The rate change is still saved. |
| 2 | EAINT-12119-REQ-010 | Affected Transaction Identification | Identify which transactions are affected by the amended suggested base rate. | A transaction is treated as affected when both conditions are met: ⏎ 1. The delivery falls within the pricing tier that was amended. ⏎ 2. Payment status is Pending or Failed. ⏎ Transactions with payment status OK are excluded. ⏎ Example: Tier 1 (Base) is amended from 300.00 to 330.00. ⏎ 1. Transaction LG260009, payment status Pending, total payable RM321.60. Reset, and the total payable becomes RM351.60. ⏎ 2. Transaction LG260008, payment status Failed, total payable RM1,071.60. Reset, and the total payable is recalculated at the new rate. ⏎ 3. Transaction LG260005, payment status OK, total payable RM321.60. Not reset. The amount remains as what the Used Car Dealer has paid, RM321.60. |
| 3 | EAINT-12119-REQ-011 | Payment at New Pricing | Following the reset, the amount payable reflects the new suggested base rate. The Used Car Dealer pays the new pricing and can no longer pay at the old pricing. | The full payment page displays the re-priced amount when the Used Car Dealer proceeds to pay. ⏎ Example: Tier 1 (Base) is amended from 300.00 to 330.00. Transaction LG260009 carries a logistics fee of RM300.00 and a total payable of RM321.60. After the reset, the logistics fee becomes RM330.00 and the total payable becomes RM351.60. |
| 4 | EAINT-12119-REQ-012 | Paid Transactions Unaffected | Transactions where payment has already been completed are not reset and are not re-priced. | Example 1: Payment completed, pickup not yet started ⏎ → Not reset. The original amount stands. ⏎ Example 2: Payment completed, delivery in transit or delivered ⏎ → Not reset. The original amount stands. |

### 2.2.7 BackOffice — Change History

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-013 | Change History Table | Display a change history of every saved rate change below the setup table. | The Change History table displays the following columns: ⏎ 1. # ⏎ 2. Date / Time ⏎ 3. Changed By ⏎ 4. Tier ⏎ 5. Old Rate (RM) ⏎ 6. New Rate (RM) ⏎ 7. Reason ⏎ Date / Time is displayed in the format DD-MM-YYYY HH:MM, using the 24 hour clock with leading zeros. ⏎ Old Rate and New Rate are displayed in the format 1,000.00. ⏎ Example: 07-08-2026 16:47 |
| 2 | EAINT-12119-REQ-014 | One Entry Per Tier Changed | Record a separate change history entry for each tier amended within a single save. | Example 1: One tier amended in a save ⏎ → One entry is created. ⏎ Example 2: Three tiers amended in a single save ⏎ → Three entries are created, each sharing the same date and time, the same user, and the same reason. |
| 3 | EAINT-12119-REQ-015 | Sort Order and Record Count | Display the change history with the most recent entry first, together with a record count. | The most recent entry appears at the top of the table. ⏎ A record count is displayed above the table showing the total number of changes recorded. ⏎ Where no change has been recorded, the table displays: No changes recorded yet. |
| 4 | EAINT-12119-REQ-016 | Pagination | Apply pagination to the change history listing. | The first 20 records are displayed on the first page. ⏎ Remaining records are accessible through the pagination control below the table. ⏎ Example: 45 records recorded ⏎ → Page 1 shows records 1 to 20, page 2 shows records 21 to 40, page 3 shows records 41 to 45. |

### 2.2.8 Pending Items

| # | Item | Status |
| 1 | Confirmation from the logistics provider on how the distance used to determine the pricing tier is calculated. ⏎ Example: a delivery from Shah Alam Hub in Selangor to Penang Hub. ⏎ 1. If actual road distance is used, approximately 350 places the delivery in Tier 2 (Standard) at a base rate of 450.00. ⏎ 2. If an internal state to state table records the same pair as 420, the delivery falls into Tier 3 (Extended) at a base rate of 650.00. ⏎ The same job differs by 200 depending on the source used, so the source must be fixed before development starts. ⏎ Also to confirm the unit of the Original Price Range column, as the column header states Ringgit Malaysia while the page description refers to a distance based range. | Pending |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12119-REQ-001 | Added | New requirement introduced in initial draft |
| 2 | 0.1 | EAINT-12119-REQ-002 | Added | New requirement introduced in initial draft |
| 3 | 0.1 | EAINT-12119-REQ-003 | Added | New requirement introduced in initial draft |
| 4 | 0.1 | EAINT-12119-REQ-004 | Added | New requirement introduced in initial draft |
| 5 | 0.1 | EAINT-12119-REQ-005 | Added | New requirement introduced in initial draft |
| 6 | 0.1 | EAINT-12119-REQ-006 | Added | New requirement introduced in initial draft |
| 7 | 0.1 | EAINT-12119-REQ-007 | Added | New requirement introduced in initial draft |
| 8 | 0.1 | EAINT-12119-REQ-008 | Added | New requirement introduced in initial draft |
| 9 | 0.1 | EAINT-12119-REQ-009 | Added | New requirement introduced in initial draft |
| 10 | 0.1 | EAINT-12119-REQ-010 | Added | New requirement introduced in initial draft |
| 11 | 0.1 | EAINT-12119-REQ-011 | Added | New requirement introduced in initial draft |
| 12 | 0.1 | EAINT-12119-REQ-012 | Added | New requirement introduced in initial draft |
| 13 | 0.1 | EAINT-12119-REQ-013 | Added | New requirement introduced in initial draft |
| 14 | 0.1 | EAINT-12119-REQ-014 | Added | New requirement introduced in initial draft |
| 15 | 0.1 | EAINT-12119-REQ-015 | Added | New requirement introduced in initial draft |
| 16 | 0.2 | EAINT-12119-REQ-004 | Modified | Validation clarified for numeric input |
| 17 | 0.2 | EAINT-12119-REQ-006 | Modified | Session timeout example removed |
| 18 | 0.2 | EAINT-12119-REQ-008 | Modified | Scope note aligned to prototype wording |
| 19 | 0.2 | EAINT-12119-REQ-009 | Modified | Payment reset changed to automatic |
| 20 | 0.2 | EAINT-12119-REQ-010 | Modified | Affected transaction criteria defined |
| 21 | 0.2 | EAINT-12119-REQ-011 | Modified | Payment at new pricing clarified |
| 22 | 0.2 | EAINT-12119-REQ-012 | Modified | Wording aligned to automatic reset |
| 23 | 0.2 | EAINT-12119-REQ-016 | Added | Change history pagination added |
| 24 | 0.2 | EAINT-12119-REQ-002 | Modified | Setup table columns and rates stated |
| 25 | 0.2 | EAINT-12119-REQ-013 | Modified | Column names aligned to prototype |
