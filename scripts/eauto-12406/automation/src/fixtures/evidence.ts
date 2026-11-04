/**
 * Evidence: what a reviewer opens to sign a case off.
 *
 * Every spec that proves an expected result takes screenshots through this, so
 * a PASS leaves as much behind as a FAIL. Playwright on its own screenshots only
 * failures, which is how a green case ends up with nothing to show (12403_STMS_DEP1,
 * 2026-09-28).
 *
 *   test("12403_DEP1 — Step 5 shows the new price", async ({ page, evidence }) => {
 *     await evidence.shot(page, "step5-payment-summary", { highlight: page.locator("#total"), label: "Total RM37.00" });
 *     const dl = await ...waitForEvent("download");
 *     await evidence.download(dl, "invoice.pdf");
 *   });
 *
 * LAYOUT (QA rules, 2026-09-28)
 * -----------------------------
 * One folder per case (TS no.), never split by file type:
 *
 *   <root>/[pre-push|post-push/]<case>/
 *     NN-[<part>-]<what>.png        numbered in capture order, named for what it shows
 *     video_<case>.webm             or video_<case>_01, _02 … when a case has several
 *     downloadable/                 documents and exports: "downloadable (before)/" in
 *                                   pre-push, "downloadable (after)/" in post-push
 *
 * The phase folder exists only for a ticket that prepares data before the
 * deploy (its workbook's yellow TS No). CR_PHASE says which half is running.
 *
 * WHERE <root> IS
 * ---------------
 * CR_TICKET set (a cr-runner run): cr/<TICKET>/04-runs/<RUN_ID>/evidence. The
 * collector (`scripts/cr-collect-evidence.py`) copies it into 05-evidence/.
 * Otherwise: automation/.artifacts/evidence/<RUN_ID>.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Download, Locator, Page, TestInfo } from "@playwright/test";
import { highlight, clearHighlights } from "./highlight";

export type Phase = "pre-push" | "post-push" | null;

const REPO = path.resolve(__dirname, "..", "..", "..");

export function currentPhase(): Phase {
  const p = (process.env.CR_PHASE ?? "").trim();
  if (p === "pre-push" || p === "post-push") return p;
  if (p && p !== "none") throw new Error(`CR_PHASE must be pre-push, post-push or none, not "${p}".`);
  return null;
}

export function evidenceRoot(): string {
  const runId = process.env.RUN_ID || "adhoc";
  const ticket = process.env.CR_TICKET;
  return ticket
    ? path.join(REPO, "cr", ticket, "04-runs", runId, "evidence")
    : path.join(REPO, "automation", ".artifacts", "evidence", runId);
}

/** "downloadable (before)" / "downloadable (after)" / "downloadable". */
export function downloadableFolder(phase: Phase): string {
  return phase === "pre-push" ? "downloadable (before)" : phase === "post-push" ? "downloadable (after)" : "downloadable";
}

/** The case id a test title starts with: "12403_DEP1 — …" → "12403_DEP1". */
export function caseIdOf(title: string): string {
  const m = title.match(/^([A-Za-z0-9]+_[A-Za-z0-9_]+)/);
  return m ? m[1] : title.replace(/[^\w-]+/g, "_").slice(0, 60);
}

const safe = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

export interface ShotOptions {
  /** Outline these before the screenshot. The reviewer's eye goes where the expected value is. */
  highlight?: Locator | Locator[];
  /** Badge text on the first highlight, e.g. "Total RM37.00". */
  label?: string;
  /** Default true: the whole page, so the context around the value is in the picture. */
  fullPage?: boolean;
}

/** One case's folder. */
export class CaseEvidence {
  readonly files: string[] = [];
  private n = -1;

  constructor(
    readonly root: string,
    readonly caseId: string,
    readonly phase: Phase,
    /** A piece of the case, e.g. "source-stms", "sabah", "utu". Prefixes the file names. */
    readonly part = "",
  ) {
    fs.mkdirSync(this.dir, { recursive: true });
  }

  get dir(): string {
    return path.join(this.root, ...(this.phase ? [this.phase] : []), this.caseId);
  }

  /** The same case, a different part, e.g. `evidence.for("12403_CRN3").part("source-stms")`. */
  withPart(part: string): CaseEvidence {
    return new CaseEvidence(this.root, this.caseId, this.phase, part);
  }

  /** `NN-[part-]<what>.<ext>`, NN continuing after what is already in the folder. */
  private next(what: string, ext: string): string {
    if (this.n < 0) this.n = fs.readdirSync(this.dir).filter((f) => /^\d{2}-/.test(f)).length;
    this.n += 1;
    return `${String(this.n).padStart(2, "0")}-${this.part ? `${safe(this.part)}-` : ""}${safe(what)}.${ext}`;
  }

