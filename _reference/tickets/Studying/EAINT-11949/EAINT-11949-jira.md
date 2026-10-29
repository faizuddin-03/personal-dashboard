# EAINT-11949 — Jira capture (27/10/2026, 7:00:31 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🟣[eAuto-Wholesale 2.0] Remove logistic v1 flow & Security fixes
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Wei Ting · **Reporter:** Nicholas Lim · **QA (cf 10041):** Muhammad Amirul Azfar Bin Kamarulazam, Nicholas Lim
4. **Fix versions:** S31.7-20260721 🌚 (2026-07-21)
5. **Labels:** 260713-260717, July2026, ProductBacklog
6. **Created:** 2026-07-14T12:37:37.345+0800 · **Updated:** 2026-07-26T14:01:39.716+0800
7. **Exp. Deploy Date (cf 10087):** 2026-07-21 · **ETA for Testing (cf 10057):** 2026-07-16 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** EAINT-11851 Wholesale 2.0

## Description

- Main change — remove the old V1 flow:
- Removed the old V1 "mutual-scan" handover flow completely — the buyer/seller QR-scan pages, the scan/verify endpoints behind them, and the code that handled them. Wholesale now uses only the newer V2 driver-photo flow.
- Removed the leftover V1 QR pages and links (buyer scan, seller scan, delivery scan, log-id pages) — they pointed to endpoints we'd already deleted, so they no longer worked.
- Removed the old back-office QR/token buttons (issue log token, buyer/seller QR, etc.) that only fed those V1 pages.
- Cleaned up the leftover helper code, constants, and unused database lookup methods used only by V1.
- Simplified the handover status check — "buyer handover done" is now based simply on the delivery status being Delivered, instead of the old mutual-scan verification.
Fixes included (this branch builds on them):
- completion race fix: a wholesale deal could be wrongly marked Completed even if it was cancelled/rejected at the same moment (the check used a stale in-memory status). Now the completion check + update happen as one atomic database step, so a cancel/reject can't be overwritten.
- security fix (XSS): the PDF viewer put a company ID straight into the page, so a crafted value could run malicious script. Now the value is properly escaped (and sanitised at the source).
- cleaner errors: the public driver-photo upload endpoints could return an HTML error/stack-trace page on an unexpected failure. They now return a proper JSON error instead.

## Comments (0)

## Attachments
