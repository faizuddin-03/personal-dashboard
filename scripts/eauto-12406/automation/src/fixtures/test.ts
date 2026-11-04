import { test as base, expect } from "@playwright/test";
import { LoginPage } from "@auth/login";
import { testEnv, instance } from "@config/environments";
import type { PersonaKey } from "@config/personas";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { MyKadClient, laneMykadChannel, routeMykadToLaneChannel } from "./mykad";
import { EsimClient } from "./esim";
import { MailtrapClient } from "./mailtrap";
import { Evidence, attachVideo } from "./evidence";
import { TsRun } from "./ts-run";

/**
 * The suite's own `test`. A spec imports from here, never from
 * @playwright/test directly, so every run gets the environment annotation and
 * the page objects without a per-spec constructor.
 *
 * Page objects are constructed lazily by a `pages` accessor rather than one
 * fixture per class, so adding a screen does not mean editing a registry.
 *
 * Shape follows `eauto-qa-automation/src/fixtures/test.ts`.
 */

export interface Pages {
  stms: StmsWizardPage;
  estm: EstmWizardPage;
}

export interface Fixtures {
  login: LoginPage;
  pages: Pages;
  /** Sign in and land on the dealer portal with announcement modals cleared. */
  ucdSession: (persona: PersonaKey) => Promise<void>;
  /**
   * A connected MyKad card reader. Ask for it only in a spec that needs a
   * card: it opens a socket, and a spec that never scans should not hold one.
   */
  mykad: MyKadClient;
  /**
   * The JPJ / RHB response simulator, authenticated.
   *
   * Ask for it only when a spec CHANGES what JPJ returns. Reading a canned
   * response needs nothing — the prefix of the vehicle number already selects
   * it — so most specs should not take this fixture and pay for a VPN round
   * trip they do not need.
   */
  esim: EsimClient;
  /**
   * The staging mail sink.
   *
   * Ask for it only in a spec that asserts on email. It throws at construction
   * when the token is missing, rather than letting a spec report a pass having
   * checked no mail at all.
   */
  mail: MailtrapClient;
  /**
   * When this spec started, in epoch-ms.
   *
   * Every email assertion needs a floor, or it matches a message some earlier
   * run left in the shared inbox.
   */
  runStartedMs: number;
  /**
   * Screenshots, downloads and the video for the case(s) this test proves,
   * filed one folder per case. Take it in every CR spec and capture at every
   * expected result: a pass with no picture cannot be signed off.
   */
  evidence: Evidence;
  /**
   * The TS this test is (its id starts the title): one tab and one continuous
   * video for the whole TS, a proof per expected point, and the per-TS gate
   * that files it as valid evidence or into FAILED/ the moment it ends
   * (`./ts-run.ts`). Every new CR spec uses this instead of `evidence`.
   */
  ts: TsRun;
}

export const test = base.extend<Fixtures>({
  // The page's MyKad socket goes to the lane's own emulator channel (./mykad.ts), so lanes never read each
  // other's card. Also for contexts a spec opens itself (browser.newContext(), e.g. the UCD to UCD buyer side).
  browser: [async ({ browser }, use) => {
    const channel = laneMykadChannel();
    if (channel) {
      const newContext = browser.newContext.bind(browser);
      browser.newContext = async (...a: Parameters<typeof newContext>) => {
        const ctx = await newContext(...a);
        await routeMykadToLaneChannel(ctx, channel);
        return ctx;
      };
    }
    await use(browser);
  }, { scope: "worker" }],

  context: async ({ context }, use) => {
    const channel = laneMykadChannel();
    if (channel) await routeMykadToLaneChannel(context, channel);
    await use(context);
  },

  login: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  pages: async ({ page }, use) => {
    await use({
      stms: new StmsWizardPage(page),
      estm: new EstmWizardPage(page),
    });
  },

  ucdSession: async ({ login, pages }, use) => {
    await use(async (persona: PersonaKey) => {
      await login.as(persona);
      // Every portal landing carries an announcement modal sooner or later,
      // and its overlay swallows the first click of whatever follows.
      await pages.stms.dismissAnnouncements();
    });
  },

  mykad: async ({}, use, testInfo) => {
    const reader = new MyKadClient();
    await reader.connect();
    testInfo.annotations.push({
      type: "mykad",
      description: `reader connected on ${reader.url}`,
    });
    // A card left in the reader, or a forced "Not Identical" left set, makes
    // the NEXT spec fail on a defect that is not there.
    await reader.removeCard();
    await reader.setMatchResult("Identical");
    await use(reader);
    await reader.removeCard().catch(() => undefined);
    await reader.close();
  },

  esim: async ({}, use) => {
    const sim = new EsimClient();
    await sim.connect();
    await use(sim);
    await sim.close();
  },

  mail: async ({}, use) => {
    const client = new MailtrapClient();
    await client.connect();
    await use(client);
    await client.close();
  },

  runStartedMs: async ({}, use) => {
    await use(Date.now());
  },

  evidence: async ({ page }, use, testInfo) => {
    const evidence = new Evidence(testInfo);
    await use(evidence);
    // The video only exists once the page closes, so this runs before the
    // page fixture's own teardown and files it into each case it touched.
    await attachVideo(page, evidence);
  },

  ts: async ({ page, context }, use, testInfo) => {
    const run = new TsRun(page, context, testInfo);
    await run.start();
    await use(run);
    await run.finish();
  },
});

// Every run records which environment and instance produced it, so a result
// read weeks later says what it was measured against.
test.beforeEach(async ({}, testInfo) => {
  testInfo.annotations.push({
    type: "environment",
    description: `${testEnv()}${instance() ? ` /${instance()}` : ""}`,
  });
});

export { expect };
/** Browser presets, for a CR spec whose TS tab must be another browser (EAINT-12253: a current Firefox via test.use). */
export { devices } from "@playwright/test";
export { step } from "./step";
export type { Seed, CaseEvidence } from "./evidence";
export type { TsRun, TsDef, TsPoint, GateResult } from "./ts-run";
export type { CardData, MatchResult } from "./mykad";
export { ESIM_ENTITY, type EsimRecord } from "./esim";
