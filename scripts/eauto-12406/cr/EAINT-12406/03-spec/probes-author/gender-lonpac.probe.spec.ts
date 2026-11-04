// EAINT-12406 probe (30.10.2026, cr-author, for the main session; Azfar's full permission of 29.10 evening).
// Question: does the insurer SIMULATOR on staging /ia/ price by gender at all? The verify run lf1 / gender (29.10,
// HXA0018A, Allianz) saw Gender MALE -> FEMALE leave the Total Premium at RM941.13; team doc §3 says a gender change
// re-prices. This probe asks the same of Lonpac and Tokio Marine.
//
// What it does (own made-up data, NO payment, nothing confirmed):
//   - quotes HXA0005A (team made-up range, the last plate no TS uses; PROBE_PLATE overrides), the made-up IC of
//     @data/secarang unless SECARANG_QUOTE_IC is set, postcode 55000;
//   - Buy Lonpac > Add-ons (defaults) > Continue > Confirmation (owner: secarangOwner(), the QA's own phone / email,
//     made-up name and address): reads Total Premium, sets Gender to the other value (ConfirmationPage.setGender waits
//     for the re-price), reads again, sets it back, reads again;
//   - then, through the verified `switchTo` ([Edit] on the plan > "Change your insurance plan?" > Change > All
//     Quotations > Buy Tokio Marine > Confirmation), the same for Tokio Marine. If the switch fails, Tokio Marine is
//     quoted again from Home on the same plate and taken to Confirmation the same way.
//   - Confirm and Pay is NEVER pressed. Confirmation creates unpaid CIBO records (team doc §6), accepted for this probe.
//   - While each gender change runs, every /ins-api/ answer is listed (method, path, status, and only its price /
//     gender fields), so the log shows whether a re-price was asked for and what the simulator answered.
// Output: lines "GENDER_RESULT {...}" per insurer; screenshots of the price box only (no owner details) attached.
//
//   cd automation; CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-gender-<stamp> npx playwright test --project=cr-tools gender-lonpac

import { test } from "@playwright/test";
import type { Page, Response } from "@playwright/test";
import { runSecarangFlow, type SecarangResult } from "@flows/secarang.flow";
import { SecarangConfirmationPage } from "@pages/secarang/confirmation.page";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";
import { secarangBaseURL } from "@config/environments";

const PLATE = (process.env.PROBE_PLATE || "HXA0005A").trim().toUpperCase();
const log = (k: string, v: unknown) => console.log(`${k} ${JSON.stringify(v)}`);
/** Price rows only: no owner name / email / phone / IC / address in the log. */
const PRICE_KEY = /premium|ncd|gross|service tax|stamp|discount|total|amount|commission|road rangers|all drivers/i;
const PERSONAL_KEY = /name|email|mobile|phone|ic no|address|postal|city|state/i;
const prices = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([k]) => PRICE_KEY.test(k) && !PERSONAL_KEY.test(k)));

/** Fields of a JSON answer whose key names a price or gender (any depth), at most 30. */
function priceFields(body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (v: unknown, at: string) => {
    if (Object.keys(out).length >= 30 || v === null || v === undefined) return;
    if (Array.isArray(v)) return v.slice(0, 20).forEach((x, i) => walk(x, `${at}[${i}]`));
    if (typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        const key = at ? `${at}.${k}` : k;
        if (/gender|sex|premium|gross|nett|net_?amount|total|sst|stamp|ncd|loading/i.test(k) && !PERSONAL_KEY.test(k) && (typeof x !== "object" || x === null)) out[key] = x;
        else if (typeof x === "object") walk(x, key);
      }
    }
  };
  walk(body, "");
  return out;
}

type Seen = { method: string; path: string; status: number; fields: Record<string, unknown> };

