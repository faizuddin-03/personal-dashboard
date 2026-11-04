// VERIFY SPEC for src/flows/secarang.flow.ts — the live run that moves the flow from UNVERIFIED to VERIFIED
// (src/flows/README.md). Each test asserts on the screen the stop CLAIMS to be sitting on and attaches a
// screenshot for review.
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-verify-secarang-<stamp> npx playwright test --project=flows secarang.verify
//
// Staging: Secarang /ia/ (SECARANG_BASE_URL / SECARANG_BASE_PATH; SECARANG_INSTANCE=<other> to change).
// Also the information pages (About Us, FAQs, Support) reached from the top menu: `openSecarangInfoPage`, added
// 29.10.2026 for EAINT-12406 sheet CP.
// The first tests stop at All Quotations: read only apart from the quotation request.
// PURCHASE STOPS (added 29.10.2026 for EAINT-12406 sheet E2E, after Azfar's go-ahead "Dev push the changes ady you
// may start" and his phone / email in env/.staging.env-local SECARANG_TEST_PHONE / SECARANG_TEST_EMAIL): `addOns`,
// `confirmation`, `paymentPage`, `paid` on every channel the E2E sheet uses (FPX RHB, card, GrabPay, ShopeePay), a
// failed FPX + a cancelled ShopeePay before the final payment (`failFirst`, with a look away from the payment page
// and `reopen`), and `receipt`. Each is a SANDBOX purchase that creates a real CIBO record (@destructive). Insurer:
// SECARANG_VERIFY_INSURER, default Allianz (the one card that quoted made-up data after the deploy: QT probe
// 29.10.2026, HXA0001A: Allianz RM862.16, Lonpac and Tokio Marine "Quotation unavailable"). Plates HXA0006A-HXA0010A
// (made up, team range), IC from secarangQuoteForm(). The Add-ons and Confirmation screens also attach a list of
// their controls (no values), for the TS that need controls not seen yet (12406_E2E_TS9, TS10). The FPX purchase
// test also saves, READ ONLY (29.10.2026): the Allianz card's Plan Details pop-up, Confirmation's Plan Details, the
// Excess 'i', the agent line + the PIAM ID 'i', and whether the Success page offers [Print receipt] (with its print
// view if it does), for 12406_QT_TS7, E2E_TS9 / TS10 and RC_TS1 E9.
// SWITCH (29.10.2026, EAINT-12406 E2E_TS10): `switchTo` from Allianz's Confirmation to Tokio Marine through the
// "Add-Ons" [Edit] and the plan's [Edit] > "Change your insurance plan?" > Change; stops at Confirmation, no payment.
// Data: made-up only (@data/secarang). The quote test tries the candidates in order and keeps the first that
// reaches All Quotations; every refusal is recorded (annotation + screenshot of the pop-up). A quotation is not
// a purchase, but it is a request to the insurer simulator.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { secarangBaseURL } from "@config/environments";
import { runSecarangFlow, SecarangQuoteRefused, openSecarangInfoPage } from "@flows/secarang.flow";
import { SecarangHomePage } from "@pages/secarang/home.page";
import { SECARANG_QUOTE_CANDIDATES, secarangOwner, secarangQuoteForm } from "@data/secarang";
import { ciboURL } from "@config/environments";
import { FPX_BANK, SecarangPaymentPage, type SecarangPayChannel } from "@pages/secarang/payment.page";
import { SecarangSuccessPage } from "@pages/secarang/success.page";
import type { SecarangPayment, SecarangResult, SecarangStep } from "@flows/secarang.flow";
import { SecarangQuotationsPage } from "@pages/secarang/quotations.page";
import { WindowVideos } from "@fixtures/window-video";
import * as fs from "node:fs";
import { SecarangConfirmationPage } from "@pages/secarang/confirmation.page";
import type { SecarangInfo } from "@pages/secarang/secarang.page";
import { SecarangAddOnsPage } from "@pages/secarang/add-ons.page";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: false }), contentType: "image/png" });
}
const note = (type: string, description: string) => test.info().annotations.push({ type, description });

// Not "serial" (changed 29.10.2026): one failed stop (the card purchase in run sE2E 14:25) skipped every test after it.
// The tests share nothing; with one worker they still run in file order.
test.describe.configure({ mode: "default" });

