/**
 * Secarang car-insurance purchase flow — the reusable entry point. Same shape as `insurance.flow.ts`:
 * `stopAfter` names the step just completed, every option has a default, the result carries what the next step
 * needs. A CR spec calls this and adds its own assertions (EAINT-12406 first).
 *
 * Ported from Faizuddin's secarang-insurance automation (the `secarang-regression` spec's journey, commit
 * c9aab16), with his OK, 28.10.2026 (via Azfar). Rewritten to this repo's flow / page-object shape; his
 * reporting, Excel batch checker, dashboard API and data files are not carried over (see src/flows/README.md).
 *
 * The journey (team doc "Secarang & CIBO QA Knowledge" §3, cr/EAINT-12406/00-input/):
 *   Home `/ia/car-insurance` (site password page first, promo pop-up closed) → tab Private Car / Company Car →
 *   Car Plate No. + Owner IC / Company SSM + Postal Code → Get quotation ("Bear with us") →
 *   [Step 1 Car Details, not always] → Step 2 All Quotations → Buy → Step 3 Add-ons → Continue →
 *   Step 4 Confirmation (owner details) → Confirm and Pay → Step 5 Payment (Fiuu popup) → Step 6 Success.
 *
 * `stopAfter`:
 *   `home`          on Home, promo closed, nothing typed
 *   `form`          tab chosen, the three fields typed and read back; Get quotation NOT pressed
 *   `quotations`    (default) on All Quotations, the cards settled and read; nothing bought.
 *                   A refused quote throws `SecarangQuoteRefused` (no instant quotation / vehicle not found /
 *                   the two-month-rule visitor form, which is never filled: it would create a CIBO lead)
 *   `addOns`        Buy pressed on `insurer`: on Add-ons, `addOns` ADDed; Continue NOT pressed
 *   `confirmation`  Continue (reminder pop-up answered): on Confirmation, `owner` filled, discount applied,
 *                   summary read; Confirm and Pay NOT pressed
 *   `paymentPage`   Confirm and Pay pressed: on "How would you like to pay?", tiles read; nothing chosen
 *   `paid`          FINAL (PAYS, sandbox money, real record): the channel's Fiuu window driven to `outcome`;
 *                   success = on "Thank you for your purchase!", read and returned on arrival; failed = back on
 *                   the payment page with "Unsuccessful payment"
 *   `receipt`       after a successful `paid`: the [Receipt] PDF downloaded
 *
 * Hooks for a CR spec (29.10.2026, EAINT-12406 E2E sheet; same idea as `dereg.flow.ts` `onStep`):
 *   `onStep(step, r)`   called on arrival at every step the run passes, BEFORE the flow moves on, so a spec proves a
 *                       point on the screen it is about (e.g. the Allianz card on All Quotations) without walking the
 *                       wizard itself. For `paid` it is called once per attempt (see `failFirst`).
 *   `aroundPayment`     wraps each Fiuu attempt (the CR `ts` fixture passes `ts.payWindow`, which keeps the site's
 *                       payment window open instead of closing it as a stray tab).
 *   `failFirst`         payment attempts made BEFORE `payment`, each one failing (FPX status not 00, GrabPay /
 *                       ShopeePay "failed") or cancelled (ShopeePay [Cancel the transaction] > OK); after each the
 *                       run is back on the payment page and `onStep("paid", r)` sees it (r.payment = that attempt).
 *                       A hook that leaves the page (to look the attempt up in CIBO) must come back to
 *                       `r.paymentUrl` before it returns (`SecarangPaymentPage.reopen`).
 *   `switchTo` + `onSwitch` (29.10.2026, EAINT-12406 E2E_TS10) from Confirmation: [Edit] Add-Ons, then the plan's
 *                       [Edit] > "Change your insurance plan?" > Change > All Quotations > Buy another insurer. Unset,
 *                       the journey is the one verified before.
 *   `lookFirst` (29.10.2026, EAINT-12406 E2E_TS9) on All Quotations: Buy another insurer first, its Add-ons, "Back to
 *                       insurance selection", then Buy `insurer`. Unset, the journey is the one verified before.
 *
 * Side effects. Home → `quotations`: a quotation (the simulator answers on /ia/; whether a quotation alone
 * leaves a CIBO "Quotation" row is not checked). From `addOns` on, the purchase is under way and CIBO records
 * the transaction (team doc §6: Step 4 or 5 creates a record even without payment). `confirmation` needs
 * `owner`: the WhatsApp / email receipts go to the phone / email typed there, so they must be the QA's own
 * (Azfar 28.10.2026: no full purchase until he gives them). Never on production beyond the payment page
 * (team doc §2).
 *
 * Register: UNVERIFIED (src/flows/README.md).
 */

