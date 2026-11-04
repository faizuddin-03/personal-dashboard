/**
 * EAINT-12403 — shared pieces for the POST-PUSH runs (and their dry runs).
 *
 * Evidence (QA 2026-09-28): one folder per TS no., everything for that TS in
 * it, numbered in capture order; documents in `downloadable (after)/`; the
 * run's video as `video_<TS>[_NN].webm`.
 *
 *   05-evidence/post-push/<TS>/...        POST_PUSH=1 runs
 *   05-evidence/_dryrun/<TS>/...          dry runs (delete when done)
 *
 * SAFETY — the reason this file exists:
 *  - Nothing on the Dev reset list is paid, resubmitted or reset unless
 *    POST_PUSH=1 AND Step 5 already shows the expected NEW amount.
 *  - eSim RHB flips only touch records whose remark is ours, and are always
 *    flipped back in a `finally`.
 */

import type { Page, Browser } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { LoginPage } from "@auth/login";
import { baseURL, instance } from "@config/environments";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { highlight, highlightRowCells, clearHighlights, paymentSummaryBlock } from "@fixtures/highlight";

// EAINT-12403 is tested on staging /preprod1/ ONLY. Refuse anything else, so a
// silently-resolved instance can never produce evidence (29.09.2026: runs went
// to /eauto/ after the env loader changed — run with INSTANCE=preprod1).
if (instance() !== "preprod1") {
  throw new Error(`EAINT-12403 tools run on preprod1 only — resolved instance is "${instance()}". Run with INSTANCE=preprod1.`);
}

export const CR = path.join(__dirname, "..", "..", "..", "cr", "EAINT-12403");
export const PRE = path.join(CR, "05-evidence", "pre-push");
export const POST_PUSH = process.env.POST_PUSH === "1";
export const EVID = path.join(CR, "05-evidence", POST_PUSH ? "post-push" : "_dryrun");
export const LEDGER = path.join(EVID, "results.json");

export const UCD_COLS = ["Transaction No", "Transaction No.", "JPJ Check", "Payment", "JPJ Transfer", "Tx Status", "Remarks", "Action"];
export const BO_COLS = ["Transaction No.", "Vehicle Type", "JPJ Enquiry", "Payment", "JPJ Transfer", "Tx Status", "Remarks", "Action"];

// ------------------------------------------------------------------ evidence

/** TS folders the current test wrote into — its video is copied into each. */
export const touched = new Set<string>();

export class Shots {
  readonly files: string[] = [];
  private n = 0;
  readonly dir: string;
  constructor(readonly ts: string, readonly part = "") {
    this.dir = path.join(EVID, ts);
    fs.mkdirSync(this.dir, { recursive: true });
    touched.add(ts);
  }
  private name(label: string) {
    if (!this.n) this.n = fs.readdirSync(this.dir).filter((f) => /^\d{2}-/.test(f)).length;
    return `${String(++this.n).padStart(2, "0")}-${this.part ? this.part + "-" : ""}${label}.png`;
  }
  async take(page: Page, label: string, fullPage = true) {
    const f = this.name(label);
    await page.screenshot({ path: path.join(this.dir, f), fullPage }).catch(() => undefined);
    this.files.push(`${this.ts}/${f}`);
  }
  /** A path under `downloadable (after|dryrun)/`. */
  download(file: string) {
    const d = path.join(this.dir, `downloadable (${POST_PUSH ? "after" : "dryrun"})`);
    fs.mkdirSync(d, { recursive: true });
    this.files.push(`${this.ts}/${path.basename(d)}/${file}`);
    return path.join(d, file);
  }
}

export interface Result {
  ts: string;
  check: string;
  vehicle?: string;
  tx?: string;
  expected: string;
  actual: string;
  verdict: "PASS" | "FAIL" | "NOT RUN" | "CHECK";
  notes?: string[];
  screenshots?: string[];
  at?: string;
  instance?: string;
}

export function record(r: Result) {
  fs.mkdirSync(EVID, { recursive: true });
  const all: Result[] = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, "utf8")) : [];
  all.push({ ...r, at: new Date().toISOString(), instance: instance() });
  fs.writeFileSync(LEDGER, JSON.stringify(all, null, 2) + "\n", "utf8");
  console.log(`  [${r.verdict}] ${r.ts} · ${r.check} · ${r.vehicle ?? ""} ${r.tx ?? ""} — expected ${r.expected} | actual ${r.actual}`);
}

