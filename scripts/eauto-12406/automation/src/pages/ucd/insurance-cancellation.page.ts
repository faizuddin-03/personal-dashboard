import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Insurance Cancellation (EAINT-12022) — the add-on on STMS Step 5.
 *
 * Not a page of its own: it lives inside the STMS payment step (`payment.do`),
 * so reach it with `runStmsFlow(page, { stopAfter: "payment" })` or, better,
 * `runInsuranceCancellationFlow` which does that and drives this object.
 *
 * Three parts, in the order a seller meets them:
 *
 *  1. **Add-on** — the "Insurance Cancellation" box under Add-on Services:
 *     insurer, balance %, tooltip, the checkbox (`#icCheck`) and, once the
 *     add-on is selected, the Reconfirm link.
 *  2. **Details pop-up** (`#icModalForm`) — opened by ticking the checkbox.
 *     Seller's Name (locked), bank, account no., Copy of IC, Bank Statement,
 *     declaration. [Next] runs the AI check.
 *  3. **Document preview** (`#icModalDoc`) — opened when the AI check passes.
 *     The insurer documents, the signature pad (`#icSigPad`), [Clear],
 *     [Proceed] and [Close].
 *
 * Selectors were taken from the live /preprod1 screens during the 06.10 batch 1
 * run and the 07.10 happy flow (Allianz, ON306923). Ticking, [Next] and [Close]
 * each start a server round trip behind a `.blockUI` overlay, so every action
 * here waits for that overlay to go before returning.
 *
 * Messages in the pop-up are ONE shared line (`#icFormError` / `#icDocError`),
 * not one per field — a check "under the field" can only read that line.
 */

/** What the seller types into the details pop-up. Only the keys given are touched. */
export interface IcDetails {
  /** Bank Name label as listed, e.g. "RHB BANK". "" picks "Select Bank" again. */
  bank?: string;
  /** Typed key by key, so the field's own filters (digits only, max 30) apply. "" empties it. */
  accountNo?: string;
  /** Absolute path of the Copy of IC file. */
  copyOfIc?: string;
  /** Absolute path of the Bank Statement file. */
  bankStatement?: string;
  /** The declaration checkbox. */
  declare?: boolean;
}

/** What the pop-up currently holds, as a person would read it. */
export interface IcSavedDetails {
  bank: string;
  accountNo: string;
  copyOfIc: string;
  bankStatement: string;
  declared: boolean;
}

export class InsuranceCancellationPage extends BasePage {
  // ---- add-on (Step 5)
  readonly checkbox: Locator;
  readonly addOnBody: Locator;
  /** The whole Add-on Services area around the IC box, for screenshots of every text. */
  readonly addOnArea: Locator;
  readonly insurer: Locator;
  readonly balance: Locator;
  readonly description: Locator;
  readonly infoIcon: Locator;
  readonly infoTip: Locator;
  readonly reconfirmLink: Locator;

  // ---- details pop-up
  readonly form: Locator;
  /** The pop-up box itself; highlighting `form` tints the whole page. */
  readonly formBox: Locator;
  readonly sellerName: Locator;
  readonly bankName: Locator;
  readonly accountNo: Locator;
  readonly copyOfIcInput: Locator;
  readonly bankStatementInput: Locator;
  readonly copyOfIcName: Locator;
  readonly bankStatementName: Locator;
  readonly declaration: Locator;
  readonly formErrorLine: Locator;

  // ---- document preview
  readonly preview: Locator;
  readonly previewBox: Locator;
  readonly signaturePad: Locator;
  readonly previewErrorLine: Locator;

  // ---- Step 5 payment summary
  readonly summaryTable: Locator;

