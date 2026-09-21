import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '../fixtures/sessionFixture';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { probeJpjCode, type JpjCodeProbeResult } from '../utils/jpjCodeProbe';
import {
  setEsimResponseCode,
  vehiclePrefix,
  RHB_TRANSFER_RESPONSE_CODE_OK,
} from '../utils/esim';

// ── JPJ Code Checker (EAINT-9306) ───────────────────────────────────
// NOT a test case from the QA test plan — a data-gathering sweep, per
// Faizuddin 2026-09-04. Purpose: catalogue what NOTE each JPJ response code
// produces on the "eDereg Pre-Checking Enquiry" result dialog, with a PNG of
// each popup as proof. Two note shapes are already known from live captures
// (see utils/jpjCodeProbe.ts's header): a BLACK "The system is currently
// unavailable…" and a RED "Unable to proceed for eDereg". Which codes map to
// which — across ~100 codes — is the open question this sweep answers.
//
// **THIS IS A CHECKER, NOT A TEST — IT MUST NEVER FAIL.** Explicit
// instruction from Faizuddin, and it drives the whole control flow here:
// there is no expected result, so there is nothing to assert. An unfamiliar
// note, a brand-new note nobody has seen before, a blank note, a code that
// behaves unlike every other code — all of that is the ANSWER, not an error,
// and none of it may interrupt the sweep or discard a row. Every outcome is
// recorded and the run keeps going. Do not add assertions to this file; if a
// future scenario needs a pass/fail expectation, it belongs in its own spec.
//
// Shape, exactly as specified:
//   log in -> create ONE Deregistration -> MyKad-auth the owner -> stop at
//   Step 2, and stay there. Then, per code:
//     1. steer eSIM `dereg-precheck-enquiry` Response Code to that code
//     2. type the NEXT running vehicle number into #vehicleRegNo, click away
//     3. pay for the inline pre-check, screenshot + scrape the result dialog,
//        then Close
//   The Deregistration is deliberately NEVER completed — the popup is the
//   entire point, so nothing past Step 2 is touched.
//
// A FRESH vehicle number per code is mandatory, not a nicety: once a vehicle
// has a Failed pre-check on file, re-entering it only RESHOWS the stale
// result and no fresh JPJ enquiry runs at all, regardless of what eSIM has
// been re-steered to (knowledge/flow-edereg.md §33/§35/§36/§37 — the rule
// that has already invalidated four tests in this suite). Reusing one number
// would silently report the FIRST code's note for every later code. The probe
// flags that case as `outcome: 'reshow'` rather than recording a false row.
//
// eSIM keys its records by the first TWO characters of the vehicle number, so
// the whole running series must share one prefix (HXZ0001, HXZ0002, … all key
// to "HX") — that single eSIM record is what gets re-steered each iteration.
// RHB Transfer is set to OK ONCE up front, not per code: the payment must
// succeed every time or no JPJ enquiry happens at all.
//
// Rows are flushed to `jpj-code-results.json` and screenshots to
// `jpj-code-screenshots/` after EVERY code, and a re-run skips codes already
// captured. A sweep of ~100 codes takes hours (each code = one eSIM
// Playwright spawn + a full payment round trip), so it is expected to be run
// in batches — Stop at any point, press Run again to carry on.

const RESULTS_FILE = path.resolve(process.cwd(), 'jpj-code-results.json');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'jpj-code-screenshots');

/** How many probe failures in a row before trying to rebuild the
 *  Deregistration draft the sweep is running against. */
const RECOVER_AFTER_FAILURES = 3;
/** How many rebuilds to attempt before accepting the session is unusable.
 *  Reaching this ends the sweep GRACEFULLY (rows kept, RESULT emitted, test
 *  still passes) — it never throws. */
const MAX_RECOVERIES = 3;
/** eSIM writes are retried before a code is given up on — a single flaky
 *  write should not cost that code its row. */
const ESIM_ATTEMPTS = 2;

interface ResultsFile {
  updatedAt: string;
  rows: JpjCodeProbeResult[];
}

