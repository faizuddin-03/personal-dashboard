// 12406_RG_TS2 re-run (board RE-RUN: E3 had no Lonpac purchase). E1 is the 28.10 BEFORE capture (not repeatable).
// E2: BR60006309 again; E3: the QT_TS4 Lonpac purchase of today (BR6N006399, BQX1858). Read only.
export const ts = '12406_RG_TS2_rerun-20261104';
export const situation = 'Rerun: Lonpac receipt and Transaction Details unchanged (BR60006309) and on a new Lonpac purchase (QT_TS4)';
export const points = [
  { id: 'E2', text: 'AFTER: BR60006309 insurer box and receipt Insurer block identical to the 28.10 capture (Details "Lonpac Insurance Berhad", receipt "Lonpac Insurance Berhad (307414-T)")' },
  { id: 'E3', text: 'AFTER: QT_TS4 Lonpac transaction: Details "Lonpac Insurance Berhad", receipt "Lonpac Insurance Berhad (307414-T)" (Bhd also accepted, EAINT-12422)' },
];
export default async function run(R, { cfg, util: u }) {
  const p = R.page; const res = {};
  await u.cibo(R, cfg, 'BR60006309', 'Lonpac transactions, old and new');
  for (const [id, ref] of [['E2', 'BR60006309'], ['E3', 'BR6N006399']]) {
    if (id === 'E3') await u.ciboSearch(R, ref);
    const d = await u.ciboOpen(R, ref);
    const f = await R.download(p.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first(), `cibo-receipt-${ref}-lonpac.pdf`, 'Receipt (CIBO)');
    const rf = u.receiptFields(u.pdfText(f));
    await u.showPdf(R, f, 'Lonpac receipt ' + ref);
    await R.shot(`${ref}-receipt-pdf`, `Lonpac receipt ${ref} as rendered by Chrome`);
    await u.showLines(R, `Lonpac ${ref}: Transaction Details vs receipt`, [['Transaction Details Insurer', d.insurer, 'di'], ['Receipt Insurer line 1', rf.insurer[0], 'r1'], ['Receipt Insurer line 2', rf.insurer[1] || '', 'r2'], ['Cover Note / Policy', `${d.cover} / ${d.policy}`]]);
    const okD = /^Lonpac Insurance B(erha)?d$/.test((d.insurer || '').trim());
    const okR = /^Lonpac Insurance B(erha)?d \(307414-T\)$/.test((rf.insurer[0] || '').trim());
    await R.prove(id, { shows: `${ref}: Details "${d.insurer}"; receipt "${rf.insurer[0]}"${rf.insurer[1] ? ' / "' + rf.insurer[1] + '"' : ''}`, match: okD && okR, hl: [p.locator('#di'), p.locator('#r1')], name: `${id}-${ref}` });
    if (id === 'E2') await u.ciboSearch(R, 'BR6N006399');
  }
}
