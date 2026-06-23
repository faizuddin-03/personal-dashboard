import { NextResponse } from 'next/server';
import * as path from 'node:path';
import * as fs from 'node:fs';

const SCRIPT_DIR      = process.env.WA_BLASTER_BETA_SCRIPT_DIR
  ?? path.join(process.cwd(), 'scripts', 'WA-Blaster-Beta');
const SCREENSHOTS_DIR = path.join(SCRIPT_DIR, 'screenshots');

/**
 * Returns all screenshots organised as:
 *   { [flowId]: { [testSlug]: [ { filename, caption, data } ] } }
 * where `data` is base64-encoded PNG.
 */
export async function GET() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    return NextResponse.json({});
  }

  type ShotMap = Record<string, Record<string, { filename: string; caption: string; data: string }[]>>;
  const result: ShotMap = {};

  for (const flowDir of fs.readdirSync(SCREENSHOTS_DIR)) {
    const flowPath = path.join(SCREENSHOTS_DIR, flowDir);
    if (!fs.statSync(flowPath).isDirectory()) continue;
    result[flowDir] = {};

    for (const testSlugDir of fs.readdirSync(flowPath)) {
      const testPath = path.join(flowPath, testSlugDir);
      if (!fs.statSync(testPath).isDirectory()) continue;

      const shots = fs.readdirSync(testPath)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(filename => ({
          filename,
          caption: filename.replace(/^\d+_/, '').replace(/\.png$/, '').replace(/_/g, ' '),
          data: fs.readFileSync(path.join(testPath, filename)).toString('base64'),
        }));

      if (shots.length > 0) result[flowDir][testSlugDir] = shots;
    }
  }

  return NextResponse.json(result);
}
