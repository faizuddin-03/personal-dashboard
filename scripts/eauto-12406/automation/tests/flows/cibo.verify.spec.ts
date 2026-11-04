// VERIFY SPEC for src/flows/cibo.flow.ts and the CIBO page objects (src/pages/cibo/) — the live run that moves
// the flow from UNVERIFIED to VERIFIED (src/flows/README.md). Each test asserts on the screen the stop CLAIMS to
// be sitting on and attaches a screenshot for review.
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-verify-cibo-<stamp> npx playwright test --project=flows cibo.verify
//
// READ ONLY on CIBO staging (persona `cibo`): searches are read-only POSTs; Print, Export, Create, Save, Edit,
// Duplicate and Send quotation link are never pressed. The known transaction is BR69005852 (Tokio Marine,
// Secarang, Insurance created, 17.09.2026; opened read-only in the EAINT-12406 before-deploy walk 28.10.2026).
// PERSONAL DATA: the listing row, Transaction Details, the receipt and CRM show a customer's name, IC, phone and
// address. Those screenshots are named *-PERSONAL-DATA; the run folder (cr/<T>/04-runs/) is git-ignored; nothing
// from it goes on a board or Jira as it is.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import { ciboBaseURL } from "@config/environments";
import { runCiboFlow } from "@flows/cibo.flow";
import { CiboSidebar } from "@pages/cibo/cibo-sidebar.page";
import { CiboLoginPage } from "@pages/cibo/cibo-login.page";
import { CiboTransactionManagementPage, TM_REF_COLUMN } from "@pages/cibo/transaction-management.page";
import { CiboPaymentManagementPage } from "@pages/cibo/payment-management.page";
import { CiboPaymentReportPage } from "@pages/cibo/payment-report.page";
import { CiboCommissionReportPage } from "@pages/cibo/commission-report.page";
import { CiboCrmPage } from "@pages/cibo/crm.page";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import { readCiboCsv } from "@pages/cibo/cibo.page";

const REF = process.env.CIBO_VERIFY_REF || "BR69005852";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: false }), contentType: "image/png" });
}
const note = (type: string, description: string) => test.info().annotations.push({ type, description });

test.describe.configure({ mode: "serial" });

