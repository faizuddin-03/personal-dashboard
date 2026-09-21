import { test } from '@playwright/test';
import { CONFIG, ENTITIES, assertConfig } from '../data/config';
import { LoginPage, EntityListPage, EntityEditPage } from '../pages/EsimPages';

// eAuto Simulator — read or change a record's fields by vehicle prefix.
//
// This is a DATA-SETUP TOOL, not a test. It exists so a response code can be
// checked or steered without clicking through eSIM by hand; it produces no
// evidence and records no video.
//
//   ESIM_MODE=read   find → report every field. Changes nothing.
//   ESIM_MODE=write  find → change the given fields → save.
//
// Requires the VPN. The dashboard confirms that before spawning this, because a
// disconnected VPN fails as a connection timeout that reads like a bad selector.

test('eSIM: update simulator record by vehicle prefix', async ({ page }) => {
  assertConfig();
  const entity = ENTITIES[CONFIG.entity];

  await new LoginPage(page).login();

  const list = new EntityListPage(page, CONFIG.entity);
  await list.open();
  const editUrl = await list.findEditUrl(CONFIG.prefix);

  const edit = new EntityEditPage(page);
  await edit.open(editUrl);

  if (CONFIG.mode === 'read') {
    const fields = await edit.readAllFields();
    console.log(`[step] Read ${fields.length} fields — nothing was changed`);
    console.log('RESULT:' + JSON.stringify({
      status: 'SUCCESS',
      mode: 'read',
      entity: entity.label,
      prefix: CONFIG.prefix,
      fields,
    }));
    return;
  }

  const applied = await edit.applyChanges(CONFIG.changes);
  await edit.save();

  // Saving lands on the record's view page, which lists every field — so the
  // new values can be spot-checked right there without revisiting the list.
  const shown = await edit.viewPageText();
  const verified = applied.map(a => ({ ...a, onPage: shown.includes(a.to) }));
  for (const v of verified.filter(v => !v.onPage)) {
    console.log(`[warn] "${v.label}" saved as "${v.to}" but that value isn't visible on the record — eSIM may have reformatted it.`);
  }

  console.log('RESULT:' + JSON.stringify({
    status: 'SUCCESS',
    mode: 'write',
    entity: entity.label,
    prefix: CONFIG.prefix,
    applied: verified,
  }));
});
