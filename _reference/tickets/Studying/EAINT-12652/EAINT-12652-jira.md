# EAINT-12652 — Jira capture (27/10/2026, 11:45:09 am)

Captured by the Jira Scout scheduled agent (scripts/agents/run-agent.mjs). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto - STMS] Step 2 - LKM Refund email not sent to the owner when the contact number is a landline (03)
2. **Type:** Bug · **Status:** To Do · **Priority:** Medium
3. **Assignee:** — · **Reporter:** Xiwei Lim · **QA (cf 10041):** Charmain Ea Chiang
4. **Fix versions:** —
5. **Labels:** —
6. **Created:** 2026-10-27T08:46:16.401+0800 · **Updated:** 2026-10-27T11:22:52.467+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | eAuto UCD > STMS (Ownership Transfer) |
| 2 | Affected Module | Step 2: owner contact number - LKM Refund owner notification (email + WhatsApp) |
| 3 | Environment | Production |
| 4 | Browser | All browsers |
| 5 | Related Ticket | EAINT-12431 - LKM Refund: email + WhatsApp the car owner at STMS Step 2 |
What is happening
At STMS Step 2, the UCD enters the owner's contact number. When that number is a landline starting with 03, the LKM Refund notification email is not sent to the owner, even though the owner's email address is valid.
Why it happens (in plain terms)
The notification goes to the owner as an email and as a WhatsApp message to the contact number. A landline cannot receive WhatsApp, and that failure also stops the email from going out.
Steps to reproduce
- Log in as a UCD and start an STMS transaction for an owner who qualifies for LKM Refund.
- At Step 2, enter a valid email address and a landline number starting with 03 (for example 0312345678).
- Save Step 2.
- Check the owner's mailbox.
Actual result
No LKM Refund email reaches the owner.
Expected result
The email is sent as long as the email address is valid, whatever contact number was entered. A landline does not get a WhatsApp message, and that does not stop the email. There is no visible change for the UCD on the Step 2 screen.
Impact
Owners who gave a landline do not receive the LKM Refund notification by email. No money is involved, so there is no refund exposure.
Reference for QA
QA testing is not required for this ticket (agreed with SA).
Key point: the behaviour under test is the email still going out when the contact number is a landline. A mobile number starting with 01 works either way.

## Comments (0)

## Attachments
