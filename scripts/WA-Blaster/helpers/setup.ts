/**
 * Global setup — runs once before all tests.
 *
 * Scans every *.spec.ts file and aborts the run if any of them import from
 * '@playwright/test' directly. All spec files must import { test, expect }
 * from './helpers/fixtures' so the auto-screenshot fixture is active.
 */
import * as fs from 'fs';
import * as path from 'path';

export default function globalSetup() {
  const testDir = path.resolve(__dirname, '..');
  const specFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
  const violations: string[] = [];

  for (const file of specFiles) {
    const content = fs.readFileSync(path.join(testDir, file), 'utf-8');
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
      `    Change them to import from './helpers/fixtures' so the\n` +
      `    auto-screenshot fixture is active in every test.\n\n` +
      violations.map(f => `    • ${f}`).join('\n') +
      '\n'
    );
  }
}
