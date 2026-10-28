# EAINT-8767 study (2026-10-26)

## 1. Header
1. **Title (verbatim):** "🟣[eAuto-Insurance] To Fix Cronjob of Insurance for "Quotation Expired" & Allow Special Remarks Field to Accept Special Character"
2. **Jira status:** **In Development** (updated 2026-09-18 17:36).
3. **Priority:** Medium. Created 2025-08-28. Labels 250825-250829, August2025.
4. **QA (Jira field):** **empty**. **Miro:** "QA:" blank.
5. **BA:** Lim Yi Link (Jira BA field, reporter). **Miro:** "BA:" blank.
6. **Developer (Jira field):** zhong.tai (also assignee).
7. **Deployment date:** **none set.** Miro column "READY FOR TESTING TICKETS" (no date). Jira Exp. Deploy Date empty. Fix version "[QA]Ready for Testing Tickets" (release date 2026-11-02 on the version, a bucket, not a deploy date `[inference]`).
8. **Test env:** **not stated** — Jira Code Merge Environment empty; Miro "Test Env:" blank.
9. **Estimates:** Jira QA man-day 3; Miro "Est. Testing Mandays: 3 days (1 QA)". Jira ETA for Testing 2026-09-14 (stale).

## 2. Sources read
1. **Jira EAINT-8767** via Atlassian MCP, read 2026-10-26. 0 comments, 0 sub-tasks, 0 links, **0 attachments**, 0 remote links.
2. **SRD:** **SRD not retrieved — no SRD attached to the Jira ticket** (attachment list empty, 2026-10-26). Description is a short request table only.
3. **Miro card** — capture lines 306-342 (`EAINT-8767-miro-card.md`).
4. **Teams exports:** no message mentions 8767 in `_reference/teams/` (end 2026-10-16). Related only: `EAINT-12171-Insurance-Cron-Interval.md`.
5. **Knowledge:** `knowledge/flow-insurance-purchase.md` §"Quotations expire after ~24 hours" (lines ~550-560), status table (~line 521); `knowledge/eauto-insurance.md` §"Insurance cron jobs" (line 267+); `knowledge/business-rules-from-test-scenarios.md` line 447-448.
6. **OneDrive:** no EAINT-8767 folder.

## 3. What changes
1. **Portal / module:** eAuto **Insurance** (UCD insurance transactions) `[inference from title tag "[eAuto-Insurance]"]`.
2. **Environment where the bug was seen (Jira, verbatim):** "Production".
3. **Request (verbatim):** "Cronjob for Insurance to update transaction status to "Quotation Expired" after transactions are created > 24 hours"
4. **Reason (verbatim):** "In prod, there are Insurance transaction are not updated to "Quotation Expired" when UCD did not make payment after transactions are created more than 24 hours As per checking by dev, all special char in [special remarks] will affect this cronjob to update status to "Quotation Expired""
5. **Prod examples (verbatim):** "a. B58005885" "b. B58005800".
6. **Two parts** (title): fix the expiry cron; let **Special Remarks** accept special characters.

## 4. New vs existing behaviour
1. **Existing (prod, per Jira):** unpaid insurance transactions with special characters in Special Remarks are **not** moved to Quotation Expired after 24 h.
2. **Existing (staging, observed in repo):** "a quotation is valid for **24 hours to the minute**, then flips to `Quotation Expired` with the expiry stamped in Remarks." Example remark "EXPIRED on 19/06/2026 17:21" — `knowledge/flow-insurance-purchase.md` §Quotations expire.
3. **Status vocabulary (UCD listing `select[name=status]`):** DRAFT Quotation, PENDING Pending Payment, SUCCESS Insurance Created, FAILED Failed, APPROVAL Pending Approval, EXPIRED Quotation Expired — `knowledge/flow-insurance-purchase.md` ~line 513-521.
4. **New (expected):** cron expires the transaction even when Special Remarks has special characters; field accepts special characters `[inference from title]`.

## 5. QA scope
1. **Miro (verbatim):**
   1. "Testing Scope: (Automation / Manual Testing)"
   2. "Transaction Type" — "New eAuto Insurance Transaction", "Existing eAuto Insurance Transaction"
   3. "Before Payment" — "Payment = -, Tx Status = Pending Payment"
   4. "After Payment" — "Payment = Pending, Tx Status = Pending Payment"; "Payment = Failed, Tx Status = Failed"; "Payment = OK, Tx Status = Insurance Created"
   5. "Tx Status = Quotation Expired"; "Tx Status = Quotation / Pending Approval???"
   6. "Test Scenario" — "Tx Status updated to Quotation Expired after 24 hours"; "Transaction Status remains unchanged after 24 hours"
   7. "Insurance Transaction Details Page > Special Remarks Field"; "Functional Test Scenarios"
