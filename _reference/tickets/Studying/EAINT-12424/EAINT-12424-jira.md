# EAINT-12424 — Jira capture (27/10/2026, 9:05:32 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[eAuto-UCD] Insurance - Auto Add "NO." Prefix for Chubb Address Line 1 Below 3 Characters
2. **Type:** Task · **Status:** REQ GATHERING & ANALYSIS IN PROGRESS · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 260928-261002, October2026, ProductBacklog
6. **Created:** 2026-10-01T08:18:11.681+0800 · **Updated:** 2026-10-27T18:15:03.261+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD |
| 2 | Affected Module | Insurance |
| 3 | Request | Enhance Chubb cover note address handling so transaction does not fail at cover note submission |
| 4 | Existing Issue/Behaviour | - No minimum character check on Address Line 1. - Chubb transaction fails at cover note submission after payment is paid. - Error returned - ADDRESS_1 must have at least 3 characters. |
| 5 | Expected New Handling/Behaviour | - Chubb confirmed Address Line 1 minimum is 3 characters. - If Address Line 1 is less than 3 characters, system auto adds "NO." in front (e.g. 27 → NO.27, and A1 → NO.A1,). - Same logic applies to address carried over from eSTM. - Applies to value sent to Chubb only. Address saved in UCD stays as entered. - Transaction created before deployment that failed: resubmission applies same rule. |
| 6 | Additional Note | - |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 01.10.2026 (Thurs) | v0.1 | Initial Draft |  |
| 2 | 05.10.2026 (Mon) | v0.2 | Updated per developer findings; pending items added |  |
| 3 | 27.10.2026 (Tues) | v0.3 | a. Confirmed Chubb UAT connection for testing in Section 2.1.3.  b. Confirmed comma, space and symbol handling in Section 2.2.2 and Section 2.2.4.  c. Confirmed rule for BackOffice resubmit, CIBO and API clients in Section 2.2.3 and Section 2.2.4.  d. Added Example 10 to Section 2.2.4 Requirement EAINT-12424-REQ-001. |  |
| 4 | 27.10.2026 (Tues) | v1.0 | Send out for external review |  |

## Comments (0)

## Attachments

1. SRD_EAINT-12424_v0.1_20261001.docx — 14160 bytes, 2026-10-01T16:51:01.019+0800, by Chee Mei Jia
1. SRD_EAINT-12424_v0.2_20261005.docx — 15411 bytes, 2026-10-05T10:51:28.687+0800, by Chee Mei Jia
1. SRD_EAINT-12424_v0.3_20261027.docx — 26921 bytes, 2026-10-27T18:15:03.273+0800, by Lim Yi Link
1. SRD_EAINT-12424_v1.0_20261027.docx — 26877 bytes, 2026-10-27T18:15:04.168+0800, by Lim Yi Link
1. SRD_EAINT-12424_v1.0_20261027.pdf — 143569 bytes, 2026-10-27T18:15:04.061+0800, by Lim Yi Link