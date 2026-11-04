import type { Page } from "@playwright/test";
import * as path from "node:path";
import { step } from "@fixtures/step";
import {
  settleObs,
  submitUntilConfirmed,
  saveDraft,
  choosePaymentTile,
  visibleFormStep,
  type FormStep,
  type PaymentMethod,
} from "./obs-page";

/**
 * The dealer's half AFTER approval — steps 4 and 5 of the same Application
 * form, on the same signed link.
 *
 *   `1 Business Information · 2 Upload Files · 3 Acknowledgement ·
 *    4 Registration Documents · 5 Payment`
 *
 * ── The link lands on the right step by itself ─────────────────────────────
 * Observed 2026-09-23: on an Approved application the link opens with `#step4`
 * visible; once BackOffice has verified the documents it opens on `#step5`.
 * Steps 1–3 are still in the DOM, hidden — including their 15 file inputs — so
 * "any file input" is not a safe way to find this step's uploads — they are
 * found under `#step4` by their Browse buttons (see `documentSections`).
 *
 * There is no page-level `showStep()` on this build, so nothing here tries to
 * force a step; if the wanted step is not the one showing, that is a state
 * the record is in, and it is reported rather than worked around.
 */

/**
 * Step 4's sections DEPEND ON THE BUSINESS TYPE, so they are read off the page
 * rather than listed. Observed 2026-09-23 — six either way, two differing:
 *
 *   | # | SSM company                   | Business Trading          |
 *   |---|-------------------------------|---------------------------|
 *   | 3 | RHB BoD Reso e-TukarMilik     | RHB LoA e-TukarMilik      |
 *   | 5 | eAuto BoD Reso e-TukarMilik   | eAuto LoA e-TukarMilik    |
 *
 * (A board resolution is a company's instrument; a sole trader signs a letter
 * of authority.) A fixed list of the company ids stopped a Business Trading
 * build at section 3, on an input that does not exist for that type.
 */
/** What the page prints per section: "Up to 2 files allowed: pdf, png, jpg, jpeg. Max Size: 10MB". */
export const REGISTRATION_DOCUMENT_LIMIT = { files: 2, maxMb: 10 } as const;

export type { FormStep };

export interface RegistrationFee {
  device: number;
  registration: number;
  sstRate: number;
  sst: number;
  total: number;
  declaredTotal: number;
}

export interface PaymentResult {
  /** "PAID" once settled. */
  status: string;
  paymentId: string;
  method: string;
  paidAt: string;
  /** Where the page says the invoice will be emailed. */
  invoiceTo: string;
  hasInvoice: boolean;
}

export class RegistrationPage {
  constructor(private readonly page: Page) {}

  @step("Open the Application link")
  async open(link: string): Promise<FormStep | 0> {
    await this.page.goto(link, { waitUntil: "commit" });
    await settleObs(this.page);
    await this.page.waitForTimeout(1_500);
    return this.currentStep();
  }

  /** See `visibleFormStep`. */
  async currentStep(): Promise<FormStep | 0> {
    return visibleFormStep(this.page);
  }

  private async requireStep(want: FormStep, what: string): Promise<void> {
    const now = await this.currentStep();
    if (now !== want) {
      throw new Error(
        `${what} is step ${want}, but the link opened on step ${now || "(none)"}. ` +
          "The record is not in the state this phase needs — read it in BackOffice first.",
      );
    }
  }

  // ── step 4 — Registration Documents ─────────────────────────────────────────

