/**
 * Environment resolution.
 *
 * One host serves many named instances, separated only by a path segment:
 *   https://<BASE_URL>/<BASE_PATH>/        e.g. .../eauto/, .../sit2/, .../uat1/
 * so the base URL is composed rather than written out per environment, and no
 * hostname is ever committed. Values come from the env file the Playwright
 * config loaded (see env/env-default for the resolution ladder).
 *
 * Shape follows `eauto-qa-automation/config/environments.ts` so this folder
 * merges into that repo without a rewrite.
 */

export type TestEnv = "staging" | "production";

/*
 * Everything here is read through a FUNCTION, never a module-level constant.
 * The Playwright config loads the env file at the top of its body, but ES
 * imports are evaluated before any statement in the importing module — so a
 * constant captured at import time would always hold the value from before
 * the env file was read. Keep it lazy.
 */

export function testEnv(): TestEnv {
  return (process.env.TEST_ENV as TestEnv) === "production" ? "production" : "staging";
}

export function isProduction(): boolean {
  return testEnv() === "production";
}

export function isStaging(): boolean {
  return testEnv() === "staging";
}

/** The instance path segment — eauto, sit2, uat1, preprod1 … */
export function instance(): string {
  return process.env.BASE_PATH ?? "";
}

/**
 * The portal root, with a trailing slash so `new URL(path, baseURL)` behaves.
 * Empty when the env file has not been filled in; the config leaves baseURL
 * undefined in that case so `--list` still works without credentials.
 */
export function baseURL(): string | undefined {
  const host = process.env.BASE_URL;
  if (!host) return undefined;
  const seg = instance();
  const path = seg ? `${seg}/` : "";
  return `https://${host}/${path}`;
}

/**
 * The onboarding surface, which does NOT live under the instance path.
 *
 * Everything else is `https://<host>/<instance>/…`, but Pre-Application sits at
 * `https://<host>/obs/…` — outside `/eauto/` entirely. A relative goto against
 * `baseURL()` therefore lands on `/eauto/obs/…`, which does not exist.
 *
 * This is the same sanctioned exception as the login screen: a public entry
 * point nothing navigates TO, so it is opened directly (qa-principles #13).
 */
export function obsURL(path: string): string {
  const host = process.env.BASE_URL;
  if (!host) throw new Error("BASE_URL is not set — cannot reach the onboarding surface.");
  return `https://${host}/${path.replace(/^\//, "")}`;
}

/** The login screen. Never construct any other screen's URL — click to it. */
export function loginPath(): string {
  return "public/login/";
}

/**
 * eSim — the JPJ / RHB response simulator.
 *
 * It sits on an internal address reachable only over the company VPN, and it
 * is NOT part of the portal, so it is composed separately rather than from
 * BASE_URL. Returns undefined when unset, so a spec that does not need eSim
 * still lists and runs.
 */
export function esimBaseURL(): string | undefined {
  const url = process.env.ESIM_BASE_URL;
  if (!url) return undefined;
  return url.endsWith("/") ? url : `${url}/`;
}

/**
 * The MyKad reader's WebSocket host.
 *
 * The page opens this from the BROWSER, so the emulator runs beside the
 * browser and never on the server.
 */
export function mykadHost(): string {
  return process.env.MYKAD_WS_HOST ?? "ws://localhost:7878";
}

// ---------------------------------------------------------------- Secarang + CIBO

/**
 * Secarang (the public car-insurance site) and CIBO (its insurance back office) live on their OWN staging
 * host, not on BASE_URL (knowledge/_core/environments.md "Secarang + CIBO", Azfar 28.10.2026):
 *
 *   https://<SECARANG_BASE_URL>/<SECARANG_BASE_PATH>/   the site: /ia/ or /preprod/ (which ticket is on which is Dev's)
 *   https://<SECARANG_BASE_URL>/cibo/                   CIBO
 *
 * `/ia/cibo` is NOT CIBO: every `/ia…` path falls back to the /ia/ app's site password page (walk
 * 28.10.2026, cr/EAINT-12406/04-explore/2026-10-28-before-deploy/README.md). So CIBO is composed from the
 * host, never from the Secarang instance. SECARANG_BASE_URL may carry `https://` or not.
 *
 * The instance can be picked at run time like eAuto's INSTANCE: `SECARANG_INSTANCE=preprod` (it is not in
 * the env file, so the file's SECARANG_BASE_PATH does not override it). /preprod/ holds other tickets
 * (28.10.2026): use it only with the owner's OK.
 */
