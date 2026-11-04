// @ticket   EAINT-12406
// @sheet    QT (2 Quotation)
// @cases    12406_QT_TS7
// @env      Secarang staging /ia/ (INSTANCE=ia; SECARANG_BASE_URL / SECARANG_BASE_PATH from env/.staging.env-local)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml v5, meta.approved_by: Azfar 29.10.2026; points
// E1-E6 from 01-intake/ts.json 29.10 13:00). NOT run. Every point is proved with ts.prove() in the TS's words, except
// where a document cannot be read by the script (see CLAIM GUIDE below): that point is left for the QA, never guessed.
// Fixed 29.10.2026 (evening) after triage of run sQT-1545-c2 (cr-author): follow() reads the tab THAT click opened
// (the declaration's "Privacy Notice" had been recorded as the previous click's Product Disclosure PDF), and every
// document's first page is drawn and screenshotted as shown, the Claim Guide included (judged by eye). Points unchanged.
//
// Expected: SRD v1.1 §2.2.5 REQ-006 ("policy wording, product disclosure sheet, privacy notice, claim guide) are dated
// 2022 ... use existing documents"; Example 1a "Existing Allianz documents in system are displayed"). Plan Details and
// the Excess info content are recorded only (SRD silent, Q15).
//
// Journey: flow secarang (VERIFIED 29.10.2026, src/flows/README.md) to `confirmation` with insurer Allianz: Home > the
// car > All Quotations > Buy Allianz > Add-ons (default) > Continue > Confirmation, owner filled, Confirm and Pay NOT
// pressed. Reaching Add-ons / Confirmation creates a CIBO record (team doc §6), so @destructive. Nothing is paid.
// This file only opens the info boxes and links on the screens the flow stops at (onStep "quotations" and "confirmation").
//
// Where Secarang offers the Allianz documents (seen 29.10.2026, read only: probe
// 03-spec/probes-automation/confirmation-controls.probe.spec.ts and the verify run fx5, cr/EAINT-12406/04-runs/):
//   - the Allianz card's [Plan Details] pop-up and Confirmation's [Plan Details] pop-up: "Product Disclosure", "Claim Guide",
//     "Policy Wording", "Car Roadside Assistance Terms & Condition" (each listed twice in the pop-up; the visible one is
//     clicked), all PDFs under /ia/assets/documents/allianz-*.pdf, target _blank;
//   - Confirmation's declaration line "By continuing, you agree ...": "Product Disclosure Sheet" and "Privacy Notice"
//     (PDFs) plus Secarang's own "Privacy Policy" / "Terms of Use" pages (recorded, not Allianz documents);
//   - Confirmation's Excess 'i': a pop-up with text and Close, no link (fx5).
// How a link is followed: it is clicked; the address of the tab THAT click opened is read (the popup of this tab, or a
// request made by that popup; fixed 29.10.2026: any tab's request was taken before, so "Privacy Notice" was recorded as
// the previous click's Product Disclosure PDF). The ts fixture closes the new tab. The main tab is NOT sent to the PDF with ts.open(): a PDF in the main tab is a
// download in headless Chromium, and coming back would leave Confirmation. After the journey each document is fetched
// (same session), saved into the TS folder, and shown in this tab with ts.showFile (its text, read by pdftotext), so
// the video shows every document; the proofs are taken on that screen. Before its text, each document's FIRST PAGE is
// drawn (PyMuPDF) and screenshotted as a reader sees it (29.10.2026 triage): the Claim Guide is judged by eye from it.
//
// CLAIM GUIDE (read-only fetch 29.10.2026): allianz-claim-guide-en.pdf has NO text layer (2 pages of outlined artwork, no
// fonts; metadata Title "13015_BNM 2019_Brochure 2_ENG_FA_OL", created 2019-11-21, modified 2021-08-11), and this PC has
// no OCR. Its date, insurer and title cannot be read by the script: E4, and E5 / E6 for its links, are then NOT proved
// (the gate files the TS as EVIDENCE, not PASS) unless another document already fails them. Question to the QA.
// Seen in the same fetch, for the QA (not judged here): Policy Wording "PCar/PL-Ver1.4/03 March 2022"; Product Disclosure
// Sheet "valid as at 03/06/2020"; Privacy Notice "Last updated on 3 March 2020".
//
// Data: made-up plate HXA0017A (team range HXA0001A-HXA0020A, team doc §13; not used by any other spec of this ticket),
// SECARANG_PLATE_12406_QT_TS7 overrides; IC from @data/secarang. Owner = secarangOwner() (the QA's own phone / email).

