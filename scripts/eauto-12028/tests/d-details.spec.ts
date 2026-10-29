import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG, MONTHS, countInput, monthInput, required } from '../data/config';
import { STATES } from '../data/expected';
import { AMOUNT_RE, fmtAmount, fmtCount, toNumber } from '../utils/format';
import { Checks } from '../utils/combined';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { TxSummaryStatePage } from '../pages/TxSummaryStatePage';
import { TableData } from '../utils/table';

// D. Details page figures — 12028_TS14 to TS19. As the Drafter unless named.
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

async function stateCount(d: AplDetailsPage, data: TableData, code: string, header: string) {
  const r = d.stateRows(data).find(x => x.code === code);
  if (!r) throw new Error(`No state row with code (${code}) on the Details page.`);
  const cell = d.stateCell(data, r.row, header);
  await d.showValue(cell);
  return { n: toNumber(d.cell(data, r.row, header), `(${code}) ${header}`), cell };
}

test('12028_TS14: Details shows 16 states, TOTAL and amounts at the FMC and MMSDA rates', tagOf('12028_TS14'), async ({ page }) => {
  const ts = '12028_TS14';
  const month = monthInput('E12028_MONTH', 'Closed month with an amount of 1,000 or more');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const data = await d.readStates();
  const rows = d.stateRows(data);
  const c = new Checks(d, ts);
  console.log(`DETAIL:${JSON.stringify({ label: 'Headers', value: data.headers.join(' | ') })}`);
  await test.step('Check 16 state rows with codes (01) to (16), SRD names, and a TOTAL row', async () => {
    await d.showValue(d.stateTable());
    await c.run('16 states', d.stateTable(), () => {
      expect(rows.map(r => r.code).sort()).toEqual(STATES.map(x => x.code));
      const badNames = rows.filter(r => {
        const st = STATES.find(x => x.code === r.code);
        const name = r.name.replace(/\s*\(\d{2}\)\s*$/, '').toLowerCase();
        return !st || !st.names.some(n => n.toLowerCase() === name);
      });
      expect(badNames.map(r => r.name), 'names not as SRD v1.1 REQ-008').toEqual([]);
      d.totalRow(data);
    });
  });
  for (const v of Object.values(VEH)) {
    await test.step(`Check ${v.amount} = ${v.count} × ${v.rate}.00 for every state`, async () => {
      for (const r of rows) {
        const want = fmtAmount(toNumber(d.cell(data, r.row, v.count), v.count) * v.rate);
        await c.run(`${r.code} ${v.amount}`, d.stateCell(data, r.row, v.amount), () => expect(d.cell(data, r.row, v.amount)).toBe(want));
      }
    });
    await test.step(`Check TOTAL ${v.count} and TOTAL ${v.amount} equal the sum of the 16 states`, async () => {
      const sumN = rows.reduce((t, r) => t + toNumber(d.cell(data, r.row, v.count), v.count), 0);
      const sumA = rows.reduce((t, r) => t + toNumber(d.cell(data, r.row, v.amount), v.amount), 0);
      const total = d.totalRow(data);
      const cells = [d.stateCell(data, total, v.count), d.stateCell(data, total, v.amount)];
      for (const x of cells) await d.showValue(x);
      await c.run(`TOTAL ${v.count}`, cells, () => {
        expect(d.cell(data, total, v.count)).toBe(fmtCount(sumN));
        expect(d.cell(data, total, v.amount)).toBe(fmtAmount(sumA));
      });
    });
  }
  await test.step('Check every amount is #,##0.00 and a 1,000+ amount has the comma', async () => {
    const list = [...rows.map(r => r.row), d.totalRow(data)].flatMap(row => ['Cars (RM)', 'Motorcycles (RM)'].map(h => ({ text: d.cell(data, row, h), cell: d.stateCell(data, row, h) })));
    for (const a of list.filter(x => !AMOUNT_RE.test(x.text))) await c.run('amount format', a.cell, () => expect(a.text).toMatch(AMOUNT_RE));
    const big = list.filter(a => AMOUNT_RE.test(a.text) && toNumber(a.text, 'amount') >= 1000);
    await c.run('1,000+ amount', d.stateTable(), () => {
      if (!big.length) throw new Error(`no amount of 1,000 or more on ${month}; pick a month that has one`);
      expect(big.every(a => a.text.includes(','))).toBe(true);
    });
  });
  await test.step('Check car and motorcycle values are separate columns, none combined', async () => {
    await c.run('separate columns', d.stateTable().locator('tr').first(), () => {
      for (const h of ['Car Transactions', 'Cars (RM)', 'Motorcycle Transactions', 'Motorcycles (RM)']) expect(data.headers).toContain(h);
      expect(data.headers.filter(h => /total|combined|amount|grand/i.test(h))).toEqual([]);
    });
  });
  await d.captureEvidence(`${ts}-states`);
  c.done();
});

