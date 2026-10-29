# EAINT-12336 — Jira capture (27/10/2026, 8:03:37 pm)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD & BackOffice] To Reconcile Onboarding Payment Transactions from Fiuu Payment Gateway
2. **Type:** Task · **Status:** To Do · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Lim Yi Link · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260907-260911, ProductBacklog, September2026
6. **Created:** 2026-09-11T10:25:39.363+0800 · **Updated:** 2026-09-15T16:21:59.280+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | - eAuto – Used Car Dealer Portal (Web app) - eAuto – Used Car Dealer Portal (Mobile app) - eAuto – Back Office User Portal |
| 2 | Affected Module | - Pre-application - Onboarding - Back Office - UCD Portal |
| 3 | Request | Onboarding Reconciliation – Fiuu Payment Gateway. Reconcile all payment transactions for onboarding, covering both pre-application and application. |
| 4 | Existing Issue/Behaviour | Onboarding payment is collected through the Fiuu payment gateway, which differs from the current payment flow. As a result:  - Fiuu transactions fall under the "Other" category and are not reconciled in the Reconcile Summary listing. - Reconciliation is performed manually. |
| 5 | Expected New Handling/Behaviour | - The system shall match records with Transaction Status "Approved" and Registration Fee "OK" against the transaction list from the Fiuu listing. - The Fiuu transaction listing shall be downloaded from Fiuu's merchant portal. The Transaction ID is available in the Excel file downloaded from that portal. - Reconciliation shall be performed on the same page as the current reconciliation. |
| 6 | Additional Note | Integration readiness with Fiuu is not yet confirmed:  - The integrating partner has not confirmed the technical feasibility of this integration. - It has not been confirmed with the integrating partner whether a new API specification document or Integration Design Document (IDD) is required.  Refer to source ticket EAUTO-1057 (Enhancement Request Form V1, 11.09.2026). |

## Comments (0)

## Attachments
