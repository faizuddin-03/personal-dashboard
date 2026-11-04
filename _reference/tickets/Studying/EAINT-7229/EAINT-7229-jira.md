# EAINT-7229 — Jira capture (29/10/2026, 5:07:15 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚫🟡[eAuto] To implement web socket to replace Java applet 
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Izni Zurni · **QA (cf 10041):** —
4. **Fix versions:** S24.3-20251217🌚 (2025-12-17)
5. **Labels:** August2025, ProductBacklog, September2025
6. **Created:** 2025-03-25T14:35:47.914+0800 · **Updated:** 2025-12-19T09:36:08.783+0800
7. **Exp. Deploy Date (cf 10087):** 2025-12-17 · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** Relates: EAINT-9094 [eAuto] Web Socket - User Guide PDF Version; Relates: EAINT-9087 [eAuto] Web Socket - User Guide Video
9. **Sub-tasks:** EAINT-8776 [eAuto-Web Socket] To have figma for Web Socket on UCD portal; EAINT-8789 [eAuto-Web Socket] R&D - To R&D how to set the installer to 1 time use only and limited to laptop with dermalog ; EAINT-8800 [eAuto-Web Socket] To have Video & PDF User Guide for UCD to install Web Socket; EAINT-8804 [eAuto-Web Socket] STMS Step 1 - System will stuck at "The MyKad reader is ready" when first landing on page and first refresh page at "The MyKad reader is ready"; EAINT-8854 [eAuto – WebSocket] Missing UI error message on thumbprint verification failure; EAINT-8855 [eAuto – WebSocket] Retry after failed thumbprint should only redo thumbprint verification without clearing MyKad information; EAINT-8856 [eAuto - Web Socket] An error message "Unable to read photo. Please try again" is not displayed; EAINT-8857 [eAuto – WebSocket] Should not display message when the Dermalog device is unplugged after being connected on the screen; EAINT-8859 [eAuto - Web Socket] - System stuck at "Working..."; EAINT-8865 [eAuto - Web Socket] Missing error message in popup for Step 3 IC not matched; EAINT-8871 [eAuto – WebSocket] UI Issue: Button behavior on error popup for internet connection does not follow Figma design; EAINT-8874 [eAuto - Web Socket] Incorrect behaviour when insert invalid MyKad and click [Read MyKad]; EAINT-8875 [eAuto – WebSocket] UI Issue: Error message does not follow Figma design when two sessions attempt to use Dermalog simultaneously; EAINT-8876 [eAuto - Web Socket] UI Issue: e-Invoice button; EAINT-8942 [eAuto - Web Socket] UI Issue: Incorrect message displayed after Auto-Scan 10 times timeout; EAINT-8944 [eAuto - Web Socket] Multiple tabs: Old tab should allow to proceed and new tab's session should be terminated; EAINT-8945 [eAuto - Web Socket] Multiple tabs: New tab's error message should be prompted along with [Close] button; EAINT-9009 [eAuto - Web Socket] Incorrect error message prompted when unable to read photo; EAINT-9010 [eAuto - Web Socket] UI Issue: Cancel message prompt is not as per Figma; EAINT-9055 [eAuto-UCD] eSTM: No error message displayed when BO untick the eVOC / eLKM permission; EAINT-9102 [eAuto - Insurance] Chubb Unable to Purchase Due to Incorrect VEHTYPE; EAINT-9132 [eAuto - UCD All Modules & AATF] Unable to Perform Thumbprint Verification for failed; EAINT-9138 [eAuto - UCD All Modules & AATF] Unable to Cancel Transaction during Thumbprint Verification; EAINT-9140 [eAuto - Web Socket] UI Issue:  Insert MyKad error message prompt is not as per Figma; EAINT-9161 [eAuto - UCD & AATF] Web Socket Auto Scan Issues; EAINT-9052 [eAuto - UCD] UI Issue: Company – “File Upload” Field Displays Placeholder Path (C:\fakepath) After File Upload; EAINT-9349 [eAuto - UCD: Reports - Vehicle Inter-Branch Transfer] Transfer Vehicle pop up not displayed; EAINT-9308 [eAuto & AATF - Homepage Banner] Annoucment popup should only show in Firefox Only ; EAINT-9290 [eAuto & AATF - Homepage Banner] Annoucement Banner not update to the latest based on figma; EAINT-9409 [eAuto - AATF] Invoice first download attempt fails after Deregistration happy flow – “This Site Can’t Be Reached”; EAINT-9411 [eAuto - UCD] Insurance - Payment Successful page - Button text misaligned (shifted out of button); EAINT-9446 [eAuto - UCD] STMS Bulk Transaction - Bulk JPJ Enquiry completion popup shows incorrect title; EAINT-9451 [eAuto – Login Page] WebSocket Installer Missing from Download Dropdown
10. **Parent:** —

## Description

Part 1 of 2 Figma Link:
| # | Item | Link |
| 1 | Web Socket Design | https://www.figma.com/design/FzrjkY8WhaEZxyVI2JVzT3/eAuto-UCD?node-id=25714-9027&p=f&t=bjQtK93qSgWdSuZC-0 |
| 2 | Download Page -  UCD | https://www.figma.com/design/FzrjkY8WhaEZxyVI2JVzT3/eAuto-UCD?node-id=5893-20889&t=pTpBYA5II2U7D2bx-0 |
| 3 | Download Page - AATF | https://www.figma.com/design/l3HOoBRG97sO3Nkjo9dx2l/eAuto-AATF?node-id=2168-2686&t=4OuBAnZoylWOo3Zt-0 |
Part 2 of 2 SRD: 
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 24.09.2025 (Wednesday) | v0.1 | Initial Draft |  |
| 2 | 09.10.2025 (Thurs) | v0.2 | Updated based on Ket Ming feedback via 03.10.2025 (Friday) discussion. |  |
| 3 | 10.10.2025 (Fri) | v0.3 | Updated based on internal feedback |  |
| 4 | 12.11.2025 (Wed) | v0.4 | Updated requirement & added Section 2.2.1.6 & 2.2.1.7. |  |

## Comments (2)

### Izni Zurni — 2025-04-29T06:03:47.864+0800

cc: @Chee Mei Jia @Yi Fung Tan @Goh Kai Jiaeh @Muhammad Amirul Bin Juhari @May Chin

### Izni Zurni — 2025-07-29T17:51:09.625+0800

Note on Meeting with Dermalog: 
a. 21.07.2025 (Mon) - Dermalog PIC did not show up 
b. 28.07.2025 (Mon) - Dermalog PIC did not show up 
c. Upcoming; Scheduled for 04.08.2025 (Mon)

## Attachments

1. SRD_EAINT-7229_eAuto-Web Socket_V0.1_20250924.docx — 1220037 bytes, 2025-09-24T16:10:33.273+0800, by Chee Mei Jia
1. SRD_EAINT-7229_eAuto-Web Socket_V0.2_20251009.docx — 1237005 bytes, 2025-10-09T16:53:58.274+0800, by Chee Mei Jia
1. SRD_EAINT-7229_eAuto-Web Socket_V0.3_20251010.docx — 1238580 bytes, 2025-10-29T21:35:51.071+0800, by Chee Mei Jia
1. SRD_EAINT-7229_eAuto-Web Socket_V0.4_20251112.docx — 1250124 bytes, 2025-11-12T12:42:19.000+0800, by Chee Mei Jia