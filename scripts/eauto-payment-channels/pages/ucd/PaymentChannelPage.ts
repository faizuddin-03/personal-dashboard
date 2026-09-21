import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { PaymentChannel } from '../../data/types';
import { pending } from '../../utils/pendingHtml';

// ── Onboarding Payment step — channel selection ────────────
// Per knowledge/eauto-payments.md, this step offers 3 tiles: Credit or
// Debit Card (new), Online Banking (Business) = FPX B2B (new), Online
// Banking (Personal) = FPX B2C (existing, relabelled). Reachable from BOTH
// the Pre-Application and the Application module — same step, same page
// object, just called at a different point in the flow.
//
// TODO once HTML is captured: confirm tile selectors, and whether this step
// is genuinely gateway-framed (Fiuu-hosted) as believed — that decides how
// fragile the card-field cases are (see the ticket study's open item).
export class PaymentChannelPage extends BasePage {
  constructor(page: Page) { super(page); }

  async selectChannel(channel: PaymentChannel): Promise<void> {
    pending(`PaymentChannelPage.selectChannel("${channel}") — tile selector unknown`);
  }

  /** FPX only — the bank grid within the FPX B2B/B2C tile (same 10-bank list as the insurance runner). */
  async selectBank(bank: string): Promise<void> {
    pending(`PaymentChannelPage.selectBank("${bank}") — FPX bank grid selector unknown`);
  }

  /**
   * "Submit and Pay" (FPX) — opens the Fiuu sandbox popup for the selected
   * bank. Ported call shape from scripts/secarang-insurance/pages/
   * PaymentTypePage.ts#selectBank: register the popup listener BEFORE the
   * click so the event is never missed.
   */
  async submitAndPay(): Promise<Page> {
    pending('PaymentChannelPage.submitAndPay — "Submit and Pay" button selector unknown; popup-open pattern from scripts/secarang-insurance/pages/PaymentTypePage.ts is the template once the selector is known');
  }
}
