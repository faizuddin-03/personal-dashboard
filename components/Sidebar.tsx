"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ChevronDown, Shield, Car,
  Settings, Kanban, Sparkles,
  CheckSquare, FileText, Search, X, CalendarDays, Ticket, ClipboardList,
  Briefcase, Send, Filter, PanelLeftClose, PanelLeftOpen,
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
      { label: "Dashboard",    href: "/jira",        icon: LayoutDashboard },
      { label: "Issue Filter", href: "/jira/filter", icon: Filter },
    ],
  },
  { label: "Kanban",     href: "/kanban",   icon: Kanban },
  { label: "TS Tracker", href: "/tests",    icon: ClipboardList },
  { label: "Calendar",   href: "/calendar", icon: CalendarDays },
  {
    label: "Productivity",
    icon: Briefcase,
    children: [
      { label: "To-Do List",    href: "/todo",           icon: CheckSquare },
      { label: "Notes",         href: "/notes",          icon: FileText },
      { label: "Daily Update",  href: "/daily-update",   icon: Send },
    ],
  },
  {
    label: "eAuto",
    icon: Car,
    children: [
      { label: "Insurance", href: "/eauto/insurance", icon: Shield },
    ],
  },
];

export default function Sidebar({ onClose, onSearch }: { onClose?: () => void; onSearch?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(["eAuto", "Productivity", "JIRA"]);
  const { openWhatsNew, sidebarNarrow, toggleSidebarNarrow } = useApp();

  function toggleGroup(label: string) {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  if (sidebarNarrow) {
    return (
      <aside className="w-14 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="flex items-center justify-center h-14 border-b border-slate-800 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">UB</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1 py-3 space-y-1 overflow-y-auto">
          {nav.map(item => {
            if (!("children" in item)) {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} title={item.label}
                  className={clsx("flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors",
                    isActive ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800")}
                >
                  <item.icon size={17} />
                </Link>
              );
            }
            const isOpen = expanded.includes(item.label);
            const hasActive = item.children?.some(c => pathname === c.href) ?? false;
            return (
              <div key={item.label}>
                <button onClick={() => toggleGroup(item.label)} title={item.label}
                  className={clsx("flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors",
                    hasActive ? "text-slate-200 bg-slate-800" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800")}
                >
                  <item.icon size={17} />
                </button>
                {isOpen && (
                  <div className="space-y-0.5 mt-0.5">
                    {(item.children ?? []).map(child => {
                      const isActive = pathname === child.href;
                      return (
                        <Link key={child.href} href={child.href} onClick={onClose} title={child.label}
                          className={clsx("flex items-center justify-center w-8 h-8 rounded-lg mx-auto transition-colors",
                            isActive ? "bg-blue-600/20 text-blue-400" : "text-slate-500 hover:text-slate-100 hover:bg-slate-800")}
                        >
                          <child.icon size={14} />
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
        <div className="border-t border-slate-800 p-1 space-y-1 shrink-0">
          <button onClick={openWhatsNew} title="What's New"
            className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Sparkles size={15} />
          </button>
          <Link href="/settings" onClick={onClose} title="Settings"
            className={clsx("flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors",
              pathname === "/settings" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800")}>
            <Settings size={15} />
          </Link>
          <button onClick={toggleSidebarNarrow} title="Expand sidebar"
            className="flex items-center justify-center w-10 h-10 rounded-lg mx-auto text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <PanelLeftOpen size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">UB</span>
        </div>
        <span className="text-slate-100 font-semibold text-sm flex-1">Udin's Board</span>
        <button
          onClick={toggleSidebarNarrow}
          title="Collapse sidebar"
          className="hidden lg:flex p-1 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <PanelLeftClose size={15} />
        </button>
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
