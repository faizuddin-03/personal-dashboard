import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Drives `scripts/eauto-esim` — an existing, working data-setup tool, left
 * completely untouched — to steer the two eSIM entities that govern the
 * eDereg Pre-Checking Enquiry outcome: `dereg-precheck-enquiry` (the JPJ
 * result) and `rhb-transfer` (the payment result). See
 * knowledge/flow-edereg.md §5.2/§5.3 and knowledge/esim.md § Dereg Precheck /
 * § RHB Transfer for how those entities were identified.
 *
 * eSIM is a SHARED instance keyed by vehicle-number prefix — anyone testing a
 * vehicle with the same prefix can leave a stale Response Code behind. Per
 * Faizuddin (2026-08-21): **every** flow run, including the happy path, must
 * set the codes it needs before starting — never assume the resting value is
 * still the OK code just because that's what it "should" be.
 */

const esimScriptDir = () =>
  process.env.DPC_ESIM_SCRIPT_DIR?.trim() || path.resolve(process.cwd(), '..', 'eauto-esim');

/** Happy-path codes — the ones this suite's one existing test needs. */
export const DEREG_PRECHECK_RESPONSE_CODE_OK = 'GLB000000I';
export const RHB_TRANSFER_RESPONSE_CODE_OK = 'OK';
/** "Failed - Vehicle Not Exist" JPJ response, per knowledge/flow-edereg.md
 *  §5.2 and CPC_E2E_TS2. Payment for the enquiry itself still succeeds — only
 *  the JPJ pre-check comes back Failed — so RHB Transfer stays at its OK code. */
export const DEREG_PRECHECK_RESPONSE_CODE_VEHICLE_NOT_EXIST = 'VEL000100E';
/** "Failed - JPJ error code" (generic, distinct from Vehicle Not Exist), per
 *  knowledge/flow-edereg.md §5.2 and CPC_E2E_TS9. Same reasoning as
 *  above — payment succeeds, only the JPJ pre-check itself comes back Failed.
 *  (Previously this comment also named CPC_E2E_TS3 — corrected 2026-08-27,
 *  per Faizuddin: TS3 is the "RHB API Down" case, `RHB_TRANSFER_RESPONSE_
 *  CODE_API_DOWN` below, not this code.) */
export const DEREG_PRECHECK_RESPONSE_CODE_JPJ_ERROR = 'VEL000045E';
/** RHB Transfer decline codes, per knowledge/flow-edereg.md §5.3 — these
 *  drive the DECLINED-payment popup shape at Deregistration step 2
 *  (DeregTransactionPage.attemptInlinePayment/beginInlinePaymentFlow),
 *  distinct from the payment-succeeds-but-JPJ-fails codes above.
 *  "RE" is a ~6-minute reset-timer window, not insufficient funds — see
 *  waitOutPaymentResetTimer(). */
export const RHB_TRANSFER_RESPONSE_CODE_RESET_TIMER = 'RE';
export const RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS = 'IF';
/** "RHB API Down" — a simulated gateway outage, distinct from a normal
 *  decline (IF/RE). Per Faizuddin, 2026-08-27: steer via this SAME RHB
 *  Transfer entity, code "ER" — resolves the trigger that was genuinely
 *  unknown as of knowledge/mykad-emulator.md's sibling memory
 *  (eaint-9306-rhb-api-down-unconfirmed.md, now stale — the trigger IS
 *  known). Drives CPC_E2E_TS3 (fresh, single-part — an outage isn't a
 *  6-month-expiry scenario) and CPC_E2E_TS12 (only its own already-
 *  Approved-then-expired Part 2, not a fresh case). */
export const RHB_TRANSFER_RESPONSE_CODE_API_DOWN = 'ER';

/** eSIM keys every record by a 2–3 character vehicle-number PREFIX, not the
 *  full vehicle number — knowledge/esim.md § "Everything is keyed by
 *  vehicle-number PREFIX". */
export function vehiclePrefix(vehicleNo: string): string {
  return vehicleNo.trim().toUpperCase().slice(0, 2);
}

export interface EsimSetResult {
  ok: boolean;
  reason?: string;
  log: string;
}

/** Set one entity's `Response Code` field for `prefix`. Read-modify happens
 *  entirely inside `scripts/eauto-esim` — this just spawns it and reports
 *  whether the write actually landed. */
