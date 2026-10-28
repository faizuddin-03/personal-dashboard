import type { Fact, Module, Source, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref: `eauto-qa-azfar:${ref}`, date });
const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: `07-ask-eauto.md ${ref} (prod/master 0e21bef3)`, date: "2026-10-23" });

const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code 0e21bef3db — ${ref}`, date: "2026-10-23" });

const f = (text: string, sources: Source[], extra?: Partial<Fact>): Fact => ({ text, sources, ...extra });
const st = (
  title: string,
  where: string | undefined,
  detail: string | undefined,
  sources: Source[],
  extra?: Partial<Step>,
): Step => ({ title, where, detail, sources, ...extra });

const U = "knowledge/_core/ucd-to-ucd.md";

export const ucdToUcd: Module = {
  id: "ucd-to-ucd",
  name: "UCD to UCD (Standard and Interstate)",
  short: "UCD to UCD",
  portals: ["UCD Portal", "Back Office", "JPJ (external)", "RHB (payment)"],
  summary:
    "An STMS from one dealer (UCD A, the seller) to another dealer (UCD B, the buyer). It shares the STMS steps, fee and listing. Standard is done by UCD B in one session. Interstate is done by each dealer on their own account, and UCD B has 48 hours to accept and pay. No SRD defines this module end to end.",
  related: ["stms", "apt", "payments-fees", "backoffice", "platform"],
  glossary: [
    { term: "UCD A / Seller (Penjual)", meaning: "The dealer giving up the vehicle.", sources: [az(`${U}#Parties`)] },
    { term: "UCD B / Buyer (Pembeli)", meaning: "The dealer receiving the vehicle. Becomes the STMS holder and pays.", sources: [az(`${U}#Parties`)] },
    { term: "UTU / IUTU", meaning: "Internal codes: UTU = UCD to UCD, IUTU = Interstate UCD to UCD. Wholesale uses its own WHOLESALE_UTU* codes.", sources: [az(`${U}#Parties`), jira("EAINT-12324", "2026-10")] },
    { term: "Interstate New", meaning: "Status of an Interstate transaction waiting for UCD B. The 48-hour clock is running.", sources: [az(`${U}#Interstate flow`), ask("Q4 §7")] },
  ],
  flows: [
    // ---------------------------------------------------------------- standard
    {
      id: "standard",
      name: "Standard (both dealers together)",
      summary:
        "UCD B logs in and runs the whole transaction. UCD A's representative gives the Perakuan and thumbprint at Step 1 in the same session. It is a normal STMS tagged as a dealer-to-dealer sale (companyCategory=UTU).",
      portals: ["UCD Portal", "JPJ (external)", "RHB (payment)"],
      triggers: [
        {
          id: "home-tile",
          name: "UCD TO UCD tile, STANDARD button",
          entry: "UCD Home › UCD TO UCD tile (view/ucd/stms/interstate/ucd-view.do) › STANDARD",
          summary: "The tile opens a page with two tiles: STANDARD and INTERSTATE. STANDARD goes straight to Step 1.",
          sources: [az(`${U}#Observed on staging (2026-09-25)`), ask("Q4 §1.1-1.2")],
          steps: [
            st(
              "Choose STANDARD",
              "UCD Home › UCD TO UCD › STANDARD",
              "Page shows price 'RM30* only' (RM35 since 02.10.2026) and user guides. STANDARD cleans the session and goes into the STMS seller-authentication page with companyCategory=UTU. There is no category choice and no Single/Bulk choice yet.",
              [az(`${U}#Observed on staging (2026-09-25)`), ask("Q4 §1.2")],
              {
                branches: [
                  { when: "Company has blockUcdToUcd set in BO", then: "STANDARD is hidden. Only Interstate is offered." },
                  { when: "User lacks 'Selling Vehicle Allowed'", then: "'Access denied'. Cannot create Standard or Interstate." },
                ],
              },
            ),
            st(
              "Step 1 - Seller (Owner)",
              "UCD › UCD to UCD › Step 1",
              "Perakuan 'PERAKUAN UCD TO UCD - PENJUAL' names the logged-in UCD's representative who read it to the seller. Tick it, then MyKad and thumbprint of the seller company's representative. No vehicle field here.",
              [az(`${U}#Standard flow`), az(`${U}#Standard, as walked (buyer = logged-in UCD)`), jira("EAINT-9204", "2026-01")],
              {
                branches: [
                  { when: "The thumbprint person is not a registered user of the seller company typed at Step 2", then: "'Invalid Representative Error: <name> bukan wakil <company>.' (ERR=202, SELLER_NO_USERACCOUNT). Step 3 is not reached. Found on screen, in no SRD." },
                ],
              },
            ),
            st(
              "Step 2 - Vehicle and seller company",
              "UCD › UCD to UCD › Step 2",
              "Type the SELLER company's Company Name and Company Reg No. Fill Contact No, Email, Address. Pick Transaction Type: Single or Bulk. Then Vehicle No, Engine, Chassis, Make/Model, Year. Next (#to-continue-company) and confirm. Usage code AH shows here when JPJ returns it.",
              [az(`${U}#Standard, as walked (buyer = logged-in UCD)`), ts("EAINT-11057 11057_UCD_TS1")],
              {
                branches: [
                  { when: "Sub user has 'Transfer Vehicle To Other Dealer Allowed' off", then: "Blocked at Step 2." },
                  { when: "Transaction Type = Bulk", then: "Page offers 'Download sample for bulk transaction template excel file'." },
                ],
              },
            ),
            st(
              "Step 3 - Buyer (Dealer)",
              "UCD › UCD to UCD › Step 3",
              "Perakuan 'PERAKUAN STMS (UCD to UCD) - PEMBELI'. JPJ receipt email, #buyer-consent, then the logged-in UCD's MyKad and thumbprint. The JPJ receipt goes to UCD B's main-user email and receipt@eauto.my.",
              [az(`${U}#Standard, as walked (buyer = logged-in UCD)`), jira("EAINT-9204", "2026-01")],
            ),
            st(
              "Step 4 - JPJ Check",
              "UCD › UCD to UCD › Step 4",
              "Shows seller rep name, seller company name and reg no, vehicle, the UCD's name and MyKad, and buyer company. Agree text: 'I/We hereby agree to be the interim owner...'. Result fields: Valid As At, Blacklisted, Hak Milik Dituntut, Condition Code, JPJ Enquiry Status, Response Code. Buttons: Save & Continue Later, Make Payment.",
              [az(`${U}#Standard, as walked (buyer = logged-in UCD)`)],
            ),
            st(
              "Step 5 - Payment",
              "UCD › UCD to UCD › Step 5",
              "JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (since 02.10.2026). Shows 'CUSTOMER SUPPORT : 1-700-816-186'. Buttons: Save & Continue Later, STMS Payment. UCD B pays.",
              [az(`${U}#Fee and documents`), jira("EAINT-12403", "2026-10")],
              {
                affects: ["RHB payment", "Payments & Fees"],
                branches: [{ when: "RHB payment fails (IF, insufficient funds)", then: "Tx Failed. UCD sees View | Resubmit. BO sees View | Cancel | Reset." }],
              },
            ),
            st(
              "Step 6 - Transfer",
              "UCD › UCD to UCD › Step 6",
              "'JPJ Transfer Status: OK - SUCCESSFUL', submission date and time, Done. Approved. Seen for Single on 25.09.2026.",
              [az(`${U}#Standard flow`)],
              { affects: ["STMS Transaction Listing (buyer)", "e-Invoice"] },
            ),
          ],
          affects: [
            f("FUTURE: Firefox Browser Reminder popup at Step 5 for UCD to UCD Standard (EAINT-12253, S34.X-20261028).", [az(`${U}#FUTURE — not live yet (20.10.2026)`)], { unconfirmed: true }),
          ],
        },
        {
          id: "resubmit-from-listing",
          name: "Resubmit from STMS Transaction Listing",
          entry: "UCD B › STMS › STMS Transaction Listing › Resubmit",
          summary: "A Standard UCD to UCD transaction shows in the buyer's STMS listing, like a plain STMS.",
          sources: [az("knowledge/_core/stms.md#Entry points"), ts("EAINT-9044")],
          steps: [
            st(
              "Open the buyer's listing",
              "UCD › STMS › STMS Transaction Listing",
              "Seller Name = the seller company. After a BO Reset: Payment '-', Tx Pending, Remarks cleared, View | Resubmit.",
              [az(`${U}#Where the transactions show, by status`)],
            ),
          ],
        },
      ],
      affects: [
        f("Buyer's STMS Transaction Listing: Seller Name = seller company, JPJ Check OK, Payment OK, JPJ Transfer OK, Approved, e-Invoice '-' then OK.", [az(`${U}#Where the transactions show, by status`)]),
        f("BO STMS Transaction: Company Name = buyer, Seller ID = seller company ROC, Method RHB.", [az(`${U}#Where the transactions show, by status`)]),
        f("Invoice and e-Invoice line reads 'Sistem Tukar Milik Sementara (\"STMS\") service charge'. The older 'UCD to UCD (STMS)' label was not seen.", [az(`${U}#Fee and documents`)], {
          alt: [{ text: "Invoice label 'UCD to UCD (STMS)'.", sources: [ts("EAINT-11835 / EAINT-7548 workbooks")], note: "Older workbook wording. Azfar saw the STMS wording on preprod1, 28-29.09.2026." }],
        }),
        f("Slip Pengesahan and e-Invoice. No Transfer History for UCD to UCD. The 7584 list predates 9204 and needs a re-check on screen.", [az(`${U}#Fee and documents`)], { unconfirmed: true }),
        f("After 6 months the vehicle moves to APT for UCD B.", [az(`${U}#Rules that differ from STMS`)]),
        f("No STMS_APPROVED event is sent for UCD to UCD (UTU / IUTU).", [jira("EAINT-12324", "2026-10"), az(`${U}#Rules that differ from STMS`)], { unconfirmed: true }),
        f("Prod code: eauto-report-engine makes the STMS / UCD to UCD payment and tax-invoice PDFs. The transaction is indexed in Elasticsearch with isInterstate and interstateExpiryDate fields. No email, SMS or WhatsApp specific to interstate accept or expiry was found.", [ac("ElasticStmsTransaction, EInvoiceRabbitMQProducer (UCD to UCD question)")]),
        f("Company document upload (4942) and SSM purchase (5155) do not apply to UCD to UCD.", [az(`${U}#Rules that differ from STMS`), jira("EAINT-4942")]),
      ],
      cronjobs: [],
      roles: [
        f("UCD Dealer Portal only. Not Service Portal, not public, not AATF.", [ask("Q4 §4.1")]),
        f("User type needs 'Selling Vehicle Allowed' (UserTypePermission.sellingVehicleAllowed).", [ask("Q4 §4.2")], {
          alt: [{ text: "Sub user flag 'Transfer Vehicle To Other Dealer Allowed' off blocks the seller sub user at Step 2.", sources: [az(`${U}#Rules that differ from STMS`), jira("EAINT-11756", "2026-06")], note: "Screen label per Azfar. Prod code names the flag sellingVehicleAllowed. Likely the same switch, not confirmed." }],
        }),
        f("BO company flag 'Block STMS Category > Limited Features for UCD to UCD' restricts the company. Wholesale's UCD to UCD ignores both blocking flags (EAINT-11756, Done 18.06.2026).", [az(`${U}#Rules that differ from STMS`), jira("EAINT-11756", "2026-06")]),
        f("BO has no UCD to UCD-only screen. BO staff use the STMS transaction screens, Support Tools, Bulk STMS Cancellation and JPJ resubmission.", [ask("Q4 §4.5")]),
      ],
      afterCompletion: [
        f("Approved in UCD B's STMS Transaction Listing and in BO STMS Transaction.", [az(`${U}#Where the transactions show, by status`)]),
        f("An e-Invoice request is queued through RabbitMQ (EInvoiceRabbitMQProducer, source STMS) to eauto-einvoice. Payment goes through RHB Direct Debit.", [ask("Q4 §5.3-5.4")]),
      ],
      rules: [
        f("UCD B (the buyer) pays. The fee is the STMS fee for Standard and Interstate: JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00. Home tile 'RM35', module page 'RM35 only' (hard-coded).", [az(`${U}#Fee and documents`), jira("EAINT-12403", "2026-10")]),
        f("STMS (UCD to UCD) ends 6 months from the first STMS date, then transfers permanently to UCD B.", [az(`${U}#Rules that differ from STMS`), jira("EAINT-9204", "2026-01")]),
        f("Usage code AH shows on Step 2, Step 4 and Transaction Details when JPJ returns it. Hidden otherwise.", [az(`${U}#Rules that differ from STMS`), ts("EAINT-11057 11057_UCD_TS1, TS7, TS8")]),
        f("BackOffice screens show stored amounts only. The BO STMS View page shows no amount. The charged amount is in BO > RHB Payment Transaction.", [az(`${U}#Fee and documents`)]),
      ],
      scopeToCheck: [
        f("Run Standard Single end to end with the seller's representative on a different company.", [az(`${U}#Standard, as walked (buyer = logged-in UCD)`), ts("EAINT-12403 12403_UTU_E2E1")]),
        f("Check the Invalid Representative error when the thumbprint person is not a user of the seller company.", [az(`${U}#Standard, as walked (buyer = logged-in UCD)`)]),
        f("Check Block STMS Category 'Limited Features for UCD to UCD' and the sub user switch. Check Wholesale UCD to UCD ignores both.", [jira("EAINT-11756", "2026-06")]),
        f("Check fee, tile and module-page price; check invoice and e-Invoice line wording.", [az("knowledge/_core/fees-and-pricing.md#Every surface a price reaches"), ts("EAINT-12403 12403_UTU_E2E1")]),
        f("Check AH on Step 2, Step 4, Step 6 and Details, first vs second JPJ enquiry, success vs fail, single vs bulk.", [ts("EAINT-11057 11057_UCD_TS1-TS8")]),
        f("Check failed payment: RHB IF, BO Reset, then Resubmit.", [az(`${U}#Where the transactions show, by status`), ts("EAINT-12403 12403_STMS_PAY1")]),
        f("Check the UCD to UCD user guides (Standard and Interstate) on the landing page.", [ts("EAINT-11835 UCD_11835_TS01")]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "Fee RM20 to RM25. Tile RM30 to RM35. Live S34.2-20261001.", state: "latest" },
        { key: "EAINT-10175", date: "2026-03", what: "Fee RM15 to RM20. Tile RM30.", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12324", date: "2026-10", what: "No STMS_APPROVED event for UTU / IUTU. Live S34.1-20261001.", state: "latest" },
        { key: "EAINT-11756", date: "2026-06", what: "Wholesale UCD to UCD ignores the two blocking flags.", state: "latest" },
        { key: "EAINT-11057", date: "2026-06", what: "Usage code AH on Step 2, 4 and Details.", state: "latest" },
        { key: "EAINT-9204", date: "2026-01", what: "Perakuan for Standard and Interstate seller and buyer.", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "FUTURE: Firefox Browser Reminder at Step 5.", state: "latest" },
        { key: "EAINT-7109", what: "UCD to UCD on the mobile app. Draft.", state: "latest" },
        { key: "EAINT-171", what: "UI stories (171-176, 225, 226). No SRD." },
      ],
      openQuestions: [
        "Where does Standard end for Bulk? The 11057 workbook said 'Payment request sent' at Step 4 with no Step 6. Single goes to Step 5 and 6 (walked 25.09.2026). Bulk not walked.",
        "Do SSM rules, Bypass or EAINT-10119 ever apply to UCD to UCD? 4942 says no for documents and SSM. The others are silent.",
        "Is CUTU ('Company/UCD to UCD', EAINT-12324) treated as UCD to UCD?",
        "The hotline on UCD to UCD screens is 1-700-816-186. The STMS landing shows 03-27798899. Possible stale text.",
      ],
    },

    // --------------------------------------------------------------- interstate
    {
      id: "interstate",
      name: "Interstate (seller creates, buyer accepts within 48 hours)",
      summary:
        "Used when buyer and seller are in different places. UCD A creates and submits. UCD B accepts later on its own account and pays. If UCD B does nothing in 48 hours the transaction expires.",
      portals: ["UCD Portal (UCD A and UCD B)", "JPJ (external)", "RHB (payment)"],
      triggers: [
        {
          id: "seller-creates",
          name: "UCD A creates an Interstate transaction",
          entry: "UCD Home › UCD TO UCD › INTERSTATE › CREATE NEW INTERSTATE TRANSACTION",
          summary: "Pages: interstate-home.do, interstate/view.do (create), interstate/enquiry.do (seller listing). Wizard uses companyCategory=IUTU.",
          sources: [az(`${U}#Interstate flow`), az(`${U}#Interstate, seller side as walked (seller = logged-in UCD, UCD A)`), ask("Q4 §1.3, §2")],
          steps: [
            st(
              "Find the buyer dealer",
              "UCD › UCD to UCD › Interstate › Create New Interstate Transaction",
              "'Please key in buyer (Dealer) company reg no (ROC)'. Search shows the Company Name. Continue and confirm. The INTERSTATE button only works for users with 'Selling Vehicle Allowed'.",
              [az(`${U}#Interstate, seller side as walked (seller = logged-in UCD, UCD A)`), ask("Q4 §1.3, §2.1")],
              { branches: [{ when: "Buyer ROC = the seller's own company", then: "Blocked." }] },
            ),
            st(
              "Step 1 - Seller",
              "UCD › Interstate › Step 1",
              "Perakuan 'PERAKUAN UCD TO UCD (INTERSTATE) - PENJUAL (<UCD A name>)' naming the representative and IC. Tick, then UCD A's own MyKad and thumbprint.",
              [az(`${U}#Interstate flow`), jira("EAINT-9204", "2026-01")],
            ),
            st(
              "Step 2 - Vehicle and JPJ Enquiry",
              "UCD › Interstate › Step 2",
              "Seller company is pre-filled. Choose Single or Bulk. Key in Vehicle No and click GET. Tick the agree text 'I/We hereby agree to transfer (sell) the vehicle ownership to the new buyer <UCD B>...'. Next. The JPJ enquiry runs here. A review page shows the result and the note 'Only JPJ Check = OK Transaction(s) will be created for buyer thumbprint. Please re-do for Failed transaction(s)'.",
              [az(`${U}#Interstate, seller side as walked (seller = logged-in UCD, UCD A)`), ask("Q4 §2.3")],
              {
                branches: [
                  { when: "The vehicle is not already held by UCD A", then: "'Vehicle record not found'." },
                  { when: "JPJ enquiry passes", then: "Status InterStateNew. interstateExpiryDate = creation time + 2 days." },
                  { when: "JPJ enquiry fails", then: "Status InterStateDraft (prod code). Re-do the transaction." },
                ],
              },
            ),
            st(
              "Result - Interstate Transaction Listing",
              "UCD › UCD to UCD › Interstate › Transaction Listing (interstate/enquiry.do)",
              "UCD A lands on its Interstate listing. Tx Status 'Interstate New', Remarks 'PENDING BUYER THUMBPRINT', actions View and Cancel. The transaction is not in UCD A's STMS listing.",
              [az(`${U}#Where the transactions show, by status`)],
              {
                branches: [{ when: "UCD A clicks Cancel while Interstate New or Draft", then: "Status InterStateCancelled (cancel-interstate.do)." }],
              },
            ),
          ],
        },
        {
          id: "buyer-accepts",
          name: "UCD B accepts the Interstate transaction",
          entry: "UCD B › STMS › STMS TRANSACTION LISTING › To Accept",
          summary: "UCD B sees the row in its own STMS listing, not in the Interstate listing.",
          sources: [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`), ask("Q4 §2.4")],
          steps: [
            st(
              "Open the row and click To Accept",
              "UCD B › STMS › STMS Transaction Listing",
              "Row shows Seller Name = UCD A, JPJ Check OK, Tx 'Interstate New', Remarks 'TO THUMB IN BY <created + 48 h>', actions View and To Accept. To Accept goes straight to Step 3, no dialog.",
              [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`)],
            ),
            st(
              "Step 3 - Buyer",
              "UCD B › Interstate › Step 3",
              "Perakuan 'PERAKUAN STMS (UCD TO UCD - INTERSTATE) - PEMBELI (<UCD B>)' naming UCD B's representative and IC from the logged-in user's record, the seller company and the seller rep. JPJ receipt email, tick, then the logged-in user's own MyKad and thumbprint.",
              [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`), jira("EAINT-9204", "2026-01")],
            ),
            st(
              "Step 4 - JPJ Enquiry again",
              "UCD B › Interstate › Step 4",
              "The enquiry runs again. Message: 'Please make the payment before <created + 48 h> to effect the transfer, otherwise system will automatically cancel this transaction after this date.' Buttons: Save & Continue Later, Make Payment.",
              [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`)],
              { branches: [{ when: "Buyer completes payment", then: "Status Pending, then Approved or Failed." }] },
            ),
            st(
              "Step 5 - Payment",
              "UCD B › Interstate › Step 5",
              "Same Payment Summary as Standard (RM37.00 since 02.10.2026). The 48-hour warning repeats. UCD B pays.",
              [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`), jira("EAINT-12403", "2026-10")],
            ),
            st(
              "Step 6 - Transfer",
              "UCD B › Interstate › Step 6",
              "'JPJ Transfer Status: OK - SUCCESSFUL'. UCD A's Interstate listing shows Buyer Auth = time of acceptance, Approved, View only.",
              [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`)],
              { affects: ["UCD A Interstate listing", "BO STMS Transaction"] },
            ),
          ],
        },
        {
          id: "bo-resume",
          name: "BO resumes an Interstate Cancelled transaction",
          entry: "BO › Support Tools › STMS Transaction",
          sources: [az(`${U}#Statuses`), ts("EAINT-8766")],
          steps: [
            st(
              "Update and Resume",
              "BO › Support Tools › STMS Transaction",
              "BO can [Update] and [Resume] an Interstate Cancelled transaction back to Pending (workbook 8766).",
              [az(`${U}#Statuses`)],
            ),
          ],
        },
      ],
      affects: [
        f("Seller's Interstate listing: Buyer Company/ROC, Seller Auth time, Buyer Auth '-', Interstate New, PENDING BUYER THUMBPRINT. After acceptance: Buyer Auth time, Approved, View only.", [az(`${U}#Where the transactions show, by status`)]),
        f("The seller's STMS listing never shows the Interstate transaction.", [az(`${U}#Where the transactions show, by status`)]),
        f("BO STMS Transaction: Company Name = buyer (UCD B), Seller ID = seller ROC, JPJ Enquiry OK, Payment '-', Interstate New. Approved: Method RHB, OK / OK / OK.", [az(`${U}#Where the transactions show, by status`)]),
        f("BO company field 'UCD Company: Allowed To Accept Interstate Transaction From:' limits who can send to a buyer.", [az(`${U}#Rules that differ from STMS`), ts("EAINT-6762")]),
        f("Usage code AH shows at Step 2, where the Interstate JPJ enquiry runs.", [ts("EAINT-11057 11057_UCD_TS8")]),
      ],
      cronjobs: [
        {
          name: "InterstateExpiredJob (trigger InterstateExpiredTrigger)",
          schedule: "Daily. Cron 0 30 2 * * ? (2:30 AM) in the dev-reference scheduler config. Prod file is withheld.",
          does: "Sweeps transactions whose interstateExpiryDate has passed and are not Approved, Cancelled, InterStateCancelled or mid-payment. Sets them to InterStateExpired. A second prod-code answer says the trigger is commented out in the live scheduler, so the job may not run in production. The first answer says it is wired by name. The two answers disagree.",
          sources: [ask("Q4 §3.1-3.2"), az(`${U}#Statuses`), ac("InterstateExpiredJob, InterstateExpiredTrigger (48-hour question)")],
          unconfirmed: true,
        },
        {
          name: "On-view expiry check (check-interstate-expiry.do)",
          schedule: "Each time a user opens the transaction page",
          does: "Runs the same expiry logic live, so a transaction can expire without waiting for the nightly job.",
          sources: [ask("Q4 §3.3")],
        },
      ],
      roles: [
        f("UCD A needs 'Selling Vehicle Allowed' to start Interstate. UCD B needs normal STMS rights.", [ask("Q4 §4.2")]),
        f("If the company has no active RHB account, the company groupType must start with 'A' (isGroupTypeAllowedForInterstateTxn) to proceed.", [ask("Q4 §4.4")]),
        f("Each dealer works on its own account. UCD A creates and submits. UCD B accepts.", [az(`${U}#Two kinds`), jira("EAINT-9204", "2026-01")]),
      ],
      afterCompletion: [
        f("Approved in UCD B's STMS Transaction Listing. UCD A's Interstate listing shows Approved with View only.", [az(`${U}#Where the transactions show, by status`)]),
        f("If UCD B does not accept in 48 hours, the status becomes InterStateExpired.", [ask("Q4 §3, §7")], {
          alt: [{ text: "Azfar's repo does not know whether the 48-hour auto-cancel gives InterStateExpired or InterStateCancelled. Transaction S694494084 was left to find out (deadline 27-09-2026 16:36).", sources: [az(`${U}#Gaps — nobody has written these down`)], note: "Prod code says InterStateExpired (via the expiry job). Not yet seen on screen." }],
        }),
      ],
      rules: [
        f("UCD B must accept and pay within 48 hours of UCD A creating the transaction. Example: created 16:46, deadline 27-09-2026 16:46. After that the system cancels it.", [az(`${U}#Two kinds`), az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`)]),
        f("Statuses: InterStateDraft (8, JPJ enquiry failed), InterStateNew (9, JPJ passed, clock running), InterStateExpired (10), InterStateCancelled (11). Then Pending, Approved or Failed once UCD B acts.", [ask("Q4 §7")], {
          alt: [{ text: "Interstate Cancelled, Interstate Expired, Interstate Failed (tickets 2944, 4026, 12054, 7919, 3224). No SRD defines them.", sources: [az(`${U}#Statuses`)], note: "Azfar lists 'Interstate Failed'. The prod enum has InterStateDraft and no Interstate Failed." }],
        }),
        f("Prod code: the 48-hour deadline (interstateExpiryDate) is set to creation time plus 2 days when the JPJ check passes. The result of a missed deadline is InterStateExpired, never Cancelled. No job sets Cancelled by timeout. InterStateCancelled comes only from the seller's cancel action (cancel-interstate.do).", [ac("InterstateExpiredJob, InterstateTransactionController")]),
        f("Bulk Payment blocks Approved, Cancelled and Interstate Cancelled.", [az(`${U}#Statuses`), jira("EAINT-12054", "2026-08")]),
        f("A seller's Cancel could overwrite a buyer-accepted state. Production defect, patched 26.06.2026.", [az(`${U}#Statuses`), jira("EAINT-11850", "2026-06")]),
        f("The vehicle must already be held by UCD A. Otherwise 'Vehicle record not found'.", [az(`${U}#Interstate, seller side as walked (seller = logged-in UCD, UCD A)`)]),
      ],
      scopeToCheck: [
        f("Run the full Interstate path with two accounts: UCD A create, UCD B To Accept, pay, Step 6.", [az(`${U}#Interstate flow`), ts("EAINT-12403 12403_UTU_E2E2")]),
        f("Check the Interstate listing, STMS listing and BO listing for every status.", [az(`${U}#Where the transactions show, by status`)]),
        f("Check the 48-hour remark and warning wording on the listing, Step 4 and Step 5.", [az(`${U}#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)`)]),
        f("Check expiry: leave a transaction past the deadline and see its status (job or on-view check).", [ask("Q4 §3")]),
        f("Check seller Cancel while Interstate New, and Cancel after the buyer accepted (EAINT-11850).", [jira("EAINT-11850", "2026-06")]),
        f("Check BO Update and Resume of an Interstate Cancelled transaction.", [az(`${U}#Statuses`)]),
        f("Check AH at Step 2 for Interstate, single and bulk.", [ts("EAINT-11057 11057_UCD_TS8")]),
        f("Check 'Allowed To Accept Interstate Transaction From' in BO.", [ts("EAINT-6762")]),
      ],
      tickets: [
        { key: "EAINT-9204", date: "2026-01", what: "Interstate Perakuan and 48-hour buyer wording.", state: "latest" },
        { key: "EAINT-7109", what: "Mobile app SRD v0.1. Defines 'Buyer & Seller in different location'.", state: "latest" },
        { key: "EAINT-11850", date: "2026-06", what: "Seller Cancel vs buyer accept defect patched.", state: "latest" },
        { key: "EAINT-12403", date: "2026-10", what: "Fee RM25.", state: "latest" },
        { key: "EAINT-12324", date: "2026-10", what: "No STMS_APPROVED event for IUTU.", state: "latest" },
        { key: "EAINT-525", what: "Interstate expiry cronjob (ticket numbers 525, 1196 named by Azfar)." },
        { key: "EAINT-1196", what: "Interstate expiry cronjob." },
      ],
      openQuestions: [
        "Is InterstateExpiredJob really running in production? One prod-code answer says the trigger is commented out in the live scheduler (nothing expires interstate transfers by job). Another says it is wired. The on-view check (check-interstate-expiry.do) still expires on page open. Confirm on screen with an overdue transaction.",
        "Whether UCD A's submit counts for the Firefox Browser Reminder (EAINT-12253).",
        "Production cron time for InterstateExpiredJob. Only the dev-reference value (2:30 AM) is known.",
      ],
    },

    // --------------------------------------------------------------------- bulk
    {
      id: "bulk",
      name: "Bulk (Standard and Interstate)",
      summary: "Step 2 lets the user pick Single or Bulk. Bulk uses a downloadable Excel template. Not walked by Azfar.",
      portals: ["UCD Portal"],
      triggers: [
        {
          id: "bulk-step2",
          name: "Transaction Type = Bulk at Step 2",
          entry: "UCD › UCD to UCD › Step 2 › Transaction Type: Bulk",
          sources: [az(`${U}#Standard, as walked (buyer = logged-in UCD)`), az(`${U}#Gaps — nobody has written these down`)],
          steps: [
            st(
              "Choose Bulk and download the sample",
              "UCD › UCD to UCD › Step 2",
              "The page offers 'Download sample for bulk transaction template excel file'. What happens next was not walked.",
              [az(`${U}#Rules that differ from STMS`)],
            ),
          ],
        },
      ],
      affects: [f("The same Perakuan applies to single and bulk.", [az(`${U}#Interstate flow`), jira("EAINT-9204")])],
      cronjobs: [],
      roles: [],
      afterCompletion: [],
      rules: [
        f("Usage code AH test covers 4 vehicles in one bulk: Failed-4F + AH, Failed-not-4F + AB, Success-AH, Success-AB.", [ts("EAINT-11057 11057_UCD_TS7")]),
      ],
      scopeToCheck: [
        f("Check bulk AH display on Step 4 and Step 6 for each vehicle outcome.", [ts("EAINT-11057 11057_UCD_TS7")]),
        f("Check where Standard bulk ends: Step 4 'Payment request sent' or Step 5 and 6.", [az(`${U}#Standard flow`)]),
      ],
      tickets: [{ key: "EAINT-11057", date: "2026-06", what: "AH usage code, bulk case.", state: "latest" }],
      openQuestions: ["Bulk (Standard and Interstate) has not been walked. Steps, end state and statuses are unknown."],
    },
  ],
};
