# Wholesale 2.0 (chatbot, logistics, eMOVE, payment) (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/wholesale.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- Wholesale lets used-car dealers list, find, negotiate, pay for and move cars through a WhatsApp chatbot. The UCD portal holds the Wholesale STMS and the Wholesale Transaction Listing. The Back Office has its own Wholesale menu. eAuto Digits Sdn Bhd is the middle party in the ownership transfer. IMPORTANT: Wholesale chatbot flows are chatbot-driven and are tested manually only. They are not an automation gap. Official TS is the workbook 'eAuto_Wholesale_Test_Scenarios_COMPLETE_v3.xlsx' (May 2026, v3.0 final, sheets added to July 2026).
- Portals: WhatsApp chatbot, UCD portal (Wholesale tile and Wholesale STMS), Wholesale Back Office, Wholesale payment portal, Logistics (QR scan)
- Related modules: jomcheck, stms, apt, estm, backoffice, payments-fees
- Detailed draft flow for eMOVE standalone logistics (EAINT-12019): knowledge/flow-emove.md (added 2026-10-26)

## Glossary
- eAuto Digits: eAuto Digits Sdn Bhd. Receives the car from the seller by thumbprint transfer, then transfers ownership to the buyer. [ts: EAINT-11731 LGF_TS1]
- Processing Fee: Fee paid by the buyer and by the seller to book a deal (RM 500 before any Deposit Discount). The JomCheck price is included in the processing fee. [jira: EAINT-12462 description 2026-10] [ts: REQ_TS11]
- Decision Maker: UCD role that gives the second approval of a full payment (after the WhatsApp approval). [ts: 10 June 2026 Scope REQ_TS17, REQ_TS37]
- Hybrid Assist: BO staff take over a chatbot conversation with a dealer. AI messages stop until released. [jira: EAINT-11870 description]
- eMOVE: Standalone logistics service in the UCD portal, for moving a car after a UCD to UCD interstate transfer or an approved eSTM. [jira: EAINT-12019 description]
- Delivery Order (DO): Document with a number starting WSS (seller copy) or WSB (buyer copy), made when ownership moves to the buyer. [ts: EM_DN_TS1-TS20]
- Re-fire: BO Marketing tab button that resends the marketing message for an ACTIVE vehicle. Never press Confirm Refire in production regression. [ts: EAINT-11999 TCF-10] [mine: knowledge/production-regression-scope.md]
- Bot v2 / v2.1: Newer versions of the chatbot (v2 SRD Done; v2.1 To Do). [jira: EAINT-12200, EAINT-12304, EAINT-12293]

## Flow: Wholesale deal: list, search, offer, pay, transfer ownership, deliver
- A seller lists a car by WhatsApp. A buyer finds it, makes an offer (up to 3 rounds), and both pay a processing fee. The buyer then pays in full, the seller transfers the car to eAuto Digits, and logistics deliver it.
- Portals: WhatsApp chatbot, UCD portal, Wholesale Back Office, Wholesale payment portal

### Entry points and steps
- Entry point "Seller WhatsApp commands": WhatsApp chatbot: 'Show my listing', 'I want sell Car', 'I want withdrawal car from listing', 'I want to change price' [ts: Wholesale v3 VL-TC-001, AL-TC-001, WD-TC-001, CP-TC-001]
  1. Seller lists a car with plate, photos and details | where: WhatsApp chatbot | Listing goes through pending statuses (NEW, PENDING_PHOTO, PENDING_PRICE, PENDING_MILEAGE and combinations, PENDING_VEHICLE_INFO, PENDING_CONFIRMATION) until ACTIVE. [ts: Wholesale v3 AL-TC-001] [ts: EAINT-11890 TC-01-TC-23]
     - If Car is not found -> Seller must complete the STMS first, then resend.
     - If Seller withdraws after a buyer paid -> Blocked: 'has an active payment. Escalate to support.'
  2. Seller views, changes price or withdraws | Chatbot commands for the seller's own listing. [ts: Wholesale v3 VL-TC-001, CP-TC-001, WD-TC-001]
- Entry point "Seller sends photos with a plate (list by photo)": WhatsApp chatbot: seller sends photos without text [jira: EAINT-12224 description 2026-08-21] [jira: EAINT-11890 description 2026-07]
  - Newer rule: the bot reads the plate from the photos first.
  1. Bot reads the plate, picks the car and attaches the photos | It attaches to the seller's pending listing or asks. The seller can correct a wrong read. [jira: EAINT-12224 description]
     - If Plate read is wrong -> Seller corrects it in the chat.
  - Photo caps: 10 per listing and 50 per user per day (staging). Wrong-car photos are rejected and not counted. PDF photos use the first 10 images. Photo URLs must not expose the UCD phone number. [ts: EAINT-11885, EAINT-11857, EAINT-11876 TS1-TS4]
