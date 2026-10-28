import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * eSim's JomCheck Enquiry / JomCheck Report records, driven IN THE TEST'S
 * OWN PAGE so the setup is in the run's video — Faizuddin, 2026-10-01: "the
 * eSim must also be open in the same browser as the main testing, so that
 * user can know how the eSim is set up when rewatching the test evidence".
 *
 * Replaces spawning `scripts/eauto-esim` as a child process (a separate,
 * unrecorded browser). Selectors are the same ones that suite uses —
 * `scripts/eauto-esim/pages/EsimPages.ts`, built from
 * `_reference/html/esim/jomcheck-enquiry-edit.html` and
 * `jomcheck-report-edit.html`. Needs the VPN and `ignoreHTTPSErrors`
 * (eSim is served over HTTPS from a bare IP).
 */
export const ESIM_BASE = 'https://172.30.202.114:9089/esim';

const ENTITY_PATH = {
  enquiry: '/jomcheck-enquiry-resp',
  report: '/jomcheck-report-resp',
} as const;

/** Report top-level fields the TS change — saved and restored with the claims.
 *  "Simulator Details Only (No Default)" decides whether blank fields stay
 *  blank ("Yes") or fall back to default data ("No"). */
// "Result" (Success / Failed) is the REPORT record's own — Failed makes a UCD
// purchase pay but fail to generate the report (TS31). Read/restored with the
// other report fields so a test that sets it always puts it back.
// `_reference/html/esim/jomcheck-report-edit-2026-10-05.html`.
export const REPORT_VEHICLE_FIELDS = ['Simulator Details Only (No Default)', 'Possible Total Loss', 'Possible BER', 'Result'] as const;

export interface JomCheckEsimState {
  enquiryResult: string;
  claims: Record<string, string>[];
  /** Vehicle-level fields by label, e.g. { "Possible Total Loss": "Yes" }. Omitted = leave as is. */
  reportFields?: Record<string, string>;
}

export class EsimJomCheckPage extends BasePage {
  constructor(page: Page) { super(page); }

  private claimBlocks = () => this.page.locator('.claim-record');

  private async gotoList(entity: keyof typeof ENTITY_PATH): Promise<void> {
    try {
      await this.page.goto(`${ESIM_BASE}${ENTITY_PATH[entity]}`, { waitUntil: 'domcontentloaded' });
    } catch (err) {
      throw new Error(`Could not reach the e-simulator (172.30.202.114) — the VPN looks disconnected. ${(err as Error).message}`);
    }
    // Not signed in yet: eSim shows its own login form instead of the list.
    if (await this.page.locator('input[name="username"]').isVisible().catch(() => false)) {
      await this.demoHighlight('input[name="username"]');
      await this.page.locator('input[name="username"]').fill(CONFIG.esimUser || 'admin');
      await this.page.locator('input[name="password"]').fill(CONFIG.esimPass || 'admin');
      await this.page.locator('button.login-btn, button[type="submit"]').first().click();
      await this.page.waitForLoadState('domcontentloaded');
      await expect(this.page.locator('aside.sidebar'), 'eSim login failed — wrong credentials, or the VPN is not connected.')
        .toBeVisible({ timeout: 20_000 });
      await this.page.goto(`${ESIM_BASE}${ENTITY_PATH[entity]}`, { waitUntil: 'domcontentloaded' });
    }
    await expect(this.page.locator('#dataTable'), 'eSim list did not render').toBeVisible({ timeout: 20_000 });
  }

