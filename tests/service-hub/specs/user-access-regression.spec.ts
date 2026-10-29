import fs from "fs";
import path from "path";
import { test, expect } from "../fixtures/test-fixtures";

/**
 * "User Access Regression" — confirms a batch of BO accounts have VIEW-ONLY
 * access to the Biometric Device Purchase & Software Installation Listing:
 * logs in as each given account, searches recent Biometric Device Purchase
 * records, and asserts the [Update Shipping Details] button is absent on a
 * sample of rows — rows 1, 4, 7 (1-indexed, per Faizuddin 2026-09-24) —
 * rather than every row, so the run stays fast while still sampling spread
 * across the result set instead of just the very top.
 *
 * NOT tied to any TS or ticket — a standalone regression check, same shape
 * as create-bdp.spec.ts. Accounts come in via PW_UAR_ACCOUNTS (a JSON array
 * of {username, password}), written by
 * app/api/eauto/user-access-regression/run/route.ts from the dashboard's
 * batch-accounts textarea (app/eauto/12166's "User Access Regression" tab).
 *
 * ONE PLAYWRIGHT test() PER ACCOUNT — not a single test looping over all of
 * them — so each account gets its own video recording via the run route's
 * normal PW_VIDEO/PW_OUTPUT_DIR + organizeTestEvidence()/publishEvidence()
 * pipeline (same one TS01-TS08 already use). Per Faizuddin, 2026-09-24: "i
 * want recording to download also" — a single combined video covering every
 * account in one run would have been far less useful than one clip per
 * account. Accounts are read from PW_UAR_ACCOUNTS at module load time (before
 * `npx playwright test` even starts collecting), so defining one `test()`
 * per account here is safe — the same way a `for` loop over static data
 * would be.
 *
 * Search window: today back 1 month — matches the listing's own
 * From-auto-sets-To(+1 month) behaviour rather than fighting it (see
 * knowledge/flow-device-purchase.md, TS05's "Date Requested filter" entry).
 *
 * RESULT AGGREGATION — CORRECTED 2026-09-24, first live run produced no
 * result file at all: this originally kept a single module-level `results`
 * array pushed to by every test, written once via `test.afterAll()`. That
 * assumes all per-account tests share one worker/module instance — false
 * here: confirmed live (workerIndex in the JSON report) that Playwright ran
 * each test in ITS OWN fresh worker despite `workers: 1` in
 * playwright.config.ts, so each test got its own EMPTY `results` array, and
 * whichever worker's `afterAll` wrote last silently overwrote every earlier
 * account's data (or raced the process exit and never landed at all). Fixed
 * by having each test write its OWN result file into a results directory
 * (`PW_RESULT_PATH`, repurposed from "a file" to "a directory") the moment
 * it finishes — no shared in-memory state, no afterAll. The API route
 * (app/api/eauto/user-access-regression/run/route.ts) reads every file in
 * that directory after the process exits and aggregates them itself.
 */

interface AccountInput {
  username: string;
  password: string;
}
interface RowCheck {
  rowNumber: number;
  reference: string;
  updateButtonPresent: boolean;
}
interface AccountResult {
  username: string;
  loginOk: boolean;
  rowsFound: number;
  checked: RowCheck[];
  pass: boolean;
  /** Confirmed live 2026-09-24 (per Faizuddin) — some accounts can't reach
   *  the listing's filter form at all. That's a genuine, positive finding
   *  for this tool (no listing access implies no update access either), not
   *  a failure to verify — kept distinct from `error`. */
  noListingAccess?: boolean;
  error?: string;
}

