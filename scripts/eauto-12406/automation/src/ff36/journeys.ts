/**
 * Firefox 36 journeys: the step lists `ts.ff36.run()` drives (EAINT-12253, 21.10.2026).
 *
 * The Playwright flows (`src/flows/`) cannot drive Firefox 36, so the part of a journey that has to happen in the
 * REAL Firefox 36 is written here, once, as plan builders. A CR spec composes them and adds only its proofs.
 * Card / thumbprint steps are never automated here (Java applet): the spec does them in Chrome with the flows first, or
 * (22.10.2026, the "BY HAND" plans at the end) a person does them on the Firefox 36 window during a `manual` step.
 *
 * Every selector below was SEEN on the live pages, not guessed:
 *  - STMS / UCD to UCD / Interstate buyer Step 5 → 6, Done `#to-view`: the 21.10 Firefox 36 after-runs on /uat1/
 *    (cr/EAINT-12253/03-spec/after/ex1_stms_ff36.py, ex3_buyer_ff36.py, ff1_stms_ff36.py; run logs in 05-evidence).
 *  - eSTM Step 5 add-ons `#lkm-addson-checkbox` / `#evoc-addson-checkbox` and its two confirms: ex2_estm_ff36.py (21.10).
 *  - APT Step 5 + "Payment request sent" and its [OK] → the APT listing: ex4_apt_ff36.py (12253_EX_TS4 run log) and
 *    `pages/ucd/apt.page.ts`; APT Step 6 `apt/transaction/jpj-sub.do` ("JPJ Transfer Status") by F5 on the paid APT's
 *    payment page: 12253_BEH_TS1 run 21.10.2026 16:57 (FAILED/12253_BEH_TS1/2026-10-21T08-59-25_DEFECT).
 *  - Insurance Step 3 `a#to-pay` → `plan/complete.do`: ex5_insurance_ff36.py; free quote / plan wizard:
 *    `pages/ucd/insurance.page.ts` (walked 20.10, probes p06 / p09 / p15 / p16).
 *  - JomCheck `#create-tx`, `#vehicleNoRadio`, `#vehicleRegNo`, `#to-check-vehicle`, `#to-pay`, `#to-view-report`:
 *    probes-2110/p06_ff36_jomcheck.py (real Firefox 36, 21.10) and `pages/ucd/jomcheck.page.ts`.
 *  - Service Hub: `pages/ucd/service-hub.page.ts` (probes p01 / p02 / p04 / p10, 20-21.10).
 *  - AATF eDEREG tiles, pre-check and Deregistration Step 5 / 6: ex7_dereg_ff36.py and `pages/aatf/*.page.ts`.
 * Status: UNVERIFIED as a whole (no verify spec of its own); the pieces above ran live in Firefox 36 or Chrome.
 *
 * The reminder (div#eauto-browser-reminder) is only READ here, except where a plan presses its own buttons
 * (Continue / View User Guide) because the TS says so.
 */
import * as path from "node:path";
import type { Ff36Action, Ff36Listing, Ff36Result, Ff36StepResult } from "@fixtures/ff36-step";

/** A plan whose steps carry labels, so a spec reads `plan.at(r, "final-arrival")` instead of counting indexes. */
export class Ff36Plan {
  readonly steps: Ff36Action[] = [];
  private readonly labels = new Map<string, number>();

  add(label: string | null, step: Ff36Action): this {
    if (label) {
      if (this.labels.has(label)) throw new Error(`Ff36Plan: label "${label}" used twice`);
      this.labels.set(label, this.steps.length);
    }
    this.steps.push(step);
    return this;
  }

  /** The result of the labelled step, or undefined when the plan stopped before it. */
  at(r: Ff36Result | undefined, label: string): Ff36StepResult | undefined {
    const i = this.labels.get(label);
    if (i === undefined) throw new Error(`Ff36Plan: no step labelled "${label}"`);
    const s = r?.steps[i];
    return s && s.ok ? s : undefined;
  }

  has(label: string): boolean {
    return this.labels.has(label);
  }
}

// ------------------------------------------------------------------ the reminder

/**
 * A "no reminder" read: waits up to `waitS` (default 8 s) for the reminder to APPEAR, then reads it. So state "absent"
 * means it did not show in that time (a plain read would return at once and miss a late one).
 */
export const noReminder = (shot: string, waitS = 8): Ff36Action => ({ do: "reminder", expect: "shown", waitS, shot });
/** A "reminder expected" read on arrival: waits up to 15 s for it to show. */
export const reminderOnArrival = (shot: string, waitS = 15): Ff36Action => ({ do: "reminder", expect: "shown", waitS, shot });

/**
 * The common tail of a final step: [Continue 继续] (state after it), the screen still usable (`usable` marker),
 * F5 (state after the reload, `marker` waited for first), and the reminder closed again if it came back so the
 * TS's next button can be reached. Labels: continue, usable, f5, f5-continue.
 *
 * F5: Azfar / BA 21.10.2026 (EAINT-12574 being closed): the reminder shows EACH time the final step loads, so the
 * spec expects it shown again after F5.
 */
export function continueThenF5(p: Ff36Plan, o: { marker: { css?: string; text?: string; url?: string }; usable: { css: string; text?: string }; ifShown?: boolean }) {
  // `ifShown` (21.10.2026, APT Step 6): when the reminder is not up, press nothing and go on (the step's text says
  // "reminder not shown: nothing pressed", state absent) instead of failing the plan; the spec must not read that as
  // "Continue closed it" (_checks.ts proveAfterContinueAndF5 does not).
  p.add("continue", { do: "reminderButton", which: "continue", shot: "after-continue", ...(o.ifShown ? { ifShown: true } : {}) });
  p.add("usable", { do: "waitFor", css: o.usable.css, text: o.usable.text, timeoutS: 10, soft: true });
  p.add(null, { do: "refresh" });
  p.add(null, { do: "waitFor", ...o.marker, timeoutS: 60 });
  p.add("f5", { do: "reminder", expect: "shown", waitS: 12, shot: "after-f5" });
  p.add("f5-continue", { do: "reminderButton", which: "continue", ifShown: true });
}

// ------------------------------------------------------------------ sign-in

/**
 * Sign in. `keepPopups`: screenshot the home page with its pop-ups still up (label "login"), read the EAINT-12180
 * "Announcement 公告" text (label "home-announcement"), then close them by their own close (label "home-popups-closed").
 */
export function signIn(p: Ff36Plan, as: Extract<Ff36Action, { do: "login" }>["as"], o: { keepPopups?: boolean } = {}) {
  p.add("login", { do: "login", as, keepPopups: o.keepPopups, shot: "home-after-login" });
  if (o.keepPopups) {
    p.add("home-announcement", { do: "read", from: "Announcement 公告", chars: 300 });
    p.add("home-popups-closed", { do: "closeHomePopups", shot: "home-popups-closed" });
  }
}

// ------------------------------------------------------------------ STMS family (STMS, UCD to UCD Standard, Interstate buyer)

/**
 * From the STMS Transaction Listing: [Resubmit] → Step 5 Payment (read on arrival, Payment Summary, the 48-hour line
 * when there is one) → [STMS Payment] → "Sure to submit this payment?" Yes → Step 6 Transfer ("JPJ Transfer Status").
 * Labels: resubmit, step5, step5-arrival, step5-summary, step5-notice, pay-button, step5-after-button, pay-confirm,
 * step6, final-arrival, step6-status. Stops ON Step 6 with the reminder read, nothing pressed.
 */
