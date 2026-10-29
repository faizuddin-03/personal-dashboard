import { chromium, devices, test, type Browser, type BrowserContext } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

// The eAuto browser keeps one saved profile between runs (Faizuddin, 2026-10-22:
// "each run will use the same browser, and not a new fresh browser"), so cookies
// from a passed reCAPTCHA carry over and a person ticks it only when eAuto asks
// again. Shared by every onboarding suite (12153, 12257, Create Pre-Application).
// Delete the folder to start fresh. BO, eSIM and the "new browser" checks
// (reopen, second session) stay fresh contexts — those TS need no cookies.
//
// Since 2026-10-22 (later): it is the INSTALLED Google Chrome (channel
// 'chrome'), not Playwright's bundled Chromium, on its own profile folder. The
// bundled browser could never be signed in to Google, so reCAPTCHA treated it
// as a blank browser and asked every run (Faizuddin: "got no gmail user at the
// top right, and i need to do recaptcha every time"). The person signs in to
// Google once in this profile from the dashboard ("Open eAuto browser to sign
// in" — app/api/eauto/browser-profile), in a normal Chrome window: Google
// refuses sign-in inside a browser that automation controls. Dev cannot put
// reCAPTCHA test keys on staging, so a person still ticks when asked.
// Keep this file the same in all three suites.
export const PROFILE_DIR = path.resolve(__dirname, '../../../data/browser-profile/eauto-onboarding-chrome');

/** The eAuto browser: installed Chrome on the saved profile, or a fresh context if that is not possible. */
export async function openEautoContext(browser: Browser, videoDir: string): Promise<BrowserContext> {
  const { defaultBrowserType: _, ...chrome } = devices['Desktop Chrome'];
  const opts = {
    ...chrome, viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, acceptDownloads: true,
    recordVideo: process.env.PW_VIDEO === '1' ? { dir: videoDir, size: { width: 1920, height: 1080 } } : undefined,
  };
  // The sign-in window (a normal Chrome on this profile) holds the lock; a second
  // Chrome on the same folder would just hand over to it and exit.
  if (profileOpen()) {
    console.log("DETAIL: eAuto browser: the saved profile is open in another Chrome window (the sign-in window?) — close it to use the saved profile next run; using a fresh browser now");
    test.info().annotations.push({ type: "saved-browser", description: "fresh browser used (profile open)" });
    return browser.newContext(opts);
  }
  try {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
    const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { ...opts, channel: 'chrome', headless: process.env.PW_HEADED !== '1' });
    // A saved profile opens with one blank tab: the run uses it (eAutoPage()), and closes any extra left over.
    for (const p of ctx.pages().slice(1)) await p.close().catch(() => undefined);
    console.log(`DETAIL: eAuto browser: installed Chrome, saved profile${googleAccount() ? ` (Google: ${googleAccount()})` : ' (not signed in to Google — use "Open eAuto browser to sign in" on the dashboard)'}`);
    return ctx;
  } catch (e) {
    const msg = String(e).split('\n')[0];
    console.log(`DETAIL: eAuto browser: saved profile unusable, using a fresh browser (${msg})`);
    test.info().annotations.push({ type: 'saved-browser', description: 'fresh browser used' });
    return browser.newContext(opts);
  }
}

/** Chrome holds `lockfile` open while the profile is in use (verified 2026-10-22 smoke test). */
function profileOpen(): boolean {
  const lock = path.join(PROFILE_DIR, "lockfile");
  if (!fs.existsSync(lock)) return false;
  try { fs.closeSync(fs.openSync(lock, "r+")); return false; } catch { return true; }
}

/** The Google account signed in to the saved profile, from Chrome's own Preferences file. */
function googleAccount(): string | null {
  try {
    const prefs = JSON.parse(fs.readFileSync(path.join(PROFILE_DIR, 'Default', 'Preferences'), 'utf8'));
    const acc = Array.isArray(prefs.account_info) ? prefs.account_info.find((a: { email?: string }) => a?.email) : null;
    return acc?.email ?? prefs?.google?.services?.last_username ?? null;
  } catch { return null; }
}

/** The first tab of the eAuto browser (the saved profile already has one). */
export async function eAutoPage(ctx: BrowserContext) {
  return ctx.pages()[0] ?? ctx.newPage();
}
