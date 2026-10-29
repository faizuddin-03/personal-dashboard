# SRD_EAINT-12119_v0.9_20260911.docx — text copy (27/10/2026, 5:24:05 pm)

Converted from a Word document (headings and tables kept as text; images not kept).

SYSTEM REQUIREMENT DOCUMENT (SRD)

| Requirement | eAuto Logistics: Interstate Price Tier for Logistics Delivery |
| Version | Version 0.9 |
| Latest Revision Date | 11.09.2026 (Friday) |

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
| 0.3 | 14.08.2026 (Fri) | Chee Mei Jia | Updated following sync-up with Development and requestor's input |
| 0.4 | 20.08.2026 (Thurs) | Chee Mei Jia | Updated following sync-up with Requestor on 20.08.2026 |
| 0.5 | 27.08.2026 (Thurs) | Chee Mei Jia | Updated Sections 2.2.5, 2.2.6 and 2.2.10 |
| 0.6 | 08.09.2026 (Tues) | Chee Mei Jia | Updated Sections 2.1.1, 2.2.5, 2.2.6, 2.2.8, 2.2.9 and 2.2.10 |
| 0.7 | 09.09.2026 (Wed) | Chee Mei Jia | Updated Sections 1.5, 2.2.6, 2.2.8 and 2.2.10 |
| 0.8 | 10.09.2026 (Thurs) | Chee Mei Jia | Updated Sections 2.2.6, 2.2.8 and 2.2.9 |
| 0.9 | 11.09.2026 (Fri) | Chee Mei Jia | Updated Sections 2.2.5 and 2.2.6 |

Note: Update made to the document is highlighted in blue

## 1.4 Glossary of Terms

| # | Abbreviation / Term | Interpretation / Description |
| 1 | Pricing Tier | Charge band determined by the distance range of a delivery |
| 2 | Logistics Price | Amount charged to the Used Car Dealer for a delivery falling within a pricing tier |

## 1.5 Associated Document(s)

| # | Item | Location / URL | Rationale for Relevance |
| 1 | EAINT-12119 — Logistics: Interstate Price Tier for Logistics Delivery | https://mfservices.atlassian.net/browse/EAINT-12119 | Internal IT ticket |
| 2 | EAUTO-1004 — Wholesale Enhancement: Interstate Price Tier | https://mfservices.atlassian.net/browse/EAUTO-1004 | Source ticket |
| 3 | CCB-884 — EAUTO / Wholesale Enhancement: Interstate Price Tier | https://mfservices.atlassian.net/browse/CCB-884 | Cross-department ticket |
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
| 2 | Tier names and distance ranges are fixed values and are not configurable by BackOffice users. |
| 3 | The existing Reset Payment mechanism in eAuto BackOffice can be reused to re-price pending transactions. |
| 4 | Distance used to assign a pricing tier is measured by the system between the two points a delivery was created with. The logistics provider does not supply the distance. |
| 5 | Google Maps is used to validate and verify addresses for both the Used Car Dealer and the logistics hubs. |
| 6 | The logistics price held in the tier table is the hub to hub price. A door to door delivery adds 200.00 on top of the tier price. That addition is applied by the payment service and is outside the scope of this document. |

### 2.1.2 Out-of-Scope

| # | Item | Reason |
| 1 | Standalone Logistics service | Deferred to a later phase. Round one covers Wholesale Logistics only. ⏎ For the standalone module, refer to EAUTO-936 and EAINT-12019. |
| 2 | Configuration of tier names and distance ranges | Fixed values for this release. Only the logistics price is configurable. |
| 3 | Sea freight rate type | Not applicable as East Malaysia addresses are rejected. Refer to Section 2.2.9. |
| 4 | Notification to the Used Car Dealer on repricing | Not required. Confirmed on 07.08.2026. The re-priced amount is shown on the full payment page when the Used Car Dealer proceeds to pay. |
| 5 | Manual reset of payment | Not required. Confirmed on 20.08.2026. The reset is fully automatic and no manual reset control is provided on the wholesale transaction listing. |
| 6 | Follow up on a delivery address the map cannot find | Handled by the Customer Service Executive team as an operational procedure. The system displays the error message described in REQ-027 and no further system support is required. |

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
| 2 | Expected New Handling / Behaviour | 1. A new BackOffice page allows the logistics price of each pricing tier to be maintained. ⏎ 2. Interstate price follows the tier, corresponding to the charge given by the logistics company to eAuto. ⏎ 3. On saving a rate change, pending transactions are re-priced so the Used Car Dealer pays the new rate and no longer pays the old rate. ⏎ 4. Applies to Wholesale Logistics for this release. |

