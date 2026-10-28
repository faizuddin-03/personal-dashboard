import { type Page, type Locator, type Download, expect, test } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";
import { downloadWithLabeledVideo } from "../../utils/download-evidence";
import { renderPdfToEvidence } from "../../utils/pdf";

/**
 * eAuto Back Office Portal > Service Hub > Service Request Details page,
 * for a Biometric Device Purchase record (EAINT-12166/EAINT-12167).
 *
 * Same detail.do endpoint as SoftwareInstallationDetailsPage, but a Device
 * Purchase record renders a different "Shipping Details" block (Number of
 * Device / Device Serial No. / Delivery Order Number / Consignment Number)
 * plus the "Update Shipping Details" popup (#op-ship-dialog) and, once
 * Delivery Status = Arranged, a [DO] button next to INVOICE.
 *
 * Selectors confirmed against real captures:
 *  - _reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html
 *    (New status — popup editable, serials empty, only "Arranged" offered
 *    in the Delivery Status select)
 *  - _reference/tickets/EAINT-12166/EAINT-12166-bo-sr-details-arranged-do-assigned-uat1-2026-09-23.html
 *    (Arranged status — popup read-only ("ship-locked" class added), DO
 *    button present, only "Delivered" offered next)
 */
export class DevicePurchaseDetailsPage extends BasePage {
  // Static "Shipping Details" table (key/value rows: .ins-kv.ins-ship td.k / td)
  readonly shippingTable = this.page.locator(".ins-kv.ins-ship");
  readonly updateShippingBtn = this.page.locator(".btn-update", { hasText: "Update Shipping Details" });

  // Header action buttons — INVOICE / e-INVOICE always onclick-driven;
  // DO only rendered once Delivery Status = Arranged.
  readonly invoiceBtn = this.page.locator('button.btn-inv[onclick="opInvoice()"]');
  readonly eInvoiceBtn = this.page.locator('button.btn-inv[onclick="opEInvoice()"]');
  readonly doBtn = this.page.locator('button.btn-inv[onclick="opDo()"]');

