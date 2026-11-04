// Data one TS hands to a later TS of the same ticket: a vehicle, a transaction, an APT made by an earlier TS.
// Kept in the run folder (cr/<TICKET>/04-runs/<RUN_ID>/handoff.json, next to gate.jsonl), so a TS that depends on
// another can also pick up what an EARLIER run's valid TS handed on.
//
// Moved here 27.10.2026 from cr/EAINT-12253/03-spec/_checks.ts (EAINT-12626 had copied it).
import * as fs from "node:fs";
import * as path from "node:path";
import type { TsRun } from "./ts-run";

function handoffFile(ts: TsRun) {
  return path.resolve(ts.dir, "..", "..", "handoff.json");
}

/** Hand `value` on under `key` for a later TS of this run (stamped with this TS and the time). */
export function handOff(ts: TsRun, key: string, value: Record<string, unknown>) {
  const f = handoffFile(ts);
  const all = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  all[key] = { ...value, by: ts.id, at: new Date().toISOString() };
  fs.writeFileSync(f, JSON.stringify(all, null, 2));
  ts.note(`handed on for later TS: ${key} = ${JSON.stringify(value)}`);
}

/** What an earlier TS of THIS run handed on under `key`. */
export function takeOver<T = Record<string, unknown>>(ts: TsRun, key: string): T | undefined {
  const f = handoffFile(ts);
  if (!fs.existsSync(f)) return undefined;
  return JSON.parse(fs.readFileSync(f, "utf8"))[key];
}

/**
 * `key` as handed on by `byTs` in an EARLIER run of this ticket whose gate filed `byTs` VALID (04-runs/<run>/gate.jsonl):
 * the newest such hand-off (by its own `at`). `skip(value)` drops a value already used up. Lets a TS that depends on
 * another TS's data run in its own run without copying handoff.json by hand (12253_FF_TS11 ← 12253_FF_TS12, 21.10.2026).
 */
export function takeOverFromValidRun<T extends { at?: string } = Record<string, unknown> & { at?: string }>(
  ts: TsRun, key: string, byTs: string, skip: (v: T) => boolean = () => false,
): (T & { run: string }) | undefined {
  const runs = path.resolve(ts.dir, "..", "..", "..");
  const here = path.basename(path.resolve(ts.dir, "..", ".."));
  let best: (T & { run: string }) | undefined;
  for (const run of fs.existsSync(runs) ? fs.readdirSync(runs) : []) {
    if (run === here) continue;
    const gate = path.join(runs, run, "gate.jsonl"), hand = path.join(runs, run, "handoff.json");
    if (!fs.existsSync(gate) || !fs.existsSync(hand)) continue;
    const valid = fs.readFileSync(gate, "utf8").split(/\r?\n/).some((l) => {
      try { const g = JSON.parse(l); return g.ts === byTs && g.verdict === "VALID"; } catch { return false; }
    });
    if (!valid) continue;
    let v: T | undefined;
    try { v = JSON.parse(fs.readFileSync(hand, "utf8"))[key]; } catch { v = undefined; }
    if (!v || (v as { by?: string }).by !== byTs || skip(v)) continue;
    if (!best || String(v.at ?? "") > String(best.at ?? "")) best = { ...v, run };
  }
  return best;
}

/** Every value handed on under `key` in any run of this ticket (e.g. the vehicles a TS already used up). */
export function handedOnEver<T = Record<string, unknown>>(ts: TsRun, key: string): T[] {
  const runs = path.resolve(ts.dir, "..", "..", "..");
  const out: T[] = [];
  for (const run of fs.existsSync(runs) ? fs.readdirSync(runs) : []) {
    const hand = path.join(runs, run, "handoff.json");
    if (!fs.existsSync(hand)) continue;
    try { const v = JSON.parse(fs.readFileSync(hand, "utf8"))[key]; if (v) out.push(v); } catch { /* unreadable: ignore */ }
  }
  return out;
}
