import { PrecheckSession } from './session';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── Repurchase probe (EAINT-9306) ───────────────────────────────────
// Answers one question at Deregistration Step 2: after a FAILED pre-check on
// this vehicle, can the user buy another one — and does each purchase create
// a NEW eDereg Pre-Checking transaction?
//
// Per Faizuddin, 2026-09-04 (knowledge/flow-edereg.md §40): `VEL000100E`
// (VEHICLE RECORD NOT EXIST) is the ONLY response code that allows this. Each
// repurchase creates a brand-new precheck transaction — it does not resume or
// mutate the failed one — and it is repeatable without limit. Every other
// failed code only ever reshows the stale result (§33/§35/§36/§37).
//
// **Why this is written to OBSERVE rather than assume.** Three tests (§33
// CPC_E2E_TS2, §35 MU_TS5, §36 MU_TS6) recorded the reshow
// (`dialogShape: 'closed-direct'`) on runs steered to VEL000100E — exactly
// the code that should offer a repurchase. That conflict is unresolved. The
// most plausible explanation is that the app shows the previous failed result
// FIRST (a Close-only dialog), clears the Vehicle No. field, and only offers
// a fresh payment popup when the number is entered AGAIN — and that
// `resolveVehicleGate()`, which returns as soon as it sees a Close button,
// simply stopped one step short. None of those tests re-entered the number a
// third time.
//
// So this probe re-enters the vehicle number for SEVERAL rounds and records
// what each round produced, instead of asserting a single expected shape. If
// round 1 reshows and round 2 offers a purchase, that is captured plainly and
// resolves the conflict. If round 1 offers a purchase outright, that is
// captured too. Either way the first live run answers the question rather
// than a guess baked into an assertion.
//
// Nothing here throws for an app-level outcome — a round that produces
// something unexpected is recorded and the probe moves on, so a surprising
// app response never costs the caller the rounds it already observed.

export interface RepurchaseRound {
  round: number;
  /**
   * `paid`   — a fresh payment popup was offered and taken (a repurchase).
   * `reshow` — a result-only, Close-only dialog: the stale failed result.
   * `gate-open` — the compulsory gate was already green; no dialog at all.
   * `none`   — no dialog appeared within the timeout.
   * `error`  — see `error`.
   */
  outcome: 'paid' | 'reshow' | 'gate-open' | 'none' | 'error';
  jpjStatus?: string;
  responseDesc?: string;
  /** Pre-Checking listing row count for this vehicle AFTER this round. */
  precheckRows?: number;
  /** Rows this round added versus the round before it. */
  rowsAdded?: number;
  error?: string;
}

export interface RepurchaseProbeResult {
  /** A fresh payment popup was offered on at least one re-entry. */
  repurchaseOffered: boolean;
  /** How many fresh purchases actually completed. */
  repurchaseCount: number;
  /** True when EVERY completed repurchase added exactly one listing row —
   *  the "each repurchase equals a new precheck transaction" rule. */
  eachRepurchaseCreatedNewRow: boolean;
  /** True when a repurchase succeeded more than once — the "again and again"
   *  half of the rule. Needs `rounds >= 2` to be meaningful. */
  repeatable: boolean;
  rowsBefore: number;
  rowsAfter: number;
  newRowsCreated: number;
  /** How many rounds came back as the stale reshow instead of a purchase. */
  reshowCount: number;
  rounds: RepurchaseRound[];
}

/** Count the vehicle's Pre-Checking listing rows on a THROWAWAY tab.
 *
 *  `countTransactionsForVehicle()` navigates via `page.goto()`, and the
 *  caller here is usually holding an open Deregistration Step 2 form that
 *  must survive. Navigating the user's own tab away is precisely the bug that
 *  broke MU_TS5's first live run (§35); the fix there was an ephemeral
 *  `context.newPage()`, and the same fix applies here. */
async function countPrecheckRows(
  session: PrecheckSession,
  envSegment: string,
  vehicleRegNo: string,
): Promise<number> {
  const base = await session.waitForActivePage();
  const tab = await base.context().newPage();
  try {
    return await new PrecheckEnquiryPage(tab, session).countTransactionsForVehicle(envSegment, vehicleRegNo);
  } catch {
    return -1;
  } finally {
    await tab.close().catch(() => { /* ignore */ });
  }
}

/**
 * Re-enter `vehicleRegNo` at the OPEN Deregistration Step 2 form `rounds`
 * times, recording whether each attempt was offered a fresh purchase or just
 * the stale failed result, and how the Pre-Checking listing row count moves.
 *
 * Call this with the page already on Step 2 and the vehicle already carrying
 * a FAILED pre-check.
 */
