// Runner registry for pipeline-built automation (Faizuddin, 2026-10-27:
// "once the automation is created, the dwarf should also build a page for it
// in the ticket page, for me to track the automation, and to run it").
//
// Contract (scripts/pipeline/README.md §10): for every suite the pipeline's
// Dwarf builds, the runner UI lives in app/eauto/<digits>/Runner.tsx (a client
// component, default export, props RunnerProps), app/eauto/<digits>/page.tsx
// only renders <Runner />, and Dwarf adds ONE line here. The ticket page
// /pipeline/<KEY> then shows the same runner inside its "Automation" panel.
// Both use the same useBackgroundRuns key (runKey), so a run started on one
// shows on the other.
//
// Suites made outside the pipeline (12107, 12153, 12166, 12257, 12412,
// jomcheck, ...) are NOT listed here: the ticket page links to their runner
// page instead of embedding it.
//
// dwarf:build checks this file for the ticket's line (scripts/pipeline/actions/_dwarf-common.mjs
// runnerContractProblems), so keep each entry on one line, in this shape:
//   "EAINT-12345": { runKey: "eauto/12345", page: "/eauto/12345", load: () => import("@/app/eauto/12345/Runner") },
import type { ComponentType } from "react";

export interface RunnerProps {
  /** Inside the ticket page's panel: hide the page header and back link, fit the panel width. */
  embedded?: boolean;
  /**
   * TS ids to tick (e.g. the panel's "Pick P1 tests" button). Each time the
   * list changes, the runner ticks exactly the listed ids it knows and unticks
   * the rest. Undefined = leave the runner's own selection alone.
   */
  pick?: string[];
}

export interface RunnerEntry {
  /** useBackgroundRuns key, same as RUN_KEY in Runner.tsx, e.g. "eauto/12345". */
  runKey: string;
  /** Standalone runner page, e.g. "/eauto/12345". */
  page: string;
  load: () => Promise<{ default: ComponentType<RunnerProps> }>;
}

export const RUNNERS: Record<string, RunnerEntry> = {
  "EAINT-12028": { runKey: "eauto/12028", page: "/eauto/12028", load: () => import("@/app/eauto/12028/Runner") },
};
