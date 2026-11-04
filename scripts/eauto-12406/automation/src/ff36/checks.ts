// Firefox 36 proofs a CR spec shares: run a plan without losing the points read before a bridge failure, prove a point
// from a step's screenshot, read the Browser Reminder (EAINT-12253, live from 28.10.2026) as the bridge saw it, and read
// the screen an APT payment lands on (after the EAINT-12626 fix: Step 6 Transfer straight away).
//
// Moved here 27.10.2026 from cr/EAINT-12253/03-spec/_checks.ts, which EAINT-12626 and EAINT-12650 had copied (and cut
// down) into their own folders. Where the copies had drifted, this is the union: `proveAfterContinueAndF5` keeps 12253's
// `prefix` / `done` options and 12626's page address in the F5 line; `rethrow` takes runs that may not have happened;
// `runFf36` takes the bridge options (`downloads`, `javaPlugin`) that 12253's `runFf36With` passed.
// The plans themselves are in ./journeys.ts; ticket-only checks stay in cr/<TICKET>/03-spec/_checks.ts.
import type { Page } from "@playwright/test";
import type { TsRun } from "../fixtures/ts-run";
import { lanePersona, type PersonaKey } from "@config/personas";
import { Ff36BridgeError, type Ff36Result, type Ff36StepResult } from "../fixtures/ff36-step";
import type { Ff36Plan } from "./journeys";

export const words = (s: string | null | undefined) => String(s ?? "").replace(/\s+/g, " ").trim();
export const pathOf = (u?: string) => { try { return new URL(String(u)).pathname; } catch { return String(u ?? ""); } };

// ------------------------------------------------------------------ the reminder's wording (EAINT-12253 SRD v1.1 REQ-002 / REQ-003)

export const REMINDER_SRD = {
  title: "Browser Reminder 浏览器提醒",
  english:
    "Mozilla Firefox support will end on 31 December 2026. Starting 1 January 2027, please use Google Chrome to access eAuto and complete your transactions. For a smoother and more secure experience, we recommend switching to Google Chrome early.",
  chinese:
    "Mozilla Firefox 的支持服务将于 2026年12月31日 结束。自 2027年1月1日 起，请使用 Google Chrome 访问 eAuto 并完成您的交易。为获得更顺畅与安全的使用体验，建议您尽早转换至 Google Chrome。",
  continue: "Continue 继续",
  guide: "View User Guide 查看操作指南",
};

// ------------------------------------------------------------------ running a Firefox 36 plan

export interface Ff36Run {
  r?: Ff36Result;
  /** The bridge's own failure (environment / a step it could not do), rethrown by `rethrow()` AFTER the proofs. */
  err?: Error;
}

/** Run the plan; a bridge failure does not throw here, so the points read before it are still proved. */
export async function runFf36(ts: TsRun, plan: Ff36Plan, label: string, opts?: { downloads?: boolean; javaPlugin?: boolean }): Promise<Ff36Run> {
  try {
    return { r: await (opts ? ts.ff36.run(plan.steps, label, opts) : ts.ff36.run(plan.steps, label)) };
  } catch (e) {
    if (e instanceof Ff36BridgeError) return { r: e.result, err: e };
    throw e;
  }
}

/** Rethrow a bridge failure once every point that could be read has been proved (the gate then files it). */
export function rethrow(...runs: (Ff36Run | undefined)[]) {
  const failed = runs.find((x) => x?.err);
  if (failed) throw failed.err;
}

/** The step's screenshot, or the nearest earlier one in the same plan (for a read-only step that takes none). */
export function shotOf(plan: Ff36Plan, run: Ff36Run, ...labels: string[]): string | undefined {
  for (const l of labels) {
    const s = plan.at(run.r, l);
    if (s?.shot) return s.shot;
  }
  return undefined;
}

/**
 * Prove a point from Firefox 36 steps. Skipped (no proof) when the plan stopped before the step that shows it: the
 * gate then reports the bridge failure instead of a fake mismatch. Returns whether a proof was recorded.
 */
export async function proveFf(ts: TsRun, point: string, shot: string | undefined, match: boolean, shows: string): Promise<boolean> {
  if (!shot) {
    ts.note(`${point}: not proved — the Firefox 36 step that shows it did not run (${shows.slice(0, 160)})`);
    return false;
  }
  await ts.prove(point, match, shot, shows);
  return true;
}

