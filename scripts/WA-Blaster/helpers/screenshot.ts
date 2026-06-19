import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

/**
 * Captures a full-page screenshot and saves it to
 * scripts/WA-Blaster/screenshots/{flow}/{name}.png
 *
 * Intended for PDF report generation — call after each major page
 * transition or key state change within a flow test.
 */
export async function snap(page: Page, flow: string, name: string): Promise<void> {
  const dir = path.join(SCREENSHOTS_DIR, flow.replace(/[^a-zA-Z0-9_-]/g, '_'));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`);
  await page.screenshot({ fullPage: true, path: file });
}
