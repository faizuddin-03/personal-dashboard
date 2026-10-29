// Voided runs (2026-10-27, night enhancement round 12).
//
// Charmain's voided-runs file: "A voided run is evidence of nothing. It was
// made against a build, branch, environment or fixture the case was never
// meant to face, so neither its red nor its green says anything about the
// product. The run output STAYS ON DISK — voiding withdraws the verdict"
// [charmain-repo: test-scenarios/voided-runs.yaml:1-7]. Rules kept here:
// voiding is a HUMAN judgement (Claude only when told, naming the run), a row
// says WHY in checkable words, never void to make a red go away, and voiding
// is never silent [charmain-repo: test-scenarios/voided-runs.yaml:17-24].
//
// Store: data/pipeline/voided-runs.json = [{ key, runId, ts?, reason, voidedBy, voidedOn }].
// Effects: elf:findings skips a voided run (or the voided TS), the latest-run
// check and the next-step ignore it. The run file itself is never touched.
//
// CLI (only on Faizuddin's explicit word, naming the run):
//   node scripts/pipeline/lib/voided-runs.mjs list [KEY]
//   node scripts/pipeline/lib/voided-runs.mjs void <KEY> <runId> "<reason>" [--ts <TS id>]
//   node scripts/pipeline/lib/voided-runs.mjs unvoid <KEY> <runId> [--ts <TS id>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PIPE_DIR, KEY_RE, isRunId, findRun, addEvent, readTicket } from "../store.mjs";

const FILE = path.join(PIPE_DIR, "voided-runs.json");
const canon = s => String(s ?? "").toUpperCase().replace(/^.*?(TS\d+)/, "$1").replace(/TS0*(\d+)/g, "TS$1");

export function readVoided() {
  try { const v = JSON.parse(fs.readFileSync(FILE, "utf8")); return Array.isArray(v) ? v : []; } catch { return []; }
}

function writeVoided(list) {
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
}

/** The void row that covers this run (whole run) or this TS of it, or null. */
export function voidedFor(key, runId, ts) {
  if (!runId) return null;
  return readVoided().find(v => v.key === key && v.runId === String(runId) && (!v.ts || (ts && String(ts).split("/").map(canon).includes(canon(v.ts))))) ?? null;
}

/** True when the WHOLE run is voided. */
export const isRunVoided = (key, runId) => !!readVoided().find(v => v.key === key && v.runId === String(runId) && !v.ts);

/**
 * Voids a run (or one TS of it). Throws with a plain message when the input is
 * not acceptable. `by` names the person; reason must say why in checkable words.
 */
export function voidRun({ key, runId, ts, reason, by }) {
  if (!KEY_RE.test(String(key))) throw new Error("Give a ticket key, e.g. EAINT-12345");
  if (!isRunId(runId)) throw new Error("Give the run id (letters, digits, _ . - only)");
  const why = String(reason ?? "").replace(/\s+/g, " ").trim();
  if (why.length < 15) throw new Error("Say why the run proves nothing (wrong build / environment / account), in at least 15 characters");
  const who = String(by ?? "").trim();
  if (!who) throw new Error("Say who voids it (voiding is a person's decision)");
  if (!readTicket(key)) throw new Error(`${key} is not in the pipeline`);
  const run = findRun(key, runId);
  if (!run) throw new Error(`No saved run ${runId} for ${key}`);
  const list = readVoided();
  const row = { key, runId: run.runId, ...(ts ? { ts: String(ts) } : {}), reason: why.slice(0, 500), voidedBy: who.slice(0, 80), voidedOn: new Date().toISOString() };
  const i = list.findIndex(v => v.key === key && v.runId === run.runId && String(v.ts ?? "") === String(ts ?? ""));
  if (i >= 0) list[i] = row; else list.push(row);
  writeVoided(list);
  // Never silent.
  addEvent(key, `Run ${run.runLabel ?? run.runId}${ts ? ` (${ts})` : ""} voided by ${row.voidedBy}: ${row.reason.slice(0, 160)}`);
  return row;
}

export function unvoidRun({ key, runId, ts, by }) {
  const list = readVoided();
  const next = list.filter(v => !(v.key === key && v.runId === String(runId) && String(v.ts ?? "") === String(ts ?? "")));
  if (next.length === list.length) return false;
  writeVoided(next);
  addEvent(key, `Run ${runId}${ts ? ` (${ts})` : ""} no longer voided${by ? ` (${by})` : ""}`);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, key, runId, reason] = process.argv.slice(2);
  const tsAt = process.argv.indexOf("--ts");
  const ts = tsAt > 0 ? process.argv[tsAt + 1] : undefined;
  try {
    if (cmd === "void") console.log(JSON.stringify(voidRun({ key, runId, ts, reason, by: "Faizuddin (via Claude Code)" })));
    else if (cmd === "unvoid") console.log(unvoidRun({ key, runId, ts, by: "Faizuddin (via Claude Code)" }) ? "unvoided" : "was not voided");
    else for (const v of readVoided().filter(v => !key || v.key === key)) console.log(`${v.key} ${v.runId}${v.ts ? ` ${v.ts}` : ""} — ${v.reason} (${v.voidedBy}, ${v.voidedOn.slice(0, 10)})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
