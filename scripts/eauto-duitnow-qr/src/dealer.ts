/**
 * The dealer's half of the journey — phases 2, 4, 8 and 10.
 *
 * All four run on ONE long-lived page that carries the passed reCAPTCHA gate.
 * BackOffice phases never touch it.
 */
import type { Page } from "@playwright/test";
import { OBS, FEE_PREAPP, FEE_REGISTRATION } from "./env";
import type { Identity } from "./identity";
import { ensureAsset, tradingLicencePdf } from "./assets";
import { pay, pickPaymentMethod, pickBank, type PayMethod } from "./payment";

/* ------------------------------------------------------- phase 2: preapp */

/**
 * Fill and submit the pre-application, then pay the RM 108.00 fee.
 *
 * Business type is Trading (Sabah/Sarawak) only. The three SSM types post the
 * BRN to /obs/preOnb/checkSSM.do — a LIVE lookup against real SSM data. No
 * generated BRN can pass it, and the form does not error: it silently switches
 * you to Business Trading (Sabah), so a run that "tested Sdn Bhd" did not.
 */
export async function submitPreApplication(page: Page, id: Identity, method: PayMethod): Promise<string> {
  await page.locator(`input[name="businessType"][value="${id.businessType}"]`).check();

  await page.locator("#businessName").fill(id.companyName);

  if (id.isSsm) {
    // Both BRN fields, then a beat for checkSSM.do to answer. It is a live
    // lookup against the real registry.
    await page.locator("#newBrn").fill(id.newBrn);
    await page.locator("#oldBrn").fill(id.oldBrn);
    await page.waitForTimeout(2_000);

    // The form does not error on a rejected BRN — it silently reselects
    // Business Trading (Sabah). Catch that here, or the run quietly tests a
    // type nobody asked for.
    const stillChosen = await page.locator(`input[name="businessType"][value="${id.businessType}"]`)
      .isChecked().catch(() => false);
    if (!stillChosen) {
      throw new Error(
        `checkSSM.do rejected BRN ${id.newBrn} / ${id.oldBrn} — the form switched business type away from ` +
        `${id.businessType}. That company is either not registered or already onboarded; pick another row in the Checker.`,
      );
    }
  } else {
    await page.locator("#businessLicenseNo").fill(id.businessLicenseNo);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /browse file/i }).first().click();
    await (await chooser).setFiles(tradingLicencePdf());
  }

  await page.locator("#tin").fill(id.tin);
  await page.locator("#showroomAddress").fill(id.showroomAddress);
  await page.locator("#showroomPostcode").fill(id.showroomPostcode);
  await page.locator("#adminName").fill(id.adminName);
  await page.locator("#mobileNo").fill(id.adminMobile);
  await page.locator("#adminEmail").fill(id.adminEmail);

  await page.locator("#nextSubmitBtn").click();

  // Business Info Review. The declaration is MANDATORY here — the button stays
  // disabled until it is ticked. (The registration-fee step has no equivalent.)
  await page.locator("#agreeTerms").check();

  await pickPaymentMethod(page, method);
  if (method === "fpx") await pickBank(page);

  // #nextSubmitBtn relabels itself to "Submit and Pay" on the review step.
  // Note: the registration fee's button is "Submit & Pay" — an ampersand. That
  // difference has already broken a locator.
  await page.locator("#nextSubmitBtn").click();

  await pay(page, method, FEE_PREAPP, "the pre-application fee");

  // The summary redirect is both the completion signal and the pre-app uuid.
  const uuid = (/\/preOnb\/summary\/([\w-]+)/i.exec(page.url()) || [])[1] || "";
  console.log(`[dealer] pre-application submitted and paid${uuid ? ` (uuid ${uuid})` : ""}`);
  return uuid;
}

/* ------------------------------------------------------ phase 4: appform */

/**
 * Which step the wizard is on. Do NOT count clicks.
 *
 * On step 3 the Next button is REPLACED by Submit, so `data-step` is absent;
 * reading that as step 1 sent an earlier walker back to filling Business
 * Information on the wrong page. And the very first version clicked Next six
 * times without checking — every click rejected by required-field validation
 * while the log reported progress.
 */
