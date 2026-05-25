export interface ChangelogEntry {
  title: string;
  description: string;
}

export interface ChangelogVersion {
  version: string;
  label: string;      // e.g. "v1.0 — Initial Release"
  date: string;       // YYYY-MM-DD
  changes: ChangelogEntry[];
}

// ── Past released versions (prod-local pushes) ───────────────
// Each entry here is locked — a snapshot of what shipped in that prod push.
export const RELEASED_VERSIONS: ChangelogVersion[] = [
  // Will be populated on each prod-local push.
];

// ── Current in-progress changes (staging-local only) ─────────
// Reset to [] after every prod-local push.
export const CURRENT_CHANGES: ChangelogEntry[] = [
  {
    title: "Cat Favicon",
    description: "A cat face icon now appears on the browser tab for a personal touch.",
  },
  {
    title: "Full Mobile Responsive Pass",
    description: "Bigger text, better touch targets, and proper spacing across all pages on small screens.",
  },
  {
    title: "Notes Page Mobile Layout",
    description: "Notes list and editor each take full screen on mobile, with a back button to switch between them.",
  },
  {
    title: "Daily Update Preview Toggle",
    description: "The preview panel is hidden by default on mobile and can be shown with a toggle button in the header.",
  },
  {
    title: "TS Tracker Horizontal Scroll",
    description: "The test case table now scrolls horizontally on small screens instead of overflowing off the edge.",
  },
  {
    title: "Mobile-Friendly Modals",
    description: "Kanban, Todo, and Settings modals now stack to a single column on mobile for easier reading.",
  },
  {
    title: "Assigned To Me Widget On Jira Page",
    description: "The Jira dashboard now includes an 'Assigned to Me' widget matching the style of the main dashboard.",
  },
  {
    title: "Completed Today Widget",
    description: "The main dashboard now shows a 'Completed Today' widget beside 'Raised Tickets' to track daily progress.",
  },
  {
    title: "Auto-Date On Status Change",
    description: "TS Tracker automatically updates the test date whenever you change a test case status.",
  },
  {
    title: "UAT2 Environment Option",
    description: "The insurance checker now includes UAT2 as an available environment to test against.",
  },
  {
    title: "More Accurate Wait Time Estimate",
    description: "The estimated wait time during an insurance check has been doubled to better reflect actual processing time.",
  },
];

export const CURRENT_VERSION       = "v0.004";
export const CURRENT_VERSION_LABEL = "Upcoming";
export const CURRENT_VERSION_DATE  = "2026-05-25";
