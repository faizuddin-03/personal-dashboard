import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { CreateTransactionPage } from '../pages/CreateTransactionPage';
import { BuyerDetailsPage } from '../pages/BuyerDetailsPage';
import { PaymentPage } from '../pages/PaymentPage';

// ── eSTM — eSERAHAN vehicle-transfer transaction, end to end ──
// Login (via fixture) → create transaction → pick ID type → buyer + vehicle
// details with the two required "bypass" redirects → payment → Done.
test('eSTM eSERAHAN transaction — full flow', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(180_000);

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
