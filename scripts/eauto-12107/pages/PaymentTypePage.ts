import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Secarang "Select Payment Method" page. FPX/bank handling is ported from
// scripts/secarang-insurance/pages/PaymentTypePage.ts (confirmed working).
//
// Tile shape CONFIRMED from _reference/html/secarang/payment-methods.html
// (staging /ia, 2026-10-16): each tile is a <label> wrapping a hidden
// input[formcontrolname="paymentType"] and a .payment-type-card whose <h6>
// holds the name — "Credit or Debit Card", "FPX Online banking", "SPayLater",
// "PayLater by Grab". No Pay button on the page. Tiles are matched on the
// START of the <h6> text, so "PayLater by Grab" (BNPL) is never taken for
// the new "GrabPay" tile.
// ⚠ Still unconfirmed: the wording of the new GrabPay / ShopeePay tiles and
// the "Full Amount" sub-option — not captured after the 12107 push. The first
// run logs every option label (`logPaymentOptions()`).

export class PaymentTypePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private optionLabels = () => this.page.locator('label').filter({ has: this.page.locator('input[formcontrolname="paymentType"]') });

  async waitForPage(): Promise<void> {
    const appeared = await this.poll(async () =>
      (await this.page.locator('input[formcontrolname="paymentType"]').count()) > 0,
    );
    if (!appeared) throw new Error('Payment type options did not appear');
    await this.demoPause();
  }

  /** Visible text of every payment-method option, in DOM order — what the
   *  TS expects to read "Credit or Debit Card / FPX Online banking /
   *  ShopeePay (...) / GrabPay (...)". */
  async logPaymentOptions(): Promise<string[]> {
    const labels = this.optionLabels();
    const n = await labels.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = this.clean((await labels.nth(i).innerText().catch(() => '')) || '');
      if (t) out.push(t);
    }
    console.log(`   💳 ${out.length} payment option(s): ${out.join(' | ')}`);
    console.log('DETAIL:' + JSON.stringify({ label: 'Payment method options', value: out.join(' | ') }));
    return out;
  }

  private async clickOption(pattern: RegExp, what: string): Promise<void> {
    const label = this.optionLabels().filter({ has: this.page.locator('.payment-type-card h6', { hasText: pattern }) }).first();
    if ((await label.count()) === 0 || !(await label.isVisible().catch(() => false))) {
      throw new Error(`${what} option not found on the Select Payment Method page`);
    }
    console.log(`   🖱️  Selecting "${what}"`);
    await this.demoHighlight(label);
    await label.scrollIntoViewIfNeeded().catch(() => {});
    await label.click();
    await this.wait(1000);
  }

  async selectFPX(): Promise<void> {
    await this.clickOption(/^\s*FPX/i, 'FPX Online banking');
  }

  /** Confirmed tile text "Credit or Debit Card". */
  async selectCreditDebitCard(): Promise<Page | null> {
    // Clicking the tile opens the Fiuu card form in a popup straight away;
    // there is no Pay button on the Secarang page (live /ia, 2026-10-19).
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 30_000 }).catch(() => null);
    await this.clickOption(/^\s*Credit or Debit Card/i, 'Credit or Debit Card');
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
      await popup.waitForTimeout(1500);
      console.log(`   🪟  Popup opened: ${popup.url()}`);
    }
    return popup;
  }

  /** [unconfirmed tile text] The new GrabPay tile — never "PayLater by Grab". */
  async selectGrabPay(): Promise<Page | null> {
    // Live /ia 2026-10-19 (_reference/html/secarang/payment-methods-2026-10-19-
    // after-failed-payment.html): the GrabPay channel tile reads "PayLater by
    // Grab" with logo alt "GrabPay", and clicking it opens the Fiuu GrabPay
    // sandbox popup straight away — no Full Amount choice on Secarang.
    const tile = this.optionLabels().filter({ has: this.page.locator('img[alt="GrabPay"]') })
      .or(this.optionLabels().filter({ has: this.page.locator('.payment-type-card h6', { hasText: /^\s*(Grab\s*Pay|PayLater by Grab)/i }) }))
      .first();
    if (!(await tile.isVisible().catch(() => false))) throw new Error('GrabPay option not found on the Select Payment Method page');
    const label = this.clean((await tile.innerText().catch(() => '')) || 'GrabPay');
    console.log(`   🖱️  Selecting GrabPay tile "${label}"`);
    await this.demoHighlight(tile);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15_000 }).catch(() => null);
    await tile.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
      await popup.waitForTimeout(1500);
      console.log(`   🪟  Popup opened: ${popup.url()}`);
    }
    return popup;
  }

  /** The ShopeePay tile — reads "SPayLater", logo alt "ShopeePay" (live /ia,
   *  2026-10-20). Clicking it opens the Fiuu ShopeePay QR popup straight away
   *  (_reference/html/secarang/fiuu-shopeepay-qr.html). */
  async selectShopeePay(): Promise<Page | null> {
    const tile = this.optionLabels().filter({ has: this.page.locator('img[alt="ShopeePay"]') })
      .or(this.optionLabels().filter({ has: this.page.locator('.payment-type-card h6', { hasText: /^\s*(Shopee\s*Pay|SPayLater)/i }) }))
      .first();
    if (!(await tile.isVisible().catch(() => false))) throw new Error('ShopeePay option not found on the Select Payment Method page');
    const label = this.clean((await tile.innerText().catch(() => '')) || 'ShopeePay');
    console.log(`   🖱️  Selecting ShopeePay tile "${label}"`);
    await this.demoHighlight(tile);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 15_000 }).catch(() => null);
    await tile.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
      await popup.waitForTimeout(1500);
      console.log(`   🪟  Popup opened: ${popup.url()}`);
    }
    return popup;
  }

  /**
   * [unconfirmed selector] After the GrabPay/ShopeePay tile, the SRD (REQ-001/
   * 002) shows a second choice: "Full Amount" or the BNPL option (PayLater by
   * Grab / SPayLater). Only Full Amount works in the Fiuu sandbox (SRD §2.2.8).
   * Returns the popup if clicking the sub-option opens the gateway directly,
   * otherwise null (then `clickPayAndWaitForPopup()` is the next step).
   */
  async selectFullAmount(): Promise<Page | null> {
    const opt = this.page.locator('label, button, [role="radio"], [role="button"]').filter({ hasText: /full\s*amount/i }).first();
    const visible = await this.poll(async () => (await opt.count()) > 0 && (await opt.isVisible().catch(() => false)), 10_000);
    if (!visible) {
      console.log('   ℹ️  No "Full Amount" sub-option appeared after selecting GrabPay — continuing (tile may already mean Full Amount)');
      return null;
    }
    console.log('   🖱️  Selecting "Full Amount"');
    await this.demoHighlight(opt);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 8_000 }).catch(() => null);
    await opt.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
      console.log(`   🪟  Popup opened: ${popup.url()}`);
    }
    return popup;
  }

  /**
   * [unconfirmed selector] Some Secarang payment tiles open the gateway on
   * click (FPX bank logos do); others need a Pay / Proceed button. Clicks
   * whichever "Pay"-like button is visible and waits for the gateway popup.
   */
  async clickPayAndWaitForPopup(): Promise<Page> {
    const btn = this.page.locator('button').filter({ hasText: /^(pay|pay now|proceed|continue|submit)/i }).first();
    const visible = await this.poll(async () => (await btn.count()) > 0 && (await btn.isVisible().catch(() => false)), 10_000);
    if (!visible) throw new Error('No Pay / Proceed button found after selecting the payment method');
    const text = this.clean((await btn.innerText().catch(() => '')) || 'Pay');
    console.log(`   🖱️  Clicking "${text}" — waiting for the Fiuu popup…`);
    await this.demoHighlight(btn);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 30_000 });
    await btn.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
    await popup.waitForTimeout(1500);
    console.log(`   🪟  Popup opened: ${popup.url()}`);
    return popup;
  }

  /** Vehicle and premium in the price bar above the tiles — confirmed:
   *  `app-price-topbar` holds two links, " VW4HEER  HONDA HR-V " and
   *  " RM884.48 " (_reference/html/secarang/payment-methods.html). */
  async readPriceTopbar(): Promise<{ vehicle: string; premium: string }> {
    const links = this.page.locator('app-price-topbar a');
    await links.first().waitFor({ state: 'visible', timeout: 30_000 });
    await this.demoHighlight(this.page.locator('app-price-topbar'), { color: 'green' });
    return {
      vehicle: this.clean((await links.nth(0).innerText().catch(() => '')) || ''),
      premium: this.clean((await links.nth(1).innerText().catch(() => '')) || ''),
    };
  }

  async logAvailableBanks(): Promise<void> {
    await this.poll(async () =>
      (await this.page.locator('input[formcontrolname="bank"]').count()) > 0,
      10_000,
    );
    const bankInputs = this.page.locator('.d-md-block input[formcontrolname="bank"]');
    const bankCount = await bankInputs.count();
    console.log(`   🏦 ${bankCount} bank option(s) available:`);
    for (let i = 0; i < bankCount; i++) {
      const value = await bankInputs.nth(i).getAttribute('value').catch(() => '');
      const alt   = await bankInputs.nth(i).locator('xpath=ancestor::label//img').first().getAttribute('alt').catch(() => '');
      console.log(`      [${i + 1}] value="${value}" name="${alt}"`);
    }
  }

  /** Picks a bank by its input value, or (if `bankValue` is blank) by the
   *  logo's alt text containing `bankName` — the TS names "RHB", not a code. */
  async selectBank(bankValue: string, bankName: string): Promise<Page> {
    let bankLabel: Locator | null = null;
    if (bankValue) {
      const byValue = this.page.locator('label').filter({ has: this.page.locator(`input[formcontrolname="bank"][value="${bankValue}"]`) });
      for (let i = 0; i < await byValue.count(); i++) {
        if (await byValue.nth(i).isVisible().catch(() => false)) { bankLabel = byValue.nth(i); break; }
      }
    }
    if (!bankLabel && bankName) {
      const byName = this.page.locator('label').filter({ has: this.page.locator('input[formcontrolname="bank"]') }).filter({ has: this.page.locator(`img[alt*="${bankName}" i]`) });
      for (let i = 0; i < await byName.count(); i++) {
        if (await byName.nth(i).isVisible().catch(() => false)) { bankLabel = byName.nth(i); break; }
      }
    }
    if (!bankLabel) throw new Error(`Bank "${bankValue || bankName}" not found or not visible`);

    const alt = await bankLabel.locator('img').getAttribute('alt').catch(() => bankValue || bankName);
    console.log(`   🖱️  Selecting bank: "${alt}" — waiting for popup…`);
    await this.demoHighlight(bankLabel);
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 30_000 });
    await bankLabel.scrollIntoViewIfNeeded().catch(() => {});
    await bankLabel.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
    await popup.waitForTimeout(1500);
    console.log(`   🪟  Popup opened: ${popup.url()}`);
    return popup;
  }
}
