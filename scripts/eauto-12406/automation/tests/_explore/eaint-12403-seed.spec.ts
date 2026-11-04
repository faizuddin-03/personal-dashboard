// A TOOL. DESTRUCTIVE (staging instance only). Creates the EAINT-12403
// PRE-PUSH test data on the configured instance (preprod1) — the rows the
// workbook marks yellow, which cannot be reproduced once Dev pushes the new
// price and runs the payment reset.
//
// Every seed records what it made (vehicle, transaction no., statuses as the
// UCD and BO listings show them) into
//   cr/EAINT-12403/05-evidence/pre-push/seeds.json
// and saves a screenshot at every step that matters into
//   cr/EAINT-12403/05-evidence/pre-push/<TS>/
//
//   TEST_ENV=preprod1 SEED=STMS_PAY1 npm run probe -- --grep "12403 seed"
//   TEST_ENV=preprod1 SEED=all       npm run probe -- --grep "12403 seed"
//
// eSim switchable prefixes (OQ car, OR motorcycle) must be at the RHB value a
// seed says it needs; flip with `npx tsx scripts/seed-qa-prefixes.ts --rhb`.

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";
import { baseURL, instance } from "@config/environments";
import { runStmsFlow, closeStmsFlow, type StmsResult } from "@flows/stms.flow";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { UcdHomePage, UCD_MENU } from "@pages/ucd/ucd-home.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";
import type { MyKadClient } from "@fixtures/mykad";
import type { CardLike } from "@pages/wizard.page";
import { highlight, highlightRowCells, clearHighlights, paymentSummaryBlock } from "@fixtures/highlight";

const UCD_COLS = ["Transaction No", "Transaction No.", "JPJ Check", "Payment", "JPJ Transfer", "Tx Status", "Remarks", "Action"];
const BO_COLS = ["Transaction No.", "Vehicle Type", "JPJ Enquiry", "Payment", "JPJ Transfer", "Tx Status", "Remarks", "Action"];

/** Step 5: outline the price, screenshot, clear. */
async function shootStep5(page: Page, shots: Shots, name = "step5-payment-summary") {
  await highlight(page, paymentSummaryBlock(page), "Step 5 price — JPJ + eAuto + 8% = Total");
  await shots.take(page, name);
  await clearHighlights(page);
}

/** The payment result dialog (RHB refusal / "Payment request sent"). */
async function shootDialog(page: Page, shots: Shots, name: string) {
  await highlight(page, page.locator(".ui-dialog:visible").last(), "Payment result");
  await shots.take(page, name);
  await clearHighlights(page);
}

// EAINT-12403 is preprod1 only (see eaint-12403-lib.ts).
if (instance() !== "preprod1") throw new Error(`EAINT-12403 seed runs on preprod1 only — resolved "${instance()}". Run with INSTANCE=preprod1.`);
// SEED_OUT=post-push reuses these flows AFTER the push (e.g. a new Interstate
// for UTU_E2E2) and files the evidence with the post-push runs.
const EVID = path.join(__dirname, "..", "..", "..", "cr", "EAINT-12403", "05-evidence", process.env.SEED_OUT === "post-push" ? "post-push" : "pre-push");
const LEDGER = path.join(EVID, "seeds.json");

// ------------------------------------------------------------------ recording

interface SeedRecord {
  ts: string;
  what: string;
  instance: string;
  at: string;
  vehicle: string;
  transactionNo?: string;
  persona: string;
  prefix: string;
  ucdRow?: string;
  boRow?: string;
  step5?: string;
  outcome?: string;
  notes?: string[];
  screenshots: string[];
}

function record(r: SeedRecord) {
  fs.mkdirSync(EVID, { recursive: true });
  const all: SeedRecord[] = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : [];
  all.push(r);
  fs.writeFileSync(LEDGER, JSON.stringify(all, null, 2) + "\n", "utf8");
  console.log(`\n### RECORDED ${r.ts}: ${r.vehicle} ${r.transactionNo ?? "(no tx no)"} — ${r.outcome ?? ""}`);
  if (r.ucdRow) console.log(`    UCD: ${r.ucdRow}`);
  if (r.boRow) console.log(`    BO : ${r.boRow}`);
}

/**
 * ONE folder per TS no. (QA 2026-09-28): every screenshot, video, document and
 * export for a TS lives in `pre-push/<TS>/`, never split by file type. Seed
 * parts that belong to a TS (its source STMS, the Sabah variant, the UCD to UCD
 * leg) go in the same folder with a part prefix.
 */
const PARTS: [RegExp, string][] = [
  [/_ESTM_SRC$/, "estm-source-stms"],
  [/_ESTM$/, "estm"],
  [/_SABAH_SRC$/, "sabah-source-stms"],
  [/_SRC$/, "source-stms"],
  [/_SABAH$/, "sabah"],
  [/_UTU$/, "utu"],
  [/_CAR$/, "car"],
];
function tsFolder(ts: string): { folder: string; part: string } {
  for (const [re, part] of PARTS) if (re.test(ts)) return { folder: ts.replace(re, ""), part };
  return { folder: ts, part: "" };
}
/** TS folders this test wrote into — the test's video is copied into each. */
const touched = new Set<string>();

class Shots {
  readonly files: string[] = [];
  private n = 0;
  readonly folder: string;
  readonly part: string;
  constructor(readonly ts: string) {
    ({ folder: this.folder, part: this.part } = tsFolder(ts));
    fs.mkdirSync(this.dir, { recursive: true });
    touched.add(this.folder);
  }
  get dir() { return path.join(EVID, this.folder); }
  /**
   * Next file name `NN-<part>-<label>.<ext>`. NN continues after the files
   * already in the folder, so a folder always reads in the order it was captured.
   */
  name(label: string, ext: string) {
    if (!this.n) this.n = fs.readdirSync(this.dir).filter((f) => /^\d{2}-/.test(f)).length;
    return `${String(++this.n).padStart(2, "0")}-${this.part ? this.part + "-" : ""}${label}.${ext}`;
  }
  async take(page: Page, label: string, fullPage = true) {
    const f = this.name(label, "png");
    await page.screenshot({ path: path.join(this.dir, f), fullPage }).catch(() => undefined);
    this.files.push(`${this.folder}/${f}`);
  }
  /** Save a file (document, export) into the TS folder. */
  file(label: string): string {
    const f = `${this.part ? this.part + "-" : ""}${label}`;
    this.files.push(`${this.folder}/${f}`);
    return path.join(this.dir, f);
  }
}

/** Every seed starts from the dashboard, which is where the menu helpers look. */
async function home(page: Page) {
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/home.do");
  await new StmsWizardPage(page).dismissAnnouncements();
}

const text = (page: Page) => page.evaluate(() => document.body.innerText);

async function paymentSummary(page: Page): Promise<string> {
  const body = await text(page);
  return ((body.match(/Payment Summary[\s\S]*?Total Amount Payable[^\n]*\n?[^\n]*/) ?? [""])[0]).replace(/\s+/g, " ").trim();
}

// ------------------------------------------------------------------ listings

const rowsOf = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll("table tr"))
      .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ")))
      .filter((r) => r.length > 6 && (r[0] === "#" || /^\d+$/.test(r[0]))));

