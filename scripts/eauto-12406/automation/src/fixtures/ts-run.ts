/**
 * One TS, one tab, one video — and checked the moment it ends.
 *
 * The `ts` fixture every CR spec runs through (Azfar, 16.10.2026, after
 * EAINT-12022). It folds in three lessons from that ticket:
 *
 *  1. ONE CONTINUOUS VIDEO PER TS. Playwright records one video per tab, so a
 *     TS that opened BackOffice in a second context, or followed a link into a
 *     new tab, left a video that froze on the UCD page ("i cannot see in the
 *     recording that you go to backoffice"). Here the whole TS stays in the
 *     test's own tab: portals are switched by signing in on screen in the same
 *     tab behind a title card, and any tab the site opens is closed and its
 *     address opened in the main tab instead. A live clock on every page keeps
 *     a long wait from looking like a frozen video. Video is always on for the
 *     `cr` project (playwright.config.ts) — it cannot be forgotten.
 *
 *  2. EVERY EXPECTED POINT IS PROVED. The TS's expected result is split into
 *     points E1, E2 … (cr/<TICKET>/01-intake/ts.json, written from the board by
 *     scripts/cr-ts-snapshot.py). A spec proves each one with `ts.prove()`:
 *     what the page shows, whether it matches, and a screenshot of it.
 *
 *  3. CHECKED PER TS, NOT AT THE END. When the test finishes, the gate below
 *     decides at once:
 *       VALID  → cr/<TICKET>/05-evidence/[phase/]<TS>/   (only valid evidence lives there)
 *       other  → cr/<TICKET>/05-evidence/FAILED/<TS>/<when>/ with reason.txt
 *     and appends one line to 04-runs/<RUN_ID>/gate.jsonl for the runner,
 *     cr-evidence and the board.
 *
 *   test("IC_LST_TS2 — listing shows the IC column", async ({ ts }) => {
 *     await ts.portal("ucd", "STMS Transaction Listing");
 *     await ts.page.goto("view/ucd/stms/enquiry/main.do");
 *     const cell = ts.page.locator("td.ic-status").first();
 *     const shows = (await cell.innerText()).trim();
 *     await ts.prove("E1", { shows, match: shows === "Pending", hl: cell, name: "listing-ic-status" });
 *     await ts.portal("bo", "same record on BackOffice");
 *     …
 *   });
 *
 * Without CR_TICKET (an ad-hoc run) the TS folder goes to
 * automation/.artifacts/ts/<RUN_ID>/ and nothing is routed.
 */

import { WindowVideos } from "./window-video";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { BrowserContext, Download, Locator, Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";
import { LoginPage } from "@auth/login";
import { instance, ciboBaseURL, secarangBaseURL } from "@config/environments";
import { lanePersona, PERSONAS, type PersonaKey } from "@config/personas";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { CiboLoginPage } from "@pages/cibo/cibo-login.page";
import { caseIdOf, currentPhase, type Phase } from "./evidence";
import { EsimStep } from "./esim-step";
import { Ff36Step } from "./ff36-step";

const REPO = path.resolve(__dirname, "..", "..", "..");

// ------------------------------------------------------------------ the TS definition

export interface TsPoint {
  /** E1, E2 … in the TS's own order. */
  id: string;
  /** The expected point, in the TS's words (from the SRD). */
  text: string;
}

export interface TsDef {
  id: string;
  sheet?: string;
  /** functional | validation | matrix | status-chain | document | search-filter | e2e | regression | ui | sit … */
  type?: string;
  situation?: string;
  steps?: string;
  expected?: string;
  points: TsPoint[];
  /** Set by the board; a TS edited after it ran is RE-RUN, never PASS. */
  updated?: string;
}

/** cr/<TICKET>/01-intake/ts.json, or null outside a CR run / before the snapshot exists. */
export function loadTsDefs(ticket = process.env.CR_TICKET): Record<string, TsDef> | null {
  if (!ticket) return null;
  const file = path.join(REPO, "cr", ticket, "01-intake", "ts.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")).cases ?? null;
}

const hashOf = (d: TsDef | undefined) =>
  d ? crypto.createHash("sha1").update(JSON.stringify({ s: d.steps, e: d.expected, p: d.points })).digest("hex").slice(0, 12) : "";

// ------------------------------------------------------------------ helpers

