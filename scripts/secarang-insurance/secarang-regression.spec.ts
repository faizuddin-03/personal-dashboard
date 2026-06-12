import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl:        process.env.SECARANG_BASE_URL      || 'https://staging.secarang.com/preprod',
  sitePassword:   process.env.SECARANG_SITE_PASSWORD || 'eAuTo<2025#',
  vehicleNumber:  process.env.REGRESSION_VN          || 'WYN3837',
  icNumber:       process.env.REGRESSION_IC          || '730620065847',
  postcode:       process.env.REGRESSION_POSTCODE    || '55000',
  targetInsurer:  process.env.REGRESSION_INSURER     || 'Zurich',
  // Owner / contact details for payment confirmation page
  ownerName:      process.env.REGRESSION_NAME        || 'MUHAMMAD FAIZUDDIN BIN BIDI',
  ownerEmail:     process.env.REGRESSION_EMAIL       || 'faizuddin@modefair.com',
  ownerPhone:     process.env.REGRESSION_PHONE       || '189812839',
  addressLine1:   process.env.REGRESSION_ADDR1       || '2505, Arctic Monkeys Road',
  addressLine2:   process.env.REGRESSION_ADDR2       || 'Taman Monyet Kutub',
  addressLine3:   process.env.REGRESSION_ADDR3       || 'Shah Alam, Selangor',
  discountCode:   process.env.REGRESSION_DISCOUNT    || 'YEAY7',
  outputFile:     './regression-result.json',
  navTimeout:     90_000,
  stepTimeout:    30_000,
  pollInterval:   200,
  waitAfterClick: 500,
};

// ─── STEP TRACKING ───────────────────────────────────────────────────────────
interface StepResult {
  name:      string;
  status:    'PASS' | 'FAIL' | 'SKIP';
  message:   string;
  timestamp: string;
}

interface RegressionResult {
  vehicleNumber:  string;
  icNumber:       string;
  targetInsurer:  string;
  overallStatus:  'PASS' | 'FAIL';
  steps:          StepResult[];
  errorMessage?:  string;
  startedAt:      string;
  completedAt:    string;
  durationMs:     number;
}

const steps: StepResult[] = [];
let startedAt = new Date().toISOString();

function recordStep(name: string, status: StepResult['status'], message: string) {
  const s: StepResult = { name, status, message, timestamp: new Date().toISOString() };
  steps.push(s);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} [${status}] ${name}: ${message}`);
}

function writeResult(overallStatus: 'PASS' | 'FAIL', errorMessage?: string) {
  const completedAt = new Date().toISOString();
  const result: RegressionResult = {
    vehicleNumber:  CONFIG.vehicleNumber,
    icNumber:       CONFIG.icNumber,
    targetInsurer:  CONFIG.targetInsurer,
    overallStatus,
    steps,
    errorMessage,
    startedAt,
    completedAt,
    durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
  };
  const outPath = path.resolve(CONFIG.outputFile);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Result written to: ${outPath}`);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const clean = (s: string) => s.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

async function poll(
  page: Page,
  fn: () => Promise<boolean>,
  timeout = CONFIG.stepTimeout,
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await page.waitForTimeout(CONFIG.pollInterval);
  }
  return false;
}

// ─── STEP 1: Site password gate ───────────────────────────────────────────────
async function passSiteGate(page: Page): Promise<void> {
  const pwField = page.locator('input[type="password"]').first();
  const hasGate = await poll(page, async () =>
    (await pwField.count()) > 0 || (await page.locator('button:has-text("Car")').count()) > 0,
    5_000,
  );
  if (!hasGate || (await pwField.count()) === 0) return;

  console.log('   🔒 Password gate — entering…');
  await pwField.fill(CONFIG.sitePassword);
  const submit = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Enter")').first();
  if ((await submit.count()) > 0) await submit.click();
  else await pwField.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: CONFIG.navTimeout }).catch(() => {});
  await page.waitForTimeout(500);
}

