import { type Page, type Locator, expect } from "@playwright/test";
import { ENV } from "../utils/config";

export class BasePage {
  readonly page: Page;
  readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = ENV.baseUrl;
  }

  async goto(path: string) {
    const url = `${this.baseUrl}${path}`;
    try {
      await this.page.goto(url, { waitUntil: "networkidle" });
    } catch {
      // Legacy portals occasionally abort the initial request (a redirect
      // race right after login) or never reach networkidle. Retry once with
      // a load-based wait, then best-effort settle.
      await this.page.goto(url, { waitUntil: "domcontentloaded" });
      await this.page.waitForLoadState("networkidle").catch(() => {});
    }
  }

  async waitForNav() {
    await this.page.waitForLoadState("networkidle");
  }

  getTxnIdFromUrl(): string {
    const url = new URL(this.page.url());
    return url.searchParams.get("txnId") ?? "";
  }

  /** Accept the jQuery UI confirmation dialog (clicks the "Yes" button) */
  async acceptConfirmDialog() {
    await this.page.locator(".confirm-dialog-btn").click();
  }

  /** Dismiss the jQuery UI confirmation dialog (clicks the "No" button) */
  async dismissConfirmDialog() {
    await this.page.locator(".cancel-dialog-btn").click();
  }

  /** Wait for the jQuery UI dialog to appear */
  async waitForDialog() {
    await this.page.locator(".ui-dialog").waitFor({ state: "visible", timeout: 5000 });
  }

  today(): string {
    return new Date().toISOString().split("T")[0];
  }

  daysFromToday(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  }

  earliestRescheduleDate(): string {
    return this.daysFromToday(ENV.reschedule.blackoutDays);
  }

  /** Yesterday — a "previous" date, ISO yyyy-mm-dd. */
  yesterday(): string {
    return this.daysFromToday(-1);
  }

  /** The next Saturday strictly after today, ISO yyyy-mm-dd (a weekend date). */
  nextWeekend(): string {
    const d = new Date();
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() !== 6); // 0 = Sun, 6 = Sat
    return d.toISOString().split("T")[0];
  }

  /** A date `months` months ahead of today, ISO yyyy-mm-dd. */
  dateMonthsAhead(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  }

  // ──────────────────────────────────────────────────────────────
  // Demo mode — slow, highlighted playback for human-reviewable
  // recordings. Enabled via PW_DEMO=1 (the runner UI's "Demo mode"
  // toggle, default on). When off, every helper below is a no-op so
  // normal/CI runs stay fast. Highlighting is best-effort and must
  // never fail a test.
  // ──────────────────────────────────────────────────────────────

  private _demoSuppressed = 0;

  protected get demoMode(): boolean {
    return process.env.PW_DETAILED === "1" && this._demoSuppressed === 0;
  }

  /**
   * Run `fn` with demo highlighting/pauses temporarily suppressed. Wrap
   * calendar scans (finders that open/close many modals just to inspect)
   * in this so they stay fast and don't flood the recording with pulses on
   * dates the test never actually acts on.
   */
  protected async suppressDemo<T>(fn: () => Promise<T>): Promise<T> {
    this._demoSuppressed++;
    try {
      return await fn();
    } finally {
      this._demoSuppressed--;
    }
  }

  /** Default pause between steps, in ms (PW_DETAILED_DELAY overrides). */
  protected get demoDelay(): number {
    return Number(process.env.PW_DETAILED_DELAY || 1400);
  }

  /** Pause (demo mode only) so a human watching the recording can keep up. */
  async demoPause(ms?: number): Promise<void> {
    if (!this.demoMode) return;
    await this.page.waitForTimeout(ms ?? this.demoDelay);
  }

  /**
   * Highlight an element in the recording (demo mode only): scroll it into
   * view, draw a temporary amber outline, hold for `hold` ms, then restore.
   * `color` lets callers distinguish intent — amber (default) for "about to
   * act on this", green for "here is the result to check". No-op when demo
   * mode is off. Never throws.
   */
  async demoHighlight(
    target: Locator | string,
    opts: { hold?: number; color?: "amber" | "green" | "red" } = {},
  ): Promise<void> {
    if (!this.demoMode) return;
    const locator = typeof target === "string" ? this.page.locator(target) : target;
    const palette = { amber: "#f59e0b", green: "#22c55e", red: "#ef4444" };
    const color = palette[opts.color ?? "amber"];
    try {
      const el = locator.first();
      await el.scrollIntoViewIfNeeded({ timeout: 2000 });
      const handle = await el.elementHandle({ timeout: 2000 });
      if (!handle) return;
      await this.page.evaluate(
        ({ node, c }) => {
          (node as any).__demoPrevOutline = node.style.outline;
          (node as any).__demoPrevShadow = node.style.boxShadow;
          (node as any).__demoPrevOffset = node.style.outlineOffset;
          node.style.outline = `3px solid ${c}`;
          node.style.outlineOffset = "2px";
          node.style.boxShadow = `0 0 0 4px ${c}66`;
          node.scrollIntoView({ block: "center", behavior: "smooth" });
        },
        { node: handle, c: color },
      );
      await this.page.waitForTimeout(opts.hold ?? this.demoDelay);
      await this.page.evaluate((node) => {
        node.style.outline = (node as any).__demoPrevOutline ?? "";
        node.style.boxShadow = (node as any).__demoPrevShadow ?? "";
        node.style.outlineOffset = (node as any).__demoPrevOffset ?? "";
      }, handle);
      await handle.dispose();
    } catch {
      // Highlighting is best-effort — never break a test over it.
    }
  }
}