/** proveFf with the proof's `expected` = the point's own text + `extra` (e.g. a meaning the TS gained after approval). */
export async function proveFfAs(ts: TsRun, point: string, shot: string | undefined, match: boolean, shows: string, extra: string): Promise<boolean> {
  if (!shot) {
    ts.note(`${point}: not proved — the Firefox 36 step that shows it did not run (${shows.slice(0, 160)})`);
    return false;
  }
  const base = ts.def?.points.find((x) => x.id === point)?.text ?? "";
  await ts.prove(point, { shows, match, file: shot, expected: `${base} — ${extra}` });
  return true;
}

// ------------------------------------------------------------------ the reminder as read by the bridge

export const isShown = (s?: Ff36StepResult) => s?.state === "shown";
export const isAbsent = (s?: Ff36StepResult) => !!s && s.state === "absent";
export const stateWords = (s?: Ff36StepResult) => (!s ? "not read" : s.state === "shown" ? "reminder DISPLAYED" : "no reminder");

/** A reminder step read as "displayed, title and both buttons" (the `reminder` step's text = title | whole text). */
export function reminderComplete(s?: Ff36StepResult): { ok: boolean; shows: string } {
  if (!s) return { ok: false, shows: "not read" };
  const text = words(s.text);
  const R = REMINDER_SRD;
  const ok = s.state === "shown" && text.includes(R.title) && text.includes(R.continue) && text.includes(R.guide);
  return {
    ok,
    shows: s.state === "shown"
      ? `reminder displayed; title "${words(text.split("|")[0])}"; Continue 继续 ${text.includes(R.continue) ? "present" : "MISSING"}; View User Guide 查看操作指南 ${text.includes(R.guide) ? "present" : "MISSING"}`
      : `no reminder (${text})`,
  };
}

/** "RM 10.00" / "10.00" style amounts, all present in the text. */
export const hasAmounts = (text: string | undefined, ...amounts: string[]) => amounts.every((a) => new RegExp(`RM\\s*${a.replace(".", "\\.")}|:\\s*${a.replace(".", "\\.")}\\b`).test(words(text)));

/**
 * The common "after [Continue 继续] / after F5" point of a final step (labels from `continueThenF5`, optionally prefixed):
 *  1. after Continue the reminder is gone and the screen's own control (`what`) is on screen;
 *  2. after F5 the reminder is displayed again (Azfar / BA 21.10.2026: it shows every time the final step loads);
 *  3. with `done`: the screen's Done button leaves it.
 */
export async function proveAfterContinueAndF5(ts: TsRun, plan: Ff36Plan, run: Ff36Run, point: string, o: { what: string; prefix?: string; done?: boolean }) {
  const pre = o.prefix ?? "";
  const c = plan.at(run.r, `${pre}continue`);
  const u = plan.at(run.r, `${pre}usable`);
  const f = plan.at(run.r, `${pre}f5`);
  // A Continue run with `ifShown` presses nothing when the reminder is not up (21.10.2026, APT Step 6): that is never
  // "Continue closed it".
  const notPressed = /^reminder not shown: nothing pressed/.test(c?.text ?? "");
  await proveFf(ts, point, c?.shot, isAbsent(c) && !notPressed && !!u?.found,
    `After [Continue 继续]: ${!c ? "not read" : notPressed ? "NOT pressed: the reminder was not displayed before it" : isAbsent(c) ? "the reminder closed" : "the reminder is STILL displayed"}; ${o.what} ${u?.found ? "is on screen" : "NOT found"}`);
  await proveFf(ts, point, f?.shot, isShown(f),
    `After F5 on the same screen (${pathOf(f?.url)}): ${!f ? "not read" : isShown(f) ? "the reminder is displayed again" : "the reminder is NOT displayed"}`);
  if (o.done) {
    const d = plan.at(run.r, `${pre}done`);
    await proveFf(ts, point, d?.shot, !!d?.found, `[Done] pressed: ${d?.found ? `went on to ${pathOf(d.url)}` : "the screen did NOT change"}`);
  }
}

// ------------------------------------------------------------------ the reminder in the Playwright tab (Chrome / current Firefox)

/** The Chrome-side reminder, for highlighting. */
export const pageReminder = (page: Page) => page.locator("#eauto-browser-reminder");

/** Is the reminder visible in the Playwright tab? Waits up to `ms` for it to APPEAR. */
export async function pageReminderVisible(page: Page, ms = 8000): Promise<boolean> {
  return pageReminder(page).waitFor({ state: "visible", timeout: ms }).then(() => true).catch(() => false);
}

