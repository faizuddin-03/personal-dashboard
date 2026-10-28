import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG, MONTHS, monthInput } from '../data/config';
import { AMOUNT_RE, COUNT_RE, fmtAmount, fmtCount, monTitle, toNumber } from '../utils/format';
import { expectButtons } from '../utils/checks';
import { AplSummaryPage } from '../pages/AplSummaryPage';
import { TableData } from '../utils/table';

// B. Summary page — 12028_TS08 to TS22. All as the Drafter.
// [unconfirmed] the Summary is not captured live; see pages/AplSummaryPage.ts.

/** Month rows that carry figures (closed months), with their numbers. */
function closedMonths(summary: AplSummaryPage, data: TableData) {
  return summary.monthRows(data)
    .filter(r => COUNT_RE.test(summary.cell(data, r.row, 'Car Transactions')))
    .map(r => ({ ...r, ...summary.monthFigures(data, r.month) }));
}

test('12028_TS08: Year filter starts at 2026 with no earlier year', tagOf('12028_TS08'), async ({ page }) => {
  const ts = '12028_TS08';
  const s = new Session(page, ts);
  await s.as('drafter');
  const summary = await s.openListing();
  await test.step('Open the Year filter and read its years', async () => {
    const options = await summary.yearOptions();
    const years = options.filter(o => /^\d{4}$/.test(o));
    console.log(`DETAIL:${JSON.stringify({ label: 'Year options', value: options.join(', ') })}`);
    await summary.showValue(summary.yearSelect());
    await summary.verify(`${ts}-years`, summary.yearSelect(), `First year must be 2026, none earlier (shows ${years.join(', ')})`, async () => {
      expect(years[0]).toBe('2026');
      expect(years.filter(y => Number(y) < 2026)).toEqual([]);
    });
  });
});

test('12028_TS09: Search Year 2026 lists 12 months January to December', tagOf('12028_TS09'), async ({ page }) => {
  const ts = '12028_TS09';
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step('Check the listing shows 12 rows, January to December', async () => {
    const summary = s.summary;
    const months = summary.monthRows(data).map(r => r.month);
    await summary.showValue(summary.table());
    await summary.verify(`${ts}-months`, summary.table(), `Expected January…December, got ${months.length} rows`, async () => {
      expect(months).toEqual(MONTHS);
    });
    await summary.captureEvidence(`${ts}-12-months`);
  });
});

test('12028_TS10: Summary shows the listing columns', tagOf('12028_TS10'), async ({ page }) => {
  const ts = '12028_TS10';
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step('Check the column headers, in order', async () => {
    const want = ['Car Transactions', 'Cars (RM)', 'Motorcycle Transactions', 'Motorcycles (RM)', 'Drafter Status', 'Reviewer Status', 'Approver Status', 'Payment Date'];
    const at = want.map(w => data.headers.findIndex(h => h.toLowerCase() === w.toLowerCase()));
    console.log(`DETAIL:${JSON.stringify({ label: 'Headers', value: data.headers.join(' | ') })}`);
    const summary = s.summary;
    await summary.showValue(summary.table().locator('tr').first());
    await summary.verify(`${ts}-headers`, summary.table().locator('tr').first(), 'Columns missing or out of order', async () => {
      expect(want.filter((w, i) => at[i] < 0), 'missing columns').toEqual([]);
      expect(at, 'columns in the order of the TS').toEqual([...at].sort((a, b) => a - b));
      expect(data.headers.some(h => /^(View|Action)$/i.test(h)), 'a View / Action column').toBe(true);
    });
  });
});

