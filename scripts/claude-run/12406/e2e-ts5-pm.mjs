// 12406_E2E_TS5 E2, Payment Management part re-read (05.11.2026): the purchase run read the table while its
// spinner was still showing (0 rows). Read only. Transaction BR6N006406 (VBX2423), paid 05.11 10:23.
export const ts = '12406_E2E_TS5_real-20261105_E2-payment-management';
export const situation = 'E2 re-read: CIBO Payment Management rows for BR6N006406 (failed FPX 51, cancelled SPayLater, paid FPX)';
export const points = [{ id: 'E2', text: 'CIBO Payment Management and Transaction Management each show one row for the transaction, final status Paid / Insurance created; the failed FPX attempt is not listed separately (recorded)' }];
const REF = 'BR6N006406';
export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  const tm = await u.cibo(R, cfg, REF, 'Payment Management rows of ' + REF);
  const tmRows = tm.rows.filter((c) => c.length > 3);
  await R.shot('transaction-management', `Transaction Management ${REF}: ${tmRows.length} row(s)`, p.locator('table tbody tr').filter({ hasText: REF }).first());
  await R.click(p.locator('a[href$="payment-management"]').first(), 'Payment Management');
  await p.waitForURL(/payment-management/, { timeout: 60000 });
  const spin = p.locator('.ia-spinner, .spinner-border');
  const settle = async () => { await p.waitForLoadState('networkidle', { timeout: 240000 }).catch(() => {}); for (let i = 0; i < 300 && (await spin.filter({ visible: true }).count()); i++) await p.waitForTimeout(800); };
  await settle(); await p.waitForTimeout(2000);
  await R.fill(p.locator("input[formcontrolname='search']").filter({ visible: true }).first(), REF, 'Search: ' + REF);
  const req = p.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 }).catch(() => null);
  await R.click(p.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).first(), 'Search');
  await req; await settle(); await p.waitForTimeout(2000);
  const heads = (await p.locator('table thead th').allInnerTexts()).map((h) => h.replace(/\s+/g, ' ').trim());
  const rows = (await p.locator('table tbody tr').filter({ visible: true }).evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())))).filter((c) => c.length > 3);
  const desc = rows.map((c) => heads.map((h, i) => `${h}=${c[i]}`).filter((x) => !/^(#|Insured)=/.test(x)).join(', '));
  const mine = rows.filter((c) => c.join(' ').includes(REF));
  await R.prove('E2', {
    shows: `Transaction Management ${REF}: ${tmRows.length} row(s) | Payment Management "${REF}": ${rows.length} row(s): ${desc.join(' ; ')}`,
    match: tmRows.length === 1 && mine.length >= 1, hl: p.locator('table').filter({ visible: true }).first(), name: 'E2-payment-management-' + REF,
  });
}
