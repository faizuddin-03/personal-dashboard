import { Page, Dialog } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';
import { VehicleInput, VehicleResult, InsurerResult, emptyResult } from '../data/types';

// ── Insurance quote enquiry page ────────────────────────────
// Owns every selector on the enquiry flow. Returns plain data —
// the spec (or batch runner) decides what to do with it.
export class EnquiryPage extends BasePage {
  // locators (private — specs never access these)
  private quoteForm        = () => this.page.locator('#quote-form');
  private companyRadio     = () => this.page.locator('input[name="vehicleCategory"][value="company"]');
  private vehicleRegNo     = () => this.page.locator('#vehicleRegNo');
  private buyerRefId       = () => this.page.locator('#buyerRefIdCompanyROC');
  private showResultBtn    = () => this.page.locator('#to-show-result');
  private postcodeInput    = () => this.page.locator('#postcode');
  private vehicleDetail    = () => this.page.locator('#vehicle-detail');
  private getQuoteBtn      = () => this.page.locator('#to-continue');

  constructor(
    page: Page,
    private readonly loginPage: LoginPage,
    private readonly creds: UserCredentials,
  ) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.enquiryPath}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /**
   * Run the full enquiry flow for one vehicle and return the extracted data.
   * Handles session expiry, the AJAX "Working..." states, the optional
   * postcode step, and JS alert dialogs.
   */
  async checkVehicle(vehicle: VehicleInput): Promise<VehicleResult> {
    const ic = vehicle.icNumber || CONFIG.icNumber;
    const postcode = vehicle.postcode || CONFIG.postcode;
    const category = (vehicle.vehicleCategory || CONFIG.vehicleCategory).toLowerCase();
    const vn = vehicle.vehicleNumber;

    console.log(`\n🚗 Processing: ${vn}`);

    // Navigate fresh; re-login if the session expired
    await this.goto();
    if (this.page.url().includes('/login')) {
      console.log('   Session expired, re-logging...');
      await this.loginPage.login(this.creds);
    }

    if ((await this.quoteForm().count()) === 0) {
      return emptyResult(vn, 'ERROR', 'Enquiry form not found on page');
    }

    // ── Step 1: Fill form ──────────────────────────────────────────────
    if (category === 'company') {
      await this.companyRadio().check();
    }
    await this.vehicleRegNo().fill(vn);
    await this.buyerRefId().fill(ic);

    // ── Step 2: Handle dialog (alert popup) ────────────────────────────
    // The form is AJAX-based: clicking SHOW RESULT does NOT navigate, but
    // may fire a JS alert() first. Remove existing listeners to prevent
    // duplicates, then register a single handler for the whole flow.
    this.page.removeAllListeners('dialog');
    const dialogHandler = async (dialog: Dialog) => {
      console.log(`   📢 Alert: "${dialog.message()}"`);
      await dialog.accept();
    };
    this.page.on('dialog', dialogHandler);

    try {
      // ── Step 3: Click SHOW RESULT (AJAX — no page navigation) ────────
      console.log('   Clicking SHOW RESULT...');
      await this.showResultBtn().click();

      await this.waitForCondition(async () => {
        const text = await this.bodyText();
        return !text.includes('Working...') ||
          text.includes('Unable to retrieve') ||
          (await this.postcodeInput().isVisible().catch(() => false)) ||
          (await this.vehicleDetail().isVisible().catch(() => false));
      });
      await this.page.waitForTimeout(CONFIG.waitAfterClick);

      // ── Step 4: Check what happened ────────────────────────────────
      if ((await this.bodyText()).includes('Unable to retrieve your vehicle information')) {
        console.log('   ❌ No vehicle info — skipping');
        return emptyResult(vn, 'NO_VEHICLE_INFO', 'Unable to retrieve your vehicle information');
      }

      // ── Step 5: Fill postcode if it appeared ────────────────────────
      if (await this.postcodeInput().isVisible().catch(() => false)) {
        console.log(`   Filling postcode: ${postcode}`);
        await this.postcodeInput().fill(postcode);

        console.log('   Clicking SHOW RESULT (with postcode)...');
        await this.showResultBtn().click();

        await this.waitForCondition(async () => {
          const text = await this.bodyText();
          return !text.includes('Working...') ||
            text.includes('Unable to retrieve') ||
            (await this.vehicleDetail().isVisible().catch(() => false));
        });
        await this.page.waitForTimeout(CONFIG.waitAfterClick);
      }

      // ── Step 6: Check for error again ──────────────────────────────
      if ((await this.bodyText()).includes('Unable to retrieve your vehicle information')) {
        console.log('   ❌ No vehicle info — skipping');
        return emptyResult(vn, 'NO_VEHICLE_INFO', 'Unable to retrieve your vehicle information');
      }

      // ── Step 7: Check vehicle details appeared ─────────────────────
      if (!(await this.vehicleDetail().isVisible().catch(() => false))) {
        return emptyResult(vn, 'ERROR', 'Vehicle detail did not appear');
      }

      // ── Step 8: Extract vehicle details ────────────────────────────
      const vehicleInfo = await this.extractVehicleDetails();
      console.log(`   ✅ ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.manufacturingYear})`);

      // ── Step 9: Click GET QUOTE ────────────────────────────────────
      if ((await this.getQuoteBtn().count()) === 0) {
        return emptyResult(vn, 'ERROR', 'GET QUOTE button not found');
      }
      console.log('   Clicking GET QUOTE...');
      await this.getQuoteBtn().click();

      await this.waitForCondition(async () => !(await this.bodyText()).includes('Working...'));
      await this.page.waitForTimeout(CONFIG.waitAfterClick);

      // ── Step 10: Extract insurer data ──────────────────────────────
      const insurers = await this.extractInsurers();
      console.log(`   📋 ${insurers.length} insurer(s) found:`);
      insurers.forEach(i => console.log(`     - ${i.insurerName}: Cover=${i.coverType}, Allow=${i.allowToPurchase}, Risk=${i.referRiskCode}, Price=${i.totalPrice}`));
      if (insurers.length === 0) {
        const bodySnippet = await this.bodyText();
        console.log(`   ⚠️  No insurers found. Page text snippet:\n${bodySnippet.slice(0, 500)}`);
      }

      return { vehicleNumber: vn, ...vehicleInfo, insurers, status: 'SUCCESS' };
    } finally {
      this.page.off('dialog', dialogHandler);
    }
  }

  private async extractVehicleDetails() {
    return this.page.evaluate(() => {
      const get = (label: string): string => {
        const labels = document.querySelectorAll('#vehicle-detail td.quote-label');
        for (const el of labels) {
          if (el.textContent?.trim().replace(/\s+/g, ' ').includes(label)) {
            return el.nextElementSibling?.textContent?.trim().replace(/\s+/g, ' ') || '';
          }
        }
        return '';
      };
      return {
        make: get('Make'),
        model: get('Model'),
        manufacturingYear: get('Manufacturing Year'),
        engineCapacity: get('Engine Capacity'),
        transmission: get('Transmission'),
        variant: get('Variant'),
      };
    });
  }

  private async extractInsurers(): Promise<InsurerResult[]> {
    // Log all classes on the page that contain "plan" to help diagnose missing insurers
    const planClasses = await this.page.evaluate(() =>
      [...new Set([...document.querySelectorAll('[class*="plan"]')].map(el => el.className))].join(', ')
    );
    console.log(`   🔍 Plan-related classes on page: ${planClasses || '(none)'}`);

    return this.page.evaluate(() => {
      const clean = (s: string) => s.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
      // Normalise insurer names that the page renders without spaces
      const INSURER_NORM: Record<string, string> = { 'TokioMarine': 'Tokio Marine' };
      const normalise = (n: string) => INSURER_NORM[n] ?? n;

      const results: {
        insurerName: string; coverType: string; allowToPurchase: string;
        referRiskCode: string; totalPrice: string;
      }[] = [];

      const tables = document.querySelectorAll('.plan-detail-table');
      console.log(`[page] Found ${tables.length} .plan-detail-table elements`);

      tables.forEach((table) => {
        const nameEl = table.querySelector('.plan-name') ?? table.querySelector('[class*="plan-name"]') ?? table.querySelector('th') ?? table.querySelector('td');
        const insurerName = normalise(clean(nameEl?.textContent || 'Unknown'));
        let coverType = '', allowToPurchase = '', referRiskCode = '', totalPrice = '';

        table.querySelectorAll('td').forEach((td) => {
          const text = clean(td.textContent || '');

          // Cover type: capture full text before "Period of insurance"
          if (text.startsWith('Cover Type') && !coverType) {
            coverType = text.split(/\bPeriod\b/i)[0].trim();
          }

          if (text.includes('Refer Risk')) {
            const cleaned = text.replace('Refer Risk:', '').replace('Refer Risk Code:', '').trim();
            if (cleaned && cleaned !== '-') referRiskCode = cleaned;
          }

          if (text.includes('Allow to purchase insurance:')) {
            allowToPurchase = clean(text.replace('Allow to purchase insurance:', ''));
          }
        });

        // Total price
        const rows = table.querySelectorAll('tr');
        for (const tr of rows) {
          if (tr.textContent?.includes('Total Price')) {
            const cells = tr.querySelectorAll('td');
            for (const td of cells) {
              const t = clean(td.textContent || '');
              if (t.match(/^RM\s[\d,.]+$/)) { totalPrice = t; break; }
            }
            if (!totalPrice) {
              const m = clean(tr.textContent || '').match(/RM\s[\d,.]+/);
              if (m) totalPrice = m[0];
            }
            break;
          }
        }

        results.push({ insurerName, coverType, allowToPurchase, referRiskCode: referRiskCode || '-', totalPrice: totalPrice || '-' });
      });
      return results;
    });
  }
}
