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
  // Payment gateway
  targetBank:     process.env.REGRESSION_BANK        || 'fpx_mb2u',   // Maybank
  bankUsername:   process.env.REGRESSION_BANK_USER   || 'Gaara',
  bankPassword:   process.env.REGRESSION_BANK_PASS   || 'letmepaywithsand',
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
async function handlePaymentConfirmation(page: Page): Promise<Page> {
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

      // Wait 1s for Apply button to become enabled, then click it
      await page.waitForTimeout(1000);
      const applyBtn = page.locator('button:has-text("Apply discount code"), button:has-text("Apply")').last();
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
  if ((await confirmBtn.count()) === 0 || !(await confirmBtn.isVisible().catch(() => false))) {
    throw new Error('Confirm and Pay button not found on payment confirmation page');
  }

  console.log('   🖱️  Clicking "Confirm and Pay" — waiting for payment popup…');
  await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});

  // Capture the popup window that opens when Confirm and Pay is clicked
  const [popup] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 30_000 }),
    confirmBtn.click(),
  ]);

  await popup.waitForLoadState('domcontentloaded', { timeout: CONFIG.navTimeout }).catch(() => {});
  await popup.waitForTimeout(1500);
  console.log(`   🪟  Popup opened: ${popup.url()}`);

  return popup;
}

