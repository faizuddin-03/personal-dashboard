/**
 * Secarang — Step 2 All Quotations: one card per insurer, available (premium, sum insured dropdown, Buy) or
 * "Quotation unavailable" [doc §3, §4]. Cards can take 10–20 s each, sometimes a minute [doc §3], and the page
 * renders a hidden responsive duplicate of every card [doc §13; F], so only VISIBLE cards are read.
 * Insurer order is a CR's expected result (e.g. EAINT-12406: Lonpac > Allianz > Tokio Marine, SRD v1.1 REQ-004):
 * `readCards` returns cards in screen order and asserts nothing.
 *
 * Ported from Faizuddin's QuotationPage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Kept: `.insurance-card`, the insurer from the logo's alt ("Lonpac logo" → "Lonpac"), `.sum-insured select`,
 * the price `h6` with RM, the "Buy" button, `input.postcode-field` + "Edit" [F]. Dropped: his list of
 * guessed card classes (`.quotation-card`, `.quote-card` …; only `.insurance-card` was ever confirmed), the
 * coverage-type tab clicks (his note: "pending dev deploy", not on the site) and the page-class console dump.
 * Changed: waiting is on a signal (cards present, no loader, count steady) instead of fixed sleeps.
 *
 * SEEN LIVE 29.10.2026 after the EAINT-12406 deploy [P: probe cr/EAINT-12406/03-spec/probes-automation/
 * quotations-dom.mjs, staging /ia/, made-up HXA0001A / ZZZ1A / HXA0005A, postcode 55000 and 50450]:
 *  - every card is `div.card.border-16.insurance-card`; 9 in the page, 3 VISIBLE (two hidden responsive copies);
 *  - the insurer is the logo `img` alt "Allianz logo" / "Lonpac logo" / "Tokio Marine logo"
 *    (src `insurance-logo/allianz.png`, `lonpac-logo.png`, `tokiomarine.png`);
 *  - an unavailable card holds only the logo and `<p class="mb-0">Quotation unavailable</p>` (no insurer name in
 *    text, no button);
 *  - an available card: "Plan Details" (`a.btn.btn-link`, opens the pop-up `ngb-modal-window.plan-details-window`
 *    whose "More info" links are the insurer's PDFs, closed with its "Close" button) and the "Buy" button;
 *  - the postcode: `input.postcode-field` (maxlength 5, `numbersonly`) with the "Edit" button
 *    (`button.primary-light-btn`) beside it. `fill()` does NOT take (the field keeps its old value): the value
 *    must be typed; then "Edit" re-quotes (the cards go away and come back within ~2 s);
 *  - while a pop-up is open the page behind it is `aria-modal` hidden, so role locators find nothing there.
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean, type SecarangInfo } from "./secarang.page";

export interface SecarangQuoteCard {
  /** From the logo's alt text, "logo" removed (e.g. "Lonpac", "Tokio Marine"). */
  insurer: string;
  available: boolean;
  /** The card's line saying it is unavailable, "" when available. */
  unavailableReason: string;
  /** Every "RM …" amount on the card, in order. */
  prices: string[];
  text: string;
}

export type SumInsuredChoice = "min" | "medium" | "max";

