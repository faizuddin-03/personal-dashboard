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
  {
    version: "v0.010",
    label: "v0.010",
    date: "2026-05-26",
    changes: [
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
      {
        title: "What's New Modal",
        description: "A changelog popup appears on first load each session and is also accessible from the sidebar.",
      },
      {
        title: "CR Ticket Task Progress Bar",
        description: "CR Ticket kanban cards now show a Task Progress bar based on custom tasks linked to the same Jira key.",
      },
    ],
  },
];

// ── Current in-progress changes (staging-local only) ─────────
// Reset to [] after every prod-local push.
export const CURRENT_CHANGES: ChangelogEntry[] = [
  {
    title: "What's New Shows Only New Changes",
    description: "The popup now only displays changes since the last prod release. It no longer shows history, and won't auto-open if there's nothing new.",
  },
  {
    title: "JIRA Issue Filter Page",
    description: "Pick any parent ticket (CR or otherwise) and see all its child issues in one view, nested under JIRA in the sidebar.",
  },
  {
    title: "Issue Filter: Multi-Tab Support",
    description: "Open multiple independent filters at the same time as tabs. Each tab has its own parent ticket, filter state, and results. Double-click a tab to rename it. Tabs persist across page visits.",
  },
  {
    title: "Issue Filter: Three-State Chips",
    description: "Filter chips now cycle through three states: neutral (no effect), blue (include only), and red/strikethrough (exclude). Include and exclude can be combined on the same field.",
  },
  {
    title: "Completed Today Tracks Hand-offs",
    description: "The Completed Today widget now shows any ticket you transitioned today — including ones sent to Redev or other statuses — not just tickets still assigned to you marked Done.",
  },
  {
    title: "Notes Gallery View",
    description: "Notes now open in a full-width card grid. Click any card to open the existing split-view editor. A grid icon in the editor's sidebar navigates back to the gallery.",
  },
  {
    title: "Notes Gallery Grid Size Toggle",
    description: "A floating widget at the bottom-right of the Notes gallery lets you switch between large cards (snippet + tags) and small cards (title + headings only).",
  },
  {
    title: "Notes Filter by Tags and Colour",
    description: "A collapsible Filter panel in the Notes gallery lets you narrow results by one or more tags and colours at the same time. All selected filters must match (AND logic).",
  },
  {
    title: "More System Themes",
    description: "Two new dark themes (Crimson, Ocean) and two new light themes (Blossom, Sand) added to the theme picker in Settings.",
  },
  {
    title: "More Note Colours",
    description: "Five additional note colours (Pink, Teal, Orange, Yellow, Cyan) added to the colour palette in the note editor.",
  },
];

export const CURRENT_VERSION       = "v0.017";
export const CURRENT_VERSION_LABEL = "Upcoming";
export const CURRENT_VERSION_DATE  = "2026-05-28";

