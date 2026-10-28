# EAINT-12120 — Jira capture (27/10/2026, 9:06:06 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-Backend] JPJ Official Receipt: Automate Monthly Compilation and Email of Transactions Without JPJ Official Receipt to JPJ Hasil
2. **Type:** Task · **Status:** To Do · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260727-260731, July2026, ProductBacklog
6. **Created:** 2026-07-30T12:45:31.831+0800 · **Updated:** 2026-08-27T11:13:38.856+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** Relates: EAINT-12222 [eAuto-Backlog] JPJ Official Receipt — recover receipt emails lost to Microsoft throttling, and send a daily processing report to Teams
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | Backend |
| 2 | Affected Module | JPJ Official Receipt |
| 3 | Request | - Automate identification of completed eAuto transactions that do not have a JPJ Official Receipt. - Compile all affected transactions into one report. - Automatically email the report to JPJ Hasil to request the missing receipts. - Report to be generated once a month. |
| 4 | Existing Issue/Behaviour | - Missing receipt cases are identified mainly when a UCD submits a complaint. - CSE receives the complaint from the UCD. - Operations requests IT to check the database for affected transactions. - IT compiles the transaction listing and emails JPJ Hasil to request the missing receipts. - Transactions without a UCD complaint may not be identified. |
| 5 | Expected New Handling/Behaviour | - System checks completed eAuto transactions. - System identifies transactions that do not have a JPJ Official Receipt. - All affected transactions are compiled into one report. - Report is generated once a month. - Report is automatically emailed to JPJ Hasil to request the missing receipts. |
| 6 | Additional Note | - Monthly run date and email recipient list to be confirmed with Operations. - Expected outcome: identify missing receipts without waiting for UCD complaints, reduce manual work for CSE, Operations and IT, speed up the request to JPJ Hasil, and ensure all affected transactions are compiled completely and consistently. |

## Comments (0)

## Attachments