/** UCD STMS Transaction Listing row for a vehicle, with a screenshot. */
async function ucdListing(page: Page, vehicle: string, shots: Shots, label = "ucd-stms-listing") {
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/stms/enquiry/main.do");
  await page.fill("#vehicleNo", vehicle);
  await page.click("#to-search");
  await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
  const rows = await rowsOf(page);
  const header = rows.find((r) => r.includes("Transaction No")) ?? [];
  const hit = rows.find((r) => r.includes(vehicle) && r[0] !== "#");
  await highlightRowCells(page, vehicle, UCD_COLS, `UCD listing — ${vehicle}`);
  await shots.take(page, label, false);
  await clearHighlights(page);
  const txIdx = header.indexOf("Transaction No");
  return {
    row: hit ? header.map((h, i) => `${h}=${hit[i] ?? ""}`).filter((x) => !/^#=|^=/.test(x)).join(" · ") : "(not listed)",
    tx: (hit && txIdx >= 0 ? hit[txIdx] : hit?.find((c) => /^[SA]\d{8,}$/.test(c.trim())))?.trim(),
  };
}

/** BO STMS Transaction row for a vehicle, in a fresh BO context, with a screenshot. */
async function boListing(page: Page, vehicle: string, shots: Shots, label = "bo-stms-enquiry") {
  const ctx = await page.context().browser()!.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
  const bo = await ctx.newPage();
  try {
    await new LoginPage(bo).as("bo");
    await bo.goto("view/stms/enquiry");
    await bo.locator("input[id*=ehicle i], input[name*=ehicle i]").first().fill(vehicle);
    await bo.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click();
    await bo.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    const rows = await rowsOf(bo);
    const header = rows.find((r) => r.includes("Transaction No.")) ?? [];
    const hit = rows.find((r) => r.includes(vehicle) && r[0] !== "#");
    await highlightRowCells(bo, vehicle, BO_COLS, `BO — ${vehicle}`);
    await shots.take(bo, `${label}-${vehicle}`, false);
    await clearHighlights(bo);
    return hit ? header.map((h, i) => `${h}=${hit[i] ?? ""}`).filter((x) => !/^#=|^=/.test(x)).join(" · ") : "(not listed)";
  } finally {
    await ctx.close();
  }
}

// ------------------------------------------------------------------ STMS seeds

interface StmsSeed {
  ts: string;
  what: string;
  prefix: string;
  /** How far to go and what to do at the end. */
  end: "draft" | "jpjFail" | "payFail" | "approve";
  seller?: CardLike;
  /**
   * Allocate from a separate `<prefix>9` counter (e.g. YN900001). For shared
   * prefixes whose low numbers already exist on the instance — the portal
   * refuses a second STMS for the same vehicle + owner ("Transaksi yang sama").
   */
  freshRange?: boolean;
}

async function stmsSeed(page: Page, mykad: MyKadClient, s: StmsSeed) {
  const shots = new Shots(s.ts);
  const notes: string[] = [];
  let run: StmsResult | undefined;
  let step5 = "";
  let outcome = "";
  try {
    await home(page);
    const stopAfter = s.end === "jpjFail" ? "jpjEnquiry" : "payment";
    const vehicleRegNo = s.freshRange ? nextVehicleNumber(`${s.prefix}9`, 5) : undefined;
    run = await runStmsFlow(page, { mykad, vehiclePrefix: s.prefix, vehicleRegNo, stopAfter, seller: s.seller });
    if (s.end === "jpjFail") {
      const r = await run.stms.jpjEnquiryResult();
      await highlight(page, page.locator("tr, li, div.row, p").filter({ hasText: /^\s*(JPJ Enquiry Status|Response Code):/ }), "JPJ enquiry result");
      await shots.take(page, "step4-jpj-result");
      await clearHighlights(page);
      outcome = `JPJ Enquiry Status=${r.status}; Response Code=${r.responseCode}; payment offered=${await run.stms.canProceedToPayment()}`;
    } else {
      step5 = await paymentSummary(page);
      await shootStep5(page, shots);
      if (s.end === "draft") outcome = "left at Step 5, not paid";
      else {
        const pay = await run.stms.submitPaymentAndReadResult();
        await page.waitForTimeout(3000);
        await shootDialog(page, shots, pay.outcome === "rejected" ? "payment-rejected-dialog" : "step6-after-payment");
        outcome = pay.outcome === "rejected" ? `payment rejected: ${pay.message}` : `payment accepted → ${pay.url}`;
        if (s.end === "approve" && pay.outcome === "transferred") {
          await page.locator("body").filter({ hasText: /JPJ Transfer Status/ }).waitFor({ timeout: 90_000 }).catch(() => undefined);
          await shots.take(page, "step6-transfer");
          outcome += ` · JPJ Transfer Status=${await run.stms.transferResult().then((t) => t.status).catch(() => "?")}`;
        }
        if (s.end === "payFail" && pay.outcome !== "rejected") notes.push("EXPECTED a failed payment but it went through — check the eSim RHB value for " + s.prefix);
        if (s.end === "approve" && pay.outcome === "rejected") notes.push("EXPECTED approval but payment was rejected — check the eSim RHB value for " + s.prefix);
      }
    }
  } catch (e) {
    notes.push("STOPPED: " + String(e).slice(0, 300));
    await shots.take(page, "zz-stopped");
  } finally {
    if (run) await closeStmsFlow(run);
  }
  const vehicle = run?.vehicleRegNo ?? "(unknown)";
  const u = await ucdListing(page, vehicle, shots);
  const bo = await boListing(page, vehicle, shots);
  record({
    ts: s.ts, what: s.what, instance: instance(), at: new Date().toISOString(), vehicle, transactionNo: u.tx,
    persona: "ucdE2E (Azfar1)", prefix: s.prefix, ucdRow: u.row, boRow: bo, step5, outcome, notes, screenshots: shots.files,
  });
  return { vehicle, tx: u.tx };
}

// ------------------------------------------------------------------ UCD to UCD

/** Same simulator person, Sabah address — to learn whether the owner's state sets the APT region. */
const SABAH_SELLER: CardLike = {
  ...CARDS.malaysianIndividual,
  Address1: "NO 1 JALAN SEED", Address2: "TAMAN SIMULATOR", Postcode: "88000", City: "KOTA KINABALU", State: "SABAH",
};

const RICH_BOYZ = { name: "RICH BOYZ", roc: "1231165-A" };
const FAIZ_ROC = "030312-A";
const FAIZ_CARD: CardLike = {
  ...CARDS.malaysianIndividual,
  NRIC: "030217141005",
  GMPCName: "MUHAMMAD FAIZUDDIN BIN BIDI",
  OriginalName: "MUHAMMAD FAIZUDDIN BIN BIDI",
};

async function confirm(page: Page) {
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm|Accept)$/ }).first();
  await yes.waitFor({ state: "visible", timeout: 8000 }).then(() => yes.click()).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

/** Any Perakuan tick: wait for the box, fill the LKM refund email if asked, tick, prove it. */
async function tickConsentWhenReady(page: Page, sel: string, email: string) {
  const consent = page.locator(sel);
  await consent.waitFor({ state: "visible", timeout: 30_000 });
  const refund = page.locator("#sellerEmail");
  if ((await refund.isVisible().catch(() => false)) && !(await refund.inputValue())) await refund.fill(email);
  if (!(await consent.isChecked())) await consent.click();
  await page.waitForFunction((q) => (document.querySelector(q) as HTMLInputElement)?.checked, sel, { timeout: 10_000 });
}

/** Step 3 Buyer Perakuan: wait for it to render, then tick and prove it ticked. */
async function tickBuyerConsent(page: Page, email: string) {
  const consent = page.locator("#buyer-consent");
  await consent.waitFor({ state: "visible", timeout: 30_000 });
  const mail = page.locator("#jpjReceiptEmail");
  if ((await mail.isVisible().catch(() => false)) && (await mail.isEditable().catch(() => false)) && !(await mail.inputValue())) await mail.fill(email);
  if (!(await consent.isChecked())) await consent.click();
  await page.waitForFunction(() => (document.querySelector("#buyer-consent") as HTMLInputElement)?.checked, null, { timeout: 10_000 });
}

/** UCD to UCD STANDARD, buyer = logged-in UCD (Azfar1), seller = RICH BOYZ. */
async function utuStandardSeed(page: Page, mykad: MyKadClient, s: { ts: string; what: string; prefix: string; end: "payFail" | "approve" }) {
  const shots = new Shots(s.ts);
  const stms = new StmsWizardPage(page);
  const notes: string[] = [];
  const vehicle = nextVehicleNumber(s.prefix);
  const email = nextEmail();
  let step5 = "";
  let outcome = "";
  try {
    await home(page);
    await new UcdHomePage(page).goTo(UCD_MENU.ucdToUcd);
    await page.locator("a, button, div, li").filter({ hasText: /^\s*STANDARD\s*$/i }).first().click();
    await page.waitForLoadState("domcontentloaded");
    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    if (await page.locator("#sellerEmail").isVisible().catch(() => false)) await page.fill("#sellerEmail", email);
    await page.click("#seller-consent");
    await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
    await shots.take(page, "step1-seller-verified");
    await stms.continueToVehicle();
    await page.fill("#companyName", RICH_BOYZ.name);
    await page.fill("#companyRocNo", RICH_BOYZ.roc);
    await page.fill("#contactNo", nextMobile());
    const em = page.locator("#email");
    if (await em.isEditable().catch(() => false)) await em.fill(email);
    await page.fill("#mailingAddress", "NO 1 JALAN SEED, 81100 JOHOR BAHRU, JOHOR").catch(() => undefined);
    await page.getByText("Single Transaction", { exact: true }).click().catch(async () => { await page.locator("input[type=radio]").first().check(); });
    await page.fill("#vehicleRegNo", vehicle);
    await page.fill("#vehicleEngineNo", randomEngineNo());
    await page.fill("#vehicleChassisNo", randomChassisNo());
    await page.selectOption("#vehicleMake", { label: "Chery" });
    await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15000 }).catch(() => undefined);
    await page.selectOption("#vehicleModel", { index: 1 });
    await page.selectOption("#vehicleYear", { label: "2012" });
    await shots.take(page, "step2-filled");
    await page.click("#to-continue-company");
    await confirm(page);
    await tickBuyerConsent(page, email);
    await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
    await shots.take(page, "step3-buyer-verified");
    await stms.continueToJpjCheck();
    const enq = await stms.runJpjEnquiry();
    await shots.take(page, "step4-jpj-result");
    notes.push(`JPJ: ${enq.status} ${enq.responseCode}`);
    await stms.goToPayment();
    step5 = await paymentSummary(page);
    await shootStep5(page, shots);
    const pay = await stms.submitPaymentAndReadResult();
    await page.waitForTimeout(3000);
    await shootDialog(page, shots, pay.outcome === "rejected" ? "payment-rejected-dialog" : "step6-after-payment");
    outcome = pay.outcome === "rejected" ? `payment rejected: ${pay.message}` : `payment accepted → ${pay.url}`;
    if (s.end === "payFail" && pay.outcome !== "rejected") notes.push("EXPECTED a failed payment — check eSim RHB for " + s.prefix);
    if (s.end === "approve" && pay.outcome === "rejected") notes.push("EXPECTED approval — check eSim RHB for " + s.prefix);
  } catch (e) {
    notes.push("STOPPED: " + String(e).slice(0, 300));
    await shots.take(page, "zz-stopped");
  }
  const u = await ucdListing(page, vehicle, shots);
  const bo = await boListing(page, vehicle, shots);
  record({ ts: s.ts, what: s.what, instance: instance(), at: new Date().toISOString(), vehicle, transactionNo: u.tx,
    persona: "ucdE2E (Azfar1) buyer; seller RICH BOYZ 1231165-A", prefix: s.prefix, ucdRow: u.row, boRow: bo, step5, outcome, notes, screenshots: shots.files });
  return { vehicle, tx: u.tx };
}

