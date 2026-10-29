"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Full-screen "Loading…" cover while a page is loading, so nothing else can be
// clicked in the meantime (Faizuddin, 2026-10-21). Shown:
//   1. before the app shell has started (AppShell renders <LoadingOverlay />), and
//   2. from the click on an internal link until the new page's path is live.
// In-page data loading (a table fetching, a run in progress) keeps its own
// spinners — this only covers moving between pages.

/** Safety net: a navigation that never lands (cancelled, offline) unblocks the page. */
const MAX_BLOCK_MS = 20_000;

// Last known mouse position, so the cat appears where the mouse already is.
let lastPointer = { x: -100, y: -100 };
if (typeof window !== "undefined") {
  window.addEventListener("pointermove", e => { lastPointer = { x: e.clientX, y: e.clientY }; }, { passive: true, capture: true });
}

/**
 * The cursor while loading: the pixel cat, twirling (Faizuddin, 2026-10-21).
 * Browsers only accept still images as a CSS cursor, so the real cursor is
 * hidden on the cover and the cat is drawn at the mouse position instead —
 * moved directly on the element (no re-render per mouse move).
 */
function TwirlingCat() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX - 16}px, ${e.clientY - 16}px)`;
    };
    // Jump to the last known mouse position once mounted. Rendering it directly
    // made the server HTML (no mouse, -100) differ from the browser's first
    // render — a hydration-mismatch warning on every page load (2026-10-22).
    if (ref.current) ref.current.style.transform = `translate(${lastPointer.x - 16}px, ${lastPointer.y - 16}px)`;
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 h-8 w-8"
      style={{ transform: "translate(-116px, -116px)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a 32px decorative SVG, no optimisation needed */}
      <img src="/cursors/pixel-cat.svg" alt="" width={32} height={32} className="animate-[spin_1.2s_linear_infinite]" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}

export function LoadingOverlay({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px]"
      style={{ cursor: "none" }}
    >
      <TwirlingCat />
      <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 shadow-2xl">
        <Loader2 size={18} className="animate-spin text-indigo-400" />
        <span className="text-sm text-slate-200">{label}</span>
      </div>
    </div>
  );
}

export default function NavigationLoader() {
  const pathname = usePathname();
  // The path being opened. The cover shows while it differs from the live path,
  // so it clears itself the moment the new page is in place.
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let url: URL;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      // Same page (only the #hash or ?query changes): nothing to wait for.
      if (url.pathname === window.location.pathname) return;
      // Files served from public/ (evidence, downloads) are not pages.
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname) || url.pathname.startsWith("/api/") || url.pathname.startsWith("/qa-artifacts/")) return;
      setTarget(url.pathname);
      clearTimeout(timer);
      timer = setTimeout(() => setTarget(null), MAX_BLOCK_MS);
    }
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); clearTimeout(timer); };
  }, []);

  const pending = target !== null && target !== pathname;
  return pending ? <LoadingOverlay /> : null;
}