  /** Highlight (optional), screenshot, clear the highlight. Returns the file path. */
  async shot(page: Page, what: string, opts: ShotOptions = {}): Promise<string> {
    const targets = opts.highlight ? (Array.isArray(opts.highlight) ? opts.highlight : [opts.highlight]) : [];
    for (const [i, t] of targets.entries()) await highlight(page, t, i === 0 ? opts.label ?? "" : "", i === targets.length - 1 ? undefined : 0);
    const file = path.join(this.dir, this.next(what, "png"));
    await page.screenshot({ path: file, fullPage: opts.fullPage ?? true });
    if (targets.length) await clearHighlights(page).catch(() => undefined);
    this.files.push(file);
    return file;
  }

  /** Save a browser download into downloadable[ (before|after)]/. */
  async download(dl: Download, name?: string): Promise<string> {
    const dir = path.join(this.dir, downloadableFolder(this.phase));
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${this.part ? `${safe(this.part)}-` : ""}${name ?? dl.suggestedFilename()}`);
    await dl.saveAs(file);
    this.files.push(file);
    return file;
  }

  /** Save bytes you already hold (an export fetched by request, a PDF body) the same way. */
  saveDownloadable(name: string, body: Buffer | string): string {
    const dir = path.join(this.dir, downloadableFolder(this.phase));
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${this.part ? `${safe(this.part)}-` : ""}${name}`);
    fs.writeFileSync(file, body);
    this.files.push(file);
    return file;
  }
}

/**
 * A pre-push record the post-push half needs: which transaction was prepared,
 * in what state, and what it should become after the deploy. Rendered into
 * 05-evidence/pre-push/SEEDS.md by the collector.
 */
export interface Seed {
  case: string;
  what: string;
  vehicle?: string;
  transactionNo?: string;
  persona?: string;
  stateNow?: string;
  expectAfter?: string;
  notes?: string[];
  [extra: string]: unknown;
}

/** The fixture: the current test's case, plus access to any other. */
export class Evidence {
  private readonly cases = new Map<string, CaseEvidence>();
  readonly phase = currentPhase();
  readonly root = evidenceRoot();

  constructor(private readonly info: TestInfo) {}

  /** The case this test is about, from its title. */
  get current(): CaseEvidence {
    return this.for(caseIdOf(this.info.title));
  }

  /** Another case's folder, for a test that proves several. */
  for(caseId: string, part = ""): CaseEvidence {
    const key = `${caseId}\u0000${part}`;
    if (!this.cases.has(key)) this.cases.set(key, new CaseEvidence(this.root, caseId, this.phase, part));
    return this.cases.get(key)!;
  }

  shot(page: Page, what: string, opts?: ShotOptions) {
    return this.current.shot(page, what, opts);
  }

  download(dl: Download, name?: string) {
    return this.current.download(dl, name);
  }

  /** Record a pre-push seed. Only meaningful in the pre-push half. */
  seed(s: Seed): void {
    const file = path.join(this.root, "pre-push", "seeds.json");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const all: Seed[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
    all.push({ ...s, recordedAt: new Date().toISOString(), runId: process.env.RUN_ID });
    fs.writeFileSync(file, JSON.stringify(all, null, 2) + "\n", "utf8");
  }

  /**
   * The seeds a pre-push run left for a case, read from the HANDOVER copy
   * (05-evidence/pre-push/seeds.json), because the post-push run is a different run.
   */
  seedsOf(caseId: string): Seed[] {
    const ticket = process.env.CR_TICKET;
    if (!ticket) return [];
    const file = path.join(REPO, "cr", ticket, "05-evidence", "pre-push", "seeds.json");
    if (!fs.existsSync(file)) return [];
    return (JSON.parse(fs.readFileSync(file, "utf8")) as Seed[]).filter((s) => s.case === caseId);
  }

  /** Case folders this test wrote into. */
  touchedDirs(): string[] {
    return [...new Set([...this.cases.values()].map((c) => c.dir))];
  }
}

/**
 * Copy the test's video into every case folder it touched:
 * video_<case>.webm, or video_<case>_01.. in capture order once there are several.
 */
export async function attachVideo(page: Page, evidence: Evidence): Promise<void> {
  const video = page.video();
  const dirs = evidence.touchedDirs();
  if (!video || !dirs.length) return;
  await page.close().catch(() => undefined); // a video is only complete once its page is closed
  const src = await video.path().catch(() => "");
  if (!src || !fs.existsSync(src)) return;
  for (const dir of dirs) {
    const caseId = path.basename(dir);
    const byAge = (f: string) => fs.statSync(path.join(dir, f)).mtimeMs;
    const existing = fs.readdirSync(dir).filter((f) => /^video_.*\.webm$/.test(f)).sort((a, b) => byAge(a) - byAge(b));
    const all = [...existing.map((f) => path.join(dir, f)), src];
    const staged = all.map((f, k) => {
      const tmp = path.join(dir, `__v${k}.webm`);
      if (f === src) fs.copyFileSync(f, tmp);
      else fs.renameSync(f, tmp);
      return tmp;
    });
    staged.forEach((tmp, k) =>
      fs.renameSync(tmp, path.join(dir, all.length === 1 ? `video_${caseId}.webm` : `video_${caseId}_${String(k + 1).padStart(2, "0")}.webm`)),
    );
  }
}
