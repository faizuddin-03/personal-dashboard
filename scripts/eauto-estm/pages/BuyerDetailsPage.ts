import { Page, expect } from '@playwright/test';
import { EstmSession } from '../utils/session';
import { CONFIG, EstmInputs, escapeRegex } from '../data/config';

// ── Buyer + vehicle details, with the two eSTM "bypass" redirects ──
// This stretch of the flow closes/reopens pages on nearly every field, so it
// re-resolves the active page constantly via the session. It is kept as one
// cohesive method because the redirect handoffs are tightly ordered.
export class BuyerDetailsPage {
  constructor(private readonly session: EstmSession) {}

  // selectors (bound to whichever page is active at call time)
  private vehicleRegNo   = (p: Page) => p.locator('#vehicleRegNo');
  private emailBox       = (p: Page) => p.getByRole('textbox', { name: 'Email' });
  private buyerConsent   = (p: Page) => p.locator('#buyer-consent');
  private reconfirmEmail = (p: Page) => p.getByRole('textbox', { name: 'Reconfirm eVOC Email' });
  private emailAddress   = (p: Page) => p.getByRole('textbox', { name: 'Email Address' });
  private mobileNo       = (p: Page) => p.getByRole('textbox', { name: 'Mobile No' });
  private engineNo       = (p: Page) => p.getByRole('textbox', { name: 'Engine No' });
  private chassisNo      = (p: Page) => p.getByRole('textbox', { name: 'Chassis No' });
  private nextBtn        = (p: Page) => p.getByRole('button', { name: 'Next' });

  async fillAndBypass(inputs: EstmInputs): Promise<void> {
    let ap = this.session.active();

    // ── Vehicle number ──
    await this.vehicleRegNo(ap).click();
    await this.vehicleRegNo(ap).fill(inputs.vehicleRegNo);
    this.session.progress('vehicle_no', 'Fill Vehicle No.');
    await this.session.waitForDomReady();

    // ── Buyer email (retry through redirects) ──
    for (let attempt = 0; attempt < 3; attempt++) {
      ap = await this.session.waitForActivePage();
      try {
        await this.emailBox(ap).click({ timeout: 4000 });
        await this.emailBox(ap).fill(CONFIG.evocEmail, { timeout: 4000 });
        break;
      } catch (err) { if (attempt === 2) throw err; await ap.waitForTimeout(200); }
    }

    // ── Buyer consent (three fallbacks) ──
    await this.buyerConsent(ap).setChecked(true, { force: true }).catch(() => {});
    ap = this.session.active();
    if (!(await this.buyerConsent(ap).isChecked().catch(() => false))) {
      const label = ap.locator('label[for="buyer-consent"]');
      if (await label.count().catch(() => 0)) await label.click({ force: true }).catch(() => {});
    }
    ap = this.session.active();
    if (!(await this.buyerConsent(ap).isChecked().catch(() => false))) {
      await ap.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>('#buyer-consent');
        if (!input) return;
        input.disabled = false; input.checked = true;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }).catch(() => {});
    }
    await expect(this.session.active().locator('#buyer-consent')).toBeChecked();
    this.session.progress('buyer_consent', 'Buyer Consent');

    // ── First bypass: inject the live dynamic segment into the URL ──
    ap = this.session.active();
    const dynamicSegment = ap.url().match(new RegExp(`/${escapeRegex(inputs.envSegment)}/(.+?)/${escapeRegex(inputs.envSegment)}/`))?.[1] ?? 'zzz/22';
    const withSegment = (rawUrl: string) => {
      if (rawUrl.includes(`/${inputs.envSegment}/${dynamicSegment}/${inputs.envSegment}/view/`)) return rawUrl;
      return rawUrl.replace(
        new RegExp(`/${escapeRegex(inputs.envSegment)}/(?:[^/]+/[^/]+/${escapeRegex(inputs.envSegment)}/)?(view/.*)$`),
        `/${inputs.envSegment}/${dynamicSegment}/${inputs.envSegment}/$1`,
      );
    };
    await ap.goto(withSegment(ap.url()), { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.session.waitForDomReady();
    this.session.progress('bypass1', 'Apply Bypass');

    // ── Reconfirm eVOC email + contact details ──
    ap = this.session.active();
    await expect(this.reconfirmEmail(ap)).toBeVisible({ timeout: 30000 });
    await this.reconfirmEmail(ap).click();
    await this.reconfirmEmail(ap).fill(CONFIG.evocEmail);
    this.session.progress('reconfirm_email', 'Reconfirm Email');
    await this.reconfirmEmail(ap).press('Tab');

    await this.emailAddress(ap).fill(inputs.emailAddress);
    await this.emailAddress(ap).evaluate((el) => (el as HTMLInputElement).blur()).catch(() => {});
    await this.session.waitForDomReady();

    ap = this.session.active();
    await this.mobileNo(ap).fill(inputs.mobileNo);
    this.session.progress('contact_details', 'Contact Details');

    // Same correspondence address (custom checkbox)
    await this.session.ensureChecked('#to-same-address');
    await this.session.waitForDomReady();

    // ── Engine + chassis (bypass values) ──
    ap = this.session.active();
    await expect(this.engineNo(ap)).toBeVisible({ timeout: 20000 });
    ap = this.session.active();
    await this.engineNo(ap).fill('*/ -1231Aa');
    await this.session.active().locator('input[name="chassisNo"], #chassisNo').first().fill('913821AA/* --').catch(async () => {
      await this.chassisNo(this.session.active()).fill('913821AA/* --');
    });
    this.session.progress('engine_chassis', 'Engine & Chassis');

    for (let attempt = 0; attempt < 3; attempt++) {
      ap = await this.session.waitForActivePage();
      try { await this.nextBtn(ap).click({ timeout: 4000 }); break; }
      catch (err) { if (attempt === 2) throw err; await ap.waitForTimeout(220); }
    }
    this.session.progress('submit_step3', 'Submit Step 3');

    ap = await this.session.waitForActivePage();
    await ap.getByRole('button', { name: 'Yes' }).click({ timeout: 5000 }).catch(() => {});
    await this.session.waitForDomReady();

    // ── UCD consent (force-check; no reliable Yes button here) ──
    ap = this.session.active();
    await ap.waitForSelector('#ucd-consent', { state: 'visible', timeout: 15000 }).catch(() => {});
    await ap.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('#ucd-consent');
      if (!input) return;
      input.scrollIntoView({ block: 'center' });
      input.disabled = false; input.click(); input.checked = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }).catch(() => {});
    await this.session.ensureChecked('#ucd-consent');
    this.session.progress('ucd_consent', 'UCD Consent');
    await this.session.waitForDomReady();

    // ── Second bypass ──
    ap = this.session.active();
    await ap.goto(
      ap.url().replace(`/${inputs.envSegment}/view/`, `/${inputs.envSegment}/zzz/22/${inputs.envSegment}/view/`),
      { waitUntil: 'domcontentloaded' },
    ).catch(() => {});
    await this.session.waitForDomReady();
    this.session.progress('bypass2', '2nd Bypass');

    // ── Agree + Next ──
    await this.session.ensureChecked('#to-agree');
    ap = await this.session.waitForActivePage();
    await ap.getByText('Next').click().catch(() => {});
    await this.session.waitForDomReady();
  }
}