  constructor(page: Page) {
    super(page);
    this.checkbox = page.locator("#icCheck");
    this.addOnBody = page.locator(".ic-addon-body");
    this.addOnArea = this.addOnBody.locator("xpath=ancestor::div[contains(., 'Add-on Services')][1]").first();
    this.insurer = page.locator(".ic-addon-insurer");
    this.balance = page.locator(".ic-addon-balance");
    // Two .ic-addon-desc exist on Step 5 since the one-section add-on layout (08.10.2026): take the one inside the IC block.
    this.description = this.addOnBody.locator(".ic-addon-desc").first();
    this.infoIcon = page.locator("#icInfoIcon");
    this.infoTip = page.locator("#icInfoTip");
    this.reconfirmLink = page.locator("#icReconfirmLink");

    this.form = page.locator("#icModalForm");
    this.formBox = page.locator("#icModalForm .ic-modal");
    this.sellerName = page.locator("#icSellerName");
    this.bankName = page.locator("#icBankName");
    this.accountNo = page.locator("#icBankAccNo");
    this.copyOfIcInput = page.locator("#icFileCopy");
    this.bankStatementInput = page.locator("#icFileBankStatement");
    this.copyOfIcName = page.locator("#icFileCopyName");
    this.bankStatementName = page.locator("#icFileBankStatementName");
    this.declaration = page.locator("#icFormConfirm");
    this.formErrorLine = page.locator("#icFormError");

    this.preview = page.locator("#icModalDoc");
    this.previewBox = page.locator("#icModalDoc .ic-modal");
    this.signaturePad = page.locator("#icSigPad");
    this.previewErrorLine = page.locator("#icDocError");

    this.summaryTable = page.locator("table").filter({ hasText: "Total Amount Payable" }).last();
  }

  /** Wait out the `.blockUI` overlay a server round trip puts up (max ~60 s). */
  async waitIdle(): Promise<void> {
    for (let i = 0; i < 60; i++) {
      await this.page.waitForTimeout(1000);
      if (!(await this.page.locator(".blockUI").count())) break;
    }
  }

  // ------------------------------------------------------------------ add-on

  /** True when Step 5 offers the add-on at all (eligible vehicle). */
  async isOffered(): Promise<boolean> {
    return this.checkbox.isVisible().catch(() => false);
  }

  async isTicked(): Promise<boolean> {
    return this.checkbox.isChecked();
  }

  /**
   * Click the add-on checkbox. Unticked → ticked opens the details pop-up (or,
   * once documents were previewed, the preview again); ticked → unticked drops
   * the add-on and its fee.
   */
  async toggle(): Promise<void> {
    await (await this.requireVisible(this.checkbox, "Insurance Cancellation checkbox")).click();
    await this.waitIdle();
    await this.page.waitForTimeout(1500);
  }

  async insurerName(): Promise<string> {
    return clean(await this.insurer.innerText());
  }

  /** "This vehicle has a balance of 71%* for Insurance Cancellation." (tick mark stripped). */
  async balanceText(): Promise<string> {
    return clean(await this.balance.innerText()).replace(/^✓\s*/, "");
  }

  /** The "* Insurance balance percentage may differ …" line at the bottom of the box. */
  async footnote(): Promise<string> {
    const texts = await this.page.locator(".ic-addon-desc").allInnerTexts(); // the footnote sits in the IC block's second desc line
    const lines = texts.join("\n").split("\n").map((x) => x.trim()).filter(Boolean);
    return clean(lines.find((l) => l.startsWith("*")) ?? lines.pop());
  }

  async openReconfirm(): Promise<void> {
    await (await this.requireVisible(this.reconfirmLink, "Reconfirm link")).click();
    await this.page.waitForTimeout(1500);
  }

  // ------------------------------------------------------------------ details pop-up

  async isFormOpen(): Promise<boolean> {
    return this.form.evaluate((e) => e.classList.contains("ic-show")).catch(() => false);
  }

  async fill(d: IcDetails): Promise<void> {
    if (d.bank !== undefined) await this.bankName.selectOption(d.bank ? { label: d.bank } : { index: 0 });
    if (d.accountNo !== undefined) {
      await this.accountNo.fill("");
      if (d.accountNo) await this.accountNo.pressSequentially(d.accountNo);
    }
    if (d.copyOfIc) await this.copyOfIcInput.setInputFiles(d.copyOfIc);
    if (d.bankStatement) await this.bankStatementInput.setInputFiles(d.bankStatement);
    if (d.declare !== undefined) await this.declaration.setChecked(d.declare);
  }

  /** Empty both file fields. */
  async clearFiles(): Promise<void> {
    await this.copyOfIcInput.setInputFiles([]);
    await this.bankStatementInput.setInputFiles([]);
  }

