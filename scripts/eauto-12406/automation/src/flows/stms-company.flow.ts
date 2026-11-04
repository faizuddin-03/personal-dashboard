/**
 * STMS with a COMPANY (SYARIKAT) seller — the reusable entry point. Same shape as `stms.flow.ts` (LEGACY, MyKad seller,
 * left untouched): `stopAfter` names the step just COMPLETED, every option has a default, the result carries what the
 * next step needs.
 *
 *   // a Company STMS saved at Step 4 after the JPJ enquiry (e.g. to buy the SSM Document later in Firefox 36)
 *   const r = await runStmsCompanyFlow(page, { mykad, company, stopAfter: "jpjEnquiry" });
 *   await r.stms.saveAndContinueLater();
 *
 *   // end to end (PAYS RM37.00): ON Step 6 Transfer, returned on arrival
 *   await runStmsCompanyFlow(page, { mykad, company, vehiclePrefix: "ON", stopAfter: "transfer" });
 *
 * Steps: 1 Seller (company + representative MyKad) · 2 Vehicle + company documents · 3 Buyer (dealer MyKad) ·
 * 4 JPJ Check · 5 Payment · 6 Transfer. Screen actions: `StmsWizardPage` (company methods added 21.10.2026, selectors
 * from the EAINT-12022 Company STMS run on /preprod1 16.10.2026, IC_REG_TS9, ON000103 Approved).
 *
 * SSM Document purchase: when the DEALER company's BO "Purchase SSM Document" boxes STMS - Company Category AND ESTM -
 * Company Category are BOTH ticked before the transaction starts (Azfar 21.10.2026; one alone never offered it), Step 4
 * asks for [Purchase SSM] instead of [Make Payment], and Step 2 shows only the Board Resolution box (filled: the visible
 * boxes only). The caller ticks / puts back the boxes (`BoCompanyAccountsPage.setMany`); the flow never touches BO. With `buySsm: true` the flow buys it (pop-ups answered as confirms,
 * NOT seen yet from this repo); without, a stop past `jpjEnquiry` THROWS when it is asked, nothing bought. (EAINT-12253
 * BEH_TS7 buys it in Firefox 36 from the listing instead.)
 *
 * FINAL STOP: `transfer` — Step 6 `view/ucd/stms/transaction/jpj-sub.do?id=…`, marker "JPJ Transfer Status", returned on
 * arrival ("Working..." cleared). EAINT-12253 (21.10): nothing after it touches a dialog; the only dialog answered is
 * Step 5's own "Sure to submit this payment?", before arrival.
 *
 * Preconditions: signed in as a dealer (the spec's `ts.portal("ucd")`); the company exists in eSim's SSM simulator with
 * the representative's MyKad as a director (`seedSsmCompany`, @data/ssm-seed — the spec seeds it, the flow never touches
 * eSim); the MyKad Reader Emulator. Every run from Step 1 → 2 CREATES a transaction; `transfer` PAYS (RHB keyed on the
 * vehicle prefix: default "ON", RHB OK).
 * Register: UNVERIFIED (src/flows/README.md). Verify spec: tests/flows/stms-company.verify.spec.ts.
 */

import * as path from "node:path";
import type { Page } from "@playwright/test";
import { StmsWizardPage, SellerCategory, type CardLike } from "@pages/ucd/stms-wizard.page";
import { awaitFinalScreen } from "@pages/final-step";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";
import type { StmsStep, VehicleDetails } from "./stms.flow";

const ORDER: StmsStep[] = ["category", "seller", "vehicle", "buyer", "jpjCheck", "jpjEnquiry", "payment", "transfer"];

/** The QA company document (a ~190 KB PDF made by QA for EAINT-12022), uploaded into each visible document box. */
export const COMPANY_DOCUMENT = path.join(__dirname, "..", "..", "assets", "uploads", "company-document.pdf");

export interface StmsCompanyScenario {
  /** The selling company as eSim's SSM simulator knows it: name EXACTLY as in the SSM document, and its registration no. */
  company: { name: string; regNo: string };
  /**
   * The company's representative (a director in the SSM document). Default CARDS.emulatorDefault (880101-01-1234): a UCD
   * user's own IC is REFUSED as a company representative (knowledge/_core/stms.md, preprod1 29.09.2026), and
   * 020406081081 is lane 1's dealer (Azfar1); the EAINT-12022 Company STMS that completed used 880101-01-1234.
   */
  representative?: CardLike;
  /** The dealer's MyKad at Step 3. Default: the lane's card (CARDS.malaysianIndividual). */
  buyer?: CardLike;
  /** Vehicle-number prefix (eSim JPJ / RHB answers). Default "ON" (QA-owned: JPJ 00, RHB OK). */
  vehiclePrefix?: string;
  vehicleRegNo?: string;
  vehicle?: Partial<VehicleDetails>;
  /** Uploaded into every visible document box on Step 2. Default COMPANY_DOCUMENT. */
  documentFile?: string;
  matchResult?: MatchResult;
  /**
   * When Step 4 asks for the SSM Document purchase: true = buy it (`StmsWizardPage.purchaseSsm`, PAYS the SSM fee;
   * its two pop-ups seen 21.10.2026, then Step 4's "SSM Document Verification" pop-up: successful = OK and go on, failed =
   * `SsmDocumentMismatchError` with the fee already paid; see there) and go on; false (default) = a stop past `jpjEnquiry` throws, nothing bought.
   */
  buySsm?: boolean;
  /** Default "transfer". */
  stopAfter?: StmsStep;
  /** Pass the spec's `mykad` fixture. */
  mykad: MyKadClient;
}