test('12028_TS11: Month not yet closed shows No data with no View', tagOf('12028_TS11'), async ({ page }) => {
  const ts = '12028_TS11';
  const month = monthInput('E12028_MONTH', 'Month not yet closed');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month} shows "No data" and has no View`, async () => {
    const summary = s.summary;
    const row = summary.monthRow(data, month);
    const cells = Object.values(row.byCol).map(c => c.text);
    await summary.showValue(summary.rowAt(row));
    await summary.verify(`${ts}-row`, summary.rowAt(row), `${month}: expected "No data", no View, no figures`, async () => {
      expect(cells).toContain('No data');
      await expect(summary.viewLink(row)).toHaveCount(0);
      expect(summary.cell(data, row, 'Car Transactions')).not.toMatch(COUNT_RE);
    });
  });
});

test('12028_TS12: Closed month shows car and motorcycle counts and amounts', tagOf('12028_TS12'), async ({ page }) => {
  const ts = '12028_TS12';
  const month = monthInput('E12028_MONTH', 'Closed month with data');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month} shows counts, amounts and View`, async () => {
    const summary = s.summary;
    const row = summary.monthRow(data, month);
    const f = summary.monthFigures(data, month);
    console.log(`DETAIL:${JSON.stringify({ label: `${month} figures`, value: `${f.cars} / ${f.carsRm} / ${f.bikes} / ${f.bikesRm}` })}`);
    await summary.showValue(summary.rowAt(row));
    await summary.verify(`${ts}-row`, summary.rowAt(row), `${month}: counts / amounts / View expected`, async () => {
      expect(f.cars).toMatch(COUNT_RE);
      expect(f.bikes).toMatch(COUNT_RE);
      expect(f.carsRm).toMatch(AMOUNT_RE);
      expect(f.bikesRm).toMatch(AMOUNT_RE);
      expect(toNumber(f.cars, 'Car Transactions') + toNumber(f.bikes, 'Motorcycle Transactions'), 'a month WITH data').toBeGreaterThan(0);
      await expect(summary.viewLink(row)).toBeVisible();
    });
  });
});

test('12028_TS13: Closed month with zero transactions shows 0.00 and can be opened', tagOf('12028_TS13'), async ({ page }) => {
  const ts = '12028_TS13';
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

for (const c of [
  { title: '12028_TS14: Summary Cars (RM) equals Car Transactions x 1.00 for each month', count: 'Car Transactions', amount: 'Cars (RM)', rate: 1 },
  { title: '12028_TS15: Summary Motorcycles (RM) equals Motorcycle Transactions x 2.00 for each month', count: 'Motorcycle Transactions', amount: 'Motorcycles (RM)', rate: 2 },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    const s = new Session(page, ts);
    await s.as('drafter');
    await s.openListing();
    const data = await s.search();
    await test.step(`Check ${c.amount} = ${c.count} × ${c.rate}.00 on every closed month`, async () => {
      const summary = s.summary;
      const rows = closedMonths(summary, data);
      if (!rows.length) throw new Error(`No closed month with figures in ${CONFIG.year} — nothing to compare.`);
      const wrong: string[] = [];
      for (const r of rows) {
        const n = toNumber(summary.cell(data, r.row, c.count), `${r.month} ${c.count}`);
        const shown = summary.cell(data, r.row, c.amount);
        const want = fmtAmount(n * c.rate);
        if (shown !== want) {
          wrong.push(`${r.month}: ${shown} (expected ${want})`);
          await summary.captureIssue(`${ts}-${r.month}`, summary.cellAt(data, r.row, c.amount), `${c.amount} ${shown}, expected ${want}`);
        } else await summary.showValue(summary.cellAt(data, r.row, c.amount));
      }
      console.log(`DETAIL:${JSON.stringify({ label: 'Months compared', value: rows.map(r => r.month).join(', ') })}`);
      expect(wrong, `${c.amount} not equal to ${c.count} × ${c.rate}.00`).toEqual([]);
    });
  });
}

for (const c of [
  { title: '12028_TS16: Total row sums Car Transactions and Cars (RM)', count: 'Car Transactions', amount: 'Cars (RM)' },
  { title: '12028_TS17: Total row sums Motorcycle Transactions and Motorcycles (RM)', count: 'Motorcycle Transactions', amount: 'Motorcycles (RM)' },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    const s = new Session(page, ts);
    await s.as('drafter');
    await s.openListing();
    const data = await s.search();
    await test.step(`Add up ${c.count} and ${c.amount} of every month and compare with the total row`, async () => {
      const summary = s.summary;
      const rows = closedMonths(summary, data);
      if (!rows.length) throw new Error(`No closed month with figures in ${CONFIG.year} — nothing to add up.`);
      const sumCount = rows.reduce((t, r) => t + toNumber(summary.cell(data, r.row, c.count), c.count), 0);
      const sumAmount = rows.reduce((t, r) => t + toNumber(summary.cell(data, r.row, c.amount), c.amount), 0);
      const total = summary.totalRow(data);
      const targets = [summary.cellAt(data, total, c.count), summary.cellAt(data, total, c.amount)];
      for (const t of targets) await summary.showValue(t);
      await summary.verify(`${ts}-total`, targets, `Total should be ${fmtCount(sumCount)} / ${fmtAmount(sumAmount)}`, async () => {
        expect(summary.cell(data, total, c.count)).toBe(fmtCount(sumCount));
        expect(summary.cell(data, total, c.amount)).toBe(fmtAmount(sumAmount));
      });
    });
  });
}

