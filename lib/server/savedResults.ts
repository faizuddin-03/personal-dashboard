import * as fs from "node:fs";
import * as path from "node:path";
import { NextResponse } from "next/server";

// Last result of each eAuto tool run, kept on disk — Faizuddin, 2026-10-21:
// "the only thing i need is the result to be saved. so lets say i run a checker
// and close my laptop. the next day, once i open my laptop again, the results
// of the checker is still there and i can use it immediately".
//
// The browser copy (hooks/useBackgroundRuns.ts, localStorage) is lost when the
// fetch dies mid-run (laptop asleep) or storage is cleared; this file is the
// copy that always survives. One JSON file per run key, overwritten by the next
// run. Folder is gitignored.

const DIR = path.join(process.cwd(), "data", "saved-results");

export interface SavedResult<T = unknown> {
  key: string;
  /** The dashboard's own runId (sent in every startRun body), so the page can tell
   *  whether this is the run it started. */
  runId: string;
  savedAt: string;
  payload: T;
}

const fileFor = (key: string) => path.join(DIR, `${key.replace(/[^a-z0-9-]+/gi, "_")}.json`);

export function saveResult(key: string, runId: unknown, payload: unknown): void {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const rec: SavedResult = { key, runId: typeof runId === "string" ? runId : "", savedAt: new Date().toISOString(), payload };
    const file = fileFor(key);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(rec));
    fs.renameSync(`${file}.tmp`, file);
  } catch { /* never fail a run over saving its result */ }
}

export function loadResult(key: string): SavedResult | null {
  try { return JSON.parse(fs.readFileSync(fileFor(key), "utf-8")) as SavedResult; } catch { return null; }
}

export function deleteResult(key: string): void {
  try { fs.rmSync(fileFor(key), { force: true }); } catch { /* ignore */ }
}

/** NextResponse.json(payload) that also saves the payload as `key`'s last result. */
export function jsonAndSave(key: string, runId: unknown, payload: unknown, init?: ResponseInit): NextResponse {
  saveResult(key, runId, payload);
  return NextResponse.json(payload, init);
}
