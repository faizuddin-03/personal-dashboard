<!-- Source: _reference/tickets/Studying/_miro-board-capture-2026-10-26.md lines 758-809,
     column "26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)". Miro board "eAuto - QA Resource Planning", captured 2026-10-26. Verbatim copy. -->
# EAINT-11868 Miro card (verbatim)

Column: **26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)**

```
EAINT-11868 - 🔴[eAuto-Application] To Implement Email Reminders & Application Link Reactivation
- To deploy on:
- Test Env: staging/uat1
- BA: Yi Link
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays:  6 days (1 QA)
- Base Testing Time: 4 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope:
- Modules:
- Application form
- Test Scenarios:
- Reactivation Flow
- Reminder Emails (Reactivation)
- Compete E2E cycle testing trigger from different entry point
- 30 days > no reactivation email > 60days > no reactivation email > 90 days > send reactivation email
- TS01: Reactivation when Application Status = Pending > Payment = OK -> SSM Checking = OK >  Reactivation = Approved -> verify e-Invoice / Invoice -> verify MyInvois
- TS02: Reactivation when Application Status = Approved > Payment = OK -> Reactivation = Approved
- TS03:  Reactivation when Application Status = Rejected > Payment = OK -> Reactivation = Approved
- TS04: Reactivation when Application Status = Expired > Payment = OK -> Reactivation = Approved
- TS05: Special TS: extend once → expire → reactivate → expire → reactivate
- TS06: Payment = Failed
- TS07: LHDN Failed , e-Invoice not available
- click btn > UCD make payment > create new PA record > SSM checking
- roc , rob > purchase SSM
- trading > to upload trading license
- TS08: PA (A) -> A -> Expired -> Reactivation -> create PA(B) , PA(B) = A but not PA(A)
- Reminder Emails (After Approval)
- 3days after approval of Application- to submit required softcopy docs
- approval within 3days - docs completed
- Reminder Emails (Expiry)
- 2months before expiry
- 1 month before expiry
- No expiry if application complete
- Reminder Email (Payment)
- 1day - to complete payment (after Assignee verify Softcopy , Softcopy Docs = Checked, Registration Fee = Pending UCD)
- Reminder Emails (Hardcopy)
- 3days after payment
-
- E2E - Existing Application (include email reminder)
- Regression
- Business Type - to cover all 5business types?
```
