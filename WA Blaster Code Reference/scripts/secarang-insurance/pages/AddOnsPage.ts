import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AddOnsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async waitForPage(): Promise<boolean> {
    const appeared = await this.poll(async () => {
      const t = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
      return /add.?on|extra cover|optional cover|additional benefit/i.test(t);
    });
    if (!appeared) {
      console.log('   ℹ️  Add-ons page did not load — skipping add-ons');
      return false;
    }
    await this.wait(1000);
    return true;
  }

  private async waitForCards(): Promise<boolean> {
    const appeared = await this.poll(
      async () => (await this.page.locator('.addon-card').count()) > 0,
      10_000,
    );
    if (!appeared) {
      console.log('   ℹ️  No add-on cards found — skipping add-ons');
    }
    return appeared;
  }

  /**
   * Uncheck add-ons that are ticked by default on the site but should NOT be selected.
   * Looks for a REMOVE / Deselect / Uncheck button on the matching card.
   */
  async uncheckNamedAddons(targets: string[]): Promise<void> {
    if (!targets.length) return;

    // Wait for cards to load before attempting to uncheck
    await this.poll(
      async () => (await this.page.locator('.addon-card').count()) > 0,
      15_000,
    );
    await this.wait(500);

    const allCards   = this.page.locator('.addon-card');
    const totalCards = await allCards.count();

    for (const target of targets) {
      const targetLower = target.toLowerCase();
      let unchecked = false;

      for (let i = 0; i < totalCards; i++) {
        const card = allCards.nth(i);
        if (!(await card.isVisible().catch(() => false))) continue;

        const text = (await card.innerText().catch(() => '')).toLowerCase();
        if (!text.includes(targetLower)) continue;

        // Look for a removal button — site uses REMOVE, Remove, Deselect, etc.
        for (const label of ['REMOVE', 'Remove', 'Deselect', 'Uncheck', 'DELETE', 'Delete']) {
          const btn = card.locator(`button:has-text("${label}")`).first();
          if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
            console.log(`   ➖ Unchecking "${target}" (clicking "${label}")`);
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await btn.click();
            await this.wait(800);
            unchecked = true;
            break;
          }
        }

        if (!unchecked) {
          console.log(`   ℹ️  "${target}" card found but no REMOVE button — may already be unchecked or button label unknown`);
        }
        break;
      }

      if (!unchecked) {
        console.log(`   ⚠️  Could not uncheck "${target}" — card not found or no removal button`);
      }
    }
  }

  /**
   * Try to find and click ADD for each name in `targets`.
   * Returns an object describing which add-ons were found/clicked and which were not listed.
   * Never throws — missing add-ons are reported as "not listed" and the flow continues.
   */
  async selectNamedAddons(targets: string[]): Promise<{
    found:    string[];
    notFound: string[];
  }> {
    const found:    string[] = [];
    const notFound: string[] = [];

    if (!targets.length) {
      console.log('   ℹ️  No add-ons configured — skipping');
      return { found, notFound };
    }

    const pageLoaded = await this.waitForPage();
    if (!pageLoaded) {
      notFound.push(...targets);
      return { found, notFound };
    }

    const cardsLoaded = await this.waitForCards();
    if (!cardsLoaded) {
      notFound.push(...targets);
      return { found, notFound };
    }

    const allCards  = this.page.locator('.addon-card');
    const totalCards = await allCards.count();
    console.log(`   📦 ${totalCards} add-on card(s) visible`);

    for (const target of targets) {
      const targetLower = target.toLowerCase();
      let matched = false;

      for (let i = 0; i < totalCards; i++) {
        const card = allCards.nth(i);
        if (!(await card.isVisible().catch(() => false))) continue;

        const text = (await card.innerText().catch(() => '')).toLowerCase();
        if (!text.includes(targetLower)) continue;

        const addBtn = card.locator('button:has-text("ADD"), button:has-text("Add")').first();
        if ((await addBtn.count()) > 0 && await addBtn.isVisible().catch(() => false)) {
          console.log(`   ➕ Clicking ADD for "${target}"`);
          await addBtn.scrollIntoViewIfNeeded().catch(() => {});
          await addBtn.click();
          await this.wait(800);
          found.push(target);
          matched = true;
          break;
        } else {
          // Card found but no ADD button (already added or unavailable)
          console.log(`   ℹ️  "${target}" card found but no ADD button — may already be selected`);
          found.push(target);
          matched = true;
          break;
        }
      }

      if (!matched) {
        console.log(`   ⚠️  "${target}" not listed for this insurer`);
        notFound.push(target);
      }
    }

    console.log(`   ✅ Add-ons: ${found.length} found, ${notFound.length} not listed`);
    return { found, notFound };
  }

  /**
   * Legacy method: select the first `count` simple add-ons (no named targeting).
   * Does not throw — if the page or cards are not found, it returns gracefully.
   */
  async waitAndAddSimple(count = 2): Promise<void> {
    const pageLoaded = await this.waitForPage();
    if (!pageLoaded) return;

    const cardsLoaded = await this.waitForCards();
    if (!cardsLoaded) return;

    const allCards = this.page.locator('.addon-card');
    const totalCards = await allCards.count();
    const visible: number[] = [];
    for (let i = 0; i < totalCards; i++) {
      if (await allCards.nth(i).isVisible().catch(() => false)) visible.push(i);
    }

    console.log(`   📦 ${visible.length} visible add-on card(s) — targeting first ${count} simple ones`);

    let added = 0;
    for (let n = 0; n < visible.length && added < count; n++) {
      const card = allCards.nth(visible[n]);
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
    // Not finding a Continue button is non-fatal — the page may have auto-advanced
    console.log('   ℹ️  Continue button not found on add-ons page — page may have auto-advanced');
  }

  async handleReminderPopup(): Promise<void> {
    await this.wait(1500);

    const popupSels = [
      'app-info-modal', 'mat-dialog-container', '[role="dialog"]',
      '.modal-content', '.modal', 'app-modal', '.dialog',
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

    if (!modal) { console.log('   ℹ️  No popup detected — continuing'); return; }

    const popupText = this.clean(await modal.innerText().catch(() => ''));
    console.log(`   💬 Popup text: "${popupText.slice(0, 200)}"`);

    for (const label of ['Proceed', 'Continue', 'OK', 'Ok', 'Confirm', 'Yes', 'Accept']) {
      const btn = modal.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Popup: clicking "${label}"`);
        await btn.click();
        await this.wait(1000);
        return;
      }
    }

    const any = modal.locator('button').last();
    if ((await any.count()) > 0) {
      const label = this.clean(await any.textContent().catch(() => '') || 'button');
      console.log(`   🖱️  Popup fallback: clicking "${label}"`);
      await any.click();
      await this.wait(1000);
    }
  }
}
