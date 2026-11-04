/**
 * Shared base for eAuto's transaction wizards.
 *
 * STMS and eSerahan (eSTM) are the same wizard with different labels: the same
 * category tiles, the same jQuery UI confirm dialogs, the same MyKad panel, the
 * same `<div class="next-btn">` action controls. BMK and JomCheck reuse the
 * `#create-tx` entry button too.
 *
 * Everything genuinely common lives here so a new module costs a subclass, not
 * a rewrite.
 *
 * Confirmed against staging on 2026-09-15.
 */

import { expect, type Page } from "@playwright/test";
import { UcdHomePage, type UcdMenuItem } from "./ucd/ucd-home.page";

const NEWLINE = String.fromCharCode(10);

/** Escape a literal path so it can be matched inside a URL regex. */
function escapeForUrl(path: string): string {
  return path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Seller / buyer ID category. The codes are the page's own `category` attribute. */
export const IdCategory = {
  MALAYSIAN: "MALAYSIAN",
  SYARIKAT: "SYARIKAT",
  MYPR: "MyPR - PEMASTAUTIN TETAP",
} as const;
export type IdCategory = (typeof IdCategory)[keyof typeof IdCategory];

export const CATEGORY_CODE: Record<IdCategory, string> = {
  [IdCategory.MALAYSIAN]: "1",
  [IdCategory.SYARIKAT]: "4",
  [IdCategory.MYPR]: "0",
};

/** Minimal MyKad driver shape, so page objects do not depend on the client. */
export interface MyKadDriver {
  insertCard(card: CardLike): Promise<void>;
}
export type CardLike = { NRIC: string; GMPCName: string; [k: string]: unknown };

export abstract class TransactionWizardPage {
  constructor(protected readonly page: Page) {}

  /**
   * The module's landing page, e.g. `view/ucd/stms/view.do`.
   *
   * Used to CONFIRM the tile click arrived, never to navigate — see
   * `gotoLanding()`.
   */
  protected abstract readonly landingPath: string;
  /** The dashboard tile that opens this module, by its visible label. */
  protected abstract readonly menuItem: UcdMenuItem;
  /** What the wizard URL looks like once `#create-tx` has been pressed. */
  protected abstract readonly wizardUrlPattern: RegExp;

  /**
   * Reach the module's landing page the way a dealer does — by clicking its
   * dashboard tile.
   *
   * It does NOT navigate to `landingPath`. A constructed path 404s or
   * redirects, and a redirect can land the run on a different environment
   * whose login form is identical (qa-principles #13). The path is then used
   * only to assert the click arrived where it should, so a retitled or moved
   * tile fails here with the reason rather than three screens later.
   *
   * The caller must already be signed in and on the dashboard, which is where
   * `ucdSession()` leaves it.
   */
  async gotoLanding(): Promise<void> {
    const home = new UcdHomePage(this.page);
    await home.settle();
    await home.goTo(this.menuItem);
    await expect(this.page).toHaveURL(new RegExp(escapeForUrl(this.landingPath)), {
      timeout: 30_000,
    });
    await this.dismissAnnouncements();
  }

  /** Landing -> wizard. `#create-tx` is the same id across modules. */
  async startNewTransaction(): Promise<void> {
    await this.gotoLanding();
    await Promise.all([
      this.page.waitForURL(this.wizardUrlPattern, { timeout: 30_000 }),
      this.page.locator("#create-tx").click(),
    ]);
    await this.dismissAnnouncements();
  }

  /**
   * Close any announcement / terms modal blocking the page.
   *
   * eSerahan opens `#dialog-estm-announcement` on its create screen and the
   * overlay sits above the category tiles, so every click silently times out
   * until this runs. STMS has no such dialog — which is exactly why it is easy
   * to write a module-specific flow that works and then fails on the next one.
   */
  async dismissAnnouncements(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const overlay = this.page.locator(".ui-widget-overlay").first();
      if (!(await overlay.isVisible().catch(() => false))) break;

      const closers = [
        this.page.locator(".ui-dialog:visible .ui-dialog-titlebar-close").first(),
        this.page.locator(".ui-dialog:visible button", { hasText: /^(Close|Tutup|OK)$/ }).first(),
        this.page.locator(".modal.show .close, .modal.in .close").first(),
      ];
      let clicked = false;
      for (const c of closers) {
        if (await c.isVisible().catch(() => false)) {
          await c.click({ timeout: 3_000 }).catch(() => {});
          clicked = true;
          break;
        }
      }
      if (!clicked) break;
      // The overlay going away is the signal the dialog closed, so wait on
      // that rather than on the clock. Short explicit timeout because the
      // catch swallows it (docs/writing-tests.md § Waiting).
      await overlay.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
    }
  }

  /**
   * Choose an ID category, then confirm.
   *
   * Two traps:
   *  - The tiles are `<a class="owner-category" data="..." category="...">` with
   *    jQuery-bound handlers. Clicking the surrounding `<td>` misses entirely,
   *    appends `#` to the URL, and does nothing.
   *  - Each category has TWO anchors (an image and a text link) and they share
   *    the same attributes. The image one is not always clickable, so this picks
   *    whichever is actually visible.
   */
  async chooseCategory(category: IdCategory, expectUrl: RegExp): Promise<void> {
    await this.dismissAnnouncements();

    const tiles = this.page.locator(`a.owner-category[data="${category}"]`);
    const count = await tiles.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const tile = tiles.nth(i);
      if (await tile.isVisible().catch(() => false)) {
        await tile.click({ timeout: 10_000 }).catch(() => {});
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error(`No clickable "${category}" category tile was found.`);

    const yes = this.page.locator(".ui-dialog-buttonpane button", { hasText: /^Yes$/ }).first();
    await yes.waitFor({ state: "visible", timeout: 15_000 });
    await Promise.all([this.page.waitForURL(expectUrl, { timeout: 30_000 }), yes.click()]);
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  /**
   * Confirm a jQuery UI dialog and return what it said.
   *
   * These are jQuery UI dialogs, not native ones, so `page.on("dialog")` never
   * fires for them.
   *
   * The affirmative button is NOT always labelled "Yes". STMS says Yes/No;
   * eSerahan's payment dialog ("Sure to proceed with payment?") says
   * **Back / Next**. Matching on words means a new dialog with a new label
   * silently waits out its timeout.
   *
   * So match the CLASS instead. The app tags whichever button is affirmative
   * with `confirm-dialog-btn` when it opens the dialog, regardless of label —
   * the words are decoration, the class is the contract.
   */
  async confirmDialog(timeout = 15_000): Promise<string> {
    const dialog = this.page.locator(".ui-dialog").last();
    await dialog.waitFor({ state: "visible", timeout });
    const text = (await dialog.innerText()).replace(/\s+/g, " ").trim();

    const byClass = dialog.locator("button.confirm-dialog-btn").first();
    if (await byClass.isVisible().catch(() => false)) {
      await byClass.click();
      return text;
    }
    // Fallback for any dialog the app did not tag.
    await dialog
      .locator("button", { hasText: /^(Yes|OK|Setuju|Confirm|Next|Proceed)$/ })
      .first()
      .click();
    return text;
  }

  /**
   * [Save & Continue Later] on a wizard step (STMS, UCD to UCD, eSerahan Step 4 / Step 5), then **Yes** on
   * "Sure to continue later?" (the dialog's buttons are No / Yes). Lands on the module's listing, the
   * transaction left Pending with [Resubmit]. Pays nothing.
   *
   * Seen on staging 20-21.10.2026 (EAINT-12253 seed + after runs, `cr/EAINT-12253/05-evidence/**` logs):
   * `<div id="to-continue" class="save-btn">Save &amp; Continue Later</div>` on STMS / Interstate buyer /
   * eSTM Step 4 and STMS Step 5; dialog "Save and Continue Later" (STMS) / "Exit Confirmation" (eSTM),
   * "Sure to continue later?" No / Yes; then `…/enquiry/main.do`. Added 21.10.2026 for EAINT-12253 (no
   * flow calls it; the flows' own stops are unchanged). `#to-continue` WITHOUT `.save-btn` is "Next" on
   * other modules (BMK, Dereg), hence the class and the label in the locator.
   */
  async saveAndContinueLater(): Promise<string> {
    const btn = this.page.locator("#to-continue.save-btn", { hasText: /Save\s*&\s*Continue Later/i });
    await btn.waitFor({ state: "visible", timeout: 30_000 });
    await btn.click();
    const dialog = this.page.locator(".ui-dialog:visible").filter({ hasText: /Sure to continue later\?/i }).last();
    await dialog.waitFor({ state: "visible", timeout: 15_000 });
    const text = (await dialog.innerText()).replace(/\s+/g, " ").trim();
    await Promise.all([
      this.page.waitForURL(/enquiry\/main\.do/, { timeout: 60_000 }),
      dialog.locator("button", { hasText: /^Yes$/ }).click(),
    ]);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    return text;
  }

  /**
   * Tick a consent checkbox.
   *
   * `.check()` re-queries after clicking and loses the element to the page's
   * re-render, so a plain click plus an explicit assertion is what is stable.
   */
  protected async tickConsent(selector: string): Promise<void> {
    const consent = this.page.locator(selector);
    await consent.click();
    await expect(consent).toBeChecked({ timeout: 10_000 });
  }

  /**
   * Drive one MyKad read to completion.
   *
   * The screens differ and this handles both:
   *  - Some (STMS seller) show "Scan IC" once their socket is up and wait.
   *  - Others (STMS buyer) AUTO-READ on Smart Card Ready and only reveal
   *    "Scan IC" after their own 10-second no-card timeout.
   *
   * Either way the emulator PARKS the READCARD until a card is inserted, so
   * inserting is what completes the read; clicking is optional.
   *
   * If "Scan IC" never appears at all, the browser is almost certainly blocking
   * localhost — see the launch flag in playwright.config.ts.
   */
  protected async readMyKad(mykad: MyKadDriver, card: CardLike): Promise<void> {
    const scan = this.page.locator("#readMyKadButton");

    /**
     * WAIT FOR THE PAGE TO BE READY BEFORE INSERTING. This is not politeness.
     *
     * The page sends `INIT` when its socket opens, and `INIT` CLEARS the
     * channel's card state. Insert before that and the card is wiped, the page
     * then sends READCARD, and it parks forever waiting for a card that was
     * already consumed. The symptom is a "Scan IC" button that stays hidden and
     * disabled until the test times out.
     *
     * Readiness = the scan button exists and is enabled (the click-to-scan
     * screens), or the page has moved into its own reading state (the
     * auto-read screens).
     */
    await this.page
      .waitForFunction(
        () => {
          const btn = document.getElementById("readMyKadButton") as HTMLButtonElement | null;
          const reading = document.getElementById("mykadReadingContainer");
          const btnReady = !!btn && !btn.disabled && !btn.classList.contains("d-none");
          const isReading = !!reading && !reading.classList.contains("d-none");
          return btnReady || isReading;
        },
        undefined,
        { timeout: 45_000 },
      )
      .catch(() => {
        /* fall through — the checks below produce a better message */
      });

    if (await scan.isEnabled().catch(() => false) && (await scan.isVisible().catch(() => false))) {
      await scan.click();
    }
    // Either way, the card goes in only once the page is actually READING.
    // Inserting earlier is wiped: the page sends INIT when its socket opens,
    // and INIT clears the channel's card state, so the READCARD that follows
    // finds nothing and parks for ever.
    await this.waitUntilReading();
    await mykad.insertCard(card);

    // "Next" carries `d-none` until verification passes — its visibility IS the
    // pass/fail signal, so waiting on it is the assertion.
    const next = this.page.locator("#continueButton");
    try {
      await next.waitFor({ state: "visible", timeout: 20_000 });
      return;
    } catch {
      // The page may have timed out waiting for a card and only now offered
      // "Scan IC". Take that path and insert again.
    }
    await scan.waitFor({ state: "visible", timeout: 20_000 });
    await scan.click();
    await this.waitUntilReading();
    await mykad.insertCard(card);
    await next.waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * Wait until the card panel is in its reading state.
   *
   * `#mykadReadingContainer` loses `d-none` once the page has issued READCARD,
   * which is the precondition for inserting a card. Best-effort with a short
   * timeout: the checks that follow produce a better message than this would,
   * and the seller screen can reach the reading state before this is reached.
   */
  private async waitUntilReading(timeout = 10_000): Promise<void> {
    await this.page
      .locator("#mykadReadingContainer:not(.d-none)")
      .waitFor({ state: "visible", timeout })
      .catch(() => undefined);
  }

  /** What the page says it read off the card. */
  async identityFromCard(): Promise<{ name: string; nric: string }> {
    return {
      name: await this.page.inputValue("#mykadGmpcName"),
      nric: await this.page.inputValue("#myKadNo"),
    };
  }

  /** Click the wizard's "Next" and wait for the page to settle. */
  protected async clickContinue(): Promise<void> {
    await this.page.locator("#continueButton").click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  /** Read a labelled value out of the rendered page. */
  protected async labelled(label: string): Promise<string> {
    const body = await this.page.locator("body").innerText();
    const i = body.indexOf(label);
    if (i === -1) return "";
    return body
      .slice(i + label.length)
      .split(NEWLINE)
      .map((x) => x.trim())
      .filter(Boolean)[0] ?? "";
  }
}
