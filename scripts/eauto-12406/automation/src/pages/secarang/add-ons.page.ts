/**
 * Secarang — Step 3 Add-ons: add-on cards with ADD / REMOVE [doc §3; F `.addon-card`]. Zurich pre-ticks
 * "All Drivers" with a pop-up; for a motorcycle "All Riders" is mandatory; a reminder pop-up may show after
 * Continue; and Continue can be pressed before the page has loaded, which leaves you on Add-ons [doc §3, §13].
 * Reaching this step means an insurer was bought: from here on a CIBO record exists or is about to [doc §6].
 *
 * Ported from Faizuddin's AddOnsPage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Kept: `.addon-card`, the ADD / REMOVE buttons, the reminder pop-up after Continue [F]. Dropped: the
 * "first N simple add-ons" helper (a test names its add-ons) and the guessed button labels ("Deselect",
 * "Uncheck", "Add to Cart" …). Changed: a missing Continue now fails instead of being taken as
 * "auto-advanced"; the reminder's text is returned to the caller.
 * NOT run from this repo yet (Azfar 28.10.2026: past All Quotations waits for his phone / email).
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean, secarangScreen } from "./secarang.page";

export interface SecarangAddOn {
  /** The card's first line. */
  name: string;
  /** True when the card offers REMOVE (it is in the plan). */
  added: boolean;
  text: string;
}

