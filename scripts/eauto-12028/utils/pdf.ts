import { Download, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { capturePdfWithHighlights, HighlightSpec } from './pdfHighlight';

// Saves a downloaded Payment Request PDF as evidence (named after its TS) and
// reads its text — same pattern as scripts/eauto-jomcheck's
// downloadReportAsText(): pdf-parse, whitespace collapsed. The file is saved
// FIRST, before any assertion can throw (scaffold skill §2).

export interface SavedPdf { file: string; suggested: string; text: string }

export async function savePdf(download: Download, label: string): Promise<SavedPdf> {
  const dir = process.env.PW_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'eauto-12028-'));
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label.replace(/[^\w.-]+/g, '_')}.pdf`);
  await download.saveAs(file);
  const suggested = download.suggestedFilename();
  let text = '';
  try {
    text = (await pdfParse(fs.readFileSync(file))).text.replace(/\s+/g, ' ').trim();
  } catch (e) {
    throw new Error(`"${suggested}" could not be read as a PDF (${e instanceof Error ? e.message : e}). The mock-up saved an HTML file named .pdf — is the build sending a real PDF?`);
  }
  console.log(`DETAIL:${JSON.stringify({ label: 'Downloaded file', value: suggested })}`);
  return { file, suggested, text };
}

/** Green / red boxed screenshot of the checked words, saved next to the PDF (evidence). */
export async function highlightPdf(page: Page, pdf: SavedPdf, label: string, spec: HighlightSpec, caption: string): Promise<void> {
  const r = await capturePdfWithHighlights(page, pdf.file, label, spec, caption);
  if (!r.saved) console.log(`   ⚠️ PDF highlight screenshot not saved: ${r.error}`);
}
