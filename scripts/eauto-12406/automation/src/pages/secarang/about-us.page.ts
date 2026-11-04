/**
 * Secarang — About Us (`/ia/about-us`), reached from the top menu. One content block `div.about-us-content`:
 * headings `h1` / `h4.text-center` with a `p.text-center.fs-17` under each, among them `h4` "Our partnership" and
 * its paragraph [probe cr/EAINT-12406/03-spec/probes-automation/cp-pages-probe.mjs, 29.10.2026].
 *
 * Written 29.10.2026 for EAINT-12406 sheet CP (REQ-007). Selectors seen on staging /ia/ after the deploy.
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean } from "./secarang.page";

export class SecarangAboutUsPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  content(): Locator {
    return this.page.locator("div.about-us-content").filter({ visible: true }).first();
  }

  /** `h4` "Our partnership" [probe: h4.text-center.lh-17.mt-4]. */
  partnershipHeading(): Locator {
    return this.content().locator("h4").filter({ hasText: /^\s*Our partnership\s*$/ }).first();
  }

  /** The paragraph right after "Our partnership" [probe: the h4's next sibling, p.text-center.lh-17.mt-3.mb-4.fs-17]. */
  partnershipParagraph(): Locator {
    return this.partnershipHeading().locator("xpath=following-sibling::*[1][self::p]");
  }

  /** Every body paragraph of the About Us content block (4 on 29.10.2026). */
  paragraphs(): Locator {
    return this.content().locator("p");
  }

  @step("Wait for About Us")
  async waitForPage(): Promise<void> {
    await this.requireVisible(this.page.getByText("Get to know us better"), "About Us heading 'Get to know us better'", 60_000);
    await this.requireVisible(this.partnershipHeading(), "About Us 'Our partnership'");
  }

  async partnershipText(): Promise<string> {
    return clean(await this.partnershipParagraph().innerText());
  }
}
