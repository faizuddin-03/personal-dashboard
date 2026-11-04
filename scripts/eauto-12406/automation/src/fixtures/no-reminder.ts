// Proofs that the Firefox Browser Reminder (EAINT-12253, live from 28.10.2026) is NOT shown, in a browser Playwright
// drives (Chrome, Edge, a current Firefox). Assertions and evidence only; the journeys are the flows.
// Moved here 27.10.2026 from cr/EAINT-12253/03-spec/_no-reminder.ts (written 21.10.2026 by cr-author), which
// EAINT-12626 and EAINT-12650 had copied. The Firefox 36 side (where it IS shown) is src/ff36/checks.ts.
//
// Two layers, so a reminder that flashes and goes away is still caught:
//  - a WATCHER (BrowserReminder.watch): from the start of the TS, every page is checked twice a second and on every DOM
//    change; each time #eauto-browser-reminder is rendered it is logged with its address;
//  - a READ on the screen being proved, polled for a few seconds (the reminder shows on arrival, possibly a moment late).
// A point matches only when the read says "not displayed" AND the watcher never saw it.
//
// `at()` proves a screen the flow passes through without stopping: a one-shot Playwright locator handler that runs when
// the screen's own marker is visible as the flow acts on it (its next click / check on that screen), takes the proof,
// and lets the flow carry on (noWaitAfter). If the flow never acts while that marker is visible, no proof is recorded
// and the gate reports the point as missing (never as a pass).
import type { Locator } from "@playwright/test";
import type { TsRun } from "./ts-run";
import { BrowserReminder } from "@pages/ucd/browser-reminder.page";

export interface Fact {
  shows: string;
  ok: boolean;
}

const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };

export class NoReminder {
  readonly rem: BrowserReminder;
  private readonly armed: { point: string; where: string; fired: () => boolean; dispose: () => Promise<void> }[] = [];

  constructor(private readonly ts: TsRun) {
    this.rem = new BrowserReminder(ts.page);
  }

  /** Before the journey: the harness stops closing pop-ups (so nothing could hide the reminder) and the watcher starts. */
  async start(): Promise<void> {
    await this.ts.keepPopups();
    await this.rem.watch();
    const ua = await this.ts.page.evaluate(() => navigator.userAgent).catch(() => "");
    const ver = this.ts.context.browser()?.version() ?? "";
    this.ts.note(`browser: ${ua} (version ${ver}); Browser Reminder watcher on`);
    await this.ts.card("Browser", ver ? `version ${ver}` : "", ua, 2200);
  }

  /** What the watcher saw since the start, in words. */
  watcherWords(): string {
    const seen = this.rem.sightings;
    return seen.length
      ? `the watcher saw the reminder DISPLAYED ${seen.length}x: ${seen.map((s) => `${pathOf(s.url)} "${s.title}" at ${s.at}`).join("; ")}`
      : `the watcher never saw it since the start of the TS (${this.rem.pagesWatched} pages checked)`;
  }

  /**
   * Prove "no Browser Reminder" on the screen showing now: read for `ms` (default 5 s), plus the TS's other facts for
   * this point (`facts`, each must hold). Screenshot outlines `hl`.
   */
  async prove(point: string, where: string, o: { ms?: number; facts?: Fact[]; hl?: Locator | Locator[] | null; name?: string; expected?: string } = {}) {
    const a = await this.rem.absentFor(o.ms ?? 5_000);
    const facts = o.facts ?? [];
    const watcherOk = this.rem.sightings.length === 0;
    const shows = [`${where}: ${BrowserReminder.describe(a.state)}`, ...facts.map((f) => f.shows), this.watcherWords()].join("; ");
    return this.ts.prove(point, { shows, match: a.absent && watcherOk && facts.every((f) => f.ok), hl: o.hl ?? null, name: o.name, expected: o.expected });
  }

  /**
   * Arm a proof for a screen the flow passes through: when `marker` is visible as the flow acts (and the address matches
   * `url`), prove `point` there once. `facts` is read at that moment.
   */
  async at(marker: Locator, point: string, where: string, o: { url?: RegExp; ms?: number; facts?: () => Promise<Fact[]>; hl?: Locator | null; name?: string; expected?: string } = {}) {
    const page = this.ts.page;
    let done = false;
    const handler = async () => {
      if (done || (o.url && !o.url.test(page.url()))) return;
      done = true;
      try {
        await this.prove(point, where, { ms: o.ms ?? 1_500, facts: o.facts ? await o.facts() : [], hl: o.hl === undefined ? marker : o.hl, name: o.name, expected: o.expected });
      } catch (e) {
        this.ts.note(`${point} at "${where}": the proof could not be taken (${String(e).split("\n")[0]})`);
      }
      // Do NOT remove the handler from in here (tried 21.10.2026 ~14:20): Playwright then drops the
      // handler's entry before the run is reported finished, the intercepted action is never released,
      // and it times out ("intercepting action to run the handler": CH_TS4, CH_TS6, BEH_TS4 runs from
      // 14:52). Once `done`, the handler returns at once; disarm() removes it after the journey.
    };
    await page.addLocatorHandler(marker, handler, { noWaitAfter: true });
    const entry = { point, where, fired: () => done, dispose: () => page.removeLocatorHandler(marker).catch(() => undefined) };
    this.armed.push(entry);
    return entry;
  }

  /** After the journey: note every armed screen the flow did not pass while armed, and remove the handlers. */
  async disarm(): Promise<void> {
    for (const a of this.armed.splice(0)) {
      if (!a.fired()) this.ts.note(`${a.point}: "${a.where}" was not proved — the flow did not act on that screen while the check was armed`);
      await a.dispose();
    }
  }
}

/** Every amount ("10.00") present in the text as "RM 10.00" / "RM10.00" / ": 10.00". */
export const amountsIn = (text: string, ...amounts: string[]) =>
  amounts.every((a) => new RegExp(`(RM\\s*|:\\s*)${a.replace(".", "\\.")}\\b`).test(text.replace(/\s+/g, " ")));
