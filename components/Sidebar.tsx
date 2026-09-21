"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ChevronDown, Shield, Car,
  Settings, Kanban, Sparkles,
  CheckSquare, FileText, Search, X, CalendarDays, Ticket, ClipboardList,
  Briefcase, Send, Filter, Music2, AtSign, ShoppingCart, ArrowLeftRight, BookOpen, SearchCheck,
  Mail, Tickets, Server, Building2, QrCode,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { CURRENT_VERSION } from "@/lib/changelog";

const nav = [
  { label: "Dashboard",  href: "/",         icon: LayoutDashboard },
  {
    label: "JIRA",
    icon: Ticket,
    children: [
      { label: "Dashboard",    href: "/jira",          icon: LayoutDashboard },
      { label: "Issue Filter", href: "/jira/filter",   icon: Filter },
      { label: "Mentions",     href: "/jira/mentions", icon: AtSign },
      { label: "Ticket Studies", href: "/jira/studies", icon: BookOpen },
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
  {
    label: "eAuto",
    icon: Car,
    children: [
      // Insurance page holds tabs: Availability (eAuto), Availability (Secarang),
      // Regression (Secarang), and Purchase E2E (eAuto).
      { label: "Insurance",       href: "/eauto/insurance", icon: Shield },
      { label: "Shopping Cart",   href: "/eauto/shopping-cart", icon: ShoppingCart },
      { label: "Create eSTM",     href: "/eauto/estm",      icon: ArrowLeftRight },
      // "Create eSTM (Original)" — the pre-refactor single-file script — is
      // hidden from the sidebar but still live at /eauto/estm-legacy, same as
      // the WA Blaster pages below. It is a known-good baseline to fall back on
      // when this one misbehaves, not something to reach for day to day.
      // Checker holds data-validity checkers (ROC / New ROC / TIN, more to come).
      // Not test automation — no recording, no pass/fail.
      { label: "Checker",         href: "/eauto/checker",   icon: SearchCheck },
      // eSIM — the eAuto Simulator that steers JPJ/insurance response codes by
      // vehicle prefix. VPN-only; the page gates every run on confirming that.
      { label: "eSIM",            href: "/eauto/esim",      icon: Server },
      // WA Blaster (old: scripts/_archive/WA-Blaster, still at /wa-blaster) and
      // WA Blaster Beta (still at /wa-blaster-beta) are hidden from the sidebar
      // but not deleted — reachable by direct URL if ever needed again.
    ],
  },
  {
    // Automation built for one specific ticket, named by its ticket number.
    // The groups above are per-module and outlive any single ticket; these
    // exist because a ticket asked for them. Label them with the number alone
    // — the page header carries the summary.
    label: "Tickets",
    icon: Tickets,
    children: [
      // EAINT-11864 — quotation-reminder email. Time-sensitive: the cases are
      // built around the hourly 07:00-23:00 cron, hence the schedule picker.
      { label: "11864",           href: "/eauto/quotation-reminder", icon: Mail },
      // EAINT-9306 — [eAuto-AATF] eDereg Pre-Check as a compulsory step in the
      // eDereg transaction creation flow. Awaiting case details from Faizuddin.
      { label: "9306",            href: "/eauto/edereg-precheck",    icon: ClipboardList },
      // EAINT-12153 — [eAuto-Application] Add Payment Channels for
      // Pre-application and Application. This page is NOT that feature — it's
      // a sub-function ("Company Details Checker") to prepare test data for
      // it: confirms Company ROC / New Company ROC / TIN are not already
      // used in staging before onboarding a new company with them.
      { label: "12153",           href: "/eauto/company-details-checker", icon: Building2 },
      // EAINT-12257 — [eAuto-Application] Add DuitNow QR Payment Channel for
      // Pre-application and Application. Semi-automated by necessity: the run
      // drives everything but stops twice for a person — the reCAPTCHA tick and
      // the QR scan on a physical phone. Runs headed; it cannot go headless.
      { label: "12257",           href: "/eauto/duitnow-qr", icon: QrCode },
    ],
  },
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
        <span className="text-slate-100 font-semibold text-sm flex-1">Udin's Board</span>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 lg:hidden p-1">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-2 pt-2">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 hover:text-slate-300 transition-colors"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search…</span>
          <span className="text-[10px] font-mono text-slate-700">⌘K</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          if (!("children" in item)) {
            const isActive = pathname === item.href;
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
        <button
          onClick={openWhatsNew}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Sparkles size={15} />
          <span className="flex-1 text-left">What's New</span>
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