import type { Download, Page } from "@playwright/test";
import { SecarangHomePage, type SecarangOwnerTab, type SecarangQuoteForm } from "@pages/secarang/home.page";
import { SecarangSiteGatePage } from "@pages/secarang/site-gate.page";
import { SecarangCarDetailsPage } from "@pages/secarang/car-details.page";
import { SecarangQuotationsPage, type SecarangQuoteCard, type SumInsuredChoice } from "@pages/secarang/quotations.page";
import { SecarangAddOnsPage, type SecarangAddOn } from "@pages/secarang/add-ons.page";
import { SecarangConfirmationPage, type SecarangOwner } from "@pages/secarang/confirmation.page";
import { SecarangPaymentPage, FPX_BANK, type SecarangPayChannel } from "@pages/secarang/payment.page";
import { SecarangFiuuPopup, type FiuuOutcome, type SandboxCard } from "@pages/secarang/fiuu-popup.page";
import { SecarangSuccessPage } from "@pages/secarang/success.page";
import { secarangScreen, type SecarangScreen, type SecarangMenu } from "@pages/secarang/secarang.page";
import { SecarangAboutUsPage } from "@pages/secarang/about-us.page";
import { SecarangFaqPage } from "@pages/secarang/faq.page";
import { SecarangSupportPage } from "@pages/secarang/support.page";
import { SECARANG_QUOTE_CANDIDATES, FIUU_SANDBOX_CARDS } from "@data/secarang";

export type SecarangStep = "home" | "form" | "quotations" | "addOns" | "confirmation" | "paymentPage" | "paid" | "receipt";
const ORDER: SecarangStep[] = ["home", "form", "quotations", "addOns", "confirmation", "paymentPage", "paid", "receipt"];

/** Get quotation was answered with a pop-up instead of quotations. `kind` = the pop-up (see SecarangScreen). */
export class SecarangQuoteRefused extends Error {
  constructor(
    readonly kind: "no-quote" | "vehicle" | "visitor-form" | "leave" | "other" | "timeout",
    readonly popupText: string,
    readonly form: SecarangQuoteForm,
  ) {
    super(`Secarang did not quote ${form.plateNo} (${kind}): "${popupText.slice(0, 220)}"`);
    this.name = "SecarangQuoteRefused";
  }
}

export interface SecarangPayment {
  channel: SecarangPayChannel;
  /** FPX bank code (default Maybank2u `fpx_mb2u`). */
  bank?: string;
  /**
   * Default "success". FPX: success = status 00, failed = `fpxFailCode` (default "51"). "cancelled" = ShopeePay
   * only: [Cancel the transaction] > [OK] on the Fiuu window [doc §5].
   */
  outcome?: FiuuOutcome | "cancelled";
  fpxFailCode?: string;
  /** Card channel: default the sandbox Visa. */
  card?: SandboxCard;
}