import { test, expect, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execFileSync } from "node:child_process";
import type { Locator, Page, Request } from "@playwright/test";
import { runSecarangFlow, type SecarangResult, type SecarangStep } from "@flows/secarang.flow";
import { SecarangQuotationsPage } from "@pages/secarang/quotations.page";
import { SecarangConfirmationPage } from "@pages/secarang/confirmation.page";
import type { SecarangPage, SecarangInfo } from "@pages/secarang/secarang.page";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";

const ID = "12406_QT_TS7";
const PLATE = (process.env[`SECARANG_PLATE_${ID}`] ?? "").trim().toUpperCase() || "HXA0017A";
const ALLIANZ = "Allianz";

// ------------------------------------------------------------------ what each document is (reading only)

/**
 * The four documents of REQ-006, by the point that proves each. `label` = the link names Secarang uses for it; `title` =
 * how the document names itself on its first page (seen in the read-only fetch 29.10.2026; the claim guide's own title
 * could not be read, its pattern is the plain name).
 */
const DOCS = [
  { point: "E1", name: "Policy wording", label: /^policy wording$/i, title: /Private Car Policy|Policy Wording/i },
  { point: "E2", name: "Product disclosure sheet", label: /^product disclosure( sheet)?$/i, title: /Product Disclosure Sheet/i },
  { point: "E3", name: "Privacy notice", label: /^privacy notice$/i, title: /Privacy Notice|Personal Data Protection Act/i },
  { point: "E4", name: "Claim guide", label: /^claims? guide$/i, title: /Claims? Guide|how to (make|file) a claim/i },
] as const;
/** Other Allianz documents a link may name (for E5 "the document it names"). */
const OTHER_DOCS = [{ name: "Car Roadside Assistance Terms & Condition", label: /roadside assistance/i, title: /Road\s*Side|Roadside/i }];
const kindOf = (label: string) => [...DOCS, ...OTHER_DOCS].find((d) => d.label.test(label.trim()));

/** Insurers other than Allianz (Secarang's others and the common Malaysian ones). "Menara Takaful Malaysia" is an address, so only "Syarikat Takaful". */
const OTHER_INSURER = /\b(Lonpac|Tokio Marine|Zurich|Etiqa|AIG|MSIG|AXA|Berjaya Sompo|Liberty Insurance|Chubb|Pacific & Orient|RHB Insurance|AmGeneral|AmAssurance|Generali|Syarikat Takaful)\b/gi;
const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";
/** Dates written in a document: 03/06/2020, 03 March 2022, March 2022 (an Act's year, "Act 2013", is not a date). */
const DATE = new RegExp(`\\b\\d{1,2}[/.-]\\d{1,2}[/.-](20\\d\\d)\\b|\\b(?:\\d{1,2}\\s+)?${MONTH}\\s+(20\\d\\d)\\b`, "gi");

