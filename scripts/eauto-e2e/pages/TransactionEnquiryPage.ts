import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { FIELD_RX } from '../data/types';

// ── Steps 5 & 6: Transaction Listing + Transaction Details ──
// The post-purchase record pages, used to prove the created transaction shows
// the same data. Both refresh a few times because status/JPJ resolve
// progressively on staging.
export class TransactionEnquiryPage extends BasePage {
  private vnFilter   = () => this.page.locator('form input[type="text"]:visible, input[type="text"]:visible').first();
  private searchBtn  = () => this.page.locator('button:has-text("Search Now"), input[value*="Search" i]').first();

  /** Search the transaction listing for the vehicle and return its parsed row. */
  async captureListingRow(): Promise<Record<string, string>> {
    this.reporter.progress('listing', 'running', 'Listing');
    await this.announce(`Verifying on Transaction Listing (searching ${CONFIG.vehicleNo})`);
    let listingRow: string[] | null = null;
    for (let attempt = 0; attempt < 4 && !listingRow; attempt++) {
      await this.page.goto(`${CONFIG.baseUrl}/view/ucd/insurance/enquiry/main.jsp`, { waitUntil: 'domcontentloaded' });
      await this.closePopup();
      await this.vnFilter().fill(CONFIG.vehicleNo);
      await this.searchBtn().click().catch(() => {});
      await this.page.waitForTimeout(2000);
      listingRow = await this.page.evaluate((vn) => {
        const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
        document.querySelectorAll('style,script,noscript').forEach((e) => e.remove());
        const tds = Array.from(document.querySelectorAll('td'));
        const cell = tds.find((td) => clean(td.textContent).toUpperCase() === vn.toUpperCase());
        const tr = cell && cell.closest('tr');
        if (!tr) return null;
        return Array.from(tr.querySelectorAll(':scope > td')).map((td) => clean(td.textContent));
      }, CONFIG.vehicleNo);
      if (!listingRow) await this.page.waitForTimeout(1500);
    }

    if (!listingRow) {
      await this.shot('listing-missing', `Transaction Listing — no row for ${CONFIG.vehicleNo}`);
      this.reporter.progress('listing', 'done');
      return { raw: '(row not found)' };
    }

    const cells = listingRow.map((c) => c.replace(/[\s\u00a0\u200b-\u200d\u202f\u2007\ufeff]+/g, ' ').trim());
    const cap = (re: RegExp) => { for (const c of cells) { const m = c.match(re); if (m) return (m[1] || m[0]).trim(); } return ''; };
    const listing: Record<string, string> = {
      raw: cells.join(' | '),
      referenceNo:   cap(/\b([A-Z]{1,3}\d{5,})\b/),
      eCert:         cap(/\b([A-Z0-9]{3,}-\d{5,})\b/),
      status:        cells.find((c) => /Insurance Created|Pending Payment|Failed|Pending Approval|Quotation/i.test(c)) || '',
      paymentAmount: cap(/([\d,]+\.\d{2})/),
      jpj:           cells.find((c) => /Accepted|Rejected/i.test(c)) || '(pending)',
      insured:       cells.find((c) => /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(c) && !/Takaful|Insurance|Berhad/i.test(c)) || '',
    };
    this.reporter.info(`   📄 Listing row: ${listing.raw}`);
    await this.shot('listing', `Transaction Listing — ${CONFIG.vehicleNo} (${listing.status})`, [{ text: CONFIG.vehicleNo, label: 'Our vehicle' }]);
    this.reporter.progress('listing', 'done');
    return listing;
  }

  /** Open Transaction Details for a transaction id and return parsed fields. */
  async captureDetails(txnId: string): Promise<Record<string, string>> {
    this.reporter.progress('details', 'running', 'Details');
    await this.announce('Opening Transaction Details (with refresh)');
    for (let i = 0; i < 3; i++) {
      await this.page.goto(`${CONFIG.baseUrl}/view/ucd/insurance/enquiry/view.do?transactionId=${txnId}`, { waitUntil: 'domcontentloaded' });
      await this.closePopup();
      await this.page.waitForTimeout(1500);
      const st = await this.page.locator('body').innerText().catch(() => '');
      if (/Insurance Created/i.test(st)) break;
    }
    const d = await this.extract([
      'E-Certificate No/Policy No', 'E-Certificate No', 'Submission Status to JPJ', 'Date Issue',
      'Insurance Company', 'Insurance Plan', 'Full Name', 'IC No', 'Email',
      'Vehicle No', 'Vehicle Use', 'Capacity', 'Cover Type',
      'Hire Purchase:', 'Sum Covered', 'Total Nett Contribution After Discount',
    ]);
    const coverD = await this.readCoverType();
    const hpUser = await this.page.evaluate(() => {
      const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      document.querySelectorAll('style,script,noscript').forEach((e) => e.remove());
      const body = clean(document.body.textContent);
      let m = body.match(/User Submission\)\s*:?\s*([A-Za-z][A-Za-z&.\- ]+?Berhad)/i);
      if (m) return clean(m[1]);
      m = body.match(/([A-Za-z][A-Za-z&.\- ]+? Bank Berhad)/i);
      return m ? clean(m[1]) : '';
    });
    const emailD = await this.page.evaluate(() => {
      const clean = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim();
      const body = clean(document.body.innerText);
      const m = body.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
      return m ? m[0] : '';
    });
    const details: Record<string, string> = {
      eCert: (await this.bodyMatch(FIELD_RX.eCert)) || d['E-Certificate No/Policy No'] || d['E-Certificate No'] || '',
      jpj: ((d['Submission Status to JPJ'] || '').replace(/Check JPJ Status/ig, '').trim()) || '(pending)',
      dateIssue: d['Date Issue'] || '',
      company: d['Insurance Company'] || '',
      plan: d['Insurance Plan'] || '',
      insuredName: d['Full Name'] || '',
      ownerIC: d['IC No'] || '',
      email: emailD || d['Email'] || '',
      vehicleRegNo: d['Vehicle No'] || CONFIG.vehicleNo,
      vehicleUse: d['Vehicle Use'] || '',
      capacity: d['Capacity'] || '',
      coverType: this.normalizeCover(coverD),
      hirePurchase: hpUser || '',
      sumCovered: await this.bodyMatch(FIELD_RX.sum),
      totalNett: (await this.bodyMatch(FIELD_RX.totalNett)) || (await this.bodyMatch(FIELD_RX.totalContrib)),
      status: /Insurance Created/i.test(await this.page.locator('body').innerText().catch(() => '')) ? 'Insurance Created' : '',
    };
    this.reporter.info(`   🔎 Details: status=${details.status} · JPJ=${details.jpj} · email=${details.email} · HP=${details.hirePurchase}`);
    await this.shot('details-header', `Details — ${CONFIG.vehicleNo} · ${details.status}`, [
      { text: 'Insurance Created', label: 'Status' },
      { text: 'E-Certificate', label: 'E-Certificate' },
    ]);
    await this.shot('details-insured', 'Details — insured + email', [{ text: 'Email', label: 'Email (verify vs typed)' }]);
    await this.shot('details-vehicle-hp', 'Details — vehicle + hire purchase', [{ text: 'User Submission', label: 'HP User Submission' }]);
    this.reporter.progress('details', 'done');
    return details;
  }
}
