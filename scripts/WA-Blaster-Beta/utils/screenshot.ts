import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

export async function snap(page: Page, flow: string, name: string): Promise<void> {
  const dir = path.join(SCREENSHOTS_DIR, flow.replace(/[^a-zA-Z0-9_-]/g, '_'));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`);
  await page.screenshot({ fullPage: true, path: file });
}
