/**
 * The dealer's own steps on /obs/ that the onboarding BUILD (onboarding.flow.ts) never takes, written 30.10.2026 by
 * cr-author for EAINT-11868. Kept out of onboarding.flow.ts on purpose: that flow is VERIFIED and every sheet-EM build
 * runs on it; these journeys are new and UNVERIFIED (tests/flows/obs-dealer.verify.spec.ts).
 *
 *   saveApplicationDraft   the Application link → fill Step 1 (or Steps 1-3) → Save & Continue Later (a Draft)
 *   saveRegistrationDraft  the Application link on Step 4 → upload N sections → Save & Continue Later
 *   payRegistrationFee     the Application link on Step 5 → pay the registration fee with a chosen OUTCOME (failed)
 *   runReactivation        the expiry email's [Reactivate Application] link → the "Dealer Application Reactivation"
 *                          page → declaration → payment method → Submit and Pay → the Fiuu sandbox → the hand-back,
 *                          with `stopAfter`: opened | declared | gateway | paid
 *
 * Payments reuse the onboarding flow's path: the tiles through `choosePaymentTile`, the FPX window through
 * `completePayment` (pages/obs/fiuu.page.ts: host-locked sandbox login; a failed payment sets the Bank Simulator's
 * status code instead of Approved and never presses before it reads that code). A card payment reuses the Fiuu card
 * form driver of the Secarang flow (`SecarangFiuuPopup.payCard`, VERIFIED 29.10.2026: the same Fiuu card form).
 *
 * Every link here is SIGNED (the Application link and the reactivate link): the reactivate link is opened without its
 * address in any step title (ReactivationPage.open); neither is returned in a result or logged.
 */
import type { BrowserContext, Page } from "@playwright/test";
import * as path from "node:path";
import type { OnboardingProfile } from "@data/onboarding-profile";
import { ApplicationPage } from "@pages/obs/application.page";
import { RegistrationPage, type PaymentResult, type RegistrationFee } from "@pages/obs/registration.page";
import { ReactivationPage, type ObsLanding, type ReactivationSummary } from "@pages/obs/reactivation.page";
import { completePayment } from "@pages/obs/fiuu.page";
import type { PaymentMethod } from "@pages/obs/obs-page";
import { SecarangFiuuPopup, type SandboxCard } from "@pages/secarang/fiuu-popup.page";

const UPLOADS = path.join(__dirname, "..", "..", "assets", "uploads");

/** The Bank Simulator code a FAILED FPX payment uses (seen failing in the VERIFIED Secarang run all2, 29.10.2026). */
export const FPX_FAIL_CODE = "51";

const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return ""; } };
const body = async (page: Page) => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------ the Application form, saved for later

export interface DraftResult {
  openedOn: number;
  savedOn: number;
  /** Dialog / banner texts the save showed (the caller reads the state back in BackOffice). */
  said: string[];
}

/**
 * Open the Application link of an APPROVED Pre-Application whose form was never submitted, fill Step 1 (`atStep` 1)
 * or Steps 1-3 (`atStep` 3, the director name / MyKad typed for Business Trading), and press Save & Continue Later.
 * The link must open on Step 1 (a fresh form): anything else is reported, not worked round.
 */
export async function saveApplicationDraft(page: Page, o: { link: string; profile: OnboardingProfile; atStep: 1 | 3 }): Promise<DraftResult> {
  const form = new ApplicationPage(page);
  await form.open(o.link);
  const openedOn = await form.openedStep();
  if (openedOn !== 1) throw new Error(`The Application link opened on step ${openedOn || "(none)"}, not step 1: this form is not a fresh one.`);
  const p = o.profile;
  await form.fillBusinessInformation(p);
  if (o.atStep === 3) {
    await form.goToUploads();
    await form.fillDirectorNames(p.directorName ?? "QA DIRECTOR A");
    await form.uploadAll(UPLOADS);
    await form.goToAcknowledgement();
    await form.fillAcknowledgement({ ...p, directorName: p.directorName ?? "QA DIRECTOR A", directorMyKad: p.directorMyKad ?? "750101145678" });
  }
  const savedOn = await form.currentStep();
  if (savedOn !== o.atStep) throw new Error(`Meant to save on step ${o.atStep}, but step ${savedOn || "(none)"} is showing.`);
  const said = await form.saveForLater();
  return { openedOn, savedOn, said };
}

