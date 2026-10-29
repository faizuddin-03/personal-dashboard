# EAINT-11864 — Jira capture (27/10/2026, 5:29:36 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Lim Yi Link · **QA (cf 10041):** Muhammad Faizuddin Bin Bidi
4. **Fix versions:** S32.8-20260820🌞 (2026-08-20)
5. **Labels:** 260603-260605, June2026, ProductBacklog
6. **Created:** 2026-06-30T18:05:49.372+0800 · **Updated:** 2026-08-21T08:28:06.947+0800
7. **Exp. Deploy Date (cf 10087):** 2026-08-20 · **ETA for Testing (cf 10057):** 2026-08-17 · **[QA] Est Man-day (cf 10081):** 2.5
8. **Links:** —
9. **Sub-tasks:** EAINT-12199 [eAuto - Insurance] Mailtrap not receiving email after cronjob runs; EAINT-12213 [eAuto - Insurance] Email is generated for insurance that does not have eSTM
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD Portal |
| 2 | Affected Module | UCD |
| 3 | Request | System to automatically send an email to the UCD (Sub UCD or Main UCD) when UCD checked quotation but didn't proceed with Insurance purchase. |
| 4 | Figma Link | https://www.figma.com/design/FzrjkY8WhaEZxyVI2JVzT3/eAuto-UCD?node-id=43083-22086&t=JmrcRxeKlUI8H0He-1 |
| 5 | Existing Issue/Behaviour | No reminder/notification is sent to UCD after an approved eSTM or after checking an insurance quotation if the transaction is not completed, resulting in drop-offs before insurance purchase. |
| 6 | Expected New Handling/Behaviour | Auto-send reminder email (sender: imonitor@eauto.my) to UCD's registered email when an approved eSTM exists without completed Insurance purchase. |
| 7 | Additional Note | - |
SRD
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 08.07.2026 (Wed) | V0.1 | Initial |  |
| 2 | 09.07.2026 (Thurs) | V0.2 | Updated figma link |  |
| 3 | 10.07.2026 (Fri) | V0.3 | Updated Email Sender and Email Content |  |
| 4 | 13.07.2026 (Fri) | V1.0 | Send out for external review |  |
| 5 | 22.07.2026 (Wed) | V1.1 | Updated Email Content — added Vehicle No, Commission Amount, and Complete Purchase Now button behaviour |  |

## Comments (0)

## Attachments

1. SRD_EAINT-11864__eAuto-Insurance__Send_Email_Reminder_to_UCD_for_Generated_Quotations_Without_Purchase_v1.1_20260722.docx — 27458 bytes, 2026-07-22T09:34:23.733+0800, by Lim Yi Link
1. SRD_EAINT-11864__eAuto-Insurance__Send_Email_Reminder_to_UCD_for_Generated_Quotations_Without_Purchase_v1.1_20260722.pdf — 112886 bytes, 2026-07-22T09:34:24.058+0800, by Lim Yi Link
1. SRD_EAINT-11864_[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase_v0.1_20260708.docx — 13040 bytes, 2026-07-08T16:54:55.826+0800, by Lim Yi Link
1. SRD_EAINT-11864_[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase_v0.2_20260709.docx — 24922 bytes, 2026-07-09T10:58:45.301+0800, by Lim Yi Link
1. SRD_EAINT-11864_[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase_v0.3_20260710.docx — 26340 bytes, 2026-07-13T09:33:58.006+0800, by Lim Yi Link
1. SRD_EAINT-11864_[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase_v1.0_20260713.docx — 27080 bytes, 2026-07-13T09:33:57.757+0800, by Lim Yi Link
1. SRD_EAINT-11864_[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase_v1.0_20260713.pdf — 102715 bytes, 2026-07-13T09:33:57.478+0800, by Lim Yi Link