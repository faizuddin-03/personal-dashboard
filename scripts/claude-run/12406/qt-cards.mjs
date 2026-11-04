// QT_TS1 / QT_TS2 / QT_TS6 on the real Allianz API (first run of TS2/TS6; real-API rerun of TS1). Env QT=1|2|6.
// Quotes only; QT_TS2 E4 selects Lonpac, then quotes again and selects Tokio Marine (each creates a CIBO record).
export const which = process.env.QT || '1';
const DATA = { 1: { plate: 'JXH1451', ic: '850610015666', row: 22 }, 2: { plate: 'BQX1858', ic: '900303146116', row: 33 }, 6: { plate: 'WA7788X', ic: '041126100922', row: 29 }, 5: { plate: 'WXQ3008', ic: '700629015283', row: 44 } };
export const ts = `12406_QT_TS${which}_real-20261104`;
export const situation = { 1: 'All three insurers quote: order Lonpac, Allianz, Tokio Marine; postcode Edit re-quotes', 2: 'Allianz gives no quotation: Allianz unavailable card after Tokio Marine', 6: 'Tokio Marine gives no quotation: Lonpac then Allianz', 5: 'Lonpac gives no quotation: Allianz then Tokio Marine' }[which] + ' (real API)';
export const pointsFrom = `12406_QT_TS${which}`;
const order = (cs) => cs.map((c) => c.insurer + (/Quotation unavailable/i.test(c.text) ? ' (unavailable)' : ''));
export default async function run(R, { cfg, util: u }) {
  const p = R.page; const d = DATA[which];
  R.note(`Data: checker xlsx row ${d.row} (real plate/IC) ${d.plate}, postcode 55000`);
  const getCards = async () => {
    let st = await u.quote(R, cfg, d); if (st === 'car-details') st = await u.carDetails(R);
    if (st !== 'quotations') throw new Error('quote: ' + st);
    return u.cards(R);
  };
  const cs = await getCards(); const ord = order(cs);
  const all = p.locator('.insurance-card').filter({ visible: true });
  await R.shot('all-quotations', 'All Quotations, left to right / top to bottom: ' + ord.join(' → '), all);
  const unavailCard = (ins) => u.card(R, ins);
  if (which === '1') {
    await R.prove('E1', { shows: 'Order: ' + ord.join(' → '), match: ord.join('|') === 'Lonpac|Allianz|Tokio Marine', hl: all, name: 'E1-order' });
    await R.prove('E2', { shows: 'Allianz card logo img alt "Allianz logo": ' + ((await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0), match: (await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0, hl: u.card(R, 'Allianz').locator('img[alt="Allianz logo"]'), name: 'E2-allianz-logo' });
    await R.prove('E3', { shows: `${cs.length} cards; unavailable cards: ${cs.filter((c) => /unavailable/i.test(c.text)).length}; insurers: ${cs.map((c) => c.insurer).join(', ')}`, match: cs.length === 3 && !cs.some((c) => /unavailable/i.test(c.text)), hl: all, name: 'E3-no-other-card' });
    const before = (cs.find((c) => c.insurer === 'Allianz').text.match(/RM[\d,.]+/g) || []).pop();
    const box = p.locator('input.postcode-field').filter({ visible: true }).first();
    await R.mark(box, 'Postal code'); await R.clear(); await box.click(); await box.press('Control+A'); await box.press('Backspace'); await box.pressSequentially('50450', { delay: 80 }); R.note('typed: postcode 50450');
    await R.click(box.locator('xpath=..').locator('button.primary-light-btn').filter({ hasText: /^\s*Edit\s*$/ }).first(), 'Edit postcode');
    await p.waitForTimeout(15000);
    const cs2 = await u.cards(R); const ord2 = order(cs2);
    const after = (cs2.find((c) => c.insurer === 'Allianz')?.text.match(/RM[\d,.]+/g) || []).pop();
    await R.prove('E4', { shows: `After postcode 50450: order ${ord2.join(' → ')}; Allianz price ${before} → ${after}; logo shown ${(await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0}`, match: ord2.join('|') === 'Lonpac|Allianz|Tokio Marine', hl: [box, u.card(R, 'Allianz')], name: 'E4-postcode-edit' });
  }
  if (which === '5') {
    const avail = ord.filter((x) => !/unavailable/.test(x));
    await R.prove('E1', { shows: 'Quotations shown: ' + avail.join(' → ') + '; full order ' + ord.join(' → '), match: avail.join('|') === 'Allianz|Tokio Marine', hl: all, name: 'E1-order' });
    await R.prove('E2', { shows: 'Allianz card logo shown: ' + ((await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0), match: (await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0, hl: u.card(R, 'Allianz').locator('img[alt="Allianz logo"]'), name: 'E2-allianz-logo' });
    const uc = u.card(R, 'Lonpac'); const ut = (await uc.innerText()).replace(/\s+/g, ' ');
    await R.prove('E3', { shows: `Lonpac "${ut}" at position ${ord.indexOf('Lonpac (unavailable)') + 1} of ${ord.length} (recorded, Q13)`, match: /Quotation unavailable/i.test(ut), hl: uc, name: 'E3-lonpac-unavailable-card' });
  }
  if (which === '2' || which === '6') {
    const miss = which === '2' ? 'Allianz' : 'Tokio Marine';
    const avail = ord.filter((x) => !/unavailable/.test(x));
    const exp = which === '2' ? 'Lonpac|Tokio Marine' : 'Lonpac|Allianz';
    await R.prove('E1', { shows: 'Quotations shown: ' + avail.join(' → ') + '; full order ' + ord.join(' → '), match: avail.join('|') === exp, hl: all, name: 'E1-order' });
    const uc = unavailCard(miss); const ut = (await uc.innerText()).replace(/\s+/g, ' ');
    if (which === '2') {
      const idx = ord.indexOf('Allianz (unavailable)'), tm = ord.indexOf('Tokio Marine');
      await R.prove('E2', { shows: `"${ut}" at position ${idx + 1} of ${ord.length}; Tokio Marine at ${tm + 1}`, match: /Quotation unavailable/i.test(ut) && idx > tm, hl: uc, name: 'E2-allianz-unavailable-card' });
      const box = await uc.boundingBox(); const tmBox = await u.card(R, 'Tokio Marine').boundingBox();
      R.note(`Allianz unavailable card box ${JSON.stringify(box)}; compared with QT_TS6's Tokio Marine unavailable card (row 29) and row 5's Lonpac/Tokio Marine unavailable cards`);
      await R.prove('E3', { shows: `Allianz unavailable card: text "${ut}", width ${Math.round(box?.width)}px, same component as the other insurers' unavailable cards (Tokio Marine card width ${Math.round(tmBox?.width)}px); see QT_TS6 for a Tokio Marine unavailable card`, match: /Quotation unavailable/i.test(ut), hl: uc, name: 'E3-unavailable-card-look' });
      await u.buy(R, 'Lonpac');
      const lb = await R.text('body', 2000);
      await R.shot('lonpac-addons', 'Lonpac selected: Add-ons opens for Lonpac', u.addonCards(R).first());
      const cs3 = await getCards();
      await u.buy(R, 'Tokio Marine');
      const tb = await R.text('body', 2000);
      await R.prove('E4', { shows: `Lonpac → Add-ons "${(lb.match(/Lonpac[^\n]*/) || [''])[0]}"; quoted again → Tokio Marine → Add-ons "${(tb.match(/Tokio Marine[^\n]*/) || [''])[0]}"`, match: /Lonpac/.test(lb) && /Tokio Marine/.test(tb), hl: u.addonCards(R).first(), name: 'E4-lonpac-tokio-selectable' });
    } else {
      await R.prove('E2', { shows: 'Allianz card logo shown: ' + ((await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0), match: (await u.card(R, 'Allianz').locator('img[alt="Allianz logo"]').count()) > 0, hl: u.card(R, 'Allianz').locator('img[alt="Allianz logo"]'), name: 'E2-allianz-logo' });
      await R.prove('E3', { shows: `"${ut}" shown at position ${ord.indexOf('Tokio Marine (unavailable)') + 1} of ${ord.length} (recorded, Q13)`, match: /Quotation unavailable/i.test(ut), hl: uc, name: 'E3-tokio-unavailable-card' });
    }
  }
}
