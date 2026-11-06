// EAINT-12406 TS list for /eauto/12406. Generated 2026-11-03 from
// scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json (Azfar, written 30.10).
// automated = a test with this id exists in cr/EAINT-12406/03-spec (playwright --list).
// azfar = Azfar's result at hand-over, cr/EAINT-12406/STATUS.md "Where it ended — morning 30.10.2026".

export type AzfarResult = "pass" | "fail" | "kiv" | "blocked" | "rerun" | "none" | "deprio";

export interface Ts12406 { id: string; sheet: string; priority: string; title: string; automated: boolean; azfar: AzfarResult; note: string }

export const SHEETS_12406: Record<string, string> = { CP: "1 Secarang pages", QT: "2 Quotation", E2E: "3 Allianz purchase", RC: "4 Receipt and CIBO", RG: "5 Regression" };

export const TS_12406: Ts12406[] = [
  {
    "id": "12406_CP_TS1",
    "sheet": "CP",
    "priority": "P1",
    "title": "Home page insurer logos show Allianz between Lonpac and Tokio Marine",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS2",
    "sheet": "CP",
    "priority": "P1",
    "title": "About Us > Our partnership shows the new Allianz wording",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS3",
    "sheet": "CP",
    "priority": "P1",
    "title": "FAQs > 'Which insurers can I get instant quotation from?' lists Lonpac, Allianz, Tokio Marine and no other insurer",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS4",
    "sheet": "CP",
    "priority": "P1",
    "title": "Support > Need to contact insurance company? shows an Allianz section between Lonpac and Tokio Marine, in the same format, and no other insurer",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS5",
    "sheet": "CP",
    "priority": "P2",
    "title": "Support: expand the Allianz section (one helpline line and the towing sentence), then collapse it",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS6",
    "sheet": "CP",
    "priority": "P2",
    "title": "Look of the changed blocks against the Secarang mockup 20261015: font, colour, bullets, icons, spacing, alignment; no mockup review marks on the site",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS7",
    "sheet": "CP",
    "priority": "P1",
    "title": "Production after go-live, look only (no payment): Allianz logo, Allianz quotation card, About Us, FAQs and Support on secarang.com. The same quotation goes on to the payment page in 12406_E2E_TS8",
    "automated": false,
    "azfar": "kiv",
    "note": "Production, on hold until go-live"
  },
  {
    "id": "12406_CP_TS8",
    "sheet": "CP",
    "priority": "P2",
    "title": "BEFORE the deploy: capture Home logos, All Quotations, About Us, every FAQ and Support on staging. AFTER: the same pages differ only by the Allianz changes",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_CP_TS9",
    "sheet": "CP",
    "priority": "P3",
    "title": "[ON HOLD: no source for Terms of Use (Q22)] Terms of Use (and Privacy / Refund Policy): do they list insurers, and is Allianz there?",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_QT_TS1",
    "sheet": "QT",
    "priority": "P1",
    "title": "All three insurers quote: Allianz quotation shown with its logo, in the order Lonpac, Allianz, Tokio Marine; no other insurer",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_QT_TS2",
    "sheet": "QT",
    "priority": "P1",
    "title": "Allianz gives no quotation, Lonpac and Tokio Marine do: 'Allianz – Quotation unavailable' card after Tokio Marine",
    "automated": true,
    "azfar": "none",
    "note": "Needs Dev simulator plates (tell Azfar first)"
  },
  {
    "id": "12406_QT_TS3",
    "sheet": "QT",
    "priority": "P2",
    "title": "[ON HOLD: needs Azfar's real company number (Q40)] Company vehicle (Company tab, company SSM): what Secarang shows before and after the deploy. SRD REQ-003 says 'Allianz shown as unavailable'; today no Secarang insurer supports company owners",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_QT_TS4",
    "sheet": "QT",
    "priority": "P1",
    "title": "Individual owner, non-renewal: Allianz shown as unavailable; the customer still buys Lonpac to the end (normal flow, non-renewal)",
    "automated": true,
    "azfar": "none",
    "note": "Needs Dev simulator plates (tell Azfar first)"
  },
  {
    "id": "12406_QT_TS5",
    "sheet": "QT",
    "priority": "P2",
    "title": "Lonpac gives no quotation: Allianz then Tokio Marine",
    "automated": true,
    "azfar": "none",
    "note": "Needs Dev simulator plates (tell Azfar first)"
  },
  {
    "id": "12406_QT_TS6",
    "sheet": "QT",
    "priority": "P2",
    "title": "Tokio Marine gives no quotation: Lonpac then Allianz",
    "automated": true,
    "azfar": "none",
    "note": "Needs Dev simulator plates (tell Azfar first)"
  },
  {
    "id": "12406_QT_TS7",
    "sheet": "QT",
    "priority": "P2",
    "title": "Allianz product documents open: policy wording, product disclosure sheet, privacy notice, claim guide; Plan Details (from the quotation card and from Confirmation) and Excess info, with the links inside them",
    "automated": true,
    "azfar": "kiv",
    "note": "Document dates 2020 vs SRD 2022 (BA)"
  },
  {
    "id": "12406_QT_TS8",
    "sheet": "QT",
    "priority": "P3",
    "title": "[ON HOLD: /ia/motorcycle-insurance does not exist (Q19)] Motorcycle tab: individual-owner renewal of a motorcycle; which insurers quote, does Allianz appear",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_QT_TS9",
    "sheet": "QT",
    "priority": "P2",
    "title": "[ON HOLD: needs Dev's simulator set-up (Q35)] Allianz quotation service gives an error or no answer: Allianz unavailable card, the others as usual, the page does not hang",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_QT_TS10",
    "sheet": "QT",
    "priority": "P3",
    "title": "[ON HOLD: needs Dev's simulator set-up (Q36)] Allianz refers the quotation (refer-risk): what the customer sees, CIBO 'Pending approval' / Referred Risk Log; also with Allianz the only insurer available",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_E2E_TS1",
    "sheet": "E2E",
    "priority": "P1",
    "title": "Secarang home form > All Quotations > Allianz > Add-ons > Confirmation > FPX Online banking > Success > CIBO Transaction Details, cover note, e-Certificate",
    "automated": true,
    "azfar": "kiv",
    "note": "Cover note / policy / e-Certificate missing (Q44, Dev)"
  },
  {
    "id": "12406_E2E_TS2",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Allianz purchase paid by Credit or Debit Card, discount code tried: All Quotations > Add-ons > Confirmation > card + 3D Secure > Success > CIBO",
    "automated": true,
    "azfar": "kiv",
    "note": "Cover note / policy / e-Certificate missing (Q44, Dev)"
  },
  {
    "id": "12406_E2E_TS3",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Allianz purchase paid by PayLater by Grab: All Quotations > Add-ons > Confirmation > GrabPay sandbox > Success > CIBO",
    "automated": true,
    "azfar": "kiv",
    "note": "Cover note / policy / e-Certificate missing (Q44, Dev)"
  },
  {
    "id": "12406_E2E_TS4",
    "sheet": "E2E",
    "priority": "P3",
    "title": "Allianz purchase paid by SPayLater (ShopeePay simulator): All Quotations > Add-ons > Confirmation > SPayLater QR > Success > CIBO",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_E2E_TS5",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Allianz payment fails (FPX simulator status not 00), then is cancelled (SPayLater), then the customer pays by FPX: messages on the payment page, CIBO status, final purchase",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_E2E_TS6",
    "sheet": "E2E",
    "priority": "P3",
    "title": "[ON HOLD: cover note failure cannot be set up: today Allianz gives no cover note at all on staging (Q44, Dev)] Allianz paid, then cover note submission fails (vehicle prefix VB) or JPJ rejects (prefix VF)",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_E2E_TS7",
    "sheet": "E2E",
    "priority": "P2",
    "title": "[ON HOLD: MacroKiosk: BoldPay on /ia/ may be production, and the reminder cron cannot be triggered (Q7)] MacroKiosk renewal flow: WhatsApp reminder > [Renew Now] / [Pay Now] link > Secarang Step 4 Confirmation > BoldPay > CIBO (platform Secarang-MK): is Allianz offered? (the SA brief lists it in its tests)",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_E2E_TS8",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Production after go-live: Allianz quotation > Add-ons > Confirmation > payment page, STOP (no payment); the CIBO record this creates shows the Allianz company number",
    "automated": false,
    "azfar": "kiv",
    "note": "Production, on hold until go-live"
  },
  {
    "id": "12406_E2E_TS9",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Allianz add-ons and Confirmation: pick Tokio Marine first, go back to Allianz; tick / untick add-ons; Confirmation (gender, PIAM 'i' pop-up); pay; same add-ons on receipt and CIBO",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_E2E_TS10",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Customer picks Allianz, goes back and buys Tokio Marine instead: receipt and CIBO show Tokio Marine with its own company number, nothing of Allianz. This is also the Tokio Marine purchase read by 12406_RG_TS1, RC_TS1, RC_TS3, RC_TS4",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_E2E_TS11",
    "sheet": "E2E",
    "priority": "P2",
    "title": "[ON HOLD: road tax (Q25)] Allianz purchase with road tax renewal, if the homepage flow offers road tax",
    "automated": false,
    "azfar": "none",
    "note": "ON HOLD (orange)"
  },
  {
    "id": "12406_E2E_TS12",
    "sheet": "E2E",
    "priority": "P2",
    "title": "Allianz add-on options one by one, then a purchase with ALL add-ons ticked (Zurich's all-add-ons purchase failed)",
    "automated": true,
    "azfar": "blocked",
    "note": "RM2,510.87 cannot be paid on Fiuu sandbox (Q46)"
  },
  {
    "id": "12406_RC_TS1",
    "sheet": "RC",
    "priority": "P1",
    "title": "Secarang receipt of an Allianz purchase shows the Allianz name with the new company number below it, laid out as Tokio Marine, and the Serba Sentral agent line",
    "automated": true,
    "azfar": "fail",
    "note": "D1 + D2"
  },
  {
    "id": "12406_RC_TS2",
    "sheet": "RC",
    "priority": "P1",
    "title": "CIBO user opens the receipt of an Allianz transaction: same Allianz name and company number",
    "automated": true,
    "azfar": "fail",
    "note": "D1"
  },
  {
    "id": "12406_RC_TS3",
    "sheet": "RC",
    "priority": "P1",
    "title": "CIBO Transaction Details of an Allianz transaction: company registration number below the insurer name; Allianz logo; agency Serba Sentral",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RC_TS4",
    "sheet": "RC",
    "priority": "P2",
    "title": "CIBO Transaction Management: Allianz picked in the Insurance Company filter (Serba Sentral group); Allianz rows show Ins. Co. Allianz over the agency badge Serba Sentral, styled like other rows; the CSV export matches the screen",
    "automated": true,
    "azfar": "rerun",
    "note": "E5 needs QT_TS4 Lonpac purchase"
  },
  {
    "id": "12406_RC_TS5",
    "sheet": "RC",
    "priority": "P2",
    "title": "CIBO Payment Report shows the Allianz sales under agency Serba Sentral; Payment Management shows them under their Fiuu channel",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RC_TS6",
    "sheet": "RC",
    "priority": "P2",
    "title": "CIBO Commission Report shows the Allianz purchase made with a discount code under agency Serba Sentral, with its commission; purchases without a code are not listed (as before the deploy)",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RC_TS7",
    "sheet": "RC",
    "priority": "P3",
    "title": "Every customer message after an Allianz purchase: payment-success / receipt WhatsApp, policy-created WhatsApp, e-Receipt email, insurer e-Certificate email; the attached receipt shows the new Allianz company number",
    "automated": false,
    "azfar": "none",
    "note": "Orange; receipt email checked by hand"
  },
  {
    "id": "12406_RC_TS8",
    "sheet": "RC",
    "priority": "P2",
    "title": "Allianz transactions created before the change (Secarang, before May 2025; non-final ones from 2023-2024): receipt and Transaction Details before and after the deploy",
    "automated": true,
    "azfar": "fail",
    "note": "D1"
  },
  {
    "id": "12406_RC_TS9",
    "sheet": "RC",
    "priority": "P2",
    "title": "Allianz transaction not paid (left at Payment methods): CIBO shows it Pending payment / Unpaid, without Receipt or e-Certificate; later Quotation expired",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RC_TS10",
    "sheet": "RC",
    "priority": "P2",
    "title": "CIBO Transaction Management with Allianz rows: search by Ref. No. / plate / owner name / ID, Platform, Insurance Company combined with Transaction Status and Discount Code, Clear all, Print, no result",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RC_TS11",
    "sheet": "RC",
    "priority": "P2",
    "title": "CIBO > CRM: the customer record of the Allianz buyer of E2E_TS1 (ID details and the vehicle card)",
    "automated": true,
    "azfar": "kiv",
    "note": "Recorded; needs QT_TS4"
  },
  {
    "id": "12406_RG_TS1",
    "sheet": "RG",
    "priority": "P2",
    "title": "Tokio Marine receipt (Secarang and CIBO) and Transaction Details: same as captured on 28.10, before the deploy, and on a new purchase after it",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RG_TS2",
    "sheet": "RG",
    "priority": "P2",
    "title": "Lonpac receipt (Secarang and CIBO) and Transaction Details: same as captured on 28.10, before the deploy, and on a new purchase after it",
    "automated": true,
    "azfar": "rerun",
    "note": "Needs QT_TS4 Lonpac purchase"
  },
  {
    "id": "12406_RG_TS3",
    "sheet": "RG",
    "priority": "P3",
    "title": "CIBO Transaction Details and receipt of an RHB transaction: same as captured on 28.10",
    "automated": true,
    "azfar": "pass",
    "note": ""
  },
  {
    "id": "12406_RG_TS4",
    "sheet": "RG",
    "priority": "P2",
    "title": "eAuto UCD Insurance: the insurer order on the quotation step, captured before and after the Secarang deploy (observed)",
    "automated": false,
    "azfar": "deprio",
    "note": "Deprioritised: eAuto and Secarang are different systems"
  }
];

