import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  retries: 0,
  workers: 1, // serial — tests create real transactions
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.EAUTO_BASE_URL || "https://staging.eauto.my/uat1",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
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