  /** Empty every field, so a check can set exactly the ones it needs. */
  async reset(): Promise<void> {
    await this.fill({ bank: "", accountNo: "", declare: false });
    await this.clearFiles();
  }

  /** [Next]: validates, then (all valid) uploads and runs the AI check. */
  async next(): Promise<void> {
    await this.form.getByText("Next", { exact: true }).click();
    await this.page.waitForTimeout(800);
    await this.waitIdle();
  }

  async cancel(): Promise<void> {
    await this.form.getByText("Cancel", { exact: true }).click();
    await this.page.waitForTimeout(800);
  }

  /** The × in the pop-up's corner. */
  async closeForm(): Promise<void> {
    await this.form.locator(".ic-x").first().click();
    await this.page.waitForTimeout(800);
  }

  /** The pop-up's shared message line, "" when none is shown (kept for the build before 08.10.2026). */
  async formError(): Promise<string> {
    return (await this.formErrorLine.isVisible()) ? clean(await this.formErrorLine.innerText()) : "";
  }

  /**
   * Every validation message currently shown in the pop-up: the per-field
   * messages (`.ic-fielderr`, under each field since the EAINT-12440 fix) and
   * the shared line, joined with " / ". "" when none.
   */
  async fieldErrors(): Promise<string> {
    const out: string[] = [];
    for (const e of await this.form.locator(".ic-fielderr, .ic-error").all()) {
      if (await e.isVisible().catch(() => false)) { const t = clean(await e.innerText()); if (t) out.push(t); }
    }
    return out.join(" / ");
  }

  /** The message shown under one field (by its input locator), "" when none. */
  async fieldError(input: Locator): Promise<string> {
    const holder = input.locator("xpath=ancestor::*[contains(@class,'ic-frow') or contains(@class,'ic-filerow') or contains(@class,'ic-declare')][1]");
    const e = holder.locator(".ic-fielderr, .ic-error").first();
    return (await e.isVisible().catch(() => false)) ? clean(await e.innerText()) : "";
  }

  async savedDetails(): Promise<IcSavedDetails> {
    return {
      bank: await this.bankName.inputValue(),
      accountNo: await this.accountNo.inputValue(),
      copyOfIc: clean(await this.copyOfIcName.innerText()),
      bankStatement: clean(await this.bankStatementName.innerText()),
      declared: await this.declaration.isChecked(),
    };
  }

  // ------------------------------------------------------------------ document preview

  async isPreviewOpen(): Promise<boolean> {
    return this.preview.evaluate((e) => e.classList.contains("ic-show")).catch(() => false);
  }

  /** The preview's message line, "" when none is shown. */
  async previewError(): Promise<string> {
    return (await this.previewErrorLine.isVisible()) ? clean(await this.previewErrorLine.innerText()) : "";
  }

  /** Pages rendered in the preview frame. */
  async previewPageCount(): Promise<number> {
    return this.page.frameLocator("#icDocFrame").locator("canvas").count().catch(() => 0);
  }

  /** The preview's VISIBLE button captions, e.g. "Close / Proceed" ([Proceed] is in the DOM but hidden until signed). */
  async previewButtons(): Promise<string> {
    const els = await this.preview.locator("button, .ic-btn, [class*=btn]").all();
    const out: string[] = [];
    for (const e of els) if (await e.isVisible().catch(() => false)) out.push(clean(await e.innerText()));
    return out.filter(Boolean).join(" / ");
  }