### 2.2.3 Affected Pages

| # | Affected Pages | Description |
| 1 | BackOffice — Home Menu | New module Logistics Hub added to the BackOffice home menu. |
| 2 | BackOffice — Logistics Hub — Logistics Charges Matrix Setup | New page for maintaining the logistics price of each pricing tier. |
| 3 | BackOffice — Logistics Hub — Logistics Charges Matrix Setup (Change History) | New section recording every price change with the person responsible and the reason. |
| 4 | BackOffice — Logistics Hub — Hub Management | New page for maintaining the logistics hub records, with address verification on save. |
| 5 | UCD — Wholesale Listing — Full Payment Page | Payment is automatically reset and the new pricing is reflected when a price change affects a transaction that has not been paid. |
| 6 | UCD — Wholesale Listing — Delivery Address Entry | Address is validated before the Used Car Dealer is allowed to proceed to payment. |

### 2.2.4 BackOffice — Menu Access

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-001 | New Menu Item | Add a new module named Logistics Hub to the BackOffice home menu, with the Logistics Charges Matrix Setup page listed under it. | A new Logistics Hub module appears on the BackOffice home menu. The Logistics Charges Matrix Setup menu item is listed under it and opens the Logistics Charges Matrix Setup page. |
| 2 | EAINT-12119-REQ-002 | Hub Management Menu Item | Add the Hub Management page as a menu item under the Logistics Hub module. | The Hub Management menu item is listed under the Logistics Hub module and opens the Hub Management page. |

