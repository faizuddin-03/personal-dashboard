// 12406_E2E_TS12 rerun on the real API (board BLOCKED, Q46: over MYR 2,000 on the Fiuu sandbox). Every add-on ticked;
// FPX when the total is ≤ RM2,000, else PayLater by Grab (e-wallet, no limit; it worked on E2E_TS3 today).
import { NAME } from './e2e-purchase.mjs';
export const ts = '12406_E2E_TS12_rerun-20261104';
export const situation = 'Rerun on the real API: Allianz purchase with every add-on ticked';
export const pointsFrom = '12406_E2E_TS12';
const money = (s) => +(String(s || '').replace(/[^\d.]/g, '') || 0);
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  const PL = process.env.PLATE || 'CDX9196', IC = process.env.IC || '021105110074';
  R.note(`Data: checker xlsx ${process.env.ROW || 'row 18'} (real plate/IC) ${PL}, postcode 55000; Full Name ` + NAME);
  let st = await u.quote(R, cfg, { plate: PL, ic: IC });
  if (st === 'car-details') st = await u.carDetails(R);
  if (st !== 'quotations') throw new Error('quote: ' + st);
  const cs = await u.cards(R);
  await R.shot('all-quotations', 'All Quotations: ' + cs.map((c) => `${c.insurer}: ${(c.text.match(/RM[\d,.]+/g) || []).join(' ')}`).join(' | '), p.locator('.insurance-card').filter({ visible: true }));
  if (!cs.some((c) => c.insurer === 'Allianz' && /RM/.test(c.text))) throw new Error('Allianz did not quote this car');
  await u.buy(R, 'Allianz');
  const list = await u.addonCards(R).evaluateAll((cs) => cs.map((c) => c.innerText.replace(/\s+/g, ' ').trim().slice(0, 110)));
  R.note('Add-ons offered: ' + list.join(' | '));
  await R.shot('addons-offered', `${list.length} add-ons offered; price bar ${await u.priceBar(R)}`, u.addonCards(R).first());
  for (let i = 0; i < 20; i++) {
    const add = p.locator('.addon-card').filter({ visible: true }).getByRole('button', { name: /^\s*ADD\s*$/i }).filter({ visible: true }).first();
    if (!(await add.count())) break;
    const name = (await add.locator('xpath=ancestor::*[contains(@class,"addon-card")][1]').innerText()).split('\n')[0].trim();
    await R.click(add, 'ADD ' + name);
    await p.waitForTimeout(2500);
    const m = p.locator('ngb-modal-window').filter({ visible: true }).last();
    if (await m.count()) {
      R.note(`pop-up after ADD ${name}: ${(await m.innerText()).replace(/\s+/g, ' ').slice(0, 200)}`);
      const go = m.getByRole('button', { name: /Apply|Select|Confirm|Save|OK/i }).filter({ visible: true }).first();
      if (await go.count()) await R.click(go, 'Apply in pop-up'); else await p.keyboard.press('Escape');
      await p.waitForTimeout(2500);
    }
    await p.waitForTimeout(1500);
  }
  const bar = await u.priceBar(R);
  const ticked = await u.addonCards(R).evaluateAll((cs) => cs.filter((c) => /REMOVE/i.test(c.innerText)).map((c) => c.innerText.split('\n')[0].trim()));
  await R.shot('addons-all-ticked', `${ticked.length} add-ons ticked; price bar ${bar}`, p.locator('app-price-topbar').filter({ visible: true }).first());
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  const conf = await u.pricing(R);
  const confText = await R.text('body', 12000);
  const confAddons = ((confText.match(/Add-Ons\s*\n\s*Edit\s*\n([\s\S]*?)\n\s*Gross Premium/) || [])[1] || '').split('\n').map((s) => s.trim()).filter(Boolean);
  await R.shot('confirmation-addons', `Confirmation add-ons (${confAddons.length / 2}) and Total ${conf.total}`, u.row(R, 'Gross Premium'));
  await u.confirmAndPay(R);
  const total = money(conf.amount);
  const pay = total <= 2000 ? 'fpx' : 'grab';
  R.note(`Total RM${total}: paying by ${pay === 'fpx' ? 'FPX (≤ RM2,000)' : 'PayLater by Grab (over RM2,000; FPX/card refuse > MYR 2,000)'}`);
  const res = pay === 'fpx' ? await u.payFpx(R, cfg, 'RHB', '00') : await u.payGrab(R, cfg);
  R.note('payment: ' + JSON.stringify(res));
  if (res.where !== 'success') { await R.prove('E1', { shows: `Total RM${total}, ${pay}: payment did not settle: ${JSON.stringify(res)}`, match: false, name: 'E1-payment' }); return; }
  const s = await u.successInfo(R);
  const rf = await R.download(u.receiptBtn(R), `receipt-${s.receiptNo}.pdf`, 'Download [Receipt]');
  const rt = u.pdfText(rf);
  const rTotal = ((rt.match(/RM [\d,]+\.\d\d/g) || []).pop() || '').replace(/\s/g, '');
  await u.showPdf(R, rf, 'Secarang receipt ' + s.receiptNo);
  await R.shot('receipt-pdf', 'Receipt PDF with every add-on');
  await u.cibo(R, cfg, PL, 'the all-add-ons purchase');
  let row; for (let k = 0; k < 6; k++) { const r = await u.ciboSearch(R, PL); row = r.rows.map((c) => Object.fromEntries(r.heads.map((h, i) => [h, c[i]]))).find((x) => /Allianz/.test(x['Ins. Co.'] || '')); if (row && /Insurance created|Failed/.test(row['Transaction Status'])) break; await R.offscreen('Waiting for the insurer', '30 s'); await p.waitForTimeout(30000); }
  const ref = (row?.['Transaction Ref. No.'] || '').split(' ')[0];
  const d = ref ? await u.ciboOpen(R, ref) : null;
  const ciboAddons = d ? ((d.body.match(/Add-ons\s*\n([\s\S]*?)\n\s*Gross Premium/) || [])[1] || '').split('\n').map((x) => x.trim()).filter(Boolean) : [];
  const rcAddonNames = ticked.filter((n) => rt.includes(n.slice(0, 18)));
  await u.showLines(R, 'All add-ons: Confirmation vs receipt vs CIBO', [
    ['Ticked on Add-ons', ticked.join(', '), 'tk'], ['Confirmation add-ons', confAddons.join(' · '), 'ca'], ['Receipt names found', `${rcAddonNames.length} of ${ticked.length}`, 'ra'],
    ['CIBO add-ons', ciboAddons.join(' · '), 'cb'], ['Confirmation Total Premium', conf.total, 'ct'], ['Receipt Total Premium', rTotal, 'rt'],
    ['CIBO row', row ? `${ref}: ${row['Payment']} · ${row['Transaction Status']} · ${row['Payment Mode']}` : 'not found', 'rw']]);
  await R.prove('E1', { shows: `Success, receipt ${s.receiptNo}, total RM${total} by ${pay}; CIBO ${ref}: ${row?.['Payment']} / ${row?.['Transaction Status']}`, match: !!s.receiptNo && /Paid/.test(row?.['Payment'] || '') && /Insurance created/.test(row?.['Transaction Status'] || ''), hl: p.locator('#rw'), name: 'E1-all-addons-purchase' });
  const same = confAddons.join('|') === ciboAddons.join('|') && rcAddonNames.length === ticked.length;
  await R.prove('E2', { shows: `Confirmation ${confAddons.length / 2} add-on lines; receipt has ${rcAddonNames.length}/${ticked.length} names; CIBO ${ciboAddons.length / 2} lines; Confirmation = CIBO: ${confAddons.join('|') === ciboAddons.join('|')}`, match: same, hl: [p.locator('#ca'), p.locator('#ra'), p.locator('#cb')], name: 'E2-addons-same' });
  await R.prove('E3', { shows: `Receipt Total Premium ${rTotal} vs Confirmation ${conf.total}`, match: rTotal === conf.total, hl: [p.locator('#ct'), p.locator('#rt')], name: 'E3-receipt-total' });
  if (d) R.note(`Transaction Details: Cover ${d.cover}; Policy ${d.policy}; Ref ${d.ref}; Premium After NCD ${d.afterNcd}`);
}