  /** Draw a signature stroke on the pad; checks it inked (retries once - the pad can swallow the first stroke while the preview loads). */
  async sign(): Promise<void> {
    const pad = await this.requireVisible(this.signaturePad, "signature pad");
    // The pad is reset while the preview PDF renders: wait for the document pages first.
    for (let i = 0; i < 20 && (await this.previewPageCount()) === 0; i++) await this.page.waitForTimeout(1000);
    await this.page.waitForTimeout(2000);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.waitForTimeout(800);
      const b = await pad.boundingBox();
      if (!b) throw new Error("Signature pad has no size on screen.");
      await this.page.mouse.move(b.x + 30, b.y + b.height * 0.6);
      await this.page.mouse.down();
      for (let i = 0; i <= 20; i++) {
        await this.page.mouse.move(b.x + 30 + i * 12, b.y + b.height * (0.6 - 0.3 * Math.sin(i / 3)), { steps: 3 });
        await this.page.waitForTimeout(20);
      }
      await this.page.mouse.up();
      await this.page.waitForTimeout(1200);
      if ((await this.inkedPixels()) > 50) return;
    }
    throw new Error("Signature did not draw on #icSigPad (pad still empty after three strokes).");
  }

  /** Painted pixels on the pad (0 = empty). */
  async inkedPixels(): Promise<number> {
    return this.signaturePad.evaluate((c) => {
      const cv = c as HTMLCanvasElement;
      const ctx = cv.getContext("2d");
      if (!ctx) return -1;
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
      return n;
    }).catch(() => -1);
  }

  async clearSignature(): Promise<void> {
    await this.preview.getByText("Clear", { exact: true }).click();
    await this.page.waitForTimeout(300);
  }

  async hasProceed(): Promise<boolean> {
    return this.preview.getByText("Proceed", { exact: true }).isVisible().catch(() => false);
  }

  /** [Proceed]: save the signature, close the preview, select the add-on. */
  async proceed(): Promise<void> {
    await (await this.requireVisible(this.preview.getByText("Proceed", { exact: true }), "[Proceed] in the preview")).click();
    await this.page.waitForTimeout(1000);
    await this.waitIdle();
    await this.waitPreviewClosed();
  }

  /** The preview overlay keeps `.ic-show` while saving; wait until it is gone (max 30 s). */
  async waitPreviewClosed(): Promise<void> {
    for (let i = 0; i < 30 && (await this.isPreviewOpen()); i++) await this.page.waitForTimeout(1000);
    await this.page.waitForTimeout(500);
  }

  /** The [Close] button. Before [Proceed] existed, this is what saved the signature. */
  async closePreview(): Promise<void> {
    await this.preview.getByText("Close", { exact: true }).click();
    await this.page.waitForTimeout(800);
    await this.waitIdle();
    await this.waitPreviewClosed();
  }

  /** The × in the preview's corner (leave without saving). */
  async dismissPreview(): Promise<void> {
    await this.preview.locator(".ic-x").first().click().catch(() => undefined);
    await this.page.waitForTimeout(800);
  }

  /**
   * Accept the signature the way the build on screen allows: [Proceed] when the
   * preview has it (SIGN_TS16), otherwise [Close]. Returns which one was used,
   * so a caller asserting on [Proceed] can tell.
   */
  async confirmSignature(): Promise<"proceed" | "close"> {
    if (await this.hasProceed()) {
      await this.proceed();
      return "proceed";
    }
    await this.closePreview();
    return "close";
  }

  // ------------------------------------------------------------------ payment summary

  /** Step 5 Payment Summary as { label: amount }, e.g. { "Total Amount Payable …": "78.04" }. */
  async paymentSummary(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const out: Record<string, string> = {};
      const h = Array.from(document.querySelectorAll("*")).find((e) => e.childElementCount === 0 && /^Payment Summary$/.test((e as HTMLElement).innerText?.trim()));
      const tb = h ? (h.closest("div")?.parentElement?.querySelector("table") ?? h.parentElement?.querySelector("table")) : null;
      const rows = tb ? Array.from(tb.querySelectorAll("tr")).filter((r) => (r as HTMLElement).offsetParent !== null) : [];
      for (const r of rows) {
        const c = Array.from(r.querySelectorAll("td")).map((x) => (x as HTMLElement).innerText.replace(/\s+/g, " ").trim());
        if (c.length >= 2) out[c[0].replace(/\s*:\s*$/, "")] = c[c.length - 1];
      }
      return out;
    });
  }

  /** The summary as one line: "JPJ STMS Fee RM10.00 · … · Total Amount Payable (…) RM78.04". */
  async paymentSummaryText(): Promise<string> {
    return summaryLine(await this.paymentSummary());
  }
}

/** Collapse whitespace (incl. zero-width) and trim. */
export const clean = (s: string | null | undefined) => String(s ?? "").replace(/[\s ​]+/g, " ").trim();

export const summaryLine = (s: Record<string, string>) =>
  Object.entries(s)
    .map(([k, v]) => `${k} RM${v}`)
    .join(" · ");
