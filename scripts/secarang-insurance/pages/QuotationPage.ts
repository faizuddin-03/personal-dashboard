import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

const CARD_SEL = '.insurance-card';

export class QuotationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickGetQuotationIfShown(): Promise<boolean> {
    // Wait for the page transition from the previous step to finish, then settle for 1s
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.wait(1_000);

    // Already on quotation cards page — nothing to do
    if ((await this.page.locator(CARD_SEL).count()) > 0) return false;

    const sels = [
      'button:has-text("Get Quotation")',
      'button:has-text("Get quotation")',
      'button:has-text("Get Quote")',
    ];

    for (const sel of sels) {
      const btn = this.page.locator(sel).last();
      if ((await btn.count()) === 0 || !(await btn.isVisible().catch(() => false))) continue;

      await this.poll(() => btn.isEnabled().catch(() => false), 10_000);

      console.log(`   🖱️  Clicking "${sel.match(/"([^"]+)"/)?.[1] ?? 'Get Quotation'}"`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ timeout: 8_000 }).catch(async () => {
        await btn.click({ force: true }).catch(() => {});
      });
      await this.wait(500);
      return true;
    }

    return false;
  }

  async waitForCards(): Promise<void> {
    const ok = await this.poll(
      async () => (await this.page.locator(CARD_SEL).count()) > 0,
      25_000,
    );
    if (!ok) throw new Error('Quotation cards did not appear within 25 s');
  }

  // Extracts all RM price values visible on a specific insurer's card.
  // Returns a comma-joined string of all RM amounts found (e.g. "RM 1,234.56").
  // Returns '' if the card is not found or has no RM values.
  async extractInsurerPrice(insurerName: string): Promise<string> {
    const cards     = this.page.locator(CARD_SEL);
    const total     = await cards.count();
    const nameLower = insurerName.toLowerCase();

    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible().catch(() => false))) continue;
      const alts: string[] = await card.locator('img').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt.toLowerCase())
      ).catch(() => []);
      if (!alts.some(a => a.includes(nameLower))) continue;

      const text = await card.innerText().catch(() => '');
      const matches = text.match(/RM\s*[\d,]+(?:\.\d{1,2})?/g) ?? [];
      const prices  = [...new Set(matches.map(m => m.replace(/\s+/, ' ')))];
      return prices.join(', ');
    }
    return '';
  }

  // Looks for a postcode field on the quotation page, updates it, and waits for
  // the quote cards to refresh. Uses network-idle detection instead of a fixed
  // timer so it adapts to the variable 10-20 s insurance API response time.
  // Returns true if the postcode was successfully changed, false if no field found.
  async changePostcodeAndWait(postcode: string): Promise<boolean> {
    const inputSels = [
      'input[placeholder*="postcode" i]',
      'input[placeholder*="poskod" i]',
      'input[name*="postcode" i]',
      'input[id*="postcode" i]',
      'input[data-testid*="postcode" i]',
    ];

    let postcodeInput = null;
    for (const sel of inputSels) {
      const el = this.page.locator(sel).first();
      if ((await el.count()) > 0 && await el.isVisible().catch(() => false)) {
        postcodeInput = el;
        break;
      }
    }

    if (!postcodeInput) {
      console.log('   ℹ️  No postcode field found on quotation page — skipping');
      return false;
    }

    console.log(`   📍 Changing postcode to "${postcode}"`);
    await postcodeInput.clear();
    await postcodeInput.fill(postcode);

    const btnSels = [
      'button:has-text("Apply")',
      'button:has-text("Update")',
      'button:has-text("Kemaskini")',
      'button:has-text("Refresh")',
      'button:has-text("Get Quote")',
      'button:has-text("Cari")',
    ];

    let clicked = false;
    for (const sel of btnSels) {
      const btn = this.page.locator(sel).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${sel.match(/"([^"]+)"/)?.[1]}" to apply postcode`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      await postcodeInput.press('Enter');
      console.log('   ⌨️  Pressed Enter to apply postcode');
    }

    // Network-idle detection: waits until the insurance API response settles.
    // Falls back gracefully if the page never hits networkidle within 35 s.
    console.log('   ⏳ Waiting for quotation to refresh (network idle)…');
    await this.page.waitForLoadState('networkidle', { timeout: 35_000 }).catch(() => {
      console.log('   ⚠️  Network idle timeout — checking for cards anyway');
    });

    // Final confirmation: cards visible
    const ok = await this.poll(
      async () => (await this.page.locator(CARD_SEL).count()) > 0,
      10_000,
    );
    console.log(ok ? '   ✅ Quotation refreshed' : '   ⚠️  Cards did not reappear after postcode change');
    return ok;
  }

  // Returns:
  //   foundTarget=false            → insurer card not on page at all
  //   foundTarget=true, unavailable=true  → card present but "Quotation unavailable"
  //   foundTarget=true, unavailable=false → card present and Buy button clicked
  async selectInsurer(insurerName: string, coverageType?: 'comprehensive' | 'tpft'): Promise<{ foundTarget: boolean; unavailable: boolean }> {
    const cards     = this.page.locator(CARD_SEL);
    const total     = await cards.count();
    const nameLower = insurerName.toLowerCase();

    console.log(`   🃏 ${total} card element(s) in DOM, searching visible card for "${insurerName}"`);

    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible().catch(() => false))) continue;

      // Each card header contains an img whose alt is e.g. "Zurich logo", "Lonpac logo", "Tokio Marine logo"
      const alts: string[] = await card.locator('img').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt.toLowerCase())
      ).catch(() => []);

      if (!alts.some(a => a.includes(nameLower))) continue;

      console.log(`   🎯 Found "${insurerName}" card (img alts: [${alts.join(', ')}])`);

      // Check if this insurer's card shows an unavailability message
      const bodyText = (await card.innerText().catch(() => '')).toLowerCase();
      const unavailablePhrases = [
        'quotation unavailable',
        'no quotation',
        'not available',
        'unable to provide',
        'no quote',
      ];
      const matchedPhrase = unavailablePhrases.find(p => bodyText.includes(p));
      if (matchedPhrase) {
        console.log(`   ⛔  "${insurerName}" → "${matchedPhrase}" — stopping`);
        return { foundTarget: true, unavailable: true };
      }

      // Click the Buy button
      const buyBtn = card.locator('button:has-text("Buy")').first();
      if ((await buyBtn.count()) > 0 && await buyBtn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "Buy" on "${insurerName}" card`);
        await buyBtn.scrollIntoViewIfNeeded().catch(() => {});
        await buyBtn.click();
        await this._selectCoverageType(coverageType);
        return { foundTarget: true, unavailable: false };
      }

      // Fallback: click the card itself
      console.log(`   🖱️  No Buy button — clicking card directly`);
      await card.click();
      await this._selectCoverageType(coverageType);
      return { foundTarget: true, unavailable: false };
    }

    console.log(`   ⚠️  No visible card matched "${insurerName}" among ${total} elements`);
    return { foundTarget: false, unavailable: false };
  }

  // Selects a coverage type tab/button (Comprehensive / TPFT) if the UI exposes one.
  // No-ops silently when the selector doesn't exist — safe to call before dev deploys.
  private async _selectCoverageType(coverageType?: 'comprehensive' | 'tpft'): Promise<void> {
    if (!coverageType) return;

    const label = coverageType === 'tpft' ? 'TPFT' : 'Comprehensive';
    const selectors = [
      `button:has-text("${label}")`,
      `[data-coverage="${coverageType}"]`,
      `label:has-text("${label}")`,
      `input[value="${coverageType}"]`,
    ];

    await this.wait(500);
    for (const sel of selectors) {
      const el = this.page.locator(sel).first();
      if ((await el.count()) > 0 && await el.isVisible().catch(() => false)) {
        console.log(`   🎯 Selecting coverage type "${label}" via "${sel}"`);
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await el.click();
        return;
      }
    }
    console.log(`   ℹ️  Coverage type selector for "${label}" not found — skipping (pending dev deploy)`);
  }
}