// ------------------------------------------------------------------ the sub UCD user

/**
 * A Sub UCD user of AZFARAZO (Azfar1's company) for a TS that names one (12253 Q18): AzfarL3 (`ucdE2E3`, lane 3),
 * approved by Azfar 21.10.2026 (automation/env/lanes.md: AzfarL3 / AzfarL4 are Sub UCD (Administrator) users of
 * AZFARAZO). `notAs`: a persona the sub user must not be (the TS's main user); AzfarL4 (`ucdE2E4`) is used then. A run
 * on lane 4 uses its own AzfarL4, so it never signs in as lane 3's account. (The lane roster's own pairing is
 * `subPersona()` in @config/personas.)
 */
export function subUcdUser(notAs?: PersonaKey): PersonaKey {
  const own = lanePersona();
  if ((own === "ucdE2E3" || own === "ucdE2E4") && own !== notAs) return own;
  return notAs === "ucdE2E3" ? "ucdE2E4" : "ucdE2E3";
}

// ------------------------------------------------------------------ the screen an APT payment lands on (Firefox 36)
// After the EAINT-12626 fix (on /uat1/ 26.10.2026, live 28.10.2026): after a successful APT payment there is NO "Payment
// request sent" popup and NO F5: the page lands straight on Step 6 Transfer (`apt/transaction/jpj-sub.do`, "JPJ Transfer
// Status"). The plans are `aptPayToStep6` / `aptRetryPayToStep6` (./journeys.ts, labels of `aptLandingAfterPayment`).

export interface AptLanding {
  sent: boolean;
  dialogs: string;
  /** jpj-sub.do, heading "Submission (JPJ Transfer)" and step strip "6 Transfer". */
  onStep6: boolean;
  url: string;
  strip: string;
  heading: string;
  status: string;
  /** The screenshot taken straight after the payment (the `landed` step). */
  shot?: string;
  /** What the first wait saw ("JPJ Transfer Status" / "Payment request sent" / a refusal), or that nothing came. */
  first: string;
  step6Url: string;
}

/** Read `aptLandingAfterPayment`'s labels (prefixed by `tag`). */
export function aptLandingOf(plan: Ff36Plan, run: Ff36Run, tag = ""): AptLanding {
  const g = plan.at(run.r, `${tag}landed`);
  const d = plan.at(run.r, `${tag}dialogs`);
  const s = plan.at(run.r, `${tag}sent`);
  const s6 = plan.at(run.r, `${tag}step6`);
  const strip = words(plan.at(run.r, `${tag}step6-strip`)?.text);
  const heading = words(plan.at(run.r, `${tag}step6-heading`)?.text);
  const status = words(plan.at(run.r, `${tag}step6-status`)?.text);
  const dialogs = words(d?.text);
  const url = s6?.url || g?.url || "";
  const gt = words(g?.text);
  const first = !g ? "not read" : !g.found ? `nothing within 150 s (page text: ${gt.slice(0, 120)})`
    : /Payment request sent/.test(gt) && !/JPJ Transfer Status/.test(gt) ? "the 'Payment request sent' dialog"
      : /JPJ Transfer Status/.test(gt) ? "Step 6 text (JPJ Transfer Status)" : "an RHB refusal (TIDAK MENCUKUPI)";
  return {
    sent: !!s?.found || /Payment request sent/i.test(dialogs),
    dialogs,
    onStep6: !!s6?.found && /apt\/transaction\/jpj-sub\.do/.test(url) && /Submission \(JPJ Transfer\)/.test(heading) && /6\s*Transfer/.test(strip),
    url, strip, heading, status, shot: g?.shot, first,
    step6Url: words(plan.at(run.r, `${tag}step6-url`)?.text),
  };
}

export const aptLandingWords = (l: AptLanding) =>
  `after the payment confirm (nothing clicked, no F5): first came ${l.first}; "Payment request sent" ${l.sent ? "SHOWN" : "not shown"}; ` +
  `visible dialogs: ${l.dialogs || "none"}; page ${pathOf(l.url) || "?"}; step strip "${l.strip}"; heading "${l.heading}"; JPJ Transfer Status "${l.status}"`;

/** The page is Step 6 Transfer: jpj-sub.do, heading "Submission (JPJ Transfer)", strip "6 Transfer". */
export const isStep6 = (l: Pick<AptLanding, "onStep6" | "strip">) => l.onStep6 && /6\s*Transfer/.test(l.strip);
