"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";

// Universal Back / Forward. Faizuddin, 2026-10-22: "make a universal back
// button, which will go back to previous pages. also a forward button".
// Uses the browser's own history (router.back / router.forward), so it matches
// the browser arrows and Alt+Left / Alt+Right. Chrome's Navigation API says
// whether there is anywhere to go; where it is missing, both stay enabled.

interface NavApi { canGoBack?: boolean; canGoForward?: boolean }

export default function HistoryButtons({ size = 14, className }: { size?: number; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [can, setCan] = useState({ back: true, forward: true });

  useEffect(() => {
    const nav = (window as unknown as { navigation?: NavApi }).navigation;
    if (!nav || typeof nav.canGoBack !== "boolean") return;
    // Read after the route change has settled into history; popstate covers
    // back/forward and query-only changes that keep the same pathname.
    const read = () => setCan({ back: !!nav.canGoBack, forward: !!nav.canGoForward });
    const t = setTimeout(read, 50);
    window.addEventListener("popstate", read);
    return () => { clearTimeout(t); window.removeEventListener("popstate", read); };
  }, [pathname]);

  const btn = (enabled: boolean) => clsx(
    "flex items-center justify-center rounded-lg p-1.5 transition-colors",
    enabled ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "cursor-default text-slate-700",
  );

  return (
    <div className={clsx("flex items-center gap-0.5", className)}>
      <button type="button" onClick={() => can.back && router.back()} disabled={!can.back} className={btn(can.back)} title="Back (Alt+←)" aria-label="Back">
        <ArrowLeft size={size} />
      </button>
      <button type="button" onClick={() => can.forward && router.forward()} disabled={!can.forward} className={btn(can.forward)} title="Forward (Alt+→)" aria-label="Forward">
        <ArrowRight size={size} />
      </button>
    </div>
  );
}
