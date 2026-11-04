"use client";
// Snip editor (Faizuddin, 2026-10-30): paste an image from the clipboard, mark
// it up with boxes, arrows, highlights and text, then copy it back to the
// clipboard or save it as a PNG. Everything stays in the browser; nothing is saved.
// Used by the /snip page and by the dock's floating window. The page takes
// Ctrl+V and shortcuts anywhere on the page; the window only while it has focus,
// so it never grabs keys on other pages.
import { useCallback, useEffect, useRef, useState } from "react";
import { Square, MoveUpRight, Highlighter, Type, MousePointer2, Undo2, Redo2, Trash2, Copy, Check, Download, ClipboardPaste, ImagePlus, X } from "lucide-react";
import clsx from "clsx";

type Tool = "select" | "box" | "arrow" | "highlight" | "text";
interface Shape {
  id: string;
  type: Exclude<Tool, "select">;
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  width: number;   // stroke width (box/arrow) or font size (text)
  text?: string;
}

const COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Green", hex: "#22c55e" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#ffffff" },
];
const SIZES = [{ label: "S", stroke: 2, font: 16 }, { label: "M", stroke: 4, font: 24 }, { label: "L", stroke: 7, font: 36 }];
const TOOLS: { id: Tool; label: string; key: string; icon: typeof Square }[] = [
  { id: "select", label: "Select / move", key: "V", icon: MousePointer2 },
  { id: "box", label: "Box", key: "B", icon: Square },
  { id: "arrow", label: "Arrow", key: "A", icon: MoveUpRight },
  { id: "highlight", label: "Highlight", key: "H", icon: Highlighter },
  { id: "text", label: "Text", key: "T", icon: Type },
];
const FONT = (size: number) => `600 ${size}px ui-sans-serif, system-ui, sans-serif`;

const norm = (s: Shape) => ({ x: Math.min(s.x1, s.x2), y: Math.min(s.y1, s.y2), w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) });

function textBox(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.font = FONT(s.width);
  const lines = (s.text ?? "").split("\n");
  const w = Math.max(...lines.map(l => ctx.measureText(l).width));
  return { x: s.x1, y: s.y1, w, h: lines.length * s.width * 1.25 };
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (s.type === "box") {
    const r = norm(s);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  } else if (s.type === "highlight") {
    const r = norm(s);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (s.type === "arrow") {
    const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const head = Math.max(12, s.width * 4);
    // Stop the line short of the tip so the round cap does not poke through the head.
    const ex = s.x2 - Math.cos(ang) * head * 0.6, ey = s.y2 - Math.sin(ang) * head * 0.6;
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s.x2, s.y2);
    ctx.lineTo(s.x2 - head * Math.cos(ang - Math.PI / 7), s.y2 - head * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(s.x2 - head * Math.cos(ang + Math.PI / 7), s.y2 - head * Math.sin(ang + Math.PI / 7));
    ctx.closePath(); ctx.fill();
  } else if (s.type === "text") {
    ctx.font = FONT(s.width);
    ctx.textBaseline = "top";
    // Thin contrasting outline so text reads on any background.
    ctx.lineWidth = Math.max(2, s.width / 6);
    ctx.strokeStyle = s.color === "#ffffff" || s.color === "#facc15" ? "#111827" : "#ffffff";
    (s.text ?? "").split("\n").forEach((line, i) => {
      ctx.strokeText(line, s.x1, s.y1 + i * s.width * 1.25);
      ctx.fillText(line, s.x1, s.y1 + i * s.width * 1.25);
    });
  }
  ctx.restore();
}

function bounds(ctx: CanvasRenderingContext2D, s: Shape) {
  return s.type === "text" ? textBox(ctx, s) : norm(s);
}

/** True when a page-level listener sees an event from inside the floating editor. */
function fromWindowEditor(e: Event, compact: boolean) {
  return !compact && !!(e.target as Element | null)?.closest?.("[data-snip-window]");
}

function distToSegment(px: number, py: number, s: Shape) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / len));
  return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
}

