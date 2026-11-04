import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * LKM Refund — the add-on on STMS Step 5, and the UCD LKM Refund Status page.
 *
 * Like Insurance Cancellation, the add-on is not a page of its own: it lives
 * on the STMS payment step (`payment.do`). Reach it with
 * `runLkmRefundFlow` (or `runStmsFlow(page, { stopAfter: "payment" })`).
 *
 * PROVENANCE. Selectors and quirks are ported from a colleague's EAINT-104
 * automation (handover "EAINT-104-handover - FINAL", 2026-10): `run-e2e.mjs`
 * and `tests/20-lkm-evidence.spec.ts`, which drove this journey to payment on
 * /preprod1. They have NOT yet been re-seen from this repo; see the flows
 * registry (UNVERIFIED) before a CR spec relies on them.
 *
 * What she found, kept here so nobody re-learns it:
 *  - The add-on checkbox exists only when JPJ returns a refund balance
 *    (`stms-enquiry-resp` refundAmount; otherwise `tr#lkm-refund-fee-section`
 *    is hidden). Phase 1 also needs the dealer in KL / Selangor, the
 *    individual seller category, and the LKM Refund permission on the account
 *    ("Your account don't have LKM Refund permission.").
 *  - Tick it with a real click: `.check()` sets the property without firing
 *    the page's handler.
 *  - The pop-up is a jQuery UI `.ui-dialog` appended to <body>. Her code took
 *    `.ui-dialog` `.first()`, which picks up a leftover Transfer History dialog;
 *    here it is the dialog that HOLDS the refund form.
 *  - [Next] uploads to S3, then eAuto calls /doc/lkm-refund/validate-document,
 *    which answers per file from eSim `lkm-refund-ocr-document-resp` (per
 *    vehicle prefix). Copy of IC passes when the record's IC Full Name equals
 *    the Seller's Name shown here (the MyKad short name). Bank Statement: OPEN
 *    (07.10.2026) — refused with every bank value identical. Files of ~1 KB
 *    fail outright (HTTP 500 EG0001, "Upload failed."); use ~20 KB+.
 *  - The preview is PDF.js canvases in `#lkm-refund-preview-viewer` (one per
 *    page): the letter text is not in the DOM. eAuto shows the pad BEFORE the
 *    document arrives, greyed and locked, with "Loading document..."; it is
 *    painted (and signable) only when `#lkm-signature-wrapper` loses
 *    `lkm-signature-disabled`. On failure `#lkm-refund-preview-status` turns red
 *    (`lkm-preview-error`, "The document could not be displayed..."). `next()`
 *    waits for that (`waitPreviewRendered`); counting earlier read 0 pages on
 *    staging /uat1/ (22.10.2026, EAINT-12253 triage).
 *  - A signature drawn in one tick draws nothing; strokes need steps and a
 *    pause, and are checked by counting inked pixels.
 *  - Committed = the summary's "eAuto Processing Fee - LKM Refund" is no
 *    longer RM 0.00 (fee band by balance: RM1,000 → RM50.00).
 *  - On a transaction whose refund is already committed, the way back into
 *    the pop-up is "Reconfirm LKM Refund Details" (`#to-lkm-refund`).
 */

/** What the seller enters in the refund pop-up. Only the keys given are touched. */
export interface LkmRefundDetails {
  /**
   * PTJ state label, e.g. "SELANGOR"; "" takes the first state listed. Omit to
   * keep what eAuto prefilled (her runs: from the dealer address; AZFARAZO on
   * 07.10.2026: nothing prefilled, "Select State").
   */
  ptjState?: string;
  /** PTJ branch label. With `ptjState` and no branch, the first branch is taken. */
  ptjBranch?: string;
  /** Prefilled from the seller; editable. */
  accountHolder?: string;
  /** Bank Name label as listed, e.g. "MAYBANK". */
  bank?: string;
  /** Hyphens are allowed; eAuto strips them when saving. */
  accountNo?: string;
  /** Absolute path. Individual sellers only (the field is hidden for a company). */
  copyOfIc?: string;
  /** Absolute path. Company sellers only ("Cop Syarikat", png/jpeg, max 5 MB). */
  companyStamp?: string;
  /** Absolute path. */
  bankStatement?: string;
  /** The consent checkbox. */
  consent?: boolean;
}

