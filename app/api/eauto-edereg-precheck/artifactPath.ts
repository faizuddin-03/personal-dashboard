import * as path from "node:path";
import * as fs from "node:fs";

// Shared between run/route.ts (writes), download-videos/route.ts and
// trim-video/route.ts (read what run/route.ts wrote) — added when
// publishVideos() moved from one shared flat folder (wiped on every run) to
// one subfolder PER RUN, so a bulk batch's earlier runs' recordings survive
// past later runs finishing (see run/route.ts's own doc comment on
// publishVideos() for why the old flat/wiped shape broke that).
export const PUBLIC_ART = path.join(process.cwd(), "public", "qa-artifacts", "eauto-edereg-precheck");

/** Resolves a video URL/path to a real absolute file INSIDE `PUBLIC_ART`,
 *  rejecting anything that could escape it via `..`, an absolute path, or
 *  more than one level of subdirectory. Accepts:
 *   - the full published URL, e.g. `/qa-artifacts/eauto-edereg-precheck/<runId>/main-1.webm`
 *   - just `<runId>/<file>` with no leading path
 *   - a bare `<file>` with no runId — legacy fallback for anything published
 *     before the per-run-subfolder change, in case an old link is still open
 *  Returns `null` if the input doesn't resolve to an existing file. */
export function resolveArtifactPath(input: string): string | null {
  const stripped = input.replace(/^\/?qa-artifacts\/eauto-edereg-precheck\//, "");
  const segments = stripped.split("/").filter(Boolean);
  if (!segments.length || segments.length > 2) return null;
  if (segments.some((s) => s === ".." || s.includes("\\") || s.includes(":"))) return null;

  const abs = path.join(PUBLIC_ART, ...segments);
  const rel = path.relative(PUBLIC_ART, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(abs)) return null;
  return abs;
}
