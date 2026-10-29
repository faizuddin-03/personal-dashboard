import * as fs from 'fs';
import * as path from 'path';

// ── Framework-rule guard (global setup) ─────────────────────
// Every spec must import from the auth fixture (so the auto-screenshot
// fixture is active) — never from '@playwright/test' directly.
export default function globalSetup() {
  const testsDir = path.resolve(__dirname, '..', 'tests');
  const specFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
  const violations: string[] = [];

  for (const file of specFiles) {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
    if (
      content.includes("from '@playwright/test'") ||
      content.includes('from "@playwright/test"')
    ) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `\n\n  ✗ These spec files import from '@playwright/test' directly.\n` +
      `    Change them to import from '../fixtures/authFixture' so the\n` +
      `    auto-screenshot fixture is active in every test.\n\n` +
      violations.map(f => `    • ${f}`).join('\n') +
      '\n'
    );
  }
}
