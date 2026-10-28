import type { Fact, Module, Source, Step } from "../types";

// Source helpers (kept local so this file stands alone).
const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref: `eauto-qa-azfar:${ref}`, date });
const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: `07-ask-eauto.md ${ref} (prod/master 0e21bef3)`, date: "2026-10-23" });

const f = (text: string, sources: Source[], extra?: Partial<Fact>): Fact => ({ text, sources, ...extra });
const st = (
  title: string,
  where: string | undefined,
  detail: string | undefined,
  sources: Source[],
  extra?: Partial<Step>,
): Step => ({ title, where, detail, sources, ...extra });

const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code 0e21bef3db — ${ref}`, date: "2026-10-23" });

const STMS = "knowledge/_core/stms.md";

export const stms: Module = {
  id: "stms",
  name: "STMS (temporary ownership transfer)",
  short: "STMS",
  portals: ["UCD Portal", "Back Office", "JPJ (external)", "RHB (payment)"],
  summary:
    "STMS moves a vehicle from its owner (seller) to a dealer (UCD) for a temporary period. The dealer does it in the UCD portal in 6 steps and pays by RHB. After 6 months an unsold vehicle moves to APT. The module also has bulk screens, company-seller SSM checks, BO support actions and Transfer History.",
  related: ["stms-addons", "apt", "ssm", "payments-fees", "ucd-to-ucd", "platform"],
  glossary: [
    {
      term: "STMS",
      meaning:
        "Sistem Tukar Milik Sementara. The Wholesale glossary says 'Surat'. The repo uses 'Sistem' until the BA answers.",
      sources: [az(`${STMS}#Name`), jira("EAINT-12403 SRD v1.1 §1.4")],
    },
    {
      term: "UCD",
      meaning: "Used Car Dealer. The buyer in an STMS.",
      sources: [az(`${STMS}`)],
    },
    {
      term: "Perakuan",
      meaning: "The consent text the seller and the UCD must tick at Step 1 and Step 3.",
      sources: [az(`${STMS}#Step 1`), jira("EAINT-9204", "2026-01")],
    },
    {
      term: "HTM / OTH",
      meaning: "Hakmilik Tukar Milik (roughly \"ownership transfer\"). HTM is the JPJ-facing label for the feature coded as OTH (Ownership Transfer History); it is the same feature as TH (Transfer History) below.",
      sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }],
    },
    {
      term: "TH (Transfer History)",
      meaning: "A paid add-on bought at Step 4. It shows past ownership transfers of the vehicle.",
      sources: [az(`${STMS}#Step 4`)],
    },
    {
      term: "Slip Pengesahan",
      meaning: "The confirmation slip on Transaction Details. It holds the company copy, seller copy and both Perakuan.",
      sources: [az(`${STMS}#Documents`)],
    },
    {
      term: "JPJ Check / JPJ Enquiry",
      meaning: "The vehicle check sent to JPJ at Step 4. A second enquiry runs around payment.",
      sources: [az(`${STMS}#Step 4`)],
    },
    {
      term: "Usage code",
      meaning: "A code recorded against the vehicle. It picks the price row. Example: AA = Motosikal, AH = e-hailing.",
      sources: [az("knowledge/_core/usage-codes.md")],
    },
    {
      term: "Bypass Purchase SSM",
      meaning: "A user-level BO setting. The user uploads all documents and does not buy an SSM document.",
      sources: [az(`${STMS}#BackOffice`), jira("EAINT-8802", "2026-01")],
    },
  ],
  flows: [
    // ------------------------------------------------------------------ single
    {
      id: "single-transaction",
      name: "STMS single transaction (6 steps)",
      summary:
        "A dealer takes in a vehicle from an individual (MyKad or MyPR) or a company. Steps: Seller, Seller & Vehicle details, UCD authentication, JPJ check, Payment, Transfer.",
      portals: ["UCD Portal", "JPJ (external)", "RHB (payment)"],
      triggers: [
        {
          id: "create-new",
          name: "Create a new transaction",
          entry: "UCD Home › STMS › CREATE NEW TRANSACTION",
          summary: "The normal way in. The user picks the seller category first.",
          sources: [az(`${STMS}#Entry points`), ask("Q3 §1.1")],
          steps: [
            st(
              "Choose the seller category",
              "UCD Portal › STMS › Create New Transaction",
              "Tiles: MALAYSIAN (MyKad), MyPR, Company. A confirm dialog asks Yes. The record starts as status New.",
              [az(`${STMS}#Categories`), ask("Q3 §2.1")],
              {
                branches: [
                  { when: "Seller is a foreigner", then: "Not offered. Screen says 'Warga asing mesti tukar milik di kaunter JPJ'." },
                  { when: "Seller is an Association", then: "Removed. JPJ no longer accepts it (EAINT-8649)." },
                ],
              },
            ),
            st(
              "Step 1 - Seller Authentication ('Seller (Owner)')",
              "UCD Portal › STMS › Step 1",
              "Key in vehicle number and tick seller consent. Perakuan 'PERAKUAN STMS / TH - PENJUAL' shows first. The thumbprint part stays hidden until the Perakuan is ticked. Once ticked it cannot be unticked. Then read MyKad and verify thumbprint. Next stays hidden until the thumbprint passes.",
              [az(`${STMS}#Step 1`), jira("EAINT-9204", "2026-01")],
              {
                affects: ["Platform: MyKad / thumbprint reader"],
                branches: [
                  { when: "Chrome, Edge or Firefox 37+", then: "Uses the WebSocket reader (ws://localhost:7878)." },
                  { when: "Firefox 36.0.4", then: "Still uses the Java applet." },
                  { when: "WebSocket fails to open", then: "Message 'Update Required - Dermalog Biometric Device'. No version is compared." },
                  { when: "Cancel", then: "Back to the Create STMS Transaction category page." },
                ],
              },
            ),
            st(
              "Step 2 - Seller & Vehicle Details",
              "UCD Portal › STMS › Step 2",
              "Individual: seller mobile, email, engine/chassis no, Make > Model, Year. Company: Type of Business (mandatory) and document uploads (up to 5MB each).",
              [az(`${STMS}#Step 2`), jira("EAINT-4332", "2024"), jira("EAINT-5147"), jira("EAINT-4942", "2024-11")],
              {
                branches: [
                  { when: "Mobile or email belongs to the main user or any sub user of the same UCD company (active or inactive)", then: "Blocked." },
                  { when: "Same mobile or email used more than 3 times in the last 30 days on Approved Individual transactions in the UCD's company", then: "Blocked." },
                  { when: "Same vehicle + owner already recorded", then: "Blocked: 'Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum ini...'." },
                  { when: "Company seller changes Type of Business", then: "Uploaded documents are cleared." },
                ],
                affects: ["SSM: documents depend on SSM settings"],
              },
            ),
            st(
              "Step 3 - UCD Authentication ('Buyer (Dealer)')",
              "UCD Portal › STMS › Step 3",
              "The logged-in UCD gives its own thumbprint ('Please use login user'). A JPJ receipt email field shows. Perakuan 'PERAKUAN STMS / TH - UCD BERDAFTAR': the JPJ fee receipt goes to the main-user email (editable) with a copy to receipt@eauto.my. The text says STMS ends after 6 months and then transfers permanently to the UCD via APT.",
              [az(`${STMS}#Step 3`), jira("EAINT-9204", "2026-01")],
              {
                affects: ["APT"],
                branches: [
                  { when: "Transaction thumbprinted before the Perakuan deploy and resumed after it", then: "The Slip Pengesahan keeps the Perakuan version it was thumbprinted with." },
                ],
              },
            ),
            st(
              "Step 4 - Submission (JPJ Checking) ('JPJ Check')",
              "UCD Portal › STMS › Step 4",
              "Tick agree, then Submit to JPJ. Result shows Valid As At, Blacklisted, Hak Milik Dituntut, Condition Code, JPJ Enquiry Status, Response Code. Pending status is set as soon as the enquiry call starts.",
              [az(`${STMS}#Step 4`), ask("Q3 §2.4")],
              {
                affects: ["JPJ XML Log (STMS)", "Transfer History purchase", "SSM purchase (company)"],
                branches: [
                  { when: "JPJ check OK", then: "Buttons: Make Payment (STMS) and Save & Continue Later." },
                  { when: "JPJ check fails", then: "[Resubmit] shows instead of payment." },
                  { when: "JPJ returns usage code AH", then: "Usage code AH shows on Step 4 and Transaction Details, even on a failed enquiry. Hidden otherwise (EAINT-11057)." },
                  { when: "Company seller", then: "SSM check or Purchase SSM happens here. See the SSM module." },
                ],
              },
            ),
            st(
              "Step 5 - Payment",
              "UCD Portal › STMS › Step 5",
              "Payment Summary: JPJ Fee + eAuto Fee + Service Tax 8% = Total. Car today: 10.00 + 25.00 + 2.00 = RM37.00 (since 02.10.2026). Button [STMS Payment]. A 2nd JPJ enquiry runs around payment. Pays through RHB (simulated by eSim on staging).",
              [az(`${STMS}#Step 5`), jira("EAINT-12403", "2026-10")],
              {
                affects: ["RHB payment", "BO RHB Payment Transaction", "STMS Add-ons (LKM Refund, Insurance Cancellation)"],
                branches: [
                  { when: "RHB returns anything other than OK", then: "A dialog shows and the user stays on Step 5. [Retry (STMS Payment)] is offered." },
                  { when: "RHB error RE (Invalid Tx Ref No)", then: "A countdown banner shows with the hotline 03-27798899." },
                  { when: "Retry, company has an active RHB account, same day", then: "Old stored amount is re-sent." },
                  { when: "Retry, company has an active RHB account, next day or later", then: "RHB rejects the old reference ('RHB ERROR-RE'). Cannot be paid until BO Reset Payment." },
                  { when: "Company has no RHB account or RHB is inactive", then: "Screen shows the current price. FPX or account balance charge it. An RHB attempt is refused 'Payment in progress.'" },
                  { when: "Add-on ticked (LKM Refund, or Insurance Cancellation for Individual)", then: "Opens its own pop-up. See STMS Add-ons." },
                ],
              },
            ),
            st(
              "Step 6 - Submission (JPJ Transfer) ('Transfer')",
              "UCD Portal › STMS › Step 6 (stms/transaction/jpj-sub.do?id=)",
              "Shows 'JPJ Transfer Status: OK - SUCCESSFUL' with the submission date and time. Done opens STMS Transaction Details. On success the status becomes Approved. On rejection or timeout it becomes Failed.",
              [az(`${STMS}#Step 6`), ask("Q3 §2.6")],
              {
                affects: ["STMS Transaction Listing (UCD + BO)", "e-Invoice (LHDN)", "Elasticsearch listing index"],
                branches: [
                  { when: "JPJ final submission fails", then: "Status Failed. Resubmit from the listing, or the hourly STMS JPJ submission job retries (see cronjobs)." },
                ],
              },
            ),
          ],
          affects: [
            f("Firefox-only 'Browser Reminder' popup is FUTURE (EAINT-12253, S34.X-20261028) at the last step.", [az(`${STMS}#FUTURE`)], { unconfirmed: true }),
          ],
        },
        {
          id: "resubmit-from-listing",
          name: "Resubmit a saved or failed transaction",
          entry: "UCD › STMS › STMS TRANSACTION LISTING › Resubmit",
          summary: "Continues a transaction that was saved with Save & Continue Later, or that failed.",
          sources: [az(`${STMS}#Entry points`)],
          steps: [
            st(
              "Open the STMS Transaction Listing and click Resubmit",
              "UCD Portal › STMS › STMS Transaction Listing",
              "A Failed row offers View and Resubmit. A saved row continues from where it stopped.",
              [az(`${STMS}#Entry points`), az("knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status")],
              {
                branches: [
                  { when: "JPJ Check failed", then: "Back to Step 4 [Resubmit] to run the JPJ enquiry again." },
                  { when: "Payment failed", then: "Step 5 [Retry (STMS Payment)]." },
                  { when: "Company SSM bought within 7 days", then: "Goes to Step 5." },
                  { when: "Company SSM bought more than 7 days ago", then: "Back to Step 4 to buy SSM again." },
                ],
              },
            ),
          ],
        },
        {
          id: "interstate-to-accept",
          name: "Interstate buyer accepts (To Accept)",
          entry: "UCD (buyer) › STMS › STMS TRANSACTION LISTING › To Accept",
          summary: "A UCD to UCD Interstate transaction shows in the buyer's STMS listing. To Accept goes straight to Step 3.",
          sources: [az("knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked")],
          steps: [
            st(
              "Click To Accept on an 'Interstate New' row",
              "UCD Portal › STMS › STMS Transaction Listing",
              "Remarks read 'TO THUMB IN BY <created + 48 h>'. No dialog. Lands on Step 3 Buyer Authentication. The rest follows the single transaction steps. See the UCD to UCD module.",
              [az("knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked")],
              { affects: ["UCD to UCD"] },
            ),
          ],
        },
        {
          id: "mobile-app",
          name: "Mobile app STMS",
          entry: "UCD mobile app › STMS (/mb/ucd/stms/*)",
          summary: "The app mirrors the web steps: permission check, seller and buyer MyKad, JPJ enquiry, payment.",
          sources: [ask("Q3 §1.5")],
          steps: [
            st(
              "Run STMS from the app",
              "UCD mobile app › STMS",
              "Prod code has app equivalents under /mb/ucd/stms/*. The Android home tile price for STMS and UCD to UCD changes RM25 to RM35 (EAINT-12550, Code Review).",
              [ask("Q3 §1.5"), jira("EAINT-12550", "2026-10")],
              { affects: ["Mobile app tile prices"] },
            ),
          ],
        },
        {
          id: "homepage-reminder",
          name: "Homepage STMS cancellation reminder popup (dormant)",
          entry: "UCD Home › popup dialog-stms-cancellation-reminder.jsp",
          summary: "Prod code has a popup that nags dealers to resubmit or pay Pending or Failed STMS before a cut-off. The dates are hard-coded to a 2024 campaign.",
          sources: [ask("Q3 §1.6"), ask("Q2 (gap worth testing)")],
          steps: [
            st(
              "Popup built but not wired into the popup queue",
              "UCD Home",
              "Ask eAuto says the popup is not wired into the queue that opens popups, so it is effectively dormant.",
              [ask("Q3 §1.6")],
            ),
          ],
        },
      ],
      affects: [
        f("STMS Transaction Listing (UCD) and BO > STMS Transaction (view/stms/enquiry).", [az("knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status")]),
        f("JPJ: 2 enquiries plus the final submission. JPJ's reply carries the 6-month expiry date (e.g. 2027-03-25 for a transfer on 25-09-2026). Seen in BO > JPJ XML Log (STMS).", [az(`${STMS}#Rules still unsettled`)]),
        f("Invoice and e-Invoice. e-Invoice button shows when LHDN Response Status = OK. Document code EA-IV-MMYY-XXXXXXX. Line reads 'Sistem Tukar Milik Sementara (\"STMS\") service charge'.", [az(`${STMS}#Documents`), jira("EAINT-2450", "2025-06")]),
        f("JPJ Official Receipt PDF arrives by email and shows as a button on Transaction Details (hidden until received). File name ABC1234_STMS_JPJReceipt_yyyyMMddHHmm.", [az(`${STMS}#Documents`), jira("EAINT-9204", "2026-01")]),
        f("Slip Pengesahan: company copy, seller copy, Perakuan Penjual, Perakuan Pembeli. For STMS approved after 9204 the eAuto e-payment JPJ receipt is no longer inside it.", [az(`${STMS}#Documents`)]),
        f("After 6 months the vehicle moves to APT.", [az("knowledge/_core/apt.md"), ask("Q3 §5.4")]),
        f("Transaction is indexed into Elasticsearch (feeds listing and search pages). e-Invoice event goes to eauto-einvoice.", [ask("Q3 §5.1-5.2")]),
        f("BO STMS CSV export STMS_YYYYMMDDHHmm, 34 columns, includes 'Last 3 Months Total Ownership Transfer' and 'Latest Ownership Transfer Date' ('None' when no TH). With LKM Refund the export grows to 41 columns.", [az(`${STMS}#Reports`), ts("EAINT-3210 TS01"), az("cr/EAINT-104/LEDGER.md")]),
        f("JPJ receipt number column 'NO. RESIT JPJ' in JPJ Reports and 'NO. RESIT' in JPJ Hasil.", [az(`${STMS}#Reports`), jira("EAINT-9642", "2026-05")]),
        f("No customer email, SMS or WhatsApp was found on the STMS completion path. Only the e-Invoice event and an internal dashboard push.", [ask("Q3 §5.5")], { unconfirmed: true }),
        f("Event STMS_APPROVED is not sent for UCD to UCD (UTU / IUTU) after EAINT-12324. For plain STMS it is not known.", [az("knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS"), jira("EAINT-12324", "2026-10")], { unconfirmed: true }),
      ],
      cronjobs: [
        {
          name: "STMS cancelled-transaction housekeeping (eauto-cron)",
          schedule: "On by default; run time is a hidden setting",
          does: "Auto-cancels stale STMS transactions. Same switch and job family as the eSTM housekeeping job.",
          sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list (eauto-cron service)", date: "2026-10-23" }],
        },
        {
          name: "StmsJpjSubmissionJob (also called stmsJpjSubmissionTrigger)",
          schedule: "Hourly, roughly 9am to 11pm (dev-reference scheduler config; prod file withheld)",
          does: "Batch JPJ submission for STMS. For Pending (patched) transactions it resends the second enquiry and the submission.",
          sources: [ask("Q3 §3.1"), az("01b-azfar-extra.md Flow: Resubmit JPJ Final Submission (BO) and payment reset")],
        },
        {
          name: "JpjExpiryNotificationJob",
          schedule: "Daily, about 5am (dev-reference scheduler config; prod file withheld)",
          does: "Reads the JPJ 5.5 Expiry Notice data and creates the APT record for an eligible STMS. It is the mechanism that turns an aging STMS into an APT transaction.",
          sources: [ask("Q3 §3.3"), ac("JpjExpiryNotificationJob, JpjExpiryNoticeHandlerBean")],
          unconfirmed: true,
        },
        {
          name: "AptJpjSubmissionJob (downstream of STMS)",
          schedule: "Twice a day, about 8:30am and 5:50pm (dev-reference; prod time not confirmed). Named as one of the 4 jobs active in prod.",
          does: "Batch-submits paid APT records to JPJ. Not an STMS job. See the APT module.",
          sources: [ac("AptJpjSubmissionJob")],
          unconfirmed: true,
        },
        {
          name: "e-Invoice resubmission for invalid or blank TIN",
          schedule: "Unknown",
          does: "Resubmits the e-Invoice to LHDN once the TIN is fixed in BO.",
          sources: [az(`${STMS}#Documents`), ts("EAINT-8550")],
          unconfirmed: true,
        },
        {
          name: "APT resubmit / auto-pay (downstream)",
          schedule: "Daily 8:00pm in production",
          does: "Not STMS. STMS has no auto-pay. See the APT module.",
          sources: [az("knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)")],
        },
      ],
      roles: [
        f("UCD portal only (CompanyType = UCD), landing on /view/ucd/home.", [ask("Q3 §4.1")]),
        f("Needs the company flag sistemTukarMilikSementara AND the staff member's matching permission.", [ask("Q3 §4.2")]),
        f("UCD main user and sub users (Module Permission in UCD Settings > User Accounts). A 'Valuation Advisor' has no payment rights.", [az("knowledge/_core/roles-and-accounts.md")]),
        f("BO company flag 'Transaction Restriction = Yes' blocks create, resubmit, bulk JPJ enquiry and bulk payment. Popup: 'You are currently restricted from performing transactions. Please contact eAuto at 03-27798899.'", [az(`${STMS}#BackOffice`), ts("EAINT-9044 STMS_TS1")]),
        f("No Insurance, Credit/Bank, JPJ, AATF, Service Portal or public path to STMS was found.", [ask("Q3 §4.5")]),
      ],
      afterCompletion: [
        f("Approved row in UCD STMS Transaction Listing and BO STMS Transaction, with Invoice, e-Invoice, JPJ Official Receipt and Slip Pengesahan on Transaction Details.", [az(`${STMS}#Step 6`), az(`${STMS}#Documents`)]),
        f("Payment settles through RHB Direct Debit or FPX. Reconciliation reports track it against the bank.", [ask("Q3 §5.3")]),
        f("After 6 months the vehicle moves to APT.", [az(`${STMS}#Rules still unsettled`), ask("Q3 §5.4")]),
      ],
      rules: [
        f("Seller categories: Individual MyKad, Individual MyPR, Company. Foreigner is not offered. Association was removed (EAINT-8649, Done 13.08.2025).", [az(`${STMS}#Categories`), jira("EAINT-8649", "2025-08")]),
        f("Fee comes from the rate card (transfercost): one row per type x usage code x region x CAR/BIKE. CAR or BIKE comes from the JPJ body type. The payment is priced when it is made, with no date logic.", [az("knowledge/_core/fees-and-pricing.md#How a charge is made up")]),
        f("Car fee: JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (since 02.10.2026). Before that RM20 + 8%, Step 5 RM31.60. Before 31.03.2026 RM15.", [az(`${STMS}#Step 5`), jira("EAINT-12403", "2026-10"), jira("EAINT-10175", "2026-03")]),
        f("AA (Motosikal, body MSL) fee does not move with Car price CRs: JPJ 1.00 + eAuto 5.00 + 0.40 = RM6.40. Bike rows on AB-AE stay at RM26.20.", [az("knowledge/_core/fees-and-pricing.md#Rows that price differently (rate card, live 20.09.2026)"), mine("02b business-rules §1.2")]),
        f("STMS has no auto-pay. A reset STMS waits for the UCD.", [az(`${STMS}#Step 5`), az("knowledge/_core/fees-and-pricing.md#When a price changes")]),
        f("Statuses: New, Pending, Approved, Failed, Cancelled, InterStateNew, InterStateExpired, InterStateCancelled. Draft, Expired, PendingApproval, InterStateDraft and CommitedJPJApproved exist in the enum but are not confirmed for STMS.", [az(`${STMS}#Statuses`), ask("Q3 §7")]),
        f("Prod code: the APT is created from JPJ's 5.5 Expiry Notice data by JpjExpiryNotificationJob. A 6-month timer inside eAuto was not found in code.", [ac("JpjExpiryNoticeHandlerBean")]),
        f("Pending is set the moment a JPJ enquiry starts. Failed is set when the JPJ call times out or errors. Approved only when Step 6 succeeds.", [ask("Q3 §7")]),
        f("Payment OK + Tx Failed is not covered by price CRs: not reset, not picked up by the cronjob.", [az("knowledge/_core/apt.md#Decided, not open")]),
        f("Type of Business shows on Step 4, 5, 6 and Details. '-' for transactions created before it existed.", [az(`${STMS}#Documents`), jira("EAINT-4942", "2024-11")]),
        f("Usage code AH shows on Step 4 and Transaction Details only when JPJ returns AH.", [az(`${STMS}#Step 4`), jira("EAINT-11057", "2026-06")], {
          alt: [
            {
              text: "AH shows on Step 4, Step 6 and Transaction Details.",
              sources: [ts("EAINT-11057 11057_STMS_TS1"), mine("02b business-rules §1.2")],
              note: "TS title and Faizuddin's note list Step 6 as well. Azfar's repo lists Step 4 and Details.",
            },
          ],
        }),
        f("The MyBioID installer v2 check (EAINT-9944) never went live (Closed 28.08.2026). Do not test it.", [az(`${STMS}#Step 1`), jira("EAINT-9944", "2026-08")]),
      ],
      scopeToCheck: [
        f("Run each seller category: MyKad, MyPR, Company. Foreigner and Association must not be offered.", [az(`${STMS}#Categories`), ts("EAINT-9044 STMS_TS1-TS10")]),
        f("Check Step 2 blocks: mobile/email of main or sub user, 3 uses in 30 days, duplicate vehicle + owner.", [az(`${STMS}#Step 2`)]),
        f("Check the JPJ enquiry failure path: Resubmit shows instead of payment. Check usage code AH shows on a failed enquiry.", [az(`${STMS}#Step 4`), ts("EAINT-11057 11057_STMS_TS4-TS5")]),
        f("Check Step 5 amounts for Car, Commercial Car and Bike, and before/after a price push. Check Home tile and module page prices.", [az("knowledge/_core/fees-and-pricing.md#Every surface a price reaches"), ts("EAINT-12403")]),
        f("Check failed payment: RHB IF, UCD actions View | Resubmit, BO actions View | Cancel | Reset, BO Reset leaves Payment '-' and Tx Pending.", [ts("EAINT-12403 12403_STMS_PAY1"), az("knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status")]),
        f("Check negative reset: JPJ Enquiry Failed (4K Hak Milik Dituntut) has BO actions View | Cancel only. Approved has no Reset.", [ts("EAINT-12403 12403_STMS_NEG1-NEG2")]),
        f("Check invoice, e-Invoice, Slip Pengesahan, JPJ Official Receipt button and reports after approval. Old transactions keep the old amount.", [az("knowledge/_core/fees-and-pricing.md#Every surface a price reaches"), ts("EAINT-12403")]),
        f("Check the BO STMS Transaction Listing and its CSV export (column order, file name).", [ts("EAINT-3210 TS01-TS05")]),
        f("Check Firefox 36 (Java applet) and Chrome (WebSocket) on Steps 1 and 3.", [az(`${STMS}#Step 1`), jira("EAINT-7229", "2025-12")]),
        f("Check that Transaction Restriction = Yes shows the Notice popup on create, resubmit and both bulk screens.", [ts("EAINT-9044 STMS_TS1-TS10")]),
        f("Check the UCD user guide links on the STMS landing page (STMS for MyKad/MyPR, STMS for Company).", [ts("EAINT-11835 STMS_11835_TS01-TS04")]),
        f("Run a Wholesale STMS price check when a fee changes (Wholesale shows RM27.00).", [mine("02b business-rules §1.2"), ts("EAINT-12403 12403_STMS_R2")]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "STMS (incl. UCD to UCD) and APT eAuto fee RM20 to RM25 for Car and Commercial Car. Live S34.2-20261001.", state: "latest" },
        { key: "EAINT-10175", date: "2026-03", what: "STMS Car eAuto fee RM15 to RM20. Bike unchanged.", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12289", date: "2026-09", what: "APT fee RM15 to RM20 (reset rules reused by 12403).", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-9204", date: "2026-01", what: "Perakuan at Step 1 and Step 3. JPJ Official Receipt button.", state: "latest" },
        { key: "EAINT-8802", date: "2026-01", what: "Bypass Purchase SSM BO page. Per-user STMS/eSTM tick.", state: "latest" },
        { key: "EAINT-5155", date: "2025-01", what: "Company seller: SSM check at Step 4.", state: "latest" },
        { key: "EAINT-4942", date: "2024-11", what: "Type of Business and 3 documents for Company sellers.", state: "latest" },
        { key: "EAINT-2450", date: "2025-06", what: "e-Invoice for STMS.", state: "latest" },
        { key: "EAINT-7229", date: "2025-12", what: "WebSocket reader for Chrome, Edge and Firefox 37+. Firefox 36 keeps the applet.", state: "latest" },
        { key: "EAINT-8649", date: "2025-08", what: "Association removed from company options.", state: "latest" },
        { key: "EAINT-11057", date: "2026-06", what: "Show usage code AH on Step 4 and Details.", state: "latest" },
        { key: "EAINT-9642", date: "2026-05", what: "NO. RESIT JPJ column in BO reports.", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "FUTURE: Firefox-only Browser Reminder popup at the last step. Code Review, S34.X-20261028.", state: "latest" },
        { key: "EAINT-12332", what: "FUTURE: MyKad WebSocket reconnect button before 'Update Required'. To Do." },
        { key: "EAINT-12254", what: "FUTURE: JPJ error 3S shows 'Pending Additional Verification'. On Hold." },
        { key: "EAINT-9944", date: "2026-08", what: "MyBioID installer v2 check. Closed, never deployed.", state: "legacy" },
      ],
      openQuestions: [
        "Does a bulk payer ever see the Firefox Browser Reminder? In Firefox 36 it did not show on any bulk screen (EAINT-12253 Q5, open with BA).",
        "Which BA name is right: 'Sistem' or 'Surat' Tukar Milik Sementara?",
        "Is the 'Update Required' text on Step 1 ever a real version check? Code reading says no.",
      ],
    },

    // -------------------------------------------------------------------- bulk
    {
      id: "bulk-payment-and-enquiry",
      name: "Bulk Payment Submission and Bulk JPJ Enquiry",
      summary:
        "A dealer pays or re-checks many STMS in one go. Bulk Payment pays STMS whose JPJ check is OK. Bulk JPJ Enquiry re-runs the check for STMS whose enquiry failed.",
      portals: ["UCD Portal", "Back Office (blackout windows)"],
      triggers: [
        {
          id: "bulk-payment",
          name: "Bulk Payment Submission",
          entry: "UCD › STMS › BULK PAYMENT SUBMISSION (view/ucd/stms/bulk-payment/list.do)",
          summary: "Page is empty until a search is run.",
          sources: [az(`${STMS}#Bulk screens — observed 22.10.2026`), ask("Q3 §1.4")],
          steps: [
            st(
              "Search the list",
              "UCD › STMS › Bulk Payment Submission",
              "Page shows 'Please apply search to show the record.' Filters: Vehicle No, Transaction No, Date Created (pickers only), Status Pending or Failed. Search loads the list by AJAX. It lists the company's STMS with JPJ Check OK and no payment, including ones saved at Step 4. 20 rows per page, newest first, 'Total records: N', select-all, Export Excel.",
              [az(`${STMS}#Bulk screens — observed 22.10.2026`)],
            ),
            st(
              "Tick rows and press Perform Bulk Payment Submission",
              "UCD › STMS › Bulk Payment Submission",
              "Ticking shows 'N of M records selected.' The button first checks the transaction restriction. Then the dialog 'Confirm Bulk Payment Submission' asks Yes or No.",
              [az(`${STMS}#Bulk screens — observed 22.10.2026`)],
              {
                branches: [
                  { when: "Company is restricted", then: "'Transactions are temporarily disabled until you update Company Profile...'." },
                  { when: "A bulk submission is already running", then: "'A Bulk Submission is currently in progress, please resubmit in 5 minutes.'" },
                  { when: "Ongoing payment on a transaction", then: "'There are ongoing payment transaction(s)'." },
                ],
              },
            ),
            st(
              "Each STMS is paid and transferred",
              "Background run",
              "A progress dialog polls every 5 seconds, then '1 / 1 Bulk Payment Submission is completed.' [OK] updates the rows in place. There is no Step 5 or Step 6 and no amount on the bulk screens. Each STMS gets a fresh JPJ enquiry, its own RHB payment and the JPJ final submission. Rows go Pending to OK / OK / OK / Approved in about 16 seconds. Items run one at a time with half-second pacing. SSM is re-checked per company transaction.",
              [az(`${STMS}#Bulk screens — observed 22.10.2026`), ask("Q3 §2"), jira("EAINT-12054", "2026-08")],
              {
                affects: ["SSM (StmsBulkPaymentSsmValidationHandler)", "RHB payment", "e-Invoice"],
                branches: [
                  { when: "SSM check fails at run time", then: "Item is marked SkippedSsm." },
                  { when: "Transaction already Approved, Cancelled or InterStateCancelled", then: "Skipped. A 'Payment Sent' dialog lists skipped transactions." },
                  { when: "JPJ or RHB times out", then: "'JPJ system timeout, please try again.' or 'RHB timeout, please try again later.'" },
                ],
              },
            ),
          ],
        },
        {
          id: "bulk-jpj-enquiry",
          name: "Bulk STMS JPJ Enquiry",
          entry: "UCD › STMS › BULK JPJ ENQUIRY (view/ucd/stms/bulk-enquiry/list.do)",
          summary: "Same search filters as bulk payment, without the status filter.",
          sources: [az(`${STMS}#Bulk screens — observed 22.10.2026`), ask("Q3 §1.3")],
          steps: [
            st(
              "Search, tick and run the enquiry",
              "UCD › STMS › Bulk JPJ Enquiry",
              "Lists STMS whose JPJ enquiry failed. Columns: Valid As At eHAK, JPJ Enquiry Status, Response Code. Each row has a tick box. The walk on 22.10.2026 did not run it (nothing ticked).",
              [az(`${STMS}#Bulk screens — observed 22.10.2026`)],
              { branches: [{ when: "JPJ call times out or errors and the last enquiry was not already Passed or Approved", then: "Status becomes Failed." }] },
            ),
          ],
        },
        {
          id: "bulk-blackout",
          name: "BO bulk blackout window",
          entry: "BO › Bulk Submission Control (/view/bulk-submission-control/*)",
          summary: "Staff define windows that block both bulk screens for everyone.",
          sources: [ask("Q3 §1.8")],
          steps: [
            st(
              "Staff set a blackout window",
              "Back Office › Bulk Submission Control",
              "Not a way to start a transaction. While a window is active, Bulk JPJ Enquiry and Bulk Payment are blocked.",
              [ask("Q3 §1.8")],
            ),
          ],
        },
      ],
      affects: [
        f("Each bulk-paid STMS keeps its own RHB reference and its own invoice. Example: eAuto line RM25.00 + 8% = RM27.00.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
        f("Paid rows leave the Bulk Payment list. F5 empties the page again.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
        f("Bulk Payment blocks Approved, Cancelled and Interstate Cancelled transactions.", [az("knowledge/_core/ucd-to-ucd.md#Statuses"), jira("EAINT-12054", "2026-08")]),
      ],
      cronjobs: [],
      roles: [
        f("Bulk JPJ Enquiry needs the company flag and the user flag bulkJpjEnquirySubmission (BulkJpjEnquirySubmissionFilter).", [ask("Q3 §4.3")]),
        f("Bulk Payment needs the company flag and the user flag bulkPaymentSubmission (BulkPaymentSubmissionFilter).", [ask("Q3 §4.4")]),
      ],
      afterCompletion: [
        f("Rows update in place on the bulk page, then show Approved in the STMS Transaction Listing.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
      ],
      rules: [
        f("Bulk item statuses: Submitted, Processed, Skipped (already final), SkippedSsm (bulk payment only).", [ask("Q3 §7")]),
        f("Browser Reminder (EAINT-12253) did not show on any bulk screen in Firefox 36. It shows on Step 6 of a bulk-paid STMS only when opened by address.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
      ],
      scopeToCheck: [
        f("Check the empty page, each search filter, and 'Total records'.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
        f("Check a restricted company is blocked with the right message.", [az(`${STMS}#Bulk screens — observed 22.10.2026`), ts("EAINT-9044")]),
        f("Check bulk payment with a company seller: SSM check per transaction, and a skipped one in the 'Payment Sent' dialog.", [jira("EAINT-12054", "2026-08")]),
        f("Check each paid STMS has its own invoice and RHB reference, and the amount matches a single STMS.", [az(`${STMS}#Bulk screens — observed 22.10.2026`)]),
        f("Check UCD to UCD bulk (Standard and Interstate) separately. It has not been walked.", [az("knowledge/_core/ucd-to-ucd.md#Gaps — nobody has written these down")]),
      ],
      tickets: [
        { key: "EAINT-12054", date: "2026-08", what: "Bulk payment SSM check, SRD v1.2, Done 21.08.2026.", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "FUTURE: Browser Reminder popup. Does not reach bulk payers (Q5 open).", state: "latest" },
      ],
      openQuestions: [
        "The production scheduler file is withheld, so the bulk run schedule and blackout behaviour were read from the dev-reference config.",
      ],
    },

    // ------------------------------------------------------------- company/SSM
    {
      id: "company-seller",
      name: "Company seller: documents and SSM check",
      summary:
        "When the seller is a company, Step 2 asks for documents and Step 4 may force an SSM purchase. Two BO settings decide which. The full SSM journey is in the SSM module.",
      portals: ["UCD Portal", "Back Office"],
      triggers: [
        {
          id: "company-step2-step4",
          name: "Company seller on Step 2 and Step 4",
          entry: "UCD › STMS › Create New Transaction › Company",
          sources: [az(`${STMS}#Company category and SSM`)],
          steps: [
            st(
              "Step 1: company details and representative",
              "UCD › STMS › Step 1 (Company)",
              "Key in vehicle no, Company Name, Company Reg No (consent stays disabled until both are valid), email, then the representative's MyKad.",
              [az(`${STMS}#Company category and SSM`)],
              {
                branches: [
                  { when: "A UCD user's own IC is used as the company representative", then: "Refused: '... tidak dibenarkan menjadi wakil penjual syarikat ...'." },
                  { when: "Reg No like QA597435", then: "Rejected as invalid. 540323-T style and the 12-digit new BRN are accepted." },
                ],
              },
            ),
            st(
              "Step 2: documents by Type of Business and SSM setting",
              "UCD › STMS › Step 2",
              "Sdn Bhd or Bhd: SSM Company Profile + Board Resolution + Staff Employment Pass & MyKad. Sole Proprietorship or Partnership: SSM Business Profile + Authorisation Letter + Staff Employment Pass. Uploads up to 5MB.",
              [az(`${STMS}#Company category and SSM`), jira("EAINT-4942", "2024-11")],
              {
                branches: [
                  { when: "Company SSM Permission ticked and user Bypass not ticked", then: "Board Resolution or Authorisation Letter only. Purchase SSM is compulsory at Step 4 unless an Approved SSM within 7 days exists." },
                  { when: "Company SSM Permission ticked and user Bypass ticked", then: "All 3 documents (SSM profile bought within 7 days, pdf). No SSM purchase." },
                  { when: "Company SSM Permission not ticked", then: "All 3 documents. No SSM purchase." },
                  { when: "SSM permission changes mid-flow", then: "Popup 'Upload Seller Company Information' with [Update Document]. Make Payment is greyed until updated." },
                ],
              },
            ),
            st(
              "Step 4: Purchase SSM or Make Payment",
              "UCD › STMS › Step 4",
              "Make Payment shows only when JPJ succeeded, SSM was bought and the director matched on IC number. See the SSM module for the purchase pop-ups.",
              [az(`${STMS}#Company category and SSM`), jira("EAINT-5155", "2025-01")],
              {
                affects: ["SSM"],
                branches: [
                  { when: "Both STMS and ESTM Company Category boxes are ticked on the company before the transaction starts", then: "Purchase SSM is offered at Step 4 (Azfar, 21.10.2026). With only the STMS box ticked it was not offered on 29.09.2026." },
                  { when: "SSM document Company Name does not match Step 1", then: "Transaction Cancelled with 'Create Again' (EAINT-10119)." },
                  { when: "Business Registration Number does not match", then: "Stays Pending. Save & Continue Later only. The SSM fee is already paid." },
                ],
              },
            ),
          ],
        },
      ],
      affects: [
        f("BO SSM Transaction listing, SSM XML Log, SSM Document / SSM Invoice / SSM e-Invoice on Transaction Details.", [az(`${STMS}#Documents`)]),
        f("Company document upload and SSM purchase apply to STMS Company only, not UCD to UCD.", [az("knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS"), jira("EAINT-4942")]),
      ],
      cronjobs: [],
      roles: [
        f("BO company box 'STMS - Company Category' (ssmPermission) and user box 'Bypass Purchase SSM' decide the path.", [az(`${STMS}#Company category and SSM`)]),
      ],
      afterCompletion: [
        f("Back to normal STMS Step 4, then 5, then 6.", [az("01-azfar-repo.md Flow: STMS Company seller - SSM Permission / Purchase SSM at Step 4")]),
      ],
      rules: [
        f("Type of Business only matters when testing Pre-Application and Application. For STMS and eSTM any company behaves the same unless the CR is about business types (QA, 2026-09-25).", [az(`${STMS}#Company category and SSM`)]),
        f("LLP appears as a third Type of Business in 12054 v1.2 and workbook 9247. No requirement ticket adds it to STMS.", [az(`${STMS}#Company category and SSM`)], { unconfirmed: true }),
      ],
      scopeToCheck: [
        f("Run the permission matrix: company tick x user bypass tick x business type.", [ts("EAINT-8802 E2E_STMS_TS1-TS6"), az(`${STMS}#Company category and SSM`)]),
        f("Check Name mismatch (Cancelled + Create Again) and BRN mismatch (Pending).", [jira("EAINT-10119", "2026-10")]),
        f("Check resubmit within and after 7 days of the SSM purchase.", [az(`${STMS}#Company category and SSM`)]),
      ],
      tickets: [
        { key: "EAINT-8802", date: "2026-01", what: "Bypass Purchase SSM BO page. Newer model.", state: "latest" },
        { key: "EAINT-8526", date: "2025-07", what: "SSM hybrid model (company + user level).", state: "legacy", supersededBy: "EAINT-8802" },
        { key: "EAINT-5155", date: "2025-01", what: "SSM check of the seller representative at Step 4.", state: "latest" },
        { key: "EAINT-10119", date: "2026-10", what: "Company Name / BRN mismatch handling. Live S34.2-20261001.", state: "latest" },
        { key: "EAINT-12054", date: "2026-08", what: "Bulk payment SSM check.", state: "latest" },
        { key: "EAINT-12121", date: "2026-10", what: "FUTURE: SSM repurchase without the 7-day block. Code Review, S34.X-20261028.", state: "latest" },
        { key: "EAINT-12230", date: "2026-10", what: "FUTURE: duplicate SSM purchase validation. Code Review.", state: "latest" },
      ],
      openQuestions: [
        "Which document pairing is current: EAINT-8526 (Main UCD STMS uses Board Resolution, Sub UCD eSTM uses Authorisation Letter) or EAINT-8802 (reverse)?",
        "The 5155 SRD says Purchase SSM is compulsory at Step 4 when SSM Permission is ticked. The 29.09 walk saw Make Payment straight away. Azfar later found both STMS and ESTM boxes are needed. Confirm with Dev or BA.",
      ],
    },

    // -------------------------------------------------------------- BO support
    {
      id: "bo-support",
      name: "Back Office support actions on STMS",
      summary: "BO staff reset a failed payment, cancel, edit fields, reset JPJ status or resume a transaction.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "reset-payment",
          name: "Reset Payment",
          entry: "BO › STMS Transaction (view/stms/enquiry) › [Reset]",
          sources: [az(`${STMS}#BackOffice`), jira("EAINT-8826")],
          steps: [
            st(
              "Click Reset on a row with RHB Payment = Failed",
              "BO › STMS Transaction",
              "Browser confirm: 'Sure to reset payment for <vehicle>?'. After OK: Payment '-', Tx Pending, Remarks cleared, Reset link gone. The UCD can pay again.",
              [az(`${STMS}#BackOffice`), ts("EAINT-8826 8826_TS1-TS8"), ts("EAINT-8766 8766_TS6")],
              {
                branches: [
                  { when: "JPJ enquiry OK or Failed, Individual or Company", then: "Reset works as long as RHB Payment = Failed." },
                ],
                affects: ["BO Reset Payment Report", "UCD STMS listing (View, Resubmit)"],
              },
            ),
          ],
        },
        {
          id: "support-tools",
          name: "Support Tools: Cancel, edit, Reset JPJ Status, Resume",
          entry: "BO › Support Tools › STMS Transaction",
          sources: [az(`${STMS}#BackOffice`), jira("EAINT-8766"), jira("EAINT-11294")],
          steps: [
            st(
              "Edit or cancel a transaction",
              "BO › Support Tools › STMS Transaction",
              "Editable: Engine No, Chassis No, Make, Model, Year. MyKad No on an Approved individual transaction. Company Name and ROC on an Approved company transaction. Cancel remark: 'CANCELLED BY <BO account> on dd-mm-yyyy hh:mm'.",
              [az(`${STMS}#BackOffice`), mine("02b business-rules §1.2"), ts("EAINT-8766 8766_TS7-TS12")],
              {
                branches: [
                  { when: "A Failed JPJ-transfer transaction is edited and [Reset JPJ Status] is clicked", then: "JPJ Transfer and Tx Status become Pending." },
                  { when: "Interstate Cancelled", then: "BO can [Update] and [Resume] it back to Pending (workbook 8766)." },
                ],
              },
            ),
          ],
        },
        {
          id: "bo-settings",
          name: "Company-level STMS settings",
          entry: "BO › Manage Company Accounts › Edit Company Account",
          sources: [az(`${STMS}#BackOffice`)],
          steps: [
            st(
              "Set restriction, SSM or block flags",
              "BO › Manage Company Accounts",
              "Transaction Restriction Yes/No, Block STMS Category (Foreigner, Company, Limited Features for UCD to UCD), SSM Permission, Bypass Purchase SSM.",
              [az(`${STMS}#BackOffice`), jira("EAINT-8688"), jira("EAINT-11756")],
              { affects: ["UCD to UCD", "SSM"] },
            ),
          ],
        },
      ],
      affects: [
        f("Reset leaves the transaction in Payment '-' / Tx Pending, which is the APT cronjob's second pickup state.", [az("knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)")]),
        f("BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset date as Payment Date.", [az("knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)")]),
      ],
      cronjobs: [],
      roles: [
        f("Reset button: named BO users (EAINT-8826). Editing STMS fields needs role Admin.", [az(`${STMS}#BackOffice`), ts("EAINT-8766 / EAINT-8826")]),
        f("Menu access: Support Tools STMS, Bulk STMS Cancellation, Resubmit JPJ Final Submission (STMS) and Manual APT Trigger go to SuperAdmin + Hub Admin. JPJ Reports is SuperAdmin only.", [az(`${STMS}#BackOffice`), ts("EAINT-10038")]),
        f("Bypass Purchase SSM page: Settings (Hub Admin); named users only. It has Export Excel and an audit log (max 1 month range).", [az(`${STMS}#BackOffice`), jira("EAINT-9842", "2026-06")]),
      ],
      afterCompletion: [
        f("Pending in the UCD listing with View and Resubmit.", [az("knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status")]),
      ],
      rules: [
        f("Never use the bulk admin link /ajax/admin/scheduler/reset-payment.do?transactionType=STMS|APT. It resets every pending or failed transaction, leaves bank records and writes no audit row.", [az("knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset")]),
        f("Order matters: update the rate first, reset after.", [az("knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset")]),
        f("Reset takes Payment = Failed only. Scope differs per CR (12289: all Failed incl. Motosikal; 12403: Failed/Failed on the UCD portal only, Pending and Wholesale excluded).", [az("knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)")]),
      ],
      scopeToCheck: [
        f("Check each BO account x action x transaction state, and the UCD-side effect and remark text.", [ts("EAINT-8766 / EAINT-8826")]),
        f("Check the menu is hidden for roles without access.", [ts("EAINT-10038")]),
      ],
      tickets: [
        { key: "EAINT-8826", what: "Reset Payment button for named BO users.", state: "latest" },
        { key: "EAINT-8766", what: "Cancel and edit permission for named BO users.", state: "latest" },
        { key: "EAINT-11294", what: "Support Tools access for more users.", state: "latest" },
        { key: "EAINT-8688", date: "2025-08", what: "Data patch: untick Block STMS Category (Company, Limited Features) for 24 companies.", state: "latest" },
        { key: "EAINT-8683", date: "2025-08", what: "Data patch: enable SSM Permission for 24 companies.", state: "latest" },
        { key: "EAINT-9842", date: "2026-06", what: "Dedicated audit log for Bypass Purchase SSM.", state: "latest" },
      ],
    },

    // ------------------------------------------------------------- Transfer History
    {
      id: "transfer-history",
      name: "Transfer History (TH) add-on",
      summary: "At Step 4 the dealer can buy a Transfer History report for the vehicle.",
      portals: ["UCD Portal", "Back Office"],
      triggers: [
        {
          id: "th-bo-resubmit",
          name: "BO resubmit / reset failed payment",
          entry: "Back Office admin screens for Transfer History (OthBackofficeController)",
          steps: [
            st("Resubmit to JPJ or reset payment", "Back Office", "Staff can resubmit a Failed or Paid Transfer History to JPJ (back to Pending) and reset a failed payment.", [ac("OthBackofficeController")]),
          ],
          sources: [ac("OthBackofficeController")],
        },
        {
          id: "th-step4",
          name: "Purchase Now at Step 4",
          entry: "UCD › STMS › Step 4 › Purchase Now",
          sources: [az(`${STMS}#Step 4`), az("knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026")],
          steps: [
            st(
              "Buy the Transfer History",
              "UCD › STMS › Step 4",
              "A pop-up says 'Additional Fee of RM20.80'. On the TH invoice page only the eAuto part shows: 10.00 + 0.80 = RM10.80.",
              [az("knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026")],
            ),
            st(
              "Button rules and steps",
              "UCD › STMS transaction details",
              "Button 'Purchase Transfer History (Optional)' shows only if the STMS is Pending or Failed with no STMS payment made, its last JPJ check passed, and the dealer has the OTH permission. Click re-checks eligibility, shows the RM20.80 pop-up, and creates the OTH record as Draft. Confirm moves it to Pending and sends the RHB direct-debit split (JPJ part and eAuto part). On a good debit the system calls JPJ at once (no separate submit click).",
              [ac("OthTransactionController, OthTransactionHandler, OthPaymentHandler")],
              { branches: [{ when: "JPJ answers OK", then: "Status Approved, JPJ status Approved, approval date set, e-Invoice sent." }, { when: "JPJ fails", then: "Status Failed with a remark. BO can resubmit it to Pending." }] },
            ),
          ],
        },
      ],
      affects: [
        f("TH payment feeds the RHB payment report and the GST/SST payment report. Approval sends an e-Invoice message to eauto-einvoice. TH shows in the BO 'Plus' JPJ reconciliation and payment reports. A TH JPJ receipt and an eAuto receipt PDF can be downloaded.", [ac("OthTransactionHandler, OthJpjSubmissionHandler")]),
        f("BO STMS CSV: TH Payment, TH JPJ, TH LHDN columns and the two ownership-transfer columns. Hidden TH Receipt for TH approved after EAINT-9204.", [ts("EAINT-3210"), az(`${STMS}#Documents`)]),
        f("UCD to UCD has no Transfer History (workbook 7584, predates 9204).", [az("knowledge/_core/ucd-to-ucd.md#Fee and documents")], { unconfirmed: true }),
      ],
      cronjobs: [
        { name: "None for Transfer History", schedule: "n/a", does: "Prod code has no cron job for TH. A dealer click starts it and the JPJ call runs inside the payment step.", sources: [ac("OthTransactionController")] },
      ],
      roles: [
        f("UCD portal only. The company needs the OTH feature on, and the logged-in user needs the OTH permission (or is the company's primary user). BO staff can view, resubmit and reset.", [ac("OthTransactionController, OthBackofficeController")]),
      ],
      afterCompletion: [
        f("TH shows on Transaction Details and in payment reports.", [az(`${STMS}#Documents`), ts("EAINT-3090")], { unconfirmed: true }),
        f("The STMS listing gets 'TH Payment Status' and 'TH JPJ Status' sub-columns. No email, SMS or WhatsApp on completion was found.", [ac("OthTransactionController")]),
      ],
      rules: [
        f("TH price: JPJ 10.00 + eAuto 10.00 + SST 0.80 = RM20.80 (seen on staging preprod1, 12.10.2026).", [az("knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026")]),
        f("Statuses: Transaction New → Draft → Pending → Approved or Failed. Payment New → Pending → Paid, or Failed/Error/Aborted/To Refund/Refunded. JPJ New → Pending → Approved or Failed. TH code has no working path for Cancelled.", [ac("OthTransactionHandler, TransactionStatus, PaymentStatus, JpjStatus")]),
        f("The code name for Transfer History is OTH. The JPJ-facing label is HTM / TH.", [ac("plus/handler/oth")]),
        f("Older workbooks record only the eAuto part (10.00 + 0.80).", [az("knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026"), mine("02b business-rules §1.2")]),
      ],
      scopeToCheck: [
        f("Check export with TH bought, no ownership transfer, TH JPJ Failed and no TH.", [ts("EAINT-3210 TS01-TS05")]),
        f("Check the payment breakdown report lists TH.", [ts("EAINT-3090")]),
      ],
      tickets: [
        { key: "EAINT-3210", date: "2026-06", what: "Two extra columns in the BO STMS CSV.", state: "latest" },
        { key: "EAINT-3090", date: "2026-05", what: "Payment Breakdown Report: BMK, TH, eLKM, eVOC.", state: "latest" },
      ],
    },

    // ------------------------------------------------------------- Hak Milik
    {
      id: "hak-milik",
      name: "Hak Milik check (after eSTM approval)",
      summary: "After an eSTM transaction is Approved, two scheduled jobs ask JPJ for the buyer's ownership claim and loan lien. Nobody clicks to start it. It is shown to hire-purchase companies and read by Insurance.",
      portals: ["Credit / Hire-Purchase company portal", "UCD portal (eSTM view)", "JPJ (external)"],
      triggers: [
        {
          id: "hak-milik-jobs",
          name: "Scheduled jobs after eSTM Approved",
          entry: "EstmHakMilikTriggerJob and EstmHakmilikSubmissionJob (no user click)",
          steps: [
            st("eSTM reaches Approved", undefined, "A job picks up Approved eSTM transactions that have no Hak Milik record yet.", [ac("NewEstmSubmissionHandlerBean")]),
            st("Reverse enquiry to JPJ", undefined, "The job sends JPJ a reverse enquiry using the new owner's (buyer's) identity.", [ac("JpjHakMilikHandlerBean")]),
            st("Record the answer", undefined, "On JPJ's success code the system saves: ownership claim yes/no, existing loan or hire-purchase lien yes/no, and the way it was done (eAuto or JPJ Counter). If JPJ does not answer, nothing is saved and the next run tries again while the transaction is inside the look-back window.", [ac("JpjHakMilikHandlerBean, HakMilikPurchaseMethod")]),
          ],
          sources: [ac("EstmHakMilikTriggerJob, EstmHakmilikSubmissionJob")],
        },
        {
          id: "hak-milik-view",
          name: "Viewing the result",
          entry: "Credit portal eSTM search result link, or UCD eSTM view tab 'Butir-Butir Hak Milik'",
          steps: [
            st("Open Hak Milik detail", "Credit/Hire-Purchase portal", "Shows claim status, existing loan and financier name, and the linked JPJ payment. The dealer sees the same result on the eSTM transaction view tab.", [ac("ServicePortalController")]),
          ],
          sources: [ac("ServicePortalController")],
        },
      ],
      affects: [
        f("The result is added to the eSTM search index used by the UCD and credit-portal listings.", [ac("EstmHakMilikTriggerJob")]),
        f("The Insurance module reads Hak Milik to change quote limits when a hire-purchase lien is found.", [ac("Insurance module")]),
        f("No email, SMS or WhatsApp is tied to Hak Milik completing.", [ac("EstmHakmilikSubmissionJob")]),
      ],
      cronjobs: [
        { name: "EstmHakMilikTriggerJob", schedule: "Every 3 hours, 9am to 9pm", does: "Scans Approved eSTM transactions from the last 3 days that have no Hak Milik record and tries to create one.", sources: [ac("EstmHakMilikTriggerJob.java:85-92")] },
        { name: "EstmHakmilikSubmissionJob", schedule: "Every 30 minutes, 8am to 11pm", does: "Same check over a 7-day look-back. It is the catch-up and retry pass.", sources: [ac("EstmHakmilikSubmissionJob.java:98-105")] },
      ],
      roles: [
        f("No portal role starts it. It is viewed on the Credit/Hire-Purchase portal (own IP-restricted login, apart from UCD and BO) and by the dealer who ran the eSTM.", [ac("ServicePortalController")]),
      ],
      afterCompletion: [f("A saved Hak Milik record shows on the credit-portal detail page and the eSTM view tab.", [ac("ServicePortalController:740-862")])],
      rules: [
        f("Hak Milik has no status lifecycle. It either exists or not once JPJ's check succeeds. It is tagged 'eAuto' or 'JPJ Counter' by how the original transfer was done.", [ac("HakMilikPurchaseMethod")]),
      ],
      scopeToCheck: [
        f("Check a Hak Milik record appears after an eSTM is Approved, and is shown on the eSTM view tab.", [ac("EstmHakMilikTriggerJob")]),
        f("Check a retry after JPJ gives no answer, inside the 3-day and 7-day windows.", [ac("EstmHakmilikSubmissionJob")]),
      ],
      tickets: [],
      openQuestions: [
        "Prod schedule: the two job times come from the code and notes. Confirm they match the live scheduler.",
      ],
    },
  ],
};
