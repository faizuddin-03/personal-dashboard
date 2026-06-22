/**
 * Extended Playwright test fixture.
 *
 * Import { test, expect } from here instead of '@playwright/test' in every
 * spec file. The _autoSnap fixture (auto: true) fires on every navigation
 * and saves a full-page screenshot automatically — no snap() call needed.
 *
 * Uses 'framenavigated' instead of 'load' so SPA client-side route changes
 * (React Router / Next.js pushState) are captured, not just full page loads.
 *
 * Manual snap() calls are still useful for capturing mid-test state changes
 * (form fills, dialogs open/closed, etc.) that don't trigger a navigation.
 */
import { test as baseTest, expect, request } from '@playwright/test';
import type { Page, APIRequestContext, Frame } from '@playwright/test';
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
    let lastUrl = '';

    const onNav = (frame: Frame) => {
      // Only track the top-level page, not iframes
      if (frame !== page.mainFrame()) return;

      const url = page.url();
      if (!url || url === 'about:blank') return;

      // Deduplicate: skip if URL hasn't changed (e.g. hash-only changes, double-fire)
      const bare = url.split('#')[0];
      if (bare === lastUrl) return;
      lastUrl = bare;

      counter++;
      const snap = counter; // capture before async gap
      const urlSlug = url
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'home';

      const dir = path.join(SCREENSHOTS_DIR, flow, testSlug);
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${String(snap).padStart(3, '0')}_${urlSlug}.png`;
      const filePath = path.join(dir, filename);

      // Wait 300 ms for React to render the new route, then guard against the URL
      // having changed again (prevents stale callbacks from snapping the wrong page).
      const targetBare = bare;
      setTimeout(() => {
        if (page.url().split('#')[0] !== targetBare) return;
        page.screenshot({ fullPage: true, path: filePath })
          .then(() => console.log(`  📸 [${flow}] ${testSlug} → ${filename}`))
          .catch(() => { /* page closed or navigated away before screenshot */ });
      }, 300);
    };

    page.on('framenavigated', onNav);
    await use();
    page.off('framenavigated', onNav);
  }, { auto: true }],
});
