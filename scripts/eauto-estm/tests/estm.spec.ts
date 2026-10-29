import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { CreateTransactionPage } from '../pages/CreateTransactionPage';
import { BuyerDetailsPage } from '../pages/BuyerDetailsPage';
import { PaymentPage } from '../pages/PaymentPage';

// ── eSTM — eSERAHAN vehicle-transfer transaction, end to end ──
// Login (via fixture) → create transaction → pick ID type → buyer + vehicle
// details with the two required "bypass" redirects → payment → Done.
test('eSTM eSERAHAN transaction — full flow', async ({ loggedInPage: page, session, inputs }) => {
  // 3 minutes was not enough and the way it failed was silent: Playwright kills
  // the test where it stands, so the browser was left parked on step 5 with the
  // "Next" button untouched — indistinguishable from a selector that missed.
  // The flow does real JPJ enquiries and a bank call; budget for that. The run
  // route's own cap is 10 minutes, so stay under it to fail here (with a step
  // list and a video) rather than there (with neither).
  test.setTimeout(8 * 60_000);

  // Post-login banners — there can be more than one stacked, and they
  // intercept pointer events. No-op when none are showing.
  session.logUrl('after login');
  await session.closeBanners();

  const createPage = new CreateTransactionPage(page, session);
  await createPage.openAndCreate();
  await createPage.selectIdType();

  const buyerDetails = new BuyerDetailsPage(session);
  await buyerDetails.fillAndBypass(inputs);

  const payment = new PaymentPage(session);
  await payment.completePayment();

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: 'SUCCESS',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    idType: CONFIG.idType === '1' ? 'MyKad' : 'MyPR',
    emailAddress: inputs.emailAddress,
    mobileNo: inputs.mobileNo,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
