import { test, expect } from '@playwright/test';
import { CONFIG, ADMIN, COMPANY } from '../data/config';
import { BANKS, BIZ_LABEL, BIZ_TAG, UNSUCCESSFUL_PAYMENT, type BankName, type Leg } from '../data/scenarios';
import { EsimSsmPage } from '../pages/EsimSsmPage';
import { PreApplicationPage } from '../pages/PreApplicationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { attempt, runPaymentLeg } from '../utils/paymentLeg';
import { openEautoContext, eAutoPage } from '../utils/savedBrowser';

// Create Pre-Application — a quick UCD onboarding Pre-Application, made only
// so the listing has a fresh transaction to look at. Faizuddin, 2026-10-21:
// "create a preapplication, where i can choose the payment pass or failed for
// now ... business type, make it always use sdn bhd."
//
// Steps copied from scripts/eauto-12153/utils/chain.ts (Setup + Initial Steps
// + Pre-Application payment), unchanged. Stops after the Pre-Application
// payment: no BO approval, no Application form.
// Payment: Online Banking (Personal) — FPX B2C, the bank chosen on the dashboard
// (EPREAPP_BANK, default Maybank there; 2026-10-21). "Failed" = FPX status 51,
// one attempt, no retry.

const BIZ = 'ROC' as const; // Sdn Bhd / Bhd, always
function chosenLeg(): Leg {
  const bank = (process.env.EPREAPP_BANK ?? '').trim();
  if (!(bank in BANKS)) throw new Error(`Bank "${bank}" is not an FPX (B2C) bank — choose one on the /eauto/preapp dashboard (${Object.keys(BANKS).join(', ')}).`);
  return { method: 'fpx-b2c', bank: bank as BankName, outcome: 'success' };
}

function need(value: string, what: string): string {
  if (!value) throw new Error(`${what} is blank — type it on the /eauto/preapp dashboard.`);
  return value;
}

