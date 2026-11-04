/**
 * CIBO — Transaction Details (`/cibo/transaction-management/transaction-details/<id>`), opened from a Ref. No.
 * [walk 28.10.2026]. Label / value pairs (Car Owner Details, vehicle, plan, premium …) and, on the right, the
 * insurer box: "Insurer" then the insurer's name (Tokio Marine also its company number, on the same line and
 * wrapping), "Plan", Policy No, Agency, PIAM ID …
 * Buttons on a final transaction: "e-Certificate" + "Receipt" (Tokio Marine, RHB, Allianz) or
 * "Certificate of Insurance" + "Policy Schedule" + "Receipt" (Lonpac); none on a non-final one.
 * **Receipt downloads a PDF directly** (`R<receipt no><plate>.pdf`), no popup; read it with `pdftotext -layout`.
 * The page shows the customer's name, IC, phone, email and address: screenshots of it are personal data.
 */

import type { Download, Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, clean } from "./cibo.page";

export class CiboTransactionDetailsPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    return /\/transaction-details\//.test(this.page.url());
  }

  /** The value printed after a label (first occurrence on the page), "" when absent. Reads only. */
  async value(label: string): Promise<string> {
    return this.labelled(label);
  }

  /**
   * The insurer box's "Insurer" text: everything between "Insurer" and "Plan", joined on one line (Tokio Marine's
   * company number wraps) [before-walk walk.mjs `insurerLine`]. Also the raw lines, to tell "below" from "same line".
   */
  @step("Read the insurer on CIBO Transaction Details")
  async insurer(): Promise<{ text: string; lines: string[] }> {
    const body = await this.page.locator("body").innerText();
    const k = body.indexOf("\nInsurer\n");
    if (k < 0) return { text: "", lines: [] };
    const end = body.indexOf("\nPlan", k + 9);
    const lines = body.slice(k + 9, end < 0 ? undefined : end).split("\n").map(clean).filter(Boolean);
    return { text: lines.join(" "), lines };
  }

  /**
   * The "Insurer" row of the insurer box: `div.row` = label `div.col-sm-5.text-muted` "Insurer" + value
   * `div.col-sm-7` (one element; Tokio Marine's company number is inside the same value div, so it wraps on the
   * same line). One match on BR69005852, BR60006309, BR55004008 [probe 29.10.2026,
   * cr/EAINT-12406/03-spec/probes-automation/rg-insurer-box.mjs]. For outlining evidence.
   */
  insurerRow(): Locator {
    return this.page.locator('xpath=//*[normalize-space(text())="Insurer"]/..').first();
  }

  /** The whole insurer box (`div.card-body`: Insurer, Plan, Policy No, Agency …) [same probe; one match]. */
  insurerBox(): Locator {
    return this.page.locator('xpath=//*[normalize-space(text())="Insurer"]/ancestor::*[.//*[normalize-space(text())="Policy No"]][1]').first();
  }

  /**
   * The label text on the page, to outline it in a screenshot. Labels seen on screen [walk 28.10.2026,
   * cibo-14b BR55004010]: Car Owner Details (Full Name, ID No, Gender, Email, Mobile Phone No, Correspondence
   * Address, Tax Identification Number (TIN)), More Info (Platform, Agency, Agency No., Agency PIAM ID, Last
   * Update, Cover Note Issuance Date, Submission status to JPJ), insurer box (Insurer, Plan, Market Value
   * Coverage, Coverage Period, Cover Note No, Policy No; Basic Premium … Total Premium; Add-ons), Payment
   * Details (Receipt No, Payment History, Payment Method, Payment Ref ID).
   */
  label(text: string) {
    return this.page.getByText(text, { exact: true }).filter({ visible: true }).first();
  }

  /** The status badge beside the document buttons ("Insurance created", "Failed", …). Reads only. */
  async status(): Promise<string> {
    const body = await this.page.locator("body").innerText();
    const known = ["Insurance created", "Pending payment", "Pending approval", "Failed", "Cancelled", "Quotation expired", "Quotation"];
    const k = body.indexOf("Ref. No:");
    const head = k < 0 ? body.slice(0, 600) : body.slice(k, k + 300);
    return known.find((s) => head.includes(s)) ?? "";
  }

  /** The status badge as a locator (to outline it). */
  statusBadge(text: string) {
    return this.page.getByText(text, { exact: true }).filter({ visible: true }).first();
  }

  /** A document button by its name (e-Certificate, Receipt …), visible only. */
  documentButton(name: RegExp) {
    return this.page.getByRole("button", { name }).filter({ visible: true }).first();
  }

  /** The visible document buttons (e-Certificate, Receipt, Certificate of Insurance, Policy Schedule). */
  async documentButtons(): Promise<string[]> {
    const all = (await this.page.getByRole("button").filter({ visible: true }).allInnerTexts()).map(clean);
    return all.filter((b) => /e-Certificate|Receipt|Certificate of Insurance|Policy Schedule/i.test(b));
  }

  /** Press Receipt and return the PDF download (it downloads directly). */
  @step("Download the receipt from CIBO Transaction Details")
  async downloadReceipt(): Promise<Download> {
    const btn = this.page.getByRole("button", { name: /Receipt/ }).filter({ visible: true }).first();
    await this.requireVisible(btn, "Receipt");
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 60_000 }), btn.click()]);
    return dl;
  }

  // ---------------------------------------------------------------- added 29.10.2026 for EAINT-12406 sheet RC
  // Probes (read only) cr/EAINT-12406/03-spec/probes-automation/rc-cibo-markup.mjs (BR55004010, Insurance created)
  // and rc-cibo-markup2.mjs (BR44003678, Pending payment).

  /**
   * The value of a label / value row: `div.row` > `div.col-sm-5.text-muted` "<label>" + `div.col-sm-7` value, e.g.
   * "Platform", "Agency", "Agency No.", "Agency PIAM ID" (More Info), "Cover Note No", "Policy No", "Insurer"
   * (insurer box). Exact label, first match; text "" and an empty locator when absent.
   */
  async field(label: string): Promise<{ text: string; locator: Locator }> {
    const q = label.includes("'") ? `"${label}"` : `'${label}'`;
    const loc = this.page.locator(`xpath=//div[contains(concat(' ', normalize-space(@class), ' '), ' text-muted ') and normalize-space(.)=${q}]/following-sibling::div[1]`).first();
    const text = (await loc.count()) ? clean(await loc.innerText()) : "";
    return { text, locator: loc };
  }

  /**
   * The insurer box's "Total Premium": `div.row.mb-2` > `div.col.h5` "Total Premium" + `div.col-auto.h4` "RM…"
   * (not a text-muted row) [probe rc-details-premium8.mjs, BR55004010].
   */
  async totalPremium(): Promise<{ text: string; locator: Locator }> {
    const loc = this.page.locator(`xpath=//div[contains(concat(' ', normalize-space(@class), ' '), ' h5 ') and normalize-space(.)='Total Premium']/following-sibling::div[1]`).first();
    return { text: (await loc.count()) ? clean(await loc.innerText()) : "", locator: loc };
  }

  /** The logo image(s) in the insurer box: Allianz = `./assets/images/bank-logo/allianz.png`, alt "Allianz logo". */
  async insurerLogo(): Promise<{ src: string; alt: string; locator: Locator } | null> {
    const img = this.insurerBox().locator("img").filter({ visible: true }).first();
    if (!(await img.count())) return null;
    return { src: (await img.getAttribute("src")) ?? "", alt: (await img.getAttribute("alt")) ?? "", locator: img };
  }

  /**
   * How the Insurer value is laid out: its text, whether the company number is in its own element / after a line
   * break (structure), and whether it is drawn on a LOWER line than the start of the name (what the eye sees, the
   * value wraps). On BR55004010 after the deploy the value is ONE div "Allianz … Berhad 200601015674 (735426-V)"
   * [rc-cibo-markup 29.10.2026]; REQ-011 says "below the name" (Q42). Reads only.
   */
  async insurerLayout(numberPattern = /\d{12}\s*\([0-9A-Z-]+\)/): Promise<{ text: string; numberSeparate: boolean; numberOnLowerLine: boolean }> {
    const { locator } = await this.field("Insurer");
    if (!(await locator.count())) return { text: "", numberSeparate: false, numberOnLowerLine: false };
    return locator.evaluate(
      (el, src) => {
        const re = new RegExp(src);
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        const html = el.innerHTML;
        const numberSeparate = /<br/i.test(html) || Array.from(el.children).some((c) => re.test(c.textContent || "") && !re.test((c.textContent || "").replace(re, "")) && getComputedStyle(c).display !== "inline");
        // visual: top of the first character vs top of the number
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
        const topOf = (node: Text, i: number) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return r.getBoundingClientRect().top; };
        const first = nodes.find((n) => (n.textContent || "").trim());
        let numberTop = NaN;
        for (const n of nodes) { const m = re.exec(n.textContent || ""); if (m) { numberTop = topOf(n, m.index); break; } }
        const startTop = first ? topOf(first, (first.textContent || "").search(/\S/)) : NaN;
        return { text, numberSeparate, numberOnLowerLine: !Number.isNaN(numberTop) && !Number.isNaN(startTop) && numberTop > startTop + 2 };
      },
      numberPattern.source,
    );
  }

  /**
   * The transaction's status badge (`span.badge.fs-14` beside the Ref. No.): its text, classes, colours and
   * whether it carries an icon (a tick). Insurance created = `ok-badge`; Pending payment = `pending-badge`,
   * background rgb(251, 255, 194), text rgb(148, 127, 41), no icon [rc-cibo-markup2, BR44003678].
   */
  async statusBadgeInfo(): Promise<{ text: string; cls: string; background: string; color: string; hasIcon: boolean; locator: Locator }> {
    const loc = this.page.locator("span.badge.fs-14").filter({ visible: true }).first();
    if (!(await loc.count())) return { text: "", cls: "", background: "", color: "", hasIcon: false, locator: loc };
    const info = await loc.evaluate((e) => ({
      text: (e.textContent || "").replace(/\s+/g, " ").trim(),
      cls: e.className,
      background: getComputedStyle(e).backgroundColor,
      color: getComputedStyle(e).color,
      hasIcon: !!e.querySelector("i, svg, img"),
    }));
    return { ...info, locator: loc };
  }
}
