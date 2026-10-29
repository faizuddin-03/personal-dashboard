import * as fs from 'node:fs';
import * as path from 'node:path';
import { Page } from '@playwright/test';
import { PrecheckSession } from './session';

// ── JPJ Code Checker probe (EAINT-9306) ─────────────────────────────
// Reads EVERYTHING off the "eDereg Pre-Checking Enquiry" result dialog at
// Deregistration Step 2, for one steered JPJ response code.
//
// Why this exists instead of reusing DeregTransactionPage.resolveVehicleGate():
// that method is working, confirmed-live automation for the TS cases and must
// not be changed (knowledge/dont-touch-working-automation). It also reads only
// TWO fields (`#jpjStatusLabel` + the last `#responseDesc`) and reads NOTHING
// AT ALL on its reshow branch — but the whole point of the code checker is the
// NOTE line at the bottom of the dialog, plus which attribute rows a given
// code does or doesn't render. So this is a separate, additive reader that
// follows resolveVehicleGate()'s proven interaction sequence verbatim
// (withNativeConfirm -> topmost visible .ui-dialog -> Close-only vs Next ->
// #payment-result:visible) and only differs in how much it scrapes.
//
// Ground truth for the two known note shapes, both captured live 2026-09-04:
//   _reference/tickets/EAINT-9306/EAINT-9306-dereg-01-step2-precheck-result-VEL000045E.html
//     -> note BLACK, `<span class="fw-700 black">The system is currently
//        unavailable. Kindly contact our Customer Service at 03-27798899</span>`,
//        `#vehicleRecord` = "N/A", and NO per-attribute rows at all.
//   _reference/tickets/EAINT-9306/EAINT-9306-dereg-02-step2-precheck-result-VEL000100E.html
//     -> note RED, `<span class="fw-700 red">Unable to proceed for eDereg</span>`,
//        `#vehicleRecord` = "Not Exist", and the FULL attribute row set.
// The note `<span>` has no id of its own, so it is targeted structurally as
// `td.center.value span.fw-700` — scoped inside `#result-container`, which
// cannot collide with `#vehicleRecord`'s own `fw-700` (that class sits on the
// `<td>` itself, not on a `<span>` inside a `td.center.value`).

/** The per-attribute rows the dialog renders for SOME codes and omits for
 *  others — whether they appear at all is itself a finding worth recording,
 *  so this list drives both the scrape and the `hasAttributeRows` flag. */
const ATTRIBUTE_IDS = [
  'vehicleStatus',
  'verifiedStatus',
  'usageCode',
  'jpjBlacklist',
  'jsjBlacklist',
  'agencyBlacklist',
  'claimOwnership',
  'vehicleInInvestigation',
  'vehicleCondition',
] as const;

export interface JpjCodeProbeResult {
  /** The eSIM Response Code this row was steered to before probing. */
  code: string;
  /** The running vehicle number used for this code (fresh every time). */
  vehicleRegNo: string;
  /**
   * `read`   — the result dialog opened and was scraped (the normal case).
   * `reshow` — a Close-only dialog appeared, i.e. this vehicle already had a
   *            Failed pre-check on file and the app only redisplayed it
   *            (knowledge/flow-edereg.md §33-§37). Nothing was read; the row
   *            is NOT valid evidence for this code.
   * `gate-open` — the gate was already satisfied before any popup, so no
   *            enquiry ran at all.
   * `no-dialog` / `error` — nothing usable; see `error`.
   */
  outcome: 'read' | 'reshow' | 'gate-open' | 'no-dialog' | 'error';
  /** `#jpjStatusLabel`'s value attribute — "OK" or "Failed". */
  jpjStatus: string;
  /** First `#responseDesc` cell — the "JPJ Pre-Checking Status:" row. */
  jpjPrecheckStatus: string;
  /** Last `#responseDesc` cell — the "Enquiry Response:" row, e.g.
   *  "VEL000100E - VEHICLE RECORD NOT EXIST". */
  enquiryResponse: string;
  /** `#vehicleRecord` — "N/A" / "Not Exist" / "Exist". */
  vehicleRecord: string;
  /** THE THING BEING CATALOGUED: the bottom "Note:" line's text. */
  note: string;
  /** "red" | "black" | "" — the note span's own colour class. */
  noteColor: string;
  /** Present only when the dialog rendered the per-attribute rows. */
  attributes: Record<string, string>;
  hasAttributeRows: boolean;
  validAsAt: string;
  resultVehicleNo: string;
  /** Whether the compulsory gate went green after Close (an OK code). */
  gateSatisfied: boolean;
  /** Whole result table as plain text — a safety net so a row is never
   *  useless even if a selector above misses. */
  rawTableText: string;
  /** Filename (not path) of this code's PNG proof shot of the result dialog,
   *  inside the sweep's screenshot folder. Empty if the shot failed. */
  screenshotFile: string;
  error?: string;
}