- Entry point "Buyer WhatsApp: search, offer, book": WhatsApp chatbot: 'I want buy myvi 2000-2026', 'make an offer RM33,000 for DDM1847', booking link and payment [ts: Wholesale v3 BS-TC-001, BE-TC-001, BP-TC-001]
  1. Buyer searches and makes an offer | Up to 3 negotiation rounds. The final negotiated price is locked and shown in WhatsApp. [ts: Wholesale v3 BS-TC-001, BE-TC-001]
  2. Match card with the booking link | The match card carries the line 'Book here or purchase JomCheck report' that opens the payment page. [mine: knowledge/flow-jomcheck.md §2 2026-09-30]
  3. Buyer pays the processing fee, then seller pays the processing fee | where: Wholesale payment portal | affects: RHB payment; Reconciliation; Consolidated e-Invoice [ts: NEG-TC-001, REQ_TS35, CANCEL_TS1-TS4]
     - If Seller does not pay within 20 minutes -> Deal is auto-cancelled; seller cannot relist; buyer is refunded.
- Entry point "UCD homepage: WHOLESALE": UCD Homepage › WHOLESALE › landing with [Wholesale Transaction Listing] and [Wholesale Permission] [ts: EAINT-11872 11872_TS_WM_001-003] [jira: EAINT-10481 summary 2026-10-05]
  1. Seller creates the Wholesale STMS | where: UCD › Wholesale › Wholesale Transaction Listing | Seller gets the email '[Wholesale] Action required – create transaction for {vehicle number}'. Seller does a thumbprint transfer to eAuto Digits. The JPJ enquiry XML at Pay Now carries seller and eAuto Digits details. | affects: STMS (Wholesale STMS); JPJ [ts: EAINT-11731 EM_SELL_TS1; LGF_TS1]
  2. eAuto Digits accepts and transfers to the buyer | Buyer first makes the full payment. It needs 2 approvals: WhatsApp approval, then full-payment approval by the Decision Maker or Main User. Delivery Order is made and an email goes to logistics. [ts: EAINT-11731 EM_LOGISTICS_TS1, LGF_TS1]
  3. Logistics deliver and buyer accepts | Logistics scan the Seller QR and Dispatch Note QR, enter the vehicle number and upload 12 photos → 'Delivery Arranged'. They scan the Buyer QR and Delivery Order QR, enter the vehicle number and upload 12 photos → 'Delivered'. Buyer accepts the eAuto Digits transfer → Tx Status 'Completed'. [ts: EAINT-11731 LGF_TS1]
     - If Buyer rejects after delivery -> BO approves or cancels the rejection (Delist and Refund options).
- Entry point "STMS or eSTM approval triggers a recommendation message": A UCD STMS or eSTM becomes Approved [ts: EAINT-11987 TS_STMS_MR_001-009; EAINT-11872 TS_MR_*]
  1. System sends a WhatsApp recommendation message to the right users | Only the Main User manages. The Main User always gets the STMS message. A Sub User gets it only if listed and ticked 'Receive'. A Decision Maker gets only Payment Approval unless also a Main or Sub UCD with Wholesale permission. Non-beta companies are not auto-enrolled. | affects: STMS; eSTM [ts: EAINT-11987 TS_STMS_MR_001-009]
  - EAINT-12324: UCD to UCD transfers are excluded from the STMS_APPROVED stock notification. [jira: EAINT-12324 summary 2026-10-05]

### Cross-module effects (what it affects)
- Wholesale Transaction Listing (UCD and BO); BO Refund, Vehicle Payment, Rejection and Payment listings. [ts: REQ_TS11, TS15, TS22, TS24, TS25, TS28-TS32]
- Reconciliation, consolidated e-Invoice and its resubmission, RHB payment. [ts: REQ_TS11-TS32]
- An eSTM for the same plate is blocked once the processing fees are paid. [ts: Wholesale v3 REQ_TS]
- [unconfirmed] Wholesale STMS shows a revised RM27 charge. [mine: knowledge/business-rules-from-test-scenarios.md §19]

