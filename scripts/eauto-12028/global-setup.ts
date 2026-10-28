import { chromium } from '@playwright/test';
import { CONFIG } from './data/config';

// Automation lesson 19: open the environment's login page a few times, a few
// seconds apart, before the long part. If it never loads, stop the whole run
// with one plain message instead of every TS failing on a site that is down.
// Skipped for `--list` (no env vars are sent then).
export default async function globalSetup(): Promise<void> {
  if (process.argv.includes('--list')) return;
  const url = CONFIG.loginUrl; // throws "Environment is blank" when not chosen
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let lastError = '';
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
        if (res && res.status() < 500 && (await page.locator('input[name="username"], input[placeholder="Username"]').count())) return;
        lastError = `HTTP ${res?.status() ?? '?'}, no login form`;
      } catch (e) {
        lastError = e instanceof Error ? e.message.split('\n')[0] : String(e);
      }
      // pipeline-check: allow sleep — a few seconds between environment checks (automation lesson 19: a few tries a few seconds apart)
      await page.waitForTimeout(5_000);
    }
    throw new Error(`${CONFIG.host.replace(/^https?:\/\//, '')}/${CONFIG.instance} did not answer (${lastError}). Check the environment / VPN and run again.`);
  } finally {
    await browser.close();
  }
}
