/**
 * The payment step — both channels.
 *
 * **DuitNow QR** is the channel under test (EAINT-12257). It stops for a human
 * to scan with a phone. Whatever appears on the phone belongs to Fiuu and is out
 * of scope: the phone triggers an outcome, it is not a surface we assert on.
 *
 * **FPX** is here only so a run testing QR at the REGISTRATION FEE can get past
 * the pre-application fee without asking for a second scan. It drives itself
 * through the Fiuu sandbox.
 *
 * PROVENANCE: the FPX driver is ported from the reference rig and its selectors
 * were matched live on 2026-08-31. The DuitNow QR tile and popup are
 * [UNVERIFIED] — the channel is not built yet and no HTML has ever been
 * captured for it. Replace those on the first live run.
 */
import type { Page } from "@playwright/test";
import { PAY_WAIT_MS, SCAN_BUDGET_MS } from "./env";
import { banner, waitForHuman } from "./humanGate";

export type PayMethod = "qr" | "fpx";

/** The payment tiles. The radio hides behind an image card, so the input is
 *  never visible and clicking it directly cannot work. */
const METHOD_TILES = {
  b2c: { text: /online banking \(personal\)/i, value: "fpx_personal", css: "#payment-fpx-personal" },
  qr: { text: /duitnow\s*qr/i, value: "duitnow_qr", css: "#payment-duitnow-qr" }, // [UNVERIFIED]
};

const PAY_LABEL = /^(pay|pay now|confirm|approve|submit|proceed|continue|agree|accept|ok|next|done|request tac)$/i;

async function selectedValue(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => {
    const el = document.querySelector(`input[name="${n}"]:checked`) as HTMLInputElement | null;
    return el ? el.value : "";
  }, name).catch(() => "");
}

/** Last resort when the visible card cannot be clicked. Says so when used. */
async function forceRadio(page: Page, css: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (!el) return false;
    el.checked = true;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("click", { bubbles: true }));
    return true;
  }, css).catch(() => false);
}

export async function pickPaymentMethod(page: Page, method: PayMethod): Promise<void> {
  const tile = method === "qr" ? METHOD_TILES.qr : METHOD_TILES.b2c;
  const card = page.getByText(tile.text).first();
  if (await card.count()) await card.click().catch(() => {});

  if ((await selectedValue(page, "paymentMethod")) !== tile.value) {
    if (!(await forceRadio(page, tile.css))) {
      throw new Error(
        `no payment method control matched ${tile.text}. ` +
        (method === "qr"
          ? "The DuitNow QR tile selector is unverified — capture the payment-step HTML and correct src/payment.ts."
          : ""),
      );
    }
    console.log(`[pay] ${method}: fell back to forcing the radio — the visible card did not respond`);
  }
  await page.waitForTimeout(600); // the bank list renders off this choice
}

/**
 * Pick an FPX bank, scoped to the method's category.
 *
 * **Every bank radio shares the name `bankSelection` — B2B and B2C alike** — so
 * "the first one" is a BUSINESS bank even when the method chosen was Personal.
 * That mismatch reached the gateway once, with the log cheerfully reporting
 * "Maybank2u" while submitting a B2B id.
 */
export async function pickBank(page: Page, preferred = "maybank"): Promise<string> {
  const want = new RegExp(preferred, "i");
  const category = "FPX_B2C";
  const inCategory = `input[name="bankSelection"][data-category="${category}"]`;

  const img = page.getByRole("img", { name: want }).first();
  if (await img.count()) await img.click().catch(() => {});

  const readCategory = () => page.evaluate(() => {
    const el = document.querySelector('input[name="bankSelection"]:checked');
    return el ? el.getAttribute("data-category") || "" : "";
  }).catch(() => "");

  let chosen = await selectedValue(page, "bankSelection");
  let cat = await readCategory();

  if (!chosen || cat !== category) {
    if (await page.locator(inCategory).first().count()) {
      await forceRadio(page, inCategory);
      chosen = await selectedValue(page, "bankSelection");
      cat = await readCategory();
    }
  }
  if (!chosen) throw new Error("no FPX bank could be selected on the payment step");
  if (cat !== category) {
    throw new Error(`bank ${chosen} belongs to ${cat} but the method is ${category} — the gateway would be handed a mismatched pair`);
  }
  return chosen;
}