// ─── STEP 2: Vehicle type + owner type ───────────────────────────────────────
async function selectCarPrivate(page: Page): Promise<void> {
  // Car
  const car = page.locator('button:has-text("Car"), [role="radio"]:has-text("Car"), label:has-text("Car")').first();
  if ((await car.count()) > 0) { await car.click(); await page.waitForTimeout(1000); }

  // Private
  for (const label of ['Private Car', 'Private', 'Individual']) {
    const ctrl = page.locator(`button:has-text("${label}"), label:has-text("${label}")`).first();
    if ((await ctrl.count()) > 0 && await ctrl.isVisible().catch(() => false)) {
      await ctrl.click(); await page.waitForTimeout(1000); return;
    }
  }
  const radio = page.locator('input[type="radio"]').first();
  if ((await radio.count()) > 0) await radio.click({ force: true }).catch(() => {});
}

// ─── STEP 3: Fill form ────────────────────────────────────────────────────────
async function fillForm(page: Page): Promise<void> {
  const inputs = page.locator('input[type="text"]:visible, input:not([type]):visible');
  const n = await inputs.count();
  console.log(`   🔢 ${n} visible text input(s)`);

  const values = [CONFIG.vehicleNumber, CONFIG.icNumber, CONFIG.postcode];
  for (let i = 0; i < Math.min(3, n); i++) {
    const el = inputs.nth(i);
    await el.click();
    await el.fill('');
    await el.fill(values[i]);
    console.log(`   ✏️  input[${i}] = "${await el.inputValue()}"`);
    await page.waitForTimeout(1000);
  }
}

// ─── STEP 4: Submit form ──────────────────────────────────────────────────────
async function submitForm(page: Page): Promise<void> {
  for (const label of ['Get Quotation', 'Get Quote', 'Check Now', 'Submit', 'Proceed', 'Search']) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if ((await btn.count()) > 0) { await btn.click(); return; }
  }
  const fallback = page.locator('button[type="submit"]').first();
  if ((await fallback.count()) > 0) { await fallback.click(); return; }
  throw new Error('Submit button not found');
}

// ─── STEP 5: Vehicle details confirmation (if shown) ─────────────────────────
async function handleVehicleDetails(page: Page): Promise<void> {
  const body = await page.locator('body').innerText().catch(() => '');
  const onDetailsPage = /are these your vehicle details|get quotation/i.test(body);
  if (!onDetailsPage) return;

  console.log('   📋 Vehicle details step');

  // Tick any declaration checkboxes
  const cbs = page.locator('input[type="checkbox"]');
  for (let i = 0; i < (await cbs.count()); i++) await cbs.nth(i).check({ force: true }).catch(() => {});

  // Wait for "Get quotation" button to be enabled
  const ctaSel = 'button:has-text("Get quotation")';
  await poll(page, async () => {
    const c = page.locator(ctaSel).last();
    return (await c.count()) > 0 && await c.isEnabled().catch(() => false);
  }, 12_000);

  let btn = page.locator(ctaSel).last();
  if ((await btn.count()) === 0) btn = page.locator('button.primary-btn').last();
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ timeout: 8_000 }).catch(async () => {
    await btn.click({ force: true }).catch(() => {});
  });
}

// ─── Quotation card helpers (needed by steps 6 and 7) ────────────────────────
const CARD_SELS = ['.insurance-card', '.quotation-card', '.quote-card', '.insurer-card', '.plan-card'];

async function findCardSel(page: Page): Promise<string> {
  for (const s of CARD_SELS) if ((await page.locator(s).count()) > 0) return s;
  return '';
}

// ─── STEP 6: Click "Get Quotation" on the post-details summary page ──────────
// After confirming vehicle details the site lands on a summary page that
// requires an explicit "Get Quotation" button click before cards render.
async function clickGetQuotationButton(page: Page): Promise<boolean> {
  await page.waitForTimeout(600);

  // Already on cards — nothing to do
  if (await findCardSel(page)) return false;

  const sels = [
    'button:has-text("Get Quotation")',
    'button:has-text("Get quotation")',
    'button:has-text("Get Quote")',
  ];

  for (const sel of sels) {
    const btn = page.locator(sel).last();
    if ((await btn.count()) === 0 || !(await btn.isVisible().catch(() => false))) continue;

    // Wait until the button is enabled (sometimes it takes a moment)
    await poll(page, () => btn.isEnabled().catch(() => false), 10_000);

    console.log(`   🖱️  Clicking "${sel.match(/"([^"]+)"/)?.[1] ?? 'Get Quotation'}"`);
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 8_000 }).catch(async () => {
      await btn.click({ force: true }).catch(() => {});
    });
    await page.waitForTimeout(CONFIG.waitAfterClick);
    return true;
  }

  return false;
}