// ─── STEP 11: Select FPX + bank in popup ─────────────────────────────────────
async function selectPaymentMethod(popup: Page): Promise<void> {
  // Wait for paymentType radio cards to appear
  const appeared = await poll(popup, async () =>
    (await popup.locator('input[formcontrolname="paymentType"]').count()) > 0,
    CONFIG.stepTimeout,
  );
  if (!appeared) throw new Error('Payment type options did not appear in popup');

  // ── 1. Click "FPX Online banking" payment type ──────────────────────────────
  // Each option is a hidden radio inside a <label> card — click the label.
  const fpxLabel = popup.locator('label').filter({ hasText: /FPX/i }).first();
  if ((await fpxLabel.count()) === 0 || !(await fpxLabel.isVisible().catch(() => false))) {
    throw new Error('FPX Online banking label not found');
  }
  console.log('   🖱️  Selecting "FPX Online banking"');
  await fpxLabel.scrollIntoViewIfNeeded().catch(() => {});
  await fpxLabel.click();
  await popup.waitForTimeout(1000);

  // ── 2. Wait for bank grid and log all available banks ───────────────────────
  await poll(popup, async () =>
    (await popup.locator('input[formcontrolname="bank"]').count()) > 0,
    10_000,
  );

  // Read bank names from img alt attributes — use only the desktop grid (d-md-block)
  // to avoid duplicates from the responsive grids
  const bankInputs = popup.locator('.d-md-block input[formcontrolname="bank"]');
  const bankCount = await bankInputs.count();
  console.log(`   🏦 ${bankCount} bank option(s) available:`);
  for (let i = 0; i < bankCount; i++) {
    const input = bankInputs.nth(i);
    const value = await input.getAttribute('value').catch(() => '');
    const img   = input.locator('xpath=ancestor::label//img').first();
    const alt   = await img.getAttribute('alt').catch(() => '');
    console.log(`      [${i + 1}] value="${value}" name="${alt}"`);
  }

  // ── 3. Click the target bank label (first visible one matching the value) ───
  const bankLabels = popup.locator(`label`).filter({
    has: popup.locator(`input[formcontrolname="bank"][value="${CONFIG.targetBank}"]`),
  });
  let clicked = false;
  for (let i = 0; i < await bankLabels.count(); i++) {
    const lbl = bankLabels.nth(i);
    if (await lbl.isVisible().catch(() => false)) {
      const alt = await lbl.locator('img').getAttribute('alt').catch(() => CONFIG.targetBank);
      console.log(`   🖱️  Selecting bank: "${alt}" (${CONFIG.targetBank})`);
      await lbl.scrollIntoViewIfNeeded().catch(() => {});
      await lbl.click();
      await popup.waitForTimeout(1000);
      clicked = true;
      break;
    }
  }
  if (!clicked) throw new Error(`Bank "${CONFIG.targetBank}" not found or not visible`);

  // ── 4. Click Proceed / Pay / Submit ─────────────────────────────────────────
  for (const label of ['Proceed', 'Pay', 'Continue', 'Submit', 'Next']) {
    const btn = popup.locator(`button:has-text("${label}"), input[type="submit"][value*="${label}" i]`).last();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Clicking "${label}"`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click();
      await popup.waitForTimeout(1000);
      return;
    }
  }
  // No explicit proceed button found — some flows auto-navigate on bank click
  console.log('   ℹ️  No Proceed button found — assuming auto-navigation after bank selection');
}

// ─── STEP 12: Bank login (may be preceded by site password gate) ─────────────
async function handleBankLogin(popup: Page): Promise<void> {
  // The staging gateway sometimes shows the same site password gate
  await passSiteGate(popup);
  await popup.waitForTimeout(1000);

  // Wait for a login form (username + password fields)
  const loginAppeared = await poll(popup, async () =>
    (await popup.locator('input[type="text"], input[type="email"], input[name*="user" i], input[id*="user" i]').count()) > 0 &&
    (await popup.locator('input[type="password"]').count()) > 0,
    CONFIG.stepTimeout,
  );
  if (!loginAppeared) throw new Error('Bank login page did not appear');

  // Log what's on the page before filling
  const snippet = (await popup.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 300);
  console.log(`   🔑 Bank login page: "${snippet}"`);

  // Fill username
  const usernameField = popup.locator(
    'input[name*="user" i], input[id*="user" i], input[placeholder*="user" i], input[type="text"]'
  ).first();
  await usernameField.scrollIntoViewIfNeeded().catch(() => {});
  await usernameField.click();
  await usernameField.fill(CONFIG.bankUsername);
  await popup.waitForTimeout(500);
  console.log(`   ✏️  Username: "${CONFIG.bankUsername}"`);

  // Fill password
  const passwordField = popup.locator('input[type="password"]').first();
  await passwordField.scrollIntoViewIfNeeded().catch(() => {});
  await passwordField.click();
  await passwordField.fill(CONFIG.bankPassword);
  await popup.waitForTimeout(500);
  console.log('   ✏️  Password: [filled]');

  // Click Login / Sign In / Submit
  for (const label of ['Login', 'Log In', 'Sign In', 'Submit', 'Enter']) {
    const btn = popup.locator(`button:has-text("${label}"), input[type="submit"][value*="${label}" i]`).first();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Clicking "${label}"`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click();
      await popup.waitForTimeout(1000);
      return;
    }
  }
  // Fallback: press Enter on password field
  console.log('   🖱️  No Login button found — pressing Enter on password field');
  await passwordField.press('Enter');
  await popup.waitForTimeout(1000);
}

