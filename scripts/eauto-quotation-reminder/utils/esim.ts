import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONFIG } from '../data/config';

/**
 * Drives `scripts/eauto-esim` — an existing, working data-setup tool, left
 * completely untouched — to steer the e-simulator's eSTM Enquiry Response
 * Code for TS06's 69E case. `[from Faizuddin, 2026-08-18]`
 *
 * eSIM is a single shared instance keyed by vehicle-number PREFIX (see
 * knowledge/esim.md), so this is deliberately narrow: it only ever writes the
 * one field (`Response Code`), only for the prefix it's given, and the caller
 * is responsible for restoring it afterwards — `RESPONSE_CODE_OK` is exported
 * for exactly that. Spawned the same way `app/api/eauto-esim/run/route.ts`
 * spawns it for the dashboard (`npx playwright test --project=esim`), parsing
 * the same `RESULT:` line — that route is the reference for this, not
 * something this file imports (the two run from different processes: the
 * dashboard's Next.js server vs. this Playwright test run).
 */

/** GLB000000I is the success/OK response code — the resting state every
 *  prefix should be left in. `[from Faizuddin, 2026-08-18]` */
export const RESPONSE_CODE_OK = 'GLB000000I';
/** The code that triggers the eSTM → insurance auto-redirect, forcing the
 *  purchase (TS06). See knowledge/flow-estm.md § eSTM → insurance handoff. */
export const RESPONSE_CODE_FORCE_INSURANCE = 'VEL000069E';

/** eSIM keys every record by a 2–3 character vehicle-number PREFIX, not the
 *  full vehicle number — knowledge/esim.md § "Everything is keyed by
 *  vehicle-number PREFIX". TS06 asked for the first 2 characters specifically. */
export function vehiclePrefix(vehicleNo: string): string {
  return vehicleNo.trim().toUpperCase().slice(0, 2);
}

export interface EsimSetResult {
  ok: boolean;
  reason?: string;
  log: string;
}

function esimScriptDir(): string {
  if (CONFIG.esimScriptDir) return CONFIG.esimScriptDir;
  // Playwright runs with cwd = this suite's directory, so the sibling is one up.
  return path.resolve(process.cwd(), '..', 'eauto-esim');
}

/**
 * Set the eSTM Enquiry `Response Code` for `prefix` to `code`. Read-modify
 * happens entirely inside `scripts/eauto-esim` — this just spawns it and
 * reports whether the write actually landed.
 */
export async function setEsimResponseCode(prefix: string, code: string, timeoutMs = 5 * 60_000): Promise<EsimSetResult> {
  const dir = esimScriptDir();
  const fail = (reason: string): EsimSetResult => ({ ok: false, reason, log: '' });

  if (!prefix) return fail('No vehicle prefix given — cannot target an eSIM record.');
  if (!fs.existsSync(dir)) return fail(`eSIM suite not found at ${dir}. Set QR_ESIM_SCRIPT_DIR if it has moved.`);
  if (!fs.existsSync(path.join(dir, 'node_modules'))) {
    return fail(`Playwright is not installed in ${dir}. Run: cd scripts/eauto-esim && npm install && npx playwright install chromium`);
  }

  console.log(`[esim] Setting Response Code = ${code} for prefix "${prefix}" — requires the VPN.`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ESIM_ENTITY: 'estm-enquiry',
    ESIM_PREFIX: prefix,
    ESIM_MODE: 'write',
    ESIM_CHANGES: JSON.stringify({ 'Response Code': code }),
    ...(CONFIG.esimUser && { ESIM_USER: CONFIG.esimUser }),
    ...(CONFIG.esimPass && { ESIM_PASS: CONFIG.esimPass }),
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

  console.log(`[esim] Response Code for "${prefix}" is now ${code}.`);
  return { ok: true, log: run.out };
}
