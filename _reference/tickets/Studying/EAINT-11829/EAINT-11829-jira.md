# EAINT-11829 — Jira capture (27/10/2026, 5:29:06 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto-Application] Cronjob Updated Application Status from "Approved" to "Expired" when UCD Creation Completed when Hardcopy & Acc Created = "Registered"
2. **Type:** Bug · **Status:** Done · **Priority:** Medium
3. **Assignee:** rui.luan · **Reporter:** Lim Yi Link · **QA (cf 10041):** Muhammad Amirul Azfar Bin Kamarulazam
4. **Fix versions:** S30.9-20260630 🌚 (2026-06-30)
5. **Labels:** 260622-260626, June2026, ProductBacklog
6. **Created:** 2026-06-23T10:40:51.373+0800 · **Updated:** 2026-07-03T17:06:45.341+0800
7. **Exp. Deploy Date (cf 10087):** 2026-06-30 · **ETA for Testing (cf 10057):** 2026-06-26 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

Environment: Production
Browser: Chrome 
| Issue/ Steps to Simulate | Current Behaviour | Expected Behaviour |
| - UCD submits an application and the application link is generated. - UCD completes hardcopy submission and account creation (Hardcopy & Acc Created = "Registered") after 90 days from the application link generation date. - Cronjob runs and detects the application has exceeded 90 days. | Application Status is updated from "Approved" to "Expired" by the cronjob after 90 days, even when the UCD creation has already been completed (Hardcopy & Acc Created = "Registered"). | - Application Status remain as "Approved" even if the application link was generated more than 90 days ago, as long as the UCD creation is completed (Hardcopy & Acc Created = "Registered"). - The cronjob should exclude applications where Hardcopy & Acc Created = "Registered" from the auto-expiry logic. |

## Comments (0)

## Attachments

1. image-20260623-032007.png — 173025 bytes, 2026-06-23T11:20:10.056+0800, by Lim Yi Link