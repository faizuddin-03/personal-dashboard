import { Page } from '@playwright/test';
import * as path from 'node:path';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { settleObs, confirmObsDialog, submitUntilConfirmed, visibleFormStep, type FormStep } from './ObsShared';

// Dealer Application form — the signed link `/obs/form/<uuid>?id=<oldBRN>&s=…&v=1`
// (no reCAPTCHA). Ported from Azila's application.page.ts; handles confirmed
// on the 2026-10-21 walk-through (captures obs-application-step1..5-*.html).
//
//   1 Business Information  #tinNo (locked when carried), #isNoAssociation1, #to-next-step
//   2 Upload Files          every file input is hidden; its "Browse Files..." button is the
//                           input's preceding sibling — clicked, and the file chooser answered
//   3 Acknowledgement       #directorNameDropdown (SSM) or #directorNameInput/#directorMyKad
//                           (trading), #directorMobile, #directorEmail, #picMyKad,
//                           #eInvoicePersonInCharge, #to-submit
//   4 Registration Docs     6 required uploads (incl. LHDN cert, not in the TS), #to-submit
//   5 Payment               see PaymentPage (#to-submit-and-pay)
// Every Next / Submit raises "Unsaved Changes" → "Save & Continue" first.

const STEP4_UPLOADS = [
  'upload-rhb-offer-letter-input',
  'upload-rhb-direct-debit-input',
  'upload-rhb-bod-reso-input',    // Sdn Bhd
  'upload-rhb-loa-input',         // Sole Prop / Partnership: "RHB LoA e-TukarMilik" (12153_TS02, 2026-10-23)
  'upload-rhb-bank-statement-input',
  'upload-eauto-bod-reso-input',  // Sdn Bhd
  'upload-eauto-loa-input',       // Sole Prop / Partnership: "eAuto LoA e-TukarMilik"
  'upload-lhdn-tax-cert-input',
];

export interface ApplicationDetails {
  tin: string;
  directorName: string;
  directorIc: string;
  directorMobile: string;
  directorEmail: string;
}

export class ApplicationPage extends BasePage {
  constructor(page: Page) { super(page); }

  private file(name: string): string { return path.join(CONFIG.fixtures.dir, name); }

  /** Open the signed link (TS continuation steps 2, 6, 8 — "open / refresh the Application Link"). */
  async open(link: string): Promise<FormStep | 0> {
    await this.page.goto(link, { waitUntil: 'commit', timeout: CONFIG.navigationTimeout });
    await settleObs(this.page);
    await this.poll(async () => (await visibleFormStep(this.page)) !== 0 || /Payment Success/i.test(await this.bodyText()), 30_000);
    const step = await visibleFormStep(this.page);
    console.log(`DETAIL: Application Link opened on step ${step || '(receipt)'}`);
    return step;
  }

  async currentStep(): Promise<FormStep | 0> { return visibleFormStep(this.page); }

  /** Press a control until the wanted step shows, clearing "Unsaved Changes → Save & Continue". */
  private async pressUntil(controlId: string, want: FormStep, tries = 5): Promise<void> {
    for (let i = 0; i < tries; i++) {
      if ((await visibleFormStep(this.page)) === want) return;
      const btn = this.page.locator(`#${controlId}:visible`).first();
      await this.demoHighlight(btn);
      await btn.click({ timeout: 15_000 }).catch(() => undefined);
      await this.page.waitForTimeout(1_800);
      const said = await confirmObsDialog(this.page, /^(save & continue|yes|ok|continue|proceed|submit|confirm)$/i);
      if (said) console.log(`DETAIL: Dialog "${said.slice(0, 80)}" — confirmed`);
    }
    if ((await visibleFormStep(this.page)) !== want) {
      await this.captureIssue(`stuck-before-step${want}`, this.page.locator(`#step${want - 1}`), `Could not reach step ${want}`);
      throw new Error(`Never reached step ${want} — the Unsaved Changes cycle did not clear.`);
    }
  }

  /** Upload one file through the input's own "Browse Files..." button. */
  private async upload(inputId: string, file: string): Promise<void> {
    const input = this.page.locator(`#${inputId}`);
    const browse = input.locator('xpath=preceding-sibling::button[1]');
    if (await browse.isVisible().catch(() => false)) {
      await this.demoHighlight(browse);
      const [chooser] = await Promise.all([this.page.waitForEvent('filechooser', { timeout: 15_000 }), browse.click()]);
      await chooser.setFiles(file);
    } else {
      // No visible control to click for this input — the only way a file can reach it.
      await input.setInputFiles(file);
    }
    await this.page.waitForTimeout(600);
  }