### Cronjobs
- Daily pending seller thumbprint email | 8 AM (DCJ_TS1) | Finds Transfer Ownership transactions where the buyer paid in full but the seller has not done the thumbprint. Sends an email to operation@eauto.my '[Wholesale] Pending seller thumbprint – {date}'. No email if none. A failed run is logged. [ts: EAINT-11731 DCJ_TS1-TS3]
- Auto-cancel unpaid seller fee | 20 minutes after the buyer's processing fee | If the buyer paid and the seller did not pay within 20 minutes, the deal is auto-cancelled, the seller cannot relist and the buyer is refunded. [ts: Cancel Transaction CANCEL_TS21]

### Roles
- Seller, Buyer (mode is enforced), Main User, Sub User, Decision Maker, Logistic (QR scan), eAuto Digits, BO admin and ops, IT team (failure alert emails), Finance (manual invoice). [ts: SEC-TC-001; EAINT-11987; REQ_TS18]
- Dealers reach it by WhatsApp bot. BO Ops handle the rest. [mine: knowledge/business-rules-from-test-scenarios.md §19]

### Where the transaction goes
- Wholesale Transaction Listing status Completed. Logistic status Delivered. [ts: LGF_TS1]
- A refund after full payment is handled manually by the operation team. [ts: CANCEL_TS5]

### Rules
- Multiple STMS are sent to all UCD users. One user editing locks it. Cancelling unlocks the vehicle. [ts: REQ_TS1, TS2]
- Direct URL access to STMS steps is blocked before the payment and delivery stages. [ts: REQ_TS27]
- A failed payment sets Payment Details = Failed (and Logistic = Failed for the seller fee and total payment). [ts: FAILED_PY_TS1-TS5]
- The seller email is sent once even with two tabs, and not on payment failure. [ts: EM_SELL_TS2-TS3]
- Delivery Order number starts with WSS plus 8 digits. Date shows as 'DD Mmmm YYYY'. Lorry number is blank. Service type is Door-to-Door or Hub-to-Hub. The 12-item photo checklist is unticked. [ts: EM_DN_TS1-TS20]
- Attachments are 'Delivery Order Seller Copy (WSS).pdf' and 'Delivery Order Buyer Copy (WSB).pdf'. Logistics email goes to wholesale@eauto.my. [ts: EM_LOGISTICS_TS1-TS2]
- Logistic v1 is removed. Old QR buttons are absent in BO. E2E only needs QR validation from the Delivery Order email. [ts: EAINT-11949] [mine: knowledge/business-rules-from-test-scenarios.md §19 item 4]
- The daily pending-thumbprint email runs at 8 AM. [ts: EAINT-11731 DCJ_TS1]
  - Conflict: other version: Remarks in the same sheet cite 1 PM and 2 PM runs on 8 July 2026 in staging. [ts: EAINT-11731 DCJ_TS1 remarks] (Schedule is unclear.)

### QA scope to check
- Check seller commands (view, add, withdraw, change price): happy, negative, edge. [ts: Wholesale v3 scope]
- Check buyer search, enquiry, offer, negotiation, booking and pay. [ts: Wholesale v3 scope]
- Check cross-role edge cases. Orange CRITICAL rows must pass before go-live. [ts: Wholesale v3 scope]
- Check race conditions and a dealer with many Sub Users. [ts: Wholesale v3 scope]
- Check search and recommendation matching, and security and role access. [ts: Wholesale v3 scope]
- Check plate-photo detection: listed, available, not found, blurry, skewed, partial, multi-plate, screenshot, non-image. [ts: EAINT-11890 TC-01-TC-23]
- Check photo and PDF caps. [ts: EAINT-11885, EAINT-11857]
- Check STMS and eSTM recommendation message routing by role. [ts: EAINT-11987]
- Check the daily cron email, seller and logistics emails, dispatch note fields. [ts: EAINT-11731]
- Check the logistics scan flow, including a wrong vehicle number and upload failure. [ts: EAINT-11731 LGF_TS1]
- Check e-Invoice, reconciliation, and listing search and filter. [ts: Wholesale v3 scope]

