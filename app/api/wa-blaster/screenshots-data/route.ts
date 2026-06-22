import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR       = process.env.WA_BLASTER_SCRIPT_DIR
  ?? path.join(process.cwd(), 'scripts', 'WA-Blaster');
const SCREENSHOTS_DIR  = path.join(SCRIPT_DIR, 'screenshots');

// Returns all screenshots as base64, organised by flow → testSlug → [{filename, caption, data}]
export async function GET() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    return NextResponse.json({});
  }

  const result: Record<string, Record<string, { filename: string; caption: string; data: string }[]>> = {};

  for (const flow of fs.readdirSync(SCREENSHOTS_DIR)) {
    const flowDir = path.join(SCREENSHOTS_DIR, flow);
    if (!fs.statSync(flowDir).isDirectory()) continue;
    result[flow] = {};

    for (const testSlug of fs.readdirSync(flowDir)) {
      const testDir = path.join(flowDir, testSlug);
      if (!fs.statSync(testDir).isDirectory()) continue;

      const shots = fs.readdirSync(testDir)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(filename => {
          const caption = filename
            .replace(/^\d+_/, '')   // strip leading counter
            .replace(/\.png$/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
          const data = fs.readFileSync(path.join(testDir, filename)).toString('base64');
          return { filename, caption, data };
        });

      if (shots.length > 0) result[flow][testSlug] = shots;
    }
  }

  return NextResponse.json(result);
}
