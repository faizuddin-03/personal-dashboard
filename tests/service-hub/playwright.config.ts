import { defineConfig, devices } from "@playwright/test";

const headed = process.env.PW_HEADED === "1";
const videoMode = process.env.PW_VIDEO === "1" ? "on" as const : "off" as const;
const outputDir = process.env.PW_OUTPUT_DIR || "./test-results";

export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [["json", { outputFile: process.env.PW_JSON_REPORT || "" }]],
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
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
