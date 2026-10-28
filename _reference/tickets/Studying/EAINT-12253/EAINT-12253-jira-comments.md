<!-- Source: Jira EAINT-12253 and its sub-task EAINT-12574 via Atlassian MCP (getJiraIssue), read 2026-10-26. Read only. -->
# EAINT-12253 Jira comments

## EAINT-12253 (parent)
1. **No comments.** Jira returned `"comment":{"comments":[], ... "total":0}` on 2026-10-26.

## EAINT-12574 (QA-Issue sub-task, status Closed)
Summary (verbatim): "[eAuto - UCD & AATF] Transaction Last Step Page - Browser Reminder popup shows again after refresh (F5), not once per transaction"

1. **BA** (Lim Yi Link), 2026-10-21 12:23 MYT, comment id 57942, verbatim:
   > @zhan.choon @Muhammad Amirul Azfar Bin Kamarulazam This ticket can be closed as we can remain existing behaviour in staging.

## EAINT-12574 description — key lines (verbatim, raised by QA 2026-10-21 11:48)
1. "**Testing Environment:** staging/uat1"
2. "**Browser:** Mozilla Firefox 36.0"
3. Expected (each of 3 rows): "The popup shows **once per transaction**. After it was closed, F5 on the same transaction **should not show it again**. Per SRD v1.1 REQ-001 \"Displayed once per transaction.\" and mockup 26.08 \"Frequency: Once per transaction\". BA confirmed 20-10-2026: not again after refresh, resume or retry."
4. Records used: JomCheck ON000130; Deregistration D600000653 / ON000120; Interstate S604495163 / ON000125.
5. Attachments: 3 screenshots, 1 recording, "Expected 1 - SRD v1.1 REQ-001 - displayed once per transaction.png", "Expected 2 - Mockup 26.08 display rules - once per transaction.png".
