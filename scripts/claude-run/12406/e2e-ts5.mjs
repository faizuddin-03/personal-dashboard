// 12406_E2E_TS5 on the real Allianz API (Azfar 30.10 PASS on the simulator). FPX status 51 (fail) -> SPayLater
// [Cancel the transaction] + OK -> FPX 00 (pay). Name "FAIZUDDIN TEST ALLIANZ". Fresh checker rows (never bought):
// tried in order until Allianz quotes. SPayLater cancel copied from Azfar fiuu-popup.page.ts cancelShopee.
import { NAME } from './e2e-purchase.mjs';
export const ts = '12406_E2E_TS5_real-20261105';
export const situation = 'Real API: Allianz payment fails (FPX 51), SPayLater cancelled, then paid by FPX; payment page messages, CIBO rows';
export const pointsFrom = '12406_E2E_TS5';
const CANDIDATES = [['VBX2423', '950113015997', 34], ['WC4253X', '011102070960', 37], ['PMX9034', '750603085190', 38], ['NDX523', '900414025261', 39]];

async function payPage(R, plate) {
  const b = await R.page.locator('body').innerText().catch(() => '');
  const amounts = [...new Set(b.match(/RM\s?[\d,]+\.\d\d/g) || [])].map((s) => s.replace(/\s/g, ''));
  const tiles = await R.page.locator('label').filter({ has: R.page.locator("input[formcontrolname='paymentType']") }).filter({ visible: true }).allInnerTexts().catch(() => []);
  return { plate: b.includes(plate), amounts, tiles: tiles.map((t) => t.trim()), howPay: /How would you like to pay\?/i.test(b), unsuccessful: (b.match(/Unsuccessful payment[^\n]*(\n[^\n]*)?/i) || [''])[0].replace(/\s+/g, ' '), receipt: /\bReceipt\b/.test(b) && /Thank you for your purchase/i.test(b) };
}

