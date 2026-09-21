import { expect, type Page } from '@playwright/test';
import { CONFIG, ENTITIES, ESIM_BASE, type EntityKey } from '../data/config';

const step = (m: string) => console.log(`[step] ${m}`);

export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(): Promise<void> {
    step(`Signing in to eSIM as ${CONFIG.username}`);
    await this.page.goto(`${ESIM_BASE}/login`, { waitUntil: 'domcontentloaded' });

    await this.page.locator('input[name="username"]').fill(CONFIG.username);
    await this.page.locator('input[name="password"]').fill(CONFIG.password);
    await this.page.locator('button.login-btn, button[type="submit"]').first().click();

    // A failed login re-renders the same /esim/login form rather than erroring.
    await this.page.waitForLoadState('domcontentloaded');
    await expect(
      this.page.locator('aside.sidebar'),
      'eSIM login did not reach the app shell — wrong credentials, or the VPN is not connected.',
    ).toBeVisible({ timeout: 20_000 });
    step('Signed in');
  }
}

export class EntityListPage {
  constructor(private readonly page: Page, private readonly entity: EntityKey) {}

  private rows = () => this.page.locator('#dataTable tbody tr');

  async open(): Promise<void> {
    const { path, label } = ENTITIES[this.entity];
    step(`Opening ${label}`);
    await this.page.goto(`${ESIM_BASE}${path}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('#dataTable'), `${label} table did not render`).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Find the record for a vehicle prefix and return its edit URL.
   *
   * The list is paginated at 10 rows but every record is already in the DOM —
   * #searchInput filters client-side by toggling `display:none`, so searching
   * reaches records that pagination hides. Rows must therefore be matched on
   * VISIBILITY, not on presence.
   */
  async findEditUrl(prefix: string): Promise<string> {
    step(`Searching for prefix "${prefix}"`);
    await this.page.locator('#searchInput').fill(prefix);
    await this.page.waitForTimeout(600); // client-side filter is synchronous but debounced by keystroke

    const visible = this.rows().locator('visible=true');
    const count = await visible.count();

    // The search is a substring match, so "AB" also surfaces "ABC". Narrow to an
    // exact match on the Vn Start With cell before deciding.
    const matches: { prefix: string; href: string }[] = [];
    for (let i = 0; i < count; i++) {
      const row = visible.nth(i);
      const cell = (await row.locator('td').nth(1).innerText()).trim();
      const href = await row.locator('a[href*="/edit"]').first().getAttribute('href');
      if (href) matches.push({ prefix: cell, href });
    }

    const exact = matches.filter(m => m.prefix.toUpperCase() === prefix.toUpperCase());

    if (exact.length === 0) {
      const near = matches.map(m => m.prefix).join(', ') || 'nothing';
      throw new Error(
        `No record with Vn Start With exactly "${prefix}" in ${ENTITIES[this.entity].label}. ` +
        `The search surfaced: ${near}. Create the prefix in eSIM first, or check the spelling.`,
      );
    }
    if (exact.length > 1) {
      throw new Error(
        `${exact.length} records share the prefix "${prefix}" — refusing to guess which to edit. ` +
        'Remove the duplicate in eSIM first.',
      );
    }

    step(`Found "${prefix}" → ${exact[0].href}`);
    return exact[0].href;
  }

}

export class EntityEditPage {
  constructor(private readonly page: Page) {}

  async open(editUrl: string): Promise<void> {
    const url = editUrl.startsWith('http') ? editUrl : `https://172.30.202.114:9089${editUrl}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('form[action$="/save"]'), 'Edit form did not render').toBeVisible({ timeout: 20_000 });
  }

  /**
   * Resolve a visible field label to its input id via the label's `for`.
   * Matching on the label rather than a hardcoded id means the same code works
   * for entities whose form HTML has not been captured — and a renamed field
   * fails loudly here instead of silently writing nothing.
   */
  private async inputIdForLabel(label: string): Promise<string> {
    const lbl = this.page.locator(`label.form-label:has(span:text-is("${label}"))`).first();
    if (!(await lbl.count())) {
      const seen = (await this.page.locator('label.form-label span').first().isVisible().catch(() => false))
        ? (await this.page.locator('label.form-label > span:not(.required)').allInnerTexts()).map(s => s.trim()).join(', ')
        : '(none found)';
      throw new Error(`No field labelled "${label}" on this form.\nFields present: ${seen}`);
    }
    const id = await lbl.getAttribute('for');
    if (!id) throw new Error(`The "${label}" label has no for= attribute, so its input cannot be resolved.`);
    return id;
  }

  /**
   * Every field on the form as label→current value, in form order.
   *
   * Reads straight off the edit form rather than the view page, so what comes
   * back is exactly what a write would be editing — same labels, same values.
   */
  async readAllFields(): Promise<{ label: string; value: string }[]> {
    const labels = this.page.locator('label.form-label');
    const out: { label: string; value: string }[] = [];

    for (let i = 0; i < await labels.count(); i++) {
      const lbl = labels.nth(i);
      const id = await lbl.getAttribute('for');
      if (!id) continue;
      // The visible name is the first span; the second is the "*" marker.
      const name = (await lbl.locator('span').first().innerText()).trim();
      const value = (await this.page.locator(`#${id}`).inputValue()).trim();
      out.push({ label: name, value });
    }
    return out;
  }

  /** Apply label→value. Only the given fields are touched. Returns before/after. */
  async applyChanges(changes: Record<string, string>): Promise<{ label: string; from: string; to: string }[]> {
    const applied: { label: string; from: string; to: string }[] = [];

    for (const [label, value] of Object.entries(changes)) {
      const id = await this.inputIdForLabel(label);
      const field = this.page.locator(`#${id}`);
      const before = (await field.inputValue()).trim();
      // `.fill()` only works on <input>/<textarea> — some entities (e.g. Dereg
      // Precheck's Y/N/NA fields) use a plain <select> instead, which needs
      // `.selectOption()`. Branch on the actual tag rather than assuming.
      const tag = await field.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') {
        await field.selectOption(value);
      } else {
        await field.fill(value);
      }
      applied.push({ label, from: before || '(empty)', to: value });
      step(`${label}: "${before || '(empty)'}" → "${value}"`);
    }
    return applied;
  }

  /**
   * Save, and confirm it took.
   *
   * Saving lands on the record's **view** page — `/<entity>/<id>/view`, showing
   * "… saved successfully." and a Record Details block with every field. It does
   * NOT return to the list. That page is also all the proof needed, so there is
   * no going back to the list to re-search.
   */
  async save(): Promise<void> {
    step('Saving');
    await this.page.locator('form[action$="/save"] button[type="submit"]').click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(
      this.page.getByText(/saved successfully/i),
      'eSIM did not confirm the save — the record may not have changed.',
    ).toBeVisible({ timeout: 20_000 });
    step('Saved');
  }

  /** Whole-page text of the view page reached after saving, for spot-checking
   *  that a new value really is on the record. */
  async viewPageText(): Promise<string> {
    return (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
  }
}
