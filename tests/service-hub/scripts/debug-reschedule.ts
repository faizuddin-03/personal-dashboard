/**
 * Standalone diagnostic script — run this directly:
 *   npx playwright test tests/service-hub/scripts/debug-reschedule.ts --headed
 *
 * Takes a screenshot after EVERY step so we can see exactly where it breaks.
 * Screenshots are saved to tests/service-hub/debug-screenshots/
 */
import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE = "https://staging.eauto.my/uat1";
const USER = "faizuddin";
const PASS = "password";
const SCREENSHOT_DIR = path.join(__dirname, "..", "debug-screenshots");

let stepNum = 0;

async function snap(page: any, label: string) {
  stepNum++;
  const filename = `${String(stepNum).padStart(2, "0")}-${label}.png`;
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
  console.log(`📸 Step ${stepNum}: ${label}`);
}

test.use({
  baseURL: BASE,
  headless: false,
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});

test("Debug reschedule full flow", async ({ page }) => {
  // ─── 1. LOGIN ───
  console.log("\n═══ PHASE 1: LOGIN ═══");
  await page.goto(`${BASE}/public/login/`, { waitUntil: "networkidle" });
  await snap(page, "login-page");

  await page.locator('input[type="text"]').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await snap(page, "login-filled");

  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState("networkidle");
  await snap(page, "after-login");

  const url1 = page.url();
  console.log(`  Current URL: ${url1}`);
  if (url1.includes("/public/login")) {
    console.log("  ❌ STILL ON LOGIN PAGE — credentials may be wrong");
    return;
  }
  console.log("  ✅ Login successful");

  // ─── 2. NAVIGATE TO LISTING ───
  console.log("\n═══ PHASE 2: SERVICE REQUEST LISTING ═══");
  await page.goto(`${BASE}/view/ucd/service-hub/listing.do`, {
    waitUntil: "networkidle",
  });
  await snap(page, "listing-page");
  console.log(`  Current URL: ${page.url()}`);

  // Click Search Now
  const searchBtn = page.getByText("Search Now", { exact: false });
  const searchVisible = await searchBtn.isVisible().catch(() => false);
  console.log(`  "Search Now" button visible: ${searchVisible}`);

  if (!searchVisible) {
    // Try alternative: maybe it's a regular button or input
    const altSearch = page.locator(
      'button:has-text("Search"), input[value*="Search"], a:has-text("Search")'
    ).first();
    const altVisible = await altSearch.isVisible().catch(() => false);
    console.log(`  Alternative search button visible: ${altVisible}`);
    if (altVisible) {
      await altSearch.click();
    } else {
      console.log("  ❌ Cannot find any search button");
      await snap(page, "no-search-button");
      return;
    }
  } else {
    await searchBtn.click();
  }

  await page.waitForLoadState("networkidle");
  await snap(page, "after-search");

  // ─── 3. FIND RESULT ROWS ───
  console.log("\n═══ PHASE 3: FIND ROWS WITH RESCHEDULE ═══");
  const table = page.locator("table").first();
  const tableVisible = await table.isVisible().catch(() => false);
  console.log(`  Table visible: ${tableVisible}`);

  if (!tableVisible) {
    console.log("  ❌ No table found on listing page");
    // Dump the page text for diagnosis
    const bodyText = await page.locator("body").textContent();
    console.log(`  Body text (first 500 chars): ${bodyText?.substring(0, 500)}`);
    return;
  }

  const rows = await table.locator("tbody tr").all();
  console.log(`  Found ${rows.length} result rows`);

  if (rows.length === 0) {
    console.log("  ❌ No result rows");
    return;
  }

  // Print all rows for diagnosis
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowText = await rows[i].textContent();
    console.log(`  Row ${i}: ${rowText?.replace(/\s+/g, " ").trim().substring(0, 120)}`);
  }

  // Find row with Reschedule action
  let targetRow = null;
  let targetIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const hasReschedule =
      (await rows[i].getByText("Reschedule", { exact: false }).count()) > 0;
    if (hasReschedule) {
      targetRow = rows[i];
      targetIdx = i;
      break;
    }
  }

  if (!targetRow) {
    console.log("  ❌ No row has Reschedule action");
    return;
  }
  console.log(`  ✅ Row ${targetIdx} has Reschedule action`);

  // ─── 4. CLICK RESCHEDULE ───
  console.log("\n═══ PHASE 4: CLICK RESCHEDULE → CALENDAR ═══");
  await targetRow.getByText("Reschedule", { exact: false }).click();
  await page.waitForLoadState("networkidle");
  await snap(page, "reschedule-calendar");
  console.log(`  Current URL: ${page.url()}`);

  // ─── 5. VERIFY CALENDAR ───
  console.log("\n═══ PHASE 5: VERIFY CALENDAR STATE ═══");
  const calGrid = page.locator("#si-grid");
  const calVisible = await calGrid.isVisible().catch(() => false);
  console.log(`  #si-grid visible: ${calVisible}`);

  if (!calVisible) {
    console.log("  ❌ Calendar grid not found");
    return;
  }

  // Check blackout: today and tomorrow
  const todayStr = new Date().toISOString().split("T")[0];
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwStr = tmrw.toISOString().split("T")[0];

  const todayClasses =
    (await page.locator(`td[data-date="${todayStr}"]`).getAttribute("class")) ?? "";
  const tmrwClasses =
    (await page.locator(`td[data-date="${tmrwStr}"]`).getAttribute("class")) ?? "";
  console.log(`  Today (${todayStr}) classes: "${todayClasses}"`);
  console.log(`  Tomorrow (${tmrwStr}) classes: "${tmrwClasses}"`);
  console.log(
    `  Today bookable: ${todayClasses.includes("si-book") && !todayClasses.includes("si-muted")}`
  );
  console.log(
    `  Tomorrow bookable: ${tmrwClasses.includes("si-book") && !tmrwClasses.includes("si-muted")}`
  );

  // Find booked date (orange badge)
  const bookedBadges = await page.locator("td[data-date] .si-bookbadge").all();
  console.log(`  Booked badges found: ${bookedBadges.length}`);

  let bookedDate: string | null = null;
  if (bookedBadges.length > 0) {
    const parentTd = bookedBadges[0].locator("xpath=ancestor::td");
    bookedDate = await parentTd.getAttribute("data-date");
    const badgeText = await bookedBadges[0].textContent();
    console.log(`  ✅ Booked date: ${bookedDate} — "${badgeText}"`);
  } else {
    console.log("  ❌ No booked date found (no si-bookbadge)");
    return;
  }

  // Find bookable dates
  const bookableCells = await page.locator("td.si-book[data-date]").all();
  console.log(`  Bookable dates: ${bookableCells.length}`);

  let newDate: string | null = null;
  for (const cell of bookableCells) {
    const date = await cell.getAttribute("data-date");
    if (date && date !== bookedDate) {
      newDate = date;
      break;
    }
  }
  console.log(`  New date selected: ${newDate}`);

  if (!newDate) {
    console.log("  ❌ No bookable date found (other than booked)");
    return;
  }

  // ─── 6. REMOVE OLD BOOKING ───
  console.log("\n═══ PHASE 6: REMOVE OLD BOOKING ═══");
  console.log(`  Clicking booked date: ${bookedDate}`);
  const bookedCell = page.locator(`td[data-date="${bookedDate}"]`);
  await bookedCell.click();

  // Wait for modal overlay
  const overlay = page.locator("#si-ovl");
  try {
    await overlay.waitFor({ state: "visible", timeout: 5000 });
    console.log("  ✅ Modal overlay appeared");
  } catch {
    console.log("  ❌ Modal overlay (#si-ovl) did not appear");
    await snap(page, "no-modal-overlay");

    // Try clicking via JS
    console.log("  Trying siOpenSlot via JS...");
    await page.evaluate((d: string) => (window as any).siOpenSlot(d), bookedDate);
    await page.waitForTimeout(1000);
    await snap(page, "after-js-open-slot");
    const ovlNow = await overlay.isVisible().catch(() => false);
    console.log(`  #si-ovl visible after JS call: ${ovlNow}`);
    if (!ovlNow) return;
  }
  await snap(page, "modal-opened-old-date");

  // Check slot counts
  const cnt0El = page.locator("#si-cnt0");
  const cnt1El = page.locator("#si-cnt1");
  const cnt0Visible = await cnt0El.isVisible().catch(() => false);
  const cnt1Visible = await cnt1El.isVisible().catch(() => false);
  console.log(`  #si-cnt0 visible: ${cnt0Visible}`);
  console.log(`  #si-cnt1 visible: ${cnt1Visible}`);

  if (cnt0Visible) {
    const val0 = Number((await cnt0El.inputValue()) || 0);
    console.log(`  Morning count: ${val0}`);
    if (val0 > 0) {
      console.log("  Removing morning slot via siRowRemove(0)...");
      await page.evaluate(() => (window as any).siRowRemove(0));
      await page.waitForTimeout(500);
    }
  }
  if (cnt1Visible) {
    const val1 = Number((await cnt1El.inputValue()) || 0);
    console.log(`  Afternoon count: ${val1}`);
    if (val1 > 0) {
      console.log("  Removing afternoon slot via siRowRemove(1)...");
      await page.evaluate(() => (window as any).siRowRemove(1));
      await page.waitForTimeout(500);
    }
  }

  await snap(page, "after-remove-slots");

  // Save changes
  console.log("  Saving changes via siSaveDate()...");
  await page.evaluate(() => (window as any).siSaveDate());
  await page.waitForTimeout(1000);
  try {
    await overlay.waitFor({ state: "hidden", timeout: 5000 });
    console.log("  ✅ Modal closed after save");
  } catch {
    console.log("  ⚠️ Modal may still be open");
  }
  await snap(page, "after-save-remove");

  // ─── 7. ADD NEW BOOKING ───
  console.log("\n═══ PHASE 7: ADD NEW BOOKING ═══");
  console.log(`  Clicking new date: ${newDate}`);
  const newCell = page.locator(`td[data-date="${newDate}"]`);
  await newCell.click();

  try {
    await overlay.waitFor({ state: "visible", timeout: 5000 });
    console.log("  ✅ Modal overlay appeared for new date");
  } catch {
    console.log("  ❌ Modal overlay did not appear for new date");
    console.log("  Trying siOpenSlot via JS...");
    await page.evaluate((d: string) => (window as any).siOpenSlot(d), newDate);
    await page.waitForTimeout(1000);
  }
  await snap(page, "modal-opened-new-date");

  // Add morning slot
  console.log("  Adding morning slot via siStep(0, 1)...");
  await page.evaluate(() => (window as any).siStep(0, 1));
  await page.waitForTimeout(500);
  await snap(page, "after-increment-slot");

  // Save
  console.log("  Saving changes via siSaveDate()...");
  await page.evaluate(() => (window as any).siSaveDate());
  await page.waitForTimeout(1000);
  try {
    await overlay.waitFor({ state: "hidden", timeout: 5000 });
    console.log("  ✅ Modal closed after save");
  } catch {
    console.log("  ⚠️ Modal may still be open");
  }
  await snap(page, "after-save-add");

  // ─── 8. CONFIRM APPOINTMENT ───
  console.log("\n═══ PHASE 8: CONFIRM APPOINTMENT ═══");
  const confirmBtn = page.locator("#si-confirm-booking");
  const confirmVisible = await confirmBtn.isVisible().catch(() => false);
  console.log(`  #si-confirm-booking visible: ${confirmVisible}`);

  if (!confirmVisible) {
    console.log("  ❌ Confirm button not found");
    return;
  }

  await confirmBtn.click();
  await page.waitForLoadState("networkidle");
  await snap(page, "after-confirm");
  console.log(`  Current URL: ${page.url()}`);

  // ─── 9. DONE ───
  console.log("\n═══ PHASE 9: DONE PAGE ═══");
  const doneBtn = page.locator("a.rs-btn, a:has-text('Done')").first();
  const doneVisible = await doneBtn.isVisible().catch(() => false);
  console.log(`  Done button visible: ${doneVisible}`);

  if (doneVisible) {
    await snap(page, "done-page");
    await doneBtn.click();
    await page.waitForLoadState("networkidle");
    await snap(page, "after-done");
    console.log("  ✅ RESCHEDULE COMPLETE!");
  } else {
    console.log("  ❌ Done button not found — checking page content");
    const bodyText = await page.locator("body").textContent();
    console.log(`  Body: ${bodyText?.replace(/\s+/g, " ").trim().substring(0, 300)}`);
    await snap(page, "no-done-button");
  }
});
