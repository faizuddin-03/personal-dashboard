# EAINT-12217 — Jira capture (27/10/2026, 5:45:30 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[Secarang-Macrokiosk Template] Add "Opt-Out" Button to WhatsApp Message and Skip Sending to Opted-Out Recipients
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Charmain Ea Chiang
4. **Fix versions:** S34.1-20261001 🌞 (2026-10-01)
5. **Labels:** 260817-260821, August2026, ProductBacklog
6. **Created:** 2026-08-20T12:14:50.586+0800 · **Updated:** 2026-10-05T14:48:08.618+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-01 · **ETA for Testing (cf 10057):** 2026-09-17 · **[QA] Est Man-day (cf 10081):** 3
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | Macrokiosk |
| 2 | Affected Module | Macrokiosk Template |
| 3 | Request | To enhance Secarang Macrokiosk WhatsApp message template to include a new "Opt-Out" button, so that the message meets Meta requirement |
| 4 | Existing Issue/Behaviour | - WhatsApp message template currently has only two buttons: "Review Now" and "Review Later" - No option is available for the recipient to opt out from receiving future messages |
| 5 | Expected New Handling/Behaviour | - Add a new button "Opt-Out" to Secarang Macrokiosk WhatsApp message template - When recipient clicks "Opt-Out", system to capture and store the opt-out record in database - Before sending out WhatsApp message, system to check whether the recipient has opted out previously - If the recipient has opted out, skip the recipient and do not send the message |
| 6 | Additional Note |  |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 20.08.2026 (Thurs) | v0.1 | Initial Draft |  |
| 2 | 24.08.2026 (Mon) | v0.2 | Added Section 2.2.5 Opt-Out Keyword Detection  Updated Sections 1.4 to 2.2.8 |  |
| 3 | 26.08.2026 ( Wed) | v0.3 | Updated Sections 2.1.2 to 2.2.7 |  |
| 4 | 01.09.2026 (Tues) | v0.4 | Updated Section 2.2.4 Opt-Out Instruction |  |
| 5 | 01.09.2026 (Tues) | v1.0 | Sent out for external review |  |

## Comments (0)

## Attachments

1. EAINT-12217_SRD_v0.1_20260820 (8231e093-2043-4ba0-b8dd-ecd2cc39c696).docx — 20211 bytes, 2026-08-20T16:55:24.523+0800, by Chee Mei Jia
1. SRD_EAINT-12217_v0.2_20260824.docx — 21833 bytes, 2026-08-24T18:23:07.829+0800, by Chee Mei Jia
1. SRD_EAINT-12217_v0.3_20260826.docx — 20566 bytes, 2026-08-26T14:23:19.201+0800, by Chee Mei Jia
1. SRD_EAINT-12217_v0.4_20260901.docx — 20738 bytes, 2026-09-01T11:31:38.183+0800, by Chee Mei Jia
1. SRD_EAINT-12217_v1.0_20260901.docx — 20729 bytes, 2026-09-01T11:47:54.499+0800, by Chee Mei Jia
1. SRD_EAINT-12217_v1.0_20260901.pdf — 269299 bytes, 2026-09-01T11:47:54.191+0800, by Chee Mei Jia