# EAINT-6475 — Jira capture (27/10/2026, 8:18:23 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD] JomCheck: To allow searching for vehicles by chassis number to purchase the JomCheck report
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Maisarah Nuraliyaa Binti Masrom, Muhammad Amirul Azfar Bin Kamarulazam, Nabila Hanafi, Nicholas Lim, Siti Nur Azila, Teck Yung Chin
4. **Fix versions:** S27.6-20260318🌞 (2026-03-18)
5. **Labels:** 260105-260109, January2026, JomCheck, ProductBacklog
6. **Created:** 2025-02-12T12:47:05.382+0800 · **Updated:** 2026-07-20T12:12:32.254+0800
7. **Exp. Deploy Date (cf 10087):** 2026-03-18 · **ETA for Testing (cf 10057):** 2025-03-13 · **[QA] Est Man-day (cf 10081):** 2
8. **Links:** Relates: EAINT-106 [eAuto-UCD] Phase 1: UCD Portal - JomCheck Report
9. **Sub-tasks:** EAINT-6992 [QA] Chinese chars is not automatically removed from Chassis Number field and can click [Submit], then retrieve with chinese chars; EAINT-7006 [QA] Small letters, special chars and Chinese chars are not auto-capitalize/auto-trim/auto-remove when copy & paste and cut & paste using right-click mouse method; EAINT-7012 [QA] Chassis Number field is not cleared when entered using console method with Vehicle Number already selected and entered manually; EAINT-7026 [QA] Vehicle Number is displayed as "null" in RHB ID; EAINT-7052 [QA] Unable to make payment with message "Connection Failed"; EAINT-7060 [QA] Unable to hit failed payment after set VN response code to IF in simulator; EAINT-7066 [QA] Radio button for VN should not be clickable/selectable when attempt to resubmit transaction for CN; EAINT-7121 [QA] [Functional TS] JC_6475_TS1-TS12; EAINT-7122 [QA] [E2E TS] JC_6475_TS13-TS16; EAINT-7123 [QA] [E2E TS] JC_6475_TS17-TS21; EAINT-7124 [QA] [Regression TS] JC_6475_TS22-TS27; EAINT-7125 [QA] [UCD - SnF - JomCheck Transaction Listing] ; EAINT-7126 [QA] [BO - SnF JomCheck Transaction Listing & SST Payment Report]; EAINT-7129 [QA] Incorrect wording when both Vehicle No. and Chassis No. field is empty; EAINT-10104 ------ Issues raised - 13 March 2026 ------; EAINT-10100 [eAuto - JomCheck] RHB ID under Payment Details in Transaction Details Page is displaying incorrectly; EAINT-10101 [eAuto - JomCheck] Vehicle Number field in Invoice and e-Invoice is blank for transactions created from Chassis Number; EAINT-10105 [eAuto - JomCheck] JomCheck report filename to follow vehicle number; EAINT-10106 [eAuto - Backoffice] Chassis No Field Missing in Transaction Listing CSV Export; EAINT-10107 [eAuto – JomCheck] Vehicle No Should Display “-” Instead of Blank When Searching by Chassis No (and Vice Versa); EAINT-10109 [eAuto - Backoffice] Misalignment of "Grand Total" footer values in SST Payment Report (JomCheck); EAINT-10110 [eAuto - JomCheck] Incorrect Chassis not found message; EAINT-10111 [eAuto - JomCheck] UI issues; EAINT-10114 [eAuto - JomCheck] UI issue found in Get JomCheck Reports page; EAINT-10121 [eAuto - JomCheck] Chassis Number field remains greyed out after clicking back in Browser after JomCheck Purchase; EAINT-10122 [eAuto - JomCheck] Vehicle Number overtakes Chassis Number when switching radio buttons before clicking on Submit button; EAINT-10123 [eAuto - JomCheck] Chassis No - Click 'Submit' second time when API down will clear & reset fields to default; EAINT-10124 [eAuto - JomCheck] Mandatory field error message alignment & display issue; EAINT-10125 [eAuto - JomCheck] [Backoffice] CSV listing column 'Payment Date' showing incorrect time (Existing issue); EAINT-10130 [eAuto - JomCheck] [BackOffice] CSV listing "Remarks" column is not displaying the System Maintenance error message (Existing issue)
10. **Parent:** —

## Description

Part A: Requirement
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 12.02.2025 (Wed) | v0.1 | Initial Draft  Notes: Pending to gather more information from eAuto ops team |  |
| 2 | 10.03.2025(Mon) | v0.2 | Updated requirements |  |
| 3 | 12.03.2025 (Wed) | v0.3 | Updated requirements |  |
| 4 | 19.03.2025 (Wed) | v0.4 | Updated requirements |  |
| 5 | 19.03.2025 (Wed) | v1.0 | Send to eAuto for review |  |
| 6 | 29.12.2025 (Mon) | v1.1 | To update:  a.      Increase JomCheck service charge from RM18 to RM20  b.      Update JomCheck pricing displayed in UCD portal |  |
| 7 | 30.12.2025 (Tue) | v1.2 | To update:  a.      Update pricing display to RM 20 |  |
| 8 | 30.12.2025 (Tue) | v1.3 | a.      Add an enhancement to replace JomCheck video to reflect the updated pricing  b.      To increase eAuto’s revenue in SST Payment Report (JomCheck) | Note - Chassis Number Field Validation: |