export interface SecarangScenario {
  /** Default "Private Car". */
  tab?: SecarangOwnerTab;
  /** Default the first made-up candidate in @data/secarang. */
  form?: SecarangQuoteForm;
  /** Car Details variant (label contains, any case); default the first one offered when a dropdown asks. */
  variant?: string;
  /** The insurer to Buy, as its card's logo alt names it (e.g. "Lonpac", "Allianz", "Tokio Marine"). Needed from `addOns`. */
  insurer?: string;
  sumInsured?: SumInsuredChoice;
  /** Add-on names to ADD (text on the card). */
  addOns?: string[];
  /** Needed from `confirmation`. The QA's own phone and email (receipts are sent there). */
  owner?: SecarangOwner;
  discountCode?: string;
  /** Needed for `paid`. */
  payment?: SecarangPayment;
  /** Attempts made before `payment`, each failing or cancelled (see the header). */
  failFirst?: SecarangPayment[];
  /**
   * Switch insurer from Confirmation (29.10.2026, EAINT-12406 E2E_TS10). After Confirmation of `insurer` (onStep
   * "confirmation" seen for it): unless `editAddOnsFirst` is false, the price box's "Add-Ons" [Edit] (back to Add-ons)
   * and Continue back to Confirmation; then the plan's [Edit] > "Change your insurance plan?" > Change > All
   * Quotations > Buy `switchTo.insurer` > Add-ons > Continue > Confirmation (owner filled again: the pop-up says
   * the keyed-in details are lost). onStep then fires again for quotations / addOns / confirmation, with
   * `r.insurerNow` = the new insurer. Needs `stopAfter` "confirmation" or later.
   */
  switchTo?: { insurer: string; editAddOnsFirst?: boolean };
  /**
   * Look at another insurer's Add-ons first (29.10.2026, EAINT-12406 E2E_TS9): on All Quotations Buy
   * `lookFirst.insurer`, wait for its Add-ons, press "Back to insurance selection" (a pop-up, if one shows, is kept in
   * `r.lookedFirst.popup` and answered with its proceed button), wait for All Quotations again, then Buy `insurer` as
   * usual. onStep fires for that insurer's "addOns" (`r.insurerNow` = it) and for "quotations" again (`r.insurerNow` =
   * `insurer`). Needs `stopAfter` "addOns" or later. Unset, the journey is the one verified before.
   */
  lookFirst?: { insurer: string };
  /** Called at each switch point, on its screen: "addOnsEdit" (on Add-ons after the Add-Ons [Edit]), "planEditPopup" (pop-up open, before Change). */
  onSwitch?: (at: "addOnsEdit" | "planEditPopup", r: SecarangResult) => Promise<void>;
  /** Called on arrival at each step (see the header). */
  onStep?: (step: SecarangStep, r: SecarangResult) => Promise<void>;
  /** Wraps each Fiuu attempt, e.g. `(what, fn) => ts.payWindow(what, fn)`. */
  aroundPayment?: <T>(what: string, fn: () => Promise<T>) => Promise<T>;
  /** Default "quotations". */
  stopAfter?: SecarangStep;
}

export interface SecarangAttempt {
  channel: SecarangPayChannel;
  outcome: "success" | "failed" | "cancelled";
  detail: string;
  /** The payment page's "Unsuccessful payment …" line after a failed / cancelled attempt ("" when none). */
  unsuccessful?: string;
}

export interface SecarangResult {
  stoppedAfter: SecarangStep;
  form: SecarangQuoteForm;
  tab: SecarangOwnerTab;
  gatePassed?: boolean;
  promo?: string;
  /** The Car Details panel's lines, when that step showed. */
  carDetails?: string[];
  variant?: string;
  /** The screens passed through after Get quotation, in order (for the record). */
  screens?: SecarangScreen[];
  quotations?: SecarangQuoteCard[];
  sumInsured?: { applied: boolean; value: string; priceBefore: string; priceAfter: string };
  addOns?: { offered: SecarangAddOn[]; done: string[]; notListed: string[]; popups: string[]; reminder?: string };
  confirmation?: Record<string, string>;
  discountApplied?: boolean;
  tiles?: string[];
  payment?: SecarangAttempt;
  /** Every attempt in order (failFirst ones, then the final one). */
  attempts?: SecarangAttempt[];
  /** The payment page's address ("How would you like to pay?"), to come back to after a look elsewhere. */
  paymentUrl?: string;
  success?: Record<string, string>;
  receipt?: Download;
  /** The insurer being bought now (`insurer`, or `switchTo.insurer` after the switch). */
  insurerNow?: string;
  /** With `switchTo`: what the switch saw. */
  switched?: { from: string; to: string; addOnsEdited: boolean; popup: string };
  /** With `lookFirst`: the insurer looked at, its add-ons, and the pop-up "Back to insurance selection" raised ("no pop-up" when none). */
  lookedFirst?: { insurer: string; addOns: SecarangAddOn[]; popup: string };
  page: Page;
}

