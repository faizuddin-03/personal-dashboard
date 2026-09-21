import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CONFIG } from '../../data/config';
import { BusinessType } from '../../data/types';
import { pending } from '../../utils/pendingHtml';

// ── Pre-Application — Initial Steps ────────────────────────
// Sheet wording (identical across TS3-TS8, only the business type differs):
//   1. Open eAuto Login page and click "Apply eAuto". Complete Captcha verification
//   2. Fill in the Pre-Application form (<businessType>) and click next
//   3. Tick the Declaration statement box
export class PreApplicationFormPage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(CONFIG.publicLoginUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  /** Step 1a — click "Apply eAuto" from the login page. */
  async clickApplyEauto(): Promise<void> {
    pending('PreApplicationFormPage.clickApplyEauto — locate the "Apply eAuto" control on the login page');
  }

  /** Step 1b — captcha widget, type unknown (image/text/reCAPTCHA) pending HTML. */
  async completeCaptcha(): Promise<void> {
    pending('PreApplicationFormPage.completeCaptcha — captcha type/selector unknown');
  }

  /** Step 2 — select the business type and fill whatever fields that type requires. */
  async fillForm(businessType: BusinessType): Promise<void> {
    pending(`PreApplicationFormPage.fillForm — form fields for business type "${businessType}" unknown`);
  }

  async clickNext(): Promise<void> {
    pending('PreApplicationFormPage.clickNext');
  }

  /** Step 3 — Declaration statement checkbox, immediately before the payment step. */
  async tickDeclaration(): Promise<void> {
    pending('PreApplicationFormPage.tickDeclaration — Declaration statement checkbox selector unknown');
  }
}
