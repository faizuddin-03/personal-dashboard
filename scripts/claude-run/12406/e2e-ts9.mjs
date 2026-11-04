// 12406_E2E_TS9 on the real API (board PASS on the simulator, but E4 gender re-pricing "judged only on a real-API (SIT)
// pass"). Row 22 JXH1451 (all three quote). Name "FAIZUDDIN TEST ALLIANZ". FPX RHB.
import { NAME } from './e2e-purchase.mjs';
export const ts = '12406_E2E_TS9_real-20261104';
export const situation = 'Real API: Tokio Marine first, back to Allianz; add-ons tick/untick; gender re-pricing; PIAM pop-up; same add-ons on receipt and CIBO';
export const pointsFrom = '12406_E2E_TS9';
const num = (s) => +(String(s || '').replace(/[^\d.]/g, '') || 0);
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  R.note('Data: checker xlsx row 22 (real plate/IC) JXH1451, postcode 55000; Full Name ' + NAME);
  let st = await u.quote(R, cfg, { plate: 'JXH1451', ic: '850610015666' }); if (st === 'car-details') st = await u.carDetails(R);
  if (st !== 'quotations') throw new Error('quote: ' + st);
  await R.shot('all-quotations', 'All Quotations: ' + (await u.cards(R)).map((c) => c.insurer).join(' → '), p.locator('.insurance-card').filter({ visible: true }));
  // Tokio Marine first, then back
  await u.buy(R, 'Tokio Marine');
  await R.shot('tokio-addons', 'Tokio Marine Add-ons; price bar ' + await u.priceBar(R), u.addonCards(R).first());
  const back = p.getByRole('button', { name: /Back to insurance selection/i }).filter({ visible: true }).first();
  await R.click(back.count ? back : p.getByText(/Back to insurance selection/i).first(), 'Back to insurance selection');
  await p.waitForTimeout(3000);
  const nav = p.locator('ngb-modal-window').filter({ visible: true }).last();
  let navText = '(no pop-up)';
  if (await nav.count()) { navText = (await nav.innerText()).replace(/\s+/g, ' ').slice(0, 200); await R.shot('navigation-popup', 'Pop-up: ' + navText, nav); const y = nav.getByRole('button', { name: /yes|confirm|ok|proceed|continue|leave/i }).first(); if (await y.count()) await R.click(y, 'Confirm navigation'); }
  R.note('After back from Tokio Marine: ' + navText);
  await p.locator('.insurance-card').filter({ visible: true }).first().waitFor({ timeout: 90000 }); await p.waitForTimeout(6000);
  const ac = u.card(R, 'Allianz');
  const sel = ac.locator('.sum-insured select, select').first();
  const opts = (await sel.count()) ? await sel.locator('option').evaluateAll((os) => os.map((o) => o.textContent.trim())) : [];
  const priceBefore = ((await ac.innerText()).match(/RM[\d,.]+/g) || []).pop();
  let e2 = `Allianz sum insured options: ${opts.length ? opts.join(', ') : '(no dropdown; one value: ' + ((await ac.innerText()).match(/coverage RM[\d,]+/i) || [''])[0] + ')'}`;
  if (opts.length > 1) { await sel.selectOption({ index: 1 }); await p.waitForTimeout(8000); e2 += `; changed to ${opts[1]}: price ${priceBefore} → ${((await ac.innerText()).match(/RM[\d,.]+/g) || []).pop()}`; await sel.selectOption({ index: 0 }); await p.waitForTimeout(8000); }
  await R.prove('E2', { shows: e2, match: true, hl: ac, name: 'E2-sum-insured' });
  await u.buy(R, 'Allianz');
  const addBody = await R.text('body', 3000);
  await R.prove('E1', { shows: `Add-ons after going back: "${(addBody.match(/Allianz - \w+/) || [''])[0]}"; Tokio Marine named: ${/Tokio Marine/.test(addBody)}; price bar ${await u.priceBar(R)}`, match: /Allianz/.test(addBody) && !/Tokio Marine/.test(addBody), hl: [p.locator('img[alt*="Allianz" i]').filter({ visible: true }).first(), p.locator('app-price-topbar').filter({ visible: true }).first()], name: 'E1-addons-allianz-after-back' });
  // add-ons: tick two, untick one
  const all = await u.addonCards(R).evaluateAll((cs) => cs.map((c) => ({ name: c.innerText.split('\n')[0].trim(), price: (c.innerText.match(/RM[\d,.]+/g) || []).pop(), added: /REMOVE/i.test(c.innerText) })));
  R.note('Add-ons offered: ' + all.map((a) => `${a.name} ${a.price}${a.added ? ' (added)' : ''}`).join(' | '));
  const bar = async () => { await p.waitForTimeout(1500); return num(await p.locator('app-price-topbar a.text-primary.pointer').filter({ hasText: /^\s*RM/ }).filter({ visible: true }).first().innerText().catch(() => '')); };
  const addOne = async (re) => { const c = p.locator('.addon-card').filter({ visible: true }).filter({ hasText: re }).first(); const price = num(((await c.innerText()).match(/RM[\d,.]+/g) || []).pop()); await R.click(c.getByRole('button', { name: /^\s*ADD\s*$/i }).first(), 'ADD ' + re.source); await p.waitForTimeout(5000); return price; };
  const b0 = await bar();
  const pA = await addOne(/Car Break-In/i); const b1 = await bar();
  const pB = await addOne(/Key Care/i); const b2 = await bar();
  await R.click(p.locator('.addon-card').filter({ visible: true }).filter({ hasText: /Key Care/i }).first().getByRole('button', { name: /REMOVE/i }).first(), 'REMOVE Key Care'); await p.waitForTimeout(5000); const b3 = await bar();
  await R.prove('E3', { shows: `Bar ${b0} → +Break-In (RM${pA}) ${b1} → +Key Care (RM${pB}) ${b2} → −Key Care ${b3}`, match: Math.abs(b1 - b0 - pA) < 0.02 && Math.abs(b2 - b1 - pB) < 0.02 && Math.abs(b3 - b1) < 0.02, hl: [p.locator('app-price-topbar').filter({ visible: true }).first(), p.locator('.addon-card').filter({ visible: true }).filter({ hasText: /Car Break-In/i }).first()], name: 'E3-tick-untick' });
  await u.continueToConfirmation(R);
  await u.fillOwner(R, cfg, NAME);
  const stars = await p.locator('label, .form-label, span').filter({ hasText: /\*/ }).filter({ visible: true }).evaluateAll((ls) => ls.slice(0, 12).map((l) => `${l.innerText.trim()} [${getComputedStyle(l).color}]`));
  const conf0 = await u.pricing(R);
  await R.shot('confirmation-required-agent', `Required "*": ${stars.join('; ').slice(0, 120)}; ${conf0.agent}; ${conf0.commission}`, p.locator('small.agent-text').filter({ visible: true }).first());
  // gender
  const g = p.locator("select[formcontrolname='gender']").filter({ visible: true }).first();
  const g0 = await g.inputValue(); const t0 = conf0.amount;
  const other = /FEMALE/i.test(g0) ? 'MALE' : 'FEMALE';
  await R.mark(g, 'Gender'); await R.clear(); await g.selectOption({ label: other }).catch(() => g.selectOption(other)); R.note(`Gender ${g0} → ${other}`);
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(1500); if (!(await p.locator('.pricing-details .spinner-border, .pricing-details [role=status]').filter({ visible: true }).count())) break; }
  await p.waitForTimeout(3000);
  const t1 = (await u.pricing(R)).amount;
  await R.prove('E4', { shows: `Gender ${g0} → ${other}: Total Amount ${t0} → ${t1} (recorded; real API)`, match: true, hl: [g, u.row(R, 'Total Amount')], name: 'E4-gender-reprice' });
  await g.selectOption({ label: g0 }).catch(() => g.selectOption(g0)); await p.waitForTimeout(6000);
  R.note(`Gender set back to ${g0}: Total ${(await u.pricing(R)).amount}`);
  // PIAM 'i'
  const prow = p.locator('.pricing-details .row').filter({ has: p.locator('small.agent-text') }).last();
  const ib = prow.locator('i.bi-info-circle').first();
  await R.click(ib, "PIAM ID 'i'");
  const pm = p.locator('ngb-modal-window, ngb-popover-window, ngb-tooltip-window, .popover.show, .tooltip.show').filter({ visible: true }).last();
  if (!(await pm.waitFor({ timeout: 4000 }).then(() => true).catch(() => false))) { await ib.hover(); await pm.waitFor({ timeout: 5000 }); }
  const pmt = (await pm.innerText()).replace(/\s+/g, ' ');
  await R.prove('E5', { shows: 'PIAM pop-up: ' + pmt.slice(0, 260), match: /Serba Sentral/i.test(pmt) && !/Pemaju|Bintang/i.test(pmt), hl: pm, name: 'E5-piam-popup' });
  const cb = p.getByRole('button', { name: /^\s*(Close|OK)\s*$/i }).filter({ visible: true }).last(); if (await cb.count()) await R.click(cb, 'Close'); else await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  const conf = await u.pricing(R);
  const confAdd = ((await R.text('body', 12000)).match(/Add-Ons\s*\n\s*Edit\s*\n([\s\S]*?)\n\s*Gross Premium/) || [])[1]?.replace(/\s+/g, ' ').trim();
  await u.confirmAndPay(R);
  const res = await u.payFpx(R, cfg, 'RHB', '00'); R.note('payment: ' + JSON.stringify(res));
  if (res.where !== 'success') { await R.prove('E6', { shows: 'payment did not settle: ' + JSON.stringify(res), match: false, name: 'E6-payment' }); return; }
  const s = await u.successInfo(R);
  const f = await R.download(u.receiptBtn(R), `receipt-${s.receiptNo}.pdf`, 'Download [Receipt]');
  const rt = u.pdfText(f); const rf = u.receiptFields(rt);
  await u.showPdf(R, f, 'Secarang receipt ' + s.receiptNo); await R.shot('receipt-pdf', 'Receipt PDF');
  const rcAdd = /Car Break-In[\s\S]{0,80}RM ?3\.00|RM ?3\.00[\s\S]{0,200}Car Break-In/.test(rt) || (/Car Break-In/.test(rt) && /RM 3\.00/.test(rt));
  await u.cibo(R, cfg, 'JXH1451', 'E2E_TS9 purchase');
  let row; for (let k = 0; k < 6; k++) { const r = await u.ciboSearch(R, 'JXH1451'); row = r.rows.map((c) => Object.fromEntries(r.heads.map((h, i) => [h, c[i]]))).find((x) => /Allianz/.test(x['Ins. Co.'] || '')); if (row && /Insurance created|Failed/.test(row['Transaction Status'])) break; await R.offscreen('Waiting for the insurer', '30 s'); await p.waitForTimeout(30000); }
  const ref = (row?.['Transaction Ref. No.'] || '').split(' ')[0];
  const d = ref ? await u.ciboOpen(R, ref) : null;
  const ciboAdd = d ? (d.body.match(/Add-ons\s*\n([\s\S]*?)\n\s*Gross Premium/) || [])[1]?.replace(/\s+/g, ' ').trim() : '';
  await u.showLines(R, 'Add-ons and insurer: Confirmation vs receipt vs CIBO', [['Confirmation add-ons', confAdd, 'ca'], ['Receipt has "Car Break-In" with RM3.00', String(rcAdd), 'ra'], ['CIBO add-ons', ciboAdd, 'cb'],
    ['Receipt insurer', rf.insurer.join(' / '), 'ri'], ['CIBO insurer / status', d ? `${d.insurer} / ${d.status}` : '-', 'ci'], ['Tokio Marine named on receipt / CIBO', `${/Tokio Marine/.test(rt)} / ${d ? /Tokio Marine/.test(d.body) : '-'}`, 'tm']]);
  await R.prove('E6', { shows: `Confirmation: ${confAdd}; receipt Break-In RM3.00: ${rcAdd}; CIBO: ${ciboAdd}`, match: /Car Break-In/.test(confAdd || '') && rcAdd && /Car Break-In/.test(ciboAdd || '') && !/Key Care/.test((confAdd || '') + (ciboAdd || '')), hl: [p.locator('#ca'), p.locator('#ra'), p.locator('#cb')], name: 'E6-addons-everywhere' });
  await R.prove('E7', { shows: `Receipt "${rf.insurer.join(' / ')}"; CIBO "${d?.insurer}" (${ref}, ${d?.status}); Tokio Marine named: receipt ${/Tokio Marine/.test(rt)}, CIBO ${d ? /Tokio Marine/.test(d.body) : '-'}`, match: /Allianz/.test(rf.insurer.join(' ')) && /Allianz/.test(d?.insurer || '') && !/Tokio Marine/.test(rt) && !(d && /Tokio Marine/.test(d.body)), hl: [p.locator('#ri'), p.locator('#ci'), p.locator('#tm')], name: 'E7-allianz-not-tokio' });
  if (d) R.note(`Transaction Details ${ref}: status ${d.status}; Cover ${d.cover}; Policy ${d.policy}; Ref ${d.ref}; Premium After NCD ${d.afterNcd}; Gross per Confirmation ${conf.gross}`);
}