/** Copy the finished test's video into every TS folder it touched. */
export async function saveVideo(page: Page) {
  const v = page.video();
  if (!v || process.env.RECORD !== "1" || !touched.size) return;
  // A test that only used the BO window never navigates this page: its video is
  // a blank white second, not evidence (29 of them on 29–30.09). Skip it.
  const unused = page.url() === "about:blank";
  await page.close().catch(() => undefined);
  if (unused) return;
  const src = await v.path().catch(() => "");
  fileVideo(src);
}

function fileVideo(src: string) {
  if (!src || !fs.existsSync(src)) return;
  for (const ts of touched) {
    const dir = path.join(EVID, ts);
    const vids = fs.readdirSync(dir).filter((f) => /^video_/.test(f))
      .sort((a, b) => fs.statSync(path.join(dir, a)).mtimeMs - fs.statSync(path.join(dir, b)).mtimeMs);
    fs.copyFileSync(src, path.join(dir, "__new.webm"));
    const all = [...vids, "__new.webm"];
    all.forEach((f, k) => fs.renameSync(path.join(dir, f), path.join(dir, `__v${k}.webm`)));
    all.forEach((_, k) => fs.renameSync(path.join(dir, `__v${k}.webm`),
      path.join(dir, all.length === 1 ? `video_${ts}.webm` : `video_${ts}_${String(k + 1).padStart(2, "0")}.webm`)));
  }
}

// ------------------------------------------------------------------ page helpers

export const text = (page: Page) => page.evaluate(() => document.body.innerText);

export async function paymentSummary(page: Page): Promise<string> {
  const body = await text(page);
  return ((body.match(/Payment Summary[\s\S]*?Total Amount Payable[^\n]*\n?[^\n]*/) ?? [""])[0]).replace(/\s+/g, " ").trim();
}
/** "RM 37.00" -> "37.00" from a Payment Summary text. */
export const totalOf = (summary: string) => (summary.match(/Total Amount Payable[^:]*:\s*RM\s*([\d.]+)/) ?? [])[1] ?? "";

export async function home(page: Page) {
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/home.do");
  await new StmsWizardPage(page).dismissAnnouncements();
}

export async function confirmDialog(page: Page) {
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm|Accept)$/ }).first();
  if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) await yes.click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

export async function shootStep5(page: Page, shots: Shots, label = "step5-payment-summary") {
  await highlight(page, paymentSummaryBlock(page), "Step 5 price — JPJ + eAuto + 8% = Total");
  await shots.take(page, label);
  await clearHighlights(page);
}

/** A BO page in its own context (the UCD session stays signed in). */
export async function boPage(browser: Browser): Promise<{ bo: Page; close: () => Promise<void> }> {
  // RECORD=1 records the BO window too; before 01.10 it had no recording, so BO-only
  // checks (RHB debit, Reset Payment Report, reports) left screenshots only.
  const rec = process.env.RECORD === "1";
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL(), acceptDownloads: true,
    ...(rec ? { recordVideo: { dir: path.join(os.tmpdir(), "eaint-12403-bo-video"), size: { width: 1920, height: 1080 } } } : {}),
  });
  const bo = await ctx.newPage();
  await new LoginPage(bo).as("bo");
  return {
    bo,
    close: async () => {
      const v = bo.video();
      await ctx.close();
      if (v && rec && touched.size) fileVideo(await v.path().catch(() => ""));
    },
  };
}

/** Cells of the listing row(s) for a vehicle, keyed by header — own cells only. */
/** Collapse every kind of whitespace (incl. NBSP / zero-width) and trim. */
export const clean = (x: string | undefined | null) => String(x ?? "").replace(/[\s\u00a0\u200b\u200c\u200d\ufeff]+/g, " ").trim();

export async function rowFor(page: Page, vehicle: string, tx?: string): Promise<Record<string, string> | null> {
  const r = await rowForRaw(page, vehicle, tx);
  if (!r) return null;
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [clean(k), clean(v)]));
}

