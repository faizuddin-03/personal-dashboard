import type { Locator, Page } from "@playwright/test";

/**
 * Arrival on a transaction's FINAL step — the one shared rule for every flow's final stop.
 *
 * EAINT-12253 (Azfar / BA, 21.10.2026): the Firefox-only "Browser Reminder" is NOT shown before
 * payment. It shows at the END of the transaction, on the final step after a successful payment or
 * submission (STMS Step 6, Insurance Step 4 Confirm, JomCheck "Report is retrieved successfully", …).
 * So a final stop must hand the page to the caller exactly as it arrived:
 *
 *   wait for the final screen's OWN marker, wait for any "Working..." overlay to clear, return.
 *
 * Nothing here clicks, presses a key, registers a dialog handler or hides an element. Never add a
 * popup sweep, `closePopups()`, `dismissAnnouncements()`, `confirmDialog()` or "press the top
 * dialog's OK" after a call to `awaitFinalScreen` — whatever is on screen is the CR spec's to see.
 */
export async function awaitFinalScreen(page: Page, marker: Locator, what: string, timeout = 60_000): Promise<void> {
  try {
    await marker.first().waitFor({ state: "visible", timeout });
  } catch {
    throw new Error(`Arrived at ${page.url()} but the final screen's marker (${what}) did not show within ${timeout / 1000} s.`);
  }
  await waitForWorkingToClear(page);
}

/**
 * Wait until no "Working..." overlay (the portal's blockUI text) is visible. Reads the DOM only.
 * Best-effort: a page that never shows it returns at once, and a timeout is swallowed (the marker
 * wait before it is the assertion).
 */
export async function waitForWorkingToClear(page: Page, timeout = 30_000): Promise<void> {
  await page
    .waitForFunction(
      () =>
        !Array.from(document.querySelectorAll("body *")).some((el) => {
          const e = el as HTMLElement;
          if (e.children.length > 0) return false;
          if ((e.textContent || "").trim() !== "Working...") return false;
          return e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
        }),
      undefined,
      { timeout, polling: 250 },
    )
    .catch(() => undefined);
}