async function currentStep(page: Page): Promise<number> {
  const v = await page.locator("#to-next-step").getAttribute("data-step").catch(() => null);
  if (v) return Number(v) - 1; // data-step names the NEXT step
  const submit = await page.getByRole("button", { name: /^submit$/i }).first().isVisible().catch(() => false);
  return submit ? 3 : 1;
}

/** A click on a disabled control burns the full action timeout. Check first. */
async function controlState(page: Page, css: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (!el) return null;
    return { locked: Boolean(el.disabled || el.readOnly), checked: Boolean(el.checked), value: String(el.value || "") };
  }, css).catch(() => null);
}

async function clickUnlessLocked(page: Page, css: string): Promise<void> {
  const st = await controlState(page, css);
  if (!st || st.checked || st.locked) return;
  await page.locator(css).first().click({ timeout: 10_000 }).catch(() => {});
}

async function fillUnlessLocked(page: Page, css: string, value: string): Promise<void> {
  if (!value) return;
  const st = await controlState(page, css);
  if (!st || st.locked || st.value) return;
  await page.locator(css).first().fill(value).catch(() => {});
}

/** State/city options carry a bracketed code — "JOHOR (01)" — so match loosely. */
async function selectByName(page: Page, css: string, want: string, firstIfMissing = false): Promise<void> {
  const el = page.locator(css).first();
  if (!(await el.count())) return;
  const options = (await el.locator("option").allInnerTexts()).map(s => s.trim());
  const W = want.toUpperCase();
  const hit =
    options.find(o => o.toUpperCase() === W) ||
    options.find(o => o.toUpperCase().replace(/\s*\(\d+\)\s*$/, "") === W) ||
    options.find(o => o.toUpperCase().includes(W)) ||
    (firstIfMissing ? options.find(o => !/^select/i.test(o)) : undefined);
  if (hit) await el.selectOption({ label: hit }).catch(() => {});
}

async function fillBusinessInfo(page: Page, id: Identity): Promise<void> {
  await clickUnlessLocked(page, `#business-type-${id.businessType}`);
  await page.waitForTimeout(400);

  await fillUnlessLocked(page, "#companyName", id.companyName);
  await fillUnlessLocked(page, "#tinNo", id.tin);
  // EXACTLY 15 characters when filled. The TIN is 11, so reusing it here stalls
  // step 1 with a message that names neither field.
  await fillUnlessLocked(page, "#sstNo", id.sst);

  await clickUnlessLocked(page, "#showroom-type-OWN");
  await fillUnlessLocked(page, "#address1", id.showroomAddress);
  await fillUnlessLocked(page, "#postcode", id.showroomPostcode);

  await selectByName(page, "#stateSelect", id.state);
  await page.waitForTimeout(1_200); // the city list cascades off state
  await selectByName(page, "#citySelect", id.city, true);

  // "No" to all three keeps the form short — each Yes opens another required
  // block, and an association choice here creates upload rows in step 2.
  // Note the differing indices: the two radio groups do not share an ordering.
  for (const css of ["#hasAdvertisingPlatform1", "#hasAuctionHouse2", "#isNoAssociation1"]) {
    await clickUnlessLocked(page, css);
  }

  await fillUnlessLocked(page, "#numOfDirector", "1");
  await fillUnlessLocked(page, "#directorNameInput", id.directorName);
  await fillUnlessLocked(page, "#directorMyKad", id.directorMyKad);
  await fillUnlessLocked(page, "#directorMobile", id.directorMobile);
  await fillUnlessLocked(page, "#directorEmail", id.directorEmail);

  await fillUnlessLocked(page, "#picName", id.picName);
  await fillUnlessLocked(page, "#picMyKad", id.picMyKad);
  await fillUnlessLocked(page, "#picMobile", id.picMobile);
  await fillUnlessLocked(page, "#picEmail", id.picEmail);
}

/**
 * Every upload is a styled Browse button over a hidden input. Do NOT
 * `setInputFiles` on the hidden input — the form carries several and only one
 * belongs to the section on screen. Click the button a human would click, catch
 * the filechooser, and let the page's own onchange handler run.
 *
 * File type is chosen from the SURROUNDING TEXT, not from an index: the showroom
 * video row rejects a PDF on its accept filter.
 */
