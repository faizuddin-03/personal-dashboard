# EAINT-12443 — Jira capture (27/10/2026, 5:45:35 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[Secarang-CIBO] New Module Macrokiosk - Opt Out Listing to Upload Boldpass Report and Mark Phone Numbers as Opted Out
2. **Type:** Task · **Status:** REQ REFINEMENT IN PROGRESS -EAUTO · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** 261005-261009, October2026, ProductBacklog
6. **Created:** 2026-10-07T08:31:34.735+0800 · **Updated:** 2026-10-27T10:14:54.060+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | CIBO |
| 2 | Affected Module | New Module - Macrokiosk - Opt Out Listing |
| 3 | Request | Allow INS PO team to upload Boldpass report and mark phone numbers as opted out from Secarang Macrokiosk (MK) renewal reminder. |
| 4 | Existing Issue/Behaviour | - System already has opt out feature using reply keyword. - Some customers reply with other wording instead of opt out keyword. - System cannot detect these replies as opt out request. - These customers still receive renewal reminder. |
| 5 | Expected New Handling/Behaviour | - New page "Macrokiosk - Opt Out Listing" created in CIBO. - INS PO team filters these replies manually and prepares Excel (Boldpass report). - INS PO team uploads Boldpass report in new page. - System captures phone numbers from uploaded report. - INS PO team ticks phone numbers to remove. - System marks ticked phone numbers as opted out. - Opted out phone numbers no longer receive Secarang MK renewal reminder. |
| 6 | Additional Note | To ensure Secarang number is not considered as spam. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 20.10.2026 (Tues) | v0.1 | Initial Draft |  |
| 2 | 26.10.2026 (Mon) | v0.2 | Updated page name, page access, upload and duplicate handling, and listing filters. Added audit log and removed Undo feature. | SRD:    Mock Up - CIBO: |
| 3 | 27.10.2026 (Tues) | v0.3 | Updated Batch No. format and Mobile Number conversion per developer feedback. | SRD:    Mock Up - CIBO: |

## Comments (0)

## Attachments

1. Mock Up_EAINT-12443_CIBO Macrokiosk Opt Out_20261026.html — 21860 bytes, 2026-10-26T16:40:03.654+0800, by Chee Mei Jia
1. Mock Up_EAINT-12443_CIBO Macrokiosk Opt Out_20261027.html — 22561 bytes, 2026-10-27T10:14:54.073+0800, by Chee Mei Jia
1. SRD_EAINT-12443_v0.1_20261020.docx — 25543 bytes, 2026-10-26T16:40:03.763+0800, by Chee Mei Jia
1. SRD_EAINT-12443_v0.2_20261026.docx — 27897 bytes, 2026-10-26T16:40:03.847+0800, by Chee Mei Jia
1. SRD_EAINT-12443_v0.3_20261027.docx — 28824 bytes, 2026-10-27T10:14:54.863+0800, by Chee Mei Jia