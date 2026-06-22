/**
 * Global teardown — runs once after all tests complete.
 *
 * Scans screenshots/, generates an HTML report with every screenshot
 * embedded as base64, then prints it to PDF using Playwright's Chromium.
 * Output: results/screenshots-report.html + results/screenshots-report.pdf
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const RESULTS_DIR     = path.join(__dirname, '..', 'results');

interface ScreenshotEntry { flow: string; group: string; label: string; absPath: string; }

function collect(): ScreenshotEntry[] {
  const results: ScreenshotEntry[] = [];
  if (!fs.existsSync(SCREENSHOTS_DIR)) return results;

  function walk(dir: string, parts: string[]) {
    for (const entry of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        walk(full, [...parts, entry]);
      } else if (entry.endsWith('.png')) {
        const [flow = 'misc', group = ''] = parts;
        const label = [...parts.slice(2), entry.replace(/\.png$/, '')]
          .join(' / ')
          .replace(/_/g, ' ');
        results.push({ flow, group, label, absPath: full });
      }
    }
  }

  walk(SCREENSHOTS_DIR, []);
  return results;
}

export default async function teardown() {
  const screenshots = collect();
  if (screenshots.length === 0) return;

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Group by flow
  const byFlow: Record<string, ScreenshotEntry[]> = {};
  for (const s of screenshots) {
    (byFlow[s.flow] ??= []).push(s);
  }

  const timestamp = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });

  const sections = Object.entries(byFlow).map(([flow, items]) => {
    const figures = items.map(({ label, absPath }) => {
      const b64 = fs.readFileSync(absPath).toString('base64');
      return `
        <figure>
          <figcaption>${label}</figcaption>
          <img src="data:image/png;base64,${b64}" loading="lazy" />
        </figure>`;
    }).join('');

    const title = flow.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<section><h2>${title}</h2>${figures}</section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WA Blaster — Screenshot Report</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body  { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #f8fafc; color: #1e293b; }
  header { background: #0f172a; color: #f1f5f9; padding: 24px 32px; }
  header h1 { font-size: 18px; font-weight: 700; letter-spacing: -.3px; }
  header p  { font-size: 11px; color: #64748b; margin-top: 4px; }
  main  { padding: 24px 32px; max-width: 960px; margin: 0 auto; }
  section { margin-bottom: 48px; }
  h2    { font-size: 13px; font-weight: 600; text-transform: capitalize;
          background: #1e293b; color: #e2e8f0; padding: 7px 12px;
          border-radius: 6px; margin-bottom: 16px; letter-spacing: .3px; }
  figure { background: white; border: 1px solid #e2e8f0; border-radius: 8px;
           padding: 12px; margin-bottom: 14px; page-break-inside: avoid; }
  figcaption { font-size: 10px; font-family: "SF Mono", "Fira Code", monospace;
               color: #94a3b8; margin-bottom: 8px; }
  img   { width: 100%; display: block; border-radius: 4px;
          border: 1px solid #f1f5f9; }
</style>
</head>
<body>
<header>
  <h1>WA Blaster — Screenshot Report</h1>
  <p>Generated ${timestamp} &middot; ${screenshots.length} screenshots across ${Object.keys(byFlow).length} flows</p>
</header>
<main>${sections}</main>
</body>
</html>`;

  const htmlPath = path.join(RESULTS_DIR, 'screenshots-report.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  // Print to PDF via Playwright Chromium
  const browser = await chromium.launch();
  try {
    const pg = await browser.newPage();
    await pg.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 60_000 });
    await pg.pdf({
      path:            path.join(RESULTS_DIR, 'screenshots-report.pdf'),
      format:          'A4',
      printBackground: true,
      margin:          { top: '12px', bottom: '12px', left: '12px', right: '12px' },
    });
  } finally {
    await browser.close();
  }
}