// ─── STEP 7: Wait for quotation cards ────────────────────────────────────────
async function waitForQuotations(page: Page): Promise<string> {
  const ok = await poll(page, async () => !!(await findCardSel(page)), 25_000);
  if (!ok) throw new Error('Quotation cards did not appear within 25 s');
  return findCardSel(page);
}

// ─── STEP 7: Select target insurer ───────────────────────────────────────────
async function selectInsurer(page: Page, cardSel: string, insurerName: string): Promise<void> {
  const cards = page.locator(cardSel);
  const total = await cards.count();
  const nameLower = insurerName.toLowerCase();

  // Collect visible cards with their insurer names (from alt text and inner text)
  const visible: { idx: number; detectedBy: string }[] = [];
  for (let i = 0; i < total; i++) {
    const card = cards.nth(i);
    if (!(await card.isVisible().catch(() => false))) continue;

    // Primary: check all img alt attributes (insurer name lives here, not in text)
    const alts: string[] = await card.locator('img[alt]').evaluateAll(
      (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt.toLowerCase())
    ).catch(() => []);
    const nameInAlt = alts.some(a => a.includes(nameLower));

    // Secondary: inner text (covers cases where name IS rendered as text)
    const text = (await card.innerText().catch(() => '')).toLowerCase();
    const nameInText = text.includes(nameLower);

    // Also check src attribute of images (e.g. "zurich.png" contains "zurich")
    const srcs: string[] = await card.locator('img[src]').evaluateAll(
      (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.src.toLowerCase())
    ).catch(() => []);
    const nameInSrc = srcs.some(s => s.includes(nameLower));

    if (nameInAlt || nameInText || nameInSrc) {
      visible.push({ idx: i, detectedBy: nameInAlt ? 'img alt' : nameInSrc ? 'img src' : 'text' });
    }
  }

  console.log(`   🃏 ${total} total card(s), ${visible.length} match "${insurerName}"`);

  if (!visible.length) {
    // Log what we found to help diagnose
    for (let i = 0; i < Math.min(total, 6); i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible().catch(() => false))) continue;
      const alts: string[] = await card.locator('img[alt]').evaluateAll(
        (imgs: Element[]) => (imgs as HTMLImageElement[]).map(img => img.alt)
      ).catch(() => []);
      console.log(`   Card ${i + 1} alts: [${alts.join(', ')}]`);
    }
    throw new Error(`Insurer "${insurerName}" not found among ${total} card(s)`);
  }

  // Use the first matching card
  const { idx, detectedBy } = visible[0];
  const card = cards.nth(idx);
  console.log(`   🎯 Found ${insurerName} at card index ${idx + 1} via ${detectedBy}`);

  // "Buy" is the confirmed button label from the HTML; list it first
  for (const label of ['Buy', 'Select', 'Buy Now', 'Proceed', 'Get Quote', 'Choose']) {
    const btn = card.locator(`button:has-text("${label}")`).first();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Clicking "${label}" button`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click();
      return;
    }
  }

  // Fallback: any primary button inside the card
  const primary = card.locator('button.primary-btn, button[class*="primary"]').first();
  if ((await primary.count()) > 0) {
    console.log('   🖱️  Clicking primary-btn in card');
    await primary.scrollIntoViewIfNeeded().catch(() => {});
    await primary.click();
    return;
  }

  console.log('   🖱️  Clicking card directly');
  await card.click();
}

// ─── STEP 8: Add-ons page ─────────────────────────────────────────────────────
async function handleAddOns(page: Page): Promise<void> {
  // Step 1: wait for page text to confirm we're on the add-ons page
  const textAppeared = await poll(page, async () => {
    const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    return /add.?on|extra cover|optional cover|additional benefit/i.test(t);
  }, CONFIG.stepTimeout);

  if (!textAppeared) throw new Error('Add-ons page did not load');

  // Step 2: wait an extra second for Angular to render the card components
  await page.waitForTimeout(1000);

  // Step 3: now wait specifically for .addon-card elements to appear
  const cardsAppeared = await poll(page, async () =>
    (await page.locator('.addon-card').count()) > 0, 10_000);

  if (!cardsAppeared) throw new Error('Add-on cards did not render after page load');

  const allCards = page.locator('.addon-card');
  const totalCards = await allCards.count();

  const visibleCards: number[] = [];
  for (let i = 0; i < totalCards; i++) {
    if (await allCards.nth(i).isVisible().catch(() => false)) visibleCards.push(i);
  }

  console.log(`   📦 ${visibleCards.length} visible add-on card(s) — targeting first 2 simple ones`);

  let added = 0;
  for (let n = 0; n < visibleCards.length && added < 2; n++) {
    const card = allCards.nth(visibleCards[n]);

    // Skip cards with sub-options (dropdowns/selects inside) — they need extra interaction
    const hasSubOptions = (await card.locator('select, input[type="radio"], input[type="number"]').count()) > 0;
    if (hasSubOptions) {
      console.log(`   ⏭️  Card ${n + 1} has sub-options — skipping`);
      continue;
    }

    const addBtn = card.locator('button:has-text("ADD"), button:has-text("Add")').first();
    if ((await addBtn.count()) > 0 && await addBtn.isVisible().catch(() => false)) {
      console.log(`   ➕ ADD on card ${n + 1}`);
      await addBtn.scrollIntoViewIfNeeded().catch(() => {});
      await addBtn.click();
      await page.waitForTimeout(1000);
      added++;
    } else {
      console.log(`   ⚠️  No ADD button on card ${n + 1} — skipping`);
    }
  }
  console.log(`   ✅ Added ${added} add-on(s)`);

  await page.waitForTimeout(1000);

  // Click Continue / Proceed
  for (const label of ['Continue', 'Proceed', 'Next', 'Add to Cart', 'Confirm']) {
    const btn = page.locator(`button:has-text("${label}")`).last();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Add-ons: clicking "${label}"`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
  throw new Error('Continue button not found on add-ons page');
}

