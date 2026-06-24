"use client";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
  FlaskConical, Play, Square, Settings2, ChevronDown, Download,
  Loader2, Eye, EyeOff, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, ChevronLeft, Terminal, Copy, Check, Info,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SuiteTest {
  name: string;
  defaultEnabled: boolean;
  metaRisk?: boolean;
}

interface SuiteVar {
  key: string;
  label: string;
  defaultValue: string;
  description?: string;
  type?: "password";
  counter?: boolean;
  hint?: string;
  forTest?: string;
  options?: string[];
}

interface SuiteDef {
  id: string;
  file: string;
  title: string;
  description: string;
  emoji: string;
  group: string;
  tags: string[];
  estimatedDuration: string;
  metaRisk: boolean;
  tests: SuiteTest[];
  vars: SuiteVar[];
}

// ── Suite definitions ─────────────────────────────────────────────────────────

const SUITES: SuiteDef[] = [
  {
    id: "beta-auth", file: "beta-auth.spec.ts",
    title: "Auth & Access Control", emoji: "🔐", group: "Foundation",
    description: "Login, session persistence, logout, credential validation, keyboard shortcuts, and role-based page restrictions.",
    tags: ["auth", "roles"], estimatedDuration: "~3 min", metaRisk: false,
    tests: [
      { name: "remember-me checkbox is checked by default", defaultEnabled: true },
      { name: "unauthenticated visit to / redirects to /login", defaultEnabled: true },
      { name: "wrong credentials show inline error", defaultEnabled: true },
      { name: "admin login lands on dashboard with greeting", defaultEnabled: true },
      { name: "session persists after page reload", defaultEnabled: true },
      { name: "after logout, reload stays on /login", defaultEnabled: true },
      { name: "admin can open Settings and see the users table", defaultEnabled: true },
      { name: "keyboard shortcut g→i navigates to Inbox", defaultEnabled: true },
      { name: "help overlay opens on help-button and closes on Escape", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_WRONG_PASSWORD", label: "Wrong Password", defaultValue: "wrong-password", type: "password", forTest: "wrong credentials show inline error" },
    ],
  },
  {
    id: "beta-dashboard", file: "beta-dashboard.spec.ts",
    title: "Dashboard & KPIs", emoji: "📊", group: "Foundation",
    description: "Dashboard title, no-demo-badge check, reply-handling donut, Reports page delivery funnel, and range chips.",
    tags: ["dashboard", "analytics"], estimatedDuration: "~2 min", metaRisk: false,
    tests: [
      { name: "dashboard title visible and no demo badge shown", defaultEnabled: true },
      { name: "reply-handling donut chart text \"auto-handled\" is visible", defaultEnabled: true },
      { name: "dashboard loads without errors on page reload", defaultEnabled: true },
      { name: "reports page renders delivery funnel and range chips", defaultEnabled: true },
      { name: "7-day range chip is clickable and updates the chart", defaultEnabled: true },
      { name: "reports page shows no \"demo data\" notice", defaultEnabled: true },
    ],
    vars: [],
  },
  {
    id: "beta-campaigns", file: "beta-campaigns.spec.ts",
    title: "Campaigns / Blasts", emoji: "📣", group: "Campaigns",
    description: "Wizard audience/template/review steps, send-now blast detail counters, recipient table, scheduled blast lifecycle (schedule → cancel), past-date validation.",
    tags: ["campaigns", "blasts", "wizard"], estimatedDuration: "~7 min", metaRisk: false,
    tests: [
      { name: "list shows heading, new-campaign button, and status filter", defaultEnabled: true },
      { name: "clicking the Sending status chip filters without crashing", defaultEnabled: true },
      { name: "clicking a blast row navigates to its detail page", defaultEnabled: true },
      { name: "wizard shows recipient count on audience step", defaultEnabled: true },
      { name: "selecting a state chip updates the recipient count", defaultEnabled: true },
      { name: "specialization chips are clickable and do not crash", defaultEnabled: true },
      { name: "create blast → detail page shows all four counters", defaultEnabled: true },
      { name: "recipients table is visible with status filter", defaultEnabled: true },
      { name: "filtering to Failed surfaces Retry buttons and Retry All", defaultEnabled: true },
      { name: "blast name is required — empty name keeps Create button disabled", defaultEnabled: true },
      { name: "schedule blast → detail shows Cancel button in SCHEDULED state", defaultEnabled: true },
      { name: "cancel a SCHEDULED blast — Cancel button disappears", defaultEnabled: true },
      { name: "past scheduled date shows validation error", defaultEnabled: true },
      { name: "newly scheduled blast appears in the campaigns list", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_SEED_TEMPLATE",     label: "Seed Template Slug",  defaultValue: "sample_promo_2026", hint: "Must exist in your app", forTest: "wizard shows recipient count on audience step" },
      { key: "E2E_AUDIENCE_STATE",    label: "Audience State Chip", defaultValue: "Selangor",          options: ["Selangor","Kuala Lumpur","Penang","Johor","Kelantan","Sabah","Sarawak","Perak","Terengganu","Pahang","Negeri Sembilan","Kedah","Perlis","Melaka"], forTest: "selecting a state chip updates the recipient count" },
      { key: "E2E_BLAST_NAME_PREFIX", label: "Blast Name Prefix",   defaultValue: "BETA",              counter: true, forTest: "create blast → detail page shows all four counters" },
    ],
  },
  {
    id: "beta-inbox", file: "beta-inbox.spec.ts",
    title: "Inbox", emoji: "💬", group: "Inbox",
    description: "Dual-mode toggle, ticket queue (escalation via simulator, resolve with SaveToKnowledgeModal), agent-assist panel, sidebar badge, canned replies CRUD.",
    tags: ["inbox", "tickets", "canned-replies"], estimatedDuration: "~8 min", metaRisk: false,
    tests: [
      { name: "inbox shows Auto-replied and Needs Human mode buttons", defaultEnabled: true },
      { name: "switching to Auto-replied mode shows AI conversations or empty state", defaultEnabled: true },
      { name: "Needs Human mode shows Active and Closed tab buttons", defaultEnabled: true },
      { name: "escalation creates a ticket — Resolve and Close buttons appear", defaultEnabled: true },
      { name: "resolve → SKIP disposition → modal closes → toast shown", defaultEnabled: true },
      { name: "resolved ticket moves to the Closed tab", defaultEnabled: true },
      { name: "active ticket shows suggest-draft and agent-context-card", defaultEnabled: true },
      { name: "saved-replies dropdown visible when canned replies exist", defaultEnabled: true },
      { name: "sidebar inbox badge is visible when active tickets exist", defaultEnabled: true },
      { name: "create → edit → delete via Settings", defaultEnabled: true },
      { name: "Add button disabled until both title and body are filled", defaultEnabled: true },
    ],
    vars: [
      { key: "API_BASE",               label: "API Base URL",        defaultValue: "http://localhost:3000", hint: "Backend URL for simulator & auth calls", forTest: "escalation creates a ticket — Resolve and Close buttons appear" },
      { key: "E2E_INBOX_PHONE_PREFIX", label: "Phone Prefix",        defaultValue: "+6011110040",  hint: "Suffixes 1–6 appended. Change prefix between runs — phones can only be used once.", forTest: "escalation creates a ticket — Resolve and Close buttons appear" },
      { key: "E2E_CANNED_REPLY_TITLE", label: "Canned Reply Title",  defaultValue: "BETA Saved Reply",     forTest: "saved-replies dropdown visible when canned replies exist" },
      { key: "E2E_CANNED_REPLY_BODY",  label: "Canned Reply Body",   defaultValue: "This is a BETA canned reply.", forTest: "saved-replies dropdown visible when canned replies exist" },
    ],
  },
  {
    id: "beta-contacts", file: "beta-contacts.spec.ts",
    title: "Dealers / Contacts", emoji: "👥", group: "Data",
    description: "CSV bulk import (valid + invalid rows), dealer table search & specialization chip, add dealer with duplicate-phone guard, full manual contact lifecycle.",
    tags: ["contacts", "dealers", "csv"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "Import button disabled until file selected", defaultEnabled: true },
      { name: "valid CSV imports successfully — shows Imported count", defaultEnabled: true },
      { name: "CSV with invalid rows surfaces the error list", defaultEnabled: true },
      { name: "Cancel on import page returns to contacts list", defaultEnabled: true },
      { name: "dealers table renders with rows", defaultEnabled: true },
      { name: "search filters the dealer list", defaultEnabled: true },
      { name: "EV/Hybrid specialization chip filters without crashing", defaultEnabled: true },
      { name: "admin adds dealer via modal — appears in table", defaultEnabled: true },
      { name: "duplicate phone number shows error in add-dealer modal", defaultEnabled: true },
      { name: "create contact → verify in list", defaultEnabled: true },
      { name: "edit contact name then delete", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_CONTACTS_SEARCH_TERM",  label: "Search Term",           defaultValue: "Auto Bestari",  hint: "Must match a dealer already in your database", forTest: "search filters the dealer list" },
      { key: "E2E_DEALER_NAME_PREFIX",    label: "Dealer Name Prefix",    defaultValue: "BETA Dealer",   counter: true, forTest: "admin adds dealer via modal — appears in table" },
      { key: "E2E_DEALER_PHONE_PREFIX",   label: "Dealer Phone Prefix",   defaultValue: "+6013",         hint: "7-digit suffix appended — must be unique", forTest: "admin adds dealer via modal — appears in table" },
      { key: "E2E_DEALER_TIER",           label: "Dealer Tier",           defaultValue: "GOLD",          options: ["GOLD","SILVER","BRONZE"], forTest: "admin adds dealer via modal — appears in table" },
      { key: "E2E_DEALER_SPEC",           label: "Dealer Specialization", defaultValue: "EV_HYBRID",     options: ["EV_HYBRID","SEDAN","SUV","MPV","HATCHBACK","PICKUP"], forTest: "admin adds dealer via modal — appears in table" },
      { key: "E2E_CONTACT_NAME_PREFIX",   label: "Contact Name Prefix",   defaultValue: "Automation Test", counter: true, forTest: "create contact → verify in list" },
      { key: "E2E_CONTACT_STATE",         label: "Contact State",         defaultValue: "SELANGOR",      options: ["SELANGOR","KL","PENANG","JOHOR","KELANTAN","SABAH","SARAWAK","PERAK","TERENGGANU","PAHANG","NEGERI_SEMBILAN","KEDAH","PERLIS","MELAKA"], forTest: "create contact → verify in list" },
    ],
  },
  {
    id: "beta-segments", file: "beta-segments.spec.ts",
    title: "Segments", emoji: "🎯", group: "Data",
    description: "Segment builder page, tier filter chips, create segment from dealer selection, verify segment persists on the Segments page.",
    tags: ["segments", "filters"], estimatedDuration: "~3 min", metaRisk: false,
    tests: [
      { name: "segment builder page loads and shows tier filter chips", defaultEnabled: true },
      { name: "Gold, Silver, and Bronze tier chips are all visible", defaultEnabled: true },
      { name: "select all dealers → save as segment → success toast", defaultEnabled: true },
      { name: "saved segment appears on the Segments page", defaultEnabled: true },
      { name: "segment row shows the segment name and dealer count", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_SEGMENT_NAME_PREFIX", label: "Segment Name Prefix", defaultValue: "BETA Seg", counter: true, forTest: "select all dealers → save as segment → success toast" },
    ],
  },
  {
    id: "beta-templates", file: "beta-templates.spec.ts",
    title: "Templates", emoji: "📄", group: "Campaigns",
    description: "Template list, status filter chips, create multi-language DRAFT, AI wizard (mock generate → edit → save as draft), and discard-warning gate.",
    tags: ["templates", "wizard"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "template list loads with rows visible", defaultEnabled: true },
      { name: "PENDING status filter chip marks itself as active", defaultEnabled: true },
      { name: "APPROVED status filter chip marks itself as active", defaultEnabled: true },
      { name: "create multi-language draft — appears in list with DRAFT status", defaultEnabled: true },
      { name: "edit content, save as draft, draft appears in list with edits", defaultEnabled: true },
      { name: "closing wizard at review step warns before discarding", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_TEMPLATE_NAME_PREFIX",  label: "Template Name Prefix",    defaultValue: "beta_tpl",  counter: true,    hint: "e.g. beta_tpl_12345678",              forTest: "create multi-language draft — appears in list with DRAFT status" },
      { key: "E2E_TEMPLATE_CATEGORY",     label: "Template Category",      defaultValue: "MARKETING",                    options: ["MARKETING","UTILITY","AUTHENTICATION"], forTest: "create multi-language draft — appears in list with DRAFT status" },
      { key: "E2E_TEMPLATE_LANG_VARIANT", label: "Second Language",        defaultValue: "MS",                           options: ["EN","MS","ZH","TA"], forTest: "create multi-language draft — appears in list with DRAFT status" },
      { key: "E2E_TEMPLATE_BODY_EN",      label: "Body (EN)",              defaultValue: "Hello {{1}}!",                                                               forTest: "create multi-language draft — appears in list with DRAFT status" },
      { key: "E2E_TEMPLATE_BODY_MS",      label: "Body (2nd language)",    defaultValue: "Salam {{1}}!",                                                               forTest: "create multi-language draft — appears in list with DRAFT status" },
      { key: "E2E_WIZARD_BRIEF",          label: "AI Wizard Brief",        defaultValue: "Service reminder for BETA testing",                                          forTest: "edit content, save as draft, draft appears in list with edits" },
    ],
  },
  {
    id: "beta-settings", file: "beta-settings.spec.ts",
    title: "Settings & Team", emoji: "⚙️", group: "Foundation",
    description: "Invite team member, duplicate email guard, reset and delete member, state-to-language mapping configuration (Penang ZH+EN, Kelantan MS) with persistence.",
    tags: ["settings", "team", "languages"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "invite member → appears in users table", defaultEnabled: true },
      { name: "duplicate email shows inline error and keeps modal open", defaultEnabled: true },
      { name: "admin resets a team member password", defaultEnabled: true },
      { name: "admin deletes a team member — removed from table", defaultEnabled: true },
      { name: "state-language table is visible on the Languages tab", defaultEnabled: true },
      { name: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload", defaultEnabled: true },
    ],
    vars: [
      { key: "API_BASE",                label: "API Base URL",        defaultValue: "http://localhost:3000",   forTest: "invite member → appears in users table" },
      { key: "E2E_INVITE_EMAIL_PREFIX", label: "Email Prefix",        defaultValue: "beta.invite",   hint: "→ beta.invite.{suffix}@example.com", forTest: "invite member → appears in users table" },
      { key: "E2E_INVITE_NAME_PREFIX",  label: "Name Prefix",         defaultValue: "BETA User",     counter: true,                              forTest: "invite member → appears in users table" },
      { key: "E2E_INVITE_PASSWORD",     label: "Initial Password",    defaultValue: "Password123!",  type: "password",                           forTest: "invite member → appears in users table" },
      { key: "E2E_RESET_PASSWORD",      label: "Reset-to Password",   defaultValue: "BetaNew456!",   type: "password",                           forTest: "admin resets a team member password" },
      { key: "E2E_MAPPING_STATE_1",     label: "State 1",             defaultValue: "PENANG",        options: ["SELANGOR","KL","PENANG","JOHOR","KELANTAN","SABAH","SARAWAK","PERAK","TERENGGANU","PAHANG","NEGERI_SEMBILAN","KEDAH","PERLIS","MELAKA"], forTest: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload" },
      { key: "E2E_MAPPING_LANG_1_1",    label: "State 1 — Language A", defaultValue: "ZH",           options: ["EN","MS","ZH","TA"],              forTest: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload" },
      { key: "E2E_MAPPING_LANG_1_2",    label: "State 1 — Language B", defaultValue: "EN",           options: ["EN","MS","ZH","TA"],              forTest: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload" },
      { key: "E2E_MAPPING_STATE_2",     label: "State 2",             defaultValue: "KELANTAN",      options: ["SELANGOR","KL","PENANG","JOHOR","KELANTAN","SABAH","SARAWAK","PERAK","TERENGGANU","PAHANG","NEGERI_SEMBILAN","KEDAH","PERLIS","MELAKA"], forTest: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload" },
      { key: "E2E_MAPPING_LANG_2",      label: "State 2 — Language",  defaultValue: "MS",            options: ["EN","MS","ZH","TA"],              forTest: "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload" },
    ],
  },
  {
    id: "beta-analytics", file: "beta-analytics.spec.ts",
    title: "Analytics / Reports", emoji: "📈", group: "Foundation",
    description: "Delivery funnel, all three date-range chips (7d / 30d / 90d), no-demo notice, and dashboard KPI auto-handled text.",
    tags: ["analytics", "reports"], estimatedDuration: "~2 min", metaRisk: false,
    tests: [
      { name: "reports page renders delivery funnel heading", defaultEnabled: true },
      { name: "delivery rate metric is shown", defaultEnabled: true },
      { name: "7-day range chip switches the view without error", defaultEnabled: true },
      { name: "30-day range chip switches the view without error", defaultEnabled: true },
      { name: "90-day range chip switches the view without error", defaultEnabled: true },
      { name: "no demo-data notice is displayed", defaultEnabled: true },
      { name: "KPI strip is visible on the dashboard", defaultEnabled: true },
    ],
    vars: [],
  },
  {
    id: "beta-knowledge-base", file: "beta-knowledge-base.spec.ts",
    title: "Knowledge Base", emoji: "🧠", group: "Inbox",
    description: "SaveToKnowledgeModal disposition options (SKIP / IMPORT_LIVE / SAVE_DRAFT), confirm-button disabled guard. Uses admin simulator to seed escalations.",
    tags: ["knowledge-base", "inbox"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options", defaultEnabled: true },
      { name: "SKIP disposition closes modal and shows resolved toast", defaultEnabled: true },
      { name: "SAVE_DRAFT disposition closes modal and shows resolved toast", defaultEnabled: true },
      { name: "IMPORT_LIVE disposition closes modal and shows resolved toast", defaultEnabled: true },
      { name: "kb-confirm button is disabled until a disposition is selected", defaultEnabled: true },
    ],
    vars: [
      { key: "API_BASE",            label: "API Base URL",    defaultValue: "http://localhost:3000",   forTest: "SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options" },
      { key: "E2E_KB_PHONE_PREFIX", label: "Phone Prefix",   defaultValue: "+6011120040", hint: "Suffixes 1–5 appended. Change prefix between runs.", forTest: "SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options" },
    ],
  },
  {
    id: "beta-cross-cutting", file: "beta-cross-cutting.spec.ts",
    title: "Cross-Cutting", emoji: "🔗", group: "Foundation",
    description: "Navigation smoke (all primary routes load without blank screen), sidebar link targets, and data isolation (wizard does not carry state between runs).",
    tags: ["smoke", "navigation", "isolation"], estimatedDuration: "~2 min", metaRisk: false,
    tests: [
      { name: "all primary nav links load without a blank screen", defaultEnabled: true },
      { name: "sidebar Dealers link navigates to /contacts", defaultEnabled: true },
      { name: "sidebar Templates link navigates to /templates", defaultEnabled: true },
      { name: "two consecutive blast wizard openings show independent blast-name inputs", defaultEnabled: true },
    ],
    vars: [
      { key: "E2E_SEED_TEMPLATE", label: "Seed Template", defaultValue: "sample_promo_2026" },
    ],
  },
];

// ── Test documentation ────────────────────────────────────────────────────────

const SUITE_DOCS: Record<string, Record<string, string>> = {
  "beta-auth": {
    "remember-me checkbox is checked by default": "Verifies the Remember Me checkbox is pre-checked on the login page so users aren't logged out between sessions.",
    "unauthenticated visit to / redirects to /login": "Confirms that accessing the dashboard root without a session immediately redirects to the login page.",
    "wrong credentials show inline error": "Checks that submitting incorrect credentials displays an inline error message rather than a silent failure.",
    "admin login lands on dashboard with greeting": "Logs in as admin and confirms the post-login landing page shows the expected dashboard greeting.",
    "session persists after page reload": "Reloads the page while authenticated and confirms the session stays active without prompting for login again.",
    "after logout, reload stays on /login": "Logs out and reloads to confirm the session is fully cleared and the user remains on the login page.",
    "admin can open Settings and see the users table": "Navigates to Settings as admin and verifies the users table is rendered and accessible.",
    "keyboard shortcut g→i navigates to Inbox": "Triggers the g-then-i keyboard shortcut and confirms the browser navigates to the Inbox page.",
    "help overlay opens on help-button and closes on Escape": "Clicks the help button to open the overlay, then presses Escape to confirm it dismisses correctly.",
  },
  "beta-dashboard": {
    "dashboard title visible and no demo badge shown": "Checks the main dashboard heading is visible and that no 'demo data' badge appears, confirming live data mode.",
    "reply-handling donut chart text \"auto-handled\" is visible": "Confirms the reply-handling donut chart on the dashboard shows its 'Auto-handled today' label.",
    "dashboard loads without errors on page reload": "Reloads the dashboard page and confirms no error banners or blank screens appear.",
    "reports page renders delivery funnel and range chips": "Navigates to the Reports page and checks both the delivery funnel section and the date range chips are rendered.",
    "7-day range chip is clickable and updates the chart": "Clicks the 7-day chip on the Reports page and verifies the chart updates without crashing.",
    "reports page shows no \"demo data\" notice": "Confirms the Reports page does not display a demo-data warning banner.",
  },
  "beta-campaigns": {
    "list shows heading, new-campaign button, and status filter": "Opens the Campaigns list and confirms the page heading, New Campaign button, and status filter chips are all present.",
    "clicking the Sending status chip filters without crashing": "Clicks the Sending status filter chip and confirms the page does not throw an error.",
    "clicking a blast row navigates to its detail page": "Clicks on a campaign row and verifies the browser navigates to the campaign detail page.",
    "wizard shows recipient count on audience step": "Opens the blast wizard, selects a template, and confirms the audience step displays a non-zero recipient count.",
    "selecting a state chip updates the recipient count": "Clicks a state chip in the wizard audience step and verifies the displayed recipient count changes.",
    "specialization chips are clickable and do not crash": "Clicks the EV/Hybrid and other specialization filter chips in the wizard and confirms no error occurs.",
    "create blast → detail page shows all four counters": "Completes the Send Now blast wizard and verifies the detail page shows all four counters: Total, Delivered, Failed, and Pending.",
    "recipients table is visible with status filter": "Opens a blast detail page and confirms the recipients table and its status filter dropdown are visible.",
    "filtering to Failed surfaces Retry buttons and Retry All": "Filters the recipients table to Failed status and checks that individual Retry buttons and a Retry All button appear.",
    "blast name is required — empty name keeps Create button disabled": "Opens the blast wizard review step with no blast name entered and confirms the Create button stays disabled.",
    "schedule blast → detail shows Cancel button in SCHEDULED state": "Schedules a blast for the future and verifies the detail page shows a Cancel button and the SCHEDULED status badge.",
    "cancel a SCHEDULED blast — Cancel button disappears": "Cancels a scheduled blast and confirms the Cancel button is removed from the detail page.",
    "past scheduled date shows validation error": "Enters a past date in the schedule picker and confirms an inline validation error is shown.",
    "newly scheduled blast appears in the campaigns list": "Schedules a blast and navigates back to the list to confirm the new blast row is visible.",
  },
  "beta-inbox": {
    "inbox shows Auto-replied and Needs Human mode buttons": "Opens the Inbox page and confirms both mode toggle buttons (Auto-replied and Needs Human) are rendered.",
    "switching to Auto-replied mode shows AI conversations or empty state": "Clicks the Auto-replied mode button and confirms the panel shows either AI conversation rows or an empty state message.",
    "Needs Human mode shows Active and Closed tab buttons": "In Needs Human mode, confirms both the Active and Closed tab buttons are present.",
    "escalation creates a ticket — Resolve and Close buttons appear": "Simulates an inbound message that triggers escalation and confirms Resolve and Close buttons appear on the ticket.",
    "resolve → SKIP disposition → modal closes → toast shown": "Resolves a ticket, selects SKIP in the Knowledge Base modal, confirms, and verifies the modal closes with a success toast.",
    "resolved ticket moves to the Closed tab": "Resolves a ticket and switches to the Closed tab to confirm the ticket appears there.",
    "active ticket shows suggest-draft and agent-context-card": "Opens an active ticket and confirms the AI suggest-draft panel and agent context card are both visible.",
    "saved-replies dropdown visible when canned replies exist": "Ensures at least one canned reply exists, opens an active ticket, and confirms the saved-replies dropdown is visible.",
    "sidebar inbox badge is visible when active tickets exist": "Seeds an escalation and confirms the Inbox sidebar link shows a notification badge.",
    "create → edit → delete via Settings": "Goes through the full canned reply lifecycle: creates one, edits its body, then deletes it, verifying each step in the list.",
    "Add button disabled until both title and body are filled": "Opens the add-canned-reply form and confirms the Add button is disabled until both the title and body fields have content.",
  },
  "beta-contacts": {
    "Import button disabled until file selected": "Opens the CSV import page and confirms the Import button is disabled before a file is chosen.",
    "valid CSV imports successfully — shows Imported count": "Uploads a valid CSV file and confirms the import success message shows a non-zero imported count.",
    "CSV with invalid rows surfaces the error list": "Uploads a CSV with intentionally invalid rows and confirms the UI shows an error list with the offending entries.",
    "Cancel on import page returns to contacts list": "Clicks Cancel on the CSV import page and confirms the browser navigates back to the contacts list.",
    "dealers table renders with rows": "Navigates to the Dealers tab and confirms the table is visible with at least one row.",
    "search filters the dealer list": "Types the configured search term into the dealer search box and confirms the results are filtered to matching dealers.",
    "EV/Hybrid specialization chip filters without crashing": "Clicks the EV/Hybrid chip and confirms the dealer list updates without throwing an error.",
    "admin adds dealer via modal — appears in table": "Opens the add-dealer modal, fills in all fields, submits, and confirms the new dealer appears in the table.",
    "duplicate phone number shows error in add-dealer modal": "Attempts to add a dealer with a phone number already in use and confirms an inline error is shown in the modal.",
    "create contact → verify in list": "Creates a new contact and then searches the contacts list to confirm the new entry is visible.",
    "edit contact name then delete": "Opens a contact, edits its name, saves, then deletes it, confirming the contact is removed from the list.",
  },
  "beta-segments": {
    "segment builder page loads and shows tier filter chips": "Opens the segment builder and confirms the page renders with Gold, Silver, and Bronze tier filter chips visible.",
    "Gold, Silver, and Bronze tier chips are all visible": "Asserts each of the three tier chips (Gold, Silver, Bronze) is individually present on the segment builder page.",
    "select all dealers → save as segment → success toast": "Selects all dealers in the builder, saves with a unique segment name, and confirms a success toast appears.",
    "saved segment appears on the Segments page": "After saving, navigates to the Segments page and confirms the newly created segment row is visible.",
    "segment row shows the segment name and dealer count": "Checks that the segment list row displays both the segment name and the number of dealers it contains.",
  },
  "beta-templates": {
    "template list loads with rows visible": "Opens the Templates page and confirms at least one template group row is rendered.",
    "PENDING status filter chip marks itself as active": "Clicks the PENDING filter chip and confirms it becomes visually active (aria-pressed = true).",
    "APPROVED status filter chip marks itself as active": "Clicks the APPROVED filter chip and confirms it becomes visually active (aria-pressed = true).",
    "create multi-language draft — appears in list with DRAFT status": "Fills the template form with EN and a second-language variant, saves as draft, and confirms it appears with a DRAFT badge.",
    "edit content, save as draft, draft appears in list with edits": "Uses the AI wizard (with mocked generation), edits the body, saves as draft, and confirms the edits are visible on the detail page.",
    "closing wizard at review step warns before discarding": "Tries to close the wizard mid-flow: dismissing the browser dialog keeps the wizard open, while accepting it closes it.",
  },
  "beta-settings": {
    "invite member → appears in users table": "Invites a new team member via the Settings form and confirms the new user appears in the users table.",
    "duplicate email shows inline error and keeps modal open": "Attempts to invite the same email address twice and confirms an inline error is shown while the modal stays open.",
    "admin resets a team member password": "Uses the Reset Password button on a team member row and confirms the form submits and the dialog closes successfully.",
    "admin deletes a team member — removed from table": "Deletes a team member and confirms their row is no longer visible in the users table.",
    "state-language table is visible on the Languages tab": "Navigates to the Languages settings tab and confirms the state-language mapping table is rendered.",
    "Penang (ZH+EN) and Kelantan (MS) mappings persist after reload": "Sets language mappings for two states, reloads the page, and confirms both mappings are still shown correctly.",
  },
  "beta-analytics": {
    "reports page renders delivery funnel heading": "Navigates to the Reports page and confirms the delivery funnel section heading is visible.",
    "delivery rate metric is shown": "Checks that a delivery rate percentage or metric is displayed on the Reports page.",
    "7-day range chip switches the view without error": "Clicks the 7-day range chip and confirms the chart updates without throwing an error.",
    "30-day range chip switches the view without error": "Clicks the 30-day range chip and confirms the chart updates without throwing an error.",
    "90-day range chip switches the view without error": "Clicks the 90-day range chip and confirms the chart updates without throwing an error.",
    "no demo-data notice is displayed": "Confirms the Reports page does not show a demo-data warning banner.",
    "KPI strip is visible on the dashboard": "Navigates to the dashboard and confirms the KPI strip (Auto-handled today metric) is visible.",
  },
  "beta-knowledge-base": {
    "SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options": "Opens the Knowledge Base modal after resolving a ticket and confirms all three disposition buttons (SKIP, IMPORT_LIVE, SAVE_DRAFT) are visible.",
    "SKIP disposition closes modal and shows resolved toast": "Selects SKIP in the modal, confirms, and verifies the modal closes with a 'Ticket resolved' toast.",
    "SAVE_DRAFT disposition closes modal and shows resolved toast": "Selects SAVE_DRAFT in the modal, confirms, and verifies the modal closes with a success toast.",
    "IMPORT_LIVE disposition closes modal and shows resolved toast": "Selects IMPORT_LIVE in the modal, confirms, and verifies the modal closes with a success toast.",
    "kb-confirm button is disabled until a disposition is selected": "Opens the modal and checks the Confirm button is disabled, then selects a disposition and confirms the button becomes enabled.",
  },
  "beta-cross-cutting": {
    "all primary nav links load without a blank screen": "Clicks each sidebar navigation link in sequence and confirms none results in a blank or error page.",
    "sidebar Dealers link navigates to /contacts": "Clicks the Dealers sidebar link and confirms the browser URL changes to /contacts.",
    "sidebar Templates link navigates to /templates": "Clicks the Templates sidebar link and confirms the browser URL changes to /templates.",
    "two consecutive blast wizard openings show independent blast-name inputs": "Opens the blast wizard, closes it, opens it again, and confirms the blast name field is empty and not carried over from the previous session.",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function msToHuman(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── State types ───────────────────────────────────────────────────────────────

interface SuiteConfig   { enabledTests: Set<string>; vars: Record<string, string>; }
interface ReportSpec    { title: string; ok: boolean; duration: number; error?: string; suite: string; }
interface RunResult     {
  exitCode: number; log: string; startedAt: string;
  setupRequired?: boolean;
  stats?: { duration: number; expected: number; unexpected: number; skipped: number; };
  specs?: ReportSpec[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReport(raw: any): Omit<RunResult, 'exitCode' | 'log' | 'startedAt'> {
  if (!raw) return {};
  const specs: ReportSpec[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(suite: any, _parent = '') {
    for (const spec of (suite.specs ?? [])) {
      const result = spec.tests?.[0]?.results?.[0];
      const error  = result?.errors?.[0]?.message ?? result?.errors?.[0] ?? undefined;
      specs.push({ title: spec.title, ok: spec.ok ?? false, duration: result?.duration ?? 0, error: typeof error === 'string' ? error : undefined, suite: suite.title });
    }
    for (const sub of (suite.suites ?? [])) walk(sub);
  }
  for (const suite of (raw.suites ?? [])) walk(suite);
  return { stats: { duration: raw.stats?.duration ?? 0, expected: raw.stats?.expected ?? 0, unexpected: raw.stats?.unexpected ?? 0, skipped: raw.stats?.skipped ?? 0 }, specs };
}

function defaultConfig(suite: SuiteDef): SuiteConfig {
  return {
    enabledTests: new Set(suite.tests.filter(t => t.defaultEnabled).map(t => t.name)),
    vars: Object.fromEntries(suite.vars.map(v => [v.key, v.defaultValue])),
  };
}

// ── Setup banner ──────────────────────────────────────────────────────────────

function SetupBanner() {
  const cmd = "cd scripts/WA-Blaster-Beta && npm install";
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(cmd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Terminal size={15} className="text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-300">One-time setup required</span>
      </div>
      <p className="text-xs text-amber-200/70 leading-relaxed">
        Playwright dependencies are not installed for the BETA suite. Run this once in your terminal.
      </p>
      <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5">
        <code className="flex-1 text-xs font-mono text-slate-200">{cmd}</code>
        <button onClick={copy} className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors">
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Report panel ──────────────────────────────────────────────────────────────

function ReportPanel({ result }: { result: RunResult }) {
  if (!result.stats) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Results</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Passed",   value: result.stats.expected,            color: "text-green-400", bg: "bg-green-900/30 border-green-800" },
          { label: "Failed",   value: result.stats.unexpected,          color: "text-red-400",   bg: "bg-red-900/30 border-red-800" },
          { label: "Skipped",  value: result.stats.skipped,             color: "text-slate-400", bg: "bg-slate-800 border-slate-700" },
          { label: "Duration", value: msToHuman(result.stats.duration), color: "text-blue-300",  bg: "bg-blue-900/20 border-blue-900" },
        ].map(s => (
          <div key={s.label} className={clsx("rounded-xl border p-3 text-center", s.bg)}>
            <div className={clsx("text-xl font-black", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {result.specs && result.specs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider w-14">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Suite</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider w-20">Time</th>
              </tr>
            </thead>
            <tbody>
              {result.specs.map((spec, i) => (
                <Fragment key={i}>
                  <tr className={clsx("border-b border-slate-800/60", !spec.ok && "bg-red-950/20")}>
                    <td className="px-3 py-2">
                      {spec.ok ? <CheckCircle2 size={13} className="text-green-400" /> : <XCircle size={13} className="text-red-400" />}
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate">{spec.suite}</td>
                    <td className="px-3 py-2 text-slate-300">{spec.title}</td>
                    <td className="px-3 py-2 text-right text-slate-500 font-mono">{msToHuman(spec.duration)}</td>
                  </tr>
                  {spec.error && (
                    <tr className="bg-red-950/10 border-b border-red-900/20">
                      <td colSpan={4} className="px-3 py-2">
                        <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">{spec.error}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.log && (
        <details className="bg-slate-950 border border-slate-800 rounded-xl">
          <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer hover:text-slate-300">Show full log</summary>
          <pre className="px-4 pb-3 text-[10px] text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{result.log}</pre>
        </details>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const GROUP_ORDER = ["Foundation", "Campaigns", "Inbox", "Data"];

export default function WABlasterBetaPage() {
  // ── Global settings ────────────────────────────────────────────────────────
  const [baseUrl,       setBaseUrl]       = useState("http://localhost:5173");
  const [adminEmail,    setAdminEmail]    = useState("admin@example.com");
  const [adminPassword, setAdminPassword] = useState("ChangeMe123!");
  const [showAdminPw,   setShowAdminPw]   = useState(false);
  const [showVarPw,         setShowVarPw]         = useState<Record<string, boolean>>({});
  const [expandedSuiteDocs, setExpandedSuiteDocs] = useState<Set<string>>(new Set());
  const [expandedTestDocs,  setExpandedTestDocs]  = useState<Set<string>>(new Set());
  const [settingsOpen,      setSettingsOpen]      = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showBrowser,   setShowBrowser]   = useState(true);

  // ── Per-suite configs ──────────────────────────────────────────────────────
  const [suiteConfigs, setSuiteConfigs] = useState<Record<string, SuiteConfig>>(() =>
    Object.fromEntries(SUITES.map(s => [s.id, defaultConfig(s)]))
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activeSuiteId, setActiveSuiteId] = useState<string | null>(null);
  const [selected,      setSelected]      = useState<Set<string>>(new Set());

  // ── Run state ──────────────────────────────────────────────────────────────
  const [running,     setRunning]     = useState(false);
  const [stopping,    setStopping]    = useState(false);
  const [runLog,      setRunLog]      = useState("");
  const [result,      setResult]      = useState<RunResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);
  const runningContextRef = useRef<string | null>(null);
  const [resultContext,  setResultContext]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef  = useRef<HTMLPreElement>(null);

  // ── Restore from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("wa_beta_settings");
    if (!s) return;
    try {
      const d = JSON.parse(s);
      if (d.baseUrl)       setBaseUrl(d.baseUrl);
      if (d.adminEmail)    setAdminEmail(d.adminEmail);
      if (d.adminPassword) setAdminPassword(d.adminPassword);
      if (d.showBrowser !== undefined) setShowBrowser(d.showBrowser);
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("wa_beta_settings", JSON.stringify({ baseUrl, adminEmail, adminPassword, showBrowser }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/wa-blaster-beta/run");
      if (!res.ok) return;
      const data = await res.json();
      setRunLog(data.log ?? "");
      if (!data.running) {
        stopPolling();
        setRunning(false);
        setStopping(false);
        const ctx = runningContextRef.current;
        runningContextRef.current = null;
        setResultContext(ctx);
        setResult({ exitCode: data.exitCode, log: data.log, startedAt: data.startedAt ?? "", ...parseReport(data.report) });
      }
    }, 1500);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [runLog]);

  // ── Start run ──────────────────────────────────────────────────────────────
  async function startRun(suiteIds: string[], ctx: string) {
    const specFiles = suiteIds.map(id => SUITES.find(s => s.id === id)!.file);
    const env: Record<string, string> = {
      E2E_BASE_URL:       baseUrl,
      E2E_ADMIN_EMAIL:    adminEmail,
      E2E_ADMIN_PASSWORD: adminPassword,
    };

    for (const id of suiteIds) {
      const cfg = suiteConfigs[id];
      if (cfg) Object.assign(env, cfg.vars);
    }

    const allEnabled: string[] = [];
    for (const id of suiteIds) {
      const suite = SUITES.find(s => s.id === id)!;
      const cfg   = suiteConfigs[id];
      allEnabled.push(...suite.tests.filter(t => cfg.enabledTests.has(t.name)).map(t => t.name));
    }
    const totalTests = suiteIds.reduce((sum, id) => sum + (SUITES.find(s => s.id === id)?.tests.length ?? 0), 0);
    const grepPattern = allEnabled.length < totalTests ? allEnabled.map(escapeRegex).join("|") : undefined;

    setRunning(true);
    runningContextRef.current = ctx;
    setResultContext(null);
    setResult(null);
    setRunLog("");

    const res = await fetch("/api/wa-blaster-beta/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ specFiles, grepPattern, env, headed: showBrowser }),
    });
    if (!res.ok) {
      const data = await res.json();
      const errMsg = data.error ?? "Failed to start.";
      setRunning(false);
      runningContextRef.current = null;
      setResultContext(ctx);
      setRunLog(errMsg);
      setResult({ exitCode: 1, log: errMsg, startedAt: "", setupRequired: data.setupRequired ?? false });
      return;
    }
    startPolling();
  }

  async function stopRun() { setStopping(true); await fetch("/api/wa-blaster-beta/run", { method: "DELETE" }); }

  // ── Download report ────────────────────────────────────────────────────────
  async function downloadReport() {
    if (!result) return;
    const { stats, specs } = result;
    if (!specs?.length) { setDownloadErr("No test data — run a suite first."); return; }
    setDownloadErr(null);
    setDownloading(true);

    type ShotMap = Record<string, Record<string, { filename: string; caption: string; data: string }[]>>;
    let shots: ShotMap = {};
    try {
      const r = await fetch("/api/wa-blaster-beta/screenshots-data");
      if (r.ok) shots = await r.json();
    } catch { /* screenshots optional */ }
    setDownloading(false);

    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const ts = new Date().toLocaleString("en-MY", { timeZone:"Asia/Kuala_Lumpur", dateStyle:"long", timeStyle:"short" });
    const allPassed = (stats?.unexpected ?? 0) === 0;
    function specSlug(title: string) { return title.replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60); }
    const flowIds = Object.keys(shots);
    function shotsForSpec(title: string) {
      const slug = specSlug(title);
      for (const fid of flowIds) { if (shots[fid]?.[slug]) return shots[fid][slug]; }
      return [];
    }

    const suiteMap = new Map<string, ReportSpec[]>();
    for (const s of specs) {
      const key = s.suite || "Tests";
      (suiteMap.get(key) ?? suiteMap.set(key,[]).get(key))!.push(s);
    }

    const suiteBlocks = [...suiteMap.entries()].map(([suiteName, suiteSpecs]) => {
      const passed = suiteSpecs.filter(s => s.ok).length;
      const failed = suiteSpecs.filter(s => !s.ok).length;
      const testBlocks = suiteSpecs.map(s => {
        const specShots = shotsForSpec(s.title);
        const errBlock = s.error ? `<div style="margin-top:10px;background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px"><div style="font-size:11px;font-weight:700;color:#991b1b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Error Detail</div><pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.7;margin:0;font-family:'SF Mono','Fira Code',Consolas,monospace;color:#7f1d1d">${esc(s.error)}</pre></div>` : "";
        const screenshotGrid = specShots.length > 0 ? `<div style="margin-top:14px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:10px">Pages visited (${specShots.length} screenshot${specShots.length!==1?"s":""})</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${specShots.map((sh,i)=>`<figure style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc;break-inside:avoid"><div style="position:relative"><span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px">${i+1}</span><img src="data:image/png;base64,${sh.data}" style="width:100%;display:block" /></div><figcaption style="font-size:11px;font-family:'SF Mono','Fira Code',Consolas,monospace;color:#64748b;padding:6px 10px;background:#f1f5f9;border-top:1px solid #e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sh.caption)}</figcaption></figure>`).join("")}</div></div>` : "";
        return `<div style="border:1px solid ${s.ok?"#dcfce7":"#fee2e2"};border-left:4px solid ${s.ok?"#22c55e":"#ef4444"};border-radius:10px;padding:16px 20px;margin-bottom:12px;background:${s.ok?"#f0fdf4":"#fff1f2"}"><div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap"><span style="flex-shrink:0;margin-top:1px;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:5px;${s.ok?"background:#dcfce7;color:#15803d":"background:#fee2e2;color:#b91c1c"}">${s.ok?"PASS":"FAIL"}</span><span style="flex:1;min-width:0;font-size:13.5px;font-weight:600;color:#0f172a;line-height:1.4">${esc(s.title)}</span><span style="flex-shrink:0;font-size:12px;color:#94a3b8;font-variant-numeric:tabular-nums;white-space:nowrap">${msToHuman(s.duration)}</span></div>${errBlock}${screenshotGrid}</div>`;
      }).join("");
      return `<section style="margin:0;padding:28px 32px 12px;border-top:1px solid #e2e8f0"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px"><h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0">${esc(suiteName)}</h2><div style="display:flex;gap:10px;font-size:12px;font-weight:600">${passed>0?`<span style="color:#16a34a">${passed} passed</span>`:""}${failed>0?`<span style="color:#dc2626">${failed} failed</span>`:""}</div></div>${testBlocks}</section>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>BETA WA Blaster Test Report</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;background:#ffffff;color:#1a1a2e}figure{break-inside:avoid}section{break-before:auto}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:48px 56px 44px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:20px">🧪</span><div style="font-size:28px;font-weight:800;letter-spacing:-.5px">BETA WA Blaster — Test Report</div></div><div style="font-size:13px;color:#94a3b8;margin-bottom:32px">Generated ${ts}</div><div style="display:flex;gap:16px;flex-wrap:wrap">${([["Passed",String(stats?.expected??0),allPassed?"#4ade80":"#4ade80"],["Failed",String(stats?.unexpected??0),(stats?.unexpected??0)>0?"#f87171":"#4ade80"],["Skipped",String(stats?.skipped??0),"#94a3b8"],["Duration",msToHuman(stats?.duration??0),"#60a5fa"]] as [string,string,string][]).map(([label,val,color])=>`<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:16px 24px;min-width:120px;text-align:center"><div style="font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;color:${color}">${val}</div><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px">${label}</div></div>`).join("")}</div><div style="margin-top:28px;font-size:12px;color:#475569">Overall result: <strong style="color:${allPassed?"#4ade80":"#f87171"}">${allPassed?"ALL TESTS PASSED ✓":"SOME TESTS FAILED ✗"}</strong></div></div>${suiteBlocks}</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    win?.print();
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  // ── Config helpers ─────────────────────────────────────────────────────────
  function toggleTest(suiteId: string, name: string) {
    setSuiteConfigs(prev => {
      const cfg = prev[suiteId];
      const next = new Set(cfg.enabledTests);
      next.has(name) ? next.delete(name) : next.add(name);
      return { ...prev, [suiteId]: { ...cfg, enabledTests: next } };
    });
  }
  function setAllTests(suiteId: string, on: boolean) {
    const suite = SUITES.find(s => s.id === suiteId)!;
    setSuiteConfigs(prev => ({ ...prev, [suiteId]: { ...prev[suiteId], enabledTests: on ? new Set(suite.tests.map(t => t.name)) : new Set() } }));
  }
  function setSuiteVar(suiteId: string, key: string, value: string) {
    setSuiteConfigs(prev => ({ ...prev, [suiteId]: { ...prev[suiteId], vars: { ...prev[suiteId].vars, [key]: value } } }));
  }
  function resetSuiteVars(suiteId: string) {
    const suite = SUITES.find(s => s.id === suiteId)!;
    setSuiteConfigs(prev => ({ ...prev, [suiteId]: { ...prev[suiteId], vars: Object.fromEntries(suite.vars.map(v => [v.key, v.defaultValue])) } }));
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeSuite   = activeSuiteId ? SUITES.find(s => s.id === activeSuiteId) ?? null : null;
  const isRunningIn   = (ctx: string) => running && runningContextRef.current === ctx;
  const hasResultIn   = (ctx: string) => resultContext === ctx;
  const totalTests    = SUITES.reduce((sum, s) => sum + s.tests.length, 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {activeSuite ? (
            <>
              <button onClick={() => setActiveSuiteId(null)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                <ChevronLeft size={13} />
                <FlaskConical size={13} className="text-violet-400" />
                <span>BETA Tests</span>
              </button>
              <span className="text-slate-700">/</span>
              <span className="text-sm font-semibold text-slate-200 truncate">{activeSuite.emoji} {activeSuite.title}</span>
            </>
          ) : (
            <>
              <FlaskConical size={14} className="text-violet-400 shrink-0" />
              <h1 className="text-sm font-semibold text-slate-200">BETA — WA Blaster Tests</h1>
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-violet-900/50 border border-violet-700/60 text-violet-300 rounded-full">{totalTests} tests</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {running ? (
            <button onClick={stopRun} disabled={stopping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium">
              {stopping ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          ) : activeSuite ? (
            <button onClick={() => startRun([activeSuite.id], activeSuite.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-500 hover:bg-violet-400 active:scale-95 text-white rounded-lg font-semibold shadow-md shadow-violet-500/30 border border-violet-400/30 cursor-pointer transition-all">
              <Play size={12} /> Run Suite
            </button>
          ) : (
            <button onClick={() => startRun(SUITES.map(s => s.id), "overview")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-500 hover:bg-violet-400 active:scale-95 text-white rounded-lg font-semibold shadow-md shadow-violet-500/30 border border-violet-400/30 cursor-pointer transition-all">
              <Play size={12} /> Run All
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {!activeSuite && (
        <div className="px-4 sm:px-6 py-5 space-y-6">

          {/* Beta banner */}
          <div className="flex items-start gap-3 bg-violet-950/40 border border-violet-800/50 rounded-2xl px-5 py-4">
            <Info size={15} className="text-violet-400 shrink-0 mt-0.5" />
            <div className="text-xs text-violet-200/80 leading-relaxed">
              <span className="font-semibold text-violet-300">BETA suite</span> — independent from the main WA Blaster test page.
              All 11 feature groups and {totalTests} test scenarios run against the same app but use separate script files in{" "}
              <code className="font-mono text-violet-300">scripts/WA-Blaster-Beta/</code>.
              One-time setup: <code className="font-mono text-violet-300">cd scripts/WA-Blaster-Beta && npm install</code>
            </div>
          </div>

          {/* Global settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button onClick={() => setSettingsOpen(v => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              <Settings2 size={15} className="text-slate-500" />
              <span className="flex-1 text-left font-medium">Testing Environment</span>
              <span className="text-xs font-mono text-slate-600 mr-2 max-w-[240px] truncate">{baseUrl}</span>
              <ChevronDown size={14} className={clsx("transition-transform shrink-0", settingsOpen && "rotate-180")} />
            </button>
            {settingsOpen && (
              <div className="px-5 pb-5 border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">WA Blaster Base URL</label>
                  <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:5173"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-violet-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Email</label>
                  <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Password</label>
                  <div className="relative">
                    <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} type={showAdminPw ? "text" : "password"}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600" />
                    <button type="button" onClick={() => setShowAdminPw(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showAdminPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between flex-wrap gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button type="button" role="switch" aria-checked={showBrowser}
                      onClick={() => setShowBrowser(v => !v)}
                      className={clsx("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", showBrowser ? "bg-violet-600" : "bg-slate-600")}>
                      <span className={clsx("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform", showBrowser ? "translate-x-4" : "translate-x-0")} />
                    </button>
                    <span className="text-xs text-slate-300 font-medium">Show Browser</span>
                    <span className="text-[10px] text-slate-500">{showBrowser ? "Visible" : "Headless"}</span>
                  </label>
                  <button onClick={saveSettings}
                    className={clsx("px-4 py-2 text-xs font-medium rounded-lg transition-colors",
                      settingsSaved ? "bg-green-700 text-green-100 cursor-default" : "bg-violet-600 hover:bg-violet-500 text-white")}>
                    {settingsSaved ? "✓ Saved" : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batch run toolbar */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between bg-slate-900 border border-violet-800/50 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400">{selected.size} suite{selected.size > 1 ? "s" : ""} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                <button onClick={() => startRun(Array.from(selected), "overview")} disabled={running}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg">
                  <Play size={11} /> Run Selected ({selected.size})
                </button>
              </div>
            </div>
          )}

          {/* Suite cards grouped by feature area */}
          {GROUP_ORDER.map(group => {
            const groupSuites = SUITES.filter(s => s.group === group);
            return (
              <div key={group}>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-0.5">{group}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {groupSuites.map(suite => {
                    const cfg       = suiteConfigs[suite.id] ?? defaultConfig(suite);
                    const isChecked = selected.has(suite.id);
                    return (
                      <div key={suite.id} onClick={() => setActiveSuiteId(suite.id)}
                        className={clsx(
                          "bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors group",
                          isChecked ? "border-violet-600/60" : "border-slate-800 hover:border-slate-700"
                        )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isChecked}
                                onChange={e => { e.stopPropagation(); setSelected(prev => { const n = new Set(prev); e.target.checked ? n.add(suite.id) : n.delete(suite.id); return n; }); }}
                                className="accent-violet-500 w-3.5 h-3.5 cursor-pointer" />
                            </label>
                            <span className="text-lg leading-none">{suite.emoji}</span>
                            <span className="text-sm font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">{suite.title}</span>
                          </div>
                          {suite.metaRisk && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/50 border border-orange-700/60 text-orange-300 shrink-0">
                              <AlertTriangle size={9} /> META
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{suite.description}</p>

                        {/* "What's tested" expandable */}
                        <div onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedSuiteDocs(prev => {
                              const n = new Set(prev);
                              n.has(suite.id) ? n.delete(suite.id) : n.add(suite.id);
                              return n;
                            })}
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-violet-400 transition-colors"
                          >
                            <Info size={11} />
                            What&apos;s tested
                            <ChevronDown size={10} className={clsx("transition-transform", expandedSuiteDocs.has(suite.id) && "rotate-180")} />
                          </button>
                          {expandedSuiteDocs.has(suite.id) && (
                            <ul className="mt-2 space-y-1.5">
                              {suite.tests.map(t => (
                                <li key={t.name} className="flex items-start gap-2">
                                  <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-slate-600" />
                                  <div>
                                    <p className="text-[11px] font-medium text-slate-400 leading-snug">{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</p>
                                    {SUITE_DOCS[suite.id]?.[t.name] && (
                                      <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{SUITE_DOCS[suite.id][t.name]}</p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 border-t border-slate-800 pt-2.5">
                          <span className="flex items-center gap-1"><Clock size={11} />{suite.estimatedDuration}</span>
                          <span>{cfg.enabledTests.size}/{suite.tests.length} tests</span>
                          <span className="ml-auto text-[10px] font-medium text-slate-600 group-hover:text-violet-400 transition-colors">Configure →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Overview run output */}
          {(isRunningIn("overview") || hasResultIn("overview")) && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  {isRunningIn("overview") ? <Loader2 size={13} className="text-violet-400 animate-spin" />
                    : result?.exitCode === 0 ? <CheckCircle2 size={13} className="text-green-400" />
                    : <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs font-medium text-slate-400">
                    {isRunningIn("overview") ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                  </span>
                </div>
                <pre ref={isRunningIn("overview") ? logRef : undefined}
                  className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {runLog || "Starting…"}
                </pre>
              </div>
              {hasResultIn("overview") && result?.setupRequired && <SetupBanner />}
              {hasResultIn("overview") && result && !result.setupRequired && (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadReport} disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 rounded-lg">
                      <Download size={12} />
                      {downloading ? "Building report…" : "Download Report"}
                    </button>
                    {downloadErr && <span className="text-xs text-red-400">{downloadErr}</span>}
                  </div>
                  <ReportPanel result={result} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUITE DETAIL
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSuite && (() => {
        const suite     = activeSuite;
        const cfg       = suiteConfigs[suite.id] ?? defaultConfig(suite);
        const isRunning = isRunningIn(suite.id);
        const hasResult = hasResultIn(suite.id);
        const otherBusy = running && runningContextRef.current !== suite.id;

        return (
          <div className="px-4 sm:px-6 py-5 space-y-5">
            {/* Suite info */}
            <div className="flex items-start gap-4">
              <span className="text-3xl leading-none mt-0.5">{suite.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-slate-100">{suite.title}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-900/40 text-violet-300 border border-violet-800/60">{suite.group}</span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{suite.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><Clock size={11} />{suite.estimatedDuration}</span>
                  {suite.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
              {/* Test list + vars */}
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Tests
                    <span className="ml-2 text-slate-600 font-normal normal-case">{cfg.enabledTests.size} of {suite.tests.length} enabled</span>
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => setAllTests(suite.id, true)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">All</button>
                    <button onClick={() => setAllTests(suite.id, false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">None</button>
                  </div>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {suite.tests.map(t => {
                    const enabled   = cfg.enabledTests.has(t.name);
                    const testVars  = suite.vars.filter(v => v.forTest === t.name);
                    return (
                      <div key={t.name} className={clsx("transition-colors", enabled ? "" : "opacity-50")}>
                        {/* Test row */}
                        <div className="px-5 py-3.5 flex items-start gap-3">
                          <input type="checkbox" checked={enabled} onChange={() => toggleTest(suite.id, t.name)}
                            className="accent-violet-500 mt-0.5 shrink-0 cursor-pointer" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5">
                              <p className={clsx("flex-1 text-sm leading-snug", enabled ? "text-slate-200" : "text-slate-500")}>{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</p>
                              {SUITE_DOCS[suite.id]?.[t.name] && (
                                <button
                                  onClick={() => setExpandedTestDocs(prev => {
                                    const n = new Set(prev);
                                    n.has(t.name) ? n.delete(t.name) : n.add(t.name);
                                    return n;
                                  })}
                                  className={clsx("shrink-0 mt-0.5 transition-colors", expandedTestDocs.has(t.name) ? "text-violet-400" : "text-slate-600 hover:text-slate-400")}
                                  title="What does this test do?"
                                >
                                  <Info size={12} />
                                </button>
                              )}
                            </div>
                            {expandedTestDocs.has(t.name) && SUITE_DOCS[suite.id]?.[t.name] && (
                              <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700/50">
                                {SUITE_DOCS[suite.id][t.name]}
                              </p>
                            )}
                            {t.metaRisk && (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-900/40 text-orange-400 border border-orange-800/60">
                                <AlertTriangle size={8} /> Calls Meta API — use sparingly
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Inline vars for this test */}
                        {testVars.length > 0 && (
                          <div className="mx-5 mb-3.5 ml-[52px] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                            {testVars.map(v => {
                              const val       = cfg.vars[v.key] ?? v.defaultValue;
                              const isDefault = val === v.defaultValue;
                              const isPw      = v.type === "password";
                              const pwVisible = showVarPw[v.key] ?? false;
                              return (
                                <div key={v.key} className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <label className="text-[11px] font-medium text-slate-400">{v.label}</label>
                                    {v.counter && (
                                      <span className="px-1 py-px rounded text-[9px] font-semibold bg-violet-900/40 text-violet-400 border border-violet-800/50">auto-suffix</span>
                                    )}
                                    {!isDefault && (
                                      <button onClick={() => setSuiteVar(suite.id, v.key, v.defaultValue)}
                                        className="ml-auto text-[10px] text-slate-600 hover:text-violet-400 transition-colors flex items-center gap-0.5">
                                        <RotateCcw size={8} /> reset
                                      </button>
                                    )}
                                  </div>
                                  <div className="relative">
                                    {v.options ? (
                                      <select
                                        value={val}
                                        onChange={e => setSuiteVar(suite.id, v.key, e.target.value)}
                                        className={clsx(
                                          "w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors appearance-none cursor-pointer",
                                          isDefault ? "border-slate-700" : "border-violet-600/50"
                                        )}
                                      >
                                        {v.options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                                      </select>
                                    ) : (
                                      <>
                                        <input
                                          type={isPw && !pwVisible ? "password" : "text"}
                                          value={val}
                                          onChange={e => setSuiteVar(suite.id, v.key, e.target.value)}
                                          className={clsx(
                                            "w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors",
                                            isDefault ? "border-slate-700" : "border-violet-600/50",
                                            isPw && "pr-8"
                                          )}
                                        />
                                        {isPw && (
                                          <button onClick={() => setShowVarPw(p => ({ ...p, [v.key]: !pwVisible }))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                            {pwVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {v.counter && (
                                    <p className="text-[9px] text-slate-600 font-mono">↳ e.g. {val} 1, {val} 2, …</p>
                                  )}
                                  {v.hint && <p className="text-[9px] text-slate-600 leading-relaxed">{v.hint}</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* General vars (no forTest) — rare, shown at the bottom */}
                {suite.vars.some(v => !v.forTest) && (
                  <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                    <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings2 size={10} /> Suite-wide variables
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {suite.vars.filter(v => !v.forTest).map(v => {
                        const val       = cfg.vars[v.key] ?? v.defaultValue;
                        const isDefault = val === v.defaultValue;
                        const isPw      = v.type === "password";
                        const pwVisible = showVarPw[v.key] ?? false;
                        return (
                          <div key={v.key} className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <label className="text-[11px] font-medium text-slate-400">{v.label}</label>
                              {v.counter && (
                                <span className="px-1 py-px rounded text-[9px] font-semibold bg-violet-900/40 text-violet-400 border border-violet-800/50">auto-suffix</span>
                              )}
                              {!isDefault && (
                                <button onClick={() => setSuiteVar(suite.id, v.key, v.defaultValue)}
                                  className="ml-auto text-[10px] text-slate-600 hover:text-violet-400 transition-colors flex items-center gap-0.5">
                                  <RotateCcw size={8} /> reset
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              {v.options ? (
                                <select
                                  value={val}
                                  onChange={e => setSuiteVar(suite.id, v.key, e.target.value)}
                                  className={clsx(
                                    "w-full bg-slate-800/80 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors appearance-none cursor-pointer",
                                    isDefault ? "border-slate-700" : "border-violet-600/50"
                                  )}
                                >
                                  {v.options.map(opt => <option key={opt} value={opt} className="bg-slate-800">{opt}</option>)}
                                </select>
                              ) : (
                                <>
                                  <input
                                    type={isPw && !pwVisible ? "password" : "text"}
                                    value={val}
                                    onChange={e => setSuiteVar(suite.id, v.key, e.target.value)}
                                    className={clsx(
                                      "w-full bg-slate-800/80 border rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors",
                                      isDefault ? "border-slate-700" : "border-violet-600/50",
                                      isPw && "pr-8"
                                    )}
                                  />
                                  {isPw && (
                                    <button onClick={() => setShowVarPw(p => ({ ...p, [v.key]: !pwVisible }))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                      {pwVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            {v.hint && <p className="text-[9px] text-slate-600 leading-relaxed">{v.hint}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column — run panel only */}
              <div className="space-y-4">
                {/* Run panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Run</h3>
                    <span className="text-[11px] text-slate-600">{cfg.enabledTests.size}/{suite.tests.length} tests</span>
                  </div>
                  {otherBusy ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                      <Loader2 size={12} className="animate-spin text-violet-400 shrink-0" />
                      Another suite is running…
                    </div>
                  ) : isRunning ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-violet-300 animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Running…
                      </div>
                      <button onClick={stopRun} disabled={stopping}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                        {stopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                        {stopping ? "Stopping…" : "Stop Run"}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => startRun([suite.id], suite.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-violet-500 hover:bg-violet-400 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-violet-500/25 border border-violet-400/30 cursor-pointer transition-all">
                        <Play size={14} /> Run Suite
                      </button>
                      {hasResult && (
                        <>
                          <button onClick={downloadReport} disabled={downloading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 rounded-xl transition-colors">
                            <Download size={14} />
                            {downloading ? "Building report…" : "Download Report"}
                          </button>
                          {downloadErr && <p className="text-xs text-red-400 text-center">{downloadErr}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live log */}
            {(isRunning || hasResult) && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  {isRunning ? <Loader2 size={13} className="text-violet-400 animate-spin" />
                    : result?.exitCode === 0 ? <CheckCircle2 size={13} className="text-green-400" />
                    : <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs font-medium text-slate-400">
                    {isRunning ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                  </span>
                </div>
                <pre ref={isRunning ? logRef : undefined}
                  className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {runLog || "Starting…"}
                </pre>
              </div>
            )}

            {hasResult && result?.setupRequired && <SetupBanner />}
            {hasResult && result && !result.setupRequired && <ReportPanel result={result} />}
          </div>
        );
      })()}
    </div>
  );
}
