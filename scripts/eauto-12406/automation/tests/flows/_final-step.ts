// Shared by the flows verify specs (not a spec itself): proves a flow's FINAL stop returned on
// arrival and touched nothing on the final screen (EAINT-12253, 21.10.2026 — the Firefox browser
// reminder shows on the final step after payment, so no flow may close, dismiss or confirm a
// dialog there).
//
// How: `recordUserActions(page)` installs a read-only recorder in every document the page loads.
// It logs each TRUSTED click and key press (Playwright's input is trusted; the page's own
// synthetic `.trigger('click')` is not) with the dialog it happened in, and each dialog
// (`.ui-dialog`, `.modal`, `.modal-campaign`, `[role=dialog]`, `#eauto-browser-reminder`) that goes from shown to hidden or
// is removed while shown. `expectUntouchedAfterArrival(page, …)` then reads the log of the
// document now on screen:
//   - no trusted click / key on it at all (the final screen is a page load of its own: Step 6,
//     Confirm, Result, Submission) — and then no dialog may have been hidden on it; or
//   - the last trusted click is the final pay / submit button inside the dialog named by
//     `finalClickIn` (the final screen is drawn on the page that was paid on: the JomCheck result,
//     the APT "Payment request sent"), nothing is clicked or pressed after it, and the only dialog
//     hidden after it is the one that click was in (the confirm closing itself).
// The log is attached to the test for the evidence review. Call `recordUserActions` FIRST, before
// signing in. It reads the page only; it never handles a native dialog.

import { test, expect, type Page } from "@playwright/test";

export interface UserAction {
  kind: "click" | "key" | "hidden";
  /** What was clicked / which key / which dialog went away (tag#id.class "text"). */
  what: string;
  /** The dialog a click or key happened in, or the dialog that was hidden: its recorder id. */
  dialogId?: number;
  /** That dialog's text when first seen (first 160 chars). */
  dialogText?: string;
  url: string;
}

export async function recordUserActions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __qaActions?: unknown[] };
    if (w.__qaActions) return;
    const log: unknown[] = [];
    w.__qaActions = log;
    // #eauto-browser-reminder (EAINT-12253 Browser Reminder, shown on the final step in Firefox) is
    // watched like a dialog, so a flow that hides it is logged and cannot close it unseen.
    const SEL = ".ui-dialog, .modal, .modal-campaign, [role=dialog], [role=alertdialog], #eauto-browser-reminder";
    const texts = new Map<Element, string>();
    let nextId = 1;
    const idOf = (d: Element): number => {
      const el = d as HTMLElement;
      if (!el.dataset.qaDlg) el.dataset.qaDlg = String(nextId++);
      return Number(el.dataset.qaDlg);
    };
    const shown = (d: Element): boolean => {
      if (!d.isConnected) return false;
      const cs = getComputedStyle(d);
      return d.getClientRects().length > 0 && cs.display !== "none" && cs.visibility !== "hidden";
    };
    const textOf = (d: Element) => ((d as HTMLElement).innerText || d.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160);
    const describe = (t: EventTarget | null): string => {
      const e = t as HTMLElement | null;
      if (!e || !e.tagName) return String(t);
      const cls = typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
      const label = ((e.innerText || (e as HTMLInputElement).value || "") + "").replace(/\s+/g, " ").trim().slice(0, 40);
      return `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${cls} "${label}"`;
    };
    const inDialog = (t: EventTarget | null) => {
      const d = (t as Element | null)?.closest?.(SEL);
      return d ? { dialogId: idOf(d), dialogText: texts.get(d) ?? textOf(d) } : {};
    };
    document.addEventListener(
      "click",
      (e) => {
        if (e.isTrusted) log.push({ kind: "click", what: describe(e.target), ...inDialog(e.target), url: location.href });
      },
      true,
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.isTrusted) log.push({ kind: "key", what: e.key, ...inDialog(e.target), url: location.href });
      },
      true,
    );
    const seen = new Set<Element>();
    const scan = () => {
      for (const d of Array.from(document.querySelectorAll(SEL))) {
        if (shown(d) && !seen.has(d)) {
          seen.add(d);
          idOf(d);
          texts.set(d, textOf(d));
        }
      }
      for (const d of Array.from(seen)) {
        if (!shown(d)) {
          seen.delete(d);
          log.push({ kind: "hidden", what: describe(d), dialogId: idOf(d), dialogText: texts.get(d) ?? "", url: location.href });
        }
      }
    };
    new MutationObserver(scan).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
  });
}

/** The recorder's log for the document now on screen. */
export async function actionsOnThisDocument(page: Page): Promise<UserAction[]> {
  return page.evaluate(() => ((window as unknown as { __qaActions?: unknown[] }).__qaActions ?? []) as never);
}

/**
 * Assert the final stop touched nothing after arrival (see the file header).
 * `finalClickIn`: the text of the dialog holding the final pay / submit button (or the button's own
 * description, e.g. /si-confirm-booking/), when the final screen is drawn on the page that was paid on. Pass it whenever the module has such a confirm;
 * a final screen that is a fresh page load passes with an empty log either way.
 */
export async function expectUntouchedAfterArrival(page: Page, opts: { finalClickIn?: RegExp } = {}): Promise<void> {
  const log = await actionsOnThisDocument(page);
  await test.info().attach("final-screen-actions.json", { body: JSON.stringify({ url: page.url(), log }, null, 2), contentType: "application/json" });

  const inputs = log.map((a, i) => ({ a, i })).filter(({ a }) => a.kind !== "hidden");
  if (inputs.length === 0) {
    const hidden = log.filter((a) => a.kind === "hidden");
    expect(hidden, `a dialog was hidden on the final screen ${page.url()}`).toEqual([]);
    return;
  }
  const last = inputs[inputs.length - 1];
  expect(
    opts.finalClickIn,
    `the final screen ${page.url()} was clicked / typed on, and this stop has no final in-page button: ${JSON.stringify(inputs.map((x) => x.a))}`,
  ).toBeDefined();
  expect(last.a.kind, `last input on the final screen: ${JSON.stringify(last.a)}`).toBe("click");
  // Matched against the dialog the click was in AND the clicked element ("button#si-confirm-booking …"),
  // so a final button that sits on the page rather than in a dialog can be named too.
  expect(`${last.a.dialogText ?? ""} ${last.a.what}`, `the last click must be the final pay / submit button: ${JSON.stringify(last.a)}`).toMatch(opts.finalClickIn!);
  const after = log.slice(last.i + 1).filter((a) => !(a.kind === "hidden" && a.dialogId !== undefined && a.dialogId === last.a.dialogId));
  expect(after, `touched after arriving on the final screen ${page.url()}`).toEqual([]);
}

/** Visible dialogs right now, as text: attached so the reviewer sees what the flow left on screen. */
export async function attachOpenDialogs(page: Page): Promise<string[]> {
  const open = await page
    .locator(".ui-dialog:visible, .modal.show:visible, .modal.in:visible, .modal-campaign:visible, [role=dialog]:visible")
    .allInnerTexts()
    .catch(() => [] as string[]);
  const texts = open.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 300));
  await test.info().attach("final-screen-open-dialogs.json", { body: JSON.stringify(texts, null, 2), contentType: "application/json" });
  return texts;
}
