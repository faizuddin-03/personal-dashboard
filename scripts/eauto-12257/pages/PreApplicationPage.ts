import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { BIZ_LABEL, BIZ_VALUE, isTrading, type BizType } from '../data/scenarios';
import { tinPool, REFUSED_TEXT, MAX_TIN_SWAPS } from '../utils/tinPool';

// Pre-Application form — `/obs/preOnb/form`, reached from the eAuto login page
// "Apply eAuto" (TS Initial Step 1). Ported from Azila's
// pre-application.page.ts; selectors read off staging 2026-09-22 (Azila) and
// re-confirmed in captures obs-preonb-*.html (2026-10-21).
//
// The reCAPTCHA in front of it is a bot check: a PERSON ticks it while the run
// waits (E12257_GATE_MINUTES). Automation never touches the checkbox.

export interface PreAppDetails {
  bizType: BizType;
  businessName: string;
  oldBrn?: string;
  newBrn?: string;
  licenceNo?: string;
  licenceFile?: string;
  tin?: string;
  address: string;
  postcode: string;
  state: string;
  city: string;
  adminName: string;
  mobile: string;
  email: string;
}

export class PreApplicationPage extends BasePage {
  constructor(page: Page) { super(page); }

  /** What fillForm() typed — reported if eAuto refuses the company. */
  private filled?: PreAppDetails;

  /**
   * eAuto refuses company details already used elsewhere with a jQuery dialog
   * "Service Unavailable" — "The LHDN e-Invoice validation service is
   * temporarily unavailable. Please try again later." (12153_TS03, 2026-10-23,
   * NS0267086-M; Faizuddin: this "means the details are already used"). The
   * dialog's overlay then blocks Next. Stop at once, and print a
   * COMPANY_SPOILED line so the run route marks the company used for good.
   */
  private async failIfCompanySpoiled(): Promise<void> {
    const msg = this.page.locator('.ui-dialog:visible #custom-dialog-content, .ui-dialog:visible').filter({ hasText: /LHDN e-Invoice validation service is temporarily unavailable/i }).first();
    if (!(await msg.isVisible().catch(() => false))) return;
    const said = this.clean(await msg.innerText().catch(() => ''));
    await this.captureEvidence('preapp-company-spoiled');
    const d = this.filled;
    if (d?.oldBrn && d.newBrn) {
      console.log('COMPANY_SPOILED:' + JSON.stringify({ roc: d.oldBrn, newRoc: d.newBrn, tin: d.tin ?? '', companyName: d.businessName, reason: 'LHDN validation unavailable' }));
    }
    throw new Error(`Company details already used — eAuto says: "${said}". ${d?.oldBrn ?? ''} / ${d?.newBrn ?? ''} is now marked used on the dashboard; run again to take another company.`);
  }

  /**
   * Business Trading with a TIN: eAuto refused the TIN as already used. Close the
   * message, type the next spare TIN (utils/tinPool.ts) and let next() press again.
   * SSM companies are not handled here — the whole row is spent (failIfCompanySpoiled).
   */
  private async swapRefusedTin(): Promise<boolean> {
    const d = this.filled;
    if (!d || d.oldBrn || !d.tin) return false;
    const dialog = this.page.locator('.ui-dialog:visible, .modal:visible, .swal2-popup:visible').filter({ hasText: REFUSED_TEXT }).first();
    const fieldErr = this.page.locator('#tin-error:visible, #tin ~ :visible').filter({ hasText: REFUSED_TEXT }).first();
    const said = (await dialog.isVisible().catch(() => false)) ? this.clean(await dialog.innerText().catch(() => ''))
      : (await fieldErr.isVisible().catch(() => false)) ? this.clean(await fieldErr.innerText().catch(() => '')) : '';
    if (!said) return false;
    await this.captureEvidence('preapp-tin-refused');
    const next = tinPool.refuse(`Pre-Application: ${said.slice(0, 120)}`);
    if (!next) throw new Error(`eAuto refused TIN ${d.tin} ("${said}") — no spare TIN is left, or ${MAX_TIN_SWAPS} TINs in a row got this message. Then the TIN is probably not the cause (a made-up licence with a real TIN may always be refused): run again with "Include TIN" off.`);
    const close = this.page.locator('.ui-dialog:visible').getByRole('button', { name: /^(ok|close|yes)$/i })
      .or(this.page.locator('.ui-dialog:visible .ui-dialog-titlebar-close')).first();
    if (await close.isVisible().catch(() => false)) { await this.demoHighlight(close); await close.click(); }
    await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
    console.log(`DETAIL: eAuto refused TIN ${d.tin} — "${said.slice(0, 120)}". Trying the next spare TIN ${next}`);
    await this.type('#tin', next, true);
    this.filled = { ...d, tin: next };
    return true;
  }

