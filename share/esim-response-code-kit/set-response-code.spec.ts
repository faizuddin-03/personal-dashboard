// Standalone run: set one prefix's Response Code, then print the old one.
//
//   ESIM_USER=... ESIM_PASS=... ESIM_ENTITY=rhb-transfer ESIM_VEHICLE_NO=HX1234 ESIM_CODE=IF npx playwright test
//
// Inside your own test, import setResponseCode() from ./esim instead, call it
// BEFORE the step that calls the simulator, and restore the old code after.

import { test } from '@playwright/test';
import { ENTITIES, setResponseCode, type Entity } from './esim';

test('eSIM: set Response Code by vehicle prefix', async ({ page }) => {
  const entity = (process.env.ESIM_ENTITY ?? '') as Entity;
  const vehicleNo = process.env.ESIM_VEHICLE_NO ?? '';
  const code = process.env.ESIM_CODE ?? '';
  if (!ENTITIES[entity]) throw new Error(`ESIM_ENTITY must be one of: ${Object.keys(ENTITIES).join(', ')}`);
  if (!vehicleNo || !code) throw new Error('Set ESIM_VEHICLE_NO and ESIM_CODE.');

  const before = await setResponseCode(page, entity, vehicleNo, code);
  console.log(`[esim] ${entity} prefix ${vehicleNo.slice(0, 2).toUpperCase()}: "${before}" -> "${code}"`);
});
