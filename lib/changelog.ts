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
    version: "v0.019",
    label: "v0.019",
    date: "2026-05-28",
    changes: [
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
        description: "Filter chips now cycle through three states: neutral (no effect), green (include only), and red/strikethrough (exclude). Include and exclude can be combined on the same field.",
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
      {
        title: "Notes Sort Options",
        description: "Sort the notes gallery by Last Updated, Date Created, Title A→Z, or Title Z→A using the dropdown in the gallery header.",
      },
      {
        title: "Note Templates",
        description: "The New button now opens a template picker with Blank, Meeting Notes, Bug Report, and Daily Standup starters.",
      },
      {
        title: "Word & Character Count",
        description: "The note editor now shows a live word and character count in the footer.",
      },
      {
        title: "JIRA Filter: Saved Presets",
        description: "Save the current filter state as a named preset and reload it any time from the filter panel. Presets persist across sessions and can be deleted individually.",
      },
    ],
  },
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
    title: "Sage keeps the knowledge base learning",
    description: "A fifth pipeline character, the Sage, watches everything done in the pipeline: finished jobs, your chat messages, approvals, confirmed or dismissed findings and raised QA-Issues. About 2 minutes after a ticket goes quiet, it adds what was learned to the knowledge base and flow files, with the source on every line. Anything that would change an existing fact waits for your OK on the new Learnings page (Approve or Reject, old and new text side by side). The Sage also lists ideas to improve the pipeline and remembers your answers: when a character asks you something you already answered, the Sage answers it for you and the character carries on. You can mark such an answer wrong so it is asked again. You can also chat with the Sage, and the other characters can ask it what the knowledge base says.",
  },
  {
    title: "Pipeline Page",
    description: "A new Pipeline page in the sidebar shows each of your tickets as a card on a board, from Studied to Done, with the pixel character working on it and a Needs you badge when it is waiting for you. Open a card to work on the ticket in one place: read the study and related history, ask Elf for test scenarios and chat changes, approve them (green light) so Dwarf builds the automation, turn the official TS status sync on or off, and check findings from failed runs. A confirmed finding asks for priority and developer, Scout writes the QA-Issue draft, and nothing goes to Jira until you press Raise and confirm. Add any ticket by typing its key.",
  },
  {
    title: "Agents Page",
    description: "A new Agents page in the sidebar shows the two scheduled study agents as pixel characters in a castle hall. The Jira Scout checks Jira every hour for new or changed CR tickets and studies them; the SharePoint Scribe checks the synced QA test scripts every 2 hours (both Mon–Fri, 8am–7pm). Each character rests, looks for work, reads, writes or celebrates to match what the agent is doing, with a speech bubble and progress bar. Below the picture: each agent's next run, what it studied last, recent events, a Run now button, Jira and SharePoint setup, and the last 30 runs.",
  },
  {
    title: "New Medieval Style",
    description: "Settings → Appearance now has a Style switch: Normal (the existing colour themes) or Medieval. Medieval gives every page a calm, cozy cottage look: dark warm surfaces, pixel lettering and small food icons such as bread, soup and pie. Your colour theme is kept and comes back when you switch to Normal.",
  },
  {
    title: "TS Runner Pages: Run Evidence Can Be Closed",
    description: "On the 12107, 12153, 12257, 12412 and JomCheck pages, the per-TS run evidence now sits under one \"Run evidence\" bar with the TS count and passed / failed totals. The bar and each TS card inside start open; click the bar or a card header to close it and save screen space.",
  },
  {
    title: "Dashboard Upcoming Deployments Follow the Calendar",
    description: "The Upcoming Deployments widget now shows the same deployments as the Calendar for the next 30 days: Jira release tickets with their Morning / Night session, plus manual deployments, using the Calendar's layer switches. A small \"My tickets\" / \"All tickets\" tag beside the title shows which filter is in use; it can only be changed on the Calendar page.",
  },
  {
    title: "Calendar: Leave as Yellow Days",
    description: "Leave events now choose Full day or Half day, and AM or PM for half day. Picking a start date sets the end date to match (you can still change it; half day is one day). Repeat, reminder and Jira ticket are hidden for leave, and the title is optional (defaults to \"Leave\" / \"Half-day leave (PM)\"). On the calendar a leave day is coloured yellow instead of showing a pill — top half for AM, bottom half for PM — with a small \"Leave\" label you click to edit.",
  },
  {
    title: "Automation Blocked on staging/uat3 and staging/sit4",
    description: "Both environments are reserved for Wholesale CRs (Teams notice, 26 Oct). Any automation or checker run that targets uat3 or sit4 — by URL, \"staging/uat3\" or the bare name — is now stopped before it starts, with a message saying why. This covers every run page, including ones added later. To release an environment, remove it from lib/reservedEnvironments.ts.",
  },
  {
    title: "All Tickets / My Tickets Filter (Global)",
    description: "A new All tickets / My tickets switch on the Calendar toolbar. My tickets keeps only Jira tickets where you are in the QA field (QA PIC); the ticket panel now shows the QA PIC. The setting is shared across the dashboard, so any future page that shows Jira tickets will follow it too. Manual deployments, events, Kanban and to-dos are not affected.",
  },
  {
    title: "Calendar: Jira Deployments Per Ticket",
    description: "The Calendar now reads the EAINT release calendar from Jira and shows each ticket being deployed on its release date, marked 🌞 Morning, 🌙 Night or 🌞🌙 both, from the 🌞/🌚 in the release name. Holding versions such as \"Old Pending Listing\" are left out. It syncs when you open the page (if older than 30 minutes) or with the refresh button under Layers. Click a ticket for its release, session, Jira status and an Open in Jira link. Old hand-entered deployments are now the \"Manual deployments\" layer and can be hidden.",
  },
  {
    title: "12153 / 12257 FPX B2B: Order Authorized Page",
    description: "After Authorize, the Fiuu simulator now shows an Order Authorized page with the tranID and a one-time decide code. The automation reads both into the log, clicks Continue now so eAuto gets the result without the 2-minute wait, and types the decide code on the checker page if its box is empty.",
  },
  {
    title: "eAuto Flows and Modules",
    description: "New page under eAuto Flows in the sidebar. Pick a module, then a flow, then a trigger point (e.g. Insurance → Purchase → 69E redirect) to see the steps as a flowchart, plus what the flow affects, QA scope to check, cronjobs, who can access it, where the transaction goes, business rules, tickets and open questions. Every fact shows its source (Azfar repo, my knowledge, Jira, Miro, TS workbook, Ask eAuto); conflicts keep the other version in an amber box. Search finds modules, steps, terms and ticket keys.",
  },
  {
    title: "12153 / 12257 TS Numbers Now Two Digits",
    description: "The 12153 and 12257 TS are now numbered TS01, TS02 … (was TS1, TS2 …), in the test titles, dashboard rows, evidence files and zip names, so SharePoint sorts them in order. Older runs keep their old names; the TS Tracker treats TS1 and TS01 as the same TS.",
  },
  {
    title: "12153 / 12257 Evidence Zip: Supporting Documents Folder",
    description: "Downloaded evidence zips for 12153 and 12257 now hold the TS recording at the top and every other file (screenshots, PDFs, saved pages) inside a \"Supporting Documents\" folder. Applies to Download all, selected files and the TS Tracker download.",
  },
  {
    title: "TS Tracker Ticket Order and Deployment Reminder",
    description: "The TS Tracker can order tickets by ticket number, date added, or deployment session (the ticket's Jira fix version: date, then morning before night), and each order can be reversed. When a ticket deploys within 7 days, an amber \"Deploys <date> · Morning/Night (in N days)\" notice shows beside every TS number on its automation page and on its TS Tracker card.",
  },
  {
    title: "12153 / 12257: Passed TS Unticked, Wrong-OTP Card Failure, Faster BO Search",
    description: "A TS that passes is unticked automatically. A failed card payment is now made with the Mastercard 5200… and a wrong OTP on 3D Secure. BackOffice listings search straight away instead of waiting 30 seconds. Business Trading runs swap to a spare TIN when eAuto refuses one, and the Application always gets the TIN it requires.",
  },
  {
    title: "12153 / 12257 Business Trading: Made-Up Licence and Optional TIN",
    description: "Business Trading (Sabah / Sarawak) rows now get a made-up licence number when ticked (SBH/TL/9… or SWK/TL/9…), with a shuffle button for a new one, so nothing has to be typed. A new \"Include TIN\" switch types a TIN on both the Pre-Application and the Application, taken from an Excel row that is already partly used, so free companies stay untouched; off leaves the TIN empty on both.",
  },
  {
    title: "Deployment Notice Moved to the Page Title",
    description: "On the 7 ticket automation pages (12107, 12153, 12257, 12412, JomCheck, 12166, Quotation Reminder), the amber \"Deploys …\" notice now shows once beside the page title instead of beside every TS number. Pages covering two tickets (12107 + 12327, 12166 + 12167) show one notice per ticket, labelled with its number. The TS Tracker cards are unchanged.",
  },
  {
    title: "TS Rows Coloured from the TS Tracker",
    description: "On every ticket automation page (12107, 12153, 12257, 12412, JomCheck, 12166 E2E, Quotation Reminder), a TS row is light green when the TS Tracker has it as passed by an automation run, a darker green when you passed it by hand in the tracker, and light red when it failed. Rows stay selectable, so you can still run them. Hover a row to see why it is coloured.",
  },
  {
    title: "FPX (B2B) Maker and Checker Steps Built",
    description: "12153 TS1–TS4 and 12257 TS10 now do the whole B2B payment: copy the Order ID on the Fiuu page, Authorize, check the Pending Approval page, approve the order on the Fiuu checker page (/fpx-b2b/pending), then refresh eAuto. A failed B2B payment is Reject on the Fiuu page. The Fiuu pages are saved to evidence on every run.",
  },
  {
    title: "Onboarding Runs Use Your Installed Chrome",
    description: "12153, 12257 and Create Pre-Application now open the installed Google Chrome on a saved profile. Click \"Open eAuto browser to sign in\" under reCAPTCHA wait, sign in to Google once in that window, then close it. A browser signed in to Google usually gets the reCAPTCHA as a single tick instead of image rounds every run.",
  },
  {
    title: "TS Tracker Tallies with the Tickets Page",
    description: "Opening TS Tracker or Tickets adds any CR and TS that a ticket page has and the tracker lacks, grouped by the page's sections. A TS still Not started takes its status and evidence from the page's last saved run. Your own TS, statuses and workbook objectives are never overwritten, and a CR or TS you delete stays deleted. Each Tickets card shows the TS Tracker pass / fail / WIP / not-started counts.",
  },
  {
    title: "Shuffle Companies and Server-Side Used List",
    description: "On /eauto/12153 and /eauto/12257, each TS row has a shuffle button beside the company dropdown that picks another free company of the same type at random. Which companies are used is now kept on the dashboard server, so every browser sees the same list. Under the company Excel, \"Used companies\" lists each spent company with its TS and date, with \"Free again\" for one eAuto never received.",
  },
  {
    title: "12153 Guided Capture for FPX (B2B)",
    description: "New row 12153_GUIDE_B2B on /eauto/12153 (section E). With Headless off, the run fills the Pre-Application up to the payment step, then you do the B2B payment yourself (Authorize, then Approve on the Fiuu checker page). The run saves every page you reach, as HTML and a screenshot, to _reference/tickets/EAINT-12153/guided-capture/.",
  },
  {
    title: "Onboarding Runs Reuse One Saved Browser",
    description: "12153, 12257 and Create Pre-Application now open the eAuto pages in the same saved browser every run instead of a fresh one, so the reCAPTCHA should only need ticking when eAuto asks again. BO, eSIM and the \"new browser\" checks still use fresh browsers. Delete data/browser-profile to start over.",
  },
  {
    title: "New Director MyKad for Every Onboarding Run",
    description: "12153, 12257 and Create Pre-Application no longer use one fixed director MyKad. Each run makes a new one: 20 followed by 10 random digits, which no real MyKad uses. eAuto stops warning that the company and director already exist. The MyKad is shown in the run log.",
  },
  {
    title: "FPX (B2B) TS Unblocked on 12153 and 12257",
    description: "B2B is on staging, so 12153 TS1–TS2 and 12257 TS10 run the full chain. The first run lists every Online Banking (Business) bank tile in the log and saves that page to evidence. 12153 TS3–TS4 still stop at the authoriser approval, which is not built yet.",
  },
  {
    title: "Running Now in the Sidebar, Back and Forward Buttons",
    description: "The sidebar lists every automation that is running, with how long it has run. Click one to open the page that runs it. Back and Forward arrows sit beside Search (and in the phone top bar); they follow the browser history, the same as Alt+Left and Alt+Right.",
  },
  {
    title: "eSIM: Never Edit Another Tester's SSM Rows",
    description: "The onboarding runs (12153, 12257, Create Pre-Application) now reuse an existing eSIM SSM row only if one of our runs made it (remark starting UDIN QA). If the company already has someone else's rows, they are left untouched and the run moves to the next free company of the same type from the company Excel; both companies are marked used.",
  },
  {
    title: "One Recording per Onboarding TS",
    description: "On /eauto/12153 and /eauto/12257, each TS now gets one video (.mp4) that follows the run across every window it works in: the eAuto page, the Fiuu payment or DuitNow QR window, the DuitNow scanner tab, BackOffice and eSIM. If the video cannot be joined, the separate recordings are kept as before. The DuitNow scanner tab is reused between scans (Go to Home), since it stays open after Approve or Reject.",
  },
  {
    title: "Company Excel for Onboarding Pages",
    description: "Drop your company Excel (the Company Details Checker export: Company ROC, New Company ROC, TIN Number, Overall) on /eauto/12153, /eauto/12257 or Create Pre-Application, and every onboarding page uses the same list. Each ticked TS is filled with the next free company of its business type (the type comes from the New ROC: 01 Sdn Bhd, 03 Sole Prop / Partnership), and a dropdown on the row swaps it. A company is marked used once a run is queued, so the same BRN is never handed out twice. Business Trading licences are still typed.",
  },
  {
    title: "Floating Windows on Every Page",
    description: "A small dock at the bottom right opens Notes, To-do, a Focus timer and a Scratchpad as windows you can drag, resize, minimise and keep open while you work on a TS or automation page. Shortcuts: Alt+N notes, Alt+T to-do, Alt+P timer, Alt+S scratchpad.",
  },
  {
    title: "TS Tracker Rebuilt: Excel Import, Logs, Evidence History",
    description: "Import a TS workbook and every TS is created with its objective, per section. Each TS has a log of every change (created, Pass to WIP, retested) and a note box. Automation runs update the matching TS and keep every run's evidence, so a failed run stays downloadable after a later pass.",
  },
  {
    title: "Notes, To-do and Calendar Redesigned",
    description: "Notes: masonry cards, pins, colours, tags, Jira chips, QA templates, archive with undo, focus mode, Markdown export. To-do: smart groups, priorities, tags, quick-add shortcuts, board and focus views, focus timer, XP, levels and streaks. Calendar: month, week, day and agenda views, drag to create and move, categories, repeats, reminders, layers, Malaysian holidays, working-day counter, ICS export.",
  },
  {
    title: "eAuto Tool Results Stay Put",
    description: "Create eSTM, Create BDP, Create Pre-Application, eSIM, the checkers and Insurance availability no longer record video or keep evidence — only the result, now also saved on the server. Close the laptop mid-run or reopen the browser the next day and the last result is still there, ready to use. Shopping Cart, Insurance Purchase E2E and Secarang Regression still record. Sidebar: Mentions and Ticket Studies links removed (pages still open by URL).",
  },
  {
    title: "Create Pre-Application",
    description: "New eAuto page (/eauto/preapp) that makes one UCD onboarding Pre-Application, always Sdn Bhd, with the payment set to Success or Failed and the FPX (B2C) bank of your choice (Maybank by default), so there is a fresh transaction to check on the listing. Type or pick the company from the Company Details Checker; you tick the reCAPTCHA. It stops after the payment.",
  },
  {
    title: "Stop Works on Every Runner; One Run at a Time",
    description: "Stop now works on 12166 E2E and was added to User Access Regression, Shopping Cart and Create BDP. Starting a second run on a page while one is going is refused with a clear message instead of the two runs overwriting each other. 12166 E2E and User Access Regression gained a Past runs section.",
  },
  {
    title: "Ticket Hub, TS Tracker Auto-Update, Daily Update History",
    description: "/jira/<KEY> now shows everything the dashboard holds for that ticket: study, automation pages, TS Tracker progress, deployments and Kanban card. Automation runs update the matching TS Tracker cases (marked Auto; can be turned off per CR). Daily Update keeps its draft, saves a history of posts, and can insert today's completed and raised tickets.",
  },
  {
    title: "Light Themes, Font, Delete Confirmations, Error States",
    description: "Coloured pills, chips and cards now read correctly in light themes, and muted text meets contrast on every theme. Body text uses Geist. Notes, to-dos and TS Tracker CRs ask before deleting. Home page Jira widgets show the error and a Retry button instead of an empty list.",
  },
  {
    title: "eAuto Page Replaces the eAuto Dropdown",
    description: "Sidebar → eAuto now opens /eauto, a catalogue of the eAuto module pages (Insurance, Shopping Cart, Create eSTM, Checker, Company Details Checker, Secarang Plate Check, eSIM, Create BDP). Same Cards / List and Detailed / Simple toggles as the Tickets page, sorted by name or date created. The Tickets page's ticket-number sort now works (it was falling back to name order).",
  },
  {
    title: "Download Evidence: All, Passed Only, Failed Only, Selected",
    description: "Wherever a run has evidence for two or more TS, accounts or past runs, a Download bar offers All, Passed only, Failed only and Selected. Tick the box on a TS card or past-run row to add it to Selected. Covers the 12107, 12153, 12257, 12412 and JomCheck pages (results and Past runs), 12166 E2E and User Access Regression, and the eDereg Bulk Run. Past runs from before today have no saved pass/fail, so they appear only under All and Selected.",
  },
  {
    title: "Loading Cover Between Pages",
    description: "Clicking a link to another page now covers the whole dashboard with a \"Loading…\" sign until the new page is in place, so nothing else can be clicked meanwhile. The same cover shows while the dashboard first starts, instead of a blank screen. While it shows, the mouse cursor becomes a small pixel-art orange cat that twirls.",
  },
  {
    title: "Tickets Page Replaces the Tickets Dropdown",
    description: "Sidebar → Tickets now opens /tickets, a catalogue of every per-ticket automation page. Switch between Cards and List, and between Detailed and Simple; both choices are remembered. Each entry shows the ticket number, automation status, Jira summary, scripts path and TS coverage.",
  },
  {
    title: "12107 + 12327 Runner Page",
    description: "New ticket page for the combined Secarang ShopeePay/GrabPay and CIBO Payment Mode format test script. Runs the Secarang leg of 12107_TS01/TS02 (GrabPay Full Amount, Success / Failed) and TS07/TS08 (card / FPX regression) as a queue, one TS per run, with detailed mode, per-TS evidence, receipt PDF and past runs. The CIBO rows run too: 12107_TS06 (Payment Channel filter) and 12327_TS01-TS08 (Payment Mode on Transaction Listing, Payment Report and both exports), with a CIBO block for the login and the transaction refs per payment method. Only the dev-patch rows 12107_TS03-TS05 stay manual.",
  },
  {
    title: "12153 and 12257 Onboarding Payment Runner Pages",
    description: "New ticket page for EAINT-12153 (official TS v38, 12153_TS1-TS8). Each TS runs the whole UCD onboarding chain: eSIM SSM seeding, Pre-Application, Fiuu payment, BackOffice approvals, Application steps 1-4, registration-fee payment and the listing checks. The company for each TS is typed on its row or picked from the Company Details Checker results. A person ticks the reCAPTCHA, so Headless starts off. The FPX (B2B) TS stop at the payment method until the B2B tile reaches staging. A separate /eauto/12257 page runs EAINT-12257 (DuitNow QR, TS v19) on the same chain: the run scans the QR on Fiuu's simulator page itself, and drives the Cancel, close-window and timer-expiry cases. Both pages also carry the suggested payment-retry TS (12153_TS9–TS12, 12257_TS11–TS13): BO Payment Details after a redo, closing the browser and reopening the link, the link opened in a second session, and the BO listing payment status (failed Pre-Application not listed; Registration Fee Failed then OK, with its filter).",
  },
  {
    title: "QA Knowledge Base Page",
    description: "Settings → QA Knowledge Base opens a reader/editor for the knowledge/ markdown files: eAuto portals and environments, Service Hub business rules, payment gateways, the automation playbook, and known quirks. Provenance tags render as colour-coded badges (green verified, teal verified-live, blue from-ticket, red unconfirmed), and saving writes straight to the file on disk.",
  },
  {
    title: "JIRA Ticket Studies",
    description: "A new reading page under JIRA that collects every ticket we've studied in depth — Jira metadata, SRD requirements, what the SRD leaves undefined, decisions already settled with the requestor, what's still open, the resulting test script, and the automation feasibility verdict. Each ticket also has its own free-text notes box. First entry: EAINT-12153 (UCD onboarding payment channels).",
  },
  {
    title: "Note Checklists",
    description: "The note editor now supports task lists. Click the checklist icon (☑) in the toolbar to insert one, then tick items directly in the editor. Nested checklists are supported.",
  },
  {
    title: "Floatable Notes (Picture-in-Picture)",
    description: "Click the PiP icon in a note's toolbar to pop it into a floating window that stays above all other tabs and apps. Type and check boxes from the float. Chrome 116+ only.",
  },
];

export const CURRENT_VERSION       = "v0.020";
export const CURRENT_VERSION_LABEL = "v0.020";
export const CURRENT_VERSION_DATE  = "2026-05-28";
