import type { ChildProcess } from "node:child_process";

/**
 * Shared between the run route and the live-log route. The run blocks on two
 * human gates (reCAPTCHA, then the QR scan), so the page polls this buffer to
 * show the operator what is being asked of them instead of looking hung.
 */
export interface RunEntry {
  child: ChildProcess | null;
  stopRequested: boolean;
  outputBuffer: string;
}

export const runState = { runs: new Map<string, RunEntry>() };
