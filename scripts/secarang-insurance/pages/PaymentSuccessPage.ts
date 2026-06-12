import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { BasePage } from './BasePage';
import { SiteGatePage } from './SiteGatePage';

export class PaymentSuccessPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForPage(sitePassword: string): Promise<void> {
    // May show site password gate again after returning to main window
    const siteGate = new SiteGatePage(this.page);
    await siteGate.passSiteGate(sitePassword);

    const appeared = await this.poll(async () => {
      const t = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
      return /payment successful|thank you for your purchase/i.test(t);
    }, 60_000);

    if (!appeared) {
      const snippet = (await this.page.locator('body').innerText().catch(() => '')).slice(0, 300);
      throw new Error(`Payment success page did not appear. Page: ${snippet}`);
    }

    await this.wait(1000);
  }

  async extractData(): Promise<Record<string, string>> {
    const successData: Record<string, string> = await this.page.evaluate(() => {
      const result: Record<string, string> = {};
      const container = document.querySelector('app-payment-success .d-print-none');
      if (!container) return result;

      container.querySelectorAll('.row.mb-2, .row.mb-4, .row.mb-5').forEach(row => {
        // Pattern 1: .text-muted label
        const muted = row.querySelector('.text-muted');
        if (muted) {
          const label = (muted.textContent || '').replace(/\s+/g, ' ').trim();
          if (!label) return;
          let value = '';
          for (const col of Array.from(row.querySelectorAll('[class*="col"]'))) {
            if (col !== muted && !(col as Element).contains(muted)) {
              const t = (col.textContent || '').replace(/\s+/g, ' ').trim();
              if (t) { value = t; break; }
            }
          }
          if (value) result[label] = value;
          return;
        }
        // Pattern 2: .col label + .col-auto value (pricing)
        const cols = Array.from(row.querySelectorAll('.col, .col-auto'));
        if (cols.length >= 2) {
          const label = (cols[0].textContent || '').replace(/\s+/g, ' ').trim();
          const value = (cols[cols.length - 1].textContent || '').replace(/\s+/g, ' ').trim();
          if (label && value && label !== value) result[label] = value;
        }
      });
      return result;
    });

    const receiptNo     = successData['Receipt No']     || '';
    const purchaseDate  = successData['Purchase Date']  || '';
    const paymentMethod = successData['Payment Method'] || '';

    console.log(`\n   🧾 Receipt: ${receiptNo}  |  Date: ${purchaseDate}  |  Method: ${paymentMethod}`);
    console.log(`   📊 Success page fields: ${Object.keys(successData).join(', ')}`);

    return successData;
  }

  async downloadReceiptPDF(outputDir: string): Promise<string | null> {
    const dlBtn = this.page.locator('button:has-text("Receipt"), a:has-text("Receipt")').first();
    if ((await dlBtn.count()) === 0 || !(await dlBtn.isVisible().catch(() => false))) {
      console.log('   ℹ️  No Receipt download button found — skipping PDF check');
      return null;
    }

    console.log('   📥 Downloading receipt PDF…');
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 30_000 }),
      dlBtn.click(),
    ]);

    const tmpPath = path.join(outputDir, `receipt-${Date.now()}.pdf`);
    await download.saveAs(tmpPath);
    console.log(`   💾 PDF saved to: ${tmpPath}`);

    try {
      const buf = fs.readFileSync(tmpPath);
      const data = await pdfParse(buf);
      const text = data.text.replace(/\s+/g, ' ').trim();
      console.log(`   📄 PDF text (${text.length} chars):\n${text.slice(0, 800)}`);
      return text;
    } catch (e) {
      console.log(`   ⚠️  Failed to parse PDF: ${e}`);
      return null;
    }
  }

  generateVerificationReport(
    confirmData: Record<string, string>,
    successData: Record<string, string>,
    vehicleNumber: string,
    targetInsurer: string,
    pdfText: string | null,
  ): string {
    // ── Build comparison ──────────────────────────────────────────────────────
    interface Row { label: string; confirmed: string; success: string; match: boolean; }

    const receiptNo     = successData['Receipt No']     || '';
    const purchaseDate  = successData['Purchase Date']  || '';
    const paymentMethod = successData['Payment Method'] || '';

    function normalise(s: string) { return s.replace(/\s+/g, ' ').trim().toUpperCase(); }
    function normPhone(s: string) { return s.replace(/^\+?60/, '').replace(/\s/g, ''); }

    function cmp(label: string, confirmKey: string, successKey: string, phoneMode = false): Row {
      const c = confirmData[confirmKey] || '';
      const s = successData[successKey] || '';
      let match: boolean;
      if (phoneMode) {
        match = normPhone(normalise(c)) === normPhone(normalise(s));
      } else {
        // Name may be truncated on success page — check if success contains first two words
        const cWords = normalise(c).split(' ');
        match = normalise(s) === normalise(c) ||
                (cWords.length > 2 && normalise(s).includes(cWords.slice(0, 2).join(' ')));
      }
      return { label, confirmed: c, success: s, match };
    }

    const vehicleRows: Row[] = [
      cmp('Plate No',     'Plate No',     'Plate No'),
      cmp('Model',        'Model',        'Model'),
      cmp('Year',         'Year',         'Year'),
      cmp('Variant',      'Variant',      'Variant'),
      cmp('Transmission', 'Transmission', 'Transmission'),
      cmp('Seat',         'Seat',         'Seat'),
      cmp('cc',           'cc',           'cc'),
    ];

    const ownerRows: Row[] = [
      cmp('Full Name',        'Full Name',        'Full Name'),
      cmp('IC No',            'IC No',            'IC No'),
      cmp('Email',            'Email',            'Email'),
      cmp('Mobile Phone No.', 'Mobile Phone No.', 'Mobile Phone No.', true),
    ];

    const pricingRows: Row[] = [
      cmp('Basic Premium',     'Basic Premium',     'Basic Premium'),
      cmp('Premium After NCD', 'Premium After NCD', 'Premium After NCD'),
      cmp('Gross Premium',     'Gross Premium',     'Gross Premium'),
      cmp('Service Tax 8%',    'Service Tax 8%',    'Service Tax 8%'),
      cmp('Stamp Duty',        'Stamp Duty',        'Stamp Duty'),
      cmp('Total Premium',     'Total Premium',     'Total Premium'),
    ];

    // ── Format table ──────────────────────────────────────────────────────────
    const W = { f: 22, v: 28, ok: 4 };
    const pad  = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n);
    const divider  = `├${'─'.repeat(W.f + 2)}┼${'─'.repeat(W.v + 2)}┼${'─'.repeat(W.v + 2)}┼${'─'.repeat(W.ok + 2)}┤`;
    const topLine  = `┌${'─'.repeat(W.f + 2)}┬${'─'.repeat(W.v + 2)}┬${'─'.repeat(W.v + 2)}┬${'─'.repeat(W.ok + 2)}┐`;
    const botLine  = `└${'─'.repeat(W.f + 2)}┴${'─'.repeat(W.v + 2)}┴${'─'.repeat(W.v + 2)}┴${'─'.repeat(W.ok + 2)}┘`;
    const heading  = `│ ${pad('Field', W.f)} │ ${pad('Confirmation Page', W.v)} │ ${pad('Success Page', W.v)} │ ${'OK'.padEnd(W.ok)} │`;

    const fmtRow = (r: Row) =>
      `│ ${pad(r.label, W.f)} │ ${pad(r.confirmed, W.v)} │ ${pad(r.success, W.v)} │ ${r.match ? '✅  ' : '❌  '} │`;

    const section = (title: string, rows: Row[]) => [
      `  ${title}`,
      `  ${topLine}`,
      `  ${heading}`,
      `  ${divider}`,
      ...rows.map(r => `  ${fmtRow(r)}`),
      `  ${botLine}`,
      '',
    ].join('\n');

    const allRows = [...vehicleRows, ...ownerRows, ...pricingRows];
    const passed  = allRows.filter(r => r.match).length;
    const failed  = allRows.filter(r => !r.match).length;
    const hr = '  ' + '━'.repeat(W.f + W.v * 2 + 16);

    const report = [
      '',
      hr,
      `  PAYMENT VERIFICATION REPORT`,
      `  Receipt : ${receiptNo}`,
      `  Date    : ${purchaseDate}`,
      `  Method  : ${paymentMethod}`,
      `  Vehicle : ${vehicleNumber}  |  Insurer : ${targetInsurer}`,
      hr,
      '',
      section('VEHICLE DETAILS',  vehicleRows),
      section('OWNER DETAILS',    ownerRows),
      section('PRICING',          pricingRows),
      `  RESULT  : ${failed === 0 ? '✅  ALL CHECKS PASSED' : `❌  ${failed} MISMATCH(ES) FOUND`}  (${passed} / ${allRows.length})`,
      hr,
      '',
    ].join('\n');

    console.log(report);

    // ── PDF receipt check ─────────────────────────────────────────────────────
    let fullReport = report;
    if (pdfText) {
      const pdfReport = this._comparePDFWithSuccess(pdfText, successData, vehicleNumber);
      console.log(pdfReport);
      fullReport += pdfReport;
    }

    return fullReport;
  }

  private _comparePDFWithSuccess(
    pdfText: string,
    successData: Record<string, string>,
    vehicleNumber: string,
  ): string {
    // Normalise: collapse whitespace, uppercase
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase();
    const pdfNorm = norm(pdfText);

    interface PdfRow { label: string; expected: string; found: boolean; }

    const checks: PdfRow[] = [
      { label: 'Receipt No',       expected: successData['Receipt No']       || '' },
      { label: 'Plate No',         expected: successData['Plate No']         || vehicleNumber },
      { label: 'Model',            expected: successData['Model']            || '' },
      { label: 'Full Name',        expected: successData['Full Name']        || '' },
      { label: 'IC No',            expected: successData['IC No']            || '' },
      { label: 'Email',            expected: successData['Email']            || '' },
      { label: 'Total Premium',    expected: successData['Total Premium']    || '' },
      { label: 'Basic Premium',    expected: successData['Basic Premium']    || '' },
      { label: 'Gross Premium',    expected: successData['Gross Premium']    || '' },
      { label: 'Stamp Duty',       expected: successData['Stamp Duty']       || '' },
    ].map(c => ({ ...c, found: !!c.expected && pdfNorm.includes(norm(c.expected)) }));

    const passed = checks.filter(c => c.found).length;
    const failed = checks.filter(c => !c.found).length;

    const W = { f: 22, v: 30 };
    const pad = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n);
    const top = `┌${'─'.repeat(W.f + 2)}┬${'─'.repeat(W.v + 2)}┬──────┐`;
    const bot = `└${'─'.repeat(W.f + 2)}┴${'─'.repeat(W.v + 2)}┴──────┘`;
    const div = `├${'─'.repeat(W.f + 2)}┼${'─'.repeat(W.v + 2)}┼──────┤`;
    const hdr = `│ ${pad('Field', W.f)} │ ${pad('Expected Value', W.v)} │ In PDF │`;
    const hr  = '  ' + '━'.repeat(W.f + W.v + 16);

    const rows = checks.map(c =>
      `  │ ${pad(c.label, W.f)} │ ${pad(c.expected, W.v)} │ ${c.found ? '✅    ' : '❌    '} │`
    );

    return [
      '',
      hr,
      '  PDF RECEIPT VERIFICATION',
      hr,
      `  ${top}`,
      `  ${hdr}`,
      `  ${div}`,
      ...rows,
      `  ${bot}`,
      '',
      `  RESULT  : ${failed === 0 ? '✅  ALL FIELDS FOUND IN PDF' : `❌  ${failed} FIELD(S) NOT FOUND`}  (${passed} / ${checks.length})`,
      hr,
      '',
    ].join('\n');
  }
}
