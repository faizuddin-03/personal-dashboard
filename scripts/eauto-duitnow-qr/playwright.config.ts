import { defineConfig } from "@playwright/test";

/**
 * EAINT-12257 — DuitNow QR happy flow.
 *
 * Headed is the DEFAULT here, unlike every other suite in this repo. The QR
 * code has to be visible on a real screen for a human to scan it with a phone,
 * so a headless run cannot complete the payment step at all. QR_HEADLESS=1 is
 * accepted only so the pre-payment portion can be smoke-tested.
 *
 * workers: 1 / retries: 0 — every run mints a NEW dealer and spends a real
 * RM 108.00 of sandbox payment. A retry would create a second application and
 * ask the human for a second scan.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 45 * 60 * 1000, // a human has to pick up a phone and scan; see QR_SCAN_BUDGET_MS
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "report.json" }]],
  use: {
    headless: process.env.QR_HEADLESS === "1",
    baseURL: (process.env.EAUTO_BASE || "https://staging.eauto.my").replace(/\/+$/, ""),
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    screenshot: "only-on-failure",
    video: process.env.QR_VIDEO === "1" ? "on" : "off",
    trace: "retain-on-failure",
  },
  outputDir: process.env.QR_OUTPUT_DIR || "./test-results",
});