async function rowForRaw(page: Page, vehicle: string, tx?: string): Promise<Record<string, string> | null> {
  return page.evaluate(({ v, t }) => {
    const norm = (x: string) => x.replace(/\s+/g, " ").trim();
    const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
    const rows = Array.from(document.querySelectorAll("tr")).filter((tr) => own(tr).length > 6 && norm(tr.textContent || "").includes(v) && (!t || norm(tr.textContent || "").includes(t)));
    const tr = rows[0];
    if (!tr) return null;
    const table = tr.closest("table")!;
    const header = Array.from(table.querySelectorAll("tr")).find((h) => h.querySelectorAll(":scope > th").length > 4);
    const ths = header ? Array.from(header.querySelectorAll(":scope > th")) : [];
    const out: Record<string, string> = {};
    for (const th of ths) {
      const r = th.getBoundingClientRect();
      const td = own(tr).find((c) => { const b = c.getBoundingClientRect(); const m = b.left + b.width / 2; return m >= r.left && m <= r.right; });
      if (td) out[norm(th.textContent || "")] = norm(td.textContent || "");
    }
    return out;
  }, { v: vehicle, t: tx });
}

export async function ucdListing(page: Page, kind: "stms" | "apt" | "estm", vehicle: string) {
  const root = page.url().replace(/\/view\/.*/, "");
  const p = { stms: "/view/ucd/stms/enquiry/main.do", apt: "/view/ucd/apt/enquiry/", estm: "/view/ucd/estm/enquiry/main.do" }[kind];
  await page.goto(root + p);
  await page.fill("#vehicleNo", vehicle);
  await page.click("#to-search");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

export async function boListing(bo: Page, kind: "stms" | "apt", vehicle: string) {
  await bo.goto(kind === "apt" ? "view/apt/enquiry" : "view/stms/enquiry");
  await bo.fill("#vehicleNo", vehicle);
  await bo.click("#to-search");
  await bo.waitForLoadState("networkidle").catch(() => undefined);
  await bo.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 15_000 }).catch(() => undefined);
  await bo.waitForTimeout(800);
}

export { highlight, highlightRowCells, clearHighlights };

/** Box the smallest VISIBLE element whose text matches — e.g. a tile's price. */
export async function highlightText(page: Page, re: RegExp, label: string, holdMs = 1500): Promise<boolean> {
  const hit = await page.evaluate(({ src, flags, label }) => {
    const rx = new RegExp(src, flags);
    const vis = (e: Element) => { const r = (e as HTMLElement).getBoundingClientRect(); const cs = getComputedStyle(e as HTMLElement); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    const all = Array.from(document.querySelectorAll("body *")).filter((e) => vis(e) && rx.test((e as HTMLElement).innerText || ""));
    const el = all.find((e) => !Array.from(e.children).some((c) => all.includes(c))) as HTMLElement | undefined;
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.setAttribute("data-qa-hl-el", "1");
    el.style.outline = "3px solid #e11d48"; el.style.outlineOffset = "3px"; el.style.backgroundColor = "rgba(250,204,21,.45)";
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.setAttribute("data-qa-hl", "1"); b.textContent = label;
    b.style.cssText = "position:absolute;z-index:2147483647;background:#e11d48;color:#fff;font:bold 12px system-ui;padding:2px 6px;border-radius:4px";
    b.style.left = `${r.left + window.scrollX}px`; b.style.top = `${r.top + window.scrollY - 22}px`;
    document.body.appendChild(b);
    return true;
  }, { src: re.source, flags: re.flags, label });
  if (hit) await page.waitForTimeout(holdMs);
  return hit;
}


// ------------------------------------------------------------------ Dev list

export interface DevItem { vehicle: string; tx: string; expected: "RESET" | "NO"; ts: string; state: string }

/** Every "<vehicle> / <tx>" row of DEV-RESET-LIST.md with its expected result and TS. */
export function devList(): DevItem[] {
  const md = fs.readFileSync(path.join(PRE, "DEV-RESET-LIST.md"), "utf8");
  const out: DevItem[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*([A-Z]{2}\d+)\s*\/\s*([SAE]\d{6,})[^|]*\|(.*)\|\s*$/);
    if (!m) continue;
    const cells = m[3].split("|").map((c) => c.trim());
    const exp = cells.find((c) => /RESET|^NO\b/.test(c.replace(/\*/g, ""))) ?? "NO";
    const ts = (cells.find((c) => /12403_/.test(c)) ?? "").match(/12403_[A-Z0-9_]+/)?.[0] ?? "";
    out.push({ vehicle: m[1], tx: m[2], expected: /RESET/.test(exp) ? "RESET" : "NO", ts, state: cells.length > 2 ? cells[0] : "Approved (source STMS)" });
  }
  return out;
}

export const onDevList = (tx: string) => devList().some((d) => d.tx === tx);

// ------------------------------------------------------------------ eSim (ours only)

