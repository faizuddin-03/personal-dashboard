// 12406_E2E_TS4 on the real API (board PASS on the simulator). SPayLater / ShopeePay simulator. Row 29 WA7788X
// (Lonpac + Allianz quote; Allianz ~RM1,160). Name "FAIZUDDIN TEST ALLIANZ".
import { purchase, NAME } from './e2e-purchase.mjs';
export const ts = '12406_E2E_TS4_real-20261104';
export const situation = 'Real API: Allianz purchase paid by SPayLater (ShopeePay simulator), Success, receipt, CIBO';
export const pointsFrom = '12406_E2E_TS4';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  R.note('Data: checker xlsx row 29 (real plate/IC) WA7788X, postcode 55000; Full Name ' + NAME);
  const o = await purchase(R, cfg, u, { plate: 'WA7788X', ic: '041126100922', pay: 'shopee', provePre: false });
  if (o.payment?.where !== 'success') { await R.prove('E1', { shows: 'SPayLater did not settle: ' + JSON.stringify(o.payment), match: false, name: 'E1-payment' }); return; }
  await u.showLines(R, 'Purchase summary', [['Receipt No', o.success.receiptNo], ['Payment Method', o.success.method, 'pm'], ['Confirmation Total Premium', o.conf.total, 'ct'], ['Receipt PDF Total Premium', o.receiptTotal, 'rt']]);
  await R.prove('E1', { shows: `Success; Payment Method "${o.success.method}"; receipt ${o.success.receiptNo}; Receipt Total ${o.receiptTotal} vs Confirmation ${o.conf.total}`, match: /Shopee/i.test(o.success.method || '') && o.receiptTotal === o.conf.total, hl: [p.locator('#pm'), p.locator('#ct'), p.locator('#rt')], name: 'E1-success-receipt' });
  if (!o.ref) { await R.prove('E2', { shows: 'no Allianz row in CIBO', match: false, shot: false }); return; }
  await u.ciboSearch(R, 'WA7788X');
  const row = p.locator('table tbody tr').filter({ hasText: o.ref }).first();
  const heads = await p.locator('table thead th').allInnerTexts(); const td = (h) => row.locator('td').nth(heads.indexOf(h));
  const r = o.row;
  await R.prove('E2', { shows: `Row ${o.ref}: Ins. Co. "${r['Ins. Co.']}"; Payment "${r['Payment']}"; Payment Mode "${r['Payment Mode']}"; Status "${r['Transaction Status']}"`, match: /Allianz/.test(r['Ins. Co.']) && /Paid/.test(r['Payment']) && /Insurance created/.test(r['Transaction Status']) && /eWallet.*ShopeePay/i.test(r['Payment Mode']), hl: [td('Ins. Co.'), td('Payment'), td('Payment Mode'), td('Transaction Status')], name: 'E2-cibo-row' });
  const d = await u.ciboOpen(R, o.ref);
  R.note(`Transaction Details: Cover ${d.cover}; Policy ${d.policy}; Ref ${d.ref}; Premium After NCD ${d.afterNcd}; buttons ${JSON.stringify(d.btns)}`);
  await R.prove('E3', { shows: `Payment Ref ID "${d.ref}"`, match: /^ALZ\d{8}SEW\d+/.test(d.ref || ''), hl: p.getByText(d.ref || 'zz', { exact: true }).filter({ visible: true }).first(), name: 'E3-ref-id' });
}
