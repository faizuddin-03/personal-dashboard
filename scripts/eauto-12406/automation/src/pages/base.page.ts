import type { Page, Locator } from "@playwright/test";

/**
 * Every page object extends this. It deliberately carries almost nothing:
 * prefer native locators and web-first assertions, and put genuinely shared
 * widgets in src/pages/components/.
 *
 * Shape follows `eauto-qa-automation/src/pages/base.page.ts`.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Resolve a control by its visible name and FAIL LOUDLY when it is absent.
   *
   * A helper that returns null when it cannot find its control reports a pass
   * having done nothing, and the next red lands on the product instead of on
   * the script (qa-principles #14).
   */
  protected async requireVisible(locator: Locator, what: string, timeout = 30_000): Promise<Locator> {
    try {
      await locator.first().waitFor({ state: "visible", timeout });
    } catch {
      throw new Error(`Could not find "${what}" on ${this.page.url()}`);
    }
    return locator.first();
  }

  /** The page's own heading text, used to confirm a click landed. */
  async heading(): Promise<string> {
    return (await this.page.locator("h1, h2, h3").first().innerText()).trim();
  }

  /**
   * Read a value the page prints beside a label.
   *
   * The eAuto wizards render results as label/value pairs in tables rather
   * than in fields, so there is nothing to read with `inputValue`. Returns ""
   * when the label is absent, because a caller asserting on the value wants to
   * see the empty string in the diff rather than a thrown error about a label.
   */
  protected async labelled(label: string): Promise<string> {
    const body = await this.page.locator("body").innerText();
    const at = body.indexOf(label);
    if (at === -1) return "";
    return (
      body
        .slice(at + label.length)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)[0] ?? ""
    );
  }
}
