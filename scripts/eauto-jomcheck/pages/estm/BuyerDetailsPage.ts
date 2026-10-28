import { Page, expect } from '@playwright/test';
import { EstmSession } from './EstmSession';
import { CONFIG, EstmInputs } from './estmConfig';
import { MykadEmulatorClient } from './mykadEmulator';

// ── Buyer + vehicle details — copy of scripts/eauto-estm/pages/BuyerDetailsPage.ts;
// the two URL bypasses are replaced by the MyKad emulator (see estmConfig.ts).
// Hand read used on 2026-10-20 morning; back to the emulator the same day
// (Faizuddin: "for 12412, can you make the automation to use the emulator again") ──
// This stretch of the flow closes/reopens pages on nearly every field, so it
// re-resolves the active page constantly via the session. It is kept as one
// cohesive method because the redirect handoffs are tightly ordered.
export class BuyerDetailsPage {
  constructor(private readonly session: EstmSession, private readonly mykad: MykadEmulatorClient) {}

  /** MyKad authentication — copied from the working eDereg script
   *  (scripts/eauto-edereg-precheck/pages/DeregTransactionPage.ts runMykadAuth):
   *  wait for the MyKad controls, insert the emulator card, wait for Next to
   *  show and be enabled, click it. */
  private async runMykadAuth(step: string, label: string): Promise<void> {
    const p = await this.session.waitForActivePage();

    await p.locator('#mykad-control-container').waitFor({ state: 'visible', timeout: 15_000 });
    await this.mykad.insertCard();

    // hSmart__Card__Ready triggers an auto-read; #continueButton only
    // becomes clickable once photoReady/dataReady/verified are all set —
    // budget real time for the round trip, not the default action timeout.
    const continueBtn = p.locator('#continueButton');
    await continueBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await p.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return !!el && !el.disabled;
      },
      '#continueButton',
      { timeout: 30_000 },
    );
    await continueBtn.click();
    await this.session.waitForDomReady();
    this.session.progress(step, label);
  }

  // selectors (bound to whichever page is active at call time)
  private vehicleRegNo   = (p: Page) => p.locator('#vehicleRegNo');
  // Step 2's buyer email is `#buyerEmail` (verified live 2026-08-18), but this
  // stays a ROLE locator on purpose. Switching it to the id on 2026-08-18 broke
  // the run: the biometric gate came up, meaning the bypass never applied.
  // The id matches the instant the element exists — including on a page that is
  // mid-redirect — so the fill lands on a page about to be replaced, and the
  // bypass then reads its dynamic segment from the wrong URL. The role lookup
  // is slower and resolves after the page settles, which is what this stretch
  // depends on. Reverted; do not re-apply without proving a full run green.
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

    // ── Buyer MyKad (12412_TS12: the MyKad emulator replaces the first URL bypass) ──
    await this.runMykadAuth('bypass1', 'Buyer MyKad (emulator)');

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

    // Resolve the chassis field by count() before filling. Never fall back via
    // .catch() on .fill() — a non-matching locator polls for the full 30s
    // actionTimeout before rejecting, which silently added half a minute to
    // every run. count() answers immediately.
    ap = this.session.active();
    const chassisByCss = ap.locator('input[name="chassisNo"], #chassisNo').first();
    const chassisField = (await chassisByCss.count().catch(() => 0)) > 0
      ? chassisByCss
      : this.chassisNo(ap);
    await chassisField.fill('913821AA/* --');
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

    // ── Seller MyKad (12412_TS12: the MyKad emulator replaces the second URL bypass) ──
    await this.runMykadAuth('bypass2', 'Seller MyKad (emulator)');
    await this.session.closeBanners();

    // ── Agree + Next ──
    await this.session.ensureChecked('#to-agree');
    ap = await this.session.waitForActivePage();
    await ap.getByText('Next').click({ timeout: 10_000 }).catch(() => {});
    await this.session.waitForDomReady();
  }
}
