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
      if (frame !== page.mainFrame()) return;
      const url = page.url();
      if (!url || url === 'about:blank') return;
      const bare = url.split('#')[0];
      if (bare === lastUrl) return;
      lastUrl = bare;

      counter++;
      const snap = counter;
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
        .catch(() => {});
    };

    page.on('framenavigated', onNav);
    await use();
    page.off('framenavigated', onNav);
  }, { auto: true }],
});