### Ticket history
- EAINT-11851: Wholesale 2.0 epic. [latest]
- EAINT-11731 (2026-06): New logistics flow with Delivery Orders (SRD v1.3 2026-07-06), cron and emails. Done. [latest]
- EAINT-11890 (2026-07): List vehicle by uploading a photo with the plate. [legacy, superseded by EAINT-12224]
- EAINT-12224 (2026-08): Photo listing reads the plate first; seller can correct. SRD v0.1 2026-08-21. [latest]
- EAINT-11872 (2026-07): Landing and permission page; eSTM recommendation message. [latest]
- EAINT-11987 (2026-07): STMS Listing message enhancement. [latest]
- EAINT-11885: Photo and PDF caps. [latest]
- EAINT-11877: Chatbot only proceeds with checks before payment. [latest]
- EAINT-11876: Photo URLs must not expose the UCD phone number. [latest]
- EAINT-11857: Photo and PDF handling. [latest]
- EAINT-11949 (2026-07): Remove logistic v1 flow and security fixes. [latest]
- EAINT-10481 (2026-04): UCD portal Wholesale module. Done 2026-10-05. [latest]
- EAINT-12000 (2026-07): New market flow: listing and sourcing extension. [latest]
- EAINT-12324 (2026-09): Exclude UCD to UCD from the STMS_APPROVED stock notification. [latest]
- EAINT-11884 (2026-07): RHB implementation for eAuto Digits Sdn Bhd. To Do (RHB spec v1.2 2026-10-06). [latest]
- EAINT-12304 (2026-09): Bot v2.1. To Do. [latest]
- EAINT-12293 (2026-09): v2.1 bot. To Do. [latest]
- EAINT-12200 (2026-08): Bot v2 SRD. Done. [latest]
- EAINT-12001 (2026-07): UCD lists a non-inventory car: bot needs the correct reply. To Do. [latest]
- EAINT-12002 (2026-07): Enroll all Sub Users for beta UCD. To Do. [latest]

### Open questions
- REQ_TS12 car masking is On Hold. REQ_TS14 eAuto Digits return to the seller: 'Requirements not confirmed'. REQ_TS18 Wholesale document buttons On Hold. REQ_TS29 refund function not available.
- How a Wholesale-bought JomCheck report is downloaded, and whether Wholesale reads the v2.0 API fields, is not in the SRD.
- Id mismatch: sheet 11876_TS1 inside the EAINT-11877 workbook.

## Flow: Cancel, reject and refund a Wholesale deal
- Who can cancel, at which stage, and what happens to the vehicle listing and the money.
- Portals: WhatsApp chatbot, UCD portal, Wholesale Back Office

### Entry points and steps
- Entry point "Buyer or seller cancels": UCD Wholesale Transaction Listing (cancel) or WhatsApp [ts: Cancel Transaction CANCEL_TS1-TS20]
  1. Cancel before any payment | Buyer cancel before any payment: the listing goes back to ACTIVE, no refund. [ts: CANCEL_TS1-TS4]
  2. Seller cancels after the buyer paid | Car is blacklisted and not relistable. Buyer is refunded. [ts: CANCEL_TS1-TS20]
  3. After full payment | The UCD cancel button is disabled. A refund is manual. Cancel through WhatsApp is not possible after payment. [ts: CANCEL_TS5] [ts: CANCEL_TS1-TS20]
- Entry point "BO approves or cancels a rejection / cancels a deal": Wholesale Back Office › Wholesale Rejection Listing / Refund Listing [ts: REQ_TS13; CANCEL_TS19-TS20] [mine: knowledge/flow-bo-shell.md §3.12]
  1. BO decides on a buyer rejection after delivery | BO cancel has Delist yes or no, and Refund buyer, seller, both or none. [ts: REQ_TS13; CANCEL_TS19-TS20]
- Entry point "Auto-cancel when the seller does not pay in 20 minutes": System job after the buyer paid the processing fee [ts: Cancel Transaction CANCEL_TS21]
  1. Deal is cancelled and the buyer is refunded | The seller cannot relist the car. [ts: CANCEL_TS21]

### Cross-module effects (what it affects)
- BO Refund Listing must show 'To Refund' (EAINT-11711). Reconciliation and e-Invoice are affected. [ts: CANCEL_TS2, TS8]

### Cronjobs
- Auto-cancel unpaid seller fee | 20 minutes | Cancels the deal and refunds the buyer. [ts: CANCEL_TS21]

### Roles
- Buyer, seller, BO admin and ops. Operation team handles manual refunds. [ts: CANCEL_TS5, TS19-TS20]

### Where the transaction goes
- Listing is ACTIVE again, blacklisted or delisted, depending on who cancelled and when. Refund goes to buyer, seller, both or none. [ts: CANCEL_TS1-TS20]

### Rules
- The 'Cancellation Revamp' REQ_TS36 and the 8-9 June retests replace earlier cancellation wording. [ts: REQ_TS36]
- Seller cannot withdraw after the buyer paid. [ts: CR-TC-001]

### QA scope to check
- Check cancellation by role, stage and channel (UCD, WhatsApp, BO). [ts: CANCEL_TS1-TS20]
- Check refund and Delist options. [ts: CANCEL_TS19-TS20]
- Check the listing shows 'To Refund' (EAINT-11711). [ts: CANCEL_TS2, TS8]

