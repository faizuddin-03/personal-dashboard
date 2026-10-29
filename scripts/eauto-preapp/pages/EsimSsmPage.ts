import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG, USERS } from '../data/config';
import { clonePeople, forceTags, rebrand, PEOPLE_FIELD, PROFILE_FIELD, type Person, type SsmType } from '../utils/ssmXml';

// eSIM SSM seeding through the eSIM screens — the same two rows Faizuddin's
// company was seeded with by hand on 2026-10-21 (enquiry #278, ROC submission
// #173). Recipe: knowledge/esim.md § "SSM — seeding a company for UCD
// onboarding". Captures: _reference/html/esim/ssm-*.html.
//
// Azila's 12341 robot talks to a JHipster REST API (`/esim/api/...`) that was
// never verified; the captured eSIM is server-rendered forms
// (`form[action="/esim/ssm-enquiry-resp/save"]`), so this drives the forms.

const ITEM_TYPE: Record<SsmType, string> = { ROC: 'C', ROB: 'B', LLP: 'L' };
const LIST_PATH: Record<SsmType, string> = {
  ROC: '/esim/ssm-roc-submission-resp',
  ROB: '/esim/ssm-rob-submission-resp',
  LLP: '/esim/ssm-llp-submission-resp',
};
const ENQUIRY_PATH = '/esim/ssm-enquiry-resp';

export interface SeedInput {
  type: SsmType;
  /** Old BRN as the dealer types it, e.g. KT0307773-P. */
  oldBrn: string;
  newBrn: string;
  companyName: string;
  director: Person;
  remark: string;
}

export interface SeedResult {
  enquiry: 'created' | 'updated';
  submission: 'created' | 'updated';
  donorId: string;
  warnings: string[];
}

/** "KT0307773-P" → roc "KT0307773", checkDigit "P". No dash → no check digit. */
export function splitBrn(oldBrn: string): { roc: string; checkDigit: string } {
  const m = /^(.*?)-([A-Z])$/i.exec(oldBrn.trim());
  return m ? { roc: m[1].toUpperCase(), checkDigit: m[2].toUpperCase() } : { roc: oldBrn.trim().toUpperCase(), checkDigit: '' };
}

export class EsimSsmPage extends BasePage {
  constructor(page: Page) { super(page); }

  private origin(): string { return new URL(CONFIG.esimUrl).origin; }