  /** Opens the edit form of the record whose "Vn Start With" is exactly `prefix`. */
  private async openRecord(entity: keyof typeof ENTITY_PATH, prefix: string): Promise<void> {
    await this.gotoList(entity);
    await this.demoHighlight('#searchInput');
    await this.page.locator('#searchInput').fill(prefix);
    await this.page.waitForTimeout(600); // client-side filter

    // Search is a substring match and rows are paged by display:none — match
    // the visible rows' "Vn Start With" cell exactly (same as EsimPages.ts).
    const rows = this.page.locator('#dataTable tbody tr').locator('visible=true');
    const hrefs: string[] = [];
    for (let i = 0; i < await rows.count(); i++) {
      const cell = (await rows.nth(i).locator('td').nth(1).innerText()).trim();
      if (cell.toUpperCase() !== prefix.toUpperCase()) continue;
      const href = await rows.nth(i).locator('a[href*="/edit"]').first().getAttribute('href');
      if (href) hrefs.push(href);
    }
    if (hrefs.length !== 1) {
      throw new Error(`Expected exactly 1 eSim ${entity} record with prefix "${prefix}", found ${hrefs.length}.`);
    }
    await this.demoHighlight(this.page.locator(`a[href="${hrefs[0]}"]`));
    await this.page.goto(hrefs[0].startsWith('http') ? hrefs[0] : `https://172.30.202.114:9089${hrefs[0]}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('form[action$="/save"]'), 'eSim edit form did not render').toBeVisible({ timeout: 20_000 });
  }

  /** Top-level field by its label — labels carry for=<input id>, same as EsimPages.inputIdForLabel(). */
  private async topField(label: string) {
    const lbl = this.page.locator(`label.form-label:has(span:text-is("${label}"))`).first();
    const id = await lbl.getAttribute('for');
    if (!id) throw new Error(`eSim field "${label}" not found, or its label has no for= attribute.`);
    return this.page.locator(`#${id}`);
  }

  private resultInput() {
    return this.topField('Result');
  }

  /** Sets a top-level field; returns true if it changed. select: matches option value or label. */
  private async setTopField(label: string, value: string): Promise<boolean> {
    const input = await this.topField(label);
    const tag = await input.evaluate(el => el.tagName.toLowerCase());
    const current = (await input.inputValue()).trim();
    const currentLabel = tag === 'select'
      ? (await input.locator('option:checked').innerText().catch(() => '')).trim()
      : current;
    if (current === value || currentLabel === value) return false;
    await this.demoHighlight(input);
    if (tag === 'select') await input.selectOption(value);
    else await input.fill(value);
    return true;
  }

  private async save(): Promise<void> {
    const btn = this.page.locator('form[action$="/save"] button[type="submit"]');
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/saved successfully/i), 'eSim did not confirm the save.').toBeVisible({ timeout: 20_000 });
    // Saving lands on the record's view page — hold it so the recording shows the saved values.
    await this.demoPause();
  }

  private async readClaims(): Promise<Record<string, string>[]> {
    const out: Record<string, string>[] = [];
    for (let i = 0; i < await this.claimBlocks().count(); i++) {
      const groups = this.claimBlocks().nth(i).locator('.form-group:has(label)');
      const record: Record<string, string> = {};
      for (let j = 0; j < await groups.count(); j++) {
        const field = groups.nth(j).locator('input, select').first();
        if (!(await field.count())) continue;
        // textContent, NOT innerText: innerText applies the label's CSS uppercase, so
        // the saved label ("CLAIMS TYPE (ICAP CODE)") never matched the real one on
        // restore — every eSim restore failed on the 2026-10-01 bulk run.
        const label = ((await groups.nth(j).locator('label').first().textContent()) ?? '').trim();
        const value = (await field.inputValue()).trim();
        if (value) record[label] = value;
      }
      out.push(record);
    }
    return out;
  }

  private async replaceClaims(records: Record<string, string>[]): Promise<void> {
    while (await this.claimBlocks().count() > 0) {
      const remove = this.claimBlocks().first().locator('button:has-text("Remove Record")');
      await this.demoHighlight(remove, { color: 'red' });
      await remove.click();
    }
    const addBtn = this.page.getByRole('button', { name: '+ Add Claim Record' });
    for (const record of records) {
      const before = await this.claimBlocks().count();
      await this.demoHighlight(addBtn);
      await addBtn.click();
      const block = this.claimBlocks().nth(before);
      await block.waitFor({ state: 'visible', timeout: 5000 });
      for (const [label, value] of Object.entries(record)) {
        if (value === '') continue; // blank = leave this claim field empty
        const field = block
          .locator(`.form-group:has(label:text-is("${label}")) input, .form-group:has(label:text-is("${label}")) select`)
          .first();
        if (!(await field.count())) throw new Error(`No eSim claim-record field labelled "${label}".`);
        await this.demoHighlight(field);
        const tag = await field.evaluate(el => el.tagName.toLowerCase());
        if (tag === 'select') await field.selectOption(value);
        else await field.fill(value);
      }
    }
  }

  /** Reads `prefix`'s current Enquiry Result, vehicle-level flags and claim records — the state to restore later. */
  async readState(prefix: string): Promise<JomCheckEsimState> {
    await this.openRecord('enquiry', prefix);
    const enquiryResult = (await (await this.resultInput()).inputValue()).trim();
    await this.demoHighlight(await this.resultInput(), { color: 'green' });
    await this.openRecord('report', prefix);
    const reportFields: Record<string, string> = {};
    for (const label of REPORT_VEHICLE_FIELDS) {
      const input = await this.topField(label);
      reportFields[label] = (await input.inputValue()).trim();
      await this.demoHighlight(input, { color: 'green' });
    }
    const claims = await this.readClaims();
    if (await this.claimBlocks().count()) await this.demoHighlight(this.claimBlocks().first(), { color: 'green' });
    return { enquiryResult, claims, reportFields };
  }

  /** Sets ONLY the JomCheck REPORT record's "Result" dropdown for `prefix`
   *  and saves. Options: "Success" / "Failed" (value = label —
   *  `_reference/html/esim/jomcheck-report-edit-2026-10-05.html`, pasted by
   *  Faizuddin: "the field is literally called 'Result'"). NOT the Enquiry
   *  record's Result (Yes / No = vehicle found). With "Failed", a UCD
   *  purchase pays but the report cannot be generated: UCD shows an error
   *  after Pay Now and the transaction lists as Payment OK / Tx Failed —
   *  TS31's precondition. Returns true if the value changed. */
  async setReportResult(prefix: string, value: 'Success' | 'Failed'): Promise<boolean> {
    await this.openRecord('report', prefix);
    const changed = await this.setTopField('Result', value);
    if (changed) await this.save();
    return changed;
  }

  /** Sets Enquiry Result, the Report's vehicle-level fields, then replaces every claim record. */
  async applyState(prefix: string, state: JomCheckEsimState): Promise<void> {
    await this.openRecord('enquiry', prefix);
    if (state.enquiryResult && await this.setTopField('Result', state.enquiryResult)) await this.save();
    await this.openRecord('report', prefix);
    for (const [label, value] of Object.entries(state.reportFields ?? {})) {
      if (value) await this.setTopField(label, value);
    }
    await this.replaceClaims(state.claims);
    await this.save();
  }
}
