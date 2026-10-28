# EAINT-12218 — Jira capture (27/10/2026, 5:45:29 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[Secarang-Macrokiosk Template] Split Renewal Reminder into 9 Templates by Source and Reminder Point
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Charmain Ea Chiang
4. **Fix versions:** S34.1-20261001 🌞 (2026-10-01)
5. **Labels:** 260817-260821, August2026, ProductBacklog
6. **Created:** 2026-08-20T12:29:01.963+0800 · **Updated:** 2026-10-05T14:48:13.229+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-01 · **ETA for Testing (cf 10057):** 2026-09-17 · **[QA] Est Man-day (cf 10081):** 6
8. **Links:** —
9. **Sub-tasks:** EAINT-12390 [Secarang - Macrokiosk Flow] Renewal Reminder - eSTM transaction shows an expiry date in the past; EAINT-12392 [Secarang - Macrokiosk Flow] Renewal Reminder - Date format and opt-out line do not match the SRD, in all 3 message sets; EAINT-12410 [Secarang - CIBO] Macrokiosk Template Management - Template rows show in the wrong order in all 3 cron job groups; EAINT-12413 [Secarang - Macrokiosk Flow] Template Paused - Notification email does not go to the recipients in the SRD
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | Macrokiosk |
| 2 | Affected Module | Macrokiosk Template |
| 3 | Request | Split the renewal reminder into 9 Macrokiosk templates, 1 for each source at each reminder point. |
| 4 | Existing Issue/Behaviour | - All 3 sources share 1 template at each reminder point, so a paused template stops every source at once and the cause cannot be traced. - A paused template cannot be traced to a source or a reminder point. - Customers are not reminded at fixed points before the policy expires. |
| 5 | Expected New Handling/Behaviour | - 9 templates are used, being 1 for each source at each of the 3 reminder points. - Set A, 7 days before policy expiry: eSTM with insurance, eSTM without insurance, Secarang - Set B, 14 days before policy expiry: eSTM with insurance, eSTM without insurance, Secarang - Set C, 30 days before policy expiry: eSTM with insurance, eSTM without insurance, Secarang - Each cron job run sends 1 set: 9:00 AM sends Set A, 12:00 PM sends Set B, 9:00 PM sends Set C. - A customer is included in a run only where the policy expiry date falls exactly on the reminder point for that run. - There is no daily limit on the number of messages sent. Every customer reaching a reminder point is sent in that run. - New CIBO module named Macrokiosk Template Management holding the cron job control, with a backend audit log. - Where Macrokiosk returns a paused template status, the cron job is disabled automatically and an email notification is sent. |
| 6 | Additional Note | - Key reason for raising this request: to identify why Macrokiosk pauses a template, by tracing a pause to a single source and reminder point. - Customer records are drawn from eSTM with insurance, eSTM without insurance, and Secarang. - The 9 template structure and the send schedule were confirmed by the requestor on 28.08.2026. - Template content for the 9 templates is pending the requestor to share. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 20.08.2026 (Thurs) | v0.1 | Initial Draft |  |
| 2 | 24.08.2026 (Mon) | v0.2 | Added Section 2.2.7 CIBO Macrokiosk Template Management  Updated Sections 1.5, 2.2.3, 2.2.6 and 2.2.8 | SRD:     Mockup (Sample): |
| 3 | 26.08.2026 (Wed) | v0.3 | Updated Cover Page  Updated Sections 1.4 to 2.2.3  Restructured Sections 2.2.4 to 2.2.6 |  |
| 4 | 27.08.2026 (Thurs) | v0.4 | Added Section 2.2.6 Proposed Template Structure and Send Schedule  Updated Sections 2.1.3 and 2.2.7 |  |
| 5 | 28.08.2026 (Fri) | v0.5 | Updated Cover Page  Restructured Sections 2.2.4 to 2.2.6  Updated Sections 1.4 to 2.2.3 | SRD:      MockUp (Sample): |
| 6 | 01.09.2026 (Tues) | v0.6 | Added Section 2.2.5 Sample Message Layout  Added Section 2.2.7 Notification Email Content  Updated Sections 2.2.4 to 2.2.8 | SRD:     Mockup (Sample): |
| 7 | 01.09.2026 (Tues) | v0.7 | Updated Sections 2.2.6 and 2.2.8 |  |
| 8 | 02.09.2026 (Wed) | v0.8 | Updated Sections 2.2.6 and 2.2.7 |  |
| 9 | 02.09.2026 (Wed) | v1.0 | Sent out for external review | SRD:     MockUp (Sample): |
| 10 | v1.1 | 03.09.2026 (Thurs) | Added Section 2.2.8 Template Status Handling  Added Section 2.2.9 Template Status Actions  Updated Section 2.2.6 |  |

## Comments (0)

## Attachments

1. cibo-macrokiosk-template-management_20260824.html — 17746 bytes, 2026-08-28T16:40:15.568+0800, by Chee Mei Jia
1. EAINT-12218_cibo-macrokiosk-template-management_20260828.html — 14736 bytes, 2026-08-28T16:40:14.557+0800, by Chee Mei Jia
1. EAINT-12218_cibo-macrokiosk-template-management_20260901.html — 18766 bytes, 2026-09-01T14:29:58.274+0800, by Chee Mei Jia
1. EAINT-12218_cibo-macrokiosk-template-management_20260901 (74ecc16d-ef36-4d47-8045-15a05f99a53f).html — 18766 bytes, 2026-09-03T15:41:18.952+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.1_20260820.docx — 17277 bytes, 2026-08-28T16:40:14.792+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.2_20260824.docx — 21537 bytes, 2026-08-28T16:40:15.866+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.3_20260826.docx — 20647 bytes, 2026-08-28T16:40:14.292+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.4_20260827.docx — 22035 bytes, 2026-08-28T16:40:15.320+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.5_20260828.docx — 20556 bytes, 2026-08-28T16:40:15.085+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.6_20260901.docx — 22932 bytes, 2026-09-01T14:29:59.294+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.7_20260901.docx — 22686 bytes, 2026-09-01T15:44:31.847+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v0.8_20260902.docx — 22572 bytes, 2026-09-02T11:31:00.281+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v1.0_20260902.docx — 22526 bytes, 2026-09-02T15:51:13.991+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v1.1_20260903.docx — 43654 bytes, 2026-09-03T15:41:19.279+0800, by Chee Mei Jia
1. EAINT-12218_SRD_v1.1_20260903.pdf — 302479 bytes, 2026-09-03T15:41:19.572+0800, by Chee Mei Jia