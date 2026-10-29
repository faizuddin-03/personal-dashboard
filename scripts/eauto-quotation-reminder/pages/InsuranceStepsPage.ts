import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Insurance steps 1–3. The cases differ only in where they stop, so one page
 * object covers all three.
 *
 *   1 Quotes            body#insurancePlan  .plan-container
 *   2 Optional Coverage body#coverage
 *   3 Payment           body#payment
 *
 * Arrival is asserted on the stepper (`div[id="N"].md-step.active`) or the body
 * id, never on a URL — the eSTM/banner entry may route through an intermediate
 * page, and a URL wait would hang if it is skipped.
 *
 * The stepper divs are id="1"/"2"/"3". Those must be matched with an ATTRIBUTE
 * selector: a CSS id selector cannot start with a digit, so `div#1` is a parse
 * error, not a miss. It fails the whole selector list — including the perfectly
 * good `body#insurancePlan` beside it — with
 *   SyntaxError: 'div#1.md-step.active' is not a valid selector
 * and then burns the full timeout before reporting it.
 */
export class InsuranceStepsPage extends BasePage {
  private planCards = () => this.page.locator('.plan-container');
  private selectPlanBtns = () => this.page.locator('button.select-plan-btn');

  async expectStep(n: 1 | 2 | 3, timeout = 60_000): Promise<void> {
    const bodyId = { 1: 'insurancePlan', 2: 'coverage', 3: 'payment' }[n];
    await expect(
      this.page.locator(`body#${bodyId}, div[id="${n}"].md-step.active`).first(),
      `Did not reach insurance step ${n}`,
    ).toBeVisible({ timeout });
    this.step(`At insurance step ${n}`);

    // Step 3 is where the DRAFT quotation row actually commits
    // (knowledge/eauto-insurance.md § "generated at STEP 3, not before"). Every
    // caller that stops here immediately navigates elsewhere afterwards — to the
    // listing to check the row, or to idle out and come back later — and that
    // navigation was firing the instant `body#payment` became visible, with no
    // settle time at all. If the row is written by a call that fires after the
    // page paints rather than one the render blocks on, a same-page
    // `page.goto()` that fast can cancel it mid-flight — a page navigation
    // tears down whatever the previous page still had in flight. Observed as
    // "the transaction wasn't created" on 2026-08-18. So: give network activity
    // a chance to go quiet before returning. Best-effort — a page that keeps
    // polling never reports idle, so this never blocks a healthy run for more
    // than the timeout.
    if (n === 3) {
      await this.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => { /* still settle below */ });
      await this.page.waitForTimeout(2_000);
    }
  }

  /** The transaction id lives in the DOM — cleaner than scraping the URL. */
  async transactionId(): Promise<string> {
    const el = this.page.locator('#adjustSumInsuredForm input[name=transactionId]');
    return (await el.count()) ? ((await el.inputValue()).trim()) : '';
  }

  async cardCount(): Promise<number> {
    await this.planCards().first().waitFor({ state: 'visible', timeout: 45_000 }).catch(() => { /* none is a real outcome */ });
    return this.planCards().count();
  }

  /**
   * Every quote on the page, parsed from `plandetails` — the whole quote as
   * JSON on the select button. Beats regexing money out of rendered text: it
   * gives exact figures, the insurer code, and the isError/isReferRisk flags.
   */
  async quotes(): Promise<{ planCode: string; annualPremium: number; isError: boolean; isReferRisk: boolean }[]> {
    const raw = await this.selectPlanBtns().evaluateAll((els) =>
      els.map((e) => e.getAttribute('plandetails') ?? ''));
    return raw.flatMap((r) => {
      try {
        const j = JSON.parse(r);
        return [{
          planCode: String(j.planCode ?? ''),
          annualPremium: Number(j.annualPremium ?? 0),
          isError: Boolean(j.isError),
          isReferRisk: Boolean(j.isReferRisk),
        }];
      } catch { return []; }
    });
  }

  /**
   * Select an insurer. Omit `planCode` to take whichever card the e-simulator
   * put first — which insurers offer a quote at all, and in what order,
   * depends on the e-simulator's response for the vehicle number, not
   * anything the automation controls, so "first available" is the only
   * choice that doesn't assume a specific insurer will be there.
   * `[from Faizuddin, 2026-08-18]` Passing a `planCode` (Lonpac / TokioMarine /
   * Chubb / Takaful / Rhb) still works and falls back to the first card with a
   * warning if that insurer isn't offered.
   */
  async selectInsurer(planCode?: string): Promise<string> {
    const preferred = planCode ? this.page.locator(`.plan-container.${planCode} button.select-plan-btn`).first() : null;
    const useIt = preferred ? (await preferred.count()) > 0 : false;
    if (planCode && !useIt) console.log(`[warn] ${planCode} not offered for this vehicle — falling back to the first card`);

    const btn = useIt && preferred ? preferred : this.selectPlanBtns().first();
    const chosen = JSON.parse((await btn.getAttribute('plandetails')) ?? '{}').planCode ?? '(unknown)';
    await btn.click();
    this.step(`Selected insurer ${chosen}`);
    return String(chosen);
  }

  /** Step 2 → step 3. "Make Payment" does NOT pay; it opens the payment form. */
  async toPayment(): Promise<void> {
    await this.page.locator('#confirm-plan').click();
  }
}
