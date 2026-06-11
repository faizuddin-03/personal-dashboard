import { test, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const _baseUrl = process.env.SECARANG_BASE_URL || 'https://staging.secarang.com/preprod';
const CONFIG = {
  baseUrl: _baseUrl,
  sitePassword: process.env.SECARANG_SITE_PASSWORD || 'eAuTo<2025#',
  postcode: process.env.SECARANG_POSTCODE || '55000',

  inputFile:  './input-vehicles.xlsx',
  outputFile: './output-results.xlsx',

  navigationTimeout: 90000,
  waitAfterPageLoad:   300,   // small settle after a detected page advance
  waitAfterClick:      250,   // settle after a UI click
  quotationTimeout:   15000,  // max wait (ms) for a page transition / cards
  pollingInterval:     150,   // fast polling so we proceed the instant content appears

  // Feature toggles (set "0" to disable via env)
  checkSumInsured:    process.env.SECARANG_CHECK_SUM_INSURED    !== '0',
  checkVehicleDetails:process.env.SECARANG_CHECK_VEHICLE_DETAILS !== '0',
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface VehicleInput {
  vehicleNumber:  string;
  icNumber?:      string;
  postcode?:      string;
  vehicleType?:   'car' | 'motorcycle';
  ownerType?:     'private' | 'company';
}

interface SumInsuredOption {
  sumInsured: string;
  price:      string;
}

interface InsurerResult {
  name:              string;
  available:         boolean;
  unavailableReason: string;
  sumInsuredOptions: SumInsuredOption[];
}

interface VehicleResult {
  vehicleNumber:   string;
  make:            string;
  model:           string;
  year:            string;
  variant:         string;
  totalDisplayed:  number;
  totalAvailable:  number;
  insurers:        InsurerResult[];
  status:          'SUCCESS' | 'ERROR';
  errorMessage?:   string;
}

// ─── READ INPUT EXCEL ────────────────────────────────────────────────────────
async function readInputExcel(filePath: string): Promise<VehicleInput[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.getWorksheet(1);
  if (!ws) throw new Error('No worksheet found');

  const vehicles: VehicleInput[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const vn = row.getCell(1).text?.trim();
    if (!vn) return;
    const ownerRaw  = (row.getCell(5).text || '').trim().toLowerCase();
    const vtypeRaw  = (row.getCell(6).text || '').trim().toLowerCase();
    vehicles.push({
      vehicleNumber: vn,
      icNumber:      row.getCell(2).text?.trim() || undefined,
      postcode:      row.getCell(3).text?.trim() || undefined,
      ownerType:     ownerRaw === 'company' ? 'company' : 'private',
      vehicleType:   vtypeRaw === 'motorcycle' ? 'motorcycle' : 'car',
    });
  });
  return vehicles;
}

// ─── WRITE OUTPUT EXCEL ──────────────────────────────────────────────────────
async function writeOutputExcel(results: VehicleResult[], filePath: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Secarang Insurance Checker';
  wb.created = new Date();

  const headerFont  = { bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
  const headerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };

  // ── Quotations sheet ─────────────────────────────────────────
  const qs = wb.addWorksheet('Quotations', { views: [{ state: 'frozen', ySplit: 1 }] });
  qs.columns = [
    { header: 'Vehicle Number', key: 'vn',       width: 18 },
    { header: 'Make',           key: 'make',      width: 15 },
    { header: 'Model',          key: 'model',     width: 30 },
    { header: 'Year',           key: 'year',      width: 8  },
    { header: 'Variant',        key: 'variant',   width: 25 },
    { header: 'Insurer',        key: 'insurer',   width: 25 },
    { header: 'Available',      key: 'available', width: 12 },
    { header: 'Reason',         key: 'reason',    width: 40 },
    { header: 'Sum Insured',    key: 'sumInsured',width: 18 },
    { header: 'Price',          key: 'price',     width: 18 },
  ];
  qs.getRow(1).font      = headerFont;
  qs.getRow(1).fill      = headerFill;
  qs.getRow(1).alignment = headerAlign;

  for (const r of results) {
    if (r.status !== 'SUCCESS') continue;
    for (const ins of r.insurers) {
      if (!ins.available || ins.sumInsuredOptions.length === 0) {
        const row = qs.addRow({
          vn: r.vehicleNumber, make: r.make, model: r.model, year: r.year,
          variant: r.variant, insurer: ins.name,
          available: ins.available ? 'Yes' : 'No',
          reason: ins.unavailableReason || '',
          sumInsured: '', price: '',
        });
        const cell = row.getCell('available');
        cell.font = { color: { argb: ins.available ? 'FF008000' : 'FFFF0000' }, bold: true };
      } else {
        for (const opt of ins.sumInsuredOptions) {
          const row = qs.addRow({
            vn: r.vehicleNumber, make: r.make, model: r.model, year: r.year,
            variant: r.variant, insurer: ins.name,
            available: 'Yes', reason: '',
            sumInsured: opt.sumInsured, price: opt.price,
          });
          row.getCell('available').font = { color: { argb: 'FF008000' }, bold: true };
        }
      }
    }
  }
  if (qs.rowCount > 1) {
    qs.autoFilter = { from: { row: 1, column: 1 }, to: { row: qs.rowCount, column: 10 } };
  }

  // ── Vehicles summary sheet ───────────────────────────────────
  const vs = wb.addWorksheet('Vehicles', { views: [{ state: 'frozen', ySplit: 1 }] });
  vs.columns = [
    { header: 'Vehicle Number',  key: 'vn',        width: 18 },
    { header: 'Make',            key: 'make',       width: 15 },
    { header: 'Model',           key: 'model',      width: 30 },
    { header: 'Year',            key: 'year',       width: 8  },
    { header: 'Variant',         key: 'variant',    width: 25 },
    { header: 'Total Displayed', key: 'displayed',  width: 18 },
    { header: 'Total Available', key: 'available',  width: 18 },
    { header: 'Status',          key: 'status',     width: 16 },
    { header: 'Error',           key: 'error',      width: 50 },
  ];
  vs.getRow(1).font      = headerFont;
  vs.getRow(1).fill      = headerFill;
  vs.getRow(1).alignment = headerAlign;

  for (const r of results) {
    vs.addRow({
      vn: r.vehicleNumber, make: r.make, model: r.model,
      year: r.year, variant: r.variant,
      displayed: r.totalDisplayed, available: r.totalAvailable,
      status: r.status, error: r.errorMessage || '',
    });
  }

  // ── Errors sheet ─────────────────────────────────────────────
  const es = wb.addWorksheet('Errors');
  es.columns = [
    { header: 'Vehicle Number', key: 'vn',     width: 18 },
    { header: 'Status',         key: 'status', width: 16 },
    { header: 'Error',          key: 'error',  width: 70 },
  ];
  es.getRow(1).font      = { bold: true, color: { argb: 'FFFFFFFF' } };
  es.getRow(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
  for (const r of results) {
    if (r.status === 'SUCCESS') continue;
    es.addRow({ vn: r.vehicleNumber, status: r.status, error: r.errorMessage || '' });
  }

  await wb.xlsx.writeFile(tmpPath);
  fs.renameSync(tmpPath, filePath);
}

// Serialised incremental flush — each call writes the full snapshot
let writeChain: Promise<void> = Promise.resolve();
function flushOutput(results: VehicleResult[], filePath: string): Promise<void> {
  const snapshot = [...results];
  writeChain = writeChain
    .then(() => writeOutputExcel(snapshot, filePath))
    .catch(err => console.error('   ⚠️ flush failed:', err));
  return writeChain;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const clean = (s: string) => s.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

async function waitForCondition(
  page: Page,
  fn: () => Promise<boolean>,
  timeout = CONFIG.quotationTimeout,
  interval = CONFIG.pollingInterval,
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await page.waitForTimeout(interval);
  }
  return false;
}

// Wait until a value-producing function returns non-empty AND differs from
// `prev` (i.e. the price refreshed after changing the sum insured). Returns
// the new value as soon as it settles, capped at `timeout`.
async function waitForValueChange(
  read: () => Promise<string>,
  prev: string,
  page: Page,
  timeout = 1500,
): Promise<string> {
  const deadline = Date.now() + timeout;
  let last = '';
  while (Date.now() < deadline) {
    const v = await read();
    if (v && v !== prev) return v;     // changed → done immediately
    last = v;
    await page.waitForTimeout(CONFIG.pollingInterval);
  }
  return last; // never changed (or same price) — return whatever we have
}

// True when the "Are these your vehicle details?" confirmation step is showing.
async function isDetailsStep(page: Page): Promise<boolean> {
  const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
  return t.includes('are these your vehicle details')
    || (t.includes('get quotation') && /plate no|chassis|engine no|seat\b/.test(t));
}

// Wait (early-exit) until quotation cards render or a "no quote" message shows.
async function waitForCards(page: Page, timeout: number): Promise<boolean> {
  return waitForCondition(page, async () => {
    if (await findCardSelector(page)) return true;
    const t = await page.locator('body').innerText().catch(() => '');
    return /no quotation|quotation unavailable|not available|unable to provide/i.test(t);
  }, timeout, CONFIG.pollingInterval);
}

// ─── SITE PASSWORD HANDLER ────────────────────────────────────────────────────
async function handleSitePassword(page: Page): Promise<void> {
  // Proceed as soon as either the password gate OR the real form appears
  const pwField = page.locator('input[type="password"]').first();
  await waitForCondition(page, async () =>
    (await pwField.count()) > 0 || (await page.locator('button:has-text("Car")').count()) > 0,
    5000, CONFIG.pollingInterval,
  );

  if ((await pwField.count()) === 0) return; // no gate

  console.log('   🔒 Password gate detected, entering site password…');
  await pwField.fill(CONFIG.sitePassword);

  // Try common submit patterns
  const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Enter"), button:has-text("Login"), button:has-text("Access")').first();
  if ((await submitBtn.count()) > 0) {
    await submitBtn.click();
  } else {
    await pwField.press('Enter');
  }

  await page.waitForLoadState('networkidle', { timeout: CONFIG.navigationTimeout }).catch(() => {});
  await page.waitForTimeout(CONFIG.waitAfterPageLoad);
  console.log('   ✅ Password gate passed');
}

// ─── VEHICLE TYPE + OWNER TYPE SELECTION ─────────────────────────────────────
async function selectVehicleType(page: Page, vehicleType: 'car' | 'motorcycle', ownerType: 'private' | 'company'): Promise<void> {
  // Step 1: Select Car or Motorcycle
  const vtLabel = vehicleType === 'car' ? 'Car' : 'Motorcycle';
  console.log(`   🚗 Selecting vehicle type: ${vtLabel}`);

  const vtBtn = page.locator(`button:has-text("${vtLabel}"), [role="radio"]:has-text("${vtLabel}"), label:has-text("${vtLabel}")`).first();
  if ((await vtBtn.count()) > 0) {
    await vtBtn.click();
    await page.waitForTimeout(CONFIG.waitAfterClick);
  } else {
    // Log available buttons to help debug
    const btns = await page.locator('button, [role="radio"]').allTextContents();
    console.log(`   ⚠️  Could not find "${vtLabel}" button. Available buttons: ${btns.slice(0, 10).join(' | ')}`);
  }

  // Step 2: Select Private or Company.
  // Try a text-labelled control first; fall back to the radio inputs by index
  // (radio #0 = Private, radio #1 = Company).
  const ownerLabels = ownerType === 'company'
    ? ['Company Car', 'Company Motorcycle', 'Company', 'Business']
    : ['Private Car', 'Private Motorcycle', 'Private', 'Individual'];

  let ownerSelected = false;
  for (const label of ownerLabels) {
    const ctrl = page.locator(`button:has-text("${label}"), label:has-text("${label}")`).first();
    if ((await ctrl.count()) > 0 && await ctrl.isVisible().catch(() => false)) {
      console.log(`   👤 Selecting owner type via label: ${label}`);
      await ctrl.click();
      ownerSelected = true;
      await page.waitForTimeout(CONFIG.waitAfterClick);
      break;
    }
  }

  if (!ownerSelected) {
    const radios = page.locator('input[type="radio"]');
    const rc = await radios.count();
    const idx = ownerType === 'company' ? 1 : 0;
    if (rc > idx) {
      console.log(`   👤 Selecting owner type via radio #${idx} (${ownerType})`);
      // Radios may be visually hidden behind a styled label — force the click.
      await radios.nth(idx).click({ force: true }).catch(async () => {
        await radios.nth(idx).check({ force: true }).catch(() => {});
      });
      await page.waitForTimeout(CONFIG.waitAfterClick);
    } else {
      console.log(`   ⚠️  Could not select owner type (found ${rc} radios)`);
    }
  }
}

// ─── FILL QUOTATION FORM ──────────────────────────────────────────────────────
// Secarang renders 3 bare text inputs with no name/id/placeholder, in DOM order:
//   [0] Vehicle Plate No.   [1] Owner IC / Company SSM   [2] Postal Code
// So we fill them positionally.
async function fillQuotationForm(page: Page, v: VehicleInput, defaultIc: string): Promise<{ plateFilled: boolean; icFilled: boolean; postcodeFilled: boolean }> {
  const ic       = (v.icNumber || defaultIc).replace(/[-\s]/g, '');
  const postcode = v.postcode || CONFIG.postcode;

  console.log(`   📝 Filling form: VN=${v.vehicleNumber} IC=${ic} PC=${postcode}`);

  // Visible text inputs, in DOM order
  const textInputs = page.locator('input[type="text"]:visible, input:not([type]):visible');
  const n = await textInputs.count();
  console.log(`   🔢 Found ${n} visible text input(s)`);

  if (n < 3) {
    console.log(`   ⚠️  Expected 3 text inputs, found ${n}. Filling what is available.`);
  }

  const values = [v.vehicleNumber, ic, postcode];
  const labels = ['Plate', 'IC/SSM', 'Postcode'];
  const filled = [false, false, false];

  for (let i = 0; i < Math.min(3, n); i++) {
    try {
      const el = textInputs.nth(i);
      await el.click();
      await el.fill('');
      await el.fill(values[i]);
      // Verify the value stuck
      const got = await el.inputValue().catch(() => '');
      filled[i] = got.replace(/\s/g, '') === values[i].replace(/\s/g, '');
      console.log(`   ${filled[i] ? '✅' : '⚠️'} ${labels[i]} [input #${i}] = "${got}"`);
    } catch (err) {
      console.log(`   ❌ ${labels[i]} [input #${i}] failed: ${err}`);
    }
  }

  await page.waitForTimeout(500);
  return { plateFilled: filled[0], icFilled: filled[1], postcodeFilled: filled[2] };
}

// ─── SUBMIT QUOTATION FORM ────────────────────────────────────────────────────
async function submitForm(page: Page): Promise<void> {
  const submitLabels = ['Get Quotation', 'Get Quote', 'Check Now', 'Submit', 'Proceed', 'Search'];
  for (const label of submitLabels) {
    const btn = page.locator(`button:has-text("${label}"), input[value="${label}"]`).first();
    if ((await btn.count()) > 0) {
      console.log(`   🚀 Clicking submit: "${label}"`);
      await btn.click();
      return;
    }
  }
  // Fallback: click the only submit button
  const fallback = page.locator('button[type="submit"], input[type="submit"]').first();
  if ((await fallback.count()) > 0) {
    console.log('   🚀 Clicking fallback submit button');
    await fallback.click();
    return;
  }
  throw new Error('Could not find submit/Get Quotation button on the form page');
}

// ─── VEHICLE DETAILS PAGE ─────────────────────────────────────────────────────
// Returns the variant chosen (or empty string if none needed)
async function handleVehicleDetailsPage(page: Page): Promise<string> {
  const text = await page.locator('body').innerText().catch(() => '');

  // Check for error on this page
  if (/not found|no record|vehicle not|unable to find|error/i.test(text)) {
    throw new Error(`Vehicle details error: ${text.slice(0, 200)}`);
  }

  let selectedVariant = '';

  // Variant dropdown (flow #2). Only a real <select> or a variant-labelled
  // custom control — never generic nav dropdowns. Most cars have no variant,
  // so this is usually skipped instantly.
  const variantSelect = page.locator('select').first();
  if ((await variantSelect.count()) > 0) {
    const optionEls = await variantSelect.locator('option').all();
    const valid: { value: string; label: string }[] = [];
    for (const o of optionEls) {
      const label = clean(await o.textContent() || '');
      const value = (await o.getAttribute('value')) ?? '';
      if (label && !/^(select|choose|--|please)/i.test(label) && value !== '') valid.push({ value, label });
    }
    if (valid.length > 0) {
      const pick = valid[0];
      selectedVariant = pick.label;
      console.log(`   🔧 Variant select: choosing "${pick.label}" (of ${valid.length})`);
      await variantSelect.selectOption(pick.value).catch(async () => {
        await variantSelect.selectOption({ label: pick.label }).catch(() => {});
      });
    }
  } else {
    const mat = page.locator('mat-select, ng-select, [class*="variant" i] [role="combobox"]').first();
    if ((await mat.count()) > 0 && await mat.isVisible().catch(() => false)) {
      await mat.click().catch(() => {});
      const option = page.locator('mat-option, .ng-option, [role="option"]').first();
      if (await option.count().then(c => c > 0).catch(() => false)) {
        selectedVariant = clean(await option.textContent() || '');
        console.log(`   🔧 Variant dropdown: choosing "${selectedVariant}"`);
        await option.click().catch(() => {});
      }
    }
  }

  // Click the page's primary "Get quotation" button. Prefer the last VISIBLE
  // match (the details-confirmation button, not any stale/hidden one).
  const candidates = page.locator(
    'button.primary-btn, button:has-text("Get quotation"), button:has-text("Proceed"), button:has-text("Continue")'
  );
  const cn = await candidates.count();
  for (let i = cn - 1; i >= 0; i--) {
    const b = candidates.nth(i);
    if (await b.isVisible().catch(() => false) && await b.isEnabled().catch(() => true)) {
      const label = clean(await b.textContent() || '');
      console.log(`   ➡️  Clicking proceed: "${label}"`);
      await b.scrollIntoViewIfNeeded().catch(() => {});
      await b.click({ force: true }).catch(async () => {
        await b.evaluate((el: HTMLElement) => el.click()).catch(() => {});
      });
      return selectedVariant;
    }
  }
  console.log('   ⚠️  No visible proceed button found on vehicle details page');

  throw new Error('Could not find proceed button on vehicle details page');
}

// Candidate selectors for an insurer/quotation card on the results page
const CARD_SELECTORS = [
  '[class*="quote-card"]',
  '[class*="quotation-card"]',
  '[class*="insurer-card"]',
  '[class*="insurance-card"]',
  '[class*="plan-card"]',
  '[class*="QuoteCard"]',
  '[class*="InsuranceCard"]',
];

// Returns the first matching card selector, or '' if none.
async function findCardSelector(page: Page): Promise<string> {
  for (const sel of CARD_SELECTORS) {
    const count = await page.locator(sel).count();
    if (count > 0) return sel;
  }
  return '';
}

// ─── EXTRACT QUOTATION RESULTS ────────────────────────────────────────────────
async function extractQuotations(page: Page): Promise<{
  insurers: InsurerResult[];
  totalDisplayed: number;
  totalAvailable: number;
}> {
  // Give cards a moment to render (cap 10s) before reading
  await waitForCondition(page, async () => !!(await findCardSelector(page)), CONFIG.quotationTimeout, CONFIG.pollingInterval);

  // Log page structure for debugging
  const classes = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll('[class]')].map(el => (el as HTMLElement).className.split(' ').filter(c => c.length > 2 && c.length < 40)).flat())].slice(0, 50).join(', ')
  );
  console.log(`   🔍 Page classes (sample): ${classes}`);

  const cardSel = await findCardSelector(page);
  if (cardSel) console.log(`   ✅ Found cards via "${cardSel}"`);

  if (!cardSel) {
    // Last resort: look for repeated sections that have insurer names + prices
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log(`   ⚠️  No card selector matched. Body snippet:\n${bodyText.slice(0, 600)}`);
    return { insurers: [], totalDisplayed: 0, totalAvailable: 0 };
  }

  const cards = page.locator(cardSel);
  const count = await cards.count();
  console.log(`   📦 ${count} card(s) found`);
  const insurers: InsurerResult[] = [];

  // Dump the first card's HTML once so we can map real structure for selectors
  if (count > 0) {
    const html = await cards.first().evaluate(el => el.outerHTML).catch(() => '');
    console.log(`   ── FIRST CARD HTML (truncated) ──\n${html.slice(0, 2500)}\n   ── END CARD HTML ──`);
  }

  for (let i = 0; i < count; i++) {
    try {
      const card = cards.nth(i);
      const cardText = clean(await card.innerText().catch(() => ''));

      // Get insurer name
      const nameEl = card.locator('[class*="name" i], [class*="title" i], [class*="insurer" i], img[alt], h3, h4, h2').first();
      let name = clean(await nameEl.getAttribute('alt').catch(() => '') || '');
      if (!name) name = clean(await nameEl.textContent().catch(() => '') || cardText.split('\n')[0]);

      // Check if unavailable
      const unavailableReason = /quotation unavailable|not available|unable to provide|currently unavailable|unavailable|no quote/i.test(cardText)
        ? clean(cardText.match(/[^\n]*(?:unavailable|not available|unable to provide|no quote)[^\n]*/i)?.[0] || 'Unavailable')
        : '';

      if (unavailableReason) {
        console.log(`   ❌ ${name}: ${unavailableReason}`);
        insurers.push({ name, available: false, unavailableReason, sumInsuredOptions: [] });
        continue;
      }

      const sumInsuredOptions: SumInsuredOption[] = [];

      // Helper to read the current price text in this card
      const readPrice = async (): Promise<string> => {
        const priceEl = card.locator('[class*="price" i], [class*="premium" i], [class*="amount" i], [class*="total" i]').first();
        let p = clean(await priceEl.textContent().catch(() => '') || '');
        if (!p) {
          // Fallback: any "RM ..." token in the card text
          const m = clean(await card.innerText().catch(() => '')).match(/RM\s?[\d,]+(?:\.\d{2})?/);
          p = m ? m[0] : '';
        }
        return p;
      };

      // Sum insured dropdown (native select)
      const siDropdown = card.locator('select').first();
      const siCount = CONFIG.checkSumInsured ? await siDropdown.count() : 0;

      if (!CONFIG.checkSumInsured) {
        // Sum-insured checking disabled — record just the displayed price
        const price = await readPrice();
        if (price) sumInsuredOptions.push({ sumInsured: 'N/A (check disabled)', price });
      } else if (siCount > 0) {
        const options = await siDropdown.locator('option').all();
        // Start empty so the first option returns the instant a price renders.
        let prevPrice = '';
        for (const opt of options) {
          const optVal  = (await opt.getAttribute('value')) ?? '';
          const optText = clean(await opt.textContent() || '');
          if (!optText || /select|choose|^--|please/i.test(optText)) continue;

          // Select by value, fall back to label; swallow errors
          let ok = true;
          try {
            if (optVal !== '') await siDropdown.selectOption(optVal);
            else await siDropdown.selectOption({ label: optText });
          } catch {
            try { await siDropdown.selectOption({ label: optText }); } catch { ok = false; }
          }

          // Proceed the instant the premium refreshes (capped ~1.5s)
          const price = await waitForValueChange(readPrice, prevPrice, page);
          prevPrice = price;
          const sumInsured = optText;
          console.log(`      Sum insured: ${sumInsured} → ${price || '(no price)'}${ok ? '' : ' [select failed]'}`);
          sumInsuredOptions.push({ sumInsured, price });
        }
      }

      // No dropdown → capture displayed price directly
      if (sumInsuredOptions.length === 0) {
        const price = await readPrice();
        const sumInsuredEl = card.locator('[class*="sum" i], [class*="coverage" i], [class*="insured" i]').first();
        const sumInsured = clean(await sumInsuredEl.textContent().catch(() => '') || 'N/A');
        if (price) sumInsuredOptions.push({ sumInsured, price });
      }

      console.log(`   ✅ ${name}: available, ${sumInsuredOptions.length} sum insured option(s)`);
      insurers.push({ name, available: true, unavailableReason: '', sumInsuredOptions });
    } catch (err) {
      console.log(`   ⚠️  Card #${i} extraction error (continuing): ${err}`);
    }
  }

  const totalAvailable = insurers.filter(i => i.available).length;
  return { insurers, totalDisplayed: count, totalAvailable };
}