function pdftotext(file: string): string {
  const bins = [process.env.PDFTOTEXT, "C:/Program Files/Git/mingw64/bin/pdftotext.exe", "pdftotext"].filter(Boolean) as string[];
  for (const bin of bins) {
    try {
      return execFileSync(bin, ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    } catch {
      /* next */
    }
  }
  throw new Error(`pdftotext not found to read ${file} (set PDFTOTEXT)`);
}

/**
 * The PDF's first page drawn as a PNG beside it (PyMuPDF 1.28 on this PC, the file passed as an argument), so the
 * video and a screenshot show the page as a reader sees it. Needed for the Claim Guide, which has no text layer and is
 * judged by eye (29.10.2026 triage). "" when it cannot be drawn (the text view still follows; noted).
 */
function firstPagePng(pdf: string): { png: string; error?: string } {
  const png = pdf.replace(/\.pdf$/i, "") + "-first-page.png";
  const code = [
    "import sys, pymupdf",
    "d = pymupdf.open(sys.argv[1]); p = d[0]",
    "z = min(900 / p.rect.height, 1700 / p.rect.width)",
    "p.get_pixmap(matrix=pymupdf.Matrix(z, z)).save(sys.argv[2])",
  ].join("\n");
  for (const bin of [process.env.PYTHON, "python", "py"].filter(Boolean) as string[]) {
    try {
      // -E -P: no PYTHON* variables, no current folder on the import path (the PDF is a downloaded file); run from the temp folder
      execFileSync(bin, ["-E", "-P", "-c", code, pdf, png], { encoding: "utf8", timeout: 60_000, cwd: os.tmpdir() });
      if (fs.existsSync(png)) return { png };
    } catch (e) {
      if (bin === "py") return { png: "", error: String(e).split("\n")[0] };
    }
  }
  return { png: "", error: "no python with pymupdf (set PYTHON)" };
}

interface Doc {
  url: string;
  file: string;
  isPdf: boolean;
  /** false: no text layer (the script cannot read it; the QA judges by eye). */
  readable: boolean;
  text: string;
  /** The first ~3000 characters: where a document names itself and its issuer. */
  head: string;
  dates: string[];
  allianz: boolean;
  otherInsurers: string[];
  meta: string;
  error?: string;
}

async function fetchDoc(ts: TsRun, url: string): Promise<Doc> {
  const name = decodeURIComponent(url.split("?")[0].split("/").pop() || "document.pdf");
  const file = path.join(ts.dir, "downloadable", name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const res = await ts.page.request.get(url).catch((e) => e as Error);
  if (res instanceof Error || !res.ok()) {
    const error = res instanceof Error ? res.message.split("\n")[0] : `HTTP ${res.status()}`;
    return { url, file, isPdf: false, readable: false, text: "", head: "", dates: [], allianz: false, otherInsurers: [], meta: "", error };
  }
  const body = await res.body();
  fs.writeFileSync(file, body);
  ts.note(`document saved: ${path.basename(file)} (${body.length} bytes) from ${url}`);
  const isPdf = body.subarray(0, 5).toString("latin1") === "%PDF-";
  const raw = body.toString("latin1");
  const meta = (["Title", "CreationDate", "ModDate"] as const)
    .map((k) => `${k} ${(new RegExp(`/${k}\\s*\\(([^)]{0,120})\\)`).exec(raw) || ["", "(none)"])[1]}`)
    .join("; ");
  const text = isPdf ? pdftotext(file) : "";
  const readable = text.replace(/\s/g, "").length > 200;
  const head = text.slice(0, 3000);
  const dates = [...new Set([...text.matchAll(DATE)].map((m) => m[0].replace(/\s+/g, " ").trim()))];
  const otherInsurers = [...new Set([...text.matchAll(OTHER_INSURER)].map((m) => m[0]))];
  return { url, file, isPdf, readable, text, head, dates, allianz: /Allianz/i.test(head), otherInsurers, meta };
}

const docLine = (d: Doc | undefined) =>
  !d
    ? "not fetched"
    : d.error
      ? `could not be fetched (${d.error})`
      : !d.isPdf
        ? "NOT a PDF"
        : !d.readable
          ? `a PDF with NO readable text (${d.meta})`
          : `names Allianz: ${d.allianz ? "yes" : "NO"}; dates in it: ${d.dates.slice(0, 6).join(", ") || "none"}; other insurers named: ${d.otherInsurers.join(", ") || "none"}`;

// ------------------------------------------------------------------ following a link (no journey: one click, read the address)

type Where = "card Plan Details" | "Confirmation Plan Details" | "Confirmation Excess 'i'" | "Confirmation declaration";
interface Clicked {
  where: Where;
  text: string;
  href: string;
  /** The address the browser asked for after the click ("" when nothing was asked for). */
  opened: string;
  newTab: boolean;
}

/** The page a request belongs to (null for a request with no frame, e.g. a service worker's). */
const pageOf = (r: Request): Page | null => {
  try {
    return r.frame().page();
  } catch {
    return null;
  }
};

/**
 * Click `link` and read the address of the tab THIS click opened (or of this tab, if the click moved it). The ts fixture
 * closes the new tab; a same-tab move is undone.
 * Fixed 29.10.2026 after triage of run sQT-1545-c2: the old version took the first navigation request of ANY tab in the
 * context, so the declaration's "Privacy Notice" (href allianz-privacy-notice.pdf) was recorded as the previous
 * click's allianz-product-disclosure-en.pdf, still loading in its own tab. Now: the popup event of this tab after this
 * click (waited for in full, so no popup is left over for the next click), and only a request made BY that popup.
 */
async function follow(ts: TsRun, link: Locator, where: Where, text: string, href: string): Promise<Clicked> {
  const before = ts.page.url();
  const asked: Request[] = [];
  const onRequest = (r: Request) => {
    if (r.isNavigationRequest() && /^https?:/.test(r.url())) asked.push(r);
  };
  ts.context.on("request", onRequest);
  try {
    const popupP = ts.page.waitForEvent("popup", { timeout: 15_000 }).catch(() => null);
    await link.scrollIntoViewIfNeeded().catch(() => undefined);
    await link.click();
    const tab = await popupP;
    let opened = "";
    if (tab) {
      // the popup's own address, else the first navigation request made by the popup itself
      for (let i = 0; i < 40 && !opened; i++) {
        const u = tab.url();
        if (/^https?:/.test(u)) opened = u;
        else opened = asked.find((r) => pageOf(r) === tab)?.url() ?? "";
        if (!opened) await ts.page.waitForTimeout(250);
      }
    } else if (ts.page.url() !== before) {
      opened = ts.page.url();
    }
    const newTab = !!tab;
    ts.note(`${where} > "${text}": ${opened ? `opened ${opened} in ${newTab ? "a new tab" : "THIS tab"}` : newTab ? "a new tab opened, its address not read" : "nothing opened"} (link address ${href})`);
    if (!newTab && ts.page.url() !== before) await ts.back();
    return { where, text, href, opened, newTab };
  } finally {
    ts.context.off("request", onRequest);
  }
}

/**
 * The info box is open (`info`): screenshot it, then follow every distinct visible link in it. `reopen` opens it again
 * when a click closed it. Closes it at the end.
 */
async function followInfo(ts: TsRun, po: SecarangPage, where: Where, info: SecarangInfo, reopen: () => Promise<SecarangInfo>): Promise<Clicked[]> {
  ts.note(`${where}: ${info.kind} (by ${info.via}); content (recorded, Q15): "${info.text.slice(0, 900)}"`);
  const distinct = [...new Map(info.links.map((l) => [`${l.text}|${l.href}`, l])).values()];
  await ts.shot(`${where.toLowerCase().replace(/\W+/g, "-")}-open`, `${where}: ${info.kind}, ${distinct.length} link(s): ${distinct.map((l) => l.text).join(", ") || "none"}`, po.infoBox());
  const out: Clicked[] = [];
  for (const l of distinct) {
    if (!(await po.infoBox().isVisible().catch(() => false))) await reopen();
    const link = po.infoLink(l.text);
    if (!(await link.isVisible().catch(() => false))) {
      ts.note(`${where} > "${l.text}" (${l.href}): only in a hidden copy, not clicked`);
      continue;
    }
    out.push(await follow(ts, link, where, l.text, l.href));
  }
  await po.closeInfo();
  return out;
}

// ------------------------------------------------------------------ the test

test.describe("EAINT-12406 QT — Allianz documents (staging /ia/)", () => {
  test.skip(process.env.TEST_ENV === "production", "staging row (QT sheet): /ia/ only");

  test("12406_QT_TS7 — Allianz documents open: policy wording, product disclosure sheet, privacy notice, claim guide; Plan Details and Excess links open Allianz documents", { tag: ["@P2", "@e2e", "@sheet-QT", "@destructive"] }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const clicked: Clicked[] = [];
    const opened: Partial<Record<Where, SecarangInfo>> = {};

    // Steps 1-4: the flow walks Home > All Quotations > Buy Allianz > Add-ons (default) > Confirmation; this file opens
    // the info boxes and links on the two screens the TS is about.
    await ts.site("Secarang", `Allianz quotation for car ${PLATE}, then Confirmation (Add-ons default; Confirm and Pay NOT pressed)`);
    const r: SecarangResult = await runSecarangFlow(ts.page, {
      form: secarangQuoteForm(PLATE),
      insurer: ALLIANZ,
      owner: secarangOwner(),
      stopAfter: "confirmation",
      onStep: async (st: SecarangStep, x: SecarangResult) => {
        if (st === "quotations") {
          // Step 3: the Allianz card's [Plan Details], every link inside
          const q = new SecarangQuotationsPage(ts.page);
          const az = (x.quotations ?? []).find((c) => /allianz/i.test(c.insurer));
          expect(az?.available, `All Quotations: no Allianz quotation for ${PLATE} (cards: ${(x.quotations ?? []).map((c) => `${c.insurer}${c.available ? "" : " unavailable"}`).join(", ")}): wrong data, the TS needs an Allianz quotation`).toBe(true);
          const info = await q.planDetails(ALLIANZ);
          opened["card Plan Details"] = info;
          clicked.push(...(await followInfo(ts, q, "card Plan Details", info, () => q.planDetails(ALLIANZ))));
        }
        if (st === "confirmation") {
          // Step 4: Confirmation's [Plan Details] and the Excess 'i', every link inside; step 2: the declaration's document links
          const c = new SecarangConfirmationPage(ts.page);
          const pd = await c.planDetails();
          opened["Confirmation Plan Details"] = pd;
          clicked.push(...(await followInfo(ts, c, "Confirmation Plan Details", pd, () => c.planDetails())));
          const ex = await c.excessInfo();
          opened["Confirmation Excess 'i'"] = ex;
          clicked.push(...(await followInfo(ts, c, "Confirmation Excess 'i'", ex, () => c.excessInfo())));
          const decl = await c.declarationLinks();
          ts.note(`Confirmation declaration links: ${decl.map((l) => `"${l.text}" -> ${l.href}`).join("; ")}`);
          await ts.shot("confirmation-declaration-links", `Confirmation declaration: ${decl.map((l) => l.text).join(", ")}`, c.declaration());
          for (const l of decl.filter((d) => /\.pdf(\?|$)/i.test(d.href))) {
            clicked.push(await follow(ts, c.declarationLink(l.text), "Confirmation declaration", l.text, l.href));
          }
          for (const l of decl.filter((d) => !/\.pdf(\?|$)/i.test(d.href))) ts.note(`declaration link "${l.text}" -> ${l.href}: a Secarang page, not an Allianz document (recorded, not opened)`);
        }
      },
    });
    ts.note(`on Confirmation: ${JSON.stringify(Object.fromEntries(Object.entries(r.confirmation ?? {}).filter(([k]) => /^(Insurer|Plan|Excess|Total Premium)$/.test(k))))}`);

    // Every document the links opened: fetched in this session, saved in the TS folder, shown in this tab.
    const urls = [...new Set(clicked.map((c) => c.opened).filter(Boolean))];
    const docs = new Map<string, Doc>();
    for (const u of urls) docs.set(u, await fetchDoc(ts, u));
    const doc = (c: Clicked) => (c.opened ? docs.get(c.opened) : undefined);
    const from = (u: string) => clicked.filter((c) => c.opened === u).map((c) => `${c.where} "${c.text}"`).join("; ");
    /** url → the screenshot of its first page (for the QA's look, the Claim Guide's above all). */
    const firstPageShot = new Map<string, string>();
    const show = async (u: string) => {
      const d = docs.get(u)!;
      // 1) the first page as a reader sees it (screenshot each document; the Claim Guide is judged by eye from it)
      if (d.isPdf) {
        const fp = firstPagePng(d.file);
        if (fp.png) {
          await ts.showFile(fp.png, `Allianz document, first page as shown: ${from(u)}`);
          const shot = await ts.shot(
            `${path.basename(d.file, ".pdf")}-first-page`,
            `first page of ${path.basename(d.file)} as shown (opened from: ${from(u)})${d.readable ? "" : "; NO text layer: judged by eye"}`,
            ts.page.locator("img").first(),
          );
          firstPageShot.set(u, shot);
        } else ts.note(`first page of ${path.basename(d.file)} NOT drawn (${fp.error}); the file is in the TS folder (downloadable/)`);
      }
      // 2) what the script reads from it (the proofs below are taken on this view)
      const top = [
        `opened from: ${from(u)}`,
        `address: ${u}`,
        `file: ${path.basename(d.file)}; PDF metadata: ${d.meta || "-"}`,
        `script reads: ${docLine(d)}`,
        "",
        d.readable ? "----- the document's text (first part) -----" : "----- no text in this PDF: drawn as images / outlines, the script cannot read it; the file is in the TS folder (downloadable/) for the QA -----",
        d.readable ? d.text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 45).join("\n") : "",
      ].join("\n");
      await ts.showFile(d.file, `Allianz document: ${from(u)}`, top);
    };
    const pre = () => ts.page.locator("pre").first();

    // E1-E4: each named document opens, is Allianz's, and is dated 2022
    for (const k of DOCS) {
      const links = clicked.filter((c) => k.label.test(c.text.trim()));
      const kurls = [...new Set(links.map((c) => c.opened).filter(Boolean))];
      for (const u of kurls) await show(u);
      const per = links.map((c) => `${c.where} "${c.text}": ${c.opened ? `${c.newTab ? "new tab" : "same tab"} ${c.opened.split("/").pop()}, ${docLine(doc(c))}` : "opened NOTHING"}`);
      const bad = links.filter((c) => {
        const d = doc(c);
        return !c.opened || !d || !!d.error || !d.isPdf || (d.readable && (!d.allianz || !d.dates.some((x) => /2022/.test(x))));
      });
      const unreadable = links.filter((c) => doc(c)?.isPdf && !doc(c)!.readable);
      const shows = links.length ? per.join(" | ") : `no link named "${k.name}" in the card's Plan Details, Confirmation's Plan Details or the Confirmation declaration (links seen: ${[...new Set(clicked.map((c) => c.text))].join(", ") || "none"})`;
      if (!links.length || bad.length) {
        await ts.prove(k.point, { shows, match: false, hl: kurls.length ? pre() : null, name: `${k.name.toLowerCase().replace(/\W+/g, "-")}` });
      } else if (unreadable.length) {
        const shots = kurls.map((u) => firstPageShot.get(u)).filter(Boolean);
        ts.note(`${k.point} NOT proved (left for the QA, by eye): ${k.name} cannot be read by the script (no text layer, no OCR on this PC); its first page as shown: ${shots.join(", ") || "not drawn"}. ${shows}`);
      } else {
        await ts.prove(k.point, { shows, match: true, hl: pre(), name: `${k.name.toLowerCase().replace(/\W+/g, "-")}` });
      }
    }
    // the documents not named by E1-E4 (Roadside Assistance T&C), shown for the video
    for (const u of urls.filter((u) => !clicked.some((c) => c.opened === u && DOCS.some((k) => k.label.test(c.text.trim()))))) await show(u);

    // A summary of every link followed, shown in this tab for E5 / E6
    const summaryFile = path.join(ts.dir, "downloadable", "links-followed.txt");
    const lineOf = (c: Clicked) => `${c.where} > "${c.text}" -> ${c.opened || "(nothing opened)"}${c.opened ? (c.newTab ? " [new tab]" : " [same tab]") : ""}: ${docLine(doc(c))}`;

    // E5: each link opens the document it names, not another document or another insurer's
    const docLinks = clicked;
    const e5 = docLinks.map((c) => {
      const k = kindOf(c.text);
      const d = doc(c);
      if (!c.opened || !d || d.error || !d.isPdf) return { c, verdict: "bad" as const, why: "opened no document" };
      if (!d.readable) return { c, verdict: "unknown" as const, why: "no readable text" };
      if (!k) return { c, verdict: "unknown" as const, why: "the link's name is not a document this TS knows" };
      const ownTitle = k.title.test(d.head);
      const otherTitle = [...DOCS, ...OTHER_DOCS].filter((o) => o !== k && o.title.test(d.head) && !k.title.test(d.head)).map((o) => o.name);
      const ok = ownTitle && d.allianz && !d.otherInsurers.length;
      return { c, verdict: ok ? ("ok" as const) : ("bad" as const), why: ok ? `is the ${k.name}, Allianz's` : `${ownTitle ? "" : `does not name itself "${k.name}"${otherTitle.length ? ` (reads as ${otherTitle.join(", ")})` : ""}; `}${d.allianz ? "" : "does not name Allianz; "}${d.otherInsurers.length ? `names ${d.otherInsurers.join(", ")}` : ""}` };
    });
    fs.writeFileSync(
      summaryFile,
      [`Links followed in ${ID} (staging /ia/, car ${PLATE})`, "", ...docLinks.map(lineOf), "", "E5 per link:", ...e5.map((x) => `${x.c.where} "${x.c.text}": ${x.verdict.toUpperCase()} (${x.why})`)].join("\n"),
    );
    await ts.showFile(summaryFile, "Every Allianz document link followed (card Plan Details, Confirmation Plan Details, Excess 'i', declaration)", fs.readFileSync(summaryFile, "utf8"));
    {
      const shows = e5.length ? e5.map((x) => `${x.c.where} "${x.c.text}": ${x.verdict} (${x.why})`).join(" | ") : "no document link was followed at all";
      if (!e5.length || e5.some((x) => x.verdict === "bad")) await ts.prove("E5", { shows, match: false, hl: pre(), name: "each-link-opens-its-document" });
      else if (e5.some((x) => x.verdict === "unknown")) ts.note(`E5 NOT proved (left for the QA): ${e5.filter((x) => x.verdict === "unknown").map((x) => `${x.c.where} "${x.c.text}" (${x.why})`).join("; ")}`);
      else await ts.prove("E5", { shows, match: true, hl: pre(), name: "each-link-opens-its-document" });
    }

    // E6: every link inside Plan Details (card and Confirmation) and the Excess info opens an Allianz document
    {
      const boxes: Where[] = ["card Plan Details", "Confirmation Plan Details", "Confirmation Excess 'i'"];
      const notUp = boxes.filter((b) => !opened[b] || opened[b]!.kind === "none");
      const inside = clicked.filter((c) => boxes.includes(c.where));
      const per = inside.map((c) => {
        const d = doc(c);
        const v = !c.opened || !d || d.error || !d.isPdf ? "bad" : !d.readable ? "unknown" : d.allianz && !d.otherInsurers.length ? "ok" : "bad";
        return { c, v, line: `${c.where} "${c.text}": ${v === "ok" ? "an Allianz document" : v === "unknown" ? "not readable by the script" : docLine(d)}` };
      });
      const counts = boxes.map((b) => `${b}: ${opened[b] ? `${opened[b]!.kind}, ${inside.filter((c) => c.where === b).length} link(s) followed` : "NOT opened"}`).join("; ");
      const shows = `${counts}. ${per.map((x) => x.line).join(" | ") || "no link inside"}`;
      if (notUp.length || per.some((x) => x.v === "bad")) await ts.prove("E6", { shows, match: false, hl: pre(), name: "plan-details-excess-links-allianz" });
      else if (per.some((x) => x.v === "unknown")) ts.note(`E6 NOT proved (left for the QA): ${per.filter((x) => x.v === "unknown").map((x) => x.line).join("; ")}`);
      else await ts.prove("E6", { shows, match: true, hl: pre(), name: "plan-details-excess-links-allianz" });
    }
  });
});
