/**
 * Onboarding — public Pre-Application form to a paid, verified Application,
 * as named phases a build can start, stop and resume at.
 *
 *   seed → preapp → approve-preapp → appform → assign → submit-approval →
 *   approve-app → regdocs → verify-regdocs → regfee → record
 *
 * Phase names are THIS SUITE's words for steps, not the product's statuses.
 * What a record actually is gets read back from BackOffice, never inferred from
 * which phase ran last.
 *
 * ── Who does what ──────────────────────────────────────────────────────────
 *   dealer    the public form and the signed Application link (no login)
 *   approver  `bo`      — approves, assigns, gives the final Approve
 *   assignee  `boAdmin` — Submit for Approval, Verified
 * Each BackOffice role gets its OWN browser context: both sign in to the same
 * portal, so sharing one would have the second login replace the first.
 *
 * ── Where it stops, on purpose ─────────────────────────────────────────────
 * At `record`: paid and verified, one step short of Registered. Registered is
 * reached only by Create Account, which cannot be undone and removes controls
 * other tests need, so it belongs to a test that means it — never to a build.
 */
import type { Browser, BrowserContext, Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";
import type { PersonaKey } from "@config/personas";
import { EsimClient } from "@fixtures/esim";
import { saveCheckpoint, type Checkpoint } from "@fixtures/checkpoint";
import { seedSsmCompany } from "@data/ssm-seed";
import { pickTestCompany } from "@data/test-companies";
import type { SsmType } from "@data/ssm";
import {
  ssmProfile,
  tradingProfile,
  isSsmType,
  type OnboardingProfile,
  type OnboardingType,
} from "@data/onboarding-profile";
import { PreApplicationPage, isTradingType } from "@pages/obs/pre-application.page";
import { BackOfficePage, BO_MENU } from "@pages/obs/backoffice.page";
import { ApplicationPage, DIRECTOR_UPLOAD_PREFIX } from "@pages/obs/application.page";
import { RegistrationPage, type PaymentResult } from "@pages/obs/registration.page";
import { completePayment } from "@pages/obs/fiuu.page";
import { settleObs } from "@pages/obs/obs-page";

export const ONBOARDING_PHASES = [
  "seed",
  "preapp",
  "approve-preapp",
  "appform",
  "assign",
  "submit-approval",
  "approve-app",
  "regdocs",
  "verify-regdocs",
  "regfee",
  "record",
] as const;

export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];

export type OnboardingCheckpoint = Checkpoint<OnboardingProfile>;

const UPLOADS = path.join(__dirname, "..", "..", "assets", "uploads");

export interface OnboardingRun {
  browser: Browser;
  /** The dealer's context — it holds the reCAPTCHA pass for this build. */
  dealer: BrowserContext;
  cp: OnboardingCheckpoint;
  log: (line: string) => void;
  /** Seeding options for a fresh build. */
  seed?: {
    type?: OnboardingType;
    /**
     * Which real company (ROC or new ROC) from the test-company list; unset
     * takes the first unused one of `type`. `"generated"` seeds an invented
     * `QA…` company instead — its TIN will not verify.
     */
    company?: string;
    /**
     * A generated company's NAME instead of the invented `QA E2E <run> …`: seeded into eSim's SSM rows (SSM types) and
     * typed as the Business Name, so the form, BackOffice and every email carry it. Ignored for a real company, which
     * keeps its registered name. Added 30.10.2026 for EAINT-11868 EM_TS4 (A&B O'NEIL MOTOR (M) PLT.: &, ', ( ), .).
     * The listing is then searched by a name that may not be unique: a caller that needs one record must check that.
     */
    companyName?: string;
    directors?: number;
    secretaries?: number;
    shareholders?: number;
    foreign?: number;
  };
  /** How long to wait for a person at the reCAPTCHA. */
  gateTimeoutMs?: number;
  /**
   * Where the BackOffice sessions' videos go (one `bo-<role>.webm` each). Unset: not filmed. These contexts are
   * opened here, not by the test, so Playwright's `video` setting never reaches them (found 29.10.2026, EAINT-11868).
   */
  videoDir?: string;
}

/** One BackOffice role, signed in, in its own context. Opened on first use. */
interface BoSession {
  context: BrowserContext;
  page: Page;
  bo: BackOfficePage;
}

