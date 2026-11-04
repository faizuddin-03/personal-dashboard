/**
 * Secarang — what every screen of the public car-insurance site shares, and the one function that says which
 * screen is up.
 *
 * Ported from Faizuddin's secarang-insurance automation (commit c9aab16), with his OK, 28.10.2026 (via Azfar).
 * Rewritten to this repo's shape; selectors he saw on /ia/ are marked [F], selectors seen in our own walks of
 * 28.10.2026 are marked [W] (cr/EAINT-12406/04-explore/2026-10-28-before-deploy/README.md, 03-spec/before-run/),
 * facts from the team doc "Secarang & CIBO QA Knowledge" are marked [doc §n]
 * (cr/EAINT-12406/00-input/secarang-cibo-qa-knowledge-doc.txt).
 *
 * The site is an Angular single-page app (base `/ia/`). Two traps every object here respects:
 *  - **hidden responsive duplicates**: the page renders a second, hidden copy of the quotation cards and the
 *    bank grid [doc §13]. Act on VISIBLE elements only (`.filter({ visible: true })`).
 *  - **pop-ups are `ngb-modal-window`** [W] (the message box inside is `app-info-modal` [F]). A promo pop-up
 *    covers Home on arrival [W]; answers to Get quotation come as pop-ups too.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";

/** The three information pages of the top menu. */
export type SecarangMenu = "About Us" | "FAQs" | "Support";

/** Computed look of an element, for "same font / size / colour as …" checks. */
export interface SecarangLook {
  tag: string;
  cls: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  color: string;
  textAlign: string;
  backgroundColor: string;
  display: string;
  listStyleType: string;
  outline: string;
  border: string;
}

/** Read the computed look of the first element a locator resolves to. */
export async function lookOf(el: Locator): Promise<SecarangLook> {
  return el.first().evaluate((e) => {
    const c = getComputedStyle(e);
    return {
      tag: e.tagName,
      cls: (e as HTMLElement).className,
      fontFamily: c.fontFamily,
      fontSize: c.fontSize,
      fontWeight: c.fontWeight,
      color: c.color,
      textAlign: c.textAlign,
      backgroundColor: c.backgroundColor,
      display: c.display,
      listStyleType: c.listStyleType,
      outline: `${c.outlineStyle} ${c.outlineWidth}`,
      border: `${c.borderTopStyle} ${c.borderTopWidth} ${c.borderTopColor}`,
    };
  });
}

/** Collapse whitespace (incl. NBSP) and trim. */
export const clean = (x: string | null | undefined): string => String(x ?? "").replace(/[\s ]+/g, " ").trim();

/**
 * Which Secarang screen is showing. `popup:*` = a pop-up answered the last action:
 *  - `no-quote`      "Ops, there is no instant quotation available from our insurers…" [W, doc §3]
 *  - `vehicle`       "Sorry, we're unable to retrieve your vehicle information." [W, doc §3]
 *  - `visitor-form`  the two-month-rule pop-up asking name / email / mobile [W: code read 28.10.2026]. Filling it
 *                    creates a CIBO Visitor Management lead, so nothing here fills it
 *  - `leave`         "Kindly confirm your navigation" [doc §3]
 *  - `other`         any other pop-up (its text is in `text`)
 */
export type SecarangScreen =
  | "site-gate"
  | "loading"
  | "home"
  | "car-details"
  | "quotations"
  | "add-ons"
  | "confirmation"
  | "payment"
  | "success"
  | "popup:no-quote"
  | "popup:vehicle"
  | "popup:visitor-form"
  | "popup:leave"
  | "popup:other"
  | "unknown";

