/**
 * Secarang — Support (`/ia/support`), reached from the top menu. Under "Need to contact insurance company?" one
 * `app-collapsable` per insurer (see SecarangPage.collapsables), all closed on load (29.10.2026):
 *   header  `h5.insurance-company-name` (the insurer's name) + icon `i.bi-plus-lg` / `i.bi-dash`
 *   body    `[collapsable-content]` > `ul.pl-3` > `li` > `div` > `h6.font-weight-medium.fs-17` (the label) + `p` (the
 *           number); Allianz also has a `p.pl-3.ml-3` after its list (the towing sentence)
 * [probe cr/EAINT-12406/03-spec/probes-automation/cp-pages-probe.mjs, 29.10.2026].
 *
 * Written 29.10.2026 for EAINT-12406 sheet CP (REQ-009). Selectors seen on staging /ia/ after the deploy.
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean } from "./secarang.page";

/** One contact line of an insurer section: its label (h6) and number (p). */
export interface SupportContactLine {
  label: string;
  number: string;
}

export class SecarangSupportPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  /** "Need to contact insurance company?" heading. */
  contactInsurerHeading(): Locator {
    return this.page.getByText("Need to contact insurance company?").filter({ visible: true }).first();
  }

  /** Every insurer section (blocks whose header holds an insurer name). */
  insurerSections(): Locator {
    return this.collapsables().filter({ has: this.page.locator("h5.insurance-company-name") });
  }

  /** An insurer section by (part of) its name, e.g. "Allianz". */
  section(name: string): Locator {
    return this.insurerSections().filter({ has: this.page.locator("h5.insurance-company-name", { hasText: name }) }).first();
  }

  sectionName(block: Locator): Locator {
    return block.locator("h5.insurance-company-name").first();
  }

  /** A section's contact lines (`li`, one per label + number). */
  contactLines(block: Locator): Locator {
    return this.collapsableContent(block).locator("li");
  }

  /** A section's free-text line(s) outside the contact list (Allianz: the towing sentence). */
  notes(block: Locator): Locator {
    return this.collapsableContent(block).locator(":scope > p");
  }

  @step("Wait for Support")
  async waitForPage(): Promise<void> {
    await this.requireVisible(this.page.getByText("Need to reach out to us?"), "Support heading", 60_000);
    await this.requireVisible(this.contactInsurerHeading(), "Need to contact insurance company?");
    await this.requireVisible(this.sectionName(this.insurerSections().first()), "first insurer section");
  }

  /** The insurer section names in page order (top to bottom). */
  async sectionNames(): Promise<string[]> {
    const names = this.page.locator("app-collapsable h5.insurance-company-name");
    const rows = await names.evaluateAll((els) =>
      els.map((e) => ({ t: (e as HTMLElement).innerText, y: e.getBoundingClientRect().top + scrollY })),
    );
    return rows.sort((a, b) => a.y - b.y).map((r) => clean(r.t));
  }

  /** A section's contact lines as label + number (read when the section is open). */
  async readLines(block: Locator): Promise<SupportContactLine[]> {
    const lines = this.contactLines(block);
    const n = await lines.count();
    const out: SupportContactLine[] = [];
    for (let i = 0; i < n; i++) {
      const li = lines.nth(i);
      out.push({ label: clean(await li.locator("h6").first().innerText().catch(() => "")), number: clean(await li.locator("p").first().innerText().catch(() => "")) });
    }
    return out;
  }
}
