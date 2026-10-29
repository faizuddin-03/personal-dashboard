# EAINT-12019 — Jira capture (27/10/2026, 6:55:28 pm)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD] eMOVE – Standalone Logistics Service
2. **Type:** Task · **Status:** REQ REFINEMENT IN PROGRESS -EAUTO · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260720-260724, July2026, ProductBacklog
6. **Created:** 2026-07-21T10:24:30.586+0800 · **Updated:** 2026-10-21T10:53:39.780+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD Portal |
| 2 | Affected Module | eMOVE — new standalone module in UCD Portal.  Confirmed 26.08.2026: not placed under STMS (eSTM & UCD to UCD). |
| 3 | Request | Introduce a new service under eAuto — eAuto MOVE (eMOVE).  It offers car logistics (arrangement & delivery) after a UCD-to-UCD interstate transfer or eSTM (approved) is complete.  Objective: broaden the logistic reach under the eAuto wholesale marketplace. |
| 4 | Existing Issue / Behaviour | 1. Logistic arrangement is only available after a wholesale buy/sell is confirmed.  2. Finance arrangement from Wholesale to Finance is currently done manually. |
| 5 | Expected New Handling / Behaviour | 1. Offer the logistic service as a standalone module in the UCD Portal, with its own entry point.  2. Available after UCD-to-UCD (interstate transfer) and eSTM (approved) are complete.  3. UCD clicks eMOVE to request car delivery; the system arranges the pickup/delivery schedule and charges accordingly (follow the charges matrix).  4. Driver scans a QR code to upload photos and update delivery status.  5. Invoice and e-invoice generated after payment is made.  6. Finance module for vendor payment requests, with payment-status tracking. |
| 6 | Additional Note | Source ticket: EAUTO-936.  Transfer options: Door-to-Door and Hub-to-Hub.  Logistics fee auto-calculated by distance, vehicle type, delivery method, and location accessibility.  Vendor payment via MotoHub (create PO → payment request), paid monthly by quantity of completed jobs.  Charges matrix to be confirmed. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 06.08.2026 (Thurs) | v0.1 | Initial Draft | SRD:      Mockup (Sample): |
| 2 | 04.09.2026 (Fri) | v0.2 | Updated Section 1.5 Associated Documents  Updated Sections 2.1.1 to 2.2.8  Updated Section 2.2.12 Charges Matrix Setup  Updated Section 2.2.16 Pending Items | SRD:    Mockup (Sample):  a. UCD     b. BackOffice      c. Pick Up Scan     d. Drop Off Scan |
| 3 | 14.09.2026 (Mon) | v0.3 | Updated Sections 1.4 and 1.5  Updated Sections 2.1.1 to 2.2.12  Added Sections 2.2.10 and 2.2.13  Renumbered Sections 2.2.11 to 2.2.17 | SRD:   Mockup (Sample) - BackOffice:    Mockup (Sample) - UCD:   Mockup (Sample) - Pick Up:    Mockup (Sample) - Drop Off: |
| 4 | 17.09.2026 (Thurs) | v0.4 | Updated Section 2.1.1 Assumptions  Updated Sections 2.2.6 and 2.2.7  Updated Section 2.2.13 Amount Reconciliation  Updated Sections 1.4, 1.5, 2.2.5 and 2.2.11  Added Section 2.2.15 Delivery Order | SRD:    Mockup (Sample) - UCD:    Mockup (Sample) - BackOffice:    Mockup (Sample) - Pick Up:     Mockup (Sample) - Drop Off: |
| 5 | 09.10.2026 (Fri) | v0.5 | Added open items for confirmation in Sections 2.2.6, 2.2.11 and 2.2.12  Added open items for confirmation in Sections 2.2.15, 2.2.17 and 2.2.19  Updated Additional Note in Section 2.2.1  Added Sections 2.2.15 and 2.2.16 from https://mfservices.atlassian.net/browse/EAINT-12119  Restructured Sections 2.2.6 to 2.2.16 | SRD:    Mockup (Sample) - UCD:   Mockup (Sample) - BackOffice:   Mockup (Sample) - Pick Up:   Mockup (Sample) - Drop Off: |
| 6 | 14.10.2026 (Wed) | v0.6 | Removed open items in Sections 2.2.6 and 2.2.9  Confirmed Trans Type and RHB Ref 2 in Section 2.2.9 | SRD: |
| 7 | 19.10.2026 (Mon) | v0.7 | Removed JPJ Approved Date limit in Sections 2.2.4 and 2.2.6  Updated vehicle detail fields in Section 2.2.6  Added Wholesale conflict check in Section 2.2.6  Confirmed Delivery Order number, email and legal pages in Section 2.2.15  Added Logistics Driver details in Section 2.2.19  Applied build team confirmations across Sections 2.2.5 to 2.2.19 | SRD: |
| 8 | 21.10.2026 (Wed) | v0.8 | Updated Search message and check order in Section 2.2.6  Standardised date format in Sections 2.2.6 and 2.2.15  Updated cancellation handling in Section 2.2.12  Moved Delivered Date column in Section 2.2.11  Added server-side messages in Sections 2.2.11 and 2.2.19  Added logistics email recipients in Section 2.2.15  Added Service column in Section 2.2.5  Added SST Payment Report in Section 2.2.12  Corrected Retry, Resubmit, Re-arrange and filter notes | SRD: |