export abstract class SecarangPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** The top visible pop-up. */
  modal(): Locator {
    return this.page.locator("ngb-modal-window").filter({ visible: true }).last();
  }

  async modalText(): Promise<string> {
    if (!(await this.modal().count())) return "";
    return clean(await this.modal().innerText().catch(() => ""));
  }

  /**
   * Close the promo pop-up Home shows on arrival ("Renew your insurance with Secarang … Renew Now") with its X
   * [W: `ngb-modal-window button.close`]. Returns its text, or "" when none was up.
   */
  async closePromo(): Promise<string> {
    const modal = this.modal();
    if (!(await modal.isVisible().catch(() => false))) return "";
    const text = await this.modalText();
    const x = modal.locator("button.close, [aria-label='Close'], .btn-close").first();
    if (await x.isVisible().catch(() => false)) await x.click();
    else await this.page.keyboard.press("Escape");
    await modal.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
    return text;
  }

  /** The visible button of a pop-up whose name matches, e.g. OK [W: "… OK"]. */
  modalButton(name: RegExp): Locator {
    return this.modal().getByRole("button", { name }).filter({ visible: true }).first();
  }

  protected async body(): Promise<string> {
    return this.page.locator("body").innerText().catch(() => "");
  }

  /** Scroll the whole page top to bottom and back, so anything drawn on scroll is drawn (as the 28.10 BEFORE capture did). */
  async scrollThrough(): Promise<void> {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(600);
  }

  // ------------------------------------------------------------ top menu (About Us, FAQs, Support)

  /**
   * A top-menu link. The page renders the menu twice: a slide-in `.sidenav` copy (off screen at x≈-1870 on a
   * desktop window, so a click on it times out) and the desktop bar `nav.main-navbar a.nav-link`
   * [probe cr/EAINT-12406/03-spec/probes-automation/cp-pages-probe.mjs, 29.10.2026: href /ia/about-us, /ia/faq,
   * /ia/support]. Only the desktop bar is used.
   */
  menuLink(name: SecarangMenu): Locator {
    return this.page.locator("nav.main-navbar a.nav-link").filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();
  }

  /** Every element inside the desktop menu links that paints a background (a mockup "dot" would) [probe 29.10.2026]. */
  async menuMarks(): Promise<string[]> {
    return this.page.locator("nav.main-navbar a.nav-link *").evaluateAll((els) =>
      els
        .filter((e) => {
          const c = getComputedStyle(e);
          return c.backgroundColor !== "rgba(0, 0, 0, 0)" && c.backgroundColor !== "transparent";
        })
        .map((e) => `${e.tagName}.${e.className} bg ${getComputedStyle(e).backgroundColor}`),
    );
  }

  // ------------------------------------------------------------ the expand / collapse blocks (FAQs, Support)

  /**
   * The site's expand / collapse block, `app-collapsable` [probe 29.10.2026], used by FAQs (one per question) and
   * Support (one per insurer): header `.collapsable-header[aria-expanded]` holding the title and an icon
   * `i.bi-plus-lg` (closed) / `i.bi-dash` (open); body `div.collapse` (`.show` when open) holding
   * `[collapsable-content]`. No hidden duplicate copies of these were found on FAQs or Support (probe: one header
   * per question, three per Support page), so no visibility filter (an `app-collapsable` host is an inline custom
   * element and need not have a box of its own).
   */
  collapsables(): Locator {
    return this.page.locator("app-collapsable");
  }

  collapsableHeader(block: Locator): Locator {
    return block.locator(".collapsable-header").first();
  }

  collapsableIcon(block: Locator): Locator {
    return this.collapsableHeader(block).locator("i.bi").first();
  }

  collapsableContent(block: Locator): Locator {
    return block.locator("[collapsable-content]").first();
  }

  async isOpen(block: Locator): Promise<boolean> {
    return (await this.collapsableHeader(block).getAttribute("aria-expanded")) === "true";
  }

  /** Open or close one block by clicking its header; returns the header's aria-expanded after the click. */
  async setOpen(block: Locator, open: boolean): Promise<boolean> {
    if ((await this.isOpen(block)) !== open) {
      await this.collapsableHeader(block).scrollIntoViewIfNeeded();
      await this.collapsableHeader(block).click();
      await expect(this.collapsableHeader(block)).toHaveAttribute("aria-expanded", String(open), { timeout: 5_000 }).catch(() => undefined);
      await this.page.waitForTimeout(400); // the body's collapse animation
    }
    return this.isOpen(block);
  }

  /** Open every block on the page (as the BEFORE capture of 12406_CP_TS8 did). Returns how many there are. */
  async openAll(): Promise<number> {
    const all = this.collapsables();
    const n = await all.count();
    for (let i = 0; i < n; i++) await this.setOpen(all.nth(i), true);
    return n;
  }

  /**
   * Review marks a mockup draws on a changed block, if any reached the site: `<mark>`, a pill text ("Changed: …",
   * "New", "New section", "New sentence"), a painted background other than white, a dashed / solid outline, or a
   * dashed border, on the block or anything inside it. Returns one description per mark found ([] = none).
   * The mockup's own marks: `mark.chg` (#fff3a3), `.lbl` pills (#e8590c), `.chgbox` (#fffbe6 + dashed outline)
   * (00-input/Mock Up_EAINT-12406_Secarang_20261015.html).
   * `textOnly` = only `<mark>` and pill texts (for a whole page, whose footer and loading spinner paint backgrounds:
   * probe cp-marks-probe.mjs 29.10.2026).
   */
  async reviewMarks(scope: Locator, textOnly = false): Promise<string[]> {
    return scope.evaluateAll((roots, textOnly) => {
      const found: string[] = [];
      const pill = /^(Changed:.*|New|New section|New sentence)$/i;
      for (const root of roots) {
        for (const e of [root, ...Array.from(root.querySelectorAll("*"))]) {
          const c = getComputedStyle(e);
          const name = `${e.tagName.toLowerCase()}${(e as HTMLElement).className ? "." + String((e as HTMLElement).className).trim().replace(/\s+/g, ".") : ""}`;
          const own = Array.from(e.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
          if (e.tagName === "MARK") found.push(`<mark> ${name} "${(e.textContent ?? "").trim().slice(0, 60)}"`);
          if (own && pill.test(own)) found.push(`pill text "${own}" on ${name}`);
          if (textOnly) continue;
          const bg = c.backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== "rgb(255, 255, 255)") found.push(`background ${bg} on ${name}`);
          if (c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0 && e !== document.activeElement) found.push(`outline ${c.outlineStyle} ${c.outlineWidth} on ${name}`);
          for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
            if ((c as unknown as Record<string, string>)[`border${side}Style`] === "dashed") { found.push(`dashed border on ${name}`); break; }
          }
        }
      }
      return found;
    }, textOnly);
  }

  /** The icon class of a block's header, e.g. "bi bi-plus-lg float-right". */
  async iconClass(block: Locator): Promise<string> {
    return (await this.collapsableIcon(block).getAttribute("class")) ?? "";
  }

  /** The first visible match, failing by name when there is none (BasePage.requireVisible on visible only). */
  protected async visible(locator: Locator, what: string, timeout = 30_000): Promise<Locator> {
    return this.requireVisible(locator.filter({ visible: true }), what, timeout);
  }

  // ---------------------------------------------------------------- info pop-ups (29.10.2026, EAINT-12406)
  // Plan Details, the Excess 'i' and the agent / PIAM 'i' (probe cr/EAINT-12406/03-spec/probes-automation/
  // confirmation-controls.probe.spec.ts, staging /ia/ 29.10.2026). What each opens (a pop-up `ngb-modal-window`, a
  // popover or a tooltip) is read, not assumed: `openInfo` says which.

  /** The visible info box that is up: a pop-up, a popover or a tooltip (topmost last). */
  infoBox(): Locator {
    return this.page
      .locator("ngb-modal-window, ngb-popover-window, ngb-tooltip-window, .popover.show, .tooltip.show")
      .filter({ visible: true })
      .last();
  }

  /**
   * Press `trigger` (an 'i' icon, a "Plan Details" link) and read what it opens; if a click opens nothing within
   * 4 s, hover it (a tooltip). Reads only: nothing inside is pressed. The box is left OPEN for a screenshot;
   * `closeInfo()` closes it. `links` = every link inside with its address (the insurer's documents).
   */
  async openInfo(trigger: Locator, what: string): Promise<SecarangInfo> {
    const t = await this.requireVisible(trigger.filter({ visible: true }).first(), what);
    await t.scrollIntoViewIfNeeded().catch(() => undefined);
    const box = this.infoBox();
    await t.click();
    let via: SecarangInfo["via"] = "click";
    let up = await box.waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(() => false);
    if (!up) {
      await t.hover();
      via = "hover";
      up = await box.waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(() => false);
    }
    if (!up) return { what, via, kind: "none", text: "", links: [] };
    await this.page.waitForTimeout(600); // let the content finish drawing
    const kind = await box.evaluate((e) => {
      const n = e.tagName.toLowerCase();
      return n === "ngb-modal-window" ? "modal" : n.includes("popover") || e.classList.contains("popover") ? "popover" : "tooltip";
    }) as SecarangInfo["kind"];
    const text = clean(await box.innerText().catch(() => ""));
    const links = await box.locator("a[href]").evaluateAll((as) =>
      as.map((a) => ({ text: ((a as HTMLElement).innerText || "").replace(/\s+/g, " ").trim(), href: (a as HTMLAnchorElement).href })),
    );
    return { what, via, kind, text, links };
  }

  /**
   * The VISIBLE link named `text` (whole text, any case) inside the info box that is up. Plan Details lists every
   * document link twice (fx5 verify run 29.10.2026: `openInfo` read 8 links for 4 documents), so only visible ones
   * are matched. Added 29.10.2026 for 12406_QT_TS7; not on any flow stop's path.
   */
  infoLink(text: string): Locator {
    const esc = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return this.infoBox().locator("a[href]").filter({ visible: true }).filter({ hasText: new RegExp(`^\\s*${esc}\\s*$`, "i") }).first();
  }

  /** Close what `openInfo` opened: the pop-up's Close / X, else Escape; a tooltip goes when the mouse leaves. */
  async closeInfo(): Promise<void> {
    const box = this.infoBox();
    if (!(await box.isVisible().catch(() => false))) return;
    const x = box
      .locator("button.close, button.btn-close, [aria-label='Close']")
      .or(box.getByRole("button", { name: /^\s*Close\s*$/i }))
      .filter({ visible: true })
      .first();
    if (await x.isVisible().catch(() => false)) await x.click();
    else await this.page.keyboard.press("Escape");
    await this.page.mouse.move(5, 5);
    await box.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
  }
}