/** "Tokio Marine" and "TokioMarine" are the same insurer to a matcher. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export class SecarangQuotationsPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  cards(): Locator {
    return this.page.locator(".insurance-card").filter({ visible: true });
  }

  /** The visible card whose logo alt names the insurer. */
  async card(insurer: string): Promise<Locator> {
    const n = await this.cards().count();
    for (let i = 0; i < n; i++) {
      const c = this.cards().nth(i);
      const alts = await c.locator("img[alt]").evaluateAll((imgs) => (imgs as HTMLImageElement[]).map((im) => im.alt));
      if (alts.some((a) => key(a).includes(key(insurer)))) return c;
    }
    throw new Error(`All Quotations: no visible card for "${insurer}" (cards: ${(await this.readCards()).map((c) => c.insurer).join(", ") || "none"}).`);
  }

  /**
   * Wait for the cards to arrive and stop changing: at least one visible card, no "Bear with us" loader, and the
   * same card texts for `steadyMs`. Cards arrive one by one, so the first card alone is not "loaded".
   */
  @step("Wait for All Quotations")
  async waitForCards(timeoutMs = 150_000, steadyMs = 8_000): Promise<number> {
    const t0 = Date.now();
    let last = "";
    let since = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const n = await this.cards().count();
      const loading = /Bear with us/i.test(await this.body());
      const now = n ? (await this.cards().allInnerTexts()).map(clean).join(" | ") : "";
      if (now !== last) {
        last = now;
        since = Date.now();
      }
      // a card still saying it is loading is not a final answer
      if (n && !loading && !/loading|please wait/i.test(now) && Date.now() - since >= steadyMs) return n;
      await this.page.waitForTimeout(1_000);
    }
    throw new Error(`All Quotations: the cards did not settle within ${timeoutMs / 1000} s (${this.page.url()}).`);
  }

  /** Every visible card in screen order. Reads only. */
  @step("Read the quotation cards")
  async readCards(): Promise<SecarangQuoteCard[]> {
    const out: SecarangQuoteCard[] = [];
    const n = await this.cards().count();
    for (let i = 0; i < n; i++) {
      const c = this.cards().nth(i);
      const text = clean(await c.innerText().catch(() => ""));
      const alt = clean(await c.locator("img[alt]").first().getAttribute("alt").catch(() => ""));
      const insurer = alt.replace(/\s*logo\s*$/i, "").trim() || text.split(" ")[0];
      const reason = (/[^.|]*\b(quotation unavailable|not available|unable to provide|no quote)\b[^.|]*/i.exec(text) || [""])[0].trim();
      const prices = [...new Set(text.match(/RM\s?[\d,]+(?:\.\d{1,2})?/g) ?? [])];
      out.push({ insurer, available: !reason, unavailableReason: reason, prices, text });
    }
    return out;
  }

  /**
   * Change a card's sum insured (`.sum-insured select` [F]) and wait for its price to change. Returns the
   * value picked and whether the price moved; `applied: false` when the card has no enabled dropdown or only
   * one value.
   */
  @step("Change the sum insured")
  async chooseSumInsured(insurer: string, choice: SumInsuredChoice): Promise<{ applied: boolean; value: string; priceBefore: string; priceAfter: string }> {
    const card = await this.card(insurer);
    const select = card.locator(".sum-insured select").first();
    const priceEl = card.locator("h6").filter({ hasText: /RM/ }).first(); // [F] the card's premium
    const priceBefore = clean(await priceEl.innerText().catch(() => ""));
    if (!(await select.isVisible().catch(() => false)) || (await select.isDisabled().catch(() => true))) {
      return { applied: false, value: "", priceBefore, priceAfter: priceBefore };
    }
    const values = await select.evaluate((el) => Array.from((el as HTMLSelectElement).options).map((o) => o.value));
    if (values.length < 2 || (choice === "medium" && values.length < 3)) return { applied: false, value: values[0] ?? "", priceBefore, priceAfter: priceBefore };
    const value = choice === "min" ? values[0] : choice === "max" ? values[values.length - 1] : values[1];
    await select.selectOption(value);
    await priceEl.filter({ hasNotText: priceBefore }).waitFor({ timeout: 30_000 }).catch(() => undefined);
    return { applied: true, value, priceBefore, priceAfter: clean(await priceEl.innerText().catch(() => "")) };
  }

  /** The car-location postcode field on All Quotations [P 29.10.2026]. */
  postcodeField(): Locator {
    return this.page.locator("input.postcode-field").filter({ visible: true }).first();
  }

  /** The "Edit" button beside the postcode field [P 29.10.2026: `button.primary-light-btn` "Edit ", its sibling]. */
  postcodeEditButton(): Locator {
    return this.postcodeField().locator("xpath=..").locator("button.primary-light-btn").filter({ hasText: /^\s*Edit\s*$/ }).first();
  }

  /**
   * Edit the car-location postcode on this page and wait for the cards to settle again [P 29.10.2026]: the new
   * value is TYPED (fill() does not take on this `numbersonly` field), read back, then "Edit" pressed. A
   * re-quote is seen as the cards going away (or changing, or the loader) after Edit. Returns the field's value
   * after the re-quote, whether a re-quote was seen, and the card count. Throws when the field does not take the
   * value. A quotation only, nothing bought.
   */
  @step("Edit the postcode on All Quotations")
  async editPostcode(postcode: string): Promise<{ value: string; requoted: boolean; cards: number }> {
    const box = this.postcodeField();
    await this.requireVisible(box, "All Quotations postcode field");
    await box.click();
    await box.press("Control+A");
    await box.press("Backspace");
    await box.pressSequentially(postcode, { delay: 80 });
    const typed = await box.inputValue();
    if (typed !== postcode) throw new Error(`All Quotations postcode: typed "${postcode}" but the field reads "${typed}".`);
    const before = (await this.cards().allInnerTexts()).map(clean).join(" | ");
    const edit = this.postcodeEditButton();
    await this.requireVisible(edit, "All Quotations postcode Edit");
    await edit.click();
    let requoted = false;
    const t0 = Date.now();
    while (!requoted && Date.now() - t0 < 20_000) {
      const n = await this.cards().count();
      const now = n ? (await this.cards().allInnerTexts()).map(clean).join(" | ") : "";
      requoted = n === 0 || now !== before || /Bear with us/i.test(await this.body());
      if (!requoted) await this.page.waitForTimeout(250);
    }
    const cards = await this.waitForCards();
    return { value: await this.postcodeField().inputValue(), requoted, cards };
  }

  /**
   * The insurer's logo on its card, read: alt, file, loaded (a broken image has naturalWidth 0) and drawn size.
   * Reads only.
   */
  async logoOf(insurer: string): Promise<{ alt: string; file: string; loaded: boolean; width: number; height: number; logo: Locator }> {
    const card = await this.card(insurer);
    const logo = card.locator("img[alt$='logo' i]").filter({ visible: true }).first();
    const got = await logo
      .evaluate((im) => {
        const i = im as HTMLImageElement;
        const r = i.getBoundingClientRect();
        return { alt: i.alt, file: (i.getAttribute("src") || "").split("/").pop() || "", loaded: i.complete && i.naturalWidth > 0, width: Math.round(r.width), height: Math.round(r.height) };
      })
      .catch(() => ({ alt: "", file: "", loaded: false, width: 0, height: 0 }));
    return { ...got, logo };
  }

  /**
   * How an UNAVAILABLE card looks, without its logo: classes, its text, what it holds (images, buttons, links),
   * the card's width and box style, and the font of its line. Reads only.
   * `border` (all four sides + radius) and `font` (the "Quotation unavailable" line: family, size, weight, colour)
   * were split out 29.10.2026 for 12406_QT_TS2 v5, which compares on text, contents (`holds`), width, border and
   * font only; `classes`, `box` and `line` stay for the record.
   */
  async unavailableLook(insurer: string): Promise<Record<string, string>> {
    const card = await this.card(insurer);
    return card.evaluate((c) => {
      const cs = getComputedStyle(c);
      const line = Array.from(c.querySelectorAll("p, span, div")).find((e) => e.children.length === 0 && /Quotation unavailable/i.test(e.textContent || "")) as HTMLElement | undefined;
      const ls = line ? getComputedStyle(line) : undefined;
      return {
        classes: c.className.trim().split(/\s+/).sort().join(" "),
        text: (c.textContent || "").replace(/\s+/g, " ").trim(),
        holds: `${c.querySelectorAll("img").length} image(s), ${c.querySelectorAll("button").length} button(s), ${c.querySelectorAll("a").length} link(s)`,
        width: `${Math.round(c.getBoundingClientRect().width)}px`,
        box: `background ${cs.backgroundColor}; border ${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}; radius ${cs.borderTopLeftRadius}; shadow ${cs.boxShadow}`,
        border: (["Top", "Right", "Bottom", "Left"] as const)
          .map((s) => `${s.toLowerCase()} ${cs.getPropertyValue(`border-${s.toLowerCase()}-width`)} ${cs.getPropertyValue(`border-${s.toLowerCase()}-style`)} ${cs.getPropertyValue(`border-${s.toLowerCase()}-color`)}`)
          .join("; ") + `; radius ${cs.borderTopLeftRadius} ${cs.borderTopRightRadius} ${cs.borderBottomRightRadius} ${cs.borderBottomLeftRadius}`,
        font: ls ? `${ls.fontFamily} ${ls.fontSize} weight ${ls.fontWeight} ${ls.fontStyle} ${ls.color}` : "(no 'Quotation unavailable' line)",
        line:line ? `<${line.tagName.toLowerCase()} class="${line.className}"> ${ls!.fontFamily.split(",")[0]} ${ls!.fontSize} w${ls!.fontWeight} ${ls!.color} align ${ls!.textAlign}` : "(no 'Quotation unavailable' line)",
      };
    });
  }

  /**
   * Open the insurer card's "Plan Details" (`a.btn.btn-link`, probe confirmation-controls.probe.spec.ts 29.10.2026) and
   * read the pop-up: its text and every link with its address. Left open for a screenshot; `closeInfo()` closes it.
   * Reads only (12406_QT_TS7 records the content; the SRD is silent on it, Q15).
   */
  @step("Open Plan Details on the insurer's card")
  async planDetails(insurer: string): Promise<SecarangInfo> {
    const card = await this.card(insurer);
    return this.openInfo(card.locator("a.btn-link").filter({ hasText: /Plan Details/i }), `${insurer} card Plan Details`);
  }

  /** The visible Buy button of the insurer's card (none on an unavailable card). */
  async buyButton(insurer: string): Promise<Locator> {
    return (await this.card(insurer)).getByRole("button", { name: /Buy/i }).filter({ visible: true }).first();
  }

  /**
   * Press Buy on the insurer's card. Throws when the card is "Quotation unavailable" or has no Buy button.
   * After this the purchase is under way: Add-ons and Confirmation create a CIBO record [doc §6].
   */
  @step("Buy the insurer's quotation")
  async buy(insurer: string): Promise<void> {
    const card = await this.card(insurer);
    const text = clean(await card.innerText());
    if (/quotation unavailable|not available|unable to provide|no quote/i.test(text)) {
      throw new Error(`All Quotations: ${insurer} is unavailable ("${text.slice(0, 160)}").`);
    }
    const buy = card.getByRole("button", { name: /Buy/i }).filter({ visible: true }).first();
    await this.requireVisible(buy, `${insurer} Buy`);
    await buy.scrollIntoViewIfNeeded().catch(() => undefined);
    await buy.click();
  }
}
