import { Browser, Page, test, expect } from '@playwright/test';
import { CONFIG, USERS, ADMIN, COMPANY } from '../data/config';
import { BIZ_LABEL, BIZ_TAG, SSM_TYPE, isTrading, type Check, type Scenario } from '../data/scenarios';
import { EsimSsmPage } from '../pages/EsimSsmPage';
import { PreApplicationPage } from '../pages/PreApplicationPage';
import { PaymentPage, type Where } from '../pages/PaymentPage';
import { BoPage, BO_MENU } from '../pages/BoPage';
import { ApplicationPage, type ApplicationDetails } from '../pages/ApplicationPage';
import { runPaymentLeg, type OnFailed } from './paymentLeg';
import { guidedCapture } from './guidedCapture';
import { trackContext } from './focusTimeline';
import { dropCompaniesUsedInBo, checkLicenceFreeInBo, type Candidate } from './boCompanyCheck';
import { NO_MESSAGE_OUTCOMES } from './qrLeg';
import { tinPool } from './tinPool';
import * as fs from 'node:fs';
import * as path from 'node:path';

// One official TS = one full onboarding chain (official TS v38):
//   Initial Steps (C) → Pre-Application payment (D/E) → Continuation Steps (F 1–8)
//   → Application payment (G/H) → listing checks.
// BackOffice runs in its own browser context so the UCD tab keeps its state.

const STATE_FOR: Record<string, { state: string; city: string }> = {
  TRADING_SABAH: { state: 'SABAH', city: 'KOTA KINABALU' },
  TRADING_SARAWAK: { state: 'SARAWAK', city: 'KUCHING' },
};

