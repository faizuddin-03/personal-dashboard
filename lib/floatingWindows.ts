/**
 * Floating window layout — which in-page windows are open, where they sit,
 * and their z-order. Persisted to localStorage so it survives client
 * navigation (AppShell never unmounts) and a full reload.
 *
 * Rendered by components/floating/FloatingLayer.tsx.
 */

export type FloatingWinId = "notes" | "todo" | "timer" | "scratch";

export const FLOATING_WIN_IDS: FloatingWinId[] = ["notes", "todo", "timer", "scratch"];

export interface WinGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WinState extends WinGeom {
  open: boolean;
  minimised: boolean;
  maximised: boolean;
}

export interface FloatingLayout {
  wins: Record<FloatingWinId, WinState>;
  /** Back-to-front. The last id is the window on top. */
  order: FloatingWinId[];
  dockExpanded: boolean;
}

const KEY = "floating_layout_v1";

export const MIN_W = 260;
export const MIN_H = 180;
/** Gap kept between a window and the viewport edge. */
export const EDGE = 8;
/** Space left at the bottom of a maximised window so the dock stays usable. */
export const DOCK_CLEARANCE = 64;

const DEFAULT_SIZE: Record<FloatingWinId, { w: number; h: number }> = {
  notes:   { w: 420, h: 480 },
  todo:    { w: 380, h: 460 },
  timer:   { w: 300, h: 430 },
  scratch: { w: 380, h: 320 },
};

function defaultWin(id: FloatingWinId, index: number): WinState {
  const { w, h } = DEFAULT_SIZE[id];
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  // Tile leftwards from the bottom-right, near the dock, so first-time
  // windows sit side by side instead of stacking, and stay clear of the
  // page's own header controls. Narrow viewports fall back to a cascade.
  const before = FLOATING_WIN_IDS.slice(0, index).reduce((sum, k) => sum + DEFAULT_SIZE[k].w + 12, 0);
  const tiled = vw - 24 - before - w;
  const x = tiled >= EDGE ? tiled : vw - w - 24 - index * 28;
  const y = vh - h - 72 - (tiled >= EDGE ? 0 : index * 28);
  return clampGeom({ open: false, minimised: false, maximised: false, x, y, w, h }) as WinState;
}

export function defaultLayout(): FloatingLayout {
  const wins = {} as Record<FloatingWinId, WinState>;
  FLOATING_WIN_IDS.forEach((id, i) => { wins[id] = defaultWin(id, i); });
  return { wins, order: [...FLOATING_WIN_IDS], dockExpanded: false };
}

/** Keep a window fully inside the viewport, shrinking it first if it can't fit. */
export function clampGeom<T extends WinGeom>(g: T): T {
  if (typeof window === "undefined") return g;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(Math.min(g.w, vw - EDGE * 2), Math.min(MIN_W, vw - EDGE * 2));
  const h = Math.max(Math.min(g.h, vh - EDGE * 2), Math.min(MIN_H, vh - EDGE * 2));
  const x = Math.min(Math.max(g.x, EDGE), Math.max(EDGE, vw - w - EDGE));
  const y = Math.min(Math.max(g.y, EDGE), Math.max(EDGE, vh - h - EDGE));
  return { ...g, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function loadLayout(): FloatingLayout {
  const base = defaultLayout();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<FloatingLayout>;
    for (const id of FLOATING_WIN_IDS) {
      const s = parsed.wins?.[id] as Partial<WinState> | undefined;
      if (!s) continue;
      base.wins[id] = clampGeom({
        open: !!s.open,
        minimised: !!s.minimised,
        maximised: !!s.maximised,
        x: isNum(s.x) ? s.x : base.wins[id].x,
        y: isNum(s.y) ? s.y : base.wins[id].y,
        w: isNum(s.w) ? s.w : base.wins[id].w,
        h: isNum(s.h) ? s.h : base.wins[id].h,
      });
    }
    if (Array.isArray(parsed.order)) {
      const known = parsed.order.filter((id): id is FloatingWinId => FLOATING_WIN_IDS.includes(id as FloatingWinId));
      base.order = [...FLOATING_WIN_IDS.filter(id => !known.includes(id)), ...known];
    }
    base.dockExpanded = !!parsed.dockExpanded;
  } catch { /* corrupt or blocked storage — use defaults */ }
  return base;
}

export function saveLayout(layout: FloatingLayout): void {
  try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch { /* storage full or blocked */ }
}

// ── Scratchpad ────────────────────────────────────────────────

const SCRATCH_KEY = "floating_scratchpad_v1";

export function loadScratch(): string {
  try { return localStorage.getItem(SCRATCH_KEY) ?? ""; } catch { return ""; }
}

export function saveScratch(text: string): void {
  try { localStorage.setItem(SCRATCH_KEY, text); } catch { /* ignore */ }
}