  /**
   * Files the SERVER holds for one section.
   *
   * Each upload POSTs at once to `/obs/f/upload/link/<uuid>/registration-document/upload`,
   * the input is CLEARED, and a row carrying the server's file uuid appears
   * under `#uploaded-<section>`. So `input.files` is always empty afterwards
   * and proves nothing; the uuid rows are the evidence. Observed 2026-09-23.
   */
  async attachments(inputId: string): Promise<number> {
    const section = inputId.replace(/^upload-/, "").replace(/-input$/, "");
    return this.page
      .locator(`#uploaded-${section} input[id^="${section}-file-uuid-"]`)
      .evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).value).length)
      .catch(() => 0);
  }

  /**
   * The document sections THIS record's step 4 asks for, in page order.
   *
   * Each section is a hidden `upload-<key>-input` beside a visible Browse
   * button `upload-<key>`, under a bold title. Only sections whose button is
   * showing count — the markup for the other business type is not rendered.
   */
  async documentSections(): Promise<{ key: string; inputId: string; title: string }[]> {
    return this.page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLInputElement>('#step4 input[type=file][id^="upload-"][id$="-input"]'))
        .map((input) => {
          const key = input.id.replace(/^upload-/, "").replace(/-input$/, "");
          const button = document.getElementById(`upload-${key}`) as HTMLElement | null;
          const title = (input.closest(".flex-container")?.querySelector(".label")?.textContent ?? key).trim();
          return { key, inputId: input.id, title, shown: !!button && button.offsetParent !== null };
        })
        .filter((s) => s.shown)
        .map(({ key, inputId, title }) => ({ key, inputId, title })),
    );
  }

  /**
   * Make sure every section this record asks for holds a file, uploading only
   * where one is missing.
   *
   * Attachments PERSIST between visits and a section takes at most two, so a
   * resumed build that re-uploaded everywhere would fill sections up and then
   * be refused. A section that already holds a file is left alone.
   */
  @step("Upload the registration documents")
  async uploadDocuments(file: string): Promise<{ section: string; attachments: number; uploadedNow: boolean }[]> {
    await this.requireStep(4, "Registration Documents");
    const sections = await this.documentSections();
    if (!sections.length) throw new Error("Step 4 is showing but offers no document sections.");
    const out: { section: string; attachments: number; uploadedNow: boolean }[] = [];
    for (const { title, inputId } of sections) {
      let count = await this.attachments(inputId);
      const uploadedNow = count === 0;
      if (uploadedNow) {
        await this.page.locator(`#${inputId}`).setInputFiles(path.resolve(file));
        for (let i = 0; i < 30 && count === 0; i++) {
          await this.page.waitForTimeout(500);
          count = await this.attachments(inputId);
        }
        if (count === 0) throw new Error(`"${title}" never showed an uploaded file — the upload POST did not come back.`);
      }
      out.push({ section: title, attachments: count, uploadedNow });
    }
    return out;
  }

  /**
   * Upload a file into the FIRST `count` sections that hold none yet, and leave the rest empty (EAINT-11868 REA_TS15:
   * "upload two of the Registration Documents sections, Save & Continue Later"). Returns the sections touched.
   */
  @step("Upload some of the registration documents")
  async uploadSome(file: string, count: number): Promise<string[]> {
    await this.requireStep(4, "Registration Documents");
    const done: string[] = [];
    for (const { title, inputId } of await this.documentSections()) {
      if (done.length >= count) break;
      if ((await this.attachments(inputId)) > 0) continue;
      await this.page.locator(`#${inputId}`).setInputFiles(path.resolve(file));
      let n = 0;
      for (let i = 0; i < 30 && n === 0; i++) {
        await this.page.waitForTimeout(500);
        n = await this.attachments(inputId);
      }
      if (n === 0) throw new Error(`"${title}" never showed an uploaded file — the upload POST did not come back.`);
      done.push(title);
    }
    return done;
  }

  /** Per section on step 4: its title and how many files the SERVER holds for it (see `attachments`). Read only. */
  async sectionCounts(): Promise<{ section: string; attachments: number }[]> {
    const out: { section: string; attachments: number }[] = [];
    for (const { title, inputId } of await this.documentSections()) out.push({ section: title, attachments: await this.attachments(inputId) });
    return out;
  }

  /** "Save & Continue Later" on step 4 — see `saveDraft` (obs-page). */
  @step("Save & Continue Later (Registration Documents)")
  async saveForLater(): Promise<string[]> {
    return saveDraft(this.page);
  }

  /** Submit step 4. The acknowledgement above the button is static text, not a checkbox. */
  @step("Submit the registration documents")
  async submitDocuments(): Promise<string> {
    await this.requireStep(4, "Registration Documents");
    return submitUntilConfirmed(this.page, "to-submit");
  }

  // ── step 5 — Payment ────────────────────────────────────────────────────────

  /**
   * The Payment Summary, read and CHECKED against itself.
   *
   * No amount is hardcoded: the fee is per ENVIRONMENT. Staging charges
   * RM 1500.00 (device RM 850.00 + fee RM 601.85 + SST 8% RM 48.15, confirmed
   * 2026-09-23), where the team's late-August notes had RM 990.00. A fixed
   * number would fail on a price difference and pass on a broken sum. What
   * must hold whatever the price is:
   *   - device + fee + SST = the total
   *   - SST = the stated rate of the fee, to the sen
   *   - the declaration quotes the same total
   */
  @step("Read and check the registration fee")
  async feeSummary(): Promise<RegistrationFee> {
    await this.requireStep(5, "Payment");
    const text = (await this.page.locator("#step5").innerText()).replace(/\u00a0/g, " ");
    const money = (re: RegExp) => {
      const m = re.exec(text);
      return m ? Number(m[1].replace(/,/g, "")) : NaN;
    };
    const fee: RegistrationFee = {
      device: money(/Dermalog[^:\n]*:\s*RM\s*([\d,.]+)/i),
      registration: money(/Registration fee[^:\n]*:\s*RM\s*([\d,.]+)/i),
      sstRate: money(/Service Tax\s*([\d.]+)%\s*:/i),
      sst: money(/Service Tax\s*[\d.]+%\s*:\s*RM\s*([\d,.]+)/i),
      total: money(/Total Amount[^:\n]*:\s*RM\s*([\d,.]+)/i),
      declaredTotal: money(/total payment of RM\s*([\d,.]+)/i),
    };
    const unread = Object.entries(fee)
      .filter(([, v]) => Number.isNaN(v))
      .map(([k]) => k);
    if (unread.length) throw new Error(`Could not read ${unread.join(", ")} off the Payment Summary.`);

    const sen = (n: number) => Math.round(n * 100);
    const problems: string[] = [];
    if (sen(fee.device + fee.registration + fee.sst) !== sen(fee.total)) {
      problems.push(`device ${fee.device} + fee ${fee.registration} + SST ${fee.sst} != total ${fee.total}`);
    }
    if (sen((fee.registration * fee.sstRate) / 100) !== sen(fee.sst)) {
      problems.push(`SST ${fee.sst} is not ${fee.sstRate}% of ${fee.registration}`);
    }
    if (sen(fee.declaredTotal) !== sen(fee.total)) {
      problems.push(`the declaration says RM ${fee.declaredTotal}, the summary RM ${fee.total}`);
    }
    if (problems.length) throw new Error(`The Payment Summary does not add up: ${problems.join("; ")}`);
    return fee;
  }

  /** Step 5 shows the tiles straight away — no declaration checkbox, unlike the Pre-Application. */
  @step("Choose how to pay the registration fee")
  async choosePayment(method: PaymentMethod = "Online Banking (Personal)"): Promise<string> {
    await this.requireStep(5, "Payment");
    return choosePaymentTile(this.page, method);
  }

  /**
   * Press "Submit & Pay" — `#to-submit-and-pay`. Note the ampersand: the
   * Pre-Application's button says "Submit and Pay", and a locator written for
   * one misses the other.
   */
  @step("Submit & Pay the registration fee")
  async submitAndPay(): Promise<void> {
    await this.page.locator("#to-submit-and-pay").click({ timeout: 20_000 });
  }

  /**
   * The receipt the link shows once the fee is paid — or null when it is not
   * showing.
   *
   * Observed 2026-09-23 after a sandbox payment: the form is REPLACED by
   * "Application Payment Success" (no `#stepN` visible at all) with
   *
   *   Payment ID: A260923000201 · Payment Method: FPX Online Banking (Maybank)
   *   Payment Date Time: 23-09-2026 04:22pm · Payment Status: PAID
   *   Payment Document: [Invoice]
   *
   * and a line saying the invoice will be emailed to the Admin In Charge.
   * Every later visit to the link shows the same page, which is how a resumed
   * build knows not to pay twice.
   */
  async receipt(): Promise<PaymentResult | null> {
    const text = (await this.page.locator("body").innerText().catch(() => "")).replace(/\u00a0/g, " ");
    if (!/Application Payment Success/i.test(text)) return null;
    const grab = (label: string) => (new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i").exec(text)?.[1] ?? "").trim();
    return {
      status: grab("Payment Status"),
      paymentId: grab("Payment ID"),
      method: grab("Payment Method"),
      paidAt: grab("Payment Date Time"),
      invoiceTo: /emailed to\s+(\S+?@\S+?)\.?(?:\s|$)/i.exec(text)?.[1] ?? "",
      hasInvoice: await this.page.getByRole("button", { name: /^invoice$/i }).isVisible().catch(() => false),
    };
  }

  /** Wait for the gateway to hand back, then read the receipt. Throws if it never shows. */
  async paymentResult(timeout = 180_000): Promise<PaymentResult> {
    await this.page
      .getByText(/Application Payment Success/i)
      .first()
      .waitFor({ state: "visible", timeout })
      .catch(() => undefined);
    const result = await this.receipt();
    if (!result) throw new Error(`No payment receipt after ${Math.round(timeout / 1000)}s — the gateway did not hand back.`);
    return result;
  }
}
