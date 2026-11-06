// 12406_RC_TS4 rerun of E5 only (Azfar 29.10: E1-E4 pass, E5 not proved, no Lonpac purchase existed).
// Data from 04.11.2026: Lonpac BR6N006399 (BQX1858, QT_TS4), Tokio Marine BR6N006404 (WXQ3008, E2E_TS10). Read only.
// Filter driving copied from Azfar's cibo.page.ts (openSelect by the arrow, clear chips, exact option text).
export const ts = '12406_RC_TS4_rerun-20261105';
export const situation = 'Rerun E5: CIBO Transaction Management, Insurance Company filter Lonpac, then TokioMarine; rows show agency Pemaju Eksklusif';
export const points = [
  { id: 'E5', text: 'Same as before the deploy (REQ-010 Ex.2 / REQ-011: other insurers remain unchanged; SRD v1.1 §2.2.3): Lonpac and Tokio Marine rows show the agency Pemaju Eksklusif, and ticking Lonpac / TokioMarine returns their transactions (QT_TS4 / E2E_TS10)' },
];

const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function pickInsurer(R, value) {
  const p = R.page;
  const chips = p.locator('ng-select[formcontrolname="insuranceComp"] .ng-value .ng-value-icon').filter({ visible: true });
  for (let n = 0; n < 60 && (await chips.count()); n++) await R.click(chips.first(), 'remove ticked insurer');
  await p.keyboard.press('Escape');
  const sel = p.locator('ng-select[formcontrolname="insuranceComp"]').filter({ visible: true }).first();
  await R.click(sel.locator('.ng-arrow-wrapper'), 'Open Insurance Company');
  const panel = p.locator('ng-dropdown-panel').first();
  await panel.waitFor({ state: 'visible', timeout: 10000 });
  const opt = panel.locator('.ng-option').filter({ hasText: new RegExp(`^\\s*${rx(value)}\\s*$`) }).first();
  await R.click(opt, 'Tick ' + value);
  await p.keyboard.press('Escape');
}

async function searchFor(R, text) {
  const p = R.page;
  const s = p.locator("input[formcontrolname='search']").filter({ visible: true }).first();
  await R.fill(s, text, text ? 'Search: ' + text : 'Search box empty');
  const req = p.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 }).catch(() => null);
  await R.click(p.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).first(), 'Search');
  await req; await p.waitForTimeout(6000);
  const heads = (await p.locator('table thead th').allInnerTexts()).map((h) => h.replace(/\s+/g, ' ').trim());
  const rows = await p.locator('table tbody tr').filter({ visible: true }).evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
  const ins = heads.indexOf('Ins. Co.'); const ref = heads.findIndex((h) => /Transaction Ref/.test(h));
  return rows.filter((r) => r.length > 3).map((r) => ({ ref: (r[ref] || '').split(' ')[0], ins: r[ins] || '' }));
}

export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  await u.cibo(R, cfg, '', 'Insurance Company filter: Lonpac, then TokioMarine');
  const out = []; let ok = true;
  for (const [insurer, ref, label] of [['Lonpac', 'BR6N006399', 'QT_TS4 Lonpac BQX1858'], ['TokioMarine', 'BR6N006404', 'E2E_TS10 Tokio Marine WXQ3008']]) {
    await pickInsurer(R, insurer);
    const all = await searchFor(R, '');
    const other = all.filter((r) => !(new RegExp('^' + (insurer === 'TokioMarine' ? 'Tokio ?Marine' : insurer) + '\\b', 'i').test(r.ins) && /Pemaju Eksklusif/.test(r.ins)));
    await R.shot(`${insurer}-ticked-listing`, `${insurer} ticked, empty search: ${all.length} row(s) on page 1, rows not "${insurer} / Pemaju Eksklusif": ${other.length}`, p.locator('table').filter({ visible: true }).first());
    const one = await searchFor(R, ref);
    const hit = one.find((r) => r.ref === ref);
    const rowLoc = p.locator('table tbody tr').filter({ hasText: ref }).first();
    const good = all.length > 0 && other.length === 0 && !!hit && /Pemaju Eksklusif/.test(hit.ins);
    ok = ok && good;
    await R.shot(`${insurer}-${ref}-row`, `${label}: ${ref} Ins. Co. "${hit?.ins || 'not found'}"`, rowLoc);
    out.push(`${insurer}: page 1 ${all.length} row(s), other insurer/agency ${other.length}${other.length ? ' (' + other.slice(0, 3).map((r) => r.ref + ' ' + r.ins).join('; ') + ')' : ''}; ${ref} (${label}) Ins. Co. "${hit?.ins || 'NOT FOUND'}"`);
  }
  await R.prove('E5', { shows: out.join(' | '), match: ok, shot: false });
}
