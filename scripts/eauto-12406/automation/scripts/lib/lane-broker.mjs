// The lane broker (21.10.2026): a run says WHAT it needs, the broker picks free lanes from the roster
// (automation/env/lanes.json) and takes all their locks at once, or none:
//   single    one ready lane
//   ucd2ucd   two ready lanes of two DIFFERENT companies (UCD A = first, UCD B = second; mains preferred)
//   main+sub  a main user and a sub user of the SAME company (main first)
// Locks are the same lane-N.lock files cr-run and the runners use, in the main checkout's automation/.artifacts,
// so a broker-picked run and a run on a named lane never take the same lane. `pool` limits the choice
// (e.g. a ticket that may only use lanes 3,4,5). Waits (polls) until something is free, up to waitMs.
import * as fs from "node:fs";
import * as path from "node:path";
import { sharedArtifacts } from "./main-checkout.mjs";

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

// LANES_FILE, else env/lanes.local.json (one QA's own accounts, gitignored), else env/lanes.json (config/lane-roster.ts).
export function rosterFile(auto) {
  if (process.env.LANES_FILE) return path.resolve(process.env.LANES_FILE);
  const local = path.join(auto, "env", "lanes.local.json");
  return fs.existsSync(local) ? local : path.join(auto, "env", "lanes.json");
}

export function loadRoster(auto) {
  const raw = JSON.parse(fs.readFileSync(rosterFile(auto), "utf8"));
  return Object.entries(raw.lanes).map(([lane, l]) => ({ lane, ...l }));
}

function isFree(art, lane) {
  const f = path.join(art, `lane-${lane}.lock`);
  if (!fs.existsSync(f)) return true;
  try { const h = JSON.parse(fs.readFileSync(f, "utf8")); return !alive(h.pid); } catch { return true; }
}

/** Every combination that meets the need, best first, from the free ready lanes. */
export function candidates(roster, need, free) {
  const ok = roster.filter((l) => l.ready && free(l.lane));
  if (need === "single") return [...ok].sort((a, b) => Number(a.role === "sub") - Number(b.role === "sub")).map((l) => [l]);
  if (need === "ucd2ucd") {
    const out = [];
    for (const a of ok) for (const b of ok) if (a.lane !== b.lane && a.company !== b.company) out.push([a, b]);
    const score = ([a, b]) => (a.role === "main" ? 0 : 2) + (b.role === "main" ? 0 : 1);
    return out.sort((x, y) => score(x) - score(y));
  }
  if (need === "main+sub") {
    const out = [];
    for (const m of ok.filter((l) => l.role === "main")) for (const s of ok.filter((l) => l.role === "sub" && l.company === m.company)) out.push([m, s]);
    return out;
  }
  throw new Error(`unknown need "${need}" (single | ucd2ucd | main+sub)`);
}

/** Take every lock of `lanes`, or none. Returns the lock files taken, or null. */
function takeAll(art, lanes, runId) {
  const taken = [];
  for (const l of lanes) {
    const f = path.join(art, `lane-${l.lane}.lock`);
    try {
      if (fs.existsSync(f) && isFree(art, l.lane)) fs.rmSync(f, { force: true }); // a crashed holder's lock
      fs.writeFileSync(f, JSON.stringify({ pid: process.pid, run: runId, since: new Date().toISOString() }), { flag: "wx" });
      taken.push(f);
    } catch {
      for (const t of taken) fs.rmSync(t, { force: true });
      return null;
    }
  }
  return taken;
}

/**
 * Get lanes for a run. Resolves { lanes: [{lane, persona, company, role, ...}], release() }.
 * Throws at once when the roster cannot ever meet the need (e.g. main+sub with no sub user in the pool).
 */
export async function acquireLanes({ auto, need = "single", pool, runId, waitMs = 60 * 60_000, log = console.log }) {
  const art = sharedArtifacts(auto);
  fs.mkdirSync(art, { recursive: true });
  const roster = loadRoster(auto).filter((l) => !pool || pool.includes(l.lane));
  if (!candidates(roster, need, () => true).length) throw new Error(`no lanes in ${pool ? `pool ${pool.join(",")}` : "the roster"} can ever meet "${need}" (env/lanes.json)`);
  const until = Date.now() + waitMs;
  let said = false;
  for (;;) {
    for (const combo of candidates(roster, need, (l) => isFree(art, l))) {
      const taken = takeAll(art, combo, runId);
      if (taken) return { lanes: combo, release: () => { for (const f of taken) fs.rmSync(f, { force: true }); } };
    }
    if (Date.now() > until) throw new Error(`no free lanes for "${need}" after ${Math.round(waitMs / 60000)} min`);
    if (!said) { log(`waiting for free lanes (${need}${pool ? `, pool ${pool.join(",")}` : ""})…`); said = true; }
    await new Promise((r) => setTimeout(r, 5_000));
  }
}
