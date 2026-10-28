import type { Module, Source } from "../types";

const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const azfar = (ref: string): Source => ({ kind: "azfar", ref });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const miro = (ref: string): Source => ({ kind: "miro", ref });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: "prod code 0e21bef3db — " + ref, date: "2026-10-23" });

const FSH = mine("knowledge/flow-service-hub.md");
const ESH = mine("knowledge/eauto-service-hub.md");
const FDP = mine("knowledge/flow-device-purchase.md");
const MIRO_SC = miro("uXjVHAd4xoA= ([eAuto - UCD & BackOffice] Shopping Cart)");
const AZ_SH = azfar("knowledge/portals/ucd/portal.md#BMK, Service Hub");
const AZ_SH_FLOW = azfar("automation/src/flows/service-hub.flow.ts");

export const serviceHub: Module = {
  id: "service-hub",
  name: "Service Hub (Software Installation and Biometric Device Purchase)",
  short: "Service Hub",
  portals: ["UCD portal", "Back Office", "RHB direct debit", "Report Engine (DO PDF)"],
  summary:
    "Service Hub is where a UCD buys two services: Software Installation (SI) and the Dermalog Biometric Device (BDP). The UCD pays first, then books an installation slot. Back Office staff manage the request: complete, fail or cancel the installation, move the calendar, add shipping details with device serial numbers, and download the Delivery Order (DO). The change request family name is Shopping Cart.",
  related: ["backoffice", "payments-fees"],
  glossary: [
    { term: "SI", meaning: "Software Installation. RM50 + 8% SST = RM54 each. No limit on how many a UCD can buy.", sources: [ESH, FSH] },
    { term: "BDP", meaning: "Biometric Device Purchase. The Dermalog device costs RM850 (no SST). Each device comes with one free installation.", sources: [ESH, FSH] },
    { term: "SR", meaning: "Service Request. One purchase = one SR with a reference like SR67000001 (live example SR69001391). Format: SR + year + month + 6 digits.", sources: [ESH] },
    { term: "Shopping Cart", meaning: "Family name of the change requests. EAINT-10960 builds Software Installation, EAINT-11880 builds Biometric Device Purchase. Umbrella CCB-618 replaces the old Proforma Invoice. Next phases: EAINT-11881 (Change Main User) and EAINT-11882 (Account Termination).", sources: [FSH, jira("EAINT-10960"), jira("EAINT-11880")] },
    { term: "DO", meaning: "Delivery Order. A PDF made by the Report Engine for a Biometric Device Purchase. Number format yyyyMMdd/DP-0001.", sources: [FDP] },
    { term: "Ops / CSE", meaning: "Two Back Office staff groups. Ops has full access. CSE (customer service) can reschedule, complete and fail installations, but cannot cancel a BDP, cannot export and sees the device fields read-only.", sources: [FSH, mine("knowledge/eauto-portals.md")] },
    { term: "Hub Admin", meaning: "A Back Office role. Only Hub Admin accounts outside a blocked list of 18 can open Update Shipping Details and type serial numbers.", sources: [FDP] },
    { term: "Installation Status", meaning: "Status of one appointment: -, New, Pending, Completed, Failed, Cancelled, Expired. Colours: Pending blue, Completed green, Failed red, the rest black.", sources: [ESH] },
    { term: "Service Hub transaction status", meaning: "Prod code enum values actually used: NEW, PENDING, COMPLETED, CANCELLED, EXPIRED. HELD and RESCHEDULE_ORIGIN are bookkeeping values on appointment rows only and never listed. APPROVED, REJECTED, REVERTED, VERIFIED and THUMBPRINT_PENDING exist in the shared enum but are not used by Service Hub.", sources: [ask("ServiceHubStatus.java")] },
    { term: "Failed reason", meaning: "Reason codes when BO fails an installation: Reappointment, Laptop/PC Issues, Other (free text).", sources: [ask("ServiceHubFailedReason.java")] },
    { term: "Delivery Status", meaning: "Status of the device shipment (BDP only): New, Arranged, Delivered. Only moves forward in that order.", sources: [FDP, MIRO_SC] },
  ],
  flows: [
    {
      id: "software-installation",
      name: "Software Installation purchase and slot booking (UCD)",
      summary:
        "UCD picks how many installations, pays by RHB direct debit, then books a date and session for each one. Payment comes before the appointment. The request is done when the page shows Request Submitted.",
      portals: ["UCD portal", "RHB direct debit"],
      triggers: [
        {
          id: "si-home-tile",
          name: "Service Hub tile on UCD home",
          entry: "UCD Home › SERVICE HUB tile (#servicehub) › SOFTWARE INSTALLATION tile",
          summary: "Main way in. Open to every UCD user (main and sub).",
          sources: [FSH, AZ_SH],
          steps: [
            {
              title: "Open Service Hub and choose Software Installation",
              where: "UCD Portal › Home › SERVICE HUB › SOFTWARE INSTALLATION (/view/ucd/service-hub/installation.do)",
              detail: "The Service Hub landing page shows the Service Request Listing. Software Installation is step 1 Payment.",
              sources: [FSH, AZ_SH],
            },
            {
              title: "Set the number of installations",
              where: "installation.do › quantity stepper",
              detail: "No limit on the number. Whole numbers only.",
              sources: [FSH, jira("EAINT-10960")],
            },
            {
              title: "Click Make Payment and confirm the popup",
              where: "installation.do › Make Payment (#si-pay-btn) › confirm popup",
              detail:
                "Popup has Back and Next. Payment is RHB direct debit. The automated path shows no gateway page. After a good payment the browser goes to slot.do.",
              affects: ["RHB direct debit", "Payments & Fees"],
              branches: [
                { when: "RHB rejects the payment (for example insufficient funds)", then: "Popup shows the RHB reason, Payment Status = Failed, the UCD can only go Back and cannot retry. The transaction becomes Cancelled." },
              ],
              sources: [FSH, ESH, azfar("automation/src/flows/service-hub.flow.ts")],
            },
            {
              title: "Book each installation on the calendar",
              where: "installation/slot.do (Installation Appointment)",
              detail:
                "Click a bookable day (td.si-book), set the count per session, Save date. Repeat until the page says Booked N of N appointment(s). Then click Confirm Appointment. Slots are held for 15 minutes after Confirm.",
              affects: ["BO Appointment Calendar", "BO listing"],
              branches: [
                { when: "Confirm with some units not booked", then: "Error #si-clienterr shows and the UCD stays on the page." },
                { when: "Someone else took the slot", then: "Popup: Slot Unavailable. Sorry, some selected time slot are booked. Please try again with another time slot or dates." },
                { when: "UCD leaves the page without booking", then: "The request stays paid but unscheduled. The UCD finishes it later with Resubmit on the listing." },
              ],
              sources: [FSH, ESH, MIRO_SC],
            },
            {
              title: "Request Submitted",
              where: "installation/submitted.do?id=",
              detail: "Page shows Request Submitted. Installation Status = Pending. A confirmation email is sent from support@eauto.my.",
              affects: ["UCD Service Request Listing", "Confirmation email", "Invoice and e-Invoice"],
              sources: [FSH, AZ_SH_FLOW, ESH],
            },
          ],
        },
        {
          id: "si-resubmit",
          name: "Resubmit from the Service Request Listing",
          entry: "UCD › Service Hub › Service Request Listing › Action Resubmit (a.sc-resubmit)",
          summary: "For a row that is paid but has no appointment yet. Not automated.",
          sources: [FSH, jira("EAINT-10960")],
          steps: [
            {
              title: "Click Resubmit on the row",
              where: "Service Request Listing (/view/ucd/service-hub/listing.do) › Action column",
              detail: "Takes the UCD back to the slot page to book the remaining units. No second payment.",
              sources: [FSH, MIRO_SC],
            },
            {
              title: "Book the slots and confirm",
              where: "installation/slot.do",
              detail: "Same booking steps as the main flow.",
              sources: [FSH],
            },
          ],
        },
      ],
      affects: [
        { text: "UCD Service Request Listing and Details page (receipt.do, titled Service Request Details). There is no details.do and no separate Receipt page.", sources: [FSH] },
        { text: "BO Biometric Device Purchase & Software Installation Listing and BO Appointment Calendar.", sources: [FSH, ESH] },
        { text: "Invoice and e-Invoice PDFs (Software_Installation_Invoice.pdf and _e-Invoice.pdf, item Dermalog Software Installation Service). Report engines: UCD Payment Report, Payment Breakdown Report, Download Payment Document (EAINT-12045/12046/12053).", sources: [ESH, jira("EAINT-12053", "2026-07")] },
        { text: "BO Reconciliation Summary Listing (EAINT-12018) and Consolidated e-Invoice listing (EAINT-12027, closed).", sources: [jira("EAINT-12018", "2026-07"), MIRO_SC] },
        { text: "Confirmation email: subject eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]. Fields: appointment number, date, time, paid amount. CS phone 03-27798899. Copy to support@eauto.my (EAINT-12105).", sources: [ESH, jira("EAINT-12105", "2026-07")] },
        { text: "Prod code: only the appointment booked or rescheduled email fires (RabbitMQ event SERVICE_HUB_APPOINTMENT, consumed by eauto-notification). A payment success email (SERVICE_HUB_PAYMENT_SUCCESS) exists on both ends but the publishing call is commented out in production. No SMS or WhatsApp.", sources: [ask("EmailNotificationSender.java:66-70; EautoNotificationEvent.java:9,11")] },
        { text: "Prod code: payment success queues an e-Invoice message and a payment-invoice/document message, and a payment-transaction event that refreshes the UCD Payment Report. The module has no JPJ reporting code and is excluded from JPJ-facing reconciliation reports (ConsolidatedReconcileController). eauto-report-engine renders the DO and invoice PDFs.", sources: [ask("ConsolidatedReconcileController.java:109-135")] },
        { text: "Known email defect: the dash in the subject shows as ? on the reschedule email (not RFC 2047 encoded; seen in Mailtrap 2026-07-15).", sources: [azfar("automation/src/data/email-contracts.ts")] },
      ],
      cronjobs: [
        {
          name: "Expiry cronjob (EAINT-12087)",
          schedule: "Daily at 01:00 Asia/Kuala_Lumpur (property cron.time.servicehubappointmentexpired; toggle cron.task.servicehubappointmentexpired.enabled). Job class ServiceHubAppointmentExpiredJob in eauto-cron.",
          does: "Sets installation and transaction to Expired when no installation (free or paid) is claimed within 2 months of purchase (buy 6 July, expires 7 September). Applies to SI and BDP. Jira title says 60 days. Prod code: it expires any still-open (NEW or PENDING) appointment whose date has passed, and force-expires any Paid transaction that never booked a slot within 2 months. The payment-report event is republished for each.",
          sources: [ESH, MIRO_SC, jira("EAINT-12087", "2026-07"), ask("ServiceHubAppointmentExpiredJob.java; ServiceHubAppointmentExpiredHandler.java")],
        },
      ],
      roles: [
        {
          text: "Software Installation: all UCD users (main and sub).",
          sources: [ESH, FSH],
          alt: [{ text: "Starting and paying a new purchase, and retrying a failed payment, is limited to the company's primary (Main) user. Other logged-in UCD users can view the listing and receipt pages and book a slot. No AATF or public Service Portal access.", sources: [ask("ServiceHubFilter.java; ServiceHubApiFilter.java; ServiceHubController.isServiceHubMainUser")], note: "prod code says" }],
        },
        { text: "BO staff can also book on behalf of a UCD from the BO Appointment Calendar (CSE call-in).", sources: [FSH] },
      ],
      afterCompletion: [
        { text: "Row appears in the UCD Service Request Listing (/view/ucd/service-hub/listing.do). Details open at receipt.do.", sources: [FSH] },
        { text: "Row appears in the BO listing /view/bo/service-hub/listing/main.do with Installation Status Pending until BO completes, fails or cancels it.", sources: [FSH, ESH] },
      ],
      rules: [
        { text: "Slot capacity: 3 per session and 6 per day. Two sessions: Morning 10am-12pm, Afternoon 2pm-4pm. The cap applies to UCD bookings only.", sources: [ESH] },
        {
          text: "Calendar shows this month and next month only. Blocked: today, tomorrow, past dates, weekends, public holidays (Google list, shown purple) and anything beyond 2 months.",
          sources: [ESH],
          alt: [{ text: "SRD says only the days from the next day onwards are open.", sources: [jira("EAINT-10960 SRD v1.2 2026-07-24")], note: "Live site also greys tomorrow, so the live version is shown." }],
        },
        { text: "Price: SI RM50 + 8% SST = RM54. Device RM850 with no SST.", sources: [ESH] },
        { text: "Each installation is valid 2 months from purchase. Text: Your appointment for software installation is valid for 2 months from your purchase date.", sources: [ESH, mine("Teams EAINT-12099 2026-07-20")] },
        {
          text: "Payment confirm popup text in the SRD is Sure to proceed with payment?",
          unconfirmed: true,
          sources: [jira("EAINT-10960 SRD v1.2")],
          alt: [{ text: "Code string is Sure to submit this payment?", sources: [ESH], note: "Wording mismatch between code and SRD, not settled." }],
        },
        { text: "Statuses (prod code). Transaction: NEW → PENDING (slot booked, or paid with install opted out) → COMPLETED (all appointments settled), or CANCELLED (payment failure, BO cancel, all appointments cancelled), or EXPIRED (cron, Paid but never booked). Appointment: NEW → PENDING → COMPLETED, FAILED (with reason) or CANCELLED. Payment status: New → Paid or Failed. Payment failure sets Failed and CANCELLED and is not retryable. A failed-payment redirect returns to the same page with payfailed=1.", sources: [ask("ServiceHubRhbPaymentHandlerBean.java:300-430; ServiceHubHandlerBean.rollUpTransactionStatus; ServiceHubStatus.java")] },
        { text: "The UCD cannot cancel a request by self-service. Text fields block Chinese and other non-English characters. Quantities are whole numbers only.", sources: [ESH, FSH] },
        { text: "Reference: SR{Year}{Month}{6 digits}. RHB payment ref 1 is SR{YYYYMMDD}{6 digits}-{Company ID}. Ref 2 is SOFTINSTALL/, BIODEV/ or SOFTINSTALL_BIODEV/.", sources: [ESH, MIRO_SC] },
        { text: "SI logic: 1 installation = 1 device = 1 time slot. The +2 days calendar rule applies to all booking.", sources: [MIRO_SC] },
      ],
      scopeToCheck: [
        { text: "Slot capacity per session and per day (3 and 6).", sources: [FSH] },
        { text: "Blocked dates: today, tomorrow, weekends, holidays, beyond 2 months.", sources: [FSH, ESH] },
        { text: "15-minute slot hold with two UCD users on the last slot.", sources: [FSH, MIRO_SC] },
        { text: "Confirm with only part of the units booked.", sources: [FSH] },
        { text: "Payment failure path: popup reason, Tx Cancelled, no retry.", sources: [ESH] },
        { text: "Listing Tx Status and Details page after booking.", sources: [FSH] },
        { text: "Invoice and e-Invoice downloads, item name and SST.", sources: [ESH] },
        { text: "Confirmation email: sender, subject, fields, count, CC to support.", sources: [ESH, mine("knowledge/mailtrap.md")] },
        { text: "Expiry cronjob: purchase with no booking flips to Expired after 2 months; with a booking stays Pending.", sources: [MIRO_SC, ESH] },
        { text: "Main user and sub user both can buy SI.", sources: [ESH] },
        { text: "Check the BO listing, BO calendar, UCD Payment Report and BO Reconciliation Summary Listing show the new row.", sources: [FSH, jira("EAINT-12018", "2026-07")] },
      ],
      tickets: [
        { key: "EAINT-10960", date: "2026-07", what: "Shopping Cart: Software Installation module. SRD v1.2 (2026-07-24). Deployed to production 2026-07-27. 80 child QA-Issues (11894 to 12094).", state: "latest" },
        { key: "EAINT-11953", date: "2026-07", what: "BO concurrency dialogs (record updated by another user).", state: "latest" },
        { key: "EAINT-12105", date: "2026-07", what: "CC support@eauto.my on the appointment confirmation email.", state: "latest" },
        { key: "EAINT-12102", date: "2026-07", what: "Permanent fix for service tax calculation and showing back Additional Installation.", state: "latest" },
        { key: "EAINT-12087", date: "2026-07", what: "Cronjob to auto-expire Software Installation slot after 60 days. Status Code Review on 2026-10-22.", state: "latest" },
        { key: "EAINT-12088", date: "2026-07", what: "Google Calendar public holiday list for the booking calendar.", state: "latest" },
        { key: "EAINT-12045 / 12046 / 12053", date: "2026-07", what: "UCD payment document, Payment Breakdown Report and Payment Report show SI and BDP records.", state: "latest" },
        { key: "EAINT-12018", date: "2026-07", what: "BO Reconciliation Summary Listing for Service Hub.", state: "latest" },
        { key: "EAINT-12027", date: "2026-07", what: "Consolidated e-Invoice Listing for Service Hub. Closed.", state: "legacy" },
        { key: "CCB-618", what: "Shopping Cart replaces the old Proforma Invoice.", state: "legacy", supersededBy: "EAINT-10960" },
      ],
      openQuestions: [
        "Payment confirm popup wording differs between code and SRD.",
        "Prod code: the payment success email (SERVICE_HUB_PAYMENT_SUCCESS) is commented out. Confirm with the dev team that no payment email is intended.",
        "Environment default differs between scripts: config.ts says uat4, playwright.config.ts says uat1.",
      ],
    },
    {
      id: "biometric-device-purchase",
      name: "Biometric Device Purchase (UCD main user)",
      summary:
        "The main UCD user orders Dermalog devices (1 to 40), picks what to do about the free installation, pays, then books the installation slots. After payment BO ships the order (see the shipping flow).",
      portals: ["UCD portal", "RHB direct debit"],
      triggers: [
        {
          id: "bdp-tile",
          name: "Biometric Device Purchase tile in Service Hub",
          entry: "UCD Home › SERVICE HUB › BIOMETRIC DEVICE PURCHASE tile (/view/ucd/service-hub/purchase.do)",
          summary: "Main UCD user only. A sub user does not get this tile by default (EAINT-12164 asks for a permission setting).",
          sources: [FSH, ESH, jira("EAINT-12164", "2026-08")],
          steps: [
            {
              title: "Step 1 Selection: quantity and delivery details",
              where: "purchase.do (form posts to /api/ucd/service-hub/purchase/create.do)",
              detail:
                "Quantity default 1. The minus button is off at 1. Maximum 40: typing 41 corrects to 40, empty or 0 corrects to 1. Recipient Name fills from the Main User (up to 200 characters). Contact No is Malaysian digits. Tick Ship to showroom address (default, read-only) or type another address. Click Next (button.bio-btn.next). Next creates an unpaid request.",
              sources: [ESH, FSH, FDP],
              branches: [{ when: "More than 40 sent by console", then: "Server rejects it. Message: A maximum of 40 devices can be purchased per transaction." }],
            },
            {
              title: "Step 2 Payment and installation option",
              where: "Payment page (URL not confirmed)",
              detail:
                "One free installation per device. Options: (1) free installations only, (2) free plus extra installations at RM54 each, (3) opt out with I do not need software installation (line struck through, red text No installation appointment will be scheduled., free right lost for good). Click Make Payment (#si-pay-btn) and confirm the popup.",
              affects: ["RHB direct debit", "Payments & Fees"],
              sources: [ESH, FSH],
              branches: [
                { when: "Payment fails", then: "Tx status stays - on the listing. UCD uses Resubmit on the Biometric Device Purchase Listing to pay again (Miro TS3/TS6)." },
              ],
            },
            {
              title: "Step 3 Appointment (only if installation kept)",
              where: "installation/slot.do",
              detail:
                "Allocation total (#si-alloc-total) = devices + extra installations. The UCD must book all units in one go (all or nothing). Leaving this page without booking leaves the free install unallocated. This is how BO Add Appointment test data is made.",
              affects: ["BO Appointment Calendar"],
              sources: [FSH, MIRO_SC],
              branches: [{ when: "UCD opted out of installation", then: "Goes straight to Request Submitted, no slot page." }],
            },
            {
              title: "Step 4 Request Submitted",
              where: "installation/submitted.do › Done (a.rs-btn) › receipt.do?id=<uuid>",
              detail: "Request Submitted page, then Done opens the Service Request Details. Device row type is BIOMETRIC_PURCHASE.",
              affects: ["UCD Service Request Listing", "BO listing", "BDP email"],
              sources: [FSH, AZ_SH_FLOW],
            },
          ],
        },
        {
          id: "bdp-resubmit",
          name: "Resubmit from the Biometric Device Purchase Listing",
          entry: "UCD › Service Request Listing › row with failed payment › Resubmit hyperlink",
          sources: [MIRO_SC],
          steps: [
            {
              title: "Click Resubmit and pay again",
              where: "UCD Service Request Listing › Resubmit",
              detail: "Used after a failed payment. After Payment = OK the UCD books a slot.",
              sources: [MIRO_SC],
            },
          ],
        },
      ],
      affects: [
        { text: "UCD Service Request Listing and Details. BO listing and BO Appointment Calendar (for the installation).", sources: [FSH] },
        { text: "BO shipping, serial number and Delivery Order flow (EAINT-12167 and 12166).", sources: [FDP] },
        { text: "Invoice and e-Invoice: Biometric_Device_Invoice.pdf and _e-Invoice.pdf, item Dermalog Biometric Device.", sources: [ESH] },
        { text: "BDP confirmation email (EAINT-12124, Code Review 2026-10-22): Paid Amount is the total paid. Free installation shows -. CC to support.", sources: [mine("Teams EAINT-12124 2026-09-28 09:34 Kasheng Liew"), jira("EAINT-12124", "2026-10")] },
      ],
      cronjobs: [
        {
          name: "Expiry cronjob (shared with SI)",
          schedule: "Daily at 01:00 Asia/Kuala_Lumpur (same job as Software Installation)",
          does: "Expires the unclaimed free installation 2 months after purchase.",
          sources: [ESH, MIRO_SC, ask("ServiceHubAppointmentExpiredJob.java")],
        },
      ],
      roles: [
        { text: "UCD main user only.", sources: [ESH, ask("ServiceHubController.isBdpManageDenied")] },
        { text: "Permission for the main user to let a sub user buy the device is still in requirement gathering (EAINT-12164).", sources: [jira("EAINT-12164", "2026-08")], unconfirmed: true },
      ],
      afterCompletion: [
        { text: "UCD Service Request Listing and Details. BO listing, then BO shipping (Delivery Status New).", sources: [FSH, FDP] },
      ],
      rules: [
        { text: "Quantity cap 40 per order (EAINT-12166 REQ-007, server side too). One parcel holds at most 10 devices.", sources: [FDP, mine("Teams EAINT-12166 Mei Jia Chee 2026-08-28")] },
        { text: "Number of Installations (SI) has no limit. EAINT-11996 (4 characters) was a bug, not a rule.", sources: [FDP] },
        {
          text: "Free installation booking is all or nothing: book every unit.",
          sources: [FSH],
          alt: [{ text: "The BDP SRD contradicts itself: booking the free installation is optional in one place and mandatory in another.", sources: [jira("EAINT-11880 SRD v1.2")], note: "Live behaviour is all or nothing, so it wins." }],
        },
        { text: "Free appointment is valid 2 months from purchase.", sources: [FDP, mine("Teams EAINT-12099 2026-07-20 Kin Hang Aw")] },
        { text: "Prod code: if the install add-on is opted out, a paid purchase goes straight to PENDING (device-only path). When BO sets Delivery Status to Delivered and no install is required, the transaction auto-completes. The first time serials and shipping are saved, the system numbers a Delivery Order and stores its PDF (assignAndLinkDeliveryOrders, generateAndStoreDeliveryOrderPdf). A Citylink tracking link shows once a consignment number is saved.", sources: [ask("ServiceHubHandlerBean.java:115-1317")] },
        { text: "Step 2 text You are entitled to [N] free software installations is in the SRD but was never seen live.", unconfirmed: true, sources: [ESH, FSH] },
      ],
      scopeToCheck: [
        { text: "Quantity 1, 40, 41 and 0.", sources: [FSH] },
        { text: "Opt-out path: no slot page, no installation record.", sources: [FSH] },
        { text: "Extra installations price RM54 each and invoice lines.", sources: [ESH] },
        { text: "All-or-nothing booking of the free installation.", sources: [FSH] },
        { text: "Main user can buy, sub user cannot.", sources: [ESH] },
        { text: "UCD status vs BO status after payment.", sources: [FSH] },
        { text: "Failed payment then Resubmit.", sources: [MIRO_SC] },
        { text: "BDP email fields and CC.", sources: [mine("Teams EAINT-12124 2026-09-28")] },
        { text: "Payment Report, Payment Breakdown, Download Payment Document show the device row.", sources: [jira("EAINT-12053", "2026-07")] },
      ],
      tickets: [
        { key: "EAINT-11880", date: "2026-07", what: "Shopping Cart: Biometric Device Purchase module. SRD v1.2. Done 2026-07-28.", state: "latest" },
        { key: "EAINT-11996 / 12095 / 12103 / 12104", date: "2026-09", what: "QA-Issues in the 21 Sept deployment set (12095: UCD word-wrap fix broke the BO page).", state: "latest" },
        { key: "EAINT-12123", date: "2026-09", what: "Different reference numbers for multiple records under the same SR. Code Review.", state: "latest" },
        { key: "EAINT-12124", date: "2026-10", what: "Email notification with CC to support for Biometric Device Purchase. Code Review.", state: "latest" },
        { key: "EAINT-12164", date: "2026-09", what: "Permission setting so the main user can allow a sub user to purchase. Requirement gathering.", state: "latest" },
        { key: "EAINT-12349", date: "2026-10", what: "Show full shipping address and let Ops select delivery details. Requirement refinement.", state: "latest" },
        { key: "EAINT-11881", date: "2026-09", what: "Shopping Cart: Change Main User module. Requirement refinement.", state: "latest" },
        { key: "EAINT-12099", date: "2026-10", what: "Shopping Cart: Inventory Control module. Requirement review. Not on the current branch.", state: "latest" },
      ],
      openQuestions: [
        "Step 2 payment page has no HTML capture, and its URL is not confirmed.",
        "Miro open questions box: payment fail scenario, reschedule on installation day, device and SI limits, cancellation after payment, weekend counting for the 2-day buffer, Tx status conditions.",
      ],
    },
    {
      id: "ucd-reschedule",
      name: "UCD self-service reschedule",
      summary:
        "A UCD moves a pending Software Installation appointment to a new date and session from the Service Request Listing. The old booking is dropped as soon as the UCD confirms the reschedule.",
      portals: ["UCD portal", "Back Office"],
      triggers: [
        {
          id: "reschedule-listing",
          name: "Reschedule action on the listing",
          entry: "UCD › Service Hub › Service Request Listing › Search Now › Action Reschedule (a.sc-resched, only SI rows with Tx Status Pending)",
          sources: [FSH, jira("EAINT-10960 SRD v1.2 2.3.2.2")],
          steps: [
            {
              title: "Open the reschedule modal",
              where: "Listing › Reschedule › modal (.sc-modal)",
              detail: "Tick #sc-resched-all and click Confirm. The page opens installation/reschedule.do?id=<txn>&apptIds=<uuid>. The old booking is already removed at this point.",
              sources: [FSH],
            },
            {
              title: "Pick a new date and session",
              where: "reschedule.do › calendar",
              detail: "Earliest date is today + 2 days. If that day is full the next free date is offered. Max 6 slots per day.",
              sources: [FSH, ESH],
              branches: [
                { when: "Same date and session as before (BDP SRD)", then: "Blocked with: The new appointment date and time slot must be different from the current appointment." },
                { when: "Same-day reschedule (SI SRD)", then: "Status Pending and remark UCD rescheduled on the same day." },
              ],
            },
            {
              title: "Confirm",
              where: "reschedule.do › Confirm",
              detail: "Dialog: Are you sure you want to reschedule? By proceeding you will lose your current appointment. Click Yes, then Done.",
              affects: ["BO Appointment Calendar", "BO listing", "Reschedule email"],
              sources: [FSH],
            },
          ],
        },
        {
          id: "reschedule-bo-call-in",
          name: "Reschedule by CSE on a call-in (Back Office)",
          entry: "BO › listing › Appointment Calendar button › row Reschedule",
          summary: "A different path. No date limit and no slot cap. See the BO Appointment Calendar flow.",
          sources: [ESH, FSH],
          steps: [
            {
              title: "CSE reschedules from the BO calendar",
              where: "BO Appointment Calendar (#sc-appt-cal) › a.cal-rs",
              detail: "Done for the UCD over the phone. See flow bo-appointment-calendar for the steps.",
              sources: [FSH],
            },
          ],
        },
      ],
      affects: [
        { text: "BO calendar and listing. The reschedule email lists only the rescheduled appointment(s).", sources: [ESH] },
        { text: "The reschedule email subject carries the new date and time. Known defect: the dash in the subject shows as ?.", sources: [mine("knowledge/mailtrap.md"), azfar("automation/src/data/email-contracts.ts")] },
      ],
      cronjobs: [],
      roles: [
        { text: "UCD users for self-service. CSE through the BO call-in path.", sources: [ESH] },
      ],
      afterCompletion: [
        { text: "Same SR, new appointment, Installation Status Pending.", sources: [ESH] },
      ],
      rules: [
        { text: "Minimum 2 days ahead: today and tomorrow are blocked. If +2 is full, the next free date is offered. Capped at 6 slots per day.", sources: [ESH, FSH] },
        {
          text: "Same-day reschedule gives status Pending with remark UCD rescheduled on the same day.",
          sources: [ESH, jira("EAINT-10960 SRD v1.2 2.3.2.1 #6")],
          alt: [{ text: "BDP SRD v1.2 blocks the same date and session, and says Failed is no longer expected. The live Status filter still lists FAILED.", sources: [jira("EAINT-11880 SRD v1.2")], note: "SI and BDP SRDs disagree. Do not assert an outcome without a live check." }],
        },
      ],
      scopeToCheck: [
        { text: "The +2 days rule and the next-free-date fallback.", sources: [FSH] },
        { text: "Capacity of 6 per day.", sources: [FSH] },
        { text: "Same-day remark and same date/session block.", sources: [ESH] },
        { text: "Old booking is discarded; the BO calendar shows only the new one.", sources: [FSH] },
        { text: "Reschedule email lists only the changed appointments.", sources: [ESH] },
      ],
      tickets: [
        { key: "EAINT-10960", date: "2026-07", what: "SI SRD v1.2 reschedule rules.", state: "latest" },
        { key: "EAINT-11880", date: "2026-07", what: "BDP SRD v1.2 blocks same date and session.", state: "latest" },
      ],
      openQuestions: [
        "Same-day reschedule outcome: SI SRD (Pending + remark) vs BDP SRD (blocked).",
        "SC_RH_TS09, TS10, TS12, TS22 and TS24 are not automated (Friday only, dev-patched holiday, or still to be decided).",
      ],
    },
    {
      id: "bo-listing-installation-status",
      name: "BO listing, details and Complete / Fail / Cancel installation",
      summary:
        "Ops and CSE search the Biometric Device Purchase & Software Installation Listing, open a request, and mark the installation Completed, Failed or Cancelled. The UCD sees the result on the details page.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "bo-listing",
          name: "BO listing",
          entry: "BO › Proforma Invoice / e-Invoice › Biometric Device Purchase & Software Installation Listing (/view/bo/service-hub/listing/main.do)",
          sources: [FSH, ESH],
          steps: [
            {
              title: "Search the listing",
              where: "BO listing › filters › Search (#sc-search)",
              detail:
                "Filters: Reference No., Company Name, Date Requested From/To (mandatory, default this month, max 1 month), Company ROC, Delivery Date, Delivery Status (BDP only), Appointment Date, Installation Status, Time Slot, Payment Status, LHDN Response Status, Service Type (EAINT-12111). Results load by AJAX. 50 rows per page. Export (Biometric_Device_Installation_List_YYYYMMDD.xlsx) is hidden until a search runs and is for Ops only.",
              sources: [ESH, FSH, jira("EAINT-12111", "2026-08")],
            },
            {
              title: "Open a request",
              where: "Listing › View (opens a new tab) › /view/bo/service-hub/detail.do?id=<uuid>&apptId=<uuid>",
              detail: "Shows the Service Request Details. Installer name and contact number are shown (EAINT-12110). CSE can edit the Special Remark for a BDP (EAINT-12131).",
              sources: [FSH, jira("EAINT-12110", "2026-08"), jira("EAINT-12131", "2026-08")],
            },
            {
              title: "Mark Completed",
              where: "Details › Mark Completed (.btn-success)",
              detail: "Popup: Are you sure want to mark the installation appointment as completed? No / Yes. UCD details show a green banner Installation request completed.",
              affects: ["UCD Service Request Details", "UCD listing Tx Status"],
              sources: [ESH],
            },
            {
              title: "Mark Failed",
              where: "Details › Mark Failed (.btn-fail)",
              detail: "Choose a reason: Reappointment, Laptop/PC Issues or Other (free text, max 100 characters: Reason must not exceed 100 characters.). UCD sees a red banner Installation request failed. and can book again. The failed reason stays after reappointment. A repeat failure overwrites it.",
              affects: ["UCD Service Request Details", "UCD reappointment"],
              sources: [ESH],
            },
            {
              title: "Cancel from the listing",
              where: "Listing › a[onclick*=scCancel] › Sure to cancel?",
              detail: "Cancel is shown only while Installation Status is -, New, Pending or Failed. Ops can cancel SI and BDP. CSE cannot cancel a BDP.",
              sources: [ESH, FSH],
            },
          ],
        },
      ],
      affects: [
        { text: "UCD details banner and UCD listing Tx Status.", sources: [ESH] },
        { text: "BO calendar counters.", sources: [ESH] },
      ],
      cronjobs: [
        { name: "Expiry cronjob", schedule: "Daily at 01:00 Asia/Kuala_Lumpur", does: "Sets Expired. See the Software Installation flow.", sources: [ESH, ask("ServiceHubAppointmentExpiredJob.java")] },
      ],
      roles: [
        { text: "Ops full access: cancel SI and BDP, Update Shipping Details, Export. Ops login IDs: kmcheah, jasons, mfared, nikmuhamad, eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni.", sources: [FSH, mine("knowledge/eauto-portals.md")] },
        { text: "CSE: SI full. BDP view-only for the biometric fields. Can reschedule, complete and fail the bundled installation. Cannot cancel a BDP. No Export. CSE login IDs: eautochinwei, eautohamal, eautojrjaya, eautoxiayuan, kokping, eautomie.", sources: [FSH, jira("EAINT-10960 SRD v1.2 2.2.3")] },
        { text: "CSE team could not view BDP transactions once (EAINT-11933, fixed). BO accounts without listing permission land on main.do with no date filter.", sources: [jira("EAINT-11933"), mine("knowledge/eauto-portals.md")] },
        { text: "Never tested: Ops vs CSE differences with real accounts. Only one BO account was used.", unconfirmed: true, sources: [FSH] },
        { text: "Prod code: BO access is three fixed lists of named operator logins, not roles. AuthorizedUserList.serviceHubInstallation can see the Service Hub listing, calendar and detail. A smaller subset, serviceHubBiometric, can do biometric-only actions (shipping update, cancel, export, Delivery Order download). A third list, serviceHubBiometricRemark, can edit only the Biometric Special Remark. The Service Hub BO menu is visible only to the first list.", sources: [ask("AuthorizedUserList.java:55-58; menu.jsp:676")] },
      ],
      afterCompletion: [
        { text: "Tx Status: Completed (all appointments final and at least one Completed), Cancelled (all cancelled or Payment Failed), Expired. These are end states.", sources: [ESH] },
      ],
      rules: [
        { text: "Status colours: Pending blue, Completed green, Failed red. Cancelled, Expired and - are black.", sources: [ESH] },
        { text: "Two users on one record: the second is blocked with Unable to proceed. This record was just updated by another user. or Unable to proceed. This Service Request has been completed, failed, expired or cancelled. OK refreshes the page. (Dialogs #op-concurrent-dialog and #op-installstate-dialog, built under EAINT-11953. Automation never triggered them.)", sources: [ESH, jira("EAINT-11953")] },
        { text: "Multi-appointment requests roll up into one Tx Status (EAINT-11956). The Status filter has Cancelled (EAINT-11912). Reference No. excludes the transaction id (EAINT-11913).", sources: [jira("EAINT-11956"), jira("EAINT-11912"), jira("EAINT-11913")] },
        {
          text: "Listing shows 50 rows per page.",
          sources: [ESH],
          alt: [{ text: "Jira child ticket EAINT-11948 says 20 records per page.", sources: [jira("EAINT-11948")], note: "Page size may have changed since. Check live." }],
        },
      ],
      scopeToCheck: [
        { text: "Ops vs CSE buttons: cancel, export, Update Shipping Details.", sources: [FSH] },
        { text: "Concurrency dialogs with two BO users.", sources: [ESH] },
        { text: "Complete, Fail (each reason, 100 character limit) and Cancel.", sources: [ESH] },
        { text: "Export file name and content (content never checked).", sources: [FSH] },
        { text: "Date Requested max one month.", sources: [FSH] },
        { text: "UCD banner and Tx Status after each action.", sources: [ESH] },
        { text: "Listing columns (20): #, Reference No., Service Type, Date Requested, Company Name, Company ROC, Device, Device Serial No., Delivery Date, Installation Request, Appointment Date, Time Slot, Payment Status, LHDN Response Status, Delivery Status, Installation Status, Date Completed, Remarks, Special Remarks, Action.", sources: [ESH] },
      ],
      tickets: [
        { key: "EAINT-10960", date: "2026-07", what: "BO listing and actions (SRD v1.2 section 2.3.2.5 and 2.3.2.6).", state: "latest" },
        { key: "EAINT-11953", date: "2026-07", what: "Concurrency dialogs.", state: "latest" },
        { key: "EAINT-12111", date: "2026-08", what: "Service Type filter (SI / BDP) on the BO listing.", state: "latest" },
        { key: "EAINT-12110", date: "2026-08", what: "Show installer name and contact on the details page.", state: "latest" },
        { key: "EAINT-12131", date: "2026-08", what: "CSE can update Special Remark for BDP.", state: "latest" },
        { key: "EAINT-11952", date: "2026-08", what: "Grant BO access for two named users to Onboarding and Service Hub.", state: "latest" },
        { key: "EAINT-11933", what: "CSE could not view BDP transactions. Fixed.", state: "latest" },
      ],
      openQuestions: [
        "Date Requested From auto-sets To: reported by the team, never captured.",
        "Which Ops and CSE rights differ in practice. Only one BO account has been used.",
      ],
    },
    {
      id: "bo-appointment-calendar",
      name: "BO Appointment Calendar (reschedule and add)",
      summary:
        "Ops and CSE see all bookings by month, move an appointment, or add one for a UCD. The slot cap of 3 per session applies to UCD bookings only. For BO it is just a counter.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "calendar-button",
          name: "Appointment Calendar button on the listing",
          entry: "BO › Biometric Device Purchase & Software Installation Listing › Appointment Calendar (#sc-appt-cal). No stable URL.",
          sources: [FSH],
          steps: [
            {
              title: "Pick a month and Search",
              where: "Calendar › month picker › Search",
              detail: "Table #cal-table shows two slots per date. Counters read Morning - N and Afternoon - N (Full), with a numbered company list.",
              sources: [ESH],
            },
            {
              title: "Reschedule an appointment",
              where: "Calendar › a.cal-rs › dialog #ac-rs-dialog",
              detail: "Dialog shows company, status, reference and the current date (read-only). Pick a new date in the datepicker and a slot radio, then Confirm and accept the browser confirm().",
              affects: ["UCD listing and details", "Reschedule email"],
              sources: [FSH],
            },
            {
              title: "Add an appointment",
              where: "Calendar › Add Appointment (#cal-add-btn)",
              detail:
                "Enter the exact Company Name and Search (this fills #ac-add-cid). Enter Reference No. (always required) and Search. Pick date and slot, Confirm and accept the browser confirm(). The reference needs an unbooked free installation.",
              branches: [
                { when: "Reference has no request, no allocation, is cancelled or is expired", then: "Search shows the matching message, for example the word cancelled for a cancelled request." },
              ],
              affects: ["UCD listing and details"],
              sources: [FSH],
            },
          ],
        },
      ],
      affects: [
        { text: "UCD listing and details appointment. Reschedule email.", sources: [ESH] },
      ],
      cronjobs: [],
      roles: [
        { text: "Ops and CSE. Slot cap counts UCD bookings only and is informational for CSE.", sources: [ESH] },
      ],
      afterCompletion: [
        { text: "Calendar and the SR appointment are updated.", sources: [FSH] },
      ],
      rules: [
        { text: "CSE dates: past dates and weekends are off. Today, tomorrow and beyond 2 months are allowed. CSE can add or move into a session shown (Full).", sources: [FSH] },
        {
          text: "Appointment Date is a datepicker.",
          sources: [ESH],
          alt: [{ text: "SRD says Appointment Date is a mandatory dropdown.", sources: [jira("EAINT-10960 SRD v1.2")], note: "Live is a datepicker." }],
        },
      ],
      scopeToCheck: [
        { text: "CSE can book with no date limit and no cap.", sources: [FSH] },
        { text: "Move into a (Full) session.", sources: [FSH] },
        { text: "Add Appointment: each reference error (no request, no allocation, cancelled, expired).", sources: [FSH] },
        { text: "The UCD sees the new date; the old slot count drops.", sources: [ESH] },
      ],
      tickets: [
        { key: "EAINT-10960", date: "2026-07", what: "BO appointment listing and reschedule. Includes EAINT-12091 (BO Add Appointment unable to book, Done).", state: "latest" },
      ],
      openQuestions: [],
    },
    {
      id: "bdp-shipping-serial-do",
      name: "BDP shipping, Device Serial No. and Delivery Order (BO)",
      summary:
        "After payment, a BO Hub Admin opens the request and clicks Update Shipping Details. They set Delivery Status to Arranged, type one serial number per device, and save. That assigns the DO number. Then the [DO] button downloads the Delivery Order PDF.",
      portals: ["Back Office", "Report Engine", "UCD portal"],
      triggers: [
        {
          id: "update-shipping",
          name: "Update Shipping Details",
          entry: "BO › listing › View › Service Request Details (BDP) › Update Shipping Details (#op-ship-dialog)",
          summary: "EAINT-12167 (serial numbers) and EAINT-12166 (Delivery Order).",
          sources: [FDP, FSH, MIRO_SC],
          steps: [
            {
              title: "Open the Update Shipping Details popup",
              where: "BO › Service Request Details (BDP) › Update Shipping Details",
              detail:
                "Fields: Number of Device (#op-ship-devcount, read-only total), Delivery Status (New shows one option, Arranged), Delivery Date (dd-MM-yyyy; an ISO date saves with 200 OK but stores no date), Consignment Number, Recipient Name, Shipping Address, Contact No, and one Device Serial No. box per unit (.op-ship-serial, 2 per row, scrollable).",
              sources: [FDP, FSH],
            },
            {
              title: "Type the serial numbers",
              where: "Popup › Device Serial No. boxes",
              detail:
                "Checked per field. Blank: This field is required. Under 8 characters: Device Serial No. must be between 8 and 12 characters. A 13th character cannot be typed (maxlength 12). A duplicate shows Duplicate serial number. on the LATER field only; the first one is not flagged and that is expected.",
              branches: [
                { when: "Symbols or Chinese characters typed", then: "See the rule on special characters: live site strips them while typing." },
              ],
              sources: [FDP, MIRO_SC],
            },
            {
              title: "Click Update",
              where: "Popup › Update (no native confirm)",
              detail:
                "Sends POST /api/admin/service-hub/biometric/update-shipping.do. Delivery Status New becomes Arranged. DO number(s) are assigned at the first shipping save. The Close button keeps the typed values.",
              affects: ["UCD Service Request Details (DO number)", "BO details page"],
              sources: [FDP, MIRO_SC],
            },
            {
              title: "Later: mark Delivered",
              where: "Popup reopened",
              detail:
                "Arranged can only move to Delivered. Serial fields are grey and locked. After Delivered the Update button is not drawn at all. An invalid jump returns 200 with body INVALID_STATUS (message: Invalid delivery status change. Delivery status can only move New → Arranged → Delivered.).",
              sources: [FDP, MIRO_SC],
            },
          ],
        },
        {
          id: "download-do",
          name: "[DO] button on the details page",
          entry: "BO › Service Request Details (BDP) › [DO] (window.open popup), shown once Delivery Status is Arranged",
          sources: [FDP, MIRO_SC],
          steps: [
            {
              title: "Click [DO]",
              where: "BO › Service Request Details › [DO]",
              detail:
                "A popup downloads Delivery_Order_<SR ref>.pdf. It uses the company registered address, never the delivery address. Installation count is printed in words (quantity + extras). Device Warranty is 1 year. Additional Remark Type is DEVICE PURCHASE. Each device shows its appointment row, or the text No appointment has been selected yet — to be arranged with the UCD.",
              affects: ["Report Engine", "BO audit log"],
              branches: [
                { when: "Report Engine is down", then: "Message: Delivery Order could not be generated. Please try again. The shipping save still works and the stored PDF is skipped. When the engine is back, the DO is made live." },
                { when: "Required details are missing", then: "Message: Unable to generate Delivery Order: required details are incomplete." },
                { when: "Order is installation-only, or was made before the release", then: "No [DO] button." },
              ],
              sources: [FDP, MIRO_SC],
            },
          ],
        },
      ],
      affects: [
        { text: "UCD Service Request Details shows the Delivery Order Number(s), comma-separated. It shows - until Arranged. No DO PDF and no serial numbers on the UCD side (serials are BO only).", sources: [FDP, MIRO_SC] },
        { text: "BO listing: Device Serial No. column and Device = 1 per row. One BO audit-log entry per DO download, listing all DO numbers.", sources: [FDP] },
        { text: "The Report Engine address moved to setting settings.eauto.report.engine.api.url. It is shared by 5 other PDF flows: Insurance e-Contract, CPS8/CP58, Add User Authorization + Declaration, eSTM Buyer Authentication slip, Company Management Print DO. Test these again after deploy (R1 to R5).", sources: [FDP] },
        { text: "The old Company Management manual Print DO form is unchanged.", sources: [FDP] },
      ],
      cronjobs: [],
      roles: [
        {
          text: "Update Shipping Details and serial fields: Hub Admin accounts except a blocked list of 18 (eautohamal, eautojenilyn, eautojrjaya, eautonashwa, eautoshamini, eautovegas, eautoxiayuan, kokping, tempstaff, wahidahzaki, mfnabila, mfnadhirah, mfzuhaira, eautochinwei, mfaliah, mfmaisarah, mfnicholas, mfteckyung). Ops can cancel and ship. CSE is view-only.",
          sources: [FDP, jira("EAINT-12167 SRD v1.2 REQ-009")],
        },
        { text: "Serial fields are read-only after Arranged for every role, including senior Hub Admin. The dev says the 18 accounts were already excluded, but this was not checked.", sources: [MIRO_SC, FDP], unconfirmed: true },
      ],
      afterCompletion: [
        { text: "BDP request in the BO listing with Delivery Status Delivered (end state) and its DO number. The UCD details show the DO number.", sources: [FDP] },
      ],
      rules: [
        { text: "DO number format yyyyMMdd/DP-0001. The counter restarts each day. A shipping save after 12:00 noon gets the next day's date. Numbers run in sequence across orders. DO number and Issued by (full name of the first person who typed the serials) are fixed at the FIRST shipping save.", sources: [FDP, MIRO_SC] },
        { text: "Large orders split: blocks of 20 per DO, remainder on the last one. Serial numbers run on across pages. Note printed: Split order · N of M · X units total. Example: 21 to 40 devices = one PDF, 2 pages, each page its own DO number.", sources: [FDP, MIRO_SC] },
        { text: "DO values are a snapshot. A later change of company address or phone does not change a re-downloaded DO.", sources: [FDP, mine("Teams Mei Jia Chee 2026-08-28 17:22 (REQ-008)")] },
        { text: "Delivery Status chain New → Arranged → Delivered. Once Arranged, serials are locked. A typo is fixed only through an IT support ticket (Option A).", sources: [FDP, mine("Teams Yi Link Lim 2026-08-17 10:47")] },
        { text: "Number of Device is the order total on the Details page but 1 per row on the Listing (REQ-011).", sources: [FDP, jira("EAINT-12399")] },
        {
          text: "Serial numbers: 8 to 12 characters, letters and numbers, compulsory, unique across devices. Special characters (symbols and Chinese characters) are stripped while typing (live-checked 2026-09-24, TS08; SRD v1.2 agrees).",
          sources: [mine("Faizuddin decision in chat", "2026-10-23"), mine("knowledge/flow-service-hub.md §7 (TS08 live 2026-09-24)"), jira("EAINT-12167 SRD v1.2"), MIRO_SC],
          alt: [
            { text: "Dev QA guide: a serial with a special character is rejected on save, not stripped. Miro scenario list also says rejected on save.", sources: [FDP], note: "dev guide version — not current behaviour" },
            { text: "Jira dev comment 2026-08-12: letters and numbers, spaces allowed, no symbols.", sources: [jira("EAINT-12167", "2026-08-12")], note: "Silent on strip vs reject." },
          ],
        },
        { text: "Old requests (made before the release) open normally, show an old DO number if any, but have no [DO] button and show a blank serial (no backfill). Installation-only SI never shows [DO] or shipping.", sources: [FDP, jira("EAINT-12167", "2026-08-12")] },
        { text: "The server rejects more than 40 devices. EAINT-12099 Inventory Control and Stock Out are not on this branch.", sources: [FDP] },
        { text: "Layout defect: a long serial overflows the .ins-serials box (EAINT-12408).", sources: [mine("knowledge/flow-service-hub.md §10")] },
      ],
      scopeToCheck: [
        { text: "Serial rules: blank, under 8, 13th character, duplicate (later field only), special characters.", sources: [FDP] },
        { text: "Delivery Status chain and locks: New → Arranged → Delivered, invalid jump, no Update button after Delivered.", sources: [FDP] },
        { text: "DO number format, sequence, daily reset and the noon cut-off.", sources: [FDP] },
        { text: "Split orders at 20, 21, 25 and 40 devices. The 25 (20 + 5) case has no E2E chain yet.", sources: [FDP, MIRO_SC] },
        { text: "DO snapshot after a company address change.", sources: [FDP] },
        { text: "Report Engine down and back up.", sources: [FDP] },
        { text: "R1 to R5: re-run the 5 other report flows that share the Report Engine setting.", sources: [FDP] },
        { text: "UCD details show the DO number. UCD has no serial numbers.", sources: [FDP] },
        { text: "Blocked list of 18 cannot open the serial fields.", sources: [FDP] },
        { text: "Old order has no DO button. Installation-only order has no [DO].", sources: [FDP] },
        { text: "BO listing serial column and Number of Device = 1 per row.", sources: [FDP] },
        { text: "One audit-log entry per DO download.", sources: [FDP] },
        { text: "Invoice and e-Invoice downloads are unchanged.", sources: [MIRO_SC] },
      ],
      tickets: [
        { key: "EAINT-12167", date: "2026-09", what: "Device Serial No. input and Number of Device on the SR Details page and popup. SRD v1.2. Deployed uat1 2026-09-22. Done.", state: "latest" },
        { key: "EAINT-12166", date: "2026-09", what: "Delivery Order for Device Purchase and quantity cap 40. SRD v1.1 (2026-08-28), later v0.6 scope note 2026-08-19. Uat1 2026-09-23. Done.", state: "latest" },
        { key: "EAINT-12394", date: "2026-09", what: "QA-Issue: duplicate serial error as browser popup. No longer reproducible. Done.", state: "latest" },
        { key: "EAINT-12404", date: "2026-09", what: "QA-Issue: duplicate error not under first field. Closed as expected.", state: "latest" },
        { key: "EAINT-12399", date: "2026-09", what: "QA-Issue: listing column Device renamed Number of Device. Done.", state: "latest" },
        { key: "EAINT-12408", date: "2026-09", what: "QA-Issue: serial list stacked in one column and long serial overflow. Done.", state: "latest" },
        { key: "EAINT-12349", date: "2026-10", what: "Show full shipping address and let Ops select delivery details. In refinement.", state: "latest" },
      ],
      openQuestions: [
        "Listing Serial column: SRD REQ-011 and live capture 2026-09-22 show it. The dev guide says there is no serial column. Live is trusted.",
        "DO number format: SRD says YYYYMMDD/DP001, live shows 20260923/DP-0005. The noon rule was not seen live.",
        "A multi-device order: one shared shipping update or one record per device. Needs a multi-device capture.",
        "TS counts shifted: 12166 went 24 → 32 → 30, and 12167 went 38 → 29. Not reconciled.",
        "R1 to R5 smoke pass was written but not run on uat1 as of 2026-09-24.",
      ],
    },
  ],
};
