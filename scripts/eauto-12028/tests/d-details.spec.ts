import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG, MONTHS, countInput, monthInput, required } from '../data/config';
import { STATES } from '../data/expected';
import { AMOUNT_RE, COUNT_RE, fmtAmount, fmtCount, toNumber } from '../utils/format';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { TxSummaryStatePage } from '../pages/TxSummaryStatePage';
import { TableData } from '../utils/table';

// D. Details page figures — 12028_TS26 to TS40. As the Drafter unless named.
// [unconfirmed] the Details page is not captured live; see pages/AplDetailsPage.ts.

const VEH = {
  Car: { count: 'Car Transactions', amount: 'Cars (RM)', rate: 1 },
  Motorcycle: { count: 'Motorcycle Transactions', amount: 'Motorcycles (RM)', rate: 2 },
} as const;
type Vehicle = keyof typeof VEH;

function vehicleInput(): Vehicle {
  const v = required('E12028_VEHICLE', 'Vehicle type');
  if (v !== 'Car' && v !== 'Motorcycle') throw new Error(`Vehicle type must be "Car" or "Motorcycle", got "${v}".`);
  return v;
}

/** A state picked on the row by its code "01".."16". */
function stateInput(k: 'E12028_STATE' | 'E12028_STATE2', field: string): { code: string; name: string } {
  const code = required(k, field).padStart(2, '0');
  const st = STATES.find(x => x.code === code);
  if (!st) throw new Error(`"${field}" = "${code}" is not a state code 01-16.`);
  return { code, name: st.names[0] };
}

async function stateCount(d: AplDetailsPage, data: TableData, code: string, header: string): Promise<{ n: number; cell: ReturnType<AplDetailsPage['stateCell']> }> {
  const r = d.stateRows(data).find(x => x.code === code);
  if (!r) throw new Error(`No state row with code (${code}) on the Details page.`);
  const cell = d.stateCell(data, r.row, header);
  await d.showValue(cell);
  return { n: toNumber(d.cell(data, r.row, header), `(${code}) ${header}`), cell };
}

test('12028_TS26: Details lists 16 states with codes 01 to 16', tagOf('12028_TS26'), async ({ page }) => {
  const ts = '12028_TS26';
  const month = monthInput('E12028_MONTH', 'Closed month with data');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  await test.step('Check 16 state rows with codes (01) to (16) and a TOTAL row', async () => {
    const data = await d.readStates();
    const rows = d.stateRows(data);
    const codes = rows.map(r => r.code).sort();
    const badNames = rows.filter(r => {
      const st = STATES.find(x => x.code === r.code);
      const name = r.name.replace(/\s*\(\d{2}\)\s*$/, '').toLowerCase();
      return !st || !st.names.some(n => n.toLowerCase() === name);
    });
    for (const r of badNames) await d.captureIssue(`${ts}-${r.code}`, d.stateRowAt(r.row), `"${r.name}" is not the SRD name for (${r.code})`);
    await d.showValue(d.stateTable());
    await d.verify(`${ts}-states`, d.stateTable(), `${rows.length} state rows, codes ${codes.join(',')}`, async () => {
      expect(codes).toEqual(STATES.map(x => x.code));
      expect(badNames.map(r => r.name)).toEqual([]);
      expect(() => d.totalRow(data)).not.toThrow();
    });
    await d.captureEvidence(`${ts}-states`);
  });
});