export function stmsPayToStep6(p: Ff36Plan, o: { vehicle: string; listing?: Ff36Listing }) {
  p.add("resubmit", { do: "resubmit", listing: o.listing ?? "stms", ref: o.vehicle, vehicle: o.vehicle });
  p.add("step5", { do: "waitFor", url: "stms/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  p.add("step5-summary", { do: "read", from: "Payment Summary", chars: 420 });
  p.add("step5-notice", { do: "read", from: "Please make the payment before", chars: 260 });
  p.add("pay-button", { do: "click", css: "#to-payment" });
  p.add("step5-after-button", noReminder("step5-after-pay-button", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, shot: "step5-pay-confirm" });
  p.add("step6", { do: "waitFor", css: "body", text: "JPJ Transfer Status", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("step6-arrival"));
  p.add("step6-status", { do: "read", from: "JPJ Transfer Status", chars: 80 });
}

/** Step 6 tail: Continue, F5, then [Done] (`#to-view` → the transaction view). Labels as continueThenF5 + done. */
export function stmsStep6ContinueF5Done(p: Ff36Plan) {
  continueThenF5(p, { marker: { css: "body", text: "JPJ Transfer Status" }, usable: { css: "#to-view" } });
  p.add(null, { do: "click", css: "#to-view" });
  p.add("done", { do: "waitFor", url: "enquiry/view\\.do", timeoutS: 30, soft: true, shot: "after-done" });
}

// ------------------------------------------------------------------ eSTM (eSerahan) Step 5 with eLKM unticked

/**
 * From the eSTM listing: [Resubmit] → Step 5 Payment → eLKM unticked, eVOC set to `evoc` (soft: the TS records it when
 * eVOC cannot be set alone) → Next → "Sure to proceed with payment?" Next → "Sure to make this payment now?" OK →
 * whatever comes after the payment (eLKM unticked: the insurance plan page, `isDirectEstmFirstTime=true`).
 * `evoc: false` UNTICKS eVOC (21.10.2026): Step 5 opens with eVOC already ticked (every run so far read "ticked ->"), so
 * before this, false only left the page's default and FF_TS8 r4 route B paid eVOC RM10.00 ("You have selected the
 * following add-on service(s) : eVOC"). Now the step text records "ticked -> unticked".
 * Labels: resubmit, step5, step5-arrival, elkm-off, evoc-on | evoc-off, step5-evoc, step5-summary, pay-button,
 * step5-after-button, confirm-1, between-confirms, confirm-2, after-payment, after-payment-reminder, after-payment-strip,
 * after-payment-active.
 */
export function estmPayElkmUnticked(p: Ff36Plan, o: { vehicle: string; evoc: boolean }) {
  p.add("resubmit", { do: "resubmit", listing: "estm", ref: o.vehicle, vehicle: o.vehicle });
  p.add("step5", { do: "waitFor", url: "estm/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  p.add("elkm-off", { do: "check", css: "#lkm-addson-checkbox", on: false });
  if (o.evoc) p.add("evoc-on", { do: "check", css: "#evoc-addson-checkbox", on: true, soft: true });
  else p.add("evoc-off", { do: "check", css: "#evoc-addson-checkbox", on: false, soft: true });
  p.add("step5-evoc", noReminder(o.evoc ? "step5-evoc-ticked" : "step5-addons-set", 4));
  p.add("step5-summary", { do: "read", from: "Payment Summary", chars: 600 });
  p.add("pay-button", { do: "click", css: "#to-payment" });
  p.add("step5-after-button", noReminder("step5-after-pay-button", 3));
  p.add("confirm-1", { do: "confirm", accept: true, timeoutS: 20, shot: "step5-confirm-1" });
  p.add("between-confirms", noReminder("step5-confirm-2-open", 3));
  p.add("confirm-2", { do: "confirm", accept: true, timeoutS: 30, shot: "step5-confirm-2" });
  p.add("after-payment", { do: "waitFor", url: "/insurance/|estm-sub\\.do", timeoutS: 150 });
  p.add("after-payment-reminder", noReminder("after-payment"));
  p.add("after-payment-strip", { do: "read", css: ".md-stepper-horizontal .md-step .md-step-title" });
  p.add("after-payment-active", { do: "read", css: ".md-stepper-horizontal .md-step.active .md-step-title" });
}

// ------------------------------------------------------------------ insurance plan wizard

/** Plan page (Quotes) → SELECT the first insurer → Optional Coverage. Labels: quotes, select, optional, optional-actions. */
export function insuranceQuotesToOptional(p: Ff36Plan, tag: string) {
  p.add(`${tag}quotes`, { do: "waitFor", url: "insurance/plan/view\\.do", css: "button.select-plan-btn", timeoutS: 90 });
  p.add(`${tag}select`, { do: "click", css: "button.select-plan-btn" });
  p.add(`${tag}optional`, { do: "waitFor", url: "insurance/plan/select\\.do", css: ".md-step.active .md-step-title", text: "Optional Coverage", timeoutS: 60, shot: `${tag}optional-coverage` });
  p.add(`${tag}optional-actions`, { do: "read", css: "#confirm-plan, #save-plan, #backBtn" });
}

/**
 * Optional Coverage → Make Payment (`#confirm-plan`) → Step 3 Payment → PAY NOW → "Payment" OK → Step 4 Confirm
 * ("Thank you! Your payment has been successfully made."). Labels (prefixed by tag): make-payment, payment,
 * payment-arrival, pay-button, payment-after-button, pay-confirm, confirm-page, final-arrival.
 */
export function insurancePayToConfirm(p: Ff36Plan, tag: string) {
  p.add(`${tag}make-payment`, { do: "click", css: "#confirm-plan" });
  insurancePayFromStep3(p, tag);
}

/**
 * Insurance listing → [Resubmit] on a Pending Payment insurance → Step 3 Payment (EX_TS5, /uat1/ 21.10.2026: Resubmit
 * lands on `plan/payment.do`) → PAY NOW → OK → Step 4 Confirm. Labels (prefixed by tag): resubmit, then as
 * insurancePayToConfirm from payment on.
 */
export function insuranceResubmitToConfirm(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}resubmit`, { do: "resubmit", listing: "insurance", ref: o.vehicle, vehicle: o.vehicle });
  insurancePayFromStep3(p, tag);
}

function insurancePayFromStep3(p: Ff36Plan, tag: string) {
  p.add(`${tag}payment`,{ do: "waitFor", url: "insurance/plan/payment\\.do", css: "a#to-pay", timeoutS: 90 });
  p.add(`${tag}payment-arrival`, noReminder(`${tag}payment-arrival`));
  p.add(`${tag}pay-button`, { do: "click", css: "a#to-pay" });
  p.add(`${tag}payment-after-button`, noReminder(`${tag}payment-after-pay-now`, 4));
  p.add(`${tag}pay-confirm`, { do: "confirm", accept: true, timeoutS: 60, shot: `${tag}payment-confirm` });
  p.add(`${tag}confirm-page`, { do: "waitFor", url: "insurance/plan/complete\\.do", css: "body", text: "Thank you! Your payment has been successfully made", timeoutS: 150 });
  p.add(`${tag}final-arrival`, reminderOnArrival(`${tag}step4-confirm-arrival`));
}

/** Step 4 Confirm tail: Continue, F5, then Done (`#doneBtn` / `#estmLkmDoneBtn`). Labels prefixed by tag. */
export function insuranceConfirmContinueF5Done(p: Ff36Plan, tag: string) {
  p.add(`${tag}continue`, { do: "reminderButton", which: "continue", shot: `${tag}after-continue` });
  p.add(`${tag}usable`, { do: "waitFor", css: "#doneBtn, #estmLkmDoneBtn", timeoutS: 10, soft: true });
  p.add(null, { do: "refresh" });
  p.add(null, { do: "waitFor", css: "body", text: "Thank you! Your payment has been successfully made", timeoutS: 60 });
  p.add(`${tag}f5`, { do: "reminder", expect: "shown", waitS: 12, shot: `${tag}after-f5` });
  p.add(`${tag}f5-continue`, { do: "reminderButton", which: "continue", ifShown: true });
  p.add(null, { do: "click", css: "#doneBtn, #estmLkmDoneBtn" });
  p.add(`${tag}done`, { do: "waitFor", url: "^(?!.*plan/complete\\.do)", timeoutS: 30, soft: true, shot: `${tag}after-done` });
}

/** GET A FREE QUOTE form (Individual) for a vehicle + buyer IC → Quotes. Labels (prefixed): form, quoted. */
export function insuranceFreeQuote(p: Ff36Plan, tag: string, o: { vehicle: string; buyerIc: string }) {
  p.add(null, { do: "goto", path: "view/ucd/insurance/home.do" });
  p.add(null, { do: "click", css: "#freeQuote" });
  p.add(`${tag}form`, { do: "waitFor", url: "insurance/quote/view\\.do", css: "#vehicleRegNo", timeoutS: 30 });
  // The page object presses "Individual" the same way and lets it miss (the form may open on Individual already).
  p.add(null, { do: "click", css: "label, span, a, div, td", text: "Individual", optional: true });
  // Click into the field first (the click waits 1 s): typing the moment a form appears lost letters on the pre-check
  // page in Firefox 36 (FF_TS12, 21.10.2026). See precheckPayToResult.
  p.add(null, { do: "click", css: "#vehicleRegNo" });
  p.add(null, { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add(null, { do: "fill", css: "#buyerRefIdCompanyROC", value: o.buyerIc });
  p.add(`${tag}quoted`, { do: "click", css: "#to-show-result", shot: `${tag}free-quote-form` });
}

// ------------------------------------------------------------------ JomCheck

/**
 * JomCheck by Vehicle No.: landing → PURCHASE → Submit (Result + Pay Now) → Pay Now ("Payment" dialog) → Yes →
 * the result after payment ("Report is retrieved successfully", Download Report `#to-view-report`).
 * Labels: form, submitted, submit-reminder, result, pay-now, pay-dialog-reminder, pay-confirm, paid, final-arrival.
 * `readLine` (added 21.10.2026 for 12253_FF_TS10; off by default, so the other plans are unchanged): also reads the
 * whole Result sentence from the page text (label result-line). `#result` holds only "Vehicle number found." (BEH_TS3
 * run 21.10); "Pay now (RM20.00 + 8% Service Tax) to purchase the report." sits next to it (JomCheckPage.resultText).
 */
export function jomcheckBuy(p: Ff36Plan, o: { vehicle: string; readLine?: boolean }) {
  p.add(null, { do: "goto", path: "view/ucd/jomcheck/view.do" });
  p.add(null, { do: "click", css: "#create-tx" });
  p.add("form", { do: "waitFor", url: "jomcheck/transaction/view\\.do", css: "#to-check-vehicle", timeoutS: 30 });
  p.add(null, { do: "click", css: "#vehicleNoRadio" });
  p.add(null, { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add(null, { do: "click", css: "#to-check-vehicle" });
  p.add("submitted", { do: "waitFor", url: "transactionId=", css: "#to-pay", timeoutS: 90 });
  p.add("submit-reminder", noReminder("after-submit"));
  p.add("result", { do: "read", css: "#result" });
  if (o.readLine) p.add("result-line", { do: "read", from: "Vehicle number found", chars: 120 });
  p.add("pay-now", { do: "click", css: "#to-pay" });
  p.add("pay-dialog-reminder", noReminder("pay-now-dialog", 5));
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "payment-dialog" });
  p.add("paid", { do: "waitFor", css: "#to-view-report", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("result-after-payment"));
}

// ------------------------------------------------------------------ Service Hub

/** Software Installation 1 Payment → Make Payment → Next (PAYS). Labels: payment, payment-arrival, strip, summary, pay-button, pay-dialog-reminder, pay-confirm. */
export function serviceHubSoftwareInstallationPay(p: Ff36Plan) {
  p.add(null, { do: "goto", path: "view/ucd/service-hub/view.do" });
  p.add(null, { do: "click", css: "#software-installation" });
  p.add("payment", { do: "waitFor", url: "service-hub/installation\\.do", css: "#si-pay-btn", timeoutS: 30 });
  serviceHubPay(p);
}

/**
 * Biometric Device Purchase 1 Selection (quantity 1, recipient, a valid contact no., ship to showroom) → Next →
 * 2 Payment (with / without installation) → Make Payment → Next (PAYS). Labels: selection, payment, optout,
 * payment-arrival, strip, summary, pay-button, pay-dialog-reminder, pay-confirm.
 */
export function serviceHubBiometricPay(p: Ff36Plan, o: { withInstallation: boolean; recipientName: string; contactNo: string }) {
  p.add(null, { do: "goto", path: "view/ucd/service-hub/view.do" });
  p.add(null, { do: "click", css: "#biometric-device-purchase" });
  p.add("selection", { do: "waitFor", url: "service-hub/purchase\\.do", css: "#qty", timeoutS: 30, shot: "1-selection" });
  // Click into the field first (1 s), then type: FF_TS13/16 ordered 11 devices after "1" was typed over "1" (21.10.2026);
  // the bridge's fill now also reads the value back. See precheckPayToResult.
  p.add(null, { do: "click", css: "#qty" });
  p.add(null, { do: "fill", css: "#qty", value: "1" });
  p.add(null, { do: "fill", css: "#authorizedReceiver", value: o.recipientName });
  p.add(null, { do: "fill", css: "#contactNo", value: o.contactNo });
  p.add(null, { do: "check", css: "#shipToShowroom", on: true });
  p.add(null, { do: "click", css: "button[type=submit]", text: "Next" });
  p.add("payment", { do: "waitFor", url: "service-hub/purchase/create\\.do", css: "#si-pay-btn", timeoutS: 30 });
  p.add("optout", { do: "check", css: "#installOptOut", on: !o.withInstallation });
  serviceHubPay(p);
}

function serviceHubPay(p: Ff36Plan) {
  p.add("payment-arrival", noReminder("payment-arrival"));
  p.add("strip", { do: "read", css: ".flow-steps .fs-step" });
  p.add("summary", { do: "read", from: "Payment Summary", chars: 500 });
  p.add("pay-button", { do: "click", css: "#si-pay-btn" });
  p.add("pay-dialog-reminder", noReminder("make-payment-dialog", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "payment-confirm" });
}

/**
 * After paying WITH an appointment: 2/3 Appointment (calendar read on arrival) → first free date (next month up to 3x)
 * → one installation in the first session with room → modal Confirm → Confirm Appointment → Submission
 * ("Request Submitted"). Labels: appointment, appointment-arrival, date, slot-modal, slot-reminder, submitted, final-arrival.
 */
export function serviceHubBookAndSubmit(p: Ff36Plan) {
  p.add("appointment", { do: "waitFor", url: "service-hub/installation/slot\\.do", css: "#si-confirm-booking", timeoutS: 150 });
  p.add("appointment-arrival", noReminder("appointment-arrival"));
  p.add("date", { do: "click", css: "td.si-book[onclick]", next: "#si-next", tries: 3 });
  p.add("slot-modal", { do: "waitFor", css: "#si-ovl", timeoutS: 15 });
  p.add("slot-reminder", noReminder("appointment-slot-modal", 3));
  p.add(null, { do: "click", css: "#si-inc0, #si-inc1", enabledOnly: true });
  p.add(null, { do: "click", css: "#si-confirm" });
  p.add(null, { do: "click", css: "#si-confirm-booking", shot: "appointment-booked" });
  p.add("submitted", { do: "waitFor", url: "service-hub/installation/submitted\\.do", css: "body", text: "Request Submitted", timeoutS: 90 });
  p.add("final-arrival", reminderOnArrival("submission-arrival"));
}

/**
 * After paying WITHOUT installation: whatever comes next (the page script sends PAID:SUB straight to Submission, not
 * confirmed on a paid run). Labels: after-payment (url read), after-payment-reminder-or-final.
 */
export function serviceHubAfterPaymentNoInstall(p: Ff36Plan) {
  p.add("after-payment", { do: "waitFor", url: "service-hub/installation/(submitted|slot)\\.do", timeoutS: 150 });
  p.add("after-payment-page", { do: "read", from: "", chars: 500 });
  p.add("final-arrival", reminderOnArrival("last-step-arrival"));
}

/** Service Hub Submission tail: Continue, F5. Labels as continueThenF5, submission-text, then serviceHubListing. */
export function serviceHubContinueF5Listing(p: Ff36Plan, serviceType: ServiceType) {
  continueThenF5(p, { marker: { css: "body", text: "Request Submitted" }, usable: { css: "body", text: "Request Submitted" } });
  p.add("submission-text", { do: "read", from: "Request Submitted", chars: 500 });
  serviceHubListing(p, serviceType);
}

export type ServiceType = "Software Installation" | "Biometric Device Purchase";

/**
 * Service Request Listing (`service-hub/listing.do`, probe p02: empty until "Search Now"): Service Type `#serviceType`
 * (values SOFTWARE_INSTALLATION / BIOMETRIC_PURCHASE) → Search Now → every row's text (label "listing", rows joined " | ").
 */
export function serviceHubListing(p: Ff36Plan, serviceType: ServiceType) {
  p.add(null, { do: "goto", path: "view/ucd/service-hub/listing.do" });
  p.add(null, { do: "select", css: "#serviceType", value: serviceType === "Software Installation" ? "SOFTWARE_INSTALLATION" : "BIOMETRIC_PURCHASE" });
  p.add(null, { do: "click", css: "button, input[type=button], input[type=submit], a", text: "Search Now" });
  p.add("listing", { do: "read", css: "table tr", chars: 4000, shot: "service-request-listing" });
}

// ------------------------------------------------------------------ AATF: e-Dereg Pre-Checking and Deregistration

/**
 * e-Dereg Pre-Checking from the eDEREG tile: Step 1 vehicle + email + perakuan → ENQUIRE NOW → Yes → Step 2 Payment
 * → NEXT → "Are you sure to make payment?" Yes → Step 3 Result ("Enquiry Response"). Labels: step1, step2,
 * step2-vehicle-read, step2-vehicle, step2-arrival, summary, pay-button, pay-dialog-reminder, pay-confirm, step3, final-arrival.
 *
 * 21.10.2026 (EAINT-12253 FF_TS12 triage): the bridge typed into #vehicleRegNo in the same second the form appeared and
 * "ON000133" was saved as "000133" (most likely the page's start-up script reset the field while the first keys went
 * in). So: click into each field first (the click waits 1 s), as the JomCheck plan does with its radio. And on Step 2,
 * BEFORE anything is paid, the page must show the vehicle that was typed; if not, `step2-vehicle` fails (a bridge
 * failure: the gate files it ENV, not DEFECT) and the run stops without paying.
 */
export function precheckPayToResult(p: Ff36Plan, o: { vehicle: string; email: string }) {
  p.add(null, { do: "click", css: "#DEREGISTRATION" });
  p.add(null, { do: "click", css: "#precheck-transaction" });
  p.add("step1", { do: "waitFor", url: "dereg/precheck/transaction/main\\.do", css: "#vehicleRegNo", timeoutS: 30 });
  p.add(null, { do: "click", css: "#vehicleRegNo" });
  p.add(null, { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add(null, { do: "click", css: "#jpjReceiptEmail" });
  p.add(null, { do: "fill", css: "#jpjReceiptEmail", value: o.email });
  p.add(null, { do: "click", css: "#aatf-consent" });
  p.add(null, { do: "click", css: "#to-enquiry" });
  p.add(null, { do: "confirm", accept: true, timeoutS: 20 });
  p.add("step2", { do: "waitFor", url: "precheck/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  // Step 2 reads "Vehicle Registration Number: <vehicle>" (FF_TS12 02-ff36-step2-payment-arrival.png, 21.10.2026). The
  // read is for the log; the check is the visible page text holding the typed vehicle in full ("000133" does not hold
  // "ON000133").
  p.add("step2-vehicle-read", { do: "read", from: "Vehicle Registration Number", chars: 60 });
  p.add("step2-vehicle", { do: "waitFor", css: "body", text: o.vehicle, timeoutS: 5 });
  p.add("step2-arrival", noReminder("step2-payment-arrival"));
  p.add("summary", { do: "read", from: "Payment Summary", chars: 400 });
  p.add("pay-button", { do: "click", css: "#to-payment" });
  p.add("pay-dialog-reminder", noReminder("step2-payment-dialog", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "step2-payment-confirm" });
  p.add("step3", { do: "waitFor", url: "precheck/transaction/result\\.do", css: "body", text: "Enquiry Response", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("step3-result-arrival"));
}

/**
 * Deregistration from its listing: [Resubmit] → Step 5 Payment → Next → the browser's own confirm ("Sure to submit this
 * payment to DEREGISTER?") OK → Step 6 ("JPJ Deregistration Status"). Labels: resubmit, step5, step5-arrival,
 * summary, pay-button, pay-confirm, step6, final-arrival.
 */
export function deregPayToStep6(p: Ff36Plan, o: { vehicle: string }) {
  p.add("resubmit", { do: "resubmit", listing: "dereg", ref: o.vehicle, vehicle: o.vehicle });
  p.add("step5", { do: "waitFor", url: "payment\\.do", css: "input#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  // Dereg Step 5 has no "Payment Summary" (found false in FF_TS11 r2 / r3): its line is "Click NEXT to pay and DEREGISTER."
  p.add("summary", { do: "read", from: "Click NEXT to pay", chars: 60 });
  p.add("pay-button", { do: "click", css: "input#to-payment" });
  // The confirm is the browser's own: the page cannot be read while it is up, so its shot is a window frame (it is NOT
  // drawn in that frame: only the greyed Next shows, EX_TS7). The step's text names it ("native: Sure to submit … -> OK").
  // Between the click and this step the bridge sends no page command while it is open (bridge.url(), 21.10.2026).
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "step5-pay-confirm" });
  p.add("step6", { do: "waitFor", url: "jpj-sub\\.do", css: "body", text: "JPJ Deregistration Status", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("step6-arrival"));
}

// ------------------------------------------------------------------ APT

/**
 * APT from its listing: [Resubmit] (+ its confirm) → Step 5 Payment → Next → "Sure to submit this payment?" Yes →
 * the result on the same page ("Payment request sent", the screen straight after paying; `final-arrival` reads the
 * reminder there). Labels: resubmit, step5, step5-arrival, summary, pay-button, step5-after-button, pay-confirm, sent,
 * final-arrival.
 *
 * Corrected 21.10.2026 (cr-triage APT / CD4, 05-evidence/triage-2026-10-21-apt.md): APT DOES have a Step 6, "Submission
 * (JPJ Transfer)" `apt/transaction/jpj-sub.do?id=` (step strip 5 Payment → 6 Transfer, "JPJ Transfer Status"). The
 * result's [OK] does NOT open it (it goes to the APT listing); reloading the paid APT's payment page does (BEH_TS1
 * 16:57, /uat1/). Go on with `aptResultOkThenStep6` to read the listing after [OK] and Step 6.
 */
export function aptPayToResult(p: Ff36Plan, o: { vehicle: string }) {
  p.add("resubmit", { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add("step5", { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  p.add("summary", { do: "read", from: "Payment Summary", chars: 420 });
  p.add("pay-button", { do: "click", css: "#to-payment" });
  p.add("step5-after-button", noReminder("step5-after-next", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "step5-pay-confirm" });
  p.add("sent", { do: "waitFor", css: ".ui-dialog", text: "Payment request sent", timeoutS: 150, soft: true });
  p.add("final-arrival", reminderOnArrival("after-payment-arrival"));
}

/**
 * After an APT payment, ON Step 5 with "Payment request sent" open (aptPayToResult / aptRetryPay): keep the payment
 * page's address → the result's [OK] (`button.confirm-dialog-btn` "OK", 12253_EX_TS4 run log 21.10.2026 12:04:11) →
 * the APT listing it opens (`apt/enquiry/`, reminder read) → the paid APT's payment page opened again by that address
 * (reminder read on arrival, wherever it lands) → F5 → Step 6 "Submission (JPJ Transfer)" `apt/transaction/jpj-sub.do`
 * with "JPJ Transfer Status" (waited for) → the reminder read, nothing pressed. Labels (prefixed by tag): result-url,
 * result-ok, listing, listing-reminder, reopen, reopen-arrival, step6, step6-f5, step6-status. Follow with
 * `continueThenF5(p, { ...APT_STEP6, ifShown: true })` for Continue + F5 on Step 6.
 * Seen: [OK] → listing (EX_TS4, /uat1/ 21.10); F5 on the paid APT's payment page → jpj-sub.do (BEH_TS1 16:57, /uat1/).
 * NOT yet seen: what opening the payment page's address again shows BEFORE the F5 (recorded as `reopen-arrival`).
 */
export function aptResultOkThenStep6(p: Ff36Plan, tag = "") {
  p.add(`${tag}result-url`, { do: "saveUrl", key: `${tag}apt-payment` });
  p.add(`${tag}result-ok`, { do: "confirm", accept: true, timeoutS: 15 });
  p.add(`${tag}listing`, { do: "waitFor", url: "apt/enquiry/", css: "body", timeoutS: 30, soft: true });
  p.add(`${tag}listing-reminder`, { do: "reminder", expect: "shown", waitS: 15, shot: `${tag}apt-listing-after-ok` });
  p.add(`${tag}reopen`, { do: "goto", saved: `${tag}apt-payment` });
  p.add(`${tag}reopen-arrival`, { do: "reminder", expect: "shown", waitS: 12, shot: `${tag}payment-page-opened-again` });
  p.add(null, { do: "refresh" });
  p.add(`${tag}step6`, { do: "waitFor", url: "apt/transaction/jpj-sub\\.do", css: "body", text: "JPJ Transfer Status", timeoutS: 60 });
  p.add(`${tag}step6-f5`, { do: "reminder", expect: "shown", waitS: 12, shot: `${tag}step6-after-f5` });
  p.add(`${tag}step6-status`, { do: "read", from: "JPJ Transfer Status", chars: 80 });
}

/** APT Step 6 markers for `continueThenF5`: the address and "JPJ Transfer Status" (after F5 and as "still usable"). */
export const APT_STEP6 = {
  marker: { url: "apt/transaction/jpj-sub\\.do", css: "body", text: "JPJ Transfer Status" },
  usable: { css: "body", text: "JPJ Transfer Status" },
};

// ------------------------------------------------------------------ APT after the EAINT-12626 fix (added 26.10.2026, cr-author)
// The fix (staging /uat1/ 26.10.2026): a good APT payment raises NO "Payment request sent" and goes STRAIGHT to Step 6
// `apt/transaction/jpj-sub.do` (as STMS / BMK). Nobody had seen the fixed screen when these were written, so the plans
// WAIT FOR WHATEVER COMES (Step 6, the old dialog, or a refusal), touch nothing, and read it all; the spec judges.
// Step 6 markup read off /uat1/ 26.10.2026 (cr/EAINT-12626/03-spec/probes/p01, A60347839's Step 6): step strip
// `#stms-header .header-element-active` ("6 Transfer"), heading `.stms-header-title` "Submission (JPJ Transfer)",
// status `span.jpjStatus` ("OK - SUCCESSFUL"); Step 5 has no "JPJ Transfer Status" text (12253_BEH_TS1 shots).
// UNVERIFIED (README): never run against the fixed build yet.

/** APT Step 6 read-outs (selectors above). */
export const APT_STEP6_READ = { strip: "#stms-header .header-element-active", heading: ".stms-header-title", status: "span.jpjStatus" };

/**
 * From the APT listing: [Resubmit] (+ its confirm) → Step 5 Payment (a Pending APT: `#to-payment`), the reminder read on
 * arrival, the Payment Summary read. Nothing paid. Labels (prefixed by tag): resubmit, step5, step5-arrival, summary.
 */
export function aptOpenStep5(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}resubmit`, { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add(`${tag}step5`, { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add(`${tag}step5-arrival`, noReminder(`${tag}step5-arrival`));
  p.add(`${tag}summary`, { do: "read", from: "Payment Summary", chars: 420 });
}

/**
 * Straight after an APT payment confirm: wait (150 s) for whatever comes first, Step 6 ("JPJ Transfer Status"), the old
 * "Payment request sent" dialog or an RHB refusal ("TIDAK MENCUKUPI"), with NO click and NO F5; then read every visible
 * jQuery dialog, whether "Payment request sent" is up, whether the page is Step 6 (`jpj-sub.do` + "JPJ Transfer Status",
 * up to 20 s more), the reminder on arrival (15 s), the step strip, heading and status, and keep the address under
 * `<tag>apt-step6` (for a later `goto` with `saved`). Labels (prefixed): landed, dialogs, sent, step6, final-arrival,
 * step6-strip, step6-heading, step6-status, step6-url.
 */
export function aptLandingAfterPayment(p: Ff36Plan, tag = "") {
  p.add(`${tag}landed`, { do: "gate", css: "body", match: "JPJ Transfer Status|Payment request sent|TIDAK MENCUKUPI", timeoutS: 150, soft: true, shot: `${tag}after-payment-landed` });
  p.add(`${tag}dialogs`, { do: "read", css: ".ui-dialog" });
  p.add(`${tag}sent`, { do: "waitFor", css: ".ui-dialog", text: "Payment request sent", timeoutS: 3, soft: true });
  p.add(`${tag}step6`, { do: "waitFor", url: "apt/transaction/jpj-sub\\.do", css: "body", text: "JPJ Transfer Status", timeoutS: 20, soft: true });
  p.add(`${tag}final-arrival`, reminderOnArrival(`${tag}after-payment-arrival`));
  p.add(`${tag}step6-strip`, { do: "read", css: APT_STEP6_READ.strip });
  p.add(`${tag}step6-heading`, { do: "read", css: APT_STEP6_READ.heading });
  p.add(`${tag}step6-status`, { do: "read", css: APT_STEP6_READ.status });
  p.add(`${tag}step6-url`, { do: "saveUrl", key: `${tag}apt-step6` });
}

/**
 * A Pending APT from its listing, paid, after the 12626 fix: `aptOpenStep5` → Next (`#to-payment`) → the reminder read
 * with the confirm open → "Sure to submit this payment?" Yes → `aptLandingAfterPayment`. Labels: aptOpenStep5's +
 * pay-button, step5-after-button, pay-confirm + aptLandingAfterPayment's (all prefixed by tag).
 */
export function aptPayToStep6(p: Ff36Plan, o: { vehicle: string; tag?: string }) {
  const tag = o.tag ?? "";
  aptOpenStep5(p, tag, o);
  p.add(`${tag}pay-button`, { do: "click", css: "#to-payment" });
  p.add(`${tag}step5-after-button`, noReminder(`${tag}step5-after-next`, 4));
  p.add(`${tag}pay-confirm`, { do: "confirm", accept: true, timeoutS: 20, shot: `${tag}step5-pay-confirm` });
  aptLandingAfterPayment(p, tag);
}

/**
 * A Failed APT (refused payment) from its listing, retried, after the 12626 fix: [Resubmit] → Step 5 with only Retry
 * (`#to-retry-rhb`, read on arrival) → Retry → "Sure to retry?" Make Payment (`aptRetryPay`'s controls, 12253_EX_TS4) →
 * `aptLandingAfterPayment`. Labels (prefixed): resubmit, step5, step5-arrival, payment-status, summary, retry-dialog +
 * aptLandingAfterPayment's.
 */
export function aptRetryPayToStep6(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}resubmit`, { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add(`${tag}step5`, { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-retry-rhb", timeoutS: 60 });
  p.add(`${tag}step5-arrival`, noReminder(`${tag}step5-arrival`));
  p.add(`${tag}payment-status`, { do: "read", from: "Payment Status", chars: 40 });
  p.add(`${tag}summary`, { do: "read", from: "Payment Summary", chars: 420 });
  p.add(null, { do: "click", css: "#to-retry-rhb" });
  p.add(`${tag}retry-dialog`, { do: "waitFor", css: ".ui-dialog", text: "Sure to retry?", timeoutS: 20, shot: `${tag}retry-dialog` });
  p.add(null, { do: "click", css: ".ui-dialog button", text: "Make Payment" });
  aptLandingAfterPayment(p, tag);
}

/**
 * Open a paid APT's Step 6 by its address (`path` under the instance root, e.g. "view/ucd/apt/transaction/jpj-sub.do?id=…")
 * → wait for Step 6 → the reminder read on arrival → the status read. Then (when `continueAfter`) Continue if it is up,
 * so the next step starts clean. Labels (prefixed): open, arrival, status, closed.
 */
export function aptOpenStep6(p: Ff36Plan, tag: string, o: { path: string; continueAfter?: boolean }) {
  p.add(`${tag}open`, { do: "goto", path: o.path });
  p.add(null, { do: "waitFor", ...APT_STEP6.marker, timeoutS: 60, soft: true });
  p.add(`${tag}arrival`, reminderOnArrival(`${tag}step6-arrival`));
  p.add(`${tag}status`, { do: "read", css: APT_STEP6_READ.status });
  if (o.continueAfter) p.add(`${tag}closed`, { do: "reminderButton", which: "continue", ifShown: true });
}

/** Deregistration Step 6 tail: Continue, F5, then Done (`<button onclick="location.href='…/dereg/enquiry/view.do?id=…'">`, probe p12). */
export function deregStep6ContinueF5Done(p: Ff36Plan) {
  const done = "button[onclick*='dereg/enquiry/view.do']";
  continueThenF5(p, { marker: { css: "body", text: "JPJ Deregistration Status" }, usable: { css: done } });
  p.add("step6-status", { do: "read", from: "JPJ Deregistration Status", chars: 80 });
  p.add(null, { do: "click", css: done });
  p.add("done", { do: "waitFor", url: "dereg/enquiry/view\\.do", timeoutS: 30, soft: true, shot: "after-done" });
}

/**
 * VEL000069E route, after Insurance Step 4: Continue (reminder), F5, then "Continue with eSerahan" `#estmLkmDoneBtn`
 * (p16, 20.10) → eSTM Step 5 Payment (main session 21.10: the eSTM continues on its Step 5) with eLKM and eVOC unticked
 * (as `insurance.flow` `estmCompleted` does) → Next → its two confirmations → eSTM Step 6 (`estm-sub.do`).
 * Labels: continue, usable, f5, f5-continue (insurance Step 4); estm-step5, estm-step5-arrival, estm-summary,
 * estm-confirm-1, estm-confirm-2, estm-step6, estm-final-arrival, estm-continue, estm-usable, estm-f5, estm-f5-continue.
 */
export function insuranceConfirmThenEstmStep6(p: Ff36Plan) {
  continueThenF5(p, { marker: { css: "body", text: "Thank you! Your payment has been successfully made" }, usable: { css: "#estmLkmDoneBtn" } });
  p.add(null, { do: "click", css: "#estmLkmDoneBtn" });
  p.add("estm-step5", { do: "waitFor", url: "estm/transaction/payment\\.do", css: "#to-payment", timeoutS: 90 });
  p.add("estm-step5-arrival", noReminder("estm-step5-arrival"));
  p.add(null, { do: "check", css: "#lkm-addson-checkbox", on: false, soft: true });
  p.add(null, { do: "check", css: "#evoc-addson-checkbox", on: false, soft: true });
  p.add("estm-summary", { do: "read", from: "Payment Summary", chars: 600 });
  p.add(null, { do: "click", css: "#to-payment" });
  p.add("estm-confirm-1", { do: "confirm", accept: true, timeoutS: 20, shot: "estm-step5-confirm-1" });
  p.add("estm-confirm-2", { do: "confirm", accept: true, timeoutS: 30, shot: "estm-step5-confirm-2" });
  p.add("estm-step6", { do: "waitFor", url: "estm/transaction/estm-sub\\.do", timeoutS: 150 });
  p.add("estm-final-arrival", reminderOnArrival("estm-step6-arrival"));
  p.add("estm-continue", { do: "reminderButton", which: "continue", shot: "estm-step6-after-continue" });
  // eSTM Step 6 "Done" on /uat1/ is a plain div (as EstmWizardPage.doneButton, 21.10.2026): matched by its WHOLE label on
  // any element. The old "button, a, div.next-btn, input[type=button]" list never matched it (FF_TS15 r3 17:48 21.10:
  // "Done NOT found" with Done on screen, 13-ff36-estm-step6-after-continue.png).
  p.add("estm-usable", { do: "waitFor", css: "div, button, a, span, input[type=button], input[type=submit]", text: "Done", exact: true, timeoutS: 10, soft: true });
  p.add(null, { do: "refresh" });
  p.add(null, { do: "waitFor", url: "estm/transaction/estm-sub\\.do", css: "body", text: "Done", timeoutS: 60 });
  p.add("estm-f5", { do: "reminder", expect: "shown", waitS: 12, shot: "estm-step6-after-f5" });
  p.add("estm-f5-continue", { do: "reminderButton", which: "continue", ifShown: true });
}

// ------------------------------------------------------------------ added 21.10.2026 by cr-author (EAINT-12253 sheet 3: BEH_TS1, BEH_TS3, BEH_TS7)
// Same rule as above: selectors seen on the live pages. APT refusal / Retry ("#to-retry-rhb", "Sure to retry?" Cancel /
// Make Payment, "... TIDAK MENCUKUPI." OK, the Failed row's [Resubmit] -> Step 5 with only Retry; rows "View | Resubmit",
// paid rows "View"): the 21.10 Firefox 36 after-run of 12253_EX_TS4 (05-evidence/12253_EX_TS4/run-log.jsonl,
// results.md). JomCheck listing #vehicleNo / #to-search / row "View" -> Transaction Details
// jomcheck/enquiry/view.do?id= with Report #to-print-report: probe probes-2110/p07 (Chrome, 21.10). View User Guide ->
// view/ucd/user-guide/: probes-2110/p06_ff36_jomcheck.py (real Firefox 36, 21.10). STMS Step 4 "Make Payment"
// #to-payment + "Sure to continue?": pages/ucd/stms-wizard.page.ts. NOT seen yet: the SSM Document purchase pop-ups on
// STMS Step 4 ([Purchase SSM] is matched by its label from the TS; the pop-ups are answered as confirms): UNVERIFIED.

/**
 * APT from its listing with RHB refusing (IF): [Resubmit] -> Step 5 (read) -> Next -> "Sure to submit this payment?" Yes ->
 * the refusal ("... TIDAK MENCUKUPI.", read with the reminder) -> OK -> the listing's [Resubmit] again -> Step 5 now
 * offering only Retry (read). Labels (prefixed by tag): resubmit, step5, step5-arrival, summary, pay-confirm, refused,
 * refused-reminder, refused-closed, resubmit-retry, step5-retry, step5-retry-arrival.
 */
export function aptRefusedThenBackToStep5(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}resubmit`, { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add(`${tag}step5`, { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add(`${tag}step5-arrival`, noReminder(`${tag}step5-arrival`));
  p.add(`${tag}summary`, { do: "read", from: "Payment Summary", chars: 420 });
  p.add(null, { do: "click", css: "#to-payment" });
  p.add(`${tag}pay-confirm`, { do: "confirm", accept: true, timeoutS: 20, shot: `${tag}step5-pay-confirm` });
  p.add(`${tag}refused`, { do: "waitFor", css: ".ui-dialog", text: "TIDAK MENCUKUPI", timeoutS: 120, soft: true });
  p.add(`${tag}refused-reminder`, noReminder(`${tag}payment-refused`));
  p.add(`${tag}refused-closed`, { do: "confirm", accept: true, timeoutS: 20 });
  p.add(`${tag}resubmit-retry`, { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add(`${tag}step5-retry`, { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-retry-rhb", timeoutS: 60 });
  p.add(`${tag}step5-retry-arrival`, noReminder(`${tag}step5-retry-arrival`));
}

/**
 * APT whose last payment was refused: [Resubmit] -> Step 5 -> Retry (#to-retry-rhb) -> "Sure to retry?" Make Payment ->
 * the result on the same page ("Payment request sent"), the reminder read on arrival. Labels (prefixed): resubmit,
 * step5, step5-arrival, summary, retry-dialog, sent, final-arrival.
 */
export function aptRetryPay(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}resubmit`, { do: "resubmit", listing: "apt", ref: o.vehicle, vehicle: o.vehicle });
  p.add(`${tag}step5`, { do: "waitFor", url: "apt/transaction/payment\\.do", css: "#to-retry-rhb", timeoutS: 60 });
  p.add(`${tag}step5-arrival`, noReminder(`${tag}step5-arrival`));
  p.add(`${tag}summary`, { do: "read", from: "Payment Summary", chars: 420 });
  p.add(null, { do: "click", css: "#to-retry-rhb" });
  p.add(`${tag}retry-dialog`, { do: "waitFor", css: ".ui-dialog", text: "Sure to retry?", timeoutS: 20, shot: `${tag}retry-dialog` });
  p.add(null, { do: "click", css: ".ui-dialog button", text: "Make Payment" });
  p.add(`${tag}sent`, { do: "waitFor", css: ".ui-dialog", text: "Payment request sent", timeoutS: 150, soft: true });
  p.add(`${tag}final-arrival`, reminderOnArrival(`${tag}after-payment-arrival`));
}

/**
 * The APT listing row (read, shot) -> its [View] -> the reminder read there (then closed with Continue if it showed).
 * Labels (prefixed): row, view, reminder. Any APT page is accepted (`view` soft).
 * Seen 21.10.2026 (BEH_TS1, /uat1/): an Approved row offers only [View], which opens Transaction Details
 * `apt/enquiry/view.do?id=` (Invoice, e-Invoice, Slip Pengesahan, JPJ Transfer (Final Submission), Payment History):
 * NOT the final step (that is Step 6 `apt/transaction/jpj-sub.do`, see aptResultOkThenStep6). What the reminder does
 * there is only read; whether it should show is with Azfar (BEH_TS1 E5 / E6 wording, triage-2026-10-21-apt.md).
 */
export function aptOpenFromListing(p: Ff36Plan, tag: string, o: { vehicle: string }) {
  p.add(`${tag}row`, { do: "row", listing: "apt", ref: o.vehicle, vehicle: o.vehicle, shot: `${tag}apt-listing` });
  p.add(null, { do: "click", css: "tr a", text: "View" });
  p.add(`${tag}view`, { do: "waitFor", url: "/apt/", css: "body", timeoutS: 30, soft: true });
  p.add(`${tag}reminder`, { do: "reminder", expect: "shown", waitS: 12, shot: `${tag}apt-opened` });
  p.add(null, { do: "reminderButton", which: "continue", ifShown: true });
}

/**
 * On the JomCheck result with the reminder up: View User Guide (the new tab shot as a window frame, left open) -> back
 * on the JomCheck tab (reminder read) -> Continue -> Download Report (what it did) -> JomCheck listing -> [View] ->
 * Transaction Details (Report #to-print-report). Labels: guide, back, continue, download, listing, details.
 * Run the plan with `{ downloads: true }` so a downloaded report is saved without Firefox's Save dialog.
 */
export function jomcheckGuideContinueReport(p: Ff36Plan, o: { vehicle: string }) {
  p.add("guide", { do: "guideTab", shot: "user-guide-new-tab" });
  p.add("back", { do: "reminder", expect: "shown", waitS: 5, shot: "back-on-jomcheck-tab" });
  p.add("continue", { do: "reminderButton", which: "continue", shot: "after-continue" });
  jomcheckDownloadAndDetails(p, o);
}

/**
 * On the JomCheck result after payment (reminder already closed): Download Report (what it did) -> JomCheck listing ->
 * [View] -> Transaction Details (Report #to-print-report). Labels: download, listing, details. The same steps
 * jomcheckGuideContinueReport always ran (moved here unchanged 21.10.2026 so 12253_FF_TS10 reuses them).
 * Run the plan with `{ downloads: true }`.
 */
export function jomcheckDownloadAndDetails(p: Ff36Plan, o: { vehicle: string }) {
  p.add("download", { do: "clickObserve", css: "#to-view-report", waitS: 30, shot: "download-report" });
  p.add("listing", { do: "row", listing: "jomcheck", path: "view/ucd/jomcheck/enquiry/", ref: o.vehicle, vehicle: o.vehicle });
  p.add(null, { do: "click", css: "tr a", text: "View" });
  p.add("details", { do: "waitFor", url: "jomcheck/enquiry/view\\.do", css: "#to-print-report", timeoutS: 30, soft: true, shot: "transaction-details" });
}

/**
 * JomCheck by Vehicle No. whose payment RHB REFUSES (the vehicle's prefix at RHB IF): landing -> PURCHASE -> Submit ->
 * Pay Now -> "Payment" Yes -> the refusal dialog (title "Payment", "Wang di dalam akaun RHB anda TIDAK MENCUKUPI.
 * 你的RHB银行余额不足.", OK `button.confirm-dialog-btn`) read with the reminder -> its OK -> Retry read with the reminder.
 * Labels: form, submitted, pay-now, pay-confirm, refused, refused-reminder, refused-text, refused-ok, retry, retry-reminder.
 * Seen: the refusal dialog, its OK and Retry on this page in Chrome (12253_CH_TS8 E4, runs 21.10.2026 14:01 and 15:46,
 * staging /uat1/; JomCheckPage.confirmPayment). NOT yet walked in Firefox 36 (written 21.10.2026 for 12253_FF_TS10).
 */
export function jomcheckRefused(p: Ff36Plan, o: { vehicle: string }) {
  p.add(null, { do: "goto", path: "view/ucd/jomcheck/view.do" });
  p.add(null, { do: "click", css: "#create-tx" });
  p.add("form", { do: "waitFor", url: "jomcheck/transaction/view\\.do", css: "#to-check-vehicle", timeoutS: 30 });
  p.add(null, { do: "click", css: "#vehicleNoRadio" });
  p.add(null, { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add(null, { do: "click", css: "#to-check-vehicle" });
  p.add("submitted", { do: "waitFor", url: "transactionId=", css: "#to-pay", timeoutS: 90 });
  p.add("pay-now", { do: "click", css: "#to-pay" });
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "payment-dialog" });
  p.add("refused", { do: "waitFor", css: ".ui-dialog", text: "TIDAK MENCUKUPI", timeoutS: 120, soft: true });
  p.add("refused-reminder", noReminder("refused-message", 5));
  p.add("refused-text", { do: "read", css: ".ui-dialog" });
  p.add("refused-ok", { do: "confirm", accept: true, timeoutS: 10 });
  p.add("retry", { do: "waitFor", css: "button, a, input[type=button], div.next-btn", text: "Retry", timeoutS: 15, soft: true });
  p.add("retry-reminder", noReminder("after-refusal-closed", 5));
}

/**
 * JomCheck by Vehicle No. that is PAID but whose JomCheck FAILS (Azfar 21.10.2026: the vehicle's prefix has an eSim
 * `jomcheck-enquiry-resp` row with result No, and RHB answers OK): landing -> PURCHASE -> Submit -> Pay Now -> "Payment"
 * Yes -> every screen after it, the reminder read on each -> the JomCheck listing row (Payment / Tx Status / Remarks).
 * What the page shows after Yes in this case was never seen, so nothing after Yes is assumed: the plan waits (soft) for
 * whatever comes (Download Report, a dialog, or a Result that no longer says "Vehicle number found"), reads the Result
 * and any dialog, presses only a dialog's own OK when one is up (optional), reads again, then the listing.
 * Labels: form, submitted, submit-reminder, pay-now, pay-confirm, after-yes, after-yes-reminder, after-yes-result,
 * after-yes-dialog, dialog-ok, after-dialog-reminder, listing, listing-reminder.
 * Selectors: as jomcheckBuy / jomcheckRefused (seen); listing `view/ucd/jomcheck/enquiry/` #vehicleNo / #to-search, row
 * "# Vehicle Chassis No Transaction No Created At Payment Tx Status e-Invoice Status Remarks Action" (probe 2110/p07).
 * Written 21.10.2026 for 12253_FF_TS10 E7; never walked.
 */
export function jomcheckPaidButFailed(p: Ff36Plan, o: { vehicle: string }) {
  p.add(null, { do: "goto", path: "view/ucd/jomcheck/view.do" });
  p.add(null, { do: "click", css: "#create-tx" });
  p.add("form", { do: "waitFor", url: "jomcheck/transaction/view\\.do", css: "#to-check-vehicle", timeoutS: 30 });
  p.add(null, { do: "click", css: "#vehicleNoRadio" });
  p.add(null, { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add(null, { do: "click", css: "#to-check-vehicle" });
  p.add("submitted", { do: "waitFor", url: "transactionId=", css: "#to-pay", timeoutS: 90 });
  p.add("submit-reminder", noReminder("after-submit", 5));
  p.add("pay-now", { do: "click", css: "#to-pay" });
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "payment-dialog" });
  p.add("after-yes", { do: "waitFor", css: "#to-view-report, .ui-dialog", timeoutS: 120, soft: true });
  p.add("after-yes-reminder", { do: "reminder", expect: "shown", waitS: 15, shot: "after-yes" });
  p.add("after-yes-result", { do: "read", css: "#result" });
  p.add("after-yes-dialog", { do: "read", css: ".ui-dialog" });
  p.add("dialog-ok", { do: "click", css: ".ui-dialog button.confirm-dialog-btn", optional: true });
  p.add("after-dialog-reminder", { do: "reminder", expect: "shown", waitS: 10, shot: "after-dialog-ok" });
  p.add("listing", { do: "row", listing: "jomcheck", path: "view/ucd/jomcheck/enquiry/", ref: o.vehicle, vehicle: o.vehicle, soft: true, shot: "jomcheck-listing" });
  p.add("listing-reminder", { do: "reminder", expect: "shown", waitS: 8, shot: "jomcheck-listing-reminder" });
}

/**
 * STMS saved at Step 4 (Company seller, SSM Document purchase asked), opened by [Resubmit]: Step 4 (read) -> [Purchase SSM]
 * -> company pop-up (read, [Next]) -> Payment Summary pop-up (read, [Make Payment]) -> Step 4 reloaded with the "SSM
 * Document Verification" pop-up (read, [OK] only when it says successful) -> Step 4 with [Make Payment] (read) ->
 * [Make Payment] -> "Sure to continue?" Yes -> Step 5.
 * Labels: step4, step4-arrival, ssm-company, ssm-company-reminder, ssm-company-text, ssm-confirm-1, ssm-payment,
 * ssm-payment-reminder, ssm-payment-text, ssm-confirm-2, ssm-verify, ssm-verify-reminder, ssm-verify-text,
 * ssm-verify-ok, ssm-after, ssm-after-reminder, make-payment-confirm.
 *
 * Seen on staging /uat1/ 21.10.2026 in Chrome (run EAINT-12253-verify-stms-company-ssm-r2-20261021-1829-L1, its trace:
 * the dialogs' DOM and the jpj-enq.do page script); the same server page in Firefox 36. `#to-get-ssm` is
 * `<input type="button" value="Purchase SSM">`. Pop-up 1 "Purchase SSM Document" (`#ssm-details`, "Please reconfirm the
 * Seller Company Name and SSM Number are correct.") has Cancel / Next (`confirm-dialog-btn`). Pop-up 2 "Purchase SSM
 * Document" (`#ssm-payment-popup`: Payment Summary, "SSM Profile & Admin Fees : RM 18.00", "eAuto Service Tax : RM
 * 1.44", "Total Amount Payable : RM 19.44") has Cancel / Make Payment (`confirm-wfw-dialog-btn`, NOT Yes / OK, so
 * `confirm` would not press it). After Make Payment the page script pays and verifies, then RELOADS Step 4.
 * Corrected 21.10.2026 (run ...-ssm-r4-20261021-1917-L1, cr/EAINT-12253/05-evidence/triage-2026-10-21-ssm.md): the
 * reloaded Step 4 is rendered by the SERVER with the EAINT-10119 document check in it, a `#custom-dialog` titled "SSM
 * Document Verification" (`#custom-field` = the result) with one [OK] (`confirm-dialog-btn`) that only closes it. That is
 * the TS's "SSM Document Verification pop-up" (BEH_TS7 step 3: screenshot it, [OK]). Seen: "Verification failed: ...
 * Business Registration Number does not match the SSM document." (no `#to-payment`; the SSM fee already paid). Expected
 * on a matching seed (LKM board, miro-lkm-board.md ~585/590, not yet seen on staging): "Verification successful". So the
 * plan waits for it (soft), reads the reminder state and its text, then GATES on "uccessful" in `#custom-field` (matches
 * "successful" / "Successful"; never in the failed text): failed or missing = the plan stops there, [OK] not pressed,
 * nothing more paid. Successful = [OK], then Step 4's [Make Payment]. A refused payment shows an alert ("Payment")
 * instead: the plan stops at the same gate, nothing pressed in it.
 */
export function stmsStep4BuySsm(p: Ff36Plan) {
  p.add("step4", { do: "waitFor", css: "#to-get-ssm", timeoutS: 60 });
  p.add("step4-arrival", noReminder("step4-arrival"));
  p.add(null, { do: "click", css: "#to-get-ssm" });
  p.add("ssm-company", { do: "waitFor", css: ".ui-dialog", text: "Please reconfirm the Seller Company Name", timeoutS: 60, soft: true });
  p.add("ssm-company-reminder", noReminder("ssm-company-popup", 4));
  p.add("ssm-company-text", { do: "read", css: ".ui-dialog" });
  p.add("ssm-confirm-1", { do: "click", css: ".ui-dialog button.confirm-dialog-btn", text: "Next" });
  p.add("ssm-payment", { do: "waitFor", css: ".ui-dialog", text: "Total Amount Payable", timeoutS: 60, soft: true });
  p.add("ssm-payment-reminder", noReminder("ssm-payment-summary", 4));
  p.add("ssm-payment-text", { do: "read", css: ".ui-dialog" });
  p.add("ssm-confirm-2", { do: "click", css: ".ui-dialog button.confirm-wfw-dialog-btn", text: "Make Payment" });
  p.add("ssm-verify", { do: "waitFor", css: ".ui-dialog", text: "SSM Document Verification", timeoutS: 180, soft: true });
  p.add("ssm-verify-reminder", noReminder("ssm-document-verification-popup", 4));
  p.add("ssm-verify-text", { do: "read", css: ".ui-dialog" });
  p.add("ssm-verify-ok", { do: "waitFor", css: "#custom-field", text: "uccessful", timeoutS: 5 });
  p.add(null, { do: "click", css: ".ui-dialog button.confirm-dialog-btn", text: "OK" });
  p.add("ssm-after", { do: "waitFor", css: "#to-payment", timeoutS: 60 });
  p.add("ssm-after-reminder", noReminder("step4-after-ssm-purchase", 4));
  p.add(null, { do: "click", css: "#to-payment" });
  p.add("make-payment-confirm", { do: "confirm", accept: true, timeoutS: 20 });
}

/**
 * STMS Step 5 -> 6 from Step 5 itself (no [Resubmit]; e.g. after stmsStep4BuySsm): as `stmsPayToStep6` without its first
 * step. Labels: step5, step5-arrival, step5-summary, pay-button, step5-after-button, pay-confirm, step6, final-arrival,
 * step6-status.
 */
export function stmsStep5PayToStep6(p: Ff36Plan) {
  p.add("step5", { do: "waitFor", url: "stms/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  p.add("step5-summary", { do: "read", from: "Payment Summary", chars: 420 });
  p.add("pay-button", { do: "click", css: "#to-payment" });
  p.add("step5-after-button", noReminder("step5-after-pay-button", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, shot: "step5-pay-confirm" });
  p.add("step6", { do: "waitFor", css: "body", text: "JPJ Transfer Status", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("step6-arrival"));
  p.add("step6-status", { do: "read", from: "JPJ Transfer Status", chars: 80 });
}

// ------------------------------------------------------------------ BMK (added 22.10.2026 by cr-author, EAINT-12253 FF_TS6)
// Selectors: pages/ucd/bmk-wizard.page.ts (Step 5 `div#to-payment` "Next", "Sure to submit this payment?" No / Yes, Step 6
// `bmk/transaction/jpj-sub.do` "JPJ BMK Purchase Status", walked 20.10 p05 / p08 and the BMK verify runs 21.10); the listing:
// probe cr/EAINT-12253/03-spec/probes-2110/p08 (22.10, staging /uat1/).

/** The BMK Transaction Listing (probe p08 22.10.2026: `…/bmk/enquiry/main.do`, the bridge's default for "bmk", is a 404). */
export const BMK_LISTING = "view/ucd/bmk/enquiry/";

/**
 * A BMK left unpaid on Step 5 Payment (card steps done in Chrome), opened again in Firefox 36 FROM THE BMK LISTING and paid:
 * the listing row (read, shot) → [Resubmit] (+ its confirm, as on every listing) → Step 5 `bmk/transaction/payment.do`
 * (reminder read on arrival, Payment Summary) → Next `div#to-payment` → reminder read with "Sure to submit this payment?"
 * open → Yes → Step 6 Purchase (`jpj-sub.do`, "JPJ BMK Purchase Status") → reminder read on arrival → status read.
 * NOT SEEN YET: whether the listing offers [Resubmit] for an unpaid Step-5 BMK. Seen: a Pending BMK left on Step 4 offered
 * [View] only (seed s07, 20.10); the listing's own script handles `.to-retry` links (p08, 22.10). Without [Resubmit] the
 * `resubmit` step fails and names the row ("row … has no Resubmit: …"); nothing else is tried, nothing is paid.
 * Labels: listing-before, resubmit, step5, step5-arrival, summary, pay-button, step5-after-button, pay-confirm, step6,
 * final-arrival, step6-status.
 */
export function bmkResumePayToStep6(p: Ff36Plan, o: { vehicle: string }) {
  p.add("listing-before", { do: "row", listing: "bmk", path: BMK_LISTING, ref: o.vehicle, vehicle: o.vehicle, soft: true, shot: "bmk-listing-before" });
  p.add("resubmit", { do: "resubmit", listing: "bmk", path: BMK_LISTING, ref: o.vehicle, vehicle: o.vehicle });
  bmkStep5PayToStep6(p);
}

/**
 * BMK Step 5 Payment → pay → Step 6 Purchase (the shared tail of `bmkResumePayToStep6` and `bmkByHandToStep6`, 22.10.2026):
 * Step 5 `bmk/transaction/payment.do` (reminder read on arrival, Payment Summary) → `expectedTotal` (optional): a GATE on
 * "Total Amount Payable (inclusive of Service Tax 8%) : RM<total>" (the flow's `expectedTotal`, page object
 * `totalPayable()`), so another amount stops the plan before anything is paid → Next `div#to-payment` → reminder read
 * with "Sure to submit this payment?" open → Yes (PAYS) → Step 6 `jpj-sub.do` "JPJ BMK Purchase Status" → reminder read
 * on arrival → status read. Labels: step5, step5-arrival, summary, total, pay-button, step5-after-button, pay-confirm,
 * step6, final-arrival, step6-status.
 */
export function bmkStep5PayToStep6(p: Ff36Plan, o: { expectedTotal?: string } = {}) {
  p.add("step5", { do: "waitFor", url: "bmk/transaction/payment\.do", css: "div#to-payment", timeoutS: 60 });
  p.add("step5-arrival", noReminder("step5-arrival"));
  p.add("summary", { do: "read", from: "Payment Summary", chars: 300 });
  if (o.expectedTotal) {
    const amt = o.expectedTotal.replace(/\./g, "\\.");
    p.add("total", { do: "gate", css: "body", match: String.raw`Total Amount Payable \(inclusive of Service Tax 8%\)\s*:\s*(RM\s*)?` + amt + String.raw`\b`, timeoutS: 10 });
  }
  p.add("pay-button", { do: "click", css: "div#to-payment" });
  p.add("step5-after-button", noReminder("step5-after-next", 4));
  p.add("pay-confirm", { do: "confirm", accept: true, timeoutS: 20, shot: "step5-pay-confirm" });
  p.add("step6", { do: "waitFor", url: "bmk/transaction/jpj-sub\.do", css: "body", text: "JPJ BMK Purchase Status", timeoutS: 150 });
  p.add("final-arrival", reminderOnArrival("step6-arrival"));
  p.add("step6-status", { do: "read", from: "JPJ BMK Purchase Status", chars: 60 });
}

/**
 * BMK Step 6 tail (FF_TS6 step 5): [Continue 继续], Step 6's "Done" still on screen (matched by its WHOLE label, as eSTM's:
 * it is not a .btn / .next-btn), F5, the reminder read again, then the BMK listing row. Done is NOT pressed.
 * Labels: continue, usable, f5, f5-continue, listing.
 */
export function bmkStep6ContinueF5Listing(p: Ff36Plan, o: { vehicle: string }) {
  p.add("continue", { do: "reminderButton", which: "continue", shot: "after-continue" });
  p.add("usable", { do: "waitFor", css: "div, button, a, span, input[type=button], input[type=submit]", text: "Done", exact: true, timeoutS: 10, soft: true });
  p.add(null, { do: "refresh" });
  p.add(null, { do: "waitFor", url: "bmk/transaction/jpj-sub\.do", css: "body", text: "JPJ BMK Purchase Status", timeoutS: 60 });
  p.add("f5", { do: "reminder", expect: "shown", waitS: 12, shot: "after-f5" });
  p.add("f5-continue", { do: "reminderButton", which: "continue", ifShown: true });
  p.add("listing", { do: "row", listing: "bmk", path: BMK_LISTING, ref: o.vehicle, vehicle: o.vehicle, soft: true, shot: "bmk-listing-after" });
}

// ------------------------------------------------------------------ added 22.10.2026 by cr-author (EAINT-12253 BEH_TS8, BEH_TS6)

/** What the LKM Refund pop-up is given: real, matching documents of the seller (paths on this PC, never in the repo). */
export interface LkmRefundInput {
  /** Bank Name as listed (matched by label: equal, else contains, else contained). */
  bank: string;
  /** As printed on the statement, digits only. */
  accountNo: string;
  copyOfIc: string;
  bankStatement: string;
}

/**
 * STMS Step 5 with the LKM Refund add-on, ON Step 5 (after [Resubmit]): read on arrival -> tick LKM Refund
 * (`#lkm-refund-addon-checkbox`; its change handler opens the "LKM Refund" pop-up by AJAX) -> the pop-up: PTJ state and
 * branch (first on the list, only when eAuto left them empty), Bank Name, Account No., Copy of IC (when the pop-up has
 * it), Bank Statement, consent -> [Next] (uploads, then the REAL document check) -> "LKM Refund Document Preview"
 * (documents painted by pdf.js into canvases under `#lkm-refund-preview-viewer`, signing enabled once painted) -> the
 * e-signature drawn on `#lkm-pad` -> [Proceed] (uploads the signature, checks it, closes the pop-up) -> Step 5 with the
 * LKM Refund fee committed (`#lkmRefundEautoFee` no longer 0.00). The reminder is read on every screen. Nothing is paid:
 * follow with `stmsStep5PayToStep6`.
 * Two GATES stop the plan before anything is paid: the preview must open (`lkm-preview`), and the fee must be
 * committed (`lkm-fee`). A document-check refusal is read first (`lkm-check-error`).
 * Labels: lkm-step5, lkm-step5-arrival, lkm-step5-summary, lkm-tick, lkm-popup, lkm-popup-reminder, lkm-popup-text,
 * lkm-ptj-state, lkm-ptj-branch, lkm-bank, lkm-account, lkm-ic, lkm-statement, lkm-consent, lkm-filled-reminder,
 * lkm-next, lkm-check-result, lkm-check-error, lkm-preview, lkm-preview-rendered, lkm-preview-ink, lkm-preview-status,
 * lkm-preview-reminder, lkm-preview-text, lkm-sign, lkm-signed-buttons, lkm-signed-reminder, lkm-proceed,
 * lkm-proceed-idle, lkm-fee, lkm-after-reminder, lkm-after-summary.
 *
 * Where the selectors come from (none of this has run in Firefox 36): the Step 5 page script of the add-on
 * (`#lkm-refund-addon-checkbox` change -> `#to-lkm-refund` -> data-entry pop-up `#lkm-refund-popup` titled "LKM Refund";
 * buttons Cancel / Next, then "LKM Refund Document Preview" with Close / Proceed, Next and Proceed carrying
 * `confirm-dialog-btn`; fee row `#lkm-refund-fee-section` / `#lkmRefundEautoFee`) from the SIT trace
 * automation/.artifacts/tr-sit-VKR1559 (/preprod1/ 12.10.2026); the pop-up's own script (`#ptjStateCode`,
 * `#ptjBranchCode`, `#bankName`, `#bankAccNo`, `#CopyOfIc` / `#BankStatement` with `#doc-CopyOfIc` / `#doc-BankStatement`,
 * `#toConsent`, `#lkm-refund-doc-error`, `#lkm-pad` mouse handlers, `#lkm-signature-wrapper.lkm-signature-disabled` until
 * the preview is painted, `#lkm-refund-preview-viewer` canvases, `#lkm-refund-preview-status`) saved in
 * cr/EAINT-12022/04-explore/lkm-guideline/lkm-data-entry.html (06.10.2026); the same ids in `pages/ucd/lkm-refund.page.ts`,
 * which ran end to end on /preprod1/ 07.10.2026 (OW000017). Not seen on staging /uat1/.
 */
export function stmsStep5LkmRefund(p: Ff36Plan, input: LkmRefundInput) {
  p.add("lkm-step5", { do: "waitFor", url: "stms/transaction/payment\\.do", css: "#to-payment", timeoutS: 60 });
  p.add("lkm-step5-arrival", noReminder("step5-arrival-before-lkm-refund"));
  p.add("lkm-step5-summary", { do: "read", from: "Payment Summary", chars: 420 });
  // The add-on row shows only when JPJ returns a refund balance and the account may use LKM Refund: not offered = this
  // click finds nothing and the plan stops here, nothing paid.
  p.add("lkm-tick", { do: "click", css: "#lkm-refund-addon-checkbox" });
  p.add("lkm-popup", { do: "waitFor", css: "#bankAccNo", timeoutS: 60 });
  p.add("lkm-popup-reminder", noReminder("lkm-refund-popup", 4));
  p.add("lkm-popup-text", { do: "read", css: ".ui-dialog", chars: 1500 });
  p.add("lkm-ptj-state", { do: "choose", css: "#ptjStateCode", index: 1, onlyIfEmpty: true });
  p.add("lkm-ptj-branch", { do: "choose", css: "#ptjBranchCode", index: 1, onlyIfEmpty: true, timeoutS: 20 });
  p.add("lkm-bank", { do: "choose", css: "#bankName", text: input.bank, timeoutS: 20 });
  p.add(null, { do: "click", css: "#bankAccNo" });
  p.add("lkm-account", { do: "fill", css: "#bankAccNo", value: input.accountNo });
  p.add("lkm-ic", { do: "upload", css: "#CopyOfIc", path: input.copyOfIc, label: "#doc-CopyOfIc", optional: true });
  p.add("lkm-statement", { do: "upload", css: "#BankStatement", path: input.bankStatement, label: "#doc-BankStatement" });
  p.add("lkm-consent", { do: "click", css: "#toConsent", optional: true });
  p.add("lkm-filled-reminder", noReminder("lkm-refund-popup-filled", 3));
  p.add("lkm-next", { do: "click", css: ".ui-dialog button.confirm-dialog-btn", text: "Next" });
  // [Next] uploads to S3 and runs the real document check (07.10.2026: up to a few minutes).
  p.add("lkm-check-result", { do: "waitFor", css: "#lkm-pad, #lkm-refund-doc-error", timeoutS: 240, soft: true });
  p.add("lkm-check-error", { do: "read", css: "#lkm-refund-doc-error, .ui-dialog [class*=is-invalid-]" });
  p.add("lkm-preview", { do: "waitFor", css: "#lkm-pad", timeoutS: 5 }); // GATE: no preview = stop, nothing paid
  p.add("lkm-preview-rendered", { do: "waitFor", css: "#lkm-signature-wrapper:not(.lkm-signature-disabled)", timeoutS: 90, soft: true });
  p.add("lkm-preview-ink", { do: "canvasInk", css: "#lkm-refund-preview-viewer canvas", waitS: 20 });
  p.add("lkm-preview-status", { do: "read", css: "#lkm-refund-preview-status" });
  p.add("lkm-preview-reminder", noReminder("lkm-refund-document-preview", 4));
  p.add("lkm-preview-text", { do: "read", css: ".ui-dialog", chars: 2000 });
  p.add("lkm-sign", { do: "sign", css: "#lkm-pad", shot: "lkm-refund-preview-e-signature-drawn" });
  p.add("lkm-signed-buttons", { do: "read", css: ".ui-dialog .ui-dialog-buttonpane button" });
  p.add("lkm-signed-reminder", noReminder("lkm-refund-preview-signed", 3));
  p.add("lkm-proceed", { do: "click", css: ".ui-dialog .ui-dialog-buttonpane button", text: "Proceed" });
  p.add("lkm-proceed-idle", { do: "idle", timeoutS: 180, soft: true });
  p.add("lkm-fee", { do: "gate", css: "#lkmRefundEautoFee", noMatch: "^0\\.00$", timeoutS: 60 }); // GATE: refund committed
  p.add("lkm-after-reminder", noReminder("step5-after-lkm-refund-proceed", 5));
  p.add("lkm-after-summary", { do: "read", from: "Payment Summary", chars: 520 });
}

/**
 * Company/Business Profile Update (Pre e-Invoice) of a company whose main user has NOT done it yet, from the dashboard
 * (signed in, home pop-ups closed): tile COMPANY/ BUSINESS PROFILE (`#company-business-profile`) -> "Company/Business
 * Profile Update" (`einvoice/view.do`, [Update Now] `#to-update`) -> Step 1 "Company/Business Details"
 * (`einvoice/transaction/data-entry.do`; PIC "Same details as Main User", TIN prefilled; SST No "Not Applicable"
 * `#without-sst` ticked when it is not) -> [Next] (`#to-payment`, label "Next") -> Step 2 (`document-verification.do`,
 * on the QA companies "Trading License Document Verification") read on arrival. STOPS on Step 2: its forward button is
 * "Upload & Submit" (it submits a document), never pressed here; `profileUpdateUploadToStep3` continues from here.
 * Labels: profile, profile-arrival, step1, step1-arrival, step1-title, step1-sst, step1-next, step1-after-next,
 * step2, step2-arrival, step2-title, step2-text.
 * Seen (Chrome, staging /eauto/ 21.10.2026, QA AUTO MOTOR SATU SDN BHD, main user AzfarCo1): lane probes
 * cr/_lanes/03-spec/probes/s16 (dashboard ids, einvoice/view.do `#to-update`, Step 1 controls) and s17 (Step 1 Next ->
 * Step 2 with `#TradingLicense`, "Save & Continue Later", "Upload & Submit"). Step titles `div.content-step-title`.
 * Not run in Firefox 36.
 */
export function profileUpdateToStep2(p: Ff36Plan) {
  p.add(null, { do: "click", css: "#company-business-profile" });
  p.add("profile", { do: "waitFor", url: "einvoice/view\\.do", css: "#to-update", timeoutS: 30 });
  p.add("profile-arrival", noReminder("company-business-profile-update"));
  p.add(null, { do: "click", css: "#to-update" });
  p.add("step1", { do: "waitFor", url: "einvoice/transaction/data-entry\\.do", css: "div.content-step-title", text: "Company/Business Details", timeoutS: 60 });
  p.add("step1-arrival", noReminder("step1-arrival"));
  p.add("step1-title", { do: "read", css: "div.content-step-title" });
  p.add("step1-sst", { do: "click", css: "#without-sst", optional: true });
  p.add("step1-next", { do: "click", css: "#to-payment", text: "Next" });
  p.add("step1-after-next", noReminder("step1-after-next", 4));
  p.add("step2", { do: "waitFor", url: "einvoice/transaction/document-verification\\.do", css: "div.content-step-title", timeoutS: 60 });
  p.add("step2-arrival", noReminder("step2-arrival"));
  p.add("step2-title", { do: "read", css: "div.content-step-title" });
  p.add("step2-text", { do: "read", from: "Please be note", chars: 300 });
}

/** The repo's placeholder Trading License PDF (one page, "QA AUTOMATION - trading licence placeholder - not a real document"). */
export const TRADING_LICENCE_PDF = path.join(__dirname, "..", "..", "assets", "uploads", "trading-licence.pdf");

/**
 * Company/Business Profile Update, from Step 2 "Trading License Document Verification" (where `profileUpdateToStep2`
 * stops) to Step 3 "MVD License Agreement & Thumbprint Verification" on arrival. SUBMITS A DOCUMENT: Azfar 22.10.2026
 * allowed it on a QA company of lanes 5-9 (EAINT-12253 BEH_TS6).
 *  - the PDF goes into `#TradingLicense` (a hidden `input[type=file]`, accept application/pdf, behind the page's own
 *    [Browse File...] `#to-browse-file`); the page writes the file name into `#file-name` ("No file selected." before);
 *  - [Upload & Submit] `#to-upload-tl` (a div.primary-btn): no confirm dialog; its handler posts `#upload-form` as
 *    multipart to `einvoice/trading-license-doc/upload.do` and the server answers with the next page;
 *  - Step 3: the address is whatever the server answers with (expected `einvoice/transaction/consent.do`: that address
 *    exists and sends a company whose Step 2 is not done back to `einvoice/view.do`, probe 2210/p02); waited for as any
 *    einvoice/transaction page other than Step 2 with a `div.content-step-title`, read on arrival (15 s) and read in full;
 *    the reader containers `.applet-container` / `.websocket-container` (the shared MyKad reader include, seen on BMK
 *    `auth-owner.do` 20.10; not yet seen on this page) are only looked for (soft), to record which reader Firefox 36 got.
 *  - nothing on Step 3 is touched (no agreement tick, no Scan IC, no Save & Continue Later): the plan ends with a GATE that
 *    Step 3 was reached (its title names the agreement / thumbprint), so a refused document stops the plan there.
 * Labels: step2-file, step2-file-name, step2-before-submit, step2-submit, step2-after-submit, step2-idle, step3,
 * step3-dialog, step3-title, step3-arrival, step3-text, step3-applet, step3-websocket, step3-gate.
 * Seen (Chrome, staging /uat1/ 22.10.2026, AzfarCo1, read-only probe cr/EAINT-12253/03-spec/probes-2210/p02): Step 2's
 * markup and script (ids above, the upload handler, no confirm). Step 3 itself has never been seen (it is reached only by
 * this submit). Not run in Firefox 36.
 */
export function profileUpdateUploadToStep3(p: Ff36Plan, o: { file?: string } = {}) {
  const file = o.file ?? TRADING_LICENCE_PDF;
  p.add("step2-file", { do: "upload", css: "#TradingLicense", path: file, label: "#file-name" });
  p.add("step2-file-name", { do: "read", css: "#file-name" });
  p.add("step2-before-submit", noReminder("step2-trading-license-chosen", 4));
  p.add("step2-submit", { do: "click", css: "#to-upload-tl", text: "Upload & Submit" });
  p.add("step2-after-submit", noReminder("step2-after-upload-and-submit", 4));
  p.add("step2-idle", { do: "idle", timeoutS: 120, soft: true });
  p.add("step3", { do: "waitFor", url: "einvoice/transaction/(?!document-verification)", css: "div.content-step-title", timeoutS: 120, soft: true });
  p.add("step3-dialog", { do: "read", css: ".ui-dialog" });
  p.add("step3-title", { do: "read", css: "div.content-step-title" });
  p.add("step3-arrival", noReminder("step3-arrival", 15));
  p.add("step3-text", { do: "read", css: "#view-container", chars: 2500 });
  p.add("step3-applet", { do: "waitFor", css: ".applet-container", timeoutS: 5, soft: true });
  p.add("step3-websocket", { do: "waitFor", css: ".websocket-container", timeoutS: 3, soft: true });
  p.add("step3-gate", { do: "gate", css: "div.content-step-title", match: "MVD|Agreement|Thum", timeoutS: 10 });
}

// ------------------------------------------------------------------ BY HAND on the real reader (added 22.10.2026, EAINT-12253 FF_TS6 / BEH_TS6)
// Firefox 36 reads the card through the Java applet (`checkBrowserVersionForDermalog()`: Firefox < 37 gets
// `.applet-container`, knowledge/_core/mykad-emulator.md), which no emulator can feed. These plans stop at each card /
// thumbprint step with a `manual` step: a yellow banner tells Azfar what to do on the Firefox 36 window, the bridge
// presses nothing and waits (default 5 minutes) for the page to move on. Run with the MyKad emulator CLOSED and DERMALOG
// MyBioID running, Java allowed (`ts.ff36.run(..., { javaPlugin: true })`). UNVERIFIED like every Firefox 36 plan:
// they cannot have a verify spec without a person at the reader.

/** The banners Azfar reads (plain words; he does exactly this and nothing else). */
export const BY_HAND = {
  activation:
    "AZFAR: Account Activation. Insert your MyKad in the reader, press [Scan IC], give your thumbprint, and finish the activation as the page asks (allow / run Java if Firefox or Java asks). The test goes on by itself when the page leaves Account Activation.",
  bmkOwner:
    "AZFAR: BMK Step 1 Owner. Insert your MyKad, press [Scan IC] in the reader panel, give your thumbprint (allow / run Java if asked), then press the panel's Next if it shows one. The test goes on by itself when Step 2 Vehicle opens.",
  bmkDealer:
    "AZFAR: BMK Step 3 Dealer (login user's MyKad = yours). Keep your MyKad in, press [Scan IC], give your thumbprint, then the panel's Next if it shows one. The test goes on by itself when Step 4 JPJ Check opens.",
  profileThumb:
    "AZFAR: Step 3 MVD Agreement. Tick the agreement, insert your MyKad, press [Scan IC], give your thumbprint. Do NOT press Submit yet: when the thumbprint is verified, press the button below.",
  profileSubmit:
    "AZFAR: now press the page's Submit, and Yes / OK on any message it shows. The test goes on by itself when the page leaves Step 3.",
};
/** The banner button a person presses when their step is done but the page itself does not move on. */
export const DONE_BUTTON = "Done - continue the test";
/** Default wait for a person's step: 5 minutes; MANUAL_WAIT_S overrides it. */
export const manualWaitS = () => Number(process.env.MANUAL_WAIT_S || 300);

/**
 * Sign in to Firefox 36 as a NEW main user and, if eAuto shows Account Activation, let Azfar do it by hand (MyKad +
 * thumbprint through the applet). Ends when the page is no longer Account Activation: home, or the first-login password
 * page, which the spec then changes in Chrome (`LoginPage.changeFirstLoginPassword`, as probe p04 / lane s05). Signed in
 * already (activated before): both steps return at once. Labels: login, activation.
 */
export function accountActivationByHand(p: Ff36Plan, as: Extract<Ff36Action, { do: "login" }>["as"], o: { waitS?: number } = {}) {
  p.add("login", { do: "login", as, firstLogin: true, keepPopups: true, shot: "after-login" });
  p.add("activation", { do: "manual", banner: BY_HAND.activation, ready: DONE_BUTTON, until: { url: "^(?!.*/public/activation/)" }, timeoutS: o.waitS ?? manualWaitS(), shotBefore: "account-activation", shot: "after-account-activation" });
}

/**
 * A NEW BMK, the whole happy flow in Firefox 36 (EAINT-12253 FF_TS6 BMK #2, Azfar 22.10.2026: no switch to Chrome), signed
 * in, from the BMK landing to Step 6 Purchase, PAYING at Step 5 (`expectedTotal` gate first). Selectors as the Chrome page
 * object `pages/ucd/bmk-wizard.page.ts` (walked live 20.10 p05 / p08, BMK verify runs 21.10) and the saved Step 1 / 3 / 4
 * markup (cr/EAINT-12253/03-spec/probes-2010/out/p05):
 *  - landing `view/ucd/bmk/view.do` -> `#create-tx` (PURCHASE BMK) -> `bmk/transaction/view.do` -> owner tile
 *    `a.owner-category[category="1"]` (MyKad - MALAYSIAN) -> "Owner Category ID" dialog, Yes;
 *  - Step 1 Owner `auth-owner.do`: `#vehicleRegNo` typed, `#owner-consent` clicked: the page saves the vehicle
 *    (`save-info.do`), marks the box `disabled` and opens the reader (in Firefox 36 the applet, `showApplet()`): waited
 *    for as `#owner-consent[disabled]`; then BY HAND (Azfar's MyKad + thumbprint) until `data-entry.do`. If Azfar
 *    presses the banner's Done instead, the WebSocket panel's Next `#continueButton` is pressed only if visible;
 *  - Step 2 Vehicle `data-entry.do`: GATE `#vehicleRegNo[value="<vehicle>"]` (the BMK is for the vehicle typed; the
 *    server writes it into the field), `#to-continue` -> "Sure want to continue?" Yes;
 *  - Step 3 Dealer `auth-ucd.do`: `#ucd-consent` clicked (saves the prefilled JPJ receipt email, `disabled`, reader
 *    opens) -> BY HAND until `jpj-enq.do`;
 *  - Step 4 JPJ Check `jpj-enq.do`: `#to-agree` -> `#to-enquiry` NEXT -> "Submit to JPJ for checking?" Yes -> "Response
 *    Code:" -> `input#to-payment` Make Payment -> "Proceed for payment?" Yes;
 *  - Step 5 -> Step 6: `bmkStep5PayToStep6`.
 * The reminder is read on arrival at every step, all through each hand step (manual), after the JPJ result and after
 * the payment button. Labels: landing, category, category-confirm, step1, step1-arrival, step1-vehicle, step1-consent,
 * step1-reader, step1-hand, step2, step2-arrival, step2-vehicle, step2-confirm, step3, step3-arrival, step3-consent,
 * step3-reader, step3-hand, step4, step4-arrival, step4-confirm, step4-result, step4-result-text, step4-after-enquiry,
 * step4-pay-confirm, then bmkStep5PayToStep6's.
 */
export function bmkByHandToStep6(p: Ff36Plan, o: { vehicle: string; expectedTotal: string; waitS?: number }) {
  const waitS = o.waitS ?? manualWaitS();
  p.add(null, { do: "goto", path: "view/ucd/bmk/view.do" });
  p.add("landing", { do: "waitFor", css: "#create-tx", timeoutS: 30, shot: "bmk-landing" });
  p.add(null, { do: "closeHomePopups" });
  p.add(null, { do: "click", css: "#create-tx" });
  p.add("category", { do: "waitFor", url: "bmk/transaction/view\\.do", css: 'a.owner-category[category="1"]', timeoutS: 30 });
  p.add(null, { do: "closeHomePopups" });
  p.add(null, { do: "click", css: 'a.owner-category[category="1"]' });
  p.add("category-confirm", { do: "confirm", accept: true, timeoutS: 15, shot: "owner-category-confirm" });
  // Step 1 Owner
  p.add("step1", { do: "waitFor", url: "bmk/transaction/auth-owner\\.do", css: "#owner-consent", timeoutS: 30 });
  p.add("step1-arrival", noReminder("step1-owner-arrival"));
  p.add("step1-vehicle", { do: "fill", css: "#vehicleRegNo", value: o.vehicle });
  p.add("step1-consent", { do: "click", css: "#owner-consent" });
  p.add("step1-reader", { do: "waitFor", css: "#owner-consent[disabled]", timeoutS: 30 });
  p.add("step1-hand", { do: "manual", banner: BY_HAND.bmkOwner, ready: DONE_BUTTON, until: { url: "bmk/transaction/data-entry\\.do" }, timeoutS: waitS, shotBefore: "step1-owner-reader-open" });
  p.add(null, { do: "click", css: "#continueButton", optional: true });
  // Step 2 Vehicle
  p.add("step2", { do: "waitFor", url: "bmk/transaction/data-entry\\.do", css: "#to-continue", timeoutS: 60 });
  p.add("step2-arrival", noReminder("step2-vehicle-arrival"));
  p.add("step2-vehicle", { do: "waitFor", css: `#vehicleRegNo[value="${o.vehicle}"]`, timeoutS: 10 }); // GATE
  p.add(null, { do: "click", css: "#to-continue" });
  p.add("step2-confirm", { do: "confirm", accept: true, timeoutS: 15, shot: "step2-continue-confirm" });
  // Step 3 Dealer
  p.add("step3", { do: "waitFor", url: "bmk/transaction/auth-ucd\\.do", css: "#ucd-consent", timeoutS: 30 });
  p.add("step3-arrival", noReminder("step3-dealer-arrival"));
  p.add("step3-consent", { do: "click", css: "#ucd-consent" });
  p.add("step3-reader", { do: "waitFor", css: "#ucd-consent[disabled]", timeoutS: 30 });
  p.add("step3-hand", { do: "manual", banner: BY_HAND.bmkDealer, ready: DONE_BUTTON, until: { url: "bmk/transaction/jpj-enq\\.do" }, timeoutS: waitS, shotBefore: "step3-dealer-reader-open" });
  p.add(null, { do: "click", css: "#continueButton", optional: true });
  // Step 4 JPJ Check
  p.add("step4", { do: "waitFor", url: "bmk/transaction/jpj-enq\\.do", css: "#to-agree", timeoutS: 60 });
  p.add("step4-arrival", noReminder("step4-jpj-check-arrival"));
  p.add(null, { do: "click", css: "#to-agree" });
  p.add(null, { do: "waitFor", css: "#to-enquiry", timeoutS: 10 });
  p.add(null, { do: "click", css: "#to-enquiry" });
  p.add("step4-confirm", { do: "confirm", accept: true, timeoutS: 15, shot: "step4-submit-to-jpj-confirm" });
  p.add("step4-result", { do: "waitFor", css: "body", text: "Response Code:", timeoutS: 90 });
  p.add("step4-result-text", { do: "read", from: "Response Code:", chars: 160 });
  p.add("step4-after-enquiry", noReminder("step4-jpj-result", 4));
  p.add(null, { do: "click", css: "input#to-payment" });
  p.add("step4-pay-confirm", { do: "confirm", accept: true, timeoutS: 15, shot: "step4-proceed-for-payment-confirm" });
  bmkStep5PayToStep6(p, { expectedTotal: o.expectedTotal });
}

/**
 * Company/Business Profile Update Step 3 "MVD License Agreement & Thumbprint Verification" (`einvoice/transaction/consent.do`,
 * reached by `profileUpdateUploadToStep3`) BY HAND, then the screen after the submit and the update page (EAINT-12253
 * BEH_TS6 E3). Nothing on Step 3 is pressed by the plan: its agreement box and Submit were never seen (Step 3 itself was
 * seen only on arrival, Firefox 36 22.10.2026, FAILED/12253_BEH_TS6/2026-10-22T05-02-43_EVIDENCE), so Azfar does them:
 *  1. hand step: agreement, MyKad, thumbprint; he presses the banner's Done once it is verified (or the page moves on);
 *  2. "step3-before-submit": the reminder read + screenshot with the thumbprint done, before the submit;
 *  3. hand step: Azfar presses Submit (and Yes / OK), until the page leaves consent.do;
 *  4. the screen that follows: the reminder read on arrival (10 s), its text and any dialog read;
 *  5. the update page `view/ucd/einvoice/view.do` read from "MyKad/Thumbprint verified on" (the label the precondition
 *     check reads as "-" before the update), with the reminder read there too.
 * Labels: step3-hand, step3-before-submit, step3-submit-hand, after-submit, after-submit-text, after-submit-dialog,
 * profile-after, profile-after-verified, profile-after-text, profile-after-reminder.
 */
export function profileUpdateStep3ByHand(p: Ff36Plan, o: { waitS?: number } = {}) {
  const waitS = o.waitS ?? manualWaitS();
  const offStep3 = "^(?!.*/einvoice/transaction/consent\\.do)";
  p.add("step3-hand", { do: "manual", banner: BY_HAND.profileThumb, ready: DONE_BUTTON, until: { url: offStep3 }, timeoutS: waitS, shotBefore: "step3-before-thumbprint" });
  p.add("step3-before-submit", noReminder("step3-thumbprint-done-before-submit", 3));
  p.add("step3-submit-hand", { do: "manual", banner: BY_HAND.profileSubmit, until: { url: offStep3 }, timeoutS: waitS });
  p.add("after-submit", noReminder("screen-after-submit", 10));
  p.add("after-submit-text", { do: "read", css: "#view-container", chars: 900 });
  p.add("after-submit-dialog", { do: "read", css: ".ui-dialog" });
  p.add(null, { do: "goto", path: "view/ucd/einvoice/view.do" });
  p.add("profile-after", { do: "waitFor", css: "body", text: "Thumbprint verified on", timeoutS: 30, soft: true });
  p.add("profile-after-verified", { do: "read", from: "MyKad/Thumbprint verified on", chars: 80 });
  p.add("profile-after-text", { do: "read", from: "TIN:", chars: 600 });
  p.add("profile-after-reminder", noReminder("profile-update-page-after-submit", 5));
}
