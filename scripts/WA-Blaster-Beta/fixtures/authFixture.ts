import { test as baseTest, expect, request } from '@playwright/test';
import type { Page, APIRequestContext, Frame } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { getUser } from '../data/users';

export { expect, request };
export type { Page, APIRequestContext };

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

// ── Fixtures ────────────────────────────────────────────────
//  • adminPage — a page already logged in as the admin user. Login lives
//    here (via LoginPage) — one place, reused everywhere.
//  • _autoSnap — auto-screenshot on every main-frame navigation, feeding
//    the dashboard's screenshot report. Active in every test.

type Fixtures = {
  adminPage: Page;
  _autoSnap: void;
};

export const test = baseTest.extend<Fixtures>({
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(getUser('admin'));
    await use(page);
    // Teardown: always runs, even when the test fails
    await page.context().clearCookies();
  },

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