/* ----------------------------------------------------------- DuitNow QR */

/**
 * Hand over to a human with a phone, then wait for eAuto to react.
 *
 * The wait is on a page state change, never a fixed sleep. If the popup closes
 * without a success signal the countdown expired or the transaction was
 * cancelled — fail there rather than burning the rest of the budget waiting for
 * something that can no longer arrive.
 */
export async function payByQr(page: Page, amount: string, what: string): Promise<void> {
  // [UNVERIFIED] dev-described as: QR image + countdown timer + Cancel Transaction.
  const popup = page.getByRole("dialog").filter({ hasText: /duitnow|scan/i }).first();
  await popup.waitFor({ state: "visible", timeout: 60_000 }).catch(() => {
    throw new Error("the DuitNow QR popup never opened — capture the payment-step HTML and correct src/payment.ts.");
  });

  banner([
    "ACTION NEEDED — SCAN THE QR NOW",
    `Scan the QR on screen and APPROVE ${what}.`,
    `The amount should read RM ${amount}.`,
    `You have ${Math.round(SCAN_BUDGET_MS / 60_000)} minutes. Do not close the browser.`,
  ]);

  const paid = () => isPaid(page);
  await waitForHuman({
    until: paid,
    budgetMs: SCAN_BUDGET_MS,
    pollMs: 3_000,
    what: `the DuitNow QR scan for ${what}`,
    abortIf: async () => {
      if (await paid()) return null;
      const stillOpen = await popup.isVisible().catch(() => false);
      return stillOpen ? null : "the QR popup closed without a success signal (timer expired or cancelled)";
    },
  });
}

/* ----------------------------------------------------------------- FPX */

async function isPaid(page: Page): Promise<boolean> {
  return (
    (await page.getByText(/payment\s*success|successfully\s*paid|application payment success/i).count().catch(() => 0)) > 0 ||
    (await page.getByText(/payment status:?\s*paid/i).count().catch(() => 0)) > 0 ||
    /\/obs\/preOnb\/summary\//.test(page.url())
  );
}

async function hasFailed(page: Page): Promise<boolean> {
  return (await page.locator(".unsuccessful-payment-container:visible").count().catch(() => 0)) > 0;
}

/** Fiuu's own simulator: set the outcome to Approved, then fill the TAC. */
async function driveSimulator(p: Page): Promise<void> {
  await p.evaluate(() => {
    for (const s of Array.from(document.querySelectorAll("select"))) {
      const sel = s as HTMLSelectElement;
      const ok = Array.from(sel.options).find(o => /approved/i.test(o.textContent || o.value));
      if (ok && sel.value !== ok.value) {
        sel.value = ok.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }).catch(() => {});

  // The TAC is displayed in ANOTHER INPUT'S VALUE next to a copy control, which
  // innerText never carries — a text-only reader missed it and burned the whole
  // click budget. So: page text first, then any filled 4-8 digit input that is
  // not itself the TAC box and not an amount/order field.
  await p.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input[type=text], input:not([type])")) as HTMLInputElement[];
    const tacBox = inputs.find(i => !i.value && /tac/i.test(i.name + " " + i.id + " " + i.placeholder));
    if (!tacBox) return;
    const fromText = (/Transaction Authentication Code\s*:?\s*(\d{4,8})/i.exec(document.body.innerText || "") || [])[1];
    const fromInput = inputs.find(i =>
      i !== tacBox && /^\d{4,8}$/.test(i.value || "") &&
      !/amount|order|postcode|mobile|phone/i.test(i.name + " " + i.id + " " + i.placeholder),
    )?.value;
    const tac = fromText || fromInput;
    if (!tac) return;
    tacBox.value = tac;
    tacBox.dispatchEvent(new Event("input", { bubbles: true }));
    tacBox.dispatchEvent(new Event("change", { bubbles: true }));
  }).catch(() => {});
}

