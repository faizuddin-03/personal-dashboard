import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR  = process.env.WA_BLASTER_SCRIPT_DIR
  ?? path.join(process.cwd(), 'scripts', 'WA-Blaster');
const PDF_PATH    = path.join(SCRIPT_DIR, 'results', 'screenshots-report.pdf');

export async function GET() {
  if (!fs.existsSync(PDF_PATH)) {
    return NextResponse.json({ error: 'No screenshot report available yet.' }, { status: 404 });
  }

  const buf = fs.readFileSync(PDF_PATH);
  return new NextResponse(buf, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="wa-blaster-screenshots.pdf"',
      'Content-Length':      String(buf.byteLength),
    },
  });
}
