// VERIFY SPEC for src/flows/obs-dealer.flow.ts (src/flows/README.md): the live run that moves the flow from UNVERIFIED
// to VERIFIED. Written 30.10.2026 by cr-author (EAINT-11868, sheets EM + REA). Covers every stop those sheets use:
//
//   A  runReactivation  stopAfter "opened" + "declared"   READ ONLY: an expired application's expiry email (.eml);
//                                                         default NA60001238 (11868_EM_TS20). Nothing is submitted.
//   B  saveApplicationDraft atStep 1 (ROC) and atStep 3 (Business Trading Sarawak)        2 new chains (RM108 each)
//   C  saveRegistrationDraft sections 2                                                   1 new chain
//   D  payRegistrationFee outcome "failed" -> BO Registration Fee = Failed                1 new chain
//   E  runReactivation "gateway" (window closed), outcome "failed", then "paid"           an EXPIRED application of
//      our own whose expiry email is saved: VERIFY_REACTIVATE_PAID_EML (RM108 x2 in the sandbox)
//   F  runReactivation "paid" by card (Credit or Debit Card)                              VERIFY_REACTIVATE_CARD_EML
//
// B-D build with the VERIFIED onboarding flow and run only with VERIFY_OBS_DEALER_BUILD=1 (they CREATE records on
// /obs/: generated companies, RM108 / registration fee in the Fiuu sandbox, BO approve as `bo`, Verified as `boAdmin`).
// E and F need the off-screen expiry first (staging-helper "Expire an onboarding application link now" + the .eml).
//
//   CR_TICKET=EAINT-11868 RUN_ID=EAINT-11868-verify-obs-dealer-<stamp> INSTANCE=eauto RECORD=1 \
//     VERIFY_OBS_DEALER_BUILD=1 npx playwright test --project=flows obs-dealer.verify
import * as path from "node:path";
import { test, expect } from "@fixtures";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "@auth/login";
import { newLabel, saveCheckpoint } from "@fixtures/checkpoint";
import { runOnboarding, closeOnboardingRun, type OnboardingCheckpoint, type OnboardingPhase, type OnboardingRun } from "@flows/onboarding.flow";
import { payRegistrationFee, runReactivation, saveApplicationDraft, saveRegistrationDraft } from "@flows/obs-dealer.flow";
import type { OnboardingType } from "@data/onboarding-profile";
import { FIUU_SANDBOX_CARDS } from "@data/secarang";
import { BackOfficePage } from "@pages/obs/backoffice.page";
import { RegistrationPage } from "@pages/obs/registration.page";
import { readReactivateEmail } from "@pages/obs/expiry-email";

const REPO = path.resolve(__dirname, "..", "..", "..");
const note = (type: string, description: string) => test.info().annotations.push({ type, description });
const BUILD = (process.env.VERIFY_OBS_DEALER_BUILD ?? "").trim() === "1";
const OPEN_EML = (process.env.VERIFY_REACTIVATE_EML ?? path.join(REPO, "cr", "EAINT-11868", "04-runs", "emails", "NA60001238-expiry.eml")).trim();
const PAID_EML = (process.env.VERIFY_REACTIVATE_PAID_EML ?? "").trim();
const CARD_EML = (process.env.VERIFY_REACTIVATE_CARD_EML ?? "").trim();

async function build(browser: Browser, dealer: BrowserContext, type: OnboardingType, until: OnboardingPhase): Promise<OnboardingRun> {
  const now = new Date().toISOString();
  const cp = saveCheckpoint({ label: newLabel(), createdAt: now, updatedAt: now, profile: {} as never, phases: {} }) as OnboardingCheckpoint;
  note("checkpoint", cp.label);
  const run: OnboardingRun = {
    browser, dealer, cp, log: (l) => console.log(`  ${l}`), gateTimeoutMs: 120_000, videoDir: test.info().outputDir,
    seed: { type, company: "generated", directors: 2, secretaries: 0, shareholders: 0, foreign: 0 },
  };
  try { await runOnboarding(run, { until }); } finally { await closeOnboardingRun(run); }
  return run;
}

/** BO > Onboarding > Application Listing row, in a context of its own (a verify spec, not a CR spec). */
async function boRow(browser: Browser, by: { applicationNo?: string; companyName?: string }): Promise<Record<string, string>> {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: test.info().outputDir } });
  try {
    const page = await ctx.newPage();
    await new LoginPage(page).as("bo");
    const bo = new BackOfficePage(page, ctx);
    await bo.settle();
    const { detail, row } = await bo.openApplication(by);
    await detail.close().catch(() => undefined);
    return row;
  } finally {
    await ctx.close();
  }
}

async function dealerTab(context: BrowserContext): Promise<Page> {
  await context.clearCookies();
  return context.pages()[0] ?? context.newPage();
}

test.describe.configure({ mode: "serial" });