export class LkmRefundPage extends BasePage {
  // ---- add-on (Step 5)
  readonly checkbox: Locator;
  readonly feeSection: Locator;
  /** "Reconfirm LKM Refund Details", once a refund is committed. */
  readonly reconfirm: Locator;

  // ---- pop-up (jQuery UI dialog holding the refund form)
  readonly dialog: Locator;
  readonly ptjState: Locator;
  readonly ptjBranch: Locator;
  readonly accountHolder: Locator;
  readonly bankName: Locator;
  readonly accountNo: Locator;
  readonly copyOfIc: Locator;
  readonly companyStamp: Locator;
  readonly bankStatement: Locator;
  readonly consent: Locator;
  /** The AI check's refusal banner. */
  readonly documentError: Locator;
  readonly signaturePad: Locator;
  /** The preview pages (one pdf.js canvas per page). */
  readonly previewViewer: Locator;
  /** "Loading document..." while painting; class `lkm-preview-error` on failure; hidden once painted. */
  readonly previewStatus: Locator;
  /** Holds the pad; class `lkm-signature-disabled` until every preview page is painted. */
  readonly signatureWrapper: Locator;

  // ---- Step 5 payment summary
  readonly summaryTable: Locator;

  constructor(page: Page) {
    super(page);
    this.checkbox = page.locator("#lkm-refund-addon-checkbox");
    this.feeSection = page.locator("tr#lkm-refund-fee-section");
    this.reconfirm = page.locator("#to-lkm-refund");

    this.dialog = page.locator(".ui-dialog").filter({ has: page.locator("#bankAccNo, #lkm-pad") }).last();
    this.ptjState = page.locator("#ptjStateCode");
    this.ptjBranch = page.locator("#ptjBranchCode");
    this.accountHolder = page.locator("#bankAccHolderName");
    this.bankName = page.locator("#bankName");
    this.accountNo = page.locator("#bankAccNo");
    this.copyOfIc = page.locator("#CopyOfIc");
    this.companyStamp = page.locator("#CompanyStamp");
    this.bankStatement = page.locator("#BankStatement");
    this.consent = page.locator("#toConsent");
    this.documentError = page.locator("#lkm-refund-doc-error");
    this.signaturePad = page.locator("#lkm-pad");
    this.previewViewer = page.locator("#lkm-refund-preview-viewer");
    this.previewStatus = page.locator("#lkm-refund-preview-status");
    this.signatureWrapper = page.locator("#lkm-signature-wrapper");

    this.summaryTable = page.locator("table").filter({ hasText: "Total Amount Payable" }).last();
  }

  /** Wait until no `.blockUI` overlay is showing (max `seconds`). */
  async waitIdle(seconds = 90): Promise<void> {
    for (let i = 0; i < seconds; i++) {
      const blocked = await this.page
        .locator(".blockUI")
        .evaluateAll((els) => els.some((e) => (e as HTMLElement).offsetParent !== null))
        .catch(() => false);
      if (!blocked) return;
      await this.page.waitForTimeout(1000);
    }
  }

  private dialogButton(name: RegExp): Locator {
    return this.dialog.locator("button.confirm-dialog-btn").filter({ hasText: name });
  }

  // ------------------------------------------------------------------ add-on

  /** True when Step 5 offers LKM Refund (refund balance, permission, Phase 1 rules all met). */
  async isOffered(): Promise<boolean> {
    return this.checkbox.isVisible().catch(() => false);
  }

  async isTicked(): Promise<boolean> {
    return this.checkbox.isChecked();
  }

