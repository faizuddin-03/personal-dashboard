# EAINT-12349 — Jira capture (27/10/2026, 11:43:10 am)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD & BackOffice] Service Hub: Display Full Shipping Address and Allow OPS to Select Delivered Date in Biometric Device Purchase
2. **Type:** Task · **Status:** REQ REFINEMENT IN PROGRESS -EAUTO · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260914-260918, ProductBacklog, September2026
6. **Created:** 2026-09-17T08:40:34.526+0800 · **Updated:** 2026-10-27T11:02:23.457+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | - UCD - BackOffice |
| 2 | Affected Module | Service Hub > Biometric Device Purchase |
| 3 | Request | - Display full shipping address including postcode and area when "Ship to showroom address" is selected. - Allow OPS to select delivered date when updating delivery status. |
| 4 | Existing Issue/Behaviour | - Shipping Address: for records where "Ship to showroom address" is selected, displayed address does not include postcode and area in some cases, and address shown does not tally with backend record. - Delivered Date: delivery date in Update Shipping Details is fixed to ship-out date, so OPS cannot record actual delivered date. |
| 5 | Expected New Handling/Behaviour | - Shipping Address: full address displayed including postcode and area when "Ship to showroom address" is selected. - Delivered Date: OPS able to select delivered date while updating delivery status in Update Shipping Details. |
| 6 | Additional Note | Refer to enhancement request document dated 08.09.2026 for screenshots of Selection page and Update Shipping Details popup. |

SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 23.10.2026 (Fri) | v0.1 | Initial Draft |  |
| 2 | 27.10.2026 (Tue) | v0.2 | - Split shipping address into separate fields - Added field specs and acceptance criteria - Confirmed showroom address prefill - Default address handling remains as existing - District set as mandatory - Added delivered date picker rules - Labels: Ship Out Date & Delivered Date - No revert once marked Delivered - Pending: delivered date picker range |  |

## Comments (0)

## Attachments

1. SRD_EAINT-12349_v0.1_20261023.docx — 22008 bytes, 2026-10-23T15:32:14.680+0800, by Chee Mei Jia
1. SRD_EAINT-12349_v0.2_20261027.docx — 23399 bytes, 2026-10-27T11:02:23.469+0800, by Chee Mei Jia