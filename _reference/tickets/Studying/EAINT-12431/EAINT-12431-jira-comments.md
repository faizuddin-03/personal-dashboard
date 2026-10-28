<!-- Source: Jira EAINT-12431 via Atlassian MCP (read-only), read 2026-10-26. -->
# EAINT-12431 — Jira comments

1. **Parent ticket:** no comments (comment total = 0, read 2026-10-26).

## Sub-task EAINT-12600 (QA-Issue, Done) — included because it is the only QA thread on this ticket

1. **Description (QA, Charmain Ea Chiang, created 2026-10-23 15:20):**
   > **Testing Environment:** staging/uat4 · **Browser:** Google Chrome · **Module:** eAuto > UCD > STMS > Trigger Step 3 to 4 · **Staging Test:** (trx id = ad2e6616-79cd-4fbf-9e75-4ab01710a754)
   >
   > Item: **STMS Company transaction send LKM Refund email and WhatsApp to user** Create an STMS Company transaction. Proceed to Step 3 and click **[Next]**. Verify the system behavior when the transaction reaches Step 4.
   > Actual: The system sends both LKM Refund WhatsApp and email messages to the user.
   > Expected: The system should **NOT** send LKM Refund WhatsApp or email messages to the user, as LKM Refund is not offered for Company category transactions.
2. **Comment (QA, 2026-10-26 08:21):**
   > Tested and verified on staging/uat4 : PASS
   > (screenshot attached in Jira)