function fmtDdMmYyyy(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function oneMonthBefore(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
}

// 1-indexed row positions to sample — per Faizuddin, 2026-09-24: "1, 4, 7".
const SAMPLE_ROWS = [1, 4, 7];

let accounts: AccountInput[] = [];
try {
  accounts = JSON.parse(process.env.PW_UAR_ACCOUNTS || "[]");
} catch {
  // fall through with an empty list — the describe block below reports it
}

/** Writes one account's result as its own file into the results directory —
 *  no shared module-level state, so it survives even if this test runs in a
 *  fresh worker with no memory of any other test (confirmed live 2026-09-24
 *  that Playwright does exactly this here). Filename only needs to be
 *  unique per account, not human-meaningful — the route reads file CONTENTS
 *  (which include the real username), not names. */
function writeAccountResult(result: AccountResult) {
  const resultsDir = process.env.PW_RESULT_PATH;
  if (!resultsDir) return;
  try {
    fs.mkdirSync(resultsDir, { recursive: true });
    const safeName = result.username.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "account";
    fs.writeFileSync(path.join(resultsDir, `${safeName}-${Date.now()}.json`), JSON.stringify(result, null, 2));
  } catch {
    // best-effort — a write failure here shouldn't also break the check itself
  }
}

test.describe("User Access Regression", () => {
  if (accounts.length === 0) {
    test("no accounts supplied", async () => {
      test.skip(true, "No accounts supplied (PW_UAR_ACCOUNTS was empty or invalid).");
    });
  }

  for (const acct of accounts) {
    test(`Account: ${acct.username}`, async ({ loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
      // 120s is generous for one account's login + up to 3 row checks even
      // with detailed mode's highlight pauses — this is per-account now, not
      // the whole batch, so it doesn't need to scale with accounts.length
      // the way the old single-test version did.
      test.setTimeout(120_000);

      const result: AccountResult = {
        username: acct.username,
        loginOk: false,
        rowsFound: 0,
        checked: [],
        pass: false,
      };

      const today = new Date();
      const windowFrom = oneMonthBefore(today);

      try {
        await loginPage.loginAsBO(acct.username, acct.password);
        result.loginOk = true;

        await boListingPage.navigate();

        if (!(await boListingPage.hasDateFilterFields())) {
          // Confirmed live 2026-09-24 (per Faizuddin): this account simply
          // can't reach the listing at all — a real, positive finding for
          // this tool (no listing access implies no update access either),
          // not something to keep retrying against.
          result.noListingAccess = true;
          result.pass = true;
          return;
        }

        await boListingPage.searchWithFilters({
          requestedFrom: fmtDdMmYyyy(windowFrom),
          requestedTo: fmtDdMmYyyy(today),
          serviceType: "BIOMETRIC_PURCHASE",
        });
        const rows = await boListingPage.getResultRows();
        result.rowsFound = rows.length;

        // Capture references at the target 1-indexed positions up front,
        // THEN re-search by reference before each View — avoids relying on
        // row order staying identical across navigations.
        const targets: { rowNumber: number; reference: string }[] = [];
        for (const rowNumber of SAMPLE_ROWS) {
          const idx = rowNumber - 1;
          if (idx >= rows.length) continue;
          const reference = await boListingPage.getRowReferenceNo(rows[idx]);
          targets.push({ rowNumber, reference });
        }

        for (const t of targets) {
          await boListingPage.navigate();
          await boListingPage.searchWithFilters({ referenceNo: t.reference });
          const found = await boListingPage.getResultRows();
          if (found.length === 0) continue;
          await boListingPage.clickView(found[0]);
          const updateButtonPresent = await boDevicePurchaseDetailsPage.isUpdateShippingButtonPresent();
          result.checked.push({ rowNumber: t.rowNumber, reference: t.reference, updateButtonPresent });
        }

        result.pass = result.checked.length > 0 && result.checked.every((c) => !c.updateButtonPresent);
      } catch (e) {
        result.error = e instanceof Error ? e.message : String(e);
      } finally {
        // `finally` runs even on the early `return` above (noListingAccess) —
        // this must never be skipped, since it's the ONLY place this
        // account's data gets persisted (see the module-level state bug this
        // replaced, in the file's own header comment).
        writeAccountResult(result);
      }

      const label = result.noListingAccess ? "PASS (no listing access)" : result.pass ? "PASS" : "FAIL";
      test.info().annotations.push({
        type: "account",
        description: `${result.username}: ${label} (${result.checked.length} row(s) checked)`,
      });

      expect(
        result.pass,
        result.error
          ? `Could not finish checking this account: ${result.error}`
          : "this account still has [Update Shipping Details] access — see the result breakdown",
      ).toBe(true);
    });
  }
});