export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  let plate, ic, rowNo, st;
  for (const [pl, id, n] of CANDIDATES) {
    R.note(`Data: checker xlsx row ${n} ${pl} (real plate/IC, never bought), postcode 55000`);
    st = await u.quote(R, cfg, { plate: pl, ic: id });
    if (st === 'car-details') st = await u.carDetails(R);
    if (st !== 'quotations') { R.note(`row ${n} ${pl}: ${st}`); continue; }
    const cs = await u.cards(R);
    await R.shot(`all-quotations-${pl}`, 'All Quotations: ' + cs.map((c) => `${c.insurer}: ${(c.text.match(/RM[\d,.]+/g) || []).join(' ') || c.text.slice(0, 40)}`).join(' | '), p.locator('.insurance-card').filter({ visible: true }));
    const a = cs.find((c) => c.insurer === 'Allianz' && /RM/.test(c.text));
    const price = a ? parseFloat((a.text.match(/RM([\d,]+\.\d\d)/) || ['', '99999'])[1].replace(/,/g, '')) : 99999;
    if (!a || price > 1800) { R.note(`row ${n} ${pl}: Allianz ${a ? 'RM' + price + ' (too close to the RM2,000 sandbox limit, Q46)' : 'did not quote'}`); continue; }
    plate = pl; ic = id; rowNo = n; break;
  }
  if (!plate) throw new Error('no candidate row quoted Allianz under RM1,800');
  await u.buy(R, 'Allianz');
  await R.shot('addons-default', 'Add-ons kept at default; price bar ' + (await u.priceBar(R)), p.locator('app-price-topbar').filter({ visible: true }).first());
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  const conf = await u.pricing(R);
  await R.shot('confirmation', `Confirmation: Total Amount ${conf.amount}`, u.row(R, 'Total Amount'));
  await u.confirmAndPay(R);
  const before = await payPage(R, plate);
  await R.shot('payment-page-before', `Payment page: plate ${plate} shown ${before.plate}; amounts ${before.amounts.join(' ')}; tiles ${before.tiles.join(' | ')}`);

  // 1. FPX RHB status 51 -> fail
  const f1 = await u.payFpx(R, cfg, 'RHB', '51');
  R.note('FPX 51: ' + JSON.stringify(f1));
  await p.waitForTimeout(3000);
  const afterFail = await payPage(R, plate);
  const unsucc = p.getByText(/Unsuccessful payment/i).filter({ visible: true }).first();
  await R.prove('E1', {
    shows: `After FPX 51 (${f1.where}): "${afterFail.unsuccessful}"; receipt shown ${afterFail.receipt}; tiles still offered: ${afterFail.tiles.join(' | ')}`,
    match: f1.where === 'failed' && /Unsuccessful payment/i.test(afterFail.unsuccessful) && /try again/i.test(afterFail.unsuccessful) && !afterFail.receipt && afterFail.tiles.length >= 4,
    hl: [unsucc, p.locator('label').filter({ has: p.locator("input[formcontrolname='paymentType']") }).filter({ visible: true })], name: 'E1-after-fpx-51',
  });

  // 2. SPayLater -> [Cancel the transaction] -> OK
  const popP = R.ctx.waitForEvent('page', { timeout: 20000 }).catch(() => null);
  await R.click(u.tiles(R).filter({ hasText: 'SPayLater' }).first(), 'SPayLater');
  let w = await popP;
  if (!w) { const go = p.getByRole('button', { name: /^\s*(Pay|Pay Now|Proceed|Continue|Make Payment)\s*$/i }).filter({ visible: true }).last(); const pp = R.ctx.waitForEvent('page', { timeout: 60000 }).catch(() => null); if (await go.count()) await R.click(go, 'Pay'); w = await pp; }
  let cancelShows = 'no ShopeePay window opened';
  if (w) {
    await w.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
    for (let i = 0; i < 40; i++) {
      await w.waitForTimeout(2000);
      const gate = w.locator('input[type=password]').filter({ visible: true }).first();
      if (/staging\.secarang\.com/.test(w.url()) && await gate.isVisible().catch(() => false)) { await gate.fill(cfg.site); await w.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); continue; }
      if (await w.getByText(/Cancel the transaction/i).first().isVisible().catch(() => false)) break;
    }
    const cb = w.getByText(/Cancel the transaction/i).first();
    await R.shot('shopeepay-qr-window', 'ShopeePay QR window with [Cancel the transaction]', cb, w);
    let native = '';
    w.once('dialog', (d) => { native = d.message(); d.accept().catch(() => {}); });
    await R.mark(cb, 'Cancel the transaction'); await R.clear(w); await cb.click(); R.note('ShopeePay window: Cancel the transaction');
    await w.waitForTimeout(1500).catch(() => {});
    if (!native && !w.isClosed()) {
      const ok = w.getByRole('button', { name: /^\s*OK\s*$/ }).filter({ visible: true }).first();
      if (await ok.count()) { await R.shot('are-you-sure', '"Are you sure?" with [OK]', ok, w); await ok.click(); R.note('ShopeePay window: OK'); }
    } else R.note('browser confirm accepted: "' + native + '"');
    cancelShows = native ? `confirm "${native}" OK` : 'page OK pressed';
    for (let i = 0; i < 30 && !w.isClosed(); i++) await p.waitForTimeout(1000);
  }
  await p.waitForTimeout(4000);
  const afterCancel = await payPage(R, plate);
  const same = afterCancel.plate && before.amounts.filter((x) => afterCancel.amounts.includes(x)).length === before.amounts.length;
  await R.prove('E3', {
    shows: `After SPayLater cancel (${cancelShows}): "How would you like to pay?" ${afterCancel.howPay}; plate ${plate} ${afterCancel.plate}; amounts ${afterCancel.amounts.join(' ')} (before ${before.amounts.join(' ')}); message "${afterCancel.unsuccessful}"`,
    match: afterCancel.howPay && same, name: 'E3-after-spaylater-cancel',
  });

  // 3. FPX RHB status 00 -> pay
  const f2 = await u.payFpx(R, cfg, 'RHB', '00');
  R.note('FPX 00: ' + JSON.stringify(f2));
  let succ = {}, rec = '';
  if (f2.where === 'success') {
    succ = await u.successInfo(R);
    const file = await R.download(u.receiptBtn(R), `receipt-${succ.receiptNo}.pdf`, 'Download [Receipt]');
    rec = file ? 'downloaded' : 'not downloaded';
    await R.shot('success', `Success: Receipt No ${succ.receiptNo}, Payment Method ${succ.method}, Total ${succ.total}`, u.receiptBtn(R));
  }

  // 4. CIBO: Transaction Management by plate, then Payment Management by ref
  await u.cibo(R, cfg, plate, 'the transaction in the back office');
  let rows = [];
  for (let k = 0; k < 6; k++) {
    const r = await u.ciboSearch(R, plate);
    rows = r.rows.filter((c) => c.length > 3).map((c) => Object.fromEntries(r.heads.map((h, i) => [h.replace(/\s+/g, ' ').trim(), c[i]])));
    if (rows.some((x) => /Insurance created|Failed/.test(x['Transaction Status'] || ''))) break;
    await R.offscreen('Waiting for the insurer', 'check again in 30 s'); await p.waitForTimeout(30000);
  }
  const mine = rows.filter((x) => /Allianz/.test(x['Ins. Co.'] || ''));
  const ref = ((mine[0]?.['Transaction Ref. No.']) || '').split(' ')[0];
  await R.shot('cibo-tm-plate', `Transaction Management, plate ${plate}: ${rows.length} row(s): ` + rows.map((x) => `${x['Transaction Ref. No.']} / ${x['Payment']} / ${x['Transaction Status']}`).join(' ; '), p.locator('table').filter({ visible: true }).first());
  let pm = 'Payment Management not read';
  try {
    await p.goto('https://staging.secarang.com/cibo/payment-management', { waitUntil: 'domcontentloaded' });
    await p.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {}); await p.waitForTimeout(4000);
    const s = p.locator("input[formcontrolname='search']").filter({ visible: true }).first();
    await R.fill(s, ref || plate, 'Search: ' + (ref || plate));
    await R.click(p.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).first(), 'Search');
    await p.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {}); await p.waitForTimeout(5000);
    const heads = (await p.locator('table thead th').allInnerTexts()).map((h) => h.replace(/\s+/g, ' ').trim());
    const pr = await p.locator('table tbody tr').filter({ visible: true }).evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
    const prows = pr.filter((c) => c.length > 3);
    pm = `Payment Management "${ref || plate}": ${prows.length} row(s): ` + prows.map((c) => heads.map((h, i) => `${h}=${c[i]}`).filter((x) => /Ref|Status|Amount|Channel/i.test(x)).join(', ')).join(' ; ');
    await R.shot('cibo-payment-management', pm.slice(0, 160), p.locator('table').filter({ visible: true }).first());
  } catch (e) { pm += ': ' + String(e.message).split('\n')[0]; }
  const m = mine[0] || {};
  await R.prove('E2', {
    shows: `Transaction Management plate ${plate}: ${rows.length} row(s), Allianz rows ${mine.length}: ${mine.map((x) => `${x['Transaction Ref. No.']} | ${x['Payment']} | ${x['Transaction Status']}`).join(' ; ')} || ${pm}`,
    match: mine.length === 1 && /Paid/.test(m['Payment'] || '') && /Insurance created/.test(m['Transaction Status'] || ''), shot: false,
  });
  await R.prove('E4', {
    shows: `FPX 00: ${f2.where}; Receipt No ${succ.receiptNo || '-'} [Receipt] ${rec || '-'}; CIBO ${ref || '-'} Ins. Co. "${m['Ins. Co.'] || '-'}", Payment "${m['Payment'] || '-'}", Status "${m['Transaction Status'] || '-'}"`,
    match: f2.where === 'success' && rec === 'downloaded' && /Allianz/.test(m['Ins. Co.'] || '') && /Paid/.test(m['Payment'] || ''), shot: false,
  });
  R.note(`Data used: row ${rowNo} ${plate} (now bought: shows the 2-month renewal form from now on)`);
}
