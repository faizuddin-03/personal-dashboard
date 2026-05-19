"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import {
  LayoutDashboard, ChevronDown, Shield, Car,
  Settings, Download, Upload, Kanban,
  CheckSquare, FileText, Search, X, CalendarDays,
} from "lucide-react";
import { exportLocalStorage, importLocalStorage } from "@/lib/jira";
import clsx from "clsx";

const nav = [
  { label: "Dashboard", href: "/",          icon: LayoutDashboard },
  { label: "Kanban",    href: "/kanban",    icon: Kanban },
  { label: "Calendar",  href: "/calendar",  icon: CalendarDays },
  { label: "To-Do",     href: "/todo",      icon: CheckSquare },
  { label: "Notes",     href: "/notes",     icon: FileText },
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
  const [expanded, setExpanded]   = useState<string[]>(["eAuto"]);
  const [importMsg, setImportMsg] = useState("");
  const [confirmImport, setConfirmImport] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function toggleGroup(label: string) {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importLocalStorage(file);
      setImportMsg("Imported! Reload the page.");
      setTimeout(() => setImportMsg(""), 4000);
    } catch {
      setImportMsg("Invalid file.");
      setTimeout(() => setImportMsg(""), 3000);
    }
    e.target.value = "";
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">QA</span>
        </div>
        <span className="text-slate-100 font-semibold text-sm flex-1">QA Dashboard</span>
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
          const hasActive = item.children?.some(c => pathname === c.href) ?? false;

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
        {importMsg && <p className="text-xs text-center text-blue-400 pb-1">{importMsg}</p>}
        <div className="flex gap-1">
          <button onClick={exportLocalStorage} title="Export all data" aria-label="Export all data" className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
            <Download size={13} />Export
          </button>
          {confirmImport ? (
            <div className="w-full mt-1 p-2 bg-red-950/40 border border-red-800/50 rounded-lg space-y-2">
              <p className="text-[10px] text-red-300">This will overwrite all current data. Are you sure?</p>
              <div className="flex gap-1">
                <button onClick={() => setConfirmImport(false)} className="flex-1 text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-1 hover:bg-slate-800">Cancel</button>
                <button onClick={() => { setConfirmImport(false); importRef.current?.click(); }} className="flex-1 text-[10px] text-white bg-red-700 rounded px-2 py-1 hover:bg-red-600">Yes, import</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmImport(true)} title="Import data" aria-label="Import data" className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
              <Upload size={13} />Import
            </button>
          )}
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
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
