/**
 * CIBO — the sidebar: Dashboard · User Account Management · CRM · Transaction Management · Payment Management ·
 * Referred Risk Log · Payment Report · Commission Report · Visitor Management · Agent Management · Discount
 * Code Management · Macrokiosk Template Management · Logout [walk 28.10.2026]. Each entry is an
 * `a[href="/cibo/<route>"]`; it collapses to icons on wide listings, the links stay [walk].
 * Deep links bounced to the dashboard, so modules are always opened by clicking here.
 */

import { expect, type Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { ciboBaseURL } from "@config/environments";
import { CiboPage } from "./cibo.page";

/** Sidebar routes under the CIBO root [walk 28.10.2026; team doc §7]. */
export const CIBO_MODULE = {
  dashboard: "dashboard",
  userAccounts: "user-account-management",
  crm: "crm",
  transactions: "transaction-management",
  payments: "payment-management",
  referredRiskLog: "referred-risk-log",
  paymentReport: "payment-report",
  commissionReport: "commission-report",
  visitors: "visitor-management",
  agents: "agent-management",
  discountCodes: "discount-management",
  macrokiosk: "macrokiosk-template-management",
} as const;
export type CiboModule = keyof typeof CIBO_MODULE;

export class CiboSidebar extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  /** The module's sidebar link, by its href (the CIBO root's own path, normally `/cibo/`). */
  link(module: CiboModule) {
    const base = new URL(ciboBaseURL() ?? "https://invalid/cibo/").pathname; // "/cibo/"
    return this.page.locator(`a[href="${base}${CIBO_MODULE[module]}"]`).first();
  }

  /** Open a module by clicking its sidebar link, then wait out the page's first load (team doc §10). */
  @step("Open a CIBO module from the sidebar")
  async open(module: CiboModule): Promise<void> {
    await this.requireVisible(this.link(module), `CIBO sidebar ${CIBO_MODULE[module]}`);
    await this.link(module).click();
    await expect(this.page).toHaveURL(new RegExp(`/${CIBO_MODULE[module]}(\\?|$|/)`), { timeout: 60_000 });
    await this.settle();
  }
}
