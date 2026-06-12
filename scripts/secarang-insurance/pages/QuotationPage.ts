import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

const CARD_SELS = ['.insurance-card', '.quotation-card', '.quote-card', '.insurer-card', '.plan-card'];

export class QuotationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async findCardSel(): Promise<string> {
    for (const s of CARD_SELS) if ((await this.page.locator(s).count()) > 0) return s;
    return '';
  }

  async clickGetQuotationIfShown(): Promise<boolean> {
    await this.wait(600);

    // Already on cards — nothing to do
    if (await this.findCardSel()) return false;

    const sels = [
      'button:has-text("Get Quotation")',
      'button:has-text("Get quotation")',
      'button:has-text("Get Quote")',
    ];

    for (const sel of sels) {
      const btn = this.page.locator(sel).last();
      if ((await btn.count()) === 0 || !(await btn.isVisible().catch(() => false))) continue;

      // Wait until the button is enabled (sometimes it takes a moment)
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

  async waitForCards(): Promise<string> {
    const ok = await this.poll(async () => !!(await this.findCardSel()), 25_000);
    if (!ok) throw new Error('Quotation cards did not appear within 25 s');
    return this.findCardSel();
  }

  async selectInsurer(cardSel: string, insurerName: string): Promise<void> {
    const cards = this.page.locator(cardSel);
    const total = await cards.count();
    const nameLower = insurerName.toLowerCase();

    // Collect visible cards with their insurer names (from alt text and inner text)
    const visible: { idx: number; detectedBy: string }[] = [];
    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible().catch(() => false))) continue;

      // Primary: check all img alt attributes (insurer name lives here, not in text)
      const alts: string[] = await card.locator('img[alt]').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt.toLowerCase())
      ).catch(() => []);
      const nameInAlt = alts.some(a => a.includes(nameLower));

      // Secondary: inner text (covers cases where name IS rendered as text)
      const text = (await card.innerText().catch(() => '')).toLowerCase();
      const nameInText = text.includes(nameLower);

      // Also check src attribute of images (e.g. "zurich.png" contains "zurich")
      const srcs: string[] = await card.locator('img[src]').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.src.toLowerCase())
      ).catch(() => []);
      const nameInSrc = srcs.some(s => s.includes(nameLower));

      if (nameInAlt || nameInText || nameInSrc) {
        visible.push({ idx: i, detectedBy: nameInAlt ? 'img alt' : nameInSrc ? 'img src' : 'text' });
      }
    }

    console.log(`   🃏 ${total} total card(s), ${visible.length} match "${insurerName}"`);

    if (!visible.length) {
      // Log what we found to help diagnose
      for (let i = 0; i < Math.min(total, 6); i++) {
        const card = cards.nth(i);
        if (!(await card.isVisible().catch(() => false))) continue;
        const alts: string[] = await card.locator('img[alt]').evaluateAll(
          (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt)
        ).catch(() => []);
        console.log(`   Card ${i + 1} alts: [${alts.join(', ')}]`);
      }
      throw new Error(`Insurer "${insurerName}" not found among ${total} card(s)`);
    }

    // Use the first matching card
    const { idx, detectedBy } = visible[0];
    const card = cards.nth(idx);
    console.log(`   🎯 Found ${insurerName} at card index ${idx + 1} via ${detectedBy}`);

    // "Buy" is the confirmed button label from the HTML; list it first
    for (const label of ['Buy', 'Select', 'Buy Now', 'Proceed', 'Get Quote', 'Choose']) {
      const btn = card.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${label}" button`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        return;
      }
    }

    // Fallback: any primary button inside the card
    const primary = card.locator('button.primary-btn, button[class*="primary"]').first();
    if ((await primary.count()) > 0) {
      console.log('   🖱️  Clicking primary-btn in card');
      await primary.scrollIntoViewIfNeeded().catch(() => {});
      await primary.click();
      return;
    }

    console.log('   🖱️  Clicking card directly');
    await card.click();
  }
}
