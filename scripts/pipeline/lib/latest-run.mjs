// Latest-run check for findings (2026-10-27, night enhancement round 5).
//
// Charmain's defects file: "TRIAGE FROM THE LATEST RUN, NEVER FROM A REPORT.
// ... Read the newest results.json for the case ... before filing a defect
// against a screen that already works" [charmain-repo: test-scenarios/defects.yaml:14-19];
// and her defect states include "resolved — re-run passed"
// [charmain-repo: test-scenarios/defects.yaml:21-26]. A finding is a snapshot of
// ONE run: when a newer saved run of the same ticket passed the same TS, the
// QA-Issue would be raised against a screen that already works (fixed since,
// or flaky). This module finds that newer result; the Raise route asks for a
// second press before raising such a finding, and the runs route marks open
// findings when a newer run passes their TS.

import { listRuns, findRun, listFindings, writeFinding } from "../store.mjs";
import { voidedFor, isRunVoided } from "./voided-runs.mjs";

/** "12153_TS03" / "TS3" / "EAINT-12153-TS03" → "TS3" (digits-prefix and zero padding ignored). */
export const canonTs = s => String(s ?? "").toUpperCase().replace(/^.*?(TS\d+)/, "$1").replace(/TS0*(\d+)/g, "TS$1").trim();

/** TS ids a run check covers: "12339_TS19/TS20: title" → ["TS19", "TS20"]. */
export function checkTsIds(check) {
  const head = String(check?.title ?? "").split(":")[0];
  const ids = [...`${head} ${check?.tsLabel ?? ""}`.toUpperCase().matchAll(/TS0*(\d+)/g)].map(m => `TS${m[1]}`);
  return [...new Set(ids)];
}

const runTime = r => String(r?.finishedAt ?? r?.savedAt ?? r?.startedAt ?? "");
const verdict = s => (s === "passed" ? "passed" : s === "skipped" ? "skipped" : s ? "failed" : "unknown");

/**
 * The newest saved run of `key` that is newer than the finding's own run and
 * has a check for the finding's TS: { runId, runLabel, at, status } or null.
 * A finding for "TS19/TS20" counts as passed only when every one of its TS
 * passed in that run.
 */
export function newerResult(key, finding) {
  const want = String(finding?.ts ?? "").split("/").map(canonTs).filter(Boolean);
  if (!want.length) return null;
  const own = finding.runId ? findRun(key, finding.runId) : null;
  const since = own ? runTime(own) : String(finding.createdAt ?? "");
  for (const run of listRuns(key)) { // newest first
    if (own && run.runId === own.runId) return null; // reached the finding's own run: nothing newer
    if (since && runTime(run) && runTime(run) <= since) return null;
    if (voidedFor(key, run.runId, finding.ts)) continue; // round 12: a voided run proves nothing either way
    const hits = (run.checks ?? []).filter(c => checkTsIds(c).some(id => want.includes(id)));
    if (!hits.length) continue;
    const states = hits.map(c => verdict(c.status));
    // Every TS of the finding must have run and passed; one missing = partial.
    const allCovered = want.every(id => hits.some(c => checkTsIds(c).includes(id)));
    const status = states.includes("failed") ? "failed"
      : states.every(s => s === "passed") ? (allCovered ? "passed" : "partial")
        : states.includes("passed") ? "partial" : states[0];
    return { runId: run.runId, ...(run.runLabel ? { runLabel: run.runLabel } : {}), at: runTime(run), status };
  }
  return null;
}

/**
 * After a run is saved: findings of `key` still open or confirmed (not raised,
 * not dismissed) whose TS this run passed get `passedSince`; those it failed
 * again lose it. Returns { marked: [findingId], cleared: [findingId] }.
 */
export function markFindingsAfterRun(key, run) {
  const out = { marked: [], cleared: [] };
  if (!run?.checks?.length || isRunVoided(key, run.runId)) return out;
  for (const f of listFindings(key)) {
    if (f.state !== "open" && f.state !== "confirmed") continue;
    if (f.runId && f.runId === run.runId) continue;
    const r = newerResult(key, f);
    if (r?.status === "passed") {
      if (f.passedSince?.runId === r.runId) continue;
      writeFinding({ ...f, passedSince: { runId: r.runId, ...(r.runLabel ? { runLabel: r.runLabel } : {}), at: r.at } });
      out.marked.push(f.id);
    } else if (f.passedSince && r && r.status === "failed") {
      const { passedSince: _drop, ...rest } = f;
      void _drop;
      writeFinding(rest);
      out.cleared.push(f.id);
    }
  }
  return out;
}

/** One plain line for messages: "12153_TS03 passed in a newer run (Run 4, 2026-10-27 21:05)". */
export function newerPassLine(finding, r) {
  const when = String(r.at ?? "").replace("T", " ").slice(0, 16);
  return `${finding.ts} passed in a newer run (${r.runLabel ?? r.runId}${when ? `, ${when}` : ""})`;
}