function readResultsFile(): JpjCodeProbeResult[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')) as ResultsFile;
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function writeResultsFile(rows: JpjCodeProbeResult[]): void {
  try {
    const payload: ResultsFile = { updatedAt: new Date().toISOString(), rows };
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    // Even losing the results file must not abort the sweep — the RESULT:
    // line at the end carries the same rows.
    console.log(`[warn] Could not write ${RESULTS_FILE}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Turn "HXZ0001" into a generator of HXZ0001, HXZ0002, … preserving the
 *  original zero-padding width. */
function vehicleNoSeries(start: string): ((i: number) => string) | null {
  const m = start.trim().toUpperCase().match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const [, base, digits] = m;
  const width = digits.length;
  const first = Number(digits);
  return (i: number) => `${base}${String(first + i).padStart(width, '0')}`;
}

function parseCodes(raw: string): string[] {
  let list: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) list = parsed.map((c) => String(c));
  } catch {
    list = raw.split(/[\r\n,;\t]+/);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of list) {
    const code = entry.trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function errorRow(code: string, vehicleRegNo: string, message: string): JpjCodeProbeResult {
  return {
    code, vehicleRegNo, outcome: 'error',
    jpjStatus: '', jpjPrecheckStatus: '', enquiryResponse: '', vehicleRecord: '',
    note: '', noteColor: '', attributes: {}, hasAttributeRows: false,
    validAsAt: '', resultVehicleNo: '', gateSatisfied: false, rawTableText: '',
    screenshotFile: '', error: message,
  };
}

test('eDereg Pre-Checking — JPJ Code Checker sweep (note per response code)', async ({ loggedInPage: page, session, inputs }) => {
  const rows: JpjCodeProbeResult[] = [];
  let checked = 0;
  let stoppedEarly = '';

  // One outer try/finally around EVERYTHING: whatever happens, the RESULT:
  // line is emitted with every row banked so far, and the test passes.
  try {
    const codes = parseCodes(process.env.DPC_JPJ_CODES ?? '');
    if (!codes.length) {
      stoppedEarly = 'No JPJ codes were given — paste the code list into the JPJ Code Checker tab before running.';
      return;
    }

    const startFresh = (process.env.DPC_JPJ_FRESH ?? '').trim() !== '';
    if (startFresh) {
      try { fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
    }
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const existing = startFresh ? [] : readResultsFile();
    rows.push(...existing);
    // Only a genuinely READ row counts as done — a reshow/error row is retried
    // on the next run rather than leaving a permanent hole in the table.
    const done = new Set(existing.filter((r) => r.outcome === 'read').map((r) => r.code));
    const todo = codes.filter((c) => !done.has(c));

    const nextVehicleNo = vehicleNoSeries(inputs.vehicleRegNo);
    if (!nextVehicleNo) {
      stoppedEarly = `Vehicle number "${inputs.vehicleRegNo}" must end in digits so the sweep can increment it (e.g. HXZ0001).`;
      return;
    }
    const prefix = vehiclePrefix(inputs.vehicleRegNo);
    const lastVehicleNo = nextVehicleNo(codes.length - 1);
    if (vehiclePrefix(lastVehicleNo) !== prefix) {
      stoppedEarly = `The running vehicle numbers would cross an eSIM prefix boundary (${inputs.vehicleRegNo} -> ${lastVehicleNo}). Pick a start value whose first two characters stay fixed across all ${codes.length} codes.`;
      return;
    }

    session.progress('jpj-code-sweep-start', `${todo.length} code(s) to check (${done.size} already done), vehicle numbers from ${inputs.vehicleRegNo}, eSIM prefix "${prefix}"`);

    // Payment must succeed on every probe — otherwise the JPJ enquiry never
    // runs and there is no result dialog to read. Set once, not per code.
    const rhb = await setEsimResponseCode('rhb-transfer', prefix, RHB_TRANSFER_RESPONSE_CODE_OK);
    if (!rhb.ok) {
      stoppedEarly = `Could not set RHB Transfer to OK, so no payment would succeed: ${rhb.reason}`;
      return;
    }

    await session.closeBanners();

    const mykad = new MykadEmulatorClient(page.context());
    let recoveries = 0;
    let consecutiveFailures = 0;

    /** (Re)build the Deregistration draft the sweep probes against. */
    const openStep2 = async () => {
      const dereg = new DeregTransactionPage(page, session, mykad);
      await dereg.createFromHome('MYKAD');
      await dereg.authenticateOwner();
      return dereg;
    };

    try {
      try {
        await openStep2();
        session.progress('jpj-code-sweep-step2', 'Deregistration created and owner authenticated — holding at Step 2 for the sweep');
      } catch (e) {
        stoppedEarly = `Could not reach Deregistration Step 2 to start the sweep: ${e instanceof Error ? e.message : String(e)}`;
        return;
      }

      for (const [i, code] of todo.entries()) {
        // Index against the FULL code list so a resumed run keeps using the
        // vehicle number that code would have had on a single clean sweep.
        const vehicleRegNo = nextVehicleNo(codes.indexOf(code));

        const bank = (row: JpjCodeProbeResult) => {
          const at = rows.findIndex((r) => r.code === code);
          if (at >= 0) rows[at] = row; else rows.push(row);
          writeResultsFile(rows);
        };

        // ── steer eSIM (retried; a code is only given up on after both tries)
        session.progress('jpj-code-esim', `[${i + 1}/${todo.length}] Steering eSIM Dereg Precheck to ${code} (vehicle ${vehicleRegNo})`, 'running');
        let esimReason = '';
        let esimOk = false;
        for (let attempt = 1; attempt <= ESIM_ATTEMPTS && !esimOk; attempt++) {
          const set = await setEsimResponseCode('dereg-precheck-enquiry', prefix, code);
          esimOk = set.ok;
          esimReason = set.reason ?? '';
          if (!esimOk && attempt < ESIM_ATTEMPTS) {
            session.progress('jpj-code-esim-retry', `${code}: eSIM write attempt ${attempt} failed (${esimReason}) — retrying`, 'warn');
          }
        }
        if (!esimOk) {
          bank(errorRow(code, vehicleRegNo, `eSIM write failed after ${ESIM_ATTEMPTS} attempts: ${esimReason}`));
          // A dropped VPN fails every remaining code identically and there is
          // nothing to learn from grinding through 90 more of them. This is
          // infrastructure being unreachable, NOT an unexpected result —
          // unexpected results never stop the sweep.
          if (/VPN|e-simulator/i.test(esimReason)) {
            stoppedEarly = `eSIM became unreachable (${esimReason}). Every row captured before this point is kept — reconnect the VPN and press Run again to resume.`;
            return;
          }
          continue;
        }

        // ── probe (never throws; every outcome is data)
        const row = await probeJpjCode(session, code, vehicleRegNo, SCREENSHOT_DIR);
        bank(row);
        checked++;

        if (row.outcome === 'read') {
          consecutiveFailures = 0;
          continue;
        }

        consecutiveFailures++;
        session.progress('jpj-code-probe-issue', `${code}: ${row.outcome} — ${row.error ?? ''}`, 'warn');

        // Several failures in a row is a broken SESSION (draft lost, logged
        // out, form gone), not a surprising note — so try to rebuild it and
        // carry on rather than abandoning the remaining codes.
        if (consecutiveFailures >= RECOVER_AFTER_FAILURES && recoveries < MAX_RECOVERIES) {
          recoveries++;
          consecutiveFailures = 0;
          session.progress('jpj-code-recover', `${RECOVER_AFTER_FAILURES} probes in a row failed — rebuilding the Deregistration draft (recovery ${recoveries}/${MAX_RECOVERIES})`, 'warn');
          try {
            await session.closeBanners();
            await openStep2();
            session.progress('jpj-code-recover', 'Back at Step 2 — continuing the sweep', 'done');
          } catch (e) {
            session.progress('jpj-code-recover', `Rebuild failed: ${e instanceof Error ? e.message : String(e)}`, 'warn');
            if (recoveries >= MAX_RECOVERIES) {
              stoppedEarly = `The Deregistration session could not be rebuilt after ${MAX_RECOVERIES} attempts. Every row captured before this point is kept — press Run again to resume.`;
              return;
            }
          }
        }
      }
    } finally {
      await mykad.close().catch(() => { /* ignore */ });
    }
  } catch (e) {
    // Belt and braces: nothing above is expected to throw, but if it does,
    // the sweep still reports rather than failing the run.
    stoppedEarly = `Unexpected error: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    writeResultsFile(rows);

    const readRows = rows.filter((r) => r.outcome === 'read');
    // Group the codes by the exact note text — this grouping IS the deliverable.
    const byNote: Record<string, { noteColor: string; codes: string[] }> = {};
    for (const r of readRows) {
      const key = r.note || '(no note shown)';
      (byNote[key] ??= { noteColor: r.noteColor, codes: [] }).codes.push(r.code);
    }

    console.log('RESULT:' + JSON.stringify({
      // Never "FAIL" — this is a checker. STOPPED_EARLY means infrastructure
      // gave out, not that any code produced a wrong answer.
      status: stoppedEarly ? 'STOPPED_EARLY' : 'COMPLETE',
      stoppedReason: stoppedEarly,
      envSegment: inputs.envSegment,
      codesRead: readRows.length,
      codesTotal: rows.length,
      checkedThisRun: checked,
      resultsFile: RESULTS_FILE,
      screenshotDir: SCREENSHOT_DIR,
      notesByGroup: Object.entries(byNote).map(([note, g]) => ({
        note, noteColor: g.noteColor, count: g.codes.length, codes: g.codes,
      })),
      rows,
    }));
  }
});