test('12028_TS15: State counts match Transaction Summary Report (State)', tagOf('12028_TS15'), async ({ page }) => {
  const ts = '12028_TS15';
  // [unconfirmed] Transaction Summary Report (State) page not captured; report split = Open point 4.
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('superadmin');
  const report = await test.step(`Open Reports → Transaction Summary Report (State) and search ${month} ${CONFIG.year}`, async () => {
    await s.home.openTransactionSummaryState();
    const rep = new TxSummaryStatePage(page);
    const data = await rep.searchMonth(CONFIG.year, MONTHS.indexOf(month));
    await rep.captureEvidence(`${ts}-report`);
    return { Car: rep.countsByState(data, 'Car'), Motorcycle: rep.countsByState(data, 'Motorcycle') };
  });
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const data = await d.readStates();
  const c = new Checks(d, ts);
  for (const v of ['Car', 'Motorcycle'] as Vehicle[]) {
    await test.step(`Check each state's ${VEH[v].count} equals the report`, async () => {
      for (const r of d.stateRows(data)) {
        const shown = toNumber(d.cell(data, r.row, VEH[v].count), VEH[v].count);
        const want = report[v].get(r.code);
        await c.run(`(${r.code}) ${v}`, d.stateCell(data, r.row, VEH[v].count), () => expect(shown, `report shows ${want ?? 'no row'}`).toBe(want));
      }
    });
  }
  c.done();
});

test('12028_TS16: Private and company vehicles both counted under Car and Motorcycle', tagOf('12028_TS16'), async ({ page }) => {
  const ts = '12028_TS16';
  // One company transaction cannot be seen inside an aggregate count. The check
  // is the state count against the counts typed on the row (approved + paid,
  // private + company, from the BO transaction listing).
  const month = monthInput('E12028_MONTH', 'Closed month');
  const st = stateInput('E12028_STATE', 'Dealer state');
  const wantCar = countInput('E12028_COUNT', 'Car count (private + company)');
  const wantBike = countInput('E12028_COUNT2', 'Motorcycle count (private + company)');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const data = await d.readStates();
  const c = new Checks(d, ts);
  for (const [v, want] of [['Car', wantCar], ['Motorcycle', wantBike]] as const) {
    await test.step(`Check ${st.name} (${st.code}) ${VEH[v].count} = ${want}`, async () => {
      const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
      await c.run(`${v} count`, cell, () => expect(n).toBe(want));
    });
  }
  c.done();
});

test('12028_TS17: Transaction counted in the month of its JPJ Approved Date', tagOf('12028_TS17'), async ({ page }) => {
  const ts = '12028_TS17';
  const approvalMonth = monthInput('E12028_MONTH', 'JPJ approval month');
  const createdMonth = monthInput('E12028_MONTH2', 'Creation month');
  const st = stateInput('E12028_STATE', 'Dealer state');
  const v = vehicleInput();
  const want1 = countInput('E12028_COUNT', 'Expected count, approval month');
  const want2 = countInput('E12028_COUNT2', 'Expected count, creation month');
  const s = new Session(page, ts);
  await s.as('drafter');
  for (const [month, want] of [[createdMonth, want2], [approvalMonth, want1]] as const) {
    const { details: d } = await s.openMonth(month);
    await test.step(`Check ${month}: ${st.name} ${VEH[v].count} = ${want}`, async () => {
      const data = await d.readStates();
      const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
      await d.verify(`${ts}-${month}`, cell, `${month} shows ${n}, expected ${want}`, async () => expect(n).toBe(want));
    });
  }
});

test('12028_TS18: Approved transaction not yet paid is not counted', tagOf('12028_TS18'), async ({ page }) => {
  const ts = '12028_TS18';
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

test("12028_TS19: Transaction counted under the dealer's registered state", tagOf('12028_TS19'), async ({ page }) => {
  const ts = '12028_TS19';
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
  const c = new Checks(d, ts);
  for (const [st, want, what] of [[dealer, want1, 'dealer'], [plate, want2, 'plate']] as const) {
    await test.step(`Check ${what} state ${st.name} ${VEH[v].count} = ${want}`, async () => {
      const { n, cell } = await stateCount(d, data, st.code, VEH[v].count);
      await c.run(`${what} state`, cell, () => expect(n).toBe(want));
    });
  }
  c.done();
});
