/**
 * The Firefox "Browser Reminder 浏览器提醒" popup (EAINT-12253), as Playwright sees it — for the rows that run
 * in Chrome, Edge or a current Firefox, where it must NEVER be shown. (Firefox 36 is driven by
 * `ts.ff36.run`, whose `reminder` step reads the same element.)
 *
 * Markup, seen on staging /uat1/ 21.10.2026 (probe cr/EAINT-12253/03-spec/probes-2110/p04, reminder-outer.html;
 * first look 04-explore/2026-10-21-first-look.md): the overlay `div#eauto-browser-reminder.ebr-overlay` is in the
 * page on a final step with inline `display:none`, and `display:block` only for Firefox below 37
 * (`isLegacyFirefox()`); title `h2.ebr-title`, buttons `#ebrContinueBtn` (Continue 继续), `#ebrGuideBtn`
 * (View User Guide 查看操作指南), `#ebrCloseBtn`. It is not a .ui-dialog / .modal / .modal-campaign.
 *
 * READ-ONLY: nothing here clicks, presses or hides anything.
 *
 *   const rem = new BrowserReminder(page);
 *   await rem.watch();                      // once, right after the test starts: logs every time it is ever visible
 *   const s = await rem.absentFor(5_000);   // on a screen: polls 5 s, never visible?
 */
import type { Page } from "@playwright/test";

export interface ReminderState {
  /** `#eauto-browser-reminder` is in the page. */
  inDom: boolean;
  /** Its computed display ("none" when hidden), or null when not in the page. */
  display: string | null;
  /** The overlay is rendered (display not none, has a box). */
  visible: boolean;
  /** Any visible element whose own text is "Browser Reminder" / "浏览器提醒" (a reminder in some other markup). */
  textVisible: boolean;
  /** The title as rendered, when visible. */
  title: string;
  url: string;
}

/** A moment the watcher saw the reminder rendered. */
export interface ReminderSighting {
  at: string;
  url: string;
  title: string;
}

const RE = "Browser Reminder|浏览器提醒";

export class BrowserReminder {
  private readonly seen: ReminderSighting[] = [];
  private watching = false;
  private loads = 0;

  constructor(private readonly page: Page) {}

  /** Read the reminder's state now. */
  async state(): Promise<ReminderState> {
    return this.page.evaluate((reSrc) => {
      const re = new RegExp(reSrc);
      const el = document.getElementById("eauto-browser-reminder");
      const shown = (e: Element) => {
        const cs = getComputedStyle(e);
        return e.getClientRects().length > 0 && cs.display !== "none" && cs.visibility !== "hidden";
      };
      // The harness's own banner / clock (.qa-mark, #qa-rec-clock) can quote the words: never count them.
      const leaves = Array.from(document.querySelectorAll("body *")).filter(
        (e) => !e.closest(".qa-mark, #qa-rec-clock") && re.test(e.textContent || "") && !Array.from(e.children).some((c) => re.test(c.textContent || "")),
      );
      return {
        inDom: !!el,
        display: el ? getComputedStyle(el).display : null,
        visible: !!el && shown(el),
        textVisible: leaves.some(shown),
        title: el ? ((el.querySelector(".ebr-title")?.textContent || "").replace(/\s+/g, " ").trim()) : "",
        url: location.href,
      };
    }, RE);
  }

  /**
   * Watch every page of this tab from now on: an init script checks `#eauto-browser-reminder` twice a second and
   * on every DOM change, and reports each time it is rendered. Call once per test, before the journey.
   */
  async watch(): Promise<void> {
    if (this.watching) return;
    this.watching = true;
    await this.page.exposeBinding("__qaReminderSeen", (_src, url: string, title: string) => {
      this.seen.push({ at: new Date().toISOString(), url, title });
    });
    await this.page.exposeBinding("__qaReminderLoad", () => { this.loads += 1; });
    await this.page.context().addInitScript(() => {
      const w = window as unknown as { __qaReminderSeen?: (u: string, t: string) => void; __qaReminderLoad?: () => void };
      let reported = false;
      const check = () => {
        const el = document.getElementById("eauto-browser-reminder");
        let on = false;
        let title = "";
        if (el) {
          const cs = getComputedStyle(el);
          on = el.getClientRects().length > 0 && cs.display !== "none" && cs.visibility !== "hidden";
          title = (el.querySelector(".ebr-title")?.textContent || "").trim();
        }
        if (on && !reported) { reported = true; w.__qaReminderSeen?.(location.href, title); }
        if (!on) reported = false;
      };
      document.addEventListener("DOMContentLoaded", () => {
        w.__qaReminderLoad?.();
        check();
        new MutationObserver(check).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
      });
      setInterval(check, 500);
    });
  }

  /** Every time the watcher saw the reminder rendered, since `watch()`. */
  get sightings(): ReminderSighting[] {
    return [...this.seen];
  }

  /** Pages loaded since `watch()` (each checked by the watcher). */
  get pagesWatched(): number {
    return this.loads;
  }

  /**
   * Poll for `ms` (the reminder shows on arrival, possibly a moment after the page loads): true only when it was
   * never rendered in that time. Returns the last state read.
   */
  async absentFor(ms = 5_000): Promise<{ absent: boolean; state: ReminderState }> {
    const t0 = Date.now();
    let state = await this.state();
    let absent = !state.visible && !state.textVisible;
    while (absent && Date.now() - t0 < ms) {
      await this.page.waitForTimeout(250);
      state = await this.state();
      absent = !state.visible && !state.textVisible;
    }
    return { absent, state };
  }

  /** Plain words for a proof: what the page shows about the reminder. */
  static describe(s: ReminderState): string {
    if (s.visible || s.textVisible) return `Browser Reminder DISPLAYED${s.title ? ` ("${s.title}")` : ""}`;
    return `no Browser Reminder (${s.inDom ? `its markup is in the page, display ${s.display}` : "its markup is not in the page"})`;
  }
}
