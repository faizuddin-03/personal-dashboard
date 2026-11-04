# EAINT-11057 — Jira capture (29/10/2026, 5:07:17 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD] STMS - Display Usage Code "AH" on Step 4 & Transaction Details Page
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Maisarah Nuraliyaa Binti Masrom, Nicholas Lim
4. **Fix versions:** S30.5-20260619🌞 (2026-06-19)
5. **Labels:** 260427-260430, April2026, ProductBacklog
6. **Created:** 2026-04-30T12:59:04.167+0800 · **Updated:** 2026-10-20T09:21:04.903+0800
7. **Exp. Deploy Date (cf 10087):** 2026-06-19 · **ETA for Testing (cf 10057):** 2026-06-16 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** Relates: EAINT-12560 🔴[eAuto-Mobile App] STMS - Display Usage Code "AH" on Step 4 & Transaction Details Page
9. **Sub-tasks:** EAINT-11793 [UCD to UCD] Standard & Interstate (Bulk) - "AH" usage code not showing correct design
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | eAuto |
| 2 | Affected Module | UCD |
| 3 | Request | To display the usage code "AH" on STMS Transaction Step 4 & Transaction Details Page when JPJ returns XML containing usage code "AH", to alert the UCD that the vehicle is an e-hailing vehicle. |
| 4 | Existing Issue/Behaviour | Currently, the usage code "AH" returned by JPJ is not displayed on STMS Transaction Step 4 & Transaction Details Page, so UCD has no visibility that the vehicle is an e-hailing vehicle. |
| 5 | Expected New Handling/Behaviour | 1. If JPJ returns XML to eAuto containing usage code "AH" → system shall display the usage code on the screen to alert UCD that the vehicle is an e-hailing vehicle.  2. If JPJ returns XML to eAuto that does not contain usage code "AH" → system shall hide the usage code field. |
| 6 | Additional Note | - |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 30.04.2026 (Thurs) | 0.1 | Initial Draft |  |
| 2 | 05.05.2026 (Tues) | 0.2 | Clarified that usage code "AH" display applies to STMS Individual, Company (Step 4 & Transaction Details Page) and UCD-to-UCD (Step 2, Step 4 & Transaction Details Page). |  |
| 3 | 15.05.2026 (Fri) | 0.3 | Added Figma design references in Section 1.5 Associated Documents. |  |
| 4 | 11.06.2026 (Thurs) | 1.0 | Send out for external review |  |

## Comments (0)

## Attachments

1. EAINT-11057_SRD_v0.1_20260430.docx — 13167 bytes, 2026-05-17T13:31:35.005+0800, by Chee Mei Jia
1. EAINT-11057_SRD_v0.2_20260505.docx — 13678 bytes, 2026-05-17T13:31:35.424+0800, by Chee Mei Jia
1. EAINT-11057_SRD_v0.3_20260515.docx — 15494 bytes, 2026-05-17T13:31:35.220+0800, by Chee Mei Jia
1. EAINT-11057_SRD_v1.0_20260611.docx — 29015 bytes, 2026-06-18T11:38:08.778+0800, by Lim Yi Link
1. EAINT-11057_SRD_v1.0_20260611.pdf — 146059 bytes, 2026-06-18T11:38:08.508+0800, by Lim Yi Link