const sessions = new WeakMap<OnboardingRun, Map<PersonaKey, BoSession>>();

async function boSession(run: OnboardingRun, who: PersonaKey): Promise<BackOfficePage> {
  let byRole = sessions.get(run);
  if (!byRole) sessions.set(run, (byRole = new Map()));
  const open = byRole.get(who);
  if (open) return open.bo;

  const viewport = { width: 1920, height: 1080 };
  const context = await run.browser.newContext({
    ignoreHTTPSErrors: true,
    viewport,
    ...(run.videoDir ? { recordVideo: { dir: run.videoDir, size: viewport } } : {}),
  });
  const page = await context.newPage();
  await new LoginPage(page).as(who);
  const bo = new BackOfficePage(page, context);
  await bo.settle();
  byRole.set(who, { context, page, bo });
  return bo;
}

/** Close every BackOffice context this run opened. */
export async function closeOnboardingRun(run: OnboardingRun): Promise<void> {
  for (const [who, s] of sessions.get(run) ?? []) {
    await s.context.close().catch(() => undefined);
    // The video is written out on close; name it after the role.
    const video = run.videoDir ? await s.page.video()?.path().catch(() => undefined) : undefined;
    if (video) fs.renameSync(video, path.join(run.videoDir!, `bo-${who}.webm`));
  }
  sessions.delete(run);
}

/** The dealer's page — one tab, reused, so the reCAPTCHA session carries. */
async function dealerPage(run: OnboardingRun): Promise<Page> {
  return run.dealer.pages()[0] ?? run.dealer.newPage();
}

function need<K extends "preAppNo" | "dealerLink" | "applicationNo" | "uuid">(
  cp: OnboardingCheckpoint,
  key: K,
  from: OnboardingPhase,
): string {
  const value = cp[key];
  if (!value) throw new Error(`No ${key} on checkpoint ${cp.label} — run the "${from}" phase first.`);
  return value;
}

/** Save an identifier THE MOMENT it is learned, not at the end of the phase. */
function learn(run: OnboardingRun, patch: Partial<OnboardingCheckpoint>): void {
  Object.assign(run.cp, patch);
  saveCheckpoint(run.cp);
}