const emptyRow = (code: string, vehicleRegNo: string): JpjCodeProbeResult => ({
  code,
  vehicleRegNo,
  outcome: 'error',
  jpjStatus: '',
  jpjPrecheckStatus: '',
  enquiryResponse: '',
  vehicleRecord: '',
  note: '',
  noteColor: '',
  attributes: {},
  hasAttributeRows: false,
  validAsAt: '',
  resultVehicleNo: '',
  gateSatisfied: false,
  rawTableText: '',
  screenshotFile: '',
});

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/**
 * PNG proof shot of the whole result dialog — the popup as the tester would
 * see it, code and Note together in one frame. Best-effort by design: a
 * missing screenshot must never cost the row its scraped data, so every
 * failure path here returns '' rather than throwing.
 *
 * Targets the dialog CHROME (`.ui-dialog`), not just `#payment-result`, so
 * the shot includes the "eDereg Pre-Checking Enquiry" title bar — without it
 * a bare table is much weaker as evidence.
 */
async function captureNoteScreenshot(page: Page, dir: string, code: string): Promise<string> {
  const file = `${code.replace(/[^A-Za-z0-9._-]+/g, '_') || 'code'}.png`;
  try {
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, file);

    const dialog = page.locator('.ui-dialog:visible').filter({ has: page.locator('#payment-result') }).last();
    if (await dialog.count().then((c) => c > 0).catch(() => false)) {
      await dialog.screenshot({ path: target, timeout: 15_000 });
      return file;
    }
    const panel = page.locator('#payment-result:visible').first();
    if (await panel.count().then((c) => c > 0).catch(() => false)) {
      await panel.screenshot({ path: target, timeout: 15_000 });
      return file;
    }
    await page.screenshot({ path: target, timeout: 15_000 });
    return file;
  } catch {
    return '';
  }
}

/** Scrape the OPEN `#payment-result` dialog. Assumes it is already visible. */
export async function readPrecheckResultDialog(page: Page): Promise<Partial<JpjCodeProbeResult>> {
  const container = page.locator('#payment-result:visible #result-container').first();

  // `.first()` everywhere below is deliberate: this markup already has one
  // known duplicate id (`#responseDesc`), and a stale hidden `#payment-result`
  // node is known to linger in the DOM — scoping to `:visible` handles the
  // latter, but strict mode would still throw on any duplicate inside it.
  const jpjStatus = clean(await container.locator('#jpjStatusLabel').first().getAttribute('value').catch(() => ''));

  // `#responseDesc` is a DUPLICATE id in this markup (both the "JPJ
  // Pre-Checking Status" and "Enquiry Response" cells carry it) — read all
  // matches positionally rather than trusting first()/last() to mean anything.
  const descCells = await container.locator('#responseDesc').allTextContents().catch(() => [] as string[]);
  const descs = descCells.map(clean).filter(Boolean);
  // When the JPJ-status row is omitted for a code, there is only ONE cell and
  // it is the Enquiry Response — so take the LAST as the response either way.
  const enquiryResponse = descs.length ? descs[descs.length - 1] : '';
  const jpjPrecheckStatus = descs.length > 1 ? descs[0] : '';

  const readById = async (id: string) =>
    clean(await container.locator(`#${id}`).first().textContent().catch(() => ''));

  const vehicleRecord = await readById('vehicleRecord');
  const resultVehicleNo = await readById('responseVehicleNo');
  // The "Valid As At" cell's id is literally `value` in the live markup.
  const validAsAt = await readById('value');

  const attributes: Record<string, string> = {};
  for (const id of ATTRIBUTE_IDS) {
    const cell = container.locator(`#${id}`).first();
    if (await cell.count().then((c) => c > 0).catch(() => false)) {
      const v = clean(await cell.textContent().catch(() => ''));
      if (v) attributes[id] = v;
    }
  }

  const noteSpan = container.locator('td.center.value span.fw-700').first();
  let note = '';
  let noteColor = '';
  if (await noteSpan.count().then((c) => c > 0).catch(() => false)) {
    note = clean(await noteSpan.textContent().catch(() => ''));
    const cls = (await noteSpan.getAttribute('class').catch(() => '')) ?? '';
    noteColor = /\bred\b/.test(cls) ? 'red' : /\bblack\b/.test(cls) ? 'black' : '';
  }

  const rawTableText = clean(await container.first().textContent().catch(() => ''));

  return {
    jpjStatus,
    jpjPrecheckStatus,
    enquiryResponse,
    vehicleRecord,
    note,
    noteColor,
    attributes,
    hasAttributeRows: Object.keys(attributes).length > 0,
    validAsAt,
    resultVehicleNo,
    rawTableText,
  };
}

