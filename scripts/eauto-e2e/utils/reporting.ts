import * as fs from 'fs';
import * as path from 'path';
import { Check, Snapshot } from '../data/types';

// ── E2E run reporter ────────────────────────────────────────
// Owns the verification ledger, the stdout streaming protocol the dashboard
// consumes (PROGRESS:/ART:/RESULT: lines), and the Markdown + JSON reports.
// Page objects capture data; the spec records checks through this reporter.

export class E2EReporter {
  private checks: Check[] = [];

  constructor(
    private readonly artifactDir: string,
    private readonly meta: { vehicleNo: string; env: string },
  ) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // ── stdout streaming protocol (parsed by the dashboard) ──
  progress(step: string, status: string, label?: string) {
    console.log('PROGRESS:' + JSON.stringify({ step, status, label }));
  }
  artifact(a: object) { console.log('ART:' + JSON.stringify(a)); }
  info(m: string) { console.log(m); }
  good(m: string) { console.log('✅ ' + m); }
  warn(m: string) { console.log('⚠️ ' + m); }
  bad(m: string)  { console.log('❌ ' + m); }

  // ── verification ledger ──
  record(name: string, pass: boolean, detail: string) {
    this.checks.push({ name, pass, detail });
    (pass ? this.good : this.bad).call(this, `${name} — ${detail}`);
  }
  get passed() { return this.checks.filter(c => c.pass).length; }
  get failed() { return this.checks.length - this.passed; }

  /** Write report.md + report.json, emit the RESULT line, and return failure count. */
  finish(outcome: string, snap: Snapshot): number {
    this.progress('summary', 'running', 'Summary');
    const passed = this.passed, failed = this.failed;
    const verdict = failed === 0 ? 'ALL CHECKS PASSED ✅' : `${failed} CHECK(S) FAILED ❌`;
    const videoFile = `${this.meta.vehicleNo}_insurance-e2e.webm`;

    const md: string[] = [];
    md.push(`# Insurance E2E Report — ${this.meta.vehicleNo}`);
    md.push(`- Outcome: **${outcome}** — ${verdict}`);
    md.push(`- Env: ${this.meta.env} · Insurer: ${snap.step1?.insurer || '-'} · Cover: ${snap.step1?.coverType || '-'} · Coverage: ${snap.step2?.selectedCoverage || '-'}`);
    md.push(`- Reference: ${snap.step3?.referenceNo || '-'} · E-Cert: ${snap.step4?.eCert || '-'} · Paid: ${snap.step4?.paymentAmount || '-'}`);
    md.push(`\n## Checks (${passed}/${this.checks.length} passed)`);
    for (const c of this.checks) md.push(`- ${c.pass ? '✅' : '❌'} **${c.name}** — ${c.detail}`);
    md.push(`\n## Captured data per page`);
    for (const [pg, fields] of Object.entries(snap)) {
      md.push(`\n### ${pg}`);
      for (const [k, val] of Object.entries(fields)) md.push(`- ${k}: ${val}`);
    }
    try { fs.writeFileSync(path.join(this.artifactDir, 'report.md'), md.join('\n')); } catch { /* ignore */ }
    try { fs.writeFileSync(path.join(this.artifactDir, 'report.json'), JSON.stringify({ outcome, verdict, passed, failed, checks: this.checks, snap, videoFile }, null, 2)); } catch { /* ignore */ }

    console.log('RESULT:' + JSON.stringify({
      outcome, verdict, passed, failed,
      vehicleNo: this.meta.vehicleNo, env: this.meta.env,
      insurer: snap.step1?.insurer, coverType: snap.step1?.coverType,
      coverage: snap.step2?.selectedCoverage,
      referenceNo: snap.step3?.referenceNo, eCert: snap.step4?.eCert,
      paymentAmount: snap.step4?.paymentAmount, jpj: snap.details?.jpj,
      email: snap.details?.email, hirePurchase: snap.details?.hirePurchase,
      checks: this.checks, snap, videoFile,
    }));

    this.info('\n══════════════════════════════════════════════════════════');
    this.info(`  ${verdict}  (${passed}/${this.checks.length} checks)  ·  ${outcome}`);
    this.info('══════════════════════════════════════════════════════════');
    this.progress('summary', failed === 0 ? 'done' : 'error');
    return failed;
  }
}

// ── Money helpers (shared math for the verification checks) ──
export const parseMoney = (s?: string): number | null => {
  if (!s) return null;
  const m = String(s).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};
export const approxEq = (a: number | null, b: number | null, tol = 0.05) =>
  a != null && b != null && Math.abs(a - b) <= tol;
export const norm = (s?: string) => (s || '').replace(/\s+/g, ' ').trim();
export const rnd = (n: number) => Math.floor(Math.random() * n);
export const pick = <T>(arr: T[]): T => arr[rnd(arr.length)];
