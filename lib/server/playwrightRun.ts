import { NextResponse } from "next/server";
import path from "node:path";
import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";

/**
 * Shared server-side helpers for the dashboard's Playwright run routes
 * (app/api/eauto*). Server-only: imports node:child_process.
 *
 * 1. killTree() — kills the spawned Playwright process AND every browser it
 *    started. On Windows `child.kill()` only ends the outer process and leaves
 *    chromium running, so it uses `taskkill /T /F`.
 * 2. runInProgressResponse() — the 409 every single-run route returns when a
 *    second POST arrives while one is still running.
 * 3. spawnPlaywrightCli() — starts `playwright <args>` with node directly, no
 *    shell, so client-sent text (scenario titles in --grep) is never parsed
 *    by cmd.exe.
 */

export function killTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]); } catch { /* ignore */ }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* ignore */ } }
  }
}

export const RUN_IN_PROGRESS_ERROR =
  "A run is already in progress on this page — stop it or wait for it to finish.";

export function runInProgressResponse() {
  return NextResponse.json({ error: RUN_IN_PROGRESS_ERROR }, { status: 409 });
}

/**
 * Runs the Playwright CLI from `<projectRoot>/node_modules` through the
 * current node binary, with an argument array and no shell — same command as
 * `npx playwright <args>` without cmd.exe in between.
 */
export function spawnPlaywrightCli(
  projectRoot: string,
  args: string[],
  opts: Omit<SpawnOptions, "shell" | "env"> & { env?: Record<string, string | undefined> } = {},
): ChildProcess {
  const cli = path.join(projectRoot, "node_modules", "@playwright", "test", "cli.js");
  return spawn(process.execPath, [cli, ...args], {
    cwd: projectRoot,
    detached: process.platform !== "win32",
    ...opts,
    env: opts.env as NodeJS.ProcessEnv | undefined,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Accepts only scenario titles made of plain title characters (letters,
 * digits, space, and _ - : / ( ) . , & ' + #). Every title in the current
 * runner pages fits; anything else (quotes, $, %, |, <, >, backticks,
 * newlines) is rejected before it reaches a command line.
 */
const SAFE_TITLE = /^[A-Za-z0-9 _\-:/().,&'+#]{1,200}$/;

export function invalidScenarioTitles(scenarios: unknown): string[] | null {
  if (!Array.isArray(scenarios)) return ["(scenarios is not a list)"];
  const bad = scenarios.filter((s) => typeof s !== "string" || !SAFE_TITLE.test(s));
  return bad.length ? bad.map(String) : null;
}

/** Escapes regex metacharacters in each title and joins them with "|". */
export function grepFor(scenarios: string[]): string {
  return scenarios.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

/** Local-time run folder stamp with seconds: "2026-10-21_143207". */
export function runFolderStamp(now = new Date()): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}_${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}`;
}
