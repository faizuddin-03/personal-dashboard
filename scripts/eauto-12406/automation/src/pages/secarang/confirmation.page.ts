/**
 * Secarang — Step 4 Confirmation ("Confirm and Pay"): owner name, email, phone, address 1–3, an optional
 * discount code, then the summary of vehicle, insurance and price [doc §3]. The page shows the IC with dashes
 * and the phone with "+60". The team doc says the phone field keeps "+60", so typing "0189812839" gives
 * "+600189812839" and the error "At least 12 digits including +60": type the number without the leading 0 [doc §13].
 * Seen on /ia/ after the EAINT-12406 deploy (verify runs 29.10.2026): "+60" is a fixed label BEFORE the box and the
 * box holds only the local digits; `fillOwner` reads it back that way.
 * The email and phone typed here receive the WhatsApp and email receipts (Azfar 28.10.2026): a run must use
 * the QA's own, never made-up ones that could belong to someone.
 *
 * Ported from Faizuddin's ConfirmationPage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Kept: `input[formcontrolname]` name / email / phoneNo / addr1 / addr2 / addr3, the discount-code box beside
 * "Discount code" and its Apply button, the `.row.mb-2 .text-muted` label / value reading, "Confirm and Pay" [F].
 * Changed: the phone is typed without +60 / 0 and read back (his typed what he was given); no default owner
 * data (his came from a data file with a real-looking person; not carried over).
 * Run from this repo on /ia/ since 29.10.2026 (EAINT-12406 verify runs, src/flows/README.md).
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage, clean, type SecarangInfo } from "./secarang.page";

export interface SecarangOwner {
  name: string;
  email: string;
  /** Malaysian mobile, any of "0123456789", "60123456789", "+60123456789": typed as "123456789". */
  mobile: string;
  address1: string;
  address2?: string;
  address3?: string;
}

const FIELD = { name: "name", email: "email", mobile: "phoneNo", address1: "addr1", address2: "addr2", address3: "addr3" } as const;

/** Digits after the country code and the trunk 0: "+60 12-345 6789" → "123456789". */
export const localMobile = (m: string): string => m.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");