async function uploadAllBrowseButtons(page: Page, id: Identity): Promise<void> {
  const buttons = page.locator("button:visible").filter({ hasText: /browse files?\.\.\.|browse file/i });
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const near = (await btn.evaluate((n) => {
      const box = n.closest("div,section,tr");
      return box ? (box.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80) : "";
    }).catch(() => "")) || `upload ${i + 1}`;

    const file = ensureAsset(
      /video/i.test(near) ? `showroom-video-${i}.mp4`
        : /photo|picture|image|stamp|card/i.test(near) ? `document-${i}.jpg`
          : `document-${i}.pdf`,
    );

    // The MyKad/passport row carries a REQUIRED "Name" textbox beside its Browse
    // button, and it accepts letters and spaces only.
    if (/mykad|passport|director|owner/i.test(near)) {
      await btn.evaluate((n, name) => {
        const box = n.closest("div,section,tr");
        const input = box && Array.from(box.querySelectorAll("input[type=text], input:not([type])"))
          .find(x => !(x as HTMLInputElement).value && (x as HTMLElement).offsetParent !== null) as HTMLInputElement | undefined;
        if (input) {
          input.value = name;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, id.directorName.replace(/[^a-zA-Z ]+/g, " ").replace(/\s+/g, " ").trim()).catch(() => {});
    }

    try {
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 8_000 }),
        btn.click(),
      ]);
      await chooser.setFiles(file);
      await page.waitForTimeout(800);
    } catch {
      console.log(`[dealer] no file chooser opened for: ${near.slice(0, 44)}`);
    }
  }
}

async function fillAcknowledgement(page: Page, id: Identity): Promise<void> {
  const cleanName = id.directorName.replace(/[^a-zA-Z ]+/g, " ").replace(/\s+/g, " ").trim() || "QA DIRECTOR";
  // This form REJECTS plus-addressed emails that the pre-application accepted.
  const [local, domain] = id.directorEmail.split("@");
  const safeEmail = `${local.split("+")[0]}@${domain || "modefair.com"}`;

  // "Same as Director" raises a confirm whose overlay intercepts every later
  // click including Submit. And a re-click when it is ALREADY ticked toggles it
  // off — hence the guard.
  const same = page.getByLabel(/same as director/i).first();
  const alreadySame = (await same.count().catch(() => 0)) && (await same.isChecked().catch(() => false));
  if (!alreadySame && (await same.count())) {
    await same.click().catch(() => {});
    await page.waitForTimeout(600);
    const yes = page.getByRole("button", { name: /^yes$/i }).first();
    if (await yes.count()) await yes.click().catch(() => {});
  }

  // Ids are unobserved on this variant, so this is placeholder-driven: the three
  // blocks repeat the same four placeholders.
  const byPlaceholder: Array<[RegExp, string]> = [
    [/mykad/i, id.directorMyKad],
    [/mobile/i, id.directorMobile],
    [/email/i, safeEmail],
    [/name/i, cleanName],
  ];
  const inputs = page.locator("input[type=text]:visible, input[type=email]:visible, input[type=tel]:visible, input:not([type]):visible");
  for (let i = 0, n = await inputs.count().catch(() => 0); i < n; i++) {
    const el = inputs.nth(i);
    if (await el.evaluate(x => (x as HTMLInputElement).disabled || (x as HTMLInputElement).readOnly).catch(() => true)) continue;
    const ph = (await el.getAttribute("placeholder").catch(() => "")) || "";
    const val = (await el.inputValue().catch(() => "")) || "";

    if (/email/i.test(ph)) {
      // Rewrite even pre-filled values — they carry the plus form from the pre-app.
      if (!val || val.includes("+")) await el.fill(safeEmail).catch(() => {});
      continue;
    }
    if (val) continue;
    const hit = byPlaceholder.find(([re]) => re.test(ph));
    if (hit && hit[1]) await el.fill(hit[1]).catch(() => {});
  }

  const ack = page.getByLabel(/acknowledg|declar|agree/i).first();
  if (await ack.count()) await ack.click().catch(() => {});
}