  // Update Shipping Details popup (#op-ship-dialog)
  readonly shipDialog = this.page.locator(".ui-dialog", { has: this.page.locator("#op-ship-dialog") });
  readonly shipDateInput = this.page.locator("#op-ship-date");
  readonly shipStatusSelect = this.page.locator("#op-ship-status");
  readonly shipConsignInput = this.page.locator("#op-ship-consign");
  readonly shipDevCount = this.page.locator("#op-ship-devcount");
  readonly shipSerialInputs = this.page.locator(".op-ship-serial");

  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string, apptId: string) {
    await this.goto(PATHS.boDevicePurchaseDetails(txnId, apptId));
  }

  private async shippingRow(label: string): Promise<string> {
    const row = this.shippingTable.locator("tr", { has: this.page.locator("td.k", { hasText: label }) });
    const value = ((await row.locator("td").nth(1).textContent()) ?? "").trim();
    // Green — this row is DATA the test just read/checked (e.g. the DO
    // Number), so a reviewer sees exactly where that value lives on the page.
    await this.demoHighlight(row, { color: "green" });
    // Dynamic step title so the step-tree log (PW_STEP_REPORT, surfaced in
    // the dashboard's per-test breakdown) shows the ACTUAL value read, not
    // just "getDeliveryStatus() was called" — this is what let a reviewer
    // confirm/deny "did it really check X before doing Y" after the fact.
    await test.step(`Read "${label}" = "${value}"`, async () => {});
    return value;
  }

  async getDeliveryStatus(): Promise<string> {
    return this.shippingRow("Delivery Status:");
  }

  async getDeliveryOrderNumber(): Promise<string> {
    return this.shippingRow("Delivery Order Number:");
  }

  async getConsignmentNumber(): Promise<string> {
    return this.shippingRow("Consignment Number:");
  }

  async getNumberOfDevice(): Promise<string> {
    return this.shippingRow("Number of Device:");
  }

  /**
   * Whether the "Update Shipping Details" button is rendered at all.
   * Confirmed live (manual repro video, 2026-09-23): it disappears entirely
   * once Delivery Status reaches Delivered (terminal — nothing left to
   * update), rather than staying present-but-disabled. So the real
   * post-Delivered guarantee is "there is no button to reopen the popup
   * with" — trying to open it anyway is why the automation timed out
   * waiting for a `.btn-update` that was never going to appear.
   */
  async isUpdateShippingButtonPresent(): Promise<boolean> {
    const present = (await this.updateShippingBtn.count()) > 0;
    await test.step(`Read "Update Shipping Details" button present = ${present}`, async () => {
      // Green when present (here's the data a reviewer should look at, same
      // convention as shippingRow()); nothing to highlight when absent, so
      // just hold the frame long enough to actually see the empty state.
      if (present) {
        await this.demoHighlight(this.updateShippingBtn, { color: "green" });
      } else {
        await this.demoPause();
      }
    });
    return present;
  }

  /** Whether the [DO] button is rendered at all — it only exists once Arranged. */
  async isDoButtonPresent(): Promise<boolean> {
    const present = (await this.doBtn.count()) > 0;
    await test.step(`Read [DO] button present = ${present}`, async () => {});
    return present;
  }

  /** Open the Update Shipping Details popup (#op-ship-dialog). */
  async openUpdateShippingDetails() {
    await test.step("Open Update Shipping Details", async () => {
      await this.demoHighlight(this.updateShippingBtn);
      await this.updateShippingBtn.click();
      await this.shipDialog.waitFor({ state: "visible", timeout: 8000 });
      await this.demoPause();
    });
  }

  /**
   * Set the readonly, datepicker-driven Delivery Date input directly.
   *
   * **The field's format is `dd-MM-yyyy`, NOT ISO `yyyy-MM-dd`** — writing
   * the wrong one silently corrupts the save. Verified from the live page
   * source (Playwright trace, uat1, 2026-09-23):
   *
   *   $("#op-ship-date").datepicker({ dateFormat:'dd-mm-yy', ... })   // jQuery UI 'yy' = 4-digit year
   *   var shipDate = $.trim($("#op-ship-date").val());
   *   deliveryDate: shipDate.replace(/-/g, "/"),  // shown dd-MM-yyyy; server parseDate expects dd/MM/yyyy
   *
   * So the app just swaps `-` for `/` and posts it. A human picking 26 Sep
   * 2026 via the calendar yields `26-09-2026` -> `26/09/2026`, which the
   * server parses correctly. This method previously wrote ISO
   * `2026-09-26`, which became `2026/09/26` and was parsed as
   * dd/MM/yyyy -> day 2026, month 09, year 26: nonsense. The server still
   * answered 200 OK and saved every OTHER field (they're plain strings),
   * but stored no Delivery Date — so the record came back with
   * `Delivery Date: -`, and the NEXT status change (Arranged -> Delivered)
   * was then blocked forever by the popup's own "This field is required"
   * validation on that now-empty field. That is what made TS02's Officer B
   * leg hang, with the still-open modal's overlay swallowing every
   * subsequent click.
   *
   * Callers pass ISO `yyyy-MM-dd` (what BasePage's date helpers produce);
   * this converts. A value already in `dd-MM-yyyy` is passed through.
   * Reading the input back afterwards asserts the write actually landed.
   */
  async setDeliveryDate(dateStr: string) {
    const uiDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? dateStr.split("-").reverse().join("-") // yyyy-MM-dd -> dd-MM-yyyy
      : dateStr;
    await test.step(`Set Delivery Date = ${uiDate} (dd-MM-yyyy)`, async () => {
      await this.shipDateInput.evaluate((el, v) => {
        (el as HTMLInputElement).value = v as string;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, uiDate);
      await this.demoHighlight(this.shipDateInput);
      await expect(
        this.shipDateInput,
        `Delivery Date should hold "${uiDate}" in the field's own dd-MM-yyyy format`,
      ).toHaveValue(uiDate);
    });
  }

  async setConsignmentNumber(value: string) {
    await test.step(`Set Consignment Number = ${value}`, async () => {
      await this.shipConsignInput.fill(value);
      await this.demoHighlight(this.shipConsignInput);
    });
  }

  /** Number of Device, read from the popup's own read-only span. */
  async getPopupDeviceCount(): Promise<number> {
    const count = Number((await this.shipDevCount.textContent())?.trim()) || 0;
    await test.step(`Read popup device count = ${count}`, async () => {});
    return count;
  }

  /**
   * Fill one serial per device, in order. Array length must match the device
   * count. Logs the exact count + the full list of values used — this is
   * what proves (or disproves) whether every serial was actually filled
   * BEFORE the status was changed to Arranged, rather than the run just
   * "looking okay" with no way to check afterward.
   */
  async fillSerialNumbers(serials: string[]) {
    await test.step(`Fill ${serials.length} serial number(s): ${serials.join(", ")}`, async () => {
      const inputs = await this.shipSerialInputs.all();
      expect(inputs.length, "Serial input count should match the device count").toBe(serials.length);
      // Highlight each field individually only for a small batch — TS02 fills
      // up to 40, and pausing/highlighting on every single one would flood the
      // recording instead of helping a reviewer follow it.
      const highlightEach = serials.length <= 5;
      if (!highlightEach) await this.demoHighlight(this.shipSerialInputs.first());
      for (let i = 0; i < serials.length; i++) {
        await inputs[i].fill(serials[i]);
        if (highlightEach) await this.demoHighlight(inputs[i]);
      }
      // Verify every field actually holds what we just filled — an assertion
      // failure here means a fill silently didn't take, not just a "trust
      // me, we called .fill()" log line.
      for (let i = 0; i < serials.length; i++) {
        await expect(inputs[i], `Serial input #${i} should hold "${serials[i]}" after fillSerialNumbers()`).toHaveValue(serials[i]);
      }
    });
  }

  /**
   * Set Delivery Status. The <select> only ever offers the single legal next
   * transition (New -> Arranged, or Arranged -> Delivered), so this selects
   * whichever option is actually present rather than assuming a fixed value.
   */
  async setDeliveryStatusToNextOption() {
    const value = await this.shipStatusSelect.locator("option").first().getAttribute("value");
    if (!value) {
      await test.step("Set Delivery Status: no next option offered — leaving unchanged", async () => {});
      return;
    }
    await test.step(`Set Delivery Status -> ${value}`, async () => {
      await this.shipStatusSelect.selectOption(value);
      await this.demoHighlight(this.shipStatusSelect);
    });
  }

  /** Whether the serial/date/consignment fields are locked (post-Arranged reopen). */
  async areFieldsLocked(): Promise<boolean> {
    const first = this.shipSerialInputs.first();
    const locked = (await first.getAttribute("readonly")) !== null;
    await test.step(`Read fields-locked = ${locked}`, async () => {});
    return locked;
  }

  private async clickDialogButton(label: "Update" | "Cancel") {
    const btn = this.shipDialog
      .locator(".ui-dialog-buttonpane button", { hasText: new RegExp(`^${label}$`) })
      .first();
    await this.demoHighlight(btn, { color: label === "Update" ? "green" : "red" });
    await btn.click();
  }

  /**
   * Click Update, closing the popup and saving the shipping details. Logs
   * explicitly whether the popup actually closed — a save that gets
   * silently rejected (a validation error or the native duplicate-SN
   * alert()) leaves it open, which otherwise wouldn't show up until a much
   * later, harder-to-trace assertion failure.
   */
  async submitUpdateShippingDetails() {
    await test.step("Submit Update Shipping Details", async () => {
      // NOTE: no native confirm() guard here on purpose. Verified from the
      // live page source (Playwright trace, 2026-09-23): opShipSave()'s own
      // comment reads "No confirm step — a validated Update POSTs
      // directly." A stray `page.once("dialog", ...)` armed here would sit
      // waiting and could swallow an UNRELATED later dialog the test
      // actually wants to assert on (e.g. TS08's duplicate-serial alert).
      await this.clickDialogButton("Update");
      const closed = await this.shipDialog.waitFor({ state: "hidden", timeout: 8000 }).then(() => true).catch(() => false);
      await test.step(
        closed
          ? "Update Shipping Details popup closed — save went through"
          : "WARNING: Update Shipping Details popup is STILL OPEN after clicking Update — the save was likely rejected (validation error or duplicate-SN alert)",
        async () => {},
      );
      await this.waitForNav();
      await this.demoPause();
    });
  }

  async cancelUpdateShippingDetails() {
    await this.clickDialogButton("Cancel");
    await this.shipDialog.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  }

  /** Per-field "This field is required" / length / duplicate error, shown under each serial input. */
  getSerialFieldError(index: number): Locator {
    return this.shipSerialInputs.nth(index).locator("xpath=following-sibling::div[contains(@class,'op-ship-serial-err')]");
  }

  /**
   * Click Update EXPECTING it to be rejected (an inline validation error or
   * the native duplicate-SN alert) — same button as
   * submitUpdateShippingDetails(), but doesn't wait for the dialog to close
   * since a rejected save leaves it open. Highlighted red: the point of this
   * click is to trigger a validation failure, not a successful save.
   */
  async attemptRejectedSave(): Promise<void> {
    const btn = this.shipDialog.locator(".ui-dialog-buttonpane button", { hasText: /^Update$/ }).first();
    await this.demoHighlight(btn, { color: "red" });
    await btn.click();
  }

  /** Click [DO] and capture the downloaded PDF. */
  async downloadDeliveryOrder(): Promise<Download> {
    return await test.step("Click [DO] and download the PDF", async () => {
      await this.demoHighlight(this.doBtn);
      const download = await downloadWithLabeledVideo(this.page, "DO download", async () => {
        await this.doBtn.click();
      });
      // The recording never shows the PDF itself — window.open() triggers
      // the download immediately, before anything renders, so a reviewer
      // watching the video has no way to see what extractPdfText() actually
      // checked. Render the real page(s) to PNG evidence instead of asking
      // them to trust the text-match assertions blindly.
      await renderPdfToEvidence(download, "DO download");
      return download;
    });
  }

  /**
   * Click [DO] expecting it to FAIL (Report Engine down / incomplete
   * details, REQ-006) instead of downloading a PDF.
   *
   * CONFIRMED LIVE 2026-09-24 (first real TS04 run against a genuinely down
   * Report Engine): the [DO] button fires via `window.open()` same as the
   * success path (see `downloadWithLabeledVideo`'s own doc comment) — on
   * failure, that new popup navigates to a blank page showing the error
   * text directly, instead of triggering a download. The original page
   * never shows this text at all. First version of this method checked
   * `this.page` and timed out even though the real behaviour was already
   * correct — the check was just looking at the wrong window. Now races for
   * the popup the same way the download path does, and checks whichever
   * page actually received it (falls back to `this.page` if no popup opens,
   * in case a future build renders this inline instead).
   */
  async clickDoExpectingError(expectedMessage: string | RegExp): Promise<void> {
    await test.step(`Click [DO], expecting error: ${expectedMessage}`, async () => {
      await this.demoHighlight(this.doBtn);
      const context = this.page.context();
      const [popup] = await Promise.all([
        context.waitForEvent("page", { timeout: 15000 }).catch(() => null),
        this.doBtn.click(),
      ]);
      if (popup) await popup.waitForLoadState("domcontentloaded").catch(() => {});
      const target = popup ?? this.page;
      const errorLocator = target.getByText(expectedMessage, { exact: false }).first();
      await expect(errorLocator, `expected error message to appear: ${expectedMessage}`).toBeVisible({ timeout: 15000 });
      // Best-effort only — demoHighlight always evaluates against `this.page`,
      // which silently no-ops (caught internally) when the element actually
      // lives on the popup page instead.
      await this.demoHighlight(errorLocator, { color: "red" });
      if (popup) await popup.close().catch(() => {});
    });
  }

  /** Click Invoice / e-Invoice and capture the downloaded PDF. */
  async downloadInvoice(): Promise<Download> {
    return await test.step("Click Invoice and download the PDF", async () => {
      await this.demoHighlight(this.invoiceBtn);
      return downloadWithLabeledVideo(this.page, "Invoice download", async () => {
        await this.invoiceBtn.click();
      });
    });
  }

  async downloadEInvoice(): Promise<Download> {
    return await test.step("Click e-Invoice and download the PDF", async () => {
      await this.demoHighlight(this.eInvoiceBtn);
      return downloadWithLabeledVideo(this.page, "e-Invoice download", async () => {
        await this.eInvoiceBtn.click();
      });
    });
  }
}