  /** TS Initial Step 1: open the eAuto login page and click "Apply eAuto". */
  /** Returns the tab the form opened in (a new tab, or this one). */
  async openFromLogin(): Promise<Page> {
    await this.page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    const apply = this.page.getByRole('link', { name: /apply eauto/i })
      .or(this.page.getByRole('button', { name: /apply eauto/i }))
      .or(this.page.locator('a', { hasText: /apply eauto/i }))
      .first();
    await apply.waitFor({ state: 'visible', timeout: 30_000 });
    await this.demoHighlight(apply);
    const popup = this.page.context().waitForEvent('page', { timeout: 5_000 }).catch(() => null);
    await apply.click();
    const target = (await popup) ?? this.page;
    await target.waitForURL(/\/obs\/preOnb\//, { timeout: 60_000 });
    console.log(`DETAIL: "Apply eAuto" opened ${target.url().split('?')[0]}${target === this.page ? '' : ' in a new tab'}`);
    return target;
  }

  /** Wait for a person to tick the reCAPTCHA (no-op when the form is already showing). */
  async waitForCaptcha(): Promise<void> {
    const form = this.page.locator('#businessName');
    if (await form.isVisible().catch(() => false)) return;
    const mins = Math.round(CONFIG.gateMs / 60_000);
    console.log(`\n*** reCAPTCHA — please tick "I'm not a robot" in the browser window (waiting up to ${mins} min). ***\n`);
    console.log(`DETAIL: Waiting for a person to complete the reCAPTCHA (up to ${mins} min)`);
    await form.waitFor({ state: 'visible', timeout: CONFIG.gateMs }).catch(() => {
      throw new Error(`The reCAPTCHA was not completed within ${mins} min. Run with Headless off and tick it in the browser window.`);
    });
    console.log('DETAIL: reCAPTCHA cleared — Pre-Application form shown');
  }

  private async type(selector: string, value: string, blur = false): Promise<void> {
    const box = this.page.locator(selector);
    await this.demoHighlight(box);
    await box.click();
    await box.fill(value);
    if (blur) await box.press('Tab');
  }

  async chooseBusinessType(t: BizType): Promise<void> {
    const radio = this.page.getByRole('radio', { name: BIZ_LABEL[t], exact: true })
      .or(this.page.locator(`input[name="businessType"][value="${BIZ_VALUE[t]}"]`))
      .first();
    await this.demoHighlight(radio);
    await radio.check();
    await expect(this.page.locator(isTrading(t) ? '#businessLicenseNo' : '#oldBrn')).toBeVisible({ timeout: 15_000 });
    console.log(`DETAIL: Type of Business: ${BIZ_LABEL[t]}`);
  }

  /** TS Initial Step 2: fill the Pre-Application form. */
  async fillForm(d: PreAppDetails): Promise<void> {
    this.filled = d;
    await this.type('#businessName', d.businessName);
    await this.chooseBusinessType(d.bizType);
    if (isTrading(d.bizType)) {
      if (!d.licenceNo || !d.licenceFile) throw new Error(`${BIZ_LABEL[d.bizType]} needs a licence number and file.`);
      await this.type('#businessLicenseNo', d.licenceNo, true);
      await this.uploadLicence(d.licenceFile);
    } else {
      if (!d.oldBrn || !d.newBrn) throw new Error(`${BIZ_LABEL[d.bizType]} needs the old and new BRN.`);
      await this.type('#oldBrn', d.oldBrn);
      // The SSM lookup (checkSSM.do) fires on blur of the new BRN.
      await this.type('#newBrn', d.newBrn, true);
      await this.page.waitForTimeout(2_000);
      const banner = this.page.locator('.confirm-business-reminder:visible').first();
      if (await banner.count()) {
        await this.captureIssue('ssm-rejected', banner, 'SSM lookup rejected the BRN');
        throw new Error(`SSM rejected the BRN: "${this.clean(await banner.innerText())}". Seed the company in eSIM (both rows) or check the BRN pair.`);
      }
    }
    if (d.tin) await this.type('#tin', d.tin, true);
    await this.type('#showroomAddress', d.address);
    await this.type('#showroomPostcode', d.postcode);
    const state = this.page.locator('#showroomState');
    await this.demoHighlight(state);
    await state.selectOption({ label: d.state });
    const city = this.page.locator('#showroomCity');
    await expect(city).toBeEnabled({ timeout: 15_000 });
    await this.poll(async () => (await city.locator('option').count()) > 1, 15_000);
    await this.demoHighlight(city);
    await city.selectOption({ label: d.city });
    await this.type('#adminName', d.adminName);
    await this.type('#mobileNo', d.mobile);
    await this.type('#adminEmail', d.email);
    console.log(`DETAIL: Pre-Application form filled — ${d.businessName}, ${d.oldBrn || d.licenceNo || ''} ${d.newBrn || ''}, TIN ${d.tin || '(none)'}, ${d.city}/${d.state}, ${d.email}`);
    await this.captureEvidence('preapp-form-filled');
  }

  /** Trading licence: click the visible Browse control and answer the file chooser. */
  private async uploadLicence(file: string): Promise<void> {
    const browse = this.page.getByText(/browse files?\.{0,3}/i).filter({ visible: true }).first();
    if (!(await browse.count())) throw new Error('No visible Browse control for the trading licence.');
    await this.demoHighlight(browse);
    const [chooser] = await Promise.all([this.page.waitForEvent('filechooser', { timeout: 15_000 }), browse.click()]);
    await chooser.setFiles(file);
    const name = file.split(/[\\/]/).pop()!;
    await this.page.getByText(name, { exact: false }).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {
      throw new Error(`The licence upload never showed "${name}".`);
    });
    console.log(`DETAIL: Trading licence uploaded: ${name}`);
  }

