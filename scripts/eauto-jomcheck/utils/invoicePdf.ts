import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { CONFIG } from '../data/config';
import { capturePdfWithHighlights, HighlightSpec } from './pdfHighlight';

// EAINT-12412 — JomCheck invoice / e-Invoice split into 2 line items.
// Shared by tests/invoice-split-12412*.spec.ts. Every expected string and
// amount below comes from the re-uploaded SRD v1.0 (2026-10-09):
//   REQ-002  line 1 "JomCheck report":         18.00 | 1.44 | 19.44
//   REQ-003  line 2 "JomCheck service charge":  2.00 | 0.16 |  2.16
//   REQ-004  totals                            20.00 | 1.60 | 21.60
//   REQ-006  e-Invoice: both lines classification code 022
//   REQ-001  approved BEFORE deployment: 1 line "JomCheck service charge"
//            20.00 | 1.60 | 21.60, e-Invoice not resubmitted.
// Text is `pdf-parse` output, whitespace collapsed, UPPERCASE — same shape
// as every other PDF check in this suite (knowledge/flow-jomcheck.md §7d).

export const TWO_LINE_AMOUNTS = ['18.00', '1.44', '19.44', '2.00', '0.16', '2.16', '20.00', '1.60', '21.60'] as const;
export const ONE_LINE_AMOUNTS = ['20.00', '1.60', '21.60'] as const;
/** Amounts that only exist once the fee is split — must be ABSENT on a 1-line invoice. */
export const SPLIT_ONLY_AMOUNTS = ['18.00', '1.44', '19.44', '0.16', '2.16'] as const;
export const LINE_1 = 'JOMCHECK REPORT';
export const LINE_2 = 'JOMCHECK SERVICE CHARGE';
export const CLASSIFICATION_CODE = '022';

export interface PdfDownload {
  /** Where the PDF was saved — evidence dir when PW_EVIDENCE_DIR is set, else a temp file. */
  filePath: string;
  persisted: boolean;
  text: string;
  /** How the button delivered the file — printed as a DETAIL line so the
   *  first live run tells us which path the real page takes. */
  via: 'download' | 'popup-download' | 'popup-fetch';
}

const normalise = (t: string) => t.replace(/\s+/g, ' ').trim().toUpperCase();

/**
 * Clicks an Invoice / e-Invoice button and saves the PDF it produces.
 *
 * Confirmed by Faizuddin, 2026-10-15: `#to-print-invoice` and
 * `#to-print-e-invoice` DOWNLOAD the PDF directly (the "download" path
 * below). The popup branches are kept only as a safety net — if a run ever
 * reports "delivered via popup-…", the page behaviour changed.
 */
/** What the evidence screenshot checks and how it colours it (green = right,
 *  red = wrong / missing) — see utils/pdfHighlight.ts. */
export function buildHighlightSpec(text: string, isEInvoice: boolean, layout: InvoiceLayout): HighlightSpec {
  const facts = extractInvoiceFacts(text);
  const lines = layout === 'two-line' ? [LINE_1, LINE_2] : [LINE_2];
  const TOTAL_ROWS = { '20.00': ['TOTAL NET AMOUNT', 'SUBTOTAL'], '1.60': ['TAX AMOUNT'], '21.60': ['TOTAL PAYABLE AMOUNT'] };
  const spec: HighlightSpec = layout === 'two-line'
    ? {
        expected: [...lines, ...TWO_LINE_AMOUNTS, ...(isEInvoice ? [CLASSIFICATION_CODE] : []), facts.documentCode, facts.paymentRef],
        anchors: {
          '18.00': [LINE_1], '1.44': [LINE_1], '19.44': [LINE_1],
          '2.00': [LINE_2], '0.16': [LINE_2], '2.16': [LINE_2],
          ...TOTAL_ROWS,
        },
      }
    : {
        expected: [...lines, ...ONE_LINE_AMOUNTS, ...(isEInvoice ? [CLASSIFICATION_CODE] : []), facts.documentCode, facts.paymentRef],
        // A pre-push document must not carry the split.
        forbidden: [LINE_1, ...SPLIT_ONLY_AMOUNTS],
        anchors: { '20.00': [LINE_2, ...TOTAL_ROWS['20.00']], '1.60': [LINE_2, ...TOTAL_ROWS['1.60']], '21.60': [LINE_2, ...TOTAL_ROWS['21.60']] },
      };
  if (isEInvoice) spec.perLine = { code: CLASSIFICATION_CODE, lines };
  return spec;
}

