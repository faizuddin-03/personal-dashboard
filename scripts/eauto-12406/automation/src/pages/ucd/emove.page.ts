import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";
import { UcdHomePage } from "./ucd-home.page";

/**
 * eMOVE (Logistics) — UCD portal: landing, Create New Logistics Steps 1-3, Logistics Transaction Listing, details.
 *
 * Selectors read off staging /uat3/ on 29-30.10.2026 (EAINT-12019 smoke probes p01-p08,
 * `cr/EAINT-12019/03-spec/probes-3010/`), from the live DOM and the page's own handlers, not guessed.
 *
 * The journey, as observed:
 *   UCD home tile `#emove` (LOGISTICS) → `view/ucd/emove/index.do` → "CREATE NEW LOGISTICS"
 *   → Step 1 `view/ucd/emove/create.do`: Vehicle No `#vehicleRegNo` + Search (`emSearch()`) fills Engine / Chassis
 *     (read-only) and Make & Model `#makeModel` / Year `#manufacturingYear` (insurer data, editable); Colour `#colour`,
 *     Vehicle Type `#vehicleType`; per leg (`pickup` / `dropoff`) a mode card (radio `<leg>Mode` DOOR | HUB, label
 *     click calls `emSetMode`), State `#<leg>State` (loads City `#<leg>City` or Hub `#<leg>HubId`), Postcode,
 *     Address (textarea), Contact Person, Contact No, Remarks; Preferred Pick-Up Date `#preferredPickupDate`
 *     (jQuery datepicker, tomorrow onwards); Next `#em-next`. A refusal comes as a jQuery UI dialog.
 *   → Next CREATES the request (EM6…, Pending) → Step 2 `view/ucd/emove/create/summary.do?id=<uuid>`: summary,
 *     Payment Summary, Save & Continue Later, Make Payment `#em-pay-btn` (or Retry after a failure, with
 *     Payment History above the summary).
 *   → Make Payment / Retry: dialog "Payment" "Sure to proceed with payment?" Back / Next. Next:
 *       paid  → Step 3 `view/ucd/emove/create/confirmation.do?id=` "Submission (Payment)", Payment Status OK
 *       RHB refused → stays on Step 2, dialog "Payment" with the bank text, OK (Retry shows after reload)
 *       tier price changed → dialog "Price Update Alert", Step 2 refreshed (`&repriced=1`), nothing paid
 *   → Listing `view/ucd/emove/listing.do`: `#vehicleRegNo`, "Search Now"; Action View | Resubmit | Cancel
 *     (Cancel → dialog "Cancel Transaction" "Are you sure you want to cancel transaction EM…?" No / Yes).
 *   → Details `view/ucd/emove/details.do?id=<uuid>`.
 */
export type Leg = "pickup" | "dropoff";

export interface DoorLeg {
  mode: "DOOR";
  state: string;
  /** Town as listed ("SHAH ALAM"); default the first town listed. */
  city?: string;
  postcode: string;
  address: string;
  contactPerson?: string;
  contactNo?: string;
  remarks?: string;
}
export interface HubLeg {
  mode: "HUB";
  state: string;
  /** Hub option text (contains); default the first hub listed. */
  hub?: string;
  contactPerson?: string;
  contactNo?: string;
}
export type LegInput = DoorLeg | HubLeg;

export interface DialogInfo {
  title: string;
  text: string;
}

export type PayOutcome =
  | { outcome: "paid"; status: string; submittedAt: string }
  | { outcome: "failed"; message: string }
  | { outcome: "repriced"; message: string }
  | { outcome: "other"; dialog?: DialogInfo; url: string };