// setRhb / withRhbOk now live in src/fixtures/esim-switch.ts (shared with EAINT-12022).
export { setRhb, withRhbOk } from "@fixtures/esim-switch";

// ------------------------------------------------------------------ the payment guard

/**
 * May this payment go ahead?
 *  - a transaction on the Dev list: only with POST_PUSH=1 and Step 5 == expected
 *  - anything else: in a dry run always (it is ours and throwaway); post-push
 *    only when Step 5 == expected
 */
export function mayPay(tx: string | undefined, step5Total: string, expected?: string): { ok: boolean; why: string } {
  const listed = tx ? onDevList(tx) : false;
  if (listed && !POST_PUSH) return { ok: false, why: `${tx} is on the Dev list — never paid outside POST_PUSH=1` };
  if (POST_PUSH && expected && step5Total !== expected) return { ok: false, why: `Step 5 shows RM${step5Total}, expected RM${expected} — not paying` };
  return { ok: true, why: listed ? "post-push, Step 5 matches" : "not on the Dev list" };
}

// ------------------------------------------------------------------ region (AZFARAZO address)

/**
 * The APT region follows the UCD company's MAILING State (BO > Manage Company
 * Accounts), read at payment (QA 2026-09-28). AZFARAZO's normal address is
 * JOHOR / ASAHAN / 88000 / TIADA MAKLUMAT DAERAH.
 */
const ADDR = {
  SABAH: { state: /^SABAH/, city: /KOTA KINABALU/, district: /TIADA MAKLUMAT/ },
  JOHOR: { state: /^JOHOR/, city: /ASAHAN/, district: /TIADA MAKLUMAT/ },
} as const;

export async function setCompanyState(browser: Browser, shots: Shots, want: keyof typeof ADDR) {
  const { bo, close } = await boPage(browser);
  try {
    bo.on("dialog", (d) => d.accept().catch(() => undefined));
    await bo.goto("view/account/company/");
    await bo.fill("#registrationCompany", "JM0570913-X");
    await bo.click("#to-search");
    await bo.locator("table tr", { hasText: "JM0570913-X" }).first().waitFor({ timeout: 20_000 });
    await bo.locator("table tr", { hasText: "JM0570913-X" }).locator("a").first().click();
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    // City / district lists are reloaded by AJAX after the parent changes, so
    // wait until an option matching the wanted value is actually there.
    const pick = async (sel: string, re: RegExp) => {
      let v: string | null = null;
      for (let i = 0; i < 40 && !v; i++) {
        v = await bo.locator(sel).evaluate((el, src) => {
          const rx = new RegExp(src);
          const o = Array.from((el as HTMLSelectElement).options).find((x) => rx.test(x.text.trim()));
          return o ? o.value : null;
        }, re.source).catch(() => null);
        if (!v) await bo.waitForTimeout(500);
      }
      if (!v) throw new Error(`${sel}: no option matching ${re} after 20 s — nothing saved`);
      await bo.selectOption(sel, v);
      await bo.locator(sel).dispatchEvent("change").catch(() => undefined);
      await bo.waitForTimeout(800);
    };
    await pick("#state", ADDR[want].state);
    await pick("#city", ADDR[want].city);
    await pick("#district", ADDR[want].district);
    await bo.fill("#postCode", "88000");
    await bo.locator("input[type=submit], input[type=button], button").filter({ hasText: /Update/i }).first().click()
      .catch(async () => { await bo.locator("input[value*=Update i]").first().click(); });
    const yes = bo.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/i }).first();
    if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) await yes.click();
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(1500);
    const state = clean(await bo.locator("#state option:checked").innerText().catch(() => "?"));
    await highlight(bo, bo.locator("#state"), `company State = ${state}`, 600);
    await shots.take(bo, `address-set-${want}`);
    await clearHighlights(bo);
    if (!ADDR[want].state.test(state.trim())) throw new Error(`AZFARAZO State is "${state}", wanted ${want}`);
    console.log(`  AZFARAZO mailing State -> ${state}`);
  } finally { await close(); }
}

/** Run `fn` with AZFARAZO at SABAH, and always put it back to JOHOR. */
export async function withSabah<T>(browser: Browser, shots: Shots, on: boolean, fn: () => Promise<T>): Promise<T> {
  if (!on) return fn();
  await setCompanyState(browser, shots, "SABAH");
  try { return await fn(); } finally { await setCompanyState(browser, shots, "JOHOR"); }
}

