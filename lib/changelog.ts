export interface ChangelogVersion {
  version: string;
  label: string;      // e.g. "v1.0 — Initial Release"
  date: string;       // YYYY-MM-DD
  changes: string[];  // layman descriptions
}

// ── Past released versions (prod-local pushes) ───────────────
// Each entry here is locked — a snapshot of what shipped in that prod push.
export const RELEASED_VERSIONS: ChangelogVersion[] = [
  // Will be populated on each prod-local push.
];

// ── Current in-progress changes (staging-local only) ─────────
// Reset to [] after every prod-local push.
export const CURRENT_CHANGES: string[] = [
  "Added cat favicon icon to the browser tab",
  "Full mobile responsive pass — bigger text, better touch targets, and proper spacing on all pages",
  "Notes page now shows list and editor full-screen on mobile with a back button",
  "Daily Update preview panel hidden on mobile with a toggle button",
  "TS Tracker test case table scrolls horizontally on small screens instead of overflowing",
  "Kanban, Todo, and Settings modals now stack to single column on mobile",
  "Jira dashboard now has an 'Assigned to Me' widget matching the main dashboard style",
  "Main dashboard now shows a 'Completed Today' widget beside 'Raised Tickets'",
  "TS Tracker now automatically updates the test date when you change a test case status",
  "Insurance checker now includes UAT2 environment option",
  "Estimated wait time for insurance check doubled to be more accurate",
];

export const CURRENT_VERSION_LABEL = "Upcoming";
export const CURRENT_VERSION_DATE  = "2026-05-25";