test('12028_TS18: Total row label reads YEAR TO DATE for a part year', tagOf('12028_TS18'), async ({ page }) => {
  const ts = '12028_TS18';
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step('Check the total row label names the months with figures', async () => {
    const summary = s.summary;
    const rows = closedMonths(summary, data);
    if (!rows.length || rows.length === 12) throw new Error(`This TS needs a part year (1 to 11 closed months); ${CONFIG.year} has ${rows.length}.`);
    const last = rows[rows.length - 1].month;
    const total = summary.totalRow(data);
    const label = summary.totalLabel(total);
    // [unconfirmed] mock-up line 600 wording "YEAR TO DATE (Jan–Jun)".
    const want = new RegExp(`^YEAR TO DATE \\(Jan\\s*[–-]\\s*${monTitle(last)}\\)$`);
    await summary.showValue(summary.rowAt(total));
    await summary.verify(`${ts}-label`, summary.rowAt(total), `Label "${label}", expected "YEAR TO DATE (Jan–${monTitle(last)})"`, async () => {
      expect(label).toMatch(want);
    });
  });
});

test('12028_TS19: Newly closed month starts with all three statuses Pending', tagOf('12028_TS19'), async ({ page }) => {
  const ts = '12028_TS19';
  const month = monthInput('E12028_MONTH', 'Newly closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month}'s three statuses are Pending`, async () => {
    const summary = s.summary;
    const row = summary.monthRow(data, month);
    const st = summary.monthStatus(data, month);
    const cells = ['Drafter Status', 'Reviewer Status', 'Approver Status'].map(h => summary.cellAt(data, row, h));
    for (const c of cells) await summary.showValue(c);
    await summary.verify(`${ts}-statuses`, cells, `Statuses ${st.drafter}/${st.reviewer}/${st.approver}`, async () => {
      expect([st.drafter, st.reviewer, st.approver]).toEqual(['Pending', 'Pending', 'Pending']);
    });
  });
});

test('12028_TS20: Payment Date shows - before the Approver approves', tagOf('12028_TS20'), async ({ page }) => {
  const ts = '12028_TS20';
  const month = monthInput('E12028_MONTH', 'Month with Approver Status Pending');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month}'s Payment Date is "-"`, async () => {
    const summary = s.summary;
    const row = summary.monthRow(data, month);
    const st = summary.monthStatus(data, month);
    if (st.approver !== 'Pending') throw new Error(`Precondition not met: ${month} Approver Status is "${st.approver}", the TS needs Pending.`);
    const cell = summary.cellAt(data, row, 'Payment Date');
    await summary.showValue(cell);
    await summary.verify(`${ts}-payment-date`, cell, `Payment Date "${st.paymentDate}", expected "-"`, async () => {
      expect(st.paymentDate).toBe('-');
    });
  });
});

test('12028_TS21: View opens the Details page of that month', tagOf('12028_TS21'), async ({ page }) => {
  const ts = '12028_TS21';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details } = await s.openMonth(month);
  await test.step(`Check the Details page is for ${month} ${CONFIG.year}`, async () => {
    await details.showValue(details.title());
    await details.verify(`${ts}-title`, details.title(), `Title should name ${month} ${CONFIG.year}`, async () => {
      await expect(details.title()).toContainText(`${month} ${CONFIG.year}`);
      await expect(details.stateTable()).toBeVisible();
    });
    await details.captureEvidence(`${ts}-details`);
  });
});

test('12028_TS22: Summary month row equals the Details TOTAL row', tagOf('12028_TS22'), async ({ page }) => {
  const ts = '12028_TS22';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  const fig = await test.step(`Note ${month}'s four figures on the Summary`, async () => {
    const summary = s.summary;
    await summary.showValue(summary.rowAt(summary.monthRow(data, month)));
    return summary.monthFigures(data, month);
  });
  console.log(`DETAIL:${JSON.stringify({ label: 'Summary row', value: `${fig.cars} / ${fig.carsRm} / ${fig.bikes} / ${fig.bikesRm}` })}`);
  await test.step(`Click [View] on ${month} ${CONFIG.year}`, async () => {
    await s.summary.openMonth(data, month);
    await s.details.expectOpenFor(month, CONFIG.year);
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
    await d.verify(`${ts}-total`, d.stateRowAt(total), `Details TOTAL ${got.cars}/${got.carsRm}/${got.bikes}/${got.bikesRm} ≠ Summary`, async () => {
      expect(got).toEqual(fig);
    });
  });
});
