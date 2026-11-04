import { config as dotenv } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { mainCheckoutRoot } from "./main-checkout";

/**
 * The one env loader. The Playwright config and every script call it, so they
 * always read the same file.
 *
 * Every staging instance — eauto, sit2, uat1, preprod1 … — sits on the same
 * host with the same accounts, and differs ONLY in the path segment
 * (`https://staging.eauto.my/<instance>/`). So the logins live in one file,
 * `env/.staging.env-local`, and the instance is picked at run time:
 *
 *   INSTANCE=uat1 npx playwright test …        explicit
 *   TEST_ENV=uat1 npx playwright test …        same thing (older habit)
 *   (neither)                                  BASE_PATH from the file, i.e. eauto
 *
 * Resolution:
 *   ENV_FILE=/abs/path/.env         explicit, CI uses this
 *   env/.<TEST_ENV>.env-local       only if an instance really needs its own
 *                                   file (different accounts); none does today
 *   env/.staging.env-local          the shared staging file
 *   env/.production.env-local       for TEST_ENV=production
 *   env/env-default                 committed template, all values blank
 *
 * The instance is applied AFTER the file is read, because the file carries a
 * BASE_PATH of its own and dotenv's override would otherwise win.
 */

const ENV_DIR = path.join(__dirname, "..", "env");

/** The main checkout's env dir (config/main-checkout.ts): a ticket worktree has no env-local of its own. */
const mainEnvDir = (): string => path.join(mainCheckoutRoot(), "automation", "env");
const TIERS = new Set(["staging", "production"]);

export function loadEnv(): string {
  const requested = process.env.TEST_ENV || "staging";
  const instance = process.env.INSTANCE || (TIERS.has(requested) ? undefined : requested);

  let file = process.env.ENV_FILE;
  if (!file) {
    const tier = requested === "production" ? "production" : "staging";
    // this checkout first, then the main checkout's (a ticket worktree has no env-local of its own)
    const candidates = [...new Set([ENV_DIR, mainEnvDir()])].flatMap((dir) => [
      path.join(dir, `.${requested}.env-local`),
      path.join(dir, `.${tier}.env-local`),
    ]);
    file = candidates.find((f) => fs.existsSync(f)) ?? path.join(ENV_DIR, "env-default");
  }

  dotenv({ path: file, override: true });
  if (instance) process.env.BASE_PATH = instance;
  return file;
}

/** For error messages: the file a missing value should be added to. */
export function envFileHint(): string {
  return process.env.TEST_ENV === "production" ? "env/.production.env-local" : "env/.staging.env-local";
}
