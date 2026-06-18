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
    // Wait for the page transition from the previous step to finish, then settle for 1s
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.wait(1_000);

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
    const cards     = this.page.locator(cardSel);
    const total     = await cards.count();
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

      const ariaLabels: string[] = await card.locator('[aria-label]').evaluateAll(
        (els: Element[]) => els.map(el => (el.getAttribute('aria-label') ?? '').toLowerCase())
      ).catch(() => []);

      const dataAttrs: string[] = await card.evaluate((el: Element) => {
        const vals: string[] = [];
        const collect = (node: Element) => {
          for (const attr of Array.from(node.attributes)) {
            if (attr.name.startsWith('data-') && attr.value) vals.push(attr.value.toLowerCase());
          }
        };
        collect(el);
        el.querySelectorAll('*').forEach(collect);
        return vals;
      }).catch(() => []);

      const text = (await card.innerText().catch(() => '')).toLowerCase();

      // Human-readable label: prefer img alt, then aria-label, then first line of text
      const rawLabel = alts.find(a => a.length > 1)
        ?? ariaLabels.find(a => a.length > 1)
        ?? text.slice(0, 40);

      const detectedBy = alts.some(a => a.includes(nameLower))         ? 'img-alt'
        : srcs.some(s => s.includes(nameLower))                        ? 'img-src'
        : ariaLabels.some(a => a.includes(nameLower))                  ? 'aria-label'
        : dataAttrs.some(d => d.includes(nameLower))                   ? 'data-attr'
        : text.includes(nameLower)                                     ? 'text'
        : 'other';

      // Verbose per-card debug log so we can see exactly what each card exposes
      console.log(
        `   card[${i + 1}/${total}]: detectedBy="${detectedBy}"` +
        ` | alts=[${alts.slice(0, 3).join(',')}]` +
        ` | srcs=[${srcs.slice(0, 3).map(s => s.split('/').pop()).join(',')}]` +
        ` | aria=[${ariaLabels.slice(0, 2).join(',')}]` +
        ` | data=[${dataAttrs.slice(0, 4).join(',')}]` +
        ` | text="${text.slice(0, 50)}"`
      );

      visible.push({ idx: i, label: rawLabel, detectedBy });
    }

    console.log(`   🃏 ${total} total card(s), ${visible.length} visible, searching for "${insurerName}"`);

    // Try to find the target insurer — no fallback; caller decides what to do if not found
    const targetCard = visible.find(v => v.detectedBy !== 'other') ?? null;

    if (!targetCard) {
      console.log(`   ⚠️  "${insurerName}" not found among ${visible.length} visible card(s)`);
      return { foundTarget: false, selectedName: '' };
    }

    console.log(`   🎯 Found "${insurerName}" at card ${targetCard.idx + 1} via ${targetCard.detectedBy}`);

    const card = cards.nth(targetCard.idx);
    for (const label of ['Buy', 'Select', 'Buy Now', 'Proceed', 'Get Quote', 'Choose']) {
      const btn = card.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${label}" button`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        return { foundTarget: true, selectedName: targetCard.label.slice(0, 40) };
      }
    }

    const primary = card.locator('button.primary-btn, button[class*="primary"]').first();
    if ((await primary.count()) > 0) {
      console.log('   🖱️  Clicking primary-btn in card');
      await primary.scrollIntoViewIfNeeded().catch(() => {});
      await primary.click();
      return { foundTarget: true, selectedName: targetCard.label.slice(0, 40) };
    }

    console.log('   🖱️  Clicking card directly');
    await card.click();
    return { foundTarget: true, selectedName: targetCard.label.slice(0, 40) };
  }
}
