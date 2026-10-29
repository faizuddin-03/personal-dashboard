import { test } from '../fixtures/authFixture';
import { PreApplicationFormPage } from '../pages/ucd/PreApplicationFormPage';
import { ApplicationContinuationPage } from '../pages/ucd/ApplicationContinuationPage';
import { ApplicationListingPage } from '../pages/bo/ApplicationListingPage';
import { ApplicationApprovalPage } from '../pages/bo/ApplicationApprovalPage';
import { runPaymentLeg } from './runPaymentLeg';
import { SCENARIOS } from '../data/scenarios';
import { PaymentLegConfig } from '../data/types';

// ── Shared TS3-TS6 spec shape ───────────────────────────────
// Every TS3-TS6 scenario in the sheet follows the exact same
// Initial Steps -> Pre-Application Payment -> Continuation Steps ->
// Application Payment shape, differing only in business type, channel, and
// bank/card. One builder here instead of four near-identical spec files —
// each tsN.spec.ts just calls `defineScenarioTest('tsN')`.
//
// Called at module scope from each tsN.spec.ts (not inside a test body) —
// this registers the same test.describe/test Playwright itself would see
// if written out longhand in that file.

function describeLeg(leg: PaymentLegConfig): string {
  if (leg.channel === 'fpx-b2b') return `FPX (B2B), Bank: ${leg.bank}`;
  if (leg.channel === 'fpx-b2c') return `FPX (B2C), Bank: ${leg.bank}`;
  if (leg.channel === 'card-credit') return `Card (Credit), ${leg.cardType}`;
  if (leg.channel === 'card-debit') return `Card (Debit), ${leg.cardType}`;
  return 'QR Code';
}

export function defineScenarioTest(key: 'ts3' | 'ts4' | 'ts5' | 'ts6'): void {
  const SCENARIO = SCENARIOS[key];

  test.describe(`${SCENARIO.tsNo} — ${SCENARIO.scenario}`, () => {
    test.setTimeout(0);

    test(`Pre-Application + Application, ${describeLeg(SCENARIO.preApplicationLeg)}`, async ({ page, newBoSession }) => {
      const preApp = new PreApplicationFormPage(page);

      // ── Initial Steps ──
      await test.step('Open eAuto Login page and click "Apply eAuto"; complete Captcha', async () => {
        await preApp.goto();
        await preApp.clickApplyEauto();
        await preApp.completeCaptcha();
      });

      await test.step(`Fill in the Pre-Application form (${SCENARIO.businessType}) and click next`, async () => {
        await preApp.fillForm(SCENARIO.businessType);
        await preApp.clickNext();
      });

      await test.step('Tick the Declaration statement box', async () => {
        await preApp.tickDeclaration();
      });

      // ── Pre-Application Payment ──
      await test.step(`Pre-Application Payment — ${describeLeg(SCENARIO.preApplicationLeg)}`, async () => {
        await runPaymentLeg(page, SCENARIO.preApplicationLeg, 'pre-application');
      });

      // ── Continuation Steps (BO + UCD interleaved) ──
      let applicationLink = '';
      await test.step('BO - Open Application Listing and view Pre-Application tab; copy the Application Link', async () => {
        const mfaredCtx = await newBoSession('mfared');
        const boPage = await mfaredCtx.newPage();
        const listing = new ApplicationListingPage(boPage);
        await listing.goto();
        await listing.openPreApplicationTab();
        applicationLink = await listing.copyApplicationLink(SCENARIO.tsNo);
      });

      const continuation = new ApplicationContinuationPage(page);
      await test.step('UCD - Open the Application Link in a new tab and fill in the application details until complete', async () => {
        await continuation.openViaLink(applicationLink);
        await continuation.fillApplicationDetailsUntilComplete();
      });

      await test.step('BO (mfared) - Set UCD group to Authorized Dealer and click "Submit For Approval"', async () => {
        const mfaredCtx = await newBoSession('mfared');
        const boPage = await mfaredCtx.newPage();
        const approval = new ApplicationApprovalPage(boPage);
        await approval.openApplicationDetails(SCENARIO.tsNo);
        await approval.setUcdGroupAuthorizedDealer();
        await approval.clickSubmitForApproval();
      });

      await test.step('BO (jasons) - Click the Approve button in the BO Application form', async () => {
        const jasonsCtx = await newBoSession('jasons');
        const boPage = await jasonsCtx.newPage();
        const approval = new ApplicationApprovalPage(boPage);
        await approval.openApplicationDetails(SCENARIO.tsNo);
        await approval.clickApprove();
      });

      await test.step('UCD - Refresh the Application Link and upload the documents in Page 4', async () => {
        await continuation.refreshAndUploadDocumentsPage4();
      });

      await test.step('BO (mfared) - Open Application Details > Registration Documents tab > Click Verified', async () => {
        const mfaredCtx = await newBoSession('mfared');
        const boPage = await mfaredCtx.newPage();
        const approval = new ApplicationApprovalPage(boPage);
        await approval.openApplicationDetails(SCENARIO.tsNo);
        await approval.openRegistrationDocumentsTab();
        await approval.clickVerified();
      });

      await test.step('UCD - Refresh the Application Link and ensure system redirects to Application Page 5', async () => {
        await continuation.refreshAndExpectPage5();
      });

      // ── Application Payment ──
      await test.step(`Application Payment — ${describeLeg(SCENARIO.applicationLeg)}`, async () => {
        await runPaymentLeg(page, SCENARIO.applicationLeg, 'application');
      });
    });
  });
}
