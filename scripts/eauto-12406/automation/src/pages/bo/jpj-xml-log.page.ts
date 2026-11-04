/**
 * BackOffice — JPJ XML Log (APT): `view/apt/jpj/log` (Settings (Hub Admin) menu; knowledge/portals/backoffice/portal.md).
 *
 * READ-ONLY screen: the request / response XML eAuto exchanged with JPJ (eSim on staging) per APT step.
 * Every selector below was read off staging /uat1/ on 26.10.2026 by the read-only probe
 * cr/EAINT-12626/03-spec/probes/p02-bo-apt-details-xml-readonly.spec.ts (A60347839 / OQ000009):
 *   search  radio `#type` value vehicleNo (checked by default), `#vehicleNo`, `#to-search` "SEARCH Now"
 *   result  AJAX into `td#result`: a table, header `tr.header` (# | Vehicle | Type | Created At | JPJ Transaction ID |
 *           Response Data), one row per exchange, e.g. Type "6.0 APT (ATEnquiry)" / "6.0 APT (ATSubmission)"
 *   xml     `a.to-load-xml[data1=<id>]` "Click here to view xml content" loads the XML by AJAX
 *           (`ajax/apt/jpj/log/load-xml.do`) into `.xml-<id> textarea` and shows it
 * Paths are RELATIVE so the instance in `baseURL` is kept. The caller must be signed in as `bo`.
 * Added 26.10.2026 (cr-author, EAINT-12626 TS8 / TS9). UNVERIFIED (no run has used it yet).
 */
import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";

export const BO_APT_XML_LOG_PATH = "view/apt/jpj/log";

export interface XmlLogRow {
  no: string;
  vehicle: string;
  type: string;
  createdAt: string;
  jpjTransactionId: string;
  /** The `data1` of its "Click here to view xml content" link (what `loadXml` takes). */
  xmlId: string;
}

const clean = (x: string | null | undefined) => String(x ?? "").replace(/\s+/g, " ").trim();

export class BoAptXmlLogPage {
  constructor(private readonly page: Page) {}

  /** The result table (for highlighting). */
  get result() {
    return this.page.locator("#result table").first();
  }

  /** Open the log and search by Vehicle No.; waits (30 s) for a row of that vehicle. Returns whether one came. */
  @step("BO JPJ XML Log (APT): search by vehicle")
  async search(vehicleNo: string): Promise<boolean> {
    await this.page.goto(BO_APT_XML_LOG_PATH);
    await this.page.fill("#vehicleNo", vehicleNo);
    await this.page.click("#to-search");
    return this.page
      .locator("#result table tr", { hasText: vehicleNo })
      .first()
      .waitFor({ timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
  }

  /** The result rows, in the page's order (newest first on 26.10.2026). */
  async rows(): Promise<XmlLogRow[]> {
    const raw = await this.page.locator("#result table tr:not(.header)").evaluateAll((trs) =>
      trs.map((tr) => {
        const td = Array.from(tr.querySelectorAll(":scope > td")).map((c) => (c as HTMLElement).innerText);
        return { td, xmlId: tr.querySelector("a.to-load-xml")?.getAttribute("data1") ?? "" };
      }),
    );
    return raw
      .filter((r) => r.td.length >= 5)
      .map((r) => ({ no: clean(r.td[0]), vehicle: clean(r.td[1]), type: clean(r.td[2]), createdAt: clean(r.td[3]), jpjTransactionId: clean(r.td[4]), xmlId: r.xmlId }));
  }

  /** The row (for highlighting) whose link carries `xmlId`. */
  rowOf(xmlId: string) {
    return this.page.locator("#result table tr", { has: this.page.locator(`a.to-load-xml[data1="${xmlId}"]`) });
  }

  /** Press the row's "Click here to view xml content" and return the XML it shows (waits up to 20 s for it). */
  @step("BO JPJ XML Log (APT): view the XML")
  async loadXml(xmlId: string): Promise<string> {
    await this.page.locator(`a.to-load-xml[data1="${xmlId}"]`).click();
    const box = this.page.locator(`.xml-${xmlId} textarea`);
    await box.waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
    const read = async () => (await box.inputValue().catch(() => "")) || (await box.textContent().catch(() => "")) || "";
    for (let i = 0; i < 20; i++) {
      const v = await read();
      if (v.trim()) return v;
      await this.page.waitForTimeout(1_000);
    }
    return read();
  }
}