export async function probeRepurchase(
  session: PrecheckSession,
  envSegment: string,
  vehicleRegNo: string,
  rounds = 2,
): Promise<RepurchaseProbeResult> {
  const rowsBefore = await countPrecheckRows(session, envSegment, vehicleRegNo);
  session.progress('repurchase-probe-start', `Pre-Checking listing has ${rowsBefore} row(s) for ${vehicleRegNo} before any repurchase attempt`);

  const results: RepurchaseRound[] = [];
  let previousRows = rowsBefore;

  for (let round = 1; round <= rounds; round++) {
    const entry: RepurchaseRound = { round, outcome: 'error' };
    try {
      const p = await session.waitForPageSettled();
      await p.locator('#vehicleRegNo').fill(vehicleRegNo);
      await p.locator('#vehicleRegNo').blur();
      await p.locator('#precheck-result .success, #precheck-result .error').first()
        .waitFor({ state: 'visible', timeout: 20_000 });

      if (await p.locator('#precheck-result .success').isVisible().catch(() => false)) {
        entry.outcome = 'gate-open';
        entry.error = 'Compulsory gate was already satisfied — a qualifying pre-check already exists, so no purchase was offered.';
        results.push(entry);
        break;
      }

      // Same interaction shape resolveVehicleGate() uses: clicking Next fires
      // a real window.confirm(), so the whole dialog block is wrapped.
      const shape = await session.withNativeConfirm(async () => {
        const ap = await session.waitForActivePage();
        const dialog = ap.locator('.ui-dialog:visible').last();
        try {
          await dialog.waitFor({ state: 'visible', timeout: 20_000 });
        } catch {
          return null;
        }
        if (await dialog.getByRole('button', { name: 'Close' }).count() > 0) {
          await dialog.getByRole('button', { name: 'Close' }).first().click({ timeout: 10_000 });
          await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
          return 'reshow' as const;
        }
        await dialog.getByRole('button', { name: 'Next' }).first().click({ timeout: 10_000 });
        await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        return 'paid' as const;
      });

      if (!shape) {
        entry.outcome = 'none';
        entry.error = 'No dialog appeared after re-entering the vehicle number.';
      } else if (shape === 'reshow') {
        entry.outcome = 'reshow';
        session.progress('repurchase-round', `Round ${round}: stale failed result reshown (Close only) — no purchase offered`, 'warn');
      } else {
        const p2 = await session.waitForActivePage();
        await p2.locator('#payment-result:visible').waitFor({ state: 'visible', timeout: 90_000 });
        entry.jpjStatus = (await p2.locator('#jpjStatusLabel').first().getAttribute('value').catch(() => '')) ?? '';
        const descs = (await p2.locator('#payment-result:visible #responseDesc').allTextContents().catch(() => [] as string[]))
          .map((d) => d.replace(/\s+/g, ' ').trim()).filter(Boolean);
        entry.responseDesc = descs.length ? descs[descs.length - 1] : '';
        entry.outcome = 'paid';
        session.progress('repurchase-round', `Round ${round}: fresh purchase COMPLETED — ${entry.jpjStatus} / ${entry.responseDesc}`);
        await session.confirmDialog(15_000, 'Close');
      }
    } catch (e) {
      entry.outcome = 'error';
      entry.error = e instanceof Error ? e.message : String(e);
    }

    // Row count after every round, so a reshow round is visibly proven NOT
    // to have created a transaction while a paid round is proven to have.
    const rowsNow = await countPrecheckRows(session, envSegment, vehicleRegNo);
    entry.precheckRows = rowsNow;
    entry.rowsAdded = rowsNow >= 0 && previousRows >= 0 ? rowsNow - previousRows : undefined;
    if (rowsNow >= 0) previousRows = rowsNow;
    results.push(entry);
  }

  const paidRounds = results.filter((r) => r.outcome === 'paid');
  const rowsAfter = previousRows;

  return {
    repurchaseOffered: paidRounds.length > 0,
    repurchaseCount: paidRounds.length,
    // Every purchase must have added exactly one row. Rounds whose count
    // could not be read (-1 / undefined) are not counted as proof.
    eachRepurchaseCreatedNewRow: paidRounds.length > 0 && paidRounds.every((r) => r.rowsAdded === 1),
    repeatable: paidRounds.length >= 2,
    rowsBefore,
    rowsAfter,
    newRowsCreated: rowsAfter >= 0 && rowsBefore >= 0 ? rowsAfter - rowsBefore : -1,
    reshowCount: results.filter((r) => r.outcome === 'reshow').length,
    rounds: results,
  };
}