  /** Click the add-on (a real click — `.check()` does not fire the handler). */
  async toggle(): Promise<void> {
    await (await this.requireVisible(this.checkbox, "LKM Refund checkbox")).click({ force: true });
    await this.page.waitForTimeout(1500);
    await this.waitIdle();
  }

  async openReconfirm(): Promise<void> {
    await (await this.requireVisible(this.reconfirm, "Reconfirm LKM Refund Details")).click();
    await this.page.waitForTimeout(1500);
    await this.waitIdle();
  }

  // ------------------------------------------------------------------ pop-up

  async isPopupOpen(): Promise<boolean> {
    return this.accountNo.isVisible().catch(() => false);
  }

  /** What eAuto prefilled for the PTJ (from the dealer's address). */
  async prefilledPtj(): Promise<{ state: string; branch: string }> {
    const label = (sel: Locator) => sel.locator("option:checked").innerText().then(clean).catch(() => "");
    return { state: await label(this.ptjState), branch: await label(this.ptjBranch) };
  }

  async fill(d: LkmRefundDetails): Promise<void> {
    if (d.ptjState !== undefined) {
      // "" = the first state on the list (what a test takes when it doesn't care which).
      await this.ptjState.selectOption(d.ptjState ? { label: d.ptjState } : { index: 1 });
      await this.page.waitForTimeout(1500); // branch list reloads by AJAX
      await this.ptjBranch.selectOption(d.ptjBranch ? { label: d.ptjBranch } : { index: 1 });
    } else if (d.ptjBranch) {
      await this.ptjBranch.selectOption({ label: d.ptjBranch });
    }
    if (d.accountHolder !== undefined) await this.accountHolder.fill(d.accountHolder);
    if (d.bank) await this.bankName.selectOption({ label: await this.bankLabel(d.bank) });
    if (d.accountNo !== undefined) await this.accountNo.fill(d.accountNo);
    if (d.copyOfIc) {
      if (!(await this.copyOfIc.count())) throw new Error("Copy of IC is not on this pop-up (company seller?).");
      await this.copyOfIc.setInputFiles(d.copyOfIc);
      await this.page.waitForTimeout(1000);
      await this.waitIdle();
    }
    if (d.companyStamp) {
      if (!(await this.companyStamp.count())) throw new Error("Cop Syarikat is not on this pop-up (individual seller?).");
      await this.companyStamp.setInputFiles(d.companyStamp);
      await this.waitIdle();
    }
    if (d.bankStatement) {
      await this.bankStatement.setInputFiles(d.bankStatement);
      await this.waitIdle();
    }
    if (d.consent !== undefined && (await this.consent.isChecked()) !== d.consent) await this.consent.click({ force: true });
  }

