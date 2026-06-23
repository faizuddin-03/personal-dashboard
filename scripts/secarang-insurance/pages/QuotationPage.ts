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
