import { expect, type Page } from "@playwright/test";
import * as path from "node:path";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";

/**
 * Logistics Driver page (public, no login) opened from the Delivery Order QR — eMOVE and Wholesale share it.
 *
 * Read off staging /uat3/ on 30.10.2026 (EAINT-12019 smoke p05, phone viewport 412 × 915):
 *   QR Pick-Up copy  → `public/wholesale/driver-pickup-universal.do`
 *   QR Drop-Off copy → `public/wholesale/driver-delivery-universal.do`
 *   the universal page (Wholesale's): Vehicle No `#ds-vehicle-no` + Next `#ds-btn-next` (posts
 *   `public/logistics/driver/find.do`; answer `outcome: "EMOVE"` for an eMOVE job) → redirect to the eMOVE page
 *   `public/logistics/driver-pickup.do?regNo=…` (or the delivery page), which has its own `#regNo` / `#nextBtn`
 *   (pre-filled) and shows the details + "Confirm & Continue" `#toIdentity` → 12 photo slots, multi-select `#multi`,
 *   progress `#progress` ("Uploaded 12/12"), errors `#pErr`, Submit `#submitBtn` (enabled at 12)
 *   → "Pick-Up Confirmed … In Transit" / "Drop-Off Confirmed … Delivered".
 *   Report a failure: `#toFail` → `#f_reason`, `#f_drvName`, `#f_drvContact`, evidence `#f_evi`, `#failBtn`
 *   (seen in the DOM, not exercised yet: no method here until a probe has run it).
 * Photos: the QA showroom PNGs in `automation/assets/uploads/` (never ID documents).
 */
export type DriverLeg = "pickup" | "delivery";
const PHOTOS = [1, 2, 3, 4].map((i) => path.resolve(__dirname, "../../../assets/uploads", `showroom-${i}.png`));

export class EmoveDriverPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  @step("Driver: open the QR page")
  async open(leg: DriverLeg): Promise<void> {
    await this.page.setViewportSize({ width: 412, height: 915 });
    await this.page.goto(`public/wholesale/driver-${leg}-universal.do`);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /** Enter the vehicle and press Next. Returns the page text after it (details, or a refusal). */
  @step("Driver: enter the vehicle")
  async enterVehicle(vehicleRegNo: string): Promise<string> {
    await this.page.fill("#ds-vehicle-no", vehicleRegNo);
    await this.page.locator("#ds-btn-next").click();
    // eMOVE job: redirected to the eMOVE driver page (verify r2, 30.10.2026: no #regNo on the universal page)
    await this.page.waitForURL(/public\/logistics\/driver-/, { timeout: 30_000 }).catch(() => undefined);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    if (/public\/logistics\/driver-/.test(this.page.url()) && !(await this.page.locator("#toIdentity").isVisible().catch(() => false))) {
      if (await this.page.locator("#nextBtn").isVisible().catch(() => false)) await this.page.locator("#nextBtn").click();
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
    }
    await this.page.waitForTimeout(1500);
    return this.page.locator("body").innerText();
  }

  @step("Driver: Confirm & Continue")
  async confirmDetails(): Promise<void> {
    await this.requireVisible(this.page.locator("#toIdentity"), "Confirm & Continue");
    await this.page.locator("#toIdentity").click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /** Upload `count` photos through the multi-select; returns the progress line. */
  @step("Driver: upload the checklist photos")
  async uploadPhotos(count = 12): Promise<string> {
    await this.page.locator("#multi").setInputFiles(Array.from({ length: count }, (_, k) => PHOTOS[k % PHOTOS.length]));
    await this.page.waitForFunction((n) => (document.getElementById("progress")?.textContent ?? "").includes(`Uploaded ${n}/`), count, { timeout: 300_000 }).catch(() => undefined);
    return (await this.page.locator("#progress").innerText().catch(() => "")).trim();
  }

  @step("Driver: Submit")
  async submit(): Promise<string> {
    await expect(this.page.locator("#submitBtn")).toBeEnabled({ timeout: 30_000 });
    await this.page.locator("#submitBtn").click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.waitForFunction(() => /Confirmed/.test(document.body.innerText), null, { timeout: 120_000 }).catch(() => undefined);
    return this.page.locator("body").innerText();
  }
}