/** Which layout this document is expected to have — decides the colours on
 *  the evidence screenshot. 'two-line' = after the CR (default); 'one-line' =
 *  approved before the push (TS06, SETUP_APPROVED). */
export type InvoiceLayout = 'two-line' | 'one-line';

export async function downloadPdfViaButton(page: Page, button: Locator, label: string, layout: InvoiceLayout = 'two-line'): Promise<PdfDownload> {
  const evidenceDir = process.env.PW_EVIDENCE_DIR;
  const persisted = !!evidenceDir;
  const safeLabel = label.replace(/[^\w.-]+/g, '_');
  const filePath = persisted
    ? path.join(evidenceDir!, `${safeLabel}.pdf`)
    : path.join(os.tmpdir(), `jomcheck-12412-${safeLabel}-${Date.now()}.pdf`);
  if (persisted) fs.mkdirSync(evidenceDir!, { recursive: true });

  const timeout = CONFIG.invoiceDownloadTimeout;
  const downloadP = page.waitForEvent('download', { timeout }).then(d => ({ kind: 'download' as const, d })).catch(() => null);
  const popupP = page.context().waitForEvent('page', { timeout }).then(p => ({ kind: 'popup' as const, p })).catch(() => null);

  await button.click();
  const first = await Promise.race([downloadP, popupP]);
  if (!first) throw new Error(`Clicking "${label}" produced neither a download nor a new tab within ${timeout / 1000}s.`);

  let via: PdfDownload['via'];
  if (first.kind === 'download') {
    await first.d.saveAs(filePath);
    via = 'download';
  } else {
    const popup = first.p;
    try {
      // A popup can itself trigger a download, or just render the PDF.
      const popupDownload = await popup.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
      if (popupDownload) {
        await popupDownload.saveAs(filePath);
        via = 'popup-download';
      } else {
        await popup.waitForLoadState('load', { timeout }).catch(() => {});
        const url = popup.url();
        if (!url || url === 'about:blank') throw new Error(`The "${label}" tab opened but has no URL to fetch the PDF from.`);
        const resp = await page.request.get(url);
        if (!resp.ok()) throw new Error(`Fetching the "${label}" PDF from ${url} returned HTTP ${resp.status()}.`);
        fs.writeFileSync(filePath, await resp.body());
        via = 'popup-fetch';
      }
    } finally {
      await popup.close().catch(() => {});
    }
  }

  const buf = fs.readFileSync(filePath);
  if (!buf.slice(0, 5).toString('latin1').startsWith('%PDF')) {
    throw new Error(`"${label}" did not produce a PDF (first bytes: ${JSON.stringify(buf.slice(0, 12).toString('latin1'))}).`);
  }
  const data = await pdfParse(buf);
  const text = normalise(data.text);
  console.log(`DETAIL:${JSON.stringify({ label: `${label} delivered via`, value: via })}`);

  // Evidence screenshot of THIS PDF with every checked item boxed (skill §2
  // rule). Taken right after the download, before any assertion can fail,
  // and saved next to the PDF as "<label>-checked.png" so it lands in the
  // same TS's evidence and zip. Only when evidence is being kept.
  if (persisted) {
    const isEInvoice = /e-?invoice/i.test(label);
    const spec = buildHighlightSpec(text, isEInvoice, layout);
    const shot = await capturePdfWithHighlights(
      page, filePath, `${safeLabel}-checked`, spec,
      `${label} — expected ${layout === 'two-line' ? '2 lines (after the CR)' : '1 line (approved before the push)'}. Green = correct, red = wrong or missing.`,
    );
    console.log(`DETAIL:${JSON.stringify({
      label: `${label} — highlighted screenshot`,
      value: shot.saved
        ? `saved; ${shot.found.length} green${shot.wrong.length ? `, ${shot.wrong.length} red (${shot.wrong.join('; ')})` : ''}${shot.missing.length ? `; not on the PDF: ${shot.missing.join(', ')}` : ''}`
        : `not saved — ${shot.error}`,
    })}`);
  } else {
    fs.rmSync(filePath, { force: true });
  }
  return { filePath, persisted, text, via };
}

