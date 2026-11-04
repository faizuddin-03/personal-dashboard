// 12406_RC_TS2 rerun (board FAIL on E1/E2, D1 = EAINT-12764). CIBO receipt of the E2E_TS1 purchase of 29.10
// (BR60006349 / HXA0011A; its Secarang receipt: No 26102921300027, Total Premium RM941.13, per Azfar's DRAFTS.md).
export const ts = '12406_RC_TS2_rerun-20261104';
export const situation = 'Rerun: CIBO user opens the receipt of an Allianz transaction (BR60006349)';
export const pointsFrom = '12406_RC_TS2';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  await u.cibo(R, cfg, 'BR60006349', 'Allianz transaction of E2E_TS1 (29.10)');
  const d = await u.ciboOpen(R, 'BR60006349');
  R.note(`BR60006349 Transaction Details: status ${d.status}; Insurer "${d.insurer}"; Cover Note ${d.cover}; Policy ${d.policy}; Ref ID ${d.ref}; Premium After NCD ${d.afterNcd}; buttons ${JSON.stringify(d.btns)}`);
  await R.shot('br60006349-details', `Transaction Details BR60006349: ${d.status}`, u.lbl(R, 'Insurer'));
  const f = await R.download(p.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first(), 'cibo-receipt-BR60006349.pdf', 'Receipt (CIBO)');
  const t = u.pdfText(f); const rf = u.receiptFields(t);
  await u.showPdf(R, f, 'CIBO receipt BR60006349');
  await R.shot('br60006349-receipt-pdf', 'CIBO receipt PDF BR60006349 as rendered by Chrome');
  const total = rf.money[rf.money.length - 1];
  await u.showLines(R, 'CIBO receipt BR60006349 (pdftotext)', [
    ['Insurer line 1', rf.insurer[0] || '-', 'l1'], ['Insurer line 2', rf.insurer[1] || '-', 'l2'],
    ['Receipt No.', rf.receiptNo || '-', 'rn'], ['Vehicle Plate No.', rf.plate || '-', 'pl'], ['Total Premium', total || '-', 'tp'],
    ['Agent', rf.hasAgent ? 'Exclusively by agent Serba Sentral Sdn Bhd' : '(not found)', 'ag'], ['PIAM ID', rf.piam || '-', 'pi']]);
  await R.prove('E1', { shows: `Insurer line 1: "${rf.insurer[0]}"`, match: rf.insurer[0] === 'Allianz General Insurance Company (Malaysia) Berhad', hl: p.locator('#l1'), name: 'E1-receipt-insurer-line1' });
  await R.prove('E2', { shows: `Insurer line 2: "${rf.insurer[1]}"`, match: rf.insurer[1] === '200601015674 (735426-V)', hl: p.locator('#l2'), name: 'E2-receipt-insurer-line2' });
  await R.prove('E3', { shows: `Receipt No ${rf.receiptNo}, plate ${rf.plate}, Total ${total}; Secarang receipt of E2E_TS1 (29.10): 26102921300027, HXA0011A, RM941.13`, match: rf.receiptNo === '26102921300027' && rf.plate === 'HXA0011A' && /941\.13/.test(total || ''), hl: [p.locator('#rn'), p.locator('#pl'), p.locator('#tp')], name: 'E3-receipt-no-plate-total' });
  await R.prove('E4', { shows: `Agent line present: ${rf.hasAgent}; PIAM ID ${rf.piam}`, match: rf.hasAgent, hl: [p.locator('#ag'), p.locator('#pi')], name: 'E4-agent-line' });
}
