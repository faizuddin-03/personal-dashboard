import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BankTACPage extends BasePage {
  constructor(popup: Page) {
    super(popup);
  }

  async logOptionsAndRequestTAC(paymentStatus?: string): Promise<void> {
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

    // Select payment status code before clicking Request TAC
    const statusCode = paymentStatus ?? '00';
    const statusSelect = this.page.locator('select#status_code');
    if ((await statusSelect.count()) > 0) {
      await statusSelect.selectOption(statusCode).catch(() => {});
      console.log(`   💳 Payment status set to: ${statusCode}`);
    } else {
      console.log(`   ⚠️  #status_code select not found — skipping status selection`);
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
    // RHB0218 simulator (live 2026-10-19): after Request TAC the code shows in
    // a read-only box beside "Transaction Authentication Code :", it is typed
    // into an "Enter TAC" box, then "Pay now". Copy the code across like a
    // person would.
    const tacBox = this.page.locator('input[placeholder*="Enter TAC" i]').first();
    const shownCode = async () => {
      for (const v of await this.page.locator('input').evaluateAll(els => els.map(e => (e as HTMLInputElement).value))) {
        if (/^\d{6}$/.test(v.trim())) return v.trim();
      }
      return '';
    };
    if (await this.poll(async () => (await tacBox.count()) > 0 && !!(await shownCode()), 15_000)) {
      const tac = await shownCode();
      console.log(`   🔢 TAC shown: ${tac}`);
      await this.demoHighlight(tacBox);
      await tacBox.click();
      await tacBox.fill(tac);
      const pay = this.page.locator('button', { hasText: /pay\s*now/i }).first();
      console.log('   🖱️  Clicking "Pay now"');
      await this.demoHighlight(pay);
      await pay.click();
      return;
    }

    // Older simulator layout: the OTP is printed in a div.otp.
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
    console.log('   ⏳ Waiting for popup to close after Pay Now…');
    // The popup closes immediately on its own after Pay Now redirects.
    // page.waitForTimeout / any page method throws if the page is already
    // gone, so check isClosed() first before attaching any listener.
    if (!this.page.isClosed()) {
      await this.page.waitForEvent('close', { timeout: 30_000 }).catch(() => {
        console.log('   ℹ️  Popup did not close within 30 s — continuing anyway');
      });
    }
    console.log('   ✅ Popup closed — processing continues on main window');
  }
}
