/**
 * Global teardown — runs once after all tests complete.
 *
 * Reads results/report.json (test outcomes) and screenshots/ (per-test captures),
 * merges them into a single human-readable HTML document, then prints to PDF.
 *
 * Output: results/report.pdf
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCRIPT_DIR      = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(SCRIPT_DIR, 'screenshots');
const RESULTS_DIR     = path.join(SCRIPT_DIR, 'results');
const REPORT_JSON     = path.join(RESULTS_DIR, 'report.json');
const REPORT_PDF      = path.join(RESULTS_DIR, 'report.pdf');
const REPORT_HTML     = path.join(RESULTS_DIR, 'report.html');

// ── Types ──────────────────────────────────────────────────────────────────────

interface SpecResult {
  title:    string;
  ok:       boolean;
  duration: number;
  error?:   string;
  suite:    string;        // describe-block title
  flow:     string;        // spec file basename (without .spec.ts)
}

interface ReportStats {
  duration:   number;
  expected:   number;
  unexpected: number;
  skipped:    number;
}

// ── Parse report.json ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReport(raw: any): { stats: ReportStats; specs: SpecResult[] } {
  const specs: SpecResult[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(suite: any, flow: string) {
    for (const spec of (suite.specs ?? [])) {
      const result = spec.tests?.[0]?.results?.[0];
      const errRaw = result?.errors?.[0]?.message ?? result?.errors?.[0];
      specs.push({
        title:    spec.title,
        ok:       spec.ok ?? false,
        duration: result?.duration ?? 0,
        error:    typeof errRaw === 'string' ? errRaw.slice(0, 600) : undefined,
        suite:    suite.title,
        flow,
      });
    }
    for (const sub of (suite.suites ?? [])) walk(sub, flow);
  }

  for (const top of (raw.suites ?? [])) {
    // Top-level suite title is the spec filename, e.g. "flow-auth-and-roles.spec.ts"
    const flow = top.title.replace(/\.spec\.ts$/, '');
    walk(top, flow);
  }

  return {
    stats: {
      duration:   raw.stats?.duration   ?? 0,
      expected:   raw.stats?.expected   ?? 0,
      unexpected: raw.stats?.unexpected ?? 0,
      skipped:    raw.stats?.skipped    ?? 0,
    },
    specs,
  };
}

// ── Screenshot helpers ────────────────────────────────────────────────────────

function testSlug(title: string): string {
  return title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
}

function screenshotsForTest(flow: string, title: string): string[] {
  const dir = path.join(SCREENSHOTS_DIR, flow, testSlug(title));
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => path.join(dir, f));
}

function toDataUrl(filePath: string): string {
  return 'data:image/png;base64,' + fs.readFileSync(filePath).toString('base64');
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function msToHuman(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)} s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function flowTitle(id: string): string {
  return id
    .replace(/^(flow|smoke)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function sanitize(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildHtml(stats: ReportStats, specs: SpecResult[]): string {
  const ts = new Date().toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const totalTests = stats.expected + stats.unexpected + stats.skipped;
  const allPassed  = stats.unexpected === 0;

  // Group specs by flow
  const flows = new Map<string, SpecResult[]>();
  for (const spec of specs) {
    (flows.get(spec.flow) ?? flows.set(spec.flow, []).get(spec.flow))!.push(spec);
  }

  // ── Per-flow sections ──────────────────────────────────────────────────────
  const flowSections = [...flows.entries()].map(([flowId, flowSpecs]) => {
    const passed = flowSpecs.filter(s => s.ok).length;
    const failed = flowSpecs.filter(s => !s.ok).length;
    const flowOk = failed === 0;

    // Group by describe-block suite
    const suites = new Map<string, SpecResult[]>();
    for (const spec of flowSpecs) {
      (suites.get(spec.suite) ?? suites.set(spec.suite, []).get(spec.suite))!.push(spec);
    }

    const suiteBlocks = [...suites.entries()].map(([suiteName, suiteSpecs]) => {
      const testRows = suiteSpecs.map(spec => {
        const shots = screenshotsForTest(flowId, spec.title);

        const errorBlock = spec.error ? `
          <div class="error-box">
            <strong>Error:</strong>
            <pre>${sanitize(spec.error)}</pre>
          </div>` : '';

        const screenshotGrid = shots.length > 0 ? `
          <div class="shot-grid">
            ${shots.map(f => `<figure>
              <img src="${toDataUrl(f)}" />
              <figcaption>${path.basename(f, '.png').replace(/^\d+_/, '').replace(/_/g, ' ')}</figcaption>
            </figure>`).join('')}
          </div>` : '';

        return `
          <div class="test-row ${spec.ok ? 'pass' : 'fail'}">
            <div class="test-header">
              <span class="badge ${spec.ok ? 'badge-pass' : 'badge-fail'}">${spec.ok ? 'PASS' : 'FAIL'}</span>
              <span class="test-title">${sanitize(spec.title)}</span>
              <span class="test-duration">${msToHuman(spec.duration)}</span>
            </div>
            ${errorBlock}
            ${screenshotGrid}
          </div>`;
      }).join('');

      return `
        <div class="suite-block">
          <div class="suite-name">${sanitize(suiteName)}</div>
          ${testRows}
        </div>`;
    }).join('');

    return `
      <section class="flow-section">
        <div class="flow-header ${flowOk ? 'flow-ok' : 'flow-fail'}">
          <span class="flow-title">${flowTitle(flowId)}</span>
          <span class="flow-counts">
            ${passed > 0 ? `<span class="count-pass">${passed} passed</span>` : ''}
            ${failed > 0 ? `<span class="count-fail">${failed} failed</span>` : ''}
          </span>
        </div>
        ${suiteBlocks}
      </section>`;
  }).join('');

  // ── Full HTML document ─────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WA Blaster Test Report</title>
<style>
/* ── Reset & base ─────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  background: #ffffff;
  color: #1a1a2e;
}

/* ── Cover header ─────────────────────────────────────────────────────── */
.cover {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  color: white;
  padding: 40px 48px 36px;
  page-break-after: avoid;
}
.cover-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}
.cover-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 28px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 16px;
  width: fit-content;
}
.summary-card {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 14px 20px;
  min-width: 110px;
  text-align: center;
}
.summary-card .value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}
.summary-card .label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .6px;
}
.val-pass   { color: #4ade80; }
.val-fail   { color: #f87171; }
.val-skip   { color: #94a3b8; }
.val-time   { color: #60a5fa; }

/* ── Flow sections ────────────────────────────────────────────────────── */
.flow-section {
  margin: 0;
  page-break-before: always;
}
.flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 3px solid transparent;
}
.flow-ok   { background: #f0fdf4; border-color: #22c55e; }
.flow-fail { background: #fff1f2; border-color: #ef4444; }
.flow-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.flow-counts { display: flex; gap: 10px; font-size: 12px; font-weight: 600; }
.count-pass { color: #16a34a; }
.count-fail { color: #dc2626; }

/* ── Suite blocks ─────────────────────────────────────────────────────── */
.suite-block { padding: 0 24px 8px; }
.suite-name  {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: #64748b;
  padding: 14px 0 6px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 6px;
}

/* ── Individual test rows ─────────────────────────────────────────────── */
.test-row {
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.test-row:last-child { border-bottom: none; }

.test-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .8px;
  padding: 2px 7px;
  border-radius: 4px;
}
.badge-pass { background: #dcfce7; color: #15803d; }
.badge-fail { background: #fee2e2; color: #b91c1c; }

.test-title {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
}
.test-duration {
  flex-shrink: 0;
  font-size: 11px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

/* ── Error box ────────────────────────────────────────────────────────── */
.error-box {
  margin-top: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 11px;
  color: #7f1d1d;
}
.error-box strong { display: block; margin-bottom: 4px; color: #991b1b; }
.error-box pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  font-size: 10.5px;
  line-height: 1.6;
}

/* ── Screenshot grid ──────────────────────────────────────────────────── */
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 12px;
}
figure {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  page-break-inside: avoid;
}
figure img {
  width: 100%;
  display: block;
}
figcaption {
  font-size: 10px;
  font-family: "SF Mono", "Fira Code", monospace;
  color: #64748b;
  padding: 5px 8px;
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
</head>
<body>

<div class="cover">
  <div class="cover-title">WA Blaster — Test Report</div>
  <div class="cover-subtitle">Generated ${ts}</div>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="value val-pass">${stats.expected}</div>
      <div class="label">Passed</div>
    </div>
    <div class="summary-card">
      <div class="value ${stats.unexpected > 0 ? 'val-fail' : 'val-pass'}">${stats.unexpected}</div>
      <div class="label">Failed</div>
    </div>
    <div class="summary-card">
      <div class="value val-skip">${stats.skipped}</div>
      <div class="label">Skipped</div>
    </div>
    <div class="summary-card">
      <div class="value val-time">${msToHuman(stats.duration)}</div>
      <div class="label">Duration</div>
    </div>
  </div>
</div>

${flowSections}

</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default async function teardown() {
  if (!fs.existsSync(REPORT_JSON)) return;

  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf8')); }
  catch { return; }

  const { stats, specs } = parseReport(raw);
  if (specs.length === 0) return;

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const html = buildHtml(stats, specs);
  fs.writeFileSync(REPORT_HTML, html, 'utf8');

  const browser = await chromium.launch();
  try {
    const pg = await browser.newPage();
    await pg.goto(`file://${REPORT_HTML}`, { waitUntil: 'load', timeout: 120_000 });
    await pg.pdf({
      path:            REPORT_PDF,
      format:          'A4',
      printBackground: true,
      margin:          { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await browser.close();
  }
}
