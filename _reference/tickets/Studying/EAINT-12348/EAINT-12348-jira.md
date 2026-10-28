# EAINT-12348 — Jira capture (27/10/2026, 8:08:57 pm)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users
2. **Type:** Task · **Status:** REQ REVIEW IN PROGRESS - EAUTO · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** —
4. **Fix versions:** [QA]Ready for Testing Tickets (2026-11-02)
5. **Labels:** 260914-260918, ProductBacklog, September2026
6. **Created:** 2026-09-17T08:26:54.397+0800 · **Updated:** 2026-10-26T15:10:31.228+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** 2026-10-29 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | - AATF Portal - BackOffice Portal |
| 2 | Affected Module | PBT (eDereg) |
| 3 | Request | Enable Pihak Berkuasa Tempatan (PBT) organisations to be registered as active eDereg users and to access eDereg services, while preserving existing AATF operating flow.  - Extend Manage Company Account so that Company Type = PBT creates a login-enabled organisation account, not only a reference record used in AATF function. - Generate a dedicated running transaction number for PBT transactions in format PBT0000001. - Maintain a master list of approximately 154 PBT organisations across Malaysia. - Maintain a master list of all licensed AATF organisations across Malaysia. - Add a mandatory Organisation Name field linked to Company Type. - When Company Type = PBT, display PBT master list; when Company Type = AATF, display licensed AATF master list. |
| 4 | Existing Issue/Behaviour | - eDereg login and services are available to AATF users only. - Selecting Company Type = PBT records a PBT name for use in AATF function but does not create a PBT account with login access. - There is no dedicated PBT transaction-number sequence. - Account form does not dynamically display a complete PBT or licensed AATF organisation list based on Company Type. |
| 5 | Expected New Handling/Behaviour | - An authorised BackOffice user can create, maintain, activate and deactivate a PBT company account that can log in and use eDereg services. - Each PBT-created eDereg transaction receives a unique sequential reference in format PBT0000001, PBT0000002 and onward. Existing AATF numbering sequence remains unchanged. - Company Type provides at least AATF and PBT options. - A mandatory Organisation Name dropdown appears after Company Type is selected and loads matching active master list. - Company Type = PBT displays only PBT organisations; Company Type = AATF displays only licensed AATF organisations. - System prevents saving without an organisation selection and prevents duplicate active accounts for the same organisation. |
| 6 | Additional Note | - Business scope is expanding to include PBT users. Existing PBT company type only supports listing of PBT names within AATF function and cannot create an operational PBT user account. - PBT master list reference: https://pbtpay.kpkt.gov.my/pbt - Licensed AATF list reference: https://www.doe.gov.my/en/list-of-authorized-automotive-treatment-facilities-aatf/ - PBT master list and licensed AATF list files to be attached to this ticket. |
Supporting Materials:
| # | Shared On | Remark | Attachment |
| 1 | 11.09.2026 (Friday) | List PBT |  |
| 2 | 11.09.2026 (Friday) | List AATF |  |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 18.09.2026 (Friday) | v0.1 | Initial Draft | SRD: |
| 2 | 28.09.2026 (Monday) | v0.2 | Draft | SRD: |
| 3 | 07.10.2026 (Wednesday) | v0.3 | Draft | SRD:   Mock Up - BackOffice Portal:   Mock Up - PBT Portal: |
| 4 | 08.10.2026 (Thursday) | v0.4 | Draft | SRD:   Mock Up - BackOffice Portal:   Mock Up - PBT Portal:   Sample - Dereg Invoice & e-Invoice:   Sample - eDereg Pre-Checking Invoice & e-Invoice: |
| 5 | 09.10.2026 (Friday) | v0.5 | Draft | SRD:   Mock Up - BackOffice Portal:   Mock Up - PBT Portal: |
| 6 | 12.10.2026 (Monday) | v0.6 | Draft | SRD: |
| 7 | 14.10.2026 (Wednesday) | v0.7 | Draft | SRD: |
| 8 | 15.10.2026 (Thursday) | v0.8 | Draft | SRD: |
| 9 | 19.10.2026 (Monday) | v0.9 | Draft  - Receipt No fixed number for PBT confirmed as 0810 - PBT Settings confirmed same as AATF - Daily pre-checking limit removed, same as AATF - COD flow for PBT confirmed to remain, same as AATF | SRD: |
| 10 | 19.10.2026 (Monday) | v1.0 | Baseline | SRD:   Mock Up - BackOffice Portal & PBT Portal:   Sample - Dereg Invoice & e-Invoice:   Sample - eDereg Pre-Checking Invoice & e-Invoice: |
| 11 | 23.10.2026 (Friday) | v1.1 | - Added mandatory AATF dropdown at Dereg Step 2 for PBT users - Cancel available to BackOffice users only - Updated COD email sender, cancellation remark and cron job time - Updated RHB Payment Transaction search, PBT Payment Report and JPJ XML Log - Removed eDereg Pre-Checking column from Deregistration Transaction Listing | SRD:   Mock Up - BackOffice Portal & PBT Portal: |