### 2.2.5 BackOffice — Logistics Charges Matrix Setup Page

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-003 | Pricing Tier Listing | Display the 4 pricing tiers with the tier name and the distance range. Tier name and distance range are display only. | The setup table displays the following columns: ⏎ 1. # ⏎ 2. Tier ⏎ 3. Distance Range (KM) ⏎ 4. Suggested Base Rate (RM) ⏎ 5. Ops Price (RM) ⏎ 6. Effective Price (RM) ⏎ The page lists the 4 tiers as follows: ⏎ 1. Tier 1 (Base): distance range 0 to 250, suggested base rate 300.00 ⏎ 2. Tier 2 (Standard): distance range 250.001 to 400, suggested base rate 450.00 ⏎ 3. Tier 3 (Extended): distance range 400.001 to 600, suggested base rate 650.00 ⏎ 4. Tier 4 (Premium): distance range 600.001 and above, suggested base rate 1,000.00 ⏎ Tier name and distance range cannot be edited from this page. |
| 2 | EAINT-12119-REQ-004 | Logistics Price Input | Provide 3 money columns for each tier: the suggested base rate as a read only floor, the editable Ops Price, and the Effective Price currently in force. | Suggested Base Rate is display only. It shows the minimum permitted for that tier and cannot be edited. ⏎ Ops Price is the only editable field. On page load it is pre-filled with the value the Operations user last saved, shown as whole numbers for editing, for example 1000. ⏎ Effective Price is display only. It shows the price currently being charged, formatted as 1,000.00. Because a saved price takes effect at once, Effective Price always matches Ops Price. |
| 3 | EAINT-12119-REQ-005 | Logistics Price Validation | Apply validation on the Ops Price input. | 1. Min Length: Not applicable, controlled by the minimum value per tier ⏎ 2. Max Length: Not applicable, controlled by the maximum value ⏎ 3. Special Character: No ⏎ 4. Alphanumeric: No, numeric input only ⏎ 5. Only Allow English: Not applicable, numeric input only ⏎ 6. Mandatory / Optional: Mandatory ⏎ The user enters whole numbers only. The comma and the decimal point are not keyed in by the user, for example 1000 is entered for one thousand ringgit. ⏎ Minimum value permitted per tier: ⏎ 1. Tier 1 (Base): 300.00 ⏎ 2. Tier 2 (Standard): 450.00 ⏎ 3. Tier 3 (Extended): 650.00 ⏎ 4. Tier 4 (Premium): 1,000.00 ⏎ Maximum value permitted for all tiers is 10,000.00. ⏎ Decimal values are not permitted. The rate must be a whole ringgit amount, so the decimal portion is always 00. ⏎ Example: 300.00 is accepted. 300.80 is rejected. ⏎ A value below the tier minimum, above the maximum, or carrying a decimal value other than 00 displays the message: Please enter a valid amount. |
| 4 | EAINT-12119-REQ-006 | Reason / Remarks Input | Provide a mandatory reason field that must be completed before a rate change can be saved. | 1. Min Length: 5 ⏎ 2. Max Length: 255 ⏎ 3. Special Character: Yes ⏎ 4. Alphanumeric: Yes ⏎ 5. Only Allow English: Yes ⏎ 6. Mandatory / Optional: Mandatory |
| 5 | EAINT-12119-REQ-007 | Save Changes | Save the amended logistics prices together with the reason entered. | Example 1: 1 or More Prices Amended and Reason Completed ⏎ Changes are saved, 1 Change History entry is created per amended tier, and the reason field is cleared. A confirmation message is displayed: N tier rate change(s) saved and logged to Change History, where N is the number of tiers amended. ⏎ Example 2: Save Selected without Amending any Price ⏎ Save is blocked with the message: No rate changes to save. ⏎ Example 3: Price Amended but Reason Left Blank ⏎ Save is blocked with the message: Reason / Remarks is required to save a rate change. The cursor focuses the reason field. |
| 6 | EAINT-12119-REQ-008 | Cancel | Discard any unsaved edits and return to the BackOffice home menu. | Selecting Cancel returns the user to the home menu. No change is written to the pricing tier values or the Change History. |
| 7 | EAINT-12119-REQ-009 | Scope Note Display | Display a note stating the scope of the pricing maintained on this page. | The page displays the note: This pricing applies to both Wholesale and Standalone Logistics. |
| 8 | EAINT-12119-REQ-010 | Access Control | Restrict access to the Logistics Charges Matrix Setup page to a defined list of BackOffice users. | Access is controlled by a fixed list of BackOffice user accounts held in system configuration. ⏎ The following accounts are granted access for this release: ⏎ 1. eautonurul ⏎ 2. eautosoyeng ⏎ 3. mfizni ⏎ 4. mfmeijia ⏎ A user not on the list cannot see the Logistics Hub menu item and cannot open the page directly. ⏎ The list can be amended by the Information Technology team without a rebuild. ⏎ A permission screen allowing the Operations lead to grant and revoke access for their own department is out of scope for this release and will be raised separately. |