/** Keep a page's HTML next to the evidence (pages the payment-retry TS reach for the first time). */
async function saveHtml(p: Page, label: string): Promise<void> {
  const dir = process.env.PW_EVIDENCE_DIR;
  if (!dir) return;
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${label}.html`), await p.content()); } catch { /* best effort */ }
}

function need(value: string, what: string): string {
  if (!value) throw new Error(`${what} is blank — type it on the /eauto/12153 dashboard for this TS.`);
  return value;
}

export async function runChain(browser: Browser, page: Page, sc: Scenario): Promise<void> {
  const trading = isTrading(sc.bizType);
  trackContext(page.context(), 'eAuto');
  const companyName = need(COMPANY.name, 'Company name');
  if (!companyName.includes(BIZ_TAG[sc.bizType])) {
    console.log(`   ⚠️ Company name "${companyName}" does not carry the ${BIZ_TAG[sc.bizType]} tag (convention UDIN ONBOARD TESTING ${BIZ_TAG[sc.bizType]}NNNN)`);
  }
  const directorName = need(COMPANY.directorName, 'Director name');
  const directorIc = need(COMPANY.directorIc, 'Director IC');
  console.log(`DETAIL: Director: ${directorName} / MyKad ${directorIc}`);
  if (trading) need(COMPANY.licenceNo, 'Business Trading Licence No');
  else { need(COMPANY.oldBrn, 'Old BRN'); need(COMPANY.newBrn, 'New BRN'); if (!COMPANY.fake) need(COMPANY.tin, 'TIN'); }
  const email = `qa.fz.${sc.id.toLowerCase().replace(/_/g, '')}.${Date.now().toString(36)}@${ADMIN.emailDomain}`;
  const place = STATE_FOR[sc.bizType] ?? { state: ADMIN.state, city: ADMIN.city };
  if (COMPANY.fake) console.log(`DETAIL: Fake company details — no TIN on the Pre-Application; Application TIN ${COMPANY.appTin || '(none)'} from a used Excel row`);
  console.log(`DETAIL: ${sc.id} — ${BIZ_LABEL[sc.bizType]} · ${companyName} · ${trading ? `licence ${COMPANY.licenceNo}` : `${COMPANY.oldBrn} / ${COMPANY.newBrn} / ${COMPANY.tin}`} · admin email ${email}`);

  // ── Setup: BO check — no earlier Pre-Application for the company ─────────
  const ssmType = SSM_TYPE[sc.bizType];
  let candidates: Candidate[] = [{ oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: COMPANY.tin }, ...COMPANY.alternates];
  if (ssmType) {
    await test.step('Setup: BO Pre-Application Listing has no earlier Pre-Application for the company', async () => {
      candidates = await dropCompaniesUsedInBo(browser, candidates);
      const c = candidates[0];
      if (c.oldBrn !== COMPANY.oldBrn) {
        Object.assign(COMPANY, c);
        console.log(`DETAIL: Using the next free company instead: ${c.oldBrn} / ${c.newBrn} / ${c.tin}`);
        console.log(`COMPANY-USED ${JSON.stringify(c)}`);
      }
    });
  }

  if (trading) {
    await test.step('Setup: BO Pre-Application Listing has no earlier Pre-Application for the trading licence', async () => {
      await checkLicenceFreeInBo(browser, COMPANY.licenceNo);
    });
  }

  // ── Setup: eSIM SSM rows (SSM types only) ──────────────────────────────
  if (ssmType && COMPANY.seedEsim) {
    await test.step(`Setup: seed the company in eSIM SSM (Enquiry 004 + ${ssmType} Submission 005)`, async () => {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 }, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath('esim-video'), size: { width: 1920, height: 1080 } } : undefined });
      trackContext(ctx, 'eSIM');
      try {
        const esim = new EsimSsmPage(await ctx.newPage());
        await test.step('Sign in to eSIM', () => esim.login());
        // Never overwrite another tester's eSIM rows: if this company's rows are not
        // ours, take the next free company of the same type from the Excel. The
        // COMPANY-SKIP / COMPANY-USED lines tell the dashboard which to mark used.
        await test.step('Check the company\'s existing eSIM rows are ours (or there are none)', async () => {
          for (const [i, c] of candidates.entries()) {
            const foreign = await esim.foreignRow(ssmType, c.oldBrn, c.newBrn);
            if (!foreign) {
              if (i > 0) {
                Object.assign(COMPANY, c);
                console.log(`DETAIL: Using the next free company instead: ${c.oldBrn} / ${c.newBrn} / ${c.tin}`);
                console.log(`COMPANY-USED ${JSON.stringify(c)}`);
              }
              return;
            }
            console.log(`DETAIL: eSIM already has another tester's ${foreign} for ${c.oldBrn} — not touched, skipping this company`);
            console.log(`COMPANY-SKIP ${JSON.stringify(c)}`);
          }
          throw new Error(`Every company tried (${candidates.map(c => c.oldBrn).join(', ')}) already has another tester's eSIM rows. Drop a newer company Excel or pick another company on the TS row.`);
        });
        await test.step(`Create or update the SSM rows for ${COMPANY.oldBrn}`, () => esim.seed({
          type: ssmType, oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, companyName,
          director: { name: directorName, ic: directorIc },
          remark: `UDIN QA EAINT-${sc.id.split('_')[0]} ${sc.id}`,
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
      oldBrn: COMPANY.oldBrn, newBrn: COMPANY.newBrn, tin: (trading && COMPANY.tin ? tinPool.current() : COMPANY.tin) || undefined,
      licenceNo: COMPANY.licenceNo, licenceFile: CONFIG.fixtures.tradingLicence,
      address: ADMIN.address, postcode: trading ? (sc.bizType === 'TRADING_SABAH' ? '88000' : '93000') : ADMIN.postcode,
      state: place.state, city: place.city,
      adminName: ADMIN.name, mobile: ADMIN.mobile, email,
    });
    await pre.next();
  });
  await test.step('Initial 3: tick the Declaration statement box', () => pre.tickDeclaration());

  const has = (c: Check) => sc.checks?.includes(c) ?? false;
  // A new browser: its own context, so no cookies or session from the first one.
  const newBrowser = async (name: string) => {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, acceptDownloads: true, viewport: { width: 1920, height: 1080 }, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath(name), size: { width: 1920, height: 1080 } } : undefined });
    trackContext(ctx, name);
    return ctx.newPage();
  };

  // ── Second session (suggested 12153_TS11) ──────────────────────────────
  if (has('second-session')) {
    await test.step('Copy the page link and open it in a second browser (Incognito)', async () => {
      const url = ucd.url();
      const other = await newBrowser('second-session-video');
      try {
        await other.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
        if (/recaptcha/i.test(other.url())) await new PreApplicationPage(other).waitForCaptcha();
        await other.waitForLoadState('networkidle').catch(() => undefined);
        const said = (await other.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        console.log(`DETAIL: Second browser shows: ${said.slice(0, 300)}`);
        await saveHtml(other, `${sc.id}-second-session`);
        await new PaymentPage(other).captureEvidence(`${sc.id}-second-session`);
        expect.soft(said, 'Suggested TS: the second session is told the Pre-Application is not allowed to be edited').toMatch(/not allowed/i);
      } finally { await other.context().close(); }
    });
  }

  // BackOffice in its own context.
  const boCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath('bo-video'), size: { width: 1920, height: 1080 } } : undefined });
  trackContext(boCtx, 'BackOffice');
  const bo = new BoPage(await boCtx.newPage(), boCtx);
  let boUser = '';
  const boAs = async (user: { username: string; password: string }) => {
    if (boUser === user.username) return;
    if (boUser) await bo.logout();
    await bo.login(user);
    boUser = user.username;
  };
  // BO payment status. Only the Application listing has one: the "Registration Fee"
  // column, OK = paid, Failed = last attempt failed, Pending UCD = gateway pending
  // (knowledge/flow-payment-channels.md §9). The Pre-Application listing has no
  // payment column, so the pre-application leg's BO check is skipped
  // (Faizuddin, 2026-10-21: "if it doesnt have then can ignore").
  const registrationFee = (want: 'Failed' | 'Pending UCD', why: string) => () =>
    test.step(`${why}: BO Application listing shows Registration Fee = ${want}`, async () => {
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const row = await bo.readRow(companyName, 'Registration Fee');
      console.log(`DETAIL: ${row['Application No']} — Status ${row['Application Status']}, Registration Fee ${row['Registration Fee']}`);
      await bo.captureEvidence(`${sc.id}-bo-registration-fee-${want.replace(/\s+/g, '-').toLowerCase()}`);
      // Soft: a wrong status is a failed check, and the run carries on (2026-10-23).
      expect.soft(row['Registration Fee'], `Registration Fee = ${want}`).toBe(want);
    });
  const feeFilter = (want: 'Failed' | 'Pending UCD' | 'OK') =>
    test.step(`BO — filter Registration Fee = ${want} and click Search: the application is displayed`, async () => {
      await bo.openListing(BO_MENU.applicationListing);
      await bo.filterRegistrationFee(want, companyName);
      const rows = await bo.countRows(companyName);
      await bo.captureEvidence(`${sc.id}-bo-registration-fee-filter-${want.replace(/ /g, '-').toLowerCase()}`);
      await bo.clearRegistrationFeeFilter();
      expect.soft(rows, `Suggested TS: filter Registration Fee = ${want} displays the application`).toBeGreaterThan(0);
    });

  // ── Payment-retry checks (suggested 12153_TS9–TS12, 12257_TS11–TS13) ────
  // "Close the browser, open a new browser and open the link" after the failed attempt.
  const reopen = (where: Where, link: () => string) => (): Promise<Page> =>
    test.step(`Close the browser, open a new browser and open the ${where === 'preapp' ? 'copied page link' : 'Application Link'}`, async () => {
      const url = link();
      const old = ucd;
      // Close the old browser first, as a person would: opening the link while the old
      // one still held it gave "Access Denied ... currently accessing this Pre-Application"
      // (12257_TS12, 2026-10-26).
      await old.close({ runBeforeUnload: true }).catch(() => undefined);
      await old.waitForEvent('close', { timeout: 10_000 }).catch(() => undefined);
      const fresh = await newBrowser(`reopen-${where}-video`);
      const LOCKED = /currently accessing this|not allowed to edit/i;
      for (let tries = 0; ; tries++) {
        await fresh.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
        // The new window can open behind the others; bring it up so the reCAPTCHA is seen (12153_TS10, 2026-10-26).
        await fresh.bringToFront().catch(() => undefined);
        if (/recaptcha/i.test(fresh.url())) await new PreApplicationPage(fresh).waitForCaptcha();
        await fresh.waitForLoadState('networkidle').catch(() => undefined);
        const said = (await fresh.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
        if (!LOCKED.test(said)) break;
        await new PaymentPage(fresh).captureEvidence(`${sc.id}-${where}-reopened-access-denied-${tries + 1}`);
        if (tries >= 4) throw new Error(`The reopened link still says "Access Denied ... currently accessing" after ${tries + 1} tries over ~2 min, with the old browser closed. Check by hand: close the browser, wait, reopen the link.`);
        console.log(`DETAIL: Reopened link shows "Access Denied" (the old session still holds it) — waiting 30 s and opening it again (try ${tries + 2})`);
        await fresh.waitForTimeout(30_000);
      }
      await saveHtml(fresh, `${sc.id}-${where}-reopened`);
      if (where === 'preapp') {
        const p = new PreApplicationPage(fresh);
        // The reopened link lands on page 1 with the details kept (12257_TS12, 2026-10-26;
        // EAINT-12414 fixed only the Type of Business on reload): check them, then Next.
        if (!(await fresh.locator('#business-review-section').isVisible().catch(() => false))) {
          const name = (await fresh.locator('#businessName').inputValue().catch(() => '')).trim();
          console.log(`DETAIL: Reopened link shows the Pre-Application Form (page 1) — Business Registered Name "${name || '(blank)'}"`);
          await p.demoHighlight(fresh.locator('#businessName'), { color: 'green' });
          await new PaymentPage(fresh).captureEvidence(`${sc.id}-${where}-reopened-page1`);
          expect.soft(name.toLowerCase(), 'Suggested TS: the reopened link keeps the Pre-Application details').toBe(companyName.toLowerCase());
          await p.next();
        }
        const tick = fresh.locator('#agreeTerms');
        if (await tick.isVisible().catch(() => false) && !(await tick.isChecked())) await p.tickDeclaration();
        const tiles = fresh.locator('#payment-method-section');
        await p.demoHighlight(tiles, { color: 'green' });
        expect.soft(await tiles.isVisible().catch(() => false), 'Suggested TS: Business Info Review shows the payment methods').toBe(true);
      } else {
        const step = await new ApplicationPage(fresh).open(url);
        expect.soft(step, 'Suggested TS: the reopened Application Link shows Application Page 5').toBe(5);
      }
      await new PaymentPage(fresh).captureEvidence(`${sc.id}-${where}-reopened`);
      ucd = fresh;
      return fresh;
    });
  const both = (...hooks: (OnFailed | undefined)[]): OnFailed | undefined => {
    const list = hooks.filter((h): h is OnFailed => !!h);
    if (!list.length) return undefined;
    return async () => { let page: Page | void = undefined; for (const h of list) page = (await h()) || page; return page; };
  };

  // Failed Pre-Application: not in the listing (row count unchanged from before the payment).
  let preRowsBefore = 0;
  const preNotListed = async () => {
    await test.step('BO — open the Pre-Application listing and search the company name: not displayed', async () => {
      await boAs(USERS.assignee);
      await bo.openListing(BO_MENU.preApplicationListing);
      await bo.search({ companyName });
      const rows = await bo.countRows(companyName);
      console.log(`DETAIL: Pre-Application listing rows for "${companyName}": ${rows} (before the payment: ${preRowsBefore})`);
      await bo.captureEvidence(`${sc.id}-bo-preapp-not-listed`);
      expect.soft(rows, 'Suggested TS: a Pre-Application with a failed payment is not displayed in the listing').toBe(preRowsBefore);
    });
  };
  if (has('bo-listing-status')) {
    await test.step('BO — count the company’s Pre-Application rows before the payment', async () => {
      await boAs(USERS.assignee);
      await bo.openListing(BO_MENU.preApplicationListing);
      await bo.search({ companyName });
      preRowsBefore = await bo.countRows(companyName);
      console.log(`DETAIL: ${preRowsBefore} earlier Pre-Application row(s) for "${companyName}"`);
    });
  }

  // ── Guided capture: a person does the payment, the run saves every page ──
  if (sc.guided) {
    await guidedCapture(ucd, 'EAINT-12153');
    return;
  }

  // ── Pre-Application payment (D/E) ──────────────────────────────────────
  let preLink = '';
  const preLeg = await runPaymentLeg(ucd, 'preapp', sc.preApp, `${sc.id}-preapp`, both(
    has('bo-listing-status') ? preNotListed : undefined,
    has('reopen-after-fail') ? async () => { preLink = ucd.url(); return reopen('preapp', () => preLink)(); } : undefined,
  ));
  ucd = preLeg.page;
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
      if (has('bo-listing-status')) expect.soft(row['Pre-Application Status'], 'Suggested TS: after the retry the company is displayed with Status = New').toBe('New');
      await bo.captureEvidence(`${sc.id}-bo-preapp-listing`);
    });
    await test.step('F2: BO — approve the Pre-Application and copy the Application Link', async () => {
      const detail = await bo.openRow(preAppNo);
      if (has('bo-payment-details')) {
        await test.step('BO — view the Payment Details section of the Pre-Application', async () => {
          const got = await bo.paymentDetails(detail);
          const ucdSaw = preLeg.details;
          console.log(`DETAIL: BO Payment Details — ${Object.entries(got).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
          console.log(`DETAIL: UCD payment details page — ${Object.entries(ucdSaw).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
          await new PaymentPage(detail).captureEvidence(`${sc.id}-bo-payment-details`);
          expect.soft(got['Payment ID'], 'BO Payment ID = the payment details page').toBe(ucdSaw['Payment ID']);
          expect.soft(got['Payment Method'], 'BO Payment Method = the payment details page').toBe(ucdSaw['Payment Method']);
          // "PM" in BO vs "pm" on the UCD page counts as the same (Faizuddin, 2026-10-26, 12257_TS11).
          expect.soft(got['Payment Date Time']?.toLowerCase(), 'BO Payment Date Time = the payment details page').toBe(ucdSaw['Payment Date Time']?.toLowerCase());
          expect.soft(got['Payment Status'], 'BO Payment Status = Paid').toMatch(/^paid$/i);
          if (sc.preApp.method === 'duitnow-qr') expect.soft(got['Payment Method'], 'BO Payment Method = DuitNow QR').toMatch(/duitnow/i);
        });
      }
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
      // Business Trading: TIN only when the dashboard row ticked "Include TIN" (2026-10-26).
      tin: COMPANY.fake || trading ? tinPool.current() : COMPANY.tin, tinFromPool: COMPANY.fake || trading, directorName, directorIc, directorMobile: ADMIN.mobile, directorEmail: email,
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
    // Registration Fee = Failed between the failed attempt and the retry: 12257 TS2–TS5
    // (DuitNow QR) and the suggested BO-listing TS, which also uses the filter.
    // Not for Cancel / close QR: no BO status check on those rows (Faizuddin, 2026-10-26).
    const noMessage = NO_MESSAGE_OUTCOMES.includes(sc.application.outcome);
    const feeFailed = (sc.application.method === 'duitnow-qr' && !noMessage) || has('bo-listing-status')
      ? async () => {
        await registrationFee(sc.feeAfterFail ?? 'Failed', 'Check the transaction payment status in BO')();
        if (has('bo-listing-status')) await feeFilter(sc.feeAfterFail ?? 'Failed');
      }
      : undefined;
    ucd = (await runPaymentLeg(ucd, 'application', sc.application, `${sc.id}-application`,
      both(feeFailed, has('reopen-after-fail') ? reopen('application', () => link) : undefined),
      registrationFee('Pending UCD', 'Check the payment status in BO while pending'))).page;

    await test.step('Check the Application listing: Status = Approved, Registration Fee = OK', async () => {
      await bo.openListing(BO_MENU.applicationListing);
      await bo.search({ companyName });
      const row = await bo.readRow(companyName, 'Registration Fee');
      console.log(`DETAIL: ${row['Application No']} — Status ${row['Application Status']}, Softcopy ${row['Softcopy Docs']}, Registration Fee ${row['Registration Fee']}, Hardcopy ${row['Hardcopy & Acc Created']}`);
      await bo.captureEvidence(`${sc.id}-bo-application-listing-final`);
      expect.soft(row['Application Status'], 'Application Status').toBe('Approved');
      expect(row['Registration Fee'], 'Registration Fee').toBe('OK');
    });
    if (has('bo-listing-status')) await feeFilter('OK');
    await bo.logout();
  } finally {
    await boCtx.close();
  }
}
