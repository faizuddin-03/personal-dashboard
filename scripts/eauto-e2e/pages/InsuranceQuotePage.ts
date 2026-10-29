import { Dialog } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { norm, pick, rnd } from '../utils/reporting';

interface QuoteCard { idx: number; insurer: string; cover: string; total: string; sum: string; }

// ── Step 1: Get a Free Quote → enter VN/IC → choose insurer ─
export class InsuranceQuotePage extends BasePage {
  private freeQuoteLink = () => this.page.locator('text=GET A FREE QUOTE');
  private companyRadio  = () => this.page.locator('input[name="vehicleCategory"][value="company"], input[type="radio"][value="company"]').first();
  private textInputs    = () => this.page.locator('form input[type="text"]:visible');
  private showResultBtn = () => this.page.locator('button:has-text("Show My Result"), input[value*="Show My Result" i]').first();
  private selectButtons = () => this.page.locator('button:has-text("SELECT")');

  /** Open the Insurance module and click "Get a Free Quote". */
  async openFreeQuote(): Promise<void> {
    this.reporter.progress('free_quote', 'running', 'Open Insurance');
    await this.announce('Opening the Insurance module');
    await this.page.goto(`${CONFIG.baseUrl}/view/ucd/insurance/home.do`, { waitUntil: 'domcontentloaded' });
    await this.closePopup();
    await this.shot('insurance-home', 'Insurance landing — 4 options', [{ text: 'GET A FREE QUOTE', label: 'Entry point' }]);
    await this.clickWithSpotlight('text=GET A FREE QUOTE', 'Clicking “Get a Free Quote”');
    await this.page.waitForURL(/quote\/view\.do/, { timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(800);
    this.reporter.progress('free_quote', 'done');
  }

  /** Enter vehicle number + IC, choose the insurer card per preference, adjust
   *  sum covered, and select. Returns the captured step-1 snapshot. */
  async submitAndChooseInsurer(): Promise<Record<string, string>> {
    this.reporter.progress('quotes', 'running', 'Step 1 · Quotes');

    const formReady = await this.textInputs().first()
      .waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
    if (!formReady) {
      await this.shot('step1-noform', 'Step 1 — quote form did not load (staging unresponsive?)');
      throw new Error('Quote form did not render — the e-simulator/staging may be unresponsive. Retry when it is healthy.');
    }

    await this.announce(`Entering vehicle ${CONFIG.vehicleNo} and IC`);
    if (CONFIG.category === 'company') await this.companyRadio().check().catch(() => {});
    await this.textInputs().first().fill(CONFIG.vehicleNo);
    await this.textInputs().nth(1).fill(CONFIG.ic);
    await this.shot('step1-form', 'Step 1 — Create Free Quote form filled', [
      { sel: 'form input[type="text"]:visible >> nth=0', label: 'Vehicle No' },
      { sel: 'form input[type="text"]:visible >> nth=1', label: 'IC No' },
    ]);

    this.page.removeAllListeners('dialog');
    this.page.on('dialog', async (d: Dialog) => { this.reporter.info(`   📢 dialog: "${d.message()}"`); await d.accept().catch(() => {}); });

    await this.announce('Submitting — Show My Result');
    await this.showResultBtn().click();

    const gotCards = await Promise.race([
      this.page.waitForURL(/plan\/view\.do/, { timeout: 45000 }).then(() => true).catch(() => false),
      this.page.waitForSelector('button:has-text("SELECT")', { timeout: 45000 }).then(() => true).catch(() => false),
    ]);
    await this.waitWorkingDone(45000);
    await this.page.waitForTimeout(1000);

    const bodyTxt = await this.page.locator('body').innerText().catch(() => '');
    if (/unable to retrieve your vehicle information/i.test(bodyTxt)) {
      await this.shot('step1-error', 'Step 1 — vehicle info could not be retrieved');
      throw new Error(`Vehicle ${CONFIG.vehicleNo} — "Unable to retrieve your vehicle information". Try a different VN.`);
    }
    if (!gotCards && (await this.selectButtons().count()) === 0) {
      await this.shot('step1-noquote', 'Step 1 — no quote cards appeared');
      throw new Error(`No insurer quote cards appeared for ${CONFIG.vehicleNo}.`);
    }

    // Top vehicle summary bar
    const v = await this.extract(['Owner NRIC', 'Vehicle Reg. Num', 'Vehicle Reg Num', 'Vehicle', 'Year', 'NCD', 'Capacity', 'Transmission', 'Variant (Series)', 'Variant']);
    const step1: Record<string, string> = {
      ownerIC: v['Owner NRIC'] || '',
      vehicleRegNo: v['Vehicle Reg. Num'] || v['Vehicle Reg Num'] || '',
      vehicle: v['Vehicle'] || '',
      year: v['Year'] || '',
      ncd: v['NCD'] || '',
      capacity: v['Capacity'] || '',
      transmission: v['Transmission'] || '',
      variant: v['Variant (Series)'] || v['Variant'] || '',
    };
    this.reporter.info(`   🚗 ${step1.vehicle} (${step1.year}) · ${step1.capacity} · Owner ${step1.ownerIC}`);

    // Enumerate insurer cards; tag SELECT buttons + each card's sum dropdown
    const cards: QuoteCard[] = await this.page.evaluate(() => {
      const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a'))
        .filter((b) => /select\s+(zurich|takaful|chubb|lonpac|tokio|rhb)/i.test(clean(b.textContent || (b as HTMLInputElement).value)));
      const out: QuoteCard[] = [];
      btns.forEach((b, i) => {
        (b as HTMLElement).setAttribute('data-e2e-idx', String(i));
        const label = clean(b.textContent || (b as HTMLInputElement).value);
        const insurer = (label.match(/select\s+([a-z]+)/i) || [, ''])[1].toUpperCase();
        let node: HTMLElement | null = b as HTMLElement;
        let cardNode: HTMLElement | null = null;
        let cardText = '';
        for (let up = 0; up < 7 && node; up++) {
          node = node.parentElement;
          const t = clean(node?.textContent);
          if (/COMPREHENSIVE|THIRD PARTY|PRIVATE CAR/i.test(t) && /sum/i.test(t)) { cardText = t; cardNode = node; break; }
        }
        const cover = (cardText.match(/COMPREHENSIVE|THIRD PARTY[, ]*FIRE[ &]*THEFT|PRIVATE CAR[ ]*\(?ENHANCED\)?/i) || [''])[0].toUpperCase();
        const total = (cardText.match(/RM\s?[\d,]+\.\d{2}\s*\/?\s*year/i) || [''])[0];
        let sum = '';
        const sel = cardNode?.querySelector('select') as HTMLSelectElement | null;
        if (sel) { sel.setAttribute('data-e2e-sumidx', String(i)); sum = clean(sel.options[sel.selectedIndex]?.textContent); }
        out.push({ idx: i, insurer, cover, total, sum });
      });
      return out;
    });
    this.reporter.info(`   📋 ${cards.length} quote card(s): ` + cards.map((c) => `${c.insurer}/${this.normalizeCover(c.cover)}`).join(', '));

    // Choose per preference
    const matchPref = (c: QuoteCard) => {
      switch (CONFIG.insurer) {
        case 'zurich-comprehensive': return /zurich/.test(c.insurer.toLowerCase()) && this.normalizeCover(c.cover) === 'COMPREHENSIVE';
        case 'zurich-tpft':          return /zurich/.test(c.insurer.toLowerCase()) && this.normalizeCover(c.cover) === 'TPFT';
        case 'takaful-comprehensive':return /takaful/.test(c.insurer.toLowerCase()) && this.normalizeCover(c.cover) === 'COMPREHENSIVE';
        case 'takaful-tpft':         return /takaful/.test(c.insurer.toLowerCase()) && this.normalizeCover(c.cover) === 'TPFT';
        case 'chubb':                return /chubb/.test(c.insurer.toLowerCase());
        default: return false;
      }
    };
    let chosen = cards[0];
    if (CONFIG.insurer === 'random') chosen = pick(cards);
    else if (CONFIG.insurer !== 'first') {
      const found = cards.find(matchPref);
      if (found) chosen = found;
      else this.reporter.warn(`Preferred insurer "${CONFIG.insurer}" not offered for ${CONFIG.vehicleNo} — falling back to first card (${cards[0].insurer}/${this.normalizeCover(cards[0].cover)}).`);
    }
    const chosenCover = this.normalizeCover(chosen.cover);
    step1.insurer = chosen.insurer;
    step1.coverType = chosenCover;
    step1.cardTotal = chosen.total;
    this.reporter.info(`   👉 Selected: ${chosen.insurer} · ${chosenCover} · ${chosen.total}`);

    // Optionally change the chosen card's sum-covered dropdown
    const chosenSelect = this.page.locator(`select[data-e2e-sumidx="${chosen.idx}"]`);
    if (CONFIG.sumMode !== 'default' && (await chosenSelect.count()) > 0) {
      const opts = await chosenSelect.locator('option').allTextContents();
      if (opts.length > 1) {
        const targetIdx = CONFIG.sumMode === 'max' ? opts.length - 1 : 1 + rnd(opts.length - 1);
        await this.announce(`Changing Sum Covered → ${norm(opts[targetIdx])}`);
        await chosenSelect.selectOption({ index: targetIdx });
        await this.waitWorkingDone(20000);
        await this.page.waitForTimeout(1500);
      }
    }
    step1.sumCovered = (await chosenSelect.count()) > 0
      ? norm((await chosenSelect.locator('option:checked').first().textContent().catch(() => '')) || '')
      : norm(chosen.sum);

    await this.shot('step1-quotes', `Step 1 — ${cards.length} quotes; choosing ${chosen.insurer} (${chosenCover})`, [
      { sel: `[data-e2e-idx="${chosen.idx}"]`, label: `SELECT ${chosen.insurer}` },
      { text: 'Sum Covered', label: 'Sum Covered' },
    ]);

    await this.announce(`Selecting ${chosen.insurer} (${chosenCover})`);
    await this.page.locator(`[data-e2e-idx="${chosen.idx}"]`).click();
    await this.page.waitForURL(/plan\/select\.do/, { timeout: 30000 }).catch(() => {});
    await this.waitWorkingDone();
    await this.page.waitForTimeout(1200);
    this.reporter.progress('quotes', 'done');
    return step1;
  }
}