### 2.2.6 Price Change Impact on Unpaid Transactions

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-011 | Price Change Takes Effect on Save | A logistics price saved by the BackOffice user becomes the live price at the point of saving. No scheduled process runs and no waiting period applies. | The new price is written to the pricing tier and recorded in the Change History at the point of saving. ⏎ The next Used Car Dealer to reach the payment screen is charged at the new price. ⏎ Example: the BackOffice user amends Tier 1 (Base) from 300.00 to 350.00 at 11:00. A Used Car Dealer reaching the payment screen at 11:05 is charged 350.00. |
| 2 | EAINT-12119-REQ-012 | Price Checked at the Payment Screen | Recalculate the logistics fee at the current tier price each time a Used Car Dealer opens the full payment page for a transaction that has not been paid. | The fee held on the transaction is compared against the current tier price. ⏎ A transaction holding a flat fee with no tier assigned is also a mismatch and is priced (this refers to existing wholesale production transactions holding a fixed price of RM400.00). ⏎ Example 1: Price is Unchanged ⏎ The transaction proceeds at the amount already held. Nothing is reset. ⏎ Example 2: Price Has Moved ⏎ The fee is recalculated, the existing payment is reset, and the Used Car Dealer pays the new amount. ⏎ Example 3: Price Changes While the Payment Screen Is Already Open ⏎ The Used Car Dealer has the payment screen open showing a logistics price of 500.00. The BackOffice user amends the price to 600.00. When the Used Car Dealer selects Proceed to Payment, the following message is displayed: ⏎ Previously RM 500.00. Now RM 600.00. Click OK to reload and view the updated pricing. ⏎ Selecting OK reloads the page and the Used Car Dealer sees 600.00. |
| 3 | EAINT-12119-REQ-013 | Handling by Payment Status | Apply the price check according to the payment status of the transaction at the point the Used Car Dealer proceeds. | Example 1: Payment Status is Pending ⏎ The Used Car Dealer opens the payment screen and views the new price. No reset is carried out at this point. ⏎ Example 2: Payment Status is Failed ⏎ The Used Car Dealer selects Resubmit. The new price is displayed for review and is not charged at this point. The Used Car Dealer must select the payment button to proceed, and the payment is reset in the background at that point. ⏎ Example 3: Transaction has been Approved ⏎ No action is taken. The amount already paid stands and the transaction is never re-priced. |
| 4 | EAINT-12119-REQ-014 | Payment at New Pricing | Following the reset, the amount payable reflects the new logistics price. The Used Car Dealer can no longer pay at the old price. | The full payment page displays the re-priced amount when the Used Car Dealer proceeds to pay. ⏎ Example: Tier 1 (Base) is amended from 300.00 to 350.00. A transaction priced at 300.00 becomes 350.00. |
| 5 | EAINT-12119-REQ-015 | One Time Password Re-Issue | Where a payment is reset by the price check, the existing one time password is expired and a new one time password is sent to the main user for approval. | On reset, the one time password previously issued for the transaction is marked as superseded and can no longer be used. ⏎ A new one time password is sent to the main user of the company account for approval before payment can proceed. This applies on the UCD full payment page, where the Used Car Dealer proceeds to pay the re-priced amount. |
| 6 | EAINT-12119-REQ-016 | Audit of a Re-Price | Record every re-price in a backend audit log. The audit log is not displayed in the user interface. | Each entry captures the transaction reference, the amount before and after the re-price, the pricing tier applied, the date and time, and the BackOffice user who changed the tier price. ⏎ Wholesale re-prices are written to their own audit table and do not appear in the existing Reset Payment Report. |

### 2.2.7 BackOffice — Change History

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-017 | Change History Table | Display a change history of every saved rate change below the setup table. | The Change History table displays the following columns: ⏎ 1. # ⏎ 2. Date / Time ⏎ 3. Changed By ⏎ 4. Tier ⏎ 5. Old Rate (RM) ⏎ 6. New Rate (RM) ⏎ 7. Reason ⏎ Date / Time is displayed in the format DD-MM-YYYY HH:MM, using the 24 hour clock with leading zeros. ⏎ Old Rate and New Rate are displayed in the format 1,000.00. ⏎ Example: 07-08-2026 16:47 |
| 2 | EAINT-12119-REQ-018 | One Entry Per Tier Changed | Record a separate change history entry for each tier amended within a single save. | Example 1: 1 Tier Amended in a Save ⏎ 1 entry is created. ⏎ Example 2: 3 Tiers Amended in a Single Save ⏎ 3 entries are created, each sharing the same date and time, the same user, and the same reason. |
| 3 | EAINT-12119-REQ-019 | Sort Order and Record Count | Display the change history with the most recent entry first, together with a record count. | The most recent entry appears at the top of the table. ⏎ A record count is displayed above the table showing the total number of changes recorded. ⏎ Where no change has been recorded, the table displays: No changes recorded yet. |
| 4 | EAINT-12119-REQ-020 | Pagination | Apply pagination to the change history listing. | The first 20 records are displayed on the first page. ⏎ Remaining records are accessible through the pagination control below the table. ⏎ Example: 45 records recorded ⏎ Page 1 shows records 1 to 20, page 2 shows records 21 to 40, page 3 shows records 41 to 45. |

