import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG, MONTHS, monthInput } from '../data/config';
import { AMOUNT_RE, COUNT_RE, fmtAmount, fmtCount, monTitle, toNumber } from '../utils/format';
import { expectButtons } from '../utils/checks';
import { Checks } from '../utils/combined';
import { AplSummaryPage } from '../pages/AplSummaryPage';
import { TableData } from '../utils/table';

// B. Summary page — 12028_TS07 to TS10. All as the Drafter.
// [unconfirmed] the Summary is not captured live; see pages/AplSummaryPage.ts.

/** Month rows that carry figures (closed months). */
function closedMonths(summary: AplSummaryPage, data: TableData) {
  return summary.monthRows(data).filter(r => COUNT_RE.test(summary.cell(data, r.row, 'Car Transactions')));
}

test('12028_TS07: Summary for Year 2026 shows the year filter, 12 months, columns, total label and Payment Date', tagOf('12028_TS07'), async ({ page }) => {
  const ts = '12028_TS07';
  const month = monthInput('E12028_MONTH', 'Month with Approver Status Pending');
  const s = new Session(page, ts);
  await s.as('drafter');
  const summary = await s.openListing();
  const c = new Checks(summary, ts);
  await test.step('Open the Year filter and check it starts at 2026 with no earlier year', async () => {
    const years = (await summary.yearOptions()).filter(o => /^\d{4}$/.test(o));
    console.log(`DETAIL:${JSON.stringify({ label: 'Year options', value: years.join(', ') })}`);
    await summary.showValue(summary.yearSelect());
    await c.run('year filter', summary.yearSelect(), () => {
      expect(years[0], 'first year').toBe('2026');
      expect(years.filter(y => Number(y) < 2026), 'years before 2026').toEqual([]);
    });
  });
  const data = await s.search();
  await test.step('Check 12 rows, January to December', async () => {
    await summary.showValue(summary.table());
    await c.run('12 months', summary.table(), () => expect(summary.monthRows(data).map(r => r.month)).toEqual(MONTHS));
  });
  await test.step('Check the column headers, in order, plus a View column', async () => {
    const want = ['Car Transactions', 'Cars (RM)', 'Motorcycle Transactions', 'Motorcycles (RM)', 'Drafter Status', 'Reviewer Status', 'Approver Status', 'Payment Date'];
    const at = want.map(w => data.headers.findIndex(h => h.toLowerCase() === w.toLowerCase()));
    console.log(`DETAIL:${JSON.stringify({ label: 'Headers', value: data.headers.join(' | ') })}`);
    await c.run('columns', summary.table().locator('tr').first(), () => {
      expect(want.filter((w, i) => at[i] < 0), 'missing columns').toEqual([]);
      expect(at, 'columns in the order of the TS').toEqual([...at].sort((a, b) => a - b));
      expect(data.headers.some(h => /^(View|Action)$/i.test(h)), 'a View / Action column').toBe(true);
    });
  });
  await test.step('Check the total row label reads YEAR TO DATE with the month range', async () => {
    const rows = closedMonths(summary, data);
    const total = summary.totalRow(data);
    const label = summary.totalLabel(total);
    await summary.showValue(summary.rowAt(total));
    // [unconfirmed] mock-up line 600 wording "YEAR TO DATE (Jan–Jun)"; the range ends at the last month with figures.
    await c.run('total label', summary.rowAt(total), () => {
      if (!rows.length || rows.length === 12) throw new Error(`needs a part year (1 to 11 closed months); ${CONFIG.year} has ${rows.length}`);
      expect(label).toMatch(new RegExp(`^YEAR TO DATE \\(Jan\\s*[–-]\\s*${monTitle(rows[rows.length - 1].month)}\\)$`));
    });
  });
  await test.step(`Check ${month} (Approver Status Pending) shows Payment Date "-"`, async () => {
    const st = summary.monthStatus(data, month);
    if (st.approver !== 'Pending') throw new Error(`Precondition not met: ${month} Approver Status is "${st.approver}", the TS needs Pending.`);
    const cell = summary.cellAt(data, summary.monthRow(data, month), 'Payment Date');
    await summary.showValue(cell);
    await c.run('payment date', cell, () => expect(st.paymentDate).toBe('-'));
  });
  c.done();
});

