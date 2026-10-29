import { Browser, Page, test, expect } from '@playwright/test';
import { CONFIG, USERS, ADMIN, COMPANY } from '../data/config';
import { BIZ_LABEL, BIZ_TAG, SSM_TYPE, isTrading, type Scenario } from '../data/scenarios';
import { EsimSsmPage } from '../pages/EsimSsmPage';
import { PreApplicationPage } from '../pages/PreApplicationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { BoPage, BO_MENU } from '../pages/BoPage';
import { ApplicationPage, type ApplicationDetails } from '../pages/ApplicationPage';
import { runPaymentLeg } from './paymentLeg';
import { dropCompaniesUsedInBo } from './boCompanyCheck';

// One official TS = one full onboarding chain (official TS v38):
//   Initial Steps (C) → Pre-Application payment (D/E) → Continuation Steps (F 1–8)
//   → Application payment (G/H) → listing checks.
// BackOffice runs in its own browser context so the UCD tab keeps its state.

const STATE_FOR: Record<string, { state: string; city: string }> = {
  TRADING_SABAH: { state: 'SABAH', city: 'KOTA KINABALU' },
  TRADING_SARAWAK: { state: 'SARAWAK', city: 'KUCHING' },
};

function need(value: string, what: string): string {
  if (!value) throw new Error(`${what} is blank — type it on the /eauto/12153 dashboard for this TS.`);
  return value;
}

