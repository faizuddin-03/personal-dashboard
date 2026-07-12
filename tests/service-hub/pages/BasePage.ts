import { type Page, type Locator, expect } from "@playwright/test";
import { ENV } from "../utils/config";

export class BasePage {
  readonly page: Page;
  readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = ENV.baseUrl;
  }

  async goto(path: string) {
    await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: "networkidle" });
  }

  async waitForNav() {
    await this.page.waitForLoadState("networkidle");
  }

  /** Extract txnId from current URL query param */
  getTxnIdFromUrl(): string {
    const url = new URL(this.page.url());
    return url.searchParams.get("txnId") ?? "";
  }

  /** Accept the JS confirm dialog ("Sure to submit this payment?") */
  async acceptConfirmDialog() {
    this.page.once("dialog", (dialog) => dialog.accept());
  }

  /** Dismiss the JS confirm dialog */
  async dismissConfirmDialog() {
    this.page.once("dialog", (dialog) => dialog.dismiss());
  }

  /** Get today's date string as YYYY-MM-DD */
  today(): string {
    return new Date().toISOString().split("T")[0];
  }

  /** Get a date N days from today as YYYY-MM-DD */
  daysFromToday(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  }

  /** Earliest bookable date for UCD reschedule (+2 days blackout) */
  earliestRescheduleDate(): string {
    return this.daysFromToday(ENV.reschedule.blackoutDays);
  }
}