2. **Jira:** no acceptance criteria.

## 6. Affected regression areas
1. **Insurance listing + details** status/remark display (UCD `/view/ucd/insurance/enquiry`).
2. **Quotation reminder email (EAINT-11864)** — only resumable statuses DRAFT, PENDING get a reminder (`RESUMABLE_STATUSES = [DRAFT, PENDING]`, `knowledge/eauto-insurance.md` ~line 452); expiry changes which rows qualify `[inference]`.
3. **Resume / Resubmit** of a Pending Payment quotation (`a.to-payment "Resubmit"`, memory note) — expired rows must not resume `[inference]`.
4. **Other insurance cron jobs** (JPJ status, cover note) — EAINT-12171 intervals; separate jobs `[inference]`.
5. **BO / CIBO** views that show insurance status or Special Remark (`knowledge/flow-cibo.md` lines 130-134 list a "Special Remark" column) `[inference: may be a different module]`.

## 7. Test data / env needs
1. **Environment:** not assigned. Needed from QA lead / Dev.
2. **24-hour wait** or Dev patch of created date/time to force expiry — repo precedent: "insurance patched to Quotation Expired" (`knowledge/flow-zurich-takaful.md` line 255) `[inference: Dev help needed]`.
3. **Cron schedule** for the expiry job — not documented anywhere in repo. Needed.
4. Transactions in each Miro status: Pending Payment (no payment), Pending payment (Payment Pending), Failed, Insurance Created, Pending Approval, Quotation.
5. Special Remarks text with special characters — which characters broke prod not stated.
6. Prod refs B58005885, B58005800 — reference only (prod).

## 8. Dependencies / related tickets
1. **EAINT-11864** — insurance quotation reminder email (relies on unpaid quotation statuses).
2. **EAINT-12171** — standardise insurance cron intervals (deployed 10 Sep per Teams).
3. **EAINT-9141** — older CR: "Older insurance statuses Pending Payment, Failed, Quotation, Pending Approval "will all display "Quotation Expired" status after CR deployment"" — `knowledge/business-rules-from-test-scenarios.md` lines 447-449 (from SharePoint TS #092, row 12).

## 9. Teams decisions
1. **None found for 8767** in `_reference/teams/` (exports end 2026-10-16).
2. Related only (EAINT-12171, verbatim): "Daily, from 8am to 11pm: eAuto JPJ Status - 1 minute; eAuto Cover Note - 5 minutes (remain); Secarang JPJ Status - 1 minute; Secarang Cover Note - 1 minute" — QA lead, 2026-09-01 14:24, `EAINT-12171-Insurance-Cron-Interval.md`. The expiry cron is not listed.

## 10. Open questions / conflicts
1. **Where is the "Special Remarks" field?** Miro "Insurance Transaction Details Page > Special Remarks Field". Repo has no capture of a Special Remarks field on the insurance details page (UCD or BO). Which portal, who edits it, max length?
2. **Which statuses expire?** Miro lists "Payment = Failed, Tx Status = Failed" under After Payment and "Quotation / Pending Approval???" (unsure). Jira says only "when UCD did not make payment". EAINT-9141 TS said Failed and Pending Approval also become Quotation Expired. Rule needed per status.
3. **Payment Pending case:** should a Pending Payment row with Payment = Pending (paid, awaiting gateway) expire after 24 h?
4. **Existing transactions:** will the fix back-fill old stuck prod rows (B58005885, B58005800), or only new ones? Miro lists "Existing eAuto Insurance Transaction".
5. **Title vs reason:** title says "Allow Special Remarks Field to Accept Special Character"; reason says special chars "affect this cronjob". Is the change in the field validation, the cron, or both?
6. **No SRD, no QA, no env, no date, status In Development.** Confirm readiness before planning.
7. **Expiry rule:** 24 h from created time (Jira) vs observed "24 hours to the minute" on staging — what does the cron interval add (run frequency)?

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-insurance-purchase.md` — listing filters, status values, details page, 24-h expiry observation.
2. `knowledge/eauto-insurance.md` — cron jobs, quotation reminder window.
3. `knowledge/flow-quotation-reminder.md` — status code map (line 187).
4. `scripts/eauto-quotation-reminder/pages/InsuranceListingPage.ts` — listing status reader (line 52).
5. `scripts/eauto-e2e/pages/TransactionEnquiryPage.ts`, `InsuranceQuotePage.ts`, `PaymentPage.ts` — insurance purchase flow.
6. `scripts/eauto-insurance/` — insurance runner.
7. `_reference/html/eauto/insurance-listing-pending-payment-row.html` — listing capture.
8. `_reference/codebases/eauto-qa-azfar/automation/src/flows/insurance.flow.ts` (read-only reference).
