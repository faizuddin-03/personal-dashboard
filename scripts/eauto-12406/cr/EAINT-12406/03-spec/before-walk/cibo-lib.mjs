// EAINT-12406 before-deploy walk: shared helpers (CIBO login, env, dumps).
// Credentials are read from automation/env/.staging.env-local and never printed.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar';
const require = createRequire(path.join(REPO, 'automation/package.json'));
export const { chromium } = require('playwright');

export const SCRATCH = 'C:/Users/Azfar/AppData/Local/Temp/claude-12406';
fs.mkdirSync(SCRATCH, { recursive: true });
// AFTER run: set WALK_OUT to a new folder, e.g. cr/EAINT-12406/04-explore/<date>-after-deploy
export const OUT = process.env.WALK_OUT || path.join(REPO, 'cr/EAINT-12406/04-explore/2026-10-28-before-deploy');
fs.mkdirSync(OUT, { recursive: true });
export const STATE = path.join(SCRATCH, 'cibo-state.json');

export function env() {
  const txt = fs.readFileSync(path.join(REPO, 'automation/env/.staging.env-local'), 'utf8');
  const o = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return o;
}

export const HOST = 'https://staging.secarang.com';
export const CIBO = HOST + '/cibo';

export async function ciboLogin(page) {
  const e = env();
  await page.goto(CIBO + '/auth/login', { waitUntil: 'networkidle' });
  const inputs = page.locator('input');
  const prefilledLen = await inputs.nth(1).evaluate((i) => i.value.length);
  await inputs.nth(0).fill(e.CIBO_USERNAME);
  await inputs.nth(1).fill('');
  await inputs.nth(1).fill(e.CIBO_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  return { prefilledLen, url: page.url() };
}

// Visible text dump of the page, with credentials masked just in case.
export async function dump(page, name) {
  const e = env();
  let data = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText,
    links: [...document.querySelectorAll('a')].map((a) => [a.innerText.trim(), a.getAttribute('href')]).filter((x) => x[0] || x[1]),
    selects: [...document.querySelectorAll('select')].map((s) => [...s.options].map((o) => o.text.trim())),
    headers: [...document.querySelectorAll('th')].map((t) => t.innerText.trim()),
  }));
  let s = JSON.stringify(data, null, 1);
  for (const k of ['CIBO_PASSWORD']) if (e[k]) s = s.split(e[k]).join('***');
  fs.writeFileSync(path.join(SCRATCH, name + '.json'), s);
  return data;
}

// Secarang staging site password page (password only). Value from SECARANG_SITE_PASSWORD, never printed.
export const IA = HOST + '/ia';
export async function siteGate(page, target = '/car-insurance') {
  await page.goto(IA + target, { waitUntil: 'networkidle' });
  if (page.url().includes('/auth/login')) {
    await page.locator('input[type="password"], input').first().fill(env().SECARANG_SITE_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
  }
  return page.url();
}
