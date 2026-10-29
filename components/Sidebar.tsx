"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ChevronDown, Car,
  Settings, Kanban, Sparkles,
  CheckSquare, FileText, Search, X, CalendarDays, Ticket, ClipboardList,
  Briefcase, Send, Filter, Music2,
  Tickets, Workflow, Bot, Route, GraduationCap,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { CURRENT_VERSION } from "@/lib/changelog";
import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import { EAUTO_MODULES } from "@/lib/eautoModules";
import RunningAutomations from "@/components/RunningAutomations";
import HistoryButtons from "@/components/HistoryButtons";
import WorkingNow from "@/components/pipeline/WorkingNow";

const nav = [
  { label: "Dashboard",  href: "/",         icon: LayoutDashboard },
  {
    label: "JIRA",
    icon: Ticket,
    children: [
      { label: "Dashboard",    href: "/jira",          icon: LayoutDashboard },
      { label: "Issue Filter", href: "/jira/filter",   icon: Filter },
      { label: "TS Tracker",   href: "/tests",         icon: ClipboardList },
    ],
  },
  { label: "Kanban",     href: "/kanban",   icon: Kanban },
  { label: "QA Flow",    href: "/qa-flow",  icon: Sparkles },
  { label: "Calendar",   href: "/calendar", icon: CalendarDays },
  {
    label: "Productivity",
    icon: Briefcase,
    children: [
      { label: "To-Do List",    href: "/todo",           icon: CheckSquare },
      { label: "Notes",         href: "/notes",          icon: FileText },
      { label: "Daily Update",  href: "/daily-update",   icon: Send },
      // { label: "Music",         href: "/music",          icon: Music2 },
    ],
  },
  // eAuto module pages (Insurance, Shopping Cart, Create eSTM, Checker,
  // Company Details Checker, Secarang Plate Check, eSIM, Create BDP). Was a
  // dropdown; since 2026-10-21 it is one link to /eauto, a card / list page
  // like /tickets. The pages are catalogued in lib/eautoModules.ts — add new
  // ones there, not here. Hidden but still live by URL: /eauto/estm-legacy
  // (known-good eSTM baseline), /wa-blaster and /wa-blaster-beta.
  { label: "eAuto",      href: "/eauto",    icon: Car, matches: EAUTO_MODULES.map(m => m.href) },
  // eAuto Flows and Modules — module → flow → trigger point → steps, what each
  // flow affects, cronjobs, access (Faizuddin, 2026-10-23). Data in lib/eautoFlows.
  { label: "eAuto Flows", href: "/eauto/flows", icon: Workflow },
  // Automation built for one specific ticket. Was a dropdown of ticket
  // numbers; since 2026-10-15 it is one link to /tickets, a page listing every
  // ticket automation (card / list, detailed / simple). The per-ticket pages
  // themselves are catalogued in lib/ticketAutomations.ts — add new ones
  // there, not here. The item stays highlighted while on any of those pages.
  { label: "Tickets",    href: "/tickets",  icon: Tickets, matches: TICKET_AUTOMATIONS.map(t => t.href) },
  // Scheduled study agents (Jira Scout, SharePoint Scribe) shown as pixel
  // characters; status from data/agents/ (Faizuddin, 2026-10-27).
  { label: "Agents",     href: "/agents",   icon: Bot },
  // QA pipeline: one ticket from study to scenarios, automation, runs and
  // QA-Issues, worked with the Scout / Scribe / Elf / Dwarf agents (Faizuddin, 2026-10-27).
  { label: "Pipeline",   href: "/pipeline", icon: Route, matches: ["/pipeline"] },
  // What the Sage (pipeline knowledge keeper) learned, and the knowledge changes
  // and pipeline ideas waiting for Faizuddin (2026-10-27).
  { label: "Learnings",  href: "/pipeline/learnings", icon: GraduationCap },
];

export default function Sidebar({ onClose, onSearch }: { onClose?: () => void; onSearch?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>([]);
  const { openWhatsNew } = useApp();

  function toggleGroup(label: string) {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">UB</span>
        </div>
        <span className="text-slate-100 font-semibold text-sm flex-1">Udin&apos;s Board</span>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 lg:hidden p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Back / Forward + Search */}
      <div className="px-2 pt-2 flex items-center gap-1">
        <HistoryButtons />
        <button
          onClick={onSearch}
          className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 hover:text-slate-300 transition-colors"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search…</span>
          <span className="text-[10px] font-mono text-slate-700">⌘K</span>
        </button>
      </div>

      {/* Automations running right now — click to open their page */}
      <RunningAutomations onNavigate={onClose} />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          if (!("children" in item)) {
            const isActive = pathname === item.href
              || ("matches" in item && (item.matches ?? []).some(m => pathname === m || pathname.startsWith(m + "/")));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "bg-blue-600/20 text-blue-400 font-medium" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          }

          const isOpen = expanded.includes(item.label);
          const hasActive = item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  hasActive ? "text-slate-200" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                )}
              >
                <item.icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                  {(item.children ?? []).map(child => {
                    const isActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={clsx(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                          isActive ? "bg-blue-600/20 text-blue-400 font-medium" : "text-slate-500 hover:text-slate-100 hover:bg-slate-800"
                        )}
                      >
                        <child.icon size={14} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <WorkingNow />
        <button
          onClick={openWhatsNew}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Sparkles size={15} />
          <span className="flex-1 text-left">What&apos;s New</span>
          <span className="text-[10px] font-thin text-slate-600">{CURRENT_VERSION}</span>
        </button>
        <Link
          href="/settings"
          onClick={onClose}
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
            pathname === "/settings" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          )}
        >
          <Settings size={15} />Settings
        </Link>
      </div>
    </aside>
  );
}