// ─── PROCESS A SINGLE VEHICLE ─────────────────────────────────────────────────
async function processVehicle(page: Page, v: VehicleInput, defaultIc: string): Promise<VehicleResult> {
  const vn = v.vehicleNumber.toUpperCase();
  const vehicleType = v.vehicleType ?? 'car';
  const ownerType   = v.ownerType   ?? 'private';

  const emptyResult = (msg: string): VehicleResult => ({
    vehicleNumber: vn, make: '', model: '', year: '', variant: '',
    totalDisplayed: 0, totalAvailable: 0, insurers: [],
    status: 'ERROR', errorMessage: msg,
  });

  // Navigate to the right page
  const urlPath = vehicleType === 'motorcycle' ? 'motorcycle-insurance' : 'car-insurance';
  const url = `${CONFIG.baseUrl}/${urlPath}`;
  console.log(`   🌐 Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
  await page.waitForTimeout(CONFIG.waitAfterPageLoad);

  // Handle site password gate (checks on first vehicle, no-op if already passed)
  await handleSitePassword(page);

  // If redirected away (e.g. back to root) try again
  if (!page.url().includes(urlPath) && !page.url().includes(CONFIG.baseUrl)) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }

  // Select vehicle type + owner type
  await selectVehicleType(page, vehicleType, ownerType);

  // Fill quotation form
  const { plateFilled, icFilled, postcodeFilled } = await fillQuotationForm(page, v, defaultIc);

  // Guard: never submit an empty form. If the plate didn't get filled, the
  // selectors don't match this DOM — abort with the dump above for diagnosis.
  if (!plateFilled) {
    return emptyResult(
      `Could not fill vehicle plate field — form selectors did not match. ` +
      `(ic=${icFilled} postcode=${postcodeFilled}). See DOM DUMP in log to map the real field names/placeholders.`
    );
  }
  if (!icFilled || !postcodeFilled) {
    console.log(`   ⚠️  Partial fill — plate ok, but ic=${icFilled} postcode=${postcodeFilled}. Submitting anyway.`);
  }

  // Submit (homepage → vehicle details OR straight to quotations)
  const urlBeforeSubmit = page.url();
  try {
    await submitForm(page);
  } catch (err) {
    return emptyResult(`Form submit failed: ${err}`);
  }

  // Wait until the page actually settles into one of: quotation cards, the
  // vehicle-details confirmation step, or an error. Exits the instant ready.
  console.log('   ⏳ Waiting for next page…');
  await waitForCondition(page, async () => {
    if (await findCardSelector(page)) return true;
    if (await isDetailsStep(page)) return true;
    const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    return /vehicle not found|no record|invalid plate|something went wrong/.test(t);
  }, CONFIG.quotationTimeout, CONFIG.pollingInterval);
  console.log(`   📍 After submit: ${page.url()}`);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/vehicle not found|no record|invalid plate|error occurred|something went wrong/i.test(bodyText)) {
    const errLine = bodyText.match(/[^\n]*(?:vehicle not found|no record|invalid plate|error occurred|something went wrong)[^\n]*/i)?.[0] || '';
    return emptyResult(`Error after submit: ${errLine.slice(0, 200)}`);
  }

  // ── Vehicle details confirmation step → choose variant + proceed ──
  let variant = '';
  if (!(await findCardSelector(page))) {
    console.log('   📋 Vehicle details step — selecting variant (if any) and proceeding');
    try {
      variant = await handleVehicleDetailsPage(page);
    } catch (err) {
      return emptyResult(`Vehicle details page error: ${err}`);
    }
    // Quotation API can be slow — wait up to 30s but exit the instant cards show
    console.log('   ⏳ Waiting for quotations…');
    let got = await waitForCards(page, 30000);
    if (!got && await isDetailsStep(page)) {
      // First proceed click didn't register — try once more
      console.log('   🔁 Still on details — retrying proceed');
      await handleVehicleDetailsPage(page).catch(() => {});
      got = await waitForCards(page, 30000);
    }
  } else {
    console.log('   ⚡ Quotation cards already present — skipping details step');
  }

  // ── Quotation results page ────────────────────────────────────
  console.log('   📊 Extracting quotation results…');
  const { insurers, totalDisplayed, totalAvailable } = await extractQuotations(page);

  // Extract vehicle info from the page (skipped when the toggle is off)
  let make = '', model = '', year = '';
  if (CONFIG.checkVehicleDetails) {
    const pageText = await page.locator('body').innerText().catch(() => '');
    make  = clean(pageText.match(/(?:make|brand)[:\s]+([A-Z][A-Z\s]+)/i)?.[1] || '');
    model = clean(pageText.match(/(?:model)[:\s]+([A-Z0-9][A-Z0-9\s\-]+)/i)?.[1] || '');
    year  = clean(pageText.match(/(?:year|manufactured)[:\s]+(\d{4})/i)?.[1] || '');
  }

  console.log(`   📋 ${totalDisplayed} displayed, ${totalAvailable} available`);

  return {
    vehicleNumber: vn,
    make, model, year,
    variant,
    totalDisplayed,
    totalAvailable,
    insurers,
    status: 'SUCCESS',
  };
}

// ─── CONCURRENCY ─────────────────────────────────────────────────────────────
const DEFAULT_CONCURRENCY = 1;

function chunkArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function runWorker(
  browser: Browser,
  workerIdx: number,
  vehicles: VehicleInput[],
  defaultIc: string,
  shared: VehicleResult[],
  outputPath: string,
): Promise<VehicleResult[]> {
  const ctx  = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
  page.setDefaultTimeout(30000);

  // Handle HTTP Basic Auth if the site uses it
  await ctx.setExtraHTTPHeaders({ 'Authorization': '' });

  const results: VehicleResult[] = [];
  try {
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      console.log(`[Worker ${workerIdx + 1}] ━━━ ${i + 1}/${vehicles.length}: ${v.vehicleNumber}`);
      let res: VehicleResult;
      try {
        res = await processVehicle(page, v, defaultIc);
      } catch (err) {
        console.error(`[Worker ${workerIdx + 1}] ❌ ${v.vehicleNumber}:`, err);
        res = {
          vehicleNumber: v.vehicleNumber, make: '', model: '', year: '', variant: '',
          totalDisplayed: 0, totalAvailable: 0, insurers: [],
          status: 'ERROR', errorMessage: String(err),
        };
      }
      results.push(res);
      shared.push(res);
      await flushOutput(shared, outputPath);
    }
  } finally {
    await ctx.close();
  }
  return results;
}

// ─── MAIN TEST ───────────────────────────────────────────────────────────────
test.describe('Secarang Insurance Quote Checker', () => {
  test.setTimeout(0);

  test('Check insurance quotes for all vehicles', async ({ browser }) => {
    const inputPath = path.resolve(CONFIG.inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Vehicles');
      ws.columns = [
        { header: 'Vehicle Number',  key: 'vn',       width: 18 },
        { header: 'IC Number',       key: 'ic',       width: 18 },
        { header: 'Postcode',        key: 'pc',       width: 12 },
        { header: 'Notes',           key: 'notes',    width: 20 },
        { header: 'Owner Type',      key: 'owner',    width: 15 },
        { header: 'Vehicle Type',    key: 'vtype',    width: 15 },
      ];
      ws.getRow(1).font = { bold: true };
      ws.addRow({ vn: 'ALA2133', ic: '980121066038', pc: '55000', owner: 'private', vtype: 'car' });
      await wb.xlsx.writeFile(inputPath);
      console.log(`✅ Sample input created: ${inputPath}`);
      return;
    }

    const vehicles  = await readInputExcel(inputPath);
    const defaultIc = process.env.SECARANG_IC || '';
    console.log(`📄 Loaded ${vehicles.length} vehicle(s)`);
    if (!vehicles.length) { console.log('⚠️ No vehicles.'); return; }

    const concurrency = Math.min(
      parseInt(process.env.SECARANG_CONCURRENCY || String(DEFAULT_CONCURRENCY)),
      vehicles.length,
    );
    console.log(`🚀 Running ${concurrency} worker(s) for ${vehicles.length} vehicle(s)`);

    const outputPath = path.resolve(CONFIG.outputFile);
    const shared: VehicleResult[] = [];
    const chunks = chunkArray(vehicles, concurrency);

    const chunkResults = await Promise.all(
      chunks.map((chunk, idx) => runWorker(browser, idx, chunk, defaultIc, shared, outputPath))
    );
    const results = chunkResults.flat();

    // Final ordered write
    await writeOutputExcel(results, outputPath);

    const ok  = results.filter(r => r.status === 'SUCCESS').length;
    const err = results.filter(r => r.status === 'ERROR').length;
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${results.length} | ✅ ${ok} success | ❌ ${err} errors`);
    console.log(`📁 Output: ${outputPath}`);
    console.log('══════════════════════════════════════════════════════════\n');
  });
});
