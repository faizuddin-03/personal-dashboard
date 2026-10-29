import type { Page, Download } from "@playwright/test";
import fs from "fs";
import path from "path";

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Append " (2)", " (3)" … until the path is free, so one run never clobbers its own evidence. */
function uniquePath(target: string, ext: string): string {
  let candidate = `${target}${ext}`;
  for (let n = 2; fs.existsSync(candidate); n++) candidate = `${target} (${n})${ext}`;
  return candidate;
}

/**
 * Wraps a download-triggering click (e.g. the [DO]/Invoice/e-Invoice
 * buttons, which fire via `window.open(...)` under the hood — confirmed live,
 * see _reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html:61)
 * so the extra popup PAGE that window.open() spawns gets its own video
 * renamed with a real label, instead of landing in the test's evidence
 * folder as an unlabeled duplicate that organizeTestEvidence() can only
 * number "(2)"/"(3)"/"(4)".
 *
 * A single browser CONTEXT still means a NEW PAGE per window.open() call —
 * Playwright records video per page, not per context (same reasoning as
 * utils/tracked-context.ts's own doc comment) — this just makes that extra
 * recording identifiable instead of hiding it as a mystery numbered file.
 *
 * Best-effort throughout: if no popup appears (e.g. a future build changes
 * this to an inline/same-page download), the download itself still
 * completes and is returned unchanged — labeling must never break a test.
 */
export async function downloadWithLabeledVideo(
  page: Page,
  label: string,
  trigger: () => Promise<void>,
): Promise<Download> {
  const context = page.context();
  const [popup, download] = await Promise.all([
    context.waitForEvent("page", { timeout: 5000 }).catch(() => null),
    page.waitForEvent("download"),
    trigger(),
  ]);

  if (popup) {
    await popup.close().catch(() => {});
    const video = popup.video();
    if (video) {
      try {
        const src = await video.path();
        const dir = path.dirname(src);
        const dest = uniquePath(path.join(dir, sanitize(label)), ".webm");
        await fs.promises.rename(src, dest);
      } catch {
        // best-effort — evidence labeling must never break the download
      }
    }
  }

  return download;
}
