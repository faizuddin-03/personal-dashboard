import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ConfirmationPage extends BasePage {
  private capturedData: Record<string, string> = {};

  constructor(page: Page) {
    super(page);
  }

  async waitForPage(): Promise<void> {
    const appeared = await this.poll(async () => {
      const t = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
      return /confirm.*pay|payment detail|order summary|premium|total.*payable/i.test(t);
    });

    if (!appeared) {
      const t = (await this.page.locator('body').innerText().catch(() => '')).slice(0, 400);
      throw new Error(`Payment confirmation page did not load. Page snippet: ${t}`);
    }

    await this.wait(1000);

    const bodySnip = (await this.page.locator('body').innerText().catch(() => '')).slice(0, 400);
    console.log(`   💳 Payment confirmation snippet:\n${bodySnip}`);
  }

  async fillOwnerDetails(
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string,
    addressLine1: string,
    addressLine2: string,
    addressLine3: string,
  ): Promise<void> {
    const fillByControlName = async (controlName: string, value: string) => {
      const inp = this.page.locator(`input[formcontrolname="${controlName}"]`).first();
      if ((await inp.count()) === 0) {
        console.log(`   ⚠️  formcontrolname="${controlName}" not found — skipping`);
        return;
      }
      await inp.scrollIntoViewIfNeeded().catch(() => {});
      await inp.click();
      await inp.fill(value);
      await this.wait(500);
      console.log(`   ✏️  ${controlName} = "${value}"`);
    };

    await fillByControlName('name',    ownerName);
    await fillByControlName('email',   ownerEmail);
    await fillByControlName('phoneNo', ownerPhone);
    await fillByControlName('addr1',   addressLine1);
    await fillByControlName('addr2',   addressLine2);
    await fillByControlName('addr3',   addressLine3);

    await this.wait(1000);
  }

  async applyDiscountCode(discountCode: string): Promise<void> {
    if (!discountCode) return;

    const discountContainer = this.page.locator('div.w-100.position-relative').filter({
      has: this.page.locator('span:has-text("Discount code")'),
    }).first();

    if ((await discountContainer.count()) > 0) {
      const discountInput = discountContainer.locator('input').first();
      await discountInput.scrollIntoViewIfNeeded().catch(() => {});
      await discountInput.click();
      await discountInput.fill(discountCode);
      await this.wait(500);
      console.log(`   🏷️  Discount code entered: "${discountCode}"`);

      // Wait 1s for Apply button to become enabled, then click it
      await this.wait(1000);
      const applyBtn = this.page.locator('button:has-text("Apply discount code"), button:has-text("Apply")').last();
      if (await applyBtn.isEnabled().catch(() => false)) {
        await applyBtn.scrollIntoViewIfNeeded().catch(() => {});
        await applyBtn.click();
        await this.wait(1000);
        console.log('   🏷️  Discount applied');
      } else {
        console.log('   ⚠️  Apply button still disabled — proceeding without discount');
      }
    } else {
      console.log('   ⚠️  Discount code field not found');
    }
  }

  async captureData(icNumber: string): Promise<void> {
    // Inputs we filled
    this.capturedData['Full Name']         = await this.page.locator('input[formcontrolname="name"]').inputValue().catch(() => '');
    this.capturedData['Email']             = await this.page.locator('input[formcontrolname="email"]').inputValue().catch(() => '');
    this.capturedData['Mobile Phone No.']  = await this.page.locator('input[formcontrolname="phoneNo"]').inputValue().catch(() => '');
    this.capturedData['IC No']             = icNumber.replace(/(\d{6})(\d{2})(\d{4})/, '$1-$2-$3');

    // All .row.mb-2 label→value pairs (vehicle details + insurance details + pricing)
    const rowData: Record<string, string> = await this.page.evaluate(() => {
      const result: Record<string, string> = {};
      document.querySelectorAll('.row.mb-2, .row.mb-4').forEach(row => {
        // Pattern 1: .text-muted label + sibling col (vehicle/insurance details)
        const muted = row.querySelector('.text-muted');
        if (muted) {
          const label = (muted.textContent || '').replace(/\s+/g, ' ').trim();
          if (!label) return;
          let value = '';
          for (const col of Array.from(row.querySelectorAll('[class*="col"]'))) {
            if (col !== muted && !col.contains(muted)) {
              const t = (col.textContent || '').replace(/\s+/g, ' ').trim();
              if (t) { value = t; break; }
            }
          }
          if (value) result[label] = value;
          return;
        }
        // Pattern 2: .col label + .col-auto value (pricing rows)
        const cols = Array.from(row.querySelectorAll('.col, .col-auto'));
        if (cols.length >= 2) {
          const label = (cols[0].textContent || '').replace(/\s+/g, ' ').trim();
          const value = (cols[cols.length - 1].textContent || '').replace(/\s+/g, ' ').trim();
          if (label && value && label !== value) result[label] = value;
        }
      });
      return result;
    });

    Object.assign(this.capturedData, rowData);
    console.log(`   📝 Captured ${Object.keys(this.capturedData).length} field(s) from confirmation page`);
  }

  getCapturedData(): Record<string, string> {
    return this.capturedData;
  }

  async confirmAndPay(): Promise<void> {
    const confirmBtn = this.page.locator('button[type="submit"]:has-text("Confirm and Pay"), button:has-text("Confirm and Pay")').last();
    if ((await confirmBtn.count()) === 0 || !(await confirmBtn.isVisible().catch(() => false))) {
      throw new Error('Confirm and Pay button not found on payment confirmation page');
    }

    console.log('   🖱️  Clicking "Confirm and Pay"');
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.click();
  }
}