### 2.2.8 BackOffice — Hub Management

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-021 | Hub Management Page | Provide a new BackOffice page for maintaining the logistics hub records. | The page lists the existing logistics hubs with the following columns: ⏎ 1. Number ⏎ 2. Region ⏎ 3. Branch ⏎ 4. State ⏎ 5. Address ⏎ 6. Google Match ⏎ 7. Verification Status ⏎ 8. Active Status ⏎ 9. Verified On ⏎ 10. Action ⏎ 20 hub records exist at the point of this release. ⏎ Google Match shows how precisely the address was placed: ⏎ 1. Exact address — matched the building at that street number, within metres. The hub can be used. ⏎ 2. Street level — matched the street but not the exact premises, 100 to 200 metres out. The hub can be used. ⏎ 3. Neighbourhood — matched only an estate or area, up to about 2 kilometres across. Operations must confirm the location or set the pin. ⏎ 4. Different place — matched a location that is not the one recorded, 10 kilometres or more away. The address is likely wrong. ⏎ 5. Set by Operations — coordinates entered by hand after review, replacing what Google returned. The hub can be used. ⏎ Verification Status is either Verified or Pending Verification. A hub that is not Verified has no usable coordinate and cannot be used in a delivery. ⏎ Verified On shows the date and time of verification in the format DD-MM-YYYY HH:MM. The user who verified the record is stored in the database and is not displayed on screen. ⏎ An Add New Hub control opens a separate page for entering a new hub. Edit opens the same page with the record loaded. ⏎ Active Status is either Active or Inactive, and is held separately from Verification Status. An Inactive control sets a hub to Inactive, and the same control sets it back to Active. ⏎ A hub set to Inactive cannot be selected by a Used Car Dealer. The record is kept and is not deleted, so deliveries already referring to that hub still resolve. |
| 2 | EAINT-12119-REQ-022 | Hub Address Verification | Confirm every hub address against Google Maps and have Operations accept the location before the hub can be used. | Google returns a coordinate for every address, so the check is on how precisely an address was placed, not on whether it was found. ⏎ Scenario 1: Existing Hubs at Launch ⏎ 20 hub records are checked with the Operations team before go live. A hub accepted during that exercise is stored as Verified and a BackOffice user does not verify it again. ⏎ Scenario 2: Adding a New Hub ⏎ 1. BackOffice user enters the hub details. ⏎ 2. BackOffice user selects Verify in Google Maps. ⏎ 3. System displays the matched address, coordinates and match precision. ⏎ 4. BackOffice user reviews the location and selects Confirm This Location. ⏎ 5. Record is saved with status Verified and coordinates are stored. ⏎ Scenario 3: Editing an Existing Hub ⏎ Same steps as Scenario 2 apply, but only when an address is changed. A change to region, branch name or state saves without re-verification and existing verification is retained. ⏎ Example 1: Google Places the Address on the Premises ⏎ BackOffice user confirms the location and the record is saved as Verified. ⏎ Example 2: Google Places the Address Away from the Premises ⏎ BackOffice user either corrects the address and checks again, or selects Set Pin Manually and enters latitude and longitude taken from Google Maps. Record is saved as Verified with Google Match shown as Set by Operations. ⏎ A hub is never saved with an unconfirmed location. Where a location cannot be accepted, the record remains Pending Verification. ⏎ Open item: confirmation of the following hub locations is outstanding with Keith, the person in charge at the logistics partner. The Requestor has followed up several times and no response has been received as at 10.09.2026. ⏎ 1. Seremban — Pekan Bukit Kepayang Daerah Seremban, 70300 Seremban Negeri Sembilan. Google resolves only to the surrounding estate. ⏎ 2. Batu Pahat — Taman Flora, 83000 Batu Pahat, Johor. Google resolves only to the surrounding estate. ⏎ 3. Segamat — Jalan Muhibbah 3, Taman Muhibbah, 85000 Segamat, Johor. Google resolves to Bukit Siput, roughly 10 kilometres from Segamat town, which suggests the recorded address may be wrong. ⏎ Distance is measured between hub coordinates, so an unconfirmed location places a delivery in the wrong distance range and charges the wrong price. |
| 3 | EAINT-12119-REQ-023 | Backend Audit Log | Record every change made to a hub record in a backend audit log. The audit log is not displayed in the user interface. | Each entry captures the user who made the change, the date and time, the hub record affected, the value before and after the change, and where the location was set, the coordinates and the user who verified them. ⏎ Changes captured are creation, amendment, setting a hub to Inactive and setting it back to Active. A hub is never deleted. Setting a hub to Inactive keeps the record, so deals already referring to it still resolve. Logistics price changes are recorded separately in the Change History described in Section 2.2.7. ⏎ The audit log is accessible to the Information Technology team for internal checking only and is not shown on the Hub Management page or any other page. |

