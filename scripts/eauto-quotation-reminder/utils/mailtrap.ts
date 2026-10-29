import { chromium, type BrowserContext } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CONFIG } from '../data/config';

// ── Reading the Mailtrap sandbox ────────────────────────────
// Deliberately NOT the REST API. The team's working check opens the inbox in a
// browser that is already signed in, and this mirrors that: a copy of the
// modefair.com Chrome profile is launched, inheriting the session, so no token
// and no Mailtrap password exist anywhere in this repo.
//
// Unreachable inbox is `blocked`, never a pass and never a crash — a run must
// never be falsely green for want of a session.

export interface MailtrapMessage {
  subject: string;
  from: string;
  to: string;
  receivedLabel: string;
}

export type InboxResult =
  | { ok: true; messages: MailtrapMessage[] }
  | { ok: false; blocked: true; reason: string };

/**
 * Chrome locks a profile that is open, so we copy rather than use in place.
 * Only the session-bearing files are copied — the full tree is hundreds of MB
 * and would make every run pay a slow disk copy.
 */
function stageProfile(): { userDataDir: string; cleanup: () => void } | null {
  if (!CONFIG.chromeUserDataDir || !fs.existsSync(CONFIG.chromeUserDataDir)) return null;

  const staged = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-chrome-'));
  const srcProfile = path.join(CONFIG.chromeUserDataDir, CONFIG.chromeProfileDir);
  const dstProfile = path.join(staged, 'Default'); // launch always uses Default
  fs.mkdirSync(path.join(dstProfile, 'Network'), { recursive: true });

  const copy = (from: string, to: string) => {
    try { if (fs.existsSync(from)) fs.copyFileSync(from, to); } catch { /* best effort */ }
  };
  copy(path.join(CONFIG.chromeUserDataDir, 'Local State'), path.join(staged, 'Local State'));
  copy(path.join(srcProfile, 'Preferences'), path.join(dstProfile, 'Preferences'));
  copy(path.join(srcProfile, 'Network', 'Cookies'), path.join(dstProfile, 'Network', 'Cookies'));
  // Some Chrome builds still keep a profile-root Cookies file.
  copy(path.join(srcProfile, 'Cookies'), path.join(dstProfile, 'Cookies'));

  return {
    userDataDir: staged,
    cleanup: () => { try { fs.rmSync(staged, { recursive: true, force: true }); } catch { /* ignore */ } },
  };
}

/** Open the inbox in the copied profile and read the visible message list. */
export async function readInbox(): Promise<InboxResult> {
  if (!CONFIG.chromeUserDataDir) {
    return {
      ok: false, blocked: true,
      reason: 'No Chrome profile was resolved. Sign in to Chrome with the modefair.com account, then re-run.',
    };
  }

  const staged = stageProfile();
  if (!staged) {
    return { ok: false, blocked: true, reason: `Chrome profile not found at ${CONFIG.chromeUserDataDir}.` };
  }

  let ctx: BrowserContext | undefined;
  try {
    ctx = await chromium.launchPersistentContext(staged.userDataDir, {
      headless: false, // Mailtrap's app shell is unreliable headless
      channel: 'chrome',
      viewport: { width: 1440, height: 900 },
    });
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto(CONFIG.mailtrapInbox, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(3_000);

    // Signed out → Mailtrap bounces to its sign-in page.
    if (/sign_?in|login|users\/sign/i.test(page.url())) {
      return {
        ok: false, blocked: true,
        reason: `Mailtrap is signed out in the ${CONFIG.chromeProfileDir} Chrome profile. Open ${CONFIG.mailtrapInbox} in Chrome, sign in, then re-run.`,
      };
    }

    const rows = page.locator('[data-testid="message-list-item"], li[class*="message"], tr[class*="message"]');
    await rows.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => { /* empty inbox is valid */ });

    const messages: MailtrapMessage[] = await rows.evaluateAll((els) =>
      els.slice(0, 40).map((el) => {
        const t = (sel: string) => el.querySelector(sel)?.textContent?.trim() ?? '';
        return {
          subject: t('[data-testid="message-subject"]') || t('[class*="subject"]') || (el.textContent ?? '').trim().slice(0, 200),
          from: t('[data-testid="message-from"]') || t('[class*="from"]'),
          to: t('[data-testid="message-to"]') || t('[class*="to"]'),
          receivedLabel: t('[data-testid="message-date"]') || t('time') || t('[class*="date"]'),
        };
      }),
    );

    return { ok: true, messages };
  } catch (e) {
    return { ok: false, blocked: true, reason: `Could not read the Mailtrap inbox: ${e instanceof Error ? e.message : String(e)}` };
  } finally {
    await ctx?.close().catch(() => { /* ignore */ });
    staged.cleanup();
  }
}

/** Messages mentioning this vehicle — the value that threads the scenario. */
export function matching(messages: MailtrapMessage[], vehicleNo: string): MailtrapMessage[] {
  const needle = vehicleNo.replace(/\s+/g, '').toUpperCase();
  return messages.filter((m) =>
    `${m.subject} ${m.to} ${m.from}`.replace(/\s+/g, '').toUpperCase().includes(needle));
}