/**
 * Advance one step.
 *
 * The TIN check is ACKNOWLEDGE-ONCE: `validateTinAgainstBrn()` runs inside the
 * Unsaved-Changes confirm handler. The FIRST call stores the key, shows "The TIN
 * is invalid... Click Next to proceed", and returns false. The SECOND call with
 * the same key returns true and the draft saves. So advancing is a CYCLE of
 * Next → Save & Continue, up to three times — not a fixed run of clicks. The
 * warning fires even on a well-formed TIN, because the TIN is validated against
 * the SSM record rather than against a format.
 *
 * The `^...$` anchors on the Save regex are mandatory: without them it also
 * matches "Save & Continue Later", which PARKS the record instead of advancing it.
 */
async function advanceStep(page: Page, step: number): Promise<number> {
  let after = step;
  for (let attempt = 1; attempt <= 3 && after === step; attempt++) {
    await page.locator("#to-next-step").first().click({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    after = await currentStep(page);
    if (after !== step) break;

    const saveContinue = page.getByRole("button", { name: /^save\s*&\s*continue$/i }).first();
    if (await saveContinue.count()) await saveContinue.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    after = await currentStep(page);
  }
  return after;
}

/**
 * Wait out a submit.
 *
 * Three named outcomes: advanced (banner up) / quiet (a real refusal — answer a
 * dialog and retry) / stalled (still behind the busy modal at the deadline —
 * staging is slow, do NOT re-click). **Retry only on the quiet branch: a second
 * click while the first POST is in flight is a double submit, not a retry.**
 */
async function settleAfterSubmit(
  page: Page,
  success: () => Promise<boolean>,
  deadlineMs = 90_000,
): Promise<{ advanced: boolean; stalled: boolean }> {
  const t0 = Date.now();
  const busy = () => page.getByText(/working\s*(\.\.\.|…)?/i).first().isVisible().catch(() => false);
  let quietPolls = 0;

  while (Date.now() - t0 < deadlineMs) {
    if (await success()) return { advanced: true, stalled: false };
    if (await busy()) { quietPolls = 0; await page.waitForTimeout(500); continue; }
    quietPolls += 1;
    if (quietPolls >= 6) return { advanced: false, stalled: false }; // 3s of quiet = real refusal
    await page.waitForTimeout(500);
  }
  return { advanced: false, stalled: true };
}

export async function fillApplicationForm(page: Page, id: Identity, dealerLink: string): Promise<void> {
  await page.goto(dealerLink, { waitUntil: "domcontentloaded" });
  await page.locator("#to-next-step").waitFor({ timeout: 30_000 });

  for (let guard = 0; guard < 6; guard++) {
    const step = await currentStep(page);
    if (step === 1) await fillBusinessInfo(page, id);
    else if (step === 2) await uploadAllBrowseButtons(page, id);
    else await fillAcknowledgement(page, id);

    if (step >= 3) break;
    const after = await advanceStep(page, step);
    if (after === step) {
      throw new Error(`the Application Form would not leave step ${step} — required fields are still failing validation.`);
    }
  }

  // The banner is the ONLY proof: a submit once "worked" while two invalid-email
  // messages held the record at Draft.
  const success = async () => (await page.getByText(/successfully submitted/i).count().catch(() => 0)) > 0;
  const submit = page.getByRole("button", { name: /^submit$/i }).first();
  await submit.click();
  let settled = await settleAfterSubmit(page, success);

  for (let t = 0; t < 3 && !settled.advanced && !settled.stalled; t++) {
    const dlg = page.getByRole("button", { name: /^(save\s*&\s*continue|yes|ok|confirm)$/i }).first();
    if (await dlg.count()) await dlg.click({ timeout: 10_000 }).catch(() => {});
    settled = await settleAfterSubmit(page, success);
    if (settled.advanced || settled.stalled) break;
    if (await submit.count()) await submit.click().catch(() => {});
    settled = await settleAfterSubmit(page, success);
  }

  const ok = settled.advanced || (await success());
  const okBtn = page.getByRole("button", { name: /^ok$/i }).first();
  if (await okBtn.count()) await okBtn.click().catch(() => {});
  if (!ok) {
    throw new Error(`the Application Form did not submit${settled.stalled ? " — still behind the busy modal at the deadline" : ""}.`);
  }
  console.log("[dealer] application form submitted");
}

/* ------------------------------------------------------ phase 8: regdocs */

/**
 * Submit the six registration-document sections.
 *
 * "Registration Documents" is step 4 of a four-step wizard whose step bar is
 * DISPLAY-ONLY — just spans, no click handlers — and the page restores its last
 * step from localStorage, so a fresh context always opens on step 1. An earlier
 * wait for the text /registration documents/ was satisfied by the step-4 LABEL
 * in that bar while step 1 was on screen. So drive the page's own showStep(4)
 * and then VERIFY #step4 is really visible.
 */
export async function submitRegistrationDocs(page: Page, id: Identity, dealerLink: string): Promise<void> {
  await page.goto(dealerLink, { waitUntil: "domcontentloaded" });
  await page.getByText(/registration documents/i).first().waitFor({ timeout: 30_000 });

  const onStep4 = () => page.locator("#step4").isVisible().catch(() => false);
  if (!(await onStep4())) {
    const why = await page.evaluate(() => {
      const w = window as unknown as { showStep?: (n: number) => void; step4Visible?: boolean };
      if (typeof w.showStep !== "function") return "showStep is not defined on this page";
      if (typeof w.step4Visible !== "undefined" && !w.step4Visible) return "the page says step 4 is not available yet (step4Visible false)";
      w.showStep(4);
      return "";
    }).catch(e => `showStep threw: ${(e as Error).message}`);
    await page.waitForTimeout(1_000);
    if (!(await onStep4())) {
      throw new Error(`could not reach step 4 (Registration Documents)${why ? ` — ${why}` : ""}`);
    }
  }

  await uploadAllBrowseButtons(page, id);

  // The confirm-and-agree block above Submit is STATIC TEXT, not a checkbox.
  await page.getByRole("button", { name: /^(submit|submit documents)$/i }).first().click();

  // The receipt banner renders only after the server round-trip, which takes a
  // while with six attachments. Answer any interstitial confirm inside the poll.
  let ok = 0;
  for (let t = 0; t < 20 && !ok; t++) {
    await page.waitForTimeout(1_500);
    ok = await page.getByText(/successfully submitted/i).count().catch(() => 0);
    if (!ok) {
      const dlg = page.getByRole("button", { name: /^(save\s*&\s*continue|yes|ok|confirm)$/i }).first();
      if (await dlg.count()) await dlg.click({ timeout: 5_000 }).catch(() => {});
    }
  }
  const okBtn = page.getByRole("button", { name: /^ok$/i }).first();
  if (await okBtn.count()) await okBtn.click().catch(() => {});
  if (!ok) throw new Error("no success notification after submitting the registration documents");
  console.log("[dealer] registration documents submitted");
}

/* ------------------------------------------------------- phase 10: regfee */

/**
 * Pay the RM 990.00 registration fee — the SECOND QR payment point.
 *
 * Differs from the pre-application fee in three ways that matter:
 *  - no declaration checkbox (the pre-app step has a mandatory one)
 *  - the button is "Submit & Pay" with an AMPERSAND, not "Submit and Pay"
 *  - it never redirects to /preOnb/summary. It finishes on "Application Payment
 *    Success" with Payment Status PAID.
 */
export async function payRegistrationFee(page: Page, dealerLink: string, method: PayMethod): Promise<void> {
  await page.goto(dealerLink, { waitUntil: "domcontentloaded" });
  await page.getByText(/payment summary/i).first().waitFor({ timeout: 30_000 });

  await pickPaymentMethod(page, method);
  if (method === "fpx") await pickBank(page);

  await page.getByRole("button", { name: /submit\s*(&|and)\s*pay/i }).first().click();
  await pay(page, method, FEE_REGISTRATION, "the registration fee");
  console.log("[dealer] registration fee paid");
}

export { OBS };