test.describe("cibo flow verify", () => {
  test.beforeEach(() => note("cibo", `CIBO ${ciboBaseURL() ?? "(not configured)"}`));

  test("stops at login: CIBO dashboard, sidebar drawn", async ({ page }) => {
    const r = await runCiboFlow(page, { stopAfter: "login" });
    expect(r.stoppedAfter).toBe("login");
    expect(page.url()).toBe(`${ciboBaseURL()}dashboard`);
    expect(r.welcome).toMatch(/^Welcome, /);
    await expect(new CiboSidebar(page).link("transactions")).toBeAttached();
    await snap(page, "cibo-dashboard");
  });

  test(`runs to receipt: ${REF} found, Transaction Details read, Receipt PDF downloaded`, async ({ page }) => {
    const r = await runCiboFlow(page, { ref: REF, filter: { insuranceCompany: ["TokioMarine"] }, stopAfter: "receipt" });
    expect(r.stoppedAfter).toBe("receipt");
    expect(r.row?.[TM_REF_COLUMN]).toContain(REF);
    note("listing row", `Ins. Co. "${r.row?.["Ins. Co."]}", status "${r.row?.["Transaction Status"]}", JPJ "${r.row?.["JPJ"]}"`);
    expect(r.detailsUrl).toMatch(/\/transaction-management\/transaction-details\//);
    note("insurer", `${r.insurer?.text} (lines: ${JSON.stringify(r.insurer?.lines)})`);
    expect(r.insurer?.text).toMatch(/Tokio Marine/);
    note("buttons", (r.documentButtons ?? []).join(", "));
    expect(r.documentButtons).toEqual(expect.arrayContaining([expect.stringMatching(/Receipt/)]));
    const file = test.info().outputPath(`receipt-${REF}-PERSONAL-DATA.pdf`);
    await r.receipt!.saveAs(file);
    note("receipt", `${r.receipt!.suggestedFilename()} saved (${fs.statSync(file).size} bytes) in the run's artifacts, not attached`);
    expect(r.receipt!.suggestedFilename()).toMatch(/\.pdf$/i);
    expect(fs.readFileSync(file).subarray(0, 4).toString()).toBe("%PDF");
    await snap(page, `cibo-transaction-details-${REF}-PERSONAL-DATA`);
  });

  // EAINT-12406 sheet RG (29.10.2026): a CR spec signs in once (ts.portal("cibo")) and looks transactions up with
  // `signedIn: true`, stop `receipt`, one after the other in the same tab. Lonpac BR60006309 and RHB BR55004008
  // were opened read-only in the before-deploy run 28.10.2026 and the probe 29.10.2026 (rg-insurer-box.mjs).
  test("signedIn: two look-ups in one signed-in tab, each to receipt (Lonpac BR60006309, then RHB BR55004008)", async ({ page }) => {
    await new CiboLoginPage(page).as();
    for (const [ref, ins, name] of [["BR60006309", "Lonpac", /Lonpac Insurance/], ["BR55004008", "RHB", /RHB Insurance Berhad/]] as const) {
      const r = await runCiboFlow(page, { ref, filter: { insuranceCompany: [ins] }, signedIn: true, stopAfter: "receipt" });
      expect(r.stoppedAfter).toBe("receipt");
      expect(r.welcome, "signedIn skips the login").toBeUndefined();
      expect(r.row?.[TM_REF_COLUMN]).toContain(ref);
      expect(r.detailsUrl).toMatch(/\/transaction-management\/transaction-details\//);
      note(`insurer ${ref}`, `${r.insurer?.text} (lines: ${JSON.stringify(r.insurer?.lines)})`);
      expect(r.insurer?.text).toMatch(name);
      const file = test.info().outputPath(`receipt-${ref}-PERSONAL-DATA.pdf`);
      await r.receipt!.saveAs(file);
      expect(fs.readFileSync(file).subarray(0, 4).toString()).toBe("%PDF");
      await snap(page, `cibo-transaction-details-${ref}-PERSONAL-DATA`);
    }
  });

  // EAINT-12406 RG_TS1 (run eaint-12406-retest-sretest-20261030-0040-C-c2, triage 30.10.2026): ts.portal("cibo") signs in
  // a SECOND time in the same tab after context.clearCookies(); the CIBO session outlived that, the login page bounced
  // to the dashboard and filling Login ID timed out. CiboLoginPage.as() now accepts this tab's own earlier session.
  test("second sign-in in the same tab after clearing cookies: the form again, or this tab's own session kept", async ({ page, context }) => {
    expect(await new CiboLoginPage(page).as()).toBe("form");
    await context.clearCookies();
    const how = await new CiboLoginPage(page).as();
    note("second sign-in", how === "kept" ? "the session outlived clearCookies(): the login page went to the dashboard, this tab's own session kept" : "the login form showed again and was filled");
    expect(["form", "kept"]).toContain(how);
    expect(page.url()).toBe(`${ciboBaseURL()}dashboard`);
    expect(await new CiboLoginPage(page).welcome()).toMatch(/^Welcome, /);
    await expect(new CiboSidebar(page).link("transactions")).toBeAttached();
    const r = await runCiboFlow(page, { ref: REF, filter: { insuranceCompany: ["TokioMarine"] }, signedIn: true, stopAfter: "details" });
    expect(r.row?.[TM_REF_COLUMN]).toContain(REF);
    await snap(page, `cibo-second-sign-in-${how}-${REF}-PERSONAL-DATA`);
  });

  // The values are proved ON SCREEN (29.10.2026, cr-evidence gap of run sRC: they were only in the notes): each list is
  // opened, the value scrolled into view inside the list and outlined, checked to be in the viewport, and the open
  // list screenshotted. Nothing is ticked.
  test("Transaction Management filters: Insurance Company offers the agency groups' insurers", async ({ page }) => {
    await new CiboLoginPage(page).as();
    await new CiboSidebar(page).open("transactions");
    const tm = new CiboTransactionManagementPage(page);
    await tm.settle();
    const insurers = await tm.filterOptions("insuranceComp");
    note("insuranceComp values", insurers.join(", "));
    expect(insurers).toEqual(expect.arrayContaining(["Allianz", "TokioMarine", "Lonpac"]));
    const exact = (v: string) => new RegExp(`^\\s*${v}\\s*$`);
    const mark = (l: import("@playwright/test").Locator) => l.evaluate((e) => { (e as HTMLElement).style.outline = "3px solid #e53935"; (e as HTMLElement).style.outlineOffset = "-3px"; });
    let panel = await tm.openFilter("insuranceComp");
    const shown: string[] = [];
    for (const v of ["Allianz", "TokioMarine"]) {
      const opt = panel.locator(".ng-option").filter({ hasText: exact(v) }).first();
      await opt.scrollIntoViewIfNeeded();
      await mark(opt);
      await expect(opt, `"${v}" is on screen in the open Insurance Company list`).toBeInViewport();
      shown.push(v);
      await snap(page, `cibo-tm-filter-insurance-company-open-${v}`);
    }
    const both = await panel.locator(".ng-option").filter({ hasText: exact("Allianz") }).first().evaluate((e) => {
      const box = e.closest(".ng-dropdown-panel-items, .scroll-host") ?? e.parentElement!;
      const r = box.getBoundingClientRect();
      return Array.from(box.querySelectorAll(".ng-option")).filter((o) => /^(Allianz|TokioMarine)$/.test((o.textContent || "").trim())).every((o) => { const q = o.getBoundingClientRect(); return q.top >= r.top - 1 && q.bottom <= r.bottom + 1; });
    });
    note("insuranceComp on screen", `${shown.join(" and ")} outlined in the open list${both ? " (both in the last screenshot)" : " (one screenshot each: the list scrolls)"}`);
    await tm.closeFilter();
    const platforms = await tm.filterOptions("platform");
    note("platform values", platforms.join(", "));
    expect(platforms).toEqual(expect.arrayContaining(["eAuto"]));
    panel = await tm.openFilter("platform");
    for (const o of await panel.locator(".ng-option, .ng-optgroup").all()) {
      await o.scrollIntoViewIfNeeded();
      await mark(o);
      await expect(o).toBeInViewport();
    }
    await snap(page, "cibo-tm-filter-platform-open");
    await tm.closeFilter();
    await snap(page, "cibo-transaction-management-filters");
  });

  test(`Payment Management: ${REF} found in the Payment Listing`, async ({ page }) => {
    await new CiboLoginPage(page).as();
    await new CiboSidebar(page).open("payments");
    const rows = await new CiboPaymentManagementPage(page).searchListing({ text: REF });
    note("payment rows", `${rows.length}: ${rows.map((r) => `${r["Payment Channel"]} / ${r["Payment Ref ID"]} / ${r["Response"]}`).join(" | ")}`);
    expect(rows.some((r) => (r["Transaction Ref. No."] ?? "").includes(REF))).toBe(true);
    await snap(page, `cibo-payment-management-${REF}-PERSONAL-DATA`);
  });

  test("Payment Report: Allianz, Insurance Created 01.05.2025 - 07.05.2025 (date pickers), summary period follows", async ({ page }) => {
    await new CiboLoginPage(page).as();
    await new CiboSidebar(page).open("paymentReport");
    const { summary, rows } = await new CiboPaymentReportPage(page).searchReport({
      insuranceCompany: ["Allianz"],
      till: new Date(2025, 4, 7),
      from: new Date(2025, 4, 1),
    });
    note("payment report", `period "${summary.period}", ${rows.length} row(s)`);
    expect(summary.period).toMatch(/01\.05\.2025\s*-\s*07\.05\.2025/);
    for (const r of rows) expect(r["Insurance Company"] ?? "").toMatch(/Allianz/);
    await snap(page, "cibo-payment-report-allianz-week-PERSONAL-DATA");
  });

  test("Commission Report: Allianz, summary and rows", async ({ page }) => {
    await new CiboLoginPage(page).as();
    await new CiboSidebar(page).open("commissionReport");
    const { summary, rows } = await new CiboCommissionReportPage(page).searchReport({ insuranceCompany: ["Allianz"] });
    note("commission report", `period "${summary.period}", ${rows.length} row(s) on page 1, pager "${await new CiboCommissionReportPage(page).pagerText()}"`);
    expect(summary.period).not.toBe("");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r["Insurance Company"] ?? "").toMatch(/Allianz/);
    await snap(page, "cibo-commission-report-allianz");
  });

  test("CRM: listing searched, first customer opened read-only", async ({ page }) => {
    await new CiboLoginPage(page).as();
    await new CiboSidebar(page).open("crm");
    const crm = new CiboCrmPage(page);
    const rows = await crm.searchListing();
    note("crm", `${rows.length} row(s) on page 1, pager "${await crm.pagerText()}"`);
    expect(rows.length).toBeGreaterThan(0);
    await crm.openCustomer(0);
    const c = await crm.readCustomer();
    note("crm customer", `${c.vehicleCards} vehicle card(s) (Edit buttons counted, never pressed)`);
    expect(c.vehicleCards).toBeGreaterThan(0);
    expect(page.url()).toMatch(/\/crm\/customer-details\//);
    await snap(page, "cibo-crm-customer-details-PERSONAL-DATA");
  });
  // EAINT-12406 sheet E2E (29.10.2026): a Secarang purchase gives a Receipt No., not the CIBO Ref. No., so the E2E
  // specs look their record up by PLATE (+ since, + the Receipt No). The free-text box finds a plate (probe
  // 29.10.2026, cr/EAINT-12406/03-spec/probes-author/cibo-search-by-plate.mjs). Checked on REF's own plate and
  // Receipt No, read from REF first (nothing hard-coded: the plate is a customer's).
  test(`plate look-up: ${REF}'s plate + its Receipt No finds ${REF} (stop listing, then details)`, async ({ page }) => {
    const first = await runCiboFlow(page, { ref: REF, filter: { insuranceCompany: ["TokioMarine"] }, stopAfter: "details" });
    const plate = (first.row?.["Vehicle No"] ?? "").split(" ")[0];

    const receiptNo = await new CiboTransactionDetailsPage(page).value("Receipt No");
    expect(plate, "the listing row has a Vehicle No").not.toBe("");
    expect(receiptNo, "Transaction Details shows a Receipt No").toMatch(/^\d+$/);
    const since = new Date(2026, 0, 1);
    const listed = await runCiboFlow(page, { plate, since, receiptNo, signedIn: true, stopAfter: "listing" });
    expect(listed.ref).toBe(REF);
    expect(listed.row?.[TM_REF_COLUMN]).toContain(REF);
    await expect(new CiboTransactionManagementPage(page).row(REF)).toBeVisible();
    await snap(page, `cibo-plate-lookup-listing-${REF}-PERSONAL-DATA`);
    const opened = await runCiboFlow(page, { plate, since, receiptNo, signedIn: true, stopAfter: "details" });
    expect(opened.ref).toBe(REF);
    expect(opened.detailsUrl).toMatch(/\/transaction-management\/transaction-details\//);
    note("plate look-up", `plate (${plate.length} chars) + Receipt No found ${opened.ref}`);
    const none = await runCiboFlow(page, { plate, since: new Date(Date.now() + 86_400_000), signedIn: true, stopAfter: "listing" }).catch((e) => String(e));
    expect(String(none), "since in the future finds nothing").toMatch(/no row for plate/);
  });

  // EAINT-12406 sheet RC (29.10.2026): the page-object methods the RC specs use, on old Allianz transactions
  // (BR55004010 Insurance created, BR44003678 Pending payment; both opened read-only in the walks 28.10 and the
  // probes 29.10, cr/EAINT-12406/03-spec/probes-automation/rc-*.mjs) and BR69005852 (Tokio Marine, FPX). READ ONLY:
  // searches, Clear all, Print (window.print recorded, never the system dialog), Export of a ONE-row search.
  test("RC methods: filter groups, row badges, Export CSV, Print view, Clear all; Transaction Details fields, logo, layout, status badge", async ({ page }) => {
    test.setTimeout(10 * 60_000);
    await new CiboLoginPage(page).as();
    const sidebar = new CiboSidebar(page);
    const tm = new CiboTransactionManagementPage(page);
    await sidebar.open("transactions");
    const groups = await tm.filterGroups("insuranceComp");
    note("insuranceComp groups", groups.map((g) => `${g.group}: ${g.options.join(", ")}`).join(" · "));
    expect(groups.find((g) => g.group === "Serba Sentral")?.options).toContain("Allianz");
    const panel = await tm.openFilter("platform");
    await expect(panel.locator(".ng-option").first()).toBeVisible();
    await tm.closeFilter();
    const rows = await tm.searchListing({ insuranceCompany: ["Allianz"], text: "BR55004010" });
    expect(rows.map((r) => r[TM_REF_COLUMN])).toEqual([expect.stringContaining("BR55004010")]);
    const badges = await tm.rowBadges("BR55004010");
    note("row badges", JSON.stringify(badges));
    expect(badges["Ins. Co."]?.[0]?.text).toBe("Serba Sentral");
    expect(badges[TM_REF_COLUMN]?.[0]?.text).toBe("Secarang");
    await expect(await tm.cell("BR55004010", "Ins. Co.")).toContainText("Allianz");
    const dl = await tm.exportCsv();
    const csv = readCiboCsv(fs.readFileSync(await dl.path(), "utf8"));
    note("export", `${dl.suggestedFilename()}: "${csv.title}", ${csv.header.length} columns, ${csv.rows.length} row(s)`);
    expect(csv.title).toBe("Transaction Management");
    expect(csv.rows.map((r) => r["Transaction Ref. No."])).toEqual(["BR55004010"]);
    expect(csv.rows[0]["Agency"]).toBe("Serba Sentral");
    const pv = await tm.printView();
    expect(pv.printCalls).toBe(1);
    await snap(page, "cibo-transaction-management-print-view-PERSONAL-DATA");
    await tm.endPrintView();
    await tm.clearAll();
    const st = await tm.filterState();
    note("after Clear all", JSON.stringify(st));
    expect(st.inputs.find((i) => i.control === "search")?.value).toBe("");
    expect(st.selects.find((s) => s.control === "insuranceComp")?.values).toEqual([]);

    await tm.searchListing({ insuranceCompany: ["Allianz"], text: "BR55004010" });
    await tm.openDetails("BR55004010");
    const d = new CiboTransactionDetailsPage(page);
    const platform = await d.field("Platform");
    const agency = await d.field("Agency");
    expect(platform.text).toBe("Secarang");
    expect(agency.text).toBe("Serba Sentral");
    expect((await d.field("Cover Note No")).text).toBe("-");
    expect((await d.totalPremium()).text).toMatch(/^RM[\d,]+\.\d{2}$/);
    const logo = await d.insurerLogo();
    expect(logo?.alt).toBe("Allianz logo");
    const lay = await d.insurerLayout();
    note("insurer layout BR55004010", JSON.stringify(lay));
    expect(lay.text).toMatch(/^Allianz General Insurance Company \(Malaysia\) Berhad/);
    expect((await d.statusBadgeInfo()).text).toBe("Insurance created");
    await d.blurPersonalData();
    await snap(page, "cibo-transaction-details-BR55004010-blurred");

    await sidebar.open("transactions");
    await tm.searchListing({ insuranceCompany: ["Allianz"], text: "BR44003678" });
    await tm.openDetails("BR44003678");
    const pending = await d.statusBadgeInfo();
    note("pending badge", JSON.stringify({ ...pending, locator: undefined }));
    expect(pending.text).toBe("Pending payment");
    expect(pending.cls).toMatch(/pending-badge/);
    expect(pending.hasIcon).toBe(false);

    await sidebar.open("payments");
    const pm = await new CiboPaymentManagementPage(page).searchListing({ channelIn: [{ group: "FPX Online Banking" }], text: REF });
    expect(pm.some((r) => (r["Transaction Ref. No."] ?? "").includes(REF))).toBe(true);
    await sidebar.open("payments");
    const fiuuGrab = await new CiboPaymentManagementPage(page).searchListing({ channelIn: [{ group: "Fiuu - eWallet", option: "GrabPay" }], text: REF });
    expect(fiuuGrab.some((r) => (r["Transaction Ref. No."] ?? "").includes(REF)), `${REF} (FPX) is not a Fiuu eWallet GrabPay payment`).toBe(false);

    await sidebar.open("paymentReport");
    const prPage = new CiboPaymentReportPage(page);
    await prPage.searchReport({ insuranceCompany: ["Allianz"], till: new Date(2025, 4, 7), from: new Date(2025, 4, 1) });
    const prCsv = readCiboCsv(fs.readFileSync(await (await prPage.exportCsv()).path(), "utf8"));
    expect(prCsv.title).toBe("Payment Report Listing");
    expect(prCsv.header).toEqual(expect.arrayContaining(["Transaction Ref. No.", "Insurance Company", "Agency"]));
  });
});
