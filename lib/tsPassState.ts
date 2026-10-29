"use client";
// TS rows on the automation pages tinted from the TS Tracker (Faizuddin,
// 2026-10-22): "make the TS only slightly green if i've ran it and considered
// passed. it should tally with the TS checker … if the pass is because i
// manually pass it in the TS tracker and not because it passed through
// automation, it will be a darker version of the slightly green" … "i can still
// run it. and if the runs failed, it will be slightly red".
//
// Source of truth = the TS Tracker (localStorage `test_tracker_crs`, app/tests):
//   status "pass" + autoUpdatedAt set → passed by an automation run
//   status "pass", no autoUpdatedAt   → passed by hand (a manual change clears it)
// Matching is the same as lib/tsTrackerSync.ts: the case's TS number equals the
// id ("12153_TS1"), or, inside the CR of that ticket (EAINT-12153), the id
// without its prefix ("TS1" / "TS01").
import { useCallback, useEffect, useState } from "react";
import { extractTsId } from "@/lib/tsTrackerSync";
import { TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, crNoOf, loadTracker, normTs, ticketNoOf, type CREntry } from "@/lib/tsTrackerModel";

export type TsPassState = "auto" | "manual" | "fail" | null;

/** Row tint: light green = automation pass, darker green = manual pass, light red = failed. The row stays runnable. */
export const TS_PASS_ROW: Record<"auto" | "manual" | "fail", string> = {
  auto: "bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12]",
  manual: "bg-emerald-800/40 hover:bg-emerald-800/50",
  fail: "bg-red-500/[0.07] hover:bg-red-500/[0.12]",
};
export const TS_PASS_TITLE: Record<"auto" | "manual" | "fail", string> = {
  auto: "Passed in an automation run (TS Tracker)",
  manual: "Passed by hand in the TS Tracker",
  fail: "Failed in the TS Tracker (last run or set by hand)",
};

function stateIn(data: CREntry[], tsId: string): TsPassState {
  const full = normTs(tsId);
  const t = ticketNoOf(tsId);
  const short = t ? normTs(tsId.slice(t.length + 1)) : null;
  for (const cr of data) {
    const inTicket = !!t && crNoOf(cr.crKey) === t;
    for (const suite of cr.suites ?? []) {
      for (const tc of suite.cases ?? []) {
        if (tc.disabled) continue;
        const c = normTs(tc.tsNumber);
        if (c !== full && !(inTicket && short && c === short)) continue;
        if (tc.status === "fail") return "fail";
        if (tc.status !== "pass") return null;
        return tc.autoUpdatedAt ? "auto" : "manual";
      }
    }
  }
  return null;
}

/** `passState(titleOrId)` → "auto" | "manual" | null, kept in step with the TS Tracker. */
export function useTsPassState() {
  const [data, setData] = useState<CREntry[]>([]);
  useEffect(() => {
    const load = () => setData(loadTracker());
    load();
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key === TRACKER_KEY) load(); };
    window.addEventListener(TS_TRACKER_UPDATED_EVENT, load);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(TS_TRACKER_UPDATED_EVENT, load); window.removeEventListener("storage", onStorage); };
  }, []);
  return useCallback((titleOrId: string): TsPassState => {
    const id = extractTsId(titleOrId);
    return id ? stateIn(data, id) : null;
  }, [data]);
}
