// 12406_E2E_TS2 (card + discount code RJC7) and E2E_TS3 (PayLater by Grab) reruns on the real Allianz API
// (board KIV, Q44). One file, chosen by env TS=2|3. Name "FAIZUDDIN TEST ALLIANZ".
import { purchase, NAME } from './e2e-purchase.mjs';
const which = process.env.TS || '2';
export const ts = `12406_E2E_TS${which}_rerun-20261104`;
export const situation = which === '2' ? 'Rerun on the real API: Allianz purchase by Credit or Debit Card, discount code RJC7' : 'Rerun on the real API: Allianz purchase by PayLater by Grab';
export const pointsFrom = `12406_E2E_TS${which}`;
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  const data = which === '2' ? { plate: 'BJX6968', ic: '891005016274', pay: 'card', discount: 'RJC7', row: 15 } : { plate: 'PLX9927', ic: '070324011069', pay: 'grab', row: 17 };
  R.note(`Data: checker xlsx row ${data.row} (real plate/IC), postcode 55000; Full Name ${NAME}`);
  const o = await purchase(R, cfg, u, { ...data, provePre: false });
  if (o.payment?.where !== 'success') {
    await R.prove('E1', { shows: 'Payment did not settle: ' + JSON.stringify(o.payment), match: false, name: 'E1-payment' });
    return;
  }
  await u.showLines(R, 'Purchase summary', [['Receipt No', o.success.receiptNo], ['Payment Method', o.success.method, 'pm'], ['Confirmation Total Amount', o.conf.amount, 'ca'], ['Receipt PDF Total Premium', o.receiptTotal, 'rt'],
    ['Discount code result', o.discount || '(not used)', 'dc'], ['Receipt PDF discount line', (u.pdfText(o.receipt).match(/Discount[^\n]*/) || ['(none)'])[0].replace(/\s+/g, ' '), 'rd']]);
  const methodOk = which === '2' ? /Credit|Debit|Card/i.test(o.success.method || '') : /Grab/i.test(o.success.method || '');
  await R.prove('E1', { shows: `Success; Payment Method "${o.success.method}"; receipt ${o.success.receiptNo}; Receipt Total ${o.receiptTotal} vs Confirmation Total Premium ${o.conf.total} (paid ${o.conf.amount})`, match: methodOk && o.receiptTotal === o.conf.total, hl: [p.locator('#pm'), p.locator('#ca'), p.locator('#rt')], name: 'E1-success-receipt' });
  if (!o.ref) { await R.prove('E2', { shows: 'no Allianz row in CIBO', match: false, shot: false }); return; }
  await u.ciboSearch(R, o.row['Vehicle No']);
  const row = p.locator('table tbody tr').filter({ hasText: o.ref }).first();
  const heads = await p.locator('table thead th').allInnerTexts(); const td = (h) => row.locator('td').nth(heads.indexOf(h));
  const r = o.row;
  await R.prove('E2', { shows: `Row ${o.ref}: Ins. Co. "${r['Ins. Co.']}"; Payment "${r['Payment']}"; Payment Mode "${r['Payment Mode']}" (recorded); Status "${r['Transaction Status']}"; Remark "${r['Remark']}"`,
    match: /Allianz/.test(r['Ins. Co.']) && /Paid/.test(r['Payment']) && /Insurance created/.test(r['Transaction Status']), hl: [td('Ins. Co.'), td('Payment'), td('Payment Mode'), td('Transaction Status')], name: 'E2-cibo-row' });
  const d = await u.ciboOpen(R, o.ref);
  R.note(`Transaction Details: status ${d.status}; Insurer "${d.insurer}"; Cover ${d.cover}; Policy ${d.policy}; Ref ${d.ref}; Premium After NCD ${d.afterNcd}; buttons ${JSON.stringify(d.btns)}`);
  const refOk = which === '3' ? /^ALZ\d{8}SEW\d+/.test(d.ref || '') : true;
  await R.prove('E3', { shows: `Cover Note No "${d.cover}"; Policy No "${d.policy}"; Payment Ref ID "${d.ref}"`, match: (d.cover || '-') !== '-' && refOk, hl: [u.lbl(R, 'Cover Note No'), p.getByText(d.ref || 'zz', { exact: true }).filter({ visible: true }).first()], name: 'E3-cover-note' });
  if (which === '2') {
    await u.showLines(R, 'Discount code RJC7 (rule: the receipt shows a discount line only for MF / EAUTO / ER codes)', [['Confirmation after Apply', o.discount || '-', 'dc'], ['Receipt PDF discount line', (u.pdfText(o.receipt).match(/Discount[^\n]*/) || ['(none)'])[0].replace(/\s+/g, ' '), 'rd']]);
    const hasLine = /Discount/.test(u.pdfText(o.receipt));
    await R.prove('E4', { shows: `RJC7: ${o.discount}; receipt discount line present: ${hasLine} (recorded; RJC7 is not MF / EAUTO / ER, so no line expected)`, match: !hasLine, hl: [p.locator('#dc'), p.locator('#rd')], name: 'E4-discount-line' });
  }
}