/** Open the Application link on Step 4, upload `sections` of the Registration Documents, Save & Continue Later. */
export async function saveRegistrationDraft(page: Page, o: { link: string; sections: number }): Promise<{ uploaded: string[]; said: string[]; counts: { section: string; attachments: number }[] }> {
  const reg = new RegistrationPage(page);
  const step = await reg.open(o.link);
  if (step !== 4) throw new Error(`The Application link opened on step ${step || "(none)"}, not step 4 (Registration Documents).`);
  const uploaded = await reg.uploadSome(path.join(UPLOADS, "registration-document.pdf"), o.sections);
  const said = await reg.saveForLater();
  return { uploaded, said, counts: await reg.sectionCounts() };
}

// ------------------------------------------------------------------ the registration fee with an outcome

export interface FeeAttempt {
  fee: RegistrationFee;
  bank: string;
  amountsSeen: number[];
  /** The receipt when the link shows "Application Payment Success", else null. */
  receipt: PaymentResult | null;
  /** What the dealer's page shows after the gateway handed back (path + words). */
  afterPath: string;
  afterText: string;
}

/**
 * Pay the registration fee on Step 5 by FPX with `outcome` ("failed": the Bank Simulator's status code
 * `FPX_FAIL_CODE` instead of Approved). Returns what the page shows after the hand-back; the caller reads BackOffice
 * (Registration Fee) for the state.
 */
export async function payRegistrationFee(page: Page, context: BrowserContext, o: { link: string; outcome: "approved" | "failed"; failCode?: string }): Promise<FeeAttempt> {
  const reg = new RegistrationPage(page);
  const step = await reg.open(o.link);
  if (step !== 5) throw new Error(`The Application link opened on step ${step || "(none)"}, not step 5 (Payment).`);
  const fee = await reg.feeSummary();
  const bank = await reg.choosePayment("Online Banking (Personal)");
  const gatewayOpens = context.waitForEvent("page", { timeout: 60_000 }).catch(() => null);
  await reg.submitAndPay();
  const gateway = await gatewayOpens;
  if (!gateway) throw new Error("The FPX gateway never opened its window for the registration fee.");
  await gateway.waitForLoadState("domcontentloaded").catch(() => undefined);
  const { amountsSeen } = await completePayment(gateway, 8, 45_000, { statusCode: o.outcome === "failed" ? (o.failCode ?? FPX_FAIL_CODE) : undefined });
  // The hand-back: success replaces the form with the receipt; a failure is not seen yet, so wait a bounded time.
  await page.getByText(/Application Payment Success|unsuccessful|failed/i).first().waitFor({ state: "visible", timeout: 120_000 }).catch(() => undefined);
  await page.waitForTimeout(2_000);
  return { fee, bank, amountsSeen, receipt: await reg.receipt(), afterPath: pathOf(page.url()), afterText: (await body(page)).slice(0, 800) };
}

// ------------------------------------------------------------------ the reactivation from the expiry email

export type ReactivationStop = "opened" | "declared" | "gateway" | "paid";

export interface ReactivationOptions {
  /** The [Reactivate Application] href from the expiry email (signed: never logged). */
  link: string;
  /** Default "paid". */
  stopAfter?: ReactivationStop;
  /** Default "Online Banking (Personal)". */
  method?: PaymentMethod;
  /** FPX only. Default "approved". */
  outcome?: "approved" | "failed";
  failCode?: string;
  /** Required for "Credit or Debit Card". */
  card?: SandboxCard;
  /** Called on the confirmation page as opened, and after the declaration + payment method: the caller's screenshots. */
  hooks?: { opened?: () => Promise<void>; declared?: () => Promise<void> };
}

