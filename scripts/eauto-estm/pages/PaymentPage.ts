import { EstmSession } from '../utils/session';

// ── Final eSTM stretch: confirm → Make Payment → Done ──────
export class PaymentPage {
  constructor(private readonly session: EstmSession) {}

  async completePayment(): Promise<void> {
    await this.session.clickYesAndWait();

    let ap = await this.session.waitForActivePage();
    await ap.getByText('Make Payment').click().catch(() => {});
    await this.session.waitForDomReady();

    await this.session.clickYesAndWait();

    // The payment step's Next may live inside a dialog.
    ap = await this.session.waitForActivePage();
    const dialogNext = ap.getByRole('dialog', { name: /Payment/i }).getByRole('button', { name: 'Next' }).first();
    if ((await dialogNext.count().catch(() => 0)) > 0) await dialogNext.click({ timeout: 7000 }).catch(() => {});
    else await this.session.clickNextButtonOrText();

    await this.session.clickNextButtonOrText();
    ap = await this.session.waitForActivePage();
    await ap.getByRole('button', { name: 'OK' }).click().catch(() => {});
    ap = await this.session.waitForActivePage();
    await ap.getByText('Done').click().catch(() => {});
    this.session.progress('payment_done', 'Payment & Done');
  }
}
