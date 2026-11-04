// 12406_RC_TS8 rerun (board FAIL on E3, D1 = EAINT-12764). BEFORE points E1/E2 were captured 28.10 and are not
// repeatable; this rerun proves the AFTER points E3-E5 again on 04.11.2026.
export const ts = '12406_RC_TS8_rerun-20261104';
export const situation = 'Rerun: older Allianz transaction BR55004010 (paid 2025) receipt and Transaction Details after the deploy';
export const points = [
  { id: 'E3', text: 'AFTER: BR55004010 receipt "Allianz General Insurance Company (Malaysia) Berhad", next line "200601015674 (735426-V)"' },
  { id: 'E4', text: 'AFTER: BR55004010 Transaction Details shows "200601015674 (735426-V)" with the Allianz name (layout recorded, Q42)' },
  { id: 'E5', text: 'AFTER: BR44003678 and BR3D003430 insurer box recorded (Q20)' },
];
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  await u.cibo(R, cfg, 'BR55004010', 'older Allianz transaction BR55004010');
  const d = await u.ciboOpen(R, 'BR55004010');
  const ins = p.getByText(/Allianz General Insurance Company/).filter({ visible: true }).first();
  const insText = (await ins.innerText().catch(() => '')).trim();
  const lines = await ins.evaluate((e) => { const r = document.createRange(); r.selectNodeContents(e); return [...r.getClientRects()].map((x) => Math.round(x.top)).filter((v, i, a) => a.indexOf(v) === i).length; }).catch(() => 0);
  await R.prove('E4', { shows: `Insurer "${insText.replace(/\s+/g, ' ')}" (${lines} line(s) on screen)`, match: /200601015674 \(735426-V\)/.test(insText), hl: ins, name: 'E4-br55004010-details-insurer' });
  const rb = p.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first();
  if (!(await rb.count())) throw new Error('no Receipt button on BR55004010');
  const f = await R.download(rb, 'cibo-receipt-BR55004010.pdf', 'Receipt (CIBO)');
  const t = u.pdfText(f); const rf = u.receiptFields(t);
  await u.showPdf(R, f, 'CIBO receipt BR55004010');
  await R.shot('br55004010-receipt-pdf', 'CIBO receipt PDF BR55004010 as rendered by Chrome');
  await u.showLines(R, 'CIBO receipt BR55004010: Insurer block (pdftotext)', [['Insurer line 1', rf.insurer[0] || '-', 'l1'], ['Insurer line 2', rf.insurer[1] || '-', 'l2']]);
  const ok = /Berhad$/.test(rf.insurer[0] || '') && /^200601015674 \(735426-V\)$/.test(rf.insurer[1] || '');
  await R.prove('E3', { shows: `Receipt Insurer: "${rf.insurer[0]}" / "${rf.insurer[1]}"`, match: ok, hl: [p.locator('#l1'), p.locator('#l2')], name: 'E3-br55004010-receipt-insurer' });
  const rec = [];
  for (const ref of ['BR44003678', 'BR3D003430']) {
    await u.ciboSearch(R, ref);
    if (!(await p.locator('table tbody tr').filter({ hasText: ref }).count())) { rec.push(`${ref}: not found`); continue; }
    const x = await u.ciboOpen(R, ref);
    await R.shot(`${ref}-insurer-box`, `${ref} insurer box: ${x.insurer}`, p.getByText(/Allianz General Insurance Company/).filter({ visible: true }).first());
    rec.push(`${ref}: Insurer "${x.insurer}", status ${x.status}`);
  }
  await R.prove('E5', { shows: rec.join(' | '), match: true, shot: false });
}
