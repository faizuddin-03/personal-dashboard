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

  async selectInsurer(cardSel: string, insurerName: string): Promise<{ foundTarget: boolean; selectedName: string }> {
    const cards    = this.page.locator(cardSel);
    const total    = await cards.count();
    const nameLower = insurerName.toLowerCase();

    // Collect visible cards with their insurer names
    const visible: { idx: number; label: string; detectedBy: string }[] = [];
    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible().catch(() => false))) continue;

      const alts: string[] = await card.locator('img[alt]').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt.toLowerCase())
      ).catch(() => []);
      const srcs: string[] = await card.locator('img[src]').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.src.toLowerCase())
      ).catch(() => []);
      const text = (await card.innerText().catch(() => '')).toLowerCase();

      // Build a human-readable label from alts > text snippet
      const rawLabel = alts.find(a => a.length > 1) ?? text.slice(0, 40);

      visible.push({
        idx: i,
        label: rawLabel,
        detectedBy: alts.some(a => a.includes(nameLower)) ? 'img alt'
          : srcs.some(s => s.includes(nameLower))        ? 'img src'
          : text.includes(nameLower)                     ? 'text'
          : 'other',
      });
    }

    console.log(`   🃏 ${total} total card(s), searching for "${insurerName}"`);

    // Try to find the target insurer
    const targetCard = visible.find(v =>
      v.label.includes(nameLower) || v.detectedBy !== 'other'
    ) ?? null;

    // If not found, fall back to the first visible card
    const chosen      = targetCard ?? visible[0] ?? null;
    const foundTarget = !!targetCard;

    if (!chosen) {
      console.log(`   ⚠️  No visible quotation cards — cannot select insurer`);
      return { foundTarget: false, selectedName: '' };
    }

    if (!foundTarget) {
      console.log(`   ⚠️  "${insurerName}" not found — picking first available card (${chosen.label.slice(0, 30)})`);
    } else {
      console.log(`   🎯 Found "${insurerName}" at card ${chosen.idx + 1} via ${chosen.detectedBy}`);
    }

    const card = cards.nth(chosen.idx);
    for (const label of ['Buy', 'Select', 'Buy Now', 'Proceed', 'Get Quote', 'Choose']) {
      const btn = card.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${label}" button`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        return { foundTarget, selectedName: chosen.label.slice(0, 40) };
      }
    }

    const primary = card.locator('button.primary-btn, button[class*="primary"]').first();
    if ((await primary.count()) > 0) {
      console.log('   🖱️  Clicking primary-btn in card');
      await primary.scrollIntoViewIfNeeded().catch(() => {});
      await primary.click();
      return { foundTarget, selectedName: chosen.label.slice(0, 40) };
    }

    console.log('   🖱️  Clicking card directly');
    await card.click();
    return { foundTarget, selectedName: chosen.label.slice(0, 40) };
  }
}