  /** "Next" until Business Info Review shows; the TIN warning needs a second press (non-blocking). */
  async next(): Promise<string[]> {
    const review = this.page.locator('#business-review-section');
    const next = this.page.locator('#nextSubmitBtn');
    const warnings: string[] = [];
    for (let i = 0, swaps = 0; i < 3; i++) {
      if (swaps < 20 && await this.swapRefusedTin()) { swaps++; i--; continue; }
      await this.failIfCompanySpoiled();
      if (!(await next.isEnabled({ timeout: 15_000 }).catch(() => false))) {
        await this.page.waitForTimeout(15_000);
        if (!(await next.isEnabled().catch(() => false))) {
          const modal = await this.page.locator('.modal:visible, [role=dialog]:visible, .ui-dialog:visible, .swal2-popup:visible').first().innerText().catch(() => '');
          throw new Error(`Next is disabled${modal ? ` — the page says: "${this.clean(modal)}"` : ''}.`);
        }
      }
      await this.demoHighlight(next);
      await next.click();
      if (await review.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) {
        console.log(`DETAIL: Business Info Review shown${warnings.length ? ` (after: ${warnings.join(' | ')})` : ''}`);
        if (this.filled?.tin && !this.filled.oldBrn) tinPool.used();
        return warnings;
      }
      if (swaps < 20 && await this.swapRefusedTin()) { swaps++; i--; continue; }
      await this.failIfCompanySpoiled();
      const tin = await this.page.getByText(/The TIN is invalid/i).first().innerText().catch(() => '');
      if (tin) warnings.push(this.clean(tin));
    }
    throw new Error(`Next was pressed 3 times and Business Info Review never showed. ${warnings.join(' | ')}`);
  }

  /** TS Initial Step 3: tick the Declaration statement box (reveals the payment tiles). */
  async tickDeclaration(): Promise<void> {
    const box = this.page.locator('#agreeTerms');
    await this.demoHighlight(box);
    await box.check();
    await this.page.locator('#payment-method-section').waitFor({ state: 'visible', timeout: 15_000 });
    console.log('DETAIL: Declaration ticked — payment methods shown');
  }

  /** Pre-Application No on the summary page, e.g. P261021/00889. */
  async preApplicationNo(): Promise<string> {
    const body = this.clean(await this.page.locator('body').innerText());
    return /Pre-Application No:\s*(P\d{6}\/\d+)/.exec(body)?.[1] ?? /(P\d{6}\/\d{5})/.exec(body)?.[1] ?? '';
  }
}
