// 12406_QT_TS7 rerun (board KIV: SRD REQ-006 says the documents are "dated 2022", the pass condition is "existing
// documents displayed"; BA question). Real API, row 6 JXP4235 (all three insurers quote). No payment.
import fs from 'node:fs';
export const ts = '12406_QT_TS7_rerun-20261104';
export const situation = 'Rerun: Allianz product documents from the card Plan Details, Confirmation Plan Details, Excess info and declaration';
export const pointsFrom = '12406_QT_TS7';
const DATE = /\b(\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d\d|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d\d|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:19|20)\d\d)\b/gi;

export default async function run(R, { cfg, util: u }) {
  const p = R.page; const docs = [];
  const st = await u.quote(R, cfg, { plate: 'JXP4235', ic: '810417015908' });
  if (st === 'car-details' && (await u.carDetails(R)) !== 'quotations') throw new Error('no quotations');
  const follow = async (where, link) => {
    const label = (await link.innerText()).trim();
    const href = await link.getAttribute('href');
    const popP = R.ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null);
    await R.click(link, `${where}: "${label}"`);
    const w = await popP;
    let url = href || '';
    if (w) { await w.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {}); url = w.url() || url; await w.waitForTimeout(2500); }
    let info = { where, label, url, file: '', dates: [], allianz: false, other: [] };
    if (/\.pdf/i.test(url)) {
      const abs = new URL(url, p.url()).href;
      const res = await R.ctx.request.get(abs).catch(() => null);
      if (res && res.ok()) {
        const name = decodeURIComponent(abs.split('?')[0].split('/').pop());
        const f = `${R.dir}/downloadable/${name}`;
        fs.mkdirSync(`${R.dir}/downloadable`, { recursive: true }); fs.writeFileSync(f, await res.body());
        const t = u.pdfText(f);
        info = { ...info, file: name, dates: [...new Set((t.match(DATE) || []))].slice(0, 6), allianz: /Allianz/i.test(t.slice(0, 4000)), other: ['Lonpac', 'Tokio Marine', 'Zurich', 'RHB', 'Etiqa', 'Takaful'].filter((x) => new RegExp(x, 'i').test(t.slice(0, 4000))), text: t.trim().length };
      }
    }
    if (w) { await R.shot(`${where}-${label}`.slice(0, 60), `${where} "${label}" opened ${url.split('/').pop()}`, null, w).catch(() => {}); await w.close().catch(() => {}); }
    docs.push(info); R.note(`document: ${JSON.stringify(info)}`);
  };
  const modalLinks = async (where) => {
    const m = p.locator('ngb-modal-window').filter({ visible: true }).last();
    await m.waitFor({ timeout: 15000 });
    await R.shot(where + '-popup', `${where} pop-up`, m.locator('.modal-content').first());
    const n = await m.locator('a[href]').filter({ visible: true }).count();
    for (let i = 0; i < n; i++) await follow(where, p.locator('ngb-modal-window').filter({ visible: true }).last().locator('a[href]').filter({ visible: true }).nth(i));
    await p.bringToFront().catch(() => {});
    const closeBtn = p.getByRole('button', { name: /^\s*Close\s*$/ }).filter({ visible: true }).last();
    if (await closeBtn.count()) await R.click(closeBtn, 'Close pop-up').catch((e) => R.note('Close click failed: ' + e.message.split('\n')[0]));
    else await p.keyboard.press('Escape');
    await p.waitForTimeout(1500);
    R.note('pop-ups still open after Close: ' + (await p.locator('ngb-modal-window').count()));
  };
  await R.click(u.card(R, 'Allianz').locator('a.btn-link').filter({ hasText: /Plan Details/i }).first(), 'Allianz card: Plan Details');
  await modalLinks('card Plan Details');
  await u.buy(R, 'Allianz');
  await u.continueToConfirmation(R);
  await R.click(p.locator('a.btn-link').filter({ hasText: /^\s*Plan Details\s*$/i }).filter({ visible: true }).first(), 'Confirmation: Plan Details');
  await modalLinks('Confirmation Plan Details');
  const exI = p.locator('.row.mb-2').filter({ has: p.locator('.text-muted', { hasText: /^\s*Excess\s*$/ }) }).locator('i.bi-info-circle').first();
  if (await exI.count()) {
    await R.click(exI, "Excess 'i'");
    const m = p.locator('ngb-modal-window').filter({ visible: true }).last(); await m.waitFor({ timeout: 10000 }).catch(() => {});
    const ex = (await m.innerText().catch(() => '')).replace(/\s+/g, ' ');
    await R.shot('excess-info', "Excess 'i': " + ex.slice(0, 120), m.locator('.modal-content').first());
    R.note("Excess 'i' text: " + ex.slice(0, 300) + '; links: ' + (await m.locator('a[href]').count()));
    const cb = p.getByRole('button', { name: /^\s*(Close|OK|Got it)\s*$/i }).filter({ visible: true }).last();
    if (await cb.count()) await R.click(cb, 'Close Excess pop-up').catch(() => {});
    else { const x = m.locator('button').filter({ visible: true }).first(); if (await x.count()) await R.click(x, 'Close Excess pop-up').catch(() => {}); else await p.keyboard.press('Escape'); }
    await p.waitForTimeout(1200);
  }
  const decl = p.locator('small.text-muted').filter({ hasText: /By continuing, you agree/i }).filter({ visible: true }).first();
  const dn = await decl.locator('a').count();
  for (let i = 0; i < dn; i++) await follow('Confirmation declaration', decl.locator('a').nth(i));

  const allianzDocs = docs.filter((d) => d.file);
  const byName = (re) => allianzDocs.filter((d) => re.test(d.label) || re.test(d.file));
  const rowsShown = docs.map((d, i) => [`${d.where}: ${d.label}`, d.file ? `${d.file} · Allianz: ${d.allianz} · other insurers: ${d.other.join(', ') || 'none'} · dates: ${d.dates.join(', ') || '(none found / image only)'}` : `(not a PDF) ${d.url}`, 'd' + i]);
  await u.showLines(R, 'Documents opened (file, insurer named, dates found by pdftotext)', rowsShown);
  const judge = (id, re, label) => {
    const ds = byName(re);
    const y2022 = ds.length && ds.every((d) => d.dates.some((x) => /2022/.test(x)));
    return R.prove(id, { shows: ds.length ? ds.map((d) => `${d.where} "${d.label}" → ${d.file}, Allianz ${d.allianz}, dates: ${d.dates.join(', ') || 'none (image only)'}`).join(' | ') : `no "${label}" link found`, match: !!y2022 && ds.every((d) => d.allianz),
      hl: ds.map((d) => p.locator('#d' + docs.indexOf(d))), name: id + '-' + label.replace(/\W+/g, '-') });
  };
  await judge('E1', /policy[-\s]?wording/i, 'Policy wording');
  await judge('E2', /product[-\s]?disclosure/i, 'Product disclosure sheet');
  await judge('E3', /privacy/i, 'Privacy notice');
  await judge('E4', /claim/i, 'Claim guide');
  const mism = docs.filter((d) => d.file && !new RegExp(d.label.split(/\s+/)[0], 'i').test(d.file.replace(/-/g, ' ')));
  await R.prove('E5', { shows: mism.length ? 'Name/file mismatch: ' + mism.map((d) => `${d.label} → ${d.file}`).join('; ') : 'Every link opened the document it names', match: !mism.length, hl: docs.map((_, i) => p.locator('#d' + i)), name: 'E5-link-names' });
  const notAllianz = docs.filter((d) => /Plan Details|Excess/.test(d.where) && d.file && (!d.allianz || d.other.length));
  await R.prove('E6', { shows: notAllianz.length ? 'Not Allianz: ' + notAllianz.map((d) => d.file).join(', ') : `All ${docs.filter((d) => /Plan Details/.test(d.where)).length} Plan Details links open Allianz documents; Excess 'i' has no link`, match: !notAllianz.length, hl: docs.map((_, i) => p.locator('#d' + i)), name: 'E6-plan-details-links' });
}
