// 12406_E2E_TS1 rerun on the real Allianz API (board KIV, Q44 cover note). FPX RHB, checker row 14, name
// "FAIZUDDIN TEST ALLIANZ". Also records the Success page [Print] view (RC_TS1 E9).
import { purchase, NAME } from './e2e-purchase.mjs';
export const ts = '12406_E2E_TS1_rerun-20261104';
export const situation = 'Rerun on the real API: Allianz purchase by FPX, Success, receipt, CIBO, cover note and e-Certificate';
export const pointsFrom = '12406_E2E_TS1';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  R.note('Data: checker xlsx row 14 (real plate/IC), postcode 55000; Full Name ' + NAME);
  const o = await purchase(R, cfg, u, { plate: 'JPX1030', ic: '040315011262', pay: 'fpx' });
  await e3to8(R, u, o, /Online Banking - RHB Bank/);
}
export async function e3to8(R, u, o, methodRe) {
  const p = R.page;
  R.note('E3 tiles: ' + (o.tiles || []).join(' | '));
  if (o.payment?.where !== 'success') { await R.prove('E4', { shows: 'payment did not reach the Success page: ' + JSON.stringify(o.payment), match: false, shot: true, name: 'E4-payment' }); return; }
  await u.showLines(R, 'Purchase summary', [['Payment tiles', (o.tiles || []).join(' | '), 'ti'], ['Receipt No', o.success.receiptNo, 'rn'], ['Purchase Date', o.success.date], ['Payment Method', o.success.method, 'pm'],
    ['Confirmation Total Amount', o.conf.amount, 'ca'], ['Receipt PDF Total Premium', o.receiptTotal, 'rt'], ['Receipt PDF Insurer', (o.rf.insurer || []).join(' / ')],
    ['Confirmation Premium After NCD', o.conf.afterNcd], ['Success Premium After NCD', o.success.afterNcd, 'pan']]);
  await R.prove('E3', { shows: 'Tiles: ' + (o.tiles || []).join(' | '), match: (o.tiles || []).join('|') === 'Credit or Debit Card|FPX Online banking|SPayLater|PayLater by Grab', hl: p.locator('#ti'), name: 'E3-payment-tiles' });
  await R.prove('E4', { shows: `Thank you page; Receipt No ${o.success.receiptNo}; ${o.success.date}; Payment Method "${o.success.method}"; [Receipt] downloaded`, match: !!o.success.receiptNo && methodRe.test(o.success.method || ''), hl: [p.locator('#rn'), p.locator('#pm')], name: 'E4-success' });
  await R.prove('E5', { shows: `Receipt Total Premium ${o.receiptTotal} vs Confirmation ${o.conf.amount}`, match: !!o.receiptTotal && o.receiptTotal === o.conf.amount, hl: [p.locator('#ca'), p.locator('#rt')], name: 'E5-receipt-total' });
  // CIBO row (o.row) and details (o.details): open the details page again for the screenshots
  if (!o.ref) { await R.prove('E6', { shows: 'no Allianz row found in CIBO for the plate', match: false, shot: false }); return; }
  await u.ciboSearch(R, o.row['Vehicle No']);
  const row = p.locator('table tbody tr').filter({ hasText: o.ref }).first();
  const heads = await p.locator('table thead th').allInnerTexts(); const td = (h) => row.locator('td').nth(heads.indexOf(h));
  const r = o.row;
  await R.prove('E6', { shows: `Row ${o.ref}: Ins. Co. "${r['Ins. Co.']}"; Payment "${r['Payment']}"; Payment Mode "${r['Payment Mode']}"; Status "${r['Transaction Status']}"; Remark "${r['Remark']}"`,
    match: /Allianz/.test(r['Ins. Co.']) && /Serba Sentral/.test(r['Ins. Co.']) && /Paid/.test(r['Payment']) && /Insurance created/.test(r['Transaction Status']),
    hl: [td('Ins. Co.'), td('Payment'), td('Payment Mode'), td('Transaction Status'), td('Remark')], name: 'E6-cibo-row' });
  const d = await u.ciboOpen(R, o.ref);
  await R.prove('E7', { shows: `Status ${d.status}; Cover Note No "${d.cover}"; Policy No "${d.policy}"; Payment Ref ID "${d.ref}"`, match: (d.cover || '-') !== '-' && (d.policy || '-') !== '-' && /SFX/.test(d.ref || ''),
    hl: [u.lbl(R, 'Cover Note No'), u.lbl(R, 'Policy No'), p.getByText(d.ref || 'zz', { exact: true }).filter({ visible: true }).first()], name: 'E7-cover-note-policy-ref' });
  R.note(`Transaction Details: Insurer "${d.insurer}"; Premium After NCD ${d.afterNcd}; buttons ${JSON.stringify(d.btns)}`);
  const ec = p.getByRole('button', { name: /e-?Certificate/i }).filter({ visible: true }).first();
  let ecShows = 'no e-Certificate button';
  if (await ec.count()) {
    const dl = p.waitForEvent('download', { timeout: 30000 }).catch(() => null); const pp = R.ctx.waitForEvent('page', { timeout: 30000 }).catch(() => null);
    await R.click(ec, 'e-Certificate');
    const got = await Promise.race([dl, pp]);
    if (got && got.saveAs) { const f = `${R.dir}/downloadable/e-certificate-${o.ref}.pdf`; await got.saveAs(f); const t = u.pdfText(f); ecShows = `e-Certificate file saved; plate ${o.row['Vehicle No']} in it: ${t.includes(o.row['Vehicle No'])}`; }
    else if (got) { await got.waitForLoadState().catch(() => {}); ecShows = 'e-Certificate opened ' + got.url(); }
  }
  await R.prove('E8', { shows: `Buttons ${JSON.stringify(d.btns)}; ${ecShows}`, match: d.btns.some((b) => /e-?Certificate/i.test(b)) && d.btns.some((b) => /Receipt/i.test(b)) && /plate .* true|opened/.test(ecShows), hl: p.getByText(new RegExp('Ref\\. No: ' + o.ref)).first(), name: 'E8-buttons' });
}