export const myt = () => new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour12: false });
const fileStamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const slug = (s: string) => s.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return ""; } };

/** A proof of one expected point. */
export interface Proof {
  point: string;
  expected: string;
  shows: string;
  match: boolean;
  shot?: string;
  at: string;
  url: string;
  side: string;
}

export interface ProveOptions {
  /** What the page actually shows (the value read, or a plain description). */
  shows: string;
  /** Does it match the expected point? A mismatch is recorded, soft-asserted, and the TS goes to FAILED as a defect. */
  match: boolean;
  /** The exact expected value this proof is about, when the point covers several (e.g. "Total RM37.00"). */
  expected?: string;
  /** Outline these in the screenshot. */
  hl?: Locator | Locator[] | null;
  /** File name part; defaults to the point id. */
  name?: string;
  /** false = no screenshot (only for a point proven by a file shown with showFile, which takes its own). */
  shot?: boolean;
  /** An existing screenshot in the TS folder (e.g. a Firefox 36 shot from ts.ff36.run) used as this proof's screenshot. */
  file?: string;
}

// ------------------------------------------------------------------ the recorder

export class TsRun {
  readonly id: string;
  readonly def: TsDef | undefined;
  readonly inst = instance() || "";
  readonly phase: Phase = currentPhase();
  readonly runId = process.env.RUN_ID || "adhoc";
  readonly ticket = process.env.CR_TICKET || "";
  /** Raw working folder while the TS runs; the gate moves it. */
  readonly dir: string;
  readonly proofs: Proof[] = [];
  readonly notes: string[] = [];
  readonly opened: string[] = [];
  dialogs: string[] = [];
  side = "";
  private n = 0;
  private confirmOk = false;
  /** True only inside payWindow(): a window the SITE opens (a payment gateway) is kept open, not closed. */
  private windowsOk = false;
  /** Windows the site opened inside payWindow(); at the end their videos are laid into the TS video (./window-video.ts). */
  readonly windows: Page[] = [];
  /** Created with the TS, right after its tab (and its video) started: window open times are measured from here. */
  private readonly winVideos = new WindowVideos();
  private get campaignModal() { return this.page.locator(".modal-campaign:visible").first(); }
  private readonly startHash: string;
  private esimStep?: EsimStep;
  private ff36Step?: Ff36Step;
  /** Firefox 36 shot path → the URL and side it was taken on (filled by ts.ff36.run). */
  readonly shotUrls = new Map<string, { url: string; side: string }>();