export interface InvoiceFacts {
  documentCode: string;
  paymentRef: string;
  hasLine1: boolean;
  hasLine2: boolean;
  /** Every RM amount printed, sorted — the cheapest exact "same invoice" check. */
  amounts: string[];
  classificationCodes: number;
}

/** Pulls the comparable facts out of an invoice / e-Invoice's text. Field
 *  labels per the 30 Sep samples (`_reference/tickets/EAINT-12412/*-sample-*.txt`). */
export function extractInvoiceFacts(text: string): InvoiceFacts {
  const t = normalise(text);
  return {
    // The e-Invoice prints "e-INVOICE" near its top, so a label-based pattern
    // read "E-INVOICE" there; both documents carry the real code as
    // EA-IV-<MMYY>-<running no.> (live uat1, 2026-10-19).
    documentCode: /(EA-[A-Z]{2}-\d{4}-\d+)/.exec(t)?.[1] ?? '',
    // Live invoice text: "PAYMENT REFERENCE NO. :19 OCT 2026 :JOM261019000001-HXA0280A"
    // — the label is followed by the date, so match the reference itself.
    paymentRef: /(JOM\d{6,}-[A-Z0-9]+)/.exec(t)?.[1] ?? '',
    hasLine1: t.includes(LINE_1),
    hasLine2: t.includes(LINE_2),
    amounts: (t.match(/\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g) ?? []).sort(),
    // pdf-parse glues the code to the description ("022JOMCHECK REPORT" on
    // the live e-Invoice, 2026-10-19), so there is no word boundary after
    // it — count 022 that is not part of a longer number instead.
    classificationCodes: (t.match(/(?<!\d)022(?!\d)/g) ?? []).length,
  };
}

const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);

/** REQ-002/003/004: the 2-line breakdown. `what` names the document in failures. */
export function expectTwoLineBreakdown(text: string, what: string): void {
  const t = normalise(text);
  detail(`${what} — line items`, `${t.includes(LINE_1) ? 'JomCheck report' : '(no JomCheck report line)'} + ${t.includes(LINE_2) ? 'JomCheck service charge' : '(no JomCheck service charge line)'}`);
  expect(t, `${what}: line 1 "JomCheck report" is missing`).toContain(LINE_1);
  expect(t, `${what}: line 2 "JomCheck service charge" is missing`).toContain(LINE_2);
  for (const amount of TWO_LINE_AMOUNTS) {
    expect(t, `${what}: amount RM${amount} is missing`).toContain(amount);
  }
}

/** REQ-001 Example 2: a transaction approved BEFORE deployment keeps the single line. */
export function expectSingleLineBreakdown(text: string, what: string): void {
  const t = normalise(text);
  detail(`${what} — line items`, t.includes(LINE_1) ? 'JomCheck report + JomCheck service charge (SPLIT — unexpected)' : 'JomCheck service charge only');
  expect(t, `${what}: the single line "JomCheck service charge" is missing`).toContain(LINE_2);
  expect(t, `${what}: a "JomCheck report" line appeared on a pre-deployment transaction`).not.toContain(LINE_1);
  for (const amount of ONE_LINE_AMOUNTS) {
    expect(t, `${what}: amount RM${amount} is missing`).toContain(amount);
  }
  for (const amount of SPLIT_ONLY_AMOUNTS) {
    expect(t, `${what}: split-only amount RM${amount} appeared on a pre-deployment transaction`).not.toContain(amount);
  }
}

