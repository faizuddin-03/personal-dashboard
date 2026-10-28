# EAINT-12414 — Jira ticket capture

Captured 2026-09-30 via Atlassian MCP (`getJiraIssue`). No attachments exist on
this ticket (attachment: [] in the raw payload) — there is no SRD to download.
This file is the full ticket description, saved verbatim as the ticket's only
written source.

- URL: https://mfservices.atlassian.net/browse/EAINT-12414
- Type: Task · Priority: Medium · Status: To Do
- Created: 2026-09-29T12:06:34+0800 · Updated: 2026-09-29T14:35:31+0800
- Reporter/Creator: Boo Jin Siang (Jin Siang Boo)
- Developer field (customfield_10040): Mong Guo Hao
- Assignee: none (unassigned in Jira)
- Labels: 260928-261002, ProductBacklog, September2026
- fixVersions: none set

## Summary

🔴[eAuto - Onboarding] Pre-Application Form - Resets to Step 1 on reload & no
error shown for failed Credit/Debit Card payment

## Description (verbatim)

**General Information**

| # | Item | Description |
| --- | --- | --- |
| 1 | Affected Portal | Potential UCD > Pre-Application Form (public form) |
| 2 | Affected Module | Loading / reloading a saved Pre-Application Form; Step 2: Payment (Credit or Debit Card) |
| 3 | Environment | Staging |
| 4 | Browser | Chrome (also applies to Edge and Safari) |

**What is happening**

When an applicant reopens or refreshes a saved Pre-Application Form, the page
breaks and drops them back to Step 1 instead of the step they had reached.

Once that is fixed, a second problem shows up. If a Credit or Debit Card
payment fails, the applicant is returned to the form with no "Unsuccessful
Payment" message. They get no sign that the payment failed or that they need
to retry.

**Why it happens (in plain terms)**

A list the page needs while loading is set up only after the loading has
already started. The page errors partway through and falls back to Step 1.

Sometimes the card payment page returns to the form tab itself rather than
the payment popup. The payment result is kept for the form to pick up, but
the form never checks for it, so the failure message is never shown.

**Steps to reproduce**

1. Open the Pre-Application Form, complete Step 1 and continue to Step 2.
2. Refresh the page. The form resets to Step 1 (issue 1).
3. On Step 2, tick the declaration, choose Credit or Debit Card and click
   [Submit and Pay].
4. Fail the card payment so the payment page returns to the form in the same
   tab.

**Actual result**

1. After a refresh, the form resets to Step 1.
2. After a failed card payment, the form reloads with no error message, the
   declaration unticked and the payment methods hidden.

**Expected result**

1. Refreshing or reopening the form restores the step the applicant had
   reached.
2. After a failed card payment, the applicant lands on Step 2 and sees
   "Unsuccessful Payment - Something went wrong and your payment didn't go
   through. Please choose a payment method and retry." The declaration stays
   ticked and the payment methods are shown, so they can retry straight away.

**Impact**

Applicants lose their place on the form, and after a failed card payment they
have no idea it failed. No money is deducted on a failed payment, so there is
no refund exposure, but applicants may abandon the form or contact support.

**Reference for QA**

Fix under review: eauto-onboarding MR !331 -
https://masterjedi.modefair.com/eauto/eauto-onboarding/-/merge_requests/331
(unreachable from this session — internal GitLab, likely needs VPN/office
network; not pursued further this session)

Key point for testing: the failed payment must return to the **same tab**,
not the popup. The popup path already showed the message and will pass
either way. Also check that a successful payment is unchanged, and that
refreshing after the error does not show the message again.
