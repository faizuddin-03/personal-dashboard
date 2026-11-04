/**
 * CIBO — Payment Management (`/cibo/payment-management`), listing "Payment Listing": gateway payments
 * [walk 28.10.2026; team doc §8].
 * Filters: `selectedPlatform` (Secarang > Secarang only, Secarang-MK; eAuto), `selectedBank` = Payment Channel
 * (a checkbox tree, e.g. group "Fiuu - eWallet" > GrabPay, GrabPay - PayLater by Grab, ShopeePay),
 * `selectedPaymentStatus` (Failed, New, OK, Pending), dates `fromPaymentDate` / `toPaymentDate`, `search`.
 * Columns: # · Insured · Transaction Ref. No. · Vehicle No · Payment Channel · Payment · Payment Ref ID ·
 * RHB Ref ID · Response. No insurer or agency filter / column; no row detail. ~224 pages, ~8 s per search.
 * Trap: opening it starts a slow unfiltered load; searching before it ends lets that answer land last
 * (team doc §10) — `searchListing` waits it out first.
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, type CiboRow } from "./cibo.page";

export interface CiboPaymentFilter {
  platform?: string[];
  channel?: string[];
  /**
   * Payment Channel by group (29.10.2026, EAINT-12406 RC): a group header alone ticks every channel under it
   * ("Credit / Debit Card", "FPX Online Banking", "Fiuu - eWallet" …); with `option`, only that channel under that
   * group ("GrabPay" is under "eWallet" AND "Fiuu - eWallet") [probe rc-cibo-markup / rc-cibo-pm6].
   */
  channelIn?: { group: string; option?: string }[];
  status?: string[];
  from?: Date;
  till?: Date;
  text?: string;
}

export class CiboPaymentManagementPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  @step("Search the CIBO Payment Listing")
  async searchListing(f: CiboPaymentFilter = {}): Promise<CiboRow[]> {
    await this.settle();
    if (f.platform) await this.pick("selectedPlatform", f.platform);
    if (f.channel) await this.pick("selectedBank", f.channel);
    if (f.channelIn?.length && !f.channel) await this.clearSelect("selectedBank"); // the channels of an earlier search stay ticked
    for (const c of f.channelIn ?? []) await this.pickInGroup("selectedBank", c.group, c.option);
    if (f.status) await this.pick("selectedPaymentStatus", f.status);
    if (f.till) await this.pickDate("toPaymentDate", f.till);
    if (f.from) await this.pickDate("fromPaymentDate", f.from);
    if (f.text !== undefined) await this.searchText(f.text);
    const status = await this.search();
    if (await this.searchFailed(status)) throw new Error(`CIBO Payment Listing search answered HTTP ${status}.`);
    return this.readTable("Transaction Ref. No.");
  }
}
