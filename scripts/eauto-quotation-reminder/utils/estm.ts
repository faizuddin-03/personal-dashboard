import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONFIG } from '../data/config';

/**
 * Create an approved eSTM by DRIVING scripts/eauto-estm, not by reimplementing
 * it. That suite already owns the hard parts — the two identity bypasses, the
 * `getActivePage()` rule, the verbatim payment sequence — and a second
 * implementation of any of that would rot the moment one of them changes.
 * See knowledge/flow-estm.md.
 *
 * It is a separate Playwright project with its own config (slowMo 600 is
 * load-bearing there), so it runs as a child process rather than being
 * imported. Two lines of its stdout are the contract:
 *
 *   BUYER_IC:<ic>        printed from #refId on the eSTM payment step
 *   RESULT:{"status":…}  printed by tests/estm.spec.ts on success
 *
 * `BUYER_IC` is why TS04 does not have to be told an IC. The eSTM's buyer
 * identity comes from the bypass slot, and the insurance quote has to be keyed
 * with THAT ic — a different one quotes a different person and the eSTM
 * precondition silently does not apply.
 */
/** The eVOC address, fixed by the team and carried by the eSTM suite. The
 *  buyer email must differ from it. `[from Faizuddin, 2026-08-18]` */
const EVOC_EMAIL = 'faizuddin@modefair.com';

export interface EstmRun {
  ok: boolean;
  /** The buyer IC the eSTM was created against, when the run reported one. */
  ic: string;
  vehicleNo: string;
  finalUrl: string;
  reason?: string;
  log: string;
}

/** `https://staging.eauto.my/uat1` → `uat1`. The eSTM suite takes the segment,
 *  not the base URL, and builds its own base from it. */
export function envSegment(baseUrl = CONFIG.baseUrl): string {
  return baseUrl.replace(/\/+$/, '').split('/').pop() ?? '';
}

export function estmScriptDir(): string {
  if (CONFIG.estmScriptDir) return CONFIG.estmScriptDir;
  // Playwright runs with cwd = this suite's directory, so the sibling is one up.
  return path.resolve(process.cwd(), '..', 'eauto-estm');
}

export async function createEstm(vehicleNo: string, timeoutMs = 12 * 60_000): Promise<EstmRun> {
  const dir = estmScriptDir();
  const fail = (reason: string): EstmRun => ({ ok: false, ic: '', vehicleNo, finalUrl: '', reason, log: '' });

  if (!fs.existsSync(dir)) return fail(`eSTM suite not found at ${dir}. Set QR_ESTM_SCRIPT_DIR.`);
  if (!fs.existsSync(path.join(dir, 'node_modules'))) {
    return fail(`Playwright is not installed in ${dir}. Run: cd scripts/eauto-estm && npm install && npx playwright install chromium`);
  }

  const segment = envSegment();
  if (!segment) return fail(`Could not read an environment segment out of ${CONFIG.baseUrl}.`);

  // Two different email fields with different rules on the buyer/vehicle step:
  // eVOC (`#email`, readonly, reconfirmed in `#reconfirmEmail`) is FIXED at
  // EVOC_EMAIL; the buyer email (`#buyerEmail`) must be something else. Equal
  // values are rejected with "Please enter Buyer's Email Address." — caught
  // here rather than eight minutes into a run.
  const buyerEmail = CONFIG.estmBuyerEmail;
  if (!buyerEmail) return fail("No eSTM buyer email — set it on the quotation-reminder page.");
  if (buyerEmail.trim().toLowerCase() === EVOC_EMAIL) {
    return fail(`The eSTM buyer email cannot be ${EVOC_EMAIL}: that is the eVOC address, and the portal rejects the form when the two match. Use a different address.`);
  }

  console.log(`[estm] Creating an eSTM for ${vehicleNo} on ${segment} — this leg takes ~4-8 minutes.`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ESTM_ENV_SEGMENT: segment,
    ESTM_VEHICLE_REG_NO: vehicleNo,
    ESTM_EMAIL_ADDRESS: buyerEmail,
    ESTM_MOBILE_NO: CONFIG.estmMobile,
    // Both add-ons cost real money on every throwaway transaction (eLKM ~RM200,
    // eVOC RM10) and neither is needed to make the eSTM approved. eLKM also
    // requires the vehicle to already carry active insurance, which is exactly
    // what this eSTM is being created to enable — so it would fail anyway.
    ESTM_ELKM: CONFIG.estmElkm ? '1' : '0',
    ESTM_EVOC: CONFIG.estmEvoc ? '1' : '0',
    // Never leave the child parked on an interactive pause: this runs headless
    // from the dashboard and nobody is there to resume it.
    ESTM_SKIP_PAUSE: '1',
    ...(CONFIG.estmUser && { ESTM_USERNAME: CONFIG.estmUser }),
    ...(CONFIG.estmPass && { ESTM_PASSWORD: CONFIG.estmPass }),
    ...(CONFIG.estmBypassSlot && { ESTM_BYPASS_SLOT: CONFIG.estmBypassSlot }),
    // ESTM_EVOC_EMAIL is deliberately NOT sent: the eVOC address is fixed and
    // the eSTM suite already carries it.
  };

  const run = await new Promise<{ code: number; out: string }>((resolve) => {
    const child = spawn('npx', ['playwright', 'test', '--reporter=list'], {
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
      resolve({ code: 1, out: `${out}\n[estm] Killed after ${Math.round(timeoutMs / 60_000)} minutes.` });
    }, timeoutMs);

    // Mirror the child's output into this run's log. Without it an eSTM failure
    // reads as "TS04 failed at the quote form" with no explanation anywhere.
    const pipe = (d: Buffer) => {
      const text = d.toString();
      out += text;
      for (const line of text.split(/\r?\n/)) if (line.trim()) console.log(`[estm] ${line}`);
    };
    child.stdout?.on('data', pipe);
    child.stderr?.on('data', pipe);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? 1, out }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ code: 1, out: `${out}\n${err.message}` }); });
  });

  const ic = run.out.match(/BUYER_IC:\s*(\S+)/)?.[1] ?? '';
  const resultLine = run.out.match(/RESULT:(\{.*\})/)?.[1] ?? '';
  let finalUrl = '';
  try { finalUrl = String(JSON.parse(resultLine).finalUrl ?? ''); } catch { /* no RESULT line */ }

  if (run.code !== 0 || !resultLine) {
    return { ok: false, ic, vehicleNo, finalUrl, log: run.out, reason: `The eSTM run exited ${run.code} without a RESULT line — the transaction was not created. See the [estm] lines above.` };
  }

  console.log(`[estm] Created for ${vehicleNo}${ic ? ` (buyer IC ${ic})` : ''}.`);
  return { ok: true, ic, vehicleNo, finalUrl, log: run.out };
}