/** UCD to UCD INTERSTATE, seller side: UCD A (Azfar1) → UCD B (faizuddin2). Vehicle must be held by UCD A. */
async function interstateSeller(page: Page, mykad: MyKadClient, vehicle: string, shots: Shots) {
  const stms = new StmsWizardPage(page);
  const email = nextEmail();
  await home(page);
  await new UcdHomePage(page).goTo(UCD_MENU.ucdToUcd);
  await page.locator("a, button, div, li").filter({ hasText: /^\s*INTERSTATE\s*$/i }).first().click();
  await page.waitForLoadState("domcontentloaded");
  await page.click("#create-tx");
  await page.waitForLoadState("domcontentloaded");
  await page.locator("input[type=text]:visible").first().fill(FAIZ_ROC);
  await page.locator("div.next-btn:visible, input[type=button]:visible, button:visible").filter({ hasText: /Next|Submit|Search|Continue|Proceed/i }).first().click();
  await confirm(page);
  await shots.take(page, "i0-buyer-found");
  await page.click("#to-continue");
  await confirm(page);
  await mykad.removeCard();
  await mykad.setMatchResult("Identical");
  await tickConsentWhenReady(page, "#seller-consent", email);
  await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
  await shots.take(page, "i1-seller-verified");
  await stms.continueToVehicle();
  const fillIf = async (sel: string, v: string) => {
    const l = page.locator(sel);
    if ((await l.isVisible().catch(() => false)) && (await l.isEditable().catch(() => false))) await l.fill(v);
  };
  await fillIf("#contactNo", nextMobile());
  await fillIf("#email", email);
  await fillIf("#mailingAddress", "NO 1 JALAN SEED, 81100 JOHOR BAHRU, JOHOR");
  await page.getByText("Single Transaction", { exact: true }).click().catch(() => undefined);
  await fillIf("#vehicleRegNo", vehicle);
  await fillIf("#vehicleEngineNo", randomEngineNo());
  await fillIf("#vehicleChassisNo", randomChassisNo());
  if (await page.locator("#vehicleMake").count()) {
    await page.selectOption("#vehicleMake", { label: "Chery" }).catch(() => undefined);
    await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15000 }).catch(() => undefined);
    await page.selectOption("#vehicleModel", { index: 1 }).catch(() => undefined);
    await page.selectOption("#vehicleYear", { label: "2012" }).catch(() => undefined);
  }
  if (await page.locator("#searchVehicleRegNo").isVisible().catch(() => false)) {
    await page.click("#searchVehicleRegNo");
    await confirm(page);
    await page.waitForTimeout(4000);
  }
  await shots.take(page, "i2-vehicle-get");
  if ((await page.locator("#to-agree").isVisible().catch(() => false)) && !(await page.locator("#to-agree").isChecked())) await page.click("#to-agree");
  if (await page.locator("#to-continue").isVisible().catch(() => false)) {
    await page.click("#to-continue");
    await confirm(page);
    await page.waitForTimeout(3000);
  }
  for (let i = 0; i < 4; i++) {
    if (await page.locator("#to-agree").isVisible().catch(() => false)) await page.click("#to-agree").catch(() => undefined);
    const btn = page.locator("div.next-btn:visible, input[type=button]:visible").filter({ hasText: /Enquiry|Submit|Send|Next|Continue/i }).first();
    if (!(await btn.isVisible().catch(() => false))) break;
    await btn.click();
    await confirm(page);
    if (/interstate.*(home|listing|enquiry)|enquiry\/main/i.test(page.url())) break;
  }
  await shots.take(page, "i3-seller-submitted");
  // Seller's Interstate listing
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/stms/interstate/enquiry.do");
  await page.fill("#vehicleNo", vehicle).catch(() => undefined);
  await page.click("#to-search").catch(() => undefined);
  await page.waitForTimeout(2500);
  const rows = await rowsOf(page);
  await shots.take(page, "i4-seller-interstate-listing", false);
  return rows.find((r) => r.includes(vehicle))?.join(" | ") ?? "(not in seller Interstate listing)";
}

/** Interstate buyer (UCD B, faizuddin2) accepts, thumbprints, JPJ, pays. */
async function interstateBuyerPay(page: Page, mykad: MyKadClient, vehicle: string, shots: Shots) {
  const stms = new StmsWizardPage(page);
  const email = nextEmail();
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/stms/enquiry/main.do");
  await page.fill("#vehicleNo", vehicle);
  await page.click("#to-search");
  await page.waitForTimeout(2500);
  await shots.take(page, "b0-buyer-listing", false);
  await page.locator("table tr", { hasText: vehicle }).locator("a, button, input").filter({ hasText: /accept/i }).first().click();
  await confirm(page);
  await mykad.removeCard();
  await mykad.setMatchResult("Identical");
  await tickBuyerConsent(page, email);
  await (stms as any).readMyKad(mykad, FAIZ_CARD);
  await shots.take(page, "b3-buyer-verified");
  await stms.continueToJpjCheck();
  await stms.runJpjEnquiry();
  await shots.take(page, "b4-jpj-result");
  await stms.goToPayment();
  const step5 = await paymentSummary(page);
  await shootStep5(page, shots, "b5-payment-summary");
  const pay = await stms.submitPaymentAndReadResult();
  await page.waitForTimeout(3000);
  await shootDialog(page, shots, pay.outcome === "rejected" ? "b6-payment-rejected-dialog" : "b6-after-payment");
  return { step5, outcome: pay.outcome === "rejected" ? `payment rejected: ${pay.message}` : `payment accepted → ${pay.url}` };
}

// ------------------------------------------------------------------ the seeds