/** "2026-09-22 17:05" → Date, in local time. */
function listingDate(text: string): Date | null {
  const m = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/.exec(text ?? "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

/**
 * Throw when a listing column does not read what the phase just did to it.
 * The listing, not a banner, is the evidence — a banner once read "successful"
 * over an approval that had not happened.
 */
function expectColumn(row: Record<string, string>, column: string, want: RegExp, after: string): void {
  const got = row[column];
  if (got === undefined) throw new Error(`The listing has no "${column}" column. Columns: ${Object.keys(row).join(" | ")}`);
  if (!want.test(got)) throw new Error(`After ${after}, "${column}" reads "${got}" — expected ${want}.`);
}

type PhaseResult = Record<string, unknown>;

/** A registration-fee receipt that says PAID, carries an id, and names THIS dealer's email. */
function checkReceipt(run: OnboardingRun, r: PaymentResult): PaymentResult {
  if (!/^paid$/i.test(r.status)) throw new Error(`The receipt's Payment Status reads "${r.status}", not PAID.`);
  if (!r.paymentId) throw new Error("The receipt reads PAID but shows no Payment ID.");
  const email = run.cp.profile.adminEmail;
  if (email && r.invoiceTo && r.invoiceTo.toLowerCase() !== email.toLowerCase()) {
    throw new Error(`The invoice is going to ${r.invoiceTo}, not this dealer's ${email}.`);
  }
  return r;
}

const PHASE: Record<OnboardingPhase, (run: OnboardingRun) => Promise<PhaseResult>> = {
  /**
   * The dealer profile — on a company freshly seeded into eSim's SSM simulator
   * for the SSM types, or on an invented licence for Business Trading, which
   * has no SSM record to look up.
   */
  async seed(run) {
    const opts = run.seed ?? {};
    if (opts.type && !isSsmType(opts.type)) {
      run.cp.profile = tradingProfile(opts.type);
      if (opts.companyName) run.cp.profile.businessName = opts.companyName;
      saveCheckpoint(run.cp);
      run.log(`Business Trading (${opts.type}) — licence ${run.cp.profile.tradingLicenceNo}, nothing to seed`);
      return { type: opts.type, tradingLicenceNo: run.cp.profile.tradingLicenceNo };
    }

    // A REAL company from the list, unless generated was asked for.
    const real = opts.company === "generated" ? null : pickTestCompany({ wanted: opts.company, type: opts.type });
    // Naming a company AND a type reuses that trio as the named type on
    // purpose — e.g. a ROB's numbers seeded as an LLP, when the list has no
    // LLP. Its new BRN's entity code still says what it really is, and the
    // product may check that; the run then reports it.
    const reused = Boolean(real && opts.company && opts.type && opts.type !== real.type);
    const type = reused ? (opts.type as SsmType) : (real?.type ?? (opts.type as SsmType | undefined) ?? "ROC");
    if (reused) run.log(`NOTE: ${real!.roc} is a ${real!.type} on the list — seeding it as ${type} on purpose`);
    const sim = new EsimClient();
    await sim.connect();
    try {
      const company = await seedSsmCompany(sim, {
        ...opts,
        type,
        roc: real?.roc,
        newRoc: real?.newRoc,
        companyName: real?.companyName ?? opts.companyName,
      });
      run.cp.profile = ssmProfile(company, real?.tin);
      if (!real && opts.companyName) run.cp.profile.businessName = opts.companyName;
      saveCheckpoint(run.cp);
      run.log(
        `seeded ${company.type} ${company.roc} / ${company.newRoc} ` +
          `(${real ? "real company, TIN must verify" : "generated, TIN will not verify"}) — ` +
          `expect ${company.expectedDirectors} director row(s)`,
      );
      return {
        type: company.type,
        roc: company.roc,
        newRoc: company.newRoc,
        real: Boolean(real),
        reusedAs: reused ? type : undefined,
        expectedDirectors: company.expectedDirectors,
      };
    } finally {
      await sim.close();
    }
  },

  /** The public form, the one human tick, and the RM108 fee through the Fiuu sandbox. */
  async preapp(run) {
    const p = run.cp.profile;
    const page = await dealerPage(run);
    const form = new PreApplicationPage(page);
    if ((await form.open()) === "recaptcha" && !(await form.passTestKeyGate())) {
      await form.waitForHuman(run.gateTimeoutMs ?? 300_000);
    }

    const trading = isTradingType(p.businessType);
    await form.fillForm({ ...p, tradingLicenceFile: trading ? path.join(UPLOADS, "trading-licence.pdf") : undefined });
    const warnings = await form.next();
    if (warnings.length) run.log(`form warned: ${warnings.join(" | ")}`);
    // A real ROC / new ROC / TIN trio must pass LHDN. Its warning here means
    // the trio does not match — the one thing a real company is used to prove.
    if (p.tinMustVerify && warnings.some((w) => /TIN is invalid/i.test(w))) {
      throw new Error(`LHDN rejected TIN ${p.tin} for ${p.oldBrn} / ${p.newBrn} — the three do not match.`);
    }
    const review = page.locator("#business-review-section");
    const reviewText = (await review.innerText()).replace(/\s+/g, " ");
    if (trading) {
      if (!p.tradingLicenceNo || !reviewText.includes(p.tradingLicenceNo)) {
        throw new Error(`The review does not show licence ${p.tradingLicenceNo}: ${reviewText.slice(0, 200)}`);
      }
    } else if (/Business Trading/i.test(reviewText)) {
      // The form silently switches to a non-SSM type when the lookup fails.
      throw new Error(`The SSM lookup did not resolve ${p.newBrn}; the form fell back to Business Trading.`);
    }

    const bank = await form.choosePayment("Online Banking (Personal)");
    const gatewayOpens = run.dealer.waitForEvent("page", { timeout: 60_000 }).catch(() => null);
    await form.submitAndPay(30_000);
    const gateway = await gatewayOpens;
    if (!gateway) throw new Error("The FPX gateway never opened its window.");
    await gateway.waitForLoadState("domcontentloaded").catch(() => undefined);
    const { amountsSeen } = await completePayment(gateway);

    await page.waitForURL(/\/obs\/preOnb\/summary\//, { timeout: 180_000 });
    const summary = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const preAppNo = summary.match(/P\d{6}\/\d{5}/)?.[0];
    if (!preAppNo) throw new Error("Paid, but no Pre-Application number on the summary page.");
    learn(run, { preAppNo });
    const paid = /\bPaid\b/i.test(summary);
    if (!paid) throw new Error(`${preAppNo} was created but its summary does not read Paid.`);
    run.log(`${preAppNo} — paid via ${bank}; gateway showed ${amountsSeen.length ? "RM " + amountsSeen.join(", RM ") : "no amount"}`);
    return { preAppNo, bank, paid, gatewayAmounts: amountsSeen, formWarnings: warnings };
  },

  /** The approver approves, and the Application link appears on the record. */
  async "approve-preapp"(run) {
    const preAppNo = need(run.cp, "preAppNo", "preapp");
    const bo = await boSession(run, "bo");
    await bo.openListing(BO_MENU.preApplicationListing);
    await bo.search({ preOnboardingNo: preAppNo });
    const detail = await bo.openRow(preAppNo);
    await settleObs(detail);
    await bo.approvePreApplication(detail);
    const dealerLink = await bo.applicationLink(detail);
    learn(run, { dealerLink });
    await detail.close().catch(() => undefined);

    // Read back from the LISTING: the approve confirm once "succeeded" with
    // the record still New.
    await bo.openListing(BO_MENU.preApplicationListing);
    const row = await bo.search({ preOnboardingNo: preAppNo });
    if (!/Approved/i.test(row)) throw new Error(`${preAppNo} does not read Approved after approving: ${row.slice(0, 200)}`);
    run.log(`${preAppNo} approved — Application link issued`);
    return { approved: true };
  },

  /**
   * The dealer fills and submits the three-step Application.
   *
   * Starts from whichever step is SHOWING: the form restores a draft to the
   * step it reached, so a resumed build can open on step 2 or 3, and refilling
   * step 1 there would be pressing controls that are not on screen.
   */
  async appform(run) {
    const p = run.cp.profile;
    const page = await dealerPage(run);
    const form = new ApplicationPage(page);
    await form.open(need(run.cp, "dealerLink", "approve-preapp"));
    // Waits for a step section to render: read at once, a blank page reads
    // "(none)" (EM_TS11 run c2, 30.10.2026: step 1 appeared 130 ms later).
    const openedOn = await form.openedStep();
    if (openedOn === 0 || openedOn > 3) {
      throw new Error(`The Application link opened on step ${openedOn || "(none) after 20 s"} — it has already been submitted.`);
    }
    if (openedOn !== 1) run.log(`draft restored at step ${openedOn}`);

    if (openedOn === 1) {
      await form.fillBusinessInformation(p);
      await form.goToUploads();
    }

    // The seeding's prediction meeting the product: one row per COUNTED
    // director. Business Trading has no SSM document, so nothing to predict.
    let directorRows = 0;
    let named = 0;
    let uploaded = 0;
    if ((await form.currentStep()) === 2) {
      directorRows = await page.locator(`[id^="${DIRECTOR_UPLOAD_PREFIX}"]`).count();
      if (p.expectedDirectors !== undefined && directorRows !== p.expectedDirectors) {
        throw new Error(`The Application rendered ${directorRows} director row(s); the seeded company predicts ${p.expectedDirectors}.`);
      }
      // `?? ` because a checkpoint written before profiles carried a director
      // name must still resume.
      named = await form.fillDirectorNames(p.directorName ?? "QA DIRECTOR A");
      uploaded = await form.uploadAll(UPLOADS);
      await form.goToAcknowledgement();
    }

    // Defaults for checkpoints written before profiles carried these.
    const mainUser = await form.fillAcknowledgement({
      ...p,
      directorName: p.directorName ?? "QA DIRECTOR A",
      directorMyKad: p.directorMyKad ?? "750101145678",
    });
    const confirmation = await form.submit();
    run.log(`Application submitted — ${directorRows} director row(s), main user ${mainUser}`);
    return { openedOn, directorRows, namesTyped: named, uploaded, mainUser, confirmation };
  },

  /**
   * The approver hands the record to OUR assignee. Also where the run first
   * learns its Application No and uuid — saved before anything else is tried.
   */
  async assign(run) {
    const bo = await boSession(run, "bo");
    const { detail, uuid, row } = await bo.openApplication(
      run.cp.applicationNo ? { applicationNo: run.cp.applicationNo } : { companyName: run.cp.profile.businessName },
    );
    const applicationNo = row["Application No"];
    if (!/^NA\d{8}$/.test(applicationNo ?? "")) throw new Error(`No Application No on the row yet: "${applicationNo}".`);
    learn(run, { applicationNo, uuid });

    // A display name, not a login — so it is configuration, not a credential.
    const name = (process.env.BO_ASSIGNEE_NAME ?? "").trim();
    if (!name) {
      await detail.close().catch(() => undefined);
      run.log(`${applicationNo} — BO_ASSIGNEE_NAME not set; left with the auto-assignee "${row["Assignee"]}"`);
      return { applicationNo, uuid, assigned: false, autoAssignee: row["Assignee"] };
    }
    const result = await bo.assign(detail, name);
    await detail.close().catch(() => undefined);
    run.log(`${applicationNo} — ${result.note}`);
    return { applicationNo, uuid, autoAssignee: row["Assignee"], ...result };
  },

  /** The assignee sets UCD Group and presses Submit for Approval. */
  async "submit-approval"(run) {
    const applicationNo = need(run.cp, "applicationNo", "assign");
    const bo = await boSession(run, "boAdmin");
    const { detail } = await bo.openApplication({ applicationNo });
    await bo.submitForApproval(detail);
    await detail.close().catch(() => undefined);

    await bo.openListing(BO_MENU.applicationListing);
    await bo.search({ applicationNo });
    const row = await bo.readRow(applicationNo);
    expectColumn(row, "Assignee / UCD", /Checked/i, "Submit for Approval");
    expectColumn(row, "Approver / Assignee", /Pending Approver/i, "Submit for Approval");
    run.log(`${applicationNo} — Checked / Pending Approver`);
    return { status: row["Application Status"], stage1: row["Assignee / UCD"], stage2: row["Approver / Assignee"] };
  },

  /** The approver approves. Registration Documents becomes available. */
  async "approve-app"(run) {
    const applicationNo = need(run.cp, "applicationNo", "assign");
    const bo = await boSession(run, "bo");
    const { detail } = await bo.openApplication({ applicationNo });
    await bo.approveApplication(detail);
    await detail.close().catch(() => undefined);

    await bo.openListing(BO_MENU.applicationListing);
    await bo.search({ applicationNo });
    const row = await bo.readRow(applicationNo);
    expectColumn(row, "Application Status", /^Approved$/i, "Approve");
    if (!listingDate(row["Approved Date"])) throw new Error(`Approved, but "Approved Date" reads "${row["Approved Date"]}".`);
    run.log(`${applicationNo} — Approved ${row["Approved Date"]}`);
    return { status: row["Application Status"], approvedDate: row["Approved Date"] };
  },

  /** The dealer uploads the registration documents this business type asks for, on the same link. */
  async regdocs(run) {
    const page = await dealerPage(run);
    const reg = new RegistrationPage(page);
    const step = await reg.open(need(run.cp, "dealerLink", "approve-preapp"));
    run.log(`link opened on step ${step}`);
    const sections = await reg.uploadDocuments(path.join(UPLOADS, "registration-document.pdf"));
    const confirmation = await reg.submitDocuments();
    const fresh = sections.filter((s) => s.uploadedNow).length;
    run.log(`registration documents submitted — ${sections.length} section(s), ${fresh} uploaded this run`);
    return { sections, confirmation };
  },

  /** The assignee presses Verified; the verification date is read back. */
  async "verify-regdocs"(run) {
    const applicationNo = need(run.cp, "applicationNo", "assign");
    const bo = await boSession(run, "boAdmin");
    const { detail } = await bo.openApplication({ applicationNo });
    await bo.openRegistrationDocuments(detail);
    const submittedAt = (await bo.sidebar(detail))["Registration Documents Submission Date"] ?? "";
    const verifiedAt = await bo.verifyRegistrationDocuments(detail);
    await detail.close().catch(() => undefined);
    run.log(`${applicationNo} — documents submitted ${submittedAt}, verified ${verifiedAt}`);
    return { submittedAt, verifiedAt };
  },

  /**
   * The dealer pays the registration fee through the Fiuu sandbox.
   *
   * The summary is checked against ITSELF (see `feeSummary`) rather than a
   * fixed price, and the gateway must charge the same total when it shows one.
   */
  async regfee(run) {
    const page = await dealerPage(run);
    const reg = new RegistrationPage(page);
    const step = await reg.open(need(run.cp, "dealerLink", "approve-preapp"));

    // Already paid — a resume after the gateway handed back. Paying again
    // would open a second transaction for the same application.
    const existing = step === 0 ? await reg.receipt() : null;
    if (existing) {
      run.log(`already paid — ${existing.paymentId} ${existing.status} at ${existing.paidAt}`);
      return { alreadyPaid: true, ...checkReceipt(run, existing) };
    }

    run.log(`link opened on step ${step}`);
    const fee = await reg.feeSummary();
    run.log(`fee RM ${fee.total.toFixed(2)} = device ${fee.device.toFixed(2)} + fee ${fee.registration.toFixed(2)} + SST ${fee.sstRate}% ${fee.sst.toFixed(2)}`);
    const bank = await reg.choosePayment("Online Banking (Personal)");
    const gatewayOpens = run.dealer.waitForEvent("page", { timeout: 60_000 }).catch(() => null);
    await reg.submitAndPay();
    const gateway = await gatewayOpens;
    if (!gateway) throw new Error("The FPX gateway never opened its window for the registration fee.");
    await gateway.waitForLoadState("domcontentloaded").catch(() => undefined);
    const { amountsSeen } = await completePayment(gateway);
    if (amountsSeen.length && !amountsSeen.some((a) => Math.round(a * 100) === Math.round(fee.total * 100))) {
      throw new Error(`The gateway showed RM ${amountsSeen.join(", RM ")} — never the RM ${fee.total} the summary quoted.`);
    }
    const receipt = checkReceipt(run, await reg.paymentResult());
    run.log(`${receipt.paymentId} ${receipt.status} via ${receipt.method}; gateway showed ${amountsSeen.length ? "RM " + amountsSeen.join(", RM ") : "no amount"}`);
    return { fee, bank, gatewayAmounts: amountsSeen, ...receipt };
  },

  /**
   * The finished record, read back — every workflow column and the expiry.
   *
   * The expiry is CREATION + 90 days to the minute. It anchors on when the
   * approved Pre-Application generated the Application, not on the dealer's
   * submit, so a one- or two-minute skew against the submission date is right.
   */
  async record(run) {
    const applicationNo = need(run.cp, "applicationNo", "assign");
    const bo = await boSession(run, "bo");
    const { detail, row } = await bo.openApplication({ applicationNo });
    const sidebar = await bo.sidebar(detail);
    await detail.close().catch(() => undefined);

    const created = listingDate(row["Application Created Date"]);
    const expiry = listingDate(row["Application Expiry Date"]);
    const expiryMinutesOff = created && expiry ? Math.round((expiry.getTime() - created.getTime()) / 60_000) - 90 * 24 * 60 : null;
    if (expiryMinutesOff !== 0) {
      throw new Error(
        `Expiry is not creation + 90 days: created "${row["Application Created Date"]}", ` +
          `expiry "${row["Application Expiry Date"]}" (${expiryMinutesOff} minute(s) off).`,
      );
    }
    // Each phase this checkpoint completed must show in the listing. A phase
    // that "passed" without moving the record is exactly what this catches.
    const done = (p: OnboardingPhase) => Boolean(run.cp.phases[p]);
    if (done("approve-app")) expectColumn(row, "Application Status", /^Approved$/i, "approve-app");
    if (done("submit-approval")) expectColumn(row, "Assignee / UCD", /^Checked$/i, "submit-approval");
    if (done("approve-app")) expectColumn(row, "Approver / Assignee", /^Checked$/i, "approve-app");
    if (done("verify-regdocs")) expectColumn(row, "Softcopy Docs", /^Checked$/i, "verify-regdocs");
    if (done("regfee")) expectColumn(row, "Registration Fee", /^OK$/i, "regfee");
    // The build stops short of Registered on purpose; seeing it means something
    // else created the account.
    expectColumn(row, "Hardcopy & Acc Created", /^(?!Registered$)/i, "the build (which never creates the account)");
    const assignee = (process.env.BO_ASSIGNEE_NAME ?? "").trim();
    if (assignee && run.cp.phases.assign?.assigned) expectColumn(row, "Assignee", new RegExp(`^${assignee}$`, "i"), "assign");

    run.log(`${applicationNo} — ${row["Application Status"]}; softcopy ${row["Softcopy Docs"]}; fee ${row["Registration Fee"]}; hardcopy ${row["Hardcopy & Acc Created"]}; expiry ${row["Application Expiry Date"]} (created + 90d exactly)`);
    return { row, sidebar, expiryMinutesOff };
  },
};

/**
 * Bring an EXISTING record under a checkpoint, by its Pre-Application number.
 *
 * Read-only: it looks up the dealer link, Application No and uuid and changes
 * nothing. The profile holds only what BackOffice shows, so the dealer-form
 * phases that need a full profile (`preapp`, `appform`) cannot run on an
 * adopted record — everything from `assign` onward can.
 */
export async function adoptRecord(run: OnboardingRun, preAppNo: string): Promise<void> {
  const bo = await boSession(run, "bo");
  await bo.openListing(BO_MENU.preApplicationListing);
  await bo.search({ preOnboardingNo: preAppNo });
  const preRow = await bo.readRow(preAppNo);
  const detail = await bo.openRow(preAppNo);
  await settleObs(detail);
  const dealerLink = await bo.applicationLink(detail);
  await detail.close().catch(() => undefined);

  const companyName = preRow["Company Name"] ?? preRow["Business Name"] ?? "";
  if (!companyName) throw new Error(`Could not read a company name for ${preAppNo}. Columns: ${Object.keys(preRow).join(" | ")}`);
  const app = await bo.openApplication({ companyName });
  await app.detail.close().catch(() => undefined);

  run.cp.profile = { ...run.cp.profile, businessName: companyName, adopted: true } as OnboardingProfile;
  learn(run, { preAppNo, dealerLink, applicationNo: app.row["Application No"], uuid: app.uuid });
  run.log(`adopted ${preAppNo} → ${app.row["Application No"]} (${app.row["Application Status"]}) — ${companyName}`);
}

export interface PhasePlan {
  /** Start here. Default: the first phase not yet done. */
  from?: OnboardingPhase;
  /** Stop AFTER this one. Default: the last. */
  until?: OnboardingPhase;
  /** Run exactly this one phase. */
  only?: OnboardingPhase;
}

/** The phases a plan selects, in order. */
export function planPhases(cp: OnboardingCheckpoint, plan: PhasePlan): OnboardingPhase[] {
  if (plan.only) return [plan.only];
  const firstUndone = ONBOARDING_PHASES.find((p) => !cp.phases[p]) ?? "record";
  const start = ONBOARDING_PHASES.indexOf(plan.from ?? firstUndone);
  const end = ONBOARDING_PHASES.indexOf(plan.until ?? "record");
  if (start < 0 || end < 0) throw new Error(`Unknown phase in ${JSON.stringify(plan)}. Phases: ${ONBOARDING_PHASES.join(", ")}`);
  if (start > end) throw new Error(`"from" (${plan.from ?? firstUndone}) comes after "until" (${plan.until}).`);
  return ONBOARDING_PHASES.slice(start, end + 1);
}

/**
 * Run the selected phases, checkpointing after each.
 *
 * A failed phase is recorded as the failure it is and rethrown; everything the
 * build learned before it stays on the checkpoint, which is what a resume reads.
 */
export async function runOnboarding(run: OnboardingRun, plan: PhasePlan = {}): Promise<Record<string, PhaseResult>> {
  const results: Record<string, PhaseResult> = {};
  for (const phase of planPhases(run.cp, plan)) {
    run.log(`\n── ${phase}`);
    const started = Date.now();
    try {
      const out = await PHASE[phase](run);
      results[phase] = out;
      run.cp.phases[phase] = { at: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000), ...out };
      delete run.cp.phases[`${phase}:failed`];
      saveCheckpoint(run.cp);
    } catch (err) {
      run.cp.phases[`${phase}:failed`] = { at: new Date().toISOString(), error: (err as Error).message.slice(0, 500) };
      saveCheckpoint(run.cp);
      throw err;
    }
  }
  return results;
}