test.describe("secarang flow verify", () => {
  test.beforeEach(() => note("secarang", `site ${secarangBaseURL() ?? "(not configured)"}`));

  test("stops at home: site password page passed, Home with Private Car / Company Car tabs, promo closed", async ({ page }) => {
    const r = await runSecarangFlow(page, { stopAfter: "home" });
    expect(r.stoppedAfter).toBe("home");
    note("home", `gate passed: ${r.gatePassed}; promo: "${(r.promo ?? "").slice(0, 120)}"`);
    expect(page.url()).toContain(`${secarangBaseURL()}car-insurance`);
    await expect(page.getByText("Buy your car insurance here").first()).toBeVisible();
    await expect(page.getByText("Private Car", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText("Company Car", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator("ngb-modal-window").filter({ visible: true })).toHaveCount(0);
    const home = new SecarangHomePage(page);
    await expect(home.getQuotationButton()).toBeVisible();
    const logos = await home.insurerLogos().evaluateAll((els) => els.map((e) => (e.getAttribute("src") || "").split("/").pop()));
    note("home logos", logos.join(", "));
    expect(logos.length).toBeGreaterThan(0);
    // logoRow() (12406_CP_TS1 / CP_TS8, fixed 29.10.2026): reads only once the logos stop sliding in, then left to
    // right within the row. Checked here: it returns every visible logo, all on the desktop's one row, in rising x.
    const row = await home.logoRow();
    note("home logo row", row.map((l) => `${l.file} x${l.x} y${l.y} ${l.width}x${l.height}`).join("; "));
    expect(row.length, "logoRow() returns every visible logo").toBe(await home.insurerLogos().count());
    const mids = row.map((l) => l.y + l.height / 2);
    expect(Math.max(...mids) - Math.min(...mids), "settled logos share one row (vertical centres within half a logo height)").toBeLessThanOrEqual(Math.min(...row.map((l) => l.height)) / 2);
    for (let i = 1; i < row.length; i++) expect(row[i].x, `${row[i].file} is right of ${row[i - 1].file}`).toBeGreaterThan(row[i - 1].x);
    // logoRowFrame() (29.10.2026): the frame a proof draws around the logo row holds every visible logo.
    const frame = home.logoRowFrame();
    const inFrame = await frame.evaluate((f) => Array.from(f.querySelectorAll("img[src*='insurance-logo']")).filter((e) => (e as HTMLElement).offsetParent).length);
    note("home logo row frame", `${await frame.evaluate((f) => `${f.tagName.toLowerCase()}.${String(f.className).trim().replace(/\s+/g, ".")}`)} holds ${inFrame} visible logo(s)`);
    expect(inFrame, "the logo row frame holds every visible logo").toBe(row.length);
    await frame.evaluate((f) => { (f as HTMLElement).style.outline = "3px solid #DE350B"; });
    await snap(page, "secarang-home-logo-row-framed");
    await frame.evaluate((f) => { (f as HTMLElement).style.outline = ""; });
    await snap(page, "secarang-home");
  });

  test("info pages: About Us, FAQs and Support open from the top menu (read only)", async ({ page }) => {
    const about = await openSecarangInfoPage(page, "About Us");
    note("about us", `${about.url} (site password page passed: ${about.gatePassed})`);
    expect(new URL(about.url).pathname).toBe(`${new URL(secarangBaseURL()!).pathname}about-us`);
    await expect(page.locator("div.about-us-content h4").filter({ hasText: /^\s*Our partnership\s*$/ })).toBeVisible();
    await snap(page, "secarang-about-us");
    const faq = await openSecarangInfoPage(page, "FAQs");
    expect(new URL(faq.url).pathname).toBe(`${new URL(secarangBaseURL()!).pathname}faq`);
    expect(await page.locator("app-collapsable .collapsable-header").count()).toBeGreaterThan(1);
    await snap(page, "secarang-faq");
    const support = await openSecarangInfoPage(page, "Support");
    expect(new URL(support.url).pathname).toBe(`${new URL(secarangBaseURL()!).pathname}support`);
    expect(await page.locator("app-collapsable h5.insurance-company-name").count()).toBeGreaterThan(0);
    note("support sections", (await page.locator("app-collapsable h5.insurance-company-name").allInnerTexts()).join(" | "));
    await snap(page, "secarang-support");
  });

  test("stops at form: Company Car tab relabels, Private Car fields typed and read back, Get quotation not pressed", async ({ page }) => {
    // Company Car first, to prove the tab switch; then the flow fills Private Car.
    const home = new SecarangHomePage(page);
    await home.open();
    await home.chooseTab("Company Car");
    await snap(page, "secarang-company-car-tab");
    const { note: _n, ...form } = SECARANG_QUOTE_CANDIDATES[0];
    const r = await runSecarangFlow(page, { form, stopAfter: "form" });
    expect(r.stoppedAfter).toBe("form");
    await expect(home.input("plateNo")).toHaveValue(form.plateNo);
    await expect(home.input("idNo")).toHaveValue(form.idNo);
    await expect(home.input("postalCode")).toHaveValue(form.postalCode);
    await expect(page.getByText("Buy your car insurance here").first()).toBeVisible(); // still Home: nothing submitted
    await snap(page, "secarang-form-filled");
  });

  test("stops at quotations: All Quotations with insurer cards (made-up candidates in order)", async ({ page }) => {
    const tried: string[] = [];
    let reached: Awaited<ReturnType<typeof runSecarangFlow>> | undefined;
    for (const c of SECARANG_QUOTE_CANDIDATES) {
      const { note: why, ...form } = c;
      try {
        reached = await runSecarangFlow(page, { form, stopAfter: "quotations" });
        tried.push(`${form.plateNo} / IC ${form.idNo} / ${form.postalCode}: ALL QUOTATIONS (${why})`);
        note("quote", tried[tried.length - 1]);
        break;
      } catch (e) {
        if (!(e instanceof SecarangQuoteRefused)) throw e;
        tried.push(`${form.plateNo} / IC ${form.idNo} / ${form.postalCode}: refused, ${e.kind}: "${e.popupText.slice(0, 160)}" (${why})`);
        note("quote", tried[tried.length - 1]);
        await snap(page, `secarang-refused-${form.plateNo}-${form.idNo}`);
      }
    }
    expect(reached, `no made-up candidate reached All Quotations:\n${tried.join("\n")}`).toBeDefined();
    const r = reached!;
    expect(r.stoppedAfter).toBe("quotations");
    note("screens", (r.screens ?? []).join(" → "));
    if (r.carDetails) note("car details", r.carDetails.join(" | ").slice(0, 400));
    expect(r.quotations?.length ?? 0).toBeGreaterThan(0);
    for (const c of r.quotations!) {
      note("card", `${c.insurer}: ${c.available ? `available ${c.prices.join(", ")}` : `unavailable "${c.unavailableReason}"`}`);
      expect(c.insurer).not.toBe("");
    }
    await expect(page.locator(".insurance-card").filter({ visible: true }).first()).toBeVisible();
    await snap(page, "secarang-all-quotations");
    await test.info().attach("secarang-all-quotations-full", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
});


// ------------------------------------------------------------------------------------------ purchase stops
const INSURER = process.env.SECARANG_VERIFY_INSURER || "Allianz";
const DESTRUCTIVE = { tag: ["@destructive"] };

/** The controls of the screen (inputs, selects, buttons, small icons), WITHOUT their values: for authoring later TS. */
async function controls(page: Page, name: string) {
  const list = await page.evaluate(() => {
    const vis = (e: Element) => !!(e as HTMLElement).offsetParent;
    const near = (e: Element) => ((e.closest(".form-group, .row, .col, label, div") as HTMLElement | null)?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
    return Array.from(document.querySelectorAll("input, select, textarea, button, a[role=button], i, .fa, [class*='info'], [ngbtooltip], [ngbpopover]"))
      .filter(vis)
      .map((e) => ({
        tag: e.tagName.toLowerCase(),
        fcn: e.getAttribute("formcontrolname"),
        type: e.getAttribute("type"),
        id: e.id || null,
        cls: (e.getAttribute("class") || "").slice(0, 80),
        text: e.tagName === "INPUT" || e.tagName === "TEXTAREA" ? null : ((e as HTMLElement).innerText || "").replace(/\s+/g, " ").trim().slice(0, 60),
        options: e.tagName === "SELECT" ? Array.from((e as HTMLSelectElement).options).map((o) => o.text.trim()).slice(0, 12) : undefined,
        near: near(e),
      }));
  });
  await test.info().attach(`${name}-controls.json`, { body: JSON.stringify(list, null, 1), contentType: "application/json" });
  return list.length;
}

/**
 * Open one info trigger (Plan Details, an 'i'), save what it shows (annotation + JSON + screenshot with it open),
 * close it. READ ONLY. A trigger that is missing or opens nothing is a soft failure: the run goes on to the payment
 * stops, and the report names it. For 12406_QT_TS7 (Plan Details, Excess), E2E_TS9 (PIAM 'i', agent line).
 */
async function saveInfo(page: Page, name: string, open: () => Promise<SecarangInfo>, close: () => Promise<void>) {
  try {
    const info = await open();
    note(name, `${info.kind} (by ${info.via}): "${info.text.slice(0, 600)}"${info.links.length ? ` | links: ${info.links.map((l) => `${l.text} -> ${l.href}`).join(" ; ")}` : ""}`);
    await test.info().attach(`${name}.json`, { body: JSON.stringify(info, null, 1), contentType: "application/json" });
    await snap(page, name);
    expect.soft(info.kind, `${name}: the trigger opened something`).not.toBe("none");
    await close();
  } catch (e) {
    note(name, `NOT READ: ${String(e).split("\n")[0].slice(0, 300)}`);
    expect.soft(String(e), `${name}: read`).toBe("");
  }
}

/** One purchase run with a hook that asserts each screen the stop claims, and attaches a screenshot of it. */
async function purchase(
  page: Page,
  plate: string,
  payment: SecarangPayment,
  extra: {
    failFirst?: SecarangPayment[];
    stopAfter?: SecarangStep;
    onPaid?: (r: SecarangResult) => Promise<void>;
    /** Also save the info pop-ups (card + Confirmation) and what the Success page offers (one test does this). */
    capture?: boolean;
  } = {},
) {
  return runSecarangFlow(page, {
    form: secarangQuoteForm(plate),
    insurer: INSURER,
    owner: secarangOwner(),
    payment,
    failFirst: extra.failFirst,
    stopAfter: extra.stopAfter ?? "paid",
    onStep: async (st, r) => {
      if (st === "quotations" && extra.capture) {
        const q = new SecarangQuotationsPage(page);
        await saveInfo(page, `quote-card-plan-details-${INSURER}`, () => q.planDetails(INSURER), () => q.closeInfo());
      }
      if (st === "addOns") {
        await expect(page.locator(".addon-card").filter({ visible: true }).first()).toBeVisible();
        note("add-ons", (r.addOns?.offered ?? []).map((a) => `${a.name}${a.added ? " (in plan)" : ""}`).join(" | "));
        note("add-ons controls", String(await controls(page, `add-ons-${plate}`)));
        await snap(page, `secarang-add-ons-${plate}`);
      }
      if (st === "confirmation") {
        await expect(page.locator('input[formcontrolname="phoneNo"]').filter({ visible: true }).first()).toBeVisible();
        expect(r.confirmation?.["Total Premium"] ?? "", "Confirmation shows a Total Premium row").toMatch(/RM/);
        note("confirmation", JSON.stringify(Object.fromEntries(Object.entries(r.confirmation ?? {}).filter(([k]) => !/Email|Mobile|Full Name|IC No/i.test(k)))));
        note("confirmation controls", String(await controls(page, `confirmation-${plate}`)));
        await snap(page, `secarang-confirmation-${plate}-PERSONAL-DATA`);
        if (extra.capture) {
          const c = new SecarangConfirmationPage(page);
          const al = await c.agentLine();
          note("confirmation agent line", `"${al.agent}" | "${al.commission}"`);
          await saveInfo(page, "confirmation-plan-details", () => c.planDetails(), () => c.closeInfo());
          await saveInfo(page, "confirmation-excess-i", () => c.excessInfo(), () => c.closeInfo());
          await saveInfo(page, "confirmation-piam-i", () => c.agentInfo(), () => c.closeInfo());
          await test.info().attach(`secarang-confirmation-${plate}-full-PERSONAL-DATA`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        }
      }
      if (st === "paymentPage") {
        expect(r.tiles ?? []).toHaveLength(4);
        note("tiles", (r.tiles ?? []).join(" | "));
        await snap(page, `secarang-payment-page-${plate}`);
      }
      if (st === "paid") {
        note(`attempt ${r.attempts?.length}`, `${r.payment?.channel} ${r.payment?.outcome}: ${r.payment?.detail}${r.payment?.unsuccessful ? ` | "${r.payment.unsuccessful}"` : ""}`);
        if (r.payment?.outcome === "success") {
          const ok = new SecarangSuccessPage(page);
          await expect(ok.marker()).toBeVisible();
          note("success", JSON.stringify(r.success));
          await snap(page, `secarang-success-${plate}-PERSONAL-DATA`);
          if (extra.capture) {
            note("success buttons", (await ok.offeredButtons()).join(" | "));
            const pv = await ok.printView();
            note("success [Print receipt]", pv.offered ? `offered ("${pv.label}"): window.print calls ${pv.printCalls}${pv.popup ? `, opened a window ${pv.popup.url()}` : ""}` : "NOT offered (no Print button or link on the Success page)");
            if (pv.offered) {
              await snap(pv.popup ?? page, `secarang-success-print-view-${plate}-PERSONAL-DATA`);
              if (pv.popup) await pv.popup.close().catch(() => undefined);
              await ok.endPrintView();
            }
          }
        } else {
          await expect(page.locator("input[formcontrolname='paymentType']").first()).toBeAttached();
          await snap(page, `secarang-payment-page-after-${r.payment?.outcome}-${plate}`);
        }
        if (extra.onPaid) await extra.onPaid(r);
      }
    },
  });
}

test.describe("secarang flow verify — purchase stops (sandbox payments, real CIBO records)", () => {
  test.beforeEach(() => note("secarang", `site ${secarangBaseURL() ?? "(not configured)"}, insurer ${INSURER}`));

  // ONE video per test, the Fiuu window laid in (src/fixtures/window-video.ts, the same code the `ts` fixture uses):
  // video-one-video.webm in the test's output folder; the window's own file goes to its scratch/ folder.
  let wv: WindowVideos | undefined;
  test.beforeEach(({ page, context }) => {
    const v = new WindowVideos();
    wv = v;
    context.on("page", (p) => { if (p !== page) v.add(p); });
  });
  test.afterEach(async ({ page }) => {
    if (!wv?.count) return;
    const video = page.video();
    await page.close().catch(() => undefined);
    const src = video ? await video.path().catch(() => "") : "";
    if (!src || !fs.existsSync(src)) return;
    const one = test.info().outputPath("video-one-video.webm");
    fs.copyFileSync(src, one);
    const m = await wv.merge(one, test.info().outputPath("scratch"));
    note("one video", `${m.merged} window(s) laid into video-one-video.webm; ${wv.describe().join("; ")}${m.problems.length ? `; problems: ${m.problems.join("; ")}` : ""}`);
    expect.soft(m.problems, "payment window merged into the one video").toEqual([]);
  });

  test("runs addOns > confirmation > paymentPage > paid (FPX RHB, status 00) > receipt", DESTRUCTIVE, async ({ page }) => {
    test.setTimeout(15 * 60_000);
    const r = await purchase(page, "HXA0006A", { channel: "fpx", bank: FPX_BANK.rhb }, { stopAfter: "receipt", capture: true });
    expect(r.stoppedAfter).toBe("receipt");
    expect(JSON.stringify(r.success)).toMatch(/Online Banking/);
    const file = test.info().outputPath("secarang-receipt-HXA0006A-PERSONAL-DATA.pdf");
    await r.receipt!.saveAs(file);
    note("receipt", r.receipt!.suggestedFilename());
    expect(r.receipt!.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  for (const [channel, plate, method] of [["card", "HXA0007A", /Credit/], ["grabpay", "HXA0008A", /GrabPay/], ["shopeepay", "HXA0009A", /ShopeePay/]] as const) {
    test(`stops at paid by ${channel}: success page, Payment Method ${method}`, DESTRUCTIVE, async ({ page }) => {
      test.setTimeout(15 * 60_000);
      const r = await purchase(page, plate, { channel: channel as SecarangPayChannel });
      expect(r.stoppedAfter).toBe("paid");
      expect(r.payment?.outcome).toBe("success");
      expect(JSON.stringify(r.success)).toMatch(method);
    });
  }

  test("failFirst: FPX failed (51), away to the CIBO login page and reopen, ShopeePay cancelled, then FPX paid", DESTRUCTIVE, async ({ page }) => {
    test.setTimeout(20 * 60_000);
    const r = await purchase(page, "HXA0010A", { channel: "fpx", bank: FPX_BANK.rhb }, {
      failFirst: [
        { channel: "fpx", bank: FPX_BANK.rhb, outcome: "failed", fpxFailCode: "51" },
        { channel: "shopeepay", outcome: "cancelled" },
      ],
      onPaid: async (x) => {
        if (x.payment?.outcome === "failed") {
          expect(x.payment.unsuccessful).toMatch(/Unsuccessful payment/i);
          await page.goto(ciboURL("auth/login")); // a look away in the same tab, as 12406_E2E_TS5 does for CIBO
          await new SecarangPaymentPage(page).reopen(x.paymentUrl!);
          note("reopen", `back on the payment page at ${page.url()}`);
          await snap(page, "secarang-payment-page-reopened");
        }
      },
    });
    expect(r.attempts?.map((a) => `${a.channel}:${a.outcome}`)).toEqual(["fpx:failed", "shopeepay:cancelled", "fpx:success"]);
    await expect(new SecarangSuccessPage(page).marker()).toBeVisible();
  });

  // EAINT-12406 sheet RC (29.10.2026): 12406_RC_TS9 STOPS at `paymentPage` and leaves unpaid. Proves the stop returns
  // on the payment page with nothing chosen (no gateway window, no Success page). Creates an unpaid CIBO record.
  test("stops at paymentPage: on 'How would you like to pay?', four tiles, nothing chosen, no window opened", DESTRUCTIVE, async ({ page, context }) => {
    test.setTimeout(15 * 60_000);
    const plate = (process.env.SECARANG_VERIFY_PAYMENTPAGE_PLATE ?? "HXA0016A").trim().toUpperCase();
    const windows: string[] = [];
    context.on("page", (p) => windows.push(p.url()));
    const r = await purchase(page, plate, { channel: "fpx", bank: FPX_BANK.rhb }, { stopAfter: "paymentPage" });
    expect(r.stoppedAfter).toBe("paymentPage");
    expect(r.payment, "nothing paid").toBeUndefined();
    await expect(page.locator("input[formcontrolname='paymentType']").first()).toBeAttached();
    await expect(new SecarangSuccessPage(page).marker()).toHaveCount(0);
    expect(windows, "no gateway window opened").toEqual([]);
    note("paymentPage", `${plate}: tiles ${(r.tiles ?? []).join(" | ")}; left unpaid (a CIBO record is created)`);
    await snap(page, `secarang-stop-payment-page-${plate}`);
  });

  // EAINT-12406 sheet E2E (29.10.2026): `switchTo` for 12406_E2E_TS10. Allianz to Confirmation, the "Add-Ons" [Edit]
  // (on Add-ons, Continue back), the plan's [Edit] > "Change your insurance plan?" > Change > All Quotations > Buy
  // Tokio Marine > Confirmation. STOPS at Confirmation of Tokio Marine: no payment. Every new Confirmation locator is
  // outlined on its screenshot (they were read from the site's code, not seen on a screenshot: confirmation.page.ts).
  // Creates CIBO record(s), unpaid.
  test("switchTo: Allianz Confirmation > Edit Add-Ons > back > Edit plan > Change > Tokio Marine Confirmation (no payment)", DESTRUCTIVE, async ({ page }) => {
    test.setTimeout(15 * 60_000);
    const plate = (process.env.SECARANG_VERIFY_SWITCH_PLATE ?? "HXA0018A").trim().toUpperCase();
    const outline = async (loc: import("@playwright/test").Locator) =>
      loc.first().evaluate((e) => { (e as HTMLElement).style.outline = "3px solid #DE350B"; }).catch(() => undefined);
    const seen: string[] = [];
    const r = await runSecarangFlow(page, {
      form: secarangQuoteForm(plate),
      insurer: "Allianz",
      switchTo: { insurer: "Tokio Marine" },
      owner: secarangOwner(),
      stopAfter: "confirmation",
      onStep: async (st, x) => {
        seen.push(`${st}:${x.insurerNow ?? "-"}`);
        if (st === "confirmation" && x.insurerNow === "Allianz") {
          const c = new SecarangConfirmationPage(page);
          await expect(c.addOnsEditLink(), "exactly one 'Add-Ons' Edit").toHaveCount(1);
          await expect(c.planEditLink("Allianz"), "exactly one plan Edit").toHaveCount(1);
          await outline(c.addOnsEditLink());
          await outline(c.planEditLink("Allianz"));
          await test.info().attach(`switch-confirmation-allianz-${plate}-full-PERSONAL-DATA`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        }
      },
      onSwitch: async (at, x) => {
        seen.push(`switch:${at}`);
        if (at === "addOnsEdit") {
          await expect(page.locator(".addon-card").filter({ visible: true }).first()).toBeVisible();
          note("switch: Add-Ons Edit", `on ${page.url()}; ${x.addOns?.offered.length ?? 0} add-on cards`);
          await snap(page, `switch-add-ons-after-edit-${plate}`);
        }
        if (at === "planEditPopup") {
          note("switch: plan Edit pop-up", x.switched?.popup ?? "");
          expect(x.switched?.popup ?? "").toMatch(/Change your insurance plan\?/);
          await outline(new SecarangConfirmationPage(page).changePlanButton());
          await snap(page, `switch-change-plan-popup-${plate}`);
        }
      },
    });
    note("switch: order", seen.join(" > "));
    // onStep fires on arrival at EVERY step, home and form included (run all1 29.10.2026 15:31: the list lacked them).
    expect(seen).toEqual([
      "home:-", "form:-", "quotations:-", "addOns:Allianz", "confirmation:Allianz", "switch:addOnsEdit", "switch:planEditPopup",
      "quotations:Tokio Marine", "addOns:Tokio Marine", "confirmation:Tokio Marine",
    ]);
    expect(r.stoppedAfter).toBe("confirmation");
    expect(r.confirmation?.["Insurer"] ?? "").toMatch(/Tokio Marine/i);
    expect(JSON.stringify(r.confirmation)).not.toMatch(/Allianz/i);
    note("switch: Tokio Marine Confirmation", JSON.stringify(Object.fromEntries(Object.entries(r.confirmation ?? {}).filter(([k]) => !/Email|Mobile|Full Name|IC No/i.test(k)))));
    // The Insurer row of Insurance Details outlined, on a FULL-PAGE screenshot (29.10.2026, cr-evidence on sw2: the
    // viewport shot showed only the top of Confirmation, without the insurer box; the insurer was proven by the video
    // only). The row, from the deployed /ia/ code (chunk 112.37aeef668bd97567781b.js, Confirmation template: Insurance
    // Details > div.row.mb-2 > div.col-4.text-muted "PRICING_DETAIL.INSURER" + div.col the insurer's full name), the
    // row SecarangConfirmationPage.read() turns into r.confirmation["Insurer"] ("Tokio Marine Insurans (Malaysia)
    // Berhad 198601000381 (149520-U)" on run sE2E-1545-c2 06-confirmation-tokio-marine.png). A hidden second copy
    // exists in the code: visible only, exactly one.
    const insurerRow = page
      .locator(".row.mb-2")
      .filter({ visible: true })
      .filter({ has: page.locator(".text-muted", { hasText: /^\s*Insurer\s*$/ }) });
    await expect(insurerRow, "exactly one visible Insurer row on Confirmation").toHaveCount(1);
    await expect(insurerRow).toContainText(/Tokio Marine/i);
    await insurerRow.scrollIntoViewIfNeeded();
    await outline(insurerRow);
    await test.info().attach(`switch-confirmation-tokio-marine-${plate}-full-PERSONAL-DATA`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    await snap(page, `switch-confirmation-tokio-marine-${plate}-insurer-PERSONAL-DATA`);
  });

  // EAINT-12406 sheet E2E, TS v6 (29.10.2026 evening): `lookFirst` for 12406_E2E_TS9 (Tokio Marine's Add-ons, "Back to
  // insurance selection", then Allianz), and the add-on / Confirmation controls 12406_E2E_TS9 and E2E_TS12 use
  // (add-ons.page.ts: options, More Info, windscreen Sum Insured, MPA plans, ADD / REMOVE against the price bar;
  // confirmation.page.ts: Gender). Add-on locators were seen live read-only (probe addons-controls16); Gender was read
  // from the site's code, so it is outlined here first. Every pop-up is closed with its X, nothing applied or selected;
  // one add-on is ADDed and REMOVEd again. STOPS at Allianz's Confirmation: no payment (an unpaid CIBO record).
  test("lookFirst + add-on controls + gender: Tokio Marine Add-ons > Back > Allianz; pop-ups read and closed; ADD / REMOVE on the price bar; Gender changed and set back (no payment)", DESTRUCTIVE, async ({ page }) => {
    test.setTimeout(15 * 60_000);
    const plate = (process.env.SECARANG_VERIFY_LOOKFIRST_PLATE ?? "HXA0018A").trim().toUpperCase();
    const outline = async (loc: import("@playwright/test").Locator) =>
      loc.first().evaluate((e) => { (e as HTMLElement).style.outline = "3px solid #DE350B"; }).catch(() => undefined);
    const seen: string[] = [];
    const r = await runSecarangFlow(page, {
      form: secarangQuoteForm(plate),
      insurer: "Allianz",
      lookFirst: { insurer: "Tokio Marine" },
      owner: secarangOwner(),
      stopAfter: "confirmation",
      onStep: async (st, x) => {
        seen.push(`${st}:${x.insurerNow ?? "-"}`);
        if (st === "addOns" && x.insurerNow === "Tokio Marine") {
          await expect(new SecarangAddOnsPage(page).backButton()).toBeVisible();
          await outline(new SecarangAddOnsPage(page).backButton());
          await snap(page, `lookfirst-tokio-marine-add-ons-${plate}`);
        }
        if (st === "addOns" && x.insurerNow === "Allianz") {
          const a = new SecarangAddOnsPage(page);
          const opts = await a.options();
          note("add-on options", opts.map((o) => `${o.name}: ${o.price}${o.selects.length ? ` [${o.selects.map((s) => s.options.map((p) => p.text).join("/")).join("; ")}]` : ""}${o.links.length ? ` links ${o.links.join(", ")}` : ""} ADD ${o.addEnabled} REMOVE ${o.removeEnabled}`).join(" | "));
          expect(opts.length, "add-on cards").toBeGreaterThan(0);
          const info = await a.openInfo(a.moreInfoLink(opts[0].name), `More Info of ${opts[0].name}`);
          note("More Info", `${info.kind}: "${info.text.slice(0, 300)}"`);
          expect(info.kind).toBe("modal");
          await snap(page, `add-ons-more-info-${plate}`);
          await a.closeInfo();
          if (await a.sumInsuredLink().count()) {
            const si = await a.openSumInsured();
            note("windscreen sum insured", `${si.value} | ${si.hints.join(" | ")}`);
            const low = await a.trySumInsured(1);
            note("windscreen 1 (below)", JSON.stringify(low));
            expect(low.applyEnabled, "a sum insured of 1 is refused (Apply disabled)").toBe(false);
            await outline(a.sumInsuredModal());
            await snap(page, `add-ons-windscreen-sum-insured-${plate}`);
            // the shown (recommended) value typed back and APPLIED: the pop-up closes (12406_E2E_TS12 applies an in-range value)
            const ok = await a.trySumInsured(Number(si.value));
            expect(ok.applyEnabled, `the shown value ${si.value} is accepted (Apply enabled)`).toBe(true);
            await a.applySumInsured();
            await expect(a.sumInsuredModal()).toHaveCount(0);
            note("windscreen applied", `${si.value}: link now "${(await a.sumInsuredLink().innerText()).trim()}", price ${await a.priceOf(/Windscreen/i)}`);
          }
          if (await a.mpaPlanLink().count()) {
            const mp = await a.openMpaPlans();
            note("MPA plans", `${mp.plans.join(", ")} | ${mp.text.slice(0, 200)}`);
            expect(mp.plans.length).toBeGreaterThan(0);
            await snap(page, `add-ons-mpa-plans-${plate}`);
            await a.closePopup();
          }
          const simple = opts.find((o) => o.addEnabled && !o.selects.length && !o.links.some((l) => /RM|Plan/.test(l)) && /^RM[\d,]+\.\d{2}$/.test(o.price) && o.price !== "RM0.00");
          if (simple) {
            const p0 = await a.premium();
            await a.addButton(simple.name).click();
            const p1 = await a.premiumAfter(p0.value);
            note("price bar ADD", `${simple.name} ${simple.price}: ${p0.text} -> ${p1.text}`);
            await outline(a.premiumLink());
            await snap(page, `add-ons-price-bar-after-add-${plate}`);
            await expect(a.removeButton(simple.name)).toBeVisible();
            await a.removeButton(simple.name).click();
            const p2 = await a.premiumAfter(p1.value);
            note("price bar REMOVE", `${simple.name}: ${p1.text} -> ${p2.text}`);
            expect(Number.isNaN(p0.value) || Number.isNaN(p1.value) || Number.isNaN(p2.value), "the price bar was read").toBe(false);
          }
        }
        if (st === "confirmation") {
          const c = new SecarangConfirmationPage(page);
          await expect(c.genderSelect(), "one visible Gender dropdown").toHaveCount(1);
          const g0 = await c.gender();
          await outline(c.genderSelect());
          await snap(page, `confirmation-gender-${plate}-PERSONAL-DATA`);
          const other = g0 === "FEMALE" ? "MALE" : "FEMALE";
          const ch = await c.setGender(other);
          note("gender", `${g0} -> ${other}: Total Premium ${ch.before["Total Premium"]} -> ${ch.after["Total Premium"]}`);
          const back = await c.setGender(g0 === "FEMALE" ? "FEMALE" : "MALE");
          note("gender back", `${other} -> ${g0}: Total Premium ${back.after["Total Premium"]}`);
          expect(await c.gender()).toBe(g0 || "MALE");
        }
      },
    });
    note("lookFirst: order", seen.join(" > "));
    expect(seen).toEqual(["home:-", "form:-", "quotations:-", "addOns:Tokio Marine", "quotations:Allianz", "addOns:Allianz", "confirmation:Allianz"]);
    note("lookFirst", `looked at ${r.lookedFirst?.insurer} (${r.lookedFirst?.addOns.length ?? 0} add-ons); pop-up on Back: "${r.lookedFirst?.popup ?? ""}"`);
    expect(r.confirmation?.["Insurer"] ?? "").toMatch(/Allianz/i);
    expect(JSON.stringify(r.confirmation)).not.toMatch(/Tokio/i);
  });
});
