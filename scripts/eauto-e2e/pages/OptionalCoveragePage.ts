import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { FIELD_RX } from '../data/types';
import { parseMoney, approxEq } from '../utils/reporting';

// ── Step 2: Optional Coverage → live re-quote → Make Payment ─
export class OptionalCoveragePage extends BasePage {
  private checkboxes    = () => this.page.locator('input[type="checkbox"]');
  private makePaymentBtn = () => this.page.locator('button:has-text("Make Payment"), input[value*="Make Payment" i]').first();
  private proceedBtn    = () => this.page.locator('button:has-text("Proceed")').first();

  /** Capture plan info, apply optional-coverage selections, verify step-2 math,
   *  and proceed to the payment page. Returns the step-2 snapshot. */
  async selectCoverageAndProceed(): Promise<Record<string, string>> {
    this.reporter.progress('coverage', 'running', 'Step 2 · Optional Coverage');

    const p2 = await this.extract(['Owner NRIC', 'Vehicle', 'Vehicle Reg. Num', 'Vehicle Reg Num', 'Year', 'Company', 'Insurance/Takaful Plan', 'Total Sum Covered', 'Period of Takaful', 'Period of Insurance', 'Excess']);
    const step2: Record<string, string> = {
      ownerIC: p2['Owner NRIC'] || '',
      vehicle: p2['Vehicle'] || '',
      vehicleRegNo: p2['Vehicle Reg. Num'] || p2['Vehicle Reg Num'] || '',
      year: p2['Year'] || '',
      company: p2['Company'] || '',
      plan: p2['Insurance/Takaful Plan'] || '',
      totalSumCovered: p2['Total Sum Covered'] || '',
      period: p2['Period of Takaful'] || p2['Period of Insurance'] || '',
      excess: p2['Excess'] || '',
      coverType: this.normalizeCover(await this.readCoverType()),
    };
    this.reporter.info(`   🛡️ Plan: ${step2.company} · ${step2.plan} · Cover ${step2.coverType} · SumCovered ${step2.totalSumCovered}`);

    // Discover optional-coverage checkboxes dynamically (differs per insurer/plan)
    const optItems: { id: string; label: string; price: string; hasSum: boolean }[] = await this.page.evaluate(() => {
      const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
      return boxes.map((cb) => {
        const row = cb.closest('tr, li, div');
        const rowTxt = clean(row?.textContent);
        const priceM = rowTxt.match(/RM\s?[\d,]+\.\d{2}/);
        const label = clean(rowTxt)
          .replace(/RM\s?[\d,]+\.\d{2}/g, '')
          .replace(/\+?\s*More info/ig, '')
          .replace(/\(Min[^)]*\)/ig, '')
          .replace(/Sum Covered.*$/i, '')
          .trim().slice(0, 60);
        const hasSum = /Sum Covered/i.test(rowTxt) && !!row?.querySelector('input[type="number"], input[type="text"]');
        return { id: cb.id || '', label, price: priceM ? priceM[0] : 'RM 0.00', hasSum: !!hasSum };
      }).filter((x) => x.id && !/By clicking|will be chosen/i.test(x.label));
    });
    this.reporter.info(`   ☑️ ${optItems.length} optional coverage item(s): ` + optItems.map((o) => `${o.label.split('  ')[0]}[${o.id}]`).join(', '));

    const selected: { id: string; label: string; price: string }[] = [];
    const setCb = async (id: string, want: boolean) => {
      const cur = await this.page.evaluate((id) => (document.getElementById(id) as HTMLInputElement)?.checked, id);
      if (cur !== want) {
        await this.page.evaluate((id) => (document.getElementById(id) as HTMLInputElement)?.click(), id);
        await this.page.waitForTimeout(400);
      }
    };
    for (const o of optItems) {
      const want = CONFIG.coverage === 'all' ? true : CONFIG.coverage === 'none' ? false : Math.random() < 0.5;
      await setCb(o.id, want);
      if (want) {
        if (o.hasSum) {
          const row = this.page.locator(`#${o.id}`).locator('xpath=ancestor::*[self::tr or self::li or self::div][1]');
          const numInput = row.locator('input[type="number"], input[type="text"]').first();
          if (await numInput.count() > 0) {
            const rowTxt = await row.innerText().catch(() => '');
            const mm = rowTxt.match(/Min\s*RM([\d,]+).*?Max\s*RM([\d,]+)/i);
            const lo = mm ? parseInt(mm[1].replace(/,/g, ''), 10) : 500;
            const hi = mm ? parseInt(mm[2].replace(/,/g, ''), 10) : 1000;
            const val = Math.round((lo + hi) / 2 / 100) * 100;
            await numInput.fill(String(val));
            await numInput.press('Tab');
            await this.page.waitForTimeout(1200);
          }
        }
        selected.push({ id: o.id, label: o.label, price: o.price });
      }
    }
    await this.waitWorkingDone(20000);
    await this.page.waitForTimeout(800);

