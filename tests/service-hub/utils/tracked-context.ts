import type { Browser, BrowserContext, TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Open a second browser context for cross-portal tests (e.g. BO cancels an
 * appointment in one context while UCD checks the listing in another).
 *
 * Plain `browser.newContext()` does NOT inherit the project's video/trace
 * config — `use.video` in playwright.config.ts only auto-applies to the
 * fixture-managed default `page`/`context`. Any manually created context was
 * silently recording nothing at all. This opens the context with video
 * explicitly enabled (when PW_VIDEO=1) into the SAME per-test output folder
 * as the main context, so both sides of a cross-portal flow end up in one
 * place.
 */
export async function openTrackedContext(
  browser: Browser,
  testInfo: TestInfo,
): Promise<BrowserContext> {
  const recordVideo = process.env.PW_VIDEO === "1" ? { dir: testInfo.outputDir } : undefined;
  return browser.newContext({ recordVideo });
}

/**
 * Close a context opened with openTrackedContext, then rename its recorded
 * video (Playwright gives it an opaque hash filename) to
 * "<Test Title> - <label>.webm" in the same folder — matching the test
 * script's own name (like every other piece of evidence) instead of an
 * opaque hash, so it's easy to find later.
 */
export async function closeTrackedContext(
  context: BrowserContext,
  testInfo: TestInfo,
  label: string,
): Promise<void> {
  const pages = context.pages();
  const videos = pages.map((p) => p.video()).filter((v): v is NonNullable<typeof v> => !!v);
  await context.close(); // finalizes video files
  const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const base = `${safe(testInfo.title)} - ${safe(label)}`;
  for (let i = 0; i < videos.length; i++) {
    try {
      const src = await videos[i].path();
      const dir = path.dirname(src);
      const suffix = videos.length > 1 ? `-${i + 1}` : "";
      const dest = path.join(dir, `${base}${suffix}.webm`);
      await fs.promises.rename(src, dest);
    } catch {
      // best-effort — a rename failure shouldn't fail the test
    }
  }
}