for (const c of [
  { title: '12028_TS27: Details TOTAL sums the car columns of 16 states', v: 'Car' as Vehicle },
  { title: '12028_TS28: Details TOTAL sums the motorcycle columns of 16 states', v: 'Motorcycle' as Vehicle },
]) {
  const ts = c.title.split(':')[0];
  const h = VEH[c.v];
  test(c.title, tagOf(ts), async ({ page }) => {
    const month = monthInput('E12028_MONTH', 'Closed month');
    const s = new Session(page, ts);
    await s.as('drafter');
    const { details: d } = await s.openMonth(month);
    await test.step(`Add up ${h.count} and ${h.amount} of the 16 states and compare with TOTAL`, async () => {
      const data = await d.readStates();
      const rows = d.stateRows(data);
      const sumN = rows.reduce((t, r) => t + toNumber(d.cell(data, r.row, h.count), h.count), 0);
      const sumA = rows.reduce((t, r) => t + toNumber(d.cell(data, r.row, h.amount), h.amount), 0);
      const total = d.totalRow(data);
      const cells = [d.stateCell(data, total, h.count), d.stateCell(data, total, h.amount)];
      for (const x of cells) await d.showValue(x);
      await d.verify(`${ts}-total`, cells, `TOTAL should be ${fmtCount(sumN)} / ${fmtAmount(sumA)}`, async () => {
        expect(d.cell(data, total, h.count)).toBe(fmtCount(sumN));
        expect(d.cell(data, total, h.amount)).toBe(fmtAmount(sumA));
      });
    });
  });
}

for (const c of [
  { title: '12028_TS29: Each state Cars (RM) equals Car Transactions x 1.00', v: 'Car' as Vehicle },
  { title: '12028_TS30: Each state Motorcycles (RM) equals Motorcycle Transactions x 2.00', v: 'Motorcycle' as Vehicle },
]) {
  const ts = c.title.split(':')[0];
  const h = VEH[c.v];
  test(c.title, tagOf(ts), async ({ page }) => {
    const month = monthInput('E12028_MONTH', 'Closed month');
    const s = new Session(page, ts);
    await s.as('drafter');
    const { details: d } = await s.openMonth(month);
    await test.step(`Check ${h.amount} = ${h.count} × ${h.rate}.00 for every state`, async () => {
      const data = await d.readStates();
      const wrong: string[] = [];
      for (const r of d.stateRows(data)) {
        const want = fmtAmount(toNumber(d.cell(data, r.row, h.count), h.count) * h.rate);
        const shown = d.cell(data, r.row, h.amount);
        if (shown !== want) {
          wrong.push(`${r.name}: ${shown} (expected ${want})`);
          await d.captureIssue(`${ts}-${r.code}`, d.stateCell(data, r.row, h.amount), `${shown}, expected ${want}`);
        }
      }
      await d.showValue(d.stateTable());
      expect(wrong, `${h.amount} ≠ ${h.count} × ${h.rate}.00`).toEqual([]);
    });
  });
}

test('12028_TS31: Amounts show the #,##0.00 format', tagOf('12028_TS31'), async ({ page }) => {
  const ts = '12028_TS31';
  const month = monthInput('E12028_MONTH', 'Month with an amount of 1,000 or more');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const sumData = await s.search();
  const amountsOk = async (where: string, list: { text: string; cell: ReturnType<AplDetailsPage['stateCell']> }[]) => {
    const bad = list.filter(a => !AMOUNT_RE.test(a.text));
    for (const b of bad) await s.details.captureIssue(`${ts}-${where}-format`, b.cell, `"${b.text}" is not #,##0.00`);
    expect(bad.map(b => b.text), `${where} amounts not in #,##0.00`).toEqual([]);
  };
  await test.step('Check every Summary amount of a closed month is #,##0.00', async () => {
    const sm = s.summary;
    const list = sm.monthRows(sumData)
      .filter(r => COUNT_RE.test(sm.cell(sumData, r.row, 'Car Transactions')))
      .flatMap(r => ['Cars (RM)', 'Motorcycles (RM)'].map(h => ({ text: sm.cell(sumData, r.row, h), cell: sm.cellAt(sumData, r.row, h) })));
    await amountsOk('summary', list);
  });
  await test.step(`Click [View] on ${month} ${CONFIG.year}`, async () => {
    await s.summary.openMonth(sumData, month);
    await s.details.expectOpenFor(month, CONFIG.year);
  });
  await test.step('Check every Details amount is #,##0.00 and a 1,000+ amount has the comma', async () => {
    const d = s.details;
    const data = await d.readStates();
    const list = [...d.stateRows(data).map(r => r.row), d.totalRow(data)]
      .flatMap(row => ['Cars (RM)', 'Motorcycles (RM)'].map(h => ({ text: d.cell(data, row, h), cell: d.stateCell(data, row, h) })));
    await amountsOk('details', list);
    const big = list.filter(a => toNumber(a.text, 'amount') >= 1000);
    if (!big.length) throw new Error(`No amount of 1,000 or more on ${month}; pick a month that has one.`);
    await d.showValue(big[0].cell);
    expect(big.every(a => a.text.includes(','))).toBe(true);
  });
});

