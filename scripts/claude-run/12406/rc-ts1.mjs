// 12406_RC_TS1 rerun (board FAIL: E1, E2, E4, E7 = D1 / EAINT-12764; E10 = D2 / EAINT-12765).
// "Receipt of E2E_TS1" = today's real-API E2E_TS1 receipt 26110421300001 (JLX8382, 04.11). E2E_TS2/3/4 receipts =
// the CIBO receipts of their 29.10 purchases (BR60006350 card, BR60006351 PayLater by Grab, BR60006352 SPayLater).
// Tokio Marine receipt = CIBO receipt of BR69005852. E9 (Success page print view) needs a new purchase: not repeated.
import path from 'node:path';
export const ts = '12406_RC_TS1_rerun-20261104';
export const situation = 'Rerun: Allianz receipt, Insurer block and Receipt Summary, against Tokio Marine';
export const pointsFrom = '12406_RC_TS1';
const RUN = 'C:/Users/faizu/Documents/GitHub/personal-dashboard/_reference/tickets/EAINT-12406/claude-run-2026-11-04';
const LABELS = ['Receipt No.', 'Purchase Date', 'Payment Method', 'For', 'Vehicle Plate No.', 'Ownership Type', 'Insurer', 'Coverage Type', 'Coverage Period', 'Basic Premium', 'Premium after NCD', 'Add-ons', 'Gross Premium', 'Service Tax 8%', 'Stamp Duty', 'Total Premium'];
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  const own = RUN + '/12406_E2E_TS1/downloadable/receipt-26110421300001.pdf';
  await u.showPdf(R, own, 'Secarang receipt of E2E_TS1 (real API, 04.11)');
  await R.shot('e2e-ts1-receipt-pdf', 'Secarang receipt 26110421300001 (JLX8382) as rendered by Chrome');
  const t = u.pdfText(own); const rf = u.receiptFields(t);
  const m = (re) => (t.match(re) || [])[1];
  const basic = m(/RM ([\d,.]+)\s*\n[\s\S]{0,200}?Basic Premium/) || '551.12';
  const vals = [...t.matchAll(/RM ([\d,]+\.\d\d)/g)].map((x) => +x[1].replace(/,/g, ''));
  // receipt order (pdftotext -layout): Basic, NCD, All Drivers, Premium after NCD, Gross, SST, Stamp, Total
  const [b, ncd, ad, after, gross, sst, stamp, total] = vals;
  await u.showLines(R, 'Secarang receipt 26110421300001 (pdftotext)', [
    ['Insurer line 1', rf.insurer[0], 'l1'], ['Insurer line 2', rf.insurer[1], 'l2'], ['For', (t.match(/For\s*\n\s*([^\n]+)/) || [])[1]?.split(/\s{3,}/)[0], 'for'],
    ['Vehicle Plate No.', rf.plate, 'pl'], ['Basic Premium', b], ['NCD', '- ' + ncd], ['All Drivers', ad], ['Premium after NCD', after, 'pan'],
    ['Basic - NCD + All Drivers', (b - ncd + ad).toFixed(2), 'sum'], ['Gross Premium', gross], ['Total Premium', total, 'tot'], ['Agent', rf.hasAgent ? 'Exclusively by agent Serba Sentral Sdn Bhd' : '(missing)', 'ag'], ['PIAM ID', rf.piam]]);
  await R.prove('E1', { shows: `Insurer line 1: "${rf.insurer[0]}"`, match: rf.insurer[0] === 'Allianz General Insurance Company (Malaysia) Berhad', hl: p.locator('#l1'), name: 'E1-insurer-line1' });
  await R.prove('E2', { shows: `Insurer line 2: "${rf.insurer[1]}"`, match: rf.insurer[1] === '200601015674 (735426-V)', hl: p.locator('#l2'), name: 'E2-insurer-line2' });
  const oldForm = /Berhad \(735426-V\)/.test(t);
  await R.prove('E3', { shows: `Old one-line form "…Berhad (735426-V)" present: ${oldForm}`, match: !oldForm, hl: [p.locator('#l1'), p.locator('#l2')], name: 'E3-old-form-gone' });
  const forName = (t.match(/For\s*\n\s*([^\n]+)/) || [])[1]?.split(/\s{3,}/)[0];
  await R.prove('E5', { shows: `Plate ${rf.plate}, For "${forName}", Total RM${total}; purchase E2E_TS1 04.11: JLX8382, QA SECARANG TEST, RM398.65`, match: rf.plate === 'JLX8382' && /QA SECARANG TEST/.test(forName || '') && total === 398.65, hl: [p.locator('#pl'), p.locator('#for'), p.locator('#tot')], name: 'E5-plate-owner-total' });
  await R.prove('E6', { shows: `Agent line: ${rf.hasAgent}; PIAM ID ${rf.piam}`, match: rf.hasAgent, hl: p.locator('#ag'), name: 'E6-agent-line' });
  const calc = +(b - ncd + ad).toFixed(2);
  await R.prove('E10', { shows: `Basic ${b} - NCD ${ncd} + All Drivers ${ad} = ${calc.toFixed(2)}; receipt "Premium after NCD" ${after}; Confirmation (04.11) RM359.88`, match: after === calc && calc === 359.88, hl: [p.locator('#pan'), p.locator('#sum')], name: 'E10-premium-after-ncd' });

  // CIBO: Tokio Marine receipt (E4, E8) and the 29.10 receipts of E2E_TS2/3/4 (E7)
  await u.cibo(R, cfg, 'BR69005852', 'Tokio Marine receipt for comparison');
  await u.ciboOpen(R, 'BR69005852');
  const tmF = await R.download(p.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first(), 'cibo-receipt-BR69005852-tokio-marine.pdf', 'Receipt (CIBO, Tokio Marine)');
  const tmT = u.pdfText(tmF); const tm = u.receiptFields(tmT);
  await u.showPdf(R, tmF, 'Tokio Marine receipt BR69005852');
  await R.shot('tokio-marine-receipt-pdf', 'Tokio Marine CIBO receipt BR69005852 as rendered by Chrome');
  const ch = [];
  for (const [ref, label] of [['BR60006350', 'E2E_TS2 card'], ['BR60006351', 'E2E_TS3 PayLater by Grab'], ['BR60006352', 'E2E_TS4 SPayLater']]) {
    await u.ciboSearch(R, ref);
    if (!(await p.locator('table tbody tr').filter({ hasText: ref }).count())) { ch.push([label + ' ' + ref, 'not found']); continue; }
    await u.ciboOpen(R, ref);
    const rb = p.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first();
    if (!(await rb.count())) { ch.push([label + ' ' + ref, 'no Receipt button']); continue; }
    const f = await R.download(rb, `cibo-receipt-${ref}.pdf`, `Receipt (CIBO, ${label})`);
    const x = u.receiptFields(u.pdfText(f));
    ch.push([label + ' ' + ref, `"${x.insurer[0]}" / "${x.insurer[1]}"`]);
  }
  const labelsA = LABELS.filter((l) => t.includes(l)), labelsT = LABELS.filter((l) => tmT.includes(l));
  const diff = LABELS.filter((l) => labelsA.includes(l) !== labelsT.includes(l));
  await u.showLines(R, 'Insurer blocks and labels: Allianz vs Tokio Marine', [
    ['Allianz (26110421300001)', `${rf.insurer[0]}\n${rf.insurer[1]}`, 'al'], ['Tokio Marine (BR69005852)', `${tm.insurer[0]}\n${tm.insurer[1]}`, 'tm'],
    ...ch.map(([k, v], i) => [k, v, 'c' + i]),
    ['Labels only on one receipt', diff.join(', ') || '(none: same labels)', 'lb']]);
  const tmOk = /^198601000381/.test(tm.insurer[1] || '');
  await R.prove('E4', { shows: `Allianz "${rf.insurer[0]}" / "${rf.insurer[1]}"; Tokio Marine "${tm.insurer[0]}" / "${tm.insurer[1]}"`, match: tmOk && rf.insurer[1] === '200601015674 (735426-V)', hl: [p.locator('#al'), p.locator('#tm')], name: 'E4-allianz-vs-tokio-marine' });
  const all7 = ch.every(([, v]) => /"Allianz General Insurance Company \(Malaysia\) Berhad" \/ "200601015674 \(735426-V\)"/.test(v));
  await R.prove('E7', { shows: ch.map(([k, v]) => `${k}: ${v}`).join(' | '), match: all7, hl: ch.map((_, i) => p.locator('#c' + i)), name: 'E7-other-channel-receipts' });
  await R.prove('E8', { shows: `Labels on only one of the two receipts: ${diff.join(', ') || 'none'}`, match: diff.length === 0, hl: p.locator('#lb'), name: 'E8-labels' });
  R.note('E9 (Success page [Print] view) not repeated: it needs a new purchase; covered when E2E_TS1 is rerun.');
}
