import { BasePage } from './BasePage';
import { INSURANCE_STATUS, PATHS, STATUS_LABEL } from '../utils/paths';

/**
 * Insurance transaction listing. Used to prove the quotation actually persisted
 * — a run that clicked through the steps but left no row created nothing for
 * the cron to find, and the email assertion would then fail for the wrong
 * reason.
 *
 * ⚠️ **Search by vehicle number ONLY. Never drive the status dropdown.**
 * `search()` used to also select a status (e.g. `DRAFT`) before searching, and
 * that hid a row that genuinely existed — the row was there, but combining
 * the vehicle-number filter with a status filter came back empty.
 * `[from Faizuddin, 2026-08-18]` So the status select is never touched here;
 * a row's status is instead read off its own Status cell and matched against
 * `STATUS_LABEL` after the fact.
 *
 * ⚠️ **A run that stopped before step 3 will never show up here, at any
 * status.** Nothing is written server-side until step 3 — see
 * knowledge/eauto-insurance.md § "generated at STEP 3, not at step 1". An empty
 * result for such a run is correct, not a search-filter bug.
 *
 * ⚠️ **An unpaid step-3 row renders `PENDING` ("Pending Payment"), not `DRAFT`
 * ("Quotation").** `[verified: live HTML, 2026-08-18 —
 * _reference/html/eauto/insurance-listing-pending-payment-row.html]` The team's
 * earlier claim that step 3 leaves a DRAFT row does not match what the listing
 * actually shows; trust the capture over the older claim. `RESUMABLE_STATUSES`
 * below is the set this file now treats as "unpaid, resumable" — code that
 * needs "proof this stopped-at-3 run left something behind" should check
 * against that set, not against `DRAFT` alone.
 */
const RESUMABLE_STATUSES = [INSURANCE_STATUS.quotation, INSURANCE_STATUS.pendingPayment];
const RESUMABLE_LABELS = RESUMABLE_STATUSES.map((s) => STATUS_LABEL[s]);

export class InsuranceListingPage extends BasePage {
  async open(): Promise<void> {
    await this.page.goto(PATHS.insuranceListing(), { waitUntil: 'domcontentloaded' });
    await this.dismissBanners();
  }

  /**
   * Search by vehicle number and return every row's Status cell text.
   * Rows render only after `#to-search` — scraping before it finds nothing and
   * looks like a data bug.
   */
  async search(vehicleNo: string): Promise<string[]> {
    await this.page.locator('#search-form input[name=vehicleNo]').fill(vehicleNo);
    await this.page.locator('#to-search').click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
    await this.page.waitForTimeout(1_500);

    const cells = await this.page.locator('table.custom-table tr.odd .status, table.custom-table tr.even .status').allTextContents();
    const statuses = cells.map((c) => c.replace(/\s+/g, ' ').trim());
    this.step(`Listing: ${statuses.length} row(s) for ${vehicleNo} — statuses: ${statuses.join(', ') || '(none)'}`);
    return statuses;
  }

  /**
   * True when the vehicle has an unpaid (Quotation or Pending Payment) row for
   * the cron to pick up.
   *
   * Retries the search rather than trusting one look. A caller just arrived
   * from step 3, where the row is written; if that write lands slightly after
   * the page paints, one search can land in the gap and report "no row"
   * against a run that actually worked. `scripts/eauto-e2e`'s
   * `TransactionEnquiryPage` retries its listing search for the identical
   * reason. Observed as "the transaction wasn't created" on 2026-08-18 — see
   * the step-3 settle wait in `InsuranceStepsPage.expectStep`, which addresses
   * the same gap from the other side.
   */
  async hasQuotation(vehicleNo: string, attempts = 4): Promise<boolean> {
    for (let i = 0; i < attempts; i++) {
      await this.open();
      const statuses = await this.search(vehicleNo);
      if (statuses.some((s) => RESUMABLE_LABELS.includes(s))) return true;
      if (i < attempts - 1) {
        this.step(`No unpaid row yet for ${vehicleNo} — retrying (${i + 1}/${attempts})`);
        await this.page.waitForTimeout(2_000);
      }
    }
    return false;
  }