export class SecarangConfirmationPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  field(name: (typeof FIELD)[keyof typeof FIELD]) {
    return this.page.locator(`input[formcontrolname="${name}"]`).filter({ visible: true }).first();
  }

  confirmAndPayButton() {
    return this.page.getByRole("button", { name: /Confirm and Pay/i }).filter({ visible: true }).last();
  }

  @step("Wait for Confirmation")
  async waitForPage(): Promise<void> {
    await this.requireVisible(this.field("phoneNo"), "Confirmation mobile field (phoneNo)", 60_000);
    await this.requireVisible(this.confirmAndPayButton(), "Confirm and Pay");
  }

  /**
   * Fill the owner fields; the mobile is typed as its local digits and read back. On /ia/ after the EAINT-12406
   * deploy (verify runs sQT / sRC 29.10.2026) "+60" is a fixed label before the box and the box holds only the
   * local digits ("123456789"), so the read-back compares digits with digits. A box that shows the prefix itself
   * ("+60123456789", the team doc §13 wording) is accepted too. `mobileShown` = the label's prefix + the box.
   */
  @step("Fill the owner's details")
  async fillOwner(o: SecarangOwner): Promise<{ mobileShown: string }> {
    for (const k of ["name", "email", "address1", "address2", "address3"] as const) {
      const v = o[k];
      if (v === undefined) continue;
      const box = this.field(FIELD[k]);
      await this.requireVisible(box, `Confirmation ${FIELD[k]}`);
      await box.fill(v);
    }
    const digits = localMobile(o.mobile);
    const phone = this.field("phoneNo");
    await this.requireVisible(phone, "Confirmation phoneNo");
    await phone.fill(digits);
    const shown = await phone.inputValue();
    const got = shown.replace(/\D/g, "");
    if (got !== digits && got !== `60${digits}`) {
      // never echo the number itself: it is the QA's own (env), and this message lands in the run's results
      throw new Error(`Confirmation mobile: typed ${digits.length} local digits, the box reads ${got.length} digits that are not the same number.`);
    }
    const prefix = got === digits ? await this.mobilePrefix() : "";
    return { mobileShown: `${prefix}${shown}` };
  }

  /** The fixed country-code text shown with the mobile box ("+60"), "" when the box has none beside it. */
  async mobilePrefix(): Promise<string> {
    return this.field("phoneNo")
      .evaluate((input) => {
        for (let el: Element | null = input.parentElement, i = 0; el && i < 4; el = el.parentElement, i++) {
          const m = /\+\s*60\b/.exec((el as HTMLElement).innerText || "");
          if (m) return m[0].replace(/\s+/g, "");
        }
        return "";
      })
      .catch(() => "");
  }

  /** Type a discount code and press Apply. Returns false (and applies nothing) when Apply stays disabled. */
  @step("Apply a discount code")
  async applyDiscount(code: string): Promise<boolean> {
    const box = this.page
      .locator("div.w-100.position-relative")
      .filter({ has: this.page.locator("span", { hasText: "Discount code" }) })
      .locator("input")
      .filter({ visible: true })
      .first();
    await this.requireVisible(box, "Discount code box");
    await box.fill(code);
    const apply = this.page.getByRole("button", { name: /Apply/i }).filter({ visible: true }).last();
    await apply.waitFor({ state: "visible", timeout: 10_000 });
    for (let i = 0; i < 10 && (await apply.isDisabled().catch(() => true)); i++) await this.page.waitForTimeout(500);
    if (await apply.isDisabled().catch(() => true)) return false;
    await apply.click();
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    return true;
  }

  /** The summary as label → value (vehicle, insurance, price rows) plus the three owner inputs. Reads only. */
  @step("Read the Confirmation summary")
  async read(): Promise<Record<string, string>> {
    const rows = await this.page.evaluate(() => {
      const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim();
      const out: Record<string, string> = {};
      document.querySelectorAll(".row.mb-2, .row.mb-4").forEach((row) => {
        if (!(row as HTMLElement).offsetParent) return; // hidden responsive copy
        const muted = row.querySelector(".text-muted");
        if (muted) {
          const label = norm(muted.textContent);
          const col = Array.from(row.querySelectorAll("[class*='col']")).find((c) => c !== muted && !c.contains(muted) && norm(c.textContent));
          if (label && col) out[label] = norm(col.textContent);
          return;
        }
        const cols = Array.from(row.querySelectorAll(".col, .col-auto"));
        if (cols.length >= 2) {
          const label = norm(cols[0].textContent);
          const value = norm(cols[cols.length - 1].textContent);
          if (label && value && label !== value) out[label] = value;
        }
      });
      return out;
    });
    for (const [k, f] of [["Full Name", "name"], ["Email", "email"], ["Mobile Phone No.", "phoneNo"]] as const) {
      rows[k] = await this.field(f).inputValue().catch(() => "");
    }
    return rows;
  }

  // ------------------------------------------------ Insurance Details / pricing info (29.10.2026, EAINT-12406)
  // Seen on /ia/ 29.10.2026 (probe cr/EAINT-12406/03-spec/probes-automation/confirmation-controls.probe.spec.ts,
  // Allianz HXA0006A): "Insurance Details" with a "Plan Details" `a.btn-link`; the "Excess" label (`.row.mb-2
  // .text-muted`) with an `a > i.bi-info-circle`; in `.pricing-details` the agent line `small.agent-text`
  // ("Exclusively by agent … PIAM ID: …") with an `i.bi-info-circle` on its row, then "Commission (n%)". Reads only.

  /** "Plan Details" under Insurance Details: open it and read the pop-up (left open; `closeInfo()`). */
  @step("Open Plan Details on Confirmation")
  async planDetails(): Promise<SecarangInfo> {
    return this.openInfo(this.page.locator("a.btn-link").filter({ hasText: /^\s*Plan Details\s*$/i }), "Confirmation Plan Details");
  }

  /** The 'i' beside "Excess": open it and read what it shows (left open; `closeInfo()`). */
  @step("Open the Excess 'i' on Confirmation")
  async excessInfo(): Promise<SecarangInfo> {
    const row = this.page.locator(".row.mb-2").filter({ has: this.page.locator(".text-muted", { hasText: /^\s*Excess\s*$/ }) });
    return this.openInfo(row.locator("i.bi-info-circle"), "Confirmation Excess 'i'");
  }

  /** The agent line ("Exclusively by agent … PIAM ID: …") and the commission row, as shown. */
  async agentLine(): Promise<{ agent: string; commission: string }> {
    const agent = clean(await this.page.locator("small.agent-text").filter({ visible: true }).first().innerText().catch(() => ""));
    const commission = clean(
      await this.page
        .locator(".pricing-details .row")
        .filter({ hasText: /^\s*Commission\b/ })
        .filter({ visible: true })
        .last()
        .innerText({ timeout: 5_000 })
        .catch(() => ""),
    );
    return { agent, commission };
  }

  /** The 'i' on the agent / PIAM ID row: open it and read what it shows (left open; `closeInfo()`). */
  @step("Open the agent (PIAM ID) 'i' on Confirmation")
  async agentInfo(): Promise<SecarangInfo> {
    const row = this.page.locator(".pricing-details .row").filter({ has: this.page.locator("small.agent-text") }).last();
    return this.openInfo(row.locator("i.bi-info-circle"), "Confirmation PIAM ID 'i'");
  }

  // ------------------------------------------------ gender (29.10.2026, EAINT-12406 E2E_TS9)
  // Read from the deployed /ia/ code (chunk 112.37aeef668bd97567781b.js, Confirmation template; read only, no click):
  // for an Individual owner `select.custom-select.ia-input[formcontrolname="gender"]` with options "MALE" / "FEMALE"
  // (label "Gender"); a change dispatches a re-price for the transaction (the price box reloads). Not seen on a
  // screenshot yet: the secarang verify test "lookFirst … gender" outlines it before a CR spec uses it.

  /** The Gender dropdown (an Individual owner only). */
  genderSelect(): Locator {
    return this.page.locator("select[formcontrolname='gender']").filter({ visible: true }).first();
  }

  /** The gender shown ("MALE" / "FEMALE", "" when no dropdown). */
  async gender(): Promise<string> {
    return (await this.genderSelect().count()) ? this.genderSelect().inputValue() : "";
  }

  /**
   * Set the gender and wait for the re-price to finish before reading the price box again. While it re-prices, the
   * site swaps every amount of the price box for a loader (`isPremiumLoading`, Confirmation template in the deployed
   * code), so a read in that moment has no "Total Premium" value (the loader is looked for inside the price box `.pricing-details`,
   * where the agent line was seen; the missing amount alone also counts as loading): verify run lf1 29.10.2026 19:24 read "MALE ->
   * FEMALE: RM941.13 -> undefined". So: wait (up to 5 s) for the loader to come or the total to change, then until
   * no loader is shown and the total is an amount that stays the same on three reads 500 ms apart (up to 60 s).
   * Throws, naming what it saw, when no total appears. No re-price (same total) is a result: the caller judges it.
   */
  @step("Set the gender on Confirmation")
  async setGender(value: "MALE" | "FEMALE"): Promise<{ before: Record<string, string>; after: Record<string, string> }> {
    const sel = await this.requireVisible(this.genderSelect(), "Confirmation Gender");
    const before = await this.read();
    const was = before["Total Premium"] ?? "";
    await sel.selectOption(value);
    const amount = (v?: string) => /RM\s?[\d,]+\.\d{2}/.test(v ?? "");
    const loading = () => this.page.locator(".pricing-details .spinner-border, .pricing-details [role='status']").filter({ visible: true }).count().then((n) => n > 0).catch(() => false);
    // 1) the re-price starts: a loader shows, or the total is gone / different (a fast answer may skip the loader)
    for (let i = 0; i < 10; i++) {
      const now = (await this.read())["Total Premium"];
      if ((await loading()) || !amount(now) || now !== was) break;
      await this.page.waitForTimeout(500);
    }
    // 2) it ends: no loader, and the same amount on three reads in a row
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    let after = await this.read();
    let last = "";
    let same = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 60_000) {
      after = await this.read();
      const now = after["Total Premium"] ?? "";
      if (amount(now) && !(await loading())) {
        same = now === last ? same + 1 : 1;
        last = now;
        if (same >= 3) return { before, after };
      } else {
        same = 0;
        last = "";
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`Confirmation: after Gender ${value} no Total Premium was shown within 60 s (last read "${after["Total Premium"] ?? "(no Total Premium row)"}", loader ${(await loading()) ? "still shown" : "not shown"}; before: "${was}").`);
  }

  // ------------------------------------------------ the declaration line above Confirm and Pay (29.10.2026, 12406_QT_TS7)
  // Seen on /ia/ 29.10.2026 (probe confirmation-controls.probe.spec.ts, Allianz HXA0006A, Confirm and Pay not
  // pressed): `small.text-muted.d-md-block.d-none` "By continuing, you agree to our Privacy Policy and Terms of Use, you
  // declare to have read, understood and accepted the selected insurer's Product Disclosure Sheet …", whose links are
  // "Privacy Policy" (routerlink /privacy-policy, Secarang's own page), "Product Disclosure Sheet"
  // (./assets/documents/allianz-product-disclosure-en.pdf) and "Privacy Notice" (./assets/documents/allianz-privacy-notice.pdf),
  // each target=_blank. A `d-none` copy exists for small screens: only the visible one is read. Reads only.

  /** The visible declaration line ("By continuing, you agree to our Privacy Policy …"). */
  declaration() {
    return this.page.locator("small.text-muted").filter({ hasText: /By continuing, you agree/i }).filter({ visible: true }).first();
  }

  /** Every link in the declaration line, with its address as the browser resolves it. Reads only. */
  async declarationLinks(): Promise<{ text: string; href: string }[]> {
    await this.requireVisible(this.declaration(), "Confirmation declaration line ('By continuing, you agree …')");
    return this.declaration()
      .locator("a")
      .evaluateAll((as) => as.map((a) => ({ text: ((a as HTMLElement).innerText || "").replace(/\s+/g, " ").trim(), href: (a as HTMLAnchorElement).href })));
  }

  /** The declaration link named `text` (whole text, any case). */
  declarationLink(text: string) {
    const esc = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.declaration().locator("a").filter({ hasText: new RegExp(`^\\s*${esc}\\s*$`, "i") }).first();
  }

  // ------------------------------------------------ going back from Confirmation (29.10.2026, EAINT-12406 E2E_TS10)
  // Seen 29.10.2026: the full-page Confirmation of verify run fx5 (HXA0006A, Allianz) shows "Allianz - Comprehensive"
  // with an "Edit" link at the top of the price box, and "Back to add-on selection" under the form. Read from the
  // deployed /ia/ code the same day (read only, chunk 112.37aeef668bd97567781b.js + assets/i18n/en.json; no click):
  //  - the price box's "Add-Ons" heading (h6, PRICING_DETAIL.ADD_ON = "Add-Ons") has an "Edit" link beside it
  //    (GLOBAL.ACTION.EDIT = "Edit") that calls backToAddonPage(): back to Add-ons;
  //  - the plan's "Edit" link calls openConfirmationModal(): a confirm pop-up `ngb-modal-window.confirm-modal-window`
  //    titled "Change your insurance plan?", message "You will lose current plan and all the keyed-in details if you
  //    decide to change to another plan.", buttons "Change" (confirm, first: isInverse) and "Cancel"; "Change" goes
  //    to /car-insurance/choose-your-insurance/<transaction> (All Quotations).
  // In fx5 the "Add-Ons" heading was under the sticky car bar, so its Edit is not seen on a screenshot yet: each
  // locator below throws unless it matches exactly ONE visible element (the secarang verify test "switch insurer
  // from Confirmation" shows each one outlined before a CR spec uses it).

  /** The "Edit" link beside the price box's "Add-Ons" heading. */
  addOnsEditLink(): Locator {
    return this.page.locator("xpath=//h6[normalize-space()='Add-Ons']/following-sibling::a[normalize-space()='Edit']").filter({ visible: true });
  }

  /** The "Edit" link of the plan line "<insurer> - <plan>" (e.g. "Allianz - Comprehensive") at the top of the price box. */
  planEditLink(insurer: string): Locator {
    // first word only: the plan line may write the insurer as its plan code ("TokioMarine") or its name ("Tokio Marine")
    const word = insurer.trim().split(/\s+/)[0].replace(/'/g, "");
    return this.page
      .locator(
        `xpath=//a[normalize-space()='Edit'][not(preceding-sibling::h6[normalize-space()='Add-Ons'])]` +
          `[contains(normalize-space(ancestor::div[1]), '${word}')][contains(normalize-space(ancestor::div[1]), ' - ')]`,
      )
      .filter({ visible: true });
  }

  /** The "Change your insurance plan?" pop-up. */
  changePlanModal(): Locator {
    return this.page.locator("ngb-modal-window.confirm-modal-window").filter({ visible: true });
  }

  private async one(loc: Locator, what: string): Promise<Locator> {
    await this.requireVisible(loc.first(), what);
    const n = await loc.count();
    if (n !== 1) throw new Error(`Confirmation: ${what} matched ${n} visible elements, not exactly one.`);
    return loc;
  }

  /** Press the "Add-Ons" heading's Edit and wait for the Add-ons cards (the add-ons page). */
  @step("Confirmation: Edit the add-ons")
  async editAddOns(): Promise<void> {
    const link = await this.one(this.addOnsEditLink(), "Add-Ons 'Edit'");
    await link.scrollIntoViewIfNeeded().catch(() => undefined);
    await link.click();
    await this.requireVisible(this.page.locator(".addon-card").filter({ visible: true }).first(), "Add-ons cards after the Add-Ons Edit", 60_000);
  }

  /** Press the plan's Edit; returns the pop-up's text (left open: `confirmChangePlan()` or `cancelChangePlan()`). */
  @step("Confirmation: Edit the insurance plan")
  async openChangePlan(insurer: string): Promise<string> {
    const link = await this.one(this.planEditLink(insurer), `"${insurer} - …" plan 'Edit'`);
    await link.scrollIntoViewIfNeeded().catch(() => undefined);
    await link.click();
    const modal = this.changePlanModal();
    await this.requireVisible(modal, "'Change your insurance plan?' pop-up", 15_000);
    return clean(await modal.innerText());
  }

  /** The pop-up's "Change" button (the confirm; never "Edit", the link that opened it). */
  changePlanButton(): Locator {
    return this.changePlanModal().getByRole("button", { name: /^\s*Change\s*$/ });
  }

  /** Press "Change" in the pop-up. All Quotations follows (the caller waits for its cards). */
  @step("Confirmation: Change the insurance plan")
  async confirmChangePlan(): Promise<void> {
    const btn = await this.one(this.changePlanButton(), "pop-up 'Change'");
    await btn.click();
    await this.changePlanModal().waitFor({ state: "hidden", timeout: 15_000 }).catch(() => undefined);
  }

  /** Press Confirm and Pay. Creates / updates the CIBO record [doc §6] and leads to the payment page. */
  @step("Press Confirm and Pay")
  async confirmAndPay(): Promise<void> {
    const go = this.confirmAndPayButton();
    await this.requireVisible(go, "Confirm and Pay");
    await go.scrollIntoViewIfNeeded().catch(() => undefined);
    await go.click();
  }
}
