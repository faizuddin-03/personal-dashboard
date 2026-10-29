import { Page } from '@playwright/test';

// Browser alerts / confirms (the mock-up validates with alert(), lines 538 and
// 541; the BO Logout link asks confirm("Sure to logout?")). One listener per
// page: each message is kept for the TS to read, then answered OK as a person
// would after reading it.
const seen = new WeakMap<Page, string[]>();

export function watchDialogs(page: Page): void {
  if (seen.has(page)) return;
  seen.set(page, []);
  page.on('dialog', d => {
    seen.get(page)!.push(d.message());
    console.log(`   💬 Browser dialog: "${d.message()}"`);
    d.accept().catch(() => { /* already answered */ });
  });
}

/** Messages raised since the last call. */
export function takeDialogs(page: Page): string[] {
  const list = seen.get(page) ?? [];
  seen.set(page, []);
  return list;
}

export function peekDialogs(page: Page): string[] {
  return seen.get(page) ?? [];
}