  /**
   * The Bank Name option for a bank as printed on a statement (22.10.2026, EAINT-12253): the option whose label equals
   * it, else contains it, else is contained in it (case, spacing and punctuation ignored). The statement says "BANK
   * ISLAM MALAYSIA BERHAD"; how the list words it is not recorded. No match = the name as given (selectOption then
   * fails and lists nothing chosen).
   */
  async bankLabel(bank: string): Promise<string> {
    const n = (x: string) => x.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
    const want = n(bank);
    await this.bankName.locator("option").nth(1).waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    const labels = (await this.bankName.locator("option").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return labels.find((l) => n(l) === want) ?? labels.find((l) => n(l).includes(want)) ?? labels.find((l) => n(l).length >= 4 && want.includes(n(l))) ?? bank;
  }

  /**
   * [Next]: validates, uploads, runs the document check, and on a pass shows
   * the preview with the signature pad. Returns "preview" only once every
   * preview page is painted and signing is unlocked (`waitPreviewRendered`,
   * which throws if the preview fails or never paints), or "refused" with the
   * message as soon as one shows (a field message or the check's banner).
   */
  async next(timeoutMs = 180_000): Promise<{ outcome: "preview" } | { outcome: "refused"; message: string }> {
    await this.dialogButton(/Next/).first().click();
    const until = Date.now() + timeoutMs;
    await this.page.waitForTimeout(1500);
    while (Date.now() < until) {
      if (await this.signaturePad.isVisible().catch(() => false)) {
        await this.waitIdle();
        await this.waitPreviewRendered();
        return { outcome: "preview" };
      }
      const busy = await this.page
        .locator(".blockUI")
        .evaluateAll((els) => els.some((e) => (e as HTMLElement).offsetParent !== null))
        .catch(() => false);
      const message = busy ? "" : await this.refusal();
      if (message) return { outcome: "refused", message };
      await this.page.waitForTimeout(1000);
    }
    return { outcome: "refused", message: (await this.refusal()) || `no preview after ${timeoutMs / 1000} s` };
  }

  /** The pop-up's error text: the AI banner, else any field message. */
  async refusal(): Promise<string> {
    if (await this.documentError.isVisible().catch(() => false)) return clean(await this.documentError.innerText());
    const t = clean(await this.dialog.innerText().catch(() => ""));
    return (t.match(/(This field is required\.?|This field is required|Please tick the checkbox[^.]*\.|Minimum length is \d+\.|[^.]*could not be validated[^.]*\.?|Document content did not match[^.]*\.?|Cop Syarikat image is not clear[^.]*\.?)/i) ?? [""])[0];
  }

  /** [Cancel] (or Close / Tutup) on the pop-up. */
  async cancel(): Promise<void> {
    await this.dialog.locator("button").filter({ hasText: /^(Cancel|Close|Tutup)$/ }).first().click();
    await this.page.waitForTimeout(800);
  }

  // ------------------------------------------------------------------ preview + signature

  async isPreviewOpen(): Promise<boolean> {
    return this.signaturePad.isVisible().catch(() => false);
  }

  /**
   * Wait until eAuto has painted every preview page (signing unlocked) and return the page count.
   * Throws with the status line if the preview turns red (`lkm-preview-error`) or is not painted in time.
   */
  async waitPreviewRendered(timeoutMs = 90_000): Promise<number> {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      const locked = await this.signatureWrapper.evaluate((e) => e.classList.contains("lkm-signature-disabled")).catch(() => true);
      if (!locked) return this.previewPageCount();
      if (await this.previewStatus.evaluate((e) => e.classList.contains("lkm-preview-error")).catch(() => false))
        throw new Error("LKM Refund preview failed: " + clean(await this.previewStatus.innerText().catch(() => "")));
      await this.page.waitForTimeout(1000);
    }
    throw new Error(
      "LKM Refund preview not painted after " + timeoutMs / 1000 + " s: " + clean(await this.previewStatus.innerText().catch(() => "")),
    );
  }

  /** Pages of the document preview (pdf.js canvases in the viewer). Read after `waitPreviewRendered`. */
  async previewPageCount(): Promise<number> {
    return this.previewViewer.locator("canvas").count();
  }