test('12028_TS32: Car and Motorcycle values shown separately', tagOf('12028_TS32'), async ({ page }) => {
  const ts = '12028_TS32';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  await test.step('Check the four car / motorcycle columns are separate and none is combined', async () => {
    const data = await d.readStates();
    console.log(`DETAIL:${JSON.stringify({ label: 'Headers', value: data.headers.join(' | ') })}`);
    const head = d.stateTable().locator('tr').first();
    await d.showValue(head);
    await d.verify(`${ts}-headers`, head, 'Car / motorcycle columns not separate', async () => {
      for (const h of ['Car Transactions', 'Cars (RM)', 'Motorcycle Transactions', 'Motorcycles (RM)']) expect(data.headers).toContain(h);
      expect(data.headers.filter(h => /total|combined|amount|grand/i.test(h))).toEqual([]);
    });
  });
});

for (const c of [
  { title: '12028_TS33: Car counts per state match Transaction Summary Report (State)', v: 'Car' as Vehicle },
  { title: '12028_TS34: Motorcycle counts per state match Transaction Summary Report (State)', v: 'Motorcycle' as Vehicle },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    // [unconfirmed] Transaction Summary Report (State) page not captured; report split = Open point 4.
    const month = monthInput('E12028_MONTH', 'Closed month');
    const s = new Session(page, ts);
    await s.as('superadmin');
    const report = await test.step(`Open Reports → Transaction Summary Report (State) and search ${month} ${CONFIG.year}`, async () => {
      await s.home.openTransactionSummaryState();
      const rep = new TxSummaryStatePage(page);
      const data = await rep.searchMonth(CONFIG.year, MONTHS.indexOf(month));
      await rep.captureEvidence(`${ts}-report`);
      return rep.countsByState(data, c.v);
    });
    console.log(`DETAIL:${JSON.stringify({ label: 'Report counts', value: [...report].map(([k, v]) => `(${k}) ${v}`).join(', ') })}`);
    await s.as('drafter');
    const { details: d } = await s.openMonth(month);
    await test.step(`Check each state's ${VEH[c.v].count} equals the report`, async () => {
      const data = await d.readStates();
      const wrong: string[] = [];
      for (const r of d.stateRows(data)) {
        const shown = toNumber(d.cell(data, r.row, VEH[c.v].count), VEH[c.v].count);
        const want = report.get(r.code);
        if (want !== shown) {
          wrong.push(`(${r.code}) ${shown} vs report ${want ?? 'none'}`);
          await d.captureIssue(`${ts}-${r.code}`, d.stateCell(data, r.row, VEH[c.v].count), `Report shows ${want ?? 'no row'}`);
        }
      }
      await d.showValue(d.stateTable());
      expect(wrong).toEqual([]);
    });
  });
}

for (const c of [
  { title: '12028_TS35: Private and company cars both counted under Car', v: 'Car' as Vehicle },
  { title: '12028_TS36: Private and company motorcycles both counted under Motorcycle', v: 'Motorcycle' as Vehicle },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    // One company transaction cannot be seen inside an aggregate count. The
    // check is the state count against the count typed on the row (approved +
    // paid, private + company, from the BO transaction listing) — see
    // scenarios.md Self-review 5.
    const month = monthInput('E12028_MONTH', 'JPJ approval month');
    const st = stateInput('E12028_STATE', 'Dealer state');
    const want = countInput('E12028_COUNT', `Expected ${c.v.toLowerCase()} count (private + company)`);
    const s = new Session(page, ts);
    await s.as('drafter');
    const { details: d } = await s.openMonth(month);
    await test.step(`Check ${st.name} (${st.code}) ${VEH[c.v].count} = ${want}`, async () => {
      const data = await d.readStates();
      const { n, cell } = await stateCount(d, data, st.code, VEH[c.v].count);
      await d.verify(`${ts}-count`, cell, `Shows ${n}, expected ${want}`, async () => expect(n).toBe(want));
    });
  });
}