export async function runChain(browser: Browser, page: Page, sc: Scenario): Promise<void> {
  const trading = isTrading(sc.bizType);
  const companyName = need(COMPANY.name, 'Company name');
  if (!companyName.includes(BIZ_TAG[sc.bizType])) {
    console.log(`   ⚠️ Company name "${companyName}" does not carry the ${BIZ_TAG[sc.bizType]} tag (convention UDIN ONBOARD TESTING ${BIZ_TAG[sc.bizType]}NNNN)`);
  }
  const directorName = need(COMPANY.directorName, 'Director name');
  const directorIc = need(COMPANY.directorIc, 'Director IC');
  if (trading) need(COMPANY.licenceNo, 'Business Trading Licence No');
  else { need(COMPANY.oldBrn, 'Old BRN'); need(COMPANY.newBrn, 'New BRN'); need(COMPANY.tin, 'TIN'); }
  const email = `qa.fz.${sc.id.toLowerCase().replace(/_/g, '')}.${Date.now().toString(36)}@${ADMIN.emailDomain}`;
  const place = STATE_FOR[sc.bizType] ?? { state: ADMIN.state, city: ADMIN.city };
  console.log(`DETAIL: ${sc.id} — ${BIZ_LABEL[sc.bizType]} · ${companyName} · ${trading ? `licence ${COMPANY.licenceNo}` : `${COMPANY.oldBrn} / ${COMPANY.newBrn} / ${COMPANY.tin}`} · admin email ${email}`);

  // ── Setup: BO check — no earlier Pre-Application for the company ─────────
  const ssmType = SSM_TYPE[sc.bizType];
  if (ssmType) {
    await test.step('Setup: BO Pre-Application Listing has no earlier Pre-Application for the company', async () => {
      const [c] = await dropCompaniesUsedInBo(browser, [{ oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: COMPANY.tin }, ...COMPANY.alternates]);
      if (c.oldBrn !== COMPANY.oldBrn) {
        Object.assign(COMPANY, c);
        console.log(`DETAIL: Using the next free company instead: ${c.oldBrn} / ${c.newBrn} / ${c.tin}`);
        console.log(`COMPANY-USED ${JSON.stringify(c)}`);
      }
    });
  }

  // ── Setup: eSIM SSM rows (SSM types only) ──────────────────────────────
  if (ssmType && COMPANY.seedEsim) {
    await test.step(`Setup: seed the company in eSIM SSM (Enquiry 004 + ${ssmType} Submission 005)`, async () => {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 } });
      try {
        const esim = new EsimSsmPage(await ctx.newPage());
        await test.step('Sign in to eSIM', () => esim.login());
        await test.step(`Create or update the SSM rows for ${COMPANY.oldBrn}`, () => esim.seed({
          type: ssmType, oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, companyName,
          director: { name: directorName, ic: directorIc },
          remark: `UDIN QA EAINT-12153 ${sc.id}`,
        }));
      } finally { await ctx.close(); }
    });
  }

  // ── Initial Steps (column C) ───────────────────────────────────────────
  let ucd = page;
  await test.step('Initial 1: open the eAuto login page and click "Apply eAuto"', async () => {
    ucd = await new PreApplicationPage(page).openFromLogin();
  });
  let pre = new PreApplicationPage(ucd);
  await test.step('Initial 1: complete the Captcha verification (a person ticks it)', () => pre.waitForCaptcha());
  await test.step(`Initial 2: fill in the Pre-Application form (${BIZ_LABEL[sc.bizType]}) and click Next`, async () => {
    await pre.fillForm({
      bizType: sc.bizType, businessName: companyName,
      oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: COMPANY.tin || undefined,
      licenceNo: COMPANY.licenceNo, licenceFile: CONFIG.fixtures.tradingLicence,
      address: ADMIN.address, postcode: trading ? (sc.bizType === 'TRADING_SABAH' ? '88000' : '93000') : ADMIN.postcode,
      state: place.state, city: place.city,
      adminName: ADMIN.name, mobile: ADMIN.mobile, email,
    });
    await pre.next();
  });
  await test.step('Initial 3: tick the Declaration statement box', () => pre.tickDeclaration());

  // BackOffice in its own context.
  const boCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath('bo-video'), size: { width: 1920, height: 1080 } } : undefined });
  const bo = new BoPage(await boCtx.newPage(), boCtx);
  let boUser = '';
  const boAs = async (user: { username: string; password: string }) => {
    if (boUser === user.username) return;
    if (boUser) await bo.logout();
    await bo.login(user);
    boUser = user.username;
  };
  // 12257 TS2–TS5 "Check the transaction payment status in BO" is not automated:
  // no BO listing shows a payment status, and 12257 changes nothing in BO
  // (Faizuddin, 2026-10-21: "if it doesnt have then can ignore").

  // ── Pre-Application payment (D/E) ──────────────────────────────────────
  ucd = (await runPaymentLeg(ucd, 'preapp', sc.preApp, `${sc.id}-preapp`)).page;
  pre = new PreApplicationPage(ucd);
  const preAppNo = await pre.preApplicationNo();
  console.log(`DETAIL: Pre-Application No ${preAppNo}`);
  await test.step('Download the SSM document (kept as evidence)', async () => {
    if (trading) return console.log('DETAIL: Business Trading — no SSM document');
    const f = await new PaymentPage(ucd).downloadFrom(ucd.locator('button.btn-download[onclick*="downloadSsmDocument"]'), `${sc.id}-ssm-document`);
    expect.soft(f, 'SSM document download').not.toBe('');
  });

  // ── Continuation Steps (F) ─────────────────────────────────────────────
  try {
    let link = '';

    await test.step(`F1: BO (${USERS.assignee.username}) — open the Pre-Application listing and view ${preAppNo}`, async () => {
      await boAs(USERS.assignee);
      await bo.openListing(BO_MENU.preApplicationListing);
      await bo.search({ preOnboardingNo: preAppNo });
      const row = await bo.readRow(preAppNo);
      console.log(`DETAIL: Listing row — SSM ${row['SSM Status']}, LHDN ${row['LHDN Response Status']}, Status ${row['Pre-Application Status']}`);
      if (sc.preAppListingStatus === 'New') expect(row['Pre-Application Status'], 'TS: Pre-Application listing Status = New').toBe('New');
      await bo.captureEvidence(`${sc.id}-bo-preapp-listing`);
    });
    await test.step('F2: BO — approve the Pre-Application and copy the Application Link', async () => {
      const detail = await bo.openRow(preAppNo);
      link = await bo.approvePreApplication(detail);
      console.log(`DETAIL: Application Link copied (${link.split('?')[0]})`);
      await new PaymentPage(detail).captureEvidence(`${sc.id}-bo-preapp-approved`);
      await detail.close();
    });
    if (sc.preAppListingStatus === 'Approved') {
      await test.step('Check the Pre-Application listing shows Status = Approved', async () => {
        await bo.openListing(BO_MENU.preApplicationListing);
        await bo.search({ preOnboardingNo: preAppNo });
        const row = await bo.readRow(preAppNo);
        expect(row['Pre-Application Status'], 'TS: Pre-Application listing Status = Approved').toBe('Approved');
      });
    }

    const app = new ApplicationPage(ucd);
    const details: ApplicationDetails = {
      tin: COMPANY.tin, directorName, directorIc, directorMobile: ADMIN.mobile, directorEmail: email,
    };
    await test.step('F3: UCD — open the Application Link and fill in the application until complete', async () => {
      await app.open(link);
      await test.step('Step 1 — Business Information', () => app.step1(details));
      await test.step('Step 2 — Upload Files', () => app.step2(details));
      await test.step('Step 3 — Acknowledgement and Submit', () => app.step3(details));
    });

    let appNo = '';
    await test.step(`F4: BO (${USERS.assignee.username}) — set UCD Group to Authorised Dealer and Submit For Approval`, async () => {
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const row = await bo.readRow(companyName);
      appNo = row['Application No'] ?? '';
      console.log(`DETAIL: Application ${appNo} — Status ${row['Application Status']}, Assignee ${row['Assignee']}`);
      const detail = await bo.openRow(companyName);
      await bo.submitForApproval(detail);
      await detail.close();
    });
    await test.step(`F5: BO (${USERS.approver.username}) — Approve the Application`, async () => {
      await boAs(USERS.approver);
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const detail = await bo.openRow(companyName);
      await bo.approveApplication(detail);
      await detail.close();
    });
    await test.step('F6: UCD — refresh the Application Link and upload the documents in page 4', async () => {
      await app.open(link);
      await app.step4();
    });
    await test.step(`F7: BO (${USERS.assignee.username}) — Registration Documents tab, click Verified`, async () => {
      await boAs(USERS.assignee);
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const detail = await bo.openRow(companyName);
      await bo.verifyRegistrationDocuments(detail);
      await detail.close();
    });
    await test.step('F8: UCD — refresh the Application Link; it opens on page 5 (Payment)', async () => {
      const step = await app.open(link);
      expect(step, 'TS F8: the Application Link redirects to page 5').toBe(5);
      const total = ucd.getByText(/1,?500\.00/).first();
      await app.demoHighlight(total, { color: 'green' });
      expect.soft(await total.isVisible().catch(() => false), `Registration fee RM ${CONFIG.registrationFee} shown`).toBe(true);
    });

    // ── Application payment (G/H) ────────────────────────────────────────
    ucd = (await runPaymentLeg(ucd, 'application', sc.application, `${sc.id}-application`)).page;

    await test.step('Check the Application listing: Status = Approved, Registration Fee = OK', async () => {
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const row = await bo.readRow(companyName);
      console.log(`DETAIL: ${row['Application No']} — Status ${row['Application Status']}, Softcopy ${row['Softcopy Docs']}, Registration Fee ${row['Registration Fee']}, Hardcopy ${row['Hardcopy & Acc Created']}`);
      await bo.captureEvidence(`${sc.id}-bo-application-listing-final`);
      expect.soft(row['Application Status'], 'Application Status').toBe('Approved');
      expect(row['Registration Fee'], 'Registration Fee').toBe('OK');
    });
    await bo.logout();
  } finally {
    await boCtx.close();
  }
}
