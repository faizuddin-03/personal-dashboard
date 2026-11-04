// VERIFY SPEC for src/flows/onboarding.flow.ts (src/flows/README.md): the live run that moves the flow from UNVERIFIED
// to VERIFIED. Written 30.10.2026 by cr-author (EAINT-11868) when the flow gained `seed.companyName`. It covers every
// stop sheet 1 of EAINT-11868 uses (approve-preapp, appform, submit-approval, approve-app, regdocs, verify-regdocs,
// record) by stopping at each in turn and resuming from the checkpoint, plus the new company-name option.
//
//   CR_TICKET=EAINT-11868 RUN_ID=EAINT-11868-verify-onboarding-<stamp> INSTANCE=eauto RECORD=1 \
//     npx playwright test --project=flows onboarding.verify
//
// CREATES records on staging /obs/ (generated companies seeded in eSim, RM108 + the registration fee in the Fiuu
// sandbox, BO approve as `bo` = jasons, Submit for Approval / Verified as `boAdmin`). Needs the VPN (eSim). Run it on
// the build the CR specs will run on: after Dev deploys EAINT-11868 to /obs/. Nothing here creates a UCD account.
import { test, expect } from "@fixtures";
import { LoginPage } from "@auth/login";
import { newLabel, saveCheckpoint } from "@fixtures/checkpoint";
import {
  runOnboarding,
  closeOnboardingRun,
  type OnboardingCheckpoint,
  type OnboardingPhase,
  type OnboardingRun,
} from "@flows/onboarding.flow";
import type { OnboardingType } from "@data/onboarding-profile";
import { BackOfficePage, BO_MENU } from "@pages/obs/backoffice.page";
import type { Browser, BrowserContext } from "@playwright/test";

const note = (type: string, description: string) => test.info().annotations.push({ type, description });

function newRun(browser: Browser, dealer: BrowserContext, type: OnboardingType, companyName?: string): OnboardingRun {
  const now = new Date().toISOString();
  const cp = saveCheckpoint({ label: newLabel(), createdAt: now, updatedAt: now, profile: {} as never, phases: {} }) as OnboardingCheckpoint;
  note("checkpoint", cp.label);
  return {
    browser,
    dealer,
    cp,
    log: (line) => console.log(`  ${line}`),
    gateTimeoutMs: 120_000,
    videoDir: test.info().outputDir,
    seed: { type, company: "generated", companyName, directors: 2, secretaries: 0, shareholders: 0, foreign: 0 },
  };
}

/** The last phase done is exactly `stop`, and the one after it was not run. */
function stoppedAt(cp: OnboardingCheckpoint, stop: OnboardingPhase, next?: OnboardingPhase) {
  expect(cp.phases[stop], `the build should have completed "${stop}"`).toBeTruthy();
  if (next) expect(cp.phases[next], `"${next}" must not run when the build stops after "${stop}"`).toBeFalsy();
}

test.describe.configure({ mode: "serial" });

test.describe("onboarding flow verify", () => {
  test("ROC, generated: stops at each stop the 11868 sheet uses and resumes to record", async ({ browser, context }) => {
    test.setTimeout(60 * 60 * 1000);
    const run = newRun(browser, context, "ROC");
    try {
      let r = await runOnboarding(run, { until: "approve-preapp" });
      stoppedAt(run.cp, "approve-preapp", "appform");
      expect(run.cp.preAppNo).toMatch(/^P\d{6}\/\d{5}$/);
      expect(run.cp.dealerLink).toMatch(/\/obs\/form\/[0-9a-f-]{36}\?/i);

      r = await runOnboarding(run, { until: "appform" });
      stoppedAt(run.cp, "appform", "assign");
      expect(r.appform.confirmation, "the Application form confirmed the submission").toBeTruthy();

      r = await runOnboarding(run, { until: "submit-approval" });
      stoppedAt(run.cp, "submit-approval", "approve-app");
      expect(run.cp.applicationNo).toMatch(/^NA\d{8}$/);
      expect(String(r["submit-approval"].stage2)).toMatch(/Pending Approver/i);

      r = await runOnboarding(run, { until: "approve-app" });
      stoppedAt(run.cp, "approve-app", "regdocs");
      expect(r["approve-app"].status).toMatch(/^Approved$/i);

      r = await runOnboarding(run, { until: "regdocs" });
      stoppedAt(run.cp, "regdocs", "verify-regdocs");

      r = await runOnboarding(run, { until: "verify-regdocs" });
      stoppedAt(run.cp, "verify-regdocs", "regfee");
      expect(String(r["verify-regdocs"].verifiedAt)).not.toMatch(/^-?$/);

      r = await runOnboarding(run, { until: "record" });
      stoppedAt(run.cp, "record");
      const row = r.record.row as Record<string, string>;
      note("record row", JSON.stringify(row));
      expect(row["Application Status"]).toMatch(/^Approved$/i);
      expect(row["Softcopy Docs"]).toMatch(/^Checked$/i);
      expect(row["Registration Fee"]).toMatch(/^OK$/i);
      expect(row["Hardcopy & Acc Created"]).not.toMatch(/^Registered$/i);
      note("application", `${run.cp.preAppNo} / ${run.cp.applicationNo}`);
    } finally {
      await closeOnboardingRun(run);
    }
  });

  test("LLP, generated, with a company name carrying & ' ( ) . : typed and listed exactly", async ({ browser, context, page }) => {
    test.setTimeout(40 * 60 * 1000);
    // Not EAINT-11868 EM_TS4's own name: that TS must find exactly one application called A&B O'NEIL MOTOR (M) PLT.
    const name = `A&B O'NEIL VERIFY ${Date.now().toString(36).toUpperCase()} (M) PLT.`;
    const run = newRun(browser, context, "LLP", name);
    try {
      await runOnboarding(run, { until: "appform" });
      stoppedAt(run.cp, "appform", "assign");
      expect((run.cp.profile as { businessName?: string }).businessName).toBe(name);
    } finally {
      await closeOnboardingRun(run);
    }
    // Read back in BackOffice on this test's own page (the dealer part is done).
    await context.clearCookies();
    await new LoginPage(page).as("bo");
    const bo = new BackOfficePage(page, context);
    await bo.settle();
    await bo.openListing(BO_MENU.applicationListing);
    await bo.search({ companyName: name });
    expect(await bo.rowLocator(name).count(), "exactly one listing row for the new name").toBe(1);
    const row = await bo.readRow(name);
    note("listing row", JSON.stringify(row));
    expect(row["Company Name"]).toBe(name);
    await test.info().attach("bo-listing-company-name", { body: await page.screenshot(), contentType: "image/png" });
  });
});