### Ticket history
- EAINT-11711: Listing must show 'To Refund'. Retest FAILED 8-9 June. [latest]

### Open questions
- CANCEL_TS2 and TS8 retest FAILED on 8-9 June (EAINT-11711).

## Flow: Logistics (delivery) and standalone eMOVE
- Wholesale deals are delivered with a Delivery Order. eMOVE offers the same delivery as a standalone service for any UCD.
- Portals: UCD portal, Wholesale Back Office, Logistics QR scan

### Entry points and steps
- Entry point "Wholesale buy or sell confirmed": After the buyer's full payment in a Wholesale deal [jira: EAINT-12019 description row 4] [ts: EAINT-11731 LGF_TS1]
  1. Delivery Orders are made and logistics are emailed | SRD v1.3 (2026-07-06). Photos show in Back Office only. DO issue date confirmed 23.06.2026. [jira: EAINT-11731 SRD rows 5-6] [ts: EAINT-11731 EM_LOGISTICS_TS1]
  2. Fee is worked out from the matrix | Hub-to-Hub = Door-to-Door + RM200. Klang Valley hub to Seremban 250, Melaka 300, Kulai / Johor Bahru / Muar 400, Batu Pahat / Kluang 450, Pasir Gudang 500, Segamat 550 (and reverse). Service tax 8%, but the fee is RM0.00 in production until notice. [ts: EAINT-11824 LOG_FEE_TS1-TS11]
- Entry point "eMOVE: standalone logistics in the UCD portal": UCD portal › eMOVE (not under STMS; confirmed 26.08.2026) after a UCD to UCD interstate transfer or an approved eSTM [jira: EAINT-12019 description 2026-10-21]
  1. UCD requests delivery | System arranges the pickup and delivery schedule and charges from the charges matrix. The driver scans a QR code to upload photos and update the status. Invoice and e-Invoice are made after payment. A Finance module handles vendor payment requests. | affects: UCD to UCD; eSTM; Invoice and e-Invoice; Finance vendor payments [jira: EAINT-12019 description row 5]
- Entry point "Interstate price tier": Price shown when the delivery is interstate (Wholesale and standalone) [jira: EAINT-12119 description 2026-09-23]
  1. Price per car by logistics cost tier | Up to 250: base 300. 251-400: base 450. 401-600: base 650. Over 600: base 1,000. [jira: EAINT-12119 description]

### Cross-module effects (what it affects)
- Delivery Orders, invoice and e-Invoice, Finance vendor payments. [jira: EAINT-12019 description]

### Roles
- UCD, driver by QR, Finance. [jira: EAINT-12019 description]

### Where the transaction goes
- Invoice and e-Invoice. Finance vendor payment request. [jira: EAINT-12019 description]

### Rules
- Interstate tiers: 250 → 300, 251-400 → 450, 401-600 → 650, over 600 → 1,000. Applies to Wholesale and standalone (SRD v1.3 2026-09-23). [jira: EAINT-12119 description 2026-09-23]
  - Conflict: other version: Hub-to-Hub = Door-to-Door + RM200 with a fixed per-hub table (EAINT-11824). [ts: EAINT-11824 LOG_FEE_TS1-TS11] (11824 is Closed (2026-08-07) while 12119 relates to it.)

### QA scope to check
- Check dispatch note fields and photo checklist. [ts: EM_DN_TS1-TS20]
- Check scan flow with a wrong vehicle number and with upload failure. [ts: EAINT-11731 LGF_TS1]
- Check the fee table and the interstate tiers. [ts: EAINT-11824] [jira: EAINT-12119]
- Check eMOVE after a UCD to UCD interstate transfer and after an approved eSTM. [jira: EAINT-12019]

### Ticket history
- EAINT-11731 (2026-06): New logistics flow. [latest]
- EAINT-12119 (2026-07): Interstate price tier. Done 2026-10-16. [latest]
- EAINT-12019 (2026-07): eMOVE standalone logistics. Requirement refinement, SRD v0.8 2026-10-21. [latest]
- EAINT-11824 (2026-06): Logistics pricing matrix. Closed 2026-08-07. [legacy, superseded by EAINT-12119]
- EAINT-12378 (2026-09): Include the RHB 'RE' error code in the Wholesale Logistics Full Payment flow. To Do. [latest]
- EAINT-12280 (2026-09): Costing calculator updated to pricing effective 1 Oct. [latest]