test.describe("obs-dealer flow verify", () => {
  test("A. runReactivation opened + declared on an expired application (read only)", async ({ page, context }) => {
    test.setTimeout(5 * 60_000);
    const mail = readReactivateEmail(OPEN_EML);
    note("email", `${mail.subject} -> ${mail.shown}`);
    const opened = await runReactivation(page, context, { link: mail.url, stopAfter: "opened" });
    expect(opened.landing.kind, "the link opens the Dealer Application Reactivation page").toBe("confirmation");
    expect(opened.summary && Math.round((opened.summary.fee + opened.summary.sst) * 100) === Math.round(opened.summary.total * 100), "fee + SST = total").toBe(true);
    note("summary", `fee ${opened.summary?.fee} + SST ${opened.summary?.sstRate}% ${opened.summary?.sst} = ${opened.summary?.total}`);
    const declared = await runReactivation(page, context, { link: mail.url, stopAfter: "declared" });
    expect(declared.bank, "a bank tile is chosen after the declaration").toBeTruthy();
    await expect(page.locator("#payment-method-section")).toBeVisible();
  });

  test("B. saveApplicationDraft at Step 1 (ROC) and Step 3 (Business Trading Sarawak)", async ({ browser, context }) => {
    test.skip(!BUILD, "creates two chains: VERIFY_OBS_DEALER_BUILD=1");
    test.setTimeout(60 * 60_000);
    for (const [type, atStep] of [["ROC", 1], ["SARAWAK", 3]] as const) {
      const run = await build(browser, context, type, "approve-preapp");
      const page = await dealerTab(context);
      const saved = await saveApplicationDraft(page, { link: run.cp.dealerLink!, profile: run.cp.profile, atStep });
      expect(saved.savedOn).toBe(atStep);
      note(`draft ${type}`, `saved on step ${saved.savedOn}: ${saved.said.join(" | ")}`);
      const row = await boRow(browser, { companyName: run.cp.profile.businessName });
      expect(row["Application Status"], `${type}: the listing reads Draft after Save & Continue Later`).toMatch(/^Draft$/i);
      // Reopened, the link restores the step it was saved on.
      const again = await dealerTab(context);
      const step = await new RegistrationPage(again).open(run.cp.dealerLink!);
      expect(step, `${type}: the link reopens on the saved step`).toBe(atStep);
    }
  });

  test("C. saveRegistrationDraft: two sections on Step 4, kept when the link is reopened", async ({ browser, context }) => {
    test.skip(!BUILD, "creates a chain: VERIFY_OBS_DEALER_BUILD=1");
    test.setTimeout(45 * 60_000);
    const run = await build(browser, context, "ROC", "approve-app");
    const page = await dealerTab(context);
    const saved = await saveRegistrationDraft(page, { link: run.cp.dealerLink!, sections: 2 });
    expect(saved.uploaded).toHaveLength(2);
    const reg = new RegistrationPage(page);
    expect(await reg.open(run.cp.dealerLink!)).toBe(4);
    const counts = await reg.sectionCounts();
    expect(counts.filter((c) => c.attachments > 0).map((c) => c.section).sort()).toEqual([...saved.uploaded].sort());
  });

  test("D. payRegistrationFee outcome failed -> Registration Fee Failed", async ({ browser, context }) => {
    test.skip(!BUILD, "creates a chain: VERIFY_OBS_DEALER_BUILD=1");
    test.setTimeout(45 * 60_000);
    const run = await build(browser, context, "ROC", "verify-regdocs");
    const page = await dealerTab(context);
    const attempt = await payRegistrationFee(page, context, { link: run.cp.dealerLink!, outcome: "failed" });
    note("after", `${attempt.afterPath} · receipt ${attempt.receipt?.status ?? "none"} · ${attempt.afterText.slice(0, 200)}`);
    expect(attempt.receipt?.status ?? "", "a failed payment shows no PAID receipt").not.toMatch(/^paid$/i);
    const row = await boRow(browser, { applicationNo: run.cp.applicationNo });
    expect(row["Registration Fee"]).toMatch(/^Failed$/i);
  });

  test("E. runReactivation gateway (closed), failed, then paid on an expired application of our own", async ({ page, context, browser }) => {
    test.skip(!PAID_EML, "needs VERIFY_REACTIVATE_PAID_EML: the expiry email of an application of ours, expired by staging-helper");
    test.setTimeout(20 * 60_000);
    const mail = readReactivateEmail(PAID_EML);
    const gw = await runReactivation(page, context, { link: mail.url, stopAfter: "gateway" });
    expect(gw.gateway, "Submit and Pay opens the payment window").toBeTruthy();
    await gw.gateway!.close();
    const failed = await runReactivation(page, context, { link: mail.url, outcome: "failed" });
    note("failed", `${failed.after?.path} · ${failed.after?.unsuccessful} · ${failed.after?.text.slice(0, 160)}`);
    expect((await boRow(browser, { applicationNo: mail.applicationNo }))["Application Status"], "a failed payment reactivates nothing").toMatch(/^Expired$/i);
    const paid = await runReactivation(page, context, { link: mail.url });
    note("paid", `${paid.after?.path} · ${paid.after?.preAppNo} · ${paid.after?.text.slice(0, 160)}`);
    expect((await boRow(browser, { applicationNo: mail.applicationNo }))["Application Status"]).toMatch(/^Approved$/i);
  });

  test("F. runReactivation paid by card", async ({ page, context, browser }) => {
    test.skip(!CARD_EML, "needs VERIFY_REACTIVATE_CARD_EML: the expiry email of another application of ours, expired by staging-helper");
    test.setTimeout(20 * 60_000);
    const mail = readReactivateEmail(CARD_EML);
    const paid = await runReactivation(page, context, { link: mail.url, method: "Credit or Debit Card", card: FIUU_SANDBOX_CARDS.visa });
    note("paid", `${paid.after?.path} · ${paid.after?.text.slice(0, 160)}`);
    expect((await boRow(browser, { applicationNo: mail.applicationNo }))["Application Status"]).toMatch(/^Approved$/i);
  });
});
