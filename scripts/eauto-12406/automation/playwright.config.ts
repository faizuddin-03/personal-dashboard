import { defineConfig, devices } from "@playwright/test";
import * as path from "node:path";
// Safe to import above the env load: every value in there is read lazily.
import { baseURL } from "./config/environments";
import { loadEnv } from "./config/load-env";

// One shared staging file; the instance (uat1, preprod1 …) comes from
// INSTANCE= or TEST_ENV=. See config/load-env.ts for the ladder.
loadEnv();

const headed = process.env.HEADED === "1" || process.env.MODE === "HEADED";
const runId = process.env.RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
// Workers inherit the runner's env, so the evidence fixture sees the same id.
process.env.RUN_ID = runId;

/**
 * A cr-runner run (CR_TICKET=EAINT-12345) writes everything into the ticket:
 * cr/<TICKET>/04-runs/<RUN_ID>/ holds results.json, the HTML report, and
 * artifacts/ (failure screenshots, traces, videos). The evidence fixture writes
 * beside them in evidence/, and scripts/cr-collect-evidence.py files the
 * handover copy into 05-evidence/. Nothing about the run is left in
 * automation/test-results/ to be overwritten by the next one.
 */
const crTicket = process.env.CR_TICKET;
const crRunDir = crTicket ? path.join(__dirname, "..", "cr", crTicket, "04-runs", runId) : null;
// A CR run always records video: it is evidence, not a debugging aid.
const recordVideo = process.env.RECORD === "1" || !!crTicket;

/**
 * Firefox preferences for the Firefox projects — the Firefox twin of the Chrome flag above.
 * Firefox 155 (Playwright's build) applies Local Network Access too: from an https page,
 * ws://localhost:7878 TIMES OUT (the portal then says the reader is unavailable), while the same
 * socket from about:blank opens. Switching LNA off lets the page reach the MyKad emulator
 * (EAINT-12253 probes p18 / p19, 20.10.2026). FIREFOX_PREFS_JSON overrides for experiments.
 */
const FIREFOX_PREFS: Record<string, string | number | boolean> = JSON.parse(
  process.env.FIREFOX_PREFS_JSON ?? JSON.stringify({ "network.lna.enabled": false, "network.lna.blocking": false }),
);

// `--list` executes nothing, but a reporter attached unconditionally still
// writes a results file, and a board then counts an empty listing as a run.
const listingOnly = process.argv.includes("--list");