### Open questions
- Whether Wholesale STMS already covers the RHB 'RE' error code (EAINT-12378).

## Flow: Chatbot: Hybrid Assist and /help
- A dealer types /help to reach a person. BO staff can take over a chat and give it back to the AI.
- Portals: WhatsApp chatbot, Wholesale Back Office

### Entry points and steps
- Entry point "Dealer types /help": WhatsApp chatbot: /help [jira: EAINT-12109 comment 2026-08-17]
  1. Request goes to Ops | /help is ON by default (amended 2026-08-17). Ops can switch it off in Settings. An approval request with Approve and Reject buttons is used during a takeover. 'Mark help request handled' is a later separate CR. [jira: EAINT-12109 comment 2026-08-17]
- Entry point "BO clicks Take over": Wholesale Back Office › Chat History › Take over [jira: EAINT-11870 description]
  1. AI stops and the BO user chats | The view is WhatsApp-like. AI messages stop until the BO user releases the chat. [jira: EAINT-11870 description]
  2. Auto-close after 3 minutes | If no UCD reply for 3 minutes, the live-agent session closes and the AI resumes. [jira: EAINT-11870 description]

### Cross-module effects (what it affects)
- Wholesale BO Chat History, Ops notifications, Help Usage dashboard (EAINT-12174, duplicate). [jira: EAINT-12109 links]

### Roles
- Dealers (UCD), BO users and Ops. [jira: EAINT-11870 description]

### Where the transaction goes
- Messaging only; nothing is created. [jira: EAINT-11870 description]

### Rules
- /help is ON by default (version 5 of the SRD and later). [jira: EAINT-12109 comment 2026-08-17]
  - Conflict: other version: SRD versions v1 to v4 said /help is OFF by default. [jira: EAINT-12109 description] (v5+ is the latest.)
- Takeover auto-closes after 3 minutes without a UCD reply. [jira: EAINT-11870 description]
- Not related or not meaningful messages and mid-flow resend after 3 minutes have their own handling. [jira: EAINT-11866, EAINT-11888 summaries]

### QA scope to check
- Check takeover start, stop and the 3-minute auto-close. [jira: EAINT-11870]
- Check /help on and off, and the Approve and Reject buttons. [jira: EAINT-12109]
- Check chat history indicates the Main User chat (EAINT-12003, To Do). [jira: EAINT-12003]

### Ticket history
- EAINT-11870 (2026-07): Hybrid Assist (internal reach out to UCD). Done 2026-08-12. [latest]
- EAINT-12109 (2026-07): /help for dealers. SRD v6.1, 24 open questions. Done 2026-09-08. [latest]
- EAINT-11866 (2026-07): Not related or not meaningful response. [latest]
- EAINT-11888 (2026-07): Mid-flow handling on resend after 3 minutes. [latest]
- EAINT-12003 (2026-07): Chat history to show Main User chat. To Do. [latest]
- EAINT-12174: Help Usage dashboard (duplicate). [legacy]

### Open questions
- The 'mark help request handled' CR (SRD v6.1) has 24 open questions.

## Flow: Wholesale payment: APT check and Deposit Discount
- The payment portal checks APT with JPJ before the seller pays, and Admin can set a discount on the processing fee.
- Portals: Wholesale payment portal, Wholesale Back Office

### Entry points and steps
- Entry point "Seller opens the payment dashboard or clicks Pay": Wholesale payment portal /vehicle-checks and the Pay button [jira: EAINT-12561 description 2026-10-19]
  1. Dashboard reuses the APT check of today | APT check = one JPJ STMS enquiry. If already checked today (Malaysia time), the saved APT fee and tax are used (column py_deal.apt_checked_at). JPJ APT status changes once a day. | affects: APT; JPJ [jira: EAINT-12561 description]
  2. Pay re-checks before money moves | APT is priced from the eAuto TransferCost table (usage code, vehicle type, company state). The JPJ enquiry only decides if APT is needed (code 4Z). eAuto APT is called through pay.do. [jira: EAINT-12561 description]
     - If The price changed -> Message 'The price has changed. Please check the new total and pay again.'
     - If The check fails -> Message 'APT check is temporarily unavailable.'
- Entry point "Admin sets a discount": Wholesale Back Office › Settings › Deposit Discount [jira: EAINT-12462 description 2026-10]
  1. Create a discount on the RM 500 processing fee | Buyer and seller separately, percent or fixed, with start and end dates. SST is on the discounted fee. A RM 0 fee needs only 'Proceed Booking', with no transfer. A history page exists. Admin and BO only, not OPS. | affects: eAuto (receives the discounted fee, may be RM 0; no eAuto change) [jira: EAINT-12462 description]

