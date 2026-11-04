// 12406_E2E_TS10 on the real API (board PASS on the simulator): pick Allianz, go back via Confirmation's plan Edit, buy
// Tokio Marine instead. Row 28 DDX7331 (all three quote; Tokio Marine ~RM2,079, so PayLater by Grab, FPX limit 2,000).
import { NAME } from './e2e-purchase.mjs';
export const ts = process.env.TSNAME || '12406_E2E_TS10_real-20261104';
export const situation = 'Real API: customer picks Allianz, goes back and buys Tokio Marine: receipt and CIBO show Tokio Marine only';
export const pointsFrom = '12406_E2E_TS10';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  const PL = process.env.PLATE || 'DDX7331', IC = process.env.IC || '951230026083';
  R.note(`Data: checker xlsx ${process.env.ROW || 'row 28'} (real plate/IC) ${PL}, postcode 55000; Full Name ` + NAME);
  let st = await u.quote(R, cfg, { plate: PL, ic: IC }); if (st === 'car-details') st = await u.carDetails(R);
  if (st !== 'quotations') throw new Error('quote: ' + st);
  await R.shot('all-quotations', 'All Quotations: ' + (await u.cards(R)).map((c) => `${c.insurer} ${(c.text.match(/RM[\d,.]+/g) || []).pop()}`).join(' | '), p.locator('.insurance-card').filter({ visible: true }));
  await u.buy(R, 'Allianz');
  await R.shot('allianz-addons', 'Allianz Add-ons; price bar ' + await u.priceBar(R), u.addonCards(R).first());
  await u.continueToConfirmation(R);
  await R.shot('allianz-confirmation', 'Confirmation for Allianz', u.row(R, 'Total Premium'));
  // plan Edit → Change → All Quotations
  const planEdit = p.locator('a, button').filter({ hasText: /^\s*Edit\s*$/ }).filter({ visible: true }).first();
  await R.click(planEdit, 'Edit (insurance plan)');
  await p.waitForTimeout(2500);
  const m = p.locator('ngb-modal-window').filter({ visible: true }).last();
  if (await m.count()) { R.note('plan Edit pop-up: ' + (await m.innerText()).replace(/\s+/g, ' ').slice(0, 200)); await R.shot('plan-edit-popup', 'Pop-up after plan Edit', m); const ch = m.getByRole('button', { name: /^\s*Change\s*$/i }).first(); if (await ch.count()) await R.click(ch, 'Change'); }
  await p.locator('.insurance-card').filter({ visible: true }).first().waitFor({ timeout: 90000 }); await p.waitForTimeout(6000);
  await u.buy(R, 'Tokio Marine');
  await R.shot('tokio-addons', 'Tokio Marine Add-ons; price bar ' + await u.priceBar(R), u.addonCards(R).first());
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  const confBody = await R.text('body', 12000); const conf = await u.pricing(R);
  await u.confirmAndPay(R);
  const amt = +(conf.amount || '').replace(/[^\d.]/g, '');
  const res = amt <= 2000 ? await u.payFpx(R, cfg, 'RHB', '00') : await u.payGrab(R, cfg);
  R.note(`Total RM${amt}; payment: ${JSON.stringify(res)}`);
  if (res.where !== 'success') { await R.prove('E1', { shows: `Total RM${amt}: payment did not settle: ${JSON.stringify(res)}`, match: false, name: 'E1-payment' }); return; }
  const sBody = await R.text('body', 12000); const s = await u.successInfo(R);
  const f = await R.download(u.receiptBtn(R), `receipt-${s.receiptNo}-tokio-marine.pdf`, 'Download [Receipt]');
  const rt = u.pdfText(f); const rf = u.receiptFields(rt);
  await u.showPdf(R, f, 'Tokio Marine receipt ' + s.receiptNo); await R.shot('receipt-pdf', 'Tokio Marine receipt PDF');
  await u.cibo(R, cfg, PL, 'the Tokio Marine purchase');
  let row; for (let k = 0; k < 6; k++) { const r = await u.ciboSearch(R, PL); row = r.rows.map((c) => Object.fromEntries(r.heads.map((h, i) => [h, c[i]]))).find((x) => /Tokio/i.test(x['Ins. Co.'] || '') && /Paid/.test(x['Payment'] || '')); if (row && /Insurance created|Failed/.test(row['Transaction Status'])) break; await R.offscreen('Waiting for the insurer', '30 s'); await p.waitForTimeout(30000); }
  const ref = (row?.['Transaction Ref. No.'] || '').split(' ')[0];
  const d = ref ? await u.ciboOpen(R, ref) : null;
  await u.showLines(R, 'Tokio Marine purchase after switching from Allianz', [
    ['Confirmation names Allianz', String(/Allianz/.test(confBody)), 'c1'], ['Success page names Allianz', String(/Allianz/.test(sBody)), 'c2'], ['Confirmation Total', conf.amount],
    ['Receipt Insurer', rf.insurer.join(' / '), 'ri'], ['Receipt mentions Allianz / 735426', `${/Allianz/.test(rt)} / ${/735426/.test(rt)}`, 'ra'],
    ['CIBO row', row ? `${ref}: ${row['Ins. Co.']} · ${row['Payment']} · ${row['Transaction Status']}` : 'not found', 'cr'], ['CIBO Transaction Details Insurer', d?.insurer || '-', 'ci'], ['Cover Note / Policy', d ? `${d.cover} / ${d.policy}` : '-']]);
  await R.prove('E1', { shows: `Confirmation and Success name Allianz: ${/Allianz/.test(confBody)} / ${/Allianz/.test(sBody)}; Tokio Marine ${conf.amount}`, match: !/Allianz/.test(confBody) && !/Allianz/.test(sBody) && /Tokio Marine/.test(confBody), hl: [p.locator('#c1'), p.locator('#c2')], name: 'E1-tokio-only' });
  await R.prove('E2', { shows: `Receipt Insurer "${rf.insurer[0]}" / "${rf.insurer[1]}"; Allianz number on receipt: ${/735426/.test(rt)}`, match: rf.insurer[0] === 'Tokio Marine Insurans (Malaysia) Berhad' && rf.insurer[1] === '198601000381 (149520-U)' && !/735426/.test(rt), hl: [p.locator('#ri'), p.locator('#ra')], name: 'E2-receipt-tokio' });
  await R.prove('E3', { shows: `CIBO ${ref}: Ins. Co. "${row?.['Ins. Co.']}"; Details Insurer "${d?.insurer}"`, match: /Tokio/i.test(row?.['Ins. Co.'] || '') && /Pemaju Eksklusif/.test(row?.['Ins. Co.'] || '') && /^Tokio Marine Insurans \(Malaysia\) Berhad 198601000381 \(149520-U\)$/.test((d?.insurer || '').replace(/\s+/g, ' ').trim()), hl: [p.locator('#cr'), p.locator('#ci')], name: 'E3-cibo-tokio' });
}