### 2.2.9 Address Validation

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-024 | Address Validation Scope | Apply address validation through Google Maps to both the Used Car Dealer delivery address and the logistics hub address. | Validation applies to the address entered by the Used Car Dealer on the wholesale listing. ⏎ Validation applies to the address entered on the Hub Management page. The East Malaysia rejection in REQ-025 does not apply here. |
| 2 | EAINT-12119-REQ-025 | East Malaysia Address Rejection | Reject any address located in Sabah, Sarawak or Labuan. | The address is rejected and the Used Car Dealer is not allowed to proceed to payment. ⏎ The following error message is displayed: Logistics service is not available for Sabah, Sarawak and Labuan addresses at this time. ⏎ The rejection applies on the UCD portal only. A hub located in Sabah, Sarawak or Labuan may still be recorded on the Hub Management page. |
| 3 | EAINT-12119-REQ-026 | Address Validation Timing | Validate the delivery address once only, at the point the Used Car Dealer proceeds to payment. | The company address and branch addresses already held in the system are validated against Google Maps by the Operations team before they are keyed in and saved, in line with their standard operating procedure. ⏎ No further pre-checking is carried out by the system. The system triggers a single Google Maps check when the Used Car Dealer proceeds to payment. |
| 4 | EAINT-12119-REQ-027 | Google Maps Failure Handling | Fall back to an open source mapping service where Google Maps cannot be reached, and display a message where an address cannot be matched. | The Used Car Dealer is shown a message and is not blocked from continuing with the transaction. ⏎ Where the address cannot be matched, no coordinate is stored, so the distance cannot be measured and the delivery cannot be priced. In line with REQ-028, a delivery that cannot be priced is not charged a logistics fee and cannot proceed to full payment. The Customer Service Executive team advises the Used Car Dealer on how to proceed. ⏎ Example 1: Google Maps Service is Unavailable, or the Usage Limit has been Reached ⏎ The address check falls back to an open source mapping service. Confirmed with the Requestor on 10.09.2026. The Requestor accepts that an open source service may be less accurate than Google Maps. ⏎ No handling is required for the case where the open source service is also unavailable. ⏎ Example 2: Address Entered is not Valid, or the Address is Valid but cannot be Found ⏎ The following message is displayed: ⏎ We could not find the address. Please check and try again, or contact support at 03-27798899. |

### 2.2.10 Distance Measurement and Tier Assignment

