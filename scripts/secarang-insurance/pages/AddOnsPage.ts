import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AddOnsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitAndAddSimple(count = 2): Promise<void> {
    // Step 1: wait for page text to confirm we're on the add-ons page
    const textAppeared = await this.poll(async () => {
      const t = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
      return /add.?on|extra cover|optional cover|additional benefit/i.test(t);
    });

    if (!textAppeared) throw new Error('Add-ons page did not load');

    // Step 2: wait an extra second for Angular to render the card components
    await this.wait(1000);

    // Step 3: now wait specifically for .addon-card elements to appear
    const cardsAppeared = await this.poll(async () =>
      (await this.page.locator('.addon-card').count()) > 0, 10_000);

    if (!cardsAppeared) throw new Error('Add-on cards did not render after page load');

    const allCards = this.page.locator('.addon-card');
    const totalCards = await allCards.count();

    const visibleCards: number[] = [];
    for (let i = 0; i < totalCards; i++) {
      if (await allCards.nth(i).isVisible().catch(() => false)) visibleCards.push(i);
    }

    console.log(`   📦 ${visibleCards.length} visible add-on card(s) — targeting first ${count} simple ones`);

    let added = 0;
    for (let n = 0; n < visibleCards.length && added < count; n++) {
      const card = allCards.nth(visibleCards[n]);

      // Skip cards with sub-options (dropdowns/selects inside) — they need extra interaction
      const hasSubOptions = (await card.locator('select, input[type="radio"], input[type="number"]').count()) > 0;
      if (hasSubOptions) {
        console.log(`   ⏭️  Card ${n + 1} has sub-options — skipping`);
        continue;
      }

      const addBtn = card.locator('button:has-text("ADD"), button:has-text("Add")').first();
      if ((await addBtn.count()) > 0 && await addBtn.isVisible().catch(() => false)) {
        console.log(`   ➕ ADD on card ${n + 1}`);
        await addBtn.scrollIntoViewIfNeeded().catch(() => {});
        await addBtn.click();
        await this.wait(1000);
        added++;
      } else {
        console.log(`   ⚠️  No ADD button on card ${n + 1} — skipping`);
      }
    }
    console.log(`   ✅ Added ${added} add-on(s)`);

    await this.wait(1000);
  }

  async continue(): Promise<void> {
    // Click Continue / Proceed
    for (const label of ['Continue', 'Proceed', 'Next', 'Add to Cart', 'Confirm']) {
      const btn = this.page.locator(`button:has-text("${label}")`).last();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Add-ons: clicking "${label}"`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        await this.wait(1000);
        return;
      }
    }
    throw new Error('Continue button not found on add-ons page');
  }

  async handleReminderPopup(): Promise<void> {
    // Give the popup a moment to appear
    await this.wait(1500);

    const popupSels = [
      'app-info-modal',
      'mat-dialog-container',
      '[role="dialog"]',
      '.modal-content',
      '.modal',
      'app-modal',
      '.dialog',
    ];

    let modal = null;
    for (const sel of popupSels) {
      const loc = this.page.locator(sel).first();
      if ((await loc.count()) > 0 && await loc.isVisible().catch(() => false)) {
        modal = loc;
        console.log(`   💬 Popup found via "${sel}"`);
        break;
      }
    }

    if (!modal) {
      console.log('   ℹ️  No popup detected — continuing');
      return;
    }

    const popupText = this.clean(await modal.innerText().catch(() => ''));
    console.log(`   💬 Popup text: "${popupText.slice(0, 200)}"`);

    // Prefer "Proceed" first (the Reminder modal uses this)
    for (const label of ['Proceed', 'Continue', 'OK', 'Ok', 'Confirm', 'Yes', 'Accept']) {
      const btn = modal.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Popup: clicking "${label}"`);
        await btn.click();
        await this.wait(1000);
        return;
      }
    }

    // Fallback: click the last/primary button in the modal
    const any = modal.locator('button').last();
    if ((await any.count()) > 0) {
      const label = this.clean(await any.textContent().catch(() => '') || 'button');
      console.log(`   🖱️  Popup fallback: clicking "${label}"`);
      await any.click();
      await this.wait(1000);
    }
  }
}