  /**
   * Draw a signature and check it inked. Strokes are spread over frames — a
   * stroke sent in one tick leaves the pad blank and [Confirm] disabled.
   * Returns the inked pixel count.
   */
  async sign(minInk = 200): Promise<number> {
    const pad = await this.requireVisible(this.signaturePad, "signature pad");
    // The pad can be reset while the preview finishes loading: draw, check the ink, retry up to 3 times.
    let ink = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.waitForTimeout(attempt === 1 ? 1500 : 2500);
      const b = await pad.boundingBox();
      if (!b) throw new Error("Signature pad has no size on screen.");
      await this.page.mouse.move(b.x + b.width * 0.15, b.y + b.height * 0.6);
      await this.page.mouse.down();
      for (let i = 1; i <= 14; i++) {
        await this.page.mouse.move(b.x + b.width * (0.15 + i * 0.05), b.y + b.height * (0.6 - 0.25 * Math.sin(i / 2)), { steps: 4 });
        await this.page.waitForTimeout(30);
      }
      await this.page.mouse.up();
      await this.page.waitForTimeout(800);
      ink = await this.inkedPixels();
      if (ink > minInk) return ink;
    }
    throw new Error(`Signature did not draw: ${ink} inked pixels on #lkm-pad after 3 strokes.`);
  }

  async inkedPixels(): Promise<number> {
    return this.signaturePad.evaluate((c) => {
      const cv = c as HTMLCanvasElement;
      const data = cv.getContext("2d")?.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      if (data) for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
      return n;
    });
  }

  /**
   * Accept the signed documents: [Proceed] in the "LKM Refund Document Preview"
   * dialog (07.10.2026 build; her older builds labelled it [Confirm]). Commits
   * the refund and closes the preview.
   */
  async confirm(): Promise<void> {
    await this.dialog.locator("button").filter({ hasText: /^\s*(Proceed|Confirm)\s*$/ }).last().click();
    await this.page.waitForTimeout(2000);
    await this.waitIdle();
  }

  // ------------------------------------------------------------------ payment summary

  /** The "eAuto Processing Fee - LKM Refund" amount, e.g. "50.00" ("" when not shown). */
  async processingFee(): Promise<string> {
    const t = clean(await this.summaryTable.innerText().catch(() => ""));
    return (t.match(/LKM Refund\s*:?\s*RM\s*([\d,]+\.\d{2})/) ?? [])[1] ?? "";
  }

  /** True once the fee is charged, i.e. the refund is committed. */
  async isCommitted(): Promise<boolean> {
    const fee = await this.processingFee();
    return fee !== "" && fee !== "0.00";
  }
}

export const LKM_REFUND_STATUS = "view/ucd/lkm-refund/enquiry/main.do";

/** One row of the UCD LKM Refund Status listing, keyed by column header. */
export type LkmRefundRow = Record<string, string>;

/**
 * UCD > LKM Refund Status. Empty until [Search] is pressed.
 *
 * Statuses read "In Progress", "Refund Done" or "Rejected"; refund numbers
 * look like RTR…. [Refresh Status] asks JPJ again — ONE press from UCD locks
 * that row for 5 hours, so a test gets one refresh per row.
 */
export class LkmRefundStatusPage extends BasePage {
  readonly vehicleNo: Locator;
  readonly search: Locator;

  constructor(page: Page) {
    super(page);
    this.vehicleNo = page.locator("#vehicleNo");
    this.search = page.locator("#to-search");
  }

  /** Open the page (relative to baseURL, which carries the instance, e.g. /preprod1) and search one vehicle. */
  async find(vehicleNo: string): Promise<LkmRefundRow | null> {
    await this.page.goto(LKM_REFUND_STATUS);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.vehicleNo.fill(vehicleNo);
    await this.search.click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.waitForTimeout(1500);
    return this.rowFor(vehicleNo);
  }

  async rowFor(vehicleNo: string): Promise<LkmRefundRow | null> {
    return this.page.evaluate((v) => {
      const n = (x: string) => x.replace(/\s+/g, " ").trim();
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const tr = Array.from(document.querySelectorAll("table tbody tr")).find((t) => own(t).length > 3 && n(t.textContent || "").includes(v));
      if (!tr) return null;
      const head = Array.from(tr.closest("table")!.querySelectorAll("tr")).find((h) => h.querySelectorAll(":scope > th").length > 3);
      const hs = head ? Array.from(head.querySelectorAll(":scope > th")).map((h) => n((h as HTMLElement).innerText)) : [];
      const out: Record<string, string> = {};
      own(tr).forEach((td, i) => (out[hs[i] || `col${i + 1}`] = n((td as HTMLElement).innerText)));
      return out;
    }, vehicleNo);
  }

  /** [Refresh Status] on a vehicle's row. Locks the row for 5 hours on UCD. */
  async refresh(vehicleNo: string): Promise<void> {
    await this.page.locator("table tbody tr", { hasText: vehicleNo }).locator("a.to-retry").first().click();
    await this.page.waitForTimeout(1500);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }
}

const clean = (s: string | null | undefined) => String(s ?? "").replace(/[\s ​]+/g, " ").trim();