export async function runSecarangFlow(page: Page, s: SecarangScenario = {}): Promise<SecarangResult> {
  const stopAfter = s.stopAfter ?? "quotations";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: SecarangStep) => ORDER.indexOf(st) <= stopAt;
  if (reaches("addOns") && !s.insurer) throw new Error(`stopAfter "${stopAfter}" buys a quotation: pass insurer.`);
  if (reaches("confirmation") && !s.owner) throw new Error(`stopAfter "${stopAfter}" fills Confirmation: pass owner (the QA's own phone and email).`);
  if (reaches("paid") && !s.payment) throw new Error(`stopAfter "${stopAfter}" pays: pass payment.`);
  if (s.switchTo && !reaches("confirmation")) throw new Error(`switchTo starts on Confirmation: stopAfter "${stopAfter}" ends before it.`);
  if (s.lookFirst && !reaches("addOns")) throw new Error(`lookFirst buys a quotation: stopAfter "${stopAfter}" ends before Add-ons.`);

  const tab = s.tab ?? "Private Car";
  const { note: _note, ...firstCandidate } = SECARANG_QUOTE_CANDIDATES[0];
  const form = s.form ?? firstCandidate;
  const r: SecarangResult = { stoppedAfter: "home", form, tab, page };
  const out = (st: SecarangStep): SecarangResult => ({ ...r, stoppedAfter: st });
  const arrived = async (st: SecarangStep) => {
    if (s.onStep) await s.onStep(st, out(st));
  };

  // ---------------------------------------------------------------- Home
  const home = new SecarangHomePage(page);
  const opened = await home.open();
  r.gatePassed = opened.gatePassed;
  r.promo = opened.promo;
  await arrived("home");
  if (!reaches("form")) return out("home");

  await home.chooseTab(tab);
  await home.fill(form);
  await arrived("form");
  if (!reaches("quotations")) return out("form");

  // ---------------------------------------------------- Get quotation → All Quotations
  await home.getQuotation();
  const quotes = new SecarangQuotationsPage(page);
  const car = new SecarangCarDetailsPage(page);
  const gate = new SecarangSiteGatePage(page);
  r.screens = [];
  let carDone = false;
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > 240_000) {
      throw new SecarangQuoteRefused("timeout", `no quotation screen within 240 s (last ${r.screens.slice(-1)[0] ?? "-"}, ${page.url()})`, form);
    }
    const { screen, text } = await secarangScreen(page);
    if (r.screens[r.screens.length - 1] !== screen) r.screens.push(screen);
    if (screen.startsWith("popup:")) {
      throw new SecarangQuoteRefused(screen.slice(6) as SecarangQuoteRefused["kind"], text, form);
    }
    if (screen === "site-gate") await gate.passIfShown();
    else if (screen === "car-details" && !carDone) {
      r.carDetails = await car.read();
      r.variant = await car.chooseVariant(s.variant);
      await car.tickDeclarations();
      await car.getQuotation();
      carDone = true;
    } else if (screen === "quotations") break;
    await page.waitForTimeout(1_500);
  }
  await quotes.waitForCards();
  r.quotations = await quotes.readCards();
  await arrived("quotations");
  if (!reaches("addOns")) return out("quotations");

  // ---------------------------------------------------------------- Buy → Add-ons
  const addOns = new SecarangAddOnsPage(page);
  const confirm = new SecarangConfirmationPage(page);

  // ---------------------------------------------------- look at another insurer's Add-ons first (optional, see lookFirst)
  if (s.lookFirst) {
    r.insurerNow = s.lookFirst.insurer;
    await quotes.buy(s.lookFirst.insurer);
    await addOns.waitForPage();
    const looked = await addOns.read();
    r.addOns = { offered: looked, done: [], notListed: [], popups: [] };
    r.lookedFirst = { insurer: s.lookFirst.insurer, addOns: looked, popup: "" };
    await arrived("addOns");
    r.lookedFirst.popup = (await addOns.backToQuotations()).popup;
    await quotes.waitForCards();
    r.quotations = await quotes.readCards();
    r.insurerNow = s.insurer;
    await arrived("quotations");
  }
  const buyToAddOns = async (insurer: string, sumInsured?: SumInsuredChoice) => {
    r.insurerNow = insurer;
    if (sumInsured) r.sumInsured = await quotes.chooseSumInsured(insurer, sumInsured);
    await quotes.buy(insurer);
    await addOns.waitForPage();
    const offered = await addOns.read();
    const set = s.addOns?.length ? await addOns.set(s.addOns, "add") : { done: [], notListed: [], popups: [] };
    r.addOns = { offered, ...set };
    await arrived("addOns");
  };
  const continueToConfirmation = async () => {
    r.addOns!.reminder = (await addOns.continue()).reminder;
    await confirm.waitForPage();
    await confirm.fillOwner(s.owner!);
    if (s.discountCode) r.discountApplied = await confirm.applyDiscount(s.discountCode);
    r.confirmation = await confirm.read();
    await arrived("confirmation");
  };
  await buyToAddOns(s.insurer!, s.sumInsured);
  if (!reaches("confirmation")) return out("addOns");

  // ---------------------------------------------------------------- Confirmation
  await continueToConfirmation();

  // ---------------------------------------------------- switch insurer from Confirmation (optional, see switchTo)
  if (s.switchTo) {
    r.switched = { from: s.insurer!, to: s.switchTo.insurer, addOnsEdited: false, popup: "" };
    if (s.switchTo.editAddOnsFirst !== false) {
      await confirm.editAddOns();
      await addOns.waitForPage();
      r.addOns = { ...r.addOns!, offered: await addOns.read() };
      r.switched.addOnsEdited = true;
      if (s.onSwitch) await s.onSwitch("addOnsEdit", out("confirmation"));
      r.addOns.reminder = (await addOns.continue()).reminder;
      await confirm.waitForPage();
    }
    r.switched.popup = await confirm.openChangePlan(s.insurer!);
    if (s.onSwitch) await s.onSwitch("planEditPopup", out("confirmation"));
    await confirm.confirmChangePlan();
    await quotes.waitForCards();
    r.quotations = await quotes.readCards();
    r.insurerNow = s.switchTo.insurer;
    await arrived("quotations");
    await buyToAddOns(s.switchTo.insurer);
    await continueToConfirmation();
  }
  if (!reaches("paymentPage")) return out("confirmation");

  // ---------------------------------------------------------------- Payment page
  await confirm.confirmAndPay();
  const pay = new SecarangPaymentPage(page);
  await pay.waitForPage();
  r.tiles = await pay.tiles();
  r.paymentUrl = page.url();
  await arrived("paymentPage");
  if (!reaches("paid")) return out("paymentPage");

  // ---------------------------------------------------------------- Fiuu → Success (FINAL)
  const around = s.aroundPayment ?? (<T>(_what: string, fn: () => Promise<T>) => fn());
  const attempt = async (p: SecarangPayment): Promise<SecarangAttempt> => {
    const outcome = p.outcome ?? "success";
    if (outcome === "cancelled" && p.channel !== "shopeepay") throw new Error(`Payment outcome "cancelled" is ShopeePay only (got ${p.channel}).`);
    const detail = await around(`${p.channel} ${outcome}`, async () => {
      if (p.channel === "fpx") {
        const fiuu = new SecarangFiuuPopup(await pay.openFpx(p.bank ?? FPX_BANK.maybank2u));
        const res = await fiuu.payFpx(outcome === "success" ? "00" : p.fpxFailCode ?? "51");
        return `FPX ${p.bank ?? FPX_BANK.maybank2u}, TAC typed, window closed: ${res.closed}`;
      }
      const { popup, via } = await pay.openGateway(p.channel);
      const fiuu = new SecarangFiuuPopup(popup);
      if (p.channel === "card") {
        const c = await fiuu.payCard(p.card ?? FIUU_SANDBOX_CARDS.visa);
        return `card (window via ${via}), 3D Secure at ${c.threeDsUrl.split("?")[0]}, closed: ${c.closed}`;
      }
      const asked: FiuuOutcome = outcome === "success" ? "success" : "failed";
      if (p.channel === "grabpay") return `GrabPay ${outcome} (window via ${via}), closed: ${(await fiuu.payGrab(asked)).closed}`;
      if (outcome === "cancelled") {
        await fiuu.cancelShopee();
        return `ShopeePay cancelled (window via ${via}), closed: ${await fiuu.waitForClose(30_000)}`;
      }
      return `ShopeePay ${outcome} (window via ${via}), closed: ${(await fiuu.payShopee(asked)).closed}`;
    });
    if (outcome === "failed") {
      await page.getByText(/Unsuccessful payment/i).first().waitFor({ timeout: 120_000 });
      return { channel: p.channel, outcome, detail, unsuccessful: await pay.unsuccessfulMessage() };
    }
    if (outcome === "cancelled") {
      await pay.waitForPage(); // back on "How would you like to pay?" [doc §5]
      return { channel: p.channel, outcome, detail, unsuccessful: await pay.unsuccessfulMessage() };
    }
    return { channel: p.channel, outcome, detail };
  };
  r.attempts = [];
  for (const early of s.failFirst ?? []) {
    if ((early.outcome ?? "success") === "success") throw new Error("failFirst: every early attempt must be failed or cancelled.");
    r.payment = await attempt(early);
    r.attempts.push(r.payment);
    await arrived("paid"); // back on the payment page; a hook that looks elsewhere must come back to r.paymentUrl
  }
  r.payment = await attempt(s.payment!);
  r.attempts.push(r.payment);
  if (r.payment.outcome !== "success") {
    await arrived("paid");
    return out("paid"); // FINAL: back on the payment page, nothing pressed after arrival
  }
  const success = new SecarangSuccessPage(page);
  await success.waitForPage();
  r.success = await success.read();
  await arrived("paid");
  if (!reaches("receipt")) return out("paid"); // FINAL: success page, returned on arrival

  r.receipt = await success.downloadReceipt();
  await arrived("receipt");
  return out("receipt");
}

