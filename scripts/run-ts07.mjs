#!/usr/bin/env node
// EAINT-11864 TS07 — eSTM + quotation, end to end.
//
//   node scripts/run-ts07.mjs --vehicle HX040 [--headed] [--skip-estm]
//
// Stage 1  scripts/eauto-estm            on sit2  -> creates the eSTM, yields a
//                                                    vehicle number + buyer IC
// Stage 2  scripts/eauto-quotation-reminder on uat1 -> Get Free Quote with that
//                                                    pair, stop at step 3
//
// WHY TWO PROCESSES, not one spec: each suite has its own node_modules, and two
// @playwright/test installs cannot load into a single process — Playwright
// fails immediately with "Requiring @playwright/test second time". Chaining
// processes is what makes the combination possible at all.
//
// WHY TWO ENVIRONMENTS: the eSTM identity bypass is only set up on sit2, while
// 11864's insurance changes are deployed to uat1. The eSTM is NOT a precondition
// here — it exists purely to hand over a fresh vehicle number and IC, which is
// why living in a different environment is harmless. Quoting needs a vehicle
// number and an IC, nothing more. See knowledge/eauto-insurance.md.

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ESTM_DIR = path.join(HERE, 'eauto-estm');
const QR_DIR = path.join(HERE, 'eauto-quotation-reminder');

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const CONFIG = {
  vehicle: (arg('vehicle') || process.env.TS07_VEHICLE_NO || '').toUpperCase(),
  email: arg('email') || process.env.TS07_EMAIL || 'faizuddin@modefair.com',
  mobile: arg('mobile') || process.env.TS07_MOBILE || '0189812839',
  estmEnv: arg('estm-env') || process.env.TS07_ESTM_ENV || 'sit2',
  qrBase: arg('qr-base') || process.env.QR_BASE_URL || 'https://staging.eauto.my/uat1',
  insurer: arg('insurer') || process.env.NQ_INSURER || 'Lonpac',
  headed: flag('headed'),
  skipEstm: flag('skip-estm'),
  // Only needed if the eSTM stage is skipped and the pair is supplied by hand.
  ic: arg('ic') || process.env.TS07_IC || '',
};

function run(label, cwd, args, env) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(70)}\n${label}\n  ${cwd}\n  npx ${args.join(' ')}\n${'='.repeat(70)}`);
    const child = spawn('npx', args, {
      cwd,
      shell: process.platform === 'win32',
      env: { ...process.env, ...env },
    });
    let out = '';
    const tee = (d) => { const s = d.toString(); out += s; process.stdout.write(s); };
    child.stdout?.on('data', tee);
    child.stderr?.on('data', tee);
    child.on('close', (code) => resolve({ code: code ?? 1, out }));
    child.on('error', (e) => resolve({ code: 1, out: out + '\n' + e.message }));
  });
}

const lastMatch = (text, re) => {
  const hits = [...text.matchAll(re)];
  return hits.length ? hits[hits.length - 1][1] : '';
};

if (!CONFIG.vehicle) {
  console.error(
    'A vehicle number is required:  node scripts/run-ts07.mjs --vehicle HX040\n\n' +
    'Use a FRESH one each run. The eSTM stage creates a transfer for it, and a\n' +
    'number that has already been through one will not behave the same way.',
  );
  process.exit(2);
}

console.log(`TS07 — eSTM (${CONFIG.estmEnv}) then quotation (${CONFIG.qrBase})`);
console.log(`Vehicle ${CONFIG.vehicle}${CONFIG.headed ? ' · headed, watch the browser' : ''}`);

let vehicle = CONFIG.vehicle;
let ic = CONFIG.ic;

// ── Stage 1: eSTM ────────────────────────────────────────────
if (!CONFIG.skipEstm) {
  const estm = await run('STAGE 1/2 — create the eSTM', ESTM_DIR, ['playwright', 'test'], {
    ESTM_ENV_SEGMENT: CONFIG.estmEnv,
    ESTM_VEHICLE_REG_NO: vehicle,
    ESTM_EMAIL_ADDRESS: CONFIG.email,
    ESTM_MOBILE_NO: CONFIG.mobile,
    ESTM_SKIP_PAUSE: '1',
  });

  if (estm.code !== 0) {
    console.error('\nStage 1 failed — the eSTM was not created, so there is no fresh pair to quote with.');
    console.error('Nothing was run against uat1. Fix the eSTM stage first, or pass --skip-estm --ic <ic> to go straight to the quotation.');
    process.exit(1);
  }

  // PaymentPage emits this from step 5; it is the bypass slot's IC.
  ic = lastMatch(estm.out, /^BUYER_IC:(.+)$/m).trim() || ic;
  const resultLine = lastMatch(estm.out, /^RESULT:(.+)$/m);
  if (resultLine) {
    try { vehicle = JSON.parse(resultLine).vehicleRegNo || vehicle; } catch { /* keep the input */ }
  }
  console.log(`\nStage 1 done — vehicle ${vehicle}, buyer IC ${ic || '(not captured)'}`);
}

if (!ic) {
  console.error(
    '\nNo buyer IC to quote with. The eSTM stage should print BUYER_IC: from step 5;\n' +
    'if it did not, pass one explicitly with --ic <ic>.',
  );
  process.exit(1);
}

// ── Stage 2: quotation to step 3 ─────────────────────────────
const qr = await run(
  'STAGE 2/2 — Get Free Quote, stop at step 3',
  QR_DIR,
  ['playwright', 'test', '-c', 'playwright.nightly.config.ts'],
  {
    QR_BASE_URL: CONFIG.qrBase,
    QR_VEHICLE_NO: vehicle,
    QR_IC: ic,
    NQ_INSURER: CONFIG.insurer,
    ...(CONFIG.headed && { NQ_HEADED: '1' }),
  },
);

console.log(`\n${'='.repeat(70)}`);
if (qr.code === 0) {
  const r = lastMatch(qr.out, /^RESULT:(.+)$/m);
  console.log('TS07 PASSED');
  console.log(`  vehicle    ${vehicle}`);
  console.log(`  buyer IC   ${ic}`);
  if (r) {
    try {
      const j = JSON.parse(r);
      console.log(`  insurer    ${j.insurer}`);
      console.log(`  txn id     ${j.transactionId || '(none)'}`);
      console.log(`  stamped    ${j.stampedAtLocal}`);
      console.log(`  listed     ${j.listedAsQuotation ? 'yes — visible in the insurance listing' : 'NO'}`);
    } catch { /* the raw log above already has it */ }
  }
  console.log('\nNext: check Mailtrap. A quotation after 23:00 is due at the 07:00 cron run;');
  console.log('one stamped during the day is due at the next hourly run.');
} else {
  console.log('TS07 FAILED at stage 2 — the eSTM was created, the quotation was not.');
  console.log(`Re-run just this half:  node scripts/run-ts07.mjs --vehicle ${vehicle} --ic ${ic} --skip-estm${CONFIG.headed ? ' --headed' : ''}`);
}
console.log('='.repeat(70));
process.exit(qr.code);