  /**
   * The transaction id of the newest row for this vehicle. `status` narrows to
   * one `INSURANCE_STATUS` code's label; `statuses` narrows to any of several
   * (e.g. `RESUMABLE_STATUSES`). Omit both for the newest row of any status.
   * The Action link carries the id as an attribute — `a.to-view[data="<uuid>"]`
   * — so there is no URL to scrape and no id to guess.
   */
  async transactionId(vehicleNo: string, opts?: { status?: string; statuses?: string[] }): Promise<string> {
    await this.open();
    const rowStatuses = await this.search(vehicleNo);
    if (!rowStatuses.length) return '';

    const wantLabels = opts?.statuses
      ? opts.statuses.map((s) => STATUS_LABEL[s])
      : opts?.status ? [STATUS_LABEL[opts.status]] : undefined;

    const rows = this.page.locator('table.custom-table tr.odd, table.custom-table tr.even');
    const n = await rows.count();
    for (let i = 0; i < n; i++) {
      if (wantLabels && !wantLabels.includes(rowStatuses[i])) continue;
      const link = rows.nth(i).locator('a.to-view[data]').first();
      if (await link.count()) return ((await link.getAttribute('data')) ?? '').trim();
    }
    return '';
  }

  /** The Status cell of the newest row, e.g. "Pending Payment" / "Insurance Created". */
  async statusOf(vehicleNo: string): Promise<string> {
    await this.open();
    const statuses = await this.search(vehicleNo);
    return statuses[0] ?? '';
  }

  /**
   * Resume an unpaid transaction FROM THE LISTING and land back on the payment
   * step — TS04's whole point: the user drops out at step 3, comes back later
   * through the listing, and finishes there.
   *
   * The real resume control, off the row in
   * `_reference/html/eauto/insurance-listing-pending-payment-row.html`:
   * ```
   * <a href="#" class="to-payment" data="<uuid>" title="to payment B68004346">Resubmit</a>
   * ```
   * `[verified: live HTML, 2026-08-18]` `a.to-payment` and the text "Resubmit"
   * are matched explicitly for that reason, ahead of the earlier, unverified
   * guesses (kept as a fallback in case a different status renders a
   * differently-labelled control).
   */
  async resumeToPayment(vehicleNo: string): Promise<{ transactionId: string; via: string }> {
    // Same race hasQuotation() already retries for: the step-3 row can commit
    // server-side slightly after the page that wrote it moves on, so a
    // caller landing here right after a short drop-off (QR_DROP_OFF_SECONDS
    // defaults to 10s) could search a beat too early, find nothing, and throw
    // — which reads as "it gave up at the listing without buying" rather than
    // what it is: a lookup that needed one more try. `[from Faizuddin, 2026-08-19]`
    let id = '';
    const attempts = 4;
    for (let i = 0; i < attempts; i++) {
      id = await this.transactionId(vehicleNo, { statuses: RESUMABLE_STATUSES });
      if (id) break;
      if (i < attempts - 1) {
        this.step(`No unpaid row yet for ${vehicleNo} — retrying (${i + 1}/${attempts})`);
        await this.page.waitForTimeout(2_000);
      }
    }
    if (!id) {
      throw new Error(`No unpaid (Quotation or Pending Payment) row for ${vehicleNo} on the insurance listing — there is nothing to resume. The run must reach step 3 for one to exist.`);
    }

    const onPayment = () => this.page.locator('body#payment');
    const resumeControl = (scope = 'table.custom-table tr') => this.page.locator(
      `${scope} a.to-payment[data="${id}"], ${scope} a:has-text("Resubmit"), ` +
      `${scope} a[href*="payment.do"], ${scope} a.to-pay, ${scope} a[title*="pay" i], ` +
      `${scope} a:has-text("Continue"), ${scope} a:has-text("Complete"), ${scope} a:has-text("Pay")`,
    ).first();

    // 1 — straight from the row.
    if (await resumeControl().count()) {
      await resumeControl().click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
      if (await onPayment().isVisible({ timeout: 30_000 }).catch(() => false)) {
        this.step('Resumed to payment from the listing row');
        return { transactionId: id, via: 'listing row action' };
      }
    }

    // 2 — through the details page.
    await this.open();
    await this.search(vehicleNo);
    const view = this.page.locator(`table.custom-table a.to-view[data="${id}"]`).first();
    if (await view.count()) {
      await view.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
      const onDetails = resumeControl('body');
      if (await onDetails.count()) {
        await onDetails.click();
        await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
        if (await onPayment().isVisible({ timeout: 30_000 }).catch(() => false)) {
          this.step('Resumed to payment from the transaction details page');
          return { transactionId: id, via: 'details page action' };
        }
      }
    }

    throw new Error(
      `Could not get from the insurance listing back to the payment step for ${vehicleNo} (transaction ${id}). ` +
      'Neither the "Resubmit" control on the row nor one on the details page reached body#payment. ' +
      'Check the video for what the row actually offered.',
    );
  }
}
