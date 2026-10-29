<!-- Source: Jira EAINT-12257 and sub-tasks EAINT-12625, EAINT-12627 via Atlassian MCP, read 2026-10-26. Read only. -->
# EAINT-12257 Jira comments

## EAINT-12257 (parent)
1. **No comments.** Jira returned `"comment":{"comments":[], ... "total":0}` on 2026-10-26.

## EAINT-12625 (QA-Issue sub-task, status Closed, updated 2026-10-26 10:41)
Summary (verbatim): "[eAuto - UCD Onboarding] Cancelled DuitNow QR and FPX (B2C) payments do not show the Unsuccessful Payment message"

1. **QA (Faizuddin), 2026-10-26 10:39 MYT, comment id 57993** (fetched 2026-10-26), verbatim:
   > **Status:** CLOSED
   >
   > Follow existing behaviour where it will not show error message if close the payment gateway page
2. **Description key lines (verbatim, raised by QA 2026-10-23 17:55):**
   1. "**Testing Environment:** staging/eauto"
   2. Row 1 Actual: "QR window shows **\"Payment is pending\"** Review page reloads with **no Unsuccessful Payment message**"
   3. Row 2: "Online Banking (Personal) / FPX B2C - Cancel" — "Same as row 1".

## EAINT-12627 (QA-Issue sub-task, status To Do, created 2026-10-23 18:43)
Summary (verbatim): "[eAuto - UCD] Business Info Review - DuitNow QR timer expiry does not show the Unsuccessful Payment message"

1. **Comments:** none seen (updated 2026-10-23 18:43:34, 8 s after creation).
2. **Description key lines (verbatim):**
   1. "**Testing Environment:** staging/eauto"
   2. "DuitNow QR left unscanned until the 3-minute timer ran out. Same result as Cancel in EAINT-12625."
   3. Expected: "Payment is **Failed** and the review page shows **\"Unsuccessful Payment\"**"