function hit(ctx: CanvasRenderingContext2D, s: Shape, x: number, y: number, slack: number) {
  if (s.type === "arrow") return distToSegment(x, y, s) <= slack + s.width;
  const b = bounds(ctx, s);
  const inside = x >= b.x - slack && x <= b.x + b.w + slack && y >= b.y - slack && y <= b.y + b.h + slack;
  if (!inside) return false;
  if (s.type !== "box") return true;
  // A box is picked by its edge, so shapes drawn inside it stay reachable.
  const edge = slack + s.width;
  return x <= b.x + edge || x >= b.x + b.w - edge || y <= b.y + edge || y >= b.y + b.h - edge;
}

export default function SnipEditor({ variant = "page" }: { variant?: "page" | "window" }) {
  const compact = variant === "window";
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [past, setPast] = useState<Shape[][]>([]);
  const [future, setFuture] = useState<Shape[][]>([]);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState(COLORS[0].hex);
  const [size, setSize] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Shape | null>(null);
  // x/y in image pixels; left/top/font in screen pixels for the text box overlay.
  const [editing, setEditing] = useState<{ x: number; y: number; value: string; id?: string; left: number; top: number; font: number; color: string } | null>(null);
  const textDone = useRef(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const drag = useRef<{ mode: "draw" | "move"; sx: number; sy: number; orig?: Shape; moved?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Records the current shapes for undo, then applies the change. */
  const commit = useCallback((next: Shape[]) => {
    setPast(p => [...p.slice(-99), shapes]);
    setFuture([]);
    setShapes(next);
  }, [shapes]);

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture(f => [shapes, ...f]);
    setShapes(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
    setSelected(null);
  }, [past, shapes]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast(p => [...p, shapes]);
    setShapes(future[0]);
    setFuture(f => f.slice(1));
    setSelected(null);
  }, [future, shapes]);

  const loadBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const el = new Image();
    el.onload = () => {
      setImg(el); setShapes([]); setPast([]); setFuture([]); setSelected(null); setEditing(null); setMessage("");
    };
    el.onerror = () => setMessage("That file is not an image this browser can open.");
    el.src = url;
  }, []);

  // Draws the image and shapes. withSelection = false for the copy / PNG output.
  const render = useCallback((canvas: HTMLCanvasElement, withSelection: boolean) => {
    const ctx = canvas.getContext("2d");
    if (!ctx || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    for (const s of shapes) if (!(editing?.id === s.id)) drawShape(ctx, s);
    if (draft) drawShape(ctx, draft);
    if (withSelection && selected) {
      const s = shapes.find(x => x.id === selected);
      if (s) {
        const b = s.type === "arrow" ? norm(s) : bounds(ctx, s);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#38bdf8";
        ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
        ctx.restore();
      }
    }
  }, [img, shapes, draft, selected, editing]);

  useEffect(() => { if (canvasRef.current) render(canvasRef.current, true); }, [render]);

  const outputBlob = useCallback(() => new Promise<Blob | null>(resolve => {
    const c = document.createElement("canvas");
    render(c, false);
    c.toBlob(resolve, "image/png");
  }), [render]);

  const copyImage = useCallback(async () => {
    const blob = await outputBlob();
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Copy was blocked by the browser. Use Save PNG instead.");
    }
  }, [outputBlob]);

  const savePng = useCallback(async () => {
    const blob = await outputBlob();
    if (!blob) return;
    const a = document.createElement("a");
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    a.download = `snip-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
    a.href = URL.createObjectURL(blob);
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, [outputBlob]);

  const pasteFromButton = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith("image/"));
        if (type) { loadBlob(await item.getType(type)); return; }
      }
      setMessage("There is no image on the clipboard.");
    } catch {
      setMessage("The browser blocked clipboard reading. Press Ctrl+V on this page instead.");
    }
  }, [loadBlob]);

  // Ctrl+V. The page ignores events from inside the floating editor, which handles its own.
  useEffect(() => {
    const target: HTMLElement | Window | null = compact ? rootRef.current : window;
    if (!target) return;
    const onPaste = (ev: Event) => {
      const e = ev as ClipboardEvent;
      if (editing || fromWindowEditor(e, compact)) return;
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
      const blob = item?.getAsFile();
      if (blob) { e.preventDefault(); loadBlob(blob); }
    };
    target.addEventListener("paste", onPaste);
    return () => target.removeEventListener("paste", onPaste);
  }, [loadBlob, editing, compact]);

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    commit(shapes.filter(s => s.id !== selected));
    setSelected(null);
  }, [selected, shapes, commit]);

  // Keyboard: tools, undo/redo, delete, copy.
  useEffect(() => {
    const target: HTMLElement | Window | null = compact ? rootRef.current : window;
    if (!target) return;
    const onKey = (ev: Event) => {
      const e = ev as KeyboardEvent;
      const el = e.target as HTMLElement;
      if (e.altKey || fromWindowEditor(e, compact)) return; // Alt+letter belongs to the dock
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
        else if (k === "c" && img && !window.getSelection()?.toString()) { e.preventDefault(); void copyImage(); }
        else if (k === "s" && img) { e.preventDefault(); void savePng(); }
        return;
      }
      if ((k === "delete" || k === "backspace") && selected) { e.preventDefault(); deleteSelected(); return; }
      if (k === "escape") { setSelected(null); return; }
      const t = TOOLS.find(x => x.key.toLowerCase() === k);
      if (t) { setTool(t.id); setSelected(null); }
    };
    target.addEventListener("keydown", onKey);
    return () => target.removeEventListener("keydown", onKey);
  }, [undo, redo, copyImage, savePng, deleteSelected, selected, img, compact]);

  // Colour / size buttons also restyle the selected shape.
  const scaleFor = () => Math.max(1, (canvasRef.current?.width ?? 0) / 1600);
  const pickColor = (hex: string) => {
    setColor(hex);
    if (selected) commit(shapes.map(s => s.id === selected ? { ...s, color: hex } : s));
  };
  const pickSize = (i: number) => {
    setSize(i);
    if (selected) commit(shapes.map(s => s.id === selected ? { ...s, width: Math.round((s.type === "text" ? SIZES[i].font : SIZES[i].stroke) * scaleFor()) } : s));
  };

  /** Pointer position in image pixels. */
  const point = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height), scale: c.width / r.width };
  };

  /** Opens the text box at image point (x, y); shape = existing text being edited. */
  const startText = (x: number, y: number, shape?: Shape) => {
    const c = canvasRef.current!;
    const k = c.getBoundingClientRect().width / c.width;
    const font = shape?.width ?? Math.round(SIZES[size].font * scaleFor());
    textDone.current = false;
    setEditing({ x, y, value: shape?.text ?? "", id: shape?.id, left: x * k, top: y * k, font: Math.max(12, font * k), color: shape?.color ?? color });
  };

  // Enter and the blur that follows both land here; only the first one counts.
  const finishText = useCallback(() => {
    if (!editing || textDone.current) return;
    textDone.current = true;
    const value = editing.value.replace(/\s+$/, "");
    if (editing.id) {
      commit(value ? shapes.map(s => s.id === editing.id ? { ...s, text: value } : s) : shapes.filter(s => s.id !== editing.id));
    } else if (value) {
      commit([...shapes, { id: crypto.randomUUID(), type: "text", x1: editing.x, y1: editing.y, x2: editing.x, y2: editing.y, color, width: Math.round(SIZES[size].font * scaleFor()), text: value }]);
    }
    setEditing(null);
  }, [editing, shapes, commit, size, color]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img || e.button !== 0) return;
    if (editing) return; // the text box blur places the text
    const p = point(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    if (tool === "select") {
      const found = [...shapes].reverse().find(s => hit(ctx, s, p.x, p.y, 6 * p.scale));
      setSelected(found?.id ?? null);
      if (found) {
        drag.current = { mode: "move", sx: p.x, sy: p.y, orig: found };
        (e.target as Element).setPointerCapture(e.pointerId);
      }
      return;
    }
    if (tool === "text") {
      startText(p.x, p.y);
      return;
    }
    // Stroke follows the image size so marks stay visible on large screenshots.
    setSelected(null);
    drag.current = { mode: "draw", sx: p.x, sy: p.y };
    setDraft({ id: crypto.randomUUID(), type: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, width: SIZES[size].stroke * scaleFor() });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = point(e);
    if (d.mode === "draw") {
      setDraft(s => s && { ...s, x2: p.x, y2: p.y });
    } else if (d.orig) {
      const dx = p.x - d.sx, dy = p.y - d.sy;
      if (!d.moved) { setPast(h => [...h.slice(-99), shapes]); setFuture([]); d.moved = true; }
      const o = d.orig;
      setShapes(list => list.map(s => s.id === o.id ? { ...s, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy } : s));
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.mode === "draw" && draft) {
      const tiny = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) < 4;
      if (!tiny) { commit([...shapes, draft]); setSelected(null); }
      setDraft(null);
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!img) return;
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) * (c.width / r.width), y = (e.clientY - r.top) * (c.height / r.height);
    const ctx = c.getContext("2d")!;
    const t = [...shapes].reverse().find(s => s.type === "text" && hit(ctx, s, x, y, 4));
    if (t) { startText(t.x1, t.y1, t); setSelected(null); }
  };

  const btn = clsx("inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed",
    compact ? "px-2 py-1" : "px-3 py-1.5");
  const sq = compact ? "h-7 w-7" : "h-8 w-8";
  const sep = <div className="h-6 w-px bg-slate-800" />;

  // Paste / Open / Copy / Save. Labels hidden in the window to save room.
  const actions = (
    <div className="flex items-center gap-1.5 shrink-0">
      <button type="button" className={btn} title="Paste image (Ctrl+V)" onClick={pasteFromButton}><ClipboardPaste size={14} aria-hidden />{!compact && " Paste"}</button>
      <button type="button" className={btn} title="Open image file" onClick={() => fileRef.current?.click()}><ImagePlus size={14} aria-hidden />{!compact && " Open"}</button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadBlob(f); e.target.value = ""; }} />
      <button type="button" className={clsx(btn, "border-blue-500/50 bg-blue-600/20 text-blue-100 hover:bg-blue-600/30")} title="Copy image (Ctrl+C)" disabled={!img} onClick={copyImage}>
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {copied ? "Copied" : "Copy"}
      </button>
      <button type="button" className={btn} title="Save PNG (Ctrl+S)" disabled={!img} onClick={savePng}><Download size={14} aria-hidden />{!compact && " Save PNG"}</button>
    </div>
  );

  return (
    <div ref={rootRef} className={clsx("flex flex-col", compact ? "h-full outline-none" : "min-h-full")}
      {...(compact ? { tabIndex: -1, "data-snip-window": "" } : {})}>
      {!compact && (
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-200">Snip Editor</h1>
            <p className="text-xs text-slate-500 italic font-normal hidden sm:block">Paste an image, mark it up, copy or save it</p>
          </div>
          {actions}
        </header>
      )}

      {/* Toolbar */}
      <div className={clsx("border-b border-slate-800 flex flex-wrap items-center", compact ? "px-2 py-1.5 gap-2" : "px-4 sm:px-6 py-2 gap-3")}>
        <div className="flex items-center gap-1">
          {TOOLS.map(t => (
            <button key={t.id} type="button" title={`${t.label} (${t.key})`} aria-label={t.label} aria-pressed={tool === t.id}
              onClick={() => { setTool(t.id); setSelected(null); }}
              className={clsx(sq, "inline-flex items-center justify-center rounded-md border",
                tool === t.id ? "border-blue-500 bg-blue-600/25 text-blue-100" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800")}>
              <t.icon size={15} aria-hidden />
            </button>
          ))}
        </div>
        {sep}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button key={c.hex} type="button" title={c.name} aria-label={c.name} aria-pressed={color === c.hex} onClick={() => pickColor(c.hex)}
              className={clsx(compact ? "h-5 w-5" : "h-6 w-6", "rounded-full border-2", color === c.hex ? "border-sky-300 ring-2 ring-sky-400/40" : "border-slate-600")}
              style={{ background: c.hex }} />
          ))}
        </div>
        {sep}
        <div className="flex items-center gap-1">
          {SIZES.map((s, i) => (
            <button key={s.label} type="button" title={`Size ${s.label}`} aria-pressed={size === i} onClick={() => pickSize(i)}
              className={clsx(sq, "rounded-md border text-xs font-semibold",
                size === i ? "border-blue-500 bg-blue-600/25 text-blue-100" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800")}>
              {s.label}
            </button>
          ))}
        </div>
        {sep}
        <div className="flex items-center gap-1">
          <button type="button" className={btn} title="Undo (Ctrl+Z)" disabled={!past.length} onClick={undo}><Undo2 size={14} aria-hidden /></button>
          <button type="button" className={btn} title="Redo (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 size={14} aria-hidden /></button>
          <button type="button" className={btn} title="Delete selected (Del)" disabled={!selected} onClick={deleteSelected}><X size={14} aria-hidden /></button>
          <button type="button" className={btn} title="Remove all marks" disabled={!shapes.length} onClick={() => { commit([]); setSelected(null); }}><Trash2 size={14} aria-hidden /></button>
        </div>
        {compact ? <>{sep}{actions}</> : (
          <p className="text-xs text-slate-500 ml-auto hidden lg:block">Ctrl+V paste · Ctrl+C copy · Ctrl+S save · double-click text to edit</p>
        )}
      </div>

      {message && (
        <div className={clsx("rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 flex items-center justify-between gap-2", compact ? "mx-2 mt-2" : "mx-4 sm:mx-6 mt-3")}>
          {message}
          <button type="button" aria-label="Dismiss" onClick={() => setMessage("")}><X size={14} aria-hidden /></button>
        </div>
      )}

      <div className={clsx("flex-1 overflow-auto", compact ? "min-h-0 p-2" : "p-4 sm:p-6")}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadBlob(f); }}>
        {img ? (
          <div className="relative inline-block max-w-full">
            <canvas ref={canvasRef}
              className={clsx("block max-w-full h-auto rounded border border-slate-800 shadow-lg touch-none",
                tool === "select" ? "cursor-default" : tool === "text" ? "cursor-text" : "cursor-crosshair")}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              onDoubleClick={onDoubleClick} />
            {editing && (
              <textarea autoFocus value={editing.value} rows={Math.max(1, editing.value.split("\n").length)}
                onChange={e => setEditing({ ...editing, value: e.target.value })}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); finishText(); }
                  if (e.key === "Escape") { textDone.current = true; setEditing(null); }
                }}
                onBlur={finishText}
                placeholder="Type, Enter to place"
                className="absolute bg-slate-950/70 border border-sky-400 rounded px-1 outline-none resize-none font-semibold"
                style={{ left: editing.left, top: editing.top, fontSize: editing.font, lineHeight: 1.25, color: editing.color, minWidth: 160 }} />
            )}
          </div>
        ) : (
          <div className={clsx("h-full rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-400 text-center px-4",
            compact ? "min-h-[160px] cursor-pointer" : "min-h-[60vh]")}
            onClick={() => { if (compact) rootRef.current?.focus(); }}>
            <ClipboardPaste size={compact ? 24 : 32} aria-hidden />
            <p className="text-sm">{compact ? "Click here, then press " : "Press "}<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">Ctrl+V</kbd> to paste an image, or drop an image file here.</p>
            <p className="text-xs text-slate-500">Tip: Win+Shift+S takes a screenshot to the clipboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
