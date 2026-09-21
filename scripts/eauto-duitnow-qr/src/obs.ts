/**
 * Navigating the /obs BackOffice app.
 *
 * Two non-obvious things this exists for, both ported from the reference rig:
 *
 * 1. The `/obs` app is SEPARATE from `/uat4`. A `/uat4` login is not an `/obs`
 *    session, and `/obs` does not say so — a cold GET of `/obs/admin/enquiry`
 *    returns ~39 bytes of empty HTML. No redirect, no 403. The handoff is a URL,
 *    not a menu walk.
 *
 * 2. **These pages never finish loading.** ~48 static assets never answer, so
 *    `readyState` never leaves "loading" and neither `load` nor `domcontentloaded`
 *    ever fires — while the document itself is complete in about 1.2s. Waiting on
 *    a lifecycle here waits for an image. Commit the navigation and poll for a
 *    document big enough to be real.
 */
import type { Page } from "@playwright/test";
import { BASE, INSTANCE } from "./env";

const HANDOFF = {
  application: "OBS_APPLICATION_LISTING",
  "pre-application": "PRE_OBS_APPLICATION_LISTING",
} as const;

export type HandoffType = keyof typeof HANDOFF;

const authRedirect = (type: HandoffType) =>
  `${BASE}/${INSTANCE}/api/admin/onboarding/auth-redirect.do?type=${HANDOFF[type]}`;

/** A document this small is the empty-session shell, not a page. */
const REAL_DOCUMENT_BYTES = 20_000;

async function documentSize(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.outerHTML.length).catch(() => 0);
}

async function isNotFound(page: Page): Promise<boolean> {
  return page.getByText(/404\s*-?\s*not found/i).first().isVisible().catch(() => false);
}

export class ObsNotFoundError extends Error {
  readonly code = "OBS_NOT_FOUND";
}

/**
 * Navigate and wait for a real document — never for a lifecycle event.
 */
export async function gotoDocument(
  page: Page,
  url: string,
  timeout = 45_000,
): Promise<{ bytes: number; notFound: boolean; timedOut: boolean }> {
  await page.goto(url, { waitUntil: "commit", timeout }).catch(() => {});
  const deadline = Date.now() + timeout;
  let bytes = 0;
  while (Date.now() < deadline) {
    bytes = await documentSize(page);
    if (bytes > REAL_DOCUMENT_BYTES) return { bytes, notFound: false, timedOut: false };
    if (bytes > 0 && (await isNotFound(page))) return { bytes, notFound: true, timedOut: false };
    await page.waitForTimeout(250);
  }
  return { bytes, notFound: false, timedOut: true };
}

/** Perform the /uat4 → /obs session handoff. */
export async function enterObs(page: Page, type: HandoffType = "application"): Promise<void> {
  await gotoDocument(page, authRedirect(type));
}

/**
 * The only way BO pages should be opened. Re-enters the handoff when a page
 * comes back blank, which is what a lapsed handoff mid-run looks like.
 */
export async function gotoObs(
  page: Page,
  url: string,
  type: HandoffType = "application",
): Promise<void> {
  let res = await gotoDocument(page, url);
  if (res.notFound) {
    throw new ObsNotFoundError(`404 from ${url} — the record has no page of this kind (this is scope, not a broken selector).`);
  }
  if (res.bytes > REAL_DOCUMENT_BYTES) return;

  await enterObs(page, type);
  res = await gotoDocument(page, url);
  if (res.notFound) {
    throw new ObsNotFoundError(`404 from ${url} after re-entering /obs.`);
  }
  if (res.bytes <= REAL_DOCUMENT_BYTES) {
    throw new Error(
      `${url} returned ${res.bytes} bytes even after the /obs handoff — the BackOffice session is not usable.`,
    );
  }
}

/**
 * Answer a confirmation, in either shape the app uses: a native dialog, or an
 * in-page modal button.
 *
 * The handler is scoped with on/off rather than `once`. A `page.once('dialog')`
 * that never fires stays armed for the rest of the session, and the next action
 * that raises a dialog then has two handlers — the second throws "Cannot accept
 * dialog which is already handled" AFTER its own action succeeded. That is how a
 * run once reported a failure on a change that had actually gone through.
 */
export async function confirm(page: Page): Promise<void> {
  const accept = (d: { accept: () => Promise<void> }) => { void d.accept().catch(() => {}); };
  page.on("dialog", accept);
  try {
    const btn = page.getByRole("button", { name: /^(yes|ok|confirm|proceed)$/i }).first();
    if (await btn.count()) await btn.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
  } finally {
    page.off("dialog", accept);
  }
}

/** Read the visible text of a <select>'s chosen option. */
export async function selectedText(page: Page, selector: string): Promise<string> {
  try {
    const el = page.locator(selector).first();
    if (!(await el.count())) return "";
    return (await el.evaluate((n) => {
      const s = n as HTMLSelectElement;
      return s.selectedOptions?.[0]?.textContent?.trim() ?? s.value;
    })) || "";
  } catch {
    return "";
  }
}
