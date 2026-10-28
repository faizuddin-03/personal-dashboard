import { defineConfig, devices } from "@playwright/test";

const headed = process.env.PW_HEADED === "1";
const videoMode = process.env.PW_VIDEO === "1" ? "on" as const : "off" as const;
const outputDir = process.env.PW_OUTPUT_DIR || "./test-results";
// Detailed/demo mode (BasePage.demoHighlight/demoPause, gated the same way)
// adds a ~1400ms pause per highlighted step — a DO-flow test with logins,
// listing searches, popup fields and downloads easily racks up 30-40 of
// those, which blew through the fixed 60s timeout the moment detailed mode
// (default on) got wired into this flow, 2026-09-23.
const detailedMode = process.env.PW_DETAILED === "1";

export default defineConfig({
  testDir: "./specs",
  timeout: detailedMode ? 240_000 : 60_000,
  retries: 0,
  workers: 1,
  reporter: [
    ["json", { outputFile: process.env.PW_JSON_REPORT || "" }],
    // Emits the per-test step tree to PW_STEP_REPORT for the runner UI's
    // step-by-step pass/fail checklist (the json reporter omits steps).
    ["./reporters/step-reporter.ts", {}],
  ],
  outputDir,

  use: {
    baseURL: process.env.EAUTO_BASE_URL || "https://staging.eauto.my/uat1",
    headless: !headed,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: videoMode,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium",
      // devices["Desktop Chrome"] carries its own 1280x720 viewport, which
      // would silently override a wider one set at the top-level `use` —
      // set it here, after the spread, so it actually takes effect.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1200 } },
    },
  ],
});