Part B: Figma Link
| # | Item | Link |
| 1 | Transaction Listing & Details | https://www.figma.com/design/FzrjkY8WhaEZxyVI2JVzT3/eAuto-UCD?node-id=23187-55136&p=f&t=ZW5v8m9NS4USPFOy-0 |
| 2 | Purchase Report Flow | https://www.figma.com/design/FzrjkY8WhaEZxyVI2JVzT3/eAuto-UCD?node-id=23187-60512&t=Jf9lbCGyN1uBOxmQ-0 |
Part C: JomCheck Video 
| # | Date | Item | Attachment |
| 1 | 06.01.2026 (Tue) | JomCheck video with updated price | a. Webm format      b. MP4 format |
| 2 | 04.02.2026 (Wed) | JomCheck video with updated price and eAuto logo with TM | a. Webm format      b. MP4 format |

## Comments (3)

### Christine Tan — 2025-02-18T12:23:07.995+0800

Draft 1 

Design 1
Design 2

### Christine Tan — 2025-03-03T12:15:05.472+0800

Draft 2
Amend the Chassis part that reconfirm with eAuto team

replaced the design in figma

### Lim Yi Link — 2026-03-11T10:22:04.303+0800

As confirmed with Ops team, this ticket will not include the RM2 increment.
We have received an additional request from Ops for a further enhancement related to the credit company. This enhancement will be tracked under https://mfservices.atlassian.net/browse/EAINT-10089

## Attachments

1. 3.3 JomCheck - D4.mp4 — 20541067 bytes, 2026-01-06T09:21:40.242+0800, by Lim Yi Link
1. 3.3 JomCheck - D4.webm — 7512475 bytes, 2026-01-06T09:21:40.514+0800, by Lim Yi Link
1. 3.4 JomCheck.mp4 — 19846591 bytes, 2026-02-04T15:07:41.799+0800, by Lim Yi Link
1. 3.4 JomCheck.webm — 7685239 bytes, 2026-02-04T15:07:41.493+0800, by Lim Yi Link
1. image-20260720-041211.png — 53403 bytes, 2026-07-20T12:12:32.265+0800, by Chee Mei Jia
1. Screenshot 2025-02-18 at 12.20.50 PM.png — 163750 bytes, 2025-02-18T12:23:06.336+0800, by Christine Tan
1. Screenshot 2025-02-18 at 12.21.36 PM.png — 161016 bytes, 2025-02-18T12:23:05.522+0800, by Christine Tan
1. Screenshot 2025-03-03 at 12.12.08 PM.png — 136723 bytes, 2025-03-03T12:15:04.422+0800, by Christine Tan
1. Screenshot 2025-03-03 at 12.13.12 PM.png — 65001 bytes, 2025-03-03T12:15:05.248+0800, by Christine Tan
1. SRD_EAINT-6475 JomCheck Search with Chassis Number _V0.1_20250212.docx — 126790 bytes, 2025-02-12T17:29:56.389+0800, by Chee Mei Jia
1. SRD_EAINT-6475 JomCheck Search with Chassis Number _V0.2_20250310 (d7aa5441-2eb9-4b44-a613-fd1b705e64bf).docx — 303764 bytes, 2025-03-10T10:07:05.586+0800, by Johnes Khar
1. SRD_EAINT-6475 JomCheck Search with Chassis Number _V0.3_20250311.docx — 913499 bytes, 2025-03-12T17:20:42.065+0800, by Johnes Khar
1. SRD_EAINT-6475 JomCheck Search with Chassis Number _V0.4_20250319.docx — 952481 bytes, 2025-03-19T12:49:36.894+0800, by Johnes Khar
1. SRD_EAINT-6475 JomCheck Search with Chassis Number _V1.0_20250319 (79afdbae-56d1-49ef-8f1c-4c74c6619f0d).docx — 952718 bytes, 2025-03-19T13:10:14.715+0800, by Johnes Khar
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.1_20251229.docx — 1743793 bytes, 2025-12-30T11:16:52.210+0800, by Lim Yi Link
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.1_20251229 (839f1705-96ef-4bd1-ba40-0af6ce461376).pdf — 1463182 bytes, 2025-12-30T11:16:53.109+0800, by Lim Yi Link
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.2_20251230 (69a9ff0c-85dd-4b40-a49d-4f21ce8c4b1e).docx — 1742591 bytes, 2025-12-30T11:22:04.518+0800, by Lim Yi Link
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.2_20251230 (6b4b6e47-4f7c-438d-a997-a1461ba2b912).pdf — 1461923 bytes, 2025-12-30T11:22:04.297+0800, by Lim Yi Link
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.3_20260106.docx — 1850684 bytes, 2026-01-06T17:38:16.767+0800, by Lim Yi Link
1. SRD_EAINT-6475 To allow searching for vehicles by chassis number to purchase the JomCheck report and Increase JomCheck service charge from RM18 to RM20_V1.3_20260106.pdf — 1578226 bytes, 2026-01-06T17:38:16.495+0800, by Lim Yi Link