## Comments (0)

## Attachments

1. EAINT-12019_eMOVE_Logistics_Backoffice_20260914.html — 57214 bytes, 2026-09-14T16:50:40.816+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Backoffice_20260917.html — 60948 bytes, 2026-09-17T17:04:17.073+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Backoffice_20261009.html — 60904 bytes, 2026-10-11T21:38:06.705+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_DropOff_20260914.html — 16972 bytes, 2026-09-14T16:50:40.515+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_DropOff_20260917.html — 16887 bytes, 2026-09-17T17:04:16.815+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_DropOff_20261009.html — 16887 bytes, 2026-10-11T21:38:06.810+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_PickUp_20260914.html — 16621 bytes, 2026-09-14T16:50:41.066+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_PickUp_20260917 (c3a19f93-557e-473f-b813-461c3bd9e63f).html — 16089 bytes, 2026-09-17T17:04:59.216+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Driver_PickUp_20261009.html — 16089 bytes, 2026-10-11T21:38:06.611+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_UCD_20260904.html — 83890 bytes, 2026-09-04T16:27:15.027+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_UCD_20260914.html — 95652 bytes, 2026-09-14T16:50:41.290+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_UCD_20260917.html — 96592 bytes, 2026-09-17T17:04:16.324+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_UCD_20261009.html — 97300 bytes, 2026-10-11T21:38:06.906+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE Logistics_Backoffice_20260806.html — 58594 bytes, 2026-09-04T16:27:14.801+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE Logistics_Driver_DropOff_20260806.html — 14712 bytes, 2026-09-04T16:27:14.109+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE Logistics_Driver_PickUp_20260806.html — 14361 bytes, 2026-09-04T16:27:14.348+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE Logistics_UCD_20260806.html — 77298 bytes, 2026-08-26T12:17:30.320+0800, by Chee Mei Jia
1. EAINT-12019_SRD_v0.1_20260806.docx — 29967 bytes, 2026-08-26T12:17:30.628+0800, by Chee Mei Jia
1. EAINT-12019_SRD_v0.2_20260904.docx — 33653 bytes, 2026-09-04T16:27:14.572+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.3_20260914.docx — 34471 bytes, 2026-09-14T16:50:40.235+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.4_20260917.docx — 40471 bytes, 2026-09-17T17:04:16.548+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.5_20261009.docx — 133884 bytes, 2026-10-11T21:38:06.470+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.6_20261014.docx — 131739 bytes, 2026-10-20T08:09:07.267+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.7_20261019.docx — 122959 bytes, 2026-10-20T08:09:07.389+0800, by Chee Mei Jia
1. SRD_EAINT-12019_v0.8_20261021.docx — 126374 bytes, 2026-10-21T10:53:39.793+0800, by Chee Mei Jia