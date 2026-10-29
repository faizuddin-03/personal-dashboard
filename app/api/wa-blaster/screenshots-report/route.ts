import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR  = process.env.WA_BLASTER_SCRIPT_DIR
  ?? path.join(process.cwd(), 'scripts', '_archive', 'WA-Blaster');
const PDF_PATH    = path.join(SCRIPT_DIR, 'results', 'report.pdf');
const HTML_PATH   = path.join(SCRIPT_DIR, 'results', 'report.html');

export async function GET() {
  // Prefer the PDF if Chromium managed to generate it
  if (fs.existsSync(PDF_PATH)) {
    const buf = fs.readFileSync(PDF_PATH);
    return new NextResponse(buf, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'attachment; filename="wa-blaster-report.pdf"',
        'Content-Length':      String(buf.byteLength),
      },
    });
  }

  // Fall back to the HTML report (self-contained, inline screenshots)
  if (fs.existsSync(HTML_PATH)) {
    const buf = fs.readFileSync(HTML_PATH);
    return new NextResponse(buf, {
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="wa-blaster-report.html"',
        'Content-Length':      String(buf.byteLength),
      },
    });
  }

  return NextResponse.json(
    { error: 'No report found. Run a test suite first, then wait for it to finish.' },
    { status: 404 },
  );
}