    // Recomputed quotation (body-regex — layout-agnostic)
    step2.totalSumCovered = step2.totalSumCovered || await this.bodyMatch(FIELD_RX.sum);
    step2.basicContribution = await this.bodyMatch(FIELD_RX.basic);
    step2.contributionAfterNCD = await this.bodyMatch(FIELD_RX.afterNcd);
    step2.gross = await this.bodyMatch(FIELD_RX.gross);
    step2.serviceTax = await this.bodyMatch(FIELD_RX.tax);
    step2.stampDuty = await this.bodyMatch(FIELD_RX.stamp);
    step2.total = await this.bodyMatch(FIELD_RX.totalContrib);
    step2.selectedCoverage = selected.map((s) => s.label).join(', ') || '(none)';

    // Step-2 pricing math (self-contained)
    const grossN = parseMoney(step2.gross);
    const afterNcdN = parseMoney(step2.contributionAfterNCD);
    const optSum = selected.reduce((a, s) => a + (parseMoney(s.price) || 0), 0);
    const taxN = parseMoney(step2.serviceTax);
    const stampN = parseMoney(step2.stampDuty);
    const totalN = parseMoney(step2.total);
    if (afterNcdN != null && grossN != null)
      this.reporter.record('Step2 Gross = AfterNCD + optional add-ons', approxEq(grossN, afterNcdN + optSum, 0.5),
        `AfterNCD ${afterNcdN} + add-ons ${optSum.toFixed(2)} ≈ Gross ${grossN}`);
    if (grossN != null && taxN != null)
      this.reporter.record('Step2 Service Tax ≈ 8% of Gross', approxEq(taxN, +(grossN * 0.08).toFixed(2), 0.5),
        `8% of ${grossN} = ${(grossN * 0.08).toFixed(2)} vs shown ${taxN}`);
    if (grossN != null && taxN != null && stampN != null && totalN != null)
      this.reporter.record('Step2 Total = Gross + Tax + Stamp', approxEq(totalN, grossN + taxN + stampN, 0.1),
        `${grossN}+${taxN}+${stampN} = ${(grossN + taxN + stampN).toFixed(2)} vs ${totalN}`);

    await this.shot('step2-coverage', `Step 2 — coverage: ${step2.selectedCoverage}`, [
      { text: 'Optional Coverage', label: 'Optional Coverage' },
      { text: 'Total Contribution', label: 'Live Total' },
    ]);
    this.reporter.info(`   💰 Step2 total ${step2.total} (coverage: ${step2.selectedCoverage})`);

    // Proceed → Make Payment (handle All Drivers advisory + occasional double-click)
    await this.announce('Proceeding to Payment');
    await this.makePaymentBtn().click().catch(() => {});
    await this.page.waitForTimeout(1200);
    if (await this.proceedBtn().count() > 0 && await this.proceedBtn().isVisible().catch(() => false)) {
      await this.shot('step2-alldrivers-popup', 'Step 2 — “untick All Drivers” advisory popup', [{ text: 'All Drivers', label: 'Advisory' }]);
      await this.announce('Confirming All Drivers advisory → Proceed');
      await this.proceedBtn().click();
      await this.page.waitForTimeout(800);
      await this.makePaymentBtn().click().catch(() => {});
    }
    await this.page.waitForURL(/payment\.do/, { timeout: 30000 }).catch(() => {});
    if (!/payment\.do/.test(this.page.url())) { await this.makePaymentBtn().click().catch(() => {}); await this.page.waitForURL(/payment\.do/, { timeout: 30000 }).catch(() => {}); }
    await this.waitWorkingDone();
    await this.page.waitForTimeout(1200);
    this.reporter.progress('coverage', 'done');
    return step2;
  }
}