for (const outcome of ['pass', 'fail'] as const) {
  const id = outcome === 'pass' ? 'PREAPP_PASS' : 'PREAPP_FAIL';
  const title = `${id}: Pre-Application (Sdn Bhd), payment ${outcome === 'pass' ? 'Success' : 'Failed'}`;

  test(title, async ({ browser }) => {
    // Saved profile kept between runs: the reCAPTCHA is ticked only when eAuto asks again.
    const eCtx = await openEautoContext(browser, test.info().outputPath('eauto-video'));
    const page = await eAutoPage(eCtx);
    try {
    const companyName = need(COMPANY.name, 'Company name');
    if (!companyName.includes(BIZ_TAG[BIZ])) {
      console.log(`   ⚠️ Company name "${companyName}" does not carry the ${BIZ_TAG[BIZ]} tag (convention UDIN ONBOARD TESTING ${BIZ_TAG[BIZ]}NNNN)`);
    }
    const directorName = need(COMPANY.directorName, 'Director name');
    const directorIc = need(COMPANY.directorIc, 'Director IC');
    console.log(`DETAIL:${JSON.stringify({ label: "Director", value: `${directorName} / MyKad ${directorIc}` })}`);
    const LEG = chosenLeg();
    console.log(`DETAIL:${JSON.stringify({ label: 'Payment', value: `Online Banking (Personal) · ${LEG.bank} · ${outcome === 'pass' ? 'Success' : 'Failed'}` })}`);
    need(COMPANY.oldBrn, 'Old BRN'); need(COMPANY.newBrn, 'New BRN'); need(COMPANY.tin, 'TIN');
    const email = `qa.fz.${id.toLowerCase().replace(/_/g, '')}.${Date.now().toString(36)}@${ADMIN.emailDomain}`;
    console.log(`DETAIL:${JSON.stringify({ label: 'Company', value: `${companyName} · ${COMPANY.oldBrn} / ${COMPANY.newBrn} / ${COMPANY.tin}` })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Admin email', value: email })}`);

    // ── Setup: eSIM SSM rows ─────────────────────────────────────────────
    if (COMPANY.seedEsim) {
      await test.step('Setup: seed the company in eSIM SSM (Enquiry 004 + ROC Submission 005)', async () => {
        const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 } });
        try {
          const esim = new EsimSsmPage(await ctx.newPage());
          await test.step('Sign in to eSIM', () => esim.login());
          // Never overwrite another tester's eSIM rows (Faizuddin, 2026-10-22): take the next free company instead.
          await test.step('Check the company\'s existing eSIM rows are ours (or there are none)', async () => {
            const candidates = [{ oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: COMPANY.tin }, ...COMPANY.alternates];
            for (const [i, c] of candidates.entries()) {
              const foreign = await esim.foreignRow('ROC', c.oldBrn, c.newBrn);
              if (!foreign) {
                if (i > 0) {
                  Object.assign(COMPANY, c);
                  console.log(`DETAIL:${JSON.stringify({ label: 'Company switched', value: `${c.oldBrn} / ${c.newBrn} / ${c.tin}` })}`);
                  console.log(`COMPANY-USED ${JSON.stringify(c)}`);
                }
                return;
              }
              console.log(`DETAIL:${JSON.stringify({ label: 'eSIM rows not ours', value: `${foreign} for ${c.oldBrn} — skipped` })}`);
              console.log(`COMPANY-SKIP ${JSON.stringify(c)}`);
            }
            throw new Error(`Every company tried (${candidates.map(c => c.oldBrn).join(', ')}) already has another tester's eSIM rows. Drop a newer company Excel or pick another company.`);
          });
          await test.step(`Create or update the SSM rows for ${COMPANY.oldBrn}`, () => esim.seed({
            type: 'ROC', oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, companyName,
            director: { name: directorName, ic: directorIc },
            remark: `UDIN QA Create Pre-Application ${id}`,
          }));
        } finally { await ctx.close(); }
      });
    }

    // ── Pre-Application form ─────────────────────────────────────────────
    let ucd = page;
    await test.step('Open the eAuto login page and click "Apply eAuto"', async () => {
      ucd = await new PreApplicationPage(page).openFromLogin();
    });
    let pre = new PreApplicationPage(ucd);
    await test.step('Complete the Captcha verification (a person ticks it)', () => pre.waitForCaptcha());
    await test.step(`Fill in the Pre-Application form (${BIZ_LABEL[BIZ]}) and click Next`, async () => {
      await pre.fillForm({
        bizType: BIZ, businessName: companyName,
        oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: COMPANY.tin || undefined,
        licenceNo: COMPANY.licenceNo, licenceFile: CONFIG.fixtures.tradingLicence,
        address: ADMIN.address, postcode: ADMIN.postcode, state: ADMIN.state, city: ADMIN.city,
        adminName: ADMIN.name, mobile: ADMIN.mobile, email,
      });
      await pre.next();
    });
    await test.step('Tick the Declaration statement box', () => pre.tickDeclaration());

    // ── Payment ──────────────────────────────────────────────────────────
    if (outcome === 'pass') {
      ucd = (await runPaymentLeg(ucd, 'preapp', LEG, `${id}-preapp`)).page;
      pre = new PreApplicationPage(ucd);
      const preAppNo = await pre.preApplicationNo();
      console.log(`DETAIL:${JSON.stringify({ label: 'Pre-Application No', value: preAppNo || '(not read)' })}`);
      expect.soft(preAppNo, 'Pre-Application No shown on the summary page').not.toBe('');
      await test.step('Download the SSM document (kept as evidence)', async () => {
        const f = await new PaymentPage(ucd).downloadFrom(ucd.locator('button.btn-download[onclick*="downloadSsmDocument"]'), `${id}-ssm-document`);
        expect.soft(f, 'SSM document download').not.toBe('');
      });
    } else {
      const pay = new PaymentPage(ucd);
      const result = await attempt(ucd, 'preapp', LEG, true, 1);
      await test.step('Check the "Unsuccessful Payment" message on Business Info Review', async () => {
        // A missing message is a failed check, not a stop: the run carries on with the
        // next TS step (Faizuddin, 2026-10-23, after 12257_TS03/TS05 stopped here).
        expect.soft(result.kind, `After a failed payment eAuto should show Unsuccessful Payment (saw: ${result.text})`).toBe('failed');
        if (result.kind === 'failed') await pay.demoHighlight(pay.errorBox(), { color: 'green' });
        else console.log(`DETAIL: FAIL — "Unsuccessful Payment" message not shown (${result.text}); carrying on with the next step`);
        expect.soft(result.text).toContain(UNSUCCESSFUL_PAYMENT.heading);
        expect.soft(result.text.replace(/[’']/g, "'")).toContain(UNSUCCESSFUL_PAYMENT.body.replace(/[’']/g, "'"));
        await pay.captureEvidence(`${id}-unsuccessful-payment`);
      });
      // A failed Pre-Application may still carry a number on the page — read it if shown.
      const preAppNo = await new PreApplicationPage(ucd).preApplicationNo();
      console.log(`DETAIL:${JSON.stringify({ label: 'Pre-Application No', value: preAppNo || '(none shown after a failed payment)' })}`);
      console.log(`DETAIL:${JSON.stringify({ label: 'Payment result', value: 'Failed (FPX status 51) — left unpaid' })}`);
    }
    } finally {
      await eCtx.close();
    }
  });
}