test('12028_TS08: Summary figures use the FMC and MMSDA rates and the total row sums the months', tagOf('12028_TS08'), async ({ page }) => {
  const ts = '12028_TS08';
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  const summary = s.summary;
  const rows = closedMonths(summary, data);
  if (!rows.length) throw new Error(`No closed month with figures in ${CONFIG.year} — nothing to compare.`);
  console.log(`DETAIL:${JSON.stringify({ label: 'Closed months', value: rows.map(r => r.month).join(', ') })}`);
  const c = new Checks(summary, ts);
  await test.step('Check each closed month shows counts, amounts and View', async () => {
    for (const r of rows) {
      const f = summary.monthFigures(data, r.month);
      await c.run(`${r.month} values`, summary.rowAt(r.row), async () => {
        expect(f.bikes).toMatch(COUNT_RE);
        expect(f.carsRm).toMatch(AMOUNT_RE);
        expect(f.bikesRm).toMatch(AMOUNT_RE);
        await expect(summary.viewLink(r.row)).toBeVisible();
      });
    }
  });
  for (const v of [
    { count: 'Car Transactions', amount: 'Cars (RM)', rate: 1 },
    { count: 'Motorcycle Transactions', amount: 'Motorcycles (RM)', rate: 2 },
  ]) {
    await test.step(`Check ${v.amount} = ${v.count} × ${v.rate}.00 on every closed month`, async () => {
      for (const r of rows) {
        const want = fmtAmount(toNumber(summary.cell(data, r.row, v.count), `${r.month} ${v.count}`) * v.rate);
        const cell = summary.cellAt(data, r.row, v.amount);
        await summary.showValue(cell);
        await c.run(`${r.month} ${v.amount}`, cell, () => expect(summary.cell(data, r.row, v.amount)).toBe(want));
      }
    });
    await test.step(`Check the total row ${v.count} and ${v.amount} equal the sum of the months`, async () => {
      const sumN = rows.reduce((t, r) => t + toNumber(summary.cell(data, r.row, v.count), v.count), 0);
      const sumA = rows.reduce((t, r) => t + toNumber(summary.cell(data, r.row, v.amount), v.amount), 0);
      const total = summary.totalRow(data);
      const cells = [summary.cellAt(data, total, v.count), summary.cellAt(data, total, v.amount)];
      for (const x of cells) await summary.showValue(x);
      await c.run(`total ${v.count}`, cells, () => {
        expect(summary.cell(data, total, v.count)).toBe(fmtCount(sumN));
        expect(summary.cell(data, total, v.amount)).toBe(fmtAmount(sumA));
      });
    });
  }
  c.done();
});

test('12028_TS09: Closed month with zero transactions shows 0.00 and can be opened', tagOf('12028_TS09'), async ({ page }) => {
  const ts = '12028_TS09';
  // [unconfirmed] Open point 3: SRD "No data" vs dev guide "0.00" — this TS follows the dev guide.
  const month = monthInput('E12028_MONTH', 'Closed month with zero transactions');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month} shows 0.00 in both amount columns`, async () => {
    const summary = s.summary;
    const row = summary.monthRow(data, month);
    const f = summary.monthFigures(data, month);
    await summary.showValue(summary.rowAt(row));
    await summary.verify(`${ts}-zero`, [summary.cellAt(data, row, 'Cars (RM)'), summary.cellAt(data, row, 'Motorcycles (RM)')], 'Expected 0.00 and 0.00', async () => {
      expect(f.carsRm).toBe('0.00');
      expect(f.bikesRm).toBe('0.00');
    });
  });
  const d = await test.step(`Click [View] on ${month} ${CONFIG.year}`, async () => {
    await s.summary.openMonth(data, month);
    const det = s.details;
    await det.expectOpenFor(month, CONFIG.year);
    return det;
  });
  await s.requireState(d, month, 'Pending');
  await expectButtons(d, ts, { enabled: ['Approve', 'KIV'] });
});

test("12028_TS10: View opens the month's Details matching the Summary row and Back to Summary returns", tagOf('12028_TS10'), async ({ page }) => {
  const ts = '12028_TS10';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  const fig = await test.step(`Note ${month}'s four figures on the Summary`, async () => {
    await s.summary.showValue(s.summary.rowAt(s.summary.monthRow(data, month)));
    return s.summary.monthFigures(data, month);
  });
  console.log(`DETAIL:${JSON.stringify({ label: 'Summary row', value: `${fig.cars} / ${fig.carsRm} / ${fig.bikes} / ${fig.bikesRm}` })}`);
  await test.step(`Click [View] on ${month} and check the Details page is for ${month} ${CONFIG.year}`, async () => {
    await s.summary.openMonth(data, month);
    const d = s.details;
    await d.verify(`${ts}-title`, d.title(), `Title should name ${month} ${CONFIG.year}`, async () => {
      await d.expectOpenFor(month, CONFIG.year);
      await expect(d.stateTable()).toBeVisible();
    });
    await d.showValue(d.title());
  });
  await test.step('Check the Details TOTAL row equals the Summary row', async () => {
    const d = s.details;
    const st = await d.readStates();
    const total = d.totalRow(st);
    const got = {
      cars: d.cell(st, total, 'Car Transactions'), carsRm: d.cell(st, total, 'Cars (RM)'),
      bikes: d.cell(st, total, 'Motorcycle Transactions'), bikesRm: d.cell(st, total, 'Motorcycles (RM)'),
    };
    await d.showValue(d.stateRowAt(total));
    await d.verify(`${ts}-total`, d.stateRowAt(total), `Details TOTAL ${got.cars}/${got.carsRm}/${got.bikes}/${got.bikesRm} ≠ Summary`, async () => expect(got).toEqual(fig));
  });
  await test.step('Click [← Back to Summary] and check the Summary returns', async () => {
    const d = s.details;
    await d.backToSummary();
    const sm = s.summary;
    await sm.verify(`${ts}-back`, s.apl.locator('body'), 'Not back on the Summary', async () => {
      await expect(sm.heading()).toBeVisible();
      await expect(sm.yearSelect()).toBeVisible();
      await expect(d.stateTable()).toBeHidden();
    });
    await sm.captureEvidence(`${ts}-back-on-summary`);
  });
});