// ── Claude-driven run, 2026-11-04 (Faizuddin's session; Claude ran the TS in its own browser, Azfar's
// recording style). Staging /ia/ is on Allianz's REAL UAT API since 04.11, so these are real-API results.
// Source: _reference/tickets/EAINT-12406/claude-run-2026-11-04/RESULTS.md (evidence folders listed there).
// scripts/claude-run/build-results-12406.mjs reads this block (one entry per line) for the TS Tracker.
export const CLAUDE_12406_DATE = "2026-11-04";
export const CLAUDE_12406: Record<string, { r: AzfarResult; note: string }> = {
  "12406_RC_TS1": { r: "fail", note: "Rerun: D1 (EAINT-12764) on today's receipt 26110421300001 and CIBO BR60006350-52; E10 D2 (EAINT-12765) 379.88 vs 359.88" },
  "12406_RC_TS2": { r: "fail", note: "Rerun: CIBO receipt BR60006349 still has D1 (EAINT-12764); E3/E4 match" },
  "12406_RC_TS8": { r: "fail", note: "Rerun: BR55004010 receipt still D1 (EAINT-12764); E4 Transaction Details match" },
  "12406_QT_TS7": { r: "kiv", note: "Rerun, real API: PDS 03/06/2020 and Privacy Notice 3 March 2020 are not 2022 (BA); Claim Guide image-only" },
  "12406_E2E_TS1": { r: "kiv", note: "Real API BR6N006394: E1-E6 pass, no cover note / policy / e-Cert (Q44). First tries failed 'Invalid fullName' (EAINT-12766)" },
  "12406_E2E_TS2": { r: "kiv", note: "Real API BR6N006396, card + RJC7: E1, E2, E4 match; no cover note (Q44)" },
  "12406_E2E_TS3": { r: "kiv", note: "Real API BR6N006397, PayLater by Grab settled: no cover note (Q44)" },
  "12406_E2E_TS12": { r: "blocked", note: "Real API: RM6,219.60 over the MYR 2,000 sandbox limit, Grab window blank (Q46)" },
  "12406_QT_TS1": { r: "pass", note: "Real API row 22 JXH1451: Lonpac > Allianz > Tokio Marine, postcode Edit re-quotes" },
  "12406_QT_TS2": { r: "pass", note: "First run, real API row 33: Allianz 'Quotation unavailable' after Tokio Marine" },
  "12406_QT_TS4": { r: "pass", note: "First run, real API: Lonpac bought BR6N006399, got Cover Note A2984745 at once (Q44 is Allianz-only)" },
  "12406_QT_TS5": { r: "pass", note: "First run, real API row 44: Allianz > Tokio Marine > Lonpac unavailable" },
  "12406_QT_TS6": { r: "pass", note: "First run, real API row 29: Lonpac > Allianz > Tokio Marine unavailable" },
  "12406_RG_TS2": { r: "pass", note: "Rerun (was RE-RUN): BR60006309 and today's BR6N006399 show Lonpac Insurance Berhad unchanged" },
  "12406_E2E_TS9": { r: "pass", note: "Real API BR6N006401: all 7 points; gender does not re-price on the real API (recorded)" },
  "12406_E2E_TS10": { r: "pass", note: "Real API BR6N006404: Allianz > plan Edit > Change > Tokio Marine; receipt and CIBO Tokio Marine only" },
  "12406_E2E_TS4": { r: "pass", note: "Real API BR6N006405: SPayLater (ShopeePay simulator) Success, CIBO 'eWallet - ShopeePay'" },
  "12406_RC_TS4": { r: "pass", note: "05.11 rerun E5: Lonpac / TokioMarine filters list only their rows, BR6N006399 + BR6N006404 show Pemaju Eksklusif (E1-E4 Azfar 29.10)" },
  "12406_E2E_TS5": { r: "pass", note: "05.11 real API BR6N006406: FPX 51 'Unsuccessful payment', SPayLater cancel OK, FPX 00 paid; CIBO 1 row each in TM and Payment Management" },
  "12406_RC_TS11": { r: "pass", note: "05.11 rerun E2: CRM record + vehicle card of Lonpac buyer BQX1858 recorded (E1 Azfar 30.10)" },
};

/** Latest result per TS: today's Claude run where it ran, else Azfar's at hand-over. */
export const latest12406 = (t: Ts12406): AzfarResult => CLAUDE_12406[t.id]?.r ?? t.azfar;
