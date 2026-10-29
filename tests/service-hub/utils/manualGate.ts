import { type Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Pauses the running automation at a genuine human/dev hand-off point (e.g.
 * "ask dev to stop the Report Engine") and waits for a person to click
 * Resume on the dashboard before continuing — TS04 needs this twice (stop
 * the engine, later restart it), and there's no way to do either from
 * inside the browser under test.
 *
 * Mechanics: `run/route.ts` sets `PW_GATE_DIR` to
 * `<recordDir>/_run/gates` for a dashboard-started run. This writes a
 * `<gateId>.waiting.json` file there (picked up by
 * `app/api/eauto/12166/live-log/route.ts` and surfaced as a pause banner +
 * Resume button in the dashboard), then polls for a `<gateId>.resume` file
 * (written by `app/api/eauto/12166/resume/route.ts` when Resume is
 * clicked). Both files are removed once resumed, so the same gate id could
 * be reused later in the same run without stale state.
 *
 * No-ops immediately if PW_GATE_DIR isn't set — e.g. running via
 * `npx playwright test` directly, outside the dashboard, where there's no
 * one to click Resume anyway.
 */
export async function waitForManualResume(
  page: Page,
  gateId: string,
  message: string,
  opts: { maxWaitMs?: number } = {},
): Promise<void> {
  await test.step(`MANUAL GATE: ${message}`, async () => {
    const gateDir = process.env.PW_GATE_DIR;
    if (!gateDir) {
      await test.step("PW_GATE_DIR not set — skipping manual pause (not running under the dashboard)", async () => {});
      return;
    }
    fs.mkdirSync(gateDir, { recursive: true });
    const statusFile = path.join(gateDir, `${gateId}.waiting.json`);
    const resumeFile = path.join(gateDir, `${gateId}.resume`);
    // Clear any stale resume signal left behind if this gate id was ever used before.
    try { fs.unlinkSync(resumeFile); } catch { /* didn't exist */ }
    fs.writeFileSync(statusFile, JSON.stringify({ gateId, message, waitingSince: Date.now() }));

    const maxWaitMs = opts.maxWaitMs ?? 20 * 60 * 1000; // 20 minutes — a human/dev coordination step, not a UI wait
    const pollMs = 2000;
    const deadline = Date.now() + maxWaitMs;
    try {
      while (!fs.existsSync(resumeFile)) {
        if (Date.now() > deadline) {
          throw new Error(
            `Manual gate "${gateId}" timed out after ${Math.round(maxWaitMs / 60000)} minutes waiting for Resume: ${message}`,
          );
        }
        await page.waitForTimeout(pollMs);
      }
    } finally {
      try { fs.unlinkSync(statusFile); } catch { /* already gone */ }
      try { fs.unlinkSync(resumeFile); } catch { /* already gone */ }
    }
  });
}
