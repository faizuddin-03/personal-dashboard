# EAINT-12175 — Jira capture (27/10/2026, 5:31:54 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[Secarang & eAuto-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Shane · **Reporter:** Batrisyia Hasanah Binti Nursyamsi · **QA (cf 10041):** Charmain Ea Chiang
4. **Fix versions:** S34.3-20261002🌞 (2026-10-02)
5. **Labels:** 260810-260814, August2026, ProductBacklog, Secarang
6. **Created:** 2026-08-12T16:23:16.986+0800 · **Updated:** 2026-10-05T14:48:45.853+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-02 · **ETA for Testing (cf 10057):** 2026-09-28 · **[QA] Est Man-day (cf 10081):** 3
8. **Links:** Relates: EAINT-12422 ⚪[Secarang-BackEnd] To Update Insurer Name to Lonpac Insurance Bhd in Secarang PDF Receipt
9. **Sub-tasks:** EAINT-12423 [eAuto - BackOffice] Insurance Transaction Listing - Insurance Company column shows the plan code Lonpac instead of the full insurer name
10. **Parent:** —

## Description

| # | Item | Description |
| 1 | Affected Portal | Secarang & eAuto |
| 2 | Affected Module | Secarang Journey — About Us, FAQ, Support, Add-on, Confirmation pages; eAuto Insurance Module — UCD, Back-Office, eSTM, Credit Portal |
| 3 | Request | Lonpac flagged 5 urgent live issues on Secarang: incorrect insurer company name displayed, and outdated SDPA policy wording document link. eAuto insurance module was reviewed in parallel for the same insurer naming consistency. |
| 4 | Existing Issue/Behaviour | Secarang:   1. About Us page — incorrect company name shown   2. FAQ page — incorrect company name shown   3. Support page — incorrect company name shown   4. Add-on page — outdated SDPA Policy Wording link   5. Confirmation page — incorrect insurer name shown  eAuto: Insurer name shown correctly as "Lonpac Insurance Bhd (307414-T)" across UCD, Back-Office, eSTM and Credit Portal transaction/policy screens and Receipt PDF — no change required. However, the Back-Office Insurance Company filter dropdown (UCD enquiry, payment report, back-office enquiry) still shows the full "Lonpac Insurance Berhad" via a shared plan-code label, and the Insurance Dashboard chart series label uses the same shared label. |
| 5 | Expected New Handling/Behaviour | Secarang:   1. About Us — update to "Lonpac Insurance Bhd"   2. FAQ — update to "Lonpac Insurance Bhd"   3. Support — update to "Lonpac Insurance Bhd"   4. Add-on — update Policy Wording link to: http://lonpac.com/downloads/policywordings-eassistsmartdriver.pdf  5. Confirmation — update insurer name to "Lonpac Insurance Bhd"  eAuto: Pending decision from PO on whether to standardize the shared plan-code label to "Lonpac Insurance Bhd" (affects both the Back-Office filter dropdown and the Insurance Dashboard chart). Insurance Dashboard chart's exact screen/menu location also pending confirmation from Dev (KJ). |
| 6 | Additional Note | Flagged urgent by Lonpac as this is LIVE on production. Secarang fixes verified live on production/staging on 28.08.2026. eAuto findings verified via live test transactions on staging on 28.08.2026; 2 items pending decision (see SRD Section 2.2.5–2.2.6). |
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 02.09.2026 (Wed) | 0.1 | Initial Draft |  |
| 2 | 04.09.2026 (Fri) | 0.2 | Secarang items (REQ-001 to REQ-005) deployed to production on 11 August 2026. Acceptance Criteria updated accordingly. |  |
| 3 | 07.09.2026 (Mon) | 1.0 | To send out for external review |  |
| 4 | 23.09.2026 (Wed) | v1.1 | Updated Section 2.1, 2.2.2, 2.2.3 and 2.2.5; Standardised Insurer Name to Lonpac Insurance Bhd for Insurance Company Filter and Result Table in UCD and BackOffice |  |

## Comments (0)

## Attachments

1. SRD_EAINT-12175_Lonpac_Changes_V0.1_20260902.docx — 1350283 bytes, 2026-09-02T17:27:24.275+0800, by Batrisyia Hasanah Binti Nursyamsi
1. SRD_EAINT-12175_Lonpac_Changes_V0.2_20260904.docx — 1354851 bytes, 2026-09-04T15:44:55.731+0800, by Batrisyia Hasanah Binti Nursyamsi
1. SRD_EAINT-12175_Lonpac_Changes_V1.0_20260907.docx — 1352928 bytes, 2026-09-07T10:45:37.159+0800, by Batrisyia Hasanah Binti Nursyamsi
1. SRD_EAINT-12175_Lonpac_Changes_V1.0_20260907.pdf — 648638 bytes, 2026-09-07T10:45:37.408+0800, by Batrisyia Hasanah Binti Nursyamsi
1. SRD_EAINT-12175_v1.1_20260923.docx — 1343233 bytes, 2026-09-23T15:24:07.067+0800, by Chee Mei Jia
1. SRD_EAINT-12175_v1.1_20260923.pdf — 637901 bytes, 2026-09-23T15:24:07.341+0800, by Chee Mei Jia