export async function setEsimResponseCode(
  entity: 'dereg-precheck-enquiry' | 'rhb-transfer',
  prefix: string,
  code: string,
  timeoutMs = 5 * 60_000,
): Promise<EsimSetResult> {
  const dir = esimScriptDir();
  const fail = (reason: string): EsimSetResult => ({ ok: false, reason, log: '' });

  if (!prefix) return fail('No vehicle prefix given — cannot target an eSIM record.');
  if (!fs.existsSync(dir)) return fail(`eSIM suite not found at ${dir}. Set DPC_ESIM_SCRIPT_DIR if it has moved.`);
  if (!fs.existsSync(path.join(dir, 'node_modules'))) {
    return fail(`Playwright is not installed in ${dir}. Run: cd scripts/eauto-esim && npm install && npx playwright install chromium`);
  }

  console.log(`[esim] Setting ${entity} Response Code = ${code} for prefix "${prefix}" — requires the VPN.`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ESIM_ENTITY: entity,
    ESIM_PREFIX: prefix,
    ESIM_MODE: 'write',
    ESIM_CHANGES: JSON.stringify({ 'Response Code': code }),
  };

  const run = await new Promise<{ code: number; out: string }>((resolve) => {
    const child = spawn('npx', ['playwright', 'test', '--project=esim'], {
      cwd: dir,
      env,
      shell: process.platform === 'win32',
    });
    let out = '';
    const timer = setTimeout(() => {
      try {
        if (process.platform === 'win32' && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
        else child.kill('SIGKILL');
      } catch { /* ignore */ }
      resolve({ code: 1, out: `${out}\n[esim] Killed after ${Math.round(timeoutMs / 60_000)} minutes.` });
    }, timeoutMs);

    const pipe = (d: Buffer) => {
      const text = d.toString();
      out += text;
      for (const line of text.split(/\r?\n/)) if (line.trim()) console.log(`[esim] ${line}`);
    };
    child.stdout?.on('data', pipe);
    child.stderr?.on('data', pipe);
    child.on('close', (c) => { clearTimeout(timer); resolve({ code: c ?? 1, out }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ code: 1, out: `${out}\n${err.message}` }); });
  });

  const resultLine = run.out.match(/RESULT:(\{.*\})/)?.[1] ?? '';
  const looksLikeVpn = /ERR_CONNECTION|ERR_ADDRESS_UNREACHABLE|ERR_TIMED_OUT|net::ERR|ECONNREFUSED|ETIMEDOUT/i.test(run.out);

  if (run.code !== 0 || !resultLine) {
    return {
      ok: false,
      log: run.out,
      reason: looksLikeVpn
        ? `Could not reach the e-simulator (172.30.202.114) — the VPN looks disconnected. Reconnect and retry.`
        : `The eSIM run exited ${run.code} without a RESULT line — the write did not land. See the [esim] lines above.`,
    };
  }

  console.log(`[esim] ${entity} Response Code for "${prefix}" is now ${code}.`);
  return { ok: true, log: run.out };
}

/** Point both eSIM entities this flow depends on at their happy-path codes
 *  for `vehicleRegNo`'s prefix. Throws on failure — a stale/steered code from
 *  another tester would otherwise silently produce a false failure. */
export async function ensureEsimHappyPath(vehicleRegNo: string): Promise<void> {
  const prefix = vehiclePrefix(vehicleRegNo);
  const dereg = await setEsimResponseCode('dereg-precheck-enquiry', prefix, DEREG_PRECHECK_RESPONSE_CODE_OK);
  if (!dereg.ok) throw new Error(`[esim] Could not set Dereg Precheck Response Code: ${dereg.reason}`);

  const rhb = await setEsimResponseCode('rhb-transfer', prefix, RHB_TRANSFER_RESPONSE_CODE_OK);
  if (!rhb.ok) throw new Error(`[esim] Could not set RHB Transfer Response Code: ${rhb.reason}`);
}

/** Steer both eSIM entities for CPC_E2E_TS3/TS9 ("Failed - JPJ error code"):
 *  Dereg Precheck to VEL000045E, RHB Transfer left at OK. */
export async function ensureEsimJpjErrorPath(vehicleRegNo: string): Promise<void> {
  const prefix = vehiclePrefix(vehicleRegNo);
  const dereg = await setEsimResponseCode('dereg-precheck-enquiry', prefix, DEREG_PRECHECK_RESPONSE_CODE_JPJ_ERROR);
  if (!dereg.ok) throw new Error(`[esim] Could not set Dereg Precheck Response Code: ${dereg.reason}`);

  const rhb = await setEsimResponseCode('rhb-transfer', prefix, RHB_TRANSFER_RESPONSE_CODE_OK);
  if (!rhb.ok) throw new Error(`[esim] Could not set RHB Transfer Response Code: ${rhb.reason}`);
}

/** Set just the RHB Transfer code — used to steer a DECLINED payment
 *  (CPC_E2E_TS5/TS6's "RE"/"IF") independently of the JPJ pre-check code,
 *  since a declined payment never reaches the JPJ check at all
 *  (flow-edereg.md §4: "the JPJ check never runs"). */
export async function setRhbTransferCode(vehicleRegNo: string, code: string): Promise<void> {
  const prefix = vehiclePrefix(vehicleRegNo);
  const res = await setEsimResponseCode('rhb-transfer', prefix, code);
  if (!res.ok) throw new Error(`[esim] Could not set RHB Transfer Response Code: ${res.reason}`);
}

/** Steer both eSIM entities for CPC_E2E_TS2 ("Failed - Vehicle Not Exist"):
 *  Dereg Precheck to VEL000100E, RHB Transfer left at OK (payment for the
 *  enquiry itself succeeds; only the JPJ pre-check comes back Failed). This
 *  same steered value applies to BOTH the standalone enquiry AND any later
 *  inline retry at Deregistration step 2 for the same vehicle prefix — eSIM
 *  is a resting value per prefix, not a one-shot. */
export async function ensureEsimVehicleNotExistPath(vehicleRegNo: string): Promise<void> {
  const prefix = vehiclePrefix(vehicleRegNo);
  const dereg = await setEsimResponseCode('dereg-precheck-enquiry', prefix, DEREG_PRECHECK_RESPONSE_CODE_VEHICLE_NOT_EXIST);
  if (!dereg.ok) throw new Error(`[esim] Could not set Dereg Precheck Response Code: ${dereg.reason}`);

  const rhb = await setEsimResponseCode('rhb-transfer', prefix, RHB_TRANSFER_RESPONSE_CODE_OK);
  if (!rhb.ok) throw new Error(`[esim] Could not set RHB Transfer Response Code: ${rhb.reason}`);
}
