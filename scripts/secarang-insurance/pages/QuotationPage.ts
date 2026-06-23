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

  // Selects a sum insured option on the target insurer's card (before clicking Buy).
  // mode:
  //   "default" — leave the dropdown alone, proceed as-is
  //   "min"     — select index 0 (first / lowest option)
  //   "medium"  — select index 1 (second option); falls back to default if only 2 options
  //   "max"     — select the last option
  // Returns the selected value and how many options were available, or applied=false if skipped.
  async selectSumInsured(
    insurerName: string,
    mode: 'default' | 'min' | 'medium' | 'max',
  ): Promise<{ applied: boolean; selectedValue: string; optionCount: number }> {
    if (mode === 'default') {
      console.log('   ℹ️  Sum insured mode is "default" — leaving as-is');
      return { applied: false, selectedValue: '', optionCount: 0 };
    }

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

      const select = card.locator('.sum-insured select').first();
      if ((await select.count()) === 0 || !(await select.isVisible().catch(() => false))) {
        console.log(`   ℹ️  No sum insured dropdown on "${insurerName}" card — skipping`);
        return { applied: false, selectedValue: '', optionCount: 0 };
      }

      if (await select.isDisabled().catch(() => true)) {
        const locked = await select.evaluate((el: HTMLSelectElement) => el.options[0]?.text ?? '').catch(() => '');
        console.log(`   ℹ️  Sum insured dropdown on "${insurerName}" is disabled (${locked}) — skipping`);
        return { applied: false, selectedValue: locked, optionCount: 1 };
      }

      const options: string[] = await select.evaluate(
        (el: HTMLSelectElement) => Array.from(el.options).map(o => o.value)
      );
      const count = options.length;

      if (count <= 1) {
        console.log(`   ℹ️  Sum insured dropdown has only ${count} option(s) — skipping`);
        return { applied: false, selectedValue: options[0] ?? '', optionCount: count };
      }

      let targetIndex: number;
      if (mode === 'min') {
        targetIndex = 0;
      } else if (mode === 'max') {
        targetIndex = count - 1;
      } else {
        // medium: always index 1 (deterministic, not first or last)
        if (count === 2) {
          console.log(`   ℹ️  Only 2 sum insured options — "medium" falls back to default (no change)`);
          return { applied: false, selectedValue: options[0], optionCount: count };
        }
        targetIndex = 1;
      }

      const targetValue = options[targetIndex];

      // Snapshot the current displayed price so we can detect when it updates
      const priceEl     = card.locator('h6.mb-0').filter({ hasText: /RM/ }).first();
      const priceBefore = (await priceEl.innerText().catch(() => '')).trim();

      console.log(`   💰 Sum insured "${mode}" → index ${targetIndex} of ${count} (value: ${targetValue})`);
      await select.selectOption({ index: targetIndex });

      // Wait for the price element to reflect the new value rather than using a fixed delay
      if (priceBefore) {
        console.log(`   ⏳ Waiting for price to update from "${priceBefore}"…`);
        const updated = await this.poll(async () => {
          const cur = (await priceEl.innerText().catch(() => priceBefore)).trim();
          return cur !== priceBefore;
        }, 15_000);
        const priceAfter = (await priceEl.innerText().catch(() => '')).trim();
        if (updated) {
          console.log(`   ✅ Price updated: ${priceBefore} → ${priceAfter}`);
        } else {
          console.log(`   ⚠️  Price did not change within 15s — proceeding anyway (still showing ${priceAfter})`);
        }
      } else {
        // Could not read price element — fall back to network idle
        await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
          console.log('   ⚠️  Network idle timeout after sum insured change — proceeding');
        });
      }
      await this.wait(300); // brief settle before screenshot

      return { applied: true, selectedValue: targetValue, optionCount: count };
    }

    console.log(`   ℹ️  "${insurerName}" card not found for sum insured selection — skipping`);
    return { applied: false, selectedValue: '', optionCount: 0 };
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
