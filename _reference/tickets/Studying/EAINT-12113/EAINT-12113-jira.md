# EAINT-12113 — Jira capture (27/10/2026, 5:46:17 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🐞[eAuto-BackOffice] Unable to Get SSM Data in Recon Listing when SSM Payment Date & Approved Date are Different
2. **Type:** Bug · **Status:** Done · **Priority:** Medium
3. **Assignee:** zhan.choon · **Reporter:** Lim Yi Link · **QA (cf 10041):** Siti Nur Azila
4. **Fix versions:** S32.7-20260817 🌚 (2026-08-17)
5. **Labels:** 260727-260731, July2026, bug
6. **Created:** 2026-07-29T12:25:50.725+0800 · **Updated:** 2026-08-18T16:12:31.162+0800
7. **Exp. Deploy Date (cf 10087):** 2026-08-17 · **ETA for Testing (cf 10057):** 2026-08-04 · **[QA] Est Man-day (cf 10081):** 3
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | eAuto BackOffice |
| 2 | Affected Module | eAuto Reconciliation Summary Listing |
| 3 | Issue | Unable to retrieve SSM data in the Recon Listing when the SSM payment date and approved date fall on different dates. |
| 4 | Request | To retrieve data in the Recon Listing even when the payment date and approved date are different, for the following modules:  - JomCheck - SSM - Insurance |
| 5 | Additional Note | - |

## Comments (3)

### zhan.choon — 2026-08-17T10:51:45.730+0800

This is Jomcheck changing query behaviour

### zhan.choon — 2026-08-17T10:52:01.256+0800

This is SSM changing query behaviour to get the snapshot after being approved.

### zhan.choon — 2026-08-17T10:52:13.001+0800

This is Insurance changing to use jpjAcceptedAt after transactions being approved

## Attachments

1. image-20260817-025130.png — 254548 bytes, 2026-08-17T10:51:45.414+0800, by zhan.choon
1. image-20260817-025147.png — 225093 bytes, 2026-08-17T10:52:00.979+0800, by zhan.choon
1. image-20260817-025202.png — 77002 bytes, 2026-08-17T10:52:12.662+0800, by zhan.choon