// ─── STEP 13: Log page options, click Request TAC ────────────────────────────
async function handleRequestTAC(popup: Page): Promise<void> {
  await popup.waitForTimeout(1000);

  // Log everything visible on this page
  const bodyText = (await popup.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  console.log(`   📋 Post-login page content:\n${bodyText.slice(0, 800)}`);

  // Log all buttons
  const allBtns = popup.locator('button, input[type="submit"], input[type="button"]');
  const btnCount = await allBtns.count();
  console.log(`   🔘 ${btnCount} button(s) on page:`);
  for (let i = 0; i < btnCount; i++) {
    const txt = ((await allBtns.nth(i).textContent().catch(() => '')) ||
                 (await allBtns.nth(i).getAttribute('value').catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (txt) console.log(`      [${i + 1}] "${txt}"`);
  }

  // Click Request TAC
  for (const label of ['Request TAC', 'Request OTP', 'Get TAC', 'Get OTP', 'Send TAC', 'TAC']) {
    const btn = popup.locator(`button:has-text("${label}"), input[value*="${label}" i]`).first();
    if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
      console.log(`   🖱️  Clicking "${label}"`);
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click();
      await popup.waitForTimeout(1500);
      return;
    }
  }
  throw new Error('Request TAC button not found');
}

// ─── STEP 14: Read OTP, fill it, click Pay Now ───────────────────────────────
async function handleOTPAndPay(popup: Page): Promise<void> {
  // Wait for OTP to appear
  const otpAppeared = await poll(popup, async () =>
    (await popup.locator('div.otp, .otp, [class*="otp"]').count()) > 0,
    CONFIG.stepTimeout,
  );
  if (!otpAppeared) throw new Error('OTP/TAC element did not appear');

  const otpEl = popup.locator('div.otp, .otp, [class*="otp"]').first();
  const otpRaw = await otpEl.textContent().catch(() => '');
  console.log(`   🔢 OTP element text: "${otpRaw}"`);

  // Extract the 6-digit number
  const match = otpRaw.match(/\d{6}/);
  if (!match) throw new Error(`Could not extract 6-digit OTP from: "${otpRaw}"`);
  const otp = match[0];
  console.log(`   🔢 Extracted OTP: ${otp}`);

  // Fill OTP input
  const otpInput = popup.locator('input#otp-input, input[name="otp-input"], input[class*="otp" i]').first();
  if ((await otpInput.count()) === 0) throw new Error('OTP input field not found');
  await otpInput.scrollIntoViewIfNeeded().catch(() => {});
  await otpInput.click();
  await otpInput.fill(otp);
  await popup.waitForTimeout(500);
  console.log(`   ✏️  OTP entered: ${otp}`);

  // Click Pay Now
  const payBtn = popup.locator('button.pay-btn, button:has-text("Pay Now")').first();
  if ((await payBtn.count()) === 0) throw new Error('Pay Now button not found');
  console.log('   🖱️  Clicking "Pay Now"');
  await payBtn.scrollIntoViewIfNeeded().catch(() => {});
  await payBtn.click();
  await popup.waitForTimeout(2000);

  // Log the final page
  const finalText = (await popup.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  console.log(`   📋 Post-payment page content:\n${finalText.slice(0, 1000)}`);
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
    let paymentPopup: Page | null = null;
    try {
      await page.waitForTimeout(1000);
      paymentPopup = await handlePaymentConfirmation(page) as unknown as Page;
      recordStep('Payment confirmation', 'PASS', 'Filled details, clicked Confirm and Pay, popup opened');
    } catch (e) {
      recordStep('Payment confirmation', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 12. Select FPX + Maybank in popup ───────────────────────
    try {
      if (!paymentPopup) throw new Error('Payment popup was not captured');
      await selectPaymentMethod(paymentPopup);
      recordStep('Select payment method', 'PASS', `FPX selected, bank: ${CONFIG.targetBank}`);
    } catch (e) {
      recordStep('Select payment method', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 13. Bank login ───────────────────────────────────────────
    try {
      await handleBankLogin(paymentPopup!);
      recordStep('Bank login', 'PASS', `Logged in as ${CONFIG.bankUsername}`);
    } catch (e) {
      recordStep('Bank login', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 14. Request TAC ──────────────────────────────────────────
    try {
      await handleRequestTAC(paymentPopup!);
      recordStep('Request TAC', 'PASS', 'TAC requested');
    } catch (e) {
      recordStep('Request TAC', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 15. Enter OTP and Pay Now ────────────────────────────────
    try {
      await handleOTPAndPay(paymentPopup!);
      recordStep('OTP and Pay Now', 'PASS', 'OTP entered and Pay Now clicked');
    } catch (e) {
      recordStep('OTP and Pay Now', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── All steps done ───────────────────────────────────────────
    writeResult('PASS');
    console.log('\n🎉 Regression PASSED — payment submitted');
  });
});