/** Host-locked, deliberately: credentials are typed on Fiuu's simulator and nowhere else. */
const SIM_HOST = "bank-simulator.fiuu.com";

async function simulatorLogin(p: Page): Promise<boolean> {
  let host = "";
  try { host = new URL(p.url()).hostname; } catch { return false; }
  if (host !== SIM_HOST) return false;

  const user = process.env.QR_FIUU_USER || "";
  const pass = process.env.QR_FIUU_PASS || "";
  if (!user || !pass) return false;

  const u = p.locator('input[type=text]:visible, input:not([type]):visible').first();
  const pw = p.locator('input[type=password]:visible').first();
  if (!(await pw.count())) return false;
  await u.fill(user).catch(() => {});
  await pw.fill(pass).catch(() => {});
  await p.getByRole("button", { name: PAY_LABEL }).first().click().catch(() => {});
  return true;
}

/**
 * Drive the FPX gateway to completion.
 *
 * FPX opens a POPUP, not a same-tab redirect, so every page the context opens is
 * watched. Three rules that were each learned the hard way:
 *  - A credential wall is a PAUSE, not an exit. Breaking out here meant the TAC
 *    screen *after* the login was never driven.
 *  - A window with no controls is not a failure — it is the "Processing
 *    payment..." landing page that redirects. Leave its click budget alone.
 *  - Controls present but none recognised means stop and hand over. Never guess
 *    further on a payment screen.
 */
export async function payByFpx(page: Page, amount: string, what: string): Promise<void> {
  const ctx = page.context();
  const opened: Page[] = ctx.pages().filter(p => p !== page);
  ctx.on("page", p => opened.push(p));

  const state = new Map<Page, { clicks: number; seen: Set<string>; done: boolean; loginTries: number }>();
  const deadline = Date.now() + PAY_WAIT_MS;

  console.log(`[pay] driving the FPX sandbox for ${what} (RM ${amount})`);

  while (Date.now() < deadline) {
    if (await isPaid(page)) return;
    if (await hasFailed(page)) throw new Error(`the gateway reported ${what} as unsuccessful`);

    for (const p of opened.filter(x => !x.isClosed())) {
      const st = state.get(p) || { clicks: 0, seen: new Set<string>(), done: false, loginTries: 0 };
      state.set(p, st);
      if (st.done) continue;

      if ((await p.locator("input[type=password]:visible").count().catch(() => 0)) > 0) {
        if (st.loginTries < 2 && (await simulatorLogin(p).catch(() => false))) {
          st.loginTries += 1;
          continue;
        }
        // Not the simulator, or no stored credentials — a human finishes this one.
        if (st.loginTries === 0) {
          banner([
            "ACTION NEEDED — gateway login",
            `Sign in on the payment window to complete ${what}.`,
          ]);
          st.loginTries = 2;
        }
        continue;
      }

      const controls = await p.locator("button:visible, input[type=submit]:visible, input[type=button]:visible, a[role=button]:visible")
        .count().catch(() => 0);
      if (!controls) continue;

      await driveSimulator(p);

      const btn = p.getByRole("button", { name: PAY_LABEL }).first();
      const clicked = (await btn.count()) ? await btn.click({ timeout: 5_000 }).then(() => true).catch(() => false) : false;

      if (clicked) {
        st.clicks += 1;
        if (st.clicks >= 8) st.done = true;
      } else {
        st.done = true;
      }
      await p.waitForTimeout(1_200);
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error(`the gateway did not settle ${what} within ${Math.round(PAY_WAIT_MS / 60_000)} minutes`);
}

export async function pay(page: Page, method: PayMethod, amount: string, what: string): Promise<void> {
  if (method === "qr") await payByQr(page, amount, what);
  else await payByFpx(page, amount, what);
}

export { isPaid };
