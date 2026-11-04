/**
 * Secarang — Home (`/ia/car-insurance`): "Buy your car insurance here" with tabs **Private Car** (Car Plate No.,
 * Owner IC No., Postal Code (Car Location)) and **Company Car** (Car Plate No., Company SSM No., Postal Code),
 * then the green "Get quotation" [W 28.10.2026]. There is NO Car / Motorcycle tab on /ia/ and no
 * `/ia/motorcycle-insurance` page [W]. Insurer logos sit under "Great teamwork makes the dream work" [W].
 *
 * Ported from Faizuddin's HomePage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026. Changed:
 *  - his form was filled BY POSITION (three bare inputs); today the inputs carry `formcontrolname` plateNo /
 *    idNo (Company Car: companyRoc) / postalCode [W; probe 28.10.2026], so they are found by name, inside the visible form that holds "Get quotation" [W:
 *    03-spec/before-run/ts-before.mjs]. Every value is still read back, because a wrong field is the known trap
 *    [doc §13];
 *  - his Car / Motorcycle step is dropped (no such tab today) and his owner-type guessing (radio by index,
 *    "Commercial", "Corporate" …) is replaced by the two tab names the page shows;
 *  - the promo pop-up on arrival is closed first [W] (his code did not meet it).
 */

import { expect, type Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { secarangURL } from "@config/environments";
import { SecarangPage } from "./secarang.page";
import { SecarangSiteGatePage } from "./site-gate.page";

/** The site's public entry point; every other screen is reached by clicking. */
export const SECARANG_HOME = "car-insurance";

export type SecarangOwnerTab = "Private Car" | "Company Car";

/** One Home insurer logo as `logoRow()` reads it. */
export interface SecarangLogo {
  /** The image file name, e.g. "allianz.png". */
  file: string;
  src: string;
  alt: string;
  /** The image loaded (complete, natural width above 0). */
  loaded: boolean;
  natural: string;
  width: number;
  height: number;
  x: number;
  y: number;
  /** Distinct colours painted (4-bit per channel); -1 = could not be read. */
  colours: number;
}

/** The insurer a Home logo file stands for, by its file name; "" when the name matches no known insurer. */
export function insurerOfLogo(file: string): string {
  const f = file.toLowerCase();
  if (/lonpac/.test(f)) return "Lonpac";
  if (/allianz/.test(f)) return "Allianz";
  if (/tokio/.test(f)) return "Tokio Marine";
  if (/rhb/.test(f)) return "RHB";
  if (/chubb/.test(f)) return "Chubb";
  if (/zurich/.test(f)) return "Zurich";
  if (/etiqa/.test(f)) return "Etiqa";
  if (/takaful/.test(f)) return "Takaful";
  return "";
}

export interface SecarangQuoteForm {
  /** Car Plate No. */
  plateNo: string;
  /** Owner IC No. (Private Car, typed without dashes) or Company SSM No. (Company Car). */
  idNo: string;
  /** Postal Code (Car Location). */
  postalCode: string;
}

export class SecarangHomePage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  /** The visible quote form: the `<form>` holding "Get quotation" [W]. */
  form() {
    return this.page
      .locator("form")
      .filter({ visible: true })
      .filter({ has: this.page.getByRole("button", { name: /Get quotation/i }) })
      .first();
  }

  /**
   * A form field. `idNo` is the second field of whichever tab is open: `formcontrolname="idNo"` (Owner IC No.)
   * on Private Car, `formcontrolname="companyRoc"` (Company SSM No.) on Company Car [probe
   * cr/EAINT-12406/03-spec/probes-automation/home-form-controls.mjs, 28.10.2026].
   */
  input(name: keyof SecarangQuoteForm) {
    const css = name === "idNo" ? `input[formcontrolname="idNo"], input[formcontrolname="companyRoc"]` : `input[formcontrolname="${name}"]`;
    return this.form().locator(css).filter({ visible: true }).first();
  }

  getQuotationButton() {
    return this.form().getByRole("button", { name: /Get quotation/i }).filter({ visible: true }).first();
  }

  /** Insurer logos on Home, `img[src*="insurance-logo"]` [W] (e.g. lonpac-logo.png, tokiomarine.png). */
  insurerLogos() {
    return this.page.locator("img[src*='insurance-logo']").filter({ visible: true });
  }

  /**
   * The visible insurer logos left to right, each with its file name, whether the image loaded, its drawn size and
   * how many distinct colours it paints (a blank box paints 1–2). The page holds 9 logo `<img>`, 3 visible and 6
   * hidden responsive copies; every logo's `alt` is the same "Insurance logo", so the FILE NAME names the insurer:
   * lonpac-logo.png, allianz.png, tokiomarine.png [probe cp-pages-probe.mjs 29.10.2026; BEFORE 28.10.2026:
   * lonpac-logo.png, tokiomarine.png].
   *
   * Read only once the logos have stopped moving (`logosSettled`), and ordered row by row, left to right (x) within
   * a row. Fixed 29.10.2026 (cr-author, triage of 12406_CP_TS1 / CP_TS8, run 13:19): the logos slide into place when
   * scrolled to, and the old version scrolled to and read each one in turn with no wait, then sorted by y first, so
   * one row read mid-animation (Lonpac y1400, Allianz y1349, Tokio Marine y1300; settled y1300 for all) came out
   * Tokio Marine, Allianz, Lonpac while the screen showed Lonpac, Allianz, Tokio Marine. Throws if the logos move
   * while they are being read. How they move [probe cr/EAINT-12406/03-spec/probes-automation/home-logo-row.mjs,
   * 29.10.2026]: each logo card is an AOS "fade-up" (`div.card ... aos-init`, `data-aos-delay`): on scroll it waits
   * about 1 s at +100 px with opacity 0 (box STILL), then slides up and fades in for about 1.3 s (CSS transitions on
   * the card). So a still box alone is not "settled": `logosSettled` also waits for every logo to be fully opaque.
   * The "Insurance Partner" line on the Tokio Marine logo is inside its image file: settled, all three boxes share
   * y1300 (163/169 x 60).
   */
  @step("Read the Home insurer logos")
  async logoRow(): Promise<SecarangLogo[]> {
    const logos = this.insurerLogos();
    const settled = await this.logosSettled();
    const n = await logos.count();
    const out: SecarangLogo[] = [];
    for (let i = 0; i < n; i++) {
      const img = logos.nth(i);
      out.push(
        await img.evaluate((el) => {
          const e = el as HTMLImageElement;
          const r = e.getBoundingClientRect();
          let colours = 0;
          try {
            const c = document.createElement("canvas");
            c.width = Math.max(1, Math.min(200, e.naturalWidth));
            c.height = Math.max(1, Math.round((c.width * e.naturalHeight) / Math.max(1, e.naturalWidth)));
            const g = c.getContext("2d")!;
            g.drawImage(e, 0, 0, c.width, c.height);
            const d = g.getImageData(0, 0, c.width, c.height).data;
            const seen = new Set<number>();
            for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 16) seen.add(((d[k] >> 4) << 8) | ((d[k + 1] >> 4) << 4) | (d[k + 2] >> 4));
            colours = seen.size;
          } catch {
            colours = -1; // canvas refused (cross-origin): unknown
          }
          const src = e.getAttribute("src") ?? "";
          return {
            file: src.split("/").pop() ?? src,
            src,
            alt: e.getAttribute("alt") ?? "",
            loaded: e.complete && e.naturalWidth > 0,
            natural: `${e.naturalWidth}x${e.naturalHeight}`,
            width: Math.round(r.width),
            height: Math.round(r.height),
            x: Math.round(r.x + scrollX),
            y: Math.round(r.y + scrollY),
            colours,
          };
        }),
      );
    }
    const after = await this.logoBoxes();
    if (after.boxes !== settled) {
      throw new Error(`The Home insurer logos moved while they were being read (settled ${settled}, after ${after.boxes}): their order cannot be judged from this read.`);
    }
    // Rows: logos whose vertical centres lie within half a logo height of each other share a row. Rows top to
    // bottom, then left to right (x) inside each row; on the desktop page all logos share one row.
    const mid = (l: SecarangLogo) => l.y + l.height / 2;
    const rows: SecarangLogo[][] = [];
    for (const l of [...out].sort((a, b) => mid(a) - mid(b))) {
      const row = rows.find((r) => r.some((o) => Math.abs(mid(o) - mid(l)) <= Math.max(o.height, l.height) / 2));
      if (row) row.push(l);
      else rows.push([l]);
    }
    return rows.flatMap((r) => r.sort((a, b) => a.x - b.x));
  }

  /**
   * Every visible logo's box (page coordinates), how many finite animations / transitions still run on a logo or its
   * ancestors, how many logos are not yet fully shown (opacity of the logo and its ancestors multiplied below 0.99:
   * the AOS card before / while it fades in), and how many are out of view.
   */
  private async logoBoxes(): Promise<{ boxes: string; moving: number; faded: number; outOfView: number }> {
    return this.insurerLogos().evaluateAll((els) => {
      const boxes = els
        .map((e) => {
          const r = e.getBoundingClientRect();
          return `${Math.round(r.x + scrollX)},${Math.round(r.y + scrollY)},${Math.round(r.width)}x${Math.round(r.height)}`;
        })
        .join(" | ");
      const moving = document.getAnimations().filter((a) => {
        if (a.playState !== "running") return false;
        if (a.effect?.getComputedTiming().iterations === Infinity) return false; // a loop never ends; the box check still applies
        const t = (a.effect as KeyframeEffect | null)?.target;
        return t instanceof Element && els.some((e) => t === e || t.contains(e));
      }).length;
      const faded = els.filter((e) => {
        let o = 1;
        for (let p: Element | null = e; p; p = p.parentElement) o *= Number(getComputedStyle(p).opacity);
        return o < 0.99;
      }).length;
      const outOfView = els.filter((e) => {
        const r = e.getBoundingClientRect();
        return r.bottom <= 0 || r.top >= innerHeight;
      }).length;
      return { boxes, moving, faded, outOfView };
    });
  }

  /**
   * Bring the logos into view and wait until they stop moving: no finite animation / transition running on a logo
   * or its ancestors, every logo fully shown (opacity 1: an AOS card sits still but invisible during its delay), and
   * every logo's box the same on three reads 250 ms apart. Returns the settled boxes. Throws if they have not
   * settled within `timeout` (the order would be a guess). Call it before a proof that outlines the logos, so the
   * outline sits on them (CP_TS8 run 29.10.2026: the frame was drawn below the moving Lonpac logo).
   */
  @step("Wait for the Home insurer logos to stop moving")
  async logosSettled(timeout = 15_000): Promise<string> {
    const logos = this.insurerLogos();
    await logos.first().scrollIntoViewIfNeeded();
    if ((await this.logoBoxes()).outOfView) await logos.last().scrollIntoViewIfNeeded();
    const end = Date.now() + timeout;
    let last = "";
    let same = 0;
    let now = await this.logoBoxes();
    for (;;) {
      same = now.moving === 0 && now.faded === 0 && now.boxes === last ? same + 1 : 0;
      if (same >= 2) return now.boxes;
      if (Date.now() > end) {
        throw new Error(`The Home insurer logos did not stop moving within ${timeout} ms (last boxes ${now.boxes}; animations running: ${now.moving}; not fully shown: ${now.faded}; out of view: ${now.outOfView}).`);
      }
      last = now.boxes;
      await this.page.waitForTimeout(250);
      now = await this.logoBoxes();
    }
  }

  /**
   * The frame for a proof about the logo ROW: the nearest `.row` holding the first visible logo, which on the desktop
   * page is `div.row.justify-content-center` around all three logo cards (inside `div.d-none.d-xl-block`) [probe
   * home-logo-row.mjs 29.10.2026]. `ts.shot` outlines only the FIRST element a locator matches, so
   * `hl: insurerLogos()` framed Lonpac alone (CP_TS1 13:20 run); pass this instead. The verify test checks it holds
   * every visible logo. Call `logosSettled()` first so the frame is drawn where the logos end up.
   */
  logoRowFrame() {
    return this.insurerLogos().first().locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' row ')][1]");
  }

  /** The visible logo whose file name contains `file` (e.g. "allianz") [probe 29.10.2026: allianz.png]. */
  logoByFile(file: string) {
    return this.page.locator(`img[src*='insurance-logo/'][src*='${file}']`).filter({ visible: true }).first();
  }

  /** The block under "Great teamwork makes the dream work" that holds the logos [W 28.10.2026]. */
  logoSection() {
    return this.page
      .getByText("Great teamwork makes the dream work")
      .first()
      .locator("xpath=ancestor::*[.//img[contains(@src,'insurance-logo')]][1]");
  }

  /**
   * Open Home: the entry address, the site password page if it shows, then the promo pop-up closed.
   * Returns the promo's text ("" when there was none).
   */
  @step("Open Secarang Home")
  async open(): Promise<{ gatePassed: boolean; promo: string }> {
    await this.page.goto(secarangURL(SECARANG_HOME), { waitUntil: "domcontentloaded" });
    const gatePassed = await new SecarangSiteGatePage(this.page).passIfShown();
    await expect(this.page).toHaveURL(new RegExp(`/${SECARANG_HOME}`), { timeout: 60_000 });
    await this.visible(this.page.getByText("Buy your car insurance here"), "Buy your car insurance here", 60_000);
    // The promo arrives a moment after the page; wait briefly for it so it does not cover the first click.
    await this.modal().waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    const promo = await this.closePromo();
    return { gatePassed, promo };
  }

  @step("Choose the owner tab")
  async chooseTab(tab: SecarangOwnerTab): Promise<void> {
    await (await this.visible(this.page.getByText(tab, { exact: true }), `${tab} tab`)).click();
    // Company Car swaps the second field for Company SSM No. (companyRoc); wait for the tab's own field.
    const second = tab === "Company Car" ? "companyRoc" : "idNo";
    await this.form().locator(`input[formcontrolname="${second}"]`).filter({ visible: true }).first().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Type the three fields and read each back; throws naming the field that did not take its value. */
  @step("Fill the quote form")
  async fill(f: SecarangQuoteForm): Promise<SecarangQuoteForm> {
    const got = {} as SecarangQuoteForm;
    for (const name of ["plateNo", "idNo", "postalCode"] as const) {
      const box = this.input(name);
      await this.requireVisible(box, `home form ${name}`);
      await box.click();
      await box.fill(f[name]);
      got[name] = await box.inputValue();
      if (got[name].replace(/[\s-]/g, "").toUpperCase() !== f[name].replace(/[\s-]/g, "").toUpperCase()) {
        throw new Error(`Home form ${name}: typed "${f[name]}" but the field reads "${got[name]}".`);
      }
    }
    return got;
  }

  @step("Press Get quotation")
  async getQuotation(): Promise<void> {
    const go = this.getQuotationButton();
    await this.requireVisible(go, "Get quotation");
    await expect(go).toBeEnabled({ timeout: 15_000 });
    await go.click();
  }
}
