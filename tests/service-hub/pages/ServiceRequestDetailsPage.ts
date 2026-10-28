import { type Page, type Locator, expect, test } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

/**
 * eAuto UCD Portal > Service Hub > Service Request Listing > Service
 * Request Details Page (SRD 2.3.2.3).
 *
 * Verified live (uat4): the Listing's "View" action lands on receipt.do
 * (there is no separate details.do). Real classes confirmed via DOM dump:
 * ".rec-ref" (e.g. "SR67001315"), ".rec-status" (e.g. "Pending"),
 * ".rec-appt-tbl" (columns: # | Appointment Date | Time Slot | Status).
 */
export class ServiceRequestDetailsPage extends BasePage {
  // 1. Page header
  readonly backBtn = this.page.getByText("Back", { exact: false }).first();
  readonly referenceNo = this.page.locator(".rec-ref").first();
  readonly txStatusBadge = this.page.locator(".rec-status").first();

  // 2. Service Request Details panel
  readonly invoiceBtn = this.page.getByRole("button", { name: /^Invoice$/i }).first();
  readonly eInvoiceBtn = this.page.getByRole("button", { name: /e-?Invoice/i }).first();

  // 3. Appointment Details (Software Installation)
  readonly appointmentTable = this.page.locator(".rec-appt-tbl").first();

  // 4. Payment Details
  readonly paymentDetailsSection = this.page.locator("[class*='payment'], .sr-payment").first();

  // Shipping Details block — Biometric Device Purchase records only.
  // Verified live: _reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html
  // (.rec-sec > h4 "Shipping Details", rows as .rec-row > .k / .v spans).
  // NAMING NOTE, 2026-09-23: this whole page used to be called "the UCD
  // Receipt page" in earlier notes/tickets — there is no separate Receipt
  // page. This IS that page (reached from receipt.do), just renamed for
  // clarity; every "UCD Receipt" mention elsewhere means this class.
  readonly shippingSection = this.page.locator(".rec-sec", { has: this.page.locator("h4", { hasText: "Shipping Details" }) });

  // 5. Fee Summary
  readonly feeSummarySection = this.page.locator("[class*='fee'], .sr-fee").first();

  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string) {
    await this.goto(PATHS.requestDetails(txnId));
  }

  async goBack() {
    await this.backBtn.click();
    await this.waitForNav();
  }

  async getTxStatus(): Promise<string> {
    return (await this.txStatusBadge.textContent())?.trim() ?? "";
  }

  /** Rows of the Appointment Details table: #, Date, Time Slot, Status */
  async getAppointmentRows(): Promise<Locator[]> {
    return await this.appointmentTable.locator("tbody tr").all();
  }

  /** Per-appointment status (SRD: Pending/Completed/Failed/Cancelled) */
  async getAppointmentStatus(row: Locator): Promise<string> {
    return (await row.locator("td").last().textContent())?.trim() ?? "";
  }

  async getAppointmentDate(row: Locator): Promise<string> {
    return (await row.locator("td").nth(1).textContent())?.trim() ?? "";
  }

  async getAppointmentTimeSlot(row: Locator): Promise<string> {
    return (await row.locator("td").nth(2).textContent())?.trim() ?? "";
  }

  /**
   * All payment-attempt lines in chronological order. SRD format:
   *   "[Date & time] - [Payment channel (Transaction Ref No)] - [Status]"
   * Failed attempts must remain displayed for reference.
   */
  async getPaymentAttempts(): Promise<string[]> {
    const text = (await this.paymentDetailsSection.textContent()) ?? "";
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /RHB|OK|Failed/i.test(l));
  }

  async getFeeSummary(): Promise<string> {
    return (await this.feeSummarySection.textContent())?.trim() ?? "";
  }

  /** One "Shipping Details" row's value by its label (e.g. "Delivery Order Number:"). */
  private async shippingRow(label: string): Promise<string> {
    const row = this.shippingSection.locator(".rec-row", { has: this.page.locator(".k", { hasText: label }) });
    const value = ((await row.locator(".v").textContent()) ?? "").trim();
    // Green — this row is DATA the test just read/checked, so a reviewer
    // sees exactly where that value (e.g. the DO Number) lives on the page.
    await this.demoHighlight(row, { color: "green" });
    await test.step(`UCD Service Request Details: read "${label}" = "${value}"`, async () => {});
    return value;
  }

  /** "-" until shipped; once Arranged, the assigned DO number(s), comma-separated for split orders. */
  async getDeliveryOrderNumber(): Promise<string> {
    return this.shippingRow("Delivery Order Number:");
  }

  async getDeliveryStatus(): Promise<string> {
    return this.shippingRow("Delivery Status:");
  }

  async getConsignmentNumber(): Promise<string> {
    return this.shippingRow("Consignment Number:");
  }

  /**
   * Verify a same-day-reschedule victim shows Status = Failed. Used by the
   * reschedule spec to confirm the SRD 2.3.2.1 #5 note-iii behaviour.
   */
  async hasFailedAppointment(): Promise<boolean> {
    return this.hasAppointmentWithStatus("fail");
  }

  /** Whether any appointment row's status contains `statusFragment` (case-insensitive). */
  async hasAppointmentWithStatus(statusFragment: string): Promise<boolean> {
    for (const row of await this.getAppointmentRows()) {
      const status = (await this.getAppointmentStatus(row)).toLowerCase();
      if (status.includes(statusFragment.toLowerCase())) return true;
    }
    return false;
  }
}