/** What an info trigger opened (see `SecarangPage.openInfo`). */
export interface SecarangInfo {
  what: string;
  via: "click" | "hover";
  kind: "modal" | "popover" | "tooltip" | "none";
  text: string;
  links: { text: string; href: string }[];
}

/** Reads only. Which screen is up right now (see `SecarangScreen`). */
export async function secarangScreen(page: Page): Promise<{ screen: SecarangScreen; text: string }> {
  const url = page.url();
  const text = await page.locator("body").innerText().catch(() => "");
  const modal = page.locator("ngb-modal-window").filter({ visible: true }).last();
  if (await modal.isVisible().catch(() => false)) {
    const m = clean(await modal.innerText().catch(() => ""));
    // [W] the visitor form is the pop-up with mobile / email inputs (03-spec/before-run/ts-before.mjs)
    if (await modal.locator("input[formcontrolname='mobileNo'], input[formcontrolname='email']").first().isVisible().catch(() => false)) {
      return { screen: "popup:visitor-form", text: m };
    }
    if (/no instant quotation/i.test(m)) return { screen: "popup:no-quote", text: m };
    if (/unable to retrieve your vehicle information/i.test(m)) return { screen: "popup:vehicle", text: m };
    if (/confirm your navigation/i.test(m)) return { screen: "popup:leave", text: m };
    // The Home promo pop-up is not an answer to anything: report the page under it.
    if (!/Renew your insurance/i.test(m)) return { screen: "popup:other", text: m };
  }
  if (/\/auth\/login/.test(url) && (await page.locator("input[type=password]").filter({ visible: true }).count()) > 0) {
    return { screen: "site-gate", text: "" };
  }
  if (/Bear with us/i.test(text)) return { screen: "loading", text: "" }; // [doc §3] the quote loader
  if (/Thank you for your purchase|payment successful/i.test(text)) return { screen: "success", text: "" }; // [F, doc §3]
  if ((await page.locator("input[formcontrolname='paymentType']").count()) > 0) return { screen: "payment", text: "" }; // [F]
  if (await page.locator("input[formcontrolname='phoneNo']").filter({ visible: true }).count()) return { screen: "confirmation", text: "" }; // [F]
  if (await page.locator(".addon-card").filter({ visible: true }).count()) return { screen: "add-ons", text: "" }; // [F]
  if (await page.locator(".insurance-card").filter({ visible: true }).count()) return { screen: "quotations", text: "" }; // [F]
  if (
    (await page.locator("app-confirm-details").filter({ visible: true }).count()) > 0 || // [F]
    /Are these your vehicle details/i.test(text) // [W, doc §3]
  ) {
    return { screen: "car-details", text: "" };
  }
  if (/Buy your car insurance here/i.test(text)) return { screen: "home", text: "" }; // [W]
  return { screen: "unknown", text: clean(text).slice(0, 300) };
}