  /** Step 1: TIN (typed only when editable) and "No association". */
  async step1(d: ApplicationDetails): Promise<void> {
    const tin = this.page.locator('#tinNo');
    if (await tin.isEditable().catch(() => false)) {
      if (!d.tin) throw new Error('TIN is mandatory on the Application and none was given.');
      await this.demoHighlight(tin);
      await tin.fill(d.tin);
    } else {
      const carried = await tin.inputValue().catch(() => '');
      console.log(`DETAIL: TIN carried over from the Pre-Application: ${carried}`);
    }
    const noAssoc = this.page.locator('#isNoAssociation1');
    if (await noAssoc.isVisible().catch(() => false)) {
      await this.demoHighlight(noAssoc);
      await noAssoc.check();
    }
    await this.captureEvidence('application-step1');
    await this.pressUntil('to-next-step', 2);
  }

  /** Step 2: directors (manual when no SSM document) and every upload the step offers. */
  async step2(d: ApplicationDetails): Promise<number> {
    const count = this.page.locator('#numOfDirector');
    if (await count.isVisible().catch(() => false) && !(await this.page.locator('#director-identity-name1').inputValue().catch(() => ''))) {
      await this.demoHighlight(count);
      await count.selectOption('1');
      await this.page.locator('#director-identity-name1').waitFor({ state: 'visible', timeout: 15_000 });
    }
    const name1 = this.page.locator('#director-identity-name1');
    if (await name1.isVisible().catch(() => false) && !(await name1.inputValue())) {
      await this.demoHighlight(name1);
      await name1.fill(d.directorName);
    }
    const ids = await this.page.evaluate(() =>
      Array.from(document.querySelectorAll('#step2 input[type=file]')).map(e => ({ id: e.id, accept: (e as HTMLInputElement).accept })),
    );
    let done = 0;
    for (const { id, accept } of ids) {
      if (!id) continue;
      if (!(await this.page.locator(`#${id}`).locator('xpath=preceding-sibling::button[1]').isVisible().catch(() => false))) continue;
      const f = /video/.test(accept) ? 'showroom-signboard.mp4'
        : /showroom-pic/.test(id) ? 'showroom-1.png'
        : /business-card/.test(id) ? 'business-card.png'
        : /stamp/.test(id) ? 'company-stamp.png'
        : /carsome|carro|deposit/.test(id) ? 'auction-deposit-receipt.pdf'
        : /association/.test(id) ? 'mva-receipt.pdf'
        : /businessProfile/i.test(id) ? 'trading-licence.pdf'
        : 'ic-director-1.png';
      await this.upload(id, this.file(f));
      done++;
    }
    console.log(`DETAIL: Step 2 — ${done} file(s) uploaded (QA SAMPLE fixtures)`);
    await this.captureEvidence('application-step2');
    await this.pressUntil('to-next-step', 3);
    return done;
  }

  /** Step 3: Main User (director), contacts, e-Invoice "Same as Director", Submit. */
  async step3(d: ApplicationDetails): Promise<string> {
    const dropdown = this.page.locator('#directorNameDropdown');
    if (await dropdown.isVisible().catch(() => false)) {
      await this.demoHighlight(dropdown);
      await dropdown.selectOption({ index: 1 });
      await this.page.waitForTimeout(1_200);
    } else {
      await this.demoHighlight('#directorNameInput');
      await this.page.locator('#directorNameInput').fill(d.directorName);
      await this.page.locator('#directorMyKad').fill(d.directorIc);
    }
    for (const [id, v] of [['directorMobile', d.directorMobile], ['directorEmail', d.directorEmail], ['picMyKad', d.directorIc]] as const) {
      const box = this.page.locator(`#${id}`);
      if (!(await box.isEditable().catch(() => false))) continue;
      await this.demoHighlight(box);
      await box.fill(v);
    }
    const same = this.page.locator('#eInvoicePersonInCharge');
    if (await same.isVisible().catch(() => false)) {
      await this.demoHighlight(same);
      await same.check();
    }
    await this.captureEvidence('application-step3');
    const text = await submitUntilConfirmed(this.page, 'to-submit');
    console.log(`DETAIL: Application submitted — "${text}"`);
    return text;
  }

  /** Step 4 (after BO approval): the registration documents, then Submit. */
  async step4(): Promise<string> {
    const step = await visibleFormStep(this.page);
    if (step !== 4) throw new Error(`Expected Registration Documents (step 4) after BO approval; the link opened on step ${step || '(receipt)'}.`);
    // The list covers every business type; each form shows only its own
    // documents (Sdn Bhd: BOD Reso; Sole Prop: LoA), so absent ids are skipped.
    let uploaded = 0;
    for (const id of STEP4_UPLOADS) {
      if (!(await this.page.locator(`#${id}`).count())) continue;
      await this.upload(id, this.file('mva-receipt.pdf'));
      uploaded++;
    }
    console.log(`DETAIL: Step 4 — ${uploaded} registration documents uploaded`);
    await this.captureEvidence('application-step4');
    const text = await submitUntilConfirmed(this.page, 'to-submit');
    console.log(`DETAIL: Registration documents submitted — "${text}"`);
    return text;
  }
}
