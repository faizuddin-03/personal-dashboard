/**
 * Secarang — FAQs (`/ia/faq`, not "faqs"), reached from the top menu. "Frequently Asked Questions (FAQs)", Topics 1-3,
 * 20 questions, each an `app-collapsable` (see SecarangPage.collapsables): all closed on load. The answer to
 * "Which insurers can I get instant quotation from?" is a `ul.pl-3` of `li` (list-style disc) [probe
 * cr/EAINT-12406/03-spec/probes-automation/cp-pages-probe.mjs, 29.10.2026].
 *
 * Written 29.10.2026 for EAINT-12406 sheet CP (REQ-008). Selectors seen on staging /ia/ after the deploy.
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean } from "./secarang.page";

export const FAQ_WHICH_INSURERS = "Which insurers can I get instant quotation from?";

export class SecarangFaqPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  /** One question's block, by its question text. */
  question(text: string): Locator {
    return this.collapsables().filter({ has: this.page.locator(".collapsable-header", { hasText: text }) }).first();
  }

  /** The answer's list items of a question (visible only when the question is open). */
  answerItems(block: Locator): Locator {
    return this.collapsableContent(block).locator("li");
  }

  /** The answer's lists (`ul` or `ol`). */
  answerLists(block: Locator): Locator {
    return this.collapsableContent(block).locator("ul, ol");
  }

  @step("Wait for FAQs")
  async waitForPage(): Promise<void> {
    await this.requireVisible(this.page.getByText("Frequently Asked Questions (FAQs)"), "FAQs heading", 60_000);
    await this.requireVisible(this.collapsableHeader(this.question(FAQ_WHICH_INSURERS)), `FAQ '${FAQ_WHICH_INSURERS}'`);
  }

  /** The texts of a question's answer list items, in page order. */
  async answerItemTexts(block: Locator): Promise<string[]> {
    return (await this.answerItems(block).allInnerTexts()).map(clean);
  }
}