/**
 * Probe ONE code: type `vehicleRegNo` into the Deregistration Step 2 Vehicle
 * No. field, let the compulsory-gate check fire on blur, pay for the inline
 * pre-check, scrape the result dialog, and Close it — leaving the page back on
 * Step 2, ready for the next code's vehicle number.
 *
 * Never throws for an app-level outcome; it records one in `outcome`/`error`
 * and returns, so a single odd code cannot abort a 100-code sweep.
 */
export async function probeJpjCode(
  session: PrecheckSession,
  code: string,
  vehicleRegNo: string,
  screenshotDir: string,
): Promise<JpjCodeProbeResult> {
  const row = emptyRow(code, vehicleRegNo);

  try {
    const p = await session.waitForPageSettled();
    await p.locator('#vehicleRegNo').fill(vehicleRegNo);
    await p.locator('#vehicleRegNo').blur();
    await p.locator('#precheck-result .success, #precheck-result .error').first()
      .waitFor({ state: 'visible', timeout: 20_000 });

    if (await p.locator('#precheck-result .success').isVisible().catch(() => false)) {
      // Already green before any popup — this vehicle number is not fresh.
      row.outcome = 'gate-open';
      row.gateSatisfied = true;
      row.error = 'Gate was already satisfied before any enquiry ran — vehicle number is not fresh.';
      return row;
    }

    // Clicking Next fires a real window.confirm(), not a DOM dialog — same
    // reason resolveVehicleGate() wraps this whole block.
    const shape = await session.withNativeConfirm(async () => {
      const ap = await session.waitForActivePage();
      const dialog = ap.locator('.ui-dialog:visible').last();
      try {
        await dialog.waitFor({ state: 'visible', timeout: 20_000 });
      } catch {
        return null;
      }
      // A Close-only dialog means the app is RESHOWING an existing Failed
      // pre-check rather than offering a fresh purchase — see §33-§37.
      if (await dialog.getByRole('button', { name: 'Close' }).count() > 0) {
        await dialog.getByRole('button', { name: 'Close' }).first().click({ timeout: 10_000 });
        await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        return 'closed-direct' as const;
      }
      await dialog.getByRole('button', { name: 'Next' }).first().click({ timeout: 10_000 });
      await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
      return 'paid' as const;
    });

    if (!shape) {
      row.outcome = 'no-dialog';
      row.error = 'No inline #precheck-popup dialog appeared after the vehicle-number blur.';
      return row;
    }

    if (shape === 'closed-direct') {
      row.outcome = 'reshow';
      row.error = 'App reshowed an existing Failed pre-check for this vehicle number instead of running a fresh enquiry — this row proves nothing about the steered code. Use a vehicle number with no prior pre-check.';
      return row;
    }

    const p2 = await session.waitForActivePage();
    await p2.locator('#payment-result:visible').waitFor({ state: 'visible', timeout: 90_000 });

    Object.assign(row, await readPrecheckResultDialog(p2));
    row.outcome = 'read';
    // Proof shot BEFORE Close, while the dialog is still on screen.
    row.screenshotFile = await captureNoteScreenshot(p2, screenshotDir, code);
    session.progress(
      'jpj-code-probe',
      `${code} -> ${row.jpjStatus || '?'} / ${row.enquiryResponse || '?'} | Note (${row.noteColor || 'n/a'}): ${row.note || '(none)'}`,
    );

    const closed = await session.confirmDialog(15_000, 'Close');
    if (!closed) {
      row.error = 'Result dialog was scraped but its Close button never appeared.';
      return row;
    }

    row.gateSatisfied = await p2.locator('#precheck-result .success').isVisible().catch(() => false);
    return row;
  } catch (e) {
    row.outcome = 'error';
    row.error = e instanceof Error ? e.message : String(e);
    return row;
  }
}
