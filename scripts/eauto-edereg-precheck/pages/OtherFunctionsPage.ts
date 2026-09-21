import { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrecheckSession } from '../utils/session';
import { DeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from './DeregTransactionPage';

// ── OF_TS1-3 (EAINT-9306 "Other Functions" table) ────────────
// All 3 live on Deregistration Step 2's Vehicle Details form
// (EAINT-9306-dereg-step2-vehicle-details.html):
//   OF_TS1 — a vehicle no. with no valid pre-check opens the inline
//            #precheck-popup; clicking Cancel instead of paying should
//            close it and leave #precheck-result's red error in place.
//   OF_TS2 — submitting with #vehicleRegNo left blank should show a
//            required-field validation instead of navigating to step 3.
//   OF_TS3 — #vehicleRegNo's own input-shaping: rejects non-alphanumeric
//            characters, strips spacebar, auto-capitalizes lowercase.
// None of these create a real Deregistration transaction — all 3 stop at
// Step 2, per the test plan's own scope.
const DUMMY_UPLOAD_PATH = path.resolve(process.cwd(), '..', '..', '_reference', 'dummies', 'Test PDF.pdf');

export interface CancelPrecheckResult {
  popupClosed: boolean;
  errorVisible: boolean;
  errorText: string;
  errorColor: string;
  isRed: boolean;
}

export interface BlankVehicleNoResult {
  stayedOnStep2: boolean;
  validationMessageSeen: boolean;
  validationText: string;
  fieldBackgroundColor: string;
  fieldTextColor: string;
}

export interface InputShapingCheck {
  label: string;
  typed: string;
  resultValue: string;
  asExpected: boolean;
}

export class OtherFunctionsPage {
  constructor(private readonly page: Page, private readonly session: PrecheckSession) {}

  /** OF_TS1: fill a vehicle no. with NO valid pre-check — same gate check
   *  `DeregTransactionPage.resolveVehicleGate()`/`beginInlinePaymentFlow()`
   *  use (`fillVehicleRegNoAndCheckGate()`, confirmed live 2026-08-26 via
   *  CPC_E2E_TS5 Part 2's own use of this exact popup) — then click Cancel
   *  instead of Next/paying. Expects the popup to close and the SAME red
   *  `.error` under #vehicleRegNo (already showing since before the popup
   *  opened, per EAINT-9306-dereg-step2-vehicle-details.html STATE 2) to
   *  still be there afterward.
   *  PRECONDITION: `vehicleRegNo` must NOT have an approved pre-check within
   *  the last 6 months — use a fresh/unused plate, not the shared
   *  happy-path vehicle. */
  async cancelPrecheckPopup(dereg: DeregTransactionPage, vehicleRegNo: string): Promise<CancelPrecheckResult> {
    const p = await this.session.waitForActivePage();
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(
        `OF_TS1 needs the gate BLOCKED (no valid pre-check) so the inline #precheck-popup appears — vehicle `
        + `${vehicleRegNo} already has one. Use a fresh/unused vehicle no. for this test case.`,
      );
    }

    const dialog = p.locator('.ui-dialog:visible').last();
    const popupOpened = await dialog.waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');

    await dialog.getByRole('button', { name: 'Cancel' }).click({ timeout: 10_000 });
    const popupClosed = await dialog.waitFor({ state: 'hidden', timeout: 15_000 }).then(() => true).catch(() => false);

    const errorSpan = p.locator('#precheck-result .error');
    const errorVisible = await errorSpan.isVisible().catch(() => false);
    let errorText = '';
    let errorColor = '';
    if (errorVisible) {
      errorText = (await errorSpan.textContent().catch(() => ''))?.trim() ?? '';
      errorColor = await errorSpan.evaluate((el) => getComputedStyle(el as HTMLElement).color).catch(() => '');
    }
    const isRed = errorColor === 'rgb(255, 0, 0)';

    this.session.progress(
      'of-ts1-cancel',
      `OF_TS1: popup ${popupClosed ? 'closed' : 'STILL OPEN'}, error ${errorVisible ? 'visible' : 'MISSING'}`
        + (errorVisible ? `, red=${isRed}, text="${errorText}"` : ''),
    );
    await this.session.pauseForDetails();

    return { popupClosed, errorVisible, errorText, errorColor, isRed };
  }

  /** OF_TS2: fill everything EXCEPT #vehicleRegNo, then submit. Expects a
   *  required-field validation instead of navigating to step 3.
   *
   *  UNCONFIRMED PAST THE #to-continue CLICK — no live HTML capture exists
   *  for this validation state (test plan only describes it: a popup
   *  reading "Vehicle No. is required.", the field turning yellow with red
   *  text). Checks are broad/best-effort (any "vehicle no. is required"
   *  text on the page, plus the field's own computed background/text
   *  color) — expect this to need adjusting on the first live run, and per
   *  the standing HTML-capture rule, save whatever the real markup turns
   *  out to be and update this + knowledge/flow-edereg.md in the same
   *  change. */
  async submitWithBlankVehicleNo(vehicle: DeregVehicleInputs): Promise<BlankVehicleNoResult> {
    const p = await this.session.waitForActivePage();

    await p.locator('#vehicleRegNo').fill('');
    await p.locator('#contactNo').fill(vehicle.contactNo);
    await p.locator('#email').fill(vehicle.ownerEmail);
    await p.locator('#pbtCompanyId').selectOption({ value: '-1' }); // INDIVIDU
    await p.locator('#vehicleEngineNo').fill(vehicle.vehicleEngineNo);
    await p.locator('#vehicleChassisNo').fill(vehicle.vehicleChassisNo);
    await p.locator('#vehicleMake').selectOption({ value: 'OTHER' });
    await p.locator('#otherVehicleMakeText').fill(vehicle.otherVehicleMake);
    await p.locator('#vehicleModel').selectOption({ value: 'OTHER' });
    await p.locator('#otherVehicleModelText').fill(vehicle.otherVehicleModel);
    await p.locator('#vehicleYear').selectOption({ value: vehicle.vehicleYear });

    if (!fs.existsSync(DUMMY_UPLOAD_PATH)) {
      throw new Error(`Dummy upload PDF not found at ${DUMMY_UPLOAD_PATH} — needed for #aatfConsent/#photo1-3.`);
    }
    await p.locator('#aatfConsent').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo1').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo2').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo3').setInputFiles(DUMMY_UPLOAD_PATH);

    // Defensive native-confirm wrap, same reasoning as submitVehicleDetails()
    // — harmless no-op if nothing fires.
    await this.session.withNativeConfirm(() => p.locator('#to-continue').click());
    await p.waitForTimeout(1500); // let any validation UI render

    const stayedOnStep2 = await p.locator('#aatfConsent').isVisible().catch(() => false);
    const validationLocator = p.getByText(/vehicle no\.?\s*is required/i).first();
    const validationMessageSeen = await validationLocator.isVisible({ timeout: 5_000 }).catch(() => false);
    const validationText = validationMessageSeen
      ? ((await validationLocator.textContent().catch(() => ''))?.trim() ?? '')
      : '';

    const fieldStyle = await p.locator('#vehicleRegNo').evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { bg: cs.backgroundColor, color: cs.color };
    }).catch(() => ({ bg: '', color: '' }));

    this.session.progress(
      'of-ts2-blank-vehicle',
      `OF_TS2: stayedOnStep2=${stayedOnStep2}, validationMessageSeen=${validationMessageSeen}, `
        + `fieldBg=${fieldStyle.bg}, fieldColor=${fieldStyle.color}`,
    );
    await this.session.pauseForDetails();

    return {
      stayedOnStep2, validationMessageSeen, validationText,
      fieldBackgroundColor: fieldStyle.bg, fieldTextColor: fieldStyle.color,
    };
  }

  /** OF_TS3: #vehicleRegNo's input-shaping — types (not `.fill()`, so real
   *  keydown/input events actually fire the page's own JS filters) 3
   *  different inputs and reads back what actually landed in the field. */
  async checkVehicleNoInputShaping(): Promise<InputShapingCheck[]> {
    const p = await this.session.waitForActivePage();
    const field = p.locator('#vehicleRegNo');
    const results: InputShapingCheck[] = [];

    const cases: { label: string; typed: string; asExpected: (v: string) => boolean }[] = [
      { label: 'Reject non-alphanumeric characters', typed: 'AB!@#12', asExpected: (v) => /^[A-Za-z0-9]*$/.test(v) },
      { label: 'Auto-remove spacebar', typed: 'AB 12', asExpected: (v) => !v.includes(' ') },
      { label: 'Auto-capitalize lowercase letters', typed: 'ab12cd', asExpected: (v) => v.length > 0 && v === v.toUpperCase() },
    ];

    for (const c of cases) {
      await field.fill('');
      await field.pressSequentially(c.typed, { delay: 30 });
      const resultValue = await field.inputValue();
      const asExpected = c.asExpected(resultValue);
      results.push({ label: c.label, typed: c.typed, resultValue, asExpected });
      this.session.progress(
        `of-ts3-${c.label}`,
        `OF_TS3 (${c.label}): typed "${c.typed}" -> "${resultValue}" (${asExpected ? 'OK' : 'UNEXPECTED'})`,
      );
    }
    await this.session.pauseForDetails();

    return results;
  }
}
