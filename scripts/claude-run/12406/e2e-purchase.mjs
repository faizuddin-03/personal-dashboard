// Shared body for the E2E purchase reruns on the real API (E2E_TS1 FPX, E2E_TS2 card, E2E_TS3 PayLater by Grab).
// Name "FAIZUDDIN TEST ALLIANZ" (Faizuddin 04.11: Dev-style made-up name; "QA SECARANG TEST" is EAINT-12766).
export const NAME = 'FAIZUDDIN TEST ALLIANZ';
export async function purchase(R, cfg, u, { plate, ic, pay, discount, provePre = true }) {
  const pre = (id, o) => provePre ? R.prove(id, o) : R.shot(o.name, o.shows.slice(0, 160), o.hl);
  const p = R.page; const out = {};
  let st = await u.quote(R, cfg, { plate, ic });
  if (st === 'car-details') st = await u.carDetails(R);
  if (st !== 'quotations') throw new Error('quote: ' + st);
  const cs = await u.cards(R); out.cards = cs;
  await R.shot('all-quotations', 'All Quotations: ' + cs.map((c) => `${c.insurer}: ${(c.text.match(/RM[\d,.]+/g) || []).join(' ') || c.text.slice(0, 40)}`).join(' | '), p.locator('.insurance-card').filter({ visible: true }));
  if (!cs.some((c) => c.insurer === 'Allianz' && /RM/.test(c.text))) throw new Error('Allianz did not quote this car');
  await R.mark(u.card(R, 'Allianz').locator('img[alt="Allianz logo"]'), 'Allianz logo'); await R.clear();
  await u.buy(R, 'Allianz');
  const body = await R.text('body', 4000);
  const cardTxt = cs.find((c) => c.insurer === 'Allianz').text;
  out.cardPrice = (cardTxt.match(/RM[\d,.]+ NCD [\d.]+%( RM[\d,.]+)?/) || [''])[0];
  out.e1 = { shows: `Allianz card (${out.cardPrice}) selected; Add-ons "${(body.match(/Allianz - \w+/) || [''])[0]}"; other insurer named: ${/Tokio Marine|Lonpac/.test(body)}`, match: /Allianz/.test(body) && !/Tokio Marine|Lonpac/.test(body) };
  await pre('E1', { ...out.e1, hl: [p.locator('img[alt*="Allianz" i]').filter({ visible: true }).first(), u.addonCards(R).first()], name: 'E1-addons-allianz' });
  out.bar = await u.priceBar(R);
  await R.shot('addons-default', 'Add-ons kept at default; price bar ' + out.bar, p.locator('app-price-topbar').filter({ visible: true }).first());
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  if (discount) {
    const box = p.locator('div.w-100.position-relative').filter({ has: p.locator('span', { hasText: 'Discount code' }) }).locator('input').first();
    await R.fill(box, discount, 'Discount code ' + discount);
    await R.click(p.getByRole('button', { name: /Apply/i }).filter({ visible: true }).last(), 'Apply discount code');
    await p.waitForTimeout(4000);
    const t = await R.text('body', 9000);
    out.discount = ((t.match(/[^\n]*(invalid|not valid|not applicable|applied|success)[^\n]*/i) || [''])[0] + ' | discount line: ' + ((t.match(/Discount[^\n]*\n[^\n]*RM[\d,.]+/) || [''])[0])).replace(/\s+/g, ' ');
    await R.shot('discount-code', 'Discount code ' + discount + ': ' + out.discount.slice(0, 120), box);
  }
  out.conf = await u.pricing(R);
  await R.shot('confirmation-breakdown', `Basic ${out.conf.basic}, ${out.conf.ncd}, All Drivers ${out.conf.allDrivers}, Premium After NCD ${out.conf.afterNcd}, Gross ${out.conf.gross}, Total ${out.conf.total}, Amount ${out.conf.amount}`, u.row(R, 'Premium After NCD'));
  await R.shot('confirmation-agent', `${out.conf.agent}; ${out.conf.commission}`, p.locator('small.agent-text').filter({ visible: true }).first());
  const insurer = p.getByText(/Allianz General Insurance Company \(Malaysia\) Berhad/).filter({ visible: true }).first();
  const barAmt = (out.bar.match(/RM[\d,.]+/) || [''])[0];
  out.e2 = { shows: `Insurer Allianz; Gross Premium ${out.conf.gross} vs Add-ons bar ${barAmt}; Total Amount ${out.conf.amount}`, match: (await insurer.count()) > 0 && out.conf.gross === barAmt };
  await pre('E2', { ...out.e2, hl: [insurer, u.row(R, 'Gross Premium'), u.row(R, 'Total Amount')], name: 'E2-confirmation-allianz' });
  await u.confirmAndPay(R);
  out.tiles = await u.tiles(R).evaluateAll((ls) => ls.map((l) => l.innerText.trim()));
  out.payment = pay === 'card' ? await u.payCard(R, cfg) : pay === 'grab' ? await u.payGrab(R, cfg) : pay === 'shopee' ? await u.payShopee(R, cfg) : await u.payFpx(R, cfg, 'RHB', '00');
  R.note('payment: ' + JSON.stringify(out.payment));
  if (out.payment.where !== 'success') return out;
  out.success = await u.successInfo(R);
  out.receipt = await R.download(u.receiptBtn(R), `receipt-${out.success.receiptNo}.pdf`, 'Download [Receipt]');
  await R.shot('success-premium-after-ncd', `Success page: Premium After NCD ${out.success.afterNcd}, Gross ${out.success.gross}, Total ${out.success.total}`, u.row(R, 'Premium After NCD'));
  const rt = u.pdfText(out.receipt); out.rf = u.receiptFields(rt);
  out.receiptTotal = ((rt.match(/RM [\d,]+\.\d\d/g) || []).pop() || '').replace(/\s/g, '');
  await u.showPdf(R, out.receipt, 'Secarang receipt ' + out.success.receiptNo);
  await R.shot('receipt-pdf', 'Receipt PDF as rendered by Chrome');
  // CIBO: wait up to ~3 minutes for a final status, then up to 2 more for the cover note
  const plateRow = async () => { const r = await u.ciboSearch(R, plate); return r.rows.map((c) => Object.fromEntries(r.heads.map((h, k) => [h, c[k]]))).find((x) => /Allianz/.test(x['Ins. Co.'] || '')); };
  await u.cibo(R, cfg, plate, 'the purchase in the back office');
  let rowInfo;
  for (let k = 0; k < 6; k++) {
    rowInfo = await plateRow();
    if (rowInfo && /Insurance created|Failed/.test(rowInfo['Transaction Status'] || '')) break;
    await R.offscreen('Waiting for the insurer', `status "${rowInfo?.['Transaction Status']}", check again in 30 s`); await p.waitForTimeout(30000);
  }
  out.row = rowInfo;
  out.ref = ((rowInfo?.['Transaction Ref. No.']) || '').split(' ')[0];
  if (out.ref) {
    out.details = await u.ciboOpen(R, out.ref);
    for (let k = 0; k < 4 && /Insurance created/.test(out.details.status || '') && (out.details.cover || '-') === '-'; k++) {
      await R.offscreen('Waiting for the cover note', 'reload Transaction Details in 30 s'); await p.waitForTimeout(30000);
      await u.ciboSearch(R, plate); out.details = await u.ciboOpen(R, out.ref);
    }
  }
  return out;
}
