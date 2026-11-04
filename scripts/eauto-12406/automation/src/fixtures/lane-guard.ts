/**
 * Machine-wide guards so parallel runs (several lanes, several ticket worktrees) never share a thing that
 * only one run may use at a time (21.10.2026). Locks live in the MAIN checkout's automation/.artifacts,
 * next to the lane locks scripts/cr-run.mjs takes, so every worktree sees the same ones.
 *
 * 1. claimPersonaLane: a run that signs in as ANOTHER lane's dealer (UCD to UCD: lane 1 logs in as
 *    faizuddin2 = lane 2) must hold that lane too. Free -> this process takes the lane's lock until it exits;
 *    held by another live run -> stop with a message, never share the account.
 * 2. withMachineLock: one holder at a time for a named resource (an eSim prefix being switched).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { mainCheckoutRoot } from "@config/main-checkout";
import type { PersonaKey } from "@config/personas";
import { laneOfPersona, laneRoster } from "@config/lane-roster";

const ART = path.join(mainCheckoutRoot(), "automation", ".artifacts");

/** Which lane's account a dealer persona is (roster env/lanes.json). */
const laneOf = (key: PersonaKey): string | undefined => laneOfPersona(key)?.lane;

interface Held { pid: number; run: string; since: string }

const alive = (pid: number): boolean => {
  try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === "EPERM"; }
};
const readHeld = (file: string): Held | undefined => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as Held; } catch { return undefined; }
};

/** Write `file` only if nobody live holds it. Returns the live holder when there is one. */
function tryTake(file: string, run: string): Held | undefined {
  fs.mkdirSync(ART, { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      fs.writeFileSync(file, JSON.stringify({ pid: process.pid, run, since: new Date().toISOString() }), { flag: "wx" });
      return undefined;
    } catch {
      const held = readHeld(file);
      if (held && held.pid === process.pid) return undefined;
      if (held && alive(held.pid)) return held;
      fs.rmSync(file, { force: true }); // a crashed holder's lock
    }
  }
  return readHeld(file);
}

const borrowed = new Set<string>();
process.once("exit", () => {
  for (const file of borrowed) if (readHeld(file)?.pid === process.pid) fs.rmSync(file, { force: true });
});

export function claimPersonaLane(key: PersonaKey): void {
  const lane = laneOf(key);
  if (!lane) return;
  // The lanes this run's runner already holds: LANES ("1,2", UCD to UCD runners) or LANE.
  const mine = (process.env.LANES || process.env.LANE || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (mine.includes(lane)) return;
  const file = path.join(ART, `lane-${lane}.lock`);
  if (borrowed.has(file)) return;
  const held = readHeld(file);
  if (held && alive(held.pid) && process.env.RUN_ID && held.run === process.env.RUN_ID) return;
  const holder = tryTake(file, `${process.env.RUN_ID ?? "run"} (lane ${process.env.LANE ?? "-"} signed in as ${key})`);
  if (holder) {
    throw new Error(
      `Signing in as "${key}" needs lane ${lane}, and run "${holder.run}" (pid ${holder.pid}) holds it since ${holder.since}. ` +
        `Two runs must not share one account: wait for that run, or give this run lanes that include ${lane} ` +
        `(UCD to UCD: lanes 1 + 2). See automation/env/lanes.md.`,
    );
  }
  borrowed.add(file);
}

/**
 * Run `fn` holding the machine-wide lock `name` (e.g. "esim-OI"): another run asking for the same name waits,
 * up to `waitMs`, then fails naming the holder. A crashed holder's lock is taken over.
 */
export async function withMachineLock<T>(name: string, fn: () => Promise<T>, waitMs = 15 * 60_000): Promise<T> {
  const file = path.join(ART, `${name.replace(/[^\w.-]/g, "_")}.lock`);
  const until = Date.now() + waitMs;
  let said = false;
  for (;;) {
    const holder = tryTake(file, `${process.env.RUN_ID ?? "run"} (lane ${process.env.LANE ?? "-"})`);
    if (!holder) break;
    if (Date.now() > until) throw new Error(`${name} is still held by "${holder.run}" (pid ${holder.pid}) since ${holder.since}`);
    if (!said) { console.log(`  waiting for ${name}: held by ${holder.run}`); said = true; }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  try { return await fn(); } finally {
    if (readHeld(file)?.pid === process.pid) fs.rmSync(file, { force: true });
  }
}

/**
 * Hold EVERY lane of one company (by ROC) for the rest of this run: a TS that changes a company setting in BO
 * (SSM boxes, permissions, address) changes it for all that company's users, so no other run may be on any of
 * them meanwhile. Waits up to `waitMs` for the other runs to finish, then fails naming them. Companies that are
 * not in the roster (not ours) need no lock. Called by BoCompanyAccountsPage.set (21.10.2026).
 */
export async function claimCompany(roc: string, waitMs = 20 * 60_000): Promise<void> {
  const lanes = laneRoster().filter((l) => l.roc && l.roc === roc).map((l) => l.lane);
  if (!lanes.length) return;
  const mine = (process.env.LANES || process.env.LANE || "").split(",").map((s) => s.trim()).filter(Boolean);
  const until = Date.now() + waitMs;
  let said = false;
  for (;;) {
    const takenNow: string[] = [];
    let blocker: Held | undefined;
    for (const lane of lanes) {
      if (mine.includes(lane)) continue;
      const file = path.join(ART, `lane-${lane}.lock`);
      if (borrowed.has(file)) continue;
      const holder = tryTake(file, `${process.env.RUN_ID ?? "run"} (company ${roc} held by lane ${process.env.LANE ?? "-"})`);
      if (holder) { blocker = holder; break; }
      takenNow.push(file);
    }
    if (!blocker) { for (const f of takenNow) borrowed.add(f); return; }
    for (const f of takenNow) fs.rmSync(f, { force: true });
    if (Date.now() > until) throw new Error(`Company ${roc} is in use by run "${blocker.run}" (pid ${blocker.pid}); a TS that changes its BO settings must have all its lanes (${lanes.join(", ")}).`);
    if (!said) { console.log(`  waiting for company ${roc} (lanes ${lanes.join(", ")}): ${blocker.run}`); said = true; }
    await new Promise((r) => setTimeout(r, 5_000));
  }
}
