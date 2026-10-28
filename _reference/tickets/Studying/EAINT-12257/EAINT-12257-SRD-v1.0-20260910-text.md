<!--
Text of SRD_EAINT-12257_v1.0_20260910.pdf (Jira attachment 156533, uploaded
2026-09-10 17:44 by Lim Yi Link). Read 2026-10-21 through Jira's media viewer
(PDF not downloaded). Boilerplate (purpose, audience, revision-policy prose) and
the table of contents trimmed; every requirement row, the pending-items table and
the change log are kept verbatim. "Content highlighted in blue is pending
confirmation" — the viewer text does not show colour; §2.2.6 says its two items
are the blue ones.
-->

# SRD — [eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application — v1.0 (10.09.2026)

## 1.3 Revision History
| Version | Date | Revised By | Reason |
|---|---|---|---|
| 0.1 | 10.09.2026 (Thurs) | Lim Yi Link | Initial Draft |
| 1.0 | 10.09.2026 (Thurs) | Lim Yi Link | Send out for external review |

Note: Content highlighted in blue is pending confirmation

## 1.5 Associated Documents
1. EAINT-12257 — main enhancement request ticket
2. CCB-937 — EAUTO | To Add DuitNow QR Payment Channel for UCD Onboarding (Pre-application and Application) — Change Control Board ticket
3. EAUTO-1018 — ENHANCEMENT OF PAYMENT CHANNEL - ONBOARDING — source / parent enhancement
4. DuitNow QR Payment Design Mockup (HTML) — provided by requestor — design reference for the payment method selection

## 2.1 High-Level Requirement Overview
- 2.1.1 Enhancement Overview: Add DuitNow QR as an additional payment method in the UCD Onboarding payment step, for both Pre-application and Application.
- 2.1.2 Key Value(s) Expected: Give new users greater payment flexibility during onboarding by supporting DuitNow QR alongside the existing payment methods.

## 2.2.1 Background
Project eAuto · Portal UCD · Module Pre-application & Application · Request: Add DuitNow QR as a payment method option during UCD onboarding payment.

## 2.2.2 Existing Issue & Expected Behaviour
1. Existing: DuitNow QR is not currently available as a payment method during UCD onboarding.
2. Expected: DuitNow QR is available as an additional payment method. Existing payment methods remain unchanged.

## 2.2.3 Affected Pages
1. UCD Onboarding — Pre-application — Payment: Payment method selection step of the Pre-application onboarding form.
2. UCD Onboarding — Application — Payment: Payment method selection step of the Application onboarding form.

## 2.2.4 Payment Method Selection (Pre-application & Application)

**EAINT-12257-REQ-001 — New Payment Option — DuitNow QR**
Description: The existing payment method options shall remain unchanged. The system shall display "DuitNow QR" as a payment method option in the Pre-application and Application onboarding payment. On successful payment, the system shall direct the user to the confirmation page: a. Pre-application: Pre-Application Summary page b. Application: Application Payment Success page
Acceptance: a. DuitNow QR appears as a payment method option in the Pre-application onboarding payment. b. DuitNow QR appears as a payment method option in the Application onboarding payment. c. Existing options remain unchanged and functional. d. On successful payment, the Pre-application user is directed to the Pre-Application Summary page. e. On successful payment, the Application user is directed to the Application Payment Success page.

**EAINT-12257-REQ-002 — Payment Method Selection Behaviour**
Description: The user shall be able to select DuitNow QR as the preferred payment method before proceeding to pay.
Acceptance: Only one payment method can be selected at a time. Selecting DuitNow QR marks it as the chosen method and enables the "Submit and Pay" action.

## 2.2.5 DuitNow QR Payment (Pre-application & Application)

**EAINT-12257-REQ-003 — DuitNow QR Payment Popup**
Description: Upon selecting DuitNow QR and clicking Submit and Pay, the system shall display a payment popup showing: a. DuitNow (Malaysia National QR) code from the Fiuu payment gateway b. Instruction: "Kindly scan the QR code below to proceed with payment. Do Not Refresh!" c. Countdown timer starting at 3 minutes (03:00), tied to the Fiuu QR validity
Acceptance: a. The popup displays the QR code and the instruction text. b. The timer shows "Scan QR in mm:ss", starting at 03:00.

**EAINT-12257-REQ-004 — Successful Payment**
Description: Upon successful payment, the system shall redirect the user to: a. Pre-application: Pre-Application Summary page b. Application: Application Payment Success page
Acceptance: a. A successful payment redirects to the Pre-Application Summary page (Pre-application). b. A successful payment redirects to the Application Payment Success page (Application).

**EAINT-12257-REQ-005 — Failed Payment Handling**
Description: The system shall treat the transaction as failed when any of the following occurs: a. The timer reaches 00:00 before payment completes b. The user clicks Cancel the transaction c. The bank declines the payment or funds are insufficient. On a failed payment, the system shall: a. Close the popup b. Return the user to the payment method selection c. Display the existing unsuccessful payment message
Acceptance: a. Any failure closes the popup and returns to the payment method selection. b. The existing message is shown: "Unsuccessful Payment — Something went wrong and your payment didn't go through. Please choose a payment method and retry."

**EAINT-12257-REQ-006 — Retry After Failed Payment**
Description: After a failed payment, the Pre-application or Application shall remain intact. The user shall be able to select another payment method or retry DuitNow QR, without restarting the Pre-application or Application.
Acceptance: a. The user can select any payment method (including DuitNow QR) and continue the same Pre-application or Application. b. No restart of the Pre-application or Application is required.

## 2.2.6 Pending Items — Questions to Confirm
"The following items are not yet defined and are pending feedback from Fiuu. No behaviour has been assumed; each item is highlighted in blue pending confirmation."
1. Payment amount display — will the DuitNow QR payment popup display the payment amount to the user? (Pending feedback from Fiuu.) — Pending (Fiuu)
2. "Do Not Refresh!" — what happens if the user refreshes the page or clicks browser Back during the DuitNow QR popup, and is there any duplicate-payment safeguard? (Pending feedback from Fiuu.) — Pending (Fiuu)

## Appendix — Requirement Change Log
REQ-001 … REQ-006 all "Added — Initial draft" in v0.1.