async function watchInsApi<T>(page: Page, fn: () => Promise<T>): Promise<{ value: T; seen: Seen[] }> {
  const seen: Seen[] = [];
  const pending: Promise<void>[] = [];
  const on = (res: Response) => {
    const u = new URL(res.url());
    if (!u.pathname.includes("/ins-api/")) return;
    pending.push(
      (async () => {
        let fields: Record<string, unknown> = {};
        if (/json/i.test(res.headers()["content-type"] ?? "")) fields = priceFields(await res.json().catch(() => null));
        seen.push({ method: res.request().method(), path: u.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<tx>"), status: res.status(), fields });
      })(),
    );
  };
  page.on("response", on);
  try {
    const value = await fn();
    await page.waitForTimeout(1_500);
    await Promise.all(pending);
    return { value, seen };
  } finally {
    page.off("response", on);
  }
}

async function priceBoxShot(page: Page, name: string) {
  const box = page.locator(".pricing-details").filter({ visible: true }).first();
  const body = (await box.count()) ? await box.screenshot().catch(() => null) : null;
  if (body) await test.info().attach(name, { body, contentType: "image/png" });
}

const results: Record<string, unknown>[] = [];

async function genderCheck(page: Page, insurer: string) {
  const conf = new SecarangConfirmationPage(page);
  if (!page.url().startsWith(secarangBaseURL() ?? "#")) throw new Error(`Not on the Secarang staging root ${secarangBaseURL()}: ${page.url()}`);
  const plan = await page.locator(".pricing-details").filter({ visible: true }).first().innerText().catch(() => "");
  const start = await conf.gender();
  const first = prices(await conf.read());
  log(`CONFIRMATION ${insurer}`, { plan: plan.split("\n").slice(0, 2).join(" | "), gender: start || "(no Gender dropdown)", prices: first });
  await priceBoxShot(page, `${insurer}-start-${start || "no-gender"}`);
  if (!start) {
    results.push({ insurer, note: "no Gender dropdown on Confirmation" });
    return;
  }
  const other = start === "MALE" ? "FEMALE" : "MALE";
  const a = await watchInsApi(page, () => conf.setGender(other));
  log(`INS_API ${insurer} ${start}->${other}`, a.seen);
  await priceBoxShot(page, `${insurer}-after-${other}`);
  const b = await watchInsApi(page, () => conf.setGender(start as "MALE" | "FEMALE"));
  log(`INS_API ${insurer} ${other}->${start}`, b.seen);
  await priceBoxShot(page, `${insurer}-back-${start}`);
  const total = (o: Record<string, string>) => o["Total Premium"] ?? "(none)";
  const r = {
    insurer,
    plate: PLATE,
    startGender: start,
    [start]: total(a.value.before),
    [other]: total(a.value.after),
    [`${start} again`]: total(b.value.after),
    priceRows: { [start]: prices(a.value.before), [other]: prices(a.value.after) },
    repriceCalls: { toOther: a.seen.length, back: b.seen.length },
    genderShownAtEnd: await conf.gender(),
  };
  results.push(r);
  log("GENDER_RESULT", r);
}

test("probe: does the /ia/ simulator price Lonpac and Tokio Marine by gender (Confirmation only, never paid)", async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const done = new Set<string>();
  const onStep = async (st: string, r: SecarangResult) => {
    if (st === "quotations") log("QUOTATIONS", (r.quotations ?? []).map((c) => `${c.insurer}${c.available ? ` ${c.prices.join(" / ")}` : " unavailable"}`));
    if (st === "confirmation" && r.insurerNow && !done.has(r.insurerNow)) {
      await genderCheck(page, r.insurerNow);
      done.add(r.insurerNow);
    }
  };
  try {
    await runSecarangFlow(page, {
      form: secarangQuoteForm(PLATE),
      insurer: "Lonpac",
      owner: secarangOwner(),
      switchTo: { insurer: "Tokio Marine", editAddOnsFirst: false },
      stopAfter: "confirmation",
      onStep,
    });
  } catch (e) {
    log("FLOW_STOPPED", { at: page.url().replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<tx>"), error: String((e as Error).message).slice(0, 400), done: [...done] });
    if (!done.has("Lonpac")) throw e;
  }
  if (!done.has("Tokio Marine")) {
    log("TOKIO_MARINE_AGAIN", "switch from Confirmation did not reach Tokio Marine: quoting the same plate again from Home");
    await runSecarangFlow(page, { form: secarangQuoteForm(PLATE), insurer: "Tokio Marine", owner: secarangOwner(), stopAfter: "confirmation", onStep });
  }
  log("GENDER_RESULTS", results);
});