  async login(): Promise<void> {
    if (!USERS.esim.password) throw new Error('eSIM password is blank — type it on the dashboard (eSIM section).');
    await this.page.goto(`${CONFIG.esimUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(e => {
      throw new Error(`eSIM did not answer at ${CONFIG.esimUrl} — is the VPN connected? (${(e as Error).message})`);
    });
    const user = this.page.locator('input[name="username"]');
    await this.demoHighlight(user);
    await user.fill(USERS.esim.username);
    await this.page.locator('input[name="password"]').fill(USERS.esim.password);
    const btn = this.page.locator('button.login-btn, button[type="submit"]').first();
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.waitForURL(u => !/\/login/.test(u.pathname), { timeout: 30_000 }).catch(() => {
      throw new Error('eSIM login did not reach the app shell — wrong credentials, or the VPN is not connected.');
    });
    console.log(`DETAIL: eSIM signed in as ${USERS.esim.username}`);
  }

  /** Open a list page from the eSIM sidebar, the way a person does. */
  private async openList(path: string): Promise<void> {
    const link = this.page.locator(`a[href="${path}"]`).first();
    if (await link.count()) {
      // The sidebar opens the current page's group by itself a moment after load.
      // Checking too early and clicking "SSM" then closed it again (12257_TS1,
      // 2026-10-22: ROC list → SSM Enquiry timed out). Wait for the page to settle,
      // and click the group heading only while the link is still hidden.
      await this.page.waitForLoadState('load').catch(() => undefined);
      const shown = () => link.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
      for (let i = 0; i < 3 && !(await shown()); i++) {
        await this.page.locator('button.sidebar-group-toggle', { hasText: /ssm/i }).first().click().catch(() => undefined);
      }
      await this.demoHighlight(link);
      await link.click();
    } else {
      // Not on an eSIM page yet (first call straight after login lands on the shell).
      await this.page.goto(this.origin() + path, { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForURL(u => u.pathname.replace(/\/+$/, '') === path, { timeout: 60_000 });
    await this.page.locator('table tbody').first().waitFor({ state: 'attached', timeout: 60_000 });
    await this.waitForAllRows();
  }

  /**
   * Wait until every row is on the page. The list header says "<span id=recordCount>N</span>
   * records" and the rows fill in after it; reading too early saw 2 of 125 rows and missed
   * the donor (12257_TS2, 2026-10-22). Without a count, wait for the row count to hold still.
   */
  private async waitForAllRows(): Promise<void> {
    const count = () => this.page.evaluate(() => ({
      want: Number((document.querySelector('#recordCount')?.textContent || '').replace(/\D/g, '')) || -1,
      have: document.querySelectorAll('table tbody tr').length,
    })).catch(() => ({ want: -1, have: 0 }));
    const until = Date.now() + 60_000;
    let last = -1, steady = 0;
    while (Date.now() < until) {
      const { want, have } = await count();
      if (want >= 0 && have >= want) return;
      if (want < 0) { steady = have === last ? steady + 1 : 0; last = have; if (steady >= 3) return; }
      await this.page.waitForTimeout(500);
    }
    const { want, have } = await count();
    throw new Error(`eSIM list ${this.page.url()} shows ${have} of ${want} rows after 60 s — the page did not finish loading.`);
  }

  /** Rows of the current list as { id, cells[] }. Every row is on one page (client-side pager). */
  private async rows(): Promise<{ id: string; cells: string[] }[]> {
    return this.page.evaluate(() =>
      Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => (td.textContent || '').replace(/\s+/g, ' ').trim());
        return { id: cells[0] || '', cells };
      }),
    );
  }

  /** Read every named field of the open edit form. Reading only. */
  private async readForm(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const out: Record<string, string> = {};
      const form = document.querySelector('form[action$="/save"]');
      if (!form) return out;
      for (const el of Array.from(form.querySelectorAll('input[name], textarea[name], select[name]'))) {
        const e = el as HTMLInputElement;
        if (e.type === 'hidden') continue;
        out[e.name] = e.value ?? '';
      }
      return out;
    });
  }

  /** Type every value into the open form (fill = typing; select = choosing), then Save. */
  private async writeForm(values: Record<string, string>): Promise<void> {
    const form = this.page.locator('form[action$="/save"]');
    await expect(form, 'eSIM form did not render').toBeVisible({ timeout: 30_000 });
    for (const [name, value] of Object.entries(values)) {
      const field = form.locator(`[name="${name}"]`).first();
      if (!(await field.count())) { console.log(`   ⚠️ eSIM form has no field "${name}" — skipped`); continue; }
      const tag = await field.evaluate(e => e.tagName.toLowerCase());
      if (tag === 'select') {
        if (value) await field.selectOption(value);
      } else {
        await field.fill(value);
      }
    }
    const save = form.locator('button[type="submit"]').first();
    await this.demoHighlight(save);
    await save.click();
    await expect(this.page.getByText(/saved successfully/i).first(), 'eSIM did not confirm the save').toBeVisible({ timeout: 30_000 });
  }

  private async openEdit(listPath: string, id: string): Promise<void> {
    const edit = this.page.locator(`a[href="${listPath}/${id}/edit"]`).first();
    await this.demoHighlight(edit);
    await edit.click();
    await this.page.locator('form[action$="/save"]').waitFor({ state: 'visible', timeout: 30_000 });
  }

  private async openNew(listPath: string): Promise<void> {
    const btn = this.page.locator(`a[href="${listPath}/new"]`).first();
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.locator('form[action$="/save"]').waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Rows whose ROC or New ROC column equals the keys (ROC col 2, New ROC col 3 in both lists). */
  private matching(rows: { id: string; cells: string[] }[], roc: string, newRoc: string) {
    return rows.filter(r => r.cells[2]?.toUpperCase() === roc || r.cells[3] === newRoc);
  }

  /**
   * eSIM is shared by every tester. An existing row for this company is reused
   * (overwritten) only when its remark shows one of our runs made it
   * ("UDIN QA …", the remark seed() writes) — Faizuddin, 2026-10-22: never edit
   * another person's SSM details. Opens each matching row read-only (no Save).
   * Returns "" when there are no rows or all are ours, else which row is not.
   */
  async foreignRow(type: SsmType, oldBrn: string, newBrn: string): Promise<string> {
    const { roc } = splitBrn(oldBrn);
    const newRoc = newBrn.replace(/\D/g, '');
    for (const [what, list] of [['SSM Enquiry', ENQUIRY_PATH], [`${type} submission`, LIST_PATH[type]]] as const) {
      await this.openList(list);
      const ids = this.matching(await this.rows(), roc, newRoc).map(r => r.id);
      for (const id of ids) {
        await this.openEdit(list, id);
        const remark = ((await this.readForm()).remark ?? '').trim();
        if (!/^UDIN QA\b/i.test(remark)) return `${what} row #${id} (remark "${remark || 'blank'}")`;
        await this.openList(list);
      }
    }
    return '';
  }

  /** Seed (or update) both SSM rows for one company. */
  async seed(input: SeedInput): Promise<SeedResult> {
    const { roc, checkDigit } = splitBrn(input.oldBrn);
    const newRoc = input.newBrn;
    const warnings: string[] = [];

    // ── 1. SSM Enquiry row (code 004) ──
    await this.openList(ENQUIRY_PATH);
    const enqRows = this.matching(await this.rows(), roc, newRoc);
    if (enqRows.length > 1) {
      throw new Error(`eSIM SSM Enquiry already has ${enqRows.length} rows for ${roc} / ${newRoc} (ids ${enqRows.map(r => r.id).join(', ')}) — the lookup would be ambiguous. Remove the extras in eSIM first.`);
    }
    const enquiryAction = enqRows.length ? 'updated' : 'created';
    if (enqRows.length) await this.openEdit(ENQUIRY_PATH, enqRows[0].id); else await this.openNew(ENQUIRY_PATH);
    await this.writeForm({
      responseCode: '004',
      roc,
      newRoc,
      companyName: input.companyName,
      itemType: ITEM_TYPE[input.type],
      remark: input.remark,
      delayMiliSeconds: '0',
      checkDigit,
    });
    console.log(`DETAIL: eSIM SSM Enquiry row ${enquiryAction} — ROC ${roc}, check digit "${checkDigit || '(none)'}", New ROC ${newRoc}, item type ${ITEM_TYPE[input.type]}`);

    // ── 2. Submission row (code 005), cloned from a donor ──
    const listPath = LIST_PATH[input.type];
    await this.openList(listPath);
    const subRows = await this.rows();
    const donorId = CONFIG.esimDonor[input.type] || this.pickDonor(subRows, roc, newRoc);
    if (!donorId || !subRows.some(r => r.id === donorId)) {
      throw new Error(`No donor row to copy for ${input.type} (configured "${CONFIG.esimDonor[input.type]}"). Set EPREAPP_ESIM_DONOR_${input.type} to a good row id on the dashboard.`);
    }
    await this.openEdit(listPath, donorId);
    const donor = await this.readForm();
    const peopleField = PEOPLE_FIELD[input.type];
    if ((donor[peopleField] || '').trim().length < 50) {
      throw new Error(`Donor ${input.type} row #${donorId} has no "${peopleField}" people block to copy.`);
    }
    console.log(`DETAIL: eSIM donor ${input.type} submission row #${donorId} read (${Object.keys(donor).length} fields)`);

    const from = { roc: donor.roc || '', newRoc: donor.newRoc || '', companyName: donor.companyName || '' };
    const to = { roc, newRoc, companyName: input.companyName };
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(donor)) values[k] = rebrand(v, from, to);
    Object.assign(values, {
      responseCode: '005', roc, newRoc, companyName: input.companyName,
      remark: input.remark, delayMiliSeconds: '0', checkDigit,
    });
    const refNo = checkDigit ? `${roc}-${checkDigit}` : roc;
    const profile = PROFILE_FIELD[input.type];
    if (profile && values[profile] !== undefined) {
      values[profile] = input.type === 'ROC'
        ? forceTags(values[profile], { NAME: input.companyName, REF_NO: refNo, NEW_REF_NO: newRoc, ROC_STATUS: 'EXISTING' }, profile, warnings)
        : forceTags(values[profile], { BUSINESS_REF_NO: refNo, NEW_REF_NO: newRoc, ROB_STATUS: 'ACTIVE' }, profile, warnings);
    }
    values[peopleField] = clonePeople(values[peopleField], [input.director], input.type, peopleField);

    // Back to the list (sidebar click), then edit the company's own row or create one.
    await this.openList(listPath);
    const own = this.matching(await this.rows(), roc, newRoc);
    if (own.length > 1) throw new Error(`${input.type} submission already has ${own.length} rows for ${roc} — remove the extras in eSIM first.`);
    const submissionAction = own.length ? 'updated' : 'created';
    if (own.length) await this.openEdit(listPath, own[0].id); else await this.openNew(listPath);
    await this.writeForm(values);
    console.log(`DETAIL: eSIM ${input.type} submission row ${submissionAction} — director ${input.director.name}, cloned from #${donorId}`);
    for (const w of warnings) console.log(`   ⚠️ ${w}`);
    await this.captureEvidence('esim-ssm-submission-saved');
    return { enquiry: enquiryAction, submission: submissionAction, donorId, warnings };
  }

  /** No configured donor: the first row whose remark mentions Azila, else the lowest id
   *  that is not the company's own row. [unconfirmed — ROB/LLP never seeded by hand] */
  private pickDonor(rows: { id: string; cells: string[] }[], roc: string, newRoc: string): string {
    const others = rows.filter(r => r.cells[2]?.toUpperCase() !== roc && r.cells[3] !== newRoc);
    return (others.find(r => r.cells.some(c => /azila/i.test(c))) ?? others[0])?.id ?? '';
  }
}
