# EAINT-12324 — Jira capture (27/10/2026, 9:07:32 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto-Wholesale 2.0] Exclude UCD-to-UCD transfers from the STMS_APPROVED stock notification
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Yi Fung Tan · **Reporter:** Mong Guo Hao · **QA (cf 10041):** —
4. **Fix versions:** S34.1-20261001 🌞 (2026-10-01)
5. **Labels:** feature
6. **Created:** 2026-09-10T11:13:16.795+0800 · **Updated:** 2026-10-05T14:48:17.070+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-01 · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

Requirement
When an STMS transaction is a UCD-to-UCD transfer, eAuto must not fire the STMS_APPROVED event to the wholesale backend. The vehicle is moving between two dealers already inside the trade rather than entering the buying dealer's stock from outside it, so it should not raise a stock-acquisition notification.
Current behaviour
STMS_APPROVED fires for every seller category, UCD-to-UCD included. The fire-site helper checks only three things, none of which looks at the counterparty:
- buyerCompanyId is non-blank
- that company's WholesaleCompanyEnrollment.isFullyActive() — enrolled + Active + Marketplace T&C accepted
- transactionDao.isTransactionApproved() re-queried after the JPJ response is persisted
There is no reference to sellerCategory or companyCategory anywhere in the path.
Required behaviour
Skip the enqueue when the seller side is another UCD:
| SellerCompanyCategory | Label | Required |
| UTU | UCD to UCD | Do not fire |
| IUTU | Interstate/UCD to UCD | Do not fire |
| CTU | Company (Malaysian) To UCD | Fire (unchanged) |
| FTU | Company (Foreigner) To UCD | Fire (unchanged) |
| CUTU | Company/UCD to UCD | See open question 1 |
| individual seller (no company category) | — | Fire (unchanged) |
Scope — STMS only
eSTM is out of scope. BuyerCompanyCategory.UTU exists in the code and is rendered by estm-title.jsp as "From UCD (used car dealer) to UCD (used car dealer)", but UCD-to-UCD is not a live eSTM business flow. No change to ESTM_APPROVED.
The WHOLESALE_UTU / WHOLESALE_UTU_BUYER / WHOLESALE_UTU_REFUND categories are already unaffected: wholesale-native deals run on the separate WholesaleStmsTransaction entity with their own payment handler and submission controller, neither of which has a notify hook. They fire FULL_PAYMENT_DONE / PICKUP_DATE_CONFIRMED / SALE_CONFIRMATION_READY instead.
Acceptance criteria
- An approved STMS whose seller company category is UTU or IUTU produces no row in wholesalenotifyevent and no outbound event, even when the buyer company is fully active in wholesale.
- The skip is logged at INFO on the [WHOLESALE-NOTIFY] channel with the transaction ref, company id and the category that caused it, so it is auditable.
- An approved STMS with any other seller category still fires exactly as today — same payload, same STMS_APPROVED:<refNo> idempotency key.
- No change to ESTM_APPROVED, to the outbox retry ladder, or to the wholesale-native deal events.
- The guard cannot fail a payment: a UCD-to-UCD transaction still completes payment and JPJ submission normally.
Affected code
- src/main/java/com/myetrade/eauto/handler/stms/NewPaymentHandlerBean.java — fireStmsApprovedNotify(StmsTransaction), called from doRHBDDProcessByType
- Category source: tx.getSellerDetails().getCompanyCategory() → com.myetrade.eauto.model.library.SellerCompanyCategory
sellerDetails is already populated at the fire site (the handler reloads with openTransactionNew(id, true) → doOpenAll → openSellerDetails), so the check needs no extra query. Placing the guard before the enrollment lookup makes excluded transactions one query cheaper.
Note the notification only fires on the RHB direct-debit payment path — doRHBDDProcessByType is the sole hook site. POB/counter, FPX, the cron re-submitters, the BO incomplete-resubmission handlers and the standalone submission controllers never fire it, so they need no change.
Open questions
- Is CUTU in scope? "Company/UCD to UCD" is a mixed bucket whose seller may be an ordinary company rather than a dealer. Suppressing it would drop legitimate acquisitions; leaving it would let some dealer-to-dealer trades through. Needs a business decision.
- Seller-side stock. No event tells the backend that a disposing UCD no longer holds a vehicle. If the backend's stock sweeper relies on eAuto events for removal, an enrolled seller in a UCD-to-UCD trade may be left with stale stock. Confirm the backend contract before finalising.
Notes
- The event payload is only company_account_id + vehicle_no, with no seller field, so the backend cannot make this distinction itself — the exclusion has to happen on the eAuto side.
- companyCategory persists as an ordinal int, so SellerCompanyCategory members must never be reordered.
- The label strings on BuyerCompanyCategory are copy-pasted from the seller enum and read backwards for eSTM (e.g. CTU = "Company (Malaysian) To UCD" where it actually means UCD → Company). They are dead — getLabel() is never called and the JSPs hardcode the correct wording — but they are misleading to read. Worth a separate cleanup ticket.

## Comments (0)

## Attachments
