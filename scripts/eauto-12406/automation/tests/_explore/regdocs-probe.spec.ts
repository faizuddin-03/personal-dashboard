// NOT A TEST — dumps the post-approval screens WITHOUT submitting anything:
// the Application listing, the BackOffice edit page and its Registration
// Documents tab, and whatever the dealer link shows for the record's state —
// step 4 (documents), step 5 (payment) or the payment receipt.
//
//   PROBE_PRE_APP=P260922/00869 PROBE_APP_NO=NA69001176 \
//     npx playwright test --project=explore regdocs-probe
//
// Output: explore-output/regdocs/*.json|html|png. This is how the step-4
// upload behaviour, the RM 1500.00 fee and the receipt page were first read.
import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { BackOfficePage, BO_MENU } from "@pages/obs/backoffice.page";
import { settleObs } from "@pages/obs/obs-page";

const PRE_APP = process.env.PROBE_PRE_APP ?? "P260922/00869";
const APP_NO = process.env.PROBE_APP_NO ?? "NA69001176";
const OUT = path.join(process.cwd(), "explore-output", "regdocs");

async function dump(page: import("@playwright/test").Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const info = await page.evaluate(() => {
    const vis = (e: Element) => (e as HTMLElement).offsetParent !== null;
    const near = (e: Element) =>
      ((e.closest("div,td,li,section,tr") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 90);
    return {
      url: location.href,
      steps: Array.from(document.querySelectorAll("[id^=step]")).map((e) => ({ id: e.id, visible: vis(e) })),
      globals: {
        showStep: typeof (window as any).showStep,
        step4Visible: (window as any).step4Visible,
        step5Visible: (window as any).step5Visible,
      },
      files: Array.from(document.querySelectorAll("input[type=file]")).map((e) => ({
        id: e.id, name: (e as HTMLInputElement).name, accept: (e as HTMLInputElement).accept, visible: vis(e), near: near(e),
      })),
      buttons: Array.from(document.querySelectorAll("button,input[type=button],input[type=submit],a.btn"))
        .filter(vis)
        .map((e) => ({ id: e.id, text: ((e as HTMLElement).innerText || (e as HTMLInputElement).value || "").trim().slice(0, 40) })),
      selects: Array.from(document.querySelectorAll("select")).filter(vis).map((s) => ({
        id: s.id, value: (s as HTMLSelectElement).selectedOptions[0]?.text?.trim(),
        options: Array.from((s as HTMLSelectElement).options).map((o) => o.text.trim()).slice(0, 12),
      })),
      inputs: Array.from(document.querySelectorAll("input[type=text],input:not([type])")).filter(vis)
        .map((i) => ({ id: i.id, name: (i as HTMLInputElement).name, value: (i as HTMLInputElement).value.slice(0, 60) })),
      text: document.body.innerText.replace(/\n{2,}/g, "\n").slice(0, 6000),
    };
  });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(info, null, 2));
  fs.writeFileSync(path.join(OUT, `${name}.html`), await page.content());
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch(() => undefined);
  console.log(`  dumped ${name}: ${info.files.length} file input(s), ${info.buttons.length} button(s) — ${info.url}`);
  return info;
}

test("read the post-approval screens", async ({ page, context }) => {
  test.setTimeout(10 * 60 * 1000);
  const { LoginPage } = await import("@auth/login");

  // ── the dealer link, from the approved Pre-Application ───────────────────
  await new LoginPage(page).as("bo");
  const bo = new BackOfficePage(page, context);
  await bo.settle();
  await bo.openListing(BO_MENU.preApplicationListing);
  await bo.search({ preOnboardingNo: PRE_APP });
  const preDetail = await bo.openRow(PRE_APP);
  await settleObs(preDetail);
  const link = await bo.applicationLink(preDetail);
  console.log(`  link: ${link.slice(0, 80)}…`);

  // ── the application listing: search fields, row, uuid ────────────────────
  await page.bringToFront();
  await bo.openListing(BO_MENU.applicationListing);
  await dump(page, "10-application-listing");
  const row = await bo.search({ applicationNo: APP_NO });
  console.log(`  row: ${row.slice(0, 300)}`);
  const detail = await bo.openRow(APP_NO);
  await settleObs(detail);
  await dump(detail, "11-bo-application-edit");

  // Registration Documents tab
  const tab = detail.getByText(/registration documents/i).first();
  if (await tab.count()) {
    const href = await detail.evaluate(() =>
      Array.from(document.querySelectorAll("a")).map((a) => a.href).find((h) => /registration-doc/i.test(h)) ?? "",
    );
    console.log(`  regdocs tab href: ${href}`);
    await tab.click().catch(() => undefined);
    await detail.waitForTimeout(3000);
    await settleObs(detail);
    await dump(detail, "12-bo-regdocs");
  }

  // ── the dealer side ──────────────────────────────────────────────────────
  const dealer = await context.newPage();
  await dealer.goto(link, { waitUntil: "commit" });
  await settleObs(dealer);
  await dealer.waitForTimeout(2000);
  await dump(dealer, "20-dealer-landing");
});