| # | Requirement ID | Item | Description | Acceptance Criteria |
| 1 | EAINT-12119-REQ-028 | Distance Measurement and Tier Assignment | Measure road distance between the two points a delivery was created with, and assign the pricing tier that measured distance falls into. | Distance is measured between the two points a delivery was created with: a hub’s verified coordinate where a hub was selected, and a party’s own address where it was not. ⏎ Both ends are independent, so one delivery can use a coordinate at one end and an address at the other. No hub is guessed at, and no hub is resolved from a dealer address. ⏎ A delivery is priced once both ends are known. ⏎ A corrected hub location applies to deliveries created after correction. Deliveries already priced keep their price unless Operations re-price them by hand. ⏎ Measured distance in kilometres is matched against distance range of each tier, and logistics price of that tier is applied. ⏎ Example: a delivery measured at 357 kilometres falls in Tier 2 (Standard), so Tier 2 logistics price is applied. ⏎ Where a hub was selected but is not Verified, distance cannot be measured and a delivery cannot be priced. ⏎ Where a delivery cannot be priced, a Used Car Dealer is stopped before payment and this message is displayed: ⏎ We could not work out the delivery charge for this vehicle, so payment cannot proceed right now. Please call eAuto at 03-27798899. ⏎ A refused page shows vehicle price and delivery details, with no delivery charge and no total. |

# Appendix — Requirement Change Log

| # | SRD Version | Requirement ID | Status | Reason |
| 1 | 0.1 | EAINT-12119-REQ-001 | Added | New requirement introduced before baseline |
| 2 | 0.1 | EAINT-12119-REQ-002 | Added | New requirement introduced before baseline |
| 3 | 0.1 | EAINT-12119-REQ-003 | Added | New requirement introduced before baseline |
| 4 | 0.6 | EAINT-12119-REQ-004 | Added | New requirement introduced before baseline |
| 5 | 0.1 | EAINT-12119-REQ-005 | Added | New requirement introduced before baseline |
| 6 | 0.1 | EAINT-12119-REQ-006 | Added | New requirement introduced before baseline |
| 7 | 0.1 | EAINT-12119-REQ-007 | Added | New requirement introduced before baseline |
| 8 | 0.1 | EAINT-12119-REQ-008 | Added | New requirement introduced before baseline |
| 9 | 0.1 | EAINT-12119-REQ-009 | Added | New requirement introduced before baseline |
| 10 | 0.5 | EAINT-12119-REQ-010 | Added | New requirement introduced before baseline |
| 11 | 0.6 | EAINT-12119-REQ-011 | Added | New requirement introduced before baseline |
| 12 | 0.6 | EAINT-12119-REQ-012 | Added | New requirement introduced before baseline |
| 13 | 0.6 | EAINT-12119-REQ-013 | Added | New requirement introduced before baseline |
| 14 | 0.6 | EAINT-12119-REQ-014 | Added | New requirement introduced before baseline |
| 15 | 0.6 | EAINT-12119-REQ-015 | Added | New requirement introduced before baseline |
| 16 | 0.6 | EAINT-12119-REQ-016 | Added | New requirement introduced before baseline |
| 17 | 0.2 | EAINT-12119-REQ-017 | Added | New requirement introduced before baseline |
| 18 | 0.3 | EAINT-12119-REQ-018 | Added | New requirement introduced before baseline |
| 19 | 0.3 | EAINT-12119-REQ-019 | Added | New requirement introduced before baseline |
| 20 | 0.3 | EAINT-12119-REQ-020 | Added | New requirement introduced before baseline |
| 21 | 0.6 | EAINT-12119-REQ-021 | Added | New requirement introduced before baseline |
| 22 | 0.6 | EAINT-12119-REQ-022 | Added | New requirement introduced before baseline |
| 23 | 0.6 | EAINT-12119-REQ-023 | Added | New requirement introduced before baseline |
| 24 | 0.3 | EAINT-12119-REQ-024 | Added | New requirement introduced before baseline |
| 25 | 0.3 | EAINT-12119-REQ-025 | Added | New requirement introduced before baseline |
| 26 | 0.4 | EAINT-12119-REQ-026 | Added | New requirement introduced before baseline |
| 27 | 0.6 | EAINT-12119-REQ-027 | Added | New requirement introduced before baseline |
| 28 | 0.6 | EAINT-12119-REQ-028 | Added | New requirement introduced before baseline |
