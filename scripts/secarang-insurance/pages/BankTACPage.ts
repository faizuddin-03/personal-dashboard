import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BankTACPage extends BasePage {
  constructor(popup: Page) {
    super(popup);
  }

  async logOptionsAndRequestTAC(): Promise<void> {
    await this.wait(1000);

    // Log everything visible on this page
    const bodyText = (await this.page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    console.log(`   📋 Post-login page content:\n${bodyText.slice(0, 800)}`);

    // Log all buttons
    const allBtns = this.page.locator('button, input[type="submit"], input[type="button"]');
    const btnCount = await allBtns.count();
    console.log(`   🔘 ${btnCount} button(s) on page:`);
    for (let i = 0; i < btnCount; i++) {
      const txt = ((await allBtns.nth(i).textContent().catch(() => '')) ||
                   (await allBtns.nth(i).getAttribute('value').catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      if (txt) console.log(`      [${i + 1}] "${txt}"`);
    }

    // Click Request TAC
    for (const label of ['Request TAC', 'Request OTP', 'Get TAC', 'Get OTP', 'Send TAC', 'TAC']) {
      const btn = this.page.locator(`button:has-text("${label}"), input[value*="${label}" i]`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${label}"`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        await this.wait(1500);
        return;
      }
    }
    throw new Error('Request TAC button not found');
  }

  async enterOTPAndPay(): Promise<void> {
    // Wait for OTP to appear
    const otpAppeared = await this.poll(async () =>
      (await this.page.locator('div.otp, .otp, [class*="otp"]').count()) > 0,
    );
    if (!otpAppeared) throw new Error('OTP/TAC element did not appear');

    const otpEl = this.page.locator('div.otp, .otp, [class*="otp"]').first();
    const otpRaw = (await otpEl.textContent().catch(() => '')) ?? '';
    console.log(`   🔢 OTP element text: "${otpRaw}"`);

    // Extract the 6-digit number
    const match = otpRaw.match(/\d{6}/);
    if (!match) throw new Error(`Could not extract 6-digit OTP from: "${otpRaw}"`);
    const otp = match[0];
    console.log(`   🔢 Extracted OTP: ${otp}`);

    // Fill OTP input
    const otpInput = this.page.locator('input#otp-input, input[name="otp-input"], input[class*="otp" i]').first();
    if ((await otpInput.count()) === 0) throw new Error('OTP input field not found');
    await otpInput.scrollIntoViewIfNeeded().catch(() => {});
    await otpInput.click();
    await otpInput.fill(otp);
    await this.wait(500);
    console.log(`   ✏️  OTP entered: ${otp}`);

    // Click Pay Now
    const payBtn = this.page.locator('button.pay-btn, button:has-text("Pay Now")').first();
    if ((await payBtn.count()) === 0) throw new Error('Pay Now button not found');
    console.log('   🖱️  Clicking "Pay Now"');
    await payBtn.scrollIntoViewIfNeeded().catch(() => {});
    await payBtn.click();
  }

  async waitForClose(): Promise<void> {
    // Wait for payment to process (~7s) then for the popup to close
    console.log('   ⏳ Waiting for payment processing…');
    await this.wait(7000);
    await this.page.waitForEvent('close', { timeout: 30_000 }).catch(() => {
      console.log('   ℹ️  Popup did not close automatically — continuing');
    });
    console.log('   ✅ Popup closed — back on main window');
  }
}