const WHICH = (process.env.SEED ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const want = (id: string) => WHICH.includes("all") || WHICH.includes(id);

test.describe("12403 seed", () => {
  test.skip(!WHICH.length, "set SEED=<id,...> or SEED=all");
  test.setTimeout(20 * 60 * 1000);

  test("12403 seed — STMS", async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    if (want("STMS_DEP1_CAPTURE")) {
      // ON000004 was left at Step 5 on 2026-09-28 by the price probe; record it.
      const shots = new Shots("12403_STMS_DEP1");
      const v = process.env.SEED_VEHICLE ?? "ON000004";
      const u = await ucdListing(page, v, shots);
      const bo = await boListing(page, v, shots);
      record({ ts: "12403_STMS_DEP1", what: "STMS left unpaid at Step 5 across the push", instance: instance(), at: new Date().toISOString(),
        vehicle: v, transactionNo: u.tx, persona: "ucdE2E (Azfar1)", prefix: "ON", ucdRow: u.row, boRow: bo,
        step5: "Payment Summary JPJ STMS Fee : RM 10.00 eAuto STMS Fee : RM 20.00 Service Tax 8% : RM 1.60 Total Amount Payable : RM 31.60",
        outcome: "left at Step 5, not paid", screenshots: shots.files });
    }
    if (want("STMS_PAY1")) await stmsSeed(page, mykad, { ts: "12403_STMS_PAY1", what: "STMS Car, Payment Failed (RHB IF) — reset expected", prefix: "OQ", end: "payFail" });
    if (want("STMS_PAY2")) await stmsSeed(page, mykad, { ts: "12403_STMS_PAY2", what: "STMS Motosikal AA+MSL, Payment Failed (RHB IF) — reset expected, price unchanged", prefix: "OR", end: "payFail" });
    if (want("STMS_NEG1")) await stmsSeed(page, mykad, { ts: "12403_STMS_NEG1", what: "STMS Car, JPJ Enquiry Failed (4K), Payment - — NOT reset", prefix: "YN", end: "jpjFail", freshRange: true });
    if (want("STMS_NEG2")) await stmsSeed(page, mykad, { ts: "12403_STMS_NEG2", what: "STMS Motosikal AA+MSL Approved — NOT reset, no second debit", prefix: "OC", end: "approve" });
    if (want("STMS_INV2")) await stmsSeed(page, mykad, { ts: "12403_STMS_INV2", what: "STMS Car Approved before the push — documents + NOT reset", prefix: "ON", end: "approve" });
    // Source STMS for a later step (Interstate needs the vehicle held by UCD A;
    // APT needs an Approved STMS). SEED_APPROVE="<ts>:<prefix>[:sabah],..."
    for (const spec of (process.env.SEED_APPROVE ?? "").split(",").filter(Boolean)) {
      const [ts, prefix, region] = spec.split(":");
      await stmsSeed(page, mykad, { ts, what: `Source STMS (Approved) for ${ts.replace(/_SRC$/, "")}${region ? " — seller card " + region.toUpperCase() : ""}`,
        prefix, end: "approve", seller: region === "sabah" ? SABAH_SELLER : undefined });
    }
    if (want("APT_DEP1")) await stmsSeed(page, mykad, { ts: "12403_DEP1", what: "STMS Car Approved before the push, APT NOT triggered", prefix: "ON", end: "approve" });
  });

  test("12403 seed — UCD to UCD Standard", async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    if (want("UTU_PAY1")) await utuStandardSeed(page, mykad, { ts: "12403_UTU_PAY1", what: "UCD to UCD Standard Car, Payment Failed (RHB IF) — reset expected", prefix: "OQ", end: "payFail" });
    if (want("UTU_INV2")) await utuStandardSeed(page, mykad, { ts: "12403_STMS_INV2_UTU", what: "UCD to UCD Standard Car Approved before the push — documents + NOT reset", prefix: "ON", end: "approve" });
  });

  // Interstate: part 1 needs the vehicle HELD by UCD A, i.e. an Approved STMS
  // by Azfar1 on it. SEED_VEHICLE names that vehicle.
  test("12403 seed — Interstate seller", async ({ page, ucdSession, mykad }) => {
    test.skip(!want("UTU_DEP1") && !want("UTU_PAY2_SELLER") && !want("INTERSTATE_SELLER"), "no Interstate seller seed asked");
    const ts = process.env.SEED_TS ?? (want("UTU_DEP1") ? "12403_UTU_DEP1" : "12403_UTU_PAY2");
    const vehicle = process.env.SEED_VEHICLE!;
    await ucdSession("ucdE2E");
    const shots = new Shots(ts);
    const notes: string[] = [];
    let seller = "";
    try { seller = await interstateSeller(page, mykad, vehicle, shots); } catch (e) { notes.push("STOPPED: " + String(e).slice(0, 300)); await shots.take(page, "zz-stopped"); }
    const bo = await boListing(page, vehicle, shots);
    record({ ts, what: ts === "12403_UTU_DEP1" ? "Interstate New, pending buyer thumbprint across the push (48 h window)" : "Interstate, seller part (buyer pays next → fails)",
      instance: instance(), at: new Date().toISOString(), vehicle, persona: "ucdE2E (Azfar1) = UCD A → faizuddin2 (030312-A) = UCD B",
      prefix: vehicle.slice(0, 2), ucdRow: seller, boRow: bo, outcome: "seller submitted", notes, screenshots: shots.files,
      transactionNo: (bo.match(/Transaction No\.=(S\d+)/) ?? [])[1] });
  });

  test("12403 seed — Interstate buyer pays", async ({ page, ucdSession, mykad }) => {
    test.skip(!want("UTU_PAY2_BUYER") && !want("INTERSTATE_BUYER"), "no Interstate buyer seed asked");
    const vehicle = process.env.SEED_VEHICLE!;
    await ucdSession("ucdE2E2");
    const shots = new Shots(process.env.SEED_TS ?? "12403_UTU_PAY2");
    const notes: string[] = [];
    let r = { step5: "", outcome: "" };
    try { r = await interstateBuyerPay(page, mykad, vehicle, shots); } catch (e) { notes.push("STOPPED: " + String(e).slice(0, 300)); await shots.take(page, "zz-stopped"); }
    const u = await ucdListing(page, vehicle, shots, "b9-buyer-stms-listing");
    const bo = await boListing(page, vehicle, shots);
    record({ ts: process.env.SEED_TS ?? "12403_UTU_PAY2", what: process.env.SEED_TS ? "UCD to UCD Interstate, buyer pays" : "UCD to UCD Interstate Car, buyer Payment Failed (RHB IF) — reset expected", instance: instance(), at: new Date().toISOString(),
      vehicle, transactionNo: u.tx, persona: "ucdE2E2 (faizuddin2) = UCD B, paying", prefix: vehicle.slice(0, 2), ucdRow: u.row, boRow: bo, step5: r.step5, outcome: r.outcome, notes, screenshots: shots.files });
  });

  // APT: BO Manual APT Trigger (5.5 then 6.0) for an Approved source STMS.
  // SEED_APT_TRIGGER="<ts>:<vehicle>,..."
  test("12403 seed — APT trigger", async ({ page, ucdSession }) => {
    const list = (process.env.SEED_APT_TRIGGER ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "no SEED_APT_TRIGGER");
    const ctx = await page.context().browser()!.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    await ucdSession("ucdE2E");
    for (const spec of list) {
      const [ts, vehicle] = spec.split(":");
      const shots = new Shots(ts);
      const notes: string[] = [];
      const dialogs: string[] = [];
      bo.on("dialog", (d) => { dialogs.push(d.message()); d.accept().catch(() => undefined); });
      const search = async () => {
        await bo.goto("view/stms/manual-trigger-apt");
        await bo.fill("#vehicleRegNo", vehicle);
        await bo.fill("#companyRoc", "JM0570913-X");
        await bo.click("#to-search");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await bo.waitForTimeout(1500);
      };
      for (const [btn, label] of [["#jpjNotice", "5.5"], ["#jpjPermanent", "6.0"]] as const) {
        await search();
        const b = bo.locator(btn).first();
        if (!(await b.isVisible().catch(() => false))) { notes.push(`${label}: button not shown`); await shots.take(bo, `bo-trigger-${label}-missing`); continue; }
        // BO refuses either notice without an Expiry Date. Use the STMS's own
        // 6-month expiry (what JPJ's submission reply carries) — an assumption,
        // recorded in the notes. Override with SEED_APT_EXPIRY.
        const expiry = process.env.SEED_APT_EXPIRY ?? "2027-03-28";
        const dateBox = bo.locator("input.hasDatepicker:visible").first();
        // Readonly jQuery UI datepicker: set it through its own API so the
        // value lands in whatever format the page is configured for.
        await dateBox.evaluate((el, iso) => {
          const [y, m, d] = iso.split("-").map(Number);
          (window as any).jQuery(el).datepicker("setDate", new Date(y, m - 1, d));
        }, expiry);
        notes.push(`${label}: Expiry Date keyed = ${expiry} (box shows "${await dateBox.inputValue().catch(() => "?")}")`);
        await b.click();
        const yes = bo.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm|Proceed)$/i }).first();
        if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) {
          dialogs.push((await bo.locator(".ui-dialog:visible").first().innerText()).replace(/\s+/g, " ").slice(0, 200));
          await yes.click();
        }
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await bo.waitForTimeout(2500);
        const msg = (await bo.locator(".ui-dialog:visible, .alert:visible, .message:visible, .success:visible, .error:visible").allInnerTexts().catch(() => [])).join(" ").replace(/\s+/g, " ");
        notes.push(`${label}: ${msg.slice(0, 200) || "(no message)"}`);
        await shots.take(bo, `bo-trigger-${label}`);
        const ok = bo.locator(".ui-dialog-buttonpane button", { hasText: /^(OK|Close)$/i }).first();
        if (await ok.isVisible().catch(() => false)) await ok.click();
      }
      if (dialogs.length) notes.push("dialogs: " + dialogs.join(" | ").slice(0, 400));
      // UCD APT listing
      const root = page.url().replace(/\/view\/.*/, "");
      await page.goto(root + "/view/ucd/apt/enquiry/");
      await page.waitForTimeout(1500);
      const vbox = page.locator("#vehicleNo, input[name*=ehicle i]").first();
      if (await vbox.isVisible().catch(() => false)) await vbox.fill(vehicle);
      await page.click("#to-search").catch(() => undefined);
      await page.waitForTimeout(3000);
      const rows = await rowsOf(page);
      const header = rows.find((r) => r[0] === "#") ?? [];
      const hit = rows.find((r) => r.includes(vehicle) && r[0] !== "#");
      await highlightRowCells(page, vehicle, UCD_COLS, `UCD APT listing — ${vehicle}`);
      await shots.take(page, "ucd-apt-listing", false);
      await clearHighlights(page);
      const ucdRow = hit ? header.map((h, i) => `${h}=${hit[i] ?? ""}`).filter((x) => !/^#=|^=/.test(x)).join(" · ") : "(not in UCD APT listing)";
      record({ ts, what: "APT triggered (5.5 → 6.0) by BO Manual APT Trigger", instance: instance(), at: new Date().toISOString(), vehicle,
        transactionNo: hit?.map((c) => c.trim()).find((c) => /^A\d{6,}$/.test(c)), persona: "bo (jasons) trigger; ucdE2E (Azfar1) listing",
        prefix: vehicle.slice(0, 2), ucdRow, outcome: "APT triggered", notes, screenshots: shots.files });
    }
    await ctx.close();
  });

  // APT payment from UCD APT Transaction Listing > Resubmit > Step 5 > Next.
  // SEED_APT_PAY="<ts>:<vehicle>:<ok|fail>,..."
  test("12403 seed — APT pay", async ({ page, ucdSession }) => {
    const list = (process.env.SEED_APT_PAY ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "no SEED_APT_PAY");
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    const stms = new StmsWizardPage(page);
    for (const spec of list) {
      const [ts, vehicle, want] = spec.split(":");
      const shots = new Shots(ts);
      const notes: string[] = [];
      let step5 = "", outcome = "";
      const listing = async (label: string) => {
        await page.goto(root + "/view/ucd/apt/enquiry/");
        await page.fill("#vehicleNo", vehicle);
        await page.click("#to-search");
        await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(1000);
        const rows = await rowsOf(page);
        const header = rows.find((r) => r[0] === "#") ?? [];
        const hit = rows.find((r) => r.includes(vehicle) && r[0] !== "#");
        await highlightRowCells(page, vehicle, UCD_COLS, `UCD APT listing — ${vehicle}`);
        await shots.take(page, label, false);
        await clearHighlights(page);
        return { row: hit ? header.map((h, i) => `${h}=${hit[i] ?? ""}`).filter((x) => !/^#=|^=/.test(x)).join(" · ") : "(not listed)",
                 tx: hit?.map((c) => c.trim()).find((c) => /^A\d{6,}$/.test(c)) };
      };
      try {
        await listing("apt-listing-before");
        await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /Resubmit/i }).first().click();
        await page.waitForURL(/apt\/transaction\/payment\.do/, { timeout: 60_000 });
        step5 = await paymentSummary(page);
        await shootStep5(page, shots);
        let pay = await stms.submitPaymentAndReadResult();
        // APT does not navigate on success: it raises "Payment request sent".
        if (pay.outcome === "rejected" && /Payment request sent/i.test(pay.message)) pay = { outcome: "transferred", url: page.url() };
        
        await page.waitForTimeout(3000);
        await shootDialog(page, shots, pay.outcome === "rejected" ? "payment-rejected-dialog" : "step6-after-payment");
        outcome = pay.outcome === "rejected" ? `payment rejected: ${pay.message}` : `payment accepted → ${pay.url}`;
        if (want === "fail" && pay.outcome !== "rejected") notes.push("EXPECTED a failed payment — check eSim RHB for " + vehicle.slice(0, 2));
        if (want === "ok" && pay.outcome === "rejected") notes.push("EXPECTED payment OK — check eSim RHB for " + vehicle.slice(0, 2));
        if (pay.outcome === "transferred") {
          await page.locator("body").filter({ hasText: /Transfer Status|Approved|SUCCESSFUL/i }).waitFor({ timeout: 90_000 }).catch(() => undefined);
          await shots.take(page, "step6-transfer");
        }
      } catch (e) {
        notes.push("STOPPED: " + String(e).slice(0, 300));
        await shots.take(page, "zz-stopped");
      }
      const u = await listing("apt-listing-after");
      record({ ts, what: `APT payment (${want === "ok" ? "expected OK" : "expected Failed, RHB IF"})`, instance: instance(), at: new Date().toISOString(), vehicle,
        transactionNo: u.tx, persona: "ucdE2E (Azfar1)", prefix: vehicle.slice(0, 2), ucdRow: u.row, step5, outcome, notes, screenshots: shots.files });
    }
  });

  // Documents on an Approved transaction, saved as pre-push evidence.
  // SEED_DOCS="<ts>:<vehicle>:<stms|apt>,..."
  test("12403 seed — documents", async ({ page, ucdSession }) => {
    const list = (process.env.SEED_DOCS ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "no SEED_DOCS");
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    for (const spec of list) {
      const [ts, vehicle, kind] = spec.split(":");
      const shots = new Shots(ts);
      const notes: string[] = [];
      await page.goto(root + (kind === "apt" ? "/view/ucd/apt/enquiry/" : "/view/ucd/stms/enquiry/main.do"));
      await page.fill("#vehicleNo", vehicle);
      await page.click("#to-search");
      await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 });
      await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /^View$/ }).first().click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await shots.take(page, `${vehicle}-details`);
      // QA 2026-09-28: 12403_X/downloadable (before)/<vehicle>_invoice.pdf etc.
      const phase = process.env.SEED_DOCS_PHASE ?? "before";
      const ddir = path.join(shots.dir, `downloadable (${phase})`);
      fs.mkdirSync(ddir, { recursive: true });
      const docName = (doc: string) => `${vehicle}${kind === "apt" ? "_APT" : ""}_${doc}`;
      const save = (doc: string, ext = "pdf") => {
        const f = path.join(ddir, `${docName(doc)}.${ext}`);
        shots.files.push(`${shots.folder}/downloadable (${phase})/${path.basename(f)}`);
        return f;
      };
      for (const [id, name] of [["#to-print-invoice", "invoice"], ["#to-print-e-invoice", "e-invoice"], ["#to-print", "slip-pengesahan"], ["#to-print-jpj-receipt", "jpj-official-receipt"]]) {
        const b = page.locator(id).first();
        if (!(await b.isVisible().catch(() => false))) { notes.push(`${name}: button not shown`); continue; }
        if (await b.isDisabled().catch(() => false)) { notes.push(`${name}: button disabled`); continue; }
        const dl = page.waitForEvent("download", { timeout: 25_000 }).then((d) => ({ d })).catch(() => null);
        const pop = page.context().waitForEvent("page", { timeout: 25_000 }).then((p) => ({ p })).catch(() => null);
        await b.click();
        const got = await Promise.race([dl, pop, page.waitForTimeout(26_000).then(() => null)]);
        if (got && "d" in got && got.d) {
          const f = save(name, (got.d.suggestedFilename().split(".").pop() || "pdf").toLowerCase());
          await got.d.saveAs(f);
          notes.push(`${name}: downloaded ${path.basename(f)}`);
        } else if (got && "p" in got && got.p) {
          const p = got.p;
          await p.waitForLoadState("load").catch(() => undefined);
          await p.waitForTimeout(3000);
          const res = await page.context().request.get(p.url()).catch(() => null);
          const ct = res?.headers()["content-type"] ?? "";
          if (res && /pdf/i.test(ct)) { const f = save(name); fs.writeFileSync(f, await res.body()); notes.push(`${name}: saved ${path.basename(f)}`); }
          else {
            const f = save(name, "png");
            await p.screenshot({ path: f, fullPage: true }).catch(() => undefined);
            notes.push(`${name}: opened ${p.url().replace(/\?.*/, "")} (${ct || "no content-type"}) — screenshot saved`);
          }
          await p.close().catch(() => undefined);
        } else {
          const msg = (await page.locator(".ui-dialog:visible").allInnerTexts().catch(() => [])).join(" ").replace(/\s+/g, " ");
          notes.push(`${name}: nothing opened${msg ? " — dialog: " + msg.slice(0, 160) : ""}`);
          await shots.take(page, `${vehicle}-${name}-no-doc`);
          const ok = page.locator(".ui-dialog-buttonpane button").first();
          if (await ok.isVisible().catch(() => false)) await ok.click();
        }
      }
      record({ ts, what: `Documents saved before the push (${kind.toUpperCase()} ${vehicle})`, instance: instance(), at: new Date().toISOString(), vehicle,
        persona: "ucdE2E (Azfar1)", prefix: vehicle.slice(0, 2), outcome: "documents", notes, screenshots: shots.files });
    }
  });

  // PRE1 baseline: tiles, module pages, and the BO Failed population export.
  test("12403 seed — PRE1 baseline", async ({ page, ucdSession }) => {
    test.skip(!want("PRE1"), "SEED=PRE1");
    const shots = new Shots("12403_STMS_PRE1");
    const notes: string[] = [];
    await ucdSession("ucdE2E");
    await home(page);
    const tiles = (await text(page)).replace(/\s+/g, " ").match(/You have[\s\S]*?(?=HOME INSURANCE|$)/)?.[0] ?? (await text(page)).slice(0, 800);
    notes.push("Home tiles: " + tiles.slice(0, 600));
    await shots.take(page, "ucd-home-tiles");
    const root = page.url().replace(/\/view\/.*/, "");
    for (const [name, p] of [["stms-module-page", "/view/ucd/stms/view.do"], ["ucd-to-ucd-page", "/view/ucd/stms/interstate/ucd-view.do"]]) {
      await page.goto(root + p);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const price = ((await text(page)).match(/[^\n]*RM\s?\d+\*?[^\n]*/g) ?? []).slice(0, 4).join(" / ");
      notes.push(`${name}: ${price.replace(/\s+/g, " ").slice(0, 300)}`);
      await shots.take(page, name);
    }
    // BO: Failed population, STMS and APT, with export if offered.
    const ctx = await page.context().browser()!.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL(), acceptDownloads: true });
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    for (const [name, p] of [["bo-stms-failed", "view/stms/enquiry"], ["bo-apt-failed", "view/apt/enquiry"]]) {
      await bo.goto(p);
      await bo.waitForLoadState("networkidle").catch(() => undefined);
      // date range: from 01-01-2026 to today, where the form asks for it
      const dates = bo.locator("input.hasDatepicker:visible");
      const n = await dates.count();
      for (let i = 0; i < Math.min(n, 2); i++) {
        await dates.nth(i).evaluate((el, first) => { (window as any).jQuery(el).datepicker("setDate", first ? new Date(2026, 0, 1) : new Date()); }, i === 0);
      }
      // Tx Status filter is a single select. STMS has no Payment-status filter,
      // so Failed here includes JPJ-enquiry failures as well as payment failures.
      await bo.selectOption("#to-filter", { label: "Failed" }).catch(() => notes.push(`${name}: could not select Tx Status = Failed`));
      await bo.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click();
      await bo.waitForLoadState("networkidle").catch(() => undefined);
      await bo.waitForTimeout(3000);
      const total = ((await bo.locator("body").innerText()).match(/\d+ record\(s\) in total/) ?? ["?"])[0];
      notes.push(`${name}: ${total}`);
      await shots.take(bo, name, false);
      const exp = bo.locator("a, button, input[type=button], input[type=submit]").filter({ hasText: /export|csv|excel/i }).first();
      const expVal = bo.locator("input[value*=Export i], input[value*=CSV i]").first();
      const target = (await exp.isVisible().catch(() => false)) ? exp : (await expVal.isVisible().catch(() => false)) ? expVal : null;
      if (!target) { notes.push(`${name}: no export control`); continue; }
      notes.push(`${name}: export control = ${(await target.evaluate((e: any) => `${e.tagName}#${e.id} [${(e.innerText || e.value || "").trim()}] href=${e.getAttribute("href") ?? ""}`))}`);
      const dl = await Promise.all([bo.waitForEvent("download", { timeout: 60_000 }).catch(() => null), target.click()]).then(([d]) => d);
      if (dl) { const f = shots.file(`export-${name}-${dl.suggestedFilename()}`); await dl.saveAs(f); notes.push(`${name}: exported ${path.basename(f)}`); }
      else notes.push(`${name}: export clicked, no download`);
    }
    await ctx.close();
    record({ ts: "12403_STMS_PRE1", what: "Baseline before the push: tiles, module pages, BO Failed population", instance: instance(), at: new Date().toISOString(),
      vehicle: "-", persona: "ucdE2E (Azfar1); bo (jasons)", prefix: "-", outcome: "baseline", notes, screenshots: shots.files });
  });

  // BO > APT Transaction listing row for APT seeds. SEED_BO_APT="<ts>:<vehicle>,..."
  test("12403 seed — BO APT listing", async ({ page }) => {
    const list = (process.env.SEED_BO_APT ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "no SEED_BO_APT");
    await new LoginPage(page).as("bo");
    for (const spec of list) {
      const [ts, vehicle] = spec.split(":");
      const shots = new Shots(ts);
      await page.goto("view/apt/enquiry");
      await page.fill("#vehicleNo", vehicle);
      await page.click("#to-search");
      await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
      const rows = await rowsOf(page);
      const header = rows.find((r) => r[0] === "#") ?? [];
      const hit = rows.find((r) => r.includes(vehicle) && r[0] !== "#");
      await highlightRowCells(page, vehicle, BO_COLS, `BO APT — ${vehicle}`);
      await shots.take(page, `bo-apt-enquiry-${vehicle}`, false);
      await clearHighlights(page);
      const boRow = hit ? header.map((h, i) => `${h}=${hit[i] ?? ""}`).filter((x) => !/^#=|^=/.test(x)).join(" · ") : "(not listed)";
      record({ ts, what: "BO APT Transaction listing (pre-push)", instance: instance(), at: new Date().toISOString(), vehicle,
        transactionNo: hit?.map((c) => c.trim()).find((c) => /^A\d{6,}$/.test(c)), persona: "bo (jasons)", prefix: vehicle.slice(0, 2),
        boRow, outcome: "BO listing captured", screenshots: shots.files });
    }
  });

  // Copy this test's video into the evidence folder when RECORD=1.
  test.beforeEach(() => touched.clear());
  // The test's video goes into the folder of every TS it touched. Run one TS
  // per test when recording, so each video shows only that TS.
  test.afterEach(async ({ page }, info) => {
    const v = page.video();
    if (!v || process.env.RECORD !== "1" || !touched.size) return;
    await page.close();
    const src = await v.path().catch(() => "");
    if (!src || !fs.existsSync(src)) return;
    void info;
    for (const folder of touched) {
      // QA 2026-09-28: video_<TS>.webm, numbered in capture order when a TS has several.
      // video_<TS>.webm when it is the only one; video_<TS>_01.. in capture order otherwise.
      const dir = path.join(EVID, folder);
      const vids = fs.readdirSync(dir).filter((f) => /^video_/.test(f)).sort((a, b) => fs.statSync(path.join(dir, a)).mtimeMs - fs.statSync(path.join(dir, b)).mtimeMs);
      fs.copyFileSync(src, path.join(dir, "__new.webm"));
      const all = [...vids, "__new.webm"];
      all.forEach((f, k) => fs.renameSync(path.join(dir, f), path.join(dir, `__v${k}.webm`)));
      all.forEach((_, k) => fs.renameSync(path.join(dir, `__v${k}.webm`), path.join(dir, all.length === 1 ? `video_${folder}.webm` : `video_${folder}_${String(k + 1).padStart(2, "0")}.webm`)));
      console.log(`  video: ${folder} (${all.length} video${all.length > 1 ? "s" : ""})`);
    }
  });

  // R5: record the eSERAHAN fee BEFORE the push, walking to its payment screen
  // WITHOUT paying (the draft is left unpaid).
  test("12403 seed — R5 eSerahan fee", async ({ page, ucdSession, mykad }) => {
    test.skip(!want("R5"), "SEED=R5");
    const { EstmWizardPage } = await import("@pages/ucd/estm-wizard.page");
    const { IdCategory } = await import("@pages/wizard.page");
    await ucdSession("ucdE2E");
    const shots = new Shots("12403_R5");
    const notes: string[] = [];
    const estm = new EstmWizardPage(page);
    // TE = JPJ OK on eSim; a separate TE9 counter keeps clear of low numbers
    // that may already exist on preprod1.
    const vehicle = nextVehicleNumber("TE9", 5);
    let step5 = "";
    try {
      await home(page);
      await estm.startNewTransaction();
      await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);
      await estm.authenticateBuyer({ vehicleRegNo: vehicle, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
      await estm.continueToVehicle();
      await estm.fillBuyerAndVehicleDetails({ buyerEmail: nextEmail(), contactNo: nextMobile(), engineNo: randomEngineNo(), chassisNo: randomChassisNo() });
      await estm.continueToSeller();
      await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
      await estm.continueToJpjCheck();
      await estm.runJpjEnquiry();
      const where = await estm.goToPayment();
      notes.push(`goToPayment landed on: ${where}`);
      step5 = await paymentSummary(page);
      await shootStep5(page, shots, "estm-step5-payment-summary");
      notes.push(`Total as printed: ${await estm.totalPayable().catch(() => "?")}`);
      notes.push("NOT paid — draft left at payment.");
    } catch (e) {
      notes.push("STOPPED: " + String(e).slice(0, 300));
      await shots.take(page, "zz-stopped");
    }
    record({ ts: "12403_R5", what: "eSERAHAN fee before the push (not paid)", instance: instance(), at: new Date().toISOString(), vehicle,
      persona: "ucdE2E (Azfar1)", prefix: "TE", step5, outcome: "fee recorded", notes, screenshots: shots.files });
  });

  // Evidence gaps (28.09.2026): screenshots that the first seeding pass did not
  // take. Reaches Step 5 WITHOUT paying. Refuses to record anything as
  // "before the push" if Step 5 already shows the new price.
  test("12403 seed — evidence gaps", async ({ page, ucdSession, browser }) => {
    test.skip(!want("GAPS"), "SEED=GAPS");
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    const stamp = () => new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur" });

    const stepFive = async (ts: string, vehicle: string, kind: "stms" | "apt", oldTotal: string) => {
      const shots = new Shots(ts);
      const notes: string[] = [];
      await page.goto(root + (kind === "apt" ? "/view/ucd/apt/enquiry/" : "/view/ucd/stms/enquiry/main.do"));
      await page.fill("#vehicleNo", vehicle);
      await page.click("#to-search");
      await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 });
      await page.waitForTimeout(800);
      await highlightRowCells(page, vehicle, UCD_COLS, `UCD ${kind.toUpperCase()} listing — ${vehicle}`);
      await shots.take(page, "gap-ucd-listing", false);
      await clearHighlights(page);
      const listRow = (await page.locator("table tr", { hasText: vehicle }).first().innerText()).replace(/\s+/g, " ");
      await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /Resubmit/i }).first().click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
      if (await yes.isVisible({ timeout: 4000 }).catch(() => false)) await yes.click();
      await page.locator("body").filter({ hasText: /Total Amount Payable/ }).waitFor({ timeout: 60_000 }).catch(() => undefined);
      const step5 = await paymentSummary(page);
      notes.push(`captured ${stamp()} (MYT); landed on ${page.url().replace(/\?.*/, "")}`);
      notes.push(`listing row: ${listRow.slice(0, 220)}`);
      const isOld = step5.includes(oldTotal);
      if (!isOld) notes.push(`WARNING: Step 5 does not show the old total ${oldTotal} — the push may already be live. NOT pre-push evidence.`);
      await shootStep5(page, shots, "gap-step5-payment-summary");
      notes.push("NOT paid — left as it was.");
      record({ ts, what: `Evidence gap filled: Step 5 ${isOld ? "before the push" : "(push may be live!)"}`, instance: instance(), at: new Date().toISOString(),
        vehicle, persona: "ucdE2E (Azfar1)", prefix: vehicle.slice(0, 2), step5, outcome: isOld ? `Step 5 still ${oldTotal}` : "PRICE ALREADY CHANGED", notes, screenshots: shots.files });
      return isOld;
    };

    const only = (process.env.SEED_GAPS ?? "STMS_DEP1,PAY2,UTU_DEP1").split(",");
    if (only.includes("STMS_DEP1") && !(await stepFive("12403_STMS_DEP1", "ON000004", "stms", "RM 31.60"))) return;
    if (only.includes("PAY2") && !(await stepFive("12403_PAY2", "OT000002", "apt", "RM 121.60"))) return;
    // with AZFARAZO switched to SABAH beforehand (bo-company-address.spec.ts)
    if (only.includes("PAY2_SABAH") && !(await stepFive("12403_PAY2_SABAH", "OT000002", "apt", "RM 61.60"))) return;
    if (!only.includes("UTU_DEP1")) return;

    // UTU_DEP1: the buyer's (faizuddin2) view of the Interstate New transaction.
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
    const b = await ctx.newPage();
    const shots = new Shots("12403_UTU_DEP1");
    await new LoginPage(b).as("ucdE2E2");
    await new StmsWizardPage(b).dismissAnnouncements();
    const broot = b.url().replace(/\/view\/.*/, "");
    await b.goto(broot + "/view/ucd/stms/enquiry/main.do");
    await b.fill("#vehicleNo", "ON000009");
    await b.click("#to-search");
    await b.locator("table tr", { hasText: "ON000009" }).first().waitFor({ timeout: 20_000 }).catch(() => undefined);
    await b.waitForTimeout(800);
    const row = (await b.locator("table tr", { hasText: "ON000009" }).first().innerText().catch(() => "(not listed)")).replace(/\s+/g, " ");
    await highlightRowCells(b, "ON000009", UCD_COLS, "UCD B (faizuddin2) listing — ON000009");
    await shots.take(b, "gap-buyer-ucdB-stms-listing", false);
    await clearHighlights(b);
    record({ ts: "12403_UTU_DEP1", what: "Evidence gap filled: buyer (UCD B) listing before the push", instance: instance(), at: new Date().toISOString(),
      vehicle: "ON000009", transactionNo: "S694494114", persona: "ucdE2E2 (faizuddin2) = UCD B", prefix: "ON", ucdRow: row,
      outcome: "buyer listing captured", notes: [`captured ${stamp()} (MYT)`], screenshots: shots.files });
    await ctx.close();
  });

  // 12403_DEP1 expects "No APT transaction exists yet" — prove it on UCD and BO.
  test("12403 seed — DEP1 no APT yet", async ({ page, ucdSession, browser }) => {
    test.skip(!want("DEP1_NOAPT"), "SEED=DEP1_NOAPT");
    const v = "ON000006";
    const shots = new Shots("12403_DEP1");
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    await page.goto(root + "/view/ucd/apt/enquiry/");
    await page.fill("#vehicleNo", v);
    await page.click("#to-search");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2500);
    const listed = await page.locator("table tr", { hasText: v }).count();
    await highlight(page, page.locator("#vehicleNo"), `searched ${v}`, 300);
    await highlight(page, page.locator("table").filter({ hasText: /Transaction No/ }).last(), listed ? `${v} IS listed` : `no APT for ${v}`);
    await shots.take(page, "ucd-apt-listing-no-record", false);
    await clearHighlights(page);
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    await bo.goto("view/stms/manual-trigger-apt");
    await bo.fill("#vehicleRegNo", v);
    await bo.fill("#companyRoc", "JM0570913-X");
    await bo.click("#to-search");
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(1500);
    const row = (await bo.locator("tr", { hasText: v }).last().innerText().catch(() => "(not found)")).replace(/\s+/g, " ");
    await highlight(bo, bo.locator("tr", { hasText: v }).last(), "STMS approved, 5.5 / 6.0 not triggered");
    await shots.take(bo, "bo-manual-apt-trigger-not-triggered", false);
    await ctx.close();
    record({ ts: "12403_DEP1", what: "No APT transaction exists yet (before the push)", instance: instance(), at: new Date().toISOString(), vehicle: v,
      transactionNo: "S694494108", persona: "ucdE2E (Azfar1); bo (jasons)", prefix: "ON",
      ucdRow: listed ? `LISTED (${listed})` : "UCD APT listing: no record", boRow: row,
      outcome: listed ? "APT EXISTS — check" : "no APT yet", notes: [], screenshots: shots.files });
  });

  // 12403_PAY2 as written: Approved STMS -> eSTM (eSerahan) on the SAME vehicle
  // -> eSTM enquiry VEL000392E -> the APT appears Pending. NEVER pays.
  // SEED_VEHICLE = the approved OT vehicle.
  test("12403 seed — PAY2 eSTM route", async ({ page, ucdSession, browser, mykad }) => {
    test.skip(!want("PAY2_ESTM"), "SEED=PAY2_ESTM");
    const vehicle = process.env.SEED_VEHICLE!;
    const { EstmWizardPage } = await import("@pages/ucd/estm-wizard.page");
    const { IdCategory } = await import("@pages/wizard.page");
    const shots = new Shots("12403_PAY2_ESTM");
    const notes: string[] = [];
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    const aptRow = async (label: string) => {
      await page.goto(root + "/view/ucd/apt/enquiry/");
      await page.fill("#vehicleNo", vehicle);
      await page.click("#to-search");
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(2500);
      const hit = page.locator("table tr", { hasText: vehicle }).first();
      const row = (await hit.count()) ? (await hit.innerText()).replace(/\s+/g, " ") : "(no APT)";
      if (await hit.count()) await highlightRowCells(page, vehicle, UCD_COLS, `UCD APT listing — ${vehicle}`);
      else await highlight(page, page.locator("table").filter({ hasText: /Transaction No/ }).last(), `no APT for ${vehicle}`);
      await shots.take(page, label, false);
      await clearHighlights(page);
      return row;
    };
    notes.push("APT listing before eSTM: " + (await aptRow("ucd-apt-listing-before-estm")).slice(0, 200));

    const estm = new EstmWizardPage(page);
    let enquiry = "";
    try {
      await home(page);
      await estm.startNewTransaction();
      await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);
      await estm.authenticateBuyer({ vehicleRegNo: vehicle, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
      await shots.take(page, "step1-buyer-verified");
      await estm.continueToVehicle();
      await estm.fillBuyerAndVehicleDetails({ buyerEmail: nextEmail(), contactNo: nextMobile(), engineNo: randomEngineNo(), chassisNo: randomChassisNo() });
      await shots.take(page, "step2-filled");
      await estm.continueToSeller();
      await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
      await shots.take(page, "step3-seller-verified");
      await estm.continueToJpjCheck();
      // Step 4 by hand: the page object waits for Make Payment, which a
      // VEL000392E reply should not offer.
      await page.locator("#to-agree").click();
      await page.locator("#to-enquiry").click();
      const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm|Next)$/ }).first();
      if (await yes.isVisible({ timeout: 8000 }).catch(() => false)) await yes.click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(8000);
      const body = (await text(page)).replace(/\s+/g, " ");
      enquiry = (body.match(/(VEL000392E[^|]{0,200})|(Response Code:[^|]{0,160})|(JPJ Enquiry Status:[^|]{0,120})/) ?? [""])[0];
      const dlg = page.locator(".ui-dialog:visible").last();
      if (await dlg.isVisible().catch(() => false)) {
        notes.push("dialog: " + (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 300));
        await highlight(page, dlg, "eSTM enquiry result");
      } else {
        await highlight(page, page.locator("tr, li, div.row, p, div").filter({ hasText: /^\s*(JPJ Enquiry Status|Response Code|Status)\s*:/ }).last(), "eSTM enquiry result");
      }
      await shots.take(page, "step4-estm-enquiry-result");
      await clearHighlights(page);
      notes.push(`eSTM enquiry: ${enquiry || "(see screenshot)"}`);
      notes.push(`payment offered: ${await page.locator("#to-payment").isVisible().catch(() => false)} — NOT pressed`);
    } catch (e) {
      notes.push("STOPPED: " + String(e).slice(0, 300));
      await shots.take(page, "zz-stopped");
    }
    const after = await aptRow("ucd-apt-listing-after-estm");
    notes.push("APT listing after eSTM: " + after.slice(0, 220));
    // eSTM listing (the eSTM transaction itself)
    await page.goto(root + "/view/ucd/estm/enquiry/main.do").catch(() => undefined);
    if (await page.locator("#vehicleNo").isVisible().catch(() => false)) {
      await page.fill("#vehicleNo", vehicle);
      await page.click("#to-search");
      await page.waitForTimeout(2500);
      const r = (await page.locator("table tr", { hasText: vehicle }).first().innerText().catch(() => "(not listed)")).replace(/\s+/g, " ");
      notes.push("eSTM listing: " + r.slice(0, 220));
      await highlightRowCells(page, vehicle, UCD_COLS, `UCD eSTM listing — ${vehicle}`);
      await shots.take(page, "ucd-estm-listing", false);
      await clearHighlights(page);
    } else notes.push("eSTM listing: page not at /view/ucd/estm/enquiry/main.do");
    // BO APT
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    await bo.goto("view/apt/enquiry");
    await bo.fill("#vehicleNo", vehicle);
    await bo.click("#to-search");
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(2500);
    const boRow = (await bo.locator("table tr", { hasText: vehicle }).last().innerText().catch(() => "(not listed)")).replace(/\s+/g, " ");
    await highlightRowCells(bo, vehicle, BO_COLS, `BO APT — ${vehicle}`);
    await shots.take(bo, `bo-apt-enquiry-${vehicle}`, false);
    await ctx.close();
    record({ ts: "12403_PAY2_ESTM", what: "12403_PAY2 as written: eSTM on the same vehicle (VEL000392E) → APT Pending, not paid", instance: instance(),
      at: new Date().toISOString(), vehicle, transactionNo: (after.match(/A\d{7,}/) ?? [])[0], persona: "ucdE2E (Azfar1)", prefix: vehicle.slice(0, 2),
      ucdRow: after, boRow, outcome: /Pending/.test(after) ? "APT Pending via eSTM" : "CHECK — APT not Pending / not created", notes, screenshots: shots.files });
  });

  // BO > RHB Payment Transaction: the amount actually debited for a vehicle.
  // SEED_RHB="<ts>:<vehicle>,..." (today's payments; the page has no vehicle box)
  test("12403 seed — BO RHB debit", async ({ page }) => {
    const list = (process.env.SEED_RHB ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "no SEED_RHB");
    await new LoginPage(page).as("bo");
    for (const spec of list) {
      const [ts, vehicle] = spec.split(":");
      const shots = new Shots(ts);
      await page.goto("view/payment/rhb-payment-transaction");
      await page.click("#to-search");
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(2500);
      // Only the listing's own rows (the page nests it in a layout table),
      // every row for this vehicle — an STMS payment is split into debits.
      const found = await page.evaluate((v) => {
        const norm = (x: string) => x.replace(/\s+/g, " ").trim();
        const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
        const all = Array.from(document.querySelectorAll("tr")).filter((tr) => own(tr).length > 4);
        // a payment = the row carrying the vehicle + the split row(s) under it (rowspan)
        const rows: Element[] = [];
        all.forEach((tr, k) => {
          if (!norm(tr.textContent || "").includes(v)) return;
          rows.push(tr);
          for (let n = k + 1; n < all.length && own(all[n]).length < own(tr).length; n++) rows.push(all[n]);
        });
        if (!rows.length) return [] as string[];
        const table = rows[0].closest("table")!;
        const header = Array.from(table.querySelectorAll("tr")).find((tr) => tr.querySelectorAll(":scope > th").length > 6);
        const ths = header ? Array.from(header.querySelectorAll(":scope > th")) : [];
        const want = ["Trx Ref Id", "Vehicle No", "Debit Type", "Amount", "Status", "Resp Code"];
        const out: string[] = [];
        rows.forEach((tr, k) => {
          (tr as HTMLElement).style.boxShadow = "inset 0 0 0 3px #e11d48";
          const cells = own(tr);
          const got: string[] = [];
          for (const w of want) {
            const th = ths.find((t) => norm(t.textContent || "") === w);
            if (!th) continue;
            const r = th.getBoundingClientRect();
            const td = cells.find((c) => { const b = c.getBoundingClientRect(); const m = b.left + b.width / 2; return m >= r.left && m <= r.right; }) as HTMLElement | undefined;
            if (!td) continue;
            td.setAttribute("data-qa-hl-el", "1");
            td.style.outline = "3px solid #e11d48"; td.style.outlineOffset = "-2px"; td.style.backgroundColor = "rgba(250,204,21,.45)";
            got.push(`${w}=${norm(td.textContent || "")}`);
          }
          if (k === 0) {
            const r = (tr as HTMLElement).getBoundingClientRect();
            const b = document.createElement("div");
            b.setAttribute("data-qa-hl", "1");
            b.textContent = `RHB debits — ${v}`;
            b.style.cssText = "position:absolute;z-index:2147483647;background:#e11d48;color:#fff;font:bold 12px system-ui;padding:2px 6px;border-radius:4px";
            b.style.left = `${r.left + window.scrollX}px`; b.style.top = `${r.top + window.scrollY - 20}px`;
            document.body.appendChild(b);
            (tr as HTMLElement).scrollIntoView({ block: "center" });
          }
          out.push(got.join(" · "));
        });
        return out;
      }, vehicle);
      await page.waitForTimeout(1500);
      await shots.take(page, `bo-rhb-payment-${vehicle}`, false);
      await clearHighlights(page);
      record({ ts, what: `BO RHB Payment Transaction — amount debited (${vehicle})`, instance: instance(), at: new Date().toISOString(), vehicle,
        persona: "bo (jasons)", prefix: vehicle.slice(0, 2), boRow: found.join(" || ") || "(not found in today's list)",
        outcome: found.length ? `${found.length} RHB debit row(s)` : "NOT FOUND", screenshots: shots.files });
    }
  });

  // Reports BEFORE the push (read-only searches). SEED_REPORT="<ts>:<STMS|APT>"
  //   1. eAuto STMS, APT and eSTM Transaction Listing — today, that type only
  //   2. eAuto Reconciliation Summary Listing — payment date today
  // The Reconciliation Summary REPORT needs a JPJ file upload + "Reconcile Now"
  // (an action, not a search) and is deliberately not run.
  test("12403 seed — reports", async ({ page }) => {
    const specs = (process.env.SEED_REPORT ?? "").split(",").filter(Boolean);
    test.skip(!specs.length, "no SEED_REPORT");
    await new LoginPage(page).as("bo");
    const phase = process.env.SEED_DOCS_PHASE ?? "before";
    for (const spec of specs) {
      const [ts, type] = spec.split(":");
      const shots = new Shots(ts);
      const ddir = path.join(shots.dir, `downloadable (${phase})`);
      fs.mkdirSync(ddir, { recursive: true });
      const notes: string[] = [];
      const setDate = async (sel: string, dt: Date) => {
        await page.locator(sel).evaluate((el, iso) => {
          const $ = (window as any).jQuery; const x = new Date(iso);
          if ($ && $(el).hasClass("hasDatepicker")) $(el).datepicker("setDate", x);
          else (el as HTMLInputElement).value = `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
        }, dt.toISOString());
      };
      const grab = async (label: string, trigger: () => Promise<unknown>) => {
        page.once("dialog", (dg) => { notes.push(`${label}: dialog "${dg.message()}"`); dg.accept().catch(() => undefined); });
        const dl = page.waitForEvent("download", { timeout: 60_000 }).then((x) => ({ x })).catch(() => null);
        const pop = page.context().waitForEvent("page", { timeout: 60_000 }).then((q) => ({ q })).catch(() => null);
        await trigger();
        const got = await Promise.race([dl, pop, page.waitForTimeout(20_000).then(() => null)]);
        if (got && "x" in got && got.x) {
          const ext = (got.x.suggestedFilename().split(".").pop() || "dat").toLowerCase();
          const f = path.join(ddir, `${label}.${ext}`); await got.x.saveAs(f);
          shots.files.push(`${shots.folder}/downloadable (${phase})/${path.basename(f)}`); notes.push(`${label}: downloaded ${path.basename(f)}`);
        } else if (got && "q" in got && got.q) {
          await got.q.waitForLoadState("load").catch(() => undefined); await got.q.waitForTimeout(3000);
          const f = path.join(ddir, `${label}.png`); await got.q.screenshot({ path: f, fullPage: true }).catch(() => undefined);
          shots.files.push(`${shots.folder}/downloadable (${phase})/${path.basename(f)}`); notes.push(`${label}: opened in a new tab — screenshot saved`);
          await got.q.close().catch(() => undefined);
        } else notes.push(`${label}: shown on the page (no file)`);
      };

      // 1. Transaction Listing
      await page.goto("view/jpj/report/stms-apt-estm/list.do");
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await setDate("#fromDate", new Date()); await setDate("#toDate", new Date());
      for (const t of ["STMS", "APT", "eSTM", "eHak"]) {
        const cb = page.locator(`#${t}`);
        if (await cb.isVisible().catch(() => false)) { if (t === type) await cb.check(); else await cb.uncheck().catch(() => undefined); }
      }
      await grab(`transaction-listing-${type}-${new Date().toISOString().slice(0, 10)}`, () => page.click("#to-generate"));
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(2500);
      await highlight(page, page.locator("table").filter({ hasText: /Vehicle|Transaction/ }).last(), `Transaction Listing — ${type}, today`);
      await shots.take(page, `report-transaction-listing-${type}`);
      await clearHighlights(page);
      const exp1 = page.locator("a, input[type=button], input[type=submit], button").filter({ hasText: /export|excel|csv|download|print/i }).first();
      if (await exp1.isVisible().catch(() => false)) await grab(`transaction-listing-${type}-export`, () => exp1.click());

      // 2. Reconciliation Summary Listing
      await page.goto("view/jpj/report/consolidated-reconcile/eauto-report.jsp");
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await setDate("#paymentDateFrom", new Date()); await setDate("#paymentDateTo", new Date());
      await grab(`reconciliation-summary-listing-${new Date().toISOString().slice(0, 10)}`, () => page.click("#to-recon"));
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(3000);
      await highlight(page, page.locator("table").last(), "Reconciliation Summary Listing — today");
      await shots.take(page, "report-reconciliation-summary-listing");
      await clearHighlights(page);
      const exp2 = page.locator("a, input[type=button], input[type=submit], button").filter({ hasText: /export|excel|csv|download|print/i }).first();
      if (await exp2.isVisible().catch(() => false)) await grab(`reconciliation-summary-listing-export`, () => exp2.click());

      record({ ts, what: `Reports before the push (${type})`, instance: instance(), at: new Date().toISOString(), vehicle: "-", persona: "bo (jasons)",
        prefix: "-", outcome: "reports captured", notes, screenshots: shots.files });
    }
  });

  // 12403_PAY2 (eSTM route), continued: from the eSTM transaction, press
  // "Click here to pay APT fees" (QA: redirects to the APT listing), then check
  // the APT is listed Pending. Stops on anything unexpected. NEVER pays.
  test("12403 seed — PAY2 pay-APT-fees link", async ({ page, ucdSession, browser }) => {
    test.skip(!want("PAY2_APTLINK"), "SEED=PAY2_APTLINK");
    const vehicle = process.env.SEED_VEHICLE ?? "OT000005";
    const shots = new Shots("12403_PAY2_ESTM");
    const notes: string[] = [];
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    await page.goto(root + "/view/ucd/estm/enquiry/main.do");
    await page.fill("#vehicleNo", vehicle);
    await page.click("#to-search");
    await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 });
    await page.waitForTimeout(800);
    await highlightRowCells(page, vehicle, UCD_COLS, `UCD eSTM listing — ${vehicle}`);
    await shots.take(page, "estm-listing-before-link", false);
    await clearHighlights(page);
    await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /Resubmit/i }).first().click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
    if (await yes.isVisible({ timeout: 4000 }).catch(() => false)) { notes.push("dialog on Resubmit: " + (await page.locator(".ui-dialog:visible").innerText()).replace(/\s+/g, " ").slice(0, 200)); await yes.click(); }
    await page.waitForTimeout(2500);
    notes.push("after Resubmit: " + page.url().replace(/\?.*/, ""));
    const link = page.locator("a, button, input, div").filter({ hasText: /^\s*Click here to pay APT fees\s*$/i }).last();
    if (!(await link.isVisible().catch(() => false))) {
      await shots.take(page, "estm-resubmit-no-apt-link-STOPPED");
      notes.push("STOPPED: 'Click here to pay APT fees' is not on the page after Resubmit — nothing pressed.");
    } else {
      await highlight(page, link, "Click here to pay APT fees");
      await shots.take(page, "estm-step4-pay-apt-fees-link");
      await clearHighlights(page);
      await link.click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(3000);
      notes.push("after the link: " + page.url().replace(/\?.*/, ""));
      const onApt = /apt\//i.test(page.url());
      await shots.take(page, onApt ? "estm-link-landed-apt" : "estm-link-landed-elsewhere-STOPPED");
      if (!onApt) notes.push("STOPPED: the link did not land on an APT page.");
    }
    // APT listing for the vehicle
    await page.goto(root + "/view/ucd/apt/enquiry/");
    await page.fill("#vehicleNo", vehicle);
    await page.click("#to-search");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2500);
    const hit = page.locator("table tr", { hasText: vehicle }).first();
    const row = (await hit.count()) ? (await hit.innerText()).replace(/\s+/g, " ") : "(no APT)";
    if (await hit.count()) await highlightRowCells(page, vehicle, UCD_COLS, `UCD APT listing — ${vehicle}`);
    else await highlight(page, page.locator("table").filter({ hasText: /Transaction No/ }).last(), `no APT for ${vehicle}`);
    await shots.take(page, "estm-ucd-apt-listing-after-link", false);
    await clearHighlights(page);
    // BO APT
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    await bo.goto("view/apt/enquiry");
    await bo.fill("#vehicleNo", vehicle);
    await bo.click("#to-search");
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(2500);
    await highlightRowCells(bo, vehicle, BO_COLS, `BO APT — ${vehicle}`);
    await shots.take(bo, `estm-bo-apt-enquiry-${vehicle}`, false);
    await ctx.close();
    record({ ts: "12403_PAY2_ESTM", what: "12403_PAY2 eSTM route: 'Click here to pay APT fees' → APT listing (not paid)", instance: instance(),
      at: new Date().toISOString(), vehicle, transactionNo: (row.match(/A\d{7,}/) ?? [])[0], persona: "ucdE2E (Azfar1)", prefix: "OT", ucdRow: row,
      outcome: /Pending/.test(row) ? "APT Pending via eSTM" : "CHECK — no Pending APT", notes, screenshots: shots.files });
  });
});
