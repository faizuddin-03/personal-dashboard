import { test } from '../fixtures/e2eFixture';
import { CONFIG } from '../data/config';
import { Snapshot } from '../data/types';
import { E2EReporter, parseMoney, approxEq, norm } from '../utils/reporting';
import { InsuranceQuotePage } from '../pages/InsuranceQuotePage';
import { OptionalCoveragePage } from '../pages/OptionalCoveragePage';
import { PaymentPage } from '../pages/PaymentPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { TransactionEnquiryPage } from '../pages/TransactionEnquiryPage';

// ── eAuto UCD — Insurance purchase E2E + cross-page verification ──
// Golden path: Free Quote → Optional Coverage → Payment → Confirm →
// Transaction Listing → Transaction Details. Every page's data is captured
// into `snap`; the cross-page consistency assertions live here so the spec
// reads as the test case it is. Per-page math checks live in the page objects.

test('UCD Insurance E2E — full flow + cross-page verification', async ({ loggedInPage: page, reporter }) => {
  test.setTimeout(0);
  const A = CONFIG.artifactDir;
  const snap: Snapshot = {};
  const txnIds: string[] = [];
  const rememberTxn = () => {
    const m = page.url().match(/transactionId=([0-9a-f-]{8,})/i);
    if (m && !txnIds.includes(m[1])) txnIds.push(m[1]);
  };

  // ── Step 1 · Quotes ──
  const quotePage = new InsuranceQuotePage(page, reporter, A);
  await quotePage.openFreeQuote();
  snap.step1 = await quotePage.submitAndChooseInsurer();
  rememberTxn();

  // ── Step 2 · Optional Coverage ──
  const coveragePage = new OptionalCoveragePage(page, reporter, A);
  snap.step2 = await coveragePage.selectCoverageAndProceed();
  rememberTxn();

  // ── Step 3 · Payment ──
  const paymentPage = new PaymentPage(page, reporter, A);
  snap.step3 = await paymentPage.fillPaymentDetails();

  if (CONFIG.stopBeforePayment) {
    await paymentPage.markStoppedBeforePayment();
    finishAndThrow(reporter, snap, 'DRY_RUN (stopped before payment)');
    return;
  }
  await paymentPage.payNow();
  rememberTxn();

  // ── Step 4 · Confirm ──
  const confirmPage = new ConfirmationPage(page, reporter, A);
  snap.step4 = await confirmPage.capture();
  reporter.record('Step4 Paid == Step3 Total Nett',
    approxEq(parseMoney(snap.step4.paymentAmount), parseMoney(snap.step3.totalNett), 0.01),
    `Step4 ${snap.step4.paymentAmount} vs Step3 ${snap.step3.totalNett}`);
  await confirmPage.clickDone();
  rememberTxn();

  // ── Step 5 · Transaction Listing ──
  const enquiryPage = new TransactionEnquiryPage(page, reporter, A);
  snap.listing = await enquiryPage.captureListingRow();
  if (snap.listing.raw !== '(row not found)') {
    reporter.record('Listing Reference No == Step3', !!snap.listing.referenceNo && norm(snap.listing.referenceNo) === norm(snap.step3.referenceNo),
      `Listing ${snap.listing.referenceNo} vs Step3 ${snap.step3.referenceNo}`);
    reporter.record('Listing E-Cert == Step4', !!snap.listing.eCert && norm(snap.listing.eCert) === norm(snap.step4.eCert),
      `Listing ${snap.listing.eCert} vs Step4 ${snap.step4.eCert}`);
    reporter.record('Listing Paid == Step4', approxEq(parseMoney(snap.listing.paymentAmount), parseMoney(snap.step4.paymentAmount), 0.01),
      `Listing ${snap.listing.paymentAmount} vs Step4 ${snap.step4.paymentAmount}`);
    reporter.record('Listing Status = Insurance Created', /Insurance Created/i.test(snap.listing.status),
      `status = ${snap.listing.status || '(none)'}`);
  } else {
    reporter.record('Listing row present', false, `No listing row found for ${CONFIG.vehicleNo} after 4 refresh attempts`);
  }

  // ── Step 6 · Transaction Details ──
  const txnId = txnIds[txnIds.length - 1];
  if (txnId) {
    snap.details = await enquiryPage.captureDetails(txnId);
    reporter.record('Details Status = Insurance Created', /Insurance Created/i.test(snap.details.status), snap.details.status || '(none)');
    reporter.record('Details E-Cert == Step4', !!snap.details.eCert && norm(snap.details.eCert) === norm(snap.step4.eCert),
      `${snap.details.eCert} vs ${snap.step4.eCert}`);
    reporter.record('Email typed reaches final record', norm(snap.details.email).toLowerCase() === CONFIG.email.toLowerCase(),
      `Details ${snap.details.email} vs typed ${CONFIG.email}`);
    reporter.record('Hire Purchase (User Submission) == selected bank',
      !!snap.details.hirePurchase && norm(snap.details.hirePurchase).toLowerCase().includes(norm(snap.step3.hirePurchase).toLowerCase().split(' ')[0]),
      `Details "${snap.details.hirePurchase}" vs selected "${snap.step3.hirePurchase}"`);
    reporter.record('Details Total Nett == Step4 Paid', approxEq(parseMoney(snap.details.totalNett), parseMoney(snap.step4.paymentAmount), 0.01),
      `${snap.details.totalNett} vs ${snap.step4.paymentAmount}`);
    reporter.record('Details Vehicle Use == Step3', norm(snap.details.vehicleUse).toLowerCase() === norm(snap.step3.vehicleUse).toLowerCase() || !snap.details.vehicleUse,
      `${snap.details.vehicleUse} vs ${snap.step3.vehicleUse}`);
  } else {
    snap.details = { raw: '(no transactionId captured)' };
    reporter.record('Details reachable', false, 'No transactionId captured from the flow');
  }

  // ── Cross-page consistency (the "same on every page" assertions) ──
  const nc = (c: string) => new OptionalCoveragePage(page, reporter, A).normalizeCover(c);
  const coverAll = [snap.step1?.coverType, snap.step2?.coverType, snap.step3?.coverType, snap.details?.coverType].filter(Boolean);
  reporter.record('Cover Type identical across pages', new Set(coverAll.map(nc)).size === 1, `values: ${coverAll.join(' | ') || '(none captured)'}`);

  const icAll = [snap.step1?.ownerIC, snap.step2?.ownerIC, snap.step3?.ownerIC, snap.details?.ownerIC].filter(Boolean);
  reporter.record('Owner/Insured IC identical across pages', new Set(icAll.map(norm)).size <= 1, `values: ${icAll.join(' | ')}`);

  const vnAll = [CONFIG.vehicleNo, snap.step1?.vehicleRegNo, snap.step3?.vehicleRegNo, snap.step4?.vehicleRegNo, snap.details?.vehicleRegNo]
    .map((x) => norm(x).toUpperCase()).filter(Boolean);
  reporter.record('Vehicle No identical across pages', new Set(vnAll).size === 1, `values: ${vnAll.join(' | ')}`);

  const planAll = [snap.step2?.plan, snap.details?.plan].filter(Boolean);
  reporter.record('Insurance Plan identical (Step2 vs Details)', new Set(planAll.map(norm)).size <= 1, `values: ${planAll.join(' | ')}`);

  const certAll = [snap.step4?.eCert, snap.listing?.eCert, snap.details?.eCert].filter(Boolean);
  reporter.record('E-Certificate No identical (Step4 · Listing · Details)', certAll.length >= 2 && new Set(certAll.map(norm)).size === 1,
    `values: ${certAll.join(' | ') || '(none captured)'}`);

  const refAll = [snap.step3?.referenceNo, snap.listing?.referenceNo].filter(Boolean);
  reporter.record('Reference No identical (Step3 · Listing)', refAll.length >= 2 && new Set(refAll.map(norm)).size === 1,
    `values: ${refAll.join(' | ') || '(none captured)'}`);

  const sumStep1 = parseMoney(snap.step1?.sumCovered), sumStep2 = parseMoney(snap.step2?.totalSumCovered), sumStep3 = parseMoney(snap.step3?.sumCovered);
  reporter.record('Sum Covered consistent (Step1→2→3)', approxEq(sumStep1, sumStep2, 0.01) && approxEq(sumStep2, sumStep3, 0.01),
    `S1 ${snap.step1?.sumCovered} · S2 ${snap.step2?.totalSumCovered} · S3 ${snap.step3?.sumCovered}`);

  finishAndThrow(reporter, snap, 'COMPLETED');
});

function finishAndThrow(reporter: E2EReporter, snap: Snapshot, outcome: string) {
  const failed = reporter.finish(outcome, snap);
  if (failed > 0 && outcome === 'COMPLETED') {
    throw new Error(`${failed} verification check(s) failed — see report.`);
  }
}