export class SecarangAddOnsPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  cards() {
    return this.page.locator(".addon-card").filter({ visible: true });
  }

  /** Wait until the add-on cards are drawn and stop changing (the early-Continue trap). */
  @step("Wait for Add-ons")
  async waitForPage(timeoutMs = 60_000): Promise<number> {
    await this.requireVisible(this.cards(), "Add-ons cards (.addon-card)", timeoutMs);
    let last = -1;
    for (let i = 0; i < 10; i++) {
      const n = await this.cards().count();
      if (n === last) return n;
      last = n;
      await this.page.waitForTimeout(1_000);
    }
    return last;
  }

  @step("Read the add-ons")
  async read(): Promise<SecarangAddOn[]> {
    const out: SecarangAddOn[] = [];
    const n = await this.cards().count();
    for (let i = 0; i < n; i++) {
      const c = this.cards().nth(i);
      const text = clean(await c.innerText().catch(() => ""));
      const lines = (await c.innerText().catch(() => "")).split("\n").map(clean).filter(Boolean);
      const added = await c.getByRole("button", { name: /^\s*REMOVE\s*$/i }).filter({ visible: true }).count();
      out.push({ name: lines[0] ?? "", added: added > 0, text });
    }
    return out;
  }

  /**
   * Press ADD (or REMOVE) on each named card (name = text on the card, any case). Returns which names were
   * pressed and which had no card; a card already in the wanted state counts as done. A pop-up an ADD raises
   * (Zurich "All Drivers") is left open for the caller: its text is in `popups`.
   */
  @step("Add / remove add-ons")
  async set(names: string[], want: "add" | "remove" = "add"): Promise<{ done: string[]; notListed: string[]; popups: string[] }> {
    const done: string[] = [];
    const notListed: string[] = [];
    const popups: string[] = [];
    for (const name of names) {
      const card = this.cards().filter({ hasText: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first();
      if (!(await card.isVisible().catch(() => false))) {
        notListed.push(name);
        continue;
      }
      const btn = card.getByRole("button", { name: want === "add" ? /^\s*ADD\s*$/i : /^\s*REMOVE\s*$/i }).filter({ visible: true }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.scrollIntoViewIfNeeded().catch(() => undefined);
        await btn.click();
        await this.page.waitForTimeout(800);
        const p = await this.modalText();
        if (p) popups.push(`${name}: ${p}`);
      }
      done.push(name);
    }
    return { done, notListed, popups };
  }

  // ------------------------------------------------ add-on options, More Info, the price bar, going back
  // (29.10.2026, EAINT-12406 E2E_TS9 / E2E_TS12). Seen on /ia/ after the deploy, Allianz, HXA0001A, READ ONLY (no ADD,
  // no option changed, no Continue): probe cr/EAINT-12406/03-spec/probes-author/addons-controls16.probe.spec.ts, two
  // runs 29.10.2026 evening. 13 `.addon-card`s; per card a More Info link `a.btn-link` holding `i.bi-info-circle`
  // (opens an `ngb-modal-window.sm-window` with the add-on's name, its text and "Close"); ADD / REMOVE buttons (Allianz
  // Road Rangers: REMOVE, disabled); option selects `select.custom-select-sm` (Motor Enhanced Road Warrior: PAB-ERWA /
  // B / C "Plan A - 5 days" …; CART: 7 / 14 / 21 days and RM50 / 100 / 200); the windscreen "Sum Insured" link
  // `a.btn-link` "RM1,400.00" (opens `ngb-modal-window.sum-insured-window`: input[formcontrolname=sumInsured], hint
  // "Sum insured ranges between RM500 and RM1,820", "Agency recommendation is RM1,400", "Apply" type=submit, X
  // `button.close`); the MPA plan link `a.btn-link` "Plan A" (opens an `ngb-modal-window.sm-window` with tiles
  // `.plan-label-card` "Plan A" / "Plan B" over `d-none` radios, "Price RM30.00", button "Select Plan A"). The price bar
  // `app-price-topbar` shows the plate and the running premium link "RM786.81" (premium after NCD + the selected
  // add-ons, the site's own code). "Back to insurance selection" is drawn twice (page + sticky bar): first visible one.

  /** The visible add-on card whose text matches `name` (a string is matched as text, any case). */
  card(name: string | RegExp): Locator {
    const re = typeof name === "string" ? new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : name;
    return this.cards().filter({ hasText: re }).first();
  }

  /** The card's price as shown: its last "RM<amount>" amount or "FREE" ("" when none). Reads only. */
  async priceOf(name: string | RegExp): Promise<string> {
    const t = clean(await this.card(name).innerText().catch(() => ""));
    const all = t.match(/RM[\d,]+\.\d{2}|FREE/g) ?? [];
    return all[all.length - 1] ?? "";
  }

  addButton(name: string | RegExp): Locator {
    return this.card(name).getByRole("button", { name: /^\s*ADD\s*$/i }).filter({ visible: true }).first();
  }

  removeButton(name: string | RegExp): Locator {
    return this.card(name).getByRole("button", { name: /^\s*REMOVE\s*$/i }).filter({ visible: true }).first();
  }

  /** The card's More Info link (the 'i'). Open it with `openInfo(addOns.moreInfoLink(name), …)`, close with `closeInfo()`. */
  moreInfoLink(name: string | RegExp): Locator {
    return this.card(name).locator("a.btn-link:has(i.bi-info-circle)").first();
  }

  /** The card's option dropdowns, in screen order. */
  optionSelects(name: string | RegExp): Locator {
    return this.card(name).locator("select").filter({ visible: true });
  }

  /** Every card with its option dropdowns (value + options) and links, as shown. Reads only. */
  @step("Read the add-on options")
  async options(): Promise<{ name: string; price: string; selects: { value: string; options: { value: string; text: string }[] }[]; links: string[]; addEnabled: boolean | null; removeEnabled: boolean | null }[]> {
    const out = [];
    for (const a of await this.read()) {
      const c = this.card(a.name);
      const selects = await c.locator("select").filter({ visible: true }).evaluateAll((ss) =>
        ss.map((s) => ({ value: (s as HTMLSelectElement).value, options: Array.from((s as HTMLSelectElement).options).map((o) => ({ value: o.value, text: o.text.trim() })) })),
      );
      const links = (await c.locator("a.btn-link").filter({ visible: true }).allInnerTexts()).map(clean).filter(Boolean);
      const add = this.addButton(a.name);
      const rem = this.removeButton(a.name);
      out.push({
        name: a.name,
        price: await this.priceOf(a.name),
        selects,
        links,
        addEnabled: (await add.count()) ? await add.isEnabled() : null,
        removeEnabled: (await rem.count()) ? await rem.isEnabled() : null,
      });
    }
    return out;
  }

  /**
   * Pick `value` in the card's `index`-th dropdown and wait for the card's price to settle (it is fetched again).
   * Returns the price before and after. An option change re-prices the add-on only: nothing is added.
   */
  @step("Change an add-on option")
  async chooseOption(name: string | RegExp, index: number, value: string): Promise<{ before: string; after: string; value: string }> {
    const sel = this.optionSelects(name).nth(index);
    await this.requireVisible(sel, `add-on option ${index + 1} of ${String(name)}`);
    const before = await this.priceOf(name);
    await sel.selectOption(value);
    const after = await this.settledPrice(name, before);
    return { before, after, value: await sel.inputValue() };
  }

  /** The card's price once it stops changing (or `before` after 15 s with no change). */
  private async settledPrice(name: string | RegExp, before: string, timeoutMs = 15_000): Promise<string> {
    const t0 = Date.now();
    let last = await this.priceOf(name);
    let since = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await this.page.waitForTimeout(500);
      const now = await this.priceOf(name);
      if (now !== last) { last = now; since = Date.now(); }
      if (last !== before && Date.now() - since >= 1_500) return last;
    }
    return last;
  }

  /** The windscreen card's "Sum Insured RM…" link (`a.btn-link` with an amount). */
  sumInsuredLink(name: string | RegExp = /Windscreen/i): Locator {
    return this.card(name).locator("a.btn-link").filter({ hasText: /RM/ }).first();
  }

  /** The "Sum Insured for …" pop-up. */
  sumInsuredModal(): Locator {
    return this.page.locator("ngb-modal-window.sum-insured-window").filter({ visible: true }).last();
  }

  /** Open the sum insured pop-up of `name`; returns its text (range, recommendation) and the value it shows. Left open. */
  @step("Open an add-on's Sum Insured")
  async openSumInsured(name: string | RegExp = /Windscreen/i): Promise<{ text: string; value: string; hints: string[] }> {
    const link = await this.requireVisible(this.sumInsuredLink(name), `Sum Insured link of ${String(name)}`);
    await link.scrollIntoViewIfNeeded().catch(() => undefined);
    await link.click();
    const m = this.sumInsuredModal();
    await this.requireVisible(m, "Sum Insured pop-up", 15_000);
    return {
      text: clean(await m.innerText()),
      value: await m.locator("input[formcontrolname='sumInsured']").inputValue(),
      hints: (await m.locator("small").allInnerTexts()).map(clean).filter(Boolean),
    };
  }

  /**
   * Type a sum insured into the open pop-up (cleared first, typed key by key: the box is `numbersOnly`) and read
   * whether the site takes it: Apply enabled, the box not marked invalid, the hint's colour class. Nothing applied.
   */
  @step("Try a sum insured")
  async trySumInsured(value: number): Promise<{ typed: string; applyEnabled: boolean; invalid: boolean; hint: string; hintClass: string }> {
    const m = this.sumInsuredModal();
    const box = m.locator("input[formcontrolname='sumInsured']");
    await box.click();
    await box.press("Control+A");
    await box.press("Backspace");
    await box.pressSequentially(String(value), { delay: 60 });
    await box.blur().catch(() => undefined);
    await this.page.waitForTimeout(400);
    const hint = m.locator("small").first();
    return {
      typed: await box.inputValue(),
      applyEnabled: await m.locator("button[type='submit']").isEnabled(),
      invalid: /\bis-invalid\b/.test((await box.getAttribute("class")) ?? ""),
      hint: clean(await hint.innerText().catch(() => "")),
      hintClass: (await hint.getAttribute("class").catch(() => "")) ?? "",
    };
  }

  /** Press Apply in the sum insured pop-up (the value typed last) and wait for it to close. */
  @step("Apply the sum insured")
  async applySumInsured(): Promise<void> {
    const m = this.sumInsuredModal();
    await m.locator("button[type='submit']").click();
    await m.waitFor({ state: "hidden", timeout: 15_000 });
  }

  /** Close the top pop-up with its X (`button.close`), nothing applied. */
  @step("Close the add-on pop-up")
  async closePopup(): Promise<void> {
    const m = this.modal();
    if (!(await m.isVisible().catch(() => false))) return;
    await m.locator("button.close").first().click();
    await m.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
  }

  /** The MPA card's plan link ("Plan A"). */
  mpaPlanLink(): Locator {
    return this.card(/Motorist Personal Accident/i).locator("a.btn-link").filter({ hasText: /Plan/ }).first();
  }

  /** Open the MPA plan chooser; returns the plans offered and the price shown. Left open. */
  @step("Open the MPA plans")
  async openMpaPlans(): Promise<{ plans: string[]; text: string }> {
    const link = await this.requireVisible(this.mpaPlanLink(), "MPA plan link");
    await link.scrollIntoViewIfNeeded().catch(() => undefined);
    await link.click();
    const m = this.modal();
    await this.requireVisible(m.locator(".plan-label-card").first(), "MPA plan tiles", 15_000);
    return { plans: (await m.locator(".plan-label-card").allInnerTexts()).map(clean), text: clean(await m.innerText()) };
  }

  /**
   * In the open MPA chooser, click the tile of `plan` (its radio is `d-none`: the tile is the control) and read the
   * pop-up again once its price settles. Nothing is selected until `selectMpaPlan()`.
   */
  @step("Pick an MPA plan tile")
  async pickMpaPlan(plan: string): Promise<{ text: string }> {
    const m = this.modal();
    const before = clean(await m.innerText());
    await m.locator("label").filter({ has: this.page.locator(".plan-label-card", { hasText: new RegExp(`^\\s*${plan.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }).first().click();
    for (let i = 0; i < 20; i++) {
      await this.page.waitForTimeout(500);
      const now = clean(await m.innerText());
      if (now !== before && !/spinner|loading/i.test(now)) break;
    }
    return { text: clean(await m.innerText()) };
  }

  /** Press the chooser's "Select Plan …" button (it names the plan picked) and wait for it to close. */
  @step("Select the MPA plan")
  async selectMpaPlan(): Promise<string> {
    const m = this.modal();
    const btn = m.getByRole("button", { name: /^\s*Select\b/ }).first();
    const label = clean(await btn.innerText());
    await btn.click();
    await m.waitFor({ state: "hidden", timeout: 15_000 });
    return label;
  }

  /** The price bar's premium link (premium after NCD + the selected add-ons). */
  premiumLink(): Locator {
    return this.page.locator("app-price-topbar a.text-primary.pointer").filter({ hasText: /^\s*RM/ }).filter({ visible: true }).first();
  }

  /** The price bar's premium as a number (NaN when not read). */
  async premium(): Promise<{ text: string; value: number }> {
    const text = clean(await this.premiumLink().innerText().catch(() => ""));
    const m = /RM\s?([\d,]+\.\d{2})/.exec(text);
    return { text, value: m ? Number(m[1].replace(/,/g, "")) : NaN };
  }

  /** Wait until the price bar's premium differs from `before` (up to 15 s); returns it. */
  async premiumAfter(before: number): Promise<{ text: string; value: number }> {
    for (let i = 0; i < 30; i++) {
      const p = await this.premium();
      if (!Number.isNaN(p.value) && Math.abs(p.value - before) > 0.004) return p;
      await this.page.waitForTimeout(500);
    }
    return this.premium();
  }

  /** "Back to insurance selection" (drawn twice: the first visible one). */
  backButton(): Locator {
    return this.page.getByRole("button", { name: /Back to insurance selection/i }).filter({ visible: true }).first();
  }

  /**
   * Back to All Quotations with "Back to insurance selection". A pop-up that comes up (e.g. "Kindly confirm your
   * navigation") is returned (its text read once drawn) and answered with its proceed button; "no pop-up" when none
   * showed. Seen 29.10.2026 (probe 16, verify run lf1): none, straight to All Quotations.
   */
  @step("Back to insurance selection")
  async backToQuotations(): Promise<{ popup: string }> {
    await this.requireVisible(this.backButton(), "Back to insurance selection");
    await this.backButton().click();
    let popup = "";
    // A pop-up's text is read once it has drawn (its body can be empty for a moment while it fades in), up to 3 s.
    const popupText = async (): Promise<string> => {
      for (let k = 0; k < 6; k++) {
        const t = await this.modalText();
        if (t) return t;
        await this.page.waitForTimeout(500);
      }
      return "(a pop-up showed, its text could not be read)";
    };
    for (let i = 0; i < 60; i++) {
      const { screen } = await secarangScreen(this.page);
      if (screen === "quotations") {
        // one more look: a pop-up arriving just after All Quotations is drawn is recorded too, then closed with its X
        // (it would block the next Buy)
        await this.page.waitForTimeout(1_500);
        if (!popup && (await this.modal().isVisible().catch(() => false))) {
          popup = `after All Quotations was drawn: ${await popupText()}`;
          await this.closePromo();
        }
        return { popup: popup || "no pop-up" };
      }
      if (screen.startsWith("popup:") && !popup) {
        popup = await popupText();
        await this.modalButton(/^\s*(Proceed|Continue|OK|Ok|Confirm|Yes|Leave)\s*$/).click();
      }
      await this.page.waitForTimeout(1_000);
    }
    throw new Error(`Add-ons: "Back to insurance selection" did not reach All Quotations within 60 s (${this.page.url()})${popup ? `; pop-up was "${popup}"` : ""}.`);
  }

  /**
   * Continue to Confirmation. If a reminder pop-up comes up first, its text is returned and its proceed button
   * (Proceed / Continue / OK / Confirm / Yes [F]) pressed; then waits for the Confirmation form.
   */
  @step("Continue from Add-ons")
  async continue(): Promise<{ reminder: string }> {
    await this.waitForPage();
    const go = this.page.getByRole("button", { name: /^\s*Continue\s*$/i }).filter({ visible: true }).last();
    await this.requireVisible(go, "Add-ons Continue");
    await go.scrollIntoViewIfNeeded().catch(() => undefined);
    await go.click();
    let reminder = "";
    for (let i = 0; i < 60; i++) {
      const { screen, text } = await secarangScreen(this.page);
      if (screen === "confirmation") return { reminder };
      if (screen.startsWith("popup:") && !reminder) {
        reminder = text;
        await this.modalButton(/^\s*(Proceed|Continue|OK|Ok|Confirm|Yes)\s*$/).click();
      }
      await this.page.waitForTimeout(1_000);
    }
    throw new Error(`Add-ons: Continue did not reach Confirmation within 60 s (${this.page.url()})${reminder ? `; pop-up was "${reminder}"` : ""}.`);
  }
}