### Cross-module effects (what it affects)
- eAuto APT via pay.do. The fee eAuto charged is not returned to Wholesale. [jira: EAINT-12562 description]

### Roles
- Seller (payment). Admin and Back Office users for the discount page. [jira: EAINT-12462 description]

### Where the transaction goes
- eAuto APT transaction is created through pay.do. [jira: EAINT-12562 description]

### Rules
- APT status at JPJ changes once a day. [jira: EAINT-12561 description]

### QA scope to check
- Check no JPJ enquiry on every dashboard load, and the re-check at Pay. [jira: EAINT-12561]
- Check the price-changed and APT-unavailable messages. [jira: EAINT-12561]
- Check discount buyer and seller, percent and fixed, dates, SST, RM 0 fee and history. [jira: EAINT-12462]

### Ticket history
- EAINT-12561 (2026-10): APT check caching and re-check before pay. Done. [latest]
- EAINT-12562 (2026-10): APT pay flow open questions from the 2026-10-20 review. To Do. [latest]
- EAINT-12462 (2026-10): Deposit Discount on buyer and seller processing fee. Done 2026-10-16. [latest]
- EAINT-11855: APT auto reset on RHB RE (pass 1). [legacy, superseded by EAINT-12378]

### Open questions
- EAINT-12562: the seller can be charged an APT amount that the page never showed.
- Wholesale never learns the amount eAuto charged (pay.do returns none).

## Flow: Wholesale Back Office: Marketing tab and listings
- Back Office staff see the vehicles the bot marketed, can re-fire a message, and manage Wholesale companies, listings and alternative vehicles.
- Portals: Wholesale Back Office

### Entry points and steps
- Entry point "BO menu: Wholesale category": BO › Wholesale: Manage Wholesale Company Account, Wholesale Transaction / Refund / Vehicle Payment / Rejection / Payment Listing, Alternative Vehicle Maintenance [mine: knowledge/flow-bo-shell.md §3.12]
  1. Open a listing | Search by company ID, company name and more is asked in EAINT-12285 (To Do). [mine: knowledge/flow-bo-shell.md §3.12]
  2. Maintain alternative vehicles | where: BO › Alternative Vehicle Maintenance | Search, filter, add, edit and cancel, with an audit log that has date caps. [ts: EAINT-11860, EAINT-11862]
- Entry point "BO Marketing tab": Wholesale BO (stage-ws.eauto.my/bo) › Marketing tab [ts: EAINT-11999 TCF-01]
  1. Open the tab | Default 20 rows per page (504 vehicles in the capture), sort 'Latest activity', Date From = today - 30. Empty state: 'No marketed vehicles match these filters.' [ts: EAINT-11999 TCF-01] [mine: knowledge/business-rules-from-test-scenarios.md §19 item 3]
  2. Filter | Flow (profiling, sourcing, estm_restock), Outcome (sent, capped, skipped_dedup, suppressed_no_stock, deal, skipped_undeliverable, failed), Status (ACTIVE, pending statuses, COMPLETED, CANCELLED), vehicle number, dates, sort, 50/100/200 rows. Filters persist across pages. [ts: EAINT-11999 TCF-01-TCF-25, TCM-P/S/E]
  3. Re-fire a message | where: Re-fire button | Enabled for every ACTIVE vehicle. [ts: EAINT-11999 TCF-10]
- Entry point "BO manages eSTM recommendation opt-in and out": eAuto BackOffice › manage eSTM recommendation message opt-in or opt-out for a UCD [jira: EAINT-11997 summary 2026-08-15]
  1. Opt a UCD in or out | Status Ready in 1st Env on 2026-08-15. [jira: EAINT-11997 summary]

### Cross-module effects (what it affects)
- Reach stats: not-delivered breakdown, led to deal. [ts: EAINT-11999 TCS-02, TCS-04]

### Roles
- BO admin and ops. [ts: EAINT-11999]

### Where the transaction goes
- Read and re-fire only. [ts: EAINT-11999]

### Rules
- Capped means more matches than slots. A shared phone number gives skipped_dedup. A busy dealer gets a deferred send. A closed 24-hour window gives skipped_undeliverable. No stock gives suppressed_no_stock. [ts: EAINT-11999 TCF-09, TCM-P3, P5, P7, E1, E5]