test('12028_TS37: Transaction counted in the month of its JPJ Approved Date', tagOf('12028_TS37'), async ({ page }) => {
  const ts = '12028_TS37';
  const approvalMonth = monthInput('E12028_MONTH', 'JPJ approval month');
  const createdMonth = monthInput('E12028_MONTH2', 'Creation month');
  const st = stateInput('E12028_STATE', 'Dealer state');
  const v = vehicleInput();
  const want1 = countInput('E12028_COUNT', 'Expected count, approval month');
  const want2 = countInput('E12028_COUNT2', 'Expected count, creation month');
  const s = new Session(page, ts);
  await s.as('drafter');
  for (const [month, want] of [[approvalMonth, want1], [createdMonth, want2]] as const) {
    const { details: d } = await s.openMonth(month);
    await test.step(`Check ${month}: ${st.name} ${VEH[v].count} = ${want}`, async () => {
      const data = await d.readStates();
      const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
      await d.verify(`${ts}-${month}`, cell, `${month} shows ${n}, expected ${want}`, async () => expect(n).toBe(want));
    });
  }
});

test('12028_TS38: Approved transaction not yet paid is not counted', tagOf('12028_TS38'), async ({ page }) => {
  const ts = '12028_TS38';
  // [unconfirmed] dev guide "approved + paid" vs SRD "approved" only.
  const month = monthInput('E12028_MONTH', 'Month of the unpaid transaction');
  const st = stateInput('E12028_STATE', 'Dealer state');
  const v = vehicleInput();
  const want = countInput('E12028_COUNT', 'Expected count (paid only)');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  await test.step(`Check ${st.name} ${VEH[v].count} = ${want} (unpaid left out)`, async () => {
    const data = await d.readStates();
    const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
    await d.verify(`${ts}-count`, cell, `Shows ${n}, expected ${want}`, async () => expect(n).toBe(want));
  });
});

test("12028_TS39: Transaction counted under the dealer's registered state", tagOf('12028_TS39'), async ({ page }) => {
  const ts = '12028_TS39';
  const month = monthInput('E12028_MONTH', 'JPJ approval month');
  const dealer = stateInput('E12028_STATE', 'Dealer state');
  const plate = stateInput('E12028_STATE2', 'Plate state');
  const v = vehicleInput();
  const want1 = countInput('E12028_COUNT', 'Expected count, dealer state');
  const want2 = countInput('E12028_COUNT2', 'Expected count, plate state');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const data = await d.readStates();
  for (const [st, want, what] of [[dealer, want1, 'dealer'], [plate, want2, 'plate']] as const) {
    await test.step(`Check ${what} state ${st.name} ${VEH[v].count} = ${want}`, async () => {
      const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
      await d.verify(`${ts}-${what}`, cell, `${st.name} shows ${n}, expected ${want}`, async () => expect(n).toBe(want));
    });
  }
});

test('12028_TS40: Back to Summary returns to the Summary page', tagOf('12028_TS40'), async ({ page }) => {
  const ts = '12028_TS40';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  await test.step('Click [← Back to Summary]', async () => { await d.backToSummary(); });
  await test.step('Check the Summary page is shown and the Details page is gone', async () => {
    const sm = s.summary;
    await sm.verify(`${ts}-back`, s.apl.locator('body'), 'Not back on the Summary', async () => {
      await expect(sm.heading()).toBeVisible();
      await expect(sm.yearSelect()).toBeVisible();
      await expect(d.stateTable()).toBeHidden();
    });
    await sm.captureEvidence(`${ts}-summary`);
  });
});
