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

  getTxnIdFromUrl(): string {
    const url = new URL(this.page.url());
    return url.searchParams.get("txnId") ?? "";
  }

  /** Accept the jQuery UI confirmation dialog (clicks the "Yes" button) */
  async acceptConfirmDialog() {
    await this.page.locator(".confirm-dialog-btn").click();
  }

  /** Dismiss the jQuery UI confirmation dialog (clicks the "No" button) */
  async dismissConfirmDialog() {
    await this.page.locator(".cancel-dialog-btn").click();
  }

  /** Wait for the jQuery UI dialog to appear */
  async waitForDialog() {
    await this.page.locator(".ui-dialog").waitFor({ state: "visible", timeout: 5000 });
  }

  today(): string {
    return new Date().toISOString().split("T")[0];
  }

  daysFromToday(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  }

  earliestRescheduleDate(): string {
    return this.daysFromToday(ENV.reschedule.blackoutDays);
  }
}