export default defineConfig({
  // Applied to EVERY test file, including cr/<TICKET>/03-spec/, which sits
  // outside automation/ and would otherwise not resolve "@fixtures".
  tsconfig: "./tsconfig.json",
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  // A whole STMS journey crosses six steps and two gateways.
  timeout: 25 * 60 * 1000,
  expect: { timeout: 60 * 1000 },
  fullyParallel: false,
  /**
   * ONE WORKER, and this is not a performance oversight.
   *
   * The emulator keeps card state per channel and would happily serve a
   * channel per worker — but `mykad-websocket-v2.js` on the portal HARDCODES
   * `ws://localhost:7878/IDCard`, the default channel. So two workers would
   * insert cards into each other's flows no matter how the fixture is keyed.
   * Verified against staging 2026-09-15.
   *
   * eSim is the second reason: its canned responses are global, so two runs
   * editing one prefix collide. Prefix-per-outcome fixes that; a worker count
   * does not.
   */
  workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10) : 1,
  // A retry spends another vehicle number and another mobile/email use.
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,

  reporter: listingOnly
    ? [["list"]]
    : [
        ["list"],
        ["json", { outputFile: crRunDir ? path.join(crRunDir, "results.json") : `.artifacts/runs/${runId}/results.json` }],
        ["html", { outputFolder: crRunDir ? path.join(crRunDir, "report") : ".artifacts/report", open: "never" }],
      ],
  // Everything a run generates outside a CR folder goes under ONE gitignored
  // folder, so automation/ holds source and nothing that looks like source.
  outputDir: crRunDir ? path.join(crRunDir, "artifacts") : ".artifacts/test-results",

  use: {
    baseURL: baseURL(),
    headless: !headed,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 90 * 1000,
    navigationTimeout: 120 * 1000,
    screenshot: "only-on-failure",
    // RECORD=1, or any CR run, keeps a video of every test, not just failures.
    // Recorded at the full viewport size: Playwright's default scales video
    // down to fit 800x800, which makes the wide BO tables unreadable.
    video: recordVideo
      ? { mode: "on", size: { width: 1920, height: 1080 } }
      : { mode: "retain-on-failure", size: { width: 1920, height: 1080 } },
    trace: "retain-on-failure",
    ignoreHTTPSErrors: true,
    launchOptions: {
      /**
       * REQUIRED, not an optimisation.
       *
       * The portal pages that need a card open ws://localhost:7878 from an
       * HTTPS origin. Chrome blocks that as a local-network request and says
       * nothing useful on the page — instead the screen shows
       * "Update Required — Dermalog Biometric Device", which is the
       * connection-failed state, NOT a version check. Reading that message
       * literally sends you hunting for a driver update for an hour.
       */
      args: ["--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests"],
    },
  },

  projects: [
    {
      // A change request's own specs, which live beside the ticket's evidence
      // in cr/<TICKET>/03-spec/ so one folder holds the whole story. They run
      // with the staging project because that is what they target; a spec that
      // must keep running after the CR ships gets COPIED into tests/staging/
      // and the ticket's copy marked @status retired.
      name: "cr",
      testDir: "../cr",
      // Gated specs only: <sheet>.cr.spec.ts, every TS through the `ts` fixture
      // and its per-TS gate. One-off tools in the same folder (12022's moved
      // probes, a ticket's helpers) are plain *.spec.ts and run as "cr-tools",
      // so a run never loads them by accident.
      testMatch: "**/03-spec/**/*.cr.spec.ts",
      // A CR run ALWAYS records, whatever drives it and whatever env is set:
      // evidence = screenshots + one continuous video per TS (Azfar, 15-16.10.2026).
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 }, video: { mode: "on", size: { width: 1920, height: 1080 } } },
    },
    {
      // A ticket's one-off tools (no gate, nothing routed). Video is on here too.
      name: "cr-tools",
      testDir: "../cr",
      testMatch: "**/03-spec/**/*.spec.ts",
      testIgnore: ["**/*.cr.spec.ts", "**/*.firefox.spec.ts"],
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 }, video: { mode: "on", size: { width: 1920, height: 1080 } } },
    },
    {
      name: "staging",
      testDir: "./tests/staging",
      testMatch: "**/*.@(e2e|func).spec.ts",
      // Real Chrome, not bundled Chromium: the activation page runs a browser
      // check that shows Chromium a "use Firefox 36" gate and lets Chrome
      // through, and every card-reading flow can end up behind it.
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 } },
    },
    {
      // Production is a READ-ONLY suite. The grepInvert is the mechanical half
      // of that promise — nothing tagged @destructive can be selected here.
      name: "production",
      testDir: "./tests/production",
      testMatch: "**/*.func.spec.ts",
      grepInvert: /@destructive/,
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 } },
    },
    {
      // Live verification of a flow (src/flows/README.md). A flow is not
      // official until its verify spec has run here and a person has signed it.
      name: "flows",
      testDir: "./tests/flows",
      testMatch: "**/*.verify.spec.ts",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 } },
    },
    {
      // The same verify specs in a CURRENT Firefox (Playwright's build; Azfar 20.10.2026, EAINT-12253:
      // Firefox is in scope). The portal's reader pages choose the WebSocket reader for any Firefox
      // from v37 on (Java applet only below 37), so the MyKad emulator path is the same as Chrome's.
      // Firefox v36.0.4 itself cannot be driven by Playwright. The Chrome-only launch flags in `use`
      // are replaced, not inherited. Run: npx playwright test --project=flows-firefox <spec>
      name: "flows-firefox",
      testDir: "./tests/flows",
      testMatch: "**/*.verify.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
        launchOptions: { firefoxUserPrefs: FIREFOX_PREFS },
      },
    },
    {
      // A ticket's one-off tools in Firefox (video on), e.g. the EAINT-12253 emulator check.
      name: "cr-tools-firefox",
      testDir: "../cr",
      testMatch: "**/03-spec/**/*.firefox.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
        video: { mode: "on", size: { width: 1920, height: 1080 } },
        launchOptions: { firefoxUserPrefs: FIREFOX_PREFS },
      },
    },
    {
      // Tools wearing a spec's clothes. Outside both environment trees on
      // purpose, so neither project can pick them up.
      name: "explore",
      testDir: "./tests/_explore",
      // Real Chrome here too: a probe that walks a card-reading screen hits the
      // same "use Firefox 36" gate the staging project does.
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1920, height: 1080 } },
    },
  ],
});