### QA scope to check
- Check single and combined filters, sort, paging and stats cross-checks. [ts: EAINT-11999]
- Check outcomes per flow. [ts: EAINT-11999]
- Check Alternative Vehicle Maintenance: search, filter, add, edit, cancel, audit log date caps, multi-account and two-tab. [ts: EAINT-11860, EAINT-11862]
- In production regression, go only up to the payment page and never press Confirm Refire. [mine: knowledge/production-regression-scope.md]

### Ticket history
- EAINT-11999 (2026-07): New Marketing module: manual fire and summary. Done 2026-08-13. [latest]
- EAINT-11860: Alternative Vehicle Maintenance. [latest]
- EAINT-11862: Alternative Vehicle Maintenance audit log. [latest]
- EAINT-11997 (2026-07): BO manages eSTM recommendation opt-in and out. [latest]
- EAINT-11998 (2026-07): Template recommendation after listing. [latest]
- EAINT-12285 (2026-09): Search listings by company ID and name. To Do. [latest]
- EAINT-12133 (2026-08): Data export to identify Main and Sub User in the Wholesale beta phase. Done. [latest]

### Open questions
- TCM-S4 and TCM-S6 are recorded as FINDINGs in the workbook.

## Flow: JomCheck add-on price and STMS Reference No
- The JomCheck price in the chatbot, FAQ and payment page must match. The Wholesale STMS Reference No must never repeat or go backwards.
- Portals: WhatsApp chatbot, Wholesale payment portal, UCD portal (Wholesale STMS)

### Entry points and steps
- Entry point "Chatbot price question or match card, then payment page": WhatsApp chatbot › price question, FAQ or match card › payment page [ts: 14th Sep TC-01 (12279)] [jira: EAINT-12198 comment 2026-08-18]
  1. Check the quote against the payment page | JomCheck RM20 excl. SST must read the same in the chatbot quote, the FAQ knowledge-base entry (set in BO) and the payment page, and in the e-Invoice. The quote is an operator setting (PR #2307). [ts: 14th Sep TC-03, TC-08 (12279)]
  2. JomCheck add-on availability | Available in every deal state except for a locked-out buyer (option hidden, no message). A cancelled-order buyer keeps JomCheck. State table JC-01 to JC-12 in SRD v0.3. [jira: EAINT-12198 comment 2026-08-18]
- Entry point "UCD creates a Wholesale STMS transaction": UCD › Wholesale STMS transaction creation [ts: 14th Sep TC-01 (12042)]
  1. Seller, buyer and refund legs each get a Reference No | The buyer sources a vehicle and pays the processing fee, then the transaction is created. The legs share one number pool; each keeps its own prefix. [ts: 14th Sep TC-01 (12042)]

### Cross-module effects (what it affects)
- Chatbot answer, FAQ knowledge base entry in BO, payment page and e-Invoice. [ts: 14th Sep TC-03, TC-08 (12279)]

### Roles
- Wholesale buyer and seller dealers. [ts: 14th Sep]

### Where the transaction goes
- Wholesale STMS list and e-Invoice. [ts: 14th Sep]

### Rules
- JomCheck price is RM20 excl. SST in the chatbot and payment portal. Reports bought before the change keep RM18. [jira: EAINT-12279 summary 2026-09-15] [mine: knowledge/business-rules-from-test-scenarios.md §19]
  - Conflict: other version: JomCheck price RM18 (before EAINT-12279). [jira: EAINT-12279 summary] (Older; RM20 is newer.)
  - Conflict: other version: On SIT2 the UI shows RM18 while the e-Invoice says RM20, because the database is shared. Test on UAT3. [ts: 14th Sep] (Environment trap.)
- Reference No never repeats and never goes backwards. Gaps inside a leg are expected. Prefix and length are unchanged. Existing transactions are untouched. [ts: 14th Sep] [ts: EAINT-12042 TS #001]

### QA scope to check
- Check every price surface: chatbot answer, FAQ, payment page and e-Invoice. [ts: 14th Sep]
- Check the stale-price fallback and concurrent submit. [ts: 14th Sep]
- Check Reference No uniqueness across seller, buyer and refund legs. [ts: EAINT-12042]

### Ticket history
- EAINT-12279 (2026-09): Chatbot and payment portal JomCheck price RM18 to RM20. Done 2026-09-15. [latest]
- EAINT-12198 (2026-08): JomCheck on the payment page in every deal state. Done 2026-09-08. [latest]
- EAINT-12042 (2026-07): Wholesale STMS Reference No generation hardened. Done 2026-09-15. [latest]

### Open questions
- TC-10 and TC-11 are marked 'needs dev input' in the 14th Sep regression sheet.