/**
 * SRD REQ-006 c: "Both line items use classification code 022". Checked PER
 * LINE: the e-Invoice prints the code in the Classification column right
 * before each description, and pdf-parse joins the two
 * ("022JOMCHECK REPORT…", "022JOMCHECK SERVICE CHARGE…" — live uat1
 * e-Invoice, 2026-10-19). So each line must read "022" immediately followed
 * by its own description. A plain count of "022" in the text is not used:
 * it cannot tell which line the code belongs to. `lines` is the lines the
 * document should carry (2 after the CR, 1 before it).
 */
export function expectClassificationCodes(eInvoiceText: string, lines: 1 | 2, what: string): void {
  const t = normalise(eInvoiceText);
  const want = lines === 2 ? [LINE_1, LINE_2] : [LINE_2];
  const onLine = (line: string) => new RegExp(`(?<!\\d)${CLASSIFICATION_CODE}\\s*${line}`).test(t);
  detail(`${what} — classification code ${CLASSIFICATION_CODE}`, want.map(l => `${l}: ${onLine(l) ? CLASSIFICATION_CODE : 'not found'}`).join(' · '));
  for (const line of want) {
    expect(onLine(line), `${what}: line "${line}" does not carry classification code ${CLASSIFICATION_CODE}`).toBe(true);
  }
}

/** Invoice vs e-Invoice (TS "e-Invoice -> Same 2 lines as the Invoice"):
 *  different documents with different codes and layouts, so only the line
 *  items are compared. Live run 2026-10-19 failed comparing them as one
 *  document (document code "EA-IV-…" vs "E-INVOICE"). */
export function expectSameLines(invoice: string, eInvoice: string, what: string): void {
  const fa = extractInvoiceFacts(invoice);
  const fb = extractInvoiceFacts(eInvoice);
  detail(`${what} — line items (Invoice | e-Invoice)`, `${[fa.hasLine1 && 'JomCheck report', fa.hasLine2 && 'JomCheck service charge'].filter(Boolean).join(' + ') || '-'} | ${[fb.hasLine1 && 'JomCheck report', fb.hasLine2 && 'JomCheck service charge'].filter(Boolean).join(' + ') || '-'}`);
  expect(fb.hasLine1, `${what}: "JomCheck report" line present on one side only`).toBe(fa.hasLine1);
  expect(fb.hasLine2, `${what}: "JomCheck service charge" line present on one side only`).toBe(fa.hasLine2);
}

/** REQ-005: UCD and BackOffice show the same document for one transaction. */
export function expectSameDocument(a: string, b: string, what: string): void {
  const fa = extractInvoiceFacts(a);
  const fb = extractInvoiceFacts(b);
  detail(`${what} — document code (UCD | BO)`, `${fa.documentCode || '-'} | ${fb.documentCode || '-'}`);
  detail(`${what} — payment reference (UCD | BO)`, `${fa.paymentRef || '-'} | ${fb.paymentRef || '-'}`);
  if (fa.documentCode && fb.documentCode) expect(fa.documentCode, `${what}: document code differs`).toBe(fb.documentCode);
  if (fa.paymentRef && fb.paymentRef) expect(fa.paymentRef, `${what}: payment reference differs`).toBe(fb.paymentRef);
  expect(fa.hasLine1, `${what}: "JomCheck report" line present on one side only`).toBe(fb.hasLine1);
  expect(fa.hasLine2, `${what}: "JomCheck service charge" line present on one side only`).toBe(fb.hasLine2);
  expect(fa.amounts, `${what}: printed amounts differ`).toEqual(fb.amounts);
}

/** Header values worth keeping in the Details panel (REQ-001 "not resubmitted"
 *  is checked by a person in MyInvois — these make that comparison quick). */
export function logEInvoiceHeader(text: string, what: string): void {
  const t = normalise(text);
  const grab = (re: RegExp) => re.exec(t)?.[1]?.trim() ?? '-';
  detail(`${what} — Unique Identifier No.`, grab(/UNIQUE IDENTIFIER NO\.?\s*:?\s*([A-Z0-9-]+)/));
  detail(`${what} — Submission Date`, grab(/SUBMISSION DATE\s*:?\s*(.+?)\s+VALIDATION DATE/));
  detail(`${what} — Document Code`, grab(/DOCUMENT CODE\s*:?\s*([A-Z0-9-]+)/));
}