export class UcdEmovePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ------------------------------------------------------------------ dialogs (jQuery UI)
  get dialog(): Locator {
    return this.page.locator(".ui-dialog:visible").last();
  }

  /** The visible dialog's title and text, or undefined. */
  async readDialog(): Promise<DialogInfo | undefined> {
    if (!(await this.dialog.isVisible().catch(() => false))) return undefined;
    const title = (await this.dialog.locator(".ui-dialog-title").innerText().catch(() => "")).trim();
    const text = (await this.dialog.locator(".ui-dialog-content").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    return { title, text };
  }

  async pressDialog(name: string | RegExp): Promise<void> {
    await this.dialog.locator(".ui-dialog-buttonpane button").filter({ hasText: name }).first().click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  // ------------------------------------------------------------------ landing + Step 1
  @step("Open Logistics from the UCD home tile")
  async openFromTile(): Promise<void> {
    // the home's campaign modals (e.g. #dialog-lkm-refund) cover the tile (verify r1, 30.10.2026)
    // the tile is on the dashboard only; a second journey in one test starts from wherever the first ended (verify r3)
    const home = new UcdHomePage(this.page);
    if (!(await this.page.locator("#emove").isVisible().catch(() => false))) await home.returnToDashboard();
    await home.settle();
    await this.page.locator("#emove").click();
    await expect(this.page).toHaveURL(/ucd\/emove\/index\.do/, { timeout: 30_000 });
  }

  @step("Open the Logistics landing")
  async gotoLanding(): Promise<void> {
    await this.page.goto("view/ucd/emove/index.do");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  @step("Create New Logistics")
  async startCreate(): Promise<void> {
    await this.page.locator("text=CREATE NEW LOGISTICS").first().click();
    await expect(this.page).toHaveURL(/ucd\/emove\/create\.do/, { timeout: 30_000 });
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /** Step 1 Search. Returns `{ found: true }` once Engine No is filled, or the refusal dialog. */
  @step("Step 1: search the vehicle")
  async searchVehicle(vehicleRegNo: string): Promise<{ found: true } | { found: false; dialog?: DialogInfo }> {
    await this.page.fill("#vehicleRegNo", vehicleRegNo);
    await this.page.locator("button:has-text('Search')").first().click();
    const filled = this.page.waitForFunction(() => !!(document.querySelector("#engineNo") as HTMLInputElement)?.value, null, { timeout: 60_000 }).then(() => "filled" as const);
    const refused = this.dialog.waitFor({ state: "visible", timeout: 60_000 }).then(() => "dialog" as const);
    const first = await Promise.race([filled, refused]).catch(() => "timeout" as const);
    // the fields fill while "Working..." is still up (verify r5 screenshot): wait for it to clear before returning
    await this.page.getByText("Working...", { exact: true }).first().waitFor({ state: "hidden", timeout: 60_000 }).catch(() => undefined);
    if (first === "filled" && !(await this.dialog.isVisible().catch(() => false))) return { found: true };
    return { found: false, dialog: await this.readDialog() };
  }

  async vehicleFields(): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const id of ["vehicleRegNo", "engineNo", "chassisNo", "makeModel", "manufacturingYear", "colour"]) {
      out[id] = await this.page.locator(`#${id}`).inputValue().catch(() => "");
    }
    out.vehicleType = (await this.page.locator("#vehicleType option:checked").innerText().catch(() => "")).trim();
    return out;
  }

  @step("Step 1: vehicle details")
  async fillVehicle(v: { colour?: string; vehicleType?: string; makeModel?: string; manufacturingYear?: string }): Promise<void> {
    if (v.makeModel !== undefined) await this.page.fill("#makeModel", v.makeModel);
    if (v.manufacturingYear !== undefined) await this.page.fill("#manufacturingYear", v.manufacturingYear);
    if (v.colour !== undefined) await this.page.fill("#colour", v.colour);
    if (v.vehicleType) await this.page.selectOption("#vehicleType", { label: v.vehicleType });
  }

  @step("Step 1: choose a leg's service")
  async chooseMode(leg: Leg, mode: "DOOR" | "HUB"): Promise<void> {
    const radio = this.page.locator(`input[name=${leg}Mode][value=${mode}]`);
    await radio.locator("xpath=ancestor::label[1]").click().catch(() => undefined);
    await this.page.waitForTimeout(500);
    if (!(await radio.isChecked())) {
      // the card label did not take (seen once in the smoke): set it the way the page's own onclick does
      await this.page.evaluate(([l, m]) => {
        (document.querySelector(`input[name=${l}Mode][value=${m}]`) as HTMLInputElement).checked = true;
        (window as any).emSetMode(l);
      }, [leg, mode]);
    }
    await expect(radio).toBeChecked();
  }

  @step("Step 1: fill a leg")
  async fillLeg(leg: Leg, l: LegInput): Promise<void> {
    await this.chooseMode(leg, l.mode);
    // option labels carry the state code: "SELANGOR (10)"
    const stateValue = await this.page.locator(`#${leg}State option`).filter({ hasText: new RegExp(`^\\s*${l.state}\\s*\\(`) }).first().getAttribute("value");
    if (!stateValue) throw new Error(`State "${l.state}" is not in the ${leg} State list`);
    await this.page.selectOption(`#${leg}State`, stateValue);
    await this.page.locator(`#${leg}State`).dispatchEvent("change");
    if (l.mode === "DOOR") {
      await this.page.waitForFunction((id) => (document.querySelector(id) as HTMLSelectElement).options.length > 1, `#${leg}City`, { timeout: 60_000 });
      if (l.city) await this.page.selectOption(`#${leg}City`, { label: l.city });
      else await this.page.selectOption(`#${leg}City`, { index: 1 });
      await this.page.fill(`#${leg}Postcode`, l.postcode);
      await this.page.fill(`#${leg}Address`, l.address);
      if (l.remarks !== undefined) await this.page.fill(`#${leg}Remarks`, l.remarks);
    } else {
      await this.page.waitForFunction((id) => (document.querySelector(id) as HTMLSelectElement).options.length > 1, `#${leg}HubId`, { timeout: 60_000 });
      if (l.hub) {
        const v = await this.page.locator(`#${leg}HubId option`).filter({ hasText: l.hub }).first().getAttribute("value");
        await this.page.selectOption(`#${leg}HubId`, v ?? "");
      } else await this.page.selectOption(`#${leg}HubId`, { index: 1 });
    }
    await this.page.fill(`#${leg}ContactPerson`, l.contactPerson ?? "Azfar QA Auto");
    await this.page.fill(`#${leg}ContactNo`, l.contactNo ?? "0100000099");
  }

  /** Preferred Pick-Up Date: the `nth` enabled day in the datepicker (0 = the earliest allowed, tomorrow). */
  @step("Step 1: preferred pick-up date")
  async pickDate(nth = 0): Promise<string> {
    await this.page.locator("#preferredPickupDate").click();
    await this.page.locator("#ui-datepicker-div td:not(.ui-datepicker-unselectable) a").nth(nth).click();
    return this.page.locator("#preferredPickupDate").inputValue();
  }

  /** Next on Step 1: CREATES the request. Returns its id, or the refusal dialog (nothing created). */
  @step("Step 1: Next")
  async next(): Promise<{ id: string } | { id?: undefined; dialog?: DialogInfo }> {
    await this.page.locator("#em-next").click();
    const ok = this.page.waitForURL(/summary\.do\?id=/, { timeout: 90_000 }).then(() => "step2" as const);
    const refused = this.dialog.waitFor({ state: "visible", timeout: 90_000 }).then(() => "dialog" as const);
    const first = await Promise.race([ok, refused]).catch(() => "timeout" as const);
    if (first === "step2") {
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      return { id: this.requestId()! };
    }
    return { dialog: await this.readDialog() };
  }

  requestId(): string | undefined {
    return /[?&]id=([0-9a-f-]{36})/.exec(this.page.url())?.[1];
  }

  // ------------------------------------------------------------------ Step 2
  @step("Open Step 2 of a request")
  async gotoStep2(id: string): Promise<void> {
    await this.page.goto(`view/ucd/emove/create/summary.do?id=${id}`);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  get payButton(): Locator {
    return this.page.locator("#em-pay-btn");
  }
  get retryButton(): Locator {
    return this.page.locator("button:visible, a:visible").filter({ hasText: /^\s*Retry\s*$/ }).first();
  }

  /** Step 2 as printed: label → value for the summary rows, plus the money lines and the history. */
  async readStep2(): Promise<{ fields: Record<string, string>; transactionNo: string; distanceKm?: number; money: Record<string, string>; total: string; paymentStatus: string; history: string[] }> {
    const body = await this.page.locator("body").innerText();
    const fields = await this.page.evaluate(() => {
      const out: Record<string, string> = {};
      const labels = Array.from(document.querySelectorAll("td, th, label, span, div")).filter((e) => /:\s*$/.test((e as HTMLElement).innerText ?? "") && e.children.length === 0);
      for (const l of labels) {
        const k = (l as HTMLElement).innerText.replace(/:\s*$/, "").trim();
        const v = (l.nextElementSibling as HTMLElement | null)?.innerText?.trim();
        if (k && v !== undefined && !(k in out)) out[k] = v;
      }
      return out;
    });
    const money: Record<string, string> = {};
    for (const m of body.matchAll(/^([A-Za-z][^\n:]{2,60}?)\s*:\s*\n?\s*(?:Distance [^\n]*\n\s*)?RM\s+([\d,]+\.\d{2})/gm)) money[m[1].trim()] = m[2];
    const total = /Total Amount Payable[^\n]*?RM\s+([\d,]+\.\d{2})/.exec(body.replace(/\t/g, " "))?.[1] ?? "";
    const dist = /Distance\s+([\d,.]+)\s*km/.exec(body)?.[1];
    const history = Array.from(body.matchAll(/\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}[ap]m - RHB \([^)]*\) - [^\n]+/g)).map((m) => m[0].trim());
    return {
      fields,
      transactionNo: /EM\d{9}/.exec(body)?.[0] ?? "",
      distanceKm: dist ? Number(dist.replace(/,/g, "")) : undefined,
      money,
      total,
      paymentStatus: /Payment Status:\s*([A-Za-z]+)/.exec(body)?.[1] ?? "",
      history,
    };
  }

  /**
   * Make Payment (or Retry when that is the button shown) > Next. Waits for Step 3, a refusal or the price alert.
   * A refusal / price alert dialog is closed with OK and Step 2 reloaded, so Payment History and Retry are current.
   */
  @step("Step 2: Make Payment / Retry")
  async pay(): Promise<PayOutcome> {
    const btn = (await this.payButton.isVisible().catch(() => false)) ? this.payButton : this.retryButton;
    await btn.click();
    await this.dialog.waitFor({ state: "visible", timeout: 30_000 });
    await this.pressDialog(/^Next$/);
    const paid = this.page.waitForURL(/confirmation\.do/, { timeout: 180_000 }).then(() => "paid" as const);
    const dlg = this.dialog.waitFor({ state: "visible", timeout: 180_000 }).then(() => "dialog" as const);
    const first = await Promise.race([paid, dlg]).catch(() => "timeout" as const);
    if (first === "paid" || /confirmation\.do/.test(this.page.url())) {
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      const s3 = await this.readStep3();
      return { outcome: "paid", status: s3.paymentStatus, submittedAt: s3.submittedAt };
    }
    const d = await this.readDialog();
    if (!d) return { outcome: "other", url: this.page.url() };
    await this.pressDialog(/^OK$/).catch(() => undefined);
    const id = /[?&]id=([0-9a-f-]{36})/.exec(this.page.url())?.[1];
    if (id) await this.gotoStep2(id);
    if (/Price Update/i.test(d.title)) return { outcome: "repriced", message: d.text };
    if (/^Payment$/i.test(d.title)) return { outcome: "failed", message: d.text };
    return { outcome: "other", dialog: d, url: this.page.url() };
  }

  @step("Step 2: Save & Continue Later")
  async saveAndContinueLater(): Promise<void> {
    await this.page.locator("text=Save & Continue Later").first().click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  // ------------------------------------------------------------------ Step 3
  async readStep3(): Promise<{ title: string; paymentStatus: string; submittedAt: string; transactionNo: string; totalPaid: string }> {
    const body = (await this.page.locator("body").innerText()).replace(/\t/g, " ");
    return {
      title: /Submission \([^)]*\)/.exec(body)?.[0] ?? "",
      paymentStatus: /Payment Status:\s*([A-Za-z]+)/.exec(body)?.[1] ?? "",
      submittedAt: /Submission Date \/ Time:\s*([\d/]+ [\d:]+)/.exec(body)?.[1] ?? "",
      transactionNo: /EM\d{9}/.exec(body)?.[0] ?? "",
      totalPaid: /Total Amount Paid \(RM\):\s*([\d,]+\.\d{2})/.exec(body)?.[1] ?? "",
    };
  }

  // ------------------------------------------------------------------ listing
  @step("Logistics Transaction Listing: search")
  async searchListing(f: { vehicleRegNo?: string; transactionNo?: string }): Promise<void> {
    if (!/emove\/listing\.do/.test(this.page.url())) await this.page.goto("view/ucd/emove/listing.do");
    if (f.vehicleRegNo !== undefined) await this.page.fill("#vehicleRegNo", f.vehicleRegNo);
    if (f.transactionNo !== undefined) await this.page.fill("#refNo", f.transactionNo); // the Transaction No box is #refNo (probe p07 dump, 30.10.2026)
    await this.page.locator("text=Search Now").first().click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /** One listing row as header → cell text (headers as printed: "Trx No", "Payment", "Tx Status", "Action", …). */
  async listingRow(transactionNo: string): Promise<Record<string, string>> {
    const row = this.page.locator("tr", { hasText: transactionNo }).first();
    await this.requireVisible(row, `listing row ${transactionNo}`);
    return row.evaluate((tr) => {
      const table = tr.closest("table")!;
      const heads = Array.from(table.querySelectorAll("thead th, tr:first-child th")).map((h) => (h as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      const cells = Array.from(tr.querySelectorAll("td")).map((c) => (c as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      const out: Record<string, string> = {};
      heads.forEach((h, i) => (out[h] = cells[i] ?? ""));
      return out;
    });
  }

  rowAction(transactionNo: string, name: "View" | "Resubmit" | "Cancel"): Locator {
    return this.page.locator("tr", { hasText: transactionNo }).first().locator(`a:has-text('${name}'), button:has-text('${name}')`).first();
  }

  /** Cancel from the listing: returns the confirmation dialog's text; `confirm` false presses No. */
  @step("Listing: Cancel")
  async cancelFromListing(transactionNo: string, confirm = true): Promise<DialogInfo | undefined> {
    await this.rowAction(transactionNo, "Cancel").click();
    await this.dialog.waitFor({ state: "visible", timeout: 30_000 });
    const d = await this.readDialog();
    await this.pressDialog(confirm ? /^Yes$/ : /^No$/);
    await this.page.waitForTimeout(1500);
    return d;
  }

  // ------------------------------------------------------------------ details
  @step("Open the UCD details of a request")
  async gotoDetails(id: string): Promise<void> {
    await this.page.goto(`view/ucd/emove/details.do?id=${id}`);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }
}