// ─── STEP 9: Popup after add-ons ─────────────────────────────────────────────
async function handlePostAddOnsPopup(page: Page): Promise<void> {
  // Give the popup a moment to appear
  await page.waitForTimeout(1500);

  const popupSels = [
    'app-info-modal',
    'mat-dialog-container',
    '[role="dialog"]',
    '.modal-content',
    '.modal',
    'app-modal',
    '.dialog',
  ];

  let modal = null;
  for (const sel of popupSels) {
    const loc = page.locator(sel).first();
    if ((await loc.count()) > 0 && await loc.isVisible().catch(() => false)) {
      modal = loc;
      console.log(`   💬 Popup found via "${sel}"`);
      break;
    }
  }

  if (!modal) {
    console.log('   ℹ️  No popup detected — continuing');
    return;
  }

  const popupText = clean(await modal.innerText().catch(() => ''));
  console.log(`   💬 Popup text: "${popupText.slice(0, 200)}"`);

  // Prefer "Proceed" first (the Reminder modal uses this)
  for (const label of ['Proceed', 'Continue', 'OK', 'Ok', 'Confirm', 'Yes', 'Accept']) {
    const btn = modal.locator(`button:has-text("${label}")`).first();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Popup: clicking "${label}"`);
      await btn.click();
      await page.waitForTimeout(1000);
      return;
    }
  }

  // Fallback: click the last/primary button in the modal
  const any = modal.locator('button').last();
  if ((await any.count()) > 0) {
    const label = clean(await any.textContent().catch(() => '') || 'button');
    console.log(`   🖱️  Popup fallback: clicking "${label}"`);
    await any.click();
    await page.waitForTimeout(1000);
  }
}

// ─── STEP 10: Payment confirmation page ──────────────────────────────────────
async function handlePaymentConfirmation(page: Page): Promise<void> {
  const appeared = await poll(page, async () => {
    const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    return /confirm.*pay|payment detail|order summary|premium|total.*payable/i.test(t);
  }, CONFIG.stepTimeout);

  if (!appeared) {
    const t = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    throw new Error(`Payment confirmation page did not load. Page snippet: ${t}`);
  }

  await page.waitForTimeout(1000);

  const bodySnip = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
  console.log(`   💳 Payment confirmation snippet:\n${bodySnip}`);

  // Angular form uses formcontrolname attrs — target them directly
  async function fillByControlName(controlName: string, value: string) {
    const inp = page.locator(`input[formcontrolname="${controlName}"]`).first();
    if ((await inp.count()) === 0) {
      console.log(`   ⚠️  formcontrolname="${controlName}" not found — skipping`);
      return;
    }
    await inp.scrollIntoViewIfNeeded().catch(() => {});
    await inp.click();
    await inp.fill(value);
    await page.waitForTimeout(500);
    console.log(`   ✏️  ${controlName} = "${value}"`);
  }

  await fillByControlName('name',    CONFIG.ownerName);
  await fillByControlName('email',   CONFIG.ownerEmail);
  await fillByControlName('phoneNo', CONFIG.ownerPhone);
  await fillByControlName('addr1',   CONFIG.addressLine1);
  await fillByControlName('addr2',   CONFIG.addressLine2);
  await fillByControlName('addr3',   CONFIG.addressLine3);

  await page.waitForTimeout(1000);

  // Discount code — no formcontrolname; find input sibling of the "Discount code" span
  if (CONFIG.discountCode) {
    const discountContainer = page.locator('div.w-100.position-relative').filter({
      has: page.locator('span:has-text("Discount code")'),
    }).first();

    if ((await discountContainer.count()) > 0) {
      const discountInput = discountContainer.locator('input').first();
      await discountInput.scrollIntoViewIfNeeded().catch(() => {});
      await discountInput.click();
      await discountInput.fill(CONFIG.discountCode);
      await page.waitForTimeout(500);
      console.log(`   🏷️  Discount code entered: "${CONFIG.discountCode}"`);

      // Wait for Apply button to become enabled, then click it
      const applyBtn = page.locator('button:has-text("Apply discount code"), button:has-text("Apply")').last();
      await poll(page, () => applyBtn.isEnabled().catch(() => false), 5_000);
      if (await applyBtn.isEnabled().catch(() => false)) {
        await applyBtn.scrollIntoViewIfNeeded().catch(() => {});
        await applyBtn.click();
        await page.waitForTimeout(1000);
        console.log('   🏷️  Discount applied');
      } else {
        console.log('   ⚠️  Apply button still disabled — proceeding without discount');
      }
    } else {
      console.log('   ⚠️  Discount code field not found');
    }
  }

  await page.waitForTimeout(1000);

  const confirmBtn = page.locator('button[type="submit"]:has-text("Confirm and Pay"), button:has-text("Confirm and Pay")').last();
  if ((await confirmBtn.count()) > 0 && await confirmBtn.isVisible().catch(() => false)) {
    console.log('   🖱️  Clicking "Confirm and Pay"');
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.click();
    return;
  }
  throw new Error('Confirm and Pay button not found on payment confirmation page');
}

// ─── STEP 11: Verify payment method page ─────────────────────────────────────
async function verifyPaymentMethodPage(page: Page): Promise<void> {
  const appeared = await poll(page, async () => {
    const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    return /online banking|credit card|debit card|fpx|payment method|select.*payment/i.test(t);
  }, CONFIG.stepTimeout);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log(`   🏦 Payment method page snippet:\n${bodyText.slice(0, 400)}`);

  if (!appeared) throw new Error('Payment method page did not appear — check if flow stopped earlier');
}

// ─── MAIN TEST ───────────────────────────────────────────────────────────────
test.describe('Secarang Regression – Zurich E2E', () => {
  test.setTimeout(0);

  test('WYN3837 → Zurich → Add-ons → Confirm → Payment method page', async ({ page }) => {
    startedAt = new Date().toISOString();
    page.setDefaultNavigationTimeout(CONFIG.navTimeout);
    page.setDefaultTimeout(CONFIG.stepTimeout);

    const url = `${CONFIG.baseUrl}/car-insurance`;

    // ── 1. Navigate ──────────────────────────────────────────────
    try {
      console.log(`\n🌐 Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navTimeout });
      await page.waitForTimeout(500);
      await passSiteGate(page);
      recordStep('Navigate to site', 'PASS', url);
    } catch (e) {
      recordStep('Navigate to site', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 2. Select Car / Private ──────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await selectCarPrivate(page);
      recordStep('Select Car / Private', 'PASS', 'Car and Private selected');
    } catch (e) {
      recordStep('Select Car / Private', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 3. Fill form ─────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await fillForm(page);
      recordStep('Fill form', 'PASS', `VN=${CONFIG.vehicleNumber} IC=${CONFIG.icNumber}`);
    } catch (e) {
      recordStep('Fill form', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 4. Submit ────────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await submitForm(page);
      await page.waitForTimeout(1000);
      recordStep('Submit form', 'PASS', 'Form submitted');
    } catch (e) {
      recordStep('Submit form', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 5. Vehicle details page (if shown) ───────────────────────
    try {
      await poll(page, async () => {
        if (await findCardSel(page)) return true;
        const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
        return /are these your vehicle|get quotation|vehicle not found/i.test(t);
      }, 25_000);

      const body = await page.locator('body').innerText().catch(() => '');
      const detailsShown = /are these your vehicle details|get quotation/i.test(body);

      if (detailsShown) {
        await handleVehicleDetails(page);
        recordStep('Vehicle details page', 'PASS', 'Variant selected and proceeded');
      } else {
        recordStep('Vehicle details page', 'SKIP', 'Not shown — went straight to quotations');
      }
    } catch (e) {
      recordStep('Vehicle details page', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 6. Get Quotation button (intermediate page after vehicle details) ───────
    try {
      const clicked = await clickGetQuotationButton(page);
      recordStep('Get Quotation', clicked ? 'PASS' : 'SKIP',
        clicked ? 'Clicked Get Quotation button' : 'Not shown — cards already loading');
    } catch (e) {
      recordStep('Get Quotation', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 7. Wait for quotation cards ──────────────────────────────
    let cardSel = '';
    try {
      cardSel = await waitForQuotations(page);
      const count = await page.locator(cardSel).count();
      recordStep('Quotation results loaded', 'PASS', `${count} card(s) via "${cardSel}"`);
    } catch (e) {
      recordStep('Quotation results loaded', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 8. Select Zurich ─────────────────────────────────────────
    try {
      await selectInsurer(page, cardSel, CONFIG.targetInsurer);
      await page.waitForTimeout(1000);
      recordStep(`Select ${CONFIG.targetInsurer}`, 'PASS', 'Clicked Zurich card');
    } catch (e) {
      recordStep(`Select ${CONFIG.targetInsurer}`, 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 9. Add-ons page ──────────────────────────────────────────
    try {
      await handleAddOns(page);
      await page.waitForTimeout(1000);
      recordStep('Add-ons page', 'PASS', 'Selected first 2 add-ons, clicked Continue');
    } catch (e) {
      recordStep('Add-ons page', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 10. Post add-ons popup ───────────────────────────────────
    try {
      await handlePostAddOnsPopup(page);
      recordStep('Post add-ons popup', 'PASS', 'Popup dismissed (or not shown)');
    } catch (e) {
      recordStep('Post add-ons popup', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 11. Payment confirmation ─────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await handlePaymentConfirmation(page);
      await page.waitForTimeout(1000);
      recordStep('Payment confirmation', 'PASS', 'Clicked Confirm and Pay');
    } catch (e) {
      recordStep('Payment confirmation', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 12. Payment method page ──────────────────────────────────
    try {
      await verifyPaymentMethodPage(page);
      recordStep('Payment method page', 'PASS', 'Online banking / card options visible');
    } catch (e) {
      recordStep('Payment method page', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── All steps done ───────────────────────────────────────────
    writeResult('PASS');
    console.log('\n🎉 Regression PASSED — reached payment method selection page');
  });
});