export interface ReactivationResult {
  /** What the link opened BEFORE anything was pressed. */
  landing: ObsLanding;
  summary?: ReactivationSummary;
  bank?: string;
  /** The gateway window, left OPEN when stopAfter = "gateway" (the caller closes it, goes Back in it, or pays in it). */
  gateway?: Page;
  amountsSeen?: number[];
  /** Local clock when the gateway handed back. */
  handedBackAt?: Date;
  /** The page after the hand-back: its path, its words, the "Unsuccessful Payment" box if shown, a Pre-Application No if printed. */
  after?: { path: string; text: string; unsuccessful: string; preAppNo: string };
}

/**
 * The reactivation journey (SRD v1.4 §2.2.6 #1-#3). Throws when a stop past "opened" is asked for and the link did not
 * open the confirmation page (the caller asked to pay on a page that does not offer it). Does not judge the payment's
 * outcome: `after` says what the page shows, the caller proves it against the TS.
 */
export async function runReactivation(page: Page, context: BrowserContext, o: ReactivationOptions): Promise<ReactivationResult> {
  const stop = o.stopAfter ?? "paid";
  const rp = new ReactivationPage(page);
  const landing = await rp.open(o.link);
  const out: ReactivationResult = { landing };
  if (landing.kind === "confirmation") out.summary = await rp.summary();
  await o.hooks?.opened?.();
  if (stop === "opened") return out;
  if (landing.kind !== "confirmation") {
    throw new Error(`The reactivate link opened ${landing.kind === "form" ? `the form (step ${landing.step})` : landing.kind}, not the confirmation page: nothing to pay on.`);
  }

  await rp.acceptDeclaration();
  const method = o.method ?? "Online Banking (Personal)";
  out.bank = await rp.choosePayment(method);
  await o.hooks?.declared?.();
  if (stop === "declared") return out;

  const gatewayOpens = context.waitForEvent("page", { timeout: 60_000 }).catch(() => null);
  await rp.submitAndPay();
  const gateway = await gatewayOpens;
  if (!gateway) throw new Error("Submit and Pay opened no payment window.");
  await gateway.waitForLoadState("domcontentloaded").catch(() => undefined);
  out.gateway = gateway;
  if (stop === "gateway") return out;

  if (method === "Credit or Debit Card") {
    if (!o.card) throw new Error("A card payment needs `card` (a Fiuu sandbox test card).");
    await new SecarangFiuuPopup(gateway).payCard(o.card);
    out.amountsSeen = [];
  } else {
    const r = await completePayment(gateway, 8, 45_000, { statusCode: (o.outcome ?? "approved") === "failed" ? (o.failCode ?? FPX_FAIL_CODE) : undefined });
    out.amountsSeen = r.amountsSeen;
  }
  out.gateway = undefined;
  out.after = await handBack(page, rp);
  out.handedBackAt = new Date();
  return out;
}

/** Wait (bounded) for the gateway to hand back to the dealer's page, then read what it shows. */
export async function handBack(page: Page, rp = new ReactivationPage(page), timeout = 180_000): Promise<NonNullable<ReactivationResult["after"]>> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const p = pathOf(page.url());
    const unsuccessful = await rp.unsuccessful();
    if (unsuccessful || (p && !/\/obs\/form\/reactivate/i.test(p)) || Date.now() > deadline) break;
    await page.waitForTimeout(2_000);
  }
  await page.waitForTimeout(2_000);
  const text = await body(page);
  return { path: pathOf(page.url()), text: text.slice(0, 1200), unsuccessful: await rp.unsuccessful(), preAppNo: /P\d{6}\/\d{5}/.exec(text)?.[0] ?? "" };
}
