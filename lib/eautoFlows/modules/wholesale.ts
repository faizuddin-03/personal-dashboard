import type { Fact, Module, Source, Step } from "../types";

// Wholesale 2.0 module. Wholesale chatbot flows are chatbot-driven and tested MANUALLY only by Faizuddin
// (not an automation gap). Built from the Wholesale v3 TS workbook (06c-ts.md), the 3-month Jira digest
// (08-jira-3months.md) and 02b. The Azfar repo has no written Wholesale flow. Ask eAuto prod-code facts
// (2026-10-23) are added with the ask source.

const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const azfar = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: "prod code 0e21bef3db — " + ref, date: "2026-10-23" });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

export const wholesale: Module = {
  id: "wholesale",
  name: "Wholesale 2.0 (chatbot, logistics, eMOVE, payment)",
  short: "Wholesale",
  portals: ["WhatsApp chatbot", "UCD portal (Wholesale tile and Wholesale STMS)", "Wholesale Back Office", "Wholesale payment portal", "Logistics (QR scan)"],
  summary:
    "Wholesale lets used-car dealers list, find, negotiate, pay for and move cars through a WhatsApp chatbot. The UCD portal holds the Wholesale STMS and the Wholesale Transaction Listing. The Back Office has its own Wholesale menu. eAuto Digits Sdn Bhd is the middle party in the ownership transfer. IMPORTANT: Wholesale chatbot flows are chatbot-driven and are tested manually only. They are not an automation gap. Official TS is the workbook 'eAuto_Wholesale_Test_Scenarios_COMPLETE_v3.xlsx' (May 2026, v3.0 final, sheets added to July 2026).",
  related: ["jomcheck", "stms", "apt", "estm", "backoffice", "payments-fees"],
  glossary: [
    { term: "eAuto Digits", meaning: "eAuto Digits Sdn Bhd. Receives the car from the seller by thumbprint transfer, then transfers ownership to the buyer.", sources: [ts("EAINT-11731 LGF_TS1")] },
    { term: "Processing Fee", meaning: "Fee paid by the buyer and by the seller to book a deal (RM 500 before any Deposit Discount). The JomCheck price is included in the processing fee.", sources: [jira("EAINT-12462 description", "2026-10"), ts("REQ_TS11")] },
    { term: "Decision Maker", meaning: "UCD role that gives the second approval of a full payment (after the WhatsApp approval).", sources: [ts("10 June 2026 Scope REQ_TS17, REQ_TS37")] },
    { term: "Hybrid Assist", meaning: "BO staff take over a chatbot conversation with a dealer. AI messages stop until released.", sources: [jira("EAINT-11870 description")] },
    { term: "eMOVE", meaning: "Standalone logistics service in the UCD portal, for moving a car after a UCD to UCD interstate transfer or an approved eSTM.", sources: [jira("EAINT-12019 description")] },
    { term: "Delivery Order (DO)", meaning: "Document with a number starting WSS (seller copy) or WSB (buyer copy), made when ownership moves to the buyer.", sources: [ts("EM_DN_TS1-TS20")] },
    { term: "Re-fire", meaning: "BO Marketing tab button that resends the marketing message for an ACTIVE vehicle. Never press Confirm Refire in production regression.", sources: [ts("EAINT-11999 TCF-10"), mine("knowledge/production-regression-scope.md")] },
    { term: "WholesalePaymentApprovalStatus", meaning: "Status of the WhatsApp approval of a buyer payment: AWAITING, APPROVED, REJECTED, EXPIRED (30-minute TTL), DELIVERY_FAILED (WhatsApp could not deliver) or SUPERSEDED (a newer request replaced it).", sources: [ask("WholesalePaymentApprovalStatus.java")] },
    { term: "Leg S / Leg B / Leg R", meaning: "The three STMS legs of a Wholesale deal: Seller to middleman, middleman to buyer, and Return. Transaction statuses WholesaleLegSPending, WholesaleLegBPending and WholesaleLegRPending clear when the counterparty signs.", sources: [ask("WholesaleLeg.java; TransactionStatus")] },
    { term: "Middleman", meaning: "The company set by wholesale.middleman.companyId. It sees every listing. Other users are resolved per listing as Seller or Buyer.", sources: [ask("WholesaleRole.java:51")] },
    { term: "Bot v2 / v2.1", meaning: "Newer versions of the chatbot (v2 SRD Done; v2.1 To Do).", sources: [jira("EAINT-12200, EAINT-12304, EAINT-12293")] },
  ],
  flows: [
    // ---------------------------------------------------------------- 1. Deal lifecycle
    {
      id: "deal-lifecycle",
      name: "Wholesale deal: list, search, offer, pay, transfer ownership, deliver",
      summary: "A seller lists a car by WhatsApp. A buyer finds it, makes an offer (up to 3 rounds), and both pay a processing fee. The buyer then pays in full, the seller transfers the car to eAuto Digits, and logistics deliver it.",
      portals: ["WhatsApp chatbot", "UCD portal", "Wholesale Back Office", "Wholesale payment portal"],
      triggers: [
        {
          id: "seller-whatsapp",
          name: "Seller WhatsApp commands",
          entry: "WhatsApp chatbot: 'Show my listing', 'I want sell Car', 'I want withdrawal car from listing', 'I want to change price'",
          sources: [ts("Wholesale v3 VL-TC-001, AL-TC-001, WD-TC-001, CP-TC-001")],
          steps: [
            S("Seller lists a car with plate, photos and details", [ts("Wholesale v3 AL-TC-001"), ts("EAINT-11890 TC-01-TC-23")], {
              where: "WhatsApp chatbot",
              detail: "Listing goes through pending statuses (NEW, PENDING_PHOTO, PENDING_PRICE, PENDING_MILEAGE and combinations, PENDING_VEHICLE_INFO, PENDING_CONFIRMATION) until ACTIVE.",
              branches: [
                { when: "Car is not found", then: "Seller must complete the STMS first, then resend." },
                { when: "Seller withdraws after a buyer paid", then: "Blocked: 'has an active payment. Escalate to support.'" },
              ],
            }),
            S("Seller views, changes price or withdraws", [ts("Wholesale v3 VL-TC-001, CP-TC-001, WD-TC-001")], { detail: "Chatbot commands for the seller's own listing." }),
          ],
        },
        {
          id: "photo-listing",
          name: "Seller sends photos with a plate (list by photo)",
          entry: "WhatsApp chatbot: seller sends photos without text",
          summary: "Newer rule: the bot reads the plate from the photos first.",
          sources: [jira("EAINT-12224 description", "2026-08-21"), jira("EAINT-11890 description", "2026-07")],
          steps: [
            S("Bot reads the plate, picks the car and attaches the photos", [jira("EAINT-12224 description")], {
              detail: "It attaches to the seller's pending listing or asks. The seller can correct a wrong read.",
              branches: [{ when: "Plate read is wrong", then: "Seller corrects it in the chat." }],
            }),
          ],
          affects: [
            F("Photo caps: 10 per listing and 50 per user per day (staging). Wrong-car photos are rejected and not counted. PDF photos use the first 10 images. Photo URLs must not expose the UCD phone number.", [ts("EAINT-11885, EAINT-11857, EAINT-11876 TS1-TS4")]),
          ],
        },
        {
          id: "buyer-whatsapp",
          name: "Buyer WhatsApp: search, offer, book",
          entry: "WhatsApp chatbot: 'I want buy myvi 2000-2026', 'make an offer RM33,000 for DDM1847', booking link and payment",
          sources: [ts("Wholesale v3 BS-TC-001, BE-TC-001, BP-TC-001")],
          steps: [
            S("Buyer searches and makes an offer", [ts("Wholesale v3 BS-TC-001, BE-TC-001")], { detail: "Up to 3 negotiation rounds. The final negotiated price is locked and shown in WhatsApp." }),
            S("Match card with the booking link", [mine("knowledge/flow-jomcheck.md §2", "2026-09-30")], { detail: "The match card carries the line 'Book here or purchase JomCheck report' that opens the payment page." }),
            S("Buyer pays the processing fee, then seller pays the processing fee", [ts("NEG-TC-001, REQ_TS35, CANCEL_TS1-TS4")], {
              where: "Wholesale payment portal",
              affects: ["RHB payment", "Reconciliation", "Consolidated e-Invoice"],
              branches: [{ when: "Seller does not pay within 20 minutes", then: "Deal is auto-cancelled; seller cannot relist; buyer is refunded." }],
            }),
          ],
        },
        {
          id: "ucd-wholesale-tile",
          name: "UCD homepage: WHOLESALE",
          entry: "UCD Homepage › WHOLESALE › landing with [Wholesale Transaction Listing] and [Wholesale Permission]",
          sources: [ts("EAINT-11872 11872_TS_WM_001-003"), jira("EAINT-10481 summary", "2026-10-05")],
          steps: [
            S("Seller creates the Wholesale STMS", [ts("EAINT-11731 EM_SELL_TS1; LGF_TS1")], {
              where: "UCD › Wholesale › Wholesale Transaction Listing",
              detail: "Seller gets the email '[Wholesale] Action required – create transaction for {vehicle number}'. Seller does a thumbprint transfer to eAuto Digits. The JPJ enquiry XML at Pay Now carries seller and eAuto Digits details.",
              affects: ["STMS (Wholesale STMS)", "JPJ"],
            }),
            S("eAuto Digits accepts and transfers to the buyer", [ts("EAINT-11731 EM_LOGISTICS_TS1, LGF_TS1")], {
              detail: "Buyer first makes the full payment. It needs 2 approvals: WhatsApp approval, then full-payment approval by the Decision Maker or Main User. Delivery Order is made and an email goes to logistics.",
            }),
            S("Logistics deliver and buyer accepts", [ts("EAINT-11731 LGF_TS1")], {
              detail: "Logistics scan the Seller QR and Dispatch Note QR, enter the vehicle number and upload 12 photos → 'Delivery Arranged'. They scan the Buyer QR and Delivery Order QR, enter the vehicle number and upload 12 photos → 'Delivered'. Buyer accepts the eAuto Digits transfer → Tx Status 'Completed'.",
              branches: [{ when: "Buyer rejects after delivery", then: "BO approves or cancels the rejection (Delist and Refund options)." }],
            }),
          ],
        },
        {
          id: "stms-approval-message",
          name: "STMS or eSTM approval triggers a recommendation message",
          entry: "A UCD STMS or eSTM becomes Approved",
          sources: [ts("EAINT-11987 TS_STMS_MR_001-009; EAINT-11872 TS_MR_*")],
          steps: [
            S("System sends a WhatsApp recommendation message to the right users", [ts("EAINT-11987 TS_STMS_MR_001-009")], {
              detail: "Only the Main User manages. The Main User always gets the STMS message. A Sub User gets it only if listed and ticked 'Receive'. A Decision Maker gets only Payment Approval unless also a Main or Sub UCD with Wholesale permission. Non-beta companies are not auto-enrolled.",
              affects: ["STMS", "eSTM"],
            }),
          ],
          affects: [F("EAINT-12324: UCD to UCD transfers are excluded from the STMS_APPROVED stock notification.", [jira("EAINT-12324 summary", "2026-10-05")])],
        },
        {
          id: "listing-upsert-api",
          name: "External wholesale portal creates or updates a listing (prod code)",
          entry: "POST /xapi/hmac/wholesale/listing/upsert.do (signed HMAC call)",
          summary: "Prod code: this is the real start of a deal. There is no UCD screen that creates a listing.",
          sources: [ask("WholesaleListingController.java:262")],
          steps: [
            S("Listing is created or updated as Draft, then Active", [ask("WholesaleListingStatus.java")], { detail: "The seller leg (Leg S) is pre-created at listing creation. The seller signs by MyKad/thumbprint on the UCD screen." }),
          ],
        },
        {
          id: "pay-now-approval",
          name: "Buyer Pay Now needs WhatsApp approval (prod code)",
          entry: "UCD › view/ucd/wholesale/payment.do › Pay Now (/api/ucd/wholesale/payment/request-approval.do)",
          sources: [ask("WholesalePaymentApprovalHandlerBean.java; WholesalePaymentApprovalCallbackController.java:33")],
          steps: [
            S("Approval request goes to the company boss on WhatsApp", [ask("WholesalePaymentApprovalHandlerBean.java:1-100")], { detail: "A WholesalePaymentApproval row is created as AWAITING." }),
            S("Boss taps Approve or Reject, or the request times out", [ask("WholesalePaymentApprovalCallbackController.java:33")], {
              detail: "APPROVED, REJECTED, EXPIRED (30 minutes), DELIVERY_FAILED or SUPERSEDED. Only APPROVED lets the RHB fund transfer run.",
              branches: [{ when: "Not APPROVED", then: "No payment is made." }],
            }),
          ],
        },
        {
          id: "ucd-home-and-handover",
          name: "UCD tile, STMS data entry and QR handover (prod code)",
          entry: "UCD home › WHOLESALE tile › view/ucd/wholesale/home.do; public driver links public/wholesale/driver-pickup.do and driver-delivery.do",
          summary: "The tile needs company enrolment, per-user permission and Marketplace T&C acceptance (WholesaleFilter.java:24).",
          sources: [ask("WholesaleFilter.java:24; home.jsp:482-888; WholesalePublicHandoverController")],
          steps: [
            S("Open the two-tile hub", [ask("view/ucd/wholesale/index.jsp")], { detail: "Tiles: Wholesale Transaction Listing and Wholesale Permission. STMS steps run at view/ucd/wholesale/stms/transaction/data-entry.do, auth-seller.do and auth-buyer.do." }),
            S("JPJ submission runs leg by leg", [ask("WholesaleJpjSubmissionController.java:122,251")], { detail: "When Leg B is JPJ Approved the logistics leg is released. Listing moves to InProgress once the buyer payment is paid." }),
            S("Seller and buyer scan QR codes at handover", [ask("WholesalePublicHandoverController")], { detail: "QR-A and QR-B must pair within 5 minutes. A final QR-C paperwork scan on delivery sets the listing to Completed. The driver pages are public and use a token, not a login." }),
          ],
        },
      ],
      affects: [
        F("Prod code: e-Invoice has its own WHOLESALE_STMS transaction type and makes a 'Wholesale e-Invoice' and 'Wholesale Invoice' PDF.", [ask("eauto-einvoice TransactionType.kt:20; EInvoiceUtils.kt:129")]),
        F("Prod code: wholesale STMS rows are indexed by eauto-elasticgateway and look like plain STMS from outside, with an internal isWholesale flag. Wholesale bank legs are merged into the normal RHB/STMS reconciliation.", [ask("RhbPaymentService.java:190-197; ReconciliationPipeline")]),
        F("Prod code: PDFs (sale confirmation, invoice, JPJ receipt) are made inside eauto through BO download endpoints, not by eauto-report-engine. No wholesale email or WhatsApp comes from eauto-notification. The chatbot service sends them.", [ask("WholesaleStmsEnquiryController.java:452-586")]),
        F("Wholesale Transaction Listing (UCD and BO); BO Refund, Vehicle Payment, Rejection and Payment listings.", [ts("REQ_TS11, TS15, TS22, TS24, TS25, TS28-TS32")]),
        F("Reconciliation, consolidated e-Invoice and its resubmission, RHB payment.", [ts("REQ_TS11-TS32")]),
        F("An eSTM for the same plate is blocked once the processing fees are paid.", [ts("Wholesale v3 REQ_TS")]),
        F("Wholesale STMS shows a revised RM27 charge.", [mine("knowledge/business-rules-from-test-scenarios.md §19")], { unconfirmed: true }),
      ],
      cronjobs: [
        { name: "Daily pending seller thumbprint email", schedule: "8 AM (DCJ_TS1)", does: "Finds Transfer Ownership transactions where the buyer paid in full but the seller has not done the thumbprint. Sends an email to operation@eauto.my '[Wholesale] Pending seller thumbprint – {date}'. No email if none. A failed run is logged.", sources: [ts("EAINT-11731 DCJ_TS1-TS3")] },
        { name: "WholesaleStuckListingNotifyJob (prod code)", schedule: "0 0 8 * * * (daily 8 AM Asia/Kuala_Lumpur by default; property cron.time.wholesalestucklistingnotify, env WHOLESALE_STUCK_LISTING_NOTIFY_CRON). Manual trigger: GET /sys/manual/notify-wholesale-stuck-listing", does: "Sends a digest of stuck Wholesale listings. Probably the same job as the daily pending-seller-thumbprint email above.", sources: [ask("eauto-cron WholesaleStuckListingNotifyJob.java:20; WholesaleStuckListingNotifyHandler")] },
        { name: "45-day listing expiry (not found as a job)", schedule: "Not found", does: "A code comment points at POST /xapi/hmac/wholesale/listing/expire.do for 45-day housekeeping, but no scheduled job implementing it was found in eauto-cron. It may not be wired up yet.", sources: [ask("eauto-cron domain/WholesaleListing.java:12")], unconfirmed: true },
        { name: "WholesaleNotifyMessager (background worker, not a cron)", schedule: "Continuous worker thread", does: "Sends queued outbound events (STMS or eSTM approved, full payment done, pickup date confirmed) to the chatbot service. Retries with backoff and marks an event Failed after the retry cap.", sources: [ask("WholesaleNotifyMessager; WholesaleNotifyEvent.java")] },
        { name: "Auto-cancel unpaid seller fee", schedule: "20 minutes after the buyer's processing fee", does: "If the buyer paid and the seller did not pay within 20 minutes, the deal is auto-cancelled, the seller cannot relist and the buyer is refunded.", sources: [ts("Cancel Transaction CANCEL_TS21")] },
      ],
      roles: [
        F("Seller, Buyer (mode is enforced), Main User, Sub User, Decision Maker, Logistic (QR scan), eAuto Digits, BO admin and ops, IT team (failure alert emails), Finance (manual invoice).", [ts("SEC-TC-001; EAINT-11987; REQ_TS18")]),
        F("Dealers reach it by WhatsApp bot. BO Ops handle the rest.", [mine("knowledge/business-rules-from-test-scenarios.md §19")]),
        F("Prod code: UCD access needs company enrolment, per-user Wholesale permission (or primary user) and Marketplace T&C acceptance. BO pages need named permission codes WHOLESALE_LOGISTIC.TIER.MAINTAIN, UNPRICED.MAINTAIN, HUB.MAINTAIN and PRICING_HISTORY.VIEW. The role Wholesale Logistic Admin has 4 members. The external wholesale portal and chatbot use shared HMAC secrets, not user login.", [ask("WholesaleFilter.java; BackOfficePermissionCode.java:21-54; Which BO roles exist")]),
        F("Prod code: the company eligibility check WholesaleEligibilityService.isEligible is a stub that always returns true.", [ask("WholesaleEligibilityService.java:8")]),
      ],
      afterCompletion: [
        F("Wholesale Transaction Listing status Completed. Logistic status Delivered.", [ts("LGF_TS1")]),
        F("A refund after full payment is handled manually by the operation team.", [ts("CANCEL_TS5")]),
      ],
      rules: [
        F("Multiple STMS are sent to all UCD users. One user editing locks it. Cancelling unlocks the vehicle.", [ts("REQ_TS1, TS2")]),
        F("Direct URL access to STMS steps is blocked before the payment and delivery stages.", [ts("REQ_TS27")]),
        F("A failed payment sets Payment Details = Failed (and Logistic = Failed for the seller fee and total payment).", [ts("FAILED_PY_TS1-TS5")]),
        F("The seller email is sent once even with two tabs, and not on payment failure.", [ts("EM_SELL_TS2-TS3")]),
        F("Delivery Order number starts with WSS plus 8 digits. Date shows as 'DD Mmmm YYYY'. Lorry number is blank. Service type is Door-to-Door or Hub-to-Hub. The 12-item photo checklist is unticked.", [ts("EM_DN_TS1-TS20")]),
        F("Attachments are 'Delivery Order Seller Copy (WSS).pdf' and 'Delivery Order Buyer Copy (WSB).pdf'. Logistics email goes to wholesale@eauto.my.", [ts("EM_LOGISTICS_TS1-TS2")]),
        F("Logistic v1 is removed. Old QR buttons are absent in BO. E2E only needs QR validation from the Delivery Order email.", [ts("EAINT-11949"), mine("knowledge/business-rules-from-test-scenarios.md §19 item 4")]),
        F("The daily pending-thumbprint email runs at 8 AM.", [ts("EAINT-11731 DCJ_TS1")], {
          alt: [
            { text: "Remarks in the same sheet cite 1 PM and 2 PM runs on 8 July 2026 in staging.", sources: [ts("EAINT-11731 DCJ_TS1 remarks")], note: "Schedule is unclear." },
            { text: "The only wholesale Quartz job in eauto-cron is WholesaleStuckListingNotifyJob, default daily 8 AM. No separate pending-thumbprint job was found.", sources: [ask("WholesaleStuckListingNotifyJob.java:20")], note: "prod code says" },
          ],
        }),
        F("Statuses (prod code). Listing: Draft → Active → InProgress → Completed, with Cancelled, Rejected and PendingAdminVerification (buyer rejection waiting for BO approval). Logistic: PendingLogisticArrangement → LogisticArranged → InTransit (V1 only, skipped now) → Delivered, or ReturnToSeller after a BO-approved rejection. Enrolment: Pending → Enrolled. Payment approval: see glossary.", [ask("WholesaleListingStatus.java; WholesaleLogisticStatus.java; WholesaleEnrollmentStatus.java")]),
      ],
      scopeToCheck: [
        F("Check seller commands (view, add, withdraw, change price): happy, negative, edge.", [ts("Wholesale v3 scope")]),
        F("Check buyer search, enquiry, offer, negotiation, booking and pay.", [ts("Wholesale v3 scope")]),
        F("Check cross-role edge cases. Orange CRITICAL rows must pass before go-live.", [ts("Wholesale v3 scope")]),
        F("Check race conditions and a dealer with many Sub Users.", [ts("Wholesale v3 scope")]),
        F("Check search and recommendation matching, and security and role access.", [ts("Wholesale v3 scope")]),
        F("Check plate-photo detection: listed, available, not found, blurry, skewed, partial, multi-plate, screenshot, non-image.", [ts("EAINT-11890 TC-01-TC-23")]),
        F("Check photo and PDF caps.", [ts("EAINT-11885, EAINT-11857")]),
        F("Check STMS and eSTM recommendation message routing by role.", [ts("EAINT-11987")]),
        F("Check the daily cron email, seller and logistics emails, dispatch note fields.", [ts("EAINT-11731")]),
        F("Check the logistics scan flow, including a wrong vehicle number and upload failure.", [ts("EAINT-11731 LGF_TS1")]),
        F("Check e-Invoice, reconciliation, and listing search and filter.", [ts("Wholesale v3 scope")]),
      ],
      tickets: [
        { key: "EAINT-11851", what: "Wholesale 2.0 epic.", state: "latest" },
        { key: "EAINT-11731", date: "2026-06", what: "New logistics flow with Delivery Orders (SRD v1.3 2026-07-06), cron and emails. Done.", state: "latest" },
        { key: "EAINT-11890", date: "2026-07", what: "List vehicle by uploading a photo with the plate.", state: "legacy", supersededBy: "EAINT-12224" },
        { key: "EAINT-12224", date: "2026-08", what: "Photo listing reads the plate first; seller can correct. SRD v0.1 2026-08-21.", state: "latest" },
        { key: "EAINT-11872", date: "2026-07", what: "Landing and permission page; eSTM recommendation message.", state: "latest" },
        { key: "EAINT-11987", date: "2026-07", what: "STMS Listing message enhancement.", state: "latest" },
        { key: "EAINT-11885", what: "Photo and PDF caps.", state: "latest" },
        { key: "EAINT-11877", what: "Chatbot only proceeds with checks before payment.", state: "latest" },
        { key: "EAINT-11876", what: "Photo URLs must not expose the UCD phone number.", state: "latest" },
        { key: "EAINT-11857", what: "Photo and PDF handling.", state: "latest" },
        { key: "EAINT-11949", date: "2026-07", what: "Remove logistic v1 flow and security fixes.", state: "latest" },
        { key: "EAINT-10481", date: "2026-04", what: "UCD portal Wholesale module. Done 2026-10-05.", state: "latest" },
        { key: "EAINT-12000", date: "2026-07", what: "New market flow: listing and sourcing extension.", state: "latest" },
        { key: "EAINT-12324", date: "2026-09", what: "Exclude UCD to UCD from the STMS_APPROVED stock notification.", state: "latest" },
        { key: "EAINT-11884", date: "2026-07", what: "RHB implementation for eAuto Digits Sdn Bhd. To Do (RHB spec v1.2 2026-10-06).", state: "latest" },
        { key: "EAINT-12304", date: "2026-09", what: "Bot v2.1. To Do.", state: "latest" },
        { key: "EAINT-12293", date: "2026-09", what: "v2.1 bot. To Do.", state: "latest" },
        { key: "EAINT-12200", date: "2026-08", what: "Bot v2 SRD. Done.", state: "latest" },
        { key: "EAINT-12001", date: "2026-07", what: "UCD lists a non-inventory car: bot needs the correct reply. To Do.", state: "latest" },
        { key: "EAINT-12002", date: "2026-07", what: "Enroll all Sub Users for beta UCD. To Do.", state: "latest" },
      ],
      openQuestions: [
        "REQ_TS12 car masking is On Hold. REQ_TS14 eAuto Digits return to the seller: 'Requirements not confirmed'. REQ_TS18 Wholesale document buttons On Hold. REQ_TS29 refund function not available.",
        "How a Wholesale-bought JomCheck report is downloaded, and whether Wholesale reads the v2.0 API fields, is not in the SRD.",
        "Id mismatch: sheet 11876_TS1 inside the EAINT-11877 workbook.",
      ],
    },

    // ---------------------------------------------------------------- 2. Cancellation and refund
    {
      id: "cancel-and-refund",
      name: "Cancel, reject and refund a Wholesale deal",
      summary: "Who can cancel, at which stage, and what happens to the vehicle listing and the money.",
      portals: ["WhatsApp chatbot", "UCD portal", "Wholesale Back Office"],
      triggers: [
        {
          id: "buyer-or-seller-cancel",
          name: "Buyer or seller cancels",
          entry: "UCD Wholesale Transaction Listing (cancel) or WhatsApp",
          sources: [ts("Cancel Transaction CANCEL_TS1-TS20")],
          steps: [
            S("Cancel before any payment", [ts("CANCEL_TS1-TS4")], { detail: "Buyer cancel before any payment: the listing goes back to ACTIVE, no refund." }),
            S("Seller cancels after the buyer paid", [ts("CANCEL_TS1-TS20")], { detail: "Car is blacklisted and not relistable. Buyer is refunded." }),
            S("After full payment", [ts("CANCEL_TS5"), ts("CANCEL_TS1-TS20")], { detail: "The UCD cancel button is disabled. A refund is manual. Cancel through WhatsApp is not possible after payment." }),
          ],
        },
        {
          id: "bo-cancel-reject",
          name: "BO approves or cancels a rejection / cancels a deal",
          entry: "Wholesale Back Office › Wholesale Rejection Listing / Refund Listing",
          sources: [ts("REQ_TS13; CANCEL_TS19-TS20"), mine("knowledge/flow-bo-shell.md §3.12")],
          steps: [
            S("BO decides on a buyer rejection after delivery", [ts("REQ_TS13; CANCEL_TS19-TS20")], { detail: "BO cancel has Delist yes or no, and Refund buyer, seller, both or none." }),
          ],
        },
        {
          id: "seller-fee-timeout",
          name: "Auto-cancel when the seller does not pay in 20 minutes",
          entry: "System job after the buyer paid the processing fee",
          sources: [ts("Cancel Transaction CANCEL_TS21")],
          steps: [S("Deal is cancelled and the buyer is refunded", [ts("CANCEL_TS21")], { detail: "The seller cannot relist the car." })],
        },
      ],
      affects: [F("BO Refund Listing must show 'To Refund' (EAINT-11711). Reconciliation and e-Invoice are affected.", [ts("CANCEL_TS2, TS8")])],
      cronjobs: [{ name: "Auto-cancel unpaid seller fee", schedule: "20 minutes", does: "Cancels the deal and refunds the buyer. Prod code: no wholesale Quartz job for this was found in the job inventory, so it may run inside the wholesale payment portal.", sources: [ts("CANCEL_TS21"), ask("quartz-scheduled-jobs.md")], unconfirmed: true }],
      roles: [F("Buyer, seller, BO admin and ops. Operation team handles manual refunds.", [ts("CANCEL_TS5, TS19-TS20")])],
      afterCompletion: [F("Listing is ACTIVE again, blacklisted or delisted, depending on who cancelled and when. Refund goes to buyer, seller, both or none.", [ts("CANCEL_TS1-TS20")])],
      rules: [
        F("The 'Cancellation Revamp' REQ_TS36 and the 8-9 June retests replace earlier cancellation wording.", [ts("REQ_TS36")]),
        F("Seller cannot withdraw after the buyer paid.", [ts("CR-TC-001")]),
      ],
      scopeToCheck: [
        F("Check cancellation by role, stage and channel (UCD, WhatsApp, BO).", [ts("CANCEL_TS1-TS20")]),
        F("Check refund and Delist options.", [ts("CANCEL_TS19-TS20")]),
        F("Check the listing shows 'To Refund' (EAINT-11711).", [ts("CANCEL_TS2, TS8")]),
      ],
      tickets: [{ key: "EAINT-11711", what: "Listing must show 'To Refund'. Retest FAILED 8-9 June.", state: "latest" }],
      openQuestions: ["CANCEL_TS2 and TS8 retest FAILED on 8-9 June (EAINT-11711)."],
    },

    // ---------------------------------------------------------------- 3. Logistics and eMOVE
    {
      id: "logistics-and-emove",
      name: "Logistics (delivery) and standalone eMOVE",
      summary: "Wholesale deals are delivered with a Delivery Order. eMOVE offers the same delivery as a standalone service for any UCD.",
      portals: ["UCD portal", "Wholesale Back Office", "Logistics QR scan"],
      triggers: [
        {
          id: "wholesale-delivery",
          name: "Wholesale buy or sell confirmed",
          entry: "After the buyer's full payment in a Wholesale deal",
          sources: [jira("EAINT-12019 description row 4"), ts("EAINT-11731 LGF_TS1")],
          steps: [
            S("Delivery Orders are made and logistics are emailed", [jira("EAINT-11731 SRD rows 5-6"), ts("EAINT-11731 EM_LOGISTICS_TS1")], {
              detail: "SRD v1.3 (2026-07-06). Photos show in Back Office only. DO issue date confirmed 23.06.2026.",
            }),
            S("Fee is worked out from the matrix", [ts("EAINT-11824 LOG_FEE_TS1-TS11")], {
              detail: "Hub-to-Hub = Door-to-Door + RM200. Klang Valley hub to Seremban 250, Melaka 300, Kulai / Johor Bahru / Muar 400, Batu Pahat / Kluang 450, Pasir Gudang 500, Segamat 550 (and reverse). Service tax 8%, but the fee is RM0.00 in production until notice.",
            }),
          ],
        },
        {
          id: "emove",
          name: "eMOVE: standalone logistics in the UCD portal",
          entry: "UCD portal › eMOVE (not under STMS; confirmed 26.08.2026) after a UCD to UCD interstate transfer or an approved eSTM",
          sources: [jira("EAINT-12019 description", "2026-10-21")],
          steps: [
            S("UCD requests delivery", [jira("EAINT-12019 description row 5")], {
              detail: "System arranges the pickup and delivery schedule and charges from the charges matrix. The driver scans a QR code to upload photos and update the status. Invoice and e-Invoice are made after payment. A Finance module handles vendor payment requests.",
              affects: ["UCD to UCD", "eSTM", "Invoice and e-Invoice", "Finance vendor payments"],
            }),
          ],
        },
        {
          id: "interstate-tiers",
          name: "Interstate price tier",
          entry: "Price shown when the delivery is interstate (Wholesale and standalone)",
          sources: [jira("EAINT-12119 description", "2026-09-23")],
          steps: [S("Price per car by logistics cost tier", [jira("EAINT-12119 description")], { detail: "Up to 250: base 300. 251-400: base 450. 401-600: base 650. Over 600: base 1,000." })],
        },
        {
          id: "bo-logistics-admin",
          name: "BO logistics admin pages (prod code)",
          entry: "BO › view/wholesale/logistic-charge-tier/index.do (Logistics Charges Matrix) and view/wholesale/logistic-hub/index.do (Logistics Hub)",
          sources: [ask("LogisticChargeTierController.java; WholesaleHubController.java; BackOfficePermissionCode.java:21-54")],
          steps: [S("Maintain tiers, unpriced items, hubs and view pricing history", [ask("BackOfficePermissionCode.java:21-54")], { detail: "Each page is checked server-side by a permission code and fails closed (no grant, no access). Wholesale listing admin is view/wholesale/listing/index.do and company accounts are view/wholesale/company/listing.do." })],
        },
      ],
      affects: [F("Delivery Orders, invoice and e-Invoice, Finance vendor payments.", [jira("EAINT-12019 description")])],
      cronjobs: [],
      roles: [F("UCD, driver by QR, Finance.", [jira("EAINT-12019 description")])],
      afterCompletion: [F("Invoice and e-Invoice. Finance vendor payment request.", [jira("EAINT-12019 description")])],
      rules: [
        F("Interstate tiers: 250 → 300, 251-400 → 450, 401-600 → 650, over 600 → 1,000. Applies to Wholesale and standalone (SRD v1.3 2026-09-23).", [jira("EAINT-12119 description", "2026-09-23")], {
          alt: [{ text: "Hub-to-Hub = Door-to-Door + RM200 with a fixed per-hub table (EAINT-11824).", sources: [ts("EAINT-11824 LOG_FEE_TS1-TS11")], note: "11824 is Closed (2026-08-07) while 12119 relates to it." }],
        }),
      ],
      scopeToCheck: [
        F("Check dispatch note fields and photo checklist.", [ts("EM_DN_TS1-TS20")]),
        F("Check scan flow with a wrong vehicle number and with upload failure.", [ts("EAINT-11731 LGF_TS1")]),
        F("Check the fee table and the interstate tiers.", [ts("EAINT-11824"), jira("EAINT-12119")]),
        F("Check eMOVE after a UCD to UCD interstate transfer and after an approved eSTM.", [jira("EAINT-12019")]),
      ],
      tickets: [
        { key: "EAINT-11731", date: "2026-06", what: "New logistics flow.", state: "latest" },
        { key: "EAINT-12119", date: "2026-07", what: "Interstate price tier. Done 2026-10-16.", state: "latest" },
        { key: "EAINT-12019", date: "2026-07", what: "eMOVE standalone logistics. Requirement refinement, SRD v0.8 2026-10-21.", state: "latest" },
        { key: "EAINT-11824", date: "2026-06", what: "Logistics pricing matrix. Closed 2026-08-07.", state: "legacy", supersededBy: "EAINT-12119" },
        { key: "EAINT-12378", date: "2026-09", what: "Include the RHB 'RE' error code in the Wholesale Logistics Full Payment flow. To Do.", state: "latest" },
        { key: "EAINT-12280", date: "2026-09", what: "Costing calculator updated to pricing effective 1 Oct.", state: "latest" },
      ],
      openQuestions: [
        "Whether Wholesale STMS already covers the RHB 'RE' error code (EAINT-12378).",
        "eMOVE is not found anywhere in eauto prod code (0e21bef3db, 2026-10-22). Confirm that EAINT-12019 is simply not deployed yet.",
      ],
    },

    // ---------------------------------------------------------------- 4. Hybrid Assist
    {
      id: "chatbot-hybrid-assist",
      name: "Chatbot: Hybrid Assist and /help",
      summary: "A dealer types /help to reach a person. BO staff can take over a chat and give it back to the AI.",
      portals: ["WhatsApp chatbot", "Wholesale Back Office"],
      triggers: [
        {
          id: "help-command",
          name: "Dealer types /help",
          entry: "WhatsApp chatbot: /help",
          sources: [jira("EAINT-12109 comment", "2026-08-17")],
          steps: [
            S("Request goes to Ops", [jira("EAINT-12109 comment 2026-08-17")], { detail: "/help is ON by default (amended 2026-08-17). Ops can switch it off in Settings. An approval request with Approve and Reject buttons is used during a takeover. 'Mark help request handled' is a later separate CR." }),
          ],
        },
        {
          id: "bo-take-over",
          name: "BO clicks Take over",
          entry: "Wholesale Back Office › Chat History › Take over",
          sources: [jira("EAINT-11870 description")],
          steps: [
            S("AI stops and the BO user chats", [jira("EAINT-11870 description")], { detail: "The view is WhatsApp-like. AI messages stop until the BO user releases the chat." }),
            S("Auto-close after 3 minutes", [jira("EAINT-11870 description")], { detail: "If no UCD reply for 3 minutes, the live-agent session closes and the AI resumes." }),
          ],
        },
      ],
      affects: [F("Wholesale BO Chat History, Ops notifications, Help Usage dashboard (EAINT-12174, duplicate).", [jira("EAINT-12109 links")])],
      cronjobs: [],
      roles: [F("Dealers (UCD), BO users and Ops.", [jira("EAINT-11870 description")])],
      afterCompletion: [F("Messaging only; nothing is created.", [jira("EAINT-11870 description")])],
      rules: [
        F("/help is ON by default (version 5 of the SRD and later).", [jira("EAINT-12109 comment", "2026-08-17")], {
          alt: [{ text: "SRD versions v1 to v4 said /help is OFF by default.", sources: [jira("EAINT-12109 description")], note: "v5+ is the latest." }],
        }),
        F("Takeover auto-closes after 3 minutes without a UCD reply.", [jira("EAINT-11870 description")]),
        F("Not related or not meaningful messages and mid-flow resend after 3 minutes have their own handling.", [jira("EAINT-11866, EAINT-11888 summaries")]),
      ],
      scopeToCheck: [
        F("Check takeover start, stop and the 3-minute auto-close.", [jira("EAINT-11870")]),
        F("Check /help on and off, and the Approve and Reject buttons.", [jira("EAINT-12109")]),
        F("Check chat history indicates the Main User chat (EAINT-12003, To Do).", [jira("EAINT-12003")]),
      ],
      tickets: [
        { key: "EAINT-11870", date: "2026-07", what: "Hybrid Assist (internal reach out to UCD). Done 2026-08-12.", state: "latest" },
        { key: "EAINT-12109", date: "2026-07", what: "/help for dealers. SRD v6.1, 24 open questions. Done 2026-09-08.", state: "latest" },
        { key: "EAINT-11866", date: "2026-07", what: "Not related or not meaningful response.", state: "latest" },
        { key: "EAINT-11888", date: "2026-07", what: "Mid-flow handling on resend after 3 minutes.", state: "latest" },
        { key: "EAINT-12003", date: "2026-07", what: "Chat history to show Main User chat. To Do.", state: "latest" },
        { key: "EAINT-12174", what: "Help Usage dashboard (duplicate).", state: "legacy" },
      ],
      openQuestions: ["The 'mark help request handled' CR (SRD v6.1) has 24 open questions."],
    },

    // ---------------------------------------------------------------- 5. Payment: APT check, deposit discount
    {
      id: "payment-apt-deposit",
      name: "Wholesale payment: APT check and Deposit Discount",
      summary: "The payment portal checks APT with JPJ before the seller pays, and Admin can set a discount on the processing fee.",
      portals: ["Wholesale payment portal", "Wholesale Back Office"],
      triggers: [
        {
          id: "seller-pay",
          name: "Seller opens the payment dashboard or clicks Pay",
          entry: "Wholesale payment portal /vehicle-checks and the Pay button",
          sources: [jira("EAINT-12561 description", "2026-10-19")],
          steps: [
            S("Dashboard reuses the APT check of today", [jira("EAINT-12561 description")], {
              detail: "APT check = one JPJ STMS enquiry. If already checked today (Malaysia time), the saved APT fee and tax are used (column py_deal.apt_checked_at). JPJ APT status changes once a day.",
              affects: ["APT", "JPJ"],
            }),
            S("Pay re-checks before money moves", [jira("EAINT-12561 description")], {
              branches: [
                { when: "The price changed", then: "Message 'The price has changed. Please check the new total and pay again.'" },
                { when: "The check fails", then: "Message 'APT check is temporarily unavailable.'" },
              ],
              detail: "APT is priced from the eAuto TransferCost table (usage code, vehicle type, company state). The JPJ enquiry only decides if APT is needed (code 4Z). eAuto APT is called through pay.do.",
            }),
          ],
        },
        {
          id: "admin-discount",
          name: "Admin sets a discount",
          entry: "Wholesale Back Office › Settings › Deposit Discount",
          sources: [jira("EAINT-12462 description", "2026-10")],
          steps: [
            S("Create a discount on the RM 500 processing fee", [jira("EAINT-12462 description")], {
              detail: "Buyer and seller separately, percent or fixed, with start and end dates. SST is on the discounted fee. A RM 0 fee needs only 'Proceed Booking', with no transfer. A history page exists. Admin and BO only, not OPS.",
              affects: ["eAuto (receives the discounted fee, may be RM 0; no eAuto change)"],
            }),
          ],
        },
      ],
      affects: [F("eAuto APT via pay.do. The fee eAuto charged is not returned to Wholesale.", [jira("EAINT-12562 description")])],
      cronjobs: [],
      roles: [F("Seller (payment). Admin and Back Office users for the discount page.", [jira("EAINT-12462 description")])],
      afterCompletion: [F("eAuto APT transaction is created through pay.do.", [jira("EAINT-12562 description")])],
      rules: [
        F("APT status at JPJ changes once a day.", [jira("EAINT-12561 description")]),
        F("Prod code: no APT code and no deposit-discount code exists in the eauto wholesale package. The APT check and the discount live in the separate wholesale payment portal.", [ask("repo search: APT in wholesale files, depositDiscount")], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check no JPJ enquiry on every dashboard load, and the re-check at Pay.", [jira("EAINT-12561")]),
        F("Check the price-changed and APT-unavailable messages.", [jira("EAINT-12561")]),
        F("Check discount buyer and seller, percent and fixed, dates, SST, RM 0 fee and history.", [jira("EAINT-12462")]),
      ],
      tickets: [
        { key: "EAINT-12561", date: "2026-10", what: "APT check caching and re-check before pay. Done.", state: "latest" },
        { key: "EAINT-12562", date: "2026-10", what: "APT pay flow open questions from the 2026-10-20 review. To Do.", state: "latest" },
        { key: "EAINT-12462", date: "2026-10", what: "Deposit Discount on buyer and seller processing fee. Done 2026-10-16.", state: "latest" },
        { key: "EAINT-11855", what: "APT auto reset on RHB RE (pass 1).", state: "legacy", supersededBy: "EAINT-12378" },
      ],
      openQuestions: [
        "EAINT-12562: the seller can be charged an APT amount that the page never showed.",
        "Deposit Discount is not found in eauto prod code. Confirm it lives only in the wholesale payment portal.",
        "Wholesale never learns the amount eAuto charged (pay.do returns none).",
      ],
    },

    // ---------------------------------------------------------------- 6. BO Wholesale menu
    {
      id: "bo-marketing-and-listings",
      name: "Wholesale Back Office: Marketing tab and listings",
      summary: "Back Office staff see the vehicles the bot marketed, can re-fire a message, and manage Wholesale companies, listings and alternative vehicles.",
      portals: ["Wholesale Back Office"],
      triggers: [
        {
          id: "bo-wholesale-menu",
          name: "BO menu: Wholesale category",
          entry: "BO › Wholesale: Manage Wholesale Company Account, Wholesale Transaction / Refund / Vehicle Payment / Rejection / Payment Listing, Alternative Vehicle Maintenance",
          sources: [mine("knowledge/flow-bo-shell.md §3.12")],
          steps: [
            S("Open a listing", [mine("knowledge/flow-bo-shell.md §3.12")], { detail: "Search by company ID, company name and more is asked in EAINT-12285 (To Do)." }),
            S("Maintain alternative vehicles", [ts("EAINT-11860, EAINT-11862")], { where: "BO › Alternative Vehicle Maintenance", detail: "Search, filter, add, edit and cancel, with an audit log that has date caps." }),
          ],
        },
        {
          id: "marketing-tab",
          name: "BO Marketing tab",
          entry: "Wholesale BO (stage-ws.eauto.my/bo) › Marketing tab",
          sources: [ts("EAINT-11999 TCF-01")],
          steps: [
            S("Open the tab", [ts("EAINT-11999 TCF-01"), mine("knowledge/business-rules-from-test-scenarios.md §19 item 3")], { detail: "Default 20 rows per page (504 vehicles in the capture), sort 'Latest activity', Date From = today - 30. Empty state: 'No marketed vehicles match these filters.'" }),
            S("Filter", [ts("EAINT-11999 TCF-01-TCF-25, TCM-P/S/E")], { detail: "Flow (profiling, sourcing, estm_restock), Outcome (sent, capped, skipped_dedup, suppressed_no_stock, deal, skipped_undeliverable, failed), Status (ACTIVE, pending statuses, COMPLETED, CANCELLED), vehicle number, dates, sort, 50/100/200 rows. Filters persist across pages." }),
            S("Re-fire a message", [ts("EAINT-11999 TCF-10")], { where: "Re-fire button", detail: "Enabled for every ACTIVE vehicle." }),
          ],
        },
        {
          id: "estm-optin",
          name: "BO manages eSTM recommendation opt-in and out",
          entry: "eAuto BackOffice › manage eSTM recommendation message opt-in or opt-out for a UCD",
          sources: [jira("EAINT-11997 summary", "2026-08-15")],
          steps: [S("Opt a UCD in or out", [jira("EAINT-11997 summary")], { detail: "Status Ready in 1st Env on 2026-08-15." })],
        },
      ],
      affects: [F("Reach stats: not-delivered breakdown, led to deal.", [ts("EAINT-11999 TCS-02, TCS-04")])],
      cronjobs: [],
      roles: [F("BO admin and ops.", [ts("EAINT-11999")])],
      afterCompletion: [F("Read and re-fire only.", [ts("EAINT-11999")])],
      rules: [
        F("Capped means more matches than slots. A shared phone number gives skipped_dedup. A busy dealer gets a deferred send. A closed 24-hour window gives skipped_undeliverable. No stock gives suppressed_no_stock.", [ts("EAINT-11999 TCF-09, TCM-P3, P5, P7, E1, E5")]),
      ],
      scopeToCheck: [
        F("Check single and combined filters, sort, paging and stats cross-checks.", [ts("EAINT-11999")]),
        F("Check outcomes per flow.", [ts("EAINT-11999")]),
        F("Check Alternative Vehicle Maintenance: search, filter, add, edit, cancel, audit log date caps, multi-account and two-tab.", [ts("EAINT-11860, EAINT-11862")]),
        F("In production regression, go only up to the payment page and never press Confirm Refire.", [mine("knowledge/production-regression-scope.md")]),
      ],
      tickets: [
        { key: "EAINT-11999", date: "2026-07", what: "New Marketing module: manual fire and summary. Done 2026-08-13.", state: "latest" },
        { key: "EAINT-11860", what: "Alternative Vehicle Maintenance.", state: "latest" },
        { key: "EAINT-11862", what: "Alternative Vehicle Maintenance audit log.", state: "latest" },
        { key: "EAINT-11997", date: "2026-07", what: "BO manages eSTM recommendation opt-in and out.", state: "latest" },
        { key: "EAINT-11998", date: "2026-07", what: "Template recommendation after listing.", state: "latest" },
        { key: "EAINT-12285", date: "2026-09", what: "Search listings by company ID and name. To Do.", state: "latest" },
        { key: "EAINT-12133", date: "2026-08", what: "Data export to identify Main and Sub User in the Wholesale beta phase. Done.", state: "latest" },
      ],
      openQuestions: ["TCM-S4 and TCM-S6 are recorded as FINDINGs in the workbook."],
    },

    // ---------------------------------------------------------------- 7. JomCheck price and reference number
    {
      id: "jomcheck-price-and-reference",
      name: "JomCheck add-on price and STMS Reference No",
      summary: "The JomCheck price in the chatbot, FAQ and payment page must match. The Wholesale STMS Reference No must never repeat or go backwards.",
      portals: ["WhatsApp chatbot", "Wholesale payment portal", "UCD portal (Wholesale STMS)"],
      triggers: [
        {
          id: "chatbot-price",
          name: "Chatbot price question or match card, then payment page",
          entry: "WhatsApp chatbot › price question, FAQ or match card › payment page",
          sources: [ts("14th Sep TC-01 (12279)"), jira("EAINT-12198 comment", "2026-08-18")],
          steps: [
            S("Check the quote against the payment page", [ts("14th Sep TC-03, TC-08 (12279)")], { detail: "JomCheck RM20 excl. SST must read the same in the chatbot quote, the FAQ knowledge-base entry (set in BO) and the payment page, and in the e-Invoice. The quote is an operator setting (PR #2307)." }),
            S("JomCheck add-on availability", [jira("EAINT-12198 comment 2026-08-18")], { detail: "Available in every deal state except for a locked-out buyer (option hidden, no message). A cancelled-order buyer keeps JomCheck. State table JC-01 to JC-12 in SRD v0.3." }),
          ],
        },
        {
          id: "wholesale-stms-ref",
          name: "UCD creates a Wholesale STMS transaction",
          entry: "UCD › Wholesale STMS transaction creation",
          sources: [ts("14th Sep TC-01 (12042)")],
          steps: [S("Seller, buyer and refund legs each get a Reference No", [ts("14th Sep TC-01 (12042)")], { detail: "The buyer sources a vehicle and pays the processing fee, then the transaction is created. The legs share one number pool; each keeps its own prefix." })],
        },
      ],
      affects: [F("Chatbot answer, FAQ knowledge base entry in BO, payment page and e-Invoice.", [ts("14th Sep TC-03, TC-08 (12279)")])],
      cronjobs: [],
      roles: [F("Wholesale buyer and seller dealers.", [ts("14th Sep")])],
      afterCompletion: [F("Wholesale STMS list and e-Invoice.", [ts("14th Sep")])],
      rules: [
        F("JomCheck price is RM20 excl. SST in the chatbot and payment portal. Reports bought before the change keep RM18.", [jira("EAINT-12279 summary", "2026-09-15"), mine("knowledge/business-rules-from-test-scenarios.md §19")], {
          alt: [{ text: "JomCheck price RM18 (before EAINT-12279).", sources: [jira("EAINT-12279 summary")], note: "Older; RM20 is newer." }, { text: "On SIT2 the UI shows RM18 while the e-Invoice says RM20, because the database is shared. Test on UAT3.", sources: [ts("14th Sep")], note: "Environment trap." }],
        }),
        F("Reference No never repeats and never goes backwards. Gaps inside a leg are expected. Prefix and length are unchanged. Existing transactions are untouched.", [ts("14th Sep"), ts("EAINT-12042 TS #001")]),
      ],
      scopeToCheck: [
        F("Check every price surface: chatbot answer, FAQ, payment page and e-Invoice.", [ts("14th Sep")]),
        F("Check the stale-price fallback and concurrent submit.", [ts("14th Sep")]),
        F("Check Reference No uniqueness across seller, buyer and refund legs.", [ts("EAINT-12042")]),
      ],
      tickets: [
        { key: "EAINT-12279", date: "2026-09", what: "Chatbot and payment portal JomCheck price RM18 to RM20. Done 2026-09-15.", state: "latest" },
        { key: "EAINT-12198", date: "2026-08", what: "JomCheck on the payment page in every deal state. Done 2026-09-08.", state: "latest" },
        { key: "EAINT-12042", date: "2026-07", what: "Wholesale STMS Reference No generation hardened. Done 2026-09-15.", state: "latest" },
      ],
      openQuestions: ["TC-10 and TC-11 are marked 'needs dev input' in the 14th Sep regression sheet."],
    },
  ],
};
