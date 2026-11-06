// 12406_RC_TS11 rerun of E2 only (Azfar 30.10: E1 recorded, E2 not proved, no Lonpac purchase existed).
// Lonpac buyer: BR6N006399, plate BQX1858 (QT_TS4, 04.11.2026). READ ONLY: never Edit, Save update, Duplicate or
// Send quotation link. Personal data: shots are cropped to the row / vehicle card.
export const ts = '12406_RC_TS11_rerun-20261105';
export const situation = 'Rerun E2: CIBO CRM record and vehicle card of the Lonpac buyer of QT_TS4 (BQX1858), recorded for comparison';
export const points = [
  { id: 'E2', text: 'Recorded only (Q43): the same for the Lonpac buyer of QT_TS4, for comparison' },
];
const PLATE = 'BQX1858';

export default async function run(R, { cfg, util: u }) {
  const p = R.page;
  await u.cibo(R, cfg, 'BR6N006399', 'CRM record of the Lonpac buyer (QT_TS4)');
  const tm = await u.ciboSearch(R, 'BR6N006399');
  R.note('Transaction listing BR6N006399: ' + JSON.stringify(tm.rows[0] || []).slice(0, 400));
  await R.card('CIBO', 'CRM', 'search ' + PLATE, 1200);
  await p.goto('https://staging.secarang.com/cibo/crm', { waitUntil: 'domcontentloaded' });
  await p.waitForURL(/\/cibo\/crm/, { timeout: 60000 });
  await p.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(3000);
  // Ownership Type: Private (by the arrow, as Azfar's cibo.page.ts)
  const own = p.locator('ng-select[formcontrolname="ownershipType"]').filter({ visible: true }).first();
  if (await own.count()) {
    await R.click(own.locator('.ng-arrow-wrapper'), 'Open Ownership Type');
    const panel = p.locator('ng-dropdown-panel').first(); await panel.waitFor({ state: 'visible', timeout: 10000 });
    await R.click(panel.locator('.ng-option').filter({ hasText: /^\s*Private\s*$/ }).first(), 'Private');
    await p.keyboard.press('Escape');
  }
  const s = p.locator("input[formcontrolname='search']").filter({ visible: true }).first();
  await R.fill(s, PLATE, 'Search: ' + PLATE);
  const req = p.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 }).catch(() => null);
  await R.click(p.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).first(), 'Search');
  await req; await p.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {}); await p.waitForTimeout(4000);
  const heads = (await p.locator('table thead th').allInnerTexts()).map((h) => h.replace(/\s+/g, ' ').trim());
  const rows = await p.locator('table tbody tr').filter({ visible: true }).filter({ hasText: PLATE }).evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
  if (!rows.length) throw new Error(`CRM: no row for ${PLATE} (Ownership Private, search "${PLATE}")`);
  const col = (n) => rows[0][heads.indexOf(n)] || '-';
  const rowLoc = p.locator('table tbody tr').filter({ hasText: PLATE }).first();
  await R.shot('crm-row-' + PLATE, `CRM row ${PLATE} (cropped)`, rowLoc);
  const listing = `CRM listing (Private, search "${PLATE}"): ${rows.length} row(s); Vehicle "${col('Vehicle')}", Ownership Type "${col('Ownership Type')}", Latest Coverage Period "${col('Latest Coverage Period')}", Last Update "${col('Last Update')}"`;

  await R.click(rowLoc.locator("a[href*='customer-details']").first(), 'Open Customer Details');
  await p.waitForURL(/\/crm\/customer-details\//, { timeout: 60000 });
  await p.getByText(/VEHICLE & INSURANCE POLICY DETAILS/i).first().waitFor({ timeout: 60000 });
  await p.waitForTimeout(3000);
  const cards = await p.getByRole('button', { name: /^\s*Edit\s*$/ }).count();
  const plateEl = p.getByText(PLATE, { exact: false }).filter({ visible: true }).first();
  await plateEl.scrollIntoViewIfNeeded().catch(() => {});
  // the vehicle card = nearest ancestor of the plate text that also holds "Last Updated By"
  const card = plateEl.locator('xpath=ancestor::*[.//*[contains(normalize-space(.),"Last Updated By")]][1]');
  const txt = (await card.innerText().catch(() => '')).replace(/\r/g, '');
  const v = (l) => (txt.match(new RegExp(l + '\\s*:?\\s*\\n?\\s*([^\\n]+)', 'i')) || [])[1]?.trim() || '-';
  await R.shot('crm-vehicle-card-' + PLATE, `Vehicle card ${PLATE} (cropped)`, card);
  await R.prove('E2', {
    shows: `${listing} | Customer Details: ${cards} vehicle card(s); card ${PLATE}: Latest Policy Purchase "${v('Latest Policy Purchase')}", Latest Policy Coverage Period "${v('Latest Policy Coverage Period')}", Last Updated By "${v('Last Updated By')}" (recorded, Q43)`,
    match: true, hl: card, name: 'E2-crm-vehicle-card-' + PLATE,
  });
}