function secarangHost(): string | undefined {
  const raw = (process.env.SECARANG_BASE_URL ?? "").trim();
  if (!raw) return undefined;
  return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** The Secarang instance path segment — ia, preprod. */
export function secarangInstance(): string {
  return (process.env.SECARANG_INSTANCE || process.env.SECARANG_BASE_PATH || "").replace(/^\/+|\/+$/g, "");
}

/** The Secarang site root with a trailing slash (`https://<host>/ia/`), or undefined when the env file is blank. */
export function secarangBaseURL(): string | undefined {
  const host = secarangHost();
  const seg = secarangInstance();
  if (!host || !seg) return undefined;
  return `https://${host}/${seg}/`;
}

/**
 * A Secarang entry address. Only the public entry point (`car-insurance`) is opened this way, the same
 * sanctioned exception as the eAuto login screen; every later screen is reached by clicking.
 */
export function secarangURL(path: string): string {
  const root = secarangBaseURL();
  if (!root) {
    throw new Error("SECARANG_BASE_URL / SECARANG_BASE_PATH are not set — fill env/.staging.env-local before a Secarang run.");
  }
  return new URL(path.replace(/^\//, ""), root).toString();
}

/** CIBO's root with a trailing slash: CIBO_BASE_URL when set, else `https://<SECARANG host>/cibo/`. */
export function ciboBaseURL(): string | undefined {
  const own = (process.env.CIBO_BASE_URL ?? "").trim();
  if (own) return own.endsWith("/") ? own : `${own}/`;
  const host = secarangHost();
  return host ? `https://${host}/cibo/` : undefined;
}

/** A CIBO address. Only the login page is opened this way; modules are reached through the sidebar. */
export function ciboURL(path: string): string {
  const root = ciboBaseURL();
  if (!root) throw new Error("SECARANG_BASE_URL (or CIBO_BASE_URL) is not set — fill env/.staging.env-local before a CIBO run.");
  return new URL(path.replace(/^\//, ""), root).toString();
}

/**
 * Before the Secarang SITE password is typed: the page must be on the configured Secarang host AND under the
 * configured instance. Two traps make this worth a guard:
 *  - the site password page also shows on the Fiuu popup's return and on the success page (team doc §2), so a
 *    page that wandered off-host could look like it;
 *  - the two-month-rule pop-up's Privacy Policy link opens `/preprod/` from /ia/ (walk 28.10.2026), an
 *    instance that holds other tickets. The gate is refused there rather than passed.
 */
export function assertSafeSecarangGate(url: string): void {
  const host = secarangHost();
  const seg = secarangInstance();
  if (!host || !seg) {
    throw new Error("SECARANG_BASE_URL / SECARANG_BASE_PATH are not set, so there is no way to tell which Secarang site this password page is.");
  }
  const u = new URL(url);
  if (u.hostname !== host || !(u.pathname === `/${seg}` || u.pathname.startsWith(`/${seg}/`))) {
    throw new Error(
      `Refusing to type the Secarang site password on ${url}: it is outside the configured site https://${host}/${seg}/. ` +
        "A link or redirect has taken the run somewhere it was not sent (e.g. /preprod/).",
    );
  }
}

/** Before the CIBO login password is typed: the page must be under the configured CIBO root. */
export function assertSafeCibo(url: string): void {
  const root = ciboBaseURL();
  if (!root) throw new Error("CIBO is not configured (SECARANG_BASE_URL / CIBO_BASE_URL), so this login page cannot be checked.");
  if (!url.startsWith(root)) {
    throw new Error(`Refusing to type the CIBO password on ${url}: it is outside the configured CIBO root ${root}.`);
  }
}

/**
 * The guard that runs before any password is typed (qa-principles #13).
 *
 * A guessed or redirected URL can land on a different environment, and the
 * login form there looks identical — which is how a QA password reaches
 * production.
 */
export function assertSafeToAuthenticate(url: string): void {
  const root = baseURL();
  if (!root) {
    throw new Error(
      "BASE_URL is not set, so there is no way to tell which environment this login would reach. " +
        "Fill env/.<TEST_ENV>.env-local before running anything that signs in.",
    );
  }
  if (!url.startsWith(root)) {
    throw new Error(
      `Refusing to type a password on ${url}: it is outside the configured portal root ${root}. ` +
        "A redirect has taken the run somewhere it was not sent.",
    );
  }
}
