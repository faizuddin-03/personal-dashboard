import { type Download, test } from "@playwright/test";
// pdf-parse v2 dropped the v1 `pdf(buffer) -> {text, numpages}` default-export
// function entirely, in favour of a `PDFParse` class (`new PDFParse({data}).
// getText()`/`.getInfo()`) — the old default-export call site was throwing
// "(0 , _pdfParse.default) is not a function" against the installed 2.4.5.
import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";

async function downloadToBuffer(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Download produced no readable stream — the file may have failed to save.");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Extract plain text from a Playwright Download (e.g. a generated Delivery Order PDF). */
export async function extractPdfText(download: Download): Promise<string> {
  const parser = new PDFParse({ data: await downloadToBuffer(download) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

/** Number of pages in the PDF (used for split-order assertions — 21-40 units = 2 pages). */
export async function getPdfPageCount(download: Download): Promise<number> {
  const parser = new PDFParse({ data: await downloadToBuffer(download) });
  try {
    return (await parser.getInfo()).total;
  } finally {
    await parser.destroy();
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Append " (2)", " (3)" … until the path is free, so one run never clobbers its own evidence. */
function uniquePath(target: string, ext: string): string {
  let candidate = `${target}${ext}`;
  for (let n = 2; fs.existsSync(candidate); n++) candidate = `${target} (${n})${ext}`;
  return candidate;
}

/**
 * Renders a downloaded PDF's page(s) to PNG and writes them into the test's
 * own evidence output directory — so a reviewer watching the recording (which
 * never shows the PDF: the download popup closes the instant `window.open()`
 * triggers the download, before anything renders — see
 * download-evidence.ts's own doc comment) can actually SEE the content the
 * automation asserted on via extractPdfText(), instead of only trusting a
 * text-match assertion. Renders up to the first 2 pages (a split order is at
 * most 2 DOs) so a split's second page is captured too, not just the first.
 * Best-effort throughout: a render failure must never break the test.
 */
export async function renderPdfToEvidence(download: Download, label: string): Promise<void> {
  try {
    const parser = new PDFParse({ data: await downloadToBuffer(download) });
    try {
      const result = await parser.getScreenshot({ scale: 1.5, first: 2 });
      const dir = test.info().outputDir;
      fs.mkdirSync(dir, { recursive: true });
      result.pages.forEach((p, i) => {
        const suffix = result.pages.length > 1 ? ` - page ${i + 1}` : "";
        const dest = uniquePath(path.join(dir, sanitize(`${label}${suffix}`)), ".png");
        fs.writeFileSync(dest, p.data);
      });
    } finally {
      await parser.destroy();
    }
  } catch {
    // best-effort — an evidence render must never break the test
  }
}
