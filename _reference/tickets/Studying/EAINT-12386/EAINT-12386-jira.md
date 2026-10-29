# EAINT-12386 — Jira capture (27/10/2026, 8:18:01 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD] JomCheck: Remove Special Character from Chassis No & Auto-Resubmit on Empty Report
2. **Type:** Task · **Status:** REQ REFINEMENT IN PROGRESS -EAUTO · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260921-260925, ProductBacklog, September2026
6. **Created:** 2026-09-21T11:02:36.371+0800 · **Updated:** 2026-10-26T15:21:35.855+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD & Cron Job |
| 2 | Affected Module | JomCheck |
| 3 | Request | - System to detect and remove special character keyed in by user in Chassis No before submitting to JomCheck. - Cron job to handle JomCheck report whenever an empty report code is received. |
| 4 | Existing Issue/Behaviour | - User keys in 21 characters including "-". System responds with empty report. - Empty report received by UCD, and UCD will request refund. |
| 5 | Expected New Handling/Behaviour | - When user keys in Chassis No, system to pick up special character and delete it before submission to JomCheck. - If empty report is received, system to pick up empty report code and resubmit to obtain report. Following existing behaviour where purchasing a 2nd time after first empty report was successful (few minutes interval). |
| 6 | Additional Note | - Key reason: reduce number of empty reports, which in turn reduces number of refund transactions. - ezAuto mentioned that maximum characters for chassis number is 17 and only alphanumeric is accepted. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 09.10.2026 (Fri) | v0.1 | Initial Draft |  |
| 2 | 22.10.2026 (Thurs) | v0.2 | Updated Draft |  |
| 3 | 23.10.2026 (Fri) | v0.3 | Updated Draft |  |
| 4 | 26.10.2026 (Mon) | v0.4 | Updated Draft |  |

## Comments (0)

## Attachments

1. SRD_EAINT-12386_v0.1_20261009.docx — 16531 bytes, 2026-10-10T21:58:39.478+0800, by Chee Mei Jia
1. SRD_EAINT-12386_v0.2_20261022.docx — 17720 bytes, 2026-10-23T08:36:51.816+0800, by Chee Mei Jia
1. SRD_EAINT-12386_v0.3_20261023.docx — 19025 bytes, 2026-10-23T08:36:51.662+0800, by Chee Mei Jia
1. SRD_EAINT-12386_v0.4_20261026.docx — 18220 bytes, 2026-10-26T15:21:35.866+0800, by Chee Mei Jia