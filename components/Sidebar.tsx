"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import {
  LayoutDashboard, ChevronDown, Shield, Car,
  Settings, Download, Upload, LogOut, Kanban,
} from "lucide-react";
import { exportLocalStorage, importLocalStorage } from "@/lib/jira";
import clsx from "clsx";

interface Props {
  onLogout: () => void;
  isConnected: boolean;
}

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Kanban",    href: "/kanban", icon: Kanban },
  {
    label: "eAuto",
    icon: Car,
    children: [
      { label: "Insurance", href: "/eauto/insurance", icon: Shield },
    ],
  },
];

export default function Sidebar({ onLogout, isConnected }: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(["eAuto"]);
  const [importMsg, setImportMsg] = useState("");
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
        <span className="text-slate-100 font-semibold text-sm">QA Dashboard</span>
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

      {/* Bottom actions */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        {importMsg && <p className="text-xs text-center text-blue-400 pb-1">{importMsg}</p>}

        {/* Export / Import */}
        <div className="flex gap-1">
          <button onClick={exportLocalStorage} title="Export all data" className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
            <Download size={13} />Export
          </button>
          <button onClick={() => importRef.current?.click()} title="Import data" className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors">
            <Upload size={13} />Import
          </button>
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        {/* Settings link */}
        <Link
          href="/settings"
          className={clsx(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors",
            pathname === "/settings" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          )}
        >
          <Settings size={15} />
          Settings
        </Link>

        {isConnected && (
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={15} />
            Disconnect Jira
          </button>
        )}
      </div>
    </aside>
  );
}
