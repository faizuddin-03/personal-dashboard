/**
 * Test data generator.
 *
 * Two rules from Azfar, 2026-09-15, both enforced here rather than left to
 * whoever writes the next test:
 *
 *  1. Vehicle numbers are allocated from a COUNTER, not randomly, so a run is
 *     reproducible and a failed transaction can be found again afterwards.
 *     The leading characters matter: eSim routes its canned JPJ response by
 *     the vehicle number PREFIX, so the prefix chooses the JPJ outcome.
 *
 *  2. The same mobile number or email may not be used more than 3 times.
 *     Usage is persisted across runs in `state/usage.json`, so the cap holds
 *     between sessions and not just within one.
 *
 * NOT ESTABLISHED: the maximum length eAuto accepts for a vehicle number.
 * `padTo` below is a setting, not a discovered rule — see open questions.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mainCheckoutRoot } from "../../config/main-checkout";

// One file per machine (the main checkout's), so runs on parallel lanes and in ticket worktrees never hand
// out the same vehicle number on the same prefix (21.10.2026). In the main checkout the path is unchanged.
const STATE_PATH = resolve(mainCheckoutRoot(), "automation/state/usage.json");
const LOCK_PATH = `${STATE_PATH}.lock`;

/** How many times one mobile or email may be reused. */
export const MAX_REUSE = 3;

interface UsageState {
  /** Next sequence number per vehicle-number prefix. */
  vehicleCounters: Record<string, number>;
  /** How many times each mobile number has been submitted. */
  mobileUses: Record<string, number>;
  /** How many times each email has been submitted. */
  emailUses: Record<string, number>;
}

const EMPTY: UsageState = { vehicleCounters: {}, mobileUses: {}, emailUses: {} };

function load(): UsageState {
  if (!existsSync(STATE_PATH)) return structuredClone(EMPTY);
  try {
    return { ...structuredClone(EMPTY), ...JSON.parse(readFileSync(STATE_PATH, "utf8")) };
  } catch {
    // A corrupt state file must not silently reset the reuse caps.
    throw new Error(`Could not parse ${STATE_PATH}. Fix or delete it before running tests — deleting it resets the mobile/email reuse counts.`);
  }
}

function save(state: UsageState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  // write-then-rename: a reader in another process never sees a half-written file
  const tmp = `${STATE_PATH}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  renameSync(tmp, STATE_PATH);
}

/**
 * Read-modify-write the state under a cross-process lock (an atomic mkdir), so two lanes allocating at the
 * same moment get different numbers. A lock older than 30 s is a crashed holder and is taken over.
 */
function withState<T>(fn: (state: UsageState) => T): T {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  const until = Date.now() + 15_000;
  for (;;) {
    try { mkdirSync(LOCK_PATH); break; } catch {
      try {
        if (Date.now() - statSync(LOCK_PATH).mtimeMs > 30_000) { rmSync(LOCK_PATH, { recursive: true, force: true }); continue; }
      } catch { continue; }
      if (Date.now() > until) throw new Error(`${LOCK_PATH} held for 15 s: another run is allocating test data (delete the folder if no run is going)`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  try {
    const state = load();
    const out = fn(state);
    save(state);
    return out;
  } finally {
    rmSync(LOCK_PATH, { recursive: true, force: true });
  }
}

/**
 * Allocate the next vehicle number for a prefix.
 *
 * @param prefix  The eSim routing prefix, e.g. "TE". Case is preserved.
 * @param padTo   Total length of the digits after the prefix. Default 6.
 * @returns e.g. "TE000001", then "TE000002", ...
 */
export function nextVehicleNumber(prefix: string, padTo = 6): string {
  return withState((state) => {
    const next = (state.vehicleCounters[prefix] ?? 0) + 1;
    state.vehicleCounters[prefix] = next;
    return `${prefix}${String(next).padStart(padTo, "0")}`;
  });
}

/**
 * A mobile number that has been used fewer than MAX_REUSE times.
 *
 * Walks the existing pool first so numbers are actually reused up to the cap
 * rather than a fresh one being minted every run, then mints a new one.
 */
export function nextMobile(): string {
  return withState((state) => {
    const existing = Object.entries(state.mobileUses).find(([, n]) => n < MAX_REUSE);
    const mobile = existing ? existing[0] : mintMobile(state);
    state.mobileUses[mobile] = (state.mobileUses[mobile] ?? 0) + 1;
    return mobile;
  });
}

/** An email that has been used fewer than MAX_REUSE times. */
export function nextEmail(domain = "example.test"): string {
  return withState((state) => {
    const existing = Object.entries(state.emailUses).find(([, n]) => n < MAX_REUSE);
    const email = existing ? existing[0] : mintEmail(state, domain);
    state.emailUses[email] = (state.emailUses[email] ?? 0) + 1;
    return email;
  });
}

function mintMobile(state: UsageState): string {
  for (let i = 0; i < 10_000; i++) {
    // 01x-xxxxxxx shape, 10 digits total.
    const candidate = `01${randomDigits(8)}`;
    if (!(candidate in state.mobileUses)) return candidate;
  }
  throw new Error("Could not mint an unused mobile number after 10000 attempts.");
}

function mintEmail(state: UsageState, domain: string): string {
  for (let i = 0; i < 10_000; i++) {
    const candidate = `qa.stms.${Date.now().toString(36)}${randomDigits(3)}@${domain}`;
    if (!(candidate in state.emailUses)) return candidate;
  }
  throw new Error("Could not mint an unused email after 10000 attempts.");
}

function randomDigits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
}

/** Current reuse count — for assertions and for reporting. */
export function usageReport(): UsageState {
  return load();
}

/** Engine number. Shape mirrors real staging data, e.g. "4G/ 1929171". */
export function randomEngineNo(): string {
  return `${randomDigits(1)}G/ ${randomDigits(7)}`;
}

/** Chassis number. Shape mirrors real staging data, e.g. "555/ AH-1119". */
export function randomChassisNo(): string {
  return `${randomDigits(3)}/ AH-${randomDigits(4)}`;
}