## Comments (0)

## Attachments

1. 20260223-SENARAI-KEMUDAHAN-RAWATAN-AUTOMOTIF-BERLESEN-AATF (1) (1).pdf — 37245 bytes, 2026-10-07T15:20:55.853+0800, by Chee Mei Jia
1. Malaysia_PBT_Master_List_eDereg (1).xlsx — 20862 bytes, 2026-10-07T15:20:55.740+0800, by Chee Mei Jia
1. Mock_Up_EAINT-12348_BackOffice_Portal_20261007.html — 143238 bytes, 2026-10-07T15:01:42.560+0800, by Chee Mei Jia
1. Mock_Up_EAINT-12348_PBT_Portal_20261007.html — 92589 bytes, 2026-10-07T15:01:42.669+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_BackOffice Portal_20261007.html — 309477 bytes, 2026-10-08T16:35:07.044+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_BackOffice Portal_20261009.html — 311325 bytes, 2026-10-10T22:16:47.873+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_BackOffice Portal_20261019.html — 326394 bytes, 2026-10-19T10:39:27.023+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_BackOffice Portal_20261020 (6a4d20b1-8709-4ef6-a418-833836339e65).html — 329687 bytes, 2026-10-21T10:32:43.097+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_PBT Portal_20261007.html — 98581 bytes, 2026-10-08T16:35:06.840+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_PBT Portal_20261009.html — 99152 bytes, 2026-10-10T22:16:47.783+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_PBT Portal_20261019.html — 122290 bytes, 2026-10-19T10:39:27.560+0800, by Chee Mei Jia
1. Mock Up_EAINT-12348_PBT Portal_20261020 (b1c8c940-3eb5-4d1c-b9c4-3069c14cb9cb).html — 120905 bytes, 2026-10-21T10:32:42.944+0800, by Chee Mei Jia
1. Sample_EAINT-12348_Dereg e-Invoice PBT_20261007.pdf — 33648 bytes, 2026-10-08T16:35:06.314+0800, by Chee Mei Jia
1. Sample_EAINT-12348_Dereg e-Invoice PBT_20261019.pdf — 33750 bytes, 2026-10-19T10:39:27.380+0800, by Chee Mei Jia
1. Sample_EAINT-12348_Dereg Invoice PBT_20261007.pdf — 27898 bytes, 2026-10-08T16:35:06.943+0800, by Chee Mei Jia
1. Sample_EAINT-12348_Dereg Invoice PBT_20261019.pdf — 27835 bytes, 2026-10-19T10:39:27.468+0800, by Chee Mei Jia
1. Sample_EAINT-12348_eDereg Pre-Checking e-Invoice PBT_20261007.pdf — 33632 bytes, 2026-10-08T16:35:06.736+0800, by Chee Mei Jia
1. Sample_EAINT-12348_eDereg Pre-Checking e-Invoice PBT_20261019.pdf — 33732 bytes, 2026-10-19T10:39:27.280+0800, by Chee Mei Jia
1. Sample_EAINT-12348_eDereg Pre-Checking Invoice PBT_20261007.pdf — 64550 bytes, 2026-10-08T16:35:06.633+0800, by Chee Mei Jia
1. Sample_EAINT-12348_eDereg Pre-Checking Invoice PBT_20261019.pdf — 64322 bytes, 2026-10-19T10:39:27.748+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.1_20260918.docx — 19317 bytes, 2026-09-27T14:54:24.025+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.2_20260928.docx — 19453 bytes, 2026-09-27T14:54:24.310+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.3_20261007.docx — 24792 bytes, 2026-10-07T15:01:41.741+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.4_20261008.docx — 27165 bytes, 2026-10-08T16:35:06.482+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.5_20261009.docx — 34045 bytes, 2026-10-10T22:16:46.971+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.6_20261012.docx — 36012 bytes, 2026-10-12T17:08:46.101+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.7_20261014.docx — 36774 bytes, 2026-10-14T17:29:51.010+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.8_20261015.docx — 45313 bytes, 2026-10-15T16:55:00.634+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v0.9_20261019.docx — 45060 bytes, 2026-10-19T09:44:51.581+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v1.0_20261019.docx — 45210 bytes, 2026-10-19T10:39:27.658+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v1.0_20261019.pdf — 654499 bytes, 2026-10-19T10:39:27.182+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v1.1_20261023.pdf — 694903 bytes, 2026-10-23T15:23:30.760+0800, by Chee Mei Jia
1. SRD_EAINT-12348_v1.1_20261023 (e4865ad4-74e0-426a-ac33-32f885759851).pdf — 694903 bytes, 2026-10-23T15:23:30.856+0800, by Chee Mei Jia