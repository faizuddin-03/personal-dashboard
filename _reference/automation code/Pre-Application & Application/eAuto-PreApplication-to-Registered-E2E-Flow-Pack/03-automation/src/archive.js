/**
 * Never overwrite a previous run's dump.
 *
 * WHY THIS EXISTS
 * Most probes in scripts/ write to a FIXED filename in discovery/. That is fine
 * for a probe whose output is a fact about the code, and wrong for a probe whose
 * output is a fact about a DAY — and this rig is full of the second kind. The
 * boundary probe's whole subject is what the build does on one particular date;
 * the pool census is the before-half of a before/after comparison. Re-running
 * either does not refresh a stale file, it destroys the only record of a moment
 * that cannot be revisited.
 *
 * That happened twice on 27-08-2026, in two different sessions, within an hour:
 * discovery/81-boundary-day.json (the closing-day capture a QA-Issue rested on)
 * and discovery/98-pool-census.json (the pre-fix shortlist reading). One was
 * recoverable from a transcript, the other only as a summary.
 *
 * So: before writing, move the existing file aside under the timestamp it
 * DESCRIBES rather than the time of the move, because the describing time is the
 * one a reader needs. Files that record their own `ranAt`/`at` are archived under
 * it; anything else falls back to its mtime.
 *
 *   const { archiveBeforeWrite } = require('../src/archive');
 *   archiveBeforeWrite(OUT);
 *   fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
 *
 * Returns the archive path, or null when there was nothing to archive.
 */
const fs = require('node:fs');
const path = require('node:path');

const ARCHIVE_DIR = 'archive';

/** The moment the file is ABOUT, not the moment we noticed it. */
function describedAt(file) {
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    const stamp = j.ranAt || j.at || j.capturedAt || j.probedAt;
    if (typeof stamp === 'string' && stamp.length >= 10) return stamp;
  } catch {
    /* not JSON, or malformed — an mtime is still better than clobbering it */
  }
  try {
    return fs.statSync(file).mtime.toISOString();
  } catch {
    return 'unknown';
  }
}

function archiveBeforeWrite(file) {
  if (!file || !fs.existsSync(file)) return null;

  const dir = path.join(path.dirname(file), ARCHIVE_DIR);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const stamp = describedAt(file).replace(/[:.]/g, '-');

  // Two runs on the same day must not collide — the second is not a duplicate of
  // the first, it is a different observation of a different moment.
  let dest = path.join(dir, `${base}-${stamp}${ext}`);
  let n = 1;
  while (fs.existsSync(dest)) dest = path.join(dir, `${base}-${stamp}__${n++}${ext}`);

  fs.renameSync(file, dest);
  console.log(`archived previous run -> ${path.relative(process.cwd(), dest)}`);
  return dest;
}

module.exports = { archiveBeforeWrite, describedAt, ARCHIVE_DIR };