export interface StmsCompanyResult {
  vehicleRegNo: string;
  vehicle: VehicleDetails;
  transactionId?: string;
  stoppedAfter: StmsStep;
  /** Step 2: how many document boxes were visible (and filled). */
  documentBoxes?: number;
  /** Step 4: the JPJ enquiry result; `ssmPurchaseAsked` = Step 4 asks for the SSM Document purchase. */
  jpj?: Record<string, string>;
  ssmPurchaseAsked?: boolean;
  /** With `buySsm`: the text of each SSM purchase pop-up, in order (company details, Payment Summary, then the "SSM Document Verification" success pop-up when shown). */
  ssmDialogs?: string[];
  /** With `buySsm`: the SSM "Total Amount Payable" read from the Payment Summary pop-up (e.g. "19.44"). */
  ssmTotal?: string;
  page: Page;
  stms: StmsWizardPage;
}

export async function runStmsCompanyFlow(page: Page, s: StmsCompanyScenario): Promise<StmsCompanyResult> {
  const stopAfter = s.stopAfter ?? "transfer";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: StmsStep) => ORDER.indexOf(st) <= stopAt;

  const vehicleRegNo = s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "ON");
  const vehicle: VehicleDetails = {
    mobileNo: nextMobile(),
    email: nextEmail(),
    engineNo: randomEngineNo(),
    chassisNo: randomChassisNo(),
    make: "Chery",
    year: "2012",
    ...s.vehicle,
  };
  const stms = new StmsWizardPage(page);
  const r: Partial<StmsCompanyResult> = {};
  const out = (stoppedAfter: StmsStep): StmsCompanyResult => ({
    vehicleRegNo,
    vehicle,
    transactionId: new URL(page.url()).searchParams.get("id") ?? undefined,
    stoppedAfter,
    ...r,
    page,
    stms,
  });

  await s.mykad.removeCard();
  await s.mykad.setMatchResult(s.matchResult ?? "Identical");

  await stms.startNewTransaction();
  await stms.chooseSellerCategory(SellerCategory.SYARIKAT);
  if (!reaches("seller")) return out("category");

  await stms.authenticateCompanySeller({
    vehicleRegNo,
    companyName: s.company.name,
    companyRegNo: s.company.regNo,
    mykad: s.mykad,
    card: s.representative ?? CARDS.emulatorDefault,
    sellerEmail: vehicle.email,
  });
  if (!reaches("vehicle")) return out("seller");

  await stms.continueToVehicle();
  r.documentBoxes = await stms.fillCompanySellerDetails(vehicle, { documentFile: s.documentFile ?? COMPANY_DOCUMENT });
  if (!reaches("buyer")) return out("vehicle");

  await stms.continueFromCompanyDetails();
  await s.mykad.removeCard();
  await stms.authenticateBuyer({ jpjReceiptEmail: vehicle.email, mykad: s.mykad, card: s.buyer ?? CARDS.malaysianIndividual });
  if (!reaches("jpjCheck")) return out("buyer");

  await stms.continueToJpjCheck();
  if (!reaches("jpjEnquiry")) return out("jpjCheck");

  r.jpj = await stms.runJpjEnquiry();
  r.ssmPurchaseAsked = await stms.ssmPurchaseAsked();
  if (!reaches("payment")) return out("jpjEnquiry");

  if (r.ssmPurchaseAsked && s.buySsm) {
    const bought = await stms.purchaseSsm();
    r.ssmDialogs = bought.dialogs;
    r.ssmTotal = bought.total;
    if (await stms.ssmPurchaseAsked()) throw new Error(`${vehicleRegNo} Step 4 still asks for the SSM purchase after: ${r.ssmDialogs.join(" || ")}`);
  } else if (r.ssmPurchaseAsked) {
    throw new Error(
      `${vehicleRegNo} Step 4 asks for the SSM Document purchase ([Purchase SSM]). This flow does not buy it in Chrome; ` +
        `nothing was bought. Untick the company's Purchase SSM Document setting, or stop at "jpjEnquiry".`,
    );
  }
  await stms.goToPayment();
  if (!reaches("transfer")) return out("payment"); // nothing pressed after arrival

  await stms.submitPayment(); // "Sure to submit this payment?" answered on Step 5, then Step 6 by URL
  await awaitFinalScreen(page, page.getByText("JPJ Transfer Status").first(), "STMS Step 6: JPJ Transfer Status", 120_000);
  return out("transfer"); // FINAL: Step 6, nothing after arrival (EAINT-12253)
}
