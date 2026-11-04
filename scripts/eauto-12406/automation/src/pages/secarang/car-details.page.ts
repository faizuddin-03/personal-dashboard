/**
 * Secarang — Step 1 Car Details, "Are these your vehicle details?" (`app-confirm-details` [F]). NOT always shown
 * [doc §3]. Shows Plate, Make, Model, Year, Seat, CC, Variant, Transmission, Current Coverage, NCD; the
 * declarations must be ticked, a variant picked when a dropdown shows (most cars have none), and its own
 * "Get quotation" starts DISABLED while the details validate [doc §3, §13; F].
 *
 * Ported from Faizuddin's VehicleDetailsPage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Changed: everything is scoped to the visible `app-confirm-details` (his variant lookup took the first
 * `<select>` on the whole page); the variant is chosen by name when the caller gives one; his fixed 5 s wait is
 * replaced by waiting for the button to be enabled. NOT seen live from this repo yet (no quote has reached this
 * step from here): the selectors are his.
 */

import { expect, type Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean } from "./secarang.page";

export class SecarangCarDetailsPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  root() {
    return this.page.locator("app-confirm-details").filter({ visible: true }).first();
  }

  async isShown(): Promise<boolean> {
    return this.root().isVisible().catch(() => false);
  }

  /** The panel's text, one line per entry (Plate, Make, Model …), for the caller's record. */
  @step("Read the car details")
  async read(): Promise<string[]> {
    await this.requireVisible(this.root(), "Car Details (app-confirm-details)", 60_000);
    return (await this.root().innerText()).split("\n").map(clean).filter(Boolean);
  }

  /**
   * Pick a variant if the panel has a dropdown still empty. `variant` = the option's label (contains, any
   * case); omitted = the first real option. Returns the label picked, or "" when no dropdown needed one.
   */
  @step("Choose the variant")
  async chooseVariant(variant?: string): Promise<string> {
    const select = this.root().locator("select").filter({ visible: true }).first();
    if (!(await select.count())) return "";
    const options = (
      await select.locator("option").evaluateAll((os) =>
        (os as HTMLOptionElement[]).map((o) => ({ value: o.value, label: (o.textContent || "").trim() })),
      )
    ).filter((o) => o.value !== "" && o.label && !/^(select|choose|--|please)/i.test(o.label));
    if (!options.length) return "";
    const current = await select.inputValue();
    if (current && !variant) return options.find((o) => o.value === current)?.label ?? "";
    const pick = variant ? options.find((o) => o.label.toLowerCase().includes(variant.toLowerCase())) : options[0];
    if (!pick) throw new Error(`Car Details: no variant matching "${variant}" (offered: ${options.map((o) => o.label).join(" | ")}).`);
    await select.selectOption(pick.value);
    return pick.label;
  }

  /** Tick every declaration box in the panel that is not ticked yet; returns how many boxes there are. */
  @step("Tick the declarations")
  async tickDeclarations(): Promise<number> {
    const boxes = this.root().locator("input[type=checkbox]");
    const n = await boxes.count();
    for (let i = 0; i < n; i++) {
      if (!(await boxes.nth(i).isChecked().catch(() => false))) await boxes.nth(i).check({ force: true });
    }
    return n;
  }

  /** The panel's own "Get quotation": waits for it to be enabled (it validates first), then presses it. */
  @step("Press Get quotation on Car Details")
  async getQuotation(): Promise<void> {
    const go = this.root().getByRole("button", { name: /Get quotation/i }).filter({ visible: true }).last();
    await this.requireVisible(go, "Car Details Get quotation");
    await expect(go).toBeEnabled({ timeout: 30_000 });
    await go.scrollIntoViewIfNeeded().catch(() => undefined);
    await go.click();
  }
}