// ==================================================================== the information pages (About Us, FAQs, Support)

/**
 * Open one of the top-menu pages the way a visitor does: Home (`car-insurance`, site password page if it shows,
 * promo closed), then the menu link in the desktop bar. If the tab is already on a Secarang page past the site
 * password (any menu page or Home), only the menu link is clicked. Read only: nothing typed but the site password.
 *
 * Added 29.10.2026 for EAINT-12406 sheet CP (REQ-001, 007, 008, 009); menu selector from the probe
 * cr/EAINT-12406/03-spec/probes-automation/cp-pages-probe.mjs (29.10.2026). UNVERIFIED with the rest of this flow;
 * covered by tests/flows/secarang.verify.spec.ts "info pages".
 */
export async function openSecarangInfoPage(page: Page, menu: SecarangMenu): Promise<{ url: string; gatePassed: boolean }> {
  const home = new SecarangHomePage(page);
  let gatePassed = false;
  const onSite = await home.menuLink(menu).isVisible().catch(() => false);
  if (!onSite) gatePassed = (await home.open()).gatePassed;
  const path = INFO_PATH[menu];
  // A promo pop-up (e.g. `ngb-modal-window.bnpl-popup-window`) can arrive a few seconds after a page and block the
  // menu (probe cp-marks-probe.mjs 29.10.2026): close it if it is up.
  await home.closePromo();
  await home.menuLink(menu).click();
  await page.waitForURL((u) => u.pathname.endsWith(`/${path}`), { timeout: 30_000 });
  // The site password page comes back per tab only, but check: a guard redirect would leave /auth/login here.
  if (await new SecarangSiteGatePage(page).passIfShown()) gatePassed = true;
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await home.closePromo();
  const pages = { "About Us": SecarangAboutUsPage, FAQs: SecarangFaqPage, Support: SecarangSupportPage } as const;
  await new pages[menu](page).waitForPage();
  return { url: page.url(), gatePassed };
}

/** Where each menu link lands under the instance [probe 29.10.2026: /ia/about-us, /ia/faq, /ia/support]. */
const INFO_PATH: Record<SecarangMenu, string> = { "About Us": "about-us", FAQs: "faq", Support: "support" };
