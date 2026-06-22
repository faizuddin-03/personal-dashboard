/**
 * Extended Playwright test fixture.
 *
 * Import { test, expect } from here instead of '@playwright/test' in every
 * spec file. The _autoSnap fixture (auto: true) fires on every page load
 * and saves a full-page screenshot automatically — no snap() call needed.
 *
 * Manual snap() calls are still useful for capturing mid-test state changes
 * (form fills, dialogs open/closed, etc.) that don't trigger a navigation.
 */
import { test as baseTest, expect, request } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export { expect, request };
export type { Page, APIRequestContext };

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

export const test = baseTest.extend<{ _autoSnap: void }>({
  _autoSnap: [async ({ page }, use, testInfo) => {
    const flow     = path.basename(testInfo.file, '.spec.ts');
    const testSlug = testInfo.title
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
    let counter = 0;

    // Fire-and-forget: called synchronously by the event, screenshot
    // runs in background. The test runner keeps the page alive long
    // enough for the screenshot to complete in practice.
    const onLoad = () => {
      const url = page.url();
      if (!url || url === 'about:blank') return;

      counter++;
      const snap = counter; // capture value before async gap
      const urlSlug = url
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'home';

      const dir = path.join(SCREENSHOTS_DIR, flow, testSlug);
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${String(snap).padStart(3, '0')}_${urlSlug}.png`;
      const filePath = path.join(dir, filename);

      page.screenshot({ fullPage: true, path: filePath })
        .then(() => console.log(`  📸 [${flow}] ${testSlug} → ${filename}`))
        .catch(() => { /* page navigated away before screenshot finished */ });
    };

    page.on('load', onLoad);
    await use();
    page.off('load', onLoad);
  }, { auto: true }],
});