  constructor(readonly page: Page, readonly context: BrowserContext, readonly info: TestInfo) {
    this.id = caseIdOf(info.title);
    this.def = loadTsDefs()?.[this.id];
    this.startHash = hashOf(this.def);
    this.dir = this.ticket
      ? path.join(REPO, "cr", this.ticket, "04-runs", this.runId, "ts", this.id)
      : path.join(REPO, "automation", ".artifacts", "ts", this.runId, this.id);
    if (fs.existsSync(this.dir)) fs.rmSync(this.dir, { recursive: true, force: true }); // a retry starts clean
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async start() {
    // Live clock: the video visibly moves even while a page waits.
    await this.context.addInitScript(() => {
      const tick = () => {
        if (!document.body) return;
        let d = document.getElementById("qa-rec-clock");
        if (!d) {
          d = document.createElement("div");
          d.id = "qa-rec-clock";
          Object.assign(d.style, { position: "fixed", top: "2px", left: "50%", transform: "translateX(-50%)", zIndex: "2147483646",
            background: "rgba(23,43,77,.75)", color: "#fff", font: "bold 11px Arial", padding: "1px 8px", borderRadius: "8px", pointerEvents: "none" });
          document.body.appendChild(d);
        }
        d.textContent = "● REC " + new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour12: false });
      };
      setInterval(tick, 1000);
      document.addEventListener("DOMContentLoaded", tick);
    });
    // Confirm boxes are cancelled unless the click runs inside allowConfirm(); alerts are accepted and kept.
    this.page.on("dialog", async (d) => {
      this.dialogs.push(`${d.type()}: ${d.message()}`);
      if (d.type() === "confirm" && !this.confirmOk) await d.dismiss().catch(() => undefined);
      else await d.accept().catch(() => undefined);
    });
    // Any other tab: note its address and close it; open() shows it in the main tab.
    this.context.on("page", async (pg) => {
      if (pg === this.page) return;
      if (this.windowsOk) {
        // A payment gateway window (Secarang > Fiuu) must stay open: the site waits for it to pay and close itself.
        this.windows.push(pg);
        this.winVideos.add(pg);
        this.note(`window opened by the site and kept (payment window ${this.windows.length}): ${pg.url() || "(loading)"}`);
        return;
      }
      await pg.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => undefined);
      this.opened.push(pg.url());
      await pg.close().catch(() => undefined);
    });
    await this.page.addLocatorHandler(this.campaignModal, async (m) => {
      await m.locator(".close-btn, .close").first().click({ force: true }).catch(() => undefined);
      await m.waitFor({ state: "hidden", timeout: 5000 }).catch(() => m.evaluate((e) => ((e as HTMLElement).style.display = "none")));
    });
    // The first frames of a fresh tab render at a fraction of the size; settle before the opening card.
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.setContent("<html><body style='margin:0;background:#172B4D'></body></html>");
    await this.page.waitForTimeout(600);
    this.log(`# ${this.id} — ${this.def?.situation ?? this.info.title}`);
    this.log(`# run ${this.runId} on staging /${this.inst}${this.phase ? ` (${this.phase})` : ""}, started ${myt()} MYT`);
    this.log(`# lines: when | point | expected | page shows | matches | screenshot`);
    await this.card(this.id, this.def?.situation ?? this.info.title, `staging /${this.inst} · ${myt()} MYT`);
  }

  /** eSim changes as steps of this TS: shown in the video, logged, and put back when the TS ends (./esim-step.ts). */
  get esim(): EsimStep {
    return (this.esimStep ??= new EsimStep((s) => this.note(s), (what, detail) => this.offscreen(what, detail)));
  }

  /** Steps in the REAL Firefox 36 (Selenium 2.53 bridge, window video, shots in this TS folder): ./ff36-step.ts. */
  get ff36(): Ff36Step {
    return (this.ff36Step ??= new Ff36Step(this));
  }

  /** The next numbered screenshot file name NN-<name>.png (shared with the Firefox 36 step). */
  numbered(name: string) {
    this.n += 1;
    return `${String(this.n).padStart(2, "0")}-${slug(name)}.png`;
  }

  // ---------------------------------------------------------------- on screen

  /** Full-screen title card (~2 s) on a blank page, so it is never mistaken for portal content. */
  async card(big: string, line2 = "", line3 = "", ms = 2200) {
    await this.page.setContent(`<html><body style="margin:0;background:#172B4D;color:#fff;font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="text-align:center;max-width:1500px"><div style="font-size:54px;font-weight:bold">${esc(big)}</div>
      <div style="font-size:30px;margin-top:22px">${esc(line2)}</div><div style="font-size:22px;margin-top:16px;opacity:.8">${esc(line3)}</div></div></body></html>`);
    await this.page.waitForTimeout(ms);
  }

  /**
   * Sign in on THIS tab behind a card: "ucd" = the lane's dealer, "bo" = BackOffice, "cibo" = the Secarang /
   * eAuto insurance back office (its own login page, CiboLoginPage; added 29.10.2026 for EAINT-12406), or any
   * persona key.
   */
  async portal(who: "ucd" | "bo" | PersonaKey, why = "") {
    const key: PersonaKey = who === "ucd" ? lanePersona() : who;
    if (PERSONAS[key].portal === "cibo") {
      // CIBO (Secarang's insurance back office) has its own login page, not eAuto's (pages/cibo/cibo-login.page.ts).
      await this.card("Now: CIBO", why, `signing in as ${key}`, 1800);
      await this.context.clearCookies();
      this.side = "CIBO";
      const how = await new CiboLoginPage(this.page).as(key);
      this.guard();
      await this.page.waitForTimeout(1200);
      this.note(`signed in: CIBO (${key})${how === "kept" ? " — this tab's own earlier CIBO session was still on (clearing cookies does not end it), the login page went straight to the dashboard" : ""}`);
      return;
    }
    const isBo = PERSONAS[key].portal === "bo";
    const portalName = isBo ? "BackOffice" : PERSONAS[key].portal === "aatf" ? "AATF" : "UCD";
    await this.card(`Now: ${portalName}`, why, `signing in as ${isBo ? "BO user" : key}`, 1800);
    await this.context.clearCookies();
    await new LoginPage(this.page).as(key);
    this.guard();
    this.side = isBo ? "BO" : `${portalName} (${key})`;
    if (!isBo) await new StmsWizardPage(this.page).dismissAnnouncements();
    await this.page.waitForTimeout(1200);
    this.note(`signed in: ${this.side}`);
  }

  /**
   * Open a public site with no user login on THIS tab, behind a card (EAINT-12406: the Secarang customer site;
   * the flow opens its home page and passes the site password page). Cookies are cleared, so the site password
   * page shows again and a CIBO session does not leak into the site.
   */
  async site(name: "Secarang", why = "") {
    await this.card(`Now: ${name}`, why, `${secarangBaseURL() ?? "(SECARANG_BASE_URL not set)"} · no user login`, 1800);
    await this.context.clearCookies();
    this.side = name;
    this.note(`on the site: ${name} (${secarangBaseURL() ?? "-"})`);
  }

  /**
   * Run `fn` while the SITE may open a payment window (Secarang's Fiuu popup), which the TS must leave open:
   * the site waits for that window to pay and close itself. Outside this, every new tab is closed and shown in
   * the main tab (open()). The window has its own video (Playwright records per tab); finish() lays it into the
   * TS video, picture-in-picture while it was open (Azfar 29.10.2026: ONE video per TS, the payment window included;
   * ./window-video.ts). Its own file goes to 04-runs/<RUN>/scratch/<TS>/, never to the evidence folder.
   */
  async payWindow<T>(what: string, fn: () => Promise<T>): Promise<T> {
    this.note(`payment window allowed: ${what}`);
    this.windowsOk = true;
    try { return await fn(); } finally { this.windowsOk = false; }
  }

  /**
   * Stop auto-closing campaign modals for the rest of this TS. A TS that must SEE a popup and close it
   * itself (EAINT-12253 Browser Reminder) calls this before the screen the popup appears on; otherwise the
   * `.modal-campaign` handler set up in start() could close it before the TS proves it.
   */
  async keepPopups() {
    await this.page.removeLocatorHandler(this.campaignModal);
    this.note("campaign pop-ups: no longer closed automatically for this TS");
  }

  /** Show a non-portal step (eSim change, waiting on Runnerku …) as a card so the video says what happened off screen. */
  async offscreen(what: string, detail = "") {
    await this.card(what, detail, myt() + " MYT", 1800);
    this.note(`off screen: ${what}${detail ? ` — ${detail}` : ""}`);
  }

  /** Click something that may open a new tab. If it did, its address is opened in this tab. Return with back(). */
  async open(el: Locator, label = "") {
    const before = this.opened.length;
    await el.scrollIntoViewIfNeeded().catch(() => undefined);
    await el.click();
    await this.page.waitForTimeout(2500);
    if (this.opened.length > before) {
      const u = this.opened[this.opened.length - 1];
      this.note(`${label || "link"} opens a new tab (${u}); shown in the same tab for the video`);
      if (/^https?:/.test(u)) await this.page.goto(u).catch(() => undefined);
      await this.page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
      return { newTab: true, url: u };
    }
    await this.page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    return { newTab: false, url: this.page.url() };
  }

  async back() {
    await this.page.goBack().catch(() => undefined);
    await this.page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    await this.page.waitForTimeout(1000);
  }

  /** Accept confirm boxes only while fn runs (an Export / Download that asks "Are you sure?"). */
  async allowConfirm<T>(fn: () => Promise<T>): Promise<T> {
    this.confirmOk = true;
    try { return await fn(); } finally { this.confirmOk = false; }
  }

  takeDialogs() { const d = this.dialogs.join(" || "); this.dialogs = []; return d; }

  // ---------------------------------------------------------------- files

  /** Save a download into the TS folder's downloadable[ (before|after)]/. */
  async download(dl: Download, name?: string) {
    const dir = path.join(this.dir, this.phase === "pre-push" ? "downloadable (before)" : this.phase === "post-push" ? "downloadable (after)" : "downloadable");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, name ?? dl.suggestedFilename());
    await dl.saveAs(file);
    this.note(`downloaded: ${path.basename(file)}`);
    return file;
  }

  /** Show a saved file on screen in this tab so the video shows what was downloaded (image, CSV table, or a PDF's text). */
  async showFile(file: string, heading: string, pdfText?: string) {
    const ext = path.extname(file).toLowerCase();
    let body = "";
    if (/\.(png|jpe?g)$/.test(ext)) body = `<img style="max-width:100%" src="data:image/${ext === ".png" ? "png" : "jpeg"};base64,${fs.readFileSync(file).toString("base64")}">`;
    else if (ext === ".csv") body = `<table border=1 cellpadding=4 style="border-collapse:collapse;font:12px Arial">${fs.readFileSync(file, "utf8").split(/\r?\n/).slice(0, 40).map((l) => `<tr>${l.split(",").map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    else body = `<pre style="white-space:pre-wrap;font:14px Consolas">${esc(pdfText ?? `(${path.basename(file)} saved, ${fs.statSync(file).size} bytes)`)}</pre>`;
    await this.page.setContent(`<html><body style="margin:20px;font-family:Arial"><h2 style="background:#172B4D;color:#fff;padding:10px">${esc(heading)} - ${esc(path.basename(file))}</h2>${body}</body></html>`);
    await this.page.waitForTimeout(2500);
  }

  // ---------------------------------------------------------------- evidence

  /** Numbered screenshot NN-<name>.png with outlines and a bottom banner (when, where, which TS, what it shows). */
  async shot(name: string, what: string, hl?: Locator | Locator[] | null) {
    this.guard();
    const file = this.numbered(name);
    const marks = Array.isArray(hl) ? hl : hl ? [hl] : [];
    let first = true;
    for (const m of marks) {
      if (!(await m.count().catch(() => 0))) continue;
      if (first) { await m.first().evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" })).catch(() => undefined); first = false; }
      await m.first().evaluate((e) => {
        const r = e.getBoundingClientRect();
        const d = document.createElement("div"); d.className = "qa-mark";
        Object.assign(d.style, { position: "absolute", left: r.left + scrollX - 4 + "px", top: r.top + scrollY - 4 + "px", width: r.width + 8 + "px", height: r.height + 8 + "px", border: "3px solid #DE350B", borderRadius: "3px", zIndex: "999998", pointerEvents: "none" });
        document.body.appendChild(d);
      }).catch(() => undefined);
    }
    await this.page.evaluate((t) => {
      const b = document.createElement("div"); b.className = "qa-mark"; b.textContent = t;
      Object.assign(b.style, { position: "fixed", left: "0", right: "0", bottom: "0", background: "#172B4D", color: "#fff", font: "bold 13px Arial", padding: "4px 10px", zIndex: "999999" });
      document.body.appendChild(b);
    }, `${myt()} MYT · staging/${this.inst} · ${this.side} · ${pathOf(this.page.url())} · ${this.id} · ${what}`).catch(() => undefined);
    await this.page.waitForTimeout(1200); // held on screen so the video shows it too
    await this.page.screenshot({ path: path.join(this.dir, file) });
    await this.page.evaluate(() => document.querySelectorAll(".qa-mark").forEach((e) => e.remove())).catch(() => undefined);
    return file;
  }

  /**
   * Prove one expected point: record what the page shows against it, take the
   * screenshot, and soft-assert the match (the TS carries on to its other points).
   */
  async prove(point: string, o: ProveOptions): Promise<Proof>;
  /** Contract form for a Firefox 36 step: ts.prove("E3", step.state === "shown", step.shot!, "what it shows"). */
  async prove(point: string, match: boolean, file: string, shows: string): Promise<Proof>;
  async prove(point: string, a: ProveOptions | boolean, file?: string, shows?: string): Promise<Proof> {
    const o: ProveOptions = typeof a === "boolean" ? { match: a, file, shows: shows ?? "" } : a;
    const p = this.def?.points.find((x) => x.id === point);
    if (this.def && !p) throw new Error(`${this.id} has no expected point ${point} (points: ${this.def.points.map((x) => x.id).join(", ") || "none"}).`);
    const expected = o.expected ?? p?.text ?? "";
    if (o.file && !fs.existsSync(o.file)) throw new Error(`${this.id} ${point}: screenshot ${o.file} does not exist`);
    const shot = o.file ? path.basename(o.file) : o.shot === false ? undefined : await this.shot(o.name ?? point, `${point}: ${o.shows}`.slice(0, 160), o.hl);
    const ff = o.file ? this.shotUrls.get(o.file) : undefined;
    const url = o.file ? pathOf(ff?.url ?? "") : pathOf(this.page.url());
    const proof: Proof = { point, expected, shows: o.shows, match: o.match, shot, at: myt(), url, side: ff?.side ?? this.side };
    this.proofs.push(proof);
    this.log(`${proof.at} | ${point} | expected: ${expected.replace(/\s+/g, " ")} | page shows: ${o.shows} | ${o.match ? "matches" : "DOES NOT MATCH"}${shot ? ` | ${shot}` : ""}`);
    expect.soft(o.match, `${PROOF_TAG} ${this.id} ${point}: expected "${expected}", page shows "${o.shows}"`).toBe(true);
    return proof;
  }

  note(text: string) {
    this.notes.push(text);
    this.log(`${myt()} | note: ${text}`);
  }

  private log(line: string) {
    fs.appendFileSync(path.join(this.dir, "checks.txt"), line + "\n");
  }

  /** Every screenshot must be on the ticket's instance (EAINT-12403: a run that silently hit the wrong branch). */
  private guard() {
    const u = this.page.url();
    // Secarang and CIBO live on their own host (config/environments.ts): checked against their own roots.
    const own = this.side === "CIBO" ? ciboBaseURL() : this.side === "Secarang" ? secarangBaseURL() : undefined;
    if (own) {
      if (u.startsWith("http") && !u.startsWith(own)) throw new WrongInstance(`URL is not under ${own}: ${u}`);
      return;
    }
    // The onboarding surface (Pre-Application, the Application form, BackOffice's onboarding listings) is
    // https://<host>/obs/ for EVERY instance (config/environments.ts obsURL): it pairs with the instance, it is not
    // another one (EAINT-11868, Azfar 28.10.2026: forms on /obs/, BackOffice on /eauto/). Same host only.
    const obsRoot = process.env.BASE_URL ? `https://${process.env.BASE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/obs/` : "";
    if (obsRoot && u.startsWith(obsRoot)) return;
    if (this.inst && u.startsWith("http") && !u.includes(`/${this.inst}/`) && !u.includes("/doc/"))
      throw new WrongInstance(`URL is not /${this.inst}/: ${u}`);
  }

  // ---------------------------------------------------------------- the gate

  /** Close the tab (the video is only complete then), judge the TS, file it. */
  async finish(): Promise<GateResult> {
    const notRestored = this.esimStep ? await this.esimStep.restoreAll() : [];
    const stopped = hardErrors(this.info).length > 0;
    await this.card(`End of ${this.id}`, stopped ? "stopped early — see checks.txt" : "", myt() + " MYT", 1200).catch(() => undefined);
    const video = this.page.video();
    await this.page.close().catch(() => undefined);
    const src = video ? await video.path().catch(() => "") : "";
    const mainVideo = path.join(this.dir, `video_${this.id}.webm`);
    if (src && fs.existsSync(src)) fs.copyFileSync(src, mainVideo);
    // Payment windows: into the one TS video (nothing happens when none opened).
    const videoProblems: string[] = [];
    if (this.winVideos.count) {
      const scratch = this.ticket
        ? path.join(REPO, "cr", this.ticket, "04-runs", this.runId, "scratch", this.id)
        : path.join(REPO, "automation", ".artifacts", "ts-scratch", this.runId, this.id);
      const m = await this.winVideos.merge(mainVideo, scratch);
      for (const d of this.winVideos.describe()) this.note(d);
      this.note(m.merged ? `payment window video laid into video_${this.id}.webm (${m.merged} window(s), picture-in-picture, bottom right)` : "payment window video NOT laid into the TS video");
      for (const p of m.problems) this.note(`video: ${p}`);
      if (m.merged < this.winVideos.count) videoProblems.push(`payment window not in the TS video (${m.problems.join("; ") || "not merged"}); its own file is in ${scratch}`);
    }
    const judged = judge(this, hashOf(loadTsDefs()?.[this.id]));
    const result = videoProblems.length && judged.verdict === "VALID" ? { verdict: "EVIDENCE" as GateVerdict, reasons: [...judged.reasons, ...videoProblems] } : judged;
    fs.writeFileSync(path.join(this.dir, "proofs.json"), JSON.stringify({ ts: this.id, run: this.runId, instance: this.inst, proofs: this.proofs, notes: this.notes, opened: this.opened }, null, 2));
    return file(this, result, notRestored.map((x) => `eSim NOT put back — fix by hand: ${x}`));
  }

  /** Was the TS edited (steps, expected, points) between the start of the run and now? */
  changed(endHash: string) { return !!this.startHash && endHash !== this.startHash; }
}

class WrongInstance extends Error {}

/** Marks a soft assertion made by prove(), so the gate can tell a recorded mismatch from a crash. */
const PROOF_TAG = "[proof]";
const hardErrors = (info: TestInfo) => info.errors.filter((e) => !(e.message ?? "").includes(PROOF_TAG));

export type GateVerdict = "VALID" | "DEFECT" | "EVIDENCE" | "SCRIPT" | "ENV" | "CHANGED" | "NO_TS";

export interface GateResult {
  ts: string;
  verdict: GateVerdict;
  reasons: string[];
  folder: string;
  run: string;
  instance: string;
  at: string;
  /** Things to fix that do not change the verdict (an eSim value not put back). */
  warnings: string[];
}

const ENV_PATTERN = /net::ERR_|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH|socket hang up|Target page, context or browser has been closed|eSim .*(unreachable|timeout)|VPN/i;
/**
 * Firefox 36 bridge failures that ARE the environment: the bridge / Firefox / recorder did not start ("start: …", "Firefox 36
 * window not found", "ffmpeg window capture did not start", no result file, no window video), the driver connection dropped,
 * a VPN drop, or the login page itself not there (404 / no username box). Anything else the bridge reports ("step N (click)
 * failed", element not clickable, no listing row, a wait that found nothing, …) is a SCRIPT fault. Until 21.10.2026 every
 * "FF36 bridge" error was ENV and re-run automatically, which paid twice (FF_TS8 eSTM RM148.60, FF_TS7 STMS RM37.00).
 */
const FF36_ENV_PATTERN = new RegExp([
  String.raw`FF36 bridge: (start:|no result \(exit|no window video)`,
  String.raw`FF36 bridge: .*(Firefox 36 window not found|ffmpeg window capture did not start|WinError 1006[01]|Connection refused|RemoteDisconnected|BadStatusLine|URLError|VPN)`,
  String.raw`FF36 bridge: step \d+ \(login\) failed: [^|]*(NoSuchElementException|Unable to locate element|\b404\b|Not Found)`,
].join("|"), "i");
/** A Firefox 36 bridge error is judged by FF36_ENV_PATTERN only (its step text can carry words ENV_PATTERN would match). */
const isEnvFailure = (err: string) => (/FF36 bridge:/.test(err) ? FF36_ENV_PATTERN.test(err) : ENV_PATTERN.test(err));

/** The machine check, in order of what matters most. */
function judge(r: TsRun, endHash: string): { verdict: GateVerdict; reasons: string[] } {
  const reasons: string[] = [];
  const err = hardErrors(r.info).map((e) => e.message ?? String(e.value ?? "")).join(" | ");
  const mismatches = r.proofs.filter((p) => !p.match);

  if (!r.def) return { verdict: "NO_TS", reasons: [`${r.id} is not in cr/${r.ticket}/01-intake/ts.json — no expected points to prove against (run scripts/cr-ts-snapshot.py)`] };
  if (r.changed(endHash)) reasons.push("the TS was edited on the board while it ran — RE-RUN, never PASS");
  if (reasons.length) return { verdict: "CHANGED", reasons };
  if (/WrongInstance|URL is not (\/|under )/.test(err)) return { verdict: "ENV", reasons: [`wrong instance: ${err.slice(0, 200)}`] };
  if (mismatches.length)
    return { verdict: "DEFECT", reasons: [
      ...mismatches.map((m) => `${m.point}: expected "${m.expected.replace(/\s+/g, " ").slice(0, 160)}", page shows "${m.shows}"${m.shot ? ` (${m.shot})` : ""}`),
      ...(err ? [`and the run then stopped: ${err.split("\n")[0].slice(0, 200)}`] : []),
    ] };
  if (err) return { verdict: isEnvFailure(err) ? "ENV" : "SCRIPT", reasons: [`stopped before the end: ${err.split("\n")[0].slice(0, 300)}`] };
  // A TS with NO expected result has nothing to prove: what its run recorded is OBSERVED, never PASS (cr-author; and
  // cr-ts-snapshot.py: "the gate then refuses it"). Until 30.10.2026 such a TS fell through to VALID (EAINT-11868 found
  // it: 5 Emails TS with the expected left blank on open questions). The QA judges the recording.
  if (!r.def.points.length)
    return { verdict: "EVIDENCE", reasons: ["OBSERVED only: the TS has no expected result (left blank on an open question), so nothing was proved; the recording is for the QA to judge, never PASS"] };
  const missing = r.def.points.filter((p) => !r.proofs.some((x) => x.point === p.id && x.match && (x.shot || x.shows)));
  if (missing.length) reasons.push(`no proof for ${missing.map((p) => p.id).join(", ")}`);
  const unshot = r.def.points.filter((p) => r.proofs.some((x) => x.point === p.id) && !r.proofs.some((x) => x.point === p.id && x.shot));
  if (unshot.length) reasons.push(`no screenshot for ${unshot.map((p) => p.id).join(", ")}`);
  const v = path.join(r.dir, `video_${r.id}.webm`);
  if (!fs.existsSync(v)) reasons.push("no video");
  else if (fs.statSync(v).size < 50_000) reasons.push(`video is only ${fs.statSync(v).size} bytes`);
  return reasons.length ? { verdict: "EVIDENCE", reasons } : { verdict: "VALID", reasons: [] };
}

/** VALID → 05-evidence/[phase/]<TS>/ (a previous valid copy is kept in 04-runs/_replaced/); anything else → 05-evidence/FAILED/<TS>/<when>/. */
function file(r: TsRun, j: { verdict: GateVerdict; reasons: string[] }, warnings: string[] = []): GateResult {
  const at = myt();
  const out: GateResult = { ts: r.id, verdict: j.verdict, reasons: j.reasons, folder: r.dir, run: r.runId, instance: r.inst, at, warnings };
  if (!r.ticket) {
    fs.writeFileSync(path.join(r.dir, "gate.json"), JSON.stringify(out, null, 2));
    return out;
  }
  const crDir = path.join(REPO, "cr", r.ticket);
  const ev = path.join(crDir, "05-evidence");
  let dest: string;
  if (j.verdict === "VALID") {
    dest = path.join(ev, ...(r.phase ? [r.phase] : []), r.id);
    if (fs.existsSync(dest)) {
      const old = path.join(crDir, "04-runs", "_replaced", `${r.id}_${fileStamp()}`);
      fs.mkdirSync(path.dirname(old), { recursive: true });
      // A folder open in Explorer cannot be renamed on Windows: copy it aside, then empty it.
      try { fs.renameSync(dest, old); } catch {
        fs.cpSync(dest, old, { recursive: true });
        for (const f of fs.readdirSync(dest)) fs.rmSync(path.join(dest, f), { recursive: true, force: true });
      }
    }
  } else {
    dest = path.join(ev, "FAILED", r.id, `${fileStamp()}_${j.verdict}`);
    fs.writeFileSync(path.join(r.dir, "reason.txt"),
      `${r.id} — ${label(j.verdict)}\nrun ${r.runId}, staging /${r.inst}, ${at} MYT\n\n${j.reasons.map((x) => `- ${x}`).join("\n")}\n`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(r.dir, dest, { recursive: true });
  out.folder = path.relative(REPO, dest).split(path.sep).join("/");
  fs.writeFileSync(path.join(dest, "gate.json"), JSON.stringify(out, null, 2));
  fs.appendFileSync(path.join(crDir, "04-runs", r.runId, "gate.jsonl"), JSON.stringify(out) + "\n");
  console.log(`[gate] ${r.id}: ${j.verdict}${j.reasons.length ? ` — ${j.reasons.join("; ")}` : ""} → ${out.folder}`);
  for (const w of warnings) console.log(`[gate] ${r.id}: WARNING ${w}`);
  return out;
}

function label(v: GateVerdict) {
  return {
    VALID: "valid",
    DEFECT: "FAIL — the page does not match the expected result (a defect until triage says otherwise)",
    EVIDENCE: "evidence not valid — a point has no proof, no screenshot, or no video (re-run)",
    SCRIPT: "the script stopped before the end (spec problem — fix and re-run)",
    ENV: "environment — VPN / network / wrong instance (re-run once automatically)",
    CHANGED: "the TS changed while it ran (re-run)",
    NO_TS: "TS not in the snapshot — no expected points",
  }[v];
}
