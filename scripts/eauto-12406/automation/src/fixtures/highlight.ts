/**
 * Highlight what a reviewer must look at, for screenshots and recordings.
 *
 * Draws a red outline + yellow wash on the element(s) and a small label badge,
 * scrolls them into view, and holds for a moment so a video (RECORD=1) shows
 * it clearly. Purely cosmetic: it touches inline styles and adds badges marked
 * `data-qa-hl`, which `clearHighlights` removes.
 */

import type { Locator, Page } from "@playwright/test";

const HOLD_MS = Number(process.env.HIGHLIGHT_HOLD_MS ?? 1500);

function paint(el: Element, label: string) {
  const e = el as HTMLElement;
  e.setAttribute("data-qa-hl-el", "1");
  e.style.outline = "3px solid #e11d48";
  e.style.outlineOffset = "2px";
  e.style.backgroundColor = "rgba(250, 204, 21, 0.35)";
  if (label) {
    const r = e.getBoundingClientRect();
    const b = document.createElement("div");
    b.setAttribute("data-qa-hl", "1");
    b.textContent = label;
    b.style.cssText =
      "position:absolute;z-index:2147483647;background:#e11d48;color:#fff;font:bold 12px/1.4 system-ui,sans-serif;" +
      "padding:2px 6px;border-radius:4px;pointer-events:none;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.4)";
    b.style.left = `${Math.max(0, r.left + window.scrollX)}px`;
    b.style.top = `${Math.max(0, r.top + window.scrollY - 20)}px`;
    document.body.appendChild(b);
  }
}

/** Highlight every element the locator matches, with one label on the first. */
export async function highlight(page: Page, target: Locator, label = "", holdMs = HOLD_MS): Promise<void> {
  const n = await target.count().catch(() => 0);
  if (!n) return;
  await target.first().scrollIntoViewIfNeeded().catch(() => undefined);
  for (let i = 0; i < n; i++) {
    await target.nth(i).evaluate(paint, i === 0 ? label : "").catch(() => undefined);
  }
  await page.waitForTimeout(holdMs);
}

/**
 * Highlight named columns of the table row that contains `rowText`.
 * Column names are matched against the row of <th> cells above it.
 */
export async function highlightRowCells(page: Page, rowText: string, columns: string[], label = "", holdMs = HOLD_MS): Promise<void> {
  const found = await page.evaluate(
    ({ rowText, columns, label }) => {
      const norm = (s: string) => s.replace(/\s+/g, " ").trim();
      const rows = Array.from(document.querySelectorAll("tr"));
      // Own cells only: BO pages nest the listing table inside a layout table,
      // and the outer row would otherwise match first.
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const row = rows.find((tr) => own(tr).length > 4 && norm(tr.textContent || "").includes(rowText));
      if (!row) return 0;
      const table = row.closest("table")!;
      const header = Array.from(table.querySelectorAll("tr")).find((tr) => tr.closest("table") === table && tr.querySelectorAll(":scope > th").length > 4);
      const heads = header ? Array.from(header.querySelectorAll(":scope > th")).map((th) => norm(th.textContent || "")) : [];
      const cells = own(row);
      const paintEl = (el: Element, text: string) => {
        const e = el as HTMLElement;
        e.setAttribute("data-qa-hl-el", "1");
        e.style.outline = "3px solid #e11d48";
        e.style.outlineOffset = "-2px";
        e.style.backgroundColor = "rgba(250, 204, 21, 0.45)";
        if (text) {
          const r = e.getBoundingClientRect();
          const b = document.createElement("div");
          b.setAttribute("data-qa-hl", "1");
          b.textContent = text;
          b.style.cssText =
            "position:absolute;z-index:2147483647;background:#e11d48;color:#fff;font:bold 11px/1.3 system-ui,sans-serif;" +
            "padding:1px 5px;border-radius:3px;pointer-events:none;white-space:nowrap";
          b.style.left = `${r.left + window.scrollX}px`;
          b.style.top = `${r.top + window.scrollY - 17}px`;
          document.body.appendChild(b);
        }
      };
      (row as HTMLElement).scrollIntoView({ block: "center", inline: "nearest" });
      (row as HTMLElement).style.boxShadow = "inset 0 0 0 2px #e11d48";
      // Match by position, not index: header rows carry extra / spanning
      // cells, so the n-th <th> is not always above the n-th <td>.
      const ths = header ? Array.from(header.querySelectorAll(":scope > th")) : [];
      let hit = 0;
      let first = true;
      for (const c of columns) {
        const th = ths.find((t, i) => heads[i].toLowerCase() === c.toLowerCase());
        if (!th) continue;
        const tr = th.getBoundingClientRect();
        const cell = cells.find((td) => { const r = td.getBoundingClientRect(); const mid = r.left + r.width / 2; return mid >= tr.left && mid <= tr.right; });
        if (!cell || cell.getAttribute("data-qa-hl-el")) continue;
        paintEl(cell, first && label ? label : c);
        first = false;
        hit++;
      }
      return hit;
    },
    { rowText, columns, label },
  ).catch(() => 0);
  if (found) await page.waitForTimeout(holdMs);
}

/** Remove every highlight and badge. */
export async function clearHighlights(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll("[data-qa-hl]").forEach((b) => b.remove());
    document.querySelectorAll("[data-qa-hl-el]").forEach((el) => {
      const e = el as HTMLElement;
      e.style.outline = ""; e.style.outlineOffset = ""; e.style.backgroundColor = "";
      e.removeAttribute("data-qa-hl-el");
    });
  }).catch(() => undefined);
}

/** The Payment Summary block on Step 5 (STMS, UCD to UCD, APT). */
export function paymentSummaryBlock(page: Page): Locator {
  return page.locator("div, table, fieldset, section")
    .filter({ hasText: /Payment Summary/ })
    .filter({ hasText: /Total Amount Payable/ })
    .last();
}
