// 12406_QT_TS4 on the real API (first run): Allianz unavailable, the customer buys Lonpac (FPX). Row 33 BQX1858.
// The Lonpac purchase is then read by RG_TS2 E3 and RC_TS4 E5 (Lonpac Transaction Details + receipt, agency).
import { NAME } from './e2e-purchase.mjs';
export const ts = '12406_QT_TS4_real-20261104';
export const situation = 'Allianz unavailable; the customer still buys Lonpac to the end (real API); also RG_TS2 E3 / RC_TS4 E5 data';
export const pointsFrom = '12406_QT_TS4';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  R.note('Data: checker xlsx row 33 (real plate/IC) BQX1858, postcode 55000; Full Name ' + NAME + '. "Non-renewal" (Q12 e) cannot be chosen with real data: this is a renewal car where Allianz does not quote.');
  let st = await u.quote(R, cfg, { plate: 'BQX1858', ic: '900303146116' }); if (st === 'car-details') st = await u.carDetails(R);
  if (st !== 'quotations') throw new Error('quote: ' + st);
  const cs = await u.cards(R); const ord = cs.map((c) => c.insurer + (/unavailable/i.test(c.text) ? ' (unavailable)' : ''));
  const all = p.locator('.insurance-card').filter({ visible: true });
  await R.shot('all-quotations', 'All Quotations: ' + ord.join(' → '), all);
  await R.prove('E1', { shows: `Order ${ord.join(' → ')}`, match: ord.indexOf('Allianz (unavailable)') > ord.indexOf('Tokio Marine') && ord.includes('Allianz (unavailable)'), hl: u.card(R, 'Allianz'), name: 'E1-allianz-unavailable' });
  await R.prove('E2', { shows: 'Available: ' + ord.filter((x) => !/unavail/.test(x)).join(' → '), match: ord.filter((x) => !/unavail/.test(x)).join('|') === 'Lonpac|Tokio Marine', hl: [u.card(R, 'Lonpac'), u.card(R, 'Tokio Marine')], name: 'E2-lonpac-tokio-order' });
  await u.buy(R, 'Lonpac');
  await R.shot('lonpac-addons', 'Lonpac Add-ons, default; price bar ' + await u.priceBar(R), u.addonCards(R).first());
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  const conf = await u.pricing(R);
  await R.shot('lonpac-confirmation', `Lonpac Confirmation: Total ${conf.total}, agent ${conf.agent}`, u.row(R, 'Total Premium'));
  await u.confirmAndPay(R);
  const res = await u.payFpx(R, cfg, 'RHB', '00');
  R.note('payment: ' + JSON.stringify(res));
  if (res.where !== 'success') { await R.prove('E3', { shows: 'payment did not settle: ' + JSON.stringify(res), match: false, name: 'E3-lonpac-purchase' }); return; }
  const s = await u.successInfo(R);
  const rb = u.receiptBtn(R);
  await R.prove('E3', { shows: `"Thank you for your purchase!"; Receipt No ${s.receiptNo}; ${s.method}; [Receipt] shown`, match: !!s.receiptNo && (await rb.count()) > 0, hl: [p.getByText(/Thank you for your purchase/i).first(), rb], name: 'E3-lonpac-success' });
  const f = await R.download(rb, `receipt-${s.receiptNo}-lonpac.pdf`, 'Download [Receipt]');
  const rf = u.receiptFields(u.pdfText(f));
  await u.showPdf(R, f, 'Lonpac receipt ' + s.receiptNo);
  await R.shot('lonpac-receipt-pdf', `Lonpac receipt: Insurer "${rf.insurer.join(' / ')}"`);
  await u.cibo(R, cfg, 'BQX1858', 'the Lonpac purchase (read by RG_TS2 / RC_TS4)');
  let row; for (let k = 0; k < 6; k++) { const r = await u.ciboSearch(R, 'BQX1858'); row = r.rows.map((c) => Object.fromEntries(r.heads.map((h, i) => [h, c[i]]))).find((x) => /Lonpac/i.test(x['Ins. Co.'] || '')); if (row && /Insurance created|Failed/.test(row['Transaction Status'])) break; await R.offscreen('Waiting for the insurer', '30 s'); await p.waitForTimeout(30000); }
  const ref = (row?.['Transaction Ref. No.'] || '').split(' ')[0];
  R.note(`CIBO row: ${JSON.stringify(row)}`);
  if (ref) {
    const tr = p.locator('table tbody tr').filter({ hasText: ref }).first();
    await R.shot('cibo-lonpac-row', `CIBO ${ref}: ${row['Ins. Co.']} · ${row['Payment']} · ${row['Transaction Status']}`, tr);
    const d = await u.ciboOpen(R, ref);
    R.note(`Lonpac Transaction Details ${ref}: status ${d.status}; Insurer "${d.insurer}"; Cover ${d.cover}; Policy ${d.policy}; Ref ${d.ref}; buttons ${JSON.stringify(d.btns)}`);
    await R.shot('cibo-lonpac-details', `Lonpac Transaction Details: Insurer "${d.insurer}"; Cover Note ${d.cover}`, u.lbl(R, 'Insurer'));
  }
}
